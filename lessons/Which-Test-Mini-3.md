---
title: "Mann-Whitney U test: when and how to run it"
slug: "Which-Test-Mini-3"
description: "See why one huge salary breaks a t-test, then run the Mann-Whitney U test in R: ranking, the U statistic, a p-value, effect size, and ties, with a report line."
keywords: "Mann-Whitney U test, wilcox.test, nonparametric test, rank-biserial correlation, two independent groups in R, effect size"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "3"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-2"
course_next: "Which-Test-Mini-4"
curriculum_id: "0.0.20"
lesson_access: "windowed"
catalog_blurb: "Compare two groups without letting one extreme value decide the answer."
---

=== step === cover
## Mann-Whitney U test: when and how to run it

Today let's understand the Mann-Whitney U test: what it actually compares, and why one extreme value that wrecks a plain average barely touches it.

Here is the setup. Northline and Southfield are two small companies, each with eight employees. One of Northline's eight is an executive earning \$1,400,000 a year, close to twenty times what a typical Northline employee makes. The other seven Northline salaries and all eight Southfield salaries sit in an ordinary range, nowhere near that.

<img src="screenshots/Which-Test-Mini-3-cover-boxplot.png" alt="Boxplot of Northline and Southfield salaries; one Northline salary sits far above every other point" width="900" height="620" />

Let's build this data in R and look at both companies side by side.

```r
# Build the salary data for both companies and plot it
library(ggplot2)

Northline <- c(58000, 61000, 63000, 65000, 68000, 70000, 72000, 1400000)
Southfield <- c(60000, 62000, 65000, 67000, 69000, 71000, 74000, 77000)

pay <- data.frame(
  salary  = c(Northline, Southfield),
  company = rep(c("Northline", "Southfield"), each = 8)
)

ggplot(pay, aes(company, salary)) +
  geom_boxplot() +
  labs(x = "Company", y = "Annual salary ($)",
       title = "Northline vs Southfield: annual salary")
#> A boxplot with one Northline point sitting far above every other salary
```

Look at that plot. One point floats way above everything else, so far up that Northline's own box gets squashed flat near the bottom. That single salary is going to cause trouble for the wrong kind of test.

=== step === concept
## Why one outlier breaks the average, and why the t-test's interval widens with it

A t-test compares two groups by comparing their means. So let's see what the executive's salary does to Northline's mean, and whether the median gives a different answer.

```r
# Compare mean and median pay, then run a standard t-test
mean_north <- mean(Northline)
mean_south <- mean(Southfield)
median_north <- median(Northline)
median_south <- median(Southfield)

c(mean_north = mean_north, mean_south = mean_south,
  median_north = median_north, median_south = median_south)
#>   mean_north   mean_south median_north median_south 
#>       232125        68125        66500        68000 

t.test(Northline, Southfield)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  Northline and Southfield
#> t = 0.98286, df = 7.0021, p-value = 0.3584
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -230537.1  558537.1
#> sample estimates:
#> mean of x mean of y 
#>    232125     68125
```

Look at the two pairs of numbers. Northline's mean is \$232,125, more than three times Southfield's \$68,125. But the medians, \$66,500 against \$68,000, sit almost on top of each other. One salary dragged the mean up; it barely touched the median, since the median only depends on the middle value, not the size of the extreme ones.

The t-test compares means, so it carries that distortion straight through. Its 95% confidence interval for the difference runs from about negative \$230,537 to positive \$558,537. That range is so wide it says almost nothing: it cannot even tell you which company pays more, let alone by how much. One salary out of sixteen did that.

[NOTE]
This is exactly the situation a Mann-Whitney U test is built for: two independent groups, compared without leaning on the mean.

=== step === concept
## How ranks turn the outlier into just "the biggest," and where U comes from

The Mann-Whitney test does not look at the sixteen salaries themselves. It looks at their order. Every salary gets replaced by its rank among all sixteen, from 1 (the smallest) to 16 (the largest), and the test works entirely off those ranks.

```r
# Rank all 16 salaries together and see who holds each rank
ranked <- pay
ranked$rank <- rank(ranked$salary)
ranked <- ranked[order(ranked$salary), ]
rownames(ranked) <- NULL
ranked
#>     salary    company rank
#> 1    58000  Northline  1.0
#> 2    60000 Southfield  2.0
#> 3    61000  Northline  3.0
#> 4    62000 Southfield  4.0
#> 5    63000  Northline  5.0
#> 6    65000  Northline  6.5
#> 7    65000 Southfield  6.5
#> 8    67000 Southfield  8.0
#> 9    68000  Northline  9.0
#> 10   69000 Southfield 10.0
#> 11   70000  Northline 11.0
#> 12   71000 Southfield 12.0
#> 13   72000  Northline 13.0
#> 14   74000 Southfield 14.0
#> 15   77000 Southfield 15.0
#> 16 1400000  Northline 16.0
```

Two things are worth noticing. First, the \$1,400,000 salary gets rank 16, exactly the same rank any largest salary would get, whether it was \$150,000 or \$15,000,000. Ranking throws away the size of the gap and keeps only the order, and that is precisely why the outlier stops being able to dominate the result. Second, Northline and Southfield both have someone earning \$65,000, so those two rows tie for ranks 6 and 7. R gives each of them the average of the two, 6.5, which is the standard way ranks handle a tie.

Now add up the ranks for each company. Northline's rank sum, added over its eight rows, is called \(R_1\). From \(R_1\) you get the Mann-Whitney U statistic directly:

\[ U = R_1 - \frac{n_1(n_1+1)}{2} \]

Here \(n_1\) is Northline's sample size, 8, so \(n_1(n_1+1)/2 = 36\) is the smallest possible rank sum a group of 8 could have (if it held ranks 1 through 8). Subtracting that floor off the actual rank sum leaves U.

```r
# Add up the ranks for each company and compute U by hand
n1 <- 8
n2 <- 8
rank_sum_north <- sum(ranked$rank[ranked$company == "Northline"])
rank_sum_south <- sum(ranked$rank[ranked$company == "Southfield"])
U_by_hand <- rank_sum_north - n1 * (n1 + 1) / 2

c(rank_sum_north = rank_sum_north, rank_sum_south = rank_sum_south, U_by_hand = U_by_hand)
#> rank_sum_north rank_sum_south      U_by_hand 
#>           64.5           71.5           28.5 

wilcox.test(Northline, Southfield)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  Northline and Southfield
#> W = 28.5, p-value = 0.7416
#> alternative hypothesis: true location shift is not equal to 0
```

The hand-computed U, 28.5, matches `wilcox.test()`'s `W` exactly. R calls the statistic `W` instead of `U`, but they are the same number here; Mann and Whitney's U and Wilcoxon's rank-sum statistic are two names built from the same ranks. Northline's rank sum, 64.5, is barely below Southfield's 71.5, which is a much smaller gap than the salaries themselves suggested. That is the whole mechanism: the outlier moved the mean by more than \$150,000, but it only ever moved one rank sum by one rank.

=== step === widget
## Reading the p-value against the null distribution

The p-value, 0.7416, needs a yardstick to make sense of it. That yardstick is the null distribution: the spread of rank sums you would see across many pairs of 8-out-of-16 samples if Northline and Southfield truly paid at the same rate, so that which company a salary lands in is just chance.

Under that null, a group of 8 out of 16 ranks has a rank sum that averages half of \(1+2+\dots+16=136\), which is 68, and wanders above and below that by chance alone. Northline's observed rank sum, 64.5, sits close to that average.

```r
# Standardize Northline's rank sum against its null-distribution spread
mu_null <- n1 * (n1 + n2 + 1) / 2
sd_null <- sqrt(n1 * n2 * (n1 + n2 + 1) / 12)
z_north <- abs(rank_sum_north - mu_null) / sd_null
round(z_north, 2)
#> [1] 0.37
```

That puts Northline's rank sum on a scale where the null distribution centers at zero and distance is measured in standard deviations: 0.37 says the observed split sits well under half a standard deviation from what pure chance produces on average, nowhere near either tail. The widget below draws that null distribution as a curve on the same standardized scale, and shades the tail beyond wherever you place the marker. Northline's result sits at 0.37, which is where the marker below starts.

::widget null-distribution {"tails": 2, "max": 4, "start": 0.37, "label": "standardized rank-sum statistic"}

Read the shaded area as the p-value: it reads about 0.74 here, matching the 0.7416 `wilcox.test()` reported (the widget uses a smooth curve, so the two will not match to the last decimal, but they land in the same place). Drag the marker further from zero and the shaded tail shrinks, meaning a rank split that uneven would be rarer under the null. Drag it back toward zero and the tail grows, meaning that split is closer to what pure chance produces most of the time. Northline's marker sitting this close to zero is exactly why 0.7416 is a large, unremarkable p-value: a rank sum this ordinary shows up under the null all the time.

=== step === quiz
## Quick check: the outlier, the ranks, and the p-value

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- R silently drops the \$1,400,000 salary before ranking it. ::no Ranking never removes a value. Every one of the sixteen salaries gets a rank, including the largest one; it just cannot get any rank higher than 16, no matter how large it is.
- R replaces the outlier's value with the group's median before ranking. ::no Nothing gets replaced. `rank()` works on the salaries exactly as given; the outlier keeps its own value and simply ends up in the top position once everything is sorted.
- Ranking replaces each raw salary with its position among all sixteen, so the largest salary only ever contributes the top rank, and p = 0.7416 says a rank split this uneven is unremarkable if the two companies really pay the same. ::ok Exactly right. That is the whole mechanism: the size of the gap between salaries disappears once you rank them, which is why one enormous value cannot swing the result the way it swings a mean.
- p = 0.7416 means there is a 74% chance the two companies really pay the same. ::no A p-value never states the probability that the null hypothesis is true. It states how often a rank split this uneven, or worse, would turn up if the null were true. Here that is often, about 74% of the time, which is exactly why this result gives you no reason to say the companies differ.

=== step === concept
## Running it two ways: two vectors or one data frame

`wilcox.test()` takes two separate vectors directly, Northline and Southfield among them. When your data already lives in one data frame, R's formula syntax reads almost like a sentence: `salary ~ company` means "compare salary between the levels of company."

```r
# Run the same test from the data frame using formula syntax
pay
#>     salary    company
#> 1    58000  Northline
#> 2    61000  Northline
#> 3    63000  Northline
#> 4    65000  Northline
#> 5    68000  Northline
#> 6    70000  Northline
#> 7    72000  Northline
#> 8  1400000  Northline
#> 9    60000 Southfield
#> 10   62000 Southfield
#> 11   65000 Southfield
#> 12   67000 Southfield
#> 13   69000 Southfield
#> 14   71000 Southfield
#> 15   74000 Southfield
#> 16   77000 Southfield

wilcox.test(salary ~ company, data = pay)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  salary by company
#> W = 28.5, p-value = 0.7416
#> alternative hypothesis: true location shift is not equal to 0
```

W comes out the same, 28.5, and so does p, 0.7416. The formula form costs nothing in accuracy and saves you from splitting a data frame into separate vectors every time, so reach for it whenever your data already sits in one table.

=== step === concept
## Measuring the size of the effect: rank-biserial r

A p-value only tells you whether a difference is detectable. It says nothing about how big that difference is, and a Mann-Whitney test has its own effect size for that: the rank-biserial correlation, r.

\[ r_{rb} = 1 - \frac{2U}{n_1 n_2} \]

U is the statistic `wilcox.test()` reports as W, and \(n_1, n_2\) are the two group sizes. When U sits at its largest possible value, meaning one group's salaries are always ranked below the other's, r reaches 1 or negative 1. When U sits near the middle of its range, the way it does here, r sits near zero.

```r
# Compute the rank-biserial effect size from U, n1, and n2
mw_result <- wilcox.test(Northline, Southfield)
U_stat <- mw_result$statistic
r_rb <- 1 - (2 * U_stat) / (n1 * n2)
unname(round(r_rb, 3))
#> [1] 0.109

effect_size <- abs(r_rb)
magnitude <- if (effect_size < 0.10) "negligible" else if (effect_size < 0.30) "small" else if (effect_size < 0.50) "medium" else "large"
magnitude
#> [1] "small"
```

r comes out to 0.109. Against the common cutoffs for r, negligible below 0.10, small below 0.30, medium below 0.50, and large above that, 0.109 lands just past the negligible line, into "small." That matters for how you word the conclusion. It would be too strong to call this pay gap negligible, since a small effect is still an effect. But it backs up what the p-value already showed: whatever gap exists between the two companies' typical pay, it is small, not the eye-catching difference the raw means seemed to suggest.

=== step === concept
## Handling ties and a one-sided test

Two situations come up often enough that they deserve their own look: what happens when values tie exactly, and how to ask a one-directional question instead of "are they different at all."

One tie already sits in the rank table, the \$65,000 that both companies share. Let's push that further and see what a heavier tie does to the result. R's help page for `wilcox.test()` notes that with ties present, it computes an exact result using a permutation method built for tied ranks; passing `exact = FALSE` instead switches to the classic normal approximation, which is the more common choice once ties are around.

```r
# A heavier tied version of Northline: one 63000 becomes a second 65000
tied_a <- Northline
tied_a[tied_a == 63000] <- 65000

wilcox.test(tied_a, Southfield, exact = FALSE)
#> 
#> 	Wilcoxon rank sum test with continuity correction
#> 
#> data:  tied_a and Southfield
#> W = 29, p-value = 0.7923
#> alternative hypothesis: true location shift is not equal to 0
```

W moved from 28.5 to 29 and p from 0.7416 to 0.7923, small shifts, since one salary moved to sit exactly on top of an existing one rather than changing the overall picture.

Now suppose the real question is not "do they differ" but "is Northline's typical pay lower." That is a one-sided test, set with `alternative = "less"`, and adding `conf.int = TRUE` gives you a range for the size of that shift.

```r
# Test whether Northline's typical pay is lower, with a confidence interval
mw_one_sided <- wilcox.test(Northline, Southfield, alternative = "less", conf.int = TRUE)
mw_one_sided
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  Northline and Southfield
#> W = 28.5, p-value = 0.3708
#> alternative hypothesis: true location shift is less than 0
#> 95.9 percent confidence interval:
#>  -Inf 5000
#> sample estimates:
#> difference in location 
#>                  -1500
```

The one-sided p-value, 0.3708, is exactly half of 0.7416, since a one-sided test only counts the tail pointing in the direction you asked about. R reports a 95.9 percent interval rather than an exact 95%, because this rank-based interval can only land on certain achievable levels, and 95.9% is the closest one to 95% available here. The estimated shift, negative \$1,500, says Northline's typical pay sits about \$1,500 below Southfield's, but the interval running all the way to \$5,000 the other direction shows that shift is far from certain.

=== step === widget
## Checking the shapes before trusting the result

One more check belongs before you write up any Mann-Whitney result: look at the shape of each group, not just its summary numbers. The wording you are allowed to use depends on it.

Toggle between the boxplot and the histogram view of the same sixteen salaries below.

::widget chart-plotter {"data": [{"x":"Northline","y":58000},{"x":"Northline","y":61000},{"x":"Northline","y":63000},{"x":"Northline","y":65000},{"x":"Northline","y":68000},{"x":"Northline","y":70000},{"x":"Northline","y":72000},{"x":"Northline","y":1400000},{"x":"Southfield","y":60000},{"x":"Southfield","y":62000},{"x":"Southfield","y":65000},{"x":"Southfield","y":67000},{"x":"Southfield","y":69000},{"x":"Southfield","y":71000},{"x":"Southfield","y":74000},{"x":"Southfield","y":77000}], "x": "company", "y": "salary", "geoms": ["boxplot", "histogram"], "code": {"boxplot": "ggplot(pay, aes(company, salary)) +\n  geom_boxplot()", "histogram": "ggplot(pay, aes(salary)) +\n  geom_histogram(bins = 8) +\n  facet_wrap(~company)"}}

The boxplot view shows Northline's box sitting close to Southfield's, with that one point floating far above both. The histogram view splits each company into its own panel, so you can see where most of each company's pay actually sits, without one point stretching the whole picture. That is where p = 0.7416 comes from: the bulk of both companies' pay overlaps heavily, and the outlier barely counts once everything is ranked.

When the two groups' shapes look this similar, a Mann-Whitney result (were it significant) can be read as "the medians differ." When shapes look clearly different, sharper on one side, wider on the other, you have to fall back to the weaker phrasing: "values in one group tend to be larger than values in the other." Here the shapes are close enough, and the test was not significant either way, so the honest conclusion is simply that there is no reliable difference in typical pay to report.

=== step === concept
## Writing the result up in one line

A complete Mann-Whitney report packs the group sizes, the statistic, the p-value, and the effect size into one sentence, so anyone reading it can judge the result without rerunning your code.

```r
# Build a one-line report of the Mann-Whitney result
report <- paste0(
  "A Mann-Whitney U test found no reliable difference in pay between Northline (n = ", n1,
  ") and Southfield (n = ", n2,
  "), W = ", U_stat,
  ", p = ", signif(mw_result$p.value, 4),
  ", rank-biserial r = ", round(unname(r_rb), 2), "."
)
cat(report)
#> A Mann-Whitney U test found no reliable difference in pay between Northline (n = 8) and Southfield (n = 8), W = 28.5, p = 0.7416, rank-biserial r = 0.11.
```

That sentence carries everything a reader needs: how many salaries went into each side, the statistic, the p-value, and how large the effect actually was. Nothing here overstates the result, and nothing hides behind a bare p-value.

=== step === quiz
## Quick check: reading a Mann-Whitney result

Suppose a different Mann-Whitney test, on two other groups, comes back with p = 0.02, rank-biserial r = 0.08, and boxplots showing the two groups heavily overlapping. What is the right way to describe that result?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- p = 0.02 alone proves a large, important difference. ::no A small p-value only says the difference is detectable, not that it is large. Here the effect size, 0.08, sits below the negligible cutoff of 0.10, so "large" is the wrong word for it.
- Rerun the test on a bigger sample so the effect size grows. ::no A bigger sample changes how easily you can detect an effect; it does not change the size of the effect itself. r = 0.08 would very likely stay close to 0.08 with more data, even as the p-value dropped further.
- The difference is statistically detectable but the effect is negligible and the shapes barely differ, so report the numbers rather than call it a meaningful difference. ::ok Exactly right. All three pieces of evidence, the p-value, the effect size, and the overlapping shapes, point the same way: something real but too small to act on.
- Overlapping boxplots mean the test must be wrong. ::no A test can find a real, detectable difference even while the two groups' boxplots overlap heavily; that combination is common with large samples and small effects. Overlap is a reason to read the effect size carefully, not a reason to distrust the test.

=== step === tryit
## Your turn: run the whole pipeline on a new pair of groups

The built-in `airquality` data set records daily ozone levels in New York. Compare May's ozone readings against August's: run `wilcox.test()`, then build a one-line report with the group sizes, W, p, and rank-biserial r.

```r
# Compare May and August ozone levels using the built-in airquality data
data(airquality)
may_ozone <- na.omit(airquality$Ozone[airquality$Month == 5])
aug_ozone <- na.omit(airquality$Ozone[airquality$Month == 8])

# Your turn: run a Mann-Whitney test comparing may_ozone and aug_ozone
# (use exact = FALSE, since August has a tie), then build a one-line
# report the way you did earlier in this lesson.
```
::check {"regex": "(?=[\\s\\S]*na\\.omit\\s*[(])(?=[\\s\\S]*wilcox\\.test\\s*[(])", "gate": true, "difficulty": "intermediate", "ok": "Right pipeline: na.omit() drops the missing readings, then wilcox.test() compares the two months.", "no": "Keep the na.omit() lines exactly as given, then add a wilcox.test(may_ozone, aug_ozone, exact = FALSE) call."}
::solution
```r
# Run the Mann-Whitney test on May vs August ozone, then report it
data(airquality)
may_ozone <- na.omit(airquality$Ozone[airquality$Month == 5])
aug_ozone <- na.omit(airquality$Ozone[airquality$Month == 8])

mw_air <- wilcox.test(may_ozone, aug_ozone, exact = FALSE)
mw_air
#> 
#> 	Wilcoxon rank sum test with continuity correction
#> 
#> data:  may_ozone and aug_ozone
#> W = 127.5, p-value = 0.0001208
#> alternative hypothesis: true location shift is not equal to 0

n1_air <- length(may_ozone)
n2_air <- length(aug_ozone)
U_air <- mw_air$statistic
r_air <- 1 - (2 * U_air) / (n1_air * n2_air)
round(unname(r_air), 3)
#> [1] 0.623

report_air <- paste0(
  "A Mann-Whitney U test found that May ozone (n = ", n1_air,
  ") differed from August ozone (n = ", n2_air,
  "), W = ", U_air,
  ", p = ", signif(mw_air$p.value, 2),
  ", rank-biserial r = ", round(unname(r_air), 2), "."
)
cat(report_air)
#> A Mann-Whitney U test found that May ozone (n = 26) differed from August ozone (n = 26), W = 127.5, p = 0.00012, rank-biserial r = 0.62.
```

May and August land on the opposite end of the Northline-Southfield result. There, p was large and r was small: no reliable difference. Here, p is tiny and r is 0.623, a large effect: May's ozone readings are genuinely, and substantially, lower than August's.

=== step === concept
## References

- [On a Test of Whether one of Two Random Variables is Stochastically Larger than the Other](https://doi.org/10.1214/aoms/1177730491) - Mann and Whitney (1947), Annals of Mathematical Statistics 18(1), 50-60. The original paper behind the test.
- [Wilcoxon Rank Sum and Signed Rank Tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html) - R Core Team, the `wilcox.test()` reference documentation.
- [The simple difference formula: An approach to teaching nonparametric correlation](https://doi.org/10.2466/11.IT.3.1) - Kerby (2014), Comprehensive Psychology 3. The source of the rank-biserial formula used in this lesson.
- [The Wilcoxon-Mann-Whitney procedure fails as a test of medians](https://doi.org/10.1080/00031305.2017.1305291) - Divine, Norton, Barón, and Juarez-Colunga (2018), The American Statistician 72(3), 278-286. Why shape matters before you say "medians differ."
- [Practical Nonparametric Statistics](https://openlibrary.org/isbn/9780471160687) - Conover (1999), 3rd ed., Wiley.

=== step === complete
## Wrap-up

Northline and Southfield's story ends where it started, just with the right test behind it: once you rank the sixteen salaries instead of averaging them, there is no reliable difference in typical pay between the two companies, and the one enormous salary never got the chance to say otherwise.

You now have a complete Mann-Whitney toolkit. You can run `wilcox.test()` from two vectors or from a data frame with formula syntax and get the same answer either way. You can read W and its p-value against the null distribution of rank sums. You can size the result with the rank-biserial correlation r, so you never have to rely on a p-value alone. You know what `exact = FALSE` does once ties are common, how to ask a one-sided question, and how to check the two groups' shapes before choosing your wording. And you can pack all of it, group sizes, W, p, and r, into one report sentence a reader can trust without rerunning your code.
