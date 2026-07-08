---
title: "Advanced Regression Lesson 9: Zero-Inflated and Hurdle Models"
description: "Model count data with too many zeros in R: fit zero-inflated and hurdle models with pscl, read both parts, and choose between them by how the zeros arise."
keywords: "zero-inflated model, hurdle model, zero-inflated Poisson, count data, excess zeros, structural zeros, pscl, zeroinfl, hurdle, overdispersion, R"
mathjax: true
webr: true
curriculum_id: "6.130.9"
post_type: "LESSON"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "9"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Gamma-and-Tweedie-Regression.html"
course_prev: "Count-Models-Poisson-and-Negative-Binomial.html"
lesson_access: "free"
catalog_blurb: "How to handle count data with far more zeros than a standard model expects."
---

=== step === cover
::eyebrow Lesson 9 of 13
## Zero-Inflated and Hurdle Models

In Lesson 8 you gave counts the model they deserve: a Poisson regression on the log scale, and a negative binomial when the spread ran wider than a Poisson allowed. Both fixed how far the counts *spread*. This lesson is about a different kind of trouble, one that lives entirely at a single value: zero.

Meet Nadia, a ranger at Blue Lake State Park. As each visiting group packs up to leave, she writes down one number: how many fish they caught that day. Some groups caught six or seven. But when she tallies a month of clipboards, one thing jumps out: nearly half of all the groups caught nothing at all. A wall of zeros.

Here is the catch that makes those zeros special. A "0" on Nadia's clipboard hides two completely different stories. One group is a family who came to picnic and swim and never once put a line in the water. Another is a patient angler who fished all afternoon and simply got unlucky. Same number on the page, two utterly different reasons. A single count model, even a generous negative binomial, has no way to tell them apart, and as you will see, that is exactly why it cannot fit this data.

By the end of this lesson you will be able to:

- Explain why a negative binomial still under-predicts a pile of zeros
- Tell a structural zero (never at risk) from a sampling zero (at risk, but landed on 0)
- Fit and read a zero-inflated model and a hurdle model in R, and choose the right one

**Prerequisites:** you can fit and read [a Poisson or negative binomial count model](Count-Models-Poisson-and-Negative-Binomial.html) (Lesson 8, the direct prerequisite), and you have met the GLM idea and read a logistic model as [odds](Logistic-Regression-Done-Properly.html). Comfortable reading `exp(coef)` as a multiplier.

::widget count-dist {}

=== step === concept
::eyebrow The problem
## Even a negative binomial is not enough

Let us build Nadia's season so we can run everything on this page. Each row is one visiting group. Two hidden stories decide its catch: whether the group ever fishes at all, and, for those who do, how many fish they land.

```r
set.seed(2027)
n <- 500
persons <- sample(1:4, n, replace = TRUE)   # people in the group
child   <- sample(0:2, n, replace = TRUE)   # young children along
camper  <- rbinom(n, 1, 0.6)                # 1 = staying overnight to camp

# story 1: some groups never fish (more likely with young kids, less if camping)
never_fishes <- rbinom(n, 1, plogis(-0.5 + 1.1 * child - 1.3 * camper))
# story 2: groups that DO fish land a Poisson catch that grows with group size + camping
catch <- rpois(n, exp(0.2 + 0.5 * persons + 0.4 * camper))

fish <- data.frame(
  persons = persons,
  child   = child,
  camper  = factor(camper, labels = c("day", "camp")),
  count   = ifelse(never_fishes == 1, 0, catch)   # a non-fisher records 0
)
c(groups = n, zeros = sum(fish$count == 0), busiest = max(fish$count))
#>  groups   zeros busiest 
#>     500     243      19
```

Of 500 groups, **243 caught nothing**. That is 49% zeros. Now fit the two best single-equation count models from Lesson 8 and ask each one a simple question: how many zeros do you *expect*?

```r
library(MASS)
nb <- glm.nb(count ~ persons + child + camper, data = fish)

# expected number of zeros under each one-equation model, vs the 243 we saw
pois_all <- glm(count ~ persons + child + camper, data = fish, family = poisson)
round(c(
  observed = sum(fish$count == 0),
  poisson  = sum(dpois(0,   fitted(pois_all))),
  negbin   = sum(dnbinom(0, mu = fitted(nb), size = nb$theta))
))
#> observed  poisson   negbin 
#>      243       80      197
```

A plain Poisson expects a laughable 80 zeros. The negative binomial, our Lesson 8 fix for overdispersion, does better and reaches 197, but it is still **46 zeros short** of what Nadia actually recorded. It gave up too. The extra spread of a negative binomial helps with the long tail, but it cannot manufacture this pile of zeros, because all of its zeros are tied to the same single mean as its other counts.

=== step === quiz
::eyebrow Check yourself
## Why can't the negative binomial just absorb them?

The negative binomial has an extra dispersion parameter. Nadia's assistant says, "so just crank that up until it makes 243 zeros." What is the honest answer?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Add more predictors to the count model until the zeros are explained ::no More predictors reshuffle each group's mean, but the negative binomial still ties its zeros to that one mean. The surplus of zeros comes from a separate group that never fishes at all, which no count predictor can represent.
- It cannot: a negative binomial has one process with a single mean, so its zeros are locked to that mean; a genuine pile of "never at risk" zeros needs its own second process ::ok Right. One count distribution, however overdispersed, cannot manufacture a block of zeros that arises from a different mechanism. That is exactly what the two-part models add.
- Shrink the dispersion parameter so the model allows more spread, and the extra zeros will appear ::no More dispersion does lift the zero probability, but it inflates the entire tail at the same time, because one parameter controls the whole shape. You cannot add only zeros this way.

=== step === concept
::eyebrow The key idea
## Two kinds of zero

Everything turns on the insight from the cover. On Nadia's clipboard, a 0 can arrive by two completely different routes:

- A **structural zero**: a group that was *never at risk* of a positive count. The picnicking family never fished, so a 0 was the only number they could ever produce.
- A **sampling zero**: a group that *was* at risk and happened to land on 0. The angler fished for hours and, by bad luck, caught nothing. They could easily have caught three.

A single count model assumes every zero is a sampling zero, a group that fished and struck out. That is why it under-counts: it has no way to represent the families who were never fishing in the first place. The fix is to model both routes explicitly. The flow below traces exactly how a zero is born.

::widget process-flow {"steps":[{"title":"A group arrives","sub":"500 groups over the season"},{"title":"Structural gate","sub":"some never fish, always a 0"},{"title":"The rest fish","sub":"a Poisson catch: often 0, 1, 2"},{"title":"You record a 0","sub":"from a non-fisher OR a skunked angler"}]}

Two of those four boxes end in a zero. That is the whole problem in one picture, and the next two models are two different ways to write it down.

=== step === quiz
::eyebrow Check yourself
## Which zero is structural?

Two groups both hand Nadia a clipboard reading 0. Group A is a family of five with three young children who spent the day picnicking and never took out a rod. Group B is a lone, experienced angler who fished the whole afternoon and went home empty-handed. Which is the structural zero?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Group A, the picnicking family: they were never at risk of catching a fish, so their 0 comes from the structural "never fishes" route ::ok Exactly. A structural zero is a group that could not have produced a positive count. The family never fished, so their 0 is structural.
- Group B, the empty-handed angler: catching nothing after real effort is the more extreme zero ::no The angler WAS at risk: they fished and could have caught something. Their 0 is a sampling zero from the count process. The family, who never fished, is the structural zero.
- Both are structural, because both wrote down a 0 ::no The number is identical (0) but the mechanism differs. Only the family was never at risk; the angler could have caught a fish and did not. Separating those two is the entire point of a two-part model.

=== step === concept
::eyebrow The first fix
## The zero-inflated model

A **zero-inflated** model writes Nadia's data as a *mixture* of the two routes. It says: with probability \(\pi\) ("pi") a group is a structural non-fisher who is certain to record 0, and with probability \(1 - \pi\) the group fishes and its catch follows an ordinary count distribution \(f\) (here a Poisson). The probability of seeing a particular count then splits cleanly:

\[ P(Y = 0) = \pi + (1 - \pi)\, f(0), \]
\[ P(Y = k) = (1 - \pi)\, f(k), \qquad k = 1, 2, 3, \dots \]

Read the first line as "a zero happens if the group is a structural non-fisher (\(\pi\)), *or* if it fishes but catches nothing (\((1-\pi) f(0)\))". That single equation is the two routes to a zero, made formal. Here \(Y\) is the count outcome (fish caught), \(k\) is a specific value it might take, and \(f(k)\) is the Poisson probability of catching exactly \(k\) fish.

The clever part: \(\pi\) is not one fixed number. It gets its own little logistic regression, so the chance of being a structural zero can depend on the group:

\[ \log\!\left(\frac{\pi}{1 - \pi}\right) = \gamma_0 + \gamma_1 z, \]

where \(z\) is a predictor (a group's number of children, say), \(\gamma_0\) the intercept and \(\gamma_1\) the slope of the *zero* part. So the model has two engines: a **count** engine (the Poisson rate, exactly like Lesson 8) and a **zero** engine (a logistic model for "is this group a structural non-fisher?"). Toggle the widget to Zero-Inflated and watch the fitted line finally rise to meet the tall zero bar *and* trace the tail, the thing neither the Poisson nor the negative binomial could do.

::widget count-dist {}

=== step === tryit
::eyebrow Your turn
## Fit the two parts

In R, `zeroinfl()` from the **pscl** package fits it. The formula has a new twist: a vertical bar `|` separates the two engines. On the left of the bar go the predictors for the **count** (how many fish a fishing group lands); on the right go the predictors for the **zero** (whether a group is a structural non-fisher). Kids drive the non-fishing, so put `child + camper` on the right. Fill in the zero part.

```r
library(pscl)
zi <- zeroinfl(count ~ persons + camper | ____,
               data = fish, dist = "poisson")
summary(zi)
```
::check {"regex":"child","gate":true,"difficulty":"beginner","ok":"That is the whole idea of the bar: the right side models WHO is a structural zero, separately from how many fish the fishers catch.","no":"The non-fishing is driven by children (and camping). Put child + camper on the right of the bar."}
::solution
```r
library(pscl)
zi <- zeroinfl(count ~ persons + camper | child + camper,
               data = fish, dist = "poisson")
summary(zi)
#> Count model coefficients (poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  0.18210    0.09760   1.866   0.0621
#> persons      0.50065    0.02595  19.290  < 2e-16
#> campercamp   0.40454    0.06051   6.686  2.3e-11
#>
#> Zero-inflation model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -0.5003     0.2017  -2.481   0.0131
#> child         1.1902     0.1396   8.527  < 2e-16
#> campercamp   -1.3818     0.2221  -6.221 4.94e-10
```

=== step === concept
::eyebrow Reading the model
## Two blocks, two scales

The summary prints two coefficient blocks, one per engine, and they are read on different scales. As always, exponentiate to make them concrete:

```r
library(pscl)
zi <- zeroinfl(count ~ persons + camper | child + camper,
               data = fish, dist = "poisson")
round(exp(coef(zi)), 3)
#> count_(Intercept)     count_persons  count_campercamp  zero_(Intercept)
#>             1.200             1.650             1.499             0.606
#>        zero_child   zero_campercamp
#>             3.288             0.251
```

The **count** block is a Poisson regression, exactly like Lesson 8, so its exponentiated coefficients are **rate ratios** for groups that fish:

- `count_persons` = 1.65: each extra person in the group multiplies the expected catch by about 1.65.
- `count_campercamp` = 1.50: campers land about 1.5 times as many fish as day visitors.

The **zero** block is a *logistic* regression for "is this a structural non-fisher?", so its exponentiated coefficients are **odds ratios** for being an always-zero:

- `zero_child` = 3.29: each additional young child multiplies the *odds* that a group never fishes by about 3.3. Kids mean picnics, not fishing.
- `zero_campercamp` = 0.25: campers are only a quarter as likely to be structural non-fishers. People who camp overnight came to fish.

[KEY INSIGHT]
The two blocks answer two different questions. The count block asks "among groups that fish, how many?" (rate ratios). The zero block asks "which groups never fish at all?" (odds). A predictor can even point opposite ways in the two blocks, and that is fine, they are separate mechanisms.

=== step === quiz
::eyebrow Check yourself
## What does 3.29 mean?

In the zero-inflation block, `child` has coefficient 1.19, which exponentiates to 3.29. A colleague reads it off the screen. Which reading is correct?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A group with one more child catches about 3.3 times fewer fish ::no That reads the wrong block. The zero-inflation coefficient is not about how many fish a fishing group lands; the count (rate-ratio) block handles that. This number is the odds of belonging to the never-fishes group.
- Each additional child multiplies the odds that a group is a structural never-fisher by about 3.3 ::ok Right. The zero part is a logistic model, so its exponentiated coefficient is an odds ratio for membership in the always-zero group, not a count.
- The odds of never fishing rise by about 3.3 percent per child ::no An odds ratio of 3.29 means about 3.3 TIMES the odds (a 229 percent increase), not 3.3 percent.

=== step === concept
::eyebrow The second fix
## The hurdle model

There is a second, subtly different way to split a zero-heavy count, and it changes the story about where zeros come from. A **hurdle** model says every group starts at zero and must clear a *hurdle* to score at all. Stage one is a plain yes/no gate: did this group catch anything? Stage two, only for those who cleared it, is a count that is **truncated at zero**, it is renormalised so it can never itself produce a 0.

\[ P(Y = 0) = 1 - p, \]
\[ P(Y = k) = p \cdot \frac{f(k)}{1 - f(0)}, \qquad k = 1, 2, 3, \dots \]

Here \(p\) is the probability of clearing the hurdle (catching at least one fish), and \(\frac{f(k)}{1 - f(0)}\) is the Poisson probability of \(k\), divided by \(1 - f(0)\) so that the leftover probability mass, once 0 is removed, still sums to one over \(k \ge 1\). The consequence is the whole point:

**In a hurdle model there is only one kind of zero.** Every 0 comes from failing the gate. There is no "sampling zero", because a group that clears the hurdle draws from a distribution that starts at 1. `hurdle()` (also from pscl) uses the same two-part formula:

```r
library(pscl)
hd <- hurdle(count ~ persons + camper | child + camper,
             data = fish, dist = "poisson")
summary(hd)
#> Count model coefficients (truncated poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  0.19642    0.09756   2.013   0.0441
#> persons      0.49672    0.02591  19.172  < 2e-16
#> campercamp   0.40387    0.06055   6.670 2.56e-11
#>
#> Zero hurdle model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   0.3817     0.1905   2.003   0.0452
#> child        -1.1540     0.1338  -8.623  < 2e-16
#> campercamp    1.4054     0.2137   6.578 4.78e-11
```

::widget process-flow {"steps":[{"title":"A group arrives","sub":"start at zero"},{"title":"Clear the hurdle?","sub":"catch anything at all: yes or no"},{"title":"If no","sub":"the count is 0, the only source of zeros"},{"title":"If yes","sub":"a truncated count: 1 or more, never 0"}]}

=== step === concept
::eyebrow Choosing
## Zero-inflated or hurdle?

Look carefully at the `child` coefficient in the two zero blocks. In the zero-inflated fit it was **+1.19**; in the hurdle fit it is **-1.15**. Same data, opposite sign. That is not a bug, it is a difference in *what each zero engine models*:

```r
# both zero engines describe the SAME real pattern, on mirror-image scales
round(exp(coef(zi))[c("zero_child", "zero_campercamp")], 3)  # ZI: odds of ALWAYS-ZERO
#>      zero_child zero_campercamp
#>           3.288           0.251
round(exp(coef(hd))[c("zero_child", "zero_campercamp")], 3)  # hurdle: odds of a POSITIVE
#>      zero_child zero_campercamp
#>           0.315           4.077
```

The zero-inflated engine models the odds of being a **structural zero**, so more children means *more* non-fishing (odds ratio 3.29). The hurdle engine models the odds of **clearing the hurdle**, so more children means *less* chance of a positive catch (odds ratio 0.32, roughly the reciprocal of the 3.3 from the zero-inflated fit). They tell the identical human story, kids mean less fishing, from opposite ends. Neither is wrong; you just have to know which one you are reading.

[KEY INSIGHT]
The real choice is not statistical, it is about mechanism: **can a group that is genuinely "in play" still record a zero?** If yes, use zero-inflated, because it keeps a sampling zero alive (an angler who fishes and gets skunked). If every zero can only mean "never crossed the gate", use a hurdle. For Nadia, an angler really can fish and catch nothing, so a sampling zero is real and zero-inflation matches the story.

=== step === quiz
::eyebrow Check yourself
## Cigarettes, not fish

A health survey asks each person how many cigarettes they smoked yesterday. Non-smokers answer 0. A smoker answers 1 or more, and crucially, a real smoker never answers 0: if you smoke, the count is positive. Which model matches this data-generating story?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A zero-inflated model, because there are so many zeros ::no Zero-inflation is for when a group from the COUNT process can still land on 0 (an angler who fishes and catches nothing). Here a smoker never smokes zero: every 0 is a non-smoker. One clean gate means a hurdle model.
- A hurdle model: every zero comes from a single gate (non-smoking), and a smoker can never record a 0 ::ok Right. When positives can never be 0 and all zeros come from one "did they cross" gate, the hurdle decomposition matches the mechanism exactly.
- A negative binomial, because the counts are overdispersed ::no Overdispersion is a separate issue about spread. An NB cannot encode the smoker/non-smoker gate that produces every zero; the hurdle model is built for exactly that split.

=== step === concept
::eyebrow The payoff
## Does it actually fix the zeros?

Back to the test that started this lesson: how many zeros does each model expect? Now with all four contenders side by side.

```r
pois <- glm(count ~ persons + child + camper, data = fish, family = poisson)

round(c(
  observed = sum(fish$count == 0),
  poisson  = sum(dpois(0,   fitted(pois))),
  negbin   = sum(dnbinom(0, mu = fitted(nb), size = nb$theta)),
  zeroinfl = sum(predict(zi, type = "prob")[, 1]),   # P(Y=0) per group, summed
  hurdle   = sum(predict(hd, type = "prob")[, 1])
))
#> observed  poisson   negbin zeroinfl   hurdle
#>      243       80      197      242      243
```

The one-equation models miss by 46 to 163 zeros; the two-part models land on the nose. (A hurdle model always reproduces the observed zero count *exactly*, 243, because its gate is fit directly to "zero versus positive", so a perfect match there is by construction, not a sign of superiority.) And the overall fit, by AIC, confirms the leap:

```r
AIC(pois, nb, zi, hd)
#>      df      AIC
#> pois  4 2794.261
#> nb    5 2120.460
#> zi    6 1677.104
#> hd    6 1679.939
```

Lower AIC is better. Both two-part models crush the Poisson and the negative binomial by hundreds of points. Between the two of them the AIC is nearly a tie (1677 versus 1680), so it does not decide the winner, the *mechanism* does: because a Blue Lake angler can genuinely fish and catch nothing, the zero-inflated model, which keeps that sampling zero, is the honest description of Nadia's clipboards.

=== step === quiz
::eyebrow Putting it together
## Which model should Nadia report?

The zeros expected were 243 observed, 80 Poisson, 197 negative binomial, 242 zero-inflated, 243 hurdle; the AIC was 2794, 2120, 1677, 1680 in the same model order. A visitor asks Nadia which model to trust. What is the best answer?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The negative binomial, since among the models using every predictor it has the lowest AIC ::no The NB does not have the lowest AIC here (zero-inflated and hurdle are hundreds lower) and it still misses about 46 of the zeros. It fixed the spread, not the excess zeros.
- The hurdle model, strictly, because it matched the observed 243 zeros exactly ::no A hurdle model ALWAYS reproduces the observed zero count exactly, by construction, so an exact match is not evidence it wins. Its AIC here is a touch above zero-inflation.
- A two-part model: both reproduce the zeros and cut AIC by hundreds; pick zero-inflated here because an angler can genuinely catch 0, so a real sampling zero exists ::ok Right. Both two-part models beat Poisson and NB decisively; between them the mechanism decides, and because a fishing group can legitimately catch nothing, zero-inflation (which allows a sampling zero) matches the story, with the lower AIC to match.

=== step === concept
::eyebrow Go deeper
## References

- [Zeileis, Kleiber and Jackman (2008), Regression Models for Count Data in R, JSS 27(8)](https://doi.org/10.18637/jss.v027.i08) - the definitive how-to for `zeroinfl()` and `hurdle()`, written by the authors of the pscl package.
- [Zero-Inflated Poisson Regression | R Data Analysis Examples (UCLA OARC)](https://stats.oarc.ucla.edu/r/dae/zip/) - a full worked zero-inflated fit in R, with careful interpretation of both parts.
- [Cameron and Trivedi (2013), Regression Analysis of Count Data, 2nd ed.](https://doi.org/10.1017/CBO9781139013567) - the standard text; its chapters on zeros lay out the structural-versus-sampling distinction in depth.
- [pscl package (CRAN)](https://cran.r-project.org/package=pscl) - reference documentation for `zeroinfl` and `hurdle`, including the `dist` and truncation options.

=== step === complete
## Lesson 9 complete

You can now handle a count that piles up at zero. You can spot when even a negative binomial under-predicts the zeros, separate a structural zero (never at risk) from a sampling zero (at risk, landed on 0), fit a zero-inflated model and a hurdle model with pscl, read their two engines on the right scales, and choose between them by asking whether a genuine positive can ever record a zero.

Next, Lesson 10: Gamma and Tweedie Regression, where the outcome flips from whole-number counts to positive, right-skewed amounts, insurance losses, rainfall, claim sizes, and a family of models built for money that is never negative and often zero-or-positive all at once.
