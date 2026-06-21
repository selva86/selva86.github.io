// _roadmap-data-v2.js -- reworked 2026 curriculum: balanced sections, practitioner depth.
// Loads AFTER _roadmap-data.js; reuses RM.byKey. Exposes window.RM2.
// Access model (applied by the renderer): Steps 1-2 every section free; Steps 3-6 Section 1 free, rest Pro.
// IDEAL-FIRST: lessons are what the path SHOULD teach, NOT limited to posts that already exist.
// Depth targets: Time Series at the grade of Hyndman & Athanasopoulos (fpp3); Statistics beyond
// statisticsbyjim / Harrell RMS; ML at ISLR/tidymodels + a practitioner "expert edge"; every track
// ends with a 2026 / production layer. Sections are kept to ~5-8 lessons so no Section 1 is a grab-bag.
// links{} is a best-effort overlay to existing posts; unmatched free lessons are to-be-created
// (they route to /tutorials/ for now), and Pro lessons route to enrollment.
(function (root) {
  'use strict';
  function S(n, free, title, outcome, items, hub, tool) {
    return { n: n, free: free, title: title, outcome: outcome, items: items, hub: hub, tool: tool };
  }

  var sections = {
    foundations: [
      S(1, true, 'Syntax, types and vectors', 'Read and write idiomatic base R and reason about how it stores values.',
        ['R Syntax 101','R Data Types','R Vectors','Operators, recycling and coercion rules','NA, NULL, NaN and Inf','Getting Help in R'],
        'R Vectors (12 problems)', 'R syntax cheat sheet'),
      S(2, false, 'Lists, data frames and tibbles', 'Hold and inspect any rectangular or nested data.',
        ['R Lists','R Data Frames','Tibbles and modern data frames','Attributes, names and structure (str)','Matrices and arrays','Coercion and type conversion in practice'],
        'Data structures exercises', 'structure inspector'),
      S(3, false, 'Subsetting, control flow and functions', 'Move from snippets to programs you can reuse.',
        ['R Subsetting','Replacement and assignment functions','R Control Flow','Writing R Functions','Arguments, defaults and the dots (...)','The pipe (|> and %>%) and the tidyverse style guide'],
        'R Functions (15 problems)', 'project starter'),
      S(4, false, 'Importing and exporting real data', 'Load any common format without a fight.',
        ['Read CSV and delimited files with readr','Read Excel workbooks with readxl','Import SPSS, Stata and SAS with haven','Pull JSON from APIs with jsonlite','Scrape and parse HTML with rvest','Query databases with DBI and dbplyr','Fast columnar data with arrow and parquet','Encodings, locales and very large files'],
        'Data import exercises', 'format picker'),
      S(5, false, 'Strings, dates and regular expressions', 'Clean messy real-world text and timestamps.',
        ['String manipulation with stringr','Regular expressions from the ground up','Find, extract and replace with regex','Dates and times with lubridate','Working across time zones','Ordered categories with forcats'],
        'String and regex exercises', 'regex tester'),
      S(6, false, 'Iteration: the apply family and purrr', 'Replace fragile loops with vectorized, functional iteration.',
        ['Why vectorization beats loops','apply, lapply and sapply','Type-safe iteration with vapply','The map family in purrr','Iterate over two or more inputs (map2, pmap)','Side effects with walk','Resilient iteration with safely and possibly','Nested data and list-columns'],
        'Iteration exercises', 'purrr verb picker'),
      S(7, false, 'Defensive code and debugging', 'Write code that fails loudly and is quick to fix.',
        ['Signal problems with stop, warning and message','Recover with tryCatch','Validate inputs with stopifnot','Write error messages people understand','Step-through debugging with browser and traceback','Debugging in RStudio and Positron'],
        'Error-handling exercises', 'condition explorer'),
      S(8, false, 'Reproducible workflow and the 2026 toolchain', 'Set up a project you can rerun in a year, with modern tools.',
        ['Organize work with RStudio Projects and here','Pin packages with renv','Track changes with git','Positron: the next-generation R IDE','Modern web APIs with httr2','In-process big data with duckdb and duckplyr','Columnar data at scale with arrow','Talk to an LLM from R with ellmer'],
        'Reproducible workflow checklist', 'project starter')
    ],
    analyst: [
      S(1, true, 'Wrangle and tidy with dplyr', 'Take a raw file to a clean, analysis-ready table.',
        ['Importing Data','Tidy data principles','dplyr filter & select','dplyr mutate and transmute','dplyr group_by & summarise','arrange, distinct and count','Recode and derive with case_when','Missing Value Treatment'],
        'dplyr (15 problems)', 'dplyr verb picker'),
      S(2, false, 'Join and reshape any dataset', 'Combine and reshape data of any shape.',
        ['R Joins','Every join type, visualized','Non-equi and rolling joins with join_by','pivot_longer & pivot_wider','Nest, unnest and rectangling','separate, unite and clean columns','Fuzzy matching and joins'],
        'Joins and reshape exercises', 'join visualizer'),
      S(3, false, 'Exploratory data analysis', 'Profile any dataset and surface what matters.',
        ['EDA (7-Step Framework)','Univariate EDA','Bivariate EDA','Correlation Analysis','Outlier Detection','Automated EDA with skimr and DataExplorer'],
        'EDA exercises', 'summary stats explorer'),
      S(4, false, 'Visualization with ggplot2', 'Build any chart in the grammar of graphics.',
        ['Grammar of Graphics','ggplot2 Getting Started','Scatter Plots','Line Charts','Bar Charts','Distribution Charts','Top 50 ggplot2 Visualizations','Publication-Ready Figures'],
        'ggplot2 (15 problems)', 'chart type chooser'),
      S(5, false, 'Advanced ggplot2 and composition', 'Make figures publication and brand ready.',
        ['Facets and small multiples','Scales, guides and legends','Custom themes and branding','Annotations that explain','Compose plots with patchwork','Label points with ggrepel','Color scales and accessibility'],
        'ggplot2 mastery', 'theme builder'),
      S(6, false, 'data.table and bigger-than-memory', 'Wrangle millions of rows fast.',
        ['data.table syntax in one lesson','Keys and lightning-fast joins','dplyr vs data.table, head to head','Bridge the two with dtplyr','Wrangling millions of rows','Bigger-than-memory data with duckdb and duckplyr'],
        'data.table exercises', 'speed benchmark'),
      S(7, false, 'Report-ready tables', 'Tables that drop straight into a report.',
        ['Polished tables with gt','Reporting tables with flextable','HTML tables with kableExtra','Summary and regression tables with gtsummary','Formatting numbers and units'],
        'Tables exercises', 'table builder'),
      S(8, false, 'Interactive output and dashboards', 'Ship a live, interactive view.',
        ['Interactive charts with plotly','Maps with leaflet','Linked views with crosstalk','Quarto dashboards','Your first Shiny app'],
        'Dashboard exercises', 'dashboard starter'),
      S(9, false, 'Communicate, automate and AI-assist (2026)', 'Turn a notebook into a decision, faster.',
        ['Reports with Quarto and R Markdown','Parameterized, repeatable reports','Write the executive summary','Tell a story with data','Summarize and label data with an LLM (ellmer)','When to trust, and not trust, an LLM in analysis'],
        'Reporting exercises', 'report template')
    ],
    ds: [
      S(1, true, 'Predictive modeling foundations', 'Take a problem from raw data to a validated model, and know its limits.',
        ['The modeling mindset: signal, noise and generalization','Always start with a baseline','Train, validation and test discipline','Linear Regression','Logistic Regression','Regression Diagnostics','The bias-variance tradeoff'],
        'Regression (15 problems)', 'regression diagnostics tool'),
      S(2, false, 'The tidymodels workflow', 'Run a clean, modern ML pipeline end to end.',
        ['Preprocess data with recipes','Define models with parsnip','Bundle steps with workflows','Resample with rsample','Measure with yardstick','Tune with the tune package','Compare many models with workflowsets'],
        'tidymodels exercises', 'workflow builder'),
      S(3, false, 'Regularization and flexible regression', 'Control complexity and capture non-linearity.',
        ['Ridge & Lasso Regression','Elastic Net Regression','Choosing lambda with cross-validation','Splines and generalized additive models (mgcv)','Quantile regression','Robust regression'],
        'Regularization exercises', 'model comparison board'),
      S(4, false, 'Tree-based models and ensembles', 'Build the models that win on tabular data.',
        ['Decision trees from the ground up','Bagging and random forests with ranger','Gradient boosting with xgboost','LightGBM and CatBoost in R','Hyperparameters that actually matter','Feature importance and SHAP','Partial dependence and ICE plots'],
        'Ensembles exercises', 'importance explorer'),
      S(5, false, 'Classification in depth', 'Handle real, imbalanced classification honestly.',
        ['Beyond binary: multiclass strategies','Fixing class imbalance with themis (SMOTE, ROSE)','Choosing the decision threshold','ROC, AUC, PR and lift curves','Calibrating predicted probabilities','Multi-label classification'],
        'Classification exercises', 'ROC explorer'),
      S(6, false, 'Feature engineering and leakage', 'Engineer features that lift performance without leaking.',
        ['Encoding categorical variables','Target and impact encoding without leakage','Scaling and transformations (Yeo-Johnson)','Interaction and spline features','Date, text and geospatial features','Detecting target leakage','Feature selection with Boruta and RFE'],
        'Feature-eng exercises', 'leakage checker'),
      S(7, false, 'Unsupervised learning', 'Find structure and reduce dimensionality without labels.',
        ['PCA in R','Interpreting PCA Results','Factor analysis','Cluster Analysis','DBSCAN Clustering','Gaussian mixture models with mclust','t-SNE and UMAP','Choosing and validating the number of clusters'],
        'Unsupervised exercises', 'PCA explorer'),
      S(8, false, 'Resampling, tuning and honest evaluation', 'A model you can trust on new data.',
        ['Cross-validation strategies','Nested cross-validation done right','Grid, random and Bayesian tuning','Faster search with racing (finetune)','Reading learning curves','The one-standard-error rule','Comparing models statistically'],
        'Validation exercises', 'CV planner'),
      S(9, false, 'Explainability and MLOps', 'Ship and defend a model in production.',
        ['Explain models with DALEX','SHAP and LIME in practice','Write a model card','Serve a model with plumber and vetiver','Monitor a model and detect drift','Reproducible ML pipelines with targets'],
        'XAI and MLOps exercises', 'model card builder'),
      S(10, false, 'The expert edge: ML that holds up', 'The judgment that separates a practitioner from a Kaggle script.',
        ['Conformal prediction: honest intervals for any model','Probability calibration, and why AUC is not enough','Out-of-fold target encoding','Monotonic constraints inside xgboost','Adversarial validation: catch train/test drift','SHAP interaction values','Threshold optimization under asymmetric costs','Model stacking and super learners'],
        'Expert ML exercises', 'calibration lab'),
      S(11, false, 'Modern ML in R (2026)', 'The tools the field moved to while most courses did not.',
        ['Deep learning with torch and luz','Tabular deep learning with tabnet','Text embeddings for classification and search','LLM-powered classification with ellmer','Double machine learning for causal effects','Recommenders with recommenderlab','Time-aware validation and concept drift'],
        '2026 ML exercises', 'torch starter')
    ],
    ts: [
      S(1, true, 'Time series foundations', 'Read a series and produce honest baseline forecasts.',
        ['What makes time series different','Tidy temporal data with tsibble','Time Series Analysis','EDA for Time Series','Seasonal, subseries and lag plots','Autocorrelation and the ACF','Train and test splits for temporal data','Benchmark forecasts: naive, seasonal naive and drift'],
        'Time series exercises', 'forecast horizon tool'),
      S(2, false, 'Decomposition and features', 'Separate a series into parts and quantify its behavior.',
        ['Moving averages and classical decomposition','STL decomposition','Seasonal adjustment (X-13ARIMA-SEATS)','Box-Cox and variance-stabilizing transforms','Calendar and population adjustments','Feature extraction with feasts and tsfeatures'],
        'Decomposition exercises', 'STL explorer'),
      S(3, false, 'The forecasting toolbox', 'Evaluate forecasts the way professionals do.',
        ['Fitted values, residuals and innovations','Residual diagnostics and the Ljung-Box test','Forecast distributions and prediction intervals','Point forecasts vs the whole distribution','Time-series cross-validation (rolling origin)','Accuracy metrics: MASE, RMSSE and pinball loss'],
        'Evaluation exercises', 'backtest harness'),
      S(4, false, 'Time series regression', 'Forecast with trend, season and external drivers.',
        ['Time series linear models (TSLM)','Trend and seasonal dummy variables','Fourier terms for seasonality','Useful predictors: lags, calendar and holidays','Selecting predictors with cross-validation','Spurious regression and how to avoid it'],
        'TS regression exercises', 'predictor lab'),
      S(5, false, 'Exponential smoothing (ETS)', 'Pick and fit the right smoothing model.',
        ['Simple exponential smoothing','Holt linear trend and damped trend','Holt-Winters seasonal methods','The full ETS taxonomy','Automatic ETS model selection','Forecasting with ETS in fable'],
        'ETS exercises', 'smoothing playground'),
      S(6, false, 'ARIMA and seasonal ARIMA', 'Identify, fit and diagnose (S)ARIMA models.',
        ['Stationarity and unit-root tests (KPSS)','Differencing and seasonal differencing','Reading the ACF and PACF','Non-seasonal ARIMA','Seasonal ARIMA (SARIMA)','ARIMA vs ETS, and when to use each','Automatic and manual ARIMA selection'],
        'ARIMA exercises', 'ARIMA identifier'),
      S(7, false, 'Dynamic regression and complex seasonality', 'Forecast with drivers and multiple seasonal cycles.',
        ['Regression with ARIMA errors','Dynamic harmonic regression','Multiple seasonal periods','TBATS for complex seasonality','Forecasting with Prophet','Lagged predictors and transfer functions'],
        'Dynamic-reg exercises', 'seasonality lab'),
      S(8, false, 'Hierarchical and grouped forecasting', 'Make forecasts that add up across a hierarchy.',
        ['Hierarchical and grouped time series','Bottom-up, top-down and middle-out','Optimal reconciliation (MinT)','Reconciliation with fabletools','Coherent forecasts finance can plan against'],
        'Reconciliation exercises', 'reconciliation tool'),
      S(9, false, 'Advanced and global forecasting', 'Reach for heavier tools when the data demands it.',
        ['Global models: one model across thousands of series','Machine-learning forecasting with modeltime','Boosted trees for forecasting','Neural network forecasts (NNETAR)','Bootstrapping and bagging forecasts','Forecast combinations','Vector autoregression (VAR) for multivariate series'],
        'Advanced forecasting exercises', 'global model lab'),
      S(10, false, 'The expert edge: forecasting like a pro', 'Techniques behind forecasts that survive contact with reality.',
        ['Rolling-origin CV and the leakage that fakes great backtests','Conformal prediction intervals for time series','Intermittent demand: Croston, ADIDA and TSB','Forecast value added: are you beating the naive baseline','Scaled errors and the lessons of the M-competitions','Judgmental adjustments and forecast governance','Checking prediction-interval coverage'],
        'Expert forecasting exercises', 'FVA dashboard'),
      S(11, false, 'Production forecasting', 'Forecasts that refresh and hold up in production.',
        ['Setting a refresh cadence and retraining','Monitoring forecast accuracy over time','Anomaly detection on forecast residuals','Feature stores for calendars and events','Scaling fable and fabletools','Deploying a forecasting service'],
        'Production exercises', 'refresh planner')
    ],
    researcher: [
      S(1, true, 'Probability, distributions and estimation', 'Reason about uncertainty from first principles.',
        ['Random Variables','Normal, t, F, Chi-Squared','Discrete distributions: binomial and Poisson','Central Limit Theorem','Sampling Distributions','Point estimation and standard errors','Bootstrap Confidence Intervals'],
        'Probability exercises', 'distribution playground'),
      S(2, false, 'Estimation and uncertainty', 'Quantify and report uncertainty honestly.',
        ['Confidence Intervals done right','The bootstrap: percentile vs BCa','The delta method','What a p-value is, and is not','Bias, consistency and efficiency','Simulation-based inference'],
        'Estimation exercises', 'CI explorer'),
      S(3, false, 'Hypothesis testing and test selection', 'Choose, run and report the right test.',
        ['Hypothesis Testing','Choosing the Right Test','t-Tests','Nonparametric Tests','Permutation and randomization tests','Effect Size','Checking assumptions and robustness'],
        'Hypothesis testing exercises', 'which-test chooser'),
      S(4, false, 'ANOVA and multiple comparisons', 'Compare groups and correct for multiplicity.',
        ['One-Way ANOVA','Two-Way ANOVA','Interaction Effects','Post-Hoc Tests After ANOVA','Family-wise error: Bonferroni and Holm','The false discovery rate (Benjamini-Hochberg)','Contrasts and marginal means with emmeans'],
        'ANOVA exercises', 'contrast builder'),
      S(5, false, 'Linear regression, properly', 'Fit, diagnose and defend a regression.',
        ['Multiple regression in depth','Linear Regression Assumptions','Diagnosing multicollinearity (VIF)','Transformations that help','Robust and weighted least squares','Influence, leverage and outliers','Marginal effects and predictions'],
        'Linear models exercises', 'diagnostics lab'),
      S(6, false, 'Generalized linear models', 'Model counts, rates and categorical outcomes.',
        ['Logistic regression revisited','Poisson Regression','Negative binomial and overdispersion','Rates, offsets and exposure','Ordinal and multinomial outcomes','Zero-inflated and hurdle models','Model checking with DHARMa'],
        'GLM exercises', 'GLM picker'),
      S(7, false, 'Mixed-effects and additive models', 'Model grouped, repeated and non-linear data.',
        ['Why mixed models','Random intercepts and slopes (lme4)','Repeated-measures and longitudinal designs','Variance components and the ICC','Generalized additive models (mgcv)','Troubleshooting convergence'],
        'Mixed-models exercises', 'model spec helper'),
      S(8, false, 'Experimental design and causal inference', 'Design a study and read it honestly.',
        ['Design of experiments','Power analysis by simulation','Randomization, blocking and confounding','Causal diagrams (DAGs)','Propensity score methods','Difference-in-differences','Instrumental variables','Regression discontinuity and synthetic control'],
        'Causal exercises', 'power calculator'),
      S(9, false, 'Bayesian statistics', 'Fit, check and report a Bayesian model.',
        ['Priors and posteriors','Bayesian regression with brms','MCMC diagnostics (R-hat and ESS)','Prior and posterior predictive checks','Model comparison with LOO and WAIC','Reporting credible intervals','A principled Bayesian workflow'],
        'Bayesian exercises', 'prior explorer'),
      S(10, false, 'Survival, multivariate and missing data', 'Handle time-to-event, many outcomes and gaps.',
        ['Kaplan-Meier and the log-rank test','Cox proportional hazards','Parametric and competing-risks models','Analyzing complex survey data','Multivariate methods (MANOVA, discriminant)','Meta-analysis and forest plots','Multiple imputation with mice (MAR vs MNAR)'],
        'Specialized methods exercises', 'survival lab'),
      S(11, false, 'The expert edge: defensible inference', 'What reviewers and senior statisticians actually check.',
        ['Equivalence testing (TOST): proving there is no effect','When the percentile bootstrap lies (use BCa)','Robust and cluster-robust standard errors','Marginal effects with emmeans and marginaleffects','Multiple imputation done right','Double and debiased machine learning','Targeted learning (TMLE)','Specification-curve (multiverse) analysis'],
        'Expert inference exercises', 'multiverse explorer')
    ],
    developer: [
      S(1, true, 'Functional programming in R', 'Compose behavior instead of repeating it.',
        ['Functional Programming','purrr map() Variants','Function Factories','Function Operators','Reduce, Filter, Map','Anonymous functions and composition'],
        'FP (mastery quiz)', 'purrr verb picker'),
      S(2, false, 'Object-oriented R', 'Choose and use the right object system on purpose.',
        ['OOP in R (S3/S4/R6)','S3 Classes','S4 Classes','R6 Classes','Operator Overloading','The S7 object system'],
        'OOP exercises', 'class system chooser'),
      S(3, false, 'Environments, scoping and evaluation', 'Build an exact mental model of how R runs.',
        ['R Names & Values','R Environments','Lexical Scoping','R Closures','Lazy evaluation and promises','R Memory & lobstr'],
        'Internals exercises', 'environment inspector'),
      S(4, false, 'Metaprogramming and tidy evaluation', 'Write functions that speak tidyverse.',
        ['Expressions and quotation','Quasiquotation: !! and !!!','Tidy evaluation and the curly-curly operator','Data-masking functions of your own','Walking and modifying the AST'],
        'Metaprogramming exercises', 'tidy-eval lab'),
      S(5, false, 'Conditions, debugging and defensive design', 'Fail loudly, debug fast, design defensively.',
        ['The conditions system','Classed conditions with rlang::abort','Custom errors and restarts','Debugging workflow: browser, trace, recover','Defensive programming','Testing that errors fire correctly'],
        'Debugging exercises', 'condition explorer'),
      S(6, false, 'Performance and parallelism', 'Make slow R substantially faster.',
        ['Profiling with profvis and bench','Vectorization and algorithmic fixes','Speed with Rcpp and C++','RcppArmadillo for linear algebra','Memory and copy-on-modify (lobstr)','Parallelism with future, furrr and mirai','altrep and lazy vectors'],
        'Performance exercises', 'profiler'),
      S(7, false, 'Building R packages', 'Ship a documented, installable package.',
        ['Package structure with devtools','Automate setup with usethis','Document with roxygen2','Manage NAMESPACE and dependencies','Data, vignettes and articles','A pkgdown website','Versioning and releasing'],
        'Package exercises', 'package scaffolder'),
      S(8, false, 'Testing, CI and quality', 'A package others can trust.',
        ['Unit testing with testthat (3e)','Snapshot tests','Measuring code coverage','R CMD check','Continuous integration with GitHub Actions','Linting and styling (lintr, styler)'],
        'Testing exercises', 'CI template'),
      S(9, false, 'Shiny application development', 'Build and deploy a real app.',
        ['The reactivity model','Modules for large apps','Async with ExtendedTask and promises','Performance: bindCache and caching','Testing Shiny with shinytest2','Deploying Shiny'],
        'Shiny exercises', 'Shiny starter'),
      S(10, false, 'Production and data engineering', 'Run R like software in production.',
        ['Build APIs with plumber','Version and serve models with vetiver','Containerize R with Docker','Pipelines with targets and crew','Logging and scheduling','Big data in-process with duckdb and dbplyr'],
        'Production exercises', 'pipeline template'),
      S(11, false, 'The expert edge: production-grade R', 'The internals and patterns that separate a scripter from an engineer.',
        ['Tidy-eval mastery: the curly-curly, !! and !!!','The S7 object system in anger','Rcpp and RcppArmadillo for the hot path','Parallel R that scales: future, furrr and mirai','Reproducible pipelines with targets and crew','Classed, structured errors with rlang::abort','High-performance Shiny: bindCache, ExtendedTask, modules','Big data in-process with duckdb','Memory, copy-on-modify and altrep'],
        'Expert engineering exercises', 'flame-graph reader')
    ]
  };

  // ---- portfolio projects, by role (scenario -> build -> walk away with) ----
  function P(name, scenario, build, wow) { return { name: name, scenario: scenario, build: build, wow: wow }; }
  var projects = {
    analyst: [
      P('Win back the churn', 'A subscription business is quietly losing 6% of its customers every month, and nobody can say who or why.', 'Clean two years of messy CRM and billing exports, run a cohort and retention analysis, and ship an interactive dashboard that ranks the segments most at risk.', 'A board-ready dashboard that turns "we have a churn problem" into a named list of exactly who to save first.'),
      P('The report that runs itself', 'An analyst burns two full days every month rebuilding the same deck by hand.', 'Build a parameterized Quarto + gt pipeline that regenerates the entire monthly report from a fresh data drop in one command.', 'A report that updates itself, and two reclaimed days a month, every month, forever.'),
      P('Did the experiment actually work?', 'Marketing ran an A/B test and the team is arguing about whether the lift was real or noise.', 'Design the test correctly, analyze it end to end (power, significance, effect size, by segment), and write the one-page executive readout.', 'You end the argument with evidence, and keep a template you reuse for every future test.'),
      P('What 5,000 customers really think', 'A 5,000-response survey is sitting unused because nobody can make sense of it.', 'Turn Likert scales and free-text into a weighted, themed, visual report with the satisfaction drivers ranked.', 'The three things that actually move satisfaction, surfaced so leadership acts on them this quarter.')
    ],
    ds: [
      P('Catch churn 60 days early', 'By the time a customer clicks cancel, it is already too late to save them.', 'Engineer features from raw event logs, tune a gradient-boosted model with honest cross-validation, explain every prediction with SHAP, and serve it behind a live API with a model card.', 'A deployed model that flags at-risk customers 60 days out, each with a plain-English reason a sales rep can act on.'),
      P('The credit decision you can defend', 'A loan model that is accurate but unfair is not an asset, it is a lawsuit.', 'Build a default-risk classifier on imbalanced data with calibrated probabilities, a cost-based decision threshold, and a fairness audit across groups.', 'A risk model that survives a compliance review, not just a leaderboard.'),
      P('Find the customers you did not know you had', 'Marketing treats a base of millions as one undifferentiated blob.', 'Combine RFM with clustering into named, profiled personas, each with a recommended action and an expected value.', 'Five data-backed personas and a playbook you hand straight to the marketing team.'),
      P('Price it right', 'Pricing is set by gut feel, and nobody knows what a price change actually costs.', 'Build a demand and price-sensitivity model with disciplined feature engineering, validated on held-out time, with elasticity curves.', 'The exact volume lost at each price point, and the revenue-maximizing spot on the curve.')
    ],
    researcher: [
      P('A paper that reproduces on the first try', 'Journals increasingly desk-reject analyses that cannot be reproduced.', 'Write a full Quarto manuscript on a real dataset where every number regenerates from raw data with renv + targets, plus journal-ready tables and figures.', 'Work no reviewer can dismiss as a black box, reproducible end to end from a single command.'),
      P('Prove the intervention worked', 'A promising result falls apart the moment a methods committee looks closely.', 'Design a study with a real power analysis, fit the correct mixed-effects model for the clustered, repeated design, and report effect sizes honestly.', 'A causal claim you can defend in a room full of statisticians.'),
      P('Causality from messy observational data', 'A randomized trial was impossible, but the question still needs a real answer.', 'Estimate the effect with propensity matching or difference-in-differences, a DAG of your assumptions, and a sensitivity analysis.', 'A defensible causal estimate where everyone else has only correlation.'),
      P('Settle the literature', 'Ten studies, ten different answers, and no consensus.', 'Pool effect sizes across the studies, build a forest plot, and quantify heterogeneity and publication bias.', 'One defensible conclusion that turns a contradictory literature into an answer.')
    ],
    statistician: [
      P('Read out a clinical trial', 'A trial is only as trustworthy as the analysis behind it.', 'Run survival analysis (Kaplan-Meier + Cox), produce a CONSORT flow diagram, and deliver an analysis-plan-driven report to regulatory standard.', 'A trial readout a biostatistician would put their name on.'),
      P('A/B testing, the Bayesian way', 'Stakeholders do not trust p-values and keep peeking at running tests.', 'Build a reusable brms framework that reports the probability a variant is better and the expected loss of being wrong, with proper stopping rules.', 'A dollar-valued decision rule the business actually understands, instead of p-value arguments.'),
      P('Catch the defect before it ships', 'A process drifts out of spec, and the first sign is a batch of customer returns.', 'Build control charts and a process-capability analysis on a live manufacturing stream, with alerting rules.', 'A monitoring system that flags a process going out of control in real time.'),
      P('Forecast the whole organization', 'Finance plans on forecasts where the parts do not add up to the whole.', 'Forecast hundreds of grouped series and reconcile them so SKU, region and company totals agree, backtested for accuracy.', 'One coherent forecast from SKU to company level that finance can actually plan against.')
    ],
    ts: [
      P('A forecast finance trusts', 'Every plan rests on a demand forecast nobody has actually validated.', 'Build, backtest and reconcile a multi-series demand forecast with prediction intervals in the fable framework.', 'A forecast with a track record, not a guess, that finance plans against.'),
      P('When will it run out?', 'Stockouts and overstock are both expensive, and both avoidable.', 'Forecast demand per SKU with seasonality and promotions, and turn it into reorder points.', 'Reorder points that cut stockouts without burying cash in inventory.'),
      P('Anomalies before they cost you', 'A spike or a dip only gets noticed a month later, in the report.', 'Build a forecast-residual anomaly detector that flags unusual movements as they happen.', 'Real-time alerts the moment a metric leaves its expected range.'),
      P('Capacity for the year ahead', 'Hiring and infrastructure are sized on hunches.', 'Produce a 12-month capacity forecast with scenarios and confidence bands.', 'A defensible capacity plan with the uncertainty made explicit.')
    ],
    developer: [
      P('Ship a package people install', 'Your team copies the same helper script into every new project.', 'Turn it into a documented, tested R package on GitHub with a pkgdown site and CI.', 'A package others install with one line, with your name on it.'),
      P('The Shiny app stakeholders use daily', 'Decision-makers cannot read your R script, so the insight never lands.', 'Build a modular, tested Shiny app and deploy it.', 'A live tool non-coders use every day, replacing a stack of ad-hoc requests.'),
      P('Make the pipeline 10x faster', 'An overnight job now runs all night and into the morning.', 'Profile the bottleneck, rewrite the hot path with Rcpp or data.table, and parallelize it.', 'An overnight job that finishes before your coffee.'),
      P('A pipeline that reruns itself', 'Nobody can reproduce the numbers from last quarter.', 'Build a targets pipeline with renv, logging and scheduling, containerized with Docker.', 'A one-command, reproducible pipeline that runs on schedule without you.')
    ]
  };

  // ---- flat, difficulty-ranked project catalog ----
  function PJ(n, name, domain, tier, free, blurb, stack) { return { n: n, name: name, domain: domain, tier: tier, free: free, blurb: blurb, stack: stack }; }
  var projectList = [
    PJ(1, 'Clean a messy dataset', 'Data Analyst', 'Starter', true, 'Wrangle raw exports, fix types, and join lookups into one tidy table.', 'readr, dplyr, tidyr'),
    PJ(2, 'Exploratory data analysis report', 'Data Analyst', 'Starter', true, 'Profile an unfamiliar dataset and surface what actually matters.', 'ggplot2, skimr'),
    PJ(3, 'The chart that tells the story', 'Data Analyst', 'Starter', true, 'Recreate a publication-quality figure from raw data, by hand.', 'ggplot2'),
    PJ(4, 'Your first predictive model', 'Data Scientist', 'Starter', true, 'Fit, check and interpret a linear and a logistic regression.', 'stats, broom'),
    PJ(5, 'A/B test readout', 'Data Analyst', 'Starter', true, 'Design, analyze and report a controlled experiment.', 'infer'),
    PJ(6, 'Survey analysis', 'Data Analyst', 'Starter', true, 'Turn Likert scales and free text into a weighted, visual report.', 'dplyr, ggplot2'),
    PJ(7, 'Forecasting retail sales', 'Forecaster', 'Core', true, 'Forecast weekly store sales with seasonality and holiday effects.', 'fable, feasts'),
    PJ(8, 'Predicting customer churn', 'Data Scientist', 'Core', true, 'Predict who will cancel, and explain why, 60 days out.', 'tidymodels, xgboost'),
    PJ(9, 'Customer segmentation', 'Data Scientist', 'Core', false, 'Group customers into actionable, named personas with RFM and clustering.', 'cluster, factoextra'),
    PJ(10, 'Demand forecasting & reorder points', 'Forecaster', 'Core', false, 'Turn demand forecasts into concrete inventory decisions.', 'fable'),
    PJ(11, 'Predicting credit card fraud', 'Data Scientist', 'Core', false, 'Catch fraud in highly imbalanced transaction data.', 'tidymodels, themis'),
    PJ(12, 'Click-through rate prediction', 'Data Scientist', 'Core', false, 'Predict click probability at advertising scale.', 'xgboost, glmnet'),
    PJ(13, 'Market mix modeling', 'Data Scientist', 'Advanced', false, 'Attribute sales to media spend with adstock and saturation curves.', 'regression, nloptr'),
    PJ(14, 'Marketing attribution modeling', 'Data Scientist', 'Advanced', false, 'Credit conversions across touchpoints with Markov and Shapley.', 'ChannelAttribution'),
    PJ(15, 'Price elasticity & optimization', 'Researcher', 'Advanced', false, 'Estimate demand curves and find the revenue-maximizing price.', 'regression'),
    PJ(16, 'Uplift / incrementality modeling', 'Data Scientist', 'Advanced', false, 'Target the persuadables, not the already-convinced.', 'uplift, tidymodels'),
    PJ(17, 'Customer lifetime value', 'Data Scientist', 'Advanced', false, 'Predict future customer value with BTYD models.', 'CLVTools, BTYDplus'),
    PJ(18, 'Recommender system', 'Data Scientist', 'Advanced', false, 'Collaborative filtering for product recommendations.', 'recommenderlab'),
    PJ(19, 'Time-series anomaly detection', 'Forecaster', 'Advanced', false, 'Flag unusual movements in a live metric as they happen.', 'fable, anomalize'),
    PJ(20, 'Credit risk scorecard + fairness audit', 'Statistician', 'Advanced', false, 'A scorecard model that survives a compliance review.', 'tidymodels, scorecard'),
    PJ(21, 'Causal impact of a campaign', 'Researcher', 'Advanced', false, 'Measure true lift with CausalImpact and difference-in-differences.', 'CausalImpact'),
    PJ(22, 'Review sentiment & topics (NLP)', 'Data Scientist', 'Advanced', false, 'Classify sentiment and surface themes from raw text.', 'tidytext, topicmodels'),
    PJ(23, 'Survival analysis: retention', 'Statistician', 'Advanced', false, 'Model time-to-churn with Kaplan-Meier and Cox.', 'survival, survminer'),
    PJ(24, 'Bayesian A/B testing framework', 'Statistician', 'Advanced', false, 'Probability-to-beat and expected-loss decisions, reusable.', 'brms'),
    PJ(25, 'Deploy an end-to-end ML service', 'R Developer', 'Capstone', false, 'Take a model from tidymodels to a monitored, served API.', 'vetiver, plumber'),
    PJ(26, 'LLM text classification at scale', 'Data Scientist', 'Advanced', false, 'Classify and tag thousands of documents with an LLM, evaluated honestly.', 'ellmer, tidymodels'),
    PJ(27, 'A RAG assistant over your own docs', 'R Developer', 'Capstone', false, 'Embed a document set and answer questions over it, served from R.', 'ellmer, duckdb, plumber'),
    PJ(28, 'Conformal prediction in production', 'Data Scientist', 'Capstone', false, 'Wrap any model in distribution-free prediction intervals with guaranteed coverage.', 'probably, tidymodels')
  ];

  // ---- free-lesson deep links to real published posts (Steps 1-2 + Step-3-6 Section 1) ----
  // Lessons whose title is already a key in RM.STOP_LINKS resolve automatically and are not repeated here.
  var links = {
    // Foundations S4 - importing
    'Read CSV and delimited files with readr':'/readr-read_csv-in-R.html',
    'Read Excel workbooks with readxl':'/readxl-read_excel-in-R.html',
    'Import SPSS, Stata and SAS with haven':'/haven-read_sav-in-R.html',
    'Pull JSON from APIs with jsonlite':'/jsonlite-fromJSON-in-R.html',
    'Scrape and parse HTML with rvest':'/Web-Scraping-in-R-with-rvest.html',
    'Fast columnar data with arrow and parquet':'/Apache-Arrow-in-R.html',
    // Foundations S5 - strings/dates
    'String manipulation with stringr':'/stringr-in-R.html',
    'Regular expressions from the ground up':'/stringr-regex-in-R.html',
    'Find, extract and replace with regex':'/R-Regex-stringr-Pattern-Matching.html',
    'Dates and times with lubridate':'/lubridate-in-R.html',
    'Working across time zones':'/lubridate-with_tz-in-R.html',
    'Ordered categories with forcats':'/R-Factors.html',
    // Foundations S6 - iteration
    'Why vectorization beats loops':'/Loops-vs-Vectorization-Exercises-in-R.html',
    'apply, lapply and sapply':'/base-apply-in-R.html',
    'Type-safe iteration with vapply':'/base-vapply-in-R.html',
    'The map family in purrr':'/purrr-map-Variants.html',
    'Iterate over two or more inputs (map2, pmap)':'/purrr-map2-in-R.html',
    'Side effects with walk':'/purrr-walk-in-R.html',
    'Resilient iteration with safely and possibly':'/purrr-safely-in-R.html',
    'Nested data and list-columns':'/tidyr-nest-in-R.html',
    // Foundations S7 - errors/debug
    'Recover with tryCatch':'/R-Conditions-System.html',
    'Step-through debugging with browser and traceback':'/R-Debugging.html',
    'Write error messages people understand':'/R-Common-Errors.html',
    // Foundations S8 - repro/toolchain
    'Organize work with RStudio Projects and here':'/R-Project-Structure.html',
    'Pin packages with renv':'/Reproducibility-Crisis.html',
    'Columnar data at scale with arrow':'/Apache-Arrow-in-R.html',
    // Analyst S1 - wrangle/tidy
    'Tidy data principles':'/Tidy-Data-in-R.html',
    // Analyst S2 - join/reshape
    'Every join type, visualized':'/dplyr-joins-in-R.html',
    'Non-equi and rolling joins with join_by':'/dplyr-join_by-in-R.html',
    // Analyst S5 - advanced ggplot2
    'Facets and small multiples':'/ggplot2-Facets.html',
    'Scales, guides and legends':'/ggplot2-Scales.html',
    'Custom themes and branding':'/ggplot2-Themes-in-R.html',
    'Annotations that explain':'/ggplot2-Labels-and-Annotations.html',
    'Compose plots with patchwork':'/patchwork-Package.html',
    'Label points with ggrepel':'/ggplot2-Labels-and-Annotations.html',
    // Analyst S6 - data.table
    'data.table syntax in one lesson':'/datatable-as-data-table-in-R.html',
    'Keys and lightning-fast joins':'/data-table-vs-dplyr.html',
    'dplyr vs data.table, head to head':'/data-table-vs-dplyr.html',
    'Wrangling millions of rows':'/data-table-Exercises.html',
    // Analyst S7 - tables
    'Polished tables with gt':'/gt-Package.html',
    'Formatting numbers and units':'/gt-Package.html',
    // Analyst S8 - interactive
    'Interactive charts with plotly':'/Combining-ggplot2-with-plotly.html',
    'Maps with leaflet':'/Interactive-Maps-in-R-with-leaflet.html',
    'Your first Shiny app':'/Shiny-Exercises-in-R.html',
    // Analyst S9 - communicate
    'Reports with Quarto and R Markdown':'/Statistical-Report-Writing-in-R.html',
    'Parameterized, repeatable reports':'/R-Markdown-Exercises.html',
    'Write the executive summary':'/Statistical-Report-Writing-in-R.html',
    'Tell a story with data':'/Reporting-Statistics-in-R.html',
    // Researcher S1 - probability (originals resolve via STOP_LINKS; extras here)
    'Point estimation and standard errors':'/Sampling-Distributions-in-R.html',
    // DS S1 - modeling foundations (originals resolve via STOP_LINKS)
    'Train, validation and test discipline':'/Model-Selection-in-R.html'
  };

  root.RM2 = { sections: sections, projects: projects, projectList: projectList, links: links };
})(window);
