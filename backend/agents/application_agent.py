from models.schemas import Job, ApplicationResult
from services.actionbook_service import apply_to_job
from utils.logger import add_log

AGENT = "ApplicationAgent"
MIN_AUTO_APPLY_SCORE = 72
SUPPORTED_SOURCES = {"Greenhouse", "Lever"}


def auto_apply(job: Job, resume_text: str) -> ApplicationResult:
    add_log(AGENT, f"Dispatching autonomous application for {job.company}")
    result = apply_to_job(
        company=job.company,
        title=job.title,
        url=job.url,
        source=job.source,
        resume_text=resume_text,
    )
    add_log(AGENT, f"Application outcome for {job.company}: {result['status']}")
    return ApplicationResult(**result)


def auto_apply_top(jobs: list[Job], resume_text: str, limit: int = 1) -> list[ApplicationResult]:
    """Autonomously apply to the top supported job(s) — one success is the win."""
    results: list[ApplicationResult] = []
    for job in jobs:
        if len(results) >= limit:
            break
        if job.source not in SUPPORTED_SOURCES:
            add_log(AGENT, f"Skipping {job.company}: {job.source} is not auto-fillable")
            continue
        if (job.score or 0) < MIN_AUTO_APPLY_SCORE:
            add_log(AGENT, f"Skipping {job.company}: resume fit below auto-apply threshold")
            continue
        try:
            results.append(auto_apply(job, resume_text))
        except Exception as exc:
            add_log(AGENT, f"Application error for {job.company}: {exc}")
    return results
