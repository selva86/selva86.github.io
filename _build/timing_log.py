#!/usr/bin/env python3
"""
Append-only timing log for the v4 write+publish pipeline.

Each call records ONE event (no start/end pairs). Duration of step N is
ts(N+1) - ts(N) in the report. Errors are swallowed so instrumentation
never breaks the pipeline.

Usage:
    timing_log.py mark <event> --phase <write|publish|orchestrator>
                  [--start-run] [--end-run]
    timing_log.py set-slug <slug>
"""

import argparse
import json
import os
import secrets
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

BUILD_DIR = Path(__file__).resolve().parent
LOG_FILE = BUILD_DIR / "timing.jsonl"
SIDECAR = BUILD_DIR / ".timing_current_run"


def _new_run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S") + "_" + secrets.token_hex(2)


def _read_sidecar() -> dict:
    if not SIDECAR.exists():
        return {}
    try:
        return json.loads(SIDECAR.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_sidecar(data: dict) -> None:
    SIDECAR.write_text(json.dumps(data), encoding="utf-8")


def _append_event(record: dict) -> None:
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def cmd_mark(args) -> None:
    sidecar = _read_sidecar()

    if args.start_run or not sidecar:
        run_id = _new_run_id()
        sidecar = {"run_id": run_id, "slug": ""}
        _write_sidecar(sidecar)

    now = time.time()
    record = {
        "run_id": sidecar.get("run_id", _new_run_id()),
        "slug": sidecar.get("slug", ""),
        "phase": args.phase,
        "event": args.event,
        "ts": datetime.fromtimestamp(now, timezone.utc).isoformat(timespec="milliseconds"),
        "ts_unix": round(now, 3),
    }
    _append_event(record)
    print(f"[timing] {args.phase}/{args.event} recorded")

    if args.end_run:
        try:
            SIDECAR.unlink()
        except FileNotFoundError:
            pass


def cmd_set_slug(args) -> None:
    sidecar = _read_sidecar()
    if not sidecar:
        sidecar = {"run_id": _new_run_id(), "slug": ""}
    sidecar["slug"] = args.slug
    _write_sidecar(sidecar)
    print(f"[timing] slug set to {args.slug}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Pipeline timing log")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_mark = sub.add_parser("mark", help="record one event")
    p_mark.add_argument("event", help="event label, e.g. step3_write")
    p_mark.add_argument("--phase", required=True, choices=["write", "publish", "orchestrator"])
    p_mark.add_argument("--start-run", action="store_true", help="generate fresh run_id")
    p_mark.add_argument("--end-run", action="store_true", help="delete sidecar after this event")
    p_mark.set_defaults(func=cmd_mark)

    p_slug = sub.add_parser("set-slug", help="update slug on current sidecar")
    p_slug.add_argument("slug")
    p_slug.set_defaults(func=cmd_set_slug)

    args = parser.parse_args()
    try:
        args.func(args)
    except Exception as e:
        print(f"[timing] WARNING: {e}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
