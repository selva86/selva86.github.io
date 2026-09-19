# Studio sidebar: what this hub leads to

Plan only. Nothing built. Asked for 2026-09-19: a Certificate entry at the foot
of the studio's exercise list, and a badge at the end of every section shown as
a milestone in the same panel.

## The thing that changes the design

**Finishing a hub does not earn a certificate.** Certificates are per track, and
a track is many hubs:

| hub | track it feeds | its share | hubs in that track |
|---|---|---|---|
| dplyr-Exercises-in-R | Tidyverse Practitioner | 50 of 367 | 12 |
| ggplot2-Exercises-in-R | Data Visualization | 50 of 236 | 10 |
| Machine-Learning-Exercises-in-R | Machine Learning with R | 50 of 231 | 10 |

Every track needs 80 percent of its exercises (`threshold: 0.8` in
`functions/_data/tracks.json`). So solving all 50 dplyr problems takes someone
about 14 percent of the way to the Tidyverse Practitioner certificate, not to
the certificate.

A row that says "Certificate - earn it by completing all the exercises listed"
would therefore be false. It is also the exact shape of the claim we spent
2026-09-19 removing from 148 hub heroes and 11 assessment pages. Building it
back in a day later, in a different panel, is not a trade worth making.

What is true is better than nothing, and arguably better than the promise:

- Finishing the hub **does** earn a public, verifiable hub badge. That already
  exists end to end (`functions/_lib/badges-hub.ts`, `/badge/<public_id>`,
  derived from `exercise_attempts` so there is no completion state to drift).
  The studio already celebrates it on the last solve. What it never does is
  show it as a destination *before* you get there.
- The hub **does** move a named certificate measurably closer, and we can state
  the distance exactly rather than gesture at it.

## What to build

### 1. A "what this leads to" block, pinned under the exercise list

Two rows, always visible at the foot of the panel, in this order.

```
  Badge        dplyr practitioner              12 / 50
               all 50 solved                   [locked]

  Certificate  Tidyverse Practitioner          50 of 367
               this hub is 1 of 12 that count  [see track >]
```

Row 1, the hub badge. States: locked with live count, earned with a link to
`/badge/<public_id>`. Copy on the locked state names the requirement plainly:
"all 50 solved". No "verified", no seal, no claim beyond what the badge page
itself will stand behind.

Row 2, the certificate. Names the actual track, shows this hub's contribution,
links to the track on `/certifications.html`. It never says this hub earns it.
Signed in, the count is the learner's real `solved / total` from
`/api/me/tracks`, the endpoint `www/cert-page.js` already uses. Signed out, it
shows the hub's share of the track as a static fact and says progress needs an
account, which is already what the status bar says about checking answers.

### 2. Section milestones in the list

The sidebar already groups by section and already shows `done/total` per
section (`renderList` in `www/practice-studio.js`, the `.rs-psec` header). The
milestone is a state on that header, not a new row: when `done === total` the
section head fills in and reads as cleared.

**Recommendation: keep these local, not minted.** Median hub has 6 sections and
there are 143 hubs, so minting one public badge per section means roughly 860
new credential types and a `badges_earned` table six times larger. A credential
that is handed out 860 ways is not a credential. The ladder stays legible if
each rung means something different:

```
section cleared   ->  a milestone. Local, visual, motivating. No URL.
hub complete      ->  a badge. Public, verifiable, already built.
track complete    ->  a certificate. Account-recorded, verifiable at /cert/<id>.
```

If you want section badges public later, `badges-hub.ts` generalises to it
cleanly. The recommendation is about what a badge should be worth, not about
what is hard to build.

## What it needs

| piece | where | note |
|---|---|---|
| hub -> track mapping, client side | `_build/build.py` | bake `data-track` and the hub's `total` onto the studio root at build time; `tracks.json` is server-side today |
| live track progress | `/api/me/tracks` | exists, used by `cert-page.js`; call it once on studio boot when signed in |
| hub badge state | the attempt response | `hub_badge` already comes back on solve; needs a read-on-load path for the already-earned case |
| the two rows | `www/practice-studio.js` `renderList` | append after the section loop |
| section milestone state | same function | `done === total` on the `.rs-psec` header |
| styling | `www/practice-studio.css` | two rows and one header state |

Order: bake the mapping, then the certificate row (static, no auth), then the
badge row, then the milestone state, then live progress. Each step is useful on
its own and none blocks the next.

## Honesty constraints, carried from 2026-09-19

- No number that is not real. No baseline, no bump, no "N learners".
- Nothing says verified unless a server can check it.
- Signed out, the panel must not imply anything is being recorded. It is not.
- The hub badge row must not imply a certificate, and the certificate row must
  not imply this hub earns one.

## Open question for the owner

The certificate row sends a motivated learner to a track that is 12 hubs and
367 exercises wide. That is honest, and it may also read as discouraging at the
moment someone has just finished their first hub. Worth deciding whether the
row leads with the distance covered ("50 of 367, one of 12 hubs done") or the
distance left. The former is the same fact told forward, and is probably the
better moment, but it is a product call rather than a correctness one.
