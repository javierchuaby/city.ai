/**
 * api/utils/rag.js
 * Handles Supabase and Gemini client initialization and RAG retrieval.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase environment variables missing. Vector search will fail.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Initialize Gemini SDKs
export const genAI_Chat = new GoogleGenerativeAI(process.env.AI_API_KEY || "dummy-key");
export const genAI_Embed = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
// Embedding model (used internally for RAG retrieval)
const embeddingModel = genAI_Embed ? genAI_Embed.getGenerativeModel({
  model: "gemini-embedding-001"
}) : null;


/**
 * Retrieves relevant intel from Supabase using vector similarity search.
 */
export async function getRelevantIntel(message) {
  if (!process.env.GEMINI_API_KEY || !embeddingModel) {
    console.warn("GEMINI_API_KEY missing or embedding model not initialized - skipping RAG.");
    return [];
  }

  try {
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text: message }] },
      taskType: "retrieval_query",
      outputDimensionality: 768
    });
    const embedding = result.embedding.values;

    const { data: intel, error } = await supabase.rpc('match_intel', {
      query_embedding: embedding,
      match_threshold: 0.2,
      match_count: 3
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return [];
    }

    return intel || [];
  } catch (err) {
    console.warn("RAG Retrieval error (falling back to base knowledge):", err);
    return [];
  }
}
