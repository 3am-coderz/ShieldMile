import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LayoutDashboard, FileText, AlertTriangle, BarChart3, Shield, Settings, Award, ChevronLeft, X, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const SIDEBAR_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Predictive Analytics", icon: BarChart3 },
  { label: "Policies", icon: FileText },
  { label: "Claims", icon: FileText },
  { label: "Fraud Alerts", icon: AlertTriangle },
  { label: "NCB Analytics", icon: Award },
  { label: "Settings", icon: Settings },
];

const METRICS = [
  { label: "Active Policies", value: "1,284", color: "text-primary" },
  { label: "Claims This Week", value: "47", color: "text-warning" },
  { label: "Loss Ratio", value: "38%", color: "text-safe" },
  { label: "Fraud Flagged", value: "3", color: "text-triggered" },
  { label: "Avg Worker Streak", value: "2.3 wks", color: "text-streak" },
];

const CDI_ZONES = [
  { zone: "Velachery", cdi: 71, level: "High" },
  { zone: "Adyar", cdi: 58, level: "Medium" },
  { zone: "T-Nagar", cdi: 52, level: "Medium" },
  { zone: "Anna Nagar", cdi: 38, level: "Low" },
  { zone: "OMR", cdi: 31, level: "Low" },
];

const CLAIMS_CHART = [
  { trigger: "Rain", claims: 28 },
  { trigger: "Heat", claims: 8 },
  { trigger: "AQI", claims: 5 },
  { trigger: "Curfew", claims: 4 },
  { trigger: "Cyclone", claims: 2 },
];

const ZONE_TABLE = [
  { zone: "Velachery", risk: "High", cdi: 71, policies: 342, claims: 18, streak: "1.8 wks" },
  { zone: "Adyar", risk: "Medium", cdi: 58, policies: 287, claims: 11, streak: "2.4 wks" },
  { zone: "T-Nagar", risk: "Medium", cdi: 52, policies: 301, claims: 9, streak: "2.7 wks" },
  { zone: "Anna Nagar", risk: "Low", cdi: 38, policies: 198, claims: 6, streak: "3.1 wks" },
  { zone: "OMR", risk: "Low", cdi: 31, policies: 156, claims: 3, streak: "3.8 wks" },
];

const STATIC_CLAIMS = [
  { id: "ZPT-48291", zone: "Velachery", trigger: "Heavy Rain", cdi: 76, payout: "₹320", streak: "3 weeks", status: "Approved" },
  { id: "BLK-29103", zone: "Adyar", trigger: "Heavy Rain", cdi: 68, payout: "₹240", streak: "1 week", status: "Approved" },
  { id: "ZPT-55621", zone: "T-Nagar", trigger: "Heat Wave", cdi: 71, payout: "₹160", streak: "0 weeks", status: "Processing" },
];

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [fraudModal, setFraudModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data States
  const [liveClaims, setLiveClaims] = useState<any[]>(STATIC_CLAIMS);
  const [livePolicies, setLivePolicies] = useState<any[]>([]);
  
  // Auth States
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminIdentity, setAdminIdentity] = useState<any>(null);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const performDashboardFetch = async (u: string, p: string, initial = false) => {
    if (!initial) setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('shieldmile-dashboard', {
        body: { username: u.trim(), password: p }
      });

      if (error || !data) {
        if (initial) {
          toast.error("Invalid credentials. Access denied.");
          setAdminPassword("");
        } else {
          toast.error("Server synchronization failed. Check connection.");
        }
        return false;
      }

      // Map Data
      setAdminIdentity(data.admin);
      
      const mappedClaims = data.claims?.map((c: any) => ({
        id: c.workers?.partner_id || "Unregistered",
        zone: c.workers?.zone || "Unknown",
        trigger: c.trigger_type,
        cdi: c.cdi_score,
        payout: `₹${c.payout_amount}`,
        streak: `${c.workers?.ncb_streak || 0} weeks`,
        status: (c.status || "Approved").charAt(0).toUpperCase() + (c.status || "Approved").slice(1)
      })) || [];
      
      setLiveClaims(mappedClaims);
      setLivePolicies(data.policies || []);
      setAdminUnlocked(true);
      
      if (!initial) toast.success("Dashboard data synchronized with live servers.");
      return true;
    } catch (err: any) {
      toast.error(`System Error: ${err.message}`);
      return false;
    } finally {
      setAdminLoginLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    await performDashboardFetch(adminUsername, adminPassword, true);
  };

  const cdiColor = (v: number) => v > 65 ? "text-triggered" : v >= 50 ? "text-warning" : "text-safe";
  const statusColor = (s: string) => {
    const low = s.toLowerCase();
    if (low === "approved" || low === "active") return "badge-safe";
    if (low === "processing") return "badge-warning";
    return "badge-triggered";
  };

  if (!adminUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="card-surface p-8 max-w-sm w-full animate-slide-up shadow-2xl border-primary/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Shield size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground leading-none tracking-tighter">GuardCenter</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">ShieldMile Admin Access</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2 px-1">Authority ID</label>
              <input
                type="text"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                placeholder="Manager Username"
                className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-2 px-1">Encryption Key</label>
              <div className="relative">
                <input
                  type={showAdminPw ? "text" : "password"}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-background border border-border rounded-xl px-4 pr-12 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
                <button type="button" onClick={() => setShowAdminPw(!showAdminPw)} className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors">
                  {showAdminPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={!adminUsername || !adminPassword || adminLoginLoading} className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl mt-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
              {adminLoginLoading ? <Loader2 size={20} className="animate-spin" /> : "Establish Connection"}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border">
             <button onClick={() => navigate(-1)} className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest flex items-center justify-center gap-2 w-full transition-colors">
               <ChevronLeft size={14} /> Revert to Dispatch
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} shrink-0 bg-card border-r border-border transition-all duration-500 ease-in-out flex flex-col`}>
        <div className="p-6 border-b border-border">
          <ShieldMileLogo size="sm" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${activeTab === item.label ? "bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"}`}
            >
              <item.icon size={18} className={activeTab === item.label ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-border bg-muted/20 space-y-4">
          <div className="px-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1.5 opacity-50">Operational Auth</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <p className="text-sm font-black truncate text-foreground">{adminIdentity?.full_name}</p>
            </div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-tighter mt-0.5">{adminIdentity?.role}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setAdminUnlocked(false)} className="flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-triggered uppercase tracking-widest transition-colors px-1 group">
               <X size={14} className="group-hover:rotate-90 transition-transform" /> Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center px-6 gap-4 shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground transition-transform">
            {sidebarOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
          </Button>
          
          <div className="flex items-center gap-2 flex-1">
            <Shield size={22} className="text-primary" />
            <h2 className="font-black text-lg tracking-tighter uppercase">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
               variant="outline" 
               size="sm" 
               onClick={() => performDashboardFetch(adminUsername, adminPassword)}
               disabled={isRefreshing}
               className="h-9 px-4 rounded-xl border-border bg-background hover:bg-muted text-xs font-black uppercase tracking-widest gap-2 transition-all active:scale-95"
            >
              {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span className="hidden md:inline">Sync Data</span>
            </Button>
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
               <Settings size={18} className="text-primary" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === "Overview" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {METRICS.map((m, i) => (
                  <div key={m.label} className="card-surface p-5 border-l-4 border-primary/10 group hover:border-primary hover:bg-primary/[0.02] transition-all cursor-default relative overflow-hidden">
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-70">{m.label}</p>
                       <p className={`text-2xl font-black ${m.color} group-hover:translate-x-1 transition-transform`}>{m.value}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                       <Shield size={48} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div className="card-surface p-6 h-[400px] flex flex-col border-primary/10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                       <p className="text-sm font-black uppercase tracking-tighter">CDI Risk Spectrum — Live</p>
                       <p className="text-[10px] text-muted-foreground font-bold font-mono">NODE_TAMILNADU_CHENNAI_NORTH</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-safe" />
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Signal: Active</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    {CDI_ZONES.map(z => (
                      <div key={z.zone} className="group cursor-default">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-black uppercase tracking-tight text-foreground/80">{z.zone}</span>
                          <span className={`${cdiColor(z.cdi)} font-black text-sm`}>{z.cdi} <span className="text-[10px] opacity-70">CDI</span></span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/30 overflow-hidden border border-border/10">
                          <div className={`h-full rounded-full transition-all duration-[1500ms] ease-out ${z.cdi > 65 ? "bg-triggered shadow-[0_0_10px_rgba(255,95,95,0.3)]" : z.cdi >= 50 ? "bg-warning shadow-[0_0_10px_rgba(255,183,77,0.3)]" : "bg-safe shadow-[0_0_10px_rgba(77,182,172,0.3)]"}`} style={{ width: `${z.cdi}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-surface p-6 h-[400px] flex flex-col border-primary/10">
                  <div className="mb-6">
                     <p className="text-sm font-black uppercase tracking-tighter">Claims Intake Frequency</p>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Aggregated Weekly Variance</p>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CLAIMS_CHART}>
                        <defs>
                          <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="trigger" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: "900" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: "900" }} axisLine={false} tickLine={false} />
                        <Tooltip 
                           contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)", padding: "12px" }}
                           itemStyle={{ fontSize: "12px", fontWeight: "black", textTransform: "uppercase" }}
                           cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                        />
                        <Bar dataKey="claims" radius={[8, 8, 0, 0]} fill="url(#primaryGradient)">
                          {CLAIMS_CHART.map((_, i) => <Cell key={i} className="hover:opacity-80 transition-opacity cursor-pointer" />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Table Sections */}
              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                    <div className="card-surface p-0 overflow-hidden border-primary/10">
                      <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
                         <p className="text-sm font-black uppercase tracking-widest">Network Operational Status</p>
                         <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-safe" />
                            <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                         </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                              {["Zone Name", "Profile", "Current CDI", "Active Coverage", "Avg Streak"].map(h => (
                                <th key={h} className="py-4 px-6 font-black uppercase tracking-widest opacity-70">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {ZONE_TABLE.map(r => (
                              <tr key={r.zone} className="hover:bg-primary/[0.03] transition-colors group cursor-default">
                                <td className="py-4 px-6 font-black group-hover:translate-x-1 transition-transform">{r.zone}</td>
                                <td className="py-4 px-6"><span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest ${r.risk === "High" ? "bg-triggered/20 text-triggered border border-triggered/30" : r.risk === "Medium" ? "bg-warning/20 text-warning border border-warning/30" : "bg-safe/20 text-safe border border-safe/30"}`}>{r.risk}</span></td>
                                <td className="py-4 px-6 font-black text-sm"><span className={cdiColor(r.cdi)}>{r.cdi}</span></td>
                                <td className="py-4 px-6 font-bold text-muted-foreground">{r.policies} Workers</td>
                                <td className="py-4 px-6 font-black text-primary">{r.streak}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                 </div>
                 
                 <div>
                    <div className="card-surface p-6 border-primary/10 h-full">
                       <p className="text-sm font-black uppercase tracking-widest mb-6">Strategic Alerts</p>
                       <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-triggered/5 border border-triggered/20 relative overflow-hidden group hover:bg-triggered/10 transition-all cursor-pointer">
                             <div className="flex items-start gap-3 relative z-10">
                                <AlertTriangle className="text-triggered shrink-0" size={18} />
                                <div>
                                   <p className="text-[10px] font-black text-triggered uppercase mb-1">Anomalous Activity</p>
                                   <p className="text-xs font-bold leading-tight">Worker ID UBR-56712 reported claim from flood-inactive zone Anna Nagar.</p>
                                </div>
                             </div>
                             <div className="absolute top-0 right-0 w-16 h-16 bg-triggered/5 -rotate-45 translate-x-8 -translate-y-8" />
                          </div>
                          
                          <div className="p-4 rounded-xl bg-safe/5 border border-safe/20 relative overflow-hidden group hover:bg-safe/10 transition-all cursor-pointer">
                             <div className="flex items-start gap-3 relative z-10">
                                <Award className="text-safe shrink-0" size={18} />
                                <div>
                                   <p className="text-[10px] font-black text-safe uppercase mb-1">Streak Landmark</p>
                                   <p className="text-xs font-bold leading-tight">342 Workers in Adyar reached 5-week NCB streak today.</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "Claims" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase">Claims Logistics</h1>
                    <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">{liveClaims.length} EVENTS RECORDED IN EPOCH</p>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" className="h-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Filter: Current Week</Button>
                     <Button className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">Export Manifest</Button>
                  </div>
               </div>
               
               <div className="card-surface p-0 overflow-hidden border-primary/10">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      {["Worker Identity", "Operational Zone", "Environmental Trigger", "CDI Impact", "Payout Matrix", "NCB Impact", "Status"].map(h => (
                        <th key={h} className="py-4 px-6 font-black uppercase tracking-widest opacity-70">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {liveClaims.map((r, idx) => (
                      <tr key={idx} className="hover:bg-primary/[0.03] transition-colors group cursor-default">
                        <td className="py-5 px-6">
                           <div className="flex flex-col">
                              <span className="font-black text-primary text-xs tracking-tighter">{r.id}</span>
                              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">verified_partner</span>
                           </div>
                        </td>
                        <td className="py-5 px-6 font-bold uppercase">{r.zone}</td>
                        <td className="py-5 px-6">
                           <span className="flex items-center gap-2 font-black">
                              <div className={`w-2 h-2 rounded-full ${r.trigger.includes('Rain') ? 'bg-indigo-400' : 'bg-warning'}`} />
                              {r.trigger}
                           </span>
                        </td>
                        <td className={`py-5 px-6 font-black text-base ${cdiColor(r.cdi)}`}>{r.cdi}</td>
                        <td className="py-5 px-6 font-black text-sm">{r.payout}</td>
                        <td className="py-5 px-6 text-muted-foreground font-bold italic">{r.streak} Session</td>
                        <td className="py-5 px-6">
                           <button onClick={() => r.status === "Flagged" && setFraudModal(true)} className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border transition-all ${statusColor(r.status)} ${r.status === "Flagged" ? "hover:scale-105 active:scale-95 shadow-lg shadow-triggered/20" : "opacity-80"}`}>
                             {r.status}
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!["Overview", "Claims"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center p-24 opacity-50 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-[2.5rem] bg-muted/20 border-2 border-border animate-pulse flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
                  <Shield size={40} className="text-muted-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-warning flex items-center justify-center border-4 border-background text-black font-black text-xs">!</div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-1">Subsystem Restricted</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
                  The <span className="text-primary">{activeTab}</span> analytics module is currently in early-access staging. Full deployment scheduled for session midnight.
                </p>
              </div>
              <Button variant="outline" className="h-10 px-6 rounded-xl border-border font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-primary-foreground transform transition-all hover:scale-105 active:scale-95">Check Progress Log</Button>
            </div>
          )}
        </main>
      </div>

      {/* Fraud Alert Modal */}
      <Dialog open={fraudModal} onOpenChange={setFraudModal}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-sm rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <div className="bg-triggered/10 p-6 border-b border-triggered/20">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-triggered text-white flex items-center justify-center shadow-lg shadow-triggered/30 animate-bounce">
                   <AlertTriangle size={24} />
                </div>
                <div>
                   <h3 className="font-black uppercase tracking-tighter text-triggered text-lg italic">Fraud Matrix Hit</h3>
                   <p className="text-[10px] font-bold text-triggered/70 uppercase tracking-widest">Protocol Breakdown</p>
                </div>
             </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4 text-xs font-bold leading-relaxed opacity-80">
              <p>GPS TELEMETRY MISMATCH: Worker reported claim in Anna Nagar, but sensor beacon detected presence in OMR Zone (Adyar Node).</p>
              <p>CDI VARIANCE: Actual OMR CDI was <span className="text-safe">28</span> (Secure), below the trigger threshold.</p>
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                 <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 italic">Resolution Status</p>
                 <p className="text-sm font-black text-primary">CLAIM BLOCKED — EXCLUSION APPLIED</p>
              </div>
            </div>
            <Button onClick={() => setFraudModal(false)} className="w-full h-12 bg-foreground text-background font-black uppercase tracking-widest rounded-xl hover:bg-foreground/90 transition-all active:scale-95">Acknowledged</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
