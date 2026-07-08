---
title: "Advanced Supervised Learning Lesson 1: Support Vector Machines and the Maximum Margin"
catalog_blurb: "Why the widest-margin boundary is the most reliable, and which points fix it."
description: "Support vector machines from the ground up in R: what the margin is, why the widest-margin boundary generalizes best, and the support vectors that define it."
keywords: "support vector machine, SVM, maximum margin, margin, support vectors, linear SVM, soft margin, cost C, e1071, decision boundary, classification, R"
post_type: "LESSON"
curriculum_id: "6.140.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning in R"
course_lesson: "1"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "Kernel-SVMs-and-the-Kernel-Trick.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 8
## Support Vector Machines and the Maximum Margin

You have already met classifiers that draw a straight line between two groups, like logistic regression and LDA. A support vector machine draws a straight boundary too, but it chooses that boundary by one strikingly simple and powerful principle: leave the widest possible empty street between the classes.

Below is a support vector machine at work. The circled points, its **support vectors**, are the only ones that shape the boundary, and switching the kernel bends that boundary to fit. This course is about that machine. This first lesson builds its beating heart on one concrete job a straight line can handle: sorting ripe tomatoes from unripe ones off two cheap sensor readings. Given many lines that all split the two groups, what makes one of them the best?

By the end of this lesson you will be able to:

- Explain what the margin is and why the widest-margin boundary is the most reliable one
- Read the boundary equation, the margin, and the max-margin problem, with every symbol defined
- Find the support vectors, and predict how the boundary moves when a point changes
- Fit a linear SVM in R, count its support vectors, and tune its cost

**Prerequisites:** you can fit and read a basic classifier and know what a training set and a decision boundary are; you have seen at least one straight-boundary classifier such as logistic regression or [LDA](Discriminant-Analysis-LDA-and-QDA.html). A scatter plot and a straight-line equation are all the geometry you need.

::widget kernel-svm {}

=== step === concept
::eyebrow The setup
## Many lines separate them; which do we trust?

A tomato **packing line** needs to sort fruit into ripe (ship today) and unripe (back to the shelf), automatically, from two cheap sensor readings: **redness**, a 0 to 10 colour score, and **give**, how many millimetres the skin dents under a standard press. Ripe tomatoes are redder and softer (high give); unripe ones are greener and firmer (low give). Plotted, they form two clean clouds with an empty strip between them.

Each lesson runs in a fresh R session, so we build a small labelled batch right here: 20 ripe and 20 unripe tomatoes. The three dashed lines below all separate the batch perfectly, every ripe tomato on one side, every unripe one on the other.

```r
library(ggplot2)
set.seed(1)
n <- 20
ripe   <- data.frame(redness = rnorm(n, 7.2, 0.7), give = rnorm(n, 6.8, 0.7), grade = "ripe")
unripe <- data.frame(redness = rnorm(n, 3.4, 0.7), give = rnorm(n, 3.0, 0.7), grade = "unripe")
tomatoes <- rbind(ripe, unripe)
tomatoes$grade <- factor(tomatoes$grade)

ggplot(tomatoes, aes(redness, give, colour = grade)) +
  geom_abline(slope = -1.00, intercept = 11.2, linetype = "dashed", colour = "grey65") +
  geom_abline(slope = -0.35, intercept =  7.4, linetype = "dashed", colour = "grey65") +
  geom_abline(slope = -2.20, intercept = 16.5, linetype = "dashed", colour = "grey65") +
  geom_point(size = 2.6) +
  scale_colour_manual(values = c(ripe = "#b5631a", unripe = "#2563a8")) +
  labs(title = "Three lines that all separate the tomatoes. Which is best?",
       x = "redness (0 to 10)", y = "give (mm the skin dents)") +
  theme_minimal(base_size = 13)
```

All three lines score 100% on this training batch, yet they are clearly different rules. A tomato that lands in the gap tomorrow could be graded ripe by one line and unripe by another. So "separates the training data" cannot be the whole story. We need a reason to prefer one line over all the others.

=== step === concept
::eyebrow The idea
## The best line has the widest street

Picture each candidate line as the centre of a road, with the road widened outward on both sides until it just touches the nearest tomato. That road is the **margin**: the empty band around the boundary. A line squeezed right up against the points has a thin margin; a line running down the middle of the gap has a fat one.

The support vector machine picks the boundary with the **widest street**. The intuition is about safety. A new tomato measured tomorrow will land somewhere near, but not exactly on, the training points. The more empty space between the boundary and each class, the more a slightly-off tomato can wander and still be graded correctly. A thin margin leaves no room for error.

Here is that best boundary, fit for real on the batch above. The solid line is the boundary; the two dashed lines are the edges of the street; and the two ringed tomatoes are the ones the street is resting against.

```r
library(e1071)
fit <- svm(grade ~ redness + give, data = tomatoes,
           kernel = "linear", cost = 10, scale = FALSE)

# classify a fine grid so we can trace the boundary and its two margin lines
grid <- expand.grid(redness = seq(2, 9, length.out = 140),
                    give    = seq(1, 8, length.out = 140))
grid$dv <- attr(predict(fit, grid, decision.values = TRUE), "decision.values")[, 1]
support_vectors <- tomatoes[fit$index, ]      # the points the margin rests on

ggplot(tomatoes, aes(redness, give)) +
  geom_contour(data = grid, aes(z = dv), breaks = 0,
               colour = "#1a1a1a", linewidth = 0.9) +
  geom_contour(data = grid, aes(z = dv), breaks = c(-1, 1),
               colour = "#9aa0a6", linewidth = 0.6, linetype = "dashed") +
  geom_point(data = support_vectors, size = 5.5, shape = 21,
             colour = "#111111", fill = NA, stroke = 1.1) +
  geom_point(aes(colour = grade), size = 2.6) +
  scale_colour_manual(values = c(ripe = "#b5631a", unripe = "#2563a8")) +
  labs(title = "The maximum-margin boundary (solid) and its street (dashed)",
       subtitle = "The two ringed tomatoes are the support vectors",
       x = "redness (0 to 10)", y = "give (mm the skin dents)") +
  theme_minimal(base_size = 13)
```

[KEY INSIGHT]
Among all the lines that separate the two classes, an SVM keeps the single one whose nearest point on either side is as far away as possible. Maximum margin means maximum breathing room for the next tomato.

=== step === quiz
::eyebrow Check yourself
## Which line does the SVM choose?

You have three lines that all separate the training tomatoes perfectly. A support vector machine has to pick one. Which does it keep, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The steepest line that still separates the two classes ::no The slope of the boundary falls out of the data geometry; the SVM never prefers steep or shallow for its own sake. What it maximizes is distance from the nearest points.
- The line with the widest empty street between the two classes ::ok Right. Among all separating lines it keeps the one whose closest tomato on either side is as far away as possible. That fat margin gives a slightly-off new tomato the most room to still land on the correct side.
- The line that passes through the most training points ::no That is the opposite of the goal. The SVM wants the nearest points as far from the boundary as possible, not sitting on it. A boundary touching many points has a tiny margin.

=== step === concept
::eyebrow The math
## Writing the margin down

Now the same idea in symbols, because the formula is what R actually optimizes. A straight boundary in two dimensions is a line; in general it is a **hyperplane**, written \(w^\top x + b = 0\). Here \(x\) is a tomato's feature vector (its redness and give), \(w\) is the **weight vector**, a direction with one number per feature that points across the boundary, and \(b\) is a single **offset** number that slides the boundary in or out. The expression \(w^\top x\) is the **dot product**: multiply matching entries and add them, \(w_1 x_1 + w_2 x_2\). A tomato scores \(w^\top x + b\); we call it ripe when that score is positive and unripe when it is negative, so the boundary is exactly where the score is 0.

How far is a tomato from the boundary? Its **signed distance** is

\[ \frac{w^\top x + b}{\lVert w \rVert}, \qquad \lVert w \rVert = \sqrt{w_1^2 + w_2^2} \]

where \(\lVert w \rVert\) is the length of the weight vector. The sign says which side; the size says how far.

We are free to rescale \(w\) and \(b\) together without moving the boundary at all (doubling both gives the same line). SVMs spend that freedom to fix the scale so the closest points on each side land exactly at \(w^\top x + b = +1\) and \(w^\top x + b = -1\). Those two parallel lines are the edges of the street. With that scaling the distance from the boundary to each edge, the **margin**, is \(\frac{1}{\lVert w \rVert}\), so the full street width is \(\frac{2}{\lVert w \rVert}\).

Making the street as wide as possible therefore means making \(\lVert w \rVert\) as **small** as possible. The whole training problem collapses to one clean sentence:

\[ \text{minimize } \tfrac{1}{2}\lVert w \rVert^2 \quad \text{subject to } \quad y_i\,(w^\top x_i + b) \ge 1 \ \text{ for every tomato } i \]

where \(y_i = +1\) for a ripe tomato and \(y_i = -1\) for an unripe one. The constraint says every tomato must be on its correct side and outside the street; the objective says, among all boundaries that manage that, take the one with the widest street. Minimizing \(\tfrac12\lVert w\rVert^2\) rather than \(\lVert w\rVert\) itself picks the very same winner; the square and the \(\tfrac12\) only turn it into a smooth problem the solver handles cleanly. R solved exactly this a moment ago, and we can read the answer back out:

```r
w <- drop(t(fit$coefs) %*% fit$SV)    # the weight vector, one number per feature
b <- -fit$rho                          # the offset
round(w, 3)
#> redness    give
#>   0.425   0.583
2 / sqrt(sum(w^2))                      # the street width, 2 / ||w||
#> [1] 2.773
```

So this boundary is 2.77 sensor-units wide from curb to curb, and no separating line for this batch is wider.

=== step === concept
::eyebrow The key players
## Support vectors: the points that hold the street

Look again at the constraint \(y_i(w^\top x_i + b) \ge 1\). For most tomatoes it is slack: they sit comfortably beyond the street, so \(y_i(w^\top x_i + b) > 1\). For a special few it is tight, \(y_i(w^\top x_i + b) = 1\): they land exactly on a margin line. Those points are the **support vectors**, and they are the only ones the boundary touches.

The solution has a beautiful property that makes this precise. The weight vector is a weighted sum of the support vectors alone,

\[ w = \sum_i \alpha_i\, y_i\, x_i, \qquad \alpha_i > 0 \ \text{only for support vectors} \]

where each \(\alpha_i\) is a weight the optimizer assigns to tomato \(i\). Every tomato that is not a support vector gets \(\alpha_i = 0\), so it contributes nothing to \(w\). On our batch, of all 40 tomatoes, exactly 2 are support vectors, one from each class, and each sits precisely on its margin line (signed score \(+1\) and \(-1\)):

```r
fit$index                  # which training rows are the support vectors
#> [1] 14 30

# each support vector sits on a margin line: its signed score is exactly +/- 1
dv <- attr(predict(fit, tomatoes, decision.values = TRUE), "decision.values")[, 1]
round(dv[fit$index], 3)
#> 14 30
#>  1 -1
```

Just 2 tomatoes out of 40 decide where the boundary goes. The other 38 are, as far as the SVM is concerned, along for the ride.

=== step === concept
::eyebrow Proof by experiment
## Only the support vectors matter

That claim is strong enough to be worth testing rather than trusting. If only the support vectors set the boundary, then two things must be true: moving a tomato that is **not** a support vector should change nothing, and moving one that **is** a support vector should change the boundary. Let us check both on the real fit.

```r
# 1. Drop a tomato buried deep inside the ripe cloud (row 11, NOT a support vector):
fit_drop <- svm(grade ~ redness + give, data = tomatoes[-11, ],
                kernel = "linear", cost = 10, scale = FALSE)
drop(t(fit_drop$coefs) %*% fit_drop$SV)     # the weight vector: unchanged
#> redness    give
#>   0.425   0.583
```

Byte-for-byte the same weight vector, \((0.425, 0.583)\). Deleting an interior tomato did not nudge the boundary at all. Now move support vector row 14 about 1.6 units toward the other class, into the street, and refit:

```r
# 2. Push support vector row 14 toward the unripe corner, then refit:
moved <- tomatoes
moved[14, c("redness", "give")] <- moved[14, c("redness", "give")] - 1.6
fit_move <- svm(grade ~ redness + give, data = moved,
                kernel = "linear", cost = 10, scale = FALSE)
drop(t(fit_move$coefs) %*% fit_move$SV)      # the weight vector: it shifted
#> redness    give
#>   0.674   3.083
2 / sqrt(sum(drop(t(fit_move$coefs) %*% fit_move$SV)^2))
#> [1] 0.634
```

The weight vector swung from \((0.425, 0.583)\) to \((0.674, 3.083)\), and the street collapsed from 2.77 units wide to 0.63. One support vector leaned on the boundary and dragged it right across; one interior point vanished and the boundary never noticed.

=== step === quiz
::eyebrow Check yourself
## Nudge an interior tomato

Your fitted SVM has 2 support vectors. You reach into the ripe cloud and slide a tomato that is sitting comfortably deep inside it (not one of the support vectors) a little further from the boundary. What happens to the decision boundary?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The boundary shifts toward the tomato you moved ::no Only the support vectors pull on the boundary. A tomato deep in its own cloud is not one of them, so it exerts no pull at all.
- The margin gets wider because that side now looks denser ::no The margin is set purely by the closest point of each class. A point deep inside is not the closest one, so neither margin line moves.
- Nothing at all, because an interior point is not a support vector ::ok Exactly. You saw it on real numbers: dropping a non-support-vector left the weight vector byte-identical. Only the points resting on the margin lines fix the boundary.

=== step === tryit
::eyebrow Your turn
## Fit a linear SVM in R

Time to drive it. In R, the `e1071` package fits an SVM with `svm()`. A fresh session starts empty, so the batch is rebuilt first. Fill in the `kernel` argument so it fits a straight (linear) boundary, then read how many support vectors it used.

```r
library(e1071)
set.seed(1)
n <- 20
ripe   <- data.frame(redness = rnorm(n, 7.2, 0.7), give = rnorm(n, 6.8, 0.7), grade = "ripe")
unripe <- data.frame(redness = rnorm(n, 3.4, 0.7), give = rnorm(n, 3.0, 0.7), grade = "unripe")
tomatoes <- rbind(ripe, unripe)
tomatoes$grade <- factor(tomatoes$grade)

fit <- svm(grade ~ redness + give, data = tomatoes,
           kernel = ____, cost = 10, scale = FALSE)
fit
```
::check {"regex":"kernel\\s*=\\s*.?linear","gate":true,"difficulty":"intermediate","ok":"That fits a straight-line boundary. The printout reports Number of Support Vectors: 2, the two tomatoes the margin rests on.","no":"Give kernel the value \"linear\" (in quotes): kernel = \"linear\"."}
::solution
```r
fit <- svm(grade ~ redness + give, data = tomatoes,
           kernel = "linear", cost = 10, scale = FALSE)
fit
#> Parameters:
#>    SVM-Type:  C-classification
#>  SVM-Kernel:  linear
#>        cost:  10
#> Number of Support Vectors:  2
```

=== step === concept
::eyebrow When it is not so clean
## The soft margin, for classes that overlap

Our batch had a tidy empty strip between ripe and unripe. Real crops are messier: a few firm-but-red tomatoes and a few soft-but-green ones land in each other's territory, and then **no straight line can separate them**. The hard rule "every point outside the street" has no solution.

The fix is to allow a few violations, but to charge for them. We give each tomato a **slack** \(\xi_i \ge 0\) (the Greek letter xi) that measures how far it intrudes past its margin, and loosen the constraint to \(y_i(w^\top x_i + b) \ge 1 - \xi_i\). A tomato with \(\xi_i = 0\) is well-behaved; \(0 < \xi_i < 1\) means it slipped inside the street but is still on the correct side; \(\xi_i > 1\) means it is outright misclassified. We then minimize

\[ \tfrac{1}{2}\lVert w \rVert^2 \; + \; C \sum_i \xi_i \]

The first term still wants a wide street. The second term, weighted by the **cost** \(C\), adds up all the trespassing and penalizes it. So \(C\) is a dial. A **large** \(C\) makes each violation expensive, so the optimizer shrinks the street to avoid them, hugging the data tightly. A **small** \(C\) shrugs off violations in exchange for a wider, calmer margin. Watch the dial turn on a genuinely overlapping crop:

```r
library(e1071)
set.seed(7)
m <- 25
ov <- data.frame(
  redness = c(rnorm(m, 6.2, 1.1), rnorm(m, 4.3, 1.1)),
  give    = c(rnorm(m, 5.8, 1.1), rnorm(m, 3.8, 1.1)),
  grade   = factor(rep(c("ripe", "unripe"), each = m)))

for (C in c(0.1, 10)) {
  f  <- svm(grade ~ redness + give, data = ov, kernel = "linear", cost = C, scale = FALSE)
  w  <- drop(t(f$coefs) %*% f$SV)
  cat(sprintf("cost = %-4g  support vectors = %2d  street width = %.2f  train acc = %.3f\n",
              C, f$tot.nSV, 2 / sqrt(sum(w^2)), mean(predict(f, ov) == ov$grade)))
}
#> cost = 0.1   support vectors = 17  street width = 2.29  train acc = 0.920
#> cost = 10    support vectors =  8  street width = 1.59  train acc = 0.940
```

Small \(C\) gives a wide street held up by many support vectors and a slightly lower training score; large \(C\) narrows the street, leans on fewer points, and squeezes out a bit more training accuracy. Which is better on **new** tomatoes is the bias-variance question, and it is exactly what you tune \(C\) for.

=== step === tryit
::eyebrow Your turn
## Turn the cost dial down

Using the overlapping crop below, fit a very forgiving SVM by setting a small cost, and count its support vectors. Fill in the cost so it equals `0.1`.

```r
library(e1071)
set.seed(7)
m <- 25
ov <- data.frame(
  redness = c(rnorm(m, 6.2, 1.1), rnorm(m, 4.3, 1.1)),
  give    = c(rnorm(m, 5.8, 1.1), rnorm(m, 3.8, 1.1)),
  grade   = factor(rep(c("ripe", "unripe"), each = m)))

soft <- svm(grade ~ redness + give, data = ov,
            kernel = "linear", cost = ____, scale = FALSE)
soft$tot.nSV
```
::check {"regex":"cost\\s*=\\s*0\\.1","gate":true,"difficulty":"intermediate","ok":"A small cost buys a wide, forgiving margin: 17 of the 50 tomatoes end up as support vectors holding that broad street open.","no":"Set the cost to 0.1: cost = 0.1 (the small, forgiving setting)."}
::solution
```r
soft <- svm(grade ~ redness + give, data = ov,
            kernel = "linear", cost = 0.1, scale = FALSE)
soft$tot.nSV
#> [1] 17
```

=== step === quiz
::eyebrow Check yourself
## What does a very large C do?

You crank the cost \(C\) up to a very large value on an overlapping dataset. What is the effect on the boundary?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It forces a narrow margin that fits the training points tightly, so it can overfit and is easily swayed by a single outlier ::ok Right. A large C makes every violation expensive, so the optimizer shrinks the street to avoid them, tracking the training data closely and giving up its safety buffer. A small C does the reverse: a wider, steadier margin.
- It always improves accuracy on new data, because the model fits the training data better ::no Fitting the training data harder is the trap. A tiny margin memorizes quirks and often generalizes worse. This is the bias-variance trade in the high-variance direction.
- It only makes training run faster, without changing the boundary ::no C changes the boundary itself. You watched the street width and the support-vector count both drop as C rose from 0.1 to 10.

=== step === concept
::eyebrow Before you rely on it
## Three things that will bite you

The linear SVM is elegant, but three practical facts decide whether it works in the wild.

- **Standardize your features first.** An SVM measures distance, so a feature with a big numeric range (say income in rupees) drowns out one with a small range (say age in years). Put every feature on a comparable scale before fitting; `svm()` does this by default (`scale = TRUE`), and we only switched it off here so the boundary maths lined up with the raw axes.
- **Outliers can drag a large-C boundary.** Because a support vector on the wrong side pulls hard, one mislabelled or freak tomato can swing a high-cost boundary noticeably. A smaller \(C\) is more robust to it.
- **A straight line is not always enough.** If the ripe tomatoes formed a ring around the unripe ones, no line, at any margin, could separate them. That is the wall this lesson stops at, and the **kernel trick** is what climbs over it: it bends the boundary into curves by lifting the points into a higher-dimensional space where a flat cut works again. Toggle the widget below from Linear to RBF to see a straight boundary fail on looping data and a curved one succeed.

::widget kernel-svm {}

That curved boundary, and the two dials (\(C\) and gamma) that shape it, are Lesson 2.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Cortes and Vapnik (1995), "Support-Vector Networks", Machine Learning 20(3)](https://doi.org/10.1007/BF00994018) - the paper that introduced the soft-margin SVM.
- [An Introduction to Statistical Learning, ch. 9 (free PDF)](https://www.statlearning.com/) - the gentlest rigorous treatment of the maximal margin classifier, support vectors, and the SVM, with R labs.
- [The Elements of Statistical Learning, ch. 12 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - support vector machines with the full optimization and the kernel view.
- [e1071 svm vignette (CRAN)](https://cran.r-project.org/web/packages/e1071/vignettes/svmdoc.pdf) - the package you used here, with its options and examples.

=== step === complete
## Lesson 1 complete

You can now explain the whole chain. Many lines separate two clean classes, and an SVM keeps the one with the **widest street**, because that leaves the most room for a slightly-off new point. That street is written \(w^\top x + b\) with width \(2/\lVert w\rVert\), and training it means minimizing \(\tfrac12\lVert w\rVert^2\) so the margin is as wide as possible. Only a handful of points, the **support vectors** on the margin lines, actually fix the boundary; you proved it by moving one and watching the street collapse. And when classes overlap, the **soft margin** and its cost \(C\) trade margin width against training errors, the SVM's bias-variance dial.

Next, Lesson 2: Kernel SVMs and the kernel trick. You will see how the polynomial and RBF kernels bend the boundary to wrap classes no straight line can separate, and how the two dials \(C\) and gamma trade fit against smoothness.
