"""Central LLM service.

One entry point for every LLM call (resume analysis, company discovery,
recruiter outreach).

Primary: TokenRouter — which implements the OpenAI **Responses API**
(`POST {base}/v1/responses` with an `input` field), NOT chat/completions.
This matches TokenRouter's official SDK: client.responses.create(
model="auto:balance", input=...).

Secondary: Qwen — a standard OpenAI **chat/completions** API.

Returns None on any failure so callers degrade gracefully.
"""

import os
import json
import re
import httpx
from utils.logger import add_log

AGENT = "LLM"
_TIMEOUT = 45.0


def _providers() -> list[dict]:
    out = []
    tr_key = os.getenv("TOKENROUTER_API_KEY", "")
    if tr_key:
        base = os.getenv("TOKENROUTER_BASE_URL", "https://api.tokenrouter.com/v1").rstrip("/")
        out.append({
            "name": "TokenRouter",
            "kind": "chat",
            "url": f"{base}/chat/completions",
            "key": tr_key,
            "model": os.getenv("TOKENROUTER_MODEL", "auto:balance"),
        })
    qw_key = os.getenv("QWEN_API_KEY", "")
    if qw_key:
        base = os.getenv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1").rstrip("/")
        out.append({
            "name": "Qwen",
            "kind": "chat",
            "url": f"{base}/chat/completions",
            "key": qw_key,
            "model": os.getenv("QWEN_MODEL", "qwen-plus"),
        })
    return out


def _parse_responses(data: dict) -> str | None:
    """Extract text from an OpenAI Responses-API payload (several shapes)."""
    if isinstance(data.get("output_text"), str) and data["output_text"].strip():
        return data["output_text"].strip()
    out = data.get("output")
    if isinstance(out, list):
        chunks = []
        for item in out:
            for c in item.get("content", []) if isinstance(item, dict) else []:
                t = c.get("text") if isinstance(c, dict) else None
                if t:
                    chunks.append(t)
        if chunks:
            return "".join(chunks).strip()
    # Some routers still return chat-shaped payloads
    try:
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def _call(p: dict, system: str, prompt: str, max_tokens: int, temperature: float) -> str | None:
    headers = {"Authorization": f"Bearer {p['key']}", "Content-Type": "application/json"}
    try:
        if p["kind"] == "responses":
            text_input = f"{system}\n\n{prompt}" if system else prompt
            r = httpx.post(p["url"], headers=headers, timeout=_TIMEOUT, json={
                "model": p["model"],
                "input": text_input,
                "max_output_tokens": max_tokens,
                "temperature": temperature,
            })
            r.raise_for_status()
            return _parse_responses(r.json())
        else:
            messages = ([{"role": "system", "content": system}] if system else []) \
                + [{"role": "user", "content": prompt}]
            r = httpx.post(p["url"], headers=headers, timeout=_TIMEOUT, json={
                "model": p["model"], "messages": messages,
                "max_tokens": max_tokens, "temperature": temperature,
            })
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        body = e.response.text[:140].replace("\n", " ")
        add_log(AGENT, f"{p['name']} HTTP {e.response.status_code} at {p['url']} :: {body}")
    except Exception as e:
        add_log(AGENT, f"{p['name']} call failed ({type(e).__name__}) at {p['url']}")
    return None


def llm_chat(prompt: str, system: str = "", max_tokens: int = 400,
             temperature: float = 0.6) -> str | None:
    providers = _providers()
    if not providers:
        add_log(AGENT, "No LLM key configured — deterministic fallback")
        return None
    for p in providers:
        text = _call(p, system, prompt, max_tokens, temperature)
        if text:
            add_log(AGENT, f"{p['name']} ({p['model']}) responded")
            return text
    return None


def llm_json(prompt: str, system: str = "", max_tokens: int = 600) -> dict | None:
    raw = llm_chat(
        prompt + "\n\nReturn ONLY valid minified JSON, no prose, no code fences.",
        system=system or "You are a precise API that replies with JSON only.",
        max_tokens=max_tokens,
        temperature=0.3,
    )
    if not raw:
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    add_log(AGENT, "LLM JSON parse failed — caller will fall back")
    return None


def active_provider() -> str:
    p = _providers()
    return p[0]["name"] if p else "none"
