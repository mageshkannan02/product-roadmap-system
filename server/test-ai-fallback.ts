import dotenv from 'dotenv';
dotenv.config();

import { chatWithLumina } from './controllers/ai.controller.js';
import { Request, Response } from 'express';

// Mock request and response
const req = {
  body: { message: "List all roadmaps" },
  user: { id: 1 }
} as any;

const res = {
  json: (data: any) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
  status: (code: number) => ({
    json: (data: any) => console.log(`Response Status ${code}:`, JSON.stringify(data, null, 2))
  })
} as any;

async function runTest() {
  console.log('--- Testing AI Fallback ---');
  
  // Test case: Both keys missing or invalid
  try {
    await chatWithLumina(req, res);
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTest();
