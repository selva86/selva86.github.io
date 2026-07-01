---
title: "Model Evaluation Lesson 5: Scoring Rules and Regression Metrics"
catalog_blurb: "How to pick the error score that matches the decision you care about."
description: "RMSE, MAE and MAPE reward different behaviour, and only a proper scoring rule like log-loss rewards honest probabilities. Learn to pick the score that matches your decision, in R."
keywords: "regression metrics, RMSE, MAE, MAPE, proper scoring rule, log-loss, Brier score, model evaluation, forecast accuracy, R"
post_type: "LESSON"
curriculum_id: "6.70.5"
webr: true
mathjax: true
lesson_access: "free"
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

In Lesson 4 you hunted for the hyperparameters with the lowest RMSE. You never stopped to ask the more basic question: is RMSE even the right thing to be minimising? It turns out that "how wrong was the model" has many answers, and they can flatly disagree about which model is best.

Here is the week you will judge. A neighborhood bakery sold a different number of cakes each day, and two of its forecasters, steady Priya and bold Sam, each tried to predict that number the night before. Whose forecast was better? You cannot answer until you decide what "better" means.

By the end of this lesson you will be able to:

- Compute MAE, RMSE and MAPE, and say exactly what behaviour each one rewards
- See why two honest metrics can crown two different models, and pick the right one from the decision
- Score a probability forecast, and know why only a *proper* scoring rule rewards telling the truth

**Prerequisites:** you can run R and work with vectors, and from [Lesson 4](Hyperparameter-Tuning-Strategies.html) you know we were tuning to the lowest RMSE.

::widget chart-plotter {"data":[{"x":1,"y":50},{"x":2,"y":60},{"x":3,"y":55},{"x":4,"y":70},{"x":5,"y":65},{"x":6,"y":90},{"x":7,"y":120}],"geoms":["line","point","bar"],"x":"day","y":"sales"}

=== step === concept
::eyebrow The idea
## A metric squeezes a week of misses into one number

Start with a single day. On Monday the bakery sold 50 cakes; the bold forecaster, Sam, had predicted 47. The gap between them is the **residual**, the miss for that one prediction:

\[ e_i = y_i - \hat{y}_i \]

Here \(y_i\) is the actual value on day \(i\) (50 cakes), \(\hat{y}_i\) (read "y-hat") is the prediction (47), so the residual is \(e_i = 3\). A positive residual means the model under-predicted; a negative one means it over-predicted. A model does not make one prediction, though; it makes a whole column of them. A **metric** is simply a rule for boiling that whole column of residuals down to a single number you can compare.

Let us build the week and both forecasters right here. Each lesson runs in a fresh R session, so we create everything inline (run this once):

```r
# One week at Priya's bakery: cakes actually sold (Mon to Sun),
# and two forecasters who guessed that number the night before.
day    <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
actual <- c(50, 60, 55, 70, 65, 90, 120)   # cakes actually sold
priya  <- c(60, 50, 65, 60, 75, 80, 110)   # the STEADY forecaster: a bit off every day
sam    <- c(47, 63, 52, 73, 62, 87, 80)    # the BOLD forecaster: nails most days, misses Sunday badly
data.frame(day, actual, priya, sam)
#>   day actual priya sam
#> 1 Mon     50    60  47
#> 2 Tue     60    50  63
#> 3 Wed     55    65  52
#> 4 Thu     70    60  73
#> 5 Fri     65    75  62
#> 6 Sat     90    80  87
#> 7 Sun    120   110  80
```

The most natural metric is the **mean absolute error (MAE)**: take the size of each miss (ignore whether it was over or under), and average them.

\[ \mathrm{MAE} = \frac{1}{n}\sum_{i=1}^{n} \lvert\, y_i - \hat{y}_i \,\rvert \]

\(n\) is the number of predictions (7 days), and the vertical bars mean absolute value, so a miss of \(-10\) and a miss of \(+10\) both count as 10. MAE answers a plain-English question: "on a typical day, how many cakes was the forecast off by?"

```r
# residual for each day, then MAE = the average miss size
actual - sam
#> [1]   3  -3   3  -3   3   3  40
mae <- function(pred) mean(abs(actual - pred))
round(c(priya = mae(priya), sam = mae(sam)), 2)
#> priya   sam
#> 10.00  8.29
```

Read that off: Priya is off by 10 cakes on an average day, Sam by only 8.29. Look at Sam's residuals, though. Six near-perfect days, and then Sunday: predicted 80, sold 120, a **40-cake** miss that MAE quietly folds into the average as just "40 ones." Hold onto that Sunday. The next metric will not be so forgiving.

=== step === concept
::eyebrow The twist
## RMSE squares the misses, and the winner flips

MAE treats every cake of error the same: being off by 40 once is exactly as bad as being off by 10 four times. But for the bakery those are not the same at all. A 40-cake shortfall on a busy Sunday means a queue of customers turned away, while being a little off every day is a shrug. When big misses hurt more than small ones, you want a metric that says so.

The **root mean squared error (RMSE)** does exactly that. Square each residual first (so a big miss counts for much more than a small one), average the squares, then take the square root to get back to cakes:

\[ \mathrm{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\bigl(y_i - \hat{y}_i\bigr)^2} \]

Squaring is the whole trick. A miss of 40 contributes \(40^2 = 1600\) to the sum, while a miss of 10 contributes only 100. One catastrophic day can dominate the entire score.

```r
# RMSE: square the misses (big ones count more), average, then square-root back to cakes
rmse <- function(pred) sqrt(mean((actual - pred)^2))
round(c(priya = rmse(priya), sam = rmse(sam)), 2)
#> priya   sam
#> 10.00 15.37
```

Now look at what just happened. By **MAE**, Sam won: 8.29 against Priya's 10. By **RMSE**, Priya wins: 10.00 against Sam's 15.37. The exact same two forecasters, the exact same week, and the two metrics name opposite winners. Nothing is wrong with either number. They simply reward different things: MAE rewards being close on average, RMSE rewards never being *badly* wrong. Sam's Sunday, squared, is what sinks him.

[KEY INSIGHT]
RMSE is always at least as large as MAE, and the gap between them grows with the spread of your errors. A big RMSE-minus-MAE gap is a warning light: your model is making a few large misses hiding behind many small ones.

=== step === quiz
::eyebrow Check yourself
## Which metric should the boss optimise?

The bakery bakes fresh each morning and cannot restock. A large **under**-forecast on a busy day means turning away paying customers, an expensive mistake; being a few cakes off on a quiet day barely matters. The bakery's owner wants the forecaster that avoids the costly disasters. Which metric should the owner optimise, and which forecaster does it pick?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- RMSE, and it picks Priya (10.00) over Sam (15.37): squaring makes the rare 40-cake miss dominate, which is exactly the disaster the boss is trying to avoid ::ok Right. When one big miss is what actually costs the business, you want the metric that punishes it hardest. RMSE squares the errors so Sam's Sunday blowup outweighs his six near-perfect days, and it crowns steady Priya.
- MAE, and it picks Sam: 8.29 is lower than 10, so Sam is simply the better forecaster ::no MAE says Sam is closer *on an average day*, which is true, but it counts a 40-cake catastrophe as just forty single-cake misses. If the disaster is what hurts, MAE is looking through the wrong lens.
- It makes no difference: both metrics rank the two forecasters the same way ::no They rank them in *opposite* order here (MAE prefers Sam, RMSE prefers Priya). That disagreement is the entire point: the metric you choose decides who wins.

=== step === concept
::eyebrow A different question
## MAPE: error as a percentage, and where it bites back

MAE and RMSE are both in cakes. That is fine for one bakery, but suppose head office wants to compare the cake forecast against the coffee forecast, where the daily numbers are in the thousands. A miss of 10 is huge for cakes and a rounding error for coffee. To compare across different scales you need error expressed as a **percentage** of what actually happened. That is the **mean absolute percentage error (MAPE)**:

\[ \mathrm{MAPE} = \frac{100\%}{n}\sum_{i=1}^{n} \left\lvert \frac{y_i - \hat{y}_i}{y_i} \right\rvert \]

Each miss is divided by that day's actual sales \(y_i\), so a 10-cake miss on a 50-cake day (20%) counts as worse than a 10-cake miss on a 120-cake day (8%).

```r
# MAPE: express each miss as a % of that day's actual, then average
mape <- function(pred) mean(abs(actual - pred) / actual) * 100
round(c(priya = mape(priya), sam = mape(sam)), 2)
#> priya   sam
#> 14.85  8.86
```

MAPE is scale-free and easy to explain to a non-technical boss ("we are about 15% off"), which is why it is popular in forecasting. But it has two sharp edges you must respect.

[WARNING]
MAPE divides by the actual value, so a single day with zero (or near-zero) sales makes it explode to infinity. It is also **asymmetric**: an over-forecast can be penalised without limit, while an under-forecast maxes out at 100%, so MAPE quietly favours models that predict low. Never use it when actuals can be zero.

```r
# The trap in one line: a day with 0 sales makes the percentage undefined
abs(0 - 8) / 0 * 100   # actual = 0, predicted 8
#> [1] Inf
```

=== step === concept
::eyebrow From a number to a chance
## Scoring a probability: Brier, then log-loss

So far the bakery predicted a *number*. But many models predict a *probability*. Suppose instead of "how many cakes" the question is "will we sell out of croissants today?" The forecaster now reports a probability \(p\) between 0 and 1, and reality answers with a plain yes or no, which we write as \(y = 1\) (sold out) or \(y = 0\) (did not). How do you score a probability against a yes/no outcome?

The gentle first answer reuses the squared-error idea you already have. The **Brier score** is just the mean squared error, but the "prediction" is the probability and the "actual" is 0 or 1:

\[ \mathrm{Brier} = \frac{1}{n}\sum_{i=1}^{n}\bigl(p_i - y_i\bigr)^2 \]

If you say 0.9 and it sells out (\(y=1\)), your squared miss is \((0.9-1)^2 = 0.01\), tiny. Say 0.9 and it does *not* sell out (\(y=0\)) and you eat \((0.9-0)^2 = 0.81\). Let us score our two forecasters again, now on a week of sell-out outcomes.

```r
# The bakery now forecasts P(sell out of croissants). soldout = what actually happened.
soldout <- c(1, 0, 0, 1, 0, 1, 1)                       # 1 = sold out, 0 = did not
p_priya <- c(0.70, 0.40, 0.30, 0.80, 0.35, 0.75, 0.90)  # honest, hedged probabilities
p_sam   <- c(0.99, 0.02, 0.02, 0.98, 0.02, 0.98, 0.02)  # bold, near-certain every day

brier <- function(p) mean((p - soldout)^2)              # squared error, applied to probabilities
round(c(priya = brier(p_priya), sam = brier(p_sam)), 4)
#>  priya    sam
#> 0.0821 0.1375
```

Squared error already punishes Sam's overconfidence, but the metric built *for* probabilities punishes it far harder. **Log-loss** (also called cross-entropy) scores each day by the negative logarithm of the probability you assigned to the outcome that actually happened:

\[ \mathrm{LogLoss} = -\frac{1}{n}\sum_{i=1}^{n}\Bigl[\, y_i \ln p_i + (1 - y_i)\ln(1 - p_i) \,\Bigr] \]

Only one of the two terms is ever active per day: on a sell-out day (\(y=1\)) the penalty is \(-\ln p_i\); on a quiet day (\(y=0\)) it is \(-\ln(1 - p_i)\). Either way, the closer the probability you gave the true outcome is to zero, the more brutal the penalty. The curve below is that penalty: read the horizontal axis as "the probability you assigned to what actually happened." Near 1 the penalty is almost nothing; as it falls toward 0 the penalty rockets toward infinity.

::widget chart-plotter {"data":[{"x":0.05,"y":3},{"x":0.1,"y":2.3},{"x":0.2,"y":1.61},{"x":0.3,"y":1.2},{"x":0.4,"y":0.92},{"x":0.5,"y":0.69},{"x":0.6,"y":0.51},{"x":0.7,"y":0.36},{"x":0.8,"y":0.22},{"x":0.9,"y":0.11},{"x":0.99,"y":0.01}],"geoms":["line","point"],"x":"p","y":"penalty"}

```r
# Log-loss: the -log penalty for the probability you gave the true outcome
logloss <- function(p) -mean(soldout * log(p) + (1 - soldout) * log(1 - p))
round(c(priya = logloss(p_priya), sam = logloss(p_sam)), 4)
#>  priya    sam
#> 0.3244 0.5747
```

Priya wins again, but look *where* Sam's loss comes from. Six days he was almost perfect. Then Sunday: he reported 0.02 (near-certain it would not sell out) and it sold out. That single confident-wrong day costs him:

```r
-log(0.02)   # Sam's Sunday penalty, almost his entire log-loss
#> [1] 3.912023
```

That one number, 3.91, is nearly all of Sam's total. Confident and wrong is the single most expensive thing a probability forecaster can be.

=== step === quiz
::eyebrow Check yourself
## Can Sam game the score by sounding decisive?

On a typical day Sam is genuinely about 60% sure it will sell out. He thinks reporting **0.99** instead of 0.60 will make him look sharper. Over many such days, what does inflating his confidence do to his log-loss?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It hurts him on average: the days it does not sell out now cost about \(-\ln(0.01)\) each, a penalty so large it outweighs the small gain on the days it does. Reporting his true 0.60 scores better ::ok Exactly. Because the penalty for a confident miss explodes, the *average* penalty is lowest when he reports what he actually believes. Log-loss cannot be gamed by sounding more certain than you are.
- It helps him: a more confident probability always lowers log-loss ::no Confidence only pays off when you turn out to be right. A confident miss is punished savagely, and over many days those rare disasters outweigh the small routine gains. There is no free lunch in stating more certainty than you have.
- It changes nothing, because log-loss only looks at whether the event happened ::no Log-loss reads the exact probability you reported, not just the yes/no outcome. Moving from 0.60 to 0.99 changes the penalty on every single day. That sensitivity to the number itself is the whole point of the next step.

=== step === concept
::eyebrow The deep idea
## What makes a scoring rule "proper"

That quiz was not a trick of these particular numbers. It is a mathematical property with a name. A **scoring rule** takes your reported probability \(p\) and the outcome \(y\) and returns a penalty. The rule is **proper** if your *expected* penalty is smallest exactly when you report your true believed probability, and **strictly proper** if that honest report is the *only* best one. In plain terms: a proper rule cannot be gamed. Your best move is always to tell the truth about your uncertainty.

Log-loss is strictly proper, and here is why. Suppose your honest belief is that the event happens with probability \(q\). If you report some \(p\) instead, your expected log-loss (\(\mathbb{E}\) means the average penalty over the two outcomes, weighting a sell-out by \(q\) and a no-sell-out by \(1-q\)) is

\[ \mathbb{E}[\mathrm{LogLoss}] = -\bigl[\, q \ln p + (1 - q)\ln(1 - p) \,\bigr] \]

Minimise that over \(p\) (set the derivative to zero) and the answer is \(p = q\): the penalty bottoms out precisely when your report equals your true belief. Brier is strictly proper too, by the same kind of argument. That is what earns them the name.

Now contrast two familiar numbers that are **not** proper scoring rules:

- **Accuracy** (did the most-likely class match?) ignores your probability entirely. You can improve it by rounding every forecast to a flat 0 or 1, throwing away all the honest hedging that a proper rule rewards.
- **AUC** grades only the *ranking* of your scores, not their values. You met the ROC curve when judging classifiers; drag its threshold below to recall how it sweeps every cutoff.

::widget roc-curve {}

The AUC summarises that whole curve in one number, but it sees only the *order* of your probabilities. Shrink every score toward 0.5 while keeping their order, and the ROC curve and its AUC do not move a millimetre, even though your probabilities are now badly wrong. AUC is a fine ranking metric, but it is blind to whether a 0.7 really means 70%. Only a proper score, log-loss or Brier, checks that.

[KEY INSIGHT]
There is no universally best metric, only the one that matches your decision. Reach for RMSE when a few big misses are what hurt, MAE when every cake counts the same, MAPE to compare across scales (never with zeros), and a proper score like log-loss or Brier whenever you will act on the probability itself and need it to be honest.

=== step === tryit
::eyebrow Your turn
## Complete the log-loss

Log-loss has two terms because the outcome can go two ways. The first term, `soldout * log(p_priya)`, penalises the days it *did* sell out. The second term has to penalise the days it did **not** sell out, using the probability of *not* selling out, which is `1 - p`. Fill in the blank so the second term is complete, then check it.

```r
ll <- -mean(soldout * log(p_priya) + (1 - soldout) * log(____))
round(ll, 4)
```
::check {"regex":"1\\s*-\\s*p_priya","gate":true,"difficulty":"beginner","ok":"That is it: log(1 - p_priya) scores the days it did not sell out, using the probability Priya gave to 'no sell-out'. The two terms together are Priya's log-loss, 0.3244.","no":"On a no-sell-out day the outcome's probability is 1 minus the sell-out probability: fill in 1 - p_priya."}
::solution
```r
ll <- -mean(soldout * log(p_priya) + (1 - soldout) * log(1 - p_priya))
round(ll, 4)
#> [1] 0.3244
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Gneiting & Raftery (2007), Strictly Proper Scoring Rules, Prediction, and Estimation, JASA](https://doi.org/10.1198/016214506000001437) - the definitive treatment of proper scoring rules, including log-loss and the Brier score.
- [Hyndman & Koehler (2006), Another look at measures of forecast accuracy, Int. J. Forecasting](https://doi.org/10.1016/j.ijforecast.2006.03.001) - why RMSE, MAE and MAPE differ, and the traps in percentage errors.
- [Forecasting: Principles and Practice, ch. 5.8: Evaluating point forecast accuracy (free)](https://otexts.com/fpp3/accuracy.html) - Hyndman and Athanasopoulos on choosing an accuracy measure, with worked R.
- [yardstick: regression and probability metrics (tidymodels)](https://yardstick.tidymodels.org/) - the reference for computing `rmse()`, `mae()`, `mape()`, `brier_class()` and `mn_log_loss()` in R.

=== step === complete
## Lesson 5 complete

You stopped minimising a metric blindly. You can compute MAE, RMSE and MAPE and say what each rewards; you saw two honest metrics crown opposite winners and learned to choose by the decision, not by habit; and you can score a probability forecast with Brier and log-loss, knowing that only a *proper* scoring rule rewards honest uncertainty while accuracy and AUC do not.

Next, Lesson 6: Comparing Models Statistically. You now have a fair yardstick, but a single week, or a single test split, is still just one draw. You will learn to tell a real metric difference between two models from the ordinary luck of the split, so you can say which model is better and mean it.
