    let WebR = null;
    let webR = null;
    let webRReady = false;
    let webRLoading = false;
    let shelter = null;
    const editors = [];
    let pendingRunBtn = null;

    // Pre-computed index map: avoids O(n) querySelectorAll + indexOf per editor init/run
    const _editorIndexMap = new WeakMap();

    // Lightweight overlay on top of the stock R mode: highlight function-call
    // sites (any identifier immediately followed by `(`). Skips R reserved
    // words so `function(`, `if(`, `for(`, etc. keep their keyword color.
    const R_RESERVED_CALL = /^(function|if|for|while|repeat|switch|return)$/;
    if (typeof CodeMirror !== 'undefined'
        && CodeMirror.defineMode
        && typeof CodeMirror.overlayMode === 'function') {
      CodeMirror.defineMode('r-plus', function(cfg) {
        return CodeMirror.overlayMode(CodeMirror.getMode(cfg, 'r'), {
          token: function(stream) {
            const m = stream.match(/[A-Za-z_.][\w.]*(?=\s*\()/);
            if (m) {
              if (R_RESERVED_CALL.test(m[0])) return null;
              return 'function-call';
            }
            stream.next();
            return null;
          }
        });
      });
    }

    const banner = document.querySelector('.webr-loading-banner');

    async function loadAndInitWebR() {
      if (webRReady) return true;
      if (webRLoading) return false;
      webRLoading = true;

      // Show loading banner
      if (banner) {
        banner.textContent = '\u23f3 Loading R environment (first run only)...';
        banner.classList.remove('hidden', 'ready');
        banner.style.maxHeight = '50px';
        banner.style.padding = '8px 16px';
        banner.style.margin = '0 0 8px 0';
        banner.style.opacity = '1';
      }

      try {
        // Dynamically import WebR only when needed
        const mod = await import('https://webr.r-wasm.org/latest/webr.mjs');
        WebR = mod.WebR;
        webR = new WebR();
        await webR.init();
        shelter = await new webR.Shelter();
        webRReady = true;

        if (banner) {
          banner.textContent = '\u2705 R environment ready! Click Run or press Ctrl+Enter.';
          banner.classList.add('ready');
          setTimeout(() => { banner.classList.add('hidden'); }, 2500);
        }
        document.querySelectorAll('.webr-run-btn').forEach(btn => {
          btn.disabled = false;
          setRunBtnText(btn, '\u25b6 Run');
        });
        // Inject Run All button into the engagement-header strip (or standalone fallback)
        const contentEl = document.getElementById('content');
        const engHeader = contentEl.querySelector('.engagement-header');
        const runBtn = document.createElement('button');
        runBtn.className = 'webr-runall-btn';
        runBtn.onclick = function() { window.runAllWebR(this); };
        runBtn.textContent = '\u25b6 Run All';
        if (engHeader) {
          const wrapper = document.createElement('span');
          wrapper.className = 'webr-runall-inline';
          const dot = document.createElement('span');
          dot.className = 'engagement-meta-dot';
          dot.innerHTML = '&middot;';
          const label = document.createElement('span');
          label.className = 'webr-runall-label';
          label.textContent = 'R Ready';
          wrapper.appendChild(dot);
          wrapper.appendChild(label);
          wrapper.appendChild(runBtn);
          engHeader.appendChild(wrapper);
          requestAnimationFrame(() => { wrapper.classList.add('visible'); });
        } else {
          const firstH1 = contentEl.querySelector('h1');
          const runAllBar = document.createElement('div');
          runAllBar.className = 'webr-runall-bar';
          runAllBar.innerHTML = '<span class="webr-runall-label">R environment ready</span>';
          runAllBar.appendChild(runBtn);
          if (firstH1 && firstH1.nextSibling) {
            firstH1.parentNode.insertBefore(runAllBar, firstH1.nextSibling);
          } else {
            contentEl.insertBefore(runAllBar, contentEl.firstChild);
          }
          requestAnimationFrame(() => { runAllBar.classList.add('visible'); });
        }
        // Track WebR ready in GA4
        if (typeof gtag === 'function') {
          gtag('event', 'webr_ready', {
            event_category: 'WebR',
            event_label: document.title,
            code_block_count: document.querySelectorAll('.webr-container').length
          });
        }
        return true;
      } catch(e) {
        webRLoading = false;
        if (banner) { banner.textContent = 'Failed to load R: ' + e.message; banner.style.background = '#fee2e2'; banner.style.color = '#991b1b'; }
        return false;
      }
    }

    // Hide the loading banner on initial page load (no auto-download)
    if (banner) {
      banner.textContent = '\u25b6 Click Run on any code block to start the R environment';
      banner.style.background = '#f8fafb';
      banner.style.color = '#656d76';
      banner.style.borderColor = '#e1e4e8';
    }

    // Defensive ad scrub: third-party ad platforms (Ezoic/AdSense) can inject
    // iframes, <ins> slots, or wrappers into content-shaped divs. Remove anything
    // that lands inside a .webr-container — we never create iframes/<ins> ourselves.
    (function () {
      const AD_TAGS = { INS: 1, IFRAME: 1 };
      const AD_PATTERN = /ezoic|ezojs|ezmob|adsbygoogle|google_ads|pagead|dfp-ad|gpt-ad/i;
      function isAdNode(n) {
        if (!n || n.nodeType !== 1) return false;
        if (AD_TAGS[n.tagName]) return true;
        const cls = (typeof n.className === 'string') ? n.className : '';
        if (AD_PATTERN.test(cls)) return true;
        if (n.id && AD_PATTERN.test(n.id)) return true;
        return false;
      }
      function scrub(root) {
        if (!root || !root.querySelectorAll) return;
        root.querySelectorAll('.webr-container ins, .webr-container iframe').forEach(el => {
          try { el.remove(); } catch (e) {}
        });
        root.querySelectorAll('.webr-container [class*="ezoic"], .webr-container [id*="ezoic"], .webr-container [class*="adsbygoogle"]').forEach(el => {
          try { el.remove(); } catch (e) {}
        });
      }
      scrub(document);
      const adObs = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const added = mutations[i].addedNodes;
          for (let j = 0; j < added.length; j++) {
            const node = added[j];
            if (node.nodeType !== 1) continue;
            const container = node.closest && node.closest('.webr-container');
            if (container) {
              if (isAdNode(node)) {
                try { node.remove(); } catch (e) {}
                continue;
              }
              if (node.querySelectorAll) {
                node.querySelectorAll('ins, iframe, [class*="ezoic"], [id*="ezoic"], [class*="adsbygoogle"]').forEach(el => {
                  try { el.remove(); } catch (e) {}
                });
              }
            }
          }
        }
      });
      document.querySelectorAll('.webr-container').forEach(c => {
        adObs.observe(c, { childList: true, subtree: true });
      });
    })();

    // WebR loads on-demand: first Run click triggers loadAndInitWebR().
    // No preload — avoids 12+ MB download on page load.

    // Build sticky header for each code block: [badge + label | copy + run]
    // Moves the existing Run button from .webr-buttons into the header so
    // event listeners and inner shortcut span are preserved. Bottom bar is
    // left in DOM but hidden via CSS (display: none) — preserves fragment
    // contract and keeps rollback trivial.
    const copyIcon  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

    // Single shared ResizeObserver for horizontal overflow detection (instead of 1 per block)
    const _overflowObserver = ('ResizeObserver' in window) ? new ResizeObserver(entries => {
      for (const entry of entries) {
        const target = entry.target.querySelector('.CodeMirror-scroll') || entry.target;
        entry.target.classList.toggle('has-overflow', target.scrollWidth > target.clientWidth + 1);
      }
    }) : null;

    const _allContainers = document.querySelectorAll('.webr-container');
    if (_allContainers[0]) _allContainers[0].classList.add('engagement-unrun-first');

    // Delegated: first click on any .webr-run-btn clears the invitation pulse
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('.webr-run-btn') : null;
      if (!btn) return;
      document.querySelectorAll('.webr-container.engagement-unrun-first')
        .forEach(el => el.classList.remove('engagement-unrun-first'));
    }, true);

    // Attach copy handler to a .webr-copy-btn element
    function _attachCopyHandler(copyBtn) {
      copyBtn.onclick = function() {
        const c = this.closest('.webr-container');
        const editorEl = c.querySelector('.webr-editor');
        const idx = _editorIndexMap.get(editorEl);
        const code = editors[idx] ? editors[idx].cm.getValue() : editorEl.textContent;
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.innerHTML = checkIcon;
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.innerHTML = copyIcon; copyBtn.classList.remove('copied'); }, 1500);
        });
      };
    }

    _allContainers.forEach(container => {
      const codeBlock = container.querySelector('.webr-code-block');
      if (!codeBlock) return;

      // Header pre-rendered in HTML — just attach copy handler
      if (codeBlock.querySelector('.webr-header')) {
        const existingCopy = codeBlock.querySelector('.webr-copy-btn');
        if (existingCopy) _attachCopyHandler(existingCopy);
        return;
      }

      // Fallback: build header dynamically (legacy pages without pre-rendered header)
      const header = document.createElement('div');
      header.className = 'webr-header';

      const left = document.createElement('div');
      left.className = 'webr-header-left';
      const _titleText = container.getAttribute('data-block-title') || 'Interactive R';
      const _titleEsc = _titleText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      left.innerHTML = '<span class="webr-header-badge">R</span>'
        + '<span class="webr-header-label">' + _titleEsc + '</span>';

      const right = document.createElement('div');
      right.className = 'webr-header-right';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'webr-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code');
      copyBtn.title = 'Copy code';
      copyBtn.innerHTML = copyIcon;
      _attachCopyHandler(copyBtn);
      right.appendChild(copyBtn);

      // Move the existing Run button from the bottom bar to the header.
      const runBtn = codeBlock.querySelector('.webr-buttons .webr-run-btn');
      if (runBtn) {
        runBtn.innerHTML = '\u25b6 Run <span class="webr-run-shortcut">Ctrl+Enter</span>';
        right.appendChild(runBtn);
      }

      header.appendChild(left);
      header.appendChild(right);
      codeBlock.prepend(header);

      // Output panel: announce new results to screen readers (polite, atomic)
      // and make it programmatically focusable without entering tab order.
      const outputEl = codeBlock.querySelector('.webr-output');
      if (outputEl) {
        outputEl.setAttribute('aria-live', 'polite');
        outputEl.setAttribute('aria-atomic', 'false');
        outputEl.setAttribute('tabindex', '-1');
      }

      // Horizontal overflow affordance — shared ResizeObserver toggles .has-overflow
      const editorEl = codeBlock.querySelector('.webr-editor');
      if (editorEl && _overflowObserver) _overflowObserver.observe(editorEl);
    });

    // Initialize CodeMirror editor for a single element
    function initEditor(el) {
      if (el.dataset.cmInit) return; // already initialized
      el.dataset.cmInit = '1';
      const code = el.textContent;
      el.textContent = '';
      let cm;
      try {
        cm = CodeMirror(el, {
          value: code,
          mode: (CodeMirror.modes && CodeMirror.modes['r-plus']) ? 'r-plus' : 'r',
          lineNumbers: true,
          viewportMargin: 20,
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
      } catch (e) {
        console.error('WebR editor init failed:', e);
        // Recover: restore the original code text and allow a retry later.
        el.innerHTML = '';
        el.textContent = code;
        delete el.dataset.cmInit;
        return;
      }
      el.classList.add('cm-initialized');
      const domIdx = _editorIndexMap.get(el);
      editors[domIdx] = { cm, originalCode: code, el };
    }

    // Yielding init: queue editors one at a time using requestIdleCallback.
    // rIC naturally pauses during active scroll (browser is busy compositing)
    // and fires during idle gaps, so editors init without freezing scrolling.
    const initQueue = [];
    let _initScheduled = false;

    function processInitQueue() {
      _initScheduled = false;
      if (initQueue.length === 0) return;
      const el = initQueue.shift();
      initEditor(el);
      if (initQueue.length > 0) scheduleNextInit();
    }

    function scheduleNextInit() {
      if (_initScheduled) return;
      _initScheduled = true;
      if ('requestIdleCallback' in window) {
        requestIdleCallback(processInitQueue);
      } else {
        setTimeout(processInitQueue, 80);
      }
    }

    // Eagerly init editors in the initial viewport, lazily observe the rest
    // via IntersectionObserver (rootMargin 400px). Each queued editor inits
    // one at a time, yielding to the main thread between each.
    const allEditors = document.querySelectorAll('.webr-editor');
    allEditors.forEach((el, i) => _editorIndexMap.set(el, i));
    const _lazyEditors = [];
    allEditors.forEach(el => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (r.top < vh + 200 && r.bottom > -200) {
        initQueue.push(el);
      } else {
        _lazyEditors.push(el);
      }
    });
    if (initQueue.length > 0) processInitQueue();

    if ('IntersectionObserver' in window && _lazyEditors.length > 0) {
      const editorObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            initQueue.push(entry.target);
            editorObserver.unobserve(entry.target);
          }
        });
        if (initQueue.length > 0) scheduleNextInit();
      }, { rootMargin: '400px' });
      _lazyEditors.forEach(el => editorObserver.observe(el));
    } else {
      _lazyEditors.forEach(el => initQueue.push(el));
      if (initQueue.length > 0) scheduleNextInit();
    }

    // Track which packages are already installed in this WebR session
    const installedPkgs = new Set(['base', 'stats', 'graphics', 'grDevices', 'utils', 'datasets', 'methods']);

    // Auto-install packages needed by the code
    async function ensurePackages(code) {
      // Find library() and require() calls
      const libRegex = /(?:library|require)\s*\(\s*["']?([a-zA-Z0-9.]+)["']?\s*\)/g;
      const needed = [];
      let match;
      while ((match = libRegex.exec(code)) !== null) {
        const pkg = match[1];
        if (!installedPkgs.has(pkg)) needed.push(pkg);
      }
      // Also intercept install.packages() calls
      const installRegex = /install\.packages\s*\(\s*["']([a-zA-Z0-9.]+)["']\s*\)/g;
      while ((match = installRegex.exec(code)) !== null) {
        const pkg = match[1];
        if (!installedPkgs.has(pkg)) needed.push(pkg);
      }
      if (needed.length > 0) {
        for (const pkg of needed) {
          try {
            await webR.installPackages([pkg], { quiet: true });
            installedPkgs.add(pkg);
          } catch(e) {
            console.warn('Failed to install ' + pkg + ':', e.message);
          }
        }
      }
      // Replace install.packages() with a no-op message (already installed above)
      return code.replace(/install\.packages\s*\([^)]+\)/g,
        'cat("Package already installed via WebR.\\n")');
    }

    // Run R code using shelter.captureR for proper output capture
    // Helper: set Run button text while preserving Ctrl+Enter shortcut hint
    function setRunBtnText(btn, text) {
      const shortcut = '<span class="webr-run-shortcut">Ctrl+Enter</span>';
      btn.innerHTML = text + ' ' + shortcut;
    }

    let _firstRunDone = false;
    let _firstRunHint = null;
    let _firstRunHintShownAt = 0;
    const _HINT_MIN_DISPLAY = 2500; // ms — minimum time the hint stays visible

    function removeFirstRunHint() {
      if (!_firstRunHint || !_firstRunHint.parentNode) return;
      const elapsed = Date.now() - _firstRunHintShownAt;
      const remaining = Math.max(0, _HINT_MIN_DISPLAY - elapsed);
      const h = _firstRunHint;
      _firstRunHint = null;
      setTimeout(() => {
        h.classList.add('is-fading');
        setTimeout(() => { if (h.parentNode) h.remove(); }, 400);
      }, remaining);
    }

    window.runWebR = async function(btn) {
      // Show first-run hint on the very first Run click (regardless of WebR state)
      if (!_firstRunDone) {
        _firstRunDone = true;
        const container = btn.closest('.webr-container');
        const outputEl = container.querySelector('.webr-output');
        if (outputEl) {
          const hint = document.createElement('div');
          hint.className = 'webr-first-run-hint';
          hint.innerHTML = '<span class="webr-hint-spinner"></span> Setting up R environment — first run takes a moment';
          outputEl.parentNode.insertBefore(hint, outputEl);
          _firstRunHint = hint;
          _firstRunHintShownAt = Date.now();
          // Safety net: remove after 15s max
          setTimeout(removeFirstRunHint, 15000);
        }
      }

      // Lazy-load WebR on first run
      if (!webRReady) {
        if (webRLoading) {
          // Already loading — queue this button to auto-run when ready
          pendingRunBtn = btn;
          btn.disabled = true;
          setRunBtnText(btn, 'Loading R...');
          btn.classList.add('running');
          // Wait for loading to finish
          while (webRLoading && !webRReady) {
            await new Promise(r => setTimeout(r, 200));
          }
          if (!webRReady) { btn.disabled = false; setRunBtnText(btn, '\u25b6 Run'); btn.classList.remove('running'); return; }
        } else {
          btn.disabled = true;
          setRunBtnText(btn, 'Loading R...');
          btn.classList.add('running');
          const ok = await loadAndInitWebR();
          if (!ok) { btn.disabled = false; setRunBtnText(btn, '\u25b6 Run'); btn.classList.remove('running'); return; }
        }
      }
      if (!shelter) return;
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      // Ensure the editor for this block is initialized even if the user
      // clicked Run before the lazy IntersectionObserver fired.
      if (!editorEl.dataset.cmInit) initEditor(editorEl);
      const idx = _editorIndexMap.get(editorEl);
      let code = editors[idx].cm.getValue();

      btn.disabled = true;
      setRunBtnText(btn, 'Installing packages...');
      btn.classList.add('running');
      // Clear output but keep panel visible — :empty::before shows placeholder.
      // IMPORTANT: use textContent = '' (no whitespace) so :empty pseudo matches.
      outputEl.textContent = '';
      outputEl.classList.remove('has-content', 'has-error', 'has-message');
      outputEl.classList.add('is-loading');
      if (plotEl) { plotEl.innerHTML = ''; plotEl.classList.remove('has-content'); }

      try {
        // Auto-install any needed packages before running
        code = await ensurePackages(code);
        setRunBtnText(btn, 'Running...');

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
              output += line.data.endsWith('\n') ? line.data : line.data + '\n';
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

        // Track successful code run in GA4
        if (typeof gtag === 'function') {
          gtag('event', 'webr_code_run', {
            event_category: 'WebR',
            event_label: document.title,
            code_block_index: idx,
            has_plot: !!(result.images && result.images.length > 0)
          });
        }

      } catch (err) {
        outputEl.textContent = 'Error: ' + err.message;
        outputEl.classList.add('has-error');
        // Track code error in GA4
        if (typeof gtag === 'function') {
          gtag('event', 'webr_code_error', {
            event_category: 'WebR',
            event_label: document.title,
            code_block_index: idx,
            error_message: err.message.substring(0, 100)
          });
        }
      }

      // Remove first-run hint now that output has arrived
      removeFirstRunHint();

      // Fade-in effect on the output panel.
      outputEl.classList.remove('is-loading');
      if (outputEl.textContent.length > 0) {
        outputEl.style.opacity = '0';
        requestAnimationFrame(() => { outputEl.style.opacity = '1'; });
      }

      btn.disabled = false;
      setRunBtnText(btn, '\u25b6 Run');
      btn.classList.remove('running');
    };

    // Reset code to original (Reset button is hidden in PR A; kept for
    // fragment-contract + potential direct invocation).
    window.resetWebR = function(btn) {
      const container = btn.closest('.webr-container');
      const editorEl = container.querySelector('.webr-editor');
      const outputEl = container.querySelector('.webr-output');
      const plotEl = container.querySelector('.webr-plot-output');
      if (!editorEl.dataset.cmInit) initEditor(editorEl);
      const idx = _editorIndexMap.get(editorEl);
      editors[idx].cm.setValue(editors[idx].originalCode);
      outputEl.textContent = '';
      outputEl.classList.remove('has-content', 'has-error', 'has-message', 'is-loading');
      if (plotEl) { plotEl.innerHTML = ''; plotEl.classList.remove('has-content'); }
    };

    // Run all code blocks sequentially
    window.runAllWebR = async function(btn) {
      // Lazy-load WebR if not yet loaded
      if (!webRReady) {
        btn.disabled = true;
        btn.textContent = 'Loading R...';
        btn.classList.add('running');
        const ok = await loadAndInitWebR();
        if (!ok) { btn.disabled = false; btn.textContent = '\u25b6 Run All Code Blocks'; btn.classList.remove('running'); return; }
      }
      // Track Run All in GA4
      if (typeof gtag === 'function') {
        gtag('event', 'webr_run_all', {
          event_category: 'WebR',
          event_label: document.title,
          code_block_count: document.querySelectorAll('.webr-container').length
        });
      }
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

      btn.textContent = '\u2705 All Done!';
      btn.classList.remove('running');
      setTimeout(() => {
        btn.textContent = '\u25b6 Run All';
        btn.disabled = false;
      }, 2000);
    };
