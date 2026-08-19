---
title: "Which statistical test to use? A 5-question decision flowchart"
description: "Answer five plain questions about your data and the right statistical test names itself. Three coffee shop branches, one flowchart, real R code you run."
keywords: "which statistical test to use, choosing a statistical test, statistical test flowchart, t-test or ANOVA, Kruskal-Wallis in R, paired vs independent, normality check in R"
mathjax: false
webr: true
post_type: "LESSON"
curriculum_id: "0.0.8"
course_id: "which-test"
course_title: "Which Test Do I Run?"
course_lesson: "1"
course_total: "11"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
lesson_access: "windowed"
catalog_blurb: "Five plain questions about your data that name the right test."
date: "2026-08-19"
---

=== step === cover

## Which statistical test to use? A 5-question decision flowchart

You have the average order values from three branches of a coffee shop, and
someone asks the obvious question. Is the difference real? Does one branch
actually do better than the others?

And you freeze.

Not because the maths is hard. You freeze because you know there are a dozen
tests you could run, and you are not sure which one this exact situation
needs. A t-test? ANOVA? Chi-square? One of the ones with two surnames in it?

Here is the way out. Stop shopping for test names. Describe your data
instead, and the test falls out on its own.

::widget tree-diagram {"root": "Outcome a number?", "l": "Two groups?", "r": "Small counts?", "leaves": ["t test", "ANOVA", "Fisher exact", "chi-square"]}

Five plain questions. What are you measuring. How many groups. Are the groups
linked. What shape is the spread. Then read the answer off the map.

We are going to build that map one question at a time, on one Saturday's worth
of coffee shop tickets. By the end, the same numbers that a popular test calls
a dead heat will turn out to hide a clear difference, and you will know why.

=== step === concept

## Why does the freeze happen?

::prose-only names the wrong habit before any data exists to draw

Here is what actually goes wrong in that moment.

You are shopping by test name. You think: I remember a t-test, maybe that one.
Or was it ANOVA? You are searching your memory for a label, and memory is a
terrible index.

Turn it around. Do not ask which test to use. Describe your data out loud, in
plain words, and let the test appear.

Say it like this. I am measuring order value, which is a number. I have three
branches. The three groups are made of different customers. The values are
lopsided, because a few big catering orders sit way out to the right.

Read that sentence back. There is exactly one test that fits it. You did not
remember it. You derived it.

That is the whole trick. Five questions, asked in a fixed order, each one
crossing off entire families of tests until one is left standing.

=== step === concept

## What are we actually comparing?

Bean and Bun is a small coffee shop with three branches: Riverside, Hilltop
and Market Street. Last Saturday they served 38 orders between them, and the
till recorded the value of every single one.

Here they all are. Nothing rounded, nothing dropped.

These numbers are invented for teaching, but they behave the way real coffee
shop tickets behave. Most people buy a coffee and something to eat for $5 to
$13, and every so often somebody orders catering for an office and the ticket
jumps to $24, $30, $41.

```r
# One Saturday at Bean and Bun. Every ticket, in dollars.
riverside <- c(5.90, 6.40, 6.60, 6.90, 7.10, 7.30, 7.50,
               7.90, 8.40, 9.10, 10.60, 12.30, 30.00, 41.00)
hilltop   <- c(8.20, 8.60, 9.10, 9.60, 9.90, 10.40,
               10.90, 11.60, 12.30, 14.20, 27.80)
market    <- c(4.70, 4.80, 4.90, 5.10, 5.30, 5.60, 6.30,
               6.60, 6.90, 7.20, 7.60, 8.10, 24.00)

# One long table: which branch the ticket came from, and what it was worth.
orders <- data.frame(
  branch = factor(rep(c("Riverside", "Hilltop", "Market Street"),
                      c(14, 11, 13)),
                  levels = c("Riverside", "Hilltop", "Market Street")),
  order_value = c(riverside, hilltop, market)
)

table(orders$branch)
#>     Riverside       Hilltop Market Street
#>            14            11            13

round(tapply(orders$order_value, orders$branch, mean), 2)
#>     Riverside       Hilltop Market Street
#>         11.93         12.05          7.47
```

Riverside averaged $11.93 a ticket. Hilltop $12.05. Market Street $7.47.

So Market Street looks about four and a half dollars a ticket worse than the
other two. Is that gap real, or is it just what happens when 38 people wander
into three shops on a Saturday?

That is the question. Now let us earn the answer.

=== step === widget

## What are the five questions?

Before we touch those tickets again, here is the entire method on one screen.

::widget process-flow {"steps": [{"title": "What are you measuring?", "sub": "a number you measure, or a label you count"}, {"title": "How many groups?", "sub": "one, two, or three and more"}, {"title": "Are the groups linked?", "sub": "the same people twice, or two separate crowds"}, {"title": "What shape is the spread?", "sub": "even and bell shaped, or one long tail"}, {"title": "Read the map", "sub": "four answers point at exactly one test"}]}

Read it top to bottom. Every question is about your data, not about
statistics. You could answer all five for a dataset you have never seen
before, in about a minute, without opening R.

And each answer does real work. Question one alone splits every test ever
written into two piles and throws one pile away.

Let us take them one at a time, on the Bean and Bun tickets.

=== step === concept

## Question 1: what are you measuring?

Every test was built for one particular kind of outcome. Use the wrong kind
and the answer is not slightly off, it is meaningless.

Your **outcome** is the thing you are measuring, the thing the question is
really about. At Bean and Bun the outcome is the order value: how many dollars
the customer spent.

There are only two kinds of outcome in the world.

A **number** is something you measure, on a scale where the gaps mean
something. $12.30 really is $6.20 more than $6.10. Order value, minutes,
grams, degrees.

A **label** is something you count. It is a name that drops each observation
into a bucket. Paid by card or by cash. Bought or did not buy. Riverside,
Hilltop or Market Street. There is no such thing as halfway between card and
cash.

R will tell you which one you have.

```r
class(orders$order_value)
#> [1] "numeric"

class(orders$branch)
#> [1] "factor"

str(orders)
#> 'data.frame':	38 obs. of  2 variables:
#>  $ branch     : Factor w/ 3 levels "Riverside","Hilltop",..: 1 1 1 1 1 1 1 1 1 1 ...
#>  $ order_value: num  5.9 6.4 6.6 6.9 7.1 7.3 7.5 7.9 8.4 9.1 ...
```

`numeric` means a number. `factor`, or `character`, means a label.

Order value is numeric, so we are heading down the t-test and ANOVA side of
the map. Branch is a factor, a label, but notice it is not the outcome here.
It is the thing that cuts the outcome into groups.

If the outcome itself had been a label, say whether each customer bought a
pastry or not, that whole side of the map would be gone and we would be
looking at chi-square instead.

[KEY INSIGHT]
Settle question one before anything else. Get it wrong and every other choice
you make is irrelevant, because you will be averaging things that cannot be
averaged.

=== step === quiz

## Number or label?

Four things a coffee shop could record about every ticket. Only one of them is
a label.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The value of the order in dollars ::no Ask whether halfway between two values means anything. Halfway between 4 and 6 items is 5 items, and that makes sense, so it is a number. The label is the one where halfway is nonsense.
- The number of items in the bag ::no Ask whether halfway between two values means anything. Halfway between 4 and 6 items is 5 items, and that makes sense, so it is a number. The label is the one where halfway is nonsense.
- Whether the customer used the loyalty card ::ok Yes. Card or no card is a bucket, not a quantity, and there is no halfway. The other three are all measured on a scale where the gaps carry meaning.
- The minutes between ordering and collecting ::no Ask whether halfway between two values means anything. Halfway between 4 and 6 items is 5 items, and that makes sense, so it is a number. The label is the one where halfway is nonsense.

=== step === concept

## Question 2: how many groups are you comparing?

Question two just counts the things you are holding up against each other.
Only three answers matter.

**One group against a fixed target.** Is our typical ticket different from the
$10 we budgeted for?

**Two groups.** Riverside against Hilltop.

**Three or more groups.** Riverside against Hilltop against Market Street.

Bean and Bun has three branches, so we land in the third bucket.

```r
unique(orders$branch)
#> [1] Riverside     Hilltop       Market Street
#> Levels: Riverside Hilltop Market Street

length(unique(orders$branch))
#> [1] 3
```

Three groups. That number matters far more than it looks.

=== step === concept

## Why not just run three t-tests?

Here is the idea everybody has, and the quiet way it ruins the answer.

With three branches you could run three t-tests. Riverside against Hilltop.
Riverside against Market Street. Hilltop against Market Street. Three simple
tests instead of one unfamiliar one.

One word first, because every test in this lesson hands it back. A
**p-value** answers a single question: if there were really no difference at
all, how often would plain chance hand me a gap as big as the one I am looking
at? Small means chance hardly ever does this. Large means chance does it all
the time.

The trouble is what that p-value is promising you. When you run one test at
the usual 5 percent cutoff, you are agreeing to a 5 percent chance of
announcing a difference that is not there. Run that gamble three times and
the chance that at least one of them fires a false alarm stacks up.

```r
# Three branches means three pairs, so three separate 5 percent gambles.
round(1 - 0.95^3, 4)
#> [1] 0.1426

# Ten groups would mean this many pairs.
n_pairs <- choose(10, 2)
n_pairs
#> [1] 45

round(1 - 0.95^n_pairs, 4)
#> [1] 0.9006
```

So three t-tests is not a 5 percent risk of a false alarm. It is 14 percent.
Close to one in seven.

And it runs away from you fast. Ten groups is 45 pairs, and by then you are 90
percent likely to find at least one difference that does not exist. You would
find something every single time, and you would believe it.

That is why three or more groups get their own test. One test that looks at
every group in a single pass and keeps the false alarm rate where you set it.

=== step === quiz

## Three branches, how many tests?

You want to know whether the typical ticket differs across Riverside, Hilltop
and Market Street. What do you run?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Three t-tests, one for each pair of branches ::no Every extra test is another roll of the dice on a false alarm, and picking the pair that looks biggest is the worst version of it, because you only picked it after seeing the data. Three or more groups get one test that handles all of them at once.
- One test that takes all three branches together ::ok Right. One test, one 5 percent risk. Three pairwise tests would stack three separate 5 percent gambles into roughly 14 percent, and you would start believing differences that were never there.
- A t-test on the highest branch against the lowest ::no Every extra test is another roll of the dice on a false alarm, and picking the pair that looks biggest is the worst version of it, because you only picked it after seeing the data. Three or more groups get one test that handles all of them at once.
- A t-test on Riverside against the other two combined ::no Every extra test is another roll of the dice on a false alarm, and picking the pair that looks biggest is the worst version of it, because you only picked it after seeing the data. Three or more groups get one test that handles all of them at once.

=== step === concept

## Question 3: are the two columns linked?

Question three is the one people skip, and skipping it changes your answer.

Two columns of numbers are **paired** when every row in one column has a named
partner in the other. The same person, the same shop, the same machine,
measured twice.

They are **independent** when the two columns are simply two separate crowds
that have nothing to do with each other.

Here is a paired one, from Riverside. Twelve regulars, the ones the baristas
know by name. Their average spend per visit for the month before the loyalty
card launched, and again for the month after.

```r
regular <- c("Ana", "Ben", "Chandra", "Dee", "Eli", "Farah",
             "Gita", "Hugo", "Ivy", "Jonas", "Kiran", "Lena")

before <- c(6.20, 7.80, 5.90, 9.10, 6.90, 10.40,
            8.40, 5.60, 9.70, 7.40, 10.90, 6.50)

after  <- c(7.10, 9.00, 6.50, 10.60, 7.70, 12.30,
            9.50, 6.00, 10.40, 7.90, 12.50, 7.30)

loyalty <- data.frame(regular, before, after,
                      change = round(after - before, 2))
loyalty
#>    regular before after change
#> 1      Ana    6.2   7.1    0.9
#> 2      Ben    7.8   9.0    1.2
#> 3  Chandra    5.9   6.5    0.6
#> 4      Dee    9.1  10.6    1.5
#> 5      Eli    6.9   7.7    0.8
#> 6    Farah   10.4  12.3    1.9
#> 7     Gita    8.4   9.5    1.1
#> 8     Hugo    5.6   6.0    0.4
#> 9      Ivy    9.7  10.4    0.7
#> 10   Jonas    7.4   7.9    0.5
#> 11   Kiran   10.9  12.5    1.6
#> 12    Lena    6.5   7.3    0.8

round(mean(loyalty$change), 2)
#> [1] 1
```

Look at the change column. Every single regular spent more, somewhere between
40 cents and $1.90, and the average rise was exactly $1.00.

Now look at the before column on its own. It runs from $5.60 to $10.90. Kiran
simply spends nearly twice what Hugo does, and that has nothing whatsoever to
do with the loyalty card.

That is why pairing matters. Kiran and Hugo are miles apart, but Kiran-before
and Kiran-after are the same Kiran, so the difference between those two is
clean.

=== step === concept

## Does pairing really change the answer?

Same 24 numbers. Same question. Two answers, and they are nowhere near each
other.

First, treat them as what they are: twelve people, each measured twice.

```r
t.test(before, after, paired = TRUE)
#>
#> 	Paired t-test
#>
#> data:  before and after
#> t = -7.3855, df = 11, p-value = 1.385e-05
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  -1.2980148 -0.7019852
#> sample estimates:
#> mean difference
#>              -1
```

Now feed R exactly the same numbers, but tell it these are two unrelated
crowds of people.

```r
t.test(before, after, paired = FALSE)
#>
#> 	Welch Two Sample t-test
#>
#> data:  before and after
#> t = -1.2246, df = 21.221, p-value = 0.2341
#> alternative hypothesis: true difference in means is not equal to 0
#> 95 percent confidence interval:
#>  -2.6971125  0.6971125
#> sample estimates:
#> mean of x mean of y
#>       7.9       8.9
```

A p-value of 1.385e-05 is 0.00001385. That is a rock solid yes, the loyalty
card moved spending.

A p-value of 0.2341 is a shrug. Nothing to see here.

Twenty four numbers, unchanged. The only thing that changed is whether we told
R that Ana-before and Ana-after are the same Ana.

Here is why the paired version wins. The unpaired test has to fight through
the fact that Kiran spends nearly twice what Hugo does. That person to person
spread is noise it cannot explain away, and it drowns out a $1 signal. The
paired test never sees that noise at all. It looks only at the twelve
differences, and all twelve of them point the same way.

[WARNING]
Pairing is not something you pick because it gives a smaller p-value. It is a
fact about how the data was collected. If the rows are genuinely linked you
must say so, and if they are not, saying so is cheating.

=== step === tryit

## Paired or independent?

Your turn. Back to the Saturday tickets.

Riverside served 14 orders that day. Hilltop served 11. Different people,
different queues, nobody standing in both, and no way on earth to say which
Riverside ticket goes with which Hilltop ticket.

So which design is that? Replace the placeholder below, then press Check.

```r
# 14 Riverside tickets and 11 Hilltop tickets, from two separate crowds.
# Nobody appears in both lists.
design <- "write your answer here"
design
```

::check {"regex": "[Ii]ndependent", "gate": true, "difficulty": "beginner", "ok": "Independent. There is no row that ties a Riverside ticket to a Hilltop ticket, so nothing is paired.", "no": "Not yet. Ask whether every ticket on one side has a named partner on the other. It does not, so these two crowds are not linked. The word we are after is independent."}

::solution

```r
design <- "independent"
design
#> [1] "independent"
```

Here is a shortcut you can keep forever. If the two columns can have different
lengths, they cannot possibly be paired. 14 tickets and 11 tickets do not pair
up. Twelve regulars measured twice always will.

=== step === widget

## Question 4: what shape is the spread?

Question four asks what your numbers look like once you line them all up.

The classic tests, the t-test and ANOVA, are built on averages. An average is
a fair summary when the values pile up around the middle and thin out evenly
on both sides. Bell shaped, roughly symmetric.

An average is a bad summary when the values are lopsided: a crowd of small
ones and a long tail of big ones. A single $41 catering order drags the
average away from where almost every real customer actually is.

Here are the Bean and Bun tickets, one box per branch.

::widget chart-plotter {"x":"branch","y":"order_value","geoms":["boxplot"],"data":[{"x":"Riverside","y":5.9},{"x":"Riverside","y":6.4},{"x":"Riverside","y":6.6},{"x":"Riverside","y":6.9},{"x":"Riverside","y":7.1},{"x":"Riverside","y":7.3},{"x":"Riverside","y":7.5},{"x":"Riverside","y":7.9},{"x":"Riverside","y":8.4},{"x":"Riverside","y":9.1},{"x":"Riverside","y":10.6},{"x":"Riverside","y":12.3},{"x":"Riverside","y":30.0},{"x":"Riverside","y":41.0},{"x":"Hilltop","y":8.2},{"x":"Hilltop","y":8.6},{"x":"Hilltop","y":9.1},{"x":"Hilltop","y":9.6},{"x":"Hilltop","y":9.9},{"x":"Hilltop","y":10.4},{"x":"Hilltop","y":10.9},{"x":"Hilltop","y":11.6},{"x":"Hilltop","y":12.3},{"x":"Hilltop","y":14.2},{"x":"Hilltop","y":27.8},{"x":"Market Street","y":4.7},{"x":"Market Street","y":4.8},{"x":"Market Street","y":4.9},{"x":"Market Street","y":5.1},{"x":"Market Street","y":5.3},{"x":"Market Street","y":5.6},{"x":"Market Street","y":6.3},{"x":"Market Street","y":6.6},{"x":"Market Street","y":6.9},{"x":"Market Street","y":7.2},{"x":"Market Street","y":7.6},{"x":"Market Street","y":8.1},{"x":"Market Street","y":24.0}]}

The box holds the middle half of that branch's tickets. The line inside it is
the median, the typical ticket. The whiskers reach out to the smallest and the
largest.

Now put two sets of numbers side by side. The middle ticket of each branch,
and the average of each branch.

```r
# The typical ticket: half the branch is below this, half above.
round(tapply(orders$order_value, orders$branch, median), 2)
#>     Riverside       Hilltop Market Street
#>           7.7          10.4           6.3

# The average, from earlier.
round(tapply(orders$order_value, orders$branch, mean), 2)
#>     Riverside       Hilltop Market Street
#>         11.93         12.05          7.47
```

Every average sits well above its own median. That gap is the fingerprint of a
long right tail.

Riverside's median customer spends $7.70. Riverside's average customer, on
paper, spends $11.93. There is no such customer. That number is not a person,
it is two catering orders in disguise.

=== step === concept

## How do I check the shape without squinting?

Eyeballing a chart is a real skill and you should keep doing it. But there is
a formal check too, and it is one line.

The **Shapiro-Wilk test** asks one narrow question: could a bell shaped
process plausibly have produced numbers this lopsided? It hands back a
p-value. A small p-value, under 0.05 say, means no, this is not bell shaped.

```r
shapiro.test(riverside)
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  riverside
#> W = 0.58908, p-value = 3.247e-05

# All three branches at once, p-values only.
sapply(list(Riverside = riverside, Hilltop = hilltop, MarketStreet = market),
       function(x) round(shapiro.test(x)$p.value, 6))
#>    Riverside      Hilltop MarketStreet
#>      3.2e-05      7.8e-05      1.3e-05
```

Riverside 0.000032. Hilltop 0.000078. Market Street 0.000013. All three sit
far under 0.05, so all three are lopsided. No surprise. We could see the tails.

One warning, because this test is easy to over-trust. Shapiro-Wilk is
sensitive to how much data you feed it. On 8 values it forgives almost
anything. On 5000 values it will flag a wobble so small that no test would
ever have cared about it.

So treat it as evidence, not as a verdict, and pair it with the practical
rule: once you have roughly 30 or more values per group, averages behave
themselves even when the raw values are somewhat skewed, and the bell shaped
tests hold up fine.

Bean and Bun has 11 to 14 tickets per branch and tails that stretch out to
$41. That is not a mild skew on a big pile of data. That is a small sample
with a heavy tail, which is exactly the situation where question four decides
your test for you.

=== step === concept

## Every test has a rank-based twin

So the spread is lopsided. Does that mean you are stuck?

Not at all. It means you move across to the other column of the map.

For every test built on averages there is a twin built on **ranks**. Instead
of using the values themselves, the twin lines everything up from smallest to
largest and uses the positions.

Watch what that does to Market Street's catering ticket.

```r
sort(market)
#>  [1]  4.7  4.8  4.9  5.1  5.3  5.6  6.3  6.6  6.9  7.2  7.6  8.1 24.0

rank(sort(market))
#>  [1]  1  2  3  4  5  6  7  8  9 10 11 12 13
```

As a value, $24.00 is three times the size of the next ticket down. As a rank
it is 13, one single step above 12.

The outlier stops shouting. It is still the biggest ticket of the day, it just
no longer gets to be three times as loud as everything else. That is why the
rank-based twins survive lopsided data.

Here are the four pairs you will actually reach for.

```r
twin_table <- data.frame(
  situation   = c("2 groups, separate people", "2 measurements, same people",
                  "3+ groups, separate people", "3+ measurements, same people"),
  if_bell     = c("t-test", "paired t-test", "ANOVA", "repeated ANOVA"),
  if_lopsided = c("Wilcoxon rank sum", "Wilcoxon signed rank",
                  "Kruskal-Wallis", "Friedman")
)
twin_table
#>                      situation        if_bell          if_lopsided
#> 1    2 groups, separate people         t-test    Wilcoxon rank sum
#> 2  2 measurements, same people  paired t-test Wilcoxon signed rank
#> 3   3+ groups, separate people          ANOVA       Kruskal-Wallis
#> 4 3+ measurements, same people repeated ANOVA             Friedman
```

Same four situations down the left. Questions two and three pick your row.
Question four picks your column.

=== step === concept

## Question 5: what does the map say?

You have four answers now. Put them together and the fifth question is nothing
more than a lookup.

Here is the whole flowchart, written out as eight rows.

```r
decision_map <- data.frame(
  outcome    = c("number", "number", "number", "number", "number", "number",
                 "label", "label"),
  groups     = c("2", "2", "2", "2", "3+", "3+", "2+", "2+"),
  paired     = c("no", "no", "yes", "yes", "no", "no", "no", "no"),
  shape      = c("bell", "lopsided", "bell", "lopsided", "bell", "lopsided",
                 "any", "sparse"),
  test       = c("t-test", "Wilcoxon rank sum", "paired t-test",
                 "Wilcoxon signed rank", "ANOVA", "Kruskal-Wallis",
                 "chi-square", "Fisher exact"),
  r_function = c("t.test()", "wilcox.test()", "t.test()", "wilcox.test()",
                 "aov()", "kruskal.test()", "chisq.test()", "fisher.test()")
)
decision_map
#>   outcome groups paired    shape                 test     r_function
#> 1  number      2     no     bell               t-test       t.test()
#> 2  number      2     no lopsided    Wilcoxon rank sum  wilcox.test()
#> 3  number      2    yes     bell        paired t-test       t.test()
#> 4  number      2    yes lopsided Wilcoxon signed rank  wilcox.test()
#> 5  number     3+     no     bell                ANOVA          aov()
#> 6  number     3+     no lopsided       Kruskal-Wallis kruskal.test()
#> 7   label     2+     no      any           chi-square   chisq.test()
#> 8   label     2+     no   sparse         Fisher exact  fisher.test()
```

That is the entire flowchart. You are not meant to memorise it. You are meant
to look things up in it.

Read a row left to right. Row 6 says: the outcome is a number, there are three
or more groups, they are not paired, the shape is lopsided, so the test is
Kruskal-Wallis and the R call is `kruskal.test()`.

Two notes on the bottom two rows. When the outcome is a label you count how
many fall into each bucket and compare the counts, which is chi-square. And
when those counts get small, roughly under 5 in any cell of the table,
chi-square becomes unreliable and Fisher's exact test takes over. That is what
`sparse` means there.

=== step === concept

## So is the difference real?

Time to answer the question we opened with. Walk Bean and Bun through the five.

1. **What are we measuring?** Order value in dollars. A number.
2. **How many groups?** Three branches.
3. **Are they linked?** No. Three separate crowds, different sizes, no partners.
4. **What shape?** Lopsided. Long right tail on all three, and Shapiro-Wilk agreed.
5. **Read the map.** Number, three or more, not paired, lopsided. Row 6. Kruskal-Wallis.

Now, here is why any of that mattered. Almost everybody reaches for ANOVA at
this point, because three groups and a numeric outcome is the ANOVA reflex.
Let us run both and put them side by side.

```r
# The reflex answer.
summary(aov(order_value ~ branch, data = orders))
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> branch       2  174.4   87.21   1.519  0.233
#> Residuals   35 2009.7   57.42

# The answer the five questions gave us.
kruskal.test(order_value ~ branch, data = orders)
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  order_value by branch
#> Kruskal-Wallis chi-squared = 15.303, df = 2, p-value = 0.0004754
```

ANOVA says p = 0.233. Nothing here. Go home, the branches are the same.

Kruskal-Wallis says p = 0.00048. A clear, strong difference.

Same 38 tickets. Opposite verdicts.

ANOVA compares averages, and those averages are being yanked around by a
handful of catering orders. Riverside's two big tickets alone blow up its
spread so much that the test cannot see past it. All that wobble becomes the yardstick
ANOVA measures the branch gap against, and next to a yardstick that big, four
and a half dollars a ticket looks like nothing. That is what the F value of
1.5 in the output is saying: the spread between the branches is barely bigger
than the spread inside them.

Kruskal-Wallis compares ranks. Almost every Market Street ticket sits in the
bottom half of all 38, and almost every Hilltop ticket sits in the top half.
On ranks that pattern is impossible to miss, and out comes p = 0.00048.

So yes. The difference is real. Market Street's typical ticket is genuinely
smaller than the other two. And the only reason you know that is that you
asked question four instead of reaching for the test you happened to remember.

=== step === tryit

## Name the test for a new question

One more, and this one is yours from scratch.

Bean and Bun bought a new coffee machine. Nine baristas timed how long till
close took them, in minutes, on the old machine, and then again on the new
one. The same nine people both times.

Most nights land near 12 minutes. On two nights a delivery arrived late and
till close ran past 40.

Walk the five questions and name the test.

```r
old_machine <- c(11.2, 12.4, 10.9, 13.1, 12.0, 11.6, 41.5, 12.8, 44.2)
new_machine <- c(10.4, 11.1,  9.8, 12.2, 10.7, 10.9, 36.0, 11.5, 39.4)

# The same nine baristas, timed on both machines.
test_name <- "write your answer here"
test_name
```

::check {"regex": "[Ss]igned[ -]?[Rr]ank", "gate": true, "difficulty": "intermediate", "ok": "Wilcoxon signed rank. A number, two measurements, the same nine people so it is paired, and two 40 minute nights make it lopsided. That is row 4 of the map.", "no": "Not yet. Work the five in order. The outcome is minutes, so a number. There are two measurements. They come from the same nine baristas, so this is paired. And those two 40 minute nights make the spread lopsided. Now read row 4."}

::solution

```r
# Number, two measurements, same nine people, lopsided. Row 4 of the map.
test_name <- "Wilcoxon signed rank"
wilcox.test(old_machine, new_machine, paired = TRUE)
#>
#> 	Wilcoxon signed rank exact test
#>
#> data:  old_machine and new_machine
#> V = 45, p-value = 0.003906
#> alternative hypothesis: true location shift is not equal to 0
```

Notice that you never had to remember anything. You described the data, and
the row appeared.

=== step === quiz

## One more from the floor

Riverside and Market Street each ran a Saturday promotion. For every person who
walked in, you wrote down which branch they were in and whether they bought
anything at all. Which test?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A t-test comparing the two branches ::no Go back to question one. The outcome here is bought or did not buy, which is a label, not a number. Every test in the t-test and ANOVA family needs a number to average, so none of them can touch this. Labels get counted, and counts get chi-square.
- ANOVA across the branches ::no Go back to question one. The outcome here is bought or did not buy, which is a label, not a number. Every test in the t-test and ANOVA family needs a number to average, so none of them can touch this. Labels get counted, and counts get chi-square.
- A chi-square test on the table of branch against bought or not ::ok Yes. The outcome is bought or did not buy, and that is a label. Labels get counted into a table and compared with chi-square. If any cell of that table came out under about 5, you would switch to Fisher's exact test.
- A paired t-test on the two branches ::no Go back to question one. The outcome here is bought or did not buy, which is a label, not a number. Every test in the t-test and ANOVA family needs a number to average, so none of them can touch this. Labels get counted, and counts get chi-square.

=== step === concept

## References

- [t.test, the stats package reference, R 4.6.0](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
- [kruskal.test, the stats package reference, R 4.6.0](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/kruskal.test.html)
- [Kruskal, W. H. and Wallis, W. A. (1952), Use of ranks in one-criterion variance analysis, JASA 47(260), 583-621](https://doi.org/10.1080/01621459.1952.10483441)
- [Shapiro, S. S. and Wilk, M. B. (1965), An analysis of variance test for normality, Biometrika 52(3-4), 591-611](https://doi.org/10.1093/biomet/52.3-4.591)
- [Navarro, D., Learning Statistics with R, the chapters on comparing two means and comparing several means](https://learningstatisticswithr.com/)

=== step === complete

## The five questions, from memory

You arrived with a freeze and three branches. You are leaving with a method.

::widget process-flow {"steps": [{"title": "What are you measuring?", "sub": "number goes one way, label goes the other"}, {"title": "How many groups?", "sub": "two is the t-test family, three plus is ANOVA"}, {"title": "Are the groups linked?", "sub": "linked means paired, and paired is its own test"}, {"title": "What shape is the spread?", "sub": "lopsided sends you to the rank-based twin"}, {"title": "Read the map", "sub": "four answers, one row, one test"}]}

Take those five to any dataset at all. Answer them in order, out loud if it
helps, and the test names itself. When question four comes back lopsided,
slide across to the rank-based twin and carry on.

And keep what Bean and Bun taught you. The popular test said no difference.
The right test said a clear one. Same 38 tickets. Those five questions were
the only thing standing between the two answers.
