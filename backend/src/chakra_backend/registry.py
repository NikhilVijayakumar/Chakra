"""Content registry: the single place that maps Google Sheets tabs to cache tables."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from importlib import resources
from pathlib import Path

_IDENT = re.compile(r"^[a-z_][a-z0-9_]*$")


@dataclass(frozen=True)
class Content:
    id: str
    tab: str
    key: list[str]
    columns: list[str]
    feature: str | None = None
    push: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Registry:
    contents: dict[str, Content]
    auth: dict
    apps: dict
    provisional: bool = False

    def get(self, content_id: str) -> Content:
        from .errors import ChakraError

        if content_id not in self.contents:
            raise ChakraError("unknown_content", f"unknown content '{content_id}'")
        return self.contents[content_id]


def _ident(value: str) -> str:
    if not _IDENT.match(value):  # names go into SQL, so they must be plain identifiers
        raise ValueError(f"invalid identifier in registry: {value!r}")
    return value


def parse(data: dict) -> Registry:
    contents: dict[str, Content] = {}
    for c in data["contents"]:
        cols = [_ident(x) for x in c["columns"]]
        key = [_ident(x) for x in c["key"]]
        push = [_ident(x) for x in c.get("push", [])]
        if not set(key) <= set(cols) or not set(push) <= set(cols):
            raise ValueError(f"content {c['id']}: key/push must be columns")
        contents[_ident(c["id"])] = Content(c["id"], c["tab"], key, cols, c.get("feature"), push)
    return Registry(contents, data.get("auth", {}), data.get("apps", {}), bool(data.get("provisional")))


def load(path: Path | None = None) -> Registry:
    text = path.read_text("utf-8") if path else resources.files("chakra_backend").joinpath("contents.json").read_text("utf-8")
    return parse(json.loads(text))
