import { useState } from "react";
import Landing from "./views/Landing";
import Signup from "./views/Signup";
import OnboardingFlow from "./views/OnboardingFlow";
import Sidebar from "./features/Sidebar";
import ChatContainer from "./features/ChatContainer";
import ComponentLibrary from "./views/ComponentLibrary";

import { useAppContext } from "./hooks/useAppContext";
import useChat from "./hooks/useChat";

/**
 * Main Application Component
 * The central entry point for city.ai navigation and global state orchestration.
 */
export default function App() {
  const { 
    screen,
    user,
    category,
    isDev, setIsDev,
  } = useAppContext();

  const [feedbackDismissed, setFeedbackDismissed] = useState({});

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

  const handleNewChat = () => {
    resetMessages();
  };

  const onDismissFeedback = (id) => {
    setFeedbackDismissed(prev => ({ ...prev, [id]: true }));
  };

  // View Router
  if (screen === "landing") return <Landing />;
  if (screen === "signup") return <Signup />;
  if (screen === "onboarding") return <OnboardingFlow />;

  if (isDev) return <ComponentLibrary onExit={() => setIsDev(false)} />;

  return (
    <div id="app" className="screen active">
      <Sidebar 
        onNewChat={handleNewChat} 
      />
      <ChatContainer 
        messages={messages} 
        loading={loading} 
        input={input} 
        setInput={setInput} 
        sendMessage={sendMessage} 
        categoryLabel={currentCatLabel}
        feedbackDismissed={feedbackDismissed}
        onDismissFeedback={onDismissFeedback}
      />
    </div>
  );
}
