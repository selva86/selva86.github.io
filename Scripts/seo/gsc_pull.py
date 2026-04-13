"""GSC puller: per-day chunking into SQLite cache with migration + lock."""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from . import config
from .common import (
    acquire_lock,
    atomic_write_json,
    canonicalize_url,
    connect_to_cache,
    log,
    migrate_schema,
    release_lock,
)

LOCK_PATH = config.SCRIPTS_DIR / "seo_pull.lock"


def _day_range(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def _load_state() -> dict:
    if config.PULL_STATE.exists():
        try:
            return json.loads(config.PULL_STATE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"last_pulled_date": None}


def _save_state(state: dict) -> None:
    atomic_write_json(config.PULL_STATE, state)


def _fetch_day(service, day: date) -> list[dict]:
    """Fetch one day, paginating if needed. Returns list of GSC rows."""
    from googleapiclient.errors import HttpError

    all_rows: list[dict] = []
    start = 0
    for _ in range(10):
        request = {
            "startDate": day.isoformat(),
            "endDate": day.isoformat(),
            "dimensions": ["date", "query", "page", "country", "device"],
            "rowLimit": config.GSC_ROW_LIMIT,
            "startRow": start,
        }

        delay = config.GSC_RETRY_INITIAL
        for attempt in range(config.GSC_RETRY_MAX):
            try:
                resp = (
                    service.searchanalytics()
                    .query(siteUrl=config.SITE_URL, body=request)
                    .execute()
                )
                break
            except HttpError as exc:
                status = getattr(exc.resp, "status", None)
                if status in (429, 500, 502, 503, 504) and attempt < config.GSC_RETRY_MAX - 1:
                    log(f"HTTP {status} on {day}; retrying in {delay}s", config.PULL_LOG)
                    time.sleep(delay)
                    delay = min(delay * 2, 16)
                    continue
                raise
        else:
            raise RuntimeError(f"Retries exhausted for {day}")

        batch = resp.get("rows", [])
        all_rows.extend(batch)
        if len(batch) < config.GSC_ROW_LIMIT:
            break
        start += len(batch)
        time.sleep(config.GSC_THROTTLE_SECONDS)
    return all_rows


def _insert_rows(con, rows: list[dict]) -> int:
    sql = (
        "INSERT OR REPLACE INTO gsc_data "
        "(date, query, page, country, device, clicks, impressions, ctr, position) "
        "VALUES (?,?,?,?,?,?,?,?,?)"
    )
    tuples = []
    for r in rows:
        keys = r.get("keys", [])
        if len(keys) != 5:
            continue
        d, q, p, country, device = keys
        tuples.append(
            (
                d,
                q or "",
                canonicalize_url(p),
                country,
                device,
                int(r.get("clicks") or 0),
                int(r.get("impressions") or 0),
                float(r.get("ctr") or 0.0),
                float(r.get("position") or 0.0),
            )
        )
    con.executemany(sql, tuples)
    return len(tuples)


def _log_pull(con, day: date, n_rows: int, status: str, error: str | None) -> None:
    con.execute(
        "INSERT OR REPLACE INTO pull_log (date, pulled_at, rows, status, error) VALUES (?,?,?,?,?)",
        (
            day.isoformat(),
            datetime.now(timezone.utc).isoformat(),
            n_rows,
            status,
            error,
        ),
    )


def plan_days(con, backfill_days: int, force_refresh: int, hard_stop_offset: int) -> list[date]:
    """Decide which days to fetch. Fetch if not in pull_log with status=success, plus force_refresh tail."""
    today = date.today()
    end = today - timedelta(days=hard_stop_offset)
    start = end - timedelta(days=backfill_days - 1)

    rows = con.execute(
        "SELECT date, status FROM pull_log WHERE status='success'"
    ).fetchall()
    done = {r[0] for r in rows}

    days_out = []
    for d in _day_range(start, end):
        iso = d.isoformat()
        if iso not in done:
            days_out.append(d)

    if force_refresh > 0:
        tail = [end - timedelta(days=i) for i in range(force_refresh)]
        tail_set = {d.isoformat() for d in tail}
        days_out = [d for d in days_out if d.isoformat() not in tail_set] + tail
        days_out = sorted(set(days_out))
    return days_out


def run(args) -> int:
    con = connect_to_cache()
    migrate_schema(con)

    if args.init:
        from .auth import build_service, ensure_client_secret, get_credentials, list_properties

        ensure_client_secret()
        creds = get_credentials(force_reauth=args.force_reauth)
        service = build_service(creds)
        props = list_properties(service)
        log(f"Account properties: {props}", config.PULL_LOG)
        if config.SITE_URL not in props:
            log(
                f"WARNING: {config.SITE_URL} not found. Available: {props}",
                config.PULL_LOG,
            )
        else:
            log(f"Verified property {config.SITE_URL}", config.PULL_LOG)

    backfill_days = args.days or config.BACKFILL_DAYS
    days = plan_days(con, backfill_days, args.force_refresh, config.FRESHNESS_LAG_DAYS)
    log(f"Planned {len(days)} day(s) to fetch; backfill_days={backfill_days}", config.PULL_LOG)

    if args.dry_run:
        for d in days[:5]:
            log(f"  would fetch {d}", config.PULL_LOG)
        if len(days) > 5:
            log(f"  ... and {len(days) - 5} more", config.PULL_LOG)
        return 0

    if not days:
        log("Nothing to fetch.", config.PULL_LOG)
        return 0

    from .auth import build_service, get_credentials

    creds = get_credentials()
    service = build_service(creds)

    total_rows = 0
    failed = 0
    for d in days:
        try:
            rows = _fetch_day(service, d)
            n = _insert_rows(con, rows)
            total_rows += n
            _log_pull(con, d, n, "success", None)
            con.commit()
            log(f"  {d}: {n} rows", config.PULL_LOG)
        except Exception as exc:
            failed += 1
            _log_pull(con, d, 0, "error", str(exc))
            con.commit()
            log(f"  {d}: FAILED {exc}", config.PULL_LOG)
        time.sleep(config.GSC_THROTTLE_SECONDS)

    state = _load_state()
    state["last_pulled_date"] = max(d.isoformat() for d in days) if days else state.get("last_pulled_date")
    _save_state(state)
    log(f"Done. {total_rows} rows, {failed} failed days.", config.PULL_LOG)
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description="Pull Google Search Console data into local SQLite cache.")
    parser.add_argument("--init", action="store_true", help="Run OAuth flow and verify site property.")
    parser.add_argument("--force-reauth", action="store_true", help="Discard token and re-authenticate.")
    parser.add_argument("--dry-run", action="store_true", help="List days that would be fetched and exit.")
    parser.add_argument("--days", type=int, default=0, help="Backfill window (default: BACKFILL_DAYS).")
    parser.add_argument("--force-refresh", type=int, default=0, help="Re-pull last N days even if already cached.")
    args = parser.parse_args(argv)

    acquire_lock(LOCK_PATH)
    try:
        return run(args)
    finally:
        release_lock(LOCK_PATH)


if __name__ == "__main__":
    sys.exit(main())
