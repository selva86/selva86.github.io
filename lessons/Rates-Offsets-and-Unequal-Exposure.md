---
title: "Generalized Linear Models Lesson 5: Rates, offsets and unequal exposure"
catalog_blurb: "Compare counts fairly when groups were observed for different amounts of time."
description: "Comparing raw counts across groups observed for different lengths of time hides the real pattern. An offset fixes that, turning a count model into a rate model."
keywords: "poisson regression offset, rate model in r, exposure variable, offset log exposure, rate ratio, unequal exposure, count data regression, glm offset in r, generalized linear models, log link function"
post_type: "LESSON"
curriculum_id: "4.80.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "5"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: "Outcomes-with-an-Order-and-Outcomes-Without"
course_prev: "When-Your-Counts-Are-Too-Variable-for-Poisson"
---

=== step === cover
## Rates, offsets and unequal exposure

Today let's understand the offset: the fix for comparing counts that were logged over windows of very different sizes.

Here is the example for the whole lesson. A factory floor runs twenty machines, ten of them old and ten of them new. For every machine, March logged two numbers: how many hours it ran that month, and how many times it broke down.

Below are eight of the twenty machines, four old and four new.

::widget styled-table {"cols": ["type", "hours", "breakdowns"], "rows": [["old", 211, 7], ["old", 214, 2], ["old", 149, 8], ["old", 203, 8], ["new", 592, 6], ["new", 644, 7], ["new", 687, 5], ["new", 551, 5]], "title": "Eight of the twenty factory machines", "note": "Full-sample averages: the ten old machines ran 183.7 hours in March, the ten new machines ran 618.0."}

Look at the hours column in that table. Even in these eight rows, the old machines and the new machines were not run anywhere close to the same number of hours. Keep that in mind as you read the breakdowns column next to it.

=== step === concept
## What the raw numbers hide

Let's build the full 20-machine dataset first, since every number in this lesson comes from it.

```r
# Build the 20-machine dataset: hours run and breakdowns logged in March
set.seed(42)
hours_old <- round(runif(10, 120, 220))
hours_new <- round(runif(10, 500, 700))
breakdowns_old <- rpois(10, lambda = 0.020 * hours_old)
breakdowns_new <- rpois(10, lambda = 0.008 * hours_new)

machines <- data.frame(
  type       = rep(c("old", "new"), each = 10),
  hours      = c(hours_old, hours_new),
  breakdowns = c(breakdowns_old, breakdowns_new)
)

range(hours_old)
#> [1] 133 214
range(hours_new)
#> [1] 523 696
```

The ten old machines ran between 133 and 214 hours in March. The ten new machines ran between 523 and 696. Those two ranges do not overlap at all: even the busiest old machine ran fewer hours than the quietest new one.

Plot all twenty machines by type and the same gap shows up as a picture.

::widget chart-plotter {"data": [{"x": "old", "y": 211}, {"x": "old", "y": 214}, {"x": "old", "y": 149}, {"x": "old", "y": 203}, {"x": "old", "y": 184}, {"x": "old", "y": 172}, {"x": "old", "y": 194}, {"x": "old", "y": 133}, {"x": "old", "y": 186}, {"x": "old", "y": 191}, {"x": "new", "y": 592}, {"x": "new", "y": 644}, {"x": "new", "y": 687}, {"x": "new", "y": 551}, {"x": "new", "y": 592}, {"x": "new", "y": 688}, {"x": "new", "y": 696}, {"x": "new", "y": 523}, {"x": "new", "y": 595}, {"x": "new", "y": 612}], "geoms": ["point", "boxplot"], "x": "type", "y": "hours"}

Switch to the boxplot view. The two boxes sit nowhere near each other, which is the same non-overlapping ranges you just computed, drawn instead of counted.

Now look at what happened to breakdowns, the thing you actually care about.

```r
# Compare the two groups' raw breakdown counts, and check how they relate to hours
mean(breakdowns_old)
#> [1] 4.6
mean(breakdowns_new)
#> [1] 4.7
cor(machines$hours, machines$breakdowns)
#> [1] 0.03613574
```

Old machines averaged 4.6 breakdowns in March. New machines averaged 4.7. Almost identical. And the correlation between hours and raw breakdowns, across all twenty machines, is 0.036, about as flat as a correlation gets.

Put those two facts next to the hours chart you just saw, and something does not add up. The new machines ran more than three times as many hours as the old ones, yet they logged about the same number of breakdowns and hours barely correlates with breakdowns at all. Either hours genuinely have nothing to do with how often a machine breaks down, or the raw count is hiding something that a look at hours alone cannot show.

=== step === concept
## What exposure means, and the rate it defines

The missing piece is called **exposure**: the window a count was observed over. Here, exposure is hours run. In other settings it takes other forms: clinics watched for different numbers of months, villages with different populations, web pages viewed by different numbers of visitors. Whatever form it takes, a count means something different once you know how much exposure produced it.

Dividing a count by its exposure gives a **rate**: breakdowns per hour, visits per month, clicks per visitor. A rate lets you compare machines, clinics or villages fairly, because it answers "how often per unit of exposure", not "how many in total".

Compute it for one machine of each type.

```r
# Compute the breakdown rate for one old machine and one new machine
rate_machine1 <- 7 / 211     # an old machine: 7 breakdowns over 211 hours
rate_machine11 <- 6 / 592    # a new machine: 6 breakdowns over 592 hours
round(c(old_machine = rate_machine1, new_machine = rate_machine11), 4)
#> old_machine new_machine 
#>      0.0332      0.0101 
```

That one old machine broke down 0.0332 times an hour. That one new machine broke down 0.0101 times an hour, a third as often per hour, even though its raw count, 6, is close to the old machine's 7.

A single machine's rate can still be noisy. A better comparison pools every machine of a type together: add up all its breakdowns, add up all its hours, then divide.

```r
# Pool each group's breakdowns and hours, then divide, to get a group rate
pooled_rate_old <- sum(breakdowns_old) / sum(hours_old)
pooled_rate_new <- sum(breakdowns_new) / sum(hours_new)
round(c(old = pooled_rate_old, new = pooled_rate_new), 4)
#>    old    new 
#> 0.0250 0.0076 
```

Pooled across all ten machines of each type, old machines break down at 0.0250 times an hour, new machines at 0.0076. That is more than three times the rate, hiding behind two almost identical raw averages, 4.6 and 4.7. Pooling the sums rather than averaging the ten individual rates matters too: it weights every hour equally, so a machine that happened to run very few hours does not get the same vote as one that ran for hundreds.

=== step === quiz
## Quick check: does a flat correlation mean exposure does not matter

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Yes, a correlation of 0.036 is close enough to zero to say hours have no effect on breakdowns here. ::no
- No. Within each type, more hours should still mean more breakdowns. The flat correlation only shows up because old machines ran few hours at a high rate and new machines ran many hours at a low rate, and pooling both groups into one correlation lets those two patterns cancel out. ::ok Exactly. Old machines ran few hours at a high rate, new machines ran many hours at a low rate, and pooling both groups into one number lets those two patterns cancel out.
- No, because a correlation can only be trusted once you have at least a few hundred machines. ::no
- Yes, since a flat correlation always means the two variables have no real relationship. ::no A flat correlation between hours and raw breakdowns here is not proof that hours do not matter. It is what happens when two groups with opposite hours-to-rate patterns get pooled into a single correlation. Old machines ran few hours at a high rate, new machines ran many hours at a low rate, and those two patterns cancel out once you stop looking at the groups separately.

=== step === concept
## Fitting the model without an offset

Start simple: fit a Poisson model on the raw breakdown counts alone, with no exposure term, and see what it finds.

A Poisson regression with no offset models `log(expected breakdowns)` as an intercept plus a coefficient on type. R turns the `type` column into a 0/1 indicator automatically, and by default it picks whichever category comes first alphabetically, here `new`, as the baseline. The coefficient `typeold` you will see in the output is how much old machines differ from that `new` baseline, on the log scale.

```r
# Fit a Poisson model of breakdowns on type alone, with no exposure term
machines$type <- factor(machines$type)
fit_naive <- glm(breakdowns ~ type, data = machines, family = poisson)
summary(fit_naive)
#>
#> Call:
#> glm(formula = breakdowns ~ type, family = poisson, data = machines)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)    
#> (Intercept)  1.54756    0.14586  10.610   <2e-16 ***
#> typeold     -0.02151    0.20740  -0.104    0.917    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 34.412  on 19  degrees of freedom
#> Residual deviance: 34.402  on 18  degrees of freedom
#> AIC: 101.21
#>
#> Number of Fisher Scoring iterations: 5
```

Call this the **naive model**, because it ignores exposure entirely. The `typeold` coefficient, -0.0215, has a standard error of 0.207 and a p-value of 0.917, nowhere near significant. Exponentiate it, `exp(-0.0215)` is 0.979, and old machines look like they break down 0.979 times as often as new ones: practically the same. This is exactly what the raw averages, 4.6 and 4.7, already suggested. The naive model just confirms, in a p-value, what the misleading raw counts showed.

=== step === concept
## Deriving the offset: turning a count model into a rate model
::prose-only a pure algebraic derivation; no catalog widget draws an equation rearrangement

So the real comparison that matters is between rates, not raw counts. But `glm()` with the Poisson family fits counts, not rates directly. The question is how to get it to estimate a rate comparison without changing what it fits.

A Poisson regression models the log of the expected count as a linear function of its predictors. Start instead from what you actually want: the log of the expected rate as a linear function of type.

$$\log(\text{rate}) = \beta_0 + \beta_1 \times \text{type}$$

A rate is a count divided by its exposure, so substitute that in.

$$\log\left(\frac{\text{count}}{\text{exposure}}\right) = \beta_0 + \beta_1 \times \text{type}$$

The log of a ratio is the difference of two logs, so the left side splits apart.

$$\log(\text{count}) - \log(\text{exposure}) = \beta_0 + \beta_1 \times \text{type}$$

Move the log of exposure to the right side, and the equation is now about the log of the count again, exactly what a Poisson regression fits.

$$\log(\text{count}) = \beta_0 + \beta_1 \times \text{type} + \log(\text{exposure})$$

That last term, `log(exposure)`, is added to the linear predictor the same way any other predictor would be, except for one difference: its coefficient is fixed at 1, not estimated from the data. A term added to a model with its coefficient fixed, rather than estimated, is called an **offset**. Fixing it at 1 is not a simplification. It is forced by the algebra two lines up: that coefficient has to be exactly 1 for the equation to still say what it started out saying, that `count / exposure` is the rate. Fit a Poisson model this way and you are still fitting counts, the thing `glm()` knows how to do, but the coefficient on type now answers a question about rates.

=== step === concept
## Fitting the offset model: a rate ratio of 3.29

Now fit the model with that offset added: the same formula, with `offset(log(hours))` added. The `offset()` function marks that term's coefficient as fixed at 1, not estimated, exactly as the algebra required.

```r
# Fit the offset model: breakdowns explained by type, with hours as the offset
fit_offset <- glm(breakdowns ~ type + offset(log(hours)), data = machines, family = poisson)
summary(fit_offset)
#>
#> Call:
#> glm(formula = breakdowns ~ type + offset(log(hours)), family = poisson, 
#>     data = machines)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)    
#> (Intercept)  -4.8789     0.1459 -33.448  < 2e-16 ***
#> typeold       1.1917     0.2074   5.746 9.15e-09 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 66.904  on 19  degrees of freedom
#> Residual deviance: 35.799  on 18  degrees of freedom
#> AIC: 102.61
#>
#> Number of Fisher Scoring iterations: 5
```

Everything changed. The `typeold` coefficient is now 1.1917, with the same standard error as before, 0.207, but a p-value of 9.15e-09, nowhere near 0.917. Exponentiate it: `exp(1.1917)` rounds to 3.29. Old machines break down 3.29 times as often per hour as new machines, a result the naive model, and the flat correlation before it, both completely missed.

Check that number against a model fit directly on rates instead of counts, weighting each machine's row by its hours.

```r
# Fit the same comparison directly on rates, weighted by hours, and compare coefficients
machines$rate <- machines$breakdowns / machines$hours
fit_rate_direct <- suppressWarnings(glm(rate ~ type, data = machines, family = poisson, weights = hours))
round(coef(fit_offset), 6)
#> (Intercept)     typeold 
#>   -4.878926    1.191678 
round(coef(fit_rate_direct), 6)
#> (Intercept)     typeold 
#>   -4.878926    1.191678 
```

The two coefficient vectors match to six decimal places. Fitting breakdowns with hours as an offset and fitting rates directly with hours as weights are the same computation, reached two different ways. That agreement is the proof that the offset is doing exactly what the algebra above said it would: turning a count model into a rate model.

=== step === concept
## Why the offset's coefficient has to stay fixed at 1

It is tempting to think of `log(hours)` as just another predictor and let `glm()` estimate its coefficient too, instead of fixing it at 1. Try it and see what happens.

```r
# Let the log(hours) coefficient estimate itself, instead of fixing it at 1
fit_floated <- glm(breakdowns ~ type + log(hours), data = machines, family = poisson)
summary(fit_floated)
#>
#> Call:
#> glm(formula = breakdowns ~ type + log(hours), family = poisson, 
#>     data = machines)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  1.75468    5.50497   0.319    0.750
#> typeold     -0.06082    1.06522  -0.057    0.954
#> log(hours)  -0.03225    0.85690  -0.038    0.970
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 34.412  on 19  degrees of freedom
#> Residual deviance: 34.400  on 17  degrees of freedom
#> AIC: 103.21
#>
#> Number of Fisher Scoring iterations: 5
```

Call this the **floated model**, because it lets the exposure term float instead of fixing it. Two things broke at once. The estimated `log(hours)` coefficient, -0.0322, is nowhere near the 1 the derivation requires. And the `typeold` coefficient collapsed to -0.0608 with a p-value of 0.954, right back to "no difference", the same dead end the naive model reached. The standard error on `typeold` also inflated from 0.207 to 1.065, roughly five times wider, so even the little the floated model could say about type, it says with far less confidence.

Here is why. The hours chart from earlier showed old machines ran 133 to 214 hours and new machines ran 523 to 696, ranges that never overlapped. A Welch t-test on hours by type confirms just how strongly type and hours move together.

```r
# Check how strongly hours and type are related
t.test(hours ~ type, data = machines)
#>
#> 	Welch Two Sample t-test
#>
#> data:  hours by type
#> t = 21.146, df = 12.331, p-value = 4.622e-11
#> alternative hypothesis: true difference in means between group new and group old is not equal to 0
#> 95 percent confidence interval:
#>  389.6838 478.9162
#> sample estimates:
#> mean in group new mean in group old 
#>             618.0             183.7 
```

With a p-value of 4.6e-11, knowing a machine's type almost tells you its hours, and knowing its hours almost tells you its type. Once both `type` and `log(hours)` are free to estimate their own coefficients, they are competing to explain the same variation in breakdowns, and the model cannot tell which one deserves the credit. Fixing the offset's coefficient at 1 sidesteps that competition entirely, because the proportionality between a count and its rate is not something to estimate from this data. It is a mathematical identity, true by definition rather than by fit.

The three fits, side by side:

| Model | Coefficient on type | p-value | AIC |
|---|---|---|---|
| Naive (no exposure term) | -0.0215 | 0.917 | 101.2 |
| Offset (`log(hours)` fixed at 1) | 1.1917 | 9.15e-09 | 102.6 |
| Floated (`log(hours)` estimated) | -0.0608 | 0.954 | 103.2 |

Only the offset model finds the rate gap that was there all along.

=== step === quiz
## Quick check: three fits, three different conclusions

The same twenty machines, the same breakdown counts, three different fits. Here are their rates, breakdowns per hour, plotted by type.

::widget chart-plotter {"data": [{"x": "old", "y": 0.0332}, {"x": "old", "y": 0.0093}, {"x": "old", "y": 0.0537}, {"x": "old", "y": 0.0394}, {"x": "old", "y": 0.0054}, {"x": "old", "y": 0.0174}, {"x": "old", "y": 0.0155}, {"x": "old", "y": 0.0376}, {"x": "old", "y": 0.0161}, {"x": "old", "y": 0.0314}, {"x": "new", "y": 0.0101}, {"x": "new", "y": 0.0109}, {"x": "new", "y": 0.0073}, {"x": "new", "y": 0.0091}, {"x": "new", "y": 0}, {"x": "new", "y": 0.0116}, {"x": "new", "y": 0.0014}, {"x": "new", "y": 0.0038}, {"x": "new", "y": 0.0134}, {"x": "new", "y": 0.0082}], "geoms": ["point", "boxplot"], "x": "type", "y": "rate"}

Switch to the boxplot view. The old machines' rates sit clearly above the new machines' rates, matching the pooled 0.0250 against 0.0076 computed earlier, the same gap the offset model's 3.29 rate ratio put a number on.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The naive model, fit on raw counts with no exposure term, found no real difference between old and new machines (p = 0.917). The offset model, with `log(hours)` fixed at 1, found old machines break down 3.29 times as often per hour (p = 9.15e-09). The floated model, which let `log(hours)` estimate its own coefficient, collapsed back to no difference (p = 0.954). ::ok Right. The naive model never saw the gap because it never accounted for exposure. The offset model found it by turning the count model into a rate model. The floated model lost it again, because letting the exposure term compete with type for the same variation undid what the offset was fixing in the first place.
- The naive model found the 3.29 times rate gap, and both the offset and the floated model agreed there was no real difference. ::no
- All three models agree: once you allow for enough noise, there is no real difference between old and new machines. ::no
- The offset model and the floated model disagree only because the floated model used a smaller effective sample size. ::no All three models fit the exact same twenty rows; sample size never changed. What changed is whether `log(hours)` entered as a fixed-at-1 offset or as a freely estimated coefficient. Fixed, it recovers the rate ratio of 3.29. Free, it competes with type for the same variation, since the two are so strongly related, and the type coefficient collapses back to a false "no difference".

=== step === tryit
## Your turn: write the offset yourself

The same fix applies far beyond machines. Six villages, three rural and three urban, each report a population and a count of flu cases this month.

```r
# Create 6 villages (3 rural, 3 urban) with population and flu case counts
set.seed(11)
population_rural <- round(runif(3, 800, 1100))
population_urban <- round(runif(3, 4000, 5200))
cases_rural <- rpois(3, lambda = 0.03 * population_rural)
cases_urban <- rpois(3, lambda = 0.012 * population_urban)

village <- data.frame(
  region     = rep(c("rural", "urban"), each = 3),
  population = c(population_rural, population_urban),
  cases      = c(cases_rural, cases_urban)
)
village
#>   region population cases
#> 1  rural        883    19
#> 2  rural        800    18
#> 3  rural        953    35
#> 4  urban       4017    52
#> 5  urban       4078    48
#> 6  urban       5146    53
```

The urban villages logged far more raw cases than the rural ones, but they also hold far more people. Fit a Poisson model of `cases` on `region`, using `log(population)` as the offset, the same way `log(hours)` entered the machine model, so the region coefficient compares flu rates per person rather than raw case counts.

```r
# village holds population and flu case counts for 3 rural and 3 urban
# villages. Fit a Poisson model of cases on region, using
# log(population) as the offset, so the coefficient compares rates
# per person, not raw case counts.
# One line. Press Check when you have it.
```
::check {"regex": "cases\\s*~\\s*region\\s*\\+\\s*offset[(]log[(]population[)][)]", "gate": true, "difficulty": "intermediate", "ok": "Right: fitting cases on region with log(population) fixed as the offset turns the raw case counts into a comparison of flu rates per person.", "no": "Add offset(log(population)) to the linear predictor, the same way log(hours) entered the machine model, with region as the other term: cases ~ region + offset(log(population))."}
::solution
```r
# Fit the village model: cases explained by region, with population as the offset
fit_village <- glm(cases ~ region + offset(log(population)), data = village, family = poisson)
summary(fit_village)
#>
#> Call:
#> glm(formula = cases ~ region + offset(log(population)), family = poisson, 
#>     data = village)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)    
#> (Intercept)  -3.6004     0.1179  -30.55  < 2e-16 ***
#> regionurban  -0.8603     0.1429   -6.02 1.75e-09 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 38.1051  on 5  degrees of freedom
#> Residual deviance:  6.0734  on 4  degrees of freedom
#> AIC: 42.316
#>
#> Number of Fisher Scoring iterations: 4
round(exp(coef(fit_village)["regionurban"]), 2)
#> regionurban 
#>        0.42 
```

Exponentiate the `regionurban` coefficient and you get 0.42: urban villages catch flu at 0.42 times the rural rate per person, well under half. The raw case counts said the opposite story, since urban villages logged more cases in total. The offset is what tells the two apart.

=== step === concept
## References

::prose-only a list of citations carries no visualizable concept

- [Regression Analysis of Count Data, 2nd edition](https://www.cambridge.org/core/books/regression-analysis-of-count-data/introduction/B75A323D25241D7B4F9C9AE735666827) - Cameron, A.C. and Trivedi, P.K. (2013), Cambridge University Press. The standard reference for rate models and offsets in count regression.
- [Generalized Linear Models, 2nd edition](https://doi.org/10.1201/9780203753736) - McCullagh, P. and Nelder, J.A. (1989), Chapman and Hall/CRC. Defines the offset term inside the GLM linear predictor.
- [Categorical Data Analysis, 3rd edition](https://doi.org/10.1002/0471249688) - Agresti, A. (2012), Wiley. Poisson regression for rate data with varying exposure.
- [glm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) - R Core Team, base R `stats` package, including the `offset()` function used inside a model formula.
- [Poisson Regression, R Data Analysis Examples](https://stats.oarc.ucla.edu/r/dae/poisson-regression/) - UCLA Office of Advanced Research Computing, a worked R example using offsets.

=== step === complete
## From naive counts to a rate you can trust

Three fits, three different answers, all on the same twenty machines. The naive model, fit on raw breakdown counts with no exposure term, found nothing, p = 0.917. The offset model, adding `log(hours)` with its coefficient fixed at 1, found old machines breaking down 3.29 times as often per hour as new ones, p < 0.001. The floated model, which let that same term estimate its own coefficient, lost the result again, p = 0.954, because type and hours were too tangled up for both to keep their own coefficients at once.

Whenever an outcome arrives as "how many" rather than a rate already computed for you, and the units being compared were not all watched for the same stretch of time, population or traffic, check for exposure before you trust the raw count.
