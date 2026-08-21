---
title: "Which statistical test to use? A 5-question decision flowchart"
slug: "Which-Test-Mini-1"
description: "Three branches of a store, one question: is the difference real? Answer five plain questions about your data and the right R test walks out on its own."
keywords: "which statistical test to use, statistical test decision flowchart, choosing a statistical test in R, t-test vs ANOVA, paired t-test, kruskal wallis test, chi-square test in R, effect size"
mathjax: false
webr: true
date: "2026-08-21"
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
catalog_blurb: "Five plain questions that lead you to the right test for your data."
---

=== step === cover
::eyebrow Which Test Do I Run?
## Which statistical test to use? A 5-question decision flowchart

Consider this. You have average order values from three branches of a store, and someone asks whether the difference is real. Does one branch actually do better than the others?

And you freeze.

Because you know there are a dozen tests you could possibly run, and you are not sure which one this situation precisely needs.

The way out of that is not to memorise a table of test names. It is to answer five plain questions about your data, one at a time. Each answer you give knocks out a whole branch of wrong tests, and by the time you have answered the fifth one there is a single test left standing in front of you.

Here are the five questions.

::widget process-flow {"steps":[{"title":"What are you measuring","sub":"a number you can average, or a label you can count"},{"title":"How many groups","sub":"two branches, or three and more"},{"title":"Are the numbers linked","sub":"the same customers measured twice, or different people"},{"title":"What shape is the data","sub":"roughly normal, or badly skewed by a few huge orders"},{"title":"How big is the gap","sub":"the size of the difference, not only whether it is there"}]}

So we are going to take the store's three branches through all five of them, and put a few other shapes of data through them as well, until answering these questions feels like second nature.

=== step === concept
## What each branch takes on an average order

Let's put the store's actual numbers on the table first, because every decision from here on is made about them.

The store has three branches: Anna Nagar, Velachery and Adyar. We pulled the last 30 orders from each one and recorded the order value in dollars. That is 90 orders in total.

Press Run to build the data and see what each branch takes on an average order.

```r
# Build the store's 90 orders and show the average order value per branch
set.seed(36)
orders <- data.frame(
  branch = factor(rep(c("Anna Nagar", "Velachery", "Adyar"), each = 30),
                  levels = c("Anna Nagar", "Velachery", "Adyar")),
  value  = round(c(rnorm(30, 48, 9), rnorm(30, 51, 9), rnorm(30, 61, 9)), 2)
)

round(tapply(orders$value, orders$branch, mean), 2)
#> Anna Nagar  Velachery      Adyar 
#>      49.03      51.56      61.84 
```

`set.seed(36)` fixes the random draw so your 90 orders come out exactly the same as mine. `tapply()` splits the value column by branch and takes the mean of each piece.

So Velachery is ahead of Anna Nagar by $2.53 an order, and Adyar is ahead of Anna Nagar by nearly $13.

Three averages on their own tell you nothing about how spread out the orders behind them are, so let's draw all 90 of them.

```r
# Draw all 90 orders by branch, with the three branch averages marked in red
boxplot(value ~ branch, data = orders,
        col = "grey90", border = "grey30",
        main = "Order value by branch, 30 orders each",
        xlab = "", ylab = "Order value in dollars")
points(1:3, tapply(orders$value, orders$branch, mean),
       pch = 19, col = "red", cex = 1.3)
```

Each grey box holds the middle half of that branch's orders, and the line inside it marks that branch's middle order, the median. The red dot is the branch average.

Look at how much the boxes overlap. Plenty of Anna Nagar orders are bigger than plenty of Velachery orders, even though Velachery has the higher average. That overlap is the whole reason you cannot answer the question by eye.

=== step === widget
## How a test decides a gap is too big for luck

Before we get to the five questions, it is worth knowing what all of these tests have in common, because underneath they are all doing the same thing.

A test takes the gap you actually measured, works out how big a gap pure luck tends to produce when nothing is really different, and then asks how often luck reaches as far as you did.

The gap that luck typically hands out has a size of its own, and you can compute it. Take how spread out Anna Nagar's orders are, take how spread out Velachery's are, and combine the two into a single yardstick. If the two branches were truly identical, the gap between their averages would still wobble around zero by roughly one yardstick at a time. Call one of those a noise width.

```r
# Measure the Anna Nagar to Velachery gap in noise widths
anna <- orders$value[orders$branch == "Anna Nagar"]
vela <- orders$value[orders$branch == "Velachery"]

gap         <- mean(vela) - mean(anna)
noise_width <- sqrt(var(anna) / 30 + var(vela) / 30)

round(c(gap = gap, noise_width = noise_width,
        in_noise_widths = gap / noise_width), 2)
#>             gap     noise_width in_noise_widths 
#>            2.53            2.24            1.13 
```

The gap is $2.53 and one noise width is $2.24, so the gap measures 1.13 noise widths. That is barely more than the wobble luck hands out for free.

Now watch what a test makes of that. The curve below is what the gap does across thousands of imaginary months in which the two branches are genuinely identical, and it is drawn in noise widths so that it sits on the same scale as our 1.13.

::widget null-distribution {"tails": 2, "start": 1.13, "label": "the branch gap, in noise widths"}

Most of those luck-only months land near zero, and a few wander out to either side. The orange line sits at 1.13, where our real gap is, and the shaded orange area is the share of luck-only months that reach at least that far out. It reads about 0.26. The readout puts it the textbook way, fail to reject H0, which is the formal phrasing for luck explains this comfortably.

So roughly a quarter of months would show a gap this big between two branches that are actually the same. That is not rare at all, and it is why nobody should be promoted over $2.53.

Now drag the slider. Push the gap further from zero, as if Velachery had pulled properly ahead, and the shaded slice shrinks fast. Pull it back toward zero and the slice swells.

[KEY INSIGHT]
That shaded slice is the p-value, and every test on this map computes one of them. The five questions never change what a test is doing. They only decide which curve is the right one to draw, and how the gap should be measured.

=== step === concept
## Order value is a number, branch is a label

Question one is the one that costs you the most when you get it wrong, because it decides which half of the whole map you are standing on.

Look at what you are measuring. Some things are numbers you can take an average of, and that average is still the same kind of thing you started with. Order value is one of those: the average of two order values is an order value. Other things are labels you can only count, like which branch an order came from, or whether the customer used a loyalty card.

Let's ask R what it thinks our two columns are.

```r
# Ask R what type each column of the store data is
str(orders)
#> 'data.frame':	90 obs. of  2 variables:
#>  $ branch: Factor w/ 3 levels "Anna Nagar","Velachery",..: 1 1 1 1 1 1 1 1 1 1 ...
#>  $ value : num  50.8 55.6 54.4 63.3 35.9 ...

class(orders$value)
#> [1] "numeric"

class(orders$branch)
#> [1] "factor"
```

`str()` gives you every column's type in one look, and `class()` gives you one column at a time. Here `value` is numeric, so it is a number you can average, and `branch` is a factor, which is R's way of storing labels.

A number you can average sends you toward the t-test and ANOVA family. A label you can only count sends you toward the chi-square family instead. Those two families never mix, and we will come round to the counting side in a little while.

[WARNING]
Do not read the answer off how the data happens to be stored. If someone had numbered the branches 1, 2 and 3, `class()` would say numeric, and the average branch would come out at 2, which means nothing at all. Ask what the thing IS, not what R calls it.

=== step === quiz
## Quick check: which of these is a number you can average?

A colleague hands you the store's order table with four columns. Which one is a number you can average?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Branch, stored in the file as 1, 2 and 3, because R reports it as numeric. ::no
- Order value in dollars, because the average of two order values is itself an order value. ::ok That is the one. It is measured on a scale where the halfway point between two values is a real, meaningful value, which is exactly what averaging needs.
- Whether the customer used a loyalty card, stored as yes and no. ::no
- The payment method, recorded as cash, card or wallet. ::no Three of these four are labels wearing different clothes. Loyalty card and payment method are obviously labels, and branch is a label too, even when it is stored as 1, 2 and 3. Averaging those numbers gives you branch 2.1, which is not a place. Ask what the thing is, never what R calls it.

=== step === concept
## Three branches, not three separate comparisons

Question two simply counts your groups, and the answer to it picks the test before anything else about your data gets a say.

With two groups you compare one against the other and you are done. With three branches you might think the natural move is three comparisons: Anna Nagar against Velachery, Anna Nagar against Adyar, and Velachery against Adyar. It does feel thorough. It is also how people end up manufacturing findings without meaning to.

Here is why. A single test set at 0.05 promises to raise a false alarm about 5 times in 100 when nothing is really different. Run three of them and you have given yourself three chances to trip that alarm, so the promise no longer holds for the set.

Let's watch it happen. The code below builds three groups of 30 orders that all come from the exact same population, so any difference it finds is a false alarm by construction, and it repeats that 1,000 times.

```r
# Count how often three t-tests raise a false alarm when nothing is different
set.seed(101)
runs <- replicate(1000, {
  anna <- rnorm(30, 50, 9)
  vela <- rnorm(30, 50, 9)
  adya <- rnorm(30, 50, 9)

  p_anna_vela <- t.test(anna, vela)$p.value
  p_anna_adya <- t.test(anna, adya)$p.value
  p_vela_adya <- t.test(vela, adya)$p.value

  c(one_test_alone   = p_anna_vela < 0.05,
    any_of_the_three = min(p_anna_vela, p_anna_adya, p_vela_adya) < 0.05)
})

round(rowMeans(runs), 3)
#>   one_test_alone any_of_the_three 
#>            0.044            0.122 
```

`replicate()` runs the block inside it 1,000 times and keeps both answers from every run, and `rowMeans()` turns those into two rates.

Read the two numbers side by side. One t-test on its own cried wolf 44 times in 1,000, which is the 5 in 100 it promised. Ask whether ANY of the three cried wolf and the rate climbs to 122 in 1,000.

Nothing was different in a single one of those 1,000 months. And yet the alarm still went off in one month out of eight, purely because we gave it three chances to go off.

So three or more groups get ONE test that looks at all of them together, which is what a one-way ANOVA does. Only after that test says something is going on do you go back and ask which branch is the odd one out.

=== step === quiz
## Quick check: three branches to compare, what do you run?

You have order values from all three branches and you want to know whether any branch differs from the others.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Three t-tests, one for each pair of branches, and report whichever ones come in under 0.05. ::no
- One test across all three branches at once, then a follow-up that says which branch is the odd one out. ::ok Exactly. One test asks the whole question once and keeps its false-alarm promise, and the pair-by-pair comparison is only made after that test has earned it.
- A single t-test on the highest branch against the lowest, since that is the comparison that matters. ::no
- Three t-tests, but only report the smallest of the three p-values. ::no All three of these run more comparisons than they admit to, or pick the winner out of them afterwards, and both moves push the false-alarm rate well past 5 in 100. Highest against lowest is the sneakiest of them, because you chose that pair by looking at the answer first.

=== step === concept
## The same 30 customers, before and after the promo

Question three asks whether your two sets of numbers are linked, and the store has a case where they clearly are.

The store ran a promo on its 30 loyalty customers. Every one of them has an order value from before the promo and an order value from after it. Customer 7's before number and customer 7's after number belong together, and that link between them is real information.

Let's build those 30 customers.

```r
# Build 30 loyalty customers measured once before the promo and once after
set.seed(7)
promo <- data.frame(customer = 1:30,
                    before = round(rnorm(30, 50, 12), 2))
promo$after <- round(promo$before + rnorm(30, 3.2, 2.5), 2)

head(promo, 4)
#>   customer before after
#> 1        1  77.45 78.47
#> 2        2  35.64 40.64
#> 3        3  41.67 45.15
#> 4        4  45.05 48.05
```

Now let's draw each customer as a line running from their before value to their after value, so the pairing is something you can see.

```r
# Draw one line per customer, from their before value to their after value
plot(c(0.8, 2.2), range(c(promo$before, promo$after)), type = "n",
     xaxt = "n", xlab = "", ylab = "Order value in dollars",
     main = "The same 30 customers, before and after the promo")
axis(1, at = c(1, 2), labels = c("before", "after"))
segments(1, promo$before, 2, promo$after, col = "grey70")
points(rep(1, 30), promo$before, pch = 19, col = "steelblue")
points(rep(2, 30), promo$after,  pch = 19, col = "darkorange")
```

Notice two things in that picture. The customers are spread all over the place, from the low thirties to the low eighties. And almost every single line tilts upward by a small, similar amount.

Those two facts sitting side by side are exactly where the pairing pays off, and we can put numbers on it.

```r
# Test the same 30 customers two ways, and see what the pairing is worth
promo$change <- promo$after - promo$before

round(c(spread_of_values = sd(promo$before),
        spread_of_change = sd(promo$change),
        customers_who_rose = sum(promo$change > 0)), 2)
#>   spread_of_values   spread_of_change customers_who_rose 
#>              13.52               2.00              28.00 

paired_p      <- t.test(promo$after, promo$before, paired = TRUE)$p.value
independent_p <- t.test(promo$after, promo$before)$p.value

signif(c(paired = paired_p, independent = independent_p), 3)
#>      paired independent 
#>    6.41e-10    3.43e-01 
```

Order values are spread by about $13.52 from customer to customer, but each customer's own change is spread by only $2.00, and 28 of the 30 went up.

Now look at the two p-values. When the test is told about the pairing it comes back with 0.000000000641. When it is not told, those very same 60 numbers come back with 0.343, which is a shrug.

Same 60 numbers, two completely different answers.

The independent test has to spot the promo through all that customer-to-customer spread. The paired test throws that spread away by working on each customer's own change, and what is left is a small, consistent rise it can see easily.

[WARNING]
Running the independent test on paired data does not just lose you a little power. It can turn a real and obvious effect into nothing at all, which is exactly what happened above. If each number in one group has a specific partner in the other, say so.

=== step === tryit
## Your turn: run the promo test the right way

The `promo` data frame is still here, with a `before` column and an `after` column for each of the 30 loyalty customers. Run the t-test that knows those two columns are linked, one pair per customer.

One argument does all the work.

```r
# promo holds 30 loyalty customers, each with a before value and an after value.
# Run a t-test on promo$after against promo$before that treats them as
# 30 linked pairs rather than two unrelated groups.
# One line. Press Check when you have it.
```
::check {"regex": "paired\\s*=\\s*TRUE", "gate": true, "difficulty": "beginner", "ok": "That is it. The p-value comes back at 6.4e-10 and the mean difference at $3.29 an order. All of the pairing is carried by that one argument.", "no": "The test itself is `t.test(promo$after, promo$before, ...)`. Add the argument that tells it the two columns are 30 linked pairs."}
::solution
```r
# Test the promo the right way, treating the two columns as 30 linked pairs
t.test(promo$after, promo$before, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  promo$after and promo$before
#> t = 9.025, df = 29, p-value = 6.414e-10
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  2.545196 4.036804
#> sample estimates:
#> mean difference 
#>           3.291 
```

The two numbers above the estimate are worth a glance too. They say the promo is worth somewhere between $2.55 and $4.04 an order, and that range, called a confidence interval, is the honest version of the $3.29.

=== step === concept
## What roughly normal looks like on our branch data

Question four asks about the shape of your numbers, and shape is something you can simply go and look at.

Roughly normal means most values pile up near the middle, fewer and fewer appear as you move away in either direction, and the two sides look about the same. It is the shape a t-test and an ANOVA quietly assume when they draw that luck-only curve.

Two pictures tell you almost everything. A histogram shows you the pile directly, and a QQ plot lines your values up against the values a perfectly normal batch would have produced. On a QQ plot, close to the straight line means close to normal.

```r
# Look at the shape of the Adyar orders two ways, as a pile and against normal
adyar <- orders$value[orders$branch == "Adyar"]

par(mfrow = c(1, 2))
hist(adyar, breaks = 10, col = "grey85", border = "white",
     main = "Adyar order values", xlab = "Order value in dollars")
qqnorm(adyar, main = "Adyar against a normal shape")
qqline(adyar, col = "red", lwd = 2)
par(mfrow = c(1, 1))
```

`par(mfrow = c(1, 2))` puts the two plots side by side, and the last line puts the drawing area back to a single plot so later charts are not squeezed.

The pile is lumpy, which 30 orders always are, but it has a middle and two tails and no runaway values. On the right, the dots track the red line closely, with only the usual wobble at the two ends.

There is also a test for this, and it reports a p-value that works the way you would hope: small means the shape is unlikely to have come from a normal population.

```r
# Test each branch's order values for a normal shape
sapply(split(orders$value, orders$branch),
       function(v) signif(shapiro.test(v)$p.value, 2))
#> Anna Nagar  Velachery      Adyar 
#>       0.51       0.72       0.91 
```

`split()` cuts the value column into three pieces by branch and `sapply()` runs `shapiro.test()` on each piece.

All three land far above 0.05, so there is no evidence against a normal shape anywhere in the store's data. The picture and the test agree, which is the comfortable case.

=== step === concept
## When the shape actually changes your answer

A failed shape check is not automatically a change of test, and this is where most people over-correct.

The month after that promo, a few corporate customers placed enormous orders. Same three branches, same 30 orders each, but the shape is now nothing like the last picture.

```r
# Build the month the huge corporate orders came in, and look at its shape
set.seed(11)
big_month <- data.frame(
  branch = factor(rep(c("Anna Nagar", "Velachery", "Adyar"), each = 30),
                  levels = c("Anna Nagar", "Velachery", "Adyar")),
  value  = round(c(rlnorm(30, 3.6, 0.75), rlnorm(30, 3.75, 0.8),
                   rlnorm(30, 4.25, 0.85)), 2)
)

hist(big_month$value, breaks = 25, col = "grey85", border = "white",
     main = "The month the big corporate orders came in",
     xlab = "Order value in dollars")
```

That is a long right tail. Seventy-nine of the 90 orders sit under $100, and two of them stretch past $450, which drags every average upward and makes it a poor summary of a typical order.

```r
# Test each branch of the big month for a normal shape
sapply(split(big_month$value, big_month$branch),
       function(v) signif(shapiro.test(v)$p.value, 2))
#> Anna Nagar  Velachery      Adyar 
#>    7.2e-05    8.0e-03    1.6e-07 
```

All three are far below 0.05, so all three shapes are a long way from normal.

When that happens, every test we have met has a partner that works on ranks instead of the raw values. A rank-based test throws away the exact size of each order and keeps only the running order, which is why one enormous corporate order can no longer drag the answer around.

| What you have | The usual test | Its rank-based partner |
|---|---|---|
| Two independent groups | t-test | Wilcoxon rank-sum test |
| Two linked measurements | paired t-test | Wilcoxon signed-rank test |
| Three or more groups | one-way ANOVA | Kruskal-Wallis test |

Now here is the part people get wrong. Shape matters most when you have few values, and it matters less and less as you collect more of them.

With 30 orders and a tail like the one above, two orders out of 90 are setting Adyar's average, and the luck curve a t-test or an ANOVA draws is the wrong shape for the data, so move to the partner column and report medians. With a few hundred orders and a mild lean to one side, a t-test and an ANOVA hold up fine, and swapping to ranks buys you very little.

[NOTE]
A shape test is not the decision maker, because it does what all tests do and gets more sensitive as the data grows. Feed it 5,000 orders and a lean too small to matter will still come back under 0.05. Look at the histogram, count how many values you have, then decide.

=== step === quiz
## Quick check: 200 orders and a slight lean to the right

You have 200 orders from each of two checkout flows. The histograms lean slightly to the right, nothing dramatic, and `shapiro.test()` comes back at 0.02 for one of them. What do you run?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The rank-based partner, because the shape test came in under 0.05 and that rules the t-test out. ::no
- The ordinary t-test, because with 200 orders a side a slight lean barely moves the answer. ::ok Right. The shape test is picking up a real but tiny lean, because 200 values give it the sensitivity to. Look at the size of the lean and the size of the sample together, and here both point the same way.
- Drop the orders in the right tail until the shape test clears 0.05, then run the t-test. ::no
- Neither test can be used, because the data is not normal. ::no Two of these treat 0.05 on a shape test as a verdict rather than a reading, and dropping the tail is worse still: those orders are real, and removing them to pass a test is choosing your data to fit your method. Non-normal data always has a test that fits it, so nothing is ever untestable.

=== step === concept
## How big is the gap, not just whether it is there

Question five is the one that gets skipped, and it is the one your manager actually cares about.

A p-value only ever answers whether a gap is bigger than luck can comfortably explain. It says nothing about whether the gap is worth acting on. For that you want an effect size, which is a number that says how much.

For a comparison across three or more groups the usual one is called eta squared, and it is a share. Take the swing in order value that the branch labels account for, and divide it by the total swing in order value across all 90 orders.

```r
# Work out what share of the swing in order value the branch accounts for
branch_fit <- aov(value ~ branch, data = orders)
sums <- summary(branch_fit)[[1]][["Sum Sq"]]

eta_squared <- sums[1] / sum(sums)
round(c(between_branches = sums[1], leftover = sums[2],
        eta_squared = eta_squared), 3)
#> between_branches         leftover      eta_squared 
#>         2759.137         6026.525            0.314 
```

`aov()` fits the comparison and `summary()` hands back its two sums of squares: how much of the swing travels with the branch labels, and how much is left over inside the branches.

So 2,759 of the 8,786 total belongs to the branch, which is 0.314, or about 31 percent. Roughly a third of the variation in order value at this store goes with which branch the order came from, and the other two thirds is customers being customers.

Cohen's rough benchmarks for eta squared are worth carrying around:

- 0.01 is a small effect
- 0.06 is a medium effect
- 0.14 is a large effect

At 0.314 the store's branch difference is large by any of those, and that is a sentence you can take to a manager. A p-value of 0.00000008 is not.

[KEY INSIGHT]
Report both, always. The p-value says whether the gap survives luck, and the effect size says whether the gap is worth a meeting. Either one on its own can talk you into a bad decision.

=== step === concept
## The answer for the store, and which branch is different

We now have all five answers for the store's original question, so let's lay them out and see what falls out.

1. Order value is a number you can average.
2. There are three branches, not two.
3. The orders come from different customers, so nothing is linked.
4. All three branches passed the shape check comfortably.
5. We want the size of the difference, not only whether it exists.

Answers one to four leave exactly one test standing: a one-way ANOVA. Let's run it.

```r
# Run the one test that compares all three branches at once
summary(branch_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> branch       2   2759  1379.6   19.92 7.56e-08 ***
#> Residuals   87   6027    69.3                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The `F value` is the noise-width idea from earlier, done across three groups at once: how far apart the three branch averages sit, measured against how much the orders wobble inside each branch. At 19.92 the three branches differ from one another far more than the orders wobble inside any one branch.

The line that turns that into an answer is `Pr(>F)`, which is 0.0000000756. If the three branches were genuinely identical, a spread of averages this wide would turn up less than once in ten million months. Something is going on.

But notice what that line does not tell you. It says the three branches are not all the same. It does not say which one is different, and it is perfectly possible that two of them are twins.

That is what the follow-up comparison is for. `TukeyHSD()` compares every pair, and, this is the important bit, it adjusts for the fact that it is making three comparisons rather than one.

```r
# Ask which branch is actually the odd one out, all three pairs at once
TukeyHSD(branch_fit)
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = value ~ branch, data = orders)
#> 
#> $branch
#>                          diff       lwr      upr     p adj
#> Velachery-Anna Nagar  2.53100 -2.593150  7.65515 0.4695583
#> Adyar-Anna Nagar     12.80467  7.680517 17.92882 0.0000002
#> Adyar-Velachery      10.27367  5.149517 15.39782 0.0000209
```

Read the `p adj` column. Velachery against Anna Nagar comes in at 0.47, so those two branches are twins as far as this data can tell, and their $2.53 gap is the one we watched drown in noise earlier.

Adyar against each of the other two comes in tiny, and the `diff` column tells you by how much: about $12.80 an order above Anna Nagar and $10.27 above Velachery.

So the store's answer is one sentence. Adyar takes about $11 more per order than the other two branches, which are indistinguishable from each other, and branch accounts for roughly a third of all the variation in order value.

[NOTE]
A one-way ANOVA also assumes the three branches spread out by about the same amount, and here they do: the spread of the three branches works out at $9.01, $8.33 and $7.57. When one group is far more scattered than the others, that is the assumption that breaks first.

=== step === tryit
## Your turn: the month the big orders came in

Someone asks the same question about the month the corporate orders landed. Same three branches, same 30 orders each, but you saw what that shape looks like, and all three branches failed the shape check badly.

So the one-way ANOVA is out and its partner is in. Compare the three branches of `big_month` with the test that works on ranks, using `value` explained by `branch`.

```r
# big_month holds 90 orders from the month the huge corporate orders came in,
# with the same branch column and value column as before.
# The shape is badly skewed, so the usual three-group test is out.
# Run its rank-based partner instead, on value explained by branch.
# One line. Press Check when you have it.
```
::check {"regex": "kruskal\\.test", "gate": true, "difficulty": "intermediate", "ok": "Yes, and the p-value comes back at 0.0004. The branches still differ, and now that verdict does not rest on a normal shape the data plainly does not have.", "no": "The three-group partner in the rank column is the Kruskal-Wallis test. The call takes the same formula shape the ANOVA did: `kruskal.test(value ~ branch, data = big_month)`."}
::solution
```r
# Compare the three branches without assuming anything about the shape
kruskal.test(value ~ branch, data = big_month)
#> 
#> 	Kruskal-Wallis rank sum test
#> 
#> data:  value by branch
#> Kruskal-Wallis chi-squared = 15.629, df = 2, p-value = 0.0004039
```

Because this test works on ranks, the natural summary to report beside it is the median rather than the mean: $29.20, $43.90 and $63.20 for the three branches. Those sit far below the averages, which the corporate orders had dragged upward.

=== step === concept
## Counting customers instead of averaging money

Question one had two sides to it, and everything so far has been on the side where the outcome is a number. So let's take the other side now.

Suppose the store stops asking about money and asks about loyalty cards instead. Out of 100 customers at each branch, how many used their card? The outcome for one customer is now yes or no, a label, and the only thing you can do with labels is count them.

For counts the comparison is a table, and the test is a chi-square test.

```r
# Count loyalty card use per branch and test whether the branches differ
loyalty <- matrix(c(58, 42, 51, 49, 74, 26), nrow = 2,
                  dimnames = list(card = c("used", "not used"),
                                  branch = c("Anna Nagar", "Velachery", "Adyar")))
loyalty
#>           branch
#> card       Anna Nagar Velachery Adyar
#>   used             58        51    74
#>   not used         42        49    26

chisq.test(loyalty)
#> 
#> 	Pearson's Chi-squared test
#> 
#> data:  loyalty
#> X-squared = 11.686, df = 2, p-value = 0.002901
```

A p-value of 0.0029 says that if card use were identical across the three branches, a table this lopsided would show up about 3 times in 1,000. Adyar is the outlier again, with 74 card users against 51 and 58.

The chi-square test works by comparing what you counted against what you would have counted if the branches behaved identically, and R will show you those expected counts.

```r
# Show the counts you would expect if card use were identical at all three branches
round(chisq.test(loyalty)$expected, 1)
#>           branch
#> card       Anna Nagar Velachery Adyar
#>   used             61        61    61
#>   not used         39        39    39
```

Those expected counts are worth more than a passing look. The chi-square test leans on an approximation that holds up while the expected counts stay reasonably large, and it starts to wobble once any of them drops below about 5.

When that happens, `fisher.test()` does the same job by counting every possible table exactly instead of approximating. It is the right call for small counts, and R warns you when you need it.

=== step === concept
## Where each answer lands you

You now have an answer to all five questions and you have seen both sides of the map, so let's read the whole thing as one path through one picture.

The picture below shows the first fork and one fork on each side of it, which is enough to get you to a family of tests.

::widget tree-diagram {"root": "Outcome a number?", "l": "Two groups only?", "r": "Counts under 5?", "leaves": ["t-test", "ANOVA", "fisher.test", "chisq.test"]}

Going left from the top is the money side of the store, where the outcome is a number you can average. Going right is the loyalty card side, where the outcome is a label you count, and the fork there is about how small the expected counts get.

The picture stops short of the pairing and shape questions, so here is the same map written out in full. Find your row, read off the test.

| What you are measuring | Groups | Linked? | Shape | The test |
|---|---|---|---|---|
| A number | two | no | roughly normal | t-test |
| A number | two | no | badly skewed | Wilcoxon rank-sum test |
| A number | two | yes | roughly normal | paired t-test |
| A number | two | yes | badly skewed | Wilcoxon signed-rank test |
| A number | three or more | no | roughly normal | one-way ANOVA, then Tukey |
| A number | three or more | no | badly skewed | Kruskal-Wallis test |
| Labels you count | any | no | expected counts 5 or more | chi-square test |
| Labels you count | any | no | any expected count under 5 | Fisher's exact test |

One combination has no row on purpose. Three or more measurements that are all linked, the same customers tracked month after month, is a repeated-measures problem, and it has a family of tests of its own. If your answers land you there, stop rather than borrow the nearest row.

Question five does not get a row of its own because it applies to every row. Whichever test you land on, report how big the difference is beside whether it is real.

=== step === quiz
## Practice: before and after, and the numbers are skewed

A gym measures the weekly visits of 25 members in the month before a new class timetable and in the month after. Most members shift by one or two visits, but four of them jump by more than fifteen, so the differences have a long right tail and the shape check comes back at 0.001.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A paired t-test, because the two numbers belong to the same member. ::no
- A Wilcoxon signed-rank test, because the numbers are linked AND the shape is badly skewed with only 25 members. ::ok Both questions answered, and both change the answer. Linked moves you to the paired column, badly skewed with a small sample moves you across to ranks, and the signed-rank test is where those two meet.
- A Wilcoxon rank-sum test, because the shape is badly skewed. ::no
- A Kruskal-Wallis test, because it makes no assumption about shape. ::no Each of these gets one question right and drops another. The paired t-test respects the pairing and ignores the tail. The rank-sum test respects the tail and throws the pairing away, which is the mistake that turned a real promo effect into 0.343 earlier. Kruskal-Wallis is the three-or-more-groups test, and there are two measurements here, not three groups.

=== step === quiz
## Practice: 40,000 orders and a two-cent difference

The store tests two checkout flows on 40,000 orders each. Average order value comes out two cents higher on the new flow, and the test returns p = 0.004. The team wants to rebuild the checkout on the strength of that number.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Rebuild it. p = 0.004 clears the bar, so the two-cent gain is established. ::no
- The gap is very likely real and far too small to act on, and only an effect size can say that second part. ::ok That is the honest read. A p-value shrinks as the data grows, so with 40,000 orders a side even a two-cent gap sits well outside what luck produces. Real and worth doing are separate questions, and only the second one pays for a rebuild.
- p = 0.004 means the difference is large, so the rebuild is justified. ::no
- The test must be wrong, because a two-cent difference cannot be significant. ::no A p-value never measures the size of a difference. It measures how far your gap sits from what luck alone produces, and collecting 40,000 orders shrinks luck's wobble until even a two-cent gap sticks out of it. That makes the tiny gap detectable, not important, and it is exactly why the fifth question exists.

=== step === tryit
## Practice: a 20-customer coupon pilot

The store tried a coupon on 20 customers. Ten of them were offered a coupon and 9 of those ten bought something, and the other ten were offered nothing and 3 of them bought something. The outcome for each customer is bought or did not buy, so this one belongs on the counting side of the map.

Build the two by two count table from the two columns, then run the test that these small counts demand. The expected counts here come out at 4, 6, 4 and 6.

```r
# The 20-customer coupon pilot: who was offered a coupon, and who bought
coupon_pilot <- data.frame(
  offer  = rep(c("with coupon", "without"), each = 10),
  bought = c(rep("yes", 9), "no", rep("yes", 3), rep("no", 7))
)

head(coupon_pilot, 3)

# Build the 2 by 2 count table from coupon_pilot$offer and coupon_pilot$bought,
# then run the test that small expected counts demand.
# Two lines. Press Check when you have them.
```
::check {"regex": "fisher\\.test", "gate": true, "difficulty": "intermediate", "ok": "Correct: p = 0.0198, so the coupon did something. With two expected counts under 5, the exact test is the one whose p-value you can trust here.", "no": "Build the table with `table(coupon_pilot$offer, coupon_pilot$bought)` first. Then, because two expected counts sit under 5, reach for the exact test rather than chi-square."}
::solution
```r
# Build the count table, then run the exact test the small counts demand
pilot_table <- table(coupon_pilot$offer, coupon_pilot$bought)
pilot_table
#>              
#>               no yes
#>   with coupon  1   9
#>   without      7   3

fisher.test(pilot_table)
#> 
#> 	Fisher's Exact Test for Count Data
#> 
#> data:  pilot_table
#> p-value = 0.01977
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>  0.0009621944 0.7209145117
#> sample estimates:
#> odds ratio 
#> 0.05788421 
```

The `odds ratio` line underneath is a separate measure of how far the coupon shifted buying, and the p-value above it is the answer to the question we actually asked.

Run `chisq.test(pilot_table)` on the same table and R prints a warning that the approximation may be incorrect, which is R telling you the counts are too small for it. That warning is your cue to switch, and here the two answers differ enough to matter: 0.0225 from chi-square against 0.0198 from the exact test.

=== step === concept
## References

- [The stats package index](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/00Index.html) - R Core Team. The manual pages for `t.test`, `aov`, `wilcox.test`, `kruskal.test`, `chisq.test` and `fisher.test` all live here, each one spelling out its exact assumptions.
- [Normality Tests for Statistical Analysis: A Guide for Non-Statisticians](https://doi.org/10.5812/ijem.3505) - Ghasemi and Zahediasl (2012), International Journal of Endocrinology and Metabolism 10(2), 486 to 489. Why a shape test on a large sample flags leans too small to matter.
- [Why Psychologists Should by Default Use Welch's t-test Instead of Student's t-test](https://doi.org/10.5334/irsp.82) - Delacre, Lakens and Leys (2017), International Review of Social Psychology 30(1), 92 to 101. What happens when two groups spread out by different amounts.
- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen (1988), 2nd edition, Lawrence Erlbaum. The source of the small, medium and large effect-size benchmarks.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129 to 133. Six principles, including the one saying a p-value does not measure the size of an effect.

=== step === complete
## Quick recap

You started out frozen in front of a dozen tests and you have ended up with one plain sentence about the store. Here is the whole route again, in the order you walk it:

- **What are you measuring?** A number you can average heads for the t-test and ANOVA family. A label you can only count heads for chi-square, or for Fisher's exact test once any expected count drops under 5.
- **How many groups?** Two get a t-test. Three or more get one test across all of them, because three separate t-tests raised a false alarm in 122 months out of 1,000 when nothing was different.
- **Are the numbers linked?** The promo's 30 customers gave 6.4e-10 when the test was told about the pairing and 0.343 when it was not. Same 60 numbers.
- **What shape is the data?** Look at a histogram, then decide with your sample size in mind. Badly skewed and small moves you one column across, to the rank-based partner.
- **How big is the gap?** Eta squared came out at 0.314 for the store, which is large. The p-value could never have told you that.

And the store's answer, which was a one-way ANOVA followed by Tukey: Adyar takes about $11 more per order than Anna Nagar and Velachery, those two are indistinguishable from each other, and branch accounts for roughly a third of the variation in order value.

Next time we take up the assumption a one-way ANOVA makes quietly, that every group is spread out by about the same amount, and what you run when one branch turns out to be far more scattered than the rest.
