import httpx
from utils.logger import add_log

AGENT = "LiveJobsService"

COMPANY_SLUGS = {
    "anthropic": "anthropic",
    "openai": "openai",
    "scale ai": "scaleai",
    "cohere": "cohere",
    "perplexity": "perplexityai",
}

def get_greenhouse_jobs(company_slug: str) -> list[dict]:
    try:
        url = f"https://boards-api.greenhouse.io/v1/boards/{company_slug}/jobs"
        response = httpx.get(url, timeout=8.0)
        if response.status_code == 200:
            jobs = response.json().get("jobs", [])
            add_log(AGENT, f"Found {len(jobs)} live jobs at {company_slug} via Greenhouse")
            return [{"title": j.get("title", ""), "url": j.get("absolute_url", ""), "source": "Greenhouse"} for j in jobs[:5]]
    except Exception as e:
        add_log(AGENT, f"Greenhouse fetch failed for {company_slug}: {e}")
    return []

def get_live_jobs(companies: list[str]) -> list[dict]:
    all_jobs = []
    for company in companies:
        slug = COMPANY_SLUGS.get(company.lower())
        if slug:
            jobs = get_greenhouse_jobs(slug)
            for job in jobs:
                job["company"] = company
            all_jobs.extend(jobs)
    add_log(AGENT, f"Total live jobs found: {len(all_jobs)}")
    return all_jobs
