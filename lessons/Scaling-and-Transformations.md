---
title: "Feature Engineering Lesson 3: Scaling and Transformations"
catalog_blurb: "Why some models care about feature scale and shape, and how to fix it."
description: "Center and scale features, tame skew with log and Box-Cox, learn which models need it, and keep every transform leak-free by fitting it on the training data only."
keywords: "feature scaling, standardization, z-score, normalization, log transform, Box-Cox, Yeo-Johnson, skewness, data leakage, feature engineering, R"
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

In Lesson 2 you turned a messy category into one trustworthy number with out-of-fold target encoding. Maya, our real-estate data scientist, now has clean columns. But her numeric features still carry two hidden problems that can quietly wreck a model, and they have nothing to do with the values being wrong.

Her homes are measured in `sqft` (hundreds to thousands), `beds` (1 to 5), and `lot_size` (a few thousand square feet, with a long tail of giant lots). Two features, two different traps: one feature is simply *bigger* than the others, and one feature is *lopsided*. This lesson fixes both, and keeps the fix leak-free, the same discipline you learned last time.

By the end you will be able to:

- Explain why features on different scales let big-unit features hijack distance-based models, and standardize them with the z-score
- Decide which models need scaling (and which, like trees, do not care at all)
- Reshape a skewed feature with log, Box-Cox, or Yeo-Johnson, fitting every transform on the training data alone

**Prerequisites:** you can run R and read its output, and you know what a training set, a test set, and [data leakage](Train-Validation-Test-and-Data-Leakage.html) are (from [Lesson 2](Target-Encoding-Without-Leakage.html)).

::widget transform-shaper {}

=== step === concept
::eyebrow The first problem
## Why scale matters: big features drown out the rest

Maya wants to find homes *similar* to a given one, the engine behind nearest-neighbor models, recommendations, and clustering. "Similar" almost always means *close in distance*. The standard measure is Euclidean distance: for two homes, square the gap in each feature, add the gaps up, take the square root.

Here is the trap. `sqft` differs between homes by hundreds or thousands; `beds` differs by 1 or 2; `age` by a handful of years. Square those gaps and `sqft` contributes a number in the millions while `beds` contributes single digits. The distance becomes, in effect, *the sqft gap and nothing else*. The other features are in the formula, but they cannot be heard.

::widget table-transform {"code":"df %>% mutate(dist = sqrt((sqft-1500)^2 + (beds-3)^2 + (age-20)^2))","caption":"Euclidean distance from home A, on raw features. It is almost entirely the sqft gap: home C sits about 1300 away only because its sqft differs, while beds and age barely move the number.","before":{"cols":["home","sqft","beds","age"],"rows":[["A",1500,3,20],["B",1520,5,65],["C",2800,3,18],["D",980,2,22]]},"after":{"cols":["home","sqft","beds","age","dist"],"rows":[["A",1500,3,20,0],["B",1520,5,65,49],["C",2800,3,18,1300],["D",980,2,22,520]]}}

Let us measure the damage on Maya's full data. Each lesson runs in a fresh R session, so we build her homes inline (run this once). Then we ask: out of the total squared distance from one home to all the others, what share does each feature contribute?

```r
set.seed(2026)
n <- 600
homes <- data.frame(
  sqft     = round(runif(n, 800, 3000)),        # hundreds to thousands
  beds     = sample(1:5, n, replace = TRUE),    # 1 to 5
  baths    = sample(1:4, n, replace = TRUE),    # 1 to 4
  age      = round(runif(n, 0, 80)),            # years
  lot_size = 600 + round(rexp(n, rate = 1/5000))# right-skewed: many small lots, a few huge ones
)
homes$price <- with(homes, 60 + 0.12 * sqft + 18 * beds - 0.6 * age + rnorm(n, 0, 30))
feat <- c("sqft", "beds", "baths", "age")

q     <- homes[1, feat]                                    # one reference home
share <- sapply(feat, function(f) sum((homes[[f]] - q[[f]])^2))
round(share / sum(share) * 100, 1)                         # each feature's % of total squared distance
#>  sqft  beds baths   age
#>  99.8   0.0   0.0   0.2
```

One feature owns 99.8% of the distance. `beds` and `baths`, which a buyer cares about enormously, are statistically invisible. The model is not wrong, it is just listening to the loudest feature.

=== step === concept
::eyebrow The fix
## Standardization: put every feature on one scale

The cure is to express every feature in the *same units*. The most common choice is **standardization** (the z-score): for each value, subtract the feature's mean, then divide by its standard deviation. The result says "how many standard deviations above or below average this value sits."

Write it precisely. For a feature with values \(x\), let \(\mu\) be its mean (the average) and \(\sigma\) its standard deviation (the typical spread around the mean). The standardized value is

\[ z \;=\; \frac{x - \mu}{\sigma}. \]

Subtracting \(\mu\) **centers** the feature so its new mean is 0; dividing by \(\sigma\) **scales** it so its new standard deviation is 1. Every feature, whatever its original units, now lives on the same ruler, roughly from \(-3\) to \(3\). A close cousin is **min-max normalization**, which squeezes a feature into the range \([0, 1]\):

\[ x' \;=\; \frac{x - \min(x)}{\max(x) - \min(x)}. \]

Use the z-score by default (it tolerates outliers better and suits most models); reach for min-max when a method needs bounded inputs, such as image pixels or some neural nets.

::widget table-transform {"code":"df %>% mutate(sqft_z = (sqft-mean(sqft))/sd(sqft), age_z = (age-mean(age))/sd(age))","caption":"Standardizing replaces a value with how many standard deviations it sits from its column mean. The new sqft_z and age_z columns share one scale, so neither feature can dominate a distance.","before":{"cols":["home","sqft","beds","age"],"rows":[["A",1500,3,20],["B",1520,5,65],["C",2800,3,18],["D",980,2,22]]},"after":{"cols":["home","sqft","beds","age","sqft_z","age_z"],"rows":[["A",1500,3,20,-0.26,-0.50],["B",1520,5,65,-0.23,1.50],["C",2800,3,18,1.42,-0.59],["D",980,2,22,-0.93,-0.41]]}}

Now standardize Maya's four features and recompute each one's share of the distance:

```r
homes_z <- as.data.frame(scale(homes[feat]))   # scale() centers and scales every column
round(colMeans(homes_z), 6)                     # every feature now has mean 0
#>  sqft  beds baths   age
#>     0     0     0     0
round(apply(homes_z, 2, sd), 6)                 # ... and standard deviation 1
#>  sqft  beds baths   age
#>     1     1     1     1

qz      <- homes_z[1, ]
share_z <- sapply(feat, function(f) sum((homes_z[[f]] - qz[[f]])^2))
round(share_z / sum(share_z) * 100, 1)          # shares are comparable now, no single winner
#>  sqft  beds baths   age
#>  19.7  18.9  34.4  27.0
```

From 99.8% owned by one feature down to a 19 to 34% spread. No column dominates any more, and every feature finally gets a vote.

=== step === quiz
::eyebrow Check yourself
## What does standardizing do to a feature?

You take Maya's `age` column (mean about 40 years, standard deviation about 23 years) and standardize it with the z-score. What are the mean and standard deviation of the new, standardized column?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Mean about 40, standard deviation about 23, the values barely change ::no Standardizing always recenters and rescales. The original 40 and 23 are exactly what get divided out, they do not survive into the new column.
- Mean 0 and standard deviation 1 ::ok Right. Subtracting the mean forces the new mean to 0; dividing by the standard deviation forces the new standard deviation to 1. That is the whole point of the z-score.
- Minimum 0 and maximum 1 ::no That is min-max normalization, a different transform. The z-score fixes the mean and standard deviation, not the minimum and maximum (a standardized value can be negative or above 1).

=== step === concept
::eyebrow Know when it matters
## Which models care about scale, and which do not

Scaling is not a ritual you perform on every dataset. Whether it matters depends entirely on *how the model uses the numbers*. There is a clean rule: if a model compares features by distance, by gradient steps, by a size penalty, or by variance, it needs them on one scale. If a model only asks "is this value above or below a threshold," it does not care at all.

| Model family | Example methods | Needs scaling? | Why |
|---|---|---|---|
| Distance-based | kNN, SVM, k-means | Yes | distance is dominated by the largest-unit feature |
| Gradient descent | neural nets, SGD-fit regression | Yes | uneven scales stretch the loss surface and slow learning |
| Penalized | ridge, lasso, elastic net | Yes | the penalty shrinks big-unit coefficients unfairly |
| Variance-based | PCA, factor analysis | Yes | the first component chases the highest-variance feature |
| Tree-based | decision tree, random forest, boosting | No | a split depends on order, not magnitude |

::widget process-flow {"steps":[{"title":"Distance or similarity","sub":"kNN, SVM, k-means: scale every feature first"},{"title":"Gradient descent","sub":"neural nets, penalized regression: scale for fair, stable steps"},{"title":"Variance directions","sub":"PCA, clustering: scale or the big-unit feature wins"},{"title":"Tree-based","sub":"trees, random forests, boosting: scale-free, you can skip it"}]}

Why are trees immune? A tree splits at a threshold like `sqft > 1500`. Standardizing turns that into `sqft_z > -0.63`, the *exact same split*: the same homes land on each side, because center-and-scale never changes the order of the values. Let us prove a tree does not move when we rescale a feature:

```r
library(rpart)
homes_s <- homes
homes_s$sqft <- as.numeric(scale(homes_s$sqft))   # standardize one predictor

raw_tree    <- rpart(price ~ sqft + beds + age, data = homes)
scaled_tree <- rpart(price ~ sqft + beds + age, data = homes_s)

mean(predict(raw_tree, homes) == predict(scaled_tree, homes_s))   # identical predictions?
#> [1] 1
```

Every prediction is identical. For a random forest or gradient boosting, scaling is wasted effort. For kNN it is the difference between a working model and a broken one.

=== step === quiz
::eyebrow Check yourself
## Maya switches models

Maya has been using k-nearest-neighbors, where she carefully standardized every feature. She now swaps in a random forest on the very same data. What should she do about the scaling?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Scale even more aggressively, because forests have many trees and the effect compounds ::no More trees does not create a scale sensitivity that a single tree lacks. Each tree splits on thresholds, which are immune to scale, so there is nothing to compound.
- Keep scaling, since every model benefits from features on a common scale ::no A common belief, but not true. Distance, gradient, penalty, and variance based models benefit; tree-based models are indifferent because splits depend only on the order of values.
- She can drop the scaling entirely, since a random forest is scale-invariant ::ok Right. A forest is built from trees, and a tree split depends only on whether a value is above or below a threshold, never on the magnitude. Standardizing changes nothing it does.

=== step === concept
::eyebrow The second problem
## Skew is a different problem, and standardizing will not fix it

Scaling moves a feature and shrinks it, but it never changes its *shape*. Look at Maya's `lot_size`: most homes sit on modest lots, but a few estates have enormous ones. That is a **right-skewed** distribution, a long tail stretching to the right. Standardizing a skewed feature gives you a skewed feature with mean 0: the lopsidedness is untouched, and those few giant lots still sit many standard deviations out, dragging the mean and distorting any linear model or distance.

The fix is a **transformation** that compresses the long tail: pull the big values in, stretch the small ones apart. The everyday workhorse is the natural logarithm, which turns multiplicative spread into additive spread. We measure lopsidedness with **skewness**, where 0 means symmetric, positive means a right tail. For values \(x_1,\dots,x_n\) with mean \(\bar{x}\) and standard deviation \(\sigma\),

\[ g \;=\; \frac{1}{n}\sum_{i=1}^{n}\left(\frac{x_i - \bar{x}}{\sigma}\right)^{3}. \]

Drag the toggle below from **raw** to **log** to **Box-Cox** and watch the histogram pull toward symmetry while the skew number falls toward 0.

::widget transform-shaper {}

Two transforms generalize the log. **Box-Cox** lets the data choose the best power \(\lambda\) (lambda) instead of always using a log:

\[ x^{(\lambda)} \;=\; \begin{cases} \dfrac{x^{\lambda} - 1}{\lambda}, & \lambda \neq 0,\\[1.2ex] \log x, & \lambda = 0,\end{cases} \]

so \(\lambda = 1\) is essentially no change, \(\lambda = 0\) is the log, \(\lambda = 0.5\) is a square root, and the procedure searches for the \(\lambda\) that makes the feature most symmetric. Box-Cox has one catch: it requires strictly positive values. **Yeo-Johnson** is a close relative that handles zeros and negatives too, so it is the safer default when a feature can be 0 or below.

Watch the log tame Maya's skewed `lot_size`:

```r
skewness <- function(v) mean(((v - mean(v)) / sd(v))^3)   # >0 means a right tail
round(c(raw  = skewness(homes$lot_size),
        log  = skewness(log(homes$lot_size)),
        sqrt = skewness(sqrt(homes$lot_size))), 2)
#>   raw   log  sqrt
#>  1.73 -0.14  0.72
```

The raw lot sizes are strongly right-skewed (about 1.73); a single log nearly erases it (about -0.14, essentially symmetric), while the gentler square root only halves it. One caution: a log needs strictly positive values (here every lot is at least 600), and it changes how you read the feature, you are now modeling *log square feet*, not square feet.

=== step === concept
::eyebrow The discipline from Lesson 2, again
## Keep every transform leak-free

A scaler and a transform both *learn* something from the data: standardizing learns a mean and a standard deviation, Box-Cox learns a \(\lambda\), min-max learns a minimum and maximum. Here is the rule that carries straight over from out-of-fold encoding: **those numbers must be learned from the training data only.** If you standardize using the mean and standard deviation of the whole dataset, the test rows have helped set their own scale, and that is [data leakage](Train-Validation-Test-and-Data-Leakage.html), the same sin in a new disguise.

::widget process-flow {"steps":[{"title":"Split first","sub":"hold out the test rows before you fit anything"},{"title":"Fit on train","sub":"learn the mean, sd, and lambda from the training rows only"},{"title":"Apply to test","sub":"transform the test rows with those frozen training numbers"},{"title":"Never refit on test","sub":"a test set that centers to exactly 0 is the tell of a leak"}]}

Do it by hand once so the mechanics are concrete: standardize the test homes using the *training* mean and standard deviation, never their own.

```r
set.seed(1)
idx   <- sample(nrow(homes), round(0.7 * nrow(homes)))
train <- homes[idx, ]
test  <- homes[-idx, ]

mu  <- colMeans(train[feat])          # learned on TRAIN only
sdv <- apply(train[feat], 2, sd)      # learned on TRAIN only

test_z <- scale(test[feat], center = mu, scale = sdv)   # TRAIN numbers applied to test
round(colMeans(test_z), 3)            # not exactly 0, which is correct: test was not centered on itself
#>   sqft   beds  baths    age
#>  0.043  0.072 -0.028 -0.139
```

The test means land *near* 0 but not *on* it. That tiny offset is the proof you did it right, the test set never got to peek at itself.

[TIP]
In a real project you do not hand-roll this. A tidymodels recipe learns every scaler and transform on the training data and applies them to new data for you, in the right order, with no leak. Run this one locally:

```r-static
library(recipes)

rec <- recipe(price ~ sqft + lot_size + beds, data = train) %>%
  step_normalize(sqft, beds) %>%   # center + scale, learned on TRAIN
  step_BoxCox(lot_size)            # data-chosen power, learned on TRAIN

prepped    <- prep(rec, training = train)      # learns the mean, sd, and lambda on TRAIN only
train_done <- bake(prepped, new_data = train)
test_done  <- bake(prepped, new_data = test)   # test transformed with the TRAIN parameters, no leak
```

=== step === tryit
::eyebrow Your turn
## Standardize the test set without leaking

Below, the training mean and standard deviation of `lot_size` are already computed as `mu` and `sdv`. Fill in the two blanks so each test home is standardized with the **training** numbers, not its own. (Remember the z-score: subtract the mean, divide by the standard deviation.)

```r
set.seed(1)
idx   <- sample(nrow(homes), round(0.7 * nrow(homes)))
train <- homes[idx, ]
test  <- homes[-idx, ]
mu    <- mean(train$lot_size)   # training mean
sdv   <- sd(train$lot_size)     # training standard deviation

test$lot_z <- (test$lot_size - ____) / ____   # use the TRAINING numbers
round(head(test$lot_z), 2)
```
::check {"regex":"mu\\s*\\)\\s*/\\s*sdv","gate":true,"difficulty":"intermediate","ok":"Leak-free: every test home is standardized with the training mean and sd, so the test set never influenced its own scale.","no":"Center with the training mean and divide by the training sd: (test$lot_size - mu) / sdv. Using the test set's own mean or sd would let it peek at itself."}
::solution
```r
set.seed(1)
idx   <- sample(nrow(homes), round(0.7 * nrow(homes)))
train <- homes[idx, ]
test  <- homes[-idx, ]
mu    <- mean(train$lot_size)
sdv   <- sd(train$lot_size)

test$lot_z <- (test$lot_size - mu) / sdv
round(head(test$lot_z), 2)
#> [1]  0.27 -0.58 -0.88 -0.48 -0.69  1.15
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Box and Cox (1964), An Analysis of Transformations, JRSS-B 26(2)](https://doi.org/10.1111/j.2517-6161.1964.tb00553.x) - the original paper that introduced the power transform you used here.
- [Yeo and Johnson (2000), A New Family of Power Transformations, Biometrika 87(4)](https://doi.org/10.1093/biomet/87.4.954) - the extension that handles zero and negative values.
- [Kuhn and Johnson, Feature Engineering and Selection (free online)](https://bookdown.org/max/FES/) - the chapters on centering, scaling, and transforming numeric predictors, with the leakage discipline.
- [tidymodels recipes reference](https://recipes.tidymodels.org/reference/index.html) - step_normalize, step_BoxCox, and step_YeoJohnson, done leak-free inside a pipeline.

=== step === complete
## Lesson 3 complete

You can now spot the two numeric-feature traps and fix both: standardize features so no big-unit column hijacks a distance, recognize which models need it (distance, gradient, penalty, and variance based) and which shrug it off (trees), reshape a skewed feature with log, Box-Cox, or Yeo-Johnson, and fit every scaler and transform on the training data alone so nothing leaks.

Next, Lesson 4: Interaction and Spline Features. You will go the other way, deliberately *adding* engineered columns, products and curves, that let a simple linear model bend to a non-linear world without overfitting.
