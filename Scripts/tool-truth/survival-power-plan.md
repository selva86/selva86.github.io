# survival-power-calculator v2 — build plan + parity checklist

Rebuild `tools/survival-power-calculator.html` (URL preserved) from v1 (inline
`pnorm`/`qnorm` + inline formulas, no math lib → v1 signal) onto the Tool Farm v2
Lab-sheet shell with an R-verified `tools/lib/survival-math.js`.

## What the tool does

Plans a two-arm randomized trial with a **time-to-event** endpoint analysed by the
**log-rank test** (equivalently, a Cox model with a single binary covariate). The
number of **events** drives power, not the number of subjects; the tool solves for
required events, then translates events → enrollment using the expected event
probability under exponential survival with uniform accrual, fixed follow-up, and
(optional) exponential dropout.

## Pass 0 — v1 FEATURE INVENTORY (parity checklist)

Extracted from `git show HEAD:tools/survival-power-calculator.html`.

| # | v1 capability | v2 disposition |
|---|---|---|
| 1 | **Solve-for modes:** sample size `n`, required `events`, `power` (given n) | KEEP — carried by the "I want to…" banner mode selector |
| 2 | **Method:** Schoenfeld, Freedman, Lakatos | Schoenfeld + Freedman KEEP (both R-verified closed forms). **Lakatos DROPPED** — v1's "lakatos" literally called `schoenfeldEvents()` (a mislabel; no real Markov math). Dropout/accrual/follow-up are retained as *universal* inputs, so no real capability is lost. Reason taught on-page in the method table. |
| 3 | Inputs: HR, alpha, power, allocation k, control median (mo), accrual A (mo), follow-up F (mo), dropout (annual), given-n | KEEP all |
| 4 | 6 scenario presets: cancer, rare, dropout, long-fu, balanced 1:1, 2:1 ratio | KEEP all 6 (chips) |
| 5 | Exponential event-probability with uniform accrual + competing dropout | KEEP (moved to lib, validated vs R `integrate()`) |
| 6 | Recap panel: λ_C, λ_T, P(event)_C, P(event)_T, avg P(event), events D, n total | KEEP (how-computed) |
| 7 | Viz: expected KM curves (control + treatment) with accrual/follow-up bands, legend | KEEP |
| 8 | Interactive sliders: HR, median, accrual, follow-up | KEEP |
| 9 | R emitter: `powerSurvEpi::ssizeCT.default` + closed-form Schoenfeld cross-check + `gsDesign::nSurv` comment | KEEP, make it actually run/reproduce |
| 10 | Callouts/guards (HR=1, tiny effect, high dropout, zero study time, huge n, low event rate) | KEEP |
| 11 | banner-sentence (was "Plan a two-arm log-rank trial using…") | REFRAME to mandated "I want to …" with the mode phrase as the selector (owner rule 2026-07-08) |
| 12 | inference-banner (live, per mode) | KEEP |

New for v2 (depth-bar / owner rules):
- Verified `survival-math.js` (UMD) composing `normal-math.js` (R-matching pnorm/qnorm; v1's inline `pnorm` was Abramowitz-Stegun ~1e-7).
- Tool lead under H1 (plain-language explainer).
- Method comparison table + FAQ + go-deeper links.
- GA consent block + consent-banner + CF beacon; `tool_use` / `tool_copy`.
- Power-given-n uses the **matching** method inverse (v1 always used Schoenfeld).

## Math (all time in MONTHS)

- Hazards: λ_C = ln2 / medianC ; λ_T = HR·λ_C.
- Dropout: annual η → monthly hazard μ = −ln(1−η)/12.
- P(event), no dropout, uniform accrual u~U[0,A], follow to calendar A+F:
  pE = 1 − (e^{−λF} − e^{−λ(A+F)}) / (λA)   (A>0);  = 1 − e^{−λF}   (A=0).
- P(event) with competing dropout hazard μ (cause-specific):
  pE = (λ/(λ+μ)) · [1 − (e^{−(λ+μ)F} − e^{−(λ+μ)(A+F)}) / ((λ+μ)A)].
- Allocation-weighted mean: p̄ = (pE_C + k·pE_T)/(1+k),  k = n2/n1.
- Schoenfeld events:  D = (z_{1−α/s} + z_β)² (1+k)² / (k·ln(HR)²).
- Freedman events:    D = ((1+k·HR)/(1−HR))² (z_{1−α/s} + z_β)² / k.
- Enrollment: n_total = D / p̄ ; n1 = n_total/(1+k) ; n2 = k·n1.
- Power (Schoenfeld inverse): power = Φ( √(Dk)/(1+k)·|ln HR| − z_{1−α/s} ).
- Power (Freedman inverse):  power = Φ( √(Dk)·|1−HR|/(1+k·HR) − z_{1−α/s} ).
- s = sided (2 = two-sided default; 1 = one-sided).

## Ground truth

Local R 4.6.0 (`/c/Program Files/R/R-4.6.0/bin/Rscript.exe`). gsDesign/powerSurvEpi
are NOT installed, so the closed forms are evaluated with R's own `qnorm`/`pnorm`
(the normal-dist precision reference) and the event-probability integrals are
**cross-checked against R `integrate()`** (validates the calculus, not just the
arithmetic). `Scripts/tool-truth/survival-power.R` → `survival-power.json`.
Node harness `test-survival-power-math.js` gates every case ≤1e-6 (aim 1e-7+).

## Gates (Pass 4)

Local Playwright E2E vs truth (every mode + edge + error handling) · build.py chrome
check (1 injected chrome, 0 own mastheads, canonical navbar + sidebar) · 390px no
overflow · parity checklist above · commit to tools-v2 · CF preview poll → master → prod.
