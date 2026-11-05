"""Build Chakra for this machine: the UI library (npm tarball) and the CLI (standalone executable).

    python scripts/build.py                 # both, into ./dist
    python scripts/build.py --lib           # library only
    python scripts/build.py --cli --onefile # CLI only, single file
    python scripts/build.py --out /some/dir

Where outputs go (first match wins): --out, then CHAKRA_BUILD_CLI_DIR / CHAKRA_BUILD_LIB_DIR (each part
separately), then CHAKRA_BUILD_DIR, then ./dist. They can be set in the repo's .env (see .env.example);
a relative value resolves against the .env folder, and a path written for another OS is ignored.

Nothing built is committed: dist/, frontend/dist-lib/, backend/dist/ and backend/build/ are gitignored.
Consumer apps install the tarball (`npm i <dist>/nikhilvijayakumar-chakra-ui-*.tgz`) and point the
library's CLI screen at the executable. Runs the same on Windows, Linux and macOS.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIN = sys.platform == "win32"


def load_env() -> None:
    """Read CHAKRA_* from the repo .env (real environment variables win)."""
    f = ROOT / ".env"
    if not f.is_file():
        return
    for line in f.read_text("utf-8-sig").splitlines():
        k, sep, v = line.partition("=")
        k, v = k.strip(), v.strip().strip("\"'")
        if sep and k.startswith("CHAKRA_BUILD_") and v and k not in os.environ:
            os.environ[k] = v


def out_dir(var: str, cli: Path | None) -> Path:
    """--out, else CHAKRA_BUILD_<var>_DIR, else CHAKRA_BUILD_DIR, else ./dist."""
    if cli:
        return cli.resolve()
    v = os.environ.get(f"CHAKRA_BUILD_{var}_DIR") or os.environ.get("CHAKRA_BUILD_DIR")
    if not v:
        return ROOT / "dist"
    if not WIN and len(v) > 2 and v[0].isalpha() and v[1] == ":" and v[2] in "/\\":
        print(f"ignoring {v!r}: a Windows path on this OS", file=sys.stderr)
        return ROOT / "dist"
    return (Path(v) if Path(v).is_absolute() else ROOT / v).resolve()


def run(cmd: list[str], cwd: Path) -> None:
    print(f"\n$ {' '.join(cmd)}   (in {cwd.relative_to(ROOT) if cwd != ROOT else '.'})", flush=True)
    subprocess.run(cmd, cwd=cwd, check=True)


def build_lib(out: Path) -> Path:
    npm = shutil.which("npm")
    if not npm:
        sys.exit("npm not found: install Node.js 20+ first")
    fe = ROOT / "frontend"
    run([npm, "install", "--no-audit", "--no-fund"], fe)
    run([npm, "run", "build:lib"], fe)
    before = set(out.glob("*.tgz"))
    run([npm, "pack", "--pack-destination", str(out)], fe)
    return max(set(out.glob("*.tgz")) - before or out.glob("*.tgz"), key=lambda p: p.stat().st_mtime)


def build_cli(out: Path, onefile: bool) -> Path:
    be = ROOT / "backend"
    venv = be / ".venv"
    py = venv / ("Scripts/python.exe" if WIN else "bin/python")
    if not py.exists():
        run([sys.executable, "-m", "venv", str(venv)], be)
    run([str(py), "-m", "pip", "install", "-q", "-e", ".[dev,email]"], be)
    run([str(py), "build_cli.py", *(["--onefile"] if onefile else [])], be)
    exe = "chakra.exe" if WIN else "chakra"
    built = be / "dist" / (exe if onefile else "chakra")  # one-file: dist/chakra[.exe]; one-folder: dist/chakra/
    dest = out / ("chakra-cli" if not onefile else exe)
    if dest.is_dir():
        shutil.rmtree(dest)
    elif dest.exists():
        dest.unlink()
    shutil.copytree(built, dest) if built.is_dir() else shutil.copy2(built, dest)
    return dest / exe if dest.is_dir() else dest


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lib", action="store_true", help="build only the UI library")
    ap.add_argument("--cli", action="store_true", help="build only the CLI")
    ap.add_argument("--onefile", action="store_true", help="CLI as a single file (slower start) instead of a folder")
    ap.add_argument("--out", type=Path, help="output folder for both parts (overrides the CHAKRA_BUILD_* settings)")
    a = ap.parse_args()
    load_env()
    both = not (a.lib or a.cli)
    made = {}
    if a.lib or both:
        lib_out = out_dir("LIB", a.out)
        lib_out.mkdir(parents=True, exist_ok=True)
        made["library tarball"] = build_lib(lib_out)
    if a.cli or both:
        cli_out = out_dir("CLI", a.out)
        cli_out.mkdir(parents=True, exist_ok=True)
        made["CLI executable"] = build_cli(cli_out, a.onefile)
    print("\nBuilt:")
    for k, v in made.items():
        print(f"  {k}: {v}")
    if "library tarball" in made:
        print(f"\nInstall in an app:  npm install {made['library tarball']}")
    if "CLI executable" in made:
        print(f"Check the CLI:      {made['CLI executable']} meta version")


if __name__ == "__main__":
    main()
