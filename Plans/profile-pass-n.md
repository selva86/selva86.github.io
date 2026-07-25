# Profile pass N: canonical chrome, reliable own-view, verified identity

Owner directives 2026-07-25: fix (1) invisible Edit button, (2) profile navbar
differing from the site, (3) missing auth circle/dropdown/signout; mock-parity
check; add current work / place of study / location with a validation path.
Branch: profile-n (off master post-pass-M merge). Same rig + preview process.

## Mock-v2 parity audit (live page vs _mocks/profile-mock-v2.html)

| Item | Mock | Live | Action |
|---|---|---|---|
| Hero, board, XP chart, Skills, Badges, Certs, Showcase, Links, Standing, Recent | yes | yes | none |
| Today's set card | yes (own view) | dashboard only | N4: add to profile rail, own view |
| Moment-that-travels share card | yes | partial (share row + award modal) | N5: add Download card link |
| Verified transcript PDF | yes | no | deferred to next pass (real build) |
| Masthead | placeholder (mock limitation) | copied placeholder | N1: canonical site nav |

## Root causes for the three reported bugs
1. Edit button: own-view unlock reads the RAW localStorage Supabase token; an
   expired access token 401s silently and the bar never shows. Also unlock
   requires viewing your own handle page (owner's is /u/selva-prabhakaran-sanjee;
   consider the one-time rename to something short).
2/3. Navbar + circle: the page renders its own minimal masthead (inherited from
   the mock) with no auth slots and no auth-hydrate.js, so no dropdown/signout.

## Work items

N1 Canonical chrome. Replace the custom masthead with the site's canonical
   masthead markup (site-nav.css?v=current + site-nav.js + search + auth slots)
   and load auth-hydrate.js. Remove the profile CSS's own .masthead/.wordmark
   rules (site-nav.css owns them). Keep the profile hero/cards untouched.
   Risks: CSS collisions (audit selectors; profile rules are scoped below
   .hero/.page, low overlap); dark-mode toggle in canonical nav needs the page
   to not break under html.dark -> add a compact dark override block for page
   bg + cards + text; mobile hamburger depends on the sidebar overlay absent
   here -> hide the hamburger on this page, nav links collapse as on mock.
N2 Auth circle: comes with N1 (auth-hydrate populates .auth-user; avatar_url
   now serves uploaded pictures post-pass-M).
N3 Reliable own-view unlock: listen for the auth-hydrated event and use its
   fresh token/me payload first; fall back to the localStorage scan. If the
   profile GET 401s with a stale token, retry once after auth-hydrated fires.
N4 Today's set on own profile rail (reuse /api/me/daily + dashboard renderer
   pattern, flag-aware, renders only for the owner).
N5 "Download card" link in the own share row (card.svg with download attr).

N7 Identity fields (the honest status boost), all in profile_json extras:
   work = {title<=60, org<=60}; education = {school<=80, program<=60};
   location <=60 plain text. Hero identity line under the bio with icons:
   "Data Scientist at Acme  ·  MSc Statistics, IIT Madras  ·  Chennai, IN".
   Editor gains the fields. Server caps + cleanText; nothing new rendered
   unescaped.
N8 Validation mechanism: work/education EMAIL DOMAIN verification.
   - POST /api/me/verify-work {email}: format check, block free/disposable
     domains (gmail/yahoo/outlook/proton/icloud/aol + common disposables),
     6-digit code via ZeptoMail (transactional: fits policy), KV vw:<uid>
     {code_hash, domain, kind, exp 15m, attempts}, rate limit 3 sends/day/user.
   - POST /api/me/verify-work/confirm {code}: <=5 attempts, on match write
     users.work_verified_domain OR users.edu_verified_domain (lazy ALTER
     columns, SERVER-SET ONLY; never accepted through mergeProfileExtras).
     kind classified from domain (.edu / .ac.xx / .edu.xx => education).
   - Render: small VERIFIED tag next to work/education line showing the
     domain ("verified @ acme.com") - domain is the claim we can stand behind,
     org text stays self-reported. Email itself never stored or rendered.
   - Failure cases: deliverability (ZeptoMail transactional), brute force
     (attempt cap + 15m expiry + hashed code), user changes org after
     verifying (tag shows domain, stays honest), shared free-mail edge
     (blocklist), abuse of sends (daily cap).
N9 Location ships self-reported (no fake precision, no IP guessing).

## Checks before merge (rig + preview)
[ ] Canonical navbar renders; links + search work; no CSS bleed into hero/cards
[ ] Signed-out: Sign-in link visible; signed-in (forged token on rig via
    auth-hydrate localStorage seed): circle + dropdown + signout render
[ ] Own view unlocks via auth-hydrated path; edit saves still work end-to-end
[ ] Dark toggle: page readable both modes; toggle persists like other pages
[ ] Mobile 390px: no overflow, nav usable, hamburger hidden gracefully
[ ] Identity line renders all combinations (work only, edu only, all three)
    escaped; absent when empty
[ ] verify-work: send -> confirm happy path (code observed via local dev log);
    wrong code x5 locks; free-mail rejected; rate limit trips on 4th send;
    verified tag renders; merge strips client-sent verified fields
[ ] Daily card renders for owner only, flag-off hides it
[ ] Pass-M regression: percentile chips, timeline, showcase, avatar upload
[ ] og/README card untouched

## Deferred (named, not dropped)
Verified transcript PDF; moment-card generator page; masthead mobile overlay
parity; education multi-entry history.
