# bayesian-ab-test-calculator - build plan

## Pass 0 - feature inventory

New tool, no predecessor at `tools/bayesian-ab-test-calculator.html`. But it is NOT
a greenfield question: `tools/ab-test-calculator.html` already ships a **Bayesian
framing** (`ab-test-ui.js` framing `bayes`, backed by `ab-test-math.bayes`).

### What the existing frequentist tool already does (must not merely repeat)

| Capability in ab-test-calculator's `bayes` framing | Detail |
|---|---|
| P(B>A) | numeric integration, `AB.bayes` |
| Mean lift (absolute) | `mB - mA` |
| 95% credible interval on the **absolute** lift | hardcoded 0.025/0.975 |
| BF10 (beta-binomial) | `lbeta` ratio |
| Prior | **hardcoded Beta(1,1)**, not user-settable |

### The moat: this tool owns the DECISION WORKFLOW

| New capability | Why it is not in the frequentist tool |
|---|---|
| **Expected loss in BOTH directions** (pp) | absent entirely; this is the decision quantity |
| **Threshold of caring** + explicit STOP / KEEP RUNNING read | absent |
| **Threshold sensitivity table** (which thresholds are already cleared) | absent |
| **User-settable prior** (alpha/beta, uniform / Jeffreys / custom) | hardcoded Beta(1,1) |
| **Prior sensitivity mode** (same data, 3 priors side by side) | absent |
| **Relative lift credible interval** | only absolute |
| **Posterior curve visual for both arms** | no posterior viz |
| Peeking taught honestly (why it is fine here + caveats) | absent |
| Worked when-to-stop example | absent |

Deliberately NOT repeated (linked instead, per spec):
- z-test / p-value / significance math -> link to `ab-test-calculator.html`.
- Beta density/quantile teaching -> link to `beta-distribution-calculator.html`.
- BF10 -> link to `bayes-factor-calculator.html`. (Dropped from this page on
  purpose: expected loss, not evidence ratios, is the decision rule taught here.
  Stated on-page in the method table.)

### Depth bar (new tool inherits best-tool depth)

- [x] multiple modes (3, question-framed)
- [x] scenario presets
- [x] plain-English verdict + live inference line
- [x] R code emitter (must actually run)
- [x] explainer / how-computed with live numbers + FAQ
- [x] visual answer (posterior curves + loss-vs-threshold bar)

## Modes (the "I want to ..." selector)

1. `decide which variant to ship` - full read: posteriors, P(B>A), both losses,
   abs + rel lift CI, stopping read.
2. `check whether I can stop the test now` - headline STOP / KEEP RUNNING vs the
   threshold of caring + threshold sensitivity table.
3. `check how much my prior is driving the answer` - same data under
   uniform / Jeffreys / custom prior, side by side.

Shared inputs: conversions+visitors for A and B, prior alpha/beta, threshold of
caring (pp), credible level.

## Pass 1 - math + truth

Posteriors: `A ~ Beta(a0+cA, b0+nA-cA)`, `B ~ Beta(a0+cB, b0+nB-cB)`.

- `P(B>A) = int_0^1 f_B(b) F_A(b) db`
- `loss_A := E[max(pB-pA,0)] = int_0^1 f_A(a) [ mB*sf(a;a2+1,b2) - a*sf(a;a2,b2) ] da`
  (expected loss of **choosing A** when B is really better)
- `loss_B := E[max(pA-pB,0)] = int_0^1 f_B(b) [ mA*sf(b;a1+1,b1) - b*sf(b;a1,b1) ] db`
  using `E[x*1(x>c)] = mean * sf(c; alpha+1, beta)`.
- Absolute lift CI: invert `P(D<=d) = int f_A(a) F_B(a+d) da`.
- Relative lift CI: invert `P(R<=r) = int f_A(a) F_B(a(1+r)) da`.

### Free exact oracles (no R needed)
- Identical arms + identical priors => `P(B>A) = 0.5` exactly, `loss_A == loss_B`.
- **Identity `loss_A - loss_B == mB - mA`** holds for every case (E[x+]-E[(-x)+]=E[x]).

### Oracles
1. R `integrate()` at rel.tol 1e-12 - precision oracle (same integrand => checks my
   quadrature, NOT my derivation).
2. R Monte Carlo `rbeta` at N=4e6 - **derivation** oracle (independent of the
   integrand algebra). Gated loosely, ~4 sigma.
3. mpmath 60 dp - adjudicator wherever R and JS are both double-limited
   (tiny losses, deep tails).

Gate: <=1e-6 relative vs R integrate on every case; MC within sampling error;
identity `loss_A - loss_B == mB - mA` to 1e-12.

### Edge cases
tiny n (1 visitor), zero conversions, cA==nA (all convert), equal rates (symmetry),
strong prior (Beta(100,100)) swamping small data, Jeffreys prior (0.5,0.5),
huge separation (loss ~1e-12), lopsided n, big n (1e5).

## Pass 2 - library

`tools/lib/bayes-ab-math.js` (UMD, global `BayesABMath`) **composing**:
- `tools/lib/beta-math.js` (global `BetaMath`) - dbeta/pbeta/**sfbeta** (tail-accurate)/qbeta
- which itself composes `tools/lib/ttest-math.js` (lgamma/ibeta)

ZERO edits to either upstream lib (proof: md5 unchanged vs their existing `?v` pins,
`ttest-math` 53c42e8a, `beta-math` 60eae773). Consistency cross-check in the harness:
my `P(B>A)` must agree with `ab-test-math.bayes`'s `pBbetter` (the sibling tool
displays the same number).

## Registration
- `COMPENDIUM_TOOLS` + icon in `_build/build.py` (group: Bayesian)
- `CATEGORIES` (Bayesian) in `_build/gen_tools_landing.py`
- `C3META` card
- content-hash `?v` pins on ttest-math, beta-math, bayes-ab-math, ui
- slug into `Scripts/tool-audit/tool-list.json`

---

# Pass 4 - results (all gates green)

## Verification

| Gate | Result |
|---|---|
| Math harness vs R | **698 checks, 0 failed.** Worst relative error vs `integrate()` **1.744e-8** (gate 1e-6) |
| Monte Carlo (derivation oracle) | every case within 4 sigma of its own MC standard error |
| Exact 80-dp adjudicator | 19/20 cases (Jeffreys has non-integer shapes, no finite sum); confirms R to ~1e-13 |
| Loss identity `lossA-lossB==mB-mA` | holds on every case |
| Symmetry (identical arms) | `P(B>A)=0.5`, `lossA==lossB`, `dLo==-dHi` |
| Sibling consistency | `P(B>A)` and the 95% lift CI match `ab-test-math.bayes` (the frequentist tool prints the same number) |
| Local E2E | **422 checks, 0 failed** - every rendered value vs truth, all 3 modes, 20 cases |
| Emitted R | **9 blocks run in real R; every `#>` line matches byte for byte** |
| Chrome | 1 injected chrome, 0 own mastheads, `.sitenav` present, 81 sidebar links, `.rail-fold`, no in-page footer |
| Page audit | clean (only localhost-only 404s: `/cdn-cgi/trace`, `/api/me`, both CF-only) |
| Rendered size | **196KB** (ceiling 200) |
| Responsive | no overflow at 360 / 390 / 768 / 1280 |

## Two bugs the truth-building caught (recorded, since both were silent)

1. **R's `integrate(f, 0, 1)` misses a narrow posterior.** For `big-n`
   (5000/100000, sd 0.0007) it returned loss ~1e-19 *reporting success*; the true
   value is 1.5e-3. Caught by the identity + MC, not by R. Fix: confine every
   integral to the `qbeta` window where the density has mass. The same trap is
   why the emitted R code carries `win()` rather than integrating over 0..1.
2. **R stops being an oracle below ~1e-9.** For `huge-separation` R's integrate
   gives lossB = 4.44e-109 where the exact value is 8.06e-84 (25 orders out).
   Hence `FLOOR = 1e-9`: gated relatively above it, and proven negligible by the
   exact route below it rather than assumed.

## Parity / scope checklist (Pass 0)

- [x] Every capability of the frequentist tool's `bayes` framing is present or better:
      P(B>A) (+ consistency-pinned to it), mean lift, absolute lift CrI (now at
      90/95/99, was hardcoded 95), prior (now settable, was hardcoded Beta(1,1)).
- [x] BF10 **dropped on purpose**, stated on-page in the method table: this page
      decides with expected loss (business units), not evidence ratios; the Bayes
      Factor Calculator is linked for that question.
- [x] Frequentist significance math not repeated; linked instead.
- [x] New: expected loss both ways, threshold of caring, stop/keep read, threshold
      sensitivity table, prior sensitivity mode, relative lift CrI, posterior curves.
- [x] Depth bar: 3 modes, 6 scenario chips, verdict, plain-English box, live
      inference line, R emitter, how-computed with live numbers, FAQ, method table.
- [x] 3 old-tool UX features: tool lead under H1, "I want to ..." mode-selector
      banner before inputs, live inference line after results.
- [x] Registration: COMPENDIUM_TOOLS + icon, CATEGORIES, C3META, `?v` pins,
      tool-list.json.
- [x] Zero edits to `ttest-math.js` (53c42e8a) and `beta-math.js` (60eae773):
      md5s still equal their existing pins, so no sibling page needs re-pinning.

## Deliberate limits (stated on-page)

- Two arms only. 3+ variants needs P(best) and loss against the best of the rest,
  which is a different calculation, not a loop over pairs. Said so in the method table.
- Losses below 0.0001pp print as `<0.0001pp` rather than a fake digit.
