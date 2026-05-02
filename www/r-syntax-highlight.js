/* R syntax highlighter for .webr-editor blocks.
 * Idempotent: skips editors that already contain span tokens.
 * Re-runs when WebR mounts or replaces editor content.
 */
(function(){
  'use strict';

  var KEYWORDS = ['library','require','requireNamespace','if','else','for','while','function','return','TRUE','FALSE','NULL','NA','NA_integer_','NA_real_','NA_character_','Inf','NaN','in','break','next','repeat'];

  function escapeHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Use  (private use area) start,  separator
  var T_STR = '';
  var T_COM = '';
  var T_END = '';

  function highlight(text){
    var strings = [];
    var comments = [];

    // Protect strings (handles escaped quotes inside)
    text = text.replace(/(["'])((?:\\.|(?!\1)[^\\])*)\1/g, function(m){
      strings.push(m);
      return T_STR + (strings.length - 1) + T_END;
    });

    // Protect # ... end-of-line comments
    text = text.replace(/#[^\n]*/g, function(m){
      comments.push(m);
      return T_COM + (comments.length - 1) + T_END;
    });

    text = escapeHtml(text);

    // Numbers
    text = text.replace(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?[Li]?|\.\d+(?:[eE][+-]?\d+)?[Li]?)\b/g,
      '<span class="number">$1</span>');

    // Keywords
    var kwRe = new RegExp('\\b(' + KEYWORDS.join('|') + ')\\b', 'g');
    text = text.replace(kwRe, '<span class="keyword">$1</span>');

    // Function calls: identifier followed by '(' (excluding control flow)
    text = text.replace(/\b([A-Za-z_][A-Za-z0-9_.]*)(?=\s*\()/g, function(m, name){
      if (name === 'function' || name === 'if' || name === 'for' || name === 'while') return m;
      return '<span class="fn">' + name + '</span>';
    });

    // Restore comments and strings (use the sentinel chars in the regex)
    text = text.replace(new RegExp(T_COM + '(\\d+)' + T_END, 'g'), function(m, idx){
      return '<span class="comment">' + escapeHtml(comments[+idx]) + '</span>';
    });
    text = text.replace(new RegExp(T_STR + '(\\d+)' + T_END, 'g'), function(m, idx){
      return '<span class="string">' + escapeHtml(strings[+idx]) + '</span>';
    });

    return text;
  }

  function applyHighlight(){
    var editors = document.querySelectorAll('.webr-editor');
    for (var i = 0; i < editors.length; i++){
      var el = editors[i];
      // Skip if server already pre-highlighted (template-string spans)
      if (el.querySelector('span.keyword, span.fn, span.string, span.number, span.comment')) continue;
      if (el.getAttribute('data-runtime-highlighted') === 'true') continue;
      var text = el.textContent;
      if (!text || !text.trim()) continue;
      el.innerHTML = highlight(text);
      el.setAttribute('data-runtime-highlighted', 'true');
    }
  }

  function schedule(){
    applyHighlight();
    setTimeout(applyHighlight, 200);
    setTimeout(applyHighlight, 800);
    setTimeout(applyHighlight, 2000);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  // Watch for editor content changes (WebR mounting, code regeneration)
  if (typeof MutationObserver !== 'undefined'){
    document.addEventListener('DOMContentLoaded', function(){
      var observer = new MutationObserver(function(mutations){
        var dirty = false;
        for (var i = 0; i < mutations.length; i++){
          var t = mutations[i].target;
          if (t && t.classList && t.classList.contains('webr-editor')){
            t.removeAttribute('data-runtime-highlighted');
            dirty = true;
          } else if (t && t.parentElement && t.parentElement.classList && t.parentElement.classList.contains('webr-editor')){
            t.parentElement.removeAttribute('data-runtime-highlighted');
            dirty = true;
          }
        }
        if (dirty) applyHighlight();
      });
      var editors = document.querySelectorAll('.webr-editor');
      for (var i = 0; i < editors.length; i++){
        observer.observe(editors[i], { childList: true, characterData: true, subtree: true });
      }
    });
  }

  // Public hook for tools to re-trigger after they regenerate code
  window.highlightWebREditors = applyHighlight;
})();
