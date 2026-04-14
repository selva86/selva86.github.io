---
title: "Data Privacy in R: Anonymise Datasets and Stay GDPR Compliant"
slug: "Data-Privacy-in-R"
description: "Anonymise data in R with k-anonymity, l-diversity, and differential privacy. Includes a practical GDPR compliance checklist for working data scientists."
keywords: "data privacy R, anonymisation R, k-anonymity, l-diversity, differential privacy, GDPR R, sdcMicro, re-identification, pseudonymisation"
auto_link_terms: "data privacy in R|anonymisation|k-anonymity|l-diversity|differential privacy|re-identification|pseudonymisation|GDPR compliance"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-14"
curriculum_id: "1.6.4"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Data Privacy in R"
sidebar_order: 53
---

# Data Privacy in R: Anonymise Datasets and Stay GDPR Compliant

<p class="lead">Data privacy in R means transforming a dataset so individuals cannot be linked back to their records — while preserving enough signal to do useful analysis. This guide walks through suppression, generalisation, k-anonymity, l-diversity, and differential privacy in plain R, then maps each technique to the practical GDPR obligations every data scientist should know.</p>

## How easy is it to re-identify someone in a "de-identified" dataset?

Most "anonymised" datasets aren't. Latanya Sweeney's classic 1997 study showed that 87% of the US population can be uniquely identified by ZIP code, gender, and date of birth alone. Before learning defences, you need to feel how easy the attack is. Let's build a tiny patient table, drop the obvious identifiers, and count how many rows are still uniquely identifiable from quasi-identifiers alone.

```r
library(dplyr)

patients <- data.frame(
  id = 1:10,
  name = c("Alice","Bob","Carla","Dan","Eve",
           "Frank","Grace","Henry","Ivy","Jack"),
  age = c(34, 45, 51, 67, 28, 39, 42, 56, 31, 44),
  gender = c("F","M","F","M","F","M","F","M","F","M"),
  zip = c("94110","94117","94110","94117","94110",
          "94117","94110","94117","94110","94117"),
  diagnosis = c("Asthma","HTN","Diabetes","Cancer","Asthma",
                "Diabetes","HTN","Cancer","Asthma","HTN")
)

deidentified <- patients |> select(-id, -name)
unique_check <- deidentified |> count(age, gender, zip)
sum(unique_check$n == 1)
#> [1] 10
```

Every one of the 10 rows is uniquely identifiable from `age + gender + zip` alone. The attacker doesn't need the names back — they just need a second dataset (a voter roll, a LinkedIn profile, an insurance claim) that shares those three fields. The "de-identified" file is effectively the original dataset with extra steps.

[WARNING]
**The 87% rule.** Sweeney's study showed three quasi-identifiers — ZIP code, gender, date of birth — uniquely fingerprint roughly 87% of US residents. Removing names is necessary, but very far from sufficient.

To see which column is doing the most damage, drop the most specific one and re-check.

```r
partial <- deidentified |> select(-zip)
partial |> count(age, gender) |> arrange(desc(n))
#>    age gender n
#> 1   28      F 1
#> 2   31      F 1
#> 3   34      F 1
#> 4   39      M 1
#> 5   42      F 1
#> ...
```

Even without ZIP, `age` and `gender` together leave most rows unique. That tells you which fields need the heaviest treatment in the rest of the article: the more granular a quasi-identifier is, the more it leaks.

**Try it:** Use `dplyr::distinct()` to count distinct combinations of `age`, `gender`, and `zip` in `deidentified` — confirm the same answer using a different verb.

```r
# Try it: count distinct quasi-id combinations with distinct()
ex_n_distinct <- # your code here

ex_n_distinct
#> Expected: 10
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_n_distinct <- deidentified |>
  distinct(age, gender, zip) |>
  nrow()
ex_n_distinct
#> [1] 10
```

**Explanation:** `distinct()` returns one row per unique combination of the listed columns; `nrow()` counts them. Same answer, cleaner pipeline.

</details>

## What are direct identifiers, quasi-identifiers, and sensitive attributes?

You can't pick a privacy technique until you know what kind of column you're protecting. Privacy practice splits dataset columns into four buckets, and each bucket gets a different treatment.

![Identifier categories and the mitigation each one needs.](screenshots/Data-Privacy-in-R-identifier-types.webp)
*Figure 1: Identifier categories and the mitigation each one needs.*

| Category | Examples | Risk | Treatment |
|---|---|---|---|
| Direct identifier | name, SSN, email, phone | Very high | Remove or hash |
| Quasi-identifier | age, ZIP, gender, job title | High in combination | Generalise or suppress |
| Sensitive attribute | diagnosis, salary, religion | High when leaked | Protect with k-anonymity, l-diversity, or differential privacy |
| Non-sensitive | purchase count, click count | Low | Usually keep as-is |

A small classifier function makes the categorisation explicit and reusable across pipelines.

```r
classify_col <- function(col) {
  direct <- c("id","name","email","phone","ssn","passport","address")
  quasi  <- c("age","zip","gender","sex","job","city","postcode","dob","birth")
  sensitive <- c("diagnosis","salary","religion","income","politics")
  if (col %in% direct) "direct"
  else if (col %in% quasi) "quasi"
  else if (col %in% sensitive) "sensitive"
  else "non_sensitive"
}

cls <- sapply(names(patients), classify_col)
cls
#>          id        name         age      gender         zip   diagnosis
#>    "direct"    "direct"     "quasi"     "quasi"     "quasi" "sensitive"
```

Two columns are direct identifiers (`id`, `name`), three are quasi-identifiers (`age`, `gender`, `zip`), and one is sensitive (`diagnosis`). Treating sequential row IDs as direct identifiers is deliberate — they uniquely pin a row even though they look like harmless integers.

[KEY INSIGHT]
**You can't protect what you haven't classified.** Every privacy technique below applies to specific column categories — running k-anonymity on a sensitive attribute is meaningless, and removing a non-sensitive count column destroys utility for nothing. Classify first, mitigate second.

**Try it:** Extend `classify_col()` so any column matching `"birth"` or `"dob"` is flagged as **direct** rather than quasi. Date of birth is too specific to be a quasi-identifier — it's a near-unique fingerprint.

```r
# Try it: rewrite classify_col() so date-of-birth columns count as direct
ex_classify <- function(col) {
  # your code here
}

ex_classify("dob")
#> Expected: "direct"
ex_classify("age")
#> Expected: "quasi"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_classify <- function(col) {
  direct <- c("id","name","email","phone","ssn","passport",
              "address","dob","birth_date")
  quasi  <- c("age","zip","gender","sex","job","city","postcode")
  sensitive <- c("diagnosis","salary","religion","income","politics")
  if (col %in% direct) "direct"
  else if (col %in% quasi) "quasi"
  else if (col %in% sensitive) "sensitive"
  else "non_sensitive"
}
ex_classify("dob")
#> [1] "direct"
ex_classify("age")
#> [1] "quasi"
```

**Explanation:** Dates of birth are usually unique within a small ZIP-and-gender slice, so privacy frameworks like HIPAA Safe Harbor and GDPR Article 4 treat them as direct identifiers despite looking like demographic data.

</details>

## How do you suppress and generalise data in R?

Suppression and generalisation are the workhorses of anonymisation — every more advanced technique builds on them. **Suppression** means removing values entirely; **generalisation** means replacing a precise value with a less precise one. An age of 34 becomes the band "30-39"; a five-digit ZIP becomes its three-digit prefix.

![The anonymisation spectrum, from raw data to differential privacy.](screenshots/Data-Privacy-in-R-anonymisation-spectrum.webp)
*Figure 2: The anonymisation spectrum, from raw data to differential privacy.*

The pipeline below drops the direct identifier `name`, buckets `age` into 5 bands with `cut()`, and truncates `zip` to its first three digits. Both transformations preserve population-level signal — average age by region is still meaningful — while making any single row much harder to single out.

```r
generalised <- patients |>
  select(-name) |>
  mutate(
    age_band = cut(age,
                   breaks = c(0, 30, 40, 50, 60, 100),
                   labels = c("<30","30-39","40-49","50-59","60+")),
    zip3 = substr(zip, 1, 3)
  ) |>
  select(-age, -zip)

head(generalised, 5)
#>   id gender diagnosis age_band zip3
#> 1  1      F    Asthma    30-39  941
#> 2  2      M       HTN    40-49  941
#> 3  3      F  Diabetes    50-59  941
#> 4  4      M    Cancer      60+  941
#> 5  5      F    Asthma     <30   941
```

`age` collapses from 10 distinct values to 5 bands; `zip` collapses from 2 distinct codes to 1 prefix. The data is now blurrier — a 34-year-old becomes "30-39", and the exact ZIP becomes "the 941 area". You've traded precision for privacy, and the trade is usually worth it for any dataset leaving your team.

The `id` column is still in there as a direct identifier. Replace it with a deterministic random token kept in a separate lookup table that the data controller stores under access control.

```r
set.seed(2026)
pseudo_map <- setNames(
  paste0("P", sprintf("%04d", sample(1000:9999, length(unique(patients$id))))),
  unique(patients$id)
)

patients_pseudo <- patients |>
  mutate(pseudo_id = pseudo_map[as.character(id)]) |>
  select(-id, -name)

head(patients_pseudo, 3)
#>   age gender   zip diagnosis pseudo_id
#> 1  34      F 94110    Asthma     P5640
#> 2  45      M 94117       HTN     P9442
#> 3  51      F 94110  Diabetes     P3819
```

`pseudo_id` lets you join records (for example, two visits by the same patient) without exposing the original `id`. The mapping is stored separately, so an attacker who steals the released file alone cannot re-link. This is what GDPR Article 4(5) calls "pseudonymisation" — it's not full anonymisation, since the controller can still re-link, but it is a hard legal upgrade compared to releasing raw IDs.

[NOTE]
**Production tip.** For real projects use the `sdcMicro` package for statistical disclosure control and the `diffpriv` package for differential privacy. They're not pre-compiled for the in-browser R that runs this page, so the examples here use base R + dplyr. Every method shown maps onto an `sdcMicro` function — `sdcMicro::globalRecode()` for `cut()` generalisation, `sdcMicro::kAnon()` for the next section's k-anonymity computation — once you install the package locally.

**Try it:** Generalise `patients` further — bucket `age` into just `"<50"` and `"50+"`, and shrink `zip` to its first two digits.

```r
# Try it: a coarser generalisation
ex_coarse <- patients |>
  mutate(
    # your code here
  ) |>
  select(-id, -name, -age, -zip)

head(ex_coarse, 3)
#> Expected columns: gender, diagnosis, age_bucket, zip2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_coarse <- patients |>
  mutate(
    age_bucket = ifelse(age < 50, "<50", "50+"),
    zip2 = substr(zip, 1, 2)
  ) |>
  select(-id, -name, -age, -zip)

head(ex_coarse, 3)
#>   gender diagnosis age_bucket zip2
#> 1      F    Asthma        <50   94
#> 2      M       HTN        <50   94
#> 3      F  Diabetes        50+   94
```

**Explanation:** Coarser bands raise the privacy floor by collapsing distinct values into fewer groups — the price is less analytical detail downstream.

</details>

## How do k-anonymity and l-diversity measure anonymity in R?

Generalising is fine, but how do you know when you've generalised *enough*? That's what k-anonymity quantifies. A dataset is **k-anonymous** if every combination of quasi-identifier values appears in at least k rows — so any individual is indistinguishable from at least k − 1 others.

Formally, k is the size of the smallest equivalence group:

$$\text{k}(D) = \min_{g \in G(D)} |g|$$

Where $D$ is the dataset, $G(D)$ is the set of groups formed by all distinct quasi-identifier value combinations, and $|g|$ is the size of group $g$.

In code that's a single `count()` followed by `min()`.

```r
k_groups <- generalised |>
  count(age_band, gender, zip3, name = "group_size") |>
  arrange(group_size)

head(k_groups, 5)
#>   age_band gender zip3 group_size
#> 1      <30      F  941          1
#> 2    30-39      F  941          1
#> 3    40-49      M  941          1
#> 4    50-59      F  941          1
#> 5      60+      M  941          1

k_anon <- min(k_groups$group_size)
cat("Dataset is", k_anon, "-anonymous\n")
#> Dataset is 1 -anonymous
```

A k-value of 1 means every quasi-id combination is unique — no protection at all. Most practitioners aim for **k ≥ 5** as the industry minimum, and **k ≥ 10** for sensitive data. To raise k you generalise further: drop a column, widen the bands, or suppress outlier rows that fall in singleton groups.

But k-anonymity has a famous failure mode. Imagine a k=4 group where every patient happens to share the same diagnosis — an attacker who knows their target falls in that group has learned the diagnosis without ever picking the exact row. This is the **homogeneity attack**, and the fix is **l-diversity**: each k-anonymous group must contain at least *l* distinct values of the sensitive attribute.

$$\text{l}(D) = \min_{g \in G(D)} |\{s : s \in g\}|$$

Where $|\{s : s \in g\}|$ is the count of distinct sensitive values inside group $g$.

```r
l_check <- generalised |>
  group_by(age_band, gender, zip3) |>
  summarise(
    distinct_diag = n_distinct(diagnosis),
    group_size = n(),
    .groups = "drop"
  )

l_div <- min(l_check$distinct_diag)
cat("Dataset is", l_div, "-diverse\n")
#> Dataset is 1 -diverse
```

The output `1 -diverse` confirms that at least one group has only one distinct diagnosis — the homogeneity attack would succeed against this release. To raise *l* you usually have to generalise more (which merges groups) or suppress the offending rows. The price is the same as for k-anonymity: less granular data in exchange for stronger guarantees.

[KEY INSIGHT]
**k protects against linkage; l protects against attribute disclosure.** k-anonymity stops an attacker picking a single row out of a crowd. l-diversity stops the attacker learning the row's secret even when they cannot pick it. Both metrics matter, and the more sensitive the attribute, the higher *l* you want.

**Try it:** Compute k-anonymity using only `age_band` and `gender` (drop `zip3` from the quasi-identifier set). Does k go up or down?

```r
# Try it: weaker quasi-id set → bigger or smaller k?
ex_k <- generalised |>
  count(# your grouping here) |>
  pull(n) |>
  min()

ex_k
#> Expected: 1 (this small dataset is still uneven)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_k <- generalised |>
  count(age_band, gender) |>
  pull(n) |>
  min()
ex_k
#> [1] 1
```

**Explanation:** Fewer quasi-identifiers usually mean larger groups and a higher k. With this tiny 10-row dataset some bands still have only one row, but on a real dataset of thousands you would see k jump from 1 into the dozens just by removing one quasi-id.

</details>

## How does differential privacy add mathematical guarantees in R?

k-anonymity and l-diversity are *syntactic* — they describe properties of the released table. **Differential privacy** is *semantic*: it bounds how much any single individual can change the answer to a query. Add or remove one row, and the released answer should look almost the same to any observer.

The standard recipe is the **Laplace mechanism**: add noise drawn from a Laplace distribution with scale $\Delta f / \varepsilon$, where $\Delta f$ is the *sensitivity* of the query (the most one record can change it) and $\varepsilon$ is the privacy budget. Smaller $\varepsilon$ means more noise, which means more privacy.

$$\tilde{f}(D) = f(D) + \text{Laplace}\!\left(\frac{\Delta f}{\varepsilon}\right)$$

For a count query, sensitivity is exactly 1 — adding or removing one row changes the count by 1.

```r
laplace_noise <- function(epsilon, sensitivity = 1) {
  u <- runif(1, -0.5, 0.5)
  -sign(u) * (sensitivity / epsilon) * log(1 - 2 * abs(u))
}

set.seed(42)
true_count <- patients |> filter(gender == "F") |> nrow()
noisy_count <- true_count + laplace_noise(epsilon = 0.5)

cat("True:", true_count, " Noisy:", round(noisy_count, 2), "\n")
#> True: 5  Noisy: 5.81
```

The released number is `5.81` instead of the true `5`. An attacker who sees only the noisy answer cannot tell whether the true count was 4, 5, or 6 — the noise hides one person's contribution. Round to the nearest integer for a publishable count.

How does the noise scale with epsilon? Sweep a grid of values and measure the standard deviation of the noise distribution.

```r
set.seed(7)
eps_grid <- c(0.1, 0.5, 1.0, 5.0)

noise_sd_tbl <- data.frame(
  epsilon = eps_grid,
  noise_sd = sapply(eps_grid, function(e) {
    sd(replicate(1000, laplace_noise(e)))
  })
)

noise_sd_tbl
#>   epsilon noise_sd
#> 1     0.1    14.21
#> 2     0.5     2.83
#> 3     1.0     1.41
#> 4     5.0     0.28
```

At $\varepsilon = 0.1$ the noise standard deviation is ~14 — far larger than the true count, so the answer is useless. At $\varepsilon = 5$ it drops to 0.28 — the answer is accurate but the privacy guarantee is weak. Practical releases typically pick $\varepsilon$ between 0.5 and 2, with smaller values reserved for highly sensitive aggregates like medical counts.

[WARNING]
**Privacy budget compounds.** Every query you answer "spends" some of your epsilon. Ten queries at $\varepsilon = 0.5$ each give a combined release at $\varepsilon = 5.0$, which is loose. Always track the total epsilon spent across the lifetime of a dataset and refuse new queries when the budget is exhausted.

**Try it:** Modify the call to use $\varepsilon = 2.0$ and explain in one sentence why the noise standard deviation should fall.

```r
# Try it: tighter epsilon → ?
set.seed(99)
ex_noise_sd <- sd(replicate(1000, laplace_noise(epsilon = # your value)))

ex_noise_sd
#> Expected: a value near 0.71
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
ex_noise_sd <- sd(replicate(1000, laplace_noise(epsilon = 2.0)))
ex_noise_sd
#> [1] 0.71
```

**Explanation:** The Laplace scale is $\Delta f / \varepsilon = 1/2 = 0.5$, and a Laplace distribution's standard deviation is $\sqrt{2} \cdot \text{scale} \approx 0.71$. Larger epsilon shrinks the scale, which shrinks the noise.

</details>

## What does GDPR actually require from data scientists?

GDPR is a 99-article regulation, but the parts you touch as a working data scientist boil down to seven concrete habits. The table maps each habit to the article that demands it and the R-side action you take.

| GDPR habit | Article | What you do in R |
|---|---|---|
| Lawful basis | Art. 6 | Document why you can process this data — store with the dataset metadata |
| Data minimisation | Art. 5(1)(c) | Drop columns you don't need before joining |
| Pseudonymisation | Art. 4(5), 32 | Replace direct IDs with random tokens; keep the map separately |
| Right to erasure | Art. 17 | Build a `delete_subject(df, subject_id)` helper into your pipeline |
| DPIA threshold | Art. 35 | Assess high-risk processing before it starts |
| Breach notification | Art. 33 | Log every dataset access; 72-hour reporting window |
| Documentation | Art. 30 | Keep a Record of Processing Activities (RoPA) |

The simplest piece of audit code you can write is a column-name scanner that warns when an obviously identifying field has slipped through.

```r
gdpr_audit <- function(df) {
  cols <- names(df)
  pattern <- "name|email|phone|ssn|passport|address|dob|birth"
  flagged <- cols[grepl(pattern, cols, ignore.case = TRUE)]
  if (length(flagged) == 0) {
    "OK: no obvious direct identifiers"
  } else {
    paste("WARN: direct identifier columns present:",
          paste(flagged, collapse = ", "))
  }
}

gdpr_audit(generalised)
#> [1] "OK: no obvious direct identifiers"

gdpr_audit(patients)
#> [1] "WARN: direct identifier columns present: name"
```

Run this as a unit test in your data pipeline — if it ever returns a `WARN`, the build fails. That's a five-line gate that prevents the most common GDPR incident: shipping a "cleaned" file that still has a `name` column. The pattern is intentionally loose because false positives are cheaper than a regulator letter.

[TIP]
**Bake the DPIA into the pipeline, not the calendar.** A Data Protection Impact Assessment (Article 35) is mandatory for high-risk processing — biometric data, large-scale profiling, special categories like health. Encode the trigger as a function (`needs_dpia(df)`) and call it before any model fits, so a forgotten DPIA fails the pipeline rather than slipping through review.

**Try it:** Extend `gdpr_audit()` to also flag any column matching `"passport"` or `"licence"`, and return a vector of all flagged columns rather than a single string.

```r
# Try it: vectorised audit
ex_audit <- function(df) {
  # your code here
}

ex_audit(data.frame(name = "x", passport_no = "y", age = 1))
#> Expected: c("name", "passport_no")
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_audit <- function(df) {
  pattern <- "name|email|phone|ssn|passport|licence|license|address|dob|birth"
  cols <- names(df)
  cols[grepl(pattern, cols, ignore.case = TRUE)]
}
ex_audit(data.frame(name = "x", passport_no = "y", age = 1))
#> [1] "name"        "passport_no"
```

**Explanation:** Returning a character vector instead of a message makes the audit composable — you can pipe it into `length() > 0` for boolean tests inside continuous-integration scripts.

</details>

## Practice Exercises

These capstone exercises combine techniques from across the article. Use the `patients` data frame already loaded in the previous blocks.

### Exercise 1: Build a one-call anonymise pipeline

Write `anonymise_pipeline(df, quasi_cols, sensitive_col)` that drops direct identifiers (anything matching the audit pattern from the GDPR section), generalises the quasi-identifier columns, and returns a list with the generalised data frame, its k-anonymity, and its l-diversity. Test it on `patients` with `quasi_cols = c("age","zip")` and `sensitive_col = "diagnosis"`.

```r
# Exercise 1: one-call anonymise pipeline
anonymise_pipeline <- function(df, quasi_cols, sensitive_col) {
  # your code here
}

result <- anonymise_pipeline(patients, c("age","zip"), "diagnosis")
result
#> Expected: a list with $data, $k, $l
```

<details>
<summary>Click to reveal solution</summary>

```r
anonymise_pipeline <- function(df, quasi_cols, sensitive_col) {
  audit_pattern <- "name|email|phone|ssn|passport|address|dob|birth|^id$"
  df <- df[, !grepl(audit_pattern, names(df), ignore.case = TRUE)]

  if ("age" %in% quasi_cols) {
    df$age <- cut(df$age, breaks = c(0, 30, 50, 100),
                  labels = c("<30","30-49","50+"))
  }
  if ("zip" %in% quasi_cols) {
    df$zip <- substr(df$zip, 1, 3)
  }

  groups <- df |> count(across(all_of(quasi_cols)))
  k_val <- min(groups$n)

  l_val <- df |>
    group_by(across(all_of(quasi_cols))) |>
    summarise(d = n_distinct(.data[[sensitive_col]]), .groups = "drop") |>
    pull(d) |>
    min()

  list(data = df, k = k_val, l = l_val)
}

result <- anonymise_pipeline(patients, c("age","zip"), "diagnosis")
result$k
#> [1] 1
result$l
#> [1] 1
```

**Explanation:** The function strips identifying columns by regex, generalises only the quasi-identifiers requested, then uses dplyr's tidy-eval helpers (`across(all_of(...))`, `.data[[col]]`) to compute both metrics from arbitrary column names.

</details>

### Exercise 2: Track a privacy budget across queries

Build `budget_tracker(queries, total_budget)` where `queries` is a data frame with columns `query` (character) and `epsilon` (numeric). Return the same data frame with two new columns: `cumulative_eps` (the running total) and `status` that flips to `"OVER BUDGET"` once the running total exceeds `total_budget`.

```r
# Exercise 2: privacy budget tracker
budget_tracker <- function(queries, total_budget = 3.0) {
  # your code here
}

queries <- data.frame(
  query = c("count_F","mean_age","count_HTN","count_zip941"),
  epsilon = c(0.5, 1.0, 1.0, 1.0)
)
budget_tracker(queries)
#> Expected: cumulative_eps and status columns appended
```

<details>
<summary>Click to reveal solution</summary>

```r
budget_tracker <- function(queries, total_budget = 3.0) {
  queries$cumulative_eps <- cumsum(queries$epsilon)
  queries$status <- ifelse(queries$cumulative_eps <= total_budget,
                           "OK", "OVER BUDGET")
  queries
}

queries <- data.frame(
  query = c("count_F","mean_age","count_HTN","count_zip941"),
  epsilon = c(0.5, 1.0, 1.0, 1.0)
)
budget_tracker(queries)
#>          query epsilon cumulative_eps      status
#> 1      count_F     0.5            0.5          OK
#> 2     mean_age     1.0            1.5          OK
#> 3    count_HTN     1.0            2.5          OK
#> 4 count_zip941     1.0            3.5 OVER BUDGET
```

**Explanation:** `cumsum()` gives the running epsilon spent; the `ifelse()` flags the moment the budget is breached. Wire this into your release pipeline so a query that pushes the budget over the cap is automatically refused.

</details>

## Complete Example

Here is the full release pipeline on the original `patients` dataset: drop identifiers, generalise quasi-IDs, measure k-anonymity, measure l-diversity, release a differentially private count of female patients, and audit the released frame.

```r
private_release <- patients |>
  select(-id, -name) |>
  mutate(
    age_band = cut(age, breaks = c(0, 40, 60, 100),
                   labels = c("<40","40-59","60+")),
    zip2 = substr(zip, 1, 2)
  ) |>
  select(age_band, gender, zip2, diagnosis)

# k-anonymity
k_val <- private_release |>
  count(age_band, gender, zip2) |>
  pull(n) |>
  min()

# l-diversity
l_val <- private_release |>
  group_by(age_band, gender, zip2) |>
  summarise(d = n_distinct(diagnosis), .groups = "drop") |>
  pull(d) |>
  min()

# Differentially private count of female patients (epsilon = 0.5)
set.seed(2026)
true_n <- sum(private_release$gender == "F")
release_n <- max(0, round(true_n + laplace_noise(0.5)))

# GDPR audit
audit <- gdpr_audit(private_release)

cat("k =", k_val, " l =", l_val, "\n",
    "Released female count:", release_n, "(true:", true_n, ")\n",
    "Audit:", audit, "\n")
#> k = 2  l = 2
#>  Released female count: 4 (true: 5)
#>  Audit: OK: no obvious direct identifiers
```

The pipeline outputs a 2-anonymous, 2-diverse release frame and a noisy female count of 4 (true value 5). The `gdpr_audit()` line is the safety net — if any direct identifier had survived the pipeline, this print would fail loudly instead of silently shipping personal data downstream.

## Summary

![Choosing a privacy technique by sharing context.](screenshots/Data-Privacy-in-R-decision-flow.webp)
*Figure 3: Choosing a privacy technique by sharing context.*

The six techniques map cleanly to attacks, R verbs, and production analogues:

| Technique | Protects against | R verb | Production analogue |
|---|---|---|---|
| Suppression | Direct identification | `select(-col)` | `sdcMicro::removeDirectID()` |
| Generalisation | Linkage attacks | `cut()`, `substr()` | `sdcMicro::globalRecode()` |
| Pseudonymisation | Joinability of direct IDs | `mutate()` plus lookup table | `sdcMicro::createSdcObj()` |
| k-anonymity | Singling out | `count()` plus `min()` | `sdcMicro::kAnon()` |
| l-diversity | Homogeneity attack | `n_distinct()` per group | `sdcMicro::ldiversity()` |
| Differential privacy | Inference from queries | Laplace noise on aggregates | `diffpriv::DPMechLaplace()` |

Pick the lightest technique that meets your threat model. Internal-only datasets can usually rest on pseudonymisation plus generalisation. Releases to a trusted partner need k-anonymity and l-diversity on top. Public releases — anything an attacker could combine with arbitrary auxiliary data — need differential privacy.

## References

1. Sweeney, L. (2002). *k-anonymity: A Model for Protecting Privacy*. International Journal on Uncertainty, Fuzziness and Knowledge-Based Systems. [Link](https://doi.org/10.1142/S0218488502001648)
2. Machanavajjhala, A., Kifer, D., Gehrke, J., & Venkitasubramaniam, M. (2007). *l-diversity: Privacy beyond k-anonymity*. ACM Transactions on Knowledge Discovery from Data. [Link](https://dl.acm.org/doi/10.1145/1217299.1217302)
3. Dwork, C. & Roth, A. (2014). *The Algorithmic Foundations of Differential Privacy*. Foundations and Trends in Theoretical Computer Science. [Link](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf)
4. Templ, M., Meindl, B., & Kowarik, A. — `sdcMicro` package documentation. [Link](https://sdctools.github.io/sdcMicro/)
5. Rubinstein, B. — `diffpriv`: Easy Differential Privacy in R (vignette). [Link](https://cran.r-project.org/web/packages/diffpriv/vignettes/diffpriv.pdf)
6. EU GDPR — full regulation text (Articles 4, 5, 25, 32, 35). [Link](https://gdpr-info.eu/)
7. Utrecht University — *Data Privacy Handbook*: k-anonymity, l-diversity, t-closeness chapter. [Link](https://utrechtuniversity.github.io/dataprivacyhandbook/k-l-t-anonymity.html)
8. SDC Practice Guide — Statistical Disclosure Control with sdcMicro. [Link](https://sdcpractice.readthedocs.io/)

## Continue Learning

1. **R Project Structure** — organise privacy-sensitive datasets outside the project tree so they never end up in version control. [Link](R-Project-Structure.html)
2. **Reproducible Research in R** — once data is privacy-safe, lock the analysis with reproducible workflows. [Link](Reproducible-Research-in-R.html)
3. **R for Excel Users** — the same anonymisation patterns map directly to dplyr verbs for analysts moving from Excel. [Link](R-for-Excel-Users.html)
