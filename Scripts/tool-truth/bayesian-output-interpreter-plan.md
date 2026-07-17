# bayesian-output-interpreter - build plan

## Pass 0: feature inventory

No predecessor. `git log --all --oneline -- tools/bayesian-output-interpreter.html` is
empty and nothing matching `bayesian-output-interpreter*` exists on any branch. So there
is no parity debt to pay: the bar is instead the depth of the best existing interpreters
(`lmer-output-interpreter`, `coxph-output-interpreter`, `glm-output-interpreter`).

Depth bar inherited from those, every line of which must ship:

| Capability | How it ships here |
| --- | --- |
| Multiple modes | 4: Read every line / Coefficients / Convergence / Verdict |
| Scenario presets | 6 chips, every one a REAL captured output (5 rstanarm + 1 brms) |
| Plain-English verdict | `.plain` box + `.infline` inference line, live |
| R code emitter | live "same thing in R" block, copyable, verified to run |
| Explainer + FAQ | 4 prose `.sect` blocks + 7-question `<details>` FAQ |
| Tool lead under H1 | `.dek` |
| "I want to ..." banner | `#iwant`, select synced with mode pills |
| Live inference line | `#inference-line` |
| Anatomy of the output | region-labelled view (the lmer `regions[]` pattern) |
| Error handling | format-specific messages listing supported formats |

## Presets: provenance (the hard rule - never fabricate output text)

`rstanarm` installs from CRAN as a Windows binary with no C++ toolchain, so five models
were genuinely fitted on this box by `Scripts/tool-truth/bayesian-output-interpreter.R`:

| key | model | why |
| --- | --- | --- |
| `gauss` | `stan_glm(mpg ~ wt + hp, data = mtcars)` | healthy fit, the happy path |
| `logit` | `stan_glm(switch ~ dist100 + arsenic, wells, binomial)` | log-odds coefficients; intercept CI spans 0 |
| `weak` | same shape, `iter = 50` | genuine Rhat 2.448, n_eff 4, real divergences |
| `mlm` | `stan_glmer(mpg ~ wt + (1 | cyl), mtcars)` | `b[]` offsets + `Sigma[]` variance row |
| `diverge` | `stan_glmer(..., adapt_delta = 0.40)` | 100 genuine divergent transitions |

Versions on the box, stated on-page: R 4.6.0, rstanarm 2.32.2, rstan 2.32.7,
StanHeaders 2.32.10. Presets captured with `print(summary(fit), digits = 3)`.

`brms` compiles every model with a C++ toolchain and **no Rtools is installed**
(`pkgbuild::has_build_tools()` is FALSE), so brms cannot fit here. Per the spec the brms
preset is therefore lifted VERBATIM from the official brms documentation
(<https://paulbuerkner.com/brms/>, the package homepage maintained by the author) by
`Scripts/tool-truth/gen-brms-preset.py`, which strips knitr's `#> ` prefix and changes
nothing else. That provenance is stated on the page itself, not just here.

## Truth table

`Scripts/tool-truth/bayesian-output-interpreter.json` - for every rstanarm preset the
expected numbers are read off the **fitted model object** and the script asserts they
equal the printed text (`TEXT/OBJECT MISMATCH` aborts the run). So the truth table is
grounded in the model, not in a re-read of the text.
`Scripts/tool-truth/brms-preset.json` - expected numbers parsed by an independent Python
reader, since no object exists locally.

Gate: `Scripts/tool-truth/test-bayesian-output-interpreter-math.js` asserts the JS parser
reproduces every estimate, interval bound, Rhat and ESS **exactly** (these are decoded
from text, so equality is exact, not 1e-6 tolerance).

## Formats supported

1. **rstanarm** `summary(stanreg)`: `Model Info:` / `Estimates:` (mean, sd, quantiles) /
   `Fit Diagnostics:` / `MCMC diagnostics` (mcse, Rhat, n_eff). Estimates and diagnostics
   are two separate tables that must be **joined by parameter name**.
2. **brms** `summary(brmsfit)`: `Family:` / `Formula:` / `Draws:` / `Group-Level Effects:`
   / `Population-Level Effects:` (or `Regression Coefficients:` in brms >= 2.22) /
   `Family Specific Parameters:`, columns Estimate, Est.Error, l-95% CI, u-95% CI, Rhat,
   Bulk_ESS, Tail_ESS. Older `Eff.Sample` tolerated.

Both parse by **reading column order off the header by position** and **peeling numeric
tokens off the right** of each row, which is what survives parameter names containing
spaces (`b[(Intercept) cyl:4]`).

## The honesty points this tool must make

- rstanarm's default `summary()` prints the **10%/50%/90%** quantiles, which is an **80%**
  central interval, not 95%. Users routinely misread it as 95%. Say so loudly.
- A credible interval is a statement about the parameter given model+prior+data; a
  confidence interval is a statement about the procedure's long-run coverage. One honest
  sentence, no straw man about the frequentist definition.
- "CI excludes 0" does not license "the effect is real" - it is not a significance test,
  it depends on the prior, and at 80% it is weak.
- A printed summary contains only **marginal** summaries. Anything needing the draws
  (loo, bayes_R2, pp_check, joint probabilities) is not recoverable from a paste. P(b>0)
  is offered only as a **normal approximation** from mean/sd, labelled as such.

## Registration checklist

- [ ] `_build/build.py` COMPENDIUM_TOOLS entry + sidebar icon
- [ ] `_build/gen_tools_landing.py` CATEGORIES + C3META card
- [ ] `Scripts/tool-audit/tool-list.json` slug
- [ ] content-hash `?v=` pin on every lib reference
- [ ] cross-link posterior-calculator, bayesian-ab-test-calculator, bayes-factor-calculator
