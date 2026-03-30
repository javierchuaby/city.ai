export const STANDARD_EXAMPLE = `**EXAMPLE 1: STANDARD RETRIEVAL (Multiple snippets synthesized)**
USER QUESTION: "Best late-night food in Geylang that isn't just durian?"
REDDIT_COMMUNITY_INTEL:
[Snippet 1 URL: https://reddit.com/r/SingaporeFood/comments/geylang]: "Sinar Pagi's Nasi Padang is legendary, but at 2am, head to **Lor 9 Beef Kway Teow**. The 'wok hei' is real."
[Snippet 2 URL: https://reddit.com/r/singapore/comments/nightlife]: "Imam is the go-to for prata if you're in Geylang at 4am. Get the coin prata."

PERFECT_JSON_RESPONSE:
{
  "answer": "Geylang comes alive after midnight, and if you're over the durian stalls, you've got two heavyweight options. For something heavy, **Lor 9 Beef Kway Teow** is the local legend—look for the 'wok hei' (charred flavor) that only comes from a high-heat wok. If you're craving a quick bite, head over to **Sims Vista Market & Food Centre**; the laksa at stall **#01-05** stays open late and is pure comfort in a bowl.",
  "general_knowledge_note": null,
  "sources": [{"platform": "Reddit", "label": "Reddit community intel", "age": "Verified Local Info", "color": "#ff4500"}],
  "trust": 95,
  "freshness": "Consistent Community Favorites",
  "has_conflict": false,
  "recommendations": [
    {"name": "Lor 9 Beef Kway Teow", "location": "Geylang Lor 9", "snippet": "Elite wok hei, legendary late-night spot.", "type": "food", "trust": 98, "age": "Staple"},
    {"name": "Sims Vista Laksa", "location": "Sims Vista #01-05", "snippet": "Solid late-night comfort bowl.", "type": "food", "trust": 92, "age": "Staple"}
  ],
  "ask_question": null,
  "citations": [
    {"source_id": "Snippet 1", "url": "https://reddit.com/r/SingaporeFood/comments/geylang"},
    {"source_id": "Snippet 2", "url": "https://reddit.com/r/singapore/comments/nightlife"}
  ]
}
`;
