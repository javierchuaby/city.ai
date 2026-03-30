import { useState } from "react";
import Landing from "@pages/landing/ui/Landing";
import Signup from "@pages/signup/ui/Signup";
import OnboardingFlow from "@pages/onboarding/ui/OnboardingFlow";
import Sidebar from "@widgets/sidebar/ui/Sidebar";
import ChatContainer from "@widgets/chat-panel/ui/ChatPanel";


import { useAppContext } from "@entities/user/model/useAppContext";
import useChat from "@entities/chat/model/useChat";

/**
 * Main Application Component
 * The central entry point for city.ai navigation and global state orchestration.
 */
export default function App() {
  const { 
    screen,
    user,
    category,
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
  
  const { messages, loading, loadingStep, input, setInput, sendMessage, resetMessages } = useChat(user, currentCatLabel);

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



  return (
    <div id="app" className="screen active">
      <Sidebar 
        onNewChat={handleNewChat} 
      />
      <ChatContainer 
        messages={messages} 
        loading={loading} 
        loadingStep={loadingStep} 
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
