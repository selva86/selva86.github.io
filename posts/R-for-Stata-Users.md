---
title: "R for Stata Users: Complete Stata-to-R Reference Translation"
slug: "R-for-Stata-Users"
description: "Translate Stata commands to R code: gen/replace to mutate, reg to lm, xtset to plm. A complete Stata-to-R migration guide with examples."
keywords: "R for Stata users, Stata to R, Stata commands R equivalent, convert Stata to R, R vs Stata, Stata migration"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "CAR11"
post_type: "FR"
auto_link_terms: "R for Stata users|Stata to R|convert Stata to R"
auto_link_case_sensitive: false
fr_parent: "Is-R-Worth-Learning-in-2026.html"
---

# R for Stata Users: Complete Stata-to-R Reference Translation

<p class="lead">Stata and R both excel at statistical analysis, but their syntax is worlds apart. This guide maps every common Stata command to its R equivalent so you can transition without losing productivity.</p>

Stata users love its concise syntax — `reg y x1 x2` is hard to beat for brevity. R is more verbose but also more flexible: you get 20,000+ packages, publication-quality graphics, and a full programming language. This guide helps you translate the Stata you know into idiomatic R.

## Key Conceptual Differences

Before diving into syntax, understand these fundamental differences:

| Concept | Stata | R |
|---------|-------|---|
| Data in memory | One dataset at a time | Multiple data frames simultaneously |
| Variable access | Just type the name | Use `df$varname` or `with(df, ...)` |
| Missing values | `.` (dot) | `NA` |
| String delimiter | `"text"` | `"text"` or `'text'` |
| Comments | `// comment` or `/* */` | `# comment` |
| Command terminator | Newline | Newline (or `;`) |
| Looping | `forvalues`, `foreach` | `for`, `lapply`, `sapply` |
| Output | Results window | Console (or R Markdown for reports) |

## Data Management

### Loading and Saving Data

| Stata | R Equivalent |
|-------|-------------|
| `use "data.dta"` | `haven::read_dta("data.dta")` |
| `save "data.dta", replace` | `haven::write_dta(df, "data.dta")` |
| `import delimited "data.csv"` | `read.csv("data.csv")` |
| `export delimited "data.csv"` | `write.csv(df, "data.csv", row.names = FALSE)` |
| `describe` | `str(df)` |
| `list in 1/10` | `head(df, 10)` |
| `count` | `nrow(df)` |
| `browse` | `View(df)` (in RStudio) |

### Creating and Modifying Variables

| Stata | R Equivalent |
|-------|-------------|
| `gen newvar = x + y` | `df$newvar <- df$x + df$y` |
| `replace x = 0 if x < 0` | `df$x[df$x < 0] <- 0` |
| `gen log_x = log(x)` | `df$log_x <- log(df$x)` |
| `gen age_sq = age^2` | `df$age_sq <- df$age^2` |
| `egen mean_x = mean(x), by(group)` | `df$mean_x <- ave(df$x, df$group, FUN = mean)` |
| `egen total_x = total(x), by(group)` | `df$total_x <- ave(df$x, df$group, FUN = sum)` |
| `egen rank_x = rank(x)` | `df$rank_x <- rank(df$x)` |
| `recode x (1/3=1)(4/6=2)(7/10=3)` | `df$x_r <- cut(df$x, c(0,3,6,10), labels=1:3)` |
| `encode strvar, gen(numvar)` | `df$numvar <- as.numeric(factor(df$strvar))` |
| `decode numvar, gen(strvar)` | `df$strvar <- as.character(df$numvar)` |
| `destring x, replace` | `df$x <- as.numeric(df$x)` |
| `tostring x, replace` | `df$x <- as.character(df$x)` |
| `label variable x "Label"` | `attr(df$x, "label") <- "Label"` |
| `drop x y` | `df$x <- NULL; df$y <- NULL` |
| `keep x y z` | `df <- df[, c("x", "y", "z")]` |
| `rename old new` | `names(df)[names(df) == "old"] <- "new"` |

```r
# Stata gen/replace equivalents
df <- mtcars
df$car <- rownames(df)

# gen efficiency = mpg / wt
df$efficiency <- round(df$mpg / df$wt, 2)

# replace efficiency = 0 if efficiency < 5
df$efficiency[df$efficiency < 5] <- 0

# egen mean_mpg = mean(mpg), by(cyl)
df$mean_mpg <- ave(df$mpg, df$cyl, FUN = mean)

cat("=== First 6 rows ===\n")
print(head(df[, c("car", "mpg", "wt", "cyl", "efficiency", "mean_mpg")]))
```

### Subsetting and Sorting

| Stata | R Equivalent |
|-------|-------------|
| `keep if x > 10` | `df <- subset(df, x > 10)` |
| `drop if missing(x)` | `df <- df[!is.na(df$x), ]` |
| `sort x` | `df <- df[order(df$x), ]` |
| `gsort -x` | `df <- df[order(-df$x), ]` |
| `sort group x` | `df <- df[order(df$group, df$x), ]` |
| `duplicates drop` | `df <- df[!duplicated(df), ]` |
| `duplicates list` | `df[duplicated(df), ]` |

### Merging and Appending

| Stata | R Equivalent |
|-------|-------------|
| `merge 1:1 id using "file2.dta"` | `merge(df1, df2, by = "id")` |
| `merge m:1 id using "lookup.dta"` | `merge(df1, lookup, by = "id", all.x = TRUE)` |
| `append using "file2.dta"` | `rbind(df1, df2)` |
| `reshape wide val, i(id) j(time)` | `reshape(df, direction="wide", idvar="id", timevar="time")` |
| `reshape long val, i(id) j(time)` | `reshape(df, direction="long", varying=..., idvar="id")` |

```r
# Stata merge equivalent
customers <- data.frame(id = 1:5, name = c("Alice","Bob","Carol","Dave","Eve"))
purchases <- data.frame(id = c(1,2,2,5), amount = c(50, 30, 75, 120))

# merge 1:m id using purchases
result <- merge(customers, purchases, by = "id", all.x = TRUE)
cat("=== Left Join (m:1 merge) ===\n")
print(result)
```

## Statistical Analysis

### Descriptive Statistics

| Stata | R Equivalent |
|-------|-------------|
| `summarize x` | `summary(df$x)` |
| `summarize x, detail` | `summary(df$x)` + `sd()`, `quantile()` |
| `tabulate x` | `table(df$x)` |
| `tab x y` | `table(df$x, df$y)` |
| `tab x y, chi2` | `chisq.test(table(df$x, df$y))` |
| `correlate x y z` | `cor(df[, c("x","y","z")])` |
| `pwcorr x y z, sig` | `psych::corr.test(df[,c("x","y","z")])` |

```r
# Stata summarize equivalent
cat("=== summarize mpg, detail ===\n")
x <- mtcars$mpg
stats <- data.frame(
  Stat = c("N","Mean","SD","Min","P25","Median","P75","Max"),
  Value = c(length(x), round(mean(x),2), round(sd(x),2),
            min(x), quantile(x,0.25), median(x), quantile(x,0.75), max(x))
)
print(stats, row.names = FALSE)
```

### Regression

| Stata | R Equivalent |
|-------|-------------|
| `reg y x1 x2` | `lm(y ~ x1 + x2, data = df)` |
| `reg y x1 x2, robust` | `lmtest::coeftest(model, vcov = sandwich::vcovHC)` |
| `reg y x1 x2, cluster(id)` | `lmtest::coeftest(model, vcov = sandwich::vcovCL)` |
| `logit y x1 x2` | `glm(y ~ x1 + x2, family = binomial)` |
| `probit y x1 x2` | `glm(y ~ x1 + x2, family = binomial(link="probit"))` |
| `ologit y x1 x2` | `MASS::polr(factor(y) ~ x1 + x2)` |
| `poisson y x1 x2` | `glm(y ~ x1 + x2, family = poisson)` |
| `tobit y x1 x2, ll(0)` | `AER::tobit(y ~ x1 + x2, left = 0)` |
| `predict yhat` | `fitted(model)` |
| `predict resid, residuals` | `residuals(model)` |
| `test x1 = x2` | `car::linearHypothesis(model, "x1 = x2")` |
| `vif` | `car::vif(model)` |

```r
# Stata reg equivalent
cat("=== reg mpg wt hp ===\n")
model <- lm(mpg ~ wt + hp, data = mtcars)
print(summary(model))
```

### T-tests and ANOVA

| Stata | R Equivalent |
|-------|-------------|
| `ttest x == 0` | `t.test(x, mu = 0)` |
| `ttest x, by(group)` | `t.test(x ~ group, data = df)` |
| `ttest x == y` (paired) | `t.test(x, y, paired = TRUE)` |
| `oneway y group, tabulate` | `summary(aov(y ~ factor(group), data = df))` |
| `anova y group1 group2` | `summary(aov(y ~ group1 * group2, data = df))` |

```r
# Stata ttest equivalent
cat("=== ttest mpg, by(am) ===\n")
result <- t.test(mpg ~ am, data = mtcars)
cat("t =", round(result$statistic, 3), "\n")
cat("p-value =", round(result$p.value, 4), "\n")
cat("Mean (auto):", round(result$estimate[1], 2), "\n")
cat("Mean (manual):", round(result$estimate[2], 2), "\n")
```

### Panel Data

| Stata | R Equivalent |
|-------|-------------|
| `xtset id time` | Use `plm` package: `pdata.frame(df, index = c("id","time"))` |
| `xtreg y x1, fe` | `plm(y ~ x1, data = pdf, model = "within")` |
| `xtreg y x1, re` | `plm(y ~ x1, data = pdf, model = "random")` |
| `hausman fe re` | `phtest(fe_model, re_model)` |

```r
# Panel data concepts (without plm for WebR compatibility)
cat("=== Panel Data in R ===\n")
cat("For panel/longitudinal data, use the plm package:\n\n")
cat('library(plm)\n')
cat('pdf <- pdata.frame(df, index = c("id", "time"))\n')
cat('fe_model <- plm(y ~ x1 + x2, data = pdf, model = "within")\n')
cat('re_model <- plm(y ~ x1 + x2, data = pdf, model = "random")\n')
cat('phtest(fe_model, re_model)  # Hausman test\n')
```

## Programming Constructs

| Stata | R Equivalent |
|-------|-------------|
| `local x = 5` | `x <- 5` |
| `global x = 5` | `x <<- 5` (avoid this; use function args) |
| `forvalues i = 1/10 { }` | `for (i in 1:10) { }` |
| `foreach v of varlist x y z { }` | `for (v in c("x","y","z")) { }` |
| `while condition { }` | `while (condition) { }` |
| `capture noisily command` | `tryCatch(expr, error = function(e) ...)` |
| `program define name` | `name <- function(...) { }` |
| `display "text"` | `cat("text\n")` |
| `return scalar r = val` | `return(val)` in a function |
| `do "script.do"` | `source("script.R")` |

## Summary: Stata → R Quick Reference

| Category | Stata Command | R Equivalent |
|----------|--------------|-------------|
| Load data | `use "file.dta"` | `haven::read_dta("file.dta")` |
| Describe | `describe` | `str(df)` |
| Create var | `gen x = expr` | `df$x <- expr` |
| Filter | `keep if cond` | `df <- subset(df, cond)` |
| Sort | `sort var` | `df <- df[order(df$var), ]` |
| Merge | `merge 1:1 id using file` | `merge(df1, df2, by = "id")` |
| Summarize | `summarize x` | `summary(df$x)` |
| Tabulate | `tab x y` | `table(df$x, df$y)` |
| Regression | `reg y x1 x2` | `lm(y ~ x1 + x2, data = df)` |
| Logistic | `logit y x1 x2` | `glm(y~x1+x2, family=binomial)` |
| T-test | `ttest x, by(g)` | `t.test(x ~ g, data = df)` |
| ANOVA | `oneway y group` | `aov(y ~ factor(group))` |

## FAQ

**Can R read Stata .dta files?**
Yes. Use `haven::read_dta("file.dta")`. It supports Stata versions 8 through 18 and preserves variable labels and value labels. Install with `install.packages("haven")`.

**How do I get Stata-style robust standard errors in R?**
Use the `sandwich` and `lmtest` packages: `lmtest::coeftest(model, vcov = sandwich::vcovHC(model, type = "HC1"))`. The `HC1` type matches Stata's `robust` option.

**Is R slower than Stata for large datasets?**
For standard operations, R is comparable or faster — especially with data.table for very large data. R's vectorized operations and packages like `collapse` can outperform Stata on datasets with millions of rows.

## What's Next

- [Is R Worth Learning in 2026?](Is-R-Worth-Learning-in-2026.html) — The full case for learning R
- [R for SAS Users](R-for-SAS-Users.html) — SAS-to-R migration guide
- [R for Excel Users](R-for-Excel-Users.html) — Excel-to-R translation
