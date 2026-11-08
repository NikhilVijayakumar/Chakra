"""Build Chakra for this machine: the CLI (with installer) and the UI library (npm tarball), or a dev setup.

    python scripts/build.py                  # release: both, into ./dist
    python scripts/build.py --dev            # dev: CLI folder + library built in place + run-ui launcher
    python scripts/build.py --lib            # library only
    python scripts/build.py --cli --onefile # CLI only, single file
    python scripts/build.py --no-installer   # release without the Windows installer
    python scripts/build.py --out /some/dir

Where outputs go (first match wins): --out, then CHAKRA_BUILD_CLI_DIR / CHAKRA_BUILD_LIB_DIR (each part
separately), then CHAKRA_BUILD_DIR, then ./dist. --dev uses CHAKRA_DEV_DIR first. They can be set in the
repo's .env (see .env.example); a relative value resolves against the .env folder, and a path written for
another OS is ignored.

A release writes, into the output folder:

    Chakra-CLI/                                the CLI (chakra.exe + _internal/)
      chakra.cmd                               launcher; also the path an app saves
      config/.env                              optional CLI settings, created once
      build.json                               version, commit, build time
    Chakra-CLI-Setup-<version>.exe             the Windows installer (per user, no admin)
    nikhilvijayakumar-chakra-ui-<version>.tgz  the npm package

--dev skips the installer and the tarball: it builds the CLI folder and `frontend/dist-lib` in place,
and writes `run-ui.cmd` (or `run-ui.sh`) next to the CLI to start the reference app. Apps point at the
CLI executable from the Chakra settings screen, which verifies it with `meta version` / `meta doctor`.

Nothing built is committed: dist/, frontend/dist-lib/, backend/dist/ and backend/build/ are gitignored.
Runs on Windows, Linux and macOS; the installer is Windows-only.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIN = sys.platform == "win32"
CLI_BUILD = "Chakra-CLI"

LAUNCHER = """@echo off
rem Chakra CLI. Settings and cache live in %APPDATA%\\chakra (CHAKRA_HOME overrides it).
if exist "%~dp0config\\.env" set "CHAKRA_ENV_FILE=%~dp0config\\.env"
"%~dp0chakra.exe" %*
"""

LAUNCHER_SH = """#!/bin/sh
# Chakra CLI. Settings and cache live in $XDG_DATA_HOME/chakra (CHAKRA_HOME overrides it).
here=$(dirname "$0")
if [ -f "$here/config/.env" ]; then export CHAKRA_ENV_FILE="$here/config/.env"; fi
exec "$here/chakra" "$@"
"""

CLI_ENV = """# Chakra CLI settings (loaded at start). Copy the values you need from .env.example.
# CHAKRA_SPREADSHEET_ID=
# CHAKRA_SERVICE_ACCOUNT_PATH=
# CHAKRA_AGENTMAIL_API_KEY=
# CHAKRA_AGENTMAIL_INBOX_ID=
"""

NSIS = """Unicode true
SetCompressor /SOLID lzma
Name "Chakra CLI"
OutFile "@@OUTFILE@@"
InstallDir "$LOCALAPPDATA\\Programs\\Chakra\\Chakra-CLI"
InstallDirRegKey HKCU "Software\\Chakra\\CLI" "InstallDir"
RequestExecutionLevel user

!include "MUI2.nsh"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_TITLE "Chakra CLI is installed"
!define MUI_FINISHPAGE_TEXT "Point the Chakra settings of your app at:$\\r$\\n$INSTDIR\\chakra.exe$\\r$\\n$\\r$\\nSettings and cache stay in %APPDATA%\\chakra."
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

Section "Chakra CLI" SecCli
  SetOutPath "$INSTDIR"
  File "@@SOURCE@@\\chakra.exe"
  File "@@SOURCE@@\\chakra.cmd"
  File "@@SOURCE@@\\build.json"
@@INTERNAL@@
  WriteUninstaller "$INSTDIR\\uninstall.exe"
  WriteRegStr HKCU "Software\\Chakra\\CLI" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "DisplayName" "Chakra CLI"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "DisplayVersion" "@@VERSION@@"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "Publisher" "Chakra"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "UninstallString" '"$INSTDIR\\uninstall.exe"'
  WriteRegDWORD HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "NoModify" 1
  WriteRegDWORD HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\\uninstall.exe"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ChakraCLI"
  DeleteRegKey HKCU "Software\\Chakra\\CLI"
SectionEnd
"""


def load_env() -> None:
    """CHAKRA_* build settings from .env at the repo root, when not already in the environment."""
    f = ROOT / ".env"
    if not f.is_file():
        return
    for line in f.read_text("utf-8-sig").splitlines():
        k, sep, v = line.partition("=")
        k, v = k.strip(), v.strip().strip("\"'")
        if sep and k.startswith(("CHAKRA_BUILD_", "CHAKRA_DEV_")) and v and k not in os.environ:
            os.environ[k] = v


def resolve_dir(value: str | None) -> Path | None:
    """A configured folder, ignoring one written for another OS."""
    if not str(value or "").strip():
        return None
    v = str(value).strip()
    if not WIN and len(v) > 2 and v[0].isalpha() and v[1] == ":" and v[2] in "/\\":
        print(f"ignoring {v!r}: a Windows path on this OS", file=sys.stderr)
        return None
    return (Path(v) if Path(v).is_absolute() else ROOT / v).resolve()


def out_dir(var: str, cli: Path | None) -> Path:
    """--out, else CHAKRA_BUILD_<var>_DIR, else CHAKRA_BUILD_DIR, else ./dist."""
    if cli:
        return cli.resolve()
    return resolve_dir(os.environ.get(f"CHAKRA_BUILD_{var}_DIR") or os.environ.get("CHAKRA_BUILD_DIR")) or ROOT / "dist"


def dev_dir(cli: Path | None) -> Path:
    """--out, else CHAKRA_DEV_DIR, else the release CLI folder, else ./dist."""
    if cli:
        return cli.resolve()
    return resolve_dir(os.environ.get("CHAKRA_DEV_DIR")) or out_dir("CLI", None)


def run(cmd: list[str], cwd: Path) -> None:
    print(f"\n$ {' '.join(cmd)}   (in {cwd.relative_to(ROOT) if cwd != ROOT else '.'})", flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def versions() -> tuple[str, str]:
    """(backend, frontend) versions, the two places a release bumps."""
    meta = (ROOT / "backend" / "src" / "chakra_backend" / "__init__.py").read_text(encoding="utf-8")
    backend = next(line for line in meta.splitlines() if line.startswith("__version__")).partition("=")[2].strip().strip('"')
    frontend = json.loads((ROOT / "frontend" / "package.json").read_text(encoding="utf-8"))["version"]
    return backend, frontend


def build_info(version: str) -> dict:
    try:
        commit = subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:
        commit = None
    return {"version": version, "built_at": datetime.now().isoformat(timespec="seconds"),
            "commit": commit, "python": sys.version.split()[0]}


def npm_install() -> str:
    npm = shutil.which("npm")
    if not npm:
        sys.exit("npm not found: install Node.js 20+ first")
    fe = ROOT / "frontend"
    run([npm, "install", "--no-audit", "--no-fund"], fe)
    return npm


def build_lib(out: Path) -> Path:
    npm = npm_install()
    fe = ROOT / "frontend"
    run([npm, "run", "build:lib"], fe)
    before = set(out.glob("*.tgz"))
    run([npm, "pack", "--pack-destination", str(out)], fe)
    return max(set(out.glob("*.tgz")) - before or out.glob("*.tgz"), key=lambda p: p.stat().st_mtime)


def build_dev_lib() -> Path:
    npm = npm_install()
    fe = ROOT / "frontend"
    run([npm, "run", "build:lib"], fe)
    return fe / "dist-lib"


def build_cli(out: Path, onefile: bool) -> Path:
    """Build the CLI into <out>/Chakra-CLI, with its launcher and optional settings."""
    be = ROOT / "backend"
    venv = be / ".venv"
    py = venv / ("Scripts/python.exe" if WIN else "bin/python")
    if not py.exists():
        run([sys.executable, "-m", "venv", str(venv)], be)
    run([str(py), "-m", "pip", "install", "-q", "-e", ".[dev,email]"], be)
    run([str(py), "build_cli.py", *(["--onefile"] if onefile else [])], be)

    exe = "chakra.exe" if WIN else "chakra"
    built = be / "dist" / (exe if onefile else "chakra")
    dest = out / CLI_BUILD
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    shutil.copytree(built, dest, dirs_exist_ok=True) if built.is_dir() else shutil.copy2(built, dest / exe)

    version, _ = versions()
    (dest / "config").mkdir(exist_ok=True)
    if not (dest / "config" / ".env").exists():
        (dest / "config" / ".env").write_text(CLI_ENV, encoding="utf-8")
    (dest / ("chakra.cmd" if WIN else "chakra.sh")).write_text(LAUNCHER if WIN else LAUNCHER_SH, encoding="utf-8")
    (dest / "build.json").write_text(json.dumps(build_info(version), indent=2), encoding="utf-8")

    # Check the build against a throwaway data folder (never touch %APPDATA%\chakra).
    home = out / ".chakra-check-home"
    shutil.rmtree(home, ignore_errors=True)
    ok = None
    try:
        ok = subprocess.run([str(dest / exe), "meta", "version"], capture_output=True, text=True,
                            env={**os.environ, "CHAKRA_ENV_FILE": str(dest / "config" / ".env"), "CHAKRA_HOME": str(home)})
        print(ok.stdout.strip() or ok.stderr.strip())
    finally:
        shutil.rmtree(home, ignore_errors=True)
    if ok is None or ok.returncode:
        sys.exit(f"the built CLI failed its smoke check: {dest / exe}")
    return dest


def find_makensis() -> Path | None:
    """NSIS makensis: on PATH, installed, or in electron-builder's cache."""
    found = shutil.which("makensis")
    if found:
        return Path(found)
    candidates = [Path(os.environ.get("ProgramFiles", "")) / "NSIS" / "makensis.exe",
                  Path(os.environ.get("ProgramFiles(x86)", "")) / "NSIS" / "makensis.exe"]
    cache = Path(os.environ.get("LOCALAPPDATA", "")) / "electron-builder" / "Cache" / "nsis"
    candidates += sorted(cache.glob("nsis-*/Bin/makensis.exe"), reverse=True)
    return next((p for p in candidates if p.is_file()), None)


def build_installer(out: Path, cli_dir: Path, onefile: bool) -> int | None:
    """Windows-only: package <cli_dir> as a per-user installer next to it."""
    if not WIN:
        return None
    makensis = find_makensis()
    if not makensis:
        print("no NSIS makensis found: install NSIS, or build with --no-installer to get the folder only")
        return 1
    version, _ = versions()
    target = out / f"{CLI_BUILD}-Setup-{version}.exe"
    for old in out.glob(f"{CLI_BUILD}-Setup-*.exe"):
        old.unlink()
    internal = "" if onefile else f'  File /r "{cli_dir / "_internal"}"'
    nsi = out / ".chakra-build" / "chakra.nsi"
    nsi.parent.mkdir(parents=True, exist_ok=True)
    nsi.write_text(NSIS.replace("@@OUTFILE@@", str(target))
                       .replace("@@SOURCE@@", str(cli_dir))
                       .replace("@@INTERNAL@@", internal)
                       .replace("@@VERSION@@", version), encoding="utf-8")
    if subprocess.call([str(makensis), "/V2", str(nsi)]):
        return 1
    print(f"\nbuilt installer {target}")
    return 0


def write_dev_launcher(out: Path) -> Path:
    fe = ROOT / "frontend"
    launcher = out / ("run-ui.cmd" if WIN else "run-ui.sh")
    if WIN:
        launcher.write_text("\n".join(["@echo off", f'cd /d "{fe}"',
                                       f'"{fe / "node_modules" / ".bin" / "electron-vite.cmd"}" dev -- --no-sandbox'])
                            + "\n", encoding="ascii")
    else:
        launcher.write_text("\n".join(["#!/bin/sh", f'cd "{fe}"',
                                       f'exec "{fe / "node_modules" / ".bin" / "electron-vite"}" dev -- --no-sandbox'])
                            + "\n", encoding="utf-8")
        launcher.chmod(0o755)
    return launcher


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lib", action="store_true", help="build only the UI library")
    ap.add_argument("--cli", action="store_true", help="build only the CLI")
    ap.add_argument("--onefile", action="store_true", help="CLI as a single file (slower start) instead of a folder")
    ap.add_argument("--out", type=Path, help="output folder for both parts (overrides the CHAKRA_BUILD_* settings)")
    ap.add_argument("--dev", action="store_true", help="dev build: CLI folder plus the UI library built in place, no installer or tarball")
    ap.add_argument("--no-installer", action="store_true", help="release only: skip the CLI installer")
    a = ap.parse_args()
    load_env()
    both = not (a.lib or a.cli)
    dev = a.dev
    made: dict[str, Path] = {}

    if a.lib or both:
        lib_out = dev_dir(a.out) if dev else out_dir("LIB", a.out)
        lib_out.mkdir(parents=True, exist_ok=True)
        made["dev library" if dev else "library tarball"] = build_dev_lib() if dev else build_lib(lib_out)
        if dev:
            print(f"\ndev library built in {made['dev library']} (no tarball)")

    if a.cli or both:
        cli_out = dev_dir(a.out) if dev else out_dir("CLI", a.out)
        cli_out.mkdir(parents=True, exist_ok=True)
        made["CLI executable"] = build_cli(cli_out, a.onefile) / ("chakra.exe" if WIN else "chakra")
        if dev:
            made["dev launcher"] = write_dev_launcher(cli_out)
        elif not a.no_installer:
            if build_installer(cli_out, made["CLI executable"].parent, a.onefile) not in (0, None):
                return 1

    print("\nBuilt:")
    for k, v in made.items():
        print(f"  {k}: {v}")
    if dev:
        print(f"\nDev run:  {made.get('dev launcher', ROOT / 'frontend')}")
        print(f"Point an app at:  {made['CLI executable']}" if "CLI executable" in made else "")
    else:
        if "library tarball" in made:
            print(f"\nInstall in an app:  npm install {made['library tarball']}")
        if "CLI executable" in made:
            print(f"Check the CLI:      {made['CLI executable']} meta version")
    return 0


if __name__ == "__main__":
    sys.exit(main())
