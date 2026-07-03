---
title: "Causal Inference for Decisions Lesson 5: Regression Discontinuity"
catalog_blurb: "Read a causal effect from the jump at a cutoff on a running variable."
description: "When treatment switches on at a sharp cutoff, the jump in the outcome at that line is the causal effect. Fit local lines each side in R and choose the bandwidth."
keywords: "regression discontinuity, RDD, running variable, cutoff, bandwidth, local linear regression, sharp RDD, causal inference, treatment effect, R"
post_type: "LESSON"
curriculum_id: "6.180.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "5"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Instrumental-Variables-and-2SLS.html"
course_prev: "Staggered-DiD-and-the-Negative-Weights-Problem.html"
---

=== step === cover
::eyebrow Lesson 5 of 11
## Regression Discontinuity

In Lesson 4, the repair for a staggered rollout was a clean, never-treated group to compare against. Sometimes no such group exists. A scholarship goes to everyone above a score. A drug is prescribed to everyone above a risk threshold. A district gets extra funding whenever its poverty rate crosses a line. Everyone on one side is treated, everyone on the other is not, and the two sides look nothing alike.

Regression discontinuity turns that rigid rule into an opportunity. Right at the cutoff, a student who just cleared the line and one who just missed it are all but identical, except that one got treated. The jump in the outcome exactly at the line is the causal effect.

By the end of this lesson you will be able to:

- Explain why comparing everyone above the cutoff to everyone below it overstates the effect
- Write the sharp-RDD estimand as the jump in the outcome at the cutoff
- Fit a regression discontinuity in R and read the effect off two local lines
- Choose a bandwidth, trading the bias of looking too wide against the noise of looking too narrow

**Prerequisites:** [Lesson 3](Difference-in-Differences-and-Parallel-Trends.html) (the 2x2 DiD) and [Lesson 4](Staggered-DiD-and-the-Negative-Weights-Problem.html) (why a clean untreated group matters). You can fit `lm`, read its coefficients, and subset a data frame in base R.

::widget rdd-cutoff {}

=== step === concept
::eyebrow The setup
## A scholarship, and an unfair comparison

Meet the **Dean's Merit Scholarship** at a large university. Any applicant whose entrance-exam score is **80 or higher** (out of 100) is awarded a **$5,000** scholarship; anyone at 79.9 or below gets nothing. One clean rule, no committee, no appeals. Years later the university asks the obvious question: did the scholarship actually help? It has every student's entrance score, whether they won the money, and their first-year college GPA on the usual 0 to 4 scale.

We will build that data ourselves, so we know the true answer to check against. In our simulated university the scholarship really does lift first-year GPA by **0.30** points, and GPA also rises with entrance score on its own (stronger students earn higher grades, scholarship or not). Each lesson runs in a fresh R session, so we create everything here.

```r
set.seed(5)
n <- 4000
score       <- runif(n, 50, 100)               # entrance-exam score, 50 to 100
cutoff      <- 80
scholarship <- as.integer(score >= cutoff)      # the sharp rule: awarded iff score >= 80
# first-year GPA rises with score AND gets a real +0.30 bump from the scholarship
gpa <- 2.7 + 0.045 * (score - cutoff) - 0.0008 * (score - cutoff)^2 +
       0.30 * scholarship + rnorm(n, 0, 0.22)
college <- data.frame(score = round(score, 1), scholarship, gpa = round(gpa, 2))
head(college)
#>   score scholarship  gpa
#> 1  60.0           0 1.82
#> 2  84.3           1 3.03
#> 3  95.8           1 3.54
#> 4  64.2           0 1.60
#> 5  55.2           0 0.80
#> 6  85.1           1 2.86
```

The obvious way to measure the scholarship's effect is to compare the average GPA of the winners against the losers.

```r
winners <- mean(college$gpa[college$scholarship == 1])
losers  <- mean(college$gpa[college$scholarship == 0])
round(c(winners = winners, losers = losers, gap = winners - losers), 2)
#> winners  losers     gap 
#>    3.34    1.79    1.55
```

Winners average a 3.34 GPA, losers a 1.79: a gap of **1.55** grade points. That is more than five times the 0.30 the scholarship truly delivers. Take it at face value and you would credit a $5,000 cheque with turning a C student into an A student. Something is badly off.

=== step === concept
::eyebrow Why it happens
## The exam score is a confounder

The winners did not differ only by a scholarship. They also scored higher on the entrance exam, by construction: everyone at 80 or above is a winner. And entrance score is exactly the kind of thing that predicts college GPA on its own. The students who ace the entrance exam tend to be the students who go on to earn high grades, scholarship or not.

So the 1.55 gap blends two things: the small nudge from the money, and the large head start in ability that won the scholarship in the first place. Plot GPA against entrance score and the problem is visible at a glance.

```r
library(ggplot2)
p_scatter <- ggplot(college, aes(score, gpa, colour = factor(scholarship))) +
  geom_point(alpha = 0.35, size = 0.9) +
  geom_vline(xintercept = 80, linetype = "dashed") +
  scale_colour_manual(values = c("0" = "grey60", "1" = "#c0392b"),
                      labels = c("no scholarship", "scholarship"), name = NULL) +
  labs(x = "entrance-exam score", y = "first-year GPA",
       title = "GPA climbs with score; winners sit on the high-score side")
print(p_scatter)
```

The cloud of points slopes steadily upward on both sides of the line: higher score, higher GPA. The winners (right of the dashed cutoff) sit high not mainly because of the scholarship but because they are further up that slope. In the language of the last two lessons, entrance score is a **confounder**: it drives who gets treated and it drives the outcome.

The same picture is the confounding triangle you have seen before. Read it with **Z as the entrance score, X as the scholarship, and Y as first-year GPA**.

::widget causal-dag {}

Score (Z) decides the scholarship (Z to X, the rule is deterministic) and score also drives GPA (Z to Y). Leave score out of the comparison and its influence gets wrongly loaded onto the scholarship. Usually the cure is to control for the confounder. Regression discontinuity does something cleverer, and it turns on one special feature of a cutoff.

=== step === concept
::eyebrow The key idea
## Compare students on either side of the line

Here is that special feature. Whether you land on 79 or 81 on an entrance exam is close to luck: a lucky guess, one generous grader, a good night's sleep. Nobody can place themselves at exactly 80. So among the students clustered right around the cutoff, who ends up just above and who ends up just below is essentially random, which is precisely the situation an experiment manufactures on purpose.

A student who scored 79.6 and one who scored 80.4 are, on average, all but identical in ability, ambition, and background. The only systematic difference between them is the scholarship. Compare the two groups in a narrow window around the cutoff and the ability head start cancels out, leaving just the effect of the money.

Formally, let \(X\) be the running variable (the entrance score), \(c\) the cutoff (here \(c = 80\)), and \(Y\) the outcome (first-year GPA). The sharp-RDD effect is the jump in the average outcome as you cross the cutoff:

\[ \tau_{\text{RDD}} = \lim_{x \downarrow c} \operatorname{E}[Y \mid X = x] \; - \; \lim_{x \uparrow c} \operatorname{E}[Y \mid X = x] \]

Read it in words: \(\lim_{x \downarrow c}\) is the average GPA for students approaching the cutoff from just **above** (the treated side), \(\lim_{x \uparrow c}\) is the average for students approaching from just **below** (the untreated side), and \(\tau_{\text{RDD}}\) is the vertical gap between them exactly at the line. Everything else about a student varies smoothly through the cutoff; only treatment jumps, so only the jump in \(Y\) can be caused by treatment.

[KEY INSIGHT]
RDD does not need an untreated group that resembles the treated group overall. It only needs the two sides to be comparable right **at the cutoff**. You trade away every student far from the line to buy a clean comparison near it.

=== step === quiz
::eyebrow Check yourself
## What does the jump measure?

A colleague reports that the scholarship "raises GPA by 1.55 points" from the winners-minus-losers gap, and suggests regression discontinuity as a more careful check. Which statement is correct?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The 1.55 gap is already unbiased; RDD will return the same number, just more precisely ::no The 1.55 gap is biased upward. Winners scored higher on the entrance exam, and higher scorers earn higher GPAs on their own, so the gap mixes the scholarship's effect with an ability head start. RDD is built to strip that head start out, and will return a much smaller number.
- The 1.55 gap is inflated by the ability difference between winners and losers; RDD isolates the effect by comparing students just above and just below the cutoff ::ok Right. Far-apart winners and losers differ in ability as well as treatment. Near the cutoff that difference vanishes, so the jump at the line reflects the scholarship alone.
- RDD removes the bias by controlling for entrance score in a single full-sample regression that uses every student ::no That is ordinary covariate adjustment, and it leans entirely on the outcome model being right across the whole score range. RDD instead restricts attention to a window around the cutoff, where the comparison is credible without trusting a global model.

=== step === tryit
::eyebrow In R
## Fit a line each side, read the gap

Time to compute the jump. Three moves. **First**, center the running variable at the cutoff, so the cutoff sits at \(x = 0\) and each fitted line's height at zero is its edge at the cutoff. **Second**, fit a straight line to the students just below (within a bandwidth \(h\) of the cutoff) and another to the students just above. **Third**, read each line's height at \(x = 0\) and subtract: that gap is the estimated effect.

Fill in the point at which we read both lines.

```r
college$x <- college$score - cutoff             # center: the cutoff is now x = 0
h <- 6                                           # bandwidth: keep students within 6 points of 80
left  <- lm(gpa ~ x, data = college, subset = x < 0 & x >= -h)   # just below the cutoff
right <- lm(gpa ~ x, data = college, subset = x >= 0 & x <=  h)  # just above the cutoff
# the effect is the gap between the two fitted lines, read exactly at the cutoff:
jump <- predict(right, data.frame(x = ____)) - predict(left, data.frame(x = ____))
round(unname(jump), 2)
```
::check {"regex":"x\\s*=\\s*0","gate":true,"difficulty":"intermediate","ok":"That reads each line at the cutoff and differences them: about 0.32, right on the true 0.30 and nowhere near the naive 1.55.","no":"Read both lines at the cutoff itself. Because you centered the score, the cutoff is x = 0, so evaluate each predict() at data.frame(x = 0)."}
::solution
```r
college$x <- college$score - cutoff
h <- 6
left  <- lm(gpa ~ x, data = college, subset = x < 0 & x >= -h)
right <- lm(gpa ~ x, data = college, subset = x >= 0 & x <=  h)
jump <- predict(right, data.frame(x = 0)) - predict(left, data.frame(x = 0))
round(unname(jump), 2)
#> [1] 0.32
```

=== step === widget
::eyebrow The one real choice
## How wide a window? Bias against variance

You picked a bandwidth of 6 without comment, and it is the only real judgement call in a sharp RDD. The bandwidth \(h\) is the half-width of the window: keep only students within \(h\) points of the cutoff and throw the rest away.

Two forces pull against each other. Make the window **narrow** and every point is genuinely close to the cutoff, so the comparison is clean (low bias), but you keep few students, so the estimate is noisy (high variance). Make the window **wide** and you gather many students (low variance), but you start borrowing points far from the cutoff, where the GPA-score relationship curves, and a straight line through curved data misreads the jump (high bias). Drag the bandwidth below and watch the estimate and its wobble trade off.

::widget rdd-cutoff {}

Now the same tradeoff in our own data. Fit the RDD at four bandwidths and report the estimate, its standard error, and how many students it used.

```r
rdd_at <- function(h) {
  l <- lm(gpa ~ x, college, subset = x < 0 & x >= -h)
  r <- lm(gpa ~ x, college, subset = x >= 0 & x <=  h)
  pl <- predict(l, data.frame(x = 0), se.fit = TRUE)
  pr <- predict(r, data.frame(x = 0), se.fit = TRUE)
  data.frame(bandwidth = h,
             estimate  = round(unname(pr$fit - pl$fit), 2),
             std_error = round(sqrt(pl$se.fit^2 + pr$se.fit^2), 3),
             students  = nrow(model.frame(l)) + nrow(model.frame(r)))
}
do.call(rbind, lapply(c(3, 6, 12, 25), rdd_at))
#>   bandwidth estimate std_error students
#> 1         3     0.31     0.042      511
#> 2         6     0.32     0.029      990
#> 3        12     0.29     0.020     1917
#> 4        25     0.25     0.015     3617
```

Read down the table. As the window widens the standard error falls steadily, from 0.042 to 0.015, because each fit uses more students: that is variance dropping. But the estimate drifts away from the truth, from 0.31 at the tightest window to 0.25 at the widest, because the curve in the GPA-score relationship leaks into the straight-line fit: that is bias creeping in. The narrow windows sit right on the true 0.30 but wobble; the widest is precise about the wrong number.

The best bandwidth minimizes the total error, bias and variance together:

\[ \operatorname{MSE}(h) \;=\; \operatorname{Bias}(h)^2 + \operatorname{Var}(h) \]

which lands somewhere in the middle, near \(h = 6\) here. In practice you do not eyeball it: packages such as `rdrobust` estimate both pieces and pick the bandwidth for you. The lesson to carry is the shape. Wider is not safer, and reporting the estimate at a couple of sensible bandwidths is how you show the answer is not an artefact of one arbitrary window.

=== step === concept
::eyebrow When it breaks
## Is the design credible? Two checks

RDD rests on one assumption: everything about a student except treatment varies **smoothly** through the cutoff. If that holds, the only thing that can jump at the line is the effect of treatment. Two things can break it, and each has a check you should run every time.

**First, manipulation.** If students could nudge themselves over the line, say by retaking the exam until they scraped an 80, then the ones just above the cutoff would be the strivers, systematically different from the ones just below, and the comparison would be contaminated. The tell-tale sign is a pile-up: too many students bunched just above the cutoff and a hole just below. Count students in narrow score bins around the line and look for a spike.

```r
library(ggplot2)
near <- subset(college, score >= 70 & score <= 90)
p_density <- ggplot(near, aes(score)) +
  geom_histogram(binwidth = 1, fill = "grey70", colour = "white") +
  geom_vline(xintercept = 80, linetype = "dashed") +
  labs(x = "entrance-exam score", y = "number of students",
       title = "No pile-up at the cutoff: nobody engineered their way over the line")
print(p_density)
```

The bars step along smoothly and the count does not jump at 80: no evidence of gaming. (This is the idea behind the formal McCrary density test.)

**Second, a placebo test.** If the jump at 80 is really caused by the scholarship, then a made-up cutoff where nothing actually changes, say 70 or 90, should show no jump. Re-run the same local-line estimate at fake cutoffs.

```r
placebo <- function(c0, h = 6) {
  d <- college
  d$r <- d$score - c0                            # distance from this (maybe fake) cutoff
  lo <- lm(gpa ~ r, d, subset = r < 0 & r >= -h)
  hi <- lm(gpa ~ r, d, subset = r >= 0 & r <=  h)
  unname(predict(hi, data.frame(r = 0)) - predict(lo, data.frame(r = 0)))
}
round(c(real_cutoff_80 = placebo(80), fake_70 = placebo(70), fake_90 = placebo(90)), 2)
#> real_cutoff_80        fake_70        fake_90 
#>           0.32          -0.02          -0.04
```

A clear 0.32 jump at the real cutoff, essentially nothing (-0.02 and -0.04) at the fakes. Exactly what a real effect looks like: the outcome jumps only where treatment actually switches on, and nowhere else.

=== step === quiz
::eyebrow Check yourself
## Would this break the design?

Suppose you learn that students at this university can retake the entrance exam as often as they like, and many who first scored in the high 70s kept retaking until they cleared 80. What does this do to the scholarship RDD, and how would you catch it?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing: retaking only adds noise to the score, which RDD handles automatically ::no Retaking is not random noise. The students who grind past 80 are the more motivated ones, so those just above the cutoff now differ systematically from those just below, exactly the smoothness the design needs. This is a real threat, not harmless noise.
- It strengthens the design, because more students end up near the cutoff ::no More students near the cutoff helps precision only if they arrived there by chance. Here they arrived by effort, which is precisely what makes the two sides no longer comparable.
- It threatens the design by sorting motivated students just above the cutoff; a density check would reveal a pile-up above 80 ::ok Exactly. Non-random sorting across the cutoff breaks the core assumption, and it leaves a fingerprint: a spike in the number of students just above 80 and a dip just below, which the density histogram is built to catch.

=== step === concept
::eyebrow Read the fine print
## The effect is local, and that is the catch

One honest caveat, and it is the price of the whole method. Regression discontinuity estimates the effect of the scholarship for students **right at the cutoff**, those who scored close to 80. It says nothing directly about a student who scored 55, or one who scored 98. Those students are far from the line, and RDD deliberately threw them away to buy its clean comparison.

This is called a **local** effect (a local average treatment effect, or LATE, at the cutoff). It is a genuine limit on what you can conclude:

- The number answers "what does the scholarship do for a borderline applicant?", not "what would it do for everyone?".
- If the scholarship helps weak students far more than borderline ones, RDD will not tell you: its window never sees them.
- Extending the finding to students far from the cutoff is an assumption, not a result.

[KEY INSIGHT]
A regression discontinuity buys unusually credible causal identification, with no untreated look-alike group required, at the cost of unusually narrow reach: a trustworthy answer about the students at the line, and only them.

One extension is worth naming. We assumed the cutoff switches treatment on with certainty (a **sharp** design): score 80, get the scholarship, no exceptions. When the cutoff only changes the **probability** of treatment, some winners decline, some losers find other funding, the design is **fuzzy**, and the fix is to scale the jump in the outcome by the jump in take-up. That ratio is an instrumental-variables estimate, which is exactly where the next lesson begins.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take regression discontinuity further:

- [Thistlethwaite and Campbell (1960), Regression-Discontinuity Analysis (Journal of Educational Psychology)](https://doi.org/10.1037/h0044319) - the paper that invented RDD, on merit-scholarship awards and later achievement: the exact design in this lesson.
- [Lee and Lemieux (2010), Regression Discontinuity Designs in Economics (Journal of Economic Literature)](https://doi.org/10.1257/jel.48.2.281) - the standard practitioner's guide: assumptions, estimation, and validity checks in depth.
- [Imbens and Lemieux (2008), Regression discontinuity designs: A guide to practice (Journal of Econometrics)](https://doi.org/10.1016/j.jeconom.2007.05.001) - a focused treatment of local linear estimation and how to choose the bandwidth.
- [Cunningham, Causal Inference: The Mixtape, RDD chapter](https://mixtape.scunning.com/06-regression_discontinuity) - a from-scratch walk-through with runnable R, free online.
- [rdrobust (CRAN)](https://cran.r-project.org/package=rdrobust) - the production package: data-driven optimal bandwidths and robust confidence intervals, the automatic version of what you built by hand.

=== step === complete
## Lesson 5 complete

You turned a rigid rule into a natural experiment. A raw comparison of scholarship winners and losers claimed a 1.55-point GPA boost, five times the truth, because winners were simply stronger students. By zooming in on the narrow window around the score-80 cutoff, where who lands just above and just below is as good as random, you read the effect straight off the jump between two local lines: about 0.32, right on the planted 0.30. You saw the one real choice, the bandwidth, trade bias against variance, and you ran the two checks, a density with no pile-up and placebo cutoffs with no jump, that make the design believable.

Next, Lesson 6: Instrumental Variables and 2SLS. The fuzzy-RDD ratio you just met, the outcome jump over the treatment jump, is one instance of a much broader idea: when treatment is tangled up with the outcome, find a lever that moves treatment without touching the outcome any other way, and use it to recover the effect. You will build the two-stage estimator by hand and learn to spot the weak-instrument trap that quietly derails it.
