"""Lever 5: pages losing clicks. Skips if cache <120 days. Anchors windows to cache max date."""
from __future__ import annotations

from datetime import date, datetime, timedelta

from .. import config


def _parse(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def find(con) -> list[dict]:
    row = con.execute("SELECT MIN(date), MAX(date) FROM gsc_data").fetchone()
    if not row or not row[0] or not row[1]:
        return []
    d_min = _parse(row[0])
    d_max = _parse(row[1])
    if (d_max - d_min).days < config.DECAY_MIN_CACHE_DAYS:
        return []

    recent_start = d_max - timedelta(days=config.DECAY_RECENT_DAYS - 1)
    baseline_start = d_max - timedelta(days=config.DECAY_BASELINE_DAYS - 1)
    baseline_end = recent_start - timedelta(days=1)

    rows = con.execute(
        """
        SELECT page,
               SUM(CASE WHEN date >= ? THEN clicks ELSE 0 END) AS rec_clicks,
               SUM(CASE WHEN date BETWEEN ? AND ? THEN clicks ELSE 0 END) AS base_clicks,
               SUM(CASE WHEN date >= ? THEN impressions ELSE 0 END) AS rec_imp,
               SUM(CASE WHEN date BETWEEN ? AND ? THEN impressions ELSE 0 END) AS base_imp
        FROM gsc_data
        WHERE date BETWEEN ? AND ?
          AND NOT regexp(?, page)
        GROUP BY page
        """,
        (
            recent_start.isoformat(),
            baseline_start.isoformat(), baseline_end.isoformat(),
            recent_start.isoformat(),
            baseline_start.isoformat(), baseline_end.isoformat(),
            baseline_start.isoformat(), d_max.isoformat(),
            config.EXCLUDE_PAGE_REGEX,
        ),
    ).fetchall()

    recent_weeks = config.DECAY_RECENT_DAYS / 7.0
    baseline_weeks = (config.DECAY_BASELINE_DAYS - config.DECAY_RECENT_DAYS) / 7.0
    out = []
    for page, rec_clicks, base_clicks, rec_imp, base_imp in rows:
        rec_cpw = (rec_clicks or 0) / recent_weeks
        base_cpw = (base_clicks or 0) / baseline_weeks
        if base_cpw < config.DECAY_MIN_BASELINE_CLICKS_PER_WEEK:
            continue
        if rec_cpw >= config.DECAY_DROP_THRESHOLD * base_cpw:
            continue

        rec_ipw = (rec_imp or 0) / recent_weeks
        base_ipw = (base_imp or 0) / baseline_weeks
        imp_drop = 1 - (rec_ipw / base_ipw) if base_ipw > 0 else 0
        kind = "decay_rank" if imp_drop >= config.DECAY_RANK_IMPRESSION_DROP else "decay_ctr"

        lost_per_week = max(base_cpw - rec_cpw, 0)
        out.append({
            "lever": "decay",
            "target": page,
            "page": page,
            "recent_clicks_per_week": round(rec_cpw, 2),
            "baseline_clicks_per_week": round(base_cpw, 2),
            "impression_drop": round(imp_drop, 2),
            "kind": kind,
            "action": (
                "Impressions also fell — refresh content / rebuild topical links (rankings slipped)."
                if kind == "decay_rank"
                else "Impressions held but clicks fell — rewrite title/meta (SERP snippet lost its edge)."
            ),
            "weekly_clicks_at_stake": round(lost_per_week, 2),
            "confidence": config.CONFIDENCE["decay"],
        })
    out.sort(key=lambda r: r["weekly_clicks_at_stake"], reverse=True)
    return out
