---
title: "Which statistical test to use? A 5-question decision flowchart"
slug: "Which-Test-Mini-1"
description: "Three branch averages, a dozen possible tests, and no idea which one fits. Five plain questions about your data name the test the situation needs, in R."
keywords: "which statistical test to use, choosing a statistical test in R, statistical test decision flowchart, t-test vs ANOVA, paired vs independent samples, parametric vs non-parametric test, chi-square test in R"
mathjax: false
webr: true
date: "2026-08-23"
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
catalog_blurb: "Five plain questions about your data that lead you to the right test."
---

=== step === cover
::eyebrow Which Test Do I Run?
## Which statistical test to use? A 5-question decision flowchart

You have the average order value from three branches of a coffee chain in front of you: Riverside, Airport and Downtown. The three numbers are not the same, and your manager asks the obvious thing. Is the difference real? Does one branch actually do better than the others?

And you freeze.

Not because you cannot do statistics. You freeze because there are a dozen tests you could possibly run, and nothing in front of you says which one this situation precisely needs. The t-test, ANOVA, Mann-Whitney and chi-square are all sitting there, and every one of them is the right answer somewhere and the wrong answer here.

So here is what ends the freeze. You never pick a test by staring at the tests. You pick it by asking five plain questions about your own data, and each answer you give throws away whole families of wrong ones.

::widget process-flow {"steps":[{"title":"Number or label?","sub":"what you measured decides which half of the chart"},{"title":"How many groups?","sub":"one against a fixed value, two, or three and more"},{"title":"Paired or independent?","sub":"the same people measured twice, or different people"},{"title":"Roughly normal?","sub":"the shape inside each group, checked before you test"},{"title":"How big is the difference?","sub":"the size of the gap, which no p-value gives you"}]}

Answer those five about the coffee chain and exactly one test is left standing. We are going to do that together on the real receipts, and then take the same five questions to a before and after comparison, to delivery times with a long tail on the right, and to a yes or no outcome, until you can walk the chart without looking at it.

=== step === concept
## The three branches and their average order values

Let's get the receipts on the table first, because every question from here on is a question about them.

We took one Tuesday and pulled 60 receipts from each of the three branches, 180 in all. Each receipt gives one number, which is the value of that order in dollars. The block below builds those 180 receipts right here on the page, so you can run everything yourself and get the same answers I get.

```r
# Build the 180 receipts and show the average order value per branch
set.seed(4)
orders <- data.frame(
  branch = rep(c("Riverside", "Airport", "Downtown"), each = 60),
  value  = round(rnorm(180, mean = rep(c(8.20, 9.60, 8.35), each = 60), sd = 2.40), 2)
)

round(tapply(orders$value, orders$branch, mean), 2)
#>   Airport  Downtown Riverside 
#>      9.45      8.09      8.74 
```

`tapply()` splits the `value` column by `branch` and takes the mean of each piece, so those three numbers are the three branch averages.

Airport is ahead. It takes $9.45 an order against $8.74 at Riverside and $8.09 at Downtown, which puts it $1.36 an order above Downtown. Across a few thousand orders a week that is real money, and it is exactly the kind of gap a manager wants to act on.

So can we say Airport does better? Not yet. The reason is sitting underneath those three averages.

```r
# Draw the spread of order values inside each branch, then put a number on it
boxplot(value ~ branch, data = orders,
        col = "grey85", border = "grey35",
        main = "Order value by branch, one Tuesday",
        xlab = "Branch", ylab = "Order value in dollars")

round(tapply(orders$value, orders$branch, sd), 2)
#>   Airport  Downtown Riverside 
#>      2.17      2.54      2.19 
```

The three boxes overlap almost completely. Every branch's middle half of receipts sits inside the same band, because some people buy one coffee and some buy coffee and a sandwich for a colleague. The standard deviation underneath puts a figure on that swing: order values wobble by $2.17 to $2.54 within a single branch, while the whole gap between the best branch average and the worst is $1.36. The noise is bigger than the signal.

That is the problem in one line. Three averages that differ do not tell you the branches differ, because averages built out of noisy orders would differ a little even if all three branches were identical. Something has to weigh the gap against the noise, and that something is a statistical test.

Now, which one?

=== step === concept
## Question 1: is your outcome a number or a label?

The first question is about the thing you measured, and people get it wrong by pointing at the wrong column.

Your outcome is what you are trying to explain, and here that is the value of an order. Branch is not the outcome. Branch is the thing that splits the receipts into groups. Swap those two round and everything after this answers a question you never asked.

Let's have R tell us what each column holds.

```r
# Check what kind of thing each column of the receipts table holds
str(orders)
#> 'data.frame':	180 obs. of  2 variables:
#>  $ branch: chr  "Riverside" "Riverside" "Riverside" "Riverside" ...
#>  $ value : num  8.72 6.9 10.34 9.63 12.13 ...

class(orders$value)
#> [1] "numeric"

class(orders$branch)
#> [1] "character"
```

`num` and `numeric` mean the same thing: a measurement on a scale where the gaps carry meaning. An $11 order really is $3 more than an $8 order, and halfway between them really is $9.50. `chr` is a character label. Airport is not two more than Downtown, it is a different name, and there is no halfway between them.

That single answer picks your half of the chart.

- A **number** as the outcome sends you to the t-test and ANOVA family, and to their rank-based partners when the numbers are badly shaped.
- A **label** as the outcome sends you to chi-square and Fisher's exact test.

Order value is a number, so we are in the first family. One question answered, four to go.

[KEY INSIGHT]
Ask what was measured on each row, not what the columns are called. If you could sensibly average it, it is a number. If averaging it would be nonsense, it is a label.

=== step === concept
## Question 2: how many groups are you comparing?

Now count the groups you are putting side by side. There are only three answers, and each one leads somewhere different.

1. **One group against a fixed number.** You have order values from a single branch and head office says the target is $9.00. That is a one-sample test.
2. **Two groups against each other.** Airport against Downtown, and nothing else in the comparison.
3. **Three or more groups at once.** Riverside, Airport and Downtown together.

Let R count them for us.

```r
# Count how many receipts came from each branch
table(orders$branch)
#> 
#>   Airport  Downtown Riverside 
#>        60        60        60 
```

Three branches, 60 receipts each. So we are in the third case, and that case has a consequence people walk straight into.

The obvious move is to run three t-tests: Riverside against Airport, Airport against Downtown, Downtown against Riverside. It feels thorough. It is also how you manufacture a false alarm.

A test at the 5% level is allowed to raise a false alarm 5% of the time when nothing is going on. Run one test and your risk is 5%. Run three and the chance that at least one of them raises a false alarm is one minus the chance that all three stay quiet, which for three independent tests is this.

```r
# The chance at least one of three independent tests raises a false alarm at 5%
1 - 0.95^3
#> [1] 0.142625
```

About 14%. You set out to work at a 5% false-alarm rate and actually worked at 14%, and nothing in the output tells you so.

[WARNING]
Never split a three-group comparison into three two-group tests. Run one test that looks at all three groups at once, and only then go back and ask which pair differs. The single test holds the false-alarm rate at the 5% you asked for.

Three groups, one test. Question two is answered.

=== step === quiz
## Quick check: which column is the outcome, and how many groups?

Here is the same coffee chain with a new question. The till also records the tip left on each receipt, in dollars. Someone asks whether the tip differs across Riverside, Airport and Downtown.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The outcome is branch, and there are three groups. ::no
- The outcome is the tip, and there are 180 groups, one per receipt. ::no
- The outcome is the tip, and there are three groups. ::ok Exactly. The tip is the thing being measured and explained, and branch is what splits the receipts into three groups. A number as the outcome with three groups puts this question in the same corner of the chart as the order-value question.
- The outcome is branch, and there are 180 groups. ::no The outcome is always the thing you measured and want to explain, which here is the tip. Branch is the splitter, and it splits the receipts into three groups, not 180. Counting rows instead of counting group labels is the usual slip.

=== step === concept
## Question 3: same people twice, or different people?

This answer has the biggest consequence of the five and the fewest clues in the data. Two datasets can look identical on screen and still need different tests.

**Independent** means the two groups are made of different people. A receipt from Riverside and a receipt from Airport came from two customers who never met. Nothing links row 12 of one group to row 12 of the other.

**Paired** means every measurement has exactly one partner. Think of the same customer measured twice, the same store measured in two different weeks, or the same person's left hand against their right. Row 12 here belongs with row 12 there, and that pairing is a fact about how the data was collected, not something you can read off the numbers.

Here is a paired version of a coffee question. The Airport branch put up a new menu board, and 20 regulars had their order value recorded in the week before and again in the week after. That is the same 20 people, measured twice.

```r
# Build the before and after order values for the same 20 Airport regulars
set.seed(7)
board_before <- round(rnorm(20, mean = 9.60, sd = 2.20), 2)
board_after  <- round(board_before + rnorm(20, mean = 0.90, sd = 1.10), 2)

menu_board <- data.frame(
  regular = 1:20,
  before  = board_before,
  after   = board_after
)

head(menu_board)
#>   regular before after
#> 1       1  14.63 16.45
#> 2       2   6.97  8.65
#> 3       3   8.07 10.41
#> 4       4   8.69  8.06
#> 5       5   7.46  9.76
#> 6       6   7.52  8.62
```

Read one row at a time. Regular 1 spent $14.63 before and $16.45 after. Regular 2 spent $6.97 and then $8.65. Both numbers on a row belong to one person, so the $1.82 change for regular 1 is a real quantity you can compute. That is what paired means.

Now look at the receipts table for contrast.

```r
# Look at the layout of the independent receipts table
head(orders)
#>      branch value
#> 1 Riverside  8.72
#> 2 Riverside  6.90
#> 3 Riverside 10.34
#> 4 Riverside  9.63
#> 5 Riverside 12.13
#> 6 Riverside  9.85
```

That is one column of numbers, one column of labels and one row per receipt. There is nothing to subtract here, because row 1 of Riverside has no relationship to row 1 of Airport.

Why does the answer change the test? Because regular 1 is a big spender and regular 2 is not, and the difference between people is much larger than anything a menu board can do. An independent test has to carry all of that person to person spread as noise it must beat. A paired test subtracts each person from themselves first, so the only spread left is the spread in the changes.

[KEY INSIGHT]
Pairing is a property of the study, not of the numbers. If every measurement in one group has exactly one partner in the other, you have to say so in the test, because the test cannot see it.

=== step === quiz
## Quick check: paired or independent?

Here are three small studies at the same chain. Work out which ones are paired.

A. Every one of 40 customers is timed at the counter on a Monday and timed again on a Friday.

B. 30 receipts from Riverside are compared with 30 different receipts from Airport.

C. 25 pairs of customers are matched on age and usual order, then one of each pair is handed a loyalty card and the other is not.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Only A is paired, since it is the only one that measures the same person twice. ::no
- A and C are paired, and B is independent. ::ok Yes. A measures the same customer twice, and C builds the partner deliberately by matching, so in both of them every measurement has exactly one partner. B is 60 different customers with nothing linking them.
- All three are paired, since every study compares two sets of measurements. ::no
- Only C is paired. A is independent, because a Monday visit and a Friday visit are two separate visits. ::no Pairing means every measurement has exactly one partner. In A the partner is the same customer on the other day. In C the partner is the person they were matched to on age and usual order. Only B has no partners at all, because those are 60 different customers, so B is the only independent study of the three.

=== step === widget
## What every test does with your data, and what its p-value means

Before we get to question four, let's look at what all of these tests have in common, because it makes the rest of the chart much easier to read.

Whichever test the five questions name, it does the same two things. First it squeezes your whole dataset down to one number, called the test statistic. For a t-test that number is the gap between two means measured in units of noise. For an ANOVA it is the spread between the group averages compared with the spread inside the groups. The recipes differ, and the job is the same: one number that gets larger the further your data sits from ordinary.

Then it asks a single question about that number. If nothing were going on, if the branches were truly identical, how often would this statistic land that far out or further? That share is the p-value.

The curve below is what the statistic does when nothing is going on. Most of the time it lands near zero, and now and then luck pushes it out. The slider is not in dollars or minutes, it is in widths of that noise, which is the only scale every test shares. Drag it to move your result away from zero and watch the shaded tail.

::widget null-distribution {"tails": 2, "start": 2.15, "label": "how far your result sits from no difference"}

The shaded orange area is the p-value. It starts at 2.15 noise widths out, which the readout puts at p = 0.032. Push your result further out and the tail shrinks, because a result that far out is a rare thing for luck to produce. Pull it back toward zero and the tail swells, because ordinary noise turns out results like that all the time. The line under the picture says reject H0 once the tail drops below 0.05. H0 is shorthand for the story the test starts from, which is that nothing is going on and the groups are the same.

Two things follow, and both matter for the chart.

Every test on the flowchart is read this same way. A small p-value means your data would be unusual if the groups were identical. It never means the difference is large.

And the five questions matter because each test works out that tail differently. The t-test assumes a particular shape, the rank tests do not, the paired version subtracts partners first. Hand a test the wrong situation and it still gives you a p-value. It is just answering a question about data you do not have.

=== step === concept
## Question 4: is the data roughly normal, and where do you check?

The t-test and ANOVA work out that tail assuming the values in each group are roughly bell shaped. When they are not, the tail comes from the wrong shape, and the p-value that comes back is not the number you think it is.

Two things trip people up here. The first is where to look. The shape that matters is the shape inside each group, never the shape of the whole column stacked together. Pool three branches with different averages and the pile can look lumpy even when each branch on its own is a clean bell.

The second is that you look before you test, not after the result disappoints you. Let's do that on the receipts.

```r
# Draw the shape of the order values separately for each branch
par(mfrow = c(1, 3))
for (b in c("Riverside", "Airport", "Downtown")) {
  hist(orders$value[orders$branch == b],
       breaks = 12, col = "grey85", border = "white",
       main = b, xlab = "Order value in dollars")
}
par(mfrow = c(1, 1))
```

You get three piles, each heaped in the middle and thinning off on both sides. No value sits far out on its own and neither tail runs long. That is what roughly bell shaped looks like with 60 numbers.

A histogram of 60 values is lumpy whatever the truth is, so there is a second picture that reads shape more precisely. A normal quantile plot sorts your values and plots each one against the value a perfect bell would have put in that position. If the data really is bell shaped, the dots fall along the straight line.

```r
# Compare each branch against the straight line a perfect bell would give
par(mfrow = c(1, 3))
for (b in c("Riverside", "Airport", "Downtown")) {
  qqnorm(orders$value[orders$branch == b], main = b)
  qqline(orders$value[orders$branch == b], col = "red", lwd = 2)
}
par(mfrow = c(1, 1))
```

The dots track the red line in all three, wandering a little at the two ends, which is what 60 values always do. What you are looking for is a bend into a curve, or a run of dots sitting well off the line at one end. There is none of that here.

=== step === concept
## What changes when a group is not normal

Pictures are how you judge shape. There is also a test that puts a number on it. The Shapiro-Wilk test asks how far a set of values sits from bell shaped, and its p-value comes back small when they do not look normal.

```r
# Put a number on the shape of each branch with the Shapiro-Wilk test
round(tapply(orders$value, orders$branch, function(v) shapiro.test(v)$p.value), 4)
#>   Airport  Downtown Riverside 
#>    0.5521    0.2392    0.4998 
```

Read this p-value backwards from every other one you have seen so far. A small value here is the bad news, because it says the shape is unlikely to have come from a bell. All three sit well above 0.05, so nothing argues against normal, and the pictures said the same.

Two warnings about leaning on that number too hard.

With a small group the test can barely tell anything apart, so it passes almost everything you give it. With a very large group it fails almost everything, because a wobble too small for anyone to care about is still detectable in 5,000 values. The picture is the better judge and the number is a second opinion.

The assumption is also more forgiving than it sounds. Once each group holds more than about 30 values, mild skew stops mattering much for the t-test and ANOVA. What those tests really need is for the group averages to be bell shaped, and an average of 30 numbers is far closer to a bell than the 30 raw numbers are. Heavy skew and outliers in small groups are the real problem.

When the shape is genuinely wrong, you do not drop the question. Every test in the family has a rank-based partner. The partner throws the raw values away, keeps only their order from smallest to largest, and runs the comparison on those positions, so the shape of the numbers stops mattering.

| Situation | If roughly normal | If not |
|---|---|---|
| Two independent groups | t-test, `t.test()` | Mann-Whitney, `wilcox.test()` |
| Two paired groups | paired t-test, `t.test(paired = TRUE)` | Wilcoxon signed-rank, `wilcox.test(paired = TRUE)` |
| Three or more independent groups | one-way ANOVA, `aov()` | Kruskal-Wallis, `kruskal.test()` |

Those two columns have names you will meet everywhere. The left one holds the **parametric** tests, so called because they assume the values follow a particular shape and then work from the parameters of it. The right one holds the **non-parametric** or rank-based tests, which assume no shape at all.

Same rows, same questions, and only the column changes. That is all question four does: read the shape inside each group, then pick your column.

=== step === tryit
## Your turn: check the shape of one branch

The 60 Airport order values are pulled out into a vector called `airport` in the block below. Run the shape check on it, then read the answer as a decision: does Airport stay in the parametric column, or does it move across to the rank-based one?

```r
# Pull the 60 Airport order values out into one vector to work with
airport <- orders$value[orders$branch == "Airport"]
# Now run the Shapiro-Wilk shape check on airport.
# One line. Press Check when you have it.
```
::check {"regex": "shapiro[.]test\\s*[(]\\s*airport", "gate": true, "difficulty": "beginner", "ok": "Right: W = 0.98269 and p = 0.5521. Nothing there argues against a bell, so Airport stays in the parametric column and the t-test and ANOVA family is still available.", "no": "The function is shapiro.test() and the vector is already made for you, so the whole answer is shapiro.test(airport)."}
::solution
```r
# Check whether the Airport branch's order values look bell shaped
shapiro.test(airport)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  airport
#> W = 0.98269, p-value = 0.5521
```

A p-value of 0.5521 is nowhere near 0.05, so there is no evidence against normal here. Had it come back at 0.001 with a histogram leaning hard to one side, the same row of the table would have sent you to `wilcox.test()` or `kruskal.test()` instead.

=== step === concept
## Four answers, one test: the store lands on one-way ANOVA

Line up what the coffee chain has answered so far.

1. The outcome is a **number**: order value in dollars.
2. There are **three groups**: Riverside, Airport and Downtown.
3. The groups are **independent**: 180 different receipts, no partners.
4. Each group is **roughly normal**, by the pictures and by the shape test.

Four answers, and exactly one test survives them. It is the one-way ANOVA. One way because one thing splits the groups, and here that thing is the branch.

```r
# Run the one-way ANOVA comparing order value across the three branches
branch_test <- aov(value ~ branch, data = orders)
summary(branch_test)
#>              Df Sum Sq Mean Sq F value  Pr(>F)   
#> branch        2   55.7  27.864   5.245 0.00613 **
#> Residuals   177  940.4   5.313                   
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Read `value ~ branch` as "order value explained by branch". Now the numbers.

The `branch` row measures the variation between the three branch averages. The `Residuals` row measures the variation between individual receipts inside a branch, which is the customer to customer swing the boxplot showed. `Mean Sq` puts the two on the same footing, and `F value` is the first divided by the second: 27.864 over 5.313, which is the 5.245 printed in the output.

That is the whole idea in one number. F asks how big the gaps between branches are compared with the ordinary churn inside them. If the three branches were identical, F would hover around 1. Here it is 5.2.

`Pr(>F)` is the p-value, and it reads 0.00613. If all three branches really did have the same average order value, ordinary customer variation would still spread the branch averages this far apart about 6 times in every 1,000 Tuesdays. That is rare enough to stop believing the three branches are the same.

Five questions, and the freeze is gone. The chart put one test in front of you and it ran.

=== step === concept
## Question 5: how big is the difference?

The ANOVA said the branches are not all the same. It said nothing about how much they differ, and that is a separate question with a separate answer. Ask both every time, because a p-value can be tiny for a gap nobody would act on.

The first size number is eta-squared, the share of all the variation in order value that branch accounts for. The ANOVA table already holds both pieces you need: the branch row's sum of squares, over the total of that column. `summary(branch_test)[[1]]` is how you get that printed table back as a data frame you can index by row and column name.

```r
# Work out the share of the variation in order value that branch accounts for
anova_table <- summary(branch_test)[[1]]
eta_squared <- anova_table[1, "Sum Sq"] / sum(anova_table[, "Sum Sq"])
round(eta_squared, 3)
#> [1] 0.056
```

Branch accounts for 5.6% of the variation in order value. The other 94.4% is customers differing from each other inside the same branch. Cohen's rough benchmarks put 0.01 at small, 0.06 at medium and 0.14 at large, so this sits at medium: a real difference, and nowhere near the main story of what people spend.

The second size number is the more practical one. The ANOVA is a single verdict on all three branches at once, so it cannot tell you which branch differs from which. Tukey's test goes back and compares every pair in dollars, while holding the false-alarm rate for the whole set of comparisons at 5%.

```r
# Compare every pair of branches, in dollars, with the false-alarm rate held at 5%
TukeyHSD(branch_test)
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = value ~ branch, data = orders)
#> 
#> $branch
#>                          diff        lwr        upr     p adj
#> Downtown-Airport   -1.3625000 -2.3571599 -0.3678401 0.0040907
#> Riverside-Airport  -0.7111667 -1.7058266  0.2834933 0.2118774
#> Riverside-Downtown  0.6513333 -0.3433266  1.6459933 0.2712782
```

`diff` is the gap in dollars, `lwr` and `upr` mark the range the true gap plausibly sits in, and `p adj` is the p-value after correcting for having made three comparisons.

Only one row clears 0.05. Downtown takes $1.36 less an order than Airport, and the plausible range for that gap runs from $0.37 to $2.36. The other two pairs have ranges that cross zero, so on this Tuesday's receipts they could just as easily be tied.

That gives a manager something far more useful than "the branches differ". Airport is ahead of Downtown by about $1.36 an order, somewhere between 37 cents and $2.36, and Riverside is not clearly ahead of anybody.

[TIP]
Report the size beside the p-value every time. The p-value says the gap is more than noise. The size says whether the gap is worth doing anything about, and only one of those two is a business answer.

=== step === quiz
## Quick check: what did the ANOVA answer, and what did it not?

The one-way ANOVA on the three branches came back with F = 5.245 and p = 0.00613. What does that pair of numbers entitle you to say?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- At least one branch has a different average order value from the others, and nothing yet about which one or by how much. ::ok Exactly. It is one verdict on all three branches at once. Naming a branch and putting a dollar figure on the gap took a second step, and that step separated only Downtown from Airport.
- Airport has the highest average order value of the three branches. ::no
- The difference between the branches is large, because 0.00613 is a very small p-value. ::no
- All three branches differ from each other. ::no A single ANOVA is one omnibus verdict: at least one group differs from the rest. It does not name the group, it does not rank them, and a small p-value is not a large difference. Branch accounted for 5.6% of the variation here, and only one of the three pairs separated once the pairs were compared.

=== step === concept
## The same five questions on a before-and-after comparison

A chart is worth nothing if it only handles the question it was built on, so let's take it to the menu board.

The Airport branch put up a new board and the same 20 regulars had their order value recorded in the week before and the week after. Run the questions.

1. The outcome is a **number**: order value in dollars.
2. **Two groups**: before and after.
3. **Paired**: each before belongs to one person, and so does the after sitting next to it.
4. **Roughly normal**.

A number, two groups and paired lands you on the paired t-test. In R that is `t.test()` with `paired = TRUE`.

```r
# Test the before and after order values as the pairs they are
t.test(board_after, board_before, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  board_after and board_before
#> t = 5.071, df = 19, p-value = 6.785e-05
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  0.5919571 1.4240429
#> sample estimates:
#> mean difference 
#>           1.008 
```

Take the size first. Regulars spent $1.01 more an order after the board went up, and the plausible range for that change runs from $0.59 to $1.42. The p-value, 0.00006785, says a change that size would almost never come out of 20 people who did not change at all.

Now watch what happens when question three is answered wrongly. It is the same 20 people and the same 40 numbers, handed to the test as two unrelated groups.

```r
# Run the same two columns as if they came from different people
t.test(board_after, board_before, paired = FALSE)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  board_after and board_before
#> t = 1.1518, df = 37.963, p-value = 0.2566
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -0.7637284  2.7797284
#> sample estimates:
#> mean of x mean of y 
#>    11.583    10.575 
```

R names that second run a Welch test. It is the ordinary two-sample t-test with one allowance built in, that the two groups need not have the same spread, and it is what `t.test()` hands you by default. The allowance does not help here, because what went wrong is the pairing.

The p-value goes from 0.00007 to 0.26. Nothing about the data changed. The estimate of the change is the same $1.01, but the range around it now runs from minus $0.76 to plus $2.78, which is another way of saying the test has no idea.

Here is exactly why. The 20 regulars run from $6.97 to $15.58 in what they usually spend, and the unpaired test has to treat all of that as noise it must beat. Their 20 individual changes run from minus $0.63 to plus $2.34, clustered near a dollar, and those changes are the only thing the paired test ever looks at.

[WARNING]
Reading paired data as independent does not buy you a safer answer, it buys you a weaker one. A real change gets buried in the differences between people, and the test comes back with nothing.

=== step === concept
## The same five questions when the numbers are skewed

The chart takes a third question now. The chain also runs deliveries, and someone wants to know whether Riverside and Airport take the same time to get an order out. Here are 14 delivery times from each, in minutes, built on the page as before.

```r
# Build 14 delivery times per branch, in minutes, and draw the shape of each
set.seed(15)
delivery <- data.frame(
  branch  = rep(c("Riverside", "Airport"), each = 14),
  minutes = round(6 + rexp(28, rate = 1/12), 1)
)

par(mfrow = c(1, 2))
for (b in c("Riverside", "Airport")) {
  hist(delivery$minutes[delivery$branch == b],
       breaks = 8, col = "grey85", border = "white",
       main = b, xlab = "Delivery time in minutes")
}
par(mfrow = c(1, 1))
```

Neither of those is a bell. Most deliveries land in the first couple of bars and a few drag a long way out to the right, which is how waiting times usually behave: there is a floor, no ceiling, and the occasional order that goes badly wrong.

Questions one to three answer the way the menu board did, apart from the pairing.

1. The outcome is a **number**: minutes.
2. **Two groups**: Riverside and Airport.
3. **Independent**: different deliveries, no partners.

And now question four flips.

```r
# Check the shape inside each branch, and find the middle of each
round(tapply(delivery$minutes, delivery$branch, function(v) shapiro.test(v)$p.value), 4)
#>   Airport Riverside 
#>    0.0027    0.0012 

round(tapply(delivery$minutes, delivery$branch, median), 2)
#>   Airport Riverside 
#>     15.90     10.35 
```

Both p-values sit far under 0.05, so both branches fail the shape check, and with only 14 values each there is no rescue from group size. The row for two independent groups that are not normal sends you one column across, to the Mann-Whitney test.

```r
# Compare the two branches with the rank based test
wilcox.test(minutes ~ branch, data = delivery)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  minutes by branch
#> W = 150, p-value = 0.0162
#> alternative hypothesis: true location shift is not equal to 0
```

R prints it as the Wilcoxon rank sum test. Mann-Whitney is the same test under a different name, so do not go hunting for a second function. It never looks at 15.9 minutes or 10.4 minutes at all. It sorts all 28 times together, replaces each one with its position in that order, and asks whether one branch's positions sit systematically higher than the other's.

The p-value is 0.0162, so the two sets of times differ by more than the shuffle of 28 deliveries would explain. And because the test works on order rather than on the values themselves, the size you report beside it is the middle of each branch: 10.35 minutes at Riverside against 15.90 minutes at Airport.

=== step === concept
## The same five questions when the outcome is a label

One more question, and this one crosses to the other half of the chart. Every receipt also records whether a pastry went on the order. Do the three branches sell pastries at different rates?

```r
# Add a yes or no pastry column to the receipts and count pastries by branch
set.seed(17)
orders$pastry <- ifelse(rbinom(180, 1, rep(c(0.28, 0.45, 0.30), each = 60)) == 1, "yes", "no")

pastry_table <- table(orders$branch, orders$pastry)
pastry_table
#>            
#>             no yes
#>   Airport   33  27
#>   Downtown  47  13
#>   Riverside 40  20
```

Question one answers differently this time. The outcome is not a number, it is a yes or no label, and there is no average of yes and no. 45% of Airport receipts carried a pastry against 22% at Downtown, and a percentage is only counts in disguise, so the whole t-test and ANOVA half of the chart is out.

A label as the outcome, with a label splitting the groups, gives you a table of counts. The test for a table of counts is chi-square.

```r
# Test whether the pastry rate depends on which branch the receipt came from
pastry_test <- chisq.test(pastry_table)
pastry_test
#> 
#> 	Pearson's Chi-squared test
#> 
#> data:  pastry_table
#> X-squared = 7.35, df = 2, p-value = 0.02535
```

Chi-square works by building the table you would expect if branch made no difference at all, then measuring how far the real table sits from that one. You can look at the expected table directly.

```r
# Show the counts the table would hold if branch made no difference
pastry_test$expected
#>            
#>             no yes
#>   Airport   40  20
#>   Downtown  40  20
#>   Riverside 40  20
```

60 of the 180 receipts carried a pastry, so if branch made no difference each group of 60 would show 20 pastries and 40 without. The real table has 27 at Airport and 13 at Downtown. `X-squared = 7.35` measures how far apart those two tables are, and p = 0.02535 says a gap that size is unusual when all three branches sell at the same rate.

There is one condition to check before you trust it. Chi-square leans on those expected counts being reasonably large, and the usual rule is that every expected count should be at least 5. The smallest here is 20, so we are fine. When a cell's expected count does fall under 5, which happens with small samples or rare outcomes, use `fisher.test()` instead: it works out the exact answer by counting arrangements rather than leaning on an approximation.

=== step === concept
## The whole flowchart in one place

Start at question one. A label as the outcome takes you to chi-square, with Fisher's exact test when an expected count falls under 5. A number as the outcome puts you in the tree below, which is the independent half of the numeric branch: count the groups, then read the shape.

::widget tree-diagram {"root": "two groups?", "l": "roughly normal?", "r": "roughly normal?", "leaves": ["t-test", "Mann-Whitney", "ANOVA", "Kruskal-Wallis"]}

The paired half of that branch is the same tree with two swaps: the paired t-test where the t-test sits, and the Wilcoxon signed-rank test where Mann-Whitney sits. And when you have one group against a fixed target instead of two groups, it is `t.test(x, mu = 9)`.

Here is every question the coffee chain asked, in one table:

| The question | The answers | The test | R function | The size to report |
|---|---|---|---|---|
| Do the three branches differ in order value? | number, 3 groups, independent, normal | one-way ANOVA | `aov()` | eta-squared, then `TukeyHSD()` in dollars |
| Did the new menu board change what regulars spend? | number, 2 groups, paired, normal | paired t-test | `t.test(paired = TRUE)` | the mean change and its range |
| Do two branches differ in delivery time? | number, 2 groups, independent, skewed | Mann-Whitney | `wilcox.test()` | the median of each group |
| Did queue time change after a second till? | number, 2 groups, paired, skewed | Wilcoxon signed-rank | `wilcox.test(paired = TRUE)` | the median of the paired changes |
| Does the pastry rate depend on the branch? | label, 3 groups, independent | chi-square | `chisq.test()` | the rate in each group, side by side |

Four of those five rows you have now run yourself. The queue-time row is the one still waiting for you.

=== step === quiz
## Quick check: which test does this question need?

Here is a new question at the same chain. The roasters buy beans from three suppliers, and every delivery gets a quality check that it either passes or fails. Over the last quarter there were 40 deliveries from each supplier. Does the pass rate depend on the supplier?

Walk the questions in order before you look at the options.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- One-way ANOVA, because three groups are being compared at once. ::no
- Kruskal-Wallis, because pass and fail cannot possibly be bell shaped. ::no
- Chi-square on a three by two table of supplier against pass or fail. ::ok Yes. Question one settles it before the group count gets a say: the outcome measured on each delivery is a pass or fail label, not a number, so the whole ANOVA family is out and what you have is a table of counts.
- A paired t-test, since all three suppliers are checked over the same quarter. ::no The outcome is whatever you measured on each delivery, and here that is a label. A label as the outcome takes you to chi-square however many groups there are, and normality never enters it, because there is no shape to a column of passes and fails. Sharing a quarter does not pair anything either: a delivery from one supplier has no partner delivery at another.

=== step === quiz
## Quick check: what happens when you ignore the pairing?

The 20 menu-board regulars gave p = 0.00007 read as pairs and p = 0.26 read as two unrelated groups, on exactly the same 40 numbers. What does that tell you about ignoring the pairing?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Very little. The two tests answer the same question, and the distance from 0.00007 to 0.26 is a matter of rounding. ::no
- The unpaired test has to carry the whole spread between people as noise, so it loses the power to see a change that is really there. ::ok That is it. Those 20 regulars run from $6.97 to $15.58 in what they usually spend, while their changes all sit near a dollar. The paired test removes the first spread by subtracting each person from themselves, and the unpaired test has to beat it instead.
- The unpaired test is the safer choice, because a bigger p-value is the more conservative answer. ::no
- Pairing only matters when the two groups hold different numbers of observations. ::no An unpaired test on paired data is not conservative, it is wrong, and the mistake costs you real findings rather than protecting you from false ones. Pairing is a fact about how the data was collected, so it applies whatever the group sizes are, and here it turned a clear $1.01 change into a result the test could not see.

=== step === tryit
## Your turn: pick and run the test for the queue-time question

Downtown opened a second till. Someone timed the same 15 regulars in the queue during the week before it opened, and timed those same 15 again a week after. Both sets of times are in minutes and both are built for you below.

Two of the five answers have to move before you can write the line: the pairing and the shape. Work them both out, then run the one test that fits.

```r
# Build the queue times, in minutes, for the same 15 Downtown regulars twice
set.seed(21)
queue_before <- round(2 + rexp(15, rate = 1/3), 1)
queue_after  <- round(queue_before * 0.8 + rexp(15, rate = 1/4), 1)

# Check the shape of queue_before, then run the test that fits
# a paired comparison of skewed times.
# Press Check when you have it.
```
::check {"regex": "wilcox[.]test[^)]*paired\\s*=\\s*TRUE", "gate": true, "difficulty": "intermediate", "ok": "Right: V = 23.5 and p = 0.03656. The times are skewed, so the ranks do the work, and the same 15 people timed twice makes it the signed-rank version. Now read the direction: the median went from 3.7 minutes to 6.9, so the wait went up, not down.", "no": "Two answers move at once here. The same 15 people are timed twice, so the comparison is paired, and shapiro.test(queue_before) fails hard, so the shape rules out a t-test. Paired plus skewed gives you wilcox.test(queue_before, queue_after, paired = TRUE)."}
::solution
```r
# Check the shape, then compare the paired queue times with the rank based test
shapiro.test(queue_before)
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  queue_before
#> W = 0.80016, p-value = 0.003694

wilcox.test(queue_before, queue_after, paired = TRUE)
#> 
#> 	Wilcoxon signed rank exact test
#> 
#> data:  queue_before and queue_after
#> V = 23.5, p-value = 0.03656
#> alternative hypothesis: true location shift is not equal to 0
```

The median wait went from 3.7 minutes before to 6.9 minutes after, and p = 0.03656 says a shift that size is unlikely to be the ordinary wobble of 15 people queueing on two different days. Notice what the test did not say. It did not say the second till caused anything. It compared two sets of times and found them different, and whether a busier week, a new drinks menu or the till itself is behind that is a question this data was never set up to answer.

=== step === concept
## References

- [Fitting an analysis of variance model](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team, the stats package documentation. The same reference set covers `t.test()`, `wilcox.test()`, `kruskal.test()` and `chisq.test()`, which are the functions this chart points at.
- [An analysis of variance test for normality (complete samples)](https://doi.org/10.1093/biomet/52.3-4.591) - Shapiro and Wilk (1965), Biometrika 52(3-4), 591-611. The original paper behind `shapiro.test()`.
- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen (1988), 2nd edition, Lawrence Erlbaum. The source of the small, medium and large benchmarks used on eta-squared.
- [Discovering Statistics Using R](https://www.discoveringstatistics.com/books/discovering-statistics-using-r/) - Field, Miles and Field (2012), SAGE. Chapters 9 to 12 walk through choosing and running each of these tests in R.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. On reporting effect sizes beside p-values rather than instead of them.

=== step === complete
## Quick recap

You started with three branch averages and a dozen tests you could not choose between. Five questions later there was exactly one, and it ran.

Keep the questions rather than the test names, because the questions are what fetch the names:

1. **Is the outcome a number or a label?** A number keeps you in the t-test and ANOVA family. A label sends you to chi-square.
2. **How many groups?** One against a fixed value, two, or three and more. Never three separate two-group tests.
3. **Same people twice, or different people?** Paired when every measurement has one partner, and you have to say so in the test.
4. **Is each group roughly normal?** Check inside the groups, with a picture first. If not, take the rank-based partner in the same row.
5. **How big is the difference?** No p-value has ever answered this one.

The coffee chain's answer, in one sentence: the three branches do differ in average order value (F = 5.245, p = 0.00613), branch accounts for 5.6% of the variation, and the only pair that separates is Downtown against Airport, at $1.36 an order less.

Next time somebody hands you a question and a table, walk the five in order and let the chart hand you the test.
