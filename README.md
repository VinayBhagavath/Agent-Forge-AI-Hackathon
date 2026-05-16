# AgentCheck — Autonomous Hiring Intelligence

Built for **Agent Forge 2026 (Sunnyvale)**. AgentCheck is a multi-agent pipeline that reads your resume, discovers real open roles at companies that match your profile, scrapes live recruiter signals, drafts personalized outreach, and autonomously applies — all without hardcoded data.

---

## How it works

Upload a resume (PDF or text). The system:

1. **ResumeAgent** — extracts text from the PDF and passes it to an LLM, which infers your target role, top skills, and a list of real companies that hire that profile.
2. **DiscoveryAgent** — for each company, dynamically resolves its public ATS board (Greenhouse or Lever) by trying slug variants of the company name. Scrapes real live job postings. If too few results, asks the LLM for more companies and retries.
3. **VerificationAgent** — scores each posting for realness (live ATS +30, known board +8, valid URL +7, generic titles penalized).
4. **SignalAgent** — pulls real Google News headlines about hiring, funding, or expansion for each company.
5. **OutreachAgent** — drafts a personalized recruiter message for each job using the LLM.
6. **ApplicationAgent** — autonomously applies to the top job (Actionbook browser automation; falls back to a fully-logged step simulation for demo reliability).

The entire pipeline is orchestrated and traced via **AgentField**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, uvicorn |
| Frontend | React 18, Vite 5 |
| Primary LLM | TokenRouter (`openai/gpt-4o-mini` or any model on your account) |
| Secondary LLM | Qwen (optional fallback) |
| Live job scraping | Greenhouse + Lever public APIs (free, no key needed) |
| Proxy (optional) | Bright Data Web Unlocker |
| Recruiter signals | Google News RSS |
| Orchestration | AgentField |
| Memory | Evermind (in-process store; SDK hook present) |
| Auto-apply | Actionbook (simulated if no key) |
| PDF parsing | pypdf |
| Dev runner | concurrently |

---

## Project structure

```
Agent-Forge-AI-Hackathon/
├── backend/
│   ├── app.py                        # FastAPI app, CORS, router registration
│   ├── .env.example                  # Template — copy to .env and fill in
│   ├── requirements.txt
│   ├── agents/
│   │   ├── discovery_agent.py        # LLM company expansion + live ATS scraping
│   │   ├── verification_agent.py     # Realness scoring
│   │   ├── outreach_agent.py         # LLM recruiter message generation
│   │   ├── signal_agent.py           # Google News recruiter signals
│   │   ├── application_agent.py      # Actionbook auto-apply orchestration
│   │   └── memory_agent.py           # Evermind preference persistence
│   ├── routes/
│   │   └── jobs.py                   # POST /upload-resume, /run-agents, /apply
│   ├── services/
│   │   ├── llm_service.py            # Central LLM wrapper (TokenRouter + Qwen)
│   │   ├── resume_service.py         # PDF extraction + LLM resume analysis
│   │   ├── brightdata_service.py     # ATS scraping + Google News signals
│   │   ├── scoring_service.py        # Job realness scorer
│   │   ├── agentfield_service.py     # AgentField orchestration tracer
│   │   ├── actionbook_service.py     # Actionbook ATS automation
│   │   ├── memory_service.py         # Evermind in-process store
│   │   └── qwen_service.py           # Outreach delegate → llm_service
│   ├── models/
│   │   └── schemas.py                # Pydantic models for all request/response types
│   └── utils/
│       └── logger.py                 # Timestamped agent log collector
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Main UI — resume upload, job cards, signals
│   │   └── main.jsx
│   ├── package.json                  # concurrently scripts
│   └── vite.config.js                # Proxy: /api → localhost:8000
├── Procfile                          # Zeabur / Railway deployment
└── README.md
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [TokenRouter](https://tokenrouter.com) account and API key (the only required key)

### 1. Clone and install

```bash
git clone <repo-url>
cd Agent-Forge-AI-Hackathon

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..

# Frontend dependencies
cd frontend
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set your TokenRouter key and the model you want to use:

```env
TOKENROUTER_API_KEY=sk-your-key-here
TOKENROUTER_BASE_URL=https://api.tokenrouter.com/v1
TOKENROUTER_MODEL=openai/gpt-4o-mini
```

To see which models your account has access to:

```bash
curl -s https://api.tokenrouter.com/v1/models \
  -H "Authorization: Bearer sk-your-key-here" | python3 -m json.tool
```

Everything else in `.env` is optional — live job scraping and news signals work without any additional keys.

### 3. Run

```bash
cd frontend
npm run dev
```

This starts both servers with one command:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

---

## API endpoints

All endpoints are served from `http://localhost:8000`.

### `POST /upload-resume`

Accepts a resume file (PDF or plain text). Returns LLM-inferred role, skills, and suggested companies.

```
Content-Type: multipart/form-data
Body: file=<resume.pdf>
```

Response:
```json
{
  "inferred_role": "Machine Learning Engineer",
  "skills": ["Python", "PyTorch", "Kubernetes", "Docker"],
  "suggested_companies": ["Google", "Anthropic", "NVIDIA", "OpenAI"],
  "summary": "Strong ML infra background..."
}
```

### `POST /run-agents`

Runs the full 6-agent pipeline. Returns live jobs, scored and ranked, plus recruiter signals, outreach messages, and autonomous application results.

```json
{
  "role": "Machine Learning Engineer",
  "companies": ["Anthropic", "OpenAI"],
  "resume_text": "optional — passed through for personalized outreach"
}
```

Response includes: `jobs`, `messages`, `signals`, `applications`, `logs`.

### `POST /apply`

Runs the ApplicationAgent for a single job.

```json
{
  "company": "Anthropic",
  "title": "ML Engineer",
  "url": "https://boards.greenhouse.io/anthropic/jobs/...",
  "source": "Greenhouse",
  "resume_text": "..."
}
```

### `GET /health`

Returns `{"status": "ok"}`.

---

## Sponsor integrations

| Sponsor | Integration | Key required |
|---|---|---|
| **TokenRouter** | Primary LLM for resume analysis, company discovery, outreach | Yes — one key powers everything |
| **Bright Data** | Optional HTTP proxy for ATS scraping resilience | No — direct APIs are free |
| **AgentField** | Orchestration tracing — every agent step is registered and ordered | No — local trace always runs; key sends to hosted timeline |
| **Actionbook** | Browser automation for ATS auto-apply | No — fully-logged simulation runs without a key |
| **Evermind** | Candidate preference memory across sessions | No — in-process store active; SDK hook present for upgrade |

---

## Key design decisions

**No hardcoded data.** There are no company lists, job pools, or signal banks in the code. Every company name, job posting, and news headline is derived at runtime from the resume content and live APIs.

**ATS slug resolution at runtime.** Rather than maintaining a `company → ATS slug` map, `brightdata_service.py` tries up to 4 slug variants of each company name against both Greenhouse and Lever boards until one responds with jobs.

**Demo never breaks.** Every external call has a graceful fallback — no API key returns keyword-based analysis; empty ATS boards log a message and move on; Actionbook without a key simulates every browser step and returns a real-looking confirmation ID.

**Single restart needed after `.env` changes.** `uvicorn --reload` watches `.py` files only. If you update `.env`, kill the process and rerun `npm run dev`.

---

## Deployment

The `Procfile` at the repo root targets Zeabur and Railway:

```
web: cd backend && uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
```

Set `TOKENROUTER_API_KEY` and `TOKENROUTER_MODEL` as environment variables in your hosting dashboard. The frontend should be deployed separately (Vercel, Netlify, or Zeabur static) with `VITE_API_URL` pointing at the deployed backend.

---

## Team

Built at Agent Forge 2026 (Sunnyvale) by a 3-person team:
- **Vinay** — backend, multi-agent orchestration, LLM integration
- **Abrham / Zemen** — browser automation, data pipeline, frontend integration
