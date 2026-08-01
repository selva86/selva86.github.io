# Time Series track: gap review + interactive widget catalogue

Reviewed against `Plans/roadmap-curriculum-2026.md` section 4 (Time Series:
16 sections, 99 lessons, certificate "Time Series Forecasting"). The curriculum
itself is strong; nothing below asks to restructure it. The gaps are additions and
two clean-ups. Owner review required before any of it is applied.

Supersedes the invented arc in `Plans/forecaster-lessons-plan.md` (that file is now
design rationale only; this curriculum is the plan of record).

---

## Part A. Gap review

### A1. Real gaps, ordered by how much they cost a working forecaster

**1. Preparing a time index (missing entirely).** Nothing in 16 sections covers
irregular timestamps, gaps in the series, duplicated stamps, time zones and DST,
or aggregating raw events up to a modelling frequency. This is where every real
project starts and where most of them stall. Section 1 teaches `tsibble` but assumes
the data already arrives tidy and regular.
*Fix: add 2 lessons to Section 1: "From raw timestamps to a regular series" and
"Gaps, duplicates and time zones".*

**2. Missing values in a series (missing entirely).** Interpolation, last
observation carried forward, seasonal interpolation, and the forecasting-specific
trap that imputing then forecasting hides the uncertainty you just invented.
*Fix: 1 lesson, Section 1 or 2.*

**3. Turning a forecast into a decision (missing entirely).** The track ends at
production monitoring. Nothing covers safety stock, staffing, service levels, or
choosing a quantile because of an asymmetric cost. A forecast exists to drive a
decision, and the certificate claims a professional standard.
*Fix: 2 lessons in Section 15 or 16: "Choosing the quantile your cost function
implies" and "Communicating a forecast to people who want one number".*

**4. Forecast combination is under-weighted.** It appears as one bullet inside
Section 13 ("Bootstrapping, bagging and forecast combinations"). Combination is one
of the most reliably profitable findings in the whole forecasting literature and the
M-competition results that Section 15 cites.
*Fix: promote to 2 lessons: simple averaging and trimmed means, then weighted
combination and when weights overfit.*

**5. Accuracy by horizon.** Rolling-origin CV is well covered, but error growth
with horizon, and reporting accuracy per horizon rather than as one number, is not
called out anywhere.
*Fix: 1 lesson in Section 3.*

**6. Weekly data.** A notorious practical trap (52.18 weeks a year, no integer
seasonal period, ISO week boundaries). Not mentioned.
*Fix: fold into the Section 7 complex-seasonality lessons, or 1 dedicated lesson.*

**7. Temporal aggregation and temporal hierarchies.** Section 12 covers
cross-sectional hierarchies only. Reconciling the same series across frequencies
(MAPA, THieF) is a distinct and powerful technique.
*Fix: 1 lesson in Section 12.*

**8. Does this series even have seasonality?** Feature extraction in Section 2
implies it; no lesson makes seasonality detection and strength the explicit
question.
*Fix: fold into Section 2 features lesson, or 1 short lesson.*

**9. Count and low-volume series.** Section 15 covers intermittent demand (Croston,
ADIDA, TSB), which is the hardest case, but there is no treatment of ordinary count
series where a Gaussian assumption is simply wrong.
*Fix: 1 lesson, Section 13 or 15.*

### A2. Clean-ups (no new lessons, just naming)

**10. Section 1 has two vague catch-all titles.** "Time Series Analysis" and "EDA
for Time Series" read as legacy SEO post titles and overlap the specific lessons
beside them (seasonal/subseries/lag plots, ACF). Two of eight lessons in the free
section are doing no distinct work.
*Fix: replace with the two index-preparation lessons from gap 1. Section 1 stays at
8 lessons and gains the most practically useful material in the track.*

**11. Section 8 and Section 9 order.** State space (8) then spectral (9) is fine,
but Kalman/state space is conceptually closer to ETS (Section 5) than to spectral
analysis. Not wrong, only worth a moment's thought.
*No change recommended; flagged for the record.*

### A3. What is notably strong (do not touch)

Section 15 "The expert edge" is the best section in the curriculum and rare in
published courses: leakage in backtests, conformal intervals, intermittent demand,
forecast value added, M-competition lessons, judgmental adjustment, coverage
checking. Sections 8, 9, 10 and 11 (state space, spectral, GARCH, VAR) give the
track genuine graduate-level depth that no competitor's "forecasting in R" course
carries. Section 13 is current (DeepAR, N-BEATS, N-HiTS, TFT).

### A4. Net effect if all gaps are accepted

99 lessons becomes **109** (10 added, 2 replaced in place). Sections 1, 3, 12, 13,
15, 16 grow; nothing is removed.

---

## Part B. Interactive widget catalogue

Every widget: deterministic, self-contained `mount(el, cfg)`, and per the standing
rule **emits real runnable R beside its visual**. Built and verified before the
lessons that use them, so authors select rather than invent.

**44 new widgets, 9 reused from the existing 88.**

### Section 1. Time series foundations (free)
| Widget | The reader manipulates |
|---|---|
| `ts-anatomy` | Toggles trend, season and noise components and watches them compose into the observed series |
| `ts-index-lab` | Repairs a broken index: irregular stamps, gaps, duplicates, a DST jump |
| `ts-resample` | Aggregates raw events up to hourly, daily, weekly and sees what each choice hides |
| `seasonal-plot` | Switches one dataset between time, seasonal, subseries and lag views |
| `acf-explorer` | Picks a series type and watches its ACF and PACF respond |
| `ts-split` | Drags the train/test boundary; a random split is offered and shown leaking |
| `baseline-forecast` | Chooses naive, seasonal naive, mean or drift and sees holdout error |

### Section 2. Decomposition and features
| Widget | The reader manipulates |
|---|---|
| `ma-smoother` | Moving-average window width against how much signal survives |
| `stl-decompose` | Trend and seasonal window widths, watching the three panels respond |
| `decomp-mode` | Additive against multiplicative on a series whose seasonal amplitude grows |
| `boxcox-lambda` | Lambda slider stabilising a fanning variance |
| `calendar-adjust` | Trading-day and population adjustment, before and after |
| `ts-feature-space` | Many series plotted by trend strength against seasonal strength; click one to see it |
| `ts-impute` | Imputation method against the gap it fills, with the invented certainty made visible |

### Section 3. The forecasting toolbox
| Widget | The reader manipulates |
|---|---|
| `residual-check` | Flips healthy against unhealthy residuals across time plot, ACF and histogram, with the Ljung-Box result moving |
| `forecast-dist` | A point forecast expanding into a distribution and a fan chart |
| `rolling-origin` | Animates folds sliding forward, errors accumulating per fold |
| `horizon-decay` | Error against horizon, per-fold spread visible |
| `accuracy-compare` | Rescales a series and watches which measures stay honest (MASE, RMSSE survive; MAPE breaks) |
| `pinball-loss` | The asymmetric loss geometry behind a quantile forecast |

### Section 4. Time series regression
| Widget | The reader manipulates |
|---|---|
| `tslm-builder` | Adds trend and seasonal terms one at a time and watches fit and residuals |
| `fourier-terms` | K slider showing the basis functions and the seasonal shape they build |
| `lag-explorer` | Slides a predictor's lag against the response, cross-correlation updating |
| `holiday-effects` | Toggles holiday and calendar dummies on a retail series |
| `spurious-lab` | Generates two independent random walks and watches a huge correlation appear |

### Section 5. Exponential smoothing
| Widget | The reader manipulates |
|---|---|
| `ses-alpha` | Alpha slider; the weight-decay bars move with the fitted line |
| `holt-damped` | Damping parameter against horizon, trend explosion made visible |
| `holt-winters` | Additive against multiplicative season on a growing series |
| `ets-space` | The ETS taxonomy grid, each cell showing its characteristic forecast shape |

### Section 6. ARIMA and seasonal ARIMA
| Widget | The reader manipulates |
|---|---|
| `stationarity-lab` | Applies differences; rolling mean, variance, ACF and the KPSS verdict settle |
| `arma-shapes` | AR and MA coefficient sliders to a simulated series and its theoretical ACF/PACF |
| `acf-pacf-id` | Scored drill: given the plots, name the order |
| `sarima-decoder` | Dials p,d,q and P,D,Q,m and sees which structure each term controls |
| `arima-vs-ets` | The same series fitted both ways, scoreboard side by side |

### Section 7. Dynamic regression and complex seasonality
| Widget | The reader manipulates |
|---|---|
| `arima-errors` | Regression residuals before and after ARIMA errors are modelled |
| `multi-seasonal` | Daily, weekly and yearly components toggled on hourly data |
| `harmonic-multi` | Fourier K per seasonal period, for two periods at once |
| `prophet-parts` | Trend, season and holiday components, and changepoint placement |
| `transfer-function` | A pulse in the input and the shape of the response it produces |

### Section 8. State space and the Kalman filter
| Widget | The reader manipulates |
|---|---|
| `kalman-filter` | Steps through the filter: prediction, observation, correction, one point at a time |
| `local-level` | The signal-to-noise variance ratio against how much the level chases the data |
| `structural-parts` | Level, slope and seasonal components of a structural model, separately |
| `tvp-coef` | A coefficient that changes over time, and the path the filter recovers |

### Section 9. Spectral and frequency-domain analysis
| Widget | The reader manipulates |
|---|---|
| `periodogram-lab` | Adds hidden cycles to a series and finds them as peaks in the periodogram |
| `spectral-smooth` | Smoothing span against the bias-variance trade in the density estimate |
| `filter-bank` | Low-pass, high-pass and band-pass filters applied to the same series |
| `wavelet-scalogram` | A time-frequency heatmap on a series whose frequency changes |

### Section 10. Volatility modelling
| Widget | The reader manipulates |
|---|---|
| `vol-clustering` | Returns against squared returns, and the ACF that reveals the clustering |
| `garch-sim` | Alpha and beta sliders to a volatility path, with persistence read out |
| `var-backtest` | Value at Risk exceedances counted against the nominal rate |

### Section 11. Multivariate time series
| Widget | The reader manipulates |
|---|---|
| `var-lag` | Lag order against information criteria and residual autocorrelation |
| `impulse-response` | A shock to one variable and the response paths of the others |
| `cointegration-lab` | Two series wandering together while their spread stays stationary |

### Section 12. Hierarchical and grouped forecasting
| Widget | The reader manipulates |
|---|---|
| `hierarchy-reconcile` | Bottom-up, top-down and MinT on a small tree where the totals disagree |
| `temporal-hierarchy` | The same series reconciled across monthly, quarterly and annual views |

### Section 13. Machine learning and deep forecasting
| Widget | The reader manipulates |
|---|---|
| `global-vs-local` | One model across many series against one model each, as series count grows |
| `ts-feature-lab` | Builds lag and rolling features with a leakage detector that fires |
| `boosted-trend-trap` | A boosted model meeting a trend it never saw in training |
| `deep-arch` | Block diagrams of DeepAR, N-BEATS and N-HiTS, expandable |
| `combo-weights` | Combination weights across three models against the combined error |

### Section 14. Intervention, causal impact and anomaly detection
| Widget | The reader manipulates |
|---|---|
| `intervention-shapes` | Step, pulse and ramp interventions and the response each implies |
| `causal-impact` | Actual against counterfactual, with the cumulative effect accumulating |
| `changepoint-detect` | Penalty slider against the number of changepoints found |
| `ts-anomaly-types` | Point, contextual and collective anomalies, and which detector catches which |

### Section 15. The expert edge
| Widget | The reader manipulates |
|---|---|
| `leakage-detector` | A backtest that looks excellent, then the leak is exposed and the score collapses |
| `croston-intermittent` | Intermittent demand with Croston, ADIDA and TSB side by side |
| `fva-ladder` | Forecast value added against the naive baseline and the process being replaced |
| `interval-coverage` | Repeats the experiment and counts how often the interval actually covers |
| `scaled-error-lab` | Scaled errors across many series of different magnitude, M-competition style |
| `judgment-adjust` | A human override applied to a forecast, and whether it helped |

### Section 16. Production forecasting
| Widget | The reader manipulates |
|---|---|
| `refresh-cadence` | Retraining frequency against accuracy and compute cost |
| `forecast-monitor` | A live forecast decaying while alert thresholds fire |
| `decision-quantile` | An asymmetric cost function choosing the quantile to act on |

### Reused unchanged (9)
`conformal-bands`, `quantile-lines`, `drift-monitor`, `regression-intervals`,
`gradient-boosting`, `bootstrap-sample`, `chart-plotter`, `learning-curve`,
`process-flow`.

---

## Part C. Build order

1. **Package reality check.** Probe `fable`, `tsibble`, `feasts`, `fabletools`,
   `prophet`, `rugarch`, `vars`, `dlm`, `bsts`, `CausalImpact`, `changepoint`,
   `modeltime` against the browser registry (`Scripts/webr-package-compat.json`).
   Where a package does not run in the browser, the widget reproduces the result
   from base R so the interactive spine stays live and the package block is static
   with real captured output. No lesson may depend on an unavailable package for
   its interactive spine.
2. **Widget wave A** (sections 1 to 6, 26 widgets), then lessons for sections 1 to 6.
3. **Widget wave B** (sections 7 to 11, 15 widgets), then lessons 7 to 11.
4. **Widget wave C** (sections 12 to 16, 17 widgets), then lessons 12 to 16.
5. Section assessments and the track landing page follow each wave.
