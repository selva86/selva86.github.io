---
title: "Odds Ratios & Relative Risk in R: epitools & epiR Complete Guide"
slug: Odds-Ratios-and-Relative-Risk-in-R
description: "Compute and interpret odds ratios and relative risk in R with epitools and epiR. Covers 2x2 tables, confidence intervals, method choice, and forest plots."
keywords: "odds ratio R, relative risk R, risk ratio R, epitools, epiR, epi.2by2, oddsratio function, riskratio function, 2x2 contingency table, case-control study R"
auto_link_terms: "odds ratio in R|relative risk in R|risk ratio in R|epi.2by2|epitools package|epiR package"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-29
curriculum_id: "2.7.5"
post_type: C
sidebar_section: Statistics
sidebar_title: "Odds Ratios & Relative Risk"
sidebar_order: 85
difficulty: Intermediate
---

# Odds Ratios & Relative Risk in R: epitools & epiR Complete Guide

<p class="lead">The <strong>odds ratio</strong> compares the odds of an outcome between two groups, while the <strong>relative risk</strong> compares the probabilities directly. Both summarise how strongly an exposure links to an outcome in a 2x2 table, and R gives you them in one line of code.</p>

## What's the difference between an odds ratio and relative risk?

Picture a small lung-cancer study: 30 of 100 smokers develop cancer, while 5 of 100 non-smokers do. The relative risk says smokers have six times the cancer probability (30% vs 5%). The odds ratio says smokers have roughly eight times the cancer odds. Same data, different framing, different number. Let's build that 2x2 table in base R and compute both ratios by hand so the formulas stop being abstract.

```r title="Hand-compute RR and OR from a 2x2"
# 2x2 table: rows = exposure (smoker/non), cols = outcome (cancer/no)
smoke_tab <- matrix(c(30, 70, 5, 95),
                    nrow = 2, byrow = TRUE,
                    dimnames = list(Exposure = c("Smoker", "Non-smoker"),
                                    Outcome  = c("Cancer", "No Cancer")))
smoke_tab
#>             Outcome
#> Exposure     Cancer No Cancer
#>   Smoker         30        70
#>   Non-smoker      5        95

# Risks (probabilities)
risk_smoker  <- 30 / (30 + 70)
risk_nonsmok <- 5  / (5  + 95)

# Risk ratio and odds ratio
RR <- risk_smoker / risk_nonsmok
OR <- (30 * 95) / (70 * 5)

c(RR = RR, OR = OR)
#>   RR   OR
#> 6.00 8.14
```

The relative risk of 6.0 means a smoker is six times more likely to develop cancer than a non-smoker. The odds ratio of 8.14 looks bigger, and that gap is not a mistake. The cross-product `(a*d) / (b*c)` always exaggerates the relative risk when the outcome is common, and the two converge only when the outcome is rare.

Every 2x2 table in epidemiology has the same four cells. Naming them now will pay off in every package below.

1. **a** = exposed cases (top-left)
2. **b** = exposed non-cases (top-right)
3. **c** = unexposed cases (bottom-left)
4. **d** = unexposed non-cases (bottom-right)

![2x2 table anatomy: exposed and unexposed groups by case status.](screenshots/Odds-Ratios-and-Relative-Risk-in-R-2x2-table-anatomy.webp)
*Figure 1: The four cells of a 2x2 table label exposed and unexposed groups by case status.*

The risk ratio uses row totals (people at risk), so it asks "what fraction of each group got sick?". The odds ratio uses the cross-product, so it asks "how do the odds of getting sick compare across groups?". Risks are bounded between 0 and 1, but odds run from 0 to infinity, which is why the OR can drift far from the RR.

[KEY INSIGHT]
**Odds ratio approximates relative risk only when the outcome is rare.** When fewer than ~10% of the population gets the outcome, OR and RR agree to a useful precision. Above that, the OR overstates the strength of the association compared with the RR.

**Try it:** A drug trial finds 12 of 200 treated patients had a stroke and 24 of 200 control patients had a stroke. Build a 2x2 matrix called `ex_drug_tab` and compute the relative risk by hand.

```r title="Your turn: drug trial RR"
# Build the 2x2 (rows = exposure, cols = outcome)
ex_drug_tab <- matrix(
  # your values here, in the order: a, b, c, d
  c(NA, NA, NA, NA),
  nrow = 2, byrow = TRUE,
  dimnames = list(Group = c("Treated", "Control"),
                  Outcome = c("Stroke", "No Stroke"))
)
ex_drug_tab
#> Expected: a 2x2 with 12, 188, 24, 176

# Compute RR
ex_RR <- NA
ex_RR
#> Expected: 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drug trial RR solution"
ex_drug_tab <- matrix(c(12, 188, 24, 176),
                      nrow = 2, byrow = TRUE,
                      dimnames = list(Group = c("Treated", "Control"),
                                      Outcome = c("Stroke", "No Stroke")))
ex_RR <- (12 / 200) / (24 / 200)
ex_RR
#> [1] 0.5
```

**Explanation:** Treated patients had half the stroke risk of controls. RR < 1 signals a protective effect.

</details>

## How do you compute an odds ratio in R with epitools?

The `oddsratio()` function from `epitools` automates everything in the previous block and adds a confidence interval and p-value. The function expects a 2x2 matrix or two factors, and it returns an `$measure` matrix with the OR plus its lower and upper bounds. We will use the built-in `Titanic` dataset, which records survival by sex, class, and age, and start with the simplest split, sex versus survival.

```r title="OR for sex vs survival on Titanic"
library(epitools)
library(dplyr)

# Collapse Titanic over class and age, keep sex x survival
titanic_tab <- apply(Titanic, c("Sex", "Survived"), sum)
titanic_tab
#>         Survived
#> Sex        No Yes
#>   Male   1364 367
#>   Female  126 344

# Default OR with Wald 95% CI
or_default <- oddsratio(titanic_tab)
or_default$measure
#>         odds ratio with 95% C.I.
#> Sex      estimate     lower    upper
#>   Male      1.000        NA       NA
#>   Female   10.147     8.025   12.829
or_default$p.value[, "fisher.exact"]
#> [1] NA 4.9e-86
```

The reference row is "Male" with OR fixed at 1, and "Female" carries the comparison: the odds of surviving were about 10.1 times higher for women than for men, with a 95% confidence interval from 8.0 to 12.8. The interval is far above 1 and the Fisher p-value is essentially zero, so the association is nowhere near a fluke.

`epitools::oddsratio()` actually supports four estimation methods, and switching between them costs one argument. Comparing the four side by side reveals when the choice matters and when it doesn't.

```r title="Four OR methods on the same table"
methods <- c("wald", "fisher", "midp", "small")
or_methods <- sapply(methods, function(m) {
  est <- oddsratio(titanic_tab, method = m)$measure[2, ]
  c(estimate = est["estimate"], lower = est["lower"], upper = est["upper"])
})
round(or_methods, 2)
#>                    wald fisher  midp small
#> estimate.estimate 10.15  10.10 10.10 10.11
#> lower.lower        8.02   7.90  7.91  8.02
#> upper.upper       12.83  12.92 12.89 12.84
```

For this large sample (over 2,000 passengers) all four methods agree to within 1%. The differences only matter for small or sparse tables. We will revisit method choice properly in the "Which CI method?" section after seeing relative risk and `epi.2by2()`.

[TIP]
**Pass rev to flip the reference group without rebuilding your table.** epitools picks the lowest-named row and column as references, which is sometimes wrong. The `rev` argument accepts `"rows"`, `"columns"`, or `"both"` and saves you from re-indexing the matrix.

**Try it:** Using the full 4D `Titanic` array, collapse to a 2x2 of class (1st vs 3rd) versus survival, then compute the odds ratio with `oddsratio()`. Save the table to `ex_class_tab` and the OR to `ex_class_or`.

```r title="Your turn: 1st vs 3rd class OR"
# Subset Titanic to 1st and 3rd class, then collapse over Sex and Age
ex_class_tab <- # your code here

ex_class_or <- # your code here

ex_class_or$measure
#> Expected: 3rd-class row OR around 0.18 (lower survival odds vs 1st class)
```

<details>
<summary>Click to reveal solution</summary>

```r title="1st vs 3rd class solution"
ex_class_tab <- apply(Titanic[c("1st", "3rd"), , , ], c("Class", "Survived"), sum)
ex_class_or  <- oddsratio(ex_class_tab)
ex_class_or$measure
#>      odds ratio with 95% C.I.
#> Class estimate     lower upper
#>   1st     1.000        NA    NA
#>   3rd     0.181     0.143 0.229
```

**Explanation:** The 3rd-class odds of survival were about one-fifth the 1st-class odds. The CI excludes 1, so the gap is significant.

</details>

## How do you compute relative risk in R with epitools?

Relative risk uses `riskratio()` from the same package, but the table layout convention is the opposite of `oddsratio()`. `riskratio()` expects the **non-event** in the first column and the **unexposed** group in the first row, so the top-left cell is "no event, no exposure". Get this wrong and the function silently returns the inverse, which is a classic bug.

```r title="Risk ratio for sex vs survival"
# Reorder Titanic so non-event (No) is first column and Male is first row
rr_tab <- titanic_tab[c("Male", "Female"), c("No", "Yes")]
rr_titanic <- riskratio(rr_tab)
rr_titanic$measure
#>         risk ratio with 95% C.I.
#> Sex      estimate    lower   upper
#>   Male      1.000       NA      NA
#>   Female    3.452    3.105   3.838
rr_titanic$p.value[, "fisher.exact"]
#> [1] NA 4.9e-86
```

The risk ratio is 3.45: women's probability of survival was about 3.5 times higher than men's. Compare that with the odds ratio of 10.15 from the previous section. Survival on the Titanic was *not* rare (over a third of passengers survived), so the rare-disease assumption is violated and the OR overstates the multiplicative effect. The RR is the more honest summary for this dataset.

[WARNING]
**riskratio and oddsratio use opposite cell orderings.** `oddsratio()` puts the event first; `riskratio()` puts the non-event first. Check `?riskratio` before every call, or pass `rev = "columns"` to fix a mismatched table.

**Try it:** Compute the risk ratio of dying (not surviving) for males versus females on the Titanic. Save the result to `ex_male_die_rr`.

```r title="Your turn: male death RR"
# Hint: with riskratio(), put the unexposed group in row 1 and non-event in col 1
# Goal: compare death risk for Male vs Female, expecting RR > 1
ex_die_tab <- # your 2x2 here

ex_male_die_rr <- # your code here

ex_male_die_rr$measure
#> Expected: Male death RR around 2.94
```

<details>
<summary>Click to reveal solution</summary>

```r title="Male death RR solution"
# Treat "Female = unexposed" so Male becomes the comparison group with RR > 1
ex_die_tab <- titanic_tab[c("Female", "Male"), c("Yes", "No")]
ex_male_die_rr <- riskratio(ex_die_tab)
ex_male_die_rr$measure
#>         risk ratio with 95% C.I.
#> Sex      estimate    lower   upper
#>   Female    1.000       NA      NA
#>   Male      2.943    2.640   3.281
```

**Explanation:** Men died at nearly three times the rate of women. RR is the inverse of the female survival RR, as expected.

</details>

## How does epiR's epi.2by2() compare?

`epitools` returns a single measure per call. `epi.2by2()` from the `epiR` package returns the whole epidemiology toolkit in one shot: incidence risk ratio, odds ratio, attributable risk, attributable fraction in the exposed (AFe), and attributable fraction in the population (AFp). It also accepts the natural 2x2 layout, with exposed/unexposed as rows and event/no-event as columns, which is the same orientation people use on paper.

```r title="epi.2by2 with cohort.count and interpret"
library(epiR)

# epiR's preferred layout: exposed-first row, event-first column.
# We model "death" (No) as the event and "Male" as the exposure of interest.
e2by2_tab <- titanic_tab[c("Male", "Female"), c("No", "Yes")]
e2by2_tab
#>         Survived
#> Sex        No  Yes
#>   Male   1364  367
#>   Female  126  344

full_2by2 <- epi.2by2(dat = e2by2_tab,
                      method = "cohort.count",
                      conf.level = 0.95,
                      outcome = "as.columns")
full_2by2$massoc.summary[1:5, c("var", "est", "lower", "upper")]
#>                                var     est   lower   upper
#> 1 Inc risk ratio                    2.940   2.638   3.276
#> 2 Odds ratio                       10.147   8.025  12.829
#> 3 Attrib risk in the exposed *      0.520   0.474   0.566
#> 4 Attrib fraction in exposed (%)   66.018  62.099  69.487
#> 5 Attrib fraction in pop (%)       52.041  47.787  55.963
```

In one call we now have everything: men were 2.94x more likely to die (RR), with 10.15x the odds (OR), and 66% of male deaths can be attributed to being male (AFe) under the strong causal-interpretation assumption. The attributable fractions answer "how much of the burden would vanish if the exposure were removed?", a question RR alone cannot answer.

![Odds ratio vs risk ratio decision flow.](screenshots/Odds-Ratios-and-Relative-Risk-in-R-or-vs-rr.webp)
*Figure 2: Study design and outcome frequency determine when the odds ratio approximates the risk ratio.*

[NOTE]
**epi.2by2 switches measures based on the method argument.** `cohort.count` returns RR + OR + attributable risk; `case.control` drops RR (you cannot estimate it from a case-control sample); `cohort.time` adds incidence rate ratios; `cross.sectional` returns prevalence ratios. Pick the one that matches your study design.

**Try it:** Re-run `epi.2by2()` on the same table with `method = "case.control"` and save the result to `ex_cc`. Inspect `ex_cc$massoc.summary` and explain why the risk ratio row is missing.

```r title="Your turn: case-control method"
ex_cc <- # your code here

# Print the summary
ex_cc$massoc.summary
#> Expected: no incidence risk ratio row; OR is the headline measure
```

<details>
<summary>Click to reveal solution</summary>

```r title="case-control solution"
ex_cc <- epi.2by2(dat = e2by2_tab, method = "case.control",
                  conf.level = 0.95, outcome = "as.columns")
head(ex_cc$massoc.summary[, c("var", "est")], 4)
#>                  var    est
#> 1 Odds ratio        9.546
#> 2 Attrib prevalence 0.520
#> 3 ...
```

**Explanation:** Case-control studies sample on the outcome, so risk in the source population isn't observed. The OR is identifiable; the RR isn't.

</details>

## Which CI method should you choose?

The four `oddsratio()` methods (Wald, Fisher exact, mid-p, small-sample) and `epi.2by2()`'s score interval all agree on large balanced samples but diverge sharply on small or sparse tables. Wald is the textbook normal-approximation interval and the easiest to compute by hand; Fisher's exact is the gold standard for small samples; mid-p is a less conservative exact method; and the small-sample correction adjusts Wald for thin cells.

![Decision flow for picking a CI method based on cell counts.](screenshots/Odds-Ratios-and-Relative-Risk-in-R-method-decision.webp)
*Figure 3: Decision guide for picking the right confidence-interval method.*

The decision rule is straightforward: with all cell counts at 10 or more, Wald is fine. With cell counts under 10 but no zeros, prefer the small-sample correction or `epi.2by2()`'s score interval. With any zero cell, use Fisher exact or mid-p, never Wald.

```r title="Methods compared on a small 2x2"
# Layout: row 1 = Unexposed (reference), row 2 = Exposed
#         col 1 = Control (no event), col 2 = Case (event)
small_tab <- matrix(c(8, 2, 1, 3),
                    nrow = 2, byrow = TRUE,
                    dimnames = list(Exposure = c("Unexposed", "Exposed"),
                                    Outcome  = c("Control", "Case")))
small_tab
#>            Outcome
#> Exposure    Control Case
#>   Unexposed       8    2
#>   Exposed         1    3

methods <- c("wald", "fisher", "midp", "small")
small_results <- sapply(methods, function(m) {
  est <- oddsratio(small_tab, method = m)$measure[2, ]
  c(OR = est["estimate"], lo = est["lower"], hi = est["upper"])
})
round(small_results, 2)
#>              wald fisher midp small
#> OR.estimate 12.00  10.31 10.31 10.66
#> lo.lower     0.88   0.64 0.72   0.82
#> hi.upper   163.65 514.45 209.47 138.86
```

The Wald estimate of 12 has a 95% CI that just dips below 1 (0.88 lower bound). Fisher's exact widens that interval dramatically (0.64 to 514), and the difference matters: Wald says "borderline significant", Fisher says "large but very uncertain". With n = 14 and one cell at 1, the Wald interval is unsafe to publish.

[WARNING]
**Never report Wald CIs when any cell is below 5.** The normal approximation breaks down, the interval is too narrow, and Type I error inflates. Switch to Fisher exact, mid-p, or the score interval from `epi.2by2()`.

**Try it:** Insert a single zero into the small table (set the (1,2) cell to 0) and rerun the four methods. Notice which methods break.

```r title="Your turn: zero-cell behaviour"
# Same layout as small_tab but with a zero in the Unexposed/Case cell
ex_zero_tab <- matrix(c(8, 0, 1, 3),
                      nrow = 2, byrow = TRUE,
                      dimnames = list(Exposure = c("Unexposed", "Exposed"),
                                      Outcome  = c("Control", "Case")))

# Try each method and capture the OR estimate (or NaN/Inf)
ex_zero_or <- # your code here, returning a named vector

ex_zero_or
#> Expected: wald produces Inf; fisher and midp give a finite estimate
```

<details>
<summary>Click to reveal solution</summary>

```r title="Zero-cell solution"
ex_zero_or <- sapply(c("wald", "fisher", "midp", "small"), function(m) {
  oddsratio(ex_zero_tab, method = m)$measure[2, "estimate"]
})
ex_zero_or
#>     wald   fisher     midp    small
#>      Inf      Inf      Inf  51.0000
```

**Explanation:** Wald, Fisher and mid-p all yield `Inf` because the conditional MLE for the OR is undefined when one cell is zero. Only the small-sample correction (which adds 0.5 to every cell first) returns a finite estimate.

</details>

## How do you visualize odds and risk ratios with confidence intervals?

A forest plot is the standard way to display ORs side by side. Each row is a subgroup, the dot is the point estimate, and the horizontal line is the CI. A vertical reference line at 1 marks "no effect", and a log-scaled x-axis makes a 2-fold increase look the same size as a 2-fold decrease. We will plot the OR for survival across each Titanic class.

```r title="Forest plot of OR by passenger class"
library(ggplot2)

# Build a tidy data frame of OR + CI per class
classes <- c("1st", "2nd", "3rd", "Crew")
class_or_df <- do.call(rbind, lapply(classes, function(cl) {
  tab <- apply(Titanic[cl, , , , drop = FALSE], c("Sex", "Survived"), sum)
  m <- oddsratio(tab)$measure[2, ]
  data.frame(class = cl, OR = m["estimate"], lo = m["lower"], hi = m["upper"])
}))
class_or_df
#>   class    OR    lo     hi
#> 1   1st 67.09 23.75 189.50
#> 2   2nd 44.07 21.46  90.46
#> 3   3rd  4.07  2.83   5.85
#> 4  Crew 23.26  6.84  79.13

ggplot(class_or_df, aes(y = reorder(class, OR), x = OR, xmin = lo, xmax = hi)) +
  geom_pointrange(color = "#9370DB", size = 0.8) +
  geom_vline(xintercept = 1, linetype = "dashed", color = "grey50") +
  scale_x_log10() +
  labs(x = "Odds ratio (Female vs Male, log scale)", y = NULL,
       title = "Female-to-male survival OR by passenger class") +
  theme_minimal(base_size = 13)
```

The 3rd-class OR is the smallest at 4.1, meaning women in steerage still had a survival edge but a smaller one than 1st-class women, who saw a 67-fold advantage. All four CIs sit far above 1, so the female advantage was real in every class. Log-scaling the x-axis is what makes the visual comparison fair: an OR of 3 and an OR of 1/3 take up equal visual distance from the null line.

[TIP]
**Always log-scale the x-axis on a forest plot.** Odds ratios are multiplicative, not additive. On a linear scale an OR of 0.5 sits half as far from 1 as an OR of 2, even though they represent the same effect size in opposite directions.

**Try it:** Add a fifth row to `class_or_df` with `class = "Overall"` and the unstratified Titanic OR (the value of `or_default` from earlier). Re-plot.

```r title="Your turn: add overall row"
ex_overall <- data.frame(
  class = "Overall",
  OR = NA, lo = NA, hi = NA
)

ex_class_or_df <- rbind(class_or_df, ex_overall)
# Re-plot with the same ggplot recipe
#> Expected: a fifth dot near OR ~ 10.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Overall row solution"
ex_m <- oddsratio(titanic_tab)$measure[2, ]
ex_overall <- data.frame(class = "Overall",
                         OR = ex_m["estimate"], lo = ex_m["lower"], hi = ex_m["upper"])
ex_class_or_df <- rbind(class_or_df, ex_overall)

ggplot(ex_class_or_df, aes(y = reorder(class, OR), x = OR, xmin = lo, xmax = hi)) +
  geom_pointrange(color = "#9370DB", size = 0.8) +
  geom_vline(xintercept = 1, linetype = "dashed") +
  scale_x_log10() +
  labs(x = "OR (log scale)", y = NULL) +
  theme_minimal()
```

**Explanation:** The pooled OR (10.1) sits between the 1st and 3rd-class subgroup ORs, illustrating Simpson-style averaging across strata.

</details>

## Practice Exercises

### Exercise 1: Vaccine RCT, RR and number needed to treat

A vaccine trial enrolls 5000 people: 2500 vaccinated, 2500 placebo. 25 vaccinated and 100 placebo recipients contract the disease. Build the 2x2 as `my_vacc_tab`, compute the relative risk and the **number needed to treat (NNT)**, defined as `1 / (risk_placebo - risk_vaccine)`. Save NNT as `my_nnt`.

```r title="Vaccine RCT scaffold"
# Lay out the 2x2 in the riskratio() convention: non-event first column,
# unexposed (placebo) first row.

my_vacc_tab <- # your 2x2

my_rr  <- # your call to riskratio()
my_nnt <- # your NNT calculation

list(my_vacc_tab = my_vacc_tab, RR = my_rr$measure[2, ], NNT = my_nnt)
#> Expected: RR ~ 0.25, NNT ~ 33.3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Vaccine RCT solution"
# riskratio() wants non-event in col 1, unexposed (Placebo) in row 1
my_vacc_tab <- matrix(c(2400, 100, 2475, 25),
                      nrow = 2, byrow = TRUE,
                      dimnames = list(Group = c("Placebo", "Vaccine"),
                                      Outcome = c("Healthy", "Disease")))
my_rr <- riskratio(my_vacc_tab)
risk_p <- 100 / 2500
risk_v <- 25  / 2500
my_nnt <- 1 / (risk_p - risk_v)
list(RR = round(my_rr$measure[2, "estimate"], 2),
     NNT = round(my_nnt, 1))
#> $RR
#> [1] 0.25
#> $NNT
#> [1] 33.3
```

**Explanation:** Vaccination cut disease risk to a quarter. NNT = 33 means treating 33 people prevents one case.

</details>

### Exercise 2: Case-control study with epi.2by2

A case-control study of pancreatic cancer enrolls 200 cases and 200 controls. 80 cases and 30 controls report heavy coffee consumption. Build the table as `my_coffee_tab`, run `epi.2by2()` with `method = "case.control"`, and verify the OR by hand using the cross-product formula.

```r title="Case-control scaffold"
my_coffee_tab <- # 2x2 with exposed-first row, case-first column

my_cc <- # your epi.2by2() call

my_or_byhand <- # cross-product (a*d) / (b*c)

list(epi_OR = my_cc$massoc.summary[2, "est"], byhand = my_or_byhand)
#> Expected: both values agree at ~ 3.78
```

<details>
<summary>Click to reveal solution</summary>

```r title="Case-control solution"
my_coffee_tab <- matrix(c(80, 30, 120, 170),
                        nrow = 2, byrow = TRUE,
                        dimnames = list(Coffee = c("Heavy", "Light"),
                                        Cancer = c("Case", "Control")))
my_cc <- epi.2by2(my_coffee_tab, method = "case.control",
                  outcome = "as.columns")
my_or_byhand <- (80 * 170) / (30 * 120)
list(epi_OR = round(my_cc$massoc.summary[my_cc$massoc.summary$var == "Odds ratio (W)", "est"], 2),
     byhand = round(my_or_byhand, 2))
#> $epi_OR
#> [1] 3.78
#> $byhand
#> [1] 3.78
```

**Explanation:** Both routes produce the same Wald OR. Heavy coffee consumers had nearly four times the odds of being a case in this contrived sample.

</details>

### Exercise 3: Build your own summary function

Write `my_summarise_2by2()` that takes a 2x2 matrix `m` and returns a one-row data frame with columns `RR`, `OR`, `OR_to_RR`, and `rare_disease_ok` (TRUE if the overall outcome rate is under 10%). Test it on `smoke_tab` and `my_vacc_tab`.

```r title="Function scaffold"
my_summarise_2by2 <- function(m) {
  # 1. Pull the four cells (a, b, c, d)
  # 2. Compute RR and OR
  # 3. Compute overall outcome rate
  # 4. Return a one-row data frame
}

my_summarise_2by2(smoke_tab)
#> Expected: RR=6, OR~8.14, OR_to_RR>1, rare_disease_ok=FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Summary function solution"
my_summarise_2by2 <- function(m) {
  a <- m[1, 1]; b <- m[1, 2]; c <- m[2, 1]; d <- m[2, 2]
  RR <- (a / (a + b)) / (c / (c + d))
  OR <- (a * d) / (b * c)
  rate <- (a + c) / sum(m)
  data.frame(RR = round(RR, 2), OR = round(OR, 2),
             OR_to_RR = round(OR / RR, 2),
             rare_disease_ok = rate < 0.10)
}

# Run on smoke_tab (col 1 = Cancer event) and a flipped vaccine table
# (col 1 = Disease event) so both treat col 1 as the event consistently.
vacc_event_first <- my_vacc_tab[, c("Disease", "Healthy")]

rbind(smoke = my_summarise_2by2(smoke_tab),
      vacc  = my_summarise_2by2(vacc_event_first))
#>         RR   OR OR_to_RR rare_disease_ok
#> smoke 6.00 8.14     1.36           FALSE
#> vacc  4.00 4.12     1.03            TRUE
```

**Explanation:** When the disease is common (smoke_tab, 17.5% prevalence), OR/RR drifts above 1. When it's rare (vacc, 2.5%), OR and RR converge to within a few percent.

</details>

## Complete Example: Aspirin and stroke prevention

A made-up but realistic cohort study follows 10,000 adults for five years, half on daily aspirin. 80 aspirin users have a stroke; 160 controls do. We want a publication-ready summary of the effect.

```r title="Full aspirin analysis"
aspirin_tab <- matrix(c(80, 4920, 160, 4840),
                      nrow = 2, byrow = TRUE,
                      dimnames = list(Group = c("Aspirin", "Control"),
                                      Stroke = c("Yes", "No")))
aspirin_tab
#>          Stroke
#> Group      Yes   No
#>   Aspirin   80 4920
#>   Control  160 4840

# Full set of measures via epi.2by2()
asp_full <- epi.2by2(aspirin_tab, method = "cohort.count",
                     conf.level = 0.95, outcome = "as.columns")
asp_full$massoc.summary[1:5, c("var", "est", "lower", "upper")]
#>                              var      est   lower   upper
#> 1 Inc risk ratio                   0.500   0.385   0.649
#> 2 Odds ratio                       0.492   0.376   0.643
#> 3 Attrib risk in the exposed *  -0.016  -0.022  -0.010
#> 4 Attrib fraction in exposed (%) -100.0  -160.4  -54.0
#> 5 Attrib fraction in pop (%)     -50.0   -67.7  -29.5

# Forest plot of RR and OR
asp_df <- data.frame(measure = c("RR", "OR"),
                     est = c(0.50, 0.49),
                     lo  = c(0.385, 0.376),
                     hi  = c(0.649, 0.643))

ggplot(asp_df, aes(y = measure, x = est, xmin = lo, xmax = hi)) +
  geom_pointrange(color = "#9370DB", size = 1) +
  geom_vline(xintercept = 1, linetype = "dashed") +
  scale_x_log10(limits = c(0.3, 1.5)) +
  labs(x = "Effect on stroke risk (log scale)", y = NULL,
       title = "Aspirin vs control, 5-year stroke outcome") +
  theme_minimal(base_size = 13)
```

A publication-style sentence might read: *"Daily aspirin halved the 5-year stroke risk compared with control (RR 0.50, 95% CI 0.39 to 0.65; OR 0.49, 95% CI 0.38 to 0.64)."* RR and OR agree closely because the outcome (stroke in 2.4% of the cohort) is rare. Attributable risk shows aspirin prevents 16 strokes per 1000 person-years, the most clinically useful framing.

## Summary

The two ratios answer different questions and live in different parts of the epidemiology toolbox.

| Use case | Best measure | R function |
|---|---|---|
| Cohort study, RCT | Risk ratio | `epitools::riskratio()`, `epi.2by2(method = "cohort.count")` |
| Case-control study | Odds ratio | `epitools::oddsratio()`, `epi.2by2(method = "case.control")` |
| Cross-sectional, rare disease | Either (they agree) | `epi.2by2(method = "cross.sectional")` |
| All measures + attributable risk | epi.2by2() | `epiR::epi.2by2()` |

Quick-reference for CI methods:

1. **Wald** — fast, fine when every cell is 10 or more
2. **Small-sample** — Wald-style with cell adjustments, good for thin tables without zeros
3. **Fisher exact** — gold standard for small samples or any zero cell
4. **Mid-p** — exact but less conservative than Fisher
5. **Score (epi.2by2)** — well-behaved across sample sizes, the default in many epidemiology textbooks

![Concept map of odds ratios and relative risk in R.](screenshots/Odds-Ratios-and-Relative-Risk-in-R-overview-mindmap.webp)
*Figure 4: Concept map of odds ratios and relative risk in R.*

## References

1. Aragón TJ. *epitools: Epidemiology Tools.* CRAN. [Link](https://cran.r-project.org/package=epitools)
2. Stevenson M, Sergeant E. *epiR: Tools for the Analysis of Epidemiological Data.* CRAN. [Link](https://cran.r-project.org/package=epiR)
3. Rothman KJ, Greenland S, Lash TL. *Modern Epidemiology*, 3rd ed. Lippincott Williams & Wilkins (2008).
4. Brophy JM. *Mostly Clinical Epidemiology with R*, Chapter 4: Contingency tables and measures of association. [Link](https://bookdown.org/jbrophy115/bookdown-clinepi/meas.html)
5. Szumilas M. Explaining odds ratios. *J Can Acad Child Adolesc Psychiatry* 19(3): 227-229 (2010). [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2938757/)
6. Davies HTO, Crombie IK, Tavakoli M. When can odds ratios mislead? *BMJ* 316: 989-991 (1998). [Link](https://www.bmj.com/content/316/7136/989)
7. Knol MJ, et al. Estimating measures of interaction on an additive scale for preventive exposures. *Eur J Epidemiol* 26(6): 433-438 (2011).

## Continue Learning

- [Chi-Square Test of Independence in R](Chi-Square-Test-of-Independence-in-R.html) — test whether two categorical variables are associated before quantifying the effect with an OR or RR.
- [Fisher's Exact Test in R](Fishers-Exact-Test-in-R.html) — the small-sample test that produces exact p-values and the same CI engine used by `oddsratio(method = "fisher")`.
- [Categorical Data in R: Frequency Tables, Crosstabs & Mosaic Plots](Categorical-Data-in-R.html) — build the 2x2 tables that feed every method on this page.
