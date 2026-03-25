
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

/**
 * api/chat.js
 * Vercel Serverless Function to handle AI orchestration with Gemini RAG and Supabase.
 */

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase environment variables missing. Vector search will fail.");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Initialize Gemini SDKs
// Task 1: Use AI_API_KEY for chat, GEMINI_API_KEY for embeddings
const genAI_Chat = new GoogleGenerativeAI(process.env.AI_API_KEY || "dummy-key");
const genAI_Embed = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Models
const chatModel = genAI_Chat.getGenerativeModel({
  model: "gemini-2.5-flash"
});
const embeddingModel = genAI_Embed ? genAI_Embed.getGenerativeModel({
  model: "gemini-embedding-001"
}) : null;

const SYSTEM_PROMPT = (user, categoryLabel = "All Intel", intelSnippets = []) => {
  const intelSection = intelSnippets.length > 0
    ? `\n\n### REDDIT_COMMUNITY_INTEL:
${intelSnippets.map((s, i) => `[Snippet ${i + 1}]: ${s.content}`).join("\n")}

STRICT CITATION RULE: If the provided REDDIT_COMMUNITY_INTEL contains relevant tips, prioritize them and cite them by saying 'According to local discussions...' or 'Reddit intel suggests...'.`
    : "";

  return `You are city.ai, a local Singapore expert. You surface authentic community knowledge — not generic tourist info. Maintain a helpful, witty tone for general Singapore travel advice.

USER PROFILE:
- Name: ${user.name || "Traveler"}
- Travel style: ${user.travelStyle || "explorer"}
- Budget: ${user.budget || "mid"}
- Interests: ${user.interests?.join(", ") || "general"}
- Region: ${user.region || "unknown"}
- Current focus: ${categoryLabel}
${intelSection}

YOUR RULES:
1. Answer like a well-connected local, not a travel blog. Tone should be expert but approachable, slightly witty.
2. Include specific places, prices, timings where relevant.
3. Be specific — mention actual place names, hawker stall numbers, and prices in SGD.
4. Mention nearby MRT stations for location context.
5. Surface contradictions — if community says different things, say so honestly.
6. Calibrate recommendations to user's budget and travel style.
7. For food: mention hawker centre names and stall numbers where possible (e.g. Maxwell #01-10).
8. For tips: be brutally honest about tourist traps, scams, and hidden costs.
9. For deals: flag if time-sensitive or location-specific.
10. If REDDIT_COMMUNITY_INTEL is present, prioritize it and use the required citations.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no preamble):
{
  "answer": "Your main response here. Use \\n\\n for paragraph breaks. You can use [TIP: ...], [WARN: ...], [ALERT: ...] markers for callout boxes.",
  "sources": [
    {"platform":"Reddit","label":"Reddit community intel","age":"recent","color":"#ff4500"}
  ],
  "trust": 88,
  "freshness": "recent",
  "has_conflict": false,
  "conflict_note": "",
  "recommendations": [
    {"name":"Example Place","location":"Chinatown","snippet":"Short description","type":"food","trust":91,"age":"1 week"}
  ],
  "ask_question": null
}

For ask_question: {"text":"Your question here?","options":["Option A","Option B","Option C"]} or null.`;
};

/**
 * Task 2: Implement the RAG Logic
 */
async function getRelevantIntel(message) {
  // Task 1: Check for GEMINI_API_KEY - if missing, fall back to base knowledge only
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY missing - skipping RAG. Base knowledge only mode.");
    return [];
  }

  try {
    // Step 1: Embed Query (gemini-embedding-001 with outputDimensionality: 768)
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text: message }] },
      taskType: "retrieval_query",
      outputDimensionality: 768
    });
    const embedding = result.embedding.values;

    // Step 2: Vector Search (match_intel RPC function with the embedding)
    const { data: intel, error } = await supabase.rpc('match_intel', {
      query_embedding: embedding,
      match_threshold: 0.2, // Balanced threshold
      match_count: 3        // Step 3: Top 3 results
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return [];
    }

    return intel || [];
  } catch (err) {
    // Task 4: Fall back gracefully without mentioning technical error to user
    console.warn("RAG Retrieval error (falling back to base knowledge):", err);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userProfile, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing user message' });
  }

  // Task 1: Use process.env.AI_API_KEY for main chat (handled by genAI_Chat)
  if (!process.env.AI_API_KEY) {
    console.error("Missing AI_API_KEY in environment.");
    return res.status(500).json({ error: 'AI_API_KEY is not configured on the server.' });
  }

  // Log status of GEMINI key
  if (!process.env.GEMINI_API_KEY) {
    console.info("Notice: GEMINI_API_KEY is missing. Running in 'Base Knowledge Only' mode.");
  }

  try {
    // Step 1: Fetch relevant intel snippets (RAG)
    const intelSnippets = await getRelevantIntel(message);
    const categoryLabel = userProfile?.categoryLabel || "All Intel";

    // Step 2: Call Gemini with augmented prompt
    const model = genAI_Chat.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT(userProfile || {}, categoryLabel, intelSnippets),
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const chat = model.startChat({
      history: (chatHistory || []).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    const rawContent = result.response.text();

    // Robust JSON extraction
    let cleanContent = rawContent;
    // Look for the block that looks like a JSON object
    const startIdx = rawContent.indexOf('{');
    const endIdx = rawContent.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleanContent = rawContent.substring(startIdx, endIdx + 1);
    } else {
      // Fallback: cleanup common markdown wrappers
      cleanContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanContent);

      // Ensure required structure exists to avoid UI crashes
      const safeParsed = {
        answer: parsed.answer || (typeof parsed === 'string' ? parsed : "I couldn't generate a proper response."),
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        trust: typeof parsed.trust === 'number' ? parsed.trust : 80,
        freshness: parsed.freshness || "recent",
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        has_conflict: !!parsed.has_conflict,
        conflict_note: parsed.conflict_note || "",
        ask_question: parsed.ask_question || null
      };

      // Post-process sources based on intel retrieval
      if (intelSnippets.length > 0) {
        if (!safeParsed.sources.some(s => s.label.includes("Reddit"))) {
          safeParsed.sources.unshift({
            platform: "Reddit",
            label: "Reddit community intel",
            age: "Verified Local Info",
            color: "#ff4500"
          });
        }
      } else {
        // Fallback: If no intel found, remove accidental Reddit source hallucinations
        safeParsed.sources = safeParsed.sources.filter(s => !s.label.includes("Reddit"));
      }

      return res.status(200).json({
        raw: rawContent,
        parsed: safeParsed,
        success: true
      });
    } catch (parseError) {
      console.error("JSON Parsing failed", parseError, cleanContent);
      // Construct a valid response from raw text if JSON fails
      return res.status(200).json({
        raw: rawContent,
        parsed: {
          answer: rawContent.length > 1000 ? rawContent.substring(0, 1000) + "..." : rawContent,
          sources: [],
          trust: 85,
          freshness: "recent",
          recommendations: [],
          has_conflict: false,
          conflict_note: "",
          ask_question: null
        },
        success: true
      });
    }
  } catch (error) {
    console.error("Backend AI Error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to connect to AI service.",
      parsed: {
        answer: "Sorry, I'm having trouble connecting to my local sources. How else can I help you explore Singapore?",
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false
      }
    });
  }
}
