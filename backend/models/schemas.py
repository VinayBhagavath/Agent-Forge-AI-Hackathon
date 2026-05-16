from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Job(BaseModel):
    company: str
    title: str
    url: str
    source: str
    score: Optional[float] = None
    score_reason: Optional[str] = None


class RunAgentRequest(BaseModel):
    role: str
    companies: list[str] = Field(default_factory=list)
    resume_text: str = ""


class RecruiterMessage(BaseModel):
    company: str
    message: str


class AgentLog(BaseModel):
    timestamp: str
    agent: str
    message: str


class RunAgentResponse(BaseModel):
    jobs: list[Job]
    messages: list[RecruiterMessage]
    logs: list[AgentLog]
