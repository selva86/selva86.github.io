/* exercise-api.js - shared grading primitives over /api/exercise/*.
 *
 * Both the exercise-hub layer and the interactive lesson player grade against
 * the same backend (manifest-authorized hub + exercise_id, server-awarded XP).
 * This module is the small, stateless surface lesson-mode.js uses so a lesson
 * quiz/try-it solve earns XP + streak exactly like an exercise hub solve.
 *
 * No dependencies. Reads the access token from auth-hydrate.js (window.__auth).
 */
(function () {
  'use strict';

  function token() {
    return (window.__auth && window.__auth.getAccessToken && window.__auth.getAccessToken()) || null;
  }

  /* Hub slug from the URL. Pages serve at flat root (/Foo or /Foo.html), so the
     single-segment regex matches and the slug equals the file stem, which is
     exactly how build_exercise_manifest.py keys the manifest. */
  function hubSlugFromPath() {
    var m = location.pathname.match(/^\/([^\/]+?)(?:\.html?)?\/?$/);
    return m && m[1] ? decodeURIComponent(m[1]) : '';
  }

  function dispatchProgress(result) {
    if (result && typeof result.total_xp === 'number') {
      document.dispatchEvent(new CustomEvent('exercise-progress-changed', {
        detail: {
          total_xp: result.total_xp,
          current_streak_days: result.current_streak_days,
          longest_streak_days: result.longest_streak_days
        }
      }));
    }
  }

  /* POST one first-solve. Best-effort, non-blocking; anon users no-op. */
  function reportSolve(hub, exerciseId, hintsUsed) {
    var t = token();
    if (!t || !hub || !exerciseId) return Promise.resolve(null);
    try {
      return fetch('/api/exercise/' + encodeURIComponent(hub) +
                   '/' + encodeURIComponent(exerciseId) + '/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
        body: JSON.stringify({ passed: true, hints_used: hintsUsed || 0 }),
        keepalive: true
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (res) { dispatchProgress(res); return res; })
        .catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  /* GET solved exercise ids for this hub (cross-device resume of solved state). */
  function fetchSolved(hub) {
    var t = token();
    if (!t || !hub) return Promise.resolve([]);
    return fetch('/api/me/exercises?hub=' + encodeURIComponent(hub), {
      headers: { 'Authorization': 'Bearer ' + t, 'Accept': 'application/json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (b) { return (b && Array.isArray(b.solved)) ? b.solved : []; })
      .catch(function () { return []; });
  }

  window.RSCExerciseAPI = {
    token: token,
    hubSlugFromPath: hubSlugFromPath,
    reportSolve: reportSolve,
    fetchSolved: fetchSolved
  };
})();
