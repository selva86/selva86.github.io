---
title: "Chi-square tests: which one to use and how"
slug: "Which-Test-Mini-5"
description: "Three different tests share the chi-square name. Tell independence, goodness of fit and homogeneity apart, build the machine by hand, then run each one in R."
keywords: "chi-square test in R, chisq.test, test of independence, goodness of fit test, test of homogeneity, expected counts, Cramer's V, standardized residuals, contingency table"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "5"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-4"
course_next: ""
curriculum_id: "0.0.37"
lesson_access: "windowed"
catalog_blurb: "Tell the three chi-square tests apart and run the right one."
---

=== step === cover
::eyebrow Which Test Do I Run?
## Chi-square tests: which one to use and how

Meera runs three bakery branches, and one week of orders is sitting in front of her.

Six hundred of those orders came through the Chennai counter. For every one of them she knows two things: how the customer paid, and whether that customer was under 30 or 30 and older. Head office has its own view on payments: the chain-wide split should run 30% cash, 30% card and 40% UPI. A separate audit that week pulled 200 orders from each of the three branches.

Out of that one week, Meera asks three questions.

Does payment method depend on the customer's age? Does the Chennai counter match the split head office quotes? Do the three branches split their payments the same way?

Every one of those is answered by something called a chi-square test. And that is exactly the trouble. They are three different tests wearing one name, and if you pick the wrong one, the answer you write down answers a question nobody asked.

The good news is all three run the same machine.

::widget process-flow {"steps":[{"title":"Count what you saw","sub":"the real orders, laid out as a table of counts"},{"title":"Work out what you expect","sub":"the counts if the boring story were true"},{"title":"Add up the gaps","sub":"one number for the whole table, then a p-value"}]}

Only the middle box changes between the three tests. Where "what you expect" comes from is the whole difference between them, so that is the box we are going to build by hand before we run anything.

=== step === concept
## The week of orders as a contingency table

Let's start with Meera's 600 Chennai orders, because every number from here on comes out of them.

Each row of `orders` below is one order. The `age_group` column says whether the customer was under 30 or 30 and older, and the `payment` column says how they paid. Three hundred orders came from each age group, and the payment counts inside each group are the ones Meera counted off her till report.

Press Run.

```r
# Build Meera's week of 600 Chennai orders and cross-tabulate age against payment
orders <- data.frame(
  age_group = factor(rep(c("Under 30", "30 or older"), each = 300),
                     levels = c("Under 30", "30 or older")),
  payment   = factor(c(rep("Cash", 45),  rep("Card", 90),  rep("UPI", 165),
                       rep("Cash", 105), rep("Card", 120), rep("UPI", 75)),
                     levels = c("Cash", "Card", "UPI"))
)

pay_age <- table(age_group = orders$age_group, payment = orders$payment)
addmargins(pay_age)
#>              payment
#> age_group     Cash Card UPI Sum
#>   Under 30      45   90 165 300
#>   30 or older  105  120  75 300
#>   Sum          150  210 240 600
```

`table()` counted how many orders fall into each combination, and `addmargins()` added the totals around the edge. A table of counts like this, one variable down the side and another across the top, is called a **contingency table**.

Those edge totals matter more than they look. The 300 and 300 down the right are the **row totals**, the 150, 210 and 240 along the bottom are the **column totals**, and 600 is the **grand total**. Together they are the table's **margins**, and every expected count we work out from here comes out of them.

Read the body of the table for a second. Under-30 customers paid by UPI 165 times out of 300, while the older group did it 75 times out of 300. That looks like a real difference. Whether it really is one, how big it is, and which of the three tests gets to name it are three separate questions with three separate numbers.

=== step === concept
## What an expected count is, and where it comes from

Before you can call a difference real, you have to say what "no difference" would have looked like in counts. That is what an expected count is.

Suppose age tells you nothing about payment. That boring story, the one where nothing interesting is going on, is called the **null hypothesis**, and every expected count is just that story written out in orders. Inside that story, every age group pays the way the counter as a whole pays. The counter as a whole paid cash 150 times out of 600, which is a quarter of all orders, so a quarter of the 300 under-30 orders should be cash, and a quarter of 300 is 75.

Written out with the margins, that arithmetic is:

\[ E = \frac{\text{row total} \times \text{column total}}{\text{grand total}} \]

Let's do that one cell in R first, so the formula and the number sit side by side.

```r
# Work out by hand the cash count the under-30 group would show if age changed nothing
row_totals  <- rowSums(pay_age)     # 300 and 300
col_totals  <- colSums(pay_age)     # 150, 210 and 240
grand_total <- sum(pay_age)         # 600

unname(row_totals["Under 30"] * col_totals["Cash"] / grand_total)
#> [1] 75
```

So the boring story expects 75 cash orders from the under-30 group. Meera counted 45.

Now let's do all six cells at once. `outer()` multiplies every row total by every column total and lays the products out in the same shape as the table, so dividing by 600 gives the whole grid of expected counts in one line.

```r
# Work out all six expected counts at once from the table margins
expected_by_hand <- outer(row_totals, col_totals) / grand_total
expected_by_hand
#>             Cash Card UPI
#> Under 30      75  105 120
#> 30 or older   75  105 120
```

Notice the two rows came out identical. That is not a coincidence, it is the whole point. The boring story says both age groups pay the same way, so it hands both of them the same three numbers. Any gap between the real table and this one is the difference we are chasing.

[NOTE]
Expected counts often come out with decimals, and they are not supposed to be whole. They are the counts the boring story implies on average, not counts anyone could actually observe.

=== step === concept
## The chi-square statistic: one number for the whole table

You now have two tables: what Meera counted, and what the boring story expected. Six separate gaps means six things to argue about, so we squeeze them into one number.

Here is that number.

\[ \chi^2 = \sum \frac{(O - E)^2}{E} \]

Read it cell by cell. \(O\) is the count you observed, \(E\) is the count you expected, and you do three things to each cell: subtract, square, and divide by the expected count. Then you add up all six results.

Two of those three deserve a reason.

1. **Squaring** kills the signs. The under-30 group is 30 cash orders short and the older group is 30 cash orders over, so without squaring the two would cancel to zero and a real difference would vanish.
2. **Dividing by the expected count** puts every gap on a fair footing. Being 30 orders off in a cell that expected 75 is a serious miss. Being 30 off in a cell that expected 5,000 is nothing at all. Dividing by \(E\) measures each gap against the size of the cell it lives in.

Let's compute all six of those per-cell numbers, still by hand.

```r
# Turn each of the six gaps into its own contribution to the chi-square statistic
contributions <- (pay_age - expected_by_hand)^2 / expected_by_hand
round(contributions, 3)
#>              payment
#> age_group       Cash   Card    UPI
#>   Under 30    12.000  2.143 16.875
#>   30 or older 12.000  2.143 16.875
```

This grid is worth a slow look, because it tells you where the trouble is before any test runs. The UPI column contributes 16.875 twice, the cash column 12 twice, and the card column barely 2.143. Card payments split almost the way the boring story predicted. UPI did not.

Add the six up and you have the statistic for the whole table.

```r
# Add the six contributions into the single chi-square statistic
x2_stat <- sum(contributions)
x2_stat
#> [1] 62.03571
```

62.04. On its own that number still means nothing, because a wide table with many cells piles up a bigger total than a small one even when nothing is going on. To read it you need one more piece.

=== step === concept
## Degrees of freedom, and how the statistic becomes a p-value

The missing piece is called **degrees of freedom**, and it is a counting job rather than a formula to memorise.

Fix the margins of Meera's table: 300 and 300 down the side, 150, 210 and 240 along the bottom. Now start filling cells in. You can put anything you like in the under-30 cash cell, and anything you like in the under-30 card cell. After those two, every remaining cell is forced, because the row and column totals have to come out right. Two cells were free to move, so the table has 2 degrees of freedom.

For a table with \(r\) rows and \(c\) columns, that count is always:

\[ df = (r - 1)(c - 1) \]

```r
# Count the cells that were free to move once the margins were fixed
df_pay <- (nrow(pay_age) - 1) * (ncol(pay_age) - 1)
df_pay
#> [1] 2
```

Degrees of freedom pick out which curve to read the statistic against. If the boring story were true and Meera ran her week over and over, the statistic would not land on zero every time. It would bounce around and pile up into a known shape called the chi-square distribution, and that shape depends only on the degrees of freedom.

Let's draw the shape for 2 degrees of freedom and mark where 62.04 falls on it.

```r
# Draw the chi-square curve on 2 degrees of freedom and mark our statistic
x_vals <- seq(0, 70, length.out = 500)

plot(x_vals, dchisq(x_vals, df = 2), type = "l", lwd = 2, col = "grey30",
     ylim = c(0, 0.35),
     main = "The chi-square curve on 2 degrees of freedom",
     xlab = "Value the statistic could take", ylab = "Density")
abline(v = 62.04, col = "red", lwd = 3)
```

Almost the entire curve sits below 15. The red line at 62.04 is far out to the right of anything the boring story produces. The p-value is simply the area under that curve to the right of the red line.

```r
# Read off the area under the curve beyond our statistic
pchisq(x2_stat, df = df_pay, lower.tail = FALSE)
#> [1] 3.38155e-14
```

`lower.tail = FALSE` asks for the area above the value instead of below it, which is the direction a chi-square test always looks.

Three in a hundred trillion. If age really told you nothing about payment, a table this far from the expected one would essentially never turn up.

That is the whole engine. Everything left is about deciding where the expected counts come from, and that is exactly what separates the three tests.

=== step === quiz
## Quick check: what count would the null expect here?

Meera's table has 300 under-30 orders and 300 from the older group, with column totals of 150 cash, 210 card and 240 UPI, out of 600 orders in all. She actually counted 165 UPI orders from the under-30 group. If age told you nothing about payment, what count would that cell expect?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- 165, because that is what she counted. ::no
- 100, because 600 orders spread evenly over six cells is 100 each. ::no
- 120, because 300 times 240 divided by 600 is 120. ::ok That is it. The row total is 300, the UPI column total is 240, the grand total is 600, and 300 times 240 over 600 gives 120. She counted 165, so that cell is running 45 orders hot.
- 240, because that is the UPI column total. ::no An expected count is never a count you observed, and never a margin on its own. It comes from the row total times the column total over the grand total, which here is 300 times 240 over 600, or 120. Spreading 600 evenly over six cells would only be right if both margins were even, and these are not.

=== step === concept
## Test of independence: does payment method depend on age?

Meera's first question is whether payment method depends on age. That question has a very particular shape, and the shape is what names the test.

She took **one sample**, the 600 orders that came through the Chennai counter that week, and asked **two questions of every order**: how did you pay, and how old are you. Nobody decided in advance that exactly 300 orders would come from under-30 customers. That number fell out of the week. The two groups landing on 300 apiece is a fluke of this one week and not a quota anyone set, and that distinction is the whole game: tidy totals are not fixed totals, and what counts is who decided them. The only thing fixed before collecting was the grand total of 600.

That design is a **test of independence**, and its null hypothesis is that the two variables are unrelated: knowing a customer's age group tells you nothing about how they paid.

We already built the whole thing by hand, so `chisq.test()` should hand back the same numbers.

```r
# Run the test of independence on Meera's age by payment table
pay_test <- chisq.test(pay_age)
pay_test
#>
#> 	Pearson's Chi-squared test
#>
#> data:  pay_age
#> X-squared = 62.036, df = 2, p-value = 3.382e-14
```

Take that output one line at a time, because you will be reading these lines for the rest of your career.

- `Pearson's Chi-squared test` is the name of the method R chose. It picked this one because you handed it a table with two dimensions.
- `data: pay_age` echoes what you passed in, which is your only guard against testing the wrong object.
- `X-squared = 62.036` is the statistic, the same 62.04 we summed by hand.
- `df = 2` is the degrees of freedom, the same count of free cells.
- `p-value = 3.382e-14` is the tail area, the same number `pchisq()` gave.

The fitted object keeps the expected counts too, which is the cheapest sanity check there is.

```r
# Check the expected counts R used against the ones we worked out by hand
pay_test$expected
#>              payment
#> age_group     Cash Card UPI
#>   Under 30      75  105 120
#>   30 or older   75  105 120
```

Identical. `chisq.test()` did the arithmetic we just did, and nothing more.

So Meera can say payment method is associated with age group at the Chennai counter. What she cannot yet say is how strong that association is, or which payment method is carrying it. Those are separate questions with separate numbers, and both are coming.

=== step === concept
## Goodness of fit: does one variable match a claimed split?

Meera's second question is a different animal. Head office says the chain splits 30% cash, 30% card and 40% UPI. Does the Chennai counter match that claim?

Look at what changed. There is only **one variable** now, payment method, with three categories. There is no second variable for it to be independent of. And the expected counts no longer come from the margins of a table, they come from **the claim itself**: 30% of 600 is 180 cash, 30% is 180 card, and 40% is 240 UPI.

That design is a **goodness-of-fit test**, and its null hypothesis is that the counts follow the stated split.

In R you pass a plain vector of counts, plus a vector of probabilities in the `p` argument.

```r
# Test the Chennai payment counts against the split head office quotes
chennai_pay <- colSums(pay_age)
chennai_pay
#> Cash Card  UPI
#>  150  210  240

national <- c(0.30, 0.30, 0.40)
fit_test <- chisq.test(chennai_pay, p = national)
fit_test
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  chennai_pay
#> X-squared = 10, df = 2, p-value = 0.006738
```

R even renamed the method for you. It says `Chi-squared test for given probabilities`, not `Pearson's Chi-squared test`, because you supplied the probabilities instead of letting it derive them from a table.

The degrees of freedom are counted differently here too. With one variable of \(k\) categories the count is \(k - 1\), because once you know the first two counts and the total, the third is forced. Three categories gives 2 degrees of freedom, which matches the other test purely by accident and will not always.

Let's put the counts Meera saw beside the counts head office implies.

```r
# Draw the counts Meera saw beside the counts head office implies
comparison <- rbind(observed = chennai_pay, expected = fit_test$expected)
comparison
#>          Cash Card UPI
#> observed  150  210 240
#> expected  180  180 240

barplot(comparison, beside = TRUE, col = c("grey35", "grey75"),
        main = "Chennai orders against the head office split",
        ylab = "Number of orders")
legend("topleft", legend = c("observed", "expected"),
       fill = c("grey35", "grey75"), bty = "n")
```

UPI lands exactly on 240, dead on the claim. Cash runs 30 orders light and card runs 30 orders heavy. So Chennai does not match the head office split, and the mismatch is entirely about cash and card trading places.

=== step === tryit
## Your turn: is the loyalty-draw die fair?

Meera runs a weekly loyalty draw where customers roll a six-sided prize die, and face 6 wins a free cake. Staff have started muttering that face 6 comes up too often.

Over 120 rolls the six faces came up 14, 16, 15, 18, 17 and 40 times.

Answer the design question first: where do the expected counts come from? A fair die makes every face equally likely, so there is no outside split to supply. Leave the `p` argument out and `chisq.test()` assumes every category is equally likely, which is exactly the null you want.

```r
# Meera's loyalty-draw die, 120 rolls, faces 1 through 6 in order.
# Test it against a fair die, where every face is equally likely.
# Leave the p argument out. One line. Press Check when you have it.
die_rolls <- c(14, 16, 15, 18, 17, 40)
```
::check {"regex": "chisq[.]test\\s*[(]\\s*die_rolls", "gate": true, "difficulty": "beginner", "ok": "Yes: X-squared = 24.5 on 5 degrees of freedom, p = 0.000174. A fair die expects 20 rolls per face and face 6 came up 40 times, so that one cell contributes 20 of the 24.5 total. Meera should look at the die.", "no": "This is a goodness-of-fit test with no p argument, so the call is just `chisq.test(die_rolls)`. Leaving p out is what makes every face equally likely."}
::solution
```r
# Test the loyalty-draw die against a fair die
chisq.test(die_rolls)
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  die_rolls
#> X-squared = 24.5, df = 5, p-value = 0.000174
```

Six categories means 5 degrees of freedom. Every face expects 120 divided by 6, which is 20 rolls, and face 6 turned up 40 times. That cell on its own contributes 400 over 20, which is 20 of the 24.5 total.

=== step === concept
## Test of homogeneity: do three branches split the same way?

Meera's third question is about the audit. That week somebody pulled 200 orders from each of her three branches and recorded how each one was paid. Do the three branches split their payments the same way?

Read the design carefully, because this is the one people misname most.

There is only **one variable** measured, payment method. But there are **three separate samples**, one per branch, and the 200 orders per branch were fixed by whoever designed the audit. Those row totals did not fall out of the data. They were decided in advance.

That design is a **test of homogeneity**, and its null hypothesis is that all three branches have the same payment split.

```r
# Build the audit table: 200 orders drawn from each of the three branches
branches <- matrix(c(50, 70, 80,
                     65, 75, 60,
                     35, 55, 110),
                   nrow = 3, byrow = TRUE,
                   dimnames = list(branch  = c("Chennai", "Pune", "Jaipur"),
                                   payment = c("Cash", "Card", "UPI")))
branches
#>          payment
#> branch    Cash Card UPI
#>   Chennai   50   70  80
#>   Pune      65   75  60
#>   Jaipur    35   55 110

branch_test <- chisq.test(branches)
branch_test
#>
#> 	Pearson's Chi-squared test
#>
#> data:  branches
#> X-squared = 27.45, df = 4, p-value = 1.612e-05
```

Three rows and three columns give \((3-1)(3-1)\), which is 4 degrees of freedom. A p-value of 0.0000161 says the three branches do not share one payment split.

The expected counts show what the null was claiming.

```r
# Look at the split the null hypothesis handed to every branch
round(branch_test$expected, 1)
#>          payment
#> branch    Cash Card  UPI
#>   Chennai   50 66.7 83.3
#>   Pune      50 66.7 83.3
#>   Jaipur    50 66.7 83.3
```

All three rows came out identical again, which is the null saying every branch pays the way the pooled 600 audit orders paid. Chennai sits almost exactly on it. Jaipur is the branch pulling away, 15 cash orders light and about 27 UPI orders heavy.

=== step === concept
## Independence and homogeneity run the same arithmetic

Here is the thing that trips people up, and it is worth being blunt about.

Independence and homogeneity do identical arithmetic. They take the same expected counts from the margins, square the same gaps, divide by the same expected counts, and land on the same degrees of freedom and the same p-value. R cannot tell you which one you ran, and neither can its output.

Ask R what it thinks each of Meera's two table tests was.

```r
# Ask R to name each of the two table tests it ran
branch_test$method
#> [1] "Pearson's Chi-squared test"

pay_test$method
#> [1] "Pearson's Chi-squared test"
```

The same label for both. One of them came from a single sample measured twice, the other from three separate samples with their sizes fixed in advance, and the function has no field to record that difference because it never asked.

What differs sits entirely outside the function: which totals were fixed before you collected, and therefore which sentence you are allowed to write.

| | Test of independence | Test of homogeneity |
|---|---|---|
| How many samples | one | one per group |
| What is measured | two variables per unit | one variable per unit |
| Fixed before collecting | only the grand total | the row totals, by design |
| The null says | the two variables are unrelated | every group has the same split |
| The sentence you may write | payment method is associated with age group | the three branches do not share one payment split |

That distinction is not pedantry. Meera's audit sampled 200 orders per branch on purpose, so the row totals carry no information about how busy each branch is. Writing "branch and payment method are associated" would suggest the table says something about branch sizes, and it says nothing whatsoever about them.

=== step === quiz
## Quick check: which of the three does this question need?

Sort these three by design, not by wording:

1. Meera records payment method and age group on all 600 Chennai orders, then asks whether they are related.
2. Meera rolls the loyalty-draw die 120 times and asks whether it is fair.
3. The audit pulls 200 orders from each branch and asks whether the branches split payments the same way.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Independence, independence, homogeneity. ::no
- Independence, goodness of fit, homogeneity. ::ok Exactly. One sample measured twice is independence. One variable against a stated split is goodness of fit. Several samples of fixed size, one variable, is homogeneity.
- Goodness of fit, goodness of fit, independence. ::no
- Homogeneity, goodness of fit, independence. ::no Three tells sort these every time. Count the samples: one sample makes it independence or goodness of fit, several fixed-size samples make it homogeneity. Count the variables: two variables means independence, one variable means the other two. Then ask where the expected counts come from, the table's own margins or an outside claim like a fair die.

=== step === concept
## How big is the difference: Cramer's V and Cohen's w

A small p-value tells you the difference is hard to blame on luck. It does not tell you the difference is big.

The chi-square statistic grows with sample size. If Meera collected 6,000 orders instead of 600 with the exact same splits, the statistic would multiply by ten and the p-value would shrink further, while nothing about her customers changed.

So you need a number that does not grow with \(n\). There are two, one for each shape of table.

For a table with rows and columns, use **Cramer's V**:

\[ V = \sqrt{\frac{\chi^2}{n \times \min(r - 1,\; c - 1)}} \]

Dividing by \(n\) removes the sample size, and dividing by the smaller of the two dimensions minus one caps the result, so V always sits between 0 and 1.

For a goodness-of-fit result there are no rows and columns, so use **Cohen's w**, which is the same idea without the cap:

\[ w = \sqrt{\frac{\chi^2}{n}} \]

Neither ships in base R, and both are one line, so let's write them.

```r
# Two helpers: Cramer's V for a table, Cohen's w for a goodness-of-fit result
cramers_v <- function(test_result, n) {
  tab <- test_result$observed
  sqrt(as.numeric(test_result$statistic) / (n * min(nrow(tab) - 1, ncol(tab) - 1)))
}

cohens_w <- function(test_result, n) {
  sqrt(as.numeric(test_result$statistic) / n)
}

cramers_v(pay_test, n = 600)
#> [1] 0.3215476

cramers_v(branch_test, n = 600)
#> [1] 0.1512448

cohens_w(fit_test, n = 600)
#> [1] 0.1290994
```

Cohen's conventional reading for both is 0.1 small, 0.3 medium and 0.5 large, and those are rough guides rather than verdicts.

So the age and payment link comes in at V = 0.32, a moderate association. The branch audit, whose p-value was the smallest of the three, comes in at V = 0.15, half that. And the mismatch with the head office split comes in at w = 0.13, barely above small, even though its p-value was 0.0067. Those two numbers answer two different questions, and Meera needs both of them in the same sentence.

=== step === concept
## Which cells carry the difference: standardized residuals

A significant chi-square test names no cell. It says the table as a whole is far from what the boring story expected, and then it stops. To find out where the difference actually sits, you look at the residuals.

The raw gap in a cell is \(O - E\). That is not comparable across cells, for the same reason the raw gaps were not comparable when we built the statistic. A **standardized residual** divides each gap by its own standard error, which puts every cell on a common scale:

\[ \text{stdres} = \frac{O - E}{\sqrt{E \left(1 - \frac{\text{row total}}{n}\right)\left(1 - \frac{\text{column total}}{n}\right)}} \]

R already computed these and parked them in the fitted object.

```r
# See which cells carry the difference between age group and payment method
round(pay_test$stdres, 2)
#>              payment
#> age_group      Cash  Card   UPI
#>   Under 30    -5.66 -2.57  7.50
#>   30 or older  5.66  2.57 -7.50
```

Standardized residuals behave roughly like z-scores, so the working rule is that anything past 2 in absolute value is a cell worth reporting, and anything past 3 is a cell that is really driving the result.

Under-30 UPI sits at 7.50, far and away the largest. That is the same cell that contributed 16.875 to the statistic, the biggest of the six, and now it has a sign attached: positive, meaning the observed count is above expected. Under-30 cash comes in at -5.66, well below expected.

A tile plot makes the pattern jump out, and it stays readable when tables get bigger than this one.

```r
# Draw the standardized residuals as a tile plot
library(ggplot2)

resid_df <- as.data.frame(pay_test$stdres)

ggplot(resid_df, aes(x = payment, y = age_group, fill = Freq)) +
  geom_tile(colour = "white") +
  geom_text(aes(label = round(Freq, 1)), size = 5) +
  scale_fill_gradient2(low = "steelblue", mid = "white", high = "firebrick",
                       midpoint = 0) +
  labs(title = "Standardized residuals, age group by payment method",
       x = "Payment method", y = "Age group", fill = "Std. residual") +
  theme_minimal(base_size = 13)
```

Red cells run above expected, blue cells below, and a white cell sits where the boring story put it. Now Meera has a sentence with something in it: her under-30 customers reach for UPI and skip cash, and her older customers do the reverse.

=== step === quiz
## Quick check: a tiny p-value with a small effect size

The Chennai counter against the head office split came back with X-squared = 10, df = 2 and p = 0.006738, and Cohen's w for that result was 0.13. What should Meera write down?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- Nothing, because w = 0.13 is small, so the result is not real. ::no
- The split is badly wrong, because p = 0.0067 is well under 0.05. ::no
- The two numbers disagree, so one of them must have been computed incorrectly. ::no A p-value and an effect size answer different questions, so they cannot contradict each other. The p-value asks whether luck can explain the gap, and here it cannot. Cohen's w asks how wide the gap is, and 0.13 says narrow. Read them together and the answer is real, and small.
- The mismatch is real but small: Chennai is genuinely off the head office split, by about 30 orders each on cash and card out of 600. ::ok Right. The p-value says the mismatch is hard to blame on luck, and w = 0.13 says it is a small one. Both are true at once, and reporting only the p-value would make a 30-order drift sound like a crisis.

=== step === concept
## The assumption that breaks first: expected counts under 5

Every chi-square test assumes three things, and only one of them tends to bite.

1. **The observations are independent.** One order tells you nothing about the next. This one is about how the data was collected, and no diagnostic in R can rescue it after the fact.
2. **The cells hold raw counts.** Not percentages, not proportions, not averages. Whole orders.
3. **The expected counts are large enough.** The usual rule is that every expected count reaches 5. This is the one that fails in practice, and it fails whenever a category is rare or the sample is small.

That third rule exists because the chi-square curve is an approximation. It describes what the statistic does in large samples, and in small ones it drifts off, so the p-value comes back wrong.

Checking it takes one line, because the expected counts are already sitting in the fitted object.

```r
# Check the smallest expected count on each of Meera's two tables
min(pay_test$expected)
#> [1] 75

min(branch_test$expected)
#> [1] 50
```

Both clear the bar comfortably. Now here is a table that does not. Meera also runs a tiny kiosk and a market cart, and one slow afternoon they took 20 orders between them.

```r
# Run the test on a table too small for the chi-square approximation
tiny <- matrix(c(9, 1, 3, 7), nrow = 2, byrow = TRUE,
               dimnames = list(stall   = c("Kiosk", "Cart"),
                               payment = c("Cash", "UPI")))

tiny_test <- chisq.test(tiny)
#> Warning message:
#> In chisq.test(tiny) : Chi-squared approximation may be incorrect

tiny_test$expected
#>        payment
#> stall   Cash UPI
#>   Kiosk    6   4
#>   Cart     6   4
```

R warned you, which is more than most software does, and that warning is the one people paste into a search box without reading. It means two of the four expected counts are under 5, so the p-value it just printed is not trustworthy.

There are two fixes, and which one you use depends on the table.

- **Use Fisher's exact test instead.** `fisher.test(tiny)` computes an exact p-value by counting arrangements rather than leaning on a curve. That is the right move for a small table.
- **Merge sparse categories, when merging is honest.** If three payment methods each drew four orders and they genuinely belong together, one combined category can lift every expected count over 5. Never merge categories just to clear the rule.

[WARNING]
The rule is about expected counts, not observed ones. A cell can hold zero observed orders and still be fine, as long as the count it expected reaches 5.

=== step === concept
## Three ways to get a wrong answer with no error message

None of these three raises an error. They print a confident-looking result and hand you the wrong number.

**One: passing proportions where counts belong.** `chisq.test()` takes it on faith that your numbers are counts. Feed it the same information as proportions and the statistic collapses, because the statistic is built out of sample size.

```r
# Pass the same payment split as counts and then as proportions
counts_version      <- c(Cash = 150, Card = 210, UPI = 240)
proportions_version <- counts_version / sum(counts_version)

chisq.test(counts_version, p = national)$p.value
#> [1] 0.006737947

chisq.test(proportions_version, p = national)$p.value
#> [1] 0.9917013
#> Warning message:
#> In chisq.test(proportions_version, p = national) :
#>   Chi-squared approximation may be incorrect
```

Same split, same claim, and the p-value goes from 0.0067 to 0.99. The proportions version quietly told R the sample size was 1.

R does grumble here, but read what it actually says. It doubts the approximation, because expected counts of 0.3 and 0.4 sit far under 5. It has no idea you meant orders. The warning names a symptom and never the mistake.

**Two: sending a finished table through `table()` a second time.** This one bites when the data arrives already tabulated. `table()` counts occurrences of whatever you give it, so handing it a table of counts gives you a count of the counts.

```r
# Send an already-tabulated table through table() one more time
table(pay_age)
#> pay_age
#>  45  75  90 105 120 165
#>   1   1   1   1   1   1
```

Six counts, each appearing once. Pass that on to a test and you get a real p-value for a completely meaningless question.

**Three: forgetting that 2 by 2 tables get corrected by default.** On any 2 by 2 table, `chisq.test()` applies Yates' continuity correction without mentioning it, which shrinks the statistic and pushes the p-value up. It exists because a smooth curve is being asked to read counts that only ever move in whole steps, so it trims half an order off every gap before squaring.

```r
# Compare the same 2 by 2 table with and without Yates correction
yates_on  <- chisq.test(tiny)
yates_off <- chisq.test(tiny, correct = FALSE)

c(with_correction = yates_on$p.value, without = yates_off$p.value)
#> with_correction         without
#>     0.022478873     0.006169899
```

Nearly a factor of four between them, on identical data. The correction is the default and is usually the safer choice on small 2 by 2 tables, but you should know it is happening, especially when your output disagrees with somebody else's who turned it off.

=== step === concept
## How to name the test in three seconds

You do not name a chi-square test from how the question is worded. You name it from how the data was collected. Three questions do it, in this order.

1. **How many samples did you draw?** One sample makes it independence or goodness of fit. Several samples, with their sizes fixed by you, makes it homogeneity.
2. **How many variables did you measure on each unit?** Two variables means independence. One variable means goodness of fit or homogeneity.
3. **Where do the expected counts come from?** From the margins of your own table, or from an outside claim like a fair die or a head office target.

Those three answers land you on one column of this table, and the column carries everything you need to write the result.

| | Test of independence | Goodness of fit | Test of homogeneity |
|---|---|---|---|
| Samples | one | one | one per group, sizes fixed |
| Variables measured | two | one | one |
| Expected counts come from | the table margins | an outside claim | the table margins |
| Degrees of freedom | \((r-1)(c-1)\) | \(k - 1\) | \((r-1)(c-1)\) |
| The R call | `chisq.test(tbl)` | `chisq.test(x, p = probs)` | `chisq.test(tbl)` |
| Effect size | Cramer's V | Cohen's w | Cramer's V |
| Meera's version | payment against age, 600 orders | Chennai against head office | three branches, 200 each |

Notice that the first and third columns take their expected counts from the same place, share the same degrees of freedom, the same R call and the same effect size. Everything that separates them sits in those top two rows, how many samples you drew and how many variables you measured on each one. And that is the whole point: the design names the test, and the design lives in how you got the data, never in the numbers themselves.

=== step === quiz
## Quick check: name the test for three new questions

Three fresh questions, none of them about Meera's bakery:

1. A hospital records blood type and whether each of 800 walk-in patients was admitted, then asks whether the two are related.
2. A quality team samples 150 units from each of four production lines and asks whether the defect-type breakdown is the same across lines.
3. A geneticist counts 400 offspring by phenotype and asks whether they follow the 9:3:3:1 ratio the theory predicts.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Independence, homogeneity, goodness of fit. ::ok Exactly right. One sample measured on two variables, then four fixed-size samples measured on one variable, then one variable against a ratio that came from outside the data.
- Homogeneity, homogeneity, goodness of fit. ::no
- Independence, independence, homogeneity. ::no
- Goodness of fit, homogeneity, independence. ::no Work the design, not the wording. The hospital drew one sample of 800 and measured two things on each patient, which is independence. The quality team fixed 150 units per line in advance, which is four samples of one variable, so homogeneity. The 9:3:3:1 ratio came from theory rather than from the data's own margins, which makes the third one goodness of fit.

=== step === quiz
## Quick check: what may you claim from this output?

Meera has two results in front of her. The branch audit gave X-squared = 27.45 on 4 degrees of freedom with p = 0.0000161, and Cramer's V works out at 0.151. A second table, comparing packaging choice across two weekend stalls, gave p = 0.03 with two of its four expected counts below 5.

Which pair of claims survives both?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Both results are solid, because both p-values cleared 0.05. ::no
- Neither result can be used, because V = 0.151 is small and the second table broke the expected-count rule. ::no
- The branches genuinely differ in payment split but by a small amount, and the stalls result needs an exact test before any claim is made. ::ok That is the reading. A small V does not cancel a real difference, it sizes it. And a broken expected-count rule does not make the second table wrong, it makes its p-value untrustworthy until an exact test replaces it.
- The branch result proves that being in Jaipur causes customers to use UPI. ::no A chi-square test never names a cause, and a small effect size never cancels a real difference. The branch result is dependable and modest, worth about 0.151 on the 0 to 1 scale. The stalls result is not dependable yet, because expected counts under 5 make the chi-square curve the wrong yardstick, and an exact test settles it.

=== step === tryit
## Your turn: run the right test on the Jaipur branch

The audit table showed Jaipur pulling away from the other two branches. Meera now wants something narrower: does Jaipur on its own match the split head office quotes?

Work the design before you write any code. That is one branch, one variable, and an expected split that comes from outside the data, so this is not the homogeneity question the full audit table answered.

`jaipur` holds that branch's 200 audit orders and `national` holds the head office claim. Run the test this question needs, then size the difference with the `cohens_w()` helper.

```r
# jaipur holds Jaipur's own 200 audit orders: Cash 35, Card 55, UPI 110.
# national holds the head office claim: 30% cash, 30% card, 40% UPI.
# Run the test this question needs, then size it with cohens_w(). Two lines.
# Press Check when you have them.
jaipur <- branches["Jaipur", ]
```
::check {"regex": "chisq[.]test\\s*[(]\\s*jaipur\\s*,\\s*p\\s*=", "gate": true, "difficulty": "intermediate", "ok": "Yes: X-squared = 22.083 on 2 degrees of freedom, p = 0.000016, and w = 0.33. Jaipur is well off the head office split, and unlike the earlier 0.13 this is a medium-sized gap: 25 cash orders short and 30 UPI orders over.", "no": "One branch measured on one variable against an outside claim is a goodness-of-fit question, so you need the p argument: `chisq.test(jaipur, p = national)`. Then pass the fitted object to `cohens_w(jaipur_test, n = 200)`."}
::solution
```r
# Test the Jaipur split against the head office claim, then size the difference
jaipur_test <- chisq.test(jaipur, p = national)
jaipur_test
#>
#> 	Chi-squared test for given probabilities
#>
#> data:  jaipur
#> X-squared = 22.083, df = 2, p-value = 1.602e-05

cohens_w(jaipur_test, n = 200)
#> [1] 0.33229
```

Expected counts were 60 cash, 60 card and 80 UPI. Jaipur delivered 35, 55 and 110, so cash is 25 orders light and UPI is 30 orders heavy, and w = 0.33 puts that at a medium-sized gap rather than a small one.

Here is the sentence Meera can write: Jaipur's payment split differs from the head office target, X-squared = 22.08, df = 2, p less than 0.001, with a medium effect size of w = 0.33, driven by customers moving off cash and onto UPI.

=== step === concept
## References

- [Test of independence and goodness of fit with chisq.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/chisq.test.html) - R Core Team, the documentation for `chisq.test()`, including the `p` argument, the Yates correction default on 2 by 2 tables, and the expected-count warning.
- [On the criterion that a given system of deviations from the probable in the case of a correlated system of variables is such that it can be reasonably supposed to have arisen from random sampling](https://doi.org/10.1080/14786440009463897) - Pearson (1900), Philosophical Magazine 50(302), 157 to 175. The paper the statistic comes from.
- [Some methods for strengthening the common chi-square tests](https://doi.org/10.2307/3001616) - Cochran (1954), Biometrics 10(4), 417 to 451. The source of the expected-count rule of thumb.
- [The use and misuse of chi-square: Lewis and Burke revisited](https://doi.org/10.1037/0033-2909.94.1.166) - Delucchi (1983), Psychological Bulletin 94(1), 166 to 176. A catalogue of how chi-square gets misapplied, the proportions mistake included.
- [An Introduction to Categorical Data Analysis](https://doi.org/10.1002/0470114754) - Agresti (2007), 2nd edition, Wiley. Chapter 2 is the standard treatment of independence against homogeneity, and of residuals.

=== step === complete
## Quick recap

Three tests share one name, and you can now tell them apart from the data alone.

- **All three run the same machine.** Count what you saw, work out what the boring story expects, add up \((O-E)^2/E\) across the cells, and read the total against the chi-square curve for your degrees of freedom. Meera's age by payment table gave 62.04 on 2 degrees of freedom.
- **Only the expected counts change.** Independence and homogeneity take them from the table's own margins. Goodness of fit takes them from an outside claim, like a fair die or a head office target.
- **The design names the test, not the wording.** Count the samples, count the variables measured on each unit, and ask where the expected counts came from.
- **Report three things, never just one.** Whether the difference is there, from the p-value. How big it is, from Cramer's V for a table or Cohen's w for a fit. And where it sits, from the standardized residuals, where anything past 2 is worth naming.
- **Check the expected counts before you trust the p-value.** Every one should reach 5. When they do not, R warns you, and Fisher's exact test is the fix.

Meera's week, written out properly: payment method is associated with age group at the Chennai counter, X-squared = 62.04, df = 2, p less than 0.001, Cramer's V = 0.32, driven by under-30 customers choosing UPI over cash with a standardized residual of 7.5.

That is a sentence a manager can act on, and it took three numbers instead of one.

So the next time a table of counts lands on your desk, do not start with the function. Start with how the counts were collected, and the function picks itself. Have a great day!
