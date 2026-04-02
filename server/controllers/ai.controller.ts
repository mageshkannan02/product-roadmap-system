import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType, FunctionCallingMode } from '@google/generative-ai';
import { 
  Task, Feature, User, Roadmap, Milestone, Board, Note, ActivityLog, Notification, 
  sequelize 
} from '../models/index';
import { Op } from 'sequelize';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Define the tools for Gemini with correct SchemaTypes
const tools: any = [
  {
    functionDeclarations: [
      {
        name: "list_entities",
        description: "List all entries for a specific project entity (e.g. roadmaps, tasks, features).",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            entity: { 
              type: SchemaType.STRING, 
              enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"],
              description: "The type of entity to list."
            },
            filters: {
              type: SchemaType.OBJECT,
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
          type: SchemaType.OBJECT,
          properties: {
            entity: { type: SchemaType.STRING, enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
            id: { type: SchemaType.NUMBER }
          },
          required: ["entity", "id"]
        }
      },
      {
        name: "create_entity",
        description: "Create a new entry in the system.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            entity: { type: SchemaType.STRING, enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
            data: { type: SchemaType.OBJECT, description: "The data for the new entry." }
          },
          required: ["entity", "data"]
        }
      },
      {
        name: "update_entity",
        description: "Update an existing entry by ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            entity: { type: SchemaType.STRING, enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
            id: { type: SchemaType.NUMBER },
            data: { type: SchemaType.OBJECT, description: "The updated fields." }
          },
          required: ["entity", "id", "data"]
        }
      },
      {
        name: "delete_entity",
        description: "Delete an entry by ID.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            entity: { type: SchemaType.STRING, enum: ["roadmaps", "features", "tasks", "milestones", "boards", "notes"] },
            id: { type: SchemaType.NUMBER }
          },
          required: ["entity", "id"]
        }
      }
    ]
  }
];

const modelMap: Record<string, any> = {
  roadmaps: Roadmap,
  features: Feature,
  tasks: Task,
  milestones: Milestone,
  boards: Board,
  notes: Note
};

export const chatWithLumina = async (req: Request, res: Response) => {
  const { message } = req.body;
  const userId = (req as any).user?.id;

  if (!process.env.GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'Google API Key not configured.' });
  }

  try {
    const user = await User.findByPk(userId);
    const userRole = user?.role || 'Team Member';
    const now = new Date();

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
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
      tools: tools,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
    });

    const chat = model.startChat();
    
    // Send the user message
    let result = await chat.sendMessage(message);
    let response = result.response;
    
    // Loop to handle potential function calls
    let iteration = 0;
    while (response.functionCalls()?.length && iteration < 5) {
      iteration++;
      const calls = response.functionCalls();
      const toolResponses = [];

      for (const call of calls) {
        const { name, args } = call as any;
        console.log(`Lumina executing tool: ${name}`, args);

        try {
          const ModelClass = modelMap[args.entity as string];
          if (!ModelClass) throw new Error(`Invalid entity: ${args.entity}`);

          let data;
          switch (name) {
            case 'list_entities':
              // Use raw: true to avoid circular dependencies in results
              const where = { ...args.filters };
              if (where.feature_id) where.feature_id = Number(where.feature_id);
              if (where.roadmap_id) where.roadmap_id = Number(where.roadmap_id);
              
              const results = await ModelClass.findAll({ where });
              data = results.map((r: any) => r.get({ plain: true }));
              break;
            case 'get_entity_details':
              const details = await ModelClass.findByPk(Number(args.id));
              data = details ? details.get({ plain: true }) : null;
              break;
            case 'create_entity':
              const createData = { ...args.data, created_by: userId };
              if (createData.feature_id) createData.feature_id = Number(createData.feature_id);
              if (createData.roadmap_id) createData.roadmap_id = Number(createData.roadmap_id);
              
              const newEntry = await ModelClass.create(createData);
              data = newEntry.get({ plain: true });
              break;
            case 'update_entity':
              const entry = await ModelClass.findByPk(Number(args.id));
              if (entry) {
                const updateData = { ...args.data };
                await entry.update(updateData);
                data = { success: true, updated: entry.get({ plain: true }) };
              } else {
                data = { error: "Not found" };
              }
              break;
            case 'delete_entity':
              const toDelete = await ModelClass.findByPk(Number(args.id));
              if (toDelete) {
                await toDelete.destroy();
                data = { success: true, deleted_id: args.id };
              } else {
                data = { error: "Not found" };
              }
              break;
          }

          toolResponses.push({
            functionResponse: {
              name: name,
              response: { content: data }
            }
          });

        } catch (err: any) {
          console.error(`Tool execution failed [${name}]:`, err.message);
          toolResponses.push({
            functionResponse: {
              name: name,
              response: { content: { error: err.message } }
            }
          });
        }
      }

      // Send tool results back
      result = await chat.sendMessage(toolResponses);
      response = result.response;
    }

    return res.json({ 
      reply: response.text() || "Lumina completed the action.",
      actionTaken: iteration > 0
    });

  } catch (error: any) {
    console.error('Lumina Chat Error:', error);
    return res.status(500).json({ error: 'Lumina encountered an error.' });
  }
};
