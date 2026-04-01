/**
 * api/clients/gemini.js
 * Centralized Gemini (Google Generative AI) Client Setup.
 * Manages the SDK instance and model registry.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
/**
 * Factory function to create a new Gemini (Google Generative AI) Client.
 * @param {object} config - Validated configuration object from getConfig()
 */
export const getGeminiClient = (config) => {
  return new GoogleGenerativeAI(config.gemini.apiKey);
};

/**
 * Helper to get a specific generative model.
 * @param {object} aiClient - Instance and result from getGeminiClient()
 * @param {string} modelName - Optional model ID.
 */
export const getModel = (aiClient, modelName = "gemini-2.5-flash") => {
  return aiClient.getGenerativeModel({ model: modelName });
};
