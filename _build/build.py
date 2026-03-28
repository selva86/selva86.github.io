#!/usr/bin/env python3
"""Build script for r-statistics.co - generates full HTML pages from content fragments.

Supports two source formats:
  - _posts/*.html  — HTML fragments with YAML-like front matter (original format)
  - _posts/*.html with webr: true — pages with interactive WebR code blocks
"""

import os
import re
import datetime
import html as html_module

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

WEBR_HEAD_BLOCK = """
    <!-- WebR Interactive R Code -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/default.min.css">
    <style>
      .webr-container { margin: 15px 0; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
      .webr-editor-wrap { position: relative; }
      .webr-editor .CodeMirror { height: auto; min-height: 60px; font-size: 14px; font-family: 'Inconsolata', 'Consolas', monospace; line-height: 1.5; border-bottom: 1px solid #eee; }
      .webr-buttons { padding: 6px 10px; background: #f8f8f8; border-bottom: 1px solid #eee; display: flex; gap: 6px; align-items: center; }
      .webr-run-btn { background: #4582ec; color: #fff; border: none; padding: 4px 14px; border-radius: 3px; font-size: 13px; cursor: pointer; }
      .webr-run-btn:hover { background: #3a6fd8; }
      .webr-run-btn:disabled { background: #999; cursor: wait; }
      .webr-reset-btn { background: #fff; color: #555; border: 1px solid #ccc; padding: 4px 14px; border-radius: 3px; font-size: 13px; cursor: pointer; }
      .webr-reset-btn:hover { background: #f0f0f0; }
      .webr-output { margin: 0; padding: 10px 12px; background: #1e1e1e; color: #d4d4d4; font-family: 'Inconsolata', 'Consolas', monospace; font-size: 13px; line-height: 1.5; min-height: 20px; max-height: 400px; overflow-y: auto; white-space: pre-wrap; display: none; }
      .webr-output.has-content { display: block; }
      .webr-plot-output { text-align: center; padding: 10px; background: #fff; display: none; }
      .webr-plot-output.has-content { display: block; }
      .webr-plot-output img { max-width: 100%; height: auto; }
      .webr-status { padding: 8px 12px; background: #fff3cd; color: #856404; font-size: 13px; text-align: center; display: none; }
      .webr-status.loading { display: block; }
      .webr-loading-banner { padding: 12px; background: #e8f4f8; color: #0c5460; text-align: center; margin-bottom: 20px; border-radius: 4px; font-size: 14px; }
      /* Mermaid diagrams */
      .mermaid { margin: 15px 0; text-align: center; }
    </style>
"""

WEBR_BODY_BLOCK = """
  <!-- WebR Engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/r/r.min.js"></script>
  <script type="module">
    import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';

    const webR = new WebR();
    let webRReady = false;
    const editors = [];

    // Show loading banner
    const banner = document.querySelector('.webr-loading-banner');

    async function initWebR() {
      await webR.init();
      webRReady = true;
      if (banner) {
        banner.textContent = 'R environment ready! You can now run code.';
        banner.style.background = '#d4edda';
        banner.style.color = '#155724';
        setTimeout(() => banner.style.display = 'none', 3000);
      }
      // Enable all run buttons
      document.querySelectorAll('.webr-run-btn').forEach(btn => {
        btn.disabled = false;
        btn.textContent = '\\u25b6 Run';
      });
    }

    initWebR();

    // Initialize CodeMirror editors
    document.querySelectorAll('.webr-editor').forEach((el, idx) => {
      const code = el.textContent;
      el.textContent = '';
      const cm = CodeMirror(el, {
        value: code,
        mode: 'r',
        lineNumbers: true,
        viewportMargin: Infinity,
        tabSize: 2
      });
      editors.push({ cm, originalCode: code, el });
    });

    // Run R code
    window.runWebR = async function(btn) {
      if (!webRReady) return;
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
      const code = editors[idx].cm.getValue();

      btn.disabled = true;
      btn.textContent = 'Running...';
      outputEl.textContent = '';
      outputEl.classList.remove('has-content');
      if (plotEl) {
        plotEl.innerHTML = '';
        plotEl.classList.remove('has-content');
      }

      try {
        // Capture plots
        await webR.evalRVoid('if(dev.cur() > 1) dev.off()');
        await webR.evalRVoid('png(tf <- tempfile(fileext=".png"), width=700, height=500, res=100)');

        const result = await webR.evalR(code, { captureStreams: true, captureConditions: true, captureGraphics: false });

        // Get text output
        let output = '';
        if (result.output) {
          for (const line of result.output) {
            if (line.type === 'stdout') output += line.data + '\\n';
            if (line.type === 'stderr') output += line.data + '\\n';
          }
        }

        // Try to read plot
        try {
          await webR.evalRVoid('dev.off()');
          const plotData = await webR.evalR('readBin(tf, "raw", file.info(tf)$size)');
          const plotBytes = await plotData.toArray();
          if (plotBytes.length > 1000) { // non-empty plot
            const blob = new Blob([new Uint8Array(plotBytes)], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            if (plotEl) {
              plotEl.innerHTML = '<img src="' + url + '" alt="R Plot Output" />';
              plotEl.classList.add('has-content');
            }
          }
        } catch(e) { /* no plot */ }

        if (output.trim()) {
          outputEl.textContent = output.trimEnd();
          outputEl.classList.add('has-content');
        }
      } catch (err) {
        outputEl.textContent = 'Error: ' + err.message;
        outputEl.classList.add('has-content');
      }

      btn.disabled = false;
      btn.textContent = '\\u25b6 Run';
    };

    // Reset code to original
    window.resetWebR = function(btn) {
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
      editors[idx].cm.setValue(editors[idx].originalCode);
      outputEl.textContent = '';
      outputEl.classList.remove('has-content');
      if (plotEl) {
        plotEl.innerHTML = '';
        plotEl.classList.remove('has-content');
      }
    };
  </script>
  <!-- Mermaid for diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad: true, theme: 'default'});</script>
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
    webr = meta.get('webr', 'false').lower() == 'true'
    description = meta.get('description', DEFAULT_DESCRIPTION)
    keywords = meta.get('keywords', DEFAULT_KEYWORDS)

    page_html = template
    page_html = page_html.replace('{{TITLE}}', title)
    page_html = page_html.replace('{{DESCRIPTION}}', description)
    page_html = page_html.replace('{{KEYWORDS}}', keywords)
    page_html = page_html.replace('{{CONTENT}}', content)
    page_html = page_html.replace('{{MATHJAX}}', MATHJAX_BLOCK if mathjax else '')
    page_html = page_html.replace('{{WEBR_HEAD}}', WEBR_HEAD_BLOCK if webr else '')
    page_html = page_html.replace('{{WEBR_BODY}}', WEBR_BODY_BLOCK if webr else '')

    return page_html


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
        page_html = build_post(template, post_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(page_html)
        print(f"Built: {post_file}")
        built.append(post_file)

    update_sitemap(built)
    print(f"\nDone. {len(built)} page(s) built.")


if __name__ == '__main__':
    main()
