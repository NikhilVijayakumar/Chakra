"""Command table: (group, command) -> handler(ctx, request) -> data."""
from __future__ import annotations

from . import __version__, appfeatures, auth, quarantine, sheets, sync, writes
from .errors import ChakraError
from .settings import KEYS, SECRET_KEYS

API_VERSION = 3


def version(ctx, req):
    return {"version": __version__, "apiVersion": API_VERSION}


def doctor(ctx, req):
    ok_sa, msg_sa = sheets.service_account_status(ctx.settings.get("service_account_path"))
    try:
        ctx.db.execute("SELECT 1")
        sq = (True, "cache database open")
    except Exception:
        sq = (False, "cache database cannot be opened")
    mail = ctx.mailer
    configured = getattr(mail, "configured", lambda: True)()
    sid = bool(ctx.settings.get("spreadsheet_id"))
    checks = [("sqlite", *sq), ("google_credentials", ok_sa, msg_sa),
              ("email", configured, "email provider configured" if configured else "agentmail_api_key / agentmail_inbox_id not set"),
              ("sheet_config", sid, "spreadsheet_id set" if sid else "spreadsheet_id is not set")]
    return {"checks": [{"id": i, "ok": o, "message": m} for i, o, m in checks]}


def config_get(ctx, req):
    key = req.get("key")
    if key not in KEYS:
        raise ChakraError("invalid_request", "unknown config key")
    v = ctx.settings.get(key)
    return {"isSet": v is not None} if key in SECRET_KEYS else {"value": v, "isSet": v is not None}


def config_set(ctx, req):
    key = req.get("key")
    if key not in KEYS or "value" not in req:
        raise ChakraError("invalid_request", "unknown config key or missing value")
    ctx.settings.set(key, req["value"])
    return {"updated": True}


COMMANDS = {
    ("meta", "version"): version, ("meta", "doctor"): doctor,
    ("auth", "login"): auth.login, ("auth", "validate-email"): auth.validate_email,
    ("auth", "otp-send"): auth.otp_send, ("auth", "otp-verify"): auth.otp_verify,
    ("auth", "reset-password"): auth.reset_password,
    ("sync", "run"): sync.run, ("sync", "status"): sync.status,
    ("app", "info"): appfeatures.info, ("app", "can"): appfeatures.can,
    ("content", "get"): appfeatures.content_get,
    ("content", "create"): writes.create, ("content", "update"): writes.update, ("content", "delete"): writes.delete,
    ("quarantine", "list"): quarantine.list_, ("quarantine", "count"): quarantine.count,
    ("quarantine", "reject"): quarantine.reject, ("quarantine", "accept-sheets"): quarantine.accept_sheets,
    ("quarantine", "apply-local"): quarantine.apply_local, ("quarantine", "fix"): quarantine.fix,
    ("quarantine", "delete-record"): quarantine.delete_record, ("quarantine", "scan"): quarantine.scan,
    ("config", "get"): config_get, ("config", "set"): config_set,
}
