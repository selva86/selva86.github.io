---
title: "Welch's ANOVA: the test for unequal group variances"
slug: "Which-Test-Mini-2"
description: "Classic ANOVA assumes every group has similar spread, and it fails quietly when one does not. Learn to test that assumption and run Welch's ANOVA instead."
keywords: "Welch's ANOVA, oneway.test, unequal variances, Bartlett's test, heteroscedasticity, one-way ANOVA, Satterthwaite correction, R"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "2"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-1"
course_next: "Which-Test-Mini-3"
curriculum_id: "0.0.13"
lesson_access: "windowed"
catalog_blurb: "Classic ANOVA can be misled by one noisy group; Welch's corrects for it."
---

=== step === cover
## Welch's ANOVA: the test for unequal group variances

Today let's understand Welch's ANOVA, the test you reach for the moment one group in your comparison is far noisier than the rest.

Here is the setup. A company with 90 employees splits evenly into three departments, Marketing, Support and Engineering, 30 people each. You want to know whether the three departments really earn different average salaries.

::widget chart-plotter {"data": [{"x":"Marketing","y":70082},{"x":"Marketing","y":63681},{"x":"Marketing","y":68557},{"x":"Marketing","y":67661},{"x":"Marketing","y":65333},{"x":"Marketing","y":57936},{"x":"Marketing","y":65059},{"x":"Marketing","y":63920},{"x":"Marketing","y":68454},{"x":"Marketing","y":66105},{"x":"Marketing","y":66367},{"x":"Marketing","y":65078},{"x":"Marketing","y":67114},{"x":"Marketing","y":67097},{"x":"Marketing","y":57812},{"x":"Marketing","y":73388},{"x":"Marketing","y":70466},{"x":"Marketing","y":68870},{"x":"Marketing","y":64781},{"x":"Marketing","y":70759},{"x":"Marketing","y":66685},{"x":"Marketing","y":67341},{"x":"Marketing","y":62432},{"x":"Marketing","y":73863},{"x":"Marketing","y":68193},{"x":"Marketing","y":75632},{"x":"Marketing","y":74924},{"x":"Marketing","y":68233},{"x":"Marketing","y":70581},{"x":"Marketing","y":74903},{"x":"Support","y":68620},{"x":"Support","y":71749},{"x":"Support","y":69854},{"x":"Support","y":72498},{"x":"Support","y":71821},{"x":"Support","y":76241},{"x":"Support","y":73671},{"x":"Support","y":66987},{"x":"Support","y":73598},{"x":"Support","y":67288},{"x":"Support","y":65792},{"x":"Support","y":74501},{"x":"Support","y":65581},{"x":"Support","y":72380},{"x":"Support","y":67249},{"x":"Support","y":77382},{"x":"Support","y":74203},{"x":"Support","y":69189},{"x":"Support","y":74597},{"x":"Support","y":72919},{"x":"Support","y":65735},{"x":"Support","y":70072},{"x":"Support","y":66812},{"x":"Support","y":73022},{"x":"Support","y":68098},{"x":"Support","y":69959},{"x":"Support","y":65436},{"x":"Support","y":66676},{"x":"Support","y":71603},{"x":"Support","y":66504},{"x":"Engineering","y":88463},{"x":"Engineering","y":96183},{"x":"Engineering","y":87030},{"x":"Engineering","y":84720},{"x":"Engineering","y":48640},{"x":"Engineering","y":85182},{"x":"Engineering","y":47002},{"x":"Engineering","y":120819},{"x":"Engineering","y":66917},{"x":"Engineering","y":95705},{"x":"Engineering","y":104987},{"x":"Engineering","y":92136},{"x":"Engineering","y":125676},{"x":"Engineering","y":70824},{"x":"Engineering","y":103085},{"x":"Engineering","y":67571},{"x":"Engineering","y":145112},{"x":"Engineering","y":109192},{"x":"Engineering","y":83416},{"x":"Engineering","y":111629},{"x":"Engineering","y":63111},{"x":"Engineering","y":129723},{"x":"Engineering","y":63113},{"x":"Engineering","y":53080},{"x":"Engineering","y":90619},{"x":"Engineering","y":113230},{"x":"Engineering","y":91723},{"x":"Engineering","y":72992},{"x":"Engineering","y":121395},{"x":"Engineering","y":152361}], "geoms": ["boxplot"], "x": "department", "y": "salary"}

Look at the three boxes. Marketing and Support sit in a similar tight band. Engineering's box is far taller, stretching from under \$50,000 to well past \$150,000. Engineering pays most people about what the other two departments pay, but a few of its specialists earn several times that, and those few salaries widen the whole box.

That gap, tight for two departments and wide for the third, is exactly what makes the question hard to answer honestly.

=== step === concept
## What one-way ANOVA assumes about your groups' spread

A one-way ANOVA compares three or more group means by weighing how much the group averages differ from each other (the between-group variation) against how much individual values scatter inside each group (the within-group variation). If the averages differ by a lot more than individuals scatter within a group, that's evidence the groups are genuinely different.

To do that weighing, the classic F-test pools every group's variance into one shared number. That pooling is only sound when the groups' real spread is similar to begin with. Let's check whether it is here.

```r
# Build the department salary data and summarise it by group
library(dplyr)

set.seed(2026)
salaries <- data.frame(
  dept = factor(rep(c("Marketing", "Support", "Engineering"), each = 30),
                levels = c("Marketing", "Support", "Engineering")),
  salary = c(rnorm(30, 68000, 4000),
             rnorm(30, 71000, 4500),
             rnorm(30, 92000, 25000))
)

group_stats <- salaries |>
  group_by(dept) |>
  summarise(n = n(), mean = round(mean(salary), 0), sd = round(sd(salary), 0), var = round(var(salary), 0))
group_stats
#> # A tibble: 3 × 5
#>   dept            n  mean    sd       var
#>   <fct>       <int> <dbl> <dbl>     <dbl>
#> 1 Marketing      30 67710  4382  19205397
#> 2 Support        30 70335  3494  12204987
#> 3 Engineering    30 92855 27219 740872648

round(max(group_stats$var) / min(group_stats$var), 1)
#> [1] 60.7
```

Look at the `var` column. Marketing's variance sits at 19.2 million, Support's at 12.2 million, and Engineering's at 740.9 million. Dividing the largest variance by the smallest gives 60.7.

A common rule of thumb says the classic F-test stays trustworthy as long as that ratio stays under 4. Ours is more than fifteen times past that line.

[NOTE]
Variance is in dollars squared, which is why the numbers look so large. The standard deviations in the `sd` column, \$4,382, \$3,494 and \$27,219, are in the same units as salary itself and are easier to read directly.

=== step === widget
## What happens to the classic test when that assumption breaks

Before running any formal test, it helps to see what an equal-variance violation actually does, using a general demonstration rather than our own data.

The widget below fits a straight line to simulated data, thousands of times over, and tracks two things on every run: whether the reported 95% confidence interval actually contains the true slope (the interval's real coverage), and how well the line fits overall (R-squared). At the dial's far left, the scatter around the line is the same width everywhere. Drag the dial to the right and the scatter fans out wider and wider at one end than the other, the same shape a variance mismatch takes.

::widget assumption-dial {"assumption": "heteroskedasticity"}

Watch the two curves as you drag. R-squared barely moves. But coverage, the share of intervals that actually contain the truth, falls well under the nominal 95% level. Push the dial to its last notch and the widget's own label reports the widest end of the scatter running about 81 times the narrowest, even more extreme than our own departments' 60.7 times.

That's the danger in one sentence. An unequal-variance violation does not make the fit look worse. It makes the reported confidence wrong, while nothing about the printed output changes to warn you.

=== step === quiz
## Quick check: what a variance mismatch actually does

The dial just showed coverage collapse while R-squared barely moved, and all along the classic test's own printed numbers looked no different than usual. What does an unequal-variance violation actually do to a classic ANOVA?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It biases the group means themselves, so the classic ANOVA reports the wrong averages. ::no
- R throws a warning or an error the moment the variances stop matching, so you would notice right away. ::no
- It leaves the printed F, degrees of freedom and p-value looking exactly the same as always, while the test's real error rate quietly climbs above the level it's supposed to hold. ::ok Exactly. That is the trap. Nothing in the classic test's own output flags the problem. The coverage collapse you watched in the dial is invisible from the printed result alone, which is exactly why you check variance directly instead of trusting the output to flag it.
- It only matters when the group sizes are also unequal. ::no None of these describe what actually happens. The means are not biased and R does not warn you. The real danger is that the test's own reported numbers give no hint that its error rate has moved, which is why you check the assumption directly rather than trusting the output to flag it.

=== step === concept
## Testing equal variance directly: Bartlett's test

A dial and a rule of thumb are a good first check, but a formal test gives you a p-value you can actually report. Bartlett's test does exactly that: it tests the null hypothesis that every group shares the same variance.

```r
# Test whether the three departments really have equal variance
bartlett.test(salary ~ dept, data = salaries)
#>
#> 	Bartlett test of homogeneity of variances
#>
#> data:  salary by dept
#> Bartlett's K-squared = 131.03, df = 2, p-value < 2.2e-16
```

The p-value is far below 0.05, so we reject the null hypothesis of equal variance. That confirms, formally, what the 60.7 ratio and the dial already suggested.

[NOTE]
Bartlett's test is sensitive to non-normal data. When a dataset looks far from normal, Levene's test (`car::leveneTest()`) is the safer alternative. With a p-value this small, either test rejects equal variance, so it makes no difference here.

=== step === concept
## Switching to Welch's correction with var.equal = FALSE

`oneway.test()` runs both the classic and the corrected version of this test, from the exact same formula interface as `aov()`. The one argument that switches between them is `var.equal`.

```r
# Compare the classic and Welch's versions of the same test
classic_fit <- oneway.test(salary ~ dept, data = salaries, var.equal = TRUE)
classic_fit
#>
#> 	One-way analysis of means
#>
#> data:  salary and dept
#> F = 22.264, num df = 2, denom df = 87, p-value = 1.555e-08

welch_fit <- oneway.test(salary ~ dept, data = salaries, var.equal = FALSE)
welch_fit
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  salary and dept
#> F = 14.21, num df = 2.000, denom df = 51.061, p-value = 1.241e-05
```

Same data, same formula, only the assumption changed, and three numbers moved. The classic version's denominator df is a clean 87, exactly `90 - 3` employees minus departments. Welch's version reports 51.061, a fraction, and a smaller F.

Both still reject the null hypothesis that the three departments earn the same average, but the strength of that evidence differs between them. Welch's is the version to go with here, because Bartlett's test already confirmed the equal-variance assumption the classic version depends on does not hold.

=== step === concept
## Why Welch's denominator degrees of freedom comes out fractional

That fractional 51.061 is not a rounding artifact. It comes from a specific correction, the Satterthwaite approximation, built from each department's own sample size and variance.

Each department gets a weight, large when the department is big and has low variance, small when it is small or noisy:

$$w_i = \frac{n_i}{s_i^2}$$

Those weights then feed the denominator degrees of freedom directly:

$$\text{df}_{\text{denom}} = \frac{k^2 - 1}{3 \displaystyle\sum_{i=1}^{k} \dfrac{\left(1 - w_i / W\right)^2}{n_i - 1}}, \qquad W = \sum_{i=1}^{k} w_i$$

Here $k$ is the number of groups, so $k = 3$. Let's walk the departments' own numbers through it.

```r
# Work out each department's Satterthwaite weight by hand
weights <- group_stats$n / group_stats$var
weights
#> [1] 1.562061e-06 2.458012e-06 4.049279e-08

sum_w <- sum(weights)
share <- weights / sum_w
share
#> [1] 0.384690501 0.605337294 0.009972205

terms <- (1 - share)^2 / (group_stats$n - 1)
tmp <- sum(terms) / (3^2 - 1)
df_denom_hand <- 1 / (3 * tmp)
df_denom_hand
#> [1] 51.0613
```

Look at `weights`. Engineering's weight, 4.05e-08, is nearly forty times smaller than Marketing's and sixty times smaller than Support's, purely because Engineering's variance is so much larger. `share` shows what that does: Engineering carries only about 1% of the total weight, against Marketing's 38% and Support's 61%.

A department with almost no weight barely counts as an independent source of information in this formula, so the effective sample size behind the test shrinks. That is why `df_denom_hand` comes out at 51.0613, matching `welch_fit`'s own 51.061 exactly, and why it sits well below the classic test's 87.

=== step === widget
## Turning the F-statistic into a p-value

An F-statistic on its own does not tell you whether to reject the null hypothesis. What turns it into a decision is comparing it against every F-value pure chance could produce if the null hypothesis were true, its null distribution. The p-value is simply how much of that distribution sits beyond your observed statistic.

The picture below is not drawn to our exact F and df. It shows the shape every null distribution shares: a peak where "no effect" sits, and thinning tails as the observed statistic moves further out. Drag the statistic and watch the shaded tail, which is exactly what a p-value is, shrink as it moves right.

::widget null-distribution {"tails": 1, "label": "test statistic"}

That shrinking shaded area is the same mechanism that turned `welch_fit`'s F of 14.21, on 2 and 51.06 degrees of freedom, into a p-value of 1.24e-05. That F sits so far into the tail of its own F-distribution that almost none of the distribution lies beyond it, which is exactly why the p-value came out so small.

=== step === concept
## Which departments actually differ from each other

Welch's ANOVA tells you the three departments' means are not all equal. It does not tell you which pairs differ. For that, you need a follow-up pairwise test, and it needs to match the same Welch-style logic: no pooled variance across groups.

`pairwise.t.test()` with `pool.sd = FALSE` runs exactly that, comparing every pair with its own variance rather than one pooled estimate. Adding a Bonferroni correction keeps the overall false-positive rate under control across the three comparisons being run at once.

```r
# Compare every pair of departments with Welch-style pairwise t-tests
pairwise.t.test(salaries$salary, salaries$dept, p.adjust.method = "bonferroni", pool.sd = FALSE)
#>
#> 	Pairwise comparisons using t tests with non-pooled SD 
#>
#> data:  salaries$salary and salaries$dept 
#>
#>             Marketing Support
#> Support     0.03922   -      
#> Engineering 6.8e-05   0.00029
#>
#> P value adjustment method: bonferroni 
```

Every one of the three p-values sits under 0.05. Marketing and Support differ (p = 0.039), Engineering and Marketing differ (p = 6.8e-05), and Engineering and Support differ (p = 0.00029). So it is not just Engineering that stands apart: all three departments differ from each other.

This particular test is a close approximation to the formal **Games-Howell** test, which uses the Studentized-range distribution instead of the t-distribution. In practice the two rarely differ.

=== step === quiz
## Quick check: reading a Welch's ANOVA result

Say a different Welch's ANOVA comes back with F = 8.2, num df = 3, denom df = 42.7, p = 0.0002. What does that result actually license you to conclude?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- p = 0.0002 tells you the size of the effect: the groups differ by about 0.02%. ::no
- The groups' means are not all equal, and the fractional 42.7 denominator df is itself a sign the groups' variances were unequal, not a rounding artifact. ::ok Exactly right. An omnibus ANOVA, classic or Welch's, only ever tells you the means are not all the same. Which specific pair differs needs a pairwise test that compares each pair with its own variance rather than one pooled estimate. And 42.7 is not a typo. It is the Satterthwaite correction doing exactly what it did with our own departments.
- One specific pair of groups must differ, since the F-statistic is so large. ::no
- The denominator df should really be a whole number like 42 or 43, and R rounded it strangely. ::no An omnibus F-test, Welch's or classic, never names which pair differs on its own, and a p-value is not an effect size. The fractional denominator df is not a rounding quirk either: it is exactly what the Satterthwaite formula produces whenever the groups being compared do not share one common variance.

=== step === tryit
## Your turn: run Welch's ANOVA on a new dataset

`PlantGrowth` is a built-in R dataset: the dried weight of 30 plants, 10 grown under a control condition and 10 under each of two treatments, in a numeric column `weight` and a three-level factor `group` (`ctrl`, `trt1`, `trt2`). Test whether this comparison actually needs Welch's correction, the way you just did for the departments.

```r
# PlantGrowth: dried weight of plants under a control and two treatments

# your code here: test equal variance across the three groups with bartlett.test()

# your code here: then run Welch's ANOVA with oneway.test(), var.equal = FALSE
```
::check {"regex": "bartlett[.]test[(][^)]*group[^)]*[)][\\s\\S]*oneway[.]test[(][^)]*var[.]equal\\s*=\\s*FALSE", "gate": true, "difficulty": "beginner", "ok": "Right. Bartlett's test comes back at p = 0.237, so equal variance is not rejected here, and Welch's F = 5.18 on 2 and 17.13 degrees of freedom lands close to the classic F = 4.85 on 2 and 27.", "no": "Call bartlett.test(weight ~ group, data = PlantGrowth) first, then oneway.test(weight ~ group, data = PlantGrowth, var.equal = FALSE)."}
::solution
```r
# Check variance equality, then compare classic and Welch's ANOVA
bartlett.test(weight ~ group, data = PlantGrowth)
#>
#> 	Bartlett test of homogeneity of variances
#>
#> data:  weight by group
#> Bartlett's K-squared = 2.8786, df = 2, p-value = 0.2371

pg_var <- tapply(PlantGrowth$weight, PlantGrowth$group, var)
round(max(pg_var) / min(pg_var), 1)
#> [1] 3.2

oneway.test(weight ~ group, data = PlantGrowth, var.equal = TRUE)
#>
#> 	One-way analysis of means
#>
#> data:  weight and group
#> F = 4.8461, num df = 2, denom df = 27, p-value = 0.01591

oneway.test(weight ~ group, data = PlantGrowth, var.equal = FALSE)
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  weight and group
#> F = 5.181, num df = 2.000, denom df = 17.128, p-value = 0.01739
```

Bartlett's test comes back at p = 0.237, so here you do not reject equal variance. The variance ratio behind that is only about 3.2, under the usual 4 rule of thumb. And that shows up exactly where the dial predicted it would: classic (F = 4.85, p = 0.016) and Welch's (F = 5.18, p = 0.017) land close together.

When variances really are similar, Welch's correction costs you almost nothing. It is only when they diverge, the way the three departments' did, that the two versions pull apart.

=== step === concept
## References

- [On the Comparison of Several Mean Values: An Alternative Approach](https://doi.org/10.1093/biomet/38.3-4.330) - Welch, B. L. (1951), Biometrika, 38(3/4), 330-336. The original paper behind the correction this lesson runs.
- [Taking Parametric Assumptions Seriously: Arguments for the Use of Welch's F-test instead of the Classical F-test in One-Way ANOVA](https://doi.org/10.5334/irsp.198) - Delacre, M., Leys, C., Mora, Y. L., & Lakens, D. (2019), International Review of Social Psychology, 32(1), 13. The case for using Welch's by default.
- [Comparison of ANOVA alternatives under variance heterogeneity and specific noncentrality structures](https://doi.org/10.1037/0033-2909.99.1.90) - Tomarken, A. J., & Serlin, R. C. (1986), Psychological Bulletin, 99(1), 90-99.
- [rstatix: games_howell_test](https://cran.r-project.org/package=rstatix) - CRAN documentation for the formal Games-Howell post-hoc test, the method the pairwise Welch t-tests in this lesson approximate.
- [R documentation: stats::oneway.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html) - R Core Team, the function behind both the classic and Welch's ANOVA in this lesson.

=== step === complete
## The equal-variance check, recapped

You worked through one full decision, start to finish, on the departments' salaries.

- Measure the spread first. Per-group variance and a quick ratio (60.7, in our case) already told you the classic test's equal-variance assumption was in trouble.
- Confirm it formally with Bartlett's test, which rejected equal variance at p < 2.2e-16.
- Switch `var.equal` to `FALSE` and let Welch's correction reweight each group by its own variance instead of pooling them.
- Read the fractional denominator df, 51.061 here, as evidence: it is the Satterthwaite formula telling you the variances genuinely differed.
- Follow a significant result with a pairwise post-hoc test built the same Welch-style way, which is what showed all three departments actually differ from each other.

The one habit worth keeping from all of this: check variance before you trust a p-value, because the classic test's own output will never tell you it is wrong.
