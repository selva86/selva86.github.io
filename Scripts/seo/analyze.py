"""Analyzer: runs all 5 levers + backlog and writes a timestamped report folder."""
from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

from . import config
from .common import connect_to_cache, log, migrate_schema
from .levers import (
    backlog as backlog_mod,
    cannibalization,
    content_gaps,
    decay,
    low_ctr,
    striking_distance,
)
from .report import h1, render_table, section


STRIKING_COLS = [
    ("query", "Query"),
    ("page", "Page"),
    ("avg_position", "Pos"),
    ("impressions", "Imp"),
    ("current_ctr", "CTR"),
    ("weekly_clicks_at_stake", "Weekly Δclicks"),
    ("action", "Action"),
]

LOW_CTR_COLS = [
    ("query", "Query"),
    ("page", "Page"),
    ("avg_position", "Pos"),
    ("impressions", "Imp"),
    ("actual_ctr", "Actual CTR"),
    ("expected_ctr", "Expected CTR"),
    ("weekly_clicks_at_stake", "Weekly Δclicks"),
    ("action", "Action"),
]

CANNIB_COLS = [
    ("query", "Query"),
    ("page", "Top URL"),
    ("top_impressions", "Top Imp"),
    ("second_impressions", "#2 Imp"),
    ("same_topic_likely", "Same topic?"),
    ("weekly_clicks_at_stake", "Weekly Δclicks"),
    ("action", "Action"),
]

GAPS_COLS = [
    ("query", "Query"),
    ("page", "Closest URL"),
    ("avg_position", "Pos"),
    ("impressions", "Imp"),
    ("reason", "Reason"),
    ("slug_overlap", "Overlap"),
    ("weekly_clicks_at_stake", "Weekly Δclicks"),
    ("action", "Action"),
]

DECAY_COLS = [
    ("page", "Page"),
    ("recent_clicks_per_week", "Recent /wk"),
    ("baseline_clicks_per_week", "Baseline /wk"),
    ("impression_drop", "Imp drop"),
    ("kind", "Kind"),
    ("weekly_clicks_at_stake", "Lost /wk"),
    ("action", "Action"),
]

BACKLOG_COLS = [
    ("lever", "Lever"),
    ("target", "Target"),
    ("weekly_clicks_at_stake", "Weekly Δclicks"),
    ("confidence", "Confidence"),
    ("score", "Score"),
    ("action", "Action"),
]


def _summary_stats(con) -> dict:
    cur = con.execute("SELECT COUNT(*), MIN(date), MAX(date) FROM gsc_data").fetchone()
    total_rows, d_min, d_max = cur
    pages = con.execute(
        "SELECT COUNT(DISTINCT page) FROM gsc_data WHERE NOT regexp(?, page)",
        (config.EXCLUDE_PAGE_REGEX,),
    ).fetchone()[0]
    excluded = con.execute(
        "SELECT COUNT(DISTINCT page) FROM gsc_data WHERE regexp(?, page)",
        (config.EXCLUDE_PAGE_REGEX,),
    ).fetchone()[0]
    queries = con.execute(
        "SELECT COUNT(DISTINCT query) FROM gsc_data WHERE query != ''"
    ).fetchone()[0]
    anon_rows = con.execute("SELECT COUNT(*) FROM gsc_data WHERE query = ''").fetchone()[0]
    total_clicks = con.execute("SELECT COALESCE(SUM(clicks),0) FROM gsc_data").fetchone()[0]
    anon_clicks = con.execute(
        "SELECT COALESCE(SUM(clicks),0) FROM gsc_data WHERE query = ''"
    ).fetchone()[0]
    return {
        "total_rows": total_rows or 0,
        "date_min": d_min,
        "date_max": d_max,
        "content_pages": pages or 0,
        "excluded_pages": excluded or 0,
        "unique_queries": queries or 0,
        "anon_rows": anon_rows or 0,
        "total_clicks": total_clicks or 0,
        "anon_clicks": anon_clicks or 0,
    }


def _brand_stats(con) -> tuple[int, int]:
    import re
    brand_re = config.BRAND_REGEX
    rows = con.execute(
        "SELECT query, SUM(clicks) FROM gsc_data WHERE query != '' GROUP BY query"
    ).fetchall()
    brand_clicks = sum(c for q, c in rows if brand_re.search(q or ""))
    total_clicks = sum(c for _, c in rows)
    return brand_clicks, total_clicks


def run(args) -> int:
    con = connect_to_cache()
    migrate_schema(con)

    stats = _summary_stats(con)
    if stats["total_rows"] == 0:
        log("Cache is empty. Run gsc_pull.py first.", config.ANALYZE_LOG)
        return 1

    log(
        f"Loaded: {stats['total_rows']:,} rows, "
        f"{stats['date_min']} .. {stats['date_max']}, "
        f"{stats['content_pages']} content pages, "
        f"{stats['unique_queries']:,} unique queries",
        config.ANALYZE_LOG,
    )

    strike = striking_distance.find(con)
    low_main, low_ambig = low_ctr.find(con)
    cannib = cannibalization.find(con)
    gaps = content_gaps.find(con)
    decay_rows = decay.find(con)

    log(f"Lever 1 striking_distance: {len(strike)} opps", config.ANALYZE_LOG)
    log(f"Lever 2 low_ctr: {len(low_main)} pages ({len(low_ambig)} brand_ambiguous)", config.ANALYZE_LOG)
    log(f"Lever 3 cannibalization: {len(cannib)} clusters", config.ANALYZE_LOG)
    log(f"Lever 4 content_gaps: {len(gaps)} queries", config.ANALYZE_LOG)
    log(f"Lever 5 decay: {len(decay_rows)} pages" + ("" if decay_rows else " (skipped if <120d)"), config.ANALYZE_LOG)

    merged = backlog_mod.merge(strike, low_main, cannib, gaps, decay_rows)
    top = merged[: config.BACKLOG_TOP_N]

    out_dir = config.REPORTS_DIR / datetime.now().strftime("%Y-%m-%d")
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "01_striking_distance.md").write_text(
        h1("Striking Distance (positions 8–20)") + render_table(strike, STRIKING_COLS),
        encoding="utf-8",
    )
    (out_dir / "02_low_ctr.md").write_text(
        h1("Low CTR")
        + section("Primary", render_table(low_main, LOW_CTR_COLS))
        + section("Review manually (brand_ambiguous)", render_table(low_ambig, LOW_CTR_COLS)),
        encoding="utf-8",
    )
    (out_dir / "03_cannibalization.md").write_text(
        h1("Cannibalization") + render_table(cannib, CANNIB_COLS),
        encoding="utf-8",
    )
    (out_dir / "04_content_gaps.md").write_text(
        h1("Content Gaps") + render_table(gaps, GAPS_COLS),
        encoding="utf-8",
    )
    (out_dir / "05_decay.md").write_text(
        h1("Decay") + render_table(decay_rows, DECAY_COLS),
        encoding="utf-8",
    )
    (out_dir / "00_backlog.md").write_text(
        h1(f"SEO Backlog — Top {config.BACKLOG_TOP_N} of {len(merged)}")
        + render_table(top, BACKLOG_COLS),
        encoding="utf-8",
    )

    brand_clicks, total_clicks = _brand_stats(con)
    brand_pct = (100.0 * brand_clicks / total_clicks) if total_clicks else 0.0
    anon_pct = (
        100.0 * stats["anon_clicks"] / stats["total_clicks"]
    ) if stats["total_clicks"] else 0.0

    summary_md = (
        h1("Run Summary")
        + f"- Generated: {datetime.now().isoformat()}\n"
        + f"- Cache window: {stats['date_min']} .. {stats['date_max']}\n"
        + f"- Total rows: {stats['total_rows']:,}\n"
        + f"- Content pages: {stats['content_pages']}   (excluded: {stats['excluded_pages']})\n"
        + f"- Unique queries: {stats['unique_queries']:,}\n"
        + f"- Anonymized rows: {stats['anon_rows']:,}  ({anon_pct:.1f}% of clicks)\n"
        + f"- Brand clicks: {brand_clicks:,}  ({brand_pct:.1f}% of non-anon clicks)\n\n"
        + "## Lever totals\n\n"
        + f"- Striking distance: {len(strike)} opps, "
        f"{sum(r['weekly_clicks_at_stake'] for r in strike):.1f} weekly clicks at stake\n"
        + f"- Low CTR: {len(low_main)} pages, "
        f"{sum(r['weekly_clicks_at_stake'] for r in low_main):.1f} weekly clicks at stake "
        f"(+{len(low_ambig)} brand_ambiguous for manual review)\n"
        + f"- Cannibalization: {len(cannib)} clusters, "
        f"{sum(r['weekly_clicks_at_stake'] for r in cannib):.1f} weekly clicks at stake\n"
        + f"- Content gaps: {len(gaps)} queries, "
        f"{sum(r['weekly_clicks_at_stake'] for r in gaps):.1f} weekly clicks at stake\n"
        + f"- Decay: {len(decay_rows)} pages, "
        f"{sum(r['weekly_clicks_at_stake'] for r in decay_rows):.1f} weekly clicks lost\n"
    )
    (out_dir / "summary.md").write_text(summary_md, encoding="utf-8")

    log(f"Reports written to {out_dir}", config.ANALYZE_LOG)
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser()
    args = parser.parse_args(argv)
    return run(args)


if __name__ == "__main__":
    sys.exit(main())
