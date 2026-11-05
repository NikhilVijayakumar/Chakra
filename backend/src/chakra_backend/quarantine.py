"""Rows that fail validation or conflict during sync are held here until someone resolves them."""
from __future__ import annotations

import json
import secrets

from . import appfeatures, validate, writes
from .errors import ChakraError


def record(ctx, content_id: str, record_id: str | None, reason: str, details: str, sheets_data: dict, local_data: dict | None = None) -> None:
    ex = ctx.db.execute("SELECT id FROM quarantine WHERE content=? AND record_id=? AND reason=? AND status='pending'",
                        (content_id, record_id or "", reason)).fetchone()
    sd, ld = json.dumps(sheets_data), json.dumps(local_data) if local_data else None
    if ex:
        ctx.db.execute("UPDATE quarantine SET sheets_data=?, local_data=?, details=? WHERE id=?", (sd, ld, details, ex["id"]))
    else:
        ctx.db.execute("INSERT INTO quarantine VALUES (?,?,?,?,?,?,?,'pending',?)",
                       (f"QRN{int(ctx.now() * 1000)}{secrets.token_hex(2).upper()}", content_id, record_id or "", reason, details, sd, ld, int(ctx.now())))


def pending_count(db) -> int:
    return db.execute("SELECT COUNT(*) FROM quarantine WHERE status='pending'").fetchone()[0]


def _entry(r) -> dict:
    return {"id": r["id"], "content": r["content"], "recordId": r["record_id"] or None, "reason": r["reason"], "details": r["details"],
            "sheetsData": json.loads(r["sheets_data"]), "localData": json.loads(r["local_data"]) if r["local_data"] else None,
            "status": r["status"], "createdAt": r["created_at"]}


def _get(ctx, req: dict):
    appfeatures.need_enabled(ctx, req)
    r = ctx.db.execute("SELECT * FROM quarantine WHERE id=?", (req.get("id") if isinstance(req.get("id"), str) else "",)).fetchone()
    if not r:
        raise ChakraError("quarantine_unknown", "no such quarantine entry")
    return r


def _resolve(ctx, id_: str, status: str = "resolved") -> None:
    ctx.db.execute("UPDATE quarantine SET status=? WHERE id=?", (status, id_))
    ctx.db.commit()


def list_(ctx, req: dict) -> dict:
    appfeatures.need_enabled(ctx, req)
    rows = ctx.db.execute("SELECT * FROM quarantine WHERE status=? ORDER BY created_at DESC, rowid DESC", (req.get("status") or "pending",))
    return {"entries": [_entry(r) for r in rows]}


def count(ctx, req: dict) -> dict:
    appfeatures.need_enabled(ctx, req)
    return {"count": pending_count(ctx.db)}


def reject(ctx, req: dict) -> dict:
    _resolve(ctx, _get(ctx, req)["id"], "rejected")
    return {"updated": True}


delete_record = reject  # same outcome: the entry is closed as rejected


def accept_sheets(ctx, req: dict) -> dict:
    r = _get(ctx, req)
    if r["reason"] != "conflict":  # the sheet row failed validation: force it into the cache as a clean row
        content = ctx.registry.get(r["content"])
        d = json.loads(r["sheets_data"])
        if not str(d.get("id") or "").strip():
            raise ChakraError("validation_failed", "the sheet row has no id; use fix instead")
        cols = [*content.columns, "sync", "is_dirty", "is_deleted"]
        vals = [str(d.get(c, "")) for c in content.columns] + [int(d.get("sync") or 0), 0, 0]
        ctx.db.execute(f"INSERT OR REPLACE INTO c_{content.id} ({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})", vals)
    _resolve(ctx, r["id"])
    return {"updated": True}


def apply_local(ctx, req: dict) -> dict:
    r = _get(ctx, req)
    if r["reason"] != "conflict" or not r["local_data"]:
        raise ChakraError("invalid_request", "apply-local is only valid for conflicts that keep local data")
    content = ctx.registry.get(r["content"])
    writes.store(ctx, content, {c: str(v) for c, v in json.loads(r["local_data"]).items() if c in content.columns})
    _resolve(ctx, r["id"])
    return {"updated": True}


def fix(ctx, req: dict) -> dict:
    r = _get(ctx, req)
    content = ctx.registry.get(r["content"])
    rec = writes._clean(ctx, content, writes._record(req))
    if not rec.get("id", "").strip():
        rec["id"] = writes.next_id(ctx.db, content)
    writes._fail(content, rec, ctx.db, ctx.registry)
    writes.store(ctx, content, rec)
    _resolve(ctx, r["id"])
    return {"row": writes._public(content, rec)}


def scan(ctx, req: dict) -> dict:
    """Validate cached rows; a failing row is hidden (not deleted from the sheet) and quarantined."""
    appfeatures.need_enabled(ctx, req)
    new = 0
    for content in ctx.registry.contents.values():
        if not content.writable:
            continue
        for row in ctx.db.execute(f"SELECT * FROM c_{content.id} WHERE is_deleted=0").fetchall():
            rec = {c: row[c] for c in content.columns}
            bad = validate.check(ctx.db, ctx.registry, content, rec)
            if bad:
                before = pending_count(ctx.db)
                record(ctx, content.id, rec.get(content.key[0]), bad[0], bad[1], rec | {"sync": row["sync"]})
                new += pending_count(ctx.db) - before
                ctx.db.execute(f"UPDATE c_{content.id} SET is_deleted=1 WHERE {content.key[0]}=?", (rec[content.key[0]],))
    ctx.db.commit()
    return {"newIssues": new}
