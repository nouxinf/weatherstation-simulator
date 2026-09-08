#!/usr/bin/env python3
"""Regenerate simulator/filesystem.json from simulator/filesystem.

The web simulator can't list directories, so the MicroPython worker loads every
emulated file lazily from this manifest (path -> byte size). Run it whenever
files under simulator/filesystem change:

    python3 filesystem.py

It writes the manifest in the same style it is committed in (2-space indent,
CRLF, UTF-8) so regeneration diffs stay small. Nothing goes to stdout, so an old
`> simulator/filesystem.json` redirect is harmless (the file is written first).
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "simulator" / "filesystem"
OUT = Path(__file__).resolve().parent / "simulator" / "filesystem.json"


def walk_files(root):
    for path in sorted(root.rglob("*")):
        if path.is_file() and not str(path).startswith("."):
            yield path


# Map each path to its byte size. The size lets the worker create lazy files
# without a synchronous HEAD probe per file (see simulator/micropython.worker.js).
files = {
    f"/{p.relative_to(ROOT).as_posix()}": p.stat().st_size for p in walk_files(ROOT)
}

text = json.dumps({"files": files}, indent=2) + "\n"
text = text.replace("\n", "\r\n")  # match the committed line endings
OUT.write_text(text, encoding="utf-8")
print(f"wrote {OUT} ({len(files)} files)", file=sys.stderr)
