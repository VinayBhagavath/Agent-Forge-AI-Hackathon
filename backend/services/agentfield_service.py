"""AgentField orchestration wrapper.

Provides a traced orchestration session so every agent step is registered and
ordered. If AGENTFIELD_API_KEY is set, traces are also pushed to AgentField for
the hosted run timeline; otherwise the trace stays local. Either way the
orchestration is explicit and visible — the point of the sponsor integration.
"""

import os
import time
import httpx
from contextlib import contextmanager
from utils.logger import add_log

AGENT = "AgentField"


class Orchestration:
    def __init__(self, name: str):
        self.name = name
        self.run_id = f"af_{int(time.time())}"
        self.steps: list[dict] = []
        self._key = os.getenv("AGENTFIELD_API_KEY", "")

    def step(self, agent: str, action: str):
        self.steps.append({"agent": agent, "action": action, "t": time.time()})
        add_log(AGENT, f"[{len(self.steps)}] {agent} → {action}")

    def _flush(self):
        if not self._key:
            return
        try:
            httpx.post(
                "https://api.agentfield.dev/v1/runs",
                headers={"Authorization": f"Bearer {self._key}"},
                json={"run_id": self.run_id, "name": self.name, "steps": self.steps},
                timeout=4.0,
            )
            add_log(AGENT, f"Run {self.run_id} pushed to AgentField timeline")
        except Exception as exc:
            add_log(AGENT, f"AgentField push skipped ({type(exc).__name__})")


@contextmanager
def orchestrate(name: str):
    orch = Orchestration(name)
    mode = "hosted" if orch._key else "local"
    add_log(AGENT, f"Orchestration '{name}' started (run {orch.run_id}, {mode})")
    try:
        yield orch
    finally:
        add_log(AGENT, f"Orchestration '{name}' complete — {len(orch.steps)} steps")
        orch._flush()
