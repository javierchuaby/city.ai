import { useState } from "react";

/**
 * Custom Hook: usePoints
 * Manages user gamification state and point logic.
 * 
 * @returns {Object} { points, addPoints, resetPoints }
 */
export default function usePoints() {
  const [points, setPoints] = useState(0);

  const addPoints = (count = 10) => setPoints(prev => prev + count);
  const resetPoints = () => setPoints(0);

  return { points, addPoints, resetPoints };
}
