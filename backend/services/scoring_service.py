from models.schemas import Job
from agents.verification_agent import verify_job


def score_jobs(jobs: list[Job]) -> list[Job]:
    scored = []
    for job in jobs:
        result = verify_job(job)
        scored.append(job.model_copy(update={
            "score": result["score"],
            "score_reason": result["reason"],
        }))
    return sorted(scored, key=lambda j: j.score or 0, reverse=True)
