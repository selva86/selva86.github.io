---
title: "Regression Modeling Strategies Lesson 7: Presenting a model so it survives review"
catalog_blurb: "What a reviewer expects beside a coefficient table, and how to write it honestly."
description: "A fitted logistic regression presented four ways: a coefficient table, partial-effect plots, a nomogram, and a plain-language paragraph for a reviewer."
keywords: "odds ratio, confidence interval, nomogram, partial-effect plot, calibration slope, cross-validated AUC, logistic regression, model reporting, TRIPOD, R"
post_type: "LESSON"
course_id: "res-model-strategy"
course_title: "Regression Modeling Strategies"
course_lesson: "7"
course_total: "7"
course_landing: "Regression-Modeling-Strategies-Course.html"
course_prev: "How-Many-Events-per-Variable-You-Can-Afford.html"
course_next: ""
curriculum_id: "4.70.7"
lesson_access: "pro"
mathjax: false
webr: true
---

=== step === cover
## Presenting a model so it survives review

Today let's understand how to present a fitted model so that it survives a reviewer's questions, not just your own.

A model that only you can read is not finished. Somewhere between fitting it in R and sending it off for review, every number in it has to turn into something a stranger can check: a coefficient into something they can interpret, a prediction into a plot they can trust, a gap in the data into a sentence that says so plainly.

This lesson follows one fitted model through four such write-ups, in the order they usually get built.

::widget process-flow {"steps": [{"title": "Coefficient table", "sub": "odds ratio, interval and p for each predictor"}, {"title": "Partial-effect plots", "sub": "predicted risk swept across the range of one predictor"}, {"title": "Nomogram", "sub": "each predictor value turned into points, summed, read as a probability"}, {"title": "Plain-language paragraph", "sub": "the numbers above turned into sentences a reviewer can read"}]}

That is the order this lesson follows, one presentation at a time.

=== step === concept
## The study, and the model fit to it

Here is the study this lesson works with. Five hundred patients had surgery, and for each one we know four things measured before the operation ended: their age, their BMI, how long the surgery took in minutes, and whether they have diabetes. The outcome is whether they went on to develop a surgical-site infection, a wound infection at the site of the operation.

These four predictors were decided before any data existed, from clinical knowledge of what raises infection risk, rather than by searching through the data for whatever happened to correlate.

One more real-world wrinkle: 17 of the 500 patients are missing a BMI measurement, so the model below is fit on the remaining 483 complete cases. Let's simulate this study and fit the model.

```r
# Simulate 500 surgical patients and fit a model predicting infection
set.seed(42)
n <- 500
age <- pmin(pmax(rnorm(n, 55, 13), 20), 88)
bmi <- pmin(pmax(rnorm(n, 28, 5), 16), 48)
duration <- pmin(pmax(rnorm(n, 120, 40), 35), 300)
diabetes <- rbinom(n, 1, 0.15)
linear_predictor <- -2.3 + 0.035 * (age - 55) + 0.06 * (bmi - 28) +
  0.009 * (duration - 120) + 0.5 * diabetes
infection <- rbinom(n, 1, plogis(linear_predictor))

# 17 patients are missing a BMI measurement, so 483 complete cases remain
missing_rows <- sample(seq_len(n), 17)
bmi[missing_rows] <- NA
patients <- data.frame(age, bmi, duration, diabetes, infection)

fit <- glm(infection ~ age + bmi + duration + diabetes, data = patients, family = binomial)
summary(fit)
#>
#> Call:
#> glm(formula = infection ~ age + bmi + duration + diabetes, family = binomial, 
#>     data = patients)
#>
#> Coefficients:
#>              Estimate Std. Error z value Pr(>|z|)    
#> (Intercept) -8.061768   1.231235  -6.548 5.84e-11 ***
#> age          0.047094   0.011482   4.102 4.10e-05 ***
#> bmi          0.086372   0.028074   3.077  0.00209 ** 
#> duration     0.007810   0.003627   2.154  0.03127 *  
#> diabetes     0.456229   0.338891   1.346  0.17822    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for binomial family taken to be 1)
#>
#>     Null deviance: 385.27  on 482  degrees of freedom
#> Residual deviance: 351.32  on 478  degrees of freedom
#>   (17 observations deleted due to missingness)
#> AIC: 361.32
#>
#> Number of Fisher Scoring iterations: 5
```

Look at the Estimate column. Those numbers are correct, and this printout is the model's first presentation, the one `summary()` hands back by default. But hand this table to a reviewer, or to a surgeon deciding whether to trust it, and neither one can use it as it stands.

The reason is the scale those estimates live on. Each one is a change in the log odds of infection per unit of its predictor: age's estimate, 0.047094, means one more year of age adds 0.047094 to the log odds of infection. Log odds are not a scale anyone thinks in day to day, so a number like 0.047094 carries no felt sense of how much riskier an extra year of age actually makes a patient.

=== step === widget
## What belongs in a report-ready coefficient table

The fix is to move each coefficient off the log-odds scale and onto one that means something: the odds ratio. Exponentiating a coefficient, that is, computing `exp(coefficient)`, turns a change in log odds into a multiplier on the odds themselves.

Odds are just another way of writing a probability. If 20% of patients get infected, the odds of infection are 0.2 divided by 0.8, or 0.25: infection is one fourth as likely as not happening. An odds ratio of 1.05 says that a one-unit increase in the predictor multiplies those odds by 1.05, a 5% increase, holding every other predictor fixed.

The same move gives a confidence interval for the odds ratio: `exp(coefficient - 1.96 * standard error)` for the lower bound and `exp(coefficient + 1.96 * standard error)` for the upper one, the familiar 1.96 carried through the exponent instead of left on the coefficient's own scale. Let's convert all four coefficients this way.

```r
# Convert each coefficient to an odds ratio with a 95% confidence interval
model_coefs <- coef(summary(fit))
odds_ratio_table <- data.frame(
  predictor = c("age (per year)", "BMI (per unit)",
                "surgery duration (per minute)", "diabetes (yes vs no)"),
  odds_ratio = round(exp(model_coefs[-1, "Estimate"]), 2),
  ci_low = round(exp(model_coefs[-1, "Estimate"] - 1.96 * model_coefs[-1, "Std. Error"]), 2),
  ci_high = round(exp(model_coefs[-1, "Estimate"] + 1.96 * model_coefs[-1, "Std. Error"]), 2),
  row.names = NULL
)
odds_ratio_table
#>                       predictor odds_ratio ci_low ci_high
#> 1                age (per year)       1.05   1.02    1.07
#> 2                BMI (per unit)       1.09   1.03    1.15
#> 3 surgery duration (per minute)       1.01   1.00    1.02
#> 4          diabetes (yes vs no)       1.58   0.81    3.07
```

Read the age row first: each extra year of age multiplies the odds of infection by 1.05, and the interval, 1.02 to 1.07, sits entirely above 1, so this effect is real and fairly precisely pinned down. BMI reads the same way, a 9% rise in the odds per unit, interval 1.03 to 1.15. Diabetes is the odd one out: its odds ratio, 1.58, points toward higher odds of infection, but its interval, 0.81 to 3.07, crosses 1, so this data cannot rule out diabetes having no effect at all, or even a small protective one.

This table already tells a reviewer more than the raw printout did, but it still needs a p-value next to each row and a title saying what model it came from. Below is the same four rows twice: flip the toggle and watch a bare, unstyled print of this table turn into one with a title, a right-aligned p column, and a source note underneath, the version you would actually hand someone.

::widget styled-table {"cols": ["predictor", "odds ratio", "95% CI", "p"], "rows": [["age (per year)", "1.05", "1.02 to 1.07", "under 0.0001"], ["BMI (per unit)", "1.09", "1.03 to 1.15", "0.0021"], ["surgery duration (per minute)", "1.01", "1.00 to 1.02", "0.0313"], ["diabetes (yes vs no)", "1.58", "0.81 to 3.07", "0.1782"]], "title": "Surgical-site infection model", "note": "Logistic regression, n=483 complete cases"}

=== step === widget
## Partial-effect plots: risk across a predictor's range

An odds ratio tells you the per-unit multiplier, but a reviewer, and a surgeon, usually wants something more direct: this patient's actual predicted risk, at a realistic age, holding everything else fixed. That is what a partial-effect plot shows: sweep one predictor across a realistic range while holding the others at typical values, and read off the predicted probability at each point.

Let's sweep age across 40, 55, 70 and 85, holding BMI and surgery duration at their median value among the 483 patients, and diabetes at 0 (no diabetes).

```r
# Predict infection risk across a range of ages, holding other predictors fixed
complete_patients <- patients[complete.cases(patients), ]
typical_bmi <- median(complete_patients$bmi)
typical_duration <- median(complete_patients$duration)
age_values <- c(40, 55, 70, 85)
age_sweep <- data.frame(age = age_values, bmi = typical_bmi,
                         duration = typical_duration, diabetes = 0)
predicted_risk <- predict(fit, newdata = age_sweep, type = "response")
names(predicted_risk) <- age_values
round(predicted_risk, 3)
#>    40    55    70    85 
#> 0.056 0.107 0.195 0.330 
```

The predicted risk nearly doubles with every 15 years: 5.6% at 40, 10.7% at 55, 19.5% at 70, and 33.0% at 85. That is the same constant 5% per-year odds ratio off the coefficient table above, now compounded across a realistic age range and read as an actual predicted risk instead of a multiplier. An odds ratio close to 1 can still add up to a very different patient at the far end of a predictor's range than at the near end.

Sweeping one feature and reading the average prediction has a name in the wider machine learning world: partial dependence. The widget below is not drawn from these 483 patients; it carries its own small demonstration dataset, a stand-in built just to show the shape. Each faint line is one row's prediction as that row's own feature sweeps across the grid, called an ICE curve (individual conditional expectation), and the bold line is their average, the partial-dependence curve itself, the same operation you just did by hand on age above.

::widget pdp-curve {}

Press Run on the widget's own code block to see how a partial-dependence curve gets built in general, with its own generic data, not the surgical patients above.

=== step === quiz
## Quick check: reading an odds ratio

The surgery-duration row read odds ratio 1.01, interval 1.00 to 1.02, p = 0.0313. Which sentence reads that row correctly?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Each extra minute of surgery raises the odds of infection by about 1%, and because the interval, 1.00 to 1.02, only just excludes 1, that effect is real but small for any single minute. ::ok Right. A per-minute odds ratio this close to 1 looks unremarkable next to age or BMI, but it is still a real effect, and over a two-hour operation that 1% compounds minute by minute into something worth reporting.
- An odds ratio this close to 1 means surgery duration has no real effect on infection risk. ::no
- An odds ratio of 1.01 means the odds of infection are 101% higher for every extra minute of surgery. ::no An odds ratio of 1.01 means the new odds are 1.01 times the old odds, a 1% increase, not a 101% increase: multiplying by 1.01 barely moves the number. And close to 1 does not mean no effect: the interval here, 1.00 to 1.02, only just allows for no effect at all, which is exactly what a p-value of 0.0313, just under the usual 0.05 line, is telling you.

=== step === concept
## The nomogram: the same model, read as points

A nomogram takes the same coefficients and turns them into a paper scale: add up a few numbers and convert the total into a predicted probability, all without touching a computer. It sounds like a different model. It is the same model, just redrawn.

Here is how the points get assigned. For each predictor, take the span it covers in realistic patients, the 5th to 95th percentile of that predictor among the 483 patients, and multiply that span by the predictor's coefficient. That gives how far the log odds can move across that predictor's realistic range. Whichever predictor moves the log odds furthest across its own range gets a scale of 100 points for that range, and every other predictor is scaled by the same points-per-log-odds conversion factor, so one point always means the same thing no matter which predictor it came from.

Let's compute this for one real patient: age 68, BMI 31, surgery duration 150 minutes, and diabetic.

```r
# Score one patient by hand on a nomogram's points scale, then convert back
predictor_ranges <- apply(complete_patients[, c("age", "bmi", "duration")], 2,
                           function(col) quantile(col, probs = c(0.05, 0.95)))
model_coefs_raw <- coef(fit)

full_range_contribution <- c(
  age = diff(predictor_ranges[, "age"]) * abs(model_coefs_raw["age"]),
  bmi = diff(predictor_ranges[, "bmi"]) * abs(model_coefs_raw["bmi"]),
  duration = diff(predictor_ranges[, "duration"]) * abs(model_coefs_raw["duration"]),
  diabetes = 1 * abs(model_coefs_raw["diabetes"])
)
points_per_logit <- 100 / max(full_range_contribution)

patient <- data.frame(age = 68, bmi = 31, duration = 150, diabetes = 1)
age_points <- (patient$age - predictor_ranges["5%", "age"]) * abs(model_coefs_raw["age"]) * points_per_logit
bmi_points <- (patient$bmi - predictor_ranges["5%", "bmi"]) * abs(model_coefs_raw["bmi"]) * points_per_logit
duration_points <- (patient$duration - predictor_ranges["5%", "duration"]) * abs(model_coefs_raw["duration"]) * points_per_logit
diabetes_points <- patient$diabetes * abs(model_coefs_raw["diabetes"]) * points_per_logit
total_points <- age_points + bmi_points + duration_points + diabetes_points

cat("age points:", round(age_points, 1), "\n")
cat("bmi points:", round(bmi_points, 1), "\n")
cat("duration points:", round(duration_points, 1), "\n")
cat("diabetes points:", round(diabetes_points, 1), "\n")
cat("total points:", round(total_points, 1), "\n")
#> age points: 84.4 
#> bmi points: 53.4 
#> duration points: 40.1 
#> diabetes points: 24.4 
#> total points: 202.3 

baseline_logit <- predict(fit, newdata = data.frame(
  age = predictor_ranges["5%", "age"], bmi = predictor_ranges["5%", "bmi"],
  duration = predictor_ranges["5%", "duration"], diabetes = 0
), type = "link")
reconstructed_probability <- plogis(as.numeric(baseline_logit) + total_points / points_per_logit)
direct_probability <- predict(fit, newdata = patient, type = "response")
cat("reconstructed probability:", round(reconstructed_probability, 4), "\n")
cat("direct model prediction:  ", round(direct_probability, 4), "\n")
#> reconstructed probability: 0.3649 
#> direct model prediction:   0.3649 
```

Age alone earns this patient 84.4 points, BMI 53.4, duration 40.1, and diabetes 24.4, for a total of 202.3 points on the nomogram's own scale. Converting that total back into a probability, by adding it to the baseline log odds and passing the result through the logistic function, gives 0.3649.

[KEY INSIGHT]
That reconstructed probability, 0.3649, is not just close to the direct prediction `predict()` gives this same patient, it is identical to four decimal places. A nomogram does not approximate a fitted model. It relabels the same arithmetic onto a scale a reader can use without a computer.

=== step === widget
## What a reviewer checks beyond the table

So far every number has come from the same 483 patients the model was fit on, and that is a problem a reviewer will spot immediately: a model's apparent performance always looks better on the data it was fit on than on a new patient. The two numbers that answer this are a validation estimate, scored on patients the model never fit on, and a calibration check, which asks whether the model's predicted probabilities are the right size, not just the right order.

Let's build both with 5-fold cross-validation: split the 483 patients into five groups, fit the model on four of them, score it on the one held out, and rotate through all five groups so every patient ends up scored by a fit that never saw them.

```r
# Compare the apparent AUC with a 5-fold cross-validated AUC and calibration slope
auc <- function(outcome, predicted) {
  positive <- predicted[outcome == 1]
  negative <- predicted[outcome == 0]
  mean(outer(positive, negative, function(a, b) (a > b) + 0.5 * (a == b)))
}
apparent_predictions <- predict(fit, type = "response")
apparent_auc <- auc(complete_patients$infection, apparent_predictions)

set.seed(42)
k <- 5
fold_id <- sample(rep(1:k, length.out = nrow(complete_patients)))
out_of_fold_pred <- numeric(nrow(complete_patients))
for (fold in 1:k) {
  train_rows <- complete_patients[fold_id != fold, ]
  test_rows <- complete_patients[fold_id == fold, ]
  fold_fit <- glm(infection ~ age + bmi + duration + diabetes, data = train_rows, family = binomial)
  out_of_fold_pred[fold_id == fold] <- predict(fold_fit, newdata = test_rows, type = "response")
}
cv_auc <- auc(complete_patients$infection, out_of_fold_pred)

logit_oof <- qlogis(pmin(pmax(out_of_fold_pred, 1e-6), 1 - 1e-6))
calibration_slope <- coef(glm(complete_patients$infection ~ logit_oof, family = binomial))[2]

cat("apparent AUC:", round(apparent_auc, 3), "\n")
cat("cross-validated AUC:", round(cv_auc, 3), "\n")
cat("calibration slope:", round(calibration_slope, 3), "\n")
#> apparent AUC: 0.717 
#> cross-validated AUC: 0.69 
#> calibration slope: 0.794 
```

AUC, short for area under the ROC curve, measures how well the model's predicted risk ranks a patient who got infected above one who did not: 0.5 is a coin flip and 1.0 is perfect separation. Scored on the same patients it was fit on, this model reaches 0.717. Scored out-of-fold, on patients each fit never saw, it drops to 0.69. That 0.027 gap is what overfitting looks like, measured rather than guessed at.

The calibration slope asks a different question: not whether the model ranks patients correctly, but whether its predicted probabilities are the right size. It comes from regressing the true outcome on the log odds of the out-of-fold predictions; a slope of 1 means the predictions are exactly as confident as the data supports. Ours came out at 0.794, below 1, which means the model's predicted probabilities swing further from 0.5 than the data actually earns: a touch overconfident.

The widget below fits its own small demonstration model and plots a reliability curve: predicted probability on one axis, how often that prediction actually came true on the other, against the diagonal where the two would match exactly. Its confidence slider starts at a calibrated model sitting right on the diagonal; drag it up past 1 and watch the curve bow below the diagonal, the same overconfident shape our own calibration slope of 0.794 describes.

::widget calibration-curve {}

=== step === concept
## The plain-language paragraph, and the sentence about diabetes

Everything so far has been a table, a plot, or a computation. The fourth presentation is the one that actually goes in front of a reviewer first: a short paragraph that states, in plain language, everything the other three worked out.

Here is that paragraph, built entirely from this lesson's own numbers:

[NOTE]
Of 500 patients undergoing surgery, 67 (13.4%) developed a surgical-site infection. Age, BMI, surgery duration and diabetes status were specified as predictors before data collection began. 17 patients (3.4%) were missing a BMI measurement and were excluded, leaving 483 complete cases for the fitted logistic regression. Each additional year of age was associated with 5% higher odds of infection (OR 1.05, 95% CI 1.02 to 1.07), and each additional unit of BMI with 9% higher odds (OR 1.09, 95% CI 1.03 to 1.15). The model's discrimination, assessed by 5-fold cross-validation, was modest (AUC 0.69), and its predicted probabilities were somewhat overconfident (calibration slope 0.79). Diabetes was associated with higher odds of infection (OR 1.58), but the confidence interval, 0.81 to 3.07, is consistent with anywhere from a 19% decrease to more than a threefold increase in the odds, so this data cannot say whether diabetes raises infection risk, only that it failed to rule the possibility out.

Notice what that last sentence does, and what it does not do. It does not round 1.58 up to a confident claim, and it does not throw the number out either, since 1.58 is still the model's best single estimate. It states the range the data actually supports, 0.81 to 3.07, and lets that range speak for how much, or how little, this study can say about diabetes.

[TIP]
A bounded sentence states the interval's own range, not a rounded-off story. When an interval crosses the value that would mean no effect, say so plainly instead of leaning on the single estimate alone.

=== step === quiz
## Quick check: what would reassure a reviewer the model is not overfit

This model's apparent AUC was 0.717, its cross-validated AUC 0.69, and diabetes's own p-value 0.1782. Which number would actually reassure a reviewer that the model is not overfit?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The cross-validated AUC, 0.69, reported next to the apparent AUC, 0.717, because the 0.027 gap between them is what overfitting looks like as a number. ::ok Right. 0.717 is how well the model ranks patients it already fit on; 0.69 is how well it ranks patients it never saw during fitting. The gap between the two is overfitting, measured rather than guessed at.
- Every coefficient's p-value coming in under 0.05, since a model whose predictors are all statistically significant cannot be overfit. ::no
- Including the raw summary() output from early in this lesson in an appendix, since it lets a reviewer check the fit directly. ::no Neither of these touches the question. Every p-value in this model, including diabetes's own 0.1782, came from the same 483 patients the model was fit on, and the raw summary() output only restates that same apparent fit in its least readable form. Only a number computed on patients the model did not get to see while fitting, like the cross-validated AUC, can tell you how it will do on the next patient.

=== step === tryit
## Your turn: build the interval the honest sentence depends on

The bounded sentence about diabetes rests on one interval you have not built yourself yet. Diabetes's coefficient is 0.4562 and its standard error is 0.3389, straight from the fitted model. Build the 95% odds-ratio interval the same way: `exp(coefficient +/- 1.96 * standard error)`.

```r
# diabetes's coefficient and standard error from the fitted model
diabetes_coefficient <- 0.4562
diabetes_se <- 0.3389
diabetes_or <- exp(diabetes_coefficient)
diabetes_or

# Build the 95% odds-ratio interval here: exp(coefficient +/- 1.96 * se).
# One line. Press Check when you have it.
```
::check {"regex": "(?=[\\s\\S]*exp)(?=[\\s\\S]*1\\.96)(?=[\\s\\S]*diabetes_se)[\\s\\S]*", "gate": true, "difficulty": "beginner", "ok": "Right: 0.81 to 3.07. That is the exact interval the bounded sentence about diabetes rests on, computed by your own hand this time instead of taken on faith.", "no": "Reuse the same move from the coefficient table, now with the numbers for diabetes: exp(diabetes_coefficient + c(-1, 1) * 1.96 * diabetes_se)."}
::solution
```r
# Build the 95% odds-ratio interval from diabetes's coefficient and standard error
diabetes_ci <- exp(diabetes_coefficient + c(-1, 1) * 1.96 * diabetes_se)
round(diabetes_ci, 2)
#> [1] 0.81 3.07
```

=== step === concept
## References

- [Clinical Prediction Models, 2nd ed.](https://doi.org/10.1007/978-3-030-16399-0) - Steyerberg, E.W. (2019), Springer. Presenting a fitted model: coefficient tables, nomograms, calibration and validation.
- [Regression Modeling Strategies, course notes](https://hbiostat.org/rmsc) - Harrell, F.E. Companion to the book (2nd ed., Springer, 2015); the nomogram as points scaled to a predictor's range, and what belongs in a model write-up.
- [Transparent reporting of a multivariable prediction model for individual prognosis or diagnosis (TRIPOD)](https://doi.org/10.7326/M14-0697) - Collins, G.S., Reitsma, J.B., Altman, D.G. and Moons, K.G.M. (2015), Annals of Internal Medicine, 162(1), 55-63. The checklist of what a reviewer expects reported.
- [Multivariable prognostic models: issues in developing models, evaluating assumptions and adequacy, and measuring and reducing errors](https://doi.org/10.1002/%28SICI%291097-0258%2819960229%2915:4%3C361::AID-SIM168%3E3.0.CO;2-4) - Harrell, F.E., Lee, K.L. and Mark, D.B. (1996), Statistics in Medicine, 15(4), 361-387. Validation and calibration of a fitted model.

=== step === complete
## Four presentations, one fitted model

One fitted model, presented four ways. A coefficient table that converts each estimate into an odds ratio, an interval and a p-value. Partial-effect plots that turn those odds ratios into an actual predicted risk across a realistic range. A nomogram that is the same coefficients again, rescaled onto a points system a reader can use without a computer. And a plain-language paragraph that states all of it in sentences, bounded honestly where the data runs out, as it did for diabetes.

Beside all four, keep one short checklist for what a reviewer will ask for next: a validation estimate scored on data the model did not fit on, a calibration check on whether its probabilities are the right size, how any missing data was handled, and whether the predictors were chosen before looking at the data or after. Four presentations and four checklist items, and together they are what turns a fitted model into one that survives review.
