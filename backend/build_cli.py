"""Build the standalone `chakra` executable for the current OS: python build_cli.py [--onefile]."""
import subprocess
import sys

onefile = "--onefile" in sys.argv
subprocess.run(
    [sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean", "--name", "chakra",
     "--onefile" if onefile else "--onedir",
     "--paths", "src", "--add-data", f"src/chakra_backend/contents.json{';' if sys.platform == 'win32' else ':'}chakra_backend",
     "--hidden-import", "agentmail", "chakra_entry.py"],
    check=True,
)
