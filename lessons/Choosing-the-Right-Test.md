---
title: "Choosing Statistical Tests Lesson 1: Choosing the right test"
catalog_blurb: "Three questions that tell you which statistical test actually fits your data."
description: "Four real questions about a training program, and the three questions that tell you whether each one needs a t-test, chi-squared test, or a regression model."
keywords: "choosing a statistical test, independent samples t-test, paired t-test, chi-squared test of independence, test selection, hypothesis testing, interaction term, regression model, R"
post_type: "LESSON"
curriculum_id: "4.40.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-test-selection"
course_title: "Choosing Statistical Tests"
course_lesson: "1"
course_total: "6"
course_landing: "Choosing-Statistical-Tests-Course.html"
course_next: "Checking-Assumptions-and-What-Breaks-Them.html"
course_prev: ""
---

=== step === cover
## Choosing the right test

Today let's understand how to pick the right statistical test, using a company that is testing a new way to train its new hires.

A company called NovaTrain runs a 90-day onboarding program for its new hires. It has just tried a new version of that program against its standard one, and a third, hybrid version besides. 60 new hires went through the trial, 20 on each program. Now the company has four separate questions about what happened, and each one needs a test that actually fits it.

That is the real difficulty with testing. There is no shortage of tests: t-tests, chi-squared tests, ANOVA, regression, and a dozen others you may have only half heard of. Pick the wrong one and the answer you get back is worthless, however carefully you compute it.

So instead of memorising a list of test names, this lesson works off three questions you can ask about any comparison. Answer those three honestly, and the right test picks itself.

::widget process-flow {"steps":[{"title":"What is being compared","sub":"one group against a number, two groups, or more than two"},{"title":"What kind of outcome was measured","sub":"a number that varies smoothly, or a count or category"},{"title":"How the data were collected","sub":"the same units measured twice, or independent units"}]}

Those three questions are all this lesson needs. Everything from here on is just asking them, one at a time, about each of NovaTrain's four questions.

=== step === concept
## Three questions decide the test, not the data's name

Those three questions from the diagram are worth spelling out, because every one of NovaTrain's four questions is going to answer them in turn.

The first question is what is being compared. Are you comparing one group against a fixed number, two groups against each other, or three or more groups at once? NovaTrain's first question, whether the new program beats the standard one, compares exactly two groups.

The second question is what kind of outcome was measured. Is it a number that can take any value along a scale, like a score or a time, or is it a count or a category, like pass or fail? NovaTrain's first question measures a performance score, a number. Its third question measures whether a hire passed certification, a category.

The third question is how the data were collected. Did the same people get measured twice, once before and once after something happened to them, or are you looking at two separate, unrelated groups of people? NovaTrain's first question compares 20 different people against another 20 different people, independent groups. Its second question compares the very same 20 people's focus on day 1 against their focus on day 90, the same units, measured twice.

Change the answer to any one of those three questions, and the test that fits changes with it. Compare the same 20 hires at two time points instead of two different groups of 20, and an independent test stops being right, even though what's being measured, focus, hasn't changed at all.

=== step === concept
## An independent two-sample comparison: the day-90 performance score

NovaTrain's first question is the simplest of the four: among its 60 new hires, did the new onboarding program lift day-90 performance scores above the standard program's? Two different groups of hires, and a performance score that is a genuine number: an independent comparison between two groups, on a continuous outcome, exactly the pattern the three questions above pointed to.

Build the 60 hires NovaTrain tracked, and look at the first few rows.

```r
# Build NovaTrain's 60 hires across the three onboarding programs, then look at a few rows
set.seed(101)
program <- factor(rep(c("standard", "new", "hybrid"), each = 20),
                   levels = c("standard", "new", "hybrid"))
experience_years <- round(runif(60, 0, 10), 1)
day1_focus <- round(rnorm(60, mean = 60, sd = 8), 1)
focus_lift <- ifelse(program == "new", 12, ifelse(program == "hybrid", 6, 2))
day90_focus <- round(day1_focus + focus_lift + rnorm(60, 0, 5), 1)
base_perf <- ifelse(program == "standard", 73, ifelse(program == "new", 65, 70))
exp_slope <- ifelse(program == "standard", 0.2, ifelse(program == "new", 2.3, 0.4))
performance_score <- round(base_perf + exp_slope * experience_years + rnorm(60, 0, 6), 1)
pass_prob <- ifelse(program == "standard", 0.55, ifelse(program == "new", 0.85, 0.70))
certified <- factor(ifelse(rbinom(60, 1, pass_prob) == 1, "pass", "fail"))

hires <- data.frame(program, experience_years, day1_focus, day90_focus,
                     performance_score, certified)
head(hires, 4)
#>    program experience_years day1_focus day90_focus performance_score certified
#> 1 standard              3.7       67.2        75.8              70.0      fail
#> 2 standard              0.4       62.2        64.0              74.6      fail
#> 3 standard              7.1       68.1        68.3              69.9      pass
#> 4 standard              6.6       43.4        41.8              78.7      pass
```

Each row is one hire. `program` says which of the three onboarding programs they went through. `experience_years` is how many years of industry experience they already had when they started.

`day1_focus` and `day90_focus` are the same hire's focus score measured on day 1 and on day 90. `performance_score` is their day-90 performance rating, and `certified` says whether they passed the program's certification exam.

Question 1 only needs the standard and new programs, so pull out those 40 hires and compare their performance scores with an independent two-sample t-test.

```r
# Compare day-90 performance between the standard and new programs
standard_vs_new <- hires[hires$program %in% c("standard", "new"), ]
t.test(performance_score ~ program, data = standard_vs_new)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  performance_score by program
#> t = -2.6534, df = 35.576, p-value = 0.01183
#> alternative hypothesis: true difference in means between group standard and group new is not equal to 0
#> 95 percent confidence interval:
#>  -11.62903  -1.55097
#> sample estimates:
#> mean in group standard      mean in group new 
#>                 71.695                 78.285 
```

The standard program's 20 hires averaged 71.695 on performance; the new program's 20 hires averaged 78.285, a 6.59-point gap. `t` is the test statistic, -2.6534: how many standard errors apart those two averages sit, once each group's own spread is accounted for. `df`, 35.576, is not a whole number because R ran Welch's version of the t-test by default, which does not assume the two programs' hires vary by the same amount. And p-value, 0.01183, sits below the usual 0.05 cutoff, so a gap this size is unlikely to come from nothing more than which 20 hires happened to land in which group.

This t-test assumes the performance scores inside each program are reasonably close to a normal, bell-shaped spread. If a handful of hires scored far outside the rest and pulled that assumption out of shape, the Wilcoxon rank-sum test, sometimes called the Mann-Whitney test, compares the same two independent groups without that assumption, working off the ranks of the scores instead of their raw values.

=== step === widget
## What kind of outcome decides which distribution the test statistic follows

Question 1's test statistic, that -2.6534, had to be measured against some known shape to get its p-value out. Which shape depends entirely on the outcome's type, and this widget shows why.

::widget dist-shapes {"dist":"t","df":30}

This opens on the t-distribution at df = 30, the top of this widget's slider and close to the 35.576 degrees of freedom Question 1's test actually used. At that many degrees of freedom the t-distribution has nearly caught up to the dashed standard normal curve behind it, which is why a t-statistic of -2.6534 lands out in a thin enough tail to clear 0.05.

Switch the toggle at the top to chi-squared and set its slider to df = 2. NovaTrain's third question, a categorical outcome compared across three programs rather than two, is going to need exactly that shape: a chi-squared statistic from a three-program comparison gets judged against a chi-squared distribution with 2 degrees of freedom, not a t-shape.

A continuous outcome like a performance score gets compared against a t-distribution, or the normal it approaches once the sample grows. A count or category, like a certification result, gets compared against a chi-squared distribution instead. Same idea, different outcome type, different distribution.

=== step === concept
## A paired comparison: the same hires, before and after

Question 2 is a different shape entirely. NovaTrain wants to know whether the new program's own hires grew more focused over their first 90 days: the same 20 people, measured on day 1 and again on day 90. That is a paired design, the same units measured twice, the third question answered the opposite way from Question 1.

Pull out the new program's 20 hires and compare their two focus scores with a paired t-test.

```r
# Compare the new program's hires' focus on day 1 against day 90
new_program <- hires[hires$program == "new", ]
t.test(new_program$day90_focus, new_program$day1_focus, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  new_program$day90_focus and new_program$day1_focus
#> t = 10.313, df = 19, p-value = 3.199e-09
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>   8.51638 12.85362
#> sample estimates:
#> mean difference 
#>          10.685 
```

A paired t-test does not compare 20 people against a different 20 people. It takes each hire's own day-90 score minus their own day-1 score, 20 differences from 20 people, and tests whether that one column of differences averages to zero. Here it averages to 10.685, meaning focus climbed by about 10.7 points per hire over the 90 days.

`df` is 19 this time, one less than the 20 hires, because a paired test only ever has as many differences as there are pairs. And p-value, 3.199e-09, is about as small as a p-value gets in this lesson: an improvement this consistent across 20 hires is extremely unlikely if the program did nothing to their focus.

If those 20 differences were badly skewed, say a few hires jumped enormously while most barely moved, the Wilcoxon signed-rank test checks the same paired design without assuming the differences follow a normal curve, working off the ranks of the differences instead.

=== step === quiz
## Quick check: paired or independent?

A clinic tracks 24 patients' cholesterol before a 6-week diet change and again after it, the same 24 patients both times. Which kind of comparison is this?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- An independent comparison between two separate groups of patients. ::no
- A paired comparison: the same patients measured twice. ::ok Right. The same 24 patients give the before and after numbers, so this is a paired design, and a paired t-test, or its non-parametric alternative, fits it, not a comparison between two different groups.
- A comparison across more than two groups at once. ::no
- A correlation between two continuous measurements. ::no Look at who was measured, not what was measured. The same 24 patients gave both numbers, before and after one diet change, which is exactly what makes a comparison paired rather than independent, and there is only one outcome here, cholesterol, not two separate measurements being related to each other.

=== step === concept
## More than two groups, a categorical outcome: the certification result

Question 3 changes two of the three answers at once. NovaTrain wants to know whether certification pass rates differ across all three programs, standard, new and hybrid, not just two of them. And the outcome itself is not a number this time, it is a category: pass or fail. Three groups, a categorical outcome: that calls for a chi-squared test of independence.

Count how many hires in each program passed certification and how many failed.

```r
# Count certification pass/fail by program, then test whether program and outcome are related
table(hires$program, hires$certified)
chisq.test(table(hires$program, hires$certified))
#>           
#>            fail pass
#>   standard   12    8
#>   new         4   16
#>   hybrid      5   15
#> 
#> 	Pearson's Chi-squared test
#> 
#> data:  table(hires$program, hires$certified)
#> X-squared = 8.3516, df = 2, p-value = 0.01536
```

Read the table first. 8 of the standard program's 20 hires passed, against 16 of the new program's 20 and 15 of the hybrid's 20. The standard program's pass rate, 40%, looks a lot lower than the other two's 80% and 75%.

The chi-squared test asks whether a gap this size across three groups could plausibly show up if program and certification result had nothing to do with each other. X-squared, 8.3516, measures how far the actual counts in that table sit from the counts you would expect if every program passed hires at the same overall rate. `df` is 2 here, one less than the number of programs. A chi-squared distribution with 2 degrees of freedom cannot fall below zero and leans heavily to the right, and 8.3516 sits far enough into its thin right tail that p-value, 0.01536, says this gap is unlikely enough to call the three programs' pass rates genuinely different.

=== step === widget
## Reading a p-value off the null distribution

That same cutoff-and-tail idea is what turned Question 1's t-statistic into its p-value, and this widget lets you drag the cutoff yourself and watch the shaded area change.

::widget null-distribution {"tails":2,"max":4,"start":2.65,"label":"the day-90 score gap, standardised"}

This opens with the slider at 2.65: Question 1's t-statistic with its negative sign dropped, since a two-sided test only cares about distance from zero, not which program came out ahead. The shaded orange area on both sides is the p-value, the share of this distribution that sits at least as far from zero as 2.65 does.

Drag the slider down toward zero and watch the shaded area grow. The closer a result sits to the middle of a null distribution, the less surprising it is, and the bigger its p-value. Drag it out past 3 and the shaded sliver nearly vanishes: a result that far out almost never happens if the two programs truly perform the same.

This widget approximates the distribution with a standard normal, which is accurate once the degrees of freedom climb past about 30, the way Question 1's 35.576 just did. Check how close that approximation actually is.

```r
# Compare the widget's normal approximation against Question 1's real t-based p-value
z_approx_p <- 2 * (1 - pnorm(2.6534))
round(z_approx_p, 4)
#> [1] 0.008
```

The z-approximation gives 0.008, against the real Welch t-test's 0.01183. Close, but not identical: at 35.576 degrees of freedom the true t-distribution still has slightly fatter tails than the normal the widget uses, so the approximation reports a smaller p-value than the test NovaTrain should actually trust.

=== step === concept
## When no named test fits: two factors at once

Question 4 is different from the first three in a way that no test name actually covers. NovaTrain wants to know whether the performance gap between programs depends on how much prior industry experience a hire already had, that is, whether program and experience interact rather than each acting on performance separately.

None of the tests used so far can hold two things at once this way. A t-test compares two groups. A chi-squared test compares counts across groups.

Neither one can also account for a separate, continuous variable like years of experience, or ask whether that variable changes a group difference's size. What fits this question is a regression model, not a named test, because a model can carry more than one predictor, and their interaction, together.

Fit performance score against program, experience, and the two multiplied together, then read both tables.

```r
# Fit performance against program and experience, including their interaction
interaction_fit <- lm(performance_score ~ program * experience_years, data = hires)
summary(interaction_fit)
anova(interaction_fit)
#> 
#> Call:
#> lm(formula = performance_score ~ program * experience_years, 
#>     data = hires)
#> 
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -14.1372  -2.9937   0.4614   3.3098  15.5403 
#> 
#> Coefficients:
#>                                Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)                     69.6117     2.7486  25.326  < 2e-16 ***
#> programnew                      -3.7637     3.6490  -1.031  0.30693    
#> programhybrid                   -2.8918     3.9277  -0.736  0.46476    
#> experience_years                 0.4085     0.4825   0.847  0.40097    
#> programnew:experience_years      2.0135     0.6281   3.206  0.00226 ** 
#> programhybrid:experience_years   0.8070     0.6959   1.160  0.25126    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 5.475 on 54 degrees of freedom
#> Multiple R-squared:  0.524,	Adjusted R-squared:  0.4799 
#> F-statistic: 11.89 on 5 and 54 DF,  p-value: 8.899e-08
#> 
#> Analysis of Variance Table
#> 
#> Response: performance_score
#>                          Df  Sum Sq Mean Sq F value    Pr(>F)    
#> program                   2  495.91  247.96  8.2721 0.0007348 ***
#> experience_years          1  964.94  964.94 32.1916 5.656e-07 ***
#> program:experience_years  2  320.67  160.33  5.3489 0.0075966 ** 
#> Residuals                54 1618.65   29.98                      
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The `anova()` table tests each piece on its own: `program` accounts for a real chunk of the variation in performance (F = 8.2721, p = 0.0007348), and so does `experience_years` (F = 32.1916, p barely above zero). But the row Question 4 is actually about is the last one, `program:experience_years`, the interaction term. Its F-value, 5.3489, and its p-value, 0.0075966, test whether the size of the experience effect genuinely differs from one program to another, not whether either variable matters by itself. That p-value clears the usual 0.05 cutoff, so the answer to Question 4 is yes.

Now look at what the coefficients in the `summary()` table say about how. At zero years of experience, the model actually gives the new program a slightly lower score than standard, 65.85 against 69.61, reading the intercept together with the `programnew` row (though that particular gap's own p-value, 0.30693, is not reliable on hires with so little experience). But each added year closes that gap and then reverses it, because the new program's slope on experience is 2.0135 steeper than standard's. That is exactly the kind of pattern only a regression model can show: comparing the two programs' overall averages, the way Question 1 did, blurs together hires who started with very different amounts of experience, and misses the fact that the new program's advantage is earned through experience rather than handed out flat.

=== step === quiz
## Quick check: name the test, or call it a model

| Question | Design | Outcome | Test |
|---|---|---|---|
| 1. Standard vs new performance | independent, 2 groups | continuous | independent t-test |
| 2. New program's focus, day 1 vs day 90 | paired, same hires twice | continuous | paired t-test |
| 3. Certification pass rate, 3 programs | independent, 3+ groups | categorical | chi-squared test of independence |
| 4. Performance by program and experience | two factors at once | continuous | regression model, interaction read with an F-test |

Every p-value in that table answers the same kind of question: how far the actual statistic sits out in the tail of its own null distribution, a t-distribution for the two t-tests, a chi-squared distribution for Question 3, and an F-distribution for the interaction term in Question 4.

A retailer wants to know whether a customer's total spend depends on both which store they shopped at and how many loyalty points they already held. Which tool actually fits that question?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- An independent two-sample t-test. ::no
- A paired t-test. ::no
- A chi-squared test of independence. ::no Store and loyalty points are not two categories crossed in a table, and this is not one group against another or the same customers measured twice. Spend depends on which store AND how many loyalty points a customer held, two factors acting together, and only a regression model can carry two predictors and ask about their combined effect in one go.
- A regression model, because store and loyalty points both act on spend at once. ::ok Right. One categorical factor, store, and one continuous factor, loyalty points, both potentially affecting spend together: exactly the pattern from Question 4. No single named test covers two factors at once, so a model is the honest tool.

=== step === tryit
## Your turn: pick the test and run it

Try the whole process yourself now, start to finish, on a brand new question. Two of a retail chain's stores, Store A and Store B, each surveyed 15 of their customers on satisfaction, on a scale out of 10.

```r
# Two stores' customer satisfaction ratings out of 10, from two independent groups of customers
set.seed(55)
store_a <- round(rnorm(15, mean = 7.6, sd = 0.9), 1)
store_b <- round(rnorm(15, mean = 7.1, sd = 1.0), 1)
store_a
#>  [1] 7.7 6.0 7.7 6.6 7.6 8.7 7.1 7.5 7.9 7.8 7.6 6.8 5.7 7.3 7.0
store_b
#>  [1] 6.7 9.5 8.2 7.4 8.1 5.6 8.6 7.9 8.2 7.8 8.1 6.4 8.5 5.5 7.4
```

15 customers rated Store A, a completely different 15 rated Store B, and each rating is a single continuous number. Ask the same three questions this lesson keeps using, then write the one line that compares them.

```r
# store_a and store_b are two independent groups of customers, with one
# continuous rating each. Call the test that fits, comparing store_a
# against store_b. One line. Press Check when you have it.
```
::check {"regex": "t\\.test[(]\\s*store_a\\s*,\\s*store_b", "gate": true, "difficulty": "intermediate", "ok": "Right. Two independent groups of customers, one continuous rating each, no repeated measurements and no more than two groups: exactly the independent two-sample t-test from Question 1.", "no": "15 customers at Store A and a different 15 at Store B is an independent design, not a paired one, and there are only two groups, not three or more, so a chi-squared test or anything built for paired data would not fit. Call t.test(store_a, store_b)."}
::solution
```r
# Compare the two stores' ratings with an independent two-sample t-test
t.test(store_a, store_b)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  store_a and store_b
#> t = -0.93338, df = 24.765, p-value = 0.3596
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -1.0478187  0.3944854
#> sample estimates:
#> mean of x mean of y 
#>  7.266667  7.593333 
```

p-value here is 0.3596, nowhere near 0.05, so these two stores' ratings do not look genuinely different. Whatever gap shows up between 7.267 and 7.593 is well within what 15-customer samples would produce even if both stores satisfied customers equally.

=== step === concept
## References

- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()`, the independent and paired tests run in Questions 1 and 2.
- [Wilcoxon Rank Sum and Signed Rank Tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html) - R Core Team, the documentation for `wilcox.test()`, the alternatives named in Questions 1 and 2.
- [Pearson's Chi-squared Test for Count Data](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/chisq.test.html) - R Core Team, the documentation for `chisq.test()`, used in Question 3.
- [Choosing the Correct Statistical Test](https://stats.oarc.ucla.edu/other/mult-pkg/whatstat/) - UCLA Office of Advanced Research Computing, a public worked reference for the same screening logic this lesson teaches.
- [An Introduction to Statistical Learning](https://www.statlearning.com/) - James, G., Witten, D., Hastie, T. and Tibshirani, R., the regression model used in Question 4.

=== step === complete
## Three questions, every time

Four different questions came up about NovaTrain's 60 hires, and each one turned on the same three questions: what is being compared, what kind of outcome was measured, and how the data were collected.

- Compare two independent groups on a continuous outcome, and an independent two-sample t-test fits: Question 1, standard against new, performance score.
- Compare the same units measured twice, and a paired t-test fits instead: Question 2, the new program's own hires on day 1 against day 90.
- Compare three or more groups on a categorical outcome, and a chi-squared test of independence fits: Question 3, certification pass rate across all three programs.
- Ask whether two factors act together, and no single named test covers it: Question 4 needed a regression model, with its interaction term read from an F-test.

Ask those three questions about any new comparison before reaching for a test's name, and the right tool follows from the answers rather than from a guess.

Fitting the right test is only half the job. The next lesson looks at what happens when a test's own assumptions, like that bell-shaped spread a t-test expects, do not actually hold up.
