import React from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import AICard from "../components/ui/AICard";
import PointsWidget from "../components/ui/PointsWidget";

/**
 * Mock Data for AI Responses
 */
const MOCK_STANDARD = {
  answer: "Here are the top hawker recommendations for you! [TIP: Go before 12pm to avoid the office crowd.]\n\n**Tian Tian Hainanese Chicken Rice** is a must-try. Expect long queues but it's worth it.",
  sources: [
    { platform: "Reddit", label: "r/singapore", age: "2 weeks ago", color: "#ff4500" },
    { platform: "X", label: "@sgfoodie", age: "3 days ago", color: "#1d9bf0" }
  ],
  trust: 94,
  freshness: "2 days ago",
  has_conflict: false,
  recommendations: [
    { name: "Tian Tian Chicken Rice", location: "Maxwell Food Centre", snippet: "Famous globally, consistently good.", type: "food", trust: 98, age: "1 day" },
    { name: "Old Liao (Stall #01-12)", location: "Tiong Bahru", snippet: "Best for traditional snacks.", type: "food", trust: 91, age: "1 week" }
  ]
};

const MOCK_CONFLICT = {
  answer: "Mixed reports on the nighttime accessibility of the Southern Ridges trail. Some say it's well-lit, others report dark patches near the Henderson Waves.",
  sources: [
    { platform: "Reddit", label: "r/asksingapore", age: "1 day ago", color: "#ff4500" }
  ],
  trust: 62,
  freshness: "12 hours ago",
  has_conflict: true,
  conflict_note: "Source A claims 24/7 lighting while Source B reports maintenance outages this month.",
  recommendations: []
};

const MOCK_QUESTION = {
  answer: "The Clarke Quay area is vibrant tonight! [WARN: Expect higher surge pricing for Grab after midnight.]",
  sources: [
    { platform: "X", label: "@sgnightlife", age: "2 hours ago", color: "#1d9bf0" }
  ],
  trust: 85,
  freshness: "Live",
  has_conflict: false,
  ask_question: {
    text: "Are you looking for a quiet lounge or a high-energy club?",
    options: ["Quiet Lounge", "High-energy Club", "Neither, just a pub"]
  }
};

/**
 * ComponentLibrary View
 * A sandbox for testing UI components in isolation.
 */
export default function ComponentLibrary({ onExit }) {
  const logClick = (label) => console.log(`[ComponentLibrary] Clicked: ${label}`);

  return (
    <div id="component-library" className="screen active" style={{ 
      flexDirection: "column", 
      overflowY: "auto", 
      padding: "60px 20px",
      background: "var(--bg)",
      gap: "80px"
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <header style={{ marginBottom: "60px", borderBottom: "1px solid var(--b1)", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <h1 style={{ fontFamily: "var(--fs)", fontSize: "42px", fontWeight: "300", fontStyle: "italic", marginBottom: "8px" }}>Design System <span style={{ color: "var(--acc)" }}>Sandbox</span></h1>
            <p style={{ color: "var(--tm)", fontFamily: "var(--fm)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Component Audit & Visual Testing</p>
          </div>
          <Button variant="ghost" onClick={onExit}>Exit Sandbox</Button>
        </header>

        {/* --- ATOMS --- */}
        <section style={{ display: "flex", flexDirection: "column", gap: "40px", marginBottom: "100px" }}>
          <h2 style={{ fontFamily: "var(--fm)", fontSize: "14px", color: "var(--td)", textTransform: "uppercase", letterSpacing: "0.2em", borderLeft: "2px solid var(--acc)", paddingLeft: "12px" }}>01. Atoms</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--tm)" }}>Buttons (Variants & States)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
              <Button variant="primary" onClick={() => logClick("Primary")}>Primary Button</Button>
              <Button variant="ghost" onClick={() => logClick("Ghost")}>Ghost Button</Button>
              <Button variant="next" onClick={() => logClick("Next")}>Next →</Button>
              <Button variant="back" onClick={() => logClick("Back")}>← Back</Button>
              <Button variant="primary" disabled onClick={() => logClick("Disabled")}>Disabled State</Button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--tm)" }}>Inputs & Textareas</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Input label="Standard Input" placeholder="Type something..." onChange={(e) => logClick(`Input: ${e.target.value}`)} />
              <Input label="Password Field" type="password" placeholder="••••••••" />
              <Input label="Chat Textarea" multiline placeholder="Ask anything..." rows={3} />
            </div>
          </div>
        </section>

        {/* --- MOLECULES --- */}
        <section style={{ display: "flex", flexDirection: "column", gap: "40px", marginBottom: "100px" }}>
          <h2 style={{ fontFamily: "var(--fm)", fontSize: "14px", color: "var(--td)", textTransform: "uppercase", letterSpacing: "0.2em", borderLeft: "2px solid var(--acc)", paddingLeft: "12px" }}>02. Molecules</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--tm)" }}>Gamification (0%, 50%, 100%)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <PointsWidget points={0} />
              <PointsWidget points={250} />
              <PointsWidget points={500} />
            </div>
          </div>
        </section>

        {/* --- ORGANISMS --- */}
        <section style={{ display: "flex", flexDirection: "column", gap: "40px", marginBottom: "100px" }}>
          <h2 style={{ fontFamily: "var(--fm)", fontSize: "14px", color: "var(--td)", textTransform: "uppercase", letterSpacing: "0.2em", borderLeft: "2px solid var(--acc)", paddingLeft: "12px" }}>03. Organisms</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--tm)", marginBottom: "20px" }}>AICard: Standard Response</h3>
              <AICard data={MOCK_STANDARD} onAnswer={(opt) => logClick(`Answer: ${opt}`)} onRate={(v) => logClick(`Rate: ${v}`)} onDismiss={() => logClick("Dismiss")} showFeedback={true} />
            </div>

            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--tm)", marginBottom: "20px" }}>AICard: Conflict Warning</h3>
              <AICard data={MOCK_CONFLICT} onAnswer={(opt) => logClick(`Answer: ${opt}`)} onRate={(v) => logClick(`Rate: ${v}`)} onDismiss={() => logClick("Dismiss")} showFeedback={false} />
            </div>

            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--tm)", marginBottom: "20px" }}>AICard: Follow-up Question</h3>
              <AICard data={MOCK_QUESTION} onAnswer={(opt) => logClick(`Answer: ${opt}`)} onRate={(v) => logClick(`Rate: ${v}`)} onDismiss={() => logClick("Dismiss")} showFeedback={false} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
