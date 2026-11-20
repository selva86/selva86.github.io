---
title: "Regression Modeling Strategies Lesson 1: Why stepwise selection lies to you"
catalog_blurb: "Why a model built by automatic search looks significant when nothing is really there."
description: "A backward search on 40 noise predictors returns a model that looks real. See why its p-values and coefficients cannot be read at face value, and what to do instead."
keywords: "stepwise regression, backward elimination, AIC, variable selection bias, p-hacking, multiple testing, Bonferroni correction, lasso and ridge regression, R"
post_type: "LESSON"
curriculum_id: "4.70.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-model-strategy"
course_title: "Regression Modeling Strategies"
course_lesson: "1"
course_total: "7"
course_landing: "Regression-Modeling-Strategies-Course.html"
course_next: "Fitting-a-Curve-Without-Guessing-Its-Shape.html"
course_prev: ""
---

=== step === cover
## Why stepwise selection lies to you

Today let's understand why a model chosen by an automatic search can look real even when there is nothing real in the data behind it.

Say you are fitting a regression model and are not sure which of many candidate predictors actually belong in it. A common shortcut is to let an algorithm decide for you: start with every predictor in one model, then repeatedly drop whichever one helps the fit most when removed, stopping once no drop helps any further. This is called stepwise selection, specifically backward elimination, and the usual pitch is that whatever predictors remain at the end earned their place.

Here is the test this lesson runs on that pitch. We are going to build 40 predictor columns that have, by construction, no relationship at all to the outcome. If stepwise selection does what it's pitched to do, running it on this data should hand back close to nothing.

The search itself is just four steps, repeated until nothing changes.

::widget process-flow {"steps": [{"title": "Start with every candidate", "sub": "all 40 predictors enter one model together"}, {"title": "Drop whichever helps AIC most", "sub": "refit without it, and keep the drop only if AIC falls"}, {"title": "Repeat until no drop helps", "sub": "stop once every remaining removal would raise AIC"}, {"title": "Report the survivors", "sub": "write up the predictors left standing as the final model"}]}

Start with everything, drop whatever helps most, repeat until nothing helps, then report whoever is left standing. That is the whole procedure, about to run on 40 predictors built to contain nothing at all.

=== step === concept
## A backward search run on pure noise

Before running the search, here is what it is actually optimizing. AIC stands for Akaike Information Criterion, and it scores a model by weighing fit against predictor count: every added predictor charges the score a fixed 2 points, so a predictor only earns its place if it improves the fit by more than that. Lower AIC is better.

Backward elimination starts from the full model. At each round it drops whichever predictor lowers the AIC the most, and it stops the moment every remaining removal would raise the AIC instead.

Here is the data the search will run on: 100 observations, 40 predictor columns named x1 through x40, every one of them independent random noise with no built-in connection to the outcome y, which is random noise too. Fit the full model, then let backward elimination run on it.

```r
# Fit every one of 40 noise predictors, then let backward elimination search them
set.seed(1)
n <- 100
p <- 40
X <- matrix(rnorm(n * p), nrow = n, ncol = p)
colnames(X) <- paste0("x", 1:p)
y <- rnorm(n)
noise_data <- data.frame(y = y, X)

full_model <- lm(y ~ ., data = noise_data)
step_model <- step(full_model, direction = "backward", trace = 0)
summary(step_model)
#> 
#> Call:
#> lm(formula = y ~ x1 + x8 + x17 + x18 + x19 + x22 + x34, data = noise_data)
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -1.62262 -0.50960 -0.03825  0.48182  2.07836 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)   
#> (Intercept) -0.02318    0.08991  -0.258  0.79711   
#> x1          -0.19917    0.10249  -1.943  0.05505 . 
#> x8           0.23141    0.08235   2.810  0.00605 **
#> x17          0.19035    0.09243   2.059  0.04229 * 
#> x18         -0.17943    0.07694  -2.332  0.02188 * 
#> x19          0.19232    0.08467   2.271  0.02546 * 
#> x22         -0.17805    0.08128  -2.191  0.03100 * 
#> x34          0.21874    0.08411   2.601  0.01084 * 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 0.8726 on 92 degrees of freedom
#> Multiple R-squared:  0.2546,	Adjusted R-squared:  0.1979 
#> F-statistic: 4.489 on 7 and 92 DF,  p-value: 0.0002448

AIC(full_model)
#> [1] 312.7716
AIC(step_model)
#> [1] 266.1878
```

Seven predictors survived: x1, x8, x17, x18, x19, x22, and x34. The AIC fell from 312.77 on the full 40-predictor model to 266.19 on this seven-predictor one, which is exactly why the other 33 went home: dropping each of them lowered the AIC further, while dropping any of these seven would have raised it.

Now read the bottom of that printout. R-squared is 0.2546, so this model explains about a quarter of the variation in y. The overall F-test comes back at F = 4.489 on 7 and 92 degrees of freedom, with a p-value of 0.000245, comfortably below the usual 0.05 cutoff.

Every one of those 40 predictors was built with zero relationship to y. There is nothing in this data for any model to find. And yet the search returned one that, by every number on the page, looks real.

=== step === widget
## A p-value computed as though no search happened

The predictor x8 came back with a t-value of 2.81 and a reported p-value of 0.006, the smallest and most convincing-looking of the seven survivors.

That p-value is computed as though x8 were the one predictor decided on in advance, the single test somebody had planned to run before seeing any data. But x8 was never decided on in advance. It was the strongest performer out of 40 candidates, picked precisely because it looked the best among all of them.

One way to see how much that distinction costs is to picture the distribution a test statistic would follow if nothing at all were going on, and ask how far out in the tail 2.81 really sits.

::widget null-distribution {"tails": 2, "max": 4, "start": 2.81, "label": "x8 t-value, reported alone"}

The slider starts at 2.81, x8's own t-value. The shaded tail, the share of a standard normal distribution at least this far from zero in either direction, works out to about 0.005. That is close to R's own 0.006 but not identical, because R's exact figure comes from a t-distribution with 92 degrees of freedom rather than a standard normal; the two agree closely at this sample size without being the same number.

Here is that raw p-value, read directly off the model.

```r
# x8's p-value, as reported, computed as though it were the only test ever run
coef_summary <- summary(step_model)$coefficients
coef_summary["x8", ]
#>    Estimate  Std. Error     t value    Pr(>|t|) 
#> 0.231414058 0.082347810 2.810202948 0.006048692 
```

That number only holds if x8 were the one predictor ever tested. The honest version treats all 40 candidates as having been tested, and the simplest way to do that is a Bonferroni correction, which multiplies the p-value by the number of tests performed.

```r
# Correct that p-value for having screened 40 candidates, not just x8
p.adjust(coef_summary["x8", "Pr(>|t|)"], method = "bonferroni", n = 40)
#> [1] 0.2419477
```

Once 40 tests are accounted for, x8's p-value rises from 0.006 to 0.242. A p-value of 0.242 is nowhere near significant. The predictor that looked like the strongest finding in the whole model was never actually tested the way its reported p-value of 0.006 assumes.

=== step === quiz
## Quick check: what a post-search p-value measures

A predictor survives backward elimination with a reported p-value of 0.006. Which statement reads that number correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- p-values do not depend on how a predictor was chosen, so 0.006 is trustworthy as is. ::no A p-value's formula does not know how its predictor got chosen, but that is exactly the problem. The formula assumes one test fixed in advance; x8 was actually the best of 40, so the number describes a test that never happened.
- Stepwise selection always shrinks every p-value by the same fixed amount. ::no There is no fixed shrinkage to undo. How wrong a post-search p-value runs depends on how many candidates were screened, which is why the Bonferroni correction needs the actual count of tests, 40 here, not a universal constant.
- It measures the evidence as though this one predictor had been chosen and tested before seeing the data, which is not what happened, so it is not a reliable measure of evidence here. ::ok Right. x8's t-value of 2.81 gives p = 0.006 only if it were the one predictor decided on in advance. It was instead the strongest survivor of 40 candidates, and correcting for that with a Bonferroni adjustment across 40 tests raises its p-value to 0.242, nowhere near significant.
- R-squared is the only number worth reading after a search, so the p-value does not matter. ::no R-squared has the same problem as the p-value. Both come from a model chosen for fitting this sample well, which is why the survivor model's R-squared of 0.2546 looks respectable even though the true R-squared, with 40 predictors built to have no relationship to the outcome, is exactly zero.

=== step === concept
## Why the surviving coefficients run too large

The p-value is not the only number a search distorts. The size of the coefficients that survive is wrong too, and in a specific direction: too large.

Here is the same construction, run smaller and repeated. Twenty separate noise datasets, each with 100 observations and 20 candidate predictors, every true coefficient exactly zero in every single one of them. Fit the full model and the backward-selected model on each of the 20, and collect two piles of numbers: every coefficient from every full model, and only the ones that survived selection.

```r
# Repeat the search on 20 fresh noise datasets and compare coefficient sizes
candidate_coefs <- c()
retained_coefs <- c()
for (r in 1:20) {
  set.seed(r + 1000)
  Xr <- matrix(rnorm(100 * 20), nrow = 100, ncol = 20)
  colnames(Xr) <- paste0("x", 1:20)
  yr <- rnorm(100)
  noise_r <- data.frame(y = yr, Xr)
  full_r <- lm(y ~ ., data = noise_r)
  step_r <- step(full_r, direction = "backward", trace = 0)
  candidate_coefs <- c(candidate_coefs, coef(full_r)[-1])
  retained_coefs <- c(retained_coefs, coef(step_r)[-1])
}
length(candidate_coefs)
#> [1] 400
mean(abs(candidate_coefs))
#> [1] 0.094283
length(retained_coefs)
#> [1] 93
mean(abs(retained_coefs))
#> [1] 0.1938745
mean(abs(retained_coefs)) / mean(abs(candidate_coefs))
#> [1] 2.056304
```

Four hundred candidate coefficients went into the first pile, one for every predictor in every one of the 20 full models, and their average size is 0.094. Only 93 coefficients survived selection across all 20 datasets, about 4.65 per dataset, and their average size is 0.194, almost exactly twice as large.

Every one of those coefficients, surviving or not, was estimated on a predictor with a true value of exactly zero. Nothing in the data favors any predictor over any other. A predictor only survives backward elimination because, in this one sample, its estimate happened to come out large, and large estimates are exactly what the search is built to keep. The ones that make it through are a biased, too-large sample pulled from a population that is actually all zeros.

=== step === widget
## Lasso and ridge: a fixed penalty in place of a hidden one

Stepwise selection is not the only way to decide which predictors stay in a model. A different family of methods, ridge and lasso regression, handles that same decision in a way that is honest about its own cost.

The widget below runs on its own six predictors, three of them genuinely related to the outcome and three of them noise; it is a second, separate worked example, not the 40-predictor data built earlier in this lesson.

::widget coef-path {}

Drag the penalty slider, called lambda, and watch the six coefficients as it grows. Under lasso, the weaker coefficients, including the three noise predictors, get driven all the way to exactly zero: that is a form of predictor selection, but one with a stated, explicit cost built into the penalty itself. Under ridge, every coefficient shrinks smoothly toward zero as lambda grows, but none of them ever reaches it exactly.

Either way, the amount of shrinkage is fixed by lambda before the model is ever fit to the data. Nobody tries one set of predictors, checks how it looks, and then tries another. That is the difference that matters: a stepwise search keeps its cost out of the p-values and coefficients it reports, which read as though no search ever happened, while a penalty like lambda is declared up front and paid openly.

=== step === concept
## What to do instead

Here is the model that is actually honest about this lesson's data.

```r
# The honest model for this data has no predictors at all; compare its R-squared to the survivor's
null_model <- lm(y ~ 1, data = noise_data)
summary(null_model)$r.squared
#> [1] 0
summary(step_model)$r.squared
#> [1] 0.254596
```

The null model, with no predictors at all, has an R-squared of exactly 0. That is the truth, because every one of the 40 predictors was built with no relationship to y. Compare that zero against the R-squared of 0.2546 and the p-value of 0.000245 the backward search returned earlier in this lesson. The search did not find a real relationship hiding in the data. It found the best-looking noise out of 40 tries, and reported it using numbers that assume no search happened.

The fix is not a smarter search. It is to stop searching. Decide which predictors belong in the model from what you know about the mechanism connecting them to the outcome, before you ever look at this dataset's own numbers, and then fit that one model once. Whatever degrees of freedom you have available get spent on the predictors you can defend on those grounds, not on whichever ones happened to look best in one sample.

=== step === quiz
## Quiz: reading a stepwise result

A colleague ran backward elimination on 30 candidate predictors, kept 4 of them, each significant at p < 0.05, with an overall R-squared of 0.22. Which conclusion is best supported?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The reported p-values and R-squared describe a model that already searched 30 candidates for the best-looking fit, so neither number is evidence of a real relationship without accounting for that search. ::ok Right. Thirty candidates were searched for whichever four predictors fit this one sample best, so the p-values and the 0.22 R-squared describe that search, not a relationship decided on beforehand. The same two problems from this lesson apply: the p-values overstate the evidence, and the four surviving coefficients likely run larger than their true size.
- 4 of 30 surviving is strong evidence by itself. ::no 4 of 30 surviving sounds selective, but this lesson's own backward search kept about 4.65 of 20 noise predictors on average, with every true coefficient exactly zero. Surviving a search is not by itself evidence of anything real.
- The surviving coefficients are unbiased because step() uses ordinary least squares at each stage. ::no step() does refit by ordinary least squares at each stage, but that does not make the final coefficients unbiased. A predictor survives because its estimate happened to look large in this one sample. Across the 20 noise datasets in this lesson, retained coefficients averaged 0.194 against 0.094 for candidates before selection, about twice as large, even though the truth was zero every time.
- Running the identical search again on a fresh sample from the same population would keep the same 4 predictors. ::no A fresh sample run through the identical search would very likely keep a different four predictors, because which ones look best is driven by that sample's own noise. The 20 repeated noise datasets in this lesson kept a different handful of predictors nearly every time.
- Switching the search from backward AIC to a lasso path, like the one shown earlier in this lesson, would by itself make the surviving coefficients' significance valid. ::no Switching to lasso charges an explicit, fixed penalty instead of a hidden one, which is a real improvement, but it does not retroactively fix a result already reported from a backward AIC search. It would need to be refit as a lasso model from the start, on its own declared terms.

=== step === tryit
## Your turn: run the check yourself

Time to run this check on data of your own, not the lesson's.

Fresh noise, built the same way as before: 80 observations, 15 candidate predictors, every one unrelated to the outcome, with a seed not reused anywhere earlier in this lesson. The full model is already fit for you below.

```r
# A fresh noise dataset: 80 observations, 15 predictors, none related to the outcome
set.seed(4)
n <- 80
p <- 15
X <- matrix(rnorm(n * p), nrow = n, ncol = p)
colnames(X) <- paste0("x", 1:p)
y <- rnorm(n)
noise_check <- data.frame(y = y, X)
full_check <- lm(y ~ ., data = noise_check)

# Run backward elimination by AIC on full_check, call the result step_check.
# Then look at summary(step_check): which predictors survived, the R-squared,
# and the overall F-test p-value. Press Check when you have the step() call
# and the summary() call.
```
::check {"regex": "step\\s*[(][\\s\\S]*?backward[\\s\\S]*?summary\\s*[(]", "gate": true, "difficulty": "intermediate", "ok": "Right. Backward elimination on full_check keeps x1, x2, x6, x8 and x12, R-squared 0.239, and the overall F-test lands at p = 0.00095, which looks like a real result from five noise predictors built with no relationship to y at all. That is the same lie this lesson opened with, just smaller.", "no": "Call step() on full_check with direction set to backward to search, then pass that result to summary() to read off which predictors survived, the R-squared, and the overall F-test p-value."}
::solution
```r
# Complete the search and read the result
step_check <- step(full_check, direction = "backward", trace = 0)
summary(step_check)
#> 
#> Call:
#> lm(formula = y ~ x1 + x2 + x6 + x8 + x12, data = noise_check)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -1.8707 -0.6932  0.0359  0.6391  1.9823 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)  
#> (Intercept)  -0.1342     0.1070  -1.254   0.2138  
#> x1            0.2138     0.1214   1.761   0.0824 .
#> x2            0.2440     0.1052   2.318   0.0232 *
#> x6           -0.2364     0.1066  -2.217   0.0297 *
#> x8            0.1823     0.1185   1.539   0.1282  
#> x12          -0.1970     0.1054  -1.869   0.0655 .
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 0.926 on 74 degrees of freedom
#> Multiple R-squared:  0.2392,	Adjusted R-squared:  0.1878 
#> F-statistic: 4.653 on 5 and 74 DF,  p-value: 0.0009517
```

Five noise predictors came back looking significant, with an R-squared of 0.239 and an overall p-value under 0.001, from data built to contain no relationship at all. That is the same lie this lesson opened with, only smaller.

=== step === concept
## References

- [A Note on Screening Regression Equations](https://doi.org/10.1080/00031305.1983.10482729) - Freedman, D.A. (1983), The American Statistician, 37(2), 152-155. The original demonstration that screening many predictors and keeping the best-looking ones returns a model that looks significant even when none of the predictors are real.
- [Regression Modeling Strategies, course notes](https://hbiostat.org/rmsc) - Harrell, F.E. Companion to the book (2nd ed., Springer, 2015); the chapter on variable selection argues for choosing predictors on subject-matter grounds instead of an automatic search, the alternative this lesson closes on.
- Miller, A.J. "Subset Selection in Regression." 2nd ed., Chapman and Hall/CRC (2002). A full account of how automatic subset-selection methods distort the p-values and coefficients that come out of them.
- Flom, P.L. & Cassell, D.L. "Stopping Stepwise Regression." NESUG Proceedings (2007). A practical case against stepwise selection aimed at working analysts rather than theoreticians.
- [Why do we still use stepwise modelling in ecology and behaviour?](https://doi.org/10.1111/j.1365-2656.2006.01141.x) - Whittingham, M.J., Stephens, P.A., Bradbury, R.B. & Freckleton, R.P. (2006), Journal of Animal Ecology, 75(5), 1182-1189. A survey of how often stepwise selection is still used and misread in published research.

=== step === complete
## The lie, and the honest alternative

Forty predictors, every one of them pure noise, went into a backward AIC search. What came out was a seven-predictor model with an R-squared of 0.2546 and an overall p-value of 0.000245, numbers that would get a result published.

Both of those numbers lie about what actually happened, and in two separate ways. The p-value on the strongest survivor, x8, is computed as though it were the one predictor tested, when it was really the best of 40; correcting it with a Bonferroni adjustment sends it from 0.006 to 0.242, nowhere near significant. And the coefficients that survive any such search run too large: repeated across 20 noise datasets, the coefficients backward elimination kept averaged about twice the size of a typical candidate coefficient before any selection happened, even though the truth, every time, was zero.

The honest alternative is not a better search. Choose which predictors belong in a model from what you already know about the mechanism connecting them to the outcome, before you fit anything, and spend the degrees of freedom you have on the predictors you can defend that way.
