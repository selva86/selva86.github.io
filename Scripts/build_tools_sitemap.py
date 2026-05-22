#!/usr/bin/env python3
"""Generate sitemap-tools.xml — a dedicated sitemap listing the 27 tools
plus the /tools/ landing. Submit this in Google Search Console once to
get a single-glance 'X of 28 indexed' tile in Indexing -> Sitemaps.

Output: selva86.github.io/sitemap-tools.xml

Idempotent. Re-runs are safe; commits only when content changes.
"""
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://r-statistics.co"
OUT  = ROOT / "sitemap-tools.xml"

tool_files = sorted(p.name for p in (ROOT/"tools").glob("*.html"))
today = date.today().isoformat()

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

# Landing page first
lines += [
    "  <url>",
    f"    <loc>{BASE}/tools/</loc>",
    f"    <lastmod>{today}</lastmod>",
    "    <changefreq>weekly</changefreq>",
    "    <priority>0.9</priority>",
    "  </url>",
]

for name in tool_files:
    if name == "index.html":
        continue
    p = ROOT / "tools" / name
    # Use file mtime as lastmod for honesty with Google
    import datetime as _dt
    mtime = _dt.date.fromtimestamp(p.stat().st_mtime).isoformat()
    lines += [
        "  <url>",
        f"    <loc>{BASE}/tools/{name}</loc>",
        f"    <lastmod>{mtime}</lastmod>",
        "    <changefreq>monthly</changefreq>",
        "    <priority>0.8</priority>",
        "  </url>",
    ]

lines.append("</urlset>")
lines.append("")  # trailing newline
content = "\n".join(lines)

prev = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
if prev == content:
    print(f"sitemap-tools.xml unchanged ({len(tool_files)-1} tools + landing)")
else:
    OUT.write_text(content, encoding="utf-8")
    print(f"wrote sitemap-tools.xml: {len(tool_files)-1} tools + landing -> {OUT}")
