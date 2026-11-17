---
title: "Confidence Intervals and P-Values Lesson 5: Standard errors you can trust"
catalog_blurb: "When the default standard error is wrong, and what actually fixes it."
description: "Heteroskedasticity and clustered data both break the ordinary standard error, but in different ways. Simulate both and measure which fix actually works."
keywords: "standard error, heteroskedasticity, robust standard error, cluster-robust standard error, clustered data, intraclass correlation, design effect, White HC estimator, regression, R"
post_type: "LESSON"
curriculum_id: "4.30.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-inference"
course_title: "Confidence Intervals and P-Values"
course_lesson: "5"
course_total: "6"
course_landing: "Confidence-Intervals-and-P-Values-Course.html"
course_next: "Reporting-Uncertainty-Without-Overclaiming.html"
course_prev: "Checking-That-Your-Intervals-Actually-Cover.html"
---

=== step === cover
## Standard errors you can trust

Today let's look at a standard error that can quietly fall far short of the truth, and learn when to trust it and when not to.

Picture a regional retail chain that rolls out a new price-tag display to half of its stores and tracks the daily transaction value, in dollars, at every one of them. Fit the usual regression to measure the display's effect, and R hands back a standard error of 1.61. That number is supposed to say how much the estimate would bounce around if the chain ran this exact study again.

So run it again. Not once, but 2,000 times over, each time with a fresh batch of stores and days. The estimate actually swings by 9.83, about six times wider than what the formula reported.

The formula was not making an arithmetic mistake. It was built on a condition this data does not meet: that every row is an independent, equally noisy observation.

Two very ordinary situations break that condition, each in its own way. One is when the scatter of the noise changes with the size of the thing you're measuring. The other is when individual rows are not actually independent, because they share something in common, like several days from the same store.

Here is that gap, the formula's number against the real one.

::widget chart-plotter {"data":[{"x":"what the formula reports, on average","y":1.61}, {"x":"what repeating the study 2000 times shows","y":9.83}],"x":"comparison", "y":"standard error","geoms":["bar"]}

Six times wider is not a rounding error. It is the gap this lesson exists to close.

=== step === concept
## What the standard error formula actually assumes
::prose-only the idea is two named assumptions behind a formula; the two cases that break them get their own worked visuals in the next two steps

Start with what a standard error even measures, since everything else here leans on it.

Fit a regression once, on one sample of data, and you get one estimate: a slope, a treatment effect, whatever number you're after. Run the exact same study again, on a fresh sample collected the same way, and you get a slightly different estimate. Do that over and over, and those estimates spread out into their own distribution. The standard error is just the spread of that distribution: how far a fresh estimate from a fresh sample would typically land from the last one.

You almost never get to actually repeat a study thousands of times. So the ordinary least squares (OLS) formula for the standard error is a shortcut: it looks at the one sample you collected and works out, by formula, what that spread should be. But a formula is only as good as the conditions it was built on, and the ordinary formula leans on two of them.

The first is that every row's noise has the same spread. A transaction at a tiny store and a transaction at a huge one are assumed to wander away from their true average by about the same number of dollars. Statisticians call this **homoskedasticity**: equal scatter, no matter the input.

The second is that the rows are independent. What happened at row 1 is assumed to carry no information about row 2. Each row is a fresh, unrelated piece of evidence.

Break either assumption and the formula keeps producing a number. It just stops being the right number.

Here is the same retail chain, caught breaking each assumption in turn. First, the chain regresses a store's size against its daily transaction value, and the scatter of the noise grows with the store's size: that breaks equal spread. Then the chain rolls out a price-tag display to some of its stores and tracks results for several days at each one: days from the same store share something in common, and that breaks independence.

=== step === concept
## Case 1: when the spread of the mistakes changes with x

Here is the chain's first regression. Every one of 300 stores reports its size, in thousand square feet, and its average daily transaction value, in dollars. Build it and fit the usual regression of transaction value on store size.

```r
# Build 300 stores and fit transaction value against store size
set.seed(1)
store_size <- runif(300, min = 2, max = 15)
noise_sd <- 15 + 2.5 * store_size

set.seed(11)
transaction_value <- 150 + 18 * store_size + rnorm(300, mean = 0, sd = noise_sd)
size_fit <- lm(transaction_value ~ store_size)
round(coef(summary(size_fit))["store_size", c("Estimate", "Std. Error")], 3)
#>   Estimate Std. Error 
#>     18.374      0.576
```

R reports a slope of 18.374: each extra thousand square feet of store size is associated with about $18.37 more in daily transaction value. The standard error on that slope, from the ordinary formula, is 0.576.

Before trusting that 0.576, look at what the regression left behind: the residuals, the gap between each store's actual transaction value and what the line predicts for its size.

```r
# Plot residuals against store size: does the leftover noise fan out?
plot(store_size, residuals(size_fit),
     xlab = "store size (thousand sqft)", ylab = "residual ($)",
     main = "Residuals fan out as stores get bigger")
abline(h = 0, lty = 2)
```

The residuals fan out as store size grows. Small stores cluster tightly around zero. Large stores scatter much further in both directions.

Nothing in the regression's own formula accounts for that growing spread. The only place it shows up is in the residuals, and this is not an accident of one draw: this data was built with a noise standard deviation that grows with store size, from about $20 at the smallest stores to about $52.50 at the largest.

That widening fan is **heteroskedasticity**: the noise's spread is not constant, it changes with the size of the input. It is exactly the equal-scatter assumption breaking in the data.

The ordinary formula assumes one shared noise spread for every row. When the real spread is not shared like that, the formula's number stops being trustworthy. The fix is a standard error that does not assume a shared spread at all. It is often called a **robust standard error**, or the **White** or **HC** (heteroskedasticity-consistent) standard error, after the statistician who proposed it.

The idea: instead of pooling every row's residual into one shared variance, weight each row by its own squared residual. A row that happened to land far from the line gets to count that distance on its own account, rather than being averaged in with every other row.

```r
# Build the robust standard error by hand: weight each row by its own
# squared residual instead of one shared variance
hc0_se <- function(fit) {
  X <- model.matrix(fit)
  e <- residuals(fit)
  bread <- solve(t(X) %*% X)
  meat <- t(X) %*% diag(e^2) %*% X
  sqrt(diag(bread %*% meat %*% bread))
}
round(unname(hc0_se(size_fit)["store_size"]), 3)
#> [1] 0.594
```

For this one fit, the robust standard error comes out to 0.594, close to the ordinary 0.576, but built without the equal-spread assumption.

One fit does not tell you which number to trust. The only way to know is to repeat the whole study, build a fresh 300 stores with fresh noise each time, and watch how far the slope estimate actually wanders.

```r
# Repeat the study 2000 times and compare the slope's real spread
# against what each formula claims, on average
set.seed(11)
reps <- replicate(2000, {
  y <- 150 + 18 * store_size + rnorm(300, mean = 0, sd = noise_sd)
  fit <- lm(y ~ store_size)
  c(slope = unname(coef(fit)["store_size"]),
    ordinary_se = unname(coef(summary(fit))["store_size", "Std. Error"]),
    robust_se = unname(hc0_se(fit)["store_size"]))
})
true_slope_se <- sd(reps["slope", ])
round(true_slope_se, 3)
#> [1] 0.648
round(mean(reps["ordinary_se", ]), 3)
#> [1] 0.599
round(mean(reps["robust_se", ]), 3)
#> [1] 0.625
round(100 * (1 - mean(reps["ordinary_se", ]) / true_slope_se), 0)
#> [1] 8
round(100 * (1 - mean(reps["robust_se", ]) / true_slope_se), 0)
#> [1] 4
```

Over 2,000 repeats, the slope's real standard deviation is 0.648. That is the true answer, the number a standard error is supposed to estimate. The ordinary formula averages 0.599 across those same repeats, 8% too small. The hand-rolled robust standard error averages 0.625, within 4% of the truth.

So, on this heteroskedastic data, the robust standard error is not a cosmetic fix. It closes most of the gap the ordinary formula leaves open.

=== step === quiz
## Quick check: what a robust standard error actually repairs

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- It corrects the standard error for unequal variance across rows, without changing the slope estimate itself. ::ok Right. It reweights each row by its own squared residual, so unequal spread stops fooling the standard error. The slope stays 18.374 either way; only the measure of uncertainty around it changes.
- It also corrects for rows that are correlated with each other, such as repeated visits to the same store. ::no
- It makes the slope estimate itself more accurate. ::no A standard error never touches the estimate, only how much that estimate would bounce around if the study repeated. And a robust (HC) standard error still assumes every row is independent of every other row, so it was built to fix unequal variance, not correlated rows, which is the different problem that a cluster-robust standard error exists to fix.

=== step === concept
## Case 2: when rows are not actually independent

Store size broke the first assumption. Here is a different study from the same chain that breaks the second.

The chain picks 40 stores and installs a new price-tag display in half of them, chosen at random. For 10 days at every store, it records that day's transaction value. That is 400 rows in total: 40 stores times 10 days each.

```r
# Build a 40-store price-tag rollout: half get the display, 10 days each
set.seed(101)
store40 <- rep(1:40, each = 10)
arm40 <- rep(0:1, length.out = 40)
treat40 <- arm40[store40]
rollout_value40 <- 220 + 15 * treat40 + rnorm(40, 0, 12)[store40] + rnorm(400, 0, 12)
rollout_fit40 <- lm(rollout_value40 ~ treat40)
round(unname(coef(rollout_fit40)["treat40"]), 2)
#> [1] 11.17
round(unname(coef(summary(rollout_fit40))["treat40", "Std. Error"]), 2)
#> [1] 1.53
```

The display's estimated effect on daily transaction value comes out to $11.17, with an ordinary standard error of 1.53. Run the same hand-rolled robust standard error on this fit.

```r
# Reuse the robust standard error function, hc0_se(), on this new fit
round(unname(hc0_se(rollout_fit40)["treat40"]), 2)
#> [1] 1.52
```

The robust standard error comes out to 1.52, almost exactly the ordinary 1.53. Something is wrong, because this data does break an assumption, just not the one the robust standard error was built to catch.

The problem here is not that noise varies with store size. It is that every day at the same store shares something that day's regression treats as 10 separate, independent pieces of evidence. If a store happens to run a slightly chatty cashier, or sits on a slightly busier street corner that month, that quirk shows up in all 10 of its days, not just one. The days are not independent, they are **clustered** by store.

How clustered? Measure it with the **intraclass correlation (ICC)**: the share of the total variance that sits between stores rather than between days inside the same store. In this study, both the store-to-store variance and the day-to-day variance within a store were built with a standard deviation of $12, so each contributes a variance of 144.

The ICC is 144 divided by the total 288, which is 0.5. Half of the total spread in this data comes from which store you are looking at, not which day.

A robust standard error still assumes independent rows. It reweights each row by its own residual, but it has no mechanism that accounts for which store a row came from, so a cluster of 10 correlated days still gets treated as 10 independent pieces of evidence. What is needed instead is a **cluster-robust standard error**: instead of squaring each row's residual on its own, sum the residuals inside each store first, and only then square that sum. A store whose 10 days all lean the same direction contributes one large squared number, not 10 small ones treated as if they were independent.

```r
# Build the cluster-robust standard error by hand: sum residuals inside
# each store before squaring, instead of row by row
cluster_robust_se <- function(y, treat, cluster) {
  n <- length(y)
  k <- length(unique(cluster))
  fit <- lm(y ~ treat)
  e <- residuals(fit)
  cluster_sum <- tapply(e, cluster, sum)
  cluster_arm <- tapply(treat, cluster, max)
  nT <- sum(treat == 1); nC <- sum(treat == 0)
  g_treated <- sum(cluster_sum[cluster_arm == 1]^2)
  g_control <- sum(cluster_sum[cluster_arm == 0]^2)
  correction <- (k / (k - 1)) * ((n - 1) / (n - 2))
  sqrt(correction * (g_treated / nT^2 + g_control / nC^2))
}
round(cluster_robust_se(rollout_value40, treat40, store40), 2)
#> [1] 3.32
```

For this fit, the cluster-robust number comes out to 3.32, more than double the ordinary and robust numbers. But like before, one fit does not settle anything. Repeat the whole 40-store study 2,000 times and watch how far the display's effect truly wanders.

```r
# Repeat the 40-store rollout 2000 times and compare all three standard
# errors against the effect's real spread
set.seed(102)
reps40 <- replicate(2000, {
  y <- 220 + 15 * treat40 + rnorm(40, 0, 12)[store40] + rnorm(400, 0, 12)
  fit <- lm(y ~ treat40)
  c(slope = unname(coef(fit)["treat40"]),
    ordinary = unname(coef(summary(fit))["treat40", "Std. Error"]),
    robust = unname(hc0_se(fit)["treat40"]),
    cluster = cluster_robust_se(y, treat40, store40))
})
round(sd(reps40["slope", ]), 2)
#> [1] 3.97
round(mean(reps40["ordinary", ]), 2)
#> [1] 1.67
round(mean(reps40["robust", ]), 2)
#> [1] 1.67
round(mean(reps40["cluster", ]), 2)
#> [1] 3.9
```

The display effect's real standard deviation across those 2,000 repeats is 3.97. The ordinary formula averages 1.67. The robust formula also averages 1.67, confirming it carries no correction for the clustering at all. Only the cluster-robust standard error gets close, averaging 3.90, within 2% of the truth.

[KEY INSIGHT]
A robust (HC) standard error and a cluster-robust standard error fix two different problems. Robust fixes unequal variance across rows. Cluster-robust fixes rows that share an unobserved quirk, like all of one store's days. Here the first problem was absent and the second was severe, which is why robust did nothing and cluster-robust closed nearly all of a 58% shortfall: 1.67 against a true 3.97.

The widget below runs the same comparison, with a slider that raises the ICC from 0 (truly independent days) up to 0.5 (this chain's actual data), and tracks four standard errors for the same estimate as that correlation rises.

::widget cluster-icc-sim {"k":40,"m":10,"tau":0.88,"iccMax":0.5,"levels":11,"seed":23}

Push the slider to its highest setting, an ICC of 0.5, the same correlation this chain's data actually has. The ordinary and robust bars barely move from where they started at zero. Only the cluster-robust bar, and the fourth number next to it, labelled cluster means, climb to track the dashed line marking how much the estimate truly varies. That fourth number is what a mixed-effects model, one built with a random intercept for each store, would report for this exact design: a different route to the same destination as the cluster-robust formula.

=== step === concept
## Case 3: too few clusters to trust even the fix

The cluster-robust standard error just closed nearly all of the gap at 40 stores. Does it hold up just as well with fewer stores?

Run the identical rollout, same $15 display effect, same ICC of 0.5 (store sd and day sd both still $12), but now on only 6 stores, tracked for 60 days each. That is 360 rows of data, not far short of the 40-store study's 400, just carved from far fewer stores.

```r
# Build the same rollout on only 6 stores, 60 days each
set.seed(201)
store6 <- rep(1:6, each = 60)
arm6 <- rep(0:1, length.out = 6)
treat6 <- arm6[store6]
rollout_value6 <- 220 + 15 * treat6 + rnorm(6, 0, 12)[store6] + rnorm(360, 0, 12)
rollout_fit6 <- lm(rollout_value6 ~ treat6)
round(unname(coef(summary(rollout_fit6))["treat6", "Std. Error"]), 2)
#> [1] 1.64
round(unname(hc0_se(rollout_fit6)["treat6"]), 2)
#> [1] 1.64
round(cluster_robust_se(rollout_value6, treat6, store6), 2)
#> [1] 8.42
```

Ordinary and robust standard errors land near 1.6 again, the same story as the 40-store case: both miss the clustering entirely. Run the cluster-robust formula on this one fit and it jumps to 8.42, clearly reacting to the clustering this time.

So has the fix solved the problem the same way it did before? Repeat the whole 6-store study 2,000 times to find out.

```r
# Repeat the 6-store rollout 2000 times
set.seed(202)
reps6 <- replicate(2000, {
  y <- 220 + 15 * treat6 + rnorm(6, 0, 12)[store6] + rnorm(360, 0, 12)
  fit <- lm(y ~ treat6)
  c(slope = unname(coef(fit)["treat6"]),
    ordinary = unname(coef(summary(fit))["treat6", "Std. Error"]),
    cluster = cluster_robust_se(y, treat6, store6))
})
round(sd(reps6["slope", ]), 2)
#> [1] 9.83
round(mean(reps6["ordinary", ]), 2)
#> [1] 1.61
round(mean(reps6["cluster", ]), 2)
#> [1] 8.25
```

The display effect's real standard deviation jumps to 9.83, more than double what it was with 40 stores, because 6 stores is a much smaller, much noisier sample of store-level quirks than 40 was. The ordinary formula still averages only 1.61. But the cluster-robust formula, which closed nearly all of the gap at 40 stores, now averages only 8.25, 16% short of the truth, worse than the 40-store study's 2%.

Why does the same formula get worse as the design gets smaller? Look at the **design effect**: 1 plus (days per store minus 1) times the ICC. At 40 stores with 10 days each, that was 1 + 9 x 0.5 = 5.5.

Here, with 60 days per store, it is 1 + 59 x 0.5 = 30.5. Divide the 360 rows by that design effect and this study carries the information of only about 12 independent observations, not 360. A cluster-robust standard error is built from one summed number per store, so with only 6 stores it is doing the same thing as computing a standard deviation from just 6 numbers: a correct formula with too little to average over, which is why it runs optimistic.

This is the same widget, now set to this 6-store, 60-day design.

::widget cluster-icc-sim {"k":6,"m":60,"tau":0.88,"iccMax":0.5,"levels":11,"seed":23}

Push the slider to the same ICC of 0.5 as before. The cluster-robust bar climbs, same as it did at 40 stores, but this time it stops short of the dashed line marking the true spread. At 40 stores that same bar reached the marker. At 6 stores it does not, because six is not enough stores for the cluster sum to average out reliably.

=== step === quiz
## Quick check: choosing a standard error for clustered data

A different research team fits a similar model: 8 clinics, 200 patients each, 1,600 rows in total, testing whether a new intake script changes how long a visit takes. The ordinary standard error and the robust (HC) standard error come out small and nearly identical. The cluster-robust standard error comes out three times larger than either one.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Trust the ordinary number, since two of the three standard errors agree with each other. ::no
- The outcome is probably correlated within clinics, and with only 8 clusters even that larger cluster-robust number may still understate how much the estimate truly varies. ::ok Right. Two numbers agreeing says nothing when both were built on the same broken assumption, independent rows. The cluster-robust number reacting that strongly is the real signal that visits inside a clinic share something the model does not see. And with only 8 clusters, treat even that number as a floor, the same way the 6-store rollout's cluster-robust number ran 16% short of its own true spread.
- Enrolling more patients per clinic would close the gap between the three numbers. ::no More patients per clinic raises the rows inside each cluster, not the number of clusters itself. A design effect that grows with days per cluster, not with the number of clusters, is what decides whether a cluster-robust correction can be trusted, and 8 clinics is a small number of clusters no matter how many patients each one holds.

=== step === tryit
## Your turn: judge a new rollout's standard error

The chain tries this rollout once more, this time on 10 stores, 20 days each, 200 rows total, the same $15 effect and the same ICC of 0.5.

Below is the same cluster-robust formula built by hand for the 40-store and 6-store rollouts, with one line blanked: the line that sums each store's residuals before squaring them, instead of squaring every row on its own. Fill it in and press Check.

```r
# Build the cluster-robust standard error by hand for a 10-store, 20-day rollout
set.seed(301)
store10 <- rep(1:10, each = 20)
arm10 <- rep(0:1, length.out = 10)
treat10 <- arm10[store10]
rollout_value10 <- 220 + 15 * treat10 + rnorm(10, 0, 12)[store10] + rnorm(200, 0, 12)
rollout_fit10 <- lm(rollout_value10 ~ treat10)
resid10 <- residuals(rollout_fit10)

n <- length(rollout_value10)
k <- length(unique(store10))
nT <- sum(treat10 == 1)
nC <- sum(treat10 == 0)

# Finish this line: sum the residuals inside each store first, with tapply()
cluster_sum <- resid10
cluster_arm <- tapply(treat10, store10, max)

g_treated <- sum(cluster_sum[cluster_arm == 1]^2)
g_control <- sum(cluster_sum[cluster_arm == 0]^2)
correction <- (k / (k - 1)) * ((n - 1) / (n - 2))

round(sqrt(correction * (g_treated / nT^2 + g_control / nC^2)), 2)
round(coef(summary(rollout_fit10))["treat10", "Std. Error"], 2)
```
::check {"regex": "cluster_sum\\s*<-\\s*tapply[(]\\s*resid10\\s*,\\s*store10\\s*,\\s*sum\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: summing the residuals inside each store before squaring is exactly what makes this correction cluster-robust instead of row-robust.", "no": "Sum the residuals inside each store first, with tapply(resid10, store10, sum), the same move used to build the cluster-robust formula by hand."}
::solution
```r
# Sum the residuals inside each store first, then square those sums
cluster_sum <- tapply(resid10, store10, sum)
cluster_arm <- tapply(treat10, store10, max)

g_treated <- sum(cluster_sum[cluster_arm == 1]^2)
g_control <- sum(cluster_sum[cluster_arm == 0]^2)
correction <- (k / (k - 1)) * ((n - 1) / (n - 2))

round(sqrt(correction * (g_treated / nT^2 + g_control / nC^2)), 2)
#> [1] 8.58
round(coef(summary(rollout_fit10))["treat10", "Std. Error"], 2)
#> [1] 2.48
```

The cluster-robust standard error comes out to 8.58, more than three times the ordinary formula's 2.48.

Repeat this exact 10-store design 2,000 times, the same way as the 40-store and 6-store rollouts, and see where the true spread lands this time.

```r
# Repeat the 10-store rollout 2000 times and compare the true spread
# against the cluster-robust average
set.seed(302)
reps10 <- replicate(2000, {
  y <- 220 + 15 * treat10 + rnorm(10, 0, 12)[store10] + rnorm(200, 0, 12)
  fit <- lm(y ~ treat10)
  e <- residuals(fit)
  cl_sum <- tapply(e, store10, sum)
  g_treated <- sum(cl_sum[cluster_arm == 1]^2)
  g_control <- sum(cl_sum[cluster_arm == 0]^2)
  c(slope = unname(coef(fit)["treat10"]),
    cluster = sqrt(correction * (g_treated / nT^2 + g_control / nC^2)))
})
round(sd(reps10["slope", ]), 2)
#> [1] 7.83
round(mean(reps10["cluster", ]), 2)
#> [1] 7.09
```

The display effect's real standard deviation across those 2,000 repeats is 7.83. The cluster-robust formula averages 7.09, 9% short of the truth: worse than the 40-store study's 2%, better than the 6-store study's 16%, which is exactly where 10 clusters belongs between those two.

Notice something else. This one run gave a cluster-robust number of 8.58, actually a bit above the 2,000-repeat average of 7.09. A single run, like this one, can land on either side of that average. That is exactly why trustworthiness here comes from the many repeats, not from any one run, including this one.

=== step === concept
## References

- [A Heteroskedasticity-Consistent Covariance Matrix Estimator and a Direct Test for Heteroskedasticity](https://doi.org/10.2307/1912934). White, H. (1980), Econometrica, 48(4), 817-838. The original paper behind the robust standard error built in this lesson.
- [Random Group Effects and the Precision of Regression Estimates](https://doi.org/10.1016/0304-4076(86)90021-7). Moulton, B.R. (1986), Journal of Econometrics, 32(3), 385-397. Shows how ignoring group structure, like the store-level clustering here, understates standard errors.
- [A Practitioner's Guide to Cluster-Robust Inference](https://doi.org/10.3368/jhr.50.2.317). Cameron, A.C. and Miller, D.L. (2015), Journal of Human Resources, 50(2), 317-372. The cluster-robust formula built by hand in this lesson, including the few-clusters warning from Case 3.
- [Bias Reduction in Standard Errors for Linear Regression with Multi-Stage Samples](https://www150.statcan.gc.ca/n1/en/pub/12-001-x/2002002/article/9058-eng.pdf). Bell, R.M. and McCaffrey, D.F. (2002), Survey Methodology, 28(2), 169-179. The small-sample correction behind the k/(k-1) term in the cluster-robust formula.
- [Mostly Harmless Econometrics: An Empiricist's Companion](https://doi.org/10.1515/9781400829828). Angrist, J.D. and Pischke, J.S. (2009), Princeton University Press, Chapter 8. A fuller treatment of the clustering problem this lesson builds from scratch.

=== step === complete
## The decision rule, earned by three numbers

Three simulations, three numbers, one rule.

- Heteroskedasticity, the spread of the mistakes changing with store size, cost the ordinary formula 8%. A robust (HC) standard error, built by weighting each row's own squared residual, closed that gap to within 4%.
- Clustering, 10 correlated days inside each of 40 stores, cost both the ordinary and the robust formula far more: both averaged 1.67 against a true spread of 3.97, more than half the truth missing. Only the cluster-robust standard error, built by summing residuals inside each store before squaring, closed nearly all of that gap, averaging 3.90.
- The same fix, run on only 6 stores instead of 40, averaged just 8.25 against a true spread of 9.83, 16% short. The cluster-robust number itself was not a mistake. It was simply built from too few stores to average out reliably.

So, the rule this lesson was built to earn: reach for the ordinary standard error only when the rows are genuinely independent and equally noisy. Reach for a robust (HC) standard error when only the equal-variance assumption is shaky. Reach for a cluster-robust standard error whenever rows inside a group, a store, a clinic, a patient tracked over time, can share some quirk the model never measures. And below a few dozen clusters, treat even that cluster-robust number as a floor on the truth, not the truth itself.
