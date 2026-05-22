#!/usr/bin/env python3
"""Append a @media(max-width:480px) block to each mock, just before </style>.
Idempotent: skips if marker `/* mobile-pass-480 */` is already present.
"""
from pathlib import Path
import re

MOBILE_BLOCK = """
  /* mobile-pass-480 */
  @media(max-width:480px){
    body{font-size:15.5px}
    .container,.wrap,.pagewrap,.shell,.layout{padding-left:16px!important;padding-right:16px!important}
    .pagewrap,.shell,.layout{grid-template-columns:1fr!important;gap:18px!important}
    .sidenav{position:static!important}
    .nav{display:none!important}.menu-btn{display:flex!important}
    h1{font-size:28px!important;letter-spacing:-.01em}
    h2,.h2{font-size:20px!important}
    .lead{font-size:15.5px!important}
    .hero,.phero,.phead{padding:28px 0 22px!important}
    .ctas,.cta-row,.actions{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
    .ctas .btn,.cta-row .btn,.actions .btn{width:100%!important;justify-content:center!important}
    .stats,.summary{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;grid-template-columns:1fr!important}
    .stats .s,.summary .s{width:100%!important;border-right:0!important;border-bottom:1px solid var(--line)!important;padding:12px 0!important}
    .grid,.cards,.earned,.tlist,.elist{grid-template-columns:1fr!important;gap:14px!important}
    .card{padding:16px!important}
    .filters,.chips{overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;padding-bottom:6px}
    .filters .chip,.chips .chip{flex-shrink:0}
    table{font-size:13px}
    .footer,footer{padding:24px 0!important}
    footer .cols{grid-template-columns:1fr!important;gap:18px!important}
    .state-toggle{bottom:10px!important;left:10px!important;font-size:11px!important;padding:5px 9px!important}
  }
"""

MARKER = "/* mobile-pass-480 */"

FILES = [
    "pricing-mock.html",
    "blog-page-mock-v2.html",
    "roadmap-mock.html",
    "dashboard-mock.html",
    "account-billing-mock.html",
    "account-settings-mock.html",
    "saved-posts-mock.html",
    "my-certificates-mock.html",
    "tools-mock.html",
    "tutorials-mock.html",
    "exercises-mock.html",
    "certification-mock.html",
    "teams-mock.html",
    "checkout-mock.html",
    "pro-welcome-mock.html",
]

ROOT = Path(__file__).parent
patched = 0
skipped = 0
for name in FILES:
    p = ROOT / name
    if not p.exists():
        print(f"  miss: {name}")
        continue
    txt = p.read_text(encoding="utf-8")
    if MARKER in txt:
        print(f"  skip: {name} (already patched)")
        skipped += 1
        continue
    # insert just before the first </style> tag
    idx = txt.find("</style>")
    if idx < 0:
        print(f"  no <style>: {name}")
        continue
    new = txt[:idx] + MOBILE_BLOCK + "\n" + txt[idx:]
    p.write_text(new, encoding="utf-8")
    patched += 1
    print(f"  done: {name}")

print(f"\npatched={patched} skipped={skipped}")
