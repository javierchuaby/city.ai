import React from "react";
import Button from "../components/ui/Button";

/**
 * Landing View Component
 * The first screen users see.
 * 
 * @param {Object} props
 * @param {Function} props.onAction - Handler to navigate to signup or demo mode.
 */
export default function Landing({ onAction }) {
  return (
    <div id="landing" className="screen active">
      <div className="landing-bg"></div>
      <div className="landing-grid"></div>
      <div className="landing-content">
        <div className="brand-mark">
          <span className="brand-city">city<span className="brand-dot">.</span></span>
          <span className="brand-ai">ai</span>
        </div>
        <p className="landing-tagline">
          The <em>real</em> local intelligence.<br />Not what's on Google.
        </p>
        <div className="landing-stats">
          <div className="lst"><div className="lst-n">40K+</div><div className="lst-l">Community Sources</div></div>
          <div className="lst"><div className="lst-n">12</div><div className="lst-l">Cities Live</div></div>
          <div className="lst"><div className="lst-n">94%</div><div className="lst-l">Accuracy Rate</div></div>
        </div>
        <div className="landing-cities">
          <div className="city-pill active">🇸🇬 Singapore</div>
          <div className="city-pill">🇹🇭 Bangkok</div>
          <div className="city-pill">🇦🇺 Sydney</div>
          <div className="city-pill">🇨🇴 Medellín</div>
          <div className="city-pill">🇵🇹 Lisbon</div>
          <div className="city-pill">🇬🇪 Tbilisi</div>
        </div>
        <div className="landing-btns">
          <Button variant="primary" onClick={() => onAction("signup")}>Create Account</Button>
          <Button variant="ghost" onClick={() => onAction("demo")}>View Demo</Button>
        </div>
      </div>
    </div>
  );
}
