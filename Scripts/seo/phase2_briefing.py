"""Generate Phase 2 per-page briefings for the 4 pages identified as distinct
new title/meta rewrite targets after the Phase 1 backlog review."""
from __future__ import annotations

from Scripts.seo import config
from Scripts.seo.common import connect_to_cache
from Scripts.seo.phase1_briefing import render

PAGES = [
    "https://r-statistics.co/Association-Mining-With-R.html",
    "https://r-statistics.co/Information-Value-With-R.html",
    "https://r-statistics.co/Statistical-Tests-in-R.html",
    "https://r-statistics.co/Top50-Ggplot2-Visualizations-MasterList-R-Code.html",
]


def main() -> int:
    con = connect_to_cache()
    out_dir = config.REPORTS_DIR / "2026-04-14" / "phase2"
    out_dir.mkdir(parents=True, exist_ok=True)
    for page in PAGES:
        slug = page.rsplit("/", 1)[-1].replace(".html", "")
        md = render(page, con)
        (out_dir / f"{slug}.md").write_text(md, encoding="utf-8")
        print(f"wrote {out_dir / f'{slug}.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
