#!/usr/bin/env python3
"""Regenerate simulator/filesystem.json from simulator/filesystem.

The web simulator can't list directories, so the MicroPython worker loads every
emulated file lazily from this manifest (path -> byte size). Run it whenever
files under simulator/filesystem change:

    python3 filesystem.py

The recorded size must never be SMALLER than the bytes actually served, or the
worker's lazy loader truncates files and they fail to parse. Text files differ
between checkouts though: git stores them as LF, Windows checkouts (autocrlf)
get them as CRLF, Linux/Pages serve them as LF. To keep one manifest valid on
every platform we always record the CRLF-representative size for text (the
largest any checkout can have -- exact on Windows, a harmless over-estimate on
LF systems since reads just stop at EOF) and the exact size for binary files.
The result is identical no matter which OS regenerates it.

Nothing goes to stdout, so an old `> simulator/filesystem.json` redirect is
harmless (the file is written first).
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


def manifest_size(data):
    # binary files (NUL bytes) are never line-ending converted, so their bytes
    # are the same on every checkout
    if b"\x00" in data:
        return len(data)
    # text: CRLF representation is LF bytes plus one \r per line ending
    lf = data.replace(b"\r\n", b"\n")
    return len(lf) + lf.count(b"\n")


# Map each path to its byte size. The size lets the worker create lazy files
# without a synchronous HEAD probe per file (see simulator/micropython.worker.js).
files = {
    f"/{p.relative_to(ROOT).as_posix()}": manifest_size(p.read_bytes())
    for p in walk_files(ROOT)
}

# written as LF (newline="\n" stops Windows translating \n to \r\n) so the
# committed file doesn't flip line endings depending on who regenerated it
text = json.dumps({"files": files}, indent=2) + "\n"
OUT.write_text(text, encoding="utf-8", newline="\n")
print(f"wrote {OUT} ({len(files)} files)", file=sys.stderr)
