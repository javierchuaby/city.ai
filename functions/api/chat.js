/**
 * functions/api/chat.js
 * Cloudflare Pages Function entry point for the AI orchestration backend.
 * Adapts the Node.js/Vercel style handler to Cloudflare's Web-Standard (V8) runtime.
 */

import { ChatService } from "./_lib/services/chatService.js";
import { IntelService } from "./_lib/services/intelService.js";
import { GeminiService } from "./_lib/services/geminiService.js";
import { IntelRepository } from "./_lib/repositories/intelRepository.js";
import { ai } from "./_lib/clients/gemini.js";
import { supabase } from "./_lib/clients/supabase.js";
import { chatRequestSchema } from "./_lib/utils/schema.js";
import { RESPONSE_TYPES } from "../../src/shared/lib/constants.js";

// Composition Root (Singleton pattern for the request lifecycle)
const intelRepo = new IntelRepository(supabase);
const intelService = new IntelService(intelRepo, ai);
const geminiService = new GeminiService(ai);
const chatService = new ChatService(intelService, geminiService);

/**
 * Cloudflare Pages HTTP Handler.
 * Supports streaming response using ReadableStream.
 */
export async function onRequestPost({ request, env }) {
  // 1. Method Validation
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // 2. Schema Validation
    const body = await request.json();
    const validation = chatRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: validation.error.format() 
      }), { status: 400 });
    }

    const { message, userProfile, chatHistory } = validation.data;

    // 3. Prepare the Streaming Response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (data) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
        };

        const sendStatus = (status) => {
          sendChunk({ type: RESPONSE_TYPES.STATUS, status });
        };

        try {
          // AI orchestration through the chat service.
          const result = await chatService.processChat(
            { message, userProfile, chatHistory },
            (status) => sendStatus(status)
          );

          // Final output delivery.
          sendChunk({
            type: RESPONSE_TYPES.FINAL,
            raw: result.raw,
            parsed: result.parsed,
            success: true,
            meta: { model: result.model }
          });

          controller.close();
        } catch (error) {
          console.error("[Cloudflare Critical Error]", error.message);
          
          const fallbackResponse = {
            type: RESPONSE_TYPES.FINAL,
            success: false,
            error: "Cloudflare edge limit reached. Please retry momentarily.",
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
          
          sendChunk(fallbackResponse);
          controller.close();
        }
      }
    });

    // 4. Final Response with standard streaming headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("[Request Parsing Error]", error);
    return new Response(JSON.stringify({ error: "Server Parse Exception" }), { status: 500 });
  }
}
