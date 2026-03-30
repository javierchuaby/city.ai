/**
 * api/clients/gemini.js
 * Centralized Gemini (Google Generative AI) Client Setup.
 * Manages the SDK instance and model registry.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

/**
 * Singleton Google AI SDK Instance
 */
export const ai = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Model registry helper to get specific model instances
 * @param {string} modelName - Optional model ID.
 */
export const getModel = (modelName = config.gemini.models.chat[0]) => {
  return ai.getGenerativeModel({ model: modelName });
};
