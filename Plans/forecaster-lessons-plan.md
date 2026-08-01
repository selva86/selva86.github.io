# Forecaster track: interactive lesson arc + widget plan

Status: PROPOSED, awaiting owner sign-off. Source of truth for the arc once approved
is `Plans/lessons-curriculum.md` (append there, keep this as the design rationale).

## Standing rule for this track

The Forecasting Handbook (74 chapters) is **reference material, not a scope limit**.
These lessons must be materially better than the handbook chapters: the handbook
explains, the lessons make the reader *feel* the mechanism by moving something and
watching the consequence. Where a topic is better taught outside the handbook's
order, or is missing from it entirely, the lesson wins.

Three things the lessons do that the handbook cannot:

1. **Move a parameter, watch the fit change.** Alpha in exponential smoothing,
   AR/MA coefficients, differencing order, Fourier K, reconciliation weights.
2. **Show the failure before the fix.** Every section leads with a forecast that
   looks fine and is wrong, then earns the tool that catches it.
3. **Backtest visibly.** The rolling origin animates; the reader sees folds
   accumulate and errors move, instead of reading that they should.

## Section arc (10 sections, 48 lessons)

Access: section 1 free in full; from section 2, lesson 1 free as a taste, rest Pro
(matches the DS Advanced tier convention).

### S1. Seeing a series clearly (5 lessons, all free)
1. Why time series break ordinary statistics - autocorrelation, and why a random
   train/test split leaks the future. `ts-anatomy`
2. The time index - regular vs irregular, gaps, duplicated stamps, time zones.
   `ts-index-lab`
3. The four plots you always draw - time, seasonal, subseries, lag. `seasonal-plot`
4. Decomposition - trend, season, remainder, and what STL actually does. `stl-decompose`
5. Reading the ACF - the single most useful diagnostic in the subject. `acf-explorer`

### S2. Baselines you have to beat (5 lessons)
1. Naive, seasonal naive, mean, drift, and why they are not toys. `baseline-forecast`
2. Fitted values and residuals - what a healthy residual looks like. `residual-check`
3. Splitting time correctly - holdout, origin, horizon. `rolling-origin` (intro use)
4. Accuracy measures - MAE, RMSE, MAPE, MASE, and where each lies to you.
   `accuracy-compare`
5. The baseline discipline - a scoreboard you keep for the rest of the track.

### S3. Exponential smoothing (5 lessons)
1. Simple exponential smoothing - drag alpha, watch the weights decay. `ses-alpha`
2. Adding trend - Holt, and why undamped trends embarrass you at long horizons.
   `holt-damped`
3. Adding season - Holt-Winters, additive vs multiplicative. `holt-winters`
4. The ETS family - what the three letters mean and how selection works. `ets-space`
5. Reading an ETS fit honestly - parameters, information criteria, what not to claim.

### S4. Stationarity and ARIMA (7 lessons)
1. Stationarity - what it means, seen rather than defined. `stationarity-lab`
2. Differencing - ordinary and seasonal, and the cost of over-differencing.
   `stationarity-lab`
3. AR and MA - sliders to shapes, the intuition most courses skip. `arma-shapes`
4. Identifying order from ACF and PACF - a drill, not a lecture. `acf-pacf-id`
5. Fitting ARIMA in R - and what `auto.arima` does behind your back.
6. Seasonal ARIMA - the notation decoded.
7. ARIMA against ETS - a fair fight on the same series, with the scoreboard.

### S5. Regression and dynamic models (5 lessons)
1. Time series regression - trend and dummy seasonality done right.
2. Fourier terms - smooth seasonality with few parameters. `fourier-terms`
3. Lagged predictors and distributed lags. `lag-explorer`
4. Dynamic regression with ARIMA errors - the model most analysts actually need.
5. Spurious regression - two unrelated trending series, r = 0.97. `spurious-lab`

### S6. Evaluation done right (5 lessons) - the track's sharpest edge
1. Rolling origin cross-validation, animated. `rolling-origin`
2. One-step versus h-step - why your error grows and how to report it. `horizon-decay`
3. Comparing two models with care - Diebold-Mariano, and when a win is noise.
4. Prediction intervals and coverage - the 95 percent that is really 70.
   `interval-coverage`
5. Backtesting a pipeline, not a model - leakage in feature engineering.

### S7. Probabilistic forecasting (5 lessons)
1. From a point to a distribution - what a forecast really is. `forecast-paths`
2. Simulation and bootstrap paths - fan charts that mean something. `forecast-paths`
3. Quantile forecasts and pinball loss. `quantile-lines` (reuse)
4. Conformal intervals for forecasts - distribution-free coverage. `conformal-bands` (reuse)
5. Scoring rules - CRPS, and why RMSE cannot judge a distribution.

### S8. Complex seasonality and machine learning (6 lessons)
1. Multiple seasonal periods - hourly data with daily and weekly rhythm. `multi-seasonal`
2. TBATS and Fourier for complex seasonality.
3. Prophet - what it is good at, and its documented failure modes.
4. Features from time - lags, rolling statistics, calendar effects, without leakage.
   `ts-feature-lab`
5. Gradient boosting for forecasting - and the trap of predicting a trend it never saw.
6. Global models - one model across thousands of series, and when it beats local.

### S9. Hierarchies and many series (4 lessons)
1. Hierarchical and grouped structure - why the parts must sum to the whole.
   `hierarchy-reconcile`
2. Bottom-up, top-down, middle-out - each one's bias. `hierarchy-reconcile`
3. Optimal reconciliation (MinT) - coherence without throwing away information.
4. Scale - forecasting ten thousand series without ten thousand decisions.

### S10. Forecasting in production (6 lessons)
1. The retraining question - cadence, triggers, and drift. `drift-monitor` (reuse)
2. Monitoring a live forecast - what to alert on. `forecast-monitor`
3. Forecast value add - proving the model beats the process it replaced. `fva-ladder`
4. Communicating uncertainty to people who want one number.
5. When to stop forecasting - series that should not be modelled.
6. Capstone: demand forecast end to end, from raw stamps to a decision memo.

## New widgets required (18 new, 6 reused)

Every widget is deterministic, self-contained, `mount(el, cfg)`, and per the standing
rule **emits real runnable R beside its visual**. Built and verified BEFORE lesson
writing starts, so authors select rather than invent.

| Widget | What the reader manipulates | Used by |
|---|---|---|
| `ts-anatomy` | Toggle trend / season / noise components, see them compose | S1.1 |
| `ts-index-lab` | Break and repair a time index: gaps, duplicates, irregular stamps | S1.2 |
| `seasonal-plot` | Switch one dataset between time, seasonal, subseries, lag views | S1.3 |
| `stl-decompose` | Drag trend and seasonal window widths, watch the panels respond | S1.4 |
| `acf-explorer` | Pick a series type, see its ACF and PACF update live | S1.5, S4.4 |
| `baseline-forecast` | Choose a baseline method, see forecast and holdout error | S2.1 |
| `residual-check` | Flip between healthy and unhealthy residuals across three panels | S2.2 |
| `accuracy-compare` | Rescale a series and watch which measures stay honest | S2.4 |
| `ses-alpha` | Drag alpha; the weight-decay bars move with the fitted line | S3.1 |
| `holt-damped` | Damping parameter against horizon, trend explosion made visible | S3.2 |
| `holt-winters` | Additive vs multiplicative season on a growing series | S3.3 |
| `ets-space` | The 30-model ETS grid, each cell showing its characteristic shape | S3.4 |
| `stationarity-lab` | Apply differences, watch rolling mean, variance and ACF settle | S4.1, S4.2 |
| `arma-shapes` | AR and MA coefficient sliders to series and theoretical ACF/PACF | S4.3 |
| `acf-pacf-id` | Drill: given plots, name the order; scored, repeatable | S4.4 |
| `fourier-terms` | K slider showing basis functions and the seasonal shape they build | S5.2 |
| `lag-explorer` | Slide a predictor's lag against the response, see cross-correlation | S5.3 |
| `spurious-lab` | Generate two independent random walks, watch a huge correlation appear | S5.5 |
| `rolling-origin` | Animate folds sliding forward, errors accumulating per fold | S2.3, S6.1 |
| `horizon-decay` | Error against horizon, per-fold spread | S6.2 |
| `interval-coverage` | Repeat an experiment, count how often the interval covers | S6.4 |
| `forecast-paths` | Sample paths fanning into a fan chart, quantiles drawn from them | S7.1, S7.2 |
| `multi-seasonal` | Toggle daily, weekly, yearly components on hourly data | S8.1 |
| `ts-feature-lab` | Build lag and rolling features, with a leakage detector | S8.4 |
| `hierarchy-reconcile` | A small hierarchy where bottom-up and reconciled totals differ | S9.1, S9.2 |
| `forecast-monitor` | A live forecast decaying, alert thresholds firing | S10.2 |
| `fva-ladder` | Forecast value add against the naive and the previous process | S10.3 |

Reused unchanged: `conformal-bands`, `quantile-lines`, `drift-monitor`,
`regression-intervals`, `gradient-boosting`, `chart-plotter`.

## Build order

1. **Widget wave A** (S1 to S3): ts-anatomy, ts-index-lab, seasonal-plot,
   stl-decompose, acf-explorer, baseline-forecast, residual-check,
   accuracy-compare, ses-alpha, holt-damped, holt-winters, ets-space.
2. Lessons S1 to S3 (15 lessons) via `batch_lessons.py`.
3. **Widget wave B** (S4 to S7): stationarity-lab, arma-shapes, acf-pacf-id,
   fourier-terms, lag-explorer, spurious-lab, rolling-origin, horizon-decay,
   interval-coverage, forecast-paths.
4. Lessons S4 to S7 (22 lessons).
5. **Widget wave C** (S8 to S10): multi-seasonal, ts-feature-lab,
   hierarchy-reconcile, forecast-monitor, fva-ladder.
6. Lessons S8 to S10 (16 lessons) + section quizzes + track landing.

## Package reality check (do before wave A)

Probe against the browser R registry (`Scripts/webr-package-compat.json`) and mark
each as live or static: `forecast`, `fable`, `tsibble`, `feasts`, `fabletools`,
`prophet`, `tbats` path in `forecast`, `hts`/`fable.reconcile`. Where a package does
not run in the browser, the widget generates the same result from base R so the
visual stays live and the package block is static with real captured output. No
lesson may depend on an unavailable package for its interactive spine.
