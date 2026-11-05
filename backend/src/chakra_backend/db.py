"""SQLite working copy of the sheets. Rebuildable from Sheets except edits not yet pushed."""
from __future__ import annotations

import sqlite3
from pathlib import Path

from .registry import Registry

SCHEMA_VERSION = 2  # 2: sync/dirty/deleted columns, quarantine; pending_updates removed


def connect(path: Path, registry: Registry) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    if db.execute("PRAGMA user_version").fetchone()[0] < SCHEMA_VERSION:
        # an older cache is rebuilt (edits it held and had not pushed are lost); otp survives
        for (t,) in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('otp')").fetchall():
            db.execute(f"DROP TABLE {t}")
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS sync_meta (content TEXT PRIMARY KEY, synced_at REAL, row_count INTEGER, error TEXT);
        CREATE TABLE IF NOT EXISTS otp (email TEXT PRIMARY KEY, otp_hash TEXT, expires_at REAL, reset_hash TEXT, reset_expires REAL);
        CREATE TABLE IF NOT EXISTS quarantine (id TEXT PRIMARY KEY, content TEXT NOT NULL, record_id TEXT, reason TEXT NOT NULL,
            details TEXT, sheets_data TEXT NOT NULL, local_data TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL);
        """
    )
    for c in registry.contents.values():
        cols = ", ".join(f"{x} TEXT" for x in c.columns)
        db.execute(
            f"CREATE TABLE IF NOT EXISTS c_{c.id} ({cols}, sync INTEGER, is_dirty INTEGER NOT NULL DEFAULT 0, "
            f"is_deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY ({', '.join(c.key)}))"
        )
    db.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
    db.commit()
    return db


def key_of(content, row: dict) -> str:
    return "\x1f".join(str(row[k]) for k in content.key)


def effective_rows(db: sqlite3.Connection, content, where: dict | None = None, *, hide: bool = False) -> list[dict]:
    """Live (not deleted) rows with the content's columns only. `hide` also drops hidden columns."""
    cols = [c for c in content.columns if not (hide and c in content.hidden)]
    rows = [{c: r[c] for c in cols} for r in db.execute(f"SELECT * FROM c_{content.id} WHERE is_deleted=0")]
    if where:
        rows = [r for r in rows if all(str(r.get(k)) == str(v) for k, v in where.items() if k in content.columns)]
    return rows


def dirty_count(db: sqlite3.Connection, registry: Registry) -> int:
    return sum(db.execute(f"SELECT COUNT(*) FROM c_{c.id} WHERE is_dirty=1").fetchone()[0] for c in registry.contents.values())
