#!/usr/bin/env python3
"""
Apply CTR/SEO title rewrites to curriculum-status.json AND post_queue.json.

Input file: _build/title_rewrites.json
  Format: {"<id>": {"ctr_title": "<new>", "seo_title": "<new>"}, ...}
  - seo_title is optional; if omitted, only ctr_title is updated.
  - If existing seo_title == old ctr_title (i.e. they were unified), the new
    ctr_title is also propagated to seo_title to keep them in sync.

Run from selva86.github.io/:
    python _build/apply_title_rewrites.py
"""

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

REPO = Path(__file__).resolve().parent.parent
PATCH = REPO / "_build" / "title_rewrites.json"
CURRICULUM = REPO / "curriculum-status.json"
QUEUE = REPO / "post_queue.json"


def main() -> int:
    if not PATCH.exists():
        print(f"ERROR: patch file not found: {PATCH}")
        return 1

    patch = json.loads(PATCH.read_text(encoding="utf-8"))
    print(f"Patch entries: {len(patch)}")

    cs = json.loads(CURRICULUM.read_text(encoding="utf-8"))
    cs_changes = 0
    seen = set()
    for pk, pv in cs.get("paths", {}).items():
        for sk, sv in pv.get("sub_paths", {}).items():
            for p in sv.get("posts", []):
                pid = p.get("id")
                if pid not in patch:
                    continue
                seen.add(pid)
                rec = patch[pid]
                old_ctr = p.get("ctr_title", "")
                old_seo = p.get("seo_title", "")
                new_ctr = rec.get("ctr_title", old_ctr)
                # If patch supplies seo_title, use it; else if old seo == old ctr (unified),
                # propagate the new ctr to seo to keep them in sync.
                if "seo_title" in rec:
                    new_seo = rec["seo_title"]
                elif old_seo == old_ctr:
                    new_seo = new_ctr
                else:
                    new_seo = old_seo
                if new_ctr != old_ctr or new_seo != old_seo:
                    p["ctr_title"] = new_ctr
                    p["seo_title"] = new_seo
                    cs_changes += 1

    CURRICULUM.write_text(
        json.dumps(cs, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"curriculum-status.json: {cs_changes} entries updated")

    if QUEUE.exists():
        q = json.loads(QUEUE.read_text(encoding="utf-8"))
        q_changes = 0
        for item in q:
            pid = item.get("id")
            if pid not in patch:
                continue
            new_ctr = patch[pid].get("ctr_title", item.get("title", ""))
            if item.get("title") != new_ctr:
                item["title"] = new_ctr
                q_changes += 1
        QUEUE.write_text(
            json.dumps(q, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"post_queue.json: {q_changes} entries updated")
    else:
        print("post_queue.json not found, skipping")

    missed = set(patch.keys()) - seen
    if missed:
        print(f"WARNING: {len(missed)} patch ids not found in curriculum-status:")
        for m in sorted(missed)[:20]:
            print(f"  {m}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
