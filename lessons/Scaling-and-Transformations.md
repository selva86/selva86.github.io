---
title: "Feature Engineering Lesson 3: Scaling and Transformations"
catalog_blurb: "Put features on a common scale and tame skew so scale-sensitive models behave."
description: "Scale and transform numeric features in R: standardize and normalize so distance and penalized models behave, and use log, Box-Cox, and Yeo-Johnson to tame skew, leak-free."
keywords: "feature scaling, standardization, z-score, normalization, min-max, log transform, Box-Cox, Yeo-Johnson, skewness, data leakage, feature engineering, R"
post_type: "LESSON"
curriculum_id: "6.60.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "3"
course_total: "7"
course_landing: "R-Feature-Engineering-Course.html"
course_next: "Interaction-and-Spline-Features.html"
course_prev: "Target-Encoding-Without-Leakage.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Scaling and Transformations

In Lesson 2 you turned Maya's high-cardinality `neighborhood` column into a leak-free number. Every column in her home-price table is a number now. That is not the finish line, because two numeric columns can be *numerically honest* and still trip a model up in two very different ways.

The first is **scale**. Maya's `sqft` runs into the thousands while `beds` runs from 1 to 5, and a model that measures distance will hear only the loud feature. The second is **shape**: a `lot_size` column with a long right tail distorts the very models that are sensitive to scale. This lesson fixes both, carefully, and keeps the fix leak-free.

By the end you will be able to:

- Explain why unequal feature scales let a big-unit feature drown out the others, and why tree models shrug it off
- Standardize and normalize a feature in R, and read what the numbers become
- Reshape a skewed feature with log, Box-Cox, or Yeo-Johnson, and say what each one requires
- Fit every scaler and transform on the training data alone, so none of it leaks

**Prerequisites:** you can run R and read its output, and you know what a train/test split is and why leakage matters (from [Target Encoding Without Leakage](Target-Encoding-Without-Leakage.html) and [Train, Validation, Test, and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)).

Drag the toggle below to feel the "shape" half of the lesson: a lopsided feature pulled toward symmetry.

::widget transform-shaper {}

=== step === concept
::eyebrow Where we are
## Everything is a number, on wildly different scales

Each lesson runs in a fresh R session, so let us rebuild Maya's home data right here and look at the numbers we now have to work with.

```r
set.seed(1)
n <- 60
homes <- data.frame(
  sqft      = pmax(round(rnorm(n, 1900, 650)), 500),  # living area, sq ft
  beds      = sample(1:5, n, TRUE),                   # bedrooms
  baths     = sample(1:4, n, TRUE),                   # bathrooms
  age       = round(runif(n, 0, 100)),                # years since built
  lot_size  = pmax(round(rexp(n, 1/6000)), 400),      # lot area, sq ft (long right tail)
  price_gap = round(rnorm(n, 0, 20), 1)               # list minus expected price, $1000s
)

# The min and max of every column, side by side
sapply(homes, function(x) round(range(x), 1))
#>      sqft beds baths age lot_size price_gap
#> [1,]  500    1     1   3      400     -58.1
#> [2,] 3187    5     4 100    27516      50.1
```

Look at how different the columns are. `sqft` is measured in the thousands (it averages about 1,971, with a typical spread of 554), `beds` lives between 1 and 5 (average 2.85, spread about 1.35), `age` sits in the tens, and `lot_size` stretches from 400 all the way to 27,516 with most homes down at the low end. Same table, six numeric columns, and no two of them speak in the same units. The next step shows why that is a problem.

=== step === concept
::eyebrow The problem
## A distance is deaf to the small-unit feature

Maya wants to find homes *comparable* to one she is pricing. The natural tool is distance: two homes are similar if the gap between their feature vectors is small. For homes \(a\) and \(b\) described by numeric features, the **Euclidean distance** is

\[ d(a, b) \;=\; \sqrt{\sum_{j} (a_j - b_j)^2}, \]

where \(a_j\) and \(b_j\) are the \(j\)-th feature of each home and the sum runs over the features. It is the straight-line distance you would measure with a ruler if each feature were an axis.

Now watch what that ruler does when one axis is measured in thousands and the other in single digits. Take a reference home and two candidates.

```r
euclid <- function(a, b) sqrt(sum((a - b)^2))

ref   <- c(sqft = 2000, beds = 3)   # the home Maya is matching
homeA <- c(sqft = 2010, beds = 5)   # 10 sq ft bigger, but a 5-bed home
homeB <- c(sqft = 2400, beds = 3)   # 400 sq ft bigger, same 3 beds

round(c(A = euclid(ref, homeA), B = euclid(ref, homeB)), 2)
#>     A     B
#>  10.2 400.0
```

The distance calls `homeA` almost identical to the reference (10.2) and `homeB` far away (400.0). But look at the homes: `homeA` is a **5-bedroom** house, two bedrooms more than the reference, while `homeB` has the **same 3 bedrooms** and is only a little larger. Any person would call `homeB` the closer match. The distance got it backwards, because the 400 sq ft gap swamps everything: two whole bedrooms contribute only \(2^2 = 4\) to the sum under the square root, next to \(400^2 = 160{,}000\) from `sqft`. The `beds` feature is effectively silent.

=== step === quiz
::eyebrow Check yourself
## Why is the ranking wrong?

Before any scaling, Maya's distance says `homeA` (2010 sq ft, 5 beds) is far closer to the reference (2000 sq ft, 3 beds) than `homeB` (2400 sq ft, 3 beds). Why is that ranking misleading?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It is not misleading: `homeA` really is the most similar home, since its square footage is almost identical ::no Square footage is only one feature. `homeA` has two more bedrooms than the reference, a large real difference the distance ignored.
- Because `sqft` spans thousands while `beds` spans single digits, the `sqft` gap dominates the sum and the two-bedroom difference barely registers ::ok Exactly. The feature with the larger units controls the distance regardless of how important it actually is, so `beds` is drowned out. Putting both features on the same scale is the fix.
- Because distance should be measured on `price`, not on `sqft` and `beds` ::no Distance on the input features is exactly how nearest-neighbor matching works; the trouble is purely that the features are on different scales.

=== step === concept
::eyebrow The fix, part 1
## Standardization: measure every feature in its own standard deviations

The cure is to strip each feature of its units before comparing. **Standardization**, also called the **z-score**, does this by re-expressing every value as a number of standard deviations from its own mean. For a feature \(x\),

\[ z \;=\; \frac{x - \mu}{\sigma}, \]

where \(\mu\) (mu) is the feature's mean, its center, and \(\sigma\) (sigma) is its standard deviation, the typical distance of a value from that mean. Subtracting \(\mu\) **centers** the feature on 0; dividing by \(\sigma\) **scales** it so a spread of one standard deviation equals one unit. The result \(z\) carries no units at all: it just says how far above or below average a value sits.

A worked value makes it concrete. A 2,600 sq ft home, in Maya's market where \(\mu = 1{,}971\) and \(\sigma = 554\), standardizes to \(z = (2600 - 1971)/554 = 1.14\). It is 1.14 standard deviations above the average size. Do the same to `beds` and a 4-bed home lands at \(z = (4 - 2.85)/1.35 = 0.85\). Both are now "about one standard deviation above average," directly comparable, whatever their original units were.

::widget table-transform {"code":"homes$z_sqft <- (sqft - mean(sqft)) / sd(sqft)","caption":"Standardizing subtracts the mean of the whole column and divides by its standard deviation (computed over all 60 homes, not just these four rows). Square footage in the thousands and bedrooms in single digits both collapse onto the same small, unitless scale, mean 0 and standard deviation 1 across the full column, so a distance now weighs them evenly.","before":{"cols":["sqft","beds"],"rows":[[900,1],[1900,3],[2600,4],[3400,5]]},"after":{"cols":["sqft","beds","z_sqft","z_beds"],"rows":[[900,1,-1.93,-1.37],[1900,3,-0.13,0.11],[2600,4,1.14,0.85],[3400,5,2.58,1.59]]}}

Does standardizing actually fix Maya's distance? Rescale the two features by their spread and measure again.

```r
sigma <- sapply(homes[c("sqft", "beds")], sd)
round(sigma, 3)
#>     sqft     beds
#>  554.049    1.351

round(c(A = euclid(ref / sigma, homeA / sigma),
        B = euclid(ref / sigma, homeB / sigma)), 3)
#>     A     B
#> 1.481 0.722
```

The ranking flips. Once each feature is divided by its own spread, `homeB` (0.722) is the closer match and `homeA` (1.481) is further away, exactly the sensible answer. The two-bedroom gap now counts as much as it should.

=== step === tryit
::eyebrow In R
## Standardize a whole table in one call

Doing that by hand for every column would be tedious. Base R gives you `scale()`, which centers and scales each column of a matrix or data frame in one call. Fill in the blank so the three numeric columns come out with mean 0 and standard deviation 1.

```r
num <- homes[c("sqft", "beds", "age")]

z <- ____(num)          # center and scale every column

round(colMeans(z), 6)   # each column mean should be 0
round(apply(z, 2, sd), 3)   # each column sd should be 1
```
::check {"regex":"scale\\(","gate":true,"difficulty":"intermediate","ok":"That is standardization in one call: scale() subtracts each column mean and divides by each column sd, so every column comes out centered at 0 with sd 1. It also stashes the means and sds it used in the result attributes, which you will need at prediction time.","no":"Use scale(num). It centers and scales each column for you, turning every feature into z-scores."}
::solution
```r
num <- homes[c("sqft", "beds", "age")]

z <- scale(num)

round(colMeans(z), 6)
#>    sqft    beds     age
#>       0       0       0
round(apply(z, 2, sd), 3)
#> sqft beds  age
#>    1    1    1
```

=== step === concept
::eyebrow The fix, part 1b
## Min-max normalization: squeeze into a fixed range

Standardization is the usual default, but it is not the only way to put features on a common scale. **Min-max normalization** rescales a feature into a fixed interval, almost always \([0, 1]\):

\[ x' \;=\; \frac{x - \min(x)}{\max(x) - \min(x)}. \]

The smallest value maps to 0, the largest to 1, and everything else lands proportionally in between. It is handy when a model expects bounded inputs (some neural nets and image pipelines do) or when you simply want every feature on an identical 0-to-1 ruler.

```r
minmax <- function(x) (x - min(x)) / (max(x) - min(x))

head(sapply(homes[c("sqft", "beds", "age")], minmax), 4)
#>       sqft beds   age
#> [1,] 0.370 0.25 0.608
#> [2,] 0.565 0.75 0.144
#> [3,] 0.319 0.50 0.031
#> [4,] 0.907 1.00 0.082
```

The two methods differ in one important way. Standardization uses the mean and standard deviation, which absorb an outlier gracefully; min-max uses the minimum and maximum, so a **single extreme value stretches the whole range and crushes every other point toward 0**. If Maya has one mansion at 27,516 sq ft of lot, min-max will pin almost every normal home near 0. When a feature has heavy outliers, prefer standardization, or reshape the feature first, which is where the second half of this lesson goes.

=== step === concept
::eyebrow Who needs this
## Which models care about scale, and which do not

Scaling is not busywork you do to every model. It matters for a specific, predictable set of methods, and it is pointless for another set. Knowing which is which saves effort and prevents mistakes.

| Model family | Needs scaling? | Why |
|---|---|---|
| k-nearest neighbors, k-means | Yes | they measure distance, which the largest-unit feature dominates (the problem you just saw) |
| Ridge and lasso (penalized regression) | Yes | the penalty compares coefficient sizes across features |
| Neural nets, anything trained by gradient descent | Yes | uneven scales stretch the loss surface, making training slow and unstable |
| PCA | Yes | it chases directions of maximum variance, which a large-unit feature inflates |
| Decision tree, random forest, gradient boosting | No | they split on a threshold using only each feature's order |

The penalty row is worth seeing in symbols. A ridge model minimizes

\[ \sum_i (y_i - \hat{y}_i)^2 \;+\; \lambda \sum_j \beta_j^2, \]

where the second term \(\lambda \sum_j \beta_j^2\) adds up the squared coefficients \(\beta_j\) and \(\lambda\) controls how hard they are pushed toward 0. A feature measured in tiny units needs a large coefficient to have any effect, so the penalty punishes it more heavily than an identical feature in large units. That is an arbitrary bias, and standardizing removes it.

Trees are the clean exception. A tree only ever asks "is this feature above or below some threshold?", which depends only on the **order** of the values, not their scale. Any per-feature rescaling that preserves order (standardizing, min-max, dividing by 1,000) leaves every split, and therefore every prediction, untouched.

```r
raw    <- homes$sqft
scaled <- scale(homes$sqft)          # standardized version

# a tree uses only the ORDER of a feature to pick splits, and order is unchanged
identical(order(raw), order(scaled))
#> [1] TRUE
```

=== step === quiz
::eyebrow Check yourself
## Does the forest need scaling?

Maya swaps her nearest-neighbor search for a **random forest** that predicts price from `sqft`, `beds`, and `age`. Must she standardize those features first?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, you should always standardize features before fitting any model ::no Standardizing never hurts a tree, but it is not needed and not "always" required. Distance and penalized models need it; tree ensembles do not.
- No: a forest splits each feature at thresholds and uses only the order of the values, which standardizing does not change, so it makes no difference ::ok Right. Random forests, single trees, and gradient boosting are invariant to any order-preserving rescaling of a feature, so scaling them is optional and changes nothing.
- Only if `sqft` and `beds` are correlated with each other ::no Correlation between features is a separate issue. A tree ensemble is unaffected by feature scale whether or not the features are correlated.

=== step === concept
::eyebrow The fix, part 2
## Scaling moves a feature; it does not reshape it

Standardizing slides a feature to mean 0 and squeezes it to spread 1, but it does nothing to the feature's **shape**. If the values were bunched at the low end with a long tail stretching right, they are still bunched with a long tail after standardizing, just recentered. Shape is a separate problem, and it needs a separate tool.

We measure shape with **skewness**, the average cubed z-score:

\[ g \;=\; \frac{1}{n} \sum_{i=1}^{n} \left( \frac{x_i - \bar{x}}{s} \right)^3, \]

where \(\bar{x}\) is the mean, \(s\) the standard deviation, and \(n\) the number of values. Cubing keeps the sign: a value far out on the right tail contributes a large positive cube, so a long **right** tail makes \(g\) positive (right-skewed), a long left tail makes it negative, and a symmetric feature gives \(g \approx 0\). Maya's `lot_size` is a textbook right skew.

```r
skewness <- function(x) mean(((x - mean(x)) / sd(x))^3)

round(skewness(homes$lot_size), 3)
#> [1] 2.232
```

A skewness of 2.23 is heavily right-skewed: most lots are ordinary, a handful are enormous, and the mean is dragged toward those few giants. Toggle the transforms in the widget below to watch a right-skewed feature pulled toward symmetry, and see the skewness number fall as it does.

::widget transform-shaper {}

=== step === concept
::eyebrow The simplest reshape
## The log transform pulls in a right tail

The classic fix for a right-skewed, positive feature is the **logarithm**. The log compresses large values far more than small ones: it turns 1, 10, 100, 1000 into 0, 1, 2, 3, so the giant lots that were stretching the tail get pulled sharply inward while the ordinary lots barely move. That is exactly the surgery a right skew needs.

```r
round(c(raw  = skewness(homes$lot_size),
        log  = skewness(log(homes$lot_size)),
        sqrt = skewness(sqrt(homes$lot_size))), 3)
#>    raw    log   sqrt
#>  2.232 -0.578  0.677
```

The log takes `lot_size` from a strong right skew (2.23) to nearly symmetric (-0.58, a mild left lean now). The square root is gentler and lands in between. Which to use is a judgement call, and the next step turns that judgement into a dial.

[WARNING]
The log is only defined for **strictly positive** values: `log(0)` is `-Inf` and `log()` of a negative number is `NaN`. A count feature with zeros needs `log(x + 1)` (often written `log1p(x)`), and a feature that can go negative needs a different transform entirely, the Yeo-Johnson transform coming up shortly.

=== step === quiz
::eyebrow Check yourself
## Does standardizing fix skew?

Maya standardizes `lot_size` (skewness 2.23) with `scale()`, so it now has mean 0 and standard deviation 1. Is the column symmetric now?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No: standardizing only shifts and rescales the values, so the long right tail is exactly as long as before; changing the shape needs a transform like log or Box-Cox ::ok Right. Centering and scaling are linear operations, they slide and stretch the axis but never bend it, so the skewness stays 2.23. Only a nonlinear transform (log, Box-Cox, Yeo-Johnson) reshapes a distribution.
- Yes: forcing a feature to mean 0 and standard deviation 1 also removes its skew ::no This is the most common trap in this lesson. Standardizing changes the numbers on the axis, not the shape of the pile of points, so a skewness of 2.23 stays 2.23.
- Yes, but only because `lot_size` happened to be close to symmetric already ::no It is not: `lot_size` is strongly right-skewed (2.23). And even a symmetric feature would keep its shape under standardizing, which never changes skew.

=== step === concept
::eyebrow One dial for all of them
## Box-Cox: let the data choose the power

The log and the square root are both special cases of one bigger family. **Box-Cox** transforms a positive feature with a single tunable power \(\lambda\) (lambda):

\[ x^{(\lambda)} \;=\; \begin{cases} \dfrac{x^{\lambda} - 1}{\lambda} & \lambda \neq 0, \\[2mm] \ln x & \lambda = 0. \end{cases} \]

Here \(\lambda\) is a number the procedure picks for you: \(\lambda = 1\) leaves the shape essentially unchanged, \(\lambda = 0.5\) acts like a square root, and \(\lambda = 0\) *is* the log (that second line is not a special exception, it is the limit of the first as \(\lambda\) goes to 0). Read the function on two concrete values so the formula is not just symbols.

```r
boxcox_tx <- function(x, lambda) {
  if (lambda == 0) log(x) else (x^lambda - 1) / lambda
}

# lambda = 0.5 is a square-root-like transform; lambda = 0 IS the natural log
round(c(lambda_0.5 = boxcox_tx(16, 0.5), lambda_0 = boxcox_tx(16, 0)), 4)
#> lambda_0.5   lambda_0
#>     6.0000     2.7726
```

At \(\lambda = 0.5\), \((16^{0.5} - 1)/0.5 = (4 - 1)/0.5 = 6\); at \(\lambda = 0\) it falls back to \(\ln 16 = 2.77\). Because \(\lambda\) is free, you can search for the value that makes the feature as symmetric as possible instead of guessing between log and square root.

```r
lambdas <- seq(-1, 1, by = 0.1)
skew_by_lambda <- sapply(lambdas, function(l) abs(skewness(boxcox_tx(homes$lot_size, l))))

best <- lambdas[which.min(skew_by_lambda)]
c(best_lambda = best, skew = round(skewness(boxcox_tx(homes$lot_size, best)), 3))
#> best_lambda        skew
#>       0.200      -0.113
```

The search lands on \(\lambda = 0.2\), which drives skewness to -0.11, closer to symmetric than plain log managed. (In practice `MASS`, `caret`, and `recipes` pick \(\lambda\) by maximum likelihood rather than by minimizing skew, but the idea is the same: let the data choose the power.)

=== step === quiz
::eyebrow Check yourself
## Box-Cox on a signed feature

Maya tries Box-Cox on `price_gap`, the amount each home is listed above or below its expected price. Some homes are underpriced, so the column contains negative values. What happens?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It works fine and returns a symmetric version of `price_gap` ::no Box-Cox cannot touch negatives. Raising a negative base to a fractional power like 0.2 has no real value, so the result is not usable.
- It silently replaces the negative values with 0 before transforming ::no R does no such silent repair; it returns `NaN` for the negatives, which would quietly poison anything downstream.
- It is undefined: Box-Cox raises the value to a power, and a negative base with a fractional power has no real value, so R returns `NaN`. Box-Cox requires strictly positive input ::ok Right. Box-Cox is only defined for \(x > 0\). A feature with zeros or negatives needs the extension in the next step.

=== step === concept
::eyebrow The fix, part 2b
## Yeo-Johnson: Box-Cox for any real number

Real feature columns are not always positive. A `price_gap`, a temperature, a profit, or a change score can be zero or negative, and Box-Cox simply cannot touch them. **Yeo-Johnson** is the extension that can: it applies a Box-Cox-style power to the positive side and a mirrored version to the negative side, so it is defined for every real number while still choosing a single \(\lambda\).

\[ \psi(x, \lambda) = \begin{cases} \dfrac{(x + 1)^{\lambda} - 1}{\lambda} & x \ge 0,\ \lambda \neq 0, \\[2mm] \ln(x + 1) & x \ge 0,\ \lambda = 0, \\[2mm] -\dfrac{(-x + 1)^{2 - \lambda} - 1}{2 - \lambda} & x < 0,\ \lambda \neq 2, \\[2mm] -\ln(-x + 1) & x < 0,\ \lambda = 2. \end{cases} \]

It looks busy, but every branch is a shifted power: the top two handle \(x \ge 0\) (and reduce to `log(x + 1)` at \(\lambda = 0\)), the bottom two mirror that for \(x < 0\). See it succeed exactly where Box-Cox failed.

```r
# Box-Cox on a negative value: undefined
boxcox_tx(-8, 0.5)
#> [1] NaN

yeo_johnson <- function(x, lambda) {
  out <- numeric(length(x))
  pos <- x >= 0
  if (lambda != 0) out[pos]  <- ((x[pos] + 1)^lambda - 1) / lambda
  else             out[pos]  <- log(x[pos] + 1)
  if (lambda != 2) out[!pos] <- -(((-x[!pos] + 1)^(2 - lambda) - 1) / (2 - lambda))
  else             out[!pos] <- -log(-x[!pos] + 1)
  out
}

# a spread of negative, zero, and positive values: all handled
round(yeo_johnson(c(-8, 0, 12), 0.5), 3)
#> [1] -17.333   0.000   5.211
```

Box-Cox returns `NaN` on -8; Yeo-Johnson maps the same negative, zero, and positive values to finite numbers. As a rule of thumb: use log or Box-Cox for strictly positive features, and reach for Yeo-Johnson the moment a feature can be zero or negative.

=== step === concept
::eyebrow The rule that ties it together
## Learn the parameters on training data only

Every tool in this lesson has hidden **parameters** that get learned from data: standardization learns a mean and a standard deviation, min-max learns a minimum and a maximum, Box-Cox and Yeo-Johnson learn a \(\lambda\). Here is the rule that keeps all of them honest, and it is the same rule you met with target encoding in Lesson 2: **learn those parameters on the training set alone, then apply them, unchanged, to the test set.**

If you standardize using the mean and standard deviation of the *whole* dataset, the test rows have leaked their information into the numbers your model trains on, and your measured accuracy is optimistic. The correct move is to fit on train and transform test with the training statistics.

```r
set.seed(7)
idx   <- sample(nrow(homes), floor(0.7 * nrow(homes)))   # 42 train, 18 test
train <- homes[idx, ]
test  <- homes[-idx, ]

mu  <- mean(train$sqft)   # learned on TRAIN only
sdv <- sd(train$sqft)     # learned on TRAIN only

right <- (test$sqft - mu) / sdv                              # correct: train stats on test
wrong <- (test$sqft - mean(test$sqft)) / sd(test$sqft)       # leak: test peeks at itself
round(head(cbind(right = right, wrong = wrong), 5), 3)
#>       right  wrong
#> [1,] -0.778 -1.415
#> [2,]  0.203  0.568
#> [3,]  0.366  0.897
#> [4,] -0.449 -0.750
#> [5,]  0.834  1.842
```

The two columns disagree, and they should. The training homes average 1,985 sq ft while the test homes happen to average 1,936, so scaling the test set with its own mean (the `wrong` column) quietly uses knowledge you are not allowed to have at prediction time. In production you get one row at a time and cannot compute a test mean at all, so the `right` column is the only one that even makes sense.

[KEY INSIGHT]
A scaler or transform is part of your model, not part of your data cleaning. Fit it on train, freeze its parameters, and apply the frozen version to validation, test, and every future row. Tools like `recipes` enforce this for you by learning the transform when the recipe is `prep()`-ed on training data and re-applying it on new data.

=== step === tryit
::eyebrow In R
## Scale the test set without leaking

Put the rule into practice. `train` and `test` already exist from the previous step, and the training mean and standard deviation of `sqft` are computed for you below. Fill in the blank so the **test** homes are standardized with the **training** statistics, not their own.

```r
mu  <- mean(train$sqft)   # both learned on TRAIN only
sdv <- sd(train$sqft)

test_z <- (test$sqft - ____) / sdv   # center the test values with the TRAIN mean

head(round(test_z, 3))
mean(test_z)   # NOT exactly 0, and that is correct
```
::check {"regex":"sqft\\s*-\\s*mu\\b","gate":true,"difficulty":"intermediate","ok":"Correct. You centered the test set with the training mean (mu) and scaled by the training sd, so no test information leaked in. The test mean does not come out to exactly 0, which is the honest sign that the test set was scaled with numbers learned elsewhere.","no":"Fill the blank with mu, the training mean, so the line reads (test$sqft - mu) / sdv. Centering with mean(test$sqft) would let the test set peek at itself and leak."}
::solution
```r
mu  <- mean(train$sqft)
sdv <- sd(train$sqft)

test_z <- (test$sqft - mu) / sdv

head(round(test_z, 3))
#> [1] -0.778  0.203  0.366 -0.449  0.834  0.502
mean(test_z)
#> [1] -0.078
```

=== step === concept
::eyebrow Go deeper
## References

Authoritative places to take this further:

- [Box and Cox (1964), An Analysis of Transformations, JRSS-B](https://doi.org/10.1111/j.2517-6161.1964.tb00553.x) - the original paper that introduced the power-transform family you used here.
- [Yeo and Johnson (2000), A new family of power transformations, Biometrika](https://doi.org/10.1093/biomet/87.4.954) - the extension that handles zero and negative values.
- [Kuhn and Johnson, Feature Engineering and Selection (free book)](http://www.feat.engineering/) - a practitioner treatment of when to center, scale, and transform numeric predictors, and what each choice costs.
- [recipes: step_normalize() reference](https://recipes.tidymodels.org/reference/step_normalize.html) - the tidymodels step that learns center and scale on training data and applies them leak-free (see also step_BoxCox and step_YeoJohnson).

=== step === complete
## Lesson 3 complete

You now handle the two numeric problems that survive encoding. **Scale**: standardize (mean 0, sd 1) or min-max normalize so distance, penalized, gradient, and PCA models weigh every feature evenly, while remembering that trees do not care. **Shape**: log or Box-Cox a strictly positive skewed feature, and Yeo-Johnson one that can be negative, to pull a long tail toward symmetry. And the discipline that keeps all of it trustworthy, learn every parameter on the training set alone and freeze it, is the same leak-free rule that ran through Lesson 2.

Next, Lesson 4: Interaction and Spline Features. You will stop transforming features one at a time and start *combining* them, building products and bent, curved terms that let a simple linear model capture relationships a straight line never could.
