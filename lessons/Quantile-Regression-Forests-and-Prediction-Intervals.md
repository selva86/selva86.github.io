---
title: "Gradient Boosting Lesson 6: Quantile Regression Forests and Prediction Intervals"
catalog_blurb: "Predict a range of likely outcomes, not just one number."
description: "A single forecast is not a plan. Turn a random forest into prediction intervals in R: read quantiles from the outcomes stored in each leaf, then check the coverage."
keywords: "quantile regression forest, prediction interval, quantile loss, pinball loss, random forest, coverage, conditional quantile, uncertainty, ranger, quantregForest, R"
post_type: "LESSON"
curriculum_id: "6.40.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "Gradient-Boosting-Quiz.html"
course_prev: "Monotonic-Constraints-for-Business-Rules.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## Quantile Regression Forests and Prediction Intervals

In Lesson 5 you forced a model's predictions to move in a sensible DIRECTION. This last lesson fixes a different gap, one that every model in this course has left open: they all hand back a single number.

Sam, who runs the bike-rental kiosks, asks his forecast one honest question the morning before a warm day: "How many bikes will go out tomorrow?" The model answers "about 210." But Sam does not run on a point estimate. He has to decide how many bikes to have serviced and how many staff to call in. "About 210" gives him no way to plan for a slow day or a rush. What he actually needs is a RANGE he can trust: "very likely somewhere between 130 and 279, and here is how sure I am."

That range is a **prediction interval**, and by the end of this lesson you will be able to:

- Say what a prediction interval is, and why it is not the same as a confidence interval
- Read a quantile of past outcomes in R, and turn "a 90% interval" into the right pair of quantiles
- Explain the quantile (pinball) loss and see, on real numbers, why its minimizer is a quantile
- Build a prediction interval from a random forest in R, and check that it actually covers

**Prerequisites:** you can run R, and you know what a random forest is: an ensemble that averages many decision trees (the [Random Forests course](Random-Forest-Course.html) builds one from scratch). Lesson 1 of this course ([Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html)) helps but is not required. The band below is the shape of the answer we are after: not a single line, but a range around it.

::widget regression-intervals {}

=== step === concept
::eyebrow The building block
## A quantile is a cut point in your outcomes

Before we touch a forest, let us nail down the one word the whole lesson rests on: **quantile**.

Sam pulls the 21 most similar warm days from his records, the rentals on each:

```r
past <- c(150, 162, 170, 176, 182, 188, 193, 197, 200, 203, 206,
          210, 214, 219, 225, 231, 238, 246, 252, 258, 270)
```

A quantile is just a value that a given FRACTION of these outcomes fall below. The **median** is the 0.5 quantile: half the days came in under it. The 0.9 quantile is the value that 90% of days stayed below, and 10% beat. In R, `quantile()` reads them straight off the data:

```r
quantile(past, c(0.05, 0.50, 0.95))
#>  5% 50% 95%
#> 162 206 258
```

So on a day like these, half the time Sam rents fewer than 206 bikes; only the busiest 5% of days top 258; and only the slowest 5% fall below 162.

[KEY INSIGHT]
Write \(q_\tau\) for the quantile at level \(\tau\) (a fraction between 0 and 1). It is defined by \(P(Y \le q_\tau) = \tau\): the outcome \(Y\) lands at or below \(q_\tau\) a fraction \(\tau\) of the time. The median is \(q_{0.5}\); the two ends of a 90% interval are \(q_{0.05}\) and \(q_{0.95}\).

Those three numbers, 162 / 206 / 258, already ARE a forecast with a range attached. The rest of the lesson is about getting them from a model, for any day, without hand-picking "similar days."

::widget chart-plotter {"data":[{"x":150},{"x":162},{"x":170},{"x":176},{"x":182},{"x":188},{"x":193},{"x":197},{"x":200},{"x":203},{"x":206},{"x":210},{"x":214},{"x":219},{"x":225},{"x":231},{"x":238},{"x":246},{"x":252},{"x":258},{"x":270}],"geoms":["histogram"],"x":"rentals"}

=== step === concept
::eyebrow Two very different intervals
## Where is the average, vs where will one day land

A 90% prediction interval like [162, 258] answers Sam's real question: where will ONE new day land? That is different from a question people often confuse it with: where is the AVERAGE of warm days?

- A **confidence interval** is about the mean. "The average warm day rents 206 bikes, give or take a few." With more data, we pin the average down tighter and tighter, so this interval shrinks toward the line.
- A **prediction interval** is about a single new outcome. "Tomorrow, one specific warm day, will very likely land between 162 and 258." It stays wide no matter how much data you gather, because a single day carries its own irreducible day-to-day noise.

Formally, a symmetric \(1 - 2\alpha\) prediction interval is \([\,q_\alpha,\ q_{1-\alpha}\,]\). For a 90% interval you set \(\alpha = 0.05\) and read \([\,q_{0.05},\ q_{0.95}\,]\), leaving 5% of outcomes to spill out each side.

Slide the sample size below. The green confidence band (about the mean) collapses onto the line as data grows. The orange prediction band (where a new point lands) barely budges. Sam needs the orange one.

::widget regression-intervals {}

=== step === quiz
::eyebrow Check yourself
## Which interval does Sam need?

Sam is stocking the kiosk for tomorrow, one specific warm day, and wants to know how many bikes could realistically go out. Which interval answers that?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A confidence interval, because it is the standard way to report uncertainty ::no A confidence interval is about the AVERAGE warm day. It shrinks as data grows and would be far too narrow for a single day, so Sam would under-stock. He needs the interval for one new outcome.
- A prediction interval, because he is asking about one new day's outcome ::ok Right. Stocking is a decision about a single day, so he needs the range a new outcome could fall in, not the range for the mean.
- Neither, a single point prediction is enough to stock the kiosk ::no A point prediction gives no sense of a slow day or a rush, so it cannot tell Sam how much slack to keep. A range is exactly what the decision needs.

=== step === concept
::eyebrow How you aim at a quantile
## The check loss: penalise under and over differently

To get quantiles from a model we need a way to TELL a model "aim at the 90th percentile, not the average." That job is done by the **quantile loss**, also called the **check** or **pinball** loss.

The idea is simple: penalise guessing too low and guessing too high by DIFFERENT amounts. Here it is in R, written out plainly:

```r
check_loss <- function(error, tau) {
  ifelse(error > 0, tau * error, (tau - 1) * error)
}
```

Here `error` is the actual value minus our guess, and `tau` is the quantile level we are aiming at. Let us watch it on concrete numbers with `tau = 0.9`, which cares about the 90th percentile:

```r
check_loss(15,  0.9)   # we guessed 15 UNDER the actual
#> [1] 13.5
check_loss(-15, 0.9)   # we guessed 15 OVER the actual
#> [1] 1.5
```

Being 15 under costs 13.5, but being 15 over costs only 1.5, nine times cheaper. To dodge that steep under-guess penalty, the best guess is pushed UP, toward a high value the actual rarely exceeds: a high quantile. At `tau = 0.5` the two penalties are equal, so nothing is pushed either way and you land on the middle:

```r
check_loss(15,  0.5)   #> [1] 7.5
check_loss(-15, 0.5)   #> [1] 7.5
```

In symbols, with residual \(e = y - \hat q\) (the actual \(y\) minus the guess \(\hat q\)):

\[ L_\tau(e) = \begin{cases} \tau\, e & \text{if } e \ge 0 \\ (\tau - 1)\, e & \text{if } e < 0 \end{cases} \]

Both branches come out positive: guess too low (\(e > 0\)) and you pay \(\tau\, e\); guess too high (\(e < 0\)) and you pay \((\tau - 1)\, e\), which is positive because both factors are negative.

Now the payoff. Search for the single guess that makes the AVERAGE check loss over `past` smallest, and it lands exactly on the quantile:

```r
mean_pinball <- function(guess, tau) mean(check_loss(past - guess, tau))
guesses <- 150:270

guesses[which.min(sapply(guesses, mean_pinball, tau = 0.5))]   #> [1] 206
guesses[which.min(sapply(guesses, mean_pinball, tau = 0.9))]   #> [1] 252
quantile(past, c(0.5, 0.9))
#>  50%  90%
#>  206  252
```

The best guess at `tau = 0.5` is 206 (the median); at `tau = 0.9` it is 252 (the 90th percentile). Minimising the check loss IS a way of computing a quantile. That is the definition we will lean on next.

::widget chart-plotter {"data":[{"x":-30,"y":3},{"x":-20,"y":2},{"x":-10,"y":1},{"x":0,"y":0},{"x":10,"y":9},{"x":20,"y":18},{"x":30,"y":27}],"geoms":["line"],"x":"error","y":"penalty","code":{"line":"ggplot(loss, aes(error, penalty)) +\n  geom_line()"}}

=== step === tryit
::eyebrow Your turn
## Turn "90% interval" into two quantiles

A 90% prediction interval leaves 5% of outcomes below it and 5% above it. So its two ends are the 0.05 and the 0.95 quantiles of Sam's past days. Fill in the two levels below to read the 90% interval off `past`.

```r
quantile(past, c(____, ____))
```
::check {"regex":"quantile.*past.*0\\.05.*0\\.95","gate":true,"difficulty":"intermediate","ok":"That is the 90% interval: 162 to 258. A 90% interval always splits the leftover 10% evenly, 5% into each tail.","no":"A 90% interval leaves 5% in each tail, so the ends are the 0.05 and 0.95 quantiles. (0.10 and 0.90 would give an 80% interval.)"}
::solution
```r
quantile(past, c(0.05, 0.95))
#>  5% 95%
#> 162 258
```

=== step === concept
::eyebrow The idea
## A forest already stores every outcome you need

Here is the quiet fact that makes this easy. A regression forest is built from trees, and every tree sorts a new day down into a **leaf**, a small group of training days that ended up together. The ordinary forest prediction is just the AVERAGE of the outcomes in those leaves.

But averaging throws information away. Before it computes that average, each leaf is holding a whole BAG of training outcomes, the actual rentals of every day that landed there. That bag already describes the spread of what happens on days like tomorrow. So:

- **Average** the outcomes in the matching leaves, and you get the usual point prediction.
- **Take a quantile** of those same outcomes instead, and you get a quantile prediction.

That is the entire trick behind a **quantile regression forest** (Meinshausen, 2006): grow one perfectly ordinary forest, then read percentiles of the outcomes its leaves collected instead of collapsing them to a mean. One fit gives you every quantile, and therefore any prediction interval you like. The recipe is three steps:

::widget process-flow {"steps":[{"title":"Drop the day down every tree","sub":"tomorrow lands in one leaf per tree in the forest"},{"title":"Pool the neighbours","sub":"gather the training outcomes sharing those leaves"},{"title":"Read the quantiles","sub":"percentiles of that pool are the interval"}]}

=== step === concept
::eyebrow Build it in R
## A prediction interval from an ordinary forest

Let us build it on a full season of Sam's data. The key twist we bake in on purpose: the SPREAD of rentals grows with temperature, so warm days are genuinely harder to call than cold ones. We grow a plain `randomForest`, nothing special about it.

```r
library(randomForest)
set.seed(1)
n <- 600
temp    <- round(runif(n, 5, 35), 1)                          # daily high, Celsius
rentals <- round(rnorm(n, mean = 40 + 6 * temp, sd = 8 + 1.6 * temp))
bikes   <- data.frame(temp, rentals)

train <- bikes[1:450, ]     # days to learn from
test  <- bikes[451:600, ]   # held out, to check our intervals later

rf <- randomForest(rentals ~ temp, data = train, ntree = 150, nodesize = 25)
predict(rf, data.frame(temp = 30))     # the usual single-number forecast
#>        1
#> 224.8302
```

That 224.8 is the average the forest reports for a 30C day. Now we do NOT collapse the leaves. We ask which leaf a 30C day falls into on each tree with `nodes = TRUE`, then pool every training day that shares one of those leaves, and read its quantiles.

```r
# which leaf each TRAINING day falls into, in every tree  (450 x 150)
leaf_train <- attr(predict(rf, train, nodes = TRUE), "nodes")

new_day  <- data.frame(temp = 30)
leaf_new <- attr(predict(rf, new_day, nodes = TRUE), "nodes")   # 1 x 150

# pool every training rental that shared the new day's leaf, tree by tree
pool <- c()
for (t in 1:ncol(leaf_train)) {
  shares_leaf <- leaf_train[, t] == leaf_new[1, t]
  pool <- c(pool, train$rentals[shares_leaf])
}
length(pool)
#> [1] 2497
quantile(pool, c(0.05, 0.50, 0.95))
#>  5% 50% 95%
#> 130 208 279
```

There it is: for a 30C day, a median of 208 and a 90% prediction interval of **130 to 279**, all from one ordinary forest. The point prediction (224.8) is the forest's average and sits inside the interval; the median (208) is just a different summary of the same leaves, so the two do not have to line up. Either way, Sam now has the range, not just one number.

[NOTE]
This ties back to the whole course. A forest gets quantiles by STORING outcomes and reading them back. A booster gets them a different way: train it to minimise the exact check loss from earlier (LightGBM calls this `objective = "quantile"`), fit once per quantile, and it predicts that quantile directly. Two roads, same destination: a prediction interval.

=== step === concept
::eyebrow Does it hold up
## Check that the interval actually covers

A 90% interval is only honest if, on fresh data, the truth really does land inside it about 90% of the time. That is called **coverage**, and it is the one check that separates a real interval from a decorative one. Let us measure it on the held-out days we set aside, building each day's interval exactly as before.

```r
check_days <- test[1:40, ]
leaf_check <- attr(predict(rf, check_days, nodes = TRUE), "nodes")

inside <- logical(nrow(check_days))
for (i in 1:nrow(check_days)) {
  pool_i <- c()
  for (t in 1:ncol(leaf_train)) {
    pool_i <- c(pool_i, train$rentals[leaf_train[, t] == leaf_check[i, t]])
  }
  band <- quantile(pool_i, c(0.05, 0.95))
  inside[i] <- check_days$rentals[i] >= band[1] && check_days$rentals[i] <= band[2]
}
mean(inside)
#> [1] 0.925
```

92.5% of held-out days fell inside their own 90% interval, right where a 90% interval should land. The forest is not just guessing a range; the range is calibrated.

And because the spread was built to grow with temperature, the interval WIDTH adapts on its own. Compare a cold day to the warm one:

```r
leaf_cold <- attr(predict(rf, data.frame(temp = 8), nodes = TRUE), "nodes")
pool_cold <- c()
for (t in 1:ncol(leaf_train)) {
  pool_cold <- c(pool_cold, train$rentals[leaf_train[, t] == leaf_cold[1, t]])
}
quantile(pool_cold, c(0.05, 0.50, 0.95))
#>  5% 50% 95%
#>  53  88 118
```

A cold 8C day: interval 53 to 118, only 65 bikes wide. The warm day spanned 149. The forest is honestly less certain when demand is more variable, and says so.

In a real project you would not hand-roll the pooling loop. Two packages do exactly this, and you run them outside the browser:

```r-static
# The production shortcuts (run these locally, not in this lesson):
library(quantregForest)                       # Meinshausen's own implementation
qrf <- quantregForest(x = train["temp"], y = train$rentals)
predict(qrf, data.frame(temp = 30), what = c(0.05, 0.5, 0.95))

library(ranger)                               # a fast forest for large data
rf2 <- ranger(rentals ~ temp, data = train, quantreg = TRUE)
predict(rf2, data.frame(temp = 30), type = "quantiles",
        quantiles = c(0.05, 0.5, 0.95))$predictions
```

[WARNING]
A quantile forest can only report ranges it has seen. Ask about a 45C day when your training data stops at 35C and it has no neighbours to pool, so the interval is unreliable: no extrapolation past the training range. And each interval needs enough training days per leaf to estimate a tail, so do not set `nodesize` too small, or the leaves hold too few days to read a reliable range.

=== step === quiz
::eyebrow Check yourself
## What is a quantile forest, really?

An ordinary random forest predicts 224 bikes for tomorrow. You want a 90% prediction interval instead. How does a quantile regression forest produce it?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It uses the SAME forest, but reads the 5th and 95th percentiles of the training outcomes stored in the matching leaves, instead of averaging them ::ok Exactly. Same forest, no refit. The leaves already hold every neighbouring outcome; you just read their percentiles instead of collapsing them to a mean.
- It refits a brand-new forest separately for each quantile you want ::no No refit is needed. The single ordinary forest already stores the leaf outcomes, so every quantile comes from that one fit, which is what makes it cheap.
- It takes the point prediction and adds a fixed plus-or-minus band of constant width ::no A fixed band cannot widen on volatile days and shrink on calm ones. The whole point is that the interval is read from the actual spread of leaf outcomes, so its width adapts (149 wide on a warm day, 65 on a cold one).

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Meinshausen (2006), Quantile Regression Forests, JMLR 7](https://www.jmlr.org/papers/v7/meinshausen06a.html) - the paper that introduced reading quantiles from a forest's stored leaf outcomes.
- [Koenker and Bassett (1978), Regression Quantiles, Econometrica 46(1)](https://doi.org/10.2307/1913643) - the origin of the check loss and quantile regression.
- [quantregForest on CRAN](https://cran.r-project.org/package=quantregForest) - Meinshausen's own R package, the production shortcut for what you built by hand.
- [ranger (Wright and Ziegler, 2017, JSS 77)](https://www.jstatsoft.org/article/view/v077i01) - a fast forest whose `quantreg = TRUE` gives these intervals on large data.

=== step === complete
## Lesson 6 complete

You turned a point prediction into a prediction interval you can actually plan around. A quantile is a cut point in the outcomes; the check loss is how you aim at one; and a forest, without any refitting, already stores every outcome you need, so reading percentiles of its leaves gives you a calibrated range that widens exactly where the world is less predictable.

That is the capstone of this course: from a single number, to a number with an honest range around it. Next up is the section **Quiz**, a short graded check across everything in Gradient Boosting, from how boosting corrects its own errors to the intervals you just built.
