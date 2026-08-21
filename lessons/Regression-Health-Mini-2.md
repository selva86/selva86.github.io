---
title: "Autocorrelation in residuals: how to test and fix it"
slug: "Regression-Health-Mini-2"
description: "A model that overshoots in November tends to overshoot in December too. Test those trailing errors with Durbin-Watson, watch what breaks, then repair it."
keywords: "autocorrelation in residuals, durbin-watson test in R, dwtest, breusch-godfrey test, serial correlation, newey-west standard errors, AR(1) errors, regression diagnostics"
mathjax: true
webr: true
date: "2026-08-22"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "2"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-1"
course_next: ""
curriculum_id: "0.0.19"
lesson_access: "windowed"
catalog_blurb: "How to test residuals that are ordered in time, and fix what breaks."
---

=== step === cover
::eyebrow Regression Health Check
## Autocorrelation in residuals: how to test and fix it

Let's say you fit a regression on monthly sales. One row per month, ten years of them, and the model predicts revenue from what the shop spent on advertising.

In November the model comes in too high. It expected more revenue than the shop actually took.

Now, what does that tell you about December?

If the months were independent of each other, the answer is nothing at all. November's miss would be its own private accident and December would start from a clean slate.

But months are not independent. Whatever pushed November up, a promotion that ran long, a competitor who closed, a season that arrived late, is usually still around in December. So the model overshoots again.

Errors that lean on the errors before them are called autocorrelated, and they break one of the assumptions regression relies on.

The damage here is easy to miss. The coefficient stays fine. R-squared stays fine. The residual plot everybody checks stays fine. What breaks is the standard error, and through it the t-statistic and the p-value, which come back far more confident than they have earned.

Today we are going to do three things with one shop.

::widget process-flow {"steps":[{"title":"See the runs","sub":"put the residuals back in month order and look at them"},{"title":"Test them","sub":"one number from the residuals, plus a p-value beside it"},{"title":"Repair the damage","sub":"widen the standard error, or model the carry-over itself"}]}

Let's get the shop on the table.

=== step === concept
## Ten years of one shop's monthly sales

Every number from here on comes out of one small table, so let's build it first.

It is one store with one row per month, 120 months of trading in all. Two columns do the work. `ad_spend` is what the shop put into advertising that month, in thousands, and `revenue` is what came back, also in thousands.

We are going to build the data rather than download it, and that is deliberate. When you build it yourself you know the true answer, so when a test tells you something later, you can check whether the test was right.

Two facts about real shops go into the recipe. Ad budgets do not jump around at random: a shop that spent 20 in March spends something near 20 in April. And the part of revenue that advertising does not explain, which we will call the error, behaves the same way. A good month leaves the shop a little ahead, and the next month starts from there.

Press Run.

```r
# Build 120 months of one shop's ad spend and revenue, both in thousands
set.seed(93)
n <- 120

ad_spend <- numeric(n)
ad_spend[1] <- 14
for (t in 2:n) {
  ad_spend[t] <- 14 + 0.90 * (ad_spend[t - 1] - 14) + rnorm(1, sd = 6)
}
ad_spend <- round(ad_spend, 1)

sales_error <- numeric(n)
sales_error[1] <- rnorm(1, sd = 6)
for (t in 2:n) {
  sales_error[t] <- 0.85 * sales_error[t - 1] + rnorm(1, sd = 6)
}

store <- data.frame(
  month    = 1:n,
  ad_spend = ad_spend,
  revenue  = round(40 + 0.9 * ad_spend + sales_error, 1)
)

head(store, 6)
#>   month ad_spend revenue
#> 1     1     14.0    56.8
#> 2     2     12.1    54.4
#> 3     3      8.3    57.9
#> 4     4     13.2    76.7
#> 5     5     18.8    83.9
#> 6     6     23.4    96.0
```

Read the first loop as a sentence: this month's budget is 14, plus 90% of however far last month sat from 14, plus a fresh random nudge. That is why the budget drifts rather than jumping. The nudge is `rnorm(1, sd = 6)`, one draw from a normal distribution with a standard deviation of 6.

The second loop has the same shape and it is the one that matters. Each month's error keeps 85% of last month's error and adds something new. A series built that way is called an AR(1) series, short for autoregressive of order 1, which just means every value is built out of the one before it.

Now look at the line that makes revenue: `40 + 0.9 * ad_spend + sales_error`. Every extra thousand the shop spends on advertising brings back 0.9 thousand. That 0.9 is the truth, and we are going to check every answer against it.

Here is what ten years of it looks like.

```r
# Plot revenue in the order it actually happened
plot(store$month, store$revenue, type = "l", lwd = 2, col = "steelblue",
     main = "Ten years of monthly revenue",
     xlab = "Month", ylab = "Revenue (thousands)")
```

Nothing looks alarming there. Revenue wanders between about 16 and 101 and never runs away. This is what an ordinary business series looks like.

=== step === concept
## The model that says the ads are working

Now let's do the ordinary thing with a table like this. Fit revenue on ad spend and read the answer off the output.

```r
# Fit revenue on ad spend and read the slope, its standard error and its p-value
m <- lm(revenue ~ ad_spend, data = store)

summary(m)
#>
#> Call:
#> lm(formula = revenue ~ ad_spend, data = store)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -29.766  -8.145   0.454   7.905  35.298
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  35.0248     2.8706   12.20   <2e-16 ***
#> ad_spend      1.2631     0.1134   11.14   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 13.59 on 118 degrees of freedom
#> Multiple R-squared:  0.5125,	Adjusted R-squared:  0.5083
#> F-statistic:   124 on 1 and 118 DF,  p-value: < 2.2e-16
```

Three numbers in there are worth your attention.

The `Estimate` for `ad_spend` is 1.2631. The model believes every extra thousand of advertising brings back 1.26 thousand.

The `Std. Error` beside it is 0.1134. That is the model's own statement of how much its estimate would wobble if you ran the shop again, and a small one means the model is confident.

Then `Pr(>|t|)` comes in under 2e-16, which is R saying the p-value is smaller than it bothers to print. The R-squared of 0.5125 says the model accounts for about half the variation in revenue.

By every convention people use, that is a result. Advertising works, the effect is 1.26, and you could put it on a slide tomorrow.

Now ask the model for its interval.

```r
# The 95% confidence interval for each coefficient
confint(m)
#>                2.5 %    97.5 %
#> (Intercept) 29.34023 40.709455
#> ad_spend     1.03848  1.487639
```

The ad slope's interval runs from 1.0385 to 1.4876. We happen to know the true answer is 0.9, and the interval does not contain it. It does not come near containing it.

One miss on its own proves nothing. A 95% interval is built to miss the truth about one time in twenty, so misses are part of the deal. Hold the thought anyway, because we are going to rebuild this shop 2,000 times and count how often it happens.

=== step === concept
## What a regression assumes about November and December

Every regression carries assumptions, and the one about to break here is independence.

In plain words, independence says this: knowing how wrong the model was this month tells you nothing about how wrong it will be next month. Each miss is its own accident, unconnected to the one before it.

That quantity, how wrong the model was in one month, has a proper name. It is called the residual: what the shop actually took that month, minus what the model predicted it would take. A residual of plus 12 means the shop beat the prediction by 12 thousand, and a residual of minus 12 means the model was 12 thousand too optimistic.

Notice that the assumption is not about the size of the errors. Errors are allowed to be large. What they are not allowed to do is carry news about each other.

And here is the problem. The diagnostic plot almost everybody looks at cannot tell you whether it holds.

```r
# The residual plot most people check: residuals against fitted values
plot(m, which = 1)
```

That looks healthy, and on the two things it can see, it genuinely is. The points spread about the same amount all the way across, so the size of the errors is not growing with the size of the prediction. The red trend line through them stays roughly flat, so the relationship is not bending into a curve.

But look at what the two axes are. One is the fitted value and the other is the residual. Neither of them is time. The months have been rearranged into whatever order the fitted values put them in, so a plot like this can never answer a question about November and December.

=== step === concept
## Put the residuals back in month order

These are the same residuals with one change. Put them back in the order they happened, and count how often they cross zero on the way.

```r
# Put the same residuals back in month order and count the crossings
res <- resid(m)

plot(store$month, res, type = "b", pch = 16, cex = 0.6, col = "grey35",
     main = "The same residuals, in the order they happened",
     xlab = "Month", ylab = "Residual (thousands)")
abline(h = 0, col = "red", lwd = 2)

sum(diff(sign(res)) != 0)
#> [1] 20
```

That is a completely different picture, and not one residual changed. Only the ordering did.

The misses arrive in runs. The line climbs above zero and stays up there for a year at a stretch, then crosses and stays below for a long spell after that. In 120 months it crosses the red line 20 times.

So what does 20 mean? If each month's miss were a fresh coin flip about which side of the line it landed on, any two neighbouring months would disagree about half the time, so you would expect roughly 60 crossings out of the 119 chances available. We got 20.

Runs on the same side of zero are the signature of positive autocorrelation, which is the everyday case: a month that was too high is usually followed by another month that is too high.

[KEY INSIGHT]
Ordering by time is the whole diagnostic. The residuals hold the same information whichever way you arrange them, and only the time order lets you see whether one miss carries news about the next.

=== step === concept
## This month's miss against last month's miss

A picture is convincing, but it is not a number. Let's turn those runs into one.

If each miss really does carry news about the next, then plotting every month's residual against the residual before it should show a clear upward slope.

Lining the pairs up takes one small trick. `res[-n]` is the residuals with the last one dropped, and `res[-1]` is the residuals with the first one dropped. Put those two side by side and every month is paired with its immediate neighbour.

```r
# Plot each month's miss against the month before it, then measure the link
plot(res[-n], res[-1], pch = 16, col = "grey35",
     main = "Each month's miss against the one before",
     xlab = "Residual last month", ylab = "Residual this month")
abline(lm(res[-1] ~ res[-n]), col = "red", lwd = 2)

round(cor(res[-n], res[-1]), 3)
#> [1] 0.875
```

The points climb from bottom left to top right, and the correlation is 0.875. That number has a name: the lag-1 autocorrelation, so called because it compares each value with the one a single step back.

To put 0.875 in perspective, a correlation of 0 is the independence the model assumed, and 1 would mean each month's miss is an exact copy of the one before. This shop is much closer to the copy than to independence.

=== step === quiz
## Quick check: what a long run of overshoots means

The residual plot in month order sat above zero for a stretch of a year and more before it came back down. What does a run like that actually tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The line is fitted too low, so the intercept needs raising by about the size of the run. ::no
- The ad slope is too big, and that is what keeps pushing the misses onto one side. ::no
- Neighbouring errors are related, so this month's miss tells you something real about next month's. That is the independence assumption breaking. ::ok Exactly right. A run is not one big error. It is many errors that agree with each other, and agreement between neighbours is precisely what independence says will not happen.
- Nothing much. Residuals come in runs in every regression, and 120 months is a small sample. ::no A run is not about the level of the line, and it is not about the size of the slope. Fitting by least squares already forces the residuals to average out to zero, so no run can be cured by moving the intercept up or down. It is not something every regression does either: independent misses cross the zero line about half the time, and these crossed it 20 times in 120 months. What a run tells you is that neighbouring errors agree with each other.

=== step === concept
## The Durbin-Watson statistic, worked out by hand

You now have a number for the problem, 0.875. There is a second number for it that gets reported far more often, and you will see it printed all over regression output.

It is called the Durbin-Watson statistic, usually written as \(d\), and the idea behind it is simple. Walk along the residuals in time order, and at each step measure the gap between this residual and the one before it. If neighbours are alike, those gaps are small. If neighbours have nothing to do with each other, the gaps are big.

The formula does exactly that, then divides by the overall size of the residuals so the answer does not depend on the units.

\[ d = \frac{\sum_{t=2}^{n} (e_t - e_{t-1})^2}{\sum_{t=1}^{n} e_t^2} \]

Take it one symbol at a time. \(e_t\) is the residual in month \(t\), and \(e_{t-1}\) is the residual in the month before it. The top adds up the squared gaps between every pair of neighbours. The bottom adds up the squared residuals themselves. The squaring is there so a miss of minus 9 counts the same as a miss of plus 9.

In R that is one line, because `diff()` already gives you the gaps between neighbours.

```r
# Work out the Durbin-Watson statistic straight from the residuals
sum(diff(res)^2) / sum(res^2)
#> [1] 0.2479601
```

So \(d\) is 0.248 for this shop. Now, what counts as a bad one?

Work out three cases and the whole scale falls out.

1. If every residual were an exact copy of the one before, each gap would be 0, the top of the fraction would be 0, and \(d\) would be 0.
2. If neighbours had nothing to do with each other, the squared gap between two of them would average out to twice the size of a squared residual, so the top would be about twice the bottom and \(d\) would land near 2.
3. If the misses alternated perfectly, plus then minus then plus, every gap would be twice as wide as the residuals themselves, and \(d\) would climb toward 4.

That is the whole scale. It runs from 0 to 4, with 2 as the no-correlation mark, below 2 meaning misses that come in runs, and above 2 meaning misses that flip sign every month.

There is also a shortcut that ties this back to the correlation you already measured.

```r
# The same statistic again, from the lag-1 correlation
2 * (1 - cor(res[-n], res[-1]))
#> [1] 0.2504172
```

0.2504 against the 0.2480 the full formula gave. The two agree closely because \(d\) is very nearly \(2(1 - r)\), where \(r\) is the lag-1 correlation. The small gap between them comes from the endpoints, since the top of the fraction has 119 terms and the bottom has 120.

=== step === tryit
## Your turn: what Durbin-Watson gives when the months are scrambled

If \(d\) really is measuring the time order, then destroying the order should destroy the number.

So take the same 120 residuals and shuffle them into a random arrangement. Not one value changes, only their positions do. Work out the same statistic on the shuffled version and see where it lands.

```r
# res holds the 120 residuals in the order the months happened.
# Shuffle them with set.seed(2) so your answer matches mine,
# then work out the same statistic on the shuffled residuals:
# the summed squared gaps between neighbours, over the summed squares.
# Two lines. Press Check when you have them.
```
::check {"regex": "sample\\s*[(][\\s\\S]*diff\\s*[(]", "gate": true, "difficulty": "beginner", "ok": "It comes back at 1.84, which is nearly 2. Not one residual changed, only the order did, and the statistic moved from 0.25 to 1.84. It was never measuring the residuals. It was measuring their arrangement in time.", "no": "Shuffle first, then reuse the line you already ran. Start with set.seed(2), then shuffled <- sample(res), then sum(diff(shuffled)^2) / sum(shuffled^2)."}
::solution
```r
# Scramble the month order, then run the same computation again
set.seed(2)
shuffled <- sample(res)

sum(diff(shuffled)^2) / sum(shuffled^2)
#> [1] 1.844129
```

1.84 is what no dependence looks like. It is not exactly 2, because 120 shuffled numbers still line up by luck a little, and a different seed would give you a slightly different answer near the same place.

=== step === concept
## One line of R gives the same number and a p-value

You never have to compute \(d\) by hand. The `lmtest` package has it, and it adds the thing the hand computation could not give you, which is a p-value.

```r
# The same statistic and a p-value for it, in one line
suppressMessages(library(lmtest))

dwtest(m)
#>
#>	Durbin-Watson test
#>
#> data:  m
#> DW = 0.24796, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

DW = 0.24796, exactly the number the formula gave. The p-value answers a specific question: if neighbouring errors truly had nothing to do with each other, how often would a shop like this hand you a statistic this far below 2? That probability comes in under 2.2e-16, which is R's way of saying essentially never.

Read the last line too, because people skip it and then misread the test. The default alternative is "greater than 0", meaning `dwtest()` is looking only for positive autocorrelation, the runs case. That is the sensible default for time-ordered data, and it is why a \(d\) well above 2 will not raise a flag here unless you ask for it with `alternative = "two.sided"`.

=== step === concept
## How often does this call a dead campaign a winner?

One interval missing the truth proves nothing on its own. So let's stop arguing about one shop and build 2,000 of them.

It is the same recipe as before, with one change that settles the question. The ad effect is set to exactly zero, so advertising does nothing at all in any of these 2,000 shops. Revenue is a baseline plus an error that carries over month to month, and that is all it is.

Then we fit the same regression on each shop and keep the p-value for the ad slope. If the test is behaving, a threshold of 0.05 should let through about 5 in every 100, so about 100 of the 2,000.

This one takes about ten seconds to run, because it is fitting 2,000 regressions.

```r
# Rebuild the shop 2,000 times with the ad effect switched off, and keep every p-value
one_shop <- function() {
  ad <- numeric(120)
  ad[1] <- 14
  for (t in 2:120) ad[t] <- 14 + 0.90 * (ad[t - 1] - 14) + rnorm(1, sd = 6)

  err <- numeric(120)
  err[1] <- rnorm(1, sd = 6)
  for (t in 2:120) err[t] <- 0.85 * err[t - 1] + rnorm(1, sd = 6)

  dead_revenue <- 40 + 0 * ad + err
  summary(lm(dead_revenue ~ ad))$coefficients["ad", "Pr(>|t|)"]
}

set.seed(7)
many_p <- replicate(2000, one_shop())

hist(many_p, breaks = 40, col = "grey85", border = "white",
     main = "2,000 shops whose advertising did nothing",
     xlab = "p-value for the ad slope")
abline(v = 0.05, col = "red", lwd = 3)

sum(many_p < 0.05)
#> [1] 899
```

899 out of 2,000, where 100 was the promise. That is 45% of the shops, near enough nine times what the threshold advertised.

Look at the shape of the pile as well. When a test is behaving and nothing is going on, its p-values spread out evenly across the whole range, so 0.02 turns up about as often as 0.72. This pile is not flat at all. It is heaped up hard against the left edge, which is what a test looks like when it is systematically too eager to declare a finding.

[WARNING]
Autocorrelated errors do not make your p-values a little worse. In this run they turned a 5% false-alarm rate into a 45% one. A campaign that did precisely nothing was called a success almost half the time, and every one of those 899 shops handed its analyst a p-value they would have reported without a second thought.

=== step === widget
## The interval falls apart while the fit sits still

You have seen what happens at one setting of the carry-over, 0.85. Now watch the whole range, because the pattern across it is what catches people out.

The dial below controls one thing: phi, the AR(1) correlation between neighbouring errors, from 0 at the left, where the assumption holds perfectly, up to 0.92 at the right. At every setting it runs 2,000 complete studies in which the true slope is known in advance, then reports two numbers.

The first is coverage, the share of those 2,000 studies whose 95% confidence interval actually contained the true slope. That is what a 95% interval promises, so this line should sit at 95 and stay there.

The second is R-squared, the fit statistic you would look at in the output.

::widget assumption-dial {"assumption": "autocorrelation", "levels": 11, "start": 0}

Drag it from left to right and watch the two lines separate.

Coverage starts where it should and then falls away. By the far right, an interval sold to you as a 95% interval is catching the truth nowhere near 95% of the time, and the individual study intervals underneath show you why. They are far too narrow, so they sit confidently around the wrong place.

Now watch R-squared while you do it. Across most of the dial it barely moves, and at the far right it edges up rather than down. Stay on that for a second. The number people quote to say how healthy a model is holds steady, and then improves slightly, while the interval beside it quietly stops being true.

It is not being coy. R-squared measures how much of revenue the line accounts for. Whether this month's miss resembles last month's is a different question, and no fit statistic was ever asked it.

That is the whole reason this problem survives in the wild. Nothing on the output complains. The fit holds, the coefficient looks reasonable, and the only thing that broke is invisible unless you go looking for it.

=== step === quiz
## Quick check: what autocorrelation actually damages

Coverage fell away on the dial while the fit statistic sat there untroubled. Which statement matches what it showed?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The estimated slope gets pushed away from the truth, so the coefficient itself becomes biased. ::no
- The estimate stays centred on the truth. What breaks is the standard error, and with it the t-statistic, the p-value and the interval. ::ok That is it. Least squares still aims at the right answer. It just reports far less uncertainty than it actually has, which is why the intervals come out too narrow and the p-values come in too small.
- R-squared collapses, which is the warning sign to watch for in the output. ::no
- The predictions come out wrong, so the model is no longer usable for forecasting. ::no Autocorrelation is a standard-error problem rather than a model problem. The coefficient is still centred on the truth and the predictions are still reasonable, which is exactly why the fit statistic stays healthy or even improves. The casualty is the uncertainty statement: standard errors, t-statistics, p-values and confidence intervals.

=== step === concept
## Where Durbin-Watson stops working

Durbin-Watson is a good test, but it has two blind spots, and you want to know both before you lean on it.

The first is that it only ever looks one month back. It compares each residual with its immediate neighbour and nothing else. Monthly data often carries a yearly echo, where the residual for this January resembles last January rather than last December, and a test that only checks a single step back can walk straight past it.

The second is more serious. When your model has the outcome's own past on the right-hand side, something like last month's revenue used to predict this month's, the Durbin-Watson statistic is pulled toward 2. It reports a clean-looking number whether the errors are correlated or not, so it stops being evidence of anything.

The Breusch-Godfrey test fixes both. It works like this: take the residuals, regress them on their own past values plus all the original predictors, then test whether those past-value coefficients are jointly zero. Because the original predictors sit in that second regression, a lagged outcome causes it no trouble at all.

The joint test it runs is called a Lagrange multiplier test, which is why the output says LM. Read it as one question asked of all the lag terms at once: taken together, do they explain anything about the residuals?

Start with a single lag, so the answer is directly comparable to the number you already have.

```r
# Test the same single lag a different way, with Breusch-Godfrey
bgtest(m, order = 1)
#>
#>	Breusch-Godfrey test for serial correlation of order up to 1
#>
#> data:  m
#> LM test = 92.168, df = 1, p-value < 2.2e-16
```

LM test = 92.168 on 1 degree of freedom, with a p-value under 2.2e-16. Two different tests, and they agree.

=== step === tryit
## Your turn: test twelve lags at once

This shop reports monthly, and monthly data is exactly where a yearly echo can hide. A pattern that repeats every twelve months sits at lag 12, and a single-step test would never see it.

The `order` argument is how many lags Breusch-Godfrey tests together. Ask it for twelve.

```r
# m is the revenue-on-ad-spend model, and lmtest is already loaded.
# The data is monthly, so a yearly echo would sit at lag 12.
# Run Breusch-Godfrey on m, testing all twelve lags together.
# One line. Press Check when you have it.
```
::check {"regex": "bgtest[\\s\\S]*order\\s*=\\s*12", "gate": true, "difficulty": "beginner", "ok": "LM test 94.087 on 12 degrees of freedom, with a p-value near 8e-15. Notice how little it moved from the single-lag number of 92.168: almost all the dependence in this shop lives one step back, and the extra eleven lags add very little to it.", "no": "One call, with the number of lags passed to the order argument: bgtest(m, order = 12)."}
::solution
```r
# Test all twelve monthly lags together
bgtest(m, order = 12)
#>
#>	Breusch-Godfrey test for serial correlation of order up to 12
#>
#> data:  m
#> LM test = 94.087, df = 12, p-value = 7.947e-15
```

There is a cost to asking for more lags. Every extra lag is another thing the test has to estimate, which spreads its attention thinner and makes it harder to detect a real pattern. Test twelve when the data is monthly and four when it is quarterly, because that is where a seasonal echo would sit. Do not throw in fifty and hope.

=== step === concept
## Newey-West: keep the coefficients, widen the standard errors

Two tests agree that the errors carry over. So what do you actually do about it?

The gentlest repair leaves your model completely alone and rebuilds only the standard errors. It is called a Newey-West standard error, or a HAC standard error, where HAC stands for heteroskedasticity and autocorrelation consistent. The idea is that the usual formula counts 120 months as 120 independent pieces of information, and Newey-West counts neighbouring months as the partly repeated information they really are.

Two functions do it together. `NeweyWest()` from the `sandwich` package builds the corrected version, and `coeftest()` from `lmtest` reprints the coefficient table using it.

```r
# Keep the OLS coefficients and rebuild the standard errors to allow for the carry-over
suppressMessages(library(sandwich))

coeftest(m, vcov = NeweyWest(m, prewhite = FALSE))
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value  Pr(>|t|)
#> (Intercept)  35.0248     7.6165  4.5985 1.077e-05 ***
#> ad_spend      1.2631     0.2383  5.3003 5.456e-07 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Compare it column by column against the original output.

The estimate is 1.2631, exactly what it was. Newey-West never touches the coefficient, and that is the whole point of it. Whatever your slope meant before, it means the same thing now.

The standard error moved from 0.1134 to 0.2383, roughly doubling. The t-statistic fell from 11.14 to 5.30 as a direct result, because t is just the estimate divided by its standard error.

The argument `prewhite = FALSE` turns off an extra filtering step that `NeweyWest()` applies by default. Leaving it off gives you the plain, textbook version of the correction, which is the one to start from.

Now the interval, which is where you can see whether the repair worked.

```r
# The 95% interval that goes with those corrected standard errors
coefci(m, vcov. = NeweyWest(m, prewhite = FALSE))
#>                  2.5 %    97.5 %
#> (Intercept) 19.9420870 50.107593
#> ad_spend     0.7911606  1.734958
```

The interval runs from 0.791 to 1.735. The true slope is 0.9, and for the first time an interval on this shop contains it. The original interval of 1.0385 to 1.4876 never had a chance.

[NOTE]
A wider interval is not a worse answer. It is the same answer with an accurate label on it. The original 0.1134 was not more precise, it was wrong about how much this data actually knows.

=== step === concept
## Put the dependence into the model itself

Newey-West repairs the report. There is a second repair that fixes the model, and when it suits your problem it does better.

The thinking behind it is different. Instead of accepting a correlated error and correcting for it afterwards, you write the carry-over into the model as something to be estimated. Say that this month's error is some fraction of last month's error plus something genuinely new, then let the data tell you what that fraction is.

`arima()` in base R does this. Read `order = c(1, 0, 0)` as one autoregressive term, no differencing, and no moving-average term, which is the plain "this month's error leans on last month's" structure. The `xreg` argument is where your ordinary predictor goes.

```r
# Model the month-to-month carry-over instead of correcting for it afterwards
ar_fit <- arima(store$revenue, order = c(1, 0, 0), xreg = store$ad_spend)

ar_fit
#>
#> Call:
#> arima(x = store$revenue, order = c(1, 0, 0), xreg = store$ad_spend)
#>
#> Coefficients:
#>          ar1  intercept  store$ad_spend
#>       0.8892    42.7974          0.9777
#> s.e.  0.0408     5.4577          0.1048
#>
#> sigma^2 estimated as 40.14:  log likelihood = -392.6,  aic = 793.2
```

Read that table one column at a time.

`ar1` is 0.8892. That is the carry-over itself, estimated rather than assumed: about 89% of one month's error is still there the next month. We built the data with 0.85, so the model found it.

`store$ad_spend` is 0.9777, with a standard error of 0.1048. Compare that against the two answers you already have. Ordinary least squares said 1.2631, and Newey-West said the same 1.2631 with a standard error of 0.2383. This estimate is both closer to the true 0.9 and more precise than the Newey-West version.

That is the trade in one line. Newey-West widens your uncertainty so that it is truthful. Modelling the carry-over removes some of that uncertainty instead, because the dependence has stopped being noise and become part of what the model explains.

So did it work? Test what is left over. `dwtest()` accepts a formula, so you can hand it the leftovers from the AR(1) fit against the same predictor.

```r
# Re-test what the AR(1) model left behind
dwtest(residuals(ar_fit) ~ store$ad_spend)
#>
#>	Durbin-Watson test
#>
#> data:  residuals(ar_fit) ~ store$ad_spend
#> DW = 1.9791, p-value = 0.4222
#> alternative hypothesis: true autocorrelation is greater than 0
```

DW = 1.9791, with a p-value of 0.4222. It started at 0.248 and it is now sitting on 2, which is the mark for no correlation at all. There is nothing left in the residuals for the test to find.

=== step === quiz
## Quick check: the repaired model comes back at 2

The Durbin-Watson statistic on this shop started at 0.248. After the AR(1) fit, the same test on what was left came back at 1.9791. Why did it move?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The carry-over was taken out of the residuals and estimated inside the model, so what remains has none of it left. ::ok Right. The AR(1) term is the dependence, moved out of the leftovers and into the model where it can be estimated. That is why the leftovers came back clean.
- Any repair moves the statistic to 2. Correcting the standard errors would have done exactly the same thing. ::no
- The AR(1) fit removed the trend from revenue, and the trend was what caused the runs. ::no
- Durbin-Watson always returns roughly 2 when it is run on the residuals of anything other than a plain regression. ::no Nothing about the test changes when you run it a second time, so it must be the residuals that changed. Correcting the standard errors would not do it, because that repair never alters the model: the residuals and the statistic would both come back exactly where they were. What moved the number to 2 was estimating the carry-over inside the model, which leaves nothing behind for the test to find. And it was not a trend, since this shop's revenue has no trend in it at all.

=== step === concept
## Which repair to reach for

You now have two working repairs, and they are good at different jobs. Here is how to choose between them.

| Your situation | Reach for | Why |
|---|---|---|
| You need to report one regression honestly | Newey-West standard errors | The coefficients keep their meaning and only the uncertainty is corrected |
| The dependence sits at higher lags or in a season | An AR model with the right lag, or seasonal terms | One lag-1 term will not absorb a yearly pattern |
| You want a better estimate of the effect itself | An AR(1) error model with `arima()` | It usually lands closer to the truth and with a tighter standard error |
| You need to forecast the next few months | An AR(1) error model with `arima()` | It knows about the carry-over, so it can use it to predict |

One line is worth keeping above all the rest. Newey-West repairs the report, not the model. Its predictions are identical to the original ones, because the fitted model is identical. What it changes is what you are entitled to claim, and nothing else.

There is one more habit to build. Autocorrelated residuals are often the model telling you that something is missing rather than that something is broken. A variable that moves slowly over time, a season you did not include, a level that shifted after a launch: any of those show up as errors that carry over. Before reaching for a correction, it is always worth asking what the model has not been given.

=== step === quiz
## Quick check: the model has last month's sales on the right-hand side

A colleague sends you a model of monthly revenue. To capture momentum they included last month's revenue as a predictor, alongside ad spend. They ran `dwtest()` on it, got 1.95, and wrote "no autocorrelation" in the report. What would you tell them?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The 1.95 is solid evidence. It is close to 2, which is the no-correlation mark, so the residuals are clean. ::no
- Including last month's revenue already fixes autocorrelation, so testing for it afterwards was never necessary. ::no
- The statistic is fine but the test needs more lags, so they should rerun the same test asking for twelve. ::no A lagged outcome is the one situation that biases Durbin-Watson toward 2, so a comfortable-looking 1.95 in that model tells you nothing at all. It does not mean the residuals are clean, and including a lag does not cure anything by itself. Asking Durbin-Watson for more lags is not an option either, since it only ever looks one step back. The fix is a test that survives a lagged outcome.
- A lagged outcome on the right-hand side pulls Durbin-Watson toward 2, so 1.95 there is not evidence of anything. Run Breusch-Godfrey instead. ::ok Exactly. That is the case Durbin-Watson cannot handle, and the failure is quiet: it reports a comfortable number rather than an error. Breusch-Godfrey puts the original predictors into its own second regression, which is what makes it safe here.

=== step === quiz
## Quick check: reading the two standard errors side by side

The same coefficient, printed twice. Ordinary least squares gave an estimate of 1.2631 with a standard error of 0.1134. Newey-West gave an estimate of 1.2631 with a standard error of 0.2383. What changed between them?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The estimated effect of advertising is now about half of what the first output claimed. ::no
- Nothing about the estimated effect. The second output reports the same 1.2631 with less certainty attached, and the wider standard error is the truthful version of it. ::ok Yes. The estimate never moved and it was never going to, because the correction rebuilds only the uncertainty around it. Less certainty about the same effect is not a smaller effect.
- The correction shrank the coefficient, which is how it made the result less significant. ::no
- Newey-West drops the overlapping months, so the second output is working with less of the series. ::no A wider standard error is a statement about certainty, not about size, and nothing gets dropped to produce it. Both outputs report the very same estimate of 1.2631, because the correction rebuilds the uncertainty around a coefficient and never the coefficient itself. What fell was the t-statistic, and it fell because the same estimate is now being divided by a larger standard error.

=== step === tryit
## Your turn: run the whole check on a model of sales against the calendar

Let's run the whole routine on a fresh model, start to finish.

Someone at the shop wants to know whether revenue has been drifting over the ten years, so they ask for revenue regressed on the calendar month number and nothing else. That model is `revenue ~ month`.

Run all five moves on it. Fit it, read its plain coefficient table, test its residuals with `dwtest()`, then repair it both ways: `coeftest()` with Newey-West standard errors on the same fit, and the same relationship refitted with an AR(1) error using `arima()` with `month` as the `xreg`.

```r
# store holds the 120 months, and lmtest and sandwich are both loaded already.
# 1. Fit revenue against the calendar month number.
# 2. Print its plain coefficient table with coeftest(), so you have something to compare against.
# 3. Test its residuals with dwtest().
# 4. Repair it with Newey-West standard errors, using coeftest() again with a vcov.
# 5. Refit the same relationship with an AR(1) error, using arima() and xreg.
# Five lines. Press Check when you have them.
```
::check {"regex": "dwtest[\\s\\S]*NeweyWest[\\s\\S]*arima", "gate": true, "difficulty": "intermediate", "ok": "Put the three verdicts side by side. Plain least squares gives a t of -6.13 and a p-value near 1e-08. Newey-West gives -2.34 and a p-value of 0.021. The AR(1) model gives a slope of -0.1376 with a standard error of 0.1617, an estimate smaller than its own standard error, which means no reliable trend at all. This shop was built out of ad spend with no calendar trend anywhere in it, so the third answer is the right one.", "no": "Five calls in order: m_cal <- lm(revenue ~ month, data = store), then coeftest(m_cal), then dwtest(m_cal), then coeftest(m_cal, vcov = NeweyWest(m_cal, prewhite = FALSE)), then arima(store$revenue, order = c(1, 0, 0), xreg = store$month)."}
::solution
```r
# Fit revenue against the calendar, test it, then repair it both ways
m_cal <- lm(revenue ~ month, data = store)

coeftest(m_cal)
#>
#> t test of coefficients:
#>
#>              Estimate Std. Error t value  Pr(>|t|)
#> (Intercept) 80.433305   3.114608 25.8245 < 2.2e-16 ***
#> month       -0.274035   0.044676 -6.1338 1.178e-08 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

dwtest(m_cal)
#>
#>	Durbin-Watson test
#>
#> data:  m_cal
#> DW = 0.258, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0

coeftest(m_cal, vcov = NeweyWest(m_cal, prewhite = FALSE))
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 80.43331    5.60261 14.3564  < 2e-16 ***
#> month       -0.27404    0.11730 -2.3363  0.02116 *
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

arima(store$revenue, order = c(1, 0, 0), xreg = store$month)
#>
#> Call:
#> arima(x = store$revenue, order = c(1, 0, 0), xreg = store$month)
#>
#> Coefficients:
#>          ar1  intercept  store$month
#>       0.8814    72.6513      -0.1376
#> s.e.  0.0442    11.4555       0.1617
#>
#> sigma^2 estimated as 69.15:  log likelihood = -425.2,  aic = 858.4
```

This one is worth sitting with, because the three answers genuinely disagree.

Plain least squares says revenue falls by 0.274 thousand a month, with a t of -6.13 and a p-value around 1e-08. That reads as ten years of steady decline, and nobody in the room would question it.

Newey-West says the same 0.274 with a t of -2.34 and a p-value of 0.021. Still under the usual threshold, so this repair would have shipped the finding too, just with less confidence.

The AR(1) model says -0.1376 with a standard error of 0.1617. The estimate is smaller than its own standard error, which is another way of saying the data cannot tell this slope apart from zero.

And the truth? We built this shop's revenue out of ad spend and a carry-over error, with no calendar trend in it whatsoever. There was never a decline. A wandering error series happened to drift downward across these particular ten years, and a regression against the calendar reported that drift as a trend.

So which would you report? The AR(1) model, because it is the one that put the dependence where it belongs and kept a decline that never happened out of the meeting.

=== step === concept
## References

- [Testing for Serial Correlation in Least Squares Regression I](https://doi.org/10.1093/biomet/37.3-4.409) - Durbin and Watson (1950), Biometrika 37(3-4), 409-428. The original statistic and its distribution.
- [Testing for Autocorrelation in Dynamic Linear Models](https://doi.org/10.1111/j.1467-8454.1978.tb00635.x) - Breusch (1978), Australian Economic Papers 17(31), 334-355.
- [Testing Against General Autoregressive and Moving Average Error Models When the Regressors Include Lagged Dependent Variables](https://doi.org/10.2307/1913829) - Godfrey (1978), Econometrica 46(6), 1293-1301. Why a lagged outcome breaks Durbin-Watson.
- [A Simple, Positive Semi-Definite, Heteroskedasticity and Autocorrelation Consistent Covariance Matrix](https://doi.org/10.2307/1913610) - Newey and West (1987), Econometrica 55(3), 703-708.
- [Econometric Computing with HC and HAC Covariance Matrix Estimators](https://doi.org/10.18637/jss.v011.i10) - Zeileis (2004), Journal of Statistical Software 11(10). The `sandwich` implementation used here.

=== step === complete
## Quick recap

You started with a regression that looked settled and finished with one you can defend. Five things worth carrying away.

- Autocorrelation is only visible in time order. The residual plot against fitted values cannot see it, because neither of its axes is time.
- Durbin-Watson puts one number on it. The scale runs from 0 to 4, 2 means no correlation, and this shop came in at 0.248.
- It damages the uncertainty, not the estimate. The coefficient stays centred on the truth while the standard error, the t-statistic, the p-value and the interval all break, and R-squared can improve while it happens. Out of 2,000 shops whose advertising did nothing, 899 were still called a success.
- Use Breusch-Godfrey when the model carries a lagged outcome, or when you need more than one lag. Durbin-Watson is pulled toward 2 by a lagged outcome and only ever looks one step back.
- Two repairs do two different jobs. Newey-West keeps your coefficients and widens the standard errors, which is what you want when you are reporting a model. An AR(1) error model estimates the carry-over instead, which usually lands closer to the truth and can forecast.

And when somebody hands you a regression with dates down the side, here is the sentence to say:

"Before we read that p-value, let's put the residuals back in time order and run a Durbin-Watson on them."

It takes ten seconds, and it is the only thing standing between you and the 899 shops out of 2,000 that got called a success for doing nothing. Nice work getting through it.
