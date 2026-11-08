import os


def test_status_never_synced(env):
    s = env.call("sync", "status")["data"]
    assert not s["synced"] and all(not c["synced"] for c in s["contents"])


def test_sync_all_fails_partially_and_reports(env):
    env.sheets.tabs.pop("Team")
    out = env.call("sync", "run")["data"]
    by = {r["target"]: r for r in out["results"]}
    assert by["employees"]["ok"] and by["holidays"]["ok"]
    assert not by["teams"]["ok"]  # tab missing in fake
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


def test_load_env_resolves_relative_path(tmp_path, monkeypatch):
    from chakra_backend.settings import load_env
    (tmp_path / ".env").write_text("CHAKRA_SERVICE_ACCOUNT_PATH=config/k.json\nCHAKRA_SPREADSHEET_ID='abc'\nOTHER=1\n")
    for k in ("CHAKRA_SERVICE_ACCOUNT_PATH", "CHAKRA_SPREADSHEET_ID", "OTHER"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.chdir(tmp_path)
    load_env()
    import os
    assert os.environ["CHAKRA_SPREADSHEET_ID"] == "abc" and "OTHER" not in os.environ
    assert os.environ["CHAKRA_SERVICE_ACCOUNT_PATH"].endswith("k.json") and str(tmp_path.resolve()) in os.environ["CHAKRA_SERVICE_ACCOUNT_PATH"]
    monkeypatch.delenv("CHAKRA_SERVICE_ACCOUNT_PATH"); monkeypatch.delenv("CHAKRA_SPREADSHEET_ID")


def test_foreign_os_home_is_ignored(monkeypatch, tmp_path):
    from chakra_backend import settings
    monkeypatch.setenv("CHAKRA_HOME", "E:/Python/Chakra/data/cache")
    monkeypatch.setenv("XDG_DATA_HOME", str(tmp_path))
    if settings.os.name != "nt":
        assert settings.data_dir() == tmp_path / "chakra"
