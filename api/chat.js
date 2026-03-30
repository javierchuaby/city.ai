/**
 * api/chat.js
 * Vercel Serverless Function entry point for the AI orchestration backend.
 * Acts as the 'Composition Root' for the chat service ecosystem.
 */

import { ChatService } from "./_lib/services/chatService.js";
import { IntelService } from "./_lib/services/intelService.js";
import { GeminiService } from "./_lib/services/geminiService.js";
import { IntelRepository } from "./_lib/repositories/intelRepository.js";
import { ai } from "./_lib/clients/gemini.js";
import { supabase } from "./_lib/clients/supabase.js";
import { chatRequestSchema } from "./_lib/utils/schema.js";
import { RESPONSE_TYPES } from "../src/shared/lib/constants.js";

// Composition Root: Wire up the entire dependency tree.
const intelRepo = new IntelRepository(supabase);
const intelService = new IntelService(intelRepo, ai);
const geminiService = new GeminiService(ai);
const chatService = new ChatService(intelService, geminiService);

/**
 * Main HTTP Handler.
 * Validates requests, sets up streaming headers, and delegates orchestration.
 */
export default async function handler(req, res) {
  // Validate HTTP methods
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Schema Validation
  const validation = chatRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid request', details: validation.error.format() });
  }

  const { message, userProfile, chatHistory } = validation.data;

  // Prepare standard JSON streaming headers for real-time status updates.
  res.setHeader('Content-Type', 'application/json'); 
  res.setHeader('Transfer-Encoding', 'chunked');

  const sendStatus = (status) => {
    res.write(JSON.stringify({ type: RESPONSE_TYPES.STATUS, status }) + '\n');
  };

  try {
    // Stage full AI orchestration through the chat service.
    const result = await chatService.processChat(
      { message, userProfile, chatHistory },
      (status) => sendStatus(status)
    );

    // Final AI output delivery.
    res.write(JSON.stringify({
      type: RESPONSE_TYPES.FINAL,
      raw: result.raw,
      parsed: result.parsed,
      success: true,
      meta: { model: result.model }
    }) + '\n');
    
    res.end();

  } catch (error) {
    console.error("[Backend Critical Error]", error.message);

    // Provide a fail-safe UI response even on total service failure to ensure UX stability.
    const fallbackResponse = {
      type: RESPONSE_TYPES.FINAL,
      success: false,
      error: "Intel sources overloaded. Please retry in a moment.",
      parsed: {
        answer: "I'm having trouble accessing my database right now. Let's try again in a moment, or ask me something simpler!",
        general_knowledge_note: null,
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false,
        citations: []
      }
    };

    res.write(JSON.stringify(fallbackResponse) + '\n');
    res.end();
  }
}
