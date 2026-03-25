import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & High-level state
  const [screen, setScreen] = useState(() => {
    try {
      return localStorage.getItem("cityai_screen") || "landing";
    } catch (e) {
      return "landing";
    }
  });

  const [category, setCategory] = useState("all");
  const [isDev, setIsDev] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cityai_user");
      return saved ? JSON.parse(saved) : {
        name: "", email: "", dob: "", region: "",
        travelStyle: "", interests: [], budget: "", context: ""
      };
    } catch (e) {
      return {
        name: "", email: "", dob: "", region: "",
        travelStyle: "", interests: [], budget: "", context: ""
      };
    }
  });

  const [points, setPoints] = useState(0);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem("cityai_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("cityai_screen", screen);
  }, [screen]);

  // Actions
  const addPoints = (count = 10) => setPoints(prev => prev + count);
  const resetPoints = () => setPoints(0);

  const handleLandingAction = (action) => {
    if (action === "signup") {
      setScreen("signup");
    } else {
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

  const logout = () => {
    localStorage.removeItem("cityai_user");
    localStorage.removeItem("cityai_screen");
    window.location.reload();
  };

  const value = {
    screen, setScreen,
    category, setCategory,
    isDev, setIsDev,
    user, setUser,
    points, addPoints, resetPoints,
    handleLandingAction,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
