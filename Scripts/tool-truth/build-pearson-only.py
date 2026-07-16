"""Tool-only build subset for the pearson-critical-values-table ship.

build.py --only targets a POST; there is no tool equivalent, and a full build
rewrites ~1300 pages of unrelated churn. This drives just the three steps a new
tool needs:
  1. patch_tool_pages  -> inject masthead + sidebar + footer into tools/*.html
  2. gen_tools_landing -> refresh the /tools/ card grid with the new C3META card
  3. gen_og_images     -> render the new tool's OG card
Only the pearson files are staged afterwards; incidental churn is discarded.
"""
import os, sys, io, contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(REPO, '_build'))
os.chdir(REPO)

import build as B

sections = B.load_sidebar_sections()
B.ensure_vendor_assets()
final_paths = B.minify_assets(force=False)
asset_hrefs, _ = B.compute_asset_hrefs(final_paths)
print('sidebar sections:', len(sections), '| assets hashed:', len(asset_hrefs))

from gen_tools_landing import render as render_tools_landing
render_tools_landing()
print('tools landing: regenerated')

B.patch_tool_pages(sections, asset_hrefs)
print('tool pages: chrome injected')

try:
    from gen_og_images import main as render_og
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        render_og(['gen_og_images.py'])
    print('OG images:', buf.getvalue().count('->'), 'cards')
except Exception as e:
    print('WARN: OG regen failed:', e)
