#!/usr/bin/env python3
"""Update all legacy HTML files with new Quarto-style sidebar, right-side TOC, and css/main.css."""

import glob
import re

NEW_SIDEBAR = '''        <div class="col-xs-12 col-sm-3" id="nav">
          <div id="sidebar-nav">
            <ul class="sidebar-menu list-unstyled">

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> Tutorial
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="R-Tutorial.html">R Tutorial</a></li>
                  <li><a href="R-Basic-Syntax-Beginners-Guide.html">R Basic Syntax</a></li>
                  <li><a href="R-Syntax-101-Write-Your-First-Working-Script.html">R Syntax 101</a></li>
                  <li><a href="Data-Wrangling-With-dplyr.html">Data Wrangling with dplyr</a></li>
                </ul>
              </li>

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> ggplot2
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="ggplot2-Tutorial-With-R.html">ggplot2 Short Tutorial</a></li>
                  <li><a href="Complete-Ggplot2-Tutorial-Part1-With-R-Code.html">ggplot2 Tutorial 1 - Intro</a></li>
                  <li><a href="Complete-Ggplot2-Tutorial-Part2-Customizing-Theme-With-R-Code.html">ggplot2 Tutorial 2 - Theme</a></li>
                  <li><a href="Top50-Ggplot2-Visualizations-MasterList-R-Code.html">ggplot2 Tutorial 3 - Masterlist</a></li>
                  <li><a href="ggplot2-cheatsheet.html">ggplot2 Quickref</a></li>
                </ul>
              </li>

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> Foundations
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="Linear-Regression.html">Linear Regression</a></li>
                  <li><a href="Statistical-Tests-in-R.html">Statistical Tests</a></li>
                  <li><a href="Missing-Value-Treatment-With-R.html">Missing Value Treatment</a></li>
                  <li><a href="Outlier-Treatment-With-R.html">Outlier Analysis</a></li>
                  <li><a href="Variable-Selection-and-Importance-With-R.html">Feature Selection</a></li>
                  <li><a href="Model-Selection-in-R.html">Model Selection</a></li>
                  <li><a href="Logistic-Regression-With-R.html">Logistic Regression</a></li>
                  <li><a href="Environments.html">Advanced Linear Regression</a></li>
                </ul>
              </li>

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> Advanced Regression
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="adv-regression-models.html">Advanced Regression Models</a></li>
                </ul>
              </li>

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> Time Series
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="Time-Series-Analysis-With-R.html">Time Series Analysis</a></li>
                  <li><a href="Time-Series-Forecasting-With-R.html">Time Series Forecasting</a></li>
                  <li><a href="Time-Series-Forecasting-With-R-part2.html">More Time Series Forecasting</a></li>
                </ul>
              </li>

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> High Performance
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="Parallel-Computing-With-R.html">Parallel Computing</a></li>
                  <li><a href="Strategies-To-Improve-And-Speedup-R-Code.html">Speedup R Code</a></li>
                </ul>
              </li>

              <li class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-chevron">&#9656;</span> Useful Techniques
                </div>
                <ul class="sidebar-section-items list-unstyled">
                  <li><a href="Association-Mining-With-R.html">Association Mining</a></li>
                  <li><a href="Multi-Dimensional-Scaling-With-R.html">Multi Dimensional Scaling</a></li>
                  <li><a href="Profiling.html">Optimization</a></li>
                  <li><a href="Information-Value-With-R.html">InformationValue Package</a></li>
                </ul>
              </li>

            </ul>

            <div class="sidebar-subscribe">
              <p>Stay up-to-date. <a href="https://docs.google.com/forms/d/1xkMYkLNFU9U39Dd8S_2JC0p8B5t6_Yq6zUQjanQQJpY/viewform">Subscribe!</a></p>
              <p><a href="https://docs.google.com/forms/d/13GrkCFcNa-TOIllQghsz2SIEbc-YqY9eJX02B19l5Ow/viewform">Chat!</a></p>
            </div>
          </div>
        </div>

'''

RIGHT_TOC = '''        <div class="col-sm-2 hidden-xs" id="toc-sidebar">
          <div id="toc-wrapper">
            <h5 class="toc-title">On this page</h5>
            <ul class="list-unstyled" id="toc"></ul>
          </div>
        </div>
'''

files = glob.glob('*.html')
updated = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    # Skip files that already have the new sidebar
    if 'sidebar-nav' in content:
        continue

    # Skip if no old sidebar pattern
    if 'id="nav"' not in content or 'class="well"' not in content:
        continue

    original = content

    # 1. Replace sidebar using regex (handles whitespace variations)
    # Match from <div ... id="nav"> to just before <div id="content"
    pattern = r'(<div class="col-xs-12 col-sm-3" id="nav">)\s*.*?(\s*</div>\s*<div id="content")'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f'  SKIP (no sidebar match): {f}')
        continue

    # Replace the sidebar block
    content = content[:match.start()] + NEW_SIDEBAR + '        <div id="content"' + content[match.end():]

    # 2. Change col-sm-8 to col-sm-7 and remove pull-right
    content = content.replace(
        'class="col-xs-12 col-sm-8 pull-right"',
        'class="col-xs-12 col-sm-7"'
    )

    # 3. Add right-side TOC column before closing </div> of the row
    # Find the closing </div> that ends the content column, then add TOC after it
    # The content div closes, then we need the TOC before the row closes
    # Pattern: find </div>\s*</div>\s*<div class="footer">
    content = re.sub(
        r'(</div>\s*</div>\s*)(<div class="footer">)',
        r'\1' + RIGHT_TOC + r'      </div>\n\n      \2',
        content,
        count=1
    )

    # 4. Add css/main.css link if not present
    if 'css/main.css' not in content:
        content = content.replace(
            '<link href="www/highlight.css" rel="stylesheet">',
            '<link href="www/highlight.css" rel="stylesheet">\n    <link href="css/main.css?v=2" rel="stylesheet">',
            1
        )

    # 5. Cache-bust toc.js
    content = content.replace(
        '<script src="www/toc.js"></script>',
        '<script src="www/toc.js?v=2"></script>'
    )

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        updated += 1
        print(f'Updated: {f}')

print(f'\nDone. {updated} files updated.')
