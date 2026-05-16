"""Bright Data scraping service — fully dynamic.

Live job discovery: for ANY company name, resolve its public ATS board
(Greenhouse or Lever) at runtime by trying slug variants, then scrape the real
postings. No hardcoded company → slug map.

Recruiter signals: real Google News headlines about hiring/funding per company.

If BRIGHTDATA_API_KEY is set, HTTP goes through the Bright Data Web Unlocker
proxy for resilience. Every failure degrades quietly so the demo never breaks.
"""

import os
import re
import html
import httpx
from models.schemas import Job, RecruiterSignal
from utils.logger import add_log

AGENT = "BrightData"
_TIMEOUT = 4.0
_SUFFIXES = (" ai", " labs", " inc", " technologies", " corp", " co", " hq", ".com")


def _proxy_kwargs() -> dict:
    key = os.getenv("BRIGHTDATA_API_KEY", "")
    if not key:
        return {}
    zone = os.getenv("BRIGHTDATA_ZONE", "web_unlocker")
    return {
        "proxy": f"http://brd-customer-{key}-zone-{zone}:{key}@brd.superproxy.io:22225",
        "verify": False,
    }


def _slug_variants(company: str) -> list[str]:
    base = company.strip().lower()
    for suf in _SUFFIXES:
        if base.endswith(suf):
            base = base[: -len(suf)].strip()
    alnum = re.sub(r"[^a-z0-9]", "", base)
    hyphen = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    first = base.split()[0] if base.split() else base
    full_alnum = re.sub(r"[^a-z0-9]", "", company.strip().lower())
    seen, out = set(), []
    for v in (alnum, hyphen, first, full_alnum):
        if v and v not in seen:
            seen.add(v)
            out.append(v)
    return out[:4]


def _role_match(title: str, role: str) -> bool:
    toks = [t for t in re.split(r"[\s/]+", role.lower()) if len(t) > 2]
    if not toks:
        return True
    t = title.lower()
    return any(tok in t for tok in toks)


def _greenhouse(company: str, slug: str, role: str, client: httpx.Client) -> list[Job]:
    try:
        r = client.get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs")
        if r.status_code != 200:
            return []
        jobs = r.json().get("jobs", [])
        out = [
            Job(company=company, title=j.get("title", ""),
                url=j.get("absolute_url", ""), source="Greenhouse", live=True)
            for j in jobs if _role_match(j.get("title", ""), role)
        ]
        return out[:4]
    except Exception:
        return []


def _lever(company: str, slug: str, role: str, client: httpx.Client) -> list[Job]:
    try:
        r = client.get(f"https://api.lever.co/v0/postings/{slug}?mode=json")
        if r.status_code != 200:
            return []
        data = r.json()
        if not isinstance(data, list):
            return []
        out = [
            Job(company=company, title=j.get("text", ""),
                url=j.get("hostedUrl", ""), source="Lever", live=True)
            for j in data if _role_match(j.get("text", ""), role)
        ]
        return out[:4]
    except Exception:
        return []


def fetch_live_jobs(role: str, companies: list[str]) -> list[Job]:
    mode = "Bright Data proxy" if os.getenv("BRIGHTDATA_API_KEY") else "direct ATS APIs"
    add_log(AGENT, f"Resolving live ATS boards via {mode} for {len(companies)} companies")

    results: list[Job] = []
    with httpx.Client(timeout=_TIMEOUT, follow_redirects=True, **_proxy_kwargs()) as client:
        for company in companies[:6]:
            hit = []
            for slug in _slug_variants(company):
                hit = _greenhouse(company, slug, role, client) or _lever(company, slug, role, client)
                if hit:
                    add_log(AGENT, f"{company}: {len(hit)} live jobs via "
                                   f"{hit[0].source} board '{slug}'")
                    break
            if not hit:
                add_log(AGENT, f"{company}: no public Greenhouse/Lever board resolved")
            results += hit
            if len(results) >= 10:
                break

    add_log(AGENT, f"Live scrape returned {len(results)} real postings")
    return results[:10]


# ---- Recruiter signal intelligence (real Google News) --------------------

def _news_signals(company: str, client: httpx.Client) -> list[RecruiterSignal]:
    q = httpx.QueryParams({"q": f"{company} (hiring OR funding OR raised)",
                            "hl": "en-US", "gl": "US", "ceid": "US:en"})
    try:
        r = client.get(f"https://news.google.com/rss/search?{q}")
        if r.status_code != 200:
            return []
        items = re.findall(r"<item>(.*?)</item>", r.text, re.DOTALL)
        out = []
        for item in items[:3]:
            m = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>",
                          item, re.DOTALL)
            if not m:
                continue
            headline = html.unescape(re.sub(r"<.*?>", "", m.group(1))).strip()
            if headline:
                out.append(RecruiterSignal(
                    company=company, signal=headline,
                    source="Google News", url="",
                ))
        return out[:2]
    except Exception:
        return []


def fetch_recruiter_signals(companies: list[str]) -> list[RecruiterSignal]:
    add_log(AGENT, "Scraping live hiring/funding news signals")
    signals: list[RecruiterSignal] = []
    with httpx.Client(timeout=_TIMEOUT, follow_redirects=True, **_proxy_kwargs()) as client:
        for company in companies[:5]:
            s = _news_signals(company, client)
            if s:
                add_log(AGENT, f"{company}: {len(s)} live news signals")
            signals += s
            if len(signals) >= 8:
                break
    add_log(AGENT, f"Found {len(signals)} live hiring-intent signals")
    return signals[:8]
