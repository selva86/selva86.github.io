"""Render a parent post's Further Reading block as a categorized card grid.

Child discovery is authoritative: it scans _posts/*.html frontmatter for
posts whose `fr_parent` matches the target and whose `post_type` is FR or
PSEO, keeping only those already published (root <slug>.html exists). This
means a rebuild always reflects the true current child set — it never goes
stale against the rendered block or links.json.

For each child it derives a function-name badge from the slug, truncates the
description to a one-line excerpt, groups children into per-parent categories,
and rewrites the <div id="auto-further-reading"> block in the parent HTML.

Large clusters: the block is capped (CAP_CARDS visible) with a Show-all
toggle, so a 68-child parent renders ~6 rows by default, not 23.

Adds an <!-- fr-manual --> marker so sync_registries.py / auto_link.py skip
the block on future runs. Re-run this script (or /refresh-fr-cards) after
publishing new children under a configured parent.

Usage:
    python _build/fr_cards.py <parent-slug>     # rebuild one parent
    python _build/fr_cards.py --all             # rebuild every configured parent
    python _build/fr_cards.py --list            # show configured parents

Config lives below in PARENT_CONFIGS. Adding a new parent = a few lines.
"""
from __future__ import annotations

import glob
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "_posts"

# Visible-card cap before the "Show all" toggle kicks in (3-col grid -> 6 rows).
CAP_CARDS = 18

# --------------------------------------------------------------------------- #
# Per-parent configuration                                                    #
# --------------------------------------------------------------------------- #
# Each parent declares:
#   intro      : one-sentence framing for the card block
#   categories : ordered list of (label, slug_regex) pairs. First match wins.
#                Children matching none fall into a trailing "Other" group.
#   see_all    : optional URL of a cluster hub (mock #1 style) for a see-all link
# --------------------------------------------------------------------------- #

PARENT_CONFIGS = {
    "ggplot2-Tutorial-With-R.html": {
        "intro": "Pick a chart type, scale, or theme tweak. Every recipe has runnable code, common variations, and the pitfall to avoid.",
        "categories": [
            ("Chart types",          r"^ggplot2-(geom_|annotate)"),
            ("Facets & coordinates", r"^ggplot2-(facet_|coord_)"),
            ("Stats",                r"^ggplot2-stat_"),
            ("Positioning",          r"^ggplot2-position_"),
            ("Scales & colors",      r"^ggplot2-scale_(color|fill|shape|size|linetype)"),
            ("Axes",                 r"^ggplot2-scale_(x|y)_"),
            ("Themes & legends",     r"^ggplot2-(theme|element_|guides)"),
            ("Titles & labels",      r"^ggplot2-(ggtitle|labs|xlab|ylab)"),
        ],
        "see_all": None,  # set to "ggplot2-recipes.html" once the hub page ships
    },
    # Future parents drop in here as they grow. Examples:
    # "Functional-Programming-in-R.html": { ... },
    # "lubridate-in-R.html":              { ... },
    # "stringr-in-R.html":                { ... },
}

# --------------------------------------------------------------------------- #
# Frontmatter helpers                                                         #
# --------------------------------------------------------------------------- #

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
FIELD_RE = re.compile(r'^(\w+):\s*"?(.*?)"?\s*$', re.MULTILINE)


def parse_frontmatter(text: str) -> dict:
    """Parse a leading YAML-ish frontmatter block into a flat dict."""
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    return {fm.group(1): fm.group(2).strip() for fm in FIELD_RE.finditer(m.group(1))}


def read_frontmatter(slug: str) -> dict:
    """Frontmatter of _posts/<slug>.html, or {} if absent."""
    fp = POSTS_DIR / f"{slug}.html"
    if not fp.exists():
        return {}
    return parse_frontmatter(fp.read_text(encoding="utf-8", errors="ignore"))


# --------------------------------------------------------------------------- #
# Child discovery — authoritative, from _posts/ frontmatter                   #
# --------------------------------------------------------------------------- #

def discover_children(parent_filename: str) -> list[tuple[str, str]]:
    """Return (url, title) for every published FR/PSEO child of a parent.

    A child qualifies when its _posts/ fragment frontmatter has
    fr_parent == parent_filename, post_type in (FR, PSEO), and the built
    root-level <slug>.html exists (i.e. it is actually published).

    Sorted by slug so cards land alphabetically by function name within
    each category.
    """
    found = []
    for frag in glob.glob(str(POSTS_DIR / "*.html")):
        fm = parse_frontmatter(Path(frag).read_text(encoding="utf-8", errors="ignore"))
        if fm.get("fr_parent") != parent_filename:
            continue
        if fm.get("post_type") not in ("FR", "PSEO"):
            continue
        slug = os.path.basename(frag)[:-5]
        if not (ROOT / f"{slug}.html").exists():
            continue  # fragment exists but post not published yet
        found.append((slug, f"{slug}.html", fm.get("title", slug)))
    found.sort(key=lambda c: c[0])
    return [(url, title) for _slug, url, title in found]


# --------------------------------------------------------------------------- #
# Slug / text helpers                                                         #
# --------------------------------------------------------------------------- #

def function_badge(slug: str) -> str:
    """Code-style badge from the slug.

    ggplot2-geom_point-in-R          -> geom_point()
    ggplot2-scale_color_viridis-in-R -> scale_color_viridis()
    ggplot2-theme-in-R               -> theme()
    """
    s = re.sub(r"-in-R$", "", slug)
    parts = s.split("-", 1)
    if len(parts) == 2:
        s = parts[1]
    return f"{s.replace('-', '_')}()"


def excerpt(description: str, max_chars: int = 130) -> str:
    """One-line card excerpt: first sentence of the description, de-boilerplated."""
    if not description:
        return ""
    first = re.split(r"(?<=[.!?])\s+", description.strip(), maxsplit=1)[0]
    first = re.sub(
        r"^Use\s+\S+(?:\s+\S+){0,2}\s+(?:to\s+|in R\s+(?:to\s+|for\s+))",
        "", first, flags=re.IGNORECASE,
    )
    first = first[:1].upper() + first[1:]
    if len(first) > max_chars:
        first = first[:max_chars].rsplit(" ", 1)[0].rstrip(",.;:") + "..."
    return first


def cat_slug(label: str) -> str:
    """Stable data-cat value derived from a category label."""
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


# --------------------------------------------------------------------------- #
# FR block location (handles nested <div>)                                    #
# --------------------------------------------------------------------------- #

FR_OPEN_RE = re.compile(r'<div id="auto-further-reading"[^>]*>', re.IGNORECASE)
DIV_TAG_RE = re.compile(r'<(/?)div\b[^>]*>', re.IGNORECASE)


def find_fr_block(html: str) -> tuple[int, int] | None:
    """(start, end) offsets of the <div id="auto-further-reading"> block,
    counting nested <div> tags. None if absent."""
    m = FR_OPEN_RE.search(html)
    if not m:
        return None
    depth, pos = 1, m.end()
    for tm in DIV_TAG_RE.finditer(html, pos):
        depth += -1 if tm.group(1) else 1
        if depth == 0:
            return (m.start(), tm.end())
    return None


# --------------------------------------------------------------------------- #
# Rendering                                                                   #
# --------------------------------------------------------------------------- #

def categorize(children: list[tuple[str, str]],
                cats: list[tuple[str, str]]) -> dict[str, list]:
    """Bucket children into label -> [(url, title, slug), ...], order preserved."""
    buckets: dict[str, list] = {label: [] for label, _ in cats}
    buckets["Other"] = []
    for url, title in children:
        slug = url[:-5] if url.endswith(".html") else url
        for label, pattern in cats:
            if re.search(pattern, slug):
                buckets[label].append((url, title, slug))
                break
        else:
            buckets["Other"].append((url, title, slug))
    if not buckets["Other"]:
        del buckets["Other"]
    return buckets


def render_card(url: str, title: str, slug: str, cat: str) -> str:
    desc = excerpt(read_frontmatter(slug).get("description", ""))
    clean = re.sub(r"\s+With Examples\s*$", "", title)
    clean = re.sub(r"^(ggplot2|dplyr)\s+", "", clean)
    clean = re.sub(r"\s*:\s*$", "", clean)
    return (
        f'  <a class="fr-card" href="{url}" data-cat="{cat}">\n'
        f'    <span class="fr-fn">{function_badge(slug)}</span>\n'
        f'    <span class="fr-title">{clean}</span>\n'
        f'    <p class="fr-excerpt">{desc}</p>\n'
        f'  </a>'
    )


# Inline progressive-enhancement script: category filter + visible-card cap.
# No-JS fallback shows every card (good for crawlers, just long).
_FILTER_SCRIPT = (
    '<script>(function(){'
    'var b=document.currentScript.parentNode,CAP=%d,cat="all",exp=false;'
    'var btns=b.querySelectorAll(".fr-cat"),cards=b.querySelectorAll(".fr-card"),'
    'more=b.querySelector(".fr-more");'
    'function apply(){var n=0,e=0;cards.forEach(function(c){'
    'var inc=(cat==="all"||c.dataset.cat===cat);'
    'if(!inc){c.hidden=true;return;}e++;'
    'if(exp||n<CAP){c.hidden=false;n++;}else{c.hidden=true;}});'
    'if(more){if(e>CAP){more.hidden=false;'
    'more.textContent=exp?"Show fewer \\u25b4":"Show all "+e+" \\u25be";}'
    'else{more.hidden=true;}}}'
    'btns.forEach(function(x){x.addEventListener("click",function(){'
    'btns.forEach(function(y){y.classList.remove("active");});'
    'x.classList.add("active");cat=x.dataset.cat;exp=false;apply();});});'
    'if(more){more.addEventListener("click",function(){exp=!exp;apply();});}'
    'apply();})();</script>'
) % CAP_CARDS


def render_block(cfg: dict, children: list[tuple[str, str]]) -> str:
    buckets = categorize(children, cfg["categories"])
    total = sum(len(v) for v in buckets.values())

    chips = [
        '<button type="button" class="fr-cat active" data-cat="all">'
        f'All <span class="fr-cat-count">{total}</span></button>'
    ]
    cards = []
    for label, items in buckets.items():
        if not items:
            continue
        slug = cat_slug(label)
        chips.append(
            f'<button type="button" class="fr-cat" data-cat="{slug}">{label} '
            f'<span class="fr-cat-count">{len(items)}</span></button>'
        )
        for url, title, child_slug in items:
            cards.append(render_card(url, title, child_slug, slug))

    see_all = ""
    if cfg.get("see_all"):
        see_all = (f'\n<a class="fr-see-all" href="{cfg["see_all"]}">'
                   f'See all {total} recipes &rarr;</a>')

    parts = [
        # Exact marker — has_manual_fr_marker() matches this literal string;
        # it tells sync_registries / auto_link to leave this block alone
        # (the card grid is owned by _build/fr_cards.py).
        '<!-- fr-manual -->',
        '<div id="auto-further-reading" class="fr-cards-block">',
        '<h2>Further Reading</h2>',
        f'<p class="fr-intro">{cfg["intro"]}</p>',
        '<div class="fr-categories" role="tablist">',
        '\n'.join(chips),
        '</div>',
        '<div class="fr-grid">',
        '\n'.join(cards),
        '</div>',
        '<button type="button" class="fr-more" hidden>Show more</button>',
        _FILTER_SCRIPT,
        see_all,
        '</div>',
    ]
    return "\n".join(parts) + "\n"


# --------------------------------------------------------------------------- #
# Main rewrite                                                                #
# --------------------------------------------------------------------------- #

def rewrite_parent(parent_filename: str) -> int:
    cfg = PARENT_CONFIGS.get(parent_filename)
    if cfg is None:
        raise SystemExit(f"No config for parent: {parent_filename}. Add it to PARENT_CONFIGS.")
    parent_path = ROOT / parent_filename
    if not parent_path.exists():
        raise SystemExit(f"Parent HTML not found: {parent_path}")

    children = discover_children(parent_filename)
    if not children:
        raise SystemExit(f"No published FR/PSEO children found for {parent_filename}")

    html = parent_path.read_text(encoding="utf-8")
    span = find_fr_block(html)
    if span is None:
        raise SystemExit(f"No <div id='auto-further-reading'> block in {parent_filename}")
    start, end = span

    # Drop any stale <!-- fr-manual --> comment immediately before the block,
    # so repeated runs don't stack duplicates.
    pre = re.sub(r"<!--\s*fr-manual[^>]*-->\s*$", "", html[:start])
    new_html = pre + render_block(cfg, children) + html[end:]
    parent_path.write_text(new_html, encoding="utf-8")
    return len(children)


def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        print(__doc__)
        return 0
    if argv[1] == "--list":
        for k in PARENT_CONFIGS:
            print(k)
        return 0
    targets = list(PARENT_CONFIGS) if argv[1] == "--all" else [argv[1]]
    for tgt in targets:
        if not tgt.endswith(".html"):
            tgt += ".html"
        n = rewrite_parent(tgt)
        print(f"  {tgt}: rewrote FR block ({n} cards)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
