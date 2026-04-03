import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType, FunctionCallingMode } from '@google/generative-ai';
import OpenAI from 'openai';
import { 
  Task, Feature, User, Roadmap, Milestone, Board, Note, ActivityLog, Notification, 
  sequelize 
} from '../models/index';
import { Op } from 'sequelize';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
let openai: OpenAI | null = null;

const modelMap: Record<string, any> = {
  roadmaps: Roadmap,
  features: Feature,
  tasks: Task,
  milestones: Milestone,
  boards: Board,
  notes: Note
};

// --- Common Tool Definitions ---
const toolDefinitions = [
  {
    name: "list_entities",
    description: "List all entries for a specific project entity (e.g. roadmaps, tasks, features).",
    parameters: {
      type: "object",
      properties: {
        entity: { 
          type: "string", 
          enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"],
          description: "The type of entity to list."
        },
        filters: {
          type: "object",
          description: "Optional filters (e.g. { status: 'To Do' })."
        }
      },
      required: ["entity"]
    }
  },
  {
    name: "get_entity_details",
    description: "Get detailed information about a specific entry by ID.",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
        id: { type: "number" }
      },
      required: ["entity", "id"]
    }
  },
  {
    name: "create_entity",
    description: "Create a new entry in the system.",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
        data: { type: "object", description: "The data for the new entry." }
      },
      required: ["entity", "data"]
    }
  },
  {
    name: "update_entity",
    description: "Update an existing entry by ID.",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
        id: { type: "number" },
        data: { type: "object", description: "The updated fields." }
      },
      required: ["entity", "id", "data"]
    }
  },
  {
    name: "delete_entity",
    description: "Delete an entry by ID.",
    parameters: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
        id: { type: "number" }
      },
      required: ["entity", "id"]
    }
  }
];

// Map unified definitions to Gemini format
const geminiTools: any = [
  {
    functionDeclarations: toolDefinitions.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties as any).map(([key, value]: [string, any]) => [
            key,
            {
              type: value.type === "string" ? SchemaType.STRING : 
                    value.type === "number" ? SchemaType.NUMBER : 
                    value.type === "object" ? SchemaType.OBJECT : 
                    value.type === "boolean" ? SchemaType.BOOLEAN :
                    value.type === "array" ? SchemaType.ARRAY : value.type,
              description: value.description,
              enum: value.enum
            }
          ])
        ),
        required: tool.parameters.required
      }
    }))
  }
];

// Map unified definitions to OpenAI format
const openaiTools: any = toolDefinitions.map(tool => ({
  type: "function",
  function: tool
}));

// --- Tool Execution Logic ---
const executeTool = async (name: string, args: any, userId: number) => {
  console.log(`Lumina executing tool: ${name}`, args);
  try {
    const entityType = args.entity?.toLowerCase();
    const ModelClass = modelMap[entityType];
    if (!ModelClass) throw new Error(`Invalid entity type: ${args.entity}`);

    let data;
    switch (name) {
      case 'list_entities':
        const where = args.filters ? { ...args.filters } : {};
        // Convert string IDs to numbers if present in filters
        if (where.feature_id) where.feature_id = Number(where.feature_id);
        if (where.roadmap_id) where.roadmap_id = Number(where.roadmap_id);
        
        const results = await ModelClass.findAll({ where });
        data = results.map((r: any) => r.get({ plain: true }));
        break;
      case 'get_entity_details':
        const targetId = Number(args.id);
        if (isNaN(targetId)) throw new Error('Invalid ID provided');
        const details = await ModelClass.findByPk(targetId);
        data = details ? details.get({ plain: true }) : null;
        break;
      case 'create_entity':
        if (!args.data) throw new Error('No data provided for creation');
        const createData = { ...args.data };
        if (userId) createData.created_by = userId;
        
        // Handle specific type conversions
        if (createData.feature_id) createData.feature_id = Number(createData.feature_id);
        if (createData.roadmap_id) createData.roadmap_id = Number(createData.roadmap_id);
        
        const newEntry = await ModelClass.create(createData);
        data = newEntry.get({ plain: true });
        break;
      case 'update_entity':
        const updateId = Number(args.id);
        if (isNaN(updateId)) throw new Error('Invalid ID provided');
        const entry = await ModelClass.findByPk(updateId);
        if (entry) {
          const updateFields = { ...args.data };
          await entry.update(updateFields);
          data = { success: true, updated: entry.get({ plain: true }) };
        } else {
          data = { error: "Not found" };
        }
        break;
      case 'delete_entity':
        const deleteId = Number(args.id);
        if (isNaN(deleteId)) throw new Error('Invalid ID provided');
        const toDelete = await ModelClass.findByPk(deleteId);
        if (toDelete) {
          await toDelete.destroy();
          data = { success: true, deleted_id: deleteId };
        } else {
          data = { error: "Not found" };
        }
        break;
      default:
        throw new Error(`Tool ${name} not implemented`);
    }
    return data;
  } catch (err: any) {
    console.error(`Tool execution failed [${name}]:`, err.message);
    return { error: err.message };
  }
};

// --- Gemini Implementation ---
const geminiChat = async (message: string, userId: number, now: Date) => {
  if (!process.env.GOOGLE_API_KEY) throw new Error('Gemini API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: `
      You are "Lumina", the AI Project Manager.
      Your job is to manage Roadmaps, Features, Tasks, Milestones, Boards, and Notes.
      
      CRITICAL:
      1. ALWAYS use the provided tools to interact with the database.
      2. Never invent command formats like [CREATE_TASK].
      3. For any request about project data, use "list_entities" to see what exists before taking action.
      4. If a user asks to create/update without an ID, list the entities first to find the correct ID.
      5. Output clean Markdown (bold, lists).
      6. Current Date: ${now.toISOString().split('T')[0]}
    `,
    tools: geminiTools,
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  });

  const chat = model.startChat();
  let result = await chat.sendMessage(message);
  let response = result.response;
  
  let iteration = 0;
  while (response.functionCalls()?.length && iteration < 5) {
    iteration++;
    const calls = response.functionCalls();
    const toolResponses = [];

    for (const call of calls) {
      const { name, args } = call as any;
      const data = await executeTool(name, args, userId);
      toolResponses.push({ functionResponse: { name, response: { content: data } } });
    }
    result = await chat.sendMessage(toolResponses);
    response = result.response;
  }

  try {
    return { reply: response.text(), iterations: iteration };
  } catch (e) {
    // Fallback if text() throws
    const candidates = (response as any).candidates;
    const firstText = candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
    return { reply: firstText || "I've completed the requested action.", iterations: iteration };
  }
};

// --- OpenAI Implementation ---
const openAIChat = async (message: string, userId: number, now: Date) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
    throw new Error('OpenAI API Key not configured in .env');
  }

  // Lazy initialization
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  const systemPrompt = `
    You are "Lumina", the AI Project Manager.
    Your job is to manage Roadmaps, Features, Tasks, Milestones, Boards, and Notes.
    
    CRITICAL:
    1. ALWAYS use the provided tools to interact with the database.
    2. Never invent command formats like [CREATE_TASK].
    3. For any request about project data, use "list_entities" to see what exists before taking action.
    4. If a user asks to create/update without an ID, list the entities first to find the correct ID.
    5. Output clean Markdown (bold, lists).
    6. Current Date: ${now.toISOString().split('T')[0]}
  `;

  let messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message }
  ];

  let iteration = 0;
  let finalReply = "";

  while (iteration < 5) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: openaiTools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);

    if (responseMessage.tool_calls) {
      iteration++;
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          const data = await executeTool(functionName, functionArgs, userId);
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(data),
          });
        }
      }
    } else {
      finalReply = responseMessage.content || "";
      break;
    }
  }

  return { reply: finalReply, iterations: iteration };
};

export const chatWithLumina = async (req: Request, res: Response) => {
  const { message } = req.body;
  const userId = (req as any).user?.id || 1; // Fallback to 1 if no auth
  const now = new Date();

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    console.log('Attempting Gemini chat...');
    const result = await geminiChat(message, userId, now);
    return res.json({ 
      reply: result.reply,
      actionTaken: result.iterations > 0,
      provider: 'gemini'
    });
  } catch (geminiError: any) {
    console.error('Gemini failed:', geminiError.message);
    
    try {
      console.log('Falling back to OpenAI...');
      const result = await openAIChat(message, userId, now);
      return res.json({ 
        reply: result.reply,
        actionTaken: result.iterations > 0,
        provider: 'openai'
      });
    } catch (openAIError: any) {
      console.error('OpenAI failed:', openAIError.message);
      
      // If both fail, return a combined error info
      const isQuotaError = geminiError.message?.includes('429') || geminiError.message?.includes('quota');
      const errorMessage = isQuotaError 
        ? "Gemini quota reached and OpenAI fallback is not configured or failed."
        : `Lumina is unavailable. (Gemini: ${geminiError.message})`;

      return res.status(503).json({ 
        error: errorMessage,
        details: { gemini: geminiError.message, openai: openAIError.message }
      });
    }
  }
};
