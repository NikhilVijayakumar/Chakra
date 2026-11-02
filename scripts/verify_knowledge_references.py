#!/usr/bin/env python3
"""Check Markdown links to OKF concepts in explicitly supplied delivery files."""

import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
BUNDLES = tuple((ROOT / path).resolve() for path in ("knowledge", "backend/knowledge", "frontend/knowledge"))
LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def check(path: Path) -> list[str]:
    errors = []
    references = 0
    try:
        content = path.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"{path}: {exc}"]
    for target in LINK.findall(content):
        target = unquote(target.split("#", 1)[0].strip().strip("<>"))
        if not target or "://" in target or target.startswith("mailto:"):
            continue
        resolved = (path.parent / target).resolve()
        if any(resolved.is_relative_to(bundle) for bundle in BUNDLES):
            references += 1
            if not resolved.is_file() or resolved.suffix != ".md" or resolved.name in {"index.md", "log.md"}:
                errors.append(f"{path}: invalid knowledge concept link: {target}")
        elif "knowledge/" in target.replace("\\", "/"):
            errors.append(f"{path}: knowledge link outside configured bundles: {target}")
    if not references:
        errors.append(f"{path}: no Markdown links to knowledge concepts")
    return errors


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/verify_knowledge_references.py <delivery.md> [...]", file=sys.stderr)
        return 2
    errors = [error for name in sys.argv[1:] for error in check(Path(name).resolve())]
    for error in errors:
        print(f"FAIL  {error}")
    if not errors:
        print("Knowledge references: OK")
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main())
