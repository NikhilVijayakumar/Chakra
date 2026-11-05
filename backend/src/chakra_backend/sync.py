"""Sync with Google Sheets. Writable contents: push local edits, then pull and merge. Others: replace from the sheet."""
from __future__ import annotations

import time

from . import db as dbm
from . import quarantine, validate
from .errors import ChakraError


def _norm(h: str) -> str:
    return h.strip().lower().replace("_", "").replace(" ", "")


def _index(header: list[str], columns: list[str]) -> list[int]:
    h = [_norm(x) for x in header]
    missing = [c for c in columns if _norm(c) not in h]
    if missing:
        raise ChakraError("sheets_unavailable", f"missing sheet columns: {', '.join(missing)}")
    return [h.index(_norm(c)) for c in columns]


def _int(v) -> int:
    try:
        return int(float(str(v).strip()))
    except ValueError:
        return 0


def _cell(r: list[str], i: int) -> str:
    return r[i].strip() if i < len(r) else ""


def _order(registry, ids: list[str]) -> list[str]:
    """Parents before children, so relations can be checked against freshly pulled rows."""
    out: list[str] = []

    def visit(cid: str) -> None:
        if cid in out or cid not in ids:
            return
        for _, target in registry.contents[cid].relations:
            visit(target)
        out.append(cid)

    for cid in ids:
        visit(cid)
    return out


def _replace(ctx, sid: str, content) -> int:
    """Read-only contents: the cache is the sheet."""
    rows = ctx.sheets.read(sid, content.tab)
    if not rows:
        raise ChakraError("sheets_unavailable", f"tab '{content.tab}' is empty")
    idx = _index(rows[0], content.columns)
    data, seen = [], set()
    for r in rows[1:]:
        rec = {c: _cell(r, i) for c, i in zip(content.columns, idx)}
        k = dbm.key_of(content, rec)
        if not all(rec[x] for x in content.key) or k in seen:
            continue
        seen.add(k)
        data.append(rec)
    with ctx.db:  # all-or-nothing: a failed pull never leaves a half-replaced table
        ctx.db.execute(f"DELETE FROM c_{content.id}")
        ctx.db.executemany(
            f"INSERT INTO c_{content.id} ({', '.join(content.columns)}) VALUES ({', '.join('?' * len(content.columns))})",
            [[d[c] for c in content.columns] for d in data],
        )
    return len(data)


def _push(ctx, sid: str, content) -> int:
    """Send dirty rows to the sheet; clear a dirty flag only for rows that were actually sent."""
    dirty = ctx.db.execute(f"SELECT * FROM c_{content.id} WHERE is_dirty=1").fetchall()
    if not dirty:
        return 0
    rows = ctx.sheets.read(sid, content.tab)
    if not rows:
        raise ChakraError("sheets_unavailable", f"tab '{content.tab}' is empty")
    header = rows[0]
    cidx = dict(zip([*content.columns, "sync"], _index(header, [*content.columns, "sync"])))
    at = {_cell(r, cidx["id"]): (i, _int(_cell(r, cidx["sync"]))) for i, r in enumerate(rows) if i and _cell(r, cidx["id"])}

    def build(d, base: list[str]) -> list[str]:
        out = (base + [""] * len(header))[: max(len(header), len(base))]
        for c in content.columns:
            out[cidx[c]] = str(d[c] or "")
        out[cidx["sync"]] = str(d["sync"] or "")
        return out

    updates, appends, removes, cleared = {}, [], [], []
    for d in dirty:
        found = at.get(d["id"])
        if d["is_deleted"]:
            if found:
                removes.append(found[0])
            cleared.append(d["id"])
        elif found and d["sync"] and d["sync"] <= found[1]:
            continue  # the sheet row is not older: the pull decides
        elif found:
            updates[found[0]] = build(d, rows[found[0]])
            cleared.append(d["id"])
        else:
            appends.append(build(d, []))
            cleared.append(d["id"])
    ctx.sheets.update_rows(sid, content.tab, updates)
    ctx.sheets.append_rows(sid, content.tab, appends)
    ctx.sheets.delete_rows(sid, content.tab, removes)
    ctx.db.executemany(f"UPDATE c_{content.id} SET is_dirty=0 WHERE id=?", [(i,) for i in cleared])
    ctx.db.commit()
    return len(cleared)


def _merge(ctx, sid: str, content) -> int:
    rows = ctx.sheets.read(sid, content.tab)
    if not rows:
        raise ChakraError("sheets_unavailable", f"tab '{content.tab}' is empty")
    cols = [*content.columns, "sync"]
    idx = _index(rows[0], cols)
    seen_ids: set[str] = set()
    for r in rows[1:]:
        rec = {c: _cell(r, i) for c, i in zip(cols, idx)}
        rid = rec["id"]
        problem = validate.check(ctx.db, ctx.registry, content, rec)
        if rid in seen_ids and not problem:
            continue  # first row with an id wins
        if rid:
            seen_ids.add(rid)
        if problem:
            quarantine.record(ctx, content.id, rid or None, problem[0], problem[1], rec)
            continue
        local = ctx.db.execute(f"SELECT * FROM c_{content.id} WHERE id=?", (rid,)).fetchone()
        sheet_sync = _int(rec["sync"])
        vals = [rec[c] for c in content.columns] + [sheet_sync, 0, 0]
        if not local:
            pass
        elif not (local["is_deleted"] and local["is_dirty"]) and sheet_sync > (local["sync"] or 0):
            if local["is_dirty"] and not local["is_deleted"]:
                quarantine.record(ctx, content.id, rid, "conflict", "both the local row and the sheet changed", rec,
                                  {c: local[c] for c in content.columns} | {"sync": local["sync"]})
        else:
            continue
        ctx.db.execute(f"INSERT OR REPLACE INTO c_{content.id} ({', '.join([*cols, 'is_dirty', 'is_deleted'])}) VALUES ({', '.join('?' * (len(cols) + 2))})", vals)
    for (rid,) in ctx.db.execute(f"SELECT id FROM c_{content.id} WHERE is_deleted=0 AND is_dirty=0").fetchall():
        if rid not in seen_ids:
            ctx.db.execute(f"UPDATE c_{content.id} SET is_deleted=1 WHERE id=?", (rid,))
    ctx.db.commit()
    return ctx.db.execute(f"SELECT COUNT(*) FROM c_{content.id} WHERE is_deleted=0").fetchone()[0]


def run(ctx, req: dict) -> dict:
    sid = ctx.settings.get("spreadsheet_id")
    if not sid:
        raise ChakraError("config_missing", "spreadsheet_id is not set")
    target = req.get("target", "all")
    ids = list(ctx.registry.contents) if target == "all" else [ctx.registry.get(target).id]
    results, total = [], 0
    for cid in _order(ctx.registry, ids):
        c = ctx.registry.contents[cid]
        pushed = 0
        try:
            if c.writable:
                pushed = _push(ctx, sid, c)
                total += pushed
                n = _merge(ctx, sid, c)
            else:
                n = _replace(ctx, sid, c)
            ctx.db.execute("INSERT OR REPLACE INTO sync_meta VALUES (?,?,?,NULL)", (cid, ctx.now(), n))
            results.append({"target": cid, "rows": n, "ok": True, "pushed": pushed})
        except ChakraError as e:
            ctx.db.execute(
                "INSERT INTO sync_meta (content, error) VALUES (?,?) ON CONFLICT(content) DO UPDATE SET error=excluded.error",
                (cid, e.message),
            )
            results.append({"target": cid, "rows": 0, "ok": False, "pushed": pushed, "message": e.message})
        ctx.db.commit()
    return {"results": results, "pushed": total, "pendingLeft": dbm.dirty_count(ctx.db, ctx.registry),
            "quarantined": quarantine.pending_count(ctx.db)}


def status(ctx, req: dict) -> dict:
    meta = {r["content"]: r for r in ctx.db.execute("SELECT * FROM sync_meta")}
    contents = []
    for cid, c in ctx.registry.contents.items():
        m = meta.get(cid)
        ok = bool(m and m["synced_at"] and not m["error"])
        contents.append({"id": cid, "synced": ok, "rowCount": m["row_count"] if m and m["row_count"] is not None else 0,
                         "lastSyncAt": m["synced_at"] if m else None, "error": m["error"] if m else None,
                         "dirty": ctx.db.execute(f"SELECT COUNT(*) FROM c_{c.id} WHERE is_dirty=1").fetchone()[0]})
    times = [c["lastSyncAt"] for c in contents if c["lastSyncAt"]]
    return {"synced": all(c["synced"] for c in contents), "lastSyncAt": max(times) if times else None, "contents": contents,
            "pending": dbm.dirty_count(ctx.db, ctx.registry), "quarantined": quarantine.pending_count(ctx.db)}
