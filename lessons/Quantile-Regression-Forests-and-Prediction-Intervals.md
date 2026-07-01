---
title: "Gradient Boosting Lesson 6: Quantile Regression Forests and Prediction Intervals"
catalog_blurb: "Predict a range of likely outcomes, not just one number."
description: "Go past a single prediction: use quantiles and a quantile regression forest to predict a low-to-high interval in R, and check that the interval actually holds."
keywords: "quantile regression forest, prediction interval, quantile loss, pinball loss, quantregForest, ranger quantreg, confidence vs prediction interval, randomForest in R"
post_type: "LESSON"
curriculum_id: "6.40.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: ""
course_prev: "Monotonic-Constraints-for-Business-Rules.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## Quantile Regression Forests and Prediction Intervals

In Lesson 5 you fixed the DIRECTION of a model's prediction. This last lesson fixes something every model so far has quietly ignored: a single number hides how UNSURE the model is.

Sam, who runs the bike-rental kiosks, asks his model how many bikes will go out tomorrow. It answers "210." Helpful, until Sam has to act on it. Stock exactly 210 and a busy day leaves customers turned away; stock 210 on a quiet day and dozens sit unused. What Sam actually needs is a range: "almost certainly between 175 and 245, most likely around 210." That low-to-high range is a **prediction interval**, and by the end of this lesson you will build one from a forest.

By the end you will be able to:

- Say what a prediction interval is, and why one point prediction is not enough
- Read quantiles of past outcomes in R, and turn "a 90% interval" into the right cut points
- Build a prediction interval from a quantile regression forest, and check that it actually holds

**Prerequisites:** you can run R, and you know what a random forest is (it averages many decision trees; the [Random Forests course](Random-Forest-Course.html) covers it). Lesson 1, [Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html), helps but is not required. The chart below is the shape of the answer Sam wants: a band, not a line. The orange band is a prediction interval.

::widget regression-intervals {}

=== step === concept
::eyebrow The building block
## A quantile is just a cut point in your outcomes

Before intervals, one idea everything rests on: a **quantile**. Line up a set of numbers from smallest to largest. The 0.9 quantile (the 90th percentile) is the value that 90% of them fall below; the 0.5 quantile is the middle value, the **median**; the 0.05 quantile is the value only 5% fall below. A quantile is nothing more than a cut point in a sorted list of outcomes.

Here are Sam's rentals from his last 21 comparable days. Notice they do not pile up on one number, they spread out, and that spread is exactly what a single prediction throws away.

::widget chart-plotter {"data":[{"x":206},{"x":162},{"x":247},{"x":190},{"x":275},{"x":184},{"x":220},{"x":150},{"x":231},{"x":204},{"x":258},{"x":178},{"x":212},{"x":195},{"x":238},{"x":170},{"x":201},{"x":225},{"x":198},{"x":216},{"x":209}],"geoms":["histogram"],"x":"rentals"}

In R, `quantile()` reads those cut points straight off the data. Run it:

```r
past <- c(206, 162, 247, 190, 275, 184, 220, 150, 231, 204, 258,
          178, 212, 195, 238, 170, 201, 225, 198, 216, 209)

quantile(past, c(0.05, 0.50, 0.95))
#>    5%   50%   95%
#>   162   206   258
```

Read that as: on a day like these, the middle outcome is **206** bikes, 5% of days fell below **162**, and 5% rose above **258**. Those three numbers already sketch Sam's answer.

=== step === concept
::eyebrow Two ranges people confuse
## Confidence interval vs prediction interval

Now a trap that catches even experienced analysts. There are two completely different "ranges," and using the wrong one quietly understates risk.

- A **confidence interval** answers: where is the AVERAGE outcome? Where does the true mean demand sit? Collect more days and you pin the average down tighter and tighter.
- A **prediction interval** answers: where will ONE NEW outcome land? How many bikes go out TOMORROW, a single noisy day?

Sam needs the second. He is stocking for one specific day, not estimating a long-run average. Written with quantiles, an 80% prediction interval is just the pair

\[ \left[\,q_{0.10},\; q_{0.90}\,\right], \]

where \(q_{\tau}\) is the \(\tau\)-quantile of the outcomes (the cut point a fraction \(\tau\) fall below). The interval runs from the 10th percentile to the 90th, so 80% of outcomes land inside it. Widen to \([q_{0.05}, q_{0.95}]\) and you have a 90% interval.

The widget below makes the difference physical. Drag the sample size. The green confidence band collapses onto the line as data piles up, but the orange prediction band barely moves.

::widget regression-intervals {}

[KEY INSIGHT]
More data shrinks a confidence interval toward zero, because you are only locating a mean. A prediction interval never shrinks to zero: tomorrow is still a single noisy day, and that irreducible spread is the floor. Confusing the two makes you far more confident than you should be.

=== step === quiz
::eyebrow Check yourself
## Which range answers Sam's question?

Sam asks: "How many bikes will actually go out tomorrow?" He is stocking for that one day. Which interval answers him?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A confidence interval, because it pins down the demand he should plan around ::no That locates the long-run AVERAGE day. Tomorrow is one specific, noisy day; a confidence interval is far too narrow for it and would leave Sam short on busy days.
- A prediction interval, because it covers where a single new day's rentals will land ::ok Exactly. A prediction interval is built for one new outcome, noise and all, which is exactly the day Sam has to stock for.
- Neither; the point prediction of 210 already tells him enough ::no 210 is the middle guess with no sense of risk. Plan on exactly 210 and you are wrong-sided on roughly half your days.

=== step === concept
::eyebrow How you target one quantile
## The quantile loss is lopsided on purpose

To predict the median you minimize squared error and out comes the mean-ish middle. But how do you aim a model at the 90th percentile instead of the middle? You change what counts as a mistake, using the **quantile loss** (also called the pinball loss).

Pick a quantile level \(\tau\) (say \(\tau = 0.9\) for the 90th percentile). For an actual outcome \(y\) and a guess \(q\), the loss is

\[ L_{\tau}(y, q) \;=\; \max\!\big(\tau\,(y - q),\; (\tau - 1)\,(y - q)\big), \]

where \(y\) is the real number of rentals, \(q\) is the model's guess, and \(\tau\) is the quantile level between 0 and 1. The `max` just selects between two cases: when you UNDER-guess (\(q < y\)) the penalty grows at rate \(\tau\); when you OVER-guess (\(q > y\)) it grows at rate \(1 - \tau\). For \(\tau = 0.9\) that is a heavy 0.9 for under-guessing and a light 0.1 for over-guessing, so the cheapest place to sit is high up, right at the 90th percentile.

The chart is that loss as a function of your guess: a lopsided V, steep on the left, shallow on the right, with its low point near the 0.9 quantile.

::widget chart-plotter {"data":[{"x":150,"y":52.2},{"x":170,"y":35.6},{"x":190,"y":21.3},{"x":210,"y":11.2},{"x":230,"y":6.9},{"x":250,"y":5.8},{"x":270,"y":6.4},{"x":290,"y":8.2}],"geoms":["line","point"],"x":"guess","y":"loss","code":{"line":"ggplot(loss_df, aes(guess, loss)) +\n  geom_line()","point":"ggplot(loss_df, aes(guess, loss)) +\n  geom_point()"}}

Watch the loss prefer a high guess over the middle, on Sam's same 21 days:

```r
past <- c(206, 162, 247, 190, 275, 184, 220, 150, 231, 204, 258,
          178, 212, 195, 238, 170, 201, 225, 198, 216, 209)

# Average quantile (pinball) loss of a single guess q against all outcomes y.
pinball <- function(q, y, tau) mean(ifelse(y >= q, tau * (y - q), (1 - tau) * (q - y)))

# Guess the median (206) vs a high value (247), scored at the 0.9 level.
c(guess_206 = pinball(206, past, 0.9),
  guess_247 = pinball(247, past, 0.9))
#> guess_206 guess_247
#>  12.70000  5.752381
```

The high guess scores less than half the loss of the middle guess. Minimize this loss fully and the best guess is exactly `quantile(past, 0.9)` = 247. The lopsided penalty turns a prediction problem into a quantile.

=== step === tryit
::eyebrow Your turn
## Pick the cut points for a 90% interval

A prediction interval is a pair of quantiles. For a **90% interval** you want the middle 90% of outcomes, so you trim 5% off each end. Fill in the two quantile levels that give a 90% interval of Sam's past rentals.

```r
past <- c(206, 162, 247, 190, 275, 184, 220, 150, 231, 204, 258,
          178, 212, 195, 238, 170, 201, 225, 198, 216, 209)

quantile(past, ____)   # the low and high cut points of a 90% interval
```
::check {"regex":"c\\(\\s*0?\\.05\\s*,\\s*0?\\.95\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. A 90% interval trims 5% off each tail, so it runs from the 0.05 quantile to the 0.95 quantile: c(0.05, 0.95) gives 162 to 258.","no":"For 90% in the middle you leave 5% in each tail, not 10%. Use the 0.05 and 0.95 quantiles: c(0.05, 0.95)."}
::solution
```r
quantile(past, c(0.05, 0.95))
#>   5%  95%
#>  162  258
```

=== step === concept
::eyebrow The forest already knows
## Quantile regression forests: read the leaf, not the average

Here is the elegant part. You do not need a special model or a loss function to get every quantile. A plain regression forest already has what you need sitting in its leaves.

Recall how a forest predicts: a new day drops down each tree to a leaf, and that leaf holds the training days that landed there too. An ordinary forest **averages** those leaf outcomes to get one number. Leo Breiman's student Nicolai Meinshausen noticed you can keep the whole pool instead and take any **quantile** of it. Same forest, same fit, but now it reports a full distribution of likely outcomes rather than a single mean. That is a **quantile regression forest**.

::widget process-flow {"steps":[{"title":"Grow a forest","sub":"fit an ordinary regression forest; each leaf keeps the training outcomes that fall in it"},{"title":"Gather the leaf outcomes","sub":"for a new day, find its leaf in every tree and pool all of those outcomes"},{"title":"Read the quantiles","sub":"take the 5th, 50th and 95th percentile of the pool - that pair is your interval"}]}

[KEY INSIGHT]
One fit gives you every quantile at once. You never train a separate model per quantile; you just ask the same pooled outcomes a different question. The interval also adapts to the data: in a noisy region the leaf pool is wide, so the interval is wide; in a calm region it is tight.

=== step === concept
::eyebrow In R
## Build the interval from a forest

Let us do exactly that for Sam. We grow an ORDINARY `randomForest` (no quantile package), then ask each tree which leaf every day lands in. For tomorrow, we pool every training day that shared its leaf across all the trees and read the quantiles of that pool. Each lesson runs in a fresh R session, so we build Sam's season right here.

```r
library(randomForest)
set.seed(1)

# One season of Sam's kiosk: 400 days. Demand falls as price rises, climbs with
# nicer weather, and is higher at weekends - plus ordinary day-to-day noise.
n <- 400
season <- data.frame(
  price   = round(runif(n, 3, 9), 1),
  temp    = round(runif(n, 5, 30), 1),
  weekend = rbinom(n, 1, 2 / 7)
)
season$rentals <- round(180 - 14 * season$price + 4 * season$temp +
                        25 * season$weekend + rnorm(n, 0, 18))

train <- season[1:300, ]
test  <- season[301:400, ]

# An ordinary regression forest - nothing special, no quantile setting.
rf <- randomForest(rentals ~ price + temp + weekend, data = train,
                   ntree = 200, nodesize = 20)

# For every training day, the leaf it lands in, in each of the 200 trees.
train_leaf <- attr(predict(rf, train, nodes = TRUE), "nodes")   # 300 x 200

# Tomorrow: a $6.50 price, 24 degrees, a weekend.
tomorrow <- data.frame(price = 6.5, temp = 24, weekend = 1)
tmr_leaf <- attr(predict(rf, tomorrow, nodes = TRUE), "nodes")  # 1 x 200

# Pool every training day's rentals that shared tomorrow's leaf, across all trees.
neighbours <- unlist(lapply(seq_len(ncol(train_leaf)),
                     function(t) train$rentals[train_leaf[, t] == tmr_leaf[1, t]]))

# The forest's full predictive distribution for tomorrow - read off any quantiles.
quantile(neighbours, c(0.05, 0.50, 0.95))
#>      5%     50%     95%
#>  176.0   208.0   243.0
```

There it is: Sam should expect about **208** bikes tomorrow, almost surely between **176 and 243**. He stocks for the high end and staffs for the middle, with the risk made explicit instead of hidden inside a single "210."

[NOTE]
The same trick works for a booster. Train a gradient-boosting model on this exact pinball loss (for example XGBoost's `reg:quantileerror`) and it predicts one chosen quantile per fit. The forest's advantage is that ONE fit hands you every quantile, because the leaf outcomes are already there to read.

=== step === concept
::eyebrow Does it hold up?
## Check the coverage, and know the edges

A prediction interval is only as good as its honesty. A 90% interval should contain the real outcome about 90% of the time, no more, no less. We can test that on the held-out days the forest never trained on: build each day's interval and count how often the actual rentals fall inside.

```r
# Reuse the forest and leaves from the previous block.
test_leaf <- attr(predict(rf, test, nodes = TRUE), "nodes")   # 100 x 200

covered <- logical(nrow(test))
for (i in seq_len(nrow(test))) {
  pool <- unlist(lapply(seq_len(ncol(train_leaf)),
                 function(t) train$rentals[train_leaf[, t] == test_leaf[i, t]]))
  band <- quantile(pool, c(0.05, 0.95))      # a 90% prediction interval
  covered[i] <- test$rentals[i] >= band[1] & test$rentals[i] <= band[2]
}
mean(covered)        # share of real outcomes inside the 90% interval
#> [1] 0.91
```

About 91% of held-out days landed inside their 90% interval, almost bang on target. That single number is how you earn trust in an interval: not by eye, but by checking it covers what it claims.

In production you would not hand-pool leaves. The `quantregForest` and `ranger` packages do it for you (run this one in your own R session; these packages are not available in the interactive R here):

```r-static
library(ranger)

# Fit once with quantreg = TRUE, then read any quantiles you like.
qrf <- ranger(rentals ~ price + temp + weekend, data = train,
              quantreg = TRUE)

predict(qrf, tomorrow, type = "quantiles",
        quantiles = c(0.05, 0.50, 0.95))$predictions
# quantregForest::quantregForest(x, y) + predict(qrf, newdata, what = ...) is the original.
```

[WARNING]
Two real limits. A forest cannot extrapolate: every quantile it reports is built from training outcomes it has actually seen, so for a day far outside the training range (a price or temperature it never saw) the interval is unreliable, not magically wide. And the pool needs enough neighbours: with tiny leaves the quantiles get jumpy, which is why we set `nodesize = 20` to keep a decent number of outcomes in each leaf.

=== step === quiz
::eyebrow Check yourself
## How a quantile forest makes its interval

An ordinary random forest predicts tomorrow's rentals as a single 210. A quantile regression forest is the SAME forest. To produce the interval instead of that one number, it...

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Keeps all the training outcomes sitting in each leaf and reads their 5th-to-95th percentiles, instead of averaging them ::ok Exactly. The leaf outcomes are already there; averaging them gives the point prediction, taking their quantiles gives the interval. One fit, every quantile.
- Refits a separate forest for each quantile you want, one model for the 5th and another for the 95th ::no That is the thing a quantile forest avoids. A single fit holds every quantile, because the pooled leaf outcomes answer any percentile you ask of them.
- Adds a fixed plus-or-minus band around 210, sized from the overall noise level ::no A constant-width band ignores that uncertainty varies by region. The forest's interval is wide where the leaf pool is spread out and tight where it is concentrated.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Meinshausen (2006), Quantile Regression Forests, JMLR 7](https://www.jmlr.org/papers/v7/meinshausen06a.html) - the paper that introduced reading quantiles from a forest's leaves, exactly what you built here.
- [Koenker & Bassett (1978), Regression Quantiles, Econometrica 46(1)](https://doi.org/10.2307/1913643) - the origin of the quantile (pinball) loss that defines a quantile as a minimizer.
- [quantregForest (CRAN package)](https://cran.r-project.org/package=quantregForest) - Meinshausen's own R implementation; fit once, predict any quantile.
- [Wright & Ziegler (2017), ranger: A Fast Implementation of Random Forests, JSS 77(1)](https://doi.org/10.18637/jss.v077.i01) - the fast forest you would reach for in practice, with `quantreg = TRUE` built in.

=== step === complete
## Module complete

You can now predict a range, not just a point. You met the quantile as a cut point in your outcomes, separated a confidence interval (about the average) from a prediction interval (about one new day), saw how the lopsided quantile loss targets a quantile, and built a real prediction interval by reading the pooled leaf outcomes of an ordinary random forest. Then you did the thing most people skip: you checked that the 90% interval actually covered about 90% of held-out days.

That completes Gradient Boosting in R. You went from boosting one tree onto another, through the knobs that matter, monotonic business rules, and now to predictions that carry their own uncertainty. A model that says "210, almost surely 176 to 243" is one a real decision can lean on.
