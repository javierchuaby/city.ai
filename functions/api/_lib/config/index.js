import { z } from "zod";

/**
 * api/config/index.js
 * Centralized, Zod-validated configuration for the backend system.
 */

const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY missing"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY / AI_API_KEY missing").optional(),
  AI_API_KEY: z.string().min(1).optional(),
});

function getRawConfig() {
  // During tests, we provide mock defaults to allow the system tree to initialize.
  const isTest = process.env.VITEST === 'true';
  const source = isTest ? {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    GEMINI_API_KEY: "test-ai-key"
  } : {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_API_KEY: process.env.AI_API_KEY,
    VITEST: process.env.VITEST
  };

  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errors = result.error.format();
    const missing = Object.keys(errors).filter(k => k !== "_errors");
    console.error("[Config Error] Invalid environment configuration:", missing.join(", "));
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const { data } = result;
  const apiKey = data.GEMINI_API_KEY || data.AI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing environment variables: GEMINI_API_KEY or AI_API_KEY");
  }

  return {
    supabase: {
      url: data.SUPABASE_URL,
      serviceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY
    },
    gemini: {
      apiKey,
      models: {
        embedding: "gemini-embedding-2-preview",
        chat: ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
      }
    },
    app: {
      maxRetries: 3
    }
  };
}

// Singleton config instance
export const config = getRawConfig();

/**
 * Compatibility export for validateConfig calls (now redundant due to getRawConfig)
 */
export function validateConfig() {
  return true;
}
