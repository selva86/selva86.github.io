# /write-tool glm-output-interpreter - build plan + parity checklist

Predecessor: `tools/glm-output-interpreter.html` (old Tool-Farm design, 2660 lines,
own `.mast` masthead, unverified inline math). Sibling shell/design template:
`tools/lm-output-interpreter.html` (fresh v2 Lab-sheet rebuild). This pass = rebuild
the glm interpreter on the v2 Lab-sheet shell with a **verified math lib**
(`tools/lib/glm-math.js`) replacing four unverified inline approximations, plus the
current v2 bar (3 UX features, trust line, copyable report, GA events, visible FAQ,
90/95/99 CI selector, contract title). No capability dropped except in-browser R
execution (waived + taught on-page).

## Pass 0 - full feature inventory of the predecessor (all preserved unless waived)

**Modes (2):** `single` (paste one `summary(glm())`) and `compare` (2-5 pasted
summaries, add/remove). Mode rendered twice + synced: pill tabs AND the inline
`<select>` inside the "I want to ..." banner.

**Family registry (10 keys, `FAMILIES`):** binomial(logit)=logistic/odds/exp,
binomial(probit)=latent, binomial(cloglog)=cloglog, poisson(log)=rate/exp,
quasipoisson(log)=rate/exp, quasibinomial(logit)=odds/exp, gaussian(identity)=linear,
Gamma(inverse), Gamma(log)=rate/exp, negbin(log)=rate/exp. Each: `{family, link, label,
icon, exp:bool, scale:'odds'|'rate'|'latent'|'cloglog'|'linear'|'inverse'}`.
`detectFamily(callLine)` autodetects from the `family=` / `glm.nb(` in the Call;
`family-override-sel` lets the user force any of the 10 (or auto).

**Method meta (7 families, `METHOD_META`):** per-family useWhen / example / inputs list.

**Scenarios (6, `SCENARIOS`):** logistic_mtcars (am ~ wt + hp, default on boot),
poisson_warpbreaks, quasipoisson, logistic_interaction (score * type), gamma (log link),
custom (clears). Each pastes a full realistic `summary(glm())` block. Scenario context
card (icon / title / story).

**Parser `parseGlmSummary`:** strips `> ` prompts; Call (multi-line, paren-balanced) +
family detect; Coefficients table (name / estimate / SE / z-or-t / p / signif stars /
aliased-NA flag; last-4-numeric-token rule; handles `< 2e-16`, scientific, NA);
Dispersion line (family + value or NA); Null deviance + df; Residual deviance + df;
AIC (or NA); Fisher Scoring iterations. Derives n = nullDf + 1.

**Computed / recomputed math (ALL 4 unverified in predecessor -> replace):**
- Coefficient CI: `est +/- qnorm(1-a/2)*SE` (Wald, matches `confint.default`).  [inline Acklam qnorm, NO Halley]
- exp(coef) + exp(CI): odds ratio (logit) / rate ratio (log) for `exp:true` families.
- Model LR test: `LR = nullDev - residDev`, `df = nullDf - residDf`, `p = pchisq(LR, df, lower=FALSE)`.  [inline gammaSeries/gammaCF]
- Deviance/df dispersion ratio + overdispersion flag; McFadden-style pseudo-R2 = `1 - residDev/nullDev`.
- Compare: AIC (pasted) + **BIC reconstructed** `= AIC - 2*k + log(n)*k`, k = nCoef (+1 for gaussian/Gamma).  [computeBIC]
- Nested LRT: non-quasi chi-sq `= devSmall - devBig` on `dfSmall - dfBig`; quasi F `= (LR/df)/phi_big`, `pf(F, df, dfBig)`.  [inline betaIncReg/betaCF F-tail]
- Coefficient p-value distribution: **z** (binomial/poisson/negbin, dispersion fixed=1) vs **t** on residual df (quasi/Gamma/gaussian, dispersion estimated). Matches `summary(glm)`.

**Interpretation engine `interpretCoefficient` (link-aware):** aliased / intercept
(odds->baseline prob, rate->baseline count, latent->probit prob) / interaction /
continuous, branched by `fam.scale`. Per-coef evidence badge from `pVerdict`.

**Diagnostics `diagnosticCallouts` + `modelDecision`:** aliased/rank-deficient;
logistic separation (|est|>10 & SE>10); high Fisher iterations; poisson/binomial
overdispersion (D/df>1.5); quasi dispersion inflation; gaussian(identity)==lm nudge;
few resid df. Decision card: broken / solid / significant-modest / borderline / no-signal
from LR test p + McFadden.

**Outputs:** banner sentence; workshop (context/paste/read) + parse-status + family badge;
decision card; live summary sentence; coefficient table (name/est/[exp]/SE/p+stars/CI at
selected level); fit grid (McFadden / LR chi-sq / LR p / AIC / phi-or-D:df); coef-by-coef
plain-English; diagnostic callouts; COMPARE table (model/predictors/family/n/resid df/null
dev/resid dev/AIC/BIC/McFadden, best-AIC highlighted) + nested LRT table + recommendation +
caveats + mixed-family warning. Inference band (single + compare). Viz: SINGLE predicted
curve (logit sigmoid / log rate / identity line) with intercept+slope sliders seeded from
parsed coefs; COMPARE resid-deviance + AIC bar panels. R-code emitter (single + compare,
`confint.default`, `anova(test=Chisq|F)`), syntax-highlighted.

## Gaps found vs the current v2 bar (this pass fixes)

1. **Four unverified inline approximations** (Acklam qnorm w/o refinement; gammaSeries/gammaCF
   chi-sq; betaIncReg/betaCF F-tail; probit approx). -> FIX: `tools/lib/glm-math.js` (UMD)
   composing verified `normal-math` (pnorm/qnorm/gammq) + `ttest-math` (ibeta/pTwoTailed/tQuantile).
   Truth `Scripts/tool-truth/glm-output-interpreter.{R,json}`, harness `test-glm-output-interpreter-math.js`,
   gate all <=1e-6 rel.
2. **CI level fixed at 95% (from a `ci-level` select that already exists but only 80/90/95/99).**
   -> keep a 90/95/99 selector wired to Wald qnorm CI; truth covers all three.
3. **BIC reconstructed inline, unverified.** -> verify `bicFromAic` vs R `BIC(fit)`.
4. **McFadden label:** predecessor calls `1 - residDev/nullDev` "McFadden". It is the
   deviance-ratio pseudo-R2 (McFadden proper uses logLik). -> keep the computable quantity,
   label it honestly ("pseudo-R2, 1 - resid dev / null dev"); truth records BOTH so the
   on-page note is accurate.
5. **Own `.mast` masthead + old design.** -> rebuild on Lab-sheet shell, no own header,
   no `data-tool-v2`; build.py injects site chrome.
6. **No GA `tool_use`/`tool_copy`, no consent-mode gtag/consent-banner.js.** -> ADD (match lm/vif).
7. **No standard trust line; no copyable one-line report.** -> ADD both.
8. **FAQ absent / JSON-LD only.** -> render VISIBLE FAQ + JSON-LD (WebApplication + FAQPage + BreadcrumbList).
9. **Non-contract title** `glm() Output Interpreter . r-statistics.co` -> contract 40-60ch
   `Free glm() Output Interpreter: Read Your R GLM` (46 ch).
10. **Deviance goodness-of-fit p** not currently surfaced -> ADD (residDev ~ chi-sq on residDf)
    for binomial/poisson as an overdispersion / lack-of-fit read.

## Deliberately changed capability (stated + taught on-page)

- **In-browser R execution: never present in the predecessor** (it was already a paste-and-read
  interpreter, no WebR). The v2 keeps that model: a live, R-verified, copy-paste-ready code block.
  Reason taught in the "same thing in R" note: you already ran `glm()` to get this output, so the
  snippet reproduces every displayed number back in your own session. (Rubric 6 met by correctness
  of the emitted code.)

## Parity checklist (every predecessor capability ships)

- [ ] single mode + compare mode (2-5 models, add/remove)
- [ ] mode pills + banner `<select>` kept in sync
- [ ] all 10 families in override select; auto-detect from Call; family badge
- [ ] all 6 scenarios, logistic_mtcars default on boot; scenario context card
- [ ] full parser (Call/family, coef table w/ stars + aliased + z-or-t, dispersion, null/resid deviance+df, AIC, Fisher iters; `>`/`< 2e-16`/scientific/NA)
- [ ] parse-status line + workshop 3 columns + method-meta per family
- [ ] decision card (broken/solid/modest/borderline/no-signal) + live summary sentence
- [ ] coefficient table (name/est/exp/SE/p+stars/CI) with 90/95/99 selector, z-vs-t p, Wald qnorm CI
- [ ] exp(coef)+exp(CI) odds/rate ratios for exp:true families
- [ ] fit grid (McFadden / LR chi-sq / LR p / AIC / dispersion) + deviance GOF read
- [ ] per-coefficient plain-English (aliased/intercept/interaction/odds/rate/latent/cloglog/linear)
- [ ] diagnostic callouts (aliased, separation, Fisher iters, overdispersion, quasi phi, gaussian==lm, few df)
- [ ] compare table (model/predictors/family/n/df/nullDev/residDev/AIC/BIC/McFadden, best highlighted) - verified BIC
- [ ] nested LRT table (chi-sq or F) + "not nested" flag + recommendation + caveats + mixed-family warning
- [ ] inference band (single + compare variants)
- [ ] single predicted-curve viz (logit/log/identity) with sliders seeded from parse; compare bar panels
- [ ] R-code emitter (single + compare), live from parse, copyable, `confint.default` + `anova`
- [ ] tool-lead, "I want to..." banner mode selector, live inference line (the 3 UX features)
- [ ] method table (when-wrong-tool) + FAQ (visible + JSON-LD) + further reading + numerical note
- [ ] trust line, copyable #report line, GA tool_use/tool_copy + consent + CF beacon
- [ ] contract title, canonical, meta desc, OG, WebApplication+FAQPage+BreadcrumbList JSON-LD
- [~] WebR execution -> N/A (predecessor had none); live copyable verified block, reason on-page

## Pass 1 truth coverage (glm-output-interpreter.R)

Real fits (family/link exercised): binomial(logit) am~wt+hp mtcars; poisson(log)
breaks~wool+tension warpbreaks; quasipoisson(log) same (t + dispersion + F nested);
Gamma(log) synthetic positive; gaussian(identity) mpg~wt+hp (==lm); binomial(probit).
For each: coef z-or-t/p, `confint.default` at 90/95/99, exp(coef), exp(confint.default),
nullDev/nullDf/residDev/residDf, AIC, `BIC(fit)`, LR test (`nullDev-residDev` ~ chisq),
McFadden(logLik) + deviance-ratio, deviance GOF p. Nested pairs: chisq (`anova(...,Chisq)`)
and quasi F (`anova(...,F)`). Synthetic coef edges: huge z (p~0), z~0 (p~1), t small df.
Chi-sq upper-tail edges + F upper-tail edges. BIC-from-AIC reconstruction per real fit.

## Pass 4 gates

- [ ] Node math harness: ALL truth cases <=1e-6 rel (aim 1e-7+)
- [ ] Playwright E2E vs truth (both modes, all families via override, CI levels, scenarios, edge pastes, R block reproduces, viz)
- [ ] build.py --only chrome check (1 injected chrome, 0 own masthead, sidebar present)
- [ ] mobile 390px no horizontal overflow
- [ ] parity checklist above fully checked
- [ ] commit explicit paths to tools-v2, push, CF preview poll (NEW-content discriminator)
