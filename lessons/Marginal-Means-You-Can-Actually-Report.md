---
title: "ANOVA and Multiple Comparisons Lesson 8: Marginal means you can actually report"
catalog_blurb: "Get the adjusted group mean your report needs, not a misleading raw average."
description: "mtcars shows cylinder groups' raw mpg averages distorted by an uneven mix of automatic and manual cars, and how a model's marginal mean corrects for it."
keywords: "marginal means, estimated marginal means, emmeans, adjusted mean, prediction grid, unbalanced design, confounding, Tukey contrasts, lm, ANOVA"
post_type: "LESSON"
curriculum_id: "4.50.8"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "8"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: ""
course_prev: "When-False-Discovery-Rate-Beats-Bonferroni.html"
---

=== step === cover
## Marginal means you can actually report

Today let's work out the one number a report actually wants for each cylinder group, and see why it is usually not that group's plain average.

Here is the mtcars dataset: 32 cars, each with a cylinder count, either 4, 6 or 8, and a transmission type, either automatic or manual, measured on fuel economy in mpg. A report on this data wants one number per cylinder count: its average mpg. That sounds like something `tapply()` already gives you. Before computing it, look at all 32 cars plotted together, colored by transmission.

::widget chart-plotter {"data":[{"x":5.93,"y":21,"fill":"Manual"},{"x":5.96,"y":21,"fill":"Manual"},{"x":4.02,"y":22.8,"fill":"Manual"},{"x":6.12,"y":21.4,"fill":"Automatic"},{"x":7.91,"y":18.7,"fill":"Automatic"},{"x":6.12,"y":18.1,"fill":"Automatic"},{"x":8.13,"y":14.3,"fill":"Automatic"},{"x":4.05,"y":24.4,"fill":"Automatic"},{"x":4.04,"y":22.8,"fill":"Automatic"},{"x":5.87,"y":19.2,"fill":"Automatic"},{"x":5.91,"y":17.8,"fill":"Automatic"},{"x":7.9,"y":16.4,"fill":"Automatic"},{"x":8.06,"y":17.3,"fill":"Automatic"},{"x":7.97,"y":15.2,"fill":"Automatic"},{"x":8.08,"y":10.4,"fill":"Automatic"},{"x":8,"y":10.4,"fill":"Automatic"},{"x":8.07,"y":14.7,"fill":"Automatic"},{"x":4.15,"y":32.4,"fill":"Manual"},{"x":3.96,"y":30.4,"fill":"Manual"},{"x":4.08,"y":33.9,"fill":"Manual"},{"x":4.13,"y":21.5,"fill":"Automatic"},{"x":7.91,"y":15.5,"fill":"Automatic"},{"x":8.05,"y":15.2,"fill":"Automatic"},{"x":7.89,"y":13.3,"fill":"Automatic"},{"x":7.93,"y":19.2,"fill":"Automatic"},{"x":3.97,"y":27.3,"fill":"Manual"},{"x":3.85,"y":26,"fill":"Manual"},{"x":3.97,"y":30.4,"fill":"Manual"},{"x":8.11,"y":15.8,"fill":"Manual"},{"x":5.95,"y":19.7,"fill":"Manual"},{"x":8,"y":15,"fill":"Manual"},{"x":4.03,"y":21.4,"fill":"Manual"}],"x":"cylinders","y":"mpg","geoms":["point"],"code":{"point":"ggplot(mtcars, aes(jitter(cyl, amount = 0.15), mpg, colour = transmission)) +\n  geom_point(size = 2.6)"}}

Look at the colors within each cylinder count instead of just the overall spread. The 4-cylinder cars on the left are mostly the manual color. The 8-cylinder cars on the right are mostly the automatic color. Each cylinder group is not just a pile of mpg values, it is a pile with its own particular mix of transmission types sitting inside it, and that mix is different from one group to the next.

=== step === concept
## Why a raw group mean is confounded by an uneven mix

Let's compute the obvious average anyway, and see exactly where that mix causes trouble.

```r
# Compare the raw average mpg per cylinder count with how each group splits by transmission
raw_means <- round(tapply(mtcars$mpg, mtcars$cyl, mean), 2)
raw_means
#>     4     6     8 
#> 26.66 19.74 15.10 

mix <- table(cylinders = mtcars$cyl, transmission = mtcars$am)
mix
#>          transmission
#> cylinders  0  1
#>         4  3  8
#>         6  4  3
#>         8 12  2
```

4-cylinder cars average 26.66 mpg, 6-cylinder cars average 19.74, and 8-cylinder cars average 15.10. On its own that looks like a complete answer: three cylinder counts, three averages, done.

Now look at the second table. Transmission is coded 0 for automatic and 1 for manual, and it is nowhere near evenly spread across the three cylinder counts. The 4-cylinder group holds 3 automatic cars and 8 manual ones. The 8-cylinder group is close to the mirror image: 12 automatic cars and only 2 manual. The 6-cylinder group sits roughly in between, at 4 and 3.

That split matters because transmission type, on its own, moves mpg by a lot.

```r
# Compare average mpg for automatic cars against manual cars, ignoring cylinder count
am_means <- round(tapply(mtcars$mpg, mtcars$am, mean), 2)
am_means
#>     0     1 
#> 17.15 24.39 
```

Automatic cars average 17.15 mpg. Manual cars average 24.39, about 7 mpg higher, regardless of cylinder count. So the 4-cylinder group's raw mean of 26.66 is not purely measuring what 4 cylinders does to mpg. It is also picking up the fact that 8 of its 11 cars happen to be the higher-mileage manual kind. The 8-cylinder group has the opposite problem: its raw mean of 15.10 is weighed down by having almost no manual cars to lift it. Neither number is a clean read on cylinder count alone. Each one is a blend of cylinder count and whatever transmission mix happened to land in that group, and the two groups' mixes are not even close to the same. This is what confounded means here: cylinder count and transmission type are tangled together in the raw average, and that single number gives you no way to tell how much of it is one and how much is the other.

=== step === concept
## Fitting one model that accounts for both variables

To pull the two effects apart, fit one model that carries both cylinder count and transmission type at the same time, instead of averaging over one while the other hides inside it.

```r
# Fit one model that adjusts mpg for both cylinder count and transmission type
m <- lm(mpg ~ factor(cyl) + factor(am), data = mtcars)
round(coef(m), 2)
#>  (Intercept) factor(cyl)6 factor(cyl)8  factor(am)1 
#>        24.80        -6.16       -10.07         2.56 
```

Read those four numbers as one baseline plus three offsets from it. `factor(cyl)` treats 4 cylinders as its reference level, and `factor(am)` treats 0, automatic, as its reference level, so the intercept, 24.80, is the model's predicted mpg for exactly that combination: a 4-cylinder car with an automatic transmission. Each remaining coefficient says how much to move away from that baseline for one specific change, holding everything else fixed.

`factor(cyl)6` is -6.16: moving from 4 cylinders to 6, transmission still automatic, costs 6.16 mpg. `factor(cyl)8` is -10.07: moving to 8 cylinders, still automatic, costs 10.07 mpg. `factor(am)1` is +2.56: switching from automatic to manual, at any cylinder count, adds 2.56 mpg.

So to predict an 8-cylinder manual car, add the intercept, the cyl8 offset, and the am1 offset: 24.80 - 10.07 + 2.56 = 17.29. The model now carries transmission type explicitly as its own term, instead of letting it hide inside a group average the way it did in the step before this one.

=== step === widget
## How uneven the two transmission groups really are

The count table two steps back said the 32 cars split unevenly by transmission within each cylinder count. Here is that same imbalance as a picture instead of a table: the same 32 cars, split into an automatic panel and a manual panel.

::widget facet-grid {"data":[{"x":5.93,"y":21,"facet":"Manual"},{"x":5.96,"y":21,"facet":"Manual"},{"x":4.02,"y":22.8,"facet":"Manual"},{"x":6.12,"y":21.4,"facet":"Automatic"},{"x":7.91,"y":18.7,"facet":"Automatic"},{"x":6.12,"y":18.1,"facet":"Automatic"},{"x":8.13,"y":14.3,"facet":"Automatic"},{"x":4.05,"y":24.4,"facet":"Automatic"},{"x":4.04,"y":22.8,"facet":"Automatic"},{"x":5.87,"y":19.2,"facet":"Automatic"},{"x":5.91,"y":17.8,"facet":"Automatic"},{"x":7.9,"y":16.4,"facet":"Automatic"},{"x":8.06,"y":17.3,"facet":"Automatic"},{"x":7.97,"y":15.2,"facet":"Automatic"},{"x":8.08,"y":10.4,"facet":"Automatic"},{"x":8,"y":10.4,"facet":"Automatic"},{"x":8.07,"y":14.7,"facet":"Automatic"},{"x":4.15,"y":32.4,"facet":"Manual"},{"x":3.96,"y":30.4,"facet":"Manual"},{"x":4.08,"y":33.9,"facet":"Manual"},{"x":4.13,"y":21.5,"facet":"Automatic"},{"x":7.91,"y":15.5,"facet":"Automatic"},{"x":8.05,"y":15.2,"facet":"Automatic"},{"x":7.89,"y":13.3,"facet":"Automatic"},{"x":7.93,"y":19.2,"facet":"Automatic"},{"x":3.97,"y":27.3,"facet":"Manual"},{"x":3.85,"y":26,"facet":"Manual"},{"x":3.97,"y":30.4,"facet":"Manual"},{"x":8.11,"y":15.8,"facet":"Manual"},{"x":5.95,"y":19.7,"facet":"Manual"},{"x":8,"y":15,"facet":"Manual"},{"x":4.03,"y":21.4,"facet":"Manual"}],"geom":"point","x":"cylinders","y":"mpg","facetVar":"transmission"}

Flip between the two panels. The manual panel is thin on 8-cylinder cars, only 2 of them. The automatic panel is thin on 4-cylinder cars, only 3 of them. That is the exact imbalance the raw group means were quietly absorbing: whichever cylinder count happens to pair with more manual cars gets a lift from the manual cars' higher mpg, and whichever cylinder count pairs with more automatic cars gets pulled down by the automatic cars' lower mpg.

=== step === concept
## Averaging the prediction grid by hand

The model from two steps back can predict mpg for any combination of cylinder count and transmission, even a combination that is rare in this particular sample of 32 cars. Build every combination it can predict, all six of them, and read off what it says.

```r
# Build every combination of cylinder count and transmission, and predict mpg for each
grid <- expand.grid(cyl = c(4, 6, 8), am = c(0, 1))
grid$pred <- round(predict(m, newdata = grid), 2)
grid
#>   cyl am  pred
#> 1   4  0 24.80
#> 2   6  0 18.65
#> 3   8  0 14.73
#> 4   4  1 27.36
#> 5   6  1 21.21
#> 6   8  1 17.29
```

Six rows, two for every cylinder count: one at automatic, one at manual. Now get one adjusted number per cylinder count by averaging its two rows together.

```r
# Average the two transmission predictions equally within each cylinder count
marginal_means <- round(tapply(grid$pred, grid$cyl, mean), 2)
marginal_means
#>     4     6     8 
#> 26.08 19.93 16.01 
```

That averaging step is the one technique this whole lesson rests on, so look closely at what it did. For 4 cylinders it took 24.80 (automatic) and 27.36 (manual) and averaged them straight: (24.80 + 27.36) / 2 = 26.08. It gave automatic and manual equal weight, one vote each, regardless of how many real 4-cylinder cars in this sample are actually automatic (3) versus manual (8). That equal weighting is exactly what separates this number, called a marginal mean, from the raw mean computed earlier in this lesson. The raw mean weighted automatic and manual by however many real cars happened to fall into each group. The marginal mean weights them 50/50 on purpose, as if the sample had been balanced all along.

Compare the two sets of numbers directly. The raw means were 26.66, 19.74 and 15.10. The marginal means are 26.08, 19.93 and 16.01. Every one of them moved, and the direction makes sense once you remember the mix behind each group. 4 cylinders is mostly manual cars in this sample, so its raw mean was pulled up toward the manual average, and forcing an equal weighting on it pulls that number back down, from 26.66 to 26.08. 8 cylinders is mostly automatic, so the opposite happens: its raw mean was pulled down, and equal weighting lifts it, from 15.10 to 16.01.

=== step === quiz
## Quick check: why the adjusted mean moves away from the raw one

4-cylinder cars moved from a raw mean of 26.66 down to a marginal mean of 26.08. Why?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The model used to compute the marginal mean is wrong, so its number should not be trusted over the raw mean. ::no
- Most of this sample's 4-cylinder cars are manual, and manual cars average higher mpg, so the raw mean was inflated by that mix. Weighting automatic and manual equally corrects for it. ::ok Exactly. 8 of the 11 four-cylinder cars in this sample are manual, and manual cars average 24.39 mpg against automatic's 17.15. The raw mean rode along with that mix; the marginal mean does not.
- 4-cylinder cars have too few observations in this sample to average reliably. ::no
- Averaging always lowers a group's mean below its raw value. ::no Averaging does not always push a mean down. 8-cylinder cars moved the other way, rising from a raw mean of 15.10 to a marginal mean of 16.01, because that group is mostly automatic, and equal weighting pulls it toward the higher manual average instead. What happens here depends on each group's own mix of automatic and manual cars, not on some general rule about averaging.

=== step === concept
## emmeans as the shortcut for the same number

The hand-built grid two steps back is exactly what a function called `emmeans()`, from the package of the same name, computes for you in one line. It is not available in this page's browser environment, so run this block locally in R instead of pressing a Run button on it.

```r-static
# Get the marginal mean of mpg for each cylinder count directly from the fitted model
library(emmeans)
emm <- emmeans(m, ~ cyl)
emm
#>  cyl emmean    SE df lower.CL upper.CL
#>    4   26.1 0.972 28     24.1     28.1
#>    6   19.9 1.170 28     17.5     22.3
#>    8   16.0 0.943 28     14.1     17.9
#> 
#> Results are averaged over the levels of: am 
#> Confidence level used: 0.95 
```

Read the `emmean` column first: 26.1, 19.9, 16.0. Those are the same three numbers from two steps back, 26.08, 19.93 and 16.01, just rounded to one decimal place instead of two. `emmeans()` did not use a different method to get there. It built the same six-row prediction grid internally and averaged it the same equal way.

The `SE` and the two `CL` columns go further than the hand calculation did. `SE` is the standard error of each marginal mean, and `lower.CL`/`upper.CL` give a 95% confidence interval around it, 24.1 to 28.1 for 4 cylinders, for instance. Those come from the fitted model's own uncertainty about its coefficients, which a plain grid average does not carry on its own.

The footer line, "Results are averaged over the levels of: am", is `emmeans()` telling you in plain words exactly what you did by hand two steps back: it averaged over the two levels of `am`, automatic and manual, instead of weighting them by how many real cars fell into each.

=== step === concept
## Reading a contrast between two marginal means

Having three marginal means invites an obvious next question: how far apart are they from each other? `pairs()`, run on the same `emm` object, answers that for every pair at once.

```r-static
# Compare every pair of marginal means and test whether the gap between them is real
pairs(emm)
#>  contrast    estimate   SE df t.ratio p.value
#>  cyl4 - cyl6     6.16 1.54 28   4.009  0.0012
#>  cyl4 - cyl8    10.07 1.45 28   6.933 <0.0001
#>  cyl6 - cyl8     3.91 1.47 28   2.660  0.0331
#> 
#> Results are averaged over the levels of: am 
#> P value adjustment: tukey method for comparing a family of 3 estimates 
```

Each row is one marginal mean minus another, named directly in the `contrast` column. `cyl4 - cyl6` is 6.16, the gap between the first two marginal means from the step before this one, 26.1 and 19.9, before those were rounded to one decimal place for display. Every contrast here lists the smaller cylinder count first, and because mpg drops as cylinder count rises, that order always leaves a positive number.

The `p.value` column tests whether each gap is bigger than noise alone would produce, and all three clear that bar: 0.0012, under 0.0001, and 0.0331. But notice the footer: "P value adjustment: tukey method for comparing a family of 3 estimates." Those three p-values are not computed the plain way a single t-test would. They are adjusted upward together so that testing all three pairs at once does not inflate the chance of calling at least one of them significant purely by accident. Without that adjustment, running three tests instead of one would make a false positive more likely, not because any single test changed, but because chance got three separate tries at fooling you instead of one.

=== step === widget
## From console output to a table you can paste into a report

The console output above is correct, but it is not what belongs in a report. Here are the same three numbers turned into the kind of table a reader actually expects.

::widget styled-table {"cols":["cyl","adj_mean_mpg","ci_low","ci_high"],"rows":[[4,26.1,24.1,28.1],[6,19.9,17.5,22.3],[8,16.0,14.1,17.9]],"formats":{"adj_mean_mpg":"1dp","ci_low":"1dp","ci_high":"1dp"},"title":"Adjusted mean mpg by cylinder count","note":"Averaged equally over automatic and manual transmission."}

Toggle between the raw and the formatted view. The numbers did not change: 26.1, 19.9 and 16.0 are the same marginal means from two steps back, and the confidence bounds are the same ones `emmeans()` printed. What changed is the presentation: named columns, one row per cylinder count, and a note that says plainly what the console output only implied in its footer, that these numbers are averaged equally over automatic and manual transmission.

=== step === tryit
## Your turn: adjust the six-cylinder mean by hand

Earlier steps worked through 4 cylinders and 8 cylinders in detail. 6 cylinders never got the same treatment, so do it yourself here, straight from the coefficients already sitting in `m`.

```r
# Your turn: predict mpg for a 6-cylinder car at each transmission, then average the two
cf <- coef(m)
cyl6_am0 <- cf["(Intercept)"] + cf["factor(cyl)6"]
cyl6_am1 <- cyl6_am0
mean(c(cyl6_am0, cyl6_am1))
```

`cyl6_am0` is already right: the intercept plus the cyl6 offset predicts a 6-cylinder automatic car. Fix `cyl6_am1` so it also adds the manual offset, `factor(am)1`, then average the two.
::check {"regex": "factor[(]am[)]1|19\\.9", "gate": true, "difficulty": "intermediate", "ok": "That is the same number emmeans gave in step 7.", "no": "Predict mpg for a 6-cylinder car at am = 0, then again at am = 1 by adding the factor(am)1 offset to cyl6_am1, and average the two predictions together."}
::solution
```r
# Predict mpg for a 6-cylinder car at each transmission, then average the two
cf <- coef(m)
cyl6_am0 <- cf["(Intercept)"] + cf["factor(cyl)6"]
cyl6_am1 <- cf["(Intercept)"] + cf["factor(cyl)6"] + cf["factor(am)1"]
round(mean(c(cyl6_am0, cyl6_am1)), 2)
#> [1] 19.93
```

19.93 is exactly the marginal mean for 6 cylinders from the hand-built grid earlier in this lesson, and the same number `emmeans()` printed as 19.9. Three different routes to the same model, the same number every time.

=== step === quiz
## Quick check: what happens if the sample's mix changed

Suppose next year's data collection happened to bring in mostly manual 8-cylinder cars instead of mostly automatic ones, with the underlying relationship between cylinder count, transmission and mpg staying exactly the same. What happens to the two numbers this lesson keeps comparing, the raw mean and the marginal mean, for 8 cylinders?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Both the raw mean and the marginal mean would stay exactly where they are now. ::no
- The marginal mean would shrink to match the new, more manual-heavy raw mean. ::no
- The raw mean would move toward the marginal mean's 16.01, because it would no longer be pulled down by mostly-automatic cars. The marginal mean would not move at all. ::ok Right. The raw mean is at the mercy of whatever mix of automatic and manual cars actually showed up in the sample. The marginal mean never looked at that mix in the first place: it always weights automatic and manual 50/50, by construction, so a different sample mix has nothing in it to move.
- The model would need refitting before either number means anything again. ::no A changed transmission mix does not break the model or require refitting it. What moves is the raw mean, because it is computed directly from whichever cars happened to show up. The marginal mean was built precisely so that a changed mix like this would not touch it.

=== step === concept
## References
::prose-only a source list carries no runnable example

- [Population Marginal Means in the Linear Model: An Alternative to Least Squares Means](https://doi.org/10.1080/00031305.1980.10483031) - Searle, S.R., Speed, F.M. and Milliken, G.A. (1980), The American Statistician, 34(4), 216 to 221. The paper that named the quantity this lesson builds by hand.
- [Least-Squares Means: The R Package lsmeans](https://doi.org/10.18637/jss.v069.i01) - Lenth, R.V. (2016), Journal of Statistical Software, 69(1), 1 to 33. The package that became `emmeans`, and the reasoning behind its defaults.
- [emmeans: Estimated Marginal Means, aka Least-Squares Means](https://cran.r-project.org/package=emmeans) - Lenth, R.V., CRAN package documentation. The function run in steps 7 and 8.
- [predict.lm documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html) - R Core Team, the documentation for `predict()` on a fitted `lm` object, used to build the prediction grid.

=== step === complete
## What a marginal mean is, and why it does not change with the sample

Here is the whole lesson in one line: a raw group mean blends in whatever mix of some other variable happened to land in that group, and a marginal mean replaces that mix with an equal weighting across the other variable's levels, computed either by hand from a model's full prediction grid or read straight off `emmeans()`.

- The raw mpg means for 4, 6 and 8 cylinders, 26.66, 19.74 and 15.10, were each distorted by how automatic and manual cars happened to split within that cylinder count.
- Fitting `mpg ~ factor(cyl) + factor(am)` gave one model that carries both variables at once, instead of letting transmission type hide inside a cylinder average.
- Averaging that model's six-row prediction grid equally within each cylinder count, rather than by the sample's real car counts, produced the marginal means: 26.08, 19.93 and 16.01.
- `emmeans()` computes those exact same numbers in one line, and its `pairs()` output gives the gap between any two of them with a p-value adjusted for testing all three pairs at once.
- Because a marginal mean never looked at the sample's actual mix, it would not move even if next year's data brought in a completely different split of automatic and manual cars. A raw mean would.

Now you have what a report actually wants: a mean for each group that describes the group itself, not the group plus whatever mix of something else happened to be sitting inside it.
