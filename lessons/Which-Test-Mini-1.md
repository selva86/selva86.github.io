---
title: "Which statistical test to use? A 5-question decision flowchart"
slug: "Which-Test-Mini-1"
catalog_blurb: "Five questions about your data, and the right test falls out."
description: "Three shop branches, three average order values, and one question: is the difference real? Answer five plain questions about your data and the right test falls out."
keywords: "which statistical test to use, choosing a statistical test, statistical test decision flowchart, t-test vs ANOVA, parametric vs nonparametric, Welch test, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.8"
lesson_access: "windowed"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "1"
course_total: "11"
course_landing: "/dashboard.html"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 1 of 11
## Which statistical test to use? A 5-question decision flowchart

Ravi runs three branches of a bookshop, and last Saturday he wrote down the value of every single order at each one. Station Road averaged \$23.11 an order. Lakeview came in at \$27.52. Hillside took \$32.07. He puts the three numbers in front of you and asks the only question anybody ever asks about three numbers like that: is the difference real, or is Saturday just being Saturday?

And there it is, the freeze. Somewhere in your head is a list with t-tests and ANOVA and chi-square and Mann-Whitney on it, and no rule for deciding which line of that list is yours. Most people go and look at a comparison table, get halfway down it, and quietly hope nobody asks why they picked the row they picked.

The way out is not to memorise the list. It is to answer five plain questions about your data, in order, because each answer throws away whole branches of the list until one test is left standing.

::widget process-flow {"steps":[{"title":"What did you measure?","sub":"a number like a bill, or a label like yes or no"},{"title":"How many groups?","sub":"one against a fixed value, two, or three and up"},{"title":"Same people twice?","sub":"paired readings, or different people in each group"},{"title":"Is the shape ordinary?","sub":"roughly symmetric, no wild outliers, similar spreads"},{"title":"How big is the difference?","sub":"the test gives a p-value, you report the size too"}]}

None of those five needs any statistics to answer. They are questions about your spreadsheet, and you already know the answers before you open R.

By the end of this lesson you will be able to:

- Answer all five questions about a dataset you have never seen before
- Follow them to exactly one R function, and run it on Ravi's three branches
- Do the same for paired data, for two groups, for labels instead of numbers, and for two numbers moving together
- Say how big the difference is, not just whether it passed a threshold
- Name the situations where this flowchart is the wrong tool entirely

**What you need first:** you can read a simple R script, so a variable, `c()`, a function call and `$` are familiar. No statistics at all is assumed. Every term gets defined in plain words the first time it turns up.

=== step === concept
::eyebrow The data
## Ravi's Saturday, before any test touches it

Fifteen orders at each branch, forty-five in total, every one of them a real amount somebody actually paid. Before you think about tests, look at them.

::widget chart-plotter {"data":[{"x":"Station Road","y":27.6},{"x":"Station Road","y":29.7},{"x":"Station Road","y":20.27},{"x":"Station Road","y":18.27},{"x":"Station Road","y":25.28},{"x":"Station Road","y":27.14},{"x":"Station Road","y":29.65},{"x":"Station Road","y":14.54},{"x":"Station Road","y":17.36},{"x":"Station Road","y":17.09},{"x":"Station Road","y":16.73},{"x":"Station Road","y":22.12},{"x":"Station Road","y":26.55},{"x":"Station Road","y":27.08},{"x":"Station Road","y":27.2},{"x":"Lakeview","y":20.78},{"x":"Lakeview","y":30.47},{"x":"Lakeview","y":29.67},{"x":"Lakeview","y":25.66},{"x":"Lakeview","y":26.26},{"x":"Lakeview","y":23.16},{"x":"Lakeview","y":26.04},{"x":"Lakeview","y":31.9},{"x":"Lakeview","y":22.94},{"x":"Lakeview","y":31.2},{"x":"Lakeview","y":24.05},{"x":"Lakeview","y":33.63},{"x":"Lakeview","y":27.56},{"x":"Lakeview","y":30.58},{"x":"Lakeview","y":28.94},{"x":"Hillside","y":37.38},{"x":"Hillside","y":32.42},{"x":"Hillside","y":11.24},{"x":"Hillside","y":32.45},{"x":"Hillside","y":44.4},{"x":"Hillside","y":26.61},{"x":"Hillside","y":34.28},{"x":"Hillside","y":32.11},{"x":"Hillside","y":24.86},{"x":"Hillside","y":25.91},{"x":"Hillside","y":26.8},{"x":"Hillside","y":45.47},{"x":"Hillside","y":36.5},{"x":"Hillside","y":35.46},{"x":"Hillside","y":35.21}],"geoms":["boxplot"],"x":"branch","y":"value"}

Each box covers the middle half of that branch's orders, the thick line inside it is the middle order, and the thin lines stretch out over the rest. So Hillside does sit higher than Station Road, which is the gap Ravi noticed, but look at how much the boxes overlap, and look at how much taller Hillside's box and lines are: one order there was \$11.24 and another was \$45.47, while Lakeview's fifteen orders all landed in a fairly tight band.

When you press Run and see the real plot, one Hillside order sits on its own as a separate dot below everything else, which is how a boxplot marks a value far enough from the middle to deserve a second look. It is Ravi's \$11.24 order, and it is a genuine sale rather than a typo, so it stays in.

That overlap is the whole problem in one picture. Plenty of Station Road orders were bigger than plenty of Hillside orders. If you had walked in on a different Saturday and served a different fifteen customers, would the ranking still come out the same way? Nobody can answer that by staring harder at the picture, which is exactly why there is a test at the end of this.

[NOTE]
Press **Run this chart** under the picture to build the same plot yourself in R. Every code box on this page runs right here in the browser, so you can change a number and see what happens.

=== step === concept
::eyebrow Setup
## The same Saturday, as an R data frame

Here is Ravi's Saturday typed into R. Run this block first, because everything later on this page uses the objects it creates.

```r
station  <- c(27.6, 29.7, 20.27, 18.27, 25.28, 27.14, 29.65, 14.54,
              17.36, 17.09, 16.73, 22.12, 26.55, 27.08, 27.2)
lakeview <- c(20.78, 30.47, 29.67, 25.66, 26.26, 23.16, 26.04, 31.9,
              22.94, 31.2, 24.05, 33.63, 27.56, 30.58, 28.94)
hillside <- c(37.38, 32.42, 11.24, 32.45, 44.4, 26.61, 34.28, 32.11,
              24.86, 25.91, 26.8, 45.47, 36.5, 35.46, 35.21)

orders <- data.frame(
  branch = rep(c("Station Road", "Lakeview", "Hillside"), each = 15),
  value  = c(station, lakeview, hillside)
)

head(orders, 4)
#>         branch value
#> 1 Station Road 27.60
#> 2 Station Road 29.70
#> 3 Station Road 20.27
#> 4 Station Road 18.27

nrow(orders)
#> [1] 45
```

Three things happen there. The three `c(...)` lines each hold one branch's fifteen order values, one number per order. `rep(c("Station Road", "Lakeview", "Hillside"), each = 15)` writes out the branch name fifteen times each, so the labels line up with the values underneath them. And `data.frame()` glues the labels and the values into a table of forty-five rows and two columns, which `head(orders, 4)` shows you the top of.

Now the summary Ravi quoted at you:

```r
round(tapply(orders$value, orders$branch, mean), 2)
#>     Hillside     Lakeview Station Road 
#>        32.07        27.52        23.11 

round(tapply(orders$value, orders$branch, sd), 2)
#>     Hillside     Lakeview Station Road 
#>         8.40         3.77         5.26 
```

`tapply()` splits `orders$value` into piles according to `orders$branch`, then runs the function you named on each pile, so the first line is "average order value, one per branch". R prints the branches in alphabetical order rather than the order you typed them, which is worth noticing so you do not misread a column later.

The second line is the **standard deviation**, which is the ordinary distance between a single order and its branch's average. Hillside's 8.40 says its orders scatter roughly twice as far from the middle as Lakeview's 3.77 do, and that difference in scatter is going to matter later on, so park it somewhere.

=== step === concept
::eyebrow A detour worth taking
## Every group test wants one row per observation

Ravi did not hand over a tidy data frame. He handed over a spreadsheet with one column per branch, which is how a human keeps a shop's takings and how almost every beginner's data arrives. R will not compare groups in that shape, and the error you get says nothing helpful about why.

Flip the toggle below between the two layouts.

::widget reshape-grid {"wide":{"cols":["order","Station Road","Lakeview","Hillside"],"rows":[[1,27.6,20.78,37.38],[2,29.7,30.47,32.42],[3,20.27,29.67,11.24],[4,18.27,25.66,32.45]]},"idCols":["order"],"namesTo":"branch","valuesTo":"value"}

In the wide layout the branch name is a column heading, which means it is metadata, sitting outside the data where no function can reach it. In the long layout every row is one order, and the branch name has become a value in a column of its own, which means R can now group by it, colour by it, and test across it.

That is what `orders` already is: one row per order, one column of numbers, one column of labels. From here on, the shape of every command follows the same pattern, `value ~ branch`, which you read out loud as "value, broken down by branch".

[TIP]
If your own data is wide, `tidyr::pivot_longer()` is the one line that fixes it, and the widget above prints the exact call for this table. Nothing else in the flowchart works until you have done that, so it is worth doing first and getting out of the way.

=== step === concept
::eyebrow Before question one
## What kind of question are you actually asking?

The five questions are for comparing groups. Before you enter them, be honest about whether comparing groups is what you came to do, because three quite different questions all get described in English as "does X affect Y".

| What you are really asking | Ravi's version of it | Where it goes |
|---|---|---|
| Is this group different from that group? | Do the three branches take different amounts per order? | The five questions, starting now |
| Do these two numbers move together? | Do customers who browse longer spend more? | Correlation, which question 1 will route you to |
| Can I predict one thing from several others at once? | What is an order worth, given branch and weekday and weather? | Regression, a different tool with a different lesson |

Ravi's question is the first row, so the flowchart applies. If yours is the third row, no test on this page is the one you want, and knowing that in the first minute is worth more than any amount of skill with a t-test.

One more piece of vocabulary before question one, because every test on this page ends in the same kind of number. A **p-value** answers one narrow question: if the branches were genuinely identical and only ordinary randomness separated them, how often would randomness alone hand you a gap at least as big as the one in front of you? A small p-value means randomness would rarely manage it, so "they are identical" becomes an uncomfortable position to hold. It is not the probability that Ravi's branches are the same, and it never was.

=== step === concept
::eyebrow Question 1
## What did you measure: a number, or a label?

This is the question that throws away the most, so it goes first. Every test is built for one kind of outcome, and pointing the wrong kind at it produces either an error or, much worse, a number that looks fine and means nothing.

The **outcome** is the thing you are trying to explain, the column you would point at if somebody asked "different in what?" For Ravi it is the value of an order. It comes in two kinds:

- **A number**, where the gaps between values mean something. An order of \$30 really is \$10 more than an order of \$20. Prices, minutes, weights, test scores.
- **A label**, where each row falls into a category and arithmetic on it is nonsense. Which branch, paid by card or cash, joined the loyalty scheme or did not.

R already knows which is which, so ask it:

```r
class(orders$value)
#> [1] "numeric"

class(orders$branch)
#> [1] "character"

str(orders)
#> 'data.frame':	45 obs. of  2 variables:
#>  $ branch: chr  "Station Road" "Station Road" "Station Road" "Station Road" ...
#>  $ value : num  27.6 29.7 20.3 18.3 25.3 ...
```

`class()` reports what one column is made of, and `str()` does the same for a whole table at once, which is the faster habit when a dataset has forty columns. "numeric" is a number. "character" and "factor" are labels.

Careful though, because `class()` reports what the column is made of, not what it means. A postcode stored as digits is "numeric" and is still a label. A satisfaction rating from 1 to 5 is "numeric" and sits in an awkward middle: the gaps between 1 and 2 and between 4 and 5 are probably not equal, so treating it as a plain number is a judgement call, not a fact.

Ravi's outcome is a number, so he is on the numbers branch of the flowchart, heading for t-tests and ANOVA and their rank-based cousins. Had his outcome been a label, he would be heading for chi-square instead, and the rest of the questions would look quite different.

=== step === quiz
::eyebrow Check yourself
## A number that is really a label

Ravi's spreadsheet stores the payment method as a number: 1 for cash, 2 for card, 3 for the shop app. For the purposes of question 1, is that column a number or a label?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- A number, since the column genuinely contains 1, 2 and 3
- A label, since the digits only stand in for categories and their average would mean nothing ::ok Exactly. An average payment method of 1.8 is not a fact about the shop, it is arithmetic performed on names that happen to be written as digits. Feed that column to a t-test and R will happily return a p-value, which is the dangerous part.
- A number, because you can calculate its average and its standard deviation
- It depends on how many payment methods the shop offers ::no All three of those judge the column by what R can do with it rather than by what it means. R will calculate an average of 1, 2 and 3 without complaining, and the number of categories changes nothing: cash, card and app are names, the digits are just short labels for them, and the gap between cash and card is not one unit of anything.

=== step === concept
::eyebrow Question 2
## How many groups are you comparing?

Question 1 left you on the numbers branch. Question 2 splits that branch into three, and the answer is usually visible from across the room.

- **One group against a fixed value.** You have one pile of numbers and something to hold it up against. Head office tells Ravi the chain averages \$25 an order, and he wants to know whether Station Road is genuinely off that mark.
- **Two groups.** Two piles, compared with each other. Station Road against Lakeview.
- **Three or more groups.** Three or more piles at once. Ravi's actual question.

Ask R rather than counting by eye, because a stray spelling in a label column invents a group you did not know you had:

```r
table(orders$branch)
#> 
#>     Hillside     Lakeview Station Road 
#>           15           15           15 

length(unique(orders$branch))
#> [1] 3
```

`table()` counts how many rows carry each label, so it answers two questions in one go: how many groups there are, and how many observations sit in each. Fifteen, fifteen and fifteen here, which is a balanced design and the easiest case there is.

That second job matters more than it looks. If one branch had four orders and another had ninety, that imbalance would shape which test behaves well and how much you should trust the answer. And if `table()` ever shows you "Hillside" and "hillside " as separate rows, you have a typo, not a fourth branch.

Ravi has three groups, so he is heading for a test that handles three at once. Which raises the obvious shortcut, and the obvious shortcut is a trap.

=== step === concept
::eyebrow The three-t-tests trap
## Why you cannot just run three two-group tests

The tempting move with three branches is to run three familiar two-group tests: Station Road against Lakeview, Station Road against Hillside, Lakeview against Hillside. Three t-tests, done, and everybody knows how to read a t-test.

Here is what that costs. Every test carries a false-alarm rate, usually set at 5 percent, which is the share of the time it will call a difference real when nothing is going on at all. Run one test and you accept a 1-in-20 risk. Run three, and you get three chances to be fooled, so the risk of at least one false alarm somewhere in the family is

\( 1 - (1 - \alpha)^k \)

where \( \alpha \) is the false-alarm rate you accepted per test (0.05 here) and \( k \) is how many tests you ran. In R:

```r
1 - 0.95^3
#> [1] 0.142625

1 - 0.95^10
#> [1] 0.4012631
```

So three tests turn a 5 percent risk into 14 percent, and ten tests take it past 40 percent. That formula assumes the tests are independent of each other, which three pairwise comparisons among the same three branches are not quite, since each branch appears in two of them. The overlap makes the real figure a little gentler than 14 percent, and it changes nothing about the direction: more tests, more chances to be fooled. The slider below makes that concrete: every study it simulates has nothing real in it whatsoever, so every result it flags is a false alarm. Drag the number of tests up and watch the share of studies with at least one "significant" finding climb away from the 5 percent you thought you were buying, then switch a correction on and watch it collapse back.

::widget multiplicity-sim {"kMax":20,"kStart":3,"alpha":0.05,"nStudies":4000,"corrections":["none","bonferroni","holm"],"seed":29,"study":1}

[KEY INSIGHT]
One test asking "is anything going on among these three branches?" is a completely different question from three tests each asking about a pair. The first is what question 2 routes you to when the answer is three or more, and it is why ANOVA, short for analysis of variance, exists at all.

None of this means pairwise comparisons are forbidden. It means they come second, after the single omnibus test that asks about all three branches at once, and with their p-values adjusted for how many of them you ran. You will do exactly that on Ravi's data further down.

=== step === concept
::eyebrow Question 3
## Same people twice, or different people?

Question 3 only applies once you have at least two groups, and it is the one people wave through as a formality. It is not a formality. Getting it wrong can turn a glaring result into nothing at all, and here is that happening on real numbers.

Ravi ran a two-week promotion at Station Road and tracked the twelve regulars who shop there most. He has each regular's average spend in the fortnight before the promotion, and again during it. Same twelve people, measured twice.

| Regular | Before | During |
|---|---|---|
| 1 | 22.1 | 27.2 |
| 2 | 16.0 | 20.1 |
| 3 | 27.2 | 30.3 |
| 4 | 16.3 | 18.1 |
| 5 | 17.4 | 19.4 |
| 6 | 37.0 | 39.7 |
| ... | ... | ... |
| 12 | 25.7 | 30.1 |

Look down the two columns and you see enormous variation between people: regular 6 spends more than twice what regular 2 spends, and always did. Now look across each row instead, and every single person went up by a few dollars.

**Paired** means every value in one group has exactly one partner in the other: the same person, the same parcel, the same shop measured twice. **Independent** means the two groups are made of different people entirely, and no value has a partner. Paired data is worth having because each person acts as their own comparison, which sweeps away all that between-person variation you just noticed.

```r
before <- c(22.1, 16, 27.2, 16.3, 17.4, 37, 17.9, 22.4, 35.4, 18.7, 19.9, 25.7)
after  <- c(27.2, 20.1, 30.3, 18.1, 19.4, 39.7, 18.9, 25.2, 37, 21.9, 22.8, 30.1)

round(after - before, 1)
#>  [1] 5.1 4.1 3.1 1.8 2.0 2.7 1.0 2.8 1.6 3.2 2.9 4.4
```

Twelve differences, every one of them positive, ranging from a dollar to five. Now the test that knows the data is paired, and then the same data handed to the test that does not:

```r
t.test(after, before, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  after and before
#> t = 8.2981, df = 11, p-value = 4.605e-06
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  2.124684 3.658649
#> sample estimates:
#> mean difference 
#>        2.891667 
```

```r
t.test(after, before)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  after and before
#> t = 0.99299, df = 21.999, p-value = 0.3315
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -3.147644  8.930977
#> sample estimates:
#> mean of x mean of y 
#>  25.89167  23.00000 
```

Same twenty-four numbers, and the p-value goes from 0.0000046 to 0.33. The paired version works on the twelve differences, which are tightly clustered around three dollars, so a real effect is easy to see. The unpaired version throws the pairing away and asks whether a pile of twelve "during" numbers sits higher than a pile of twelve "before" numbers, and against the huge spread between individual regulars, three dollars vanishes into the noise.

The line marked **95 percent confidence interval** in each output tells the same story in dollars, and it is worth learning to read because every test on this page prints one. It is the range of true differences the data cannot rule out. Paired, that range runs from \$2.12 to \$3.66, so every amount still in play is an increase. Unpaired, it runs from -\$3.15 to \$8.93, and a range with zero sitting inside it is a range that cannot rule out no change at all.

[WARNING]
Adding `paired = TRUE` to data that is not paired is just as wrong in the other direction, and R cannot catch either mistake for you. It matches up value 1 with value 1, value 2 with value 2, and so on down the two vectors, so if those pairings mean nothing, neither does the answer. This is a question about how the data was collected, and only you know that.

=== step === quiz
::eyebrow Check yourself
## Paired or independent?

Ravi weighs the same 10 parcels on the old shop scale, then weighs those same 10 parcels again on the new one, to see whether the new scale reads differently. Paired or independent?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Independent, because these are two separate sets of readings taken at different times
- Paired, because each old-scale reading has exactly one matching new-scale reading from the same parcel ::ok That is it. Parcel 3 weighs what it weighs, and comparing its two readings removes the fact that parcel 3 is heavier than parcel 7 entirely. Pairing is about which values are linked to which, not about when you collected them.
- Independent, because the two scales are two different machines
- Paired only if both sets have the same number of readings ::no None of those get at what pairing is. Two different machines and two different moments still produce two readings of one parcel, and that link is what makes it paired. Equal group sizes are a consequence of pairing rather than a cause of it: ten different parcels on each scale would also give you ten and ten, and would be independent.

=== step === concept
::eyebrow Question 4
## Is the shape ordinary?

Question 4 decides between two families of test that answer the same question in different currencies. One family works with the actual numbers, and needs those numbers to be reasonably well behaved. The other family throws the numbers away, keeps only their order from smallest to largest, and works with the ranks instead, so nothing about the shape can upset it.

"Well behaved" here means roughly what it sounds like. Values pile up around the middle, thin out symmetrically on both sides, and no single value sits so far out that it drags the average around by itself. The textbook name for the ideal version of that shape is the **normal distribution**, the bell curve, though what actually matters is whether your data is close enough, not whether it is exactly that.

Here is Hillside, the branch with the widest spread, drawn as a histogram where the height of each bar is how many of the fifteen orders fell in that range.

::widget chart-plotter {"data":[{"x":37.38},{"x":32.42},{"x":11.24},{"x":32.45},{"x":44.4},{"x":26.61},{"x":34.28},{"x":32.11},{"x":24.86},{"x":25.91},{"x":26.8},{"x":45.47},{"x":36.5},{"x":35.46},{"x":35.21}],"geoms":["histogram"],"x":"value"}

What do you make of that? Most orders sit in the twenties and thirties, one straggler is down at \$11.24, and there are a couple up near \$45. It is lumpy. It is not a smooth bell. And the honest reading is that fifteen numbers cannot tell you much either way, which is the point of the next block.

The code below draws six histograms, and every one of them is fifteen values pulled from a genuinely, perfectly normal population. Run it, then look at how ragged the panels are.

```r
set.seed(3)
par(mfrow = c(2, 3))
for (i in 1:6) {
  sample_of_15 <- rnorm(15, mean = 32, sd = 8)
  hist(sample_of_15, main = paste("sample", i), xlab = "", col = "grey85")
}
par(mfrow = c(1, 1))
```

`rnorm(15, mean = 32, sd = 8)` draws fifteen values from a textbook bell curve centred on 32, `par(mfrow = c(2, 3))` arranges the six pictures in two rows of three, and `set.seed(3)` fixes the randomness so your six panels match anybody else's.

Some of those panels lean left. Some have a gap in the middle. At least one has a bar sitting on its own out at the edge, looking exactly like an outlier. They are all, every one, textbook normal data. So when your own fifteen numbers look lumpy, lumpy is what fifteen numbers look like.

[KEY INSIGHT]
With small samples you cannot see the shape well enough to be sure, and with large samples the shape stops mattering nearly as much, because averages of many numbers behave like a bell curve even when the individual numbers do not. That is the practical shape of this question, and it is why question 4 is a judgement rather than a lookup.

=== step === concept
::eyebrow Question 4, continued
## The normality test is not a switch

Almost every guide you will find answers question 4 with a test. Run Shapiro-Wilk, look at its p-value, and if it comes out under 0.05 you switch to the rank-based family. It looks pleasingly automatic, and it is the single most common bad habit in this whole topic.

Run it on Ravi's three branches:

```r
tapply(orders$value, orders$branch, function(v) round(shapiro.test(v)$p.value, 3))
#>     Hillside     Lakeview Station Road 
#>        0.293        0.836        0.061 
```

`shapiro.test()` asks one question: if this data really did come from a perfectly normal population, how often would randomness alone produce a sample looking at least this un-bell-like? All three branches come back above 0.05, so by the automatic rule Ravi is clear to use the number-based family.

Now notice how little that actually told him, because the test's power depends almost entirely on how much data you feed it.

- **With small groups**, like Ravi's fifteen, the test can barely see anything. It passes badly skewed data all the time simply because fifteen values are not enough evidence to convict. Station Road's 0.061 is not "normal", it is "we cannot tell".
- **With large groups**, say five hundred values, it flags departures so tiny that they change no answer you care about. You will get a p-value like 0.004 on data whose histogram looks perfectly fine, and switching tests because of it costs you sensitivity for nothing.

There is a subtler problem underneath. Choosing your test by first testing the same data changes what the final p-value means, because the reported number pretends you had one plan all along when in fact your plan depended on what the data did.

[WARNING]
So use `shapiro.test()` as one piece of evidence, never as the switch. Look at the histogram, look at the boxplot, ask whether the outliers are real or typos, and ask how many values you have. If the picture is clearly lopsided or one value dominates, go rank-based. If it is roughly symmetric, or the groups are large, stay with the numbers.

Ravi's three branches are small, roughly symmetric, and their one low order at \$11.24 is a real order rather than a data-entry slip. He stays with the number-based family, and he checks his answer against the rank-based one later, which is the honest way to handle a borderline call.

=== step === quiz
::eyebrow Check yourself
## Five hundred delivery times

A colleague has 500 delivery times for each of two depots. He runs `shapiro.test()` on each, gets p = 0.004 for one of them, and announces that the t-test is off the table and he must use a rank test. What is the honest response?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- He is right, since a p-value below 0.05 means the data is not normal and the t-test needs normal data
- He is right in principle, though he should check the two depots have equal spreads first
- With 500 values per group the test flags departures far too small to matter, and averages of 500 values behave like a bell curve anyway, so the histogram should decide this rather than the p-value ::ok Exactly right, and notice that his p-value is not wrong, it is just answering a question that stopped being the interesting one at this sample size. What he needs to know is whether the departure is big enough to distort a comparison of averages, and at n = 500 the answer is almost always no. Plot it and look.
- He should combine both depots into one set of 1000 values and test that instead ::no The first two treat a small p-value as a verdict about whether the t-test is allowed, which it is not: with 500 values per group it is a verdict about whether the departure is detectable, and at that size almost any departure is. The last one is worse, because two groups with different averages will look non-normal when you pour them together even if each one is a perfect bell curve.

=== step === concept
::eyebrow Question 4b
## Do the groups spread the same amount, and does R already handle it?

There is a second half to question 4 that most flowcharts skip, and it is the one that will make you look like you know what you are doing. Comparing groups is not only about where their middles sit, because two branches could average exactly the same amount per order while one of them swings between \$5 and \$60 and the other barely leaves the twenties.

You already met Ravi's spreads:

```r
round(sd(hillside), 2)
#> [1] 8.4

round(sd(lakeview), 2)
#> [1] 3.77

round(sd(hillside)^2 / sd(lakeview)^2, 2)
#> [1] 4.95
```

The last line squares each standard deviation to get the **variance**, then divides one by the other. Hillside's orders scatter about five times as much as Lakeview's, and that is not a rounding difference, it is a real feature of the two shops.

The classic textbook t-test assumes both groups scatter equally, pools all the scatter into one shared estimate, and gets over-confident when that assumption is false. The fix has been in R the whole time and hardly anybody notices it:

```r
t.test(station, lakeview)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  station and lakeview
#> t = -2.6421, df = 25.393, p-value = 0.01391
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -7.8580080 -0.9766587
#> sample estimates:
#> mean of x mean of y 
#>  23.10533  27.52267 
```

Read the first line of that output: **Welch** Two Sample t-test, not "Two Sample t-test". R's `t.test()` has `var.equal = FALSE` as its default, so out of the box you get Welch's version, which lets each group keep its own spread. Look at `df` on the next line too. **Degrees of freedom** is R's bookkeeping for how much independent information a comparison has to work with, and the textbook version of this test would report a whole number, 28, which is the thirty orders minus one for each of the two groups. Welch reports 25.393 instead, because its adjustment for unequal spreads lands between whole numbers, so a ragged df is the giveaway that Welch is running.

Ask for the textbook version and the label changes:

```r
t.test(station, lakeview, var.equal = TRUE)
#> 
#> 	Two Sample t-test
#> 
#> data:  station and lakeview
#> t = -2.6421, df = 28, p-value = 0.01333
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -7.842096 -0.992571
#> sample estimates:
#> mean of x mean of y 
#>  23.10533  27.52267 
```

Here the two barely differ, because both groups have fifteen orders and equal group sizes make the pooled version quite forgiving. Push the group sizes apart, though, put the bigger spread in the smaller group, and the pooled version starts reporting confidence it has not earned.

[TIP]
The practical rule is short: leave `t.test()` alone and let it be Welch. There is a matching default for three or more groups called `oneway.test()`, and it is what Ravi is about to run. Testing for equal variances first, with something like Bartlett's test, has the same problem as testing for normality first, so most modern advice is to skip the pre-test and just use the version that never needed the assumption.

=== step === concept
::eyebrow Putting the answers together
## Reading the answer off, for two groups

Four questions answered means the test is now determined. Take the two-group case first, since it is the one you will meet most, and follow it down.

You have a number as your outcome and two groups. Question 3 asks whether the two groups are the same people measured twice. Question 4 asks whether the shape is ordinary. Two questions with two answers each gives four routes and four tests:

::widget tree-diagram {"root":"same people twice?","l":"shape ordinary?","r":"shape ordinary?","leaves":["paired t","signed-rank","two-sample t","Mann-Whitney"]}

Left branch first, where the answer to "same people twice" is yes. Ordinary shape sends you to the **paired t-test**, `t.test(x, y, paired = TRUE)`, which is the one that found Ravi's promotion effect. A lopsided shape sends you to the **Wilcoxon signed-rank test**, `wilcox.test(x, y, paired = TRUE)`, which ranks the differences instead of averaging them.

Right branch, where the two groups are different people. Ordinary shape gives the **two-sample t-test**, `t.test(x, y)`, which as you just saw is Welch's version by default. A lopsided shape gives the **Mann-Whitney test**, `wilcox.test(x, y)`, which pools both groups, ranks everybody from smallest to largest, and asks whether one group's ranks sit systematically higher.

The names look like four unrelated things to memorise. They are two ideas crossed with each other: paired or not, and numbers or ranks.

=== step === concept
::eyebrow Putting the answers together
## Ravi's actual answer

Now Ravi's own question, the one that started this. His answers, in order:

1. **What did you measure?** A number, the value of an order.
2. **How many groups?** Three, and they are the whole question, so one test across all three.
3. **Same people twice?** No. Forty-five different customers, forty-five different orders.
4. **Is the shape ordinary?** Close enough, though the spreads differ a lot, with Hillside scattering about five times as widely as Lakeview.

A number, three or more independent groups, ordinary enough shapes, unequal spreads. That is a one-way analysis of variance that does not assume equal spreads, which in R is `oneway.test()`:

```r
oneway.test(value ~ branch, data = orders, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  value and branch
#> F = 6.7527, num df = 2.000, denom df = 25.871, p-value = 0.004368
```

Take that output apart, because every piece of it earns its place.

`value ~ branch` is the formula, read as "value, broken down by branch", and `data = orders` tells R which table those two column names live in. `var.equal = FALSE` is the Welch adjustment from the last step, applied to three groups instead of two, and it is the reason the denominator degrees of freedom came out as 25.871 rather than a whole number.

**F = 6.7527** is the test statistic. Roughly, it compares how far apart the three branch averages are against how much the orders bounce around inside each branch. An F near 1 means the gaps between branches are no bigger than the everyday noise within them. An F of 6.75 means the gaps are several times larger than the noise.

**p-value = 0.004368** is what all of that was for. If the three branches genuinely took the same amount per order and only randomness separated them, a spread of averages at least this wide would turn up about four times in a thousand Saturdays. Rare enough that "the branches are identical" is now an uncomfortable thing to keep saying.

So Ravi has his answer, and it is a real one: something is different between his branches. Notice what it does not say. It does not say which branch, and it does not say by how much. Both of those come next, and the how-much part is the one most people skip.

=== step === concept
::eyebrow Question 5
## The p-value says something happened, not that it matters

That leaves question 5: how big is the difference? A p-value is a statement about how well randomness explains your data. It is not a measure of size, and with enough customers a trivial difference will produce a tiny p-value. So report the size as well, always, and the standard way to do that for a group comparison is **eta squared**:

\( \eta^2 = \dfrac{SS_{\text{between}}}{SS_{\text{total}}} \)

where \( SS_{\text{between}} \) is the amount of variation explained by which branch an order came from, \( SS_{\text{total}} \) is all the variation there is among the forty-five orders, and \( \eta^2 \) is therefore the share of the whole story that branch accounts for, on a scale from 0 to 1. The classic `aov()` function prints both pieces:

```r
fit <- aov(value ~ branch, data = orders)
summary(fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)   
#> branch       2  603.2  301.62   8.047 0.0011 **
#> Residuals   42 1574.3   37.48                  
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The `Sum Sq` column holds exactly the two quantities the formula needs: 603.2 sits on the `branch` row, and the leftover 1574.3 sits on `Residuals`, which is the variation between orders inside the same branch. Add them for the total and divide:

```r
tab <- summary(fit)[[1]]
round(tab[["Sum Sq"]][1] / sum(tab[["Sum Sq"]]), 3)
#> [1] 0.277
```

Branch explains about 28 percent of the variation in order value, which for a shop is a substantial share, and it is a far more useful sentence to put in front of Ravi than "p equals 0.004". The other 72 percent is customers being customers, which no branch policy is going to fix.

For two groups the usual size measure is **Cohen's d**, the gap between the two averages measured in standard deviations:

\( d = \dfrac{\bar{x}_1 - \bar{x}_2}{s_p} \)

where \( \bar{x}_1 \) and \( \bar{x}_2 \) are the two group averages and \( s_p \) is their combined standard deviation, so d is "how many typical customer-to-customer wobbles apart the two branches are".

```r
pooled_sd <- sqrt((sd(station)^2 + sd(lakeview)^2) / 2)
round((mean(lakeview) - mean(station)) / pooled_sd, 2)
#> [1] 0.96
```

Lakeview sits almost a full standard deviation above Station Road. The rough convention is that 0.2 is small, 0.5 is medium and 0.8 is large, and those are conventions rather than laws, so quote the number and let the reader judge it against what they know about bookshops.

[NOTE]
`aov()` above is the classic equal-spreads version, which is why its p-value (0.0011) differs slightly from `oneway.test()`'s Welch p-value (0.004368). Ravi should report the Welch one, since that is the assumption he can defend, and use `aov()` only for the sums of squares that eta squared needs.

=== step === concept
::eyebrow After a significant result
## Which branches actually differ?

`oneway.test()` said "something is different among these three". It never says which pair, and eyeballing the averages to decide is exactly the shortcut that question 2 warned about.

The proper follow-up runs the pairwise comparisons and then adjusts their p-values for the fact that there are three of them:

```r
pairwise.t.test(orders$value, orders$branch,
                p.adjust.method = "holm", pool.sd = FALSE)
#> 
#> 	Pairwise comparisons using t tests with non-pooled SD 
#> 
#> data:  orders$value and orders$branch 
#> 
#>              Hillside Lakeview
#> Lakeview     0.0704   -       
#> Station Road 0.0056   0.0278  
#> 
#> P value adjustment method: holm 
```

Three arguments do the work. `pool.sd = FALSE` keeps each pair on its own spreads, staying consistent with the Welch decision made earlier. `p.adjust.method = "holm"` inflates each p-value to account for having run three tests, which is the correction the multiplicity widget let you switch on. And the table reads like a mileage chart: find the row for one branch and the column for the other.

So Station Road against Hillside comes back at 0.0056, and Station Road against Lakeview at 0.0278, both small. Hillside against Lakeview is 0.0704, which after correction is no longer small, so the honest sentence is "Station Road takes less per order than both of the others, and Lakeview and Hillside cannot be separated on one Saturday's data".

That last clause is the whole reason to do this properly. The averages made it look like Hillside was the star performer, but the gap between Hillside and Lakeview is comfortably inside what fifteen orders of noise can produce.

=== step === tryit
::eyebrow Your turn
## Just two branches

Ravi drops the three-branch question and asks a narrower one: forget Hillside, do Station Road and Lakeview differ?

Walk the questions. The outcome is still a number. There are now two groups. They are different customers, so independent. The shapes are ordinary enough. Both vectors, `station` and `lakeview`, are already in your session from the setup block.

Write the call that answers it, then press Check.

```r
t.test(____, ____)
```
::check {"regex":"t\\.test[^\\n]*(station[^\\n]*lakeview|lakeview[^\\n]*station)","gate":true,"difficulty":"beginner","ok":"That is the one, and it comes back with p = 0.014 and a difference of about $4.42 an order. Notice R labels it a Welch Two Sample t-test without being asked, because that is the default for two independent groups.","no":"Two independent groups of numbers with ordinary shapes is the plain two-sample t-test, and the two things being compared are the vectors station and lakeview."}
::solution
```r
t.test(station, lakeview)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  station and lakeview
#> t = -2.6421, df = 25.393, p-value = 0.01391
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -7.8580080 -0.9766587
#> sample estimates:
#> mean of x mean of y 
#>  23.10533  27.52267 
```

=== step === concept
::eyebrow The other family
## The rank-based route, and whether it changes anything

Every test so far has worked with the actual dollar amounts. The rank-based family throws those amounts away and keeps only the ordering, which makes it immune to a lopsided shape and to one wild value at the end.

Here is the three-group version, **Kruskal-Wallis**, which is where question 4 sends you when the shape is clearly not ordinary:

```r
kruskal.test(value ~ branch, data = orders)
#> 
#> 	Kruskal-Wallis rank sum test
#> 
#> data:  value by branch
#> Kruskal-Wallis chi-squared = 12.189, df = 2, p-value = 0.002256
```

It takes the same `value ~ branch` formula, and it reaches the same verdict: p = 0.0023 against Welch's 0.0044. Both say the branches differ, which is reassuring, because a borderline shape call that changes the conclusion is a sign you should be nervous about the conclusion.

And the two-group version, **Mann-Whitney**, on the same pair you tested a moment ago:

```r
wilcox.test(station, lakeview)
#> 
#> 	Wilcoxon rank sum exact test
#> 
#> data:  station and lakeview
#> W = 60, p-value = 0.0295
#> alternative hypothesis: true location shift is not equal to 0
```

p = 0.0295 against the t-test's 0.0139. Same story, slightly less certain, which is the usual trade. Rank tests give up a little sensitivity when the data really was well behaved, and they hold up when it was not.

[NOTE]
`wilcox.test()` covers both rank-based two-group tests. Given two independent groups it runs Mann-Whitney; add `paired = TRUE` and it runs the Wilcoxon signed-rank test on the differences instead. One function, and question 3 decides the argument.

Rank tests are not a free pass, though. They compare whole distributions rather than averages, so the plain reading of a significant result is "one group tends to sit higher", and they do not hand you a difference in dollars. Report a median for each group alongside them, meaning that group's middle value, or the answer is a p-value with nothing attached.

=== step === concept
::eyebrow The other outcome
## When the outcome is a label, not a number

Everything so far lived on the "number" branch of question 1. Take the other branch now, because Ravi has a second question and it changes the whole route.

He wants to know whether loyalty card use differs across the three branches. The outcome per customer is not an amount, it is a yes or no, so the data is counts:

```r
loyalty <- matrix(c(4, 11, 6, 9, 11, 4), nrow = 3, byrow = TRUE,
                  dimnames = list(c("Station Road", "Lakeview", "Hillside"),
                                  c("used_card", "no_card")))
loyalty
#>              used_card no_card
#> Station Road         4      11
#> Lakeview             6       9
#> Hillside            11       4
```

`matrix()` lays the six counts out in three rows of two, `byrow = TRUE` fills them across rather than down, and `dimnames` names the rows and columns so the printed table reads properly. Four of Station Road's fifteen customers used a card, against eleven of Hillside's.

With counts in a table, the test is **chi-square**, which asks whether the pattern of counts is further from "no relationship at all" than randomness would ordinarily manage:

```r
chisq.test(loyalty)
#> 
#> 	Pearson's Chi-squared test
#> 
#> data:  loyalty
#> X-squared = 6.9643, df = 2, p-value = 0.03074
```

p = 0.031, so card use does look genuinely uneven across the branches. But chi-square has one condition of its own, and it is about the counts it expected rather than the counts you got:

```r
chisq.test(loyalty)$expected
#>              used_card no_card
#> Station Road         7       8
#> Lakeview             7       8
#> Hillside             7       8
```

Those are the counts you would see if card use were identical everywhere, given how many customers each branch served and how many cards were used overall. The rule of thumb is that chi-square gets unreliable once expected counts drop below about 5, and here the smallest is 7, so Ravi is fine.

When they do drop below 5, the answer is **Fisher's exact test**, which counts up every possible table with the same row and column totals instead of leaning on an approximation. Ravi tried a new window display for a week and recorded, of the people who stopped and looked at it, how many came in and bought something:

```r
display <- matrix(c(7, 2, 3, 6), nrow = 2, byrow = TRUE,
                  dimnames = list(c("new_display", "old_display"),
                                  c("bought", "left")))
display
#>             bought left
#> new_display      7    2
#> old_display      3    6

suppressWarnings(chisq.test(display))$expected
#>             bought left
#> new_display      5    4
#> old_display      5    4
```

Expected counts of 4 and 5, so chi-square is out of its comfort zone here and R will warn you with "Chi-squared approximation may be incorrect" if you run it. Fisher handles it:

```r
fisher.test(display)
#> 
#> 	Fisher's Exact Test for Count Data
#> 
#> data:  display
#> p-value = 0.1534
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>    0.6218933 100.0509462
#> sample estimates:
#> odds ratio 
#>   6.176771 
```

Seven out of nine against three out of nine looks dramatic, and the odds ratio of 6.18 says the new display's odds of a sale were about six times the old one's. Yet p = 0.1534, and the confidence interval runs from 0.62 all the way to 100, which is a polite way of saying eighteen people is not enough to know anything. That gap between a striking-looking table and an honest verdict is the entire reason to run the test rather than trust the table.

=== step === concept
::eyebrow The third shape
## When there are no groups at all, just two numbers

The last branch is the one the original question threw out at the start. Sometimes you are not comparing groups, you are asking whether two measurements on the same customers rise and fall together.

On another day at Station Road, Ravi timed how long fifteen customers spent browsing and matched each one to what they spent:

```r
minutes <- c(10, 23, 30, 12, 7, 24, 19, 27, 31, 7, 12, 18, 13, 20, 11)
spend   <- c(16.16, 31.51, 34.51, 22.94, 14.84, 27, 31.75, 35.63,
             24.81, 10.39, 20.47, 24.89, 20.1, 22.11, 20.39)

cor.test(minutes, spend)
#> 
#> 	Pearson's product-moment correlation
#> 
#> data:  minutes and spend
#> t = 5.3809, df = 13, p-value = 0.0001252
#> alternative hypothesis: true correlation is not equal to 0
#> 95 percent confidence interval:
#>  0.5544237 0.9420919
#> sample estimates:
#>       cor 
#> 0.8307459 
```

`cor.test()` reports two things worth separating. The **correlation** of 0.83 is the size: it runs from -1 to 1, where 0 is no straight-line relationship, 1 is a perfect rising line, and 0.83 is a strong upward one. The p-value of 0.000125 is the usual question about randomness, and the confidence interval says the true correlation is somewhere between 0.55 and 0.94, which is a wide range because fifteen customers is not many.

Question 4 applies here too. Pearson's version measures how well a straight line fits, so one extreme customer can move it a long way. The rank-based alternative is Spearman's, which correlates the orderings instead:

```r
suppressWarnings(cor.test(minutes, spend, method = "spearman"))
#> 
#> 	Spearman's rank correlation rho
#> 
#> data:  minutes and spend
#> S = 88.157, p-value = 8.054e-05
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#>       rho 
#> 0.8425774 
```

0.84 against 0.83, so no drama here. The `suppressWarnings()` wrapper is there because two pairs of customers browsed for exactly the same length of time, two at 7 minutes and two at 12, and tied ranks mean Spearman falls back on an approximate p-value and says so.

[WARNING]
A correlation says the two numbers move together, and it never says one causes the other. Customers who intend to buy a lot may well browse longer because of it, which is the same correlation running the other way round, and a third thing like a weekend afternoon could easily drive both.

=== step === quiz
::eyebrow Check yourself
## Route a new one

A hospital pharmacy compares waiting times, in minutes, at four dispensing counters. Different patients at each counter, twelve patients per counter, and the times are heavily right-skewed with a couple of very long waits pulling the tail out. Which route does the flowchart give?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Six separate two-sample t-tests, one for each pair of counters
- A one-way ANOVA, because ANOVA is built for any number of groups
- Kruskal-Wallis, because the outcome is a number, there are four independent groups, and the shape is clearly not ordinary ::ok Exactly. Question 1 gives a number, question 2 gives four groups so it is one omnibus test rather than a pile of pairs, question 3 gives independent, and question 4 sees heavy skew in small groups and sends you to the rank-based family. Follow it up with medians per counter, since a rank test gives you no minutes.
- A chi-square test, because there are four counters to compare ::no Each of those misses a different question. Six pairwise tests is exactly the multiplicity trap: it turns a 5 percent false-alarm risk into about 26 percent. ANOVA is indeed built for four groups but it works with the actual minutes, and twelve heavily skewed values per counter is where that starts to hurt. And chi-square counts labels, whereas the thing being compared here is a number of minutes.

=== step === tryit
::eyebrow Your turn
## The full walk, on the promotion data

Back to the twelve Station Road regulars and their spend before and during the promotion. Their differences ran from a dollar to five, which is tame, but suppose one regular had jumped by forty dollars while the rest moved by a dollar or two. Twelve numbers were never going to show you the shape either way, and Ravi does not want an answer that hangs on the size of one person's jump.

Walk the questions. The outcome is a number. Two groups. Same twelve people measured twice, so paired. Treat the shape as not ordinary, so the rank-based family. Both vectors, `before` and `after`, are already in your session.

Write the call, then press Check.

```r
# same twelve regulars, before and during, lopsided differences
____
```
::check {"regex":"wilcox\\.test[^\\n]*paired\\s*=\\s*TRUE","gate":true,"difficulty":"intermediate","ok":"That is the Wilcoxon signed-rank test, and it comes back at p = 0.00049. It ranks the twelve differences rather than averaging them, so an enormous jump would count as the biggest difference and nothing more, which is exactly the protection Ravi wanted.","no":"Paired plus a lopsided shape is the rank-based paired test, which is wilcox.test with the argument paired set to TRUE, run on after and before."}
::solution
```r
wilcox.test(after, before, paired = TRUE)
#> 
#> 	Wilcoxon signed rank exact test
#> 
#> data:  after and before
#> V = 78, p-value = 0.0004883
#> alternative hypothesis: true location shift is not equal to 0
```

=== step === concept
::eyebrow The whole thing
## The flowchart on one page

Here is every route in the lesson, in one table. Read your four answers across, and the last two columns give you the test and the call.

| Outcome | Groups | Paired | Shape | Test | The R call |
|---|---|---|---|---|---|
| a number | 1, against a fixed value | - | ordinary | one-sample t | `t.test(x, mu = 25)` |
| a number | 1, against a fixed value | - | lopsided | Wilcoxon signed-rank | `wilcox.test(x, mu = 25)` |
| a number | 2 | no | ordinary | Welch two-sample t | `t.test(x, y)` |
| a number | 2 | no | lopsided | Mann-Whitney | `wilcox.test(x, y)` |
| a number | 2 | yes | ordinary | paired t | `t.test(x, y, paired = TRUE)` |
| a number | 2 | yes | lopsided | Wilcoxon signed-rank | `wilcox.test(x, y, paired = TRUE)` |
| a number | 3 or more | no | ordinary | Welch one-way ANOVA | `oneway.test(y ~ g)` |
| a number | 3 or more | no | lopsided | Kruskal-Wallis | `kruskal.test(y ~ g)` |
| a number | 3 or more | yes | either | repeated measures / Friedman | `friedman.test(y, g, subject)` |
| a label | 2 or more | no | - | chi-square, or Fisher if counts are small | `chisq.test(tbl)`, `fisher.test(tbl)` |
| a label | 2 | yes | - | McNemar | `mcnemar.test(tbl)` |
| two numbers | none | - | ordinary | Pearson correlation | `cor.test(x, y)` |
| two numbers | none | - | lopsided | Spearman correlation | `cor.test(x, y, method = "spearman")` |

The one-sample row is the case Ravi has not run yet, so here it is for completeness. Head office says the chain averages \$25 an order, and he wants to know whether Station Road is genuinely below that or just having a quiet Saturday:

```r
t.test(station, mu = 25)
#> 
#> 	One Sample t-test
#> 
#> data:  station
#> t = -1.3947, df = 14, p-value = 0.1848
#> alternative hypothesis: true mean is not equal to 25
#> 95 percent confidence interval:
#>  20.19166 26.01901
#> sample estimates:
#> mean of x 
#>  23.10533 
```

`mu = 25` is the fixed value to compare against, and p = 0.18 says fifteen orders cannot separate Station Road's \$23.11 from the chain's \$25. The confidence interval says the same thing more usefully: the true Station Road average is somewhere between \$20.19 and \$26.02, and \$25 sits comfortably inside that.

=== step === concept
::eyebrow Honesty
## When this flowchart is the wrong tool

Five questions cannot cover everything, and knowing where the map ends is part of reading it. Each of these looks like a group comparison and is not.

| The situation | Why the five questions stop working | What you would reach for |
|---|---|---|
| Two things varying at once, say branch and weekday | The questions assume one grouping, and a weekday effect would masquerade as a branch effect | Two-way ANOVA, or regression with both terms |
| You want to hold something else steady, like basket size | Nothing here can adjust for a second variable | Regression, or analysis of covariance |
| One shop measured every day for a year | Consecutive days are not independent, and these tests assume every row is | Time series methods |
| How long until something happens, with some cases still unfinished | An unfinished case is not a missing number, and averaging it away is wrong | Survival analysis |
| You want to predict the next order's value | Testing asks whether a difference is real, which is a different job from prediction | Predictive modelling |

There is one more limit that is quieter and catches more people. Every test on this page assumes each row is a separate, independent observation. If Ravi's forty-five orders include the same customer four times, or if all of Hillside's orders came from a single tour group that walked in together, the rows are linked in a way none of these tests knows about, and every p-value on this page is more confident than it deserves to be.

[KEY INSIGHT]
The five questions choose a test. They do not check whether your data was collected in a way that supports any test at all. That part is judgement about how the numbers arrived, and no function in R can do it for you.

=== step === concept
::eyebrow Go deeper
## References

Five places worth an hour when you want more than this lesson gives.

- [R documentation for t.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - the official page for the function you will run most, including the `var.equal` and `paired` arguments and what each one changes.
- [R documentation for oneway.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html) - the three-or-more-groups test Ravi used, and the one most guides never mention.
- [Delacre, Lakens and Leys (2017), why researchers should default to Welch](https://rips-irsp.com/articles/10.5334/irsp.82) - the paper behind the advice to stop pre-testing for equal variances and just use Welch, with the simulations that make the case.
- [Rochon, Gondan and Kieser (2012), to test or not to test](https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/1471-2288-12-81) - the same argument for normality: picking your test by first testing the data distorts the result, shown properly.
- [OpenIntro Statistics, free textbook](https://www.openintro.org/book/os/) - a patient, plain-language treatment of every test named here, with the arithmetic this lesson deliberately left out.

=== step === complete
## Part 1 complete

You started where Ravi did, staring at \$23.11, \$27.52 and \$32.07 with no idea which of a dozen tests belonged to that moment. You now have five questions that get you there without remembering anything: what did you measure, how many groups, same people twice, is the shape ordinary, and how big is it. Those five put Ravi on `oneway.test(value ~ branch, data = orders)`, which came back at p = 0.004, and the follow-up said Station Road is the branch that genuinely lags while Hillside and Lakeview cannot be told apart on one Saturday.

You also picked up the parts most flowcharts leave out. A normality test is evidence, not a switch. R has been running Welch's version of the t-test by default the whole time. Three separate two-group tests turn a 5 percent false-alarm risk into 14 percent. And a p-value with no effect size beside it is half an answer.

Part 2 takes the single most important of those and goes all the way in. Ravi's Hillside orders scattered about five times as widely as Lakeview's, and question 4b waved that away with "use the Welch version". The next lesson is about why unequal spreads wreck the classic ANOVA, what Welch's version does differently, and how to report it, so the default you just accepted becomes a choice you can defend.
