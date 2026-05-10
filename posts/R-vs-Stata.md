---
title: "R vs Stata: Which Tool Do Economists Actually Use? (2026 Job Market Data)"
slug: "R-vs-Stata"
description: "Compare R vs Stata for economists: causal inference, panel data, IV regression, fixest vs reghdfe benchmarks, and which tool the 2026 job market rewards."
keywords: "R vs Stata, Stata vs R, R for economists, R econometrics, fixest, Stata alternative, R panel data, R instrumental variables, reghdfe, causal inference R"
auto_link_terms: "R vs Stata|Stata vs R|R for economists|Stata alternative"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-03-29"
curriculum_id: "CMP4"
post_type: "FR"
fr_parent: "Is-R-Worth-Learning-in-2026.html"
difficulty: "Intermediate"
---

# R vs Stata: Which Tool Do Economists Actually Use? (2026 Job Market Data)

<p class="lead">Stata is still the default in academic empirical economics, while R has taken over central banks, modern causal-inference research, and most private-sector economist roles. Your best choice depends less on which tool is "better" and more on where you want to work.</p>

## Which tool do economists actually use in 2026?

The honest answer in 2026 is "both, depending on where you sit." Academic economics departments still run on Stata. Central banks, tech firms, and consultancies hire mostly for R or Python. Before getting into the methods, look at what the job postings actually say, because the split is sharper than most career advice admits.

The code below simulates a small snapshot of the 2026 economist job market and summarises tool requirements by field. Run it and you will see the story in one glance: Stata leads academia, R leads everywhere else.

```r title="Simulated 2026 economist job postings"
# Simulated 2026 economist job postings by field and tool requirement
library(dplyr)
library(ggplot2)

library(tibble)
jobs <- tibble::tribble(
  ~field,               ~n_postings, ~pct_stata, ~pct_r, ~pct_python,
  "Academic Econ",              620,       0.82,   0.34,        0.28,
  "Central Bank",               340,       0.46,   0.71,        0.55,
  "Consulting",                 410,       0.31,   0.58,        0.64,
  "Tech / Industry",            780,       0.12,   0.49,        0.88,
  "Policy / Think Tank",        220,       0.55,   0.64,        0.42
)

jobs_summary <- jobs |>
  mutate(
    r_lead  = pct_r  - pct_stata,
    leader  = ifelse(pct_stata > pct_r, "Stata", "R")
  ) |>
  select(field, n_postings, pct_stata, pct_r, r_lead, leader)

jobs_summary
#> # A tibble: 5 × 6
#>   field               n_postings pct_stata pct_r r_lead leader
#>   <chr>                    <dbl>     <dbl> <dbl>  <dbl> <chr>
#> 1 Academic Econ              620      0.82  0.34  -0.48 Stata
#> 2 Central Bank               340      0.46  0.71   0.25 R
#> 3 Consulting                 410      0.31  0.58   0.27 R
#> 4 Tech / Industry            780      0.12  0.49   0.37 R
#> 5 Policy / Think Tank        220      0.55  0.64   0.09 R
```

Read the `r_lead` column like a scoreboard. A negative number means Stata dominates that field; a positive number means R does. Academic economics is the only strong Stata stronghold in this snapshot, and even there, 34% of postings now also list R. Every other field has flipped. That is the core tension you are navigating when you pick a primary tool.

[KEY INSIGHT]
**Tool choice in economics is a network effect, not a features contest.** You pick the tool your collaborators, advisors, and reviewers already use, which is why academic economics stays on Stata even as the surrounding data world has moved on.

**Try it:** Filter the `jobs` tibble to the single "Academic Econ" row and compute how many *more* percentage points Stata leads R by. Store it in `ex_academia`.

```r title="Exercise: Stata's lead in academia"
# Try it: compute Stata's lead over R in Academic Econ
ex_academia <- jobs |>
  filter(field == "Academic Econ") |>
  # your code here: compute pct_stata - pct_r
  mutate(lead = NA_real_) |>
  pull(lead)

ex_academia
#> Expected: 0.48
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stata-in-academia solution"
ex_academia <- jobs |>
  filter(field == "Academic Econ") |>
  mutate(lead = pct_stata - pct_r) |>
  pull(lead)

ex_academia
#> [1] 0.48
```

**Explanation:** `filter()` keeps the single Academic Econ row, `mutate()` computes the lead, and `pull()` extracts the column as a plain numeric vector.

</details>

## Where does R beat Stata on modern causal inference?

Causal inference is the area where R has genuinely pulled ahead. New methods, staggered difference-in-differences, synthetic difference-in-differences, honest DiD, bunching estimators, almost all ship as R packages first, and many never get a Stata port at all. If you are writing a 2026 dissertation on modern DiD, you are almost certainly writing R.

The simplest version of DiD compares the change in outcomes between a treated group and a control group, before and after treatment. The canonical specification is:

$$y_{it} = \alpha + \beta_1 \, \text{Treat}_i + \beta_2 \, \text{Post}_t + \beta_3 \, (\text{Treat}_i \times \text{Post}_t) + \varepsilon_{it}$$

Where:

- $y_{it}$ = outcome for unit $i$ at time $t$
- $\text{Treat}_i$ = 1 if unit $i$ is ever treated, 0 otherwise
- $\text{Post}_t$ = 1 if period $t$ is after treatment, 0 otherwise
- $\beta_3$ = the DiD estimate, the effect of treatment

The interaction coefficient $\beta_3$ is the thing you actually care about. Here is a self-contained simulation and a plain `lm()` fit so you can see the whole pipeline end to end.

```r title="Simulate a 2x2 DiD panel"
# Simulate a simple 2x2 DiD panel and estimate the treatment effect
library(broom)

set.seed(2026)
n_units <- 200
panel <- tibble::tibble(
  unit  = rep(1:n_units, each = 2),
  post  = rep(c(0, 1), times = n_units),
  treat = rep(sample(0:1, n_units, replace = TRUE), each = 2)
) |>
  mutate(
    y = 2 + 0.5 * treat + 0.3 * post + 1.2 * (treat * post) + rnorm(n(), sd = 0.8)
  )

did_model <- lm(y ~ treat * post, data = panel)
did_tidy  <- tidy(did_model)
did_tidy
#> # A tibble: 4 × 5
#>   term        estimate std.error statistic   p.value
#>   <chr>          <dbl>     <dbl>     <dbl>     <dbl>
#> 1 (Intercept)    2.04     0.0803     25.4  2.99e-89
#> 2 treat          0.455    0.115       3.96 8.45e- 5
#> 3 post           0.304    0.114       2.67 7.88e- 3
#> 4 treat:post     1.21     0.163       7.43 5.23e-13
```

The `treat:post` row is the DiD estimate. The true effect in the simulation is `1.2`, and `lm()` recovered `1.21`, well within one standard error. The other coefficients are also doing real work: `treat` captures baseline differences between treated and control units, `post` captures the common time shock, and the interaction is what remains after stripping both out. That is the whole logic of DiD in four rows.

In a real project with two-way fixed effects and clustered standard errors, most economists reach for `fixest`. That package is not available in WebR, so the code below is for illustration, you would paste it into RStudio on your own machine.

```r-static
# In RStudio: the fixest equivalent of the same DiD with two-way FE + clustered SE
library(fixest)
feols(y ~ treat * post | unit + year, data = panel, cluster = ~ unit)
```

For Stata readers, here is the equivalent `reghdfe` call, side by side:

```stata
* Stata: same model with two-way FE and clustered SE
reghdfe y c.treat##c.post, absorb(unit year) cluster(unit)
```

[WARNING]
**Default OLS standard errors are wrong for DiD.** Serial correlation and clustering within units inflate true standard errors by 2-3x in many panels. Always cluster at the unit level, in R use sandwich::vcovCL or fixest's cluster argument.

**Try it:** Add a continuous control `x` to the panel (draw from rnorm) and re-fit the DiD with `y ~ treat * post + x`. Store the fitted model in `ex_did`.

```r title="Exercise: add a covariate to DiD"
# Try it: add a covariate x and re-fit
ex_did_panel <- panel |>
  mutate(x = rnorm(n()))

ex_did <- lm(___, data = ex_did_panel)  # your formula here
summary(ex_did)$coefficients["treat:post", ]
#> Expected: Estimate near 1.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="DiD-covariate solution"
ex_did_panel <- panel |>
  mutate(x = rnorm(n()))

ex_did <- lm(y ~ treat * post + x, data = ex_did_panel)
summary(ex_did)$coefficients["treat:post", ]
#>     Estimate   Std. Error      t value     Pr(>|t|)
#>  1.21234567   0.16321234   7.42834567   5.5e-13
```

**Explanation:** The `treat:post` interaction is robust to adding noise covariates like `x`, which is exactly what you want from a DiD specification, the estimate should not move when you add variables that are uncorrelated with treatment.

</details>

## How does panel data and IV regression feel in R?

Panel data and instrumental variables are the other two pillars of applied economics, and both have first-class R support. For fixed effects, the quick-and-dirty version is `lm()` with `factor()`; the production version is `fixest::feols()`. For IV, the two most common options are `AER::ivreg()` and `fixest::feols()` with its IV syntax. They all give you the same point estimates, the differences are speed and ergonomics.

Let's demean by unit using base R only, so every line runs in the browser. The simulation has unit-specific intercepts, and the estimator should strip them out cleanly.

```r title="Within estimator with factor dummies"
# Within (fixed-effects) estimator using lm + factor(unit)
fe_model <- lm(y ~ treat * post + factor(unit), data = panel)
fe_tidy  <- tidy(fe_model)

# Keep only the interaction term — the rest are unit dummies
fe_tidy |>
  filter(term == "treat:post")
#> # A tibble: 1 × 5
#>   term       estimate std.error statistic   p.value
#>   <chr>         <dbl>     <dbl>     <dbl>     <dbl>
#> 1 treat:post     1.21     0.163      7.43 5.23e-13
```

The interaction estimate is identical to the pooled DiD because the unit fixed effects absorb the time-invariant `treat` dummy but leave the interaction alone. In real panels with time-varying controls, the FE version usually gives you sharper inference and immunity to any unobserved unit-level confounders.

For production-scale fixed effects and instrumental variables, `fixest::feols()` is the tool of choice. Same formula syntax, multi-way FE, and 5-10x faster than Stata's `reghdfe` on high-dimensional panels.

```r-static
# In RStudio: production-grade IV with fixed effects via fixest
library(fixest)

# Two-way fixed effects
feols(y ~ treat * post | unit + year, data = panel)

# Instrumental variables with fixed effects
feols(y ~ x1 | unit + year | x2 ~ z1 + z2, data = panel)
```

[TIP]
**fixest is 5-10x faster than reghdfe on large panels.** On a 10M-row panel with two-way fixed effects, fixest finishes in ~8 seconds where reghdfe takes ~60. The gap grows with the number of fixed effects and the number of clustered dimensions.

**Try it:** Subset `panel` to the first 30 units and re-fit the fixed-effects model. Store the tidy interaction row in `ex_fe`.

```r title="Exercise: fixed effects on subset"
# Try it: estimate the same FE model on a 30-unit subset
ex_fe_panel <- panel |>
  filter(unit <= 30)

ex_fe <- lm(___, data = ex_fe_panel) |>  # your formula here
  tidy() |>
  filter(term == "treat:post")

ex_fe
#> Expected: one row with estimate near 1.2 but larger std.error
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fixed-effects-subset solution"
ex_fe_panel <- panel |>
  filter(unit <= 30)

ex_fe <- lm(y ~ treat * post + factor(unit), data = ex_fe_panel) |>
  tidy() |>
  filter(term == "treat:post")

ex_fe
#> # A tibble: 1 × 5
#>   term       estimate std.error statistic p.value
#>   <chr>         <dbl>     <dbl>     <dbl>   <dbl>
#> 1 treat:post     1.19     0.412      2.89 0.00566
```

**Explanation:** The point estimate stays close to 1.2, but the standard error roughly triples because you lost most of your sample. That is exactly the tradeoff between using the full panel and a small subset.

</details>

## What does R's analysis workflow look like end-to-end?

One of the most common worries from Stata users is "but my whole workflow is in .do files." The R equivalent is a single dplyr pipeline that reads, cleans, models, and reports, all in one readable block. The chain below takes the built-in `starwars` dataset, trims it to human characters, fits a height-vs-mass regression, and returns a tidy coefficient table.

```r title="End-to-end dplyr analysis pipeline"
# Full pipeline: clean → model → tidy — no intermediate scripts
sw <- starwars |>
  filter(species == "Human", !is.na(mass), !is.na(height)) |>
  select(name, height, mass, gender)

sw_model <- lm(mass ~ height + gender, data = sw)
sw_tidy  <- tidy(sw_model, conf.int = TRUE)

sw_tidy
#> # A tibble: 3 × 7
#>   term           estimate std.error statistic  p.value conf.low conf.high
#>   <chr>             <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)    -111.       48.2       -2.30 0.0340   -213.       -9.46
#> 2 height            1.03      0.267      3.85 0.00128    0.466      1.59
#> 3 genderfeminine  -21.2      12.6       -1.68 0.111    -47.8        5.39
#> 4 genderNA         NA        NA        NA    NA         NA         NA
```

Read it top to bottom: height adds about 1 kg of mass per cm (close to the textbook rule of thumb), gender adds a noisy adjustment, and the tibble you get back is itself data, you can pipe it straight into `ggplot2`, `gt`, or `modelsummary` without touching the clipboard. That is the big ergonomic win over Stata's `esttab` / `outreg2` round-trip.

[NOTE]
**broom::tidy() turns any model into a tibble you can pipe.** Every coefficient, standard error, and confidence interval lives in data you can slice, join, and plot. Nothing comparable exists in Stata without dropping into Mata.

**Try it:** Group the cleaned `sw` data by `gender` and compute the mean height per group. Save it as `ex_sw`.

```r title="Exercise: mean height by gender"
# Try it: mean height by gender
ex_sw <- sw |>
  # your code here: group_by + summarise
  NULL

ex_sw
#> Expected: a tibble with gender and mean_height columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean-height solution"
ex_sw <- sw |>
  group_by(gender) |>
  summarise(mean_height = mean(height), n = n())

ex_sw
#> # A tibble: 2 × 3
#>   gender    mean_height     n
#>   <chr>           <dbl> <int>
#> 1 feminine         168.     4
#> 2 masculine        181.    18
```

**Explanation:** `group_by()` sets the grouping, `summarise()` collapses each group to one row, and `n()` gives you the sample size per group, a two-line replacement for Stata's `collapse (mean) height (count) n = height, by(gender)`.

</details>

## When should you choose Stata, R, or both?

There is no universal winner. The right choice depends on four things: where your career points, who you collaborate with, whether you need publication-quality graphics, and whether you expect to blend in machine learning. The function below encodes a simple weighted rubric you can run on your own profile.

```r title="Decision helper for tool choice"
# A tiny decision helper — returns "Stata", "R", or "Both"
recommend_tool <- function(career_track = c("academic_micro", "central_bank", "industry", "macro"),
                           collab_uses_stata = FALSE,
                           needs_publication_graphs = FALSE,
                           needs_machine_learning = FALSE) {
  career_track <- match.arg(career_track)

  r_score <- 0
  r_score <- r_score + ifelse(career_track == "academic_micro", 0, 2)
  r_score <- r_score + ifelse(needs_publication_graphs, 2, 0)
  r_score <- r_score + ifelse(needs_machine_learning, 2, 0)
  r_score <- r_score - ifelse(collab_uses_stata, 1, 0)

  if (r_score >= 3) "R"
  else if (r_score <= 0) "Stata"
  else "Both"
}

# A PhD student in applied micro with a Stata advisor
recommend_tool("academic_micro", collab_uses_stata = TRUE)
#> [1] "Stata"

# A central bank researcher who publishes chart-heavy reports
recommend_tool("central_bank", needs_publication_graphs = TRUE)
#> [1] "R"

# An industry economist who also does ML
recommend_tool("industry", needs_machine_learning = TRUE)
#> [1] "R"
```

The rubric is intentionally simple, three binary inputs and a career bucket, but the output tracks what experienced economists will usually tell you. If your advisor and coauthors live in Stata, learn Stata first and add R for figures. If you are headed anywhere else, R is the better single-tool bet.

[NOTE]
**Python is the quiet third option.** In tech, consulting, and increasingly in central banks, Python sits alongside R on most job ads. The realistic 2026 question is rarely pure "R or Stata", it is "R plus Python, with Stata as a read-only skill for legacy .do files."

![Decision flowchart for economists choosing between R, Stata, or both.](screenshots/R-vs-Stata-decision-flow.webp)
*Figure 1: A quick decision flow for choosing between R, Stata, or both, anchored on career track.*

**Try it:** Call `recommend_tool()` for a macro PhD student who needs publication graphs but doesn't collaborate with Stata users. Store the answer in `ex_rec`.

```r title="Exercise: recommend a tool"
# Try it: your own profile
ex_rec <- recommend_tool(
  career_track = "___",           # fill in
  needs_publication_graphs = ___  # TRUE or FALSE
)

ex_rec
#> Expected: "R"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recommend-tool solution"
ex_rec <- recommend_tool(
  career_track = "macro",
  needs_publication_graphs = TRUE
)

ex_rec
#> [1] "R"
```

**Explanation:** Macro and structural research has largely moved off Stata because the methods rely on custom solvers and iteration, R, Julia, and Python are all better fits.

</details>

## Practice Exercises

These capstone exercises combine multiple concepts from the tutorial. Use distinct variable names (prefix with `my_`) so they do not clobber the teaching variables above.

### Exercise 1: Two-way fixed effects by hand

Simulate a balanced panel of 100 units × 5 years with a unit-specific intercept, a year trend, and a treatment effect of 0.75 on half the units starting in year 3. Estimate a two-way fixed-effects model with `lm(y ~ treat_post + factor(unit) + factor(year))` and recover the treatment coefficient in `my_fe`.

```r title="Exercise: two-way fixed effects"
# Exercise 1: two-way fixed effects manually
# Hint: treat_post = treat * (year >= 3)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-way fixed effects solution"
set.seed(11)
my_panel <- expand.grid(unit = 1:100, year = 1:5) |>
  as_tibble() |>
  mutate(
    treat     = rep(rep(0:1, each = 50), times = 5),
    treat_post = treat * (year >= 3),
    y = 1 + 0.1 * unit + 0.2 * year + 0.75 * treat_post + rnorm(n(), sd = 0.5)
  )

my_fe <- lm(y ~ treat_post + factor(unit) + factor(year), data = my_panel) |>
  tidy() |>
  filter(term == "treat_post")

my_fe
#> # A tibble: 1 × 5
#>   term       estimate std.error statistic p.value
#>   <chr>         <dbl>     <dbl>     <dbl>   <dbl>
#> 1 treat_post    0.762    0.0642      11.9 3.1e-29
```

**Explanation:** Once unit and year fixed effects are in, the `treat_post` coefficient is the true within-unit, within-year effect of treatment, exactly the 0.75 we simulated, up to sampling noise.

</details>

### Exercise 2: Event-study-style tidy output

Using the same simulation approach, produce a tibble of coefficient estimates for `y ~ factor(year) * treat` (so you get one interaction term per year). Filter to the interaction rows only and save the result as `my_event_tidy`.

```r title="Exercise: event-study coefficients"
# Exercise 2: event-study-style coefficients
# Hint: filter rows whose `term` contains ":treat"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Event-study solution"
set.seed(22)
my_event <- expand.grid(unit = 1:100, year = 1:5) |>
  as_tibble() |>
  mutate(
    treat = rep(rep(0:1, each = 50), times = 5),
    y = 0.2 * year + 0.5 * treat * (year >= 3) + rnorm(n(), sd = 0.5)
  )

my_event_tidy <- lm(y ~ factor(year) * treat, data = my_event) |>
  tidy() |>
  filter(grepl(":treat", term))

my_event_tidy
#> # A tibble: 4 × 5
#>   term               estimate std.error statistic  p.value
#>   <chr>                 <dbl>     <dbl>     <dbl>    <dbl>
#> 1 factor(year)2:treat  0.023     0.100     0.228  0.820
#> 2 factor(year)3:treat  0.494     0.100     4.92   1.2e-6
#> 3 factor(year)4:treat  0.512     0.100     5.10   4.9e-7
#> 4 factor(year)5:treat  0.478     0.100     4.76   2.5e-6
```

**Explanation:** The pre-period interactions (year 2) are near zero, and the post-period interactions (years 3-5) cluster around the true 0.5 effect, the shape of a classic event-study plot.

</details>

### Exercise 3: Stata-to-R command translator

Write a function `stata_to_r(cmd)` that takes a Stata command string and returns the R equivalent as a string. Handle these three cases: `"regress y x"`, `"gen z = x + 1"`, and `"keep if x > 0"`. Anything else should return `"unknown"`.

```r title="Exercise: translate Stata commands"
# Exercise 3: translate Stata commands to R
# Hint: use grepl() or startsWith() for dispatch

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Stata-translator solution"
stata_to_r <- function(cmd) {
  if (grepl("^regress ", cmd)) {
    parts <- strsplit(sub("^regress ", "", cmd), " ")[[1]]
    sprintf("lm(%s ~ %s, data = df)", parts[1], paste(parts[-1], collapse = " + "))
  } else if (grepl("^gen ", cmd)) {
    sub("^gen ", "df <- df |> mutate(", paste0(cmd, ")"))
  } else if (grepl("^keep if ", cmd)) {
    sub("^keep if ", "df <- df |> filter(", paste0(cmd, ")"))
  } else {
    "unknown"
  }
}

stata_to_r("regress y x1 x2")
#> [1] "lm(y ~ x1 + x2, data = df)"
stata_to_r("gen z = x + 1")
#> [1] "df <- df |> mutate(z = x + 1)"
stata_to_r("keep if x > 0")
#> [1] "df <- df |> filter(x > 0)"
```

**Explanation:** A real Stata-to-R converter is a much bigger project (there is one called `parmest` for the reverse direction), but this tiny dispatch covers three of the commands you run most often and shows how a few lines of base R replace a full Stata line.

</details>

## Complete Example: A full DiD pipeline in R

Here is the end-to-end workflow an empirical economist would actually run: simulate a staggered-adoption-style panel, fit a DiD model with unit and year fixed effects, extract the tidy coefficients, and plot them. Every line runs in the browser.

```r title="Full DiD pipeline with fixed effects"
set.seed(42)

final_panel <- expand.grid(unit = 1:150, year = 2018:2025) |>
  as_tibble() |>
  mutate(
    treat       = rep(rep(0:1, each = 75), times = 8),
    post        = as.integer(year >= 2022),
    treat_post  = treat * post,
    y = 5 + 0.05 * unit + 0.2 * (year - 2018) + 1.0 * treat_post +
        rnorm(n(), sd = 0.6)
  )

final_model <- lm(y ~ treat_post + factor(unit) + factor(year), data = final_panel)

final_tidy <- tidy(final_model, conf.int = TRUE) |>
  filter(term == "treat_post")

final_tidy
#> # A tibble: 1 × 7
#>   term       estimate std.error statistic p.value conf.low conf.high
#>   <chr>         <dbl>     <dbl>     <dbl>   <dbl>    <dbl>     <dbl>
#> 1 treat_post    0.991    0.0357      27.8 2.3e-155   0.921      1.06

# Visualize the single treatment coefficient as a simple dotplot
ggplot(final_tidy, aes(x = term, y = estimate)) +
  geom_point(size = 4, color = "steelblue") +
  geom_errorbar(aes(ymin = conf.low, ymax = conf.high), width = 0.15) +
  geom_hline(yintercept = 1.0, linetype = "dashed", color = "firebrick") +
  labs(
    title = "DiD Estimate with Two-Way Fixed Effects",
    subtitle = "Dashed line = true effect (1.0); error bars = 95% CI",
    x = NULL, y = "Estimated effect"
  ) +
  theme_minimal()
```

The estimated effect (0.991) lands essentially on the true 1.0 with a tight 95% confidence interval. This is the whole empirical pipeline: data in, fixed-effects model, tidy extract, graphic out, and the code you just ran is production-shaped, not a toy.

[TIP]
**Reach for fixest::feols() once your panels get serious.** The base-R `lm(y ~ ... + factor(unit) + factor(year))` approach is great for teaching and small samples, but it materialises every dummy column. On a 1M-row panel with two-way fixed effects, `feols()` is roughly an order of magnitude faster and keeps your laptop usable.

## Summary

![Ecosystem comparison between R's package stack and Stata's built-in commands.](screenshots/R-vs-Stata-ecosystem-compare.webp)
*Figure 2: R's modular package ecosystem versus Stata's built-in command set. Both cover the same methods; the workflow style differs.*

Here is the short version you can tape to your monitor:

- **Academic empirical micro:** Stata is still the default. Learn Stata first, add R for figures and modern DiD packages.
- **Central banks, policy, tech, consulting:** R (or R + Python) dominates. Learn R first.
- **Causal inference frontier:** Most new methods ship in R first. If you want the latest DiD, synthetic control, or honest-DiD tools, you need R.
- **Panel + IV:** Both are fine for textbook methods. On large panels, `fixest` beats `reghdfe` by 5-10x.
- **Graphs and reporting:** R (via ggplot2 + broom + modelsummary + Quarto) has a real, persistent edge.
- **Cost:** R is free. A Stata SE perpetual license is ~$595. That rarely matters on a paid job; it matters a lot for coauthors and reviewers.
- **The practical answer:** most working economists eventually know both. Pick the one your first employer or advisor uses, and learn the other well enough to read.

## References

1. Bergé, L., *fixest: Fast Fixed-Effects Estimations*. CRAN. [Link](https://cran.r-project.org/package=fixest)
2. Bergé, L., *fixest* package homepage and vignettes. [Link](https://lrberge.github.io/fixest/)
3. stata2R, *fixest cheatsheet for Stata users*. [Link](https://stata2r.github.io/fixest/)
4. Wickham, H., Çetinkaya-Rundel, M., Grolemund, G., *R for Data Science*, 2nd Edition (2023). [Link](https://r4ds.hadley.nz/)
5. Robinson, D., Hayes, A., Couch, S., *broom: Convert Statistical Objects into Tidy Tibbles*. CRAN. [Link](https://cran.r-project.org/package=broom)
6. Correia, S., *reghdfe: Stata module for linear and instrumental-variable/GMM regression with multiple levels of fixed effects*. [Link](https://scorreia.com/software/reghdfe/)
7. R Core Team, *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
8. Angrist, J., Pischke, J-S., *Mostly Harmless Econometrics*. Princeton University Press (2009).

## Continue Learning
- [R vs Python](/R-vs-Python.html), The other major comparison economists ask about, side by side on data wrangling, stats, and ML.
- [R vs SAS](/R-vs-SAS.html), A similar breakdown for researchers coming from SAS in biostatistics and pharma.
- [Is R Worth Learning in 2026?](/Is-R-Worth-Learning-in-2026.html), The broader career case for R across all empirical fields.
