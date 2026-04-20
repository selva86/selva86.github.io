---
title: "Clinical Trials Design in R: Randomization, Adaptive Designs & ICC"
slug: Clinical-Trials-Design-in-R
description: "Design clinical trials in R: permuted block randomization, stratification, adaptive designs with interim analyses, and ICC calculations for cluster trials."
keywords: "clinical trials design, randomization in R, permuted block randomization, stratified randomization, adaptive clinical trials, group sequential design, intraclass correlation coefficient, ICC, cluster randomized trial, sample size"
auto_link_terms: "clinical trials design|permuted block randomization|stratified randomization|adaptive clinical trials|group sequential design|intraclass correlation coefficient|ICC in R|cluster randomized trial"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: FR-anov-10
post_type: FR
fr_parent: Experimental-Design-Principles-in-R.html
difficulty: Advanced
---

# Clinical Trials Design in R: Randomization, Adaptive Designs & ICC

<p class="lead">Clinical trials stand or fall on three design decisions: how participants are randomised, whether the design adapts as data accrue, and how clustering inflates the required sample size. This tutorial implements all three in R, from permuted block schedules to O'Brien-Fleming group-sequential boundaries to design-effect adjustments driven by the intraclass correlation coefficient (ICC).</p>

## How do you randomise participants to treatment arms in R?

Randomisation is the single assumption that turns a comparison into a causal claim. A predictable sequence lets recruiters steer sicker patients away from experimental arms and silently bakes confounding into the final estimate. In R, you can generate an unpredictable yet balanced schedule in three lines of base R. Let's build one for a six-patient block of a two-arm trial.

The core pattern is simple. We take the fixed allocation ratio inside a block (three A's and three B's for balance) and shuffle it with `sample()`. The result is a random order that still produces exact balance at every block boundary.

```r title="Permute a balanced block of six"
set.seed(2026)
one_block <- sample(rep(c("A", "B"), each = 3))
one_block
#> [1] "B" "A" "A" "B" "A" "B"
table(one_block)
#> one_block
#> A B
#> 3 3
```

Six slots, three A's and three B's, order is random. That is the heart of permuted block randomisation. Stringing many such blocks together gives a full trial schedule while guaranteeing the treatment counts never drift apart by more than half a block.

![Stratified permuted block randomisation flow](screenshots/Clinical-Trials-Design-in-R-randomization-flow.webp)
*Figure 1: Stratified permuted block randomisation flow, eligible participants enter a stratum, are assigned within a block, and proceed to the allocated arm.*

Let's scale that up. A `permuted_block()` helper takes the target sample size, the arm labels, and a vector of candidate block sizes, then returns a schedule with varying blocks. Mixing block sizes prevents a recruiter from predicting the last slot of the current block, which is the hardest problem fixed-size blocks have.

```r title="Permuted block function and 60-patient schedule"
permuted_block <- function(n, arms = c("A", "B"), block_sizes = c(4, 6, 8)) {
  schedule <- character(0)
  while (length(schedule) < n) {
    size <- sample(block_sizes, 1)
    per_arm <- size / length(arms)
    block <- sample(rep(arms, each = per_arm))
    schedule <- c(schedule, block)
  }
  schedule[seq_len(n)]
}

set.seed(7)
schedule_60 <- permuted_block(60)
table(schedule_60)
#> schedule_60
#>  A  B
#> 30 30
# Running balance check at common interim points
sapply(c(10, 20, 30, 40, 50, 60), function(k) sum(schedule_60[1:k] == "A"))
#> [1]  5 10 15 20 25 30
```

The running counts of arm A at each checkpoint hug the ideal of `k/2`, so imbalance never exceeds half of the largest block. That guarantee is why permuted blocks are the default in regulated trials.

[TIP]
**Always vary block sizes.** Fixed block sizes let an unblinded coordinator predict the final allocation in every block once they have seen the earlier ones. Mixing sizes like `c(4, 6, 8)` hides the boundary and closes that backdoor.

[KEY INSIGHT]
**Permuted blocks give exact balance at block boundaries.** Simple randomisation, which just calls `sample()` with replacement, can drift by several patients and ruin small subgroup analyses. The permuted block trades a sliver of randomness for guaranteed running balance.

**Try it:** Write `ex_block_of_six()`, a function that returns a single shuffled block of size 6 assigning participants to arms `"Drug"` and `"Placebo"` with 3 each. Do not rely on `permuted_block()`.

```r title="Your turn: block of six"
ex_block_of_six <- function() {
  # your code here
}

set.seed(99)
ex_block_of_six()
#> Expected: a length-6 character vector with three "Drug" and three "Placebo"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Block of six solution"
ex_block_of_six <- function() {
  sample(rep(c("Drug", "Placebo"), each = 3))
}

set.seed(99)
ex_block_of_six()
#> [1] "Placebo" "Drug"    "Drug"    "Placebo" "Drug"    "Placebo"
```

**Explanation:** `rep(..., each = 3)` builds the balanced vector `c("Drug","Drug","Drug","Placebo","Placebo","Placebo")`, and `sample()` without a size argument shuffles it in place.

</details>

## How do you stratify randomisation to balance key covariates?

Randomisation balances expectations across arms, not every single sample. If disease severity is a known prognostic factor, chance alone can still deliver a trial where the treatment arm is sicker by bad luck. Stratified randomisation blocks that failure mode by running a separate permuted block schedule inside each level of the prognostic variable.

The code pattern is: loop the `permuted_block()` function once per stratum, then stitch the results together with a stratum label. We will demonstrate a two-arm trial stratified by severity (Mild, Moderate, Severe) with 20 patients per stratum.

```r title="Stratified permuted block schedule"
set.seed(2026)
strata <- c("Mild", "Moderate", "Severe")
stratified_schedule <- do.call(rbind, lapply(strata, function(s) {
  data.frame(
    stratum = s,
    arm = permuted_block(n = 20),
    stringsAsFactors = FALSE
  )
}))
head(stratified_schedule, 6)
#>   stratum arm
#> 1    Mild   A
#> 2    Mild   B
#> 3    Mild   A
#> 4    Mild   A
#> 5    Mild   B
#> 6    Mild   B
table(stratified_schedule$stratum, stratified_schedule$arm)
#>
#>            A  B
#>   Mild    10 10
#>   Moderate 10 10
#>   Severe  10 10
```

Every stratum ends up perfectly balanced between arms. The balance holds at interim counts too because the permuted blocks inside each stratum guarantee running balance. That is the whole point of stratification, no prognostic factor can silently confound the primary comparison.

[NOTE]
**Stratify for up to three or four factors, then switch to minimisation.** Each stratum needs several blocks to fill, so with six binary factors you would need at least 64 strata, and most would start empty. For high-dimensional balance, minimisation algorithms like Pocock-Simon (in the `Minirand` package) adaptively assign new patients to keep covariate totals close.

**Try it:** Extend the pattern to two-factor strata. Write `ex_two_factor_schedule()` that takes levels for site (`"Hospital1"`, `"Hospital2"`) and severity (`"Mild"`, `"Severe"`), and returns a stratified schedule with 12 patients per combination (48 total).

```r title="Your turn: two-factor stratified schedule"
ex_two_factor_schedule <- function() {
  sites <- c("Hospital1", "Hospital2")
  severities <- c("Mild", "Severe")
  # your code here
}

set.seed(42)
out <- ex_two_factor_schedule()
table(out$site, out$severity, out$arm)
#> Expected: each of the 4 cells has 6 in arm A and 6 in arm B
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-factor strata solution"
ex_two_factor_schedule <- function() {
  sites <- c("Hospital1", "Hospital2")
  severities <- c("Mild", "Severe")
  combos <- expand.grid(site = sites, severity = severities, stringsAsFactors = FALSE)
  do.call(rbind, lapply(seq_len(nrow(combos)), function(i) {
    data.frame(
      site = combos$site[i],
      severity = combos$severity[i],
      arm = permuted_block(n = 12),
      stringsAsFactors = FALSE
    )
  }))
}

set.seed(42)
out <- ex_two_factor_schedule()
table(out$site, out$severity, out$arm)
#> , ,  = A
#>
#>             Mild Severe
#>   Hospital1    6      6
#>   Hospital2    6      6
#>
#> , ,  = B
#>
#>             Mild Severe
#>   Hospital1    6      6
#>   Hospital2    6      6
```

**Explanation:** `expand.grid()` enumerates the stratum combinations. Running `permuted_block()` inside each cell guarantees arm balance per cell, which is exactly the condition stratified randomisation aims to preserve.

</details>

## When is an adaptive design better than a fixed design?

A fixed design locks in the sample size, the analysis plan, and the treatment arms before the first patient is enrolled. An adaptive design pre-specifies rules that allow changes as data accrue, such as stopping early for efficacy, dropping a futile arm, or re-estimating the sample size. The key word is *pre-specified*. Without a rule defined in the protocol before unblinding, any change is post-hoc and invalidates the Type I error rate.

Four adaptive families cover most regulatory work:

| Family | What adapts | Typical use |
|---|---|---|
| Group sequential | Early stopping for efficacy or futility | Confirmatory trials with long follow-up |
| Sample size re-estimation | Final sample size based on interim nuisance params | Effect size or variance uncertain at design |
| Response adaptive | Allocation ratio favours the better arm | Exploratory trials, rare diseases |
| Arm dropping | Futile arms closed at interim | Multi-arm dose-finding |

To see why naive peeking is dangerous, simulate a trial under the null hypothesis (no true effect) and take five looks at the Z-statistic. At each look, if `|Z| > 1.96`, you stop and claim significance. That is the textbook mistake.

```r title="Naive peeking inflates Type I error"
sim_peeking <- function(n_per_arm = 200, K = 5, alpha_z = 1.96) {
  look_sizes <- round(seq(n_per_arm / K, n_per_arm, length.out = K))
  x <- rnorm(n_per_arm)
  y <- rnorm(n_per_arm)
  zs <- sapply(look_sizes, function(nk) {
    (mean(x[1:nk]) - mean(y[1:nk])) / sqrt(2 / nk)
  })
  any(abs(zs) > alpha_z)
}

set.seed(2026)
type1_naive <- mean(replicate(10000, sim_peeking()))
type1_naive
#> [1] 0.1414
```

The true Type I rate is about 14%, nearly triple the nominal 5%. Every extra look adds another chance to stumble across `|Z| > 1.96` purely by sampling noise. Group-sequential designs fix this by raising the bar at each look so the cumulative error stays at 5%.

[KEY INSIGHT]
**Adaptive means pre-specified rules, never post-hoc tweaks.** The regulator's bar is whether you could have pre-committed to the stopping rule, the sample-size update formula, or the arm-dropping threshold before unblinding. Adaptations decided after seeing the data are the kind of flexibility that looks helpful and silently destroys the error rate.

**Try it:** Modify `sim_peeking()` to accept the number of looks `K` and estimate the naive Type I rate for `K = 3` and `K = 10` at the unadjusted 1.96 threshold.

```r title="Your turn: peeking rate by K"
ex_peeking_rates <- function(K_values = c(3, 10), reps = 5000) {
  # your code here
}

set.seed(2026)
ex_peeking_rates()
#> Expected: a named numeric vector, rate grows with K
```

<details>
<summary>Click to reveal solution</summary>

```r title="Peeking rate solution"
ex_peeking_rates <- function(K_values = c(3, 10), reps = 5000) {
  setNames(
    sapply(K_values, function(K) mean(replicate(reps, sim_peeking(K = K)))),
    paste0("K=", K_values)
  )
}

set.seed(2026)
ex_peeking_rates()
#>   K=3   K=10
#> 0.1118 0.1928
```

**Explanation:** More looks give more chances to cross the unadjusted threshold, and the rate climbs monotonically with `K`. This is exactly the inflation that O'Brien-Fleming and Pocock boundaries correct.

</details>

## How do you plan an O'Brien-Fleming group-sequential trial in R?

O'Brien-Fleming (OBF) boundaries solve the peeking problem by making early looks very strict and loosening gradually toward the final look. Intuitively, strong evidence is required to stop a trial in its infancy, but near the end the threshold approaches the usual 1.96. The canonical approximation for look `k` of `K` at final critical value `c_K` is:

$$c_k = c_K \sqrt{K/k}$$

Where:
- $c_k$ is the critical value for look $k$
- $c_K$ is the final critical value, calibrated so the family-wise Type I rate equals $\alpha$
- $K$ is the total number of planned looks, $k$ runs from 1 to $K$

The calibrated final value $c_K$ for two-sided $\alpha = 0.05$ with five equally spaced looks is 2.040 (from standard tables). The earlier boundaries are derived from the scaling formula.

```r title="O'Brien-Fleming boundaries for K=5"
K <- 5
c_K <- 2.040  # calibrated for two-sided alpha = 0.05, K = 5
ofb_boundaries <- c_K * sqrt(K / (1:K))
round(ofb_boundaries, 3)
#> [1] 4.562 3.225 2.633 2.280 2.040
```

Look 1 demands `|Z| > 4.56`, essentially impossible by noise, while look 5 settles near 2.04. The schedule concentrates stopping power at the final look but still allows an emphatic early win.

Let's verify this controls Type I error by simulating 10,000 null trials, checking the Z-statistic against the OBF boundary at each look, and counting how often any threshold is crossed.

```r title="Simulate OBF to verify Type I control"
sim_obf <- function(n_per_arm = 200, K = 5, boundaries = ofb_boundaries) {
  look_sizes <- round(seq(n_per_arm / K, n_per_arm, length.out = K))
  x <- rnorm(n_per_arm)
  y <- rnorm(n_per_arm)
  zs <- sapply(look_sizes, function(nk) {
    (mean(x[1:nk]) - mean(y[1:nk])) / sqrt(2 / nk)
  })
  any(abs(zs) > boundaries)
}

set.seed(2026)
type1_obf <- mean(replicate(10000, sim_obf()))
type1_obf
#> [1] 0.0512
```

The empirical Type I rate is 0.051, effectively the nominal 0.05. OBF converts five peeks from a 14% disaster into a disciplined 5% design without changing how the data are collected.

[NOTE]
**For regulatory submissions, use `rpact` or `gsDesign`.** Both packages compute exact boundaries via the Lan-DeMets alpha-spending framework, handle unequal information fractions, and produce the sample-size tables reviewers expect. This base-R walkthrough is for building intuition, not for your IND filing.

**Try it:** Compute the OBF boundaries for `K = 3` looks using the calibrated final critical value `c_K = 1.993` (from OBF tables for two-sided alpha = 0.05, K = 3).

```r title="Your turn: OBF for K=3"
ex_obf_k3 <- function() {
  K_new <- 3
  c_K_new <- 1.993
  # your code here
}

ex_obf_k3()
#> Expected: a length-3 numeric vector like c(3.452, 2.441, 1.993)
```

<details>
<summary>Click to reveal solution</summary>

```r title="OBF K=3 solution"
ex_obf_k3 <- function() {
  K_new <- 3
  c_K_new <- 1.993
  round(c_K_new * sqrt(K_new / (1:K_new)), 3)
}

ex_obf_k3()
#> [1] 3.452 2.819 1.993
```

**Explanation:** The same scaling law applies, but with fewer looks the first boundary is less extreme. Fewer looks means less correction, closer to the fixed-sample 1.96 at the end.

</details>

## How does the intraclass correlation coefficient inflate sample size for cluster-randomised trials?

Cluster-randomised trials allocate whole groups (clinics, schools, GP practices) rather than individuals. Patients treated in the same clinic share a doctor, a protocol, and unmeasured environmental factors, so their outcomes are positively correlated. That correlation reduces the effective sample size. The intraclass correlation coefficient (ICC), usually written $\rho$, measures it as the share of total variance that is between-cluster:

$$\rho = \frac{\sigma_B^2}{\sigma_B^2 + \sigma_W^2}$$

Where:
- $\sigma_B^2$ is the between-cluster variance
- $\sigma_W^2$ is the within-cluster variance
- $\rho$ ranges from 0 (no clustering) to 1 (all variation is between clusters)

The correction that converts individual-level sample size to cluster-level sample size is the design effect:

$$DE = 1 + (m - 1)\rho$$

Where $m$ is the average cluster size. With $m = 30$ and $\rho = 0.05$, $DE = 1 + 29 \times 0.05 = 2.45$, so a cluster trial needs 2.45 times as many participants as an individually-randomised trial with the same power. Ignore this and you ship an underpowered study.

```r title="Design effect grid across ICC and cluster size"
icc_values <- c(0.01, 0.02, 0.05, 0.10, 0.20)
cluster_sizes <- c(10, 20, 30, 50, 100)
de_grid <- outer(cluster_sizes, icc_values, function(m, rho) 1 + (m - 1) * rho)
rownames(de_grid) <- paste0("m=", cluster_sizes)
colnames(de_grid) <- paste0("icc=", icc_values)
round(de_grid, 2)
#>        icc=0.01 icc=0.02 icc=0.05 icc=0.1 icc=0.2
#> m=10       1.09     1.18     1.45    1.90    2.80
#> m=20       1.19     1.38     1.95    2.90    4.80
#> m=30       1.29     1.58     2.45    3.90    6.80
#> m=50       1.49     1.98     3.45    5.90   10.80
#> m=100      1.99     2.98     5.95   10.90   20.80
```

Two patterns jump out. Design effect scales roughly linearly with cluster size at fixed ICC, and it scales linearly with ICC at fixed cluster size. A seemingly tiny ICC of 0.05 combined with 50 patients per cluster triples the required sample size. That is the true cost of clustering.

![ICC and cluster size together determine the design effect](screenshots/Clinical-Trials-Design-in-R-icc-design-effect.webp)
*Figure 2: ICC and cluster size together determine the design effect that inflates the required sample size.*

[WARNING]
**Analysing a cluster RCT as if patients were independent shrinks standard errors and makes every p-value optimistic.** If you randomised clusters, you must fit a mixed model or a GEE, not a plain t-test. This is a top-3 cause of non-replicable trial results.

**Try it:** Given an individually-randomised sample size target of `n_ind = 400` per arm, ICC = 0.04, and cluster size m = 25, compute the cluster-adjusted per-arm sample size.

```r title="Your turn: cluster RCT sizing"
ex_cluster_n <- function(n_ind = 400, icc = 0.04, m = 25) {
  # your code here
  # Return a named list with: design_effect, n_per_arm, clusters_per_arm
}

ex_cluster_n()
#> Expected: design_effect ≈ 1.96, n_per_arm = 784, clusters_per_arm = 32
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cluster sizing solution"
ex_cluster_n <- function(n_ind = 400, icc = 0.04, m = 25) {
  de <- 1 + (m - 1) * icc
  n_adj <- ceiling(n_ind * de)
  list(
    design_effect = round(de, 3),
    n_per_arm = n_adj,
    clusters_per_arm = ceiling(n_adj / m)
  )
}

ex_cluster_n()
#> $design_effect
#> [1] 1.96
#>
#> $n_per_arm
#> [1] 784
#>
#> $clusters_per_arm
#> [1] 32
```

**Explanation:** Multiply the individual target by the design effect, then divide by cluster size to get the number of clusters. The ceiling ensures you recruit enough whole clusters.

</details>

## How do you estimate ICC from pilot data in R?

ICC estimation is a variance decomposition. Fit a one-way random-effects model on the pilot data, extract the between-cluster and within-cluster variance components, and compute their ratio. Base R's `aov()` gives the components directly via method-of-moments, which is usually good enough for planning purposes.

First, simulate a pilot dataset with a known true ICC so we can verify the estimator. We will generate 20 clusters of 30 patients with between-cluster SD chosen so that the true ICC is 0.04.

```r title="Simulate pilot data with known ICC"
set.seed(2026)
true_icc <- 0.04
n_clusters <- 20
cluster_size <- 30
sigma_w <- 1
sigma_b <- sqrt(true_icc / (1 - true_icc)) * sigma_w

cluster_effects <- rnorm(n_clusters, 0, sigma_b)
cluster_data <- data.frame(
  cluster = factor(rep(seq_len(n_clusters), each = cluster_size)),
  y = rep(cluster_effects, each = cluster_size) + rnorm(n_clusters * cluster_size, 0, sigma_w)
)
head(cluster_data, 4)
#>   cluster           y
#> 1       1 -0.35248452
#> 2       1  0.07124314
#> 3       1 -0.31986817
#> 4       1  0.05781812
```

Now estimate ICC by pulling the mean squares out of `aov()` and solving for $\sigma_B^2$ and $\sigma_W^2$ via the standard random-effects expectations. With cluster size $m$, between-cluster mean square $MS_B$, and within-cluster mean square $MS_W$:

$$\hat{\sigma}_B^2 = \frac{MS_B - MS_W}{m}, \qquad \hat{\sigma}_W^2 = MS_W$$

```r title="Estimate ICC from aov variance components"
aov_model <- aov(y ~ cluster, data = cluster_data)
ms <- summary(aov_model)[[1]][, "Mean Sq"]
ms_b <- ms[1]
ms_w <- ms[2]

sigma_b_hat <- max(0, (ms_b - ms_w) / cluster_size)
sigma_w_hat <- ms_w
icc_hat <- sigma_b_hat / (sigma_b_hat + sigma_w_hat)
round(icc_hat, 4)
#> [1] 0.0371
```

The estimate is 0.037 against a true value of 0.04, well within the sampling uncertainty expected at this sample size. The `max(0, ...)` guard is a practical fix for a quirk of method-of-moments, the raw formula can return a negative variance when between-cluster signal is weak relative to sampling noise.

[TIP]
**The `ICC` and `lme4` packages automate this in full R environments.** `ICC::ICCbare(cluster, y, data = df)` wraps the same variance decomposition with confidence intervals, and `lme4::lmer(y ~ (1 | cluster))` gives a REML-based estimate that behaves better in small samples. The base-R version here is transparent and fast to reason about.

**Try it:** Regenerate the pilot data with `true_icc = 0.10`, keeping 20 clusters of 30, then rerun the estimator. Save the result to `ex_icc_hat`.

```r title="Your turn: ICC estimate at 0.10"
ex_icc_hat <- local({
  # your code here: simulate, fit aov, compute ICC
  NULL
})
ex_icc_hat
#> Expected: a single numeric value near 0.10
```

<details>
<summary>Click to reveal solution</summary>

```r title="ICC at 0.10 solution"
ex_icc_hat <- local({
  set.seed(11)
  true_icc2 <- 0.10
  n_c <- 20
  m_c <- 30
  sw <- 1
  sb <- sqrt(true_icc2 / (1 - true_icc2)) * sw
  eff <- rnorm(n_c, 0, sb)
  dd <- data.frame(
    cluster = factor(rep(seq_len(n_c), each = m_c)),
    y = rep(eff, each = m_c) + rnorm(n_c * m_c, 0, sw)
  )
  ms2 <- summary(aov(y ~ cluster, data = dd))[[1]][, "Mean Sq"]
  sb2 <- max(0, (ms2[1] - ms2[2]) / m_c)
  round(sb2 / (sb2 + ms2[2]), 4)
})
ex_icc_hat
#> [1] 0.1089
```

**Explanation:** The same estimator recovers the higher ICC, 0.109 against a true 0.10. Stronger clustering signal gives a tighter estimate because the numerator `MS_B - MS_W` is larger relative to sampling noise.

</details>

## Practice Exercises

### Exercise 1: Stratified three-arm block randomisation

Write `my_stratified_schedule(n_per_stratum, strata, arms, block_sizes)` for a three-arm trial. Verify that every stratum ends up balanced across arms.

```r title="Exercise 1 starter"
# Exercise 1: stratified 3-arm schedule
# Hint: extend the pattern from the stratified randomisation section
# permuted_block() already supports 3+ arms when block_sizes are multiples of length(arms)

my_stratified_schedule <- function(n_per_stratum, strata, arms, block_sizes) {
  # your code here
}

# Test:
set.seed(1)
my_sched <- my_stratified_schedule(
  n_per_stratum = 18,
  strata = c("Site1", "Site2"),
  arms = c("A", "B", "C"),
  block_sizes = c(3, 6, 9)
)
table(my_sched$stratum, my_sched$arm)
#> Expected: each stratum has 6 in each of A, B, C
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_stratified_schedule <- function(n_per_stratum, strata, arms, block_sizes) {
  do.call(rbind, lapply(strata, function(s) {
    data.frame(
      stratum = s,
      arm = permuted_block(n = n_per_stratum, arms = arms, block_sizes = block_sizes),
      stringsAsFactors = FALSE
    )
  }))
}

set.seed(1)
my_sched <- my_stratified_schedule(
  n_per_stratum = 18,
  strata = c("Site1", "Site2"),
  arms = c("A", "B", "C"),
  block_sizes = c(3, 6, 9)
)
table(my_sched$stratum, my_sched$arm)
#>
#>         A B C
#>   Site1 6 6 6
#>   Site2 6 6 6
```

**Explanation:** Three arms require block sizes that are multiples of three, so `c(3, 6, 9)` is the natural choice. Inside each stratum, the permuted block function shuffles the allocation while preserving exact per-arm balance.

</details>

### Exercise 2: Cluster RCT sample size planning

A team plans a cluster RCT for a GP-practice smoking cessation intervention. Individual-level power calculation suggests n = 600 per arm. The pilot estimated ICC = 0.03. Average practice size is 40 patients. Compute the cluster-adjusted sample size and the number of practices needed per arm. Save to `my_clusters_per_arm`.

```r title="Exercise 2 starter"
# Exercise 2: cluster RCT planning
# Hint: use DE = 1 + (m - 1) * icc, then divide by cluster size

my_clusters_per_arm <- NULL
# your code here: assign the answer to my_clusters_per_arm

my_clusters_per_arm
#> Expected: a single integer, roughly 33
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_clusters_per_arm <- local({
  n_ind <- 600
  icc <- 0.03
  m <- 40
  de <- 1 + (m - 1) * icc
  n_adj <- ceiling(n_ind * de)
  ceiling(n_adj / m)
})
my_clusters_per_arm
#> [1] 33
```

**Explanation:** `DE = 1 + 39 * 0.03 = 2.17`, so the adjusted per-arm sample is `600 * 2.17 = 1302`, divided by 40 gives 33 practices per arm. The team should plan 66 practices total.

</details>

### Exercise 3: OBF verification at K = 4

Compute OBF boundaries for `K = 4` looks using the calibrated final critical value `c_K = 2.024`, then simulate 20,000 null trials to verify the Type I rate stays near 0.05. Save the empirical rate to `my_type1`.

```r title="Exercise 3 starter"
# Exercise 3: K=4 OBF verification
# Hint: reuse sim_obf() but pass your K=4 boundaries

my_obf4 <- NULL    # the boundaries for K = 4
my_type1 <- NULL   # empirical Type I rate

# your code here

round(my_type1, 3)
#> Expected: a value near 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
my_obf4 <- 2.024 * sqrt(4 / (1:4))
my_type1 <- mean(replicate(20000, sim_obf(n_per_arm = 200, K = 4, boundaries = my_obf4)))
round(my_obf4, 3)
#> [1] 4.048 2.863 2.337 2.024
round(my_type1, 3)
#> [1] 0.051
```

**Explanation:** Four looks give a slightly more relaxed first boundary than the five-look case (4.05 vs 4.56), and the calibrated final critical value drops to 2.02. The empirical Type I rate lands near 0.05, confirming the boundary family still controls error with fewer looks.

</details>

## Complete Example

Design a 2-arm cluster RCT of a school-based literacy intervention with one pre-planned interim analysis. Inputs: 24 schools available, ICC = 0.03, average cluster size m = 25 students, target detectable standardised effect 0.30, two-sided alpha = 0.05, 80% power. The workflow chains the three pieces of this tutorial into a single end-to-end plan.

```r title="End-to-end cluster RCT plan"
# Step 1: individual-level sample size per arm (standard two-sample formula)
d <- 0.30
alpha <- 0.05
power <- 0.80
z_alpha <- qnorm(1 - alpha / 2)
z_beta <- qnorm(power)
plan_n_ind <- ceiling(2 * ((z_alpha + z_beta) / d)^2)
plan_n_ind
#> [1] 175

# Step 2: inflate by the design effect
icc <- 0.03
m <- 25
plan_de <- 1 + (m - 1) * icc
plan_n_cluster <- ceiling(plan_n_ind * plan_de)
plan_clusters_per_arm <- ceiling(plan_n_cluster / m)
c(design_effect = round(plan_de, 2),
  n_per_arm = plan_n_cluster,
  clusters_per_arm = plan_clusters_per_arm,
  total_schools = 2 * plan_clusters_per_arm)
#>    design_effect        n_per_arm clusters_per_arm    total_schools
#>             1.72              301               13               26
```

The feasibility check fails, 26 schools required against 24 available. The team has three options: accept slightly lower power, negotiate for two more schools, or tighten the pilot ICC estimate (if the true ICC is below 0.03, the design effect shrinks and fewer schools suffice). For the sake of this example, assume two extra schools are added and proceed.

```r title="Stratify schools and generate allocation"
# Step 3: stratify by school size tertile
set.seed(2026)
n_per_stratum <- plan_clusters_per_arm * 2 / 3  # 26/3 ~= 9 per tertile, round up
plan_schedule <- do.call(rbind, lapply(c("Small", "Medium", "Large"), function(tier) {
  data.frame(
    tier = tier,
    school_id = seq_len(ceiling(n_per_stratum)),
    arm = permuted_block(
      n = ceiling(n_per_stratum),
      arms = c("Intervention", "Control"),
      block_sizes = c(2, 4)
    ),
    stringsAsFactors = FALSE
  )
}))
table(plan_schedule$tier, plan_schedule$arm)
#>
#>         Control Intervention
#>   Small       5            4
#>   Medium      5            4
#>   Large       5            4
```

```r title="Plan the interim analysis"
# Step 4: one interim analysis at 50% information with K=2 OBF
K_plan <- 2
c_K_plan <- 1.977  # calibrated OBF two-sided alpha = 0.05, K = 2
interim_boundary <- c_K_plan * sqrt(K_plan / 1)
final_boundary <- c_K_plan * sqrt(K_plan / 2)
c(interim = round(interim_boundary, 3), final = round(final_boundary, 3))
#> interim   final
#>   2.796   1.977
```

The plan: recruit 26 schools stratified by size, randomise within each tertile via permuted blocks, analyse at 50% information with a strict early-stopping threshold of |Z| > 2.80, and take the final decision at |Z| > 1.98. Every element is pre-specified before the first school is assigned, which is what keeps the 5% error rate honest.

## Summary

| Technique | R approach | When to use |
|---|---|---|
| Simple randomisation | `sample()` | Very large trials where imbalance averages out |
| Permuted block | Base R `permuted_block()` or `blockrand` | Standard default, prevents running imbalance |
| Stratified block | Loop over strata calling `permuted_block()` | Up to 3 or 4 prognostic factors |
| Minimisation | `Minirand` package | Many prognostic factors, small trials |
| Group-sequential | OBF scaling by hand, or `rpact`, `gsDesign` | Pre-planned interim analyses |
| Sample-size re-estimation | `rpact` with combination tests | Nuisance parameters uncertain at design |
| Cluster RCT sizing | Design effect $1 + (m-1)\rho$ | Randomise groups not individuals |
| ICC estimation | `aov()` variance decomposition, or `ICC`, `lme4` | Sample-size planning from pilot data |

## References

1. Pallmann, P., Bedding, A. W., Choodari-Oskooei, B., et al. "Adaptive designs in clinical trials: why use them, and how to run and report them." *BMC Medicine* 16, 29 (2018). [Link](https://link.springer.com/article/10.1186/s12916-018-1017-7)
2. Wassmer, G. and Pahlke, F. "rpact: Confirmatory Adaptive Clinical Trial Design and Analysis." R package documentation. [Link](https://www.rpact.com)
3. Snow, G. "blockrand: Randomization for Block Random Clinical Trials." CRAN package. [Link](https://cran.r-project.org/package=blockrand)
4. Higgins, P. "Randomization for Clinical Trials with R." *Reproducible Medical Research with R*, Chapter 24. [Link](https://bookdown.org/pdr_higgins/rmrwr/randomization-for-clinical-trials-with-r.html)
5. O'Brien, P. C. and Fleming, T. R. "A multiple testing procedure for clinical trials." *Biometrics* 35, 549-556 (1979).
6. Donner, A. and Klar, N. *Design and Analysis of Cluster Randomization Trials in Health Research.* Arnold (2000).
7. Campbell, M. K., Fayers, P. M., and Grimshaw, J. M. "Determinants of the intracluster correlation coefficient in cluster randomized trials." *Clinical Trials* 2, 99-107 (2005).
8. CRAN Task View: Clinical Trial Design, Monitoring, and Analysis. [Link](https://cran.r-project.org/view=ClinicalTrials)

## Continue Learning

1. [Sample Size Planning in R](Sample-Size-Planning-in-R.html) covers the individual-level sample size formulas that feed into the design effect inflation on this page.
2. [Conditional Power and Sample Size Re-Estimation in R](Conditional-Power-and-Sample-Size-Re-Estimation-in-R.html) goes deeper on the adaptive machinery behind mid-trial sample-size updates.
3. [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html) lays out power calculations across test families, the input to every trial design decision.
