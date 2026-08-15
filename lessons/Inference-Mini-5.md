---
title: "Hypothesis testing: the framework, explained"
slug: "Inference-Mini-5"
catalog_blurb: "How a test reaches its verdict, and the two ways it goes wrong."
description: "A bakery is accused of underfilling its 500 g loaves. Weigh 20 of them in R and run the whole hypothesis testing framework, verdict and errors included."
keywords: "hypothesis testing, null hypothesis, alternative hypothesis, p-value, significance level, alpha, type I error, type II error, t.test in R, test statistic, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.12"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "5"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-4"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 5 of 7
## Hypothesis testing: the framework, explained

Part 4 ended by saying the pieces you had been using by name would finally get a structure to sit in. This is that structure. If you missed the earlier parts, nothing here leans on them, because every piece gets rebuilt from the beginning.

Nadia Okafor inspects weights and measures for her local council. Last month a customer wrote in about Sunrise Bakery, whose sourdough loaves are labelled **500 grams**, saying they had started to feel light. So Nadia bought loaves over two weeks, twenty in all, and weighed each one on a calibrated scale. They came out at an average of **493.97 grams**.

Six grams short. That could be a bakery cutting corners, or it could be twenty ordinary loaves from an honest bakery, because no two loaves ever weigh the same. Deciding which is exactly the job the framework does, and it does it the way a courtroom does: the bakery is presumed innocent, Nadia's twenty weights are the evidence, and a conviction only follows if that evidence would be too surprising coming from an honest baker.

The curve below is what the evidence looks like when the defendant is innocent. Drag the marker to move the evidence further from the middle, watch the shaded tail shrink, and watch the verdict at the bottom flip.

::widget null-distribution {"tails": 1, "max": 4, "start": 1.50, "label": "how far the evidence sits from what an honest bakery produces"}

At 1.50 the readout says 0.067 and the verdict is fail to reject. Nudge it along to 1.60 and it reads 0.055, still not enough. One more notch to 1.65 and it reads 0.049, and the verdict flips to reject. Somewhere in that hair-thin gap sits the convention that decides which results get called real, and it is worth being uncomfortable about that.

By the end you will be able to:

- Write down the two competing claims in a test, in the right form and about the right thing
- Say what a p-value counts, naming the world it is counted inside
- Run a complete test in R and translate every line of the printout back into plain English
- Explain why "not significant" is not the same as "nothing happened", using a case that got it wrong
- Name the two ways a verdict goes wrong, say which dial controls which, and measure both rates yourself
- Catch the four ways the machine gets abused: charging after seeing the evidence, filing a dozen charges, reading a verdict as a sentence, and breaking the rules of evidence
- Run the same five moves on a completely different kind of evidence

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `p < 0.05` are familiar. No statistics background is assumed, and every term is defined in plain words the moment it appears.

=== step === concept
::eyebrow The shape of it
## Every test is the same trial

Before any arithmetic, here is the whole machine. A statistical test always makes the same five moves, in the same order, whatever the subject.

::widget process-flow {"steps":[{"title":"Name the defendant","sub":"the boring claim that nothing unusual is going on"},{"title":"Collect the evidence","sub":"the data, gathered without knowing how it will come out"},{"title":"Summarise it in one number","sub":"the test statistic: how far the evidence sits from boring"},{"title":"Ask how surprising that is","sub":"if the defendant is innocent, how often does evidence look this bad"},{"title":"Compare it to the bar and decide","sub":"the threshold, fixed in advance, not chosen afterwards"}]}

Nadia's case fills every one of those in.

| The trial | The statistics word | Sunrise Bakery |
|---|---|---|
| The defendant | the null hypothesis | the loaves truly average 500 g |
| The charge | the alternative hypothesis | the true average is below 500 g |
| The evidence | the sample | 20 weighed loaves |
| The prosecution's summary | the test statistic | one number, computed next |
| What innocent evidence looks like | the null distribution | the range of averages honest bakeries produce |
| How damning this evidence is | the p-value | the number everyone quotes |
| Beyond reasonable doubt | the significance threshold | the bar, set before weighing |
| The verdict | reject or fail to reject | guilty, or not proven |

Two things about that table are worth flagging now, because both trip people up later.

The defendant is not "the bakery is cheating". It is "the bakery is fine", which sounds backwards until you notice the courtroom does the same thing. A trial does not start neutral, it starts with the presumption of innocence, and the prosecution has to shift it. In a statistical test the boring claim gets that presumption, and the data has to shift it.

And the two verdicts are not symmetric. A jury can convict or it can fail to convict, but it never returns a verdict of "proven innocent". A test works the same way, which is why the second verdict is written as **fail to reject** rather than **accept**. That phrasing is clumsy and it is deliberate, because smoothing it over is what closed a real case against this very bakery six months too early.

=== step === concept
::eyebrow The evidence
## Twenty loaves on a scale

Here is what Nadia actually has. Twenty weights in grams, in the order she bought them, from loaves labelled 500 g.

```r
loaves <- c(495.4, 491.6, 500.1, 480.3, 501.8, 510.1, 488.6, 483.4, 481.8, 492.2,
            494.6, 486.8, 503.7, 502.1, 490.7, 499.7, 485.4, 508.3, 482.0, 500.8)

length(loaves)
#> [1] 20

round(mean(loaves), 2)
#> [1] 493.97

round(sd(loaves), 2)
#> [1] 9.09

sum(loaves < 500)
#> [1] 13
```

`mean()` adds the twenty weights and divides by twenty, so **493.97 g** is the average loaf in Nadia's basket. `sd()` gives the **standard deviation**, the standard word for how much the individual loaves differ from that average, and **9.09 g** says a typical loaf sits about nine grams away from 493.97 in one direction or the other. `sum(loaves < 500)` counts how many came in under label weight, because R treats every TRUE as a 1, and thirteen of the twenty did.

Look at the raw numbers for a moment rather than the summaries. The lightest loaf is 480.3 g, nearly twenty grams short, whereas the heaviest is 510.1 g, ten grams *over*, and seven of the twenty came in above label weight. So whatever is going on at Sunrise Bakery, it is not that every loaf is short, which is exactly what you would expect: dough is portioned by weight before it goes in the oven, and how much water leaves during baking varies from loaf to loaf.

So the question is not about any single loaf. It is about where the bakery's true average sits, and Nadia cannot see that number. She can only see twenty draws from it.

=== step === concept
::eyebrow The obvious objection
## An average below 500 is not yet guilt

Six grams short looks like evidence, and the natural next thought is that the case is already made. It is not, and here is why.

Suppose Sunrise Bakery is completely honest, and its loaves really do average exactly 500 g with the same nine-gram loaf-to-loaf variation Nadia measured. Buy twenty of those loaves and weigh them.

```r
set.seed(1)
honest <- rnorm(20, mean = 500, sd = 9.09)

round(mean(honest), 2)
#> [1] 501.73
```

`rnorm(20, mean = 500, sd = 9.09)` asks R for twenty loaves from a world whose true average is 500 and whose loaf-to-loaf spread is 9.09, and `set.seed(1)` pins R's random numbers down so your run comes out identical to the one printed here.

This honest bakery's twenty loaves averaged **501.73 g**, not 500. Nobody cheated in the other direction either. The twenty loaves that happened to land in the basket were not perfectly average, so their average was not exactly 500.

That is the entire difficulty. An honest bakery does not produce a sample average of 500.00. It produces something near 500, and "near" has a size. Until we know how big that wandering is, six grams short means nothing at all, because we cannot tell whether six grams is far outside what honest wandering produces or comfortably inside it.

=== step === concept
::eyebrow How big is near
## Twenty honest bakeries

One imagined honest bakery tells us the average moves. Twenty of them tell us how much.

```r
set.seed(33)
twenty_honest <- replicate(20, mean(rnorm(20, mean = 500, sd = 9.09)))

round(twenty_honest, 2)
#>  [1] 500.61 501.68 498.06 503.13 499.22 501.42 504.42 500.54 499.03 499.83
#> [11] 500.64 498.24 499.07 502.14 500.28 495.76 498.41 497.21 500.38 500.02

sum(twenty_honest <= 493.97)
#> [1] 0
```

`replicate(20, ...)` runs the thing inside it twenty separate times and collects the twenty answers, so each number above is one honest bakery's twenty loaves, averaged. The `[1]` and `[11]` down the left edge are R keeping count of where each printed line starts, not part of the data.

Read the spread of those twenty numbers. The lowest is **495.76** and the highest is **504.42**, so honest bakeries do wander, by four or five grams either way, and one of them came in more than four grams light purely by luck. That is the size of "near".

Now look at the last line. Not one of the twenty honest bakeries got as low as Nadia's 493.97. Zero out of twenty.

That is the first real evidence against Sunrise Bakery, and notice the shape of the argument, because every hypothesis test you will ever run has this shape. We did not try to prove the bakery is cheating. We built the world where it is innocent, looked at what that world produces, and found Nadia's basket sitting outside it.

=== step === concept
::eyebrow Counting properly
## Fifty thousand honest bakeries

Twenty runs is enough to see the shape and far too few to put a number on it, since zero out of twenty could mean one in fifty or one in fifty thousand. So run fifty thousand.

```r
set.seed(11)
many_honest <- replicate(50000, mean(rnorm(20, mean = 500, sd = 9.09)))

mean(many_honest <= 493.97)
#> [1] 0.00126
```

`many_honest <= 493.97` turns the fifty thousand averages into fifty thousand TRUEs and FALSEs, and `mean()` of those gives the fraction that are TRUE, because R counts every TRUE as 1 and every FALSE as 0.

**0.00126.** About one honest bakery in eight hundred would hand Nadia a basket averaging 493.97 g or less, purely through the luck of which twenty loaves she happened to pick up.

Here is the same fifty thousand as a picture. Press Run, and each bar counts how many imagined honest bakeries produced an average in that slice.

```r
hist(many_honest, breaks = 60, col = "grey85", border = "white",
     main = "50,000 honest bakeries, 20 loaves each",
     xlab = "average weight of the 20 loaves, in grams")
abline(v = 493.97, col = "#b5631a", lwd = 3)
```

The pile is centred on 500, which is where it should be, since these bakeries are honest by construction. It tails away in both directions, and the orange line marks where Nadia's basket landed. There is barely any curve left out there.

[KEY INSIGHT]
This histogram is the single most important object in hypothesis testing, and it has a name: the **null distribution**. It is what the evidence looks like across all the ways an innocent defendant's evidence could have come out. Everything else is a way of measuring where the real evidence falls on it.

=== step === concept
::eyebrow The two claims
## The defendant and the charge, written down properly

We have been running the machine before naming its parts, which is the right order to learn it in. Now the names.

The claim we simulated, the one that gets the presumption of innocence, is the **null hypothesis**, written \\( H_0 \\) and read "H nought" or "H zero". Nadia's version:

\\[ H_0: \\mu = 500 \\]

Every symbol in that line matters. \\( \\mu \\), the Greek letter mu, is the **true average weight of every loaf Sunrise Bakery bakes**, including the ones Nadia never bought and the ones not baked yet. It is a fixed number nobody can see. The line says that number is 500.

Against it stands the **alternative hypothesis**, written \\( H_1 \\), which is the charge:

\\[ H_1: \\mu < 500 \\]

The true average is below 500. That is what Nadia would have to establish to act.

Three things about how those two lines are built, each of which is a rule rather than a stylistic choice.

**They are about \\( \\mu \\), never about the sample.** Writing \\( H_0 \\) as "the average of Nadia's twenty loaves is 500" would be nonsense, because we can see that average and it is 493.97. There is nothing to test about a number you already have. The unknown is the bakery's true average, and hypotheses are always statements about the unknown.

**The null is the boring one, and it has to be specific enough to simulate.** "The bakery is fine" only became a world we could build because it pinned \\( \\mu \\) to exactly 500. "The bakery is cheating" pins nothing, since cheating by one gram and cheating by fifty are both cheating, and you cannot simulate a world that vague. That asymmetry is why the boring claim gets the presumption: it is the only one of the two that is precise enough to be tested against.

**They are written before the evidence is looked at.** Nadia's charge is one-directional, \\( \\mu < 500 \\), because a bakery giving customers *more* bread than promised is not what she was sent to investigate. That decision was made when the complaint came in, months before anyone weighed anything, and taking the two steps in the other order costs the test the very error rate it advertises.

=== step === quiz
::eyebrow Check yourself
## Which one is the null

Nadia is testing whether Sunrise Bakery's 500 g loaves are underweight. Which of these is the null hypothesis for her test?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The average of the 20 loaves Nadia weighed is 500 g
- The true average weight of all Sunrise Bakery loaves is 500 g ::ok Exactly right, and both halves of that sentence are doing work. It is about the *true* average across every loaf the bakery makes, which is the number nobody can see, rather than about the twenty Nadia happened to buy. And it is the boring claim, the one that says nothing unusual is going on, which is what gets the presumption of innocence and what we simulated fifty thousand times.
- The true average weight of all Sunrise Bakery loaves is below 500 g
- Sunrise Bakery is deliberately underfilling its loaves ::no The first option is a statement about the twenty loaves in the basket, and their average is already known to be 493.97, so there is nothing left to test. The third is the alternative hypothesis, the charge rather than the defendant. And the last one is about intent, which no scale can measure: a test can say the loaves are light, but whether that is fraud, a miscalibrated portioner or a new flour supplier is a question for the inspection visit, not the arithmetic.

=== step === concept
::eyebrow One number
## Compress the evidence into a single figure

Nadia's evidence is currently twenty numbers. To compare it against anything, the prosecution has to summarise it into one, and the natural summary is "how far below 500 did the basket land, measured in units of how far baskets normally wander".

The wandering has a size and a name. Part 3 called it the **standard error**: the typical distance between a sample average and the truth it is estimating. For an average of \\( n \\) things whose individual spread is \\( s \\), it is

\\[ SE = \\frac{s}{\\sqrt{n}} \\]

where \\( s \\) is the loaf-to-loaf standard deviation and \\( n \\) is how many loaves were weighed. Dividing by \\( \\sqrt{n} \\) is why more evidence is better: twenty loaves pin the average down more tightly than five do.

Now the summary itself. Take how far the basket landed from the null's 500, and divide by that typical wandering:

\\[ t = \\frac{\\bar{x} - \\mu_0}{SE} \\]

where \\( \\bar{x} \\) is the average of the loaves Nadia weighed, and \\( \\mu_0 \\) is the value the null hypothesis pinned \\( \\mu \\) to, which here is 500. Work both out on Nadia's actual numbers.

```r
se     <- sd(loaves) / sqrt(length(loaves))
t_stat <- (mean(loaves) - 500) / se

round(c(se = se, t = t_stat), 4)
#>      se       t 
#>  2.0328 -2.9664
```

Two numbers, and both are readable in plain English.

**SE = 2.0328.** A basket of twenty loaves from an honest bakery typically lands about two grams away from 500. That matches what you saw a moment ago: those twenty simulated honest bakeries ran from 495.76 to 504.42, which is roughly two standard errors either side of 500.

**t = -2.9664.** Nadia's basket landed almost three of those typical wanderings *below* 500. The minus sign says below, and the size says how far in units of ordinary wobble rather than in grams.

That second number is the **test statistic**, and dividing by the standard error is what makes it portable. Six grams short means nothing on its own, because six grams is enormous for a chocolate bar and invisible for a sack of flour. Three standard errors short means the same thing everywhere.

=== step === concept
::eyebrow An honest correction
## Why the curve is a little fatter than it looks

We now have two ways of measuring the same evidence, and they do not quite agree. That disagreement is worth chasing down, because it is where a genuinely important idea lives.

The fifty-thousand-bakeries simulation gave 0.00126. But look at what it assumed: every simulated honest bakery was handed a spread of exactly 9.09, as though that number were known. It is not known. Nadia estimated it from the same twenty loaves, and a different twenty loaves would have produced a different estimate.

So run the simulation again, honestly this time. Let each imagined honest bakery estimate its own spread from its own twenty loaves, exactly as Nadia had to, and compute its own test statistic.

```r
set.seed(11)
t_honest <- replicate(50000, {
  batch <- rnorm(20, mean = 500, sd = 9.09)
  (mean(batch) - 500) / (sd(batch) / sqrt(20))
})

mean(t_honest <= -2.9664)
#> [1] 0.00394
```

**0.00394**, against 0.00126 from the version that pretended the spread was known. Three times as many honest bakeries look this guilty once you admit you had to estimate the spread.

The reason is straightforward once you see it. There are now two things wobbling instead of one. A basket can look extreme because its average came out low, or because its estimated spread came out small, which shrinks the denominator and inflates the statistic. Two sources of wobble produce a fatter tail than one, so extreme-looking evidence is more common than the known-spread version suggested.

That fatter curve has a name, the **t distribution**, and this is the entire reason it exists. It is the bell curve's slightly heavier-tailed cousin, used whenever the spread had to be estimated from the same data. How much heavier depends on how much data did the estimating, through a number called the **degrees of freedom**, which here is 19: twenty loaves, minus one, because the average had to be worked out from those same loaves before anything could be measured against it. With hundreds of loaves the two curves become indistinguishable, and with twenty the difference is a factor of three in the tail, as you just measured.

=== step === widget
::eyebrow The number itself
## The tail under the curve is the p-value

Everything so far has been a way of asking one question: **if Sunrise Bakery is honest, how often would its evidence look at least this bad?**

The picture below is that question. The curve is the null distribution in test-statistic units, so the middle is what an honest bakery typically produces and the edges are what it rarely produces. The vertical line is where the evidence landed, and the shaded region past it is every result at least that extreme. That shaded area is the whole answer.

::widget null-distribution {"tails": 1, "max": 4, "start": 2.65, "label": "how far from the middle the evidence sits"}

The marker starts at 2.65 and the readout says **0.004**, which is where Nadia's case lands. Drag it left towards zero and the shaded region swells: evidence near the middle is ordinary, an honest bakery produces it constantly, and there is nothing to explain. Drag it right and the region shrinks towards nothing, because evidence that far out is something an honest bakery almost never produces.

One honest detail about that 2.65. The curve this widget draws is the bell curve, the known-spread version, whereas Nadia's statistic of 2.9664 lives on the slightly fatter t curve with 19 degrees of freedom. Those two curves put the same amount of area in the tail at different distances out, and 2.9664 on hers buys the same 0.004 that 2.65 buys here. The shape differs a little, the logic does not differ at all.

=== step === concept
::eyebrow The definition
## So that shaded area is the p-value

The number you have now measured twice, first by simulating fifty thousand honest bakeries and then as a shaded area under a curve, is the **p-value**, and it is worth stating carefully, because almost every misuse of it comes from a loose version of the sentence.

**The p-value is the probability of getting evidence at least as extreme as the evidence you actually got, computed in the world where the null hypothesis is true.**

Read it back with Nadia's numbers in place: if Sunrise Bakery's loaves truly average 500 g, then about 4 baskets in every 1,000 would produce evidence at least as extreme as hers. Her basket is one of those, or the bakery's true average is not 500.

Every clause is load-bearing, and the three most common misreadings each drop a different one.

- **It is not the probability the bakery is innocent.** The p-value is computed *assuming* innocence. It cannot then tell you how likely innocence is, any more than "an innocent man's fingerprints turn up here 4 times in 1,000" tells you the odds this particular man is innocent. Answering that second question needs something the p-value never sees: how common cheating bakeries are in the first place.
- **It is not the probability the result happened by chance.** Same error wearing different clothes. Chance is assumed, not measured.
- **It is not a measure of how short the loaves are.** 0.004 says the evidence is surprising for an honest bakery. It says nothing about whether the shortfall is 6 grams or 60, and a later step gets that number properly.

[NOTE]
The phrase "at least as extreme" is doing quiet work. The p-value is not the probability of getting exactly 493.97, which for a continuous measurement is zero. It is the probability of landing that far out **or further**, which is the shaded tail rather than a single point on the curve. And "extreme" is measured in standard errors, so every imagined basket is judged against the spread it measured for itself. That is why the honest figure is about 4 in 1,000 rather than the roughly 1.3 in 1,000 from the earlier simulation, where each bakery was handed a spread of 9.09 as though somebody already knew it.

=== step === concept
::eyebrow The bar
## Beyond reasonable doubt, in grams

A p-value on its own does not convict anybody. It has to meet a bar, and the bar is a decision somebody makes rather than something the data produces.

That bar is the **significance level**, written \\( \\alpha \\) and read "alpha". It is the p-value below which you have agreed to reject the null hypothesis, and it is fixed **before** the evidence is examined. Nadia's council uses the conventional

\\[ \\alpha = 0.05 \\]

which says: we will convict when the evidence is of a kind an honest bakery would produce less than 5 percent of the time.

Where does 0.05 come from? Convention, repetition, and a remark by Ronald Fisher in the 1920s that one in twenty was a convenient line. It is not a law of nature, and nothing about the number 0.05 makes it correct. A council that fines bakeries on thin evidence would want a stricter bar; a screening test where missing a real problem is far worse than a false alarm might want a looser one. What matters far more than the value is that it is chosen in advance, for stated reasons.

The bar can also be translated out of p-value units and back into grams, which makes it much easier to argue about. Ask what basket average sits exactly on the line.

```r
critical_t <- qt(0.05, df = 19)
bar_grams  <- 500 + critical_t * se

round(c(critical_t = critical_t, bar_grams = bar_grams), 3)
#> critical_t  bar_grams 
#>     -1.729    496.485
```

`qt(0.05, df = 19)` reads off the t curve the point with 5 percent of the area below it, and here that is **-1.729** standard errors. Multiplying by the standard error of 2.0328 and adding it to 500 puts the same line at **496.485 grams**.

So Nadia's whole test, stripped of vocabulary, is this one sentence: **if the twenty loaves average less than 496.485 g, convict.** Hers averaged 493.97 g. That value, -1.729, is called the **critical value**, and the region past it is the **rejection region**, but the names matter less than the fact that the entire procedure collapses into a single number on a kitchen scale.

=== step === quiz
::eyebrow Check yourself
## Say the 0.004 out loud

Nadia's test returns a p-value of 0.004. Which sentence states what that number means?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- There is a 0.4 percent chance that Sunrise Bakery's loaves are fine
- There is a 99.6 percent chance the bakery is underfilling
- If the bakery's loaves truly averaged 500 g, about 4 baskets of 20 in every 1,000 would produce evidence at least as extreme as Nadia's ::ok That is the definition with every clause intact. The conditional at the front is the part that gets dropped: the number is computed inside the world where the bakery is honest, so it describes what honest bakeries produce, not how likely honesty is. And "at least as extreme" is the tail rather than a single value, which is why it is an area under a curve.
- Only 0.4 percent of Sunrise Bakery loaves weigh less than 500 g
- Nadia can be 99.6 percent confident she has the right answer ::no The first two both try to turn the number around, from "how often does an innocent bakery produce evidence like this" into "how likely is this bakery innocent", and those are genuinely different quantities: answering the second needs to know how common short-weighting bakeries are before any weighing happened, which no p-value contains. The fourth confuses the p-value with a fact about individual loaves, and thirteen of Nadia's twenty were already under 500. The last one dresses the same reversal up as confidence.

=== step === concept
::eyebrow The whole thing in one line
## The verdict, from R

Everything so far can be done by one function, and now that you know what each piece means, the printout reads like a summary of the trial.

```r
t.test(loaves, mu = 500, alternative = "less")
#> 
#> 	One Sample t-test
#> 
#> data:  loaves
#> t = -2.9664, df = 19, p-value = 0.003965
#> alternative hypothesis: true mean is less than 500
#> 95 percent confidence interval:
#>      -Inf 497.4849
#> sample estimates:
#> mean of x 
#>    493.97
```

Three arguments, each one a piece of the trial. `loaves` is the evidence. `mu = 500` is the null hypothesis, the value the defendant claims. `alternative = "less"` is the charge, that the truth is below that value.

And the printout says, line by line: the test statistic came out at **-2.9664**, on **19** degrees of freedom, with a p-value of **0.003965**. That p-value is the same 0.004 you simulated by hand from fifty thousand imagined honest bakeries, and the agreement is not a coincidence, it is two routes to the same area under the same curve.

Since 0.003965 is below the 0.05 bar Nadia fixed in advance, the verdict is **reject \\( H_0 \\)**. In her report that becomes: the loaves are significantly underweight, and the evidence is not what an honest bakery ordinarily produces.

=== step === concept
::eyebrow Reading the printout
## Every line, translated

That output is dense, so here is each line with what it actually tells you.

| Line | What it is | Nadia's case |
|---|---|---|
| `One Sample t-test` | which test ran: one group against a fixed claimed value | 20 loaves against the labelled 500 g |
| `t = -2.9664` | the test statistic: how far the evidence sits from the null, in standard errors | almost three, and below |
| `df = 19` | degrees of freedom: how much data estimated the spread, which sets how fat the curve is | 20 loaves minus 1 |
| `p-value = 0.003965` | the shaded tail: how often innocence produces evidence this extreme | about 4 in 1,000 |
| `alternative hypothesis` | the charge, echoed back so you can check R tested what you meant | true mean is less than 500 |
| `95 percent confidence interval` | the range of true averages compatible with this evidence | up to 497.4849 |
| `sample estimates` | the plain summary of the evidence | mean of x = 493.97 |

That confidence interval line looks odd, running from `-Inf` up to 497.4849. It is one-sided because the test was one-sided: Nadia asked only whether the true average is *below* 500, so R answers only about the upper end, and the honest reading is "the evidence is compatible with any true average up to about 497.5 g". Ask a two-sided question and you get a two-sided interval, which is what the next step does.

The one thing the printout does **not** contain is a verdict. R will not print the word "significant" or apply a threshold, because the threshold is your decision and not the function's. It hands you the number and stops.

=== step === concept
::eyebrow Two verdicts, not three
## Guilty, or not proven

Nadia's test rejected \\( H_0 \\). Suppose it had not. What would she then be entitled to say?

Almost nothing, and this is the part of the framework people smooth over most often.

A test has exactly two outcomes. **Reject \\( H_0 \\)** means the evidence was too surprising to live comfortably with the boring claim. **Fail to reject \\( H_0 \\)** means it was not. That second outcome is not evidence that the null is true. It is the absence of evidence that it is false, and those are different situations that happen to look identical from the outside.

Scotland's courts have a verdict for this that English-speaking statisticians have quietly borrowed: **not proven**. It means the prosecution did not make its case, and it deliberately does not mean the defendant is innocent.

[WARNING]
Never write "we accept the null hypothesis" or "the test shows there is no difference". Write "we failed to reject" or, better, say what the data could and could not rule out. A test that fails to convict has told you about the strength of the evidence, and nothing whatever about the truth.

The next step shows why this is not pedantry, using a case where the difference mattered.

=== step === tryit
::eyebrow Your turn
## What if the charge had been different

Nadia charged the bakery with underfilling, so her test looked in one direction only. Suppose instead a customer had complained that the loaves were **mislabelled**, with no claim about which way, so the charge became "the true average is not 500 g" and surprising evidence in either direction would count.

`t.test` takes that as `alternative = "two.sided"`. Fill in the blank and press Check.

```r
t.test(loaves, mu = 500, alternative = "____")
```
::check {"regex":"two\\.sided","gate":true,"difficulty":"beginner","ok":"The p-value comes back as 0.00793, exactly twice the 0.003965 from the one-sided test, because the two-sided version counts baskets that are surprisingly heavy as well as surprisingly light. The confidence interval also turns into a proper two-ended one, 489.7154 to 498.2246, which is the range of true averages this evidence is compatible with. Both versions still convict, but notice that the price of asking a broader question was a p-value twice as large.","no":"The option R wants is a quoted string with a dot in the middle of it, so the blank is two.sided."}
::solution
```r
t.test(loaves, mu = 500, alternative = "two.sided")
#> 
#> 	One Sample t-test
#> 
#> data:  loaves
#> t = -2.9664, df = 19, p-value = 0.00793
#> alternative hypothesis: true mean is not equal to 500
#> 95 percent confidence interval:
#>  489.7154 498.2246
#> sample estimates:
#> mean of x 
#>    493.97
```

=== step === concept
::eyebrow It already happened
## The first visit, and what it missed

Nadia's twenty loaves were not the council's first look at Sunrise Bakery. Six months earlier, after an initial complaint, she went in on a Friday afternoon and the shelves were nearly empty. She weighed the eight loaves that were left, filed the result, and closed the case.

```r
first_check <- c(486.4, 504.6, 496.5, 490.8, 482.5, 499.5, 511.4, 493.5)

round(mean(first_check), 2)
#> [1] 495.65

t.test(first_check, mu = 500, alternative = "less")
#> 
#> 	One Sample t-test
#> 
#> data:  first_check
#> t = -1.2966, df = 7, p-value = 0.1179
#> alternative hypothesis: true mean is less than 500
#> 95 percent confidence interval:
#>      -Inf 502.0063
#> sample estimates:
#> mean of x 
#>    495.65
```

A p-value of **0.1179**, comfortably above 0.05. Not proven. The file was closed with a note saying there was no evidence the loaves were underweight.

Now hold both cases side by side. Same bakery. Same ovens, same recipe, same true average, whatever it is. Eight loaves said not proven and twenty loaves said guilty, and the difference between those two verdicts was not the bakery's behaviour. It was how many loaves happened to be left on the shelf that Friday.

Look at what the earlier printout was actually saying, in its own confidence interval line: the evidence was compatible with any true average up to about **502 g**. That range covers 500, and it covers 494, and it covers 490. Eight loaves simply could not tell those worlds apart. The report said "no evidence of underweight loaves" when what the data supported was "this check could not have detected underweight loaves unless they were dramatically short".

That is not a subtle distinction. An eight-loaf check misses a real six-gram shortfall close to half the time, and a few steps from here you will measure that yourself rather than take it on trust.

=== step === quiz
::eyebrow Check yourself
## Reading the first visit

The eight-loaf check returned a p-value of 0.1179. What was the council entitled to conclude from it?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- The loaves are not underweight
- There is an 88 percent chance the bakery is honest
- The bakery is honest, but only just, since the p-value is not very large
- The check found no evidence strong enough to convict, which leaves both an honest bakery and a genuinely short one on the table ::ok Exactly, and the second half is the part worth practising saying out loud. Failing to reject is a statement about the strength of the evidence, not about the world. Its own confidence interval made this explicit: the data were compatible with any true average up to about 502 g, a range that comfortably contains both 500 and a bakery running several grams light.
- The check was correct at the time, and the later result means the bakery started cheating in between ::no The first three all convert "we could not prove it" into "it did not happen", which is the single most common error in reading a test, and the one that closed this file six months early. The 88 percent in the second option is 1 minus the p-value, which is not the probability of anything. And the last option invents a change in the bakery to explain a change in the verdict, when the simpler explanation is sitting in the printout: eight loaves is not enough evidence to detect a six-gram shortfall.

=== step === concept
::eyebrow Both ways of being wrong
## The two mistakes a verdict can make

Two things could be true about Sunrise Bakery, and two things could come out of Nadia's test, which makes four outcomes.

|  | The loaves truly average 500 g | The loaves are truly short |
|---|---|---|
| **Test convicts** | **Type I error.** An honest baker fined. | Correct. |
| **Test does not convict** | Correct. | **Type II error.** A short-weighting baker walks. |

A **Type I error** is convicting the innocent: the test says something is going on when nothing is. A **Type II error** is acquitting the guilty: the test misses something real. Every test makes both kinds of mistake at some rate, and the two rates trade against each other.

The picture below is the whole framework in one plot. Press Run.

```r
grams        <- seq(484, 512, length.out = 400)
honest_world <- dnorm(grams, mean = 500, sd = se)
short_world  <- dnorm(grams, mean = 494, sd = se)

plot(grams, honest_world, type = "l", lwd = 2, col = "grey40",
     main = "What 20 loaves can average, in two different worlds",
     xlab = "average weight of the 20 loaves, in grams", ylab = "")
lines(grams, short_world, lwd = 2, col = "#1f7a55")

convict <- grams <= bar_grams
polygon(c(484, grams[convict], bar_grams), c(0, honest_world[convict], 0),
        col = "#b5631a66", border = NA)
polygon(c(484, grams[convict], bar_grams), c(0, short_world[convict], 0),
        col = "#1f7a5544", border = NA)
abline(v = bar_grams, lwd = 2, lty = 2)
```

`dnorm()` gives the height of each hump at every point along the axis, `polygon()` fills the area to the left of the bar under each one, and `abline()` drops the dashed line at the 496.485 g bar from two steps ago.

The **grey hump** is the world where the bakery is honest: baskets centred on 500. The **green hump** is a world where the loaves really do average 494: the same shape, shifted six grams left. The dashed line is the bar, and everything left of it is a conviction.

Now read the two shaded areas.

- The **orange sliver** under the grey hump is baskets from an honest bakery that fall past the bar anyway. Those are Type I errors, and that sliver is 5 percent of the grey hump by construction, because that is exactly what setting \\( \\alpha = 0.05 \\) means.
- The **green shaded area** is baskets from a genuinely short bakery that do fall past the bar. Those are the correct convictions, and the unshaded green to the right of the line is the Type II errors: real shortfalls that walk free.

Everything anybody ever does to a hypothesis test amounts to sliding that dashed line, or moving those humps further apart, or making them narrower.

=== step === concept
::eyebrow Measuring the first mistake
## The false conviction rate really is alpha

The claim that the orange sliver is exactly 5 percent deserves to be checked rather than asserted, so check it. Put ten thousand honest bakeries through Nadia's complete test and count the convictions.

```r
honest_p <- function() {
  batch <- rnorm(20, mean = 500, sd = 9.09)
  t.test(batch, mu = 500, alternative = "less")$p.value
}

set.seed(5)
p_honest <- replicate(10000, honest_p())

mean(p_honest < 0.05)
#> [1] 0.0516
```

`honest_p()` is the whole inspection packed into something reusable: bake twenty loaves in a world where the true average is 500, weigh them, run the test, hand back the p-value. Ten thousand honest bakeries later, **0.0516** of them were convicted.

Five percent, as advertised, give or take the wobble you get from counting ten thousand of anything. That is not a happy accident. The threshold **defines** the rate: setting \\( \\alpha \\) at 0.05 is precisely the instruction "draw the line where 5 percent of innocent evidence falls past it".

There is a deeper fact underneath, and it is easy to see. Look at the p-values from those ten thousand honest bakeries as a whole.

```r
hist(p_honest, breaks = 20, col = "grey85", border = "white",
     main = "p-values from 10,000 honest bakeries",
     xlab = "the p-value the inspection reported")
abline(v = 0.05, col = "#b5631a", lwd = 3)
```

The bars are flat. When the null hypothesis is true, every p-value from 0 to 1 is equally likely, so 5 percent of them land below 0.05, 20 percent land below 0.20, and half land below 0.50. Check any of those against the simulation and it holds.

[KEY INSIGHT]
Under the null hypothesis a p-value is not a measure of anything, it is a uniform random number. That single fact explains the false conviction rate, and it also explains why running many tests goes wrong so quickly, which is a trap a few steps from here.

=== step === tryit
::eyebrow Your turn
## A stricter bar

Nadia's council is considering tightening its threshold, since fining an honest baker is a serious matter and there is no rush to act on thin evidence.

Using the same ten thousand honest bakeries in `p_honest`, count what share would be convicted at a threshold of 0.01 instead of 0.05. Fill in the blank and press Check.

```r
mean(p_honest < ____)
```
::check {"regex":"p_honest\\s*<\\s*0?\\.01\\b","gate":true,"difficulty":"beginner","ok":"0.0089, so under 1 percent, which is again what the threshold promises. Tightening the bar from 0.05 to 0.01 cuts false convictions roughly fivefold. It is not free, though: the same move makes the rejection region smaller, so genuinely short-weighting bakeries slip through more often too. That is the trade, and there is no setting that improves both.","no":"The threshold goes in as a proportion rather than a percentage, so 1 percent is written 0.01."}
::solution
```r
mean(p_honest < 0.01)
#> [1] 0.0089
```

=== step === concept
::eyebrow Measuring the second mistake
## How often a guilty bakery walks

The false conviction rate is under Nadia's direct control, because she chooses \\( \\alpha \\). The other rate is not, and measuring it is what turns the eight-loaf embarrassment into a number.

Build a world where the bakery genuinely is short, with a true average of 494 rather than 500, and run the inspection there. Start with eight loaves, the way the first visit went.

```r
short_p <- function(n) {
  batch <- rnorm(n, mean = 494, sd = 9.09)
  t.test(batch, mu = 500, alternative = "less")$p.value
}

set.seed(6)
mean(replicate(10000, short_p(8)) < 0.05)
#> [1] 0.5152
```

**0.5152.** In a world where the loaves really do run six grams light, an eight-loaf check catches it about half the time. The other half of the time it returns a p-value above 0.05, the inspector writes "no evidence of underweight loaves", and the file closes. Nadia's first visit was not unlucky in any unusual way. It was a coin flip, and the coin came down the other way.

Now twenty loaves.

```r
set.seed(6)
mean(replicate(10000, short_p(20)) < 0.05)
#> [1] 0.884
```

**0.884.** Twelve extra loaves take the catch rate from half to seven in eight.

That quantity, the probability of correctly rejecting a false null, is the **power** of the test, and part 4 was entirely about it. It is 1 minus the Type II error rate, so power of 0.884 means a Type II error rate of 0.116. R will compute it directly for this design without the ten thousand imagined inspections.

```r
round(power.t.test(n = 8,  delta = 6, sd = 9.09,
                   type = "one.sample", alternative = "one.sided")$power, 3)
#> [1] 0.516

round(power.t.test(n = 20, delta = 6, sd = 9.09,
                   type = "one.sample", alternative = "one.sided")$power, 3)
#> [1] 0.885
```

Each argument there describes the inspection rather than its result. `n` is how many loaves get weighed, `delta = 6` is the size of shortfall worth catching, `sd = 9.09` is the loaf-to-loaf spread you expect to meet, `type = "one.sample"` says one group weighed against a claimed value, and `alternative = "one.sided"` says the charge points one way. No weight from Nadia's basket goes in, because the question is what an inspection of this shape could find rather than what one did find.

**0.516 and 0.885** from the formula, against 0.5152 and 0.884 from ten thousand simulated inspections each. Two completely different routes to the same pair of numbers.

The same trade turns up in every design, so here it is in general form. An **effect** is the size of the thing you are hoping to detect, measured in spreads rather than in grams: Nadia's six-gram shortfall against a nine-gram loaf-to-loaf spread is about two thirds of a spread, which counts as a fairly large one. The widget compares two groups rather than one basket against a label, so its sample size is per group and its numbers will not line up with Nadia's, but the shape is what to watch. Switch between a small, medium and large effect and see how the chance of detection climbs as the measurements pile up.

::widget power-curve {}

=== step === tryit
::eyebrow Your turn
## Sizing the next inspection

Nadia is writing the council's new inspection protocol and wants a rule that catches a six-gram shortfall at least 80 percent of the time, rather than the coin flip the old one delivered.

`power.t.test` solves for whichever argument you leave out, so leave out `n` and hand it the power you want instead. It takes power as a proportion. Fill in the blank and press Check.

```r
power.t.test(delta = 6, sd = 9.09, power = ____,
             type = "one.sample", alternative = "one.sided")$n
```
::check {"regex":"power\\s*=\\s*0?\\.8","gate":true,"difficulty":"intermediate","ok":"n comes back as 15.6355, and since you cannot weigh two thirds of a loaf, that rounds up to 16. So the protocol needs sixteen loaves, double the eight the first visit managed, and Nadia's twenty comfortably clears it. Worth noticing that this number is fixed before any inspection happens: it depends on the shortfall worth catching and the loaf-to-loaf spread, and not at all on what the loaves turn out to weigh.","no":"The power goes in as a proportion rather than a percentage, so 80 percent is written 0.80."}
::solution
```r
power.t.test(delta = 6, sd = 9.09, power = 0.80,
             type = "one.sample", alternative = "one.sided")$n
#> [1] 15.6355
```

=== step === concept
::eyebrow The two dials
## Why you cannot have both

The two errors have their own symbols and their own dials, and laying them side by side explains why every test involves a compromise rather than a solution.

The Type I error rate is \\( \\alpha \\), which you set directly. The Type II error rate is \\( \\beta \\), read "beta", and power is

\\[ \\text{power} = 1 - \\beta \\]

so Nadia's twenty-loaf inspection has \\( \\beta = 0.116 \\).

| Dial | Effect on false convictions | Effect on missed shortfalls | Cost |
|---|---|---|---|
| Tighten \\( \\alpha \\) to 0.01 | fewer | more | free, but the test misses more |
| Loosen \\( \\alpha \\) to 0.10 | more | fewer | free, but honest bakers get fined |
| Weigh more loaves | unchanged | fewer | more inspection time |
| Weigh more precisely | unchanged | fewer | a better scale |

The first two rows are the trade everybody notices: moving the dashed line on the two-hump picture shrinks one shaded area and grows the other, and no position makes both small. **The last two rows are the ones people forget, and they are the only ones that genuinely improve the test.** More evidence, or less noise in it, narrows both humps and pulls the two error rates down together.

Which is why "what threshold should I use" is much less interesting than it sounds, and "how much evidence do I have" is much more interesting than it sounds.

=== step === quiz
::eyebrow Check yourself
## Which mistake is which

Nadia sets her threshold at 0.05 and her new protocol at sixteen loaves, giving 80 percent power against a six-gram shortfall. Which statement describes what those two numbers control?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Together they say she is wrong 25 percent of the time
- The 0.05 caps how often she fines an honest bakery, and the 80 percent is how often she catches a bakery that really is six grams short ::ok That is exactly the split, and the thing that makes it click is that the two numbers live in different worlds. Alpha is computed inside the world where the bakery is honest, so it governs false convictions and nothing else. Power is computed inside the world where the loaves really are six grams short, so it governs whether a real shortfall gets caught. Only one of those two worlds is the real one, and Nadia never finds out which.
- The 0.05 is how often she misses a short bakery and the 80 percent is how often she fines an honest one
- The 80 percent means 80 percent of the bakery's loaves are underweight ::no The third option has the two errors swapped, which is the most common mix-up of the four. The first adds two rates that cannot be added, because each is conditional on a different state of the world, so at most one of them is even relevant to the bakery in front of her. And the last confuses a property of the inspection design with a fact about loaves: power says nothing about how many individual loaves are short.

=== step === concept
::eyebrow Order of events
## The charge has to come before the evidence

Nadia's test was one-sided, looking only for loaves that are too light. That halved her p-value compared with the two-sided version you ran earlier, 0.003965 against 0.00793, which is a real and legitimate saving. It is legitimate for exactly one reason: the direction was fixed by the complaint, months before anyone weighed anything.

Reverse the order and the same choice becomes something else entirely. Suppose an inspector runs a two-sided test, sees p = 0.08, notices the loaves happen to be light, and switches to a one-sided test to get 0.04. Nothing in the arithmetic objects. The printout looks identical to an honest one-sided test. But the 5 percent false conviction rate is now a fiction, because the direction was chosen to suit the evidence, and a rule that adapts to the data is not the rule whose error rate you calculated.

This is the general failure, and one-sidedness is only its most obvious form. The false conviction rate of 5 percent that you measured across ten thousand honest bakeries assumed one fixed test, decided in advance. Every degree of freedom you keep for yourself after the data arrive inflates it:

- Choosing the direction after seeing which way the result went
- Trying several thresholds and reporting the one that clears
- Dropping the loaf that came out at 480.3 because it "looked wrong"
- Weighing more loaves, checking, and weighing more only while the p-value is falling
- Comparing several things and reporting whichever comparison worked

Every one of those is a decision that a strict reading forbids and a busy afternoon invites. The defence is unglamorous: write the test down before the data arrive, and if you change it afterwards, say so and treat the result as something to check rather than something to act on.

=== step === quiz
::eyebrow Check yourself
## The tempting switch

An inspector runs a two-sided test on a different bakery, gets p = 0.08, notices the loaves are light rather than heavy, and reruns it one-sided to get p = 0.04. What has happened?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing wrong: a one-sided test is more powerful and the loaves were light, so it is the correct test
- Nothing wrong, since the same data cannot support two different conclusions
- The reported 5 percent false conviction rate no longer holds, because the direction was chosen after seeing the data, so the procedure is not the one whose error rate was calculated ::ok Right, and the key is that a p-value belongs to a procedure and not to a number. The 5 percent rate assumed a single test fixed in advance. A procedure that says "run two-sided, and if that fails, run one-sided in whichever direction the data went" convicts honest bakeries far more than 5 percent of the time, because it gets two chances at every bakery. The test as computed is not the test that was actually run.
- The one-sided test is invalid in general and should never be used ::no The first two treat the choice of test as if it could be made from the data, when the whole error rate calculation depends on it having been made before. One-sided tests are perfectly legitimate, as Nadia's was, because her direction came from a complaint months before any weighing, which is what the last option gets wrong in the other direction: the problem is the ordering, not the tool.

=== step === concept
::eyebrow Many charges
## Twelve products is not one test

Sunrise Bakery does not only sell sourdough. It sells twelve packaged lines, all with a weight on the label, and the obvious efficiency is to weigh a basket of each and test all twelve in one visit.

Watch what that does. The widget below runs many studies where **nothing is going on at all**, and counts how false positives pile up as the number of tests rises. Drag the number of tests and watch the count climb.

::widget multiplicity-sim {"kMax": 24, "kStart": 1, "alpha": 0.05, "nStudies": 4000, "corrections": ["none", "bonferroni"], "seed": 29, "study": 1}

Now the same thing on Nadia's own numbers. Take a bakery that is perfectly honest on all twelve lines, test each one, and see how often at least one of the twelve gets convicted.

```r
twelve_lines <- function() {
  min(replicate(12, t.test(rnorm(20, mean = 500, sd = 9.09), mu = 500)$p.value))
}

set.seed(15)
mean(replicate(1000, twelve_lines()) < 0.05)
#> [1] 0.485
```

`twelve_lines()` inspects all twelve products of one honest bakery and hands back the smallest p-value of the twelve, since that is the line an inspector would seize on. Across a thousand honest bakeries, **0.485** of them produced at least one conviction.

Nearly half. Every one of those bakeries was honest by construction. The 5 percent guarantee was never broken on any individual test, and it still adds up to a coin flip, because twelve chances at a one-in-twenty event is not a one-in-twenty event.

The flat histogram from earlier explains it exactly. Under the null a p-value is a uniform random number between 0 and 1, so asking for twelve of them and keeping the smallest is asking for the minimum of twelve random numbers, which lands below 0.05 far more often than one of them would.

There are proper corrections for this. The simplest, **Bonferroni**, divides the threshold by the number of tests, so twelve lines get tested at 0.05 divided by 12, which is about 0.004. The widget's toggle shows what that does: false positives drop back into line, at the cost of making every individual test harder to pass. What is not acceptable is running twelve tests, reporting the one that worked, and quoting 0.05.

=== step === concept
::eyebrow The sentence
## A verdict is not a sentence

Nadia has a conviction. What she does not yet have is the one thing her report actually needs, which is **how short the loaves are**.

The p-value cannot tell her. It answers "is this surprising for an honest bakery" and stops. A shortfall of half a gram would eventually produce a tiny p-value too, given enough loaves, and nobody would fine a bakery over half a gram.

So ask the size question directly.

```r
t.test(loaves, mu = 500)$conf.int
#> [1] 489.7154 498.2246
#> attr(,"conf.level")
#> [1] 0.95

round(500 - mean(loaves), 2)
#> [1] 6.03
```

The best estimate is **6.03 grams short**, and the 95 percent confidence interval says the evidence is compatible with a true average anywhere between **489.72 g and 498.22 g**, which is a shortfall somewhere between about 1.8 g and 10.3 g.

That interval is what Nadia's report should lead with, because it answers the question a magistrate would ask. A shortfall of 1.8 g on a 500 g loaf is about a third of a percent, which is arguably a portioning tolerance. A shortfall of 10.3 g is a little over two percent, which across a year of trading is a great deal of bread that customers paid for and did not get. Her twenty loaves cannot separate those two stories, and the interval says so out loud in a way the p-value never does.

There is a unit-free version of the same thing, useful when comparing across products with different weights and spreads.

```r
round((mean(loaves) - 500) / sd(loaves), 3)
#> [1] -0.663
```

The shortfall divided by the loaf-to-loaf spread comes out at **-0.663**, meaning the average loaf is about two thirds of a standard deviation below label weight. That number is called the **effect size**, and it is the currency that lets a bakery case be compared with a study of anything else, since the grams cancel.

[KEY INSIGHT]
Significance and size are different questions with different answers. A test says whether the evidence rules out the boring claim; an interval says what the evidence is compatible with, in the units of the decision. Report both, and lead with the second.

=== step === quiz
::eyebrow Check yourself
## Significant, or big

A second inspector weighs 4,000 loaves at a large industrial bakery and reports a p-value of 0.000005, with a 95 percent confidence interval for the true average of 499.5 g to 499.8 g. What should the council do?

::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- Prosecute immediately: a p-value that small is overwhelming evidence of underfilling
- Ignore the result, since the p-value being that extreme suggests a mistake
- Rerun the test with fewer loaves so the p-value comes out more reasonable
- Accept that the loaves are genuinely a little under 500 g, and then decide whether a shortfall of between 0.2 and 0.5 grams is worth acting on ::ok Exactly the right order: settle the statistical question, then ask the question that actually matters. The tiny p-value is real and it means the shortfall is almost certainly not zero, but with 4,000 loaves the test can resolve a fraction of a gram, and what it resolved was a fraction of a gram. The interval is what makes the decision obvious, which is why it belongs at the front of the report.
- Prosecute, because any shortfall is a shortfall regardless of size ::no The first and last read the p-value as a measure of how short the loaves are, and it never was one: with enough evidence, a trivially small shortfall produces an extremely small p-value, which is exactly what happened here. The second treats a strong result as suspicious rather than reading the interval it came with. And the third describes throwing away evidence until the answer changes, which is choosing the conclusion rather than measuring it.

=== step === concept
::eyebrow Rules of evidence
## What the test assumes, and what breaks it

A courtroom will not accept any evidence at all, and neither will a test. Nadia's t-test leans on three things, and it will produce a confident, official-looking p-value whether or not they hold.

**The loaves are a fair sample.** Twenty loaves picked because they looked small would convict any bakery in the country. Nadia bought whatever was on the shelf across several visits, without choosing.

**The loaves are independent of each other.** Each one carries its own separate piece of information, so twenty loaves really is twenty pieces of evidence.

**The average behaves like a bell curve.** The individual loaves need not, and with twenty of them the averaging does most of the work. This is the assumption that matters least here, and it becomes a real problem only with tiny samples or wildly lopsided data.

The second one is where real inspections go wrong, so measure what breaks. Suppose all twenty loaves had come from a single morning's bake. The dough for that batch is mixed once, so if it was mixed a little light, **every** loaf in it is light together. Twenty loaves from one batch are not twenty independent pieces of evidence, they are closer to one.

```r
one_batch_p <- function() {
  days_dough <- rnorm(1, mean = 0, sd = 6)
  batch      <- rnorm(20, mean = 500 + days_dough, sd = 7)
  t.test(batch, mu = 500, alternative = "less")$p.value
}

set.seed(9)
mean(replicate(10000, one_batch_p()) < 0.05)
#> [1] 0.3379
```

`days_dough` is drawn once per bakery and shifts the whole batch together, which is what a single mix of dough does; the individual loaves then vary around that shifted level. Everything else is identical, and the total loaf-to-loaf spread still works out around nine grams, so the evidence looks the same on paper.

**0.3379.** A third of completely honest bakeries convicted, against the 5 percent the threshold promises. The test is not broken in any way you could see from its output: the p-values look normal, the printout is identical, and the false conviction rate is nearly seven times what was advertised.

That is what an assumption violation does. It does not throw an error. It quietly makes the number mean something other than what it says, which is why the fix is procedural rather than statistical: Nadia buys loaves across several visits on different days, so the twenty really are twenty.

=== step === concept
::eyebrow Different evidence
## The same five moves, counting instead of weighing

Nadia's colleague suggests a simpler charge that avoids the scale readings entirely: never mind how short each loaf is, just count how many fall below label weight. An honest bakery aiming at 500 should land above and below about equally, so more than half falling short is the evidence.

Thirteen of Nadia's twenty were under 500. Run the same five moves on that.

```r
binom.test(13, 20, p = 0.5, alternative = "greater")
#> 
#> 	Exact binomial test
#> 
#> data:  13 and 20
#> number of successes = 13, number of trials = 20, p-value = 0.1316
#> alternative hypothesis: true probability of success is greater than 0.5
#> 95 percent confidence interval:
#>  0.4419655 1.0000000
#> sample estimates:
#> probability of success 
#>                   0.65
```

Same trial, different evidence. The null hypothesis is that a loaf is equally likely to land above or below 500, so the true proportion is 0.5. The charge is that it is above 0.5. The evidence is 13 out of 20. And the p-value is **0.1316**.

Not proven, on exactly the same twenty loaves that convicted the bakery a few steps ago.

Nothing went wrong. The counting version threw away almost all of the evidence. It knows that 480.3 g and 499.7 g were both "under", and treats a loaf twenty grams short exactly like one that missed by three tenths of a gram. All the information about *how* short is gone, and what remains is not enough to convict.

[NOTE]
When a choice exists between measuring a quantity and counting how many cross a line, the measurement is almost always the stronger test. Counting is worth its cost only when crossing the line is genuinely what matters, as in whether a patient recovers or a part passes inspection.

=== step === concept
::eyebrow The family
## Which test for which evidence

`t.test` and `binom.test` are two members of a large family, and the family resemblance is the point: they all make the same five moves and differ only in what counts as evidence and what curve the null distribution takes.

| The evidence | The question | The R function |
|---|---|---|
| One group of measurements against a claimed value | is the true average 500 g? | `t.test(x, mu = 500)` |
| Two groups of measurements | do these two bakeries differ? | `t.test(x, y)` |
| Two measurements on the same items | did loaves get lighter after the recipe changed? | `t.test(x, y, paired = TRUE)` |
| Counts of successes out of a total | do more than half fall short? | `binom.test(13, 20)` |
| Two proportions | is the short-weight rate worse at branch A? | `prop.test(c(13, 6), c(20, 20))` |
| A table of counts across categories | do shortfalls cluster by day of the week? | `chisq.test(counts)` |
| Measurements with wild outliers or tiny samples | same question, fewer assumptions | `wilcox.test(x, mu = 500)` |
| Three or more groups of measurements | do any of these five branches differ? | `aov(weight ~ branch)` |

Every one of those prints a p-value, and every one of those p-values means precisely what Nadia's meant: how often evidence at least this extreme turns up when the null hypothesis is true. Learn the machine once and the function names become a lookup.

The choice between them is decided by the shape of the evidence rather than by the result, which is the same rule as before: pick the test from the design, before the data are in.

=== step === tryit
::eyebrow Your turn
## A heavier count

Suppose the twenty loaves had been more lopsided, with **16** of the 20 coming in under 500 rather than 13.

Rerun the counting charge with that number and see whether the weaker kind of evidence is enough this time. Fill in the blank and press Check.

```r
binom.test(____, 20, p = 0.5, alternative = "greater")$p.value
```
::check {"regex":"\\b16\\s*,\\s*20\\b","gate":true,"difficulty":"intermediate","ok":"0.005908966, so about 0.006, which clears the 0.05 bar comfortably and would convict. Three extra loaves on the wrong side of the line took the counting charge from not proven to guilty, which shows how sharply this kind of evidence responds near the middle. It also shows the cost of counting: the weighing test convicted on 13 of 20, because it could see how far short each loaf was, while the counting test needed 16 to reach the same verdict.","no":"The first argument is the number of loaves that came in under 500 grams, so put 16 there."}
::solution
```r
binom.test(16, 20, p = 0.5, alternative = "greater")$p.value
#> [1] 0.005908966
```

=== step === concept
::eyebrow The honest limits
## Four things the framework cannot do

The machine is genuinely good at one narrow job. Being clear about the edges is what stops it being asked to do jobs it cannot, and most of those jobs have a different tool waiting for them.

| The question somebody asks | Does a test answer it? | What does |
|---|---|---|
| Is the boring claim ruled out? | yes, that is the whole job | the p-value against a threshold fixed in advance |
| Is the boring claim true? | no | the confidence interval, which shows what is still on the table |
| How likely is it that the loaves are short? | no | Bayesian methods, which also need how common short bakeries are |
| Is the shortfall big enough to act on? | no | the effect size and the interval, read in grams |
| Was the evidence any good? | no, and it will not warn you | the design, decided before anyone weighs anything |

Each row is worth spelling out.

**It cannot tell you the null is true.** Every failure to reject leaves both worlds standing, which is why the eight-loaf file should have said "could not detect" rather than "no evidence of underweight loaves". Ruling something out is the interval's job, not the test's.

**It cannot tell you how likely your hypothesis is.** The p-value runs one way only: from an assumed null to the evidence. Running it backwards, from evidence to how likely the null is, needs something the test never sees, namely how common short-weighting bakeries were before anyone weighed anything. That is a genuine question with a genuine answer, and answering it is Bayesian statistics rather than this framework.

**It cannot tell you anything matters.** Nadia's conviction says the loaves are probably not averaging 500 g. Whether a shortfall of 6 g deserves a fine, a warning or a shrug is a judgement about bread, customers and the law, and no p-value contains it.

**It cannot rescue a badly collected sample.** The arithmetic assumes the evidence was gathered fairly and independently. Feed it twenty loaves from one batch and it returns a confident number with a false conviction rate nearly seven times what it claims, without complaint, as you measured.

None of that makes the framework weak. It makes it a tool with a job description, and the failures worth worrying about all come from asking it to do something outside that description.

=== step === concept
::eyebrow Writing it up
## The report Nadia files

The output of the whole exercise is not a p-value, it is a paragraph somebody else can check. Here is hers.

> Twenty loaves labelled 500 g were purchased from Sunrise Bakery across six visits between 2 and 15 July and weighed on a calibrated scale. Their mean weight was 493.97 g (standard deviation 9.09 g). Testing the pre-specified hypothesis that the true mean is below 500 g gave t = -2.97 on 19 degrees of freedom, p = 0.004, against a significance level of 0.05 fixed before sampling. The estimated shortfall is 6.03 g, with a 95 percent confidence interval for the true mean weight of 489.7 g to 498.2 g. A previous eight-loaf check in January returned p = 0.118; that sample was too small to detect a shortfall of this size reliably, and should not be read as evidence of compliance.

Six sentences, and everything in it is checkable. Four things it does deliberately.

- **It says how the sample was collected**, across six visits, which is what makes the independence assumption believable rather than assumed.
- **It says the hypothesis was pre-specified** and the threshold fixed in advance, which is what makes the p-value mean what it says.
- **It leads the finding with the size and the interval**, not the p-value, because the shortfall is what anybody has to decide about.
- **It corrects the earlier file rather than hiding it.** The January check is not evidence the bakery was fine in January; it is a check that could not have found this.

What the paragraph never says is "the bakery is cheating", or "we accept that the loaves are underweight by 6.03 g", or "there is a 99.6 percent chance the loaves are short". Each of those would claim more than twenty loaves can support.

=== step === concept
::eyebrow The habit
## Four questions for any test

::widget process-flow {"steps":[{"title":"What was the null, exactly?","sub":"which boring claim was the number computed inside"},{"title":"Was the test fixed before the data?","sub":"direction, threshold, and how many tests were run"},{"title":"How big is the effect, with an interval?","sub":"a verdict is not a sentence, and only one of them is a decision"},{"title":"Do the rules of evidence hold?","sub":"fair sample, independent observations, sensible model"}]}

Take them in order, on any test anybody hands you.

**What was the null, exactly?** A p-value with no stated null is not a claim about anything. Ask what world the number was computed inside, and check that it is the boring one.

**Was the test fixed before the data?** One test, decided in advance, has the error rate it advertises. A direction chosen afterwards, a threshold tried twice, or twelve products tested and one reported, does not, and the difference showed up as 5 percent becoming 48.5 percent.

**How big is the effect, with an interval?** The p-value never answers this, and it is almost always the question that matters. If a report gives you a p-value and no interval, the interesting half is missing.

**Do the rules of evidence hold?** A fair sample, independent observations, and a model that suits the data. A violation does not announce itself, so this is the question nobody asks and everybody should.

Four questions, and they catch nearly everything.

=== step === concept
::eyebrow Go deeper
## References

Four places worth an hour if you want to push past where this part stops.

- [The ASA statement on p-values, 2016](https://doi.org/10.1080/00031305.2016.1154108) - the American Statistical Association's six principles, written in plain English after decades of argument. Two pages, and every line earns its place.
- [Greenland and colleagues, Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations, 2016](https://link.springer.com/article/10.1007/s10654-016-0149-3) - twenty-five specific misreadings taken apart one at a time, including the ones about confidence intervals and power that the framework quietly leans on.
- [Wasserstein, Schirm and Lazar, Moving to a world beyond p < 0.05, 2019](https://doi.org/10.1080/00031305.2019.1583913) - the editorial arguing that the threshold itself is the problem, and what to do instead.
- [R documentation for t.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - the function you used all lesson, including the paired and two-sample forms in the family table.

=== step === complete
## Part 5 complete

You started with twenty loaves averaging 493.97 g and ran the whole trial. The bakery was presumed innocent at exactly 500 g, fifty thousand imagined honest bakeries showed what innocent evidence looks like, and Nadia's basket came out more extreme than all but about 4 in 1,000 of them. `t.test` returned the same 0.003965 in one line, which cleared the 0.05 bar fixed before any weighing, so the verdict was guilty.

Along the way the vocabulary stopped being vocabulary. The null hypothesis turned out to be the only claim precise enough to simulate, which is why it gets the presumption. The test statistic turned out to be the evidence measured in units of ordinary wobble, and the curve it lives on turned out to be fatter than a bell curve for a reason you measured: 0.00126 became 0.00394 the moment each simulated bakery had to estimate its own spread. The bar turned out to be 496.485 g on a kitchen scale.

Both mistakes got measured rather than described. Ten thousand honest bakeries were convicted 5.16 percent of the time, which is the threshold doing exactly what it promises, and ten thousand genuinely short ones walked free half the time on eight loaves and one time in eight on twenty. That is why the January file was wrong: not because anyone miscalculated, but because "not proven" got written down as "no evidence of a problem".

Then the machine got abused four ways on purpose, and each abuse left a number behind. Choosing the direction after seeing the data breaks the error rate the p-value claims. Testing twelve product lines took the false conviction rate from 5 percent to 48.5. Reading a verdict as a sentence would have prosecuted an industrial bakery over a third of a gram. And twenty loaves from one morning's dough, which look identical on paper, convicted a third of honest bakeries.

Part 6 picks up the number this part introduced and then walked away from. Nadia's loaves came in two thirds of a spread below label weight, and that quantity, the effect size, is what lets a bakery case be compared with a drug trial or a teaching experiment. Part 6 is about reading it, reporting it, and knowing when two thirds of a spread is a lot.
