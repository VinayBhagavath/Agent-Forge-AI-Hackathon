from models.schemas import Job
from utils.logger import add_log

AGENT = "DiscoveryAgent"

_JOB_POOL = [
    Job(company="Anthropic", title="ML Engineer Intern", url="https://boards.greenhouse.io/anthropic/jobs/1", source="Greenhouse"),
    Job(company="Perplexity", title="ML Infrastructure Intern", url="https://jobs.ashbyhq.com/perplexity/2", source="Ashby"),
    Job(company="OpenAI", title="Research Engineer Intern", url="https://boards.greenhouse.io/openai/jobs/3", source="Greenhouse"),
    Job(company="Mistral AI", title="Software Engineer Intern", url="https://jobs.lever.co/mistral/4", source="Lever"),
    Job(company="Cohere", title="Applied ML Intern", url="https://boards.greenhouse.io/cohere/jobs/5", source="Greenhouse"),
    Job(company="Groq", title="Systems Engineer Intern", url="https://jobs.ashbyhq.com/groq/6", source="Ashby"),
    Job(company="Together AI", title="ML Research Intern", url="https://jobs.lever.co/togetherai/7", source="Lever"),
    Job(company="Scale AI", title="Software Engineering Intern", url="https://boards.greenhouse.io/scaleai/jobs/8", source="Greenhouse"),
    Job(company="Hugging Face", title="Machine Learning Intern", url="https://apply.workable.com/huggingface/9", source="Workable"),
    Job(company="Runway ML", title="Deep Learning Intern", url="https://jobs.ashbyhq.com/runwayml/10", source="Ashby"),
]

_KNOWN_AI_STARTUPS = {
    "anthropic", "perplexity", "openai", "mistral ai", "cohere",
    "groq", "together ai", "scale ai", "hugging face", "runway ml",
}


def discover_jobs(role: str, companies: list[str]) -> list[Job]:
    add_log(AGENT, f"Starting discovery for role='{role}' across {len(companies)} target companies")

    results: list[Job] = []

    # Include jobs matching requested companies first
    requested_lower = {c.lower() for c in companies}
    for job in _JOB_POOL:
        if job.company.lower() in requested_lower:
            results.append(job.model_copy())

    # Fill up to 8 jobs with relevant pool entries not already added
    added_companies = {j.company for j in results}
    for job in _JOB_POOL:
        if len(results) >= 8:
            break
        if job.company not in added_companies:
            results.append(job.model_copy())
            added_companies.add(job.company)

    add_log(AGENT, f"Found {len(results)} job listings matching criteria")
    return results
