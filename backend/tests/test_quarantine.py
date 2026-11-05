APP = {"appId": "app1"}


def q(env, cmd, **kw):
    return env.call("quarantine", cmd, {**APP, **kw})


def entries(env, **kw):
    return q(env, "list", **kw)["data"]["entries"]


def bad_dept(env):
    env.sheets.tabs["Department"].append(["d5", "", "active", "100"])
    env.call("sync", "run")
    return entries(env)[0]


def conflict(env):
    env.clock[0] = 50
    env.call("content", "update", {**APP, "content": "departments", "id": "d1", "record": {"name": "Local"}})
    env.sheets.tabs["Department"][1] = ["d1", "Sheet", "active", "300"]
    env.call("sync", "run", {"target": "departments"})
    return entries(env)[0]


def test_list_orders_newest_first_and_count_only_pending(synced):
    synced.sheets.tabs["Department"] += [["d5", "", "active", "100"], ["d6", "", "active", "100"]]
    synced.clock[0] = 1000; synced.call("sync", "run", {"target": "departments"})
    synced.clock[0] = 2000
    synced.sheets.tabs["Holiday"] += [["h5", "", "", "100"]]; synced.call("sync", "run", {"target": "holidays"})
    assert [e["content"] for e in entries(synced)][0] == "holidays"
    q(synced, "reject", id=entries(synced)[0]["id"])
    assert q(synced, "count")["data"]["count"] == 2 and len(entries(synced, status="rejected")) == 1


def test_reject_and_unknown(synced):
    e = bad_dept(synced)
    assert q(synced, "reject", id=e["id"])["ok"] and entries(synced) == []
    assert q(synced, "reject", id="nope")["error"]["code"] == "quarantine_unknown"


def test_accept_sheets_on_conflict_changes_nothing_locally(synced):
    e = conflict(synced)
    assert q(synced, "accept-sheets", id=e["id"])["ok"] and entries(synced) == []
    assert synced._db.execute("SELECT name FROM c_departments WHERE id='d1'").fetchone()[0] == "Sheet"


def test_accept_sheets_forces_a_failed_row_in_clean(synced):
    synced.sheets.tabs["Employee"] += [["e9", "G", "g@x.com", "h", "NOPE", "g1", "active", "100"]]
    synced.call("sync", "run")
    e = entries(synced)[0]
    q(synced, "accept-sheets", id=e["id"])
    r = synced._db.execute("SELECT is_dirty, is_deleted, sync FROM c_employees WHERE id='e9'").fetchone()
    assert tuple(r) == (0, 0, 100) and entries(synced) == []


def test_apply_local_restores_the_local_version_as_a_new_edit(synced):
    e = conflict(synced)
    synced.clock[0] = 400
    assert q(synced, "apply-local", id=e["id"])["ok"]
    r = synced._db.execute("SELECT name, is_dirty, sync FROM c_departments WHERE id='d1'").fetchone()
    assert tuple(r) == ("Local", 1, 400)
    synced.call("sync", "run", {"target": "departments"})
    assert synced.sheets.tabs["Department"][1][1] == "Local"


def test_apply_local_rejected_for_non_conflicts(synced):
    assert q(synced, "apply-local", id=bad_dept(synced)["id"])["error"]["code"] == "invalid_request"


def test_fix_stores_dirty_record_and_resolves(synced):
    e = bad_dept(synced)
    out = q(synced, "fix", id=e["id"], record={"id": "d5", "name": "Fixed", "status": "active"})
    assert out["data"]["row"]["name"] == "Fixed" and entries(synced) == []
    assert synced._db.execute("SELECT is_dirty FROM c_departments WHERE id='d5'").fetchone()[0] == 1


def test_fix_without_id_generates_one_and_invalid_fix_stays_pending(synced):
    synced.sheets.tabs["Department"].append(["", "NoId", "active", "100"])
    synced.call("sync", "run")
    e = entries(synced)[0]
    assert q(synced, "fix", id=e["id"], record={"name": ""})["error"]["code"] == "validation_failed" and len(entries(synced)) == 1
    assert q(synced, "fix", id=e["id"], record={"name": "NoId"})["data"]["row"]["id"] == "DEPT002"


def test_delete_record_closes_the_entry(synced):
    assert q(synced, "delete-record", id=bad_dept(synced)["id"])["ok"] and entries(synced) == []


def test_scan_hides_failing_rows_without_deleting_them_from_the_sheet(synced):
    synced._db.execute("UPDATE c_employees SET department_id='GONE' WHERE id='e1'"); synced._db.commit()
    assert q(synced, "scan")["data"]["newIssues"] == 1
    assert q(synced, "scan")["data"]["newIssues"] == 0
    assert entries(synced)[0]["reason"] == "invalid_relation"
    ids = [r["id"] for r in synced.call("content", "get", {**APP, "content": "employees"})["data"]["rows"]]
    assert "e1" not in ids
    assert synced._db.execute("SELECT is_dirty FROM c_employees WHERE id='e1'").fetchone()[0] == 0  # not queued for sheet deletion


def test_quarantine_needs_an_enabled_app(synced):
    assert synced.call("quarantine", "count", {"appId": "app2"})["error"]["code"] == "app_not_enabled"
