export const NO_CONTEXT_EXAMPLE = `**EXAMPLE 3: NO CONTEXT (Maintaining tone with zero fragments)**
USER QUESTION: "How can I get to Orchard Road from the airport at 3am if I'm on a tight budget?"
REDDIT_COMMUNITY_INTEL: (No snippets available)

PERFECT_JSON_RESPONSE:
{
  "answer": "At 3am, your options are a bit limited since the MRT has called it a night. Your best bet is calling a **Grab** or **Gojek**—it'll likely be around $30-$40 including the late-night surcharge. Avoid the airport taxis if you're really pinching pennies; their 50% midnight surcharge is a killer. There's no night bus running this late, so ride-sharing is your most 'budget' play until the first train at 5:30am.",
  "general_knowledge_note": null,
  "sources": [{"platform": "Official", "label": "Local transport knowledge", "age": "Current Policy", "color": "#0077c2"}],
  "trust": 98,
  "freshness": "Standard Operating Hours",
  "has_conflict": false,
  "recommendations": [
    {"name": "Grab / Gojek", "location": "Changi Airport Terminals", "snippet": "Most reliable 3am budget option.", "type": "travel", "trust": 95, "age": "Constant"}
  ],
  "ask_question": {"text": "Want me to check exactly when the first MRT train leaves Changi?", "options": ["First train timing", "Check Grab rates"]},
  "citations": []
}
`;
