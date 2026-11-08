APP = {"appId": "app1"}


def dep(env, id_="d1"):
    r = env._db.execute("SELECT * FROM c_departments WHERE id=?", (id_,)).fetchone()
    return dict(r) if r else None


def edit(env, **rec):
    return env.call("content", "update", {**APP, "content": "departments", "id": "d1", "record": rec})


def sheet_dep(env):
    return {r[0]: r for r in env.sheets.tabs["Department"][1:]}


def test_new_row_is_appended_with_sync_and_cleared(synced):
    synced.clock[0] = 500
    synced.call("content", "create", {**APP, "content": "departments", "record": {"name": "Ops", "status": "active"}})
    out = synced.call("sync", "run", {"target": "departments"})["data"]
    assert out["pushed"] == 1 and out["pendingLeft"] == 0
    assert sheet_dep(synced)["DEPT002"] == ["DEPT002", "Ops", "active", "500"]
    assert dep(synced, "DEPT002")["is_dirty"] == 0


def test_newer_local_row_overwrites_the_sheet_row(synced):
    synced.clock[0] = 200
    edit(synced, name="Eng2")
    synced.call("sync", "run", {"target": "departments"})
    assert sheet_dep(synced)["d1"] == ["d1", "Eng2", "active", "200"]


def test_older_local_row_is_not_pushed_and_sheet_wins_with_conflict(synced):
    synced.clock[0] = 50
    edit(synced, name="Local")
    synced.sheets.tabs["Department"][1] = ["d1", "Sheet", "active", "300"]
    out = synced.call("sync", "run", {"target": "departments"})["data"]
    assert out["pushed"] == 0 and sheet_dep(synced)["d1"][1] == "Sheet"
    assert dep(synced)["name"] == "Sheet" and dep(synced)["is_dirty"] == 0
    e = synced.call("quarantine", "list", APP)["data"]["entries"][0]
    assert e["reason"] == "conflict" and e["sheetsData"]["name"] == "Sheet" and e["localData"]["name"] == "Local"


def test_sheet_newer_replaces_clean_local_row_without_conflict(synced):
    synced.sheets.tabs["Department"][1] = ["d1", "Sheet", "active", "300"]
    synced.call("sync", "run", {"target": "departments"})
    assert dep(synced)["name"] == "Sheet" and dep(synced)["sync"] == 300
    assert synced.call("quarantine", "count", APP)["data"]["count"] == 0


def test_deleted_row_is_removed_from_the_sheet(synced):
    synced.call("content", "delete", {**APP, "content": "departments", "id": "d1"})
    synced.call("sync", "run", {"target": "departments"})
    assert "d1" not in sheet_dep(synced) and dep(synced)["is_dirty"] == 0 and dep(synced)["is_deleted"] == 1


def test_row_removed_in_sheet_is_soft_deleted_unless_dirty(synced):
    synced.sheets.tabs["Department"].append(["d2", "Two", "active", "100"])
    synced.call("sync", "run", {"target": "departments"})
    synced.call("content", "update", {**APP, "content": "departments", "id": "d2", "record": {"name": "Two!"}})
    del synced.sheets.tabs["Department"][2]   # d2 vanishes from the sheet
    del synced.sheets.tabs["Department"][1]   # and d1
    synced.sheets.tabs["Department"].append(["d9", "Nine", "active", "100"])
    synced.call("sync", "run", {"target": "departments"})
    assert dep(synced, "d1")["is_deleted"] == 1 and dep(synced, "d1")["is_dirty"] == 0
    assert dep(synced, "d2")["is_deleted"] == 0  # dirty: kept, and pushed back as a new row
    assert "d2" in sheet_dep(synced)


def test_failed_push_keeps_the_row_dirty_and_other_contents_sync(synced):
    edit(synced, name="X")
    synced.sheets.fail.add("Department")
    out = synced.call("sync", "run")["data"]
    by = {r["target"]: r for r in out["results"]}
    assert not by["departments"]["ok"] and by["holidays"]["ok"]
    assert dep(synced)["is_dirty"] == 1 and out["pendingLeft"] >= 1


def test_pull_failure_after_push_keeps_previous_rows(synced):
    synced.call("content", "create", {**APP, "content": "holidays", "record": {"date": "2026-02-02", "holiday_name": "X"}})
    real = synced.sheets.read
    calls = []
    def flaky(sid, tab):
        calls.append(tab)
        if tab == "Holiday" and calls.count("Holiday") == 2:
            raise __import__("chakra_backend.errors", fromlist=["ChakraError"]).ChakraError("sheets_unavailable", "boom")
        return real(sid, tab)
    synced.sheets.read = flaky
    r = synced.call("sync", "run", {"target": "holidays"})["data"]["results"][0]
    assert not r["ok"] and r["pushed"] == 1
    assert synced._db.execute("SELECT COUNT(*) FROM c_holidays WHERE is_deleted=0").fetchone()[0] == 2


def test_cache_deleted_loses_only_unpushed_edits(synced, tmp_path):
    from chakra_backend import db as dbm
    edit(synced, name="Lost")
    synced._db.close()
    (tmp_path / "c.sqlite").unlink()
    synced._db = dbm.connect(tmp_path / "c.sqlite", synced.registry)
    synced.call("sync", "run")
    assert dep(synced)["name"] == "Eng" and dep(synced)["is_dirty"] == 0


def test_pull_validation_reasons(synced):
    t = synced.sheets.tabs
    t["Department"] += [["d5", "", "active", "100"], ["", "NoId", "active", "100"]]
    t["Employee"] += [["e9", "Ghost", "g@x.com", "h", "NOPE", "g1", "active", "100"]]
    t["LeaveType"] += [["l9", "bad", "abc", "FALSE", "0", "100"]]
    synced.call("sync", "run")
    got = {(e["content"], e["reason"]) for e in synced.call("quarantine", "list", APP)["data"]["entries"]}
    assert got == {("departments", "missing_required"), ("departments", "missing_id"), ("employees", "invalid_relation"), ("leaves", "type_mismatch")}
    assert dep(synced, "d5") is None
    assert synced._db.execute("SELECT COUNT(*) FROM c_employees WHERE id='e9'").fetchone()[0] == 0


def test_repeated_problem_updates_one_entry(synced):
    synced.sheets.tabs["Department"].append(["d5", "", "active", "100"])
    synced.call("sync", "run"); synced.call("sync", "run")
    assert synced.call("quarantine", "count", APP)["data"]["count"] == 1


def test_missing_sync_column_fails_that_content(synced):
    synced.sheets.tabs["Department"] = [["id", "name", "status"], ["d1", "x", "active"]]
    r = synced.call("sync", "run", {"target": "departments"})["data"]["results"][0]
    assert not r["ok"] and "sync" in r["message"]


def test_relations_are_checked_against_freshly_pulled_parents(env):
    env.sheets.tabs["Department"].append(["d2", "New", "active", "100"])
    env.sheets.tabs["Employee"].append(["e3", "Z", "z@x.com", "h", "d2", "g1", "active", "100"])
    env.call("sync", "run")  # first sync ever: employees reference a department pulled in the same run
    assert env._db.execute("SELECT COUNT(*) FROM c_employees WHERE id='e3'").fetchone()[0] == 1
