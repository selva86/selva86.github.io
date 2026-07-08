---
title: "Feature Engineering in R: Quiz"
description: "A short, graded check on the feature-engineering section: encoding categories, target encoding and leakage, scaling and transformations, interactions and splines, features from dates and text, imputation, and feature selection."
keywords: "R quiz, feature engineering, one-hot encoding, target encoding, leakage, scaling, splines, imputation, feature selection, ds-feature-engineering"
post_type: "LESSON"
curriculum_id: "6.60.8"
webr: true
lesson_access: "pro"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "8"
course_total: "8"
course_landing: "R-Feature-Engineering-Course.html"
lesson_kind: "quiz"
course_prev: "Feature-Selection-and-Spotting-Leakage.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have turned raw columns into features a model can use: encoding categories without inventing order, target-encoding without leaking the answer, scaling and reshaping numbers, building interactions and splines, pulling features out of dates and text, imputing what is missing, and selecting the features that earn their place. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## Encoding a nominal category
You have a `city` column with values London, Paris and Tokyo. Why is plain integer (label) encoding a poor choice here?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It uses too much memory compared to one-hot encoding. ::no Label encoding uses one column; it is actually cheaper in memory than one-hot.
- It invents an order and spacing (Tokyo > Paris > London) that the model will believe. ::ok Correct: nominal categories have no order, but 1/2/3 tells a model Tokyo is "three times" London.
- It cannot represent more than two categories. ::no A single integer column can hold any number of levels.
- It always causes the model to overfit. ::no Overfitting is not the core issue; the fake ordinal relationship is.

=== step === quiz
::eyebrow Question 2 of 6
## Target encoding gone wrong
Target encoding replaces a category with the mean of the target for that category. Computed naively on the full training set, its main danger is:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- It cannot handle categories with many levels. ::no High cardinality is exactly where target encoding shines.
- It always produces values outside 0 and 1. ::no The encoded value is a mean of the target, on the target's own scale.
- Each row's encoding is influenced by its own target value, leaking the answer. ::ok Correct: use out-of-fold (cross-fitted) encoding so a row is encoded from other rows only.
- It requires the target to be normally distributed. ::no No distributional assumption is needed.

=== step === quiz
::eyebrow Question 3 of 6
## Which models care about scale
Standardizing numeric features (mean 0, unit variance) matters most for:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Distance- and gradient-based models like kNN, SVM, k-means and regularized regression. ::ok Correct: these compare or penalize features by magnitude, so raw scale distorts them.
- Decision trees and random forests. ::no Tree splits depend on order within a feature, not its scale, so scaling barely matters.
- Every model equally. ::no Tree-based models are essentially scale-invariant.
- Only models with a categorical target. ::no Scaling is about the predictors, not the target type.

=== step === quiz
::eyebrow Question 4 of 6
## What an interaction term captures
Adding an interaction `x1:x2` to a linear model lets it represent:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A curved effect of `x1` on its own. ::no A curve in one variable comes from a polynomial or spline term, not an interaction.
- An effect of `x1` that changes depending on the value of `x2`. ::ok Correct: the interaction is exactly "the slope of x1 depends on x2."
- The correlation between `x1` and `x2`. ::no Correlation is a property of the data, not a model term.
- A guarantee against overfitting. ::no Interactions add flexibility, which if anything raises overfitting risk.

=== step === quiz
::eyebrow Question 5 of 6
## A feature from a timestamp
Turning an order timestamp into a `day_of_week` feature is useful mainly because it:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Reduces the file size of the dataset. ::no Deriving a feature does not shrink storage in any meaningful way.
- Guarantees the model will be more accurate. ::no No feature guarantees accuracy; it only exposes a pattern that may or may not help.
- Exposes a repeating weekly pattern the raw timestamp hides. ::ok Correct: behavior often cycles by weekday, and a raw epoch number buries that signal.
- Removes the need to handle time zones. ::no Time-zone handling still matters when you derive calendar features.

=== step === quiz
::eyebrow Question 6 of 6
## Where leakage sneaks in
You standardize features and select the top predictors on the whole dataset, then run cross-validation. Why is the reported score too optimistic?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The scaling and selection already saw the test folds, so information leaked from test to train. ::ok Correct: fit scalers and pick features inside each fold, never on the full data first.
- Cross-validation always overstates accuracy by design. ::no Done correctly, CV gives an honest estimate; the leak is the problem here.
- Standardizing features is never allowed before modeling. ::no Standardizing is fine; doing it on the full data before CV is what leaks.
- Feature selection should use the target's future values. ::no Using future or test information is precisely the leak to avoid.

=== step === concept
::eyebrow Run it: one-hot encode a category
## From factor to columns
`model.matrix` turns a factor into indicator columns, one per level, without inventing any order. Run it on the built-in `iris` species.

```r
df <- data.frame(species = factor(c("setosa", "versicolor", "virginica", "setosa")))
model.matrix(~ species - 1, data = df)
```

Each row has a 1 in exactly one column. No level is treated as larger than another, which is the whole point for a nominal category.

=== step === concept
::eyebrow Run it: standardize a feature
## Putting features on the same scale
Standardizing rescales a column to mean 0 and standard deviation 1, so a distance-based model compares features fairly. Run it on `mtcars$hp`.

```r
z <- scale(mtcars$hp)
round(c(mean = mean(z), sd = sd(z)), 6)
head(round(z[, 1], 2))
```

The mean is 0 and the standard deviation is 1: horsepower now sits on the same scale as any other standardized feature.

=== step === complete
## Section complete
Nicely done. You can encode categories without inventing order, target-encode without leaking, scale and reshape numeric features, build interactions and splines, derive features from dates and text, impute missing values honestly, and select features while spotting leakage. Next: evaluating and tuning the models you feed these features to.
