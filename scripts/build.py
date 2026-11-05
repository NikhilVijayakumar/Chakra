"""Build Chakra for this machine: the UI library (npm tarball) and the CLI (standalone executable).

    python scripts/build.py                 # both, into ./dist
    python scripts/build.py --lib           # library only
    python scripts/build.py --cli --onefile # CLI only, single file
    python scripts/build.py --out /some/dir

Nothing built is committed: dist/, frontend/dist-lib/, backend/dist/ and backend/build/ are gitignored.
Consumer apps install the tarball (`npm i <dist>/nikhilvijayakumar-chakra-ui-*.tgz`) and point the
library's CLI screen at the executable. Runs the same on Windows, Linux and macOS.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIN = sys.platform == "win32"


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
    ap.add_argument("--out", type=Path, default=ROOT / "dist", help="output folder (default: ./dist)")
    a = ap.parse_args()
    both = not (a.lib or a.cli)
    out = a.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    made = {}
    if a.lib or both:
        made["library tarball"] = build_lib(out)
    if a.cli or both:
        made["CLI executable"] = build_cli(out, a.onefile)
    print("\nBuilt:")
    for k, v in made.items():
        print(f"  {k}: {v}")
    if "library tarball" in made:
        print(f"\nInstall in an app:  npm install {made['library tarball']}")
    if "CLI executable" in made:
        print(f"Check the CLI:      {made['CLI executable']} meta version")


if __name__ == "__main__":
    main()
