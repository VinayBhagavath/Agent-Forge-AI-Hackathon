from models.schemas import Job
from services.brightdata_service import fetch_live_jobs
from services.llm_service import llm_json
from utils.logger import add_log

AGENT = "DiscoveryAgent"


def _llm_companies(role: str, resume_text: str, exclude: list[str]) -> list[str]:
    """Ask the LLM which real companies are hiring for this role/profile."""
    prompt = (
        f"List 8 real, well-known companies currently hiring for '{role}' "
        f"roles that are likely to have a public Greenhouse or Lever job board."
    )
    if resume_text.strip():
        prompt += f" Tailor to this candidate background:\n{resume_text[:1500]}"
    if exclude:
        prompt += f"\nDo NOT repeat: {', '.join(exclude)}."
    prompt += '\nJSON shape: {"companies": [str]}'
    data = llm_json(prompt, max_tokens=300)
    companies = [str(c)[:50] for c in (data or {}).get("companies", [])]
    if companies:
        add_log(AGENT, f"LLM suggested {len(companies)} companies for '{role}'")
    return companies


def discover_jobs(role: str, companies: list[str], resume_text: str = "") -> list[Job]:
    companies = [c for c in (companies or []) if c.strip()]
    add_log(AGENT, f"Starting discovery for role='{role}' "
                   f"({len(companies)} companies provided)")

    # No explicit targets → derive them from the role/resume via LLM.
    if not companies:
        add_log(AGENT, "No companies given — asking LLM based on role/resume")
        companies = _llm_companies(role, resume_text, exclude=[])

    results: list[Job] = []
    if companies:
        results = fetch_live_jobs(role, companies)

    # Thin results → expand the company set once via LLM and re-scrape.
    if len(results) < 3:
        add_log(AGENT, "Few live results — expanding company set via LLM")
        more = _llm_companies(role, resume_text, exclude=companies)
        if more:
            results += fetch_live_jobs(role, more)

    # De-dup
    seen, deduped = set(), []
    for j in results:
        key = (j.company.lower(), j.title.lower())
        if key not in seen:
            seen.add(key)
            deduped.append(j)

    if not deduped:
        add_log(AGENT, "No live postings resolved — try different/role companies "
                       "(no fabricated jobs returned)")
    add_log(AGENT, f"Discovery complete — {len(deduped)} live job listings")
    return deduped[:10]
