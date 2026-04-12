---
name: Time Series Forecasting Learning Path Plan (v2 — PhD-Level)
description: World-class plan for a top-level "Time Series Forecasting with R" learning path — practitioner-through-PhD depth
type: learning-path-plan
version: 2
---

# Time Series Forecasting with R — Learning Path Plan (v2)

## Why This Path Exists

R owns time series forecasting. Rob Hyndman's `forecast` package (now succeeded by `fable`) is the most-cited forecasting library in any language. The `tsibble`/`fable`/`feasts` ecosystem, the `modeltime` framework, and domain-specific packages like `rugarch` (financial volatility) and `prophet` (business forecasting) make R the default choice for anyone serious about forecasting.

The existing `/time-series/` path in the curriculum has 45 posts across 4 sub-paths — a solid start, but structured like a textbook (basics → ETS → ARIMA → advanced). The new path restructures around **what practitioners and researchers actually need**, from data cleaning through production deployment, covering both the time domain and the frequency domain.

### What Makes This PhD-Level

Most forecasting tutorials stop at ARIMA and Prophet. This path goes all the way to:
- **Spectral analysis and the frequency domain** — periodogram, spectral density, cross-spectrum, coherence (literally half of time series theory, absent from every tutorial site)
- **State space models in depth** — Kalman filter, particle filters, dynamic linear models
- **Nonlinear time series** — regime switching (SETAR, STAR, Markov switching), threshold models
- **Long memory processes** — ARFIMA, Hurst exponent, fractional differencing
- **Multivariate GARCH** — DCC, BEKK, CCC for financial volatility
- **Spatio-temporal forecasting** — combining geography and time
- **Time series mining** — classification, clustering, anomaly detection, motif discovery
- **Forecasting in production** — APIs, automation, monitoring, drift detection

### Competitive Landscape

| Resource | Strength | Weakness |
|----------|----------|----------|
| Hyndman's FPP3 (otexts.com/fpp3) | Gold standard textbook; 13 chapters, free | Not interactive, academic tone, `fable`-only, no ML, no spectral analysis, no nonlinear models |
| Business Science (modeltime) | Modern ML-integrated forecasting | Paid ($500+), modeltime-only, skips classical and theoretical methods |
| DataCamp "Forecasting in R" | Interactive, good pacing | Shallow (4 hours total), `forecast`-only (legacy), no real projects |
| Penn State STAT 510 | Deep theory (ACF, PACF, differencing, spectral) | No R code, no modern tools, no ML integration, no interactive code |
| Towards Data Science / Medium | Varied quality, some gems | Python-focused, fragmented, paywalled, no progression |
| Shumway & Stoffer (ASTSA) | Deep theory (spectral, state space) | Textbook-only, R code is dated, not web-optimized |
| Tsay (Financial Time Series) | Deep finance-specific coverage | Finance-only, not free, no interactive code |

**Our edge:** The only free resource that covers:
1. *Both* the classical Hyndman pipeline (ETS, ARIMA) *and* the modern ML pipeline (modeltime, tidymodels)
2. *Both* the time domain *and* the frequency domain (spectral analysis)
3. *Both* linear *and* nonlinear models (regime switching, threshold)
4. The full arc from "what is a time series?" to "deploy your forecast as a REST API"
5. All with interactive R code, real datasets, and a clear progression

---

## Path Structure

### Organizing Principle: The Forecasting Workflow + Theoretical Depth

**Three tiers:**
- **Tier 1 (Sub-Paths 1-7):** Essential forecasting — every working forecaster needs this
- **Tier 2 (Sub-Paths 8-11):** Advanced methods — researchers, quants, PhD students
- **Tier 3 (Sub-Paths 12-14):** Specialized and production topics

---

## TIER 1: ESSENTIAL FORECASTING

---

## Sub-Path 1: Time Series Foundations

*Everything you need before fitting a single model.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | What Is a Time Series? Trend, Seasonality, and Noise Explained with R | What patterns should I look for? |
| 2 | C | Time Series Objects in R: ts, xts, tsibble — Which Format Do You Need? | How do I store time series data properly? |
| 3 | C | Time Series Data Cleaning in R: Missing Timestamps, Irregular Intervals, and Duplicates | My real-world data is messy — how do I fix it? |
| 4 | C | Resampling and Aggregating Time Series in R: Convert Daily to Weekly/Monthly and Back | How do I change the frequency of my data? |
| 5 | C | Time Series Visualization in R: Time Plots, Seasonal Plots, and Lag Plots | How do I see what's going on in my data? |
| 6 | C | Autocorrelation in R: ACF and PACF Plots Explained with Intuition | What do these bar charts actually tell me? |
| 7 | C | Stationarity in R: ADF Test, KPSS Test, and Why It Matters for Forecasting | Is my data stationary — and why do I care? |
| 8 | C | Time Series Decomposition in R: Additive, Multiplicative, and STL | How do I separate trend, season, and remainder? |
| 9 | C | Time Series Transformations: Log, Box-Cox, Differencing, and When Each Applies | How do I stabilize variance and remove trend? |
| 10 | FR | Calendar and Holiday Effects in R: Handling Trading Days and Easter | |
| 11 | FR | Timezone Handling for Time Series in R: lubridate, clock, and DST Pitfalls | |
| 12 | FR | Time Series Feature Extraction with feasts and tsfeatures | |
| 13 | EX | Time Series Foundations Exercises: 10 Problems — From Plots to Stationarity Tests | |

---

## Sub-Path 2: Classical Forecasting Models

*The Hyndman canon: exponential smoothing, ARIMA, and their variants.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Simple Forecasting Methods in R: Mean, Naive, Seasonal Naive, and Drift | What are the simplest benchmarks every model must beat? |
| 2 | C | Exponential Smoothing in R: SES, Holt's, and Holt-Winters Explained Step-by-Step | How do I weight recent observations more than old ones? |
| 3 | C | ETS Models in R: Error-Trend-Seasonality Framework with fable | How does R automatically pick the best smoothing model? |
| 4 | C | ARIMA from Scratch in R: AR, MA, and Differencing Built Up Piece by Piece | What is ARIMA actually doing under the hood? |
| 5 | C | Seasonal ARIMA (SARIMA) in R: Model Data with Both Trend and Seasonality | My data has yearly patterns on top of a trend |
| 6 | C | auto.arima() and ARIMA() in R: Let the Algorithm Choose the Best Order | How do I avoid manually picking p, d, q? |
| 7 | C | ETS vs ARIMA: When to Use Each and How to Compare Them in R | Two great models — which one for my data? |
| 8 | C | Regression with ARIMA Errors in R: Dynamic Regression for External Predictors | My forecast should include external variables |
| 9 | C | Intermittent Demand Forecasting in R: Croston, TSB, and INARMA for Sparse Series | My series has lots of zeros — standard methods fail |
| 10 | FR | Theta Method in R: The Surprisingly Simple Forecaster That Wins Competitions | |
| 11 | FR | TBATS and BATS in R: Handle Multiple Seasonal Periods | |
| 12 | FR | Zero-Inflated Time Series in R: Count Models with tscount and tsglm | |
| 13 | EX | Classical Forecasting Exercises: 10 Problems — From SES to SARIMA | |
| 14 | EX | ARIMA Modeling Exercises: 8 Problems — Identify, Fit, Diagnose, Forecast | |

---

## Sub-Path 3: Forecast Evaluation and Selection

*The make-or-break step most tutorials skip.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Train-Test Split for Time Series: Why Random Splits Destroy Your Forecast | How do I split time series data correctly? |
| 2 | C | Forecast Accuracy Metrics in R: MAE, RMSE, MAPE, MASE Explained and Compared | Which error metric should I report? |
| 3 | C | Time Series Cross-Validation in R: Rolling Origin and Expanding Window | How do I get reliable accuracy estimates? |
| 4 | C | Prediction Intervals in R: Quantify Forecast Uncertainty | How sure am I about this forecast? |
| 5 | C | Residual Diagnostics for Forecasts: Ljung-Box Test and Residual Plots | Is my model missing any pattern? |
| 6 | C | Forecast Combination in R: Simple Averaging, Weighted Ensembles, and Stacking | Why does combining models almost always win? |
| 7 | FR | Forecast Bias Detection: Are Your Forecasts Systematically Too High or Low? | |
| 8 | FR | Backtesting Strategies for Financial Time Series in R | |
| 9 | FR | Conformal Prediction Intervals for Forecasts: Distribution-Free Uncertainty | |
| 10 | EX | Forecast Evaluation Exercises: 8 Problems — Metrics, CV, and Residual Checks | |

---

## Sub-Path 4: Machine Learning for Forecasting

*Where modeltime, tidymodels, and tree-based models enter.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Feature Engineering for Time Series in R: Lags, Rolling Stats, and Calendar Features | How do I turn a time series into a tabular ML problem? |
| 2 | C | Random Forest for Time Series in R: ranger + modeltime Pipeline | Can tree models forecast? |
| 3 | C | XGBoost for Time Series in R: Gradient Boosting with modeltime | The competition-winning approach |
| 4 | C | Prophet in R: Facebook's Additive Model for Business Forecasting | Easy, interpretable, handles holidays and changepoints |
| 5 | C | Neural Network Forecasting in R: NNETAR and Feed-Forward Nets with fable | When you have lots of data and complex patterns |
| 6 | C | Model Stacking and Ensembles for Forecasting in R: Combine Models for Better Accuracy | One model isn't enough — how do I combine them? |
| 7 | FR | LSTM and Deep Learning for Time Series in R: keras + modeltime | |
| 8 | FR | LightGBM for Time Series in R: Fast Gradient Boosting with lightgbm | |
| 9 | EX | ML Forecasting Exercises: 8 Problems — Feature Engineering to Model Stacking | |

---

## Sub-Path 5: Multivariate and Hierarchical Forecasting

*Multiple series, external variables, and reconciliation.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Vector Autoregression (VAR) in R: Forecast Multiple Related Series Together | Multiple series that influence each other |
| 2 | C | Dynamic Harmonic Regression in R: Capture Complex Seasonality with Fourier Terms | My data has seasonality that ETS/ARIMA can't handle |
| 3 | C | Hierarchical and Grouped Time Series in R: Reconcile Forecasts Across Levels | National → regional → store-level forecasts that add up |
| 4 | C | Granger Causality in R: Does X Help Predict Y? | Is one series actually useful for predicting another? |
| 5 | FR | Cointegration and VECM in R: Long-Run Relationships Between Non-Stationary Series | |
| 6 | FR | Multiple Seasonality in R: MSTL, TBATS, and Dynamic Harmonic Regression for Sub-Daily Data | |
| 7 | FR | Hourly and Sub-Daily Forecasting in R: Handle 3+ Seasonal Periods | |
| 8 | EX | Multivariate Forecasting Exercises: 8 Problems — VAR, Hierarchical, and Granger | |

---

## Sub-Path 6: The fable Ecosystem (Modern R Forecasting)

*A dedicated sub-path for the tsibble/fable/feasts stack — R's future of forecasting.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | tsibble in R: The Tidy Time Series Data Structure You Need to Learn | How do I store time series the modern way? |
| 2 | C | feasts in R: Feature Extraction and Statistics for Time Series | How do I summarize time series properties automatically? |
| 3 | C | fable in R: Tidy Forecasting with ETS, ARIMA, and More | The modern replacement for forecast::forecast() |
| 4 | C | fable.prophet and fable Extensions: Plug Any Model into the Tidy Framework | How do I use Prophet/NNETAR inside fable's workflow? |
| 5 | FR | Migrating from forecast to fable: A Practical Translation Guide | |
| 6 | EX | fable Ecosystem Exercises: 8 Problems — tsibble to Forecast Reconciliation | |

---

## Sub-Path 7: Real-World Forecasting Projects

*End-to-end walkthroughs on real data.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Retail Demand Forecasting in R: Complete Pipeline from Raw Sales to Weekly Predictions | How do retailers forecast what to stock? |
| 2 | C | Energy Load Forecasting in R: Predict Hourly Electricity Demand | Sub-daily data with temperature effects |
| 3 | C | Financial Returns Forecasting in R: Stock Returns, Volatility, and Risk | How do quants forecast in R? |
| 4 | C | Epidemiological Forecasting in R: Disease Incidence Curves and SIR Models | How do health agencies forecast outbreaks? |
| 5 | FR | Forecasting with Missing Data in R: Imputation Strategies for Time Series | |
| 6 | FR | Forecasting at Scale: Hundreds of Series with fable + future | |
| 7 | FR | Anomaly Detection in Time Series with R: tsoutliers and anomalize Packages | |

---

## TIER 2: ADVANCED METHODS

---

## Sub-Path 8: Spectral Analysis and the Frequency Domain

*Literally half of time series theory — and completely absent from every tutorial site. This is what separates a PhD-level resource from a practitioner tutorial.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Spectral Analysis in R: From Time Domain to Frequency Domain — Why It Matters | What frequencies drive my time series? |
| 2 | C | The Periodogram in R: Estimate Spectral Density and Find Hidden Cycles | How do I detect cycles that aren't obvious in a time plot? |
| 3 | C | Smoothed Spectral Estimation in R: Daniell, Bartlett, and Welch Methods | The raw periodogram is noisy — how do I smooth it? |
| 4 | C | Cross-Spectrum and Coherence in R: Measure Frequency-Domain Relationships Between Series | How are two series related at different frequencies? |
| 5 | C | Filtering Time Series in R: Low-Pass, High-Pass, and Band-Pass Filters | How do I extract specific frequency components? |
| 6 | FR | Wavelet Analysis in R: Time-Frequency Decomposition with WaveletComp | |
| 7 | FR | Spectral Methods for Irregularly Spaced Time Series: Lomb-Scargle Periodogram in R | |
| 8 | EX | Spectral Analysis Exercises: 6 Problems — Periodogram to Cross-Spectrum | |

**Why this is critical:** The frequency domain is not an obscure corner of time series theory — it's a co-equal representation alongside the time domain. Spectral analysis is essential in signal processing, climate science, neuroscience, economics (business cycles), and engineering. Shumway & Stoffer devote 3 full chapters to it. Penn State STAT 510 covers it. FPP3 doesn't — and neither does any free tutorial with R code. This alone could attract a completely new audience to the site.

---

## Sub-Path 9: State Space Models and Kalman Filtering

*The unified framework behind ETS, ARIMA, and much more.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | State Space Models in R: The Unified Framework Behind ETS, ARIMA, and Structural Models | What's the theoretical framework that ties everything together? |
| 2 | C | The Kalman Filter in R: Recursive State Estimation Explained Step-by-Step | How does the Kalman filter work, and why should I care? |
| 3 | C | Dynamic Linear Models in R: dlm and KFAS Packages for Flexible Time-Varying Models | How do I build models where parameters change over time? |
| 4 | C | Bayesian Structural Time Series in R: bsts for Causal Impact and Forecasting | The Google CausalImpact engine — how does it work? |
| 5 | FR | Particle Filters in R: Sequential Monte Carlo for Non-Linear State Space Models | |
| 6 | FR | Unobserved Components Models: Trend + Cycle + Seasonal as Separate State Variables | |
| 7 | FR | Google's CausalImpact Package: Measure Marketing ROI with Bayesian Time Series | |
| 8 | EX | State Space Exercises: 6 Problems — Kalman Filter to Dynamic Linear Models | |

---

## Sub-Path 10: Nonlinear Time Series

*Regime switching, threshold models, and beyond. Where tsDyn and MSwM packages live.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Nonlinear Time Series in R: Why Linear Models Fail and What Comes Next | When should I suspect my time series is nonlinear? |
| 2 | C | Threshold Autoregression in R: SETAR and LSTAR Models with tsDyn | How do I model a series that behaves differently in different regimes? |
| 3 | C | Markov Switching Models in R: Regime Changes Driven by Hidden States with MSwM | What if the regime transitions are probabilistic, not deterministic? |
| 4 | C | Testing for Nonlinearity in Time Series: BDS Test, Tsay Test, and Threshold Tests in R | How do I know if a nonlinear model is actually needed? |
| 5 | FR | Smooth Transition Models in R: STAR, LSTAR, and ESTAR for Gradual Regime Changes | |
| 6 | FR | Neural Network Autoregression Revisited: NNAR as a Nonlinear Alternative | |
| 7 | EX | Nonlinear Time Series Exercises: 6 Problems — Threshold to Markov Switching | |

---

## Sub-Path 11: Financial Time Series and Volatility

*GARCH, realized volatility, risk measures. R's rugarch, rmgarch, and highfrequency packages.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Financial Time Series Properties: Volatility Clustering, Fat Tails, and Stylized Facts | Why do financial returns behave so differently from other data? |
| 2 | C | GARCH Models in R: Forecast Volatility with rugarch | How do I model and forecast time-varying volatility? |
| 3 | C | GARCH Variants in R: EGARCH, GJR-GARCH, and Asymmetric Volatility Models | Negative returns increase volatility more than positive ones |
| 4 | C | Multivariate GARCH in R: DCC and CCC Models with rmgarch | How do I model volatility across multiple assets simultaneously? |
| 5 | C | Value at Risk (VaR) and Expected Shortfall in R: Parametric, Historical, and Monte Carlo | How much could I lose in a bad day? |
| 6 | FR | ARFIMA in R: Long Memory Models for Slowly Decaying Autocorrelation | |
| 7 | FR | Realized Volatility in R: High-Frequency Data Analysis with highfrequency Package | |
| 8 | FR | Copulas for Financial Time Series in R: Model Dependence Beyond Correlation | |
| 9 | EX | Financial Time Series Exercises: 8 Problems — GARCH to VaR | |

**Why this is critical:** Financial time series is a massive domain. The current plan had one FR post on GARCH. This sub-path covers the full toolkit that quants, risk managers, and financial researchers need: univariate GARCH, multivariate GARCH (DCC/CCC), risk measures (VaR/ES), long memory (ARFIMA), and high-frequency data. Tsay's textbook covers this in 400 pages — we distill it into 9 actionable posts with interactive code.

---

## TIER 3: SPECIALIZED AND PRODUCTION

---

## Sub-Path 12: Time Series Mining — Classification, Clustering, and Anomaly Detection

*Not all time series problems are forecasting.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Anomaly Detection in Time Series with R: Statistical, Distance-Based, and ML Approaches | How do I find unusual patterns automatically? |
| 2 | C | Changepoint Detection in R: changepoint, bcp, and strucchange Packages | When did the behavior of my series change? |
| 3 | C | Time Series Clustering in R: DTW, Shape-Based, and Feature-Based Approaches | Which of my 500 series behave similarly? |
| 4 | C | Time Series Classification in R: k-NN with DTW, Shapelet, and Feature-Based Methods | Is this pattern normal or anomalous? |
| 5 | FR | Motif Discovery in Time Series: Find Recurring Patterns with tsmp | |
| 6 | FR | Interrupted Time Series Analysis in R: Pre-Post Intervention Design | |
| 7 | EX | Time Series Mining Exercises: 6 Problems — Anomalies, Changepoints, and Clustering | |

---

## Sub-Path 13: Spatio-Temporal Forecasting

*When your time series has a geographic dimension.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Spatio-Temporal Data in R: stars, spacetime, and sf for Data with Geography + Time | How do I represent data that varies across both space and time? |
| 2 | C | Spatio-Temporal Forecasting in R: Kriging Over Time and Space with gstat | How do I forecast at locations I haven't observed? |
| 3 | C | Spatial Autocorrelation Over Time: Moran's I Trajectories with sfdep | Is the spatial structure of my data changing over time? |
| 4 | FR | Spatio-Temporal INLA Models in R: Fast Bayesian Inference for Large Datasets | |
| 5 | FR | Forecasting Across Locations in R: Hierarchical Spatial Models with fable | |
| 6 | EX | Spatio-Temporal Exercises: 4 Problems — Kriging to Spatial Hierarchies | |

---

## Sub-Path 14: Forecasting in Production

*Getting a forecast into production — the "last mile" most tutorials ignore.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Automating Forecasts in R: Schedule, Retrain, and Monitor with cronR and targets | How do I run my forecast pipeline on a schedule? |
| 2 | C | Forecast Monitoring and Drift Detection in R: Know When Your Model Goes Stale | How do I know when to retrain? |
| 3 | FR | Building a Forecast API with R and plumber: Serve Predictions via REST | |
| 4 | FR | Forecast Dashboards with R Shiny: Interactive Visualization for Stakeholders | |

---

## Totals

| Sub-Path | C | FR | EX | Total |
|----------|---|----|----|-------|
| **TIER 1: ESSENTIAL** | | | | |
| 1. Foundations | 9 | 3 | 1 | 13 |
| 2. Classical Models | 9 | 3 | 2 | 14 |
| 3. Evaluation & Selection | 6 | 3 | 1 | 10 |
| 4. ML for Forecasting | 6 | 2 | 1 | 9 |
| 5. Multivariate & Hierarchical | 4 | 3 | 1 | 8 |
| 6. fable Ecosystem | 4 | 1 | 1 | 6 |
| 7. Real-World Projects | 4 | 3 | 0 | 7 |
| **TIER 2: ADVANCED** | | | | |
| 8. Spectral Analysis | 5 | 2 | 1 | 8 |
| 9. State Space & Kalman | 4 | 3 | 1 | 8 |
| 10. Nonlinear Time Series | 4 | 2 | 1 | 7 |
| 11. Financial TS & Volatility | 5 | 3 | 1 | 9 |
| **TIER 3: SPECIALIZED** | | | | |
| 12. TS Mining | 4 | 2 | 1 | 7 |
| 13. Spatio-Temporal | 3 | 2 | 1 | 6 |
| 14. Forecasting in Production | 2 | 2 | 0 | 4 |
| **TOTAL** | **69** | **34** | **13** | **116** |

---

## Key Differentiators — What Makes This PhD-Level

1. **Spectral analysis sub-path** — the frequency domain is literally half of time series theory, and NO free tutorial with R code covers it. This alone attracts signal processing, climate science, neuroscience, and economics researchers.
2. **State space depth** — Kalman filter, particle filters, DLMs, unobserved components. Not just "state space models exist" but actually building them.
3. **Nonlinear time series** — regime switching (SETAR, STAR, Markov switching) with tsDyn and MSwM. Absent from every tutorial site.
4. **Financial time series as a full sub-path** — univariate GARCH, multivariate GARCH (DCC/CCC), VaR/ES, ARFIMA, high-frequency data. The full quant toolkit.
5. **Spatio-temporal sub-path** — forecasting with a geographic dimension. R has world-class tools (stars, spacetime, gstat) and no tutorial covers this.
6. **Both time domain AND frequency domain** — the only resource that treats both as co-equal pillars.
7. **Both classical AND ML** — fable (Hyndman) and modeltime (Business Science) in one coherent path.
8. **Data preparation** — the first thing every practitioner actually needs, and every tutorial skips.
9. **Forecast combination** — dedicated coverage of the strategy that "almost always wins."
10. **Production deployment** — APIs, automation, monitoring. Bridges analysis to production.
11. **Three-tier architecture** — beginners start at Tier 1, researchers go to Tier 2, quants and PhD students go to specialized topics.
12. **Interactive code** — run every model in the browser.

## Relationship to Existing Time Series Path

The existing `/time-series/` path has 45 posts (12 basics + 6 ETS + 11 ARIMA + 16 advanced). **Time Series Forecasting** is a restructured, expanded, and massively deepened replacement:

- Old path: organized by model (ETS chapter, ARIMA chapter)
- New path: organized by workflow stage (understand → model → evaluate → deploy) + theoretical depth (spectral, state space, nonlinear)

Many existing posts can be remapped into the new structure. New content fills critical gaps: spectral analysis, nonlinear models, state space depth, financial TS, spatio-temporal, ML methods, evaluation, real-world projects, and the fable ecosystem.

---

## Combined Impact: Both Paths Together

| Metric | Applied Statistics | Time Series Forecasting | Combined |
|--------|-------------------|------------------------|----------|
| Core [C] posts | 108 | 69 | **177** |
| Further Reading [FR] | 60 | 34 | **94** |
| Exercise [EX] sets | 19 | 13 | **32** |
| **Total posts** | **187** | **116** | **303** |
| Sub-paths | 17 | 14 | **31** |

**303 new posts across 31 sub-paths.** Together with the existing ~1,100 posts in the curriculum, this would make r-statistics.co the most comprehensive free R learning platform on the internet — and the only one that covers the full arc from beginner to PhD-level, from "which test do I run?" to spectral analysis and causal inference, all with interactive R code in the browser.
