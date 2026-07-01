---
title: "Feature Engineering Lesson 7: Feature Selection and Spotting Leakage"
catalog_blurb: "Keep the features that earn their place, and catch leaks that inflate your score."
description: "Select features in R with filter, wrapper and embedded methods, then spot target leakage before it inflates your model's score and fails silently in production."
keywords: "feature selection, R, data leakage, target leakage, filter methods, wrapper methods, embedded methods, lasso, glmnet, variable importance, stepwise selection, cross-validation"
post_type: "LESSON"
curriculum_id: "6.60.7"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Feature-Engineering-Course.html"
course_next: ""
course_prev: "Imputing-Missing-Values-in-Features.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## Feature Selection and Spotting Leakage

For six lessons you have been manufacturing features: encoding, transforming, splitting dates, imputing gaps. Now you have more columns than you need, and a new pair of questions. Which features actually earn their place in the model? And is any column secretly cheating?

Picture the model you built to predict which free-trial users of a project-management app convert to a paid plan. You have 600 trials and eight behavioral columns about each one, from weekly logins to support tickets. Some genuinely predict conversion. Some are noise dressed up as signal. And one column your data team joined in later will hand you a stunning test score that collapses the moment you ship. This lesson is about telling all three apart.

By the end you will be able to:

- Rank features by a fast filter, and tell filter, wrapper and embedded selection apart
- Choose the right selection method for the job
- Define target leakage, spot its tell-tale signs, and remove a leak before it fools you

**Prerequisites:** you can fit and read a logistic regression, you know a train/test split and what overfitting is, and you have met data leakage once already ([Train/Validation/Test and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)). Comfortable with [dplyr](The-dplyr-Verbs.html) helps. Every new idea here is taught from scratch.

::widget importance-bars {"items":[{"label":"weekly logins","value":100},{"label":"features used","value":73},{"label":"team size","value":49},{"label":"docs opened","value":24},{"label":"emails clicked","value":14},{"label":"support tickets","value":8}]}

=== step === concept
::eyebrow Why bother
## More features is not more signal

It is tempting to throw every column you have at a model and let it sort them out. It rarely works out well. Each irrelevant feature is one more chance for the model to fit noise instead of signal, so it nudges variance up and generalization down, the overfitting you met in the imputation lesson. Extra columns also cost money to collect and store, slow training and scoring, and bury the two or three features that actually matter under a pile that does not.

So the goal of feature selection is simple to state: keep the smallest set of features that predicts well, and drop the rest. First, the data. Each lesson runs in a fresh R session, so we build the 600 trials right here (run this once). Only the first three columns truly drive conversion; the other five are along for the ride.

```r
set.seed(42)
n <- 600
z <- function(x) as.numeric(scale(x))

dat <- data.frame(
  weekly_logins    = pmax(0, round(rnorm(n, 12, 4))),  # real signal
  features_used    = rpois(n, 5),                       # real signal
  team_size        = rpois(n, 4) + 1,                   # real signal
  docs_opened      = rpois(n, 6),                        # no signal
  emails_clicked   = rpois(n, 3),                        # no signal
  support_tickets  = rpois(n, 1),                        # no signal
  page_pings       = round(rnorm(n, 40, 12)),            # no signal
  session_gap_days = round(rnorm(n, 7, 3))               # no signal
)

# The true conversion score depends ONLY on the first three columns:
score <- 1.2 * z(dat$weekly_logins) + 0.8 * z(dat$features_used) +
         0.5 * z(dat$team_size) + rnorm(n, 0, 0.6)

# The top 35% most-engaged trials convert (exactly 210 of the 600):
dat$converted <- as.integer(rank(score, ties.method = "first") > 0.65 * n)

table(dat$converted)
#> 
#>   0   1 
#> 390 210
```

Eight candidate features, one target, and a secret we built in: only three columns carry signal. A good selection method should rediscover that from the data alone. There are three families of methods that try, and they differ in one thing: how much they let the model itself do the choosing.

=== step === concept
::eyebrow Family 1
## Filter methods: rank one feature at a time

The cheapest family ignores the model entirely. A **filter** scores each feature on its own by how strongly it moves with the target, ranks them, and keeps the top few. Here the score is the absolute Pearson correlation between a feature and the outcome.

For a feature \(x_j\) (say weekly logins) and the target \(y\) (converted, coded 0 or 1), the correlation is

\[ \rho_j = \frac{\sum_{i=1}^{n}\left(x_{ij}-\bar{x}_j\right)\left(y_i-\bar{y}\right)}{\sqrt{\sum_{i=1}^{n}\left(x_{ij}-\bar{x}_j\right)^2}\;\sqrt{\sum_{i=1}^{n}\left(y_i-\bar{y}\right)^2}} \]

where \(x_{ij}\) is feature \(j\) for trial \(i\), \(\bar{x}_j\) is that feature's average, \(y_i\) is whether trial \(i\) converted, and \(\bar{y}\) is the conversion rate. The value \(\rho_j\) runs from \(-1\) to \(1\); we take \(\lvert\rho_j\rvert\) because a strong negative relationship is just as useful as a strong positive one. Rank the features by that number and the signal should float to the top:

```r
preds <- setdiff(names(dat), "converted")

# Filter score: how strongly each feature moves with the target, on its own.
strength <- sapply(dat[preds], function(x) abs(cor(x, dat$converted)))
sort(round(strength, 2), decreasing = TRUE)
#>    weekly_logins    features_used        team_size      docs_opened 
#>             0.56             0.37             0.22             0.05 
#> session_gap_days   emails_clicked       page_pings  support_tickets 
#>             0.03             0.02             0.02             0.01 
```

The three real drivers sit at the top (0.56, 0.37, 0.22) and the five noise columns collapse toward zero, exactly as designed. Filters are wonderful for a first cut: they are fast, they do not care which model you will use, and they scale to thousands of columns. Their blind spot is that they judge each feature **alone**. A filter cannot see that two features are near-duplicates (it will happily keep both), and it misses a feature that is useless by itself but powerful in combination with another. For that, you have to let the model weigh in.

=== step === tryit
::eyebrow Your turn
## Keep the features that clear the bar

You have the `strength` ranking from the last step. Turn a ranking into a *selection* by keeping only the features whose association clears a modest cutoff, so the real signals stay and the near-zero noise drops. Fill in the comparison.

```r
# Keep features whose absolute correlation clears 0.15; noise sits well below it.
keep <- names(strength)[strength ____ 0.15]
keep
```
::check {"regex":">","gate":true,"difficulty":"beginner","ok":"Right: strength > 0.15 keeps the features above the cutoff. The three real drivers clear it comfortably; the five noise columns fall short and are dropped.","no":"You want the features whose strength is greater than the cutoff, so use the greater-than sign: strength > 0.15."}
::solution
```r
keep <- names(strength)[strength > 0.15]
keep
#> [1] "weekly_logins" "features_used" "team_size"
```

=== step === concept
::eyebrow Family 2
## Wrapper methods: let the model judge subsets

A **wrapper** does what a filter refuses to: it uses the actual model as the judge. It trains the model on different subsets of features and keeps the subset that scores best, so it can reward features that only shine together and punish redundant ones.

The catch is cost. There are too many subsets to try them all (eight features already give 255 non-empty subsets), so wrappers search greedily. Backward stepwise selection is the classic:

1. Start with every feature in the model.
2. Try removing each one; see which removal most improves the model's score.
3. Drop that feature, refit, and repeat.
4. Stop when no single removal helps any more.

R's `step()` runs exactly that loop, scoring by AIC (a measure that rewards fit and penalizes extra features):

```r
full    <- glm(converted ~ ., data = dat, family = binomial)
reduced <- step(full, direction = "backward", trace = 0)
formula(reduced)
#> converted ~ weekly_logins + features_used + team_size + docs_opened
```

The search keeps the three real drivers and drops four of the five noise columns, because a noise feature usually does not pay for its complexity in AIC. Notice it hangs on to `docs_opened` here, a column with no real signal but the least innocent-looking of the noise: AIC would rather tolerate a borderline extra than risk dropping something useful. That is worth internalizing early, **selection is a heuristic, not an oracle**; treat any method's output as a shortlist to sanity-check. Wrappers usually pick a sharper subset than a filter, but they pay for it: they refit the model many times (slow on wide data), and they can overfit the *selection itself* if you tune it on the same data you evaluate on, a leak we will name in a moment.

=== step === concept
::eyebrow Family 3
## Embedded methods: selection baked into training

The third family gets selection for free by choosing a model that selects **while** it fits. The star is the **Lasso**, a linear or logistic regression with an L1 penalty. It fits the usual coefficients but pays a fine proportional to their absolute size, which pushes weak coefficients not just small but exactly to zero. A coefficient of zero means that feature is out of the model. For a linear fit:

\[ \hat{\beta} = \arg\min_{\beta}\;\; \underbrace{\frac{1}{2n}\sum_{i=1}^{n}\left(y_i - x_i^{\top}\beta\right)^2}_{\text{fit the data}} \;+\; \underbrace{\lambda\sum_{j=1}^{p}\lvert\beta_j\rvert}_{\text{penalty on size}} \]

where \(\beta_j\) is the weight on feature \(j\), \(p\) is the number of features, and \(\lambda\ge 0\) is the penalty strength: turn \(\lambda\) up and more coefficients are forced to zero. (For our yes/no target the fit term becomes the logistic loss, but the \(\lambda\sum\lvert\beta_j\rvert\) penalty, the part that does the selecting, is identical.) The `glmnet` package fits it and picks a sensible \(\lambda\) by cross-validation:

```r
library(glmnet)

x <- model.matrix(converted ~ ., data = dat)[, -1]   # the eight predictors as a matrix
y <- dat$converted
set.seed(1)
cv <- cv.glmnet(x, y, family = "binomial", alpha = 1) # alpha = 1 IS the Lasso

cf <- as.matrix(coef(cv, s = "lambda.1se"))  # coefficients at a well-regularized lambda
rownames(cf)[cf[, 1] != 0]                   # the features Lasso KEPT (coefficient not zero)
#> [1] "(Intercept)"   "weekly_logins" "features_used" "team_size"    
#> [5] "docs_opened"
```

Lasso keeps the signal and zeros most of the noise in a single fit, with no separate search. (On this sample it, too, holds on to `docs_opened`, the same borderline column the wrapper kept, another reminder that a selected set is a shortlist, not gospel.) Tree ensembles select in their own way: a random forest ranks features by how much each one improves its splits, and you keep the top of that ranking. The chart below shows an illustrative importance ranking for this trial data, the kind an embedded method produces.

::widget importance-bars {"items":[{"label":"weekly logins","value":100},{"label":"features used","value":68},{"label":"team size","value":41},{"label":"emails clicked","value":11},{"label":"docs opened","value":9},{"label":"support tickets","value":6},{"label":"page pings","value":4},{"label":"session gap days","value":3}]}

[NOTE]
Embedded methods are usually the best default: they are model-aware like a wrapper but cost one fit like a filter. One caveat: when two features are strongly correlated, the Lasso tends to keep one and zero the other almost at random, so do not read a zeroed coefficient as proof a feature is worthless.

=== step === quiz
::eyebrow Check yourself
## Choose the family

You have just pulled in a dataset with 3,000 candidate features and a single afternoon. You want a quick first cut to shrink the pile before you do any serious modeling, and you do not want the ranking to depend on which model you eventually pick. Which selection family fits this job best?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Filter methods: score each feature on its own against the target, fast and model-agnostic ::ok Exactly. A filter is O(one pass per feature), needs no model, and gives a model-independent ranking, which is precisely what a fast first cut over 3,000 columns calls for. Refine with an embedded method afterward.
- Wrapper methods: search subsets, refitting the model for each candidate ::no A wrapper refits the model many times over, which is far too slow for 3,000 features in an afternoon, and its result is tied to the one model you search with, the opposite of model-agnostic.
- Embedded methods: let a single model like the Lasso select during training ::no Embedded selection is excellent and you should reach for it next, but it ties the choice to one model's fit. For a fast, model-agnostic first pass over thousands of columns, the filter is the right tool.

=== step === concept
::eyebrow The bigger danger
## Target leakage: the feature that already knows

Selection decides which honest features to keep. Leakage is a nastier problem: a feature that should never have been a candidate at all. **Target leakage** is when a feature carries information you would not actually have at prediction time, usually because it is a consequence of the outcome rather than a cause. Train on it and your test score looks brilliant. Ship it and the model falls apart, because in the real world that feature is not there yet.

Back to the trials. Your data team joins in a billing column, `invoice_amount`, the dollars invoiced to each account. It sounds like a fine feature. But an invoice only exists **after** a trial converts to paid, so `invoice_amount` is greater than zero for exactly the converters and zero for everyone else. It does not predict conversion; it *is* conversion, relabeled.

```r
# The billing column the data team joined in: dollars invoiced to each trial.
set.seed(7)
dat$invoice_amount <- ifelse(dat$converted == 1, round(runif(n, 20, 400)), 0)

# The tell: does a feature line up with the target almost perfectly?
table(paid = dat$invoice_amount > 0, converted = dat$converted)
#>        converted
#> paid      0   1
#>   FALSE 390   0
#>   TRUE    0 210
```

Every converter has a bill, no non-converter does: a perfect line-up. Drag the toggle in the widget below to feel what that does to a model. With the honest features, the held-out accuracy (the fraction of trials the model classifies correctly) is a believable 0.78. Flip the leak on and it rockets to 0.99, a number too good to be real.

::widget data-split {}

=== step === quiz
::eyebrow Check yourself
## Spot the leak

Your trial-conversion model posts an astonishing 0.999 accuracy on the held-out test set, and almost all of the importance sits on one feature, `invoice_amount`. A teammate is thrilled and wants to ship it today. What is the most likely explanation?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model is genuinely excellent; a 0.999 accuracy just means these features are very predictive ::no A near-perfect score driven by a single dominating feature is the classic fingerprint of leakage, not skill. Real problems almost never allow 0.999, so the first move is suspicion, not celebration.
- The feature is target leakage: an invoice exists only after a trial converts, so it encodes the answer and will be zero (or absent) for every genuinely new trial at prediction time ::ok Exactly. `invoice_amount` is a consequence of the outcome, not a predictor of it. At prediction time, before you know whether they convert, there is no invoice, so the model loses the crutch it was leaning on and collapses.
- The held-out test set is simply too small to give a trustworthy score ::no Test-set size is not the issue. A feature that is a proxy for the outcome inflates the score at any test size; enlarging the test set would not fix a feature that is really the answer in disguise.

=== step === tryit
::eyebrow Your turn
## Catch it, then drop it

Leaks hide in plain sight, so train yourself to look for three tells:

1. **A score too good to be true.** Near-perfect accuracy on a hard problem is a red flag, not a trophy.
2. **One feature dominating.** When a single column carries almost all the importance, ask where it comes from. The chart below is that exact warning sign for the trial model: `invoice_amount` towers over every honest feature.
3. **A provenance and timing check.** For each feature ask one question: *would I know this value at the moment I make the prediction?* If it is recorded at or after the outcome, it leaks.

::widget importance-bars {"items":[{"label":"invoice amount","value":100},{"label":"weekly logins","value":29},{"label":"features used","value":21},{"label":"team size","value":13},{"label":"docs opened","value":6},{"label":"emails clicked","value":4}]}

The fix is blunt: a leaked feature is not a feature, so drop it before modeling and keep only inputs you would have *before* the outcome is known. Fill in the column to remove.

```r
# Keep only inputs available BEFORE conversion is known.
# Drop the leaked billing column (and the target itself):
model_inputs <- dat[, !names(dat) %in% c("____", "converted")]
ncol(model_inputs)   # how many honest predictors remain
```
::check {"regex":"invoice_amount","gate":true,"difficulty":"intermediate","ok":"Right: dropping invoice_amount leaves the eight honest predictors. The score falls back to earth, but now it is a score you can actually trust in production.","no":"Remove the leaked billing column by name: invoice_amount. It is the consequence of conversion, so it cannot be a model input."}
::solution
```r
model_inputs <- dat[, !names(dat) %in% c("invoice_amount", "converted")]
ncol(model_inputs)
#> [1] 8
```

[WARNING]
The deadliest leaks are subtler than a billing column. Selection and preprocessing can leak too: if you rank features, tune a wrapper, or fit an imputer on the *whole* dataset before splitting, the test rows help make choices they are later scored on. The discipline that prevents all of it is the same one from the imputation lesson: split first, then do every learned step, including feature selection, inside the cross-validation folds, so the test set never gets a vote.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Guyon & Elisseeff (2003), An Introduction to Variable and Feature Selection (JMLR, free PDF)](https://www.jmlr.org/papers/v3/guyon03a.html) - the standard reference that frames filter, wrapper and embedded methods.
- [Kaufman, Rosset & Perlich (2012), Leakage in Data Mining (ACM)](https://dl.acm.org/doi/10.1145/2382577.2382579) - the paper that named and dissected leakage, with real competition case studies.
- [Kuhn & Johnson, Feature Engineering and Selection (free online)](https://www.feat.engineering/) - book-length treatment of selection done inside resampling, the leak-free way.
- [scikit-learn user guide: Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html) - the clearest short write-up of why fitting any step on all the data leaks, and the split-first fix.

=== step === complete
## Module complete

You reached the end of Feature Engineering. You can now take a pile of candidate columns and do the two things that separate a working model from a fragile one: keep the features that earn their place, and refuse the ones that cheat.

You learned three ways to select: a **filter** ranks each feature on its own (fast, model-agnostic, blind to interactions), a **wrapper** lets the model judge subsets (sharper, slower), and an **embedded** method like the Lasso selects while it fits (usually the best default). And you learned the failure that no metric will warn you about: **target leakage**, a feature that encodes the answer, which you now catch with three tells, a score too good to be true, one feature dominating, and a provenance-and-timing check, and prevent by doing every learned step inside the split.

Feature Engineering is a graded module in the Data Scientist track. Pass its assessment and it joins your verified certificate. Next up is Model Evaluation and Tuning, where honest features finally meet honest scoring: cross-validation done right, the metrics that matter, and comparing models without fooling yourself.
