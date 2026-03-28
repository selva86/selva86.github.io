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
    <style>
      .webr-container { margin: 18px 0; border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      .webr-toolbar { padding: 5px 10px; background: #f6f8fa; border-bottom: 1px solid #d0d7de; display: flex; justify-content: space-between; align-items: center; }
      .webr-toolbar-label { font-size: 12px; color: #656d76; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 500; letter-spacing: 0.3px; }
      .webr-toolbar-actions { display: flex; gap: 6px; }
      .webr-editor .CodeMirror { height: auto; min-height: 50px; font-size: 14px; font-family: 'Inconsolata', 'Consolas', 'Monaco', monospace; line-height: 1.55; background: #fafbfc; }
      .webr-editor .CodeMirror-gutters { background: #f0f2f4; border-right: 1px solid #d0d7de; }
      .webr-editor .CodeMirror-linenumber { color: #8b949e; font-size: 12px; }
      .webr-run-btn { background: #2da44e; color: #fff; border: none; padding: 4px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; transition: background 0.15s; }
      .webr-run-btn:hover { background: #218838; }
      .webr-run-btn:disabled { background: #94d3a2; cursor: wait; }
      .webr-run-btn.running { background: #bf8700; }
      .webr-reset-btn { background: transparent; color: #656d76; border: 1px solid #d0d7de; padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; transition: all 0.15s; }
      .webr-reset-btn:hover { background: #f3f4f6; color: #24292f; }
      .webr-output { margin: 0; padding: 12px 14px; background: #24292f; color: #e6edf3; font-family: 'Inconsolata', 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.55; max-height: 400px; overflow-y: auto; white-space: pre-wrap; display: none; border-top: 1px solid #30363d; }
      .webr-output.has-content { display: block; }
      .webr-output.has-error { color: #f85149; }
      .webr-plot-output { text-align: center; padding: 12px; background: #fff; display: none; border-top: 1px solid #d0d7de; }
      .webr-plot-output.has-content { display: block; }
      .webr-plot-output img { max-width: 100%; height: auto; border-radius: 4px; }
      .webr-loading-banner { padding: 10px 16px; background: linear-gradient(135deg, #dbeafe, #e8f4f8); color: #1e40af; text-align: center; margin-bottom: 20px; border-radius: 6px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; border: 1px solid #bfdbfe; }
      .webr-loading-banner.ready { background: linear-gradient(135deg, #d1fae5, #dcfce7); color: #166534; border-color: #86efac; }
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
    let shelter = null;
    const editors = [];

    const banner = document.querySelector('.webr-loading-banner');

    async function initWebR() {
      try {
        await webR.init();
        shelter = await new webR.Shelter();
        webRReady = true;
        if (banner) {
          banner.textContent = '\\u2705 R environment ready! Click Run to execute code.';
          banner.classList.add('ready');
          setTimeout(() => { banner.style.opacity = '0'; banner.style.transition = 'opacity 0.5s'; setTimeout(() => banner.style.display = 'none', 500); }, 4000);
        }
        document.querySelectorAll('.webr-run-btn').forEach(btn => {
          btn.disabled = false;
          btn.textContent = '\\u25b6 Run';
        });
      } catch(e) {
        if (banner) { banner.textContent = 'Failed to load R: ' + e.message; banner.style.background = '#fee2e2'; banner.style.color = '#991b1b'; }
      }
    }

    initWebR();

    // Initialize CodeMirror editors
    document.querySelectorAll('.webr-editor').forEach((el) => {
      const code = el.textContent;
      el.textContent = '';
      const cm = CodeMirror(el, {
        value: code,
        mode: 'r',
        lineNumbers: true,
        viewportMargin: Infinity,
        tabSize: 2,
        theme: 'default'
      });
      editors.push({ cm, originalCode: code, el });
    });

    // Run R code using shelter.captureR for proper output capture
    window.runWebR = async function(btn) {
      if (!webRReady || !shelter) return;
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
      const code = editors[idx].cm.getValue();

      btn.disabled = true;
      btn.textContent = 'Running...';
      btn.classList.add('running');
      outputEl.textContent = '';
      outputEl.classList.remove('has-content', 'has-error');
      if (plotEl) { plotEl.innerHTML = ''; plotEl.classList.remove('has-content'); }

      try {
        // Use shelter.captureR to properly capture stdout/stderr
        const result = await shelter.captureR(code, {
          withAutoprint: true,
          captureStreams: true,
          captureConditions: true,
          captureGraphics: { width: 700, height: 500 }
        });

        // Collect text output
        let output = '';
        if (result.output) {
          for (const line of result.output) {
            if (line.type === 'stdout' || line.type === 'stderr') {
              output += line.data.endsWith('\\n') ? line.data : line.data + '\\n';
            }
          }
        }

        // Show plot images if any
        if (result.images && result.images.length > 0 && plotEl) {
          plotEl.innerHTML = '';
          for (const img of result.images) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            plotEl.appendChild(canvas);
          }
          plotEl.classList.add('has-content');
        }

        if (output.trim()) {
          outputEl.textContent = output.trimEnd();
          outputEl.classList.add('has-content');
        } else if (!result.images || result.images.length === 0) {
          // If no text output and no plots, show the result value
          try {
            const val = await result.result.toString();
            if (val && val.trim()) {
              outputEl.textContent = val.trimEnd();
              outputEl.classList.add('has-content');
            }
          } catch(e) { /* no printable result */ }
        }

        // Clean up shelter objects
        shelter.purge();
        shelter = await new webR.Shelter();

      } catch (err) {
        outputEl.textContent = 'Error: ' + err.message;
        outputEl.classList.add('has-content', 'has-error');
      }

      btn.disabled = false;
      btn.textContent = '\\u25b6 Run';
      btn.classList.remove('running');
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
      outputEl.classList.remove('has-content', 'has-error');
      if (plotEl) { plotEl.innerHTML = ''; plotEl.classList.remove('has-content'); }
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
