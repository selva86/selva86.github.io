"""Position → CTR curve. Industry-typical estimates; calibrate from own data if desired."""
from __future__ import annotations

from typing import Dict

# Industry-typical CTR estimates keyed on integer positions 1..20.
# These are NOT authoritative — see calibrate_from_own_data() to refit.
CTR_TABLE: Dict[int, float] = {
    1: 0.280,
    2: 0.155,
    3: 0.110,
    4: 0.080,
    5: 0.063,
    6: 0.051,
    7: 0.041,
    8: 0.033,
    9: 0.028,
    10: 0.025,
    11: 0.019,
    12: 0.016,
    13: 0.013,
    14: 0.011,
    15: 0.010,
    16: 0.009,
    17: 0.008,
    18: 0.007,
    19: 0.006,
    20: 0.005,
}


def lookup_ctr(position: float, table: Dict[int, float] | None = None) -> float:
    """Clamped linear interpolation over the CTR curve (fix #4)."""
    tbl = table or CTR_TABLE
    if position is None:
        return tbl[20]
    position = min(max(float(position), 1.0), 20.0)
    lo = int(position)
    hi = min(lo + 1, 20)
    frac = position - lo
    return tbl[lo] * (1 - frac) + tbl[hi] * frac


def calibrate_from_own_data(con) -> Dict[int, float]:
    """Compute CTR curve from our own GSC data: average CTR by integer position.

    Uses queries with >= 100 impressions over the last 90 days, groups by
    rounded average position, and returns a table keyed on 1..20.
    """
    rows = con.execute(
        """
        SELECT CAST(ROUND(AVG(position)) AS INTEGER) AS pos,
               SUM(clicks) * 1.0 / NULLIF(SUM(impressions), 0) AS ctr,
               SUM(impressions) AS imp
        FROM gsc_data
        WHERE date >= date('now','-90 days') AND query != ''
        GROUP BY query, page
        HAVING SUM(impressions) >= 100
        """
    ).fetchall()

    bucket: Dict[int, list] = {i: [] for i in range(1, 21)}
    for pos, ctr, imp in rows:
        if pos is None or ctr is None:
            continue
        if 1 <= pos <= 20:
            bucket[pos].append((ctr, imp))

    out: Dict[int, float] = {}
    for i in range(1, 21):
        if bucket[i]:
            total_imp = sum(imp for _, imp in bucket[i]) or 1
            out[i] = sum(ctr * imp for ctr, imp in bucket[i]) / total_imp
        else:
            out[i] = CTR_TABLE[i]
    return out
