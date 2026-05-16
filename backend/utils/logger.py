from datetime import datetime, timezone
from models.schemas import AgentLog

_logs: list[AgentLog] = []


def add_log(agent_name: str, message: str) -> None:
    entry = AgentLog(
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent=agent_name,
        message=message,
    )
    _logs.append(entry)
    print(f"[{agent_name}] {message}")


def get_logs() -> list[AgentLog]:
    return list(_logs)


def clear_logs() -> None:
    _logs.clear()
