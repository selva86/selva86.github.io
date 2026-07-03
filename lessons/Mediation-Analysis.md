---
title: "Causal Inference for Decisions Lesson 11: Mediation Analysis"
catalog_blurb: "How much of an effect runs directly versus through a mediator."
description: "Decompose a total effect into direct and indirect paths through a mediator with the base-R product method, bootstrap the indirect effect, and see why mediation needs stronger assumptions."
keywords: "mediation analysis, direct effect, indirect effect, mediator, product of coefficients, Baron Kenny, sequential ignorability, causal inference, bootstrap, R"
post_type: "LESSON"
curriculum_id: "6.180.11"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "11"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: ""
course_prev: "Sensitivity-Analysis-and-Placebo-Tests.html"
---

=== step === cover
::eyebrow Lesson 11 of 11
## Mediation Analysis

Every method in this course answered one question: *does* the treatment work, and by how much. This last lesson asks a different one: *how* does it work? When FreshCart's push notification lifts grocery spend, is it because the notification gets people to open the app more and browse, or because the notification itself reminds them of a sale they buy on the spot? Same total effect, two very different stories, and they call for two very different decisions.

Mediation analysis splits a total effect into the part that travels through a middle variable (a **mediator**) and the part that does not. By the end of this lesson you will be able to:

- Tell a total, a direct, and an indirect effect apart, and say what each one means
- Decompose an effect in R with the product method, and put a confidence interval on the indirect piece
- Explain why mediation leans on an assumption even a perfect randomized experiment cannot deliver

**Prerequisites:** Lessons 1 to 3 of this course (confounding and potential outcomes, matching, difference-in-differences), and [Lesson 2](Causal-Diagrams-with-DAGs.html) where the mediator first appeared as the middle of a chain \(X \to Z \to Y\). You can fit `lm()` and read a coefficient.

::widget causal-dag {}

=== step === concept
::eyebrow From whether to how
## A total effect hides a mechanism

FreshCart, the online grocery from Lesson 10, runs a clean A/B test on lapsing shoppers: a random half receive a re-engagement **push notification**, the other half receive nothing. A week later, the shoppers who got the push spent about $10.59 more on average. Randomization did its job, so that $10.59 is a real causal total effect, with no confounding of the push to worry about.

But "the push adds $10.59" does not tell the product team what to build. There are two ways it could happen:

- **The indirect route.** The push nudges shoppers to **open the app** more often. More app opens mean more browsing, and more browsing means more in the basket. Here the effect flows *through* app opens: push \(\to\) opens \(\to\) spend.
- **The direct route.** The push itself carries a "20% off today" line, and some shoppers tap straight through and buy, no extra browsing needed. Here the effect skips the mediator entirely: push \(\to\) spend.

App opens is the **mediator**, the variable in the middle of the indirect route. In Lesson 2 you met exactly this shape, a chain \(X \to Z \to Y\), and the rule was "leave the mediator alone when you want the total effect." This lesson is the payoff: when the mechanism *is* the question, you deliberately open up that chain and measure each piece. Switch the diagram below to **mediator** to see the shape we are about to take apart.

::widget causal-dag {}

[KEY INSIGHT]
The total effect is the sum of two paths: an indirect effect that runs through the mediator, and a direct effect that does not. Mediation analysis is the arithmetic that separates them.

=== step === concept
::eyebrow The recipe
## The two paths, and how to measure them

The trick is that each path is a coefficient in an ordinary regression. Write \(X\) for the push (1 if sent, 0 if not), \(M\) for app opens, and \(Y\) for spend. You fit **two** linear models.

First the **mediator model**, how the treatment moves the mediator:

\[ M = i_1 + a\,X + e_1. \]

The coefficient \(a\) is how many extra app opens the push causes. Then the **outcome model**, which includes both the treatment and the mediator:

\[ Y = i_2 + c'\,X + b\,M + e_2. \]

Here \(b\) is how many extra dollars each app open brings *at a fixed push status* (it holds \(X\) constant, so it is the mediator's own pull on spend), and \(c'\) is the **direct effect**: the push's leftover pull on spend once app opens are accounted for.

Now the decomposition. Every extra app open the push creates (\(a\) of them) is worth \(b\) dollars, so the **indirect effect** is their product:

\[ \text{indirect} = a \times b. \]

The **total effect** \(c\) is what you get by regressing spend on the push alone (\(Y = i_0 + c\,X + e_0\)), and for linear models it splits cleanly:

\[ c = \underbrace{c'}_{\text{direct}} + \underbrace{a\,b}_{\text{indirect}}. \]

That identity is why you will see two names for the same thing: the **product method** reads the indirect effect off \(a \times b\); the **difference method** reads it off \(c - c'\). For linear models they are equal. Finally, the **proportion mediated** is the share of the total that runs through the mediator, \(ab / c\). The flow below is the whole procedure.

::widget process-flow {"steps":[{"title":"Fit the mediator model","sub":"regress the mediator on the treatment to get a, the push effect on app opens"},{"title":"Fit the outcome model","sub":"regress the outcome on treatment AND mediator to get b and the direct effect"},{"title":"Multiply for the indirect effect","sub":"a times b is the effect that flows through the mediator"},{"title":"Compare to the total","sub":"direct plus indirect equals the total; their ratio is the proportion mediated"}]}

=== step === concept
::eyebrow In R
## Fit FreshCart's two models

Each lesson runs in a fresh R session, so we build FreshCart's experiment right here. The push is randomized; app opens rise with the push; and spend rises with both app opens and the push directly. We know the recipe because we wrote it, but the analyst only ever sees the three columns.

```r
set.seed(2024)
n <- 2000
# FreshCart's A/B test: half of lapsing shoppers get a re-engagement push.
push <- rbinom(n, 1, 0.5)                            # X: randomized push notification (1 = sent)

# Mediator: how many times the shopper opened the app that week. The push lifts opens.
opens <- 2.5 + 1.5 * push + rnorm(n, 0, 1.2)         # push adds app opens
opens <- round(pmax(opens, 0), 1)                    # opens cannot be negative

# Outcome: the shopper's grocery spend that week, in dollars.
spend <- 34 + 4 * opens + 5 * push + rnorm(n, 0, 6)  # each open lifts spend; push also nudges it directly
fresh <- data.frame(push, opens, spend)
head(fresh, 3)
#>   push opens spend
#> 1    1   3.9 54.61
#> 2    0   1.9 43.32
#> 3    1   2.9 53.77
```

Now the two models from the recipe. Read `a` off the mediator model and `b`, `c'` off the outcome model.

```r
m_model <- lm(opens ~ push, data = fresh)            # mediator model:  push -> opens
y_model <- lm(spend ~ push + opens, data = fresh)    # outcome model:   push + opens -> spend

a      <- coef(m_model)["push"]                      # push -> app opens
b      <- coef(y_model)["opens"]                     # app opens -> spend, holding push fixed
cprime <- coef(y_model)["push"]                      # direct effect of the push
round(c(a = a, b = b, direct = cprime), 2)
#>   a.push  b.opens direct.push
#>     1.39     4.08        4.92
```

So the push buys about **1.39 extra app opens** (\(a\)), each app open is worth about **$4.08** (\(b\)), and the push has a **$4.92 direct** effect on spend beyond app opens (\(c'\)).

=== step === tryit
::eyebrow Your turn
## Fit the outcome model right

The outcome model is the one place mediation goes wrong most often. To read the mediator's own effect \(b\), the model must hold the treatment fixed, so the push has to be in it too. Leave the push out and its effect leaks into `opens`, inflating \(b\). Fill in the missing predictor so the outcome model adjusts for the treatment.

```r
y_model <- lm(spend ~ opens + ____, data = fresh)
coef(y_model)["opens"]
```
::check {"regex":"push","gate":true,"difficulty":"intermediate","ok":"Right: with the push held fixed, b is the mediator's own pull on spend, about $4.08 per app open. Drop push and that number would absorb part of the push's direct effect.","no":"Add the treatment: lm(spend ~ opens + push). The outcome model must include BOTH the mediator and the treatment."}
::solution
```r
y_model <- lm(spend ~ opens + push, data = fresh)
coef(y_model)["opens"]
#>    opens
#> 4.08
```

=== step === concept
::eyebrow The decomposition
## Multiply, and check it adds up

You have the pieces. The indirect effect is \(a \times b\); the total effect comes from regressing spend on the push alone; and the direct effect \(c'\) you already have. Watch the identity \(c = c' + ab\) hold on the nose.

```r
indirect <- a * b                                    # product method: push -> opens -> spend
total    <- coef(lm(spend ~ push, data = fresh))["push"]   # the push effect, mediator ignored
round(c(indirect = indirect, direct = cprime, total = total), 2)
#> indirect.push   direct.push    total.push
#>          5.67          4.92         10.59
```

```r
# Difference method (total - direct) equals the product method (a*b), and the share mediated:
round(c(direct_plus_indirect = cprime + indirect,
        proportion_mediated  = indirect / total), 2)
#> direct_plus_indirect.push  proportion_mediated.push
#>                     10.59                      0.54
```

The push's $10.59 total splits into **$5.67 that flows through app opens** and **$4.92 that acts directly**. `direct_plus_indirect` reproduces the total exactly, which is the product-equals-difference identity, not a coincidence. And about **54%** of the push's effect on spend is mediated by getting people back into the app.

=== step === quiz
::eyebrow Check yourself
## What the split means for a decision

FreshCart's growth team reads the numbers: total $10.59, indirect $5.67 through app opens, direct $4.92. Someone proposes killing the push notification but "keeping whatever makes people open the app." If they remove the push entirely, roughly how much of the $10.59 lift should they expect to keep?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- About nothing from the push: the $5.67 indirect part was app opens that the push itself created, so removing the push removes those opens too, and the $4.92 direct part goes with it ::ok Exactly. The indirect effect is not a free-standing "app opens" effect you can keep; it is spend caused by the push, routed through opens. Cut the push and both routes close. Mediation tells you the mechanism, not a menu of effects you can pick and keep independently.
- About $5.67, the indirect part, since that piece is tied to app opens rather than the push ::no The indirect effect is the push acting THROUGH app opens. Those extra opens exist because the push prompted them; with no push, there are no extra opens and no $5.67. You cannot keep a mediated effect while removing its cause.
- All $10.59, because app opens drive spend whether or not the push is sent ::no App opens drive spend, but the EXTRA opens here were caused by the push. Remove the push and app opens fall back to baseline, taking the indirect effect with them.

=== step === concept
::eyebrow How certain?
## Bootstrap the indirect effect

The indirect effect is a **product** of two estimates, \(a \times b\). Products of normal-ish estimates are not themselves normal (they are skewed), so the usual coefficient standard errors do not apply. The honest, general fix is the **bootstrap**: resample the shoppers with replacement, refit both models, recompute \(a \times b\), and repeat a thousand times. The spread of those thousand values is the sampling distribution of the indirect effect, and its middle 95% is a confidence interval.

::widget bootstrap-sample {"seed":7,"tail":"Each resample refits both models and recomputes a times b; the spread of those numbers is the confidence interval."}

```r
set.seed(1)
indirect_boot <- replicate(1000, {
  i  <- sample(nrow(fresh), replace = TRUE)          # a bootstrap resample of the shoppers
  d  <- fresh[i, ]
  ai <- coef(lm(opens ~ push, data = d))["push"]     # a on this resample
  bi <- coef(lm(spend ~ push + opens, data = d))["opens"]  # b on this resample
  ai * bi                                            # the indirect effect on this resample
})
quantile(indirect_boot, c(0.025, 0.975))             # 95% percentile confidence interval
#>     2.5%    97.5%
#>     5.13     6.20
```

The 95% interval runs from about **$5.13 to $6.20**, comfortably clear of zero, so the mediation through app opens is statistically solid. Report this interval, not a bare point estimate: the whole reason to bootstrap is that the indirect effect's uncertainty is not symmetric.

=== step === concept
::eyebrow The catch
## Why mediation needs more than randomization

Here is the hard truth this lesson has been building toward. Randomizing the push made the *push* unconfounded, so the total effect was trustworthy. But look at the outcome model again: it compares shoppers with different numbers of app opens. Nobody randomized app opens. Whatever makes a shopper open the app a lot was left to nature, and if that same thing also drives spending, it confounds the mediator-to-outcome step and poisons \(b\), and therefore \(a \times b\).

Suppose an unmeasured trait, a shopper's baseline **enthusiasm** for grocery-by-app, drives both app opens and spend. The analyst never records it. Watch what it does to \(b\) even though the push is still perfectly randomized.

```r
set.seed(7)
n <- 2000
enthusiasm <- rnorm(n)                               # UNMEASURED: how much a shopper loves the app
push  <- rbinom(n, 1, 0.5)                            # push is STILL randomized
opens <- 2.5 + 1.5 * push + 1.1 * enthusiasm + rnorm(n, 0, 1)      # enthusiasm also drives opens
spend <- 34 + 4 * opens + 5 * push + 9 * enthusiasm + rnorm(n, 0, 5)  # ...and spend directly

b_seen <- coef(lm(spend ~ push + opens))["opens"]                  # what the analyst can fit
b_true <- coef(lm(spend ~ push + opens + enthusiasm))["opens"]     # if enthusiasm were visible
round(c(b_estimated = b_seen, b_if_adjusted = b_true), 2)
#> b_estimated.opens b_if_adjusted.opens
#>              8.42                3.84
```

```r
a_seen <- coef(lm(opens ~ push))["push"]
round(c(indirect_reported = a_seen * b_seen, indirect_truth = a_seen * b_true), 2)
#> indirect_reported.push    indirect_truth.push
#>                  13.33                   6.08
```

The analyst reports an indirect effect of **$13.33**; the truth is about **$6.08**. The estimate is more than double, and the A/B test did nothing to stop it, because randomizing the push never randomized app opens. This extra requirement, **no unmeasured confounder of the mediator and the outcome**, is called **sequential ignorability**, and it is why mediation rests on stronger, untestable assumptions than the matching and difference-in-differences you have been using.

[WARNING]
A randomized experiment buys you an unconfounded treatment, not an unconfounded mediator. Every mediation estimate carries a "no hidden mediator-outcome confounder" assumption you cannot test from the data, exactly the kind of fragility Lesson 10 taught you to stress-test.

In practice you would hand the two models to the **`mediation`** package, which does the bootstrap for you and, crucially, ships a sensitivity analysis for precisely this assumption. Run this in your own R session:

```r-static
library(mediation)   # install.packages("mediation")

m_model <- lm(opens ~ push, data = fresh)
y_model <- lm(spend ~ push + opens, data = fresh)

med <- mediate(m_model, y_model, treat = "push", mediator = "opens",
               boot = TRUE, sims = 1000)
summary(med)   # ACME (indirect), ADE (direct), total effect, proportion mediated, with CIs

# How strong would a hidden mediator-outcome confounder have to be to erase the
# indirect effect? This is Lesson 10's sensitivity analysis, in mediation form:
sens <- medsens(med)
summary(sens)  # reports the confounding strength (rho) that drives the indirect effect to zero
```

`medsens` is the direct cousin of Lesson 10's E-value: it turns "is there a hidden mediator-outcome confounder?" into "how strong would one have to be to explain the mediation away?"

=== step === quiz
::eyebrow Check yourself
## Does randomization rescue mediation?

FreshCart randomized who received the push, a clean A/B test. An analyst concludes: "Because the treatment was randomized, our estimate of the indirect effect through app opens is causally valid." Is that reasoning correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No: randomizing the push only makes the push itself unconfounded. It does not randomize app opens, so a hidden trait that drives both opens and spend still biases the mediator-to-outcome step, and the indirect effect can be badly off even in a perfect A/B test ::ok Right. This is the heart of the lesson. Randomization handles confounding of the treatment, not of the mediator. The mediator is observed, not assigned, so sequential ignorability is an extra, untestable assumption randomization cannot supply.
- Yes: randomization removes all confounding in the study, so every coefficient, including the mediator's, is causally clean ::no Randomization only breaks the links into the randomized variable, the push. App opens were never randomized, so anything that drives both opens and spend still confounds b. That is exactly what the enthusiasm example showed.
- Yes, provided the sample is large enough that a and b are statistically significant ::no Sample size fixes variance, not bias. A hidden mediator-outcome confounder biases the indirect effect no matter how many shoppers you have; a bigger sample just gives you a tighter interval around the wrong number.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take mediation analysis further:

- [Baron and Kenny (1986), The moderator-mediator variable distinction, JPSP (DOI)](https://doi.org/10.1037/0022-3514.51.6.1173) - the classic paper that introduced the product-of-coefficients method you used here.
- [Imai, Keele and Tingley (2010), A General Approach to Causal Mediation Analysis, Psychological Methods (DOI)](https://doi.org/10.1037/a0020761) - recasts direct and indirect effects in the potential-outcomes framework, the modern causal footing.
- [Imai, Keele and Yamamoto (2010), Identification, Inference and Sensitivity Analysis for Causal Mediation Effects, Statistical Science (DOI)](https://doi.org/10.1214/10-STS321) - defines sequential ignorability and the sensitivity analysis that `medsens` implements.
- [Tingley et al. (2014), mediation: R Package for Causal Mediation Analysis, JSS](https://www.jstatsoft.org/article/view/v059i05) - the package that fits the models, bootstraps the effects, and runs the sensitivity check for you.

=== step === complete
## Lesson 11 complete

You can now ask not just whether a treatment works, but how. You split FreshCart's $10.59 push effect into a **$5.67 indirect** effect flowing through app opens and a **$4.92 direct** effect, using two ordinary regressions: \(a\) from the mediator model, \(b\) and the direct effect \(c'\) from the outcome model, and \(a \times b\) for the indirect piece. You bootstrapped that product to a proper confidence interval, and you saw the identity \(c = c' + ab\) hold exactly. Most important, you learned the catch: randomizing the treatment does not randomize the mediator, so mediation demands **sequential ignorability**, an untestable no-hidden-mediator-outcome-confounder assumption. The enthusiasm example made it concrete: one hidden trait inflated the reported indirect effect from about $6 to $13, and the A/B test did nothing to catch it.

That caveat is the right note to end this course on. Across eleven lessons you moved from spotting confounding to matching, weighting, difference-in-differences, discontinuities, instruments, synthetic controls, uplift, and finally the mechanism itself, and every method came with the same discipline: state your assumptions, then stress-test them. That habit, more than any single estimator, is what separates a causal claim you can defend from a correlation dressed up as one.

Causal Inference for Decisions is one of the graded modules in the Data Scientist track. Pass the assessment and it goes on your verified certificate.
