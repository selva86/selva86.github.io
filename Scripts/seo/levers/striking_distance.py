"""Lever 1: queries ranking 8-20 that a small push could move to page 1."""
from __future__ import annotations

from .. import config
from ..ctr_curve import lookup_ctr


def find(con, window_days: int = None) -> list[dict]:
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
        HAVING avg_pos BETWEEN ? AND ?
           AND imp >= ?
        ORDER BY imp DESC
        """,
        (config.EXCLUDE_PAGE_REGEX, config.STRIKING_POS_MIN, config.STRIKING_POS_MAX, config.STRIKING_MIN_IMPRESSIONS),
    ).fetchall()

    out = []
    for query, page, click_w_pos, avg_pos, imp, clicks in rows:
        if not imp:
            continue
        current_ctr = (clicks or 0) / imp
        target_ctr = lookup_ctr(5)
        gain_per_week = (imp / (window_days / 7.0)) * max(target_ctr - current_ctr, 0)
        out.append({
            "lever": "striking_distance",
            "target": f"{query}  →  {page}",
            "query": query,
            "page": page,
            "avg_position": round(avg_pos, 2),
            "impressions": int(imp),
            "current_ctr": round(current_ctr, 4),
            "action": f"Rework H1/intro/FAQ around '{query}'; add FAQ schema; push for position 5.",
            "weekly_clicks_at_stake": round(gain_per_week, 2),
            "confidence": config.CONFIDENCE["striking_distance"],
        })
    out.sort(key=lambda r: r["weekly_clicks_at_stake"], reverse=True)
    return out
