---
title: "Exploratory Data Analysis Lesson 4: Outlier detection beyond the boxplot"
description: "Go past the boxplot: flag outliers with z-scores, the robust modified z-score (MAD) and Mahalanobis distance in R, then decide to keep, cap or drop them."
keywords: "outlier detection in R, z-score outliers, modified z-score, MAD, median absolute deviation, Mahalanobis distance, multivariate outliers, winsorize, robust statistics"
post_type: "LESSON"
curriculum_id: "2.3.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "4"
course_total: "8"
course_landing: "EDA-Course.html"
course_next: "Categorical-and-Frequency-EDA.html"
course_prev: "Outliers-and-Automated-EDA.html"
---

=== step === cover
::eyebrow Lesson 4 of 8
## Beyond the boxplot

In Lesson 3 you caught Maya's $905 street-festival day with a boxplot and the 1.5 x IQR rule, then chose, on purpose, to keep it with robust summaries. That worked because you could SEE the lone dot. But real data does not always announce itself: some outliers hide behind a second extreme value, and some are invisible to any single-column rule, surfacing only when you look at two variables at once.

This lesson hands you the numeric tools the eye cannot supply. The scatter below plots all 30 of Maya's March days, daily revenue against the number of customers through the door (foot traffic). Most days climb a tidy line, more customers, more revenue. A few do not, and by the end you will have a rule for each kind.

By the end of this lesson you will be able to:

- Flag outliers with the **z-score**, and explain the trap that makes it miss real ones
- Use the robust **modified z-score** (built on the median and MAD) to catch what the z-score masks
- Spot a **multivariate outlier**, a day that is normal on every variable alone but wrong in combination, with **Mahalanobis distance**
- Decide what to do, keep, cap or drop, and measure exactly how each choice moves your numbers

**Prerequisites:** you can run R, and you have met one-variable EDA (the histogram, mean vs median, the IQR and the boxplot) in [Lesson 1](An-EDA-Framework-and-One-Variable.html), correlation in [Lesson 2](Two-Variables-and-Correlation-in-R.html), and the keep/cap/drop decision in [Lesson 3](Outliers-and-Automated-EDA.html). Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":110,"y":215},{"x":130,"y":250},{"x":95,"y":185},{"x":150,"y":290},{"x":175,"y":335},{"x":120,"y":230},{"x":150,"y":280},{"x":140,"y":270},{"x":160,"y":300},{"x":125,"y":240},{"x":100,"y":195},{"x":170,"y":320},{"x":135,"y":260},{"x":108,"y":205},{"x":128,"y":245},{"x":165,"y":315},{"x":150,"y":295},{"x":122,"y":235},{"x":132,"y":255},{"x":145,"y":275},{"x":118,"y":225},{"x":158,"y":305},{"x":148,"y":285},{"x":130,"y":250},{"x":168,"y":325},{"x":138,"y":265},{"x":112,"y":215},{"x":250,"y":905},{"x":200,"y":470},{"x":100,"y":395}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

=== step === concept
::eyebrow A number for "far"
## The z-score: how many standard deviations out?

The boxplot is a picture; to flag outliers across a table with fifty columns you need a number. The oldest one is the **z-score**. It rephrases "how far is this value from the rest?" as "how many standard deviations from the mean does it sit?"

Write \(x\) for a single day's revenue, \(\bar{x}\) (read "x-bar") for the mean revenue across all the days, and \(s\) for the standard deviation, the typical distance of a day from that mean. The z-score of that day is

\[ z = \frac{x - \bar{x}}{s} \]

A common rule of thumb flags any day with \(|z| > 3\): more than three typical distances from the centre. Each lesson runs in a fresh R session, so let us build Maya's March here (run this once), then read off the centre and spread:

```r
# 30 March days at Maya's bakery: revenue and foot traffic (customers in the door)
revenue <- c(215, 250, 185, 290, 335, 230, 280, 270, 300, 240,
             195, 320, 260, 205, 245, 315, 295, 235, 255, 275,
             225, 305, 285, 250, 325, 265, 215, 905, 470, 395)
foot_traffic <- c(110, 130, 95, 150, 175, 120, 150, 140, 160, 125,
                  100, 170, 135, 108, 128, 165, 150, 122, 132, 145,
                  118, 158, 148, 130, 168, 138, 112, 250, 200, 100)
bakery <- data.frame(day = 1:30, revenue, foot_traffic)
c(mean = mean(revenue), sd = sd(revenue))
#>      mean        sd
#>  294.5000  129.5573
```

Now apply the rule. We look at the last three days in particular: day 28 is the $905 festival, day 29 a $470 catering order, day 30 a $395 wedding pre-order.

```r
z <- (revenue - mean(revenue)) / sd(revenue)   # standard deviations from the mean
round(z[c(28, 29, 30)], 2)                      # festival, catering, wedding
#> [1] 4.71 1.35 0.78
which(abs(z) > 3)                               # which days does the 3-SD rule flag?
#> [1] 28
```

The festival day screams out at \(z = 4.71\). But look again: only **one** day is flagged. The genuinely busy $470 catering day, which the boxplot's upper fence of $405 clearly marks as an outlier, slips through at \(z = 1.35\), nowhere near 3. Why?

Because the z-score measures each day against a mean and standard deviation that the outliers themselves have already inflated. That single $905 day dragged \(s\) up to about 130. Drop it and recompute the catering day's z-score:

```r
# the $470 day IS an outlier (it is past the boxplot fence of $405). why did z miss it?
rev_no_festival <- revenue[-28]                 # remove the one extreme day
round((470 - mean(rev_no_festival)) / sd(rev_no_festival), 2)
#> [1] 3.27
```

Now it clears the bar at \(z = 3.27\). The festival day was **masking** the catering day: one extreme value swelled the standard deviation so much that a second real outlier looked ordinary. This is the z-score's fatal flaw, and it bites hardest exactly when you have more than one outlier, which is most of the time. The histogram makes the lopsidedness plain, the festival stranded alone in the far-right bin.

::widget chart-plotter {"data":[{"x":215},{"x":250},{"x":185},{"x":290},{"x":335},{"x":230},{"x":280},{"x":270},{"x":300},{"x":240},{"x":195},{"x":320},{"x":260},{"x":205},{"x":245},{"x":315},{"x":295},{"x":235},{"x":255},{"x":275},{"x":225},{"x":305},{"x":285},{"x":250},{"x":325},{"x":265},{"x":215},{"x":905},{"x":470},{"x":395}],"geoms":["histogram"],"x":"revenue","y":"count","code":{"histogram":"ggplot(bakery, aes(revenue)) +\n  geom_histogram(bins = 8)"}}

=== step === quiz
::eyebrow Check yourself
## Why did the z-score miss the catering day?

The boxplot fence and your eyes both flag the $470 catering day as a genuine outlier, yet the 3-SD rule gave it \(z = 1.35\) and waved it through. What went wrong?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The $470 day is not really an outlier; the z-score is right and the boxplot is too sensitive ::no It IS a real outlier: it sits above the boxplot's upper fence of $405, and dropping the festival day lifts its z-score to 3.27. The z-score missed it for a different reason.
- The extreme $905 day inflated the mean and standard deviation, so the SD the z-score divides by grew too large for the $470 day to look unusual ::ok Exactly. That is masking: one big outlier swells \(s\), a second genuine outlier is then measured against that bloated yardstick, and its z-score shrinks below the cut-off.
- The 3-SD rule can only ever flag the single most extreme value in a dataset ::no Nothing limits it to one value; with a robust scale (next step) it flags both. The real problem is that the non-robust standard deviation was inflated by the festival day.

=== step === concept
::eyebrow The robust fix
## Modified z-score: measure from the median, with MAD

The cure is to measure the spread with numbers an outlier cannot inflate. The mean and standard deviation are fragile; the **median** and the **MAD** are not.

The **median** \(\tilde{x}\) (read "x-tilde") is the middle value: half the days fall below it, half above, and one huge day cannot drag it. The **MAD**, or **median absolute deviation**, applies that same idea to spread: take each day's distance from the median, \(|x_i - \tilde{x}|\), then take the median of THOSE distances. One huge day makes one huge distance, but the median of the distances ignores it.

The **modified z-score** rebuilds the z-score on these robust parts:

\[ M_i = \frac{0.6745\,(x_i - \tilde{x})}{\text{MAD}} \]

The constant \(0.6745\) rescales MAD so that, for ordinary bell-shaped data, \(M_i\) lands on the same footing as a normal z-score; the usual cut-off is \(|M_i| > 3.5\). R's `mad()` already folds in that constant, so the whole thing is just `(x - median(x)) / mad(x)`.

```r
c(sd = sd(revenue), mad = mad(revenue))         # the fragile scale vs the robust one
#>       sd      mad
#> 129.5573  51.8910
mod_z <- (revenue - median(revenue)) / mad(revenue)
round(mod_z[c(28, 29, 30)], 2)                  # festival, catering, wedding
#> [1] 12.29  3.90  2.46
```

The standard deviation is about $130, but the MAD-based scale is only about $52: the festival day inflated `sd` to two and a half times the robust spread, while `mad` barely budged. Measured against that honest yardstick, **both** outliers now clear the cut-off, the festival at 12.29 and the masked catering day at 3.90, while the ordinary-looking wedding day stays quietly inside at 2.46. The table lays the contrast side by side.

[NOTE]
Robust does not mean magic. The median and MAD tolerate up to half the data being outliers before they break down, far better than the mean and SD that a single bad value can wreck. But if MAD itself is zero (more than half your values are identical) the modified z-score is undefined. For everyday data with a handful of outliers, it is the reliable workhorse.

::widget table-transform {"code":"bakery %>%\n  mutate(z = (revenue - mean(revenue)) / sd(revenue),\n         mod_z = (revenue - median(revenue)) / mad(revenue))","caption":"The z-score misses the catering day (z = 1.35); the modified z-score catches it (3.90).","before":{"cols":["day","revenue"],"rows":[["Mar 9",300],["Mar 28",905],["Mar 29",470],["Mar 30",395]]},"after":{"cols":["day","revenue","z","mod_z","caught by"],"rows":[["Mar 9",300,"0.04","0.63","none"],["Mar 28",905,"4.71","12.29","z and MAD"],["Mar 29",470,"1.35","3.90","MAD only"],["Mar 30",395,"0.78","2.46","none"]]}}

=== step === tryit
::eyebrow Your turn
## Flag both outliers, robustly

Compute the modified z-score for every day and list the ones past the 3.5 cut-off. Fill in the robust scale function that turns an ordinary z-score into a MODIFIED one.

```r
mod_z <- (revenue - median(revenue)) / ____(revenue)
which(abs(mod_z) > 3.5)
```
::check {"regex":"mad\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. mad() is the robust scale; days 28 and 29 (the festival and the catering day) both clear 3.5, including the one the z-score masked.","no":"Use mad(), the median absolute deviation: (revenue - median(revenue)) / mad(revenue)."}
::solution
```r
mod_z <- (revenue - median(revenue)) / mad(revenue)
which(abs(mod_z) > 3.5)
#> [1] 28 29
```

=== step === concept
::eyebrow Outliers you cannot see one column at a time
## When the combination is the problem

Every rule so far reads one column at a time. Some outliers are invisible that way. Look at the last day in March: a wedding pre-order brought in $395 from just 100 customers. Check it column by column and nothing fires, $395 is an ordinary revenue (\(z = 0.78\), well inside the fences) and 100 customers is a slow-but-normal day. Yet the **pair** is bizarre: every other 100-customer day takes about $200, not $395. A small crowd that spent like a large one.

That is a **multivariate outlier**: ordinary on each variable alone, but off the joint pattern the variables usually follow together. In the scatter below (the obvious festival day removed so the rest is readable) it is the highlighted point floating high above the trend on the left, far from the line every other day hugs.

::widget chart-plotter {"data":[{"x":110,"y":215,"fill":"typical day"},{"x":130,"y":250,"fill":"typical day"},{"x":95,"y":185,"fill":"typical day"},{"x":150,"y":290,"fill":"typical day"},{"x":175,"y":335,"fill":"typical day"},{"x":120,"y":230,"fill":"typical day"},{"x":150,"y":280,"fill":"typical day"},{"x":140,"y":270,"fill":"typical day"},{"x":160,"y":300,"fill":"typical day"},{"x":125,"y":240,"fill":"typical day"},{"x":100,"y":195,"fill":"typical day"},{"x":170,"y":320,"fill":"typical day"},{"x":135,"y":260,"fill":"typical day"},{"x":108,"y":205,"fill":"typical day"},{"x":128,"y":245,"fill":"typical day"},{"x":165,"y":315,"fill":"typical day"},{"x":150,"y":295,"fill":"typical day"},{"x":122,"y":235,"fill":"typical day"},{"x":132,"y":255,"fill":"typical day"},{"x":145,"y":275,"fill":"typical day"},{"x":118,"y":225,"fill":"typical day"},{"x":158,"y":305,"fill":"typical day"},{"x":148,"y":285,"fill":"typical day"},{"x":130,"y":250,"fill":"typical day"},{"x":168,"y":325,"fill":"typical day"},{"x":138,"y":265,"fill":"typical day"},{"x":112,"y":215,"fill":"typical day"},{"x":200,"y":470,"fill":"typical day"},{"x":100,"y":395,"fill":"wedding day"}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

To catch it we need a distance that knows about that trend. **Mahalanobis distance** measures how far a point sits from the centre of the cloud while accounting for the spread of each variable AND their correlation. For a day \(\mathbf{x}\) (its revenue and foot traffic together), with \(\boldsymbol{\mu}\) the mean of each variable and \(\Sigma\) (Sigma) the covariance matrix that encodes their spread and correlation,

\[ D^2 = (\mathbf{x} - \boldsymbol{\mu})^{\top}\,\Sigma^{-1}\,(\mathbf{x} - \boldsymbol{\mu}) \]

A large \(D^2\) means "far from the cloud in a way the correlation does not explain." When the data is roughly bell-shaped, \(D^2\) follows a chi-squared distribution with one degree of freedom per variable, so a standard cut-off flags any day past the 97.5th percentile of that distribution.

```r
vars   <- bakery[, c("revenue", "foot_traffic")]
d2     <- mahalanobis(vars, colMeans(vars), cov(vars))  # squared distance, scaled for correlation
cutoff <- qchisq(0.975, df = 2)                 # 2 variables -> 2 degrees of freedom
round(cutoff, 2)
#> [1] 7.38
which(d2 > cutoff)                              # the multivariate outliers
#> [1] 28 30
round(d2[c(28, 29, 30)], 2)                     # festival, catering, wedding
#> [1] 23.07  3.43 12.30
```

Days 28 and 30, the festival and the wedding, clear the cut-off of 7.38. The catering day (29) does NOT: with $470 from 200 customers it is a big day, but a CONSISTENT one, sitting right on the revenue-to-customers line, so it is no multivariate outlier even though it was a univariate one. Three days, three different stories.

[WARNING]
Mahalanobis distance estimates \(\boldsymbol{\mu}\) and \(\Sigma\) from the very data you are screening, so a cluster of outliers can distort the cloud and hide itself, masking again, now in two dimensions. It also assumes a single roughly elliptical blob; for clumpy or curved data, reach for a robust covariance (`MASS::cov.rob`) or a density-based method.

=== step === quiz
::eyebrow Check yourself
## Can an ordinary value be an outlier?

The wedding day had a perfectly ordinary revenue ($395) and a perfectly ordinary customer count (100). Neither column, on its own, flags it. Can it still be an outlier?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Yes: each value is normal alone, but the COMBINATION, high revenue from very few customers, is unusual, and that is exactly what Mahalanobis distance detects ::ok Right. Outlierness can live in the relationship between variables, not in any single one. Column-by-column rules are blind to it; a multivariate distance is not.
- No: if a point is within the normal range on every individual variable, it cannot be an outlier ::no This is the trap. A day can sit inside every single-column range yet still break the pattern the columns follow together, like taking $395 from only 100 customers.
- Only if revenue and foot traffic are uncorrelated ::no It is the opposite: BECAUSE they are strongly correlated, a point that violates the relationship stands out. With no correlation there would be no joint pattern to break.

=== step === concept
::eyebrow The decision, with numbers
## Keep, cap, or drop, and what each does

Detection is only half the job; Lesson 3 gave you the menu, investigate, then keep, cap, transform or drop. Here is what those choices actually DO to your headline numbers, so you can choose with your eyes open. Take Maya's confirmed-genuine festival day:

- **Keep it, report robust summaries.** The median and a trimmed mean (the mean after dropping the most extreme few percent at each end) shrug the outlier off, so lead with them.
- **Cap it (winsorize).** Pull any value past the fence back to the fence, here $405. The row stays; its pull on the average is capped.
- **Drop it.** Only for a confirmed error, or a question that genuinely excludes it, and always with a written reason.

Watch the mean and standard deviation move under each choice, while the robust median barely flinches:

```r
upper <- as.numeric(quantile(revenue, 0.75) + 1.5 * IQR(revenue))   # 405, the upper fence
round(c(raw_mean      = mean(revenue),
        capped_mean   = mean(pmin(revenue, upper)),   # winsorize to the fence
        dropped_mean  = mean(revenue[-28]),           # drop the festival day
        median        = median(revenue)), 1)
#>     raw_mean   capped_mean  dropped_mean        median
#>        294.5         275.7         273.4         267.5
```

```r
round(c(raw = sd(revenue),
        capped = sd(pmin(revenue, upper)),
        dropped = sd(revenue[-28])), 1)
#>     raw  capped dropped
#>   129.6    57.8    60.1
```

The plain mean swings from $294.50 down to about $276 (cap) or $273 (drop), and the standard deviation collapses from $130 to under $60, a different "typical day" depending entirely on a choice you must make deliberately. The median sits at $267.50 throughout, which is why robust summaries are the safest default. Capping, shown below, keeps the row but limits its reach.

::widget table-transform {"code":"bakery %>%\n  mutate(capped = pmin(revenue, 405))","caption":"Winsorize pulls every value above the 405 fence down to 405; ordinary days are untouched.","before":{"cols":["day","revenue"],"rows":[["Mar 9",300],["Mar 28",905],["Mar 29",470]]},"after":{"cols":["day","revenue","capped"],"rows":[["Mar 9",300,300],["Mar 28",905,405],["Mar 29",470,405]]}}

=== step === tryit
::eyebrow Your turn
## Winsorize the festival day

Cap every value at the upper fence so no single day can dominate the mean, then compare the capped mean to the raw one. Fill in the function that returns the smaller of each value and the fence.

```r
upper <- as.numeric(quantile(revenue, 0.75) + 1.5 * IQR(revenue))   # 405, the upper fence
capped <- ____(revenue, upper)
round(c(raw = mean(revenue), capped = mean(capped)), 1)
```
::check {"regex":"pmin\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. pmin(revenue, upper) caps each day at the fence, pulling the mean from 294.5 down to 275.7 without deleting a single row.","no":"Use pmin(), the parallel minimum: pmin(revenue, upper) returns the smaller of each value and the fence."}
::solution
```r
upper <- as.numeric(quantile(revenue, 0.75) + 1.5 * IQR(revenue))
capped <- pmin(revenue, upper)
round(c(raw = mean(revenue), capped = mean(capped)), 1)
#>    raw capped
#>  294.5  275.7
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Leys et al. (2013), Detecting outliers: do not use standard deviation around the mean, use absolute deviation around the median](https://doi.org/10.1016/j.jesp.2013.03.013) - the published case for the median and MAD over the mean and SD, the exact masking problem you saw here.
- [NIST/SEMATECH e-Handbook: detection of outliers](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) - the formal catalogue, from boxplot fences to Grubbs' test, and when each one applies.
- [R for Data Science (2e): Exploratory Data Analysis, "Unusual values"](https://r4ds.hadley.nz/eda) - spotting and honestly handling outliers in a tidyverse workflow.
- [R documentation: mad()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mad.html) - the robust scale behind the modified z-score, including its 1.4826 constant.
- [R documentation: mahalanobis()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/mahalanobis.html) - the multivariate distance you used, with its arguments and defaults.

=== step === complete
## Lesson 4 complete

You now have a numeric toolkit for outliers, not just an eye. You met the z-score and its masking trap, fixed it with the robust modified z-score built on the median and MAD, caught a day that no single column could flag using Mahalanobis distance, and measured exactly how keeping, capping or dropping a value reshapes the mean and standard deviation.

Next, Lesson 5: Categorical and frequency EDA. Numbers are only half of most datasets. You will turn the same careful eye on categories, with frequency and proportion tables, two-way cross-tabs, and the rare or mislabelled levels that quietly break a model before it ever runs.
