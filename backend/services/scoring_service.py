import re

from agents.verification_agent import verify_job
from models.schemas import Job
from services.llm_service import llm_json
from utils.logger import add_log

AGENT = "FitScoringAgent"

_SKILL_KEYWORDS = [
    "python", "java", "c++", "go", "rust", "typescript", "javascript", "react",
    "node", "fastapi", "django", "sql", "postgres", "spark", "airflow",
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "machine learning", "deep learning", "nlp", "llm", "rag", "agents",
    "pytorch", "tensorflow", "transformers", "data engineering",
    "distributed systems", "ml infrastructure", "computer vision",
]


def _candidate_skills(resume_text: str) -> list[str]:
    low = resume_text.lower()
    skills = [s for s in _SKILL_KEYWORDS if s in low]
    seen, out = set(), []
    for skill in skills:
        normalized = skill.title()
        if normalized not in seen:
            seen.add(normalized)
            out.append(normalized)
    return out[:12]


def _fallback_fit(job: Job, resume_text: str) -> dict:
    skills = _candidate_skills(resume_text)
    title = job.title.lower()
    matched = [s for s in skills if any(part in title for part in s.lower().split())]

    role_terms = [t for t in re.split(r"[^a-z0-9+#]+", title) if len(t) > 2]
    resume_low = resume_text.lower()
    title_hits = [t for t in role_terms if t in resume_low][:4]

    fit = 45 + min(30, len(matched) * 8) + min(15, len(title_hits) * 4)
    if not resume_text.strip():
        fit = 55

    reason_bits = []
    if matched:
        reason_bits.append(f"matched resume skills: {', '.join(matched[:4])}")
    if title_hits:
        reason_bits.append(f"title aligns with: {', '.join(title_hits[:4])}")
    if not reason_bits:
        reason_bits.append("limited resume-title overlap found")

    return {
        "fit_score": max(0, min(100, fit)),
        "reason": "; ".join(reason_bits),
        "matched_skills": matched[:5],
        "missing_skills": [],
    }


def _llm_fit_scores(jobs: list[Job], resume_text: str) -> dict[int, dict]:
    if not resume_text.strip() or not jobs:
        return {}

    job_lines = "\n".join(
        f"{i}. {job.title} @ {job.company} ({job.source})"
        for i, job in enumerate(jobs)
    )
    prompt = (
        "Score each job for this exact resume. Use specific skills, projects, "
        "domains, seniority, and experience evidence from the resume. Do not give "
        "every job the same score. Penalize jobs whose title/domain does not match. "
        "For each job, return a concise custom reason, matched_skills from the "
        "resume, missing_skills/gaps, and a realistic US base salary_range string "
        "(e.g. '$140k–$190k/yr') based on the role title and company.\n\n"
        f"Resume:\n{resume_text[:8000]}\n\nJobs:\n{job_lines}\n\n"
        'JSON shape: {"jobs":[{"index": int, "fit_score": int, "reason": str, '
        '"matched_skills": [str], "missing_skills": [str], "salary_range": str}]}'
    )
    data = llm_json(prompt, max_tokens=1400)
    rows = (data or {}).get("jobs", [])
    out: dict[int, dict] = {}
    for row in rows:
        try:
            idx = int(row.get("index"))
        except Exception:
            continue
        if 0 <= idx < len(jobs):
            try:
                fit_score = int(row.get("fit_score", 0))
            except Exception:
                fit_score = 0
            matched = row.get("matched_skills") or []
            missing = row.get("missing_skills") or []
            out[idx] = {
                "fit_score": max(0, min(100, fit_score)),
                "reason": str(row.get("reason", ""))[:220],
                "matched_skills": [str(s)[:30] for s in matched][:5],
                "missing_skills": [str(s)[:30] for s in missing][:4],
                "salary_range": str(row.get("salary_range", ""))[:40] or None,
            }
    if out:
        add_log(AGENT, f"Resume-aware model scored {len(out)} jobs (incl. salary bands)")
    return out


def score_jobs(jobs: list[Job], resume_text: str = "") -> list[Job]:
    fit_scores = _llm_fit_scores(jobs, resume_text)
    scored = []
    for idx, job in enumerate(jobs):
        realness = verify_job(job)
        fit = fit_scores.get(idx) or _fallback_fit(job, resume_text)

        final_score = round((realness["score"] * 0.35) + (fit["fit_score"] * 0.65))
        matched = fit.get("matched_skills", [])
        missing = fit.get("missing_skills", [])
        gap = f" Gap: {', '.join(missing[:3])}." if missing else ""
        reason = (
            f"Resume fit {fit['fit_score']}/100: {fit['reason']}.{gap} "
            f"Realness: {realness['reason']}."
        )
        # Prefer real salary from ATS; fall back to LLM estimate
        salary = job.salary_range or fit.get("salary_range") or None
        add_log(AGENT, f"{job.company}: resume fit {fit['fit_score']}/100, final {final_score}/100"
                       + (f", salary {salary}" if salary else ""))
        scored.append(job.model_copy(update={
            "score": final_score,
            "score_reason": reason[:320],
            "matched_skills": matched,
            "missing_skills": missing,
            "salary_range": salary,
        }))
    return sorted(scored, key=lambda j: j.score or 0, reverse=True)
