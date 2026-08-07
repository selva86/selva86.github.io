---
title: "Ordinal Data in Peer Review"
slug: Ordinal-Data-in-Peer-Review
description: "A reviewer says you used a parametric test on ordinal data. How to check in R whether it actually changed your result, decide what to do, and word the reply."
keywords: "parametric test on ordinal data, reviewer says the outcome is ordinal, t-test on a Likert scale, ordinal data peer review, treating ordinal as continuous, Mann-Whitney response to reviewer"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 54
auto_link_terms: ordinal data objection|parametric test on ordinal data|t-test on ordinal data|Likert scale reviewer|ordinal outcome peer review|treating ordinal data as continuous
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Treating an ordinal score as if it were a continuous measurement is usually a robustness question rather than a fatal flaw, because the rank-based test the reviewer is asking for almost always reaches the same conclusion as the t-test. What matters is the smaller set of cases where the two disagree, since that is where the parametric result was leaning on an assumption the scale cannot support.</p>

## What the reviewer wrote

> The outcome is a five-point Likert scale. A t-test is not appropriate for ordinal data, and the authors should use a non-parametric test.

> Satisfaction was measured on an ordered categorical scale, so I am not convinced the assumption of interval-level measurement behind the reported means is justified.

> The analysis is generally clear, but I have a concern about Table 2. Treating the symptom-severity rating as continuous and comparing group means seems questionable to me, and a method suited to ordinal responses might give a more defensible result.

## What they actually mean

The reviewer is pointing out that the numbers you averaged are labels for ordered categories, not measured quantities. On a scale that runs from "much worse" to "much better", the codes 1 through 5 record the order of the responses and nothing else, so there is no guarantee that the step from 1 to 2 is the same size as the step from 4 to 5. A mean assumes those steps are equal, and the t-test, one-way ANOVA, Pearson correlation and ordinary linear regression all inherit that same assumption.

It is easy to read this as a complaint about normality and reach for a Shapiro-Wilk test in reply. That is the wrong target. The objection is not about the shape of the distribution but about the level of measurement, so no normality test speaks to it. What the reviewer is questioning is whether the mean is a meaningful summary of the scale at all, and whether the test that compares those means is relying on spacing you cannot defend.

The reviewer is usually not saying your result is wrong. They are saying the summary might be inappropriate, and that the finding should be shown to hold under a method that uses only the order of the responses rather than their arithmetic.

## Why they are asking

When the spacing between categories is unknown, the mean of an ordinal variable can move for reasons that have nothing to do with a real shift in responses. A bounded scale caps the extremes, so a cluster of answers at the top or the bottom pulls the average around even when the bulk of the distribution has not changed. Equal-spacing coding can also manufacture an effect size that does not exist, because a reported gain of "0.8 points" only means something if a point is a fixed quantity, and on an ordinal scale it is not. The practical danger is that a t-statistic turns significant on the strength of an inflated mean while the ranks barely separate, which is the exact pattern a reviewer has learned to distrust.

The mechanics of the rank-based alternatives are covered in [Mann-Whitney U Test in R](/Mann-Whitney-U-Test-in-R.html) for two groups and [Kruskal-Wallis Test in R](/Kruskal-Wallis-Test-in-R.html) for more than two, and [When to Use Nonparametric Tests in R](/When-to-Use-Nonparametric-Tests-in-R.html) covers the wider choice. This chapter is about deciding whether the objection changes your conclusion and what to say back.

## How to check it

The check is to run the parametric test the paper reported and the rank-based test the reviewer wants on the same data, then compare their conclusions rather than their exact numbers. Report the median alongside, because the median is the location summary an ordinal scale actually supports.

Take a trial that scored sleep quality at follow-up on a five-point scale, from 1 (much worse) to 5 (much better), in a control arm and a treatment arm.

```r
control   <- rep(1:5, c(6, 10, 12, 8, 4))
treatment <- rep(1:5, c(2,  5, 10, 13, 10))
score <- c(control, treatment)
arm   <- factor(rep(c("control", "treatment"), c(40, 40)))
table(arm, score)
#>            score
#> arm          1  2  3  4  5
#>   control    6 10 12  8  4
#>   treatment  2  5 10 13 10
```

Now the two tests, with the medians for context.

```r
aggregate(score ~ arm, FUN = median)
#>         arm score
#> 1   control     3
#> 2 treatment     4
c(t_test   = t.test(score ~ arm)$p.value,
  wilcoxon = wilcox.test(score ~ arm)$p.value)
#>      t_test    wilcoxon 
#> 0.005734308 0.005851868
```

The t-test gives p = 0.0057 and the Mann-Whitney (Wilcoxon rank-sum) test gives p = 0.0059, so both land well below 0.05 and point the same way, while the median rises from 3 to 4. When the two p-values fall on the same side of your threshold, the choice of test did not change the story, and that answers most versions of this objection.

One thing worth weighing is how many points the scale has. A two- or three-point scale gives the mean almost nothing to stand on, whereas a seven-point scale that is roughly symmetric behaves enough like an interval measurement that the parametric and rank-based tests rarely diverge, a point argued at length by Norman (2010). The comparison above, and not the number of categories on its own, is what settles whether you have a problem.

## What to do about it

### You are fine

The parametric test and the rank-based test agree, or the scale has enough well-behaved categories that the mean is defensible on its own.

In the trial above, both tests return p close to 0.006 and the median rises from 3 to 4, so the significant result does not depend on how the scale was treated. Report the rank-based test as the primary comparison, or report both and state that they agree, and give the medians rather than the means.

### It is fixable

The reviewer is right that the reported test assumed more than the scale supports, and the remedy is to re-analyze with a method built for ordered outcomes and report that as the main result. For two groups this is the Mann-Whitney test, for several it is Kruskal-Wallis, and when you need to adjust for other variables it is proportional-odds ordinal logistic regression.

The ordinal model also replaces a summary you cannot defend with one you can. The paper reported a difference in means, which on this scale was 3.60 minus 2.85, a gain of 0.75 "points" that has no fixed interpretation. The ordinal model reports an odds ratio instead.

```r
library(MASS)
aggregate(score ~ arm, FUN = mean)
#>         arm score
#> 1   control  2.85
#> 2 treatment  3.60
m <- polr(factor(score, ordered = TRUE) ~ arm,
          data = data.frame(score, arm), Hess = TRUE)
exp(coef(m))
#> armtreatment 
#>     3.135955
```

The odds ratio of 3.14 says treatment patients have about three times the odds of falling in a higher response category than control patients, and the scale can support that statement because it uses only the order. The conclusion is the same one the means pointed to; what changed is that it is now reported in a quantity a reviewer will accept. The method itself is covered in [Ordinal Logistic Regression in R](/Ordinal-Logistic-Regression-in-R.html).

### It is a real problem

The significant result came from the parametric test and does not survive the one built for the scale, or the paper's contribution was the size of the change and not just its direction.

The first case appears when a handful of responses at one end of the scale drive the mean while the ranks overlap heavily, so the t-test is significant and the Mann-Whitney is not. There the honest reading is that the effect was an artifact of the spacing you assumed, and the claim has to be softened to match the test the data can actually support. The second case is harder. If the paper's point was that an intervention raised scores by 1.5 points, no rank-based method will reproduce that number, because "1.5 points" is an interval statement and the data are ordinal. You can restate the contribution as an odds ratio or as a shift in the proportion of patients reaching the top categories, and drop the point-change wording, but if the effect was only ever significant under the interval assumption the reviewer questioned, no restatement will bring it back, and the honest response is to say so.

## How to word your response

### If you are fine

> We thank the reviewer for raising this. Because the outcome is ordinal, we have re-analyzed the primary comparison with the Mann-Whitney U test in addition to the t-test. The two agree closely (p = 0.006 for both), and the median score rises from 3 in the control arm to 4 in the treatment arm. We now report the Mann-Whitney test and the group medians in the Methods and Table 2 (page X), and the conclusion is unchanged.

### If it was fixable

> The reviewer is correct that comparing means treats the ordered response scale as interval data. We have re-analyzed the outcome using proportional-odds ordinal logistic regression, which uses only the rank order of the responses. Treatment is associated with 3.1 times the odds of reporting a higher category, consistent with the direction of the original result, and we now report this odds ratio and its confidence interval in place of the difference in means throughout the Results (page X) and Table 2.

### If it is a real problem

> We appreciate the reviewer pushing on this. On re-analysis with the Mann-Whitney U test, the difference we reported is no longer significant (p = 0.07, against p = 0.02 from the t-test), which tells us the original result depended on treating the ordinal scale as interval data. We have removed the claim of a significant group difference from the Abstract and Results, and now report the medians and the non-significant rank-based test, noting that the data do not support a difference on this outcome once the measurement level is respected (Results, page X).

A concession that names the test you now trust and states plainly what you removed from the paper reads as competence, and it is accepted far more often than an argument for keeping an analysis the reviewer has already doubted.

## Practice

A reviewer writes: *"Patient satisfaction in Table 3 is a seven-point ordinal rating, yet the two hospitals are compared with a two-sample t-test. Please use a method appropriate to ordinal data."* You re-run the comparison both ways.

```r
ex_A <- rep(1:7, c(10, 12, 10, 4, 2, 1, 1))
ex_B <- rep(1:7, c(7,  9, 10, 3, 1, 1, 9))
ex_score    <- c(ex_A, ex_B)
ex_hospital <- factor(rep(c("A", "B"), c(40, 40)))
table(ex_hospital, ex_score)
aggregate(ex_score ~ ex_hospital, FUN = median)
c(t_test   = t.test(ex_score ~ ex_hospital)$p.value,
  wilcoxon = wilcox.test(ex_score ~ ex_hospital)$p.value)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The t-test returns p = 0.025, so on the reported analysis the two hospitals differ significantly. The obvious move is to treat the objection as a formality and keep the finding.

Run the Mann-Whitney test the reviewer asked for and it returns p = 0.073, which is not significant. The medians are 2 for hospital A and 3 for hospital B, and the means are 2.575 and 3.525, a full point apart. That gap between the means is the tell: look at the counts and hospital B has nine patients at the top of the scale, a score of 7, against hospital A's one, and those nine responses drag the mean up while the bulk of the two distributions overlap. The rank-based test, which ignores how far 7 sits from 4 and counts only order, sees no significant separation.

This is the third outcome and not the first. The significant result was an artifact of treating the ordinal scale as interval, and it does not survive the test built for the scale. The honest response is to report the Mann-Whitney test, state that the group difference is not significant once measurement level is respected, and remove the claim of a difference from the conclusions. Switching to the correct test loses the finding here, which is the reason the reviewer asked for it.

</details>
