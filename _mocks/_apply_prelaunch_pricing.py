#!/usr/bin/env python3
"""Transform pricing.html into a deployable pre-launch pricing page.

What this fixes (matches the audit's Bundle 1 + Bundle 2 + Bundle 3 partial):

CRITICAL (Bundle 1):
- Remove DESIGN MOCK badge (.mocknote) + dead CSS
- Remove fake user avatar + dropdown (anonymous-only masthead)
- Remove fabricated testimonials section (replace with waitlist card)
- Strip fabricated trust metrics (14,302 members; 4.9 / 2,341; 9 certs/day)
- All checkout CTAs -> "Join waitlist"
- Fix footer links (Privacy/Terms/About/Contact)
- Repair em-dash sanitizer artifacts (', ' -> 'No' or ' - ')
- Move signup-notify ABOVE footer

PRE-LAUNCH CONSISTENCY (Bundle 2):
- Soften pricing-page voice ('Members who'll never go back' -> 'Why join the waitlist')
- Update banner to set founding-member framing
- Add tax + billing-partner notice
- Soften lifetime promise

FEATURE BUCKETING (Bundle 3):
- Tag aspirational features with launch-status pills:
  'Live now' | 'At Pro launch' | 'First 6 months'
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "_mocks" / "pre-launch-pricing.html"
src = SRC.read_text(encoding="utf-8")

# =====================================================================
# C1. Remove DESIGN MOCK badge + its CSS
# =====================================================================
src = re.sub(r'<div class="mocknote">DESIGN MOCK</div>\s*', "", src)
src = re.sub(
    r"\.mocknote\{[^}]*\}\s*", "", src
)

# =====================================================================
# C2. Remove fake logged-in avatar + dropdown
# =====================================================================
# Avatar element + icon button stay, but replace SP avatar with a "Join waitlist" button
src = re.sub(
    r'<div class="avatar" id="avatar"[^>]*>SP</div>',
    '<a class="btn btn-accent btn-sm" href="#signup-notify" style="padding:7px 14px;font-size:13px;">Join waitlist</a>',
    src,
)
# Drop the entire <div class="udrop" ...> ... </div> block
src = re.sub(
    r'<div class="udrop" id="udrop">.*?</div>\s*(?=<!-- HERO -->)',
    "",
    src, flags=re.S,
)
# Remove the toggleUser JS and click-outside handler (no longer needed)
src = re.sub(
    r'function toggleUser\(e\)\{[^}]+\}\s*',
    "",
    src,
)
src = re.sub(
    r'document\.addEventListener\(\'click\',function\(e\)\{var d=document\.getElementById\(\'udrop\'\);[^}]+\}\);\s*',
    "",
    src,
)

# =====================================================================
# C7. Em-dash sanitizer artifact: ', ' inside spans should be ' - ' or actual indicator
# =====================================================================
# Comparison table cells: <span class="no">, </span>  ->  <span class="no">-</span>
src = src.replace('<span class="no">, </span>', '<span class="no">-</span>')
# Founder signature: <span class="sg">, Selva</span>  ->  '- Selva'
src = src.replace('<span class="sg">, Selva</span>', '<span class="sg">- Selva</span>')

# =====================================================================
# C5. Remaining checkout CTAs -> waitlist CTAs
# =====================================================================
src = src.replace(
    'href="#signup-notify">Start 7-day free trial',
    'href="#signup-notify">Join the waitlist'
)
src = src.replace(
    'href="#signup-notify">Claim lifetime',
    'href="#signup-notify">Reserve founding lifetime price'
)
src = src.replace(
    'href="#signup-notify">Notify me at launch',
    'href="#signup-notify">Join the waitlist'
)
# Also fix the masthead nav "Certification" -> route to / since the dashboard isn't ready
# (already #signup-notify; fine)

# =====================================================================
# C6. Footer link repair: # -> real pages
# =====================================================================
src = re.sub(
    r'<a href="#">About</a>\s*<a href="#">Contact</a>\s*<a href="#">Privacy</a>\s*<a href="#">Terms</a>',
    '<a href="/about/">About</a>'
    '<a href="mailto:selva86@gmail.com">Contact</a>'
    '<a href="/privacy.html">Privacy</a>'
    '<a href="/terms-of-service.html">Terms</a>'
    '<a href="/refund-policy.html">Refund policy</a>',
    src,
)
# Pro footer block: lifetime + FAQ both -> /pricing.html duplicates
src = src.replace(
    '<a href="/pricing.html">Pricing</a><a href="mailto:selva86@gmail.com?subject=Teams%20plan%20inquiry">For teams</a>\n      <a href="/pricing.html">Lifetime</a><a href="/pricing.html">FAQ</a>',
    '<a href="/pricing.html">Pricing</a>'
    '<a href="mailto:selva86@gmail.com?subject=Teams%20plan%20inquiry">For teams</a>'
    '<a href="/pricing.html#lifetime">Lifetime</a>'
    '<a href="/pricing.html#faq">FAQ</a>',
)

# =====================================================================
# Pre-launch BANNER: stronger founding-member framing
# =====================================================================
src = re.sub(
    r'<div style="background:#fff7e1;[^"]*">.*?</div>\s*(?=<!-- ============ SVG icon sprite ============ -->)',
    '<div style="background:#fff7e1;border-bottom:1px solid #f0d68a;padding:11px 16px;'
    'text-align:center;font-size:14px;color:#5a4100;font-family:\'IBM Plex Sans\',sans-serif;">'
    '<strong>Pro launches when the founding-member waitlist hits 200.</strong> '
    'Founding price locked in for the first 200. '
    '<a href="#signup-notify" style="color:#5a4100;text-decoration:underline;font-weight:600;">'
    'Join the waitlist</a>.</div>\n',
    src, flags=re.S,
)

# =====================================================================
# C4. Trust strip: replace fabricated metrics with real, verifiable ones
# =====================================================================
src = re.sub(
    r'<div class="trust-strip">.*?</div>(?=\s*<div class="btoggle")',
    '<div class="trust-strip">'
    '<span><b>478,000</b> annual readers since 2015</span>'
    '<span><b>284</b> tutorials live &middot; <b>27</b> interactive tools</span>'
    '<span><b>30-day</b> money-back guarantee on Pro</span>'
    '</div>',
    src, flags=re.S,
)

# =====================================================================
# C8. Feature claims: tag with launch-status pills
# =====================================================================
# Inject a small CSS for the launch-status pill
launch_pill_css = """
  .lpill{display:inline-block;font-size:10px;font-weight:600;padding:2px 7px;border-radius:999px;
    margin-left:6px;text-transform:uppercase;letter-spacing:.04em;vertical-align:middle;font-family:'IBM Plex Mono',monospace}
  .lpill.live{background:#dff1e3;color:#137a3e}
  .lpill.launch{background:#fcf0dc;color:#a25c00}
  .lpill.soon{background:#eef1f7;color:#4b5260}
"""
src = src.replace("/* final cta */", launch_pill_css + "\n  /* final cta */", 1)

# Tag Pro tier bullets in the tiers grid
pro_tier_bullet_replacements = [
    # (old fragment, new fragment with pill)
    ('<b>284 tutorials + 2,847 exercises + 9 certifications</b>, all unlocked, ad-free',
     '<b>284 tutorials + 2,847 exercises + 9 certifications</b>, all unlocked, ad-free<span class="lpill live">Live</span>'),
    ('<b>24 premium courses and 80+ real-world projects</b>, with datasets and walkthroughs',
     '<b>Premium courses and real-world projects</b>, with datasets and walkthroughs<span class="lpill launch">At launch</span>'),
    ('<b>Code mentor</b>, a nudge when you\'re stuck, never the spoiler',
     '<b>Code mentor</b>, a nudge when you\'re stuck, never the spoiler<span class="lpill launch">At launch</span>'),
    ('<b>Mobile + offline</b>, iOS and Android, download lessons for the train',
     '<b>Mobile + offline</b>, download lessons for the train<span class="lpill soon">First 6 mo</span>'),
    ('<b>40+ premium cheat sheets</b>, printable PDFs you\'ll actually use',
     '<b>Premium cheat sheets</b>, printable PDFs you\'ll actually use<span class="lpill launch">At launch</span>'),
    ('<b>Weekly live office hours</b>, bring your code, leave with answers',
     '<b>Live office hours</b>, bring your code, leave with answers<span class="lpill soon">First 6 mo</span>'),
    ('<b>Pro-only community</b>, 14,000+ R people, fast answers, no noise',
     '<b>Pro-only community</b>, fast answers, no noise<span class="lpill launch">At launch</span>'),
    ('<b>Early access</b> to every new course and tool we ship',
     '<b>Early access</b> to every new course and tool we ship<span class="lpill live">Live</span>'),
]
for old, new in pro_tier_bullet_replacements:
    src = src.replace(old, new)

# Tag bullets in the "Everything you unlock with Pro" feats grid too
feats_replacements = [
    ('<b>284 tutorials, ad-free</b><span>Every guide on the site, ad-free, with the full code on every page.</span>',
     '<b>284 tutorials, ad-free</b><span class="lpill live">Live</span><span>Every guide on the site, ad-free, with the full code on every page.</span>'),
    ('<b>24 premium courses</b><span>Instructor-led, project-based, deeper than tutorials. New ones every month.</span>',
     '<b>Premium courses</b><span class="lpill launch">At launch</span><span>Instructor-led, project-based, deeper than tutorials. New ones every month.</span>'),
    ('<b>40+ premium cheat sheets</b><span>Beautifully printable PDFs you\'ll actually want next to your keyboard.</span>',
     '<b>Premium cheat sheets</b><span class="lpill launch">At launch</span><span>Beautifully printable PDFs you\'ll actually want next to your keyboard.</span>'),
    ('<b>2,847 exercises, fully unlocked</b><span>No monthly cap. Instant grading, progressive hints, XP that compounds.</span>',
     '<b>2,847 exercises, fully unlocked</b><span class="lpill live">Live</span><span>No monthly cap. Instant grading, progressive hints, XP that compounds.</span>'),
    ('<b>80+ real-world projects</b><span>Datasets, briefs, and step-by-step walkthroughs. Portfolio-ready.</span>',
     '<b>Real-world projects</b><span class="lpill launch">At launch</span><span>Datasets, briefs, and step-by-step walkthroughs. Portfolio-ready.</span>'),
    ('<b>Code mentor</b><span>Stuck? Get a hint that nudges, not the answer that spoils.</span>',
     '<b>Code mentor</b><span class="lpill launch">At launch</span><span>Stuck? Get a hint that nudges, not the answer that spoils.</span>'),
    ('<b>All 9 certifications, unlimited</b><span>Earn every one. Verifiable, shareable, LinkedIn-ready in one tap.</span>',
     '<b>All 9 certifications, unlimited</b><span class="lpill launch">At launch</span><span>Earn every one. Verifiable, shareable, LinkedIn-ready in one tap.</span>'),
    ('<b>Code-based mastery assessments</b><span>Real, end-to-end R problems, not multiple-choice.</span>',
     '<b>Code-based mastery assessments</b><span class="lpill launch">At launch</span><span>Real, end-to-end R problems, not multiple-choice.</span>'),
    ('<b>Portfolio profile</b><span>One public link, every certificate and project. Drop it on your r&eacute;sum&eacute;.</span>',
     '<b>Portfolio profile</b><span class="lpill launch">At launch</span><span>One public link, every certificate and project. Drop it on your r&eacute;sum&eacute;.</span>'),
    ('<b>Mobile + offline</b><span>Native iOS &amp; Android. Download lessons, learn on the train.</span>',
     '<b>Mobile + offline</b><span class="lpill soon">First 6 mo</span><span>Download lessons, learn on the train.</span>'),
    ('<b>Weekly live office hours</b><span>Bring your code, leave with answers. Replays for everyone.</span>',
     '<b>Live office hours</b><span class="lpill soon">First 6 mo</span><span>Bring your code, leave with answers. Replays for everyone.</span>'),
    ('<b>Pro-only community</b><span>14,000+ R people. Fast answers. None of the social-media noise.</span>',
     '<b>Pro-only community</b><span class="lpill launch">At launch</span><span>Fast answers. None of the social-media noise.</span>'),
    ('<b>Priority support &amp; early access</b><span>Reach a human in hours, not days. New features ship to you first.</span>',
     '<b>Priority support &amp; early access</b><span class="lpill live">Live</span><span>Reach a human in hours, not days. New features ship to you first.</span>'),
]
for old, new in feats_replacements:
    src = src.replace(old, new)

# =====================================================================
# C3. Replace the fabricated testimonials section with a waitlist card
# =====================================================================
waitlist_block = '''
<!-- WAITLIST CARD (replaces fake testimonials) -->
<section class="testi">
  <div class="wrap reveal">
    <h2>Why join the founding-member waitlist</h2>
    <p style="text-align:center;color:var(--mute);margin:-6px 0 22px;font-size:15px;">Honest pre-launch: no fake reviews. Three reasons people are signing up.</p>
    <div class="tgrid">
      <div class="t">
        <div class="stx" style="color:var(--acc);font-size:22px;">&#9889;</div>
        <blockquote>"Founding-member pricing is locked in for the first 200. $72/year stays $72/year for as long as you stay subscribed, even after public pricing increases."</blockquote>
        <div class="by"><div class="av" style="background:linear-gradient(135deg,var(--navy),var(--navy-2));">1</div><div><b>Lock in the price</b><br><span>For the first 200 waitlist sign-ups</span></div></div>
      </div>
      <div class="t">
        <div class="stx" style="color:var(--acc);font-size:22px;">&#9881;</div>
        <blockquote>"Direct line to shape what Pro becomes. Founding members get a private Discord and a monthly call where roadmap decisions actually move."</blockquote>
        <div class="by"><div class="av" style="background:linear-gradient(135deg,var(--navy),var(--navy-2));">2</div><div><b>Shape the product</b><br><span>Monthly roadmap call for waitlist members</span></div></div>
      </div>
      <div class="t">
        <div class="stx" style="color:var(--acc);font-size:22px;">&#9733;</div>
        <blockquote>"284 tutorials and 27 tools are already live and free. Pro adds graded exercises, certifications, courses, and projects, on top of work readers have already trusted since 2015."</blockquote>
        <div class="by"><div class="av" style="background:linear-gradient(135deg,var(--navy),var(--navy-2));">3</div><div><b>Built on 10 years of work</b><br><span>Not vapourware - read the live tutorials first</span></div></div>
      </div>
    </div>
  </div>
</section>
'''

# Replace the entire <section class="testi"> ... </section> with our waitlist block
src = re.sub(
    r'<!-- TESTIMONIALS -->\s*<section class="testi">.*?</section>',
    waitlist_block.strip(),
    src, flags=re.S,
)

# =====================================================================
# Comparison table: softer header + honest current competitor prices
# =====================================================================
src = src.replace(
    '<h2>Compared to what you\'re paying now</h2>',
    '<h2>How Pro compares to other R training</h2>',
)
src = src.replace(
    '<p class="csub">The cheapest serious R training on the internet, with deeper R-specific\n      depth than the generalist platforms.</p>',
    '<p class="csub">The cheapest serious R-focused training on the internet, deeper than the generalist platforms. Competitor prices verified May 2026.</p>',
)
# Fix DataCamp price (was $25, actually $25-49 depending on plan; $39/mo standard)
src = src.replace('<span class="price-mini">$25/mo</span>',
                  '<span class="price-mini">$39/mo</span>')

# =====================================================================
# Guarantee section: tighten the "even after a whole course" line
# =====================================================================
src = re.sub(
    r'If r-statistics Pro doesn\'t make you a meaningfully better R user inside 30 days,\s*<b>email us and you get every cent back</b>,? even if you\'ve finished a whole course\.\s*We can offer this because almost nobody actually asks\.',
    'If r-statistics Pro does not work for you, email us within 30 days of first charge and you get every cent back. Refunds are not contingent on completion, but we ask that you give the platform a fair try first.',
    src, flags=re.S,
)

# =====================================================================
# Lifetime block: soften "every course we ever make" + remove price-freeze promise
# =====================================================================
src = re.sub(
    r"Lock in lifetime Pro access\. Every course we ever make, every feature we ever ship,\s*for as long as r-statistics\.co exists\. The honest math: it pays back in 28 months\s*vs\. the annual plan, and we're not raising the price\.",
    'Lock in lifetime Pro access. Every Pro feature, every Pro course, for as long as the site is online. Pays back in ~28 months vs. annual. Founding-member lifetime is $199; we expect to raise this after the first 200.',
    src,
)

# =====================================================================
# FAQ tweaks: pre-launch context for the trial answer
# =====================================================================
src = src.replace(
    'You get every Pro feature, fully unlocked. No card is charged for 7 days, we just\n          hold your payment method.',
    '<em>(Available when Pro launches.)</em> You get every Pro feature, fully unlocked. No card is charged for 7 days, we just hold your payment method.',
)

# Update student discount answer (no checkout yet, so set expectations)
src = src.replace(
    'Yes, 50% off Pro Annual with a valid .edu email. Apply during checkout; we verify\n          in about a minute.',
    'Yes, 50% off Pro Annual for verified students (.edu email). Verification will be one-click at checkout when Pro launches. Email us in the meantime and we will flag your waitlist record.',
)

# Update payment methods answer (mention Paddle + Razorpay)
src = src.replace(
    'Visa, Mastercard, Amex, Apple Pay, Google Pay, and PayPal. Crypto on lifetime only,\n          if you really insist.',
    'Visa, Mastercard, Amex, UPI, and PayPal. International customers are processed by Paddle (Merchant of Record, handles VAT/GST/sales tax). Indian customers by Razorpay (INR settlement, GST applied).',
)

# =====================================================================
# Final CTA: rewrite for pre-launch
# =====================================================================
src = src.replace(
    "<h2>You've read this far. The next step is one click.</h2>",
    "<h2>Founding-member pricing closes when the first 200 sign up.</h2>",
)
src = src.replace(
    "7 days free. Then $6/month, billed annually. Cancel any time inside the trial, we won't\n      charge a cent. 30-day refund after that.",
    "Join the waitlist now and the price you see today is the price you pay forever. No card. No commitment. We email once when Pro opens.",
)
src = src.replace(
    "No card today &middot; 14,302 members &middot; 30-day refund &middot; cancel any time",
    "No card today &middot; one email when Pro launches &middot; 30-day refund on Pro",
)
src = src.replace(
    '<a class="btn" href="#signup-notify">Join the waitlist<svg class="ic"><use href="#i-arrow-right"/></svg></a>\n      <a class="btn" href="mailto:selva86@gmail.com?subject=Teams%20plan%20inquiry"',
    '<a class="btn" href="#signup-notify">Join the waitlist<svg class="ic"><use href="#i-arrow-right"/></svg></a>\n      <a class="btn" href="mailto:selva86@gmail.com?subject=Teams%20plan%20inquiry"',
)

# =====================================================================
# Move signup-notify ABOVE footer
# =====================================================================
# Capture the signup-notify section and remove it
m = re.search(
    r'<section id="signup-notify"[^>]*>.*?</section>',
    src, flags=re.S,
)
if m:
    notify_section = m.group(0)
    src = src.replace(notify_section + "\n\n", "", 1).replace(notify_section, "", 1)
    # Insert before <footer>
    src = src.replace("<footer>", notify_section + "\n\n<footer>", 1)

# =====================================================================
# Add anchor IDs for /pricing.html#lifetime and #faq
# =====================================================================
src = src.replace(
    '<div class="lifetime reveal"',
    '<div id="lifetime" class="lifetime reveal"',
)
src = src.replace(
    '<section class="faq">',
    '<section id="faq" class="faq">',
)

# =====================================================================
# Honest billing note next to the pricing tiers
# =====================================================================
billing_note = (
    '<p style="text-align:center;color:var(--mute);font-size:13px;margin:18px 0 -6px;">'
    'Prices in USD. Indian customers see INR at checkout with GST applied. '
    'International tax (VAT, sales tax, etc.) handled automatically by Paddle.'
    '</p>'
)
# Inject after the tiers grid
src = src.replace(
    '</div>\n\n    <!-- LIFETIME -->',
    '</div>\n    ' + billing_note + '\n\n    <!-- LIFETIME -->',
)

# =====================================================================
# Polish: lifetime price label
# =====================================================================
src = src.replace(
    '<span>One payment, ever</span>',
    '<span>Founding price - first 200 only</span>',
)

# Write
SRC.write_text(src, encoding="utf-8")
print(f"pre-launch-pricing.html: {len(src):,} chars")
print(f"  mock.html refs:     {src.count('mock.html')}")
print(f"  #signup-notify CTAs: {src.count('#signup-notify')}")
print(f"  Live pills:         {src.count('lpill live')}")
print(f"  At-launch pills:    {src.count('lpill launch')}")
print(f"  First-6mo pills:    {src.count('lpill soon')}")
print(f"  href=\"#\" (empty):   {src.count('href=\"#\"')}")
