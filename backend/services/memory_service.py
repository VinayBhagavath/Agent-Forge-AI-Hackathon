from utils.logger import add_log

AGENT = "MemoryService"

# In-memory store — Evermind SDK would replace this dict in production
# Evermind integration point: evermind.Client().store(key, value)
_store: dict = {}


def save(key: str, value) -> None:
    _store[key] = value
    add_log(AGENT, f"Stored key='{key}'")


def load(key: str, default=None):
    val = _store.get(key, default)
    add_log(AGENT, f"Loaded key='{key}' (found={key in _store})")
    return val


def all_entries() -> dict:
    return dict(_store)
