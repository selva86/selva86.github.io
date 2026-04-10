---
title: "Pre-Analysis Plans in R: Commit Before You Analyze"
slug: "Pre-Analysis-Plans-in-R"
description: "Write pre-analysis plans in R using DeclareDesign and AsPredicted. Lock your hypotheses before seeing data to avoid p-hacking and HARKing."
keywords: "pre-analysis plan R, preregistration, DeclareDesign, AsPredicted, registered report, research transparency R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-data-3"
post_type: "FR"
auto_link_terms: "pre-analysis plan|preregistration|DeclareDesign|registered report"
auto_link_case_sensitive: false
fr_parent: "Data-Ethics-in-R.html"
---

# Pre-Analysis Plans in R: Commit Before You Analyze

<p class="lead">A pre-analysis plan is a public commitment to your research design, hypotheses, and analysis approach — written and registered before you look at the data. It's the single most effective tool against p-hacking, HARKing, and the garden of forking paths.</p>

Imagine a poker player who gets to see all the cards before placing a bet. That's what an unregistered analysis looks like: you see the data, then "predict" what you'll find. Pre-analysis plans level the playing field by forcing you to commit your bet before the cards are dealt.

## What Goes in a Pre-Analysis Plan?

| Section | Contents | Why It Matters |
|---------|----------|---------------|
| Hypotheses | Specific, testable predictions | Prevents HARKing |
| Design | Sample size, randomization, data collection | Prevents optional stopping |
| Variables | Definitions, measurement, coding | Prevents specification searching |
| Primary analysis | Exact statistical test(s) | Prevents multiple testing |
| Secondary analyses | Exploratory analyses (labeled as such) | Maintains transparency |
| Exclusion criteria | Rules for dropping observations | Prevents selective exclusion |
| Multiple testing | Correction method | Controls false positive rate |
| Power analysis | Sample size justification | Ensures adequate power |

## The Pre-Registration Workflow

```r
# Step 1: Design your study and write the plan BEFORE collecting/analyzing data
cat("=== Pre-Registration Workflow ===\n\n")

cat("BEFORE data collection:\n")
cat("  1. State hypotheses\n")
cat("  2. Define variables and measurement\n")
cat("  3. Specify sample size (with power analysis)\n")
cat("  4. Write exact analysis code (test on simulated data)\n")
cat("  5. Register on OSF, AsPredicted, or ClinicalTrials.gov\n")
cat("  6. Get a timestamped, immutable record\n\n")

cat("AFTER data collection:\n")
cat("  7. Run the pre-specified analysis (no deviations)\n")
cat("  8. Report ALL pre-registered results (including nulls)\n")
cat("  9. Label any additional analyses as 'exploratory'\n")
cat(" 10. Link the publication to the registration\n")
```

## Step 1: Power Analysis

Before writing the plan, determine how many participants you need.

```r
# Power analysis for a two-sample t-test
power_analysis <- function(effect_size, alpha = 0.05, power = 0.80) {
  # Using the formula: n = (z_alpha + z_beta)^2 * 2 / d^2
  z_alpha <- qnorm(1 - alpha/2)
  z_beta <- qnorm(power)
  n_per_group <- ceiling((z_alpha + z_beta)^2 * 2 / effect_size^2)
  n_per_group
}

cat("=== Power Analysis ===\n")
cat("Two-sample t-test, alpha = 0.05, power = 0.80\n\n")

effect_sizes <- c(0.2, 0.5, 0.8)
labels <- c("Small", "Medium", "Large")

for (i in seq_along(effect_sizes)) {
  n <- power_analysis(effect_sizes[i])
  cat(sprintf("  %s effect (d=%.1f): n = %d per group (%d total)\n",
      labels[i], effect_sizes[i], n, 2*n))
}

cat("\nIn practice, use: power.t.test(delta, sd, power = 0.8)\n")

# Built-in power function
result <- power.t.test(delta = 5, sd = 10, power = 0.80)
cat(sprintf("\nExample: Detect 5-point difference (SD=10):\n"))
cat(sprintf("  n = %d per group\n", ceiling(result$n)))
```

## Step 2: Write the Analysis Code on Simulated Data

The key insight: write and test your entire analysis before seeing the real data.

```r
# Pre-specified analysis code, tested on simulated data
set.seed(42)

# Simulate data matching your expected design
n_per_group <- 50
simulated_data <- data.frame(
  id = 1:(2 * n_per_group),
  condition = rep(c("control", "treatment"), each = n_per_group),
  age = round(rnorm(2 * n_per_group, 35, 10)),
  pre_score = round(rnorm(2 * n_per_group, 50, 12)),
  post_score = NA
)

# Simulate treatment effect (d = 0.5)
simulated_data$post_score <- with(simulated_data, {
  effect <- ifelse(condition == "treatment", 6, 0)  # 6-point improvement
  pre_score + effect + rnorm(length(pre_score), 0, 8)
})

simulated_data$change <- simulated_data$post_score - simulated_data$pre_score

# === PRE-SPECIFIED ANALYSIS (this exact code runs on real data later) ===

# Primary analysis: t-test on change scores
cat("=== Primary Analysis (on simulated data) ===\n")
primary_test <- t.test(change ~ condition, data = simulated_data)
cat(sprintf("Mean change (control): %.2f\n",
    mean(simulated_data$change[simulated_data$condition == "control"])))
cat(sprintf("Mean change (treatment): %.2f\n",
    mean(simulated_data$change[simulated_data$condition == "treatment"])))
cat(sprintf("t = %.3f, p = %.4f\n", primary_test$statistic, primary_test$p.value))

# Effect size
pooled_sd <- sqrt(mean(tapply(simulated_data$change, simulated_data$condition, var)))
cohens_d <- diff(tapply(simulated_data$change, simulated_data$condition, mean)) / pooled_sd
cat(sprintf("Cohen's d = %.3f\n", abs(cohens_d)))

# Secondary analysis (labeled as exploratory)
cat("\n=== Secondary Analysis: ANCOVA controlling for pre_score ===\n")
ancova <- lm(post_score ~ condition + pre_score, data = simulated_data)
coefs <- summary(ancova)$coefficients
cat(sprintf("Treatment effect (adjusted): %.2f, p = %.4f\n",
    coefs["conditiontreatment", "Estimate"],
    coefs["conditiontreatment", "Pr(>|t|)"]))
```

## Step 3: Register on a Platform

### AsPredicted.org

```r
cat("=== AsPredicted Template ===\n\n")

plan <- list(
  "1. Data collection" = "Has data collection begun? NO",
  "2. Hypothesis" = "Treatment group will show greater improvement in test scores
   than control group (directional, one-tailed).",
  "3. Dependent variable" = "Change score = post_score - pre_score",
  "4. Conditions" = "2 groups: control (business-as-usual), treatment (intervention)",
  "5. Analyses" = "Primary: Welch's t-test on change scores.
   Secondary: ANCOVA with pre_score as covariate.",
  "6. Outliers" = "Exclude participants with change scores > 3 SD from group mean.
   Criterion specified before data collection.",
  "7. Sample size" = "n = 50 per group (100 total).
   Power = 0.80 for d = 0.5 at alpha = 0.05.",
  "8. Other" = "Multiple comparison correction: N/A (single primary test).
   Missing data: complete case analysis (report dropout rates)."
)

for (q in names(plan)) {
  cat(sprintf("%s\n  %s\n\n", q, plan[[q]]))
}
```

### OSF (Open Science Framework)

```r
cat("=== OSF Registration ===\n\n")
cat("Steps:\n")
cat("  1. Create project at osf.io\n")
cat("  2. Add pre-analysis plan document\n")
cat("  3. Add analysis code (R scripts)\n")
cat("  4. Choose registration template:\n")
cat("     - AsPredicted\n")
cat("     - OSF Standard Pre-Data Collection\n")
cat("     - Registered Report Protocol\n")
cat("  5. Submit registration (creates timestamped, immutable record)\n\n")

cat("R integration with osfr package:\n")
cat('  library(osfr)\n')
cat('  project <- osf_create_project("My Study")\n')
cat('  osf_upload(project, "pre_analysis_plan.pdf")\n')
cat('  osf_upload(project, "analysis_code.R")\n')
```

## DeclareDesign: Simulate Your Entire Study

The `DeclareDesign` package lets you simulate your research design, run power analyses, and identify potential problems before collecting data.

```r
# DeclareDesign concepts (without package dependency for WebR)
cat("=== DeclareDesign Framework ===\n\n")

cat("Four components of a research design:\n\n")
cat("1. MODEL (M): What you believe about the world\n")
cat("   - Population size, variable distributions\n")
cat("   - Treatment effect size and direction\n\n")

cat("2. INQUIRY (I): What you want to learn\n")
cat("   - Average Treatment Effect (ATE)\n")
cat("   - Subgroup effects, interactions\n\n")

cat("3. DATA STRATEGY (D): How you collect data\n")
cat("   - Sampling method\n")
cat("   - Randomization procedure\n")
cat("   - Sample size\n\n")

cat("4. ANSWER STRATEGY (A): How you analyze\n")
cat("   - Statistical test\n")
cat("   - Estimation method\n")
cat("   - Inference approach\n\n")

cat("DeclareDesign code:\n")
cat('  design <- declare_model(N = 100, U = rnorm(N),\n')
cat('    potential_outcomes(Y ~ 0.5 * Z + U)) +\n')
cat('  declare_inquiry(ATE = mean(Y_Z_1 - Y_Z_0)) +\n')
cat('  declare_assignment(Z = complete_ra(N)) +\n')
cat('  declare_measurement(Y = reveal_outcomes(Y ~ Z)) +\n')
cat('  declare_estimator(Y ~ Z, .method = lm_robust)\n\n')
cat('  diagnose_design(design)  # Power, bias, coverage\n')
```

## Simulating Design Diagnostics

```r
# Manual simulation of design diagnostics
set.seed(42)
n_sims <- 500
n_per_group <- 40
true_effect <- 5
true_sd <- 12

results <- data.frame(
  estimate = numeric(n_sims),
  p_value = numeric(n_sims),
  ci_lower = numeric(n_sims),
  ci_upper = numeric(n_sims)
)

for (i in 1:n_sims) {
  control <- rnorm(n_per_group, 50, true_sd)
  treatment <- rnorm(n_per_group, 50 + true_effect, true_sd)
  test <- t.test(treatment, control)

  results$estimate[i] <- diff(test$estimate)
  results$p_value[i] <- test$p.value
  results$ci_lower[i] <- test$conf.int[1]
  results$ci_upper[i] <- test$conf.int[2]
}

cat("=== Design Diagnostics (500 simulations) ===\n")
cat(sprintf("True effect: %.1f\n", true_effect))
cat(sprintf("Mean estimate: %.2f (bias: %.2f)\n",
    mean(results$estimate), mean(results$estimate) - true_effect))
cat(sprintf("Power: %.1f%% (reject H0 at alpha=0.05)\n",
    100 * mean(results$p_value < 0.05)))
cat(sprintf("Coverage: %.1f%% (95%% CI contains true effect)\n",
    100 * mean(results$ci_lower < true_effect & results$ci_upper > true_effect)))
cat(sprintf("Type S error: %.1f%% (significant but wrong sign)\n",
    100 * mean(results$p_value < 0.05 & results$estimate < 0)))
cat(sprintf("Mean significant effect: %.2f (exaggeration ratio: %.2f)\n",
    mean(results$estimate[results$p_value < 0.05]),
    mean(abs(results$estimate[results$p_value < 0.05])) / true_effect))
```

## Summary: Pre-Analysis Plan Template

| Section | What to Include |
|---------|----------------|
| Title & authors | Study name, investigators |
| Hypotheses | Numbered, specific, directional |
| Design | Groups, randomization, timeline |
| Sample | Size, power justification, eligibility |
| Variables | Names, definitions, measurement method |
| Primary analysis | Exact test, software, options |
| Secondary analyses | Clearly labeled as exploratory |
| Exclusion criteria | Pre-specified rules |
| Multiple testing | Correction method if >1 primary test |
| Missing data | Handling strategy |

## FAQ

**What if I discover something unexpected in the data?**
Report it! But label it clearly as an "exploratory finding" that was not pre-registered. This is perfectly acceptable and expected. The problem is presenting exploratory findings as if they were predicted all along (HARKing).

**Can I update my pre-analysis plan?**
Yes, but only before you look at the data. If circumstances change (e.g., lower-than-expected recruitment), you can file an amendment. After seeing the data, any changes must be reported as deviations from the plan.

**Is pre-registration required for publication?**
Not universally, but increasingly expected. Many journals offer "Registered Reports" where the study is accepted based on the design alone (before results are known). This eliminates publication bias because the paper is accepted regardless of whether results are significant.

## Continue Learning
- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework
- [Reproducibility Crisis](Reproducibility-Crisis.html) — Why pre-registration matters
- [Open Science with R](Open-Science-with-R.html) — The full open science workflow
