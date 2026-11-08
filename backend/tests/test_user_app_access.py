"""User-to-app access using sheet-backed direct and team memberships."""
import pytest


@pytest.fixture
def app_access_env(env):
    env.sheets.tabs["AppEmployee"] = [
        ["employee_id", "app_id", "status", "sync"],
        ["e1", "app1", "active", "100"],
    ]
    env.sheets.tabs["AppTeam"] = [
        ["app_id", "team_id", "status", "sync"],
        ["app1", "t1", "active", "100"],
    ]
    env.sheets.tabs["Team"] = [
        ["id", "name", "status", "sync"],
        ["t1", "Operations", "active", "100"],
    ]
    env.sheets.tabs["EmployeeTeam"] = [
        ["id", "employee_id", "team_id", "status", "sync"],
        ["et1", "e1", "t1", "active", "100"],
    ]
    env.call("sync", "run")
    return env


def login(env):
    return env.call("auth", "login", {"email": "Asha@x.com", "password": "secret", "appId": "app1"})


def test_direct_grant_allows_login(app_access_env):
    app_access_env._db.execute("DELETE FROM c_app_teams")
    assert login(app_access_env)["ok"]


def test_active_team_grant_allows_login(app_access_env):
    app_access_env._db.execute("DELETE FROM c_app_employees")
    assert login(app_access_env)["ok"]


def test_no_grant_denies_login(app_access_env):
    app_access_env._db.execute("DELETE FROM c_app_employees")
    app_access_env._db.execute("DELETE FROM c_app_teams")
    result = login(app_access_env)
    assert not result["ok"] and result["error"]["code"] == "app_access_denied"


def test_failed_sync_uses_last_successful_memberships(app_access_env):
    app_access_env._db.execute("UPDATE sync_meta SET error='unavailable' WHERE content='app_employees'")
    assert login(app_access_env)["ok"]


def test_never_synced_memberships_deny_login(app_access_env):
    app_access_env._db.execute("DELETE FROM sync_meta WHERE content='app_employees'")
    app_access_env._db.execute("DELETE FROM c_app_teams")
    result = login(app_access_env)
    assert not result["ok"] and result["error"]["code"] == "not_synced"

@pytest.mark.parametrize("table, id_field, id_value", [
    ("c_app_employees", "employee_id", "e1"),
    ("c_app_teams", "app_id", "app1"),
    ("c_employee_teams", "employee_id", "e1"),
    ("c_teams", "id", "t1"),
])
def test_inactive_grants_do_not_authorize(app_access_env, table, id_field, id_value):
    if table == "c_app_employees":
        app_access_env._db.execute("DELETE FROM c_app_teams")
    else:
        app_access_env._db.execute("DELETE FROM c_app_employees")
    app_access_env._db.execute(f"UPDATE {table} SET status='inactive' WHERE {id_field}=?", (id_value,))
    result = login(app_access_env)
    assert not result["ok"] and result["error"]["code"] == "app_access_denied"


def test_disabled_app_denies_login(app_access_env):
    app_access_env._db.execute("UPDATE c_apps SET status='inactive' WHERE id='app1'")
    result = login(app_access_env)
    assert not result["ok"] and result["error"]["code"] == "app_not_enabled"

def test_direct_access_does_not_require_team_data(app_access_env):
    app_access_env._db.execute("DELETE FROM sync_meta WHERE content='app_teams'")
    assert login(app_access_env)["ok"]


def test_team_access_does_not_require_direct_grants_data(app_access_env):
    app_access_env._db.execute("DELETE FROM sync_meta WHERE content='app_employees'")
    assert login(app_access_env)["ok"]
