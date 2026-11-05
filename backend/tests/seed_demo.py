"""Seed CHAKRA_HOME with a synced cache from the test fakes, for the Electron e2e run: python tests/seed_demo.py <dir>"""
import sys
from pathlib import Path

sys.path[:0] = [str(Path(__file__).parent), str(Path(__file__).parent.parent / "src")]
from conftest import Env  # noqa: E402

e = Env(Path(sys.argv[1]))
e.sheets.tabs["App"].append(["chakra-demo", "Chakra Demo", "active"])
for c in e.registry.contents.values():  # header-only tabs for contents the fake lacks
    e.sheets.tabs.setdefault(c.tab, [list(c.columns)])
e.call("sync", "run")
