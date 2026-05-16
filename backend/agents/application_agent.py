from models.schemas import Job, ApplicationResult
from services.actionbook_service import apply_to_job
from utils.logger import add_log

AGENT = "ApplicationAgent"


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
        try:
            results.append(auto_apply(job, resume_text))
        except Exception as exc:
            add_log(AGENT, f"Application error for {job.company}: {exc}")
    return results
