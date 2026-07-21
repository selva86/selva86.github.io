---
title: "Classification Lesson 3: Discriminant Analysis, LDA and QDA"
catalog_blurb: "When to separate classes with a straight boundary and when to curve it."
description: "Learn LDA and QDA from scratch in R: model each class as a Gaussian cloud, and see why a shared covariance gives a straight boundary while a per-class one curves it."
keywords: "discriminant analysis, LDA, QDA, linear discriminant analysis, quadratic discriminant analysis, Gaussian classifier, decision boundary, covariance matrix, MASS lda qda, classification, R"
post_type: "LESSON"
curriculum_id: "6.30.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "3"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: "Decision-Trees-for-Classification.html"
course_prev: "Naive-Bayes-for-Tabular-and-Text.html"
---

=== step === cover
::eyebrow Lesson 3 of 6
## Discriminant Analysis, LDA and QDA

Lesson 1 classified by distance to neighbors. Lesson 2 reasoned with probabilities but pretended every feature was an independent clue. Discriminant analysis keeps the probability idea and drops that pretence: it lets features move together, models each class as a tilted cloud, and then draws an explicit line between the clouds.

Picture a cannery's sorting belt. A camera measures every passing fish twice: its **length** in centimeters, and its **lightness** on a 0 (dark) to 10 (pale) scale. Salmon run long and pale; sea bass run short and dark. Plotted, the two species form two overlapping clouds, and the machine needs one rule to split the belt: salmon to the left, sea bass to the right. This lesson draws that boundary, two different ways.

By the end of this lesson you will be able to:

- Model each class as a Gaussian cloud and label a new fish by which cloud most likely produced it
- Explain why LDA's shared-covariance assumption draws a straight boundary, and why QDA's per-class covariance lets it curve
- Choose between LDA and QDA, and run both in R

**Prerequisites:** you can run R and read its output, you know what a training set and a classifier are (the ML Workflow course), and Lessons 1 (kNN) and 2 (Naive Bayes). Mean, variance and correlation will be enough; the covariance matrix is defined as it appears.

::widget decision-region {"labels":{"c0":"salmon","c1":"sea bass"},"start":3}

The picture above is one boundary splitting the two clouds, with a dial that makes it more or less flexible. Discriminant analysis draws two specific kinds of boundary, a straight one and a curved one, and the rest of this lesson is about where each comes from and which to trust.

=== step === concept
::eyebrow The idea
## Model each class as a cloud

Naive Bayes already taught the move: to label a point, ask which class makes the evidence most likely, weighted by how common each class is. Discriminant analysis uses the very same rule, with one upgrade. Instead of treating length and lightness as separate, independent clues, it describes each species with a single 2D **bell-shaped cloud** that has a center and a spread, and crucially can be tilted, so that longer fish also tend to be paler.

Each lesson runs in a fresh R session, so we build a labeled catch right here: 120 salmon and 120 sea bass, each a point in the length-lightness plane. The two clouds are deliberately different shapes, which will matter in a moment.

```r
library(MASS)
set.seed(1)
n <- 120

# Salmon: a compact cloud, longer and paler; length and lightness rise together.
salmon <- mvrnorm(n, mu = c(70, 6.0), Sigma = matrix(c(25, 3.0, 3.0, 0.8), 2))

# Sea bass: shorter, darker, with a much wider and differently tilted spread.
bass   <- mvrnorm(n, mu = c(58, 4.2), Sigma = matrix(c(80, -2.0, -2.0, 0.5), 2))

fish <- data.frame(
  species   = factor(rep(c("salmon", "bass"), each = n)),
  length    = c(salmon[, 1], bass[, 1]),     # centimeters
  lightness = c(salmon[, 2], bass[, 2])      # 0 = dark, 10 = pale
)
table(fish$species)
#>
#>   bass salmon
#>    120    120
```

```r
library(ggplot2)
ggplot(fish, aes(length, lightness, color = species)) +
  geom_point(alpha = 0.7, size = 2) +
  scale_color_manual(values = c(bass = "#2563a8", salmon = "#b5631a")) +
  labs(title = "Two species, two clouds",
       x = "length (cm)", y = "lightness (0 = dark, 10 = pale)") +
  theme_minimal(base_size = 13)
```

Each cloud is a **multivariate Gaussian**: the 2D version of the familiar bell curve. It is described completely by two things. The **mean vector** \(\mu_k\) is the cloud's center, the average length and lightness of class \(k\). The **covariance matrix** \(\Sigma_k\) describes its shape: how wide it spreads along each feature, and whether the two features lean together (a tilt). Its full formula, for a point \(x\) with \(p\) features, is

\[ f_k(x) = \frac{1}{(2\pi)^{p/2}\,|\Sigma_k|^{1/2}}\,\exp\!\left(-\tfrac{1}{2}(x-\mu_k)^\top \Sigma_k^{-1}(x-\mu_k)\right) \]

where \(x\) is the feature vector (here length and lightness, so \(p = 2\)), \(\mu_k\) is the class center, \(\Sigma_k\) the class covariance, \(|\Sigma_k|\) its determinant, \(\Sigma_k^{-1}\) its inverse, and \(\top\) means transpose. You will never compute this by hand. All it says is: a point scores high under class \(k\) when it sits near that class's center, measured in a way that accounts for the cloud's spread and tilt.

=== step === concept
::eyebrow The rule
## Which cloud most likely made this fish?

To classify a new fish at feature point \(x\), we want the class with the highest posterior probability \(P(y = k \mid x)\). Bayes' rule, exactly as in Lesson 2, turns that into two pieces we can estimate from the training catch:

\[ P(y = k \mid x) \;\propto\; \pi_k \, f_k(x) \]

Here \(\pi_k\) is the **prior**, class \(k\)'s share of the training data (here \(120/240 = 0.5\) each), and \(f_k(x)\) is the Gaussian density from the last step, the **likelihood**: how typical this fish is for class \(k\). Multiply them and pick the class with the larger product.

Products of exponentials are awkward, so we take logarithms (which never change which value is largest) and throw away any term that is identical for every class. What survives is the **discriminant function** \(\delta_k(x)\):

\[ \delta_k(x) = -\tfrac{1}{2}\log|\Sigma_k| - \tfrac{1}{2}(x-\mu_k)^\top \Sigma_k^{-1}(x-\mu_k) + \log \pi_k \]

The whole classifier is one sentence: **compute \(\delta_k(x)\) for each class and assign \(x\) to the largest.**

[KEY INSIGHT]
The boundary between two classes is exactly the set of points where their discriminants tie, \(\delta_k(x) = \delta_j(x)\). The shape of that boundary, straight or curved, is decided entirely by one choice: do the classes share a covariance matrix, or each keep their own? That single choice is the difference between LDA and QDA.

=== step === concept
::eyebrow The linear case
## LDA: one shared covariance, a straight line

Linear Discriminant Analysis makes a simplifying bet: **every class has the same covariance matrix**, \(\Sigma_k = \Sigma\) for all \(k\). The clouds may sit in different places, but they are assumed to share one spread and tilt. Salmon and sea bass become two identical-shaped clouds at different centers.

Watch what that does to the discriminant. Expand the squared term \((x-\mu_k)^\top \Sigma^{-1}(x-\mu_k)\) and the leading piece is \(x^\top \Sigma^{-1} x\). Because \(\Sigma\) is now the same for every class, that piece is **identical across classes**, so it cancels when you compare two discriminants. The \(\log|\Sigma|\) term cancels too. All that is left is linear in \(x\):

\[ \delta_k(x) = x^\top \Sigma^{-1}\mu_k - \tfrac{1}{2}\mu_k^\top \Sigma^{-1}\mu_k + \log\pi_k \]

There is no \(x^2\) anywhere. A boundary where two linear functions tie is a **straight line** (a flat plane in higher dimensions). In R, `MASS::lda` fits it; pooling both species into one shared \(\Sigma\) and starting from each class mean:

```r
library(MASS)
lda_fit <- lda(species ~ length + lightness, data = fish)
round(lda_fit$means, 1)        # each class center, the mu_k
#>        length lightness
#> bass     57.2       4.3
#> salmon   69.4       6.0
```

To see the boundary, classify every point on a fine grid over the plane and color the regions. The line where the colors meet is LDA's decision boundary.

```r
library(ggplot2)
gx   <- seq(min(fish$length),    max(fish$length),    length.out = 120)
gy   <- seq(min(fish$lightness), max(fish$lightness), length.out = 120)
grid <- expand.grid(length = gx, lightness = gy)
grid$lda <- predict(lda_fit, grid)$class      # LDA's label for every grid point

ggplot(fish, aes(length, lightness)) +
  geom_tile(data = grid, aes(fill = lda), alpha = 0.25) +
  geom_point(aes(color = species), size = 2) +
  scale_fill_manual(values = c(bass = "#2563a8", salmon = "#b5631a")) +
  scale_color_manual(values = c(bass = "#2563a8", salmon = "#b5631a")) +
  labs(title = "LDA draws a single straight-line boundary",
       x = "length (cm)", y = "lightness") +
  theme_minimal(base_size = 13)
```

The boundary is a perfectly straight line. Simple, stable, and easy to trust, but it pays no attention to the fact that our two clouds are clearly different shapes.

=== step === concept
::eyebrow The quadratic case
## QDA: each class keeps its own covariance, a curve

Quadratic Discriminant Analysis drops the shared bet. It lets **each class estimate its own covariance** \(\Sigma_k\), so a tight round salmon cloud and a wide tilted sea-bass cloud are modeled as the different shapes they are. Now the \(x^\top \Sigma_k^{-1} x\) term differs from class to class, so it **does not cancel**. The discriminant keeps its squared term, stays quadratic in \(x\), and the boundary where two of them tie becomes a **curve** (a conic: a parabola, ellipse or hyperbola).

`MASS::qda` fits it with the same formula interface. We reuse the grid and color QDA's regions:

```r
qda_fit  <- qda(species ~ length + lightness, data = fish)
grid$qda <- predict(qda_fit, grid)$class      # QDA's label for every grid point

ggplot(fish, aes(length, lightness)) +
  geom_tile(data = grid, aes(fill = qda), alpha = 0.25) +
  geom_point(aes(color = species), size = 2) +
  scale_fill_manual(values = c(bass = "#2563a8", salmon = "#b5631a")) +
  scale_color_manual(values = c(bass = "#2563a8", salmon = "#b5631a")) +
  labs(title = "QDA bends the boundary to each cloud",
       x = "length (cm)", y = "lightness") +
  theme_minimal(base_size = 13)
```

The boundary now curves, wrapping the wide sea-bass cloud. On this training catch, where the two shapes genuinely differ, the extra flexibility pays off:

```r
lda_acc <- mean(predict(lda_fit, fish)$class == fish$species)
qda_acc <- mean(predict(qda_fit, fish)$class == fish$species)
c(LDA = round(lda_acc, 3), QDA = round(qda_acc, 3))
#>   LDA   QDA
#> 0.904 0.938
```

QDA classifies about 94% of the training fish correctly to LDA's 90%, because the true clouds really do have different shapes and a straight line cannot honor both. Hold that result lightly though: this is accuracy on the same data the models learned from, and a more flexible model always flatters itself there. The honest test comes from held-out data, which is exactly why this trade-off needs a closer look.

=== step === quiz
::eyebrow Check yourself
## Why is the LDA boundary straight?

You just saw LDA produce a perfectly straight boundary and QDA a curved one, on the very same fish. What is it about LDA that forces its boundary to be a straight line?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The salmon and sea bass happen to be linearly separable, so a straight line is enough ::no The data is not even separable here (the clouds overlap, and LDA misclassifies about 10%). LDA would draw a straight line whether or not the classes could be split cleanly; straightness comes from the model, not the data.
- LDA assumes all classes share one covariance matrix, so the squared term in the discriminant is identical for every class and cancels, leaving a function that is linear in x ::ok Exactly. The shared covariance is what kills the quadratic term. With nothing but linear terms left, the tie between two classes is a straight line, no matter how the points are arranged.
- LDA uses a linear kernel, the way a linear support vector machine does ::no LDA has no kernel. Its boundary is linear because the shared-covariance assumption cancels the quadratic part of the Gaussian discriminant, a different mechanism entirely from kernel methods.

=== step === concept
::eyebrow The trade-off
## More flexible is not always better

QDA won on the training catch, so why ever use LDA? Because flexibility has a price, and it is paid in data. A covariance matrix for \(p\) features holds \(p(p+1)/2\) free numbers. LDA estimates **one** such matrix for all classes. QDA estimates **one per class**, so for \(K\) classes it must pin down \(K \cdot p(p+1)/2\) of them. With many features or few examples per class, QDA is estimating a great many wobbly numbers from thin data, and its curved boundary starts chasing noise: low bias, high variance. LDA, pooling everything into a single steadier estimate, is the opposite: a touch of bias for a lot of stability.

This is the same bias-variance tension from the ML Workflow course. The dial below is a different model, but the lesson is identical: a more flexible boundary tracks the training points more tightly (training accuracy climbs) while its accuracy on held-out points can peak and then fall. Drag it and watch.

::widget decision-region {"labels":{"c0":"salmon","c1":"sea bass"}}

A practical rule of thumb:

| Prefer LDA when... | Prefer QDA when... |
|---|---|
| Few training points, or many features | Plenty of data per class |
| Classes look like the same shape, just shifted | Classes clearly have different spreads or tilts |
| You want a stable, low-variance boundary | The boundary genuinely needs to curve |

When you cannot tell, fit both and compare them honestly on held-out data or by cross-validation, the resampling tools you meet later in this track.

=== step === concept
::eyebrow The family
## Where LDA and QDA sit

Three of the four classifiers in this course are now secretly the same machine, a Gaussian per class plus Bayes' rule, differing only in what they assume about the covariance. That assumption is the whole story:

| Method | Features may correlate? | Covariance | Boundary |
|---|---|---|---|
| Gaussian Naive Bayes | No (forced independent) | diagonal, per class | curved |
| LDA | Yes | one full matrix, shared | straight |
| QDA | Yes | full matrix, per class | curved |
| Logistic regression | (models the boundary itself) | none assumed | straight |

Read down the covariance column and you can see the dial turning. Gaussian Naive Bayes from Lesson 2 is the most restrictive: it forces every covariance matrix to be **diagonal**, which is just the mathematical way of saying "assume the features do not correlate." LDA relaxes that, allowing a full covariance with real off-diagonal correlations, but still shares one across all classes. QDA relaxes it further, a full covariance for every class. Logistic regression sits apart: it shares LDA's straight boundary but reaches it without assuming Gaussian clouds at all, modeling the boundary directly instead of the classes (a **discriminative** rather than a **generative** model).

[NOTE]
This is why LDA and logistic regression so often agree: both draw a straight boundary. LDA tends to win when the Gaussian assumption truly holds and the classes are well separated; logistic regression is safer when it does not, since it makes no claim about the shape of the clouds.

=== step === tryit
::eyebrow Your turn
## Fit LDA and QDA in R

Time to drive it yourself. First rebuild the catch (a fresh session starts empty), then fit a quadratic discriminant model and score it. The whole classifier is `qda(formula, data)`, predict, compare to the truth. Fill in the function that fits the **quadratic** model.

```r
library(MASS)
set.seed(1)
n <- 120
salmon <- mvrnorm(n, mu = c(70, 6.0), Sigma = matrix(c(25, 3.0, 3.0, 0.8), 2))
bass   <- mvrnorm(n, mu = c(58, 4.2), Sigma = matrix(c(80, -2.0, -2.0, 0.5), 2))
fish <- data.frame(
  species   = factor(rep(c("salmon", "bass"), each = n)),
  length    = c(salmon[, 1], bass[, 1]),
  lightness = c(salmon[, 2], bass[, 2])
)
```

```r
fit  <- ____(species ~ length + lightness, data = fish)   # quadratic discriminant analysis
pred <- predict(fit, fish)$class
table(predicted = pred, actual = fish$species)            # the confusion matrix
mean(pred == fish$species)                                # training accuracy
```
::check {"regex":"qda","gate":true,"difficulty":"beginner","ok":"That is the whole model. qda() fits a separate covariance per class; predict() then labels each fish, and the confusion matrix shows it misreads 5 bass and 10 salmon, for 94% training accuracy.","no":"You want the QUADRATIC model: qda(species ~ length + lightness, data = fish). (lda() would fit the linear one.)"}
::solution
```r
fit  <- qda(species ~ length + lightness, data = fish)
pred <- predict(fit, fish)$class
table(predicted = pred, actual = fish$species)
#>          actual
#> predicted bass salmon
#>    bass    115     10
#>    salmon    5    110
mean(pred == fish$species)
#> [1] 0.9375
```

=== step === quiz
::eyebrow Check yourself
## LDA or QDA here?

A colleague hands you a two-class problem with **8 features** and only about **30 training rows in the smaller class**. They want maximum accuracy and reach for QDA, "since it is the more flexible model." What is the better call, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Use LDA: QDA would have to estimate a full covariance per class, 8 times 9 over 2 = 36 numbers, from only ~30 rows, so its estimate is unstable and the curved boundary overfits ::ok Right. QDA needs more parameters than that class has data points, so its per-class covariance is poorly estimated (even singular). LDA pools both classes into one steadier covariance and will almost certainly generalize better here.
- Use QDA: a more flexible model is always at least as accurate as a simpler one ::no More flexible raises accuracy on the training data but not on new data. With far more parameters than examples, QDA chases noise and generalizes worse. This is the bias-variance trade biting in the high-variance direction.
- Use neither: with 8 features you must abandon discriminant analysis and switch to kNN ::no Discriminant analysis is fine in 8 dimensions; the issue is only QDA's parameter count versus this sample size. LDA handles it comfortably, and kNN would struggle more as dimensions grow (Lesson 1).

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the gentlest rigorous treatment of LDA and QDA, with the Bayes-rule derivation and R labs.
- [The Elements of Statistical Learning, ch. 4.3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - linear and quadratic discriminant analysis with the full covariance math.
- [Fisher (1936), "The Use of Multiple Measurements in Taxonomic Problems"](https://doi.org/10.1111/j.1469-1809.1936.tb02137.x) - the original paper that introduced the linear discriminant.
- [R documentation: MASS::lda and qda](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/lda.html) - the functions you fitted here, with their assumptions and options.

=== step === complete
## Lesson 3 complete

You can now classify with discriminant analysis. Model each class as a Gaussian cloud, score a new point by which cloud most likely produced it (prior times density), and the boundary falls out of one assumption: share a single covariance and it is a **straight line** (LDA), give each class its own and it **curves** (QDA). You saw QDA fit two differently-shaped clouds better on the training data, learned why its flexibility costs you in parameters and can overfit small samples, placed both alongside Naive Bayes (diagonal covariance) and logistic regression (linear but discriminative), and fitted `lda()` and `qda()` in R.

Next, Lesson 4: Decision Trees for Classification. Instead of one smooth Gaussian boundary, a tree carves the feature space into rectangles with a sequence of yes/no splits, a completely different shape of decision rule, and the building block of the powerful ensembles that close out this track.
