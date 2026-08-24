---
title: "Mann-Whitney U test: when and how to run it"
slug: "Which-Test-Mini-3"
description: "One founder earns twenty times her colleagues, the averages mislead and the t-test finds nothing. Rank the salaries instead, and read W, p and the effect size."
keywords: "Mann-Whitney U test, wilcox.test in R, Wilcoxon rank sum test, nonparametric two sample test, rank biserial correlation, comparing groups by ranks, outliers and the t-test"
mathjax: false
webr: true
date: "2026-08-24"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "3"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-2"
course_next: ""
curriculum_id: "0.0.20"
lesson_access: "windowed"
catalog_blurb: "When one extreme value drags the average around, compare ranks instead."
---

=== step === cover
::eyebrow Which Test Do I Run?
## Mann-Whitney U test: when and how to run it

Let's say you have two job offers on the table and you want to know which of the two companies actually pays better.

So you get hold of the salaries of the twelve people on the team you would be joining at each place. That is twelve numbers from Harlow Systems and twelve from Cadence Labs.

Cadence looks like the easy winner. Its average salary is 196,583 against Harlow's 96,500, which is more than double.

Then you read down the Cadence list and find the founder sitting in it, on 1,520,000. That is twenty times the typical salary there, and once you have seen her, the average stops meaning very much.

So you run a t-test to settle it properly, and it hands back p = 0.42. Nothing to see here. The averages point at Cadence, the test points nowhere, and neither of them is answering the question you asked.

The Mann-Whitney U test answers it by refusing to work with the salaries at all. It works with their positions instead. The founder stops being 1,520,000 and becomes just the highest paid person in the room, one place above whoever comes next, and her huge salary loses all its power.

There are only three moves involved.

::widget process-flow {"steps":[{"title":"Pool the salaries","sub":"put all 24 people, both companies, into one list"},{"title":"Rank them","sub":"replace every salary with its position, 1 up to 24"},{"title":"Count the wins","sub":"how many of the 144 head-to-head pairings each side takes"}]}

That is the whole test. The rest is those three moves carried out on the real 24 salaries: when to reach for it, how to run it in one line, and what you are allowed to claim afterwards.

=== step === concept
## The two salary lists, side by side

Let's put the numbers on the table first, because everything we work out from here comes out of them.

There are twenty four people in all, twelve at each company. Harlow's salaries run from 78,000 up to 121,000. Cadence's eleven ordinary salaries run from 62,000 to 90,000, and then there is the founder on 1,520,000.

Press Run.

```r
# Build the 24 salaries and put each company's mean beside its median
pay <- data.frame(
  company = factor(rep(c("Harlow", "Cadence"), each = 12),
                   levels = c("Harlow", "Cadence")),
  salary  = c(78000, 82000, 85000, 88000, 91000, 95000,
              96000, 100000, 103000, 108000, 111000, 121000,
              62000, 66000, 69000, 71000, 74000, 76000,
              79000, 81000, 84000, 87000, 90000, 1520000)
)

harlow  <- pay$salary[pay$company == "Harlow"]
cadence <- pay$salary[pay$company == "Cadence"]

data.frame(company = c("Harlow", "Cadence"),
           mean    = c(mean(harlow), mean(cadence)),
           median  = c(median(harlow), median(cadence)))
#>   company     mean median
#> 1  Harlow  96500.0  95500
#> 2 Cadence 196583.3  77500
```

Read those two rows against each other, because they disagree.

By the mean, Cadence pays more than twice what Harlow pays: 196,583 against 96,500. By the median, the person standing in the middle at Cadence earns 77,500, which is 18,000 less than the person standing in the middle at Harlow.

Both numbers are correct. They measure different things, and only one of them has the founder's salary inside it.

=== step === widget
## What the two companies look like when you plot them

Two numbers side by side only take you so far. Plot the same 24 salaries and the trouble shows up straight away.

The buttons switch between a boxplot and the raw points, and Run draws the real chart in R.

::widget chart-plotter {"data":[{"x":"Harlow","y":78000},{"x":"Harlow","y":82000},{"x":"Harlow","y":85000},{"x":"Harlow","y":88000},{"x":"Harlow","y":91000},{"x":"Harlow","y":95000},{"x":"Harlow","y":96000},{"x":"Harlow","y":100000},{"x":"Harlow","y":103000},{"x":"Harlow","y":108000},{"x":"Harlow","y":111000},{"x":"Harlow","y":121000},{"x":"Cadence","y":62000},{"x":"Cadence","y":66000},{"x":"Cadence","y":69000},{"x":"Cadence","y":71000},{"x":"Cadence","y":74000},{"x":"Cadence","y":76000},{"x":"Cadence","y":79000},{"x":"Cadence","y":81000},{"x":"Cadence","y":84000},{"x":"Cadence","y":87000},{"x":"Cadence","y":90000},{"x":"Cadence","y":1520000}],"geoms":["boxplot","point"],"x":"company","y":"salary"}

Look at what one person does to the picture. The founder sits near the top of the salary axis on her own, and to fit her on the same scale everybody else has been squashed into a thin band along the bottom. That band holds twenty three real salaries spread from 62,000 to 121,000, and you can barely tell them apart.

An average has no choice but to take that top point in. A rank does not.

=== step === concept
## Why one salary moves the mean but not the middle

The mean and the median react to that top point so differently that it is worth being clear about why.

The mean shares every dollar out across all twelve people. Add one dollar to the founder and a twelfth of it lands on the average. Add 1,430,000 to her and roughly 120,000 of it lands on the average.

The median never touches the amounts at all. It sorts the twelve people and asks who is standing in the middle, and the founder is standing at the far end whatever she earns.

Watch both numbers while her pay moves.

```r
# Move the founder pay to three different levels and watch the mean and the median
for (founder_pay in c(90000, 1520000, 15000000)) {
  twelve <- c(cadence[1:11], founder_pay)
  cat("founder =", formatC(founder_pay, format = "d", big.mark = ","),
      "| mean =", formatC(round(mean(twelve)), format = "d", big.mark = ","),
      "| median =", formatC(median(twelve), format = "d", big.mark = ","), "\n")
}
#> founder = 90,000 | mean = 77,417 | median = 77,500
#> founder = 1,520,000 | mean = 196,583 | median = 77,500
#> founder = 15,000,000 | mean = 1,319,917 | median = 77,500
```

The median holds at 77,500 through all three runs. The mean starts at 77,417, sitting right beside the median because eleven ordinary salaries are all it is carrying. Give the founder her real 1,520,000 and the mean jumps to 196,583. Pay her 15,000,000 and it reaches 1,319,917, a figure that describes nobody at the company.

=== step === concept
## What a t-test says about these two companies

The obvious move at this point is a two-sample t-test, so let's run one and see what it makes of the salaries.

A t-test is a fraction with two parts. On top is the gap between the two averages. Underneath is an estimate of how much those averages would wobble from one sample to the next, and that estimate is built out of the spread inside each group. A big gap divided by a small wobble gives a large t and a small p-value.

```r
# Ask a t-test whether the two companies pay differently
t.test(harlow, cadence)
#>
#> 	Welch Two Sample t-test
#>
#> data:  harlow and cadence
#> t = -0.83131, df = 11.021, p-value = 0.4234
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -365003.3  164836.6
#> sample estimates:
#> mean of x mean of y
#>   96500.0  196583.3
```

Read the estimates at the bottom first. The t-test has 96,500 against 196,583, so as far as it is concerned Cadence pays 100,083 more per person. That is the founder's 1,520,000 doing the talking.

Now read the top. t = -0.83131 and p = 0.4234. Against the usual 0.05 threshold that is a flat no: no evidence of any difference in average pay.

The founder is sitting in both halves of that fraction. She adds about 120,000 to Cadence's average, and she blows up Cadence's standard deviation too, which is exactly what the wobble estimate is built from. Eleven salaries between 62,000 and 90,000 plus one at 1,520,000 produce a spread so wide that a gap of 100,083 is nothing special inside it. The confidence interval says as much outright: the true difference in averages is somewhere between minus 365,003 and plus 164,837, which rules out almost nothing.

[WARNING]
Nothing broke here. The t-test answered the question it was asked, which is whether two averages differ, on a sample where one person owns most of one of those averages. The question itself stopped being useful the moment that salary landed in the data.

=== step === quiz
## Quick check: why did the t-test come back with nothing?

The t-test on those 24 salaries returned p = 0.4234, and a real difference in pay went undetected. What actually went wrong?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Twelve people per company is too small a sample for a t-test to detect anything. ::no
- The two groups are different sizes, and a two-sample t-test cannot handle that. ::no
- One salary sits so far above the rest that it inflates Cadence's spread, and the t-test divides the gap in averages by that spread. ::ok That is it. The founder pushed the top of the fraction up by about 120,000 and the bottom of it up by far more, so the ratio came out close to zero.
- The founder's salary is bad data, so the fix is to delete her row and run the t-test again. ::no Sample size was not the problem, and the two groups are twelve each, so unequal sizes were not either. The founder is not an error to be deleted: she really works there and really earns that. The failure is arithmetic. One huge value inflates the spread the t-test divides by, so a real gap in pay disappears into the noise estimate.

=== step === concept
## When to reach for a rank test

So when should you stop trusting a mean and rank the numbers instead? Three situations come up over and over, and the salaries are the first of them.

1. **One or two values run away from the rest.** Salaries, house prices, revenue per customer, minutes spent on a page. One founder, one mansion, one enormous account, one person who left the tab open all weekend. The mean chases that value and the spread widens even faster, which is exactly what you just watched happen.
2. **The numbers are only an order.** Survey ratings from 1 to 7, pain scores, satisfaction levels, finishing places in a race. The gap between 6 and 7 is not the same size as the gap between 1 and 2, so averaging them is arithmetic on labels. Ranking them is what those numbers were always for.
3. **The groups are too small to argue about shape.** With eight or twelve people per group you cannot see whether the data are anywhere near normal, and you cannot lean on the central limit theorem to rescue the average either, because it needs more observations than that to do its work.

One thing the rank test still insists on: the observations have to be independent. Twenty four different people, each contributing one salary, is fine. The same twelve people measured before and after a pay review is not, because those readings come in pairs, and pairs go to the Wilcoxon signed rank test instead.

Two things it does not insist on: normally distributed data, and any particular shape for either group. It will run whatever the two distributions look like. The shapes do decide how you are allowed to word the conclusion afterwards, and we will come back to that.

=== step === concept
## Ranking every salary in one line

The move itself is small. Pool all 24 salaries into one list, sort them from lowest to highest, then hand out positions: 1 to the lowest paid person of the 24, and 24 to the highest.

Press "Show what changed" to watch the positions arrive, and Run to do the same thing in R.

::widget table-transform {"code":"df %>% mutate(rank = rank(salary))","caption":"rank() replaces each salary with its position in the pooled list of 24.","before":{"cols":["company","salary"],"rows":[["Cadence",62000],["Cadence",66000],["Cadence",69000],["Cadence",71000],["Cadence",74000],["Cadence",76000],["Harlow",78000],["Cadence",79000],["Cadence",81000],["Harlow",82000],["Cadence",84000],["Harlow",85000],["Cadence",87000],["Harlow",88000],["Cadence",90000],["Harlow",91000],["Harlow",95000],["Harlow",96000],["Harlow",100000],["Harlow",103000],["Harlow",108000],["Harlow",111000],["Harlow",121000],["Cadence",1520000]]},"after":{"cols":["company","salary","rank"],"rows":[["Cadence",62000,1],["Cadence",66000,2],["Cadence",69000,3],["Cadence",71000,4],["Cadence",74000,5],["Cadence",76000,6],["Harlow",78000,7],["Cadence",79000,8],["Cadence",81000,9],["Harlow",82000,10],["Cadence",84000,11],["Harlow",85000,12],["Cadence",87000,13],["Harlow",88000,14],["Cadence",90000,15],["Harlow",91000,16],["Harlow",95000,17],["Harlow",96000,18],["Harlow",100000,19],["Harlow",103000,20],["Harlow",108000,21],["Harlow",111000,22],["Harlow",121000,23],["Cadence",1520000,24]]}}

In R the whole operation is one function call, and `rank()` does the sorting for you. Here are the four highest positions.

```r
# Replace every salary with its position in the pooled ranking of all 24
pooled_ranks <- rank(pay$salary)
ranked <- data.frame(company = pay$company, salary = pay$salary, rank = pooled_ranks)

head(ranked[order(-ranked$rank), ], 4)
#>    company  salary rank
#> 24 Cadence 1520000   24
#> 12  Harlow  121000   23
#> 11  Harlow  111000   22
#> 10  Harlow  108000   21
```

Look at the top two rows. The founder on 1,520,000 takes rank 24. The Harlow engineer on 121,000 takes rank 23. A gap of 1,399,000 dollars between those two people has just become a gap of one position.

She is still the highest paid person of the 24. She simply cannot be more than one place above whoever comes next.

=== step === concept
## Adding up each company's ranks

Once every person carries a position instead of a salary, comparing the two companies is just addition.

```r
# Add up each company's ranks and compare them with an even split
harlow_ranks  <- pooled_ranks[pay$company == "Harlow"]
cadence_ranks <- pooled_ranks[pay$company == "Cadence"]

c(harlow = sum(harlow_ranks), cadence = sum(cadence_ranks),
  all_ranks = sum(1:24), even_split = sum(1:24) / 2)
#>     harlow    cadence  all_ranks even_split
#>        199        101        300        150
```

The 24 positions always add up to 300, whatever the salaries happen to be, because they are always the numbers 1 through 24. If the two companies paid alike, the high positions and the low ones would fall on both sides fairly evenly, and each company's ranks would total somewhere near 150.

Harlow's ranks total 199 and Cadence's total 101. Harlow is holding almost all of the high positions, and that is the whole finding, stated without a single salary figure in it.

=== step === concept
## U is a count of head-to-head wins

199 carries the signal, but on its own it is awkward to read, because its floor depends on how many people are in the group. The twelve people at Harlow could not possibly total less than 1 + 2 + ... + 12 = 78, even if they were the twelve lowest paid of the 24. For a group of n people that floor is always n multiplied by (n + 1), divided by 2.

Subtract the floor and what is left is U.

`U = 199 - (12 * 13) / 2 = 199 - 78 = 121`

Here is the part worth slowing down for, because it is the reason the test exists at all.

That 121 is not an abstract statistic. It is a count of something you can go and count yourself.

Line up every Harlow person against every Cadence person and you get 12 times 12 = 144 head-to-head pairings. In each pairing ask the only question that matters: which of these two earns more? U is the number of pairings the Harlow person wins.

Let's check that by counting the wins directly and comparing the two.

```r
# Turn Harlow rank sum into U, then count the same wins pair by pair
n1 <- length(harlow)
n2 <- length(cadence)

u_harlow <- sum(harlow_ranks) - n1 * (n1 + 1) / 2
wins <- outer(harlow, cadence, ">")

c(from_ranks = u_harlow, from_pairs = sum(wins), pairings = n1 * n2)
#> from_ranks from_pairs   pairings
#>        121        121        144
```

`outer(harlow, cadence, ">")` builds the full 12 by 12 grid of those matchups and marks TRUE wherever the Harlow person out-earns the Cadence person. Counting the TRUEs gives 121, the same number the rank arithmetic gave.

[KEY INSIGHT]
U is a plain count. Out of the 144 possible Harlow versus Cadence matchups, the Harlow person earns more in 121 of them. Nothing in that count cares how far apart any two salaries are, only which of the two is bigger.

That last sentence is why a runaway salary has no power here. Pay the founder ten times what she already earns and count again.

```r
# Pay the founder ten times more and count the wins on both sides again
cadence_rich <- c(cadence[1:11], 15000000)

c(harlow_wins  = sum(outer(harlow, cadence_rich, ">")),
  founder_wins = sum(cadence_rich[12] > harlow))
#>  harlow_wins founder_wins
#>          121           12
```

U is still 121. The founder wins twelve pairings, one against each person at Harlow, and she was already winning all twelve of them at 1,520,000. There is no thirteenth Harlow person for the extra millions to beat.

=== step === tryit
## Your turn: count the pairs Cadence wins

Every one of the 144 pairings has a winner, so the two counts have to add up to all 144. Run the same count the other way round, then add the two together and see what you get.

```r
# harlow and cadence hold the twelve salaries from each company.
# Count how many of the 144 pairings the Cadence person wins,
# then add that count to the 121 that Harlow wins.
# Two lines. Press Check when you have them.
```
::check {"regex": "outer[(]\\s*cadence\\s*,\\s*harlow", "gate": true, "difficulty": "beginner", "ok": "Right: 23 wins for Cadence, and 121 + 23 = 144. Every pairing is claimed by one side or the other, which is why U counted from one side tells you U from the other.", "no": "Reuse the same outer() call from the grid above, with cadence first and harlow second, and keep the greater-than sign in quotes as the third argument. Then add that count to sum(outer(harlow, cadence, ...))."}
::solution
```r
# Count the pairings the Cadence person wins, then add the two counts
sum(outer(cadence, harlow, ">"))
#> [1] 23
sum(outer(harlow, cadence, ">")) + sum(outer(cadence, harlow, ">"))
#> [1] 144
```

Twelve of Cadence's 23 wins belong to the founder alone, one against each person at Harlow. The other eleven people at Cadence take eleven pairings between them, out of the 132 they turn up in.

=== step === concept
## Running the whole test with wilcox.test()

Everything so far was to show you what the number really is. In practice you get all of it out of one line.

```r
# Run the Mann-Whitney U test on the two salary vectors
mw <- wilcox.test(harlow, cadence)
mw
#>
#> 	Wilcoxon rank sum exact test
#>
#> data:  harlow and cadence
#> W = 121, p-value = 0.003637
#> alternative hypothesis: true location shift is not equal to 0
```

There are three things to read off that output.

**W = 121.** That is the U you counted by hand. R prints it under Wilcoxon's letter W rather than Mann and Whitney's U, but it is the same count of the same 144 pairings.

**"Wilcoxon rank sum exact test".** R names the test after Frank Wilcoxon, who published the rank sum version in 1945. Mann and Whitney published U two years later and showed the two statistics sit a fixed distance apart, so the two names describe one test. If an R output says Wilcoxon rank sum, you have run a Mann-Whitney U test. The word "exact" means R worked through the possibilities one by one rather than approximating.

**p-value = 0.003637.** That is small. We are going to build that number by hand in a minute, so it stops being something the function simply asserts.

Most of the time your data already sits in a data frame, and then the formula form saves you the two lines of subsetting.

```r
# Run the same test straight off the data frame, with a formula
wilcox.test(salary ~ company, data = pay)
#>
#> 	Wilcoxon rank sum exact test
#>
#> data:  salary by company
#> W = 121, p-value = 0.003637
#> alternative hypothesis: true location shift is not equal to 0
```

Same W, same p-value. Read `salary ~ company` as "salary broken down by company", and `data = pay` tells R where to find both columns.

[NOTE]
Which company R treats as group one is decided by the order of the factor levels. The company column was built with `levels = c("Harlow", "Cadence")`, so Harlow goes first and W counts Harlow's wins. Left to itself R sorts levels alphabetically, which puts Cadence first and prints W = 23 with exactly the same p-value. The test does not change, only the direction of the count flips.

=== step === concept
## Where that p-value comes from

Where does 0.003637 actually come from? The logic is the same as for any p-value: assume the boring story, then find out how often it produces a result as lopsided as yours.

The boring story here is that the two companies pay alike. Under that story the company name written beside each person is just a sticker, with no bearing on what they earn. So peel all 24 stickers off, deal them out again at random, twelve to a side, and work out U for the group that happened to collect the Harlow stickers. Do that ten thousand times and you have ten thousand versions of a world where the two companies really do pay the same.

```r
# Deal the company labels out at random 10,000 times and recompute U each time
set.seed(1)
null_u <- replicate(10000, {
  shuffled <- sample(pay$company)
  sum(pooled_ranks[shuffled == "Harlow"]) - n1 * (n1 + 1) / 2
})

hist(null_u, breaks = 40, col = "grey85", border = "white",
     main = "10,000 shuffles of the company labels",
     xlab = "U (pairings won by the 12 people labelled Harlow)")
abline(v = u_harlow, col = "red", lwd = 3)

mean(abs(null_u - 72) >= abs(u_harlow - 72))
#> [1] 0.0038
```

The grey pile holds the U values from those ten thousand shuffles. It is centred near 72, which is half of 144, and that is what you would expect: when the labels are random, each side wins about half the pairings.

The red line is the real result, U = 121. It is out in the thin right-hand tail, where very few shuffles reached.

The number underneath counts that tail properly. Shuffles landing at least as far from 72 as 121 does, counting both directions, turned up 38 times in 10,000. That is 0.0038. And `wilcox.test()` reported 0.003637 without shuffling anything at all, because with twelve against twelve it can work through every possible split exactly.

=== step === concept
## What a significant result lets you say

p = 0.003637 is small, so something real is going on. Now be careful about what you claim next, because this is where most write-ups slip.

What the test compared was who wins the pairings. So the claim it supports is exactly that one: pick a person at random from each company, and the Harlow person is more likely to be the higher earner. The standard phrasing is "salaries at Harlow tend to be higher than at Cadence", and that sentence is always safe.

What a small p-value on its own does not buy you is the sentence "Harlow's median is higher". The test only becomes a test of medians when the two distributions have the same shape and differ merely by a shift. These two plainly do not: Harlow's twelve salaries sit in a tidy band, while Cadence's eleven ordinary salaries sit lower with a single value 1,520,000 away from them.

R will still hand you an interval if you ask for one.

```r
# Ask the test for an interval around the pay gap
wilcox.test(harlow, cadence, conf.int = TRUE)
#>
#> 	Wilcoxon rank sum exact test
#>
#> data:  harlow and cadence
#> W = 121, p-value = 0.003637
#> alternative hypothesis: true location shift is not equal to 0
#> 95.5 percent confidence interval:
#>   7000 29000
#> sample estimates:
#> difference in location
#>                  17500
```

The 17,500 labelled "difference in location" is the Hodges-Lehmann estimate: take all 144 Harlow-minus-Cadence differences and pick the middle one. That is a median of differences, and it is worth checking that it is not the same thing as the difference between the two medians.

```r
# Compare the reported gap with the median of all 144 pairwise differences
c(pairwise_median = median(outer(harlow, cadence, "-")),
  median_gap      = median(harlow) - median(cadence))
#> pairwise_median      median_gap
#>           17500           18000
```

The two numbers come out at 17,500 and 18,000. They are close enough to be mistaken for each other, and different enough to show they are not the same quantity. Report the 17,500 as a typical difference between a Harlow person and a Cadence person, and the interval says that typical difference lies somewhere between 7,000 and 29,000.

Why 95.5 percent rather than a round 95? Because with twelve against twelve the exact interval can only stop at certain achievable confidence levels, and R gives you the first achievable one above 95.

=== step === quiz
## Quick check: which sentence reports this result correctly?

The test on the salaries returned W = 121 and p = 0.003637. Which of these sentences would you be willing to write down?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Harlow's mean salary is higher than Cadence's, and the test has now confirmed it. ::no
- If the two companies paid alike, a split of the pairings this lopsided would turn up about 4 times in 1,000, so salaries at Harlow tend to be higher than at Cadence. ::ok Exactly right. It states the assumption first, then how ordinary the data would be inside that assumption, and then the only claim the pairings support.
- There is a 0.4 percent chance that the two companies pay alike. ::no
- The test has established that Harlow's median salary is the higher of the two. ::no Harlow's mean is the lower of the two, 96,500 against 196,583, and this test never looked at means anyway. The p-value is not the chance the companies pay alike; it is how often randomly dealt labels would produce a split this lopsided. And a claim about medians needs the two distributions to have matching shapes, which these two do not. What survives is the pairwise claim.

=== step === concept
## The effect size: how big the gap is

p = 0.003637 says the pattern is hard to blame on luck. It says nothing at all about size. W is already sitting there ready to answer that one.

W was a count out of 144 possible pairings. Divide it by 144 and it turns into a share.

```r
# Turn W into the share of pairings Harlow wins, then into rank-biserial r
win_share     <- unname(mw$statistic) / (n1 * n2)
rank_biserial <- win_share - (1 - win_share)

round(c(win_share = win_share, rank_biserial = rank_biserial), 4)
#>     win_share rank_biserial
#>        0.8403        0.6806
```

The win share comes out at 0.8403. Pick one person at random from each company and 84 times in 100 the Harlow person is the one earning more. That single sentence is the most useful thing anyone can tell you about these two companies, and it is far more concrete than any p-value.

The second number, 0.6806, is the rank-biserial correlation: the share Harlow wins minus the share Cadence wins, 0.8403 minus 0.1597. It runs from -1, where the other group takes every pairing, through 0 for an even split, up to +1 where this group takes every pairing. By the usual convention anything past 0.5 counts as a large effect. Report whichever of the two your field expects, because both are built from the same 121 wins and carry the same information.

=== step === concept
## Ties, small samples and one-sided questions

Three wrinkles show up as soon as you run this test on data somebody actually collected.

**Ties.** Two people earning exactly the same amount cannot be given different positions, so R hands them both the average of the two positions they cover between them. Suppose one Harlow analyst is on 90,000, the same as one Cadence engineer.

```r
# Put one Harlow analyst on exactly the salary one Cadence engineer already earns
tied_harlow <- harlow
tied_harlow[5] <- 90000

rank(c(tied_harlow, cadence))[c(5, 23)]
#> [1] 15.5 15.5
wilcox.test(tied_harlow, cadence, exact = FALSE)
#>
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  tied_harlow and cadence
#> W = 120.5, p-value = 0.005573
#> alternative hypothesis: true location shift is not equal to 0
```

Both tied people take rank 15.5, the average of 15 and 16, and W comes out at 120.5 instead of 121, because that one pairing was half a win rather than a whole one. Any W ending in .5 is telling you there were ties.

**Small samples.** The tied call above passed `exact = FALSE` on purpose, to show you the other route R can take to a p-value. Instead of working through every possible split of the 24 people, it compares W against a normal curve, and "with continuity correction" is R noting that it nudged the comparison a little, because W lands on whole and half numbers while a normal curve is smooth. With twelve against twelve R can afford to work through every split, and that is what "exact test" meant in the outputs before it. Past roughly fifty per group it approximates whether you ask or not, because the number of possible splits gets astronomical.

**One-sided questions.** The default asks whether the two companies pay differently. If your question was specifically whether Harlow pays more, say so.

```r
# Ask a one-sided question: does Harlow pay more, rather than differently
wilcox.test(harlow, cadence, alternative = "greater")
#>
#> 	Wilcoxon rank sum exact test
#>
#> data:  harlow and cadence
#> W = 121, p-value = 0.001818
#> alternative hypothesis: true location shift is greater than 0
```

The p-value comes back at 0.001818, exactly half of 0.003637, because you have stopped counting the tail on the other side. Only ask a one-sided question when you settled on the direction before seeing the data. Deciding afterwards is halving your p-value for free.

=== step === concept
## Writing the result in one sentence

A finished report carries six things: the name of the test, both group sizes, W, the p-value, an effect size and the direction. Build the sentence with `paste0()` and read every number straight off the test object, so nothing gets retyped wrongly on the way.

```r
# Build the report sentence by reading every number off the test object
report <- paste0(
  "A Mann-Whitney U test found salaries at Harlow Systems (n = ", n1,
  ") ranked higher than at Cadence Labs (n = ", n2,
  "), W = ", unname(mw$statistic),
  ", p = ", signif(mw$p.value, 3),
  ", win share = ", round(win_share, 2),
  ", rank-biserial r = ", round(rank_biserial, 2), "."
)

cat(report, "\n")
#> A Mann-Whitney U test found salaries at Harlow Systems (n = 12) ranked higher than at Cadence Labs (n = 12), W = 121, p = 0.00364, win share = 0.84, rank-biserial r = 0.68.
```

Read that sentence back and notice what it never does. It never claims a difference in medians, and it never puts a probability on the truth. It says which way the ranks fell, how far the result sits from what luck produces, and how big the gap is.

=== step === quiz
## Practice: which test, and what does the output say?

Here is a new situation, away from salaries. Your team ships a redesigned onboarding flow and asks two groups of ten people to rate it from 1 to 7. Group A went through the new version, group B through the old one.

```r
# Two groups of ten rate an onboarding flow from 1 to 7
rating_a <- c(6, 7, 5, 7, 6, 7, 4, 6, 7, 5)
rating_b <- c(3, 5, 2, 4, 6, 3, 4, 2, 5, 3)

wilcox.test(rating_a, rating_b, exact = FALSE)
#>
#> 	Wilcoxon rank sum test with continuity correction
#>
#> data:  rating_a and rating_b
#> W = 90.5, p-value = 0.002147
#> alternative hypothesis: true location shift is not equal to 0
```

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Ratings are an order rather than a measured amount, and ten per group is small, so a rank test fits. W = 90.5 means group A wins 90.5 of the 100 pairings, the half coming from tied ratings, and p = 0.002147 is how often randomly dealt labels would be this lopsided. ::ok Yes, all three parts of it. The .5 in W is the giveaway for ties, which is also why exact = FALSE was passed.
- The ratings are numbers from 1 to 7, so a two-sample t-test on the two means is the right call, and ranking them throws information away. ::no
- W = 90.5 is the difference between the two groups' average ratings. ::no
- p = 0.002147 is the probability that the two groups rated the flow the same. ::no A 1 to 7 rating is an order, not a measured quantity: the step from 6 to 7 need not be the same size as the step from 1 to 2, so averaging is arithmetic on labels. W is not a difference between averages either; it is a count of the 100 head-to-head pairings that group A wins, with a tied pair counting half. And the p-value is not the chance the two groups agree, it is how often random labelling produces a split this extreme.

=== step === tryit
## Practice: run the whole test on a new pair of groups

`airquality` ships with R and holds daily air readings from one summer in New York. Ozone was measured on some days and missing on others, and 26 readings survive in each of May and August. Find out whether one month ran higher than the other.

Run the test on `may` and `aug`, then turn W into the share of pairings that the May reading wins.

```r
# Pull the May and August ozone readings out of airquality, dropping missing days
may <- na.omit(airquality$Ozone[airquality$Month == 5])
aug <- na.omit(airquality$Ozone[airquality$Month == 8])

# Save the test to aq and print it, then divide its statistic by the
# number of pairings, length(may) * length(aug).
# Two lines. Press Check when you have them.
```
::check {"regex": "wilcox[.]test[(]", "gate": true, "difficulty": "intermediate", "ok": "That is it: W = 127.5 and p = 6.109e-05. W counts pairings won by the May reading out of 26 times 26 = 676, a win share of 0.19, so a random May day out-reads a random August day only 19 times in 100. August is the higher month by a wide margin, and the .5 in W says some readings tied.", "no": "Two lines. First aq <- wilcox.test(may, aug), then print aq. Then round(unname(aq$statistic) / (length(may) * length(aug)), 2) for the share."}
::solution
```r
# Run the test on the two months, then turn W into a share of the pairings
aq <- wilcox.test(may, aug)
aq
#>
#> 	Wilcoxon rank sum exact test
#>
#> data:  may and aug
#> W = 127.5, p-value = 6.109e-05
#> alternative hypothesis: true location shift is not equal to 0

round(unname(aq$statistic) / (length(may) * length(aug)), 2)
#> [1] 0.19
```

=== step === quiz
## Practice: what may you claim from this result?

You have twenty six measured days in May and twenty six in August, W = 127.5 counted for May, p = 6.109e-05, and a win share of 0.19. Which write-up would you put your name to?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- A Mann-Whitney U test found a significant difference between May and August ozone, p = 6.109e-05. ::no
- A Mann-Whitney U test proved that August has a higher median ozone level than May, p = 6.109e-05. ::no
- There is a 0.006 percent chance that May and August ozone are the same, so August is higher. ::no The first sentence is true but useless: it hides the direction and the size, so nobody can tell whether the gap matters. The second claims a median, which needs the two months to have matching distribution shapes, and it says "proved", which no test ever does. The third turns the p-value into a probability about the truth, when it is the chance of a split this lopsided if the two months ran alike.
- A Mann-Whitney U test found August ozone ranked higher than May (n = 26 each), W = 127.5, p = 0.000061, win share 0.19: a random May day out-reads a random August day only 19 times in 100. ::ok That is the full set. Group sizes, the statistic, the p-value, the direction, and a size that a reader can picture without knowing any statistics.

=== step === concept
## References

- [On a Test of Whether one of Two Random Variables is Stochastically Larger than the Other](https://doi.org/10.1214/aoms/1177730491) - Mann and Whitney (1947), Annals of Mathematical Statistics 18(1), 50-60. The original paper, where U arrives as a count of pairwise wins.
- [The Wilcoxon-Mann-Whitney Procedure Fails as a Test of Medians](https://doi.org/10.1080/00031305.2017.1305291) - Divine, Norton, Baron and Juarez-Colunga (2018), The American Statistician 72(3), 278-286. Why "higher median" needs matching shapes and "tends to be higher" does not.
- [The Simple Difference Formula: An Approach to Teaching Nonparametric Correlation](https://doi.org/10.2466/11.IT.3.1) - Kerby (2014), Comprehensive Psychology 3. Rank-biserial as the win share minus the loss share.
- [A Common Language Effect Size Statistic](https://doi.org/10.1037/0033-2909.111.2.361) - McGraw and Wong (1992), Psychological Bulletin 111(2), 361-365. The source of the "84 times in 100" way of stating an effect.
- [Wilcoxon Rank Sum and Signed Rank Tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/wilcox.test.html) - R Core Team. Exact against approximate p-values, ties, and the Hodges-Lehmann estimate.

=== step === complete
## Quick recap

You took two salary lists that a t-test could make nothing of, and got a clear answer out of them by throwing the amounts away and keeping the order.

- **When to reach for it.** One or two runaway values, numbers that are only an order, or groups too small to argue about shape. It needs independent observations, and nothing else.
- **The three moves.** Pool all 24 salaries, rank them 1 to 24, count the head-to-head wins. Harlow's ranks summed to 199, and 199 minus the floor of 78 gave U = 121.
- **What U is.** A count. Out of 144 Harlow versus Cadence pairings the Harlow person earns more in 121, and paying the founder ten times more does not move it.
- **The one line.** `wilcox.test(harlow, cadence)`, or `wilcox.test(salary ~ company, data = pay)`, both returning W = 121 and p = 0.003637.
- **What you may claim.** Salaries at Harlow tend to be higher. Not that the median is higher, unless the two distributions have the same shape.
- **How big the gap is.** 121 out of 144 is 0.84, so the Harlow person earns more 84 times in 100.

And here is the sentence to write down when somebody asks:

"A Mann-Whitney U test found salaries at Harlow Systems (n = 12) ranked higher than at Cadence Labs (n = 12), W = 121, p = 0.00364, win share = 0.84."

Next time an average looks wrong to you, you have somewhere to go with it. Nicely done, and enjoy the rest of your day.
