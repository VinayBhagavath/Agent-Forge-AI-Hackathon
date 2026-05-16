from models.schemas import RecruiterSignal
from services.brightdata_service import fetch_recruiter_signals
from utils.logger import add_log

AGENT = "SignalAgent"


def gather_signals(companies: list[str]) -> list[RecruiterSignal]:
    add_log(AGENT, "Scanning for recruiter hiring intent")
    try:
        signals = fetch_recruiter_signals(companies)
    except Exception as exc:
        add_log(AGENT, f"Signal scrape failed ({exc}) — continuing")
        signals = []
    add_log(AGENT, f"{len(signals)} hiring signals collected")
    return signals
