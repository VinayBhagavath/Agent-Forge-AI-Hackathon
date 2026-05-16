import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";

const AGENTS = [
  { id: "discovery",    name: "Discovery",    glyph: "✺", desc: "Scanning live boards…",     done: "Jobs discovered" },
  { id: "verification", name: "Verification", glyph: "✦", desc: "Assaying realness…",         done: "Jobs verified"   },
  { id: "signal",       name: "Signals",      glyph: "❍", desc: "Reading hiring intent…",     done: "Signals gathered"},
  { id: "outreach",     name: "Outreach",     glyph: "✎", desc: "Composing dispatches…",      done: "Messages ready"  },
  { id: "application",  name: "Auto-Apply",   glyph: "➤", desc: "Filing application…",        done: "Applied"         },
];

/* ── reusable printed section header ───────────────────────────── */
function Rule({ n, label, tone = "amber" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
        color: `var(--${tone})`, border: `1px solid var(--${tone})`, borderRadius: 2,
        padding: "1px 7px", letterSpacing: ".05em",
      }}>{n}</span>
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
        letterSpacing: ".34em", color: "var(--bone)", textTransform: "uppercase",
      }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,var(--${tone}),transparent)` }} />
    </div>
  );
}

function Stamp({ children, tone = "amber", rot = -3 }) {
  return (
    <span style={{
      display: "inline-block", transform: `rotate(${rot}deg)`,
      fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
      letterSpacing: ".18em", textTransform: "uppercase", color: `var(--${tone})`,
      border: `1.5px solid var(--${tone})`, borderRadius: 3,
      padding: "3px 9px", boxShadow: `inset 0 0 0 1px var(--paper)`,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function AgentCard({ agent, status, idx }) {
  const done = status === "done";
  const running = status === "running";
  const tone = done ? "teal" : running ? "amber" : "ink-soft";
  return (
    <div style={{
      flex: 1, minWidth: 0, background: "var(--paper)",
      border: "1px solid rgba(36,28,18,.22)", borderRadius: 6,
      padding: "13px 13px 12px", position: "relative", overflow: "hidden",
      transition: "all .4s",
      boxShadow: done
        ? "0 14px 30px -16px rgba(74,165,153,.55), inset 0 0 0 1px rgba(36,28,18,.06)"
        : "0 14px 30px -20px rgba(0,0,0,.6), inset 0 0 0 1px rgba(36,28,18,.06)",
    }}>
      {running && <div className="scan-line" />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
          color: "var(--ink-soft)", letterSpacing: ".14em",
        }}>{String(idx + 1).padStart(2, "0")}</span>
        <span style={{
          fontSize: 18, color: `var(--${tone})`, lineHeight: 1,
          filter: done ? "drop-shadow(0 0 6px rgba(74,165,153,.6))" : "none",
        }}>{agent.glyph}</span>
      </div>
      <div style={{
        fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600,
        color: "var(--ink)", lineHeight: 1.05, marginBottom: 4,
      }}>{agent.name}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: running ? "var(--sienna)" : done ? "var(--teal)" : "var(--ink-soft)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {running ? agent.desc : done ? "✓ " + agent.done : "— idle —"}
      </div>
    </div>
  );
}

function Feed({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div style={{
      background: "var(--void)", border: "1px solid rgba(224,162,63,.22)",
      borderRadius: 6, padding: "14px 16px", height: 178, overflowY: "auto",
      fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1.7,
      boxShadow: "inset 0 0 60px rgba(0,0,0,.7)", position: "relative",
    }}>
      <div className="crt" />
      {logs.length === 0
        ? <div style={{ color: "var(--bone-soft)", opacity: .5 }}>▌ awaiting telemetry…</div>
        : logs.map((l, i) => (
          <div key={i} style={{ marginBottom: 3 }}>
            <span style={{ color: "var(--bone-soft)", opacity: .55 }}>{l.time} </span>
            <span style={{ color: "var(--amber)", fontWeight: 700 }}>{l.agent}</span>
            <span style={{ color: "var(--bone-soft)" }}> » </span>
            <span style={{ color: l.color === "done" ? "var(--teal)" : "var(--bone)" }}>{l.msg}</span>
          </div>
        ))
      }
    </div>
  );
}

function JobCard({ job, onApply, applyState }) {
  const score = job.score ?? 70;
  const tone = score >= 80 ? "teal" : score >= 60 ? "amber" : "sienna";
  const label = score >= 80 ? "Strong Fit" : score >= 60 ? "Possible Fit" : "Low Fit";
  const canApply = job.source === "Greenhouse" || job.source === "Lever";
  return (
    <div style={{
      background: "var(--paper)", border: "1px solid rgba(36,28,18,.2)",
      borderRadius: 6, padding: "15px 17px", display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 14px 30px -22px rgba(0,0,0,.55), inset 0 0 0 1px rgba(36,28,18,.05)",
    }}>
      <div style={{
        minWidth: 50, height: 50, borderRadius: "50%",
        border: `2px solid var(--${tone})`, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", color: "var(--ink)",
        background: `radial-gradient(circle, var(--paper) 55%, color-mix(in srgb, var(--${tone}) 18%, var(--paper)) 100%)`,
      }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 6, letterSpacing: ".12em", color: "var(--ink-soft)" }}>SCORE</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: "var(--ink)", lineHeight: 1.15 }}>
          {job.title}
          {job.live && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--teal)", border: "1px solid var(--teal)", padding: "1px 6px", borderRadius: 2, marginLeft: 9, verticalAlign: "middle", letterSpacing: ".1em" }}>● LIVE</span>}
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--ink-soft)", marginTop: 4, letterSpacing: ".04em" }}>
          {job.company} <span style={{ opacity: .5 }}>· via {job.source}</span>
        </div>
        {job.salary_range && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--amber)", background: "color-mix(in srgb,var(--amber) 12%,var(--paper))", border: "1px solid color-mix(in srgb,var(--amber) 35%,transparent)", padding: "2px 8px", borderRadius: 2, letterSpacing: ".06em" }}>
              ◈ {job.salary_range}
            </span>
          </div>
        )}
        {job.score_reason && <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4, fontStyle: "italic", fontFamily: "'Fraunces', serif" }}>{job.score_reason}</div>}
        {job.matched_skills?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {job.matched_skills.map(s => <span key={s} style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--teal)", border: "1px solid color-mix(in srgb,var(--teal) 45%,transparent)", padding: "1px 6px", borderRadius: 2 }}>{s}</span>)}
          </div>
        )}
        {job.missing_skills?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
            {job.missing_skills.map(s => <span key={s} style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--sienna)", border: "1px solid color-mix(in srgb,var(--sienna) 40%,transparent)", padding: "1px 6px", borderRadius: 2 }}>gap · {s}</span>)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9 }}>
        <Stamp tone={tone} rot={3}>{label}</Stamp>
        {canApply && (
          <button onClick={() => onApply(job)} disabled={applyState === "applying" || applyState === "done"}
            className="ghost-btn"
            style={{ borderColor: "var(--teal)", color: applyState === "done" ? "var(--teal)" : "var(--ink)" }}>
            {applyState === "applying" ? "▣ filing…" : applyState === "done" ? "✓ applied" : "➤ auto-apply"}
          </button>
        )}
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" className="ghost-btn" style={{ borderColor: "rgba(36,28,18,.3)", color: "var(--ink-soft)", textDecoration: "none" }}>
            view ↗
          </a>
        )}
      </div>
    </div>
  );
}

function SignalCard({ s }) {
  return (
    <div style={{
      background: "var(--paper)", border: "1px solid rgba(36,28,18,.18)",
      borderLeft: "3px solid var(--violet)", borderRadius: 4,
      padding: "13px 16px", display: "flex", gap: 13, alignItems: "center",
      boxShadow: "0 12px 26px -22px rgba(0,0,0,.5)",
    }}>
      <span style={{ fontSize: 16, color: "var(--violet)" }}>❍</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: "var(--ink)", lineHeight: 1.4 }}>{s.signal}</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--ink-soft)", marginTop: 4, letterSpacing: ".06em" }}>
          {s.company} · <span style={{ color: "var(--violet)" }}>{s.source}</span>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ a }) {
  const ok = a.status === "submitted" || a.status === "simulated";
  const tone = ok ? "teal" : "sienna";
  return (
    <div style={{
      background: "var(--paper)", border: `1px solid color-mix(in srgb,var(--${tone}) 40%,transparent)`,
      borderRadius: 6, padding: "17px 19px",
      boxShadow: `0 16px 34px -22px color-mix(in srgb,var(--${tone}) 60%,transparent), inset 0 0 0 1px rgba(36,28,18,.05)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9, gap: 12 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
          {a.title} <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>— {a.company}</span>
        </div>
        <Stamp tone={tone} rot={-4}>{ok ? "✓ Autonomously Applied" : "Flagged"}</Stamp>
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>{a.detail}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--ink-soft)", marginTop: 7, letterSpacing: ".04em" }}>
        ATS <span style={{ color: "var(--ink)" }}>{a.ats}</span>
        {a.confirmation && <> &nbsp;·&nbsp; CONF <span style={{ color: `var(--${tone})` }}>{a.confirmation}</span></>}
      </div>
    </div>
  );
}

function MessageCard({ msg }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(msg.message || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div style={{
      background: "var(--paper)", border: "1px solid rgba(36,28,18,.18)",
      borderRadius: 6, padding: "16px 18px", marginBottom: 10, position: "relative",
      boxShadow: "0 12px 28px -22px rgba(0,0,0,.5)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
          color: "var(--violet)", letterSpacing: ".2em", textTransform: "uppercase",
        }}>{msg.company}</span>
        <button onClick={copy} className="ghost-btn" style={{ borderColor: "rgba(36,28,18,.25)", color: copied ? "var(--teal)" : "var(--ink-soft)" }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <div style={{
        fontFamily: "'Fraunces', serif", fontSize: 15, color: "var(--ink)",
        lineHeight: 1.7, fontStyle: "italic",
      }}>
        <span style={{ color: "var(--amber)", fontSize: 26, lineHeight: 0, verticalAlign: "-8px", marginRight: 2 }}>“</span>
        {msg.message}
        <span style={{ color: "var(--amber)", fontSize: 26, lineHeight: 0, verticalAlign: "-12px", marginLeft: 2 }}>”</span>
      </div>
    </div>
  );
}

function CoverLetterCard({ text, job }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div style={{
      background: "var(--paper)", border: "1px solid rgba(36,28,18,.22)",
      borderLeft: "3px solid var(--amber)", borderRadius: 6,
      padding: "22px 24px",
      boxShadow: "0 18px 40px -26px rgba(0,0,0,.65), inset 0 0 0 1px rgba(36,28,18,.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--amber)", letterSpacing: ".22em", textTransform: "uppercase", marginBottom: 5 }}>
            Cover Letter · Z.ai GLM
          </div>
          {job && (
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, color: "var(--ink)", fontStyle: "italic" }}>
              For <span style={{ fontWeight: 600, fontStyle: "normal" }}>{job.title}</span> at {job.company}
            </div>
          )}
        </div>
        <button onClick={copy} className="ghost-btn" style={{ borderColor: copied ? "var(--teal)" : "rgba(36,28,18,.3)", color: copied ? "var(--teal)" : "var(--ink-soft)", flexShrink: 0 }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <div style={{
        fontFamily: "'Fraunces',serif", fontSize: 14, color: "var(--ink)",
        lineHeight: 1.85, whiteSpace: "pre-wrap", borderTop: "1px solid rgba(36,28,18,.14)",
        paddingTop: 16,
      }}>
        {text}
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("input");
  const [role, setRole] = useState("");
  const [companies, setCompanies] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState({ discovery: "idle", verification: "idle", signal: "idle", outreach: "idle", application: "idle" });
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [applyStates, setApplyStates] = useState({});

  function log(agent, msg, _c, color) {
    const t = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs(l => [...l, { time: t, agent, msg, color: color === "#34d399" ? "done" : null }]);
  }

  async function onResume(file) {
    if (!file) return;
    setResumeFile(file);
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/upload-resume`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Resume parse failed: ${res.status}`);
      const data = await res.json();
      setAnalysis(data);
      setRole(data.inferred_role || "");
      setCompanies((data.suggested_companies || []).join(", "));
      const txt = data.resume_text || await file.text().catch(() => "");
      setResumeText(txt);
    } catch (e) {
      setError(e.message.includes("fetch") ? "Cannot reach backend — run: uvicorn app:app --reload" : e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function run() {
    if (!role.trim() || phase === "running") return;
    setPhase("running"); setResult(null); setError(null); setLogs([]); setElapsed(0);
    setStatus({ discovery: "idle", verification: "idle", signal: "idle", outreach: "idle", application: "idle" });
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const companiesList = companies.split(",").map(c => c.trim()).filter(Boolean);
      const body = { role, companies: companiesList, resume_text: resumeText };

      setStatus(s => ({ ...s, discovery: "running" }));
      log("DiscoveryAgent", `Scanning live boards for "${role}"…`);

      const fetchPromise = fetch(`${API}/run-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await new Promise(r => setTimeout(r, 1200));
      setStatus(s => ({ ...s, discovery: "done", verification: "running" }));
      log("DiscoveryAgent", "Live job listings collected", null, "#34d399");
      log("VerificationAgent", "Assaying realness of each posting…");

      await new Promise(r => setTimeout(r, 900));
      setStatus(s => ({ ...s, verification: "done", signal: "running" }));
      log("VerificationAgent", "Realness scores assigned", null, "#34d399");
      log("SignalAgent", "Scraping recruiter hiring signals…");

      await new Promise(r => setTimeout(r, 800));
      setStatus(s => ({ ...s, signal: "done", outreach: "running" }));
      log("SignalAgent", "Hiring intent signals gathered", null, "#34d399");
      log("OutreachAgent", "Composing dispatches via Z.ai GLM…");

      await new Promise(r => setTimeout(r, 800));
      setStatus(s => ({ ...s, outreach: "done", application: "running" }));
      log("OutreachAgent", "Dispatches drafted", null, "#34d399");
      log("ApplicationAgent", "Autonomously applying to top job…");

      const res = await fetchPromise;
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();

      setStatus(s => ({ ...s, application: "done" }));
      const app0 = data.applications?.[0];
      log("ApplicationAgent", app0 ? `Applied to ${app0.company} — ${app0.confirmation || app0.status}` : "No auto-apply target", null, "#34d399");

      if (data.logs?.length) {
        data.logs.slice(-12).forEach(l => log(l.agent, l.message));
      }

      setResult(data);
      setPhase("done");
    } catch (e) {
      setError(e.message.includes("fetch") ? "Cannot reach backend — run: uvicorn app:app --reload" : e.message);
      setStatus({ discovery: "idle", verification: "idle", signal: "idle", outreach: "idle", application: "idle" });
      setPhase("input");
    } finally {
      clearInterval(timer);
    }
  }

  async function applyToJob(job) {
    const key = `${job.company}-${job.title}`;
    setApplyStates(s => ({ ...s, [key]: "applying" }));
    try {
      const res = await fetch(`${API}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: job.company, title: job.title, url: job.url, source: job.source, resume_text: resumeText }),
      });
      const data = await res.json();
      setApplyStates(s => ({ ...s, [key]: "done" }));
      setResult(r => r ? { ...r, applications: [data, ...(r.applications || []).filter(a => !(a.company === data.company && a.title === data.title))] } : r);
    } catch {
      setApplyStates(s => ({ ...s, [key]: undefined }));
    }
  }

  const realJobs = result?.jobs?.filter(j => (j.score ?? 70) >= 80) ?? [];

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", padding: "52px 24px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        :root{
          --void:#080611; --cosmos:#150f30; --cosmos-2:#1d1442;
          --paper:#efe4cb; --paper-2:#e4d6b6;
          --ink:#241c12; --ink-soft:#6f6048;
          --amber:#e0a23f; --sienna:#cf6a3f; --teal:#4aa599;
          --violet:#9a72d4; --bone:#ece0c8; --bone-soft:#9b8d72;
        }
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{background:var(--void)}
        body{font-family:'Space Grotesk',sans-serif;color:var(--bone)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes spin-r{to{transform:rotate(-360deg)}}
        @keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(26px,-30px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes fadeup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanmove{0%{top:-2px}100%{top:100%}}
        @keyframes twinkle{0%,100%{opacity:.45}50%{opacity:.9}}
        .fade-up{animation:fadeup .6s cubic-bezier(.2,.7,.3,1) forwards}
        .scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--amber),transparent);animation:scanmove 1.8s linear infinite}
        .crt{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(224,162,63,.05) 0 1px,transparent 1px 3px);border-radius:6px}
        .run-btn{width:100%;border:none;cursor:pointer;font-family:'Space Mono',monospace;font-size:13px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:var(--ink);padding:16px 0;border-radius:5px;background:linear-gradient(135deg,var(--amber),var(--sienna));box-shadow:0 0 0 1px rgba(36,28,18,.25),inset 0 1px 0 rgba(255,255,255,.45),0 16px 40px -16px rgba(224,162,63,.7);transition:transform .25s,box-shadow .25s}
        .run-btn:hover{transform:translateY(-2px);box-shadow:0 0 0 1px rgba(36,28,18,.25),inset 0 1px 0 rgba(255,255,255,.5),0 22px 50px -16px rgba(224,162,63,.85)}
        .run-btn:disabled{background:var(--paper-2);color:var(--ink-soft);box-shadow:0 0 0 1px rgba(36,28,18,.2);cursor:not-allowed;transform:none}
        .ghost-btn{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:transparent;border:1px solid;border-radius:3px;padding:4px 10px;cursor:pointer;transition:background .2s}
        .ghost-btn:hover{background:rgba(36,28,18,.06)}
        .field{width:100%;background:var(--paper);border:1px solid rgba(36,28,18,.28);border-radius:5px;padding:13px 15px;color:var(--ink);font-family:'Fraunces',serif;font-size:15px;outline:none;transition:border-color .2s,box-shadow .2s}
        .field:focus{border-color:var(--sienna);box-shadow:0 0 0 3px color-mix(in srgb,var(--sienna) 22%,transparent)}
        .field::placeholder{color:var(--ink-soft);opacity:.55;font-style:italic}
        .drop{border:1.5px dashed rgba(36,28,18,.35);border-radius:6px;padding:22px;text-align:center;cursor:pointer;transition:all .2s;background:color-mix(in srgb,var(--paper) 70%,transparent)}
        .drop:hover{border-color:var(--sienna);background:color-mix(in srgb,var(--paper) 90%,transparent)}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:rgba(224,162,63,.4);border-radius:2px}
        a{color:inherit}
      `}</style>

      {/* ── cosmic field ─────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse at 50% 8%, var(--cosmos-2) 0%, var(--cosmos) 38%, var(--void) 78%)" }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: .7,
        backgroundImage: `radial-gradient(1px 1px at 18% 22%, #fff8e7 60%, transparent),
          radial-gradient(1px 1px at 72% 14%, #ffe9c4 60%, transparent),
          radial-gradient(1.4px 1.4px at 41% 67%, #fff 60%, transparent),
          radial-gradient(1px 1px at 88% 52%, #ffe4b5 60%, transparent),
          radial-gradient(1px 1px at 9% 78%, #fff 60%, transparent),
          radial-gradient(1.2px 1.2px at 58% 88%, #ffeccb 60%, transparent),
          radial-gradient(1px 1px at 33% 9%, #fff 60%, transparent)`,
        backgroundSize: "520px 520px,440px 440px,600px 600px,500px 500px,560px 560px,480px 480px,620px 620px",
        animation: "twinkle 6s ease-in-out infinite",
      }} />
      {/* retro sun */}
      <div style={{
        position: "fixed", width: 720, height: 720, borderRadius: "50%", left: "50%", top: -430,
        transform: "translateX(-50%)", zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(circle, color-mix(in srgb,var(--amber) 32%,transparent) 0%, color-mix(in srgb,var(--sienna) 20%,transparent) 38%, transparent 66%)",
        filter: "blur(8px)", animation: "drift 16s ease-in-out infinite",
      }} />
      {/* orbital rings */}
      <div style={{ position: "fixed", left: "50%", top: 150, transform: "translate(-50%,-50%)", zIndex: 0, pointerEvents: "none" }}>
        {[420, 620, 860].map((d, i) => (
          <div key={d} style={{
            position: "absolute", width: d, height: d, left: -d / 2, top: -d / 2,
            border: `1px solid color-mix(in srgb,var(--amber) ${14 - i * 3}%,transparent)`,
            borderRadius: "50%", borderTopColor: `color-mix(in srgb,var(--amber) ${26 - i * 5}%,transparent)`,
            animation: `${i % 2 ? "spin-r" : "spin"} ${44 + i * 20}s linear infinite`,
          }} />
        ))}
      </div>
      <div style={{ position: "fixed", bottom: -180, right: -140, width: 480, height: 480, borderRadius: "50%", zIndex: 0, pointerEvents: "none", background: "radial-gradient(circle, color-mix(in srgb,var(--violet) 22%,transparent) 0%, transparent 64%)", filter: "blur(20px)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 880, margin: "0 auto" }}>

        {/* ── masthead ─────────────────────────────────────── */}
        <header className="fade-up" style={{ textAlign: "center", marginBottom: 42 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,color-mix(in srgb,var(--amber) 60%,transparent))" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: ".34em", color: "var(--bone-soft)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Issue Nº MMXXVI · Agent Forge · Sunnyvale CA
            </span>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,color-mix(in srgb,var(--amber) 60%,transparent),transparent)" }} />
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontSize: 84, fontWeight: 900, lineHeight: .92,
            letterSpacing: "-.02em", color: "var(--bone)",
            textShadow: "0 2px 0 rgba(0,0,0,.35), 0 0 44px color-mix(in srgb,var(--amber) 30%,transparent)",
          }}>
            Agent<span style={{ fontStyle: "italic", color: "var(--amber)" }}>Check</span>
          </h1>
          <p style={{
            fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 17,
            color: "var(--bone-soft)", marginTop: 12, letterSpacing: ".02em",
          }}>
            An autonomous hiring observatory — it reads, it hunts, it applies.
          </p>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ width: 90, height: 1, background: "var(--amber)", opacity: .4 }} />
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", boxShadow: "0 0 10px var(--teal)", animation: "pulse 2.4s infinite" }} />
            <span style={{ width: 90, height: 1, background: "var(--amber)", opacity: .4 }} />
          </div>
        </header>

        {phase === "input" && (
          <div className="fade-up" style={{
            background: "var(--paper)", border: "1px solid rgba(36,28,18,.25)",
            borderRadius: 10, padding: 30,
            boxShadow: "0 40px 90px -40px rgba(0,0,0,.85), inset 0 0 0 1px rgba(36,28,18,.06), inset 0 0 80px rgba(36,28,18,.04)",
          }}>
            <div style={{ marginBottom: 22 }}>
              <Rule n="01" label="Resume Intake" tone="sienna" />
              <div className="drop" onClick={() => document.getElementById("r").click()}>
                <input id="r" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={e => onResume(e.target.files[0])} />
                {analyzing
                  ? <div style={{ color: "var(--sienna)", fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 15 }}>✦ Reading the document…</div>
                  : resumeFile
                  ? <div style={{ color: "var(--teal)", fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: ".06em" }}>✓ {resumeFile.name}</div>
                  : <div style={{ color: "var(--ink-soft)", fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 15 }}>Drop a résumé, or click to select <span style={{ opacity: .55 }}>· pdf / doc / txt</span></div>
                }
              </div>
              {analysis && (
                <div style={{ marginTop: 14, background: "var(--paper-2)", border: "1px solid rgba(36,28,18,.18)", borderRadius: 6, padding: "14px 16px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontStyle: "italic", fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>“{analysis.summary}”</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "var(--ink-soft)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                    Detected role — <span style={{ color: "var(--sienna)" }}>{analysis.inferred_role}</span>
                  </div>
                  {analysis.skills?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                      {analysis.skills.map(s => <span key={s} style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--ink)", border: "1px solid rgba(36,28,18,.3)", padding: "2px 8px", borderRadius: 2 }}>{s}</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Rule n="02" label="Search Parameters" tone="amber" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 7 }}>Target Role</label>
                <input className="field" value={role} onChange={e => setRole(e.target.value)} onKeyDown={e => e.key === "Enter" && run()} placeholder="Machine Learning Engineer" />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 7 }}>Companies · auto-filled</label>
                <input className="field" value={companies} onChange={e => setCompanies(e.target.value)} placeholder="Anthropic, OpenAI, Perplexity" />
              </div>
            </div>

            {error && (
              <div style={{ background: "color-mix(in srgb,var(--sienna) 12%,var(--paper))", border: "1px solid color-mix(in srgb,var(--sienna) 45%,transparent)", borderRadius: 5, padding: "11px 15px", color: "var(--sienna)", fontSize: 12, marginBottom: 16, fontFamily: "'Space Mono',monospace" }}>
                ⚠ {error}
              </div>
            )}
            <button className="run-btn" onClick={run} disabled={!role.trim()}>Engage Agents →</button>
          </div>
        )}

        {(phase === "running" || phase === "done") && (
          <div className="fade-up">
            <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
              {AGENTS.map((a, i) => <AgentCard key={a.id} agent={a} status={status[a.id]} idx={i} />)}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "var(--bone-soft)", letterSpacing: ".1em" }}>
                {phase === "running" ? `◴ elapsed ${elapsed}s` : `✓ completed in ${elapsed}s`}
              </span>
              {phase === "done" && (
                <button onClick={() => { setPhase("input"); setStatus({ discovery: "idle", verification: "idle", signal: "idle", outreach: "idle", application: "idle" }); setElapsed(0); }}
                  className="ghost-btn" style={{ borderColor: "color-mix(in srgb,var(--amber) 50%,transparent)", color: "var(--amber)" }}>
                  ← new search
                </button>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <Rule n="✶" label="Mission Telemetry" tone="amber" />
              <Feed logs={logs} />
            </div>

            {result && (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                  background: "var(--paper)", border: "1px solid rgba(36,28,18,.22)",
                  borderRadius: 8, marginBottom: 20, overflow: "hidden",
                  boxShadow: "0 20px 44px -28px rgba(0,0,0,.6)",
                }}>
                  {[
                    { label: "Jobs Found",     value: result.jobs?.length ?? 0,         tone: "ink" },
                    { label: "Verified Real",  value: realJobs.length,                  tone: "teal" },
                    { label: "Hiring Signals", value: result.signals?.length ?? 0,      tone: "violet" },
                    { label: "Auto-Applied",   value: result.applications?.length ?? 0, tone: "sienna" },
                  ].map((s, i) => (
                    <div key={s.label} style={{ padding: "20px 14px", textAlign: "center", borderLeft: i ? "1px solid rgba(36,28,18,.16)" : "none" }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 40, fontWeight: 900, color: s.tone === "ink" ? "var(--ink)" : `var(--${s.tone})`, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "var(--ink-soft)", letterSpacing: ".18em", textTransform: "uppercase", marginTop: 7 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {result.applications?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Rule n="03" label="Autonomous Application" tone="teal" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {result.applications.map((a, i) => <ApplicationCard key={i} a={a} />)}
                    </div>
                  </div>
                )}

                {result.jobs?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Rule n="04" label="Job Listings" tone="amber" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {result.jobs.map((j, i) => <JobCard key={i} job={j} onApply={applyToJob} applyState={applyStates[`${j.company}-${j.title}`]} />)}
                    </div>
                  </div>
                )}

                {result.signals?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Rule n="05" label="Recruiter Hiring Signals" tone="violet" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {result.signals.map((s, i) => <SignalCard key={i} s={s} />)}
                    </div>
                  </div>
                )}

                {result.messages?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Rule n="06" label="Recruiter Outreach · Z.ai GLM" tone="violet" />
                    {result.messages.map((m, i) => <MessageCard key={i} msg={m} />)}
                  </div>
                )}

                {result.cover_letter && (
                  <div style={{ marginBottom: 20 }}>
                    <Rule n="07" label="Cover Letter · Ready to Send" tone="amber" />
                    <CoverLetterCard
                      text={result.cover_letter}
                      job={result.jobs?.[0]}
                    />
                  </div>
                )}

                <div style={{
                  background: "var(--paper)", border: "1px solid rgba(36,28,18,.2)",
                  borderRadius: 6, padding: "15px 18px", display: "flex", alignItems: "center", gap: 13,
                }}>
                  <span style={{ fontSize: 18, color: "var(--violet)" }}>✺</span>
                  <div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 4 }}>Memory · Evermind</div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, color: "var(--ink)" }}>
                      Targeting <span style={{ fontStyle: "italic", color: "var(--sienna)" }}>{role}</span> · {companies || "AI companies"} · {result.jobs?.length ?? 0} listings indexed
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── colophon ─────────────────────────────────────── */}
        <footer style={{ marginTop: 52, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(224,162,63,.35))" }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--bone-soft)", letterSpacing: ".26em", textTransform: "uppercase" }}>Powered By</span>
            <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(224,162,63,.35),transparent)" }} />
          </div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--bone-soft)", letterSpacing: ".22em", textTransform: "uppercase", opacity: .8 }}>
            TokenRouter · Z.ai GLM · Bright Data · AgentField · Evermind · Actionbook · Zeabur
          </div>
        </footer>
      </div>
    </div>
  );
}
