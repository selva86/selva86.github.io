---
title: "Causal Inference from Data in R: An Interactive Course"
slug: "Causal-Inference-from-Data-Course"
description: "Learn causal inference in R across eight interactive lessons: potential outcomes, causal diagrams and the collider trap, propensity scores and inverse probability weighting, matching, difference-in-differences, instrumental variables, regression discontinuity and mediation."
keywords: "causal inference in R, potential outcomes, average treatment effect, ATE, ATT, causal diagram, DAG, confounder, mediator, collider, adjustment set, propensity score in R, inverse probability weighting, matching in R, nearest neighbour matching, caliper, covariate balance, difference-in-differences, parallel trends, instrumental variables, two-stage least squares, weak instrument, regression discontinuity, synthetic control, mediation analysis, sensitivity analysis"
mathjax: false
webr: false
date: "2026-11-25"
curriculum_id: "4.130.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Causal Inference from Data (Course)"
sidebar_order: "44"
---

# Causal Inference from Data in R: A Hands-On Interactive Course

<p class="lead">Every causal claim is a comparison between something that happened and something that did not. This eight-lesson interactive course is about the gap that opens there, why no amount of regression closes it by itself, and what each of the standard designs assumes in exchange for closing it.</p>

It starts with a table you are allowed to see all of. Each customer carries two numbers, what they would spend with the coupon and what they would spend without it, and the causal effect is simply the difference. Printing both columns makes the problem unmissable, because in any real dataset one of the two is always absent. Randomization then arrives in its correct role: it does not recover the missing number, it makes the group averages comparable. That distinction is the one the rest of the course builds on, and it is also why the average effect over everyone and the average effect over the treated are genuinely different quantities rather than two names for one.

The second lesson is the one that changes how people write regressions. A causal diagram is treated as a precise claim with rules, and a confounder, a mediator and a collider are built on the same three variables, with data simulated from each. The identical regression then gives the right answer in one case and the wrong answer in the other two, which turns "which variables should I control for" from a matter of taste into something you can read off a diagram. The collider is the surprise, since adjusting for it manufactures an association out of nothing, and that is shown numerically rather than warned about. The practical consequence is blunt: controlling for everything you measured is a mistake, and it has a name.

From there the course works through what you can do when randomization was never available. Propensity scores reconstruct a population in which treatment is unrelated to the covariates, and the method's failure mode is demonstrated rather than footnoted, because a single unit with a propensity near zero or one can carry an enormous weight and dominate the estimate. Matching makes the comparison by construction instead of by model, and its honest cost is measured: units with no acceptable match are discarded, which quietly changes the population your estimate describes, so the lesson reports how many were dropped and what they looked like.

The final lessons each manufacture a comparison from structure. Difference-in-differences removes anything fixed about each group, and rests on one assumption that pre-treatment trends can support but never prove. Instrumental variables turn into two regressions you have already seen, with the weak-instrument failure produced on purpose so you recognise it in print. Regression discontinuity and synthetic control exploit a threshold and a weighted comparison group. The course then closes by stress-testing itself: mediation is estimated and then subjected to a sensitivity analysis that reports how strong an unmeasured confounder would have to be to explain the finding away, and the same logic is turned back on every observational estimate that came before it.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: What a causal effect actually is

A coupon test at a small online store, with both potential outcomes printed for every customer, which is a view no real dataset ever gives you. The causal effect becomes a subtraction, and the fundamental problem becomes visible in the same table: one of the two columns is always missing. Comparing the groups you happened to observe is then shown to mislead, and randomization is shown to fix it by balancing the groups rather than by filling anything in. The lesson ends by earning the names ATE and ATT, because they are different numbers and your data may support only one.

[Start Lesson 1: What a causal effect actually is](What-a-Causal-Effect-Actually-Is.html)

### Lesson 2: Drawing the assumptions you cannot test

A software company's onboarding call, and a causal diagram treated as a precise statement with rules rather than a sketch. Confounder, mediator and collider are built one at a time on the same three variables, with data simulated from each, so the same regression visibly gives the right answer once and the wrong answer twice. The collider is demonstrated creating an association from nothing. The payoff is procedural: read the adjustment set off the diagram, and understand why adjusting for every column you happen to have measured is a named mistake rather than a safe default.

[Start Lesson 2: Drawing the assumptions you cannot test](Drawing-the-Assumptions-You-Cannot-Test.html)

### Lesson 3: Propensity scores and inverse probability weights

A gym offers a free trainer session to the members who already attend most, so the raw comparison is unfair by construction. The propensity score is built as exactly what it sounds like, a fitted probability of being offered the session, and then used twice on the same data: as a weight that reconstructs a pseudo-population where treatment is unrelated to the covariates, and as a balance diagnostic you check before trusting anything. The failure mode is produced rather than described, because a propensity near zero or one creates an enormous weight that one unit can ride to dominate the whole estimate.

[Start Lesson 3: Propensity scores and inverse probability weights](Propensity-Scores-and-Inverse-Probability-Weights.html)

### Lesson 4: Matching and what it throws away

A reminder sent to a product's less-engaged users, which makes a direct comparison meaningless. Matching pairs each treated user with its closest untreated counterpart, so the comparison is made by construction instead of by model, with nearest-neighbour and caliper matching both implemented and the before-and-after balance table presented as the output that justifies the method. Then the cost, measured rather than mentioned: users with no acceptable match are dropped, the population the estimate describes shifts, and the lesson reports exactly who left and what the remaining estimate is now about.

[Start Lesson 4: Matching and what it throws away](Matching-and-What-It-Throws-Away.html)

### Lesson 5: Difference-in-Differences and Its One Assumption

Two groups and two time periods, with the estimator built by hand as a difference of two differences, which cancels anything fixed about each group and anything common to both periods. The assumption doing all the work is named precisely: absent the treatment, the two groups would have moved in parallel. Then the check and its limits, because parallel pre-treatment trends are evidence rather than proof, and a simulated case with perfectly parallel pre-trends and non-parallel counterfactuals is shown fooling the method completely.

[Start Lesson 5: Difference-in-Differences and Its One Assumption](Difference-in-Differences-and-Its-One-Assumption.html)

### Lesson 6: Instrumental variables when you cannot randomize

An instrument defined by the three conditions it has to satisfy, with each one marked as testable or untestable so it is clear where the risk actually sits. Two-stage least squares is computed by hand with both stages printed, which turns it into a sequence of two regressions you already know rather than a black box. The weak-instrument problem is then produced deliberately by weakening the first stage until the second-stage estimate becomes wildly unstable, together with the first-stage diagnostic that catches it before publication.

[Start Lesson 6: Instrumental variables when you cannot randomize](Instrumental-Variables-When-You-Cannot-Randomize.html)

### Lesson 7: Regression discontinuity and synthetic control

Two designs that manufacture a comparison out of structure. Regression discontinuity exploits a threshold rule, with the effect read as the jump at the cutoff, the bandwidth choice shown changing the answer, and the manipulation check run on the density of the assignment variable. Synthetic control builds a weighted combination of untreated units that tracks the treated one before the intervention, with the weights printed and the pre-period fit presented as the credential that earns the post-period counterfactual.

[Start Lesson 7: Regression discontinuity and synthetic control](Regression-Discontinuity-and-Synthetic-Control.html)

### Lesson 8: Mediation, and how wrong you can afford to be

Mediation decomposed into direct and indirect paths, estimated, and then immediately stress-tested, because it rests on a stronger assumption than most users realise: no unmeasured confounding between the mediator and the outcome. A sensitivity analysis introduces a confounder of known strength and reports how strong it would have to be to explain the finding away, which is the number that belongs in the paper. The same logic is then turned back on the observational estimates from lessons 3 to 7, which is how this course ends honestly.

[Start Lesson 8: Mediation, and how wrong you can afford to be](Mediation-and-How-Wrong-You-Can-Afford-to-Be.html)

## Who this is for

Anyone who has been asked whether something worked when a randomized trial was never an option. [Linear Regression, Properly](Linear-Regression-Properly-Course.html) supplies the regression machinery these designs are built from, and [Experimental Design and A/B Testing](Experimental-Design-and-A-B-Testing-Course.html) covers the case where you can randomize, which is the contrast this course is defined against. Neither is required first. You should be able to fit a model with `lm()` and `glm()`, read a coefficient table, and simulate data with `rnorm()` or `rbinom()`.

It is also the right course if you have ever added a control variable because it was available, or read a paper that adjusted for a long list of covariates and could not tell whether that made the estimate better or worse.

## What you will be able to do

- State a causal effect in potential-outcomes terms and say which quantity your data can actually identify
- Explain what randomization does and, just as importantly, what it does not do
- Tell ATE and ATT apart and say which one a given comparison estimates
- Draw a causal diagram and read the adjustment set off it
- Recognise a confounder, a mediator and a collider, and show why adjusting for the last two causes damage
- Fit a propensity score, weight by it, and check covariate balance before and after
- Spot the extreme-weight failure that lets one observation dominate a weighted estimate
- Match treated units to controls, present the balance table that justifies it, and report what the matching discarded
- Apply difference-in-differences, instrumental variables and regression discontinuity, and name the assumption each one rests on
- Run a sensitivity analysis that says how strong an unmeasured confounder would need to be to overturn your result

Ready? [Begin with Lesson 1: What a causal effect actually is](What-a-Causal-Effect-Actually-Is.html).
