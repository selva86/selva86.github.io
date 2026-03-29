---
title: "Algorithmic Fairness in R: fairml & aif360 for Bias Auditing"
slug: "Algorithmic-Fairness-in-R"
description: "Audit machine learning models for fairness using R. Learn disparate impact, calibration, and practical bias auditing with fairml and aif360."
keywords: "algorithmic fairness R, fairml, aif360 R, bias auditing, disparate impact, model fairness, fairness metrics R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-data-1"
post_type: "FR"
auto_link_terms: "algorithmic fairness|fairml|bias auditing|disparate impact"
auto_link_case_sensitive: false
fr_parent: "Data-Ethics-in-R.html"
---

# Algorithmic Fairness in R: fairml & aif360 for Bias Auditing

<p class="lead">Algorithmic fairness ensures that machine learning models don't systematically discriminate against protected groups. This guide teaches you to measure, audit, and improve fairness using R tools — because a model that's accurate on average can still be unfair to specific groups.</p>

A hiring model that rejects 80% of female applicants but only 30% of male applicants is unfair — even if its overall accuracy is high. A credit scoring model that gives higher rates to minorities with the same creditworthiness as non-minorities is unfair. These aren't hypothetical: they've happened in real deployments. This guide gives you the tools to catch and fix these problems.

## Fairness Definitions

There are multiple definitions of fairness, and they can conflict with each other. Understanding them is essential for choosing the right one for your context.

| Definition | Meaning | Formula |
|-----------|---------|---------|
| Demographic parity | Equal selection rates across groups | P(Y=1\|A=a) = P(Y=1\|A=b) |
| Equalized odds | Equal TPR and FPR across groups | P(Yhat=1\|Y=y,A=a) = P(Yhat=1\|Y=y,A=b) |
| Equal opportunity | Equal TPR across groups | P(Yhat=1\|Y=1,A=a) = P(Yhat=1\|Y=1,A=b) |
| Calibration | Same meaning of scores across groups | P(Y=1\|Score=s,A=a) = P(Y=1\|Score=s,A=b) |
| Predictive parity | Equal precision across groups | P(Y=1\|Yhat=1,A=a) = P(Y=1\|Yhat=1,A=b) |
| Individual fairness | Similar individuals treated similarly | d(x,x') small implies d(f(x),f(x')) small |

### The Impossibility Theorem

A critical result: except in trivial cases, you **cannot** simultaneously satisfy demographic parity, equalized odds, and calibration. You must choose which fairness criterion matters most for your application.

```r
# Demonstrating the fairness trade-off
set.seed(42)
n <- 1000

# Simulate two groups with different base rates
group <- rep(c("A","B"), each = n/2)
base_rate <- ifelse(group == "A", 0.4, 0.2)  # Different base rates
true_label <- rbinom(n, 1, base_rate)

# A perfectly calibrated model
score <- true_label + rnorm(n, 0, 0.3)
predicted <- as.integer(score > 0.5)

cat("=== Fairness Trade-off Demo ===\n")
cat("Base rates differ between groups:\n")
cat("  Group A base rate:", mean(true_label[group == "A"]), "\n")
cat("  Group B base rate:", mean(true_label[group == "B"]), "\n")

cat("\nSelection rates (demographic parity check):\n")
cat("  Group A:", mean(predicted[group == "A"]), "\n")
cat("  Group B:", mean(predicted[group == "B"]), "\n")

cat("\nTrue Positive Rates (equal opportunity check):\n")
tpr_a <- mean(predicted[group == "A" & true_label == 1])
tpr_b <- mean(predicted[group == "B" & true_label == 1])
cat("  Group A TPR:", round(tpr_a, 3), "\n")
cat("  Group B TPR:", round(tpr_b, 3), "\n")

cat("\nEqualizing selection rates would break calibration.\n")
cat("Equalizing TPR would change selection rates.\n")
cat("You must choose which fairness criterion to prioritize.\n")
```

## Measuring Disparate Impact

The four-fifths rule: the selection rate for any protected group should be at least 80% of the rate for the most-selected group.

```r
# Comprehensive disparate impact analysis
set.seed(42)
n <- 800

applicants <- data.frame(
  gender = sample(c("Male","Female"), n, replace = TRUE),
  score = rnorm(n, 70, 10)
)

# Biased threshold: unconsciously favoring one group
applicants$hired <- with(applicants, {
  threshold <- ifelse(gender == "Male", 65, 70)
  as.integer(score > threshold)
})

# Disparate impact analysis
cat("=== Disparate Impact Analysis ===\n")
hire_rates <- tapply(applicants$hired, applicants$gender, mean)
cat("Hiring rates:\n")
print(round(hire_rates, 3))

di_ratio <- min(hire_rates) / max(hire_rates)
cat(sprintf("\nDisparate impact ratio: %.3f\n", di_ratio))
cat(sprintf("Four-fifths threshold: 0.800\n"))
cat(sprintf("Result: %s\n", ifelse(di_ratio >= 0.8, "PASS", "FAIL - potential bias")))

# Statistical significance
cat("\n=== Chi-square test ===\n")
ct <- table(applicants$gender, applicants$hired)
chi <- chisq.test(ct)
cat(sprintf("Chi-squared = %.2f, p = %.4f\n", chi$statistic, chi$p.value))
```

## Building a Fairness Audit Function

```r
# Reusable fairness audit function
fairness_audit <- function(actual, predicted, group, positive_label = 1) {
  groups <- unique(group)
  results <- data.frame(
    Group = character(),
    N = integer(),
    SelectionRate = numeric(),
    TPR = numeric(),
    FPR = numeric(),
    Precision = numeric(),
    stringsAsFactors = FALSE
  )

  for (g in groups) {
    mask <- group == g
    a <- actual[mask]
    p <- predicted[mask]

    tp <- sum(a == positive_label & p == positive_label)
    fp <- sum(a != positive_label & p == positive_label)
    fn <- sum(a == positive_label & p != positive_label)
    tn <- sum(a != positive_label & p != positive_label)

    results <- rbind(results, data.frame(
      Group = g,
      N = sum(mask),
      SelectionRate = round(mean(p == positive_label), 3),
      TPR = round(ifelse(tp+fn > 0, tp/(tp+fn), NA), 3),
      FPR = round(ifelse(fp+tn > 0, fp/(fp+tn), NA), 3),
      Precision = round(ifelse(tp+fp > 0, tp/(tp+fp), NA), 3),
      stringsAsFactors = FALSE
    ))
  }

  # Calculate disparities
  cat("=== Fairness Audit Report ===\n\n")
  print(results, row.names = FALSE)

  cat("\n--- Disparity Ratios ---\n")
  max_sr <- max(results$SelectionRate)
  for (i in 1:nrow(results)) {
    ratio <- results$SelectionRate[i] / max_sr
    status <- ifelse(ratio >= 0.8, "OK", "WARNING")
    cat(sprintf("  %s: SR ratio = %.3f [%s]\n",
                results$Group[i], ratio, status))
  }

  cat(sprintf("\n--- Equal Opportunity (TPR) ---\n"))
  max_tpr <- max(results$TPR, na.rm = TRUE)
  for (i in 1:nrow(results)) {
    ratio <- results$TPR[i] / max_tpr
    cat(sprintf("  %s: TPR ratio = %.3f\n", results$Group[i], ratio))
  }
}

# Test the audit function
set.seed(42)
n <- 600
test_data <- data.frame(
  group = sample(c("Young","Middle","Senior"), n, replace = TRUE, prob = c(0.4,0.4,0.2)),
  actual = rbinom(n, 1, 0.3),
  predicted = rbinom(n, 1, 0.28)
)

fairness_audit(test_data$actual, test_data$predicted, test_data$group)
```

## Fairness Packages in R

### fairml Package

The `fairml` package implements fair regression and classification models that explicitly include fairness constraints.

```r
# fairml concepts (demonstration without package dependency)
cat("=== fairml Package Overview ===\n\n")
cat("Key functions:\n")
cat("  frrm()   - Fair Ridge Regression Model\n")
cat("  fgrrm()  - Fair Generalized Ridge Regression\n")
cat("  nclm()   - Nonconvex Penalized Logistic Model\n")
cat("  zlrm()   - Zafar Logistic Regression Model\n\n")

cat("Usage pattern:\n")
cat('  library(fairml)\n')
cat('  model <- frrm(y ~ x1 + x2, data = df,\n')
cat('                sensitive = df$protected_attr,\n')
cat('                unfairness = 0.05)  # Max allowed unfairness\n\n')

cat("The unfairness parameter (0 to 1) controls the trade-off:\n")
cat("  0.00 = Perfectly fair (may sacrifice accuracy)\n")
cat("  0.05 = 5% unfairness tolerance (good balance)\n")
cat("  1.00 = No fairness constraint (standard model)\n")
```

### aif360 (AI Fairness 360)

```r
cat("=== AIF360 for R ===\n\n")
cat("IBM's AI Fairness 360 toolkit (Python-based, R interface available):\n\n")

cat("Bias metrics:\n")
cat("  - Statistical parity difference\n")
cat("  - Disparate impact ratio\n")
cat("  - Equal opportunity difference\n")
cat("  - Average odds difference\n")
cat("  - Theil index\n\n")

cat("Bias mitigation algorithms:\n")
cat("  Pre-processing:  Reweighting, Optimized Preprocessing\n")
cat("  In-processing:   Adversarial Debiasing, Prejudice Remover\n")
cat("  Post-processing: Equalized Odds, Calibrated Equalized Odds\n\n")

cat("R usage via reticulate:\n")
cat('  library(reticulate)\n')
cat('  aif <- import("aif360.datasets")\n')
cat('  metrics <- import("aif360.metrics")\n')
```

## Practical Audit Workflow

| Step | Action | Tool |
|------|--------|------|
| 1. Define protected attributes | List sensitive variables | Domain knowledge |
| 2. Choose fairness metric | Match to application context | See definitions table above |
| 3. Measure baseline | Calculate metrics on current model | `fairness_audit()` function |
| 4. Set threshold | Define acceptable disparity level | Four-fifths rule or domain-specific |
| 5. Mitigate if needed | Apply debiasing technique | fairml, reweighting, threshold tuning |
| 6. Re-measure | Verify improvement | Same audit function |
| 7. Document | Record decisions and trade-offs | Analysis report |

```r
# Step 5 example: threshold tuning for fairness
set.seed(42)
n <- 500

df <- data.frame(
  group = rep(c("A","B"), each = n/2),
  score = c(rnorm(n/2, 0.6, 0.2), rnorm(n/2, 0.5, 0.2)),
  actual = c(rbinom(n/2, 1, 0.6), rbinom(n/2, 1, 0.4))
)

# Single threshold: may create disparate impact
single_threshold <- 0.5
df$pred_single <- as.integer(df$score > single_threshold)

# Group-specific thresholds: equalize selection rates
target_rate <- mean(df$actual)
thresh_a <- quantile(df$score[df$group == "A"], 1 - target_rate)
thresh_b <- quantile(df$score[df$group == "B"], 1 - target_rate)
df$pred_adjusted <- ifelse(df$group == "A",
                           as.integer(df$score > thresh_a),
                           as.integer(df$score > thresh_b))

cat("=== Threshold Tuning ===\n")
cat("Single threshold (0.5):\n")
cat("  Group A rate:", mean(df$pred_single[df$group == "A"]), "\n")
cat("  Group B rate:", mean(df$pred_single[df$group == "B"]), "\n")

cat("\nAdjusted thresholds:\n")
cat("  Group A threshold:", round(thresh_a, 3), "-> rate:",
    mean(df$pred_adjusted[df$group == "A"]), "\n")
cat("  Group B threshold:", round(thresh_b, 3), "-> rate:",
    mean(df$pred_adjusted[df$group == "B"]), "\n")
```

## Summary

| Fairness Criterion | Best For | Trade-off |
|-------------------|---------|-----------|
| Demographic parity | Employment, lending | May select less qualified from one group |
| Equalized odds | Criminal justice, medical | Harder to achieve with different base rates |
| Equal opportunity | Scholarship, hiring | Only equalizes true positive rate |
| Calibration | Risk assessment, insurance | Doesn't guarantee equal rates |
| Individual fairness | Any | Hard to define similarity metric |

## FAQ

**Which fairness metric should I use?**
It depends on context. For hiring: demographic parity or disparate impact. For criminal risk: equalized odds (equal TPR and FPR). For medical diagnostics: equal opportunity (equal sensitivity). Discuss with stakeholders and domain experts — this is not a purely technical decision.

**Can I just remove the protected attribute from the model?**
No. This is "fairness through unawareness" and it doesn't work because other features (zip code, name patterns, school attended) can serve as proxies. You need to test outcomes by protected group regardless.

**Is there a legal requirement for algorithmic fairness?**
Increasingly, yes. The EU AI Act classifies hiring and credit models as "high-risk" requiring bias audits. US agencies (EEOC, CFPB) use disparate impact analysis. Several US states have enacted algorithmic accountability laws. The legal landscape is evolving rapidly.

## What's Next

- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework
- [Bias in Data & Models](Bias-in-Data-and-Models.html) — Detecting bias at the data level
- [Synthetic Data in R](Synthetic-Data-in-R.html) — Generate unbiased synthetic datasets
