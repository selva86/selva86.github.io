#!/usr/bin/env python3
"""Generate programmatic SEO (PSEO) pages from templates and data files.

Usage:
    python generate_pseo.py                  # Generate all pages
    python generate_pseo.py --dry-run        # Preview without writing
    python generate_pseo.py --type vs        # Generate only "vs" pages
"""

import os
import json
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
TEMPLATES_DIR = os.path.join(SCRIPT_DIR, "pseo-templates")
DATA_DIR = os.path.join(SCRIPT_DIR, "pseo-data")
POSTS_DIR = os.path.join(REPO_ROOT, "posts")


def load_template(name):
    path = os.path.join(TEMPLATES_DIR, f"{name}-template.md")
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def load_data(name):
    path = os.path.join(DATA_DIR, f"{name}.json")
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_vs_pages(dry_run=False):
    """Generate comparison ('vs') pages from vs-comparisons.json."""
    template = load_template("vs")
    entries = load_data("vs-comparisons")

    generated = []
    skipped = []

    for entry in entries:
        slug = entry["slug"]
        out_path = os.path.join(POSTS_DIR, f"{slug}.md")

        if os.path.exists(out_path):
            skipped.append(slug)
            continue

        content = template
        content = content.replace("{{A}}", entry["a"])
        content = content.replace("{{B}}", entry["b"])
        content = content.replace("{{CATEGORY}}", entry["category"])
        content = content.replace("{{SLUG}}", slug)
        content = content.replace("{{PARENT}}", entry.get("parent", ""))

        if dry_run:
            print(f"  [dry-run] Would create: posts/{slug}.md")
            print(f"            Title: {entry['a']} vs {entry['b']}: Which R {entry['category']} Tool Should You Use?")
        else:
            os.makedirs(POSTS_DIR, exist_ok=True)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  Created: posts/{slug}.md")

        generated.append(slug)

    return generated, skipped


GENERATORS = {
    "vs": generate_vs_pages,
}


def main():
    parser = argparse.ArgumentParser(description="Generate PSEO pages from templates")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files")
    parser.add_argument("--type", choices=list(GENERATORS.keys()), help="Generate only this type")
    args = parser.parse_args()

    types_to_run = [args.type] if args.type else list(GENERATORS.keys())

    total_generated = 0
    total_skipped = 0

    for page_type in types_to_run:
        print(f"\n=== Generating '{page_type}' pages ===")
        gen_func = GENERATORS[page_type]
        generated, skipped = gen_func(dry_run=args.dry_run)
        total_generated += len(generated)
        total_skipped += len(skipped)
        if skipped:
            print(f"  Skipped {len(skipped)} existing: {', '.join(skipped[:5])}")

    print(f"\nDone. Generated: {total_generated}, Skipped: {total_skipped}")
    if args.dry_run:
        print("(Dry run — no files written)")


if __name__ == '__main__':
    main()
