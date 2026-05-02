# 27-Tool Audit · Findings & Fix Plan

**Run date:** 2026-05-03
**Method:** Programmatic sweep across all 27 tools + browser deep-dive on
ab-test-calculator and power-analysis (representative complex + numeric tools).

Severity: **P0** (correctness / breaks user flow), **P1** (visible polish or
discoverability gap), **P2** (consistency / nice-to-have), **P3** (long tail).

---

## P0 — correctness or genuinely broken

### 1. R-code block is empty on every tool [P0] — RESOLVED, FALSE POSITIVE

**Investigated and dismissed.** The audit query checked `<pre>.textContent`
to detect populated R code, but that selector matches the WebR **output**
panel (the area where `print()` results appear after the user clicks Run),
which is empty by design. The actual R code lives in
`<div class="webr-editor" id="r-code-rebuild">` and is correctly populated
on initial render — confirmed on ab-test-calculator (413 chars of
syntax-highlighted R code, editor visible, height 310px, Run button wired).

No action needed.

### 2. FAQ JSON-LD contains 41 em-dashes [P0]

The FAQ content I wrote in `_build/tool_faqs.py` (Tier 2 push) contains 41
em-dashes spread across the 27 tools. They're inside `<script type="application/ld+json">`
blocks, so invisible on the page itself — but Google's FAQ rich-result
surface shows them in search snippets and AI Overviews. Direct violation
of the project-wide no-em-dash rule.

**Action:** Sanitize `_build/tool_faqs.py` (replace each `—` with a colon,
period, or rephrase), re-run the FAQ injection script, rebuild. ~10 min.

---

## P1 — visible polish / accessibility / discoverability

### 3. 15 tools have unlabeled `<input>` fields [P1]

Inputs without `aria-label`, `aria-labelledby`, or matching `<label for>`
fail screen-reader navigation and Lighthouse a11y. Worst offender:
**equivalence-noninferiority-calculator (31 unlabeled inputs)**, where the
multi-mode form has dozens of fields with placeholder-only labels.

Other tools with 3+ unlabeled inputs: ab-test-calculator (7),
bayes-theorem-calculator (3), bootstrap-ci-calculator (3),
diagnostic-plot-interpreter (3), outlier-detection-calculator (5).

**Action:** Sweep template strings for each tool, add `aria-label="..."`
attributes. Mostly mechanical but per-tool because labels are domain-
specific. ~5 min/tool × 15 = 75 min.

### 4. R-code area also takes screen real estate when empty [P1]

If P0 #1 is fixed by populating the R-code block, this goes away. If it's
fixed by removing the block, the empty `<div class="webr-container">` should
be cleaned up too. Either way no half-state.

### 5. Mobile Context column lacks a quick-glance preview [P1]

On mobile the workshop reorders to Input → Output → Context. The Context
section sits at the bottom in compressed form, but it's still a wall of
prose. A first-time mobile visitor who scrolls there for orientation has
to read the whole thing. Suggested earlier: wrap Context body in a
`<details><summary>What is this test for?</summary>` so it collapses by
default, expands on tap.

**Action:** Mobile-only `<details>` wrap. CSS already has the responsive
hooks; HTML change is per-tool but trivial (one wrapper). ~2 min/tool.

### 6. /tools/ landing page lacks the picker UX [P1]

Tier 2 shipped a category-grouped card grid as `tools/index.html`. Functional
but doesn't convert search-with-intent (e.g., "compare two means") to
"right tool used" the way the picker mocks did. Mock C (illustrated quiz)
or hybrid (quiz + map fallback) are still on disk in `_mocks/`.

**Action:** Decide: ship one of the picker mocks as the primary `/tools/`
landing, or hybridize. Carry-over from earlier conversation.

---

## P2 — consistency / cleanup

### 7. Bespoke column labels remain on 6 tools [P2] — RESOLVED, KEEP AS-IS

After the Method/Measurements/Estimate → Context/Input/Output rename, six
tools still have their custom column labels (DAG editor, Adjustment, Paste,
Paste glm summary, Read, Detection, Data & parameters, Plain-English read).

**Decision (2026-05-03):** keep bespoke labels. Each one reflects a
genuinely different workflow that "Input/Output" would dilute — DAG editor
isn't a numeric form, Paste/Read isn't a calculation, Detection isn't an
estimate. The minor cost in cross-tool consistency is paid back in clarity
inside each specialized tool.

No action needed.

### 8. JSON-LD count is uniform but not validated [P2]

All 27 tools have 3 JSON-LD blocks (WebApplication + BreadcrumbList +
FAQPage). I haven't run them through Google's rich-result test
or schema.org validator. Sample fail = silent SEO loss.

**Action:** Spot-check 3-5 tools at https://search.google.com/test/rich-results
and https://validator.schema.org/. ~10 min.

### 9. og:image filename mismatch risk [P2]

If tool slugs ever rename, the per-slug og image goes 404 until the next
build. The OG generator is wired to rebuild on every `python _build/build.py`,
so this is mitigated, but worth noting: rename a tool, rebuild before
publishing, or social previews break.

---

## P3 — long tail

### 10. No console-log debug residue, no missing function defs

Programmatic sweep found these clean. ✓

### 11. NaN/Infinity guards absent on dag-confounder-picker and reprex-builder [P3]

Both are non-numeric (DAG is symbolic, reprex is text). Likely fine but
worth a per-tool smoke test on weird inputs (paste binary, paste 10MB).

### 12. WebR runtime initializer loads on every tool [P3]

`<script src="/www/webr-init.min.js">` is in every tool's head, but visible
"WebR" text count is **zero** across the suite. Per the no-WebR-mention
rule the underlying tech can run, just can't be branded. Currently
compliant. (False positive in initial sweep — flagged for completeness.)

---

## Recommended execution order

1. **Today** — Fix em-dashes in `tool_faqs.py` (P0, 10 min). This is fast,
   ships immediately, and fixes a Google-facing copy violation.
2. **Today** — Investigate why the R-code block is empty (P0). If the fix
   is small, ship it; if it's complex, file it as the next focused work.
3. **Next session** — `aria-label` sweep across the 15 tools (P1, ~75 min).
   Pure accessibility win, mostly mechanical, no design risk.
4. **Next session** — Decide on column-label uniformity for the 6 bespoke
   tools (P2 #7).
5. **Later** — Mobile `<details>` wrap (P1 #5), picker UX (P1 #6),
   rich-result validation (P2 #8), bespoke columns audit (P2 #7).

---

## Method limitations

- Browser deep-dive covered only ab-test-calculator and power-analysis.
  The R-code-empty finding is consistent across both, so likely systemic,
  but a 27-tool sweep is needed to confirm scope.
- No formula correctness checks (would require running each calculation
  against R's authoritative output). The earlier audit (commits
  `8d-95` from prior sessions) handled this for the 8 critical blockers.
- No mobile testing on actual phones — only viewport-resize approximation.
- No load-time / Core Web Vitals measurement. Worth pulling Lighthouse
  scores for 3-5 tools as a follow-up.

---

## Findings summary

| # | Severity | Finding | Tools affected | Est. fix |
|---|---|---|---|---|
| 1 | P0 | Empty R-code block | 27 (suspected) | TBD until cause known |
| 2 | P0 | 41 em-dashes in FAQ JSON-LD | 27 | 10 min |
| 3 | P1 | Unlabeled inputs | 15 | 75 min |
| 4 | P1 | Empty webr-container leftover | 27 | depends on #1 |
| 5 | P1 | Mobile Context lacks collapse | 27 | 30 min |
| 6 | P1 | Tools landing lacks picker | 1 (landing) | 1-2 hr |
| 7 | P2 | Bespoke column labels | 6 | 18 min |
| 8 | P2 | JSON-LD not validated | 27 | 10 min |
| 9 | P2 | og:image rename brittleness | systemic | 0 (already auto-rebuild) |
| 10 | clean | No debug residue / missing fns | — | — |
| 11 | P3 | NaN guards | 2 | 5 min |
| 12 | clean | WebR branding compliance | — | — |

**Total estimated work to clear P0+P1 across all 27 tools: 4-6 hours.**
P0 #2 (em-dashes) can land today.
