from services import memory_service
from utils.logger import add_log

AGENT = "MemoryAgent"

# Evermind integration point:
# from evermind import Client as EvermindClient
# _evermind = EvermindClient(api_key=os.getenv("EVERMIND_API_KEY"))


def save_user_preferences(role: str, companies: list[str]) -> None:
    add_log(AGENT, f"Saving user preferences — role='{role}', companies={companies}")
    memory_service.save("preferred_role", role)
    memory_service.save("preferred_companies", companies)
    add_log(AGENT, "User preferences saved to memory")


def get_user_preferences() -> dict:
    add_log(AGENT, "Loading user preferences from memory")
    prefs = {
        "preferred_role": memory_service.load("preferred_role", ""),
        "preferred_companies": memory_service.load("preferred_companies", []),
    }
    add_log(AGENT, f"Preferences loaded — role='{prefs['preferred_role']}'")
    return prefs
