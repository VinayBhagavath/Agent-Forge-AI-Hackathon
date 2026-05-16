from fastapi import APIRouter, UploadFile, File

from models.schemas import (
    RunAgentRequest, RunAgentResponse, ResumeAnalysis,
    ApplyRequest, ApplicationResult, Job,
)
from utils.logger import add_log, get_logs, clear_logs
from agents.discovery_agent import discover_jobs
from agents.memory_agent import save_user_preferences, get_user_preferences
from agents.outreach_agent import generate_messages
from agents.signal_agent import gather_signals
from agents.application_agent import auto_apply_top, auto_apply
from services.scoring_service import score_jobs
from services.resume_service import analyze_resume
from services.agentfield_service import orchestrate

router = APIRouter()


@router.post("/upload-resume", response_model=ResumeAnalysis)
async def upload_resume(file: UploadFile = File(...)):
    clear_logs()
    raw = await file.read()
    try:
        analysis = analyze_resume(file.filename or "", raw)
    except Exception as exc:
        add_log("ResumeAgent", f"Analysis failed ({exc}) — safe defaults")
        analysis = {
            "inferred_role": "Software Engineer",
            "skills": [],
            "suggested_companies": ["Anthropic", "OpenAI", "Perplexity"],
            "summary": "Could not fully parse resume; using general SWE profile.",
            "resume_text": raw.decode("utf-8", errors="ignore")[:12000],
        }
    return ResumeAnalysis(**analysis)


@router.post("/apply", response_model=ApplicationResult)
def apply(req: ApplyRequest):
    clear_logs()
    job = Job(company=req.company, title=req.title, url=req.url, source=req.source)
    try:
        return auto_apply(job, req.resume_text)
    except Exception as exc:
        add_log("ApplicationAgent", f"Apply failed ({exc})")
        return ApplicationResult(
            company=req.company, title=req.title, status="failed",
            ats=req.source, detail=str(exc), confirmation="",
        )


@router.post("/run-agents", response_model=RunAgentResponse)
def run_agents(req: RunAgentRequest):
    clear_logs()

    with orchestrate("AgentCheck hiring pipeline") as orch:
        orch.step("Orchestrator", f"Start — role='{req.role}'")

        # 1. Memory (Evermind)
        try:
            orch.step("MemoryAgent", "Persist + recall preferences")
            save_user_preferences(req.role, req.companies)
            get_user_preferences()
        except Exception as exc:
            add_log("Orchestrator", f"Memory step failed: {exc}")

        # 2. Discovery (Bright Data live scrape)
        try:
            orch.step("DiscoveryAgent", "Scrape live job boards")
            jobs = discover_jobs(req.role, req.companies, req.resume_text)
        except Exception as exc:
            add_log("Orchestrator", f"Discovery failed: {exc}")
            jobs = []

        # 3. Verification + scoring
        try:
            orch.step("VerificationAgent", "Score realness of each posting")
            scored_jobs = score_jobs(jobs, req.resume_text)
        except Exception as exc:
            add_log("Orchestrator", f"Scoring failed: {exc}")
            scored_jobs = jobs

        # 4. Recruiter signals (Bright Data intelligence)
        try:
            orch.step("SignalAgent", "Scrape recruiter hiring signals")
            signals = gather_signals(req.companies)
        except Exception as exc:
            add_log("Orchestrator", f"Signal scrape failed: {exc}")
            signals = []

        # 5. Outreach (Qwen)
        try:
            orch.step("OutreachAgent", "Draft recruiter outreach via Qwen")
            messages = generate_messages(scored_jobs, req.role, req.resume_text)
        except Exception as exc:
            add_log("Orchestrator", f"Outreach failed: {exc}")
            messages = []

        # 6. Autonomous application (Actionbook) — the wow factor
        try:
            orch.step("ApplicationAgent", "Autonomously apply to top job")
            applications = auto_apply_top(scored_jobs, req.resume_text, limit=1)
        except Exception as exc:
            add_log("Orchestrator", f"Auto-apply failed: {exc}")
            applications = []

        orch.step("Orchestrator", f"Done — {len(scored_jobs)} jobs, "
                                  f"{len(messages)} msgs, {len(applications)} applied")

    return RunAgentResponse(
        jobs=scored_jobs,
        messages=messages,
        signals=signals,
        applications=applications,
        logs=get_logs(),
    )
