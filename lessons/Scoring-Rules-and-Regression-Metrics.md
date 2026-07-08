---
title: "Model Evaluation Lesson 5: Scoring Rules and Regression Metrics"
catalog_blurb: "Choosing an error metric that rewards the prediction you actually want."
description: "RMSE, MAE, MAPE, log loss and Brier each reward a model for something different. Learn what each measures in R, and pick the metric that fits your decision."
keywords: "RMSE, MAE, MAPE, log loss, Brier score, proper scoring rule, regression metrics, model evaluation, forecast accuracy, R, yardstick, tidymodels"
post_type: "LESSON"
curriculum_id: "6.70.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "5"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: "Comparing-Models-Statistically.html"
course_prev: "Hyperparameter-Tuning-Strategies.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Scoring Rules and Regression Metrics

In Lesson 4 you tuned a model until its error was as low as it would go. But low error on which ruler? This lesson is about the rulers themselves, and a fact that catches most people off guard: change the metric and the "best" model can change with it.

Meet Priya, who runs a bakery and has to forecast next week's daily cake order. Two forecasters are up for the job: Priya's own steady rule, and her data-science-student nephew Sam's bolder model. On the very same week, one metric will crown Sam and another will crown Priya. By the end you will know exactly why, and which ruler to trust for which decision.

By the end you will be able to:

- Compute RMSE, MAE and MAPE in R and say what behaviour each one rewards
- Score a probability forecast with log loss and Brier, and see why a confident wrong call is ruinous
- Define a proper scoring rule and pick the metric that matches your decision

**Prerequisites:** you can run R and index a data frame, and you have tuned a model to a low error in [Lesson 4](Hyperparameter-Tuning-Strategies.html). A cross-validation fold from [Lesson 1](Cross-Validation-Strategies.html) helps, but is re-explained where it is needed.

::widget chart-plotter {"data":[{"x":"Mon","y":60},{"x":"Tue","y":55},{"x":"Wed","y":62},{"x":"Thu","y":58},{"x":"Fri","y":64},{"x":"Sat","y":120},{"x":"Sun","y":66}],"geoms":["bar"],"x":"day","y":"cakes_sold"}

=== step === concept
::eyebrow The job of a metric
## One number for a whole week of misses

A metric takes a whole column of forecasting misses and squeezes it into a single number you can compare. Before we can argue about which number is best, we need the raw material: what each forecaster predicted, and what actually happened.

Each lesson runs in a fresh R session, so let us build Priya's week right here, along with both forecasts. Sam's model matched the six ordinary days almost perfectly, then whiffed badly on Sunday. Priya was a few cakes off every single day.

```r
week <- data.frame(
  day     = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"),
  actual  = c(60, 55, 62, 58, 64, 120, 66),   # cakes actually sold
  priya   = c(65, 50, 67, 53, 69, 115, 72),   # Priya's steady forecast
  sam     = c(60, 55, 60, 58, 64, 120, 36)    # Sam's bold forecast
)
week$err_priya <- week$actual - week$priya     # a forecast miss, in cakes
week$err_sam   <- week$actual - week$sam
week
#>   day actual priya sam err_priya err_sam
#> 1 Mon     60    65  60        -5       0
#> 2 Tue     55    50  55         5       0
#> 3 Wed     62    67  60        -5       2
#> 4 Thu     58    53  58         5       0
#> 5 Fri     64    69  64        -5       0
#> 6 Sat    120   115 120         5       0
#> 7 Sun     66    72  36        -6      30
```

The **error** on day \(i\) is just actual minus forecast, \(e_i = y_i - \hat{y}_i\), where \(y_i\) is what Priya really sold and \(\hat{y}_i\) is what the forecaster predicted. Sam's errors are almost all zero, except a whopping 30 on Sunday. Priya's are a steady 5 or 6 every day. Every metric ahead is just a different way of boiling those seven errors down to one score.

=== step === concept
::eyebrow The forgiving ruler
## MAE: every cake counts once

The simplest honest metric is the **mean absolute error**: take the size of each miss (drop the plus or minus sign), and average them. One cake of error is one cake of error, wherever it lands.

\[ \mathrm{MAE} = \frac{1}{n}\sum_{i=1}^{n}\lvert y_i - \hat{y}_i\rvert \]

Here \(n = 7\) days, and \(\lvert \cdot \rvert\) means absolute value, so a miss of \(-6\) and a miss of \(+6\) both count as 6. Let us score both forecasters.

```r
mae <- function(actual, forecast) mean(abs(actual - forecast))
round(c(priya = mae(week$actual, week$priya),
        sam   = mae(week$actual, week$sam)), 2)
#> priya   sam
#>  5.14  4.57
```

Sam wins. His total error is smaller because six near-perfect days pull the average down, even with that ugly Sunday. On MAE, the forecaster to hire is Sam. Hold that thought.

=== step === concept
::eyebrow The punishing ruler
## RMSE: big misses hurt more

The **root mean squared error** changes one thing: it squares each miss before averaging, then takes a square root at the end to get back to cakes.

\[ \mathrm{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2} \]

That squaring is the whole story. A miss of 5 contributes 25, but a miss of 30 contributes 900, thirty-six times more. RMSE cares enormously about the worst miss and barely notices the small ones.

```r
rmse <- function(actual, forecast) sqrt(mean((actual - forecast)^2))
round(c(priya = rmse(week$actual, week$priya),
        sam   = rmse(week$actual, week$sam)), 2)
#> priya   sam
#>  5.15 11.36
```

[KEY INSIGHT]
The winner flipped. Sam won MAE (4.57 vs 5.14) but Priya wins RMSE (5.15 vs 11.36), on the very same week and the very same forecasts. Nothing changed except the ruler. This is the single most important idea in the lesson: the metric you choose decides who wins.

=== step === widget
::eyebrow Why it flipped
## The one tower that sinks Sam

RMSE squares every miss before averaging, so it is worth looking at those squared errors directly. Six of Sam's are zero or tiny; his Sunday miss of 30 becomes 900 and towers over everything.

```r
week$err_sam^2      # Sam's squared errors
#> [1]   0   0   4   0   0   0 900
week$err_priya^2    # Priya's squared errors
#> [1] 25 25 25 25 25 25 36
```

Priya's squared errors are a flat row of 25s; Sam's are a single skyscraper. When you average and root, that skyscraper dominates Sam's RMSE while Priya's evenly-spread misses stay small. The bars below are Sam's squared errors, one per day. That lone Sunday tower is exactly what RMSE punishes and MAE shrugs off.

::widget chart-plotter {"data":[{"x":"Mon","y":0},{"x":"Tue","y":0},{"x":"Wed","y":4},{"x":"Thu","y":0},{"x":"Fri","y":0},{"x":"Sat","y":0},{"x":"Sun","y":900}],"geoms":["bar"],"x":"day","y":"squared_error"}

=== step === concept
::eyebrow What each ruler rewards
## RMSE chases the mean, MAE the median

The flip is not a quirk of this week; it comes from a deep fact. If you had to commit to a single number for every day, RMSE is smallest when you guess the **mean** of the data, and MAE is smallest when you guess the **median**. Watch it on a right-skewed month, mostly ordinary days with a few festival spikes.

```r
set.seed(1)
month <- c(round(rnorm(26, 55, 8)), 150, 165, 180, 140)  # 26 normal days + 4 spikes
c(mean = mean(month), median = median(month))
#>   mean median
#>   70.0   59.5

score <- function(guess) c(RMSE = rmse(month, guess), MAE = mae(month, guess))
rbind(guess_the_mean   = score(mean(month)),
      guess_the_median = score(median(month)))
#>                   RMSE   MAE
#> guess_the_mean   35.91 23.67
#> guess_the_median 37.42 18.20
```

Read the diagonal: guessing the mean gives the lower RMSE (35.91), guessing the median gives the lower MAE (18.20). So the choice of metric is really a choice of target. RMSE pulls your model toward the average day and punishes big misses; MAE pulls it toward the typical day and treats every miss alike. On skewed data, where the mean and median part ways, they genuinely disagree about what "best" means.

=== step === quiz
::eyebrow Check yourself
## Which ruler for which fear?

Priya's supplier charges a steep penalty if she is ever badly short on a big day: one giant miss is far worse for her than a scatter of small ones. Which metric should she optimize, and what does that do to the Priya-versus-Sam verdict?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- MAE, because it is the plain average error and Sam's MAE is the lower of the two ::no MAE adds every cake of error with equal weight, so Sam's one 30-cake disaster is diluted by his six good days. If a single giant miss is the thing she fears most, MAE is exactly the wrong ruler: it barely reacts to the miss she cares about.
- RMSE, because squaring makes one large miss dominate, and it picks Priya ::ok Exactly. RMSE squares each error, so Sam's 30-cake Sunday (900) swamps the average and RMSE crowns Priya, the forecaster who is never badly wrong. Match the ruler to the cost: if big misses are expensive, use RMSE.
- Either one, since both rank the two forecasters the same way ::no They rank them oppositely here: Sam wins MAE (4.57 vs 5.14) but Priya wins RMSE (5.15 vs 11.36). Which metric you pick is the entire decision, not a detail.

=== step === tryit
::eyebrow Your turn
## Build RMSE from the errors

RMSE is just three steps: square each miss, average, then square-root. Here are Priya's seven daily misses. Fill in the blank so RMSE squares the errors before averaging, then check that it reproduces her 5.15.

```r
errors <- c(-5, 5, -5, 5, -5, 5, -6)   # Priya's daily misses (actual - forecast), in cakes
rmse <- sqrt(mean(____))               # square each miss, average, then square-root
round(rmse, 2)
```
::check {"regex":"errors\\s*\\^\\s*2|errors\\s*\\*\\s*errors","gate":true,"difficulty":"beginner","ok":"That is Priya's RMSE, 5.15, the same value the function gave earlier. Square, average, root.","no":"You need the squared errors before averaging: errors^2 (or errors * errors). RMSE squares first, which is why big misses count for more."}
::solution
```r
errors <- c(-5, 5, -5, 5, -5, 5, -6)
rmse <- sqrt(mean(errors^2))   # square each miss, average, then square-root
round(rmse, 2)
#> [1] 5.15
```

=== step === concept
::eyebrow The percentage ruler
## MAPE: error as a share of sales

RMSE and MAE both report in cakes. Sometimes you want the error as a percentage instead, so you can compare a bakery's forecast against a coffee shop's, or this month against last. The **mean absolute percentage error** divides each miss by that day's actual sales, then averages.

\[ \mathrm{MAPE} = \frac{100\%}{n}\sum_{i=1}^{n}\left\lvert \frac{y_i - \hat{y}_i}{y_i}\right\rvert \]

```r
mape <- function(actual, forecast) mean(abs((actual - forecast) / actual)) * 100
round(c(priya = mape(week$actual, week$priya),
        sam   = mape(week$actual, week$sam)), 2)
#> priya   sam
#>  7.88  6.95
```

Sam wins this one too: MAPE, like MAE, forgives his single big miss and rewards his six sharp days. The number is unit-free, "we are about 7% off on average," which is why dashboards and executives love it. But that convenience hides two nasty traps.

=== step === concept
::eyebrow The fine print
## Where MAPE lies to you

The trouble is the denominator. Because MAPE divides by the actual, the same miss in cakes gets a wildly different score depending on how busy the day was.

```r
# The SAME 10-cake miss, on two different days:
abs((120 - 110) / 120) * 100   # festival day: 10 cakes short of 120
#> [1] 8.333333
abs((20 - 10) / 20) * 100      # slow day: 10 cakes short of 20
#> [1] 50
```

Ten cakes off is ten cakes off, but MAPE calls the slow-day miss six times worse, purely because fewer cakes sat in the denominator. If the festival day is the one that drives your revenue, MAPE has its priorities backwards. And near zero it breaks outright:

```r
# A holiday: the bakery opens for one hour and sells 0. MAPE divides by it:
abs((0 - 5) / 0) * 100
#> [1] Inf
```

[WARNING]
MAPE is undefined when an actual is zero and explodes when an actual is near zero. It is also lopsided: an over-forecast can score well past 100% while an under-forecast is capped at 100%, so minimizing MAPE quietly biases your forecasts low. Use it only when every actual sits comfortably above zero and cross-scale comparability is what you actually need.

=== step === quiz
::eyebrow Check yourself
## When to distrust a low MAPE

A dashboard shows Priya's forecast at a healthy 7.9% MAPE and everyone relaxes. On which kind of day should she distrust that number the most?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The busy festival days, because large sales make MAPE explode ::no It is the reverse: large actuals shrink each percentage error (a 10-cake miss on 120 is only about 8%). MAPE is gentle on big days, not harsh on them.
- The very slow days, because a tiny denominator turns a small cake-miss into a huge percentage (and a zero-sales day is undefined) ::ok Right. MAPE divides by the actual, so a handful of cakes off on a near-empty day becomes an enormous percentage, and a zero-sales day is undefined outright. A comfortable overall MAPE can hide terrible slow-day behaviour.
- Never, MAPE is scale-free so it treats every day fairly ::no Scale-free is not the same as fair. Dividing by the actual weights slow days far more heavily than busy ones, so an identical cake-miss is punished differently depending on the day.

=== step === concept
::eyebrow A different kind of prediction
## From "how many" to "how likely"

Priya does not only order cakes. Each morning she also decides whether to bake an extra tray of croissants, and that hinges on one question: will today sell out? A good model answers not yes or no, but with a probability, "70% chance we sell out." Sam gives probabilities too, but where Priya hedges, Sam is almost always near-certain.

How do you grade a probability? The obvious move is **accuracy**: call it "yes" whenever the probability clears 0.5, then count how often you were right. But accuracy throws the probability away.

[KEY INSIGHT]
Accuracy only sees which side of 0.5 your number lands on. Whether Sam says 0.51 or 0.99, accuracy hears the same "yes." It cannot tell a careful forecaster from a reckless one, so it can never reward an honest probability. We need a metric that grades the number itself.

=== step === widget
::eyebrow What accuracy is built on
## Ranking is not the same as being right

Before we score the number, see what accuracy and its cousin AUC actually measure. Slide the threshold below and watch the confusion matrix, and the accuracy it implies, shift with every move. The ROC curve traces every threshold at once, and its AUC summarizes how well the scores **rank** sell-out days above the rest.

::widget roc-curve {}

Notice the question AUC never asks: whether a predicted 0.7 really sells out about 70% of the time. A model can rank every day perfectly (a great AUC) while its probabilities are all far too confident. Ranking and honest numbers are different things, and for Priya's croissant decision it is the honest number she needs.

=== step === concept
::eyebrow Scoring the number, gently
## The Brier score

The first honest score for a probability just reuses the squared-error idea from RMSE, now with the outcome written as 1 (sold out) or 0 (did not). The **Brier score** is the average squared gap between the probability you reported and what actually happened.

\[ \mathrm{Brier} = \frac{1}{n}\sum_{i=1}^{n}(p_i - y_i)^2 \]

Here \(p_i\) is the probability you reported on day \(i\) and \(y_i\) is 1 if it sold out and 0 if not. A confident correct call (\(p = 1\), it sold out) scores 0, the best possible; a confident wrong call (\(p = 1\), it did not) scores 1, the worst.

```r
soldout <- c(1, 0, 1, 0, 0, 1, 1)                       # 1 = sold out that day
p_priya <- c(0.80, 0.30, 0.75, 0.35, 0.25, 0.85, 0.55)  # Priya hedges
p_sam   <- c(0.95, 0.05, 0.95, 0.05, 0.05, 0.95, 0.03)  # Sam is near-certain

brier <- function(p, y) mean((p - y)^2)
round(c(priya = brier(p_priya, soldout),
        sam   = brier(p_sam, soldout)), 3)
#> priya   sam
#> 0.086 0.137
```

Priya wins. Sam nailed six days, but on Sunday he put 0.03 on a day that sold out, and that single call contributes \((0.03 - 1)^2 = 0.94\) all by itself, more than Priya's entire week combined.

=== step === concept
::eyebrow Scoring the number, without mercy
## Log loss and the price of false confidence

Brier is forgiving: the worst it ever charges is 1. **Log loss** is not. It scores a probability by the logarithm of the chance it gave to what actually happened, and the log of a tiny number is enormous.

\[ \mathrm{LogLoss} = -\frac{1}{n}\sum_{i=1}^{n}\big[\, y_i \ln p_i + (1 - y_i)\ln(1 - p_i) \,\big] \]

For a day that sold out (\(y_i = 1\)) only the \(\ln p_i\) term survives; for a day that did not (\(y_i = 0\)), only \(\ln(1 - p_i)\). Watch the penalty for a single wrong call climb as the confidence climbs.

```r
loss_one <- function(p, y) -(y * log(p) + (1 - y) * log(1 - p))
round(c(
  hedged_wrong    = loss_one(0.60, 0),   # said 60% sell-out, it did not
  confident_wrong = loss_one(0.99, 0),   # said 99% sell-out, it did not
  confident_right = loss_one(0.99, 1)    # said 99% sell-out, it did
), 2)
#>    hedged_wrong confident_wrong confident_right
#>            0.92            4.61            0.01
```

Being wrong at 60% costs 0.92; being wrong at 99% costs 4.61; being right at 99% costs almost nothing. Log loss rewards confidence only when it is earned. Now score the whole week.

```r
log_loss <- function(p, y) mean(-(y * log(p) + (1 - y) * log(1 - p)))
round(c(priya = log_loss(p_priya, soldout),
        sam   = log_loss(p_sam, soldout)), 3)
#> priya   sam
#> 0.335 0.545
```

[KEY INSIGHT]
Sam's one overconfident Sunday costs \(-\ln(0.03) = 3.51\) in log loss, more than Priya's seven honest days added together (2.35). A single near-certain mistake can outweigh a whole week of careful hedging. That is why log loss is the go-to score whenever a confidently-wrong probability is genuinely dangerous.

=== step === concept
::eyebrow The property that makes a score trustworthy
## What "proper" means

Brier and log loss share a deeper property, and it has a name: they are **proper**. A scoring rule is proper if your best possible score, on average, comes from reporting your true belief, and nothing else. You cannot improve your expected score by nudging the number up to sound bold or down to play safe. Honesty is the optimal strategy.

Make it precise. Suppose the true chance of selling out today is \(q\), and you report some probability \(p\). Over many such days, your expected log loss is

\[ \mathbb{E}[\ell(p)] = -\big[\, q \ln p + (1 - q)\ln(1 - p) \,\big] \]

The left side is just shorthand for that long-run average penalty: \(\mathbb{E}\) reads "the average of," and \(\ell(p)\) is the log-loss charge for reporting \(p\). A little calculus (or the experiment on the next step) shows this is smallest exactly when \(p = q\). Reporting your true belief minimizes the expected penalty; every other report scores worse. A rule with that guarantee cannot be gamed, and that is precisely what makes it safe to optimize.

=== step === widget
::eyebrow See it minimize
## The lowest score sits at the truth

Do not take the calculus on faith, watch it. Fix the true chance of selling out at \(q = 0.7\), then sweep the reported probability from timid to overbold and compute the expected log loss for each.

```r
q <- 0.7                              # the true chance of selling out
reported <- seq(0.3, 0.9, by = 0.1)   # what you could claim instead
expected_loss <- -(q * log(reported) + (1 - q) * log(1 - reported))
data.frame(reported, expected_loss = round(expected_loss, 3))
#>   reported expected_loss
#> 1      0.3         0.950
#> 2      0.4         0.795
#> 3      0.5         0.693
#> 4      0.6         0.632
#> 5      0.7         0.611
#> 6      0.8         0.639
#> 7      0.9         0.765
```

The minimum is at reported = 0.7, the truth. Underclaim at 0.5 or overclaim at 0.9 and your expected score gets worse in both directions. Plotted, the expected loss is a valley with its floor exactly at the honest probability.

::widget chart-plotter {"data":[{"x":0.3,"y":0.95},{"x":0.4,"y":0.795},{"x":0.5,"y":0.693},{"x":0.6,"y":0.632},{"x":0.7,"y":0.611},{"x":0.8,"y":0.639},{"x":0.9,"y":0.765}],"geoms":["line","point"],"x":"reported_probability","y":"expected_log_loss"}

=== step === concept
::eyebrow The rules that fail the test
## Why accuracy and AUC are not proper

Now see why accuracy fails this test. Accuracy only cares which side of 0.5 your number falls on, so it cannot tell your honest 0.70 from a boastful 0.99. Fix the truth at \(q = 0.7\) again and compute the expected accuracy of each possible report.

```r
q <- 0.7
reported <- seq(0.1, 0.9, by = 0.1)
call_yes <- reported >= 0.5                 # accuracy thresholds your number at 0.5
expected_acc <- ifelse(call_yes, q, 1 - q)  # right with prob q if you call yes, else 1 - q
data.frame(reported, expected_acc)
#>   reported expected_acc
#> 1      0.1          0.3
#> 2      0.2          0.3
#> 3      0.3          0.3
#> 4      0.4          0.3
#> 5      0.5          0.7
#> 6      0.6          0.7
#> 7      0.7          0.7
#> 8      0.8          0.7
#> 9      0.9          0.7
```

Every report from 0.5 to 0.9 earns the identical expected accuracy of 0.7. Accuracy is flat: it scores the honest 0.70 and the reckless 0.99 exactly the same, so it can never coax the true probability out of a model. AUC has the same blind spot from the other direction, it depends only on the rank order of the scores, so squashing every probability toward 0.5 leaves AUC untouched while turning the numbers into lies. Neither is a proper scoring rule. When the probability itself matters, score it with log loss or Brier.

=== step === quiz
::eyebrow Check yourself
## Sam tries to game it

Stung by his log loss, Sam decides to "fix" his model: from now on he will report exactly 0.5 every single day, sold-out or not, so he can never be caught confidently wrong. What happens to his expected score under a proper rule?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Smart move, always reporting 0.5 gives him the best possible log loss ::no A proper rule rewards honest, informative probabilities. Reporting 0.5 every day throws away everything Sam actually knows, and his expected log loss gets stuck at about 0.69 per day, worse than a forecaster who commits to what they truly believe.
- It backfires: with a proper rule, reporting his true belief each day is what minimizes his score, not a fixed dodge ::ok Exactly what "proper" guarantees: no fixed trick beats honest reporting. Always-0.5 avoids disasters but forfeits every easy day, so a calibrated forecaster still wins. Sam's real fix is not to hedge to 0.5, it is to stop claiming 0.95 when he is only 0.70 sure.
- No effect, only the actual outcomes move the score ::no The reported probabilities are half of the score: change them and log loss changes. That is the entire point of scoring the number rather than just the yes/no call.

=== step === widget
::eyebrow What honesty looks like
## Calibration: a 0.7 that means 0.7

A proper score quietly rewards one more thing, the property Priya had all along: **calibration**. A forecaster is calibrated when the days she calls "70% likely" really do sell out about 70% of the time. Drag the slider from under-confident to over-confident and watch the reliability curve bow away from the diagonal. That bow is exactly what log loss and Brier charge for.

::widget calibration-curve {}

[NOTE]
Calibration is not the whole story, a model can be calibrated but timid (always saying 0.5-ish). Proper scores reward being confident **and** right, which is why Priya's honest, committed hedging beats both Sam's bravado and a wishy-washy always-0.5.

=== step === tryit
::eyebrow Your turn
## Price a confident mistake

Fill in the missing term so log loss also charges for the days that did **not** sell out. Sam reported 0.95 (near-certain) on a day that did not sell out (\(y = 0\)), so this one should sting.

```r
p <- 0.95; y <- 0                            # near-certain sell-out; it did not happen
loss <- -(y * log(p) + (1 - y) * log(____))  # the "did-not-happen" side of the score
round(loss, 2)
```
::check {"regex":"1\\s*-\\s*p|1\\s*-\\s*0\\.95|0\\.05","gate":true,"difficulty":"intermediate","ok":"That is about 3.0, a heavy penalty. When the event does not happen, log loss charges the log of the probability you gave to 'no', so a near-certain wrong call is punished hard.","no":"When y = 0, the surviving term is log(1 - p): the log of the probability Sam gave to 'it will not sell out'. Fill in 1 - p."}
::solution
```r
p <- 0.95; y <- 0
loss <- -(y * log(p) + (1 - y) * log(1 - p))
round(loss, 2)
#> [1] 3
```

=== step === concept
::eyebrow Putting it to work
## Match the metric to the decision

There is no single best metric, only the one that matches the decision in front of you. Line them up by what each one rewards.

| You are predicting | You care most about | Reach for | What it rewards |
|---|---|---|---|
| A number (sales, demand) | never being badly wrong | RMSE | staying near the mean; punishes big misses hard |
| A number | the typical day, robust to spikes | MAE | staying near the median; every miss counts once |
| A number | percentage error, comparing scales | MAPE (actuals well above 0) | small relative error; beware near-zero and a low bias |
| A probability | the number, not just the call | Log loss / Brier | honest, calibrated probabilities; log loss punishes false confidence most |

In a real tidymodels project you do not hand-code these. The **yardstick** package computes them and lets you bundle several into one report:

```r-static
library(yardstick)

# regression metrics on a data frame of truth + estimate
reg_metrics <- metric_set(rmse, mae, mape)
reg_metrics(results, truth = actual, estimate = forecast)

# a proper score for a two-class probability
mn_log_loss(results, truth = sold_out, .pred_yes)   # mean log loss
```

These are the same formulas you just computed by hand; yardstick only saves the typing and slots them straight into the resampling you met in Lesson 1.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Gneiting and Raftery (2007), Strictly Proper Scoring Rules, Prediction, and Estimation, JASA](https://doi.org/10.1198/016214506000001437) - the definitive treatment of proper scoring rules and why honest reporting is optimal.
- [Hyndman and Koehler (2006), Another look at measures of forecast accuracy, Int. J. Forecasting](https://doi.org/10.1016/j.ijforecast.2006.03.001) - the paper that dissects MAPE's failures and proposes better error measures.
- [Hyndman and Athanasopoulos, Forecasting: Principles and Practice, ch. 5.8: Evaluating point forecast accuracy (free)](https://otexts.com/fpp3/accuracy.html) - a practical walkthrough of RMSE, MAE and MAPE on real series.
- [yardstick reference (tidymodels)](https://yardstick.tidymodels.org/) - every metric in this lesson, ready to compute and drop into a resampling workflow.
- [An Introduction to Statistical Learning, ch. 2.2: Assessing Model Accuracy (free PDF)](https://www.statlearning.com/) - where mean squared error and the idea of measuring "best" come from.

=== step === complete
## Lesson 5 complete

You can now score a forecast with a metric that matches the decision, not just the first one to hand. For point forecasts, RMSE punishes big misses (it chases the mean) while MAE treats every miss alike (it chases the median), so the two can crown different winners, you watched Sam take MAE and Priya take RMSE on the very same week. MAPE puts errors on a percentage footing but breaks near zero and quietly biases low. For probabilities, a proper scoring rule, log loss or Brier, grades the number itself and cannot be gamed by sounding bold, which is why Sam's one near-certain wrong Sunday cost him more than Priya's whole honest week.

Next, Lesson 6: Comparing Models Statistically. You can now measure two models fairly, but when one scores better, is that gap real or just the luck of which days happened to land in your test set? You will learn to tell a genuine improvement from noise.
