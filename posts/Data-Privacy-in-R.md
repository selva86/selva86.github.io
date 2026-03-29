---
title: "Data Privacy in R: Anonymization, Differential Privacy & GDPR Compliance"
slug: "Data-Privacy-in-R"
description: "Protect sensitive data in R with k-anonymity, l-diversity, sdcMicro, differential privacy, and a practical GDPR compliance checklist."
keywords: "data privacy R, anonymization R, k-anonymity, differential privacy R, GDPR R, sdcMicro, data protection"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.6.4"
post_type: "C"
auto_link_terms: "data privacy|anonymization|k-anonymity|differential privacy|GDPR"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Data Privacy in R"
sidebar_order: 53
---

# Data Privacy in R: Anonymization, Differential Privacy & GDPR Compliance

<p class="lead">Data privacy is not optional — it's a legal requirement in most jurisdictions and an ethical imperative everywhere. This guide teaches you practical techniques for protecting sensitive data in R, from simple anonymization to formal differential privacy guarantees.</p>

You have a dataset with personal information. Before you can analyze it, share it, or publish results from it, you need to protect the individuals in it. Simply removing names and IDs is not enough — research shows that 87% of Americans can be uniquely identified by just zip code, birth date, and gender. This guide gives you the tools and techniques to do privacy right.

## The Privacy Landscape

### Key Regulations

| Regulation | Region | Key Requirements |
|-----------|--------|-----------------|
| GDPR | EU/EEA | Lawful basis, data minimization, right to erasure, DPIAs |
| CCPA/CPRA | California | Right to know, delete, opt out of sale |
| HIPAA | US (healthcare) | De-identification standard, safe harbor |
| FERPA | US (education) | Consent for education records disclosure |
| PIPEDA | Canada | Consent, limiting collection, accuracy |

### Types of Identifiers

| Category | Examples | Risk Level |
|----------|---------|-----------|
| Direct identifiers | Name, SSN, email, phone | Very high — remove always |
| Quasi-identifiers | Age, zip code, gender, job title | High — can re-identify in combination |
| Sensitive attributes | Diagnosis, salary, religion | High — must protect |
| Non-sensitive attributes | Purchase count, click count | Low — usually safe |

## Anonymization Techniques in R

### 1. Suppression and Generalization

The simplest techniques: remove identifying fields or make them less specific.

```r
# Original data with PII
original <- data.frame(
  name = c("Alice Smith", "Bob Jones", "Carol Lee", "Dave Kim", "Eve Brown"),
  age = c(28, 34, 45, 52, 31),
  zipcode = c("02139", "02138", "02139", "02140", "02138"),
  salary = c(65000, 82000, 71000, 95000, 58000),
  diagnosis = c("Flu", "Diabetes", "Flu", "Cancer", "Diabetes")
)

cat("=== Original Data ===\n")
print(original)

# Anonymized: suppress direct IDs, generalize quasi-IDs
anonymized <- data.frame(
  id = paste0("P", 1:5),                                    # Pseudonymous ID
  age_group = cut(original$age, breaks = c(0,30,40,50,60),  # Generalize age
                  labels = c("20-30","31-40","41-50","51-60")),
  zipcode_3 = substr(original$zipcode, 1, 3),               # Generalize zip
  salary_band = cut(original$salary, breaks = c(0,60000,80000,100000),
                    labels = c("<60K","60-80K","80-100K")),
  diagnosis = original$diagnosis                              # Keep for analysis
)

cat("\n=== Anonymized Data ===\n")
print(anonymized)
```

### 2. K-Anonymity

A dataset is k-anonymous if every combination of quasi-identifiers appears at least k times. This means no individual can be distinguished from at least k-1 others.

```r
# Check k-anonymity
check_k_anonymity <- function(data, quasi_ids) {
  groups <- do.call(paste, data[quasi_ids])
  group_sizes <- table(groups)
  k <- min(group_sizes)
  cat("Quasi-identifiers:", paste(quasi_ids, collapse = ", "), "\n")
  cat("Group size distribution:\n")
  print(table(group_sizes))
  cat("k-anonymity level:", k, "\n")
  return(k)
}

# Test with the anonymized data
cat("=== K-Anonymity Check ===\n")
k <- check_k_anonymity(anonymized, c("age_group", "zipcode_3"))

cat("\nIf k = 1, someone could be uniquely identified.\n")
cat("Goal: k >= 5 for most applications.\n")
```

### 3. L-Diversity

K-anonymity isn't enough if everyone in a group has the same sensitive attribute. L-diversity requires that each group has at least L distinct values of the sensitive attribute.

```r
# Check l-diversity
check_l_diversity <- function(data, quasi_ids, sensitive) {
  groups <- do.call(paste, data[quasi_ids])
  unique_groups <- unique(groups)

  min_l <- Inf
  for (g in unique_groups) {
    mask <- groups == g
    l <- length(unique(data[mask, sensitive]))
    min_l <- min(min_l, l)
  }

  cat("Sensitive attribute:", sensitive, "\n")
  cat("l-diversity level:", min_l, "\n")
  return(min_l)
}

cat("=== L-Diversity Check ===\n")
l <- check_l_diversity(anonymized, c("age_group", "zipcode_3"), "diagnosis")
cat("\nIf l = 1, all people in a group share the same diagnosis\n")
cat("(attacker knows the diagnosis even without identifying the person).\n")
```

### 4. Data Perturbation

Add controlled noise to numeric values to prevent exact identification while preserving statistical properties.

```r
# Perturbation: add noise while preserving distributions
set.seed(42)
n <- 100
original_ages <- round(rnorm(n, 40, 12))
original_salaries <- round(rnorm(n, 70000, 15000))

# Add Laplace noise (better privacy properties than Gaussian)
laplace_noise <- function(n, scale) {
  u <- runif(n, -0.5, 0.5)
  -scale * sign(u) * log(1 - 2 * abs(u))
}

perturbed_ages <- round(original_ages + laplace_noise(n, 2))
perturbed_salaries <- round(original_salaries + laplace_noise(n, 3000))

cat("=== Perturbation Results ===\n")
cat(sprintf("Ages    - Original mean: %.1f, Perturbed mean: %.1f, Diff: %.2f\n",
    mean(original_ages), mean(perturbed_ages),
    abs(mean(original_ages) - mean(perturbed_ages))))
cat(sprintf("Salaries - Original mean: %.0f, Perturbed mean: %.0f, Diff: %.0f\n",
    mean(original_salaries), mean(perturbed_salaries),
    abs(mean(original_salaries) - mean(perturbed_salaries))))
cat(sprintf("\nOriginal SD(ages):  %.1f, Perturbed: %.1f\n",
    sd(original_ages), sd(perturbed_ages)))
cat("Noise preserves aggregate statistics while protecting individuals.\n")
```

## Differential Privacy

Differential privacy provides a mathematical guarantee: the output of a query changes very little whether or not any single individual's data is included.

```r
# Differential privacy: noisy counting
dp_count <- function(true_count, epsilon) {
  # Add Laplace noise with scale = 1/epsilon
  noise <- laplace_noise(1, 1/epsilon)
  max(0, round(true_count + noise))  # Clamp to non-negative
}

dp_mean <- function(values, epsilon, lower, upper) {
  # Clip values to known range
  clipped <- pmin(pmax(values, lower), upper)
  sensitivity <- (upper - lower) / length(values)
  noise <- laplace_noise(1, sensitivity / epsilon)
  mean(clipped) + noise
}

set.seed(42)
true_data <- c(52000, 61000, 48000, 73000, 55000, 67000, 59000, 82000, 45000, 64000)

cat("=== Differential Privacy Demo ===\n")
cat("True count:", length(true_data), "\n")
cat("True mean salary:", mean(true_data), "\n\n")

for (eps in c(0.1, 0.5, 1.0, 2.0)) {
  set.seed(42)
  dp_m <- dp_mean(true_data, eps, 30000, 100000)
  cat(sprintf("epsilon = %.1f: DP mean = %.0f (error: %.0f)\n",
      eps, dp_m, abs(dp_m - mean(true_data))))
}

cat("\nSmaller epsilon = more privacy but more noise.\n")
cat("epsilon = 1.0 is a common practical choice.\n")
```

## GDPR Compliance Checklist for R Users

| # | Requirement | Implementation in R |
|---|-----------|-------------------|
| 1 | Lawful basis for processing | Document in data provenance metadata |
| 2 | Data minimization | Remove unneeded columns before analysis |
| 3 | Purpose limitation | Separate datasets per project |
| 4 | Accuracy | Validate data, document cleaning steps |
| 5 | Storage limitation | Delete raw PII after anonymization |
| 6 | Integrity & confidentiality | Encrypt files, restrict access |
| 7 | Right to erasure | Ability to remove individual records |
| 8 | Data Protection Impact Assessment | Document risks before processing |
| 9 | Record of processing activities | Log all data operations |
| 10 | Pseudonymization where feasible | Replace IDs, use `digest::digest()` for hashing |

```r
# Pseudonymization with hashing
pseudonymize <- function(id, salt = "my_secret_salt_2026") {
  # Create irreversible hash of the ID
  vapply(paste0(salt, id), function(x) {
    # Simple hash for demonstration (use digest::digest in practice)
    chars <- utf8ToInt(x)
    hash_val <- sum(chars * seq_along(chars)) %% 1000000
    sprintf("P%06d", hash_val)
  }, character(1), USE.NAMES = FALSE)
}

ids <- c("alice@example.com", "bob@example.com", "carol@example.com")
pseudo_ids <- pseudonymize(ids)

cat("=== Pseudonymization ===\n")
for (i in seq_along(ids)) {
  cat(sprintf("  %s -> %s\n", ids[i], pseudo_ids[i]))
}
cat("\nIn practice, use: digest::digest(id, algo='sha256')\n")
cat("Keep the salt secret and separate from the data.\n")
```

## Exercises

### Exercise 1: Anonymization

Given a dataset of patients with name, age, zipcode, gender, and disease, apply suppression and generalization to achieve 2-anonymity.

```r
patients <- data.frame(
  name = c("A","B","C","D","E","F"),
  age = c(25, 27, 35, 37, 45, 48),
  zip = c("10001","10002","10001","10003","10002","10001"),
  gender = c("M","F","F","M","M","F"),
  disease = c("Flu","Cold","Flu","Flu","Cold","Cold")
)

cat("=== Original ===\n")
print(patients)

# Solution: suppress name, generalize age into bands
anon <- data.frame(
  id = paste0("P", 1:6),
  age_band = cut(patients$age, c(20,30,40,50), labels = c("20-30","31-40","41-50")),
  zip_3 = substr(patients$zip, 1, 3),
  gender = patients$gender,
  disease = patients$disease
)

cat("\n=== Anonymized ===\n")
print(anon)

# Check k-anonymity
groups <- paste(anon$age_band, anon$zip_3, anon$gender)
cat("\nGroup sizes:\n")
print(table(groups))
cat("k =", min(table(groups)), "\n")
```

### Exercise 2: Privacy Budget

You have a privacy budget of epsilon = 1.0. You want to release the mean and standard deviation of a salary column. How should you split the budget?

```r
cat("=== Answer ===\n")
cat("Split epsilon between queries: each gets epsilon/2 = 0.5\n")
cat("This is the 'composition theorem' of differential privacy.\n\n")
cat("More queries = more noise per query (for the same total privacy).\n")
cat("If you need 4 statistics, each gets epsilon/4 = 0.25.\n")
cat("Plan your queries carefully — every query costs privacy budget.\n")
```

## Summary

| Technique | Protection Level | Utility Loss | Complexity |
|-----------|-----------------|-------------|-----------|
| Suppression | Basic | Low (lose columns) | Very easy |
| Generalization | Medium | Medium (lose precision) | Easy |
| K-anonymity | Medium | Medium | Moderate |
| L-diversity | Medium-high | Medium-high | Moderate |
| Perturbation | Medium | Low-medium | Moderate |
| Differential privacy | High (mathematical guarantee) | Higher | Complex |

## FAQ

**Is removing names and IDs enough for anonymization?**
No. Research by Latanya Sweeney showed that 87% of Americans can be uniquely identified by {zip code, birth date, gender}. You need to address quasi-identifiers too — through generalization, suppression, or formal privacy techniques.

**What epsilon value should I use for differential privacy?**
There's no universal answer. Values between 0.1 and 1.0 are considered strong privacy. Values between 1.0 and 10.0 are moderate. Apple uses epsilon around 2-8 for telemetry data. The US Census used epsilon = 19.61 for the 2020 Census. Consider your threat model and utility needs.

**Can anonymized data be re-identified?**
Potentially, yes. Netflix "anonymized" viewing data was re-identified by cross-referencing with IMDb reviews. AOL search logs were re-identified through unique query patterns. True anonymization is hard — differential privacy provides the strongest guarantees.

## What's Next

- [Data Ethics in R](Data-Ethics-in-R.html) — The broader ethical framework
- [Synthetic Data in R](Synthetic-Data-in-R.html) — Generate fake data that preserves statistical properties
- [Communicating Uncertainty](Communicating-Uncertainty.html) — Present results honestly
