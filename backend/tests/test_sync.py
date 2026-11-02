import os


def test_status_never_synced(env):
    s = env.call("sync", "status")["data"]
    assert not s["synced"] and all(not c["synced"] for c in s["contents"])


def test_sync_all_fails_partially_and_reports(env):
    out = env.call("sync", "run")["data"]
    by = {r["target"]: r for r in out["results"]}
    assert by["employees"]["ok"] and by["holidays"]["ok"]
    assert not by["departments"]["ok"]  # tab missing in fake
    assert not env.call("sync", "status")["data"]["synced"]


def test_failed_resync_keeps_previous_rows(synced):
    synced.sheets.fail.add("Holiday")
    r = synced.call("sync", "run", {"target": "holidays"})["data"]["results"][0]
    assert not r["ok"]
    st = {c["id"]: c for c in synced.call("sync", "status")["data"]["contents"]}["holidays"]
    assert not st["synced"] and st["rowCount"] == 1 and st["error"]
    assert synced._db.execute("SELECT COUNT(*) FROM c_holidays").fetchone()[0] == 1


def test_deleted_cache_rebuilds(env, tmp_path):
    env.call("sync", "run")
    env._db.close()
    os.remove(tmp_path / "c.sqlite")
    from chakra_backend import db as dbm
    env._db = dbm.connect(tmp_path / "c.sqlite", env.registry)
    assert not env.call("sync", "status")["data"]["synced"]
    env.call("sync", "run")
    assert env._db.execute("SELECT COUNT(*) FROM c_employees").fetchone()[0] == 2


def test_missing_spreadsheet_id(env):
    env.settings.path.unlink()
    assert env.call("sync", "run")["error"]["code"] == "config_missing"


def test_missing_sheet_column_fails_that_content(env):
    env.sheets.tabs["Holiday"] = [["ID", "Date"], ["h1", "2026"]]
    r = {x["target"]: x for x in env.call("sync", "run")["data"]["results"]}["holidays"]
    assert not r["ok"] and "holiday_name" in r["message"]
