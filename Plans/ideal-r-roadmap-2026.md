# The Ideal R Mastery Roadmap, 2026 Edition

> A design specification for the `/roadmap/` learning journey and the dedicated
> lesson pages behind it. This describes the *ideal* curriculum, the topics that
> belong in each step for maximum impact, and the full content each step page
> should carry. It is intentionally not limited to what currently exists on the
> site; anything missing is a page we will create.

---

## 1. Philosophy

**One integrated climb, six levels, six credentials.** A single ascending path
that takes a complete beginner to a professional R developer, where each level
earns the next and ends in a verifiable certificate. A learner can stop at any
level and walk away with a meaningful, defensible credential.

```
Level 1  New to R              ->  R Fundamentals
Level 2  Data Analyst          ->  Tidyverse Practitioner
Level 3  Data Scientist        ->  Machine Learning with R
Level 4  Time Series Specialist->  Time Series Forecasting
Level 5  Researcher            ->  Applied Statistics with R
Level 6  R Developer           ->  Advanced R
                                   + Capstone: Certified R Data Scientist
```

**Design principles**

1. **Modern-R-first, base-R-honest.** Teach the 2026 idiom (tidyverse, tidymodels,
   fable, Quarto, the native `|>` pipe, renv, targets, Positron/RStudio) while
   keeping a genuine base-R foundation so learners can read any codebase.
2. **Concept, then code, then consequence.** Every lesson explains *why*, shows
   runnable code, then shows the failure mode it prevents.
3. **Each level adds, never repeats.** Foundations are taught once at Level 1; later
   levels assume them. No re-teaching vectors in the ML track.
4. **Every lesson is a page; every stage is a chapter.** A lesson is a single
   focused, interactive tutorial page. A stage groups 3 to 6 lessons. A level
   groups 2 to 4 stages and ends in a certificate.
5. **Practice is first-class.** Every stage maps to an exercise hub; every level
   maps to a mastery quiz that gates the certificate; every level ends in a
   project brief.
6. **Honest, professional voice.** Descriptive titles, no hype. The credibility
   comes from depth and accuracy, not adjectives.

**Target outcome of the whole journey:** a learner who can take a problem from a
raw file to a validated result that holds up, communicate it reproducibly, and
engineer the code well enough to ship it.

---

## 2. What the roadmap page shows

The `/roadmap/` page renders this curriculum as a vertical climb:

- **Climb map (overview):** the six levels as an ascending trail to a gold summit
  (the capstone). Each waypoint = a level + the certificate it earns. Click to jump.
- **Level chapter:** number, persona, a one-line "what you become," duration, the
  certificate earned, and (when signed in) real progress for that level's track.
- **Stage box:** a descriptive title, a short "why this matters," the **list of
  lessons** (each linking to its dedicated page), a concrete payoff line, and a
  practice/tool/time chip row.
- **Checkpoint:** a milestone marker at the end of each level naming the credential.
- **Capstone:** the summit, awarded for holding all six credentials.

Each **stage** may also have its own landing page (a chapter overview that lists its
lessons with descriptions), and each **lesson** is a full interactive tutorial page
following the template in section 3.

---

## 3. The lesson page template (the full content of each step)

Every lesson page (a "step") follows one consistent structure so the experience is
predictable and complete. This is the contract for "the full content of each step."

1. **Title + one-sentence definition** (featured-snippet lead). What this is, in
   plain language, in one line.
2. **Why it matters / where it fits.** Two or three sentences: the problem it
   solves and where it sits in the journey (what precedes and follows it).
3. **Prerequisites.** A short list with links to the lessons that come before it.
4. **Core concept.** The mental model, explained with a small diagram where useful.
5. **Hands-on, progressively.** A sequence of short, runnable code blocks, each
   teaching one idea, building on the last, using a real built-in or supplied
   dataset. Output shown inline.
6. **The idiomatic 2026 way + the base-R equivalent** where they differ, so the
   learner can both write modern code and read legacy code.
7. **Common pitfalls and gotchas.** The mistakes people actually make, and the
   error messages they produce, with fixes.
8. **A small worked example / mini-case.** One realistic end-to-end snippet that
   ties the lesson together.
9. **Practice.** 3 to 8 exercises (links to the stage's exercise hub), with the
   "try it / reveal solution" pattern.
10. **Summary + cheat-sheet recap.** The 5 to 10 things to remember.
11. **Further reading + next lesson.** Internal links onward and to deeper FR pages.

Optional blocks where relevant: a **decision guide** ("which function/test/model do
I use?"), an **interactive tool** embed, a **performance note**, and a **FAQ**
(People-Also-Ask).

---

## 4. The six levels in detail

Notation per stage: each lesson lists its **purpose** and the **key subtopics** the
page should cover. Lessons marked **[new]** are not yet on the site (to be created);
unmarked lessons map to existing or near-existing pages.

---

### LEVEL 1 - R Programming Foundations

- **Persona:** New to R
- **You become:** someone who can read and write idiomatic base R with confidence.
- **Prerequisites:** none.
- **Duration:** ~3 to 4 weeks.
- **Certificate:** R Fundamentals.
- **Skills proven:** base R, data structures, control flow, functions and scope,
  iteration, reading/writing data, debugging basics.

#### Stage 1.1 - Set up and orient

1. **Install R and an IDE for 2026.** Purpose: get a working modern environment.
   Covers: installing R; choosing an IDE (RStudio vs Positron, the new data-science
   IDE); the console vs the source pane; running code; the working directory; RStudio
   projects. **[new: Positron coverage]**
2. **Packages and the ecosystem.** Purpose: install and load code others wrote.
   Covers: CRAN, Bioconductor, GitHub; `install.packages()`, `library()`, `pak`/`renv`
   preview; namespaces and `::`; where packages live (`.libPaths`); CRAN Task Views.
3. **Getting help and reading documentation.** Purpose: become self-sufficient.
   Covers: `?`, `??`, `help()`, vignettes, reading a help page, reprex, where to ask,
   reading error and warning messages.

#### Stage 1.2 - Values and vectors

4. **R syntax and assignment.** Covers: expressions, `<-` vs `=`, the native `|>`
   pipe, comments, code style (tidyverse style guide), operators overview.
5. **Atomic data types and coercion.** Covers: logical, integer, double, character,
   complex, raw; implicit and explicit coercion; `typeof` vs `class`; `NA`, `NULL`,
   `NaN`, `Inf`.
6. **Vectors and vectorization.** Covers: creating vectors, names, recycling,
   vectorized arithmetic, why loops are often unnecessary, `seq`/`rep`.

#### Stage 1.3 - Data structures

7. **Lists.** Covers: heterogeneous data, nesting, `[ ]` vs `[[ ]]` vs `$`, `str()`,
   when to use a list vs a vector.
8. **Matrices and arrays.** Covers: construction, `dim`, row/column ops, `apply`,
   linear-algebra basics, when a matrix beats a data frame.
9. **Factors.** Covers: categorical data, levels and labels, ordered factors,
   the classic factor gotchas, `forcats` preview.
10. **Data frames and tibbles.** Covers: the rectangular workhorse; data frame vs
    tibble differences; creating, inspecting (`head`, `str`, `glimpse`), and basic
    column access.

#### Stage 1.4 - Logic, flow, and functions

11. **Operators: arithmetic, relational, logical.** Covers: precedence, `&` vs `&&`,
    `%in%`, `%%`/`%/%`, comparison traps with floats and `NA`.
12. **Control flow.** Covers: `if`/`else`, `for`, `while`, `repeat`, `break`/`next`,
    `switch`, vectorized `ifelse`/`dplyr::case_when`, when to avoid explicit loops.
13. **Writing functions.** Covers: arguments and defaults, `return` and invisible
    returns, `...`, the pipe-friendly function shape, documenting intent.
14. **Scope and environments (gentle).** Covers: lexical scoping, local vs global,
    `<<-` and why to avoid it, a first look at environments (deepened in Level 6).

#### Stage 1.5 - Subset, iterate, persist

15. **Subsetting and indexing.** Covers: positional, logical, and name indexing;
    `[`, `[[`, `$`; subsetting vectors, lists, matrices, and data frames; negative
    indexing; replacement.
16. **Iteration: apply family and intro to purrr.** Covers: `lapply`/`sapply`/
    `vapply`/`mapply`; `purrr::map` and friends; choosing iteration over copy-paste.
17. **Reading and writing data.** Covers: `readr` (`read_csv`), `readxl`, `.rds`,
    `saveRDS`/`readRDS`, paths and `here`, encoding, common import errors.
18. **Strings and dates, the essentials.** Covers: `paste`/`sprintf`/`glue`; basic
    `stringr`; `Sys.Date`, `Sys.time`, parsing with `lubridate`, formatting.

#### Stage 1.6 - Be unstuck

19. **Errors, warnings, and debugging basics.** Covers: reading a traceback;
    `browser`, `debug`, RStudio breakpoints; the 50 most common R errors and what
    they mean; `tryCatch` preview; warnings vs errors vs messages.

**Level 1 project brief:** load a messy CSV, clean and summarise it with base R and
readr, write a short script that produces three summary numbers and one plot, and
structure it as a project. **Mastery quiz:** R Fundamentals (concept + code).

---

### LEVEL 2 - Data Analysis with the Tidyverse

- **Persona:** Data Analyst
- **You become:** the person who turns raw data into a clear, defensible analysis
  and the chart that proves it.
- **Prerequisites:** Level 1.
- **Duration:** ~4 to 5 weeks.
- **Certificate:** Tidyverse Practitioner.
- **Skills proven:** import, dplyr, tidyr, stringr, lubridate, forcats, cleaning,
  ggplot2, EDA, communication.

#### Stage 2.1 - Get the data in

1. **Importing data from anywhere.** Covers: `readr` deeply (col types, locales,
   problems); Excel (`readxl`, `openxlsx`); Google Sheets (`googlesheets4`);
   delimited/fixed-width; `arrow`/`vroom` for big files; first look at `janitor`.
2. **Databases and APIs.** Covers: `DBI` + `dbplyr` (write dplyr, run SQL); `duckdb`
   for local analytics; REST APIs with `httr2` and `jsonlite`; pagination and auth. **[new]**
3. **Web scraping basics.** Covers: `rvest` for HTML tables and nodes; CSS selectors;
   politeness, robots, and rate limiting; when to scrape vs use an API.

#### Stage 2.2 - Transform with dplyr

4. **The core dplyr verbs.** Covers: `filter`, `select`, `mutate`, `arrange`,
   `summarise`, `group_by`/`ungroup`, the pipe, `relocate`, `rename`.
5. **Grouped and column-wise operations.** Covers: `group_by` + `summarise`,
   `across()`, `.by`, window functions (`lag`, `lead`, `cumsum`, ranking), `rowwise`.
6. **Combining tables: joins and binds.** Covers: the join family
   (`left/inner/full/anti/semi`), `join_by`, keys and many-to-many, `bind_rows`/
   `bind_cols`, set operations, `coalesce`.
7. **Conditional and helper logic.** Covers: `case_when`, `if_else`, `na_if`,
   `recode`, `count`, `distinct`, `slice_*`, `pull`.

#### Stage 2.3 - Tidy, clean, and type

8. **Tidy data and reshaping.** Covers: the tidy-data principles; `pivot_longer`/
   `pivot_wider`; `separate`/`unite`/`separate_wider_*`; `nest`/`unnest`; `complete`,
   `fill`, `expand`.
9. **Strings with stringr and regex.** Covers: detect/extract/replace/split; regex
   from scratch; `str_glue`; common text-cleaning recipes.
10. **Dates and times with lubridate.** Covers: parsing, components, arithmetic,
    durations vs periods vs intervals, time zones, rounding, recurring dates.
11. **Factors with forcats.** Covers: reorder for plots, lump rare levels, recode,
    explicit NA, ordered factors in models.
12. **Data cleaning and validation.** Covers: missing-value strategies (detect,
    count, impute with `tidyr`/`recipes`); outliers; deduplication; type fixing;
    `janitor`; data validation (`pointblank`/`validate`). **[new: validation]**

#### Stage 2.4 - See it and tell it

13. **ggplot2: the grammar of graphics.** Covers: data + aesthetics + geoms +
    scales + facets + coords + themes; layering; the mental model that replaces
    chart recipes.
14. **The chart catalogue.** Covers: distributions, comparisons, relationships,
    composition, time, and ranking charts; the 50-visualization gallery as a
    reference; choosing the right chart.
15. **Customisation and polish.** Covers: scales and colour (viridis, palettes,
    accessibility), themes and `theme()`, annotations, labels, faceting strategies,
    `patchwork` for composition, saving at the right size/DPI.
16. **Exploratory data analysis, a workflow.** Covers: a repeatable EDA process;
    `skimr`, `GGally`, `DataExplorer`; univariate then bivariate then multivariate;
    correlation; spotting the outlier that changes conclusions.
17. **Communicating results.** Covers: presentation tables with `gt`/`gtExtras`;
    a first Quarto report; figures and tables that travel; alt text and captions. **[new: gt/Quarto intro]**

**Level 2 project brief:** take a real public dataset from raw import to a one-page
Quarto report with three findings, two polished charts, and one summary table.
**Mastery quizzes:** dplyr, tidyr, ggplot2.

---

### LEVEL 3 - Predictive Modelling and Machine Learning

- **Persona:** Data Scientist
- **You become:** someone who builds, tunes, and evaluates models and judges
  honestly when they will generalise.
- **Prerequisites:** Levels 1 to 2.
- **Duration:** ~6 to 8 weeks.
- **Certificate:** Machine Learning with R.
- **Skills proven:** the modelling workflow, regression, feature engineering,
  resampling, regularization, trees/ensembles, tuning, classification metrics,
  unsupervised learning, model interpretation.

#### Stage 3.1 - The modelling workflow

1. **How modern ML in R is organised.** Covers: supervised vs unsupervised;
   train/validation/test; the bias-variance tradeoff; the **tidymodels** stack
   (`rsample`, `recipes`, `parsnip`, `workflows`, `yardstick`, `tune`) and where
   `caret` still fits. **[new: tidymodels overview]**
2. **Your first end-to-end model.** Covers: split, recipe, model spec, workflow,
   fit, predict, evaluate; the minimal pipeline you will reuse everywhere. **[new]**

#### Stage 3.2 - Regression, properly

3. **Linear regression.** Covers: fitting `lm`, interpretation, `broom` tidiers,
   prediction and intervals, categorical predictors, interactions.
4. **Model diagnostics and assumptions.** Covers: residual analysis, leverage and
   influence, multicollinearity (VIF), heteroscedasticity, the diagnostic plots and
   what each one is telling you.
5. **Logistic regression and classification basics.** Covers: the logit, odds
   ratios, fitting and interpreting, probability vs class, thresholds.
6. **Generalized linear models.** Covers: the GLM family, Poisson and negative
   binomial for counts, link functions, when to leave OLS behind. **[new: GLM hub page]**

#### Stage 3.3 - Features and validation

7. **Feature engineering with recipes.** Covers: preprocessing steps, encoding
   categoricals, scaling/normalising, imputation, interactions, splines, the
   train-on-train-only rule.
8. **Resampling and the leakage trap.** Covers: k-fold and repeated CV, bootstrap,
   train/validation/test, time-aware splits, the most common ways people leak the
   target and inflate their accuracy.
9. **Feature selection and importance.** Covers: filter/wrapper/embedded methods,
   variable importance, recursive feature elimination, stability.

#### Stage 3.4 - Models that generalise

10. **Regularization: ridge, lasso, elastic net.** Covers: the penalty intuition,
    `glmnet`, choosing lambda, when each helps, coefficient paths.
11. **Tree-based models.** Covers: decision trees; random forests; gradient boosting
    with `xgboost` and `lightgbm`; how trees handle interactions and nonlinearity. **[new: dedicated RF/XGBoost tutorials]**
12. **Tuning hyperparameters.** Covers: grid vs random vs Bayesian tuning with
    `tune`/`dials`; racing methods (`finetune`); avoiding tuning on the test set. **[new]**
13. **Classification metrics and imbalance.** Covers: confusion matrix, accuracy's
    failure modes, precision/recall/F1, ROC and PR curves, AUC, calibration,
    thresholds, resampling for imbalance (`themis`).

#### Stage 3.5 - Structure without labels

14. **Dimensionality reduction.** Covers: PCA from `prcomp`, interpreting loadings
    and scores, scree plots, `broom` tidying, t-SNE and UMAP for visualization.
15. **Clustering.** Covers: k-means, hierarchical, DBSCAN; choosing k; distance
    metrics; cluster validation; interpreting and naming clusters.

#### Stage 3.6 - Trust and explain

16. **Model interpretation (XAI).** Covers: global vs local explanations; variable
    importance (`vip`); partial dependence and ICE; SHAP values (`fastshap`/`DALEX`);
    communicating a model to non-technical stakeholders. **[new]**
17. **A full ML case study.** Covers: one realistic problem carried end to end:
    framing, EDA, recipe, several models, tuning, honest evaluation, interpretation,
    and a written conclusion. **[new]**

**Level 3 project brief:** a complete supervised-learning project on a chosen
dataset, delivered as a reproducible Quarto notebook with a held-out test result
and an interpretation section. **Mastery quizzes:** regression, machine learning.

---

### LEVEL 4 - Time Series Analysis and Forecasting

- **Persona:** Time Series Specialist
- **You become:** the analyst who forecasts what comes next with intervals you can
  stand behind.
- **Prerequisites:** Levels 1 to 3 (regression, resampling).
- **Duration:** ~3 to 4 weeks.
- **Certificate:** Time Series Forecasting.
- **Skills proven:** time-series data handling, decomposition, ETS, ARIMA, dynamic
  regression, ML forecasting, backtesting.

#### Stage 4.1 - Temporal data and exploration

1. **Time series data structures.** Covers: `ts`, the modern `tsibble`, `zoo`/`xts`;
   index and key; regular vs irregular series; gaps and duplicates. **[new: tsibble]**
2. **Time series EDA.** Covers: time plots, seasonal and subseries plots (`feasts`),
   lag plots, autocorrelation (ACF/PACF), STL decomposition, calendar effects. **[new]**
3. **Stationarity and transformations.** Covers: what stationarity is and why it
   matters; unit-root tests (ADF, KPSS); differencing; Box-Cox; log transforms. **[new]**

#### Stage 4.2 - Classical forecasting

4. **Benchmarks and exponential smoothing.** Covers: naive/seasonal-naive/drift as
   baselines; simple, Holt, and Holt-Winters; the ETS framework via `fable`. **[new: fable]**
5. **ARIMA models.** Covers: AR, MA, ARIMA, seasonal ARIMA; identification from
   ACF/PACF; `auto_arima` and when to override it; residual diagnostics.
6. **Dynamic regression and special days.** Covers: regression with ARIMA errors,
   lagged predictors, Fourier terms for multiple seasonality, holiday/event effects. **[new]**

#### Stage 4.3 - Modern and ML forecasting

7. **Machine-learning forecasting.** Covers: `prophet`; the `modeltime`/tidymodels
   approach; feature-based forecasting; global models across many series. **[new]**
8. **Hierarchical and grouped forecasting.** Covers: reconciliation across levels,
   bottom-up/top-down/optimal, forecasting many related series at scale. **[new]**

#### Stage 4.4 - Evaluate honestly

9. **Backtesting and accuracy.** Covers: time-series cross-validation (rolling
   origin), accuracy measures (MAE, RMSE, MAPE, MASE), forecast-on-forecast traps,
   prediction intervals and their coverage. **[new]**

**Level 4 project brief:** forecast a real seasonal series 12 periods ahead with at
least two methods, backtest them, and report the better one with calibrated
intervals. **Mastery quiz:** time series.

---

### LEVEL 5 - Statistical Inference and Reporting

- **Persona:** Researcher
- **You become:** the analyst whose results survive peer review.
- **Prerequisites:** Levels 1 to 3 (probability foundations, regression).
- **Duration:** ~6 to 8 weeks.
- **Certificate:** Applied Statistics with R.
- **Skills proven:** probability, estimation, hypothesis testing, ANOVA and design,
  regression for inference, multiplicity, Bayesian basics, reproducible reporting.

#### Stage 5.1 - Probability and estimation

1. **Probability and random variables.** Covers: sample spaces and axioms; discrete
   and continuous distributions; the `d`/`p`/`q`/`r` function family; expectation and
   variance; simulation and Monte Carlo.
2. **The key distributions.** Covers: normal, t, F, chi-squared, binomial, Poisson;
   when each arises; visualizing and sampling from them.
3. **Sampling distributions and the CLT.** Covers: sampling distribution of a
   statistic, the central limit theorem by simulation, standard error.
4. **Estimation and confidence intervals.** Covers: point vs interval estimation;
   CIs for means/proportions/differences; the bootstrap; MLE and method of moments;
   what a confidence interval does and does not mean.

#### Stage 5.2 - Testing, done right

5. **The hypothesis-testing framework.** Covers: null and alternative, test
   statistics, p-values and their controversy, type I/II errors, power, and effect
   size as a first-class quantity.
6. **Choosing the right test.** Covers: a decision guide by data type and design;
   assumptions and how to check them; parametric vs nonparametric tradeoffs. **[decision tool]**
7. **Common tests.** Covers: one/two-sample and paired t-tests; proportion and
   chi-square tests (independence, goodness of fit, Fisher's exact); correlation
   tests.
8. **Nonparametric methods.** Covers: Wilcoxon/Mann-Whitney, Kruskal-Wallis,
   permutation tests, when ranks beat means.

#### Stage 5.3 - Designed experiments and effects

9. **ANOVA.** Covers: one-way, two-way, and three-way ANOVA; assumptions; the F
   test; effect sizes (eta-squared).
10. **Beyond basic ANOVA.** Covers: repeated-measures, mixed ANOVA, MANOVA,
    factorial designs, interaction effects, post-hoc tests and their corrections.
11. **Power and sample-size planning.** Covers: a priori power analysis; planning
    a study; `pwr` and simulation-based power; the cost of underpowered designs.

#### Stage 5.4 - Models for inference

12. **Regression for inference.** Covers: interpretation vs prediction emphasis;
    standardized vs unstandardized coefficients; assumptions and remedies; model
    comparison (nested models, likelihood-ratio tests, AIC/BIC).
13. **Generalized and mixed models.** Covers: GLMs for non-normal outcomes;
    mixed-effects models (`lme4`/`glmmTMB`) for grouped/repeated data; random
    intercepts and slopes. **[new]**
14. **Multiplicity and the reproducibility crisis.** Covers: multiple-comparison
    corrections (Bonferroni, Holm, FDR); p-hacking and the garden of forking paths;
    pre-registration; what went wrong and how to not repeat it.

#### Stage 5.5 - Bayesian and reporting

15. **A first Bayesian analysis.** Covers: priors, likelihood, posteriors; credible
    vs confidence intervals; `rstanarm`/`brms` for regression; interpreting posterior
    draws; when Bayesian helps. **[new]**
16. **Reproducible reporting.** Covers: Quarto for papers and dashboards; regression
    and summary tables (`gtsummary`, `modelsummary`); APA/journal formatting;
    communicating uncertainty honestly; `renv` and `targets` for a reproducible
    pipeline. **[new: targets]**

**Level 5 project brief:** design and report a small study (real or simulated):
state hypotheses, choose and justify the test, run it, report effect sizes with
intervals, and produce a reproducible Quarto write-up. **Mastery quizzes:**
hypothesis testing, regression.

---

### LEVEL 6 - Advanced R and Software Engineering

- **Persona:** R Developer
- **You become:** someone who reads the source of the tools everyone else imports,
  and ships production-grade R.
- **Prerequisites:** Levels 1 to 2 (and the maturity of having built real analyses).
- **Duration:** ~7 to 9 weeks.
- **Certificate:** Advanced R.
- **Skills proven:** functional programming, object systems, language internals,
  performance, parallelism, package development, robust code, deployment.

#### Stage 6.1 - Functional programming

1. **Functions as values.** Covers: first-class and anonymous functions (the `\(x)`
   syntax), closures, function factories, the call stack.
2. **The purrr toolkit, deeply.** Covers: `map`/`map2`/`pmap` and typed variants;
   `reduce`/`accumulate`; `walk`; list-columns and rectangling; error handling with
   `safely`/`possibly`.
3. **Function operators and composition.** Covers: functions that take and return
   functions; `compose`, `partial`, memoization; building small DSLs.

#### Stage 6.2 - Object systems

4. **S3.** Covers: classes and generics, method dispatch, inheritance, writing
   `print`/`summary` methods, the rules S3 actually follows.
5. **S4.** Covers: formal classes, slots, validity, generics and multiple dispatch,
   when the rigour is worth it.
6. **R6 and reference semantics.** Covers: mutable objects, encapsulation, active
   bindings, when state belongs in R6, and the new **S7** system. **[new: S7]**
7. **Operator overloading and the Ops group.** Covers: defining `+`, `[`, format
   methods; making your class feel native.

#### Stage 6.3 - Language internals

8. **Names, values, and copy-on-modify.** Covers: how R binds names to objects,
   when copies happen, `tracemem`, reference counting, modify-in-place.
9. **Environments and scoping.** Covers: environments as data structures, lexical
   scoping in depth, dynamic scoping, `<<-`, function environments.
10. **Lazy evaluation and metaprogramming.** Covers: promises and forcing;
    quasiquotation; `rlang` and tidy evaluation; writing functions that take bare
    column names; `quote`/`eval`/`substitute`. **[new: metaprogramming]**

#### Stage 6.4 - Performance and scale

11. **Measuring and improving performance.** Covers: profiling (`profvis`),
    benchmarking (`bench`), the usual bottlenecks, vectorization, preallocation,
    avoiding accidental copies.
12. **Faster R: data.table, Rcpp, arrow.** Covers: `data.table` syntax and speed;
    `Rcpp`/C++ for hot loops; `arrow`/`duckdb` for larger-than-memory data. **[new]**
13. **Parallel and concurrent R.** Covers: the `future` ecosystem (`furrr`),
    `parallel`, chunking, when parallelism helps and when it hurts.

#### Stage 6.5 - Engineering and shipping

14. **Robust code and the conditions system.** Covers: errors/warnings/messages;
    `tryCatch`/`withCallingHandlers`; custom condition classes; defensive
    programming; logging.
15. **Package development.** Covers: package structure; `devtools`/`usethis`;
    documentation with `roxygen2`; testing with `testthat` (and `testthat` 3e
    snapshots); `pkgdown`; preparing for CRAN. **[new]**
16. **Tooling, reproducibility, and deployment.** Covers: Git and GitHub for R;
    continuous integration with GitHub Actions; `renv` for environments; Docker for
    R; exposing models as APIs with `plumber`; building apps with Shiny. **[new: deploy]**

**Level 6 project brief:** build, document, test, and publish a small R package
(with at least one S3 or R6 class, full roxygen docs, a testthat suite, and a
pkgdown site). **Mastery quiz:** Advanced R.

---

## 5. Cross-cutting design

- **Datasets.** Prefer built-in datasets (`mtcars`, `iris`, `palmerpenguins`,
  `nycflights13`, `gapminder`, `txhousing`) plus a few supplied CSVs, so every lesson
  runs in the browser with no setup.
- **Exercise hubs.** Each stage maps to one exercise hub; each level to a mastery
  quiz that gates its certificate at an 80 percent threshold.
- **Tools.** Each stage references one interactive tool (e.g. dplyr verb picker,
  chart chooser, which-test guide, regression diagnostics, forecast horizon) that
  reinforces the concept.
- **Projects.** Each level ends in a project brief; the six projects together form a
  portfolio. The capstone is awarded for completing all six certificate tracks.
- **Modern tooling thread.** Quarto, `renv`, `targets`, the native pipe, Positron,
  and tidymodels/fable appear from the level where they first add value and are
  reused thereafter, so learners graduate fluent in the 2026 stack.

## 6. Page-build implications (for our pipeline)

- Each **lesson** above becomes a `posts/<slug>.md` tutorial page built through the
  existing pipeline, following the section-3 template.
- Each **stage** can optionally get a chapter landing page that lists its lessons.
- The **roadmap** (`www/roadmap-page.js` `LEVELS`) is the index; its `stops` should
  point at the lesson pages as they are created, and the `hub`/`tool` chips at the
  matching exercise hub and tool.
- **[new]** markers above are the build backlog: roughly 35 to 45 net-new pages
  (heaviest in ML, time series, advanced R, and the modern-tooling thread). A
  sensible build order is Level 1 to 2 gaps first (they unblock everyone), then the
  ML and time-series tracks, then advanced R, with the modern-tooling thread woven
  in throughout.

---

*This document is a design spec, not a published page. It defines the ideal target;
the live roadmap and lesson pages are built toward it incrementally.*
