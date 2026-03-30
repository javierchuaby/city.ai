import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * api/utils/schema.js
 * Definitions for Zod-based Structured Outputs.
 * This ensures the model follows the exact JSON structure and includes citations.
 */

export const chatResponseSchema = z.object({
  answer: z.string().describe("Main answer body. Use \\n\\n for paragraph breaks. High empathy, witty, expert local tone."),
  general_knowledge_note: z
    .string()
    .nullable()
    .describe(
      "If the user asked for hawker/food centres and you named venues using general local knowledge not proven by REDDIT_COMMUNITY_INTEL, one short disclosure sentence. Otherwise null."
    ),
  sources: z.array(z.object({
    platform: z.string().describe("Source platform, e.g., 'Reddit', 'Official', 'News'"),
    label: z.string().describe("User-friendly source label, e.g., 'Reddit community intel'"),
    age: z.string().describe("Recency or verification status, e.g., 'Verified Local Info', '2 days ago'"),
    color: z.string().describe("Hex color code for the source brand (Reddit: #ff4500, News: #0077c2)")
  })).describe(
    "High-level sources. Include {platform: 'Local', label: 'General local knowledge', color: '#0077c2'} when rule 12 supplement was used."
  ),
  trust: z.number().int().min(0).max(100).describe("Overall confidence score (0-100) based on source reliability."),
  freshness: z.string().describe("Indication of how current the info is, e.g., 'Recent Sentiment'"),
  has_conflict: z.boolean().describe("Whether there are conflicting community opinions reported."),
  conflict_note: z.string().optional().describe("Notes explaining the nature of the conflict if has_conflict is true."),
  recommendations: z.array(z.object({
    name: z.string().describe(
      "Place or activity name. For hawker-centre questions: list hawker centres first (venue names), then optional stalls."
    ),
    location: z.string().describe("Location context, e.g., 'Maxwell', 'Near Orchard MRT'"),
    snippet: z.string().describe("One-sentence pithy local tip. Max 60 characters."),
    type: z.enum(["food", "activity", "stay", "travel"]).describe("Category for UI icon assignment."),
    trust: z.number().int().min(0).max(100).describe("Trust score for this specific recommendation."),
    age: z.string().describe("Longevity of this spot, e.g., 'Staple', 'New', 'Hidden Gem'")
  })).describe(
    "Actionable picks. When the user asked for centres, order items with hawker centre venues before stall-only entries."
  ),
  ask_question: z.object({
    text: z.string().describe("Suggested follow-up question to keep the conversation going."),
    options: z.array(z.string()).describe("Short labels for quick-reply chips.")
  }).nullable().describe("Optional follow-up interaction or null if answer is final."),
  citations: z.array(z.object({
    source_id: z.string().describe("The ID of the snippet found in REDDIT_COMMUNITY_INTEL (e.g., 'Snippet 1')."),
    url: z.string().describe("The exact URL associated with this snippet. MANDATORY: This URL must be a direct match from the provided snippets. NO HALLUCINATION.")
  })).describe(
    "Snippet-backed claims only. Each entry must map to real REDDIT_COMMUNITY_INTEL snippets. Omit general-knowledge venue names (use general_knowledge_note + sources instead)."
  )
});

/**
 * Converts Zod schema to Gemini's JSON schema format and injects propertyOrdering.
 * Gemini models (especially 2.x) benefit from explicit ordering for reliability.
 */
export function getGeminiSchema() {
  const jsonSchema = zodToJsonSchema(chatResponseSchema, {
    target: "openApi3",
    $refStrategy: "none",
  });
  
  // Clean up the schema: remove top-level $schema as Gemini doesn't expect it
  const cleanSchema = { ...jsonSchema };
  delete cleanSchema.$schema;

  // Add propertyOrdering for the top-level object
  if (cleanSchema.type === "object" && cleanSchema.properties) {
    cleanSchema.propertyOrdering = Object.keys(chatResponseSchema.shape);
    
    // Also inject for known sub-objects to ensure deep consistency
    // sources (array of objects)
    if (cleanSchema.properties.sources?.items) {
      cleanSchema.properties.sources.items.propertyOrdering = ["platform", "label", "age", "color"];
    }
    
    // recommendations (array of objects)
    if (cleanSchema.properties.recommendations?.items) {
      cleanSchema.properties.recommendations.items.propertyOrdering = ["name", "location", "snippet", "type", "trust", "age"];
    }
    
    // ask_question (object)
    if (cleanSchema.properties.ask_question) {
      cleanSchema.properties.ask_question.propertyOrdering = ["text", "options"];
    }
    
    // citations (array of objects)
    if (cleanSchema.properties.citations?.items) {
      cleanSchema.properties.citations.items.propertyOrdering = ["source_id", "url"];
    }
  }

  return cleanSchema;
}
