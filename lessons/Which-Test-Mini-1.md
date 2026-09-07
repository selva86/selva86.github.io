---
title: "Which statistical test to use? A 5-question decision flowchart"
slug: "Which-Test-Mini-1"
description: "Five plain questions about outcome type, group count, pairing and normality lead you to the right R statistical test, worked through on one real dataset."
keywords: "which statistical test to use, statistical test decision flowchart, choosing a statistical test in R, Kruskal-Wallis test in R, parametric vs non-parametric test, hypothesis test selection"
mathjax: false
webr: true
date: "2026-09-07"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "1"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.8"
lesson_access: "windowed"
catalog_blurb: "Answer five plain questions about your data and find the right R test."
---

=== step === cover
## Which statistical test to use? A 5-question decision flowchart

Today, let's build a plain decision flowchart that tells you exactly which statistical test to reach for, no memorising required.

Here is the setup. A retail store hands you its last 75 orders from three branches, Downtown, Mall and Airport, 25 orders from each. Every order carries two things: the dollar value of what was bought, and how the customer paid, card or cash. The question on the table is simple: does one branch actually sell more than the others, or is what you are seeing just noise?

Dozens of tests could plausibly apply here, a t-test, an ANOVA, a chi-square test, and a handful you may have only half heard of. Pick the wrong one and the answer you hand back is worthless, no matter how carefully you ran the numbers.

Here is a way out of that guesswork: work through five questions about the data, in order, and let each one rule out everything that no longer fits.

1. What kind of outcome are you measuring, continuous or categorical?
2. How many groups are you comparing?
3. Are those groups paired or independent?
4. Is the data close to a normal distribution?
5. What does all of that add up to, and how big is the difference really?

Once all five are answered, only one test survives every round of elimination. Here is the shape of that decision, narrowed down to a few of the tests you will meet along the way.

::widget tree-diagram {"root": "Continuous outcome?", "l": "Data close to normal?", "r": "2 independent groups?", "leaves": ["Parametric test (t-test or ANOVA)", "Non-parametric test (Kruskal-Wallis)", "Chi-square test", "Fisher exact test"]}

The store's order values are continuous, so they start down that left branch. Which leaf they land on, and why, is what the next few questions work out.

=== step === concept
## What kind of outcome are you measuring?

Every one of the five questions starts here, with the outcome, the thing you are actually measuring. Get this one wrong and every question after it gets answered for the wrong test entirely.

An outcome falls into one of two kinds. A continuous outcome is a numeric measurement, something that could in principle take any value in a range: order value in dollars, height in centimetres, a temperature reading. A categorical outcome is a label that sorts an observation into one of a small number of groups: card or cash, pass or fail, red or blue.

The store's data has one of each. Order value is continuous. Payment method, card or cash, is categorical. Create the data once, then check both columns with class(), the function R uses to report what kind of thing a column holds.

```r
# Create the store's order data, then check the type of two of its columns
set.seed(707)
branch <- factor(rep(c("Downtown", "Mall", "Airport"), each = 25),
                  levels = c("Downtown", "Mall", "Airport"))
order_value <- c(
  rlnorm(25, meanlog = log(45), sdlog = 0.45),
  rlnorm(25, meanlog = log(58), sdlog = 0.45),
  rlnorm(25, meanlog = log(72), sdlog = 0.45)
)
payment_method <- sample(c("card", "cash"), 75, replace = TRUE)
orders <- data.frame(branch, order_value, payment_method)

class(orders$order_value)
#> [1] "numeric"
class(orders$payment_method)
#> [1] "character"
```

class() reports "numeric" for order_value and "character" for payment_method. That is R confirming what you already knew from looking at the two columns: one is a measurement, the other is a label.

Why does this matter so much? Because it decides the entire family of test you reach for next. A continuous outcome points you toward t-tests, ANOVA, and their non-parametric counterparts. A categorical outcome points you toward chi-square tests instead, a different family with its own rules. The store's question, does order value differ by branch, is about a continuous outcome, so the comparison follows that branch from here on.

=== step === concept
## How many groups are you comparing?

Once the outcome type is settled, the next question is how many groups you are comparing. That decides whether you need a one-sample test, a two-sample test, or something built for three or more groups at once.

One group means comparing a single sample against a fixed, known value, for instance checking whether the store's average order value differs from a company-wide target. Two groups means comparing two samples directly, say Downtown against Mall alone. Three or more groups means comparing several samples at the same time, which is exactly the store's situation: Downtown, Mall and Airport, all at once.

```r
# Count how many branches are in the data, and how many orders each has
table(orders$branch)
#>
#> Downtown     Mall  Airport 
#>       25       25       25 
length(unique(orders$branch))
#> [1] 3
```

table() counts how many orders fall into each branch and confirms the design is balanced, 25 apiece. length(unique(...)) counts the distinct branches themselves: 3.

[TIP]
Never compare 3 or more groups by running separate two-sample tests on every pair. Three branches means three pairwise comparisons, and each one carries its own 5% chance of a false alarm. Run all three and the real chance of at least one false alarm climbs to about 14%. A test built for 3 or more groups at once controls that error rate instead.

With 3 groups on the table, a two-sample test is already out of the running. The branches' comparison needs a test from the multi-group family.

=== step === concept
## Are your groups paired or independent?

::prose-only the distinction is explained through the same branches story with a hypothetical extension, no new data or chart needed

There are two ways two or more groups can relate to each other: paired or independent. Which one you have changes what a test is allowed to assume about the data.

Groups are paired, also called dependent, when each observation in one group has a specific matching observation in another. The classic case is the same person measured twice, once before a change and once after. Every "before" has exactly one "after" that belongs to it, and nothing else.

Groups are independent when the observations in each group come from different subjects entirely, with no such matching. That is the store's situation. The 75 orders come from different customers walking into different branches, so nobody's Downtown order is paired with anybody's Mall order.

To see the contrast, picture a different version of this same store. Suppose instead of 75 different customers, the same 25 regular customers visited their usual branch twice, once before a renovation and once after. Now each "before" order has a specific "after" order that belongs to the same person, and that would be a paired design, needing the paired version of a test instead of the independent one.

The store's actual data has no such structure: different customers, no matching between branches. So the branches' comparison is independent.

=== step === concept
## Is your data close to normal?

The fourth question decides which family of test you get to use inside "3 or more independent groups": one built assuming the data follows something close to a normal, bell-shaped distribution, or one that makes no such assumption at all.

Why does that matter? Tests like the one-way ANOVA compute their p-values using the mathematics of the normal distribution. If the actual data departs a long way from that shape, those p-values are no longer valid, so you check before you pick.

The standard formal check is the Shapiro-Wilk test, run with shapiro.test(). It tests whether your data could plausibly have come from a normal distribution. A small p-value, conventionally below 0.05, means the data departs from normal by more than chance alone would explain.

Look at the shape of the store's order values first.

::widget chart-plotter {"data": [{"x":25.3},{"x":34.1},{"x":61.6},{"x":75.1},{"x":31.1},{"x":28.2},{"x":114.1},{"x":54.9},{"x":26.4},{"x":100.7},{"x":54.3},{"x":74.5},{"x":48.5},{"x":30.1},{"x":32.6},{"x":26.7},{"x":88.6},{"x":53.5},{"x":46.4},{"x":72.6},{"x":34.2},{"x":29.3},{"x":45.8},{"x":47.5},{"x":63.8},{"x":160},{"x":53.8},{"x":108},{"x":46.4},{"x":71.5},{"x":76.1},{"x":102.3},{"x":88.4},{"x":46.1},{"x":60.9},{"x":81},{"x":50.2},{"x":50.3},{"x":65.7},{"x":56.7},{"x":35.7},{"x":73.2},{"x":62.6},{"x":69.5},{"x":37.4},{"x":52.4},{"x":147.4},{"x":63.4},{"x":91.1},{"x":46.4},{"x":78.3},{"x":79.9},{"x":27.9},{"x":68.1},{"x":62.7},{"x":51.3},{"x":45.2},{"x":116.8},{"x":48},{"x":53.5},{"x":231.5},{"x":66},{"x":67},{"x":50.6},{"x":53.9},{"x":60.5},{"x":109.2},{"x":69.3},{"x":59.7},{"x":48.5},{"x":66.7},{"x":124.6},{"x":149.9},{"x":93.6},{"x":96.7}], "geoms": ["histogram"], "x": "order_value"}

The bars pile up on the left and thin into a long tail stretching out to the right, toward a handful of large orders. That shape has a name: right-skewed. A normal distribution is symmetric, so a shape like this is already a warning sign.

Now run the formal test on the same values.

```r
# Test whether order value is close to a normal distribution
shapiro.test(orders$order_value)
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  orders$order_value
#> W = 0.84098, p-value = 1.674e-07
#>
```

The p-value, 1.674e-07, is nowhere near 0.05, it is far smaller. That rejects normality about as firmly as a Shapiro-Wilk test can. The histogram's long right tail and the test's tiny p-value are telling you the same thing two different ways.

So the branches' order values fail the normality check. That rules out the parametric option, one-way ANOVA, for this comparison and points to its non-parametric counterpart instead.

=== step === quiz
## Quick check: parametric or non-parametric?

A shapiro.test() on a different sample comes back with p = 0.002. What should you conclude?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The groups are significantly different, since the p-value is this small. ::no
- The data departs from a normal distribution, which points toward a non-parametric test. ::ok Right. shapiro.test() only ever tests one thing, whether a sample could plausibly be normal. A p-value this small rejects that, and it has nothing to say about whether groups differ or how big any difference is.
- The sample is too small for a Shapiro-Wilk result to be trusted, so ignore it. ::no A Shapiro-Wilk p-value tests normality only, never how different the groups are, and a sample size in the dozens is easily large enough for a valid result. It is the shape of the data that decides parametric or non-parametric, not the sample size.

=== step === concept
## Reading the decision map: from four answers to one test

Four questions down: the outcome is continuous, there are 3 or more groups, the groups are independent, and the data is not close to normal. Put those four answers together and exactly one test is left.

Statisticians keep a map for exactly this, matching every combination of answers to one named test, the R function that runs it, and the right way to measure how big the effect is. Narrowed down to just the rows that fit a continuous outcome with 3 or more independent groups, it looks like this.

```r
# Print the two rows of the decision map that fit a continuous outcome with 3+ independent groups
decision_map <- data.frame(
  Outcome = c("Continuous", "Continuous"),
  Groups = c("3+", "3+"),
  Paired = c("No", "No"),
  Normal = c("Yes", "No"),
  Test = c("One-way ANOVA", "Kruskal-Wallis"),
  R_function = c("aov(y ~ g)", "kruskal.test(y ~ g)"),
  Effect_size = c("Eta-squared", "Epsilon-squared")
)
print(decision_map)
#>      Outcome Groups Paired Normal           Test          R_function
#> 1 Continuous     3+     No    Yes  One-way ANOVA          aov(y ~ g)
#> 2 Continuous     3+     No     No Kruskal-Wallis kruskal.test(y ~ g)
#>       Effect_size
#> 1     Eta-squared
#> 2 Epsilon-squared
```

The branches' answers, continuous, 3+, independent, not normal, land on the second row: Kruskal-Wallis, run with kruskal.test(), measured with an effect size called epsilon-squared.

Kruskal-Wallis is the non-parametric version of a one-way ANOVA. Instead of comparing means directly the way ANOVA does, it converts every order value to its rank across the whole dataset, smallest to largest, and compares the average rank in each branch. That avoids the normality assumption entirely, since ranks do not depend on the shape of the original values.

=== step === concept
## Running the Kruskal-Wallis test on the branch data

Run the test the decision map pointed to, comparing order value across the three branches.

```r
# Run the Kruskal-Wallis test comparing order value across the three branches
kw_result <- kruskal.test(order_value ~ branch, data = orders)
kw_result
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  order_value by branch
#> Kruskal-Wallis chi-squared = 9.8285, df = 2, p-value = 0.007341
#>
```

The formula order_value ~ branch reads as "order value explained by branch," the same shape of formula you would hand to aov() or lm(). kruskal.test() returns a chi-squared statistic (9.8285), its degrees of freedom (2, one less than the 3 branches), and a p-value (0.007341).

That p-value sits well under the usual 0.05 cutoff, so you reject the idea that the three branches all draw from the same distribution of order values. Branch is associated with how much a customer spends: Downtown's orders average $52, Mall's $72, and Airport's $79.

=== step === widget
## A significant p-value is not the same as a big difference

A p-value of 0.007 tells you the branch differences are unlikely to be pure noise. It says nothing about how large that difference actually is. For that you need an effect size, a separate number that measures the size of an effect on a scale that does not depend on how many orders you collected.

Start with the general idea a p-value is built on. Every hypothesis test assumes nothing is going on, then measures how far out your actual test statistic sits from what that assumption would typically produce. The further out it sits, the smaller the slice of area left beyond it in the tail, and that tail area is the p-value.

::widget null-distribution {"tails": 1, "max": 4, "start": 2.4, "label": "observed statistic"}

Drag the slider outward, away from zero, and watch the shaded tail shrink. A statistic further from the centre leaves less room beyond it, so the p-value it produces gets smaller. Pull it back toward zero and the shaded slice grows again. Further out means a smaller tail means a smaller p-value, and that relationship is what every one of these tests, including the Kruskal-Wallis test you just ran, is built on.

None of that says how big the branch differences are in dollars. For that, compute epsilon-squared, the effect size the decision map named for Kruskal-Wallis. It is built from three numbers you already have, the test statistic H, the number of groups k, and the number of orders n, as epsilon-squared = (H - k + 1) / (n - k).

```r
# Compute epsilon-squared: how much of the order-value variation the branch explains
H <- kw_result$statistic
k <- 3
n <- nrow(orders)
epsilon_sq <- (H - k + 1) / (n - k)
cat("Epsilon-squared:", round(epsilon_sq, 3), "\n")
#> Epsilon-squared: 0.109
```

[KEY INSIGHT]
Epsilon-squared runs from 0 to 1, and the usual benchmarks for this family of effect size call 0.01 small, 0.06 medium and 0.14 large. At 0.109, branch sits between medium and large, closer to large: which branch a customer walks into explains a real, though not overwhelming, share of how much they spend. The p-value told you the difference is probably real. Epsilon-squared told you how much it actually matters, and a study needs both.

=== step === quiz
## Quick check: apply the flowchart to a new scenario

A different team ran an experiment on two independent groups of users, variant A and variant B. The outcome is categorical: each user either completed onboarding, a pass, or did not, a fail. Which test applies here, and does a small p-value from it automatically mean the two variants differ by a lot in practice?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A chi-square test on the pass and fail counts, and no, a significant result would not by itself mean the difference is large, that still needs an effect size. ::ok Right on both counts. Pass or fail is categorical with two independent groups, exactly what a chi-square test is for. And significance only ever says a difference is unlikely to be noise, never how big it is, the same distinction epsilon-squared drew for the branches.
- A two-sample t-test, since a t-test can compare any two groups. ::no
- A chi-square test, and yes, since the result is significant, the difference must be large in practice. ::no
- A paired test, since the same experiment design is being run on both groups. ::no A t-test needs a continuous outcome, and pass or fail is categorical, so that option is out. "Paired" describes matched subjects across groups, not "the same design run twice," so two independent groups of users are not paired. And a small p-value only ever says a difference is unlikely to be chance, never how large it is, you would still need an effect size like Cramer's V to answer that.

=== step === tryit
## Your turn: pick and run the right test

One more scenario. A company runs two independent support desks, A and B, and measures each caller's satisfaction score on a continuous scale. Each desk has twenty ratings, and both look roughly normal.

```r
# Two independent groups: satisfaction scores at two support desks, roughly normal
set.seed(55)
desk_a <- rnorm(20, mean = 82, sd = 6)
desk_b <- rnorm(20, mean = 78, sd = 6)
```

A continuous outcome, two independent groups, roughly normal: that combination calls for a two-sample t-test, the parametric option for exactly two groups. Complete the line below to run it on desk_a and desk_b.

```r
# Your turn: run the correct test for two independent, roughly normal groups

```
::check {"regex": "^(?![\\s\\S]*paired\\s*=\\s*TRUE)[\\s\\S]*t\\.test[(]\\s*desk_a\\s*,\\s*desk_b", "gate": true, "difficulty": "intermediate", "ok": "Right: t.test(desk_a, desk_b) is the two-sample t-test for two independent, roughly normal groups. Its p-value here comes out well above 0.05, so this pair of desks shows no evidence of a real difference.", "no": "Two continuous, independent, roughly normal groups call for t.test(desk_a, desk_b), with no paired argument at all, since these are two different desks, not the same one measured twice."}
::solution
```r
# Run the two-sample t-test on the two desks
t.test(desk_a, desk_b)
#>
#> 	Welch Two Sample t-test
#>
#> data:  desk_a and desk_b
#> t = 1.348, df = 37.74, p-value = 0.1857
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -1.260375  6.280710
#> sample estimates:
#> mean of x mean of y 
#>  81.64775  79.13758 
#>
```

This time the p-value, 0.1857, sits well above 0.05. Desk A's average score does look a bit higher, 81.6 against 79.1, but the correct test finds no strong evidence the two desks really differ, a gap this size is well within what 20 ratings each could produce by chance. Picking the right test does not guarantee a significant result, and that is exactly the point: the test tells you what the data can and cannot support.

=== step === concept
## References

- [Discovering Statistics Using R](https://us.sagepub.com/en-us/nam/discovering-statistics-using-r/book236067) - Field, Miles and Field (2012), Sage Publications.
- [shapiro.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/shapiro.test.html) and [kruskal.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kruskal.test.html) - R Core Team, the stats package documentation, CRAN R manuals.
- [Statistical Power Analysis for the Behavioral Sciences](https://www.routledge.com/Statistical-Power-Analysis-for-the-Behavioral-Sciences/Cohen/p/book/9780805802832) - Cohen (1988, 2nd ed.), Routledge.
- [The need to report effect size estimates revisited](https://tss.awf.poznan.pl/The-need-to-report-effect-size-estimates-revisited-An-overview-of-some-recommended,188960,0,2.html) - Tomczak and Tomczak (2014), Trends in Sport Sciences, 21(1), 19-25.

=== step === complete
## The five questions, recapped

Five questions, one flowchart, and now a checklist you can reuse on the next dataset that lands on your desk.

1. What kind of outcome are you measuring, continuous or categorical? Checked with class().
2. How many groups are you comparing? Checked with table() and length(unique(...)).
3. Are the groups paired or independent? Decided by how the data was collected, not by looking at the numbers.
4. Is the data close to normal? Checked with shapiro.test() and the shape of a histogram.
5. What does all of that point to, and how big is the effect? Read the test off a decision map, then measure its size with an effect size, never the p-value alone.

For the store's three branches: continuous outcome, 3 independent groups, not normal, so Kruskal-Wallis. kruskal.test() came back with p = 0.007341, evidence the branches are not all alike. Epsilon-squared came out at 0.109, branch explaining a real but middling share of how much a customer spends, between a medium and a large effect by the usual benchmarks.

Run the same five questions again on whatever you are staring at right now, and the right test falls out the same way it just did for the branches.
