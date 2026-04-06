import { useState, useEffect, useCallback } from "react";

const GOAL = 6000;

const s = {
  card: { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem 1.25rem" },
  metricCard: { background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"0.875rem 1rem" },
  label: { fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 },
  val: { fontSize:22, fontWeight:500, color:"var(--color-text-primary)" },
  input: { fontSize:13, padding:"7px 10px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", outline:"none", width:"100%" },
  btn: { fontSize:13, padding:"7px 16px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", cursor:"pointer", whiteSpace:"nowrap" },
};

function initials(name) {
  return name.trim().split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2)||"??";
}
function todayStr() {
  return new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

const STATUS_COLORS = {
  booked:{ av:"#E6F1FB", avT:"#0C447C", badge:"#E6F1FB", badgeT:"#0C447C", label:"Booked" },
  noshow:{ av:"#FAEEDA", avT:"#633806", badge:"#FAEEDA", badgeT:"#633806", label:"No-show" },
  closed:{ av:"#EAF3DE", avT:"#27500A", badge:"#EAF3DE", badgeT:"#27500A", label:"Closed" },
};

async function loadShared(key, fallback) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : fallback; }
  catch { return fallback; }
}
async function saveShared(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("os");
  const [loginName, setLoginName] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => { loadShared("users", []).then(setAllUsers); }, []);

  async function handleLogin() {
    const name = loginName.trim();
    if (!name) return;
    const users = await loadShared("users", []);
    if (!users.includes(name)) {
      const next = [...users, name];
      await saveShared("users", next);
      setAllUsers(next);
    }
    setUser(name);
  }

  if (!user) return <LoginScreen name={loginName} setName={setLoginName} onLogin={handleLogin} allUsers={allUsers} />;

  return (
    <div style={{padding:"1.5rem 0", fontFamily:"var(--font-sans)"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem"}}>
        <div>
          <div style={{fontSize:20, fontWeight:500, color:"var(--color-text-primary)"}}>Agency OS</div>
          <div style={{fontSize:12, color:"var(--color-text-secondary)", marginTop:2}}>Road to ${GOAL.toLocaleString()} · {user}</div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <NavTabs tab={tab} setTab={setTab} />
          <button style={{...s.btn, fontSize:12}} onClick={()=>setUser(null)}>Switch user</button>
        </div>
      </div>
      {tab==="os" && <AgencyOS user={user} />}
      {tab==="crm" && <CRM user={user} />}
      {tab==="team" && <TeamBoard allUsers={allUsers} currentUser={user} />}
    </div>
  );
}

function NavTabs({tab, setTab}) {
  const tabs = [["os","Agency OS"],["crm","My CRM"],["team","Team Board"]];
  return (
    <div style={{display:"flex", gap:4, background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:3}}>
      {tabs.map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} style={{fontSize:12, padding:"5px 12px", borderRadius:"var(--border-radius-md)", border:"none", background:tab===k?"var(--color-background-primary)":"transparent", color:tab===k?"var(--color-text-primary)":"var(--color-text-secondary)", cursor:"pointer", fontWeight:tab===k?500:400}}>
          {l}
        </button>
      ))}
    </div>
  );
}

function LoginScreen({name, setName, onLogin, allUsers}) {
  return (
    <div style={{padding:"3rem 0", fontFamily:"var(--font-sans)", maxWidth:400}}>
      <div style={{fontSize:22, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6}}>Agency OS</div>
      <div style={{fontSize:13, color:"var(--color-text-secondary)", marginBottom:24}}>Road to $6K — Team Dashboard</div>
      <div style={s.card}>
        <div style={{fontSize:13, fontWeight:500, marginBottom:12, color:"var(--color-text-primary)"}}>Enter your username</div>
        <input style={{...s.input, marginBottom:10}} placeholder="e.g. Rayane" value={name}
          onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin()} autoFocus />
        <button style={{...s.btn, width:"100%", textAlign:"center"}} onClick={onLogin}>Continue ↗</button>
        {allUsers.length > 0 && (
          <div style={{marginTop:14, borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:12}}>
            <div style={{fontSize:11, color:"var(--color-text-tertiary)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em"}}>Team members</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {allUsers.map(u=>(
                <button key={u} style={{fontSize:12, padding:"4px 10px", borderRadius:20, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", cursor:"pointer"}}
                  onClick={()=>{ setName(u); }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgencyOS({user}) {
  const [mrr, setMrr] = useState(0);
  const [calls, setCalls] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadShared(`metrics:${user}`, {mrr:0, calls:0}).then(m=>{ setMrr(m.mrr); setCalls(m.calls); setLoaded(true); });
  }, [user]);

  async function save(newMrr, newCalls) {
    await saveShared(`metrics:${user}`, {mrr:newMrr, calls:newCalls});
  }

  function editMRR() {
    const v = prompt("Current monthly revenue? (numbers only)");
    if (v && !isNaN(v)) { const n=parseInt(v); setMrr(n); save(n,calls); }
  }
  function addCall() { const n=calls+1; setCalls(n); save(mrr,n); }

  const gap = Math.max(0, GOAL - mrr);
  const pct = Math.min(100, Math.round((mrr/GOAL)*100));

  if (!loaded) return <div style={{fontSize:13, color:"var(--color-text-secondary)"}}>Loading…</div>;

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.25rem"}}>
        {[["Monthly goal","$6,000","Target"],["Current MRR","$"+mrr.toLocaleString(),<span style={{color:"var(--color-text-info)",cursor:"pointer",fontSize:11}} onClick={editMRR}>update</span>],["Calls today",calls,<span style={{color:"var(--color-text-info)",cursor:"pointer",fontSize:11}} onClick={addCall}>+1 call</span>],["Gap to goal","$"+gap.toLocaleString(),"remaining"]].map(([l,v,sub],i)=>(
          <div key={i} style={s.metricCard}>
            <div style={s.label}>{l}</div>
            <div style={s.val}>{v}</div>
            <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:3}}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{...s.metricCard, marginBottom:"1.25rem"}}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}>
          <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>Progress to $6K/month</span>
          <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{pct}%</span>
        </div>
        <div style={{background:"var(--color-border-tertiary)", borderRadius:4, height:8}}>
          <div style={{height:8, borderRadius:4, background:"#1D9E75", width:pct+"%", transition:"width 0.6s"}} />
        </div>
        <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:8}}>
          {mrr===0?"Update your current MRR to track progress":mrr<GOAL?"$"+gap.toLocaleString()+" away — keep pushing":"Goal hit. Time to raise the ceiling."}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:"1.25rem"}}>
        <div style={s.card}>
          <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:12}}>Current blockers</div>
          {[["#E24B4A","Calls going badly","Script needs work. 30-60 calls/day but not converting."],["#EF9F27","No-shows","Prospects ghosting. Commitment isn't strong on close."],["#378ADD","Too many no's","Higher rejection rate. Possibly approach or lead quality."]].map(([c,t,d])=>(
            <div key={t} style={{display:"flex",gap:10,marginBottom:10,paddingBottom:10,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c,marginTop:5,flexShrink:0}} />
              <div>
                <div style={{fontSize:13,color:"var(--color-text-primary)"}}>{t}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={s.card}>
          <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:12}}>Mentor playbook</div>
          {[["Opener",`"Hey [Name], I'm Rayane — early high school grad, young entrepreneur. I noticed a few issues with your online presence. Mind having a quick conversation?"`],["Be honest","Drop the college story. Being 17 is your selling point — own it."],["BOLT method","Identify Bull / Owl / Lamb / Tiger by their hello. Adjust tone and cadence only."],["Feel felt found","Acknowledge → normalize → redirect with value."]].map(([l,t])=>(
            <div key={l} style={{marginBottom:10,paddingBottom:10,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3}}>{l}</div>
              <div style={{fontSize:13,color:"var(--color-text-primary)",lineHeight:1.5}}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CRM({user}) {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({name:"",industry:"",status:"booked",value:"",note:""});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadShared(`leads:${user}`, []).then(l=>{ setLeads(l); setLoaded(true); });
  }, [user]);

  async function saveLeads(next) { setLeads(next); await saveShared(`leads:${user}`, next); }

  function addLead() {
    if (!form.name.trim()) return;
    const lead = { id:Date.now(), name:form.name.trim(), industry:form.industry.trim(), status:form.status, value:parseFloat(form.value)||0, note:form.note.trim(), date:todayStr() };
    saveLeads([lead,...leads]);
    setForm({name:"",industry:"",status:"booked",value:"",note:""});
  }

  function deleteLead(id) { saveLeads(leads.filter(l=>l.id!==id)); }
  function changeStatus(id, st) { saveLeads(leads.map(l=>l.id===id?{...l,status:st}:l)); }

  const booked=leads.filter(l=>l.status==="booked").length;
  const noshow=leads.filter(l=>l.status==="noshow").length;
  const closed=leads.filter(l=>l.status==="closed").length;
  const showed=booked+closed;
  const total=booked+noshow+closed;
  const rate=total>0?Math.round((showed/total)*100)+"%":"—";

  const filtered = filter==="all"?leads:leads.filter(l=>l.status===filter);

  if (!loaded) return <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Loading…</div>;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:"1.25rem"}}>
        {[["Booked",booked],["No-shows",noshow],["Closed",closed],["Show rate",rate]].map(([l,v])=>(
          <div key={l} style={s.metricCard}><div style={s.label}>{l}</div><div style={s.val}>{v}</div></div>
        ))}
      </div>

      <div style={{...s.card, marginBottom:"1.25rem"}}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:12,color:"var(--color-text-primary)"}}>Add lead</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end",marginBottom:8}}>
          {[["Name","name","text","Business / contact name"],["Industry","industry","text","e.g. Health, Restaurant"]].map(([l,k,t,p])=>(
            <div key={k}><div style={{...s.label,marginBottom:4}}>{l}</div>
              <input style={s.input} type={t} placeholder={p} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
          ))}
          <div><div style={{...s.label,marginBottom:4}}>Status</div>
            <select style={s.input} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="booked">Booked</option>
              <option value="noshow">No-show</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button style={{...s.btn,height:34}} onClick={addLead}>Add ↗</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{...s.label,marginBottom:4}}>Value ($)</div>
            <input style={s.input} type="number" placeholder="Deal value" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} /></div>
          <div><div style={{...s.label,marginBottom:4}}>Notes</div>
            <input style={s.input} placeholder="Quick note…" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /></div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:"1rem"}}>
        {[["all","All"],["booked","Booked"],["noshow","No-shows"],["closed","Closed"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{fontSize:12,padding:"5px 14px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",background:filter===k?"var(--color-background-secondary)":"var(--color-background-primary)",color:filter===k?"var(--color-text-primary)":"var(--color-text-secondary)",cursor:"pointer",fontWeight:filter===k?500:400}}>{l}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.length===0 ? (
          <div style={{textAlign:"center",padding:"2rem",fontSize:13,color:"var(--color-text-tertiary)"}}>{leads.length===0?"No leads yet — add your first one above.":"No leads in this filter."}</div>
        ) : filtered.map(l=>{
          const sc=STATUS_COLORS[l.status];
          const others=["booked","noshow","closed"].filter(s=>s!==l.status);
          const industryVal = [l.industry, l.value>0?"$"+l.value.toLocaleString():null].filter(Boolean).join(" · ");
          return (
            <div key={l.id} style={{...s.card,display:"grid",gridTemplateColumns:"auto 1fr auto auto",gap:12,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:sc.av,color:sc.avT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,flexShrink:0}}>{initials(l.name)}</div>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{l.name}</div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{industryVal||"No industry set"}</div>
                {l.note&&<div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:3,fontStyle:"italic"}}>{l.note}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,fontWeight:500,background:sc.badge,color:sc.badgeT}}>{sc.label}</span>
                <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{l.date}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {others.map(o=>(
                  <button key={o} style={{fontSize:11,padding:"4px 10px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-secondary)",cursor:"pointer"}} onClick={()=>changeStatus(l.id,o)}>{STATUS_COLORS[o].label}</button>
                ))}
                <button style={{fontSize:11,padding:"4px 10px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-danger)",cursor:"pointer"}} onClick={()=>deleteLead(l.id)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamBoard({allUsers, currentUser}) {
  const [stats, setStats] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const results = await Promise.all(allUsers.map(async u => {
        const leads = await loadShared(`leads:${u}`, []);
        const metrics = await loadShared(`metrics:${u}`, {mrr:0, calls:0});
        const closed = leads.filter(l=>l.status==="closed");
        const closedVal = closed.reduce((a,l)=>a+l.value,0);
        const booked = leads.filter(l=>l.status==="booked").length;
        const noshow = leads.filter(l=>l.status==="noshow").length;
        const total = leads.length;
        const showed = booked + closed.length;
        const showRate = (booked+closed.length+noshow)>0?Math.round((showed/(booked+closed.length+noshow))*100):0;
        return { user:u, mrr:metrics.mrr, calls:metrics.calls, total, booked, noshow, closed:closed.length, closedVal, showRate };
      }));
      results.sort((a,b)=>b.closedVal-a.closedVal||b.closed-a.closed);
      setStats(results);
      setLoaded(false);
    }
    load().then(()=>setLoaded(true));
  }, [allUsers]);

  const totalClosed = stats.reduce((a,s)=>a+s.closed,0);
  const totalRev = stats.reduce((a,s)=>a+s.closedVal,0);
  const totalCalls = stats.reduce((a,s)=>a+s.calls,0);
  const totalMRR = stats.reduce((a,s)=>a+s.mrr,0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:"1.25rem"}}>
        {[["Team members",allUsers.length],["Deals closed",totalClosed],["Total deal value","$"+totalRev.toLocaleString()],["Team MRR","$"+totalMRR.toLocaleString()]].map(([l,v])=>(
          <div key={l} style={s.metricCard}><div style={s.label}>{l}</div><div style={s.val}>{v}</div></div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",marginBottom:14}}>Leaderboard — closes & deals</div>
        {!loaded&&<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Loading…</div>}
        {loaded&&stats.length===0&&<div style={{fontSize:13,color:"var(--color-text-tertiary)",textAlign:"center",padding:"1.5rem 0"}}>No team data yet. Add leads in My CRM.</div>}
        {loaded&&stats.map((r,i)=>{
          const pct = GOAL>0?Math.min(100,Math.round((r.mrr/GOAL)*100)):0;
          return (
            <div key={r.user} style={{display:"grid",gridTemplateColumns:"auto auto 1fr auto",gap:14,alignItems:"center",padding:"12px 0",borderBottom:i<stats.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
              <div style={{fontSize:13,fontWeight:500,color:i===0?"#EF9F27":"var(--color-text-tertiary)",minWidth:18}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
              <div style={{width:36,height:36,borderRadius:"50%",background:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"var(--color-text-primary)",flexShrink:0,border:r.user===currentUser?"2px solid #378ADD":"none"}}>
                {initials(r.user)}
              </div>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{r.user}</span>
                  {r.user===currentUser&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#E6F1FB",color:"#0C447C"}}>you</span>}
                </div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{r.closed} closed · {r.booked} booked · {r.noshow} no-show · {r.showRate}% show rate</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                  <div style={{flex:1,background:"var(--color-border-tertiary)",borderRadius:4,height:4}}>
                    <div style={{height:4,borderRadius:4,background:"#1D9E75",width:pct+"%"}} />
                  </div>
                  <span style={{fontSize:11,color:"var(--color-text-tertiary)",whiteSpace:"nowrap"}}>${r.mrr.toLocaleString()} MRR · {pct}%</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>{"$"+r.closedVal.toLocaleString()}</div>
                <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{r.calls} calls</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
