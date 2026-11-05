"""Create, update and delete: change the cache, mark rows dirty; the next sync pushes them."""
from __future__ import annotations

import re

import bcrypt

from . import appfeatures, validate
from .errors import ChakraError


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt(10)).decode()


def next_id(db, content) -> str:
    """Prefix plus (highest trailing number + 1), zero padded to 3. Deleted rows still count."""
    nums = [int(m.group(1)) for (i,) in db.execute(f"SELECT id FROM c_{content.id}") if (m := re.search(r"(\d+)$", i or ""))]
    return f"{content.id_prefix}{max(nums, default=0) + 1:03d}"


def _writable(ctx, req: dict):
    appfeatures.need_enabled(ctx, req)
    content = ctx.registry.get(req.get("content") if isinstance(req.get("content"), str) else "")
    if not content.writable:
        raise ChakraError("content_read_only", f"'{content.id}' cannot be changed")
    return content


def _record(req: dict) -> dict:
    rec = req.get("record")
    if not isinstance(rec, dict):
        raise ChakraError("invalid_request", "record must be an object")
    return rec


def _clean(ctx, content, rec: dict) -> dict:
    """Allowed columns only; a plain password becomes the stored hash. Controlled fields are ignored."""
    allowed = set(content.columns)
    pw_col = ctx.registry.auth.get("password_hash") if ctx.registry.auth.get("content") == content.id else None
    out = {}
    for k, v in rec.items():
        if k == "password" and pw_col:
            if not isinstance(v, str) or not v:
                raise ChakraError("validation_failed", "password must be a non-empty string")
            out[pw_col] = hash_password(v)
        elif k in allowed and k != pw_col:
            out[k] = "" if v is None else str(v)
        elif k not in ("sync", "is_dirty", "is_deleted"):
            raise ChakraError("validation_failed", f"unknown field '{k}'")
    return out


def store(ctx, content, rec: dict) -> None:
    """Insert or replace one row as a dirty edit."""
    cols = [*content.columns, "sync", "is_dirty", "is_deleted"]
    vals = [rec.get(c, "") for c in content.columns] + [int(ctx.now()), 1, 0]
    ctx.db.execute(f"INSERT OR REPLACE INTO c_{content.id} ({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})", vals)
    ctx.db.commit()


def _public(content, rec: dict) -> dict:
    return {c: rec.get(c, "") for c in content.columns if c not in content.hidden}


def _fail(content, rec, db, registry):
    bad = validate.check(db, registry, content, rec)
    if bad:
        raise ChakraError("validation_failed", bad[1])


def create(ctx, req: dict) -> dict:
    content = _writable(ctx, req)
    rec = _clean(ctx, content, _record(req))
    pw_col = ctx.registry.auth.get("password_hash") if ctx.registry.auth.get("content") == content.id else None
    if pw_col and not rec.get(pw_col):
        default = ctx.settings.get("default_password")
        if not default:
            raise ChakraError("validation_failed", "password is required (no default_password is configured)")
        rec[pw_col] = hash_password(default)
    if not rec.get("id", "").strip():
        rec["id"] = next_id(ctx.db, content)
    row = ctx.db.execute(f"SELECT is_deleted FROM c_{content.id} WHERE id=?", (rec["id"],)).fetchone()
    if row and not row[0]:
        raise ChakraError("validation_failed", f"id '{rec['id']}' already exists")
    _fail(content, rec, ctx.db, ctx.registry)
    store(ctx, content, rec)
    return {"row": _public(content, rec)}


def update(ctx, req: dict) -> dict:
    content = _writable(ctx, req)
    rid = req.get("id")
    cur = ctx.db.execute(f"SELECT * FROM c_{content.id} WHERE id=? AND is_deleted=0", (rid,)).fetchone() if isinstance(rid, str) else None
    if not cur:
        raise ChakraError("not_found", f"no '{content.id}' row with that id")
    patch = _clean(ctx, content, _record(req))
    patch.pop("id", None)
    rec = {c: cur[c] for c in content.columns} | patch
    _fail(content, rec, ctx.db, ctx.registry)
    store(ctx, content, rec)
    return {"row": _public(content, rec)}


def delete(ctx, req: dict) -> dict:
    content = _writable(ctx, req)
    rid = req.get("id")
    cur = ctx.db.execute(f"SELECT 1 FROM c_{content.id} WHERE id=? AND is_deleted=0", (rid,)).fetchone() if isinstance(rid, str) else None
    if not cur:
        raise ChakraError("not_found", f"no '{content.id}' row with that id")
    ctx.db.execute(f"UPDATE c_{content.id} SET is_deleted=1, is_dirty=1, sync=? WHERE id=?", (int(ctx.now()), rid))
    ctx.db.commit()
    return {"deleted": True}
