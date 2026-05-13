---
title: "dplyr Join Exercises: 20 Real-World Practice Problems in R"
slug: "dplyr-Join-Exercises"
description: "Practice dplyr joins in R with 20 real-world problems on left, right, inner, full, semi, anti, multi-key, inequality, rolling joins, and reconciliation."
keywords: "dplyr join exercises, left_join exercises, inner_join exercises R, join_by exercises, rolling join exercises, semi_join anti_join practice"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "dplyr Join Exercises"
sidebar_order: 200
fr_parent: "R-Joins.html"
auto_link_terms: "dplyr join exercises|left_join exercises|inner_join exercises|join_by exercises|rolling join exercises|filtering joins practice"
auto_link_case_sensitive: false
target_keyword: "dplyr join exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr Join Exercises: 20 Real-World Practice Problems in R

<p class="lead">Twenty practice problems on dplyr joins built around a small SaaS analytics dataset. Covers mutating joins (left, right, inner, full), filtering joins (semi, anti), multi-key joins, the modern <code>join_by()</code> helper for inequality and rolling matches, self-joins, and three end-to-end reconciliation workflows. Every solution is hidden so you can attempt each problem first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
```

```r title="Setup tables shared across the exercises"
users <- tibble(
  user_id = 1:6,
  name    = c("Alice","Bo","Cara","Dan","Eve","Frank"),
  plan    = c("pro","free","pro","free","pro","enterprise"),
  signup  = as.Date(c("2024-01-12","2024-02-04","2024-03-19",
                      "2024-04-22","2024-06-08","2024-09-15"))
)

events <- tibble(
  event_id   = 101:112,
  user_id    = c(1L,2L,1L,3L,7L,5L,1L,4L,5L,9L,2L,5L),
  event_date = as.Date(c("2024-04-02","2024-04-15","2024-05-10","2024-05-22",
                          "2024-06-01","2024-07-04","2024-08-12","2024-09-09",
                          "2024-10-21","2024-11-30","2024-12-05","2025-01-08")),
  type       = c("login","upgrade","login","login","login","churn",
                 "login","upgrade","login","login","login","reactivate"),
  amount     = c(0, 49, 0, 0, 0, 0, 0, 99, 0, 0, 0, 49)
)

plans <- tibble(
  plan       = c("free","pro","enterprise","team"),
  monthly_fee = c(0, 49, 199, 99)
)

refunds <- tibble(
  event_id  = c(102L, 108L),
  reason    = c("billing error","duplicate charge"),
  refunded  = c(49, 99)
)

tiers <- tibble(
  min_amt = c(0, 50, 100),
  max_amt = c(50, 100, Inf),
  tier    = c("micro","small","mid")
)

price_history <- tibble(
  plan       = c("pro","pro","pro","enterprise","enterprise"),
  valid_from = as.Date(c("2023-01-01","2024-01-01","2024-07-01",
                          "2023-01-01","2024-04-01")),
  list_fee   = c(39, 49, 59, 149, 199)
)
```

Note: `events` deliberately contains two orphan rows (user_id 7 and 9 do not exist in `users`), and `plans` contains a row ("team") with no users. Several exercises rely on those gaps to demonstrate how joins handle unmatched keys.

## Section 1. Mutating joins (4 problems)

### Exercise 1.1: Attach plan fee to every user with left_join

**Task:** A billing analyst wants a roster showing every user along with the monthly fee for their plan. Use `left_join()` to attach the `monthly_fee` column from `plans` to `users` on the `plan` key, preserving every user row even when a plan has no matching record. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 6 x 5
#>   user_id name   plan       signup     monthly_fee
#>     <int> <chr>  <chr>      <date>           <dbl>
#> 1       1 Alice  pro        2024-01-12          49
#> 2       2 Bo     free       2024-02-04           0
#> 3       3 Cara   pro        2024-03-19          49
#> 4       4 Dan    free       2024-04-22           0
#> 5       5 Eve    pro        2024-06-08          49
#> 6       6 Frank  enterprise 2024-09-15         199
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- users |>
  left_join(plans, by = "plan")
ex_1_1
#> # A tibble: 6 x 5
#>   user_id name   plan       signup     monthly_fee
#>     <int> <chr>  <chr>      <date>           <dbl>
#> 1       1 Alice  pro        2024-01-12          49
#> 2       2 Bo     free       2024-02-04           0
#> 3       3 Cara   pro        2024-03-19          49
#> 4       4 Dan    free       2024-04-22           0
#> 5       5 Eve    pro        2024-06-08          49
#> 6       6 Frank  enterprise 2024-09-15         199
```

**Explanation:** `left_join()` keeps every row from the left table and pulls matching columns from the right. Because every user's `plan` value has a match in `plans`, the result has 6 rows (same as `users`). The orphan plan "team" in `plans` is silently dropped, which is exactly what a left join is for: the left table drives the row count.

</details>

### Exercise 1.2: Keep only matched user-event rows with inner_join

**Task:** The product team wants to study only events whose `user_id` matches a known user, dropping the two orphan event rows in the process. Use `inner_join()` to combine `events` with `users` on `user_id` and save the result to `ex_1_2`. Confirm the row count drops from 12 to 10.

**Expected result:**

```
#> # A tibble: 10 x 8
#>    event_id user_id event_date type      amount name  plan       signup
#>       <int>   <int> <date>     <chr>      <dbl> <chr> <chr>      <date>
#>  1      101       1 2024-04-02 login          0 Alice pro        2024-01-12
#>  2      102       2 2024-04-15 upgrade       49 Bo    free       2024-02-04
#>  3      103       1 2024-05-10 login          0 Alice pro        2024-01-12
#>  4      104       3 2024-05-22 login          0 Cara  pro        2024-03-19
#>  5      106       5 2024-07-04 churn          0 Eve   pro        2024-06-08
#>  6      107       1 2024-08-12 login          0 Alice pro        2024-01-12
#>  7      108       4 2024-09-09 upgrade       99 Dan   free       2024-04-22
#>  8      109       5 2024-10-21 login          0 Eve   pro        2024-06-08
#>  9      111       2 2024-12-05 login          0 Bo    free       2024-02-04
#> 10      112       5 2025-01-08 reactivate    49 Eve   pro        2024-06-08
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- events |>
  inner_join(users, by = "user_id")
ex_1_2
#> # A tibble: 10 x 8
#>    event_id user_id event_date type      amount name  plan       signup
#>       <int>   <int> <date>     <chr>      <dbl> <chr> <chr>      <date>
#>  1      101       1 2024-04-02 login          0 Alice pro        2024-01-12
#> ...
```

**Explanation:** `inner_join()` returns only rows where the key exists in BOTH tables. Rows with `user_id` 7 and 9 in `events` have no match in `users`, so they disappear. Use this when you want to discard unmatched rows on either side. Be careful: silently dropping rows hides data-quality issues. Many shops prefer `left_join()` followed by an explicit `filter(!is.na(...))` so the drop count is visible.

</details>

### Exercise 1.3: Show all users and all plans with full_join

**Task:** An audit report wants to surface both customers whose plan is unknown (none here) AND plans with zero customers (the "team" plan). Use `full_join()` between `users` and `plans` on `plan` to retain every row from both sides, then save the result to `ex_1_3`. Inspect the row count.

**Expected result:**

```
#> # A tibble: 7 x 5
#>   user_id name   plan       signup     monthly_fee
#>     <int> <chr>  <chr>      <date>           <dbl>
#> 1       1 Alice  pro        2024-01-12          49
#> 2       2 Bo     free       2024-02-04           0
#> 3       3 Cara   pro        2024-03-19          49
#> 4       4 Dan    free       2024-04-22           0
#> 5       5 Eve    pro        2024-06-08          49
#> 6       6 Frank  enterprise 2024-09-15         199
#> 7      NA  <NA>   team       NA                  99
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- users |>
  full_join(plans, by = "plan")
ex_1_3
#> # A tibble: 7 x 5
#>   user_id name  plan       signup     monthly_fee
#>     <int> <chr> <chr>      <date>           <dbl>
#> ...
#> 7      NA  <NA>  team       NA                  99
```

**Explanation:** `full_join()` is the union of `left_join()` and `right_join()`. The extra row at the bottom (plan "team", no user) tells the audit team a plan exists with no paying customers. Use a full join when the question is "what rows exist in either side", not "enrich rows in one side". The trade-off is that you must handle NA values on BOTH sides afterwards.

</details>

### Exercise 1.4: Attach event context to every refund with right_join

**Task:** The finance team needs every refund row enriched with the original event details (date, type, amount). Use `right_join()` from `events` to `refunds` on `event_id` so the refund table drives the row count. Save the result to `ex_1_4`. Verify it has exactly 2 rows.

**Expected result:**

```
#> # A tibble: 2 x 7
#>   event_id user_id event_date type     amount reason           refunded
#>      <int>   <int> <date>     <chr>     <dbl> <chr>               <dbl>
#> 1      102       2 2024-04-15 upgrade      49 billing error          49
#> 2      108       4 2024-09-09 upgrade      99 duplicate charge       99
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- events |>
  right_join(refunds, by = "event_id")
ex_1_4
#> # A tibble: 2 x 7
#>   event_id user_id event_date type     amount reason           refunded
#>      <int>   <int> <date>     <chr>     <dbl> <chr>               <dbl>
#> 1      102       2 2024-04-15 upgrade      49 billing error          49
#> 2      108       4 2024-09-09 upgrade      99 duplicate charge       99
```

**Explanation:** `right_join(x, y)` is equivalent to `left_join(y, x)` with the column order flipped. Most R style guides recommend always using `left_join()` and reversing the argument order if needed, because reading the pipeline left-to-right matches row-count intuition. `right_join()` exists for readability when the natural sentence is "for each refund, attach the matching event".

</details>

## Section 2. Filtering joins (3 problems)

### Exercise 2.1: Find users who had at least one event with semi_join

**Task:** A retention dashboard needs the subset of `users` who appear at least once in `events`, without any columns from `events` itself. Use `semi_join()` on `user_id` to filter `users` down to active users only. Save the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   user_id name  plan  signup
#>     <int> <chr> <chr> <date>
#> 1       1 Alice pro   2024-01-12
#> 2       2 Bo    free  2024-02-04
#> 3       3 Cara  pro   2024-03-19
#> 4       4 Dan   free  2024-04-22
#> 5       5 Eve   pro   2024-06-08
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- users |>
  semi_join(events, by = "user_id")
ex_2_1
#> # A tibble: 5 x 4
#>   user_id name  plan  signup
#>     <int> <chr> <chr> <date>
#> 1       1 Alice pro   2024-01-12
#> ...
```

**Explanation:** `semi_join()` is a filter, not a merge: it returns rows of the left table whose key appears in the right table, and adds zero columns. It is the dplyr equivalent of `WHERE EXISTS` in SQL. Unlike `inner_join()`, it never duplicates rows when the right side has multiple matches per key, so `semi_join()` is the right tool for "give me the users who did X" questions.

</details>

### Exercise 2.2: Find users with zero events using anti_join

**Task:** The growth team wants to identify users who signed up but never produced an event, so they can target re-engagement messaging. Use `anti_join()` on `user_id` to filter `users` down to those NOT present in `events`. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   user_id name  plan       signup
#>     <int> <chr> <chr>      <date>
#> 1       6 Frank enterprise 2024-09-15
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- users |>
  anti_join(events, by = "user_id")
ex_2_2
#> # A tibble: 1 x 4
#>   user_id name  plan       signup
#>     <int> <chr> <chr>      <date>
#> 1       6 Frank enterprise 2024-09-15
```

**Explanation:** `anti_join()` is the negation of `semi_join()`: rows of the left table whose key is absent from the right table. It is the dplyr equivalent of `WHERE NOT EXISTS`. Frank is the only user whose `user_id` (6) never appears in `events`. A common alternative is `filter(!user_id %in% events$user_id)`, but `anti_join()` is faster on large tables and handles multi-column keys naturally.

</details>

### Exercise 2.3: Chain filters to find paying users who churned

**Task:** Marketing wants the names of users on a paid plan (`monthly_fee > 0`) who have at least one event of `type == "churn"`. Combine `semi_join()` against a churn-only subset of events and `semi_join()` against a paying-plans subset to filter `users`. Save the result to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   user_id name  plan  signup
#>     <int> <chr> <chr> <date>
#> 1       5 Eve   pro   2024-06-08
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- users |>
  semi_join(filter(events, type == "churn"), by = "user_id") |>
  semi_join(filter(plans, monthly_fee > 0), by = "plan")
ex_2_3
#> # A tibble: 1 x 4
#>   user_id name  plan  signup
#>     <int> <chr> <chr> <date>
#> 1       5 Eve   pro   2024-06-08
```

**Explanation:** Chaining two filtering joins lets you express "users matching condition A in table 1 AND condition B in table 2" without exposing columns from either right-hand table. The result keeps only `users` columns. An alternative is `inner_join()` then `select()`, but filtering joins are clearer about intent and avoid accidental row duplication when right-hand tables have multiple matches per key.

</details>

## Section 3. Multi-key and renamed-key joins (3 problems)

### Exercise 3.1: Join when keys have different column names

**Task:** Imagine `refunds` had `txn_id` instead of `event_id` (it does not here, so simulate by renaming first). Rename `refunds$event_id` to `txn_id`, then join it back to `events` using a named-vector `by` argument so the key columns are matched despite their different names. Save the result to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 2 x 7
#>   event_id user_id event_date type     amount reason           refunded
#>      <int>   <int> <date>     <chr>     <dbl> <chr>               <dbl>
#> 1      102       2 2024-04-15 upgrade      49 billing error          49
#> 2      108       4 2024-09-09 upgrade      99 duplicate charge       99
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
refunds_renamed <- refunds |> rename(txn_id = event_id)

ex_3_1 <- events |>
  inner_join(refunds_renamed, by = c("event_id" = "txn_id"))
ex_3_1
#> # A tibble: 2 x 7
#>   event_id user_id event_date type     amount reason           refunded
#>      <int>   <int> <date>     <chr>     <dbl> <chr>               <dbl>
#> 1      102       2 2024-04-15 upgrade      49 billing error          49
#> 2      108       4 2024-09-09 upgrade      99 duplicate charge       99
```

**Explanation:** `by = c("left_name" = "right_name")` pairs columns whose names differ between tables. The output keeps the LEFT side's column name (`event_id`), not the right side's (`txn_id`). The same pattern extends to multi-key joins: `by = c("a" = "x", "b" = "y")`. The modern `join_by(event_id == txn_id)` syntax does the same thing with cleaner reading order.

</details>

### Exercise 3.2: Join on two keys simultaneously

**Task:** A pricing audit needs to attach the active `list_fee` from `price_history` to each event by matching BOTH `plan` AND the first valid_from date that applies. As a building block, first join `events` to `users` to get `plan`, then equi-join to `price_history` on `plan` only (you will handle the date dimension in 4.3). Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 22 x 7
#>    event_id user_id plan  event_date type     amount list_fee
#>       <int>   <int> <chr> <date>     <chr>     <dbl>    <dbl>
#>  1      101       1 pro   2024-04-02 login         0       39
#>  2      101       1 pro   2024-04-02 login         0       49
#>  3      101       1 pro   2024-04-02 login         0       59
#> ...
#> # 19 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- events |>
  inner_join(users |> select(user_id, plan), by = "user_id") |>
  inner_join(price_history, by = "plan") |>
  select(event_id, user_id, plan, event_date, type, amount, list_fee)
ex_3_2
#> # A tibble: 22 x 7
#>    event_id user_id plan  event_date type     amount list_fee
#> ...
```

**Explanation:** Each event matches every historical price for its plan, so the result expands: 10 valid event rows times the number of historical fees for that plan (3 for pro, 2 for enterprise). This Cartesian-style expansion is a classic warning sign that you need an INEQUALITY join to pick the ONE row with the right valid_from. That refinement is in Exercise 4.3.

</details>

### Exercise 3.3: Disambiguate duplicate column names with suffix

**Task:** Both `events` (after enrichment) and `plans` have an `amount`/`monthly_fee` pair, and a naive join can produce confusing names. Join enriched events to `plans` and use the `suffix` argument to rename clashing columns. Specifically, after `events |> inner_join(users) |> inner_join(plans)`, give clashing columns the suffixes `_evt` and `_plan`. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 10 x 9
#>    event_id user_id event_date type      amount name  plan  signup     monthly_fee
#>       <int>   <int> <date>     <chr>      <dbl> <chr> <chr> <date>           <dbl>
#>  1      101       1 2024-04-02 login          0 Alice pro   2024-01-12          49
#> ...
#> # 9 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- events |>
  inner_join(users, by = "user_id") |>
  inner_join(plans, by = "plan", suffix = c("_evt", "_plan"))
ex_3_3
#> # A tibble: 10 x 9
#>    event_id user_id event_date type      amount name  plan  signup     monthly_fee
#>       <int>   <int> <date>     <chr>      <dbl> <chr> <chr> <date>           <dbl>
#> ...
```

**Explanation:** `suffix` only takes effect when there ARE clashing column names. In this exact dataset there is no overlap, so the suffixes are not applied, but the `suffix` argument is critical when you join, say, two snapshots of the same wide table. The default `c(".x", ".y")` is dplyr's fallback. Always pass an explicit `suffix` in production pipelines: silently named `.x` and `.y` columns are a leading cause of downstream bugs.

</details>

## Section 4. join_by and inequality joins (4 problems)

### Exercise 4.1: Bucket events into amount tiers with an inequality join

**Task:** Each event has an `amount`, and the team wants to bucket events into "micro" / "small" / "mid" tiers from the `tiers` table where `amount` falls between `min_amt` (inclusive) and `max_amt` (exclusive). Use `inner_join()` with `join_by(amount >= min_amt, amount < max_amt)` to attach a `tier` label. Save the result to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 12 x 5
#>    event_id type       amount min_amt max_amt tier
#>       <int> <chr>       <dbl>   <dbl>   <dbl> <chr>
#>  1      101 login           0       0      50 micro
#>  2      102 upgrade        49       0      50 micro
#>  3      103 login           0       0      50 micro
#> ...
#>  8      108 upgrade        99      50     100 small
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- events |>
  inner_join(tiers, join_by(amount >= min_amt, amount < max_amt)) |>
  select(event_id, type, amount, min_amt, max_amt, tier)
ex_4_1
#> # A tibble: 12 x 6
#> ...
```

**Explanation:** `join_by()` (dplyr 1.1+) accepts inequality conditions directly, replacing the older trick of `crossing()` + `filter()`. The two conditions act as AND, picking the single tier row where `amount` falls in the half-open interval `[min_amt, max_amt)`. If multiple tier rows could match (overlapping intervals), the result would duplicate event rows: design your interval tables to be disjoint.

</details>

### Exercise 4.2: Keep only events after each user's signup date

**Task:** A retention analyst wants to drop any event that occurred before the user's `signup` date (a data-quality check). Use `inner_join()` between `events` and `users` with `join_by(user_id, event_date >= signup)` so each row keeps only its valid post-signup events. Save the result to `ex_4_2` and confirm row count is 10 (orphan event rows already drop because their user_id is missing).

**Expected result:**

```
#> # A tibble: 10 x 6
#>    event_id user_id event_date type      amount name
#>       <int>   <int> <date>     <chr>      <dbl> <chr>
#>  1      101       1 2024-04-02 login          0 Alice
#>  2      102       2 2024-04-15 upgrade       49 Bo
#>  3      103       1 2024-05-10 login          0 Alice
#> ...
#> # 7 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- events |>
  inner_join(users, join_by(user_id, event_date >= signup)) |>
  select(event_id, user_id, event_date, type, amount, name)
ex_4_2
#> # A tibble: 10 x 6
#> ...
```

**Explanation:** Mixing an equality condition (`user_id`) with an inequality (`event_date >= signup`) gives a per-key filter. This is how you express "every event for user X that happened on or after X's signup date" in one join. Without the inequality, you would post-filter with `filter(event_date >= signup)`, which works but separates the join logic from the validity rule. Keeping them together documents intent.

</details>

### Exercise 4.3: Pick the price effective on each event date

**Task:** Each event's plan has a history of `list_fee` values keyed by `valid_from`. Use a non-equi join to attach the SINGLE price row whose `valid_from` is the latest date less than or equal to the event_date. Use `join_by(plan, valid_from <= event_date)` then keep only the maximum `valid_from` per event. Save the result to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 10 x 5
#>    event_id plan  event_date valid_from list_fee
#>       <int> <chr> <date>     <date>        <dbl>
#>  1      101 pro   2024-04-02 2024-01-01       49
#>  2      102 free  2024-04-15 NA               NA
#>  3      103 pro   2024-05-10 2024-01-01       49
#> ...
#>  8      108 free  2024-09-09 NA               NA
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events_with_plan <- events |>
  inner_join(users |> select(user_id, plan), by = "user_id")

ex_4_3 <- events_with_plan |>
  left_join(price_history, join_by(plan, valid_from <= event_date)) |>
  group_by(event_id) |>
  slice_max(valid_from, n = 1, with_ties = FALSE) |>
  ungroup() |>
  select(event_id, plan, event_date, valid_from, list_fee)
ex_4_3
#> # A tibble: 10 x 5
#> ...
```

**Explanation:** This is the classic "as-of" pricing pattern. The inequality `valid_from <= event_date` matches every historical price row that was already in effect; `slice_max(valid_from)` picks the most recent one. Free-plan events have no rows in `price_history`, so the left_join produces NAs (and `slice_max` keeps those NA rows because the grouping has one entry). A leaner alternative is `join_by(closest())` in the next exercise.

</details>

### Exercise 4.4: Reproduce the as-of join with join_by(closest())

**Task:** The `closest()` helper in `join_by()` lets you find the nearest matching row without a post-join `slice_max`. Use `join_by(plan, closest(event_date >= valid_from))` to attach the most recent price row to each event in one step. Save the result to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 10 x 5
#>    event_id plan  event_date valid_from list_fee
#>       <int> <chr> <date>     <date>        <dbl>
#>  1      101 pro   2024-04-02 2024-01-01       49
#>  2      102 free  2024-04-15 NA               NA
#>  3      103 pro   2024-05-10 2024-01-01       49
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events_with_plan <- events |>
  inner_join(users |> select(user_id, plan), by = "user_id")

ex_4_4 <- events_with_plan |>
  left_join(price_history, join_by(plan, closest(event_date >= valid_from))) |>
  select(event_id, plan, event_date, valid_from, list_fee)
ex_4_4
#> # A tibble: 10 x 5
#> ...
```

**Explanation:** `closest()` wraps an inequality and tells dplyr "of all rows that satisfy this condition, return only the closest match". It removes the need for a separate `group_by()` + `slice_max()` pass and is dramatically faster on large tables. The expression `closest(event_date >= valid_from)` reads as: "find the row with the largest `valid_from` that is still less than or equal to `event_date`".

</details>

## Section 5. Rolling joins and self-joins (3 problems)

### Exercise 5.1: Forward-fill a sparse price series to a daily grid

**Task:** Suppose finance needs a daily price stream for the "pro" plan covering Jan 1 to Aug 1 2024. Build a daily date tibble for that range and use `join_by(closest(date >= valid_from))` to forward-fill the price from `price_history` for plan = "pro" only. Save the result to `ex_5_1` (213 rows).

**Expected result:**

```
#> # A tibble: 213 x 3
#>    date       valid_from list_fee
#>    <date>     <date>        <dbl>
#>  1 2024-01-01 2024-01-01       49
#>  2 2024-01-02 2024-01-01       49
#> ...
#> 183 2024-07-01 2024-07-01       59
#> 184 2024-07-02 2024-07-01       59
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
daily <- tibble(date = seq.Date(as.Date("2024-01-01"),
                                as.Date("2024-08-01"), by = "day"))

pro_prices <- price_history |> filter(plan == "pro")

ex_5_1 <- daily |>
  left_join(pro_prices, join_by(closest(date >= valid_from))) |>
  select(date, valid_from, list_fee)
ex_5_1
#> # A tibble: 213 x 3
#> ...
```

**Explanation:** This is a "rolling join" or "as-of join", common in finance for forward-filling sparse rate or price curves onto a regular date grid. Each daily date matches the most recent `valid_from` that has already happened. Without `closest()`, the join would expand every daily row to one per historical price (3 here) and you would need `slice_max()` afterwards. `closest()` makes it a single pass.

</details>

### Exercise 5.2: Self-join to find each user's previous event

**Task:** A funnel analyst wants every event annotated with the date of that user's PREVIOUS event (NA for the first event per user). Sort `events` by `user_id`, then `event_date`, attach `lag(event_date)` via a self-join on `user_id` and `row_number()` keys. (Alternative: `mutate(prev_date = lag(event_date))` within `group_by(user_id)`; do it via self-join here for practice.) Save the result to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 12 x 4
#>    event_id user_id event_date prev_date
#>       <int>   <int> <date>     <date>
#>  1      101       1 2024-04-02 NA
#>  2      103       1 2024-05-10 2024-04-02
#>  3      107       1 2024-08-12 2024-05-10
#>  4      102       2 2024-04-15 NA
#>  5      111       2 2024-12-05 2024-04-15
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events_sorted <- events |>
  arrange(user_id, event_date) |>
  group_by(user_id) |>
  mutate(rn = row_number()) |>
  ungroup()

prev_lookup <- events_sorted |>
  mutate(rn = rn + 1) |>
  select(user_id, rn, prev_date = event_date)

ex_5_2 <- events_sorted |>
  left_join(prev_lookup, by = c("user_id", "rn")) |>
  select(event_id, user_id, event_date, prev_date)
ex_5_2
#> # A tibble: 12 x 4
#> ...
```

**Explanation:** A self-join with a shifted key column is one of three classic ways to express LAG. The other two are `dplyr::lag()` inside `mutate()`, and a window function with `mutate(prev = lag(event_date))` after `group_by()`. The self-join formulation generalizes to lookups across separate tables (e.g., "previous order for the same customer in a different account").

</details>

### Exercise 5.3: Compute days since the previous event per user

**Task:** Building on the prev_date pattern from 5.2, compute `days_since_prev`, the integer number of days between each event and the previous event for that same user. Use `mutate(days_since_prev = as.integer(event_date - prev_date))`. Save the result to `ex_5_3`. Confirm Alice's third login is 94 days after her second.

**Expected result:**

```
#> # A tibble: 12 x 5
#>    event_id user_id event_date prev_date  days_since_prev
#>       <int>   <int> <date>     <date>               <int>
#>  1      101       1 2024-04-02 NA                      NA
#>  2      103       1 2024-05-10 2024-04-02              38
#>  3      107       1 2024-08-12 2024-05-10              94
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ex_5_2 |>
  mutate(days_since_prev = as.integer(event_date - prev_date))
ex_5_3
#> # A tibble: 12 x 5
#> ...
```

**Explanation:** Subtracting two `Date` objects yields a `difftime` in days, and `as.integer()` strips the units to a plain integer. The same pattern produces inter-arrival times for clickstream sessions, time between hospital visits, or trade-to-trade gaps in finance. NAs propagate naturally for first-event-per-user rows; downstream code should `filter(!is.na(days_since_prev))` or `coalesce(0L)` based on the question being asked.

</details>

## Section 6. End-to-end reconciliation (3 problems)

### Exercise 6.1: Compute net revenue per user (gross minus refunds)

**Task:** The finance team needs net revenue per user, defined as the sum of `amount` from `events` minus the sum of `refunded` from `refunds`. Build it in one pipeline: join events to refunds (left), compute net amount per event, then group by user. Save the per-user totals to `ex_6_1` (only the 5 active users appear).

**Expected result:**

```
#> # A tibble: 5 x 2
#>   user_id net_revenue
#>     <int>       <dbl>
#> 1       1           0
#> 2       2           0
#> 3       3           0
#> 4       4           0
#> 5       5          49
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- events |>
  inner_join(users |> select(user_id), by = "user_id") |>
  left_join(refunds, by = "event_id") |>
  mutate(refunded = coalesce(refunded, 0),
         net      = amount - refunded) |>
  group_by(user_id) |>
  summarise(net_revenue = sum(net), .groups = "drop")
ex_6_1
#> # A tibble: 5 x 2
#> ...
```

**Explanation:** The pattern is enrich-then-aggregate. `left_join(refunds)` keeps every event (most without a refund and so `NA` in `refunded`); `coalesce(refunded, 0)` turns those NAs into zeros so the subtraction does not propagate NA. The `inner_join(users)` upfront drops orphan events. Without it, orphan events would contribute amount to a nonexistent user_id. Always anchor revenue pipelines to a master user table.

</details>

### Exercise 6.2: Build a per-user daily snapshot with plan and tier

**Task:** Produce one row per user summarising lifetime activity: `events_total`, `gross_revenue`, `net_revenue`, `plan`, `monthly_fee`, and the modal event-amount `tier`. Start from `users`, enrich with events + refunds + plans + tiers, then aggregate. Save the result to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>   user_id name  plan       monthly_fee events_total net_revenue
#>     <int> <chr> <chr>            <dbl>        <int>       <dbl>
#> 1       1 Alice pro                 49            3           0
#> 2       2 Bo    free                 0            2           0
#> 3       3 Cara  pro                 49            1           0
#> 4       4 Dan   free                 0            1           0
#> 5       5 Eve   pro                 49            3          49
#> 6       6 Frank enterprise         199            0           0
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events_net <- events |>
  left_join(refunds, by = "event_id") |>
  mutate(refunded = coalesce(refunded, 0),
         net      = amount - refunded)

per_user <- events_net |>
  inner_join(users |> select(user_id), by = "user_id") |>
  group_by(user_id) |>
  summarise(events_total = n(),
            net_revenue  = sum(net),
            .groups = "drop")

ex_6_2 <- users |>
  left_join(plans, by = "plan") |>
  left_join(per_user, by = "user_id") |>
  mutate(events_total = coalesce(events_total, 0L),
         net_revenue  = coalesce(net_revenue, 0)) |>
  select(user_id, name, plan, monthly_fee, events_total, net_revenue)
ex_6_2
#> # A tibble: 6 x 6
#> ...
```

**Explanation:** Anchoring to `users` via a `left_join()` chain guarantees one row per user, including Frank with zero events. Building the per-user roll-up as a separate intermediate table (`per_user`) keeps the pipeline readable. The `coalesce()` calls after the final join convert NAs (Frank's missing event aggregates) to zeros so downstream consumers do not have to special-case missing data. This shape is exactly what a BI tool expects.

</details>

### Exercise 6.3: Data-quality report on orphan event rows

**Task:** The data team wants a tiny report listing every event whose `user_id` does NOT exist in `users` (orphans), along with the count of such events. Use `anti_join()` to extract orphans, then summarise: how many orphan rows, how many distinct orphan user_ids, and a sample of the offending events. Save the summary to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   orphan_rows distinct_users sample_ids
#>         <int>          <int> <chr>
#> 1           2              2 7, 9
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orphans <- events |>
  anti_join(users, by = "user_id")

ex_6_3 <- orphans |>
  summarise(orphan_rows    = n(),
            distinct_users = n_distinct(user_id),
            sample_ids     = paste(sort(unique(user_id)), collapse = ", "))
ex_6_3
#> # A tibble: 1 x 3
#>   orphan_rows distinct_users sample_ids
#>         <int>          <int> <chr>
#> 1           2              2 7, 9
```

**Explanation:** Pairing `anti_join()` with a `summarise()` rollup is the cheapest data-quality probe in dplyr: it shows you what is broken AND the size of the breakage in one short pipeline. Put a check like this at the top of every ETL job. If `orphan_rows > 0` and you cannot explain why, halt the pipeline; downstream revenue numbers depend on every event reconciling to a known user.

</details>

## What to do next

Now that you have practiced every flavour of dplyr join, deepen the foundations and broaden across related verbs:

- [dplyr joins in R](dplyr-joins-in-R.html): full reference for every join verb with worked examples
- [dplyr mutate exercises](dplyr-mutate-Exercises-in-R.html): 25 practice problems on column-wise transformations after a join
- [dplyr summarise exercises](dplyr-summarise-Exercises-in-R.html): 25 practice problems on aggregation patterns that often follow joins
- [tidyr pivot exercises](tidyr-pivot-Exercises-in-R.html): reshape wide and long data before or after joining
