---
title: "Causal Inference from Data Lesson 8: Mediation, and how wrong you can afford to be"
catalog_blurb: "How strong a hidden confounder must be to erase a mediated effect."
description: "A win-back email's effect on spend splits into direct and indirect paths, then a check prices how strong a hidden confounder must be to erase the indirect one."
keywords: "mediation analysis, direct effect, indirect effect, mediator, confounder, sensitivity analysis, unmeasured confounding, causal inference, regression, R"
post_type: "LESSON"
curriculum_id: "4.130.8"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "8"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: ""
course_prev: "Regression-Discontinuity-and-Synthetic-Control"
---

=== step === cover
## Mediation, and how wrong you can afford to be

Today let's understand mediation: what it means to split an effect into the part that runs straight through and the part that runs by a detour, and just as important, how to tell when that split can no longer be trusted.

Brightleaf, an online retailer, sends a win-back email to 200 customers and sends nothing to another 200. For each of the 400, Brightleaf records two things: whether that customer opened the Brightleaf app within a week, and how much they spent over the next month.

Here are eight of those 400 customers.

::widget styled-table {"cols": ["customer","email","opened_app","spend_30d"], "rows": [["A","no","no",50],["B","no","no",50],["C","no","yes",68],["D","no","yes",68],["E","yes","yes",72],["F","yes","yes",72],["G","yes","no",54],["H","yes","yes",72]], "formats": {"spend_30d": "dollar"}, "title": "Eight of the 400 Brightleaf customers", "note": "Opening the app and getting the email both line up with higher spend. Which one is actually doing the work?"}

Look at customers E, F and H against customer G. All four got the email, but three of them opened the app and spent $72, while G did not open the app and spent only $54.

So some of the email's effect on spend looks like it runs through the app, not straight from the email itself.

That is the question this lesson answers. Did the email change spend on its own, or did it only change spend by getting people to open the app? And once you have split the answer into those two pieces, how wrong can that split afford to be before it stops meaning anything?

=== step === concept
## A total effect, split into two paths

Brightleaf's email can reach a customer's spend in two different ways.

The first is direct. The email itself, its subject line, its discount code, whatever is in it, can change what a customer spends, with nothing to do with the app at all.

The second runs through a detour. The email can get a customer to open the app, and opening the app can itself raise spend. The email's effect on spend, in that case, only exists because the email first changed something else, app-opening, which then changed spend.

Statisticians give that in-between variable a name. A **mediator** is a variable that the treatment changes, and which itself goes on to change the outcome. Here, opening the app is the mediator: the email changes whether a customer opens the app, and opening the app changes how much they spend.

That gives three quantities, and mediation analysis is mostly about keeping these three straight.

- The **total effect** is email's full effect on spend, both paths combined, direct and through the app together.
- The **direct effect** is the part of that total that skips the app entirely, the email acting straight on spend.
- The **indirect effect** is the part that only exists because the email changed app-opening first, which then changed spend.

And the relationship between them is just addition: the total effect equals the direct effect plus the indirect effect. Nothing about that is an assumption yet, it is just how the two paths add up to the whole. The real assumptions come later in this lesson, once a number is attached to each of the three.

=== step === concept
## Estimating the direct and indirect effect by hand

Now let's put real numbers on all three effects, using Brightleaf's actual 400 customers.

The code below builds that dataset. 200 customers get no email, 200 get the win-back email. Each customer's chance of opening the app rises with the email, and each customer's spend rises with both the email and with opening the app.

```r
# Simulate Brightleaf's 400 customers and fit the three regressions mediation needs
set.seed(26)
n <- 400
email <- rep(0:1, each = 200)                      # 200 customers get nothing, 200 get the win-back email
opened_app <- rbinom(n, 1, 0.35 + 0.20 * email)     # the mediator: did they open the app within a week
spend_30d <- 50 + 4 * email + 18 * opened_app       # the outcome: dollars spent over the next month

fit_mediator <- lm(opened_app ~ email)               # a: email's effect on opening the app
fit_outcome  <- lm(spend_30d ~ email + opened_app)   # b and c': app's effect on spend, email's direct effect
fit_total    <- lm(spend_30d ~ email)                # c: email's total effect on spend, ignoring the app

a <- unname(coef(fit_mediator)["email"])
b <- unname(coef(fit_outcome)["opened_app"])
c_direct <- unname(coef(fit_outcome)["email"])
c_total  <- unname(coef(fit_total)["email"])

round(c(a = a, b = b, direct_effect = c_direct, total_effect = c_total,
        indirect_as_product = a * b, indirect_as_difference = c_total - c_direct), 2)
#>                      a                      b          direct_effect 
#>                    0.2                   18.0                    4.0 
#>           total_effect    indirect_as_product indirect_as_difference 
#>                    7.6                    3.6                    3.6 
```

Three fits, each answering one question.

`fit_mediator` regresses opened_app on email alone. Its coefficient, `a`, is 0.20: getting the email raises the chance of opening the app by 20 percentage points.

`fit_outcome` regresses spend_30d on both email and opened_app together. Its two coefficients are `b`, 18, the app's effect on spend holding email fixed, and `c_direct`, 4.00, email's effect on spend holding the app fixed. That 4.00 is the direct effect: what email does to spend with the app's own contribution subtracted out.

`fit_total` regresses spend_30d on email alone, with no mention of the app. Its coefficient, `c_total`, 7.6, is the total effect, direct and indirect lumped together, exactly what a naive analysis would report if it never thought to ask about the app.

Now here is the part worth sitting with. There are two completely different ways to arrive at the indirect effect, and they land on the same number.

The first is the **product method**: multiply `a` by `b`, 0.20 times 18, 3.60. That reads as "the email moves app-opening by 0.20, and each point of app-opening is worth $18, so the chain is worth $3.60."

The second is the **difference method**: subtract the direct effect from the total effect, 7.6 minus 4.00, 3.60. That reads as "whatever part of the total effect the direct effect does not already explain must be the part running through the app."

Both give 3.60. That agreement is not a coincidence of this dataset, it is how the algebra of a linear model has to work out, and it is the standard check that a mediation analysis was set up correctly: if the product method and the difference method disagree, something in the three fits is wrong.

So Brightleaf's email raises spend by $7.60 in total. $4.00 of that is the email acting on its own. The other $3.60 only exists because the email got more people into the app.

=== step === widget
## Telling a mediator from a confounder

Before trusting that split, it helps to see why a mediator is not the only way a third variable can sit in a causal story, and why the other ways change what you are supposed to do with it.

The widget below draws three nodes, X, Y and Z, and lets you switch the arrows between them into three patterns.

::widget causal-dag {}

Map it onto Brightleaf: X is email, Y is spend, and Z is whichever role you pick for the third variable.

- **Mediator** is app-opening, the variable from this lesson. Email causes app-opening, app-opening causes spend. Control for it and the indirect effect, the $3.60 you just computed, vanishes, because you have blocked the very path that produced it.
- **Confounder** stands for a trait a company might use to decide who gets an email in the first place, something like a customer's baseline spending habit, if Brightleaf had emailed only customers who already looked like bigger spenders instead of flipping a coin. A trait like that would drive both who gets the email and how much they spend, and leaving it out would bias the estimate of email's effect. Control for it and the bias goes away.
- **Collider** stands for something like a support-ticket flag, a variable that email and spend might both push on independently, with no causal arrow between email and spend running through it. Control for a collider and you invent a connection between email and spend that is not really there.

Three variables, three completely different instructions: control for a confounder, never for a collider, and for a mediator, controlling for it is how you get the direct effect instead of the total effect. Brightleaf's app-opening sits in the third category. The question this lesson still has to answer is whether anything else, a confounder sitting unmeasured between app-opening and spend, is quietly doing damage to the split you just computed.

=== step === widget
## Watching the mediator path open and close

The next widget makes the mediator path itself something you can turn on and off, and watch a real estimate move as you do it.

::widget dag-editor {"scenario": "confounding"}

This scenario's diagram carries a treatment node, an adherence node, and an outcome node, plus a baseline-severity node that stays switched on throughout as a confounder of treatment and outcome. That backdrop confounding is this widget's own generic scenario, not a claim about Brightleaf, whose email really was randomized. What matters for this step is the mediator path: map adherence to app-opening and outcome to spend, and watch what that path does to the number on screen.

By default the adherence path is off, so the diagram only shows the confounding story. Click the ghosted arrow from treatment to adherence, then the one from adherence to outcome, to switch the mediator path on. Watch "what the model reports" climb as you do: with that path open and nothing adjusted for, the plotted number is the total effect, direct and indirect added together, the same shape as the $7.60 you computed by hand.

Now click the adherence node itself to adjust for it. The plotted estimate drops back down, because adjusting for a mediator blocks the very path running through it, leaving only the direct effect, the same shape as the $4.00 from before.

That is the identical up-and-down you already saw in Brightleaf's own numbers, total above direct, mediator path open above mediator path closed. The widget's own units are standardized, not Brightleaf's dollars, so do not expect its numbers to equal 7.6 or 4.0. What carries over is the direction: opening the mediator path adds to the estimate, and adjusting for the mediator takes it back out.

=== step === quiz
## Quick check: reading the direct and indirect effect

In the widget above, you turn on the adherence path (treatment to adherence to outcome) and leave everything unadjusted. Then you click the adherence node to adjust for it. What happens to the plotted estimate, and why?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- It drops, because adjusting for the mediator blocks the treatment-to-adherence-to-outcome path, leaving only the direct effect of treatment on the outcome. ::ok Right. With the mediator path open, the unadjusted estimate is the total effect, direct and indirect together. Adjusting for the mediator closes that path, so what is left on screen is the direct effect, the part that skips the mediator entirely.
- It rises, because adjusting for a mediator opens a new path between treatment and outcome. ::no
- Nothing changes, because the adherence node is a confounder here, and confounders cannot be adjusted for. ::no
- It drops because the adherence node is a collider, and adjusting for a collider blocks the path it sits on. ::no Not quite. Adjusting for a mediator CLOSES the path running through it, so the plotted estimate drops to just the direct effect, the part of treatment's effect on the outcome that skips the mediator. The total effect is what you see before you adjust for anything; the direct effect is what is left after you block the mediator path by adjusting for it.

=== step === concept
## Why randomizing the email doesn't rule out a hidden confounder

Brightleaf's email was handed out by a coin flip, 200 customers to the email and 200 to nothing. That is why `a`, email's effect on opening the app, can be trusted: nothing else about a customer decided whether they got the email.

But opening the app was never randomized by anyone. Each customer decided that for themselves. And whatever drove that decision could also, on its own, drive how much they spend, with nothing to do with email at all.

Call that hidden trait `U`, how engaged a customer already was with Brightleaf before the win-back email was ever sent. A more engaged customer opens the app more, email or no email.

Now suppose that same engagement, apart from anything the app does, also changes how much the customer spends over the next month. If so, `b`, the coefficient that is supposed to be the app's own effect on spend, is no longer purely the app's effect. Part of it is `U` leaking through, because `fit_outcome` never saw `U` and has no way to tell U's pull apart from the app's.

This is the same kind of problem as leaving a variable out of a regression when that variable is correlated with something the regression did include, except here the missing piece sits between the mediator and the outcome, not between the treatment and the outcome. That is exactly why randomizing the email can never fix it. Randomizing email only guarantees that email itself is unrelated to anything else. It makes no promise at all about what drives app-opening.

The assumption mediation needs, and that randomizing the email never supplies, has a name: **no unmeasured confounding of the mediator and the outcome**. It says there is nothing out there, measured or not, that affects both whether a customer opens the app and how much they spend, apart from the app's own effect. Brightleaf's design cannot test that assumption, because `U` is, by definition, not in the data.

Here is what that assumption's failure actually does to the numbers. The code below adds `U` to the simulation at a stated strength, independent of email by construction, and then fits the exact same two models as before, `opened_app ~ email` and `spend_30d ~ email + opened_app`, without ever showing those models `U`.

```r
# Add a hidden variable U that drives both app-opening and spend, then fit the model as if U were invisible
set.seed(31)
n <- 400
email <- rep(0:1, each = 200)
U <- rnorm(n)                                               # the hidden trait: unrelated to email by construction
p_open <- pmin(pmax(0.35 + 0.20 * email + 0.10 * U, 0.02), 0.98)
opened_app <- rbinom(n, 1, p_open)
spend_30d <- 50 + 4 * email + 18 * opened_app - 20 * U

fit_mediator <- lm(opened_app ~ email)               # fit WITHOUT U, exactly like before
fit_outcome  <- lm(spend_30d ~ email + opened_app)   # fit WITHOUT U, exactly like before

a_hat <- unname(coef(fit_mediator)["email"])
b_hat <- unname(coef(fit_outcome)["opened_app"])

round(c(true_indirect = 0.20 * 18, naive_estimate = a_hat * b_hat), 2)
#>  true_indirect naive_estimate 
#>           3.60           1.05 
```

The true indirect effect is still 3.60, because the equations that generated this data still multiply a 0.20 effect on app-opening by an $18 effect on spend. `U` rides along beside those two numbers, it does not change them.

But the fit above never gets to see `U`. All it has is email and opened_app, and from that alone, it estimates the indirect effect at about 1.05, less than a third of the true $3.60.

Look at where the damage lands. `a_hat` barely moves, 0.175 against a true 0.20, because email really is independent of `U`. `b_hat` is where the problem shows up: it drops from a true 18 all the way to about 6.03, because once `U` is left out of the fit, some of U's own pull on spend gets mistaken for the app's pull on spend.

Email stayed perfectly randomized. The mediator never was.

=== step === concept
## How strong a hidden confounder would have to be

You do not know whether a confounder like `U` actually exists at Brightleaf, and the data cannot tell you. What you can ask instead is a different, answerable question: how strong would such a confounder have to be before it erased the $3.60 finding entirely?

That is what a sensitivity analysis does. It does not claim the confounder is real. It prices the confounder's strength against the finding, so that you, or a reviewer, can judge whether a confounder that strong is plausible.

The code below repeats the exact fit from the last step at a range of strengths, by multiplying `U`'s two fixed coefficients, 0.10 on app-opening and negative 20 on spend, by a strength value running from 0 up to 2.

```r
# Sweep the hidden variable's strength and watch the estimated indirect effect move
run_once <- function(strength, seed = 31) {
  set.seed(seed)
  n <- 400
  email <- rep(0:1, each = 200)
  U <- rnorm(n)
  p_open <- pmin(pmax(0.35 + 0.20 * email + strength * 0.10 * U, 0.02), 0.98)
  opened_app <- rbinom(n, 1, p_open)
  spend_30d <- 50 + 4 * email + 18 * opened_app - strength * 20 * U
  a_hat <- unname(coef(lm(opened_app ~ email))["email"])
  b_hat <- unname(coef(lm(spend_30d ~ email + opened_app))["opened_app"])
  round(a_hat * b_hat, 2)
}

strength <- seq(0, 2, by = 0.25)
estimate <- sapply(strength, run_once)

plot(strength, estimate, type = "b", pch = 16,
     xlab = "confounder strength", ylab = "estimated indirect effect ($)",
     main = "Where the estimate crosses zero")
abline(h = 0, lty = 2, col = "firebrick")

data.frame(strength, estimate)
#>   strength estimate
#> 1     0.00     4.32
#> 2     0.25     3.45
#> 3     0.50     3.34
#> 4     0.75     1.80
#> 5     1.00     1.05
#> 6     1.25     0.29
#> 7     1.50    -1.33
#> 8     1.75    -2.51
#> 9     2.00    -4.03
```

Read the strength column top to bottom. At strength 0, this is a fresh batch of 400 customers with no hidden variable doing anything at all, and even then the estimate reads 4.32, not a clean 3.60. That gap is ordinary sampling noise, the same wobble any new sample of 400 people carries, nothing to do with confounding yet. The number to watch is not any single row, it is the direction: as strength climbs, the estimate heads steadily down, and somewhere between strength 1.25 and strength 1.50 it crosses zero.

Let's pin that crossing down more precisely.

```r
# Zoom in on the window where the sweep crossed zero
strength_fine <- seq(1.25, 1.45, by = 0.05)
estimate_fine <- sapply(strength_fine, run_once)
data.frame(strength = strength_fine, estimate = estimate_fine)
#>   strength estimate
#> 1     1.25     0.29
#> 2     1.30     0.10
#> 3     1.35    -0.12
#> 4     1.40    -0.59
#> 5     1.45    -0.86
```

At strength 1.30 the estimate is still just barely positive, 0.10. At strength 1.35 it has already gone negative, to -0.12. So the indirect effect crosses zero at roughly strength 1.3 on this scale.

[KEY INSIGHT]
That strength, roughly 1.3, is the number that belongs in the report, not the $3.60 by itself. $3.60 only means what it looks like it means if a confounder that strong is implausible for a company like Brightleaf; if one that strong is easy to imagine, for instance anything that separately marks a customer as more engaged and more likely to spend, the finding is fragile instead.

The sweep does not settle which of those is true. It only lets you ask the question with a number attached, instead of taking $3.60 on faith.

=== step === concept
## Beyond mediation: any unrandomized link carries the same risk

Nothing about this risk is specific to mediation. It shows up anywhere an effect estimate depends on a link between two variables, and that link was not itself created by randomizing one of them.

Brightleaf randomized email. That is why `a`, email's effect on app-opening, never needed a sensitivity check: randomization did the work of ruling out a hidden confounder of email and app-opening. But app-opening's link to spend was never randomized by anyone, which is exactly why that link, and only that link, is the one a hidden confounder could still be quietly distorting.

The same sweep from the last step, raise a hidden variable's strength until an estimate reaches zero, and read off the strength at which that happens, applies to any estimate built on an unrandomized link, whatever method produced it. The question is always the same one: is a confounder strong enough to erase this finding plausible, or not? Mediation just happens to be the design where that unrandomized link, and the assumption riding on it, is the easiest one to point to directly.

=== step === quiz
## Closing check: judging a mediated effect, not just computing it

Brightleaf's $3.60 indirect effect crosses zero once a hidden confounder reaches roughly strength 1.3 on the scale used in the sweep. What does that tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- The effect is probably safe, because $3.60 itself is already a small number. ::no
- Nothing is wrong, since the no-unmeasured-confounding assumption was already stated at the start of the analysis. ::no
- Whether Brightleaf's finding should be trusted now depends on whether a confounder that strong is plausible for this company, not on the $3.60 number alone. ::ok Right. The sweep does not tell you whether such a confounder exists, only how strong one would have to be to erase the finding. A strength of 1.3 might be an everyday-sized hidden variable for a retailer, in which case $3.60 is fragile, or it might be an implausibly large one, in which case the estimate holds up. That judgment is what the sensitivity number is for.
- The estimate is wrong, because any sensitivity number other than zero means the mediation analysis has failed. ::no Not quite. The dollar size of the indirect effect, and the fact that the no-unmeasured-confounding assumption was stated, do not by themselves say anything about how fragile the estimate is. What matters is the strength at which the sweep crosses zero, about 1.3 here, weighed against how strong a real hidden confounder could plausibly be at a company like Brightleaf. That is a judgment call about the data, not something the sweep decides automatically, and a nonzero sensitivity number is normal, not a sign the analysis failed.

=== step === tryit
## Your turn: split an effect and test how fragile it is

Palmwood Fitness runs a small trial. 100 members, 50 get a text reminder before their trial week, 50 get nothing. For each member, Palmwood records whether they attended a class that week, the mediator, and how many minutes they exercised over the next month, the outcome.

The code below builds that dataset.

```r
# Palmwood Fitness: 100 members, half get a text reminder before their trial week
set.seed(52)
n <- 100
remind <- rep(0:1, each = 50)
attended <- rbinom(n, 1, 0.30 + 0.25 * remind)      # mediator: attended a class that week
minutes <- 60 + 10 * remind + 40 * attended          # outcome: minutes exercised that month

# Your turn: fit the mediator model (attended explained by remind) and the outcome
# model (minutes explained by remind and attended). Name them fit_mediator and
# fit_outcome, the same two-model pattern from earlier in this lesson.
# Two lines. Press Check when you have them.
```
::check {"regex": "lm\\s*[(]\\s*attended\\s*~\\s*remind\\s*[)][\\s\\S]*lm\\s*[(]\\s*minutes\\s*~\\s*remind\\s*[+]\\s*attended\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. fit_mediator gives a = 0.14, the reminder lifts the chance of attending by 14 points. fit_outcome gives b = 40 and a direct effect of 10, so the indirect effect is 0.14 times 40, 5.6, and the total effect is 10 plus 5.6, 15.6.", "no": "Fit two models, the same pattern as the Brightleaf example earlier in this lesson: attended explained by remind alone (gives a), and minutes explained by remind plus attended (gives b and the direct effect). Name them fit_mediator and fit_outcome."}
::solution
```r
# Fit the mediator model and the outcome model, then split the effect
fit_mediator <- lm(attended ~ remind)
fit_outcome  <- lm(minutes ~ remind + attended)

a <- unname(coef(fit_mediator)["remind"])
b <- unname(coef(fit_outcome)["attended"])
c_direct <- unname(coef(fit_outcome)["remind"])

round(c(indirect = a * b, direct = c_direct, total = c_direct + a * b), 2)
#> indirect   direct    total 
#>      5.6     10.0     15.6 
```

So the reminder's total effect on minutes exercised is 15.6, split into a direct effect of 10 and an indirect effect of 5.6 running through attendance.

Now for the fragility check. A colleague ran the same strength sweep from earlier in this lesson on Palmwood's own data, and reports this grid:

| strength | estimated indirect effect |
|---|---|
| 0.0 | 7.20 |
| 0.5 | 6.39 |
| 1.0 | 2.71 |
| 1.5 | -5.53 |

The colleague argues that a hidden confounder of attendance and minutes exercised, something like how motivated a member already was before the reminder, could plausibly reach strength 1.0 at a gym like Palmwood's. Does that already overturn the finding?

Read the strength 1.0 row: 2.71. Still positive, nowhere near zero. So no, a confounder at strength 1.0 would shrink the indirect effect, from 7.20 down to about a third of that, but it would not erase it. The grid's own numbers say the finding only breaks between strength 1.0 and strength 1.5, where the estimate actually crosses zero.

=== step === concept
## References
::prose-only the sources are text, not a visual

- [The moderator-mediator variable distinction in social psychological research](https://doi.org/10.1037/0022-3514.51.6.1173) - Baron, R.M., Kenny, D.A. (1986), Journal of Personality and Social Psychology, 51(6), 1173-1182. The paper that first set out the product-and-difference logic behind splitting a total effect into direct and indirect parts.
- [A general approach to causal mediation analysis](https://doi.org/10.1037/a0020761) - Imai, K., Keele, L., Tingley, D. (2010), Psychological Methods, 15(4), 309-334. The modern causal-inference treatment of mediation, stating the no-unmeasured-confounding assumption precisely.
- [Identification, inference, and sensitivity analysis for causal mediation effects](https://doi.org/10.1214/10-STS321) - Imai, K., Keele, L., Yamamoto, T. (2010), Statistical Science, 25(1), 51-71. The sensitivity-analysis method behind the strength sweep used in this lesson.
- [Explanation in Causal Inference: Methods for Mediation and Interaction](https://www.oup.com/academic/product/explanation-in-causal-inference-9780199325870) - VanderWeele, T.J. (2015), Oxford University Press. A full treatment of mediation's assumptions and how they can fail.
- [Making sense of sensitivity: extending omitted variable bias](https://doi.org/10.1111/rssb.12348) - Cinelli, C., Hazlett, C. (2020), Journal of the Royal Statistical Society, Series B, 82(1), 39-67. The general framework for pricing how strong an unmeasured confounder would have to be to overturn a finding, generalized in this lesson's closing step.

=== step === complete
## The split, and the number that defends it

You can now split any total effect that runs partly through a mediator into a direct effect and an indirect effect, two ways, and check that both ways agree. Brightleaf's email raised spend by $7.60 in total: $4.00 straight from the email, $3.60 because the email got people into the app.

You can name the assumption that split rests on: no unmeasured confounder of the mediator and the outcome, an assumption randomizing the treatment never supplies, because the treatment was never the thing left unrandomized.

And you can report a sensitivity number instead of a bare point estimate: not "the indirect effect is $3.60," but "the indirect effect is $3.60, and a hidden confounder would need to reach roughly strength 1.3 on this scale before that number disappears." That second sentence is the one a reviewer can actually argue with, which is exactly what makes it the more honest one to publish.
