---
title: "Welch's ANOVA: the test for unequal group variances"
slug: "Which-Test-Mini-2"
catalog_blurb: "The test for when one group is far noisier than the others."
description: "Three teams, three average salaries, and one team whose numbers are all over the place. See where the classic ANOVA breaks, then run the test that holds up."
keywords: "Welch's ANOVA in R, oneway.test, unequal variances, heteroscedasticity, one-way ANOVA assumptions, Games-Howell, Bartlett test, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.13"
lesson_access: "windowed"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "2"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: "Which-Test-Mini-1"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 2 of 11
## Welch's ANOVA: the test for unequal group variances

Let's consider a 45-person company where Meera runs people operations, and this week they are going through pay one team at a time. Support, 18 people, averages \$50,700 a year. Marketing, also 18 people, averages \$52,600. Engineering is 9 people and averages \$61,700.

The question is the ordinary one anybody asks of three numbers like that: do the teams genuinely pay differently, or is that gap just who happens to sit where?

Part 1 handed Meera five questions, and they land this squarely on a one-way ANOVA across three independent groups. So Meera runs the classic ANOVA and gets p = 0.008, which reads as "yes, the teams really do differ". Then the same 45 salaries go into Welch's version of that test and come back with p = 0.085, which reads as "you cannot tell".

Same salaries, same question, and the two tests point opposite ways.

::widget chart-plotter {"data":[{"x":"Support","y":49.6},{"x":"Support","y":52.1},{"x":"Support","y":45.9},{"x":"Support","y":46.5},{"x":"Support","y":56.7},{"x":"Support","y":48.3},{"x":"Support","y":57.3},{"x":"Support","y":54.5},{"x":"Support","y":51.8},{"x":"Support","y":48.0},{"x":"Support","y":48.7},{"x":"Support","y":50.6},{"x":"Support","y":45.8},{"x":"Support","y":51.0},{"x":"Support","y":47.4},{"x":"Support","y":52.0},{"x":"Support","y":51.1},{"x":"Support","y":55.6},{"x":"Marketing","y":51.8},{"x":"Marketing","y":51.5},{"x":"Marketing","y":51.4},{"x":"Marketing","y":54.4},{"x":"Marketing","y":52.5},{"x":"Marketing","y":56.1},{"x":"Marketing","y":54.8},{"x":"Marketing","y":54.5},{"x":"Marketing","y":53.7},{"x":"Marketing","y":51.1},{"x":"Marketing","y":53.5},{"x":"Marketing","y":50.1},{"x":"Marketing","y":49.5},{"x":"Marketing","y":50.3},{"x":"Marketing","y":57.6},{"x":"Marketing","y":47.4},{"x":"Marketing","y":50.6},{"x":"Marketing","y":56.7},{"x":"Engineering","y":46.0},{"x":"Engineering","y":48.5},{"x":"Engineering","y":49.2},{"x":"Engineering","y":52.0},{"x":"Engineering","y":55.4},{"x":"Engineering","y":58.1},{"x":"Engineering","y":62.0},{"x":"Engineering","y":88.0},{"x":"Engineering","y":96.5}],"geoms":["boxplot"],"x":"team","y":"salary"}

The reason for the disagreement is sitting right there in the picture. Support and Marketing are two tidy little boxes, because almost everybody on those teams earns within a few thousand dollars of their teammates. Engineering is a tower: seven of its nine people earn ordinary salaries, and two are specialists on \$88,000 and \$96,500.

Classic ANOVA quietly assumes all three teams scatter about the same amount. When that is not true, it does not warn you.

It just goes ahead and answers.

By the end of this lesson you will be able to:

- Spot unequal spread in your own groups, from a picture and from two numbers
- Say what the classic ANOVA pools, and why one shared spread fits nobody here
- Run Welch's ANOVA in R and read every part of its output, fractional degrees of freedom included
- Measure, with a simulation you run yourself, how often each test cries wolf on data shaped like Meera's
- Report the result honestly, and name the cases where Welch is the wrong answer too

**What you need first:** you can read a simple R script, so a variable, `c()`, a function call and `$` are familiar. No statistics background is assumed. Every term gets defined in plain words the first time it turns up, including the ones Part 1 covered.

=== step === concept
::eyebrow Setup
## Meera's payroll, typed into R

Here is the payroll. Run this block first, because every later block on this page uses what it creates.

Salaries are in thousands of dollars a year, so 50.6 means \$50,600. That keeps the numbers short enough to read in the output, and it changes nothing about the tests.

```r
support <- c(49.6, 52.1, 45.9, 46.5, 56.7, 48.3, 57.3, 54.5, 51.8,
             48.0, 48.7, 50.6, 45.8, 51.0, 47.4, 52.0, 51.1, 55.6)

marketing <- c(51.8, 51.5, 51.4, 54.4, 52.5, 56.1, 54.8, 54.5, 53.7,
               51.1, 53.5, 50.1, 49.5, 50.3, 57.6, 47.4, 50.6, 56.7)

engineering <- c(46.0, 48.5, 49.2, 52.0, 55.4, 58.1, 62.0, 88.0, 96.5)

pay <- data.frame(
  team   = rep(c("Support", "Marketing", "Engineering"), c(18, 18, 9)),
  salary = c(support, marketing, engineering)
)

head(pay, 3)
#>      team salary
#> 1 Support   49.6
#> 2 Support   52.1
#> 3 Support   45.9

nrow(pay)
#> [1] 45
```

Three `c(...)` lines hold one team's salaries each, one number per person. `rep(c("Support", "Marketing", "Engineering"), c(18, 18, 9))` writes out the team names 18, 18 and 9 times, so the labels line up with the salaries underneath them. Then `data.frame()` glues labels and salaries into a table of 45 rows and 2 columns, which is the shape every group test in R wants: one row per person, one column of numbers, one column of labels.

Now the three averages Meera quoted, and the count behind each one:

```r
table(pay$team)
#> 
#> Engineering   Marketing     Support 
#>           9          18          18 

round(tapply(pay$salary, pay$team, mean), 2)
#> Engineering   Marketing     Support 
#>       61.74       52.64       50.72 
```

`table()` counts how many rows carry each label, and `tapply()` splits the salaries into piles by team and runs a function on each pile, so the second line reads as "average salary, one per team".

R prints the teams alphabetically rather than in the order you typed them, which is worth noticing now so you do not misread a column later. And notice the counts are not equal: 18, 18 and 9. Uneven group sizes are perfectly normal in real data, and they are about to matter far more than you would guess.

=== step === concept
::eyebrow The spread
## Two numbers that say these teams are not alike

An average tells you where a team sits. It says nothing about how tightly its people are packed around that spot, and that second thing is where the two tests part ways.

The plain measure of packing is the **standard deviation**, which is the ordinary distance between one person's salary and their team's average. If Support's standard deviation is 3.6, then a typical Support salary sits about \$3,600 away from \$50,700, some above, some below.

```r
round(tapply(pay$salary, pay$team, sd), 2)
#> Engineering   Marketing     Support 
#>       18.12        2.72        3.57 

round(tapply(pay$salary, pay$team, var), 1)
#> Engineering   Marketing     Support 
#>       328.3         7.4        12.8 
```

Read the first line slowly. A typical Marketing salary sits \$2,720 from its team average. A typical Engineering salary sits \$18,120 from its team average, which is more than six times further out, and that is before you notice that Engineering has half as many people to work it out from.

The second line is the **variance**, which is just the standard deviation squared: 18.12 squared is 328.3. It is the same information in a different currency, and statistics does most of its arithmetic in that currency because variances add up neatly when standard deviations do not. Whenever you see the word variance in this lesson, picture the spread you already understand, squared.

[TIP]
Squaring is why the gap looks so much wider in the second line than the first. A team five times more spread out has 25 times the variance. Keep that in mind, because the formulas coming later are all written in variances.

=== step === concept
::eyebrow The spread
## How lopsided is lopsided?

There is a rule of thumb worth knowing, and it takes one line of R. Divide the biggest team variance by the smallest.

```r
round(var(engineering) / var(marketing), 1)
#> [1] 44.5
```

The usual advice is that a ratio under about 4 is comfortable territory for the classic ANOVA, and beyond that you should worry. Meera's payroll comes in at 44.5.

That is not a borderline call. Engineering's variance is more than forty times Marketing's, which is the six-and-a-half-times-wider scatter from the last step, squared. The reason is not mysterious either: two specialists earning more than one and a half times the median engineering salary will do that to nine people.

While you are here, the textbook word for this is **heteroscedasticity**, which sounds forbidding and means nothing more than what you are looking at: groups that do not scatter alike. You will meet it in every paper and help page on the subject, so it is worth having the word attached to the picture.

The rule of thumb is a rule of thumb, though, not a law, and I want to be honest about that. Nobody proved 4. It is a rough marker that people found useful, and shortly you are going to measure the actual damage yourself rather than trust anybody's threshold, which is a much better habit.

=== step === concept
::eyebrow Inside the classic test
## What the classic ANOVA does with those three spreads

To see why unequal spreads matter, you need to know what the classic test actually computes. It is three steps, and none of them is complicated.

::widget process-flow {"steps":[{"title":"Measure the gaps","sub":"how far apart are the three team averages"},{"title":"Measure the noise, ONCE","sub":"mix all three teams into one shared wobble number"},{"title":"Divide","sub":"gaps over noise gives F; a big F is hard to explain by luck"}]}

Step 2 is the one to look at. The classic test does not keep three separate ideas of "how noisy is this team". It **pools** them, meaning it mixes all 45 people's distances from their own team average into a single estimate of noise, and then uses that one number for all three teams.

In symbols, the pooled variance is

\( s_p^2 = \dfrac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2 + (n_3 - 1)s_3^2}{n_1 + n_2 + n_3 - 3} \)

where \( n_i \) is how many people are in team \( i \), \( s_i^2 \) is that team's own variance, and \( s_p^2 \) is the single pooled variance the test will use for everybody. Each team's variance gets a weight of \( n_i - 1 \), which is how much information that team contributed.

Rather than take my word for what that produces, compute it:

```r
n_i   <- tapply(pay$salary, pay$team, length)
var_i <- tapply(pay$salary, pay$team, var)

pooled_var <- sum((n_i - 1) * var_i) / (nrow(pay) - 3)
round(pooled_var, 2)
#> [1] 70.69

round(sqrt(pooled_var), 2)
#> [1] 8.41
```

So the classic test walks into Meera's payroll and announces that every team has a typical wobble of \$8,410.

Look at what that claim does to each team. Support really wobbles by \$3,570, so the test treats Support as nearly two and a half times noisier than it is, and any real difference involving Support gets buried. Engineering really wobbles by \$18,120, so the test treats Engineering as less than half as noisy as it is, and it will believe Engineering's average far more firmly than it has any right to.

[KEY INSIGHT]
Pooling is not a rounding error or a small approximation here. One number, 8.41, is standing in for 3.57, 2.72 and 18.12. It is too big for two teams and much too small for the third, so it does not describe anybody in this company.

=== step === quiz
::eyebrow Check yourself
## What is the classic test actually assuming?

The classic one-way ANOVA pools all three teams' spread into one shared number before it compares the averages. What has to be true for that to be a fair thing to do?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- That the three teams have the same average salary
- That the salaries in each team follow a bell curve
- That the three teams scatter around their own averages by about the same amount ::ok Exactly. Pooling says "there is really only one noise level in this company, and each team gives me a noisy glimpse of it". If that is true, mixing the three estimates gives you a better one. If one team genuinely bounces around five times more than another, the shared number describes none of them.
- That the three teams contain the same number of people ::no The first one is what the test is trying to find out, so it cannot also be an assumption. The bell curve is a different assumption entirely, and a much more forgiving one, since averages of a decent number of salaries behave like a bell curve even when individual salaries do not. Equal group sizes are not required either, though you will see shortly that uneven sizes make the damage from unequal spreads far worse.

=== step === concept
::eyebrow The disagreement
## Run the classic test first

Meera's data is in, the assumption is on the table, so run the test everybody learns first. `aov()` is R's classic one-way ANOVA, and `summary()` prints its table.

```r
summary(aov(salary ~ team, data = pay))
#>             Df Sum Sq Mean Sq F value  Pr(>F)   
#> team         2  762.9   381.4   5.396 0.00821 **
#> Residuals   42 2969.0    70.7                   
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

`salary ~ team` is the formula, read out loud as "salary, broken down by team", and `data = pay` tells R which table those two column names live in.

The table has one row for what the teams explain and one row for what is left over. Follow the numbers across. `Df` is degrees of freedom, R's bookkeeping for how much independent information each row carries: 2 for the teams, because with three teams there are two independent gaps, and 42 for the leftovers, which is 45 people minus 3 team averages already spent. `Sum Sq` and `Mean Sq` are the raw and per-degree-of-freedom versions of the variation in each row. Look at the `Residuals` row's `Mean Sq`, which is 70.7, and compare it with the pooled variance you computed by hand a moment ago. It is the same 70.69, printed to fewer digits. That row **is** the pooling step.

`F value` is 5.396, the gaps divided by that pooled noise, and `Pr(>F)` is 0.00821, which is the p-value. It answers one narrow question: if all three teams genuinely paid the same on average and only ordinary randomness separated them, how often would randomness alone hand you team averages at least this far apart? The answer it gives is about 8 times in a thousand, and two asterisks in the margin are R congratulating you on a small p-value.

Meera reads that as settled. The teams pay differently.

=== step === concept
::eyebrow The disagreement
## Now run Welch's version

Welch's ANOVA asks the same question about the same three teams. The only thing it refuses to do is pool. In R it is `oneway.test()` with one argument flipped:

```r
oneway.test(salary ~ team, data = pay, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and team
#> F = 2.85, num df = 2.000, denom df = 17.189, p-value = 0.08532
```

Same formula, same 45 salaries, and now p = 0.085.

Above 0.05, which means by the usual convention Meera cannot conclude anything about the teams at all.

Three things in that output are worth naming right away, and you will take each apart properly later. The title line says "not assuming equal variances", which is R telling you which test ran. `num df = 2.000` is the same 2 as before, one less than the number of teams. And `denom df = 17.189` is where the strangeness lives: the classic test spent 42, this one spent 17.189, and degrees of freedom are not supposed to come with decimal places at all.

That 42 falling to 17.189 is the whole story in one number. Welch looked at the same 45 people and decided the comparison only has about as much solid information in it as a much smaller study would.

[NOTE]
Every code box on this page runs right here in the browser, so change a salary, change an argument, and run it again. Nothing you do here can break anything.

So which of the two is right? Meera cannot report both. That question has a real answer, and you can measure it yourself in the next few steps rather than take it on authority.

=== step === tryit
::eyebrow Your turn
## Ask for Welch yourself

Before going further, get the call into your fingers, because it is one argument and people forget which way round it goes.

`pay` is already in your session from the setup block. Fill in the blank so the test does **not** assume the three teams have equal spread.

```r
oneway.test(salary ~ team, data = pay, ____)
```
::check {"regex":"oneway\\.test[^\\n]*var\\.equal\\s*=\\s*FALSE","gate":true,"difficulty":"beginner","ok":"That is it. var.equal = FALSE is the entire difference between the classic F-test and Welch, and R prints the reassuring title line so you can always check afterwards which one you actually ran.","no":"The argument is var.equal, and you want to tell R that the variances are NOT equal, so it takes the value FALSE. Write it inside the same call, after data = pay."}
::solution
```r
oneway.test(salary ~ team, data = pay, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and team
#> F = 2.85, num df = 2.000, denom df = 17.189, p-value = 0.08532
```

=== step === concept
::eyebrow The experiment
## Which test is telling the truth?

Here is the honest way to settle it, and the trick works on any test you ever have doubts about, not just this one.

A test's p-value comes with a promise attached. When it says p = 0.008, it is promising that results this extreme turn up 8 times in a thousand **when nothing is really going on**. So build a world where nothing is really going on, run the test thousands of times in that world, and count how often it claims to have found something. If the promise is good, the classic test should cry wolf about 5 times in 100 at the usual 0.05 threshold. If it cries wolf far more often than that, its p-values mean something other than what they say.

The function below builds one imaginary payroll where all three teams pay exactly \$52,000 on average, with the same team sizes and the same spreads as Meera's real company, and runs both tests on it.

```r
one_payroll <- function(sizes   = c(18, 18, 9),
                        spreads = c(3.6, 2.7, 18.1),
                        means   = c(52, 52, 52)) {
  team <- rep(c("Support", "Marketing", "Engineering"), sizes)
  salary <- c(rnorm(sizes[1], mean = means[1], sd = spreads[1]),
              rnorm(sizes[2], mean = means[2], sd = spreads[2]),
              rnorm(sizes[3], mean = means[3], sd = spreads[3]))
  classic <- oneway.test(salary ~ team, var.equal = TRUE)
  welch   <- oneway.test(salary ~ team, var.equal = FALSE)
  c(classic_p = classic$p.value,
    welch_p   = welch$p.value,
    classic_F = unname(classic$statistic))
}

set.seed(24)
round(one_payroll(), 3)
#> classic_p   welch_p classic_F 
#>     0.018     0.374     4.410 
```

Take that function apart before trusting it. `sizes` is how many people are on each team, `spreads` is each team's standard deviation, and `means` is what each team truly pays, which here is 52 for all three. `rnorm(18, mean = 52, sd = 3.6)` invents 18 salaries scattered around \$52,000 with a typical distance of \$3,600 from it. `oneway.test` with `var.equal = TRUE` is the classic test and with `var.equal = FALSE` is Welch, so both see exactly the same invented payroll.

Now read the result. In this made-up company **every team pays the same**. I know that for a fact, because I wrote the 52s myself. And the classic test came back with p = 0.018 and called it a difference.

Welch, on the same fake payroll, said p = 0.374 and correctly shrugged.

I picked seed 24 deliberately, because it is a draw where the classic test goes wrong and I wanted you to see one. Change 24 to any number you like and run it again: most draws are unremarkable. So let us stop cherry-picking and count instead.

=== step === concept
::eyebrow The experiment
## Two thousand payrolls where nothing is going on

`replicate()` runs an expression over and over and collects the results, so 2000 imaginary payrolls is one line. This takes a few seconds to run, since it is fitting four thousand tests.

```r
set.seed(2026)
runs <- replicate(2000, one_payroll())
dim(runs)
#> [1]    3 2000

pct_significant <- function(runs) {
  round(rowMeans(runs[c("classic_p", "welch_p"), ] < 0.05) * 100, 1)
}

pct_significant(runs)
#> classic_p   welch_p 
#>      22.1       5.6 
```

`runs` is a table with 3 rows and 2000 columns, one column per imaginary payroll. `runs[c("classic_p", "welch_p"), ] < 0.05` turns the two p-value rows into TRUE and FALSE, and `rowMeans()` of TRUE and FALSE is the share that are TRUE, which multiplied by 100 is a percentage.

So on data shaped like Meera's company, where every team truly pays the same:

**The classic ANOVA declared a difference 22.1 times in 100. It promised 5.**

Four times more often than the number it prints on the screen.

Welch declared one 5.6 times in 100, which is the promise kept, give or take the wobble you expect from 2000 runs.

::widget chart-plotter {"data":[{"x":"classic, even","y":4.8},{"x":"Welch, even","y":4.9},{"x":"classic, uneven","y":22.1},{"x":"Welch, uneven","y":5.6}],"geoms":["bar"],"x":"setup","y":"false_alarms_per_100"}

The two bars on the left are the same experiment run on three teams that scatter alike, which you will run yourself in a moment. There, both tests keep their promise and there is nothing to choose between them. The two on the right are Meera's shape. Same test, same threshold, and the only thing that changed between the pairs is whether the teams scatter alike.

[KEY INSIGHT]
The classic test is not slightly optimistic on this kind of data. It is wrong about four times as often as it claims to be, and nothing in its output hints at that. It prints the same confident table either way, which is exactly what makes it dangerous.

=== step === concept
::eyebrow The experiment
## So what was Meera's p = 0.008 really worth?

You can go one step further and ask the question Meera actually cares about. The classic test on the real payroll produced F = 5.396. In a world where those three teams pay identically, how often does that same test produce an F at least that big?

You already have 2000 such worlds sitting in `runs`.

```r
round(mean(runs["classic_F", ] > 5.396) * 100, 1)
#> [1] 11.6

round(qf(0.95, 2, 42), 2)
#> [1] 3.22
```

An F of 5.396 or bigger turned up in 11.6 percent of payrolls where nothing whatsoever was going on. The classic test told Meera that number was 0.8 percent, so it was out by a factor of about fourteen.

Fourteen times off, and not one character of its output hints at it. Little unsettling right?

The second line is the textbook cutoff, the F value the classic test treats as the 5 percent mark for 2 and 42 degrees of freedom. Anything above 3.22 gets called significant. Now watch how much of the honest **null distribution** sits above that line, meaning the whole spread of F values the test actually produces when there is nothing to find:

```r
hist(runs["classic_F", ], breaks = 60, xlim = c(0, 15),
     col = "grey85", border = "white",
     main = "2000 payrolls where every team pays the same",
     xlab = "classic F statistic")
abline(v = 3.22, col = "steelblue", lwd = 2)
abline(v = 5.396, col = "firebrick", lwd = 2)
```

`hist()` draws the histogram, meaning bars whose heights are how many of the 2000 F values fell in each range, and each `abline(v = ...)` drops a vertical line at a value. The blue line is the textbook cutoff of 3.22, the red line is Meera's observed 5.396, and the tail keeps going well to the right of the plot, which I have cut at 15 so you can see the bulk.

The blue line is supposed to have 5 percent of the distribution beyond it. Count what is actually out there. That pile of bars to the right of the blue line is 22 percent of the studies, and every single one of them is a false alarm, because you built this world yourself and put no difference in it.

=== step === quiz
::eyebrow Check yourself
## The equal group sizes defence

A colleague looks at all this and says: fine, but that only happened because Engineering has 9 people and the other two have 18. ANOVA is robust to unequal variances as long as the groups are the same size, so with equal sizes we are safe. What is the honest response?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- They are right, equal group sizes make the classic F-test valid no matter how different the spreads are
- Equal sizes reduce the damage a lot but do not remove it, so the only way to know is to measure it on your own shape of data ::ok Exactly right, and you are about to measure it: with 15 people on every team and these same three spreads, the classic test still cries wolf about 9.6 times in 100 rather than 5. Equal sizes are genuinely protective, which is where the folklore comes from, but protective is not the same as safe.
- They are wrong, because group size has nothing to do with how badly unequal variances hurt the test
- They are right only if the data is also normally distributed ::no The first answer is the common overstatement of a real fact, and the last one adds a different assumption to it without fixing anything. The third goes too far the other way: group size matters enormously here, and the worst case is exactly the one Meera has, where the noisiest team is also the smallest. Then the pooled noise is dragged down by the two big quiet teams and the test believes the noisy team's average far more than it should.

=== step === concept
::eyebrow The experiment
## Equal sizes help, and they are not enough

Do not take that on trust either. Your `one_payroll()` function already takes the team sizes as an argument, so run it again with 15 people on every team and the same three spreads.

```r
set.seed(99)
runs_balanced <- replicate(2000, one_payroll(sizes = c(15, 15, 15)))
pct_significant(runs_balanced)
#> classic_p   welch_p 
#>       9.6       5.7 
```

From 22.1 down to 9.6, so balancing the teams removed most of the damage. It still leaves the classic test wrong about twice as often as it promises, on data where the spreads differ by a factor of 44.

Welch, meanwhile, has not moved. 5.6 before, 5.7 now.

So balancing your groups is worth doing, and it is not a fix. It treats the symptom, which is how badly the pooled number misleads, rather than the cause, which is pooling numbers that should not have been pooled. Welch needs no such rescue, because it never made the assumption in the first place.

=== step === concept
::eyebrow Inside Welch
## What Welch does instead: weigh each team by how well you know it

Time to open Welch up. The idea behind it is one you already use in ordinary life: when several people tell you different things, you lean on the ones you have reason to trust.

Welch gives each team a **weight**, and the weight is

\( w_i = \dfrac{n_i}{s_i^2} \)

where \( n_i \) is how many people are on team \( i \), \( s_i^2 \) is that team's own variance, and \( w_i \) is how much that team's average gets to influence the answer. More people pushes the weight up. More internal scatter pushes it down, hard, because the variance is a squared quantity sitting in the denominator.

There is a plain English reading of that fraction. It is precision: how sharply this team's average is pinned down. A big quiet team has a sharply known average, so it gets a big say. A small noisy team's average could sit almost anywhere, which is why it barely counts.

```r
weight <- n_i / var_i
round(weight, 3)
#> Engineering   Marketing     Support 
#>       0.027       2.439       1.410 

round(100 * weight / sum(weight), 1)
#> Engineering   Marketing     Support 
#>         0.7        62.9        36.4 
```

::widget importance-bars {"items":[{"label":"Marketing","value":62.9},{"label":"Support","value":36.4},{"label":"Engineering","value":0.7}]}

Marketing, 18 tightly clustered people, carries 62.9 percent of the vote. Support, 18 slightly more scattered people, carries 36.4 percent. Engineering carries 0.7 percent.

So the team Meera was actually asking about gets less than one percent of the say. Uncomfortable right?

And yet Welch is not being unfair to Engineering here. Nine people whose salaries run from \$46,000 to \$96,500 simply do not tell you much about what an engineer earns at this company. That was always true. The classic test simply hid it from you, and Welch does not.

=== step === concept
::eyebrow Inside Welch
## The weighted middle, and Welch's F

With weights in hand the rest follows the same shape as the classic test: measure the gaps, measure the noise, divide.

First, the middle to measure gaps from. Instead of the plain average of all 45 salaries, Welch uses the **weighted average of the team averages**,

\( \tilde{x} = \dfrac{\sum w_i \bar{x}_i}{\sum w_i} \)

where \( \bar{x}_i \) is team \( i \)'s average salary, \( w_i \) is its weight from the last step, and \( \tilde{x} \) is the weighted middle they define together.

```r
mean_i <- tapply(pay$salary, pay$team, mean)
grand  <- sum(weight * mean_i) / sum(weight)
round(grand, 2)
#> [1] 52
```

\$52,000, which sits between Support's \$50,720 and Marketing's \$52,640 and nowhere near Engineering's \$61,740. The plain average of all 45 salaries is higher, because Engineering's two specialists drag it up. The weighted middle mostly ignores them, exactly as the weights said it would.

Next the gaps, measured from that middle:

\( \text{top} = \dfrac{\sum w_i (\bar{x}_i - \tilde{x})^2}{k - 1} \)

where \( k \) is the number of teams, so \( k - 1 \) is 2 here. Each team's distance from the middle is squared, then scaled by how much that team counts.

```r
top <- sum(weight * (mean_i - grand)^2) / (3 - 1)
round(top, 3)
#> [1] 2.961
```

Then Welch divides by a correction that grows as the weights become more lopsided:

\( \text{bottom} = 1 + \dfrac{2(k-2)}{k^2-1} \sum \dfrac{(1 - w_i / W)^2}{n_i - 1} \)

where \( W \) is the sum of all the weights, so \( w_i / W \) is the share of the vote you already printed as a percentage. That sum is worth naming, because it comes back in a moment: call it \( \lambda \). A team whose share is far from the whole and which has few people to estimate its own variance from contributes the most to it.

```r
lambda <- sum((1 - weight / sum(weight))^2 / (n_i - 1))
round(lambda, 4)
#> [1] 0.1551

bottom <- 1 + (2 * (3 - 2) / (3^2 - 1)) * lambda
round(bottom, 4)
#> [1] 1.0388

round(top / bottom, 3)
#> [1] 2.85
```

2.85, which is exactly the F that `oneway.test()` printed several steps ago. No magic in the box: Welch's F is the spread of team averages around a precision-weighted middle, gently corrected for how lopsided that weighting is.

=== step === quiz
::eyebrow Check yourself
## The strange 17.189

Welch's output said `denom df = 17.189`. Meera has 45 people and 3 teams. What is that number saying?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- R has made a rounding error, since degrees of freedom are always whole numbers
- It is the number of people whose salaries the test actually used, so 17 of the 45
- It is how much independent information the comparison really has, once the two big quiet teams stop covering for the small noisy one ::ok That is the idea. Degrees of freedom are a currency for information, not a headcount, and Welch spends what the data actually supports rather than what the row count suggests. All 45 salaries are used, and the comparison is simply worth about as much as a much smaller balanced study would be.
- It is 45 minus 3, adjusted downwards a little because the p-value came out above 0.05 ::no Every wrong answer here treats degrees of freedom as a count of something you can point at. They are not: they are a measure of how much independent information a comparison carries, which is why Welch can report a fraction without anything having gone wrong. And nothing in the calculation looks at the p-value, since the degrees of freedom are settled by the weights and the group sizes long before a p-value exists. The classic test's 42 was a headcount, 45 people minus 3 team averages, and it is precisely that headcount that overstates what Meera knows.

=== step === concept
::eyebrow Inside Welch
## Where the fractional degrees of freedom come from

The formula for Welch's denominator degrees of freedom is called the Satterthwaite approximation, and you have already computed everything it needs:

\( \text{df}_{\text{denom}} = \dfrac{k^2 - 1}{3 \lambda} \)

where \( k \) is the number of teams and \( \lambda \) is the same sum you named in the last step. Since \( \lambda \) is built from the weight shares and the team sizes, nothing about it is forced to land on a whole number.

```r
df_denom <- (3^2 - 1) / (3 * lambda)
round(df_denom, 3)
#> [1] 17.189

round(pf(top / bottom, df1 = 2, df2 = df_denom, lower.tail = FALSE), 5)
#> [1] 0.08532
```

`pf()` gives the area under the F distribution beyond a value, so that second line is the p-value from first principles: how much of the reference distribution with 2 and 17.189 degrees of freedom sits beyond an F of 2.85. It is Welch's 0.08532, rebuilt from the weights.

Now the part worth remembering when you meet this in your own work. The denominator degrees of freedom drop towards whichever group is holding the comparison back. Here that is Engineering, with 8 degrees of freedom of its own from 9 people, so the whole comparison lands at 17.189 rather than 42.

And that behaviour survives even when the spreads match, which is easier to believe once you have watched it. The function below rescales each team so that all three end up with a spread of exactly 4, leaving every team average exactly where it was and changing only how tightly people cluster around it.

```r
same_spread <- function(x) round(mean(x) + (x - mean(x)) * 4 / sd(x), 1)

pay_even <- data.frame(
  team   = pay$team,
  salary = c(same_spread(support), same_spread(marketing), same_spread(engineering))
)

round(tapply(pay_even$salary, pay_even$team, sd), 2)
#> Engineering   Marketing     Support 
#>        3.99        3.99        4.00 

oneway.test(salary ~ team, data = pay_even, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and team
#> F = 23.181, num df = 2.000, denom df = 21.817, p-value = 3.999e-06
```

`same_spread()` takes each salary's distance from its team average, multiplies that distance by whatever factor turns the team's spread into 4, and adds it back to the average. So the shape of each team is preserved and only its width changes.

Three teams that now scatter identically, and the denominator degrees of freedom come out at 21.817 rather than 42. Nine people can only tell you so much about engineering pay, however tidily their salaries line up, so uneven group sizes cost you information all on their own, and Welch is the test that shows you that cost.

The p-value in that output is worth a glance too. It has collapsed to 0.000004, because the gaps between the team averages have not moved an inch while Engineering's spread has fallen from 18.12 to 4. Nobody's salary changed and nobody overtook anybody. What changed is how confidently you can say so.

[NOTE]
This is why you should never round the fractional df away when reporting. Write F(2, 17.19) = 2.85, p = 0.085. Writing F(2, 17) hides that a real correction happened, and writing F(2, 42) is a different test entirely.

=== step === concept
::eyebrow The price
## What does Welch cost when the spreads really are equal?

A fair worry at this point: if Welch throws away the pooling, surely it gives up something in return. If the teams genuinely do scatter alike, are you paying for protection you did not need?

Measure that too. Same function, three teams of 15, all with a spread of 6, and no real difference between them:

```r
set.seed(7)
runs_even <- replicate(2000, one_payroll(sizes = c(15, 15, 15), spreads = c(6, 6, 6)))
pct_significant(runs_even)
#> classic_p   welch_p 
#>       4.8       4.9 
```

4.8 and 4.9. On data where the classic test's assumption is perfectly true, the two are indistinguishable, and both keep the 5 percent promise.

False alarms are only half the question though. The other half is whether Welch can still find a difference that is really there, which is called the **power** of a test. So put a real difference in: teams that truly pay 52, 54 and 56 thousand, still with equal spreads.

```r
set.seed(5)
runs_real <- replicate(2000, one_payroll(sizes   = c(15, 15, 15),
                                         spreads = c(6, 6, 6),
                                         means   = c(52, 54, 56)))
pct_significant(runs_real)
#> classic_p   welch_p 
#>      32.0      30.3 
```

The classic test caught the real difference 32.0 percent of the time, Welch 30.3 percent. So there is a cost, and now you know its size: about one and a half studies in a hundred, in the one scenario where the classic test is exactly right.

Set that against being wrong four times too often when the assumption fails, and the trade is not close. This is why a fair number of statisticians argue that Welch should simply be the default for comparing group means, and the paper in the references makes that case with far more simulations than these.

[KEY INSIGHT]
You do not have to decide whether the spreads are equal. That is the useful part. Use Welch always: when the assumption holds you lose almost nothing, and when it fails you are still crying wolf only 5 times in 100 instead of 22.

=== step === concept
::eyebrow A familiar face
## Two groups: you have been running Welch all along

Part 1 mentioned in passing that R's `t.test()` gives you Welch's version by default, and you can now see that these are the same idea, not two coincidences.

Drop Marketing and compare Engineering with Support, first as a t-test and then as a one-way test on two groups:

```r
t.test(engineering, support)
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  engineering and support
#> t = 1.8084, df = 8.3125, p-value = 0.1068
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -2.943284 24.998840
#> sample estimates:
#> mean of x mean of y 
#>  61.74444  50.71667 
```

```r
two_teams <- pay[pay$team != "Marketing", ]
oneway.test(salary ~ team, data = two_teams, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  salary and team
#> F = 3.2701, num df = 1.0000, denom df = 8.3125, p-value = 0.1068
```

Identical p-values, identical fractional degrees of freedom of 8.3125, and the two statistics are related in the simplest possible way:

```r
round(1.8084^2, 4)
#> [1] 3.2703
```

The F is the t squared, off in the last digit only because 1.8084 is the rounded t that R printed. With two groups Welch's ANOVA **is** the Welch t-test, so the two-group test people reach for without a second thought is the small case of what you just built by hand.

Notice the confidence interval in the t-test output too, since it says something the p-value cannot. It runs from -\$2,940 to \$25,000. That is the range of true differences the data cannot rule out, and a range with zero inside it is a range that cannot rule out no difference at all. It is also enormously wide, which is the useful part: nine noisy salaries pin down almost nothing.

=== step === concept
::eyebrow Reporting
## The numbers to actually put in front of Meera

A p-value of 0.085 is not a finding, and "we found no significant difference" is a poor sentence to hand to somebody making pay decisions. Give Meera the picture instead, starting with each team's average and how well that average is known.

```r
ci_for <- function(x) {
  fit <- t.test(x)
  round(c(mean = mean(x), low = fit$conf.int[1], high = fit$conf.int[2]), 2)
}

rbind(Support     = ci_for(support),
      Marketing   = ci_for(marketing),
      Engineering = ci_for(engineering))
#>              mean   low  high
#> Support     50.72 48.94 52.49
#> Marketing   52.64 51.29 53.99
#> Engineering 61.74 47.82 75.67
```

`t.test(x)` on a single group hands back a 95 percent **confidence interval**, which is the range of true team averages the data cannot rule out. Support's is about three and a half thousand dollars wide. Marketing's is under three. Engineering's runs from \$47,820 to \$75,670, which is nearly \$28,000 of not knowing.

That last row is the answer to Meera's question, in a form somebody can act on. This payroll does not really hand you an Engineering average at all, it hands you a range nearly \$28,000 wide.

Here is what the pooled model would have claimed for that same team:

```r
round(mean(engineering) + c(-1, 1) * qt(0.975, 42) * sqrt(pooled_var / 9), 2)
#> [1] 56.09 67.40
```

Eleven thousand dollars wide instead of twenty eight, because it used the shared wobble of 8.41 for a team that actually wobbles by 18.12. The classic ANOVA was not merely reporting a smaller p-value, it was quietly promising a precision nobody has.

And when the test does come out small, the follow-up question is which pairs differ. A test across all three teams at once is called an **omnibus** test, from the Latin for "for all", and all it ever says is that something is going on somewhere. Naming the pairs is a separate job, and it keeps the same principle, no pooling:

```r
pairwise.t.test(pay$salary, pay$team, p.adjust.method = "holm", pool.sd = FALSE)
#> 
#> 	Pairwise comparisons using t tests with non-pooled SD 
#> 
#> data:  pay$salary and pay$team 
#> 
#>           Engineering Marketing
#> Marketing 0.24        -        
#> Support   0.24        0.24     
#> 
#> P value adjustment method: holm 
```

`pool.sd = FALSE` keeps each pair on its own spreads, which is the Welch idea applied one pair at a time. `p.adjust.method = "holm"` inflates each p-value to account for having run three tests at once, since three chances to be fooled are more than one. Read the table like a mileage chart: row for one team, column for the other. Nothing separates here, which is what you expect after an omnibus p of 0.085.

[TIP]
The formal name for the Welch-style post-hoc after a Welch ANOVA is the Games-Howell test, which uses the same unpooled standard errors with a different reference distribution. `pairwise.t.test(pool.sd = FALSE)` is base R and close enough for most work; when you are writing something up for review, `rstatix::games_howell_test()` gives you the textbook version with confidence intervals attached. Part 6 of this course takes post-hoc testing apart properly.

So the honest sentence for Meera is this. Support and Marketing average about \$50,700 and \$52,600, both known to within a couple of thousand. Engineering averages \$61,700 but ranges from \$46,000 to \$96,500 across nine people, so its average is known only to within about fourteen thousand either way. Welch's ANOVA across the three teams gives F(2, 17.19) = 2.85, p = 0.085, so this payroll cannot establish that the teams differ. Whether that gap is real is a question nine engineers cannot answer.

=== step === concept
::eyebrow The habit to break
## Do not test for equal variances first

Almost every guide you will find answers "should I use Welch?" with another test. Run Bartlett's test, look at its p-value, and switch if it comes out small. R has it built in:

```r
bartlett.test(salary ~ team, data = pay)
#> 
#> 	Bartlett test of homogeneity of variances
#> 
#> data:  salary by team
#> Bartlett's K-squared = 53.28, df = 2, p-value = 2.693e-12
```

`bartlett.test()` asks one question: if all three teams genuinely had the same variance, how often would randomness alone produce variances as different as these? The answer here is essentially never, so it flags Meera's payroll about as loudly as a test can.

Which is correct, and still the wrong workflow, for three reasons worth having straight.

The first is that the pre-test's power depends on how much data you have, exactly like the normality test in Part 1. With small groups it misses real differences in spread because there is not enough evidence to convict, and with large groups it flags harmless ones. Either way its verdict is about detectability, not about damage.

The second is subtler. Choosing your test by first testing the same data changes what the final p-value means, because the reported number pretends you had one plan all along when in fact your plan depended on what the data did.

The third is the simplest: you measured the cost of skipping the pre-test yourself. Welch costs about one and a half studies in a hundred when the assumption holds. Why run a screening test to decide whether to pay that?

[WARNING]
Bartlett's test also assumes each group is normally distributed, and it is sensitive enough to that assumption that a handful of unusually extreme values, what statisticians call heavy tails, can make it shout about variances that are perfectly fine. The sturdier alternative works on each value's distance from its group's centre rather than on squared distances from the mean, and `car::leveneTest()` runs it with the median as that centre by default, which is what makes it hold up on lopsided data. Use either one to understand your data. Do not use either one as a switch.

=== step === concept
::eyebrow Honesty
## When Welch is not the answer either

Welch fixes one specific thing: groups that scatter by different amounts. It fixes nothing else. And since a test that quietly does the wrong job is the exact trouble Meera started with, it is worth being straight about where Welch stops helping.

::widget tree-diagram {"root":"is the mean fair?","l":"spreads equal?","r":"one wild value?","leaves":["classic F","Welch F","trimmed mean","Kruskal"]}

Start at the top, because that question comes before any of this. **Is the average a fair summary of each group?** For Support and Marketing, plainly yes: their people cluster around a middle. For Engineering, honestly, not really. Seven people spread between \$46,000 and \$62,000, plus two near \$92,000, is not a group with a typical salary, it is two groups wearing one label, and no test can rescue a summary that does not describe anybody.

If the average is fair, the left branch is the whole lesson: equal spreads let you use either test, unequal spreads mean Welch.

If it is not, you have two exits on the right. When a couple of extreme values are dragging things around, a **trimmed mean**, which drops a fixed share from each end before averaging, keeps the middle honest. When the whole shape is lopsided, switch to the rank-based family, which throws the amounts away and keeps only the ordering:

```r
kruskal.test(salary ~ team, data = pay)
#> 
#> 	Kruskal-Wallis rank sum test
#> 
#> data:  salary by team
#> Kruskal-Wallis chi-squared = 4.4719, df = 2, p-value = 0.1069

round(tapply(pay$salary, pay$team, median), 2)
#> Engineering   Marketing     Support 
#>       55.40       52.15       50.80 
```

Kruskal-Wallis is the three-or-more-group rank test, and it agrees with Welch here: p = 0.107, nothing established. That agreement is reassuring, because when a borderline judgement call flips your conclusion, the conclusion was never solid.

The medians are worth a look on their own. By average, Engineering sits \$11,000 above Support. By median, the middle engineer earns \$55,400 against Support's \$50,800, so the gap shrinks to \$4,600 once the two specialists stop pulling. Both numbers are true. They answer different questions, and choosing which to report is judgement, not statistics.

There is also a limit on what any test can do for Meera here, and it is worth saying plainly. Welch does not narrow the range around Engineering's average, it only stops the report from pretending that range is narrow. If the company genuinely needs to know whether engineers are paid differently, the fix is more information, which means more engineers, a longer window, or splitting the specialists out as the separate group they really are. No choice of test substitutes for that.

Two more limits, quickly, because they catch more people than the ones above.

`oneway.test()` compares groups on ONE grouping variable, and that is all it does. If Meera wanted to look at team and seniority together, this function has no way to express it, and the usual two-way ANOVA brings back the pooled-variance assumption you just spent a lesson escaping. Robust two-way methods exist and they are a bigger topic than this lesson.

Welch also assumes every row is a separate, independent person, exactly as the classic test does. If two of Meera's engineers are contractors billed through the same agency at the same rate, those rows are linked and no p-value on this page knows about it.

And Welch does nothing about a typo. A salary entered as 960 instead of 96.0 would inflate Engineering's variance, drop its weight to almost nothing, and Welch would sail on without complaint. Look at your data first. Always.

=== step === tryit
::eyebrow Your turn
## The full walk, on data you have not seen

R ships with `airquality`, a table of daily air measurements from New York in 1973. It has an `Ozone` column, a number, and a `Month` column running from 5 to 9, and ozone bounces around a good deal more in the hot months than the mild ones, which the solution below shows you.

Walk the questions from Part 1. The outcome is a number. There are five groups, one per month. They are different days, so independent. And the spreads are nowhere near equal, so you already know which version you want.

Write the call, then press Check. The data lives in `airquality`, which is already loaded.

```r
# ozone by month, five groups, spreads that do not match
____
```
::check {"regex":"oneway\\.test[^\\n]*Ozone[^\\n]*Month[^\\n]*var\\.equal\\s*=\\s*FALSE","gate":true,"difficulty":"intermediate","ok":"That is the one. It comes back with F(4, 42.67) = 8.03 and p = 0.000064, so ozone genuinely differs across the months. Notice the denominator df of 42.67 against the classic 111: those missing readings and uneven spreads cost a lot of information.","no":"You want oneway.test, with the formula Ozone ~ Month, the argument data = airquality, and var.equal = FALSE to get Welch. R drops the missing ozone readings for you."}
::solution
```r
round(tapply(airquality$Ozone, airquality$Month, sd, na.rm = TRUE), 1)
#>    5    6    7    8    9 
#> 22.2 18.2 31.6 39.7 24.1 

oneway.test(Ozone ~ factor(Month), data = airquality, var.equal = FALSE)
#> 
#> 	One-way analysis of means (not assuming equal variances)
#> 
#> data:  Ozone and factor(Month)
#> F = 8.0267, num df = 4.000, denom df = 42.668, p-value = 6.439e-05
```

August readings scatter more than twice as widely as June ones, which is the unequal spread you were told about, now checked rather than taken on trust. `na.rm = TRUE` is there because `airquality` has 37 days with no ozone reading at all, and `sd()` refuses to give you a number until you say what to do about them.

`factor(Month)` is optional inside `oneway.test()`, which converts the grouping side for you, so plain `Ozone ~ Month` gives exactly the same answer. Be careful with that habit elsewhere though: `aov(Ozone ~ Month, data = airquality)` treats the month numbers 5 to 9 as a quantity and fits a straight line through them, which is a completely different model with 1 degree of freedom rather than 4. Wrapping the grouping variable in `factor()` costs nothing and removes the doubt.

=== step === concept
::eyebrow The whole thing
## One page to keep

| The situation | What to run | What to report |
|---|---|---|
| 3 or more groups, spreads roughly alike | `oneway.test(y ~ g, var.equal = FALSE)` anyway | F with its fractional df, plus group means and intervals |
| 3 or more groups, spreads clearly different | `oneway.test(y ~ g, var.equal = FALSE)` | the same, and say why the spreads differ |
| 2 groups | `t.test(x, y)`, already Welch | the difference and its confidence interval |
| after a small Welch p, which pairs? | `pairwise.t.test(y, g, pool.sd = FALSE, p.adjust.method = "holm")` | adjusted p per pair, or Games-Howell for a write-up |
| the mean is not a fair summary | `kruskal.test(y ~ g)` | medians per group, since a rank test gives you no dollars |
| you want to check the spreads for understanding | `bartlett.test()` or `car::leveneTest()` | never as a switch, only as description |

And the four things worth carrying out of this lesson even if you forget the formulas:

1. Classic ANOVA pools every group's noise into one number and uses it for all of them.
2. When one group is far noisier than the rest, and especially when that group is small, the pooled number is wrong for everybody and the false-alarm rate climbs. You measured 22 in 100 where 5 was promised.
3. Welch weighs each group by \( n_i / s_i^2 \), its precision, and pays for it with fractional degrees of freedom that show you how much information you really have.
4. It costs about one and a half studies in a hundred when the assumption holds, so use it by default and stop pre-testing.

=== step === concept
::eyebrow Go deeper
## References

Five places worth an hour if you want more than this lesson gives.

- [R documentation for oneway.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html) - the official page for the function, including exactly what `var.equal` changes and what it returns.
- [Welch (1951), On the comparison of several mean values](https://doi.org/10.1093/biomet/38.3-4.330) - the original paper, where the weighted F and the Satterthwaite degrees of freedom you rebuilt by hand were first set out.
- [Delacre, Lakens and Leys (2017), why psychologists should default to Welch](https://rips-irsp.com/articles/10.5334/irsp.82) - the modern case for skipping the pre-test and using Welch always, with the simulations behind the advice.
- [Games and Howell (1976), pairwise comparisons with unequal n and variances](https://doi.org/10.3102/10769986001002113) - the Monte Carlo study behind the post-hoc test that follows a Welch ANOVA.
- [OpenIntro Statistics, free textbook](https://www.openintro.org/book/os/) - a patient, plain-language treatment of ANOVA and its assumptions, with the arithmetic this lesson skipped.

=== step === complete
## Part 2 complete

You started with two answers to one question: p = 0.008 from the classic ANOVA and p = 0.085 from Welch, on the same 45 salaries. You now know which one to believe, and why.

The classic test pools all three teams' noise into a single number, 8.41 in Meera's case, which is too big for Support, too big for Marketing, and less than half of what Engineering actually is. You then measured the damage instead of guessing at it: on payrolls where every team truly paid the same, the classic test declared a difference 22.1 times in 100. Welch stayed at 5.6. An F as large as Meera's turned up in 11.6 percent of those imaginary companies, so that 0.8 percent was never a real 0.8 percent.

Welch weighs each team by how sharply its average is known, which handed 62.9 percent of the vote to Marketing and 0.7 percent to Engineering, and its odd fractional degrees of freedom, 17.189 rather than 42, are the test telling you how much you actually know. It costs about one and a half studies in a hundred when the spreads really are equal. That is why the honest default is to leave `var.equal = FALSE` alone and never think about it again.

Part 3 takes the other exit from the tree you saw a few steps ago. When the problem is not unequal spread but a shape where the average itself is the wrong summary, you switch to the rank-based family, and the two-group version of that is the Mann-Whitney test: what it actually compares, what its p-value does and does not say, and why "nonparametric" does not mean "assumption free".
