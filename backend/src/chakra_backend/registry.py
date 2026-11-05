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
    writable: bool = False
    id_prefix: str | None = None
    required: list[str] = field(default_factory=list)
    relations: list[tuple[str, str]] = field(default_factory=list)  # (column, related content id)
    integers: list[str] = field(default_factory=list)
    hidden: list[str] = field(default_factory=list)  # stored, never returned to callers


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
        extra = {k: [_ident(x) for x in c.get(k, [])] for k in ("required", "integers", "hidden")}
        rels = [(_ident(r["column"]), _ident(r["content"])) for r in c.get("relations", [])]
        if not set(key) | set(extra["required"]) | set(extra["integers"]) | set(extra["hidden"]) | {r[0] for r in rels} <= set(cols):
            raise ValueError(f"content {c['id']}: key/required/integers/hidden/relations must be columns")
        writable = bool(c.get("writable"))
        if writable and key != ["id"]:
            raise ValueError(f"content {c['id']}: writable contents need the single key 'id'")
        contents[_ident(c["id"])] = Content(c["id"], c["tab"], key, cols, c.get("feature"), writable,
                                            c.get("id_prefix"), extra["required"], rels, extra["integers"], extra["hidden"])
    for c in contents.values():
        for _, target in c.relations:
            if target not in contents:
                raise ValueError(f"content {c.id}: relation to unknown content {target}")
    return Registry(contents, data.get("auth", {}), data.get("apps", {}), bool(data.get("provisional")))


def load(path: Path | None = None) -> Registry:
    text = path.read_text("utf-8") if path else resources.files("chakra_backend").joinpath("contents.json").read_text("utf-8")
    return parse(json.loads(text))
