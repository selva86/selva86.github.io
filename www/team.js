/* Team seat-admin page (v2: bulk invite, resend, roles, seats, progress).
   Reads the signed-in Supabase token from localStorage, calls /api/teams/*,
   and renders the roster + controls. Vanilla JS, matches account pages. */
(function () {
  "use strict";
  var root = document.getElementById("team-root");
  if (!root) return;

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

  // review-only fixtures (auth does not complete on the pages.dev subdomain),
  // same pattern as dashboard.js. ?demo=1 renders a populated admin card.
  var DEMO = /[?&]demo=1/.test(location.search);
  var TOKEN = readToken();
  if (!TOKEN && !DEMO) { location.replace("/signin.html?next=/team.html"); return; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + TOKEN },
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
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

  var state = { teams: [], progress: {} };

  function demoFixture() {
    var now = Math.floor(Date.now() / 1000);
    var org = { id: "org_demo", name: "Acme Analytics", plan: "teams", status: "active", seats_purchased: 8, current_period_end: now + 290 * 86400 };
    state.teams = [{
      org: org, role: "owner", can_manage: true,
      seats: { total: 8, assigned: 6, available: 2 },
      members: [
        { user_id: "u1", email: "selva@acme.com", role: "owner", joined_at: now - 40 * 86400 },
        { user_id: "u2", email: "priya@acme.com", role: "admin", joined_at: now - 32 * 86400 },
        { user_id: "u3", email: "daniel@acme.com", role: "member", joined_at: now - 30 * 86400 },
        { user_id: "u4", email: "mei@acme.com", role: "member", joined_at: now - 21 * 86400 },
        { user_id: "u5", email: "arjun@acme.com", role: "member", joined_at: now - 9 * 86400 },
      ],
      invites: [{ email: "newhire@acme.com", role: "member", created_at: now - 86400, expires_at: now + 13 * 86400 }],
    }];
    state.progress.org_demo = [
      { user_id: "u2", email: "priya@acme.com", display_name: "Priya", role: "admin", total_xp: 4210, current_streak_days: 9, last_active_date: "2026-07-18", exercises_solved: 58, certificates: 2 },
      { user_id: "u3", email: "daniel@acme.com", display_name: "Daniel", role: "member", total_xp: 2840, current_streak_days: 3, last_active_date: "2026-07-17", exercises_solved: 41, certificates: 1 },
      { user_id: "u1", email: "selva@acme.com", display_name: "Selva", role: "owner", total_xp: 1930, current_streak_days: 5, last_active_date: "2026-07-18", exercises_solved: 27, certificates: 1 },
      { user_id: "u4", email: "mei@acme.com", display_name: "Mei", role: "member", total_xp: 860, current_streak_days: 0, last_active_date: "2026-07-11", exercises_solved: 12, certificates: 0 },
      { user_id: "u5", email: "arjun@acme.com", display_name: "Arjun", role: "member", total_xp: 120, current_streak_days: 1, last_active_date: "2026-07-16", exercises_solved: 3, certificates: 0 },
    ];
    render();
  }

  function load() {
    if (DEMO) { demoFixture(); return; }
    return api("/api/teams/me").then(function (r) {
      if (r.status === 401) { location.replace("/signin.html?next=/team.html"); return; }
      state.teams = (r.json && r.json.teams) || [];
      render();
      // Load progress for manageable teams after first paint.
      state.teams.forEach(function (t) {
        if (t.can_manage) {
          api("/api/teams/" + encodeURIComponent(t.org.id) + "/progress").then(function (p) {
            if (p.status === 200 && p.json && p.json.members) {
              state.progress[t.org.id] = p.json.members;
              renderProgress(t.org.id);
            }
          }).catch(function () {});
        }
      });
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
    root.innerHTML = state.teams.map(function (t) { return t.can_manage ? adminCard(t) : memberCard(t); }).join("");
    wire();
    Object.keys(state.progress).forEach(renderProgress);
  }

  function memberCard(t) {
    return '<div class="card"><div class="tm-h"><h2>' + esc(t.org.name) + "</h2>" +
      '<span class="tm-pill">Member</span></div>' +
      '<p class="tm-sub">You have All-Access Pro through this team' +
      (t.org.current_period_end ? " (renews " + esc(fmtDate(t.org.current_period_end)) + ")" : "") + ".</p>" +
      '<p class="tm-note">Your team\'s admins can see your learning progress (XP, exercises solved, certificates).</p></div>';
  }

  function adminCard(t) {
    var s = t.seats || { total: t.org.seats_purchased, assigned: 0, available: 0 };
    var isOwner = t.role === "owner";
    var pct = s.total ? Math.min(100, Math.round((s.assigned / s.total) * 100)) : 0;
    var oid = esc(t.org.id);
    var statusNote = t.org.status !== "active"
      ? '<p class="tm-msg err">This team\'s subscription is ' + esc(t.org.status) + '. Seats are paused until billing is resolved.</p>'
      : "";

    var members = (t.members || []).map(function (m) {
      var rowOwner = m.role === "owner";
      var acts = "";
      if (!rowOwner) {
        if (isOwner) {
          acts += m.role === "admin"
            ? '<button class="tm-x" data-act="demote" data-team="' + oid + '" data-user="' + esc(m.user_id) + '">Remove admin</button>'
            : '<button class="tm-x" data-act="promote" data-team="' + oid + '" data-user="' + esc(m.user_id) + '">Make admin</button>';
          acts += '<button class="tm-x" data-act="transfer" data-team="' + oid + '" data-user="' + esc(m.user_id) + '" data-email="' + esc(m.email || "") + '">Make owner</button>';
        }
        acts += '<button class="tm-x" data-act="remove" data-team="' + oid + '" data-user="' + esc(m.user_id) + '" data-email="' + esc(m.email || "") + '">Remove</button>';
      }
      return '<div class="tm-row">' +
        '<div class="tm-av">' + esc(initials(m.email)) + "</div>" +
        '<div class="tm-who"><div class="em">' + esc(m.email || m.user_id) + "</div>" +
        '<div class="rl">' + esc(cap(m.role)) + " &middot; joined " + esc(fmtDate(m.joined_at)) + "</div></div>" +
        (rowOwner ? '<span class="tm-pill owner">Owner</span>' : acts) +
        "</div>";
    }).join("");

    var invites = (t.invites || []).map(function (iv) {
      return '<div class="tm-row">' +
        '<div class="tm-av">' + esc(initials(iv.email)) + "</div>" +
        '<div class="tm-who"><div class="em">' + esc(iv.email) + "</div>" +
        '<div class="rl">Invited &middot; expires ' + esc(fmtDate(iv.expires_at)) + "</div></div>" +
        '<span class="tm-pill pending">Pending</span>' +
        '<button class="tm-x" data-act="resend" data-team="' + oid + '" data-email="' + esc(iv.email) + '">Resend</button>' +
        '<button class="tm-x" data-act="revoke" data-team="' + oid + '" data-email="' + esc(iv.email) + '">Cancel</button>' +
        "</div>";
    }).join("");

    var seatCtl = isOwner
      ? '<div class="tm-invite" style="margin-top:8px">' +
        '<input type="number" min="' + (s.total + 1) + '" max="100" value="' + (s.total + 1) + '" data-seat-input="' + oid + '" style="max-width:90px" aria-label="New seat total">' +
        '<button class="ghost" data-act="addseats" data-team="' + oid + '">Add seats</button>' +
        "</div>" +
        '<p class="tm-note">Seat additions bill the prorated difference now at $115/seat/yr. Reductions apply at renewal via Manage billing.</p>'
      : "";

    return '<div class="card" data-teamcard="' + oid + '">' +
      '<div class="tm-h"><h2>' + esc(t.org.name) + "</h2>" +
      (isOwner ? '<a class="ghost" data-act="portal" data-team="' + oid + '" href="#">Manage billing</a>' : '<span class="tm-pill">Admin</span>') +
      "</div>" + statusNote +
      '<div class="tm-seatbar"><div class="tm-seatfill" style="width:' + pct + '%"></div></div>' +
      '<div class="tm-seatnums"><span><b>' + s.assigned + "</b> of <b>" + s.total + "</b> seats used</span>" +
      "<span>" + s.available + " available</span></div>" + seatCtl +

      '<div class="tm-h"><h2>Invite people</h2></div>' +
      '<div class="tm-invite">' +
      '<input type="text" placeholder="one@co.com, two@co.com" data-invite-input="' + oid + '" ' + (s.available <= 0 ? "disabled " : "") + ">" +
      '<button class="primary" data-act="invite" data-team="' + oid + '"' + (s.available <= 0 ? " disabled" : "") + ">Send invites</button>" +
      "</div>" +
      (s.available <= 0
        ? '<p class="tm-note">All seats are assigned. Remove a member or add seats to invite more.</p>'
        : '<p class="tm-note">Paste one or many emails (comma or space separated). Each person gets a free account with All-Access Pro while they hold a seat.</p>') +
      '<p class="tm-msg" data-msg="' + oid + '"></p>' +

      '<div class="tm-h"><h2>Members</h2></div>' + (members || '<p class="tm-sub">No members yet.</p>') +
      (invites ? '<div class="tm-h"><h2>Pending invites</h2></div>' + invites : "") +

      '<div class="tm-h"><h2>Team progress</h2>' +
      '<a class="ghost" data-act="csv" data-team="' + oid + '" href="#">Download CSV</a></div>' +
      '<p class="tm-note">Members are told admins can see this. Sorted by XP.</p>' +
      '<div data-progress="' + oid + '"><p class="tm-sub">Loading progress&hellip;</p></div>' +
      "</div>";
  }

  function renderProgress(orgId) {
    var host = root.querySelector('[data-progress="' + cssEsc(orgId) + '"]');
    var rows = state.progress[orgId];
    if (!host || !rows) return;
    if (!rows.length) { host.innerHTML = '<p class="tm-sub">No members yet.</p>'; return; }
    var html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
      '<thead><tr>' +
      ["Member", "XP", "Solved", "Certs", "Streak", "Last active"].map(function (h, i) {
        return '<th style="text-align:' + (i === 0 ? "left" : "right") + ';padding:8px 10px;border-bottom:1px solid var(--line);color:var(--muted);font-weight:600">' + h + "</th>";
      }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) {
        var name = r.display_name || (r.email ? r.email.split("@")[0] : r.user_id);
        return "<tr>" +
          '<td style="padding:8px 10px;border-bottom:1px solid var(--line)">' + esc(name) +
          (r.email ? ' <span style="color:var(--muted)">&middot; ' + esc(r.email) + "</span>" : "") + "</td>" +
          tdNum(r.total_xp) + tdNum(r.exercises_solved) + tdNum(r.certificates) +
          tdNum(r.current_streak_days ? r.current_streak_days + "d" : "0") +
          tdNum(r.last_active_date || "&mdash;") +
          "</tr>";
      }).join("") + "</tbody></table></div>";
    host.innerHTML = html;
    function tdNum(v) { return '<td style="padding:8px 10px;border-bottom:1px solid var(--line);text-align:right;font-variant-numeric:tabular-nums">' + v + "</td>"; }
  }

  function msg(teamId, text, kind) {
    var el = root.querySelector('[data-msg="' + cssEsc(teamId) + '"]');
    if (el) { el.textContent = text; el.className = "tm-msg " + (kind || ""); }
  }

  function wire() {
    root.querySelectorAll("[data-act]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var act = el.getAttribute("data-act");
        var teamId = el.getAttribute("data-team");
        var user = el.getAttribute("data-user");
        var email = el.getAttribute("data-email");
        if (act !== "csv" && act !== "portal") e.preventDefault();
        if (act === "invite") doInvite(teamId);
        else if (act === "remove") doRemove(teamId, user, email);
        else if (act === "revoke") doRevoke(teamId, email);
        else if (act === "resend") doResend(teamId, email);
        else if (act === "promote") doRole(teamId, user, "admin");
        else if (act === "demote") doRole(teamId, user, "member");
        else if (act === "transfer") doTransfer(teamId, user, email);
        else if (act === "addseats") doSeats(teamId);
        else if (act === "portal") { e.preventDefault(); doPortal(teamId); }
        else if (act === "csv") { e.preventDefault(); doCsv(teamId); }
      });
    });
    root.querySelectorAll("[data-invite-input]").forEach(function (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); doInvite(inp.getAttribute("data-invite-input")); }
      });
    });
  }

  function doInvite(teamId) {
    var inp = root.querySelector('[data-invite-input="' + cssEsc(teamId) + '"]');
    if (!inp) return;
    var emails = (inp.value || "").split(/[\s,;]+/).map(function (e) { return e.trim(); }).filter(Boolean);
    if (!emails.length) return;
    msg(teamId, "Sending…", "");
    api("/api/teams/" + encodeURIComponent(teamId) + "/invites", { method: "POST", body: { emails: emails } })
      .then(function (r) {
        if (r.status !== 200 || !r.json || !r.json.results) {
          msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not send invites.", "err");
          return;
        }
        var counts = {};
        r.json.results.forEach(function (res) { counts[res.status] = (counts[res.status] || 0) + 1; });
        var parts = [];
        if (counts.invited) parts.push(counts.invited + " invited");
        if (counts.already_member) parts.push(counts.already_member + " already on the team");
        if (counts.already_pending) parts.push(counts.already_pending + " already pending");
        if (counts.no_seats) parts.push(counts.no_seats + " skipped (no seats)");
        if (counts.invalid) parts.push(counts.invalid + " invalid");
        msg(teamId, parts.join(" · ") || "Done.", counts.invited ? "ok" : "err");
        inp.value = "";
        load();
      })
      .catch(function () { msg(teamId, "Network error. Try again.", "err"); });
  }

  function doRemove(teamId, userId, email) {
    if (!confirm("Remove " + (email || "this member") + " from the team? Their seat frees up immediately; their progress is kept.")) return;
    api("/api/teams/" + encodeURIComponent(teamId) + "/members/" + encodeURIComponent(userId), { method: "DELETE" })
      .then(function (r) {
        if (r.status !== 200) msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not remove.", "err");
        load();
      })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doRevoke(teamId, email) {
    if (!confirm("Cancel the invite to " + email + "?")) return;
    api("/api/teams/" + encodeURIComponent(teamId) + "/invites", { method: "DELETE", body: { email: email } })
      .then(function () { load(); })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doResend(teamId, email) {
    msg(teamId, "Resending…", "");
    api("/api/teams/" + encodeURIComponent(teamId) + "/invites", { method: "PUT", body: { email: email } })
      .then(function (r) {
        if (r.status === 200 && r.json && r.json.ok) {
          msg(teamId, r.json.emailed ? "Invite re-sent to " + email + "." : "Invite refreshed, but the email could not be sent. Share the link from their original invite or try later.", r.json.emailed ? "ok" : "err");
        } else {
          msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not resend.", "err");
        }
      })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doRole(teamId, userId, role) {
    api("/api/teams/" + encodeURIComponent(teamId) + "/members/" + encodeURIComponent(userId), { method: "POST", body: { role: role } })
      .then(function (r) {
        if (r.status !== 200) msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not change role.", "err");
        load();
      })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doTransfer(teamId, userId, email) {
    if (!confirm("Make " + (email || "this member") + " the team owner? They take over billing; you stay on the team as an admin.")) return;
    api("/api/teams/" + encodeURIComponent(teamId) + "/transfer", { method: "POST", body: { user_id: userId } })
      .then(function (r) {
        if (r.status !== 200) msg(teamId, (r.json && r.json.error && r.json.error.message) || "Could not transfer ownership.", "err");
        load();
      })
      .catch(function () { msg(teamId, "Network error.", "err"); });
  }

  function doSeats(teamId) {
    var inp = root.querySelector('[data-seat-input="' + cssEsc(teamId) + '"]');
    if (!inp) return;
    var seats = parseInt(inp.value, 10);
    if (!seats) return;
    msg(teamId, "Checking price…", "");
    api("/api/teams/" + encodeURIComponent(teamId) + "/seats", { method: "POST", body: { seats: seats, preview: true } })
      .then(function (r) {
        if (r.status !== 200 || !r.json || !r.json.ok) {
          var m = (r.json && r.json.error && r.json.error.message) || "Could not price the change.";
          if (r.json && r.json.error && r.json.error.code === "paddle_error") {
            m = "Could not reach billing right now. You can also add seats from Manage billing.";
          }
          msg(teamId, m, "err");
          return;
        }
        var chargeTxt = r.json.charge_now
          ? "You will be charged the prorated difference now (" + (parseInt(r.json.charge_now, 10) / 100).toFixed(2) + " " + (r.json.currency || "USD") + ")."
          : "The prorated difference is billed now.";
        if (!confirm("Change to " + seats + " seats? " + chargeTxt)) { msg(teamId, "", ""); return; }
        api("/api/teams/" + encodeURIComponent(teamId) + "/seats", { method: "POST", body: { seats: seats } })
          .then(function (r2) {
            if (r2.status === 200 && r2.json && r2.json.ok) { msg(teamId, "Seats updated to " + seats + ".", "ok"); load(); }
            else msg(teamId, (r2.json && r2.json.error && r2.json.error.message) || "Could not update seats.", "err");
          });
      })
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

  function doCsv(teamId) {
    fetch("/api/teams/" + encodeURIComponent(teamId) + "/progress?format=csv", {
      headers: { Authorization: "Bearer " + TOKEN },
    }).then(function (r) { return r.ok ? r.blob() : null; }).then(function (blob) {
      if (!blob) { msg(teamId, "Could not export CSV.", "err"); return; }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "team-progress.csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }).catch(function () { msg(teamId, "Could not export CSV.", "err"); });
  }

  load();
})();
