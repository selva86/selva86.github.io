---
title: "Advanced Supervised Learning Lesson 1: Support Vector Machines and the Maximum Margin"
catalog_blurb: "How a support vector machine separates classes with the widest possible margin."
description: "See why a support vector machine picks the boundary with the widest margin, meet the support vectors that define it, and fit a linear SVM in R with e1071."
keywords: "support vector machine, SVM, maximum margin, support vectors, hyperplane, linear SVM, e1071, svm in R, soft margin, cost C"
post_type: "LESSON"
curriculum_id: "6.140.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "1"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "Kernel-SVMs-and-the-Kernel-Trick.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 8
## Support Vector Machines and the Maximum Margin

A tomato packing line measures every fruit on two cheap sensors and has to decide, in a blink, ripe or unripe. Plot a batch and the two groups sit in separate corners with an empty strip between them. You could draw all sorts of lines through that strip. A support vector machine picks one specific line: the one that runs down the exact middle of the widest empty gap, as far from both groups as it can get.

The interactive below is a full support vector machine. Its boundary can be a straight line or, with the buttons, a bending curve. The circled points are its **support vectors**, the handful of examples that hold the boundary in place. This lesson builds the straight-line core (the margin and those support vectors); Lesson 2 adds the bending.

By the end of this lesson you will be able to:

- Explain why many lines can split two clean groups, yet the widest-margin line generalizes best
- Define the margin and the maximum-margin classifier, and identify the support vectors that set it
- Fit a linear SVM in R with `svm()`, count its support vectors, and classify new cases

**Prerequisites:** you can fit and read a simple classifier and know the difference between a training and a test set, you can read a scatter plot, and you have seen `factor()`.

::widget kernel-svm {}

=== step === concept
::eyebrow The problem
## Two clean groups, and too many lines

Let us build the packing line's data so you can see the choice for yourself. Twenty ripe tomatoes read high on **redness** (a 0 to 10 colour score) and high on **give** (millimetres the skin dents under a standard press, so softer means riper). Twenty unripe ones read low on both. Each lesson runs in a fresh R session, so we create the data right here.

```r
library(e1071)
library(ggplot2)

set.seed(1)
n <- 20
ripe   <- data.frame(redness = round(rnorm(n, 7.6, 0.6), 1),
                     give    = round(rnorm(n, 6.6, 0.6), 1), grade = "ripe")
unripe <- data.frame(redness = round(rnorm(n, 3.6, 0.6), 1),
                     give    = round(rnorm(n, 3.2, 0.6), 1), grade = "unripe")
tomatoes <- rbind(ripe, unripe)
tomatoes$grade <- factor(tomatoes$grade)
head(tomatoes, 3)
#>   redness give grade
#> 1     7.2  7.2  ripe
#> 2     7.7  7.1  ripe
#> 3     7.1  6.6  ripe
```

The two groups are **linearly separable**: a single straight line can put every ripe tomato on one side and every unripe one on the other. The trouble is that *many* lines do this. The three dashed lines below all score a perfect zero errors on the training tomatoes, yet they clearly are not the same rule.

```r
ggplot(tomatoes, aes(redness, give, colour = grade)) +
  geom_point(size = 3) +
  geom_abline(slope = -1.18, intercept = 11.5, linetype = "dashed") +
  geom_abline(slope = -0.90, intercept = 10.2, linetype = "dashed") +
  geom_abline(slope = -1.60, intercept = 13.6, linetype = "dashed") +
  labs(title = "Three boundaries, all correct on the training tomatoes")
```

Zero training errors tells you nothing about which line to trust on the *next* tomato. A line that skims right along the edge of the ripe cloud will misjudge the first slightly-off fruit that drifts toward it. We need a principled way to pick.

=== step === concept
::eyebrow The idea
## The best boundary is the middle of the widest street

Picture driving a car down a road between two rows of parked cars. You do not hug either side; you steer down the centre, leaving the most room on both sides for a wobble. A support vector machine chooses its boundary the same way: it finds the widest empty **street** it can lay between the two groups and puts the boundary down the middle. The half-width of that street is the **margin**.

Here is the same idea written precisely. A straight boundary is the set of points \(x = (x_1, x_2)\) that satisfy

\[ w \cdot x + b = 0, \qquad w \cdot x = w_1 x_1 + w_2 x_2. \]

Read that slowly. \(w = (w_1, w_2)\) is the **weight vector**, a direction that points straight across the boundary (perpendicular to it). \(b\) is the **offset**, a single number that slides the boundary toward one group or the other. The expression \(w \cdot x\) is the **dot product**, just the weighted sum \(w_1 x_1 + w_2 x_2\). To classify a tomato you plug in its two readings and check the sign: predict ripe when \(w \cdot x + b > 0\) and unripe when it is negative.

We are free to rescale \(w\) and \(b\) without moving the boundary, so we fix the scale by insisting the closest tomato on each side lands exactly on \(w \cdot x + b = +1\) or \(w \cdot x + b = -1\). With that convention the width of the street works out to \(\frac{2}{\lVert w \rVert}\), where \(\lVert w \rVert = \sqrt{w_1^2 + w_2^2}\) is the length of the weight vector. Making the street as wide as possible therefore means making \(\lVert w \rVert\) as *small* as possible:

\[ \min_{w,\,b} \tfrac{1}{2}\lVert w \rVert^2 \quad\text{subject to}\quad y_i\,(w \cdot x_i + b) \ge 1 \ \text{ for every tomato } i, \]

where \(y_i = +1\) for a ripe tomato and \(y_i = -1\) for an unripe one. The constraint just says every tomato must sit on its own side of the street with room to spare. Let us solve exactly that on the real data. The `svm()` fit hands the answer back in pieces: `fit$SV` is the set of borderline tomatoes it kept and `fit$coefs` their signed weights, so we combine those to rebuild the weight vector \(w\), and read the offset \(b\) straight off the fit.

```r
fit <- svm(grade ~ redness + give, data = tomatoes,
           kernel = "linear", cost = 10, scale = FALSE)

w <- drop(t(fit$coefs) %*% fit$SV)   # the weight vector (redness, give)
b <- -fit$rho                        # the offset
w
#> redness    give
#>   0.476   0.454
round(b, 3)
#> [1] -4.994
length(fit$index)                    # how many points define the boundary?
#> [1] 2
```

```r
slope <- -w["redness"] / w["give"]
svs   <- tomatoes[fit$index, ]       # the support vectors, to circle them

ggplot(tomatoes, aes(redness, give, colour = grade)) +
  geom_abline(slope = slope, intercept =  -b      / w["give"]) +                    # boundary
  geom_abline(slope = slope, intercept = ( 1 - b) / w["give"], linetype = "dashed") + # +1 margin
  geom_abline(slope = slope, intercept = (-1 - b) / w["give"], linetype = "dashed") + # -1 margin
  geom_point(size = 3) +
  geom_point(data = svs, shape = 21, size = 6, stroke = 1.3, colour = "black") +
  labs(title = "The maximum-margin boundary (solid) and its street (dashed)")
```

The solid line is the boundary; the two dashed lines are the edges of the street. Notice the picture chose the *most centred* of all the separating lines, and that the whole thing rests on just the ringed points.

=== step === quiz
::eyebrow Check yourself
## Which boundary would you trust?

Boundary A skims right along the edge of the ripe cloud. Boundary B sits in the middle of the empty gap with a wide margin on both sides. Both make **zero** errors on the training tomatoes. A new, slightly-overripe tomato arrives a little greener and firmer than usual, drifting toward the gap. Which boundary is more likely to still label it correctly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Boundary B, because a wide margin leaves room for a new point to vary before it crosses the line ::ok Right. Both fit the training data perfectly, so training accuracy cannot separate them. The wider margin is a buffer against exactly this kind of drift, which is why the maximum-margin choice generalizes better.
- Boundary A, because hugging the ripe cloud fits the training tomatoes more tightly ::no A tight fit to the training points is what fails on new data. A boundary skimming the ripe cloud has no room to spare, so the first fruit that drifts toward it gets misjudged.
- Neither, since both had zero training errors they must behave identically on new data ::no Equal training accuracy, different margins. The margin is precisely the thing that distinguishes them on unseen tomatoes.

=== step === widget
::eyebrow The key insight
## Support vectors: the points that hold up the boundary

Look again at the fit: out of forty tomatoes, only **2** determined the boundary. Those two, one ripe and one unripe, are the closest fruit to the street on each side. They are the **support vectors**.

The maths says exactly why. The constraint \(y_i\,(w \cdot x_i + b) \ge 1\) is a strict inequality for tomatoes comfortably on their own side, but it holds with **equality**, \(y_i\,(w \cdot x_i + b) = 1\), for the points sitting right on a margin edge. Only those touching points enter the solution. In fact the weight vector comes out as a weighted sum of the support vectors alone,

\[ w = \sum_{i \,\in\, \text{SV}} \alpha_i\, y_i\, x_i, \qquad \alpha_i > 0 \ \text{only for support vectors}, \]

and \(\alpha_i = 0\) for every other tomato. Here \(\alpha_i\) is the weight the fit assigns to tomato \(i\). Since the non-support-vectors are multiplied by zero, they literally drop out of the formula: you could delete or shove any of them (as long as it stays on its side of the street) and the boundary would not budge.

[KEY INSIGHT]
An SVM boundary depends only on a few borderline points. This is the opposite of a regression line, where every point tugs on the fit. Drag the buttons below and watch the circled support vectors: they are the only examples the boundary actually leans on.

::widget kernel-svm {}

This interactive uses a different pair of measurements from our tomatoes (an inner group wrapped by an outer ring), but the three things to watch are the same everywhere: the boundary, the margin around it, and the circled support vectors that pin it in place. Keep it on **Linear** for now; the curved kernels are Lesson 2.

=== step === tryit
::eyebrow In R
## Fit the boundary yourself

The `svm()` function from the `e1071` package fits the whole thing for you. The `kernel = "linear"` argument asks for a straight boundary, which is the maximum-margin classifier we just derived. Fill in the blank, then read how many support vectors hold up the result.

```r
fit <- svm(grade ~ redness + give, data = tomatoes,
           kernel = ____, cost = 10, scale = FALSE)
length(fit$index)   # support vectors that define the boundary
```
::check {"regex":"kernel\\s*=\\s*\\S*linear","gate":true,"difficulty":"intermediate","ok":"That fits the linear (maximum-margin) SVM. It leans on just 2 support vectors here.","no":"Ask for a straight boundary with kernel = \"linear\" (a string, in quotes)."}
::solution
```r
fit <- svm(grade ~ redness + give, data = tomatoes,
           kernel = "linear", cost = 10, scale = FALSE)
length(fit$index)
#> [1] 2

# use the fitted rule on two new tomatoes
new_tomatoes <- data.frame(redness = c(8.0, 4.0), give = c(6.8, 3.0))
predict(fit, newdata = new_tomatoes)
#>      1      2
#>   ripe unripe
#> Levels: ripe unripe
```

Two support vectors, and the fitted rule cleanly calls a red, soft tomato ripe and a green, firm one unripe. That is the entire model: a line, defined by two points, that sorts the whole conveyor.

=== step === quiz
::eyebrow Check yourself
## Move a point that is not a support vector

Your fit leans on 2 support vectors, the two tomatoes nearest the boundary. Now you edit a **different** tomato, one sitting deep inside the ripe cloud far from the street, and push it even further into ripe territory. You refit. What happens to the boundary?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Nothing changes: only the support vectors on the margin edges set the boundary, and this point is not one of them ::ok Exactly. Its weight in the solution is zero, so it drops out of the formula for the boundary. Moving it (while it stays on its side) leaves the fit untouched.
- The boundary shifts toward the moved point, because every training row pulls on the fit ::no That describes an ordinary least-squares regression, where every point has leverage. An SVM boundary depends only on its support vectors.
- The margin widens, because the ripe cloud is now more spread out ::no The margin is set by the closest point of each class. A point moving further from the street does not touch the closest points, so the margin is unchanged.

=== step === concept
::eyebrow The honest limits
## When the classes overlap: the soft margin

Real tomatoes are messier than our clean demo. Some ripe fruit is oddly firm, some unripe fruit oddly red, and the two clouds bleed into each other with no perfectly empty street to find. A hard demand that every point sit outside the margin would then have no solution at all.

The fix is the **soft margin**. We give each tomato a little slack \(\xi_i \ge 0\) (pronounced "ksi"), the amount by which it is allowed to intrude into, or across, the street, and we relax the constraint to \(y_i\,(w \cdot x_i + b) \ge 1 - \xi_i\). We then pay for that slack:

\[ \min_{w,\,b,\,\xi} \ \tfrac{1}{2}\lVert w \rVert^2 + C \sum_i \xi_i, \qquad \xi_i \ge 0. \]

The **cost** \(C\) sets the exchange rate between a wide margin and letting points misbehave. A large \(C\) punishes every violation hard, so the fit keeps a narrow, strict margin. A small \(C\) shrugs off violations to buy a wider, calmer margin. Watch it on our data.

```r
# lower cost = wider, more forgiving margin = more support vectors
low_cost  <- svm(grade ~ redness + give, data = tomatoes, kernel = "linear",
                 cost = 0.1, scale = FALSE)
high_cost <- svm(grade ~ redness + give, data = tomatoes, kernel = "linear",
                 cost = 10,  scale = FALSE)
c(cost_0.1 = length(low_cost$index), cost_10 = length(high_cost$index))
#> cost_0.1  cost_10
#>        6        2
```

Dropping \(C\) from 10 to 0.1 widened the street, so more tomatoes ended up on or inside it and became support vectors (6 instead of 2). Choosing \(C\) well, and stretching the boundary into curves when a straight line cannot separate the classes at all, is the whole subject of Lesson 2. To preview the curved case, flip the interactive on the cover to Polynomial or RBF.

=== step === quiz
::eyebrow Check yourself
## What did lowering the cost do?

You dropped the cost `C` from 10 to 0.1 and refit. The number of support vectors climbed from 2 to 6. What did lowering `C` do to the model?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It widened the margin and tolerated more violations, so more points now sit on or inside the street and count as support vectors ::ok Right. A small C values a wide, forgiving margin over strictly separating every point, so more tomatoes land on or inside the street and enter the solution.
- It made the margin stricter, forcing the boundary to fit every point exactly ::no That is a *large* C. A small C is the forgiving, wide-margin setting; the rising support-vector count is the giveaway.
- It deleted 4 tomatoes from the training data ::no No rows are removed. C only changes the penalty on margin violations, which is why more points end up as support vectors, not fewer rows of data.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [An Introduction to Statistical Learning, ch. 9 (free PDF)](https://www.statlearning.com/) - the gentlest full treatment of the maximum-margin classifier and SVMs.
- [The Elements of Statistical Learning, ch. 12 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the deeper theory, including the optimization and the role of C.
- [Cortes and Vapnik (1995), Support-Vector Networks](https://doi.org/10.1007/BF00994018) - the paper that introduced the soft-margin SVM.
- [e1071 on CRAN (the svm reference manual)](https://cran.r-project.org/package=e1071) - the package you used here; the manual documents every argument of `svm()`.

=== step === complete
## Lesson 1 complete

You saw that many lines can separate two clean groups, and that the support vector machine picks the one down the middle of the widest street. You defined the margin as \(\frac{2}{\lVert w \rVert}\), met the handful of support vectors that alone determine the boundary, fit a linear SVM in R, and learned how the cost `C` softens the margin when classes overlap.

Next, Lesson 2: Kernel SVMs and the kernel trick. You will see how polynomial and RBF kernels bend a straight boundary into a curve that can wrap one class inside another, and how the two knobs `C` and `gamma` trade a tight fit against a smooth one.
