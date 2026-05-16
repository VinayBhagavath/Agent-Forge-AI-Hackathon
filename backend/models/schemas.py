from pydantic import BaseModel, Field
from typing import Optional


class Job(BaseModel):
    company: str
    title: str
    url: str
    source: str
    score: Optional[float] = None
    score_reason: Optional[str] = None
    live: bool = False


class RunAgentRequest(BaseModel):
    role: str
    companies: list[str] = Field(default_factory=list)
    resume_text: str = ""


class RecruiterMessage(BaseModel):
    company: str
    message: str


class RecruiterSignal(BaseModel):
    company: str
    signal: str
    source: str
    url: str = ""


class ApplicationResult(BaseModel):
    company: str
    title: str
    status: str          # "submitted" | "failed" | "simulated"
    ats: str             # "Greenhouse" | "Lever" | ...
    detail: str
    confirmation: str = ""


class ResumeAnalysis(BaseModel):
    inferred_role: str
    skills: list[str] = Field(default_factory=list)
    suggested_companies: list[str] = Field(default_factory=list)
    summary: str


class ApplyRequest(BaseModel):
    company: str
    title: str
    url: str
    source: str
    resume_text: str = ""


class AgentLog(BaseModel):
    timestamp: str
    agent: str
    message: str


class RunAgentResponse(BaseModel):
    jobs: list[Job]
    messages: list[RecruiterMessage]
    signals: list[RecruiterSignal] = Field(default_factory=list)
    applications: list[ApplicationResult] = Field(default_factory=list)
    logs: list[AgentLog]
