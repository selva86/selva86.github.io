# power-analysis v2 - build plan + parity checklist

Rebuild `tools/power-analysis.html` on the v2 Lab sheet shell. R-verified, Playwright-tested.
Predecessor: old `tools/power-analysis.html` (204KB, pre-v2 batch). Reference shell: `tools/ab-test-calculator.html` (most recent v2).

## Pass 0 - FEATURE INVENTORY of predecessor (every capability must ship in v2 or be waived on-page)

### Designs (8) - PARITY: all 8 ship
| key | name | effect | notes |
|-----|------|--------|-------|
| oneT | one-sample t-test | Cohen's d | tail |
| twoT | two-sample t-test | Cohen's d | tail + allocation ratio k=n2/n1 |
| paired | paired t-test | Cohen's d (raw) | tail + within-pair r |
| oneProp | one-proportion | Cohen's h(p1,p0) | tail |
| twoProp | two-proportion | Cohen's h(p1,p2) | tail |
| anova | one-way ANOVA | Cohen's f | k groups (no tail) |
| correlation | Pearson correlation | r | tail |
| chisq | chi-square GoF | Cohen's w | df (no tail) |

### Solve-for targets (4) - PARITY: all 4 ship
sample size (n) | power | effect size | alpha

### Other capabilities - PARITY
- Two-sided / one-sided toggle (t, prop, correlation)
- Allocation ratio k (twoT); within-pair correlation r (paired)
- 6 scenario presets: ttest (two-sample d=0.5), anova (k=4 f=0.25), prop (0.10 vs 0.15),
  corr (r=0.3), chisq (3x3 df=4 w=0.3), custom
- What-if viz: n-vs-power curve with live sliders (per-design slider set)
- R code emitter: pwr package (pwr.t.test / pwr.p.test / pwr.2p.test / pwr.anova.test /
  pwr.r.test / pwr.chisq.test) + ES.h() for proportions
- Method column (useWhen / example / inputs) per design
- Cohen small/medium/large benchmarks surfaced
- The 3 UX features (old tool had banner + inference already): tool lead, "I want to..." banner, inference line

### CORRECTNESS FIXES vs predecessor (v2 is more correct)
1. **two-proportion ncp BUG**: old `powerTwoProp` used `ncp = h*sqrt(n)`; R `pwr.2p.test` uses
   `ncp = h*sqrt(n/2)` (verified: 0.5-vs-0.6 -> n=387.2/arm, not ~194). v2 matches R.
2. **one-sided t power**: old `pt_nc` used the crude normal approximation. v2 uses the exact
   noncentral-t CDF (AS 243 / Lenth 1989) so one-sided t matches R's pt(...,ncp) to 1e-7.
   (Two-sided t was already exact via noncentral F; keep that or use exact nct for both.)

## Pass 1 - R truth (pwr package = ground truth)
Scripts/tool-truth/power-analysis.R -> power-analysis.json.
Forward POWER cases (given effect,n,alpha,tail,...) for every design + edge cases (tiny n, huge/tiny
effect, alpha 0.001/0.1, boundary proportions). Inverse SOLVE cases for n / effect / alpha / power at
80/90/95 targets. Unequal-ratio twoT via pwr.t2n.test.

## Pass 2 - tools/lib/power-math.js (UMD)
Exact: pt_nc (AS243), pf_nc, pchisq_nc, qt/qf/qchisq, pnorm/qnorm. cohenH. powerFn per design +
solveN/solveEffect/solveAlpha. Reuse ttest-math (lgamma/ibeta) + normal-math (pnorm/qnorm) primitives.
Node harness test-power-analysis-math.js vs truth table. Gate: all <=1e-6 rel (aim 1e-7).

## Pass 3 - page on Lab sheet shell (copy ab-test v2)
No bespoke masthead, no data-tool-v2. 3 UX features. Viz + stats grid + verdict + plain-English +
report line + how-computed + live R + trust line + method table + FAQ + go-deeper + footer.
Title 40-60ch, meta, canonical, WebApplication+FAQPage JSON-LD. GA tool_use/tool_copy. No em dashes.
Glyphs as HTML entities in markup, never CSS content.

## Pass 4 - gates
E2E rendered-vs-truth all modes; chrome check (1 injected, 0 own mastheads, sidebar); mobile 390px;
parity checklist; CF preview E2E -> merge master -> poll prod.
