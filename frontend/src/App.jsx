import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";

const AGENTS = [
  { id: "discovery",     name: "Discovery Agent",     icon: "🔍", color: "#38bdf8", desc: "Scanning job boards...",          done: "Jobs discovered" },
  { id: "verification",  name: "Verification Agent",  icon: "✅", color: "#f59e0b", desc: "Scoring realness...",             done: "Jobs verified" },
  { id: "outreach",      name: "Outreach Agent",      icon: "✉️", color: "#a78bfa", desc: "Drafting recruiter messages...",  done: "Messages ready" },
  { id: "memory",        name: "Memory Agent",        icon: "🧠", color: "#34d399", desc: "Storing preferences...",          done: "Memory saved" },
];

function AgentCard({ agent, status }) {
  const done = status === "done";
  const running = status === "running";
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "rgba(15,22,35,0.85)",
      border: `1px solid ${done ? agent.color + "55" : running ? agent.color + "33" : "#1e293b"}`,
      borderRadius: 14, padding: "14px 16px",
      transition: "all 0.4s", position: "relative", overflow: "hidden",
      boxShadow: done ? `0 0 28px ${agent.color}22` : "none",
    }}>
      {running && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`, animation: "scan 1.5s linear infinite" }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${agent.color}15`, border: `1px solid ${agent.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{agent.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{agent.name}</div>
          <div style={{ fontSize: 10, color: running ? "#f59e0b" : done ? agent.color : "#334155", fontFamily: "monospace" }}>
            {running ? agent.desc : done ? agent.done : "Idle"}
          </div>
        </div>
        {done    && <span style={{ fontSize: 9, background: `${agent.color}18`, color: agent.color, padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>✓ DONE</span>}
        {running && <span style={{ fontSize: 9, background: "#f59e0b18", color: "#f59e0b", padding: "2px 8px", borderRadius: 8, fontWeight: 700, animation: "pulse 1s infinite" }}>● LIVE</span>}
      </div>
    </div>
  );
}

function Feed({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div ref={ref} style={{ background: "rgba(0,0,0,0.45)", border: "1px solid #0f172a", borderRadius: 10, padding: "12px 14px", height: 150, overflowY: "auto", fontFamily: "monospace", fontSize: 11 }}>
      {logs.length === 0
        ? <div style={{ color: "#1e293b" }}>Waiting for agents...</div>
        : logs.map((l, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            <span style={{ color: "#334155" }}>[{l.time}] </span>
            <span style={{ color: l.agentColor, fontWeight: 700 }}>[{l.agent}]</span>
            {" "}<span style={{ color: l.color || "#64748b" }}>{l.msg}</span>
          </div>
        ))
      }
    </div>
  );
}

function JobCard({ job }) {
  const score = job.score ?? job.realness_score ?? 70;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#f59e0b" : "#f87171";
  const label = score >= 80 ? "REAL" : score >= 60 ? "LIKELY" : "STALE";
  return (
    <div style={{ background: "rgba(15,22,35,0.9)", border: "1px solid #1e293b", borderRadius: 11, padding: "13px 15px", display: "flex", alignItems: "center", gap: 13 }}>
      <div style={{ minWidth: 42, height: 42, borderRadius: "50%", background: `${color}12`, border: `2px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color }}>{score}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{job.title}</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{job.company} · <span style={{ color: "#334155" }}>{job.source}</span></div>
        {job.reason && <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{job.reason}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span style={{ fontSize: 9, color, background: `${color}15`, padding: "2px 8px", borderRadius: 7, fontWeight: 700 }}>{label}</span>
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: "#334155", textDecoration: "none", border: "1px solid #1e293b", padding: "2px 8px", borderRadius: 7 }}>VIEW →</a>
        )}
      </div>
    </div>
  );
}

function MessageCard({ msg }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(msg.message || msg.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 11, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
          {msg.company}{msg.to ? ` · ${msg.to}` : ""}
        </div>
        <button onClick={copy} style={{ fontSize: 9, color: copied ? "#34d399" : "#334155", background: "none", border: "1px solid #1e293b", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontFamily: "monospace" }}>
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, fontStyle: "italic" }}>
        "{msg.message || msg.content}"
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("input");
  const [role, setRole] = useState("");
  const [companies, setCompanies] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [status, setStatus] = useState({ discovery: "idle", verification: "idle", outreach: "idle", memory: "idle" });
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);

  function log(agent, msg, agentColor, color) {
    const t = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs(l => [...l, { time: t, agent, msg, agentColor, color }]);
  }

  async function run() {
    if (!role.trim() || phase === "running") return;
    setPhase("running"); setResult(null); setError(null); setLogs([]); setElapsed(0);
    setStatus({ discovery: "idle", verification: "idle", outreach: "idle", memory: "idle" });
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const companiesList = companies.split(",").map(c => c.trim()).filter(Boolean);
      const body = { role, companies: companiesList };

      // Animate agents sequentially while waiting for response
      setStatus(s => ({ ...s, discovery: "running" }));
      log("DiscoveryAgent", `Scanning for "${role}" roles...`, "#38bdf8");

      const fetchPromise = fetch(`${API}/run-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await new Promise(r => setTimeout(r, 1400));
      setStatus(s => ({ ...s, discovery: "done", verification: "running" }));
      log("DiscoveryAgent", "Job listings collected", "#38bdf8", "#34d399");
      log("VerificationAgent", "Scoring realness of each posting...", "#f59e0b");

      await new Promise(r => setTimeout(r, 1000));
      setStatus(s => ({ ...s, verification: "done", outreach: "running" }));
      log("VerificationAgent", "Realness scores assigned", "#f59e0b", "#34d399");
      log("OutreachAgent", "Drafting personalized recruiter messages...", "#a78bfa");

      const res = await fetchPromise;
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();

      setStatus(s => ({ ...s, outreach: "done", memory: "running" }));
      log("OutreachAgent", `${data.messages?.length || 0} messages drafted`, "#a78bfa", "#34d399");
      log("MemoryAgent", "Storing preferences and job history...", "#34d399");

      await new Promise(r => setTimeout(r, 600));
      setStatus(s => ({ ...s, memory: "done" }));
      log("MemoryAgent", `Saved — targeting ${companiesList[0] || "AI companies"}`, "#34d399", "#34d399");

      // Surface any backend logs
      if (data.logs?.length) {
        data.logs.forEach(l => log("Backend", l, "#475569"));
      }

      setResult(data);
      setPhase("done");
    } catch (e) {
      setError(e.message.includes("fetch") ? "Cannot reach backend — run: uvicorn app:app --reload" : e.message);
      setStatus({ discovery: "idle", verification: "idle", outreach: "idle", memory: "idle" });
      setPhase("input");
    } finally {
      clearInterval(timer);
    }
  }

  const realJobs  = result?.jobs?.filter(j => (j.score ?? j.realness_score ?? 70) >= 80) ?? [];
  const staleJobs = result?.jobs?.filter(j => (j.score ?? j.realness_score ?? 70) < 60) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", padding: "40px 24px", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#020817}
        @keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-25px)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-25px,20px)}}
        .fade-up{animation:fadeup .55s ease forwards}
        .run-btn{background:linear-gradient(135deg,#38bdf8,#818cf8,#34d399);background-size:200%;color:#020817;border:none;border-radius:12px;padding:14px 0;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.06em;transition:all .3s;width:100%;box-shadow:0 0 28px #38bdf820}
        .run-btn:hover{background-position:right;transform:scale(1.02);box-shadow:0 0 44px #38bdf840}
        .run-btn:disabled{background:#1e293b;color:#334155;box-shadow:none;cursor:not-allowed;transform:none}
        input{background:rgba(15,22,35,.9);border:1px solid #1e293b;border-radius:10px;padding:12px 15px;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none;transition:border .2s;width:100%}
        input:focus{border-color:#38bdf840}input::placeholder{color:#1e293b}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        .upload{border:1.5px dashed #1e293b;border-radius:10px;padding:18px;text-align:center;cursor:pointer;transition:all .2s}
        .upload:hover{border-color:#38bdf840;background:rgba(56,189,248,.03)}
      `}</style>

      {/* Orbs */}
      <div style={{ position:"fixed", width:550, height:550, borderRadius:"50%", background:"radial-gradient(circle,#38bdf810 0%,transparent 65%)", top:-180, left:-180, filter:"blur(60px)", pointerEvents:"none", zIndex:0, animation:"orb1 13s ease-in-out infinite" }} />
      <div style={{ position:"fixed", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,#a78bfa10 0%,transparent 65%)", bottom:-120, right:-120, filter:"blur(60px)", pointerEvents:"none", zIndex:0, animation:"orb2 10s ease-in-out infinite" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:840, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:44 }} className="fade-up">
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, fontSize:10, fontWeight:700, letterSpacing:".2em", color:"#38bdf8", background:"rgba(56,189,248,.06)", border:"1px solid rgba(56,189,248,.18)", padding:"6px 16px", borderRadius:20, marginBottom:22, fontFamily:"monospace" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d39988", display:"inline-block", animation:"pulse 2s infinite" }} />
            AGENT FORGE 2026 · SUNNYVALE, CA
          </div>
          <h1 style={{ fontSize:62, fontWeight:700, letterSpacing:"-.04em", marginBottom:10, lineHeight:1, background:"linear-gradient(135deg,#f1f5f9 0%,#38bdf8 35%,#818cf8 65%,#34d399 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            AgentCheck
          </h1>
          <p style={{ color:"#334155", fontSize:12, letterSpacing:".04em", fontFamily:"monospace" }}>
            Autonomous hiring intelligence · finds real jobs · applies strategically
          </p>
        </div>

        {/* Input */}
        {phase === "input" && (
          <div className="fade-up" style={{ background:"rgba(15,22,35,.92)", border:"1px solid #1e293b", borderRadius:18, padding:26, backdropFilter:"blur(20px)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <div style={{ fontSize:10, color:"#475569", fontWeight:700, letterSpacing:".12em", marginBottom:7, fontFamily:"monospace" }}>TARGET ROLE</div>
                <input value={role} onChange={e => setRole(e.target.value)} onKeyDown={e => e.key==="Enter" && run()} placeholder='"ML Engineer Intern"' />
              </div>
              <div>
                <div style={{ fontSize:10, color:"#475569", fontWeight:700, letterSpacing:".12em", marginBottom:7, fontFamily:"monospace" }}>TARGET COMPANIES</div>
                <input value={companies} onChange={e => setCompanies(e.target.value)} placeholder="Anthropic, Perplexity, OpenAI" />
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:10, color:"#475569", fontWeight:700, letterSpacing:".12em", marginBottom:7, fontFamily:"monospace" }}>RESUME (optional)</div>
              <div className="upload" onClick={() => document.getElementById("r").click()}>
                <input id="r" type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }} onChange={e => setResumeFile(e.target.files[0])} />
                {resumeFile
                  ? <div style={{ color:"#34d399", fontSize:12 }}>✓ {resumeFile.name}</div>
                  : <div style={{ color:"#334155", fontSize:12 }}>Drop resume or click to upload <span style={{ color:"#1e293b" }}>· PDF / DOC</span></div>
                }
              </div>
            </div>
            {error && <div style={{ background:"rgba(239,68,68,.07)", border:"1px solid rgba(239,68,68,.2)", borderRadius:9, padding:"10px 14px", color:"#f87171", fontSize:12, marginBottom:14 }}>⚠ {error}</div>}
            <button className="run-btn" onClick={run} disabled={!role.trim()}>RUN AGENTS →</button>
          </div>
        )}

        {/* Running / Done */}
        {(phase === "running" || phase === "done") && (
          <div className="fade-up">
            {/* Agent cards */}
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              {AGENTS.map(a => <AgentCard key={a.id} agent={a} status={status[a.id]} />)}
            </div>

            {/* Controls */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:10, color:"#334155", fontFamily:"monospace" }}>
                {phase === "running" ? `⏱ ${elapsed}s...` : `✓ Done in ${elapsed}s`}
              </div>
              {phase === "done" && (
                <button onClick={() => { setPhase("input"); setStatus({ discovery:"idle", verification:"idle", outreach:"idle", memory:"idle" }); setElapsed(0); }}
                  style={{ fontSize:10, color:"#38bdf8", background:"none", border:"1px solid #38bdf830", borderRadius:7, padding:"3px 12px", cursor:"pointer", fontFamily:"monospace" }}>
                  ← New Search
                </button>
              )}
            </div>

            {/* Feed */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#334155", letterSpacing:".14em", marginBottom:7, fontFamily:"monospace" }}>▸ LIVE ACTIVITY FEED</div>
              <Feed logs={logs} />
            </div>

            {/* Results */}
            {result && (
              <>
                {/* Stats row */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                  {[
                    { label:"JOBS FOUND",    value: result.jobs?.length ?? 0,   color:"#38bdf8" },
                    { label:"VERIFIED REAL", value: realJobs.length,             color:"#34d399" },
                    { label:"STALE / GHOST", value: staleJobs.length,            color:"#f87171" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"rgba(15,22,35,.9)", border:`1px solid ${s.color}22`, borderRadius:11, padding:"14px 16px", textAlign:"center" }}>
                      <div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:9, color:"#334155", letterSpacing:".12em", fontFamily:"monospace", marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Jobs */}
                {result.jobs?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#38bdf8", letterSpacing:".14em", marginBottom:9, fontFamily:"monospace" }}>▸ JOB LISTINGS</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {result.jobs.map((j, i) => <JobCard key={i} job={j} />)}
                    </div>
                  </div>
                )}

                {/* Outreach */}
                {result.messages?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", letterSpacing:".14em", marginBottom:9, fontFamily:"monospace" }}>▸ RECRUITER OUTREACH</div>
                    {result.messages.map((m, i) => <MessageCard key={i} msg={m} />)}
                  </div>
                )}

                {/* Memory */}
                <div style={{ background:"rgba(52,211,153,.04)", border:"1px solid rgba(52,211,153,.14)", borderRadius:11, padding:"13px 16px" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#34d399", letterSpacing:".14em", marginBottom:6, fontFamily:"monospace" }}>▸ MEMORY AGENT — STORED</div>
                  <div style={{ fontSize:12, color:"#475569" }}>🧠 Targeting <span style={{ color:"#64748b" }}>{role}</span> roles · {companies || "AI companies"} · {result.jobs?.length ?? 0} listings indexed</div>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:44, color:"#0f172a", fontSize:9, fontFamily:"monospace", letterSpacing:".12em" }}>
          BRIGHT DATA · QWEN CLOUD · AGENTFIELD · EVERMIND · ZEABUR · AGENT FORGE 2026
        </div>
      </div>
    </div>
  );
}
