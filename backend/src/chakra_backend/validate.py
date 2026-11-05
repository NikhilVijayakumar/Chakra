"""One validator for writes, sheet pulls and scans. Returns (reason, detail) or None."""
from __future__ import annotations


def check(db, registry, content, rec: dict) -> tuple[str, str] | None:
    g = lambda c: str(rec.get(c) or "").strip()  # noqa: E731
    if not all(g(k) for k in content.key):
        return "missing_id", "record has no id"
    missing = [c for c in content.required if not g(c)]
    if missing:
        return "missing_required", f"{', '.join(missing)} {'is' if len(missing) == 1 else 'are'} required"
    for col in content.integers:
        if g(col):
            try:
                int(g(col))
            except ValueError:
                return "type_mismatch", f"{col} must be a whole number"
    for col, target in content.relations:
        if g(col):
            t = registry.contents[target]
            found = db.execute(f"SELECT 1 FROM c_{t.id} WHERE {t.key[0]}=? AND is_deleted=0", (g(col),)).fetchone()
            if not found:
                return "invalid_relation", f"{col} '{g(col)}' does not exist"
    return None
