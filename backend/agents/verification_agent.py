"""Verification agent — company-agnostic realness scoring.

Scores each posting purely from its own observable signals (was it scraped
live from a real ATS, does it have a valid application URL, is the title
reasonable). No hardcoded company allowlist — a job is "real" because it was
just fetched from a live board, not because of who posted it.
"""

from models.schemas import Job
from utils.logger import add_log

AGENT = "VerificationAgent"
_LIVE_ATS = {"Greenhouse", "Lever", "Ashby", "Workable"}


def verify_job(job: Job) -> dict:
    add_log(AGENT, f"Verifying: {job.title} @ {job.company}")

    score = 55
    reasons = []

    if job.live:
        score += 30
        reasons.append("scraped live from real ATS")
    if job.source in _LIVE_ATS:
        score += 8
        reasons.append(f"{job.source} board")
    if job.url.startswith("http"):
        score += 7
        reasons.append("valid application link")

    tl = len(job.title)
    if tl == 0:
        score -= 25
        reasons.append("missing title")
    elif tl > 70:
        score -= 10
        reasons.append("long/vague title")

    score = max(0, min(100, score))
    reason = ", ".join(reasons).capitalize() if reasons else "Limited signals"
    add_log(AGENT, f"Scored {job.company} — {score}/100 ({reason})")
    return {"score": score, "reason": reason}
