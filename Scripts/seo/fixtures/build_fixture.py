"""Build a reproducible sample SQLite fixture with one positive case per lever."""
from __future__ import annotations

import sqlite3
from datetime import date, timedelta
from pathlib import Path

from Scripts.seo import config
from Scripts.seo.common import connect_to_cache, migrate_schema

FIXTURE_PATH = Path(__file__).parent / "sample_gsc.sqlite"


def _row(d, q, p, country="usa", device="DESKTOP", clicks=0, impressions=0, position=10.0):
    ctr = (clicks / impressions) if impressions else 0.0
    return (d.isoformat(), q, p, country, device, clicks, impressions, ctr, position)


def build(path: Path = FIXTURE_PATH) -> Path:
    if path.exists():
        path.unlink()
    path.parent.mkdir(parents=True, exist_ok=True)
    con = connect_to_cache(path)
    migrate_schema(con)

    end = date(2026, 4, 10)
    start = end - timedelta(days=150)
    rows = []

    # Lever 1: striking distance — avg position ~12, decent impressions
    for i in range(120):
        d = start + timedelta(days=i)
        rows.append(_row(d, "bayesian regression in r",
                         "https://r-statistics.co/Bayesian-Regression.html",
                         clicks=2, impressions=60, position=12.3))

    # Lever 2: low CTR — top-3 but CTR way below expected
    for i in range(120):
        d = start + timedelta(days=i)
        rows.append(_row(d, "r closures explained",
                         "https://r-statistics.co/R-Closures.html",
                         clicks=1, impressions=200, position=2.8))

    # Lever 3: cannibalization — two URLs splitting one query
    for i in range(120):
        d = start + timedelta(days=i)
        rows.append(_row(d, "linear regression r tutorial",
                         "https://r-statistics.co/Linear-Regression.html",
                         clicks=5, impressions=80, position=6.2))
        rows.append(_row(d, "linear regression r tutorial",
                         "https://r-statistics.co/OLS-Regression-in-R.html",
                         clicks=2, impressions=40, position=9.4))

    # Lever 4a: content gap — query has impressions, no top-20 ranking URL
    for i in range(60):
        d = start + timedelta(days=i)
        rows.append(_row(d, "r vs python data science",
                         "https://r-statistics.co/R-Closures.html",
                         clicks=0, impressions=35, position=42.0))

    # Lever 4b: off-topic slug — query has clicks but slug doesn't match
    for i in range(60):
        d = start + timedelta(days=i)
        rows.append(_row(d, "shapiro wilk test normality",
                         "https://r-statistics.co/Linear-Regression.html",
                         clicks=0, impressions=25, position=17.0))

    # Lever 5: decay — baseline strong, recent window collapsed
    for i in range(90):
        d = start + timedelta(days=i)
        rows.append(_row(d, "kmeans clustering r",
                         "https://r-statistics.co/KMeans-Clustering.html",
                         clicks=10, impressions=120, position=4.1))
    for i in range(30):
        d = end - timedelta(days=29 - i)
        rows.append(_row(d, "kmeans clustering r",
                         "https://r-statistics.co/KMeans-Clustering.html",
                         clicks=2, impressions=100, position=5.5))

    # Brand query (should be excluded from low_ctr but counted for summary)
    for i in range(30):
        d = end - timedelta(days=29 - i)
        rows.append(_row(d, "r-statistics.co tutorials",
                         "https://r-statistics.co/",
                         clicks=10, impressions=120, position=1.3))

    # Anonymized rows
    for i in range(30):
        d = end - timedelta(days=29 - i)
        rows.append(_row(d, "",
                         "https://r-statistics.co/R-Closures.html",
                         clicks=1, impressions=30, position=8.0))

    # Noise — a well-performing page
    for i in range(90):
        d = start + timedelta(days=i)
        rows.append(_row(d, "r random forest",
                         "https://r-statistics.co/Random-Forest.html",
                         clicks=8, impressions=90, position=3.2))

    con.executemany(
        "INSERT OR REPLACE INTO gsc_data "
        "(date, query, page, country, device, clicks, impressions, ctr, position) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        rows,
    )
    con.commit()
    con.close()
    return path


if __name__ == "__main__":
    p = build()
    print(f"wrote {p}")
