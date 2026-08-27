---
title: "Compare Bayesian models: LOO and WAIC"
slug: "Bayesian-Mini-5"
description: "Two Bayesian models, one dataset, and a fit statistic that misleads. Score both with LOO and WAIC in R, then read the comparison well enough to defend it."
keywords: "LOO cross-validation in R, WAIC in R, compare Bayesian models, expected log predictive density, elpd, Pareto k diagnostic, loo package, Bayesian model comparison"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "5"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-4"
course_next: ""
curriculum_id: "0.0.50"
lesson_access: "windowed"
catalog_blurb: "How to tell which of two Bayesian models predicts new data better."
---

=== step === cover
::eyebrow Bayesian Decisions
## Compare Bayesian models: LOO and WAIC

Let's say you have fitted two Bayesian models to the same outcome. One is simple. The other adds several more predictors, and when you check how well each one fits, the bigger model wins.

So you report the bigger one.

That is almost always a mistake. Extra predictors give a model more ways to bend towards the rows it was fitted on, and it will happily bend towards the noise in them. What looks like a better model is often just a model with a better memory.

But the question you actually care about is a different one. Which of the two would do better on a day you have not seen yet?

LOO and WAIC both answer that question, and the idea behind LOO is simple. Hide one observation. Refit the model on everything that is left. Ask how much probability the refitted model puts on the value you hid. Then put it back and do the same for the next one.

::widget process-flow {"steps":[{"title":"Hide one day","sub":"pull a single observation out of the data"},{"title":"Predict it from the rest","sub":"refit on what remains and score the value you hid"},{"title":"Add up the scores","sub":"repeat for every observation; the total is the model comparison"}]}

We are going to run that on two real models fitted to twenty days of juice sales, get the same answer the fast way every package actually uses, find where the fast way breaks, and finish with the one number you can defend out loud when somebody asks why you picked the model you picked.

=== step === concept
## Twenty days at the juice bar, and the two models in front of you

A small juice bar has been open for twenty days, and the till has been logging things all along. The obvious column is the day's high temperature. It also logged whether the day fell on a weekend, how many social posts went out, the longest queue the staff counted, the music volume, whether street parking was free, how many people were behind the counter, and whether a discount ran.

At the end of each day it records the thing you care about, which is how many cups sold. Cups run from 113 on the coldest day to 172 on the hottest.

You want a model for cups, and there are two obvious candidates. The first uses temperature and nothing else. The second keeps temperature and throws in six of the till's other counters, on the theory that more information cannot hurt.

Let's build the twenty days and fit both. `lm()` gives the least-squares fit for each one, and that is all we need to start. The posterior that turns each of them into a Bayesian model is drawn off that same fit in a moment.

```r
# Build twenty days at the juice bar and fit the two models we have to choose between
set.seed(2)
juice <- data.frame(
  temp     = round(runif(20, 24, 38)),    # the day's high temperature, in degrees
  weekend  = rbinom(20, 1, 0.3),          # 1 for a Saturday or Sunday
  posts    = rpois(20, 3),                # social posts the shop put out
  queue    = round(runif(20, 1, 9)),      # longest queue the staff counted
  music    = round(runif(20, 40, 90)),    # music volume setting
  parking  = rbinom(20, 1, 0.5),          # 1 if street parking was free
  staff    = sample(2:4, 20, TRUE),       # people behind the counter
  discount = rbinom(20, 1, 0.4)           # 1 if a discount ran that day
)
juice$cups <- round(40 + 3.1 * juice$temp + 12 * juice$weekend + rnorm(20, 0, 5))

fit_a <- lm(cups ~ temp, data = juice)
fit_b <- lm(cups ~ temp + posts + queue + music + parking + staff + discount, data = juice)

head(juice, 4)
#>   temp weekend posts queue music parking staff discount cups
#> 1   27       0     7     7    58       0     2        0  124
#> 2   34       0     2     8    74       0     2        0  139
#> 3   32       1     1     6    41       1     3        0  157
#> 4   26       0     1     3    60       1     2        1  125

round(c(r2_a = summary(fit_a)$r.squared, r2_b = summary(fit_b)$r.squared), 3)
#>  r2_a  r2_b
#> 0.748 0.814
```

R-squared is the share of the variation in cups that a fit explains on the very days it was fitted to. The simple model explains 74.8% of it. Add the six extra columns and that climbs to 81.4%.

If those two numbers were all you had, you would report the bigger model.

Now look at the line that made the data. Cups were built from temperature, from whether it was a weekend, and from random noise. Nothing else. The six columns the second model just took on board are pure invention: the posts, the queue, the music, the parking, the staff, the discount. Not one of them touches cups.

So the bigger model gained almost seven points of R-squared out of columns that mean nothing at all. That tells you exactly what R-squared is worth when you are choosing between models.

Notice also which column neither model uses. The weekend flag is sitting right there in the data and both models ignore it. That is going to come back.

=== step === quiz
## Quick check: what a higher R-squared proves

The bigger model's R-squared came in at 0.814 against the simple model's 0.748. What does that jump prove?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- That the six extra columns carry real information about cups sold. ::no
- That the bigger model would predict tomorrow's sales more accurately. ::no
- Almost nothing. Adding predictors can only push the fit on the fitted rows up or leave it alone, so a rise is what you would expect even from columns of pure noise. ::ok Exactly. R-squared is scored on the same rows the model was fitted to, and every extra column gives the fit one more way to chase those particular rows. The only honest reading of a rise is that the model has more freedom, not that it knows more.
- That the simple model is misspecified and should be dropped. ::no Every one of these reads the rise as news about the world. It is not. R-squared on the fitted rows cannot fall when you add a predictor, which is precisely why it cannot referee a choice between models. Here the six extra columns were noise by construction, and they still bought seven points.

=== step === concept
## What "predicts a new day better" looks like as a number

If R-squared cannot settle it, what can? You need a score that asks the model about a day it was never allowed to see.

Here is the honest way to score one such day. Take the model, hide the day, refit, then ask the refitted model what it thinks that day's cups would be. It does not answer with a single number. It answers with a whole distribution over possible cup counts. So you go to that distribution, find the value that actually happened, and read off how much density the model put there.

High density means the model was expecting something close to what happened. Low density means it was surprised.

Density values are tiny and they multiply across days, so everyone works on the log scale instead, where they add up:

\[ \text{score}_i \;=\; \log p(y_i \mid \text{model fitted without } y_i) \]

That line is the last three sentences written in symbols: a day's score is the log of the density the model puts on the value that day actually recorded, when the model was fitted without it.

Higher is better, and since densities below 1 have negative logs, these scores are almost always negative. Add them up across every day and the total is called the expected log predictive density, written elpd. That is the single number LOO and WAIC are both trying to estimate.

To see how far the score separates a good prediction from a bad one, take day one, which sold 124 cups, and hand it two rival predictions. Both are normal distributions with the same spread of 8 cups. One is centred on 126, the other on 145.

```r
# Score two rival predictions for day one, the day that sold 124 cups
sold_day1 <- juice$cups[1]

near_call <- dnorm(sold_day1, mean = 126, sd = 8, log = TRUE)
far_call  <- dnorm(sold_day1, mean = 145, sd = 8, log = TRUE)

round(c(sold = sold_day1, near_call = near_call, far_call = far_call), 3)
#>      sold near_call  far_call
#>   124.000    -3.030    -6.444
```

The near call scores -3.03 and the far call scores -6.44. On the log scale that gap of 3.4 means the near call gave the true value about thirty times more density than the far one did.

[NOTE]
`dnorm(x, mean, sd, log = TRUE)` gives the log of the normal density at `x`. It is the same function you would use to draw a bell curve, read at one point instead of across a range.

=== step === concept
## Posterior draws, and the log-likelihood matrix they fill

There is one thing to sort out before we score anything for real. A Bayesian fit does not hand you one slope and one intercept. It hands you a posterior, which is a whole cloud of parameter values the data finds plausible. So the model does not make one prediction for a day. It makes one per point in that cloud, and its real prediction is the average across all of them.

\[ p(y_i) \;\approx\; \frac{1}{S} \sum_{s=1}^{S} p(y_i \mid \theta^{(s)}) \]

Each of the S draws in the cloud gives the day a density of its own, and the model's answer is the average across all S of them.

For a linear model with a flat prior you can draw from that cloud directly, with no sampler at all. Draw a residual standard deviation from a scaled chi-square, then draw the coefficients from a normal centred on the least-squares estimate and scaled by that standard deviation. Four thousand draws is plenty.

That is what `draw_posterior()` below does. What matters far more is what comes out the other side.

```r
# Draw 4000 posterior draws from a fitted linear model
draw_posterior <- function(fit, n_draws = 4000) {
  X       <- model.matrix(fit)
  df      <- fit$df.residual
  s2      <- sum(residuals(fit)^2) / df
  sigma   <- sqrt(df * s2 / rchisq(n_draws, df))
  root    <- chol(solve(t(X) %*% X))
  noise   <- matrix(rnorm(n_draws * ncol(X)), nrow = n_draws) %*% root
  beta    <- matrix(coef(fit), n_draws, ncol(X), byrow = TRUE) + noise * sigma
  list(beta = beta, sigma = sigma)
}

# Turn a set of draws into the pointwise log-likelihood matrix
loglik_matrix <- function(post, fit, cups) {
  X         <- model.matrix(fit)
  mu        <- post$beta %*% t(X)
  cups_wide <- matrix(cups, nrow(mu), length(cups), byrow = TRUE)
  dnorm(cups_wide, mu, post$sigma, log = TRUE)
}

set.seed(7)
post_a <- draw_posterior(fit_a)
post_b <- draw_posterior(fit_b)

ll_a <- loglik_matrix(post_a, fit_a, juice$cups)
ll_b <- loglik_matrix(post_b, fit_b, juice$cups)

dim(ll_a)
#> [1] 4000   20

round(head(ll_a[, 1], 5), 3)
#> [1] -2.693 -3.282 -3.206 -2.807 -3.391
```

`ll_a` has 4,000 rows and 20 columns, which is one row per posterior draw and one column per day. The cell in row 1 and column 1 holds the log density that the first draw gave to day one's actual 124 cups, and it reads -2.693. The five values printed above are the first five draws all scoring that same day, and they disagree with each other because each draw is a slightly different line.

This matrix is the whole game. Everything that follows comes out of these numbers and nothing else: both methods, both models, the standard error at the end.

=== step === quiz
## Quick check: what one cell of the matrix means

Row 1, column 1 of `ll_a` holds -2.693. What is that number?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The model's predicted cup count for day one, on the log scale. ::no
- One posterior draw's log density at day one's actual 124 cups: how unsurprised that particular draw was by what really happened. ::ok That is it. A cell pairs one draw with one day and reports how much density that draw put on the value that was observed. The whole column is the same day judged by 4,000 different draws.
- The gap between day one's actual cups and the model's prediction. ::no
- The probability that day one sold 124 cups. ::no A cell is not a prediction, not a residual, and not a probability. It is a density read at the observed value, on the log scale, for one draw and one day. That is why a column can be averaged over draws to give the model's own verdict on a single day.

=== step === concept
## Leave one day out, refit, and score the day you hid

Now let's run the recipe properly, on a single day.

Take day one out. Fit the simple model on the other nineteen days, so nothing about day one has touched it. Draw the posterior from that fit. Every draw gives day one a predicted mean, and every draw has its own spread, so every draw puts some density on the 124 cups that actually sold. Average those densities across the draws, and take the log.

```r
# Score day one the literal way: refit without it, then average the predictive density
fit_rest <- lm(cups ~ temp, data = juice[-1, ])

set.seed(101)
post_rest <- draw_posterior(fit_rest)

x_day1  <- model.matrix(cups ~ temp, juice[1, ])
mu_day1 <- as.vector(post_rest$beta %*% t(x_day1))

dens_day1 <- dnorm(juice$cups[1], mu_day1, post_rest$sigma)

round(c(mean_density = mean(dens_day1), log_score = log(mean(dens_day1))), 4)
#> mean_density    log_score
#>       0.0432      -3.1419
```

Day one scores -3.14.

Two details are worth a pause here, because people get them backwards.

First, the averaging happens on the density scale, not the log scale. You average the 4,000 densities and then take one log at the end. Averaging the logs instead answers a different question, and it gives you the wrong number.

Second, this is not the model's guess for day one. It is how much probability the model, having never met day one, put on what day one actually did. A model can be dead right on average and still score badly if it was too confident about it.

=== step === tryit
## Your turn: score the day the model finds hardest

Day three sold 157 cups when the high hit 32 degrees. That is a lot of cups for that temperature, so the simple model is going to struggle with it.

Run the same recipe on day three. Drop it from the data, refit, draw the posterior with `set.seed(103)`, and take the log of the mean predictive density at 157 cups.

```r
# Score day three exactly the way day one was scored, and see how it compares
# Drop day three from juice, refit cups ~ temp on the other nineteen days,
# use set.seed(103) before drawing the posterior,
# then take the log of the mean density at day three's 157 cups.
# Press Check when you have it.
```
::check {"regex": "-\\s*3\\s*,[\\s\\S]*log\\s*[(]\\s*mean", "gate": true, "difficulty": "intermediate", "ok": "You get -5.03, against day one's -3.14. That is nearly two full log units worse on a single day, which means the model put about a sixth as much density on day three's true sales as it put on day one's. Day three fell on a weekend, and a model built on temperature alone has no way of knowing that.", "no": "Follow the same four lines as before, with 3 in place of 1: fit on juice[-3, ], call set.seed(103), build the day three row with model.matrix, then take log(mean(dnorm(...))) at juice$cups[3]."}
::solution
```r
# Score day three the same way, refitting on the other nineteen days
fit_rest3 <- lm(cups ~ temp, data = juice[-3, ])

set.seed(103)
post_rest3 <- draw_posterior(fit_rest3)

x_day3  <- model.matrix(cups ~ temp, juice[3, ])
mu_day3 <- as.vector(post_rest3$beta %*% t(x_day3))

round(log(mean(dnorm(juice$cups[3], mu_day3, post_rest3$sigma))), 3)
#> [1] -5.028
```

Day one scored -3.14 and day three scores -5.03. Same model, same recipe, and a day it simply could not see coming.

=== step === concept
## All twenty days added up: each model's LOO score

One day at a time is the idea. Twenty days is the answer. Loop the recipe over every day, for both models, and add the scores up:

\[ \widehat{\text{elpd}}_{\text{loo}} \;=\; \sum_{i=1}^{n} \log p(y_i \mid y_{-i}) \]

The minus i is the shorthand everyone uses for the data with day i taken out, so every term in that sum is scored by a model that saw the other nineteen days only. That is forty refits in total, which is nothing on twenty rows.

```r
# Run the leave-one-out recipe over all twenty days, for both models
score_day <- function(form, day, seed) {
  fit_rest <- lm(form, data = juice[-day, ])
  set.seed(seed)
  post  <- draw_posterior(fit_rest)
  x_day <- model.matrix(form, juice[day, ])
  mu    <- as.vector(post$beta %*% t(x_day))
  log(mean(dnorm(juice$cups[day], mu, post$sigma)))
}

form_a <- cups ~ temp
form_b <- cups ~ temp + posts + queue + music + parking + staff + discount

exact_a <- sapply(1:20, function(i) score_day(form_a, i, 100 + i))
exact_b <- sapply(1:20, function(i) score_day(form_b, i, 200 + i))

round(c(model_a = sum(exact_a), model_b = sum(exact_b)), 2)
#> model_a model_b
#>  -71.68  -78.37

worst <- order(exact_a)[1:3]
data.frame(day = worst, cups = juice$cups[worst], temp = juice$temp[worst],
           weekend = juice$weekend[worst], score = round(exact_a[worst], 2))
#>   day cups temp weekend score
#> 1   3  157   32       1 -5.03
#> 2   9  153   31       1 -4.80
#> 3  17  172   38       1 -4.43
```

There it is. The simple model scores -71.68 and the bigger model scores -78.37.

The ranking has flipped. On the days it was fitted to, the bigger model looked better by seven points of R-squared. On days it had never met, it is nearly seven log units worse. Those six noise columns did not just fail to help. They cost the model almost seven units of predictive accuracy, because the fit spent real degrees of freedom learning patterns in the queue lengths and the music volume that will never repeat.

The second table is the other half of the story. The three days the simple model handles worst are days 3, 9 and 17, and the weekend column reads 1 on all three. Those are the weekends, when an extra twelve cups walked in that temperature alone cannot explain. Neither model was given that column, so both are blind to it in exactly the same way.

=== step === widget
## Why the bigger model wins on old data and loses on new

The reversal you just measured is not a quirk of this juice bar. It is the shape every model comparison takes.

Slide the complexity up and watch the two curves. Error on the data the model was fitted to only ever falls, because a more flexible model can always chase the rows in front of it more closely. Error on held-out data falls at first, because early on that extra flexibility is buying real structure. Then it turns around and climbs, because past a point the only thing left to chase is noise.

::widget bias-variance {"start": 3, "maxDegree": 12}

The lowest point of the second curve is the model you want. Everything to the left of it is a model too stiff to capture what is there. Everything to the right is a model that has started memorising.

Our two models are two points on that picture. The simple one sits near the bottom of the U. The bigger one, with six columns of noise bolted on, sits well up the right-hand slope, which is exactly where a rising fit and a falling predictive score live together.

=== step === quiz
## Quick check: reading the two elpd totals

The leave-one-out totals came back at -71.68 for the simple model and -78.37 for the bigger one. What do those two numbers tell you?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The simple model predicts a new day better, because -71.68 is the less negative of the two. The totals only carry meaning relative to each other, scored on the same twenty days. ::ok Right on both counts. Higher elpd is better, and since these log densities are negative, higher means closer to zero. And the number on its own says nothing at all: it is only ever read against another model scored on the same rows.
- Both models are poor, because a good model would score a positive total. ::no
- The bigger model is worse by 6.69, and you could compare that -78.37 against a model fitted to a different dataset to see how bad it is. ::no
- Nothing yet, because leave-one-out scores cannot be added across observations. ::no An elpd total is a sum of log densities, so it is negative whenever those densities fall below 1, which they nearly always do. Being negative is not a verdict. And the total is tied to these exact twenty rows, so it can only ever be compared with another model scored on those same rows, never across datasets.

=== step === concept
## The shortcut: reweighting the draws you already have

Forty refits on twenty rows is quick. Twenty thousand refits on a dataset with twenty thousand rows, each one running a sampler that takes two minutes, is close to a month of compute. Nobody actually refits.

Here is what they do instead. You already have 4,000 draws from the full fit, the ones sitting in `ll_a` and `ll_b`. Those draws saw day one, so you cannot use them as they stand. However, you can correct them. A draw that fits day one unusually well got some of that fit from day one itself, so it should count for less. The right weight turns out to be exactly one over the density that draw gave the day:

\[ p(y_i \mid y_{-i}) \;\approx\; \left( \frac{1}{S} \sum_{s=1}^{S} \frac{1}{p(y_i \mid \theta^{(s)})} \right)^{-1} \]

That is one line of R per model, and it needs no refitting at all. Since we still have the exact answer from the forty refits, we can check the shortcut against it.

```r
# Reweight the draws we already have, and check the shortcut against the exact answer
is_a <- -log(colMeans(exp(-ll_a)))
is_b <- -log(colMeans(exp(-ll_b)))

data.frame(
  model         = c("A: temp only", "B: temp plus six"),
  exact         = round(c(sum(exact_a), sum(exact_b)), 2),
  reweighted    = round(c(sum(is_a), sum(is_b)), 2),
  worst_one_day = round(c(max(abs(is_a - exact_a)), max(abs(is_b - exact_b))), 2)
)
#>              model  exact reweighted worst_one_day
#> 1     A: temp only -71.68     -71.69          0.03
#> 2 B: temp plus six -78.37     -78.33          0.21
```

That one line is the formula read from the inside out. `exp(-ll_a)` turns each log density back into one over the density, `colMeans` averages those 4,000 reciprocals for every day, and the outer minus log turns the average back over and puts it on the log scale.

On the simple model the shortcut is almost perfect. The totals agree to 0.01, and no single day is off by more than 0.03. Forty refits, replaced by one line, and the answer does not move.

On the bigger model it is shakier. The totals still land close, and that hides something: one day is off by 0.21, which is seven times the worst error the simple model produced anywhere. The reweighting is starting to strain, and it is worth knowing exactly where and why.

=== step === concept
## WAIC: the same target computed straight from the matrix

There is a second route to the same destination, and historically it came first. WAIC does not reweight anything, and it never holds a day out at all. It scores the fit on the observed days, then subtracts a penalty for how flexible the model turned out to be.

The fit half is called lppd, the log pointwise predictive density: average the densities across draws for each day, log it, and add up. The penalty is the variance, across draws, of the log density each day received, added up:

\[ \text{lppd} = \sum_{i=1}^{n} \log \left( \frac{1}{S} \sum_{s=1}^{S} p(y_i \mid \theta^{(s)}) \right), \qquad p_{\text{waic}} = \sum_{i=1}^{n} \mathrm{Var}_{s} \left( \log p(y_i \mid \theta^{(s)}) \right) \]

\[ \widehat{\text{elpd}}_{\text{waic}} = \text{lppd} - p_{\text{waic}} \]

The penalty is worth a moment. If the posterior draws all agree about how likely a day was, that day's variance is near zero and it costs the model nothing. If the draws disagree wildly about a day, the model is leaning on that day, and it pays for it. Add those up and you get an effective number of parameters, which is why it gets written as p.

That is three lines of R on the matrix we already have.

```r
# Compute WAIC for the simple model straight from its log-likelihood matrix
lppd_a   <- sum(log(colMeans(exp(ll_a))))
p_waic_a <- sum(apply(ll_a, 2, var))

round(c(lppd = lppd_a, p_waic = p_waic_a, elpd_waic = lppd_a - p_waic_a), 2)
#>      lppd    p_waic elpd_waic
#>    -69.28      2.36    -71.63
```

The simple model has three parameters in all: an intercept, a slope, and a residual standard deviation. Its p_waic lands at 2.36, in that same neighbourhood, which is what you hope to see from a model that is not straining anywhere. Subtract it from the fit and you get -71.63, against the -71.68 the forty refits gave. The two routes agree to five hundredths.

=== step === tryit
## Your turn: compute WAIC for the bigger model

Now run the same three lines on `ll_b`, the log-likelihood matrix of the model with the six noise columns.

Before you do, guess where p_waic will land. The bigger model has nine parameters in all, eight coefficients and a residual standard deviation.

```r
# Compute WAIC for the bigger model from its own log-likelihood matrix
# Same three lines as before, with ll_b in place of ll_a:
# lppd is the sum of the log of the column means of exp(ll_b),
# p_waic is the sum of the column variances of ll_b,
# and elpd_waic is the first minus the second.
# Press Check when you have it.
```
::check {"regex": "apply\\s*[(]\\s*ll_b\\s*,\\s*2\\s*,\\s*var", "gate": true, "difficulty": "intermediate", "ok": "You get lppd -68.93, p_waic 7.46, and elpd_waic -76.39. The penalty more than tripled, which is the six noise columns being charged for. But look at the total: WAIC says -76.39 where the forty refits said -78.37. On the simple model the two agreed to 0.05, and here they sit two whole units apart.", "no": "Copy the three lines and swap the matrix: lppd_b <- sum(log(colMeans(exp(ll_b)))), then p_waic_b <- sum(apply(ll_b, 2, var)), then subtract the second from the first."}
::solution
```r
# Compute WAIC for the bigger model from its own log-likelihood matrix
lppd_b   <- sum(log(colMeans(exp(ll_b))))
p_waic_b <- sum(apply(ll_b, 2, var))

round(c(lppd = lppd_b, p_waic = p_waic_b, elpd_waic = lppd_b - p_waic_b), 2)
#>      lppd    p_waic elpd_waic
#>    -68.93      7.46    -76.39
```

The bigger model fits the observed days better, as it always does: lppd -68.93 against the simple model's -69.28. It is the penalty that separates them, 7.46 against 2.36. WAIC still picks the simple model, and by a wide margin.

=== step === concept
## When LOO and WAIC disagree, and the Pareto k values behind it

So far the bigger model has produced two small failures. The reweighting shortcut missed one day by 0.21, and WAIC came in two units above the refits. Both have the same cause, and you can see it directly.

The reweighting only works if a day's four thousand weights are spread out. If a handful of draws take over the sum, the average is really being decided by those few, and it stops being stable. So take a day, take its weights, and ask what share the single largest one holds.

```r
# Ask how much of a day's total weight the single largest draw takes
weight_share <- function(ll, day) {
  w <- exp(-ll[, day])
  max(w) / sum(w)
}

data.frame(
  day           = c(1, 3),
  cups          = juice$cups[c(1, 3)],
  top_weight_a  = round(c(weight_share(ll_a, 1), weight_share(ll_a, 3)), 4),
  top_weight_b  = round(c(weight_share(ll_b, 1), weight_share(ll_b, 3)), 4),
  logdens_var_b = round(c(var(ll_b[, 1]), var(ll_b[, 3])), 2)
)
#>   day cups top_weight_a top_weight_b logdens_var_b
#> 1   1  124        7e-04       0.0033          0.10
#> 2   3  157        7e-03       0.1753          1.45
```

Read the two weight columns first. On the simple model the biggest of 4,000 draws takes 0.07% of day one's weight and 0.7% of day three's, so in both cases the average really is an average over thousands of draws. On the bigger model at day three it takes 17.5%. One draw out of four thousand is carrying about a sixth of the answer, and that is why the shortcut missed that day by 0.21.

The last column shows the same trouble reaching WAIC. Day one's log density has a variance across draws of 0.10, which is small. Day three's is 1.45. Since p_waic is a sum of exactly those variances, a day the model is straining on inflates the penalty and makes it unreliable. That is how WAIC ends up two units away from the truth.

The `loo` package puts a number on the weight problem so you never have to eyeball it. For each day it sorts the weights, fits a generalised Pareto distribution to the largest ones, and reports that distribution's shape parameter, k. A small k means a short tail and a trustworthy average. As k rises the tail thickens and a few draws start to dominate.

[WARNING]
The line everyone uses is k = 0.7. Below it, treat the leave-one-out estimate for that observation as sound. Above it, do not: refit that observation exactly, or move to a method that does not lean on reweighting. A k over 0.7 is not a comment on your data, it is the estimate telling you it cannot be trusted for that point.

=== step === concept
## The difference and its standard error: the number you defend

Neither total is the number you report. On their own, -71.68 and -78.37 mean nothing to anybody. The gap between them is what carries the decision, and a gap needs a standard error before anyone should act on it.

Getting one is easier than it sounds, because both models were scored on the same twenty days. Subtract them day by day and you are left with twenty paired differences. Sum those for the gap. Then take the standard deviation of the differences and multiply by the square root of the number of days:

\[ \text{se}_{\text{diff}} \;=\; \sqrt{n} \times \mathrm{sd}(d_1, \ldots, d_n) \]

```r
# Subtract the two models day by day, then put a standard error on the total
per_day   <- is_b - is_a
elpd_diff <- sum(per_day)
se_diff   <- sqrt(20) * sd(per_day)

round(head(per_day, 5), 2)
#> [1] -0.16  0.42 -1.06 -0.20 -0.47

round(c(elpd_diff = elpd_diff, se_diff = se_diff, ratio = elpd_diff / se_diff), 2)
#> elpd_diff   se_diff     ratio
#>     -6.63      1.75     -3.79
```

The first five paired differences show why this works. Day one favours the simple model by 0.16, day two actually favours the bigger model by 0.42, day three swings a full 1.06 back to the simple model. So there is real day-to-day variation in which model wins, and the standard error is measuring exactly that.

The gap is -6.63 with a standard error of 1.75, which puts it 3.8 standard errors from zero. That is not something twenty noisy days would produce by accident.

The pairing is doing a lot of work here. Both models are hit by the same hot days and the same weekends, so those shared shocks cancel when you subtract, and what survives is the difference in how each model handled them. Score the two models on separate samples and compare the totals instead, and you leave all of that noise in, which hands you a much larger standard error for the same real gap.

[KEY INSIGHT]
The number to report is the difference and its standard error together, never a bare total. A rule that serves well in practice: if the gap is more than about two standard errors, the data can tell the models apart. If it is not, say so plainly and pick on other grounds, such as which model is simpler or easier to explain.

=== step === concept
## How to read the loo package output

Everything so far was built by hand so you can see what the pieces are. In real work you hand the same matrix to the `loo` package, which does the reweighting with a smoothed tail instead of raw weights and reports the diagnostics alongside. You rarely build the matrix by hand either: fit with `brms` or `rstanarm` and `log_lik()` on the fit hands you exactly this shape, draws down the rows and observations across the columns.

The `loo` package is not part of base R, so the two blocks below are for your own R session rather than this page. Run `install.packages("loo")` once and everything in them works as printed.

```r-static
# Hand the same two matrices to the loo package and read what it reports
library(loo)

loo_a <- loo(ll_a)
loo_b <- loo(ll_b)

loo_a
#>
#> Computed from 4000 by 20 log-likelihood matrix.
#>
#>          Estimate  SE
#> elpd_loo    -71.7 2.6
#> p_loo         2.4 0.6
#> looic       143.4 5.2
#> ------
#> MCSE of elpd_loo is 0.0.
#> MCSE and ESS estimates assume independent draws (r_eff=1).
#>
#> All Pareto k estimates are good (k < 0.7).

loo_b
#>
#> Computed from 4000 by 20 log-likelihood matrix.
#>
#>          Estimate  SE
#> elpd_loo    -78.0 3.4
#> p_loo         9.1 2.2
#> looic       156.0 6.9
#> ------
#> MCSE of elpd_loo is NA.
#> MCSE and ESS estimates assume independent draws (r_eff=1).
#>
#> Pareto k diagnostic values:
#>                          Count Pct.    Min. ESS
#> (-Inf, 0.7]   (good)     14    70.0%   768
#>    (0.7, 1]   (bad)       6    30.0%   <NA>
#>    (1, Inf)   (very bad)  0     0.0%   <NA>
```

Four things in that output are worth naming.

1. `elpd_loo` is the total we computed, -71.7 and -78.0. The simple model's matches our -71.68 to the decimal. The bigger model's reads -78.0 where our refits said -78.37, and that difference is the smoothed tail: on the days where a few draws were dominating, the package pulls the largest weights back towards a fitted Pareto tail instead of using them raw.
2. `p_loo` is the effective number of parameters, 2.4 and 9.1. The simple model has three parameters and comes in a shade under. The bigger model has nine and comes in above them, and an effective count that exceeds the real one is a warning sign in its own right.
3. `looic` is just `-2 * elpd_loo`, put on the deviance scale so it reads like AIC, where lower is better. It carries no extra information.
4. The k table is the diagnostic. The simple model is entirely clean. The bigger model has six of its twenty days over 0.7, so its -78.0 is the number to trust least.

Then the comparison, which is the part you actually report.

```r-static
# Compare the two fits on the same days, with a standard error on the gap
loo_compare(loo_a, loo_b)
#>   model elpd_diff se_diff p_worse diag_diff      diag_elpd
#>  model1       0.0     0.0      NA
#>  model2      -6.3     1.7    1.00   N < 100 6 k_psis > 0.7
#>
#> Diagnostic flags present.
```

`loo_compare()` always puts the best model first with a difference of exactly zero, and reports every other model relative to it. So the simple model wins, and the bigger model is 6.3 behind with a standard error of 1.7. Those are the numbers we computed by hand, reached with smoothed weights instead of raw ones.

`p_worse` reads 1.00, which is a normal approximation to the probability that the bigger model really does predict worse. The last two columns are the package qualifying it. `N < 100` says twenty observations is too few for that approximation to be well calibrated, so read the 1.00 as a direction rather than an exact figure. `6 k_psis > 0.7` is the six flagged days again. Both warnings are fair, and neither of them changes which model you report.

=== step === quiz
## Your turn: which model do you report

The comparison came back with the simple model in front, the bigger model 6.6 behind, and a standard error of 1.75 on that gap. The meeting is in ten minutes. What do you say?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Report the bigger model. It uses more of what the till collected, and extra columns can only add information. ::no
- Report the simple model, and say the gap is 6.6 with a standard error of 1.75, which is nearly four standard errors and far too large to be noise. ::ok Exactly what you would want said in that room. You lead with the difference, you attach its standard error, and you let those two numbers carry the decision rather than a bare total nobody can interpret.
- Call it a tie. A gap of 6.6 is small next to totals in the seventies, so the two models are effectively the same. ::no
- Report neither, because both elpd totals are negative and a negative predictive score means the model failed. ::no The gap and its standard error are the only two numbers that settle this. A gap of 6.6 against a standard error of 1.75 is decisive; the same 6.6 against a standard error of 4 would not be, and the honest thing then is to say the data cannot separate the models and to choose on other grounds. Negative totals are normal, and the size of the gap next to the totals is not the comparison.

=== step === tryit
## Your turn: add the weekend column and compare again

The three days the simple model handles worst are all weekends, and the weekend column has been sitting unused in `juice` the whole time. So let's find out what it is worth.

Fit `cups ~ temp + weekend`, draw its posterior with `set.seed(7)`, build its log-likelihood matrix with `loglik_matrix()`, and get its reweighted per-day scores the same way `is_a` was built. Then compare it against the simple model: the gap, and the standard error of the gap.

```r
# Add the weekend column, score the new model, and compare it with the simple model
# Fit cups ~ temp + weekend, then call set.seed(7) before draw_posterior().
# Build ll_c with loglik_matrix(), then is_c <- -log(colMeans(exp(-ll_c))).
# The gap is sum(is_c - is_a) and its standard error is sqrt(20) * sd(is_c - is_a).
# Press Check when you have it.
```
::check {"regex": "temp\\s*\\+\\s*weekend", "gate": true, "difficulty": "advanced", "ok": "The weekend model scores -62.94 against the simple model's -71.69, a gain of 8.75 with a standard error of 3.14. That is nearly three standard errors, so the column is worth having. Notice how differently this reads from the six noise columns: one predictor carrying real signal bought 8.75 units, while six carrying none cost 6.63.", "no": "Reuse the two helper functions exactly as they stand. fit_c <- lm(cups ~ temp + weekend, data = juice), then set.seed(7), post_c <- draw_posterior(fit_c), ll_c <- loglik_matrix(post_c, fit_c, juice$cups), and is_c <- -log(colMeans(exp(-ll_c)))."}
::solution
```r
# Add the weekend column to the simple model and compare the two on the same days
fit_c  <- lm(cups ~ temp + weekend, data = juice)

set.seed(7)
post_c <- draw_posterior(fit_c)
ll_c   <- loglik_matrix(post_c, fit_c, juice$cups)
is_c   <- -log(colMeans(exp(-ll_c)))

gain <- is_c - is_a
round(c(elpd_c = sum(is_c), elpd_a = sum(is_a),
        elpd_diff = sum(gain), se_diff = sqrt(20) * sd(gain)), 2)
#>    elpd_c    elpd_a elpd_diff   se_diff
#>    -62.94    -71.69      8.75      3.14
```

This is the comparison working the way it should. A column that genuinely drives cups sold pays for itself several times over, and the method that punished six useless columns rewards this one. That is the whole point of scoring on days the model has never seen. It does not care how many predictors you have, only whether they help.

=== step === quiz
## Your turn: the Pareto k warning on someone else's table

A colleague sends you a comparison of two of their own models. The table says model 2 is 4.1 behind with a standard error of 1.9, so they want to report model 1. At the bottom of the output, model 2's diagnostics show six observations with k above 0.7, and its WAIC total sits two units away from its LOO total. What do you tell them?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Nothing to worry about. WAIC and LOO landing two apart is normal, and the k values only matter if any of them exceed 1. ::no
- Drop the six flagged observations and rerun the comparison, since they are outliers that are distorting the result. ::no
- Model 2's leave-one-out estimate is not trustworthy as it stands. Six observations are having their scores decided by a few draws each, which is also why its WAIC has drifted. Refit those six exactly, or use a method that does not reweight, before reporting the gap. ::ok That is the right call, and notice you never had to look at their data. A high k says the approximation failed on that observation, so the fix is a better estimate for those points, not a different model and not a smaller dataset.
- Switch to WAIC and report that instead, since it does not use importance weights and is therefore unaffected. ::no A high k is a statement about the estimate, not about the data or the model, so deleting observations is the one thing you must not do: it changes the question to make the arithmetic easier. Switching to WAIC does not rescue it either, because the same straining observations inflate its variance penalty, which is exactly why the two totals drifted apart. Refit the flagged points exactly and the gap becomes reportable.

=== step === concept
## References

- [Practical Bayesian model evaluation using leave-one-out cross-validation and WAIC](https://doi.org/10.1007/s11222-016-9696-4) - Vehtari, Gelman and Gabry (2017), Statistics and Computing 27(5), 1413-1432. The paper this whole approach comes from, including elpd, the pointwise standard error, and the k = 0.7 threshold.
- [Pareto Smoothed Importance Sampling](https://jmlr.org/papers/v25/19-556.html) - Vehtari, Simpson, Gelman, Yao and Gabry (2024), Journal of Machine Learning Research 25(72), 1-58. What the smoothed tail actually does to those dominating weights, and where k comes from.
- [Asymptotic Equivalence of Bayes Cross Validation and Widely Applicable Information Criterion in Singular Learning Theory](https://jmlr.org/papers/v11/watanabe10a.html) - Watanabe (2010), Journal of Machine Learning Research 11, 3571-3594. The original WAIC paper, and the proof that it targets the same quantity leave-one-out does.
- [The loo package documentation](https://mc-stan.org/loo/) - Vehtari, Gabry, Magnusson, Yao, Burkner, Paananen and Gelman. Reference pages and vignettes for `loo()`, `waic()`, `loo_compare()` and the diagnostics.

=== step === complete
## Quick recap

You built a Bayesian model comparison from the ground up, on twenty days of juice sales, and watched a fit statistic pick the wrong model.

- A better fit on the data you already have is not evidence. Six columns of pure noise lifted R-squared from 0.748 to 0.814 and cost the model 6.63 units of predictive accuracy.
- The honest score for one held-out day is the log of the average density the refitted model puts on what actually happened. Day one scored -3.14, and day three, a weekend the model could not see coming, scored -5.03.
- Add those across every day and you have elpd. Twenty refits per model gave -71.68 for the simple one against -78.37 for the bigger one, a reversal of the R-squared ranking.
- Nobody refits. Reweighting the draws you already hold by one over the density they gave each day reproduced the exact answer to 0.01 on the simple model.
- WAIC reaches the same target from the fit minus a variance penalty: -71.63 with a penalty of 2.36 for the simple model, -76.39 with 7.46 for the bigger one.
- Both shortcuts break in the same place, on days where a few draws carry the answer. Pareto k measures that, 0.7 is the line, and above it you refit those points exactly.
- Report the difference with its standard error, never a bare total: 6.63 against 1.75, which is 3.8 standard errors.

So when someone asks why you picked the smaller model:

"Scored on days neither model had seen, the simple model came out 6.6 ahead with a standard error of 1.75. The extra predictors were fitting noise."

That is a sentence you can defend in any room. Nice work getting through it, and enjoy the rest of your day.
