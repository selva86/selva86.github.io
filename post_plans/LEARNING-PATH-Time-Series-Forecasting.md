---
name: Time Series Forecasting Learning Path Plan
description: Comprehensive plan for a new top-level "Time Series Forecasting" learning path on r-statistics.co
type: learning-path-plan
---

# Time Series Forecasting with R — Learning Path Plan

## Why This Path Exists

R owns time series forecasting. Rob Hyndman's `forecast` package (now succeeded by `fable`) is the most-cited forecasting library in any language. The `tsibble`/`fable`/`feasts` ecosystem, the `modeltime` framework, and domain-specific packages like `rugarch` (financial volatility) and `prophet` (business forecasting) make R the default choice for anyone serious about forecasting.

The existing `/time-series/` path in the curriculum has 45 posts across 4 sub-paths — a solid start, but structured like a textbook (basics → ETS → ARIMA → advanced). The new path restructures around **what practitioners actually need**:

> "I have time series data. I need to forecast it. Walk me through the entire process — from understanding my data to deploying a model."

### Competitive Landscape

| Resource | Strength | Weakness |
|----------|----------|----------|
| Hyndman's FPP3 (otexts.com/fpp3) | The gold standard textbook; 13 chapters, free online | Not interactive, academic tone, `fable`-only (no `modeltime`, no ML) |
| Business Science (modeltime) | Modern ML-integrated forecasting in R | Paid course ($500+), `modeltime`-only, skips classical methods |
| DataCamp "Forecasting in R" | Interactive, good pacing | Shallow (4 hours total), `forecast`-only (legacy), no real projects |
| Penn State STAT 510 | Deep theory (ACF, PACF, differencing) | No R code, no modern tools, no ML integration |
| Towards Data Science / Medium | Varied quality, some gems | Python-focused, fragmented, paywalled, no progression |

**Our edge:** The only free resource that covers *both* the classical Hyndman pipeline (ETS, ARIMA, decomposition) *and* the modern ML pipeline (modeltime, tidymodels), with interactive R code, real-world datasets, and a progression from "what is a time series?" to "forecast reconciliation for hierarchical data."

---

## Path Structure

### Organizing Principle: The Forecasting Workflow

Instead of organizing by model type (ETS chapter, ARIMA chapter), we organize by the *workflow stages* a forecaster follows. This means readers can enter at the stage they need and always know what comes next.

```
Understand → Visualize → Decompose → Model → Evaluate → Combine → Deploy
```

---

## Sub-Path 1: Time Series Foundations

*Everything you need before fitting a single model.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | What Is a Time Series? Trend, Seasonality, and Noise Explained with R | What patterns should I look for? |
| 2 | C | Time Series Objects in R: ts, xts, tsibble — Which Format Do You Need? | How do I store time series data properly? |
| 3 | C | Time Series Visualization in R: Time Plots, Seasonal Plots, and Lag Plots | How do I see what's going on in my data? |
| 4 | C | Autocorrelation in R: ACF and PACF Plots Explained with Intuition | What do these bar charts actually tell me? |
| 5 | C | Stationarity in R: ADF Test, KPSS Test, and Why It Matters for Forecasting | Is my data stationary — and why do I care? |
| 6 | C | Time Series Decomposition in R: Additive, Multiplicative, and STL | How do I separate trend, season, and remainder? |
| 7 | C | Time Series Transformations: Log, Box-Cox, Differencing, and When Each Applies | How do I stabilize variance and remove trend? |
| 8 | FR | Calendar and Holiday Effects in R: Handling Trading Days and Easter | |
| 9 | FR | Detecting Structural Breaks in R: strucchange Package | |
| 10 | FR | Time Series Feature Extraction with feasts and tsfeatures | |
| 11 | EX | Time Series Foundations Exercises: 10 Problems — From Plots to Stationarity Tests | |

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
| 8 | C | Regression with ARIMA Errors in R: Dynamic Regression for External Predictors | My forecast should include external variables (weather, price) |
| 9 | FR | Theta Method in R: The Surprisingly Simple Forecaster That Wins Competitions | |
| 10 | FR | TBATS and BATS in R: Handle Multiple Seasonal Periods | |
| 11 | FR | Croston's Method in R: Forecast Intermittent Demand | |
| 12 | EX | Classical Forecasting Exercises: 10 Problems — From SES to SARIMA | |
| 13 | EX | ARIMA Modeling Exercises: 8 Problems — Identify, Fit, Diagnose, Forecast | |

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
| 6 | FR | Forecast Bias Detection: Are Your Forecasts Systematically Too High or Low? | |
| 7 | FR | Backtesting Strategies for Financial Time Series in R | |
| 8 | EX | Forecast Evaluation Exercises: 8 Problems — Metrics, CV, and Residual Checks | |

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
| 7 | FR | LSTM and Deep Learning for Time Series in R: keras + modeltime.resample | |
| 8 | FR | LightGBM for Time Series in R: Fast Gradient Boosting with lightgbm | |
| 9 | FR | Conformal Prediction Intervals for ML Forecasts in R | |
| 10 | EX | ML Forecasting Exercises: 8 Problems — Feature Engineering to Model Stacking | |

---

## Sub-Path 5: Multivariate and Advanced Methods

*VAR, state space, hierarchical — the tools that separate professionals from beginners.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Vector Autoregression (VAR) in R: Forecast Multiple Related Time Series Together | Multiple series that influence each other |
| 2 | C | State Space Models in R: The Unified Framework Behind ETS, ARIMA, and More | What's the theoretical framework tying everything together? |
| 3 | C | Dynamic Harmonic Regression in R: Capture Complex Seasonality with Fourier Terms | My data has seasonality that ETS/ARIMA can't handle |
| 4 | C | Hierarchical and Grouped Time Series in R: Reconcile Forecasts Across Levels | National → regional → store-level forecasts that add up |
| 5 | C | Bayesian Structural Time Series in R: bsts Package for Causal Impact | Did my marketing campaign actually change sales? |
| 6 | FR | Granger Causality in R: Does X Help Predict Y? | |
| 7 | FR | Cointegration and VECM in R: Long-Run Relationships Between Non-Stationary Series | |
| 8 | FR | GARCH Models in R: Forecast Volatility for Financial Data with rugarch | |
| 9 | FR | Functional Time Series in R: When Each Observation Is a Curve | |
| 10 | EX | Advanced Forecasting Exercises: 8 Problems — VAR, Hierarchical, and Bayesian | |

---

## Sub-Path 6: Real-World Forecasting Projects

*End-to-end walkthroughs on real data. The "wow, I can actually do this" section.*

| # | Type | Title | Core Question |
|---|------|-------|---------------|
| 1 | C | Retail Demand Forecasting in R: Complete Pipeline from Raw Sales to Weekly Predictions | How do retailers forecast what to stock? |
| 2 | C | Energy Load Forecasting in R: Predict Hourly Electricity Demand | Sub-daily data with temperature effects |
| 3 | C | Financial Returns Forecasting in R: Stock Returns, Volatility, and Risk | How do quants forecast in R? |
| 4 | C | Epidemiological Forecasting in R: Disease Incidence Curves and SIR Models | How do health agencies forecast outbreaks? |
| 5 | FR | Anomaly Detection in Time Series with R: tsoutliers and anomalize Packages | |
| 6 | FR | Forecasting with Missing Data in R: Imputation Strategies for Time Series | |
| 7 | FR | Forecasting at Scale: Hundreds of Series with fable + future | |

---

## Sub-Path 7: The fable Ecosystem (Modern R Forecasting)

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

## Totals

| Sub-Path | C | FR | EX | Total |
|----------|---|----|----|-------|
| 1. Foundations | 7 | 3 | 1 | 11 |
| 2. Classical Models | 8 | 3 | 2 | 13 |
| 3. Evaluation & Selection | 5 | 2 | 1 | 8 |
| 4. ML for Forecasting | 6 | 3 | 1 | 10 |
| 5. Multivariate & Advanced | 5 | 4 | 1 | 10 |
| 6. Real-World Projects | 4 | 3 | 0 | 7 |
| 7. fable Ecosystem | 4 | 1 | 1 | 6 |
| **TOTAL** | **39** | **19** | **7** | **65** |

---

## Key Differentiators

1. **Workflow-organized, not model-organized** — readers follow the forecasting process, not an alphabetical list of algorithms
2. **Both classical and ML** — the only free resource covering fable (Hyndman) AND modeltime (Business Science) in one coherent path
3. **Evaluation sub-path** — most tutorials show you how to fit; we dedicate an entire section to "is your model any good?"
4. **Real-world projects** — retail, energy, finance, epidemiology — four complete walkthroughs on real data
5. **fable ecosystem** — dedicated section teaching the modern tidy forecasting stack that's replacing the legacy `forecast` package
6. **Interactive code** — run every model in the browser, tweak parameters, see results instantly
7. **Hierarchical forecasting** — a topic no free tutorial covers properly but every enterprise needs
8. **Decision framework** — "ETS vs ARIMA vs Prophet vs XGBoost" isn't a religious war, it's a structured comparison we make data-driven

## Relationship to Existing Time Series Path

The existing `/time-series/` path has 45 posts (12 basics + 6 ETS + 11 ARIMA + 16 advanced). **Time Series Forecasting** is a restructured, expanded, and modernized replacement:

- Old path: organized by model (ETS chapter, ARIMA chapter)
- New path: organized by workflow stage (understand → model → evaluate → deploy)

Many existing posts can be remapped into the new structure. New content fills critical gaps: ML methods, forecast evaluation, real-world projects, and the fable ecosystem.

---

## Combined Impact: Both Paths Together

| Metric | Applied Statistics | Time Series Forecasting | Combined |
|--------|-------------------|------------------------|----------|
| Core [C] posts | 52 | 39 | 91 |
| Further Reading [FR] | 24 | 19 | 43 |
| Exercise [EX] sets | 10 | 7 | 17 |
| **Total posts** | **86** | **65** | **151** |
| Sub-paths | 8 | 7 | 15 |

151 new posts across 15 sub-paths. Together with the existing ~1,100 posts in the curriculum, this would make r-statistics.co the most comprehensive free R learning platform on the internet.
