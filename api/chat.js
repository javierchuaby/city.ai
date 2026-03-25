
/**
 * api/chat.js
 * Vercel Serverless Function to handle AI orchestration.
 */

const SYSTEM_PROMPT = (user, categoryLabel = "All Intel") => `You are city.ai, a hyperlocal intelligence agent for Singapore. You surface authentic community knowledge — not generic tourist info.

USER PROFILE:
- Name: ${user.name || "Traveler"}
- Travel style: ${user.travelStyle || "explorer"}
- Budget: ${user.budget || "mid"}
- Context: ${user.context || "visiting"}
- Interests: ${user.interests?.join(", ") || "general"}
- Region: ${user.region || "unknown"}
- Current focus: ${categoryLabel}

YOUR RULES:
1. Answer like a well-connected local, not a travel blog. Tone should be expert but approachable.
2. Include specific places, prices, timings where relevant.
3. Be specific — mention actual place names, hawker stall numbers, and prices in SGD.
4. Mention nearby MRT stations for location context.
5. Surface contradictions — if community says different things, say so honestly.
6. Calibrate recommendations to user's budget and travel style.
7. For food: mention hawker centre names and stall numbers where possible, not just restaurants.
8. For nightlife: mention door policies, best nights, and realistic costs.
9. For tips: be brutally honest about tourist traps, scams, and hidden costs.
10. For deals: flag if time-sensitive or location-specific.
11. Occasionally (not always) ask a follow-up question to refine future answers.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no backticks):
{
  "answer": "Your main response here. Use \\n\\n for paragraph breaks. You can use [TIP: ...], [WARN: ...], [ALERT: ...] markers for callout boxes.",
  "sources": [
    {"platform":"Reddit","label":"r/singapore","age":"2 weeks ago","color":"#ff4500"},
    {"platform":"X","label":"@sgfoodie","age":"3 days ago","color":"#1d9bf0"}
  ],
  "trust": 88,
  "freshness": "4 days ago",
  "has_conflict": false,
  "conflict_note": "",
  "recommendations": [
    {"name":"Example Place","location":"Chinatown","snippet":"Short description","type":"food","trust":91,"age":"1 week"}
  ],
  "ask_question": null
}

For ask_question, if you want to ask a clarifying question to personalise future answers, use:
{"text":"Your question here?","options":["Option A","Option B","Option C"]}
Otherwise set to null.

Only include 2-4 recommendations when genuinely relevant. Keep sources realistic (2-4 items).`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userProfile, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing user message' });
  }

  const API_URL = "https://api.anthropic.com/v1/messages";
  const API_KEY = process.env.AI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'AI_API_KEY is not configured on the server.' });
  }

  try {
    const categoryLabel = userProfile?.categoryLabel || "All Intel";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        system: SYSTEM_PROMPT(userProfile || {}, categoryLabel),
        messages: [...(chatHistory || []), { role: "user", content: message }].map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        success: false, 
        error: errorData.error?.message || `API error: ${response.status}` 
      });
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || "";

    // JSON Sanitization: Remove markdown backticks and trim
    let cleanContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleanContent);
      return res.status(200).json({
        raw: rawContent,
        parsed: parsed,
        success: true
      });
    } catch (parseError) {
      console.error("JSON Parsing failed", parseError, cleanContent);
      // Fallback object for malformed JSON
      return res.status(200).json({
        raw: rawContent,
        parsed: {
          answer: rawContent,
          sources: [],
          trust: 85,
          freshness: "recent",
          recommendations: [],
          has_conflict: false,
          ask_question: null
        },
        success: true
      });
    }
  } catch (error) {
    console.error("Backend AI Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Unable to connect to AI service.",
      parsed: {
        answer: "Sorry, I'm having trouble connecting to my local sources.",
        sources: [],
        trust: 0,
        freshness: "N/A",
        recommendations: [],
        has_conflict: false
      }
    });
  }
}
