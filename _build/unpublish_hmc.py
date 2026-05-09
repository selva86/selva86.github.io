"""One-shot: reset registries to unpublish 5.1.7 Hamiltonian Monte Carlo.

Deletes:
  - posts/Hamiltonian-Monte-Carlo-in-R.md
  - _posts/Hamiltonian-Monte-Carlo-in-R.html
  - Hamiltonian-Monte-Carlo-in-R.html (root)
  - post_plans/Hamiltonian-Monte-Carlo-in-R_plan.md
  - screenshots/Hamiltonian-Monte-Carlo-in-R-*.webp
  - screenshots/og/Hamiltonian-Monte-Carlo-in-R.png

Resets:
  - curriculum-status.json   id=5.1.7 -> not_started
  - www/sidebar.json          remove "Hamiltonian Monte Carlo" entry from Statistics
  - www/links.json            remove auto_links entry pointing to Hamiltonian-Monte-Carlo-in-R.html
  - www/links.json            remove further_reading children pointing at it (if any)
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLUG = "Hamiltonian-Monte-Carlo-in-R"
URL  = f"{SLUG}.html"
CID  = "5.1.7"

def rm(p: Path) -> None:
    if p.exists():
        p.unlink()
        print(f"  rm  {p.relative_to(ROOT)}")

def reset_curriculum() -> None:
    p = ROOT / "curriculum-status.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    n = 0
    for pk in d["paths"]:
        for sk in d["paths"][pk]["sub_paths"]:
            for post in d["paths"][pk]["sub_paths"][sk]["posts"]:
                if post.get("id") == CID:
                    post["status"] = "not_started"
                    post["slug"] = SLUG
                    post["url"] = None
                    post["published_date"] = None
                    post["published_title"] = None
                    post["in_sidebar"] = False
                    post["word_count"] = None
                    post["interactive_blocks"] = None
                    post["modified_date"] = None
                    n += 1
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"curriculum-status.json: reset {n} entry")

def reset_sidebar() -> None:
    p = ROOT / "www" / "sidebar.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    for section in d:
        items = section.get("items", [])
        before = len(items)
        section["items"] = [it for it in items if it.get("href") != URL]
        if len(section["items"]) != before:
            print(f"sidebar.json: removed entry from section '{section.get('title')}'")
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")

def reset_links() -> None:
    p = ROOT / "www" / "links.json"
    d = json.loads(p.read_text(encoding="utf-8"))

    auto = d.get("auto_links", [])
    before = len(auto)
    d["auto_links"] = [e for e in auto if e.get("url") != URL]
    if len(d["auto_links"]) != before:
        print(f"links.json: removed auto_links entry for {URL}")

    fr = d.get("further_reading", {})
    if URL in fr:
        del fr[URL]
        print(f"links.json: removed further_reading parent {URL}")
    for parent, children in list(fr.items()):
        kept = [c for c in children if c.get("url") != URL]
        if len(kept) != len(children):
            fr[parent] = kept
            print(f"links.json: removed FR child {URL} from parent {parent}")

    p.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")

def main() -> int:
    rm(ROOT / "posts" / f"{SLUG}.md")
    rm(ROOT / "_posts" / f"{SLUG}.html")
    rm(ROOT / f"{SLUG}.html")
    rm(ROOT / "post_plans" / f"{SLUG}_plan.md")
    for diag in (ROOT / "screenshots").glob(f"{SLUG}-*.webp"):
        rm(diag)
    rm(ROOT / "screenshots" / "og" / f"{SLUG}.png")

    reset_curriculum()
    reset_sidebar()
    reset_links()
    return 0

if __name__ == "__main__":
    sys.exit(main())
