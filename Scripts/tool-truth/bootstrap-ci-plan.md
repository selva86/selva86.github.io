# bootstrap-ci-calculator - /write-tool build plan

Rebuild of an existing v2 shell that had **never** gone through the pipeline: it
used a Mulberry32 JS RNG and inline math, so its resamples did not match R and
the emitted `boot()` code could not reproduce the displayed numbers.

## Pass 0 - feature inventory (parity target)

| Capability | Old | v2 |
|---|---|---|
| Statistics | mean, median, SD, IQR, p90, custom JS | kept, delegated to R-verified lib |
| CI methods | percentile, basic, BCa | kept **+ Normal added** (full boot.ci set) |
| Confidence | 80 / 90 / 95 / 99 | kept |
| Params | B (200-50000), seed | kept |
| Scenarios | meanNormal, medianLognormal, sdOutlier, iqrLarge, p90, custom | kept |
| Input | raw textarea, line/comma/space separated | kept |
| Viz | histogram + CI band + sliders (B/conf/seed) | kept |
| R emitter | boot + boot.ci | kept; emits all four types |
| Sections | context, anatomy, caveats, further reading, FAQ | kept + Normal anatomy step |
| 3 UX features | tool lead, I-want-to banner, inference line | all present |

**Added (parity-plus):** "All four intervals" comparison table (Normal / Basic /
Percentile / BCa, active row highlighted).

**Bugs fixed:**
- **Mulberry32 -> R Mersenne-Twister.** Reproduce R's MT + `R_unif_index()`
  rejection sampler + column-major `dim(i)<-c(R,n)` layout, so `set.seed(seed);
  boot()` draws the identical resamples. (Old resamples were unrelated to R.)
- **Percentile/basic interpolation** now uses boot's `norm.inter` (normal-scale
  interpolation between order statistics), not a plain type-7 quantile.
- **BCa acceleration** now uses boot's default empirical-influence estimate:
  regression (`empinf` type `reg`) when B >= n, jackknife when B < n. The old
  tool always used the jackknife, which differs from `boot.ci()` for nonlinear
  statistics.
- **Mean** uses R's corrected two-pass accumulation so the `t* < t0` count in the
  BCa bias correction matches R to the last ULP.
- Mangled `custom-fn` default input (`=>` broke the attribute) rewritten
  `>`-free.
- FAQ "runs 10,000 by default" corrected to 2,000.

## Pass 1 - R truth (`bootstrap-ci.R` -> `.json`)

14 cases: every statistic x {reg path (B>=n), jack path (B<n)} x 90/95/99, with
`t0`, `mean(t*)`, `sd(t*)`, first replicates, `w`, acceleration, and all four
`boot.ci()` intervals. R 4.6.0, default RNG (MT | Inversion | Rejection).

## Pass 2 - `tools/lib/bootstrap-math.js` (UMD)

R MT + `R_unif_index` sampler + boot engine (column-major index layout) +
`norm.inter` + normal/basic/percentile/BCa, with `empinf.reg` OLS (Gaussian
elimination) and jackknife fallback. Node harness `test-bootstrap-ci-math.js`:
**280/280** checks vs R, CIs to <= 1e-8. `pnorm` (West) vs R: max 1.1e-16;
`qnorm` (AS 241) vs R: exact.

## Pass 3 - page

Delegated all math to the lib; added Normal method + comparison table; rewired
scenarios to the lib RNG; honest copy (no more "Mulberry32"; "matches boot.ci()").

## Pass 4 - gates

- Browser E2E (Playwright): **152/152** rendered values + all four intervals vs
  R across every reachable mode; jack path verified via the lib in-browser.
- Emitted R code re-run in R reproduces the displayed CI (all four bounds match
  to ~1e-14).
- Chrome: exactly 1 injected chrome, 0 own mastheads, canonical navbar, 468
  sidebar links, `.rail-fold` present.
- Mobile: 360 / 390 / 768 all 0px horizontal overflow.
- No em dashes, no JetBrains Mono, no CSS hex-escape glyphs.
- Shipped to `tools-v2` (batched merge to master is the owner step).
