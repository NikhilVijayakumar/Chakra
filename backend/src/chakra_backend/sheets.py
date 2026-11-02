"""Google Sheets access behind a tiny interface so tests and other backends can replace it."""
from __future__ import annotations

import json
from typing import Protocol

from .errors import ChakraError


class SheetsClient(Protocol):
    def read(self, spreadsheet_id: str, tab: str) -> list[list[str]]: ...
    def write_cell(self, spreadsheet_id: str, tab: str, row: int, col: int, value: str) -> None: ...


def _a1(col: int) -> str:  # 0-based -> A, B, ... AA
    s = ""
    col += 1
    while col:
        col, r = divmod(col - 1, 26)
        s = chr(65 + r) + s
    return s


class GoogleSheets:
    def __init__(self, service_account_path: str) -> None:
        self._path = service_account_path
        self._svc = None

    def _service(self):
        if self._svc is None:
            try:
                from google.oauth2.service_account import Credentials
                from googleapiclient.discovery import build

                creds = Credentials.from_service_account_file(self._path, scopes=["https://www.googleapis.com/auth/spreadsheets"])
                self._svc = build("sheets", "v4", credentials=creds, cache_discovery=False).spreadsheets()
            except Exception as e:  # missing file, bad key, missing library
                raise ChakraError("sheets_unavailable", f"cannot open Google Sheets: {type(e).__name__}") from e
        return self._svc

    def read(self, spreadsheet_id: str, tab: str) -> list[list[str]]:
        try:
            r = self._service().values().get(spreadsheetId=spreadsheet_id, range=f"{tab}!A:Z").execute()
        except ChakraError:
            raise
        except Exception as e:
            raise ChakraError("sheets_unavailable", f"read '{tab}' failed: {type(e).__name__}") from e
        return r.get("values", [])

    def write_cell(self, spreadsheet_id: str, tab: str, row: int, col: int, value: str) -> None:
        cell = f"{tab}!{_a1(col)}{row + 1}"
        try:
            self._service().values().update(spreadsheetId=spreadsheet_id, range=cell, valueInputOption="USER_ENTERED", body={"values": [[value]]}).execute()
        except ChakraError:
            raise
        except Exception as e:
            raise ChakraError("sheets_unavailable", f"write '{tab}' failed: {type(e).__name__}") from e


def service_account_status(path: str | None) -> tuple[bool, str]:
    if not path:
        return False, "service_account_path is not set"
    try:
        json.loads(open(path, encoding="utf-8").read())["client_email"]
        return True, "service account key found"
    except Exception:
        return False, "service account key is missing or invalid"
