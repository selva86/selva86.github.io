"""Shared utilities: logging, atomic writes, URL canonicalization, cache connection."""
from __future__ import annotations

import json
import os
import re
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from . import config


def log(msg: str, log_path: Path | None = None) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{stamp}] {msg}"
    print(line, flush=True)
    if log_path is not None:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a", encoding="utf-8") as fh:
            fh.write(line + "\n")


def atomic_write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(
        prefix=path.name + ".", suffix=".tmp", dir=str(path.parent)
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, sort_keys=True)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def canonicalize_url(url: str) -> str:
    """Normalize a URL: force https, lowercase host, strip query/fragment, collapse trailing slash.

    http:// is normalized to https:// since GSC reports both schemes for the same
    resource (the site 301s http → https) and splitting them fragments attribution.
    """
    if not url:
        return url
    parts = urlsplit(url.strip())
    lower_scheme = parts.scheme.lower()
    scheme = "https" if lower_scheme in ("http", "https") else lower_scheme
    host = parts.netloc.lower()
    path = parts.path or ""
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return urlunsplit((scheme, host, path, "", ""))


def connect_to_cache(path: Path | None = None) -> sqlite3.Connection:
    """Open the SQLite cache and register a Python REGEXP function (fix #11)."""
    db_path = path or config.CACHE_DB
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(db_path))
    con.create_function(
        "regexp",
        2,
        lambda pattern, value: bool(re.search(pattern, value)) if value else False,
    )
    con.execute("PRAGMA journal_mode=WAL")
    return con


V1_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS gsc_data (
  date TEXT NOT NULL,
  query TEXT NOT NULL DEFAULT '',
  page TEXT NOT NULL,
  country TEXT NOT NULL,
  device TEXT NOT NULL,
  clicks INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  ctr REAL NOT NULL,
  position REAL NOT NULL,
  PRIMARY KEY (date, query, page, country, device)
);
CREATE INDEX IF NOT EXISTS idx_query ON gsc_data(query);
CREATE INDEX IF NOT EXISTS idx_page  ON gsc_data(page);
CREATE INDEX IF NOT EXISTS idx_date  ON gsc_data(date);

CREATE TABLE IF NOT EXISTS pull_log (
  date TEXT PRIMARY KEY,
  pulled_at TEXT NOT NULL,
  rows INTEGER NOT NULL,
  status TEXT NOT NULL,
  error TEXT
);
"""


def migrate_schema(con: sqlite3.Connection) -> int:
    """Idempotent schema migrator. Returns the current schema version after run."""
    con.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at TEXT)"
    )
    row = con.execute("SELECT MAX(version) FROM schema_version").fetchone()
    current = row[0] or 0

    if current < 1:
        existing = con.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='gsc_data'"
        ).fetchone()
        if existing:
            try:
                con.execute(
                    "UPDATE gsc_data SET query = '' WHERE query IS NULL"
                )
            except sqlite3.OperationalError:
                pass
        con.executescript(V1_SCHEMA_SQL)
        con.execute(
            "INSERT INTO schema_version(version, applied_at) VALUES (1, ?)",
            (datetime.now(timezone.utc).isoformat(),),
        )
        current = 1
    con.commit()
    return current


def acquire_lock(lock_path: Path) -> None:
    """Simple PID-based lock. Raises SystemExit if another process holds it."""
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    if lock_path.exists():
        try:
            other = lock_path.read_text().strip()
        except Exception:
            other = "<unreadable>"
        print(f"Lock held by pid {other} at {lock_path}", file=sys.stderr)
        raise SystemExit(2)
    lock_path.write_text(str(os.getpid()))


def release_lock(lock_path: Path) -> None:
    try:
        if lock_path.exists():
            lock_path.unlink()
    except Exception:
        pass
