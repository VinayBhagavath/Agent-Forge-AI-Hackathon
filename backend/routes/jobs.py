from fastapi import APIRouter
from models.schemas import RunAgentRequest, RunAgentResponse
from utils.logger import add_log, get_logs, clear_logs
from agents.discovery_agent import discover_jobs
from agents.memory_agent import save_user_preferences, get_user_preferences
from agents.outreach_agent import generate_messages
from services.scoring_service import score_jobs

router = APIRouter()


@router.post("/run-agents", response_model=RunAgentResponse)
def run_agents(req: RunAgentRequest):
    clear_logs()

    add_log("Orchestrator", f"Pipeline started — role='{req.role}'")

    # Step 1: persist preferences
    try:
        save_user_preferences(req.role, req.companies)
    except Exception as exc:
        add_log("Orchestrator", f"Memory save failed: {exc}")

    # Step 2: recall context
    try:
        get_user_preferences()
    except Exception as exc:
        add_log("Orchestrator", f"Memory load failed: {exc}")

    # Step 3: discover jobs
    try:
        jobs = discover_jobs(req.role, req.companies)
    except Exception as exc:
        add_log("Orchestrator", f"Discovery failed: {exc}")
        jobs = []

    # Step 4: score and sort jobs
    try:
        add_log("Orchestrator", "Running verification & scoring pipeline")
        scored_jobs = score_jobs(jobs)
    except Exception as exc:
        add_log("Orchestrator", f"Scoring failed: {exc}")
        scored_jobs = jobs

    # Step 5: generate outreach for top jobs
    try:
        messages = generate_messages(scored_jobs, req.role)
    except Exception as exc:
        add_log("Orchestrator", f"Outreach failed: {exc}")
        messages = []

    add_log("Orchestrator", f"Pipeline complete — {len(scored_jobs)} jobs, {len(messages)} messages")

    return RunAgentResponse(
        jobs=scored_jobs,
        messages=messages,
        logs=get_logs(),
    )
