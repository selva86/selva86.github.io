#!/usr/bin/env python3
"""
Sync programmatic-seo.json -> links.json

Adds auto_link terms and further_reading entries from the PSEO registry
into links.json. Never overwrites existing entries — only adds missing ones.

Usage: python _build/sync_pseo_to_links.py
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PSEO_PATH = os.path.join(PROJECT_ROOT, "www", "programmatic-seo.json")
LINKS_PATH = os.path.join(PROJECT_ROOT, "www", "links.json")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def build_existing_terms_index(links):
    """Build a map of term -> (url, entry_index) for all existing auto_links."""
    index = {}
    for i, entry in enumerate(links.get("auto_links", [])):
        for term in entry.get("terms", []):
            index[term] = {"url": entry["url"], "entry_index": i}
    return index


def build_existing_fr_index(links):
    """Build a map of (parent_url, curriculum_id) -> entry for further_reading."""
    index = {}
    for parent_url, entries in links.get("further_reading", {}).items():
        for entry in entries:
            key = (parent_url, entry.get("curriculum_id", ""))
            index[key] = entry
    return index


def sync():
    if not os.path.exists(PSEO_PATH):
        print(f"ERROR: {PSEO_PATH} not found")
        sys.exit(1)
    if not os.path.exists(LINKS_PATH):
        print(f"ERROR: {LINKS_PATH} not found")
        sys.exit(1)

    pseo = load_json(PSEO_PATH)
    links = load_json(LINKS_PATH)

    # Ensure sections exist
    if "auto_links" not in links:
        links["auto_links"] = []
    if "further_reading" not in links:
        links["further_reading"] = {}

    terms_index = build_existing_terms_index(links)
    fr_index = build_existing_fr_index(links)

    stats = {
        "terms_added": 0,
        "terms_skipped": 0,
        "terms_conflict": 0,
        "fr_added": 0,
        "fr_skipped": 0,
        "entries_added": 0,
    }
    conflicts = []

    for series in pseo.get("series", []):
        parent_posts = series.get("parent_posts", [])

        for post in series.get("posts", []):
            post_id = post["id"]
            post_title = post["title"]
            post_url = post.get("url") or post.get("slug") or f"{post_id.replace('pseo-', '')}.html"
            post_status = post.get("status", "not_published")
            auto_link_terms = post.get("auto_link_terms", [])
            case_sensitive = post.get("case_sensitive", True)

            # --- Auto-link terms ---
            # Check which terms already exist
            new_terms = []
            has_conflict = False
            for term in auto_link_terms:
                if term in terms_index:
                    existing_url = terms_index[term]["url"]
                    if existing_url != post_url:
                        conflicts.append(
                            f"  CONFLICT: term '{term}' -> existing '{existing_url}' vs PSEO '{post_url}'"
                        )
                        stats["terms_conflict"] += 1
                        has_conflict = True
                    else:
                        stats["terms_skipped"] += 1
                else:
                    new_terms.append(term)

            if new_terms:
                # Check if there's already an auto_link entry with this URL
                existing_entry = None
                for entry in links["auto_links"]:
                    if entry["url"] == post_url:
                        existing_entry = entry
                        break

                if existing_entry:
                    # Add missing terms to existing entry
                    for term in new_terms:
                        if term not in existing_entry["terms"]:
                            existing_entry["terms"].append(term)
                            terms_index[term] = {"url": post_url, "entry_index": -1}
                            stats["terms_added"] += 1
                        else:
                            stats["terms_skipped"] += 1
                else:
                    # Create new auto_link entry
                    new_entry = {
                        "url": post_url,
                        "title": post_title,
                        "terms": new_terms,
                        "case_sensitive": case_sensitive,
                        "max_per_page": 1,
                        "status": post_status,
                    }
                    links["auto_links"].append(new_entry)
                    for term in new_terms:
                        terms_index[term] = {
                            "url": post_url,
                            "entry_index": len(links["auto_links"]) - 1,
                        }
                    stats["terms_added"] += len(new_terms)
                    stats["entries_added"] += 1

            # --- Further reading entries ---
            for parent_url in parent_posts:
                fr_key = (parent_url, post_id)

                if fr_key in fr_index:
                    stats["fr_skipped"] += 1
                    continue

                # Check if this post is already listed under this parent (by URL)
                already_listed = False
                if parent_url in links["further_reading"]:
                    for fr_entry in links["further_reading"][parent_url]:
                        if fr_entry.get("url") == post_url or fr_entry.get("curriculum_id") == post_id:
                            already_listed = True
                            stats["fr_skipped"] += 1
                            break

                if already_listed:
                    continue

                # Add FR entry
                fr_entry = {
                    "url": post_url,
                    "title": post_title,
                    "status": post_status,
                    "curriculum_id": post_id,
                }

                if parent_url not in links["further_reading"]:
                    links["further_reading"][parent_url] = []

                links["further_reading"][parent_url].append(fr_entry)
                fr_index[fr_key] = fr_entry
                stats["fr_added"] += 1

    # Save updated links.json
    save_json(LINKS_PATH, links)

    # Print summary
    print("=" * 50)
    print("PSEO -> links.json sync complete")
    print("=" * 50)
    print(f"  Auto-link terms added:    {stats['terms_added']}")
    print(f"  Auto-link terms skipped:  {stats['terms_skipped']} (already exist)")
    print(f"  Auto-link entries created: {stats['entries_added']}")
    print(f"  FR entries added:         {stats['fr_added']}")
    print(f"  FR entries skipped:       {stats['fr_skipped']} (already exist)")
    print(f"  Conflicts found:          {stats['terms_conflict']}")

    if conflicts:
        print()
        print("CONFLICTS (same term, different URL):")
        for c in conflicts:
            print(c)

    print()
    print(f"Saved: {LINKS_PATH}")


if __name__ == "__main__":
    sync()
