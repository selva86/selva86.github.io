#!/usr/bin/env python3
"""
Parse the r-statistics.co curriculum markdown and generate curriculum-status.json.

Reads:  Plan/r-statistics-co-curriculum-v7-ctr-and-meta.md
Writes: curriculum-status.json (site root)
"""

import json
import re
import os
from datetime import date

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_ROOT = os.path.dirname(SCRIPT_DIR)
CURRICULUM_FILE = os.path.join(SITE_ROOT, "..", "Plan", "r-statistics-co-curriculum-v7-ctr-and-meta.md")
OUTPUT_FILE = os.path.join(SITE_ROOT, "curriculum-status.json")

# Friendly names for top-level paths
PATH_NAMES = {
    "/learn-r/": "Learn R",
    "/data-wrangling/": "Data Wrangling",
    "/visualization/": "Visualization",
    "/statistics/": "Statistics",
    "/time-series/": "Time Series",
    "/machine-learning/": "Machine Learning",
    "/advanced-r/": "Advanced R",
    "/reporting/": "Reporting",
    "/specializations/": "Specializations",
}


def parse_table_row(line, has_fr_core):
    """Parse a markdown table row into a post dict.

    Tables come in two formats:
      7-col: | Type | # | SEO Title | Vol | FR→Core | CTR Title | Meta Desc |
      6-col: | Type | # | SEO Title | Vol | CTR Title | Meta Desc |
    """
    # Split on | and strip; first and last are empty from leading/trailing |
    parts = [p.strip() for p in line.split("|")]
    # Remove empty first/last
    parts = [p for p in parts if p != "" or parts.index(p) not in (0, len(parts) - 1)]
    # Actually, just split and drop first empty, keep the rest
    raw = line.split("|")
    # raw[0] is '', raw[-1] is '' or whitespace
    cells = [c.strip() for c in raw[1:-1]]

    if len(cells) < 6:
        return None

    type_str = cells[0]  # e.g. "[C]", "[FR]", "[EX]"
    post_id = cells[1]
    seo_title = cells[2]
    volume = cells[3]

    if has_fr_core:
        fr_core_raw = cells[4] if len(cells) > 4 else "—"
        ctr_title = cells[5] if len(cells) > 5 else ""
        meta_desc = cells[6] if len(cells) > 6 else ""
    else:
        fr_core_raw = "—"
        ctr_title = cells[4] if len(cells) > 4 else ""
        meta_desc = cells[5] if len(cells) > 5 else ""

    # Extract type
    type_match = re.search(r'\[(C|FR|EX)\]', type_str)
    if not type_match:
        return None
    post_type = type_match.group(1)

    # Parse fr_core
    fr_core = None
    if post_type in ("FR", "EX") and fr_core_raw and fr_core_raw != "—":
        # format: "→ 1.1.7" or "→ DB2"
        arrow_match = re.search(r'→\s*(.+)', fr_core_raw)
        if arrow_match:
            fr_core = arrow_match.group(1).strip()

    return {
        "id": post_id.strip(),
        "type": post_type,
        "seo_title": seo_title.strip(),
        "ctr_title": ctr_title.strip(),
        "meta_description": meta_desc.strip(),
        "volume": volume.strip(),
        "fr_core": fr_core,
        "status": "not_started",
        "published_title": None,
        "slug": None,
        "url": None,
        "published_date": None,
        "word_count": None,
        "interactive_blocks": None,
        "in_sidebar": False,
    }


def extract_path_slug(path_line):
    """Extract path from '## PATH: /xxx/' line."""
    m = re.search(r'/([^/]+)/', path_line)
    if m:
        return f"/{m.group(1)}/"
    return None


def extract_sub_path_info(line):
    """Extract sub-path and name from '### /xxx/yyy/ — Description' line."""
    m = re.match(r'^###\s+(/.+?/)\s*—\s*(.+)', line)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    # Some lines might just have the path without em-dash
    m = re.match(r'^###\s+(/.+?/)', line)
    if m:
        return m.group(1).strip(), ""
    return None, None


def detect_table_format(header_line):
    """Check if header has FR→Core column."""
    return "FR→Core" in header_line or "FR→" in header_line


def generate_fr_id(post_type, sub_path, fr_counter):
    """Generate an ID for FR posts with — as their number."""
    # Use sub_path numbering prefix based on existing posts
    return f"FR-{sub_path}-{fr_counter}"


def fr_short_token(sub_path):
    """Collision-free short token for a generated FR id.

    Ids must be globally unique: a post's frontmatter carries only a scalar
    curriculum_id, so anything that consumes the tracker can key on the id
    alone.  Truncating just the LAST sub-path segment to 4 chars collapsed
    distinct sub-paths onto one token and minted duplicate ids:

        /learn-r/internals/        and /visualization/interactive/     -> inte
        /statistics/regression/    and /machine-learning/regression-models/ -> regr
        /statistics/meta-analysis/ and /advanced-r/metaprogramming/    -> meta
        /learn-r/data-ethics/      and /data-wrangling/databases/      -> data

    Because the per-sub-path counter restarts at 1 in each, both sides produced
    FR-inte-1, FR-regr-1, ...

    Truncating is what broke it, so this does not truncate: the token is the
    whole sub_path with separators flattened. sub_path keys are unique, so the
    token is unique by construction - no future pair of sections can collide
    the way /visualization/ggplot2-foundations/ and .../ggplot2-handbook/ would
    under any 4-character scheme.
    """
    segs = [s for s in sub_path.strip("/").split("/") if s]
    if not segs:
        return "misc"
    return "-".join(segs)


def main():
    with open(CURRICULUM_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    paths = {}
    current_path = None
    current_sub_path = None
    current_sub_name = None
    has_fr_core = True
    in_table = False
    fr_counters = {}  # per sub_path counter for FR posts with "—" id

    for i, raw_line in enumerate(lines):
        line = raw_line.rstrip("\n").rstrip("\r")

        # Detect top-level path
        if line.startswith("## PATH:"):
            path_slug = extract_path_slug(line)
            if path_slug:
                current_path = path_slug
                if current_path not in paths:
                    paths[current_path] = {
                        "name": PATH_NAMES.get(current_path, current_path.strip("/")),
                        "sub_paths": {},
                    }
                current_sub_path = None
                in_table = False
            continue

        # Detect sub-path
        if line.startswith("### /"):
            sub_path, sub_name = extract_sub_path_info(line)
            if sub_path and current_path:
                current_sub_path = sub_path
                current_sub_name = sub_name
                # Infer parent path from sub_path
                parent = "/" + sub_path.strip("/").split("/")[0] + "/"
                if parent not in paths:
                    paths[parent] = {
                        "name": PATH_NAMES.get(parent, parent.strip("/")),
                        "sub_paths": {},
                    }
                current_path = parent
                if current_sub_path not in paths[current_path]["sub_paths"]:
                    paths[current_path]["sub_paths"][current_sub_path] = {
                        "name": current_sub_name,
                        "posts": [],
                    }
                fr_counters[current_sub_path] = 0
                in_table = False
            continue

        # Detect table header
        if line.strip().startswith("| Type"):
            has_fr_core = detect_table_format(line)
            in_table = True
            continue

        # Skip separator lines
        if in_table and re.match(r'^\|[-\s|]+\|$', line.strip()):
            continue

        # Parse table data rows
        if in_table and line.strip().startswith("|") and current_sub_path:
            # Check it's a data row (contains [C], [FR], or [EX])
            if re.search(r'\[(C|FR|EX)\]', line):
                post = parse_table_row(line, has_fr_core)
                if post:
                    # Handle FR posts with "—" as id
                    if post["id"] == "—":
                        fr_counters[current_sub_path] += 1
                        # Build a more meaningful ID from sub_path
                        # e.g. /learn-r/fundamentals/ → FR-learn-r-fundamentals-1
                        short = fr_short_token(current_sub_path)
                        post["id"] = f"FR-{short}-{fr_counters[current_sub_path]}"

                    paths[current_path]["sub_paths"][current_sub_path]["posts"].append(post)
            else:
                # Not a data row, end of table
                in_table = False
            continue

        # If we hit a non-table line while in_table, end the table
        if in_table and not line.strip().startswith("|"):
            in_table = False

    # Count totals
    total_posts = 0
    path_counts = {}
    for path_key, path_data in paths.items():
        count = 0
        for sp_key, sp_data in path_data["sub_paths"].items():
            count += len(sp_data["posts"])
        path_counts[path_key] = count
        total_posts += count

    # Ids must be globally unique - every consumer (sync_registries,
    # batch_tutorials, apply_title_rewrites) keys on the id alone. Report any
    # that are not, and separate the two kinds: the same planned post
    # cross-listed under two sub-paths (identical seo_title, harmless) from two
    # DIFFERENT posts sharing an id (a defect in the curriculum markdown -
    # publishing one will stamp the other).
    id_rows = {}
    for path_key, path_data in paths.items():
        for sp_key, sp_data in path_data["sub_paths"].items():
            for post in sp_data["posts"]:
                id_rows.setdefault(post["id"], []).append((sp_key, post["seo_title"]))
    collisions = {i: r for i, r in id_rows.items()
                  if len(r) > 1 and len({t for _, t in r}) > 1}
    crosslisted = {i: r for i, r in id_rows.items()
                   if len(r) > 1 and i not in collisions}
    if crosslisted:
        print(f"\nNote: {len(crosslisted)} id(s) cross-listed under two sub-paths "
              f"(same post, safe): {', '.join(sorted(crosslisted))}")
    if collisions:
        print(f"\nWARNING: {len(collisions)} id(s) shared by DIFFERENT posts. "
              f"Renumber them in the curriculum markdown - publishing one will "
              f"mark the other published too:")
        for cid, rows in sorted(collisions.items()):
            print(f"  {cid}")
            for sp_key, title in rows:
                print(f"      {sp_key}  {title[:70]}")

    # Mark published posts
    published_count = 0

    # 1. Post 1.1.4 in /learn-r/fundamentals/
    for post in paths.get("/learn-r/", {}).get("sub_paths", {}).get("/learn-r/fundamentals/", {}).get("posts", []):
        if post["id"] == "1.1.4":
            post["status"] = "published"
            post["slug"] = "R-Syntax-101-Write-Your-First-Working-Script"
            post["url"] = "/R-Syntax-101-Write-Your-First-Working-Script.html"
            post["published_date"] = "2026-03-28"
            post["in_sidebar"] = True
            post["published_title"] = post["ctr_title"] or post["seo_title"]
            published_count += 1
            break

    # 2. Post with seo_title containing "R Basic Syntax" in /learn-r/fundamentals/
    #    (if this matches a different post than 1.1.4, mark it too)
    for post in paths.get("/learn-r/", {}).get("sub_paths", {}).get("/learn-r/fundamentals/", {}).get("posts", []):
        if "R Basic Syntax" in post["seo_title"] and post["status"] != "published":
            post["status"] = "published"
            post["slug"] = "R-Basic-Syntax-Beginners-Guide"
            post["url"] = "/R-Basic-Syntax-Beginners-Guide.html"
            post["published_date"] = "2026-03-27"
            post["in_sidebar"] = True
            post["published_title"] = post["ctr_title"] or post["seo_title"]
            published_count += 1
            break

    # 3. First [C] post in /data-wrangling/dplyr/ with seo_title containing "dplyr"
    for post in paths.get("/data-wrangling/", {}).get("sub_paths", {}).get("/data-wrangling/dplyr/", {}).get("posts", []):
        if post["type"] == "C" and "dplyr" in post["seo_title"].lower():
            post["status"] = "published"
            post["slug"] = "Data-Wrangling-With-dplyr"
            post["url"] = "/Data-Wrangling-With-dplyr.html"
            post["published_date"] = "2026-03-27"
            post["in_sidebar"] = True
            post["published_title"] = post["ctr_title"] or post["seo_title"]
            published_count += 1
            break

    # Build output
    output = {
        "meta": {
            "generated": date.today().isoformat(),
            "total_posts": total_posts,
            "published": published_count,
            "curriculum_source": "Plan/r-statistics-co-curriculum-v7-ctr-and-meta.md",
        },
        "paths": paths,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Print summary
    print(f"Curriculum Status JSON generated: {OUTPUT_FILE}")
    print(f"Total posts: {total_posts}")
    print(f"Published: {published_count}")
    print()
    print("Posts per path:")
    for path_key in sorted(path_counts.keys()):
        name = paths[path_key]["name"]
        count = path_counts[path_key]
        sub_count = len(paths[path_key]["sub_paths"])
        print(f"  {path_key:<25} {name:<25} {count:>4} posts across {sub_count} sub-paths")

    # Print published posts
    print()
    print("Published posts:")
    for path_key, path_data in paths.items():
        for sp_key, sp_data in path_data["sub_paths"].items():
            for post in sp_data["posts"]:
                if post["status"] == "published":
                    print(f"  [{post['id']}] {post['seo_title'][:70]}...")
                    print(f"         -> {post['url']}")


if __name__ == "__main__":
    main()
