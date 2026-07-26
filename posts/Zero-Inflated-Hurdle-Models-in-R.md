---
title: "Zero-Inflated and Hurdle Models in R"
slug: "Zero-Inflated-Hurdle-Models-in-R"
description: "Learn to model count data with too many zeros in R. Fit zero-inflated (ZIP, ZINB) and hurdle models with pscl, interpret both parts, and pick the best."
keywords: "zero-inflated models in R, hurdle models in R, zero-inflated Poisson, ZIP model R, zeroinfl pscl, hurdle model count data, excess zeros regression, zero-inflated negative binomial, count data models R, pscl package"
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-10.6"
post_type: "C"
auto_link_terms: "zero-inflated model|zero-inflated models in R|hurdle model|hurdle models in R|zero-inflated Poisson|ZIP model|zeroinfl|excess zeros|count data with excess zeros|zero-inflated negative binomial|pscl package|structural zeros|zero-inflated regression"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "Zero-Inflated & Hurdle Models"
sidebar_order: "169"
difficulty: "Advanced"
---

<p class="lead">Zero-inflated and hurdle models are count models for data that piles up far more zeros than an ordinary Poisson model can explain. Both split the problem into two parts: one part decides whether a zero happens at all, and a second part explains the size of the counts. This guide builds both models from one small fishing dataset in R, shows how to read each half, and gives you a clear rule for choosing between them. It uses base R plus the <code>pscl</code> package, and every block runs right here in your browser.</p>

## Why do too many zeros break an ordinary Poisson model?

A Poisson model is the usual first choice for counting things, like fish caught, doctor visits, or insurance claims. It carries one strong assumption baked in: the average count and the spread of counts are the same number, which also fixes how many zeros it expects to see. When real data has far more zeros than the average can account for, the Poisson fit is wrong across the board, not just on the zeros. Let's build a small dataset and watch that happen.

We will simulate 250 groups of visitors at a park. Each group has a size, a number of children, and a flag for whether they brought a camper. We deliberately build the fish counts from two hidden stories so we know the truth: some groups never fish at all, and the groups that do fish catch a Poisson number of fish.

```r title="Build a dataset of park visitors"
library(pscl)   # zeroinfl() and hurdle() live here
library(MASS)   # negative binomial helper

set.seed(2026)
n <- 250
persons <- sample(1:4, n, replace = TRUE)                    # people in the group
child   <- sample(0:3, n, replace = TRUE, prob = c(.45, .30, .17, .08))
camper  <- rbinom(n, 1, 0.55)                                # 1 = brought a camper

# Two hidden processes decide the fish counts
not_fishing <- rbinom(n, 1, plogis(-1.4 + 1.3 * child))      # some groups never fish
lambda      <- exp(-0.5 + 0.6 * persons + 0.7 * camper)      # rate for the ones who do
fish        <- ifelse(not_fishing == 1, 0, rpois(n, lambda))

fishing <- data.frame(fish, persons, child, camper)
head(fishing)
#>   fish persons child camper
#> 1    4       1     1      1
#> 2    1       1     0      0
#> 3    1       1     0      0
#> 4    0       2     1      1
#> 5    2       1     0      1
#> 6   15       3     0      1
```

Each row is one group and the `fish` column is what we want to model. Notice row 4 caught zero fish while row 6 caught fifteen. That mix of many zeros and a few large counts is the signature of the data we care about here.

How common are the zeros? Let's just ask.

```r title="What share of groups caught nothing"
mean(fishing$fish == 0)
#> [1] 0.456
```

Almost half the groups, 45.6 percent, caught no fish. On its own that number means nothing, because a Poisson process can produce plenty of zeros too. The real question is whether it produces *this many* zeros. To answer that, we fit a plain Poisson model and ask it how many zeros it would expect.

```r title="Compare observed zeros to what Poisson expects"
pois <- glm(fish ~ persons + child + camper, data = fishing, family = poisson)

# For each group, the Poisson chance of a zero is exp(-fitted rate). Sum them up.
observed_zeros <- sum(fishing$fish == 0)
expected_zeros <- sum(dpois(0, lambda = fitted(pois)))
c(observed = observed_zeros, poisson_expected = round(expected_zeros, 1))
#>         observed poisson_expected
#>            114.0             51.1
```

Here is the problem in one line. We saw 114 zeros, but the fitted Poisson model expected only about 51. It is off by more than sixty zeros. The model simply has no way to make that many zeros while also explaining the groups that caught ten or fifteen fish.

There is a second warning sign hiding in the spread of the counts. A Poisson variable has its variance equal to its mean, so let's compare them.

```r title="Check the mean against the variance"
c(mean = round(mean(fishing$fish), 2), variance = round(var(fishing$fish), 2))
#>     mean variance
#>     2.74    15.85
```

The variance, 15.85, is almost six times the mean of 2.74. Data that is far more spread out than its average is called overdispersed, and excess zeros are one of the most common causes of it. Both signals point the same way: this is not a job for plain Poisson.

So where do all those zeros come from? It helps to see that a zero can arrive by two very different routes.

![How a fishing group can end up with a zero: it either never fished, or it fished and caught nothing.](screenshots/Zero-Inflated-Hurdle-Models-in-R-two-kinds-of-zeros.webp)

*Figure 1: A zero can be structural (the group never fished) or a sampling zero (they fished but caught nothing).*

[KEY INSIGHT]
**There are two kinds of zeros, and they mean different things.** A structural zero comes from a group that could never produce a positive count (they never fished), while a sampling zero comes from a group that was fishing but happened to catch nothing. Zero-inflated and hurdle models exist to keep these two kinds of zeros apart.

**Try it:** The Poisson model could not explain all the zeros we saw. Compute how many observed zeros it failed to account for, using the two objects from the block above.

```r title="Your turn: count the unexplained zeros"
# Uncomment the line below and fill in the two objects from the last block.
# extra_zeros <- observed_zeros - expected_zeros
# extra_zeros
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unexplained zeros solution"
extra_zeros <- observed_zeros - expected_zeros
extra_zeros
#> [1] 62.90671
```

**Explanation:** About 63 of the 114 zeros are extra zeros that a Poisson model cannot produce. That gap is exactly the hole the models in this guide are built to fill.

</details>

## What is the real difference between zero-inflated and hurdle models?

Both models attach a second, smaller model to the count model, and that second model is in charge of the zeros. The difference is a subtle but important disagreement about where zeros are allowed to come from. Get this idea first and the R code afterwards will feel obvious.

A zero-inflated model says zeros come from two places at once. There is a hidden on/off switch that turns some observations into guaranteed "always zero" cases (the structural zeros), and separately the ordinary count process can also land on zero by chance (the sampling zeros). The zeros in your data are a blend of both.

A hurdle model tells a cleaner story. There is a single gate, or hurdle. You are either a zero or you clear the hurdle and become a positive count, and one binary model decides which. Once you clear the hurdle, a special count model that can never produce a zero explains how high you go. In a hurdle model, all zeros come from the gate, never from the count part.

![In a zero-inflated model both parts can produce zeros; in a hurdle model only the gate does, and the count part is truncated to positive values.](screenshots/Zero-Inflated-Hurdle-Models-in-R-zi-vs-hurdle.webp)

*Figure 2: In a zero-inflated model both parts can make zeros; in a hurdle model only the gate does.*

Here is the same contrast as a quick reference.

| Question | Zero-inflated | Hurdle |
|---|---|---|
| Where do zeros come from? | A switch plus the count model | The gate only |
| Can the count part make a zero? | Yes | No, it is truncated at 1 |
| Natural reading of the zero part | Chance of an always-zero case | Chance of clearing the hurdle |
| Good fit when | Zeros are a mix of two sources | Zero versus positive is a real threshold |

To see why children matter so much in our data, let's cross-tabulate the number of children against whether a group caught anything.

```r title="Do groups with more children catch fewer fish"
table(children = fishing$child, caught_fish = fishing$fish > 0)
#>         caught_fish
#> children FALSE TRUE
#>        0    29   72
#>        1    43   49
#>        2    31   13
#>        3    11    2
```

The pattern is stark. Among groups with no children, most caught something (72 of 101). Among groups with three children, almost none did (2 of 13). Children are pushing groups into the zero state, which is exactly the kind of predictor the zero part of these models is designed to hold.

[NOTE]
**Both models use the same two-part formula in R.** You write the count predictors, then a vertical bar, then the zero predictors, as in `fish ~ persons + camper | child`. The left side models the counts and the right side models the zeros, and you can give each side a different set of predictors.

**Try it:** Children clearly drive the zeros. Check whether the camper flag shows the same kind of split by making the same table for `camper` instead of `child`.

```r title="Your turn: cross-tabulate camper against catching fish"
# Uncomment and complete the table() call for the camper column.
# table(camper = fishing$camper, caught_fish = fishing$fish > 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Camper cross-tab solution"
table(camper = fishing$camper, caught_fish = fishing$fish > 0)
#>       caught_fish
#> camper FALSE TRUE
#>      0    52   59
#>      1    62   77
```

**Explanation:** The camper split is mild (roughly half caught fish either way), so camper is a weak predictor of the zero state compared to children. That is a hint we should let children drive the zero part and let camper drive the count part.

</details>

## How do you fit a zero-inflated Poisson model in R?

The `zeroinfl()` function from the pscl package fits a zero-inflated model in one call. We will let group size and the camper flag drive the count of fish, and let the number of children drive the chance of being a structural zero. That is the `count ~ ... | zero` formula from the last section.

```r title="Fit a zero-inflated Poisson model"
zip <- zeroinfl(fish ~ persons + camper | child, data = fishing, dist = "poisson")
summary(zip)
#>
#> Call:
#> zeroinfl(formula = fish ~ persons + camper | child, data = fishing, dist = "poisson")
#>
#> Pearson residuals:
#>     Min      1Q  Median      3Q     Max
#> -1.5494 -0.7491 -0.2524  0.5405  3.3540
#>
#> Count model coefficients (poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -0.64031    0.15044  -4.256 2.08e-05 ***
#> persons      0.60923    0.03915  15.562  < 2e-16 ***
#> camper       0.81405    0.08741   9.313  < 2e-16 ***
#>
#> Zero-inflation model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -1.1407     0.2212  -5.156 2.52e-07 ***
#> child         0.8953     0.1785   5.016 5.28e-07 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Number of iterations in BFGS optimization: 12
#> Log-likelihood: -410.1 on 5 Df
```

The summary prints two blocks of coefficients because you fit two models at once. Read them one at a time.

The top block, the count model, is an ordinary Poisson regression on the log scale. The `persons` coefficient of 0.609 is positive and highly significant, so bigger groups catch more fish. The `camper` coefficient of 0.814 says camper groups catch more too. These are the numbers for groups that are actually in the fishing process.

The bottom block, the zero-inflation model, is a logistic regression that predicts the probability of being a structural zero, that is, an "always zero" group. The `child` coefficient is positive, 0.895, so more children raises the chance that a group is one of those never-fishing cases. This is where the excess zeros are coming from, and the model recovers the story we built into the data.

The log scale is hard to feel, so exponentiate the coefficients to get numbers you can talk about.

```r title="Turn the coefficients into ratios"
exp(coef(zip))
#> count_(Intercept)     count_persons      count_camper  zero_(Intercept)        zero_child
#>         0.5271281         1.8390108         2.2570311         0.3195928         2.4480814
```

Now the count part reads as rate ratios. Each extra person multiplies the expected catch by about 1.84, and having a camper multiplies it by about 2.26, holding the other predictor fixed. The zero part reads as odds ratios: each additional child multiplies the odds of being a structural zero by about 2.45. A family with more kids is far more likely to be a group that was never going to fish.

[WARNING]
**The zero part predicts an extra zero, not a positive count.** In a zero-inflated model a positive zero-part coefficient means more chance of an always-zero case, so it pushes the outcome down toward zero. Reading it backwards, as if a positive coefficient meant more fish, is the most common mistake with these models.

If you like seeing the mechanics, the zero-inflated Poisson splits the probability of each outcome like this. Skip to the next section if formulas are not your thing, since the code above already tells the whole story.

$$P(Y = 0) = \pi + (1 - \pi)\,e^{-\lambda}$$

$$P(Y = k) = (1 - \pi)\,\frac{\lambda^{k} e^{-\lambda}}{k!}, \quad k = 1, 2, 3, \dots$$

Where:

- $\pi$ = the probability of being a structural zero (from the logistic zero part)
- $\lambda$ = the Poisson rate for the count part
- The zero row has two pieces: the structural zeros ($\pi$) plus the ordinary Poisson zeros $(1 - \pi)e^{-\lambda}$

**Try it:** Pull the rate ratio for `persons` out of the exponentiated coefficients. The name you want is `count_persons`, not `count_camper`.

```r title="Your turn: rate ratio for persons"
# Exponentiate the coefficients, then index the persons rate ratio.
rate_ratios <- exp(coef(zip))
# rate_ratios["count_persons"]   # <- uncomment and run
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rate ratio for persons solution"
exp(coef(zip))["count_persons"]
#> count_persons
#>      1.839011
```

**Explanation:** Each extra person in a fishing group multiplies the expected number of fish by about 1.84, all else equal.

</details>

## How do you fit a hurdle model in R?

Fitting a hurdle model uses the same formula and the same package. Only the function name changes, from `zeroinfl()` to `hurdle()`. The story it tells about the zeros, though, flips around, so read the zero part carefully.

```r title="Fit a hurdle model"
hp <- hurdle(fish ~ persons + camper | child, data = fishing, dist = "poisson")
summary(hp)
#>
#> Call:
#> hurdle(formula = fish ~ persons + camper | child, data = fishing, dist = "poisson")
#>
#> Pearson residuals:
#>     Min      1Q  Median      3Q     Max
#> -1.4305 -0.8154 -0.3556  0.6221  3.4926
#>
#> Count model coefficients (truncated poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -0.77871    0.16509  -4.717 2.39e-06 ***
#> persons      0.63814    0.04188  15.239  < 2e-16 ***
#> camper       0.86108    0.09123   9.438  < 2e-16 ***
#> Zero hurdle model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   0.9441     0.1980   4.767 1.87e-06 ***
#> child        -0.8734     0.1675  -5.214 1.85e-07 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Number of iterations in BFGS optimization: 13
#> Log-likelihood: -406.3 on 5 Df
```

The count block on top is almost the same as before, with one label change: it is now a *truncated* Poisson, meaning a Poisson that is not allowed to be zero. That truncation is what lets the gate own all the zeros.

The zero block at the bottom is where the reading flips. In a hurdle model this part predicts the probability of *clearing the hurdle*, that is, catching at least one fish. The `child` coefficient is now negative, -0.873, which says more children lowers the chance of catching anything. Compare that to the zero-inflated fit, where the child coefficient was positive because it predicted the opposite event, the chance of being an always-zero case.

```r title="Exponentiate the hurdle coefficients"
exp(coef(hp))
#> count_(Intercept)     count_persons      count_camper  zero_(Intercept)        zero_child
#>         0.4589959         1.8929585         2.3657200         2.5704559         0.4175132
```

The count ratios tell the same story as the zero-inflated model: more persons and a camper both raise the catch. The zero-part ratio for `child` is now 0.42, meaning each extra child multiplies the odds of catching any fish by about 0.42, so it cuts those odds by more than half. The same predictor points the opposite way here, because the two models are describing opposite events.

[KEY INSIGHT]
**The sign of the zero part flips between the two models.** A zero-inflated model's zero part predicts the probability of a zero, so a positive coefficient means more zeros. A hurdle model's zero part predicts the probability of a positive count, so a positive coefficient means fewer zeros. Always check which event the zero part is modeling before you interpret a sign.

For completeness, the hurdle model factors each probability like this. Feel free to skip it, since the fitted output above is all you need to use the model.

$$P(Y = 0) = 1 - p$$

$$P(Y = k) = p \cdot \frac{\lambda^{k} e^{-\lambda}}{(1 - e^{-\lambda})\,k!}, \quad k = 1, 2, 3, \dots$$

Where:

- $p$ = the probability of clearing the hurdle (from the logistic zero part)
- $\lambda$ = the rate of the truncated Poisson count part
- Dividing by $(1 - e^{-\lambda})$ rescales the Poisson so it never returns a zero

**Try it:** Using the hurdle model, find the probability that a group catches at least one fish when it has no children versus two children. The helper below sets up the two groups for you.

```r title="Your turn: chance of catching any fish"
newk <- data.frame(persons = 2, camper = 1, child = c(0, 2))
# The prob column [, 1] is P(zero). Turn it into P(at least one fish).
# 1 - predict(hp, newdata = newk, type = "prob")[, 1]   # <- uncomment
```

<details>
<summary>Click to reveal solution</summary>

```r title="Chance of any fish solution"
newk <- data.frame(persons = 2, camper = 1, child = c(0, 2))
1 - predict(hp, newdata = newk, type = "prob")[, 1]
#>         1         2
#> 0.7199237 0.3094280
```

**Explanation:** A childless group clears the hurdle about 72 percent of the time, but a group with two children only about 31 percent of the time. Children more than halve the chance of catching anything.

</details>

## How do you handle overdispersion with negative binomial versions?

Sometimes the counts that clear the hurdle are still more spread out than a Poisson allows. The fix is the same one you would use for any count model: swap the Poisson for a negative binomial, which adds a dispersion parameter that lets the variance grow past the mean. Both `zeroinfl()` and `hurdle()` accept `dist = "negbin"`.

```r title="Fit the negative binomial versions"
zinb <- zeroinfl(fish ~ persons + camper | child, data = fishing, dist = "negbin")
hnb  <- hurdle(fish ~ persons + camper | child, data = fishing, dist = "negbin")

zinb$theta
#> [1] 240961.4
```

That `theta` is the negative binomial's dispersion parameter, and a very large value is informative. As theta grows toward infinity the negative binomial becomes identical to a Poisson. A theta in the hundreds of thousands means the model found no leftover overdispersion to absorb: once the excess zeros were handled, there was nothing extra for the negative binomial to do.

The clean way to confirm that is to line all five models up by AIC, a score where lower means a better trade-off between fit and complexity.

```r title="Compare all five models by AIC"
AIC(pois, zip, hp, zinb, hnb)
#>      df       AIC
#> pois  4 1275.8241
#> zip   5  830.2973
#> hp    5  822.5364
#> zinb  6  832.2977
#> hnb   6  824.5372
```

The plain Poisson is far behind at 1275.8, which confirms it was the wrong model. The two-part models all cluster around 825 to 832, a massive improvement. The negative binomial versions (`zinb` and `hnb`) score slightly *worse* than their Poisson twins, because they spend an extra parameter on dispersion that this data does not need. Here the plain hurdle Poisson (`hp`) wins.

[NOTE]
**Modeling the excess zeros can make overdispersion disappear.** Overdispersion and excess zeros often look alike in raw data. Once a two-part model explains the zeros directly, the leftover spread can shrink to nothing, which is why the negative binomial did not help here. On other datasets it will, so always check.

**Try it:** Read the AIC of the negative binomial hurdle model, `hnb`, and compare it in your head to the plain hurdle Poisson's 822.5.

```r title="Your turn: AIC of the NB hurdle"
# Uncomment to print the AIC of the negative binomial hurdle model.
# AIC(hnb)
```

<details>
<summary>Click to reveal solution</summary>

```r title="AIC of NB hurdle solution"
AIC(hnb)
#> [1] 824.5372
```

**Explanation:** At 824.5, the negative binomial hurdle scores about two points worse than the plain hurdle Poisson at 822.5. The extra dispersion parameter is not earning its keep on this data.

</details>

## How do you choose between the models?

AIC gives you a single number, but you should never lean on one number alone. A second, more honest check for count data is to ask each model how many zeros it predicts and compare that to the 114 zeros you actually saw. A model built for excess zeros should get the zero count roughly right.

```r title="How many zeros does each model predict"
zeros_pred <- c(
  Poisson = sum(dpois(0, fitted(pois))),
  ZIP     = sum(predict(zip,  type = "prob")[, 1]),
  Hurdle  = sum(predict(hp,   type = "prob")[, 1]),
  ZINB    = sum(predict(zinb, type = "prob")[, 1])
)
round(rbind(observed = observed_zeros, predicted = zeros_pred), 1)
#>           Poisson   ZIP Hurdle  ZINB
#> observed    114.0 114.0    114 114.0
#> predicted    51.1 117.3    114 117.3
```

The Poisson predicts only 51 zeros against 114 observed, a failure you already knew about. The zero-inflated models land close, at about 117. The hurdle model matches it exactly at 114, and that is not luck. A hurdle model reproduces the observed number of zeros by construction, because its gate is fit directly to the zero-versus-positive split. That reliability is one reason hurdle models are popular.

You may have read about the Vuong test for comparing these models. Treat it with caution: its use for comparing zero-inflated against standard models has been criticized and is no longer recommended by many authors, including the pscl maintainers. AIC together with the predicted-zeros check is a more dependable pairing.

That leaves the real decision, which is about your data's story rather than any single statistic.

![A short decision guide: choose zero-inflated or hurdle by where the zeros come from, then add a negative binomial only if the variance is still high.](screenshots/Zero-Inflated-Hurdle-Models-in-R-which-model.webp)

*Figure 3: A quick decision guide for choosing a count model when zeros pile up.*

Use this to guide the choice:

1. **Can a zero come from the counting process itself?** If a subject who is "in" the process could still record a zero by chance, a zero-inflated model fits the story. If a zero always means the subject never entered the process, a hurdle model fits better.
2. **Is there a clean threshold between zero and positive?** Cases like "signed up versus never signed up" are natural hurdles. Cases where zeros and low counts blur together lean zero-inflated.
3. **Is the variance still above the mean after fitting?** If the leftover spread is large, switch that model to its negative binomial form. If not, keep the simpler Poisson version.

[TIP]
**When two models fit almost equally well, pick the one whose story matches your data.** A hurdle model says "getting started" and "how much" are separate decisions, while a zero-inflated model says some subjects are simply never at risk. Choosing the model that matches your subject-matter logic makes your coefficients easier to defend than chasing a one-point AIC difference.

**Try it:** Let R pick the winner for you by finding which of the five models has the lowest AIC.

```r title="Your turn: find the lowest-AIC model"
# Uncomment to grab the row name of the smallest AIC.
# mods <- AIC(pois, zip, hp, zinb, hnb)
# rownames(mods)[which.min(mods$AIC)]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lowest-AIC model solution"
mods <- AIC(pois, zip, hp, zinb, hnb)
rownames(mods)[which.min(mods$AIC)]
#> [1] "hp"
```

**Explanation:** The plain hurdle Poisson (`hp`) has the lowest AIC, matching what the predicted-zeros check told us.

</details>

## How do you make predictions from the fitted model?

A fitted model is most useful when it makes predictions for new cases. The `predict()` function understands several `type` values, and each one answers a different question. The most useful are `"response"` for the expected count, `"zero"` for the probability of the zero state, and `"prob"` for the full probability of each possible count.

Let's predict for a new group: three people, no children, with a camper.

```r title="Predict for a new group with the zero-inflated model"
new_group <- data.frame(persons = 3, child = 0, camper = 1)

predict(zip, newdata = new_group, type = "response")   # expected number of fish
#>        1
#> 5.607466
predict(zip, newdata = new_group, type = "zero")       # chance of being a structural zero
#>         1
#> 0.2421905
```

The zero-inflated model expects this group to catch about 5.6 fish on average, and it puts the probability that they are a never-fishing structural zero at about 24 percent. The expected count of 5.6 already blends both parts: it is the count-model rate scaled down by the chance of being an always-zero group.

The hurdle model answers the same two questions with its own wording.

```r title="Predict for the same group with the hurdle model"
predict(hp, newdata = new_group, type = "response")    # expected number of fish
#>        1
#> 5.305872
predict(hp, newdata = new_group, type = "prob")[, 1]   # chance of catching zero fish
#> [1] 0.2800763
```

The hurdle model expects about 5.3 fish and gives this group a 28 percent chance of catching nothing. The two models land close on the expected count, which is reassuring, and they express the zero side in their own natural language: a structural-zero probability for zero-inflated, a plain probability of zero for hurdle.

[TIP]
**Use type equals response for the expected count, and do not multiply the parts by hand.** The response prediction already combines the count part and the zero part correctly. Building the expected value yourself by multiplying rates and probabilities is a common source of off-by-a-factor errors.

**Try it:** Predict the expected catch for a large group with children: four people, two children, and a camper. Use the zero-inflated model.

```r title="Your turn: predict a big group with kids"
# Uncomment and fill in the new data frame for the zero-inflated model.
# predict(zip, newdata = data.frame(persons = 4, child = 2, camper = 1), type = "response")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predict big group solution"
predict(zip, newdata = data.frame(persons = 4, child = 2, camper = 1), type = "response")
#>        1
#> 4.667666
```

**Explanation:** Even though this group is larger, the two children pull the expected catch down to about 4.7 fish, because children raise the chance of the structural-zero state.

</details>

## Practice Exercises

These exercises combine several ideas from the guide. Try each one before opening the solution. They use their own variable names so they will not disturb the models you fit above.

### Exercise 1: Diagnose and fit on new data

A subscription business counts monthly `purchases` for 300 customers and suspects that many customers are window-shoppers who never buy. The starter builds the data. Your job is to confirm the excess-zero problem by comparing observed zeros to what a Poisson expects, then fit a zero-inflated Poisson and check whether `tenure` significantly predicts the zero state.

```r title="Exercise 1 starter: purchases data"
set.seed(101)
m <- 300
tenure    <- sample(1:24, m, replace = TRUE)
inactive  <- rbinom(m, 1, plogis(1.2 - 0.18 * tenure))   # short-tenure customers never buy
lam       <- exp(0.5 + 0.04 * tenure)
purchases <- ifelse(inactive == 1, 0, rpois(m, lam))
shop <- data.frame(purchases, tenure)

# 1. Fit a plain Poisson and compare observed zeros to expected zeros.
# 2. Fit zeroinfl(purchases ~ tenure | tenure) and inspect the zero part.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
# 1. Observed versus Poisson-expected zeros
mp <- glm(purchases ~ tenure, data = shop, family = poisson)
c(observed = sum(shop$purchases == 0),
  poisson_expected = round(sum(dpois(0, fitted(mp))), 1))
#>         observed poisson_expected
#>            104.0             68.8

# 2. Zero-inflated Poisson: is tenure a real driver of the zero state?
pzip <- zeroinfl(purchases ~ tenure | tenure, data = shop, dist = "poisson")
round(summary(pzip)$coefficients$zero, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   1.2196     0.3572  3.4148    6e-04
#> tenure       -0.2008     0.0319 -6.2932    0e+00
```

**Explanation:** The Poisson expects only about 69 zeros but the data has 104, so the excess is real. In the zero part, `tenure` has a strongly significant negative coefficient, meaning longer-tenured customers are much less likely to be in the never-buying state.

</details>

### Exercise 2: Does a predictor belong in the zero part?

Using the `fishing` data, you already fit a zero-inflated Poisson with only `child` in the zero part. Test whether adding `persons` to the zero part improves the model. Fit both, compare their AIC, and look at whether the new coefficient is significant.

```r title="Exercise 2 starter"
# Fit two zero-inflated models on the fishing data:
#   small: fish ~ persons + camper | child
#   big:   fish ~ persons + camper | child + persons
# Then compare AIC and read the zero part of the bigger model.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
z_small <- zeroinfl(fish ~ persons + camper | child, data = fishing, dist = "poisson")
z_big   <- zeroinfl(fish ~ persons + camper | child + persons, data = fishing, dist = "poisson")
AIC(z_small, z_big)
#>         df      AIC
#> z_small  5 830.2973
#> z_big    6 830.5805

round(summary(z_big)$coefficients$zero, 4)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -1.6064     0.4363 -3.6820   0.0002
#> child         0.9059     0.1813  4.9959   0.0000
#> persons       0.1727     0.1341  1.2878   0.1978
```

**Explanation:** Adding `persons` to the zero part raises the AIC from 830.3 to 830.6, so it makes the model slightly worse, and the new coefficient is not significant (p = 0.20). Keep `persons` in the count part where it belongs and leave the zero part to `child`.

</details>

### Exercise 3: Interpret a hurdle model by hand

Confirm that you can reproduce `predict()` from the raw coefficients of the hurdle model `hp`. Compute the rate ratio for `camper` in the count part, then compute the probability that a group with one child clears the hurdle, and check it against `predict()`.

```r title="Exercise 3 starter"
# From the fitted hurdle model hp:
#   1. rate ratio for camper = exp of its count coefficient
#   2. P(clear hurdle) for child = 1 using plogis() on the zero-part coefficients
#   3. compare step 2 to 1 - predict(hp, ..., type = "prob")[, 1]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cf <- coef(hp)

# 1. Rate ratio for camper in the count part
exp(cf["count_camper"])
#> count_camper
#>      2.36572

# 2. and 3. P(clear the hurdle) for a group with one child, by hand and from predict()
p_hand <- plogis(cf["zero_(Intercept)"] + cf["zero_child"] * 1)
p_pred <- 1 - predict(hp, newdata = data.frame(persons = 2, camper = 1, child = 1),
                      type = "prob")[, 1]
c(by_hand = unname(p_hand), from_predict = unname(p_pred))
#>      by_hand from_predict
#>    0.5176537    0.5176537
```

**Explanation:** Having a camper multiplies the expected catch by about 2.37. A group with one child clears the hurdle about 52 percent of the time, and the by-hand calculation matches `predict()` exactly, which shows the zero part really is just a logistic regression.

</details>

## Frequently Asked Questions

### When should I use a zero-inflated model instead of a hurdle model?

Use a zero-inflated model when a zero can come from two sources: subjects who are never at risk plus subjects who are at risk but happened to score zero. Use a hurdle model when every zero means the subject never crossed a threshold, so zero and positive are two clean states. When the two fit almost equally well, pick the one whose story matches your data.

### What does the vertical bar in the formula mean?

The bar separates the two models. Everything before it, as in `fish ~ persons + camper`, are the predictors for the count part. Everything after it, as in `| child`, are the predictors for the zero part. You can use different predictors on each side, and if you leave the right side off, both parts share the same predictors.

### Why did the negative binomial version not improve my model?

Excess zeros and overdispersion look similar in raw data, and both inflate the variance. Once a zero-inflated or hurdle model explains the zeros directly, the leftover overdispersion can vanish, so the negative binomial's extra parameter has nothing to absorb. A theta that shoots up to a huge value is the sign that the negative binomial has collapsed back to a Poisson.

### Can I use the Vuong test to compare these models?

You can compute it, but treat it carefully. Its use for testing zero-inflated models against standard count models has been criticized and is no longer recommended by many statisticians, including the pscl authors. Comparing AIC and checking each model's predicted number of zeros against the observed count is a more reliable approach.

### Do these models work in local RStudio the same way?

Yes. Everything in this guide uses base R plus the `pscl` and `MASS` packages, which are standard CRAN packages. The same code runs unchanged in RStudio; install pscl once with `install.packages("pscl")` and you are set.

## Summary

Zero-inflated and hurdle models handle count data with more zeros than a Poisson can explain by splitting the process into a zero part and a count part. Diagnose the problem first by comparing observed zeros to Poisson-expected zeros, then fit both models, then choose with AIC and a predicted-zeros check.

| Model | What it assumes about zeros | R call | Reach for it when |
|---|---|---|---|
| Poisson | Zeros come only from the count process | `glm(..., family = poisson)` | Mean and variance are close, zeros are not excessive |
| Zero-inflated | A switch adds structural zeros on top of count zeros | `zeroinfl(y ~ x | z)` | Zeros mix two sources: never-at-risk plus at-risk-but-zero |
| Hurdle | One gate decides zero versus positive; counts are truncated | `hurdle(y ~ x | z)` | Zero versus positive is a real threshold |
| Negative binomial variants | Same as above, plus extra spread in the counts | `dist = "negbin"` | Variance is still above the mean after fitting |

![An overview of the workflow: diagnose the excess zeros, fit zero-inflated and hurdle models, then choose the best one.](screenshots/Zero-Inflated-Hurdle-Models-in-R-overview.webp)

*Figure 4: The whole workflow, from diagnosing the zeros to choosing a model.*

The biggest ideas to carry with you: excess zeros break a Poisson model in a way you can measure, the vertical-bar formula fits two models at once, and the sign of the zero part flips between zero-inflated and hurdle because they model opposite events.

## References

1. Zeileis, A., Kleiber, C., & Jackman, S. (2008). *Regression Models for Count Data in R.* Journal of Statistical Software, 27(8). [Link](https://www.jstatsoft.org/article/view/v027i08) - the canonical paper behind `pscl`, with the theory and R syntax for both `zeroinfl()` and `hurdle()`.
2. pscl package reference: `zeroinfl()` and `hurdle()`. [Link](https://cran.r-project.org/web/packages/pscl/pscl.pdf) - the official function docs, listing every argument used in this guide.
3. UCLA OARC Statistical Consulting. *Zero-Inflated Poisson Regression.* [Link](https://stats.oarc.ucla.edu/r/dae/zip/) - a worked ZIP walkthrough in R whose approach closely mirrors this one.
4. Cameron, A. C., & Trivedi, P. K. (2013). *Regression Analysis of Count Data*, 2nd Edition. Cambridge University Press. - the standard textbook treatment of count models, excess zeros, and overdispersion.
5. Venables, W. N., & Ripley, B. D. (2002). *Modern Applied Statistics with S* (MASS), 4th Edition. Springer. [Link](https://www.stats.ox.ac.uk/pub/MASS4/) - background on the negative binomial machinery that the `dist = "negbin"` variants rely on.
6. Kleiber, C., & Zeileis, A. (2008). *Applied Econometrics with R.* Springer. [Link](https://link.springer.com/book/10.1007/978-0-387-77318-6) - chapter-length examples of count-data models using the same R tooling.
7. Feng, C. X. (2021). *A comparison of zero-inflated and hurdle models for modeling zero-inflated count data.* Journal of Statistical Distributions and Applications, 8(8). [Link](https://jsdajournal.springeropen.com/articles/10.1186/s40488-021-00121-4) - a recent, direct comparison of the two model families to guide your choice.

## Continue Learning

- [Poisson and Negative Binomial Regression in R](Poisson-and-Negative-Binomial-Regression.html) - the base count models that these two-part models extend.
- [Offsets and Exposure in Poisson Models in R](Offsets-and-Exposure-in-R.html) - turn raw counts into rates when groups are observed for different lengths of time.
- [How to Read Logistic Regression Output in R](Read-Logistic-Output-in-R.html) - a deeper look at reading the logistic half that powers the zero part of both models.
