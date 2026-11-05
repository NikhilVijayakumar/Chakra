def test_enabled_app_lists_active_features(synced):
    d = synced.call("app", "info", {"appId": "app1"})["data"]
    assert d["enabled"] and "holidays" in d["features"] and "employees" in d["features"]


def test_unknown_or_disabled_app(synced):
    for a in ("app2", "ghost"):
        assert synced.call("app", "info", {"appId": a})["error"]["code"] == "app_not_enabled"


def test_not_synced(env):
    assert env.call("app", "info", {"appId": "app1"})["error"]["code"] == "not_synced"


def test_content_allowed_and_denied(synced):
    rows = synced.call("content", "get", {"appId": "app1", "content": "holidays"})["data"]["rows"]
    assert rows[0]["holiday_name"] == "New Year"
    for c in ("apps", "app_employees"):  # internal contents have no feature
        assert synced.call("content", "get", {"appId": "app1", "content": c})["error"]["code"] == "feature_denied"
    assert synced.call("content", "get", {"appId": "app1", "content": "zzz"})["error"]["code"] == "unknown_content"


def test_can(synced):
    assert synced.call("app", "can", {"appId": "app1", "feature": "holidays"})["data"]["allowed"]
    assert not synced.call("app", "can", {"appId": "app1", "feature": "payroll"})["data"]["allowed"]
