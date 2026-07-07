---
title: "Regression Modeling Lesson 1: OLS Regression from Scratch"
catalog_blurb: "How a regression finds the best-fitting line and what its numbers mean."
description: "Ordinary least squares from scratch: residuals, the sum of squared errors, the normal equations, fitting a line with lm() in R, and reading its R-squared."
keywords: "OLS regression, ordinary least squares, linear regression in R, lm function, residuals, sum of squared errors, normal equations, R-squared, slope and intercept, simple linear regression"
post_type: "LESSON"
curriculum_id: "6.20.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "1"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "Regression-Assumptions-and-Residuals.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 8
## OLS Regression from Scratch

Priya runs a small iced-coffee cart outside a train station. On warm days she sells out; on cool days she carries stock home. For twelve days she wrote down two numbers: the day's high temperature and how many iced coffees she sold. She wants one honest rule, a straight line, that turns tomorrow's forecast into a guess for the day's sales.

There are infinitely many lines she could draw through her data. This lesson is about the single method that picks the best one: ordinary least squares, or OLS. By the end you will be able to:

- Say exactly what makes one line "best", and define a residual
- Compute that line two ways by hand (a formula, then the matrix normal equations) and confirm R's `lm()` gets the identical answer
- Read the line's slope and intercept, and judge the fit with R-squared

**Prerequisites:** you can run an R code block, read a scatterplot, and know what an average is. No calculus or matrix algebra assumed; we build those pieces up as we reach them.

The widget below is the whole lesson in miniature, running on Priya's real twelve days. Drag the slope and intercept: every point drops a red square onto the line, and the square's area is that day's error. Your goal, and OLS's goal, is to make the total red area as small as it can be. Press "Snap to least squares" to see where the math lands.

::widget ols-fit {"points":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60}]}

=== step === concept
::eyebrow The rule
## A line is a prediction machine

Here are Priya's twelve days. Each dot is one day: its temperature along the bottom, the cups she sold up the side. The dots climb from lower-left to upper-right, so warmer really does seem to mean more cups.

::widget chart-plotter {"data":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60}],"geoms":["point"],"x":"temp","y":"cups"}

A straight line through that cloud is a rule for turning any temperature into a predicted number of cups. We write it

\[ \hat{y} = b_0 + b_1 x \]

Reading it in Priya's words: \(x\) is the day's temperature (the **predictor**), \(\hat{y}\) (said "y-hat") is the line's **predicted** cups, \(b_0\) is the **intercept** (the predicted cups at a temperature of zero, where the line crosses the vertical axis), and \(b_1\) is the **slope** (how many extra cups the line adds for each one-degree rise). The hat on \(\hat{y}\) matters: it is the line's guess, not the actual cups Priya sold.

Every choice of \(b_0\) and \(b_1\) is a different line, a different rule. Our whole job is to choose those two numbers well. First, let us keep Priya's data in R so we can work with it for the rest of the lesson. Each lesson starts a fresh R session, so we build the twelve days right here (run this first).

```r
# Priya's cart: the day's high temperature (deg C) and iced coffees sold.
coffee <- data.frame(
  temp = c(15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31),
  cups = c(30, 36, 33, 42, 40, 47, 44, 52, 55, 56, 61, 60)
)
head(coffee)
#>   temp cups
#> 1   15   30
#> 2   17   36
#> 3   18   33
#> 4   20   42
#> 5   21   40
#> 6   23   47
```

=== step === concept
::eyebrow The miss
## Every prediction has a residual

No straight line will pass through all twelve dots, so on most days the line's guess is a little off. That gap, for a single day, is the **residual**: the actual cups minus the predicted cups.

\[ e_i = y_i - \hat{y}_i \]

Here \(y_i\) is the cups Priya really sold on day \(i\), \(\hat{y}_i\) is the line's prediction for that same day, and \(e_i\) is the leftover. A residual has a sign. Take the least-squares line we are about to find: on the 20-degree day Priya sold 42 cups while the line predicts 39.69, so the residual is \(42 - 39.69 = +2.31\); she beat the line. On the 24-degree day she sold 44 while the line predicts 47.47, a residual of \(44 - 47.47 = -3.47\); the line over-guessed.

In the widget, each orange stick is one day's residual: the vertical distance from its dot up or down to the line. Drag the line and watch every stick grow and shrink at once. There is no line that kills them all; push one dot's residual to zero and others open up.

::widget ols-fit {"points":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60}]}

=== step === concept
::eyebrow The score
## Add up the squared misses

To compare two whole lines we need a single number for how badly each fits, built from all twelve residuals. The obvious idea, adding the raw residuals, fails: positives and negatives cancel. For the best line Priya's residuals sum to exactly zero, yet that line is clearly not perfect.

The fix is to **square each residual before adding**. Squaring drops the sign (every term is now positive, so nothing cancels) and it punishes big misses far more than small ones. That gives the **sum of squared errors**:

\[ \text{SSE} = \sum_{i=1}^{n} e_i^2 = \sum_{i=1}^{n} (y_i - \hat{y}_i)^2 \]

where \(n\) is the number of days (twelve here) and \(\sum\) means "add this up over every day". Watch the punishment at work: that tidy \(+2.31\) miss contributes \(2.31^2 \approx 5.3\) to the SSE, while the ugly \(-3.47\) miss contributes \(3.47^2 \approx 12.0\), more than double the damage even though the miss itself is only about 50% larger. In the widget, the SSE is literally the total area of all the red squares.

**Ordinary least squares** is the rule that picks the one line, the one pair \((b_0, b_1)\), that makes this total area as small as it can possibly be. Drag the sliders to shrink the SSE by hand, then press "Snap to least squares" to jump exactly to the minimum.

::widget ols-fit {"points":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60}]}

[NOTE]
Squaring is also why a single far-off day (a street festival, a burst water main) can swing the line more than you would like: its squared miss is enormous and OLS bends to reduce it. That sensitivity is the price OLS pays for its clean math, and softening it is exactly what the robust-regression methods later in this course are built to do.

=== step === quiz
::eyebrow Check yourself
## Squaring, not summing

On two days, a line's residuals are \(+8\) cups and \(-2\) cups. How much do these two days add to the sum of squared errors?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- 68, because you square each miss first: \(8^2 + (-2)^2 = 64 + 4\) ::ok Right. SSE squares every residual before adding, so the sign drops out and the big miss dominates: 64 + 4 = 68.
- 6, because the misses partly cancel: \(8 - 2\) ::no That is the signed sum, the exact thing SSE is designed to avoid. If misses could cancel, a wildly wrong line could look fine. We square first so nothing cancels.
- 10, because you add their sizes: \(8 + 2\) ::no Close, but that adds the absolute misses without squaring. SSE squares each one first (64 + 4 = 68), which is why one big miss counts so much more than a small one.

=== step === concept
::eyebrow The formula
## You do not have to drag: the closed form

Dragging finds the best line by feel. But with a single predictor there is an exact formula that lands on it directly, no searching. The slope is

\[ b_1 = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sum_{i=1}^{n} (x_i - \bar{x})^2} \]

and once you have the slope, the intercept follows:

\[ b_0 = \bar{y} - b_1 \bar{x} \]

Every symbol is something you can compute from the data: \(\bar{x}\) is the mean temperature, \(\bar{y}\) is the mean cups, and the sums run over all twelve days. The slope has a clean meaning. The numerator measures how temperature and cups move together (on days hotter than average, is she also above average on cups?), and the denominator measures how much temperature alone spreads out. So the slope is co-movement per unit of temperature spread. The intercept formula then just slides the line up or down so it passes through the average day \((\bar{x}, \bar{y})\).

Let us run the formulas on Priya's numbers.

```r
x <- coffee$temp
y <- coffee$cups
b1 <- sum((x - mean(x)) * (y - mean(y))) / sum((x - mean(x))^2)   # slope
b0 <- mean(y) - b1 * mean(x)                                      # intercept
c(intercept = b0, slope = b1)
#> intercept     slope 
#> 0.8180113 1.9437148
```

By hand, then: the intercept is about 0.82 and the slope is about 1.94 cups per degree. Hold on to those two numbers.

=== step === concept
::eyebrow The general recipe
## The normal equations

Priya has one predictor. Real models have many (temperature, day of week, a holiday flag). The formula above does not stretch past one predictor, but a single matrix expression does, and it is the engine inside every regression tool. Stack the data:

\[ \hat{\mathbf{y}} = \mathbf{X}\boldsymbol{\beta} \]

Here \(\mathbf{y}\) is the column of actual cups, \(\boldsymbol{\beta}\) is the column of coefficients we want (intercept, then slope), and \(\mathbf{X}\) is the **design matrix**: one row per day, a first column of all 1s (that column pairs with the intercept) and then one column per predictor (here, temperature). The least-squares coefficients are given by the **normal equations**:

\[ \hat{\boldsymbol{\beta}} = (\mathbf{X}^{\top} \mathbf{X})^{-1}\,\mathbf{X}^{\top} \mathbf{y} \]

You reach this by writing the SSE as a function of \(\boldsymbol{\beta}\), taking its derivative, and setting it to zero (the calculus is optional here; the point is that minimizing squared error has one exact solution, not a search). Translated to R almost symbol for symbol:

```r
X <- cbind(1, coffee$temp)   # design matrix: a 1s column, then temperature
y <- coffee$cups
beta <- solve(t(X) %*% X) %*% t(X) %*% y   # (X'X)^-1 X'y
beta
#>            [,1]
#> [1,] 0.8180113
#> [2,] 1.9437148
```

The same 0.818 and 1.944, to the last digit. The drag, the formula, and the matrix all agree, because they are three routes to the one line that minimizes SSE. (This works whenever \(\mathbf{X}^{\top}\mathbf{X}\) can be inverted; it breaks only when two predictors are near-copies of each other, the multicollinearity trap you will meet in a later lesson.)

[KEY INSIGHT]
There is nothing to "train" or iterate in ordinary least squares. The best coefficients are a direct calculation from the data. That closed-form solution is why linear regression is fast, exact, and the first model worth reaching for.

=== step === tryit
::eyebrow In R
## Let lm() do it in one line

You have now found Priya's line three ways. In practice you would never grind through any of that: R's `lm()` function ("linear model") solves the normal equations for you. It takes a **formula**, written `response ~ predictor` and read as "cups explained by temp". Fill in the blank so the model predicts cups from temperature.

```r
fit <- lm(____, data = coffee)
coef(fit)
```
::check {"regex":"cups\\s*~\\s*temp","gate":true,"difficulty":"beginner","ok":"That is the formula. cups ~ temp reads as cups explained by temperature, and coef(fit) prints the very intercept and slope you found by hand.","no":"Put the response on the left of the ~ and the predictor on the right: cups ~ temp (cups explained by temp)."}
::solution
```r
fit <- lm(cups ~ temp, data = coffee)
coef(fit)
#> (Intercept)        temp 
#>   0.8180113   1.9437148
```

=== step === concept
::eyebrow Reading it
## What the two numbers mean

`coef(fit)` gave an intercept of 0.82 and a slope of 1.94. Read them in Priya's world:

- **Slope 1.94:** each extra degree of temperature is associated with about 1.94 more cups sold, close to two cups per degree. This is the number Priya actually cares about.
- **Intercept 0.82:** the line's predicted cups at a temperature of zero. But zero degrees is nowhere near her data (her days run 15 to 31 degrees), so this is only the mathematical anchor where the line crosses the axis, not a real forecast.

The full summary even flags the intercept as untrustworthy: its p-value is 0.78, meaning it is statistically indistinguishable from zero. The slope, by contrast, is rock solid (its p-value is 0.0000000154).

```r
fit <- lm(cups ~ temp, data = coffee)
summary(fit)$coefficients
#>              Estimate Std. Error    t value     Pr(>|t|)
#> (Intercept) 0.8180113  2.8512080  0.2868999 7.800457e-01
#> temp        1.9437148  0.1189812 16.3363169 1.535750e-08
```

And the slope only speaks for the range Priya has actually seen. Predicting for a pleasant 25-degree day is fair; predicting for an imaginary 40-degree day is not.

```r
predict(fit, newdata = data.frame(temp = c(25, 40)))
#>        1        2 
#> 49.41088 78.56660
```

The 25-degree prediction (about 49 cups) sits inside her data and is believable. The 40-degree prediction (about 79 cups) is pure extrapolation: no day that hot exists in the data, and a real 40-degree heatwave might empty the platform instead of packing it. A line only speaks for the range it has seen.

[WARNING]
The line describes an association, not a cause. Temperature and cups rise together here, but hot days also bring longer daylight, holidays, and lighter clothes; any of those could be driving sales too. Regression finds the pattern. It cannot tell you why, and it must not be trusted beyond the range of the data.

=== step === concept
::eyebrow The scoreboard
## How good is the fit? R-squared

The slope tells you the direction and size of the effect. R-squared tells you how tightly the dots hug the line. Start from the dumbest possible model: ignore temperature and always guess the average, \(\bar{y}\). Its total squared error is the **total sum of squares**:

\[ \text{SST} = \sum_{i=1}^{n} (y_i - \bar{y})^2 \]

The regression line does better, leaving behind its smaller SSE. **R-squared** is the fraction of that baseline error the line manages to remove:

\[ R^2 = 1 - \frac{\text{SSE}}{\text{SST}} \]

If the line explained nothing, SSE would equal SST and \(R^2 = 0\). If it passed through every dot, SSE would be 0 and \(R^2 = 1\). For Priya:

```r
fit <- lm(cups ~ temp, data = coffee)
sse <- sum(residuals(fit)^2)                        # error left by the line
sst <- sum((coffee$cups - mean(coffee$cups))^2)     # error of always guessing the mean
c(SSE = sse, SST = sst, R2 = 1 - sse / sst)
#>         SSE          SST           R2 
#>  44.0150094 1218.6666667    0.9638827
```

Temperature explains about **96%** of the day-to-day swing in Priya's sales, a genuinely strong fit. Two footnotes worth carrying forward:

- With a single predictor, \(R^2\) is exactly the square of the correlation \(r\) (a single number from -1 to 1 that measures how tightly two things move together, where 1 is a perfect upward line). Here \(r = 0.982\) and \(0.982^2 = 0.964\), the same number.
- \(R^2\) never falls when you add a predictor, even a useless one, so a high \(R^2\) is not proof the model is right. Whether these residuals are actually well behaved is the entire subject of the next lesson.

```r
c(r = cor(coffee$temp, coffee$cups), r_squared = cor(coffee$temp, coffee$cups)^2)
#>         r r_squared 
#> 0.9817753 0.9638827
```

=== step === quiz
::eyebrow Check yourself
## Read Priya's model

Priya's model has a slope of 1.94 and an R-squared of 0.96. Which reading is correct?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Warmer temperature causes 96% of her sales, and each degree makes her sell 1.94 more cups ::no R-squared measures fit, not cause, and it is a share of variation explained, not a share of sales caused. Regression shows temperature and cups move together; it cannot prove temperature is the reason.
- About 96% of the day-to-day variation in cups is explained by temperature, and each extra degree is associated with about 1.94 more cups ::ok Exactly. R-squared is variation explained, and the slope is an association within the observed range, both stated carefully.
- The model will predict accurately on a 40-degree day, because it fits the past so well ::no A high R-squared only certifies the fit inside the data (15 to 31 degrees). Forty degrees is extrapolation, where the line has no evidence and can fail badly.

=== step === concept
::eyebrow Go deeper
## References

- [An Introduction to Statistical Learning, Chapter 3 (free PDF)](https://www.statlearning.com/) - the friendliest full treatment of simple and multiple linear regression, with worked R.
- [The Elements of Statistical Learning, Chapter 3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the rigorous version, including the least-squares geometry and the normal equations.
- [R documentation for lm() (stats package)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html) - the exact function you used, its formula interface, and everything it returns.
- [Ordinary least squares (Wikipedia)](https://en.wikipedia.org/wiki/Ordinary_least_squares) - a careful derivation of the normal equations and the assumptions behind them.

=== step === complete
## Lesson 1 complete

You built ordinary least squares from the ground up. A line predicts, a residual is its miss, and the best line is the one that minimizes the total squared miss. You found Priya's line three ways that all agreed (by dragging, by the closed-form formula, and by the matrix normal equations), then let `lm()` do it in a single line. You read the slope (about two cups per degree), treated the intercept with suspicion, and used R-squared to see that temperature explains about 96% of her sales.

That last number is seductive. A line can fit beautifully and still be quietly wrong, because `lm()` hands you a slope and a p-value whether or not the data earned them. Next, in **Regression Assumptions and Residuals**, you will meet the four promises every regression leans on, and learn to read a residual plot to check whether Priya's model actually kept them.
