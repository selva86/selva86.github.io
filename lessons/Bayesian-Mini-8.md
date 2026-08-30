---
title: "Bayesian hierarchical models, explained"
slug: "Bayesian-Mini-8"
description: "Twenty stores, one promotion. Each store on its own gives nonsense and one pooled number pretends they are identical. Build the third answer, then grade it."
keywords: "Bayesian hierarchical model, partial pooling, shrinkage estimate, multilevel model, random effects, borrowing strength, group level estimates, hierarchical model in R"
mathjax: true
webr: true
date: "2026-08-30"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "8"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-7"
course_next: ""
curriculum_id: "0.0.53"
lesson_access: "windowed"
catalog_blurb: "How to estimate an effect per group when some groups have thin data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Bayesian hierarchical models, explained

Let's say you manage twenty stores. A promotion has just finished, every store ran it, and the head of sales wants one number per store: how much did this lift sales here?

There are two obvious ways to answer that, and both of them break.

The first is to work out every store on its own. That sounds fair until you reach a store that managed only four days of the promotion before the campaign ended. Those four days say the promotion **cost** you 4.3% of sales.

Nobody believes that, and nobody should.

The second is to pool the twenty stores and report one number. Do that and every store is handed 6.5%, which says the twenty stores are identical. They are not, and you know they are not.

So one answer is too jumpy and the other is too blunt.

There is a third way, and that is what a hierarchical model does. You let every store keep its own lift, and at the same time you say the twenty true lifts all came out of one common population. Then you let the data tell you how wide that population is, and you use that width to decide how far to pull each store toward the middle.

Here is the shape of it before we build it.

::widget process-flow {"steps":[{"title":"Give every store its own lift","sub":"twenty separate answers, not one blended number"},{"title":"Learn how much the stores really differ","sub":"the width of the population those twenty lifts came from"},{"title":"Pull each store in by what its data deserves","sub":"four days of evidence move a long way, sixty days barely move"}]}

By the end you will have a lift for every store, a width around each of those lifts, and a scorecard that says whether any of this beat the two obvious answers.

=== step === concept
## The twenty stores and what each one measured

Let's get the numbers on the table first, because every calculation from here on reads off them.

The promotion was rolled out store by store as each shop was ready, so the stores did not all run it for the same length of time. The oldest store ran it for sixty days and the newest one managed three. For every day a store was running the promotion, we recorded that day's sales lift as a percent against the same day a year earlier.

That gives one row per store per day. Press Run.

```r
# Build the twenty stores and their daily promotion results
set.seed(62)

days <- c(3, 3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 18, 22, 26, 30, 36, 42, 48, 54, 60)
true_lift <- rnorm(20, mean = 6, sd = 3)     # the twenty real lifts, set aside for now

promo <- do.call(rbind, lapply(1:20, function(j) {
  data.frame(store = sprintf("S%02d", j),
             lift  = rnorm(days[j], mean = true_lift[j], sd = 8))
}))

nrow(promo)
#> [1] 412
head(promo, 4)
#>   store      lift
#> 1   S01 -2.735787
#> 2   S01 16.549777
#> 3   S01 15.015019
#> 4   S02 17.170131
```

I built these twenty stores myself, so I know what each store's lift really is. That is what `true_lift` is holding. We will not look at it while we work, and at the end we will grade every method against it.

Now notice how noisy a single day is. Store S01's three days came in at minus 2.7, then 16.5, then 15.0. Daily sales bounce around for a hundred reasons that have nothing to do with a promotion, so one day tells you very little.

The usual way to calm that down is to average the days and report how shaky that average is. Here are both, for all twenty stores.

```r
# Summarise each store: days run, average lift, and how shaky that average is
stores <- data.frame(
  store = sprintf("S%02d", 1:20),
  days  = days,
  y     = round(tapply(promo$lift, promo$store, mean), 1),
  se    = round(tapply(promo$lift, promo$store, sd) / sqrt(days), 1)
)

print(stores, row.names = FALSE)
#>  store days    y  se
#>    S01    3  9.6 6.2
#>    S02    3  8.6 4.5
#>    S03    4 -4.3 5.6
#>    S04    4 -0.1 3.3
#>    S05    5 18.1 3.0
#>    S06    6  6.6 2.0
#>    S07    7 12.8 2.9
#>    S08    8  3.6 2.6
#>    S09   10  9.6 3.8
#>    S10   12  3.5 2.5
#>    S11   14  4.9 2.1
#>    S12   18  9.7 1.8
#>    S13   22  5.6 1.7
#>    S14   26  1.1 1.8
#>    S15   30  2.9 1.6
#>    S16   36  6.3 1.3
#>    S17   42  8.8 1.1
#>    S18   48  6.8 1.3
#>    S19   54 11.1 1.0
#>    S20   60  5.5 0.8
```

Two columns matter from here on. `y` is the store's own answer, the average of its daily lifts. `se` is the standard error of that average, which is the store's day to day spread divided by the square root of how many days it ran.

Read `se` like this: if this store ran the same promotion again, its average would land about that far from where it landed this time. S20 has a standard error of 0.8, so its 5.5% is solid. S01 has 6.2, so its 9.6% could just as easily have come back at 3.4% or at 15.8%.

That one column is what makes the rest of the work possible. Every store tells you its answer, and it also tells you how much that answer is worth.

=== step === concept
## Why one pooled number and twenty separate numbers both go wrong

Now let's put the two obvious answers side by side and see what each one gives you.

Taking each store on its own means reading the `y` column straight off and stopping there. Pooling everything means averaging the twenty stores into one number and handing that to all of them. Let's draw both.

```r
# Draw every store's own estimate against the single pooled number
pool_all <- mean(stores$y)

plot(stores$y, 1:20, pch = 19, col = "grey30", xlim = c(-12, 24),
     yaxt = "n", xlab = "Estimated lift, in percent", ylab = "",
     main = "Twenty separate answers, and one pooled answer")
segments(stores$y - stores$se, 1:20, stores$y + stores$se, 1:20, col = "grey60")
axis(2, at = 1:20, labels = stores$store, las = 1, cex.axis = 0.7)
abline(v = pool_all, col = "firebrick", lwd = 3)

round(pool_all, 1)
#> [1] 6.5
```

The dots are the twenty separate answers and the grey bars run one standard error either side. The red line is the pooled answer, 6.5%.

Look at the bottom of the plot, where the thin stores sit. S03 says the promotion cost 4.3% and S05 says it earned 18.1%. That is a gap of 22.4 percentage points between two shops selling the same goods in the same chain. Their bars are enormous, which is the data telling you it does not really know. Take those two numbers to the head of sales and you will be asked why S03 is still open.

Now look at the red line. It runs through everything, including S19 at 11.1% and S14 at 1.1%, both measured over weeks and both with short bars. Those two stores really are different, and the pooled number erases the difference on purpose.

So the two failures are opposites. Twenty separate numbers believe the thin stores far too much. One pooled number refuses to believe any store at all.

[NOTE]
The long bars and the wild numbers belong to the same stores. The three widest bars in the plot are S01 at 6.2, S03 at 5.6 and S02 at 4.5, and all three of those stores ran the promotion for four days or fewer. Nothing is wrong with those shops. They just have less evidence behind them.

=== step === concept
## What a hierarchical model assumes about the twenty stores

Here is the assumption that gets us out of the trap, and it is a mild one.

The twenty stores are not identical, but they are not strangers either. They are in the same chain, they sell the same goods, and they ran the same promotion. So instead of treating the twenty true lifts as twenty unrelated numbers, we say they are twenty draws from one population of store lifts. Some stores sit above the middle of that population and some sit below it.

That gives us a model in two levels. Writing \(y_j\) for what store \(j\) measured and \(\theta_j\) for what store \(j\)'s lift truly is, the measurement level says:

\[ y_j \sim \text{Normal}(\theta_j,\ se_j^2) \]

which reads: the average we measured is centred on the store's true lift, and it wobbles by the standard error we already computed. Then the population level says where those true lifts came from in the first place:

\[ \theta_j \sim \text{Normal}(\mu,\ \tau^2) \]

Two new symbols, and both are plain. \(\mu\) is said "mu" and it is the centre of the population, which is the typical lift across the chain. \(\tau\) is said "tau" and it is the spread of the population, which is how far an ordinary store sits from that centre.

The word hierarchical is just that two-level shape. Days sit inside stores, and stores sit inside a chain.

Here is what that second level looks like as a picture. The curve is a candidate population and the ticks along the bottom are the twenty averages we measured.

```r
# Draw one candidate population of true store lifts, with the observed averages underneath
curve(dnorm(x, mean = 6, sd = 4), from = -8, to = 22, lwd = 2, col = "steelblue",
      xlab = "A store's true lift, in percent", ylab = "How likely that lift is",
      main = "One guess at the population the twenty stores came from")
rug(stores$y, lwd = 2, col = "grey30")
```

That curve is a guess. I typed a centre of 6 and a spread of 4 into it by hand, and neither number was learned from anything. That leaves the open question: how wide is that curve really?

It matters more than it looks. A narrow curve says the twenty stores are nearly the same, so a store reporting 18.1% is almost certainly a store that got lucky. A wide curve says stores genuinely do differ that much, so 18.1% might be real. The width decides how seriously to take every number in the table, and we can work it out from the data.

=== step === concept
## How much do the stores really differ?

The whole model turns on this one quantity, so let's go slowly.

You might reasonably say: just look at the spread of the twenty averages. Fair enough. Let's do that, and put it next to the typical standard error.

```r
# Compare the spread we can see with the size of the measurement noise
c(spread_of_the_averages = round(sd(stores$y), 1),
  typical_standard_error = round(mean(stores$se), 1))
#> spread_of_the_averages typical_standard_error 
#>                    4.9                    2.5 
```

The twenty averages are spread 4.9 points apart. But 4.9 is not the answer.

Two separate things pushed those dots apart. Real differences between the stores pushed them apart, and measurement noise pushed them apart on top of that, by about 2.5 points on a typical store and by much more on a thin one. What we can see is the two of them combined, so the real spread \(\tau\) has to be smaller than 4.9.

Separating the two is the job. The Bayesian way to do it is to stop hunting for a single value of \(\tau\) and score every value it could take instead.

Here is how that scoring works in words, before the code. Pick a candidate \(\tau\), say 3. Under that candidate, store \(j\)'s measured average had to travel through two lots of wobble to reach us: \(\tau^2\) worth of real store to store difference, and \(se_j^2\) worth of measurement noise. Add them and you have the total variance that candidate predicts for that store, \(se_j^2 + \tau^2\). Then ask how surprising the twenty numbers we saw would be under it. Candidates that make our data unsurprising score highly.

We run that over a grid of candidates from 0.05 up to 12, with no preference between them before we look.

```r
# Score every candidate spread from 0.05 to 12 against the twenty averages
tau_grid <- seq(0.05, 12, by = 0.05)

post_tau <- sapply(tau_grid, function(tau) {
  V  <- stores$se^2 + tau^2                    # each store's total variance at this tau
  w  <- 1 / V                                  # precise stores count for more
  mu <- sum(w * stores$y) / sum(w)             # the best centre, given this tau
  prod(V^(-0.5)) * exp(-0.5 * sum((stores$y - mu)^2 / V))  # how unsurprising our twenty look
})
post_tau <- post_tau / sum(post_tau)           # turn the scores into probabilities

plot(tau_grid, post_tau, type = "l", lwd = 2, col = "steelblue",
     xlab = "tau: how far apart the true store lifts are",
     ylab = "How likely that spread is",
     main = "How different are the twenty stores, really?")

tau_hat <- round(sum(tau_grid * post_tau), 2)
cdf     <- cumsum(post_tau)

c(tau_hat = tau_hat,
  lower   = tau_grid[which(cdf >= 0.05)[1]],
  upper   = tau_grid[which(cdf >= 0.95)[1]])
#> tau_hat   lower   upper 
#>    3.48    2.15    5.20 
```

That curve is the posterior over \(\tau\), which is the name for what you believe about a quantity once the data has had its say. Here that is every candidate spread, rated by how well it explains the twenty averages and rescaled so the whole curve adds to one. It answers the question the picture asked. Its average is 3.48, and 90% of its weight sits between 2.15 and 5.20.

Read it like this: an ordinary store sits about three and a half points off the chain average, and the data is sure enough to rule out both extremes. Zero has essentially no weight on that curve, so the stores genuinely do differ. Only about 1% of the weight sits past 6, so a real 22.4 point gap between two shops is not something this chain produces either. Most of what we saw between S03 and S05 was never a difference between the shops at all.

The last piece is the centre of that population. Now that we know how noisy each store is, we can weight each one by how precise it is instead of counting all twenty equally.

```r
# Find the centre of the population, weighting each store by how precise it is
w      <- 1 / (stores$se^2 + tau_hat^2)
mu_hat <- sum(w * stores$y) / sum(w)

round(mu_hat, 2)
#> [1] 6.64
```

So the chain's typical lift is 6.64%, and the stores scatter around it with a spread of 3.48 points. Those two numbers are the population, and we learned them from the data instead of assuming them.

From here we carry them forward as though they were settled, which keeps every store's answer down to one line of arithmetic. It is worth knowing what that costs. The widths we compute later treat 3.48 as exact, so they come out a little narrower than they honestly should be.

[KEY INSIGHT]
\(\tau\) is the one quantity a hierarchical model adds that neither obvious method has. Trusting each store on its own is what you get if you assume \(\tau\) is enormous, because a huge population spread means one store tells you nothing about another. One pooled number is what you get if you assume \(\tau\) is zero. We assumed neither. We estimated it, and got 3.48.

=== step === concept
## The shrinkage weight, worked out for one store

We now have everything we need to fix S03, and the fix is one fraction.

Think about what we know about S03 before we look at its four days at all. It is a store in this chain, so its true lift is a draw from a population centred at 6.64 with a spread of 3.48. That is a prior, and it is not something we made up. We learned it from the other nineteen stores.

Then S03's own four days arrive and say minus 4.3, with a standard error of 5.6. That is the evidence.

So we hold a belief and we hold some data, and the answer sits between them, closer to whichever one is tighter.

The sliders below let you feel that. Three curves are drawn and the legend names them: the prior is the belief you hold before the data, the likelihood is what the data alone says, and the posterior is the answer that combines the two. Push the number of data points up and watch the posterior stop caring about the prior.

::widget bayes-update {}

For our two-level normal model that combination has a closed form, and it is worth seeing, because then you can work it out by hand. Store \(j\) gets a weight:

\[ B_j = \frac{se_j^2}{se_j^2 + \tau^2} \]

and its estimate becomes:

\[ \hat\theta_j = (1 - B_j)\, y_j + B_j\, \mu \]

Read \(B_j\) as the share of the answer that comes from the population rather than from the store itself. Now look at what the fraction does. If the store is noisy, \(se_j^2\) is large, so \(B_j\) climbs toward 1 and the estimate is mostly \(\mu\). If the store is precise, \(se_j^2\) is small next to \(\tau^2\), so \(B_j\) falls toward 0 and the store keeps its own number.

The name for the pull is shrinkage, \(B_j\) is the shrinkage weight, and the method as a whole is called partial pooling, because every store's answer ends up part its own and part the chain's. Let's run it for S03.

```r
# Work out the shrinkage weight for store S03 and where its estimate lands
s03 <- stores[stores$store == "S03", ]

B_s03      <- s03$se^2 / (s03$se^2 + tau_hat^2)
pooled_s03 <- (1 - B_s03) * s03$y + B_s03 * mu_hat

cat(sprintf("S03 ran %.0f days, raw lift %.1f%%, standard error %.1f\n",
            s03$days, s03$y, s03$se))
cat(sprintf("B = %.2f, so S03 moves from %.1f%% to %.1f%%\n",
            B_s03, s03$y, pooled_s03))
#> S03 ran 4 days, raw lift -4.3%, standard error 5.6
#> B = 0.72, so S03 moves from -4.3% to 3.6%
```

S03's four days are worth 28% of its own answer, and the remaining 72% comes from what the chain looks like. That carries it from minus 4.3% up to 3.6%.

And that is a real estimate, not a fudge. We did not overrule S03 because its number looked bad. We overruled it by exactly the amount a standard error of 5.6 deserves against a population spread of 3.48, and the same fraction applied to a steadier store would barely touch it.

=== step === quiz
## Quick check: which store gets pulled hardest?

Look back at the table of twenty stores and its `days`, `y` and `se` columns. One of these four gets pulled the furthest toward 6.64%. Which one, and why?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- S05, because its 18.1% is the biggest lift in the table and so has the furthest to fall. ::no
- S03, because minus 4.3% is the one answer that is obviously wrong. ::no
- S01, because its standard error of 6.2 is the largest in the table, so its own average is worth the least. ::ok Exactly. The weight reads the standard error and nothing else, and S01 has the shakiest average of the twenty. Its B works out at 0.76, the highest of any store.
- S20, because sixty days of data give the model the most to work with. ::no The pull has nothing to do with how big a store's lift is, or how odd it looks. The weight B is se squared over se squared plus tau squared, which reads the store's standard error and nothing else, so the shakiest average moves furthest and the steadiest moves least. S01 at 6.2 is the shakiest of the twenty. S20 at 0.8 is the steadiest, and it will barely move at all.

=== step === concept
## All twenty stores, pulled in by what their data deserves

The same two lines apply to every store, so let's run them on all twenty and see what each one did.

```r
# Apply the same two lines to all twenty stores
B         <- stores$se^2 / (stores$se^2 + tau_hat^2)
pooled    <- (1 - B) * stores$y + B * mu_hat
pooled_se <- sqrt(1 / (1 / stores$se^2 + 1 / tau_hat^2))

fitted <- data.frame(store = stores$store, days = stores$days, se = stores$se,
                     B = round(B, 2), raw = stores$y,
                     pooled = round(pooled, 1), pooled_se = round(pooled_se, 1))
print(fitted, row.names = FALSE)
#>  store days  se    B  raw pooled pooled_se
#>    S01    3 6.2 0.76  9.6    7.4       3.0
#>    S02    3 4.5 0.63  8.6    7.4       2.8
#>    S03    4 5.6 0.72 -4.3    3.6       3.0
#>    S04    4 3.3 0.47 -0.1    3.1       2.4
#>    S05    5 3.0 0.43 18.1   13.2       2.3
#>    S06    6 2.0 0.25  6.6    6.6       1.7
#>    S07    7 2.9 0.41 12.8   10.3       2.2
#>    S08    8 2.6 0.36  3.6    4.7       2.1
#>    S09   10 3.8 0.54  9.6    8.0       2.6
#>    S10   12 2.5 0.34  3.5    4.6       2.0
#>    S11   14 2.1 0.27  4.9    5.4       1.8
#>    S12   18 1.8 0.21  9.7    9.1       1.6
#>    S13   22 1.7 0.19  5.6    5.8       1.5
#>    S14   26 1.8 0.21  1.1    2.3       1.6
#>    S15   30 1.6 0.17  2.9    3.6       1.5
#>    S16   36 1.3 0.12  6.3    6.3       1.2
#>    S17   42 1.1 0.09  8.8    8.6       1.0
#>    S18   48 1.3 0.12  6.8    6.8       1.2
#>    S19   54 1.0 0.08 11.1   10.8       1.0
#>    S20   60 0.8 0.05  5.5    5.6       0.8
```

Read the `B` column from top to bottom and watch the weight fall away as the days pile up. S01 hands over 76% of its answer. S20 hands over 5%, and the table shows it moving from 5.5% to 5.6%, a tenth of a point. The model did not decide the big stores were more trustworthy because they were big. It read their standard errors, which are small precisely because those stores ran the promotion for weeks.

Now the same thing as a picture, so you can see the movement.

```r
# Draw the move every store makes, from its raw estimate to its pooled estimate
plot(stores$y, 1:20, pch = 1, col = "grey55", xlim = c(-8, 22), yaxt = "n",
     xlab = "Lift, in percent", ylab = "",
     main = "Every store pulled in by what its data deserves")
arrows(stores$y, 1:20, pooled, 1:20, length = 0.06, col = "grey55")
points(pooled, 1:20, pch = 19, col = "steelblue")
axis(2, at = 1:20, labels = stores$store, las = 1, cex.axis = 0.7)
abline(v = mu_hat, col = "firebrick", lwd = 2, lty = 2)
```

Hollow circles are where each store started, blue dots are where it ended, and the red dashed line is 6.64%. Every long arrow belongs to a thin store down at the bottom, and the longest of them is S03, which moves 7.9 points. Up at the top, where the stores that ran for weeks sit, the arrows are barely visible.

One more column deserves a look, and that is `pooled_se`. Pulling a store toward the middle also narrows it, because the estimate now stands on that store's own days plus everything the other nineteen stores say about a typical store. S03 arrived with a standard error of 5.6 and leaves with 3.0. That is what people mean when they say a small group borrows strength from the rest.

[NOTE]
The thin stores stay the widest even after pooling. S03's 3.0 is still nearly four times S20's 0.8. Partial pooling never pretends a four day store was measured well. It only stops us from taking that store at its word.

=== step === concept
## Does partial pooling land closer to the truth?

Everything so far is a nice story about borrowing strength. Let's find out whether it is true.

We can check, because I built these twenty stores from twenty known lifts, and `true_lift` has been sitting in memory since the start. So take each method's twenty estimates, measure how far each one lands from that store's real lift, square the distances and add them up. Lowest total wins.

```r
# Grade all three methods against the twenty true lifts the stores were built from
err_alone   <- sum((stores$y - true_lift)^2)
err_pooled  <- sum((pool_all  - true_lift)^2)
err_partial <- sum((pooled    - true_lift)^2)

round(c(each_store_alone  = err_alone,
        one_pooled_number = err_pooled,
        partial_pooling   = err_partial), 1)
#>  each_store_alone one_pooled_number   partial_pooling 
#>             144.8             179.7              39.9 
```

Partial pooling is not a little better. Its total squared error is 3.6 times smaller than trusting each store on its own, and four and a half times smaller than handing everybody the same number.

A gap that size has to come from somewhere, so let's see which stores produced it.

```r
# Show which stores those errors come from
plot(stores$days, abs(stores$y - true_lift), log = "x", pch = 19, col = "grey55",
     ylim = c(0, 13), xlab = "Days the promotion ran (log scale)",
     ylab = "Distance from the store's true lift",
     main = "Where each method goes wrong")
points(stores$days, abs(pool_all - true_lift), pch = 19, col = "firebrick")
points(stores$days, abs(pooled - true_lift), pch = 19, col = "steelblue")
legend("topright", pch = 19, col = c("grey55", "firebrick", "steelblue"),
       legend = c("each store alone", "one pooled number", "partial pooling"), bty = "n")
```

The grey dots sit highest on the left, which is the thin stores being badly wrong on their own. Two of the three-day stores are down near the floor instead, and that is the same problem showing its other face. On three days you land close to the truth or a long way from it by luck, and nothing in the store's own numbers tells you which one you got. The red dots ignore the horizontal axis completely, because every store is handed the same 6.5%. A few stores happen to sit near it and are fine, and the rest are wrong by however far they truly sit from it, up to 6.3 points. The blue dots are low, and they stay low, with the worst of them 3.1 points out.

Let's count that split instead of eyeballing it.

```r
# Split the same errors by how much data the store had
thin <- stores$days <= 5

round(c(five_days_or_fewer_alone  = sum((stores$y - true_lift)[thin]^2),
        five_days_or_fewer_pooled = sum((pooled   - true_lift)[thin]^2),
        longer_runs_alone         = sum((stores$y - true_lift)[!thin]^2),
        longer_runs_pooled        = sum((pooled   - true_lift)[!thin]^2)), 1)
#>  five_days_or_fewer_alone five_days_or_fewer_pooled         longer_runs_alone 
#>                     105.9                      15.9                      38.9 
#>        longer_runs_pooled 
#>                      24.0 
```

There is the result in four numbers. The five thinnest stores carried 105.9 of the 144.8 total error when left alone, and partial pooling cut that to 15.9. The fifteen better measured stores went from 38.9 to 24.0, so they improved a little as well, and they were certainly not harmed.

[KEY INSIGHT]
Pulling estimates toward a common centre makes each one individually biased, and it still wins. You accept a small, known bias on every store in exchange for killing the wild swings on the thin ones, and here that trade cut the total error by a factor of 3.6. That trade is the reason hierarchical models are worth fitting.

=== step === widget
## What happens at the two ends of the pooling dial

Our estimate of \(\tau\) came out at 3.48, comfortably between the two failures. So think of \(\tau\) as a dial with those two failures at its ends, and it is worth feeling what happens as it turns. Here is a second set of groups to turn that dial on.

Eight clinics each measured a handful of patients. Some clinics saw forty patients and some saw only two, so their raw averages scatter wildly for exactly the reason our thin stores did. The faint dots are the raw averages, the green dots are the pooled estimates, and the size of a green dot is how many patients that clinic saw.

::widget shrinkage-pool {}

Drag the slider to the far left. Every clinic keeps its own number, including the clinic with two patients, which is the same mistake as reading our `y` column and stopping there.

Now drag it to the far right. All eight collapse onto one number, which is the clinics' version of that red line drawn straight through our twenty stores.

Then leave it in the middle and watch which dots move. The tiny clinics travel a long way and the forty patient clinic hardly shifts. Nobody told the model which clinics to trust. The sample sizes did that, through the same weight we computed by hand.

=== step === quiz
## Quick check: what would a tau near zero have done?

Our grid put \(\tau\) at 3.48, with 90% of its weight between 2.15 and 5.20. Suppose instead the twenty averages had been so alike that the grid put \(\tau\) at almost zero. What would the twenty pooled estimates have looked like?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Every store would have kept its own raw estimate, because a small population spread means the model trusts each store's own data. ::no
- Every weight would have gone to almost 1, so all twenty estimates would collapse onto 6.64%, which is one pooled number for the whole chain. ::ok Right. A population with no width says the twenty stores are effectively the same store, so nothing a single store measured can pull it away from the middle. Complete pooling is not really a rival method here. It is what this model does when tau is zero.
- The estimates would have stayed where they are, but every `pooled_se` would have grown instead. ::no
- It would mean the promotion had no real effect in any of the twenty stores. ::no Put the weight next to the claim: B is se squared divided by se squared plus tau squared. Send tau to zero and the bottom of that fraction becomes the top, so B goes to 1 and every store is handed the population centre. Send tau up instead and B falls to 0, which leaves every store exactly where it started. A tau near zero says nothing about whether the promotion worked, and it widens nothing. It says the twenty stores are alike.

=== step === tryit
## Your turn: pool a twenty-first store into the model

A twenty-first store has just reported in. It ran the promotion for five days and came back with a lift of 21.0% and a standard error of 3.4.

Left alone, that store goes into the deck as the best performer in the chain, ahead of S05 by nearly three points. Your job is to say where it should really sit. The fitted population is already on the page, in `tau_hat` and `mu_hat`, so work out the weight first and then the estimate.

```r
# A twenty-first store reports 21.0% over five days, with a standard error of 3.4
y_new  <- 21.0
se_new <- 3.4

# Work out this store's shrinkage weight B_new, then its pooled estimate.
# Two lines, both using tau_hat and mu_hat. Press Check when you have them.
```
::check {"regex": "se_new\\s*\\^\\s*2\\s*/\\s*[(][^)]*tau_hat", "gate": true, "difficulty": "beginner", "ok": "That is it. B comes out at 0.49, so the store keeps about half its own answer and lands at 14.0%. Still the top store in the chain, and no longer a headline nobody can defend.", "no": "Use the same fraction we ran for S03, with this store's numbers: B_new is se_new^2 divided by (se_new^2 + tau_hat^2). Then the estimate is (1 - B_new) * y_new + B_new * mu_hat."}
::solution
```r
# Pool the twenty-first store into the population we already fitted
B_new      <- se_new^2 / (se_new^2 + tau_hat^2)
pooled_new <- (1 - B_new) * y_new + B_new * mu_hat

cat(sprintf("B = %.2f, pooled estimate = %.1f%%\n", B_new, pooled_new))
#> B = 0.49, pooled estimate = 14.0%
```

Five days buys this store roughly half its own answer. And notice that nothing had to be refitted to do it. The population was already learned from twenty stores, so a new store just reads its weight off it.

=== step === concept
## References

- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013), chapter 5. The hierarchical normal model built here, including the grid over the population spread.
- [Data Analysis Using Regression and Multilevel/Hierarchical Models](https://doi.org/10.1017/CBO9780511790942) - Gelman and Hill (2007), chapters 11 and 12. Partial pooling written for working analysts, with the weight in the same form.
- [Stein's Paradox in Statistics](https://doi.org/10.1038/scientificamerican0577-119) - Efron and Morris (1977), Scientific American 236(5), 119-127. The result that pulled estimates beat separate ones, explained without a single integral.
- [Prior distributions for variance parameters in hierarchical models](https://doi.org/10.1214/06-BA117A) - Gelman (2006), Bayesian Analysis 1(3), 515-534. What to put on the population spread, and when a flat prior over it is a bad idea.

=== step === complete
## Quick recap

You started with twenty stores and two answers that both failed, and you finished with one that beat them both on a graded test. Here is the whole thing in order:

- Every store reported an answer and how shaky it was, the `y` column and the `se` column, over runs of three days up to sixty.
- The two obvious methods broke in opposite directions. Twenty separate numbers gave one store minus 4.3% and another 18.1%, and one pooled number gave everybody 6.5% and erased the real differences.
- You measured how much the stores truly differ. The spread of the averages was 4.9 points, but part of that was measurement noise, so scoring the whole grid put the real spread at 3.48, with 90% of the weight between 2.15 and 5.20. The chain's centre came out at 6.64%.
- That spread turned into a weight for every store. B is the store's variance over the store's variance plus the population's, so S03 at 0.72 handed over most of its answer and moved from minus 4.3% to 3.6%, while S20 at 0.05 moved a tenth of a point.
- Partial pooling then held up against the truth, with a squared error of 39.9 against 144.8 for separate estimates and 179.7 for one pooled number, and almost all of that gain came from the five thinnest stores.

The sentence worth keeping is this one: a hierarchical model lets every group have its own effect while assuming those effects came from a common population, and the width of that population decides how far each group gets pulled in.

In real work you will not fit these on a grid. Once the model has predictors, or more than one grouping, or a slope that varies by store, the closed form runs out and you reach for `lmer()` from lme4 or `brm()` from brms, either of which fits the same two levels from one line of formula. What they hand back is what you just computed by hand. You now know exactly what the shrinkage in their output is doing, and why the small groups moved most.

Congratulations, and have a great day.
