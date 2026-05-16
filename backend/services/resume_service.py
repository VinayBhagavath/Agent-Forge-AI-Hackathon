"""Resume analysis service.

Primary path: an LLM (TokenRouter) reads the actual resume text and returns the
best target role, the candidate's skills, and a list of real companies that
hire that profile. Nothing about the result is hardcoded — it is derived from
the uploaded document.

Offline fallback: if no LLM is reachable, a lightweight keyword pass infers the
role/skills so the app still responds (companies left empty — discovery will
then ask the LLM, or report that it needs a key).
"""

import io
from utils.logger import add_log
from services.llm_service import llm_json

AGENT = "ResumeAgent"

_SKILL_KEYWORDS = [
    "python", "java", "c++", "go", "rust", "typescript", "javascript", "react",
    "pytorch", "tensorflow", "machine learning", "deep learning", "nlp", "llm",
    "kubernetes", "docker", "aws", "gcp", "distributed systems", "fastapi",
    "data engineering", "sql", "spark", "ml infrastructure", "transformers",
]

_ROLE_RULES = [
    (("machine learning", "pytorch", "tensorflow", "deep learning", "llm", "nlp"), "Machine Learning Engineer"),
    (("kubernetes", "docker", "distributed systems", "infrastructure"), "Infrastructure Engineer"),
    (("data engineering", "spark", "etl", "data pipeline"), "Data Engineer"),
    (("react", "typescript", "frontend"), "Frontend Engineer"),
]


def _extract_text(filename: str, raw: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(raw))
            return "\n".join((p.extract_text() or "") for p in reader.pages)
        except Exception as exc:
            add_log(AGENT, f"PDF parse degraded ({type(exc).__name__}) — using raw bytes")
    try:
        return raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _keyword_fallback(text: str) -> dict:
    low = text.lower()
    skills = [k.title() for k in _SKILL_KEYWORDS if k in low]
    role = "Software Engineer"
    for keys, r in _ROLE_RULES:
        if any(k in low for k in keys):
            role = r
            break
    add_log(AGENT, f"Offline keyword analysis → role='{role}', {len(skills)} skills")
    return {
        "inferred_role": role,
        "skills": skills[:10],
        "suggested_companies": [],
        "summary": f"Offline analysis: {role} profile, {len(skills)} skills detected "
                   f"(LLM unavailable — set TOKENROUTER_API_KEY for company matching).",
    }


def analyze_resume(filename: str, raw: bytes) -> dict:
    add_log(AGENT, f"Analyzing resume '{filename or 'pasted text'}'")
    text = _extract_text(filename, raw).strip()
    if not text:
        return _keyword_fallback("")

    prompt = (
        "Analyze this candidate resume. Determine the single best job title to "
        "search for, the top technical skills, and 6 to 10 REAL companies that "
        "actively hire this profile and are likely to have public job boards "
        "(prefer well-known tech/AI companies). Resume:\n\n"
        f"{text[:5000]}\n\n"
        'JSON shape: {"inferred_role": str, "skills": [str], '
        '"suggested_companies": [str], "summary": str}'
    )
    data = llm_json(prompt)

    if data and data.get("inferred_role") and data.get("suggested_companies"):
        result = {
            "inferred_role": str(data["inferred_role"])[:80],
            "skills": [str(s)[:30] for s in data.get("skills", [])][:10],
            "suggested_companies": [str(c)[:50] for c in data["suggested_companies"]][:10],
            "summary": str(data.get("summary", ""))[:240]
                       or f"{data['inferred_role']} profile matched to "
                          f"{len(data['suggested_companies'])} hiring companies.",
        }
        add_log(AGENT, f"LLM resume analysis → role='{result['inferred_role']}', "
                       f"{len(result['skills'])} skills, "
                       f"{len(result['suggested_companies'])} companies")
        return result

    add_log(AGENT, "LLM analysis unavailable — falling back to keyword pass")
    return _keyword_fallback(text)
