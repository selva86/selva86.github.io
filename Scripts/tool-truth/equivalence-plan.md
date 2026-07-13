# equivalence-noninferiority-calculator v2 - plan + parity sign-off

v1 = WebR page (webr-init.min.js, no math lib, 230 KB). v2 = static Lab-sheet shell,
R + TOSTER-verified `equivalence-math.js`, 60 KB self-contained (164 KB after chrome).

## Ground truth
Base R (version-stable), cross-checked bit-for-bit against the TOSTER package:
- analyze continuous  -> `tsum_TOST` (var.equal TRUE/FALSE, bias_correction=FALSE)
- analyze proportions -> `TOSTtwo.prop`
- plan equivalence    -> `powerTOSTtwo.raw` (cont) / `powerTOSTtwo.prop` (prop)
17/17 cross-checks assert agreement to 1e-7 inside `equivalence.R`.
NI / superiority sample size have no single canonical TOSTER function; they use the
standard one-sided normal-approximation (z at 1-beta), evaluated in base R.

## Parity checklist (Pass 0 -> signed off Pass 4)
- [x] Plan mode (required n per group)                     Analyze/Plan pills
- [x] Analyze mode (TOST from summary stats)               "
- [x] Equivalence / Non-inferiority / Superiority          type select in "I want to" banner
- [x] Continuous (two means) + Proportions                 datatype select
- [x] Plan-cont bounds in Cohen's d + assumed effect mu    i-pclow/i-pchigh/i-pcmu
- [x] Plan-prop assumed p1,p2 + prop-diff bounds           i-ppp1/i-ppp2/i-pplow/i-pphigh
- [x] Analyze-cont raw bounds + Cohen's d reported         i-alow/i-ahigh
- [x] Analyze-prop prop-diff bounds                        i-aplow/i-aphigh
- [x] (1-2alpha) confidence interval                       stats grid + viz
- [x] alpha picker 0.10/0.05/0.025/0.01                    opts pills
- [x] Verdict (equivalent / not / inconclusive / NI / superior)
- [x] CI-vs-band visualization                             #viz SVG, live
- [x] Live R code emitter                                  FIXED (runs + reproduces)
- [x] Method table + inference banner                      below-fold + infline
- [x] 5 of 6 scenario presets                              chips

## Added in v2
- var.equal toggle (pooled Schuirmann vs Welch) - v1 was pooled-only.
- Emitted R rewritten to runnable base R (+ a TOSTER cross-reference comment).
  v1 emitted `TOSTtwo(low_eqbound=)` - wrong arg name for that function.
- Plain-English box + journal-ready report line.
- FAQ + WebApplication/FAQPage JSON-LD.

## Dropped, with reason
- 6th preset "custom / use my own numbers": a no-op that only cleared presets;
  every field is already editable, so it added nothing.
- v1 "viz sliders" panel: redundant once every input recomputes instantly and the
  viz is live; the what-if lever is preserved by the live inputs.
- v1 "paired" preset label: v1 computed a two-sample TOST under that name, never a
  paired test. Not a real capability; v2 is two-sample only and says so.

## Correctness fix carried into v2
v1 superiority reused the equivalence UPPER test `t=(high-diff)/se`, which rejects
when the difference is BELOW the margin - the opposite of superiority. v2 superiority
is the one-sided "diff > margin" test `t=(diff-high)/se`, mirroring non-inferiority.

## Gates (Pass 4)
- Node harness: 258 field checks vs truth, 0 fails, worst rel err 3.96e-12.
- Playwright local E2E: 9 compute cases (analyze cont pooled/Welch/NI/super, prop
  equiv/NI, plan cont equiv/NI/super, plan prop equiv) all match rendered values;
  error handling (n<2 shows banner); R-code updates on mode switch; no JS console
  errors (only external /api/me + CF-beacon CORS, excepted).
- Emitted R re-run in R 4.6.0: reproduces displayed diff/df/p/CI/n exactly.
- Chrome: exactly 1 injected chrome, 0 own masthead, canonical .sitenav + sidebar.
- Mobile: no horizontal overflow at 360 / 390 px.
