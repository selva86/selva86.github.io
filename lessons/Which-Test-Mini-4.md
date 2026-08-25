---
title: "Fisher's exact test: when and how, with a worked example"
slug: "Which-Test-Mini-4"
description: "Chi-square warns it may be wrong on a 17-patient table. Build Fisher's exact p-value by hand from all eight possible tables, then read every number R prints."
keywords: "fishers exact test, fisher.test in R, 2x2 contingency table, small sample statistics, exact p-value, hypergeometric distribution, odds ratio in R, chi-square expected counts"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "4"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-3"
course_next: ""
curriculum_id: "0.0.28"
lesson_access: "windowed"
catalog_blurb: "What to run when a 2x2 table is too small for chi-square."
---

=== step === cover
::eyebrow Which Test Do I Run?
## Fisher's exact test: when and how, with a worked example

Let's say a hospital runs a tiny pilot study. Seventeen patients take part in it. Eight of them get a new treatment and seven of those eight improve. Of the nine who get nothing extra, only three improve.

That is 88% against 33%, and on paper it looks convincing.

But the whole study is seventeen people. Toss a coin seventeen times and you will see streaks that look like a pattern and are not. So the real question is this: in a world where the treatment does nothing at all, how often does luck alone deal out a split this lopsided?

The reflex is to reach for a chi-square test. We will do exactly that in a minute, and R will hand back an answer along with a warning that the answer may be wrong.

Fisher's exact test is the one that needs no warning. It approximates nothing. It counts.

Here is the whole idea in three moves.

::widget process-flow {"steps":[{"title":"Fix all four totals","sub":"8 treated, 9 untreated, 10 improved, 7 not improved"},{"title":"List every table they allow","sub":"each of the eight gets an exact probability"},{"title":"Add up the unlikely ones","sub":"the tables no more likely than yours, summed"}]}

Everything from here is doing those three moves on the seventeen patients, by hand first and then in one line of R.

=== step === concept
## The 17 patients as a 2x2 table

Before any test, let's get the counts written down, because every number we compute afterwards comes out of them.

We know two things about each patient: whether they were treated, and whether they improved. Two yes-or-no questions, so all seventeen patients fit into a 2 by 2 grid of counts. `matrix()` builds that grid and `dimnames` names the rows and columns so the printed output reads like English.

Press Run.

```r
# Put the 17 patients into a 2x2 table and read off each group's improvement rate
trial <- matrix(c(7, 3, 1, 6), nrow = 2,
                dimnames = list(group   = c("Treated", "Untreated"),
                                outcome = c("Improved", "Not")))
trial
#>            outcome
#> group       Improved Not
#>   Treated          7   1
#>   Untreated        3   6

addmargins(trial)
#>            outcome
#> group       Improved Not Sum
#>   Treated          7   1   8
#>   Untreated        3   6   9
#>   Sum             10   7  17

round(100 * prop.table(trial, margin = 1), 1)
#>            outcome
#> group       Improved  Not
#>   Treated       87.5 12.5
#>   Untreated     33.3 66.7
```

`matrix()` fills down the columns, so `c(7, 3, 1, 6)` puts 7 and 3 in the Improved column and 1 and 6 in the Not column.

`addmargins()` prints the totals along the edges. Those four numbers, 8 treated, 9 untreated, 10 improved and 7 not improved, are called the margins of the table. Right now they look like bookkeeping. They turn out to be the hinge of the whole test.

`prop.table(trial, margin = 1)` divides every cell by its own row total, so we read across: 87.5% of the treated group improved against 33.3% of the untreated group.

That is a gap of 54 percentage points, out of seventeen people. Let's see what a test makes of it.

=== step === concept
## Why chi-square cannot be trusted on 17 patients

The chi-square test compares what you saw against what you would expect if the treatment did nothing. The expected count for any cell is its row total times its column total, divided by the grand total. For the treated-and-improved cell that is 8 times 10 over 17, which comes to 4.71.

It then adds up the gaps between observed and expected into a single number, and looks that number up on a smooth curve called the chi-square distribution.

The look-up is where the trouble starts. That curve is a continuous stand-in for something that is really a count, and it only becomes accurate as the counts grow. The working rule everyone uses is that every expected count should reach at least 5.

Let's see what our table gives.

```r
# Run the chi-square test, catch the warning it raises, and inspect the expected counts
cs <- suppressWarnings(chisq.test(trial))
cs$expected
#>            outcome
#> group       Improved      Not
#>   Treated   4.705882 3.294118
#>   Untreated 5.294118 3.705882

tryCatch(chisq.test(trial), warning = function(w) conditionMessage(w))
#> [1] "Chi-squared approximation may be incorrect"

cs
#>
#> 	Pearson's Chi-squared test with Yates' continuity correction
#>
#> data:  trial
#> X-squared = 3.1377, df = 1, p-value = 0.0765

suppressWarnings(chisq.test(trial, correct = FALSE))
#>
#> 	Pearson's Chi-squared test
#>
#> data:  trial
#> X-squared = 5.1304, df = 1, p-value = 0.02351
```

Three of the four expected counts, 4.71, 3.29 and 3.71, sit below 5. `chisq.test()` notices and attaches a warning to its own answer. The `tryCatch()` line catches that warning and prints its text so you can read it, and `suppressWarnings()` stops it repeating on the other calls.

Now compare the two p-values. With Yates' continuity correction, which `chisq.test()` applies to a 2 by 2 table by default, you get 0.0765 and you keep the null hypothesis. Switch the correction off with `correct = FALSE` and you get 0.0235 and you reject it.

Same seventeen patients and the same table, two opposite decisions, and the only thing that changed was one argument.

[WARNING]
When R says the chi-square approximation may be incorrect, it is not being fussy. It is telling you the p-value it just printed may be wrong, and on this table the correction alone moves that p-value from 0.0765 to 0.0235. Read the warning as an instruction to change tests, not as noise to silence.

=== step === widget
## What the chi-square test assumes about your table

Look again at the X-squared value R printed without the correction: 5.13. On a 2 by 2 table that number is a squared z-score, so take its square root and you get z = 2.27. That is how far our table sits from "no effect", measured in standard deviations.

The chi-square test then does exactly one thing with that z. It reads the area in the two tails of a smooth bell curve beyond it, and reports that area as the p-value.

The curve below is that bell curve and the orange slice is the tail area. The slider is the observed z, and it starts at 2.25, near where our table sits. Read the number under the curve: about 0.024, which is the 0.0235 R printed a moment ago.

::widget null-distribution {"tails": 2, "start": 2.25, "label": "observed z"}

Drag the slider and watch the slice. Push the result further from zero and it shrinks, pull it back toward zero and it swells. None of that behaviour is wrong. The problem is the curve itself.

A curve like this has a height at every point along the axis, so it assumes the result could have landed anywhere in between. With seventeen whole patients it could not. Only a handful of tables exist at this size, so the truth is a few separate bars and the gaps between them, not a smooth ribbon. Laying a continuous curve over a handful of bars works fine when the counts are large and badly when they are this small.

That is the whole reason for the warning. So let's stop approximating, hold the totals still, and count the tables instead.

=== step === quiz
## Quick check: when does a 2x2 table need an exact test?

Here is a different table, from a survey of 40 people, printed beside its expected counts.

| Observed | Yes | No |
|---|---|---|
| Group A | 2 | 18 |
| Group B | 6 | 14 |

| Expected | Yes | No |
|---|---|---|
| Group A | 4 | 16 |
| Group B | 4 | 16 |

Which fact tells you this table wants an exact test rather than chi-square?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Both groups hold 20 people, so the table is perfectly balanced and chi-square has nothing left to detect. ::no
- One observed cell holds only 2 people, and any observed count under 5 rules chi-square out. ::no
- Two of the expected counts are 4, and the chi-square approximation needs every expected count to reach at least 5. ::ok Exactly. The rule is about expected counts, row total times column total over the grand total, not about the counts you happened to observe.
- The survey covers 40 people, and 40 is too few for any test to say anything. ::no The trigger is never the observed counts, the sample size, or how balanced the table looks. It is the expected counts: row total times column total divided by the grand total. Two of them here come to 4, which is under 5, so the smooth curve chi-square reads its p-value from is not trustworthy and an exact test is the honest choice.

=== step === concept
## Holding the totals fixed leaves only eight possible tables

Here is the move that makes an exact answer possible at all.

Take the four totals from the edges of our table and nail them down: 8 patients treated, 9 untreated, 10 improved, 7 not improved. Those are facts about how the study ran. Fisher's test then asks one narrow question inside them: how were those 10 improvements shared out between the two groups, and was our share a surprising one?

Once all four totals are fixed the table has almost no freedom left. Choose any number for the top-left cell, the treated patients who improved, and the other three cells follow automatically. Say 5 of the treated improved. Then 3 of them did not, because 8 were treated; 5 of the untreated improved, because 10 improved altogether; and 4 untreated did not.

So a single number describes the whole table. And that number cannot be just anything. At most 8 of the treated could have improved, since only 8 were treated. At least 1 must have, because only 7 patients in the entire study failed to improve, and 7 non-improvers cannot cover all 8 treated patients. That leaves 1 through 8.

Let's write them all out.

```r
# Build every 2x2 table the four fixed totals still allow, one row per table
tables <- NULL
for (k in 1:8) {
  tables <- rbind(tables,
                  data.frame(treated_improved   = k,
                             treated_not        = 8 - k,
                             untreated_improved = 10 - k,
                             untreated_not      = k - 1))
}
tables
#>   treated_improved treated_not untreated_improved untreated_not
#> 1                1           7                  9             0
#> 2                2           6                  8             1
#> 3                3           5                  7             2
#> 4                4           4                  6             3
#> 5                5           3                  5             4
#> 6                6           2                  4             5
#> 7                7           1                  3             6
#> 8                8           0                  2             7
```

Each row is a complete 2 by 2 table. The seventh row is the study we actually ran: 7 treated improved, 1 did not, 3 untreated improved, 6 did not. Add up any row and you will find the same four totals down the edges.

Eight tables, and that is the entire set of results this study could have produced. Finding a p-value is now arithmetic over eight numbers, instead of a curve stretched across infinitely many.

=== step === concept
## The probability of one table, worked out by hand

Next, let's attach a probability to each of the eight.

Under the null hypothesis the treatment does nothing, which means the 10 patients who improved were always going to improve, whichever group they had landed in. So which 10 of the 17 are the improvers is a pure random draw, and every way of choosing 10 patients out of 17 is equally likely.

Count them. `choose(17, 10)` gives the number of ways to pick 10 patients out of 17, and that comes to 19,448 equally likely arrangements.

Now count the arrangements that give our table. Ours has 7 improvers among the 8 treated patients, so pick which 7 of those 8 improved: `choose(8, 7)`, which is 8 ways. The other 3 improvers have to come from the 9 untreated: `choose(9, 3)`, which is 84 ways. Multiply and you get 8 times 84, or 672 arrangements out of 19,448.

In symbols, writing k for the number of improvers among the treated:

$$P(X = k) = \frac{\binom{8}{k}\binom{9}{10-k}}{\binom{17}{10}}$$

Let's run both the arithmetic and R's built-in version of it.

```r
# Count the arrangements giving 7 improvers among the treated, and turn that into a probability
choose(8, 7) * choose(9, 3)
#> [1] 672

choose(17, 10)
#> [1] 19448

choose(8, 7) * choose(9, 3) / choose(17, 10)
#> [1] 0.03455368

dhyper(7, 8, 9, 10)
#> [1] 0.03455368
```

Both routes give the same 0.03455. The second one is shorter because this pattern has a name: the **hypergeometric distribution**, which describes how many items of one kind you get when you draw a fixed number without replacement from a fixed pool. Read `dhyper(7, 8, 9, 10)` as "out of 8 treated and 9 untreated patients, hand out 10 improvements at random, and give me the probability that exactly 7 of them land on treated patients".

Written for any 2 by 2 table, with row totals r1 and r2, first column total c1 and grand total n, the same formula is:

$$P(X = k) = \frac{\binom{r_1}{k}\binom{r_2}{c_1 - k}}{\binom{n}{c_1}}$$

That is the engine of the whole test, and it is the only formula in it.

=== step === concept
## All eight probabilities, and which count as extreme as yours

`dhyper()` accepts a vector, so one line gives us all eight probabilities at once.

```r
# Compute the probability of all eight possible tables and mark the extreme ones
pk <- dhyper(1:8, 8, 9, 10)
round(pk, 5)
#> [1] 0.00041 0.01296 0.10366 0.30234 0.36281 0.18141 0.03455 0.00185

sum(pk)
#> [1] 1

extreme <- pk <= pk[7] * (1 + 1e-7)
extreme
#> [1]  TRUE  TRUE FALSE FALSE FALSE FALSE  TRUE  TRUE

barplot(pk, names.arg = 1:8,
        col = ifelse(extreme, "orange", "grey85"), border = "white",
        main = "The eight tables the fixed totals allow",
        xlab = "Improved patients among the 8 treated",
        ylab = "Probability when the treatment does nothing")
```

They add to exactly 1, which is the check that we really did list everything. Most of the weight sits on 4, 5 and 6 treated improvers, which is what you would expect when the treatment does nothing: the 10 improvements spread out roughly in proportion to group size. Our own table, 7 improvers among the treated, carries probability 0.03455.

Now comes the phrase that decides the p-value: at least as extreme. Under fixed totals, extreme means unlikely. It does not mean large, and it does not mean favourable. So the test puts one question to each of the eight bars: is that bar at most as tall as ours?

Four of them are, and the orange bars are those four: 1, 2, 7 and 8. They are the lopsided results at both ends, our own table among them. The `1 + 1e-7` is a hair of tolerance so that a bar exactly as tall as ours is not dropped by floating point rounding. No other bar sits that close here, so a plain `pk <= pk[7]` picks out the same four.

Add those four probabilities together and you have the p-value.

[KEY INSIGHT]
Fisher's exact test never estimates a tail area. It lists every table the fixed totals allow, gives each one its exact probability, and adds up the ones no more likely than yours. Nothing along the way is approximated, which is what the word exact is doing in the name.

=== step === quiz
## Quick check: which tables count as at least as extreme?

The eight probabilities, one per possible table, came out like this.

| Improved among the 8 treated | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Probability | 0.00041 | 0.01296 | 0.10366 | 0.30234 | 0.36281 | 0.18141 | 0.03455 | 0.00185 |

We observed 7. Which tables go into the two-sided p-value?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Only 7 and 8, because those are the tables that favour the treatment at least as much as ours does. ::no
- 1, 2, 7 and 8, because each of those has probability at most 0.03455, counting both ends. ::ok Right. Extreme means unlikely rather than favourable, so a table down at 1 improver qualifies even though it points the other way.
- Only 8, because that is the single most lopsided table there is. ::no
- All eight, because a p-value always sums over the whole distribution. ::no The rule is a comparison of probabilities, not a direction and not a total. Take our table's probability, 0.03455, and keep every table at most that likely. That picks up 1 at 0.00041, 2 at 0.01296, 7 at 0.03455 itself and 8 at 0.00185, and leaves the four fat bars in the middle out.

=== step === tryit
## Your turn: add up the exact p-value

`pk` still holds those eight probabilities, in order from 1 improver among the treated up to 8. Our own table is the seventh of them, `pk[7]`.

Keep every probability that is at most as large as `pk[7]` and add them up. It takes one line, and no test function anywhere in it.

```r
# pk holds the probability of each of the eight possible tables.
# pk[7] is the probability of the table we actually observed.
# Keep every probability at most as large as pk[7], then sum them.
# One line. Press Check when you have it.
```
::check {"regex": "sum[(]pk\\[pk\\s*<=\\s*pk\\[7\\]", "gate": true, "difficulty": "beginner", "ok": "That is 0.04977, and you built it yourself out of four numbers. There is no approximation anywhere in it.", "no": "Subset pk using a condition on pk itself, then sum the result: sum(pk[pk <= pk[7]])."}
::solution
```r
# Add up every table probability at most as large as the one we observed
sum(pk[pk <= pk[7]])
#> [1] 0.04977376
```

That number, 0.04977, is the exact p-value for the pilot study.

=== step === concept
## fisher.test() in one line

You will never do that by hand again, because R runs the whole enumeration for you.

```r
# Run Fisher's exact test on the 17 patients
ft <- fisher.test(trial)
ft
#>
#> 	Fisher's Exact Test for Count Data
#>
#> data:  trial
#> p-value = 0.04977
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>    0.8564753 728.9937469
#> sample estimates:
#> odds ratio
#>   11.63911
```

There it is: 0.04977, the same number we added up by hand, matching to every decimal shown.

Read the rest of the block too, because those are not three loose numbers stacked up, they are one inference. On a 2 by 2 table, "treatment and outcome are independent" is exactly the same statement as "the odds ratio is 1". That is why the alternative hypothesis line, the confidence interval and the odds ratio estimate all talk about the same quantity, and why the p-value is a test of whether that quantity is 1.

Two of those numbers surprise people, so let's take them one at a time.

=== step === concept
## The odds ratio R reports, and why it is not 14

Odds are not the same thing as a rate. Among the treated, 7 improved and 1 did not, so the odds of improving are 7 to 1, which is 7. Among the untreated, 3 improved and 6 did not, so the odds are 3 to 6, which is 0.5. Divide the first by the second and the odds ratio is 14: the treated group's odds of improving are 14 times the untreated group's.

That is the sample odds ratio, and it is the number almost everyone works out by hand. R printed 11.64.

```r
# Compare the hand-computed sample odds ratio with the one fisher.test reports
(7 * 6) / (1 * 3)
#> [1] 14

ft$estimate
#> odds ratio
#>   11.63911
```

The gap is not rounding and it is not a bug. The sample odds ratio is what the four cells say on their own. R reports the conditional maximum likelihood estimate instead, which is the odds ratio that makes the table we actually saw as likely as it can possibly be, given the fixed totals. It is computed inside the same conditional world that produced the p-value, and that is exactly why it belongs next to it. On small or sparse tables the two numbers can sit well apart, and 14 against 11.64 is that gap showing up on seventeen patients.

So report the number R printed rather than the one you did in your head. Otherwise the odds ratio in your write-up and the p-value beside it come from two different calculations, and a careful reader will notice.

=== step === concept
## Why the interval runs from 0.86 to 729

The third number in that block is the confidence interval, and it is the one that tells the truth about sample size.

```r
# Print the confidence interval next to the p-value it belongs with
ft$conf.int
#> [1]   0.8564753 728.9937469
#> attr(,"conf.level")
#> [1] 0.95

ft$p.value
#> [1] 0.04977376
```

The interval runs from 0.86 to 729. An odds ratio of 1 means no effect at all, and 1 falls inside that range. So the honest reading is that these data are consistent with anything from a treatment that is very slightly harmful to one that multiplies the odds of improving several hundredfold. That is what seventeen patients buys, and no choice of test can buy more.

Now here is the puzzle. The p-value is 0.0498, which is under 0.05, and yet the 95% interval covers 1. Those two normally travel together, so seeing them disagree looks like a contradiction.

They can disagree here because R builds them by two different rules. The p-value adds up the probability of every table no more likely than ours, pooling both directions into one sum. The interval is built by inverting the exact test at 2.5% on each side separately, which is a slightly stricter requirement. So a table can clear 0.05 on the two-sided p-value while its interval still includes 1. That is a known and documented property of the exact method, not a fault in the output.

[NOTE]
When the p-value and the interval disagree at the boundary, do not quietly pick the one you prefer. Report both. On a table this small, "p = 0.0498, 95% interval 0.86 to 729" is a far more honest line than the word significant on its own.

=== step === quiz
## Quick check: what the p-value and the interval together allow

Fisher's exact test on the 17 patients returned p = 0.0498, an odds ratio of 11.6, and a 95% confidence interval from 0.86 to 729. Which reading of that is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The two numbers contradict each other, so the output is broken and cannot be used. ::no
- The result clears 0.05, and the interval says the size of the effect is barely pinned down at all. ::ok That is the pair of facts to carry out of the meeting. There is enough evidence here to take the treatment seriously, and nowhere near enough to say how much it helps.
- The treated group's odds of improving are multiplied by exactly 11.6. ::no
- The interval covers 1, so nothing is significant and the p-value should be thrown away. ::no Neither number cancels the other, and neither one is an exact measurement. The p-value answers how often luck alone would produce a table this lopsided, and 0.0498 says rarely. The interval answers how big the effect is, and 0.86 to 729 says we barely know. Both belong in the report, and 11.6 is a point estimate from 17 patients, not a settled multiplier.

=== step === concept
## Two-sided or one-sided, and what each one claims

By default the test asks whether the treatment shifts the odds of improving in either direction, better or worse. If your question was only ever whether the treatment does better, you can say so with the `alternative` argument.

```r
# Run the one-sided version, asking only whether the treatment does better
ft_one <- fisher.test(trial, alternative = "greater")
ft_one
#>
#> 	Fisher's Exact Test for Count Data
#>
#> data:  trial
#> p-value = 0.0364
#> alternative hypothesis: true odds ratio is greater than 1
#> 95 percent confidence interval:
#>  1.149848      Inf
#> sample estimates:
#> odds ratio
#>   11.63911
```

Two things moved. The p-value fell from 0.0498 to 0.0364, because only the tables that favour the treatment now count towards it and the lopsided ones in the other direction are ignored. And the interval became a one-sided lower bound, 1.15 upwards, which clears 1 where the two-sided interval did not.

That gain is real, and it is not free. The one-sided test buys its smaller p-value by giving up the ability to notice harm: run `alternative = "greater"` on a treatment that makes patients worse and it returns a p-value near 1, however badly the treatment did.

So choose the side before you look at the data, and write down why you chose it. Picking "greater" after noticing that the treated group came out ahead is not a one-sided test. It is a two-sided test with the inconvenient half deleted, and the 0.0364 it prints does not mean anything.

=== step === concept
## When chi-square is the right call after all

Fisher's exact test is not automatically the better test. It is the better one when the counts are small. Once they are not, the chi-square approximation is as good as exact and far quicker, because enumerating tables gets expensive as the numbers grow.

Let's run the same comparison on a table built from a thousand observations.

```r
# Compare chi-square and Fisher on a table with 1,000 observations
click_tab <- matrix(c(120, 95, 380, 405), nrow = 2,
                    dimnames = list(version = c("New", "Old"),
                                    action  = c("Clicked", "Did not")))
click_tab
#>        action
#> version Clicked Did not
#>     New     120     380
#>     Old      95     405

chisq.test(click_tab)$expected
#>        action
#> version Clicked Did not
#>     New   107.5   392.5
#>     Old   107.5   392.5

c(chi_square = chisq.test(click_tab)$p.value,
  fisher     = fisher.test(click_tab)$p.value)
#> chi_square     fisher
#> 0.06469150 0.06453413
```

Every expected count is above 100, so the approximation has nothing to strain against, and the two p-values agree to three decimals. On a table like this, run `chisq.test()` and move on.

Two more cases are worth knowing about. `fisher.test()` does handle tables bigger than 2 by 2, but on large or sparse ones the enumeration can crawl, or stop outright with an FEXACT workspace error. The fix for that is `simulate.p.value = TRUE`, which estimates the same p-value by Monte Carlo in a fraction of the time, and it beats raising the `workspace` argument and hoping. Also, past 2 by 2 there is no single odds ratio to report, because an odds ratio only means something for two rows against two columns.

=== step === concept
## The sentence you write in the report

You now have three numbers and a sample size, and all four belong in the write-up. A p-value on its own cannot tell a large effect apart from a barely-there one, and on seventeen patients that difference is the entire story.

[KEY INSIGHT]
In a pilot of 17 patients, 7 of 8 treated patients improved against 3 of 9 untreated (Fisher's exact test, p = 0.0498; odds ratio 11.6, 95% CI 0.86 to 729).

Every part of that sentence earns its place. The raw counts let a reader rebuild your table and rerun your test. Naming Fisher's exact test explains why you did not use chi-square, before anyone asks. The p-value says the result clears the conventional line. And the interval, which is the piece people leave out, says out loud that the size of the effect is still wide open, so nobody walks away treating 11.6 as a measured fact.

=== step === quiz
## Quick check: which test does this table need?

An A/B test on a landing page collected 1,000 visitors.

| Observed | Signed up | Did not |
|---|---|---|
| New page | 120 | 380 |
| Old page | 95 | 405 |

Its four expected counts are 107.5, 392.5, 107.5 and 392.5. Which test should you run?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Fisher's exact test, because an exact answer is always better than an approximate one. ::no
- Fisher's exact test, because the table is 2 by 2 and that is what the exact test is built for. ::no
- Chi-square, because every expected count is far past 5, so the approximation is reliable and much faster. ::ok Exactly. On this table the two tests return 0.0647 and 0.0645, so the exact one costs you time and buys you nothing.
- Either one, because with counts this large the two tests cannot possibly disagree. ::no The size of the expected counts decides it, and all four here are above 100, which is well past the point where the chi-square approximation stops straining. So chi-square is the right call. The two tests do land in almost the same place, 0.0647 against 0.0645, but "almost the same" is something you check on the day, not something you assume in advance.

=== step === tryit
## Your turn: run the exact test on a fresh 2x2 and report it

A gardener tries compost on a tray of seedlings. Seven seeds go into compost and 6 of them sprout. Eight seeds go into plain soil and 2 of them sprout. Fifteen seeds in total, so chi-square is out before you start.

Build that table as `seed_tab`, with compost in the first row and Sprouted in the first column. Then run Fisher's exact test on it, store the result in `seed_ft`, and print the whole thing.

```r
# Compost: 7 seeds sown, 6 sprouted. Plain soil: 8 seeds sown, 2 sprouted.
# Build the 2x2 as seed_tab, compost first, Sprouted in the first column.
# Run fisher.test on it, store the result in seed_ft, and print seed_ft.
# Press Check when you have it.
```
::check {"regex": "fisher[.]test[(]\\s*seed_tab", "gate": true, "difficulty": "intermediate", "ok": "p = 0.04056, odds ratio 13.96, interval 0.90 to 953. Significant, and on 15 seeds the size of the effect is anybody's guess.", "no": "Build the table the same way as the trial: matrix(c(6, 2, 1, 6), nrow = 2), then seed_ft <- fisher.test(seed_tab)."}
::solution
```r
# Build the 15-seedling table and run Fisher's exact test on it
seed_tab <- matrix(c(6, 2, 1, 6), nrow = 2,
                   dimnames = list(soil    = c("Compost", "Plain"),
                                   outcome = c("Sprouted", "Not")))
seed_tab
#>          outcome
#> soil      Sprouted Not
#>   Compost        6   1
#>   Plain          2   6

seed_ft <- fisher.test(seed_tab)
seed_ft
#>
#> 	Fisher's Exact Test for Count Data
#>
#> data:  seed_tab
#> p-value = 0.04056
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>    0.9040436 953.3729037
#> sample estimates:
#> odds ratio
#>   13.95942
```

Written up, that reads: in a tray of 15 seedlings, 6 of 7 compost seeds sprouted against 2 of 8 in plain soil (Fisher's exact test, p = 0.041; odds ratio 14.0, 95% CI 0.90 to 953).

=== step === tryit
## Your turn: switch to the one-sided test and see what moves

`seed_tab` is still in memory. The gardener's question was never whether compost changes anything, it was whether compost does better. Run the same test with that alternative, then print its p-value and its confidence interval.

```r
# seed_tab still holds the 15 seedlings.
# Run the same test, but ask only whether compost does BETTER.
# Then print the p-value and the confidence interval.
# Press Check when you have them.
```
::check {"regex": "alternative\\s*=\\s*.greater", "gate": true, "difficulty": "intermediate", "ok": "p falls from 0.04056 to 0.03170 and the lower bound climbs to 1.23, so this interval clears 1 where the two-sided one did not. That is the one-sided test refusing to spend any of its 5% on the possibility that compost hurts.", "no": "Pass the alternative straight to the test: fisher.test(seed_tab, alternative = greater), with greater in quotes."}
::solution
```r
# Ask only whether compost does better, and read the one-sided bound
seed_one <- fisher.test(seed_tab, alternative = "greater")
seed_one$p.value
#> [1] 0.03170163

seed_one$conf.int
#> [1] 1.229257      Inf
#> attr(,"conf.level")
#> [1] 0.95
```

The lower bound moved from 0.90 up to 1.23. That is only a fair thing to report if the gardener settled on a one-directional question before the seeds went into the tray.

=== step === concept
## References

- [On the Interpretation of Chi-Square from Contingency Tables, and the Calculation of P](https://doi.org/10.2307/2340521) - Fisher (1922), Journal of the Royal Statistical Society 85(1), 87-94. Where the argument about small contingency tables starts.
- [A Survey of Exact Inference for Contingency Tables](https://doi.org/10.1214/ss/1177011454) - Agresti (1992), Statistical Science 7(1), 131-153. The standard overview of the conditional approach and what it costs you.
- [Confidence intervals that match Fisher's exact or Blaker's exact tests](https://doi.org/10.1093/biostatistics/kxp050) - Fay (2010), Biostatistics 11(2), 373-374. Why an exact p-value and an exact interval can disagree at the boundary.
- [Chi-squared and Fisher-Irwin tests of two-by-two tables with small sample recommendations](https://doi.org/10.1002/sim.2832) - Campbell (2007), Statistics in Medicine 26(19), 3661-3675. The case against reaching for Fisher automatically.
- [Fisher's Exact Test for Count Data](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/fisher.test.html) - R Core Team, the documentation for `fisher.test()`, covering the conditional maximum likelihood odds ratio, the alternative argument and the Monte Carlo fallback.

=== step === complete
## Quick recap

You took a 17-patient table that chi-square could not handle, built its exact p-value by hand out of eight numbers, and then read everything R prints beside that p-value. Pulling it together:

- The trigger is an expected count under 5, where an expected count is row total times column total over the grand total. It is not a small p-value, not a small sample on its own, and not a table that merely looks odd.
- Fixing all four totals leaves only eight possible tables, and `dhyper()` gives each one an exact probability.
- The p-value is the sum of the probabilities no larger than yours, counted on both sides. Ours came to 0.04977, by hand and from `fisher.test()` alike.
- The odds ratio R prints is the conditional maximum likelihood estimate, 11.6 here, not the hand-computed 14. Report R's number.
- The interval is where honesty about sample size lives. Running from 0.86 to 729, it can cover 1 even while the p-value clears 0.05.
- Once every expected count is comfortably past 5, go back to chi-square. It agrees, and it is faster.

And the sentence to write down:

"In a pilot of 17 patients, 7 of 8 treated patients improved against 3 of 9 untreated (Fisher's exact test, p = 0.0498; odds ratio 11.6, 95% CI 0.86 to 729)."

A small sample is no longer a reason to guess. Nice work getting through this one, and enjoy the rest of your day.
