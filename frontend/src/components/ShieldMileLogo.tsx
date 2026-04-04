import { Shield } from "lucide-react";

export function ShieldMileLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };
  const iconSizes = { sm: 18, md: 24, lg: 32 };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <Shield size={iconSizes[size]} className="text-primary" fill="hsl(var(--primary))" />
        <span className={`${sizes[size]} font-extrabold tracking-tight text-foreground`}>
          Shield<span className="text-primary">Mile</span>
        </span>
      </div>
      <span className="text-xs text-muted-foreground tracking-widest uppercase">Every mile protected</span>
    </div>
  );
}
