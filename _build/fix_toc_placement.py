#!/usr/bin/env python3
"""Fix the TOC column placement - move it inside the .row div."""

import glob
import re

files = glob.glob('*.html')
fixed = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    if 'toc-sidebar' not in content:
        continue

    original = content

    # Fix pattern: the TOC is outside the row div
    # Current (broken):
    #   </div>\n      </div>\n\n   <toc block>   </div>\n\n      <div class="footer">
    # Should be:
    #   </div>\n   <toc block>   \n      </div>\n\n      <div class="footer">

    # Remove the misplaced TOC block and its extra closing div
    toc_block = '''        <div class="col-sm-2 hidden-xs" id="toc-sidebar">
          <div id="toc-wrapper">
            <h5 class="toc-title">On this page</h5>
            <ul class="list-unstyled" id="toc"></ul>
          </div>
        </div>'''

    # Pattern: </div>\n      </div>\n\n  <toc_block>\n      </div>\n\n      <div class="footer">
    # Replace with: </div>\n  <toc_block>\n      </div>\n\n      <div class="footer">
    bad_pattern = re.compile(
        r'(</div>\s*)'          # content div close
        r'(</div>\s*)'          # row div close
        r'(\s*<div class="col-sm-2 hidden-xs" id="toc-sidebar">.*?</div>\s*</div>\s*)'  # misplaced toc
        r'(</div>\s*)'          # extra closing div from script
        r'(<div class="footer">)',
        re.DOTALL
    )

    match = bad_pattern.search(content)
    if match:
        # Reconstruct: content close, then toc, then row close, then footer
        content = content[:match.start()] + \
            match.group(1) + \
            '\n' + toc_block + '\n' + \
            match.group(2) + \
            '\n      ' + match.group(5) + \
            content[match.end():]

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        fixed += 1

print(f'Fixed TOC placement in {fixed} files.')
