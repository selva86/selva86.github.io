---
title: "Which statistical test to use? A 5-question decision flowchart"
slug: "Which-Test-Mini-1"
description: "Five plain questions about your data pick the right statistical test. Run 90 coffee shop orders through them in R and land on the one test that really fits."
keywords: "which statistical test to use, statistical test decision flowchart, choosing a statistical test in R, kruskal test in R, paired vs independent t-test, shapiro test normality, effect size"
mathjax: false
webr: true
date: "2026-09-05"
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
catalog_blurb: "Five questions about your data that pick the right test."
---

=== step === cover
## Which statistical test to use? A 5-question decision flowchart

Today we will work out which statistical test a dataset needs, by asking the data five questions and following the answers.

Here is the dataset. A small coffee chain runs three branches, and we have 30 completed orders from each one. The average order comes to $8.16 at Central, $10.56 at Riverside and $9.87 at Airport.

Riverside is ahead by $2.40. But 90 orders is not many, and averages move around on their own even when nothing is different, so the question is whether that gap is bigger than 90 orders could have produced by chance.

There is a test that answers exactly that. The stats package that ships with R holds a long list of other tests too, each answering something slightly different, and picking one of those gives you a p-value for a question you never asked.

The five questions below cut that list down to one. Every one of them is about the data itself and not about coffee, so the same five work on whatever you bring them.

::widget process-flow {"steps": [{"title": "What kind of outcome", "sub": "a measurement on a scale, or a label"}, {"title": "How many groups", "sub": "one, two, or three and more"}, {"title": "Are the numbers linked", "sub": "same customers measured twice, or different ones"}, {"title": "Is each group roughly normal", "sub": "a shape check on every group"}, {"title": "How big is the difference", "sub": "an effect size beside the p-value"}]}

We will put all five to the coffee chain's orders, one question at a time, and see which test the answers leave us with.

=== step === concept
## The order data, and what a p-value tells you

We need the 90 orders in front of us before we can ask anything about them.

Each branch records the value of every completed order in dollars. The code below draws 30 of them per branch and stacks all 90 into one data frame, with a branch label beside each value.

```r
# Build 90 completed orders, 30 from each branch, and summarise their values
set.seed(21)
central   <- round(rnorm(30, 8.2, 1.5), 2)
riverside <- round(rnorm(30, 10.0, 1.6), 2)
airport   <- round(6.5 + rexp(30, 1/3.2), 2)

orders <- data.frame(
  branch = factor(rep(c("Central", "Riverside", "Airport"), each = 30),
                  levels = c("Central", "Riverside", "Airport")),
  value  = c(central, riverside, airport)
)

data.frame(
  branch       = levels(orders$branch),
  orders       = as.vector(table(orders$branch)),
  mean_value   = round(as.vector(tapply(orders$value, orders$branch, mean)), 2),
  median_value = round(as.vector(tapply(orders$value, orders$branch, median)), 2)
)
#>      branch orders mean_value median_value
#> 1   Central     30       8.16         8.28
#> 2 Riverside     30      10.56        10.23
#> 3   Airport     30       9.87         8.48
```

`rnorm(30, 8.2, 1.5)` draws 30 values centred on 8.2, and `rexp()` draws values that bunch up at the low end with a few large ones trailing off to the right, which is the shape we want Airport to have. `set.seed(21)` fixes those draws so your numbers match mine.

Riverside takes $2.40 more per order than Central. Airport sits between the two at $9.87, but look at its median: $8.48, more than a dollar below its own mean. A mean sitting well above the median is the sign of a few large values pulling it up.

A statistical test takes a gap like this and gives back a p-value, which is how often a gap this big would turn up if the three branches were really alike. Small means rarely. Most people treat 0.05 as the line, and below it they stop explaining the gap as chance.

So the p-value is the number we are after. Which test produces it comes down to four properties of the data, and the questions ahead read them off one at a time.

=== step === concept
## Question 1: what kind of outcome are you measuring?

The outcome is the thing you are measuring and want to explain. Here it is the value of an order. Get this question wrong and every later answer is wasted, because the two kinds of outcome are served by two separate families of tests.

An outcome is continuous when it is a measurement on a scale, so that the distance between two values means something: $8.16 and $10.56 are $2.40 apart. An outcome is categorical when it is a label that sorts each row into a group, like whether a pastry went into the order, yes or no. You can count labels, but you cannot average them.

`class()` tells you which one you have, and `str()` shows the type of every column at once.

```r
# Check the type of the outcome column, and of every column in the data
class(orders$value)
#> [1] "numeric"

str(orders)
#> 'data.frame':	90 obs. of  2 variables:
#>  $ branch: Factor w/ 3 levels "Central","Riverside",..: 1 1 1 1 1 1 1 1 1 1 ...
#>  $ value : num  9.39 8.98 10.82 6.29 11.5 ...
```

`value` comes back as `num`, so our outcome is continuous. That puts us in the family of tests built on averages and ranks, where `t.test()` and `aov()` live.

Had we been asking about pastries instead, the outcome would have been a label per order and `class()` would have returned `"character"` or `"factor"`. That is the other family, where `chisq.test()` and `fisher.test()` compare counts in a table.

One question answered, four to go.

=== step === concept
## Question 2: how many groups are you comparing?

Count the groups you want to compare. One group means you are holding it against a fixed reference value, like asking whether a branch beats the $9 average the chain budgets for. Two groups means a test that compares them directly. Three or more groups means a single test that looks at all of them together, and that last case is where people slip.

```r
# Count the orders in each branch
table(orders$branch)
#>
#>   Central Riverside   Airport
#>        30        30        30
```

That is three branches with 30 orders each, so we are in the three-or-more case.

The tempting alternative is to compare the branches two at a time with a tool you already know. Three branches make three pairs, so that is three t-tests.

```r
# Run a separate t-test on each of the three pairs of branches
pairs <- list(c("Central", "Riverside"), c("Central", "Airport"), c("Riverside", "Airport"))

pair_p <- sapply(pairs, function(p) {
  a <- orders$value[orders$branch == p[1]]
  b <- orders$value[orders$branch == p[2]]
  t.test(a, b)$p.value
})

data.frame(
  comparison = c("Central vs Riverside", "Central vs Airport", "Riverside vs Airport"),
  p_value    = format(signif(pair_p, 3), scientific = FALSE, drop0trailing = TRUE)
)
#>             comparison     p_value
#> 1 Central vs Riverside 0.000000277
#> 2   Central vs Airport      0.0233
#> 3 Riverside vs Airport       0.354
```

Two of the three land under 0.05, and it reads like a clean result: Riverside beats Central, Airport beats Central, and the top two are too close to call.

The trouble is that we asked one question and answered it three times, then kept whichever answers came back small. Every extra test is another chance for luck alone to give you something under 0.05, and those chances pile up.

=== step === widget
## Why three t-tests is not the same as one test

Setting the threshold at 0.05 is an agreement about how often you are willing to be wrong. When there really is no difference, a test at 0.05 still reports one 5 times in 100. That is the false-positive rate you signed up for, and for a single test it is exactly 5%.

Run three tests and the question changes shape. You are no longer asking whether one test is wrong, you are asking whether any of the three is wrong. Each one is right 95% of the time, so all three are right 0.95^3 of the time, which is 0.857, and the chance that at least one is a false positive is 1 - 0.857, or 14.3%.

The widget below runs 4,000 simulated studies in which nothing is different anywhere, so every result it counts as significant is a false positive. The slider is the number of tests in one study, and each of those tests is an independent shot at a false positive. Read k = 3 as the three branch-pair comparisons we just ran, which share data and so are not quite independent, but pile up the same way.

::widget multiplicity-sim {"kStart": 3, "kMax": 12, "alpha": 0.05, "nStudies": 4000, "corrections": ["none", "bonferroni"]}

At k = 3 the simulation reports 14.4% of studies with at least one false positive, right on the 14.3% the arithmetic predicts. Drag k out to 12 and it climbs to 45.4%. Measure a dozen things on one dataset and almost half the time one of them will look significant when nothing is.

Press Bonferroni and the curve flattens back to about 5%. Bonferroni moves the bar for each test to 0.05 / 3 = 0.017 instead of 0.05, so the three tests together carry the 5% risk you meant to take. It is not free: a stricter bar also makes a real difference harder to catch.

There is a cleaner option when the three comparisons are really one question. Ask that question once, with one test across all three branches, and there is no family of results to correct in the first place.

=== step === quiz
## Quick check: three branches, 90 different customers

::prose-only a gated quiz on the false-positive arithmetic the simulation just drew

The chain wants one answer about its three branches, and the 90 orders behind it came from 90 different customers.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Run a paired test that matches each Central order to a Riverside order, since the branches belong to one chain. ::no
- Run one test across all three branches at once. ::ok Yes. One question gets one test. All three branches go into a single comparison, there is no set of results to sift through afterwards, and the 5% risk stays 5%.
- Pick the two branches whose averages sit furthest apart and t-test those two. ::no
- Run a t-test on each pair of branches and report the ones that come in under 0.05. ::no Three tests for one question is the trap. Each test is wrong 5% of the time when nothing is different, so across three the chance of at least one false positive is 1 - 0.95^3, which is 14.3%. Keeping only the small ones makes it worse still, because you are choosing your results after seeing them.

=== step === concept
## Question 3: are the numbers linked, or from different people?

Two groups of numbers are independent when nothing connects a particular value in one group to a particular value in the other. Our 90 orders came from 90 different customers, so there is no sense in which the third Central order goes with the third Riverside order. They are independent.

Numbers are paired when each value in one group belongs with exactly one value in the other, usually because the same person, shop or machine was measured twice. The chain has data like that as well. When the app added a re-order button, 12 Central regulars had their order value recorded in the week before and again in the week after.

```r
# Record 12 regulars the week before and the week after the re-order button
set.seed(8)
before <- round(rnorm(12, 8.4, 1.6), 2)
after  <- round(before + rnorm(12, 0.85, 0.45), 2)

regulars <- data.frame(before = before,
                       after  = after,
                       gain   = round(after - before, 2))
regulars
#>    before after gain
#> 1    8.26  9.30 1.04
#> 2    9.74 10.01 0.27
#> 3    7.66  8.54 0.88
#> 4    7.52  8.00 0.48
#> 5    9.58 11.11 1.53
#> 6    8.23  8.96 0.73
#> 7    8.13  9.68 1.55
#> 8    6.66  7.40 0.74
#> 9    3.58  5.01 1.43
#> 10   7.45  8.30 0.85
#> 11   7.18  7.85 0.67
#> 12   8.87  9.73 0.86

round(c(before_mean = mean(before), after_mean = mean(after),
        mean_gain = mean(after - before)), 2)
#> before_mean  after_mean   mean_gain
#>        7.74        8.66        0.92
```

Every row is one customer, and every one of the 12 went up. The gains run from 27 cents to $1.55 and average 92 cents.

Now watch what the pairing answer is worth. The same 24 numbers go into two tests. The first keeps each customer matched with themselves.

```r
# Test the 24 numbers as 12 matched pairs
t.test(after, before, paired = TRUE)
#>
#>	Paired t-test
#>
#> data:  after and before
#> t = 7.8698, df = 11, p-value = 7.633e-06
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  0.6620976 1.1762357
#> sample estimates:
#> mean difference
#>       0.9191667
```

The p-value is 7.633e-06, which is R shorthand for 0.0000076. A gain that consistent almost never comes out of chance.

The second test throws the pairing away. It treats the 12 before values and the 12 after values as 24 unrelated numbers, exactly the way it would treat 12 Central orders against 12 Riverside orders.

```r
# Test the same 24 numbers as two unrelated groups
t.test(after, before)
#>
#>	Welch Two Sample t-test
#>
#> data:  after and before
#> t = 1.4252, df = 21.981, p-value = 0.1681
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.4184237  2.2567570
#> sample estimates:
#> mean of x mean of y
#>  8.657500  7.738333
```

0.1681. The same data, the same 92 cent gain, and now it does not clear 0.05.

The difference is what each test has to see through. Before the button, those 12 order values ranged from $3.58 to $9.74, a spread many times wider than the gain we are hunting for. The independent test has to pick the 92 cents out against all of that. The paired test never has to, because subtracting each customer's before value from their after cancels that spread, and what remains is the 12 gains, every one of them positive.

[WARNING]
Pairing is not a setting you adjust until the p-value looks right. It is a fact about how the data was collected. Call paired data independent and you throw away the very thing that makes the comparison sharp. Call independent data paired and you claim a link between rows that does not exist.

=== step === widget
## Question 4: is each group roughly normal?

The tests built on averages, `t.test()` and `aov()`, assume something about each group: that its values are roughly normal in shape, meaning bunched around the middle, reaching about as far out on one side as the other, with thin tails. When that holds, the mean is a fair summary of the group. When one group trails a long tail on one side, the mean stops describing a typical order and the test starts answering a question about a number nobody actually spends.

`shapiro.test()` puts a number on it, one group at a time. It starts from the assumption that the values did come from a normal shape, and its p-value says how ordinary the data would be under that assumption. So you interpret it the opposite way to what you might expect: a large p-value means no evidence against a normal shape, and a small one means the shape is off.

```r
# Test each branch for a normal shape, then compare Airport mean with its median
shapiro_p <- sapply(list(Central = central, Riverside = riverside, Airport = airport),
                    function(v) shapiro.test(v)$p.value)

data.frame(branch    = names(shapiro_p),
           shapiro_p = format(signif(shapiro_p, 3), scientific = FALSE, drop0trailing = TRUE),
           row.names = NULL)
#>      branch shapiro_p
#> 1   Central     0.983
#> 2 Riverside     0.549
#> 3   Airport 0.0000395

round(c(mean = mean(airport), median = median(airport), largest = max(airport)), 2)
#>    mean  median largest
#>    9.87    8.48   22.07
```

Central at 0.983 and Riverside at 0.549 give no reason to doubt their shape. Airport comes back at 0.0000395, far below 0.05, so its orders are not normal.

The second line says why. Airport's median order is $8.48 while its mean is $9.87, and its largest single order is $22.07. A handful of big orders is dragging the mean about $1.40 above the median, which is what a typical customer there actually spends.

A normal Q-Q plot shows the same thing as a picture. It plots the sorted orders against the values a normal shape would have produced, so a normal group puts its points on the straight line.

```r
# Plot Airport orders against the straight line a normal shape would follow
qqnorm(airport, main = "Airport orders against a normal shape")
qqline(airport, col = "red", lwd = 2)
```

Through the middle of the data the points sit close to the red line. At the right end they climb well clear of it, and that upward bend is the long right tail: Airport's biggest orders are far bigger than a normal shape would have put there. The left end lifts a little too, because these orders have a floor and a normal shape does not.

A failed shape check leaves two routes. The first is to transform the values, which means replacing each order with its logarithm or another function that pulls a long tail in, then testing the transformed numbers. The widget below carries its own right-skewed sample, built with the same kind of long right tail Airport has, so you can try the usual transforms on it.

::widget transform-shaper {}

Skewness is one number for how lopsided a set of values is, where 0 is symmetric and positive means a tail to the right. The raw sample reads 1.97. Press Box-Cox and it drops to 0.06, near enough symmetric. Press log and it overshoots to -0.55, a mild tail on the left instead. The sqrt button gets part of the way there, at 0.66.

Transforming works, but it changes what you are testing. The test is now about log dollars, and a difference in log dollars does not convert back to dollars without extra work. The second route keeps the original values and swaps the test for one that assumes no shape at all, and that is the route we will take.

[NOTE]
Groups of about 30 or more tolerate mild skew, because the mean of a group settles into a normal shape even when the individual values do not. Airport has 30 orders, but its skew is not mild: one order at $22.07 against a median of $8.48.

=== step === concept
## Question 5: the test the four answers point to, and how big the gap is

Four answers are in: the outcome is continuous, there are three groups, they are independent, and one group is not normal. The continuous outcome and the independent groups are what put us in the chart below. The other two answers, three groups and one of them not normal, pick the branches inside it.

::widget tree-diagram {"root": "3 or more groups?", "l": "normal shape?", "r": "normal shape?", "leaves": ["aov()", "kruskal.test", "t.test", "wilcox.test"]}

Read the left half first, since we have three groups. If every group were roughly normal we would take `aov()`, which is one-way ANOVA. One group is not, so we land on the other leaf: `kruskal.test()`, the Kruskal-Wallis test.

The right half is the two-group version of the same choice, `t.test()` when the shapes hold and `wilcox.test()` when they do not. That is the pattern behind the whole chart. Every test built on averages has a counterpart built on ranks sitting beside it at the same group count.

Kruskal-Wallis works on ranks. It sets the 90 dollar values aside and replaces them with their positions in the sorted list, 1 for the smallest order up to 90 for the largest, then asks whether one branch holds more of the high positions than a random shuffle would give it. Ranks do not care how far out the largest order is, only that it is the largest, so a single $22.07 order cannot drag the answer around.

```r
# Run the test the four answers point to
kruskal.test(value ~ branch, data = orders)
#>
#>	Kruskal-Wallis rank sum test
#>
#> data:  value by branch
#> Kruskal-Wallis chi-squared = 21.532, df = 2, p-value = 2.11e-05
```

The p-value is 2.11e-05, well under 0.05. The three branches do not all sit at the same level, and 90 orders is enough to say so.

That is where most write-ups stop, and stopping there throws away the more useful half of the answer. A p-value says the gap is hard to explain by chance, and it says nothing at all about how big the gap is. The size measure that goes with Kruskal-Wallis is epsilon-squared, which rescales the test statistic to sit between 0 and 1.

```r
# Measure how big the difference between branches is, and where it sits
kw   <- kruskal.test(value ~ branch, data = orders)
n    <- nrow(orders)
eps2 <- unname(kw$statistic) / ((n^2 - 1) / (n + 1))

round(eps2, 3)
#> [1] 0.242

round(tapply(orders$value, orders$branch, median), 2)
#>   Central Riverside   Airport
#>      8.28     10.23      8.48
```

That divisor is worth a second look, because `(n^2 - 1) / (n + 1)` is just `n - 1`, so epsilon-squared is the test statistic divided by 89. It comes to 0.242, meaning branch accounts for about 24% of the variation in the ranks. The usual marks for a measure like this are 0.01 for small, 0.06 for medium and 0.14 for large, so 0.242 is a large difference, not a small one that only cleared the bar because we collected 90 orders.

The medians say where the difference lives. Riverside sits at $10.23 against $8.28 for Central and $8.48 for Airport, so Riverside is out on its own and the other two are nearly level. Airport's mean of $9.87 had made it look like a middle performer, but that came from its tail rather than from its typical order.

One last comparison. Had Airport passed the shape check, `aov()` would have been the choice, so it is worth seeing what it says about the same data.

```r
# Run the mean-based test on the same data for comparison
summary(aov(value ~ branch, data = orders))
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> branch       2   91.6   45.81    7.43 0.00105 **
#> Residuals   87  536.4    6.17
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

F = 7.43 on 2 and 87 degrees of freedom, p = 0.00105. It flags a difference too, so here the two tests agree.

[KEY INSIGHT]
The reason to report the rank test is Airport's shape, not its smaller p-value. Picking the test after seeing which one gives the better number is the same mistake as running three t-tests and keeping the small ones.

=== step === tryit
## Your turn: Riverside against Airport on its own

The chain now asks a narrower question. Forget Central: is Riverside really ahead of Airport?

Put that comparison through the questions yourself. The outcome is still order value in dollars. There are two groups this time, `riverside` and `airport`, both already in the session with 30 orders each. They come from different customers, and Airport is the branch whose shape failed, with the long right tail that pulled its mean above its median.

Pick the test those answers point to, run it on the two vectors, then print the median of each branch so you can say how big the gap is.

```r
# riverside and airport each hold 30 order values, from different customers.
# Airport has the long right tail, so a test built on averages does not fit.
# Run the two-group test that works on ranks instead,
# then print the median of each branch.
# Two lines. Press Check when you have them.
```
::check {"regex": "wilcox[.]test", "gate": true, "difficulty": "beginner", "ok": "Right: W = 618 and p = 0.01238, so Riverside really is ahead. The medians put the gap at 10.225 against 8.485, a little under two dollars an order.", "no": "You have two groups, from different customers, with one of them not normal in shape. That is the wilcox.test leaf of the chart, so run wilcox.test(riverside, airport), then median(riverside) and median(airport)."}
::solution
```r
# Compare Riverside and Airport with the rank-based test, then read the medians
wilcox.test(riverside, airport)
#>
#>	Wilcoxon rank sum exact test
#>
#> data:  riverside and airport
#> W = 618, p-value = 0.01238
#> alternative hypothesis: true location shift is not equal to 0

c(Riverside = median(riverside), Airport = median(airport))
#> Riverside   Airport
#>    10.225     8.485
```

Now put the mean-based test on the very same two branches and see what it makes of them.

```r
# Compare with the test built on averages, on the same two branches
signif(t.test(riverside, airport)$p.value, 3)
#> [1] 0.354
```

0.354, nowhere near 0.05. Both tests saw the same 60 orders. The t-test compares averages, and Airport's tail lifts its mean to $9.87, within easy reach of Riverside's $10.56. The rank test compares positions in the sorted list, where Airport's typical order sits well below Riverside's. Question 4 did real work here, it decided the answer.

=== step === quiz
## Quick check: the same regulars, measured twice

::prose-only a gated quiz that routes a fresh scenario through all four questions

The chain runs the re-order button trial again, this time at Riverside. Forty regulars have their order value recorded in the week before and again in the week after, and both sets of 40 pass `shapiro.test()` comfortably. Which line answers whether the button changed anything?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- `aov(value ~ week, data = regulars)`, since there are two time points to compare. ::no
- `kruskal.test(list(before, after))`, since a rank test assumes no shape and so is always the safer pick. ::no A rank test does assume less, but that is not free. When the shapes really are normal, it has less chance of catching a difference that is genuinely there than the matching test built on averages. Assume less where you have a reason to, not by default.
- `t.test(after, before, paired = TRUE)` ::ok Yes. The outcome is continuous, there are two groups, the same 40 people were measured twice, and both sets are normal in shape. Four answers, one leaf.
- `t.test(after, before)`, since before and after are two separate columns of numbers. ::no Two columns is not the same as two independent groups. Each after value belongs to the customer who produced the before value beside it, and dropping that link is what moved the p-value for the 12 Central regulars from 0.0000076 to 0.168.

=== step === concept
## References

- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. Why a p-value should never be reported on its own, and why an effect size belongs beside it.
- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen (1988), 2nd edition, Lawrence Erlbaum. The origin of the small, medium and large marks used to read an effect size.
- Tomczak and Tomczak (2014), The need to report effect size estimates revisited: an overview of some recommended measures of effect size, Trends in Sport Sciences 1(21), 19-25. The epsilon-squared formula used here for Kruskal-Wallis.
- [Nonparametric Statistical Methods](https://doi.org/10.1002/9781119196037) - Hollander, Wolfe and Chicken (2014), 3rd edition, Wiley. The Kruskal-Wallis and Wilcoxon rank-sum tests in full.
- [The R stats package reference index](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html) - R Core Team. Documentation for kruskal.test, shapiro.test, wilcox.test and aov.

=== step === complete
## Quick recap

You took one dataset and five questions, and the questions picked the test. Here is what the coffee chain's orders answered to each.

1. **What kind of outcome?** Order value in dollars, a measurement, so the family built on averages and ranks rather than the one built on counts.
2. **How many groups?** Three branches, so one test across all three, because three separate tests at 0.05 leave about a 14.3% chance that one comes back significant when nothing is different.
3. **Linked or not?** 90 orders from 90 different customers, so independent. The 12 regulars measured twice were paired, and treating them as independent moved the p-value from 0.0000076 to 0.168.
4. **Roughly normal?** Central and Riverside yes, Airport no, at 0.0000395, with a median of $8.48 sitting under a mean of $9.87.
5. **How big is it?** Epsilon-squared 0.242, a large difference, with Riverside's median order at $10.23 against $8.28 and $8.48.

Those properties of the data pick a leaf, and the leaves come in pairs: the test built on averages, and its counterpart built on ranks for when the shape does not hold.

| What you are comparing | Built on averages | Built on ranks |
|---|---|---|
| Two groups of measurements | `t.test()` | `wilcox.test()` |
| Three or more groups of measurements | `aov()` | `kruskal.test()` |
| The same people measured twice | `t.test(paired = TRUE)` | `wilcox.test(paired = TRUE)` |

Counted labels are the other family, and they split on a different question: `chisq.test()` when every cell of the table holds enough orders, and `fisher.test()` when some cells are thin.

So the next time someone puts three averages in front of you and asks whether the difference is real, you have five questions to ask the data before you pick anything.

There is one more wrinkle inside Question 4. Every group can pass the shape check and the groups can still have very different spreads, which changes which version of the test you want. That is a question for another day.
