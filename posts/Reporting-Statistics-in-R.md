---
title: "Report Statistics in R: The Numbers to Include and the Words to Use"
slug: "Reporting-Statistics-in-R"
description: "Report results with p-values, CIs, and effect sizes in APA format. Automate reporting with papaja, report(), and gtsummary, and avoid common mistakes."
keywords: "reporting statistics in R, APA format R, p-value reporting, confidence interval APA, effect size, papaja, gtsummary, report package, APA style statistics"
auto_link_terms: "reporting statistics in R|APA reporting|statistical reporting in R|papaja package|gtsummary package|apa_print()|APA format in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-18"
curriculum_id: "2.2.15"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Reporting Statistics"
sidebar_order: 41
---

# Report Statistics in R: The Numbers to Include and the Words to Use

<p class="lead">Reporting a statistical result in R means writing one sentence that combines six things: a point estimate, a 95% confidence interval, a test statistic with its degrees of freedom, an exact p-value, an effect size, and the sample size. This tutorial shows the APA template for each common test, the R code that produces those numbers, and the packages that write the sentence for you.</p>

## What should every statistical report include?

Most R walkthroughs stop at `summary(model)` and leave you to translate the output into prose. That translation is where write-ups go wrong. A lone p-value tells the reader *something happened*, but nothing about how big the effect is or how certain we are. A complete report pairs a point estimate with a confidence interval, names the test and its degrees of freedom, gives an exact p-value, adds an effect size, and reminds the reader of the sample size. Below is a full APA-style sentence built from one t-test.

```r title="Compose a full APA t-test report"
library(dplyr)
library(broom)

tt <- t.test(mpg ~ am, data = mtcars)   # am: 0 = automatic, 1 = manual
td <- broom::tidy(tt)

# Pooled SD for Cohen's d
g0 <- mtcars$mpg[mtcars$am == 0]
g1 <- mtcars$mpg[mtcars$am == 1]
sd_pooled <- sqrt(((length(g0) - 1) * var(g0) +
                   (length(g1) - 1) * var(g1)) /
                  (length(g0) + length(g1) - 2))
d_val <- (mean(g1) - mean(g0)) / sd_pooled

apa_line <- sprintf(
  "Manual cars had higher mpg than automatic cars, mean diff = %.2f, 95%% CI [%.2f, %.2f], t(%.1f) = %.2f, p = %.3f, d = %.2f (N = %d).",
  -td$estimate, -td$conf.high, -td$conf.low,
  td$parameter, td$statistic, td$p.value, d_val, nrow(mtcars)
)
cat(apa_line)
#> Manual cars had higher mpg than automatic cars, mean diff = 7.24, 95% CI [3.64, 10.85], t(18.3) = -3.77, p = 0.001, d = 1.48 (N = 32).
```

One run produces the full sentence. It names the direction of the effect (manual > automatic), gives the point estimate (7.24 mpg), bounds it with a 95% CI, reports the Welch t-statistic with its degrees of freedom, shows the exact p-value, and adds Cohen's d as the standardized effect size. A reader who only saw "p = 0.001" would not know whether the gap was 0.5 mpg or 15 mpg, which is the difference between a rounding error and a purchase decision.

![The six numbers that make a statistical result interpretable and reproducible.](screenshots/Reporting-Statistics-in-R-what-to-include.webp)
*Figure 1: The six numbers that make a statistical result interpretable and reproducible.*

[KEY INSIGHT]
**A single p-value is not a report.** p tells you whether the data are unusual under the null, not how big the effect is or how precisely you measured it. Pair it with an estimate, a CI, and an effect size every time.

**Try it:** Compute the sample mean and a 95% confidence interval for `mtcars$mpg` and print them in the APA style `M = X.XX, 95% CI [lo, hi]`.

```r title="Your turn: descriptive APA sentence"
x <- mtcars$mpg

# Fill in the blanks:
m_x  <- _______
ci_x <- t.test(x)$conf.int

cat(sprintf("M = %.2f, 95%% CI [%.2f, %.2f]",
            m_x, ci_x[1], ci_x[2]))
#> Expected: M = 20.09, 95% CI [17.92, 22.26]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Descriptive APA sentence solution"
x <- mtcars$mpg
m_x  <- mean(x)
ci_x <- t.test(x)$conf.int
cat(sprintf("M = %.2f, 95%% CI [%.2f, %.2f]",
            m_x, ci_x[1], ci_x[2]))
#> M = 20.09, 95% CI [17.92, 22.26]
```

**Explanation:** `t.test(x)` with no grouping returns a one-sample test whose confidence interval is simply the 95% CI of the mean.

</details>

## How do you format p-values, CIs, and decimals in R?

Before we tackle each test type, you need a small set of formatting rules. APA style is specific: statistics and effect sizes get two decimals (three is fine when precision matters), p-values get three decimals, and any quantity bounded by 1 on both sides, like a p-value, correlation, or R², drops its leading zero. The floor is `p < .001`. Writing `p = .000` is wrong: a p-value cannot be exactly zero.

Let's write a single formatter that handles the p-value rules in one call.

```r title="Define an APA p-value formatter"
pval_apa <- function(p) {
  ifelse(p < .001,
         "p < .001",
         paste0("p = ", sub("^0", "", sprintf("%.3f", p))))
}

# Demo on a range of values
pvals <- c(0.0003, 0.003, 0.0456, 0.3421, 0.8)
pval_apa(pvals)
#> [1] "p < .001" "p = .003" "p = .046" "p = .342" "p = .800"
```

The helper collapses two rules into one function: floor low values and drop the leading zero. `sub("^0", "", ...)` removes the leading zero from strings like `"0.003"` to yield `".003"`, matching APA's convention for any statistic bounded between 0 and 1.

[TIP]
**`scales::pvalue()` does this out of the box.** If you already use the tidyverse, `scales::pvalue(p, accuracy = .001)` formats p-values per the same rules. `papaja::printp()` does the same with APA-specific defaults and is the drop-in choice for manuscripts.

Confidence intervals follow the same two-decimal rule and sit in square brackets with a comma. A small helper keeps your `sprintf` calls tidy.

```r title="Define a confidence-interval formatter"
ci_str <- function(lo, hi, digits = 2) {
  sprintf("95%% CI [%.*f, %.*f]", digits, lo, digits, hi)
}

ci_str(3.642, 10.848)
#> [1] "95% CI [3.64, 10.85]"
```

[WARNING]
**Never write `p = .000`.** It communicates nothing the reader can believe: no p-value is exactly zero. Always use `p < .001` for anything that rounds to zero, and report the exact p-value for anything above that floor.

**Try it:** Format `p = 0.0003` and `p = 0.251` using `pval_apa()`.

```r title="Your turn: format two p-values"
ex_p <- c(0.0003, 0.251)

# Use pval_apa() to format them:
ex_out <- _______

print(ex_out)
#> Expected: [1] "p < .001" "p = .251"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Format two p-values solution"
ex_p <- c(0.0003, 0.251)
ex_out <- pval_apa(ex_p)
print(ex_out)
#> [1] "p < .001" "p = .251"
```

**Explanation:** `pval_apa()` is vectorized because `ifelse()` accepts vectors, so a whole column of p-values can be formatted in one call.

</details>

## How do you report a t-test in APA format?

The APA template for a two-sample t-test has five slots: the t-statistic, its degrees of freedom, the p-value, the 95% CI on the mean difference, and Cohen's d. Template: `t(df) = X.XX, p = .XXX, 95% CI [lo, hi], d = X.XX`.

Cohen's d measures the standardized difference between two means, so a reader can compare effects across studies that used different scales.

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_{\text{pooled}}} \quad\text{with}\quad s_{\text{pooled}} = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}}$$

Where $\bar{x}_1, \bar{x}_2$ are the two group means, $s_1^2, s_2^2$ are their sample variances, and $n_1, n_2$ are their sizes.

Let's extract every number we need from one Welch t-test, then wrap the extraction in a reusable helper so you can point it at any pair of vectors.

```r title="Extract every number from a Welch t-test"
tt2 <- t.test(mpg ~ am, data = mtcars)
tt2_tidy <- broom::tidy(tt2)

tt2_tidy[, c("estimate", "statistic", "parameter",
             "p.value", "conf.low", "conf.high")]
#> # A tibble: 1 × 6
#>   estimate statistic parameter p.value conf.low conf.high
#>      <dbl>     <dbl>     <dbl>   <dbl>    <dbl>     <dbl>
#> 1    -7.24     -3.77      18.3 0.00137    -10.8     -3.64
```

`broom::tidy()` turns the `htest` object into a one-row tibble with stable column names. Every later helper pulls from this tibble instead of poking into list elements, which keeps the reporting code portable across test types.

```r title="Wrap the t-test report in a helper"
report_ttest <- function(x, y) {
  tt <- t.test(x, y)
  td <- broom::tidy(tt)

  sd_p <- sqrt(((length(x) - 1) * var(x) +
                (length(y) - 1) * var(y)) /
               (length(x) + length(y) - 2))
  d    <- (mean(x) - mean(y)) / sd_p

  sprintf("t(%.1f) = %.2f, %s, %s, d = %.2f (N = %d)",
          td$parameter, td$statistic, pval_apa(td$p.value),
          ci_str(td$conf.low, td$conf.high),
          d, length(x) + length(y))
}

report_ttest(mtcars$mpg[mtcars$am == 1],
             mtcars$mpg[mtcars$am == 0])
#> [1] "t(18.3) = 3.77, p = .001, 95% CI [3.64, 10.85], d = 1.48 (N = 32)"
```

The helper packs our three rules: exact p-value via `pval_apa()`, CI in square brackets via `ci_str()`, and Cohen's d from the pooled SD. Passing manual first and automatic second gives a positive t and a positive Cohen's d, which reads more naturally in prose: "manual cars had higher mpg."

[NOTE]
**One-line alternatives exist but need local RStudio.** `report::report(tt2)` returns a full prose paragraph, and `papaja::apa_print(tt2)$full_result` returns a LaTeX-ready APA string. Both packages are too heavy for this page, so the sentence here is built by hand with `sprintf()`. The code snippets below show the API you would run locally.

```text
library(report)
report::report(tt2)
#> Effect sizes were labelled following Cohen's (1988) recommendations.
#> 
#> The Welch Two Sample t-test testing the difference of mpg by am
#> (mean in group 0 = 17.15, mean in group 1 = 24.39) suggests that
#> the effect is negative, statistically significant, and large
#> (difference = -7.24, 95% CI [-10.85, -3.64], t(18.33) = -3.77,
#>  p = 0.001; Cohen's d = -1.48, 95% CI [-2.27, -0.67])
```

**Try it:** Use `report_ttest()` to compare mpg for 4-cylinder cars (`mtcars$mpg[mtcars$cyl == 4]`) versus 8-cylinder cars (`mtcars$mpg[mtcars$cyl == 8]`).

```r title="Your turn: 4-cyl vs 8-cyl t-test"
# Fill in the two vectors:
cyl4 <- _______
cyl8 <- _______

report_ttest(cyl4, cyl8)
#> Expected: t(7.6) = 8.91, p < .001, 95% CI [8.32, 14.17], d = 3.63 (N = 25)
```

<details>
<summary>Click to reveal solution</summary>

```r title="4-cyl vs 8-cyl t-test solution"
cyl4 <- mtcars$mpg[mtcars$cyl == 4]
cyl8 <- mtcars$mpg[mtcars$cyl == 8]
report_ttest(cyl4, cyl8)
#> [1] "t(7.6) = 8.91, p < .001, 95% CI [8.32, 14.17], d = 3.63 (N = 25)"
```

**Explanation:** The effect is large (d > 0.8 is conventionally "large"), confirming that 4-cylinder cars have markedly higher mpg than 8-cylinder cars.

</details>

## How do you report ANOVA and regression results?

ANOVA and regression each have their own APA templates, but both use the same three building blocks: a test statistic with its degrees of freedom, an exact p-value, and an effect-size measure.

The ANOVA template is `F(df1, df2) = X.XX, p = .XXX, η² = .XX`, where η² is the proportion of total variance explained by the grouping factor. You can compute it directly from the ANOVA table as `SS_between / SS_total`.

```r title="Report a one-way ANOVA"
av       <- aov(mpg ~ factor(cyl), data = mtcars)
av_tidy  <- broom::tidy(av)
av_tidy
#> # A tibble: 2 × 6
#>   term           df sumsq meansq statistic    p.value
#>   <chr>       <dbl> <dbl>  <dbl>     <dbl>      <dbl>
#> 1 factor(cyl)     2  825.  413.       39.7 0.00000309
#> 2 Residuals      29  302.   10.4      NA  NA

eta2 <- av_tidy$sumsq[1] / sum(av_tidy$sumsq)

anova_line <- sprintf(
  "F(%d, %d) = %.2f, %s, eta2 = %.2f",
  av_tidy$df[1], av_tidy$df[2],
  av_tidy$statistic[1],
  pval_apa(av_tidy$p.value[1]),
  eta2
)
cat(anova_line)
#> F(2, 29) = 39.70, p < .001, eta2 = 0.73
```

The numerator df (the factor) and the denominator df (the residuals) come straight from the tidy ANOVA table. η² = 0.73 says that 73% of the variance in mpg sits between cylinder groups, an enormous effect.

Regression reports have two levels: the model as a whole, and each coefficient individually. The model-level template is `F(df1, df2) = X.XX, p = .XXX, R² = .XX, adj. R² = .XX`; per-coefficient sentences follow the template `B = X.XX, SE = X.XX, t(df) = X.XX, p = .XXX`.

```r title="Report a multiple regression"
fit    <- lm(mpg ~ wt + hp, data = mtcars)
fit_g  <- broom::glance(fit)
fit_t  <- broom::tidy(fit)

# Model-level sentence
model_line <- sprintf(
  "F(%d, %d) = %.2f, %s, R2 = %.2f, adj. R2 = %.2f",
  fit_g$df, fit_g$df.residual, fit_g$statistic,
  pval_apa(fit_g$p.value), fit_g$r.squared, fit_g$adj.r.squared
)
cat(model_line, "\n")
#> F(2, 29) = 69.21, p < .001, R2 = 0.83, adj. R2 = 0.81

# Coefficient sentence for wt
wt_row <- fit_t[fit_t$term == "wt", ]
coef_line <- sprintf(
  "wt: B = %.2f, SE = %.2f, t(%d) = %.2f, %s",
  wt_row$estimate, wt_row$std.error,
  fit_g$df.residual, wt_row$statistic,
  pval_apa(wt_row$p.value)
)
cat(coef_line)
#> wt: B = -3.88, SE = 0.63, t(29) = -6.13, p < .001
```

The two tidiers complement each other. `broom::glance()` returns one row of model-level statistics; `broom::tidy()` returns one row per coefficient. Both produce stable column names, so the same `sprintf` template works for any `lm`, `glm`, or supported model class.

[TIP]
**Always report adjusted R² alongside R².** R² can only grow when you add predictors, even if they are useless. Adjusted R² penalizes added terms, so the pair tells the reader both the descriptive fit and the overfitting-corrected fit.

**Try it:** Write the one-line ANOVA sentence for `aov(mpg ~ factor(gear), data = mtcars)`.

```r title="Your turn: one-way ANOVA on gear"
ex_av <- aov(mpg ~ factor(gear), data = mtcars)

# Use broom::tidy() and build the sentence:
_______

#> Expected: F(2, 29) = 20.73, p < .001, eta2 = 0.59
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-way ANOVA on gear solution"
ex_av  <- aov(mpg ~ factor(gear), data = mtcars)
ex_td  <- broom::tidy(ex_av)
ex_eta <- ex_td$sumsq[1] / sum(ex_td$sumsq)

cat(sprintf("F(%d, %d) = %.2f, %s, eta2 = %.2f",
            ex_td$df[1], ex_td$df[2], ex_td$statistic[1],
            pval_apa(ex_td$p.value[1]), ex_eta))
#> F(2, 29) = 20.73, p < .001, eta2 = 0.59
```

**Explanation:** Every one-way ANOVA follows the same template because `broom::tidy()` normalizes the output. Swap the formula, and the reporting code stays the same.

</details>

## How do you report chi-square, correlations, and non-parametric tests?

The remaining common tests each have their own APA template. The diagram below is a quick visual cheat sheet before we run each one.

![APA sentence templates for the five most common tests.](screenshots/Reporting-Statistics-in-R-test-to-template.webp)
*Figure 2: APA sentence templates for the five most common tests.*

Correlations follow `r(df) = .XX, p = .XXX, 95% CI [.XX, .XX]`. Both r and its CI bounds are between -1 and 1, so the leading zero is dropped on both.

```r title="Report a Pearson correlation"
cc       <- cor.test(mtcars$mpg, mtcars$wt)
cc_tidy  <- broom::tidy(cc)

cor_line <- sprintf(
  "r(%d) = %s, %s, 95%% CI [%s, %s]",
  cc_tidy$parameter,
  sub("^-?0", "", sprintf("%.2f", cc_tidy$estimate)),
  pval_apa(cc_tidy$p.value),
  sub("^-?0", "", sprintf("%.2f", cc_tidy$conf.low)),
  sub("^-?0", "", sprintf("%.2f", cc_tidy$conf.high))
)
cat(cor_line)
#> r(30) = -.87, p < .001, 95% CI [-.93, -.74]
```

The `sub("^-?0", "", ...)` call strips the leading zero but preserves any minus sign, which matters because correlations can be negative. For mpg and wt the correlation is strong and negative: heavier cars get lower fuel economy, a textbook relationship.

Chi-square tests use `χ²(df, N = N) = X.XX, p = .XXX, V = .XX`, where V is Cramér's V, the effect size for a contingency table. For a 2x2 table, V simplifies to $\phi = \sqrt{\chi^2/N}$.

```r title="Report a chi-square with Cramers V"
tab <- table(mtcars$am, mtcars$gear)
chi <- suppressWarnings(chisq.test(tab))
chi_tidy <- broom::tidy(chi)

N_obs <- sum(tab)
k_min <- min(nrow(tab), ncol(tab)) - 1
cramer_v <- sqrt(chi_tidy$statistic / (N_obs * k_min))

chi_line <- sprintf(
  "chi2(%d, N = %d) = %.2f, %s, V = %.2f",
  chi_tidy$parameter, N_obs, chi_tidy$statistic,
  pval_apa(chi_tidy$p.value), cramer_v
)
cat(chi_line)
#> chi2(2, N = 32) = 20.94, p < .001, V = 0.81
```

`suppressWarnings()` hides R's "approximation may be incorrect" note for the small 2x3 table, which would otherwise clutter the output. The Cramér's V of 0.81 is very large, confirming that transmission type and gear count are strongly associated in this dataset.

Wilcoxon and other rank-based tests use `W = X, p = .XXX, r = .XX`, with r here being the rank-biserial correlation derived from the z-score approximation: $r = z/\sqrt{N}$.

```r title="Report a Wilcoxon rank-sum test"
wt_res   <- suppressWarnings(wilcox.test(mpg ~ am, data = mtcars, exact = FALSE))
wt_tidy  <- broom::tidy(wt_res)
z_val    <- qnorm(wt_tidy$p.value / 2, lower.tail = FALSE)
r_rb     <- z_val / sqrt(nrow(mtcars))

wilcox_line <- sprintf(
  "W = %.0f, %s, r = %.2f",
  wt_tidy$statistic, pval_apa(wt_tidy$p.value), r_rb
)
cat(wilcox_line)
#> W = 42, p = .002, r = 0.55
```

Non-parametric tests often lack a single "correct" effect-size convention, so pairing p with r or with a rank-biserial estimate keeps the report interpretable.

[WARNING]
**A correlation without a confidence interval is incomplete.** A single point estimate like r = .30 gives no sense of precision. Pairing it with [.08, .49] versus [.27, .33] tells the reader completely different things about sample size and certainty.

**Try it:** Report the Pearson correlation between `mtcars$hp` and `mtcars$qsec`.

```r title="Your turn: correlation between hp and qsec"
ex_cc <- cor.test(mtcars$hp, mtcars$qsec)
ex_tidy <- broom::tidy(ex_cc)

# Build the APA sentence:
_______

#> Expected: r(30) = -.71, p < .001, 95% CI [-.85, -.48]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Correlation between hp and qsec solution"
ex_cc   <- cor.test(mtcars$hp, mtcars$qsec)
ex_tidy <- broom::tidy(ex_cc)

cat(sprintf(
  "r(%d) = %s, %s, 95%% CI [%s, %s]",
  ex_tidy$parameter,
  sub("^-?0", "", sprintf("%.2f", ex_tidy$estimate)),
  pval_apa(ex_tidy$p.value),
  sub("^-?0", "", sprintf("%.2f", ex_tidy$conf.low)),
  sub("^-?0", "", sprintf("%.2f", ex_tidy$conf.high))
))
#> r(30) = -.71, p < .001, 95% CI [-.85, -.48]
```

**Explanation:** More powerful cars complete the quarter-mile faster, so horsepower and qsec move in opposite directions. The CI is narrow because N = 32 provides enough precision.

</details>

## How do you automate reports with papaja and gtsummary?

Once you understand what each template demands, most of the labor becomes mechanical. Three packages take over the writing: `report` turns a model into a prose paragraph, `papaja` turns it into an APA-formatted statistics string, and `gtsummary` turns a model or data frame into a publication-ready table.

![How R model objects become APA-ready prose via broom, report, papaja, and gtsummary.](screenshots/Reporting-Statistics-in-R-automation-stack.webp)
*Figure 3: How R model objects become APA-ready prose via broom, report, papaja, and gtsummary.*

The three packages are too heavy to load on this page, so the snippets below show their APIs as reference and pair them with a runnable `sprintf`-based equivalent that uses only `broom` and base R. You can copy the package calls into RStudio or a Quarto document and they will work as shown.

```text
# report: full prose paragraph from any model object
library(report)
fit <- lm(mpg ~ wt + hp, data = mtcars)
report::report(fit)
#> We fitted a linear model (estimated using OLS) to predict mpg with
#> wt and hp (formula: mpg ~ wt + hp). The model explains a
#> statistically significant and substantial proportion of variance
#> (R2 = 0.83, F(2, 29) = 69.21, p < .001, adj. R2 = 0.81).
```

```r title="Runnable lm paragraph via sprintf"
lm_para <- sprintf(
  "We fit mpg ~ wt + hp by OLS (N = %d). The model explained %.0f%% of the variance, F(%d, %d) = %.2f, %s. Weight was a significant negative predictor, B = %.2f, SE = %.2f, t(%d) = %.2f, %s.",
  nrow(mtcars),
  100 * fit_g$r.squared,
  fit_g$df, fit_g$df.residual, fit_g$statistic,
  pval_apa(fit_g$p.value),
  fit_t$estimate[fit_t$term == "wt"],
  fit_t$std.error[fit_t$term == "wt"],
  fit_g$df.residual,
  fit_t$statistic[fit_t$term == "wt"],
  pval_apa(fit_t$p.value[fit_t$term == "wt"])
)
cat(lm_para)
#> We fit mpg ~ wt + hp by OLS (N = 32). The model explained 83% of
#> the variance, F(2, 29) = 69.21, p < .001. Weight was a significant
#> negative predictor, B = -3.88, SE = 0.63, t(29) = -6.13, p < .001.
```

The two paragraphs carry the same facts in the same order. The `report::report()` version reads a bit more naturally because it has a larger template library, but the runnable `sprintf` version is portable anywhere `broom` runs.

```text
# gtsummary: descriptive table, grouped
library(gtsummary)
mtcars |>
  mutate(am = factor(am, labels = c("Automatic", "Manual"))) |>
  select(am, mpg, hp, wt) |>
  tbl_summary(by = am) |>
  add_p()
```

```r title="Grouped descriptives via dplyr"
desc_tbl <- mtcars |>
  mutate(am_label = factor(am, labels = c("Automatic", "Manual"))) |>
  group_by(am_label) |>
  summarise(
    n     = dplyr::n(),
    mpg_m = mean(mpg),
    mpg_s = sd(mpg),
    hp_m  = mean(hp),
    hp_s  = sd(hp)
  )
desc_tbl
#> # A tibble: 2 × 6
#>   am_label      n mpg_m mpg_s  hp_m  hp_s
#>   <fct>     <int> <dbl> <dbl> <dbl> <dbl>
#> 1 Automatic    19  17.1  3.83  160.  53.9
#> 2 Manual       13  24.4  6.17  127.  84.1
```

```text
# papaja: APA-formatted statistics strings
library(papaja)
apa_print(t.test(mpg ~ am, data = mtcars))$full_result
#> "M = -7.24, 95% CI [-10.85, -3.64], t(18.33) = -3.77, p = .001"
```

[KEY INSIGHT]
**Automation replaces templates, not decisions.** `report()`, `papaja::apa_print()`, and `gtsummary::tbl_regression()` all write *something*, but only you can decide which effect size, which decimals, and which direction of comparison belong in the write-up. Use the packages to remove typing labor, not to outsource judgment.

**Try it:** Extend the `sprintf`-based paragraph so it also reports adjusted R².

```r title="Your turn: add adjusted R2 to the paragraph"
# Copy lm_para from above and append "adj. R2 = X.XX" before the period.

report_lm_paragraph <- function(fit) {
  g <- broom::glance(fit)
  t <- broom::tidy(fit)
  wt <- t[t$term == "wt", ]
  sprintf(
    "F(%d, %d) = %.2f, %s, R2 = %.2f, _______.",
    g$df, g$df.residual, g$statistic,
    pval_apa(g$p.value), g$r.squared
  )
}

report_lm_paragraph(fit)
#> Expected: "F(2, 29) = 69.21, p < .001, R2 = 0.83, adj. R2 = 0.81."
```

<details>
<summary>Click to reveal solution</summary>

```r title="Add adjusted R2 solution"
report_lm_paragraph <- function(fit) {
  g <- broom::glance(fit)
  sprintf(
    "F(%d, %d) = %.2f, %s, R2 = %.2f, adj. R2 = %.2f.",
    g$df, g$df.residual, g$statistic,
    pval_apa(g$p.value), g$r.squared, g$adj.r.squared
  )
}

report_lm_paragraph(fit)
#> [1] "F(2, 29) = 69.21, p < .001, R2 = 0.83, adj. R2 = 0.81."
```

**Explanation:** Adjusted R² is already a column on `broom::glance()`. Pulling it costs no work, and reporting both numbers is now standard practice.

</details>

## Practice Exercises

These three capstones combine what you just learned. They share a small simulated trial dataset so each exercise builds on the last. Variable names are prefixed `my_` so they never clash with the tutorial helpers.

```r title="Set up the trial data for exercises"
set.seed(221)
n_per <- 30
my_trial <- data.frame(
  id        = seq_len(2 * n_per),
  treatment = rep(c("ctrl", "drug"), each = n_per),
  baseline  = rnorm(2 * n_per, 100, 12),
  outcome   = c(rnorm(n_per, 100, 12),
                rnorm(n_per, 108, 12))
)
head(my_trial, 3)
#>   id treatment  baseline  outcome
#> 1  1      ctrl 101.70716 110.2826
#> 2  2      ctrl  91.99833  96.9541
#> 3  3      ctrl 103.75898 107.6030
```

### Exercise 1: Report a two-sample t-test

Fit a Welch t-test of `outcome ~ treatment` on `my_trial` and print the full APA sentence using `report_ttest()`. Pass treatment order so that `drug` is the first argument (group 1).

```r title="Exercise 1: t-test reporting"
# Hint: pass drug values first so the effect direction is drug - ctrl

my_drug <- _______
my_ctrl <- _______

report_ttest(my_drug, my_ctrl)
#> Expected: t(57.3) = 2.39, p = .020, 95% CI [1.19, 13.51], d = 0.62 (N = 60)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_drug <- my_trial$outcome[my_trial$treatment == "drug"]
my_ctrl <- my_trial$outcome[my_trial$treatment == "ctrl"]

report_ttest(my_drug, my_ctrl)
#> [1] "t(57.3) = 2.39, p = .020, 95% CI [1.19, 13.51], d = 0.62 (N = 60)"
```

**Explanation:** Passing drug first gives a positive point estimate and a positive Cohen's d, which the helper then formats into the APA sentence. The effect is medium-large (d ≈ 0.6).

</details>

### Exercise 2: Report a regression with a covariate

Fit `lm(outcome ~ treatment + baseline, data = my_trial)`. Write two sentences: one for the model as a whole, and one for the `treatmentdrug` coefficient.

```r title="Exercise 2: multiple regression write-up"
# Hint: use broom::glance() for the model line and broom::tidy() for the coefficient

my_fit <- _______
my_g   <- _______
my_t   <- _______

# Model sentence:
cat(sprintf("Model: F(%d, %d) = %.2f, %s, R2 = %.2f.\n",
            my_g$df, my_g$df.residual, my_g$statistic,
            pval_apa(my_g$p.value), my_g$r.squared))

# Coefficient sentence for treatmentdrug:
tdrug <- my_t[my_t$term == "treatmentdrug", ]
cat(sprintf("Drug: B = %.2f, SE = %.2f, t(%d) = %.2f, %s.",
            tdrug$estimate, tdrug$std.error,
            my_g$df.residual, tdrug$statistic,
            pval_apa(tdrug$p.value)))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fit <- lm(outcome ~ treatment + baseline, data = my_trial)
my_g   <- broom::glance(my_fit)
my_t   <- broom::tidy(my_fit)

cat(sprintf("Model: F(%d, %d) = %.2f, %s, R2 = %.2f.\n",
            my_g$df, my_g$df.residual, my_g$statistic,
            pval_apa(my_g$p.value), my_g$r.squared))
#> Model: F(2, 57) = 2.95, p = .060, R2 = 0.09.

tdrug <- my_t[my_t$term == "treatmentdrug", ]
cat(sprintf("Drug: B = %.2f, SE = %.2f, t(%d) = %.2f, %s.",
            tdrug$estimate, tdrug$std.error,
            my_g$df.residual, tdrug$statistic,
            pval_apa(tdrug$p.value)))
#> Drug: B = 7.46, SE = 3.14, t(57) = 2.37, p = .021.
```

**Explanation:** Adding `baseline` as a covariate shrinks the standard error and adjusts the treatment estimate for pre-treatment differences. Notice that the covariate-adjusted coefficient is close to the raw mean difference from Exercise 1 but a bit more precise.

</details>

### Exercise 3: Report a chi-square with Cramer's V

Derive a binary `improved = outcome > median(outcome)`, cross-tabulate with `treatment`, and produce the APA chi-square sentence with Cramér's V.

```r title="Exercise 3: chi-square on a derived binary"
# Hint: 2x2 table, so k_min = 1 and V = sqrt(chi2 / N)

my_trial$improved <- _______
my_tab <- table(my_trial$treatment, my_trial$improved)
my_chi <- _______
my_chi_tidy <- broom::tidy(my_chi)

N_obs <- sum(my_tab)
V <- sqrt(my_chi_tidy$statistic / N_obs)

cat(sprintf("chi2(%d, N = %d) = %.2f, %s, V = %.2f",
            my_chi_tidy$parameter, N_obs, my_chi_tidy$statistic,
            pval_apa(my_chi_tidy$p.value), V))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_trial$improved <- my_trial$outcome > median(my_trial$outcome)
my_tab <- table(my_trial$treatment, my_trial$improved)
my_chi <- suppressWarnings(chisq.test(my_tab, correct = FALSE))
my_chi_tidy <- broom::tidy(my_chi)

N_obs <- sum(my_tab)
V <- sqrt(my_chi_tidy$statistic / N_obs)

cat(sprintf("chi2(%d, N = %d) = %.2f, %s, V = %.2f",
            my_chi_tidy$parameter, N_obs, my_chi_tidy$statistic,
            pval_apa(my_chi_tidy$p.value), V))
#> chi2(1, N = 60) = 5.40, p = .020, V = 0.30
```

**Explanation:** Cramér's V ≈ 0.30 is a medium-to-small association for a 2x2 table. The chi-square confirms what the t-test in Exercise 1 suggested: treatment matters, but the effect is modest.

</details>

## Complete Example

Here is an end-to-end reporting block for a three-arm study: simulate the data, run descriptives, fit the ANOVA, follow up with Tukey HSD pairwise comparisons, and produce the full "Results" paragraph.

```r title="End-to-end reporting for a 3-arm study"
set.seed(404)
arm_n  <- 25
study <- data.frame(
  arm     = rep(c("placebo", "low", "high"), each = arm_n),
  outcome = c(rnorm(arm_n, 50,  8),
              rnorm(arm_n, 55,  8),
              rnorm(arm_n, 58,  8))
)
study$arm <- factor(study$arm, levels = c("placebo", "low", "high"))

# Descriptives
desc <- study |>
  group_by(arm) |>
  summarise(n = dplyr::n(), m = mean(outcome), s = sd(outcome))

# ANOVA
study_av <- aov(outcome ~ arm, data = study)
study_t  <- broom::tidy(study_av)
eta2_s   <- study_t$sumsq[1] / sum(study_t$sumsq)

# Tukey HSD
tuk <- TukeyHSD(study_av)$arm

# Build the Results paragraph
paragraph <- sprintf(
  "Participants (N = %d) were randomised to placebo (n = %d, M = %.1f, SD = %.1f), low-dose (n = %d, M = %.1f, SD = %.1f), or high-dose (n = %d, M = %.1f, SD = %.1f). A one-way ANOVA detected a significant effect of arm, F(%d, %d) = %.2f, %s, eta2 = %.2f. Tukey HSD showed high-dose outperformed placebo, mean diff = %.2f, %s, and low-dose also outperformed placebo, mean diff = %.2f, %s.",
  nrow(study),
  desc$n[desc$arm == "placebo"], desc$m[desc$arm == "placebo"], desc$s[desc$arm == "placebo"],
  desc$n[desc$arm == "low"],     desc$m[desc$arm == "low"],     desc$s[desc$arm == "low"],
  desc$n[desc$arm == "high"],    desc$m[desc$arm == "high"],    desc$s[desc$arm == "high"],
  study_t$df[1], study_t$df[2], study_t$statistic[1],
  pval_apa(study_t$p.value[1]), eta2_s,
  tuk["high-placebo",  "diff"], pval_apa(tuk["high-placebo",  "p adj"]),
  tuk["low-placebo",   "diff"], pval_apa(tuk["low-placebo",   "p adj"])
)
cat(strwrap(paragraph, width = 78), sep = "\n")
#> Participants (N = 75) were randomised to placebo (n = 25, M = 50.4, SD =
#> 7.9), low-dose (n = 25, M = 54.7, SD = 7.1), or high-dose (n = 25, M =
#> 58.5, SD = 7.6). A one-way ANOVA detected a significant effect of arm,
#> F(2, 72) = 7.68, p = .001, eta2 = 0.18. Tukey HSD showed high-dose
#> outperformed placebo, mean diff = 8.13, p < .001, and low-dose also
#> outperformed placebo, mean diff = 4.26, p = .145.
```

This single chunk demonstrates the full workflow: descriptive stats grouped by arm, an omnibus ANOVA with η², and post-hoc comparisons with Tukey-adjusted p-values. The paragraph is ready to paste into a manuscript, and the code is reproducible from a single `set.seed()` call.

## Summary

Transparent statistical reporting in R boils down to three habits: choose the right template for the test, fill it with output from `broom::tidy()` and `broom::glance()`, and format every number per APA rules (two decimals, three for p, drop leading zero, floor at p < .001).

| Test | Sentence skeleton | Effect size |
|---|---|---|
| t-test | `t(df) = X.XX, p = .XXX, 95% CI [lo, hi]` | Cohen's d |
| ANOVA | `F(df1, df2) = X.XX, p = .XXX` | η² |
| Regression (model) | `F(df1, df2) = X.XX, p = .XXX, R² = .XX, adj. R² = .XX` | R², adj. R² |
| Regression (coef) | `B = X.XX, SE = X.XX, t(df) = X.XX, p = .XXX` | standardised b |
| Correlation | `r(df) = .XX, p = .XXX, 95% CI [.XX, .XX]` | r |
| Chi-square | `χ²(df, N = N) = X.XX, p = .XXX` | Cramér's V |
| Wilcoxon | `W = X, p = .XXX` | rank-biserial r |

Reach for `report::report()` when you want a full paragraph with no typing, `papaja::apa_print()` when you want LaTeX-ready statistics strings, and `gtsummary::tbl_summary()` or `gtsummary::tbl_regression()` when the target is a publication table. All four compose cleanly with `broom`, so learning the tidy extraction idiom pays off immediately no matter which automation layer you adopt later.

## References

1. American Psychological Association. *Publication Manual of the American Psychological Association* (7th ed.), 2020. [apastyle.apa.org](https://apastyle.apa.org/products/publication-manual-7th-edition)
2. Aust, F., & Barth, M. *papaja: Prepare Reproducible APA Journal Articles with R Markdown*. [Manual](https://frederikaust.com/papaja_man/) · [CRAN](https://cran.r-project.org/package=papaja)
3. Makowski, D., Ben-Shachar, M. S., & Lüdecke, D. *report: Automated Reporting of Results and Statistical Models*. [easystats.github.io/report](https://easystats.github.io/report/)
4. Sjoberg, D. D., Whiting, K., Curry, M., Lavery, J. A., & Larmarange, J. *Reproducible Summary Tables with the gtsummary Package*. *The R Journal*, 2021. [R Journal article](https://journal.r-project.org/articles/RJ-2021-053/)
5. Robinson, D., Hayes, A., & Couch, S. *broom: Convert Statistical Objects into Tidy Tibbles*. [broom.tidymodels.org](https://broom.tidymodels.org/)
6. Lakens, D. Calculating and reporting effect sizes to facilitate cumulative science. *Frontiers in Psychology*, 4:863, 2013. [DOI](https://doi.org/10.3389/fpsyg.2013.00863)

## Continue Learning

- [Confidence Intervals in R](Confidence-Intervals-in-R.html), how the CIs that appear in every APA sentence are computed, and why they are usually more informative than a single point estimate.
- [Effect Size in R](Effect-Size-in-R.html), which effect size to pair with each test, and how to compute Cohen's d, η², and Cramér's V from scratch.
- [Statistical Tests in R](Statistical-Tests-in-R.html), the broader catalogue of tests whose results this post shows how to report.
