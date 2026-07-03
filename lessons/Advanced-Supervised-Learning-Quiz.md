---
title: "Advanced Supervised Learning: Quiz"
description: "A graded check on the advanced supervised section: SVMs and kernels, regularized discriminant analysis, Gaussian processes, stacking, Bayesian optimization, approximate nearest neighbors, and honest tuning."
keywords: "R quiz, support vector machine, kernel trick, RDA, gaussian process, stacking, bayesian optimization, approximate nearest neighbors, winner's curse, ds-advanced-supervised"
post_type: "LESSON"
curriculum_id: "6.140.9"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "9"
course_total: "9"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
lesson_kind: "quiz"
course_prev: "A-Tuned-Stacked-Model-End-to-End.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have worked through the sharp end of supervised learning: maximum-margin classifiers and the kernel trick, regularized discriminant analysis, Gaussian processes that predict with honest uncertainty, stacking several models into a Super Learner, Bayesian optimization for expensive tuning, approximate nearest neighbors at scale, and the discipline that ties it together, tuning and evaluating one pipeline without fooling yourself. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## The maximum margin
Two clean classes can be separated by many different straight lines, all with zero training errors. Why does a support vector machine choose the one with the widest margin?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A wider margin leaves the most room for a new point to vary before it crosses the boundary, so it tends to generalize better. ::ok Correct: equal training accuracy cannot separate the candidates, but the widest-margin boundary is the most robust to unseen points that drift toward it.
- The widest-margin line always passes exactly through the mean of each class. ::no It is set by the closest points of each class (the support vectors), not by the class means.
- A wide margin guarantees zero test error. ::no Nothing guarantees zero test error; the wide margin improves expected generalization, it does not promise perfection.
- The margin width has no effect on generalization; SVMs pick it for speed. ::no The margin is precisely the quantity that distinguishes otherwise-equal boundaries on new data.

=== step === quiz
::eyebrow Question 2 of 10
## What the kernel trick buys
A class sits in a blob completely surrounded by another class, so no straight line can separate them at any cost `C`. How does an RBF kernel SVM succeed?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It raises `C` until the straight boundary bends around the inner blob. ::no `C` only trades margin width against violations; a linear boundary stays straight at every `C`.
- It implicitly lifts the points into a higher-dimensional space where a flat boundary separates them, using only dot products (the kernel), which appears as a curved boundary back in 2-D. ::ok Correct: the kernel computes similarities in a lifted space without ever building the coordinates, so the flat separator there is a closed curve here.
- It deletes the surrounded points as outliers before fitting. ::no No points are deleted; the boundary is genuinely curved via the kernel.
- It switches from classification to clustering. ::no It stays a supervised classifier; only the boundary shape changes.

=== step === quiz
::eyebrow Question 3 of 10
## C versus gamma
In an RBF SVM, you push `gamma` very high and training error drops to zero while test error climbs and almost every point becomes a support vector. What happened?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Large gamma shrank each point's reach to a tiny bubble, so the boundary broke into islands memorizing individual points: overfitting. ::ok Correct: zero training error with rising test error and nearly every point a support vector is the textbook high-variance signature; lower gamma via cross-validation.
- Large gamma widened each point's influence, giving an over-smooth boundary that underfits. ::no That is a small gamma; the zero training error rules out underfitting.
- The model needs an even larger gamma to bring test error down. ::no Higher gamma worsens this; the cure is a smaller gamma.
- Nothing is wrong: zero training error means the model is finished. ::no Zero training error with high test error is overfitting, not success.

=== step === quiz
::eyebrow Question 4 of 10
## Regularized discriminant analysis
RDA blends each class's own covariance toward the pooled covariance by a fraction lambda. A colleague says RDA can only ever tie whichever of LDA or QDA is better. Are they right?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Yes: RDA interpolates the covariance, so its accuracy must lie between the LDA and QDA accuracies. ::no Interpolating the covariance does not interpolate the accuracy; a blend of two poor estimates can be a better estimate.
- No: an intermediate lambda produces a genuinely different (steadier-than-QDA, more-flexible-than-LDA) covariance, so it can beat both endpoints. ::ok Correct: that is exactly why cross-validated accuracy often peaks in the interior, at a lambda that is neither pure LDA nor pure QDA.
- Yes, because leave-one-out cross-validation always favours the simpler model. ::no LOO does not always favour the simpler model; here LDA can be the worst of the three.
- No, but only because QDA is always the best base to start from. ::no QDA is not always best; on thin data its per-class covariance is unstable, which is the whole reason to blend.

=== step === quiz
::eyebrow Question 5 of 10
## Reading a Gaussian process band
A GP is fit to six points. At an input right next to a training point its predictive sd is small; in a wide gap between points the sd is several times larger. Why?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Conditioning on the data collapses the spread near observations (every surviving curve must pass close to them) but leaves it wide in gaps, so the band pinches at data and flares where there is none. ::ok Correct: the posterior is the set of prior curves consistent with the data; near a point they barely disagree, in a gap the kernel lets them fan out.
- The GP memorizes training points like 1-nearest-neighbour, so its sd is exactly zero at data and constant elsewhere. ::no The sd at a point is small but nonzero (the noise term), and it varies smoothly, not in steps.
- The band is a fixed-width ribbon that only looks narrower near points. ::no The width is computed pointwise from the kernel and genuinely varies across the input range.
- A larger lengthscale would remove the flaring entirely and make the band honest. ::no An over-long lengthscale makes the band collapse in gaps, manufacturing false confidence, the opposite of honest.

=== step === quiz
::eyebrow Question 6 of 10
## Why stacking needs out-of-fold predictions
To learn how much to trust each base model, why must the meta-learner be trained on out-of-fold predictions rather than the base models' predictions on their own training rows?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Because out-of-fold predictions are faster to compute than in-sample ones. ::no They are more expensive (a full cross-validation), not faster; speed is not the reason.
- Because in-sample predictions violate a package requirement, not a statistical one. ::no It is a statistical problem: the issue is leakage, not any API rule.
- Because a model's in-sample predictions are flattering (it has partly memorized those rows), so a meta-learner trusts a memorizer too much; out-of-fold predictions show each model as the future will see it. ::ok Correct: that is the leakage trap. On in-sample columns a deep tree looks far better than it is, so the learned weights are wrong; out-of-fold columns are the honest textbook.
- Because out-of-fold predictions make every base model equally accurate, simplifying the blend. ::no They do not equalize accuracy; they reveal each model's honest, differing accuracy.

=== step === quiz
::eyebrow Question 7 of 10
## Expected Improvement
In Bayesian optimization, Expected Improvement is highest at a setting whose surrogate mean is below the best score so far but whose uncertainty band is wide. Why would the search evaluate there instead of next to its current best?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- A wide band means the true value could plausibly land well above the incumbent, so the expected gain from probing there is real, while re-measuring near-certainty around the best offers almost none. ::ok Correct: EI prices the chance of beating the incumbent (exploitation) plus a bonus for uncertainty (exploration); a confident, mediocre region scores low even if its mean is high.
- Because EI always picks the point with the lowest surrogate mean. ::no EI is not driven by low mean; it balances predicted improvement against uncertainty.
- Because the surrogate is broken wherever the band is wide. ::no A wide band is honest ignorance, not a defect; it is exactly where new information is most valuable.
- Because re-evaluating the current best is forbidden. ::no It is allowed; it just yields little expected improvement, which is why EI looks elsewhere.

=== step === quiz
::eyebrow Question 8 of 10
## The cost of approximate search
Exact nearest-neighbor search over a 4-million-track catalog is too slow, so you switch to an HNSW index. Your nightly audit reports recall@10 = 0.86 against a target of 0.95. What should you try FIRST?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Rebuild the index with a larger M (more links per node). ::no This raises recall but costs a full, hours-long rebuild and redeploy; it is the second move, after the free knob.
- Raise `ef` at query time: no rebuild, effective immediately, each query simply measures a few hundred more candidates. ::ok Correct: `ef` is the runtime dial on the recall-versus-cost frontier; widen it, recheck the nightly recall, and only rebuild (bigger M) if the frontier itself is too low.
- Raise `k` to 30 and keep the best 10. ::no `k` changes how many results you keep, not how thoroughly the graph is searched; the missing tracks were never found.
- Switch back to exact search until recall hits 1.0. ::no Exact search is the unaffordable option that motivated the index; the target is 0.95, reachable by widening `ef`.

=== step === quiz
::eyebrow Question 9 of 10
## The winner's curse
You score 200 random hyperparameter settings on one small validation slice and keep the best. Its validation RMSE is the lowest number you have seen all project. Why is that number an unreliable estimate of the chosen model's true error?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The minimum of many noisy scores is biased downward: with enough candidates the search finds the luckiest downward noise, not the best model, so the winning score flatters and the choice itself can be wrong. ::ok Correct: that is the winner's curse. More candidates make the reported best prettier and, past a point, the shipped model worse; a cleaner yardstick (k-fold CV) or a sealed test set is the fix.
- The number is reliable as long as the 200 settings were drawn at random. ::no Random sampling does not remove selection bias; taking the minimum over many noisy scores is what biases it.
- It is unreliable only because 200 is too few; 2000 candidates would give an honest minimum. ::no More candidates make it worse, not better: the minimum digs deeper into the slice's noise.
- The bias disappears if you report the mean of the 200 scores instead. ::no The mean answers a different question; the issue is that the selected best is optimistic, and only an unoptimized yardstick fixes that.

=== step === quiz
::eyebrow Question 10 of 10
## Which number do you promise?
You tuned models with 5-fold CV, stacked them on out-of-fold columns, and finally scored the whole pipeline once on a sealed test set. Your manager wants the single "typical miss" number for planning. Which do you quote, and what happens to it?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- The best CV score from tuning: it is cross-validated and uses all the training data. ::no It is the smallest of many candidate scores (a mild winner's curse) and it was used to CHOOSE the dials, so it is spent by that choice.
- The blend's score on its own out-of-fold columns: it scores the whole stack, not one member. ::no Those columns are exactly what the trust weights were optimized against, so it is an in-sample score one level up.
- The sealed-test score, and the envelope is now spent: any future promise needs data this pipeline has never influenced. ::ok Correct: it is the only number no decision was optimized against. Quoting it retires it; re-using those test rows to guide anything turns them into just another validation slice.
- The sealed-test score, re-opening the envelope after each future tweak to keep it current. ::no Re-opening it to guide changes starts the same slide as tuning on a slice; new promises need new data or nested cross-validation.

=== step === concept
::eyebrow Run it: the kernel trick
## A curve where a line cannot go
Fit a linear SVM and an RBF SVM to a class blob wrapped inside a ring, and compare their training error.

```r
library(e1071)
set.seed(1)
ang <- runif(120, 0, 2 * pi)
rad <- c(runif(50, 0, 1), 2 + runif(70, 0, 1))     # inner blob + outer ring
d <- data.frame(x = rad * cos(ang), y = rad * sin(ang),
                cls = factor(c(rep("in", 50), rep("out", 70))))
err <- function(k) mean(predict(svm(cls ~ x + y, d, kernel = k)) != d$cls)
round(c(linear = err("linear"), radial = err("radial")), 3)
```

The linear kernel misclassifies about 42% (no straight line can wrap the blob); the RBF kernel drives training error to zero by bending the boundary into a closed curve.

=== step === concept
::eyebrow Run it: the winner's curse
## The minimum of noisy scores flatters
Every candidate here is equally good (true RMSE 1.30). Watch the best-reported score sink below the truth as you try more candidates, pure selection bias, no real improvement.

```r
set.seed(1)
best_reported <- sapply(c(1, 5, 20, 100), function(J)
  mean(replicate(2000, min(1.30 + rnorm(J, 0, 0.12)))))   # avg best-of-J noisy scores
round(setNames(best_reported, paste0("J=", c(1, 5, 20, 100))), 3)
```

At J = 1 the reported score is honest (about 1.30); by J = 100 it has fallen to about 1.00, a third of a unit of pure flattery, which is why a score used to choose can never be the score you promise.

=== step === complete
## Section complete
Strong work. You can separate classes with the widest margin and bend the boundary with a kernel, steady a discriminant on thin data with RDA, predict with honest uncertainty using a Gaussian process, blend models into a stack that beats each alone, tune expensive models in a handful of evaluations with Bayesian optimization, search millions of vectors with an approximate index, and, above all, tune and evaluate one pipeline without letting any score flatter you. That is the modern supervised toolkit, used honestly.
