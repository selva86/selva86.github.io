---
title: "Reproducibility Crisis: What It Means for R Users & How to Help Fix It"
slug: "Reproducibility-Crisis"
description: "Understand the reproducibility crisis and how R tools like renv, targets, and Docker help you produce research that others can verify and trust."
keywords: "reproducibility crisis, reproducible research R, renv, targets, p-hacking, garden of forking paths, R reproducibility"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.6.3"
post_type: "C"
auto_link_terms: "reproducibility crisis|reproducible research|replication crisis"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Reproducibility Crisis"
sidebar_order: 52
---

# Reproducibility Crisis: What It Means for R Users & How to Help Fix It

<p class="lead">More than half of published research findings may be false or unreproducible. The reproducibility crisis is a systemic failure in how science is done — and R programmers are uniquely positioned to help fix it.</p>

In 2015, the Open Science Collaboration attempted to replicate 100 psychology studies. Only 36% of replications produced significant results, compared to 97% of the originals. Similar replication failures have been found in cancer biology, economics, and social science. This isn't just an academic problem — it wastes billions in research funding and erodes public trust in science.

## What Went Wrong

### The Garden of Forking Paths

Every analysis involves dozens of small decisions: how to clean the data, which outliers to exclude, which covariates to include, which subgroups to analyze. Each decision creates a "fork" — and researchers (often unconsciously) follow the path that leads to significant results.

```r
# Demonstration: The garden of forking paths
set.seed(42)
n <- 50

# Generate completely random data (no true effect)
df <- data.frame(
  x = rnorm(n),
  y = rnorm(n),
  group = sample(c("A","B"), n, replace = TRUE),
  age = sample(20:60, n, replace = TRUE),
  outlier_flag = sample(c(FALSE, FALSE, FALSE, FALSE, TRUE), n, replace = TRUE)
)

# Fork 1: Full data vs remove outliers
p1 <- cor.test(df$x, df$y)$p.value
p2 <- cor.test(df$x[!df$outlier_flag], df$y[!df$outlier_flag])$p.value

# Fork 2: All subjects vs subgroup
p3 <- cor.test(df$x[df$group == "A"], df$y[df$group == "A"])$p.value
p4 <- cor.test(df$x[df$age < 40], df$y[df$age < 40])$p.value

# Fork 3: Control for age
p5 <- summary(lm(y ~ x + age, data = df))$coefficients["x", "Pvalue"]

cat("=== Garden of Forking Paths ===\n")
cat("Same data, different analysis choices:\n\n")
cat(sprintf("Full data correlation:         p = %.4f\n", p1))
cat(sprintf("Remove flagged outliers:       p = %.4f\n", p2))
cat(sprintf("Group A only:                  p = %.4f\n", p3))
cat(sprintf("Age < 40 only:                 p = %.4f\n", p4))
cat(sprintf("Control for age:               p = %.4f\n", p5))
cat(sprintf("\nSmallest p-value: %.4f\n", min(p1,p2,p3,p4,p5)))
cat("A researcher could 'choose' any of these paths.\n")
cat("With enough forks, you'll find p < 0.05 even in random noise.\n")
```

### P-Hacking in Practice

P-hacking encompasses many practices that inflate false-positive rates:

| Practice | Problem | Better Alternative |
|----------|---------|-------------------|
| Running many tests, reporting significant ones | Multiplicity inflation | Pre-register primary analysis |
| Removing outliers until p < 0.05 | Data-dependent decisions | Pre-specify outlier rules |
| Adding covariates to "improve" the model | Specification searching | Pre-specify the model |
| Stopping data collection when p < 0.05 | Optional stopping | Pre-specify sample size |
| Dichotomizing continuous variables | Loss of information, inflated Type I | Keep variables continuous |
| HARKing (Hypothesizing After Results are Known) | Post-hoc presented as a priori | Pre-registration |

```r
# How optional stopping inflates false positives
set.seed(123)

# Simulate: check for significance every 10 observations
# (True effect = 0, no real difference)
n_sims <- 1000
false_positives <- 0

for (sim in 1:n_sims) {
  x <- c()
  y <- c()
  found_sig <- FALSE

  for (batch in 1:10) {
    x <- c(x, rnorm(10))
    y <- c(y, rnorm(10))

    if (length(x) >= 20) {
      p <- t.test(x, y)$p.value
      if (p < 0.05) {
        found_sig <- TRUE
        break
      }
    }
  }
  if (found_sig) false_positives <- false_positives + 1
}

cat("=== Optional Stopping Inflation ===\n")
cat(sprintf("False positive rate with optional stopping: %.1f%%\n",
            false_positives / n_sims * 100))
cat("Expected rate (no peeking): 5.0%\n")
cat("Optional stopping nearly doubles the false positive rate!\n")
```

## How R Tools Help Fix It

R has an exceptional ecosystem for reproducible research. Here are the key tools:

### 1. renv: Lock Package Versions

Different package versions can produce different results. `renv` creates a snapshot of your exact package versions.

```r
# renv workflow (conceptual - not run in WebR)
cat("=== renv Workflow ===\n")
cat("1. renv::init()       # Initialize project-local library\n")
cat("2. install.packages() # Install needed packages\n")
cat("3. renv::snapshot()   # Lock current versions to renv.lock\n")
cat("4. # Share renv.lock with collaborators\n")
cat("5. renv::restore()    # Collaborator installs exact same versions\n\n")

cat("Your renv.lock file captures:\n")
cat("- R version\n")
cat("- Every package name, version, and source\n")
cat("- Repository URLs\n")
cat("- Dependency tree\n")
```

### 2. targets: Reproducible Pipelines

The `targets` package defines your analysis as a directed acyclic graph (DAG). It tracks which steps need re-running when inputs change.

```r
# targets pipeline (conceptual)
cat("=== targets Pipeline ===\n")
cat('# _targets.R file\n')
cat('library(targets)\n\n')
cat('list(\n')
cat('  tar_target(raw_data, read.csv("data.csv")),\n')
cat('  tar_target(clean_data, clean_function(raw_data)),\n')
cat('  tar_target(model, lm(y ~ x, data = clean_data)),\n')
cat('  tar_target(report, render_report(model))\n')
cat(')\n\n')
cat("Benefits:\n")
cat("- Only re-runs steps whose inputs changed\n")
cat("- Documents the entire analysis flow\n")
cat("- Catches errors when dependencies change\n")
cat("- Parallel execution built in\n")
```

### 3. set.seed(): Deterministic Randomness

```r
# Without set.seed: results change every run
cat("=== Importance of set.seed() ===\n")
cat("Without set.seed():\n")
cat("  Run 1:", mean(rnorm(100)), "\n")
cat("  Run 2:", mean(rnorm(100)), "\n")

cat("\nWith set.seed(42):\n")
set.seed(42); cat("  Run 1:", mean(rnorm(100)), "\n")
set.seed(42); cat("  Run 2:", mean(rnorm(100)), "\n")
cat("\nSame seed = same results. Always set.seed() before randomization.\n")
```

### 4. Docker: Freeze the Entire Environment

```r
cat("=== Docker for R (conceptual) ===\n")
cat("A Dockerfile captures EVERYTHING:\n")
cat("- Operating system version\n")
cat("- R version\n")
cat("- System libraries\n")
cat("- R packages and versions\n")
cat("- Your code and data\n\n")
cat("Example Dockerfile:\n")
cat("  FROM rocker/r-ver:4.4.0\n")
cat("  RUN install2.r renv\n")
cat("  COPY renv.lock renv.lock\n")
cat("  RUN R -e 'renv::restore()'\n")
cat("  COPY analysis.R analysis.R\n")
cat("  CMD Rscript analysis.R\n")
```

## The Reproducibility Checklist

| Level | What to Do | Tool |
|-------|-----------|------|
| Minimal | Set random seeds, comment code | `set.seed()`, `#` comments |
| Basic | Version control, share code | Git + GitHub |
| Good | Lock package versions | `renv` |
| Better | Automated pipeline | `targets` or `make` |
| Best | Container + registered plan | Docker + OSF pre-registration |

## Exercises

### Exercise 1: Multiple Comparison Correction

You run 20 hypothesis tests. Three are significant at p < 0.05. After correction, how many remain significant?

```r
# 20 tests, 3 "significant" raw p-values
p_raw <- c(0.001, 0.023, 0.041, rep(0.3, 17))

cat("=== Multiple Comparison Correction ===\n")
cat("Raw p-values (significant ones):\n")
cat(sprintf("  Test 1: p = %.3f\n", p_raw[1]))
cat(sprintf("  Test 2: p = %.3f\n", p_raw[2]))
cat(sprintf("  Test 3: p = %.3f\n", p_raw[3]))

# Bonferroni (most conservative)
p_bonf <- p.adjust(p_raw, method = "bonferroni")
cat(sprintf("\nBonferroni corrected: %d significant\n", sum(p_bonf < 0.05)))

# Benjamini-Hochberg (FDR, less conservative)
p_bh <- p.adjust(p_raw, method = "BH")
cat(sprintf("BH (FDR) corrected: %d significant\n", sum(p_bh < 0.05)))

cat("\nAlways correct for multiple comparisons!\n")
```

### Exercise 2: Reproducibility Audit

Check if this analysis is reproducible. What's missing?

```r
cat("=== Audit This Analysis ===\n")
cat("result <- lm(y ~ x + z, data = read.csv('data.csv'))\n")
cat("summary(result)\n\n")

cat("Missing for reproducibility:\n")
cat("1. No set.seed() (if any randomization upstream)\n")
cat("2. No package versions recorded (no renv.lock)\n")
cat("3. No data provenance (where did data.csv come from?)\n")
cat("4. No session info (R version, OS)\n")
cat("5. No documentation of data cleaning steps\n")
cat("6. No version control (is this in Git?)\n")
```

## Summary

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| P-hacking | Flexible analysis + significance pressure | Pre-registration |
| Non-reproducible code | Missing dependencies/versions | renv + Docker |
| Garden of forking paths | Undocumented analysis decisions | targets pipeline |
| Optional stopping | Peeking at results during collection | Pre-specify sample size |
| HARKing | Post-hoc hypotheses | Registered reports |
| Software rot | Packages change over time | renv::snapshot() |

## FAQ

**Does reproducibility mean the same results every time?**
Computational reproducibility means running the same code on the same data produces identical output. Replicability means a new study with new data reaches similar conclusions. Both matter, but reproducibility is the minimum bar.

**Isn't pre-registration too rigid? What if I find something unexpected?**
Pre-registration doesn't prevent exploratory analysis — it just requires you to label it as exploratory. You can (and should) explore your data. The key is being transparent about what was planned versus what was discovered.

**Do I need Docker for every analysis?**
No. For most analyses, renv + Git is sufficient. Use Docker when you need to guarantee reproducibility across different operating systems, or for high-stakes analyses (clinical trials, regulatory submissions, published papers).

## What's Next

- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework
- [Data Privacy in R](Data-Privacy-in-R.html) — Anonymization and differential privacy
- [Pre-Analysis Plans in R](Pre-Analysis-Plans-in-R.html) — Commit to your analysis before running it
