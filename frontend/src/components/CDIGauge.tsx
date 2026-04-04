import { useEffect, useState } from "react";

interface CDIGaugeProps {
  value: number;
  size?: number;
}

export function CDIGauge({ value, size = 220 }: CDIGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  
  const getColor = (v: number) => {
    if (v > 65) return "hsl(0 84% 60%)";
    if (v > 50) return "hsl(38 92% 50%)";
    return "hsl(142 71% 45%)";
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(216 30% 20%)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={getColor(animatedValue)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s" }}
        />
        <text x="100" y="85" textAnchor="middle" className="text-3xl font-bold" fill={getColor(animatedValue)} fontSize="36" fontWeight="800" fontFamily="Inter">
          {animatedValue}
        </text>
        <text x="100" y="108" textAnchor="middle" fill="hsl(215 20% 65%)" fontSize="11" fontFamily="Inter">
          CDI Score
        </text>
      </svg>
    </div>
  );
}
