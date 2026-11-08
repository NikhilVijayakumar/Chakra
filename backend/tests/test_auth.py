def login(env, email="asha@x.com", pw="secret"):
    return env.call("auth", "login", {"email": email, "password": pw, "appId": "app1"})


def test_login_ok_case_insensitive_email(synced):
    out = login(synced, "ASHA@x.com")
    assert out["ok"] and out["data"]["user"]["name"] == "Asha"


def test_login_failures_share_one_error(synced):
    for email, pw in [("asha@x.com", "bad"), ("nobody@x.com", "x"), ("old@x.com", "pw")]:
        assert login(synced, email, pw)["error"]["code"] == "invalid_credentials"


def test_login_missing_fields(synced):
    assert synced.call("auth", "login", {"email": "a"})["error"]["code"] == "invalid_request"


def reset(env, new="newpass"):
    env.call("auth", "otp-send", {"email": "asha@x.com"})
    otp = env.mailer.sent[-1][1]
    tok = env.call("auth", "otp-verify", {"email": "asha@x.com", "otp": otp})["data"]["resetToken"]
    return env.call("auth", "reset-password", {"email": "asha@x.com", "resetToken": tok, "newPassword": new}), tok


def test_full_reset_then_login_and_push(synced):
    out, tok = reset(synced)
    assert out["data"]["updated"]
    assert login(synced, pw="newpass")["ok"] and not login(synced)["ok"]
    assert synced.call("sync", "status")["data"]["pending"] == 1
    r = synced.call("sync", "run")["data"]
    assert r["pushed"] == 1 and r["pendingLeft"] == 0
    assert synced.sheets.writes and login(synced, pw="newpass")["ok"]
    # token is single use
    again = synced.call("auth", "reset-password", {"email": "asha@x.com", "resetToken": tok, "newPassword": "z"})
    assert again["error"]["code"] == "reset_token_invalid"


def test_push_failure_keeps_pending(synced):
    reset(synced)
    synced.sheets.offline = True
    out = synced.call("sync", "run")["data"]
    assert out["pendingLeft"] == 1 and login(synced, pw="newpass")["ok"]


def test_wrong_and_expired_otp(synced):
    synced.call("auth", "otp-send", {"email": "asha@x.com"})
    assert synced.call("auth", "otp-verify", {"email": "asha@x.com", "otp": "000000"})["error"]["code"] == "otp_invalid"
    otp = synced.mailer.sent[-1][1]
    synced.clock[0] += 301
    assert synced.call("auth", "otp-verify", {"email": "asha@x.com", "otp": otp})["error"]["code"] == "otp_expired"


def test_otp_unknown_or_inactive_email_and_mail_failure(synced):
    assert synced.call("auth", "otp-send", {"email": "old@x.com"})["error"]["code"] == "unknown_email"
    synced.mailer.broken = True
    assert synced.call("auth", "otp-send", {"email": "asha@x.com"})["error"]["code"] == "email_unavailable"
    assert synced._db.execute("SELECT COUNT(*) FROM otp").fetchone()[0] == 0


def test_reset_needs_valid_token(synced):
    r = synced.call("auth", "reset-password", {"email": "asha@x.com", "resetToken": "nope", "newPassword": "x"})
    assert r["error"]["code"] == "reset_token_invalid"


def test_validate_email(synced):
    assert synced.call("auth", "validate-email", {"email": "asha@x.com"})["data"]["exists"]
    assert not synced.call("auth", "validate-email", {"email": "old@x.com"})["data"]["exists"]


def test_accepts_bcryptjs_style_2a_hashes():
    """Existing sheet hashes were made by bcryptjs ($2a$). Known crypt_blowfish vector: password 'U*U'."""
    from chakra_backend.auth import _check
    h = "$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW"
    assert _check("U*U", h) and not _check("U*V", h) and not _check("x", "not-a-hash")
