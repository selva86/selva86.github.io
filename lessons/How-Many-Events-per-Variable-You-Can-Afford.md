---
title: "Regression Modeling Strategies Lesson 6: How many events per variable you can afford"
catalog_blurb: "Why a model's probabilities can be wrong even when its coefficients look fine."
description: "A simulated study with a known true model shows bias, coverage and calibration breaking down differently as events per variable falls, and which warns earliest."
keywords: "events per variable, EPV, logistic regression, sample size, calibration slope, confidence interval coverage, Peduzzi rule, model calibration, overfitting, Wald interval, R"
post_type: "LESSON"
course_id: "res-model-strategy"
course_title: "Regression Modeling Strategies"
course_lesson: "6"
course_total: "7"
course_landing: "Regression-Modeling-Strategies-Course.html"
course_prev: "Measuring-How-Optimistic-Your-Model-Is.html"
course_next: "Presenting-a-Model-So-It-Survives-Review.html"
curriculum_id: "4.70.6"
lesson_access: "pro"
mathjax: false
webr: true
---

=== step === cover
## How many events per variable you can afford

Today let's understand how many patients a logistic regression model actually needs, by building a study where the correct answer is already known and watching a model get it wrong anyway.

A hospital wants to predict which patients get readmitted within 30 days of discharge, from 5 measurements taken at discharge, x1 through x5. We will simulate these patients ourselves and fix the true relationship between those 5 measurements and readmission before fitting a single model. That is the one advantage a simulation gives that a real dataset never can: we already know the right answer, so we can measure exactly how far a fitted model drifts from it.

We will build this same simulated study five times over, giving the model fewer and fewer patients to learn from each time, while the true relationship underneath stays exactly the same. The chart below plots what happened each time. Moving right to left, each point is this same model fitted with less and less data relative to its 5 predictors, and the height of each point is how much the model's predicted probabilities can still be trusted on a patient it has never seen: 1.0 means fully, and well below 1 means the model is overconfident.

::widget chart-plotter {"data": [{"x": 2, "y": 0.53}, {"x": 6, "y": 0.76}, {"x": 11, "y": 0.9}, {"x": 22, "y": 0.93}, {"x": 55, "y": 0.97}], "geoms": ["line", "point"], "x": "events_per_variable", "y": "calibration_slope"}

That line drops from 0.97 on the right down to 0.53 on the left, as the model saw fewer and fewer patients.

=== step === concept
## What events per variable actually counts

A study like the one you just saw actually has three separate quantities buried inside it, not one. The sample size, n, is how many patients are in the study. The number of events is how many of those patients had the outcome you actually care about, a readmission here, and it is never the same number as n, because not every patient gets readmitted.

Why does the event count matter more than n on its own? A model learns what distinguishes the readmitted patients from everyone else, so it is the readmitted patients, the rarer group, that actually carry that information. A study with 10,000 patients but only 20 readmissions has barely more to learn from than a much smaller study with those same 20 readmissions.

The third quantity is p, the number of predictor variables the model uses. Events per variable, or EPV, is the number of events divided by p. It measures how much evidence the model actually has relative to how many things it is trying to estimate, which is a very different question from how many patients it has.

Because readmission is a yes or no outcome, this lesson uses logistic regression rather than ordinary linear regression. A logistic regression does not predict the readmission probability directly. It predicts the log odds of readmission, log(prob / (1 - prob)), as a straight-line combination of the predictors, then converts that number back into a probability. Each coefficient, like the 0.8 you will see on x1 below, is how much that log odds number moves for a one-unit change in that predictor.

Here is the running example this whole lesson uses. A hospital records 5 measurements at discharge, x1 through x5. We rig the true relationship between them and readmission ourselves: x1 raises the log odds of readmission by 0.8, x2 lowers it by 0.6, x3 raises it by 0.5, x4 lowers it by 0.4, and x5 raises it by 0.3. An intercept of -1.6 keeps the overall readmission rate close to 20%.

Let's build one such dataset and see its EPV.

```r
# Build one simulated set of patients and see how many had the outcome
set.seed(1)
n <- 1250
x1 <- rnorm(n)
x2 <- rnorm(n)
x3 <- rnorm(n)
x4 <- rnorm(n)
x5 <- rnorm(n)
true_log_odds <- -1.6 + 0.8 * x1 - 0.6 * x2 + 0.5 * x3 - 0.4 * x4 + 0.3 * x5
y <- rbinom(n, 1, plogis(true_log_odds))

n_events <- sum(y)
epv <- n_events / 5
cat(sprintf("patients (n): %d\n", n))
cat(sprintf("events (readmissions): %d\n", n_events))
cat(sprintf("events per variable (EPV): %.1f\n", epv))
#> patients (n): 1250
#> events (readmissions): 272
#> events per variable (EPV): 54.4
```

With 1250 patients, only 272 of them were actually readmitted, and with 5 predictors that gives an EPV of 54.4. A long-standing rule of thumb, from Peduzzi and colleagues in 1996, says a logistic regression needs at least 10 events per variable to be trusted. Rather than take that on faith, let's refit this exact true model at several descending events-per-variable levels and watch what actually happens to it.

=== step === concept
## Running the same model at five events-per-variable ratios

One dataset is just one draw. To see a real pattern rather than one lucky or unlucky draw, let's refit this same true model 300 times over, at each of five sample sizes: 1250, 500, 250, 125 and 50 patients. Everything about the true relationship stays exactly as it was. Only the sample size changes.

At each of those 300 fits, we track three things about the fitted model.

1. How far the estimated coefficient for x1 lands from its true value of 0.8, as a percent bias.
2. Whether the usual 95% confidence interval for that coefficient, a Wald interval, actually contains 0.8. A Wald interval is the estimate plus or minus 1.96 standard errors, the standard formula behind most reported confidence intervals.
3. A fourth number called the calibration slope, which checks whether the model's predicted probabilities on new patients it never saw are as confident as they deserve to be. A slope of 1 means yes. A slope below 1 means the model is overconfident, so its probabilities sit closer to 0 or 1 than reality actually supports.

```r-static
# Refit the true model 300 times at each of 5 sample sizes and track bias,
# interval coverage and calibration
simulate_patients <- function(n) {
  x1 <- rnorm(n)
  x2 <- rnorm(n)
  x3 <- rnorm(n)
  x4 <- rnorm(n)
  x5 <- rnorm(n)
  log_odds <- -1.6 + 0.8 * x1 - 0.6 * x2 + 0.5 * x3 - 0.4 * x4 + 0.3 * x5
  y <- rbinom(n, 1, plogis(log_odds))
  data.frame(x1, x2, x3, x4, x5, y)
}

fit_and_check <- function(n) {
  train <- simulate_patients(n)
  fit <- suppressWarnings(glm(y ~ x1 + x2 + x3 + x4 + x5, data = train, family = binomial))
  x1_coef <- coef(fit)[["x1"]]
  x1_se <- summary(fit)$coefficients["x1", "Std. Error"]
  interval_covers_truth <- (x1_coef - 1.96 * x1_se <= 0.8) && (x1_coef + 1.96 * x1_se >= 0.8)

  test <- simulate_patients(5000)
  predicted_log_odds <- predict(fit, newdata = test, type = "link")
  calibration_fit <- suppressWarnings(glm(test$y ~ predicted_log_odds, family = binomial))
  calibration_slope <- coef(calibration_fit)[["predicted_log_odds"]]

  c(events = sum(train$y), bias_pct = 100 * (x1_coef - 0.8) / 0.8,
    covered = interval_covers_truth, calibration_slope = calibration_slope)
}

set.seed(1)
sample_sizes <- c(1250, 500, 250, 125, 50)
reps <- 300
epv_table <- data.frame()
for (n in sample_sizes) {
  runs <- t(replicate(reps, fit_and_check(n)))
  epv_table <- rbind(epv_table, data.frame(
    n = n,
    epv = round(mean(runs[, "events"]) / 5),
    bias_pct = round(median(runs[, "bias_pct"])),
    coverage_pct = round(100 * mean(runs[, "covered"])),
    calibration_slope = round(median(runs[, "calibration_slope"]), 2)
  ))
}
print(epv_table, row.names = FALSE)
#>     n epv bias_pct coverage_pct calibration_slope
#>  1250  55        1           95              0.97
#>   500  22        3           94              0.93
#>   250  11        1           95              0.90
#>   125   6       14           94              0.76
#>    50   2       12           97              0.53
```

Read that table one column at a time. The bias column stays small, 1% to 3%, all the way down to an EPV of 11, and only below that does it jump, to 14% at EPV 6 and 12% at EPV 2. At every one of these five levels the typical estimate for x1 came out above its true value of 0.8, never below it, so a small sample does not just add noise here, it pushes the estimate further out than the truth.

The coverage column barely moves at all. It stays between 94% and 97% at every level tested, including the worst one, never once giving a reason for concern.

The calibration column is the one that actually moves, and moves first. It starts at 0.97, drops to 0.93, and by an EPV of 11, the rule of thumb's own safe threshold, it has already fallen to 0.90. By EPV 2 it has fallen all the way to 0.53.

Bias and coverage both still look healthy at EPV 11. Calibration does not.

=== step === widget
## Why the usual confidence interval stops matching the truth

Why would coverage stay fine while calibration is already breaking down? The answer is in the shape of the curve a Wald interval assumes.

Fitting a model by maximum likelihood means scoring every possible value of a parameter by how well it explains the data you saw, then picking the best-scoring one. That scoring function is called the likelihood, and plotted against the parameter it traces out a curve with a single peak at the best-scoring value. A Wald interval assumes that curve is a smooth, symmetric parabola around its peak.

At a large sample size that assumption holds well. At a small sample size it does not: the real curve turns lopsided, wider on one side than the other, while the parabola the Wald formula assumes stays perfectly symmetric.

The widget below shows this directly, with a simpler example: flips of a coin, instead of patients. The number of flips plays the same role the number of events plays in this lesson's simulated study, both setting how much information the fit actually has.

::widget likelihood-curve {"model": "bern", "n": 20}

Slide the sample size down and watch the solid curve and the dashed parabola pull apart. When they disagree, the Wald interval does not shrink or mis-centre quietly. It widens, because the parabola it is built from has drifted away from the real curve.

That is why this lesson's simulated readmission study never saw its interval coverage collapse at a low events-per-variable ratio. A wider interval is more likely to contain the truth even while the point estimate inside it, x1's coefficient, keeps drifting further from 0.8.

=== step === quiz
## Quick check: can you trust interval coverage?

Across the five events-per-variable levels in this simulated study, the 95% Wald interval's coverage stayed between 94% and 97% at every level tested, right down to the worst one. What does that tell you about using interval coverage to catch a model fitted on too little data?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Coverage fell well below 80% once events per variable dropped under 10, so it did warn of trouble, just a little later than the other two diagnostics. ::no
- Coverage stayed close to 95% at every level tested, from 94% up to 97%, so it gave no warning at all, even at the lowest level where the calibration slope had already fallen to 0.53. ::ok Exactly right. The interval widens to compensate for the extra uncertainty at a low events-per-variable ratio instead of exposing it, so coverage keeps its nominal rate even while the model's predicted probabilities are already drifting off.
- Coverage cannot be computed for a logistic regression, so the comparison does not really mean anything. ::no
- Coverage dropped in step with the calibration slope, reaching 0.53 at the lowest events-per-variable level, just like the calibration slope did. ::no Coverage and calibration are two different numbers, computed two different ways. Coverage checks whether an interval contains the true coefficient. Calibration checks whether predicted probabilities match reality on new patients. In this simulated study coverage stayed between 94% and 97% at every level tested, while calibration fell steadily from 0.97 to 0.53. The two did not move together, so coverage alone would have told you nothing was wrong.

=== step === concept
## Calibration: why it degrades earliest

Here is exactly how that calibration slope gets computed. Fit the model once, on one set of patients. Then take a fresh set of patients the model has never seen, and get its predicted probabilities for them, converted to predicted log odds.

Regress the new patients' true outcomes on those predicted log odds. The slope of that regression is the calibration slope.

A slope of 1 means the predictions are exactly as confident as they deserve to be. A slope below 1 means the model is overconfident: on patients it called very likely or very unlikely to be readmitted, reality agrees less often than the model's own number says it should.

[KEY INSIGHT]
A coefficient's bias and an interval's coverage are both properties of one number, the coefficient itself. Calibration is a property of the model's actual predictions, checked against patients it never saw. That is a strictly harder thing to get right, which is exactly why it breaks down first.

Let's compute it by hand at an events-per-variable ratio of 11, fitting on 250 patients.

```r
# Fit the true model once at EPV 11, then check its calibration on a
# fresh set of patients it never saw
set.seed(2)
n <- 250
x1 <- rnorm(n)
x2 <- rnorm(n)
x3 <- rnorm(n)
x4 <- rnorm(n)
x5 <- rnorm(n)
log_odds <- -1.6 + 0.8 * x1 - 0.6 * x2 + 0.5 * x3 - 0.4 * x4 + 0.3 * x5
y <- rbinom(n, 1, plogis(log_odds))
train <- data.frame(x1, x2, x3, x4, x5, y)
fit <- glm(y ~ x1 + x2 + x3 + x4 + x5, data = train, family = binomial)

n_test <- 5000
x1 <- rnorm(n_test)
x2 <- rnorm(n_test)
x3 <- rnorm(n_test)
x4 <- rnorm(n_test)
x5 <- rnorm(n_test)
test_log_odds <- -1.6 + 0.8 * x1 - 0.6 * x2 + 0.5 * x3 - 0.4 * x4 + 0.3 * x5
y_test <- rbinom(n_test, 1, plogis(test_log_odds))
test <- data.frame(x1, x2, x3, x4, x5, y = y_test)

predicted_log_odds <- predict(fit, newdata = test, type = "link")
calibration_fit <- glm(test$y ~ predicted_log_odds, family = binomial)
cat(sprintf("events at this sample size (n = 250): %d\n", sum(train$y)))
cat(sprintf("calibration slope: %.2f\n", coef(calibration_fit)[["predicted_log_odds"]]))
#> events at this sample size (n = 250): 59
#> calibration slope: 0.90
```

59 events over 5 predictors is an EPV of about 11.8, the same safe-looking level this lesson's simulated study ran at 250 patients. At that level, x1's bias came out at only 1% and the interval's coverage at a reassuring 95%. The calibration slope here comes out at 0.90.

Two of the three diagnostics look fine at this sample size. Calibration has already moved.

=== step === widget
## What an overconfident model's probabilities look like

A calibration slope has a direct picture: the reliability diagram. Bin a model's predicted probabilities into groups, from near 0 up to near 1, then for each group plot the actual fraction of patients who were readmitted against the model's average prediction in that group. A perfectly calibrated model lands every group right on the diagonal, where predicted matches observed.

The widget below carries its own simulated fit rather than this lesson's readmission model, and a slider that tilts it from under-confident to over-confident. A slope like 0.53, the weakest events-per-variable level tested in this lesson, bows the curve below the diagonal the same way this widget does once you push its slider toward over-confident.

::widget calibration-curve {}

Push the slider up past 1 and watch the curve sag below the diagonal: the model's high predictions, close to 1, do not come true as often as their own number says. Pull it below 1 and the curve bows the other way, above the diagonal, the model hedging more than the data call for. A calibration slope is just a single number that summarises how far that curve has bowed off the diagonal, in one direction or the other.

=== step === quiz
## Quick check: which diagnostic to trust

At an events-per-variable ratio of 11, the textbook-safe threshold, the typical x1 coefficient was biased by about 1%, the 95% interval's coverage was 95%, and the calibration slope had already fallen to 0.90. Which of the three diagnostics already showed trouble at that point, and why trust it over the other two?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Coverage, because a 95% interval is the only one of the three built from a formal confidence level. ::no
- Bias, because a 1% bias is already large enough to change a treatment decision. ::no
- Calibration, because its slope had already dropped to 0.90, the same overconfident, bowed-off-the-diagonal pattern a reliability diagram draws for an overconfident model, while bias and coverage both still looked fine. ::ok Right. Bias stayed near 1% and coverage near 95% at this same sample size, both looking perfectly healthy. Only the calibration slope had already moved, from 1.0 down to 0.90, a 10% overconfidence the other two diagnostics gave no hint of.
- None of them, because a model fitted at an events-per-variable ratio of 11 should be thrown out entirely. ::no Look at all three numbers at this one events-per-variable level together: bias about 1%, coverage 95%, calibration slope 0.90. Two of the three diagnostics look fine here. Only the calibration slope has already moved away from 1.0, which is what makes it the one worth checking first.

=== step === tryit
## Your turn: measure how far calibration has drifted

The calibration slope was 0.90 at an events-per-variable ratio of 11, and the table of simulated results found it at 0.53 at an events-per-variable ratio of 2. Compute how far the slope dropped between those two levels, as a percent of its starting value.

```r
# calibration_epv11 is the calibration slope at EPV 11
# calibration_epv2 is the calibration slope at EPV 2
calibration_epv11 <- 0.90
calibration_epv2 <- 0.53

# Compute the percent drop from the EPV 11 slope to the EPV 2 slope
# One line. Press Check when you have it.
```
::check {"regex": "(?=.*calibration_epv11)(?=.*calibration_epv2)(?=.*100)(?=.*/)", "gate": true, "difficulty": "beginner", "ok": "Right: a drop of 41.1%. The calibration slope fell by more than 40% between these two events-per-variable levels, even though at the higher of the two levels the x1 coefficient's bias and the interval's coverage both still looked perfectly healthy.", "no": "Divide the drop by the starting value, then multiply by 100: 100 * (calibration_epv11 - calibration_epv2) / calibration_epv11."}
::solution
```r
# Compute the percent drop from the EPV 11 slope to the EPV 2 slope
percent_drop <- 100 * (calibration_epv11 - calibration_epv2) / calibration_epv11
round(percent_drop, 1)
#> [1] 41.1
```

A 41.1% drop in the calibration slope, between two events-per-variable levels where bias and interval coverage barely moved at all. Calibration is not just the diagnostic that fails earliest. Once it starts failing, it keeps falling a long way while the other two diagnostics stay quiet.

=== step === concept
## References

- [A simulation study of the number of events per variable in logistic regression analysis](https://doi.org/10.1016/s0895-4356(96)00236-3) - Peduzzi, P., Concato, J., Kemper, E., Holford, T.R. and Feinstein, A.R. (1996), Journal of Clinical Epidemiology, 49(12), 1373-1379. The source of the events-per-variable-of-10 rule of thumb this lesson tests.
- [Regression Modeling Strategies, course notes](https://hbiostat.org/rmsc) - Harrell, F.E. Companion to the book (2nd ed., Springer, 2015); sample size, overfitting and events-per-variable guidance for a fitted model.
- [Applied Logistic Regression, 3rd ed.](https://doi.org/10.1002/9781118548387) - Hosmer, D.W., Lemeshow, S. and Sturdivant, R.X. (2013), Wiley. Calibration and goodness-of-fit in logistic regression.
- [Clinical Prediction Models, 2nd ed.](https://doi.org/10.1007/978-3-030-16399-0) - Steyerberg, E.W. (2019), Springer. Overfitting, shrinkage and the validation of a fitted prediction model.

=== step === complete
## Spending an events budget honestly

Across this simulated study, three diagnostics told three different stories as events per variable fell from 55 to 2.

Bias stayed small, 1% to 3%, all the way down to an events-per-variable ratio of 11, then jumped to 14% and 12% below that. Coverage barely moved: it stayed between 94% and 97% at every level tested, including the worst one. Calibration told the real story. Its slope had already fallen to 0.90, a 10% overconfidence, at an events-per-variable ratio of 11, the textbook-safe threshold, and it kept falling to 0.53 by an events-per-variable ratio of 2.

So the familiar rule, at least 10 events per variable, is not wrong. It just is not the safety net it looks like. A model that clears it can still be handing out overconfident probabilities, and the two diagnostics people check most often, a coefficient's bias and a confidence interval's coverage, will not tell you so.

Treat an events-per-variable ratio of 10 as a floor worth clearing, not a guarantee worth trusting. And check a fitted model's calibration against patients it has not seen, rather than trusting a confidence interval's coverage to warn you if something has gone wrong.
