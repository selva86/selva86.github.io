---
title: "Feature Engineering Lesson 4: Interaction and Spline Features"
catalog_blurb: "How to let a linear model capture curves and conditional effects without overfitting."
description: "Make a linear model bend without overfitting: interaction terms for conditional effects, plus polynomials and natural splines that fit curved relationships."
keywords: "interaction features, spline features, polynomial features, natural splines, basis expansion, nonlinear regression, leak-free pipeline, feature engineering, R"
post_type: "LESSON"
curriculum_id: "6.60.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "4"
course_total: "7"
course_landing: "R-Feature-Engineering-Course.html"
course_next: "Features-from-Dates-Text-and-Geo.html"
course_prev: "Scaling-and-Transformations.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Interaction and Spline Features

In Lesson 3 you reshaped a single feature's *distribution*, taming skew so a model could use it. This lesson reshapes something different: the model's *flexibility*. We hand a plain linear model the power to bend.

Meet our running example. A small ice-cream cart on a seaside promenade writes down, for each day, the high temperature, whether it was a weekend, and how many cups it sold. Sales climb as the day warms up, peak around a perfect beach afternoon near 28C, then fall when it gets too hot to stand in line. That shape is a curve, and a straight line cannot follow it.

Drag the line in the chart below. Each dot is a day: warmer to the right, more cups sold higher up. However you tilt the line, it misses. The red squares (each one a squared error) never shrink away, because the relationship bends and a line does not.

By the end of this lesson you will be able to:

- Build an interaction so one feature's effect can depend on another
- Use polynomials and splines to fit a curved relationship with `lm()`
- Add just enough flexibility to capture the shape without overfitting

**Prerequisites:** you can fit `lm()` and read a coefficient ([OLS Regression from Scratch](OLS-Regression-from-Scratch.html)), and you have met dummy-coding a factor ([Encoding Categorical Variables](Encoding-Categorical-Variables.html)).

::widget ols-fit {"points":[{"x":1,"y":2.2},{"x":2,"y":3.4},{"x":3,"y":4.5},{"x":4,"y":5.3},{"x":5,"y":5.6},{"x":6,"y":5.4},{"x":7,"y":4.7},{"x":8,"y":3.6},{"x":9,"y":2.3}]}

=== step === concept
::eyebrow The problem
## Why a linear model is "straight"

Suppose we just hand the cart's two features to `lm()`. The fitted equation looks like this:

\( \widehat{\text{sales}} = \beta_0 + \beta_1\,\text{temp} + \beta_2\,\text{weekend} \)

Reading the symbols: \(\widehat{\text{sales}}\) is the predicted number of cups; \(\text{temp}\) is the day's temperature; \(\text{weekend}\) is a 0/1 dummy (1 on weekends, 0 otherwise); \(\beta_0\) is the intercept; \(\beta_1\) is cups per extra degree; \(\beta_2\) is the flat weekend bump. "Linear" means the prediction is a weighted sum of the columns, that is, linear in the coefficients \(\beta\).

That innocent-looking equation makes two rigid promises:

- **One straight slope.** \(\beta_1\) is a single number, so every extra degree adds the *same* cups whether it is 14C or 34C. No hump allowed.
- **A parallel shift.** Weekend only adds a flat \(\beta_2\); the temperature slope is identical on weekdays and weekends, so the two groups can never differ in how strongly heat drives sales.

Real life breaks both promises, and there is a clean fix for each. **Fix 1, interactions:** let one feature's slope depend on another. **Fix 2, basis expansion:** let a single feature's effect curve. The rest of the lesson is those two moves.

=== step === concept
::eyebrow Fix 1
## When one feature's effect depends on another

Picture two hot days at the cart. On a hot *weekday* most people are at work, so a few extra walk-ups buy a cup. On a hot *weekend* the whole promenade is packed, so the same extra degree converts a much bigger crowd. Heat pays off more on weekends: the temperature *slope* is steeper there. A flat weekend bump (\(\beta_2\)) simply cannot say that, because it shifts every day up by the same amount no matter the temperature.

The fix is an **interaction term**, a new column that is the *product* of the two features:

\( \widehat{\text{sales}} = \beta_0 + \beta_1\,\text{temp} + \beta_2\,\text{weekend} + \beta_3\,(\text{temp}\times\text{weekend}) \)

Now read the temperature slope by group. On a weekday \(\text{weekend}=0\), so the product term vanishes and the slope is just \(\beta_1\). On a weekend \(\text{weekend}=1\), so the slope becomes \(\beta_1 + \beta_3\). The interaction coefficient \(\beta_3\) is exactly *how much steeper* the weekend slope is. If \(\beta_3 > 0\), each degree sells more cups on weekends than on weekdays.

The chart fits one straight line per group. Press Run: the weekend line climbs faster than the weekday line. Two non-parallel lines are the visual signature of an interaction.

::widget chart-plotter {"x":"temp","y":"sales","geoms":["point"],"data":[{"x":14,"y":118,"fill":"weekday"},{"x":18,"y":128,"fill":"weekday"},{"x":22,"y":135,"fill":"weekday"},{"x":26,"y":141,"fill":"weekday"},{"x":30,"y":146,"fill":"weekday"},{"x":14,"y":150,"fill":"weekend"},{"x":18,"y":168,"fill":"weekend"},{"x":22,"y":182,"fill":"weekend"},{"x":26,"y":198,"fill":"weekend"},{"x":30,"y":210,"fill":"weekend"}],"code":{"point":"ggplot(df, aes(temp, sales, color = group)) +\n  geom_point(size = 2) +\n  geom_smooth(method = \"lm\", se = FALSE)"}}

=== step === tryit
::eyebrow Your turn
## Build the interaction in R

First, the cart's data. Each lesson runs in a fresh R session, so we generate a realistic season right here (run this once):

```r
set.seed(1)
n <- 200
temp    <- round(runif(n, 12, 38), 1)        # the day's high temperature, in Celsius
weekend <- rbinom(n, 1, 0.30)                # 1 on weekends (busier promenade), else 0
# Cups sold: a hump in temperature (best near 28C, then too hot to linger),
# plus a weekend crowd that makes every degree count for more.
mu    <- 40 + 9 * temp - 0.16 * temp^2 + weekend * (15 + 0.9 * temp)
sales <- round(mu + rnorm(n, 0, 12))         # add ordinary day-to-day noise
cart  <- data.frame(
  temp    = temp,
  weekend = factor(weekend, labels = c("weekday", "weekend")),
  sales   = sales
)
str(cart)
#> 'data.frame':  200 obs. of  3 variables:
#>  $ temp   : num  ...
#>  $ weekend: Factor w/ 2 levels "weekday","weekend": ...
#>  $ sales  : num  ...
```

In a formula, `temp * weekend` is R shorthand: it expands to `temp + weekend + temp:weekend`, the two features plus their product column. Fill in the blank to fit the interaction model.

```r
fit_int <- lm(sales ~ ____, data = cart)   # let the temperature slope differ by weekend
round(coef(fit_int), 2)
```
::check {"regex":"temp\\s*[*:]\\s*weekend","gate":true,"difficulty":"beginner","ok":"Yes. temp * weekend adds the product column, so weekday and weekend get different temperature slopes.","no":"Type temp * weekend - the * expands to temp + weekend + temp:weekend."}
::solution
```r
fit_int <- lm(sales ~ temp * weekend, data = cart)
round(coef(fit_int), 2)
#>         (Intercept)                temp      weekendweekend  temp:weekendweekend
#>              131.00                1.05               14.80                 0.91
# Your numbers will be close (the season is randomly generated). The last term,
# temp:weekendweekend, is positive: each degree adds ~0.9 cups MORE on weekends.
```

=== step === quiz
::eyebrow Check yourself
## Reading the interaction

Your fitted model gives a positive `temp:weekendweekend` coefficient (about +0.9). What does that one number tell you?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- On weekends, each extra degree adds about 0.9 cups MORE than it does on a weekday, so the temperature slope is steeper on weekends. ::ok Exactly. The interaction is the DIFFERENCE in slopes: the weekday slope is b1 and the weekend slope is b1 + b3, so b3 is the extra cups-per-degree you get on weekends.
- Weekends sell about 0.9 more cups than weekdays, no matter the temperature. ::no That would be a flat weekend bump, which is the MAIN effect (weekendweekend), not the interaction. The interaction multiplies with temperature instead of adding a constant.
- Temperature has no effect on weekday sales. ::no Weekday sales still rise with temperature at slope b1. The interaction only says the weekend slope is steeper, not that the weekday slope is zero.

=== step === concept
::eyebrow Fix 2, part one
## Polynomials: bend the line with powers

Interactions handled the weekend twist. Now the harder problem: sales versus temperature is not a line at all, it is a hump. No interaction fixes that, because the bend lives in temperature itself.

Here is the trick, called **basis expansion**: keep `lm()`, but feed it extra columns built from temperature. The simplest is to add temperature squared.

\( \widehat{\text{sales}} = \beta_0 + \beta_1\,\text{temp} + \beta_2\,\text{temp}^2 \)

With a negative \(\beta_2\) that is a downward parabola: it rises, peaks, and falls, exactly the hump we need. And notice the prediction is still a weighted sum of columns, so it is still a *linear model* (linear in the \(\beta\)'s). We did not change the engine, only the columns we feed it. `poly(temp, 2)` builds those columns for you.

Run the chart. The degree-2 curve (red) hugs the hump. But greed is tempting: if 2 is good, why not 9? The degree-9 curve (blue) threads closer to individual points in the middle, then flails at the edges, inventing swings the data never showed. That edge wildness is the **Runge phenomenon**, and it is overfitting in plain sight.

```r
library(ggplot2)
ggplot(cart, aes(temp, sales)) +
  geom_point(alpha = 0.35) +
  geom_smooth(method = "lm", formula = y ~ poly(x, 2),
              se = FALSE, colour = "firebrick") +    # degree 2: a clean hump
  geom_smooth(method = "lm", formula = y ~ poly(x, 9),
              se = FALSE, colour = "steelblue") +    # degree 9: wiggles at the edges
  labs(title = "Degree 2 fits the hump; degree 9 wiggles at the ends")
```

[WARNING]
A high-degree polynomial is one stiff curve forced to bend everywhere at once. To wiggle through the middle it must lurch at the ends. More degree buys edge chaos, not a better fit.

=== step === concept
::eyebrow Fix 2, part two
## Splines: bend locally, stay calm at the edges

A polynomial bends with one global formula, which is why pushing it harder makes the *whole* curve thrash. A **spline** fixes this by going local.

Picture cutting the temperature axis at a few points called **knots**. Between each pair of knots the spline fits its own little cubic curve, and the pieces are joined so smoothly you cannot see the seams (the value and the slope match at every knot). Because each piece only answers for its own stretch of temperature, a wiggle on the hot end cannot ripple back and disturb the cool end.

A **natural** cubic spline adds one more rule: beyond the outermost knots it must go straight. That tames exactly the edge flailing that wrecked the degree-9 polynomial. You set the flexibility with one knob, the **degrees of freedom** (`df`): roughly the number of basis columns, and so the number of separate bends the curve is allowed. More `df`, more bend.

\( \widehat{\text{sales}} = \beta_0 + \beta_1 b_1(\text{temp}) + \dots + \beta_k b_k(\text{temp}) \)

Each \(b_j(\text{temp})\) is one spline basis column that `splines::ns()` computes from temperature, and \(k\) is the `df`. It is the same `lm()` as ever, just fed these cleverly shaped columns. Run it:

```r
library(ggplot2)
ggplot(cart, aes(temp, sales)) +
  geom_point(alpha = 0.35) +
  geom_smooth(method = "lm", formula = y ~ splines::ns(x, df = 4),
              se = FALSE, colour = "firebrick") +
  labs(title = "Natural spline (df = 4): bends to the hump, straight at the edges")
```

A natural spline with `df = 4` adds four basis columns, so the model has five coefficients (the intercept plus one per column):

```r
fit_ns <- lm(sales ~ splines::ns(temp, df = 4), data = cart)
length(coef(fit_ns))   # intercept + 4 spline columns
#> [1] 5
```

=== step === quiz
::eyebrow Check yourself
## Spline or high-degree polynomial?

For the cart's hump you could use a degree-9 polynomial or a natural spline with `df = 4`. Why is the natural spline usually the safer choice?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A spline can fit any dataset with exactly zero error, so it is always more accurate. ::no That is the overfitting trap, not an advantage. A curve that nails every training point memorizes noise and predicts new days worse. Flexibility is a cost, not a free win.
- It bends locally between knots and a natural spline stays straight in the tails, so it captures the hump without the wild edge swings a high-degree polynomial produces. ::ok Right. Local pieces plus straight tails give controlled, stable flexibility: the same shape with far less edge chaos.
- Polynomials cannot represent curved relationships at all. ::no They can. A degree-2 polynomial already drew the hump. The problem is only that HIGH-degree polynomials wiggle at the edges, which splines avoid.

=== step === concept
::eyebrow Use it responsibly
## How much to bend, without leaking

Every bend you add is borrowed flexibility, and flexibility is paid for in **variance**: a more flexible model swings more from one sample of days to the next, the same overfitting you watched in the degree-9 curve. So `df` is not a free dial, it is the exact knob from the bias-variance tradeoff. Too low and you miss the hump (underfit); too high and you chase noise (overfit).

You do not guess it. You let the data choose, by trying a few values of `df` and keeping the one with the best **cross-validated** error, the honest held-out score from earlier in the course, never the training fit (which always rewards more bend).

And one trap, the theme of this whole course: a spline is a *learned* transform. Its knots are placed at quantiles of the data you give it, so if you build the basis on all your rows before splitting, the test set has leaked into your features. The fix is to make the basis part of the pipeline, fit on the training fold and replayed, with the same knots, on the test fold. In tidymodels that is one step:

```r-static
# In a tidymodels pipeline (the recipes package), the spline lives INSIDE the
# recipe: prep() learns the knots from the TRAINING rows only, and bake() reuses
# those exact knots on new data, so nothing leaks.
rec <- recipe(sales ~ temp + weekend, data = train) |>
  step_ns(temp, deg_free = 4) |>                  # natural-spline basis for temp
  step_dummy(weekend) |>                           # weekend -> a 0/1 column
  step_interact(~ starts_with("temp_ns"):weekend_weekend)   # spline-by-weekend interaction

# Then tune deg_free with cross-validation; the knots come only from each fold.
```

=== step === quiz
::eyebrow Check yourself
## Where can a spline leak?

A teammate builds the natural-spline basis for `temp` on the full dataset, then splits into train and test to score the model. The numbers look great. What went wrong?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing went wrong. A spline basis is a fixed mathematical formula, so it cannot leak. ::no The knots are placed at quantiles LEARNED from whatever rows you feed in. Build the basis on all rows and the test rows helped choose the knots, so the test set has already crept into your features.
- The knots are learned from the data, so building the basis on every row lets the test rows shape the features. The basis must be fit on the training fold and replayed, with the same knots, on the test fold. ::ok Right. A spline is a learned transform, so it belongs inside the pipeline: prep() learns the knots from training rows only, and bake() replays those same knots on new data.
- Splines can never be combined with a train and test split. ::no They can, and should. You fit the basis on the training fold and reuse those exact knots on the test fold, which is exactly what step_ns() inside a recipe does.

=== step === concept
::eyebrow Go deeper
## References

- [An Introduction to Statistical Learning, ch. 7 "Moving Beyond Linearity" (free PDF)](https://www.statlearning.com/) - the gentlest full treatment of polynomials, splines and GAMs.
- [The Elements of Statistical Learning, ch. 5 "Basis Expansions and Regularization" (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the math of spline bases and why natural splines behave at the edges.
- [Perperoglou et al. (2019), "A review of spline function procedures in R", BMC Med Res Methodol](https://doi.org/10.1186/s12874-019-0666-3) - which spline function to reach for in R, and the trade-offs.
- [recipes: step_ns() reference (tidymodels)](https://recipes.tidymodels.org/reference/step_ns.html) - the leak-free way to put a spline inside a modeling pipeline.

=== step === complete
## Lesson 4 complete

You gave a linear model two new powers: interactions, so one feature's effect can depend on another, and basis expansion (polynomials and splines), so a single feature's effect can curve. And you saw the catch: every bend costs variance, so you choose `df` by cross-validation and fit the basis inside a leak-free pipeline.

Next, Lesson 5: Features from Dates, Text and Geo. The signal is often hiding in columns that are not numbers yet, a timestamp, a product name, a pair of coordinates, and you will learn to pull model-ready features out of all three.
