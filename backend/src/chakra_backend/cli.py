"""Entry point: `chakra <group> <command>`; JSON request on stdin, one JSON envelope on stdout."""
from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass
from typing import Any

from . import db as dbm
from .commands import API_VERSION, COMMANDS
from .errors import ChakraError
from .mailer import AgentMailer, Mailer
from .registry import Registry, load
from .settings import Settings, load_env
from .sheets import GoogleSheets, SheetsClient


@dataclass
class Context:
    settings: Settings
    registry: Registry
    db: Any
    sheets: SheetsClient
    mailer: Mailer
    now: Any = time.time


def default_context() -> Context:
    load_env()
    s = Settings()
    reg = load()
    return Context(s, reg, dbm.connect(s.home / "chakra.sqlite", reg),
                   GoogleSheets(s.get("service_account_path") or ""),
                   AgentMailer(s.get("agentmail_api_key"), s.get("agentmail_inbox_id")))


def run(argv: list[str], stdin_text: str, ctx_factory=default_context) -> tuple[dict, int]:
    try:
        handler = COMMANDS.get((argv[0], argv[1])) if len(argv) >= 2 else None
        if not handler:
            raise ChakraError("invalid_request", "usage: chakra <group> <command>")
        if stdin_text.strip():
            try:
                req = json.loads(stdin_text)
            except json.JSONDecodeError:
                raise ChakraError("invalid_request", "stdin is not valid JSON") from None
            if not isinstance(req, dict):
                raise ChakraError("invalid_request", "request must be a JSON object")
        else:
            req = {}
        return {"ok": True, "data": handler(ctx_factory(), req), "apiVersion": API_VERSION}, 0
    except ChakraError as e:
        return {"ok": False, "error": {"code": e.code, "message": e.message}, "apiVersion": API_VERSION}, 1
    except Exception as e:  # never leak details, secrets could be in them
        print(f"internal error: {type(e).__name__}", file=sys.stderr)
        return {"ok": False, "error": {"code": "internal", "message": "internal error"}, "apiVersion": API_VERSION}, 1


def main() -> None:
    out, code = run(sys.argv[1:], "" if sys.stdin.isatty() else sys.stdin.read())
    sys.stdout.write(json.dumps(out))
    sys.exit(code)
