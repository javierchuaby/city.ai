/**
 * api/config.js
 * Centralized configuration for the backend.
 * All process.env access should happen here.
 */

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY,
    models: {
      embedding: "gemini-embedding-2-preview",
      chat: ["gemini-2.5-flash", "gemini-2.0-flash"]
    }
  },
  app: {
    maxRetries: 3
  }
};

/**
 * Validation to ensure critical environment variables are present.
 */
export function validateConfig() {
  const missing = [];
  if (!config.supabase.url) missing.push("SUPABASE_URL");
  if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!config.gemini.apiKey) missing.push("GEMINI_API_KEY / AI_API_KEY");
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}
