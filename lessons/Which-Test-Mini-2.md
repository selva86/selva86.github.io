---
title: "Welch's ANOVA: the test for unequal group variances"
slug: "Which-Test-Mini-2"
catalog_blurb: "What to run when one group's numbers are far more spread out."
description: "Two teams are paid in a narrow band, the third is all over the place. See where classic ANOVA breaks, run Welch's ANOVA instead, and report it properly."
keywords: "Welchs ANOVA, unequal variances, oneway.test, one-way ANOVA in R, heteroscedasticity, Games-Howell, ANOVA assumptions, R statistics"
date: "2026-08-18"
post_type: "LESSON"
curriculum_id: "0.0.13"
lesson_access: "windowed"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "2"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-1"
course_next: ""
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 2 of 11
## Welch's ANOVA: the test for unequal group variances

Today let's find out what happens to the most common three-group comparison in statistics when one group is far noisier than the others, and what to run instead.

Meera runs people operations at a software company with 43 employees, and she has this year's salary for every one of them. Support has 18 people and they all earn similar amounts. Marketing has 16, and the same is true there. Engineering has 9, and that is where it gets interesting, because Engineering mixes juniors with a few very highly paid specialists, so its numbers are all over the place.

Her question is the plain one: are these teams paid differently?

Before any test touches them, look at the three departments.

::widget chart-plotter {"data":[{"x":"Support","y":46800},{"x":"Support","y":48200},{"x":"Support","y":49600},{"x":"Support","y":50100},{"x":"Support","y":50400},{"x":"Support","y":51300},{"x":"Support","y":51500},{"x":"Support","y":51800},{"x":"Support","y":52000},{"x":"Support","y":52400},{"x":"Support","y":52700},{"x":"Support","y":53400},{"x":"Support","y":53900},{"x":"Support","y":54200},{"x":"Support","y":54800},{"x":"Support","y":55600},{"x":"Support","y":56900},{"x":"Support","y":58400},{"x":"Marketing","y":48200},{"x":"Marketing","y":49800},{"x":"Marketing","y":50600},{"x":"Marketing","y":51200},{"x":"Marketing","y":51900},{"x":"Marketing","y":52400},{"x":"Marketing","y":53100},{"x":"Marketing","y":53600},{"x":"Marketing","y":54000},{"x":"Marketing","y":54500},{"x":"Marketing","y":55100},{"x":"Marketing","y":56300},{"x":"Marketing","y":57000},{"x":"Marketing","y":58200},{"x":"Marketing","y":59800},{"x":"Marketing","y":61300},{"x":"Engineering","y":43000},{"x":"Engineering","y":46500},{"x":"Engineering","y":50000},{"x":"Engineering","y":55000},{"x":"Engineering","y":58000},{"x":"Engineering","y":64000},{"x":"Engineering","y":74000},{"x":"Engineering","y":88000},{"x":"Engineering","y":105000}],"geoms":["boxplot"],"x":"dept","y":"salary","code":{"boxplot":"ggplot(pay_chart, aes(dept, salary)) +\n  geom_boxplot()"}}

Each box covers the middle half of a department's salaries, the thick line inside it is the middle salary, and the thin lines reach out over the rest. Support and Marketing are two short flat boxes sitting almost on top of each other. Engineering is the tall one, running from \$43,000 at the bottom to \$105,000 at the top.

That difference in height is the problem. The classic one-way ANOVA, the test almost everybody reaches for with three groups, assumes every group is spread about the same amount. When that is false it starts giving wrong answers, and it gives you no warning at all that anything went wrong. Welch's ANOVA never needed the assumption, and a good number of statisticians argue it should simply be the one you run by default.

We will build the case for that from scratch, on Meera's payroll, and by the end you will be able to:

- Notice unequal spread across your own groups, and say why the averages alone hide it
- Say what the classic one-way ANOVA assumes, and how wrong it goes in both directions when that assumption fails
- Run Welch's ANOVA, read its F, its ragged degrees of freedom and its p, and reproduce that df by hand
- Choose between the two tests without a pre-test ritual, and defend Welch as a default with a measured price
- Run the correct pairwise follow-up and write the result up with an interval
- Say where Welch stops helping, and what to do when the honest answer is "cannot tell yet"

**What you need first:** you can read a simple R script, so a variable, `c()`, a function call and `$` are familiar. No statistics is assumed. Standard deviation, standard error, degrees of freedom, false-alarm rate and every other term get defined in plain words the first time they turn up.

=== step === concept
::eyebrow Setup
## The payroll, as an R data frame

Here is Meera's payroll typed into R. Run this block first, because every block after it uses what this one creates.

```r
support <- c(46800, 48200, 49600, 50100, 50400, 51300, 51500, 51800, 52000,
             52400, 52700, 53400, 53900, 54200, 54800, 55600, 56900, 58400)
marketing <- c(48200, 49800, 50600, 51200, 51900, 52400, 53100, 53600,
               54000, 54500, 55100, 56300, 57000, 58200, 59800, 61300)
engineering <- c(43000, 46500, 50000, 55000, 58000, 64000, 74000, 88000, 105000)

pay <- data.frame(
  dept = factor(rep(c("Support", "Marketing", "Engineering"), c(18, 16, 9)),
                levels = c("Support", "Marketing", "Engineering")),
  salary = c(support, marketing, engineering)
)

str(pay)
#> 'data.frame':	43 obs. of  2 variables:
#>  $ dept  : Factor w/ 3 levels "Support","Marketing",..: 1 1 1 1 1 1 1 1 1 1 ...
#>  $ salary: num  46800 48200 49600 50100 50400 51300 51500 51800 52000 52400 ...
```

Three `c(...)` lines hold one department's salaries each, one number per person. `rep(c("Support", "Marketing", "Engineering"), c(18, 16, 9))` writes each department name out the right number of times so the labels line up with the salaries underneath them, and wrapping that in `factor(..., levels = ...)` pins the printing order, which stops R listing the departments alphabetically later and confusing you about which row is which. `data.frame()` glues the two columns into a table of 43 rows.

`str()` prints the shape of that table: 43 observations, one column of labels and one column of numbers. One row per person, which is the layout every group test in R wants.

=== step === concept
::eyebrow The thing everyone skips
## Two departments in a narrow band, one all over the place

Meera's instinct is to go straight for the three averages. Hold that thought for a minute, because a group has a second number that matters just as much, and it is the one nobody looks at.

The **standard deviation** of a department is the ordinary distance between one person's salary and their department's average. A small standard deviation means everybody there earns close to the same thing. A large one means they do not. The **variance** is that same number squared, and it shows up in the formulas later because squares add together neatly while plain distances do not.

Ask R for both, next to the averages:

```r
group_n    <- tapply(pay$salary, pay$dept, length)
group_mean <- tapply(pay$salary, pay$dept, mean)
group_sd   <- tapply(pay$salary, pay$dept, sd)

summary_table <- data.frame(n = group_n,
                            mean = round(group_mean),
                            sd = round(group_sd))
summary_table
#>              n  mean    sd
#> Support     18 52444  2945
#> Marketing   16 54188  3637
#> Engineering  9 64833 20649
```

`tapply()` splits `pay$salary` into piles by department and runs the function you named on each pile, so three calls give you the headcount, the average and the standard deviation per department.

Now read the last column instead of the middle one. A typical Support salary sits about \$2,945 from Support's average. A typical Engineering salary sits about \$20,649 from Engineering's. Put those two next to each other:

```r
round(max(group_sd) / min(group_sd), 1)
#> [1] 7

round(max(group_sd)^2 / min(group_sd)^2, 1)
#> [1] 49.2
```

Engineering's salaries scatter seven times as widely as Support's, and in the squared currency the tests actually work in, 49 times as widely. That is not a rounding wobble between two similar groups. It is a real fact about how this company pays, and a test that refuses to look at it is going to get the answer wrong.

=== step === concept
::eyebrow The obvious move
## The classic test, and the finding it hands you

Three groups of numbers, different people in each: part 1's five questions land on a one-way analysis of variance. So Meera runs the classic version, the one taught in every course and printed by `aov()`.

```r
oneway.test(salary ~ dept, data = pay, var.equal = TRUE)
#> 
#> 	One-way analysis of means
#> 
#> data:  salary and dept
#> F = 5.2072, num df = 2, denom df = 40, p-value = 0.009775
```

`salary ~ dept` is the formula, read as "salary, broken down by department", and `data = pay` says which table those two column names live in. `var.equal = TRUE` is the classic assumption written down out loud: treat every department as equally spread. If `summary(aov(salary ~ dept, data = pay))` is the call you were taught, that is this same test with a busier printout.

Take the output apart, because every piece of it comes back later.

**F = 5.2072** compares how far apart the three department averages are against how much salaries bounce around inside a department. An F near 1 says the gaps between departments are no bigger than the everyday wobble within them. An F of 5.2 says the gaps are several times larger than that wobble.

**num df = 2** is the numerator degrees of freedom, three departments minus one, so it is really a note about how many groups got compared. **denom df = 40** is the denominator degrees of freedom, 43 people minus 3 departments, and it says how much information R had for measuring the wobble. Hold on to that 40, we come back for it.

**p-value = 0.009775** is the verdict. If the three departments genuinely paid the same and only ordinary randomness separated them, a spread of averages at least this wide would turn up in about one company in a hundred. By convention a result gets called a finding when that share falls under 5 percent, and one in a hundred is well under the line. So Meera has a finding, and it is the sort that gets forwarded to a CEO by lunchtime.

One thing that test did is worth naming before we move on, because it is doing more work than it looks. To decide whether those gaps were big, it built a single measure of the everyday wobble, then used that one measure to judge all three departments. Every department, one shared yardstick. What that costs is the question a few steps from now.

=== step === tryit
::eyebrow Your turn
## Change one argument

There is one argument in that call nobody ever questions. `var.equal = TRUE` is where the assumption lives, and R will take `FALSE` from you just as happily.

So change it. Leave everything else exactly as it is, run the call, then press Check.

```r
oneway.test(salary ~ dept, data = pay, var.equal = TRUE)
```
::check {"regex":"var[.]equal\\s*=\\s*FALSE","gate":true,"difficulty":"beginner","ok":"That is Welch's ANOVA, and look at what one word did. The p-value goes from 0.009775 to 0.1113. Same 43 salaries, same question, and the finding Meera was about to send has gone.","no":"Only one thing needs to change. `var.equal` is set to TRUE, which is the classic assumption that every department is spread the same amount. Set it to FALSE instead."}
::solution
```r
oneway.test(salary ~ dept, data = pay, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and dept
#> F = 2.5087, num df = 2.000, denom df = 16.839, p-value = 0.1113
```

=== step === concept
::eyebrow Awkward
## Two answers from one payroll

Nothing about the company changed between those two calls. It is the same 43 people, the same salaries and the same question. One word moved, and here is what came back.

| | classic, `var.equal = TRUE` | Welch, `var.equal = FALSE` |
|---|---|---|
| F | 5.2072 | 2.5087 |
| denominator df | 40 | 16.839 |
| p-value | 0.009775 | 0.1113 |
| what Meera would write | the departments are paid differently | nothing solid to report |

They cannot both be right. So which one does Meera send? One of these two tests is telling her something true about her company and the other is not, and there is no rule of thumb that settles which. So we go and look at where the difference between them comes from, because that is what decides it.

The strangest thing on that table is the denominator df of 16.839. The classic test said 40, a whole number you could count on your fingers, and Welch has come back with a fraction. Part 1 mentioned in passing that a ragged df is the giveaway that Welch is running. That is all it is for now. We get to where 16.839 comes from soon enough, and you will work it out by hand.

=== step === concept
::eyebrow Where the difference comes from
## One yardstick handed to every department

Start with what the classic test did, because the fix only makes sense once the problem is concrete.

To judge whether three averages are far apart, a test needs to know how much an average wobbles. That wobble has a name: the **standard error** of a group's average is how much that average would move if the company had hired a different set of people into the same jobs. It comes from two things, the department's own spread and how many people are in it. Wide spread makes it big, more people make it small.

Every department can work out its own standard error from its own numbers. The classic test does not let it. Instead it builds one **pooled** estimate of spread out of all three departments at once and hands that same number to everybody:

```r
group_var  <- tapply(pay$salary, pay$dept, var)
pooled_var <- sum((group_n - 1) * group_var) / (sum(group_n) - 3)

round(sqrt(pooled_var))
#> [1] 9691
```

That is the shared yardstick: one standard deviation of \$9,691, treated as the truth about how salaries scatter inside a department. It sits between Support's \$2,945 and Engineering's \$20,649, pulled toward the two big tight departments because they contribute most of the people.

Now put each department's own standard error beside the one the classic test gave it:

```r
own_se    <- sqrt(group_var / group_n)
pooled_se <- sqrt(pooled_var / group_n)

data.frame(own_se = round(own_se), pooled_se = round(pooled_se))
#>             own_se pooled_se
#> Support        694      2284
#> Marketing      909      2423
#> Engineering   6883      3230
```

Read the Engineering row. Nine salaries running from \$43,000 to \$105,000 pin down an average to within about \$6,883, and that is the honest figure. The classic test threw it away and used \$3,230 instead, so Engineering's average walked into the comparison looking more than twice as well measured as it really was.

And the traffic goes both ways. Support's own standard error is \$694, because eighteen people who all earn about the same thing pin an average down tightly. The classic test replaced that with \$2,284 and made Support look three times vaguer than it is.

[KEY INSIGHT]
Think of pooling as borrowing. The tight departments lend their steadiness to the noisy one, and the noisy one lends its scatter back to them. When every group really is spread the same amount, nothing is borrowed and pooling is just a way of using all the data at once, which is why the classic test is fine in that case. When the spreads are far apart, as they are here, the loan is large and somebody ends up flattered.

=== step === quiz
::eyebrow Check yourself
## Who does pooling flatter?

On Meera's payroll, which department does that single shared yardstick make look more precisely measured than it really is?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Support, because its own standard error is the smallest of the three
- Engineering, because pooling replaces its own standard error of 6,883 with 3,230 ::ok Exactly. Its average is genuinely rough, built from nine salaries that disagree wildly, and pooling hands it a precision it did not earn. That is the average the classic test then decided was far from the others.
- All three equally, because pooling is symmetric
- None of them, because pooling changes only the p-value ::no Look down the two columns again. Pooling borrows spread from the tight departments to describe the noisy one, and lends the noisy one's spread back to them. So Engineering gains precision it has not earned while Support and Marketing lose precision they had, which is the opposite of symmetric. And a standard error is not a cosmetic detail: it is the yardstick the gaps between averages are measured against, so changing it changes the verdict.

=== step === concept
::eyebrow Measure it
## So how often does it go wrong? Count it.

We now have a suspicion, and a suspicion is not evidence. Let's get evidence.

Every test comes with a promise attached, and the promise is about the long run. A test used at the usual 5 percent cutoff is promising that if you run it on group after group where nothing whatsoever is going on, it will still shout "significant" no more than 5 times in 100. That share has a name, the **false-alarm rate**, and the useful thing about it is that you can go and check it.

Here is the move. We are going to invent a thousand companies where we already know, because we built them that way, that every department pays exactly the same average. Then we run both tests on all thousand and count how often each one claims a difference. Every single claim is a mistake, because we know there is nothing there, so counting the claims measures the false-alarm rate directly.

The companies get Meera's own department sizes and Meera's own spreads. `rnorm()` is what invents the salaries: it draws numbers that cluster around an average you choose, scattering by an amount you choose, the way real salaries do.

```r
null_pvalues <- function(sizes, sds, means = c(55000, 55000, 55000),
                         n_studies = 1000, seed = 7) {
  set.seed(seed)
  labels  <- factor(rep(c("A", "B", "C"), sizes))
  classic <- numeric(n_studies)
  welch   <- numeric(n_studies)

  for (i in 1:n_studies) {
    salaries <- c(rnorm(sizes[1], means[1], sds[1]),
                  rnorm(sizes[2], means[2], sds[2]),
                  rnorm(sizes[3], means[3], sds[3]))
    classic[i] <- oneway.test(salaries ~ labels, var.equal = TRUE)$p.value
    welch[i]   <- oneway.test(salaries ~ labels, var.equal = FALSE)$p.value
  }

  data.frame(classic = classic, welch = welch)
}

p <- null_pvalues(sizes = c(18, 16, 9), sds = c(2945, 3637, 20649))
```

The `for` loop is the thousand companies. Each time round it invents one company's salaries, runs both tests on them, and files the two p-values in slot `i`.

Every department in every one of those thousand companies was given the same average of \$55,000, so the true answer is always "no difference". `set.seed(7)` fixes the randomness, so your thousand companies are the same as everybody else's. Now count:

```r
mean(p$classic < 0.05)
#> [1] 0.206

mean(p$welch < 0.05)
#> [1] 0.051
```

`p$classic < 0.05` turns the thousand p-values into a thousand TRUEs and FALSEs, and `mean()` of that is the share that came out significant.

Welch keeps its promise: 0.051, which is 5 percent, exactly what it said on the tin. The classic test comes in at 0.206. On data shaped like Meera's it raises a false alarm one time in five, while telling you it does so one time in twenty.

=== step === concept
::eyebrow The picture
## What a broken test looks like from the outside

The two rates say the classic test is wrong more often than it admits. Draw the thousand p-values and you can see something sharper than that: what is wrong with it.

Under a true null, when nothing is going on at all, p-values are spread evenly between 0 and 1. Every stretch of that range is as likely as every other, so a p under 0.05 turns up 5 percent of the time. That evenness is not a bonus feature of a well-behaved test. It is the thing that makes a 5 percent cutoff actually mean 5 percent.

```r
par(mfrow = c(1, 2))
hist(p$classic, breaks = seq(0, 1, 0.05), col = "grey85",
     main = "classic F test", xlab = "p-value")
hist(p$welch, breaks = seq(0, 1, 0.05), col = "grey85",
     main = "Welch", xlab = "p-value")
par(mfrow = c(1, 1))
```

Welch's panel is flat, bar after bar at roughly the same height. The classic panel is a U: a tower at the left end, a smaller pile at the right end, and a sag through the middle. Count them by tenth to put numbers on it:

```r
tenths <- data.frame(
  bucket  = levels(cut(p$classic, seq(0, 1, 0.1))),
  classic = as.vector(table(cut(p$classic, seq(0, 1, 0.1)))),
  welch   = as.vector(table(cut(p$welch,   seq(0, 1, 0.1)))))
tenths
#>       bucket classic welch
#> 1    (0,0.1]     276   103
#> 2  (0.1,0.2]     105   100
#> 3  (0.2,0.3]      74    88
#> 4  (0.3,0.4]      59    87
#> 5  (0.4,0.5]      59   115
#> 6  (0.5,0.6]      53    97
#> 7  (0.6,0.7]      52   102
#> 8  (0.7,0.8]      94    97
#> 9  (0.8,0.9]     102   105
#> 10   (0.9,1]     126   106
```

`cut()` drops each p-value into its tenth and `table()` counts them. Welch sits near 100 in every row, which is what a thousand evenly spread values looks like. The classic column runs 276 at the bottom, sinks to 52 in the middle, and climbs back to 126 at the top.

Both ends matter, so do not read this as "the classic test is too trigger-happy". A test that is too eager would pile up at the left only. Piling up at both ends means the p-values are being read off the wrong reference distribution altogether, which is a different and worse complaint: the number is miscalibrated rather than shifted. A miscalibrated test can be too quiet just as easily as it can be too loud, and in a moment you will make it go quiet.

=== step === quiz
::eyebrow Check yourself
## One in five

The classic test came back significant for 21 percent of those thousand companies. What does that number mean?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- One company in five really did pay its departments differently
- The classic test overstates the size of the gap by 21 percent
- In one company in five, a test run on departments that genuinely pay the same came back significant ::ok That is it, and it is worth sitting with. Meera's payroll has exactly those department sizes and exactly those spreads. Her classic p-value of 0.0098 came out of a test that, on data shaped like hers, invents a finding one time in five.
- The classic test is wrong 21 percent of the time even when a real difference exists ::no Go back to how those companies were built: every department in every one of them was given the same average of \$55,000. There were no real differences anywhere in the simulation, so no company can have paid differently, no gap existed to be overstated, and nothing was there to be missed. All 206 flags were false alarms and nothing else.

=== step === concept
::eyebrow The twist
## Which way it is wrong depends on where the wide group sits

Here is the natural next thought: fine, the classic test is jumpy on data like this, so I will keep using it and just be sceptical of its small p-values. Take a look at what that costs you.

Meera's wide department, Engineering, is also her smallest. Keep the same three spreads and move them onto different sized departments, so that the wide one is now the biggest instead:

```r
p_flipped <- null_pvalues(sizes = c(9, 16, 18), sds = c(2945, 3637, 20649))

round(c(classic = mean(p_flipped$classic < 0.05),
        welch   = mean(p_flipped$welch   < 0.05)), 3)
#> classic   welch 
#>   0.037   0.048 
```

Same spreads, same thousand companies with nothing going on in any of them, and the classic test has gone from 0.206 to 0.037. It is no longer jumpy. It has gone quiet.

| where the wide group sits | classic | Welch |
|---|---|---|
| wide group is the smallest (Meera's payroll) | 0.206 | 0.051 |
| wide group is the biggest | 0.037 | 0.048 |

Sitting under 5 percent might look like the safe kind of wrong, and it is not. A test that fires less often than it promised when nothing is going on is a test that has been made harder to trigger, which means it also fails to fire when something real is going on. It buys that quiet with missed differences.

So which way does the classic test lean? Neither way, reliably. It leans whichever way the group sizes send it, and you cannot correct for a bias whose direction changes with the shape of your data. That is why the fix has to be in the test rather than in your head.

=== step === quiz
::eyebrow Check yourself
## The noisy group is the big one

A hospital compares recovery times across three wards. The ward whose times swing wildly has 60 patients in it; the two steady wards have 12 patients each. What does a classic one-way ANOVA do here?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It becomes too cautious, so it can miss a real difference between the wards ::ok Right. The wide spread now sits in the big group, which is the second row of the table you just saw, and the classic test slips under its stated rate. Nobody notices this failure, because a study that finds nothing rarely gets a second look.
- It raises false alarms, the way it did for Meera
- It is unaffected, because the total sample of 84 patients is large
- It cannot run at all, because the group sizes are unequal ::no The direction rule is the thing to take away here: a wide spread in a small group makes the classic test loud, and a wide spread in a big group makes it quiet. It is Meera's situation turned around, so it fails in the opposite direction. A large total does not rescue it, since what matters is which group carries the spread, and unequal group sizes are perfectly fine for the arithmetic. That is the trouble: it runs, and it prints, and it looks normal.

=== step === concept
::eyebrow The fix
## What Welch does instead, in three moves

Welch's ANOVA answers the same question Meera asked. It just refuses to make the assumption that broke the classic test. Here is the shape of it before any arithmetic.

::widget process-flow {"steps":[{"title":"Own yardstick per group","sub":"each department keeps its own spread, nothing is pooled"},{"title":"Weight by precision","sub":"a well measured average gets more say than a rough one"},{"title":"Shrink the df to match","sub":"count the information really there, not the headcount"}]}

Move one undoes the pooling from earlier: every department is judged by its own spread and lends nothing to anybody.

Move two is the interesting one. Once each department has its own standard error, they are no longer equally trustworthy, so it would be strange to give them equal say. Welch weights them, and a department whose average is well pinned down counts for more.

Move three keeps the bookkeeping honest. Having decided that one department is barely contributing, the test has to admit it is working with less information than the headcount suggests, and that admission is where 16.839 comes from.

Moves two and three are just arithmetic, and they are worth doing by hand on Meera's own numbers.

=== step === concept
::eyebrow Move two
## The weights, on Meera's payroll

A department's weight in Welch's test is

\( w_i = \dfrac{n_i}{s_i^2} \)

where \( n_i \) is how many people are in department \( i \), \( s_i \) is that department's own standard deviation, and \( s_i^2 \) is its variance. Read it as a fraction and it says exactly what you would want: more people push the weight up, more scatter pushes it down. That is precision, and precision is what earns a vote.

Work them out and turn them into percentages so they are easy to compare:

```r
weight <- group_n / group_var
share  <- round(100 * weight / sum(weight), 1)

data.frame(n = group_n, sd = round(group_sd), weight_share_pct = share)
#>              n    sd weight_share_pct
#> Support     18  2945             62.8
#> Marketing   16  3637             36.6
#> Engineering  9 20649              0.6
```

Support carries 62.8 percent of the weight, Marketing 36.6, and Engineering six tenths of one percent. Nine people who disagree by tens of thousands, so their department's average is worth almost nothing to the comparison.

Now be careful about what that does and does not say. It is not a judgement about the nine engineers, and their salaries are not being ignored: they set Engineering's own standard error, they will set its confidence interval later, and they are the reason its weight came out where it did. What the 0.6 percent says is that the *average* of those nine numbers is a rough estimate, so the test declines to build a conclusion on it.

That is also why Welch was unimpressed by Engineering's \$64,833. The classic test heard a loud claim from Engineering and believed it. Welch heard the same claim, checked how well it was measured, and turned the volume down.

=== step === concept
::eyebrow Move three
## Degrees of freedom that are not a whole number

**Degrees of freedom** is R's bookkeeping for how much independent information a comparison has to work with. The classic test claimed 40 of them, which is just 43 people minus 3 departments. That subtraction is a headcount and nothing more, and it assumes every person contributes equally to what you know.

Once the weights are uneven, that stops being true, and Welch adjusts. The formula is Welch's, built on Satterthwaite's way of approximating degrees of freedom, and it comes in two pieces. First a quantity that measures how lopsided the weights are:

\[ \Lambda = \sum_{i=1}^{k} \dfrac{\left(1 - w_i / \sum_j w_j \right)^2}{n_i - 1} \]

Here \( k \) is the number of departments, \( w_i \) is department \( i \)'s weight from the last step, \( \sum_j w_j \) is all the weights added together, so \( w_i / \sum_j w_j \) is the share you just read off the table. Subtract that share from 1, square it, and divide by one less than the department's headcount. Add those up over the departments and you have \( \Lambda \). When every department has an equal share and a decent headcount, \( \Lambda \) is small. When one department has a tiny share and few people, it is large.

Then the degrees of freedom fall out of it:

\[ \mathrm{df}_{\mathrm{denom}} = \dfrac{k^2 - 1}{3 \Lambda} \]

Large \( \Lambda \) on the bottom, small df. Do it on Meera's payroll:

```r
k        <- 3
w_sum    <- sum(weight)
lambda   <- sum((1 - weight / w_sum)^2 / (group_n - 1))
df_denom <- (k^2 - 1) / (3 * lambda)

round(df_denom, 3)
#> [1] 16.839
```

16.839, which is the exact number `oneway.test()` printed back in the try-it, worked out from nothing but the three headcounts and the three standard deviations. It is not a rounding artefact and R did not fail to converge on a whole number. It is a measurement, and a fraction is simply what that measurement came to.

Read what it says. The classic test believed it had 40 degrees of freedom of information for judging these three averages. Welch, having noticed that one department contributes 0.6 percent of the weight, says the comparison really carries about as much as a tidy balanced study with 17. Meera's 43 salaries were never worth 43 salaries for this question, because nine of them barely agree with each other.

=== step === quiz
::eyebrow Check yourself
## Reading denom df = 16.839

Welch's ANOVA reported `denom df = 16.839` on a payroll of 43 people. What is that number telling you?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- R used 16.839 of the 43 salaries and discarded the rest
- The number is a rounding artefact and should be reported as 17
- The comparison carries only about as much independent information as a balanced study with roughly 17 degrees of freedom, because one department's average is poorly pinned down ::ok Yes. Degrees of freedom counts information, not people, and every one of the 43 salaries went into the test. It is just that nine of them disagree so much that their average tells you very little, and Welch's arithmetic says so out loud.
- The model failed to converge on a whole number ::no All three miss the same thing: degrees of freedom is a measure of information, not a headcount and not a diagnostic. Nothing was discarded and nothing failed. The fractional value is the fingerprint of Welch's correction, so report it as it came, 16.84, because rounding it to 17 hides the very thing that makes the result trustworthy.

=== step === concept
::eyebrow The question everyone arrives with
## But shouldn't I test for equal variances first?

Almost every textbook answers unequal spreads the same way. Run a test for equal variances, and if it comes back significant, switch to Welch. Two tests do that job and both are worth knowing.

**Bartlett's test** compares the three variances directly and asks how often randomness alone would produce variances this different. It assumes the data inside each group is roughly bell shaped, and it gets touchy when that is not true.

**Levene's test** does something sturdier. It replaces every salary with its distance from its own department's middle, then asks whether those distances differ across departments, which is the same question asked in a way that does not lean on a bell curve. It lives in the `car` package.

```r
bartlett.test(salary ~ dept, data = pay)
#> 
#> 	Bartlett test of homogeneity of variances
#> 
#> data:  salary by dept
#> Bartlett's K-squared = 55.704, df = 2, p-value = 8.017e-13
```

```r
suppressMessages(library(car))
leveneTest(salary ~ dept, data = pay)
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value    Pr(>F)    
#> group  2  12.057 7.983e-05 ***
#>       40                      
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

`suppressMessages()` keeps `car`'s loading chatter out of the output pane. Both agree emphatically, with p-values of 0.0000000000008 and 0.00008. Meera's spreads are not equal, so the textbook rule points her at Welch, which is where she already is.

So the rule worked here. The trouble is that here is the easy case, where a boxplot told you the same thing in one second. What happens in the hard case is the next step, and it is not what the textbook expects.

=== step === concept
::eyebrow Measure the workflow too
## What the test-first workflow actually costs

Treat the pre-test as a gate and you have built a two-stage procedure: look at the spreads, then choose a test based on what you saw. We measured the two tests. Let's measure the procedure.

Same thousand-company machine, with a third strategy added. This time the companies are small, 8 people in one department, 7 in another and 5 in the third, because small groups are where a beginner most often lands and where the classic test is most dangerous.

```r
two_stage_rates <- function(sizes, sds, n_studies = 1000, seed = 7) {
  set.seed(seed)
  labels  <- factor(rep(c("A", "B", "C"), sizes))
  classic <- numeric(n_studies)
  welch   <- numeric(n_studies)
  gated   <- numeric(n_studies)

  for (i in 1:n_studies) {
    salaries <- c(rnorm(sizes[1], 55000, sds[1]),
                  rnorm(sizes[2], 55000, sds[2]),
                  rnorm(sizes[3], 55000, sds[3]))
    classic[i] <- oneway.test(salaries ~ labels, var.equal = TRUE)$p.value
    welch[i]   <- oneway.test(salaries ~ labels, var.equal = FALSE)$p.value
    spread_p   <- bartlett.test(salaries ~ labels)$p.value
    gated[i]   <- if (spread_p < 0.05) welch[i] else classic[i]
  }

  round(c(always_classic = mean(classic < 0.05),
          always_welch   = mean(welch   < 0.05),
          test_first     = mean(gated   < 0.05)), 3)
}

two_stage_rates(sizes = c(8, 7, 5), sds = c(3000, 3600, 9000))
#> always_classic   always_welch     test_first 
#>          0.132          0.055          0.093 
```

The `gated` line is the textbook workflow written out: run Bartlett, and if it says the spreads differ, take Welch's p-value, otherwise take the classic one. Nothing else in the loop changed.

Always-Welch keeps the promise at 0.055. Always-classic blows it at 0.132. And the careful two-stage procedure lands at 0.093, which is not 5 percent either. It halved the damage and left you at nearly twice the false-alarm rate you signed up for, while feeling like the responsible option the whole way through.

The reason is that with 8, 7 and 5 people, Bartlett's test often cannot see the difference in spread at all. A three-to-one gap hides comfortably inside samples that small, so a good share of those companies get waved through to the classic test, which then does what it does.

Now run the same three strategies on Meera's own configuration:

```r
two_stage_rates(sizes = c(18, 16, 9), sds = c(2945, 3637, 20649))
#> always_classic   always_welch     test_first 
#>          0.206          0.051          0.051 
```

Here the gate is perfect. Test-first and always-Welch give exactly the same 0.051, because a seven-fold difference in spread is so obvious that Bartlett practically never misses it. That is the honest summary of the whole idea: the pre-test protects you when the problem was already obvious, and lets you down when it was not. That is precisely backwards from what a safety check should do.

=== step === concept
::eyebrow The other half of the argument
## And what Welch costs when the spreads really are equal

There is a fair objection left. If you always use Welch, you are correcting for a problem you often do not have, and corrections usually cost something. So measure that too.

Give all three departments the same spread, the pooled \$9,691, and start with a true null again:

```r
p_equal <- null_pvalues(sizes = c(18, 16, 9), sds = c(9691, 9691, 9691))

round(c(classic = mean(p_equal$classic < 0.05),
        welch   = mean(p_equal$welch   < 0.05)), 3)
#> classic   welch 
#>   0.057   0.045 
```

With the assumption satisfied, both tests behave. Now the case that actually matters, where there is a real difference to find. Keep the equal spreads and give the third department a genuinely higher average of \$67,389, which puts it \$12,389 above the other two, exactly the gap between Engineering and Support on Meera's real payroll:

```r
p_gap <- null_pvalues(sizes = c(18, 16, 9), sds = c(9691, 9691, 9691),
                      means = c(55000, 55000, 67389))

round(c(classic = mean(p_gap$classic < 0.05),
        welch   = mean(p_gap$welch   < 0.05)), 3)
#> classic   welch 
#>   0.840   0.803 
```

That is what the correction costs. The classic test finds the real gap in 840 companies out of a thousand and Welch finds it in 803, so you give up about four studies in a hundred. Those four studies are the price, and you only pay it in the situation where you did not need Welch at all.

Set the two numbers side by side and the decision stops being close. Use Welch always, and when the spreads happen to be equal you lose about four detections in a hundred. Use the classic test, and when your eyeball about equal spreads turns out to be wrong you are 21 percent wrong instead of 5. This is the argument Delacre and colleagues make in their 2019 paper, with far more simulation behind it than one payroll.

[TIP]
The practical rule is one line: reach for `oneway.test(y ~ g, var.equal = FALSE)` by default, the same way you already let `t.test()` be Welch by default for two groups. You are not choosing a special test for a special situation. You are choosing the one that does not need a condition you cannot check.

=== step === quiz
::eyebrow Check yourself
## Equal spreads: which test?

You have three groups and they look about equally spread. Which do you run?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The classic F-test, because with equal spreads it is more powerful and power should never be given away
- Welch, because the measured cost is a few detections in a hundred and it protects you when the eyeball turns out to be wrong ::ok That is the trade in one sentence: 0.803 against 0.840 when you were right, against 0.206 instead of 0.051 when you were wrong. You buy insurance against a large failure with a very small premium.
- Levene's test first, then decide
- Either one, since with equal spreads the two give identical answers ::no The measured numbers answer all three. Welch does give up a little power, 0.803 against 0.840, and that is a small premium rather than a reason to refuse the insurance. The pre-test route was the one that landed at 0.093 on small samples, catching the problem only when it was obvious anyway. And the two tests are not identical even on equal spreads: their false-alarm rates came in at 0.045 and 0.057, and every real dataset has spreads that differ somewhat.

=== step === concept
::eyebrow Back to Meera
## The follow-up has exactly the same problem

Meera's omnibus answer is p = 0.111, so there is nothing solid to report about departments. But suppose she had stayed with the classic test and its p of 0.0098. Her next move would have been the standard one: find out which departments differ. That step has the same flaw hiding in it, and it is the flaw that would have produced the sentence she sent to the CEO.

The default follow-up after a classic ANOVA is Tukey's HSD, and it pools, exactly the way the omnibus test did:

```r
TukeyHSD(aov(salary ~ dept, data = pay))
#>   Tukey multiple comparisons of means
#>     95% family-wise confidence level
#> 
#> Fit: aov(formula = salary ~ dept, data = pay)
#> 
#> $dept
#>                            diff        lwr       upr     p adj
#> Marketing-Support      1743.056 -6361.5308  9847.642 0.8603516
#> Engineering-Support   12388.889  2759.2054 22018.572 0.0089183
#> Engineering-Marketing 10645.833   817.5788 20474.088 0.0311905
```

Read the `p adj` column. Engineering against Support comes back at 0.0089 and Engineering against Marketing at 0.0312, both under the line, so this table says Engineering is paid more than both of the other departments. There it is, the ready-made sentence, and it is what most people would have sent.

Now the honest version. Part 1 already ran this call on Ravi's branches: `pool.sd = FALSE` keeps every pair on its own two spreads instead of one shared one, and `p.adjust.method = "holm"` corrects for having asked three questions instead of one.

```r
pairwise.t.test(pay$salary, pay$dept,
                p.adjust.method = "holm", pool.sd = FALSE)
#> 
#> 	Pairwise comparisons using t tests with non-pooled SD 
#> 
#> data:  pay$salary and pay$dept 
#> 
#>             Support Marketing
#> Marketing   0.33    -        
#> Engineering 0.33    0.33     
#> 
#> P value adjustment method: holm 
```

Every pair comes back at 0.33. Not one comparison survives once each pair is judged on its own spreads. The two findings in the Tukey table were manufactured by pooling, in the same way and for the same reason the omnibus p of 0.0098 was.

The named test for this job is **Games-Howell**, which is Tukey's procedure rebuilt on Welch's non-pooled standard errors, and it lives in add-on packages. What you just ran is the same idea using the t distribution rather than the studentized range, it comes with base R, and in practice the two land close together. Games-Howell is the formally matched follow-up if you want it, and the base R call is close enough that most people can stop here.

=== step === tryit
::eyebrow Your turn
## Run the honest follow-up

Your turn to produce that comparison rather than watch it. The Tukey table above claims two findings. Write the call that checks them without pooling, on `pay$salary` broken down by `pay$dept`, adjusting for having run three comparisons.

You need `pairwise.t.test()`, and two arguments: one that keeps every pair on its own spreads, and one that applies the holm correction.

```r
# the data is already in your session:
# pay$salary   the 43 salaries
# pay$dept     which department each person is in
```
::check {"regex":"pairwise[.]t[.]test[\\s\\S]*pool[.]sd\\s*=\\s*FALSE","gate":true,"difficulty":"intermediate","ok":"That is the one, and every pair comes back at 0.33. Compare that with Tukey's 0.0089 and 0.0312 on the same 43 salaries. Whether Meera has a finding to send depends entirely on which of those two calls she typed.","no":"You want pairwise.t.test(pay$salary, pay$dept, ...) with two arguments inside it: p.adjust.method set to holm, and pool.sd set to FALSE, which is the argument that stops it borrowing one shared spread for every pair."}
::solution
```r
pairwise.t.test(pay$salary, pay$dept,
                p.adjust.method = "holm", pool.sd = FALSE)
#> 
#> 	Pairwise comparisons using t tests with non-pooled SD 
#> 
#> data:  pay$salary and pay$dept 
#> 
#>             Support Marketing
#> Marketing   0.33    -        
#> Engineering 0.33    0.33     
#> 
#> P value adjustment method: holm 
```

=== step === concept
::eyebrow Say it properly
## Writing it up, interval included

Meera has to write a line. A p-value on its own is a poor line, because it says how surprised you should be and nothing about how big anything is, so pair it with the numbers a reader can act on.

Start with the test itself, pulled straight out of the fitted object so no digit is typed by hand:

```r
welch_fit <- oneway.test(salary ~ dept, data = pay, var.equal = FALSE)

sprintf("Welch F(%.0f, %.2f) = %.2f, p = %.3f",
        welch_fit$parameter[1], welch_fit$parameter[2],
        welch_fit$statistic, welch_fit$p.value)
#> [1] "Welch F(2, 16.84) = 2.51, p = 0.111"
```

Report the ragged 16.84 as it came. Rounding it to 17 loses the one visible sign that you used the test that did not need equal spreads, and a reader who knows this material reads that fraction as a signal you knew what you were doing.

Then the size of the thing that started the whole question, with its interval:

```r
t.test(engineering, support)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  engineering and support
#> t = 1.7909, df = 8.1632, p-value = 0.1103
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -3508.406 28286.184
#> sample estimates:
#> mean of x mean of y 
#>  64833.33  52444.44 
```

Engineering's average sits \$12,389 above Support's, and the **95 percent confidence interval** is the range of true gaps this data cannot rule out. It runs from -\$3,508 to \$28,286. Zero is inside it, so "no gap at all" is still on the table, which is why the p-value is 0.11. But look at the other end. A gap of \$28,000 a year is also still on the table, and that would be an enormous fact about this company.

So Meera's honest line is something like: *"Welch F(2, 16.84) = 2.51, p = 0.111. Engineering averages \$12,389 more than Support, 95 percent CI -\$3,508 to \$28,286."* Two sentences, and the second one is the one that stops a reader concluding the departments are paid the same.

=== step === concept
::eyebrow Before you conclude anything
## What would it take to answer this properly?

Meera's Welch p is 0.111 and the interval runs from below zero to \$28,286. There is a strong temptation now to write "no difference between departments" and close the file. Before she does, one more question is worth asking: if a real gap of this size did exist, would this study have found it?

That question has a name. **Detection rate**, usually called power, is how often a study of a given size would come back significant when the effect it is looking for is genuinely there. It is measured the same way we measured false alarms, by simulating studies. The only change is that this time the truth we build in is a real difference rather than none.

So build companies from Meera's observed averages and observed spreads, meaning Engineering genuinely does pay \$64,833 against Support's \$52,444, and vary only how many engineers there are:

```r
detect_rate <- function(n_eng, n_studies = 400, seed = 3) {
  set.seed(seed)
  labels <- factor(rep(c("Support", "Marketing", "Engineering"), c(18, 16, n_eng)))
  found  <- numeric(n_studies)

  for (i in 1:n_studies) {
    salaries <- c(rnorm(18,    52444,  2945),
                  rnorm(16,    54188,  3637),
                  rnorm(n_eng, 64833, 20649))
    found[i] <- oneway.test(salaries ~ labels, var.equal = FALSE)$p.value < 0.05
  }

  mean(found)
}

data.frame(engineers = c(9, 25, 60),
           detection_rate = c(detect_rate(9), detect_rate(25), detect_rate(60)))
#>   engineers detection_rate
#> 1         9         0.4475
#> 2        25         0.7925
#> 3        60         0.9925
```

With nine engineers, a gap that is genuinely there shows up 45 percent of the time. Meera's study was closer to a coin flip than to a measurement. At 25 engineers it becomes 79 percent, and at 60 it is a near certainty.

That changes what her non-significant result is allowed to mean. A study that would miss a real gap of this size more than half the time cannot be used as evidence that no gap exists. It is evidence that this study could not tell, which is a different sentence and an honest one.

[NOTE]
Notice where the difficulty comes from. It is not the company's headcount, it is Engineering's spread. Nine people whose salaries run from \$43,000 to \$105,000 give you a very fuzzy average, and no amount of extra Support staff sharpens it. If Meera wants an answer about Engineering, she needs more engineers or a better question.

=== step === quiz
::eyebrow Check yourself
## No difference, or could not tell?

Meera's Welch p-value is 0.111. Which sentence can she defend?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- With nine engineers spread this widely, this study would have caught a gap of this size less than half the time, so the difference is unresolved ::ok Exactly, and that is the sentence a careful reader will respect. It reports what happened and it reports what the study was capable of, so nobody walks away with a conclusion the data cannot support.
- The departments pay the same, since the test was not significant
- The difference is real but too small to matter
- The classic test's p of 0.0098 should be used, since it is the more sensitive of the two ::no The first two say more than the data allows in opposite directions: absence of evidence is not evidence of absence, and the interval reaching to 28,286 rules out "too small to matter" just as firmly as it fails to rule out zero. The last one is the trap we started with. That test is not more sensitive, it is miscalibrated on data shaped like this, and it flags nothing-companies one time in five.

=== step === concept
::eyebrow Honesty about the fix
## Where Welch stops helping

Welch fixes one thing: it lets every group keep its own spread. It does nothing else. It still assumes each group's numbers scatter in an ordinary, roughly symmetric way around its own average, and nine salaries with two of them way out at the top put a strain on that.

There is a plain way to find out how much a result leans on a couple of people: take them out and look again. Meera drops the two engineers above \$80,000 and refits both tests.

```r
trimmed <- pay[pay$salary < 80000, ]

table(trimmed$dept)
#> 
#>     Support   Marketing Engineering 
#>          18          16           7 
```

```r
oneway.test(salary ~ dept, data = trimmed, var.equal = TRUE)
#> 
#> 	One-way analysis of means
#> 
#> data:  salary and dept
#> F = 1.1511, num df = 2, denom df = 38, p-value = 0.3271
```

```r
oneway.test(salary ~ dept, data = trimmed, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and dept
#> F = 1.3148, num df = 2.000, denom df = 13.585, p-value = 0.3006
```

The classic test collapses from 0.0098 to 0.3271. Two people out of 43 were holding that entire finding up. Welch barely moves, 0.1113 to 0.3006, because it was never impressed in the first place.

[WARNING]
Removing points to see what moves is a diagnostic, and it is never a way to pick which result to report. If Meera had run the trimmed version, liked the answer better and published that one, she would have made a worse mistake than the one Welch had just fixed for her. The two specialists are real employees on real salaries. What the check tells her is where the classic finding was resting, and that is all she gets to take from it.

=== step === concept
::eyebrow The other family
## The rank route, and what it does not fix

If the shape is the problem rather than the spread, the usual answer is to stop working with the salaries and work with their order instead. **Kruskal-Wallis** puts all 43 people in one line, ranks them from lowest paid to highest, and asks whether one department's ranks sit systematically higher than another's. A single \$105,000 salary is then just the highest rank, worth exactly one more than the next one down, so it cannot drag anything around.

```r
kruskal.test(salary ~ dept, data = pay)
#> 
#> 	Kruskal-Wallis rank sum test
#> 
#> data:  salary by dept
#> Kruskal-Wallis chi-squared = 2.9841, df = 2, p-value = 0.2249
```

```r
tapply(pay$salary, pay$dept, median)
#>     Support   Marketing Engineering 
#>       52200       53800       58000 
```

p = 0.2249, so it agrees with Welch that there is nothing solid here. And since a rank test gives you no dollars, report the middle salary of each department beside it, which is what `median` does: \$52,200 against \$53,800 against \$58,000. Those three sit far closer together than the averages did, because the average was being pulled upward by two specialists and the middle person was not.

Agreeing with Welch here is reassuring, and it is not a rule. Kruskal-Wallis carries an assumption of its own: it reads cleanly as a comparison of middles only when the groups have roughly similar shapes, and groups whose spreads differ seven-fold do not have similar shapes. So it is not a general cure for unequal spread. It is built for a different problem, the one where a few extreme values dominate the average.

Now stop and count. Three tests have now looked at these 43 salaries by department. Welch said 0.111, the honest pairwise comparisons said 0.33 across the board, and Kruskal-Wallis says 0.2249. When test after test finds nothing, the useful move is not to go looking for a fourth test. It is to ask whether the question was put the right way.

=== step === concept
::eyebrow The payoff
## The real story: Engineering is two jobs in one label

Go back to the fact that started all this. Engineering's salaries scatter seven times as widely as Support's. So far we have treated that as a problem for the test to survive. It is also information, and it has been trying to tell Meera something.

Groups are rarely wildly spread for no reason. A group that wide is usually two groups wearing one label. Look at the nine engineering salaries in order, in dollars: 43,000, 46,500, 50,000, 55,000, 58,000, then 64,000, 74,000, 88,000, 105,000. The first five sit in a band from 43,000 to 58,000, which is roughly what Support and Marketing pay. From 64,000 upward, every step to the next salary is bigger than the step before it. Those two stretches do not look like one job.

Split the department at \$60,000 and ask again:

```r
role <- as.character(pay$dept)
role[pay$dept == "Engineering" & pay$salary <  60000] <- "Eng junior"
role[pay$dept == "Engineering" & pay$salary >= 60000] <- "Eng specialist"

pay_roles <- data.frame(
  role = factor(role, levels = c("Support", "Marketing",
                                 "Eng junior", "Eng specialist")),
  salary = pay$salary)

data.frame(n    = tapply(pay_roles$salary, pay_roles$role, length),
           mean = round(tapply(pay_roles$salary, pay_roles$role, mean)),
           sd   = round(tapply(pay_roles$salary, pay_roles$role, sd)))
#>                 n  mean    sd
#> Support        18 52444  2945
#> Marketing      16 54188  3637
#> Eng junior      5 50500  6103
#> Eng specialist  4 82750 17802
```

The \$20,649 spread has broken into \$6,103 and \$17,802, and the two averages it was hiding are \$50,500 and \$82,750. Junior engineers are paid roughly what Support and Marketing are paid. Specialists are in a different world. Run Welch on the four groups:

```r
oneway.test(salary ~ role, data = pay_roles, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and role
#> F = 4.1177, num df = 3.0000, denom df = 8.3493, p-value = 0.04641
```

p = 0.046. There was a real pay difference in this company the whole time, and it was never between departments. It was between two jobs that share a department name.

[WARNING]
One caveat, and it is not a small one. Meera chose that split after looking at the data, and a threshold picked because of where the gap happened to fall makes any p-value from the same data optimistic. So 0.046 is not a result to publish. It is a good hypothesis, and the right thing to do with it is write it down and test it against next year's payroll, or against the job titles in the HR system, which were never a guess in the first place.

=== step === quiz
::eyebrow Check yourself
## A spread that wide is usually a clue

Engineering's salaries scatter seven times as widely as Support's, and Welch has already handled that unequal spread properly. What is the best next move?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Switch to Kruskal-Wallis, since ranking the salaries removes the unequal-spread problem
- Drop the two highest salaries as outliers and report the tidier result
- Treat the wide group as a likely mixture, split it by role, re-ask, and carry that split forward as next year's hypothesis rather than today's finding ::ok Exactly. The width was never only a nuisance for the test, it was the most informative thing in the dataset, and following it turned a dead end into a real question about roles.
- Nothing further is needed, since Welch corrected for the unequal spread and 0.111 is the final answer ::no Each of those stops one step too early. Welch corrects for unequal spread and nothing else, so a clean Welch p is the start of the thinking rather than the end of it. Ranking does not remove the problem either, because Kruskal-Wallis has its own similar-shape assumption and it agreed with Welch here anyway. And refitting without the two highest salaries is a sensitivity check, a way to learn what a result was resting on, never a way to choose which result to report.

=== step === concept
::eyebrow Where it fits
## The map: where Welch sits

Part 1's question 4 asked whether the shape was ordinary. It really asks two things at once, and now that the second one has a proper answer, the whole routing question fits in one small tree.

::widget tree-diagram {"root":"spreads similar?","l":"shape ordinary?","r":"shape ordinary?","leaves":["classic ANOVA","rank route","Welch ANOVA","Welch + check"]}

Left half, where the spreads are similar. Ordinary shape gives you the classic one-way ANOVA, `oneway.test(y ~ g, var.equal = TRUE)`, and Welch would cost you about four detections in a hundred if you ran it here anyway. A lopsided shape sends you down the rank route, `kruskal.test(y ~ g)`.

Right half, where the spreads differ. Ordinary shape is Meera's case, and it is where Welch's ANOVA belongs: `oneway.test(y ~ g, var.equal = FALSE)`. Both problems at once is the bottom right leaf, where you run Welch and then check the answer, with a rank test, with the sensitivity check from a few steps back, or best of all by asking whether the wide group is really two groups.

Meera walked the right half. Her spreads differed seven-fold, her shapes were ordinary enough, so Welch gave her p = 0.111, and the check at the end found the roles hiding inside Engineering.

=== step === concept
::eyebrow Go deeper
## References

Five sources worth your time if you want the ground underneath all this.

- [Welch (1951), on the comparison of several mean values](https://doi.org/10.1093/biomet/38.3-4.330) - the original paper, including the degrees-of-freedom formula you reproduced by hand.
- [Delacre, Leys, Mora and Lakens (2019), arguments for Welch's F-test as the default](https://doi.org/10.5334/irsp.198) - the simulation evidence behind making Welch the one you always run, with far more configurations than the two we tried.
- [Zimmerman (2004), a note on preliminary tests of equality of variances](https://doi.org/10.1348/000711004849222) - why using a pre-test as a gate does not restore the error rate you thought you were buying.
- [Games and Howell (1976), pairwise comparisons with unequal n and variances](https://doi.org/10.3102/10769986001002113) - the study behind the Welch-style follow-up test, and when it beats Tukey.
- [R documentation for oneway.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html) - the official page for the one function this lesson turns on, and exactly what `var.equal` changes.

=== step === complete
## Part 2 complete

Meera started with a finding. She had a classic one-way ANOVA at p = 0.0098 and a Tukey table naming Engineering as the well-paid department, and it was ready to send.

Then you changed one argument and it vanished. From there you worked out why. The classic test hands one pooled yardstick to every department, which cut Engineering's standard error from \$6,883 to \$3,230 and inflated Support's from \$694 to \$2,284. On a thousand companies where nothing at all was going on, that flattery turned 5 percent false alarms into 21, and moving the wide group into the biggest department flipped it the other way, down to 3.7 percent, which sounds safer and is not, because a test that quiet misses real differences too. Welch weights each department by its own precision, which gave Engineering 0.6 percent of the vote, and shrinks the degrees of freedom to match, which is where 16.839 came from and where you reproduced it by hand from three headcounts and three standard deviations.

You also measured the two things everybody argues about. Testing for equal variances first left you at 0.093 on small samples, because the gate is blindest exactly where you need it. Always using Welch costs about four detections in a hundred when the spreads really are equal. Then the follow-up done without pooling, every pair at 0.33, and a write-up that reports an interval from -\$3,508 to \$28,286 rather than a bare verdict.

And the ending was better than the beginning. Nine engineers spread that widely could not settle the question either way, and the width itself was the clue: Engineering was two jobs sharing one label, juniors at \$50,500 and specialists at \$82,750. Meera's question was never about departments.

Part 3 goes after the other half of question 4. When it is the shape of the numbers rather than their spread that makes an average the wrong summary, you leave the averages behind and compare two groups by rank instead. That is the Mann-Whitney U test, and it is the one people run most often for the wrong reason.
