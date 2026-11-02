import json

import bcrypt
import pytest

from chakra_backend import db as dbm
from chakra_backend.cli import Context, run
from chakra_backend.errors import ChakraError
from chakra_backend.registry import load
from chakra_backend.settings import Settings


def hp(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt(4)).decode()


class FakeSheets:
    def __init__(self):
        self.tabs = {
            "Employee": [["ID", "Name", "Email", "Password_Hash", "Department_ID", "Designation_ID", "Status"],
                         ["e1", "Asha", "Asha@x.com", hp("secret"), "d1", "g1", "active"],
                         ["e2", "Old", "old@x.com", hp("pw"), "d1", "g1", "inactive"]],
            "App": [["ID", "Name", "Status"], ["app1", "App One", "active"], ["app2", "App Two", "disabled"]],
            "Holiday": [["ID", "Date", "Holiday_Name"], ["h1", "2026-01-01", "New Year"]],
            "LeaveType": [["ID", "Leave_Type", "Count", "Carry_Forward", "Max_Forward"], ["l1", "casual", "12", "1", "5"]],
        }
        self.fail: set[str] = set()
        self.writes: list = []
        self.offline = False

    def read(self, sid, tab):
        if self.offline or tab in self.fail or tab not in self.tabs:
            raise ChakraError("sheets_unavailable", f"{tab} unreachable")
        return [list(r) for r in self.tabs[tab]]

    def write_cell(self, sid, tab, row, col, value):
        if self.offline:
            raise ChakraError("sheets_unavailable", "offline")
        self.tabs[tab][row][col] = value
        self.writes.append((tab, row, col, value))


class FakeMailer:
    def __init__(self):
        self.sent = []
        self.broken = False

    def send_otp(self, to, otp, minutes):
        if self.broken:
            raise ChakraError("email_unavailable", "down")
        self.sent.append((to, otp))


class Env:
    def __init__(self, tmp_path):
        self.settings = Settings(tmp_path)
        self.settings.set("spreadsheet_id", "sheet")
        self.registry = load()
        self.sheets, self.mailer = FakeSheets(), FakeMailer()
        self.clock = [1000.0]
        self._db = dbm.connect(tmp_path / "c.sqlite", self.registry)

    def ctx(self):
        return Context(self.settings, self.registry, self._db, self.sheets, self.mailer, lambda: self.clock[0])

    def call(self, group, cmd, req=None):
        out, code = run([group, cmd], json.dumps(req) if req is not None else "", self.ctx)
        assert (code == 0) == out["ok"]
        return out


@pytest.fixture
def env(tmp_path):
    return Env(tmp_path)


@pytest.fixture
def synced(env):
    env.call("sync", "run")
    return env
