"""Lever 3: queries with 2+ URLs splitting authority."""
from __future__ import annotations

from collections import defaultdict
from difflib import SequenceMatcher
from urllib.parse import urlsplit

from .. import config


def _slug(url: str) -> str:
    try:
        return urlsplit(url).path.rsplit("/", 1)[-1].replace(".html", "").lower()
    except Exception:
        return ""


def find(con, window_days: int = None) -> list[dict]:
    window_days = window_days or config.ANALYSIS_WINDOW_DAYS

    rows = con.execute(
        f"""
        SELECT query, page,
               SUM(impressions) AS imp,
               SUM(clicks) AS clicks,
               AVG(position) AS avg_pos
        FROM gsc_data
        WHERE date >= date('now','-{window_days} days')
          AND query != ''
          AND NOT regexp(?, page)
        GROUP BY query, page
        HAVING imp >= 10
        """,
        (config.EXCLUDE_PAGE_REGEX,),
    ).fetchall()

    by_query = defaultdict(list)
    for query, page, imp, clicks, avg_pos in rows:
        by_query[query].append({
            "page": page,
            "impressions": int(imp or 0),
            "clicks": int(clicks or 0),
            "avg_position": float(avg_pos or 0),
        })

    out = []
    for query, pages in by_query.items():
        if len(pages) < 2:
            continue
        pages.sort(key=lambda p: p["impressions"], reverse=True)
        top = pages[0]
        second = pages[1]
        if top["impressions"] <= 0:
            continue
        if second["impressions"] < config.CANNIB_SECOND_SHARE * top["impressions"]:
            continue

        total_imp = sum(p["impressions"] for p in pages)
        ratio = SequenceMatcher(None, _slug(top["page"]), _slug(second["page"])).ratio()
        gain_per_week = (total_imp / (window_days / 7.0)) * config.CANNIB_SCORE_FACTOR * 0.05

        out.append({
            "lever": "cannibalization",
            "target": query,
            "query": query,
            "page": top["page"],
            "secondary_pages": [p["page"] for p in pages[1:]],
            "top_impressions": top["impressions"],
            "second_impressions": second["impressions"],
            "action": (
                "Pick one canonical URL for this query; 301 or internal-link the others. "
                f"Slug similarity {ratio:.2f} ({'same topic likely' if ratio >= 0.6 else 'distinct slugs'})."
            ),
            "same_topic_likely": ratio >= 0.6,
            "weekly_clicks_at_stake": round(gain_per_week, 2),
            "confidence": config.CONFIDENCE["cannibalization"],
        })
    out.sort(key=lambda r: r["weekly_clicks_at_stake"], reverse=True)
    return out
