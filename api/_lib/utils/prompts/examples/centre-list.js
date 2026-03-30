export const CENTRE_LIST_EXAMPLE = `**EXAMPLE: HAWKER CENTRE LIST (Snippets dish-heavy; supplement venues + clear sourcing)**
USER QUESTION: "What are the best hawker centres?"
REDDIT_COMMUNITY_INTEL:
[Snippet 1 URL: https://reddit.com/r/singapore/comments/abc123]: "BCM at this stall hits different — less mainstream stalls are the move."
[Snippet 2 URL: https://reddit.com/r/SingaporeEats/comments/def456]: "Hidden gem BKT, queue worth it."

PERFECT_JSON_RESPONSE:
{
  "answer": "Reddit threads often obsess over **specific stalls and dishes** (see snippets), but you asked for **centres** — here are well-known Singapore hawker hubs worth planning around: **Maxwell Food Centre**, **Old Airport Road Food Centre**, **Lau Pa Sat**, and **Chinatown Complex Food Centre** — each has huge variety and MRT-friendly access.\\n\\nFrom community intel only: the snippets highlight legendary **bak chor mee** and **bak kut teh** hunts rather than ranking whole buildings — so treat stall picks as bonus colour once you pick a centre.\\n\\n[WARN: Centre names above are widely known local landmarks — not from the Reddit snippets; see sourcing below.]",
  "general_knowledge_note": "Named hawker centres use general Singapore local knowledge; dish/stall hype is from Reddit snippets only.",
  "sources": [
    {"platform": "Reddit", "label": "Reddit community intel", "age": "Recent threads", "color": "#ff4500"},
    {"platform": "Local", "label": "General local knowledge", "age": "Established venues", "color": "#0077c2"}
  ],
  "trust": 82,
  "freshness": "Mixed: recent sentiment + staple venues",
  "has_conflict": false,
  "recommendations": [
    {"name": "Maxwell Food Centre", "location": "Near Tanjong Pagar / Chinatown MRT", "snippet": "Iconic variety; go early for shorter queues.", "type": "food", "trust": 90, "age": "Staple"},
    {"name": "Old Airport Road Food Centre", "location": "Near Dakota MRT", "snippet": "Huge selection; local favourite for breadth.", "type": "food", "trust": 90, "age": "Staple"},
    {"name": "Lau Pa Sat", "location": "Downtown / Telok Ayer", "snippet": "CBD satay street vibe after dark.", "type": "food", "trust": 85, "age": "Staple"},
    {"name": "Chinatown Complex Food Centre", "location": "Chinatown MRT", "snippet": "Massive floor; Michelin-hawker hunting ground.", "type": "food", "trust": 85, "age": "Staple"}
  ],
  "ask_question": null,
  "citations": [
    {"source_id": "Snippet 1", "url": "https://reddit.com/r/singapore/comments/abc123"},
    {"source_id": "Snippet 2", "url": "https://reddit.com/r/SingaporeEats/comments/def456"}
  ]
}
`;
