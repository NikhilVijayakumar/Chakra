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
            "Employee": [["ID", "Name", "Email", "Password_Hash", "Department_ID", "Designation_ID", "Status", "sync"],
                         ["e1", "Asha", "Asha@x.com", hp("secret"), "d1", "g1", "active", "100"],
                         ["e2", "Old", "old@x.com", hp("pw"), "d1", "g1", "inactive", "100"]],
            "Department": [["id", "name", "status", "sync"], ["d1", "Eng", "active", "100"]],
            "AppEmployee": [["employee_id", "app_id", "status", "sync"], ["e1", "app1", "active", "100"]],
            "AppTeam": [["app_id", "team_id", "status", "sync"]],
            "Team": [["id", "name", "status", "sync"]],
            "EmployeeTeam": [["id", "employee_id", "team_id", "status", "sync"]],
            "Designation": [["id", "name", "status", "sync"], ["g1", "Dev", "active", "100"]],
            "App": [["ID", "Name", "Status"], ["app1", "App One", "active"], ["app2", "App Two", "disabled"]],
            "Holiday": [["ID", "Date", "Holiday Name", "sync"], ["h1", "2026-01-01", "New Year", "100"]],
            "LeaveType": [["ID", "Leave Type", "Count", "Carry Forward", "Max Forward", "sync"], ["l1", "casual", "12", "TRUE", "5", "100"]],
        }
        self.fail: set[str] = set()
        self.writes: list = []  # (kind, tab, payload)
        self.offline = False

    def _check(self, tab):
        if self.offline or tab in self.fail or tab not in self.tabs:
            raise ChakraError("sheets_unavailable", f"{tab} unreachable")

    def read(self, sid, tab):
        self._check(tab)
        return [list(r) for r in self.tabs[tab]]

    def update_rows(self, sid, tab, rows):
        self._check(tab)
        for i, r in rows.items():
            self.tabs[tab][i] = list(r)
        self.writes.append(("update", tab, dict(rows)))

    def append_rows(self, sid, tab, rows):
        self._check(tab)
        self.tabs[tab].extend(list(r) for r in rows)
        self.writes.append(("append", tab, list(rows)))

    def delete_rows(self, sid, tab, indexes):
        self._check(tab)
        for i in sorted(indexes, reverse=True):
            del self.tabs[tab][i]
        self.writes.append(("delete", tab, list(indexes)))

    def cell(self, tab, row_id, column):
        h = [x.strip().lower().replace(" ", "_") for x in self.tabs[tab][0]]
        return next(r[h.index(column)] for r in self.tabs[tab][1:] if r[0] == row_id)


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
