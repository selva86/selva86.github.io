"""Lever 2: pages with actual CTR well below expected at their click-weighted position.

Excludes brand queries from the primary report; surfaces brand_ambiguous matches
(brand regex hits a non-homepage URL) in a separate 'review' list.
"""
from __future__ import annotations

from .. import config
from ..ctr_curve import lookup_ctr


def _is_homepage(url: str) -> bool:
    if not url:
        return False
    u = url.rstrip("/")
    return u.endswith("r-statistics.co") or u.endswith("/index") or u.endswith("/index.html")


def find(con, window_days: int = None) -> tuple[list[dict], list[dict]]:
    window_days = window_days or config.ANALYSIS_WINDOW_DAYS

    rows = con.execute(
        f"""
        SELECT query,
               page,
               SUM(clicks * position) * 1.0 / NULLIF(SUM(clicks), 0) AS click_w_pos,
               AVG(position) AS avg_pos,
               SUM(impressions) AS imp,
               SUM(clicks) AS clicks
        FROM gsc_data
        WHERE date >= date('now','-{window_days} days')
          AND query != ''
          AND NOT regexp(?, page)
        GROUP BY query, page
        HAVING imp >= ?
        """,
        (config.EXCLUDE_PAGE_REGEX, config.LOW_CTR_MIN_IMPRESSIONS),
    ).fetchall()

    main: list[dict] = []
    ambiguous: list[dict] = []

    for query, page, click_w_pos, avg_pos, imp, clicks in rows:
        if not imp:
            continue
        pos = click_w_pos if click_w_pos else avg_pos
        expected = lookup_ctr(pos)
        actual = (clicks or 0) / imp
        if expected <= 0 or actual >= config.LOW_CTR_RATIO_THRESHOLD * expected:
            continue

        is_brand = bool(config.BRAND_REGEX.search(query or ""))
        if is_brand and _is_homepage(page):
            continue

        gain_per_week = (imp / (window_days / 7.0)) * max(expected - actual, 0)
        row = {
            "lever": "low_ctr",
            "target": f"{query}  →  {page}",
            "query": query,
            "page": page,
            "avg_position": round(pos, 2),
            "impressions": int(imp),
            "actual_ctr": round(actual, 4),
            "expected_ctr": round(expected, 4),
            "action": "Rewrite title tag and meta description; keep URL/content intact.",
            "weekly_clicks_at_stake": round(gain_per_week, 2),
            "confidence": config.CONFIDENCE["low_ctr"],
        }
        if is_brand:
            row["flag"] = "brand_ambiguous"
            ambiguous.append(row)
        else:
            main.append(row)

    main.sort(key=lambda r: r["weekly_clicks_at_stake"], reverse=True)
    ambiguous.sort(key=lambda r: r["weekly_clicks_at_stake"], reverse=True)
    return main, ambiguous
