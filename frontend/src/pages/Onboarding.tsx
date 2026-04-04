import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { saveWorkerData, type Platform, type Zone, PLATFORMS, ZONES, validatePartnerId } from "@/lib/shieldmile";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    platform: "" as Platform | "",
    partnerId: "",
    zone: "" as Zone | "",
    weeklyEarnings: "",
    upiId: "",
  });

  const update = (field: keyof typeof formData, value: string) => 
    setFormData(prev => ({ ...prev, [field]: value }));

  const generateMockPhone = () => {
    const p = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    setFormData(prev => ({ ...prev, phone: p }));
    toast("Phone Verified", { description: p });
  };

  const handleCreateAccount = async () => {
    if (!validatePartnerId(formData.partnerId, formData.platform as Platform)) {
      toast.error(`Invalid Partner ID format for ${formData.platform}`);
      return;
    }

    setLoading(true);
    
    // Save to Supabase Workers Table
    const { data: newWorker, error } = await supabase
      .from('workers')
      .insert({
        name: formData.name,
        phone: formData.phone,
        partner_id: formData.partnerId,
        platform: formData.platform,
        zone: formData.zone,
        base_weekly_earnings: Number(formData.weeklyEarnings),
        upi_id: formData.upiId,
        ncb_streak: 0,
        auth_hash: formData.password
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase registration error:", error);
      toast.error(`Registration failed: ${error.message}`);
      setLoading(false);
      return;
    }

    // Save to local cache
    saveWorkerData({
      id: newWorker.id,
      name: formData.name,
      phone: formData.phone,
      partnerId: formData.partnerId,
      platform: formData.platform as Platform,
      zone: formData.zone as Zone,
      weeklyEarnings: Number(formData.weeklyEarnings),
      upiId: formData.upiId,
      ncbStreak: 0
    });

    setLoading(false);
    navigate("/policy");

    setLoading(false);
    navigate("/policy");
  };

  return (
    <div className="page-container flex items-center justify-center p-6 sm:p-12">
      <div className="card-surface p-8 max-w-sm w-full animate-slide-up relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-secondary/50">
           <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
         </div>
         
         <div className="mb-6"><ShieldMileLogo size="sm" /></div>

         {step === 1 && (
           <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold">Personal Profile</h2>
             
             <div>
                <label className="text-xs font-semibold text-muted-foreground ml-1">Full Legal Name</label>
                <input 
                  autoComplete="off"
                  type="text" 
                  value={formData.name} onChange={e => update("name", e.target.value)}
                  className="w-full mt-1 h-11 bg-background border border-border rounded-lg px-3 text-sm focus:border-primary transition-colors"
                  placeholder="e.g. Ramesh Kumar"
                />
             </div>

             <div>
                <label className="text-xs font-semibold text-muted-foreground ml-1">Account Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} onChange={e => update("password", e.target.value)}
                    className="w-full mt-1 h-11 bg-background border border-border rounded-lg px-3 pr-10 text-sm focus:border-primary transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[18px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
             </div>

             <div>
                <label className="text-xs font-semibold text-muted-foreground ml-1">Phone Number</label>
                <div className="flex gap-2 mt-1">
                   <input value={formData.phone} onChange={e => update("phone", e.target.value.replace(/[^0-9]/g, ''))} maxLength={10} className="flex-1 h-11 bg-background border border-border rounded-lg px-3 text-sm focus:border-primary transition-colors" placeholder="Enter 10-digit mobile" />
                   <button type="button" onClick={() => {
                     if (formData.phone.length === 10) {
                       toast("Phone Verified ✓", { description: `+91 ${formData.phone}` });
                     } else {
                       toast.error("Enter a valid 10-digit number");
                     }
                   }} className="h-11 px-4 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold hover:bg-secondary/80 active:scale-95 transition-all">
                     Verify
                   </button>
                </div>
             </div>

             <div className="pt-4 flex items-center justify-between">
                <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground">Back to Login</button>
                <button 
                  onClick={() => setStep(2)} 
                  disabled={!formData.name || !formData.phone || !formData.password}
                  className="h-11 px-6 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Continue
                </button>
             </div>
           </div>
         )}

         {step === 2 && (
           <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold">Work Identity</h2>
             
             <div>
               <label className="text-xs font-semibold text-muted-foreground ml-1">Platform Partner</label>
               <select 
                 value={formData.platform} onChange={e => update("platform", e.target.value)}
                 className="w-full mt-1 h-11 bg-background border border-border rounded-lg px-3 text-sm focus:border-primary appearance-none custom-select"
               >
                 <option value="" disabled>Select Platform...</option>
                 {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
             </div>

             <div>
               <label className="text-xs font-semibold text-muted-foreground ml-1">Partner ID</label>
               <input 
                 type="text" value={formData.partnerId} onChange={e => update("partnerId", e.target.value.toUpperCase())}
                 className="w-full mt-1 h-11 bg-background border border-border rounded-lg px-3 text-sm font-mono uppercase focus:border-primary"
                 placeholder="e.g. ZPT-48201"
               />
             </div>

             <div>
               <label className="text-xs font-semibold text-muted-foreground ml-1">Primary Operating Zone</label>
               <select 
                 value={formData.zone} onChange={e => update("zone", e.target.value)}
                 className="w-full mt-1 h-11 bg-background border border-border rounded-lg px-3 text-sm focus:border-primary appearance-none custom-select"
               >
                 <option value="" disabled>Select Zone...</option>
                 {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
               </select>
             </div>

             <div className="pt-4 flex justify-between">
               <button onClick={() => setStep(1)} className="text-sm text-muted-foreground font-semibold hover:text-foreground">Back</button>
               <button 
                  onClick={() => setStep(3)} 
                  disabled={!formData.platform || !formData.partnerId || !formData.zone}
                  className="h-11 px-6 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50 hover:bg-primary/90 active:scale-95 transition-all"
               >
                  Continue
               </button>
             </div>
           </div>
         )}

         {step === 3 && (
           <div className="space-y-4 animate-fade-in">
             <h2 className="text-xl font-bold">Financial Link</h2>

             <div>
                <label className="text-xs font-semibold text-muted-foreground ml-1">Average Weekly Earnings (₹)</label>
                <div className="relative mt-1">
                   <span className="absolute left-3 top-3 text-muted-foreground font-medium">₹</span>
                   <input 
                     type="number" value={formData.weeklyEarnings} onChange={e => update("weeklyEarnings", e.target.value)}
                     className="w-full h-11 bg-background border border-border rounded-lg pl-7 pr-3 text-sm font-bold focus:border-primary"
                     placeholder="e.g. 5000"
                   />
                </div>
                <p className="text-[10px] text-muted-foreground ml-1 mt-1">We sync this with your platform account.</p>
             </div>

             <div>
                <label className="text-xs font-semibold text-muted-foreground ml-1">UPI ID for Payouts</label>
                <input 
                  type="text" value={formData.upiId} onChange={e => update("upiId", e.target.value.toLowerCase())}
                  className="w-full mt-1 h-11 bg-background border border-border rounded-lg px-3 text-sm font-medium focus:border-primary"
                  placeholder="e.g. ramesh@okicici"
                />
             </div>

             <div className="pt-6 flex justify-between">
               <button disabled={loading} onClick={() => setStep(2)} className="text-sm text-muted-foreground font-semibold hover:text-foreground">Back</button>
               <button 
                  onClick={handleCreateAccount} 
                  disabled={!formData.weeklyEarnings || !formData.upiId || loading}
                  className="h-11 px-6 bg-safe text-safe-foreground rounded-lg font-bold shadow-lg shadow-safe/20 disabled:opacity-50 hover:bg-safe/90 active:scale-95 transition-all flex items-center gap-2"
               >
                  {loading ? <><Loader2 size={16} className="animate-spin"/> Linking...</> : "Verify & Activate"}
               </button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
