"""Lever 4: queries with impressions but (a) no top-20 URL or (b) off-topic ranking slug."""
from __future__ import annotations

import re
from collections import defaultdict
from urllib.parse import urlsplit

from .. import config
from ..ctr_curve import lookup_ctr


def _tokens(s: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", (s or "").lower()) if t and t not in config.STOPWORDS}


def _slug(url: str) -> str:
    try:
        return urlsplit(url).path.rsplit("/", 1)[-1].replace(".html", "").replace("-", " ")
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
        """,
        (config.EXCLUDE_PAGE_REGEX,),
    ).fetchall()

    by_query: dict[str, list[dict]] = defaultdict(list)
    for query, page, imp, clicks, avg_pos in rows:
        by_query[query].append({
            "page": page, "imp": int(imp or 0), "clicks": int(clicks or 0),
            "avg_pos": float(avg_pos or 0),
        })

    out = []
    for query, cands in by_query.items():
        total_imp = sum(c["imp"] for c in cands)
        if total_imp < config.GAP_MIN_IMPRESSIONS:
            continue

        top = max(cands, key=lambda c: c["imp"])
        q_tokens = _tokens(query)
        slug_tokens = _tokens(_slug(top["page"]))
        if not q_tokens:
            continue
        overlap = len(q_tokens & slug_tokens) / len(q_tokens)

        in_top_20 = any(c["avg_pos"] <= 20 for c in cands)
        if not in_top_20:
            reason = "no_top_20_url"
        elif overlap < config.GAP_SLUG_OVERLAP_THRESHOLD:
            reason = "off_topic_slug"
        else:
            continue

        gain_per_week = (
            total_imp / (window_days / 7.0)
        ) * lookup_ctr(5) * config.GAP_SCORE_FACTOR

        out.append({
            "lever": "content_gaps",
            "target": query,
            "query": query,
            "page": top["page"],
            "avg_position": round(top["avg_pos"], 2),
            "impressions": total_imp,
            "reason": reason,
            "slug_overlap": round(overlap, 2),
            "action": (
                "No relevant URL — write a new post targeting this query."
                if reason == "no_top_20_url"
                else "Existing top URL is off-topic — write a dedicated post for this query."
            ),
            "weekly_clicks_at_stake": round(gain_per_week, 2),
            "confidence": config.CONFIDENCE["content_gaps"],
        })
    out.sort(key=lambda r: r["weekly_clicks_at_stake"], reverse=True)
    return out
