---
title: "Classification Lesson 5: Decision Boundaries and Model Geometry"
catalog_blurb: "How each classifier's assumptions show up as the shape of its boundary."
description: "See how kNN, logistic regression, LDA, QDA and a tree each draw a different decision boundary on one dataset in R, and what generative vs discriminative means."
keywords: "decision boundary, model geometry, linear vs nonlinear boundary, generative vs discriminative, logistic regression, LDA, QDA, kNN, decision tree, classification, R"
post_type: "LESSON"
curriculum_id: "6.30.5"
webr: true
mathjax: true
lesson_access: "pro"
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

Lesson 4 ended with a decision tree carving the plane into rectangular boxes, one label per box. Lesson 3 drew smooth Gaussian curves; Lesson 1 followed a jagged trail of nearest neighbours. Five different machines, five different pictures. This lesson reveals that they are all the same idea wearing different clothes.

Here is the running example for the whole lesson. A sleep-tracking watch labels each night **restful** or **restless** from just two numbers: your **average overnight heart rate** in beats per minute, and your **movements per hour**. Once the watch has trained, it has an opinion about *every* possible night, so it has effectively painted the entire heart-rate-by-movements plane with two colours. The border between the colours is the **decision boundary**, and its **shape**, straight or curved or wiggly or boxy, is a fingerprint of the model that drew it.

By the end of this lesson you will be able to:

- Read any classifier as a decision boundary that splits feature space into one region per class, and tell a linear boundary from a nonlinear one
- Explain **generative** versus **discriminative**, a second axis that is independent of the boundary's shape
- Predict which of kNN, logistic regression, LDA, QDA and a tree draws a straight, curved, wiggly or boxy boundary, and why
- Fit all of them on one dataset and draw and compare their boundaries in R

**Prerequisites:** you can run R and read its output, and you have met this course's classifiers (kNN in Lesson 1, Naive Bayes in Lesson 2, LDA and QDA in Lesson 3, the decision tree in Lesson 4) and the idea of bias versus variance.

::widget decision-region {"labels":{"c0":"restful","c1":"restless"},"start":3}

The picture above is one such boundary, a tree's, with a dial for how flexible it is. Slide it later; for now, just notice that the model has an answer everywhere, and a visible fence between the two answers. That fence is what this whole lesson is about.

=== step === concept
::eyebrow The one idea
## Every classifier is a boundary

Think about what your sleep watch actually does. You hand it a night, a single point on the plane like "heart rate 57, movements 15", and it returns one word. Do that for every point on the plane and the whole surface fills in with two colours: a **restful region** and a **restless region**. The **decision boundary** is simply the line where those two regions meet, the set of nights the model finds a perfect toss-up.

We can say that precisely. Write \(x\) for a night's two numbers, \(x = (\text{heart rate}, \text{movements})\), and write \(P(\text{restless} \mid x)\) for the probability the model assigns to "restless" given that night. The boundary is exactly the set of nights where the two verdicts are tied at fifty-fifty:

\[ \{\, x \;:\; P(\text{restless} \mid x) = P(\text{restful} \mid x) = 0.5 \,\} \]

Everything on one side is painted restless, everything on the other restful. So a classifier *is* its boundary: to know the model is to know the shape of that fence. Different models draw the fence differently, and that is the story of this lesson.

[KEY INSIGHT]
A trained classifier has already decided the label of every possible point. The decision boundary is the border between its label regions, and comparing classifiers means comparing the shapes of those borders.

=== step === concept
::eyebrow Two families of shape
## Linear boundaries, and everything else

Boundaries come in two broad kinds, and the distinction runs through the rest of the lesson.

A boundary is **linear** when it is a straight line (in our two-feature plane) or a flat plane (in higher dimensions). Concretely, it is the set of nights where a weighted sum of the features equals a constant:

\[ w_1 x_1 + w_2 x_2 + b = 0 \]

Here \(x_1\) is the heart rate and \(x_2\) the movements; \(w_1\) and \(w_2\) are **weights** that say how much each feature counts; and \(b\) is a constant **offset** (also called the bias or intercept) that slides the line up or down. On one side of the line the weighted sum is positive and the model predicts restless; on the other it is negative and predicts restful. A straight fence, full stop.

A boundary is **nonlinear** when it cannot be written that way: a curve that bends, a jagged trail that wiggles, or a staircase of right-angle steps. Curved, wiggly and boxy are all just different flavours of nonlinear.

[NOTE]
"Linear" is a statement about the boundary's *shape*, not about the features. A straight line in the heart-rate-by-movements plane is linear. Later you will see a trick that makes a curved boundary straight simply by changing what the features are.

=== step === concept
::eyebrow The running data
## The nights we will classify

Every lesson starts a fresh R session, so we build the sleep log right here. We simulate 240 labelled nights, 120 restful and 120 restless, each a point in the heart-rate-by-movements plane. The two groups are deliberately given different-shaped clouds (the restless nights spread wider and tilt the other way), because that difference in shape is exactly what will make some boundaries curve later on.

```r
library(MASS)
set.seed(1)
n <- 120

# Restful nights: lower heart rate, fewer movements; a compact, gently tilted cloud.
restful  <- mvrnorm(n, mu = c(54, 12), Sigma = matrix(c(14,  4,   4,  9), 2))
# Restless nights: higher heart rate, more movements; a wider, oppositely tilted cloud.
restless <- mvrnorm(n, mu = c(60, 19), Sigma = matrix(c(34, -8,  -8, 38), 2))

nights <- data.frame(
  state      = factor(rep(c("restful", "restless"), each = n)),
  heart_rate = c(restful[, 1], restless[, 1]),   # avg overnight beats per minute
  movements  = c(restful[, 2], restless[, 2])    # movements per hour
)
table(nights$state)
#>
#>  restful restless
#>      120      120
```

Now plot them. Restful nights gather in the lower left (calm heart, still body); restless nights sit up and to the right; and, crucially, the two clouds **overlap** in the middle. No classifier will get every night right, and that honest overlap is what makes the shape of the boundary matter.

```r
library(ggplot2)
ggplot(nights, aes(heart_rate, movements, color = state)) +
  geom_point(alpha = 0.75, size = 2) +
  scale_color_manual(values = c(restful = "#2563a8", restless = "#b5631a")) +
  labs(title = "240 nights: two overlapping clouds",
       x = "heart rate (bpm)", y = "movements per hour") +
  theme_minimal(base_size = 13)
```

=== step === concept
::eyebrow The second axis
## Generative versus discriminative

Before we draw a single boundary, there is a second, deeper way models differ, and it is *independent* of the boundary's shape. It is the difference between describing the classes and describing the border.

A **generative** model learns how each class *generates* its data. It builds a full description of what restful nights look like and, separately, what restless nights look like, then combines them with each class's overall frequency. In symbols, it estimates the distribution \(P(x \mid y{=}k)\) of nights *within* class \(k\) and the base rate \(P(y{=}k)\), and gets the answer by Bayes' rule:

\[ P(y{=}k \mid x) \;\propto\; \underbrace{P(x \mid y{=}k)}_{\text{what class } k \text{ looks like}} \; \underbrace{P(y{=}k)}_{\text{how common class } k \text{ is}} \]

Here \(y\) is the label (restful or restless), \(k\) is one of its values, and \(\propto\) means "proportional to" (we skip the common denominator because it does not change which class wins). Because a generative model knows what each class *looks like*, you could literally use it to *sample fake but plausible nights*. Naive Bayes, LDA and QDA are all generative.

A **discriminative** model skips all of that. It never describes what a restful night looks like; it learns only the boundary, or equivalently the conditional probability \(P(y{=}\text{restless} \mid x)\) directly. It answers "which side are you on?" without ever asking "what does each side look like?". Logistic regression, kNN and decision trees are discriminative.

| Classifier | What it learns | Route |
|---|---|---|
| Naive Bayes | each class's feature distribution | generative |
| LDA / QDA | each class as a Gaussian cloud | generative |
| Logistic regression | the probability of restless directly | discriminative |
| kNN | the local majority label directly | discriminative |
| Decision tree | the label of each region directly | discriminative |

Hold on to this: **shape** (linear or not) and **route** (generative or discriminative) are two separate questions. We will see them cross.

=== step === concept
::eyebrow A discriminative straight line
## Why logistic regression draws a straight boundary

Start with the simplest discriminative model, logistic regression, and watch *why* its boundary is straight. Logistic regression models the probability of restless directly by squashing a weighted sum of the features through the **sigmoid** function:

\[ P(\text{restless} \mid x) = \sigma(w_1 x_1 + w_2 x_2 + b), \qquad \sigma(z) = \frac{1}{1 + e^{-z}} \]

The sigmoid \(\sigma\) takes any real number \(z\) and gently squashes it into a probability between 0 and 1. Now recall from the last step that the boundary is where that probability equals \(0.5\). And \(\sigma(z) = 0.5\) happens at exactly one place: \(z = 0\). So the boundary is wherever the inside of the sigmoid is zero:

\[ w_1 x_1 + w_2 x_2 + b = 0 \]

That is the straight-line equation from two steps ago. No matter what the data looks like, logistic regression can only ever draw a straight fence. Let us fit it and see the weights:

```r
logit <- glm(state ~ heart_rate + movements, data = nights, family = binomial)
round(coef(logit), 3)
#> (Intercept)  heart_rate   movements
#>     -25.980       0.355       0.398
```

Those three numbers *are* the boundary: \(b = -25.98\), \(w_1 = 0.355\), \(w_2 = 0.398\). To draw the line, rearrange \(w_1 x_1 + w_2 x_2 + b = 0\) into the familiar slope-and-intercept form \(x_2 = \text{slope}\cdot x_1 + \text{intercept}\):

```r
library(ggplot2)
cf <- coef(logit)
slope     <- -cf["heart_rate"] / cf["movements"]    # -w1 / w2
intercept <- -cf["(Intercept)"] / cf["movements"]   # -b  / w2

ggplot(nights, aes(heart_rate, movements, color = state)) +
  geom_point(alpha = 0.7, size = 2) +
  geom_abline(slope = slope, intercept = intercept, linewidth = 1) +
  scale_color_manual(values = c(restful = "#2563a8", restless = "#b5631a")) +
  labs(title = "Logistic regression: one straight boundary",
       x = "heart rate (bpm)", y = "movements per hour") +
  theme_minimal(base_size = 13)
```

One clean diagonal line splits the plane. Nights above and to the right are called restless, below and to the left restful.

=== step === tryit
::eyebrow Your turn
## Classify one night by hand

The fitted rule is just "add up intercept plus \(w_1\) times heart rate plus \(w_2\) times movements; if the total is positive, it is on the restless side." Let us apply it to one night, heart rate 58 bpm with 17 movements per hour, using the coefficients you just fit. The first block computes the weighted sum (nothing to fill in); run it, then finish the second block by choosing the threshold that marks the boundary.

```r
# intercept*1 + w1*heart_rate + w2*movements, using the fitted coefficients
score <- sum(coef(logit) * c(1, 58, 17))
round(score, 3)
#> [1] 1.377
```

```r
# The boundary sits where the score is exactly ____. Above it, predict restless.
ifelse(score > ____, "restless", "restful")
```
::check {"regex":">\\s*0","gate":true,"difficulty":"beginner","ok":"Right: the boundary is where the score equals 0. This night scores +1.377, just over the line, so the straight-line rule calls it restless.","no":"The linear boundary is where the weighted sum equals 0 (that is where the sigmoid hits 0.5). Compare the score with 0: ifelse(score > 0, ...)."}
::solution
```r
ifelse(score > 0, "restless", "restful")
#> [1] "restless"
```

=== step === quiz
::eyebrow Check yourself
## Same line, same model?

In a moment you will fit LDA on these nights and get a straight boundary almost on top of the logistic one. Suppose the two lines landed *exactly* on each other. Would that make LDA and logistic regression the same model?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: an identical boundary shape means an identical model ::no Shape is only one of the two axes. Two models can draw the same fence by completely different machinery, and diverge the moment their assumptions are tested.
- No. They share a shape but not a route: LDA is generative (it models each class as a Gaussian cloud and the straight line falls out of a shared covariance), while logistic regression is discriminative (it fits the line to the probability directly). They can disagree when the Gaussian assumption is wrong or when outliers are present ::ok Exactly. Same geometry, different reasoning. LDA leans on a distribution assumption that logistic regression never makes, so the two part ways when that assumption fails.
- No, but only because LDA is a little more accurate on this data ::no Accuracy is not what makes them different models; even at identical accuracy they reason differently. The real distinction is generative versus discriminative, not a point or two of training accuracy.

=== step === concept
::eyebrow Generative curves
## LDA stays straight, QDA bends

Now the generative side. Lesson 3 modelled each class as a Gaussian cloud and showed the payoff: if both classes are forced to **share one covariance** (one common shape and tilt), the boundary comes out straight, and that is **LDA**. If each class is allowed **its own covariance**, the boundary is free to **curve**, and that is **QDA**. Our restless cloud is genuinely wider and tilted the other way from the restful one, so QDA's freedom to bend should help. Fit both and compare their training accuracy:

```r
library(MASS)
lda_fit <- lda(state ~ heart_rate + movements, data = nights)
qda_fit <- qda(state ~ heart_rate + movements, data = nights)

# fraction of the 240 nights each model labels correctly
c(LDA = round(mean(predict(lda_fit)$class == nights$state), 3),
  QDA = round(mean(predict(qda_fit)$class == nights$state), 3))
#>   LDA   QDA
#> 0.871 0.904
```

QDA edges ahead, 90.4% to 87.1%, because a straight line cannot honour two differently-shaped clouds while a curve can. Notice the pattern taking shape: LDA and logistic regression both draw straight lines (0.871 and 0.867, near twins), while QDA's per-class covariance buys it a curve.

[NOTE]
This is **training** accuracy, scored on the very nights each model learned from, so the more flexible model (QDA) naturally flatters itself. Whether that curve actually helps on *new* nights is the bias-variance question from Lesson 3, and we return to it once every shape is on the table.

=== step === tryit
::eyebrow Your turn
## Send three new nights through QDA

A trained classifier's real job is labelling nights it has never seen. Here are three: a calm one, a clearly restless one, and one sitting right in the overlap. Complete the line so QDA labels each by which region it falls in.

```r
new_nights <- data.frame(
  heart_rate = c(51, 64, 57),   # bpm
  movements  = c( 8, 24, 15)    # per hour
)
```

```r
new_nights$label <- ____(qda_fit, new_nights)$class   # QDA's verdict for each
new_nights
```
::check {"regex":"predict","gate":true,"difficulty":"beginner","ok":"That is it: predict() drops each night into QDA's regions. The calm night is restful, the high-and-active one restless, and the borderline 57/15 night lands (just) in the restful region.","no":"Use predict(qda_fit, new_nights)$class. predict() takes a fitted model and new data and returns the class each row falls into."}
::solution
```r
new_nights$label <- predict(qda_fit, new_nights)$class
new_nights
#>   heart_rate movements    label
#> 1         51         8  restful
#> 2         64        24 restless
#> 3         57        15  restful
```

=== step === widget
::eyebrow A wiggly boundary
## kNN follows the neighbours

kNN is discriminative in the most literal way: it fits no equation at all. To label a night it just finds the \(k\) nearest past nights and takes their majority vote (Lesson 1). Because the vote is decided locally, point by point, the boundary is free to **wiggle**: it follows the data wherever the nearest neighbours happen to flip. And \(k\) is the flexibility dial. At \(k = 1\) the boundary is jagged and chases every single point; as \(k\) grows it smooths out.

In the widget, two classes of points sit red and blue. Drop a query point anywhere and slide \(k\): its \(k\) nearest neighbours light up, vote, and colour the query. Watch the vote flip as you cross into the other cluster, and watch how a tiny \(k\) makes the verdict twitchy.

::widget knn-vote {}

We can measure that flexibility on our nights. kNN needs no package; it is just distance-then-vote. To judge it honestly we use **leave-one-out**: predict each night from the *other* 239, so no night ever votes for itself.

```r
# k-nearest neighbours by hand: distance to every night, the k closest vote.
knn_predict <- function(train_x, train_y, query, k) {
  diffs <- sweep(train_x, 2, query)        # subtract the query night from every row
  dist  <- sqrt(rowSums(diffs^2))          # straight-line distance to each night
  votes <- train_y[order(dist)[1:k]]       # labels of the k nearest nights
  names(which.max(table(votes)))           # the majority vote
}

X <- as.matrix(nights[, c("heart_rate", "movements")])

# Leave-one-out accuracy at two values of k.
loo_acc <- function(k) {
  pred <- sapply(seq_len(nrow(X)),
                 function(i) knn_predict(X[-i, ], nights$state[-i], X[i, ], k))
  round(mean(pred == nights$state), 3)
}
c(k1 = loo_acc(1), k15 = loo_acc(15))
#>   k1  k15
#> 0.85 0.90
```

At \(k = 1\) the jagged boundary trusts a single neighbour and scores 0.85; at \(k = 15\) it steadies to 0.90. The wiggle is not free: too much of it (tiny \(k\)) is overfitting, exactly the high-variance failure the shape is warning you about.

=== step === widget
::eyebrow A boxy boundary
## The tree draws staircases

A decision tree can only ever ask questions of the form "is this feature below a threshold?", like "movements below 16?". Each such question is a single horizontal or vertical cut, so the boundary is always a **staircase of axis-aligned rectangles**. Grow the tree on our nights and read the cuts:

```r
library(rpart)
tree <- rpart(state ~ heart_rate + movements, data = nights, method = "class")
tree
#> n= 240
#>
#> node), split, n, loss, yval, (yprob)
#>       * denotes terminal node
#>
#> 1) root 240 120 restful (0.50000000 0.50000000)
#>   2) movements< 16.14908 147  33 restful (0.77551020 0.22448980)
#>     4) heart_rate< 58.14093 114   7 restful (0.93859649 0.06140351) *
#>     5) heart_rate>=58.14093 33   7 restless (0.21212121 0.78787879) *
#>   3) movements>=16.14908 93   6 restless (0.06451613 0.93548387) *
```

Read top to bottom: first a horizontal cut at 16.1 movements, then a vertical cut at 58.1 bpm inside the lower band. Three boxes, and the true boundary between our clouds runs on a *diagonal*, so the tree is forced to approximate a slope with right-angle steps, a slightly clumsy fit that is the geometric price of only being allowed axis-aligned cuts.

The widget below is a real tree, grown live on two overlapping clouds like our nights. Drag the depth dial. A shallow tree is a couple of clean boxes that underfit; push it deep and the training accuracy climbs toward 100% while the test accuracy (the hollow points it never trained on) peaks and then falls, the boundary shattering into tiny islands around individual noisy nights.

::widget decision-region {"labels":{"c0":"restful","c1":"restless"},"min":1,"max":10,"start":2,"showTest":true}

[KEY INSIGHT]
Boxier, wigglier and curvier all mean *more flexible*. More flexibility lowers bias (the boundary can hug the training data) but raises variance (it chases noise). The shape of the boundary is a picture of exactly this trade-off.

=== step === concept
::eyebrow The gallery
## One dataset, four boundary shapes

Time to put them side by side. We label every point on a fine grid with each fitted model, then colour the regions. Same 240 nights underneath each panel; only the model changes.

```r
library(ggplot2)
gx <- seq(min(nights$heart_rate), max(nights$heart_rate), length.out = 90)
gy <- seq(min(nights$movements),  max(nights$movements),  length.out = 90)
grid <- expand.grid(heart_rate = gx, movements = gy)

# each model's verdict for every grid cell
grid$logistic <- ifelse(predict(logit, grid, type = "response") > 0.5, "restless", "restful")
grid$LDA  <- as.character(predict(lda_fit, grid)$class)
grid$QDA  <- as.character(predict(qda_fit, grid)$class)
grid$tree <- as.character(predict(tree, grid, type = "class"))

# stack the four region maps into one long table so we can facet them
one <- function(col, label) {
  data.frame(heart_rate = grid$heart_rate, movements = grid$movements,
             region = grid[[col]], model = label)
}
regions <- rbind(one("logistic", "logistic (straight)"), one("LDA", "LDA (straight)"),
                 one("QDA", "QDA (curved)"),            one("tree", "tree (boxy)"))
regions$model <- factor(regions$model,
  levels = c("logistic (straight)", "LDA (straight)", "QDA (curved)", "tree (boxy)"))

ggplot(nights, aes(heart_rate, movements)) +
  geom_tile(data = regions, aes(fill = region), alpha = 0.3) +
  geom_point(aes(color = state), size = 0.9) +
  facet_wrap(~ model) +
  scale_fill_manual(values  = c(restful = "#2563a8", restless = "#b5631a")) +
  scale_color_manual(values = c(restful = "#2563a8", restless = "#b5631a")) +
  labs(title = "One dataset, four boundary shapes",
       x = "heart rate (bpm)", y = "movements per hour") +
  theme_minimal(base_size = 12)
```

Four panels, four fingerprints: logistic and LDA are clean straight diagonals, QDA bows into a gentle curve that wraps the wider restless cloud, and the tree is a hard-edged staircase. Same nights, same overlap, four different geometries, each one a direct read-out of what its model assumes.

=== step === concept
::eyebrow A deeper twist
## The shape depends on the space

Here is the idea that ties the room together: a boundary's shape is not absolute, it depends on the *features you measure*. Change the features and a curved boundary can become straight.

Step away from the sleep tracker for one moment. Imagine a "core" group of points sitting in a tight blob, completely surrounded by a "halo" group forming a ring around it. In the raw two features, **no straight line can separate them**: any line you draw cuts through both.

```r
library(ggplot2)
set.seed(7)
m <- 150
inner <- data.frame(x1 = rnorm(m, 0, 0.5), x2 = rnorm(m, 0, 0.5), class = "core")
ang <- runif(m, 0, 2 * pi); rad <- runif(m, 2.2, 3.2)
outer <- data.frame(x1 = rad * cos(ang), x2 = rad * sin(ang), class = "halo")
ring  <- rbind(inner, outer)
ring$class <- factor(ring$class)

ggplot(ring, aes(x1, x2, color = class)) +
  geom_point(size = 1.6) + coord_equal() +
  labs(title = "Raw space: the core sits inside the halo, no straight cut works") +
  theme_minimal(base_size = 13)
```

Now add **one** new feature: each point's distance from the centre, \(r = \sqrt{x_1^2 + x_2^2}\). Plot that new feature against \(x_1\), and the two groups separate onto two flat bands. A single straight cut at a radius of about 1.8 now splits them perfectly.

```r
ring$radius <- sqrt(ring$x1^2 + ring$x2^2)   # one engineered feature

ggplot(ring, aes(x1, radius, color = class)) +
  geom_point(size = 1.6) +
  geom_hline(yintercept = 1.8, linetype = "dashed") +
  labs(title = "After adding radius: a straight cut at 1.8 separates them",
       y = "radius = distance from centre") +
  theme_minimal(base_size = 13)
```

That straight cut in the new space, mapped back to the original plane, is a **circle**. Nothing about the data changed; we only changed the coordinates we measure it in. This is the geometric seed of feature engineering, kernel methods and neural networks: rather than bend the boundary, they bend the *space* until a simple boundary fits.

[KEY INSIGHT]
"Linear" and "nonlinear" describe the boundary *in a given feature space*. Engineer the right feature and a hopeless nonlinear problem can become a trivial linear one.

=== step === concept
::eyebrow The map
## Two independent axes

We now have both axes, and the point is that they are **independent**. Boundary shape (straight, curved, wiggly, boxy) tells you how flexible a model is. Route (generative or discriminative) tells you whether it describes the classes or only the border. Neither one predicts the other.

| Classifier | Boundary shape | Route |
|---|---|---|
| Logistic regression | straight line | discriminative |
| LDA | straight line | generative |
| Gaussian Naive Bayes | curved | generative |
| QDA | curved | generative |
| kNN | wiggly, local | discriminative |
| Decision tree | boxy, axis-aligned | discriminative |

Read it across and the independence jumps out. LDA and logistic regression share a **shape** but split on **route**. QDA (generative, curved) and a deep tree (discriminative, boxy) are both nonlinear yet reach it from opposite ends of the map. The shape came from each model's assumption about *flexibility*; the route came from its assumption about *what to model*. Knowing both is knowing the model's geometry and its philosophy at once.

=== step === quiz
::eyebrow Check yourself
## When the route matters

Your sleep app receives a bizarre new reading: heart rate 95 with 60 movements per hour, unlike any training night of either class (it turns out the watch fell off). You would rather the app flag it as "this does not look like normal sleep" than force it into restful or restless. Which kind of model can do that, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A discriminative model, because it draws a sharper boundary ::no A sharper boundary still only tells you which *side* a point is on. It has no notion of "far from everything," so it will confidently assign even an absurd point to whichever region it lands in.
- A generative model, because it describes what each class actually looks like, so it can notice the point is unlikely under BOTH classes ::ok Right. A generative model gives a likelihood for each class, so a point that scores near-zero under both is a natural novelty signal. This is the basis of outlier and novelty detection, and a purely discriminative model cannot do it from the boundary alone.
- Neither: no classifier can ever tell that a point is unusual ::no Generative models can, precisely because they model the class distributions. The likelihood under each class is a built-in measure of how typical a point is.

=== step === concept
::eyebrow Choosing
## The shape is not the score

A tempting mistake is to pick a model by how good its boundary *looks*. The gallery makes the honest rule obvious instead: the best geometry is the one that matches the truth, and you can only tell which that is by checking on data the model has not seen.

- **More flexible is not more accurate.** The tree and QDA scored highest on the *training* nights, but that is partly because a flexible boundary can memorise. The wiggle at \(k = 1\) that dropped kNN to 0.85 was flexibility hurting, not helping.
- **Match the geometry to the problem.** If the true divide is roughly a straight diagonal, a straight model (logistic or LDA) is both accurate and stable. If classes are genuinely differently shaped, a curve (QDA) earns its keep. If the rule is really "movements above X or heart rate above Y," a tree's boxes fit naturally.
- **Decide on held-out data.** Training accuracy always flatters the flexible model. Judge boundaries by cross-validation or a test set (the resampling tools coming up in this track), never by which one hugs the training points hardest.

| Prefer a simpler, straighter boundary when... | Prefer a more flexible boundary when... |
|---|---|
| Few training nights, or many features | Plenty of data per class |
| The classes look like the same shape, just shifted | The classes clearly differ in shape |
| You want a stable, low-variance model | The truth genuinely bends and you can afford the variance |

[WARNING]
A boundary that fits the training data perfectly is a red flag, not a trophy. Perfect training accuracy usually means the model memorised noise, and its jagged or shattered shape is telling you so.

=== step === quiz
::eyebrow Check yourself
## Name that boundary

You are shown three trained boundaries on the same two features. **(A)** is a single perfectly straight diagonal line. **(B)** is a smooth curved arc that bulges around one class. **(C)** is a staircase of horizontal and vertical steps. Match each shape to the model most likely to have drawn it.

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A = decision tree, B = logistic regression, C = QDA ::no A tree can only make axis-aligned steps, so it draws C, not the straight line A. Logistic regression is straight, not the curve B.
- A = logistic regression or LDA, B = QDA, C = decision tree ::ok Exactly. A straight line comes from a linear model (logistic or LDA); a smooth curve is QDA's per-class covariance at work; a right-angled staircase is the unmistakable signature of a tree's axis-aligned splits.
- A = QDA, B = kNN, C = LDA ::no QDA is curved, not the straight line A, and LDA is straight, not the boxy staircase C. The shapes are mismatched to the models.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 2 and 4 (free PDF)](https://www.statlearning.com/) - the gentlest treatment of decision boundaries, the Bayes boundary, and LDA/QDA/logistic side by side, with R labs.
- [The Elements of Statistical Learning, ch. 2 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - linear boundaries versus flexible ones, and the bias-variance geometry, in full.
- [Ng and Jordan (2002), "On Discriminative vs. Generative Classifiers"](https://ai.stanford.edu/~ang/papers/nips01-discriminativegenerative.pdf) - the classic paper contrasting logistic regression and Naive Bayes, and when each wins.
- [scikit-learn: classifier comparison gallery](https://scikit-learn.org/stable/auto_examples/classification/plot_classifier_comparison.html) - a literal gallery of decision boundaries for many models on the same datasets; the picture of this whole lesson.
- [R documentation: MASS::lda and qda](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/lda.html) - the generative models you fitted here, with their assumptions.

=== step === complete
## Lesson 5 complete

You can now read any classifier as the boundary it draws. A classifier labels every point of feature space, and the border between its regions has a shape, straight (logistic, LDA), curved (QDA, Gaussian Naive Bayes), wiggly (kNN), or boxy (a tree), that is a fingerprint of the model's flexibility. You saw a second, independent axis, generative (model each class, as LDA and QDA do) versus discriminative (model only the boundary, as logistic regression, kNN and trees do), and why it lets generative models flag novel points that discriminative ones cannot. You drew all four boundaries on one dataset in R, watched a curved boundary turn straight simply by adding a feature, and learned to choose by held-out performance rather than by which fence looks tightest.

Next, Lesson 6: Reading a Classifier. Now that you can *see* the boundary, you need *numbers* to grade it. We move from the shape of the decision to how well it actually performs: the confusion matrix, accuracy, precision, recall and F1, the ROC and precision-recall curves, and why accuracy alone can badly mislead you.
