# Section assessments + credentials: build plan

Scope: a scored, randomised, honour-coded assessment at the end of every section of
the Time Series Handbook (13 parts) and the Statistics Handbook (14 parts) = **27
assessments**, each drawing 12 questions from a pool of 30 = **810 questions**.
Free to take for everyone. Section 1 certificate free; Section 2 onward Pro.
Plus the track credential on completing a whole track.

Design approved in `_mocks/quiz-flow-mock.html` and `_mocks/certificate-mock-v3.html`.

---

## Architecture decisions (and why)

### D1. Question banks live in D1, not in the repo or KV

Rejected: JSON files served statically (the answer key becomes public), and
static imports inside the Function (810 questions inlined into every cold start).

Chosen: source of truth is `_assessments/<id>.json` in the repo (gitignored from
serving via the middleware denylist, versioned for authoring), seeded into D1
tables by `Scripts/seed_assessments.py`. The API reads D1 and **never sends the
correct answer to the browser**. Grading is server-side only.

Bonus this buys: per-question statistics later (which questions are too easy, too
hard, or mis-keyed) come free from the attempts table.

### D2. The API surface

| Route | Auth | Does |
|---|---|---|
| `GET /api/assessment/[id]` | optional | Returns section metadata + 12 questions **without answers** + an attempt token |
| `POST /api/assessment/[id]/submit` | optional | Grades server-side, records the attempt, returns score, per-question right/wrong, chapter links, percentile |
| `GET /api/assessment/[id]/stats` | none | Cached distribution for the percentile band |
| `POST /api/cert/mint` | required | Already exists; extended with `kind='section'` |

Anonymous users may take and submit (they get a score), but their attempts do
**not** enter the percentile distribution and cannot mint a certificate.

### D3. Pages are generated, not hand-written

`Scripts/gen_assessments.py` emits `/assessment/<book>-<n>.html` from the book
part structure in `www/curricula.json`, using the existing template so the pages
carry the site chrome, auth hydration, dark mode and the footer. Indexable: these
are a genuine acquisition surface.

### D4. Front end is one new module, not lesson-mode

`www/assessment.js` + `www/assessment.css` implement pledge, question, review and
result exactly as the approved mock. Deliberately NOT lesson-mode.js: that player
gives immediate per-step feedback, which is wrong for an assessment, and its
gating model is per-lesson.

---

## Issues, gaps, conflicts and edge cases (checked before building)

### Integrity

**I1. Answer key exposure.** Answers never leave the server. The submit response
reveals which questions were wrong and the chapter to reread; **correct answers
are revealed only once the user has passed**, so a failed attempt cannot be
converted into an answer key for the retake.

**I2. Percentile gaming by retakers.** Percentile is computed from **first
attempts by signed-in users only**. Retakes and anonymous attempts are recorded
but excluded from the distribution.

**I3. Fabricated percentiles at low N.** Below 50 qualifying attempts the API
returns `percentile: null` and the UI says how many have taken it so far. No
seeding, ever. This is the same rule as the dates ledger.

**I4. Certificate farming via retakes.** The certificate records the **first
passing attempt** and its score. Retaking cannot improve the certificate.

**I5. Fake issuance counts.** `fix/cert-integrity` sets `_issuance_baseline` to 0.
Its source changes are applied to master directly (not merged), because the branch
also carries 130 stale built pages that a merge would resurrect. Real counts come
later from `COUNT(*)` over the certificates table.

**I6. The verify page cannot currently verify.** `verify-certificate.html` reads
details out of the URL, which is why the branch had to strip its "genuine" claim.
The new flow points at `functions/cert/[id].ts` (server-backed, already exists),
so the claim becomes true. The old page keeps its neutral wording.

**I7. Attempt replay.** The attempt token binds the served question set to the
submission; a token is single-use and expires in 3 hours.

**I8. Rate limiting.** 24-hour cooldown per user per assessment, enforced
server-side. Anonymous submissions are rate-limited per IP in KV.

### Content

**I9. R output questions must be real.** The gate executes every R block in a
question bank against local R 4.6.0 and fails the bank if any printed output does
not match, exactly as the tutorial gate does.

**I10. Mis-keyed questions.** The gate checks: exactly one correct option for
single-answer, at least two for multi-select, no duplicate option text, no
"all of the above", every question carrying a chapter reference that resolves to a
real published page.

**I11. Scope leakage.** Every question must be answerable from its own section's
chapters. The gate checks the chapter reference belongs to that section; the
LLM-judge pass checks the question does not require later material.

**I12. Pool exhaustion on retake.** 30 questions serving 12 means a retaker sees
roughly 40 percent repeats. Accepted and stated in the plan; raising pools later
is a content task, not a rebuild.

### System

**I13. Naming collision with the existing 38 `*-Quiz.html` pages.** Those are
in-course practice quizzes for the roadmap tracks. New pages live under
`/assessment/` and are a different content type. No file collisions; the two
coexist. Noted so nobody later "unifies" them by accident.

**I14. MathJax.** Statistics questions need it. The generator sets the MathJax
flag per page from the bank's `needs_math` field.

**I15. Schema migration safety.** New tables only, `IF NOT EXISTS`, applied to both
dev and prod. No existing column is altered. `quiz_attempts` is left untouched.

**I16. Feature flag.** Everything ships behind `flag:assessments` (off until the
proving run passes). Certificate minting additionally respects the existing
`flag:certs`.

**I17. Cold start and bundle size.** Question banks in D1 keep the Function small.
Percentile stats are cached in KV with a 10-minute TTL.

**I18. Mid-quiz abandonment.** Answers are held in `localStorage` against the
attempt token, so a refresh or a closed tab resumes rather than losing progress.

**I19. Two free certificates.** Both handbooks have a Section 1, so a reader can
earn two free certificates. Deliberate: it doubles the shareable-artefact surface
at zero marginal cost.

**I20. Prod deploy ordering.** Schema first, then seed, then Functions, then
pages, then flag on. Seeding before the schema exists, or flipping the flag before
seeding, both produce a broken page. Encoded in the runbook below.

---

## Build phases

**Phase 0 — prerequisites**
1. Apply the two `fix/cert-integrity` source changes to master (`_build/build.py`
   `_issuance_baseline` → 0; `verify-certificate.html` neutral wording), rebuild,
   push. Do not merge the branch.
2. Add tables to `schema.sql`, apply to dev and prod.

**Phase 1 — infrastructure, no content**
3. `functions/api/assessment/[id].ts` (serve), `[id]/submit.ts` (grade),
   `[id]/stats.ts` (percentile).
4. `functions/_lib/assessments.ts` (bank access, grading, percentile, cooldown).
5. `www/assessment.js` + `www/assessment.css` from the approved mock.
6. `Scripts/gen_assessments.py` (page generator) + `Scripts/seed_assessments.py`
   (bank to D1).
7. Certificate wiring: mint on first pass, Section 1 free, later sections behind
   Pro with the translucent gate.

**Phase 2 — the question factory**
8. `.claude/skills/write-assessment/SKILL.md` — writes one bank of 30 for one
   section, reading only that section's published chapters.
9. `Scripts/assessment_quality_check.py` — the gate (I9, I10, I11 above).
10. `Scripts/batch_assessments.py` — one fresh `claude -p` per section,
    **`--model claude-opus-5` default**, resumable via `assessments-status.json`.

**Phase 3 — proving run**
11. Time Series Part 1 end to end on a preview branch: take it, fail it, retake it,
    pass it, mint the free certificate, verify it, check the percentile withholds
    below 50 attempts.

**Phase 4 — full batch**
12. Remaining 26 sections, babysat.
13. Track credential on completing a whole track.
14. Flag on, prod verification.
