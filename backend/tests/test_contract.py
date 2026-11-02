import json

from chakra_backend.cli import run


def test_version(env):
    out = env.call("meta", "version")
    assert out["data"]["apiVersion"] == 1 and out["data"]["version"]


def test_malformed_json_is_invalid_request(env):
    out, code = run(["meta", "version"], "{not json", env.ctx)
    assert code == 1 and out["error"]["code"] == "invalid_request"


def test_non_object_and_unknown_command(env):
    assert run(["meta", "version"], "[1]", env.ctx)[0]["error"]["code"] == "invalid_request"
    assert run(["nope", "x"], "", env.ctx)[0]["error"]["code"] == "invalid_request"


def test_internal_error_hides_details(env):
    def boom():
        raise RuntimeError("secret-password-123")
    out, code = run(["meta", "version"], "", boom)
    assert code == 1 and out["error"]["code"] == "internal" and "secret" not in json.dumps(out)


def test_doctor_reports_missing_credentials(env):
    env.mailer.configured = lambda: False
    checks = {c["id"]: c for c in env.call("meta", "doctor")["data"]["checks"]}
    assert checks["sqlite"]["ok"] and checks["sheet_config"]["ok"]
    assert not checks["google_credentials"]["ok"] and not checks["email"]["ok"]


def test_config_secret_never_returned(env):
    env.call("config", "set", {"key": "agentmail_api_key", "value": "KEY123"})
    out = env.call("config", "get", {"key": "agentmail_api_key"})
    assert out["data"] == {"isSet": True} and "KEY123" not in json.dumps(out)
    assert env.call("config", "get", {"key": "nope"})["error"]["code"] == "invalid_request"
