"""Per-user data directory and CLI config file. Secrets are never returned to callers."""
from __future__ import annotations

import json
import os
from pathlib import Path

SECRET_KEYS = {"agentmail_api_key"}
KEYS = {"spreadsheet_id", "service_account_path", "agentmail_api_key", "agentmail_inbox_id", "otp_ttl_seconds"}


def data_dir() -> Path:
    if env := os.environ.get("CHAKRA_HOME"):
        return Path(env)
    if os.name == "nt":
        return Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming")) / "chakra"
    return Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")) / "chakra"


class Settings:
    def __init__(self, home: Path | None = None) -> None:
        self.home = home or data_dir()
        self.path = self.home / "config.json"

    def _read(self) -> dict:
        try:
            return json.loads(self.path.read_text("utf-8"))
        except FileNotFoundError:
            return {}

    def get(self, key: str, default=None):
        env = os.environ.get("CHAKRA_" + key.upper())
        return env if env not in (None, "") else self._read().get(key, default)

    def set(self, key: str, value) -> None:
        data = self._read()
        data[key] = value
        self.home.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(data, indent=2), "utf-8")
