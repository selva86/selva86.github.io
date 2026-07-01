---
title: "Causal Inference Lesson 2: Causal Diagrams with DAGs"
catalog_blurb: "Reading confounders, colliders and mediators off a causal diagram."
description: "Draw your causal assumptions as a DAG, then read off what to control for: adjust for confounders, never for colliders, and think twice about mediators."
keywords: "causal diagram, DAG, confounder, collider, mediator, backdoor path, adjustment set, backdoor criterion, dagitty, causal inference in R, d-separation, do-operator"
post_type: "LESSON"
curriculum_id: "6.10.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "2"
course_total: "5"
course_landing: "R-Causal-Inference-Course.html"
course_next: "AB-Testing-and-Experiment-Design.html"
course_prev: "Correlation-Causation-and-Potential-Outcomes.html"
---

=== step === cover
::eyebrow Lesson 2 of 5
## Causal Diagrams with DAGs

In Lesson 1, Riverside Books saw customers who received a coupon spend about $18 more than those who did not. Most of that gap was an illusion: loyalty pushed customers toward *both* getting a coupon and spending more. A coin flip fixed it, because randomizing made the two groups comparable.

But you cannot always flip a coin. You cannot randomly assign who is loyal, you cannot rerun last quarter, and you often inherit data someone else collected. When randomizing is off the table, you have to write down what you believe causes what, and then defend it. A causal diagram, a **DAG**, is how you put those beliefs on paper. The remarkable part: once the diagram is drawn, you can read straight off it which variables to control for and which to leave well alone.

By the end of this lesson you will be able to:

- Read a DAG: say what its nodes and arrows mean, and what "directed" and "acyclic" stand for
- Spot whether a third variable is a confounder, a mediator, or a collider, and know the adjust-or-not rule for each
- Use the backdoor criterion to pick what to control for, and prove in R that a confounder inflates an effect while a collider invents one from nothing

**Prerequisites:** you finished [Lesson 1](Correlation-Causation-and-Potential-Outcomes.html) (correlation is not causation, confounders, potential outcomes), and you can fit `lm()` in R and read a coefficient. Every new term is defined as it appears.

::widget causal-dag {}

=== step === concept
::eyebrow The tool
## Your assumptions, drawn as arrows

A causal diagram is deliberately simple. Each **node** is a variable you care about, and each **arrow** is one claim: that a variable is a *direct cause* of another. \(A \to B\) reads "A directly causes B." That is the entire vocabulary.

The name DAG spells out its three rules:

- **D**irected: every link is an arrow with a direction. \(A \to B\) is a different claim from \(B \to A\).
- **A**cyclic: you can never follow the arrows and arrive back where you started. Nothing causes itself, even by a long detour.
- **G**raph: a set of nodes joined by those arrows.

Here are Riverside's three beliefs about the coupon, written as arrows:

| Arrow | The claim it makes |
|---|---|
| loyalty \(\to\) coupon | loyal customers were emailed more coupons |
| loyalty \(\to\) spend | loyal customers spend more on their own |
| coupon \(\to\) spend | the coupon lifts spending (the effect we want) |

That is exactly the picture on the cover, reading \(X\) as the coupon, \(Y\) as spend, and \(Z\) as loyalty. Drawing it forces every assumption into the open: an arrow you draw is a cause you are claiming, and an arrow you leave out is a claim that there is *no* direct effect.

[NOTE]
A DAG is an input, not an output. It cannot be computed from the data; it is the reasoning you bring to the data. Two analysts can draw different diagrams for the same spreadsheet, and the numbers alone cannot say who is right. That is the point: the diagram makes your assumptions visible and arguable.

=== step === widget
::eyebrow Three shapes
## The three ways a third variable sits between cause and effect

Almost every causal question is "does \(X\) cause \(Y\)?" with some third variable \(Z\) lurking nearby. Where \(Z\) sits relative to the arrows changes everything. There are exactly three shapes, and the widget below switches between them. In each, read \(X\) as the coupon and \(Y\) as spend.

- **Fork, a confounder.** \(X \leftarrow Z \to Y\): \(Z\) causes both ends. This is Riverside's loyalty, which drove who got a coupon *and* how much they spent. A fork creates association between \(X\) and \(Y\) that is not the coupon's doing. **You must control for \(Z\).**
- **Chain, a mediator.** \(X \to Z \to Y\): \(Z\) is the middle step the effect travels through. If the coupon works by getting people to visit the site more, and visits drive spending, then visits is a mediator. It is *part of* the effect, not a distortion. **Usually leave it alone**, or you subtract off the very thing you set out to measure.
- **Collider, the trap.** \(X \to Z \leftarrow Y\): both \(X\) and \(Y\) point *into* \(Z\). Suppose Riverside flags a customer as "VIP" if they used a coupon *or* they already spend a lot. Then coupon and spend both feed the VIP flag. **Never control for a collider**: doing so manufactures a correlation that was never there.

Press each button below. Watch which node lights up as the one to worry about, then run the R the widget shows to see a confounder distort, and then correct, a coefficient.

::widget causal-dag {}

=== step === concept
::eyebrow Following the arrows
## Two paths from coupon to spend

To decide what to control for, you trace **paths**. A path is any chain of arrows connecting two nodes, followed regardless of which way each arrow happens to point. Between the coupon and spend, Riverside's diagram has exactly two:

1. The **causal path** \(\text{coupon} \to \text{spend}\). The arrow points away from the coupon, toward spend. This carries the real effect, the thing you want to measure.
2. A **backdoor path** \(\text{coupon} \leftarrow \text{loyalty} \to \text{spend}\). It leaves the coupon through an arrow pointing *into* it (out the back door), then reaches spend. It carries association but not causation: loyalty is making the two ends move together.

Association flows along *both* kinds of path. That is why the raw $18 gap was too big: it was the true effect (front path) plus the loyalty leak (back path), added together, which is exactly the selection bias you measured in Lesson 1. Your job is to let association flow along the causal path while shutting it off along every backdoor.

The honest target has a name. It is the *interventional* quantity \(P\big(Y \mid do(X{=}x)\big)\), read "the distribution of spend if we reached in and *set* the coupon to \(x\) for everyone." That is not the same as the *observational* \(P(Y \mid X{=}x)\), "spend among customers who merely *happened* to have that coupon status." Observation includes the backdoor leak; a true intervention, like Lesson 1's coin flip, does not. Adjusting for the right variables is how you recover \(P\big(Y \mid do(X)\big)\) from data you only observed.

[KEY INSIGHT]
A correlation is the sum of every open path between two variables. Causation is only the front, causal path. Controlling for variables is how you close the back paths and leave the front one open.

=== step === quiz
::eyebrow Check yourself
## Confounder, collider or mediator?

Riverside marks a customer as a "VIP" when they either redeemed a coupon or spent above a threshold, so both getting a coupon and spending more push a customer onto the VIP list. In Riverside's diagram, what role does the VIP flag play between coupon and spend?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A confounder you should control for, since VIPs behave differently ::no A confounder sits UPSTREAM and points INTO both coupon and spend, the way loyalty does. VIP is the reverse: coupon and spend point into it. Controlling for it hurts, it does not help.
- A collider, because both coupon and spend point into it, so you must not control for it ::ok Right. Both arrows enter the VIP flag (coupon into VIP, spend into VIP), which makes it a collider. Filtering to VIPs, or adding VIP to the model, opens a fake path between coupon and spend.
- A mediator, because the coupon works by turning customers into VIPs ::no A mediator sits ON the causal path (coupon to Z to spend). Here the coupon does not raise spending BY making someone a VIP; the VIP flag is a downstream label that spending itself helps set. The arrows point the wrong way for a mediator.

=== step === concept
::eyebrow The one rule
## Block every backdoor, and nothing else

"Controlling for" a variable \(Z\), also called *conditioning on* it or *adjusting for* it, means comparing coupon and spend only *within* groups that share the same value of \(Z\): same loyalty, or same VIP status. What that does to a path depends entirely on the shape \(Z\) sits in.

- On a **fork** \(X \leftarrow Z \to Y\) or a **chain** \(X \to Z \to Y\), conditioning on the middle node **closes** the path. Compare only customers with the same loyalty and loyalty can no longer make coupon and spend move together. The backdoor is shut.
- On a **collider** \(X \to Z \leftarrow Y\), conditioning does the opposite: it **opens** a path that was closed. Look only at VIPs and now learning the coupon status tells you something about spend, because a VIP with no coupon must have been a big spender to make the list. You create a correlation just by looking.

So there is a single rule for what to adjust for, the **backdoor criterion**: find a set of variables that (1) blocks every backdoor path from the treatment to the outcome, and (2) contains no *descendant* of the treatment, that is, nothing the treatment causes. Rule (2) is what keeps mediators and downstream colliders out of the set. Adjust for exactly that set and only the front, causal path survives. The recipe:

::widget process-flow {"steps":[{"title":"List the variables","sub":"the treatment, the outcome, and anything that may cause either"},{"title":"Draw the arrows","sub":"one arrow per direct cause you believe in; never a loop"},{"title":"Find the backdoor paths","sub":"trails that leave the treatment through an arrow into it"},{"title":"Choose what to adjust for","sub":"block every backdoor; never condition on a collider"}]}

For Riverside, the only backdoor runs through loyalty, and loyalty is not caused by the coupon, so the adjustment set is just loyalty. Control for loyalty, nothing more.

=== step === concept
::eyebrow See it in R
## A collider invents a correlation

The collider rule is the one that trips people, so let us watch it happen. We hand out the coupon *at random*, so by construction it has no real link to how much a customer would spend on their own. Then we flag VIPs the way Riverside does, coupon holders or big spenders, and measure the correlation two ways.

```r
# Coupon is randomized, so it is unrelated to a customer's own baseline spend.
set.seed(11)
n <- 4000
coupon     <- rbinom(n, 1, 0.5)              # X: a fair coin, tied to nothing
base_spend <- round(rnorm(n, 55, 12))        # Y: each customer's own spending level

# VIP if you used a coupon OR you already spend a lot: both arrows point INTO vip (a collider)
vip <- as.integer(coupon == 1 | base_spend > 65)

round(cor(coupon, base_spend), 3)                       # overall: essentially zero
#> [1] 0.025
round(cor(coupon[vip == 1], base_spend[vip == 1]), 3)   # among VIPs only: a fake negative link
#> [1] -0.472
```

Nothing about any customer changed between those two lines, and the coupon still causes nothing. All we did was *look only at VIPs*, and a strong negative correlation appeared out of thin air. Among people on the VIP list, the ones without a coupon had to be the big spenders (or they would not have qualified), so "no coupon" now travels with "spends more." Condition on a collider and you conjure a relationship. That is why the backdoor criterion forbids it.

[WARNING]
Choosing your sample can be conditioning in disguise. Studying only VIP customers, only hospital patients, only the people who answered a survey: each one conditions on a variable those groups share. If that variable is a collider, it bends every correlation you compute inside the group.

=== step === quiz
::eyebrow Check yourself
## Should you control for site visits?

Riverside believes the coupon lifts spending mainly by bringing people back to the website: coupon to visits to spend. A colleague wants to add `visits` to the model "to be safe, since it is clearly related to spend." If your goal is the coupon's *total* effect on spending, should you control for visits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, always control for anything correlated with the outcome; more controls means a more accurate estimate ::no "Correlated with the outcome" is the wrong test, and controlling is not free. Visits sits ON the causal path, so adjusting for it removes part of the very effect you are trying to measure.
- No: visits is a mediator on the path coupon to visits to spend, so controlling for it would remove the effect the coupon works through ::ok Exactly. For the TOTAL effect you leave a mediator alone. Adjust for it and you block the front path, shrinking the coupon's measured effect toward zero even though it truly works.
- No, because visits is a confounder, and confounders must never be controlled for ::no The verdict is right but the reasoning is backwards twice: visits is a mediator, not a confounder, and confounders are exactly what you SHOULD control for. Mislabel the shape and good intentions ruin the estimate.

=== step === tryit
::eyebrow Your turn
## Close the backdoor

Back to the case that matters most in practice, the confounder. Here is Riverside's data with loyalty restored as the confounder from Lesson 1: loyal customers were emailed more coupons and spend more on their own. We plant a true coupon effect of exactly $8, then fit the naive model that ignores the graph.

```r
set.seed(3)
n <- 3000
loyalty <- rnorm(n)                                        # the confounder
coupon  <- rbinom(n, 1, plogis(1.2 * loyalty))            # loyalty -> coupon
spend   <- 45 + 8 * coupon + 12 * loyalty + rnorm(n, 0, 5) # true coupon effect = 8; loyalty lifts spend
riverside <- data.frame(loyalty, coupon, spend)

round(coef(lm(spend ~ coupon, data = riverside))["coupon"], 2)   # naive: leaves the backdoor open
#> coupon
#>  19.55
```

The naive model reports a $19.55 lift, more than double the truth, because loyal big spenders were overrepresented among coupon holders and the backdoor was left wide open. Close it by adding the one variable the backdoor criterion picked out. Fill in the blank.

```r
# Adjust for the confounder the DAG identified, then read the coupon effect.
round(coef(lm(spend ~ coupon + ____, data = riverside))["coupon"], 2)
```
::check {"regex":"loyalty","gate":true,"difficulty":"intermediate","ok":"Right: adjusting for loyalty closes the only backdoor, and the coupon effect drops from $19.55 to about $8.06, the value you planted. Same data, same coupon, one correct control.","no":"Add the confounder loyalty: lm(spend ~ coupon + loyalty). It is the only variable on a backdoor path from coupon to spend."}
::solution
```r
round(coef(lm(spend ~ coupon + loyalty, data = riverside))["coupon"], 2)
#> coupon
#>   8.06
```

=== step === concept
::eyebrow The catch
## When a DAG lets you down

A DAG is only ever as honest as the arrows you drew. Three limits are worth stating plainly.

- **The arrows are assumptions, and the data cannot check them.** The same customer spreadsheet is consistent with many different DAGs. Draw loyalty as a confounder when it is really something else and the "correct" adjustment becomes the wrong one. A DAG moves the argument to where it belongs, your causal claims, but it does not settle it.
- **You can only adjust for what you measured.** If some hidden driver, say a customer's disposable income, causes both coupons (marketing targeted wealthier segments) and spend, and you never recorded it, no arithmetic recovers the true effect. An **unmeasured confounder** leaves a backdoor you cannot close. That is the usual reason an observational estimate stays uncertain.
- **More controls is not safer.** As the collider showed, adjusting for the wrong variable *adds* bias. "Throw everything into the regression" is not a strategy; the graph tells you the few variables to include and, just as importantly, the ones to keep out.

Once a graph grows past a handful of nodes you stop tracing paths by hand. The `dagitty` package reads the adjustment set straight off the diagram. Run this in your own R session:

```r-static
library(dagitty)   # install.packages("dagitty")

g <- dagitty('dag {
  loyalty -> coupon
  loyalty -> spend
  coupon  -> spend
}')

adjustmentSets(g, exposure = "coupon", outcome = "spend")
#>  { loyalty }
```

It returns exactly what we reasoned out by hand: control for loyalty, and only loyalty.

[NOTE]
Drawing the DAG is the hard, human part; querying it is mechanical. The value is in stating your assumptions clearly enough that a tool, or a sceptical colleague, can check the logic that follows from them.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Hernan and Robins, Causal Inference: What If (free PDF)](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - Chapter 6 builds DAGs, paths and d-separation in exactly the order used here.
- [Cunningham, Causal Inference: The Mixtape, DAG chapter (free, online)](https://mixtape.scunning.com/03-directed_acyclical_graphs) - the same ideas worked slowly, with code and worked colliders.
- [Textor et al. (2016), the dagitty R package, Int. J. Epidemiology (DOI)](https://doi.org/10.1093/ije/dyw341) - the paper behind the tool that computes adjustment sets for you.
- [dagitty.net](http://www.dagitty.net/) - draw a DAG in the browser and it lists the sets you must adjust for.
- [Pearl (1995), Causal diagrams for empirical research, Biometrika (DOI)](https://doi.org/10.1093/biomet/82.4.669) - the paper that introduced the backdoor criterion and the do-operator.

=== step === complete
## Lesson 2 complete

You can now turn a causal question into a diagram and read the answer off it. An arrow is a claim of direct cause; a path is any trail between two variables; and where a third variable sits decides what you do with it. Control for a **confounder** (a fork) to close the backdoor it opens, the way you pulled Riverside's coupon effect from an inflated $19.55 back to its true $8. **Never** control for a **collider**, or you invent a correlation from nothing, the way the VIP filter did. And leave a **mediator** alone when you want the total effect, or you subtract off the effect itself. The backdoor criterion ties it together: block every backdoor, and adjust for nothing the treatment causes.

Next, Lesson 3: A/B Testing and Experiment Design. Randomizing is the one move that erases every backdoor at once, collapsing the tangled graph back into the single clean arrow you actually care about. You will see how to design an experiment that earns that simplicity, and how large a sample it takes to trust what the experiment tells you.
