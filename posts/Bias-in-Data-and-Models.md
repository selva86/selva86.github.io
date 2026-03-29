---
title: "Bias in Data & Models: How to Detect & Reduce It in R"
slug: "Bias-in-Data-and-Models"
description: "Learn to detect and reduce bias in data and models using R. Covers selection bias, measurement bias, algorithmic bias, fairness metrics, and debiasing."
keywords: "bias in data, algorithmic bias R, fairness metrics, selection bias, measurement bias, debiasing techniques R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.6.2"
post_type: "C"
auto_link_terms: "bias in data|algorithmic bias|fairness metrics|selection bias"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Bias in Data & Models"
sidebar_order: 51
---

# Bias in Data & Models: How to Detect & Reduce It in R

<p class="lead">Bias in data and models can lead to unfair decisions, flawed research, and real-world harm. This guide teaches you to identify common types of bias, measure them quantitatively, and apply debiasing techniques in R.</p>

Every dataset reflects the process that created it — including its flaws. If your training data under-represents a group, your model will perform worse for that group. If your survey only reaches internet users, it misses offline populations. Recognizing and addressing these biases is a core skill for responsible data analysis.

## Types of Bias in Data

### Selection Bias

Occurs when your sample is not representative of the population you want to study.

| Type | Description | Example |
|------|-------------|---------|
| Survivorship bias | Only observing "survivors" | Studying successful companies while ignoring failed ones |
| Self-selection bias | Participants choose to join | Voluntary surveys over-represent motivated people |
| Convenience sampling | Using whoever is available | Surveying only college students for a population study |
| Exclusion bias | Systematically excluding groups | Medical trials excluding elderly patients |
| Berkson's bias | Selection conditioned on outcome | Hospital studies finding spurious disease correlations |

```r
# Demonstration: Survivorship bias
set.seed(42)

# True population: 1000 startups, most fail
n_startups <- 1000
true_risk <- runif(n_startups, 0, 1)  # Risk tolerance score
success <- rbinom(n_startups, 1, prob = 0.3 - 0.1 * true_risk)  # Higher risk = lower success

cat("=== Survivorship Bias Demo ===\n")
cat("Full population - Avg risk score:", round(mean(true_risk), 3), "\n")
cat("Survivors only - Avg risk score:", round(mean(true_risk[success == 1]), 3), "\n")
cat("\nConclusion from survivors: 'Successful startups are less risky'\n")
cat("Truth: We just can't see the risky ones that also failed.\n")
```

### Measurement Bias

Occurs when your measurement instrument systematically distorts values.

```r
# Demonstration: Measurement bias in survey responses
set.seed(123)
n <- 200

# True satisfaction (1-10 scale)
true_satisfaction <- round(rnorm(n, mean = 5, sd = 2))
true_satisfaction <- pmin(pmax(true_satisfaction, 1), 10)

# Biased measurement: people tend to give socially desirable answers
# (satisfaction inflated by ~1.5 points on average)
measured_satisfaction <- pmin(true_satisfaction + rpois(n, 1.5), 10)

cat("=== Measurement Bias Demo ===\n")
cat("True mean satisfaction:", round(mean(true_satisfaction), 2), "\n")
cat("Measured mean satisfaction:", round(mean(measured_satisfaction), 2), "\n")
cat("Bias:", round(mean(measured_satisfaction) - mean(true_satisfaction), 2), "points\n")
```

### Algorithmic Bias

Occurs when a model produces systematically different outcomes for different groups.

```r
# Demonstration: A model that performs differently by group
set.seed(42)
n <- 500

group <- rep(c("A", "B"), each = n/2)
# Group B has less training data quality (noisier features)
x <- ifelse(group == "A", rnorm(n, 5, 1), rnorm(n, 5, 2))
y <- 2 * x + rnorm(n, 0, 1)

# Fit single model
model <- lm(y ~ x)

# Check performance by group
pred <- predict(model)
resid_a <- y[group == "A"] - pred[group == "A"]
resid_b <- y[group == "B"] - pred[group == "B"]

cat("=== Differential Model Performance ===\n")
cat("Group A - RMSE:", round(sqrt(mean(resid_a^2)), 3), "\n")
cat("Group B - RMSE:", round(sqrt(mean(resid_b^2)), 3), "\n")
cat("\nThe model works worse for Group B because their data is noisier.\n")
cat("This is algorithmic bias: same model, unequal outcomes.\n")
```

## Detecting Bias in Your Data

### Step 1: Check Representation

```r
# Are all groups adequately represented?
cat("=== Checking Group Representation ===\n")

# Simulated applicant data
set.seed(42)
applicants <- data.frame(
  gender = sample(c("M","F"), 300, replace = TRUE, prob = c(0.7, 0.3)),
  age_group = sample(c("18-30","31-45","46-60","60+"), 300, replace = TRUE,
                     prob = c(0.4, 0.35, 0.2, 0.05)),
  hired = sample(0:1, 300, replace = TRUE, prob = c(0.6, 0.4))
)

cat("Gender distribution:\n")
print(round(prop.table(table(applicants$gender)) * 100, 1))
cat("\nAge group distribution:\n")
print(round(prop.table(table(applicants$age_group)) * 100, 1))
cat("\nHiring rate by gender:\n")
print(round(prop.table(table(applicants$gender, applicants$hired), margin = 1) * 100, 1))
```

### Step 2: Measure Disparate Impact

The "four-fifths rule" from US employment law: the selection rate for any group should be at least 80% of the rate for the highest-selected group.

```r
# Four-fifths rule check
cat("=== Disparate Impact Analysis ===\n")

hire_rates <- tapply(applicants$hired, applicants$gender, mean)
cat("Hiring rates:\n")
print(round(hire_rates, 3))

max_rate <- max(hire_rates)
disparate_impact <- hire_rates / max_rate
cat("\nDisparate impact ratios (vs highest group):\n")
print(round(disparate_impact, 3))
cat("\nFour-fifths threshold: 0.80\n")

for (g in names(disparate_impact)) {
  status <- ifelse(disparate_impact[g] >= 0.8, "PASS", "FAIL (potential bias)")
  cat(sprintf("  %s: %.3f - %s\n", g, disparate_impact[g], status))
}
```

### Step 3: Fairness Metrics

```r
# Common fairness metrics
set.seed(42)
n <- 400

# Simulated predictions with group information
eval_data <- data.frame(
  group = rep(c("A","B"), each = n/2),
  actual = c(rbinom(n/2, 1, 0.5), rbinom(n/2, 1, 0.5)),
  predicted = c(rbinom(n/2, 1, 0.52), rbinom(n/2, 1, 0.45))
)

# Calculate metrics by group
calc_metrics <- function(actual, predicted) {
  tp <- sum(actual == 1 & predicted == 1)
  fp <- sum(actual == 0 & predicted == 1)
  fn <- sum(actual == 1 & predicted == 0)
  tn <- sum(actual == 0 & predicted == 0)
  c(TPR = tp/(tp+fn), FPR = fp/(fp+tn), Precision = tp/(tp+fp), Accuracy = (tp+tn)/length(actual))
}

cat("=== Fairness Metrics by Group ===\n")
for (g in unique(eval_data$group)) {
  sub <- eval_data[eval_data$group == g, ]
  metrics <- round(calc_metrics(sub$actual, sub$predicted), 3)
  cat(sprintf("\nGroup %s:\n", g))
  cat(sprintf("  True Positive Rate:  %.3f\n", metrics["TPR"]))
  cat(sprintf("  False Positive Rate: %.3f\n", metrics["FPR"]))
  cat(sprintf("  Precision:           %.3f\n", metrics["Precision"]))
  cat(sprintf("  Accuracy:            %.3f\n", metrics["Accuracy"]))
}
```

## Debiasing Techniques

| Technique | When to Use | R Implementation |
|-----------|------------|-----------------|
| Resampling | Under-represented groups | Over/under-sample minority/majority |
| Reweighting | Unequal group sizes | `weights` argument in model functions |
| Stratification | Ensure balanced analysis | `strata` argument in `sample()` |
| Blinding | Remove protected attributes | Drop sensitive columns before modeling |
| Calibration | Predictions differ by group | Post-hoc calibration per group |
| Adversarial debiasing | Systematic model bias | fairml package |

```r
# Debiasing through reweighting
cat("=== Reweighting Example ===\n")

# Unbalanced data: Group A is over-represented
set.seed(42)
df <- data.frame(
  group = c(rep("A", 80), rep("B", 20)),
  x = rnorm(100),
  y = c(rnorm(80, 1), rnorm(20, 1.5))
)

# Unweighted means
cat("Unweighted means:\n")
print(tapply(df$y, df$group, mean))

# Create inverse-frequency weights
group_counts <- table(df$group)
df$weight <- 1 / group_counts[df$group]
df$weight <- df$weight / sum(df$weight) * nrow(df)

# Weighted mean
cat("\nWeighted overall mean:", round(weighted.mean(df$y, df$weight), 3), "\n")
cat("Simple overall mean:", round(mean(df$y), 3), "\n")
cat("\nReweighting gives Group B proportional influence.\n")
```

## Exercises

### Exercise 1: Identify the Bias

A hospital study finds that patients with two diseases simultaneously have better outcomes than patients with either disease alone. What type of bias might explain this?

```r
cat("=== Answer ===\n")
cat("This is Berkson's bias (collider bias).\n")
cat("Patients are in the hospital BECAUSE they have a disease.\n")
cat("Having two diseases together in hospitalized patients doesn't\n")
cat("reflect the general population — it reflects admission criteria.\n")
cat("Patients with mild forms of both diseases get admitted, while\n")
cat("patients with only one disease must have a severe case to be admitted.\n")
```

### Exercise 2: Disparate Impact Calculation

Calculate the disparate impact ratio from the following hiring data: Group X: 40 out of 100 hired. Group Y: 20 out of 80 hired.

```r
rate_x <- 40/100
rate_y <- 20/80
ratio <- min(rate_x, rate_y) / max(rate_x, rate_y)

cat("Group X hiring rate:", rate_x, "\n")
cat("Group Y hiring rate:", rate_y, "\n")
cat("Disparate impact ratio:", round(ratio, 3), "\n")
cat("Four-fifths threshold: 0.80\n")
cat("Result:", ifelse(ratio >= 0.8, "No disparate impact", "Potential disparate impact"), "\n")
```

## Summary

| Bias Type | How to Detect | How to Mitigate |
|-----------|--------------|-----------------|
| Selection bias | Compare sample vs population demographics | Stratified sampling, reweighting |
| Measurement bias | Calibration studies, inter-rater reliability | Better instruments, bias correction |
| Algorithmic bias | Fairness metrics by group | Resampling, reweighting, fairness constraints |
| Reporting bias | Compare pre-registered plan vs paper | Pre-registration, registered reports |
| Confirmation bias | Peer review, adversarial collaboration | Blinding, pre-registration |

## FAQ

**Can you ever fully eliminate bias?**
No. Every dataset and model has some bias. The goal is to identify the most impactful biases, measure them, and reduce them to acceptable levels. Documentation is key — state what biases remain and their likely impact.

**Is removing the sensitive attribute (like race or gender) enough?**
No, this is called "fairness through unawareness" and it doesn't work. Other variables (zip code, name, school) can be proxies for the removed attribute. You need to test outcomes by group even after removing the attribute.

**What fairness metric should I use?**
It depends on the context. Demographic parity (equal selection rates) is appropriate for some cases. Equalized odds (equal TPR and FPR) is better when accuracy matters per group. No single metric works for all situations — and some are mathematically incompatible.

## What's Next

- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework for data analysis
- [Algorithmic Fairness in R](Algorithmic-Fairness-in-R.html) — Deep dive into fairml and aif360
- [Reproducibility Crisis](Reproducibility-Crisis.html) — How sloppy practices undermine science
