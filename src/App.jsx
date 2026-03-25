import { useState } from "react";
import Landing from "./views/Landing";
import Signup from "./views/Signup";
import OnboardingFlow from "./features/OnboardingFlow";
import Sidebar from "./features/Sidebar";
import ChatContainer from "./features/ChatContainer";
import ComponentLibrary from "./views/ComponentLibrary";

import useChat from "./hooks/useChat";
import usePoints from "./hooks/usePoints";

/**
 * Main Application Component
 * The central entry point for city.ai navigation and global state orchestration.
 */
export default function App() {
  // Navigation & High-level state
  const [screen, setScreen] = useState("landing");
  const [category, setCategory] = useState("all");
  const [isDev, setIsDev] = useState(false);
  const [user, setUser] = useState({ 
    name: "", email: "", dob: "", region: "", 
    travelStyle: "", interests: [], budget: "", context: "" 
  });
  const [feedbackDismissed, setFeedbackDismissed] = useState({});

  // Logic separation into custom hooks
  const CATS = [
    { id: "all", label: "All Intel" }, 
    { id: "food", label: "Food & Hawkers" },
    { id: "night", label: "Nightlife" }, 
    { id: "tips", label: "Local Tips" },
    { id: "deals", label: "Live Deals" }, 
    { id: "sports", label: "Sports & Fitness" },
  ];
  
  const currentCatLabel = CATS.find(c => c.id === category)?.label || "All Intel";
  
  const { messages, loading, input, setInput, sendMessage, resetMessages } = useChat(user, currentCatLabel);
  const { points, addPoints, resetPoints } = usePoints();

  // Screen Handlers
  const handleLandingAction = (action) => {
    if (action === "signup") {
      setScreen("signup");
    } else {
      // Demo Mode setup
      setUser({ 
        name: "Demo User", 
        travelStyle: "explorer", 
        interests: ["🍜 Food"], 
        budget: "mid", 
        context: "visiting" 
      });
      setScreen("app");
    }
  };

  const handleSignupComplete = (formData) => {
    setUser(prev => ({ ...prev, ...formData }));
    setScreen("onboarding");
  };

  const handleOnboardingComplete = (onboardingData) => {
    setUser(prev => ({ ...prev, ...onboardingData }));
    setScreen("app");
  };

  const handleNewChat = () => {
    resetMessages();
    resetPoints();
  };

  const onDismissFeedback = (id) => {
    setFeedbackDismissed(prev => ({ ...prev, [id]: true }));
  };

  // View Router
  if (screen === "landing") return <Landing onAction={handleLandingAction} />;
  if (screen === "signup") return <Signup onBack={() => setScreen("landing")} onComplete={handleSignupComplete} />;
  if (screen === "onboarding") return <OnboardingFlow onComplete={handleOnboardingComplete} />;

  if (isDev) return <ComponentLibrary onExit={() => setIsDev(false)} />;

  return (
    <div id="app" className="screen active">
      <Sidebar 
        user={user} 
        category={category} 
        setCategory={setCategory} 
        points={points} 
        onNewChat={handleNewChat} 
        onDevToggle={() => setIsDev(true)}
      />
      <ChatContainer 
        user={user} 
        messages={messages} 
        loading={loading} 
        input={input} 
        setInput={setInput} 
        sendMessage={sendMessage} 
        categoryLabel={currentCatLabel}
        onRate={addPoints}
        feedbackDismissed={feedbackDismissed}
        onDismissFeedback={onDismissFeedback}
      />
    </div>
  );
}
