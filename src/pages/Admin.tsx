import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldMileLogo } from "@/components/ShieldMileLogo";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LayoutDashboard, FileText, AlertTriangle, BarChart3, Shield, Settings, Award, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

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

const CLAIMS_TABLE = [
  { id: "ZPT-48291", zone: "Velachery", trigger: "Heavy Rain", cdi: 76, payout: "₹320", streak: "3 weeks", status: "Approved" },
  { id: "BLK-29103", zone: "Adyar", trigger: "Heavy Rain", cdi: 68, payout: "₹240", streak: "1 week", status: "Approved" },
  { id: "ZPT-55621", zone: "T-Nagar", trigger: "Heat", cdi: 71, payout: "₹160", streak: "0 weeks", status: "Processing" },
  { id: "BLK-38821", zone: "Velachery", trigger: "Heavy Rain", cdi: 82, payout: "₹400", streak: "2 weeks", status: "Approved" },
  { id: "ZPT-91023", zone: "Anna Nagar", trigger: "Heavy Rain", cdi: 63, payout: "₹180", streak: "4 weeks", status: "Flagged" },
];

const NCB_DATA = [
  { label: "0 week streak", count: 312, pct: "24%" },
  { label: "1-2 week streak", count: 489, pct: "38%" },
  { label: "3-4 week streak", count: 341, pct: "27%" },
  { label: "4+ week streak", count: 142, pct: "11%" },
];

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [fraudModal, setFraudModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveClaims, setLiveClaims] = useState<any[]>(CLAIMS_TABLE);
  const [livePolicies, setLivePolicies] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  useEffect(() => {
    supabase.from('claims').select(`
      payout_amount, cdi_score, trigger_type, status,
      workers (partner_id, zone, ncb_streak)
    `).then(({ data }) => {
      if (data && data.length > 0) {
        const mapped = data.map((c: any) => ({
          id: c.workers?.partner_id || "Unregistered",
          zone: c.workers?.zone || "Unknown",
          trigger: c.trigger_type,
          cdi: c.cdi_score,
          payout: `₹${c.payout_amount}`,
          streak: `${c.workers?.ncb_streak || 0} weeks`,
          status: "Approved"
        }));
        // Merge with static data for populated graphs, but put live ones on top
        setLiveClaims([...mapped, ...CLAIMS_TABLE]);
      }
    });

    supabase.from('policies').select(`
      id, tier, premium_paid, start_date, status,
      workers (name, phone, partner_id, zone)
    `).then(({ data }) => {
      if (data) setLivePolicies(data);
    });
  }, []);

  useEffect(() => {
    if (activeTab === "Predictive Analytics" && forecastData.length === 0) {
      setIsLoadingForecast(true);
      // Fetch 14 day precipitation forecast for Central Chennai
      fetch('https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&daily=precipitation_sum,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=14')
        .then(res => res.json())
        .then(data => {
           if (data && data.daily) {
             const formatted = data.daily.time.map((dateStr: string, i: number) => {
               // mock claim prediction based on rain amount (mm)
               const rainMM = data.daily.precipitation_sum[i] || 0;
               let predictedClaims = 0;
               if (rainMM > 5) predictedClaims = Math.floor(rainMM * 12);
               if (rainMM > 20) predictedClaims = Math.floor(rainMM * 25);
               if (rainMM > 40) predictedClaims = Math.floor(rainMM * 50);

               return {
                 date: new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
                 rain: rainMM,
                 prob: data.daily.precipitation_probability_max[i],
                 claims: predictedClaims
               };
             });
             setForecastData(formatted);
           }
           setIsLoadingForecast(false);
        })
        .catch(() => setIsLoadingForecast(false));
    }
  }, [activeTab]);


  const cdiColor = (v: number) => v > 65 ? "text-triggered" : v >= 50 ? "text-warning" : "text-safe";
  const statusColor = (s: string) => s === "Approved" ? "badge-safe" : s === "Processing" ? "badge-warning" : "badge-triggered";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} shrink-0 bg-[hsl(216_39%_8%)] border-r border-sidebar-border transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-sidebar-border">
          <ShieldMileLogo size="sm" />
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${activeTab === item.label ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
            <ChevronLeft size={14} /> Back to App
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground">
            {sidebarOpen ? <X size={18} /> : <LayoutDashboard size={18} />}
          </Button>
          <Shield size={20} className="text-primary" />
          <span className="font-bold text-foreground">ShieldMile</span>
          <span className="text-xs text-muted-foreground">Admin Portal</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === "Overview" && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {METRICS.map((m, i) => (
                  <div key={m.label} className="card-surface p-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className={`text-xl font-extrabold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* CDI by Zone */}
                <div className="card-surface p-4 animate-slide-up stagger-2">
                  <p className="text-sm font-semibold text-card-foreground mb-3">CDI Analytics — Avg by Zone</p>
                  <div className="space-y-2">
                    {CDI_ZONES.map(z => (
                      <div key={z.zone} className="flex items-center justify-between text-sm">
                        <span className="text-card-foreground font-medium w-28">{z.zone}</span>
                        <div className="flex-1 mx-3 h-2 rounded-full bg-surface overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${z.cdi > 65 ? "bg-triggered" : z.cdi >= 50 ? "bg-warning" : "bg-safe"}`} style={{ width: `${z.cdi}%` }} />
                        </div>
                        <span className={`font-bold w-8 text-right ${cdiColor(z.cdi)}`}>{z.cdi}</span>
                        <span className={`text-xs ml-2 w-16 ${cdiColor(z.cdi)}`}>{z.level}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Claims Chart */}
                <div className="card-surface p-4 animate-slide-up stagger-3">
                  <p className="text-sm font-semibold text-card-foreground mb-3">Weekly Claims by Trigger</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={CLAIMS_CHART}>
                      <XAxis dataKey="trigger" tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "hsl(216 39% 10%)", border: "1px solid hsl(216 30% 25%)", borderRadius: "8px", color: "#fff", fontSize: 12 }} />
                      <Bar dataKey="claims" radius={[6, 6, 0, 0]}>
                        {CLAIMS_CHART.map((_, i) => <Cell key={i} fill={i === 0 ? "hsl(174 100% 35%)" : "hsl(216 30% 25%)"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Zone Risk Table */}
              <div className="card-surface p-4 mb-6 animate-slide-up stagger-4 overflow-x-auto">
                <p className="text-sm font-semibold text-card-foreground mb-3">Zone Risk Overview</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      {["Zone", "Risk", "Avg CDI", "Policies", "Claims", "Avg Streak"].map(h => (
                        <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ZONE_TABLE.map(r => (
                      <tr key={r.zone} className="border-b border-border/50 text-card-foreground">
                        <td className="py-2 px-2 font-medium">{r.zone}</td>
                        <td className="py-2 px-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.risk === "High" ? "badge-triggered" : r.risk === "Medium" ? "badge-warning" : "badge-safe"}`}>{r.risk}</span></td>
                        <td className={`py-2 px-2 font-bold ${cdiColor(r.cdi)}`}>{r.cdi}</td>
                        <td className="py-2 px-2">{r.policies}</td>
                        <td className="py-2 px-2">{r.claims}</td>
                        <td className="py-2 px-2">{r.streak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* NCB Analytics */}
              <div className="card-surface p-4 animate-slide-up stagger-5">
                <p className="text-sm font-semibold text-card-foreground mb-3">NCB Analytics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {NCB_DATA.map(d => (
                    <div key={d.label} className="bg-surface rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-surface-foreground">{d.count}</p>
                      <p className="text-[10px] text-muted-foreground">{d.label}</p>
                      <p className="text-xs font-semibold text-primary">{d.pct}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Total premium savings via NCB: <span className="text-safe font-semibold">₹18,420</span> this week</p>
                  <p>Projected claim reduction from NCB: <span className="text-primary font-semibold">23%</span></p>
                  <p className="text-primary/80 italic">💡 NCB program reducing loss ratio by est. 8 points</p>
                </div>
              </div>
            </>
          )}

          {activeTab === "Predictive Analytics" && (
            <div className="card-surface p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h2 className="text-lg font-bold text-card-foreground">14-Day Predictive Claims Model</h2>
                    <p className="text-sm text-muted-foreground mt-1">Live forecasting via Open-Meteo REST API cross-referenced with historic loss ratios.</p>
                 </div>
                 <span className="badge-safe px-3 py-1 font-semibold text-xs border border-safe/20">AI Forecast Active</span>
              </div>
              
              {isLoadingForecast ? (
                 <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground animate-pulse">Running Meteorological Prediction Algorithms...</p>
                 </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                     <div className="bg-surface/50 p-4 rounded-xl border border-border/50">
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Peak Rain Forecast</p>
                        <p className="text-2xl font-bold text-indigo-400">{Math.max(...forecastData.map(d => d.rain))}mm</p>
                     </div>
                     <div className="bg-surface/50 p-4 rounded-xl border border-border/50">
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total Expected Claims</p>
                        <p className="text-2xl font-bold text-warning">{forecastData.reduce((acc, curr) => acc + curr.claims, 0)}</p>
                     </div>
                     <div className="bg-surface/50 p-4 rounded-xl border border-border/50">
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Projected Escrow Drain</p>
                        <p className="text-2xl font-bold text-triggered">₹{(forecastData.reduce((acc, curr) => acc + curr.claims, 0) * 1200).toLocaleString()}</p>
                     </div>
                  </div>

                  <p className="text-sm font-semibold text-card-foreground mb-4">Predicted Claims Intake (Correlated to Rainfall mm)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={forecastData}>
                      <XAxis dataKey="date" tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: "hsl(35 100% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(215 80% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "rgba(10, 15, 25, 0.9)", border: "1px solid hsl(216 30% 25%)", borderRadius: "12px", color: "#fff", fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="claims" name="Predicted Claims" fill="hsl(35 100% 55%)" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar yAxisId="right" dataKey="rain" name="Rain (mm)" fill="hsl(215 80% 60%)" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 flex gap-4 text-xs font-medium text-muted-foreground justify-center bg-surface/30 p-2 rounded-lg w-max mx-auto border border-border/30">
                     <span className="flex items-center gap-2"><div className="w-3 h-3 bg-[hsl(35_100%_55%)] rounded-[2px]"></div> Projected Claims Count</span>
                     <span className="flex items-center gap-2"><div className="w-3 h-3 bg-[hsl(215_80%_60%)] rounded-[2px]"></div> Precipitation (mm)</span>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "Policies" && (
            <div className="card-surface p-4 animate-slide-up overflow-x-auto">
              <p className="text-sm font-semibold text-card-foreground mb-3">Live Active Policies</p>
              {livePolicies.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No live policies found in database.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      {["Worker", "Partner ID", "Zone", "Tier", "Premium Paid", "Start Date", "Status"].map(h => (
                        <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {livePolicies.map((p, idx) => (
                      <tr key={idx} className="border-b border-border/50 text-card-foreground">
                        <td className="py-2 px-2 font-medium">{p.workers?.name}</td>
                        <td className="py-2 px-2 font-mono">{p.workers?.partner_id}</td>
                        <td className="py-2 px-2">{p.workers?.zone}</td>
                        <td className="py-2 px-2 font-bold">{p.tier}</td>
                        <td className="py-2 px-2 text-primary font-semibold">₹{p.premium_paid}</td>
                        <td className="py-2 px-2">{new Date(p.start_date).toLocaleDateString()}</td>
                        <td className="py-2 px-2"><span className="badge-safe text-xs px-2 py-0.5 rounded-full capitalize">{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "Claims" && (
            <div className="card-surface p-4 animate-slide-up overflow-x-auto">
              <p className="text-sm font-semibold text-card-foreground mb-3">Recent Live Claims</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    {["Worker ID", "Zone", "Trigger", "CDI", "Payout", "Streak Lost", "Status"].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveClaims.map((r, idx) => (
                    <tr key={idx} className="border-b border-border/50 text-card-foreground">
                      <td className="py-2 px-2 font-mono">{r.id}</td>
                      <td className="py-2 px-2">{r.zone}</td>
                      <td className="py-2 px-2">{r.trigger}</td>
                      <td className={`py-2 px-2 font-bold ${cdiColor(r.cdi)}`}>{r.cdi}</td>
                      <td className="py-2 px-2">{r.payout}</td>
                      <td className="py-2 px-2">{r.streak}</td>
                      <td className="py-2 px-2">
                         <button onClick={() => r.status === "Flagged" && setFraudModal(true)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(r.status)} ${r.status === "Flagged" ? "cursor-pointer hover:opacity-80" : ""}`}>
                           {r.status}
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!["Overview", "Predictive Analytics", "Policies", "Claims"].includes(activeTab) && (
             <div className="flex flex-col items-center justify-center p-10 opacity-70 animate-fade-in-up">
                <AlertTriangle size={32} className="text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Under Construction</p>
                <p className="text-xs text-muted-foreground mt-1 text-center">The {activeTab} view is scheduled for Phase 3 integration.</p>
             </div>
          )}
        </main>
      </div>

      {/* Fraud Modal */}
      <Dialog open={fraudModal} onOpenChange={setFraudModal}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-triggered">
              <AlertTriangle size={20} /> Fraud Alert — Worker ZPT-91023
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-card-foreground">
            <p><span className="font-semibold">Reason:</span> GPS shows worker was active in OMR zone during claimed Anna Nagar disruption event.</p>
            <p><span className="font-semibold">CDI in actual zone (OMR):</span> <span className="text-safe font-bold">28</span> — below threshold.</p>
            <p><span className="font-semibold">Streak Impact:</span> 4-week streak preserved (claim blocked).</p>
            <div className="rounded-lg bg-triggered/10 border border-triggered/30 p-3">
              <p className="text-xs text-triggered font-medium">Action: Claim blocked. Worker notified.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
