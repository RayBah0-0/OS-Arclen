import { useState, useEffect, useRef, useCallback } from "react";
import { 
  BarChart3, Users, DollarSign, Target, ChevronRight,
  Phone, CalendarX2, CheckCircle2, Trophy, ArrowRight, Activity, 
  Calendar, X, Plus, Trash2, AlertTriangle, Check, Clock, Sparkles
} from "lucide-react";
import { supabase } from "./supabase";

// ── Arclen OS Constants ──
const GOAL = 6000;
const APP_PASSCODE = "ArclenOS2026!";

// ── Utility functions ──
function initials(name: string) {
  return name.trim().split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0,2) || "??";
}
function todayStr() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}
function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  // Handle both ISO strings and YYYY-MM-DD
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ── Toast System ──
let toastId = 0;
type Toast = { id: number; message: string; type: "success" | "info" | "warning" };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const show = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const ToastContainer = () => (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className="toast-enter" style={{
          padding: "12px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
          background: t.type === "success" ? "rgba(16, 185, 129, 0.95)" : t.type === "warning" ? "rgba(245, 158, 11, 0.95)" : "rgba(79, 172, 254, 0.95)",
          color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)",
          animation: "toastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {t.type === "success" ? <Check size={16} /> : t.type === "warning" ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  );

  return { show, ToastContainer };
}

// ── Animated Number Component ──
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) return;

    const duration = 600;
    const start = performance.now();
    
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ── Inline Modal ──
function InlineModal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
      animation: "fadeIn 0.2s ease"
    }} onClick={onClose}>
      <div className="glass-panel" style={{
        padding: "2rem", width: "100%", maxWidth: 400, borderRadius: 20,
        animation: "modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-main)" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Confirm Dialog ──
function ConfirmDialog({ isOpen, onClose, onConfirm, message }: any) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
      animation: "fadeIn 0.2s ease"
    }} onClick={onClose}>
      <div className="glass-panel" style={{
        padding: "2rem", width: "100%", maxWidth: 380, borderRadius: 20, textAlign: "center",
        animation: "modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }} onClick={e => e.stopPropagation()}>
        <AlertTriangle size={32} color="var(--status-danger)" style={{ marginBottom: "1rem" }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)", marginBottom: 8 }}>Are you sure?</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: "1.5rem" }}>{message}</div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm} style={{ flex: 1, background: "var(--status-danger)", boxShadow: "0 4px 15px rgba(239,68,68,0.3)" }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════
// ── MAIN APP
// ══════════════════════════════
export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [tab, setTab] = useState("os");
  const [loginName, setLoginName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { 
    async function fetchUsers() {
      const { data, error } = await supabase.from('profiles').select('username');
      if (!error && data) {
        setAllUsers(data.map(u => u.username));
      }
      setIsLoading(false);
    }
    fetchUsers();

    // Only re-fetch users list on insert or delete to avoid re-renders when metrics change
    const channel = supabase.channel('profiles-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleLogin() {
    const name = loginName.trim();
    if (!passcode.trim()) {
      setLoginError("Enter the Arclen OS passcode.");
      return;
    }
    if (passcode !== APP_PASSCODE) {
      setLoginError("Incorrect passcode.");
      return;
    }
    if (!name) {
      setLoginError("Enter your username.");
      return;
    }
    setLoginError("");
    
    // Check if user exists, if not create them
    const { data, error } = await supabase.from('profiles').select('username').eq('username', name).single();
    
    if (error || !data) {
      const { error: insertError } = await supabase.from('profiles').insert([{ username: name, mrr: 0, calls: 0 }]);
      if (insertError) {
        toast.show("Error connecting to database", "warning");
        return;
      }
      setAllUsers(prev => [...new Set([...prev, name])]);
    }
    
    setUser(name);
    toast.show(`Welcome back, ${name}!`);
  }

  function handleLockApp() {
    setUser(null);
    setTab("os");
    setLoginName("");
    setPasscode("");
    setLoginError("");
  }

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-fade-in" style={{ opacity: 0.5 }}>Syncing Arclen Cloud...</div>
    </div>;
  }

  if (!user) {
    return (
      <LoginScreen
        name={loginName}
        setName={setLoginName}
        passcode={passcode}
        setPasscode={setPasscode}
        onLogin={handleLogin}
        loginError={loginError}
      />
    );
  }

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}>
      <toast.ToastContainer />

      {/* Header */}
      <div className="animate-fade-in stagger-1" style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 12, 
            background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--accent-glow)", overflow: "hidden"
          }}>
            <img src="/Logo.png" alt="Arclen Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", letterSpacing: "-0.5px" }}>
              {getGreeting()}, <span className="text-gradient">{user}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{getFormattedDate()}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", background: "var(--bg-card)", padding: "0.5rem", borderRadius: "16px", border: "1px solid var(--border-light)", flexWrap: "wrap" }}>
          <NavTabs tab={tab} setTab={setTab} />
          <div style={{ width: "1px", height: "24px", background: "var(--border-light)", margin: "0 4px" }} />
          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={handleLockApp}>Lock App</button>
        </div>
      </div>

      {/* Subheader */}
      <div className="animate-fade-in stagger-1" style={{ fontSize: 13, color: "var(--text-sub)", marginBottom: "2rem" }}>
        Arclen OS Cloud · Road to ${GOAL.toLocaleString()}/mo
      </div>
      
      <div className="animate-fade-in stagger-2">
        {tab === "os" && <AgencyOS user={user} toast={toast} setTab={setTab} />}
        {tab === "crm" && <CRM user={user} toast={toast} />}
        {tab === "team" && <TeamBoard allUsers={allUsers} currentUser={user} />}
      </div>
    </div>
  );
}

// ── Nav Tabs ──
function NavTabs({ tab, setTab }: { tab: string, setTab: (v: string)=>void }) {
  const tabs = [
    { id: "os", label: "Dashboard", icon: <BarChart3 size={16} /> },
    { id: "crm", label: "My CRM", icon: <Target size={16} /> },
    { id: "team", label: "Team Board", icon: <Users size={16} /> }
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {tabs.map((t) => (
        <button 
          key={t.id} 
          onClick={() => setTab(t.id)} 
          className={`nav-tab ${tab === t.id ? 'active' : ''}`}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Login Screen ──
function LoginScreen({ name, setName, passcode, setPasscode, onLogin, loginError }: any) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="glass-panel animate-fade-in" style={{ padding: "3rem", width: "100%", maxWidth: "440px", borderRadius: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "var(--accent-glow)", overflow: "hidden" }}>
            <img src="/Logo.png" alt="Arclen Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>Arclen OS Access</div>
          <div style={{ fontSize: 14, color: "var(--text-sub)" }}>Internal use only. Enter the passcode and your username to continue.</div>
        </div>
        
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>PASSCODE</label>
          <input
            className="input-field"
            type="password"
            placeholder="Enter passcode"
            value={passcode}
            onChange={e => {
              setPasscode(e.target.value);
              if (loginError) setLoginError("");
            }}
            onKeyDown={e => e.key === "Enter" && onLogin()}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            style={{ padding: "14px 16px", fontSize: 16, marginBottom: 16 }}
          />
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>USERNAME</label>
          <input 
            className="input-field" 
            placeholder="e.g. Rayane" 
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (loginError) setLoginError("");
            }} 
            onKeyDown={e => e.key === "Enter" && onLogin()} 
            style={{ padding: "14px 16px", fontSize: 16, marginBottom: 16 }}
          />
          {loginError && (
            <div style={{ fontSize: 13, color: "var(--status-warning)", marginBottom: 12 }}>
              {loginError}
            </div>
          )}
          <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15 }} onClick={onLogin}>
            Unlock Arclen OS <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════
// ── DASHBOARD
// ══════════════════════════════
function AgencyOS({ user, toast, setTab }: { user: string; toast: any; setTab: (v: string) => void }) {
  const [mrr, setMrr] = useState(0);
  const [calls, setCalls] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [mrrModal, setMrrModal] = useState(false);
  const [mrrInput, setMrrInput] = useState("");
  const [closedRev, setClosedRev] = useState(0);

  // Editable blockers
  const [blockers, setBlockers] = useState<{id: string; title: string; desc: string; color: string}[]>([]);
  const [newBlocker, setNewBlocker] = useState({ title: "", desc: "" });
  const [showBlockerForm, setShowBlockerForm] = useState(false);

  async function fetchAll() {
    const { data: profile } = await supabase.from('profiles').select('mrr, calls').eq('username', user).single();
    if (profile) {
      setMrr(profile.mrr);
      setCalls(profile.calls);
    }

    const { data: leadData } = await supabase.from('leads').select('value').eq('username', user).eq('status', 'closed');
    if (leadData) {
      setClosedRev(leadData.reduce((a, l) => a + (l.value || 0), 0));
    }

    const { data: blockerData } = await supabase.from('blockers').select('*').eq('username', user).order('created_at', { ascending: true });
    if (blockerData) {
      setBlockers(blockerData.map(b => ({ id: b.id, title: b.title, desc: b.description, color: b.color })));
    }
    setLoaded(true);
  }

  useEffect(() => {
    fetchAll();

    // Realtime subscription for metrics & blockers
    const metricsChannel = supabase.channel(`metrics-${user}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `username=eq.${user}` }, (payload: any) => {
        setMrr(payload.new.mrr);
        setCalls(payload.new.calls);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blockers', filter: `username=eq.${user}` }, () => {
        fetchAll(); // Refresh blockers when any change happens
      })
      .subscribe();

    return () => { supabase.removeChannel(metricsChannel); };
  }, [user]);

  async function handleMrrUpdate() {
    const v = parseFloat(mrrInput);
    if (!isNaN(v) && v >= 0) { 
      const { error } = await supabase.from('profiles').update({ mrr: v }).eq('username', user);
      if (!error) {
        setMrr(v); setMrrModal(false); setMrrInput("");
        toast.show(`MRR updated to $${v.toLocaleString()}`);
      }
    }
  }

  async function addCall() { 
    const n = calls + 1;
    const { error } = await supabase.from('profiles').update({ calls: n }).eq('username', user);
    if (!error) {
      setCalls(n);
      toast.show(`Call #${n} logged!`);
    }
  }

  async function resetCalls() {
    if (calls === 0) {
      toast.show("Calls are already at 0", "info");
      return;
    }

    const { error } = await supabase.from('profiles').update({ calls: 0 }).eq('username', user);
    if (!error) {
      setCalls(0);
      toast.show("Call count reset", "warning");
    } else {
      toast.show("Could not reset call count", "warning");
    }
  }

  async function addBlocker() {
    if (!newBlocker.title.trim()) return;
    const colors = ["var(--status-danger)", "var(--status-warning)", "var(--accent-blue)", "var(--accent-cyan)"];
    const color = colors[blockers.length % colors.length];
    
    const { error } = await supabase.from('blockers').insert([
      { username: user, title: newBlocker.title.trim(), description: newBlocker.desc.trim(), color }
    ]);

    if (!error) {
      setNewBlocker({ title: "", desc: "" });
      setShowBlockerForm(false);
      toast.show("Blocker added");
    }
  }

  async function removeBlocker(id: string) {
    const { error } = await supabase.from('blockers').delete().eq('id', id);
    if (!error) toast.show("Blocker resolved ✓", "info");
  }

  const gap = Math.max(0, GOAL - mrr);
  const pct = Math.min(100, Math.round((mrr/GOAL)*100));

  if (!loaded) return <div style={{ color: "var(--text-sub)" }}>Connecting to Arclen Cloud...</div>;

  return (
    <div className="animate-fade-in stagger-3">
      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button className="btn-primary" onClick={() => setMrrModal(true)} style={{ padding: "10px 20px" }}>
          <DollarSign size={16} /> Update MRR
        </button>
        <button className="btn-secondary" onClick={addCall} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Phone size={16} /> Log Call
        </button>
        <button className="btn-secondary" onClick={resetCalls} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--status-danger)" }}>
          <Trash2 size={16} /> Reset Calls
        </button>
        <button className="btn-secondary" onClick={() => setTab("crm")} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <InlineModal isOpen={mrrModal} onClose={() => setMrrModal(false)} title="Update Monthly Revenue">
        <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>CURRENT MRR ($)</label>
        <input 
          className="input-field" type="number" placeholder="e.g. 2500" autoFocus
          value={mrrInput} onChange={e => setMrrInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleMrrUpdate()}
          style={{ marginBottom: 16, fontSize: 18, padding: "14px 16px" }}
        />
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleMrrUpdate}>
          <Check size={16} /> Save
        </button>
      </InlineModal>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MetricCard label="Monthly Goal" value={`$${GOAL.toLocaleString()}`} icon={<Target size={20} color="var(--accent-cyan)" />} sub="Target MRR" />
        <MetricCard label="Current MRR" value={<><AnimatedNumber value={mrr} prefix="$" /></>} icon={<DollarSign size={20} color="#10B981" />} 
          sub={<span style={{color: "var(--accent-cyan)", cursor: "pointer", fontWeight: 500}} onClick={() => setMrrModal(true)}>Update</span>} />
        <MetricCard label="Calls Today" value={<AnimatedNumber value={calls} />} icon={<Phone size={20} color="var(--accent-blue)" />} 
          sub={
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: "var(--accent-cyan)", cursor: "pointer", fontWeight: 500 }} onClick={addCall}>+ Log Call</span>
              <span style={{ color: "var(--status-danger)", cursor: "pointer", fontWeight: 500 }} onClick={resetCalls}>Reset</span>
            </div>
          } />
        <MetricCard label="Closed Revenue" value={<><AnimatedNumber value={closedRev} prefix="$" /></>} icon={<CheckCircle2 size={20} color="var(--status-success)" />} sub="From deals" />
        <MetricCard label="Gap to Goal" value={<><AnimatedNumber value={gap} prefix="$" /></>} icon={<Activity size={20} color="#F59E0B" />} sub="Remaining" />
      </div>

      {/* Progress */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Goal Progress</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text-main)" }}>Road to $6K/month</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }} className="text-gradient"><AnimatedNumber value={pct} suffix="%" /></div>
        </div>
        <div className="progress-track" style={{ height: "12px", background: "rgba(0,0,0,0.5)" }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ fontSize: 14, color: "var(--text-sub)", marginTop: "1rem" }}>
          {mrr === 0 ? "Connect to cloud to sync metrics." : mrr < GOAL ? `$${gap.toLocaleString()} away — stay focused.` : "🎉 Goal achieved!"}
        </div>
      </div>

      {/* Info Grids */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} className="text-gradient" />
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)" }}>Current Blockers</div>
            </div>
            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setShowBlockerForm(!showBlockerForm)}>
              {showBlockerForm ? <X size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {showBlockerForm && (
            <div style={{ marginBottom: "1rem", padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--border-light)" }}>
              <input className="input-field" placeholder="Blocker title" value={newBlocker.title} onChange={e => setNewBlocker(p => ({...p, title: e.target.value}))} style={{ marginBottom: 8 }} />
              <input className="input-field" placeholder="Description (optional)" value={newBlocker.desc} onChange={e => setNewBlocker(p => ({...p, desc: e.target.value}))} onKeyDown={e => e.key === "Enter" && addBlocker()} style={{ marginBottom: 8 }} />
              <button className="btn-primary" onClick={addBlocker} style={{ width: "100%", padding: "8px" }}>Add Blocker</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {blockers.map(b => (
              <div key={b.id} style={{ display: "flex", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid var(--border-light)", alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, marginTop: 6, flexShrink: 0, boxShadow: `0 0 10px ${b.color}` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-main)" }}>{b.title}</div>
                  {b.desc && <div style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 4, lineHeight: 1.4 }}>{b.desc}</div>}
                </div>
                <button onClick={() => removeBlocker(b.id)} style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer", padding: 4, opacity: 0.5 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem" }}>
            <Trophy size={18} className="text-gradient" />
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)" }}>Mentor Playbook</div>
            <div className="badge" style={{ background: "rgba(79, 172, 254, 0.1)", color: "var(--accent-blue)", fontSize: 9 }}>Shared</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              ["Opener", `"Hey [Name], I'm Rayane — early high school grad, young entrepreneur. I noticed a few issues with your online presence."`],
              ["Be honest", "Being 17 is your selling point — own it."],
              ["BOLT method", "Identify tone and cadence only."],
              ["Feel felt found", "Acknowledge → normalize → redirect."]
            ].map(([l, t]) => (
              <div key={l} style={{ padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{l}</div>
                <div style={{ fontSize: 14, color: "var(--text-main)", lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ──
function MetricCard({ label, value, icon, sub }: any) {
  return (
    <div className="glass-panel" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
        <div style={{ background: "var(--bg-glass)", padding: 6, borderRadius: 8 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-main)", marginBottom: "0.25rem" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-sub)" }}>{sub}</div>
    </div>
  );
}

// ══════════════════════════════
// ── CRM
// ══════════════════════════════
function CRM({ user, toast }: { user: string; toast: any }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name: "", industry: "", status: "booked", value: "", note: "", dateBooked: todayISO(), meetingDate: "" });
  const [loaded, setLoaded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function fetchLeads() {
    const { data, error } = await supabase.from('leads').select('*').eq('username', user).order('created_at', { ascending: false });
    if (!error && data) {
      setLeads(data.map(l => ({
        id: l.id,
        name: l.name,
        industry: l.industry,
        status: l.status,
        value: l.value,
        note: l.note,
        dateBooked: l.date_booked,
        meetingDate: l.meeting_date,
        createdAt: l.created_at
      })));
    }
    setLoaded(true);
  }

  useEffect(() => {
    fetchLeads();

    const channel = supabase.channel(`leads-${user}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `username=eq.${user}` }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function addLead() {
    if (!form.name.trim()) return;
    const { error } = await supabase.from('leads').insert([{
      username: user,
      name: form.name.trim(),
      industry: form.industry.trim(),
      status: form.status,
      value: parseFloat(form.value) || 0,
      note: form.note.trim(),
      date_booked: form.dateBooked,
      meeting_date: form.meetingDate || null
    }]);

    if (!error) {
      setForm({ name: "", industry: "", status: "booked", value: "", note: "", dateBooked: todayISO(), meetingDate: "" });
      toast.show(`${form.name} added!`);
    } else {
      toast.show("Sync failed", "warning");
    }
  }

  async function confirmDelete() {
    if (deleteTarget !== null) {
      const { error } = await supabase.from('leads').delete().eq('id', deleteTarget);
      if (!error) {
        setDeleteTarget(null);
        toast.show(`Lead removed`, "warning");
      }
    }
  }

  async function changeStatus(id: string, st: string) { 
    const { error } = await supabase.from('leads').update({ status: st }).eq('id', id);
    if (!error) toast.show(`Status updated`);
  }

  const booked = leads.filter(l => l.status === "booked").length;
  const noshow = leads.filter(l => l.status === "noshow").length;
  const closed = leads.filter(l => l.status === "closed").length;
  const rate = (booked + noshow + closed) > 0 ? Math.round(((booked + closed) / (booked + noshow + closed)) * 100) + "%" : "—";

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  if (!loaded) return <div style={{ color: "var(--text-sub)" }}>Cloud CRM sync...</div>;

  return (
    <div className="animate-fade-in stagger-3">
      <ConfirmDialog 
        isOpen={deleteTarget !== null} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={confirmDelete} 
        message="This lead will be permanently removed from your pipeline." 
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MetricCard label="Booked Meetings" value={<AnimatedNumber value={booked} />} icon={<CalendarX2 size={20} color="var(--accent-blue)" />} sub="Active leads" />
        <MetricCard label="No-shows" value={<AnimatedNumber value={noshow} />} icon={<Clock size={20} color="var(--status-warning)" />} sub="Missed opps" />
        <MetricCard label="Closed Won" value={<AnimatedNumber value={closed} />} icon={<CheckCircle2 size={20} color="var(--status-success)" />} sub="Deals secured" />
        <MetricCard label="Show Rate" value={rate} icon={<Activity size={20} color="var(--accent-cyan)" />} sub="Conversion metric" />
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)", marginBottom: "1rem" }}>
          New Opportunity
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>NAME / COMPANY</label>
            <input className="input-field" placeholder="Contact name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>INDUSTRY</label>
            <input className="input-field" placeholder="e.g. Health" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>VALUE ($)</label>
            <input className="input-field" type="number" placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>STATUS</label>
            <select className="input-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="booked">Booked</option>
              <option value="noshow">No-show</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>DATE BOOKED</label>
            <input className="input-field" type="date" value={form.dateBooked} onChange={e => setForm(f => ({ ...f, dateBooked: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>MEETING DATE</label>
            <input className="input-field" type="date" value={form.meetingDate} onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem" }}>
            <input className="input-field" placeholder="Notes..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ flex: 1 }} onKeyDown={e=>e.key==="Enter"&&addLead()}/>
            <button className="btn-primary" onClick={addLead} style={{ whiteSpace: "nowrap" }}>Add Lead</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["all", "booked", "noshow", "closed"].map(id => (
          <button key={id} className={`btn-secondary ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.map(l => (
          <div key={l.id} className="glass-panel" style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-glass)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
              {initials(l.name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{l.name} <span className="badge" style={{ marginLeft: 8, fontSize: 10 }}>{l.status}</span></div>
              <div style={{ fontSize: 13, color: "var(--text-sub)", marginTop: 4 }}>
                {l.industry} • ${l.value.toLocaleString()}
                {l.note && <div style={{ marginTop: 6, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", borderLeft: "2px solid var(--accent-cyan)", fontStyle: "italic" }}>
                  "{l.note}"
                </div>}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={12} /> {formatDate(l.dateBooked)} {l.createdAt && <span style={{opacity: 0.6}}>({formatTime(l.createdAt)})</span>}
                </div>
                {l.meetingDate && <div style={{ fontSize: 11, color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Target size={12} /> {formatDate(l.meetingDate)}
                </div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["booked", "noshow", "closed"].filter(s => s !== l.status).map(s => (
                <button key={s} className="btn-secondary" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => changeStatus(l.id, s)}>Mark {s}</button>
              ))}
              <button className="btn-secondary" style={{ fontSize: 11, padding: "4px 8px", color: "var(--status-danger)" }} onClick={() => setDeleteTarget(l.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════
// ── TEAM BOARD
// ══════════════════════════════
function TeamBoard({ allUsers, currentUser }: any) {
  const [stats, setStats] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function loadTeamData() {
    // Optimized: Fetch all profiles and all leads for the whole team in two single queries
    const [ { data: profileList }, { data: allLeadsList } ] = await Promise.all([
      supabase.from('profiles').select('*').in('username', allUsers),
      supabase.from('leads').select('*').in('username', allUsers)
    ]);
    
    const results = allUsers.map((u: string) => {
      const metrics = profileList?.find(p => p.username === u) || { mrr: 0, calls: 0 };
      const leads = allLeadsList?.filter(l => l.username === u) || [];

      const closed = leads.filter(l => l.status === "closed");
      const closedVal = closed.reduce((a, l) => a + (l.value || 0), 0);
      const booked = leads.filter(l => l.status === "booked").length;
      const noshow = leads.filter(l => l.status === "noshow").length;
      const total = booked + noshow + closed.length;
      const showRate = total > 0 ? Math.round(((booked + closed.length) / (booked + noshow + closed.length)) * 100) : 0;
      
      return { user: u, mrr: metrics.mrr, calls: metrics.calls, closed: closed.length, closedVal, booked, showRate };
    });
    
    setStats(results.sort((a, b) => b.closedVal - a.closedVal));
    setLoaded(true);
  }

  useEffect(() => {
    loadTeamData();
    
    // Realtime leaderboards!
    const channel = supabase.channel('team-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { loadTeamData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => { loadTeamData(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [allUsers]);

  if (!loaded) return <div style={{ color: "var(--text-sub)" }}>Syncing Agency Cloud...</div>;

  const totalRev = stats.reduce((a, s) => a + s.closedVal, 0);
  const totalMRR = stats.reduce((a, s) => a + s.mrr, 0);

  return (
    <div className="animate-fade-in stagger-3">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MetricCard label="Agency Revenue" value={`$${totalRev.toLocaleString()}`} icon={<DollarSign size={20} color="var(--status-success)" />} sub="Total won" />
        <MetricCard label="Combined MRR" value={`$${totalMRR.toLocaleString()}`} icon={<Activity size={20} color="var(--accent-blue)" />} sub="Team total" />
      </div>

      <div className="glass-panel">
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-light)", fontSize: 18, fontWeight: 600 }}>Agency Leaderboard</div>
        <div style={{ padding: "1.5rem" }}>
          {stats.map((r, i) => (
            <div key={r.user} style={{ display: "grid", gridTemplateColumns: "40px auto 1fr auto", gap: "1rem", alignItems: "center", padding: "1rem", borderRadius: 12, background: r.user === currentUser ? "var(--bg-glass)" : "transparent", marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials(r.user)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{r.user} {r.user === currentUser && " (YOU)"}</div>
                <div style={{ fontSize: 13, color: "var(--text-sub)" }}>{r.closed} Closed • {r.showRate}% Show Rate</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--status-success)" }}>${r.closedVal.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>${r.mrr.toLocaleString()} MRR</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
