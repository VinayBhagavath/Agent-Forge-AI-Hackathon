from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routes.jobs import router as jobs_router

app = FastAPI(title="AgentCheck API", version="0.1.0")

# CORS — wide open for demo robustness (any frontend host/port can call us).
# allow_credentials must be False when allow_origins is "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router)


@app.get("/health")
def health():
    return {"status": "ok"}
