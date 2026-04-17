---
title: "R and the Reproducibility Crisis: 5 Habits That Make Your Research Replicable"
slug: "Reproducibility-Crisis"
description: "Most published research doesn't replicate. Learn 5 R habits, seeds, renv, targets, pre-specified plans, sessionInfo, that make your analysis verifiable."
keywords: "reproducibility crisis, reproducible research R, renv tutorial, targets package, p-hacking, garden of forking paths, replication crisis, set.seed, sessionInfo"
auto_link_terms: "reproducibility crisis|reproducible research|replication crisis|p-hacking|garden of forking paths"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "1.6.3"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Reproducibility Crisis"
sidebar_order: 52
difficulty: "Beginner"
---

# R and the Reproducibility Crisis: 5 Habits That Make Your Research Replicable

<p class="lead">Only 36% of psychology studies in the largest replication project produced significant results when re-run, yet 97% of the originals had. The fix isn't more statistics. It's five concrete R habits any researcher can adopt today.</p>

## Why does the same dataset give five different p-values?

Before we discuss fixes, look at what the problem actually feels like in code. The "garden of forking paths" is the moment you realise the same dataset can yield wildly different p-values depending on small, defensible analysis choices. Once you see it, you cannot unsee it. Let's reproduce the effect with 50 rows of pure random noise, no real effect anywhere.

The block below generates noise, then computes five p-values from five reasonable analysis paths a researcher might try.

```r
# Five defensible analyses, one noise dataset
set.seed(7)
n <- 50
df <- data.frame(
  x       = rnorm(n),
  y       = rnorm(n),
  group   = sample(c("A", "B"), n, replace = TRUE),
  age     = sample(20:60, n, replace = TRUE),
  flagged = sample(c(FALSE, FALSE, FALSE, FALSE, TRUE), n, replace = TRUE)
)

p1 <- cor.test(df$x, df$y)$p.value
p2 <- cor.test(df$x[!df$flagged], df$y[!df$flagged])$p.value
p3 <- cor.test(df$x[df$group == "A"], df$y[df$group == "A"])$p.value
p4 <- cor.test(df$x[df$age < 40], df$y[df$age < 40])$p.value
p5 <- summary(lm(y ~ x + age, data = df))$coefficients["x", "Pr(>|t|)"]

round(c(full = p1, no_outliers = p2, group_A = p3, under_40 = p4, with_age = p5), 3)
#>        full no_outliers     group_A    under_40    with_age
#>       0.842       0.913       0.486       0.043       0.762
min(c(p1, p2, p3, p4, p5))
#> [1] 0.04284
```

Look at the `under_40` column. With one defensible filter, restrict to participants under 40, the p-value drops to 0.043 and crosses the magic 0.05 threshold. Nothing in the data is real. The noise just happened to align inside that subgroup. A motivated researcher trying enough paths will *always* find one that "works", and that single result is what gets published.

![Garden of forking paths](screenshots/Reproducibility-Crisis-forking-paths.webp)
*Figure 1: One dataset, six defensible analysis paths, and at least one will look "significant".*

[WARNING]
**Each fork doubles your chance of a false positive.** If a single test gives 5% false positives, five independent tests give roughly 23%. The flexibility itself is the bug, not the statistician.

**Try it:** Change the seed to `7` to `42` in the block above and re-run. Count how many of the five p-values now fall under 0.05. The exercise drives home that the noise is doing the work, not the data.

```r
# Try it: count significant p-values under a different seed
ex_count_sig <- function(seed) {
  # your code here
}

# Test:
ex_count_sig(42)
#> Expected: a small integer between 0 and 5
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_count_sig <- function(seed) {
  set.seed(seed)
  n <- 50
  d <- data.frame(
    x = rnorm(n), y = rnorm(n),
    grp = sample(c("A", "B"), n, replace = TRUE),
    age = sample(20:60, n, replace = TRUE)
  )
  ps <- c(
    cor.test(d$x, d$y)$p.value,
    cor.test(d$x[d$grp == "A"], d$y[d$grp == "A"])$p.value,
    cor.test(d$x[d$age < 40], d$y[d$age < 40])$p.value
  )
  sum(ps < 0.05)
}
ex_count_sig(42)
#> [1] 1
```

**Explanation:** The function rebuilds the noise dataset under a new seed and counts how many of three forks land under 0.05. Run it on a few seeds, you will see "significant" results appear and disappear with no underlying truth changing.

</details>

## How does set.seed() lock down random results?

Habit one of the five is the easiest to adopt: every time your code uses randomness, simulation, train/test split, bootstrap, cross-validation, call `set.seed()` first. Without a seed, R's pseudo-random generator advances based on the system clock and process state, so two runs produce different numbers. With a seed, the generator starts from the same state and the same numbers come out.

The block below shows the effect side by side. The first two means come from un-seeded calls, the second two from seeded calls.

```r
# Without a seed: results drift
unseeded_a <- mean(rnorm(1000))
unseeded_b <- mean(rnorm(1000))
c(run1 = unseeded_a, run2 = unseeded_b)
#>        run1        run2
#>  0.01012345 -0.02834711

# With a seed: identical every time
set.seed(123)
seeded_a <- mean(rnorm(1000))
set.seed(123)
seeded_b <- mean(rnorm(1000))
c(run1 = seeded_a, run2 = seeded_b)
#>        run1        run2
#> 0.01612787  0.01612787
```

The unseeded means differ in the third decimal place. The seeded means are byte-identical. That difference is the entire point of habit one: a colleague who runs your code on the other side of the world should see the *same* number on the page, not a number that is "close enough".

[TIP]
**Use a unique, traceable seed per major example.** Reusing `42` everywhere is a habit, not a strategy. A unique seed per analysis (the date, the issue number, the participant ID) makes it clear which seed produced which result if you ever need to retrace your steps.

**Try it:** Write a function `ex_seeded_mean(seed)` that returns the mean of 1000 standard normals seeded with the input. Call it twice with the same seed to confirm you get the same number.

```r
# Try it: deterministic mean from a seed
ex_seeded_mean <- function(seed) {
  # your code here
}

# Test:
ex_seeded_mean(99)
ex_seeded_mean(99)
#> Expected: the same value, twice
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_seeded_mean <- function(seed) {
  set.seed(seed)
  mean(rnorm(1000))
}
ex_seeded_mean(99)
#> [1] 0.02176856
ex_seeded_mean(99)
#> [1] 0.02176856
```

**Explanation:** Calling `set.seed()` inside the function resets the random stream every time, so the function is a pure mapping from seed to mean. Pure functions are the foundation of everything reproducible.

</details>

## How does renv lock package versions?

A seed pins your randomness. Habit two pins your packages. Without it, the same `lm()` or `glm()` call can produce subtly different output a year later, because a dependency was updated and changed a default argument or a numerical routine. The `renv` package solves this by recording every package version your project uses into a `renv.lock` file that travels with your code.

`renv` itself is not pre-built for the in-browser R that powers this tutorial, but the *fingerprint* it captures is the same one `sessionInfo()` already prints. The block below shows what that fingerprint looks like, `renv.lock` stores a richer JSON version of the same idea.

```r
# What renv would capture (here via base R)
env_info <- sessionInfo()
env_info$R.version$version.string
#> [1] "R version 4.4.1 (2024-06-14)"

env_info$platform
#> [1] "wasm32-unknown-emscripten"

# Names of currently attached packages
names(env_info$otherPkgs)
#> NULL  (only base packages are attached in this fresh session)

# Base packages in this session
env_info$basePkgs
#> [1] "stats"     "graphics"  "grDevices" "utils"     "datasets"  "methods"   "base"
```

That output is your minimum reproducibility receipt: the exact R version and the exact set of packages that were loaded when you ran the analysis. `renv::snapshot()` extends it by also recording the version *number* of every package and the repository it came from, so a collaborator running `renv::restore()` rebuilds the same library on their machine.

[NOTE]
**Run renv locally, not in the browser.** The renv workflow is `renv::init()` → install packages → `renv::snapshot()` → commit `renv.lock` → collaborator runs `renv::restore()`. None of those commands need to run inside this tutorial; they belong in your real RStudio project.

**Try it:** Pull just the R version string and the list of base packages out of `sessionInfo()` and store them in a small named list called `ex_recipe`.

```r
# Try it: build a tiny environment recipe
ex_recipe <- list(
  # your code here
)

ex_recipe
#> Expected: $r_version chr; $base_pkgs chr [1:7]
```

<details>
<summary>Click to reveal solution</summary>

```r
info <- sessionInfo()
ex_recipe <- list(
  r_version = info$R.version$version.string,
  base_pkgs = info$basePkgs
)
ex_recipe
#> $r_version
#> [1] "R version 4.4.1 (2024-06-14)"
#>
#> $base_pkgs
#> [1] "stats"     "graphics"  "grDevices" "utils"     "datasets"  "methods"   "base"
```

**Explanation:** A "recipe" is just a list of the smallest facts a future-you needs to recreate this run. Saving it next to your results means "I know what produced this number", the literal definition of reproducible.

</details>

## What does a targets pipeline buy you that a script doesn't?

A long script re-runs everything every time. If your data load takes ten minutes and your model fits in two seconds, you wait ten minutes to tweak a plot. The `targets` package solves this by treating your analysis as a directed acyclic graph of pure functions: each step is a node, each node knows its inputs, and only the steps whose inputs changed get re-run.

You can model the same idea in base R with three pure functions and one dataset. The block below shows the pipeline mindset before introducing the package.

```r
# A pipeline in three pure functions
clean_step <- function(raw) {
  raw[complete.cases(raw), ]
}

model_step <- function(clean) {
  lm(mpg ~ hp + wt, data = clean)
}

summarise_step <- function(model) {
  list(r2 = summary(model)$r.squared,
       coefs = round(coef(model), 3))
}

clean_data <- clean_step(mtcars)
mod        <- model_step(clean_data)
smry       <- summarise_step(mod)
smry
#> $r2
#> [1] 0.8267855
#>
#> $coefs
#> (Intercept)          hp          wt
#>      37.227      -0.032      -3.878
```

Each step takes one input and returns one output. None of them peek at global state. That property, pure inputs in, pure outputs out, is what lets `targets` reason about which nodes are stale. If you change `clean_step`, only `clean_step` and its descendants re-run. If you change a plot at the end, the model isn't refit. The script becomes a contract about what depends on what, instead of a wall of code that runs top to bottom.

![Levels of reproducibility](screenshots/Reproducibility-Crisis-levels.webp)
*Figure 2: Reproducibility is a spectrum, not a switch, pick the level your project needs.*

[KEY INSIGHT]
**A pipeline is not just a speed trick, it is an executable map of dependencies.** When a reviewer asks "what does this number depend on?", you can point at the graph. When a future-you returns to the project after a year, you read the graph instead of re-deriving the script.

**Try it:** Add a fourth pure function `ex_describe()` that takes the cleaned data and returns its row count plus the mean of `mpg`. Call it on `clean_data`.

```r
# Try it: extend the pipeline with one more pure function
ex_describe <- function(clean) {
  # your code here
}

ex_describe(clean_data)
#> Expected: list(n = 32, mean_mpg = ~20.09)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_describe <- function(clean) {
  list(n = nrow(clean), mean_mpg = mean(clean$mpg))
}
ex_describe(clean_data)
#> $n
#> [1] 32
#>
#> $mean_mpg
#> [1] 20.09062
```

**Explanation:** Same shape as the other steps, one input, one output, no side effects. In a real `targets` pipeline you would add a `tar_target(description, ex_describe(clean_data))` line and `targets` would track it as a node in the graph.

</details>

## How do pre-specified plans stop p-hacking?

Habits one through four protect the *computation*. Habit five protects the *human*. Pre-specifying your analysis means writing down the test, the sample size, the outlier rule, and the hypothesis *before* you see the data. Once written, the plan is a commitment device: if the analysis later changes, you must label that change as exploratory.

The classic violation is "optional stopping", peeking at your data and stopping data collection the moment p drops below 0.05. The block below simulates 500 such studies under a true null effect and reports the false-positive rate.

```r
# Optional stopping under a true null
set.seed(2026)
n_sims <- 500
fp_count <- 0

for (sim in 1:n_sims) {
  x <- numeric(0); y <- numeric(0)
  found <- FALSE
  for (batch in 1:10) {
    x <- c(x, rnorm(10))
    y <- c(y, rnorm(10))
    if (length(x) >= 20) {
      if (t.test(x, y)$p.value < 0.05) {
        found <- TRUE
        break
      }
    }
  }
  if (found) fp_count <- fp_count + 1
}

fp_rate <- fp_count / n_sims
round(fp_rate * 100, 1)
#> [1] 14.4
```

The expected false-positive rate for a single t-test under the null is 5%. By peeking ten times and stopping the moment we see significance, we have inflated it to roughly 14%, almost three times what we promised the reader. There is no real effect anywhere in this code; the inflation is purely a consequence of the *flexibility* of stopping when you like the result.

[WARNING]
**Optional stopping nearly triples your false-positive rate.** A pre-specified sample size, say, "we will collect 100 observations and then test once", closes the door on this. The plan is the protection, not the test.

**Try it:** Modify the simulation to use a fixed sample size of 100 and a single t-test. Compute the new false-positive rate and confirm it lands near 5%.

```r
# Try it: same null, but commit to n = 100 up front
ex_fixed_n <- function(n_sims = 500) {
  # your code here
}

ex_fixed_n()
#> Expected: a value near 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fixed_n <- function(n_sims = 500) {
  set.seed(2026)
  fp <- 0
  for (sim in 1:n_sims) {
    x <- rnorm(100); y <- rnorm(100)
    if (t.test(x, y)$p.value < 0.05) fp <- fp + 1
  }
  fp / n_sims
}
ex_fixed_n()
#> [1] 0.054
```

**Explanation:** With a pre-specified n and a single test, the false-positive rate sits where it should, about one in twenty. The discipline isn't statistical; it is procedural. Decide first, then look.

</details>

## Practice Exercises

These two capstones combine multiple habits from the tutorial. Use distinct variable names (`my_*`) so your exercise code does not overwrite anything from the lessons above.

### Exercise 1: Build a reproducibility audit function

Write a function `audit_reproducibility(seed_value, packages)` that prints a four-item checklist:

1. Whether the seed was set (always TRUE if `seed_value` is provided)
2. The R version from `sessionInfo()`
3. The number of packages the user listed
4. Today's date (use `Sys.Date()`)

Call it once with seed `2026` and a vector of packages you would use for a regression project.

```r
# Exercise 1: reproducibility audit
# Hint: cat() each line, return invisible(NULL)

audit_reproducibility <- function(seed_value, packages) {
  # Write your code below
}

# Test:
audit_reproducibility(2026, c("dplyr", "ggplot2", "broom"))
```

<details>
<summary>Click to reveal solution</summary>

```r
audit_reproducibility <- function(seed_value, packages) {
  set.seed(seed_value)
  cat("Reproducibility audit\n")
  cat("---------------------\n")
  cat(" Seed set:        TRUE  (value =", seed_value, ")\n")
  cat(" R version:      ", R.version$version.string, "\n")
  cat(" Packages listed:", length(packages), "->", paste(packages, collapse = ", "), "\n")
  cat(" Date:           ", as.character(Sys.Date()), "\n")
  invisible(NULL)
}
my_audit <- audit_reproducibility(2026, c("dplyr", "ggplot2", "broom"))
#> Reproducibility audit
#> ---------------------
#>  Seed set:        TRUE  (value = 2026 )
#>  R version:       R version 4.4.1 (2024-06-14)
#>  Packages listed: 3 -> dplyr, ggplot2, broom
#>  Date:            2026-04-14
```

**Explanation:** The function is a checklist enforcer, it cannot make your code reproducible, but it makes it impossible to forget the steps. Drop a call to it at the top of every analysis script.

</details>

### Exercise 2: Multiple-comparison correction

You ran 20 hypothesis tests. Three p-values landed under 0.05 (0.001, 0.023, 0.041); the other 17 are 0.30 each. Use `p.adjust()` to apply both the Bonferroni and Benjamini–Hochberg corrections, then report how many tests remain significant under each.

```r
# Exercise 2: multiple-comparison correction
# Hint: p.adjust(p, method = "bonferroni") and method = "BH"

my_pvals <- c(0.001, 0.023, 0.041, rep(0.30, 17))

# Write your code below

```

<details>
<summary>Click to reveal solution</summary>

```r
my_pvals <- c(0.001, 0.023, 0.041, rep(0.30, 17))
my_bonf  <- p.adjust(my_pvals, method = "bonferroni")
my_bh    <- p.adjust(my_pvals, method = "BH")

c(raw_significant       = sum(my_pvals < 0.05),
  bonferroni_significant = sum(my_bonf  < 0.05),
  bh_significant         = sum(my_bh    < 0.05))
#>           raw_significant bonferroni_significant         bh_significant
#>                         3                      1                      1
```

**Explanation:** Of the three "significant" raw p-values, only the strongest (0.001) survives Bonferroni, which divides the threshold by 20. Benjamini–Hochberg controls the false discovery rate and is less conservative, but on this small example it also keeps only one. Multiple-testing correction is the single biggest defence against the kind of forking-paths inflation we showed in the first section.

</details>

## Complete Example: A reproducible mini-analysis

The block below ties all five habits into one short analysis. Read it as a template, every line is here for a reproducibility reason, not just a statistical one.

```r
# 1. Pin randomness
set.seed(2026)

# 2. Generate (or load) the data deterministically
recipe_data <- data.frame(
  treatment = rep(c("control", "drug"), each = 30),
  outcome   = c(rnorm(30, mean = 10), rnorm(30, mean = 11.2))
)

# 3. Pre-specified analysis: one t-test, no peeking
recipe_mod <- t.test(outcome ~ treatment, data = recipe_data)

# 4. Capture the environment fingerprint
recipe_env <- list(
  r_version = R.version$version.string,
  base_pkgs = sessionInfo()$basePkgs,
  date      = Sys.Date()
)

# 5. Save the receipt: result + environment + seed
recipe_receipt <- list(
  seed        = 2026,
  estimate    = unname(recipe_mod$estimate),
  p_value     = recipe_mod$p.value,
  environment = recipe_env
)

recipe_receipt$p_value
#> [1] 8.612e-05
recipe_receipt$estimate
#> [1] 10.07423 11.07654
```

The `recipe_receipt` object is the deliverable. It carries the seed (so anyone can re-run), the estimates and p-value (so anyone can verify), and the environment fingerprint (so anyone can diagnose if a different R version produces a different number). Save it next to your figures and your paper is *computationally* reproducible.

## Summary

![The five habits at a glance](screenshots/Reproducibility-Crisis-5-habits.webp)
*Figure 3: The five habits at a glance, adopt them in order.*

| # | Habit | R Tool | One-line benefit |
|---|---|---|---|
| 1 | Set a unique seed before every random operation | `set.seed()` | Same numbers on every machine |
| 2 | Lock package versions in a project lockfile | `renv::snapshot()` | Same packages a year from now |
| 3 | Express analysis as a graph of pure functions | `targets` | Re-runs only what changed; documents dependencies |
| 4 | Pre-specify the test, sample size and outlier rules | OSF / pre-analysis plan | Stops optional stopping and HARKing |
| 5 | Save an environment receipt next to results | `sessionInfo()` / `renv.lock` | Anyone can diagnose differences |

[KEY INSIGHT]
**Reproducibility is a habit pyramid, not a single tool.** Habit 1 takes a single line of code; habit 5 may take a Docker container. Climb only as high as your project actually needs, but never skip the bottom rungs.

## References

1. Open Science Collaboration (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251). [Link](https://www.science.org/doi/10.1126/science.aac4716)
2. Gelman, A. & Loken, E. (2014). The Garden of Forking Paths. Columbia University. [Link](https://stat.columbia.edu/~gelman/research/unpublished/forking.pdf)
3. Ushey, K. *renv: Project Environments for R*. Posit / RStudio. [Link](https://rstudio.github.io/renv/)
4. Landau, W. M. *The targets R Package User Manual*. rOpenSci. [Link](https://books.ropensci.org/targets/)
5. CRAN Task View, Reproducible Research. R Project. [Link](https://cran.r-project.org/view=ReproducibleResearch)
6. Center for Open Science, Pre-registration. [Link](https://www.cos.io/initiatives/prereg)
7. Marwick, B., Boettiger, C. & Mullen, L. (2018). Packaging Data Analytical Work Reproducibly. *The American Statistician*, 72(1). [Link](https://www.tandfonline.com/doi/full/10.1080/00031305.2017.1375986)
8. Wickham, H. & Grolemund, G. *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [Data Ethics in R](Data-Ethics-in-R.html), the broader ethical framework around honest analysis
- [Bias in Data and Models](Bias-in-Data-and-Models.html), how hidden assumptions shape the answers
- [Communicating Uncertainty](Communicating-Uncertainty.html), how to report results honestly to a non-technical audience
