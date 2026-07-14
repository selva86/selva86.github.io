# Power Analysis reskin - parity checklist

Source of truth: the CURRENT `tools/power-analysis.html` (old "workshop" design system,
223 KB, 48 IBM Plex refs). Target shell: `tools/t-test-calculator.html` (Lab-sheet v2).
Math + features are R-verified (`Scripts/tool-truth/power-analysis.json`, harness
`test-power-analysis-math.js` PASSES). This reskin changes the DESIGN SYSTEM only.
Rule: zero feature loss. Every line below ships in v2 or is dropped with a stated reason.

## Designs (8) - all preserved
- [x] oneT   one-sample t-test        (Cohen's d)
- [x] twoT   two-sample t-test        (Cohen's d, allocation ratio k)
- [x] paired paired t-test            (Cohen's d, within-pair r)
- [x] oneProp one-proportion test     (p0, p1 -> Cohen's h)
- [x] twoProp two-proportion test     (p1, p2 -> Cohen's h)
- [x] anova  one-way ANOVA            (Cohen's f, k groups)
- [x] correlation Pearson correlation (r)
- [x] chisq  chi-square GoF           (Cohen's w, df)

## Solve modes (4) - all preserved
- [x] n (sample size), power, effect (MDE), alpha

## Scenario presets (6) - all preserved
- [x] ttest (two-sample d=0.5, solve n)
- [x] anova (k=4 f=0.25)
- [x] prop  (two-prop 0.10 vs 0.15)
- [x] corr  (r=0.3)
- [x] chisq (3x3, df=4, w=0.3)
- [x] custom (edit your own)
- [x] scenario context card (title + story + clear)

## Per-design inputs - all preserved
- [x] effect field per design (d / h via p / f / r / w)
- [x] twoProp p1,p2 ; oneProp p0,p1 (h auto-derived, shown)
- [x] allocation ratio k (twoT)
- [x] within-pair r (paired)
- [x] k groups (anova)
- [x] df (chisq)
- [x] alpha, target power, n
- [x] tail two/one-sided (oneT, twoT, paired, oneProp, twoProp, correlation)
- [x] input clamping/validation preserved from renderInputs()

## Outputs - all preserved
- [x] result display: label + solved value + aux formula (per solve mode)
- [x] recap / "how we got there": design, effect, params, alpha, power, solved n, total N
      -> rendered as the results stats grid + a live "How this is computed" collapsible
- [x] callouts / warnings: tiny effect (|d|<0.05), extreme proportions, |r| near 1
- [x] inference banner (decisive one-sentence, per solve mode)
- [x] method-intro line -> folded into plain-English box
- [x] R code emitter for all 8 designs x all solve modes (pwr.t.test / pwr.p.test /
      pwr.2p.test / pwr.anova.test / pwr.r.test / pwr.chisq.test, ES.h() for props,
      d_z conversion for paired). SEE CHANGE 1.
- [x] interactive power curve viz (power vs n, target line, current-n dot, axes/ticks,
      caption, readout) - PRESERVED (genuine what-if capability)
- [x] viz sliders (3 per design; effect/alpha/power or p0/p1, p1/p2, rPaired, k, df) - PRESERVED
- [x] trust line (no data leaves browser / verified vs pwr / free)

## Teaching content - all preserved
- [x] tool lead under H1
- [x] 4-min primer dropdown (4 paragraphs)
- [x] "When to use this" per-design (use-when + example + inputs-needed) -> compact
      per-design "When to use this" collapsible in the inputs card
- [x] Anatomy of a power calculation (5 formula steps: noncentral t / F / prop normal
      approx / Fisher-z correlation / chi-square noncentrality)
- [x] "When this is the wrong tool" alt-list (clustered, survival, Bayesian, pilot, GLMM)
- [x] Further reading (5 links) + numerical-accuracy note
- [x] FAQ (3 items, matches FAQPage JSON-LD)

## Metadata - reused verbatim (already passed audit; title 43ch within 40-60 contract)
- [x] title, meta description, keywords, canonical, OG/Twitter
- [x] JSON-LD: WebApplication + BreadcrumbList + FAQPage (3 blocks)

## Analytics/infra - preserved
- [x] tool_use (first interaction), tool_copy (on copies)
- [x] consent-mode GA + consent-banner.js + CF beacon
- [x] lib pinned: /tools/lib/power-math.js?v=ff8f3f6a (md5 confirmed)

## DELIBERATE CHANGES (stated reasons)
1. **R code: in-browser-runnable -> static, copyable.** The old page ran R in the
   browser (WebR). Every v2 Lab-sheet tool (t-test, roc-auc, bayes) ships a STATIC
   "the same test in R" block with a copy button instead: the page computes everything
   itself (verified against pwr to <1e-6) and the R snippet is for reproduction, not
   execution. Consistent platform behaviour; no statistical capability lost. WebR
   runtime + editor dropped (also removes ~heavy assets, part of the weight fix).
2. **Toast notifications -> inline "Copied" confirmation** on the copy buttons (t-test
   pattern). Same feedback, less chrome.
3. **Design system: old --c-* navy tokens + IBM Plex stack -> Lab-sheet Inter + green
   --acc tokens.** This IS the reskin. All IBM Plex refs in the source removed; the only
   remaining Plex refs are inside the build.py-injected site footer (chrome, not body).
4. **Stat-triplet "tool-meta" strip removed** ("8 designs / 3 solve modes / ...") -
   owner AI-tell list (no comma-parade of stats). The banner + method content carry it.
5. **section-eyebrow kickers removed** (owner AI-tell: no small uppercase labels).

## Added (no loss, meets skill bar)
- [x] copyable journal-ready report line (skill requires; old page had none)
