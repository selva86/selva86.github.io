/* Team seat-admin page. Reads the signed-in Supabase token from localStorage,
   calls /api/teams/*, and renders the roster + invite + seat controls. No
   framework; matches the account/dashboard pages' vanilla pattern. */
(function () {
  "use strict";
  var root = document.getElementById("team-root");
  if (!root) return;

  // --- auth token from Supabase localStorage (sb-<ref>-auth-token) ---
  function readToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("sb-") !== 0 || k.indexOf("-auth-token") < 0) continue;
        var raw = localStorage.getItem(k);
        if (!raw) continue;
        var val = raw;
        if (raw.charAt(0) !== "{" && raw.indexOf("base64-") === 0) {
          try { val = atob(raw.slice(7)); } catch (e) {}
        }
        try {
          var o = JSON.parse(val);
          if (o && o.access_token) return o.access_token;
          if (Array.isArray(o) && typeof o[0] === "string") return o[0];
        } catch (e) {
          if (val.split(".").length === 3) return val;
        }
      }
    } catch (e) {}
    return null;
  }

  var TOKEN = readToken();
  if (!TOKEN) {
    location.replace("/signin.html?next=/team.html");
    return;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json", Authorization: "Bearer " + TOKEN };
    return fetch(path, {
      method: opts.method || "GET", headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { status: r.status, json: j }; });
    });
  }
  function initials(email) {
    if (!email) return "?";
    var s = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    return (s.slice(0, 2) || "?").toUpperCase();
  }
  function fmtDate(ts) {
    if (!ts) return "";
    try { return new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    catch (e) { return ""; }
  }

  var state = { teams: [] };

  function load() {
    return api("/api/teams/me").then(function (r) {
      if (r.status === 401) { location.replace("/signin.html?next=/team.html"); return; }
      state.teams = (r.json && r.json.teams) || [];
      render();
    }).catch(function () {
      root.innerHTML = '<div class="card"><p class="tm-sub">Could not load your team. Please refresh.</p></div>';
    });
  }

  function render() {
    if (!state.teams.length) {
      root.innerHTML =
        '<div class="card">' +
        '<h2 style="font-family:\'Inter Tight\';font-size:18px;margin:0 0 6px">You are not on a team yet</h2>' +
        '<p class="tm-sub">Buy All-Access for Teams to unlock every course, graded practice, and certificates for your whole group, billed per seat.</p>' +
        '<div style="margin-top:14px"><a class="primary" href="/pricing.html#teams">See Teams pricing</a></div>' +
        "</div>";
      return;
    }
    root.innerHTML = state.teams.map(function (t, i) { return t.can_manage ? adminCard(t, i) : memberCard(t); }).join("");
    wire();
  }

  function memberCard(t) {
    return '<div class="card"><div class="tm-h"><h2>' + esc(t.org.name) + "</h2>" +
      '<span class="tm-pill">Member</span></div>' +
      '<p class="tm-sub">You have All-Access Pro through this team' +
      (t.org.current_period_end ? " (renews " + esc(fmtDate(t.org.current_period_end)) + ")" : "") + ".</p></div>";
  }

  function adminCard(t, idx) {
    var s = t.seats || { total: t.org.seats_purchased, assigned: 0, available: 0 };
    var pct = s.total ? Math.min(100, Math.round((s.assigned / s.total) * 100)) : 0;
    var statusNote = t.org.status !== "active"
      ? '<p class="tm-msg err">This team\'s subscription is ' + esc(t.org.status) + '. Seats are paused until billing is resolved.</p>'
      : "";

    var members = (t.members || []).map(function (m) {
      var isOwner = m.role === "owner";
      return '<div class="tm-row">' +
        '<div class="tm-av">' + esc(initials(m.email)) + "</div>" +
        '<div class="tm-who"><div class="em">' + esc(m.email || m.user_id) + "</div>" +
        '<div class="rl">' + esc(cap(m.role)) + " &middot; joined " + esc(fmtDate(m.joined_at)) + "</div></div>" +
        (isOwner
          ? '<span class="tm-pill owner">Owner</span>'
          : '<button class="tm-x" data-act="remove" data-team="' + esc(t.org.id) + '" data-user="' + esc(m.user_id) + '" data-email="' + esc(m.email || "") + '">Remove</button>') +
        "</div>";
    }).join("");

    var invites = (t.invites || []).map(function (iv) {
      return '<div class="tm-row">' +
        '<div class="tm-av">' + esc(initials(iv.email)) + "</div>" +
        '<div class="tm-who"><div class="em">' + esc(iv.email) + "</div>" +
        '<div class="rl">Invited &middot; expires ' + esc(fmtDate(iv.expires_at)) + "</div></div>" +
        '<span class="tm-pill pending">Pending</span>' +
        '<button class="tm-x" data-act="revoke" data-team="' + esc(t.org.id) + '" data-email="' + esc(iv.email) + '">Cancel</button>' +
        "</div>";
    }).join("");

    return '<div class="card" data-teamcard="' + esc(t.org.id) + '">' +
      '<div class="tm-h"><h2>' + esc(t.org.name) + "</h2>" +
      '<a class="ghost" data-act="portal" data-team="' + esc(t.org.id) + '" href="#">Manage billing</a></div>' +
      statusNote +
      '<div class="tm-seatbar"><div class="tm-seatfill" style="width:' + pct + '%"></div></div>' +
      '<div class="tm-seatnums"><span><b>' + s.assigned + "</b> of <b>" + s.total + "</b> seats used</span>" +
      "<span>" + s.available + " available</span></div>" +

      '<div class="tm-h"><h2>Invite people</h2></div>' +
      '<div class="tm-invite">' +
      '<input type="email" placeholder="teammate@company.com" data-invite-input="' + esc(t.org.id) + '" ' +
      (s.available <= 0 ? "disabled " : "") + '>' +
      '<button class="primary" data-act="invite" data-team="' + esc(t.org.id) + '"' + (s.available <= 0 ? " disabled" : "") + '>Send invite</button>' +
      "</div>" +
      (s.available <= 0
        ? '<p class="tm-note">All seats are assigned. Remove a member or add seats from Manage billing to invite more.</p>'
        : '<p class="tm-note">They get a free account with All-Access Pro for as long as they hold a seat.</p>') +
      '<p class="tm-msg" data-msg="' + esc(t.org.id) + '"></p>' +

      '<div class="tm-h"><h2>Members</h2></div>' + (members || '<p class="tm-sub">No members yet.</p>') +
      (invites ? '<div class="tm-h"><h2>Pending invites</h2></div>' + invites : "") +
      "</div>";
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function msg(teamId, text, kind) {
    var el = root.querySelector('[data-msg="' + cssEsc(teamId) + '"]');
    if (el) { el.textContent = text; el.className = "tm-msg " + (kind || ""); }
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

  function wire() {
    root.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener("click", function (e) {
        var act = el.getAttribute("data-act");
        var teamId = el.getAttribute("data-team");
        if (act === "invite") { e.preventDefault(); doInvite(teamId); }
        else if (act === "remove") { e.preventDefault(); doRemove(teamId, el.getAttribute("data-user"), el.getAttribute("data-email")); }
        else if (act === "revoke") { e.preventDefault(); doRevoke(teamId, el.getAttribute("data-email")); }
        else if (act === "portal") { e.preventDefault(); doPortal(teamId); }
      });
    });
    root.querySelectorAll("[data-invite-input]").forEach(function (inp) {
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doInvite(inp.getAttribute("data-invite-input")); } });
    });
  }

  function doInvite(teamId) {
    var inp = root.querySelector('[data-invite-input="' + cssEsc(teamId) + '"]');
    if (!inp) return;
    var email = (inp.value || "").trim();
    if (!email) return;
    msg(teamId, "Sending…", "");
    api("/api/teams/" + encodeURIComponent(teamId) + "/invites", { method: "POST", body: { email: email } })
      .then(function (r) {
        var res = r.json && r.json.results && r.json.results[0];
        if (r.status !== 200 || !res) { msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not send invite.", "err"); return; }
        var m = {
          invited: "Invite sent to " + email + ".",
          already_member: email + " is already on the team.",
          already_pending: email + " already has a pending invite.",
          no_seats: "No seats available. Remove a member or add seats.",
          invalid: "That email looks invalid.",
        }[res.status] || "Done.";
        msg(teamId, m, res.status === "invited" ? "ok" : "err");
        inp.value = "";
        load();
      })
      .catch(function () { msg(teamId, "Network error. Try again.", "err"); });
  }

  function doRemove(teamId, userId, email) {
    if (!confirm("Remove " + (email || "this member") + " from the team? Their seat frees up immediately.")) return;
    api("/api/teams/" + encodeURIComponent(teamId) + "/members/" + encodeURIComponent(userId), { method: "DELETE" })
      .then(function (r) { if (r.status !== 200) msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not remove.", "err"); load(); })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doRevoke(teamId, email) {
    if (!confirm("Cancel the invite to " + email + "?")) return;
    api("/api/teams/" + encodeURIComponent(teamId) + "/invites", { method: "DELETE", body: { email: email } })
      .then(function () { load(); })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doPortal(teamId) {
    msg(teamId, "Opening billing…", "");
    api("/api/teams/" + encodeURIComponent(teamId) + "/portal")
      .then(function (r) {
        if (r.json && r.json.url) { window.open(r.json.url, "_blank", "noopener"); msg(teamId, "", ""); }
        else { msg(teamId, "Billing portal is not available yet. Email support@r-statistics.co.", "err"); }
      })
      .catch(function () { msg(teamId, "Could not open billing.", "err"); });
  }

  load();
})();
