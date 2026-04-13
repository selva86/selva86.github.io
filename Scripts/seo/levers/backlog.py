"""Merge all lever outputs into one ranked backlog."""
from __future__ import annotations


def merge(*lever_outputs) -> list[dict]:
    flat: list[dict] = []
    for group in lever_outputs:
        if not group:
            continue
        flat.extend(group)

    for row in flat:
        row["score"] = round(
            float(row.get("weekly_clicks_at_stake", 0))
            * float(row.get("confidence", 0)),
            3,
        )
    flat.sort(key=lambda r: r["score"], reverse=True)
    return flat
