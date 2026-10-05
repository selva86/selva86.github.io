// GET /cert/<public_id>
//
// Public verify page for a certificate. Renders self-contained HTML: the
// certificate itself comes from _lib/cert-design.ts (the 2026-10 design, one
// source for every surface), styles are inlined. Print-friendly, so
// browser-print gives a one-page landscape PDF of the certificate.
//
// Returns:
//   200 with HTML  -> active cert
//   404 with HTML  -> unknown / unlisted / revoked (no enumeration leaks)
//
// noindex meta keeps personal cert pages out of search.

import type { Env, RequestData } from "../_middleware";
import { getCertificateByPublicId } from "../_lib/db";
import { getTrack, getIssuer, isValidPublicId } from "../_lib/tracks";
import { CERT_CSS, CERT_FIT_JS, CERT_FONTS_HREF, certMeta, fmtCertDate, renderCertificateHtml } from "../_lib/cert-design";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

const HEAD_ICONS = `<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#1F6B4A">`;

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Certificate not found &middot; r-statistics.co</title>
<meta name="robots" content="noindex,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
${HEAD_ICONS}
<link href="${CERT_FONTS_HREF}" rel="stylesheet">
<style>
  body{font-family:'Source Sans 3',-apple-system,sans-serif;background:#FAFBFA;color:#151816;
    display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
  .card{background:#fff;border:1px solid #E3E6E4;border-radius:16px;padding:48px 36px;
    max-width:480px;text-align:center}
  h1{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:24px;margin:0 0 8px}
  p{color:#59605C;font-size:16px;line-height:1.6;margin:0 0 20px}
  a{color:#1F6B4A;text-decoration:none;font-weight:600}
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
      "Cache-Control": "public, max-age=300", // 5min, cert data rarely changes
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
  const issuedAtPretty = fmtCertDate(cert.issued_at);
  const issueYear = new Date(cert.issued_at * 1000).getUTCFullYear();
  const issueMonth = new Date(cert.issued_at * 1000).getUTCMonth() + 1;

  const recipientName = cert.recipient_name || "Learner";
  const trackName = cert.track_name || track.name;
  const meta = certMeta(track.id, trackName, track);
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
    `&name=${encodeURIComponent(trackName)}` +
    `&organizationName=${encodeURIComponent("r-statistics.co")}` +
    `&issueYear=${issueYear}&issueMonth=${issueMonth}` +
    `&certUrl=${encodeURIComponent(verifyUrl)}` +
    `&certId=${encodeURIComponent(cert.public_id || "")}`;

  const twitterText = `I just earned the ${trackName} certificate from r-statistics.co. Verify:`;
  const twitterUrl =
    `https://twitter.com/intent/tweet?` +
    `text=${encodeURIComponent(twitterText)}` +
    `&url=${encodeURIComponent(verifyUrl)}`;

  const certHtml = renderCertificateHtml({
    holder: recipientName,
    title: trackName,
    code: meta.code,
    mastery: meta.mastery,
    issuedAt: cert.issued_at,
    score: cert.score ?? null,
    credId: cert.public_id || "",
  });

  const skillChips = skills.map(s => {
    const level = s.level ? ` &middot; <span class="chip-level">${escapeHtml(s.level)}</span>` : "";
    return `<span class="skill-chip">${escapeHtml(s.name)}${level}</span>`;
  }).join("");

  const evidenceList = evidence.map(href => {
    const label = href.replace(/^\//, "").replace(/\.html?$/, "").replace(/-/g, " ");
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
  }).join("");

  // Social preview: the per-track image (screenshots/og-cert-<track>.png, Scripts/gen_cert_og.mjs).
  const ogTitle = `${trackName} certificate · r-statistics.co`;
  const ogDesc = `${recipientName} earned the ${trackName} certificate from r-statistics.co on ${issuedAtPretty}.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(trackName)} &middot; Certificate ${escapeHtml(cert.public_id || "")}</title>
<meta name="description" content="${escapeHtml(ogDesc)}">
<meta name="robots" content="noindex,follow">
<meta name="viewport" content="width=device-width, initial-scale=1">
${HEAD_ICONS}
<link rel="canonical" href="${escapeHtml(verifyUrl)}">
<meta property="og:title" content="${escapeHtml(ogTitle)}">
<meta property="og:description" content="${escapeHtml(ogDesc)}">
<meta property="og:url" content="${escapeHtml(verifyUrl)}">
<meta property="og:type" content="profile">
<meta property="og:image" content="${escapeHtml(origin)}/screenshots/og-cert-${escapeHtml(track.id)}.png?v=3">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${CERT_FONTS_HREF}" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box}
  :root{
    --bg:#FAFBFA;--ink:#151816;--ink2:#363D39;--mute:#59605C;--faint:#868C89;
    --line:#E3E6E4;--line2:#ECEEED;--brand:#1F6B4A;--brand-h:#17553A;--deep:#0F3F2A;--tint:#E5F3EA;
  }
  html,body{margin:0;padding:0}
  body{font-family:'Source Sans 3',-apple-system,BlinkMacSystemFont,sans-serif;
    color:var(--ink);background:var(--bg);min-height:100vh;font-size:16px;
    line-height:1.55;-webkit-font-smoothing:antialiased}
  a{color:var(--brand);text-decoration:none}
  a:hover{color:var(--brand-h);text-decoration:underline}

  /* Top bar (above the certificate), hidden on print. */
  .topbar{background:#fff;border-bottom:1px solid var(--line);padding:14px 24px;
    display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5}
  .topbar-brand{display:inline-flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans',sans-serif;
    font-weight:700;font-size:16px;color:var(--ink);text-decoration:none}
  .topbar-brand:hover{color:var(--ink);text-decoration:none}
  .topbar-brand .mark{display:inline-block;flex:none;width:28px;height:28px;background:url(/logo-mark.svg) center/100% 100% no-repeat;color:transparent;font-size:0}
  .verified-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--tint);
    color:#226B47;border-radius:999px;font-size:14px;font-weight:600}
  .verified-pill svg{flex:none}

  .wrap{max-width:1180px;margin:32px auto;padding:0 20px 60px}

  /* The certificate */
  .sheet{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff;
    box-shadow:0 2px 0 var(--line2),0 44px 80px -40px rgba(10,40,25,.40)}
${CERT_CSS}

  /* Actions below the certificate, hidden on print. */
  .actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:32px 0}
  .act{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#fff;color:var(--ink);
    border:1px solid #D5DAD7;border-radius:999px;font-family:inherit;font-size:15px;font-weight:600;
    cursor:pointer;text-decoration:none;transition:border-color .15s,background .15s}
  .act:hover{border-color:var(--ink);color:var(--ink);text-decoration:none}
  .act svg{flex:none}
  .act.primary{background:var(--brand);color:#fff;border-color:var(--brand)}
  .act.primary:hover{background:var(--brand-h);border-color:var(--brand-h);color:#fff}

  /* Trust block, skills, evidence */
  .trust{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px 30px;margin-top:8px}
  .trust h3{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:18px;margin:0 0 8px}
  .trust p{font-size:15.5px;color:var(--mute);line-height:1.6;margin:0 0 10px}
  .trust .verify-url{font-size:15px;font-weight:600;background:var(--bg);border:1px solid var(--line2);
    padding:8px 12px;border-radius:8px;word-break:break-all;display:inline-block;margin-top:4px;color:var(--ink2)}
  .skills-row{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 4px}
  .skill-chip{display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;background:var(--bg);
    color:var(--ink2);font-size:14px;border:1px solid var(--line)}
  .skill-chip .chip-level{color:var(--mute);margin-left:4px}
  .evidence{margin-top:16px}
  .evidence summary{cursor:pointer;font-size:15px;color:var(--brand);font-weight:600;list-style:none;outline:none}
  .evidence summary::-webkit-details-marker{display:none}
  .evidence summary::before{content:"\\25B8";display:inline-block;margin-right:6px;transition:transform .15s;font-size:11px}
  .evidence[open] summary::before{transform:rotate(90deg)}
  .evidence ul{margin:12px 0 0 22px;padding:0;font-size:15px;color:var(--mute);line-height:1.9}

  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--ink);
    color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;opacity:0;transition:transform .25s,opacity .25s;z-index:60}
  .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

  /* Print: the certificate alone, scaled onto one landscape page (A4 or Letter). */
  @page{size:landscape;margin:0}
  @media print{
    html,body{background:#fff}
    .topbar,.actions,.trust,.toast{display:none!important}
    .wrap{margin:0;padding:0;max-width:none;height:100vh;display:flex;align-items:center;justify-content:center}
    .sheet{border:0;border-radius:0;box-shadow:none;zoom:.82}
    .rsc-frame{width:1280px;height:800px;aspect-ratio:auto}
    .rsc{transform:none}
  }

  @media (max-width:640px){
    .wrap{margin:20px auto;padding:0 12px 48px}
    .trust{padding:22px 20px}
  }
</style>
</head>
<body>

<header class="topbar">
  <a class="topbar-brand" href="/"><span class="mark">R</span>r-statistics.co</a>
  <span class="verified-pill" title="Verified by r-statistics.co">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    Verified
  </span>
</header>

<div class="wrap">

  <section class="sheet" aria-label="Certificate">${certHtml}</section>

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
      r-statistics.co server returns this page only while the holder keeps the
      credential listed; an unlisted or revoked credential returns a 404, so
      anyone can confirm the certificate is in good standing.
    </p>
    <p><span class="verify-url">${escapeHtml(verifyUrl)}</span></p>
    ${skillChips ? `<div class="skills-row" aria-label="Skills demonstrated">${skillChips}</div>` : ""}
    <p style="margin-top:14px"><a href="/verify/" style="font-weight:600">Verify another credential &rarr;</a></p>
    ${evidence.length ? `<details class="evidence"><summary>View evidence (${evidence.length} lessons with graded work)</summary><ul>${evidenceList}</ul></details>` : ""}
  </section>

</div>

<div class="toast" id="toast">Link copied</div>

<script>
${CERT_FIT_JS}
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
