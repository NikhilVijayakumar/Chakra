"""Pull Sheets into the cache; push pending local updates first."""
from __future__ import annotations

import time

from . import db as dbm
from .errors import ChakraError


def _norm(h: str) -> str:
    return h.strip().lower().replace("_", "").replace(" ", "")


def _index(header: list[str], columns: list[str]) -> list[int]:
    h = [_norm(x) for x in header]
    missing = [c for c in columns if _norm(c) not in h]
    if missing:
        raise ChakraError("sheets_unavailable", f"missing sheet columns: {', '.join(missing)}")
    return [h.index(_norm(c)) for c in columns]


def _push(ctx, spreadsheet_id: str) -> int:
    """Push pending updates; keep any that fail. Returns pushed count."""
    pushed = 0
    for p in list(ctx.db.execute("SELECT * FROM pending_updates")):
        content = ctx.registry.contents.get(p["content"])
        if not content:
            continue
        try:
            rows = ctx.sheets.read(spreadsheet_id, content.tab)
            header = rows[0]
            kidx = _index(header, content.key)
            cidx = _index(header, [p["column"]])[0]
            want = p["key"].split("\x1f")
            for i, r in enumerate(rows[1:], start=1):
                if [(r[k] if k < len(r) else "") .strip() for k in kidx] == want:
                    ctx.sheets.write_cell(spreadsheet_id, content.tab, i, cidx, p["value"])
                    ctx.db.execute("DELETE FROM pending_updates WHERE content=? AND key=? AND column=?", (p["content"], p["key"], p["column"]))
                    ctx.db.commit()
                    pushed += 1
                    break
        except ChakraError:
            continue  # stays pending
    return pushed


def _pull(ctx, spreadsheet_id: str, content) -> int:
    rows = ctx.sheets.read(spreadsheet_id, content.tab)
    if not rows:
        raise ChakraError("sheets_unavailable", f"tab '{content.tab}' is empty")
    idx = _index(rows[0], content.columns)
    data, seen = [], set()
    for r in rows[1:]:
        rec = {c: (r[i].strip() if i < len(r) else "") for c, i in zip(content.columns, idx)}
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


def run(ctx, req: dict) -> dict:
    sid = ctx.settings.get("spreadsheet_id")
    if not sid:
        raise ChakraError("config_missing", "spreadsheet_id is not set")
    target = req.get("target", "all")
    ids = list(ctx.registry.contents) if target == "all" else [ctx.registry.get(target).id]
    pushed = _push(ctx, sid)
    results = []
    for cid in ids:
        c = ctx.registry.contents[cid]
        try:
            n = _pull(ctx, sid, c)
            ctx.db.execute("INSERT OR REPLACE INTO sync_meta VALUES (?,?,?,NULL)", (cid, time.time(), n))
            results.append({"target": cid, "rows": n, "ok": True})
        except ChakraError as e:
            ctx.db.execute(
                "INSERT INTO sync_meta (content, error) VALUES (?,?) ON CONFLICT(content) DO UPDATE SET error=excluded.error",
                (cid, e.message),
            )
            results.append({"target": cid, "rows": 0, "ok": False, "message": e.message})
        ctx.db.commit()
    left = ctx.db.execute("SELECT COUNT(*) FROM pending_updates").fetchone()[0]
    return {"results": results, "pushed": pushed, "pendingLeft": left}


def status(ctx, req: dict) -> dict:
    meta = {r["content"]: r for r in ctx.db.execute("SELECT * FROM sync_meta")}
    contents = []
    for cid in ctx.registry.contents:
        m = meta.get(cid)
        ok = bool(m and m["synced_at"] and not m["error"])
        contents.append({"id": cid, "synced": ok, "rowCount": m["row_count"] if m and m["row_count"] is not None else 0,
                         "lastSyncAt": m["synced_at"] if m else None, "error": m["error"] if m else None})
    times = [c["lastSyncAt"] for c in contents if c["lastSyncAt"]]
    return {"synced": all(c["synced"] for c in contents), "lastSyncAt": max(times) if times else None,
            "contents": contents, "pending": ctx.db.execute("SELECT COUNT(*) FROM pending_updates").fetchone()[0]}
