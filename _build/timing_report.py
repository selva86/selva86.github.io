#!/usr/bin/env python3
"""
Render a per-step timing report for the v4 pipeline.

Reads _build/timing.jsonl (written by timing_log.py) and prints either the
most recent run, a specific run by id, or a summary list of recent runs.

Usage:
    timing_report.py --last
    timing_report.py --run-id <id>
    timing_report.py --list [N]
"""

import argparse
import json
import sys
from collections import OrderedDict, defaultdict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

BUILD_DIR = Path(__file__).resolve().parent
LOG_FILE = BUILD_DIR / "timing.jsonl"
TARGET_SECONDS = 600  # 10 min


def _load_events():
    if not LOG_FILE.exists():
        return []
    events = []
    for line in LOG_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events


def _group_by_run(events):
    groups = OrderedDict()
    for e in events:
        rid = e.get("run_id", "unknown")
        groups.setdefault(rid, []).append(e)
    for rid in groups:
        groups[rid].sort(key=lambda x: x.get("ts_unix", 0))
    return groups


def _fmt_dur(secs):
    if secs is None:
        return "    -  "
    secs = max(0, int(round(secs)))
    return f"{secs // 60:02d}:{secs % 60:02d}"


def _resolve_slug(events):
    for e in events:
        s = e.get("slug")
        if s:
            return s
    return ""


def _started_at(events):
    if not events:
        return ""
    ts = events[0].get("ts", "")
    return ts.replace("T", " ")[:19] if ts else ""


def render_run(events):
    if not events:
        print("No events for this run.")
        return

    rid = events[0].get("run_id", "unknown")
    slug = _resolve_slug(events) or "(slug not set)"
    print(f"Run: {rid}   slug: {slug}   started: {_started_at(events)}")
    print()

    rows = []
    for i, e in enumerate(events):
        if i + 1 < len(events):
            dur = events[i + 1]["ts_unix"] - e["ts_unix"]
        else:
            dur = None
        rows.append((e.get("phase", "?"), e.get("event", "?"), dur))

    total = events[-1]["ts_unix"] - events[0]["ts_unix"] if len(events) > 1 else 0

    print(f"{'Phase':<14}{'Event':<26}{'Duration':>10}{'%':>8}")
    print("-" * 58)
    for phase, event, dur in rows[:-1]:
        pct = (dur / total * 100) if (dur is not None and total > 0) else 0
        print(f"{phase:<14}{event:<26}{_fmt_dur(dur):>10}{pct:>7.1f}%")
    last_phase, last_event, _ = rows[-1]
    print(f"{last_phase:<14}{last_event:<26}{'   (end)':>10}{'':>8}")
    print("-" * 58)
    over = total - TARGET_SECONDS
    if over > 0:
        tail = f"(target <{_fmt_dur(TARGET_SECONDS)}, over by {_fmt_dur(over)})"
    elif total > 0:
        tail = f"(target <{_fmt_dur(TARGET_SECONDS)}, under by {_fmt_dur(-over)})"
    else:
        tail = ""
    print(f"{'Total':<40}{_fmt_dur(total):>10}   {tail}")


def render_list(groups, n):
    if not groups:
        print("No runs recorded.")
        return
    items = list(groups.items())[-n:]
    print(f"{'Run ID':<22}{'Slug':<40}{'Events':>7}{'Total':>9}")
    print("-" * 78)
    for rid, evs in items:
        slug = _resolve_slug(evs) or "(none)"
        if len(evs) > 1:
            total = evs[-1]["ts_unix"] - evs[0]["ts_unix"]
            total_s = _fmt_dur(total)
        else:
            total_s = "  -  "
        print(f"{rid:<22}{slug[:38]:<40}{len(evs):>7}{total_s:>9}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Pipeline timing report")
    g = parser.add_mutually_exclusive_group()
    g.add_argument("--last", action="store_true", help="show most recent run (default)")
    g.add_argument("--run-id", help="show specific run by id")
    g.add_argument("--list", type=int, nargs="?", const=10, metavar="N",
                   help="list recent N runs (default 10)")
    args = parser.parse_args()

    events = _load_events()
    if not events:
        print(f"No timing data in {LOG_FILE}.")
        return 0

    groups = _group_by_run(events)

    if args.list is not None:
        render_list(groups, args.list)
        return 0

    if args.run_id:
        if args.run_id not in groups:
            print(f"Run id not found: {args.run_id}")
            return 1
        render_run(groups[args.run_id])
        return 0

    last_rid = next(reversed(groups))
    render_run(groups[last_rid])
    return 0


if __name__ == "__main__":
    sys.exit(main())
