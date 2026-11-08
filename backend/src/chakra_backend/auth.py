"""Login, OTP and password reset. Hashes are bcrypt ($2a/$2b compatible with the previous app)."""
from __future__ import annotations

import hashlib
import secrets
import time

import bcrypt

from . import appfeatures, db as dbm
from . import writes
from .errors import ChakraError


def _hash(s: str) -> str:
    return bcrypt.hashpw(s.encode(), bcrypt.gensalt(10)).decode()


def _check(s: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(s.encode(), h.encode())
    except ValueError:
        return False


def _need(req: dict, *keys: str) -> list[str]:
    vals = [req.get(k) for k in keys]
    if not all(isinstance(v, str) and v for v in vals):
        raise ChakraError("invalid_request", f"required: {', '.join(keys)}")
    return vals


def _employee(ctx, email: str) -> dict | None:
    a = ctx.registry.auth
    content = ctx.registry.get(a["content"])
    email = email.strip().lower()
    for r in dbm.effective_rows(ctx.db, content):
        if r[a["email"]].strip().lower() == email:
            return r
    return None


def _active(ctx, emp: dict) -> bool:
    a = ctx.registry.auth
    return emp[a["status"]].strip().lower() == a["active_value"]


def login(ctx, req: dict) -> dict:
    email, password, _ = _need(req, "email", "password", "appId")
    emp = _employee(ctx, email)
    a = ctx.registry.auth
    # same error for unknown email, inactive account and bad password
    if not emp or not _active(ctx, emp) or not _check(password, emp[a["password_hash"]]):
        raise ChakraError("invalid_credentials", "invalid email or password")
    appfeatures.require_user_access(ctx, req, emp[a["id"]])
    return {"user": {"id": emp[a["id"]], "email": emp[a["email"]], "name": emp[a["name"]], "role": emp.get(a.get("role", "")) or None}}


def validate_email(ctx, req: dict) -> dict:
    (email,) = _need(req, "email")
    emp = _employee(ctx, email)
    return {"exists": bool(emp and _active(ctx, emp))}


def otp_send(ctx, req: dict) -> dict:
    (email,) = _need(req, "email")
    emp = _employee(ctx, email)
    if not emp or not _active(ctx, emp):
        raise ChakraError("unknown_email", "no active account for this email")
    ttl = int(ctx.settings.get("otp_ttl_seconds", 300))
    otp = f"{secrets.randbelow(900000) + 100000}"
    ctx.mailer.send_otp(email.strip(), otp, ttl // 60)  # send first: no OTP is stored if email fails
    ctx.db.execute("INSERT OR REPLACE INTO otp VALUES (?,?,?,NULL,NULL)", (email.strip().lower(), _hash(otp), ctx.now() + ttl))
    ctx.db.commit()
    return {"sent": True, "expiresInSeconds": ttl}


def otp_verify(ctx, req: dict) -> dict:
    email, otp = _need(req, "email", "otp")
    email = email.strip().lower()
    row = ctx.db.execute("SELECT * FROM otp WHERE email=?", (email,)).fetchone()
    if not row or not row["otp_hash"]:
        raise ChakraError("otp_invalid", "no OTP requested")
    if ctx.now() > row["expires_at"]:
        raise ChakraError("otp_expired", "OTP expired")
    if not _check(otp, row["otp_hash"]):
        raise ChakraError("otp_invalid", "incorrect OTP")
    token = secrets.token_urlsafe(24)
    ctx.db.execute("UPDATE otp SET otp_hash=NULL, reset_hash=?, reset_expires=? WHERE email=?",
                   (hashlib.sha256(token.encode()).hexdigest(), ctx.now() + 600, email))
    ctx.db.commit()
    return {"resetToken": token}


def reset_password(ctx, req: dict) -> dict:
    email, token, new = _need(req, "email", "resetToken", "newPassword")
    email_n = email.strip().lower()
    row = ctx.db.execute("SELECT * FROM otp WHERE email=?", (email_n,)).fetchone()
    ok = row and row["reset_hash"] and ctx.now() <= (row["reset_expires"] or 0) \
        and secrets.compare_digest(row["reset_hash"], hashlib.sha256(token.encode()).hexdigest())
    if not ok:
        raise ChakraError("reset_token_invalid", "reset token invalid or expired")
    emp = _employee(ctx, email_n)
    if not emp or not _active(ctx, emp):
        raise ChakraError("unknown_email", "no active account for this email")
    a = ctx.registry.auth
    content = ctx.registry.get(a["content"])
    writes.store(ctx, content, {c: emp[c] for c in content.columns} | {a["password_hash"]: _hash(new)})  # dirty: pushed at the next sync
    ctx.db.execute("DELETE FROM otp WHERE email=?", (email_n,))  # token is single-use
    ctx.db.commit()
    return {"updated": True}
