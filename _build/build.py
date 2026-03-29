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
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      /* --- Loading banner: compact, collapses when ready --- */
      .webr-loading-banner {
        padding: 8px 16px;
        background: #f0f4ff;
        color: #3b5998;
        text-align: center;
        margin: 0 0 8px 0;
        border-radius: 6px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border: 1px solid #c7d2fe;
        transition: all 0.4s ease;
        overflow: hidden;
        max-height: 50px;
      }
      .webr-loading-banner.ready {
        background: #ecfdf5;
        color: #166534;
        border-color: #86efac;
      }
      .webr-loading-banner.hidden {
        max-height: 0;
        padding: 0 16px;
        margin: 0;
        border-color: transparent;
        opacity: 0;
      }

      /* --- Run All bar (inline, subtle) --- */
      .webr-runall-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        padding: 0;
        margin: 0 0 14px 0;
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .webr-runall-bar.visible { opacity: 1; transform: translateY(0); }
      .webr-runall-label {
        font-size: 11px;
        color: #9ca3af;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .webr-runall-label::before {
        content: '';
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #2da44e;
        flex-shrink: 0;
      }
      .webr-runall-btn {
        background: none;
        color: #3f73d8;
        border: 1px solid #d0d7de;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 400;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: all 0.15s ease;
      }
      .webr-runall-btn:hover { background: #f6f8fa; border-color: #3f73d8; }
      .webr-runall-btn:disabled { color: #a5b4d4; cursor: wait; }
      .webr-runall-btn.running { color: #d29922; border-color: #d29922; animation: pulse-run 1.5s ease-in-out infinite; }

      /* --- Code block container --- */
      .webr-container {
        margin: 22px 0;
        border: 1px solid #e1e4e8;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1);
        transition: box-shadow 0.2s ease;
      }
      .webr-container:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.12);
      }
      .webr-container:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 2px 8px rgba(0,0,0,0.06);
      }

      /* --- Button bar (below code editor) --- */
      .webr-buttons {
        padding: 6px 10px;
        background: #f7f8fa;
        border-top: 1px solid #e1e4e8;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .webr-buttons-left { display: flex; gap: 6px; align-items: center; }
      .webr-buttons-right { display: flex; gap: 6px; align-items: center; }

      /* --- Keyboard hint --- */
      .webr-kbd-hint {
        font-size: 10px;
        color: #9ca3af;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .webr-kbd-hint kbd {
        background: #f0f1f3;
        border: 1px solid #d1d5db;
        border-radius: 3px;
        padding: 1px 4px;
        font-size: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 1px 0 rgba(0,0,0,0.06);
      }
      /* --- Copy button --- */
      .webr-copy-btn {
        background: none;
        border: 1px solid #d0d7de;
        color: #656d76;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .webr-copy-btn:hover { background: #f6f8fa; color: #24292f; border-color: #c0c8d0; }
      .webr-copy-btn.copied { color: #2da44e; border-color: #2da44e; }

      /* --- CodeMirror editor --- */
      .webr-editor .CodeMirror {
        height: auto;
        min-height: 48px;
        font-size: 14px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Inconsolata', 'Consolas', monospace;
        line-height: 1.6;
        background: #fafbfd;
        padding: 4px 0;
      }
      .webr-editor .CodeMirror-gutters {
        background: #f0f2f5;
        border-right: 1px solid #e1e4e8;
        padding-right: 2px;
      }
      .webr-editor .CodeMirror-linenumber {
        color: #a0a8b4;
        font-size: 11px;
        padding: 0 6px 0 8px;
        min-width: 28px;
      }
      .webr-editor .CodeMirror-cursor { border-left-color: #3b82f6; border-left-width: 2px; }
      .webr-editor .CodeMirror-selected { background: #c8e1ff !important; }
      .webr-editor .CodeMirror-activeline-background { background: #f0f4ff; }
      .webr-editor .CodeMirror-matchingbracket { color: #0969da !important; font-weight: 700; background: #ddf4ff; border-radius: 2px; }

      /* --- R syntax colors (refined) --- */
      .webr-editor .cm-keyword { color: #cf222e; font-weight: 500; }
      .webr-editor .cm-atom { color: #8250df; }
      .webr-editor .cm-number { color: #0550ae; }
      .webr-editor .cm-def { color: #8250df; }
      .webr-editor .cm-variable { color: #24292f; }
      .webr-editor .cm-variable-2 { color: #953800; }
      .webr-editor .cm-variable-3 { color: #0550ae; }
      .webr-editor .cm-property { color: #0550ae; }
      .webr-editor .cm-operator { color: #cf222e; }
      .webr-editor .cm-comment { color: #6e7781; font-style: italic; }
      .webr-editor .cm-string { color: #0a3069; }
      .webr-editor .cm-string-2 { color: #0a3069; }
      .webr-editor .cm-builtin { color: #8250df; font-weight: 500; }

      /* --- Run button --- */
      .webr-run-btn {
        background: #3f73d8;
        color: #fff;
        border: none;
        padding: 4px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: all 0.15s ease;
      }
      .webr-run-btn:hover { background: #2c5fbe; }
      .webr-run-btn:active { background: #254fa0; }
      .webr-run-btn:disabled { background: #a5b4d4; cursor: wait; }
      .webr-run-btn.running { background: #d29922; animation: pulse-run 1.5s ease-in-out infinite; }
      @keyframes pulse-run { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

      /* --- Reset button --- */
      .webr-reset-btn {
        background: none;
        color: #656d76;
        border: 1px solid #d0d7de;
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: all 0.15s ease;
      }
      .webr-reset-btn:hover { background: #f6f8fa; color: #24292f; border-color: #c0c8d0; }

      /* --- Output panel --- */
      .webr-output {
        margin: 0;
        padding: 14px 16px;
        background: #1e2228;
        color: #c9d1d9;
        font-family: 'JetBrains Mono', 'Fira Code', 'Inconsolata', 'Consolas', monospace;
        font-size: 13px;
        line-height: 1.6;
        max-height: 400px;
        overflow-y: auto;
        white-space: pre-wrap;
        display: none;
        border-top: 2px solid #2da44e;
      }
      .webr-output::-webkit-scrollbar { width: 8px; }
      .webr-output::-webkit-scrollbar-track { background: #1e2228; }
      .webr-output::-webkit-scrollbar-thumb { background: #444d56; border-radius: 4px; }
      .webr-output.has-content { display: block; }
      .webr-output.has-error { color: #f85149; border-top-color: #f85149; }

      /* --- Plot output --- */
      .webr-plot-output { text-align: center; padding: 16px; background: #fff; display: none; border-top: 1px solid #e1e4e8; }
      .webr-plot-output.has-content { display: block; }
      .webr-plot-output img, .webr-plot-output canvas { max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

      .mermaid { margin: 15px 0; text-align: center; }
    </style>
"""

WEBR_BODY_BLOCK = """
  <!-- WebR Engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/r/r.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/active-line.min.js"></script>
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
          banner.textContent = '\\u2705 R environment ready! Click Run or press Ctrl+Enter.';
          banner.classList.add('ready');
          setTimeout(() => { banner.classList.add('hidden'); }, 2500);
        }
        document.querySelectorAll('.webr-run-btn').forEach(btn => {
          btn.disabled = false;
          btn.textContent = '\\u25b6 Run';
        });
        // Inject Run All bar at the top of content
        const contentEl = document.getElementById('content');
        const firstH1 = contentEl.querySelector('h1');
        const runAllBar = document.createElement('div');
        runAllBar.className = 'webr-runall-bar';
        runAllBar.innerHTML = '<span class="webr-runall-label">R environment ready</span><button class="webr-runall-btn" onclick="runAllWebR(this)">\\u25b6 Run All Code Blocks</button>';
        if (firstH1 && firstH1.nextSibling) {
          firstH1.parentNode.insertBefore(runAllBar, firstH1.nextSibling);
        } else {
          contentEl.insertBefore(runAllBar, contentEl.firstChild);
        }
        requestAnimationFrame(() => { runAllBar.classList.add('visible'); });
      } catch(e) {
        if (banner) { banner.textContent = 'Failed to load R: ' + e.message; banner.style.background = '#fee2e2'; banner.style.color = '#991b1b'; }
      }
    }

    initWebR();

    // Transform webr-buttons into structured toolbar with Copy + Ctrl+Enter hint
    document.querySelectorAll('.webr-buttons').forEach(btnBar => {
      const runBtn = btnBar.querySelector('.webr-run-btn');
      const resetBtn = btnBar.querySelector('.webr-reset-btn');

      // Create left side: Run + Reset
      const left = document.createElement('div');
      left.className = 'webr-buttons-left';
      if (runBtn) left.appendChild(runBtn);
      if (resetBtn) left.appendChild(resetBtn);
      // Add kbd hint
      const hint = document.createElement('span');
      hint.className = 'webr-kbd-hint';
      hint.innerHTML = '<kbd>Ctrl</kbd>+<kbd>Enter</kbd>';
      left.appendChild(hint);

      // Create right side: Copy
      const right = document.createElement('div');
      right.className = 'webr-buttons-right';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'webr-copy-btn';
      copyBtn.innerHTML = '\\u2398 Copy';
      copyBtn.onclick = function() {
        const container = this.closest('.webr-container');
        const editorEl = container.querySelector('.webr-editor');
        const idx = [...document.querySelectorAll('.webr-editor')].indexOf(editorEl);
        const code = editors[idx] ? editors[idx].cm.getValue() : editorEl.textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.innerHTML = '\\u2713 Copied';
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.innerHTML = '\\u2398 Copy'; copyBtn.classList.remove('copied'); }, 1500);
        });
      };
      right.appendChild(copyBtn);

      btnBar.innerHTML = '';
      btnBar.appendChild(left);
      btnBar.appendChild(right);
    });

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
        theme: 'default',
        matchBrackets: true,
        autoCloseBrackets: true,
        styleActiveLine: true,
        extraKeys: {
          'Ctrl-Enter': function(cm) {
            const container = cm.getWrapperElement().closest('.webr-container');
            const btn = container.querySelector('.webr-run-btn');
            if (btn && !btn.disabled) btn.click();
          },
          'Shift-Enter': function(cm) {
            const container = cm.getWrapperElement().closest('.webr-container');
            const btn = container.querySelector('.webr-run-btn');
            if (btn && !btn.disabled) btn.click();
          }
        }
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

        // Purge shelter to free memory (variables persist in R global env)
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

    // Run all code blocks sequentially
    window.runAllWebR = async function(btn) {
      if (!webRReady) return;
      const allRunBtns = [...document.querySelectorAll('.webr-run-btn')];
      const total = allRunBtns.length;
      btn.disabled = true;

      for (let i = 0; i < total; i++) {
        btn.textContent = 'Running ' + (i + 1) + '/' + total + '...';
        btn.classList.add('running');
        const runBtn = allRunBtns[i];
        // Scroll the block into view
        runBtn.closest('.webr-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
        await window.runWebR(runBtn);
      }

      btn.textContent = '\\u2705 All Done!';
      btn.classList.remove('running');
      setTimeout(() => {
        btn.textContent = '\\u25b6 Run All';
        btn.disabled = false;
      }, 2000);
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
