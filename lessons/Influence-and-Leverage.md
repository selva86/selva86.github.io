---
title: "Regression Modeling Lesson 3: Influence and Leverage"
catalog_blurb: "How a single unusual point can dominate a regression, and how to find it."
description: "High-leverage points vs influential observations, why leverage is only potential, and how Cook's distance measures what one row does to a regression fit in R."
keywords: "leverage, influence, Cook's distance, hat values, influential observations, high-leverage points, regression diagnostics, outliers, hatvalues, influence.measures, R"
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

In Lesson 2 you learned to read a regression's residuals like a lie detector: a flat band means the assumptions hold, a funnel or a curve means trouble. But here is the catch nobody warns you about. Those plots, and the slope and p-values underneath them, can all be quietly run by a **single row** of data.

One unusual day in Priya's iced-coffee records is about to swing her whole line. By the end of this lesson you will be able to spot that row, measure exactly how much damage it does, and decide what to do about it.

By the end of this lesson you will be able to:

- Tell **leverage** (a point unusual in its predictor) apart from **influence** (a point that actually moves the fit)
- Compute hat values in R and judge them against the average leverage and the 2p/n cutoff
- Use **Cook's distance** to put one number on how much a single row controls the model, and apply the 4/n rule
- Respond to an influential point the right way in R, instead of just deleting it

**Prerequisites:** Lessons 1 and 2 (you can fit a line with `lm()`, read its slope and intercept, and you know a residual is actual minus predicted). You can run R and read its output. Every new term is defined as it appears.

Drag the far-right point below and watch the solid line chase it while the dashed "line without that point" stays put. That swing is the whole lesson.

::widget leverage-point {}

=== step === concept
::eyebrow The problem
## One row can rewrite the whole story

Priya's first twelve days were tidy: temperatures from 15 to 31 degrees, cups climbing steadily with the heat. Then came day thirteen, a freak 39-degree heatwave. It should have been her best day ever, but a midday power cut killed her blender for two hours and she sold only 34 cups.

Watch what that one row does. Below is the scatter of all thirteen days; the lonely point at the bottom right is the heatwave. Then we refit the line with and without it.

::widget chart-plotter {"data":[{"x":15,"y":30},{"x":17,"y":36},{"x":18,"y":33},{"x":20,"y":42},{"x":21,"y":40},{"x":23,"y":47},{"x":24,"y":44},{"x":26,"y":52},{"x":27,"y":55},{"x":29,"y":56},{"x":30,"y":61},{"x":31,"y":60},{"x":39,"y":34}],"geoms":["point"],"x":"temp","y":"cups"}

```r
# Priya's 12 normal days from Lessons 1-2 (a fresh R session starts empty).
coffee <- data.frame(
  temp = c(15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31),
  cups = c(30, 36, 33, 42, 40, 47, 44, 52, 55, 56, 61, 60)
)

# Day 13: the 39-degree heatwave with the power cut. Far hotter than any normal
# day, and far below the trend at only 34 cups. We append it as the last row.
coffee <- rbind(coffee, data.frame(temp = 39, cups = 34))

round(coef(lm(cups ~ temp, data = coffee[-13, ])), 3)   # the 12 normal days
#> (Intercept)        temp 
#>       0.818       1.944 
round(coef(lm(cups ~ temp, data = coffee)), 3)           # all 13 days
#> (Intercept)        temp 
#>      25.745       0.798 
```

Look at the slope. Without the heatwave day, each warmer degree buys Priya about **1.94** more cups, the story from Lessons 1 and 2. Add that one row and the slope collapses to **0.80**, less than half. One day out of thirteen has rewritten her entire conclusion about how temperature drives sales. The rest of this lesson is about why that happens and how to catch it.

=== step === concept
::eyebrow Leverage
## Leverage: a point unusual in x

Why does that single row have so much pull? Picture a seesaw. A small child sitting far out at the end tips the whole plank, while a heavy adult near the middle barely moves it. Distance from the center is what creates the swing. A regression line works the same way: a point whose **x-value** sits far from the other x-values has a long lever arm, so the line tilts to follow it. Priya's heatwave is at 39 degrees while every normal day sits between 15 and 31, so it is sitting way out at the end of the seesaw.

That distance-in-x has a precise name, **leverage**, and a precise formula. The vector of fitted values is a linear function of the observed responses:

\[ \hat{y} = Hy, \qquad H = X(X^\top X)^{-1}X^\top \]

Here \(y\) is the column of observed cups, \(\hat{y}\) is the column of fitted (predicted) cups, \(X\) is the design matrix (a column of 1s plus the temperatures), and \(H\) is the **hat matrix**, so called because it "puts the hat on \(y\)." The leverage of row \(i\) is the \(i\)-th diagonal entry of that matrix, written \(h_{ii}\). It measures how strongly day \(i\)'s own observed value pulls its own prediction. Two facts make \(h_{ii}\) easy to read:

\[ 0 \le h_{ii} \le 1, \qquad \sum_{i=1}^{n} h_{ii} = p \]

where \(n\) is the number of rows and \(p\) is the number of estimated parameters (here \(p = 2\): an intercept and a slope). Because the leverages add up to \(p\), the **average** leverage is always \(\bar h = p/n\), and a common rule of thumb flags any point above twice that, \(h_{ii} > 2p/n\), as high leverage. Let R compute them.

```r
fit <- lm(cups ~ temp, data = coffee)
h <- hatvalues(fit)            # the diagonal of the hat matrix: one leverage per row
round(h, 3)
#>     1     2     3     4     5     6     7     8     9    10    11    12    13 
#> 0.250 0.185 0.159 0.117 0.101 0.082 0.078 0.081 0.088 0.113 0.131 0.153 0.464 

mean(h)        # average leverage is always p/n; here p = 2 parameters, n = 13 rows
#> [1] 0.1538462
2 * mean(h)    # the "high leverage" cutoff: twice the average, i.e. 2p/n
#> [1] 0.3076923
```

Row 13, the heatwave, has leverage **0.464**: three times the average and well past the 0.308 cutoff. It has, by far, the longest lever arm in the dataset.

=== step === quiz
::eyebrow Check yourself
## High leverage, on the trend

Suppose a different unusual day shows up: a 40-degree scorcher (far out in x, so high leverage), but this time Priya sells exactly the number of cups the existing trend predicts for 40 degrees, sitting right on the line. What happens to the fitted line when you add this point?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It swings sharply, because a high-leverage point always dominates the fit ::no High leverage is only the *potential* to move the line, not a guarantee. A point sitting on the trend agrees with the line, so there is nothing for it to pull toward; it leaves the slope almost unchanged.
- It barely moves, because the point agrees with the line; leverage gives it the power to swing the fit, but it has no reason to use it ::ok Exactly. Leverage is potential, not action. A far-out point that lands on the trend confirms the line rather than fighting it. The heatwave was dangerous because it was far out in x AND far off the trend; remove either ingredient and the influence shrinks.
- It is impossible to say without running the regression ::no You can reason it out: a point that lies on the existing line adds no conflict, so the least-squares line that already passes through it stays put. High leverage matters only when the point also disagrees with the trend.

=== step === concept
::eyebrow Influence
## Influence: leverage actually used

The quiz holds the key distinction of this whole lesson. **Leverage** is how far out in x a point sits, its *potential* to move the line. **Influence** is how much it *actually* moves the line once you include it. They are not the same thing, and the link between them is intuitive:

\[ \text{influence} \;\approx\; \text{leverage} \;\times\; \text{discrepancy} \]

"Discrepancy" just means how far the point sits from where the line would otherwise go: its residual. A point needs **both** ingredients to be influential. A far-out point that lands on the trend (high leverage, tiny residual) barely budges the fit, as you just reasoned. A point with a big residual but sitting in the crowded middle of x (low leverage) tugs a little but cannot tip the seesaw. Only a point that is far out in x AND far off the trend, like Priya's heatwave, gets to swing the whole line.

Drag the far-right point's value below. When you park it on the trend the line holds steady; drag it up or down and watch the solid line pivot away from the dashed one. Same leverage throughout; only the discrepancy changes, and with it the influence.

::widget leverage-point {}

The standardized residual makes the discrepancy comparable across points (it scales each residual by its expected size), so we can see both ingredients side by side.

```r
# Discrepancy: how far each day sits from the line, standardized so days compare.
round(rstandard(fit), 2)
#>     1     2     3     4     5     6     7     8     9    10    11    12    13 
#> -0.93 -0.38 -0.81  0.03 -0.27  0.31 -0.10  0.60  0.84  0.79  1.26  1.08 -3.24 
```

Row 13 has a standardized residual of about **-3.2** (it sits more than three standard errors below the line) on top of its leverage of 0.46. Big lever arm times big discrepancy equals a line-swinging point. Row 11 has the next-largest residual but tiny leverage, so it stays harmless.

=== step === concept
::eyebrow Cook's distance
## Cook's distance: one number for influence

"Leverage times discrepancy" is the right intuition, but you want a single number you can rank rows by. That number is **Cook's distance**, \(D_i\). It asks a wonderfully direct question: if I deleted row \(i\) and refit, how far would *all* the fitted values move? A big answer means that one row is steering the whole model.

\[ D_i = \frac{e_i^{2}}{p\,s^{2}}\cdot\frac{h_{ii}}{(1-h_{ii})^{2}} \;=\; \frac{r_i^{2}}{p}\cdot\frac{h_{ii}}{1-h_{ii}} \]

Read the right-hand form, because it makes the intuition exact. \(r_i\) is the standardized residual (the **discrepancy**), \(h_{ii}\) is the leverage, and \(p\) is the number of parameters. (In the equivalent left-hand form, \(e_i\) is the plain residual and \(s\) the typical size of a residual; both forms give the same number.) The first factor grows with the residual; the second factor, \(h_{ii}/(1-h_{ii})\), grows as leverage approaches 1. Multiply them and you get influence, exactly as the intuition promised. A row scores high on Cook's distance only when it is both off the trend and far out in x.

[KEY INSIGHT]
Cook's distance fuses the two ingredients into one ranking. A common rule of thumb flags \(D_i > 4/n\) for a closer look, and any \(D_i\) near or above 1 is a loud alarm that one row is dominating the fit.

```r
round(cooks.distance(fit), 3)
#>     1     2     3     4     5     6     7     8     9    10    11    12    13 
#> 0.143 0.017 0.061 0.000 0.004 0.004 0.000 0.016 0.034 0.039 0.120 0.105 4.549 
4 / nrow(coffee)            # the 4/n rule of thumb: above this is worth a look
#> [1] 0.3076923
which.max(cooks.distance(fit))   # which row dominates the fit?
#> 13 
#> 13 
```

The heatwave's Cook's distance is **4.55**, against a 4/n cutoff of 0.31 and a "loud alarm" threshold of 1. Every other day sits below 0.15. There is no ambiguity: one row out of thirteen is running this regression.

=== step === tryit
::eyebrow Your turn
## Flag the influential rows

Reading a column of numbers by eye does not scale past a handful of rows. Instead, ask R to hand you the row numbers whose Cook's distance clears the 4/n rule of thumb. Fill in the blank with the numerator of that rule.

```r
# Flag every day whose Cook's distance clears the 4/n rule of thumb.
influential <- which(cooks.distance(fit) > ____ / nrow(coffee))
influential
```
::check {"regex":"4\\s*/\\s*nrow","gate":true,"difficulty":"intermediate","ok":"Right. which() returns the positions where the test is TRUE, and only row 13 (the heatwave) clears 4/n here, so it is the single point worth investigating.","no":"The rule of thumb is 4/n, so the numerator is 4: write cooks.distance(fit) > 4 / nrow(coffee)."}
::solution
```r
influential <- which(cooks.distance(fit) > 4 / nrow(coffee))
influential
#> 13 
#> 13 
```

=== step === concept
::eyebrow In R
## Reading it in R, and what to do next

You do not have to call each diagnostic by hand. `influence.measures()` reports them all at once and stars the rows worth a look, and base R draws two influence plots straight from the fitted model.

```r
# Every influence measure at once; rows flagged with a * are worth investigating.
influence.measures(fit)

# Two diagnostic plots R draws for you:
plot(fit, which = 4)   # Cook's distance: one bar per row, row 13 towers over the rest
plot(fit, which = 5)   # residuals vs leverage, with Cook's distance contours

# The honest move: report the fit BOTH ways and let the reader see the gap.
round(coef(lm(cups ~ temp, data = coffee)), 3)        # with the heatwave day
round(coef(lm(cups ~ temp, data = coffee[-13, ])), 3) # without it
```

Now the hard part, which is judgement, not code.

[WARNING]
A high Cook's distance is a flag, not a verdict. Never delete a row just because it is influential. First find out WHY. Priya's heatwave is a real day, not a typo, but it is unrepresentative: a power cut, not normal demand. The honest options are to report the fit with and without it, to model the heatwave regime separately, or to use a method that is less sensitive to single points (robust regression). Silently dropping the row hides exactly the surprise your reader most needs to know about.

=== step === quiz
::eyebrow Check yourself
## What do you do with it?

Your diagnostics flag one row with a Cook's distance of 4.5, far above every other point and well past the rule of thumb. What is the right next step?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Delete the row and refit; a Cook's distance that high proves the point is bad data ::no A large Cook's distance proves the point is *influential*, not that it is wrong. Deleting before you understand it can erase a genuine, important signal (a real heatwave, a real crash) and quietly bias your model.
- Investigate why the point is extreme (data error, or a real but unusual case), then report the fit with and without it so the effect is visible ::ok Exactly. Influence is a prompt to investigate, not a licence to delete. You check whether it is an error or a real rare case, then you are transparent: show both fits, or model the unusual regime separately, rather than hiding the row.
- Ignore it, because one row out of many cannot really matter ::no This whole lesson is the counterexample: one row out of thirteen halved Priya's slope. With high leverage and a large residual, a single point genuinely can dominate the fit, so it must be addressed, not ignored.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take influence diagnostics further:

- [Cook (1977), Detection of Influential Observation in Linear Regression (Technometrics)](https://doi.org/10.2307/1268249) - the original paper that defined the Cook's distance you used here.
- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - the "Potential Problems" section explains outliers and high-leverage points and why they differ.
- [R documentation: influence.measures](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html) - every diagnostic you called (hatvalues, cooks.distance, dffits, dfbetas) and how to read its flags.
- [R documentation: plot.lm](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html) - exactly what the which = 4 (Cook's distance) and which = 5 (residuals vs leverage) plots show.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/) - a free course with thorough, worked lessons on leverage, influence and Cook's distance.

=== step === complete
## Lesson 3 complete

You can now catch the one row that quietly controls a regression. **Leverage** (\(h_{ii}\)) is how far a point sits from the rest in its predictor, its potential to move the line; you read it against the \(p/n\) average and the \(2p/n\) cutoff. **Influence** is that potential actually spent, roughly leverage times discrepancy, and **Cook's distance** fuses both into one number that ranks how much each row steers the whole fit, with 4/n as a screening cutoff. And you know the discipline: a flag is an invitation to investigate, never an automatic delete.

Next, Lesson 4: Multicollinearity in Regression. So far one row caused trouble; next you will see how two *columns* can. When predictors are correlated, the coefficients turn unstable and start contradicting common sense. You will meet the variance inflation factor and learn how to detect and fix it.
