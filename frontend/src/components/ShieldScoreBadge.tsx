import { useEffect, useState } from "react";

interface ShieldScoreBadgeProps {
  score: number;
  size?: number;
}

export function ShieldScoreBadge({ score, size = 160 }: ShieldScoreBadgeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s <= 70) return "hsl(0 84% 60%)";
    if (s <= 79) return "hsl(38 92% 50%)";
    return "hsl(142 71% 45%)";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(216 30% 20%)" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={getColor(animatedScore)} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <text x="70" y="65" textAnchor="middle" fill={getColor(animatedScore)} fontSize="32" fontWeight="800" fontFamily="Inter">
          {animatedScore}
        </text>
        <text x="70" y="85" textAnchor="middle" fill="hsl(215 20% 65%)" fontSize="10" fontFamily="Inter">
          ShieldScore
        </text>
      </svg>
    </div>
  );
}
