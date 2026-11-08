"""Per-app availability and feature-scoped content access, all from synced sheet data."""
from __future__ import annotations

from . import db as dbm
from .errors import ChakraError


def _need(req: dict, *keys: str) -> list[str]:
    vals = [req.get(k) for k in keys]
    if not all(isinstance(v, str) and v for v in vals):
        raise ChakraError("invalid_request", f"required: {', '.join(keys)}")
    return vals


def info(ctx, req: dict) -> dict:
    (app_id,) = _need(req, "appId")
    c = ctx.registry.apps
    active = c["active_value"]
    synced = ctx.db.execute("SELECT COUNT(*) FROM c_" + c["app_content"]).fetchone()[0]
    if not synced:
        raise ChakraError("not_synced", "app data has not been synced")
    app = next((r for r in dbm.effective_rows(ctx.db, ctx.registry.get(c["app_content"]))
                if r[c["app_id"]] == app_id and r[c["app_status"]].lower() == active), None)
    if not app:
        raise ChakraError("app_not_enabled", f"app '{app_id}' is not enabled")
    if "feature_content" in c:
        feats = sorted({r[c["feature_name"]] for r in dbm.effective_rows(ctx.db, ctx.registry.get(c["feature_content"]))
                        if r[c["feature_app_id"]] == app_id and r[c["feature_status"]].lower() == active})
    else:  # ponytail: no per-app feature sheet yet (deferred), so an enabled app gets every feature-tagged content
        feats = sorted({x.feature for x in ctx.registry.contents.values() if x.feature})
    return {"appId": app_id, "enabled": True, "features": feats}


def need_enabled(ctx, req: dict) -> None:
    """Permission is given to the app in the sheet: an enabled app may read and write writable contents."""
    (app_id,) = _need(req, "appId")
    info(ctx, {"appId": app_id})


def can(ctx, req: dict) -> dict:
    app_id, feature = _need(req, "appId", "feature")
    return {"allowed": feature in info(ctx, {"appId": app_id})["features"]}


def content_get(ctx, req: dict) -> dict:
    app_id, content_id = _need(req, "appId", "content")
    content = ctx.registry.get(content_id)
    feats = info(ctx, {"appId": app_id})["features"]
    if not content.feature or content.feature not in feats:
        raise ChakraError("feature_denied", f"app '{app_id}' may not read '{content_id}'")
    where = req.get("where")
    if where is not None and not isinstance(where, dict):
        raise ChakraError("invalid_request", "where must be an object")
    return {"rows": dbm.effective_rows(ctx.db, content, where, hide=True)}


def require_user_access(ctx, req: dict, employee_id: str) -> None:
    """Check sheet-backed direct and team grants after authentication."""
    (app_id,) = _need(req, "appId")
    info(ctx, {"appId": app_id})
    metadata = {r["content"]: r for r in ctx.db.execute("SELECT * FROM sync_meta")}

    def synced(*contents):
        return all(cid in metadata and metadata[cid]["synced_at"] for cid in contents)

    if not synced("apps", "employees"):
        raise ChakraError("not_synced", "app access data has not been synchronized")

    def active(row):
        return str(row.get("status", "")).strip().lower() == "active"

    def rows(content):
        return dbm.effective_rows(ctx.db, ctx.registry.get(content))

    direct_ready = synced("app_employees")
    team_ready = synced("app_teams", "employee_teams", "teams")
    if direct_ready and any(active(r) and r["employee_id"] == employee_id and r["app_id"] == app_id for r in rows("app_employees")):
        return
    if team_ready:
        teams = {r["id"] for r in rows("teams") if active(r)}
        member = {r["team_id"] for r in rows("employee_teams") if active(r) and r["employee_id"] == employee_id}
        granted = {r["team_id"] for r in rows("app_teams") if active(r) and r["app_id"] == app_id}
        if teams & member & granted:
            return
    if not direct_ready or not team_ready:
        raise ChakraError("not_synced", "app access data has not been synchronized")
    raise ChakraError("app_access_denied", "You do not have access to this app. Contact your administrator.")
