---
title: "Choosing Statistical Tests Lesson 2: Checking assumptions and what breaks them"
catalog_blurb: "Which assumptions actually damage your interval, and which barely matter at all."
description: "A tutoring study, simulated 2,000 times per severity, shows unequal variance and dependent students wreck an interval while normal errors barely touch it."
keywords: "hypothesis test assumptions, normality assumption, equal variance, heteroskedasticity, independence assumption, intraclass correlation, design effect, Shapiro-Wilk test, residual plot, confidence interval coverage, R"
post_type: "LESSON"
curriculum_id: "4.40.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-test-selection"
course_title: "Choosing Statistical Tests"
course_lesson: "2"
course_total: "6"
course_landing: "Choosing-Statistical-Tests-Course.html"
course_next: "Nonparametric-Tests-Wilcoxon-and-Kruskal-Wallis.html"
course_prev: "Choosing-the-Right-Test.html"
---

=== step === cover
## Checking assumptions and what breaks them

Today let's understand why a statistical test's assumptions are not all equally risky to break.

A school district wants to know if more tutoring helps. It picks 12 classrooms of 5 students each, 60 students in total, and gives each classroom a different number of weekly tutoring hours, from 0 up to 10. At the end of term it records every student's gain on a final exam, then fits a regression line through the 60 points: tutoring hours on one axis, exam gain on the other.

That line has a slope, and the slope comes with a standard error and a 95% confidence interval. The test behind that interval is the same t machinery behind an ordinary t-test, and it rests on three assumptions: the errors around the line are normally distributed, they spread out by the same amount regardless of tutoring hours, and every student's result is independent of every other student's.

::widget process-flow {"steps":[{"title":"Normal errors","sub":"the mildest of the three"},{"title":"Equal error variance","sub":"coverage slips while the fit looks fine"},{"title":"Independent observations","sub":"the one that does the most damage"}]}

Those three are not equally dangerous to break, as the labels above already hint: one barely registers, one does real damage, and one sits in between.

=== step === concept
## The classroom tutoring study, and the test riding on it

Let's build that tutoring study for real, so every number in this lesson has somewhere to come from.

Twelve classrooms of five students each get a different number of weekly tutoring hours: classroom 1 gets 0 hours, classroom 12 gets 10 hours, and the ten classrooms in between get hours spread evenly across that range. Every student's exam gain is the classroom's tutoring hours times a fixed effect, plus ordinary random noise.

Press Run.

```r
# Build the tutoring study: 12 classrooms of 5 students, hours 0 to 10 by classroom
set.seed(42)
classroom <- rep(1:12, each = 5)
hours     <- rep(seq(0, 10, length.out = 12), each = 5)
examGain  <- round(2 + 1.8 * hours + rnorm(60, mean = 0, sd = 4), 2)
study     <- data.frame(classroom, hours, examGain)

fit <- lm(examGain ~ hours, data = study)
round(summary(fit)$coefficients["hours", ], 3)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>      1.603      0.189      8.467      0.000 

round(confint(fit)["hours", ], 3)
#>  2.5 % 97.5 % 
#>  1.224  1.981 

round(summary(fit)$r.squared, 3)
#> [1] 0.553
```

Read the first line. Every extra hour of tutoring raises exam gain by about 1.6 points, with a standard error of 0.19. The t value is 8.47 and the p-value is far below the usual 0.05 cutoff, small enough to round to 0.000 at three decimals.

The second line is the 95% confidence interval for that slope: 1.22 to 1.98. That interval, and the test behind it, is the real subject here: whether it still means what it claims once the assumptions under it are broken. The third line, R-squared of 0.553, says this one line explains about 55% of the variation in exam gain. Hold onto that number: a later step shows R-squared staying almost exactly this calm even while the interval above it falls apart.

Every one of those three numbers, the slope's standard error, the confidence interval, and R-squared, is computed assuming the errors around the line are normally distributed, equally spread out, and independent of each other.

=== step === concept
## Coverage: the number this lesson watches
::prose-only defines coverage and contrasts it with R-squared before any dial is dragged; the dial widgets that measure both arrive in the next three steps

Before dragging any dial, it helps to be precise about what the "95%" in that confidence interval actually promises.

Imagine running the exact same 60-student study thousands of times: the same 12 classrooms, the same tutoring hours assigned to each, but a fresh batch of students and a fresh draw of random noise every time. Each run gives its own slope and its own 95% interval around that slope. Coverage is the share of those thousands of intervals that actually contain the true slope, the one built into the simulation. When every assumption holds, coverage should land close to 95%, which is exactly what "95% confidence" means.

R-squared measures something different: how well the fitted line matches the data in front of it. A violated assumption can break coverage without touching R-squared, because a confidence interval and a fitted line are two separate readings of the same data.

That is exactly what the next three widgets measure. Each one runs 2,000 of these simulated studies at every setting of a dial, and plots coverage and R-squared side by side as the dial moves from no violation to a severe one.

=== step === widget
## Dragging non-normality: the mildest violation

The first assumption to test is the easiest one to picture: that the errors scattered around the regression line are shaped like a bell curve.

The dial below runs the tutoring study's own numbers, 60 students, 2,000 times at every setting, but replaces the ordinary bell-shaped noise with a skewed one. At the left, the noise is normal and nothing is broken. Drag the dial all the way to the right and the noise becomes heavily skewed, with a skewness of 4.18 against the 0 a normal distribution has.

::widget assumption-dial {"assumption":"normality","n":60,"levels":11,"seed":17}

Watch the two numbers on the plot, not just the dial. With no skew, coverage sits at about 95.1%, right where 95% confidence promises. Drag to the most severe skew and coverage barely moves, down to about 95.0%, while R-squared actually creeps up a little, from about 0.504 to 0.549.

That holds for a reason worth naming. A slope estimate is an average taken over many rows of data, and the Central Limit Theorem says an average gets close to normal as the sample grows, almost regardless of what each individual row's error looks like. So the interval survives an error distribution that does not look anything like a bell, which makes non-normal errors the mildest of the three assumptions this lesson tests.

=== step === widget
## Dragging unequal variance: the interval slips while the fit stays calm

The second assumption is that the spread of the errors around the line stays the same no matter how many tutoring hours a classroom gets. Break that, and the spread grows or shrinks across the range, which statisticians call heteroskedasticity, literally "different spread."

::widget assumption-dial {"assumption":"heteroskedasticity","n":60,"levels":11,"seed":17}

At the dial's baseline the spread is constant and coverage sits at about 94.7%, close to the promised 95%. Drag to the middle, where the widest spread is about 9 times the narrowest, and coverage falls to 88.6%. Push it all the way to the far end, an 81-fold spread, and coverage drops further, to 70.9%. Through all of that, R-squared barely moves: about 0.506 at the baseline, 0.513 in the middle, 0.546 at the far end.

That split is the whole point of this step. The ordinary standard error formula assumes one constant spread for every row, so once the real spread varies, that formula understates how uncertain the slope estimate actually is, and the interval built from it comes out too narrow. The fit itself is not wrong, the line still sits through the middle of the data, which is exactly why R-squared does not notice. The repair is not a different model; it is a different standard error, usually Welch's correction or a heteroskedasticity-robust standard error, built to handle spread that is not constant.

=== step === widget
## Dragging dependence: the worst of the three

The third assumption is independence: that one student's result tells you nothing extra about another's, once tutoring hours are accounted for. The tutoring study makes that assumption shaky by construction. Students inside the same classroom share a teacher, a room, and a dozen other things a simple regression never measures, so two students in classroom 7 are likely to be more alike than two students picked from different classrooms.

The dial below is built around exactly that structure: 60 students split into 12 clusters of 5, the same shape as the tutoring study's classrooms. It moves a number called the intraclass correlation, written ICC, which measures how much students inside one cluster resemble each other compared to students in different clusters. An ICC of 0 means classroom membership tells you nothing extra; an ICC of 1 would mean every student in a classroom gives the identical result.

::widget assumption-dial {"assumption":"independence","n":60,"levels":11,"seed":17}

At the baseline, ICC is 0 and coverage sits at about 95.2%, as it should. Drag the dial to its middle, ICC = 0.3, a realistic value for real classrooms, and coverage falls to 79.0%. Push it to ICC = 0.6 and coverage falls further still, to 68.6%, the worst damage any of the three assumptions did in this lesson. And once again, R-squared barely flinches: about 0.504, 0.511, and 0.526 at those same three settings.

Here is the arithmetic behind that damage. With cluster size m (5 students per classroom here) and intraclass correlation rho, the design effect is `1 + (m - 1) * rho`, the factor by which clustering inflates the variance of the slope estimate beyond what 60 truly independent students would give. At ICC 0.3, the design effect is 1 + 4 * 0.3 = 2.2. At ICC 0.6, it is 1 + 4 * 0.6 = 3.4. Dividing the real sample size by the design effect gives the effective sample size, the number of independent students' worth of information the data actually carries. At ICC 0.3, that is 60 / 2.2, about 27 students. At ICC 0.6, it is 60 / 3.4, about 17.6.

That is why this is the one assumption an ordinary robust standard error does not repair. A robust standard error corrects for unequal spread, but it still assumes every row is a fresh, independent piece of information. Clustering breaks exactly that assumption, so fixing it needs a standard error that knows which rows belong to the same classroom, not just one that tolerates unequal spread.

=== step === concept
## Why a preliminary normality test is unreliable

Normality turned out to be the mildest of the three assumptions to break, yet it is the one most people actually test for before picking a method. A common habit is to run a normality test, usually the Shapiro-Wilk test, before choosing between a t-test and a test that does not assume normal errors. If the test comes back significant, pick the second one; if not, use the t-test. It sounds sensible. It is not reliable, and simulation shows exactly why.

The Shapiro-Wilk test checks one sample of data and returns a p-value for the null hypothesis that the data came from a normal distribution. A small p-value, conventionally below 0.05, counts as a flag.

Let's test the test, by simulation, 4,000 times at two sample sizes, using the same severe skew from three steps back and a milder one.

```r
# Shapiro-Wilk power and one-sample t coverage, by simulation, against the same
# skew as the normality dial: severe (skewness 4.18) at n = 10, mild (0.78) at n = 200
set.seed(11)
sims <- 4000

skewLN <- function(sg) { w <- exp(sg^2); (w + 2) * sqrt(w - 1) }
sg_severe <- 0.85                                   # skewness 4.18, same as the normality dial's worst case
sg_mild   <- uniroot(function(sg) skewLN(sg) - 0.78, c(0.01, 0.85))$root

draw_skew <- function(n, sg) {
  mu  <- exp(sg^2 / 2)
  sdl <- sqrt((exp(sg^2) - 1) * exp(sg^2))
  (exp(sg * rnorm(n)) - mu) / sdl                   # standardised lognormal, mean 0, sd 1
}

n1 <- 10
flagged <- logical(sims)
covered <- logical(sims)
for (i in seq_len(sims)) {
  x <- draw_skew(n1, sg_severe)
  flagged[i] <- shapiro.test(x)$p.value < 0.05
  ci <- t.test(x)$conf.int
  covered[i] <- ci[1] < 0 && 0 < ci[2]
}
round(c(shapiro_power = mean(flagged), t_coverage = mean(covered)), 3)
#> shapiro_power    t_coverage 
#>         0.503         0.872 

n2 <- 200
flagged2 <- logical(sims)
for (i in seq_len(sims)) {
  x <- draw_skew(n2, sg_mild)
  flagged2[i] <- shapiro.test(x)$p.value < 0.05
}
round(c(shapiro_flag_rate = mean(flagged2)), 3)
#> shapiro_flag_rate 
#>             0.966 
```

Read the first result. At a small sample, n = 10, testing the same severe skew from three steps back, the Shapiro-Wilk test catches it only 50.3% of the time: `shapiro_power` is 0.503, no better than a coin flip. And at that same small sample, a one-sample t-test's own coverage really is damaged, down to 87.2%, because 10 rows is not enough for the Central Limit Theorem to rescue the average yet.

Now read the second result. At a large sample, n = 200, a far milder skew of just 0.78, mild enough that it would barely touch a t-test's coverage, still gets flagged by the Shapiro-Wilk test 96.6% of the time.

Put those two results together and the pretest fails in both directions. It misses real trouble when the sample is small, exactly when a t-test's coverage is actually in danger. And it raises a flag on harmless trouble once the sample is large, because with enough rows the test can detect a skew too small to matter. A single pass or fail from a preliminary test is not something you can act on either way.

=== step === widget
## Reading trouble straight off a residual plot

If a pass or fail test is not reliable, what should you actually look at instead? The practical answer is a plot, not a single number: a residuals-vs-fitted plot, which puts each fitted value from the model on the x axis and its residual, the gap between the actual and fitted value, on the y axis.

The widget below switches between three fits of its own built-in data, not the tutoring study, so treat them as three fresh small examples rather than a continuation of the classrooms above.

::widget residual-plot {"start":"healthy"}

A healthy fit shows residuals scattered in a flat, even band around zero, with no pattern as the fitted value changes. That is what the assumptions tested in this lesson actually look like when they hold.

Switch to the funnel view. The spread of the residuals visibly grows as the fitted value increases, which is the visual signature of the equal-variance violation from a few steps back: the model is far less certain about its big predictions than its small ones, and the plot shows it directly.

Switch to the curved view. Here the residuals bend into a clear U shape instead of scattering flat, which is a different problem from the three this lesson tested: the straight line itself is the wrong shape, missing some curve in the real relationship. This plot, read once after fitting any model, is the practical replacement for a pass or fail pretest: it shows the actual shape of the trouble instead of a single number that can miss it in either direction.

=== step === quiz
## Quick check: which violation actually matters

Suppose an analyst introduces one of the three violations from this lesson into their own regression, checks R-squared, sees it barely moved, and concludes the confidence interval is still fine. What is wrong with that conclusion?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Non-normal errors are usually the assumption most likely to be behind what the analyst saw. ::no Normality was the mildest of the three violations in this lesson: coverage barely moved even at a skewness of 4.18. Equal variance and independence did far more damage while R-squared stayed just as calm.
- A Shapiro-Wilk test run earlier in the analysis would have caught this. ::no A Shapiro-Wilk test checks for non-normality specifically, and even there it is unreliable: weak at small samples and prone to flagging skew too mild to matter at large ones. It says nothing about equal variance or independence at all.
- A steady R-squared says nothing about whether the interval still covers the true value. ::ok Right. Across all three violations in this lesson, R-squared barely moved while coverage swung from about 95% down to under 70% in the worst case. Fit and coverage are two separate readings of the same data.
- Equal variance is the one assumption that never touches a confidence interval. ::no Not quite. Across all three violations in this lesson, R-squared barely moved while coverage swung from 95% down to below 70% in the worst case. A model's fit and a confidence interval's coverage are two separate things, and a steady fit on its own tells you nothing about whether the interval still covers.

=== step === tryit
## Your turn: the real cost of 60 dependent rows

The independence dial's worst setting, ICC = 0.6, is the most damaging violation in this lesson. Compute the price of it yourself.

```r
# The tutoring study's numbers at the independence dial's worst severity
m   <- 5     # students per classroom
rho <- 0.6   # intraclass correlation, the dial's worst severity
n   <- 60    # students in the tutoring study

# Compute the design effect, 1 + (m - 1) * rho, call it design_effect.
# Then divide n by it to get the effective sample size, call it effective_n.
# Two lines. Press Check when you have them.
```
::check {"regex": "design_effect\\s*(?:<-|=)\\s*1\\s*[+]\\s*[(]m\\s*-\\s*1[)]\\s*[*]\\s*rho[\\s\\S]*effective_n\\s*(?:<-|=)\\s*n\\s*/\\s*design_effect", "gate": true, "difficulty": "intermediate", "ok": "Right. The design effect is 1 + 4 * 0.6 = 3.4, and 60 / 3.4 is about 17.6. At this severity, those 60 clustered students carry only about 17.6 independent students' worth of information.", "no": "The design effect is 1 + (m - 1) * rho, the factor the variance is inflated by; divide n by it to get the effective sample size. At m = 5 and rho = 0.6 that is 1 + 4 * 0.6 = 3.4, so about 60 / 3.4 = 17.6 students' worth of real information."}
::solution
```r
# Complete the two lines: the design effect, then the effective sample size
design_effect <- 1 + (m - 1) * rho
effective_n <- n / design_effect
round(c(design_effect = design_effect, effective_n = effective_n), 1)
#> design_effect   effective_n 
#>           3.4          17.6 
```

That 17.6 is the real sample size this study carries once classroom clustering is accounted for, not the 60 that the raw row count suggests. The 60 students were never 60 independent pieces of information, because students who share a classroom share more than tutoring hours alone.

=== step === concept
## References

- [shapiro.test() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/shapiro.test.html) - R Core Team. Implements the test from Shapiro, S.S. and Wilk, M.B. (1965), "An analysis of variance test for normality (complete samples)," Biometrika 52(3/4), 591-611, examined in this lesson.
- [t.test() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team. Its unequal-variance default is Welch's correction, from Welch, B.L. (1947), "The generalization of 'Student's' problem when several different population variances are involved," Biometrika 34(1/2), 28-35, the repair named for unequal variance.
- [lm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html) - R Core Team. The function behind the tutoring study's slope.
- [confint() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html) - R Core Team. The function behind the tutoring study's interval.
- Kish, L. (1965). Survey Sampling. John Wiley & Sons. The source of the design effect computed for clustered data.

=== step === complete
## One rule, three different outcomes

Three assumptions, tested by simulation on the same 60-student study, gave three different answers.

- Non-normal errors: mild. Even a skewness of 4.18 barely touched the confidence interval's coverage, because an average of many rows is close to normal almost regardless of each row's own shape.
- Unequal variance: moderate. Coverage fell as the spread grew, down to 70.9% at its worst, while the fit itself stayed calm. A heteroskedasticity-robust standard error repairs it.
- Dependent observations: the worst of the three. Coverage fell to 68.6% at the dial's worst setting, and the fix needs a standard error that knows which rows belong together, which an ordinary robust standard error does not provide.

One habit ties all of this together: read a residuals-vs-fitted plot once a model is fit, rather than leaning on a single preliminary test that is unreliable in both directions. The next lesson turns to what to do when the outcome itself cannot carry a mean-based test at all, and ranks are the better tool.
