import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { MapPin, ShieldHalf, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { saveWorkerData, type Platform, PLATFORMS } from "@/lib/shieldmile";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [partnerId, setPartnerId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !password) return;

    setLoading(true);
    
    // First query supabase for the worker
    const { data: workerData, error } = await supabase
      .from('workers')
      .select('*')
      .eq('partner_id', partnerId)
      .single();

    if (error || !workerData) {
      toast.error("Account not found. Please register as a new worker.");
      setLoading(false);
      return;
    }

    // Verify Password (Dummy check since we are using plain text auth bypass for demo)
    if (workerData.auth_hash !== password) {
      toast.error("Incorrect password.");
      setLoading(false);
      return;
    }

    // Setup local session
    saveWorkerData({
      id: workerData.id,
      name: workerData.name,
      phone: workerData.phone,
      partnerId: workerData.partner_id,
      platform: workerData.platform as Platform,
      zone: workerData.zone as any,
      weeklyEarnings: workerData.base_weekly_earnings,
      upiId: workerData.upi_id,
      ncbStreak: workerData.ncb_streak
    });

    toast.success(`Welcome back, ${workerData.name}`);
    
    // Check if they have an active policy to bypass onboarding
    const { data: policyData } = await supabase
      .from('policies')
      .select('tier')
      .eq('worker_id', workerData.id)
      .eq('status', 'active')
      .single();

    setLoading(false);

    if (policyData) {
      const w = JSON.parse(sessionStorage.getItem("shieldmile_worker") || "{}");
      w.selectedTier = policyData.tier;
      sessionStorage.setItem("shieldmile_worker", JSON.stringify(w));
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="page-container flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-pattern opacity-10 pointer-events-none" />
      <div className="card-surface p-8 max-w-sm w-full animate-fade-in-up border border-border/50 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <ShieldMileLogo size="lg" />
          <p className="mt-4 text-xs text-muted-foreground text-center font-medium bg-secondary/50 px-3 py-1 rounded-full w-max">
            Decentralized Coverage Protocol
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Platform Partner ID</label>
            <Input 
              autoComplete="off"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
              placeholder="e.g. ZPT-49291" 
              className="bg-background border-border h-12 text-center uppercase tracking-wider font-mono text-sm shadow-inner transition-all hover:border-primary/50 focus:border-primary" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Password</label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="bg-background border-border h-12 text-center tracking-widest font-mono text-lg shadow-inner transition-all hover:border-primary/50 focus:border-primary" 
            />
          </div>

          <Button 
            disabled={!partnerId || !password || loading} 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {loading ? "Authenticating..." : "Connect Identity"}
          </Button>
          
          <div className="pt-4 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-3">New Delivery Partner?</p>
            <Button
               type="button" 
               onClick={() => navigate("/onboarding")} 
               variant="outline" 
               className="w-full text-xs font-semibold h-10 hover:bg-secondary active:scale-[0.98] transition-transform"
            >
               Create Account Registration
            </Button>
          </div>
        </form>
      </div>

      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-10 -right-20 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
    </div>
  );
}
