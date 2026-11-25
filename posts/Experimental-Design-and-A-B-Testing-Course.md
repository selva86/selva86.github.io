---
title: "Experimental Design and A/B Testing in R: An Interactive Course"
slug: "Experimental-Design-and-A-B-Testing-Course"
description: "Learn experimental design in R across eight interactive lessons: randomization and blocking, factorial and split-plot designs, power and sample size by simulation, the cost of peeking at an A/B test, response-surface optimization, and pre-registration."
keywords: "experimental design in R, A/B testing in R, randomization, blocking, stratified randomization, factorial design in R, split-plot design, power analysis by simulation, sample size calculation in R, power.t.test, sequential testing, alpha spending, optional stopping, central composite design, response surface methodology, expected improvement, pre-registration, multiple comparisons"
mathjax: false
webr: false
date: "2026-11-25"
curriculum_id: "4.120.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Experimental Design and A/B Testing (Course)"
sidebar_order: "43"
---

# Experimental Design and A/B Testing in R: A Hands-On Interactive Course

<p class="lead">A study's design, not its sample size, decides whether it can answer the question you asked. This eight-lesson interactive course is about the decisions made before any data exists, and about what simulating a planned study tells you that a power formula cannot.</p>

It opens with one retailer's checkout test built four different ways. Randomize every visitor and the real effect shows up. Randomize the day instead of the visitor, let visitors opt into the new version, or simply compare the weeks before a change to the weeks after, and the comparison breaks in three different ways. All four designs are then swept across sample size, which makes the central point hard to argue with: a bigger sample does not rescue a broken design, it only reports the wrong answer more precisely.

Randomization is then examined rather than assumed. Twenty-four shoppers already carry the cart values that will decide the result, and two thousand random splits of them show what "balanced on average" really means: most splits are fine, some are badly unlucky, and the unlucky ones cost you the exact number you came for. Blocking and stratified randomization are built as the repair, which settles the rule the rest of the course leans on. You block on what you know and randomize for what you do not.

The middle lessons are about getting more from fewer runs. A factorial experiment is compared against testing two factors separately, an interaction is read straight off the cell means, and then a factor that is hard to change forces a split-plot, where the same sixteen observations analyzed two ways give two different answers about temperature. Only one of them is right, and knowing which depends on recognizing that the experiment has two error terms rather than one.

Planning is where simulation takes over from formulas. Power becomes something you measure by running a planned study thousands of times, sample size becomes a sweep that you stop when the curve crosses the threshold you chose, and both then get applied to designs no closed formula covers. The course ends on honesty rather than technique: how much daily peeking inflates a false-alarm rate, two different fixes that each keep the stated error rate, how four perfectly honest outcome choices push a 5% test to 18%, and the pre-registration document that closes the gap.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Designing a study that can answer the question

A retailer's checkout test, simulated four ways, so you can watch a design succeed and three designs fail on identical data. Randomizing every visitor recovers the true effect. Randomizing the day instead introduces day-level noise the analysis cannot separate. Letting visitors opt in lets the keenest shoppers choose the treatment. Comparing before against after hands the comparison every trend and season that happened in between. The closing sweep across sample size is the lesson: three of these designs stay wrong no matter how much data you collect.

[Start Lesson 1: Designing a study that can answer the question](Designing-a-Study-That-Can-Answer-the-Question.html)

### Lesson 2: Randomize what you can, block what you cannot

Twenty-four shoppers whose cart values exist before the test starts, split two thousand different ways, so "randomization balances the groups" becomes a distribution you can look at rather than a reassurance. Most splits balance well, a few are badly unlucky, and the unlucky ones move the estimated effect by more than the effect itself. Blocking pairs shoppers before any coin is flipped and is run against the same two thousand splits to show the variance it removes. Stratified randomization does the same job for a categorical nuisance variable.

[Start Lesson 2: Randomize what you can, block what you cannot](Randomize-What-You-Can-Block-What-You-Cannot.html)

### Lesson 3: Factorial designs and the split-plot trap

A bakery's sixteen-tray test crossing two factors, which answers more questions than two separate experiments using the same trays, and answers one that separate experiments cannot ask at all. The interaction is read directly from the cell means before any model is fitted. Then the trap: oven temperature is hard to change, so it is set once per batch rather than per tray, and the same data analyzed as a simple factorial gives a different answer for temperature than the split-plot analysis does. The intraclass correlation sets how far apart the two answers drift.

[Start Lesson 3: Factorial designs and the split-plot trap](Factorial-Designs-and-the-Split-Plot-Trap.html)

### Lesson 4: Power analysis by simulation, not formula

A sleep app's bedtime reminder, with power built from the ground up: one simulated trial read against the null distribution, then thousands of them, and the proportion that reach significance is the power. The result is checked against `power.t.test` on the case where a formula exists, which is how you earn the right to trust the simulation. Then the planned analysis adds a baseline covariate, the formula runs out, and the simulation keeps going without changing shape.

[Start Lesson 4: Power analysis by simulation, not formula](Power-Analysis-by-Simulation-Not-Formula.html)

### Lesson 5: How big a sample do you actually need

The power simulation turned around: fix the power you need and solve for the sample size. Candidate sizes are swept until simulated power crosses 80%, and the flat right-hand end of the power curve explains why the last few percent cost so many participants. The same sweep is then run for a yes or no outcome and for a clustered design that no closed formula solves. Two honest cautions are built in: the effect size you power for is a judgment rather than a measurement, and a pilot study's estimate is systematically too flattering to plan on.

[Start Lesson 5: How big a sample do you actually need](How-Big-a-Sample-Do-You-Actually-Need.html)

### Lesson 6: A/B tests and the cost of peeking

Dana checks an A/B test every morning and stops at the first significant result, which is the most natural habit in online testing and also the one that breaks it. Simulation prices the habit exactly: one honest look costs what it should, and repeated looks inflate the false-alarm rate far past the 5% the test claims. Two fixes follow, and both are honest. Fix the sample size in advance and do not look, or spend your error budget deliberately across looks with an alpha-spending boundary. The lesson closes on how to choose between them.

[Start Lesson 6: A/B tests and the cost of peeking](A-B-Tests-and-the-Cost-of-Peeking.html)

### Lesson 7: Finding the best settings with fewer runs

A coffee roaster looking for the best temperature and time, where a full grid of settings would cost more roasts than anyone will pay for. A screening design detects that curvature exists but cannot describe its shape, axial runs turn it into a central composite design, and the fitted surface's peak is located and then confirmed with a real roast rather than trusted. A sequential alternative chooses each run from what the previous runs showed, using expected improvement, and reaches the same region in far fewer runs. The closing comparison shows where each design actually spent its observations.

[Start Lesson 7: Finding the best settings with fewer runs](Finding-the-Best-Settings-with-Fewer-Runs.html)

### Lesson 8: Writing down the analysis before the data

One 200-person reminder trial and four completely honest ways to analyze it, each defensible on its own, which together turn a 5% false-positive rate into 18% on data with no real effect in it. The number of honest choices is then allowed to grow, and the rate climbs with it. Pre-registration arrives as the specific repair: six things a plan has to fix, the document written out in full for this trial, and the deviation that honesty requires you to report rather than hide.

[Start Lesson 8: Writing down the analysis before the data](Writing-Down-the-Analysis-Before-the-Data.html)

## Who this is for

Anyone who has to collect data rather than analyze data that already exists, and anyone who has run an online test and wondered whether stopping it early was allowed. [ANOVA and Multiple Comparisons](ANOVA-and-Multiple-Comparisons-Course.html) covers the analysis side of designed experiments and pairs naturally with this course, though it is not required first. You should be able to fit a model with `lm()`, write a `for` loop or use `replicate()`, and read a p-value without flinching.

It is also the right course if a stakeholder has ever asked how many users a test needs and your honest answer was a shrug, or if you have inherited a result from a before-and-after comparison and suspected it was measuring the season.

## What you will be able to do

- Say which of four candidate designs can answer a question, and why a bigger sample will not fix the other three
- Block on a known nuisance variable and show, by simulation, how much variance the blocking removed
- Use stratified randomization for a categorical nuisance variable
- Cross two factors in one experiment and read an interaction from the cell means
- Recognise a hard-to-change factor and analyze the resulting split-plot with the correct error term
- Compute statistical power by simulating a planned study, and validate the simulation against a formula where one exists
- Sweep sample size to the smallest n that reaches your target power, including for designs no formula covers
- Quantify what repeated peeking does to a test's false-alarm rate, and apply either honest fix
- Plan a two-factor optimization with a central composite design or a sequential expected-improvement search
- Write a pre-registration document that closes the specific loopholes that inflate false positives

Ready? [Begin with Lesson 1: Designing a study that can answer the question](Designing-a-Study-That-Can-Answer-the-Question.html).
