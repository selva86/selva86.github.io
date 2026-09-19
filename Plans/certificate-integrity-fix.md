# Certificate integrity: the exact fix, and how to verify it

Written 2026-09-19. Every claim below was checked against production.

---

## The situation in one paragraph

You run two certificate systems. One is correct, server-backed and live. The
other is forgeable, also live, and is the only one anybody uses. The fix is not
to build anything. It is to retire the wrong one and point everything at the
right one.

| | Real system | Legacy system |
|---|---|---|
| Verify URL | `/cert/<public_id>` | `/verify-certificate.html?n=&h=&d=` |
| Renders from | D1 `certificates` row | the URL query string |
| Unknown id | 404 (`functions/cert/[id].ts:69-76`) | renders as genuine |
| Revocable | yes, `status != 'active'` → 404 | no |
| Machine readable | `/api/cert/<id>/badge.json`, Open Badges 3.0 | no |
| Minting | `POST /api/cert/mint`, auth required | 11 quiz pages, no auth |
| Certificates issued | **0** | unknown, unrecorded |

### Why the legacy one is forgeable

`verify-certificate.html` makes no network call. It renders the holder name,
programme and date straight from `?n=`, `?h=` and `?d=`. The certificate ID is
`shortId()` at line 495: a non-cryptographic string hash of those same three
values, computed in the browser, with no secret. Anyone can type any name into
the URL and get a page that says **Verified**, headed *"This certificate is
genuine"*, with a LinkedIn **Add to profile** button beside it.

The page then tells the visitor:

> The eight-character ID above is derived from those same fields. Changing any
> one of them produces a different ID, so a tampered URL would not match the
> holder's saved record.

There is no saved record. That sentence is the actual harm, and it is live now.

### The constraint that shapes everything

`quiz_attempts` has **0 rows** and the legacy quiz pages contain **no `fetch` or
`/api` call at all**. Nothing about a legacy pass was ever recorded. The holder's
name lived in localStorage.

So there is no way to tell an honest legacy holder from a fabricated one, and no
list of holders to notify. **Any fix retires all of them, and the verify URL
itself is the only channel that reaches anyone holding one.**

### Do not merge `fix/cert-integrity`

It is unmerged (`git merge-base --is-ancestor` says NO for both integrity
commits), and it is both stale and incomplete.

- Stale: merging it reverts the current footer, the GA tag, the favicon version
  and several site links.
- Incomplete: it removes the "Verified" pill and the "genuine" headline, but
  **keeps the LinkedIn Add-to-profile button and keeps the "would not match the
  holder's saved record" sentence**.

Take its intent, apply it fresh on master.

---

## The plan

### Step 1 — stop the false claim, same day, one file

`verify-certificate.html`:

1. delete the LinkedIn **Add to profile** link (`linkedin.com/profile/add`)
2. delete the Verified pill, the "This certificate is genuine" headline, the
   `VERIFIED` watermark and the "Verifiable credential" issuer line
3. delete the "tampered URL would not match the holder's saved record" paragraph
4. **stop rendering `?n=` entirely.** Printing a name taken from the URL is what
   makes a forgery look real. This is the single most important line in the plan

This alone ends the harm. Everything after it is cleanup.

### Step 2 — stop minting new ones, same deploy, 11 files

`Hypothesis-Testing-Exercises-in-R-quiz.html`,
`Linear-Regression-Exercises-in-R-quiz.html`,
`Machine-Learning-Exercises-in-R-quiz.html`, `R-Beginner-Exercises-quiz.html`,
`R-Functional-Programming-Exercises-quiz.html`, `R-Interview-Questions-quiz.html`,
`Shiny-Exercises-in-R-quiz.html`, `Time-Series-Exercises-in-R-quiz.html`,
`dplyr-Exercises-in-R-quiz.html`, `ggplot2-Exercises-in-R-quiz.html`,
`tidyr-Exercises-in-R-quiz.html`.

Remove the certificate output at the end of each quiz. Replace it with a link to
the real credential on `/certifications.html`. **Keep the quizzes themselves**:
they are useful and they rank.

### Step 3 — turn the legacy page into one honest state

Keep `/verify-certificate.html` alive permanently. It is already `noindex` and
absent from `sitemap.xml`, so there is no SEO cost, and inbound shared links are
the only reason it still matters.

Render the same page for every request, ignoring all params: what this link was,
that these certificates were retired on a stated date, that they were never
recorded server-side, and how to earn a real one. No name, no date, no id.

### Step 4 — make the real path reachable

- **Fix the dead Claim button.** `www/cert-page.js:107-111` sets the CTA text to
  "Claim certificate", sets `href="#"` and adds `data-track-claim`, which nothing
  in the repo listens for. An eligible learner clicks it and nothing happens.
  Wire it to `POST /api/cert/mint`, then send them to `/cert/<public_id>`.
- **Decide the entitlement.** `flag:cert_free` is currently `on` in production,
  which makes `/api/cert/mint` open to every signed-in user. If certificates are
  the paid good, that flag is the switch, and it should be turned off in the same
  deploy so the two systems never disagree.

### Step 5 — consistency sweep

Grep for `verifiable credential`, `Verified`, `genuine` anywhere they describe
the legacy artefact.

---

## Verification

The page renders client-side, so `curl` proves only that the strings are gone
from source. Both halves are required.

### A. A forged link no longer looks genuine

```
URL='https://r-statistics.co/verify-certificate.html?n=Wile+E+Coyote&h=dplyr&d=2026-01-01'
curl -s "$URL" | grep -ci 'linkedin.com/profile/add\|v-status verified\|certificate is genuine\|would not match the holder'
# expect: 0
```

Then open the same URL in a browser and confirm the rendered DOM:

```
document.body.innerText.includes('Wile E Coyote')   // expect false
document.querySelectorAll('[href*="linkedin.com/profile/add"]').length  // expect 0
```

The name check is the one that matters. If the name still renders, step 1.4 was
not done.

### B. Nothing can mint without an account

```
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://r-statistics.co/api/cert/mint
# expect: 401

grep -l 'verify-certificate.html' *-quiz.html | wc -l
# expect: 0
```

### C. The real path works end to end

Sign in as an eligible user, click Claim, then:

```
curl -s -o /dev/null -w '%{http_code}\n' https://r-statistics.co/cert/<public_id>
# expect: 200

curl -s https://r-statistics.co/api/cert/<public_id>/badge.json | head -c 200
# expect: Open Badges 3.0 JSON-LD

npx wrangler d1 execute r-stats-prod --remote \
  --command "SELECT public_id, track, status FROM certificates;"
# expect: exactly one active row, matching the id above
```

### D. An unknown id 404s rather than rendering

```
curl -s -o /dev/null -w '%{http_code}\n' https://r-statistics.co/cert/not-a-real-id
# expect: 404
```

### E. Revocation actually revokes

This is the property that separates a credential from a picture.

```
npx wrangler d1 execute r-stats-prod --remote \
  --command "UPDATE certificates SET status='revoked' WHERE public_id='<public_id>';"

curl -s -o /dev/null -w '%{http_code}\n' https://r-statistics.co/cert/<public_id>
# expect: 404

npx wrangler d1 execute r-stats-prod --remote \
  --command "UPDATE certificates SET status='active' WHERE public_id='<public_id>';"
```

### F. No regression from the stale branch

```
curl -s https://r-statistics.co/verify-certificate.html | grep -c 'G-D5XKCMN7FR'
# expect: 1   (the GA tag the old branch would have removed)
```

Also eyeball the footer against any other page.

---

## Order and effort

| Step | Files | Effort |
|---|---|---|
| 1. Stop the false claim | 1 | under an hour |
| 2. Stop minting | 11 | an hour |
| 3. Legacy page becomes one honest state | 1 | an hour |
| 4. Claim button, and the `cert_free` decision | 1 + a flag | an hour |
| 5. Consistency sweep | few | 30 minutes |

Steps 1 and 2 ship together. Steps 3 to 5 can follow the same day.
