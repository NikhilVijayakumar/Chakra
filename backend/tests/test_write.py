import bcrypt

APP = {"appId": "app1"}


def w(env, cmd, **kw):
    return env.call("content", cmd, {**APP, **kw})


def test_read_only_content(synced):
    assert w(synced, "create", content="apps", record={"name": "x"})["error"]["code"] == "content_read_only"


def test_generated_id_counts_deleted_rows(synced):
    synced.sheets.tabs["Department"] += [["DEPT007", "A", "active", "100"]]
    synced.call("sync", "run")
    w(synced, "delete", content="departments", id="DEPT007")
    assert w(synced, "create", content="departments", record={"name": "B"})["data"]["row"]["id"] == "DEPT008"


def test_required_relation_duplicate_and_unknown_field(synced):
    assert "name" in w(synced, "create", content="departments", record={"status": "x"})["error"]["message"]
    r = w(synced, "create", content="employees", record={"name": "N", "email": "n@x.com", "department_id": "DEPT999", "password": "p"})
    assert r["error"]["code"] == "validation_failed" and "DEPT999" in r["error"]["message"]
    assert w(synced, "create", content="departments", record={"id": "d1", "name": "dup"})["error"]["code"] == "validation_failed"
    assert w(synced, "create", content="departments", record={"name": "x", "bogus": 1})["error"]["code"] == "validation_failed"
    assert synced._db.execute("SELECT COUNT(*) FROM c_departments").fetchone()[0] == 1  # nothing stored


def test_integer_field(synced):
    r = w(synced, "create", content="leaves", record={"leave_type": "x", "count": "abc"})
    assert r["error"]["code"] == "validation_failed" and "count" in r["error"]["message"]
    assert w(synced, "create", content="leaves", record={"leave_type": "unpaid", "count": "-1"})["ok"]


def test_employee_password_is_hashed_never_returned(synced):
    out = w(synced, "create", content="employees", record={"name": "N", "email": "n@x.com", "password": "pw1"})
    assert out["data"]["row"]["id"] == "EMP003" and "password_hash" not in out["data"]["row"] and "pw1" not in str(out)
    h = synced._db.execute("SELECT password_hash FROM c_employees WHERE id='EMP003'").fetchone()[0]
    assert bcrypt.checkpw(b"pw1", h.encode())
    assert "password_hash" not in w(synced, "update", content="employees", id="EMP003", record={"password": "pw2"})["data"]["row"]
    rows = w(synced, "create", content="departments", record={"name": "q"}) and synced.call("content", "get", {**APP, "content": "employees"})["data"]["rows"]
    assert all("password_hash" not in r for r in rows)


def test_employee_default_password_is_a_setting(synced):
    r = w(synced, "create", content="employees", record={"name": "N", "email": "n@x.com"})
    assert r["error"]["code"] == "validation_failed" and "password" in r["error"]["message"]
    synced.settings.set("default_password", "init-1")
    assert w(synced, "create", content="employees", record={"name": "N", "email": "n@x.com", "status": "active"})["ok"]
    assert synced.call("auth", "login", {"email": "n@x.com", "password": "init-1"})["ok"]


def test_update_delete_and_unknown(synced):
    assert w(synced, "update", content="departments", id="d1", record={"name": "Eng2"})["data"]["row"]["name"] == "Eng2"
    assert synced.call("content", "get", {**APP, "content": "departments"})["data"]["rows"][0]["name"] == "Eng2"
    assert w(synced, "update", content="departments", id="zz", record={"name": "x"})["error"]["code"] == "not_found"
    w(synced, "delete", content="holidays", id="h1")
    assert synced.call("content", "get", {**APP, "content": "holidays"})["data"]["rows"] == []
    assert synced.call("sync", "status")["data"]["pending"] == 2
    assert w(synced, "delete", content="holidays", id="h1")["error"]["code"] == "not_found"


def test_dirty_rows_survive_a_new_connection(synced, tmp_path):
    from chakra_backend import db as dbm
    w(synced, "create", content="departments", record={"name": "Ops"})
    again = dbm.connect(tmp_path / "c.sqlite", synced.registry)
    assert again.execute("SELECT is_dirty FROM c_departments WHERE name='Ops'").fetchone()[0] == 1


def test_app_permission_follows_the_sheet(synced):
    assert w(synced, "create", appId="app2", content="departments", record={"name": "x"})["error"]["code"] == "app_not_enabled"
    assert w(synced, "create", appId="ghost", content="departments", record={"name": "x"})["error"]["code"] == "app_not_enabled"


def test_writes_before_first_sync(env):
    assert w(env, "create", content="departments", record={"name": "x"})["error"]["code"] == "not_synced"


def test_old_cache_is_rebuilt(tmp_path):
    import sqlite3
    from chakra_backend import db as dbm
    from chakra_backend.registry import load
    p = tmp_path / "old.sqlite"
    o = sqlite3.connect(p); o.execute("CREATE TABLE c_departments (id TEXT PRIMARY KEY, name TEXT)"); o.execute("CREATE TABLE pending_updates (a)"); o.commit(); o.close()
    db = dbm.connect(p, load())
    assert "is_dirty" in [r[1] for r in db.execute("PRAGMA table_info(c_departments)")]
    assert not db.execute("SELECT 1 FROM sqlite_master WHERE name='pending_updates'").fetchone()
