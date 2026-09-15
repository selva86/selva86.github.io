---
title: "Time Series Regression Lesson 5: Selecting predictors with cross-validation"
catalog_blurb: "Compare adjusted R-squared, AICc, BIC and cross-validated error to actually pick a model."
description: "Compare adjusted R-squared, AICc and BIC across candidate regression models, search with cross-validated error, and dodge the test-window leakage trap."
keywords: "model selection in R, adjusted R-squared, AICc, BIC, cross-validated error, best subset selection R, forward stepwise selection, TSLM predictor selection, p-value model selection, data leakage cross-validation"
post_type: "LESSON"
curriculum_id: "5.40.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-regression"
course_title: "Time Series Regression"
course_lesson: "5"
course_total: "6"
course_landing: "Time-Series-Regression-Course.html"
course_next: "Spurious-Regression-and-How-to-Avoid-It.html"
course_prev: "Useful-Predictors-Lags-Calendar-and-Holidays.html"
---

=== step === cover
## Selecting predictors with cross-validation

Today let's work out which of several candidate predictors actually belong in a regression, instead of throwing every number you have at the model and hoping for the best.

Fairwind Bike Rentals has 48 months of revenue on record, January 2022 through December 2025. Alongside revenue, the shop has tracked four other numbers every month: how much it spent on ads, the average temperature, how many days it rained, and how many new cafes opened downtown that month. That last one, new cafes, has no obvious link to bike rentals at all, and it is one of the four candidates this lesson has to judge.

::widget chart-plotter {"data":[{"x":1,"y":18834},{"x":2,"y":19942},{"x":3,"y":22523},{"x":4,"y":25668},{"x":5,"y":31139},{"x":6,"y":25941},{"x":7,"y":29807},{"x":8,"y":27546},{"x":9,"y":28803},{"x":10,"y":28275},{"x":11,"y":23609},{"x":12,"y":26001},{"x":13,"y":20137},{"x":14,"y":23238},{"x":15,"y":21495},{"x":16,"y":27798},{"x":17,"y":30890},{"x":18,"y":32916},{"x":19,"y":33040},{"x":20,"y":31278},{"x":21,"y":30440},{"x":22,"y":28879},{"x":23,"y":29161},{"x":24,"y":23729},{"x":25,"y":29137},{"x":26,"y":30989},{"x":27,"y":27013},{"x":28,"y":33007},{"x":29,"y":26366},{"x":30,"y":32005},{"x":31,"y":30878},{"x":32,"y":32001},{"x":33,"y":32478},{"x":34,"y":30816},{"x":35,"y":28389},{"x":36,"y":30430},{"x":37,"y":27051},{"x":38,"y":27136},{"x":39,"y":28804},{"x":40,"y":29436},{"x":41,"y":28753},{"x":42,"y":35424},{"x":43,"y":35753},{"x":44,"y":34829},{"x":45,"y":32526},{"x":46,"y":31160},{"x":47,"y":32069},{"x":48,"y":26687}],"geoms":["point","line"],"x":"month","y":"revenue"}

Revenue climbs overall but bounces around a lot from month to month, from a low of $18,834 in the first month to a high of $35,753 in month 43. Which of the four candidates actually explains that climb, and which ones just happen to be sitting nearby, is the question on the table.

=== step === concept
## Why R-squared always goes up when you add a predictor

R-squared measures how much of the up-and-down in revenue a regression explains, as a share between 0 and 1. An R-squared of 0.90 means the model accounts for 90% of the variation in revenue, leaving the rest in the residuals, the part the model still misses.

A regression like `TSLM()` fits by ordinary least squares: it picks coefficients that make the residual sum of squares, the total squared size of the misses, as small as possible. Adding one more predictor can never make that sum bigger. In the worst case the fitting procedure gives the new predictor a coefficient of exactly 0 and reproduces the old fit exactly. So R-squared, which is built directly from that residual sum of squares, can only hold steady or rise as you add predictors. It can never fall.

Watch that happen for real. Fit revenue against ad spend alone, then keep adding the other three candidates one at a time.

```r
# Build Fairwind's 48 months of revenue and four candidate predictors, then fit four nested regressions
library(tsibble)
library(fable)
library(fabletools)
library(dplyr)

set.seed(2026)
n <- 48
month <- yearmonth("2022 Jan") + 0:(n - 1)
idx <- 1:n

avg_temp <- 55 + 22 * sin(2 * pi * (idx - 4) / 12) + rnorm(n, 0, 4)
rain_days <- pmax(0, 10 - 0.15 * (avg_temp - 55) + rnorm(n, 0, 3))
ad_spend <- round(3500 + 25 * idx + rnorm(n, 0, 500))
new_cafes <- rpois(n, 2)
revenue <- round(9000 + 3.2 * ad_spend + 140 * avg_temp - 260 * rain_days + 45 * idx + rnorm(n, 0, 1200))

bikes <- tsibble(month = month, ad_spend = ad_spend, avg_temp = avg_temp,
                  rain_days = rain_days, new_cafes = new_cafes, revenue = revenue,
                  index = month)

fits <- bikes |> model(
  m1 = TSLM(revenue ~ ad_spend),
  m2 = TSLM(revenue ~ ad_spend + avg_temp),
  m3 = TSLM(revenue ~ ad_spend + avg_temp + rain_days),
  m4 = TSLM(revenue ~ ad_spend + avg_temp + rain_days + new_cafes)
)
glance(fits) |> select(.model, r_squared)
#> # A tibble: 4 x 2
#>   .model r_squared
#>   <chr>      <dbl>
#> 1 m1         0.454
#> 2 m2         0.905
#> 3 m3         0.917
#> 4 m4         0.921
```

Every added predictor pushes R-squared up: 0.454, then 0.905, then 0.917, then 0.921. The jump from `m1` to `m2` is large, because average temperature genuinely drives revenue. The jump from `m3` to `m4` is tiny, 0.917 to 0.921, because new cafes barely helps at all. But it still went up, not down, not even by a hair. R-squared rewards every predictor you add, whether that predictor is real or worthless, so it can never be the thing that tells you to leave one out.

=== step === concept
## Adjusted R-squared: the penalty for an extra predictor

Adjusted R-squared fixes that by charging rent for every predictor in the model. The formula is `adjusted R-squared = 1 - (1 - R-squared) * (n - 1) / (n - p - 1)`, where `n` is the number of rows (48 months) and `p` is the number of predictors in that model, not counting the intercept. As `p` grows, the fraction `(n - 1) / (n - p - 1)` grows too, stretching the `(1 - R-squared)` gap wider before it gets subtracted from 1. A predictor has to earn back that stretch in R-squared, or adjusted R-squared falls even while plain R-squared rises.

See it happen with new cafes. Fit revenue against ad spend alone, then against ad spend plus new cafes, and compare both R-squared values.

```r
# Compare R-squared and adjusted R-squared for ad_spend alone versus ad_spend plus new_cafes
fit_pair <- bikes |> model(
  base = TSLM(revenue ~ ad_spend),
  plus_cafes = TSLM(revenue ~ ad_spend + new_cafes)
)
glance(fit_pair) |> select(.model, r_squared, adj_r_squared)
#> # A tibble: 2 x 3
#>   .model     r_squared adj_r_squared
#>   <chr>          <dbl>         <dbl>
#> 1 base           0.454         0.442
#> 2 plus_cafes     0.463         0.439
```

Now compute adjusted R-squared by hand from that same formula, and check it lines up with `glance()`'s own column.

```r
# Compute adjusted R-squared by hand from R-squared, n and p, and check it against glance()'s own column
g_pair <- glance(fit_pair) |> select(.model, r_squared, adj_r_squared)

p_base <- 1   # ad_spend alone
p_cafes <- 2  # ad_spend + new_cafes

r2_base <- g_pair$r_squared[g_pair$.model == "base"]
r2_cafes <- g_pair$r_squared[g_pair$.model == "plus_cafes"]

adj_r2_base_hand <- 1 - (1 - r2_base) * (n - 1) / (n - p_base - 1)
adj_r2_cafes_hand <- 1 - (1 - r2_cafes) * (n - 1) / (n - p_cafes - 1)

round(c(hand_base = adj_r2_base_hand, hand_plus_cafes = adj_r2_cafes_hand,
        glance_base = g_pair$adj_r_squared[g_pair$.model == "base"],
        glance_plus_cafes = g_pair$adj_r_squared[g_pair$.model == "plus_cafes"]), 4)
#>         hand_base   hand_plus_cafes       glance_base glance_plus_cafes 
#>            0.4425            0.4394            0.4425            0.4394
```

The hand-built numbers match `glance()`'s own column exactly, so the formula really is what `adj_r_squared` computes. And notice what happened: R-squared rose from 0.454 to 0.463 when new cafes joined the model, but adjusted R-squared fell from 0.442 to 0.439. New cafes did not earn back the rent it cost to add it.

=== step === concept
## AICc and BIC: trading fit against complexity

AIC and BIC are two more ways to charge that same kind of rent, built from the model's log-likelihood, a number that scores how well the fitted model explains the data actually seen, with higher meaning a better fit. Both AIC and BIC subtract a penalty for every extra predictor from that log-likelihood score, so a smaller AIC or BIC is better, the reverse of R-squared. BIC's penalty grows with the sample size, so it punishes extra predictors harder than AIC does once you have more than a handful of rows.

AICc is AIC with a small-sample correction added on top. That correction matters whenever the sample size is not much larger than the number of parameters being estimated, which is exactly Fairwind's situation: 48 months and up to 5 parameters (an intercept plus up to 4 predictors). With `n` that close to `p`, plain AIC understates its own penalty, so AICc, not AIC, is the number to read here.

Pull AICc and BIC for the same two models just fit.

```r
# Read AICc and BIC for the same two models
glance(fit_pair) |> select(.model, AICc, BIC)
#> # A tibble: 2 x 3
#>   .model      AICc   BIC
#>   <chr>      <dbl> <dbl>
#> 1 base        773.  778.
#> 2 plus_cafes  775.  781.
```

Both criteria agree with adjusted R-squared here: AICc worsens from 773 to 775, and BIC worsens from 778 to 781, when new cafes joins the model. Three separate ways of charging rent for an extra predictor, and all three say the same thing about this one.

=== step === widget
## Comparing all four criteria side by side

One table can hold all four nested models and all four criteria at once, so put them side by side.

::widget styled-table {"cols":["predictors","R-squared","adjusted R-squared","AICc","BIC"],"rows":[["ad_spend",0.454,0.442,773.0,778.1],["ad_spend + avg_temp",0.905,0.901,691.3,697.9],["ad_spend + avg_temp + rain_days",0.917,0.911,687.7,695.7],["ad_spend + avg_temp + rain_days + new_cafes",0.921,0.914,687.6,696.8]],"title":"Four nested models, compared on all four criteria","note":"R-squared rises at every step, no exception. Watch the last row: AICc still edges down, 687.7 to 687.6, favoring the full model, but BIC already turns the other way, 695.7 to 696.8, favoring the model without new_cafes."}

R-squared keeps climbing right to the end, exactly as it must. Adjusted R-squared, AICc and BIC all agree that the second and third models are worth far more than the first. But look closely at the last row, going from three predictors to four: AICc still edges down, favoring the full model, while BIC turns the other way and starts favoring the smaller one. The criteria do not have to agree, and here they already do not.

=== step === quiz
## Quick check: what a smaller AICc or BIC means

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It always means the model's fit is closer to the data, the same thing a higher R-squared shows. ::no
- It means the model strikes a better balance between how well it fits and how many predictors it used to reach that fit. ::ok Right. AICc and BIC both subtract a penalty that grows with the predictor count, so a smaller value says the fit was worth what it cost in extra predictors, not just that the raw fit got closer.
- It means AICc and BIC always agree with adjusted R-squared about which model is best. ::no
- It means the model has a higher R-squared than the alternative. ::no None of these follow. A smaller AICc or BIC says the trade-off between fit and predictor count came out ahead, not that the raw fit is closer (that is what R-squared alone measures) and not that every criterion agrees. The table above already shows AICc nudging toward the full model on the last step while BIC turns the other way. A model can even carry a smaller AICc and a lower R-squared than a bigger, more overfit alternative.

=== step === concept
## Why a coefficient's p-value is the wrong tool for selection

A coefficient's p-value tests one narrow question: could this one coefficient, in this one fitted model, plausibly be zero? It says nothing about whether dropping or keeping that predictor improves the model's forecasts, and nothing about any of the other models you might have fit instead.

Look at the full model's own coefficient table.

```r
# Fit the full model and read each coefficient's p-value
fit_full <- bikes |> model(TSLM(revenue ~ ad_spend + avg_temp + rain_days + new_cafes))
report(fit_full)
#> Series: revenue 
#> Model: TSLM 
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -2656.85  -772.49   -19.44   504.71  2620.57 
#> 
#> Coefficients:
#>              Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 6282.5742  1571.0653   3.999 0.000246 ***
#> ad_spend       3.8124     0.2536  15.031  < 2e-16 ***
#> avg_temp     153.5352    13.4067  11.452  1.2e-14 ***
#> rain_days   -137.1662    54.8587  -2.500 0.016299 *  
#> new_cafes   -249.1399   156.9476  -1.587 0.119747    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 1178 on 43 degrees of freedom
#> Multiple R-squared: 0.9213,	Adjusted R-squared: 0.9139
#> F-statistic: 125.8 on 4 and 43 DF, p-value: < 2.22e-16
```

`rain_days` comes back with p = 0.0163, under the usual 0.05 bar. `new_cafes` comes back with p = 0.1197, well above it. So far that looks like a sensible way to tell a real predictor from a weak one. The trouble shows up once you go hunting for significance across many candidates at once.

```r
# Regress revenue against 20 columns of pure random noise, one at a time, and count how many cross p < 0.05
set.seed(99)
noise <- matrix(rnorm(n * 20), nrow = n, ncol = 20)

noise_pvals <- sapply(1:20, function(i) {
  fit_i <- lm(revenue ~ noise[, i])
  summary(fit_i)$coefficients[2, 4]
})

round(noise_pvals, 4)
#>  [1] 0.8137 0.5863 0.4155 0.4316 0.0078 0.5932 0.6706 0.2893 0.5100 0.9514
#> [11] 0.5279 0.2155 0.9797 0.4664 0.5607 0.1259 0.8428 0.9864 0.7699 0.3286
sum(noise_pvals < 0.05)
#> [1] 1
```

None of those 20 columns has anything to do with revenue; they are `rnorm()` noise, nothing more. Yet one of them, the fifth, comes back at p = 0.0078, comfortably under 0.05. That is not a bug in the noise. A 5% significance threshold is built to let exactly 5% of pure-noise predictors through by chance, and 1 out of 20 is right on that rate. Test enough candidate predictors this way and some of them will look significant purely by luck, which is exactly why a p-value cannot be trusted to pick a model on its own.

=== step === widget
## Cross-validated error: the out-of-sample score

Cross-validation asks a more direct question than any of the criteria so far: not "does this fit look good on the data it was trained on", but "how well would this model score on data it never saw". k-fold cross-validation is the standard way to answer that. It splits the data into `k` equal groups, called folds. It holds out one fold, fits the model on the rest, scores it on the held-out fold, then rotates until every fold has been held out exactly once. Averaging those `k` scores gives one number: the cross-validated error.

Step through a generic version below. Its 20 rows are a stand-in to show the mechanics, not Fairwind's own 48 months.

::widget cv-folds {"k":5}

For an ordinary linear regression like `TSLM()`, `glance()` already computes this same idea directly, using a shortcut formula for the case where every fold holds out just one row, called leave-one-out cross-validation. It gets the honest leave-one-out score without literally refitting the model 48 times.

```r
# Read the full model's cross-validated error from glance()
glance(fit_full) |> select(CV)
#>        CV
#> 1 1578904
```

The full model's cross-validated error is 1,578,904. On its own that number means little; it only becomes useful once you compare it against the CV of other candidate models.

=== step === concept
## Best-subset selection: trying every combination

With 4 candidate predictors, there are `2^4 - 1 = 15` non-empty subsets to try: every single predictor alone, every pair, every triple, and the full set of four. Best-subset selection fits every one of those 15 models and ranks them by whichever criterion you trust.

```r
# Build all 15 non-empty subsets of the four candidate predictors
predictors <- c("ad_spend", "avg_temp", "rain_days", "new_cafes")
all_subsets <- unlist(lapply(1:4, function(k) combn(predictors, k, simplify = FALSE)), recursive = FALSE)
length(all_subsets)
#> [1] 15
```

Fit every one of those 15 subsets and rank them by AICc.

```r
# Fit each of the 15 subsets and rank them by AICc
subset_results <- lapply(all_subsets, function(v) {
  fit <- bikes |> model(m = TSLM(reformulate(v, response = "revenue")))
  g <- glance(fit)
  data.frame(predictors = paste(v, collapse = " + "),
             adj_r_squared = round(g$adj_r_squared, 4), AICc = round(g$AICc, 1),
             BIC = round(g$BIC, 1), CV = round(g$CV))
})
subset_table <- do.call(rbind, subset_results)
rownames(subset_table) <- NULL

by_aicc <- subset_table[order(subset_table$AICc), ]
rownames(by_aicc) <- NULL
by_aicc
#>                                     predictors adj_r_squared  AICc   BIC
#> 1  ad_spend + avg_temp + rain_days + new_cafes        0.9139 687.6 696.8
#> 2              ad_spend + avg_temp + rain_days        0.9110 687.7 695.7
#> 3                          ad_spend + avg_temp        0.9012 691.3 697.9
#> 4              ad_spend + avg_temp + new_cafes        0.9037 691.5 699.4
#> 5                         ad_spend + rain_days        0.6586 750.8 757.4
#> 6             ad_spend + rain_days + new_cafes        0.6594 752.1 760.1
#> 7                                     avg_temp        0.4706 770.6 775.6
#> 8                         avg_temp + rain_days        0.4809 770.9 777.5
#> 9                         avg_temp + new_cafes        0.4641 772.5 779.0
#> 10                                    ad_spend        0.4425 773.0 778.1
#> 11            avg_temp + rain_days + new_cafes        0.4740 773.0 780.9
#> 12                        ad_spend + new_cafes        0.4394 774.6 781.2
#> 13                                   rain_days        0.2478 787.4 792.5
#> 14                       rain_days + new_cafes        0.2333 789.7 796.2
#> 15                                   new_cafes       -0.0194 802.0 807.1
#>          CV
#> 1   1578904
#> 2   1614427
#> 3   1711759
#> 4   1680556
#> 5   5952992
#> 6   6059479
#> 7   8946430
#> 8   9133643
#> 9   9364220
#> 10  9493946
#> 11  9553457
#> 12  9776042
#> 13 12712368
#> 14 13227243
#> 15 17144012
```

Ranked by AICc, adjusted R-squared or cross-validated error, the full model wins: it has the smallest AICc (687.6), the highest adjusted R-squared (0.9139) and the smallest CV (1,578,904) of all 15 subsets. The worst subset, new cafes on its own, has a negative adjusted R-squared, -0.0194, meaning it explains revenue worse than just using the average revenue as the prediction for every month.

Now sort that same table by BIC instead.

```r
# Same 15 subsets, now ranked by BIC instead
by_bic <- subset_table[order(subset_table$BIC), c("predictors", "BIC", "AICc")]
rownames(by_bic) <- NULL
head(by_bic, 4)
#>                                     predictors   BIC  AICc
#> 1             ad_spend + avg_temp + rain_days 695.7 687.7
#> 2 ad_spend + avg_temp + rain_days + new_cafes 696.8 687.6
#> 3                         ad_spend + avg_temp 697.9 691.3
#> 4             ad_spend + avg_temp + new_cafes 699.4 691.5
```

BIC ranks the three-predictor model first, without new cafes, even though AICc still ranks the full model a hair ahead. That is not a contradiction. Adjusted R-squared, AICc and cross-validated error all say new cafes is worth keeping, barely. BIC's heavier penalty for extra predictors says it is not. Both readings are correct answers to two slightly different questions: how much does one more predictor have to earn to be worth its cost, judged by two different penalties.

=== step === concept
## Stepwise selection: a shortcut for more predictors

Best-subset search fits every possible combination, which gets expensive fast: 4 predictors is 15 models, but 20 predictors would be `2^20 - 1`, over a million. Forward stepwise search is a cheaper alternative. It starts with no predictors, and at each round adds whichever remaining candidate improves AICc the most. It keeps going until no remaining candidate helps.

```r
# Run forward stepwise search: add whichever candidate improves AICc most, one round at a time
chosen <- character(0)
remaining <- predictors
round_num <- 1
repeat {
  candidate_aicc <- sapply(remaining, function(p) {
    v <- c(chosen, p)
    fit <- bikes |> model(m = TSLM(reformulate(v, response = "revenue")))
    glance(fit)$AICc
  })
  cat("Round", round_num, "candidates:\n")
  print(round(candidate_aicc, 1))
  best_p <- names(which.min(candidate_aicc))
  cat("-> adds", best_p, "\n\n")
  chosen <- c(chosen, best_p)
  remaining <- setdiff(remaining, best_p)
  round_num <- round_num + 1
  if (length(remaining) == 0) break
}
#> Round 1 candidates:
#>  ad_spend  avg_temp rain_days new_cafes 
#>     773.0     770.6     787.4     802.0 
#> -> adds avg_temp 
#> 
#> Round 2 candidates:
#>  ad_spend rain_days new_cafes 
#>     691.3     770.9     772.5 
#> -> adds ad_spend 
#> 
#> Round 3 candidates:
#> rain_days new_cafes 
#>     687.7     691.5 
#> -> adds rain_days 
#> 
#> Round 4 candidates:
#> new_cafes 
#>     687.6 
#> -> adds new_cafes
```

Round 1 tries each predictor alone and picks average temperature, the smallest AICc at 770.6. Round 2 tries adding each remaining predictor to average temperature, and picks ad spend. Round 3 adds rain days. Round 4 has only new cafes left, so it goes in too. Four rounds, ten model fits total, and the search lands on the same full model best-subset search found by trying all 15. With 20 candidates, forward stepwise would need only about 210 fits to reach an answer, against well over a million for best-subset. The saving is real, but it comes at a cost: a greedy search locks in each choice before seeing the rest, so it can miss the true best subset when two predictors only help in combination.

=== step === concept
## The leakage trap of selecting on the test window

Every comparison so far picked a model using all 48 months, then judged it using the very same 48 months, in-sample. A more honest test holds some months back entirely, chooses a model without ever looking at them, and only then checks the score. Split Fairwind's 48 months into the first 36 for training and the last 12 for testing.

```r
# Split the 48 months into 36 training months and 12 held-out test months
train <- bikes |> filter(month <= yearmonth("2024 Dec"))
test <- bikes |> filter(month > yearmonth("2024 Dec"))
nrow(train)
#> [1] 36
nrow(test)
#> [1] 12
```

Search all 15 subsets using only the 36 training months' own AICc, pick the winner, then forecast it onto the 12 test months it never saw.

```r
# Search all 15 subsets on the 36 training months only, pick the best by AICc, then score it on the 12 held-out months
train_results <- lapply(all_subsets, function(v) {
  fit <- train |> model(m = TSLM(reformulate(v, response = "revenue")))
  data.frame(predictors = paste(v, collapse = " + "), AICc = round(glance(fit)$AICc, 1))
})
train_table <- do.call(rbind, train_results)
rownames(train_table) <- NULL
train_table <- train_table[order(train_table$AICc), ]
rownames(train_table) <- NULL
head(train_table, 3)
#>                                     predictors  AICc
#> 1 ad_spend + avg_temp + rain_days + new_cafes 517.1
#> 2             ad_spend + avg_temp + rain_days 519.8
#> 3                         ad_spend + avg_temp 525.2

best_predictors <- strsplit(train_table$predictors[1], " \\+ ")[[1]]
fit_chosen <- train |> model(m = TSLM(reformulate(best_predictors, response = "revenue")))
fc_chosen <- fit_chosen |> forecast(new_data = test)
rmse_honest <- sqrt(mean((fc_chosen$.mean - test$revenue)^2))
round(rmse_honest, 1)
#> [1] 1504.8
```

The training-only search picks the full model again, and scoring it on the 12 months it never touched gives an RMSE, root-mean-square error, of 1,504.8. That is the honest number: those 12 months had no say in which model got chosen.

Now do it the leaky way. Search all 15 subsets directly against those same 12 test months, picking whichever scores lowest.

```r
# Search all 15 subsets directly against the 12 test months, letting them pick the model too
leak_results <- lapply(all_subsets, function(v) {
  fit <- train |> model(m = TSLM(reformulate(v, response = "revenue")))
  fc <- fit |> forecast(new_data = test)
  data.frame(predictors = paste(v, collapse = " + "),
             rmse = round(sqrt(mean((fc$.mean - test$revenue)^2)), 1))
})
leak_table <- do.call(rbind, leak_results)
rownames(leak_table) <- NULL
leak_table <- leak_table[order(leak_table$rmse), ]
rownames(leak_table) <- NULL
head(leak_table, 3)
#>                        predictors    rmse
#> 1 ad_spend + avg_temp + new_cafes 1066.9
#> 2             ad_spend + avg_temp 1067.0
#> 3 ad_spend + avg_temp + rain_days 1309.8
```

That search reports 1,066.9 RMSE, well under the honest 1,504.8. Nothing about Fairwind's data changed between the two searches. What changed is that the second search let the same 12 test months choose the model as well as grade it, trying all 15 subsets against them and keeping whichever happened to fit those particular 12 months best. This mistake has a name: leakage, information from the data meant only to grade the model leaking into the process that chose it. The fix is the one the honest search already used: pick the model using only the training months, and touch the held-out months exactly once, to grade the one model you already chose.

=== step === quiz
## Quick check: why searching the test months first inflates the score

An analyst fits all 15 subsets on the training months, scores every one of them against the same 12 held-out months, and reports the lowest score as the model's expected accuracy.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The problem is cross-validation itself: it always underestimates how well a model will do on new data. ::no
- Those 12 months chose the model as well as graded it, so the reported score is optimistic, not honest. ::ok Exactly. Trying all 15 subsets against the same 12 months and keeping the best score is a search for whichever model happens to fit those particular months, not a fair test of any one model. The fix is to pick the model on the training months alone and touch the held-out months only once, to grade the one model already chosen.
- The problem is using best-subset search instead of forward stepwise search; stepwise would have avoided this. ::no
- The problem is using RMSE instead of a different accuracy metric. ::no None of these are the real issue. Cross-validation and best-subset search are not at fault, and swapping RMSE for another metric would not fix anything, since the same 15-way search over the same 12 months would still cherry-pick whichever model fits them best. The actual mistake is letting the held-out months influence which model got chosen, not just how it got scored.

=== step === tryit
## Your turn: score one more candidate model

`bikes` is already built from the earlier steps. Fit `TSLM(revenue ~ ad_spend + rain_days)`, a subset not shown in the ranked table above, and pull its AICc from `glance()`.

```r
# bikes is already built. Fit TSLM(revenue ~ ad_spend + rain_days) inside model(),
# then pull AICc from glance() on that fit.
# One line to fit, one line to read AICc. Press Check when you have it.
```
::check {"regex":"(?=[\\s\\S]*ad_spend)(?=[\\s\\S]*rain_days)(?=[\\s\\S]*AICc)","gate":true,"difficulty":"intermediate","ok":"Right: ad_spend + rain_days lands at an AICc of about 750.8, far behind the full model's 687.6. Dropping avg_temp costs this model far more than ad_spend and rain_days together can make up.","no":"Fit TSLM(revenue ~ ad_spend + rain_days) inside model(), then pull AICc with glance(fit)$AICc or glance(fit) |> select(AICc)."}
::solution
```r
# Fit ad_spend + rain_days and read its AICc
fit_try <- bikes |> model(TSLM(revenue ~ ad_spend + rain_days))
round(glance(fit_try)$AICc, 1)
#> [1] 750.8
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 7.7, Selecting predictors](https://otexts.com/fpp3/selecting-predictors.html) - Hyndman and Athanasopoulos (3rd ed.), on adjusted R-squared, AIC, AICc, BIC and cross-validation for choosing regression predictors.
- James, Witten, Hastie and Tibshirani, An Introduction to Statistical Learning, the chapter on subset selection methods, on best-subset and stepwise search.
- [fabletools package reference documentation for glance.mdl_df()](https://fabletools.tidyverts.org/reference/glance.mdl_df.html), the AIC, AICc, BIC and CV columns returned for a fitted TSLM.
- [forecast package reference documentation for CV()](https://pkg.robjhyndman.com/forecast/reference/CV.html), the PRESS-based leave-one-out cross-validation statistic behind the CV column.

=== step === complete
## What you can do now

You can now read and compare adjusted R-squared, AICc and BIC across candidate models, and you know why they can rank the same models differently: each one charges a different rent for an extra predictor, BIC's the steepest. You have seen why plain R-squared always favors the bigger model and why a coefficient's p-value only ever answers a question about one coefficient in one fitted model, never about which model forecasts best.

You can run a best-subset search over every combination of a small set of candidates, or a forward stepwise search when there are too many candidates for that to be practical, using cross-validated error alongside the other criteria. And you know the leakage trap that catches people who already know all of this: choosing a model with the same data used to grade it, and the fix, a genuine holdout the whole search never sees until the one chosen model is graded on it, once.

The next lesson turns to a different danger: two series that both trend upward can look strongly related in a regression even when neither one causes the other.
