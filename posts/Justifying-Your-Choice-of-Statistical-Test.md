---
title: "Justifying Your Choice of Statistical Test"
slug: Justifying-Your-Choice-of-Statistical-Test
description: "A reviewer asks why you used this test and not another. How to justify your choice of statistical test from your data, defend it, and report it in the Methods."
keywords: "justify your choice of statistical test, why did you use this test, statistical test justification, choice of statistical test, defend statistical test choice, which test peer review"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 3
handbook_chapter: 10
auto_link_terms: justify your choice of statistical test|choice of statistical test|justifying a statistical test|why this statistical test|statistical test justification|defend your test choice
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">You ran a statistical test, and somewhere in your review is a line asking why that one and not another. Justifying your choice of statistical test means tying the test to the structure of your data and your question, showing that a reasonable alternative would have reached the same conclusion, and stating both in the Methods so a reader can see the choice was principled rather than convenient.</p>

## The decision you are making

By the time this chapter is useful, the test has usually already run. You compared two groups, or fitted a model, and a number came out. The decision here is a separate one, made when you write the paper up: on what grounds you justify the test you used, and how much of that reasoning to put on the page.

Matching a test to your data is its own task, and the site already walks through it. The five questions that take you from an outcome variable and a design to a single correct test are laid out in [Which Statistical Test in R?](/Which-Statistical-Test-in-R.html). This chapter starts one step later, once you have a test in hand and a reviewer who wants to know why.

There are only a few grounds a reviewer accepts, and one they never do. A choice is defensible when it follows from the structure of the data, meaning what the outcome measures and how the groups are arranged, when the test's assumptions were checked rather than assumed, when it was fixed before you saw the results, or when it is the standard analysis for your design. A choice is indefensible when it was made by running several tests and keeping the one with the smallest p-value. That last move, choosing the analysis after seeing which analysis "works", is what inflates false-positive rates far beyond the nominal five percent (Simmons, Nelson & Simonsohn, 2011), so a reviewer who suspects it will not be reassured by any justification offered afterwards.

## What the options are

Justifying a test is really several smaller claims, and each has a form that invites the objection and a form that closes it. They hold whatever test you ran.

| The ground you stand on | The version a reviewer questions | The version that holds up | Source |
|---|---|---|---|
| The data's structure | "We used a t-test." | "The outcome is continuous and the two groups are independent, so we compared them with a two-sample test." | SAMPL guidelines (Lang & Altman, 2015) |
| The test's assumptions | Left unstated | Checked, or a test chosen to be robust to the violation, with which of the two stated plainly | CONSORT item 12a (Moher et al., 2010) |
| When the test was chosen | Unsaid | Stated as fixed in advance, or disclosed as decided after the results were in | Simmons et al. (2011) |
| Whether the choice mattered | The chosen test alone | The chosen test plus the reasonable alternative, shown to agree | [Sensitivity Analysis in R](/Sensitivity-Analysis-in-R.html) |
| Field convention | "This is standard." | The standard analysis for the design, with a citation to work that uses it | STROBE item 12 (von Elm et al., 2007) |

Two of these rows carry most of the weight. The first is structure, because a test that matches the outcome type and the design is the one a reviewer expects to see, and naming that match is usually enough to retire the question. The fourth is robustness. If you can show that the test you did not use would have given the same answer, the choice between the two stops mattering, and the worry about it goes with it.

## How to decide

Take a concrete case. In `mtcars`, does transmission type relate to fuel economy? The outcome is miles per gallon, and the grouping variable is `am`, coded 0 for automatic and 1 for manual. Before choosing anything, look at what those two variables actually are.

```r
# mpg is a continuous outcome; am (0 = automatic, 1 = manual) splits the cars
# into two independent groups. That structure, not the p-value, picks the test.
str(mtcars[c("mpg", "am")])
table(transmission = mtcars$am)
#> 'data.frame':	32 obs. of  2 variables:
#>  $ mpg: num  21 21 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2 ...
#>  $ am : num  1 1 1 0 0 0 0 0 0 0 ...
#> transmission
#>  0  1 
#> 19 13 
```

`mpg` is numeric, and `am` splits the 32 cars into two groups of 19 and 13, with no car in both. A continuous outcome compared across two independent groups points to a two-sample test, and that structural fact is the first half of the justification. It is also the half a reviewer can confirm from your Methods without touching your data.

The second half is showing the choice does not carry the result on its own. The usual worry about a t-test is normality, so run the test that drops that assumption alongside it and compare.

```r
# The two-sample comparison the structure points to, run two ways.
# Welch's t-test assumes approximate normality; the rank-based test assumes
# nothing about the shape of the distribution.
welch <- t.test(mpg ~ am, data = mtcars)
rank  <- wilcox.test(mpg ~ am, data = mtcars, exact = FALSE)
round(c(welch_p = welch$p.value, rank_p = rank$p.value), 4)
#> welch_p  rank_p 
#>  0.0014  0.0019 
```

The two p-values, 0.0014 from Welch's t-test and 0.0019 from the rank-based Wilcoxon test, sit almost on top of each other. Whatever you might worry about in the t-test's normality assumption, the test that assumes nothing about the shape reaches the same verdict, so the gap between manual and automatic cars is not an artefact of the test you picked. The p-value is also not the number you lead with. Report the size of the gap and its interval, because that is what tells a reader whether it matters.

```r
# Lead the report with the estimate and its interval, not the test's name.
tapply(mtcars$mpg, mtcars$am, mean)
round(welch$conf.int, 2)
#>        0        1 
#> 17.14737 24.39231 
#> [1] -11.28  -3.21
#> attr(,"conf.level")
#> [1] 0.95
```

Manual cars average 24.39 mpg against 17.15 for automatics, a gap the 95 percent interval places between 3.21 and 11.28 mpg. A test choice justified this way rests on two things a reviewer can verify for themselves, the structure that selected the test and the alternative that agrees with it, rather than on your assurance that the assumptions were fine.

Sometimes the two tests disagree, and this is where honesty does the work. If the t-test is significant and the rank-based test is not, you cannot present the significant one as your choice and leave the other out. The disagreement usually means the result is fragile, driven by a few extreme values or a small sample, and the correct move is to report the test that is more appropriate for the data, which is the rank-based one when normality is what is in doubt, and describe the finding as it stands under that test. A conclusion that holds only under the test that happened to clear 0.05 is not one you can defend, and the reviewer who notices the gap between the two will read the rest of the paper more sceptically.

## What reviewers will ask about this later

Justifying the test does not end the questions, it sets up the specific ones that follow, and most of them have a chapter of their own. The most common is a direct challenge to the assumption you leaned on. If you defended a parametric test, expect a reviewer to press on distribution, which is [Non-Normal Residuals in Peer Review](/Non-Normal-Residuals-in-Peer-Review.html) for models and, more broadly, the case for switching families set out in [When to Use Nonparametric Tests in R](/When-to-Use-Nonparametric-Tests-in-R.html). If your outcome is really ordered categories rather than a measured quantity, the objection sharpens into [Ordinal Data in Peer Review](/Ordinal-Data-in-Peer-Review.html).

Two more follow from how many tests you ran and when you settled on them. Comparing several groups or outcomes with separate tests raises [Multiple Comparisons in Peer Review](/Multiple-Comparisons-in-Peer-Review.html), and any hint that the test was picked once the results were visible brings [Exploratory vs Confirmatory Analysis in Peer Review](/Exploratory-vs-Confirmatory-Analysis-in-Peer-Review.html). Where the two groups had visibly different spread, the question becomes whether you should have used Welch's correction rather than the equal-variance version, covered in [Unequal Variance in Peer Review](/Unequal-Variance-in-Peer-Review.html). And if the honest answer is that a group comparison was the wrong frame and the real question was about prediction, the choice moves up a level to [Which Regression Model in R](/Which-Regression-Model-in-R.html), where the parallel decision about a link function has its own review objection in [Link Function Choice in Peer Review](/Link-Function-Choice-in-Peer-Review.html).

## How to report it

The justification belongs in the statistical methods paragraph, and it needs three things: the test, the feature of the data that selected it, and, where you have it, the assurance that the choice is not load-bearing. Reporting guidelines ask for exactly this level of detail, that the statistical methods be described well enough for a knowledgeable reader to judge them (Lang & Altman, 2015; von Elm et al., 2007). Here is the clean case, where the test matches the design and was fixed in advance.

> Fuel economy (miles per gallon) was compared between automatic and manual transmissions using a two-sample t-test, the outcome being continuous and the two groups independent. This test was specified before analysis. To confirm the result did not depend on the normality assumption, we repeated the comparison with a Wilcoxon rank-sum test, which gave a materially identical p-value (0.0019 versus 0.0014). Manual cars averaged 7.2 mpg more (95% CI 3.2 to 11.3). Full code is provided in the supplement.

When you departed from the test a reviewer would expect, name the reason and cite it, rather than leaving them to guess at it.

> Because the outcome was strongly right-skewed and the sample small, we report a Wilcoxon rank-sum test in place of the t-test, following the guidance that rank-based tests are preferable for small, skewed samples (Field, Miles & Field, 2012). The two tests agreed in direction, and we chose the rank-based one as the more defensible under the observed distribution.

And when the test was in fact settled on after seeing the data, or the alternatives disagree, disclose it. This is uncomfortable to write, and it is far safer than being caught.

> The choice of test was not pre-specified. We report both analyses: the t-test (p = 0.04) and the Wilcoxon rank-sum test (p = 0.11) disagree at the 0.05 level, so we treat the difference as inconclusive pending replication.

None of these paragraphs argues that the test was correct in the abstract. Each hands the reviewer the same two things you used to decide, the structure that picked the test and the alternative that checks it, and lets them reach your conclusion by the route you took. A methods section written that way gives a reviewer very little to object to that you have not already answered on the page.
