---
title: "Classification Lesson 5: Decision Boundaries and Model Geometry"
catalog_blurb: "Why every classifier is really a boundary, and what its shape tells you."
description: "Every classifier draws a boundary in feature space. See why some are straight and some curve, what generative vs discriminative means, and how shape drives fit."
keywords: "decision boundary, model geometry, linear vs nonlinear classifier, generative vs discriminative, logistic regression, LDA, QDA, kNN, decision tree, feature space, classification, R"
post_type: "LESSON"
curriculum_id: "6.30.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "5"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: "Reading-a-Classifier.html"
course_prev: "Decision-Trees-for-Classification.html"
---

=== step === cover
::eyebrow Lesson 5 of 6
## Decision Boundaries and Model Geometry

A botanist sets one iris flower on your desk. Its petal is 4.8 cm long and 1.7 cm wide. Versicolor, or virginica? By now you have met a handful of machines that could answer: nearest neighbours (Lesson 1), Naive Bayes (Lesson 2), LDA and QDA (Lesson 3), a decision tree (Lesson 4), plus logistic regression from the Regression course. Six classifiers, six different sets of math.

This lesson reveals that under the surface they are all doing the **same geometric thing**: drawing a line through a plane of flowers, with everything on one side called versicolor and everything on the other called virginica.

By the end you will be able to:

- See any classifier as a **decision boundary** that carves feature space into regions
- Tell a **linear** boundary from a **nonlinear** one, and name which models draw each
- Place every model on one map by two questions: what **shape** is its boundary, and does it work **generatively or discriminatively**
- Read a boundary's shape as the model's assumptions, and reshape a hopeless problem by changing the space

**Prerequisites:** you can run R and read its output; you have met kNN, Naive Bayes, LDA/QDA and decision trees (Lessons 1 to 4) and logistic regression; and you know bias from variance (the ML Workflow course).

::widget decision-region {"labels":{"c0":"versicolor","c1":"virginica"},"start":3}

The picture above is a real classifier, fit live, separating two overlapping groups the way our two iris species overlap in petal size. The dial makes its boundary more or less flexible. Where that boundary comes from, and what its shape means, is the whole lesson.

=== step === concept
::eyebrow The one idea
## Every classifier draws a boundary

Put both iris species on a plane: petal length runs across, petal width runs up, and every flower is one point. Versicolor flowers cluster low and to the left (shorter, narrower petals); virginica cluster up and to the right.

A classifier's whole job is to split this plane into two **decision regions**: a patch it calls versicolor and a patch it calls virginica. The dividing line between those patches, the set of points where the model is perfectly torn (a 50/50 vote), is its **decision boundary**. Predict a new flower by seeing which region its point lands in. Different models split the plane differently, but every one of them splits it somehow.

```r
# Two iris species that overlap a little: versicolor and virginica.
# Each flower is ONE point in a 2-D plane: petal length across, petal width up.
flowers <- subset(iris, Species != "setosa")
flowers$Species <- droplevels(flowers$Species)
flowers <- flowers[, c("Petal.Length", "Petal.Width", "Species")]
table(flowers$Species)
#>
#> versicolor  virginica
#>         50         50
```

```r
library(ggplot2)
ggplot(flowers, aes(Petal.Length, Petal.Width, colour = Species)) +
  geom_point(size = 2) +
  labs(x = "petal length (cm)", y = "petal width (cm)")
```

Two clouds, slightly overlapping. The question for the rest of the lesson is simply: where, and in what shape, should we draw the line between them?

=== step === concept
::eyebrow The simplest shape
## Linear boundaries: a straight cut

The simplest boundary is a straight line. **Logistic regression** and **LDA** can only ever draw this shape: a single straight cut across the plane (a flat plane in higher dimensions). Models whose boundary is a straight line are called **linear classifiers**.

Why a straight line? Logistic regression scores a flower with a weighted sum of its features, \(z = \beta_0 + \beta_1 x_1 + \beta_2 x_2\), where \(x_1\) is petal length, \(x_2\) is petal width, and the \(\beta\) values are weights it learns. It calls the flower virginica when \(z > 0\) and versicolor when \(z < 0\). The boundary is the exact tie, \(z = 0\):

\[ \beta_0 + \beta_1 x_1 + \beta_2 x_2 = 0 \]

That is the equation of a straight line. Solve it for \(x_2\) and you get \(x_2 = -(\beta_0 + \beta_1 x_1)/\beta_2\), a line with a fixed slope and intercept. Fit it and draw it:

```r
# Logistic regression: model the chance a flower is virginica from its petals.
fit <- glm(Species ~ Petal.Length + Petal.Width,
           data = flowers, family = binomial)
round(coef(fit), 2)
#> (Intercept) Petal.Length  Petal.Width
#>      -45.27         5.75        10.45
```

```r
b <- coef(fit)
# The boundary is the straight line where the model is exactly 50/50:
#   b0 + b1*length + b2*width = 0  ->  width = -(b0 + b1*length) / b2
ggplot(flowers, aes(Petal.Length, Petal.Width, colour = Species)) +
  geom_point(size = 2) +
  geom_abline(intercept = -b[1] / b[3], slope = -b[2] / b[3], linewidth = 1) +
  labs(x = "petal length (cm)", y = "petal width (cm)")
```

One straight line, tilted to follow the gap between the clouds. It misreads a few flowers in the overlap, and it always will: a straight line is a strong, rigid commitment. That rigidity is not a bug, it is the model's whole personality, as the next step makes clear.

=== step === widget
::eyebrow Letting the line bend
## Nonlinear boundaries

A **decision tree** and **k-nearest-neighbours** are not stuck with a straight line. They draw **nonlinear** boundaries: shapes that bend, branch, and wrap around the data. A tree carves the plane into axis-aligned rectangles (a staircase of yes/no splits); kNN lets the boundary wiggle around individual points.

Drag the dial below. At the low end the boundary is nearly straight, a gentle cut. Crank it up and watch it fracture into little islands chasing individual points: the training accuracy climbs toward 100% while the test accuracy (the hollow points it never trained on) peaks and then sags. That is the price of flexibility.

::widget decision-region {"labels":{"c0":"versicolor","c1":"virginica"}}

Each model has a signature shape:

| Model | Boundary it draws |
|---|---|
| Logistic regression, LDA, linear SVM | a straight line (or flat plane) |
| QDA, Gaussian Naive Bayes | a smooth curve |
| Decision tree | axis-aligned rectangles, a staircase |
| k-nearest-neighbours | a local, wiggly line that hugs the data |

[KEY INSIGHT]
The more flexible the boundary's shape, the lower the model's bias (it can fit subtler patterns) but the higher its variance (it bends to noise). A boundary's shape is the bias-variance tradeoff, made visible.

=== step === quiz
::eyebrow Check yourself
## Which one is stuck with a straight line?

No matter how the two species are arranged on the plane, which of these can **only** ever draw a straight-line boundary?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A decision tree, because it splits on one feature at a time ::no A tree does split one feature at a time, but it stacks many splits into a staircase of rectangles, a nonlinear, boxy boundary, not a straight line.
- Logistic regression, because it separates the classes with one weighted-sum cut ::ok Right. Its boundary is the line \(\beta_0 + \beta_1 x_1 + \beta_2 x_2 = 0\), linear in the features by construction. However the points are arranged, the best it can do is a single straight cut.
- k-nearest-neighbours with k = 1, because it is the simplest rule ::no Simple to describe, but 1-NN draws the most wiggly boundary of all: it bends around every single training point. A simple rule does not mean a simple boundary.

=== step === concept
::eyebrow The second question
## Two routes to a boundary: discriminative vs generative

Shape is one axis. There is a second, completely separate one: **how** a model arrives at its boundary. There are two routes.

A **discriminative** model learns the boundary directly. It asks only "given this flower's measurements, which class is more probable?", modelling \(P(y \mid x)\) and nothing more. Logistic regression, kNN and decision trees all work this way: they never describe what a versicolor *looks* like, they just learn where to cut.

A **generative** model takes the long way round. It first learns what each class looks like, a full description of each species' cloud, \(P(x \mid y)\), plus how common each species is, \(P(y)\). Then it flips those around with Bayes' rule to get the answer:

\[ P(y \mid x) \;\propto\; P(x \mid y)\,P(y) \]

Here \(y\) is the species, \(x\) is the flower's two measurements, \(P(x \mid y)\) is how typical those measurements are for a given species (its cloud), and \(P(y)\) is the species' base rate. The \(\propto\) sign means "proportional to": the species with the bigger right-hand side wins. Naive Bayes, LDA and QDA all take this generative route, the two clouds you can actually draw:

```r
library(ggplot2)
# Generative view: describe each species as its OWN cloud (a 2-D bell),
# then label a flower by which cloud more likely produced it.
ggplot(flowers, aes(Petal.Length, Petal.Width, colour = Species)) +
  geom_point(size = 2) +
  stat_ellipse(type = "norm", linewidth = 1) +
  labs(x = "petal length (cm)", y = "petal width (cm)")
```

The two ellipses are the generative model's picture of the world. The boundary falls out of where they balance. The payoff is extra: because a generative model knows what normal looks like, it can flag a flower that fits *neither* cloud (an outlier, or a third species) and cope when a measurement is missing, things a discriminative model cannot do. The cost is a stronger bet: if the clouds are not really bell-shaped, that picture is wrong, and a discriminative model that never made the bet is safer.

=== step === concept
::eyebrow The whole map
## One map for every classifier

Two questions now place every classifier you have met. **What shape is its boundary?** and **which route, generative or discriminative?** That is the entire geometry of classification on one page:

| Model | Route | Boundary shape | Flexibility |
|---|---|---|---|
| Logistic regression | discriminative | straight | low (high bias) |
| LDA | generative | straight | low |
| Gaussian Naive Bayes | generative | curved | low to moderate |
| QDA | generative | curved | moderate |
| Decision tree | discriminative | rectangles | high (tunable) |
| k-nearest-neighbours | discriminative | wiggly, local | high (small k) |

Read it and the deep idea lands: a model's boundary is its **assumptions made visible**. A straight boundary is a model betting the classes really do split along a flat cut, a strong assumption that buys stability (low variance) at the cost of some bias. A wiggly boundary is a model assuming almost nothing about shape, which lets it fit subtle patterns (low bias) but makes it twitch at noise (high variance).

[KEY INSIGHT]
Fit several models to the same flowers and they draw different boundaries because they hold different beliefs about the world, not because one is simply right. Choosing a classifier is choosing which boundary shape, and which assumptions, fit your problem.

=== step === concept
::eyebrow When no line works
## Change the space, straighten the boundary

Sometimes no straight line can possibly work. Picture one species sitting in a tight cluster, completely ringed by the other, a target with a bullseye. Slice that plane with any straight line and you cut the ring in half: hopeless.

The fix is one of the most powerful ideas in machine learning: **do not bend the boundary, move the data**. Add a new feature, each point's distance from the centre, \(r = \sqrt{x_1^2 + x_2^2}\). In this new space the inner cluster (small \(r\)) and the outer ring (large \(r\)) peel apart into two flat bands that a single straight line splits cleanly.

```r
set.seed(1)
m <- 200
angle  <- runif(m, 0, 2 * pi)
radius <- c(runif(m / 2, 0, 1.2),     # inner group: small radius
            runif(m / 2, 2.2, 3.4))   # outer ring: large radius
ring <- data.frame(
  x1    = radius * cos(angle),
  x2    = radius * sin(angle),
  group = factor(rep(c("inner", "outer"), each = m / 2))
)
table(ring$group)
#>
#> inner outer
#>   100   100
```

```r
library(ggplot2)
ggplot(ring, aes(x1, x2, colour = group)) +
  geom_point(size = 2) + coord_equal() +
  labs(title = "Raw features: no straight line can separate them")
```

```r
ring$r <- sqrt(ring$x1^2 + ring$x2^2)   # the new feature: distance from centre
ggplot(ring, aes(x1, r, colour = group)) +
  geom_point(size = 2) +
  geom_hline(yintercept = 1.7, linewidth = 1) +
  labs(y = "radius  r = sqrt(x1^2 + x2^2)",
       title = "Add one feature, and a straight line splits them")
```

A straight cut at \(r = 1.7\) in the new space is a perfect **circle** back in the original plane. This is the engine behind feature engineering, kernel SVMs and neural networks: a boundary that looks impossibly curved in the features you measured can be perfectly straight in a space you build.

=== step === tryit
::eyebrow Your turn
## Which region is the botanist's flower in?

Back to the desk. The botanist's flower is 4.8 cm long and 1.7 cm wide. Use the logistic model `fit` from earlier to place it: complete `predict()` so it scores the **new flower**. A probability above 0.5 lands it in the virginica region, below 0.5 in versicolor.

```r
new_flower <- data.frame(Petal.Length = 4.8, Petal.Width = 1.7)
predict(fit, ____, type = "response")   # P(virginica) for the new flower
```
::check {"regex":"new_flower","gate":true,"difficulty":"beginner","ok":"The model returns about 0.53, barely past 0.5, so it lands the flower on the virginica side, but only just. This flower sits almost on the boundary, in the contested overlap, which is exactly where a classifier is least sure.","no":"Pass the new flower as the data to score: predict(fit, new_flower, type = \"response\")."}
::solution
```r
new_flower <- data.frame(Petal.Length = 4.8, Petal.Width = 1.7)
predict(fit, new_flower, type = "response")
#>         1
#> 0.5271735
```

=== step === quiz
::eyebrow Check yourself
## Read the shape

A classifier scores 100% on the training flowers but only 72% on new ones, and its boundary is a maze of tiny islands curling around individual points. What does the **shape** of that boundary tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The model is too rigid (high bias) and is underfitting ::no Underfitting looks like a too-simple boundary that misses the pattern and scores poorly on BOTH sets. This boundary is the opposite: ultra-flexible, perfect on train, weak on new data.
- The model is too flexible (high variance) and is overfitting; the jagged shape is it memorising noise ::ok Exactly. A boundary that carves islands around single points has chased the noise in this particular sample. Low bias, high variance: the geometric signature of overfitting.
- The shape is fine; 100% training accuracy means it found the true boundary ::no Training accuracy always rises with flexibility, even when the model is just memorising. The 28-point drop to new data is the tell that the shape is too flexible, not that it is correct.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 2 and 4 (free PDF)](https://www.statlearning.com/) - the Bayes decision boundary, and the classification methods compared here, with R labs.
- [The Elements of Statistical Learning, ch. 2 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - linear vs flexible boundaries and the bias-variance picture behind them.
- [scikit-learn: classifier comparison](https://scikit-learn.org/stable/auto_examples/classification/plot_classifier_comparison.html) - a gallery of the same boundary shapes drawn by many classifiers on the same data; the picture this lesson is built on.
- [Ng and Jordan (2002), On Discriminative vs. Generative Classifiers](https://papers.nips.cc/paper_files/paper/2001/hash/7b7a53e239400a13bd6be6c91c4f6c4e-Abstract.html) - the classic analysis of logistic regression (discriminative) versus Naive Bayes (generative).

=== step === complete
## Lesson 5 complete

Every classifier you have met turns out to be one idea wearing different clothes: a way of drawing a boundary through feature space. You learned to read that boundary on two axes, its **shape** (straight for logistic and LDA, curved for QDA and Naive Bayes, boxy for trees, wiggly for kNN) and its **route** (discriminative models the boundary directly, generative models the classes and lets Bayes' rule draw it). A boundary's shape is the model's assumptions made visible, and when no shape in the raw features works, you can change the space until a straight line does.

Next, Lesson 6: Reading a Classifier. You can now *see* a boundary; the final lesson gives you the *numbers* to grade one, the confusion matrix, precision and recall, ROC and PR curves, and why plain accuracy can flatter a useless model.
