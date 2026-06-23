/* lesson-widgets/index.js - registry + mounter for interactive lesson widgets.
 *
 * Each widget module calls LessonWidgets.register('<type>', mount). The player
 * (lesson-mode.js) calls mountAll(stepEl) when a step becomes visible, because
 * canvases must size themselves while shown, not while display:none.
 *
 * mount(el, cfg) contract: build controls + canvas inside el; idempotent
 * (guarded by el.dataset.mounted); self-contained; deterministic (seeded).
 */
(function () {
  'use strict';
  var registry = {};

  window.LessonWidgets = {
    register: function (type, mountFn) { registry[type] = mountFn; },

    mount: function (el) {
      if (!el || el.dataset.mounted) return;
      var type = el.getAttribute('data-widget-type');
      var fn = registry[type];
      if (!fn) return;                       // unknown type: leave the noscript fallback
      var cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-widget-config') || '{}'); } catch (e) {}
      el.dataset.mounted = '1';
      try { fn(el, cfg); }
      catch (e) { if (window.console) console.error('[lesson-widget] ' + type + ' failed', e); }
    },

    mountAll: function (root) {
      var scope = root || document;
      var els = scope.querySelectorAll ? scope.querySelectorAll('.lesson-widget') : [];
      for (var i = 0; i < els.length; i++) this.mount(els[i]);
    }
  };
})();
