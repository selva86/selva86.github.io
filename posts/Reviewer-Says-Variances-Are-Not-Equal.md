---
title: "Reviewer says the variances are not equal"
slug: Reviewer-Says-Variances-Are-Not-Equal
description: "A reviewer says your groups have unequal variances. How to test homogeneity of variance in R, decide whether it threatens your result, and word your reply."
keywords: "variances are not equal reviewer comment, homogeneity of variance peer review, unequal variances reviewer response, reviewer says variances not equal, Welch t-test response to reviewer"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 32
auto_link_terms: unequal variance objection|homogeneity of variance reviewer|Welch t-test response
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">Unequal group variances rarely bias the difference you are estimating. What they distort is its standard error, and with it the p-value and the confidence interval. The usual fix, a Welch correction, drops the equal-variance assumption altogether rather than relying on it, so for a good number of analyses the honest answer is that the assumption was never required.</p>

## What the reviewer wrote

> The two groups appear to have quite different variances, so a Student's t-test may not be appropriate here.

> Homogeneity of variance has not been demonstrated. The authors should formally test this assumption before comparing the group means.

> I also wondered about the spread of the outcome, which looks a good deal wider in the treatment arm than in the control in Figure 2, and whether that has any bearing on the test that was chosen.

## What they actually mean

The reviewer is pointing at an assumption behind the pooled Student's t-test and the classic one-way ANOVA: that every group shares a single common variance. When the spreads differ, those tests pool them into one number, and that pooled number describes no group well.

Two different situations get worded the same way. In a comparison of groups the concern is unequal variance between the groups. In a regression it is the related idea that the residual variance changes across the fitted values, usually called heteroscedasticity; if that is your case the check and the remedy are different, and [Heteroscedasticity in R](/Heteroscedasticity-in-R.html) covers them. This chapter takes the group-comparison reading, which is what "the variances are not equal" almost always means.

The reviewer is not claiming that a difference in spread is itself a mistake, and is not asking whether your outcome is normally distributed. Both are separate questions. What is in doubt is only whether the standard error your test reported is the right one.

## Why they are asking

A pooled test borrows strength across groups by assuming they vary by the same amount. When that assumption holds, pooling makes the comparison more powerful. When it fails, the pooled standard error is the wrong size, and the p-value and confidence interval built on it are wrong with it, so a result can look more or less significant than the data actually support.

How much it matters depends on the group sizes. With roughly equal group sizes the pooled test is remarkably tolerant of unequal variance, and the p-value barely moves. With unequal sizes the errors stop cancelling; the distortion can go in either direction depending on which group carries the larger variance, and it can be big enough to change a conclusion. The situation to worry about is unequal variances together with unequal group sizes.

The mechanics of the tests are covered in [Test Normality and Equal Variance in R](/Normality-and-Variance-Tests-in-R.html). This chapter is about deciding whether you have a problem and what to say.

## How to check it

Compare the group variances and back them with a formal test. The insect-spray counts make a clear example.

```r
tapply(InsectSprays$count, InsectSprays$spray, var)
#>         A         B         C         D         E         F 
#> 22.272727 18.242424  3.901515  6.265152  3.000000 38.606061 
bartlett.test(count ~ spray, data = InsectSprays)
#> 
#> 	Bartlett test of homogeneity of variances
#> 
#> data:  count by spray
#> Bartlett's K-squared = 25.96, df = 5, p-value = 9.085e-05
```

The variances span from 3.0 to 38.6, more than a tenfold range, and Bartlett's test rejects equality at p = 0.00009. Bartlett's test has one weakness worth knowing: it is sensitive to non-normality, so on skewed data it can report unequal variances when the real issue is the shape of the distribution. A test that does not lean on normality is the safer check here.

```r
fligner.test(count ~ spray, data = InsectSprays)
#> 
#> 	Fligner-Killeen test of homogeneity of variances
#> 
#> data:  count by spray
#> Fligner-Killeen:med chi-squared = 14.483, df = 5, p-value = 0.01282
```

The Fligner-Killeen test uses ranks and tolerates non-normal data, and it still rejects at p = 0.013, so the unequal variance here is genuine rather than an artefact of skew. Levene's test is the version most reviewers name; it behaves like Fligner-Killeen but needs the car package, whereas `fligner.test` is built into base R. None of these tests has a threshold worth trusting on its own, because a small sample will miss real differences and a large one will flag differences too small to matter, so read the test next to the group variances rather than in place of them.

## What to do about it

### You are fine

Either the check did not reject, or your design protects you. On the tooth-growth data the two delivery methods have variances of 43.6 and 68.3, and an F-test does not reject equality.

```r
tapply(ToothGrowth$len, ToothGrowth$supp, var)
#>       OJ       VC 
#> 43.63344 68.32723 
var.test(len ~ supp, data = ToothGrowth)
#> 
#> 	F test to compare two variances
#> 
#> data:  len by supp
#> F = 0.6386, num df = 29, denom df = 29, p-value = 0.2331
#> alternative hypothesis: true ratio of variances is not equal to 1
#> 95 percent confidence interval:
#>  0.3039488 1.3416857
#> sample estimates:
#> ratio of variances 
#>          0.6385951 
```

The p-value of 0.23 gives no reason to abandon a pooled test, so you report the check and move on. There is a second, easier way to be fine that many authors miss: R's `t.test` applies the Welch correction by default, so if you called `t.test` without setting `var.equal = TRUE`, you never assumed equal variances at all and the objection does not touch your analysis. Check the degrees of freedom you reported. If they are fractional, the test was already Welch, and pointing that out is the reply.

### It is fixable

The variances differ and the correction is a one-line change: use the Welch version, which estimates a separate variance for each group and adjusts the degrees of freedom instead of pooling. Fuel economy in `mtcars` splits into two transmission groups whose variances differ by about two and a half times, 14.7 against 38.0, so it shows what the switch does.

```r
mt <- mtcars
mt$am <- factor(mt$am, labels = c("automatic", "manual"))
t.test(mpg ~ am, data = mt, var.equal = TRUE)
#> 
#> 	Two Sample t-test
#> 
#> data:  mpg by am
#> t = -4.1061, df = 30, p-value = 0.000285
#> alternative hypothesis: true difference in means between group automatic and group manual is not equal to 0
#> 95 percent confidence interval:
#>  -10.84837  -3.64151
#> sample estimates:
#> mean in group automatic    mean in group manual 
#>                17.14737                24.39231 
t.test(mpg ~ am, data = mt, var.equal = FALSE)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  mpg by am
#> t = -3.7671, df = 18.332, p-value = 0.001374
#> alternative hypothesis: true difference in means between group automatic and group manual is not equal to 0
#> 95 percent confidence interval:
#>  -11.280194  -3.209684
#> sample estimates:
#> mean in group automatic    mean in group manual 
#>                17.14737                24.39231 
```

The pooled test set the degrees of freedom at 30 and the p-value at 0.000285. The Welch test cut the degrees of freedom to 18.3, widened the confidence interval from (-10.85, -3.64) to (-11.28, -3.21), and moved the p-value to 0.001374. The estimated difference in means did not move at all, because Welch corrects the standard error and leaves the estimate alone. The manual-transmission advantage holds either way, so here the correction costs nothing but a little precision. For three or more groups the same idea is `oneway.test(y ~ group, var.equal = FALSE)`, the Welch one-way ANOVA described in [Welch's ANOVA in R](/Welchs-ANOVA-in-R.html).

### It is a real problem

Sometimes the unequal variance is not noise to correct but a sign that the model is the wrong one. When the variance grows with the mean, a Welch correction patches the test and leaves the cause untouched. The insect-spray counts show the pattern.

```r
rbind(mean = tapply(InsectSprays$count, InsectSprays$spray, mean),
      var  = tapply(InsectSprays$count, InsectSprays$spray, var))
#>             A        B        C        D   E        F
#> mean 14.50000 15.33333 2.083333 4.916667 3.5 16.66667
#> var  22.27273 18.24242 3.901515 6.265152 3.0 38.60606
```

The groups with the smallest mean counts, C and E, have the smallest variances, and the group with the largest mean, F, has the largest, because count data carry a built-in link between their mean and their variance. A Welch test on these numbers would run, but comparing arithmetic means of counts whose spread rises with their level answers a distorted question. The honest route is a model that expects the pattern: a square-root or log transform stabilises the variance, and a Poisson or quasi-Poisson model handles the counts directly, as in [Poisson regression in R](/Poisson-Regression-in-R.html). If instead the different spread is your actual result, say a treatment that makes responses more variable rather than simply larger, then report it as a finding in its own right instead of hiding it inside a test of means.

## How to word your response

### If you are fine

> We thank the reviewer for this point. The comparison in Table 2 uses Welch's t-test, which estimates a separate variance for each group and so does not assume homogeneity of variance. For completeness we also report a test of equal variances (F-test, p = 0.23), which shows no departure worth acting on. The choice of test and this check are now stated in the Methods (page X).

### If it was fixable

> The reviewer is correct that the group variances differ. We have replaced the pooled t-test with Welch's t-test, which does not assume equal variances. The estimated difference in means is unchanged and the effect remains significant, with a slightly wider confidence interval (now -11.3 to -3.2). The revised test and interval appear in the Results, and the change of method is noted in the Methods (page X).

### If it is a real problem

> We agree that the variances differ across groups, and on inspection the variance rises with the group mean, as is expected for count data. Rather than adjust the test alone, we have re-analysed the outcome with a quasi-Poisson model that accounts for this mean-variance relationship directly. The main conclusions are unchanged, though one contrast that was borderline under the original analysis is no longer significant, and we have revised that claim accordingly (Results, page X; Methods, page X).

## Practice

A reviewer writes: *"Bartlett's test on your three groups is highly significant, so the equal-variance assumption is violated and the ANOVA results as reported cannot be trusted."* You run the check:

```r
ex_var <- tapply(iris$Petal.Length, iris$Species, var)
ex_var
bartlett.test(Petal.Length ~ Species, data = iris)
oneway.test(Petal.Length ~ Species, data = iris, var.equal = TRUE)
oneway.test(Petal.Length ~ Species, data = iris, var.equal = FALSE)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The variances run from 0.030 in setosa to 0.305 in virginica, a tenfold range, and Bartlett's test rejects equality at p = 9.2e-13. Taken on their own, those numbers read as a clear yes to the reviewer.

They do not settle it, because each species has fifty observations, and a one-way ANOVA is highly robust to unequal variance when the groups are balanced like this. The last two lines show it: the classic ANOVA returns F = 1180 and the Welch version returns F = 1828, and both give p < 2.2e-16. Dropping the equal-variance assumption changes the test statistic and leaves the conclusion exactly where it was.

So a balanced design with an effect this large puts you in the first outcome, with no change needed. Report the Welch one-way ANOVA so the assumption is off the table, state that the result matches the pooled test, and note the equal group sizes. The wrong move is to take the significant Bartlett result as the last word and call the finding unreliable, when balanced groups and a separation this wide are the exact conditions under which unequal variance does no harm.

</details>
