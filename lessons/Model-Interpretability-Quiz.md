---
title: "Model Interpretability in R: Quiz"
description: "A short, graded check on the interpretability section: global versus local explanations, permutation and drop-column importance, SHAP values, partial dependence and ICE, fairness basics, and documenting a model."
keywords: "R quiz, model interpretability, global local explanations, permutation importance, SHAP, partial dependence, ICE, fairness, model cards, ds-interpretability"
post_type: "LESSON"
curriculum_id: "6.110.7"
webr: true
lesson_access: "pro"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Interpretability-Course.html"
lesson_kind: "quiz"
course_prev: "Model-Cards-and-Documenting-a-Model.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have learned to separate global from local explanations, measure feature importance with permutation and drop-column methods, split a prediction into fair SHAP contributions, read partial-dependence and ICE curves, check a model for group fairness, and document it in a model card. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## Global versus local
The difference between a global and a local explanation is that:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Global uses more data than local. ::no Both can use the whole dataset; the difference is what they explain.
- Global describes the model's overall behavior; local explains one specific prediction. ::ok Correct: global says what the model learned in general, local says why this row got its score.
- Local explanations are always more accurate. ::no Neither is inherently more accurate; they answer different questions.
- Global only works for linear models. ::no Global methods apply to any model.

=== step === quiz
::eyebrow Question 2 of 6
## Where permutation importance misleads
Permutation importance can be misleading when features are:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Measured in different units. ::no It compares the drop in performance, so units are not the core issue.
- Perfectly independent. ::no Independence is the case where permutation importance behaves well.
- Strongly correlated, so shuffling one is covered by its correlated partner and its importance looks small. ::ok Correct: correlated features share information, so each looks less important than it is.
- All numeric. ::no Numeric features are fine; correlation is the trap.

=== step === quiz
::eyebrow Question 3 of 6
## What SHAP guarantees
A defining property of SHAP values for a single prediction is that they:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Sum to the difference between this prediction and the average prediction. ::ok Correct: SHAP fairly splits that gap into signed per-feature contributions that add up exactly.
- Are always positive. ::no A feature can push a prediction down, giving a negative contribution.
- Rank features the same as permutation importance always. ::no They often agree, but not by guarantee.
- Ignore feature interactions. ::no SHAP accounts for a feature's effect across coalitions, including interactions.

=== step === quiz
::eyebrow Question 4 of 6
## PDP versus ICE
A partial-dependence plot can hide something an ICE plot reveals, namely:
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- The average effect of a feature. ::no The average effect is exactly what a PDP shows.
- That the effect differs across individuals (an interaction), which averaging flattens out. ::ok Correct: ICE draws one line per row, exposing heterogeneity a single averaged curve conceals.
- The names of the features. ::no Both plots label the feature the same way.
- The model's accuracy. ::no Neither plot reports accuracy.

=== step === quiz
::eyebrow Question 5 of 6
## A fairness reality
A key lesson from fairness metrics is that:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Equal overall accuracy guarantees the model is fair to every group. ::no Aggregate accuracy can hide large per-group disparities.
- Removing the sensitive attribute from the features makes the model fair. ::no Proxies in other features can still encode it.
- You usually cannot satisfy every fairness definition at once, so you must choose which matters. ::ok Correct: definitions like demographic parity and equalized odds can conflict mathematically.
- Fairness is only about the training data size. ::no Data size is not what fairness definitions address.

=== step === quiz
::eyebrow Question 6 of 6
## The point of a model card
A model card exists mainly to:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Document the model's intended use, training data, metrics and known limitations. ::ok Correct: it tells future users where the model is safe to apply and where it is not.
- Improve the model's accuracy. ::no Documentation does not change performance.
- Replace the need for evaluation. ::no A card reports evaluation; it does not replace it.
- Hide how the model works from users. ::no Its purpose is transparency, the opposite of hiding.

=== step === concept
::eyebrow Run it: permutation importance by hand
## Shuffle a feature, measure the damage
Fit a model, then shuffle one predictor and see how much the error grows. A feature that matters hurts the model when scrambled.

```r
set.seed(1)
fit <- lm(mpg ~ wt + hp, data = mtcars)
base_rmse <- sqrt(mean(resid(fit)^2))
shuffled <- mtcars
shuffled$wt <- sample(shuffled$wt)                 # break wt's link to mpg
perm_rmse <- sqrt(mean((mtcars$mpg - predict(fit, shuffled))^2))
round(c(base = base_rmse, permuted_wt = perm_rmse), 3)
```

Scrambling weight sends the error up sharply, which is exactly the signal permutation importance reads: the bigger the jump, the more the model relied on that feature.

=== step === concept
::eyebrow Run it: the shape of an effect
## A partial-dependence sweep
Hold everything else fixed, vary one feature across a grid, and read how the model's average prediction moves. This is the idea behind a partial-dependence plot.

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
grid <- data.frame(wt = seq(2, 5, by = 1), hp = mean(mtcars$hp))
data.frame(wt = grid$wt, predicted_mpg = round(predict(fit, grid), 1))
```

As weight rises from 2 to 5, predicted mpg falls steadily: the sweep traces the shape of weight's effect on the prediction.

=== step === complete
## Section complete
Well done. You can separate global from local explanations, measure importance with permutation and drop-column methods, read SHAP contributions, interpret partial-dependence and ICE curves, check group fairness, and document a model honestly. Next: getting models into production.
