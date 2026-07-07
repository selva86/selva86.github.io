---
title: "Regression Modeling Lesson 3: Influence and Leverage"
catalog_blurb: "How a single unusual point can dominate a regression, and how to find it."
description: "How one unusual data point can dominate a linear regression: leverage vs influence, hat values, Cook's distance, and how to spot and respond to influential rows in R."
keywords: "leverage regression, influence regression, Cook's distance, hat values, hatvalues, influential observations, high leverage points, outliers in regression, influence.measures, regression diagnostics in R"
post_type: "LESSON"
curriculum_id: "6.20.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-regression"
course_title: "Regression Modeling in R"
course_lesson: "3"
course_total: "8"
course_landing: "R-Regression-Modeling-Course.html"
course_next: "Multicollinearity-in-Regression.html"
course_prev: "Regression-Assumptions-and-Residuals.html"
---

=== step === cover
::eyebrow Lesson 3 of 8
## Influence and Leverage

In Lesson 2, Priya's iced-coffee cart passed its checkup: the residuals-vs-fitted plot was a flat, even band, so linearity and equal variance both held. The line looked trustworthy. But that verdict rested on 12 tidy days. What happens when day 13 is a freak?

A residual plot, and the whole line behind it, can be quietly run by a single row. One unusual observation can grab the least-squares line and swing it somewhere it does not belong, while every other number still looks calm. This lesson teaches you to catch that row. Drag the far-right point below and watch the green line chase it while the grey dashed line (the fit *without* that point) stays put. That gap between the two lines is the whole lesson.

By the end of this lesson you will be able to:

- Tell **leverage** (a point that is unusual in x) apart from **influence** (a point that actually moves the fit), and see why leverage alone is only the *potential* to do damage
- Measure leverage with hat values and influence with Cook's distance, and apply the standard rules of thumb in R
- Respond to an influential point the right way: investigate it and report the fit with and without it, instead of deleting it on sight

**Prerequisites:** Lesson 1 (you can fit a line with `lm()` and read its slope, intercept and R-squared) and Lesson 2 (a residual is actual minus predicted, and you can read a residuals-vs-fitted plot). You can run R and read its output. Every new term is defined as it appears.

::widget leverage-point {}

=== step === concept
::eyebrow The problem
## One row can rewrite the whole story

Here are Priya's 12 good days again, and the line they gave her back in Lesson 1: about **1.94** more cups per degree, with temperature explaining 96% of her daily swing (an R-squared of 0.96).

Now add day 13. A heatwave pushes the temperature to a record 39C, exactly the kind of scorcher that should sell her out. But that afternoon a power cut kills her blender for two hours, and she manages only **34 cups**. It is one row out of thirteen. Watch what it does to the model.

```r
# Priya's 12 good days from Lessons 1 and 2 (a fresh session starts empty).
coffee <- data.frame(
  temp = c(15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31),
  cups = c(30, 36, 33, 42, 40, 47, 44, 52, 55, 56, 61, 60)
)
fit12 <- lm(cups ~ temp, data = coffee)

# Add the one freak day: 39C, but a power cut held her to 34 cups.
coffee13 <- rbind(coffee, data.frame(temp = 39, cups = 34))
fit13 <- lm(cups ~ temp, data = coffee13)

# Put the two fits side by side.
round(rbind(with_heatwave = coef(fit13), without = coef(fit12)), 3)
#>               (Intercept)  temp
#> with_heatwave      25.745 0.798
#> without             0.818 1.944

round(c(R2_with = summary(fit13)$r.squared, R2_without = summary(fit12)$r.squared), 3)
#>    R2_with R2_without
#>      0.251      0.964
```

Read those numbers slowly. Adding a single day cut the slope from **1.944 to 0.798**, less than half its old value, and collapsed R-squared from **0.96 to 0.25**. Priya's honest "each warmer degree buys about two more cups" just became "each degree buys less than one," and a model that explained almost everything now explains almost nothing. Nothing about the other 12 days changed. Here is that one point in the picture:

::widget chart-plotter {"data":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60},{"x":39,"y":34}],"geoms":["point"],"x":"temp","y":"cups"}

Twelve points march up in a tidy line; the thirteenth sits far to the right and far too low. It is unusual in two different ways at once, and untangling those two kinds of unusual is exactly what leverage and influence are for.

=== step === concept
::eyebrow The first kind of unusual
## Leverage: how far out a point sits in x

Picture a seesaw. Someone sitting near the pivot barely tilts it; the same person at the very end swings the whole board with a nudge. A regression line balances the same way. A point sitting at an ordinary temperature has little pull; a point way out at the far end of the temperature axis can swing the line with a small change in its height. **Leverage** measures exactly that: how far a point sits from the center of the x values, and therefore how much power it has to move the fit.

The formal version comes from how the fitted values are built. Least squares produces the vector of predictions \(\hat{\mathbf y}\) by multiplying the actual outcomes \(\mathbf y\) by one matrix:

\[ \hat{\mathbf y} = H\,\mathbf y, \qquad H = X\left(X^{\top}X\right)^{-1}X^{\top} \]

Here \(X\) is the design matrix (a column of 1s for the intercept and a column of temperatures), and \(H\) is called the **hat matrix** because it is what "puts the hat on" \(\mathbf y\), turning outcomes into predictions. The **leverage** of day \(i\) is the \(i\)-th diagonal entry of that matrix, written \(h_{ii}\): it says how much day \(i\)'s own prediction \(\hat y_i\) is determined by its own observed value \(y_i\). Leverage always lands between 0 and 1, the leverages of all rows add up to \(p\) (the number of coefficients, here 2), so the **average** leverage is exactly \(p/n\), and a common flag is any point with more than **twice** that average:

\[ 0 \le h_{ii} \le 1, \qquad \sum_{i=1}^{n} h_{ii} = p, \qquad \bar h = \frac{p}{n}, \qquad \text{flag if } h_{ii} > \frac{2p}{n} \]

For a simple one-predictor regression there is a formula that makes the seesaw idea unmistakable:

\[ h_{ii} = \frac{1}{n} + \frac{(x_i - \bar x)^2}{\sum_{j=1}^{n}(x_j - \bar x)^2} \]

where \(\bar x\) is the mean temperature. Look at what is, and is not, in that formula: only the **x** values appear. Leverage depends on how far a day's temperature sits from the average temperature, and **nothing about how many cups were sold**. Let us read Priya's leverages straight from the model.

```r
# hatvalues() returns the leverage h_ii of every row.
round(hatvalues(fit13), 3)
#>     1     2     3     4     5     6     7     8     9    10    11    12    13
#> 0.250 0.185 0.159 0.117 0.101 0.082 0.078 0.081 0.088 0.113 0.131 0.153 0.464

# The two yardsticks: the average leverage p/n and the 2p/n flag (p = 2, n = 13).
c(average = 2/13, cutoff = 4/13)
#>   average    cutoff
#> 0.1538462 0.3076923
```

The 12 ordinary days sit near the 0.154 average. Day 13, the 39C heatwave, has a leverage of **0.464**, past the 0.308 flag and three times the typical day. It has enormous *potential* to move the line.

[KEY INSIGHT]
Leverage is set by the x values alone. A far-out point has high leverage whether it sits on the trend or wildly off it, so high leverage by itself is not proof of trouble. It is potential energy: whether that energy is ever released depends on the point's y value, which is the next idea.

=== step === quiz
::eyebrow Check yourself
## High leverage, harmless?

The 39C heatwave day has high leverage, \(h = 0.46\), well past the 0.31 flag. Suppose the power cut had never happened and Priya sold **77 cups** that day, right where her trend line predicts a scorcher should land. Its leverage is still 0.46 (temperature has not changed). What happens to the fitted line?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The line still gets dragged just as hard, because a leverage of 0.46 is high either way ::no This is the classic trap. Leverage is only the *potential* to move the line. A far-out point that lands right on the trend simply anchors the line more firmly, it does not bend it. Refit with an on-trend 77-cup day and the slope stays 1.95 (versus 1.94 without it), essentially unchanged.
- The line barely moves; a high-leverage point sitting ON the trend just anchors the fit, it does not tilt it. Leverage becomes real damage only when the point is also off-trend ::ok Exactly right. Same leverage (0.46), completely different outcome. With an on-trend 77-cup day the slope holds at 1.95; only the off-trend 34-cup day actually swings the line, dragging the slope down to about 0.80. Leverage is potential; it takes an off-trend y to release it.
- The line swings in the opposite direction, cancelling out the heatwave effect ::no A single point cannot flip the line's direction like that. An on-trend high-leverage point barely changes the fit at all; it is the point being far from the trend, not merely far out in x, that moves the line.

=== step === concept
::eyebrow The second kind of unusual
## Influence: leverage that actually moves the fit

Leverage is only half the story. A point does real damage only when it combines high leverage with being **far from the trend the other points make**. That second ingredient is the point's **discrepancy**: how far its observed y sits from where the rest of the data would have predicted it, which is just its residual from Lesson 2. Roughly,

\[ \textbf{influence} \;\approx\; \textbf{leverage} \;\times\; \textbf{discrepancy}. \]

Read it as a product, because that is the crucial part. If either factor is near zero, the product is near zero. A point in the crowded middle (low leverage) is harmless no matter how odd its y. A far-out point that sits on the trend (low discrepancy) is harmless too. It takes **both**, a far-out x and an off-trend y, to grab the line. Priya's heatwave day has both: leverage 0.46 and a huge negative residual (34 cups where the trend expected about 77).

Feel it directly. The far-right point below has high leverage; drag its value up and down. When you park it on the trend line, the green fit barely twitches. Pull it far off, and the green line lunges to chase it while the grey dashed line (the fit without that point) holds still. The readout reports the slope with and without the point so you can watch influence appear and disappear while the leverage never changes.

::widget leverage-point {}

[NOTE]
This is why an outlier in a scatterplot is not automatically a problem, and why a "normal-looking" point can be. What matters for the line is not how weird a point looks on its own, but the product of its leverage and its discrepancy. We need one number that captures that product. That is Cook's distance.

=== step === concept
::eyebrow One number for total influence
## Cook's distance

Cook's distance answers the most direct question you could ask: **if I deleted this one row and refit, how much would all my predictions move?** For row \(i\), leave it out, refit the model, and compare every fitted value to the original:

\[ D_i = \frac{\sum_{j=1}^{n}\left(\hat y_j - \hat y_{j(i)}\right)^2}{p\,s^2} \]

where \(\hat y_j\) is the original prediction for day \(j\), \(\hat y_{j(i)}\) is the prediction for day \(j\) from the model refit **with row \(i\) removed**, \(p\) is the number of coefficients (2), and \(s^2\) is the residual variance (the typical squared miss). The numerator literally adds up how far every prediction shifts when row \(i\) leaves; a big \(D_i\) means that one row is holding the whole line in place.

You almost never compute it by refitting \(n\) times, because there is an equivalent formula that folds our two ingredients into one line:

\[ D_i = \frac{r_i^{\,2}}{p}\cdot\frac{h_{ii}}{1 - h_{ii}}, \qquad r_i = \frac{e_i}{s\sqrt{1 - h_{ii}}} \]

Here \(e_i\) is the raw residual from Lesson 2, and \(r_i\) is the **standardized residual**, the residual rescaled so that a value of about \(\pm 2\) is already unusual. Now the product is explicit: \(r_i^2\) is the **discrepancy** part (how off-trend the point is) and \(h_{ii}/(1-h_{ii})\) is the **leverage** part. Cook's distance is large only when a point is off-trend *and* has high leverage, exactly the definition of influence. Two rules of thumb flag a row for a closer look:

\[ D_i > \frac{4}{n} \quad\text{(worth investigating)}, \qquad D_i \gtrsim 1 \quad\text{(a loud alarm)}. \]

Let us read Priya's Cook's distances.

```r
# cooks.distance() returns D_i for every row.
round(cooks.distance(fit13), 3)
#>     1     2     3     4     5     6     7     8     9    10    11    12    13
#> 0.143 0.017 0.061 0.000 0.004 0.004 0.000 0.016 0.034 0.039 0.120 0.105 4.549

4 / nrow(coffee13)   # the 4/n cutoff for n = 13
#> [1] 0.3076923
```

Every ordinary day sits below 0.15. The heatwave day scores **4.549**, more than four times the "loud alarm" level of 1 and fifteen times the 4/n cutoff. That single number, built from the point's leverage (0.46) and its off-trend residual, captures everything we saw: one row is running the model.

=== step === tryit
::eyebrow Your turn
## Flag the influential rows

The 4/n rule says: flag any row whose Cook's distance is bigger than 4 divided by \(n\). Priya's `fit13` is already built. Complete the cutoff so R returns the day numbers that trip the rule. Fill in the blank.

```r
n  <- nrow(coffee13)      # n = 13 days
cd <- cooks.distance(fit13)
which(cd > ____ / n)      # which day(s) exceed the 4/n cutoff?
```
::check {"regex":"cd\\s*>\\s*4\\s*/\\s*n","gate":true,"difficulty":"intermediate","ok":"That is the 4/n rule: which(cd > 4 / n) returns a single day, row 13, the heatwave. Every other day sits comfortably below the cutoff, so the rule cleanly isolates the one row that is running the fit.","no":"The numerator of the 4/n rule is 4: which(cd > 4 / n). It should return just row 13, the heatwave day."}
::solution
```r
n  <- nrow(coffee13)
cd <- cooks.distance(fit13)
which(cd > 4 / n)
#> 13
#> 13
```

=== step === concept
::eyebrow In R, and what to do next
## Reading it, and responding to it

You do not have to remember every formula. R packages the whole battery of influence diagnostics into `influence.measures()`, and `summary()` prints **only** the rows it thinks are worth a second look. Two built-in plots then show the same story at a glance.

```r
# The full diagnostic battery; summary() prints only the flagged rows.
summary(influence.measures(fit13))
#> Potentially influential observations of
#>          lm(formula = cups ~ temp, data = coffee13) :
#>
#>    dfb.1_   dfb.temp dffit    cov.r    cook.d   hat
#> 13  10.80_* -12.63_* -13.83_*   0.00_*   4.55_*   0.46_*

# The two diagnostic plots made for exactly this job:
plot(fit13, which = 4)   # Cook's distance: one bar per day, day 13 towers over the rest
plot(fit13, which = 5)   # residuals vs leverage, with Cook's distance contour lines
```

Only row 13 is flagged, with a starred `cook.d` of 4.55 and `hat` of 0.46, the same two numbers we computed by hand. The `which = 4` plot draws one Cook's distance bar per day so the outlier towers over the rest; the `which = 5` plot puts leverage on the x-axis and standardized residuals on the y-axis, and any point drifting past its dashed Cook's distance contours is both high-leverage and off-trend, the danger zone.

Now the important part, the part a formula cannot tell you: **finding an influential point is the start of the work, not the end.**

[WARNING]
Never delete an influential row just because it is influential. A high Cook's distance is a question, not a verdict. First investigate: is it a **data error** (a typo, a broken sensor, the wrong units) that you can honestly correct or drop, or is it a **real but rare event** the model genuinely needs to know about? Priya's power cut was real. Deleting it would hide the truth that her demand model breaks when the equipment does. The honest report shows the fit **both ways**, with and without the point, and explains the difference, so the reader sees how much rests on that one row.

=== step === quiz
::eyebrow Check yourself
## One row, huge Cook's distance

Your diagnostics flag a single row with a Cook's distance of 4.5, far above every other row and far past the 4/n rule. What is the right next move?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Delete the row and refit; a point that influential is bad data by definition ::no Influence is not a synonym for error. A high Cook's distance only tells you the row is *moving the fit*, not *why*. Priya's heatwave is a real, correct measurement of what happens during a power cut; deleting it would erase a true and useful fact about her demand.
- Investigate the row first (data-entry error, or a real rare event?), then report the fit both with and without it and explain the gap ::ok Exactly. A high Cook's distance is a question, not a verdict. You look into what makes the row special, decide honestly whether to correct, keep, or set it aside, and either way you show how much the conclusion depends on that one point by reporting both fits.
- Nothing; a high Cook's distance only affects that one row's own prediction, not the rest of the model ::no The opposite is true, and it is the whole reason Cook's distance exists: it measures how far *every* fitted value moves when that row is dropped. One high-Cook's-distance row bends the entire line, changing the slope and every prediction, as Priya's 1.94-to-0.80 collapse showed.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take leverage and influence further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the "Potential Problems" section covers outliers, high-leverage points and the leverage statistic with the same plots you used here.
- [The Elements of Statistical Learning, ch. 3 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the deeper treatment of the linear model, the hat matrix, and where leverage comes from.
- [R documentation: influence.measures](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html) - the full set of R's regression influence diagnostics (hat values, Cook's distance, DFFITS, DFBETAS) and how each is computed.
- [Penn State STAT 501, Lesson 11: Influential Points](https://online.stat.psu.edu/stat501/lesson/11) - a free, worked course chapter on leverage, studentized residuals, Cook's distance, and the difference between an outlier and an influential point.
- [Cook (1977), Detection of Influential Observation in Linear Regression, Technometrics 19(1)](https://doi.org/10.2307/1268249) - the original paper that introduced Cook's distance.

=== step === complete
## Lesson 3 complete

You can now spot the one row that runs a regression, and you know the two-part reason it can. **Leverage** ( the hat value \(h_{ii}\) ) measures how far a point sits out in x; it is only *potential*, because it depends on x alone. **Influence** is that potential released, roughly leverage times discrepancy, and **Cook's distance** puts a single number on it: how far every prediction moves when a row is dropped, flagged by the 4/n rule and read straight from `influence.measures()` or `plot(fit, which = 4)`. Above all, you know that finding an influential point starts an investigation, it does not end one: you look, you decide honestly, and you report the fit both ways.

Next, Lesson 4: Multicollinearity in Regression. So far one *row* has been the troublemaker. Next the trouble comes from the *columns*: when two predictors carry nearly the same information, the coefficients turn unstable and can even flip sign, and you will learn to detect it with the variance inflation factor and fix it.
