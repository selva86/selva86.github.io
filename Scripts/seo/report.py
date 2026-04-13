"""Markdown report rendering helpers."""
from __future__ import annotations

from tabulate import tabulate


def render_table(rows: list[dict], columns: list[tuple[str, str]]) -> str:
    if not rows:
        return "_No items._\n"
    headers = [label for _, label in columns]
    data = [[r.get(k, "") for k, _ in columns] for r in rows]
    return tabulate(data, headers=headers, tablefmt="github") + "\n"


def section(title: str, body: str) -> str:
    return f"## {title}\n\n{body}\n"


def h1(title: str) -> str:
    return f"# {title}\n\n"
