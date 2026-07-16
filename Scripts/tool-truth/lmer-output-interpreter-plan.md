# lmer-output-interpreter: build plan + depth-bar checklist

Wave-3 Tier 3 row 16. **New tool, no predecessor** (no live version, nothing in git
history, nothing on a preview branch), so Pass 0 is not a parity extraction but the
depth bar inherited from the best existing tools.

## Pass 0 - depth bar (new tool)

| Requirement | Shipped as |
|---|---|
| Multiple modes | 4 views over one parse: Anatomy, Random effects & ICC, Fixed effects, The p-value question |
| Scenario presets | 4, each REAL lme4 output spliced from the R truth table: random intercept, random slope, glmer binary, lmerTest |
| Plain-English verdict | `#plain` box + `#inference-line`, both live |
| R code emitter | Per-model, built from the parsed formula/data; verified by running it in R |
| Explainer + FAQ | 4 below-fold sections + 7-question FAQ accordion (`<details>`, chrome-styled) |
| The 3 old-tool UX features | tool lead under H1 (`.dek`), "I want to ..." mode-selector banner (`.iwant`), live inference line (`.infline`) |
| Visual answer | Variance-partition bar (the ICC made visual) + the labelled anatomy itself |
| Never empty on first paint | Boots with the random-intercept preset loaded |

Sibling cross-links: lm-output-interpreter, glm-output-interpreter,
anova-output-interpreter, icc-calculator, vif-interpreter.

## Pass 1 - R truth table

`Scripts/tool-truth/lmer-output-interpreter.R` -> `lmer-output-interpreter.json`.
Real `lme4` 1.1-38 / R 4.6.0 runs. 19 ICC cases (10 simulated random-intercept
spanning ICC 0.03-0.88, 2 crossed, 3 glmer logit, 4 presets) + Wald CIs + the
random-slope proof.

**Presets print at R's default `digits = 7`** so they are byte-identical to what a
user actually copies out of a console. (First cut used `digits = 10`, which printed
`1378.1785` where a real console shows `1378.2`.)

## Pass 2 - math library

`tools/lib/lmer-math.js` (UMD). **Zero-edit compose on `normal-math.js`** for
`pnorm`/`qnorm` only: its md5 is still `8f6fd067`, equal to its existing `?v` pin, so
no other tool needed re-pinning.

Gate: `Scripts/tool-truth/test-lmer-output-interpreter-math.js` - **257 pass, 0 fail**.
Worst non-slope ICC relative error vs `performance::icc`: **5.09e-14**.

## The three findings that shaped the tool

1. **`performance::icc()` is not recoverable from a random-slope paste.** Its adjusted
   ICC is the Nakagawa/Johnson mean random-effect variance
   `v_int + 2*mean(x)*cov + mean(x^2)*v_slope`, reproduced here to 1.1e-16. It needs
   `mean(x)` and `mean(x^2)` - properties of the **data**, which a printed summary does
   not contain. On sleepstudy: performance gives 0.722, intercept-only 0.483, naive
   sum 0.497. So the page reports the ICC **at x = 0**, labels the stat `ICC (at x = 0)`,
   explains why, and sends the reader to `performance::icc(model)`. It never prints a
   number claiming to be something it cannot be. The math harness asserts this as a
   NEGATIVE test (the slope value must differ by > 1e-3 and be flagged).

2. **Print rounding is the real precision limit, not the arithmetic.** R prints
   `37.12` for `37.12382676676863`. So parsed values are gated on a *derived* bound -
   half a unit in the last printed decimal, computed from the token itself - rather
   than a hand-picked tolerance. ICC from a paste lands within 7.2e-6 of exact on the
   RI preset; the page says so in "How this is computed".

3. **The emitted `confint(m, method = "profile")` ERRORS on the glmer preset**
   ("profiling detected new, lower deviance"). Found only by running the emitted block
   verbatim in R. It is now commented out for glmer with the reason taught on the spot,
   and left live for lmer where it genuinely works. E2E locks both halves.

   Running the blocks in one R session also let an earlier `library(lmerTest)` mask
   `lme4::lmer`, so the random-slope block silently fitted a `lmerModLmerTest`. Each
   block now runs in its own R process (`verify-lmer-emitted-r.R`), as a reader pasting
   it would.

## Pass 4 - gates

| Gate | Result |
|---|---|
| Math harness vs R truth | 257 pass / 0 fail |
| Local E2E (Playwright) | 102 pass / 0 fail |
| Emitted R runs in real R | 16 checks / 0 fail, isolated processes, all 4 presets |
| `page_audit` | clean except the localhost-only `/cdn-cgi/trace` + `/api/me` 404s (CF-only endpoints) |
| Chrome | 1 injected, 0 own mastheads, canonical `.sitenav`, sidebar + `.rail-fold`, no in-page footer |
| Rendered size | 185KB (ceiling 200KB) |
| Mobile | no overflow at 360 / 390 / 768 / 1280 |

## Ship

Direct on master (per the wave-3 precedent: `tools-v2` is 70 commits behind and would
conflict). Staged explicitly; the sidebar-refresh churn across the other 66 tools is
pre-existing drift from the 3 new time-series posts and is left uncommitted - the CF
build regenerates it.
