"""Update functions/_data/mini-courses.json as the lesson factory ships.

    python Scripts/update_mini_registry.py --seq 1 --slug Inference-Mini-1 --status built
    python Scripts/update_mini_registry.py --list          # frontier report

Fills the slug + status for one sequence item (and its mirror row inside the
course parts). The middleware, shelf, catalog, sender, and dashboard all read
this file, so a lesson becomes windowed/sendable the moment this runs and the
site deploys. Status values: planned -> built.
"""
import argparse
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG = os.path.join(ROOT, "functions", "_data", "mini-courses.json")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seq", type=int)
    ap.add_argument("--slug")
    ap.add_argument("--status", default="built", choices=["planned", "built"])
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()

    d = json.load(io.open(REG, encoding="utf-8"))

    if a.list:
        lessons = [it for it in d["sequence"] if it["kind"] == "lesson"]
        built = [it for it in lessons if it.get("slug")]
        print(f"lessons built: {len(built)} / {len(lessons)}")
        frontier = next((it for it in lessons if not it.get("slug")), None)
        if frontier:
            print(f"frontier (next to build): seq {frontier['seq']} - {frontier['subject']}")
        return 0

    if a.seq is None or not a.slug:
        ap.error("--seq and --slug are required (or use --list)")

    it = next((x for x in d["sequence"] if x["seq"] == a.seq), None)
    if not it:
        print(f"ERROR: no sequence item with seq {a.seq}")
        return 1
    if it["kind"] != "lesson":
        print(f"ERROR: seq {a.seq} is kind={it['kind']}, not a lesson")
        return 1
    page = os.path.join(ROOT, a.slug + ".html")
    if a.status == "built" and not os.path.exists(page):
        print(f"ERROR: built page {a.slug}.html does not exist at repo root")
        return 1

    it["slug"] = a.slug
    for c in d["courses"].values():
        for p in c["parts"]:
            if p["seq"] == a.seq:
                p["slug"] = a.slug
                p["status"] = a.status
    io.open(REG, "w", encoding="utf-8", newline="\n").write(json.dumps(d, indent=1))
    print(f"seq {a.seq} -> {a.slug} ({a.status})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
