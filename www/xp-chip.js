// xp-chip.js — a small XP pill in the masthead that reflects learning progress.
// Anonymous: derived from local progress (opened/read lessons in rstat_visited /
// rstat_started). Signed-in: upgraded to the server total_xp when auth hydrates.
// Hidden on mobile so it never crowds the (tight) masthead. Dependency-free.
(function () {
  var XP_PER_LESSON = 20;

  function localXP() {
    try {
      var v = JSON.parse(localStorage.getItem('rstat_visited') || '{}');
      var s = JSON.parse(localStorage.getItem('rstat_started') || '{}');
      var n = Object.keys(v).length;
      for (var k in s) { if (!v[k]) n++; }
      return n * XP_PER_LESSON;
    } catch (e) { return 0; }
  }

  var style = document.createElement('style');
  style.textContent =
    '.rs-xp{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 11px;' +
    'border-radius:20px;background:#edf6f1;border:1px solid #cfe7db;color:#178a4e;' +
    "font:600 12.5px 'Inter',system-ui,sans-serif;white-space:nowrap;letter-spacing:.01em}" +
    '.rs-xp .rs-xp-i{font-size:10px}' +
    'html.dark .rs-xp{background:#12271c;border-color:#1f5e45;color:#4ade80}' +
    '@media(max-width:820px){.rs-xp{display:none!important}}';
  document.head.appendChild(style);

  function chip() {
    var c = document.getElementById('rs-xp');
    if (c) return c;
    var tools = document.querySelector('.masthead-tools');
    if (!tools) return null;
    c = document.createElement('span');
    c.id = 'rs-xp';
    c.className = 'rs-xp';
    c.title = 'Your learning XP';
    c.innerHTML = '<span class="rs-xp-i" aria-hidden="true">▲</span> <b>0</b> XP';
    var cta = tools.querySelector('.masthead-cta');
    tools.insertBefore(c, cta || tools.firstChild);
    return c;
  }

  function set(xp) {
    var c = chip();
    if (!c) return;
    c.querySelector('b').textContent = xp;
    c.style.display = xp > 0 ? '' : 'none';
  }

  set(localXP());

  // Upgrade to the authoritative server XP once the user hydrates (signed in).
  document.addEventListener('auth-hydrated', function (ev) {
    var me = ev && ev.detail && ev.detail.me;
    var u = me && me.user;
    var sx = u && (typeof u.total_xp === 'number' ? u.total_xp
             : (typeof u.xp === 'number' ? u.xp : null));
    if (sx != null) set(Math.max(sx, localXP()));
  });
})();
