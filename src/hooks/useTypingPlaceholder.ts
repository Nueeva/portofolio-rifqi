import { useState, useEffect, useCallback } from "react";

interface UseTypingPlaceholderOptions {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export const useTypingPlaceholder = ({
  texts,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: UseTypingPlaceholderOptions) => {
  const [placeholder, setPlaceholder] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const currentText = texts[textIndex];

  useEffect(() => {
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsTyping(false);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (isTyping) {
      if (placeholder.length < currentText.length) {
        const timer = setTimeout(() => {
          setPlaceholder(currentText.slice(0, placeholder.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timer);
      } else {
        setIsPaused(true);
      }
    } else {
      if (placeholder.length > 0) {
        const timer = setTimeout(() => {
          setPlaceholder(placeholder.slice(0, -1));
        }, deletingSpeed);
        return () => clearTimeout(timer);
      } else {
        setTextIndex((prev) => (prev + 1) % texts.length);
        setIsTyping(true);
      }
    }
  }, [placeholder, isTyping, isPaused, currentText, texts.length, typingSpeed, deletingSpeed, pauseDuration]);

  return placeholder;
};
