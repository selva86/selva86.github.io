# r-statistics.co Certification Curriculum (2026 rework)

> Generated from `_mocks/_roadmap-data-v2.js`, the source of truth rendered on the roadmap and role pages. Re-run the generator after editing that file.

**Access model:** Foundations and Data Analyst are free in full. Each specialization track has **Section 1 free**; Sections 2 and up are the Program (Pro).

**6 levels, 549 lessons, 28 portfolio projects.**

| # | Level | Sections | Lessons | Certificate |
|---|---|---|---|---|
| 1 | New to R | 8 | 54 | R Fundamentals |
| 2 | Data Analyst | 9 | 58 | Tidyverse Practitioner |
| 3 | Data Scientist | 16 | 115 | Machine Learning with R |
| 4 | Time Series | 16 | 109 | Time Series Forecasting |
| 5 | Researcher | 16 | 120 | Applied Statistics with R |
| 6 | R Developer | 15 | 93 | Advanced R |

---

## 1. New to R: R programming foundations

*Command of base R: data types, vectors and data frames, control flow, and writing your own functions with correct scope.*

Certificate: **R Fundamentals**  |  8 sections  |  54 lessons

### 1. Syntax, types and vectors  [Free]
Read and write idiomatic base R and reason about how it stores values.

- R Syntax 101
- R Data Types
- R Vectors
- Operators, recycling and coercion rules
- NA, NULL, NaN and Inf
- Getting Help in R

### 2. Lists, data frames and tibbles  [Free]
Hold and inspect any rectangular or nested data.

- R Lists
- R Data Frames
- Tibbles and modern data frames
- Attributes, names and structure (str)
- Matrices and arrays
- Coercion and type conversion in practice

### 3. Subsetting, control flow and functions  [Free]
Move from snippets to programs you can reuse.

- R Subsetting
- Replacement and assignment functions
- R Control Flow
- Writing R Functions
- Arguments, defaults and the dots (...)
- The pipe (|> and %>%) and the tidyverse style guide

### 4. Importing and exporting real data  [Free]
Load any common format without a fight.

- Read CSV and delimited files with readr
- Read Excel workbooks with readxl
- Import SPSS, Stata and SAS with haven
- Pull JSON from APIs with jsonlite
- Scrape and parse HTML with rvest
- Query databases with DBI and dbplyr
- Fast columnar data with arrow and parquet
- Encodings, locales and very large files

### 5. Strings, dates and regular expressions  [Free]
Clean messy real-world text and timestamps.

- String manipulation with stringr
- Regular expressions from the ground up
- Find, extract and replace with regex
- Dates and times with lubridate
- Working across time zones
- Ordered categories with forcats

### 6. Iteration: the apply family and purrr  [Free]
Replace fragile loops with vectorized, functional iteration.

- Why vectorization beats loops
- apply, lapply and sapply
- Type-safe iteration with vapply
- The map family in purrr
- Iterate over two or more inputs (map2, pmap)
- Side effects with walk
- Resilient iteration with safely and possibly
- Nested data and list-columns

### 7. Defensive code and debugging  [Free]
Write code that fails loudly and is quick to fix.

- Signal problems with stop, warning and message
- Recover with tryCatch
- Validate inputs with stopifnot
- Write error messages people understand
- Step-through debugging with browser and traceback
- Debugging in RStudio and Positron

### 8. Reproducible workflow and the 2026 toolchain  [Free]
Set up a project you can rerun in a year, with modern tools.

- Organize work with RStudio Projects and here
- Pin packages with renv
- Track changes with git
- Positron: the next-generation R IDE
- Modern web APIs with httr2
- In-process big data with duckdb and duckplyr
- Columnar data at scale with arrow
- Talk to an LLM from R with ellmer

---

## 2. Data Analyst: Data analysis with the tidyverse

*Take a dataset from raw file to a clear, defensible analysis: reshape and join it, then communicate it with ggplot2 and a disciplined EDA.*

Certificate: **Tidyverse Practitioner**  |  9 sections  |  58 lessons

### 1. Wrangle and tidy with dplyr  [Free]
Take a raw file to a clean, analysis-ready table.

- Importing Data
- Tidy data principles
- dplyr filter & select
- dplyr mutate and transmute
- dplyr group_by & summarise
- arrange, distinct and count
- Recode and derive with case_when
- Missing Value Treatment

### 2. Join and reshape any dataset  [Free]
Combine and reshape data of any shape.

- R Joins
- Every join type, visualized
- Non-equi and rolling joins with join_by
- pivot_longer & pivot_wider
- Nest, unnest and rectangling
- separate, unite and clean columns
- Fuzzy matching and joins

### 3. Exploratory data analysis  [Free]
Profile any dataset and surface what matters.

- EDA (7-Step Framework)
- Univariate EDA
- Bivariate EDA
- Correlation Analysis
- Outlier Detection
- Automated EDA with skimr and DataExplorer

### 4. Visualization with ggplot2  [Free]
Build any chart in the grammar of graphics.

- Grammar of Graphics
- ggplot2 Getting Started
- Scatter Plots
- Line Charts
- Bar Charts
- Distribution Charts
- Top 50 ggplot2 Visualizations
- Publication-Ready Figures

### 5. Advanced ggplot2 and composition  [Free]
Make figures publication and brand ready.

- Facets and small multiples
- Scales, guides and legends
- Custom themes and branding
- Annotations that explain
- Compose plots with patchwork
- Label points with ggrepel
- Color scales and accessibility

### 6. data.table and bigger-than-memory  [Free]
Wrangle millions of rows fast.

- data.table syntax in one lesson
- Keys and lightning-fast joins
- dplyr vs data.table, head to head
- Bridge the two with dtplyr
- Wrangling millions of rows
- Bigger-than-memory data with duckdb and duckplyr

### 7. Report-ready tables  [Free]
Tables that drop straight into a report.

- Polished tables with gt
- Reporting tables with flextable
- HTML tables with kableExtra
- Summary and regression tables with gtsummary
- Formatting numbers and units

### 8. Interactive output and dashboards  [Free]
Ship a live, interactive view.

- Interactive charts with plotly
- Maps with leaflet
- Linked views with crosstalk
- Quarto dashboards
- Your first Shiny app

### 9. Communicate, automate and AI-assist (2026)  [Free]
Turn a notebook into a decision, faster.

- Reports with Quarto and R Markdown
- Parameterized, repeatable reports
- Write the executive summary
- Tell a story with data
- Summarize and label data with an LLM (ellmer)
- When to trust, and not trust, an LLM in analysis

---

## 3. Data Scientist: Predictive modelling and machine learning

*Build, tune and evaluate supervised and unsupervised models, and judge honestly when they will generalise.*

Certificate: **Machine Learning with R**  |  16 sections  |  115 lessons

### 1. The data science workflow and first models  [Free]
Frame a problem as ML and ship a validated first model.

- Framing a business problem as machine learning (CRISP-DM)
- The modeling mindset: signal, noise and generalization
- Always start with a baseline
- Train, validation and test discipline
- Linear Regression
- Logistic Regression
- The bias-variance tradeoff
- How data leakage creeps in and ruins models

### 2. Classical supervised learning  [Pro]
Reach for the right classical model and know why it works.

- k-nearest neighbors and the curse of dimensionality
- Naive Bayes for text and tabular data
- Linear and quadratic discriminant analysis
- Support vector machines and the kernel trick
- Decision boundaries and model geometry
- Generative vs discriminative classifiers

### 3. Regularization and flexible regression  [Pro]
Control complexity and capture non-linearity.

- Ridge & Lasso Regression
- Elastic Net Regression
- Choosing lambda with cross-validation
- Splines and generalized additive models (mgcv)
- Quantile regression
- Robust regression for outliers

### 4. Tree-based models and gradient boosting  [Pro]
Build the models that win on tabular data.

- Decision trees from the ground up
- Bagging and random forests with ranger
- Gradient boosting, intuition then xgboost
- LightGBM and CatBoost in R
- The hyperparameters that actually matter
- Early stopping and learning rates
- Monotonic constraints for business rules

### 5. The tidymodels workflow  [Pro]
Run a clean, modern ML pipeline end to end.

- Preprocess data with recipes
- Define models with parsnip
- Bundle steps with workflows
- Resample with rsample
- Measure with yardstick
- Tune with the tune package
- Compare many models with workflowsets

### 6. Feature engineering and selection  [Pro]
Engineer features that lift performance without leaking.

- Encoding categorical variables
- Target and impact encoding, out-of-fold
- Scaling and transformations (Yeo-Johnson)
- Interaction and spline features
- Date, text and geospatial features
- Imputation that respects the split
- Feature selection: filter, wrapper and embedded (Boruta, RFE)
- Detecting target leakage

### 7. Model evaluation, resampling and tuning  [Pro]
Earn an honest estimate of out-of-sample performance.

- Cross-validation strategies
- Nested cross-validation done right
- Grid, random and Bayesian tuning
- Faster search with racing (finetune)
- Reading learning curves
- Proper scoring rules and regression metrics
- Comparing models statistically and the one-standard-error rule

### 8. Imbalanced, cost-sensitive and calibrated classification  [Pro]
Handle real, skewed and costly classification honestly.

- Beyond binary: multiclass strategies
- Class imbalance with themis (SMOTE, ROSE)
- Choosing the threshold under asymmetric costs
- ROC, PR, lift and gains curves
- Calibrating predicted probabilities (Platt, isotonic)
- Why AUC is not enough: Brier score and calibration

### 9. Unsupervised learning  [Pro]
Find structure and reduce dimensionality without labels.

- PCA in R
- Interpreting PCA Results
- Factor analysis
- Cluster Analysis
- DBSCAN Clustering
- Gaussian mixture models with mclust
- t-SNE and UMAP
- Association rules and market-basket analysis
- Anomaly and novelty detection

### 10. Natural language processing  [Pro]
Turn raw text into features, topics and predictions.

- Text preprocessing and tokenization (tidytext)
- Bag-of-words and TF-IDF
- Topic modeling with LDA
- Word and document embeddings
- Text classification end to end
- Transformers and sentence embeddings
- LLMs for extraction and classification (ellmer)

### 11. Deep learning  [Pro]
Train neural networks, and know when not to.

- Neural networks from the ground up
- How training works: SGD, backprop and loss
- Regularization: dropout, batch norm, early stopping
- Deep learning in R with torch and luz
- Convolutional networks for images
- Sequence models, attention and transformers
- Transfer learning and fine-tuning
- Tabular deep learning with tabnet

### 12. Recommenders, ranking and search  [Pro]
Build systems that surface the right item.

- Collaborative filtering and matrix factorization
- Content-based and hybrid recommenders
- Implicit feedback and the cold-start problem
- Learning to rank
- Embeddings for retrieval and semantic search
- Evaluating recommenders (NDCG, MAP, coverage)

### 13. Causal inference for decisions  [Pro]
Tell what will move the metric from what merely correlates.

- Correlation, causation and potential outcomes
- Causal diagrams (DAGs) for your assumptions
- A/B testing and experiment design
- Observational methods: matching, IPW, difference-in-differences
- Uplift and heterogeneous treatment effects
- Double and debiased machine learning
- Sensitivity analysis: how wrong could you be

### 14. Explainability, fairness and responsible AI  [Pro]
Explain, audit and defend a model to stakeholders.

- Global vs local explanations
- Permutation and drop-column importance
- SHAP values and SHAP interactions
- Partial dependence, ICE and ALE plots
- LIME and counterfactual explanations
- Fairness metrics and bias mitigation
- Model cards, datasheets and governance

### 15. MLOps: shipping and operating models  [Pro]
Take a model from notebook to monitored production.

- Reproducible pipelines with targets
- Experiment tracking and a model registry (vetiver)
- Serve a model with plumber and vetiver
- Containerize and deploy with Docker
- Batch vs real-time inference
- Monitoring, drift detection and retraining
- Data and feature stores
- An ML system design checklist

### 16. The frontier (2026): LLMs and modern ML  [Pro]
Use the tools the field moved to, with honest uncertainty.

- Talk to an LLM from R with ellmer
- Structured output and function calling
- Embeddings and vector search with duckdb
- Retrieval-augmented generation (RAG)
- Fine-tuning vs RAG vs prompting
- Evaluating LLM systems
- Agents and tool use
- Conformal prediction: distribution-free uncertainty for any model

---

## 4. Time Series: Time series analysis and forecasting

*Decompose, model and forecast ordered data, with prediction intervals you can stand behind.*

Certificate: **Time Series Forecasting**  |  16 sections  |  109 lessons

### 1. Time series foundations  [Free]
Read a series and produce honest baseline forecasts.

- What makes time series different
- Tidy temporal data with tsibble
- From raw timestamps to a regular series
- Gaps, duplicates and time zones
- Missing values in a series, and the certainty imputation invents
- Seasonal, subseries and lag plots
- Autocorrelation and the ACF
- Train and test splits for temporal data
- Benchmark forecasts: naive, seasonal naive and drift

### 2. Decomposition and features  [Pro]
Separate a series into parts and quantify its behavior.

- Moving averages and classical decomposition
- STL decomposition
- Seasonal adjustment (X-13ARIMA-SEATS)
- Box-Cox and variance-stabilizing transforms
- Calendar and population adjustments
- Feature extraction with feasts and tsfeatures

### 3. The forecasting toolbox  [Pro]
Evaluate forecasts the way professionals do.

- Fitted values, residuals and innovations
- Residual diagnostics and the Ljung-Box test
- Forecast distributions and prediction intervals
- Point forecasts vs the whole distribution
- Time-series cross-validation (rolling origin)
- Accuracy metrics: MASE, RMSSE and pinball loss
- Accuracy by horizon: reporting error growth honestly

### 4. Time series regression  [Pro]
Forecast with trend, season and external drivers.

- Time series linear models (TSLM)
- Trend and seasonal dummy variables
- Fourier terms for seasonality
- Useful predictors: lags, calendar and holidays
- Selecting predictors with cross-validation
- Spurious regression and how to avoid it

### 5. Exponential smoothing (ETS)  [Pro]
Pick and fit the right smoothing model.

- Simple exponential smoothing
- Holt linear trend and damped trend
- Holt-Winters seasonal methods
- The full ETS taxonomy
- Automatic ETS model selection
- Forecasting with ETS in fable

### 6. ARIMA and seasonal ARIMA  [Pro]
Identify, fit and diagnose (S)ARIMA models.

- Stationarity and unit-root tests (KPSS)
- Differencing and seasonal differencing
- Reading the ACF and PACF
- Non-seasonal ARIMA
- Seasonal ARIMA (SARIMA)
- ARIMA vs ETS, and when to use each
- Automatic and manual ARIMA selection

### 7. Dynamic regression and complex seasonality  [Pro]
Forecast with drivers and multiple seasonal cycles.

- Regression with ARIMA errors
- Dynamic harmonic regression
- Multiple seasonal periods
- Weekly data and its awkward seasonal period
- TBATS for complex seasonality
- Forecasting with Prophet
- Lagged predictors and transfer functions

### 8. State space models and the Kalman filter  [Pro]
Model series as evolving hidden states.

- Why state space models
- The Kalman filter and smoother
- Local level and local linear trend models
- Basic structural time series
- Bayesian structural time series (bsts)
- Dynamic linear models with dlm
- Time-varying parameters

### 9. Spectral and frequency-domain analysis  [Pro]
See a series through its frequencies.

- The frequency domain and the periodogram
- Estimating the spectral density
- Filtering: low-pass, high-pass and band-pass
- Detecting hidden periodicities
- Wavelets for non-stationary signals

### 10. Volatility modeling: ARCH and GARCH  [Pro]
Model changing variance in financial and risk series.

- Conditional heteroskedasticity and volatility clustering
- ARCH models
- The GARCH family (GARCH, EGARCH, GJR)
- Fitting GARCH with rugarch
- Forecasting volatility and Value at Risk
- Multivariate volatility (DCC-GARCH)

### 11. Multivariate time series  [Pro]
Model several interacting series together.

- Vector autoregression (VAR)
- Choosing the lag order
- Granger causality
- Impulse response functions
- Cointegration and the VECM
- Forecasting multiple related series

### 12. Hierarchical and grouped forecasting  [Pro]
Make forecasts that add up across a hierarchy.

- Hierarchical and grouped time series
- Bottom-up, top-down and middle-out
- Optimal reconciliation (MinT)
- Reconciliation with fabletools
- Temporal hierarchies: reconciling across frequencies
- Coherent forecasts finance can plan against

### 13. Machine learning and deep forecasting  [Pro]
Reach for ML and neural models when the data demands it.

- Global models: one model across thousands of series
- Machine-learning forecasting with modeltime
- Boosted trees for forecasting
- Neural network forecasts (NNETAR)
- Deep learning: DeepAR, N-BEATS and N-HiTS
- Temporal fusion transformers
- Forecasting count and low-volume series
- Forecast combination: averaging and trimmed means
- Weighted combination, and when the weights overfit

### 14. Intervention, causal impact and anomaly detection  [Pro]
Measure the effect of an event and catch the unexpected.

- Intervention analysis and interrupted time series
- Causal impact of an event (CausalImpact)
- Changepoint detection
- Anomaly and outlier detection
- Handling outliers in time series

### 15. The expert edge: forecasting like a pro  [Pro]
Techniques behind forecasts that survive contact with reality.

- Rolling-origin CV and the leakage that fakes great backtests
- Conformal prediction intervals for time series
- Intermittent demand: Croston, ADIDA and TSB
- Forecast value added: are you beating the naive baseline
- Scaled errors and the lessons of the M-competitions
- Judgmental adjustments and forecast governance
- Checking prediction-interval coverage

### 16. Production forecasting  [Pro]
Forecasts that refresh and hold up in production.

- Setting a refresh cadence and retraining
- Monitoring forecast accuracy over time
- Detecting and diagnosing forecast degradation
- Feature stores for calendars and events
- Scaling fable and fabletools
- Deploying a forecasting service
- Choosing the quantile your cost function implies
- Communicating a forecast to people who want one number

---

## 5. Researcher: Statistical inference and reporting

*Run and defend the right statistical test, model effects rigorously, and report results reproducibly.*

Certificate: **Applied Statistics with R**  |  16 sections  |  120 lessons

### 1. Probability, distributions and estimation  [Free]
Reason about uncertainty from first principles.

- Random Variables
- Normal, t, F, Chi-Squared
- Discrete distributions: binomial and Poisson
- Central Limit Theorem
- Sampling Distributions
- Point estimation and standard errors
- Bootstrap Confidence Intervals

### 2. Estimation and the bootstrap  [Pro]
Estimate parameters and quantify their uncertainty.

- Point estimation: bias, variance and MSE
- Maximum likelihood estimation
- Method of moments
- Fisher information and the Cramer-Rao bound
- The bootstrap: percentile vs BCa
- The jackknife
- The delta method

### 3. Confidence intervals and p-values  [Pro]
Report uncertainty honestly and avoid the classic traps.

- Confidence Intervals done right
- What a p-value is, and is not
- Simulation-based inference
- Interval coverage and calibration
- Standard errors you can trust
- Communicating uncertainty

### 4. Hypothesis testing and test selection  [Pro]
Choose, run and report the right test.

- Hypothesis Testing
- Choosing the Right Test
- t-Tests
- Checking assumptions and what breaks them
- Nonparametric Tests (Wilcoxon, Kruskal-Wallis)
- Permutation and randomization tests
- Effect Size
- Equivalence testing (TOST)

### 5. ANOVA, contrasts and multiple comparisons  [Pro]
Compare groups and correct for multiplicity.

- One-Way ANOVA
- Two-Way ANOVA
- Interaction Effects
- Fixed vs random effects
- Planned contrasts and post-hoc tests
- Family-wise error: Bonferroni and Holm
- The false discovery rate (Benjamini-Hochberg)
- Marginal means with emmeans

### 6. Linear regression, properly  [Pro]
Fit, diagnose and defend a regression.

- Multiple regression in depth
- Linear Regression Assumptions
- Diagnosing multicollinearity (VIF)
- Heteroskedasticity and robust, cluster-robust SEs
- Weighted and generalized least squares
- Influence, leverage and outliers
- Transformations that help
- Marginal effects and predictions

### 7. Regression modeling strategies  [Pro]
Build a model that validates, not one that just fits.

- Why stepwise selection is biased
- Nonlinearity with restricted cubic splines
- Interactions that matter
- Shrinkage and penalization
- Internal validation and bootstrap optimism
- Calibration and the events-per-variable rule
- Presenting a model: effects, partial effects and nomograms

### 8. Generalized linear models  [Pro]
Model counts, rates and categorical outcomes.

- Logistic regression in depth
- Probit and complementary log-log
- Poisson Regression
- Negative binomial and overdispersion
- Rates, offsets and exposure
- Ordinal and multinomial outcomes
- Zero-inflated and hurdle models
- Model checking with DHARMa

### 9. Mixed-effects and longitudinal models  [Pro]
Model grouped, repeated and correlated data.

- Why random effects
- Random intercepts and slopes (lme4, glmmTMB)
- Repeated-measures and growth-curve models
- Variance components and the ICC
- GEE vs mixed models
- Modeling autocorrelation
- Troubleshooting convergence

### 10. Additive and nonparametric models  [Pro]
Let the data choose the shape when assumptions fail.

- Smoothing and splines
- Generalized additive models (mgcv)
- Choosing smoothness and avoiding overfit
- Kernel density estimation
- Quantile regression
- Robust regression

### 11. Bayesian data analysis  [Pro]
Fit, check and report a Bayesian model with confidence.

- Priors, posteriors and conjugacy
- MCMC and Hamiltonian Monte Carlo
- Bayesian regression with brms and rstanarm
- Hierarchical (multilevel) models
- Prior and posterior predictive checks
- Model comparison with LOO and WAIC
- Regularizing and weakly informative priors
- A principled Bayesian workflow

### 12. Experimental design and A/B testing  [Pro]
Design a study that can actually answer the question.

- Design of experiments
- Randomization and blocking
- Factorial and split-plot designs
- Power analysis by simulation
- Sample-size planning
- A/B testing and sequential designs
- Response-surface and optimal designs
- Pre-registration

### 13. Causal inference from data  [Pro]
Separate what causes an outcome from what merely predicts it.

- Correlation, causation and potential outcomes
- Causal diagrams (DAGs) and confounding
- Propensity scores and inverse-probability weighting
- Matching methods
- Difference-in-differences
- Instrumental variables
- Regression discontinuity and synthetic control
- Mediation and sensitivity analysis

### 14. Survival and event-history analysis  [Pro]
Analyze time-to-event data correctly.

- Censoring and the survival and hazard functions
- Kaplan-Meier and the log-rank test
- Cox proportional hazards
- Checking the proportional-hazards assumption
- Time-varying covariates
- Parametric and flexible survival models
- Competing risks and frailty models

### 15. Multivariate, measurement and missing data  [Pro]
Handle many outcomes, latent traits and gaps.

- Multivariate methods (MANOVA, discriminant, canonical correlation)
- PCA and exploratory factor analysis
- Reliability and validity (Cronbach alpha)
- Structural equation modeling with lavaan
- Item response theory
- Missing-data mechanisms (MCAR, MAR, MNAR)
- Multiple imputation with mice

### 16. Meta-analysis, reproducibility and defensible reporting  [Pro]
Pool evidence and produce work that survives review.

- Effect sizes and their intervals
- Fixed vs random-effects meta-analysis
- Heterogeneity and meta-regression
- Forest and funnel plots
- Publication bias
- The replication crisis and the garden of forking paths
- Pre-registration and open science
- Reproducible manuscripts with Quarto, targets and renv
- Reporting standards (APA, CONSORT, STROBE)
- Specification-curve (multiverse) analysis

---

## 6. R Developer: Advanced R and software engineering

*Functional and object-oriented R, language internals, performance, and the engineering that turns scripts into tools.*

Certificate: **Advanced R**  |  15 sections  |  93 lessons

### 1. Functional programming in R  [Free]
Compose behavior instead of repeating it.

- Functional Programming
- purrr map() Variants
- Function Factories
- Function Operators
- Reduce, Filter, Map
- Anonymous functions and composition

### 2. Object-oriented R  [Pro]
Choose and use the right object system on purpose.

- OOP in R (S3/S4/R6)
- S3 Classes
- S4 Classes
- R6 Classes
- Operator Overloading
- The S7 object system

### 3. Environments, scoping and evaluation  [Pro]
Build an exact mental model of how R runs.

- R Names & Values
- R Environments
- Lexical Scoping
- R Closures
- Lazy evaluation and promises
- R Memory & lobstr

### 4. Metaprogramming and tidy evaluation  [Pro]
Write functions that speak tidyverse.

- Expressions and quotation
- Quasiquotation: !! and !!!
- Tidy evaluation and the curly-curly operator
- Data-masking functions of your own
- Walking and modifying the AST

### 5. Conditions, debugging and defensive design  [Pro]
Fail loudly, debug fast, design defensively.

- The conditions system
- Classed conditions with rlang::abort
- Custom errors and restarts
- Debugging workflow: browser, trace, recover
- Defensive programming
- Testing that errors fire correctly

### 6. Profiling and performance  [Pro]
Find the bottleneck, then make it fast.

- Profiling with profvis and bench
- Algorithmic complexity and vectorization
- Memory and copy-on-modify (lobstr)
- altrep and lazy vectors
- Caching and memoisation
- data.table and collapse for speed

### 7. C++ in R with Rcpp  [Pro]
Drop to compiled code for the hot path.

- When to reach for C++
- Rcpp essentials
- RcppArmadillo for linear algebra
- Writing the hot path in C++
- Integrating C and Fortran
- Debugging and profiling compiled code

### 8. Parallel and asynchronous R  [Pro]
Scale compute across cores and machines.

- Parallelism with future and furrr
- High-performance parallel with mirai
- Choosing a parallel backend
- Promises and async programming
- Background jobs and ExtendedTask
- Scaling compute to the cloud

### 9. Building R packages  [Pro]
Ship a documented, installable package.

- Package structure with devtools
- Automate setup with usethis
- Document with roxygen2
- Manage NAMESPACE and dependencies
- Data, vignettes and articles
- A pkgdown website
- Semantic versioning and releasing to CRAN

### 10. Testing, CI and quality  [Pro]
A package others can trust.

- Unit testing with testthat (3e)
- Snapshot tests
- Measuring code coverage
- R CMD check
- Continuous integration with GitHub Actions
- Linting and styling (lintr, styler)

### 11. Shiny application development  [Pro]
Build and deploy a real, fast app.

- The reactivity model
- Modules for large apps
- Async with ExtendedTask and promises
- Performance: bindCache and caching
- Testing Shiny with shinytest2
- Production Shiny with golem and rhino
- Deploying Shiny at scale

### 12. Databases and data engineering  [Pro]
Move and process data at scale from R.

- Talk to any database with DBI
- Translate dplyr to SQL with dbplyr
- In-process analytics with duckdb
- Columnar data at scale with arrow and parquet
- Reproducible pipelines with targets and crew
- Orchestration, logging and scheduling

### 13. APIs, deployment and interop  [Pro]
Serve R to the world and bridge other languages.

- Build APIs with plumber
- Modern HTTP with httr2
- Version and serve models with vetiver
- Containerize R with Docker
- Call Python from R with reticulate
- Secrets, config and environment management

### 14. Reproducibility and the developer workflow  [Pro]
Work like a software team.

- Project and environment management with renv
- Git and GitHub for R projects
- Literate programming and Quarto for docs
- Code review and pair-programming patterns
- CLI tools and scripting with R
- Observability: logging and structured errors

### 15. The expert edge: production-grade R  [Pro]
The internals and patterns that separate a scripter from an engineer.

- Designing a clean package API
- When to vectorize and when to go to C++
- Lazy evaluation traps and force()
- S7 and double dispatch in practice
- crew and mirai for distributed pipelines
- Conditions as control flow
- Finding and fixing a real memory leak
- altrep: custom vector backends

---

## Portfolio projects

28 industry builds, Starter through Capstone; several free.

| # | Project | Domain | Tier | Access | Stack |
|---|---|---|---|---|---|
| 1 | Clean a messy dataset | Data Analyst | Starter | Free | readr, dplyr, tidyr |
| 2 | Exploratory data analysis report | Data Analyst | Starter | Free | ggplot2, skimr |
| 3 | The chart that tells the story | Data Analyst | Starter | Free | ggplot2 |
| 4 | Your first predictive model | Data Scientist | Starter | Free | stats, broom |
| 5 | A/B test readout | Data Analyst | Starter | Free | infer |
| 6 | Survey analysis | Data Analyst | Starter | Free | dplyr, ggplot2 |
| 7 | Forecasting retail sales | Forecaster | Core | Free | fable, feasts |
| 8 | Predicting customer churn | Data Scientist | Core | Free | tidymodels, xgboost |
| 9 | Customer segmentation | Data Scientist | Core | Pro | cluster, factoextra |
| 10 | Demand forecasting & reorder points | Forecaster | Core | Pro | fable |
| 11 | Predicting credit card fraud | Data Scientist | Core | Pro | tidymodels, themis |
| 12 | Click-through rate prediction | Data Scientist | Core | Pro | xgboost, glmnet |
| 13 | Market mix modeling | Data Scientist | Advanced | Pro | regression, nloptr |
| 14 | Marketing attribution modeling | Data Scientist | Advanced | Pro | ChannelAttribution |
| 15 | Price elasticity & optimization | Researcher | Advanced | Pro | regression |
| 16 | Uplift / incrementality modeling | Data Scientist | Advanced | Pro | uplift, tidymodels |
| 17 | Customer lifetime value | Data Scientist | Advanced | Pro | CLVTools, BTYDplus |
| 18 | Recommender system | Data Scientist | Advanced | Pro | recommenderlab |
| 19 | Time-series anomaly detection | Forecaster | Advanced | Pro | fable, anomalize |
| 20 | Credit risk scorecard + fairness audit | Statistician | Advanced | Pro | tidymodels, scorecard |
| 21 | Causal impact of a campaign | Researcher | Advanced | Pro | CausalImpact |
| 22 | Review sentiment & topics (NLP) | Data Scientist | Advanced | Pro | tidytext, topicmodels |
| 23 | Survival analysis: retention | Statistician | Advanced | Pro | survival, survminer |
| 24 | Bayesian A/B testing framework | Statistician | Advanced | Pro | brms |
| 25 | Deploy an end-to-end ML service | R Developer | Capstone | Pro | vetiver, plumber |
| 26 | LLM text classification at scale | Data Scientist | Advanced | Pro | ellmer, tidymodels |
| 27 | A RAG assistant over your own docs | R Developer | Capstone | Pro | ellmer, duckdb, plumber |
| 28 | Conformal prediction in production | Data Scientist | Capstone | Pro | probably, tidymodels |

