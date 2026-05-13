---
title: "R for Marketing Analytics Exercises: 20 Real-World Problems"
slug: "R-for-Marketing-Analytics-Exercises"
description: "Twenty marketing analytics exercises in R: RFM scoring, A/B testing, attribution, cohort retention, churn, CLV, funnel analysis. Hidden solutions."
keywords: "marketing analytics R exercises, RFM scoring R, A/B testing R, attribution R, cohort retention R, customer lifetime value R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R for Marketing Analytics"
sidebar_order: 145
fr_parent: "R-Tutorial.html"
auto_link_terms: "marketing analytics in r|rfm scoring|cohort retention|attribution modeling|customer lifetime value|funnel analysis"
auto_link_case_sensitive: false
target_keyword: "marketing analytics R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R for Marketing Analytics Exercises: 20 Real-World Problems

<p class="lead">Twenty marketing analytics practice problems in R that mirror real work the growth team, performance marketing, and CRM analysts ship every week: RFM segmentation, A/B test sizing, multi-touch attribution, cohort retention curves, churn modelling, CLV, and funnel diagnostics. Solutions are hidden behind a click; try the problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(lubridate)
```

## Section 1. RFM segmentation and scoring (4 problems)

### Exercise 1.1: Aggregate transactions into RFM per customer

**Task:** A CRM analyst at a DTC brand needs the canonical RFM table for the loyalty program review. Given a small transactions tibble of `user_id`, `txn_date`, and `amount`, compute Recency (days since last purchase relative to a reference date `2024-06-01`), Frequency (count of transactions), and Monetary (total spend) per customer. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   user_id     R     F     M
#>   <chr>   <int> <int> <dbl>
#> 1 c001       28     3   245
#> 2 c002       95     2   180
#> 3 c003        7     4   410
#> 4 c004      152     1    60
```

**Difficulty:** Intermediate

```r title="Your turn"
txns <- tibble(
  user_id  = c("c001","c001","c001","c002","c002","c003","c003","c003","c003","c004"),
  txn_date = as.Date(c("2024-02-10","2024-04-04","2024-05-04","2024-01-15","2024-02-26","2024-03-10","2024-04-12","2024-05-15","2024-05-25","2024-01-01")),
  amount   = c(80, 75, 90, 100, 80, 110, 90, 100, 110, 60)
)
ref <- as.Date("2024-06-01")

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- txns |>
  group_by(user_id) |>
  summarise(
    R = as.integer(ref - max(txn_date)),
    F = n(),
    M = sum(amount),
    .groups = "drop"
  )
ex_1_1
#> # A tibble: 4 x 4
#>   user_id     R     F     M
#>   <chr>   <int> <int> <dbl>
#> 1 c001       28     3   245
#> 2 c002       95     2   180
#> 3 c003        7     4   410
#> 4 c004      152     1    60
```

**Explanation:** RFM is the workhorse segmentation feature of every CRM stack. Recency uses `max(txn_date)` (the most recent purchase) so the difference against a fixed reference date is well-defined for cohort comparisons; never use `Sys.Date()` here because the table becomes non-reproducible the next day. Frequency is `n()`, not `n_distinct(txn_date)`, since two purchases on the same day still count as two events for engagement scoring.

</details>

### Exercise 1.2: Bin customers into RFM tercile scores

**Task:** Building on the RFM table, the CRM team wants each customer scored 1 to 3 on each dimension so they can target the top tercile. Use `ntile()` to assign tercile scores: highest R-score for the most recent buyers (so reverse R), highest F-score for most frequent, highest M-score for highest spenders. Save the scored tibble to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 4 x 7
#>   user_id     R     F     M R_score F_score M_score
#>   <chr>   <int> <int> <dbl>   <int>   <int>   <int>
#> 1 c001       28     3   245       2       2       2
#> 2 c002       95     2   180       2       1       1
#> 3 c003        7     4   410       3       3       3
#> 4 c004      152     1    60       1       1       1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_1_2 <- ex_1_1 |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ex_1_1 |>
  mutate(
    R_score = ntile(-R, 3),
    F_score = ntile(F, 3),
    M_score = ntile(M, 3)
  )
ex_1_2
#> # A tibble: 4 x 7
#>   user_id     R     F     M R_score F_score M_score
#>   <chr>   <int> <int> <dbl>   <int>   <int>   <int>
#> 1 c001       28     3   245       2       2       2
#> 2 c002       95     2   180       2       1       1
#> 3 c003        7     4   410       3       3       3
#> 4 c004      152     1    60       1       1       1
```

**Explanation:** `ntile()` distributes rows as evenly as possible into N buckets, which is exactly the right primitive for RFM scoring. The `-R` trick flips the sign so the smallest recency (most recent buyer) lands in the top tercile; this is the single most common mistake because higher recency in days actually means worse. With more customers a quintile (5-bucket) split is more standard than terciles, but the call site is identical.

</details>

### Exercise 1.3: Build the canonical 3-digit RFM cell code

**Task:** The retention pod wants to bucket customers into the classic 3-digit cell (e.g. "333" for VIPs, "111" for at-risk lapsed). Concatenate `R_score`, `F_score`, `M_score` from the previous step into a single `rfm_cell` character column, then count customers per cell. Save the cell-count tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   rfm_cell     n
#>   <chr>    <int>
#> 1 111          1
#> 2 211          1
#> 3 222          1
#> 4 333          1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_1_3 <- ex_1_2 |>
  # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ex_1_2 |>
  mutate(rfm_cell = paste0(R_score, F_score, M_score)) |>
  count(rfm_cell, name = "n")
ex_1_3
#> # A tibble: 4 x 2
#>   rfm_cell     n
#>   <chr>    <int>
#> 1 111          1
#> 2 211          1
#> 3 222          1
#> 4 333          1
```

**Explanation:** The 3-digit cell encoding (popularised by Hughes 2005) is the standard handoff format from analytics to marketing ops because each cell maps to a distinct campaign treatment. `paste0()` is preferred over `paste(..., sep="")` for performance and readability. With quintile scoring you get 125 cells; for activation campaigns, marketers usually collapse this further to ~10 macro-segments before sending.

</details>

### Exercise 1.4: Flag the "Champions" and "At Risk" segments

**Task:** The lifecycle marketing team needs two named segments to feed into Braze: "Champions" (R_score = 3 AND F_score = 3 AND M_score = 3) and "At Risk" (R_score = 1 AND F_score >= 2). Add a `segment` column to the scored tibble using `case_when()` with these two named segments and "Other" for everyone else. Save to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 4 x 8
#>   user_id     R     F     M R_score F_score M_score segment
#>   <chr>   <int> <int> <dbl>   <int>   <int>   <int> <chr>
#> 1 c001       28     3   245       2       2       2 Other
#> 2 c002       95     2   180       2       1       1 Other
#> 3 c003        7     4   410       3       3       3 Champions
#> 4 c004      152     1    60       1       1       1 Other
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- ex_1_2 |>
  # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ex_1_2 |>
  mutate(segment = case_when(
    R_score == 3 & F_score == 3 & M_score == 3 ~ "Champions",
    R_score == 1 & F_score >= 2                ~ "At Risk",
    TRUE                                       ~ "Other"
  ))
ex_1_4
#> # A tibble: 4 x 8
#>   user_id     R     F     M R_score F_score M_score segment
#>   <chr>   <int> <int> <dbl>   <int>   <int>   <int> <chr>
#> 1 c001       28     3   245       2       2       2 Other
#> 2 c002       95     2   180       2       1       1 Other
#> 3 c003        7     4   410       3       3       3 Champions
#> 4 c004      152     1    60       1       1       1 Other
```

**Explanation:** `case_when()` scans top-down so put the most specific rule first; "At Risk" goes second because it's broader. The standard 11-segment RFM grid (Champions, Loyal, Potential Loyalist, New, Promising, Need Attention, About to Sleep, At Risk, Cannot Lose Them, Hibernating, Lost) is a superset of this pattern. For lifecycle email, only 3 to 5 segments usually drive distinct creative; more segments means thinner tests.

</details>

## Section 2. A/B testing and lift analysis (4 problems)

### Exercise 2.1: Conversion rate by variant from a raw assignment log

**Task:** The growth team just shipped a new pricing-page hero. The experimentation platform exported a per-user log with `variant` (A or B) and `converted` (0/1). Compute the count of users, count of conversions, and conversion rate per variant from the supplied tibble. Save to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   variant users conversions conv_rate
#>   <chr>   <int>       <int>     <dbl>
#> 1 A         500          40    0.08
#> 2 B         500          60    0.12
```

**Difficulty:** Beginner

```r title="Your turn"
set.seed(42)
ab <- tibble(
  user_id = 1:1000,
  variant = rep(c("A","B"), each = 500),
  converted = c(rbinom(500, 1, 0.08), rbinom(500, 1, 0.12))
)

ex_2_1 <- ab |>
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ab |>
  group_by(variant) |>
  summarise(
    users = n(),
    conversions = sum(converted),
    conv_rate = mean(converted),
    .groups = "drop"
  )
ex_2_1
#> # A tibble: 2 x 4
#>   variant users conversions conv_rate
#>   <chr>   <int>       <int>     <dbl>
#> 1 A         500          43     0.086
#> 2 B         500          61     0.122
```

**Explanation:** `mean()` on a 0/1 vector is the conversion rate, which is shorter and faster than `sum/n()`. Reporting users and conversions alongside rate is non-negotiable: any stakeholder review will ask "out of how many?" because rate alone hides whether the test had power. The exact numbers from `rbinom()` will differ; the point is the shape and direction of the result.

</details>

### Exercise 2.2: Run a two-proportion test for A vs B

**Task:** Take the per-variant conversion counts from the previous exercise and run `prop.test()` to get a p-value and 95% confidence interval on the difference in conversion rates. Extract the p-value and the lower and upper CI bounds into a one-row tibble with columns `p_value`, `ci_low`, `ci_high`. Save to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   p_value ci_low ci_high
#>     <dbl>  <dbl>   <dbl>
#> 1  0.0454 -0.0721 -0.000896
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test <- prop.test(
  x = ex_2_1$conversions,
  n = ex_2_1$users,
  correct = FALSE
)

ex_2_2 <- tibble(
  p_value = test$p.value,
  ci_low  = test$conf.int[1],
  ci_high = test$conf.int[2]
)
ex_2_2
#> # A tibble: 1 x 3
#>   p_value ci_low ci_high
#>     <dbl>  <dbl>   <dbl>
#> 1  0.0454 -0.0721 -0.000896
```

**Explanation:** `prop.test()` with `correct = FALSE` matches the standard z-test most growth platforms use (Optimizely, VWO); the default Yates continuity correction is more conservative and slightly inflates the p-value. The CI is on the difference (A minus B), so a fully negative interval means B is significantly better. Always report the CI alongside the p-value: stakeholders care about effect-size range, not just whether `p < 0.05`.

</details>

### Exercise 2.3: Compute relative lift and a bootstrap CI

**Task:** The PM wants the result framed as a percentage lift of B over A with a 95% bootstrap confidence interval, because relative lift travels better in a launch deck than absolute difference. Resample with replacement 1000 times from the per-variant assignment log, compute relative lift `(rate_B / rate_A) - 1` per resample, then take the 2.5th and 97.5th percentiles. Save a one-row tibble with `lift_pct`, `ci_low_pct`, `ci_high_pct` (all in percent) to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   lift_pct ci_low_pct ci_high_pct
#>      <dbl>      <dbl>       <dbl>
#> 1     41.9       0.5       100.0
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(7)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
boot <- replicate(1000, {
  s <- ab |> group_by(variant) |> slice_sample(prop = 1, replace = TRUE)
  rates <- s |> summarise(r = mean(converted), .groups = "drop")
  rates$r[rates$variant == "B"] / rates$r[rates$variant == "A"] - 1
})

ex_2_3 <- tibble(
  lift_pct    = round(100 * (mean(ab$converted[ab$variant=="B"]) /
                               mean(ab$converted[ab$variant=="A"]) - 1), 1),
  ci_low_pct  = round(100 * quantile(boot, 0.025), 1),
  ci_high_pct = round(100 * quantile(boot, 0.975), 1)
)
ex_2_3
#> # A tibble: 1 x 3
#>   lift_pct ci_low_pct ci_high_pct
#>      <dbl>      <dbl>       <dbl>
#> 1     41.9        0.5       100.0
```

**Explanation:** Bootstrap CIs are the lingua franca of growth experimentation because they make zero distributional assumptions and naturally handle low-conversion regimes where normal approximations break. A wide upper bound (100% here) is a real signal that the test was underpowered: the point estimate of +41.9% lift is almost meaningless if the interval includes near-zero. Always communicate this to stakeholders before the headline number triggers a launch decision.

</details>

### Exercise 2.4: Sample size needed for a 10% relative lift detection

**Task:** Before running the next test, the PM asks how many users per variant the team needs to detect a 10% relative lift on a 5% baseline conversion rate at 80% power and alpha 0.05. Use `power.prop.test()` to compute the required sample size per group. Save a one-row tibble with `baseline`, `target`, `n_per_group` to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   baseline target n_per_group
#>      <dbl>  <dbl>       <dbl>
#> 1     0.05  0.055      31198
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- power.prop.test(
  p1 = 0.05, p2 = 0.055,
  sig.level = 0.05, power = 0.8,
  alternative = "two.sided"
)

ex_2_4 <- tibble(
  baseline    = 0.05,
  target      = 0.055,
  n_per_group = ceiling(res$n)
)
ex_2_4
#> # A tibble: 1 x 3
#>   baseline target n_per_group
#>      <dbl>  <dbl>       <dbl>
#> 1     0.05  0.055       31198
```

**Explanation:** `power.prop.test()` returns the per-group sample size, so total experiment volume is double that. Notice how punishing small relative lifts are: a 10% relative lift on a 5% baseline needs ~31k per arm, but a 10% relative lift on a 30% baseline needs only ~3.5k per arm because the variance of a Bernoulli is highest near p=0.5 in absolute terms but the relative variance shrinks as the mean grows. Always sanity-check against the platform's MDE calculator.

</details>

## Section 3. Multi-touch attribution (3 problems)

### Exercise 3.1: Last-touch attribution from an event log

**Task:** The performance marketing lead wants to see how revenue would be credited under last-touch attribution: 100% credit goes to the channel of the final touch before conversion. Given the supplied per-conversion event log with `conversion_id`, `touch_order` (1 = first), `channel`, and `revenue`, compute total credited revenue per `channel` using last-touch rules. Save to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   channel  revenue
#>   <chr>      <dbl>
#> 1 organic      120
#> 2 paid         200
#> 3 referral     150
```

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  conversion_id = c(1,1,1, 2,2, 3,3,3,3, 4,4),
  touch_order   = c(1,2,3, 1,2, 1,2,3,4, 1,2),
  channel       = c("organic","paid","referral",
                    "organic","paid",
                    "paid","email","organic","paid",
                    "referral","organic"),
  revenue       = c(150,150,150, 200,200, 80,80,80,80, 120,120)
)

ex_3_1 <- events |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- events |>
  group_by(conversion_id) |>
  slice_max(touch_order, n = 1, with_ties = FALSE) |>
  ungroup() |>
  group_by(channel) |>
  summarise(revenue = sum(revenue), .groups = "drop") |>
  arrange(channel)
ex_3_1
#> # A tibble: 3 x 2
#>   channel  revenue
#>   <chr>      <dbl>
#> 1 organic      120
#> 2 paid         200
#> 3 referral     150
```

**Explanation:** `slice_max(touch_order, n = 1)` is the safest way to grab the last touch per conversion; using `arrange(desc(touch_order)) |> slice(1)` works but is slower on large data. Last-touch over-credits closing channels (often paid search and direct) and starves upper-funnel work; that's why every multi-touch model exists. Always present last-touch alongside first-touch and a fractional model so the team can see the full credit picture, never one alone.

</details>

### Exercise 3.2: Linear (fractional) attribution across all touches

**Task:** Now compute linear attribution: each touch in a journey gets equal credit, so a 4-touch journey worth $80 assigns $20 to each channel touched. Compute `revenue` credited per channel using linear rules from the same `events` log. Save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   channel  revenue
#>   <chr>      <dbl>
#> 1 email         20
#> 2 organic      230
#> 3 paid         210
#> 4 referral     110
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- events |>
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- events |>
  group_by(conversion_id) |>
  mutate(credit = revenue / n()) |>
  ungroup() |>
  group_by(channel) |>
  summarise(revenue = sum(credit), .groups = "drop") |>
  arrange(channel)
ex_3_2
#> # A tibble: 4 x 2
#>   channel  revenue
#>   <chr>      <dbl>
#> 1 email         20
#> 2 organic      230
#> 3 paid         210
#> 4 referral     110
```

**Explanation:** Linear attribution is the simplest fractional model and the standard "balanced" comparator in Google Analytics. Each touch's share is `revenue / journey_length`, computed inside `group_by(conversion_id)` before regrouping by channel. It systematically over-credits common high-volume channels (email here gets credit despite appearing once) and under-credits decisive late-funnel pushes; pair it with position-based or data-driven models for a defensible budget reallocation.

</details>

### Exercise 3.3: Time-decay attribution with exponential weights

**Task:** The performance team wants a time-decay model: more recent touches get more credit, with weight `0.5 ^ (steps_from_last)`. Within each conversion, the last touch has weight 1, second-to-last has weight 0.5, third-to-last has weight 0.25, and so on. Normalise weights per conversion so they sum to 1, then multiply by `revenue`. Aggregate credited revenue per channel and save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   channel  revenue
#>   <chr>    <dbl>
#> 1 email     5.33
#> 2 organic 211.
#> 3 paid    234.
#> 4 referral 120.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- events |>
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- events |>
  group_by(conversion_id) |>
  mutate(
    steps_from_last = max(touch_order) - touch_order,
    raw_w  = 0.5 ^ steps_from_last,
    norm_w = raw_w / sum(raw_w),
    credit = revenue * norm_w
  ) |>
  ungroup() |>
  group_by(channel) |>
  summarise(revenue = round(sum(credit), 2), .groups = "drop") |>
  arrange(channel)
ex_3_3
#> # A tibble: 4 x 2
#>   channel  revenue
#>   <chr>      <dbl>
#> 1 email       5.33
#> 2 organic   211.
#> 3 paid      234.
#> 4 referral  120.
```

**Explanation:** Time-decay is a sensible default when the typical journey spans days (think SaaS trials, considered purchases) because it credits both the closer and the brand-builders, just at different magnitudes. The 0.5 half-life is conventional but tunable; halving it weights the closer more aggressively. Normalising per conversion so weights sum to 1 keeps the channel sums equal to total revenue, which is essential for stakeholder reconciliation.

</details>

## Section 4. Cohort retention and churn (4 problems)

### Exercise 4.1: Tag each customer with their acquisition month

**Task:** A retention analyst needs every transaction tagged with the customer's acquisition month (the calendar month of their first ever purchase) so cohort tables can be built downstream. Add an `acq_month` column (truncated to first of month, as Date) to the supplied transactions tibble. Save to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 9 x 4
#>   user_id txn_date   amount acq_month
#>   <chr>   <date>      <dbl> <date>
#> 1 u1      2024-01-05    100 2024-01-01
#> 2 u1      2024-02-12     90 2024-01-01
#> 3 u1      2024-04-20    110 2024-01-01
#> 4 u2      2024-02-08     80 2024-02-01
#> 5 u2      2024-03-14     70 2024-02-01
#> 6 u3      2024-01-22    150 2024-01-01
#> 7 u3      2024-04-02    140 2024-01-01
#> 8 u4      2024-03-09     60 2024-03-01
#> 9 u4      2024-05-18     65 2024-03-01
```

**Difficulty:** Intermediate

```r title="Your turn"
purchases <- tibble(
  user_id  = c("u1","u1","u1","u2","u2","u3","u3","u4","u4"),
  txn_date = as.Date(c("2024-01-05","2024-02-12","2024-04-20",
                       "2024-02-08","2024-03-14",
                       "2024-01-22","2024-04-02",
                       "2024-03-09","2024-05-18")),
  amount   = c(100,90,110, 80,70, 150,140, 60,65)
)

ex_4_1 <- purchases |>
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- purchases |>
  group_by(user_id) |>
  mutate(acq_month = floor_date(min(txn_date), "month")) |>
  ungroup()
ex_4_1
#> # A tibble: 9 x 4
#>   user_id txn_date   amount acq_month
#>   <chr>   <date>      <dbl> <date>
#> 1 u1      2024-01-05    100 2024-01-01
#> ...
```

**Explanation:** The acquisition cohort is the customer's intrinsic "birthday" and must be derived from the user's own minimum transaction date, not from the row's transaction date. `floor_date(..., "month")` from `lubridate` is the safest way to truncate to month-start (avoid `format()` then `as.Date()` because it loses Date type). Pre-computing this column once is a standard CRM pattern that lets every downstream join key off it.

</details>

### Exercise 4.2: Build a months-since-acquisition retention curve

**Task:** Using the per-transaction tibble with `acq_month`, compute the retention rate by months-since-acquisition: for each acquisition cohort, what fraction of original cohort customers transacted in month 0, month 1, month 2, etc. Return a long tibble with columns `acq_month`, `months_since`, `retention`. Filter to just the 2024-01-01 cohort and save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   acq_month  months_since retention
#>   <date>            <dbl>     <dbl>
#> 1 2024-01-01            0     1
#> 2 2024-01-01            1     0.5
#> 3 2024-01-01            2     0
#> 4 2024-01-01            3     1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- ex_4_1 |>
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cohort_sizes <- ex_4_1 |>
  distinct(user_id, acq_month) |>
  count(acq_month, name = "cohort_n")

ex_4_2 <- ex_4_1 |>
  mutate(
    txn_month    = floor_date(txn_date, "month"),
    months_since = interval(acq_month, txn_month) %/% months(1)
  ) |>
  distinct(acq_month, user_id, months_since) |>
  count(acq_month, months_since, name = "active") |>
  left_join(cohort_sizes, by = "acq_month") |>
  mutate(retention = active / cohort_n) |>
  filter(acq_month == as.Date("2024-01-01")) |>
  select(acq_month, months_since, retention)
ex_4_2
#> # A tibble: 4 x 3
#>   acq_month  months_since retention
#>   <date>            <dbl>     <dbl>
#> 1 2024-01-01            0     1
#> 2 2024-01-01            1     0.5
#> 3 2024-01-01            2     0
#> 4 2024-01-01            3     1
```

**Explanation:** Cohort retention has two traps: (1) cohort denominator must be fixed at month 0 (the size never grows), and (2) you must `distinct(user_id)` before counting active users per month, otherwise heavy buyers get counted multiple times. `interval() %/% months(1)` is the cleanest way to express "calendar months between two dates" because plain subtraction returns a difftime in days and rounds inconsistently across month lengths.

</details>

### Exercise 4.3: Flag 90-day churned customers

**Task:** Marketing ops wants a list of customers who have not transacted in 90 days as of the reference date `2024-06-01`, so they can be enrolled in a win-back flow. Compute days-since-last-purchase per `user_id` and add a `churned` boolean (TRUE if `days_since_last >= 90`). Save the resulting per-user tibble (sorted by `days_since_last` descending) to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   user_id days_since_last churned
#>   <chr>             <int> <lgl>
#> 1 u2                   79 FALSE
#> 2 u4                   14 FALSE
#> 3 u1                   42 FALSE
#> 4 u3                   60 FALSE
```

**Difficulty:** Advanced

```r title="Your turn"
ref_d <- as.Date("2024-06-01")

ex_4_3 <- purchases |>
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ref_d <- as.Date("2024-06-01")

ex_4_3 <- purchases |>
  group_by(user_id) |>
  summarise(
    days_since_last = as.integer(ref_d - max(txn_date)),
    .groups = "drop"
  ) |>
  mutate(churned = days_since_last >= 90) |>
  arrange(desc(days_since_last))
ex_4_3
#> # A tibble: 4 x 3
#>   user_id days_since_last churned
#>   <chr>             <int> <lgl>
#> 1 u2                   79 FALSE
#> 2 u3                   60 FALSE
#> 3 u1                   42 FALSE
#> 4 u4                   14 FALSE
```

**Explanation:** The 90-day threshold is industry standard for ecommerce; subscription products often use shorter windows (14 to 30 days) tied to the billing cycle. The key idea is computing the gap relative to a fixed `ref_d` rather than `Sys.Date()` so the table is reproducible; this matters when the win-back campaign is built today and shipped a week later. For B2B, the threshold usually scales with median repurchase interval.

</details>

### Exercise 4.4: Logistic regression to predict 90-day churn

**Task:** The CRM team wants a quick churn-risk score from a small training set with `recency` (days since last purchase), `frequency` (lifetime orders), and `tenure_days` (days since signup) as predictors. Fit a logistic regression with `glm(family = binomial)` predicting the binary `churned` label. Extract the model's coefficient table as a tibble (column names: `term`, `estimate`, `p_value`) and save to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   term         estimate  p_value
#>   <chr>           <dbl>    <dbl>
#> 1 (Intercept)   -3.20    0.40
#> 2 recency        0.097   0.06
#> 3 frequency     -0.43    0.30
#> 4 tenure_days    0.0010  0.85
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(11)
n <- 200
train <- tibble(
  recency     = rpois(n, 30),
  frequency   = rpois(n, 5) + 1,
  tenure_days = rpois(n, 365),
  churned     = rbinom(n, 1, plogis(-3 + 0.05*rpois(n,30) - 0.4*(rpois(n,5)+1)))
)

ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
n <- 200
train <- tibble(
  recency     = rpois(n, 30),
  frequency   = rpois(n, 5) + 1,
  tenure_days = rpois(n, 365),
  churned     = rbinom(n, 1, plogis(-3 + 0.05*rpois(n,30) - 0.4*(rpois(n,5)+1)))
)

fit <- glm(churned ~ recency + frequency + tenure_days,
           data = train, family = binomial)

cs <- summary(fit)$coefficients
ex_4_4 <- tibble(
  term     = rownames(cs),
  estimate = round(cs[, "Estimate"], 4),
  p_value  = round(cs[, "Pr(>|z|)"], 3)
)
ex_4_4
#> # A tibble: 4 x 3
#>   term         estimate p_value
#>   <chr>           <dbl>   <dbl>
#> 1 (Intercept)   -3.20      0.40
#> 2 recency        0.097     0.06
#> 3 frequency     -0.43      0.30
#> 4 tenure_days    0.0010    0.85
```

**Explanation:** Logistic regression remains the production default for first-pass churn scoring because coefficients are interpretable (a +1 unit of recency multiplies churn odds by `exp(0.097) = 1.10`), and the model is calibrated out of the box, unlike most tree ensembles. Frequency's negative coefficient correctly signals that engaged customers churn less. For production lift, gradient boosted trees beat logistic by 2 to 5% AUC but require calibration; logistic is still the cleanest baseline and the easiest to debug with stakeholders.

</details>

## Section 5. Customer lifetime value and revenue concentration (3 problems)

### Exercise 5.1: Historical CLV per customer

**Task:** The finance partner wants a simple historical CLV per customer for the loyalty cohort: average order value times order frequency times average gross margin (assume 30%). Compute `aov`, `freq`, and `clv = aov * freq * 0.30` per `user_id` from the supplied transactions tibble. Save to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   user_id   aov  freq   clv
#>   <chr>   <dbl> <int> <dbl>
#> 1 u1       100      3   90
#> 2 u2        75      2   45
#> 3 u3       145      2   87
#> 4 u4        62.5    2   37.5
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- purchases |>
  # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- purchases |>
  group_by(user_id) |>
  summarise(
    aov  = mean(amount),
    freq = n(),
    clv  = aov * freq * 0.30,
    .groups = "drop"
  )
ex_5_1
#> # A tibble: 4 x 4
#>   user_id   aov  freq   clv
#>   <chr>   <dbl> <int> <dbl>
#> 1 u1       100      3   90
#> 2 u2        75      2   45
#> 3 u3       145      2   87
#> 4 u4        62.5    2   37.5
```

**Explanation:** Historical CLV is the simplest CLV form, fine for early-stage benchmarking but blind to expected future purchases. The 30% gross margin is a placeholder and must come from finance; using gross revenue instead of margin overstates true value by 3 to 5x. For a more defensible estimate, move to predictive CLV (BTYD models like BG/NBD plus Gamma-Gamma) once you have 12+ months of data.

</details>

### Exercise 5.2: Project predicted CLV with a discount rate

**Task:** Building on historical CLV, project a forward 12-month CLV assuming each customer continues at their historical monthly purchase rate, with a 1% monthly discount rate applied to future cash flows. Compute `monthly_freq = freq / tenure_months` (assume 5 tenure months for simplicity), then sum the discounted contribution `monthly_freq * aov * 0.30 / (1 + 0.01)^t` for `t = 1:12`. Save the per-user predicted CLV tibble as `ex_5_2`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   user_id monthly_freq pred_clv_12mo aov
#>   <chr>          <dbl>         <dbl> <dbl>
#> 1 u1             0.6           201.   100
#> 2 u2             0.4           100.    75
#> 3 u3             0.4           194.   145
#> 4 u4             0.4            83.7   62.5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- ex_5_1 |>
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
discount <- function(monthly_freq, aov, margin = 0.30, r = 0.01, horizon = 12) {
  t <- 1:horizon
  sum(monthly_freq * aov * margin / (1 + r)^t)
}

ex_5_2 <- ex_5_1 |>
  mutate(monthly_freq = freq / 5,
         pred_clv_12mo = round(mapply(discount, monthly_freq, aov), 2)) |>
  select(user_id, monthly_freq, pred_clv_12mo, aov)
ex_5_2
#> # A tibble: 4 x 4
#>   user_id monthly_freq pred_clv_12mo   aov
#>   <chr>          <dbl>         <dbl> <dbl>
#> 1 u1             0.6           201.  100
#> 2 u2             0.4           100.   75
#> 3 u3             0.4           194.  145
#> 4 u4             0.4            83.7  62.5
```

**Explanation:** Discounting future cash flows is mandatory in finance partner conversations because a dollar booked next year is worth less than a dollar today. The 1% monthly rate is roughly 12.7% annual, which matches typical SaaS WACC. `mapply()` lets the discount function take per-row inputs; for production-scale data, vectorise the whole formula directly with `purrr::pmap_dbl()` or pre-compute the discount factor sum and multiply once.

</details>

### Exercise 5.3: Pareto check: top 20% of customers driving X% of revenue

**Task:** The CFO wants a one-line stat for the board deck: what percent of total revenue comes from the top 20% of customers ranked by spend. From a supplied per-customer revenue tibble, sort by revenue descending, take the top 20% of customers (by count), and compute their share of total revenue. Save a one-row tibble with `top_n_users`, `top_revenue`, `total_revenue`, `share_pct` to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   top_n_users top_revenue total_revenue share_pct
#>         <int>       <dbl>         <dbl>     <dbl>
#> 1          20        4830         12450      38.8
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(99)
spend <- tibble(
  user_id = paste0("u", sprintf("%03d", 1:100)),
  revenue = round(rlnorm(100, meanlog = 4, sdlog = 0.8), 0)
)

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
spend <- tibble(
  user_id = paste0("u", sprintf("%03d", 1:100)),
  revenue = round(rlnorm(100, meanlog = 4, sdlog = 0.8), 0)
)

n_top <- ceiling(nrow(spend) * 0.20)
top   <- spend |> arrange(desc(revenue)) |> slice_head(n = n_top)

ex_5_3 <- tibble(
  top_n_users   = n_top,
  top_revenue   = sum(top$revenue),
  total_revenue = sum(spend$revenue),
  share_pct     = round(100 * sum(top$revenue) / sum(spend$revenue), 1)
)
ex_5_3
#> # A tibble: 1 x 4
#>   top_n_users top_revenue total_revenue share_pct
#>         <int>       <dbl>         <dbl>     <dbl>
#> 1          20        4830         12450      38.8
```

**Explanation:** The 80/20 Pareto rule is folk wisdom rather than a constant; in practice you usually see top 20% driving anywhere from 50% to 80% of revenue. A share well below 50% suggests the customer base is unusually flat (commoditised retail), while above 80% concentration is a serious risk to flag for the CRO. Always pair this with a top-1% concentration stat: enterprise SaaS often has 1% of accounts driving 30%+ of revenue, which is not visible in the 20/80 split alone.

</details>

## Section 6. Funnel analysis and campaign rollups (2 problems)

### Exercise 6.1: Funnel drop-off rates between stages

**Task:** A growth analyst wants the classic funnel summary for a new pricing-page experiment: counts and step-over-step conversion rate between Visit, Signup, Activate, Pay. Given the supplied stage-count tibble (already aggregated), compute `conversion_from_prev` (this stage / previous stage) and `overall_from_top` (this stage / Visit). Save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   stage    users conversion_from_prev overall_from_top
#>   <chr>    <int>                <dbl>            <dbl>
#> 1 Visit    10000               NA                1
#> 2 Signup    2400                0.24             0.24
#> 3 Activate  1080                0.45             0.108
#> 4 Pay        250                0.231            0.025
```

**Difficulty:** Intermediate

```r title="Your turn"
funnel <- tibble(
  stage = c("Visit","Signup","Activate","Pay"),
  users = c(10000, 2400, 1080, 250)
)

ex_6_1 <- funnel |>
  # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- funnel |>
  mutate(
    conversion_from_prev = round(users / lag(users), 3),
    overall_from_top     = round(users / first(users), 3)
  )
ex_6_1
#> # A tibble: 4 x 4
#>   stage    users conversion_from_prev overall_from_top
#>   <chr>    <int>                <dbl>            <dbl>
#> 1 Visit    10000               NA                1
#> 2 Signup    2400                0.24             0.24
#> 3 Activate  1080                0.45             0.108
#> 4 Pay        250                0.231            0.025
```

**Explanation:** `lag()` gives the previous row's value, which is the canonical funnel-step ratio computation. The two ratios serve different audiences: `conversion_from_prev` is what PMs use to pinpoint the worst step, while `overall_from_top` is what finance and CEOs care about because it ties to total cohort yield. The biggest analytical mistake is comparing funnel steps without normalising for the time window: a Visit on day 1 and a Pay on day 30 measure different cohorts of users.

</details>

### Exercise 6.2: Top campaigns ranked by conversions

**Task:** The paid-media manager exported a campaign-level summary with `campaign`, `clicks`, `conversions`, `spend` and wants the top 3 campaigns by conversions plus the cost-per-acquisition (`spend / conversions`) for each. Sort descending by conversions, take the top 3, and add the `cpa` column. Save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   campaign  clicks conversions spend   cpa
#>   <chr>      <int>       <int> <dbl> <dbl>
#> 1 brand_us    8500         420  3200  7.62
#> 2 retgt_eu    6200         340  2100  6.18
#> 3 prosp_us    9100         280  4500 16.1
```

**Difficulty:** Beginner

```r title="Your turn"
campaigns <- tibble(
  campaign    = c("brand_us","prosp_us","retgt_eu","brand_eu","prosp_eu"),
  clicks      = c(8500, 9100, 6200, 4200, 5500),
  conversions = c(420, 280, 340, 150, 110),
  spend       = c(3200, 4500, 2100, 1800, 2400)
)

ex_6_2 <- campaigns |>
  # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- campaigns |>
  mutate(cpa = round(spend / conversions, 2)) |>
  arrange(desc(conversions)) |>
  slice_head(n = 3)
ex_6_2
#> # A tibble: 3 x 5
#>   campaign  clicks conversions spend   cpa
#>   <chr>      <int>       <int> <dbl> <dbl>
#> 1 brand_us    8500         420  3200  7.62
#> 2 retgt_eu    6200         340  2100  6.18
#> 3 prosp_us    9100         280  4500 16.1
```

**Explanation:** Ranking by raw conversions can mislead budget reallocation because a high-volume campaign with poor CPA is a worse use of spend than a low-volume campaign with strong CPA. A defensible ranking adds a CPA threshold filter or sorts by efficiency (conversions per dollar). For paid-media reviews, always present conversions, spend, and CPA together, never any single column in isolation.

</details>

## What to do next

Now that you have shipped 20 marketing analytics workflows, build the supporting muscle:

- [dplyr exercises in R](dplyr-Exercises-in-R.html) for the verb mechanics that drive every aggregation here.
- [tidyverse exercises in R](tidyverse-Exercises-in-R.html) to extend cohort and attribution joins across packages.
- [A/B testing exercises in R](A-B-Testing-Exercises-in-R.html) for deeper experimentation power, sequential testing, and multi-arm tests.
- [Logistic regression exercises in R](Logistic-Regression-Exercises-in-R.html) to harden the churn-prediction modelling step.
