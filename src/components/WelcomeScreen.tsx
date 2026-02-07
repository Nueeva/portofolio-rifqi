import { useState, useEffect } from "react";
import { Shield } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation sequence: show for 1.5 seconds then fade out
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1200);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1700);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center">
        {/* Logo Animation */}
        <div className="relative mb-6 inline-block">
          <div className="absolute inset-0 animate-ping">
            <Shield className="h-16 w-16 text-primary opacity-20" />
          </div>
          <Shield className="h-16 w-16 text-primary animate-pulse" />
        </div>

        {/* Brand Name */}
        <div className="overflow-hidden">
          <h1 
            className="text-4xl sm:text-5xl font-mono font-bold tracking-tight animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            Rifqi<span className="text-primary">A</span>
          </h1>
        </div>

        {/* Tagline */}
        <p 
          className="mt-4 text-muted-foreground animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          Cybersecurity Developer
        </p>

        {/* Loading bar */}
        <div 
          className="mt-8 mx-auto w-48 h-1 bg-secondary rounded-full overflow-hidden animate-fade-in"
          style={{ animationDelay: "700ms" }}
        >
          <div className="h-full bg-primary rounded-full animate-[loading_1.2s_ease-in-out]" />
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
