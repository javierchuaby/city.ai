import { useState } from "react";
import { useAppContext } from "@entities/user/model/useAppContext";
import Button from "@shared/ui/Button/Button";
import Input from "@shared/ui/Input/Input";

const REGIONS = [
  { label: "Southeast Asia", flag: "🌏" }, { label: "East Asia", flag: "🗾" },
  { label: "South Asia", flag: "🇮🇳" }, { label: "Europe", flag: "🇪🇺" },
  { label: "Oceania", flag: "🇦🇺" }, { label: "North America", flag: "🌎" },
  { label: "Latin America", flag: "🌎" }, { label: "Middle East", flag: "🌍" },
  { label: "Africa", flag: "🌍" },
];

/**
 * Signup View Component
 * Handles the registration multistep flow.
 */
export default function Signup() {
  const { setScreen, setUser } = useAppContext();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", dob: "", pass: "", pass2: "", region: "" });
  const [checks, setChecks] = useState({ chk1: false, chk2: false, chk3: false });
  const [error, setError] = useState("");

  const next = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) return setError("Please enter your name.");
      if (!form.email.includes("@")) return setError("Please enter a valid email.");
    }
    if (step === 2) {
      if (!form.dob) return setError("Please enter your date of birth.");
      const age = (new Date() - new Date(form.dob)) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) return setError("You must be 18 or older to use city.ai.");
      if (form.pass.length < 8) return setError("Password must be at least 8 characters.");
      if (form.pass !== form.pass2) return setError("Passwords do not match.");
    }
    if (step === 3) {
      if (!form.region) return setError("Please select your region.");
    }
    if (step === 4) {
      if (!checks.chk1) return setError("Please agree to the Terms of Service.");
      if (!checks.chk3) return setError("You must be 18 or older.");
      setUser(prev => ({ ...prev, ...form }));
      setScreen("onboarding");
      return;
    }
    setStep(s => s + 1);
  };

  return (
    <div id="signup" className="screen active">
      <div className="signup-wrap">
        <button className="signup-back" onClick={() => setScreen("landing")}>← Back</button>
        <div className="signup-logo">
          <span className="signup-logo-city">city<span className="signup-logo-dot">.</span></span>
          <span className="signup-logo-ai">ai</span>
        </div>
        <h1 className="signup-title">Create your account</h1>
        <p className="signup-sub">Join 12,000+ travelers getting real local intelligence.</p>

        <div className="progress-bar">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`prog-step ${i < step ? "done" : i === step ? "current" : ""}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="form-step active">
            <Input label="Full Name" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {error && <div className="error-msg">{error}</div>}
            <div className="form-nav"><Button variant="next" onClick={next}>Continue →</Button></div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step active">
            <Input label="Date of Birth" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
            <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.pass2} onChange={e => setForm({ ...form, pass2: e.target.value })} />
            {error && <div className="error-msg">{error}</div>}
            <div className="form-nav"><Button variant="back" onClick={() => setStep(step - 1)}>← Back</Button><Button variant="next" onClick={next}>Continue →</Button></div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step active">
            <p className="ob-q-sub" style={{ fontSize: "13px", color: "var(--tm)", marginBottom: "4px" }}>Where do you currently live?</p>
            <div className="region-grid">
              {REGIONS.map(r => (
                <div key={r.label} className={`region-opt ${form.region === r.label ? "selected" : ""}`} onClick={() => setForm({ ...form, region: r.label })}>
                  <span className="region-flag">{r.flag}</span>{r.label}
                </div>
              ))}
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-nav"><Button variant="back" onClick={() => setStep(step - 1)}>← Back</Button><Button variant="next" onClick={next}>Continue →</Button></div>
          </div>
        )}

        {step === 4 && (
          <div className="form-step active">
            <div className="tnc-box">
              <h4>Terms of Service & Privacy Policy</h4>
              <p>By creating an account, you agree to city.ai's collection and use of your data.</p>
            </div>
            <div className="checkbox-row" onClick={() => setChecks({ ...checks, chk1: !checks.chk1 })}><div className={`custom-check ${checks.chk1 ? "checked" : ""}`}></div><span>I agree to the Terms</span></div>
            <div className="checkbox-row" onClick={() => setChecks({ ...checks, chk3: !checks.chk3 })}><div className={`custom-check ${checks.chk3 ? "checked" : ""}`}></div><span>I'm 18 or older</span></div>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-nav"><Button variant="back" onClick={() => setStep(step - 1)}>← Back</Button><Button variant="next" onClick={next}>Create Account →</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}
