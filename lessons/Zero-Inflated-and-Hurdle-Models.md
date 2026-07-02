---
title: "Advanced Regression Lesson 9: Zero-Inflated and Hurdle Models"
catalog_blurb: "How to model counts when a separate process piles up extra zeros."
description: "Handle counts with far more zeros than a Poisson allows: tell structural from sampling zeros, then fit and read zero-inflated and hurdle models in R with pscl."
keywords: "zero-inflated Poisson, hurdle model, zeroinfl, pscl, excess zeros, structural zeros, count data, negative binomial, ZIP, zero-truncated, GLM, R"
post_type: "LESSON"
curriculum_id: "6.130.9"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "9"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Gamma-and-Tweedie-Regression.html"
course_prev: "Count-Models-Poisson-and-Negative-Binomial.html"
---

=== step === cover
::eyebrow Lesson 9 of 13
## Zero-Inflated and Hurdle Models

In Lesson 8 you gave counts the model they deserve: a Poisson on the log scale, and a negative binomial when the spread ran wider than a Poisson allows. That fixed the long right tail, the busy race-weekend days. But it quietly assumed one thing about every zero: that a zero is just a very quiet count-day.

Back to Amara's bike-repair co-op. This winter she started closing the shop on cold snaps, she cannot feel her fingers to true a wheel at minus five. On a closed day the tally is 0, and it could never have been anything else. No weather, no passing race, nothing can produce a repair when the door is locked.

Now her daily counts carry two completely different kinds of zero. Some are closed days (the door was locked). Others are open days that simply stayed quiet. Pile them together and you get far more zeros than any Poisson or negative binomial expects, and, worse, a model that cannot tell you *why* the zeros happen. This lesson gives you two models built exactly for that: the **zero-inflated** model and the **hurdle** model. Toggle the widget below to Zero-Inflated and watch the fitted line finally reach up to the tall zero bar it kept missing.

By the end of this lesson you will be able to:

- Tell a structural zero (never at risk) from a sampling zero (at risk but landed on 0)
- Fit a zero-inflated Poisson in R and read its two coefficient blocks
- Fit a hurdle model, see how its two parts differ, and choose between the two

**Prerequisites:** you can fit and read a [Poisson and negative binomial regression](Count-Models-Poisson-and-Negative-Binomial.html) and know rate ratios and overdispersion. You have met the [logit link and reading a logistic model](Logistic-Regression-Done-Properly.html) as odds. Comfortable with logs and exponents.

::widget count-dist {}

=== step === concept
::eyebrow The heart of it
## Two kinds of zero

A zero in Amara's notebook is not always the same event. There are two very different ways to write down a 0:

- **Structural zero.** The shop was closed. This day was *never at risk* of a repair, the count was destined to be 0 before the day even began.
- **Sampling zero.** The shop was open and ready, but no bikes happened to come in. This day was at risk, the count process simply landed on 0, the way a Poisson sometimes does.

A negative binomial sees only one pile of zeros and treats every one as a sampling zero, an open-but-quiet day. When a big share are really closed days, that story is wrong twice over: it underestimates how many zeros there are, and it hides the fact that a whole separate process (whether the door was open) is driving them.

Here is Amara's winter record, two hundred and forty days, built right here so every line on this page runs in interactive R. Some days the shop was closed; open-day repairs follow a Poisson rate that climbs when it rains.

```r
set.seed(7)
n <- 240
rain <- rbinom(n, 1, 0.40)                       # 0 = dry day, 1 = rainy day
cold <- rbinom(n, 1, 0.35)                       # 0 = mild, 1 = cold snap
open <- rbinom(n, 1, plogis(1.3 - 2.0 * cold))   # 1 = open, 0 = closed (a structural zero)
lambda <- exp(1.3 + 0.6 * rain)                  # the open-day repair rate
repairs <- ifelse(open == 1, rpois(n, lambda), 0)
bikes <- data.frame(
  repairs = repairs,
  rain = factor(rain, labels = c("dry", "rainy")),
  cold = factor(cold, labels = c("mild", "cold"))
)
c(days = n, zeros = sum(bikes$repairs == 0), busiest = max(bikes$repairs))
#>    days   zeros busiest
#>     240      98      13
```

Ninety-eight of the two hundred and forty days are zero, about 41 percent. Now compare that to the zeros a plain Poisson would expect, given the same average:

```r
obs_zeros  <- mean(bikes$repairs == 0)
pois_zeros <- dpois(0, mean(bikes$repairs))       # zeros a fitted Poisson expects
c(observed = round(obs_zeros, 3), poisson_expects = round(pois_zeros, 3))
#>        observed poisson_expects
#>           0.408           0.048
```

A Poisson expects about 5 percent zeros; Amara sees 41 percent. Even the negative binomial from Lesson 8, which stretches to cover the tail, still comes up short at the zero bar:

```r
library(MASS)
nb <- glm.nb(repairs ~ rain, data = bikes)
nb_zeros <- mean(dnbinom(0, mu = fitted(nb), size = nb$theta))
c(observed = round(obs_zeros, 3), nb_expects = round(nb_zeros, 3))
#>   observed nb_expects
#>      0.408      0.333
```

The negative binomial creeps up to 33 percent by fattening its spread, but it still under-counts the zeros, and it has no way to say a word about *why* they are there. The picture below is that shape: the observed bars, with a zero bar far taller than the fitted count line can reach.

::widget process-flow {"steps":[{"title":"Structural zeros","sub":"closed days: repairs = 0, no matter what"},{"title":"The count process","sub":"open days: a Poisson rate, usually positive"},{"title":"What you observe","sub":"a mix; any single 0 could be either kind"}]}

=== step === quiz
::eyebrow Check yourself
## Which zero is which?

Amara logs two 0-repair days. Monday: a bitter cold snap, she never unlocked the shop. Thursday: mild and clear, the shop was open all day but not one bike came in. How should a zero-inflated model think about these two zeros?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both are the same kind of zero, so any count model treats them identically ::no That is exactly the assumption that fails here. Monday could never have been positive (closed); Thursday was at risk and happened to be 0. Lumping them together is why a plain Poisson or NB misfits.
- Monday is a structural zero (never at risk, the shop was closed); Thursday is a sampling zero (at risk, the count process landed on 0) ::ok Right. That split, some zeros from a separate never-at-risk process, some from the count process itself, is the whole reason zero-inflated and hurdle models exist.
- Thursday is structural because clear weather guarantees no repairs ::no It is the other way round. Clear, mild, and open means Thursday was fully at risk; it just drew a 0. Monday, closed, is the structural one.

=== step === concept
::eyebrow The first fix
## Zero-inflated: one model, two parts

A **zero-inflated Poisson** (ZIP) models Amara's two zero-sources at once. It says every day is secretly one of two types, and it estimates both the type and the count in a single fit:

- a **zero-inflation part**, a logistic model for the probability \(\pi_i\) ("pi") that day \(i\) is a structural zero (a closed day, certain to be 0);
- a **count part**, an ordinary Poisson with rate \(\lambda_i\) ("lambda") for the at-risk days, exactly the Poisson you already know.

Because a zero can arrive two ways, its probability adds the two paths together:

\[ P(Y_i = 0) = \pi_i + (1 - \pi_i)\, e^{-\lambda_i}, \]

\[ P(Y_i = k) = (1 - \pi_i)\, \frac{\lambda_i^{\,k}\, e^{-\lambda_i}}{k!}, \qquad k = 1, 2, 3, \dots \]

Here \(Y_i\) is the count on day \(i\), \(k\) is a specific value it takes, and \(e \approx 2.718\). Read the first line as: a day is a structural zero with probability \(\pi_i\), OR it is at-risk (probability \(1-\pi_i\)) and its Poisson happens to land on 0 (probability \(e^{-\lambda_i}\)). A positive count \(k\) can only come from the at-risk path, so its probability is just the Poisson, scaled by \(1-\pi_i\). Each part gets its own predictors through a link:

\[ \log(\lambda_i) = \beta_0 + \beta_1 x_i, \qquad \mathrm{logit}(\pi_i) = \gamma_0 + \gamma_1 z_i, \]

where \(x_i\) is the count predictor (rain, does it drive how busy an open day is) and \(z_i\) is the zero predictor (cold, does it drive whether the shop is shut). The \(\beta\)s are the count coefficients on the log scale; the \(\gamma\)s ("gamma") are the zero-inflation coefficients on the logit scale.

The `zeroinfl()` function from the **pscl** package fits both parts in one call. The formula has two sides split by a `|`: the count predictors go on the left, the zero-inflation predictors on the right.

```r
library(pscl)
zi <- zeroinfl(repairs ~ rain | cold, data = bikes, dist = "poisson")
summary(zi)
#> Count model coefficients (poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  1.29022    0.06006  21.482   <2e-16 ***
#> rainrainy    0.65693    0.07721   8.509   <2e-16 ***
#>
#> Zero-inflation model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -1.0502     0.1850  -5.676 1.38e-08 ***
#> coldcold      1.8170     0.3052   5.954 2.62e-09 ***
```

Two blocks, two stories. Exponentiate each to read it in plain units, the count block as rate ratios (like Lesson 8) and the zero block as odds ratios (like a logistic model):

```r
round(exp(coef(zi, "count")), 2)   # count part: rate ratios
#> (Intercept)   rainrainy
#>        3.63        1.93
round(exp(coef(zi, "zero")), 2)    # zero-inflation part: odds ratios
#> (Intercept)    coldcold
#>        0.35        6.15
```

- **Count block:** an open day sees about 3.6 repairs (baseline), and a rainy open day runs about 1.9 times as busy as a dry one. Rain drives *how many*.
- **Zero block:** a cold day has about 6.1 times the odds of being a structural zero, a closed day, than a mild one. Cold drives *whether the shop opens at all*.

And it fits the zeros it kept missing. The model's own predicted share of zeros now lands right on what Amara actually saw:

```r
round(mean(predict(zi, type = "prob")[, 1]), 3)   # ZIP's predicted P(repairs = 0)
#> [1] 0.409
```

0.409 predicted against 0.408 observed. The extra zeros are no longer a mystery the model has to absorb; they have their own explanation.

::widget count-dist {}

=== step === tryit
::eyebrow Your turn
## Point each part at the right driver

A zero-inflated model only helps if each side of the `|` points at the right thing. The count side already has `rain` (what makes an open day busy). Fill in the zero-inflation side with the variable that decides whether the day is a *structural zero*, a closed day.

```r
zi2 <- zeroinfl(repairs ~ rain | ____, data = bikes, dist = "poisson")
round(exp(coef(zi2, "zero")), 2)
```
::check {"regex":"cold","gate":true,"difficulty":"intermediate","ok":"Right. cold is what shuts the shop, so it belongs on the zero-inflation side. rain belongs on the count side (how busy an open day is). Matching each predictor to the process it drives is the whole point.","no":"Which variable makes the shop close? That is the cold snap. Put cold on the right of the pipe: repairs ~ rain | cold."}
::solution
```r
zi2 <- zeroinfl(repairs ~ rain | cold, data = bikes, dist = "poisson")
round(exp(coef(zi2, "zero")), 2)
#> (Intercept)    coldcold
#>        0.35        6.15
```

=== step === concept
::eyebrow The second fix
## The hurdle model: clear the bar, then count

The **hurdle model** tells a different story about the zeros. Instead of mixing two sources, it splits the day into two clean stages:

1. **The hurdle (a gate):** did anything happen at all? A yes/no logistic model for the probability \(p_i\) of a positive count. Every single zero lives here, a zero means the day failed the gate.
2. **The count, if you cleared it:** given at least one repair, how many? A Poisson that has been *zero-truncated*, it is not allowed to produce a 0, because in this stage a 0 is impossible by construction.

Formally, with \(p_i\) the probability of clearing the hurdle:

\[ P(Y_i = 0) = 1 - p_i, \]

\[ P(Y_i = k) = p_i \cdot \frac{\lambda_i^{\,k}\, e^{-\lambda_i} / k!}{1 - e^{-\lambda_i}}, \qquad k = 1, 2, 3, \dots \]

That fraction is the key move. \(\dfrac{\lambda_i^{k} e^{-\lambda_i}}{k!}\) is the ordinary Poisson probability of \(k\), and \(1 - e^{-\lambda_i}\) is the Poisson probability of landing *above* zero. Dividing by it renormalizes the count so its probabilities sum to 1 over \(k = 1, 2, 3, \dots\) only, that is what "zero-truncated" means. So a hurdle has **one** source of zeros (the gate), while a zero-inflated model has **two** (the gate and the count process).

`hurdle()`, also from pscl, uses the same two-sided formula:

```r
hu <- hurdle(repairs ~ rain | cold, data = bikes, dist = "poisson")
summary(hu)
#> Count model coefficients (truncated poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  1.28541    0.06075  21.158   <2e-16 ***
#> rainrainy    0.66194    0.07773   8.516   <2e-16 ***
#> Zero hurdle model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   1.0010     0.1783   5.613 1.99e-08 ***
#> coldcold     -1.7894     0.3000  -5.965 2.44e-09 ***
```

The count block is nearly identical to the zero-inflated one (rain still roughly doubles a busy day). But look at the cold coefficient in the second block: it is now **negative** (-1.79), where in the zero-inflated model it was **positive** (+1.82). Nothing changed about cold and the shop; what flipped is *what the second block measures*. The hurdle's gate models the probability of *crossing* (a positive day), so cold, which shuts the shop, pushes that probability **down**. The zero-inflated block modeled the probability of *being a zero*, so cold pushed that **up**. Same reality, opposite sign, because the two blocks point in opposite directions.

=== step === quiz
::eyebrow Check yourself
## Reading the two-part output

In Amara's zero-inflated fit, the `cold` coefficient in the second block was **+1.82**. In her hurdle fit, the `cold` coefficient in the second block was **-1.79**. What explains the sign flip?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The two models disagree about whether cold weather closes the shop ::no They agree completely, cold closes the shop in both. The disagreement is only in how each model's second block is framed, not in the underlying effect.
- One of the fits must be wrong, since the same predictor cannot have opposite signs ::no Both are correct. Opposite signs are expected here because the two second-blocks measure opposite events.
- The zero-inflation block models the probability of BEING a zero, while the hurdle gate models the probability of CROSSING to a positive count; cold raises the first and lowers the second ::ok Exactly. Same effect of cold, described from opposite directions: more likely a zero (+) is the same fact as less likely to be positive (-). Always check which event a two-part block is modelling before you read its sign.

=== step === concept
::eyebrow Choosing
## Zero-inflated or hurdle?

Both models fit Amara's data far better than a Poisson or a negative binomial. Put all four side by side with AIC (lower is better):

```r
pois <- glm(repairs ~ rain, data = bikes, family = poisson)
AIC(pois, nb, zi, hu)
#>      df       AIC
#> pois  2 1393.8653
#> nb    3 1068.3103
#> zi    4  896.8088
#> hu    4  896.1947
```

The Poisson is hopeless, the negative binomial is a big step up, and the two two-part models leap ahead of both, and land almost on top of each other (896.8 versus 896.2). That near-tie is common: zero-inflated and hurdle are close cousins, and on many datasets they fit about equally well. So how do you choose? Ask one question about your zeros:

- **Can a unit that is fully "at risk" still record a zero of its own?** If an open, participating day can genuinely come up 0 on its own, use **zero-inflated**: it lets a zero come from the count process too. Fish caught by someone who *did* go fishing can still be 0.
- **Is a zero only ever "didn't take part"?** If crossing the hurdle and how-many are two separate decisions, and a positive is guaranteed once you cross, use a **hurdle**. A patient first decides to see a doctor, then has one or more visits, never zero once they have gone.

For Amara either is defensible (an open day could, rarely, still see no bikes), which is why they tie. Let the generative story decide, and when it is genuinely ambiguous, report the one whose two blocks you can explain most cleanly to the person who has to act on them.

[KEY INSIGHT]
Do not pick between zero-inflated and hurdle by AIC alone; they often tie. Pick by what a zero *means* in your data: can an at-risk unit still be zero (zero-inflated), or is every zero a failure to take part (hurdle)?

=== step === quiz
::eyebrow Putting it together
## Pick the model

A hospital analyst models the number of physiotherapy sessions a discharged patient attends. Many patients attend 0. Crucially, a patient only ever gets sessions after a referral; with no referral there is no session, and once referred a patient always attends at least one. Which model matches this story best?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A hurdle model: the referral is a single gate, and every zero is "not referred", while referred patients have a strictly positive, zero-truncated count ::ok Right. There is exactly one source of zeros (no referral) and a positive is guaranteed once the gate is cleared. That is the textbook hurdle structure.
- A zero-inflated model, because there are many zeros ::no A pile of zeros alone does not make it zero-inflated. Here a zero has one meaning (not referred) and referred patients are never 0, so the count process contributes no zeros of its own, that is a hurdle, not a mixture.
- A plain Poisson, since the count is still whole numbers ::no A Poisson cannot handle this many structural zeros; it would badly underpredict the 0 count and misstate every standard error, exactly the failure that motivated this lesson.

=== step === concept
::eyebrow Go deeper
## References

- [Zeileis, Kleiber and Jackman (2008), Regression Models for Count Data in R, Journal of Statistical Software 27(8)](https://doi.org/10.18637/jss.v027.i08) - the paper behind `zeroinfl` and `hurdle`, with worked examples of both.
- [Lambert (1992), Zero-Inflated Poisson Regression, with an Application to Defects in Manufacturing, Technometrics 34(1)](https://doi.org/10.2307/1269547) - the original zero-inflated Poisson paper.
- [Mullahy (1986), Specification and Testing of Some Modified Count Data Models, Journal of Econometrics 33(3)](https://doi.org/10.1016/0304-4076(86)90002-3) - the paper that introduced the hurdle model.
- [Zero-Inflated Poisson Regression | R Data Analysis Examples (UCLA OARC)](https://stats.oarc.ucla.edu/r/dae/zip/) - a full worked ZIP fit in R, from fitting to interpreting both parts.
- [pscl package (Zeileis, Kleiber, Jackman)](https://cran.r-project.org/package=pscl) - documentation for `zeroinfl` and `hurdle`.

=== step === complete
## Lesson 9 complete

You can now handle counts with a pile of extra zeros. You can tell a structural zero from a sampling one, fit a zero-inflated Poisson and read its two blocks as odds and rate ratios, fit a hurdle model and see why its gate flips the sign, and choose between them by what a zero actually means rather than by AIC alone.

You have now met counts that pile up at zero. Next comes the opposite problem: outcomes that are strictly positive and skewed hard to the right, insurance losses, rainfall, hospital costs, where the zero is not the issue but the long, heavy tail is. Lesson 10: Gamma and Tweedie Regression, the GLMs built for positive, right-skewed money and amounts.
