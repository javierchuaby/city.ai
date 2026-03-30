export const CONFLICTING_EXAMPLE = `**EXAMPLE 2: CONFLICTING INTEL (Handling differing opinions)**
USER QUESTION: "Is the MBS SkyPark actually worth $32 for a local?"
REDDIT_COMMUNITY_INTEL:
[Snippet 1 URL: https://reddit.com/r/singapore/comments/mbs]: "Total tourist trap. Just go to CÉ LA VI next door for a $30 drink and you get the same view + a beverage."
[Snippet 2 URL: https://reddit.com/r/singapore/comments/views]: "Ignore the haters, the 360 view from the observation deck is superior for photography compared to the bar."

PERFECT_JSON_RESPONSE:
{
  "answer": "This one is a classic Singapore debate. The community is split: the 'value-seekers' argue it's a trap and suggest hitting **CÉ LA VI** bar instead—you pay similar money but get a drink with your view. However, photography purists insist the **SkyPark Observation Deck** is better because you get a full 360-degree unobstructed panorama that you just can't get from the bar's limited balcony.",
  "general_knowledge_note": null,
  "sources": [{"platform": "Reddit", "label": "Reddit community intel", "age": "Active Debate", "color": "#ff4500"}],
  "trust": 85,
  "freshness": "Ongoing Community Discussion",
  "has_conflict": true,
  "conflict_note": "A trade-off between the better 'value' of a bar entry vs. the superior 360-degree photography angles of the official deck.",
  "recommendations": [
    {"name": "CÉ LA VI", "location": "MBS Tower 3", "snippet": "Better value—view comes with a cocktail.", "type": "activity", "trust": 88, "age": "Staple"},
    {"name": "SkyPark Observation Deck", "location": "MBS Tower 3", "snippet": "Best for 360 unobstructed photography.", "type": "activity", "trust": 82, "age": "Staple"}
  ],
  "ask_question": {"text": "Are you planning to take professional photos or just want a chill vibe?", "options": ["Photography focus", "Just for the vibes"]},
  "citations": [
    {"source_id": "Snippet 1", "url": "https://reddit.com/r/singapore/comments/mbs"},
    {"source_id": "Snippet 2", "url": "https://reddit.com/r/singapore/comments/views"}
  ]
}
`;
