---
title: "ML Workflow Lesson 3: Train, Validation, Test, and Data Leakage"
catalog_blurb: "Split data so the test score is honest, and avoid common data leaks."
description: "Learn the train, validation and test split, how to evaluate a model honestly in R, and the data leakage mistakes (target, preprocessing, temporal) that fake good scores."
keywords: "train validation test split, data leakage, target leakage, temporal leakage, train test split, model evaluation, holdout set, overfitting, machine learning, R"
post_type: "LESSON"
curriculum_id: "6.10.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-ml-workflow"
course_title: "The Machine Learning Workflow in R"
course_lesson: "3"
course_total: "4"
course_landing: "R-ML-Workflow-Course.html"
course_next: "Your-First-End-to-End-Model-in-R.html"
course_prev: "The-Bias-Variance-Tradeoff.html"
---

=== step === cover
::eyebrow Lesson 3 of 4
## Train, Validation, Test, and Data Leakage

In Lesson 2 you saw that training error lies: a model can ace the data it learned from and still flop on new data. So the only honest verdict comes from data the model has never seen. This lesson is about setting that data aside correctly, and the subtle mistakes that secretly let the answer leak in.

Meet Dev, an analyst at a small online lender. He builds a model to predict whether a new loan will **default** (the borrower stops repaying). His first version scores a thrilling **98% accuracy** on held-out loans. Two months after launch, on real applicants, it is no better than guessing. Nothing was broken. One column had been handing the model the answer. By the end of this lesson you will know exactly how that happens, and how to stop it.

You will be able to:

- Explain why a held-out **test set** is the only honest stand-in for future, unseen data
- Split data into **train / validation / test** and say what each set is for
- Recognise and prevent **data leakage**: target, preprocessing, and temporal

**Prerequisites:** you can run R and read its output, and you know what training error, test error and overfitting are (Lesson 2: [The Bias-Variance Tradeoff](The-Bias-Variance-Tradeoff.html)).

The strip below is Dev's data, cut into the three sets. Flip the switch to sneak in a column built from the answer and watch the test score balloon. We unpack every piece of this over the next few steps.

::widget data-split {}

=== step === concept
::eyebrow Why hold data back
## The test set is a stand-in for the future

Dev's real goal is not to score well on the 1,000 loans already sitting in his database. Those borrowers' fates are settled. His goal is to predict the **next** applicant, someone not in the data at all. He cannot test on the future because it has not happened yet, so he does the next best thing: he hides a slice of his current loans, trains as if they do not exist, then unhides them and checks. That hidden slice is the **test set**, and it role-plays the future.

How honest is the verdict? With \(m\) held-out loans, where \(\hat{y}_i\) is the model's prediction for loan \(i\), \(y_i\) is what actually happened, and \(\mathbf{1}[\cdot]\) equals 1 when the prediction is wrong, the test error rate is

\[ \widehat{\mathrm{Err}} \;=\; \frac{1}{m}\sum_{i=1}^{m} \mathbf{1}\!\left[\hat{y}_i \neq y_i\right]. \]

This is just "the fraction of held-out loans the model got wrong." It is an honest estimate of future error for exactly one reason: the model never saw these rows while learning. The moment it does, the estimate is poisoned.

One slice is not enough, though. Dev also needs to *choose* between models (which features? how complex?), and every choice he makes by peeking at a set burns that set's honesty. So practice splits the data three ways:

| Set | Share | Its one job | When you touch it |
|---|---|---|---|
| **Train** | ~60% | Fit the model: learn the coefficients, grow the trees | Constantly, while fitting |
| **Validation** | ~20% | Tune and compare: pick features, complexity, settings | Repeatedly, while choosing |
| **Test** | ~20% | The final, honest verdict on the chosen model | Once, at the very end |

Here is that split in R. Each lesson runs in a fresh session, so we build Dev's loans inline, then carve out validation and test before doing anything else.

```r
set.seed(2026)
n <- 1000
loans <- data.frame(
  income   = round(rlnorm(n, log(45000), 0.4)),   # annual income, $
  loan_amt = round(runif(n, 2000, 40000)),        # amount borrowed, $
  term_mo  = sample(c(12, 24, 36, 48), n, TRUE),  # repayment term, months
  age      = round(runif(n, 21, 70))
)
# whether each loan actually defaulted: risk rises with the debt-to-income ratio
risk <- plogis(-3.2 + 4.0 * (loans$loan_amt / loans$income))
loans$defaulted <- rbinom(n, 1, risk)

set.seed(7)
shuffle  <- sample(nrow(loans))
test_id  <- shuffle[1:200]            # 20% held out as the final test
val_id   <- shuffle[201:400]          # 20% for tuning and comparing
train_id <- shuffle[401:1000]         # 60% to fit on

train <- loans[train_id, ]
val   <- loans[val_id, ]
test  <- loans[test_id, ]
c(train = nrow(train), validation = nrow(val), test = nrow(test))
#> train validation       test
#>   600        200        200
```

=== step === quiz
::eyebrow Check yourself
## When may you look at the test score?

Dev is trying three different feature sets and wants to keep the best one. At what point in the project should he look at how each one scores on the **test** set?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- Every time he changes the model, so he can track progress on real held-out data ::no Each peek lets a decision be shaped by the test set, so it slowly stops being "unseen." That is what the validation set is for.
- Whenever he compares two candidate models, to pick the winner ::no Comparing and picking is the **validation** set's job. If the test set chooses the model, its score is no longer an honest estimate of future error.
- Once, at the very end, after the model and all its settings are locked ::ok Right. The test set is spent the instant a decision depends on it. Tune and compare on validation; unseal test exactly once, to report the final verdict.

=== step === concept
::eyebrow The cardinal sin
## Data leakage: when the answer sneaks into training

A split only protects you if the test set truly contains nothing the model could not have at prediction time. **Data leakage** is any information available while training that would *not* be available at the real moment of prediction. It is the most common way a model looks brilliant in development and falls apart in production, because the leaked information inflates every score, validation and test alike.

The sharpest form is **target leakage**: a feature that is built from the answer itself. Write the label as \(y\) and the leaked feature as

\[ X_{\text{leak}} \;=\; g(y), \]

a function \(g\) of the very thing you are predicting. The model does not need to be clever; it just learns to invert \(g\) and read the answer straight off \(X_{\text{leak}}\). Accuracy soars. Then you deploy, the column is not there yet (or is always blank for a fresh case), and the model is lost.

[KEY INSIGHT]
The test question is never "does this feature predict well?" A leaked feature predicts *perfectly*. The question is "would I genuinely have this value, for this row, at the instant I make the prediction?" If not, it leaks, no matter how good it looks.

=== step === concept
::eyebrow Target leakage, live
## Dev's 98% mirage

Here is Dev's actual bug. His loans table has a column, `collections`, flagging whether the account was handed to a debt-collections agency. It is a fantastic predictor of default, because it only ever turns on **after** a borrower has already stopped paying. At the moment Dev scores a brand-new applicant, no one has been sent to collections yet, so the column is always 0. It is \(X_{\text{leak}} = g(y)\) in the flesh.

Watch the score jump when it sneaks in. First the honest model, then the leaked one, both judged on the same held-out test set:

```r
# Honest model: only features Dev truly has when an application arrives
honest <- glm(defaulted ~ income + loan_amt + term_mo + age,
              family = binomial, data = train)
honest_pred <- as.integer(predict(honest, newdata = test, type = "response") > 0.5)
mean(honest_pred == test$defaulted)
#> [1] 0.81

# Now add a column built from the answer: collections turns on AFTER default
loans$collections <- loans$defaulted * rbinom(nrow(loans), 1, 0.95)
train_lk <- loans[train_id, ]
test_lk  <- loans[test_id, ]

leaked <- glm(defaulted ~ collections + income + loan_amt,
              family = binomial, data = train_lk)
leaked_pred <- as.integer(predict(leaked, newdata = test_lk, type = "response") > 0.5)
mean(leaked_pred == test_lk$defaulted)
#> [1] 0.975
```

The honest model is right about 81% of the time, a real edge over the roughly 74% you would get by betting every loan repays. Add one leaked column and the test score jumps to about 98%, exactly Dev's launch number, and exactly the score that evaporated in production. The test set did its job perfectly; the data fed into it was the problem.

=== step === tryit
::eyebrow Your turn
## Score the clean model honestly

The single most important habit is to judge a model on data it never trained on. Below is Dev's clean model, fit on `train`. Finish the line so `predict()` scores it on the **held-out** `test` set rather than on the training rows. Fill in the blank.

```r
clean <- glm(defaulted ~ income + loan_amt + term_mo + age,
             family = binomial, data = train)

probs <- predict(clean, ____, type = "response")     # score the HELD-OUT loans
preds <- as.integer(probs > 0.5)
mean(preds == test$defaulted)
```
::check {"regex":"newdata\\s*=\\s*test","gate":true,"difficulty":"intermediate","ok":"That is honest evaluation: the held-out test loans give a trustworthy estimate of how Dev's model will do on the next real applicant.","no":"Point predict() at the held-out set with newdata = test. Scoring on the training rows is exactly how an overfit or leaky model hides."}
::solution
```r
clean <- glm(defaulted ~ income + loan_amt + term_mo + age,
             family = binomial, data = train)

probs <- predict(clean, newdata = test, type = "response")
preds <- as.integer(probs > 0.5)
mean(preds == test$defaulted)
#> [1] 0.81
```

=== step === concept
::eyebrow A subtler leak
## Preprocessing can leak too

Target leakage is the obvious villain. The quieter one hides in **preprocessing**. Suppose some incomes are missing and Dev fills the gaps with the average income, or he scales every feature to mean 0. If he computes that average (or that mean and standard deviation) over the **whole** dataset before splitting, the test rows have just contributed to a number the model uses. The test set peeked at itself.

The fix is a discipline: **every transform learns its parameters on the training set only**, then applies them, unchanged, to validation and test.

```r
# 14 applicants' incomes ($1000s); two are missing. The last 4 are the held-out test.
income <- c(40, 52, 38, NA, 60, 48, NA, 56, 42, 48, 78, 90, 72, 96)
rows   <- data.frame(income = income)
tr     <- 1:10        # first 10 rows = training
te     <- 11:14       # last 4 rows  = held-out test

# WRONG: fill missing income with the mean over ALL rows - test leaks into the fill value
bad_fill  <- mean(rows$income, na.rm = TRUE)
# RIGHT: learn the fill value on TRAIN only, then apply it everywhere
good_fill <- mean(rows$income[tr], na.rm = TRUE)

c(bad = round(bad_fill, 1), good = round(good_fill, 1))
#>  bad good
#>   60   48
```

The held-out applicants here happen to be higher earners, so letting them help compute the fill value drags it from the honest **48** up to **60**. That single number now carries information about the test set's own distribution, and the test score flatters the model. The same trap applies to scaling, encoding rare categories, and selecting features by correlation with the target: **fit the transform on train, apply it to test.**

=== step === concept
::eyebrow The leak that ignores the clock
## Temporal leakage: train on the past, test on the future

Dev's loans arrive over time, and the world drifts: a softening economy slowly pushes default rates up. In production he will only ever have the **past** to predict the **future**. So his split must respect the clock: train on older loans, test on newer ones. A plain random shuffle breaks this, letting the model train on next quarter's loans to "predict" last quarter's, an impossible advantage that hides the drift.

```r
set.seed(3)
n     <- 400
month <- rep(1:8, each = 50)                 # loans originated over 8 months
p     <- plogis(-3.4 + 0.34 * month)         # default rate drifts UP over time
loans_t <- data.frame(month = month, score = rnorm(n),
                      defaulted = rbinom(n, 1, p))

# RIGHT: a time-ordered split - fit on the past, judge on the future
train_t <- loans_t[loans_t$month <= 6, ]
test_t  <- loans_t[loans_t$month >= 7, ]

c(past_default_rate   = round(mean(train_t$defaulted), 2),
  future_default_rate = round(mean(test_t$defaulted),  2))
#> past_default_rate future_default_rate
#>              0.10                0.21
```

The later months really do default about twice as often. A time-based split forces the model to face that harder, more realistic future, the same future production will hand it. A random split would shuffle easy past months in among the hard future ones, so the model trains on rows it could never have seen yet and overstates how good it is. Watch for temporal leakage whenever rows carry a date, and never shuffle time away.

=== step === quiz
::eyebrow Check yourself
## Spot the leak

Dev lists three things in his pipeline. Which one is **target leakage**, the kind that makes a model look great in testing and fail on new applicants?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- He uses the applicant's credit score, which is known when the application is submitted ::no That is a perfectly legitimate feature: it exists at prediction time. A strong predictor is not automatically a leak.
- He uses `collections`, a flag that only turns on after a borrower has already missed payments ::ok Exactly. At the moment of prediction the loan is brand new, so `collections` is always 0. It is built from the outcome, the textbook target leak.
- He standardises income using the mean and standard deviation computed on the training set only ::no That is the correct, leak-free way to preprocess: learn the transform on train, apply it to test. No leak here.

=== step === concept
::eyebrow Putting it together
## The honest-evaluation workflow

Every leak you have seen has the same cure: **decide the order of operations before you touch the data, and never let the test set influence a choice.** Four rules carry it.

::widget process-flow {"steps":[{"title":"Split first","sub":"carve out validation and test BEFORE imputing, scaling, or selecting anything"},{"title":"Fit on train","sub":"learn the model AND every transform on the training rows only"},{"title":"Tune on validation","sub":"compare features, complexity and settings here, never on test"},{"title":"Test once","sub":"score the single chosen model on test one time, then stop"}]}

One honest limit to keep in mind: a test set is a consumable. Each time you look at its score and react, it leaks a little, so by the tenth model you compared on it, it is no longer truly unseen. That is the deeper reason validation exists, and why **cross-validation** (rotating the held-out slice, the subject of later sections) gives steadier estimates than a single split. Treat the test set like a sealed envelope: open it once.

[KEY INSIGHT]
Leakage is not a modelling bug you fix in the algorithm; it is a process bug you prevent in the *order* of your steps. Split first, and let the test set stay a stranger until the very end.

=== step === concept
::eyebrow Go deeper
## References

Authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 5 (free PDF)](https://www.statlearning.com/) - resampling, validation sets, and why a held-out estimate of error matters.
- [The Elements of Statistical Learning, ch. 7 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - model assessment and selection, the full treatment of training vs test error.
- [Kaufman et al. (2012), "Leakage in Data Mining: Formulation, Detection, and Avoidance"](https://doi.org/10.1145/2382577.2382579) - the canonical paper that names and dissects data leakage.
- [tidymodels: rsample documentation](https://rsample.tidymodels.org/) - the R tooling for honest splits and resampling you will lean on in later lessons.

=== step === complete
## Lesson 3 complete

You can now split data into train, validation and test and say what each is for, evaluate a model honestly on data it never saw, and catch the three leaks (target, preprocessing, temporal) that inflate scores and wreck a model in production. Dev's 98% mirage will never fool you again.

Next, Lesson 4: Your First End-to-End Model in R. You will take one dataset from raw rows to a fitted, evaluated, reproducible model, putting the honest split and leak-free habits from this lesson to work start to finish.
