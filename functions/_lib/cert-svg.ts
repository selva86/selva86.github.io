// SVG helpers for the certificate verify page.
//
// Five distinct badge designs (one per track) + Selva's signature rendered
// as text in a script-style web font. All returns are SVG markup strings;
// the verify page inlines them directly so the certificate is fully
// self-contained (no external image requests for the seal).
//
// Each badge is 200x200 viewBox. They share a common structure (ring +
// inner disc + icon char + microtype) but vary in pattern and shape so
// holders of different certs can tell them apart at a glance.

import type { Track } from "./tracks";

function escapeXml(s: string): string {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c] as string));
}

// Generic ring microtype text: "r-statistics.co · CERTIFIED ·" repeated
// around the outer ring of the seal. Renders via SVG textPath on a circle.
function microtypeRing(id: string): string {
  return `
    <defs>
      <path id="${id}-ring-path" d="M 100,100 m -82,0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0" />
    </defs>
    <text class="bg-microtype" font-size="9" letter-spacing="2.4">
      <textPath href="#${id}-ring-path" startOffset="0">
        r-statistics.co  &#x00B7;  CERTIFIED  &#x00B7;  r-statistics.co  &#x00B7;  CERTIFIED  &#x00B7;
      </textPath>
    </text>`;
}

// --- Track-specific badge geometry helpers ---

// 1. R Fundamentals — classic ring + central icon, no extra ornamentation.
function badgeRFundamentals(t: Track): string {
  const id = "bg-rf";
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(t.name)} seal">
      <style>
        .bg-bg{fill:${t.color_primary}}
        .bg-ring{fill:none;stroke:${t.color_accent};stroke-width:2}
        .bg-disc{fill:#fff}
        .bg-icon{fill:${t.color_primary};font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;font-size:72px;font-style:italic;letter-spacing:-2px}
        .bg-microtype{fill:#fff;font-family:'IBM Plex Mono',monospace;letter-spacing:2.4px}
      </style>
      <circle cx="100" cy="100" r="98" class="bg-bg" />
      <circle cx="100" cy="100" r="88" class="bg-ring" />
      ${microtypeRing(id)}
      <circle cx="100" cy="100" r="64" class="bg-disc" />
      <circle cx="100" cy="100" r="64" fill="none" stroke="${t.color_accent}" stroke-width="1" />
      <text x="100" y="124" text-anchor="middle" class="bg-icon">${escapeXml(t.icon)}</text>
    </svg>`;
}

// 2. Tidyverse — laurel-wreath style border with central icon.
function badgeTidyverse(t: Track): string {
  const id = "bg-tv";
  // Twin-laurel: two arcs of "leaf" ovals mirroring around the center.
  const leaves = (mirror: 1 | -1): string => {
    const out: string[] = [];
    for (let i = 0; i < 9; i++) {
      const ang = (-90 + (i - 4) * 14) * (Math.PI / 180);
      const x = 100 + Math.cos(ang) * 82 * mirror;
      const y = 100 + Math.sin(ang) * 82;
      const rot = (ang * 180) / Math.PI + (mirror === 1 ? -25 : 25);
      out.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="9" fill="${t.color_accent}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" />`);
    }
    return out.join("");
  };
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(t.name)} seal">
      <style>
        .bg-bg{fill:${t.color_primary}}
        .bg-disc{fill:#fff}
        .bg-icon{fill:${t.color_primary};font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;font-size:72px;letter-spacing:-2px}
        .bg-microtype{fill:#fff;font-family:'IBM Plex Mono',monospace;letter-spacing:2.4px}
      </style>
      <circle cx="100" cy="100" r="98" class="bg-bg" />
      ${microtypeRing(id)}
      ${leaves(-1)}
      ${leaves(1)}
      <circle cx="100" cy="100" r="58" class="bg-disc" />
      <text x="100" y="122" text-anchor="middle" class="bg-icon">${escapeXml(t.icon)}</text>
    </svg>`;
}

// 3. Data Visualization — concentric gradient circles + bar-chart bars
// behind the central icon for visual identity.
function badgeDataVisualization(t: Track): string {
  const id = "bg-dv";
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(t.name)} seal">
      <defs>
        <radialGradient id="bg-dv-grad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="${t.color_accent}" />
          <stop offset="100%" stop-color="${t.color_primary}" />
        </radialGradient>
      </defs>
      <style>
        .bg-disc{fill:#fff}
        .bg-icon{fill:${t.color_primary};font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;font-size:64px;letter-spacing:-2px}
        .bg-microtype{fill:#fff;font-family:'IBM Plex Mono',monospace;letter-spacing:2.4px;opacity:.92}
      </style>
      <circle cx="100" cy="100" r="98" fill="url(#bg-dv-grad)" />
      ${microtypeRing(id)}
      <!-- decorative bar-chart inside the inner disc -->
      <circle cx="100" cy="100" r="60" class="bg-disc" />
      <g opacity="0.10">
        <rect x="74" y="118" width="8" height="22" fill="${t.color_primary}" />
        <rect x="86" y="106" width="8" height="34" fill="${t.color_primary}" />
        <rect x="98" y="92"  width="8" height="48" fill="${t.color_primary}" />
        <rect x="110" y="100" width="8" height="40" fill="${t.color_primary}" />
        <rect x="122" y="84"  width="8" height="56" fill="${t.color_primary}" />
      </g>
      <text x="100" y="120" text-anchor="middle" class="bg-icon">${escapeXml(t.icon)}</text>
    </svg>`;
}

// 4. Statistics — wax-seal style with crimped (gear-tooth) edge.
function badgeStatistics(t: Track): string {
  const id = "bg-st";
  // Build a 32-tooth crimped circle as a series of points.
  const teeth = 32;
  const rOut = 95;
  const rIn = 84;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const ang = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(100 + Math.cos(ang) * r).toFixed(2)},${(100 + Math.sin(ang) * r).toFixed(2)}`);
  }
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(t.name)} seal">
      <style>
        .bg-bg{fill:${t.color_primary}}
        .bg-disc{fill:#fff}
        .bg-icon{fill:${t.color_primary};font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;font-size:72px;letter-spacing:-2px}
        .bg-microtype{fill:#fff;font-family:'IBM Plex Mono',monospace;letter-spacing:2.4px}
      </style>
      <polygon points="${pts.join(" ")}" class="bg-bg" />
      ${microtypeRing(id)}
      <circle cx="100" cy="100" r="60" class="bg-disc" />
      <!-- subtle sine-wave under the icon for stats identity -->
      <path d="M 60 140 Q 75 122, 90 140 T 120 140 T 150 140" fill="none" stroke="${t.color_accent}" stroke-width="1.5" opacity="0.45" />
      <text x="100" y="120" text-anchor="middle" class="bg-icon">${escapeXml(t.icon)}</text>
    </svg>`;
}

// 5. Machine Learning — geometric node-mesh (neural-net motif) behind icon.
function badgeMachineLearning(t: Track): string {
  const id = "bg-ml";
  // 3 layers of small dots connected by light lines.
  const layer = (x: number, ys: number[]): string =>
    ys.map(y => `<circle cx="${x}" cy="${y}" r="2.5" fill="${t.color_accent}" />`).join("");
  const conn = (x1: number, ys1: number[], x2: number, ys2: number[]): string => {
    const out: string[] = [];
    for (const y1 of ys1) for (const y2 of ys2) {
      out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${t.color_accent}" stroke-width="0.5" opacity="0.35" />`);
    }
    return out.join("");
  };
  const L1 = [78, 92, 106, 120];
  const L2 = [80, 100, 120];
  const L3 = [92, 108];
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(t.name)} seal">
      <style>
        .bg-bg{fill:${t.color_primary}}
        .bg-ring{fill:none;stroke:${t.color_accent};stroke-width:2}
        .bg-disc{fill:#fff}
        .bg-icon{fill:${t.color_primary};font-family:'IBM Plex Serif',Georgia,serif;font-weight:700;font-size:64px;letter-spacing:-2px}
        .bg-microtype{fill:#fff;font-family:'IBM Plex Mono',monospace;letter-spacing:2.4px}
      </style>
      <circle cx="100" cy="100" r="98" class="bg-bg" />
      <circle cx="100" cy="100" r="88" class="bg-ring" />
      ${microtypeRing(id)}
      <circle cx="100" cy="100" r="60" class="bg-disc" />
      <g opacity="0.55">
        ${conn(70, L1, 100, L2)}
        ${conn(100, L2, 130, L3)}
        ${layer(70, L1)}
        ${layer(100, L2)}
        ${layer(130, L3)}
      </g>
      <text x="100" y="120" text-anchor="middle" class="bg-icon">${escapeXml(t.icon)}</text>
    </svg>`;
}

// Track ID → renderer dispatch. Falls back to R Fundamentals shape for any
// unknown track so a new track without dedicated artwork still gets a seal
// before its custom design lands.
export function renderBadgeSvg(track: Track): string {
  switch (track.id) {
    case "r-fundamentals":        return badgeRFundamentals(track);
    case "tidyverse-practitioner": return badgeTidyverse(track);
    case "data-visualization":    return badgeDataVisualization(track);
    case "statistics-for-ds":     return badgeStatistics(track);
    case "machine-learning":      return badgeMachineLearning(track);
    default:                       return badgeRFundamentals(track);
  }
}

// Selva's signature — rendered in 'Sacramento' web font (loaded by the
// verify page via Google Fonts). Placeholder until a real signature image
// is supplied; the styling reads as "signed by a person" not "stamped by a
// machine". Swap by replacing this function body with an inline SVG path of
// the actual signature when available.
export function renderSignatureSvg(): string {
  return `
    <svg viewBox="0 0 260 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Selva Prabhakaran signature">
      <style>
        .sig-text{fill:#1c2c4f;font-family:'Sacramento',cursive;font-size:36px}
      </style>
      <text x="130" y="40" text-anchor="middle" class="sig-text">Selva Prabhakaran</text>
      <line x1="40" y1="50" x2="220" y2="50" stroke="#1c2c4f" stroke-width="0.5" opacity="0.4" />
    </svg>`;
}
