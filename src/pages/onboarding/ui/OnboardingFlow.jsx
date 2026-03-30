import { useState } from "react";
import { useAppContext } from "@entities/user/model/useAppContext";
import Button from "@shared/ui/Button/Button";

const OB_Q1 = [
  { id: "budget", icon: "🎒", title: "Budget Traveler", desc: "Hostels, street food, free activities" },
  { id: "nomad", icon: "💻", title: "Digital Nomad", desc: "Long stays, coworking, local life" },
  { id: "explorer", icon: "🗺️", title: "Explorer", desc: "Off the beaten path, authentic experiences" },
  { id: "social", icon: "🎉", title: "Social Traveler", desc: "Nightlife, meetups, parties" },
];

const OB_Q3 = [
  { id: "shoestring", icon: "💵", title: "Shoestring — Under $30/day", desc: "Every dollar counts" },
  { id: "mid", icon: "💳", title: "Mid-range — $30–80/day", desc: "Comfortable without splurging" },
  { id: "flexible", icon: "💎", title: "Flexible — $80+/day", desc: "Quality over price" },
];

const OB_Q4 = [
  { id: "visiting", icon: "✈️", title: "Just visiting", desc: "Short trip, 1–2 weeks" },
  { id: "extended", icon: "🏠", title: "Extended stay", desc: "1+ months, settling in" },
  { id: "local", icon: "🏙️", title: "I live here", desc: "Local or long-term expat" },
  { id: "planning", icon: "📅", title: "Planning ahead", desc: "Researching before I arrive" },
];

/**
 * OnboardingFlow Component
 * Multi-step setup for user preferences.
 */
export default function OnboardingFlow() {
  const { setScreen, setUser } = useAppContext();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ travelStyle: "", interests: [], budget: "", context: "" });

  const next = () => {
    if (step < 4) setStep(step + 1);
    else {
      setUser(prev => ({ ...prev, ...answers }));
      setScreen("app");
    }
  };

  const toggleInterest = (interest) => {
    setAnswers(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest]
    }));
  };

  return (
    <div id="onboarding" className="screen active">
      <div className="onboarding-wrap">
        <div className="ob-header">
          <div className="ob-eyebrow">Personalising your experience</div>
          <h2 className="ob-title">Tell us about yourself</h2>
          <p className="ob-sub">A few quick questions so city.ai can give you answers that are actually relevant to you.</p>
        </div>

        {step === 1 && (
          <div className="ob-question active">
            <div className="ob-q-label">How would you describe your travel style?</div>
            <div className="ob-options">
              {OB_Q1.map(opt => (
                <div key={opt.id} className={`ob-opt ${answers.travelStyle === opt.id ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, travelStyle: opt.id })}>
                  <div className="ob-opt-icon">{opt.icon}</div>
                  <div className="ob-opt-text"><div className="ob-opt-title">{opt.title}</div><div className="ob-opt-desc">{opt.desc}</div></div>
                  <div className="ob-opt-check"></div>
                </div>
              ))}
            </div>
            <div className="ob-nav"><span className="ob-prog">1 of 4</span><Button variant="next" disabled={!answers.travelStyle} onClick={next}>Next →</Button></div>
          </div>
        )}

        {step === 2 && (
          <div className="ob-question active">
            <div className="ob-q-label">What are you most interested in?</div>
            <div className="ob-chips">
              {["🍜 Food & Hawkers", "🍸 Nightlife", "🏀 Sports & Fitness", "🎨 Arts & Culture", "💼 Coworking", "🛍️ Shopping & Markets", "🌿 Nature & Parks"].map(interest => (
                <div key={interest} className={`ob-chip ${answers.interests.includes(interest) ? "selected" : ""}`} onClick={() => toggleInterest(interest)}>{interest}</div>
              ))}
            </div>
            <div className="ob-nav"><span className="ob-prog">2 of 4</span><div style={{ display: "flex", gap: "8px" }}><Button variant="back" onClick={() => setStep(step - 1)}>← Back</Button><Button variant="next" onClick={next}>Next →</Button></div></div>
          </div>
        )}

        {step === 3 && (
          <div className="ob-question active">
            <div className="ob-q-label">What's your daily budget range?</div>
            <div className="ob-options">
              {OB_Q3.map(opt => (
                <div key={opt.id} className={`ob-opt ${answers.budget === opt.id ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, budget: opt.id })}>
                  <div className="ob-opt-icon">{opt.icon}</div>
                  <div className="ob-opt-text"><div className="ob-opt-title">{opt.title}</div><div className="ob-opt-desc">{opt.desc}</div></div>
                  <div className="ob-opt-check"></div>
                </div>
              ))}
            </div>
            <div className="ob-nav"><span className="ob-prog">3 of 4</span><div style={{ display: "flex", gap: "8px" }}><Button variant="back" onClick={() => setStep(step - 1)}>← Back</Button><Button variant="next" disabled={!answers.budget} onClick={next}>Next →</Button></div></div>
          </div>
        )}

        {step === 4 && (
          <div className="ob-question active">
            <div className="ob-q-label">What best describes your current situation?</div>
            <div className="ob-options">
              {OB_Q4.map(opt => (
                <div key={opt.id} className={`ob-opt ${answers.context === opt.id ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, context: opt.id })}>
                  <div className="ob-opt-icon">{opt.icon}</div>
                  <div className="ob-opt-text"><div className="ob-opt-title">{opt.title}</div><div className="ob-opt-desc">{opt.desc}</div></div>
                  <div className="ob-opt-check"></div>
                </div>
              ))}
            </div>
            <div className="ob-nav"><span className="ob-prog">4 of 4</span><div style={{ display: "flex", gap: "8px" }}><Button variant="back" onClick={() => setStep(step - 1)}>← Back</Button><Button variant="next" disabled={!answers.context} onClick={next}>Start Exploring →</Button></div></div>
          </div>
        )}
      </div>
    </div>
  );
}
