"""SQLite cache. Everything here is rebuildable from Sheets except pending updates."""
from __future__ import annotations

import sqlite3
import time
from pathlib import Path

from .registry import Registry


def connect(path: Path, registry: Registry) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS sync_meta (content TEXT PRIMARY KEY, synced_at REAL, row_count INTEGER, error TEXT);
        CREATE TABLE IF NOT EXISTS pending_updates (content TEXT, key TEXT, column TEXT, value TEXT, created REAL,
            PRIMARY KEY (content, key, column));
        CREATE TABLE IF NOT EXISTS otp (email TEXT PRIMARY KEY, otp_hash TEXT, expires_at REAL, reset_hash TEXT, reset_expires REAL);
        """
    )
    for c in registry.contents.values():
        cols = ", ".join(f"{x} TEXT" for x in c.columns)
        db.execute(f"CREATE TABLE IF NOT EXISTS c_{c.id} ({cols}, PRIMARY KEY ({', '.join(c.key)}))")
    db.commit()
    return db


def key_of(content, row: dict) -> str:
    return "\x1f".join(str(row[k]) for k in content.key)


def effective_rows(db: sqlite3.Connection, content, where: dict | None = None) -> list[dict]:
    """Rows with pending local updates applied on top of the synced rows."""
    rows = [dict(r) for r in db.execute(f"SELECT * FROM c_{content.id}")]
    pend = {(r["key"], r["column"]): r["value"] for r in db.execute("SELECT * FROM pending_updates WHERE content=?", (content.id,))}
    for r in rows:
        for col in content.columns:
            if (key_of(content, r), col) in pend:
                r[col] = pend[(key_of(content, r), col)]
    if where:
        rows = [r for r in rows if all(str(r.get(k)) == str(v) for k, v in where.items() if k in content.columns)]
    return rows


def add_pending(db, content_id: str, key: str, column: str, value: str) -> None:
    db.execute("INSERT OR REPLACE INTO pending_updates VALUES (?,?,?,?,?)", (content_id, key, column, value, time.time()))
    db.commit()
