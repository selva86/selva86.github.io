---
title: "Synthetic Data Generation in R: Protect Privacy While Testing Models"
slug: "Synthetic-Data-in-R"
description: "Generate synthetic data in R using synthpop, simulated distributions, and GANs. Protect privacy while preserving statistical properties for testing."
keywords: "synthetic data R, synthpop, data generation R, privacy preserving data, simulated data R, fake data R, GANs R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-data-2"
post_type: "FR"
auto_link_terms: "synthetic data|synthpop|simulated data|fake data generation"
auto_link_case_sensitive: false
fr_parent: "Data-Ethics-in-R.html"
---

# Synthetic Data Generation in R: Protect Privacy While Testing Models

<p class="lead">Synthetic data looks and behaves like real data but contains no actual individuals. It lets you share datasets, test models, and develop code without exposing sensitive information — all while preserving the statistical relationships your analysis depends on.</p>

You need to share a dataset with a collaborator, but it contains patient records. You want to test a machine learning pipeline, but the real data is locked behind an NDA. You're teaching a class and need realistic examples without privacy risks. Synthetic data solves all of these problems.

## Why Synthetic Data?

| Use Case | Problem | Solution |
|----------|---------|---------|
| Sharing with collaborators | Real data has PII | Share synthetic copy |
| Testing code/pipelines | No access to production data | Generate realistic test data |
| Teaching & tutorials | Need realistic examples | Create privacy-safe datasets |
| Augmenting small datasets | Not enough training data | Synthesize additional records |
| Open science | Can't share raw data | Release synthetic version |
| Development & QA | Need many test scenarios | Generate edge cases |

## Method 1: Parametric Simulation

Generate data from known distributions that match the real data's properties.

```r
# Step 1: Analyze real data properties
cat("=== Real Data Properties (mtcars) ===\n")
cat(sprintf("MPG:  mean=%.1f, sd=%.1f\n", mean(mtcars$mpg), sd(mtcars$mpg)))
cat(sprintf("HP:   mean=%.1f, sd=%.1f\n", mean(mtcars$hp), sd(mtcars$hp)))
cat(sprintf("WT:   mean=%.2f, sd=%.2f\n", mean(mtcars$wt), sd(mtcars$wt)))
cat(sprintf("Correlation (mpg, wt): %.3f\n", cor(mtcars$mpg, mtcars$wt)))

# Step 2: Generate synthetic data preserving these properties
set.seed(42)
n_synth <- 100

# Use multivariate normal to preserve correlations
real_means <- colMeans(mtcars[, c("mpg","hp","wt")])
real_cov <- cov(mtcars[, c("mpg","hp","wt")])

# Cholesky decomposition for correlated normals
L <- chol(real_cov)
z <- matrix(rnorm(n_synth * 3), ncol = 3)
synth_data <- z %*% L + matrix(real_means, n_synth, 3, byrow = TRUE)
synth_df <- as.data.frame(synth_data)
names(synth_df) <- c("mpg","hp","wt")

# Enforce realistic constraints
synth_df$mpg <- pmax(synth_df$mpg, 8)
synth_df$hp <- pmax(round(synth_df$hp), 50)
synth_df$wt <- pmax(synth_df$wt, 1.5)

cat("\n=== Synthetic Data Properties ===\n")
cat(sprintf("MPG:  mean=%.1f, sd=%.1f\n", mean(synth_df$mpg), sd(synth_df$mpg)))
cat(sprintf("HP:   mean=%.1f, sd=%.1f\n", mean(synth_df$hp), sd(synth_df$hp)))
cat(sprintf("WT:   mean=%.2f, sd=%.2f\n", mean(synth_df$wt), sd(synth_df$wt)))
cat(sprintf("Correlation (mpg, wt): %.3f\n", cor(synth_df$mpg, synth_df$wt)))
```

## Method 2: CART-Based Synthesis (synthpop approach)

The `synthpop` package uses classification and regression trees to model the conditional distributions in your data. Here's the concept implemented manually.

```r
# Simplified CART-based synthesis concept
set.seed(42)

# Original data
original <- data.frame(
  age = sample(20:70, 200, replace = TRUE),
  income = NA,
  education = sample(c("HS","BA","MA","PhD"), 200, replace = TRUE,
                     prob = c(0.3, 0.4, 0.2, 0.1))
)
# Income depends on age and education (realistic relationships)
edu_bonus <- c(HS = 0, BA = 15000, MA = 25000, PhD = 35000)
original$income <- 20000 + 500 * original$age +
                   edu_bonus[original$education] +
                   rnorm(200, 0, 10000)

cat("=== Original Data Summary ===\n")
cat(sprintf("N = %d\n", nrow(original)))
cat(sprintf("Mean income: $%.0f\n", mean(original$income)))
cat(sprintf("Income by education:\n"))
print(round(tapply(original$income, original$education, mean)))

# Synthesize: model each variable conditionally
# Variable 1: age (sample from empirical distribution)
synth_age <- sample(original$age, 200, replace = TRUE)

# Variable 2: education (conditional on age - use original proportions per age group)
age_group <- cut(synth_age, c(0,35,50,80), labels = c("young","mid","senior"))
synth_edu <- character(200)
for (ag in levels(age_group)) {
  mask_synth <- age_group == ag
  orig_mask <- cut(original$age, c(0,35,50,80), labels = c("young","mid","senior")) == ag
  probs <- prop.table(table(original$education[orig_mask]))
  synth_edu[mask_synth] <- sample(names(probs), sum(mask_synth), replace = TRUE, prob = probs)
}

# Variable 3: income (conditional on age and education)
model <- lm(income ~ age + education, data = original)
synth_income <- predict(model, data.frame(age = synth_age, education = synth_edu)) +
                rnorm(200, 0, summary(model)$sigma)

synthetic <- data.frame(age = synth_age, income = synth_income, education = synth_edu)

cat("\n=== Synthetic Data Summary ===\n")
cat(sprintf("N = %d\n", nrow(synthetic)))
cat(sprintf("Mean income: $%.0f\n", mean(synthetic$income)))
cat(sprintf("Income by education:\n"))
print(round(tapply(synthetic$income, synthetic$education, mean)))
```

## Method 3: Bootstrap-Based Synthesis

Simple and effective for many use cases: sample with replacement and add noise.

```r
# Bootstrap + noise synthesis
set.seed(42)

# Start with real data
real <- mtcars[, c("mpg", "cyl", "hp", "wt")]

# Bootstrap sample
n_synth <- 50
boot_idx <- sample(1:nrow(real), n_synth, replace = TRUE)
synth <- real[boot_idx, ]
rownames(synth) <- NULL

# Add noise to continuous variables (not to categorical)
noise_level <- 0.1  # 10% of SD
synth$mpg <- synth$mpg + rnorm(n_synth, 0, noise_level * sd(real$mpg))
synth$hp <- round(synth$hp + rnorm(n_synth, 0, noise_level * sd(real$hp)))
synth$wt <- synth$wt + rnorm(n_synth, 0, noise_level * sd(real$wt))

cat("=== Bootstrap + Noise Synthesis ===\n")
cat("Real data:\n")
print(round(sapply(real, function(x) c(mean=mean(x), sd=sd(x))), 2))
cat("\nSynthetic data:\n")
print(round(sapply(synth, function(x) c(mean=mean(x), sd=sd(x))), 2))
```

## Measuring Utility: Is the Synthetic Data Good Enough?

Synthetic data is useful only if it preserves the statistical properties you need. Here's how to measure that.

```r
# Utility comparison
set.seed(42)

# Fit the same model on real and synthetic data
real_model <- lm(mpg ~ hp + wt, data = mtcars)
synth_model <- lm(mpg ~ hp + wt, data = synth)

cat("=== Utility Comparison ===\n")
cat("\nReal data model coefficients:\n")
print(round(coef(real_model), 4))
cat("\nSynthetic data model coefficients:\n")
print(round(coef(synth_model), 4))

# Compare distributions
cat("\n--- Distribution Comparison ---\n")
for (var in c("mpg", "hp", "wt")) {
  ks <- ks.test(real[[var]], synth[[var]])
  cat(sprintf("%s: KS statistic = %.3f, p = %.3f %s\n",
      var, ks$statistic, ks$p.value,
      ifelse(ks$p.value > 0.05, "(similar)", "(different!)")))
}
```

## Privacy Check: Is the Synthetic Data Safe?

```r
# Check for identity disclosure risk
# If a synthetic record exactly matches a real record, that's a risk

check_disclosure <- function(real, synth, tolerance = 0.01) {
  matches <- 0
  for (i in 1:nrow(synth)) {
    for (j in 1:nrow(real)) {
      diffs <- abs(as.numeric(synth[i,]) - as.numeric(real[j,]))
      ranges <- apply(real, 2, function(x) diff(range(x)))
      rel_diffs <- diffs / ranges
      if (all(rel_diffs < tolerance)) {
        matches <- matches + 1
        break
      }
    }
  }
  matches
}

cat("=== Privacy Risk Assessment ===\n")
# Use numeric columns only
real_num <- mtcars[, c("mpg","hp","wt")]
synth_num <- synth[, c("mpg","hp","wt")]

n_matches <- check_disclosure(real_num, synth_num, tolerance = 0.05)
cat(sprintf("Records within 5%% of a real record: %d of %d (%.1f%%)\n",
    n_matches, nrow(synth_num), 100 * n_matches/nrow(synth_num)))

cat("\nGuidelines:\n")
cat("  < 5% close matches: Low risk\n")
cat("  5-20% close matches: Moderate risk, add more noise\n")
cat("  > 20% close matches: High risk, regenerate with more perturbation\n")
```

## Using synthpop

```r
# synthpop package usage (conceptual)
cat("=== synthpop Package ===\n\n")
cat('library(synthpop)\n\n')
cat('# Generate synthetic data\n')
cat('synth_obj <- syn(original_data, method = "cart")\n\n')
cat('# Extract the synthetic dataset\n')
cat('synthetic_data <- synth_obj$syn\n\n')
cat('# Compare distributions\n')
cat('compare(synth_obj, original_data)\n\n')
cat('# Utility metrics\n')
cat('utility.gen(synth_obj, original_data)\n\n')
cat('Available methods:\n')
cat('  "cart"    - Classification and Regression Trees (default)\n')
cat('  "norm"    - Normal linear regression\n')
cat('  "logreg"  - Logistic regression (for binary)\n')
cat('  "polyreg" - Polytomous regression (for categorical)\n')
cat('  "sample"  - Random sampling from observed values\n')
```

## Summary: Choosing a Synthesis Method

| Method | Complexity | Privacy | Utility | Best For |
|--------|-----------|---------|---------|----------|
| Parametric | Low | Medium | Medium | Known distributions |
| Bootstrap + noise | Low | Low-medium | High | Quick prototyping |
| CART (synthpop) | Medium | Medium-high | High | General purpose |
| Copula-based | Medium | Medium-high | High | Complex dependencies |
| GAN-based | High | High | Very high | Complex multimodal data |
| Differential privacy | High | Very high | Lower | Formal guarantees needed |

## FAQ

**Can synthetic data completely replace real data for model training?**
For testing and development, yes. For final model training, usually no — synthetic data may miss rare patterns, outliers, or subtle interactions. Use synthetic data for development and privacy-safe sharing, but validate final models on real data.

**How much noise should I add?**
Enough to prevent re-identification but not so much that utility is destroyed. Start with 5-10% of the variable's standard deviation and check both utility metrics (KS test, coefficient comparison) and privacy metrics (close-match percentage). Adjust iteratively.

**Is synthpop the only R package for synthetic data?**
No. Other options include `simPop` (for complex survey data), `simstudy` (for clinical trial simulation), `fabricatr` (for social science), and `MICE` (imputation-based synthesis). Choose based on your data type and use case.

## Continue Learning
- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework for data analysis
- [Data Privacy in R](Data-Privacy-in-R.html) — Anonymization and differential privacy techniques
- [Pre-Analysis Plans in R](Pre-Analysis-Plans-in-R.html) — Commit to your analysis before running it
