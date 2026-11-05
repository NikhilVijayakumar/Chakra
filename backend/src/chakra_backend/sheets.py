"""Google Sheets access behind a tiny interface so tests and other backends can replace it."""
from __future__ import annotations

import json
from typing import Protocol

from .errors import ChakraError


class SheetsClient(Protocol):
    def read(self, spreadsheet_id: str, tab: str) -> list[list[str]]: ...
    def update_rows(self, spreadsheet_id: str, tab: str, rows: dict[int, list[str]]) -> None: ...  # row index (0 = header) -> full row
    def append_rows(self, spreadsheet_id: str, tab: str, rows: list[list[str]]) -> None: ...
    def delete_rows(self, spreadsheet_id: str, tab: str, indexes: list[int]) -> None: ...


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

    def _do(self, tab: str, what: str, fn):
        try:
            return fn(self._service())
        except ChakraError:
            raise
        except Exception as e:
            raise ChakraError("sheets_unavailable", f"{what} '{tab}' failed: {type(e).__name__}") from e

    def update_rows(self, spreadsheet_id: str, tab: str, rows: dict[int, list[str]]) -> None:
        if rows:
            data = [{"range": f"{tab}!A{i + 1}", "values": [v]} for i, v in rows.items()]
            self._do(tab, "write", lambda s: s.values().batchUpdate(spreadsheetId=spreadsheet_id, body={"valueInputOption": "RAW", "data": data}).execute())

    def append_rows(self, spreadsheet_id: str, tab: str, rows: list[list[str]]) -> None:
        if rows:
            self._do(tab, "append to", lambda s: s.values().append(
                spreadsheetId=spreadsheet_id, range=f"{tab}!A:A", valueInputOption="RAW", insertDataOption="INSERT_ROWS", body={"values": rows}).execute())

    def delete_rows(self, spreadsheet_id: str, tab: str, indexes: list[int]) -> None:
        if not indexes:
            return

        def go(s):
            meta = s.get(spreadsheetId=spreadsheet_id, fields="sheets.properties").execute()
            sid = next((x["properties"]["sheetId"] for x in meta.get("sheets", []) if x["properties"]["title"] == tab), None)
            if sid is None:
                raise ChakraError("sheets_unavailable", f"tab '{tab}' not found")
            reqs = [{"deleteDimension": {"range": {"sheetId": sid, "dimension": "ROWS", "startIndex": i, "endIndex": i + 1}}}
                    for i in sorted(indexes, reverse=True)]  # bottom-up keeps the other indexes valid
            s.batchUpdate(spreadsheetId=spreadsheet_id, body={"requests": reqs}).execute()

        self._do(tab, "delete from", go)


def service_account_status(path: str | None) -> tuple[bool, str]:
    if not path:
        return False, "service_account_path is not set"
    try:
        json.loads(open(path, encoding="utf-8").read())["client_email"]
        return True, "service account key found"
    except Exception:
        return False, "service account key is missing or invalid"
