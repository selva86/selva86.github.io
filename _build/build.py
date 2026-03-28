#!/usr/bin/env python3
"""Build script for r-statistics.co - generates full HTML pages from content fragments."""

import os
import re
import datetime

# Paths relative to repo root
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
TEMPLATE_PATH = os.path.join(SCRIPT_DIR, "template.html")
POSTS_DIR = os.path.join(REPO_ROOT, "_posts")
SITEMAP_PATH = os.path.join(REPO_ROOT, "sitemap.xml")

MATHJAX_BLOCK = """
  <script type="text/x-mathjax-config">
    MathJax.Hub.Config({
      tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']]}
    });
  </script>
  <script type="text/javascript"
    src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
  </script>
"""

DEFAULT_DESCRIPTION = "R Language Tutorials for Advanced Statistics"
DEFAULT_KEYWORDS = "R, Tutorial, Machine learning, Statistics, Data Mining, Analytics, Data science, Linear Regression, Logistic Regression, Time series, Forecasting"


def parse_front_matter(text):
    """Parse YAML-like front matter between --- delimiters. Returns (metadata_dict, content)."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not match:
        raise ValueError("No front matter found. Posts must start with ---")
    meta_text = match.group(1)
    content = text[match.end():]
    meta = {}
    for line in meta_text.strip().split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            meta[key.strip()] = val.strip()
    return meta, content


def build_post(template, post_path):
    """Build a single post from its source file."""
    with open(post_path, 'r', encoding='utf-8') as f:
        raw = f.read()

    meta, content = parse_front_matter(raw)

    title = meta.get('title', 'Untitled')
    mathjax = meta.get('mathjax', 'true').lower() != 'false'
    description = meta.get('description', DEFAULT_DESCRIPTION)
    keywords = meta.get('keywords', DEFAULT_KEYWORDS)

    html = template
    html = html.replace('{{TITLE}}', title)
    html = html.replace('{{DESCRIPTION}}', description)
    html = html.replace('{{KEYWORDS}}', keywords)
    html = html.replace('{{CONTENT}}', content)
    html = html.replace('{{MATHJAX}}', MATHJAX_BLOCK if mathjax else '')

    return html


def update_sitemap(filenames):
    """Add new entries to sitemap.xml if they don't already exist."""
    if not os.path.exists(SITEMAP_PATH):
        return

    with open(SITEMAP_PATH, 'r', encoding='utf-8') as f:
        sitemap = f.read()

    today = datetime.date.today().isoformat()
    added = []

    for fname in filenames:
        url = f"http://r-statistics.co/{fname}"
        if url not in sitemap:
            entry = f"""  <url>
    <loc>{url}</loc>
    <changefreq>monthly</changefreq>
    <lastmod>{today}</lastmod>
    <priority>0.8</priority>
  </url>
"""
            sitemap = sitemap.replace('</urlset>', entry + '</urlset>')
            added.append(fname)

    if added:
        with open(SITEMAP_PATH, 'w', encoding='utf-8') as f:
            f.write(sitemap)
        for fname in added:
            print(f"  Sitemap: added {fname}")


def main():
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    if not os.path.exists(POSTS_DIR):
        print("No _posts/ directory found.")
        return

    post_files = [f for f in os.listdir(POSTS_DIR) if f.endswith('.html')]
    if not post_files:
        print("No posts found in _posts/")
        return

    built = []
    for post_file in sorted(post_files):
        post_path = os.path.join(POSTS_DIR, post_file)
        output_path = os.path.join(REPO_ROOT, post_file)
        html = build_post(template, post_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Built: {post_file}")
        built.append(post_file)

    update_sitemap(built)
    print(f"\nDone. {len(built)} page(s) built.")


if __name__ == '__main__':
    main()
