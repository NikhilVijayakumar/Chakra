# Google Sheets Setup

All three sheets — **Departments**, **Designations**, and **Employees** — live as separate tabs within a **single spreadsheet**. One spreadsheet ID covers all three.

---

## Spreadsheet structure

| Tab name | Example CSV | Columns |
|----------|-------------|---------|
| `Departments` | `departments.example.csv` | `department_id`, `department_name`, `status` |
| `Designations` | `designations.example.csv` | `designation_id`, `designation_name`, `status` |
| `Employees` | `employees.example.csv` | `employee_id`, `full_name`, `email`, `password_hash`, `role`, `department_id`, `designation_id`, `status` |

Tab names are **case-sensitive**. The app reads each tab by exact name.

---

## How to create the spreadsheet

1. Open Google Sheets and create a new spreadsheet.
2. Rename **Sheet1** to `Departments`. Add two more tabs named `Designations` and `Employees`.
3. Copy each example CSV's header and rows into the matching tab.
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```
5. Set it in `.env`:
   ```
   MAIN_VITE_CHAKRA_GOOGLE_EMPLOYEE_SHEET_ID=<SPREADSHEET_ID>
   ```

---

## Departments tab

| Column | Required | Description |
|--------|----------|-------------|
| `department_id` | Yes | Unique ID — e.g. `DEPT001`. Referenced by employees. |
| `department_name` | Yes | Display name — e.g. `Engineering`. |
| `status` | Yes | `active` or `inactive`. Inactive departments are still stored but informational only. |

---

## Designations tab

| Column | Required | Description |
|--------|----------|-------------|
| `designation_id` | Yes | Unique ID — e.g. `DES004`. Referenced by employees. |
| `designation_name` | Yes | Job title — e.g. `Senior Software Engineer`. |
| `status` | Yes | `active` or `inactive`. |

---

## Employees tab

| Column | Required | Description |
|--------|----------|-------------|
| `employee_id` | Yes | Unique ID — e.g. `EMP001`. |
| `full_name` | Yes | Display name shown after login. |
| `email` | Yes | Login email (case-insensitive, must be unique). |
| `password_hash` | Yes | bcrypt hash. Generate with `npm run hash-password -- <password>`. Never store plain text. |
| `role` | Yes | System access level: `director`, `manager`, or `staff`. |
| `department_id` | Yes | Must match a `department_id` in the Departments tab. |
| `designation_id` | Yes | Must match a `designation_id` in the Designations tab. |
| `status` | Yes | `active` or `inactive`. Only `active` employees can log in. |

### Revoking access

Set `status` to `inactive` in the Employees tab. Takes effect on the next sync (app startup or manual trigger). No app restart needed.

---

## Generating password hashes

```bash
npm run hash-password -- MySecurePassword123
```

Paste the output into the `password_hash` column. Never put plain-text passwords in the sheet.

---

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** of type **Desktop app**.
3. Add redirect URI: `http://localhost:7234/oauth/callback`
4. Enable the **Google Sheets API** for your project.
5. Copy credentials to `.env`:
   ```
   MAIN_VITE_CHAKRA_GOOGLE_CLIENT_ID=<CLIENT_ID>
   MAIN_VITE_CHAKRA_GOOGLE_CLIENT_SECRET=<CLIENT_SECRET>
   ```
6. On first launch the app opens a browser for Google authorisation during the splash sync step. The token is stored in `chakra.sqlite` and refreshed automatically on subsequent starts.
