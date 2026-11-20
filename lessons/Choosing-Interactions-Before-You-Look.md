---
title: "Regression Modeling Strategies Lesson 3: Choosing interactions before you look"
catalog_blurb: "Why testing every possible interaction almost always turns up one that isn't real."
description: "Testing all 45 possible interactions in a 10-predictor model finds 3 that look real by chance alone. Learn why, and how to choose interactions honestly instead."
keywords: "interaction effects, data dredging, multiple comparisons, Bonferroni correction, degrees of freedom, subgroup analysis, p-hacking, regression modeling, R"
post_type: "LESSON"
curriculum_id: "4.70.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-model-strategy"
course_title: "Regression Modeling Strategies"
course_lesson: "3"
course_total: "7"
course_landing: "Regression-Modeling-Strategies-Course.html"
course_next: "Paying-a-Penalty-to-Get-a-Better-Model.html"
course_prev: "Fitting-a-Curve-Without-Guessing-Its-Shape.html"
---

=== step === cover
## Choosing interactions before you look

Today let's understand why hunting for interactions in a regression model is riskier than it looks.

Say you are building a regression model with ten candidate predictors, x1 through x10. Nothing stops you from adding a term for how two of them might work together, called an interaction, where one predictor's effect on the outcome depends on the value of another. The trouble starts the moment you ask how many such pairs even exist.

Ten predictors offer forty-five possible two-way pairings. Test every single one against the usual 5% threshold, and something is going to come back looking real, whether or not anything is actually there.

::widget process-flow {"steps": [{"title": "Ten candidate predictors", "sub": "already sitting in the model"}, {"title": "Forty-five possible pairs", "sub": "every two-predictor interaction you could add"}, {"title": "Test every pair", "sub": "fit each one, read its p-value"}, {"title": "Some will look real", "sub": "purely by chance, not because anything is there"}]}

That is the shape of the problem laid out above: a lot of candidate pairs, a search through all of them, and a result that looks like a discovery even when it is not one.

=== step === concept
## Ten predictors, forty-five interactions

Before testing anything, it helps to see exactly where that number forty-five comes from.

With p predictors, the number of distinct pairs you can form is p(p-1)/2. Order does not matter here: x1 paired with x2 is the same pair as x2 paired with x1, so each pair is only counted once. For 10 predictors that works out to 10*9/2 = 45.

Here is the dataset itself: 300 observations on 10 predictors named x1 through x10, with an outcome y built to have no relationship to any of them. Press Run to build it and confirm the count of pairs.

```r
# Build the running noise dataset: 300 observations, 10 predictors unrelated to y, and count the possible interaction pairs
set.seed(42)
n <- 300
p <- 10
X <- matrix(rnorm(n * p), nrow = n, ncol = p)
colnames(X) <- paste0("x", 1:p)
y <- rnorm(n)
noise_data <- data.frame(y = y, X)
choose(10, 2)
#> [1] 45
```

`rnorm(n * p)` draws 3,000 independent values from a standard normal distribution and `matrix()` arranges them into 300 rows and 10 columns, one column per predictor. `y` is drawn the same way, completely separately from `X`, so nothing links any predictor to the outcome. Every true main effect and every true interaction in this dataset is exactly zero, by construction. That matters for everything that follows: whatever looks significant later on came from chance alone, because there is genuinely nothing here to find.

=== step === concept
## A test decided before you saw the data

Suppose that before collecting any of this data, you had a reason to expect x1 and x2 to interact, perhaps a subject-matter argument for why the two would work together. You decide, in advance, to test exactly that one pair and nothing else.

Fit the model with that single interaction and read its row in the coefficient table.

```r
# Fit the one interaction chosen before looking, x1:x2, and read its coefficient table
fit_x1x2 <- lm(y ~ x1 + x2 + x1:x2, data = noise_data)
summary(fit_x1x2)$coefficients
#>                 Estimate Std. Error     t value  Pr(>|t|)
#> (Intercept) -0.030431956 0.05828319 -0.52213952 0.6019637
#> x1           0.024251455 0.05909149  0.41040523 0.6818056
#> x2          -0.001856129 0.05932773 -0.03128603 0.9750625
#> x1:x2        0.060023110 0.06763074  0.88751228 0.3755237
```

Look at the x1:x2 row. Its p-value is 0.3755, nowhere near the usual 0.05 cutoff. That is the correct, honest answer, because x1 and x2 really do not interact in this data. This is what an honest, pre-specified test looks like when there is genuinely nothing to find: a p-value that says so, plainly.

=== step === concept
## What happens when you test every pair

Now do the opposite. Instead of picking one pair in advance, test every single one of the 45 possible pairs on this exact same data, and see what turns up.

```r
# Test every one of the 45 possible interactions on the identical data, and keep each one's estimate and p-value
vars <- paste0("x", 1:10)
pair_names <- c()
pair_pvals <- c()
pair_ests  <- c()
for (i in 1:9) {
  for (j in (i + 1):10) {
    f <- as.formula(paste0("y ~ ", vars[i], " + ", vars[j], " + ", vars[i], ":", vars[j]))
    fit_ij <- lm(f, data = noise_data)
    co <- summary(fit_ij)$coefficients
    pair_names <- c(pair_names, paste0(vars[i], ":", vars[j]))
    pair_pvals <- c(pair_pvals, co[4, 4])
    pair_ests  <- c(pair_ests, co[4, 1])
  }
}
sum(pair_pvals < 0.05)
#> [1] 3
pair_names[which.min(pair_pvals)]
#> [1] "x6:x9"
pair_ests[which.min(pair_pvals)]
#> [1] -0.1508463
min(pair_pvals)
#> [1] 0.006288086
```

The loop builds every pair from x1:x2 up to x9:x10, fits the same two-predictor-plus-interaction model 45 times, and keeps each interaction's estimate and p-value. Three of the 45 pairs come back below 0.05, even though not one interaction in this data is real. The smallest is x6:x9, with an estimate of -0.1508 and p = 0.0063, a result that on its own looks like a solid finding.

If the 45 tests were independent of each other, a rough formula tells you how likely that is: 1 minus the chance that every single test misses, 0.95 raised to the power of 45.

```r
# The rough chance that at least one of 45 independent 5%-risk tests comes back "significant"
1 - 0.95^45
#> [1] 0.9005597
```

That comes to about 90%. Running 45 tests, each carrying its own 5% chance of a false alarm, makes it close to 9 in 10 that at least one of them clears the bar by chance alone, even when nothing in the data is real. (The 45 pairs here share predictors with each other, so they are not quite independent, and this formula is only an approximation; the loop above already gave you the real count on this exact data: 3 out of 45.)

The widget below drags that same idea across any number of tests, not just 45.

::widget multiplicity-sim {"kMax": 45, "kStart": 1, "alpha": 0.05, "corrections": ["none"]}

Drag the slider up toward 45 with no correction switched on. The share of studies with at least one false "significant" result climbs toward the same near-90% figure the formula above just gave you, the general version of the one loop you ran on this lesson's own data.

=== step === quiz
## Quick check: why does testing every pair find something?

All 45 interactions among the 10 noise predictors get tested, and 3 of them come back below p = 0.05. Which statement reads that correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A p-value below 0.05 is trustworthy no matter how many pairs were tested alongside it. ::no A p-value's formula has no idea how many other tests ran alongside it. It assumes one test, decided on in advance. Here 45 ran, and the smallest of them is not by itself a sign of anything real.
- Testing more pairs lowers each individual pair's own chance of a false positive. ::no Each pair still carries its own 5% chance of a false positive, exactly as if it were tested alone. What changes with more pairs is not any one pair's own risk, but the chance that at least one of the 45 clears the bar by luck.
- Each test keeps its own 5% chance of a false positive, so testing 45 of them makes at least one false "finding" close to certain, which is not a sign that anything real was found. ::ok Right. Every one of the 45 tests carries its own 5% false-positive risk, and running that many of them makes at least one false alarm close to certain, near the 90% this lesson's own loop and widget both showed. Finding 3 "significant" pairs says nothing about whether any interaction here is real.
- Finding 3 of 45 pairs significant shows that most of the 45 interactions are real. ::no Every interaction in this dataset was built to be exactly zero. Finding 3 below 0.05 out of 45 is close to what pure chance alone produces when that many tests are run, not evidence that any of them, let alone most, are real.

=== step === concept
## What the search costs

Testing every pair instead of one charges two separate costs, and both come from the same cause: a search.

First, the cost to the p-value itself. The 0.0063 that x6:x9 returned was not the only test run; it was the smallest of 45. A Bonferroni correction accounts for that by multiplying a p-value by the number of tests performed, so a result that only looks strong because it was the best of many gets scaled back down.

```r
# Correct the smallest found p-value for having tried 45 pairs
p.adjust(min(pair_pvals), method = "bonferroni", n = 45)
#> [1] 0.2829639
```

Once 45 tests are accounted for, x6:x9's p-value rises from 0.0063 to 0.283, nowhere near significant. Compare that against x1:x2 from two steps back, which was chosen before looking and needed no correction at all: its honest p-value was already 0.3755. Corrected, both pairs land in the same unremarkable place. One of them just needed the correction to get there.

Second, the cost to the degrees of freedom. Every parameter a model estimates is paid for out of the data's degrees of freedom, the amount of information left over once the model has used some of it to pin down its own coefficients. Fitting an interaction is not free; it spends one more of them.

```r
# Compare degrees of freedom left over after fitting no interactions, one, and all 45
mains_only <- lm(y ~ x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10, data = noise_data)
mains_plus_one <- lm(y ~ x1 + x2 + x3 + x4 + x5 + x6 + x7 + x8 + x9 + x10 + x1:x2, data = noise_data)
all_terms <- paste(pair_names, collapse = " + ")
mains_plus_all <- lm(as.formula(paste0("y ~ ", paste(vars, collapse = " + "), " + ", all_terms)), data = noise_data)
df.residual(mains_only)
#> [1] 289
df.residual(mains_plus_one)
#> [1] 288
df.residual(mains_plus_all)
#> [1] 244
```

The 10 main effects alone leave 289 residual degrees of freedom out of 300 observations. Adding the one pre-specified interaction costs exactly one more, down to 288. Adding all 45 interactions costs 45, down to 244, forty-four of them spent on interactions nobody is ever going to report, let alone defend.

=== step === widget
## Interactions with a reason, and one without

Searching through 45 pairs is one way an interaction gets chosen. The other way, the right way, is to decide on it beforehand, from a reason grounded in how the two predictors actually work together. Three real cases make the point, set against one famous refusal.

1. Dose and kidney function. A drug the kidneys clear out of the body acts longer, and more strongly, in a patient whose kidneys clear less of it. Dose and kidney function are expected to interact before a single patient is enrolled, because that is how the drug physically works.
2. Treatment and how sick a patient started out. A patient who starts further from healthy has more room to improve. A treatment's benefit showing up more strongly in sicker patients is a mechanism you can state in advance, not something you go looking for afterward.
3. Price and income. A buyer with less income has less room in their budget to absorb a price rise, so the same price increase can shrink their purchases far more than it shrinks a wealthier buyer's. Here is that mechanism worked out on numbers, a separate illustrative case and not this lesson's 10-predictor dataset.

The chart below holds one product's price against the quantity sold, split by the buyer's income bracket.

::widget facet-grid {"data": [{"x":10,"y":100,"facet":"below-median income"},{"x":20,"y":82,"facet":"below-median income"},{"x":30,"y":64,"facet":"below-median income"},{"x":40,"y":46,"facet":"below-median income"},{"x":50,"y":28,"facet":"below-median income"},{"x":60,"y":10,"facet":"below-median income"},{"x":10,"y":90,"facet":"above-median income"},{"x":20,"y":87,"facet":"above-median income"},{"x":30,"y":84,"facet":"above-median income"},{"x":40,"y":81,"facet":"above-median income"},{"x":50,"y":77,"facet":"above-median income"},{"x":60,"y":73,"facet":"above-median income"}], "geom": "line", "x": "price", "y": "quantity", "facetVar": "income bracket"}

Toggle to facet_wrap and the two slopes separate cleanly. Below-median income buyers cut their purchases from 100 down to 10 as price climbs from 10 to 60, a steep line. Above-median income buyers barely move, from 90 down to 73 over the identical price range. One combined chart would blur those two slopes together; splitting them into facets is what makes the interaction between price and income visible as two different slopes instead of one average one.

Now the refusal. In 1988, the ISIS-2 trial tested aspirin against placebo in over 17,000 patients with a suspected heart attack, and found a large, highly significant benefit. Before publishing, the investigators deliberately added one more subgroup to the results table: patients grouped by their astrological birth sign. For patients born under Gemini or Libra, aspirin's advantage lost statistical significance; for every other birth sign, the same strong benefit held up clearly. The investigators were not claiming birth sign changes how aspirin works. They put it in on purpose, as a warning: no mechanism connects a patient's birth month to a drug's action in the body, so this subgroup is refused, however it looks on paper, regardless of its p-value. The three cases above pass the test the zodiac subgroup fails: each one names a mechanism, decided before the data arrived, that explains why the interaction should exist at all.

=== step === widget
## A fixed penalty instead of a search

Sometimes a search across many candidate interactions cannot be avoided; there may genuinely be no way to name all of them in advance. When that happens, a lasso-type penalty is the least-bad version of a search, because its cost is fixed and declared up front instead of hidden inside a reported p-value.

::widget coef-path {}

Drag the penalty, called lambda, from weak to strong. Under lasso, the weakest coefficients get driven all the way to exactly zero as lambda grows, and each one that survives paid an explicit, known penalty to get there. That penalty is fixed before the model ever sees how any one coefficient turns out, the opposite of the 45-pair search two steps back, where the cost of looking at every pair never showed up anywhere in the reported numbers at all. This widget runs its own six-predictor example, not this lesson's 45 interactions, but the lesson behind it is the same one.

=== step === quiz
## Quiz: reading a colleague's found interaction

A colleague tests all 45 interactions among 10 predictors in a new dataset, reports x3:x8 at p = 0.004, and wants to publish it. No one proposed a reason to expect x3 and x8 to interact before the data arrived. Which conclusion is best supported?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- A p-value of 0.004 is trustworthy exactly as reported, since it cleared 0.05 by a wide margin. ::no A wide margin below 0.05 does not exempt a p-value from correction. It was still the smallest result out of 45 tried, the same position x6:x9 held earlier in this lesson, where correcting it sent 0.0063 up to 0.283.
- The p-value needs the same correction this lesson applied to x6:x9, and even without correcting it, an interaction nobody expected in advance is exactly what a 45-test search produces on its own, not a discovery. ::ok Right. The correction argument and the mechanism argument both point the same way here. A Bonferroni correction across 45 tests would very likely send 0.004 back up past 0.05, and even setting that aside, no mechanism was proposed for x3 and x8 before the data arrived, which is exactly what this lesson's own loop produced from data built to contain nothing at all.
- Correction for multiple testing only starts to matter once more than 100 pairs have been tried. ::no There is no count where correction suddenly starts mattering. It was already needed at 45 tests, which is what sent x6:x9 from 0.0063 to 0.283 earlier in this lesson. A hundred is not a threshold, just a bigger version of the same problem.
- If some of the 10 main effects are significant, the interaction found by searching does not need to be corrected. ::no A main effect's significance has nothing to do with how many interactions were searched afterward. x3:x8 was still the best of 45 candidates tried, and that is what needs correcting, regardless of what the main-effect rows in the same table show.

=== step === tryit
## Your turn: pre-specify, then search, and judge

Time to run both halves of this lesson yourself, on data you have not seen analyzed yet.

A fresh noise dataset: 150 observations, 6 predictors named x1 through x6, with a new seed not reused anywhere earlier in this lesson, so there are 15 possible pairs instead of 45. The pre-specified test is already fit for you below, chosen before looking, exactly the way x1:x2 was two steps back.

```r
# A fresh noise dataset: 150 observations, 6 predictors, none related to the outcome
set.seed(7)
n <- 150
p <- 6
X <- matrix(rnorm(n * p), nrow = n, ncol = p)
colnames(X) <- paste0("x", 1:p)
y <- rnorm(n)
tryit_data <- data.frame(y = y, X)

# The pre-specified test, chosen before looking
fit_pre <- lm(y ~ x1 + x2 + x1:x2, data = tryit_data)
summary(fit_pre)$coefficients

# Now loop over all 15 possible pairs among x1 to x6, the way the earlier
# step looped over 45. Collect each pair's interaction p-value, find the
# smallest one with min(), and correct it with p.adjust(..., method =
# "bonferroni", n = 15). Finish with one comment line judging whether
# either result, the pre-specified test or the searched one, is evidence
# of a real interaction. Press Check when you have it.
```
::check {"regex": "p[.]adjust[(][\\s\\S]*?bonferroni[\\s\\S]*?#\\s*[A-Za-z]", "gate": true, "difficulty": "intermediate", "ok": "Right. The pre-specified x1:x2 test and the Bonferroni-corrected search both land nowhere near significant, exactly what should happen on data built to contain no real interaction at all.", "no": "Loop over the 15 pairs the way the earlier step looped over 45, find the minimum p-value with min(), correct it with p.adjust(..., method = \"bonferroni\", n = 15), and finish with a comment line judging whether either result is evidence of a real interaction."}
::solution
```r
# Loop over the 15 pairs, Bonferroni-correct the smallest p-value, and judge the result
vars6 <- paste0("x", 1:6)
pair_pvals6 <- c()
for (i in 1:5) {
  for (j in (i + 1):6) {
    f <- as.formula(paste0("y ~ ", vars6[i], " + ", vars6[j], " + ", vars6[i], ":", vars6[j]))
    fit_ij <- lm(f, data = tryit_data)
    pair_pvals6 <- c(pair_pvals6, summary(fit_ij)$coefficients[4, 4])
  }
}
min(pair_pvals6)
#> [1] 0.02323664
p.adjust(min(pair_pvals6), method = "bonferroni", n = 15)
#> [1] 0.3485496
# Neither test gives evidence of a real interaction: the pre-specified
# x1:x2 test came back at p = 0.849, and the smallest of 15 searched
# pairs, corrected for having searched, lands at p = 0.349.
```

=== step === concept
## References

- [Regression Modeling Strategies, course notes](https://hbiostat.org/rmsc) - Harrell, F.E. Companion to the book (2nd ed., Springer, 2015); the chapter on modeling strategy argues for choosing predictors and interactions from subject-matter grounds rather than from a search of the data.
- [Randomised trial of intravenous streptokinase, oral aspirin, both, or neither among 17,187 cases of suspected acute myocardial infarction](https://doi.org/10.1016/S0140-6736(88)92833-4) - ISIS-2 Collaborative Group (1988), Lancet 2(8607), 349-360. The trial behind the astrological-sign subgroup in this lesson.
- [Subgroup analysis and other (mis)uses of baseline data in clinical trials](https://doi.org/10.1016/S0140-6736(00)02039-0) - Assmann, S.F., Pocock, S.J., Enos, L.E. & Kasten, L.E. (2000), Lancet 355(9209), 1064-1069.
- [No adjustments are needed for multiple comparisons](https://pubmed.ncbi.nlm.nih.gov/2081237/) - Rothman, K.J. (1990), Epidemiology 1(1), 43-46. An argument, from the other side of this debate, for when correction is and is not the right response to multiple testing.

=== step === complete
## Choose from theory, not from the smallest p-value

Ten predictors offered 45 possible interactions. Testing all of them found 3 that looked "significant" by chance alone, the smallest at x6:x9, p = 0.0063, fading to p = 0.283 once corrected for the search that found it. The one interaction chosen before looking, x1:x2, honestly found nothing at p = 0.376, and it cost the model one degree of freedom against the 45 a full search would have spent.

The fix is not a cleverer search. Choose an interaction the same way you choose a predictor: from a reason to expect it, stated before the data arrives, the way dose and kidney function, treatment and baseline severity, and price and income all were in this lesson. And refuse the ones found only by looking, however good their p-value looks, the way ISIS-2's own investigators refused their own astrological subgroup.
