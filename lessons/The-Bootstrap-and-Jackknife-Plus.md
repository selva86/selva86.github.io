---
title: "Uncertainty Quantification Lesson 6: The Bootstrap and the Jackknife+"
catalog_blurb: "Measure uncertainty in any estimate by resampling the data you already have."
description: "The bootstrap and jackknife-plus in R: resample one dataset for a standard error and percentile interval on any statistic, plus a prediction interval with a coverage guarantee."
keywords: "bootstrap, jackknife plus, resampling, percentile interval, standard error, prediction interval, coverage guarantee, leave-one-out, sampling distribution, uncertainty quantification, R"
post_type: "LESSON"
curriculum_id: "6.210.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "6"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: "Reporting-Uncertainty-Honestly.html"
course_prev: "Calibration-Reliability-and-Recalibration.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## The Bootstrap and the Jackknife+

Every interval and probability you have built so far leaned on a model's assumptions: a bell-shaped error, an equal spread, a logistic squashing. This lesson gets uncertainty a different way, one that assumes almost nothing. You take the single dataset you already have and *resample it*, over and over, letting the data itself show you how much your answer could have wobbled.

Meet Rohan again, the real-estate agent from the first lessons. He has just closed on 50 homes in one neighborhood, and he owes two honest numbers. First, a headline for his market report: "the typical home here sells for about \$330,000." How sure is that \$330,000? Second, a quote for one specific new listing, a 2000 square-foot home: not just a price, but a range he can stand behind. By the end you will answer both from those same 50 rows, with no bell curve in sight.

By the end of this lesson you will be able to:

- Explain what a **bootstrap resample** is and why the spread of a statistic across many resamples estimates its sampling distribution
- Compute a bootstrap **standard error** and a **percentile confidence interval** in R for a statistic that has no textbook formula
- Build a **jackknife+** prediction interval from leave-one-out residuals, and check that its coverage holds the guarantee

**Prerequisites:** [Lessons 1 to 2](Prediction-Intervals-You-Can-Trust.html) of this course (a prediction interval, coverage, empirical coverage, and the held-out split idea behind [split conformal](Split-Conformal-Prediction.html), which the jackknife+ is the leave-one-out cousin of). A residual is actual minus predicted; you can fit `lm(price ~ sqft)` and call `predict()`. Base R: `sample()`, `x[idx]` indexing, `for` loops, `quantile()`. Every new term is defined as it appears.

::widget bootstrap-sample {"n":12,"seed":5,"tail":"Draw the rows with replacement, recompute, repeat: that is the bootstrap."}

=== step === concept
::eyebrow Where we left off
## One dataset, two honest questions

In Lesson 5 you put Nadia's rain probabilities on trial and learned to repair them. That fix, like every method in this course so far, trusted an assumption: calibration leaned on a logistic shape, Lesson 1's textbook band leaned on a symmetric bell curve. When an assumption cracks, the promise on the label quietly becomes fiction, exactly what happened to Rohan's biggest homes back in Lesson 2.

The bootstrap refuses to lean on any of that. Its one idea is almost cheeky: your sample is your best picture of the population, so to see how a statistic would vary across *other* samples you never got to collect, just draw fresh samples *from the sample you have*. Let us rebuild Rohan's 50 sales so we can try it. Each lesson runs in a fresh R session, so we create the data right here (run this once). Home sizes are right-skewed, the way a real market is (lots of mid-size homes, a few large ones), and price climbs with size plus noise.

```r
set.seed(1)
n     <- 50
sqft  <- round(exp(rnorm(n, log(1500), 0.35)))         # home sizes, right-skewed like a real market
price <- round(60000 + 175 * sqft + rnorm(n, 0, 20000)) # price grows with size, plus noise
homes <- data.frame(sqft, price)
head(homes, 4)
#>   sqft  price
#> 1 1205 278837
#> 2 1600 327759
#> 3 1120 262822
#> 4 2622 496263
c(mean = round(mean(price)), median = round(median(price)))
#>   mean median
#> 345049 330214
```

Notice the mean (\$345,049) sits well above the median (\$330,214). A few large homes drag the average up, which is exactly why real-estate reports quote the **median** sale price, not the mean. So the median is the number Rohan will headline. Now, how precise is it?

For the *mean* there is a famous formula for the uncertainty. The **standard error** of a statistic is the standard deviation of that statistic across many hypothetical samples, in words, the typical amount it would jump around if Rohan had happened to sell 50 *different* homes. For the mean it is the sample standard deviation \(s\) divided by \(\sqrt{n}\):

\[ \text{SE}(\bar x) \;=\; \frac{s}{\sqrt{n}}, \]

where \(\bar x\) is the sample mean, \(s\) is the sample standard deviation of the prices, and \(n = 50\) is the number of homes.

```r
se_mean <- sd(price) / sqrt(n)
round(c(sample_mean = mean(price), se_of_the_mean = se_mean))
#>    sample_mean se_of_the_mean
#>         345049          11036
```

So the mean is good to about \$11,000 either side. But there is **no such clean formula for the median.** That is the gap the bootstrap fills.

=== step === widget
::eyebrow The one idea
## Resample with replacement

Here is the whole trick. To manufacture a "different sample of 50 homes" without collecting any new data, we draw 50 rows **from our own 50**, *with replacement*: each draw picks a random row, and because we do not remove it, the same home can be picked twice, three times, or not at all. That is a **bootstrap resample**. It has the same size as the original (50 homes), but a slightly different make-up, so any statistic computed on it comes out slightly different.

Drag "Draw again" below. Each draw is one resample: green rows made it in, blue rows got picked more than once, grey rows sat out this time.

::widget bootstrap-sample {"n":12,"seed":7,"tail":"Those rows sat out this resample; a different resample sweeps them back in."}

The grey "left out" rows are no accident: on average about 37% of rows miss any given resample (you will meet those left-out rows again at the very end). Let us draw one resample of Rohan's homes and watch the median move.

```r
set.seed(7)
idx      <- sample(n, n, replace = TRUE)     # 50 row numbers, drawn WITH replacement
resample <- homes[idx, ]
c(rows_left_out   = n - length(unique(idx)),
  original_median = round(median(homes$price)),
  new_median      = round(median(resample$price)))
#>   rows_left_out original_median     new_median
#>              19          330214         332668
```

Nineteen of the 50 homes sat out this particular resample, and the median shifted from \$330,214 to \$332,668. Do this thousands of times and the *spread* of those resampled medians tells you how much the median wobbles. That spread is the bootstrap's estimate of the sampling distribution.

=== step === concept
::eyebrow Trust, then use
## Check it where a formula exists: the mean

Before we trust the bootstrap on the median (where we cannot check it), let us prove it works on the mean (where we can). We resample \(B = 2000\) times, recompute the mean each time, and collect the 2000 answers. The **bootstrap standard error** is simply the standard deviation of those answers:

\[ \widehat{\text{SE}}_{\text{boot}} \;=\; \sqrt{\frac{1}{B-1}\sum_{b=1}^{B}\bigl(\hat\theta^{*b} - \overline{\hat\theta^{*}}\bigr)^2}, \]

where \(\hat\theta^{*b}\) is the statistic (here the mean) computed on resample \(b\), \(\overline{\hat\theta^{*}}\) is the average of those \(B\) resampled statistics, and \(B = 2000\) is how many resamples we draw. In plain terms: *make many resamples, take the statistic on each, and report how much they scatter.*

```r
set.seed(7)
B <- 2000
boot_mean <- numeric(B)
for (b in 1:B) {
  idx          <- sample(n, n, replace = TRUE)   # a fresh resample
  boot_mean[b] <- mean(homes$price[idx])          # its mean
}
round(c(bootstrap_SE = sd(boot_mean), formula_SE = se_mean))
#>  bootstrap_SE   formula_SE
#>         10778        11036
```

The bootstrap standard error is \$10,778; the textbook formula said \$11,036. They agree to within about 2%, and the small gap is just Monte Carlo noise that shrinks as you raise \(B\). The bootstrap re-derived a known formula from nothing but resampling. That is the "trust" half. Now we point the exact same machine at a statistic with no formula.

=== step === quiz
::eyebrow Check yourself
## What makes it a bootstrap resample?

The line `idx <- sample(n, n, replace = TRUE)` is the heart of the method. Which description of the resample it produces is correct?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- It draws 50 row numbers out of the 50 originals **with replacement**, so the resample is the same size but some homes appear more than once and others not at all ::ok Exactly. Same size (n out of n), drawn with replacement: that mix of duplicates and left-out rows is what makes each resample a plausible "alternate sample" and lets the statistic vary.
- It draws a smaller subset of the 50 homes **without replacement**, so every home appears at most once ::no That would be subsampling, not the bootstrap. Without replacement you could never get duplicates, and a smaller sample would understate the true uncertainty. The bootstrap keeps the size at n and samples WITH replacement.
- It generates 50 brand-new homes from a fitted model of the market ::no That is a parametric simulation, which leans on the model being right, the very assumption the bootstrap avoids. The bootstrap resamples the ACTUAL rows, assuming nothing about their distribution.

=== step === concept
::eyebrow The payoff
## Bootstrap the median

Nothing about the code changes except the statistic inside the loop: swap `mean` for `median`. The bootstrap does not know or care that the median has no tidy formula, it just recomputes and reports the scatter.

```r
set.seed(7)
boot_med <- numeric(B)
for (b in 1:B) {
  idx         <- sample(n, n, replace = TRUE)
  boot_med[b] <- median(homes$price[idx])   # the ONLY change: median instead of mean
}
round(c(median = median(homes$price), bootstrap_SE = sd(boot_med)))
#>       median bootstrap_SE
#>       330214        18505
```

Rohan's median is \$330,214, give or take about \$18,500. And here is something the formula-free approach *reveals* that no lookup could have told him: the median (SE \$18,505) is actually **noisier** than the mean (SE \$11,036) for this market. On a right-skewed spread the median is the more robust summary but not the more *precise* one, a genuinely useful fact that fell straight out of resampling. Plot the 2000 bootstrap medians to see the sampling distribution the standard error is summarizing:

```r
hist(boot_med, breaks = 30, col = "#cfe3d4", border = "white",
     main = "Bootstrap distribution of the median", xlab = "resampled median price ($)")
abline(v = median(homes$price), col = "#1f7a55", lwd = 2)   # the original median
```

Run it. The histogram is the shape the median takes across resamples, centered on Rohan's \$330,214, and its width is the standard error you just computed.

=== step === concept
::eyebrow Turn the spread into a range
## The percentile interval

A standard error is one number; Rohan wants a range. The bootstrap distribution *is* the range, already drawn for us, so the simplest confidence interval just reads two percentiles straight off it. For a \(1 - \alpha\) interval you take the \(\alpha/2\) and \(1 - \alpha/2\) quantiles of the bootstrap statistics:

\[ \bigl[\; \hat\theta^{*}_{(\alpha/2)}, \;\; \hat\theta^{*}_{(1 - \alpha/2)} \;\bigr], \]

where \(\hat\theta^{*}_{(q)}\) is the \(q\)-th quantile of the 2000 bootstrap medians and \(\alpha\) is the amount of probability you leave in the two tails combined. For a 95% interval, \(\alpha = 0.05\), so you cut off the bottom 2.5% and the top 2.5%. This is the **percentile interval**, and it is one line in R:

```r
ci95 <- quantile(boot_med, c(0.025, 0.975))
round(ci95)
#>   2.5%  97.5%
#> 305307 381076
```

So Rohan can write, honestly and without assuming a single thing about the shape of home prices: *the typical home sells for about \$330,000, and I am 95% confident the true median is between \$305,000 and \$381,000.* No bell curve, no formula, just the data resampled.

=== step === tryit
::eyebrow Your turn
## A tighter, 90% interval

A 95% interval is wide because it insists on catching the truth 19 times out of 20. Rohan wants a snappier 90% interval for the report, which leaves 5% in *each* tail. The 2000 bootstrap medians are already sitting in `boot_med`. Fill in the blank to read off the 90% percentile interval.

```r
# a 90% percentile interval: the 5th and 95th percentiles of the bootstrap medians
ci90 <- ____
round(ci90)
```
::check {"regex":"quantile\\(\\s*boot_med\\s*,\\s*c\\(\\s*0?\\.05\\s*,\\s*0?\\.95","gate":true,"difficulty":"intermediate","ok":"310254 to 363981, a good bit tighter than the 95% interval. A percentile interval is nothing but two quantiles of the bootstrap distribution: for 90% you leave 5% in each tail, so quantile(boot_med, c(0.05, 0.95)).","no":"You want the 5th and 95th percentiles of the 2000 bootstrap medians (5% in each tail leaves 90% in the middle): quantile(boot_med, c(0.05, 0.95))."}
::solution
```r
ci90 <- quantile(boot_med, c(0.05, 0.95))
round(ci90)
#>     5%    95%
#> 310254 363981
```

=== step === concept
::eyebrow Know its edges
## Where the bootstrap breaks

The bootstrap is powerful precisely because it assumes so little, but "almost nothing" is not "nothing." It quietly assumes your sample is a fair picture of the population and that the statistic is smooth enough to be stable under resampling. Break either and it misleads. The sharpest failure is an **extreme** statistic like the maximum. Watch what the bootstrap max can even be:

```r
set.seed(7)
boot_max <- numeric(B)
for (b in 1:B) {
  idx         <- sample(n, n, replace = TRUE)
  boot_max[b] <- max(homes$price[idx])
}
c(true_max = max(homes$price), distinct_boot_maxes = length(unique(boot_max)))
#>            true_max distinct_boot_maxes
#>              553582                   9
```

Across 2000 resamples the bootstrap max took only **9 distinct values**, because a resample's maximum can never exceed the largest home Rohan actually sold: it can only ever equal one of his few priciest listings. The "distribution" is a handful of spikes, not a smooth estimate, so a percentile interval from it is meaningless.

[WARNING]
The bootstrap is trustworthy for smooth, central statistics (means, medians, correlations, regression coefficients) on a decent-sized independent sample. Be wary when: the statistic depends on extremes (max, min, a high quantile); the sample is tiny (a dozen rows cannot picture a population); or the rows are **dependent** (time series, clustered, or grouped data), where plain row resampling destroys the very structure that carries the uncertainty. Special bootstraps (the block bootstrap, for example) exist for those cases.

=== step === concept
::eyebrow From a summary to a prediction
## Now the harder question: one new home

The bootstrap gave Rohan an honest range for a *summary* of his data. But his second question is different in kind: a buyer asks what one specific **2000 square-foot home** will fetch. That is not a statistic of the past 50 sales, it is a **prediction** about a brand-new outcome, so it needs a **prediction interval**, the same object you built with split conformal in Lesson 2.

Recall how split conformal worked: carve off a chunk of data as a *calibration set*, never train on it, and read the band width off the model's misses there. It works and it carries a guarantee, but it pays a tax: every row spent on calibration is a row the model could not learn from. On Rohan's slim 50 homes, splitting off even 25 for calibration leaves a weaker model *and* a noisier band. The **jackknife+** removes that tax with a beautifully simple move: instead of setting aside one calibration chunk, it holds out *one row at a time*, using every other row to learn. Where a bootstrap resample leaves ~37% of rows out, leave-one-out holds out exactly one, then rotates through all of them.

::widget process-flow {"steps":[{"title":"Leave one home out","sub":"drop row i, fit the model on the other 49 homes"},{"title":"Score its miss","sub":"record how far that model is off on the held-out home: the leave-one-out residual"},{"title":"Rotate through every row","sub":"50 fits give 50 honest out-of-sample residuals, wasting no data"},{"title":"Wrap the new home","sub":"combine the 50 predictions and 50 residuals into one interval with a coverage guarantee"}]}

=== step === concept
::eyebrow The mechanics
## Leave-one-out residuals

The engine is the **leave-one-out residual**. For each home \(i\), fit the model on all the *other* 49 homes, then ask how badly that model misses home \(i\), the one row it never saw:

\[ R_i \;=\; \bigl|\, y_i - \hat\mu_{-i}(x_i) \,\bigr|, \]

where \(y_i\) is home \(i\)'s true price, \(x_i\) is its size, and \(\hat\mu_{-i}\) is the regression fit on every home *except* \(i\). Because home \(i\) was held out, \(R_i\) is an honest out-of-sample error, not an optimistic in-sample one. A straight line is just an intercept and a slope, so we store those two numbers from each of the 50 fits and use them to score the held-out home:

```r
co  <- matrix(NA, nrow = 2, ncol = n)   # row 1 = intercepts, row 2 = slopes; column i = the fit that dropped home i
res <- numeric(n)
for (i in 1:n) {
  fit_i   <- lm(price ~ sqft, data = homes[-i, ])   # fit on the other 49 homes (homes[-i, ] drops row i)
  co[, i] <- coef(fit_i)                            # store this fit's intercept and slope
  pred_i  <- co[1, i] + co[2, i] * homes$sqft[i]    # that model's guess for the home it dropped
  res[i]  <- abs(homes$price[i] - pred_i)           # how far off it was: the leave-one-out residual
}
round(c(median_LOO_residual = median(res)))
#> median_LOO_residual
#>               12928
```

A typical leave-one-out miss is about \$12,900. Those 50 residuals are the raw material: they tell us how wrong an honestly-trained model tends to be on a home it has never seen, which is exactly the uncertainty a prediction interval must capture.

=== step === concept
::eyebrow The interval
## The jackknife+ prediction interval

To predict the new home at \(x = 2000\), each of the 50 leave-one-out models makes its own guess \(\hat\mu_{-i}(x)\), and we attach that model's own residual \(R_i\) as a plus-or-minus. The jackknife+ interval then takes a low quantile of the *downward-nudged* guesses and a high quantile of the *upward-nudged* ones:

\[ \Bigl[\; q^{-}\!\bigl\{\hat\mu_{-i}(x) - R_i\bigr\}, \;\; q^{+}\!\bigl\{\hat\mu_{-i}(x) + R_i\bigr\} \;\Bigr], \]

where \(q^{-}\) is the \(\lfloor \alpha(n+1)\rfloor\)-th smallest value of the lower set and \(q^{+}\) is the \(\lceil (1-\alpha)(n+1)\rceil\)-th smallest of the upper set (\(\lfloor\;\rfloor\) rounds down, \(\lceil\;\rceil\) rounds up). With \(\alpha = 0.10\) and \(n = 50\) that is the 5th smallest and the 46th smallest. In R it is a direct translation:

```r
x_new <- 2000
alpha <- 0.10
mu    <- co[1, ] + co[2, ] * x_new                     # all 50 LOO models predict the new home
lower <- sort(mu - res)[floor(alpha * (n + 1))]        # 5th smallest of (prediction - residual)
upper <- sort(mu + res)[ceiling((1 - alpha) * (n + 1))] # 46th smallest of (prediction + residual)
round(c(lower = lower, upper = upper, width = upper - lower))
#>  lower  upper  width
#> 378344 445975  67632
```

Rohan can quote the 2000 square-foot home at roughly **\$378,000 to \$446,000**. And this interval carries a theorem behind it. Barber and co-authors (2021) proved the jackknife+ covers the true outcome with probability at least \(1 - 2\alpha\):

\[ \mathbb{P}\bigl(\,Y_{\text{new}} \in \hat C(x_{\text{new}})\,\bigr) \;\ge\; 1 - 2\alpha, \]

read as: the chance the real price lands inside the interval \(\hat C\) is at least \(1 - 2\alpha\). Here \(1 - 2(0.10) = 0.80\), a *guaranteed floor*, and in practice the coverage usually runs close to the nominal \(1 - \alpha = 90\%\). Let us see how it stacks against the two intervals you already know:

```r
full <- lm(price ~ sqft, data = homes)
round(predict(full, data.frame(sqft = x_new), interval = "prediction", level = 0.90))
#>      fit    lwr    upr
#> 1 411683 378289 445077
```

The textbook `lm` prediction interval is \$378,289 to \$445,077, almost identical to the jackknife+. That is reassuring, not disappointing: Rohan's market really is close to the straight-line, equal-noise world `lm` assumes, so the two agree. The difference is that the jackknife+ never *assumed* it, and keeps its coverage guarantee even in a market (like Lesson 2's heteroskedastic one) where the `lm` assumption cracks and its neat interval silently under-covers.

Now compare it to split conformal, the other guaranteed interval you know. Split conformal must spend half of Rohan's 50 homes on a calibration set, so it fits on just 25 rows and calibrates on 25:

```r
set.seed(3)
shuffle <- sample(n)
train   <- homes[shuffle[1:25], ]                    # 25 rows to FIT
calib   <- homes[shuffle[26:50], ]                   # 25 rows spent on CALIBRATION, not fitting
f       <- lm(price ~ sqft, data = train)
scores  <- abs(calib$price - predict(f, calib))      # held-out misses
qhat    <- sort(scores)[ceiling((1 - alpha) * (25 + 1))]
round(c(jackknife_plus = upper - lower, split_conformal = 2 * unname(qhat)))
#>  jackknife_plus split_conformal
#>           67632           76833
```

The jackknife+ band is about \$68,000 wide; split conformal's is about \$77,000, a good \$9,000 wider. Both carry a distribution-free guarantee, but split conformal threw away half the data to a calibration slice, giving a weaker model and a noisier quantile. The jackknife+ trained on 49 rows every single time and wasted nothing, so on a small dataset it delivers the tighter interval, the payoff for paying with 50 model fits instead of one.

=== step === concept
::eyebrow Prove the guarantee
## Does the coverage actually hold?

A guarantee on paper is worth checking against fresh data, exactly the empirical-coverage move from Lesson 2. We wrap the interval logic in a function, generate 1000 brand-new homes from the same market, and get each home's own jackknife+ interval:

```r
jack_pi <- function(x) {
  m <- co[1, ] + co[2, ] * x
  c(sort(m - res)[floor(alpha * (n + 1))], sort(m + res)[ceiling((1 - alpha) * (n + 1))])
}
set.seed(99)
M  <- 1000
tx <- round(exp(rnorm(M, log(1500), 0.35)))           # 1000 fresh home sizes
ty <- round(60000 + 175 * tx + rnorm(M, 0, 20000))    # their true prices
bounds <- sapply(tx, jack_pi)                          # a 2-by-1000 grid of intervals
lo <- bounds[1, ]                                       # lower bound for each fresh home
hi <- bounds[2, ]                                       # upper bound for each fresh home
c(test_homes = length(ty), example_low = round(lo[1]), example_high = round(hi[1]))
#>   test_homes  example_low example_high
#>         1000       312178       379810
```

Now `lo` and `hi` hold a jackknife+ interval for every one of the 1000 fresh homes, and `ty` holds their true prices. A home is *covered* when its price falls between its own bounds. In the next step you will count the fraction that did.

=== step === tryit
::eyebrow Your turn
## Measure the empirical coverage

Coverage is the fraction of the 1000 fresh homes whose true price `ty` landed inside their own interval `[lo, hi]`. Build the TRUE/FALSE vector that is `TRUE` when a home is covered, then average it. Fill in the blank.

```r
# fraction of fresh homes whose true price fell inside their jackknife+ interval
coverage <- ____
round(coverage, 3)
```
::check {"regex":"mean\\(\\s*ty\\s*>=\\s*lo\\s*&\\s*ty\\s*<=\\s*hi\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.916. A home is covered when lo <= ty <= hi, so ty >= lo & ty <= hi is a TRUE/FALSE vector and its mean() is the fraction covered. 0.916 clears both the 90% target and the 80% guaranteed floor, the theorem holding up on real draws.","no":"A home is covered when its price sits between its bounds: lo <= ty <= hi. Build the logical vector ty >= lo & ty <= hi and take its mean(): mean(ty >= lo & ty <= hi)."}
::solution
```r
coverage <- mean(ty >= lo & ty <= hi)
round(coverage, 3)
#> [1] 0.916
```

=== step === quiz
::eyebrow Check yourself
## Jackknife+ versus split conformal

Both the jackknife+ and split conformal (Lesson 2) hand you a distribution-free prediction interval with a coverage guarantee. On Rohan's small 50-home dataset, what is the real trade-off between them?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Split conformal is strictly better because the jackknife+ has no coverage guarantee at all ::no Both are guaranteed. In fact split conformal has the slightly stronger marginal guarantee (at least 1 minus alpha). The jackknife+ guarantees at least 1 minus 2 alpha; it is not that it lacks a guarantee, it is a hair weaker on paper.
- The jackknife+ reuses every row via leave-one-out instead of spending a chunk on a calibration split, so on small data it tends to give a tighter interval, at the cost of a slightly weaker guarantee (at least 1 minus 2 alpha) and n model fits ::ok Exactly. Split conformal throws away half of Rohan's 50 rows to calibration, giving a weaker model and a noisier band; the jackknife+ trains on 49 rows every time and wastes nothing, so its interval was tighter here. The price is fitting the model n times and a 1 minus 2 alpha (rather than 1 minus alpha) floor.
- They are identical: both split off a calibration set and read a quantile of held-out residuals ::no Only split conformal uses a single held-out calibration set. The jackknife+ has no fixed split, it rotates leave-one-out over every row, which is precisely why it uses the data more efficiently on small samples.

=== step === concept
::eyebrow Choosing a tool
## Which method, when

You now hold three resampling-flavored tools for uncertainty. They answer different questions, so pick by the question, not by habit.

- **Bootstrap** when you need the uncertainty of a **statistic**, a summary of your data (a mean, median, correlation, a coefficient, a ratio), especially one with no textbook standard-error formula. It gives a standard error and a percentile interval from resampling alone.
- **Jackknife+** when you need a **prediction interval** for a new outcome and your dataset is small enough that you cannot afford to waste rows on a calibration split. It reuses every row via leave-one-out and guarantees at least \(1 - 2\alpha\) coverage.
- **Split conformal** (Lesson 2) when you need a prediction interval and data is plentiful: one held-out split is cheap, gives the stronger \(1 - \alpha\) guarantee, and costs a single model fit instead of \(n\).

[WARNING]
None of these repairs a bad model. Resampling honestly reports the uncertainty *of the model you have*; if that model is biased or mis-specified, the bootstrap and jackknife+ will faithfully quantify a wrong answer's wobble. And all three assume the rows are exchangeable (independent, same distribution): with time series, clustered, or grouped data, plain resampling breaks the guarantee, and you need their dependence-aware cousins (the block bootstrap, grouped or time-series conformal). Honest uncertainty still needs an honest model and honest sampling.

=== step === concept
::eyebrow Go deeper
## References

- [Efron and Tibshirani (1993), An Introduction to the Bootstrap](https://doi.org/10.1201/9780429246593) - the founding, readable book on the bootstrap: resampling, the percentile interval you built, standard errors, and where the method breaks.
- [Barber, Candes, Ramdas and Tibshirani (2021), Predictive inference with the jackknife+, Annals of Statistics](https://doi.org/10.1214/20-AOS1965) - the paper that defines the jackknife+ and proves the at-least 1 minus 2 alpha coverage guarantee you verified.
- [Efron (1979), Bootstrap Methods: Another Look at the Jackknife, Annals of Statistics](https://doi.org/10.1214/aos/1176344552) - the original paper that introduced the bootstrap and connected it to the older jackknife.
- [Canty and Ripley, the boot package reference (CRAN)](https://cran.r-project.org/web/packages/boot/boot.pdf) - the standard R package that automates bootstrap resampling and several interval types when you move beyond hand-written loops.

=== step === complete
## Lesson 6 complete

You got uncertainty almost for free, straight from the data. The **bootstrap** resamples your one dataset with replacement, recomputes a statistic on each resample, and reads its **standard error** and a **percentile interval** off the resulting spread, working even for the median, where no formula exists, and honestly showing when it should not be trusted (extremes like the max, tiny or dependent samples). Then the **jackknife+** turned 50 leave-one-out residuals into a **prediction interval** for one new home, reusing every row instead of wasting a calibration split, with a proven \(1 - 2\alpha\) coverage floor that held up at 91.6% on fresh draws.

Next, Lesson 7: Reporting Uncertainty Honestly. You now have several ways to put a number on what you do not know. The final lesson is about *communicating* it: aleatoric versus epistemic uncertainty, choosing the interval that matches the decision, and stating a range without false precision.
