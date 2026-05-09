#!/usr/bin/env python3
"""
Rebuild post_queue.json from curriculum-status.json.

Mirror semantics: every curriculum entry becomes a queue item.
- done=True for status=='published', False otherwise
- attempts/last_error/quality_passed default to safe values
- rewrite defaults to False (orchestrate.py only flips it when explicitly asked)
- slug: use curriculum's slug if set; otherwise derive from ctr_title

Schema preserved: id, type, title, slug, done, rewrite, attempts, last_error,
quality_passed, seo_notes (10 fields).

Run from selva86.github.io/:
    python _build/regenerate_queue.py
"""

import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass

REPO = Path(__file__).resolve().parent.parent
CURRICULUM = REPO / "curriculum-status.json"
QUEUE = REPO / "post_queue.json"
BACKUP = REPO / "post_queue.json.bak"


def slugify(title: str) -> str:
    if not title:
        return ""
    # r-statistics.co convention: slug = lead phrase before the first colon.
    # ("Bayes' Theorem in R: Why...") -> "Bayes-Theorem-in-R"
    head = title.split(":", 1)[0].strip()
    s = head.replace("&", "and")
    # smart quotes / em-dash sanitization
    s = re.sub(r"[‘’“”]", "", s)
    s = re.sub(r"[–—]", "-", s)
    # strip punctuation we don't want in slugs
    s = re.sub(r"[^A-Za-z0-9\s-]", "", s)
    # collapse whitespace, replace with dashes
    s = re.sub(r"\s+", "-", s.strip())
    # collapse repeated dashes
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def main() -> int:
    cs = json.loads(CURRICULUM.read_text(encoding="utf-8"))

    # First pass: collect every occurrence keyed by id.
    by_id = {}
    skipped_no_id = 0
    for pk, pv in cs.get("paths", {}).items():
        for sk, sv in pv.get("sub_paths", {}).items():
            for p in sv.get("posts", []):
                pid = p.get("id")
                if not pid:
                    skipped_no_id += 1
                    continue
                by_id.setdefault(pid, []).append(p)

    # For duplicate ids, prefer the published occurrence (else first).
    queue = []
    null_slug_derived = 0
    duplicates_resolved = 0
    for pid, occs in by_id.items():
        if len(occs) > 1:
            duplicates_resolved += 1
            chosen = next((o for o in occs if o.get("status") == "published"), occs[0])
        else:
            chosen = occs[0]

        ptype = chosen.get("post_type") or chosen.get("type") or "C"
        title = chosen.get("ctr_title") or chosen.get("title") or ""
        slug = chosen.get("slug")
        if not slug:
            slug = slugify(title)
            null_slug_derived += 1

        published = chosen.get("status") == "published"

        queue.append({
            "id": pid,
            "type": ptype,
            "title": title,
            "slug": slug,
            "done": published,
            "rewrite": False,
            "attempts": 0,
            "last_error": None,
            "quality_passed": True if published else None,
            "seo_notes": chosen.get("seo_notes", ""),
        })

    if QUEUE.exists():
        BACKUP.write_text(QUEUE.read_text(encoding="utf-8"), encoding="utf-8")

    QUEUE.write_text(json.dumps(queue, indent=2, ensure_ascii=False), encoding="utf-8")

    done = sum(1 for x in queue if x["done"])
    pending = len(queue) - done
    by_type = {}
    for x in queue:
        if not x["done"]:
            by_type[x["type"]] = by_type.get(x["type"], 0) + 1

    print(f"Wrote {QUEUE.name}: {len(queue)} items ({done} done, {pending} pending)")
    print(f"  Slugs derived (curriculum had null): {null_slug_derived}")
    print(f"  Duplicate ids resolved (kept published occurrence): {duplicates_resolved}")
    print(f"  Entries skipped (missing id): {skipped_no_id}")
    print(f"  Pending by type: {dict(sorted(by_type.items()))}")
    print(f"  Backup: {BACKUP.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
