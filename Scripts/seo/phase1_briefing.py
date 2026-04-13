"""Generate Phase 1 per-page briefings: current title/meta, top queries, CTR gap vs industry."""
from __future__ import annotations

import re
from pathlib import Path

from Scripts.seo import config
from Scripts.seo.common import connect_to_cache
from Scripts.seo.ctr_curve import lookup_ctr

PAGES = [
    "https://r-statistics.co/ggplot2-Tutorial-With-R.html",
    "https://r-statistics.co/Linear-Regression.html",
    "https://r-statistics.co/Loess-Regression-With-R.html",
]

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
META_RE = re.compile(r'<meta\s+name="description"\s+content="(.*?)"', re.I)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)


def extract(page_url: str) -> dict:
    slug = page_url.rsplit("/", 1)[-1]
    path = config.REPO_ROOT / slug
    if not path.exists():
        return {"slug": slug, "title": "(file not found)", "meta": "", "h1": ""}
    html = path.read_text(encoding="utf-8", errors="ignore")
    title = TITLE_RE.search(html)
    meta = META_RE.search(html)
    h1 = H1_RE.search(html)
    return {
        "slug": slug,
        "title": (title.group(1).strip() if title else ""),
        "meta": (meta.group(1).strip() if meta else ""),
        "h1": (h1.group(1).strip() if h1 else ""),
    }


def top_queries(con, page: str, limit: int = 20) -> list[dict]:
    rows = con.execute(
        """
        SELECT query,
               SUM(impressions) AS imp,
               SUM(clicks) AS clicks,
               SUM(clicks) * 1.0 / NULLIF(SUM(impressions), 0) AS ctr,
               SUM(position * impressions) * 1.0 / NULLIF(SUM(impressions), 0) AS pos
        FROM gsc_data
        WHERE page = ?
          AND date >= date('now','-90 days')
          AND query != ''
        GROUP BY query
        HAVING imp >= 20
        ORDER BY imp DESC
        LIMIT ?
        """,
        (page, limit),
    ).fetchall()
    out = []
    for q, imp, clicks, ctr, pos in rows:
        exp = lookup_ctr(pos)
        gap = exp - (ctr or 0)
        weekly_imp = imp / (90 / 7)
        gain = weekly_imp * max(gap, 0)
        out.append({
            "query": q,
            "imp": int(imp),
            "clicks": int(clicks or 0),
            "ctr": float(ctr or 0),
            "pos": float(pos or 0),
            "expected_ctr": exp,
            "gap": gap,
            "gain_per_week_if_curve_hit": round(gain, 1),
        })
    return out


def page_totals(con, page: str) -> dict:
    r = con.execute(
        """
        SELECT SUM(clicks), SUM(impressions)
        FROM gsc_data
        WHERE page = ? AND date >= date('now','-90 days')
        """,
        (page,),
    ).fetchone()
    clicks, imp = r
    return {
        "current_clicks_per_week": round((clicks or 0) / (90 / 7), 1),
        "current_impressions_per_week": round((imp or 0) / (90 / 7), 0),
        "current_ctr": round((clicks or 0) / imp, 4) if imp else 0.0,
    }


def render(page: str, con) -> str:
    meta = extract(page)
    totals = page_totals(con, page)
    queries = top_queries(con, page)

    total_gain = sum(q["gain_per_week_if_curve_hit"] for q in queries)

    lines: list[str] = []
    lines.append(f"# Phase 1 Briefing: {meta['slug']}\n")
    lines.append(f"**URL**: {page}\n")
    lines.append("## Current state\n")
    lines.append(f"- **Title** ({len(meta['title'])} chars): `{meta['title']}`")
    lines.append(f"- **Meta description** ({len(meta['meta'])} chars): `{meta['meta']}`")
    lines.append(f"- **H1**: `{meta['h1']}`")
    lines.append(f"- **Current clicks/week** (90d avg): {totals['current_clicks_per_week']}")
    lines.append(f"- **Current impressions/week**: {int(totals['current_impressions_per_week']):,}")
    lines.append(f"- **Current overall CTR on this page**: {totals['current_ctr']*100:.2f}%")
    lines.append(f"- **Theoretical gain if CTR hits industry curve**: +{total_gain:.0f} clicks/week\n")

    lines.append("## Top queries (90d, min 20 impressions)\n")
    lines.append("| # | Query | Imp | Clicks | CTR | Pos | Industry CTR@pos | Gap | Weekly gain |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---:|---:|")
    for i, q in enumerate(queries, 1):
        gap = q["gap"] * 100
        gap_str = f"{gap:+.1f}pp" if gap else "—"
        lines.append(
            f"| {i} | `{q['query']}` | {q['imp']:,} | {q['clicks']} | "
            f"{q['ctr']*100:.2f}% | {q['pos']:.1f} | {q['expected_ctr']*100:.2f}% | "
            f"{gap_str} | {q['gain_per_week_if_curve_hit']} |"
        )
    lines.append("")

    lines.append("## Live SERP snippet check (fill in before rewriting)\n")
    lines.append(
        "Open an incognito window and search the top 3 queries above. "
        "Note what Google *actually* shows as the snippet — it may differ from the meta "
        "description in the HTML because Google often auto-generates snippets from body text.\n"
    )
    for q in queries[:3]:
        lines.append(f"- **Query**: `{q['query']}`")
        lines.append("  - Live title shown: _________________________________")
        lines.append("  - Live description shown: _____________________________")
        lines.append("  - Rich result / AI overview present? ☐ yes ☐ no")
        lines.append("")

    lines.append("## Rewrite targets\n")
    lines.append("### New `<title>` (max 60 chars)\n")
    lines.append("Guideline: front-load the highest-impression query from the table above, "
                 "avoid stop words, make it skimmable in a SERP list.\n")
    lines.append("**Draft**: ____________________________________________________\n")
    lines.append("**Char count**: ___\n")

    lines.append("### New meta description (150–160 chars)\n")
    lines.append(
        "Guideline: hit 2–3 of the top query variants naturally, promise something concrete "
        "(\"examples\", \"step-by-step\", \"with code\"), end with a soft value pitch. "
        "Avoid generic phrases like \"learn\" and \"from the ground up\".\n"
    )
    lines.append("**Draft**: ______________________________________________________________________\n")
    lines.append("**Char count**: ___\n")

    lines.append("## Do NOT change in this pass\n")
    lines.append("- URL / slug")
    lines.append("- H1")
    lines.append("- Body content")
    lines.append("- Code examples")
    lines.append("- Internal links\n")
    lines.append("_This is SERP-snippet surgery only._\n")

    return "\n".join(lines)


def main() -> int:
    con = connect_to_cache()
    out_dir = config.REPORTS_DIR / "2026-04-14" / "phase1"
    out_dir.mkdir(parents=True, exist_ok=True)
    for page in PAGES:
        slug = page.rsplit("/", 1)[-1].replace(".html", "")
        md = render(page, con)
        (out_dir / f"{slug}.md").write_text(md, encoding="utf-8")
        print(f"wrote {out_dir / f'{slug}.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
