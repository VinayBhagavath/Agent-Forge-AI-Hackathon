from models.schemas import Job, RecruiterMessage
from services.qwen_service import generate_outreach
from utils.logger import add_log

AGENT = "OutreachAgent"
TOP_N = 3


def generate_messages(jobs: list[Job], role: str, resume_text: str = "") -> list[RecruiterMessage]:
    top_jobs = jobs[:TOP_N]
    add_log(AGENT, f"Generating outreach for top {len(top_jobs)} jobs")

    messages: list[RecruiterMessage] = []
    for job in top_jobs:
        try:
            text = generate_outreach(job.company, role, job.title, resume_text)
            messages.append(RecruiterMessage(company=job.company, message=text))
            add_log(AGENT, f"Outreach ready for {job.company}")
        except Exception as exc:
            add_log(AGENT, f"Skipped {job.company} — {exc}")

    add_log(AGENT, f"Outreach generation complete ({len(messages)} messages)")
    return messages
