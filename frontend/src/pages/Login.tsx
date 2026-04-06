import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { MapPin, ShieldHalf, LayoutDashboard, KeyRound, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";
import { saveWorkerData, type Platform } from "@/lib/shieldmile";
import { toast } from "sonner";

const ZONE_DATA: Record<string, { city: string; hubs: number; workers: number }> = {
  "600": { city: "Chennai Central", hubs: 5, workers: 8492 },
  "601": { city: "Chennai North", hubs: 3, workers: 4120 },
  "602": { city: "Chennai West", hubs: 4, workers: 5830 },
  "603": { city: "Chennai South", hubs: 3, workers: 3950 },
  "560": { city: "Bangalore Urban", hubs: 7, workers: 12340 },
  "562": { city: "Bangalore Rural", hubs: 2, workers: 1870 },
  "400": { city: "Mumbai Central", hubs: 8, workers: 15620 },
  "401": { city: "Mumbai Suburban", hubs: 5, workers: 9440 },
  "110": { city: "New Delhi", hubs: 6, workers: 11200 },
  "500": { city: "Hyderabad", hubs: 5, workers: 7830 },
  "700": { city: "Kolkata", hubs: 4, workers: 6120 },
  "411": { city: "Pune", hubs: 4, workers: 5490 },
  "380": { city: "Ahmedabad", hubs: 3, workers: 4200 },
  "302": { city: "Jaipur", hubs: 2, workers: 2650 },
};

export default function Login() {
  const navigate = useNavigate();
  const [partnerId, setPartnerId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [pincode, setPincode] = useState("");
  const [mapCenter, setMapCenter] = useState("Chennai, Tamil Nadu");
  const [activeZone, setActiveZone] = useState("Chennai (5 Hubs)");
  const [activeWorkers, setActiveWorkers] = useState("8,492 Protected");

  const getBackendWorkerId = () => "demo-001";

  const handlePincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length < 4) {
      toast.error("Please enter a valid pincode.");
      return;
    }
    const prefix = pincode.slice(0, 3);
    const zone = ZONE_DATA[prefix];
    setMapCenter(`${pincode}, India`);
    if (zone) {
      setActiveZone(`${zone.city} (${zone.hubs} Hubs)`);
      setActiveWorkers(`${zone.workers.toLocaleString("en-IN")} Protected`);
      toast.success(`Coverage found: ${zone.city}`);
    } else {
      setActiveZone("Expanding Soon");
      setActiveWorkers("Coming Soon");
      toast.info("This zone is not yet covered.");
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !password) return;

    setLoading(true);

    try {
      // Step 1: Authenticate against Supabase (primary user database)
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

      if (workerData.auth_hash !== password) {
        toast.error("Incorrect password.");
        setLoading(false);
        return;
      }

      // Step 2: Also register session with FastAPI backend for CDI engine
      try {
        const backendWorkerId = getBackendWorkerId();
        const apiRes = await fetch(apiUrl("/api/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: backendWorkerId, password: "password123" })
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          localStorage.setItem("jwt_token", apiData.access_token);
        }
      } catch { /* FastAPI offline is non-blocking */ }

      localStorage.setItem("logged_in_user", partnerId);

      saveWorkerData({
        id: workerData.id,
        backendId: getBackendWorkerId(),
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
        navigate("/policy");
      }

    } catch (err) {
      toast.error("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex md:grid md:grid-cols-2">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center p-8 bg-[hsl(216_39%_8%)] border-r border-[#1a2536] relative overflow-hidden h-full min-h-screen max-h-screen">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(216_39%_6%)] to-transparent" />

        <div className="relative z-10 w-full max-w-lg mx-auto">
          <div className="animate-slide-up mb-6 flex justify-start">
            <ShieldMileLogo />
          </div>

          <div className="animate-slide-up">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight tracking-tight">
              Parametric coverage for gig economy professionals.
            </h1>
            <p className="mt-3 mb-6 text-sm text-muted-foreground leading-relaxed max-w-md">
              Protect your multi-app income against severe weather and city-wide disruptions with instant smart-contract payouts powered by real-time data.
            </p>
          </div>

          <div className="w-full animate-slide-up stagger-1 bg-[#1a2536]/80 p-4 rounded-xl border border-[#233145] backdrop-blur-md mb-6 shadow-2xl">
            <form onSubmit={handlePincodeSearch} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <MapPin size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                <Input
                  placeholder="Enter Pincode for Coverage..."
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="bg-[hsl(216_39%_6%)] border-[#233145] pl-9 h-11 text-sm"
                  maxLength={6}
                />
              </div>
              <Button type="submit" variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 h-11 px-5 font-bold">
                Check Zone
              </Button>
            </form>
            <div className="w-full h-[280px] rounded-lg overflow-hidden border border-[#233145] relative shadow-inner">
              <div className="absolute -top-[70px] -bottom-[30px] -left-[150px] -right-[50px]">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapCenter)}&t=m&z=13&ie=UTF8&iwloc=near&output=embed`}
                  title="Google Maps Coverage Tracker"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-4 animate-slide-up stagger-2">
            <div className="flex-1 flex items-center gap-3 p-3.5 rounded-xl bg-[#1a2536]/60 border border-[#233145]">
              <MapPin className="text-primary" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active Zones</p>
                <p className="text-xs font-semibold text-foreground mt-0.5 transition-all duration-300">{activeZone}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 p-3.5 rounded-xl bg-[#1a2536]/60 border border-[#233145]">
              <ShieldHalf className="text-safe" size={20} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Active Shields</p>
                <p className="text-xs font-semibold text-safe mt-0.5 transition-all duration-300">{activeWorkers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 w-full animate-fade-in-up relative">
        <div className="w-full max-w-[420px]">
          <div className="text-center md:hidden mb-12">
            <ShieldMileLogo />
          </div>

          <div className="bg-[#1a2536]/30 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-[#233145]/60 shadow-[0_0_60px_rgba(0,0,0,0.4)] relative overflow-hidden">

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-safe/10 rounded-full blur-[60px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Partner Portal</h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Connect your partner ID to resume your active session and monitor your coverage.
              </p>
            </div>

            <form onSubmit={handleStartShift} className="space-y-6 mt-8 relative z-10">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2.5">Platform Partner ID</label>
                <Input
                  autoComplete="off"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                  placeholder="e.g. ZPT-49291"
                  className="bg-background/50 border-[#233145] h-12 uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2.5">Secure Passkey</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/50 pl-10 pr-10 border-[#233145] h-12 tracking-widest font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                disabled={!partnerId || !password || loading}
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 rounded-xl"
              >
                <LayoutDashboard className="mr-2" size={18} />
                {loading ? "Authenticating..." : "Start Coverage Shift"}
              </Button>

              <div className="pt-8 border-t border-[#233145]/60 text-center space-y-4">
                <p className="text-xs text-muted-foreground font-medium">Don't have a ShieldMile ID yet?</p>
                <Button
                  type="button"
                  onClick={() => navigate("/onboarding")}
                  variant="outline"
                  className="w-full h-11 border-[#233145] hover:bg-secondary/50 font-bold rounded-xl"
                >
                  Register New Account
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    saveWorkerData({
                      id: "demo-001",
                      backendId: "demo-001",
                      name: "Ramesh Kumar",
                      phone: "9876543210",
                      partnerId: "ZPT-49291",
                      platform: "Zomato" as Platform,
                      zone: "T. Nagar" as any,
                      weeklyEarnings: 5200,
                      upiId: "ramesh@okicici",
                      ncbStreak: 3,
                      selectedTier: "Standard" as any
                    });
                    toast.success("Demo mode activated!");
                    navigate("/dashboard");
                  }}
                  variant="ghost"
                  className="w-full h-10 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  🧪 Enter Demo Mode (Skip Login)
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
