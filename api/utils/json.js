/**
 * api/utils/json.js
 * Robust JSON extraction and parsing utilities.
 */

export function parseAIResponse(rawContent) {
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
    return {
      answer: parsed.answer || (typeof parsed === 'string' ? parsed : "I couldn't generate a proper response."),
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      trust: typeof parsed.trust === 'number' ? parsed.trust : 80,
      freshness: parsed.freshness || "recent",
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      has_conflict: !!parsed.has_conflict,
      conflict_note: parsed.conflict_note || "",
      ask_question: parsed.ask_question || null
    };
  } catch (parseError) {
    console.error("JSON Parsing failed", parseError, cleanContent);
    // Construct a valid fallback response from raw text
    return {
      answer: rawContent.length > 1000 ? rawContent.substring(0, 1000) + "..." : rawContent,
      sources: [],
      trust: 85,
      freshness: "recent",
      recommendations: [],
      has_conflict: false,
      conflict_note: "",
      ask_question: null
    };
  }
}
