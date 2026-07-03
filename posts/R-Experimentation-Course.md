---
title: "Experimentation in R: A Hands-On Course"
slug: "R-Experimentation-Course"
description: "Learn experimentation in R in seven interactive lessons: statistical power and sample size, CUPED, peeking and SRM, switchback designs, and multi-armed bandits."
keywords: "experimentation in R, A/B testing in R, statistical power, sample size calculation, power.prop.test, minimum detectable effect, CUPED, variance reduction, peeking, sample ratio mismatch, SRM, switchback experiments, cluster randomization, design effect, multi-armed bandits, epsilon-greedy, Thompson sampling, contextual bandits, off-policy evaluation, inverse propensity scoring, interactive course"
mathjax: false
webr: false
date: "2026-07-03"
curriculum_id: "6.170.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Experimentation (Course)"
sidebar_order: "170"
---

# Experimentation in R: A Hands-On Course

<p class="lead">An A/B test looks simple: split the traffic, wait, compare. Almost everything that goes wrong happens around that comparison, tests too small to detect the lift they were built for, metrics too noisy to move, dashboards peeked at until they confess, and traffic splits that quietly break. This seven-lesson interactive course covers the craft of running experiments that can be trusted: sizing a test for power before it launches, shrinking variance with CUPED, catching peeking and sample-ratio mismatch, designing around interference with clusters and switchbacks, and going adaptive with multi-armed bandits. You run live R in the browser at every step.</p>

Here is the kind of question the course lives on. A checkout page converts 4.0 percent of its 6,000 weekly visitors, and a redesign is expected to lift that to 4.6 percent, worth about $160,000 a year. How many visitors does the test need before that lift, if real, will actually show up as significant? Run it with too few and the test fails to notice a redesign that genuinely works; the feature dies, and nobody ever learns it was a false negative. The first lesson answers that question exactly, and the rest of the course handles everything that tries to undo it.

The thread through every lesson is building the machinery yourself before trusting a platform with it. You estimate power by simulating an experiment 2,000 times before running it once, verify the CUPED variance identity on data you generated, watch peeking inflate a false-positive rate in front of you, and write an epsilon-greedy bandit from scratch before meeting Thompson sampling.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints, and write code as you go.

## The seven lessons

### Lesson 1: Designing Experiments for Power

A test can be wrong in two directions; power is the probability it catches an effect that is really there. Estimate a design's power by simulation, compute the required sample size with `power.prop.test`, flip the question to the minimum detectable effect your traffic allows, and size skewed revenue metrics where the formulas break.

[Start Lesson 1: Designing Experiments for Power](Designing-Experiments-for-Power.html)

### Lesson 2: Variance Reduction with CUPED

The fastest way to a smaller test is a less noisy metric. CUPED uses pre-experiment data to absorb the variation users brought with them, cutting variance by a factor of one minus rho squared with zero bias. Compute the adjustment in base R, see exactly where the reduction comes from, and meet stratification as its close cousin.

[Start Lesson 2: Variance Reduction with CUPED](Variance-Reduction-with-CUPED.html)

### Lesson 3: Experiment Pitfalls: Peeking and SRM

The three ways online experiments lie. Peeking, checking significance repeatedly and stopping on the first star, inflates the false-positive rate far above the promised 5 percent; watch it happen in simulation. Sample-ratio mismatch, a traffic split that drifted from its design, is caught with a chi-square test. Interference between users breaks the comparison more quietly.

[Start Lesson 3: Experiment Pitfalls: Peeking and SRM](Experiment-Pitfalls-Peeking-and-SRM.html)

### Lesson 4: Cluster and Switchback Experiments

When one user's treatment spills onto another, riders and drivers, buyers and sellers, friends in a feed, randomizing individuals stops working. Randomize whole clusters and pay the variance cost the design effect prices in, or alternate treatment over time with switchback designs built for marketplace spillovers.

[Start Lesson 4: Cluster and Switchback Experiments](Cluster-and-Switchback-Experiments.html)

### Lesson 5: Multi-Armed Bandits: Explore vs Exploit

A fixed 50/50 split keeps sending traffic to the losing arm long after the answer is clear. Meet the explore/exploit dilemma, measure the cost of learning as regret, and build epsilon-greedy, the simplest adaptive allocation, from scratch; then learn when a bandit beats a fixed A/B split and when it does not.

[Start Lesson 5: Multi-Armed Bandits: Explore vs Exploit](Multi-Armed-Bandits-Explore-vs-Exploit.html)

### Lesson 6: Thompson Sampling and Bayesian Bandits

Instead of exploring at a fixed rate, sample from each arm's Beta posterior and play the arm that wins the draw: traffic flows to each arm in proportion to the probability it is best. See why that one idea explores exactly as much as the evidence warrants and beats epsilon-greedy on regret.

[Start Lesson 6: Thompson Sampling and Bayesian Bandits](Thompson-Sampling-and-Bayesian-Bandits.html)

### Lesson 7: Contextual Bandits and Off-Policy Evaluation

The best arm often depends on who is looking. Add features so the policy chooses per context, then answer the harder question: how well would a new policy have done, scored only from logged data, without deploying it? Inverse-propensity scoring and the doubly-robust estimator make that possible.

[Start Lesson 7: Contextual Bandits and Off-Policy Evaluation](Contextual-Bandits-and-Off-Policy-Evaluation.html)

### Section quiz: check what stuck

Ten graded questions across the whole section, statistical power and the 1-over-d-squared trap, CUPED, peeking and sample-ratio mismatch, interference and the design effect, multi-armed bandits, Thompson sampling, and off-policy evaluation with IPS and doubly-robust scoring, plus two live R snippets you can run. A quick way to find the ideas worth a second pass before you move on.

[Take the Experimentation quiz](Experimentation-Quiz.html)

## Who this is for

You have met the A/B test and the p-value, and you can write a short function in base R. That is the whole prerequisite. Every idea past that, power, CUPED, regret, posterior sampling, is built from scratch the moment it arrives, usually by simulating it before naming it. The course follows naturally from the inference material on the Data Scientist path.

## What you will be able to do

- Size an experiment before launch: compute power and required sample size, and report the minimum detectable effect your traffic supports
- Shrink a test's variance with CUPED using pre-experiment data, and say exactly where the reduction comes from
- Catch the classic failure modes: quantify the damage peeking does, and test a traffic split for sample-ratio mismatch
- Choose the right design under interference, cluster randomization with its design effect, or a switchback
- Build epsilon-greedy and Thompson sampling bandits in base R and compare them on regret
- Evaluate a new decision policy from logged data with inverse-propensity scoring and doubly-robust estimates

Ready? [Begin with Lesson 1](Designing-Experiments-for-Power.html).
