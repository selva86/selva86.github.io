---
title: "Welch's ANOVA: the test for unequal group variances"
slug: "Which-Test-Mini-2-v2"
catalog_blurb: "Run the right ANOVA when one group is far noisier than the rest."
description: "Two departments pay in a tight band, the third mixes juniors with specialists. Watch classic ANOVA break on that payroll, then run the version that does not."
keywords: "Welch's ANOVA, oneway.test in R, unequal variances ANOVA, heteroscedasticity, equal variance assumption, Satterthwaite degrees of freedom, Games-Howell, one-way ANOVA in R, statistics for beginners"
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
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 2 of 11
## Welch's ANOVA: the test for unequal group variances

Today let's find out what happens to the most common group comparison in statistics when one of the groups is far noisier than the others.

Let's say Meera handles payroll at a company of thirty two people. Her director stops by her desk on a Tuesday and asks something that sounds easy to answer: do our three departments actually pay differently, or does it only look that way?

So Meera pulls the salaries. Support has twelve people, Sales has twelve, and Engineering has eight. The three averages come out at \$60,925, \$61,825 and \$73,475.

Engineering is about twelve thousand dollars ahead of the other two, and that is the gap the director noticed.

However, there is something inside Engineering that an average will never show you. Five of those eight people are junior engineers earning in the fifties and low sixties, while the other three are specialists on \$86,000, \$97,000 and \$108,000. It is one column in a spreadsheet holding two completely different kinds of job.

So is that twelve thousand dollar gap a real difference in pay, or is it three specialists pulling an average around?

So what do the three departments actually look like beside each other? Have a look before any test runs.

::widget chart-plotter {"data":[{"x":"Support","y":57200},{"x":"Support","y":62800},{"x":"Support","y":59400},{"x":"Support","y":64100},{"x":"Support","y":60300},{"x":"Support","y":56800},{"x":"Support","y":63500},{"x":"Support","y":61100},{"x":"Support","y":58200},{"x":"Support","y":65200},{"x":"Support","y":59900},{"x":"Support","y":62600},{"x":"Sales","y":63400},{"x":"Sales","y":57900},{"x":"Sales","y":65800},{"x":"Sales","y":60200},{"x":"Sales","y":61700},{"x":"Sales","y":66900},{"x":"Sales","y":58600},{"x":"Sales","y":64300},{"x":"Sales","y":59100},{"x":"Sales","y":62800},{"x":"Sales","y":57300},{"x":"Sales","y":63900},{"x":"Engineering","y":54800},{"x":"Engineering","y":61300},{"x":"Engineering","y":57600},{"x":"Engineering","y":63900},{"x":"Engineering","y":59200},{"x":"Engineering","y":86000},{"x":"Engineering","y":97000},{"x":"Engineering","y":108000}],"geoms":["boxplot"],"x":"dept","y":"salary"}

That picture is called a boxplot, and here is how to read it. The thick line inside each box is the middle salary in that department, the box itself covers the middle half of the people, and the thin lines reach out towards the rest. So a short box means everybody in that department is paid roughly the same, and a tall box means they are not.

Support and Sales are two short boxes, and Engineering is an enormously tall one.

Look at one more thing in that picture, because it shows the same problem from a different angle. The thick line is the middle salary, not the average. For Support the two are almost the same number, \$60,700 against \$60,925. For Engineering the middle salary is \$62,600 while the average is \$73,475, because three specialists are pulling the average up past almost everybody in the department.

The difference in box height is what today is about. The ordinary one-way ANOVA, which is the test almost everyone uses for three groups, assumes those three boxes are about the same height. When they are not, it does not warn you. It simply gives you an answer, and that answer can be wrong.

Part 1 of this course ended with five questions that pick your test, and question four left one thread hanging. When the groups scatter by very different amounts, it said, run the Welch version instead, and then it moved on. Today we pick that thread back up.

By the end you will be able to:

- Spot unequal spread from a boxplot, from the group standard deviations, and from how well each average is pinned down
- Say what the classic ANOVA pools together, and why one shared spread is the wrong yardstick for a payroll like Meera's
- Measure how often each test raises a false alarm inside a company where you already know the truth
- Run Welch's ANOVA, and rebuild both its weights and its odd fractional degrees of freedom by hand
- Say what Welch costs when the spreads really are equal, and why testing for equal spread first is a poor way to choose
- Follow a Welch result through the pairwise comparisons and report the whole thing so somebody else can check it
- Name what Welch does not fix, and why a rank test answers a different question rather than curing this one

**What you need first:** you can read a simple R script, so a variable, `c()`, a function call and `$` are familiar. No statistics is assumed at all. Every term, including standard deviation, variance, standard error, degrees of freedom and p-value, is defined in plain words the first time it turns up. Part 1 helps but is not required.

=== step === concept
::eyebrow The data
## Meera's payroll in R

Here is Meera's Tuesday typed into R. Run this block first, because every block further down the page uses the table it builds.

```r
support <- c(57200, 62800, 59400, 64100, 60300, 56800,
             63500, 61100, 58200, 65200, 59900, 62600)

sales <- c(63400, 57900, 65800, 60200, 61700, 66900,
           58600, 64300, 59100, 62800, 57300, 63900)

engineering <- c(54800, 61300, 57600, 63900, 59200,
                 86000, 97000, 108000)

pay <- data.frame(
  dept   = rep(c("Support", "Sales", "Engineering"), c(12, 12, 8)),
  salary = c(support, sales, engineering)
)

head(pay, 4)
#>      dept salary
#> 1 Support  57200
#> 2 Support  62800
#> 3 Support  59400
#> 4 Support  64100

nrow(pay)
#> [1] 32
```

Look at how `engineering` is typed. The first five numbers on the first line are the junior engineers, and the three on the second line are the specialists. Nothing in R separates them, and nothing ever will, because as far as any test is concerned Engineering is one department of eight people. Keeping the two populations visible in the source is a note to yourself, not to R.

`rep(c("Support", "Sales", "Engineering"), c(12, 12, 8))` writes the word Support twelve times, then Sales twelve times, then Engineering eight times, which is exactly thirty two labels to sit beside the thirty two salaries. `data.frame()` then glues the labels and the salaries into a table with one row per person, and `head(pay, 4)` shows you the top of it.

One row per person is the shape every group test on this page expects. If your own payroll lives in a spreadsheet with one column per department, which is how humans usually keep it, nothing here will run until you reshape it into this long form first.

=== step === concept
::eyebrow The numbers behind the boxes
## The averages and the spreads

The boxplot said Engineering is spread out. Now put a number on it.

```r
round(tapply(pay$salary, pay$dept, mean), 0)
#> Engineering       Sales     Support
#>       73475       61825       60925

round(tapply(pay$salary, pay$dept, sd), 0)
#> Engineering       Sales     Support
#>       20517        3188        2754
```

`tapply()` splits `pay$salary` into piles according to `pay$dept`, then runs whatever function you name on each pile, so the first line reads as "average salary, one per department". R prints the three departments in alphabetical order rather than the order you typed them, which is worth noticing now so you do not misread a column later on.

The second line is the **standard deviation**, which is the ordinary distance between one person's salary and their own department's average. Support's 2,754 says a typical Support salary sits under three thousand dollars away from \$60,925. Engineering's 20,517 says a typical Engineering salary sits more than twenty thousand dollars away from \$73,475, which is another way of saying that the average describes almost nobody in that department.

Tests do not work with the standard deviation directly. They work with its square, which is called the **variance**, and squaring is worth watching once on a real number rather than taking on trust.

```r
support_sd <- sd(support)
support_sd
#> [1] 2753.882

support_sd^2
#> [1] 7583864

var(support)
#> [1] 7583864
```

So `var()` is simply the standard deviation squared, and the two lines agree to the last digit. Squaring matters here because it is unkind to big spreads. Engineering scatters about seven times as widely as Support, and squaring turns that seven into the fifty five you are about to see.

```r
spread_var <- tapply(pay$salary, pay$dept, var)
round(spread_var, 0)
#> Engineering       Sales     Support
#>   420962143    10162045     7583864

round(max(spread_var) / min(spread_var), 1)
#> [1] 55.5
```

| Department | People | Average salary | Standard deviation |
|---|---|---|---|
| Support | 12 | \$60,925 | \$2,754 |
| Sales | 12 | \$61,825 | \$3,188 |
| Engineering | 8 | \$73,475 | \$20,517 |

Engineering's variance is fifty five and a half times Support's.

Textbooks often carry a rule of thumb here: if the largest variance is less than about four times the smallest, the classic ANOVA is usually fine. That rule is not worth memorising, and on this payroll it is not needed, because 55.5 is nowhere near 4 and the boxplot said so before any arithmetic happened. Later on you will see why running a formal test of equal spread first is a worse idea than it sounds.

=== step === concept
::eyebrow The heart of it
## Eight engineers cannot pin down an average

An average is a guess about the whole department, made from the people you happened to measure. How good a guess it is depends on two things: how far apart the people are, and how many of them there are.

Let's walk Support through it, one line at a time.

```r
support_n <- length(support)
support_n
#> [1] 12

support_mean <- mean(support)
support_mean
#> [1] 60925

support_se <- sd(support) / sqrt(support_n)
round(support_se, 1)
#> [1] 795
```

That last number, the standard deviation divided by the square root of the head count, is called the **standard error**. It is how far the average of twelve people typically lands from the truth about the department they came from. Notice that both ingredients pull in the directions you would expect: a wider spread makes it bigger, and more people make it smaller.

An interval around the average follows from it.

```r
t_crit <- qt(0.975, support_n - 1)
round(t_crit, 3)
#> [1] 2.201

round(support_mean - t_crit * support_se, 0)
#> [1] 59175

round(support_mean + t_crit * support_se, 0)
#> [1] 62675
```

`qt(0.975, 11)` asks how many standard errors wide you have to go, with twelve people, to cover the middle 95 percent of where an average like this one lands. The answer is 2.201, so Support's average is pinned down to somewhere between \$59,175 and \$62,675. That is a band about three and a half thousand dollars wide.

Now all three departments at once.

```r
grp_n    <- tapply(pay$salary, pay$dept, length)
grp_mean <- tapply(pay$salary, pay$dept, mean)
grp_sd   <- tapply(pay$salary, pay$dept, sd)
grp_se   <- grp_sd / sqrt(grp_n)
t_mult   <- qt(0.975, grp_n - 1)

band <- data.frame(
  dept  = names(grp_n),
  n     = as.vector(grp_n),
  mean  = round(as.vector(grp_mean), 0),
  lower = round(as.vector(grp_mean - t_mult * grp_se), 0),
  upper = round(as.vector(grp_mean + t_mult * grp_se), 0)
)
band$width <- band$upper - band$lower
band
#>          dept  n  mean lower upper width
#> 1 Engineering  8 73475 56322 90628 34306
#> 2       Sales 12 61825 59800 63850  4050
#> 3     Support 12 60925 59175 62675  3500
```

Read the Engineering row slowly. Its average of \$73,475 is pinned down only to somewhere between \$56,322 and \$90,628, a band thirty four thousand dollars wide, because eight people scattered over fifty thousand dollars cannot say much about the department they came from. Support's band is three and a half thousand wide. Sales is four thousand.

Here is the same thing as a picture, each department's average as a dot with its own interval drawn around it.

```r
library(ggplot2)

ggplot(band, aes(x = dept, y = mean)) +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.15) +
  geom_point(size = 3) +
  labs(x = NULL, y = "Average salary, with its own 95 percent interval") +
  theme_minimal(base_size = 13)
```

Press Run and you get three dots, each with a line through it. Two of those lines are short, and the third one is enormous.

A test that treats those three averages as though they were equally well known has already made its mistake, before it computes anything at all.

The rest of this lesson measures how much damage that mistake does, and then repairs it.

=== step === quiz
::eyebrow Check yourself
## Which number is the problem

Meera's three departments came in with standard deviations of \$2,754, \$3,188 and \$20,517, and averages of \$60,925, \$61,825 and \$73,475. She is about to run the classic one-way ANOVA. Which feature of this payroll is the one that breaks it?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- The three department averages are different from each other
- Engineering has only eight people, which is too few to test at all
- The spreads differ by a factor of about 55, and the test she is about to run assumes they are the same ::ok Exactly right. Different averages are the thing being tested, so they cannot also be a problem, and eight people is a small sample rather than a broken assumption. The assumption the classic test actually makes is about spread, and this payroll misses it by a factor of fifty five.
- The three specialist salaries are outliers, so they should be removed before testing ::no All three of those miss the assumption that is in trouble. Different averages are the question, not a fault, since a test with nothing to compare would have no reason to exist. Eight people makes Engineering's average vague, which you saw in that thirty four thousand dollar band, and small samples are allowed. And the specialists are not contamination to be cleaned away, they are half the reason the department exists, so deleting them would not fix the payroll, it would replace Engineering with a different department.

=== step === concept
::eyebrow The machinery
## What the classic ANOVA actually does

The classic one-way ANOVA is a recipe with four moves, and every one of them is something you could do by hand. The "one-way" part just means there is one grouping to compare across, which here is the department somebody works in.

::widget process-flow {"steps":[{"title":"Pool the spreads","sub":"melt every group scatter into one shared number"},{"title":"Measure the gaps","sub":"how far the department averages sit apart"},{"title":"Divide","sub":"gaps over pooled scatter, and that ratio is F"},{"title":"Look F up","sub":"on the curve F follows when nothing differs"}]}

Move one is where today's trouble lives. Before it compares anything, the test takes all three departments' scatter and melts it into a single number, as though there were one company-wide amount of salary wobble that every department shares.

Move two measures how far apart the three averages sit. Move three divides the second by the first, and that ratio is called **F**. A large F means the gaps between the departments are big compared to the wobble inside them. Move four asks how often a ratio that large turns up when the departments are in fact identical.

So here is the assumption in one plain sentence, and it is worth saying out loud because almost nobody ever does.

The classic ANOVA assumes every department scatters by the same amount, and allows only their averages to differ.

Meera's payroll misses that by a factor of fifty five. The next step puts a real number on the shared yardstick it uses instead.

=== step === concept
::eyebrow The pooled yardstick
## One spread for everybody

The pooled spread is not an abstraction. It is a number you can compute in three lines and then hold up against each department.

```r
group_n   <- tapply(pay$salary, pay$dept, length)
group_var <- tapply(pay$salary, pay$dept, var)

pooled_var <- sum((group_n - 1) * group_var) / (sum(group_n) - 3)
round(pooled_var, 0)
#> [1] 108342759

round(sqrt(pooled_var), 0)
#> [1] 10409
```

In symbols, that calculation is

\( s_p^2 = \dfrac{\sum_i (n_i - 1)\, s_i^2}{N - k} \)

where \( n_i \) is how many people are in department \( i \), \( s_i^2 \) is that department's own variance, \( N \) is everybody (32 people here) and \( k \) is the number of departments (3). The top line is a weighted sum of the three variances, and the bottom line is \( 32 - 3 = 29 \).

That bottom number has a name you will meet all day in R output: **degrees of freedom**. In plain words it is how much independent information a comparison has to work with. Thirty two salaries went in, three departmental averages were computed from them, and what is left over for measuring wobble is twenty nine pieces of information rather than thirty two.

Now watch the same numbers turn up in R's own ANOVA table.

```r
summary(aov(salary ~ dept, data = pay))
#>             Df    Sum Sq   Mean Sq F value Pr(>F)
#> dept         2 8.833e+08 441660000   4.077 0.0275 *
#> Residuals   29 3.142e+09 108342759
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The `Residuals` row carries `Df` of 29 and a `Mean Sq` of 108,342,759, which is the pooled variance you just computed by hand. The `F value` of 4.077 is move three of the recipe. And the last column, `Pr(>F)`, is the p-value, the number everybody reads first. Where that number comes from is the next step, because it is the one this lesson spends the rest of its time arguing with.

The pooled standard deviation, \$10,409, is the yardstick every comparison in that table was measured against. Put it beside what each department actually does.

```r
data.frame(
  dept      = names(group_n),
  own_sd    = round(sqrt(as.vector(group_var)), 0),
  pooled_sd = round(sqrt(pooled_var), 0)
)
#>          dept own_sd pooled_sd
#> 1 Engineering  20517     10409
#> 2       Sales   3188     10409
#> 3     Support   2754     10409
```

\$10,409 is roughly four times what Support really scatters by, and about half of what Engineering really scatters by. It fits nobody. It is not really an average of the three either, because squaring handed Engineering's wild eight people most of the vote.

[KEY INSIGHT]
One number is standing in for three very different departments. Support and Sales get charged for wobble they do not have, Engineering gets credited with far less wobble than it really has, and every comparison in the table is then judged against that one wrong yardstick.

=== step === concept
::eyebrow Where the answer comes from
## Where the p-value comes from

Every test in statistics ends the same way. It computes one number from your data, then asks how surprising that number would be in a world where nothing was going on, and it answers by reading an area off a curve.

::widget null-distribution {"tails":1,"start":2.0,"label":"observed statistic"}

Drag the marker to the right and watch the shaded area shrink. That shaded area is the **p-value**: if the departments were genuinely identical and only ordinary randomness separated them, it is how often randomness alone would produce a statistic at least as extreme as yours. A small p-value means randomness would rarely manage it, which makes "they are identical" an uncomfortable position to keep holding.

Two things about that picture are worth flagging. The curve drawn there is the familiar bell you get comparing two groups, whereas an F statistic from three groups follows a differently shaped curve called an F curve. And an F test only ever reads the upper tail, because F is a ratio that can only get large when the gaps grow. The move is identical either way: one area, read off one curve.

Everything rests on that curve being the right one. So here is the exact cutoff the classic test used on Meera's payroll.

```r
qf(0.95, 2, 29)
#> [1] 3.327654
```

The 2 is the number of departments minus one, and the 29 is thirty two salaries minus three departments, which is the same degrees of freedom idea from the previous step used twice over. So the classic test drew a line at 3.33 and said: if F lands above this, that is a result randomness would only produce 5 percent of the time.

Meera's F was 4.077. It cleared the line, which is why her p-value came in under 0.05.

Hold on to 3.33, because that line turns out to be drawn in the wrong place.

=== step === concept
::eyebrow The moment of trouble
## Both tests on the same payroll

R will run the classic version and Welch's version from the same function. One argument decides which.

```r
oneway.test(salary ~ dept, data = pay, var.equal = TRUE)
#>
#> 	One-way analysis of means
#>
#> data:  salary and dept
#> F = 4.0765, num df = 2, denom df = 29, p-value = 0.02753
```

`var.equal = TRUE` is the classic test, the same one `summary(aov(...))` printed a moment ago, and it gives the same F of 4.077 and the same p-value of 0.0275. Read out loud, it says: the departments differ, and a difference this big would show up by chance only about 3 times in 100.

Now change one word.

```r
oneway.test(salary ~ dept, data = pay, var.equal = FALSE)
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  salary and dept
#> F = 1.5956, num df = 2.000, denom df = 14.189, p-value = 0.2371
```

Three things moved. The heading now says "not assuming equal variances". The denominator degrees of freedom stopped being a whole number and came out as 14.189, which we will take apart properly later. And the p-value went from 0.0275 to 0.2371, nearly nine times larger, which flips the answer from "the departments differ" to "this data cannot show that they differ".

It is the same thirty two salaries and the same question. The only thing that changed is one argument.

Now go back and look at the classic output one more time, and notice what is not in it. There is no warning. Nothing is starred as suspicious, no message mentions spread, and the numbers are laid out as neatly as they would be on perfectly behaved data. A person who ran only the first block would email the director "yes, the departments pay differently, p = 0.03" and never learn otherwise.

=== step === quiz
::eyebrow Check yourself
## Which answer would you send Meera

Meera now has two p-values from the same payroll, 0.0275 and 0.2371, and a director waiting on an email. Which one should she send, and why?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The classic one, p = 0.0275, because a smaller p-value is stronger evidence
- Whichever one matches the boxplot, since Engineering obviously pays more
- Neither yet, because this payroll alone cannot show which test keeps its promise when the spreads differ, so they have to be checked somewhere the truth is already known ::ok That is the honest answer. Two tests disagree, and the data they disagree about is the one thing that cannot referee between them, because neither test comes with a label saying which one was right this time. The way out is to build a world where you already know the answer and see which test gets it. That is the next step.
- The average of the two p-values, since the truth is probably somewhere in between ::no Take the first one seriously first, because it is the reading almost everybody has. A smaller p-value does feel like stronger evidence, and usually it is. However, that only holds for a test that is behaving, and a test that fires too easily produces small p-values exactly when it should not, so the smallness is the symptom rather than the evidence. The boxplot is what raised the question in the first place, so it cannot also answer it. And p-values are not quantities you average: two of them are two answers to the same question, not two measurements of one thing.

=== step === concept
::eyebrow The referee
## Build a company where you know the truth

Here is the way out, and it is one of the most useful moves in all of statistics.

You cannot grade a test on real data, because on real data nobody knows the answer. So invent a company where you do know it. Build three departments that genuinely pay exactly the same, give them Meera's group sizes and Meera's spreads, and then run the tests on it. Every time a test announces a difference in that world, it is wrong, and you know it is wrong, because you built the place.

```r
set.seed(1)

fake_salary <- c(rnorm(12, mean = 61000, sd = 2754),
                 rnorm(12, mean = 61000, sd = 3188),
                 rnorm(8,  mean = 61000, sd = 20517))
fake_dept <- rep(c("Support", "Sales", "Engineering"), c(12, 12, 8))

round(tapply(fake_salary, fake_dept, mean), 0)
#> Engineering       Sales     Support
#>       61341       61099       61740
```

`rnorm(12, mean = 61000, sd = 2754)` means "give me twelve salaries, centred on \$61,000, scattering by about \$2,754", and `set.seed(1)` fixes the random numbers so you and I get the same payroll. Every department here was told to pay \$61,000. Look at what came back: \$61,341, \$61,099 and \$61,740.

The averages differ even though the pay does not. That is not a bug, that is what sampling does, and it is exactly the noise a test is supposed to see through.

Now state the promise being graded, because the rest of this hangs on it. A test run at the 5 percent level promises that when nothing is going on, it will announce a difference about 5 times in 100 and stay quiet the other 95. That is not a nice-to-have. It is the entire meaning of the number the test hands back to you.

So build two thousand of those companies and count.

=== step === concept
::eyebrow The measurement
## Count the false alarms

Counting how often something happens is easier than it sounds, because in R a comparison gives you TRUE and FALSE, and the average of TRUE and FALSE is a share.

```r
c(0.02, 0.30, 0.01) < 0.05
#> [1]  TRUE FALSE  TRUE

mean(c(0.02, 0.30, 0.01) < 0.05)
#> [1] 0.6666667
```

Two of those three p-values are below 0.05, and `mean()` reports that as 0.667. That is all the counting is, and the helper below does the same thing on its last line.

Everything else in the helper you have already seen: build a payroll with `rnorm()`, run both tests on it, keep the two p-values, and do it two thousand times. This block takes a few seconds to finish.

```r
reject_rate <- function(sizes, spreads, pay_levels, reps = 2000) {
  dept      <- rep(c("Support", "Sales", "Engineering"), sizes)
  p_classic <- numeric(reps)
  p_welch   <- numeric(reps)

  for (i in seq_len(reps)) {
    salary <- c(rnorm(sizes[1], pay_levels[1], spreads[1]),
                rnorm(sizes[2], pay_levels[2], spreads[2]),
                rnorm(sizes[3], pay_levels[3], spreads[3]))

    p_classic[i] <- oneway.test(salary ~ dept, var.equal = TRUE)$p.value
    p_welch[i]   <- oneway.test(salary ~ dept, var.equal = FALSE)$p.value
  }

  c(classic = mean(p_classic < 0.05), welch = mean(p_welch < 0.05))
}

set.seed(1)
reject_rate(c(12, 12, 8), c(2754, 3188, 20517), c(61000, 61000, 61000))
#> classic   welch
#>  0.1665  0.0490
```

That was two thousand companies in which all three departments paid identically. The classic test announced a difference in 16.65 percent of them, and Welch announced one in 4.90 percent.

Welch kept its promise almost exactly. The classic test broke it by a factor of more than three.

That one is worth reading twice. In a company where nothing whatsoever is going on, the test almost everybody runs cried wolf about one time in six, while telling you each time that it only does so one time in twenty. Bit unsettling right?

=== step === quiz
::eyebrow Check yourself
## What that false alarm rate means

The classic test announced a difference in 16.65 percent of two thousand simulated companies, and Welch did so in 4.90 percent. Every one of those companies was built with all three departments paying \$61,000 on average. What does the classic test's number actually mean?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- In a company where the departments genuinely pay the same, the classic test still announces a difference about 17 times in 100, so roughly one in six of those announcements is simply wrong ::ok Exactly. The rate is a promise about how often the test is wrong when nothing is going on, and this one promised 5 and delivered 17. Notice what that does to Meera's real result: her p-value of 0.0275 came from a test that produces small p-values far too readily on data shaped like hers.
- The classic test is simply more sensitive, so it would also catch smaller real differences
- About 17 percent of those simulated companies really did pay differently
- It means Welch is too conservative and misses real differences that are there ::no The second option is the misconception worth killing off first, so start there. Firing too easily is not sensitivity, it is miscalibration: the test is not seeing more, it is guessing more, and in a moment you will watch the same broken assumption make it too cautious instead. The third option cannot be right by construction, since every one of those companies was built paying \$61,000 across the board, so all 17 in 100 are wrong by definition. And Welch landed on 4.90 against a promise of 5, which is the promise kept rather than a test being timid.

=== step === concept
::eyebrow The reason
## The cutoff was in the wrong place

Why does the classic test fire so often? Its arithmetic is not broken anywhere. The trouble is that the line it measures against was drawn for a world that does not exist here.

Remember the cutoff of 3.33 from a few steps back. It came out of `qf(0.95, 2, 29)`, which says "with 2 and 29 degrees of freedom, 5 percent of F values land above 3.33". That statement is true only if every department scatters by the same amount. So let's find out where F actually lands when they do not.

```r
set.seed(1)
fake_dept <- rep(c("Support", "Sales", "Engineering"), c(12, 12, 8))

classic_F <- replicate(2000, {
  salary <- c(rnorm(12, 61000, 2754),
              rnorm(12, 61000, 3188),
              rnorm(8,  61000, 20517))
  oneway.test(salary ~ fake_dept, var.equal = TRUE)$statistic
})

round(quantile(classic_F, 0.95), 2)
#>  95%
#> 7.51

round(qf(0.95, 2, 29), 2)
#> [1] 3.33

mean(classic_F > qf(0.95, 2, 29))
#> [1] 0.1665
```

`replicate()` is `for` with the bookkeeping removed: run this expression two thousand times and keep what it gives back, which here is the classic F from each simulated company.

Three numbers, one story. On payrolls shaped like Meera's, 5 percent of F values actually land above 7.51. The classic test believed the line was at 3.33. So 16.65 percent of them cleared a line that was supposed to be cleared 5 percent of the time.

The p-value was read off the wrong curve, because the cutoff was computed from an assumption the payroll does not satisfy.

So that is what went wrong. Every number the classic test produced was computed correctly, and it was answering a question about a company Meera does not work for.

=== step === tryit
::eyebrow Your turn
## Move the big spread into the biggest department

So far the noisy department has also been the smallest one: Engineering has the wild spread and only eight people. Let's find out how much that combination mattered.

Keep the same three spreads, 2,754 and 3,188 and 20,517, and keep every department paying \$61,000. Change only the head counts, so that the department carrying the big spread is now the biggest one with twenty people, and the small departments are the tight ones. Then run `reject_rate()` again and compare.

Before you run it, make a guess. Does the classic test get better, get worse, or stay where it was?

```r
# reject_rate() is the helper you built two steps ago, so it is already loaded.
meera_sizes <- c(12, 12, 8)     # the big spread sits in the SMALLEST department
spreads     <- c(2754, 3188, 20517)
same_pay    <- c(61000, 61000, 61000)

# Your turn: same three spreads, but make the noisy department the BIGGEST one.
# Use 8, 12 and 20 people, and 1000 runs is plenty to see the direction.
set.seed(1)
```

::check {"regex":"reject_rate[\\s\\S]*c\\(\\s*8\\s*,\\s*12\\s*,\\s*20","gate":true,"difficulty":"intermediate","ok":"That is the one, and the answer is not what most people guess. The classic test now fires about 2 times in 100 instead of the 5 it promises, so the very same broken assumption that made it too eager on Meera's payroll has made it too cautious here. Welch sat near 5 in both worlds. And a test that misses real differences is the harder failure to catch, because nothing gets reported and nobody comes back to check.","no":"Call the helper with the new head counts, keeping everything else as it is: reject_rate(c(8, 12, 20), spreads, same_pay, reps = 1000). The order inside c(8, 12, 20) matters, because the third slot is the department carrying the spread of 20,517."}

::solution
```r
set.seed(1)
reject_rate(c(8, 12, 20), spreads, same_pay, reps = 1000)
#> classic   welch
#>   0.023   0.058

set.seed(1)
reject_rate(c(12, 12, 8), c(10409, 10409, 10409), same_pay, reps = 1000)
#> classic   welch
#>   0.051   0.052
```

The second call in the solution is worth running too. It gives every department the same spread of \$10,409, which is the pooled number from earlier, and now both tests land essentially on 5 in 100. That is the classic test working exactly as advertised, which it does whenever its assumption is actually true.

So the direction of the error depends on where the big spread sits. Big spread in a small group makes the classic test too eager, big spread in a big group makes it too cautious, and equal spreads make it correct. In every one of those three worlds, Welch stayed near its promise.

The reason sits in the pooling formula from step seven, where each department's variance is weighted by its head count. When the noisy department has only eight people, its wild spread carries little weight in the yardstick underneath, and yet its wandering average carries full weight in the gaps up top. The gap is then measured against a yardstick too short for it, and F comes out too big. Turn it around and give that noisy department twenty people, and now it dominates the yardstick instead: the pooled spread balloons to \$14,853, which is far more scatter than Support or Sales actually have, so their averages look closer together than they really are and F comes out too small.

So one shared number cannot be right for everybody. Which direction it goes wrong in just depends on which department brought the most people along.

=== step === concept
::eyebrow Wider than ANOVA
## Where else this same failure shows up

Here is where you stand after three simulations.

| The company | Classic ANOVA fires | Welch fires |
|---|---|---|
| Meera's shape: 12, 12, 8 people, the big spread in the smallest department | 16.7 times in 100 | 4.9 times in 100 |
| Same spreads, but the noisy department is the biggest: 8, 12, 20 people | 2.3 times in 100 | 5.8 times in 100 |
| Every department equally spread | 5.1 times in 100 | 5.2 times in 100 |

None of this is a quirk of ANOVA. Assuming one shared spread is something a great many methods do, including the ordinary regression line almost everybody fits, and when the assumption fails they all fail in the same characteristic way.

Step away from Meera for a minute, because the dial below is not running her payroll.

::widget assumption-dial {"assumption":"heteroskedasticity","levels":11,"start":0}

It runs the simplest version of the problem, where one number is used to predict another, and at every setting of the dial it runs thousands of complete studies from scratch and reports two things. How often the 95 percent interval actually contains the truth, which should stay near 95. And how good the fit looks, which is the number people put in their slides.

Push the dial and watch which one moves.

The coverage falls away while the fit sits there looking fine. In other words, the part that quantifies your uncertainty breaks first, and the part everybody looks at never mentions it.

That pairing is exactly what happened to Meera. Her classic ANOVA reported an F, a p-value and a tidy table, all of them correctly computed, none of them wrong in any way a reader could see, and the only thing that had quietly broken was how much confidence any of it deserved.

Now back to the payroll, because there is a version of this test that does not do that.

=== step === concept
::eyebrow The repair
## Welch's fix: every department keeps its own spread

Welch's answer is not to patch the pooled number. It is to stop pooling.

Start with the intuition, which you can get from Meera's own payroll. Support has twelve people paid in a tight band, so its average is a sharp, trustworthy number, and it deserves a loud voice in any comparison. Engineering has eight people scattered over fifty thousand dollars, so its average is a vague number that could easily have come out ten thousand dollars either side, and it deserves a quiet one.

So give every department a weight that says how precisely its own average is known:

\( w_i = \dfrac{n_i}{s_i^2} \)

where \( n_i \) is how many people are in department \( i \) and \( s_i^2 \) is that department's own variance. More people push the weight up, and a bigger spread pushes it down, which is the standard error from earlier turned upside down.

Those weights then do all the work. The centre point every department is compared against is a weighted average rather than a plain one:

\( \tilde{y} = \dfrac{\sum_i w_i \bar{y}_i}{\sum_i w_i} \)

where \( \bar{y}_i \) is department \( i \)'s own average salary, and \( \tilde{y} \) (read as "y tilde") is the weighted grand average of the whole company.

And Welch's F measures how far the departments sit from that centre, again weighted, with one correction term underneath:

\( F_W = \dfrac{\frac{1}{k-1} \sum_i w_i (\bar{y}_i - \tilde{y})^2}{1 + \frac{2(k-2)}{k^2-1}\Lambda} \)

with

\( \Lambda = \sum_i \dfrac{(1 - w_i/\sum_j w_j)^2}{n_i - 1} \)

Here \( k \) is the number of departments and \( \Lambda \) (the Greek capital lambda) is a single number that measures how lopsided the weights are, built from each department's share of the total weight and its head count. If the three departments had equal spreads and equal sizes, the shares would be equal, \( \Lambda \) would be small, and the correction underneath would be close to 1.

That is four formulas in a row, which is more symbols than this lesson has used so far. The next two steps put Meera's real numbers into every one of them, so none of it stays abstract.

=== step === concept
::eyebrow The weights, on real numbers
## The weights on Meera's three departments

`group_n` and `group_var` are the head counts and variances you computed earlier, so the weights are one division.

```r
group_w <- group_n / group_var

weights <- data.frame(
  dept     = names(group_n),
  n        = as.vector(group_n),
  variance = round(as.vector(group_var), 0),
  weight   = signif(as.vector(group_w), 3),
  share    = round(100 * as.vector(group_w) / sum(group_w), 2)
)
weights
#>          dept  n  variance   weight share
#> 1 Engineering  8 420962143 1.90e-08  0.68
#> 2       Sales 12  10162045 1.18e-06 42.44
#> 3     Support 12   7583864 1.58e-06 56.87
```

The weights themselves are tiny numbers because they are head counts divided by variances measured in squared dollars, so read the last column instead. It is each department's share of the total weight, in percent.

Support gets 56.87 percent of the say, Sales gets 42.44 percent, and Engineering gets 0.68 percent.

So a whole department, eight real people, ends up with less than one percent of the say. That sounds brutal, right? It sounds a good deal less brutal once you remember step four, where Engineering's average was pinned down only to somewhere between \$56,322 and \$90,628. A number that vague cannot carry an argument, and Welch is the one test on this page that takes that seriously.

So the wide interval and the tiny weight are the same fact arriving from two directions: eight people scattered over fifty thousand dollars do not tell you much.

Now the centre point.

```r
group_mean <- tapply(pay$salary, pay$dept, mean)

grand <- sum(group_w * group_mean) / sum(group_w)
round(grand, 0)
#> [1] 61393

round(mean(group_mean), 0)
#> [1] 65408
```

The weighted centre is \$61,393, sitting right between Support and Sales where almost all the weight is. The plain average of the three departmental averages is \$65,408, dragged upward by Engineering's vague \$73,475. Welch does not let that happen, because the number doing the dragging is the one it trusts least.

And now Welch's F, assembled by hand from the formulas in the last step.

```r
k <- 3

between <- sum(group_w * (group_mean - grand)^2) / (k - 1)
round(between, 4)
#> [1] 1.6705

lambda <- sum((1 - group_w / sum(group_w))^2 / (group_n - 1))
round(lambda, 4)
#> [1] 0.1879

correction <- 1 + (2 * (k - 2) / (k^2 - 1)) * lambda
round(correction, 4)
#> [1] 1.047

round(between / correction, 4)
#> [1] 1.5956

round(oneway.test(salary ~ dept, data = pay, var.equal = FALSE)$statistic, 4)
#>      F
#> 1.5956
```

1.5956 by hand, 1.5956 from R. The two agree to four decimals. So `oneway.test()` is not a black box at all, it is the formulas from the last step run for you.

=== step === concept
::eyebrow The price of honesty
## Degrees of freedom that are not a whole number

There is a second half to Welch's repair, and it is the odd number that showed up in the output: `denom df = 14.189`.

Degrees of freedom, from earlier, is how much independent information a comparison has to work with. The classic test claimed 29 of them, which is thirty two salaries minus three departments. Welch says that number is a fantasy on this payroll, because most of those thirty two salaries are in departments whose contribution has been weighted down to almost nothing.

So it computes its own, using the same \( \Lambda \) that appeared in the F formula:

\( \text{df}_2 = \dfrac{k^2 - 1}{3\Lambda} \)

This is called the Satterthwaite correction, after the statistician who worked it out. `lambda` is still sitting in your session from the last step, so this is two lines.

```r
df2 <- (k^2 - 1) / (3 * lambda)
round(df2, 4)
#> [1] 14.1892

oneway.test(salary ~ dept, data = pay, var.equal = FALSE)$parameter
#>   num df denom df
#>  2.00000 14.18921
```

14.1892 by hand, 14.18921 from R. It comes out fractional because it is not a count of anything, it is an amount of usable information, and there is no reason for that to land on a whole number.

Read it as a sentence and it is quite a statement: Meera has thirty two salaries, and the test is proceeding as though it had about fourteen. Most of the information she thought she had was eaten by Engineering's spread.

That is the price, and it is worth being clear that it is a price. Fewer degrees of freedom means a wider curve, a higher cutoff and a bigger p-value. So Welch is not being pessimistic for the sake of it. It is only counting the information Meera really had, which was never thirty two salaries worth.

=== step === quiz
::eyebrow Check yourself
## Reading 14.19

Meera's Welch output says `denom df = 14.189`, while the classic test said 29. A colleague looks at 14.189 and says it must be a mistake. What is the right reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- R made a rounding error somewhere and it should read 14
- The test is working with far less usable information than 32 salaries suggests, because the noisiest department contributes very little, and the fraction is simply what the correction produces ::ok Exactly. It is a measure of usable information rather than a count of people, so there is no reason for it to be whole. The practical reading is the one that matters: 14 where the classic test claimed 29 means about half the information Meera hoped for was eaten by Engineering's spread.
- Eighteen salaries were dropped from the analysis
- Degrees of freedom have to be whole numbers, so the result cannot be reported as it stands ::no None of those three describe what happened. Nothing was rounded, and you can check that yourself, because the hand calculation in the previous step landed on 14.1892 independently of R. Nothing was dropped either: all thirty two salaries are in the calculation, and every one of them contributed to its own department's average and spread. And a fractional df is reported exactly as it comes out, to two decimals, which is what the reporting step later on does.

=== step === tryit
::eyebrow Your turn
## Meera hires four more engineers

Six months on, Meera's company hires four more engineers on ordinary salaries: \$60,500, \$58,300, \$62,400 and \$56,900. The three specialists are still there and still on \$86,000, \$97,000 and \$108,000, so Engineering is still a wildly spread out department. It just has twelve people in it now instead of eight.

Run both tests on the new payroll and see how far each one moves.

```r
pay2 <- rbind(pay,
              data.frame(dept = "Engineering",
                         salary = c(60500, 58300, 62400, 56900)))

table(pay2$dept)

round(tapply(pay2$salary, pay2$dept, sd), 0)

# Your turn: run the classic test and then the Welch test on pay2.
```

::check {"regex":"oneway\\.test[\\s\\S]*var\\.equal\\s*=\\s*FALSE","gate":true,"difficulty":"intermediate","ok":"Good. The classic p-value moved a long way, from 0.0275 to 0.1496, while Welch barely moved at all, from 0.2371 to 0.2987. The spreads are still wildly unequal after those hires, so what changed is not the spreads. It is that the three departments now have twelve people each, and equal group sizes are what cushion the classic test against unequal spread. The denominator df also climbed from 14.19 to 19.60, because four more ordinary engineers is real information.","no":"You need both calls on the new frame: oneway.test(salary ~ dept, data = pay2, var.equal = TRUE) and then oneway.test(salary ~ dept, data = pay2, var.equal = FALSE). Note that the data argument is pay2, not pay."}

::solution
```r
oneway.test(salary ~ dept, data = pay2, var.equal = TRUE)
#>
#> 	One-way analysis of means
#>
#> data:  salary and dept
#> F = 2.0135, num df = 2, denom df = 33, p-value = 0.1496

oneway.test(salary ~ dept, data = pay2, var.equal = FALSE)
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  salary and dept
#> F = 1.2858, num df = 2.000, denom df = 19.595, p-value = 0.2987
```

Notice what did not change. Engineering's standard deviation is still 17,795 against Support's 2,754, so the spreads are as unequal as they ever were. What changed is the balance of head counts, and that alone pulled the classic answer most of the way towards Welch's.

This is the point almost every guide skips. Equal group sizes, not equal spreads, are what rescue the classic test. If your groups are the same size, unequal spread does much less damage, and if they are not, the damage depends on whether the noisy group is the small one.

=== step === concept
::eyebrow The honest trade
## What Welch costs when the spreads really are equal

A fair question at this point: if Welch keeps its promise in every world we have tried, why is the classic test the one everybody is taught first? What does Welch cost?

The cost is called **power**, which is how often a test catches a difference that genuinely is there. So let's go and measure what Welch gives up.

Build a version of Meera's company where Engineering really does pay more, \$65,000 against \$61,000 for the other two, and where every department has the same tight spread of \$3,000. That \$3,000 is not arbitrary: it is roughly what Support and Sales actually scatter by, so this is Meera's company with Engineering's noise removed.

```r
set.seed(1)
reject_rate(c(12, 12, 12), c(3000, 3000, 3000), c(61000, 61000, 65000))
#> classic   welch
#>  0.9075  0.8910

set.seed(1)
reject_rate(c(12, 12, 8), c(3000, 3000, 3000), c(61000, 61000, 65000))
#> classic   welch
#>   0.791   0.754
```

Every department really is different now, so these are not false alarms any more. They are catches, and higher is better.

| The company | Classic ANOVA catches it | Welch catches it |
|---|---|---|
| Equal spreads, 12 people each | 90.8 times in 100 | 89.1 times in 100 |
| Equal spreads, 12, 12 and 8 people | 79.1 times in 100 | 75.4 times in 100 |

So Welch costs between one and four catches in a hundred, in the world the classic test was designed for and where it is at its absolute best.

Put the two halves of the trade side by side. Using Welch when the spreads are equal costs a couple of points of power. Using the classic test when they are not turns a promised 5 percent false alarm rate into 17 percent, or into 2 percent in the other direction, and gives you no warning either way.

That is the case a good number of statisticians make for running Welch every time, and it is an argument from measurement rather than from taste. The cost is real, but it is small, and what you get back is a test that keeps its promise whatever the spreads turn out to be.

=== step === concept
::eyebrow The tempting shortcut
## Should you test for equal spread first?

Here is where almost everybody goes next, and it feels rigorous. There are formal tests of whether groups have equal spread, so why not run one, and then pick the classic test or Welch depending on what it says?

R has two of them.

```r
bartlett.test(salary ~ dept, data = pay)
#>
#> 	Bartlett test of homogeneity of variances
#>
#> data:  salary by dept
#> Bartlett's K-squared = 43.672, df = 2, p-value = 3.286e-10

suppressMessages(library(car))

leveneTest(salary ~ factor(dept), data = pay)
#> Levene's Test for Homogeneity of Variance (center = median)
#>       Df F value   Pr(>F)
#> group  2  6.8138 0.003752 **
#>       29
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Bartlett's test measures how far each department's spread sits from a common value by squaring deviations from the mean, which makes it powerful but jumpy when the data is not a neat bell shape. Levene's test uses distances from the median instead, which makes it steadier on messy data. On Meera's payroll both come back tiny, 3.3e-10 and 0.004, so both agree the spreads differ, which the boxplot had already made obvious.

The problem is not these tests. It is using them as a gate, and there are two reasons it does not work.

The first is what a large p-value from Bartlett actually means. It does not mean the spreads are equal. It means this much data could not tell them apart, and those are very different statements. With only a dozen people in a department, a real difference in spread can slip past unnoticed quite easily.

The second reason is worse, because the two weaknesses line up. The pre-test is at its weakest when the samples are small, and small samples are where unequal spread does the classic test the most damage. So the gate tends to wave you through in the very situation where it should have stopped you.

And there is nothing left for the gate to buy, which is the part that settles it. Welch costs one to four points of power when the spreads are equal, so the best possible outcome from a correct pre-test is a couple of points of power, while the cost of a wrong one is a test that fires three times too often.

[KEY INSIGHT]
Choosing your test by first testing your data means the test you finally run no longer has the 5 percent false alarm rate printed on either of them, because which one you ran was itself decided by the data. Look at the boxplot, and use Welch.

=== step === quiz
::eyebrow Check yourself
## What Bartlett's p-value does and does not settle

A colleague runs Bartlett's test on a different company, with nine people in each of three departments, and gets p = 0.31. He concludes that the spreads are equal and runs the classic ANOVA. What is the honest reading of his p = 0.31?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The spreads are equal, so the classic test is the right one to run
- The three department averages are equal
- This data was not able to show a difference in spread, which is weakest exactly when the samples are small, so it is a poor gate for choosing a test ::ok That is it. Failing to detect something is not the same as it not being there, and with nine people per department Bartlett's test would miss quite a large difference in spread. Meanwhile the classic ANOVA is at its most fragile at exactly that sample size, so the gate opens widest precisely when it should not.
- The sample is too small for any test to be trusted ::no Each of those goes wrong in its own way. Not detecting a difference is not evidence that there is none, which is the whole point of the previous option. Bartlett's test says nothing whatsoever about averages, since it only ever looks at spread, so the second option is answering a different question entirely. And a small sample is not a reason to give up, it is a reason to prefer Welch, which is exactly where small samples make the classic test least trustworthy.

=== step === concept
::eyebrow After the omnibus test
## Comparing the departments one pair at a time

Welch's ANOVA answers one question: is there a difference somewhere among the three departments? It never says where. A test that works like that is called an **omnibus** test, and you will see that word in R's help pages. If the answer is yes, the natural next move is to compare the departments two at a time, and that brings up a second problem you should know about before you run anything.

::widget multiplicity-sim {"kMax":10,"kStart":3,"alpha":0.05,"corrections":["none","holm","bonferroni"]}

Slide the number of questions upwards with the correction switched off, and watch the false alarm share climb. Each individual comparison is honest at 5 percent, but asking three of them means three chances to be unlucky, so the chance of at least one false alarm across the set is well above 5 percent. Now switch on Holm or Bonferroni and watch it collapse back to where it should be.

For Meera's three departments that means three comparisons, each with its own spread rather than a pooled one, and an adjustment for having asked three questions.

```r
pairwise.t.test(pay$salary, pay$dept,
                p.adjust.method = "holm", pool.sd = FALSE)
#>
#> 	Pairwise comparisons using t tests with non-pooled SD
#>
#> data:  pay$salary and pay$dept
#>
#>         Engineering Sales
#> Sales   0.38        -
#> Support 0.38        0.47
#>
#> P value adjustment method: holm
```

Two arguments carry the meaning. `pool.sd = FALSE` tells R to give each pair its own spread instead of one shared number, which is Welch's idea applied to two groups at a time, and it is the argument most people forget. `p.adjust.method = "holm"` corrects for asking three questions, and Holm is a good default because it is never worse than Bonferroni and usually a little kinder.

None of the three pairs comes back below 0.05, which is consistent with the Welch result rather than a surprise after it. Meera cannot establish a difference between any two departments.

The textbook version of this comparison is the Games-Howell test, which does the same thing more formally, pairing Welch-style standard errors with a Tukey-style adjustment. It lives in the `rstatix` package as `games_howell_test()`. The base R route above needs no extra package and carries the same idea, which is why it is what runs on this page.

=== step === concept
::eyebrow Writing it up
## How to report a Welch result

A p-value on its own is not a report, and a director who reads only "p = 0.24" cannot check anything. Build the sentence from the fitted object so it cannot drift from the numbers.

```r
fit <- oneway.test(salary ~ dept, data = pay, var.equal = FALSE)

sprintf("Welch F(%.0f, %.2f) = %.2f, p = %.3f",
        fit$parameter[1], fit$parameter[2], fit$statistic, fit$p.value)
#> [1] "Welch F(2, 14.19) = 1.60, p = 0.237"
```

`sprintf()` slots numbers into a template: `%.0f` means no decimals, `%.2f` means two, and `%.3f` means three. Pulling them out of `fit` rather than typing them means that if the data changes, the sentence changes with it.

Then put the group numbers beside it, because the reader cannot judge the result without them.

| Department | People | Average | Standard deviation | 95 percent interval for the average |
|---|---|---|---|---|
| Support | 12 | \$60,925 | \$2,754 | \$59,175 to \$62,675 |
| Sales | 12 | \$61,825 | \$3,188 | \$59,800 to \$63,850 |
| Engineering | 8 | \$73,475 | \$20,517 | \$56,322 to \$90,628 |

Here is what Meera actually sends:

> Average salaries were \$60,925 in Support (12 people, sd \$2,754), \$61,825 in Sales (12 people, sd \$3,188) and \$73,475 in Engineering (8 people, sd \$20,517). Because the departments differ enormously in spread, with Engineering's variance about 55 times Support's, we used Welch's ANOVA rather than the classic one. It does not show a difference in average pay: Welch F(2, 14.19) = 1.60, p = 0.237. Engineering's average is the least certain of the three, pinned down only to somewhere between \$56,322 and \$90,628, because it combines five junior engineers with three specialists.

[WARNING]
Report the denominator df exactly as R produces it, to two decimals. Rounding 14.19 to 14 quietly claims a precision the test did not have, and it hides the single most informative number in the output: that thirty two salaries behaved like about fourteen.

=== step === tryit
::eyebrow Your turn
## Ozone by month

Time to leave Meera's payroll and carry the whole routine to data you did not build. `airquality` ships with R and holds daily air quality readings from New York in 1973, and the question is whether ozone levels differ across the five months.

This one is the unequal-everything case. June has only 9 usable readings while September has 29, and the monthly standard deviations run from 18.2 all the way to 39.7. So both the group sizes and the spreads are unequal, which is exactly the situation this whole lesson has been about.

Run three things, in this order: the classic test, then the Welch test, then the pairwise comparison with each pair keeping its own spread.

```r
aq <- airquality[!is.na(airquality$Ozone), c("Ozone", "Month")]
aq$month <- factor(aq$Month, labels = c("May", "June", "July", "August", "September"))

data.frame(
  month = levels(aq$month),
  n     = as.vector(tapply(aq$Ozone, aq$month, length)),
  mean  = round(as.vector(tapply(aq$Ozone, aq$month, mean)), 1),
  sd    = round(as.vector(tapply(aq$Ozone, aq$month, sd)), 1)
)

# Your turn: the classic test, then Welch, then pairwise.t.test with pool.sd = FALSE.
```

::check {"regex":"oneway\\.test[\\s\\S]*var\\.equal\\s*=\\s*FALSE[\\s\\S]*pool\\.sd\\s*=\\s*FALSE","gate":true,"difficulty":"advanced","ok":"All three, in the right order. Here both tests agree that the months differ, and the p-values are tiny either way, so this is a case where it made no practical difference. Be careful with the conclusion though: agreeing after the fact is not a reason to have used the classic test, because you could not have known they would agree until you ran both. Notice also that the denominator df fell from 111 to 42.7, which is the same honesty tax Meera paid, and the pairwise result says the summer months are the ones that stand apart.","no":"Three calls are needed: oneway.test(Ozone ~ month, data = aq, var.equal = TRUE), then the same with var.equal = FALSE, then pairwise.t.test(aq$Ozone, aq$month, p.adjust.method = \"holm\", pool.sd = FALSE)."}

::solution
```r
oneway.test(Ozone ~ month, data = aq, var.equal = TRUE)
#>
#> 	One-way analysis of means
#>
#> data:  Ozone and month
#> F = 8.5356, num df = 4, denom df = 111, p-value = 4.827e-06

oneway.test(Ozone ~ month, data = aq, var.equal = FALSE)
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  Ozone and month
#> F = 8.0267, num df = 4.000, denom df = 42.668, p-value = 6.439e-05

pairwise.t.test(aq$Ozone, aq$month, p.adjust.method = "holm", pool.sd = FALSE)
#>
#> 	Pairwise comparisons using t tests with non-pooled SD
#>
#> data:  aq$Ozone and aq$month
#>
#>           May     June    July    August
#> June      1.00000 -       -       -
#> July      0.00026 0.01527 -       -
#> August    0.00195 0.02135 1.00000 -
#> September 0.86321 1.00000 0.00589 0.01721
#>
#> P value adjustment method: holm
```

July and August stand well apart from May and June, and they cannot be told apart from each other. That is a New York summer turning up in the numbers, and working out which pairs differ is exactly what a pairwise table is for.

=== step === concept
::eyebrow Honesty
## What Welch does not fix

Welch fixes one specific problem: groups that scatter by different amounts. Real pay data usually has a second problem sitting on top of it, and it is worth knowing where the protection runs out.

Salaries are not symmetric. Most people cluster in a band, and a few earn a great deal more, so the picture has a long tail stretching to the right rather than a neat bell shape.

::widget transform-shaper {}

That widget shows a generic right-skewed sample, not Meera's payroll, and lets you watch what a log or a square root does to that long tail. Both pull the far values in and make the shape closer to symmetric.

Now build a company with skew in it and measure. `rlnorm()` draws numbers whose logarithm is a bell curve, which is the standard way to make a right-skewed quantity, and the `tail` argument below controls how long the tail is. The subtraction inside is a correction that keeps the average where you asked for it rather than letting the tail drag it upwards.

```r
skewed_pay <- function(n, mean_pay, tail) {
  rlnorm(n, meanlog = log(mean_pay) - tail^2 / 2, sdlog = tail)
}

set.seed(1)
one_dept <- skewed_pay(100000, 61000, 0.8)

round(mean(one_dept), 0)
#> [1] 60985

round(median(one_dept), 0)
#> [1] 44323
```

A hundred thousand people were asked for an average of \$61,000 and delivered \$60,985, so the correction does exactly what it claims. The median tells you the shape: the typical person there earns \$44,323 while the average is \$61,000, which is exactly what a long right tail does to a payroll.

Now run three tests on companies built that way, where all three departments pay \$61,000 on average, the two tight departments have short tails and the third has a long one. Kruskal-Wallis joins in, because it is the rank-based test people reach for whenever data looks non-normal.

```r
set.seed(1)

skew_sizes <- c(12, 12, 8)
skew_tails <- c(0.05, 0.06, 0.80)
skew_dept  <- rep(c("Support", "Sales", "Engineering"), skew_sizes)
reps       <- 2000

p_classic <- numeric(reps)
p_welch   <- numeric(reps)
p_rank    <- numeric(reps)

for (i in seq_len(reps)) {
  salary <- c(skewed_pay(skew_sizes[1], 61000, skew_tails[1]),
              skewed_pay(skew_sizes[2], 61000, skew_tails[2]),
              skewed_pay(skew_sizes[3], 61000, skew_tails[3]))

  p_classic[i] <- oneway.test(salary ~ skew_dept, var.equal = TRUE)$p.value
  p_welch[i]   <- oneway.test(salary ~ skew_dept, var.equal = FALSE)$p.value
  p_rank[i]    <- kruskal.test(salary ~ factor(skew_dept))$p.value
}

c(classic = mean(p_classic < 0.05),
  welch   = mean(p_welch < 0.05),
  rank    = mean(p_rank < 0.05))
#> classic   welch    rank
#>  0.2485  0.1190  0.2180
```

Welch went from 4.9 false alarms in 100 to 11.9. That is still far better than the classic test's 24.9, and it is still broken.

Now look at the rank test. Kruskal-Wallis fired 21.8 times in 100, nearly as often as the classic ANOVA, and this is the exact situation people recommend it for. Not what you would expect right?

Now, be careful about what caused that, because the honest claim is narrower than it looks. A department with a long tail is also a department with a huge spread, so this world has skew and unequal spread together, which is what a real payroll looks like. Skew on its own is a different matter.

```r
set.seed(1)
runs <- 1000

equal_classic <- numeric(runs)
equal_welch   <- numeric(runs)
equal_rank    <- numeric(runs)

for (i in seq_len(runs)) {
  salary <- c(skewed_pay(12, 61000, 0.80),
              skewed_pay(12, 61000, 0.80),
              skewed_pay(8,  61000, 0.80))

  equal_classic[i] <- oneway.test(salary ~ skew_dept, var.equal = TRUE)$p.value
  equal_welch[i]   <- oneway.test(salary ~ skew_dept, var.equal = FALSE)$p.value
  equal_rank[i]    <- kruskal.test(salary ~ factor(skew_dept))$p.value
}

c(classic = mean(equal_classic < 0.05),
  welch   = mean(equal_welch < 0.05),
  rank    = mean(equal_rank < 0.05))
#> classic   welch    rank
#>   0.034   0.043   0.047
```

There every department is equally skewed, and all three tests sit near their promised 5 in 100. So skew by itself does not break Welch. What breaks it is skew arriving on top of unequal spread, in small groups.

And there is a deeper reason the rank test is not the escape hatch. Kruskal-Wallis does not compare averages at all. It compares whether one department's salaries tend to sit higher in the combined ranking, which is a genuinely different question, so it cannot be the cure for a problem about averages and spreads. Part 3 of this course takes that question apart properly.

=== step === concept
::eyebrow The obvious next idea
## Would a log fix it?

If the trouble is a long right tail, the standard move is to work on a log scale, and pay is one of the few quantities where that is not a trick but the natural way to think. Let's try it on Meera's real payroll.

```r
round(tapply(log(pay$salary), pay$dept, sd), 3)
#> Engineering       Sales     Support
#>       0.264       0.052       0.045

oneway.test(log(salary) ~ dept, data = pay, var.equal = FALSE)
#>
#> 	One-way analysis of means (not assuming equal variances)
#>
#> data:  log(salary) and dept
#> F = 1.4805, num df = 2.000, denom df = 14.265, p-value = 0.2605
```

Two things happened, and they are worth separating.

What improved is the shape. A log pulls that long right tail in and leaves something much closer to symmetric, which is the exact condition Welch was drifting under in the last step.

What did not improve is the inequality. On the log scale the spreads are 0.045, 0.052 and 0.264, so Engineering is still about five times wider than Support. A log fixes the shape and leaves the inequality exactly where it was, which means Welch is still the right call here and the classic test is still the wrong one.

There is a third thing that changed quietly, and it deserves saying out loud rather than smuggling past you. On a log scale you are no longer comparing dollar differences, you are comparing percentage differences. "Engineering pays 20 percent more" is a different claim from "Engineering pays \$12,000 more", and for salaries the percentage version is often the more sensible question anyway. Just make sure it is the question you meant to ask.

=== step === quiz
::eyebrow Check yourself
## Where Welch still drifts

In the skewed simulation, where all three departments paid \$61,000 on average, the classic test fired 24.9 times in 100, Welch fired 11.9 and Kruskal-Wallis fired 21.8. What is the right conclusion?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- Kruskal-Wallis is the correct fix for unequal spread
- Welch still drifts above its promised rate when the pay is heavily skewed and the groups are small, and Kruskal-Wallis does not rescue it because it answers a different question ::ok Exactly right, and both halves matter. Welch fixes unequal spread rather than every possible problem, so a long tail on top of it still costs you. And the rank test compares whether one department's salaries sit higher in the combined ranking, not whether the averages differ, so reaching for it here swaps the question rather than fixing the answer.
- Welch is exact whatever the data looks like, since it makes no assumptions at all
- The fix is to delete the specialists as outliers ::no All three miss something. Kruskal-Wallis fired 21.8 times in 100 in that very simulation, so calling it the fix contradicts the number on the page. Welch assumes less than the classic test but not nothing: it still expects each group to be roughly bell shaped, which is exactly what fails when the tail gets long. And deleting the specialists does not repair Engineering, it deletes half of what Engineering is, and you would be reporting on a department that does not exist.

=== step === concept
::eyebrow Back to the payroll
## What Meera should actually do

So Meera has run everything, and the answer is that she cannot establish a difference. That is not a dead end. It is a real finding, and it points at five things she can actually do.

- **Wait for more engineers, or hire them.** You saw exactly what that does. Four ordinary hires took the classic p-value from 0.0275 to 0.1496 and lifted the usable information from about 14 to about 20. More people in the noisy department is the only thing that buys certainty here.
- **Split Engineering into two.** Five juniors and three specialists are two different jobs at two different pay levels sitting in one column, and calling their combination "the Engineering average" is what created the wide interval in the first place. Two smaller groups that each mean something are worth more than one that means very little.
- **Compare on the log scale.** If what the director means is "does Engineering pay more in percentage terms", the log comparison from the previous step is the right question, and it is often what people mean about pay anyway.
- **Report the three intervals and stop testing.** \$59,175 to \$62,675 for Support, \$59,800 to \$63,850 for Sales, and \$56,322 to \$90,628 for Engineering. Those three lines tell the director more than any p-value, because the third one shows the uncertainty rather than hiding it inside a test.
- **Compare medians instead.** If "pay" to the director means what a typical person earns rather than the arithmetic average, the median is the honest summary, and comparing medians is a different tool for a different question.

Here is the harder thing to say, and it matters more than any of the arithmetic above. "Is the difference real?" was arguably the wrong question to ask about a department that holds two kinds of job. If the question itself is muddled, no test will unmuddle it, and learning to notice that will take you further than any amount of practice with `oneway.test()`.

=== step === concept
::eyebrow The routine
## The four steps to carry away

Strip away Meera's payroll and this is what is left.

::widget process-flow {"steps":[{"title":"Look at the spreads","sub":"sds and the variance ratio, before any test"},{"title":"Use Welch by default","sub":"oneway.test(y ~ g, var.equal = FALSE)"},{"title":"Follow up without pooling","sub":"pairwise.t.test with pool.sd = FALSE"},{"title":"Report the fractional df","sub":"F, both df, p, plus n, mean and sd per group"}]}

Step one costs you one line of `tapply()` and a boxplot, and it is where you would have caught Meera's payroll before running anything at all.

Step two is the default worth adopting. It costs one to four catches in a hundred when the spreads really are equal, and it protects you from a threefold inflation in false alarms when they are not. That trade is why so many statisticians argue Welch should simply be what `oneway.test()` does unless you ask otherwise.

With only two groups the same idea has a name you already use. R's `t.test()` runs the Welch version by default, which is why it too reports fractional degrees of freedom, and part 1 of this course mentioned that in passing. Now you know what those decimals were paying for.

Step three matters because the pooling problem does not disappear once you move to pairs. `pool.sd = FALSE` is the argument people forget, and forgetting it puts the pooled spread back into the very comparison you switched to Welch to avoid.

Step four is what makes your work checkable. The fractional degrees of freedom is not a blemish to be tidied away, it is the most informative number in the output, and it tells your reader how much information you really had.

=== step === concept
::eyebrow Go deeper
## References

Four sources sit behind everything on this page, and each one is worth the time.

- [Welch (1951), on the comparison of several mean values](https://doi.org/10.2307/2332579) - the original paper, and the source of the weights and the degrees of freedom correction you rebuilt by hand earlier on this page.
- [Delacre, Leys, Mora and Lakens (2019), arguments for Welch's F-test instead of the classical F-test](https://doi.org/10.5334/irsp.198) - the modern case for using Welch by default, with the simulations that the false alarm counts on this page reproduce in miniature.
- [Zimmerman (2004), a note on preliminary tests of equality of variances](https://doi.org/10.1348/000711004849222) - why choosing your test by first testing your data makes things worse rather than better, which is the argument behind the Bartlett step.
- [R documentation for oneway.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html) - the exact definition R implements, including the Satterthwaite correction that the hand computation matched to four decimals.

=== step === complete
## Part 2 complete

You started where Meera did: three departments, three averages, and a director wanting a yes or no. The classic ANOVA gave her p = 0.0275 and a difference to report. Welch gave her p = 0.2371 and nothing to report, from the same thirty two salaries.

You now know which one to believe and, more importantly, why. The classic test melts every department's spread into one number, \$10,409, which was four times too big for Support and half of what Engineering deserved, and then it measures every gap against that. In a company where all three departments genuinely paid the same, that mistake made it raise a false alarm 17 times in 100 while promising 5. Welch keeps each department's own spread and gives each one a weight of \( n_i / s_i^2 \). The price of doing that is fractional degrees of freedom: 14.19 where the classic test claimed 29.

You also picked up the parts most guides skip. Unequal spread is not always a safe error, and moving the big spread into the biggest department flipped it from too eager to too cautious. Equal group sizes, not equal spreads, are what cushion the classic test. Pre-testing with Bartlett or Levene is a worse gate than simply using Welch. And pairwise follow-ups need `pool.sd = FALSE`, or you have quietly pooled again.

Meera's answer, in one sentence: with eight engineers spread over fifty thousand dollars, a difference in average pay is not established, and that is a finding rather than a failure.

There is one question we have not settled yet. When Welch drifted under heavy skew, Kruskal-Wallis raised a false alarm 21.8 times in 100, so it is not the fix that many people expect it to be, and the reason is that ranks answer a different question. Part 3 takes that question apart on the two-group version, the Mann-Whitney test, where it can be stated properly. The three-group version comes later in this course, once the logic underneath it is solid.
