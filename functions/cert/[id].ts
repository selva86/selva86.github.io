// GET /cert/<public_id>
//
// Public verify page for a certificate. Renders self-contained HTML — no
// external image requests for the cert artwork (badge SVG is inlined),
// minimal CSS (also inlined). Print-friendly so browser-print => PDF
// gives a clean credential.
//
// Returns:
//   200 with HTML  -> active cert
//   404 with HTML  -> unknown / unlisted / revoked (no enumeration leaks)
//
// noindex meta keeps personal cert pages out of search.

import type { Env, RequestData } from "../_middleware";
import { getCertificateByPublicId } from "../_lib/db";
import { getTrack, getIssuer, isValidPublicId, type Track } from "../_lib/tracks";
import { renderBadgeSvg, renderSignatureSvg } from "../_lib/cert-svg";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function fmtDate(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Certificate not found &middot; r-statistics.co</title>
<meta name="robots" content="noindex,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="shortcut icon" href="/screenshots/iconb-64.png">
<style>
  body{font-family:'IBM Plex Sans',-apple-system,sans-serif;background:#f8f9fb;color:#0a0d14;
    display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
  .card{background:#fff;border:1px solid #d4d9e3;border-radius:12px;padding:48px 36px;
    max-width:480px;text-align:center;box-shadow:0 4px 16px -4px rgba(13,20,38,.08)}
  h1{font-family:'IBM Plex Serif',Georgia,serif;font-weight:600;font-size:24px;margin:0 0 8px;color:#0a0d14}
  p{color:#4b5260;font-size:15px;line-height:1.6;margin:0 0 20px}
  a{color:#2056d2;text-decoration:none;font-weight:500}
  a:hover{text-decoration:underline}
</style>
</head><body>
<div class="card">
  <h1>Certificate not found</h1>
  <p>This certificate could not be located. It may have been unlisted by the holder, never existed, or the URL was mistyped.</p>
  <a href="/certifications">Browse r-statistics.co certifications &rarr;</a>
</div>
</body></html>`;
}

function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300", // 5min — cert data rarely changes
    },
  });
}

export const onRequestGet: PagesFunction<Env, "id", RequestData> = async (context) => {
  const publicId = decodeURIComponent(context.params.id as string);
  if (!isValidPublicId(publicId)) return htmlResponse(notFoundHtml(), 404);

  const cert = await getCertificateByPublicId(context.env.DB, publicId);
  if (!cert || cert.status !== "active") return htmlResponse(notFoundHtml(), 404);

  const track = getTrack(cert.track);
  const issuer = getIssuer();
  if (!track) return htmlResponse(notFoundHtml(), 404);

  const origin = new URL(context.request.url).origin;
  const verifyUrl = `${origin}/cert/${cert.public_id}`;
  const issuedAtIso = new Date(cert.issued_at * 1000).toISOString();
  const issuedAtPretty = fmtDate(cert.issued_at);
  const issueYear = new Date(cert.issued_at * 1000).getUTCFullYear();
  const issueMonth = new Date(cert.issued_at * 1000).getUTCMonth() + 1;

  const recipientName = cert.recipient_name || "Learner";
  const trackName = cert.track_name || track.name;
  const skills: Array<{ name: string; level?: string }> = (() => {
    try {
      const arr = cert.skills_json ? JSON.parse(cert.skills_json) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  })();
  const evidence: string[] = (() => {
    try {
      const arr = cert.evidence_json ? JSON.parse(cert.evidence_json) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  })();

  // LinkedIn "Add to Profile" pre-fill (documented param contract):
  //   https://www.linkedin.com/help/linkedin/answer/a541960
  const linkedInUrl =
    `https://www.linkedin.com/profile/add?` +
    `startTask=CERTIFICATION_NAME` +
    `&name=${encodeURIComponent(trackName + " — r-statistics.co")}` +
    `&organizationName=${encodeURIComponent("r-statistics.co")}` +
    `&issueYear=${issueYear}&issueMonth=${issueMonth}` +
    `&certUrl=${encodeURIComponent(verifyUrl)}` +
    `&certId=${encodeURIComponent(cert.public_id || "")}`;

  const twitterText = `I just earned the ${trackName} certificate from r-statistics.co. Verify:`;
  const twitterUrl =
    `https://twitter.com/intent/tweet?` +
    `text=${encodeURIComponent(twitterText)}` +
    `&url=${encodeURIComponent(verifyUrl)}`;

  const badgeSvg = renderBadgeSvg(track);
  const signatureSvg = renderSignatureSvg();

  const skillChips = skills.map(s => {
    const level = s.level ? ` &middot; <span class="chip-level">${escapeHtml(s.level)}</span>` : "";
    return `<span class="skill-chip">${escapeHtml(s.name)}${level}</span>`;
  }).join("");

  const evidenceList = evidence.map(href => {
    const label = href.replace(/^\//, "").replace(/\.html?$/, "").replace(/-/g, " ");
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
  }).join("");

  // OG defaults: site-wide social preview image. v1.1 swaps in a per-cert PNG.
  const ogTitle = `${trackName} — Certificate of Completion`;
  const ogDesc = `${recipientName} earned the ${trackName} certificate from r-statistics.co on ${issuedAtPretty}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(trackName)} &middot; Certificate ${escapeHtml(cert.public_id || "")}</title>
<meta name="description" content="${escapeHtml(ogDesc)}">
<meta name="robots" content="noindex,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="shortcut icon" href="/screenshots/iconb-64.png">
<link rel="canonical" href="${escapeHtml(verifyUrl)}">
<meta property="og:title" content="${escapeHtml(ogTitle)}">
<meta property="og:description" content="${escapeHtml(ogDesc)}">
<meta property="og:url" content="${escapeHtml(verifyUrl)}">
<meta property="og:type" content="profile">
<meta property="og:image" content="${escapeHtml(origin)}/screenshots/og-default.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=Sacramento&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#f4f6f9;--ink:#0a0d14;--ink-2:#1f2533;--mute:#4b5260;--faint:#6b7280;
    --line:#e4e7ee;--border:#d4d9e3;--navy:#1c2c4f;--acc:#2056d2;--acc-h:#1842a8;
    --acc-soft:#e9efff;--success:#137a3e;--success-soft:#dff1e3;
    --paper:#fff;--paper-edge:#eef1f5;
    --r:10px;--r-sm:6px;--r-md:13px;--r-lg:18px;
  }
  body{font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,sans-serif;
    color:var(--ink);background:var(--bg);min-height:100vh;font-size:15px;
    line-height:1.55;-webkit-font-smoothing:antialiased}
  a{color:var(--acc);text-decoration:none}
  a:hover{text-decoration:underline}

  /* Top status bar (above the cert sheet) — hidden on print. */
  .topbar{
    background:#fff;border-bottom:1px solid var(--line);padding:14px 24px;
    display:flex;align-items:center;justify-content:space-between;
    position:sticky;top:0;z-index:5;
  }
  .topbar-brand{display:inline-flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;
    font-weight:600;font-size:14px;color:var(--ink);text-decoration:none}
  .topbar-brand .mark{width:28px;height:28px;border-radius:7px;
    background:linear-gradient(135deg,var(--navy),#2d4173);color:#fff;
    display:flex;align-items:center;justify-content:center;
    font-family:'IBM Plex Serif',Georgia,serif;font-style:italic;font-weight:700;
    font-size:16px;letter-spacing:-.04em}
  .topbar-brand .co{color:var(--faint)}
  .verified-pill{display:inline-flex;align-items:center;gap:6px;
    padding:6px 12px;background:var(--success-soft);color:var(--success);
    border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
  .verified-pill svg{flex:none}

  /* Page wrapper */
  .wrap{max-width:880px;margin:32px auto;padding:0 20px 60px}

  /* The certificate sheet itself */
  .sheet{
    background:var(--paper);border:1px solid var(--border);border-radius:var(--r-lg);
    padding:56px 56px 48px;text-align:center;position:relative;
    box-shadow:0 24px 48px -24px rgba(13,20,38,.18),0 6px 12px -6px rgba(13,20,38,.06);
    overflow:hidden;
  }
  .sheet::before,.sheet::after{content:"";position:absolute;left:0;right:0;height:6px;
    background:linear-gradient(90deg,${track.color_primary},${track.color_accent},${track.color_primary})}
  .sheet::before{top:0}
  .sheet::after{bottom:0}

  .badge-wrap{width:200px;height:200px;margin:0 auto 24px;display:block}
  .badge-wrap svg{display:block;width:100%;height:100%}

  .preamble{font-family:'IBM Plex Sans',sans-serif;color:var(--mute);font-size:13px;
    text-transform:uppercase;letter-spacing:.18em;margin-bottom:8px}
  .recipient{font-family:'IBM Plex Serif',Georgia,serif;font-weight:600;font-style:italic;
    font-size:44px;letter-spacing:-.012em;line-height:1.1;color:var(--ink);
    margin:0 0 20px;padding:0 20px}
  .has-completed{font-family:'IBM Plex Sans',sans-serif;color:var(--mute);font-size:13px;
    text-transform:uppercase;letter-spacing:.18em;margin-bottom:10px}
  .track-name{font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;
    font-size:32px;letter-spacing:-.018em;line-height:1.15;color:${track.color_primary};
    margin:0 0 12px}
  .track-tagline{font-size:14.5px;color:var(--mute);max-width:540px;margin:0 auto 28px;
    line-height:1.6}

  .meta-row{display:flex;justify-content:center;gap:48px;margin-bottom:32px;
    padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
  .meta-cell{display:flex;flex-direction:column;align-items:center;gap:4px}
  .meta-label{font-size:11px;color:var(--faint);text-transform:uppercase;letter-spacing:.12em;font-weight:600}
  .meta-value{font-family:'IBM Plex Mono',monospace;font-size:13.5px;color:var(--ink);font-weight:500}

  .skills-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:0 auto 28px;
    max-width:660px}
  .skill-chip{display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;
    background:var(--paper-edge);color:var(--ink-2);font-size:12px;font-weight:500;
    border:1px solid var(--border)}
  .skill-chip .chip-level{color:var(--mute);font-weight:400;margin-left:4px}

  .sig-row{display:flex;justify-content:center;align-items:flex-end;margin:24px auto 6px;
    max-width:280px}
  .sig-row svg{width:260px;height:60px}
  .sig-caption{text-align:center;font-size:12px;color:var(--faint);
    font-family:'IBM Plex Mono',monospace;letter-spacing:.04em;margin-bottom:4px}

  /* Actions below the sheet — hidden on print. */
  .actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:36px 0}
  .act{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;
    background:#fff;color:var(--ink);border:1px solid var(--border);border-radius:var(--r-sm);
    font-family:inherit;font-size:13.5px;font-weight:500;cursor:pointer;text-decoration:none;
    transition:border-color .15s,background .15s}
  .act:hover{border-color:var(--ink-2);background:var(--paper-edge);text-decoration:none}
  .act svg{flex:none}
  .act.primary{background:var(--acc);color:#fff;border-color:var(--acc)}
  .act.primary:hover{background:var(--acc-h);border-color:var(--acc-h)}

  /* Trust block + evidence */
  .trust{background:#fff;border:1px solid var(--line);border-radius:var(--r-md);
    padding:24px 28px;margin-top:24px}
  .trust h3{font-family:'IBM Plex Serif',Georgia,serif;font-weight:600;font-size:16px;
    margin:0 0 8px;color:var(--ink)}
  .trust p{font-size:13.5px;color:var(--mute);line-height:1.6;margin:0 0 10px}
  .trust .verify-url{font-family:'IBM Plex Mono',monospace;font-size:12.5px;
    background:var(--paper-edge);padding:8px 12px;border-radius:var(--r-sm);
    word-break:break-all;display:inline-block;margin-top:4px;color:var(--ink-2)}

  .evidence{margin-top:16px}
  .evidence summary{cursor:pointer;font-size:13px;color:var(--acc);font-weight:500;
    list-style:none;outline:none}
  .evidence summary::-webkit-details-marker{display:none}
  .evidence summary::before{content:"\\25B8";display:inline-block;margin-right:6px;
    transition:transform .15s;font-size:10px}
  .evidence[open] summary::before{transform:rotate(90deg)}
  .evidence ul{margin:12px 0 0 22px;padding:0;font-size:13px;color:var(--mute);line-height:1.9}

  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
    background:var(--ink);color:#fff;padding:10px 18px;border-radius:var(--r-sm);
    font-size:13px;opacity:0;transition:transform .25s,opacity .25s;z-index:60}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

  /* Print: hide everything but the certificate sheet, fit one page. */
  @media print{
    body{background:#fff}
    .topbar,.actions,.trust,.toast,.evidence{display:none!important}
    .wrap{margin:0;padding:0;max-width:none}
    .sheet{box-shadow:none;border:none;padding:36px 48px;page-break-inside:avoid}
    .recipient{font-size:38px}
    .track-name{font-size:28px}
  }

  /* Narrow viewports */
  @media (max-width: 640px){
    .sheet{padding:40px 24px 32px}
    .recipient{font-size:32px;padding:0}
    .track-name{font-size:24px}
    .meta-row{flex-direction:column;gap:14px;align-items:center}
    .badge-wrap{width:150px;height:150px}
  }
</style>
</head>
<body>

<header class="topbar">
  <a class="topbar-brand" href="/"><span class="mark">R</span>r-statistics<span class="co">.co</span></a>
  <span class="verified-pill" title="Verified by r-statistics.co">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    Verified
  </span>
</header>

<div class="wrap">

  <section class="sheet" aria-label="Certificate of completion">
    <div class="badge-wrap" aria-hidden="false">${badgeSvg}</div>
    <div class="preamble">Certificate of Completion</div>
    <h1 class="recipient">${escapeHtml(recipientName)}</h1>
    <div class="has-completed">has successfully completed the</div>
    <h2 class="track-name">${escapeHtml(trackName)}</h2>
    <p class="track-tagline">${escapeHtml(track.tagline || track.description)}</p>

    <div class="meta-row">
      <div class="meta-cell">
        <span class="meta-label">Issued</span>
        <span class="meta-value">${escapeHtml(issuedAtPretty)}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Certificate ID</span>
        <span class="meta-value">${escapeHtml(cert.public_id || "")}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Issued by</span>
        <span class="meta-value">${escapeHtml(issuer.name)}</span>
      </div>
    </div>

    ${skillChips ? `<div class="skills-row" aria-label="Skills demonstrated">${skillChips}</div>` : ""}

    <div class="sig-caption">Signed</div>
    <div class="sig-row">${signatureSvg}</div>
  </section>

  <div class="actions">
    <a class="act primary" href="${escapeHtml(linkedInUrl)}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14C2.2 0 0 2.2 0 5v14c0 2.8 2.2 5 5 5h14c2.8 0 5-2.2 5-5V5c0-2.8-2.2-5-5-5zM8 19H5V8h3v11zM6.5 6.7C5.5 6.7 4.7 5.9 4.7 4.9c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8c0 1-.8 1.8-1.8 1.8zM20 19h-3v-5.6c0-3.4-4-3.1-4 0V19h-3V8h3v1.8c1.4-2.6 7-2.8 7 2.5V19z"/></svg>
      Add to LinkedIn
    </a>
    <a class="act" href="${escapeHtml(twitterUrl)}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      Post on X
    </a>
    <button class="act" type="button" onclick="copyUrl(this)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy link
    </button>
    <button class="act" type="button" onclick="window.print()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print / save PDF
    </button>
    <a class="act" href="/api/cert/${escapeHtml(cert.public_id || "")}/badge.json" download="${escapeHtml(cert.public_id || "")}.json">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Open Badges JSON
    </a>
  </div>

  <section class="trust">
    <h3>How to verify this credential</h3>
    <p>
      Anyone can verify this certificate by visiting the URL below. The
      r-statistics.co server will return this page only while the holder
      keeps the credential listed; an unlisted or revoked credential
      returns a 404, so a recipient can independently confirm their cert
      is in good standing.
    </p>
    <p>
      <span class="verify-url">${escapeHtml(verifyUrl)}</span>
    </p>
    ${evidence.length ? `<details class="evidence"><summary>View evidence (${evidence.length} exercise hubs completed)</summary><ul>${evidenceList}</ul></details>` : ""}
  </section>

</div>

<div class="toast" id="toast">Link copied</div>

<script>
function copyUrl(btn){
  const url = ${JSON.stringify(verifyUrl)};
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(showToast).catch(()=>{ window.prompt('Copy this URL', url); });
  } else {
    window.prompt('Copy this URL', url);
  }
}
function showToast(){
  const t = document.getElementById('toast');
  if (!t) return;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove('show'), 2200);
}
</script>

<!-- Embed Open Badges 3.0 JSON-LD in <script type="application/ld+json"> for
     resume-parsers and AI tools that crawl the verify URL directly. -->
<script type="application/ld+json">
${JSON.stringify({
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
  ],
  id: verifyUrl,
  type: ["VerifiableCredential", "OpenBadgeCredential"],
  issuer: { id: issuer.id, type: ["Profile"], name: issuer.name, url: issuer.url },
  validFrom: issuedAtIso,
  name: `${trackName} Certificate`,
  credentialSubject: {
    type: ["AchievementSubject"],
    id: verifyUrl + "#subject",
    name: recipientName,
    achievement: {
      id: `${issuer.url}/certifications#${cert.track}`,
      type: ["Achievement"],
      name: trackName,
      description: track.description,
    },
  },
}, null, 2)}
</script>
</body>
</html>`;

  return htmlResponse(html, 200);
};
