---
title: "Learn R in 12 Months: A Week-by-Week Roadmap With No Wasted Time"
slug: "How-to-Learn-R"
description: "A 12-month week-by-week R learning roadmap: data wrangling, stats, visualization, modeling, and packages, with milestones and projects at each stage."
keywords: "how to learn R, learn R programming, R roadmap, R study plan, R programming for beginners, R data science path, R learning milestones"
auto_link_terms: "how to learn R|learn R programming|R learning roadmap|R study plan|R learning path|12 month R roadmap|R programming roadmap"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "CAR2"
post_type: "FR"
difficulty: "Intermediate"
---

# Learn R in 12 Months: A Week-by-Week Roadmap With No Wasted Time

<p class="lead">Most people who try to learn R quit in the first month because they follow a plan that is either too vague ("just practice") or too ambitious ("become an expert in 30 days"). This 12-month roadmap gives you a specific weekly schedule, four milestone gates so you know when to move on, and an honest list of things you should skip.</p>

## What does the 12-month R roadmap look like at a glance?

Think of the next year as four three-month phases that stack on each other. Phase 1 teaches the language, syntax, objects, how R thinks. Phase 2 covers data wrangling and visualisation, which is where R stops being a toy and becomes genuinely useful. Phase 3 brings in statistics and modelling, the domain R was built for. Phase 4 is where you pick a specialisation, machine learning, Shiny, bioinformatics, or time series, and go deep. Before we dive in, here is a taste of what even raw R gives you with two lines of code.

```r title="One-line summary of mtcars mpg"
# One line of R can replace a whole spreadsheet column of formulas
data(mtcars)
summary(mtcars$mpg)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   10.40   15.43   19.20   20.09   22.80   33.90
```

Two lines, and you already have the full five-number summary plus the mean of a real dataset. By the end of month 2, you will read code like this as naturally as English. That compounding payoff is why R rewards a steady weekly rhythm rather than a heroic 30-day sprint.

[KEY INSIGHT]
**The roadmap is built around milestone gates, not hours.** You advance when you can complete a small project from memory, not when the calendar says it is time. This prevents the "I finished the course but cannot write anything" trap that most tutorials produce.

**Try it:** Use `summary()` on the `hp` column of `mtcars` to inspect the horsepower distribution. Store the result in `ex_hp_summary`.

```r title="Exercise: Summarise mtcars horsepower"
# Try it: summarise mtcars$hp
ex_hp_summary <- # your code here

ex_hp_summary
#> Expected: five-number summary + mean of horsepower (min ~52, max ~335)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Summarise mtcars horsepower solution"
ex_hp_summary <- summary(mtcars$hp)
ex_hp_summary
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>    52.0    96.5   123.0   146.7   180.0   335.0
```

**Explanation:** `summary()` dispatches on the object's type. Given a numeric vector it returns the five-number summary plus the mean.

</details>

## Months 1-3: What should you learn in the foundations phase?

Phase 1 is about fluency with the language itself. The goal is simple, by the end of month 3 you should be able to open RStudio, load a CSV, poke at it with base R, and produce a short written summary of what you found. No tidyverse yet, no statistics, no plots fancier than `plot()`. Foundations first.

Weeks 1-2 cover installation, the RStudio interface, arithmetic, and assignment with `<-`. Weeks 3-4 introduce the core data structures, vectors, lists, and data frames, and how to index them. Weeks 5-8 add functions, `if`/`for`, and reading small CSV files with `read.csv()`. Weeks 9-12 are your first milestone project, pick a dataset that interests you and write a base-R exploration script, end to end.

Here is the kind of code a week-4 reader should be able to write without looking it up.

```r title="Describe a vector of ages"
# Typical week-4 code: describe a vector of ages
ages <- c(21, 34, 28, 45, 31, 29, 52, 40)
mean(ages)
#> [1] 35
sd(ages)
#> [1] 10.14586
length(ages[ages > 30])
#> [1] 5
```

Three lines, three different patterns, an aggregate function, a summary statistic, and a logical filter used as an index. The last line is the most important idea in all of R: boolean vectors act as selectors. Once that clicks, everything else in the language becomes easier.

[NOTE]
**Skip advanced topics in month 1.** Environments, S4 classes, lazy evaluation, and metaprogramming are rabbit holes that look essential in blog posts but are not. You can build a full data-analysis career without touching S4. Come back to them in Phase 4 if your specialisation needs them.

**Try it:** Create a vector `ex_scores` containing 85, 92, 78, 95, 88 and compute its mean, rounded to one decimal place.

```r title="Exercise: Mean of a score vector"
# Try it: mean of a vector
ex_scores <- # your code here

round(mean(ex_scores), 1)
#> Expected: 87.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean of a score vector solution"
ex_scores <- c(85, 92, 78, 95, 88)
round(mean(ex_scores), 1)
#> [1] 87.6
```

**Explanation:** `c()` concatenates values into a numeric vector. `mean()` averages them and `round(x, 1)` keeps one decimal place.

</details>

## Months 4-6: How do you master data wrangling and visualisation?

Phase 2 is where R becomes your daily driver instead of a toy from a textbook. The tidyverse, especially dplyr, tidyr, and ggplot2, turns clunky multi-step analyses into short, readable pipelines. If you skipped tidyverse here to "stay pure base-R", you would spend three times as long on every real project.

Weeks 13-16 focus on the five core dplyr verbs: `filter()`, `select()`, `mutate()`, `summarise()`, and `group_by()`. Weeks 17-20 add `tidyr` reshaping, joins, and string and date handling. Weeks 21-24 are the ggplot2 grammar, layers, aesthetics, facets, and your second milestone project is a one-page exploratory-data-analysis report on a dataset you did not choose yourself.

Let us see the same `mtcars` question from earlier, but answered the tidyverse way.

```r title="Group mpg by cylinder count"
# Week-14 style: grouped summary with dplyr
library(dplyr)
mpg_by_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg), n = n())
mpg_by_cyl
#> # A tibble: 3 × 3
#>     cyl mean_mpg     n
#>   <dbl>    <dbl> <int>
#> 1     4     26.7    11
#> 2     6     19.7     7
#> 3     8     15.1    14
```

The pipe reads left-to-right like a sentence, "take mtcars, group by cylinder, then summarise mean mpg and count." Four-cylinder cars average 26.7 mpg, eight-cylinders just 15.1. That is the kind of answer you can extract in fifteen seconds once the pipeline is second nature.

Visualising the same relationship is a one-liner with ggplot2.

```r title="Scatterplot weight vs mpg by cylinder"
# Week-22 style: scatterplot with grouping aesthetic
library(ggplot2)
ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "Fuel economy vs weight by cylinder count",
       x = "Weight (1000 lbs)", y = "MPG", colour = "Cylinders")
```

Every ggplot2 plot has three ingredients, a data frame, an `aes()` mapping, and one or more `geom_*` layers. Once you internalise that pattern, every new chart type is just swapping the geom.

[TIP]
**Learn the native pipe `|>` first.** The magrittr pipe `%>%` has extra tricks but the native pipe covers 95 percent of daily use and ships with base R, so your code runs anywhere without loading magrittr.

**Try it:** Use dplyr to count how many `mtcars` rows have `mpg > 25`. Assign the count to `ex_efficient_count`.

```r title="Exercise: Count efficient cars"
# Try it: count efficient cars
ex_efficient_count <- mtcars |>
  # your code here

ex_efficient_count
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count efficient cars solution"
ex_efficient_count <- mtcars |>
  filter(mpg > 25) |>
  nrow()
ex_efficient_count
#> [1] 6
```

**Explanation:** `filter()` keeps rows matching the condition; `nrow()` counts them. You could also use `summarise(n = n())` for the same answer.

</details>

## Months 7-9: Which statistics and modelling topics matter most?

Phase 3 is the most skipped phase in every other roadmap and the one that matters most for long-term pay-off. R was built by statisticians, and the thing that sets it apart from Python is not speed, it is a 20,000-package ecosystem of statistical methods that "just work".

Weeks 25-28 cover descriptive statistics, common distributions, and the classic hypothesis tests, t-tests, chi-squared, ANOVA basics. Weeks 29-32 introduce linear regression with `lm()`, diagnostic plots, and the `broom` package for tidying model output. Weeks 33-36 add generalised linear models, logistic regression for classification, and your third milestone project is a short regression report with a real research question.

The first regression model you will ever fit looks like this.

```r title="Multiple linear regression of mpg"
# Week-29 style: multiple linear regression
fit <- lm(mpg ~ wt + cyl, data = mtcars)
summary(fit)$coefficients
#>              Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) 39.686261  1.7149840 23.140893 3.043182e-20
#> wt          -3.190972  0.7569065 -4.215577 2.220200e-04
#> cyl         -1.507795  0.4146883 -3.635972 1.064282e-03
```

Each row is one predictor. The `Estimate` column says every extra 1000 lbs of weight costs about 3.2 mpg, holding cylinders constant. Both p-values are tiny, so the effects are not noise. This is the core loop of applied statistics in R, specify a formula, fit, interpret, check assumptions.

[KEY INSIGHT]
**Statistics fluency is the R superpower.** Any data scientist can write dplyr pipelines, but picking the right test, fitting the right model, and interpreting the coefficients correctly is what turns an analyst into a senior analyst. Do not skip Phase 3.

**Try it:** Fit a simple linear regression of `mpg` on `hp` alone using `mtcars`. Save the model to `ex_fit` and check the coefficient of `hp`.

```r title="Exercise: Simple regression of mpg on hp"
# Try it: fit a simple regression
ex_fit <- # your code here

coef(ex_fit)
#> Expected: (Intercept) ≈ 30.10, hp ≈ -0.068
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simple regression of mpg on hp solution"
ex_fit <- lm(mpg ~ hp, data = mtcars)
coef(ex_fit)
#> (Intercept)          hp
#> 30.09886054 -0.06822828
```

**Explanation:** A formula `y ~ x` in `lm()` fits `y = b0 + b1 * x`. The `hp` slope says every extra horsepower costs about 0.068 mpg on average.

</details>

## Months 10-12: How do you pick a specialisation?

Phase 4 is where the roadmap forks. By now you speak R fluently, so the question shifts from "what do I learn next" to "which problem do I want to solve?" Pick one track, go deep for eight weeks, and spend the final four weeks of the year on a capstone portfolio project that you can show employers or collaborators.

![Decision flow for picking a specialisation](screenshots/How-to-Learn-R-specialisation-choice.webp)

*Figure 2: A simple decision flow for picking a specialisation in months 10-12.*

The four most common tracks are machine learning with `tidymodels`, interactive apps with `shiny`, time-series forecasting with `fable`, and a domain specialisation like bioinformatics or quantitative finance. There is no "best" track, the best one is the one that matches a problem you already find interesting.

Here is a taste of the machine-learning track, a logistic model predicting whether a car has a manual transmission.

```r title="Logistic regression for transmission type"
# Week-38 style: binary classification with glm()
glm_fit <- glm(am ~ mpg + wt, data = mtcars, family = binomial)
round(coef(glm_fit), 3)
#> (Intercept)         mpg          wt
#>      25.899       0.367      -9.015
```

A positive `mpg` coefficient and a strongly negative `wt` coefficient match intuition, lighter, more efficient cars in the `mtcars` sample tend to be manuals. That is a two-line classifier you can extend with cross-validation and ROC curves as you go deeper.

**Try it:** Fit a logistic model of `am` on `mpg` alone and store it in `ex_glm`.

```r title="Exercise: Logistic regression with one predictor"
# Try it: logistic regression with one predictor
ex_glm <- # your code here

coef(ex_glm)
#> Expected: (Intercept) ≈ -6.60, mpg ≈ 0.307
```

<details>
<summary>Click to reveal solution</summary>

```r title="Logistic regression with one predictor solution"
ex_glm <- glm(am ~ mpg, data = mtcars, family = binomial)
coef(ex_glm)
#> (Intercept)         mpg
#>  -6.6035267   0.3070282
```

**Explanation:** `family = binomial` tells `glm()` to fit a logistic regression. A positive slope on `mpg` means more fuel-efficient cars in this sample are more likely to be manuals.

</details>

## How do you know you're ready to move to the next phase?

Each phase ends with a concrete self-assessment gate. If you can complete the gate test from memory, you are ready. If not, spend another week or two consolidating before moving on, weak foundations compound into a permanent feeling of "I know R but cannot actually write anything."

The four gates are:

1. **End of month 3**, read a CSV, filter rows with base R, compute a mean, write the result to a file.
2. **End of month 6**, take a raw dataset, clean it with dplyr and tidyr, and make three publication-quality ggplot2 charts with captions.
3. **End of month 9**, pose a research question, fit and diagnose a regression, and write a one-page interpretation.
4. **End of month 12**, ship a portfolio project in your chosen specialisation that someone else could reproduce from your code.

Here is what a month-6 gate test looks like as a single runnable snippet.

```r title="Month-6 gate test pipeline"
# Month-6 gate test: can you read and explain this in under a minute?
gate_result <- mtcars |>
  filter(mpg > 20) |>
  group_by(cyl) |>
  summarise(mean_hp = mean(hp), mean_wt = mean(wt), n = n()) |>
  arrange(desc(mean_hp))
gate_result
#> # A tibble: 2 × 4
#>     cyl mean_hp mean_wt     n
#>   <dbl>   <dbl>   <dbl> <int>
#> 1     6   110      2.77     3
#> 2     4    81.8    2.25    11
```

If you can look at that pipeline and narrate what it does without running it, you have passed the wrangling gate.

[WARNING]
**Do not skip gates because of impatience.** The most common failure mode in self-taught R is finishing all the tutorials but never internalising any of them. Gates force internalisation.

**Try it:** Take the `gate_result` pipeline above and modify it to filter on `mpg > 15` instead of 20, assigning the new result to `ex_gate`.

```r title="Exercise: Modify the gate pipeline"
# Try it: modify the gate pipeline
ex_gate <- mtcars |>
  # your code here

nrow(ex_gate)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Modify the gate pipeline solution"
ex_gate <- mtcars |>
  filter(mpg > 15) |>
  group_by(cyl) |>
  summarise(mean_hp = mean(hp), mean_wt = mean(wt), n = n()) |>
  arrange(desc(mean_hp))
nrow(ex_gate)
#> [1] 3
```

**Explanation:** Lowering the `mpg` threshold lets six- and eight-cylinder cars into the result, giving three rows instead of two.

</details>

## What common mistakes waste beginners' time?

Five mistakes explain almost every "I have been learning R for a year and still feel lost" email I get. Recognise them early and the 12 months above become genuinely productive instead of quietly frustrating.

1. **Tutorial hopping.** Starting six courses and finishing none. Pick one resource per phase and finish it before switching.
2. **Learning every package at once.** You do not need `data.table`, `sf`, `tidymodels`, and `shiny` in month one. One package per phase is plenty.
3. **Avoiding statistics.** Phase 3 feels harder than Phase 2, so people rush past it. Then they cannot interpret a p-value under pressure.
4. **Copying code without reading output.** If you paste a block and the console prints something you do not understand, stop and read it.
5. **Starting Shiny before dplyr feels easy.** Building interactive apps on top of wobbly data-wrangling skills is the fastest way to quit.

The cheapest bug to fix is the one about reading output. Look at this classic trap.

```r title="NA silently propagates without na.rm"
# A silent NA-handling bug that catches every beginner
scores <- c(85, 92, NA, 78, 95, 88)
mean(scores)
#> [1] NA
mean(scores, na.rm = TRUE)
#> [1] 87.6
```

The first call returns `NA`, not an error, which is exactly why it is dangerous. R tells you the result is undefined because one value is missing, and expects you to tell it what to do. Forgetting `na.rm = TRUE` silently zeroes out reports every day in production codebases.

[WARNING]
**NA handling silently wrecks analyses.** Always inspect your data for missing values before summarising, and make a conscious choice about how to handle them. `sum(is.na(x))` is your cheapest sanity check.

**Try it:** Compute the mean of `c(10, NA, 20, 30, NA, 40)` while ignoring the missing values. Save it to `ex_mean`.

```r title="Exercise: Fix the NA bug"
# Try it: fix the NA bug
ex_mean <- # your code here

ex_mean
#> Expected: 25
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fix the NA bug solution"
ex_mean <- mean(c(10, NA, 20, 30, NA, 40), na.rm = TRUE)
ex_mean
#> [1] 25
```

**Explanation:** `na.rm = TRUE` drops missing values before averaging. Without it, any `NA` in the vector propagates and you get `NA` back.

</details>

## Practice Exercises

These two capstones combine skills from across the roadmap. They are harder than the inline drills, expect to spend 15-30 minutes each, not 30 seconds.

### Exercise 1: Mini EDA pipeline on airquality

Using the built-in `airquality` dataset, write a single dplyr pipeline that filters out rows where `Ozone` is missing, groups by `Month`, and returns each month's mean `Ozone` and row count. Assign the result to `my_eda` and sort by descending mean `Ozone`.

```r title="Exercise: airquality EDA pipeline"
# Capstone 1: airquality EDA pipeline
# Hint: use filter(), group_by(), summarise(), arrange()

my_eda <- # your code here

my_eda
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality EDA pipeline solution"
my_eda <- airquality |>
  filter(!is.na(Ozone)) |>
  group_by(Month) |>
  summarise(mean_ozone = mean(Ozone), n = n()) |>
  arrange(desc(mean_ozone))
my_eda
#> # A tibble: 5 × 3
#>   Month mean_ozone     n
#>   <int>      <dbl> <int>
#> 1     8       60.0    26
#> 2     7       59.1    26
#> 3     9       31.4    29
#> 4     6       29.4     9
#> 5     5       23.6    26
```

**Explanation:** `!is.na(Ozone)` drops missing observations before grouping. July and August run hottest, which matches real ozone data, hot months generate more ground-level ozone.

</details>

### Exercise 2: Two-predictor regression report

Fit a linear model of `mpg` on `wt` and `hp` using `mtcars`. Save it to `my_model`, extract the coefficient of determination (R-squared) into `my_r2`, and round it to three decimals.

```r title="Exercise: Regression with two predictors"
# Capstone 2: regression with two predictors
# Hint: summary(model)$r.squared gives R-squared

my_model <- # your code here
my_r2 <- # your code here

my_r2
#> Expected: 0.827
```

<details>
<summary>Click to reveal solution</summary>

```r title="Regression with two predictors solution"
my_model <- lm(mpg ~ wt + hp, data = mtcars)
my_r2 <- round(summary(my_model)$r.squared, 3)
my_r2
#> [1] 0.827
```

**Explanation:** With both `wt` and `hp` in the model, R-squared is 0.827, the two predictors jointly explain about 83 percent of the variance in fuel economy, up from 0.753 for `wt` alone. That jump is why multiple regression is worth learning.

</details>

## Putting It All Together

Here is a month-9 worked example, the full loop you should be able to run on a new dataset without a tutorial by the end of Phase 3. Load, summarise, fit, interpret.

```r title="End-to-end iris species analysis"
# End-to-end: does petal length separate iris species?
data(iris)

iris |>
  group_by(Species) |>
  summarise(mean_petal = mean(Petal.Length),
            sd_petal = sd(Petal.Length))
#> # A tibble: 3 × 3
#>   Species    mean_petal sd_petal
#>   <fct>           <dbl>    <dbl>
#> 1 setosa           1.46    0.174
#> 2 versicolor       4.26    0.470
#> 3 virginica        5.55    0.552

setosa_fit <- glm(I(Species == "setosa") ~ Petal.Length,
                  data = iris, family = binomial)
round(coef(setosa_fit), 2)
#> (Intercept) Petal.Length
#>       62.49       -22.27
```

The grouped summary already hints at the answer, setosa's petals average 1.46 cm while virginica's average 5.55 cm, with almost no overlap in the standard deviations. The logistic model confirms it: a huge negative slope on `Petal.Length` means longer petals push the probability of "is setosa" towards zero very sharply. That end-to-end loop, summarise, model, interpret, is the core rhythm of applied R.

## Summary

![The 12-month roadmap across four phases](screenshots/How-to-Learn-R-phases-timeline.webp)

*Figure 1: The 12-month roadmap split into four three-month phases with milestone gates.*

| Phase | Months | Skills | Milestone project |
|---|---|---|---|
| 1. Foundations | 1-3 | Syntax, vectors, data frames, base-R exploration | Base-R analysis of a dataset you chose |
| 2. Wrangling & viz | 4-6 | dplyr, tidyr, ggplot2 | One-page EDA report |
| 3. Stats & modelling | 7-9 | Hypothesis tests, lm(), glm(), broom | Regression write-up with interpretation |
| 4. Specialisation | 10-12 | ML, Shiny, time series, or domain | Capstone portfolio project |

The three rules underneath the table are simple, one resource per phase, one milestone project per phase, and no skipping gates. Twelve months of that rhythm beats any crash course.

## References

1. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd edition. [Link](https://r4ds.hadley.nz/)
2. Wickham, H., *Advanced R*, 2nd edition. CRC Press. [Link](https://adv-r.hadley.nz/)
3. R Core Team, *An Introduction to R* (CRAN manual). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
4. Posit, R & tidyverse cheatsheets. [Link](https://posit.co/resources/cheatsheets/)
5. Tidyverse project, package documentation. [Link](https://www.tidyverse.org/)
6. James, Witten, Hastie & Tibshirani, *An Introduction to Statistical Learning*. [Link](https://www.statlearning.com/)
7. R-bloggers, aggregated R tutorials and articles. [Link](https://www.r-bloggers.com/)
8. Stack Overflow, the `[r]` tag. [Link](https://stackoverflow.com/questions/tagged/r)

## Continue Learning

- [R Data Types](R-Data-Types.html), the first thing to master in Phase 1.
- [dplyr filter and select](dplyr-filter-select.html), the opening lesson of Phase 2.
- [ggplot2 tutorial with R](ggplot2-Tutorial-With-R.html), the core grammar for the visualisation weeks.
