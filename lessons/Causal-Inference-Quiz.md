---
title: "Causal Inference in R: Quiz"
description: "A short, graded check on the causal-inference section: correlation versus causation, potential outcomes, causal diagrams with confounders and colliders, A/B test design, reading an experiment, and estimating effects when you cannot randomize."
keywords: "R quiz, causal inference, correlation causation, potential outcomes, confounder, collider, DAG, A/B testing, difference-in-differences, ds-causal"
post_type: "LESSON"
curriculum_id: "6.10.6"
webr: true
lesson_access: "pro"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Causal-Inference-Course.html"
lesson_kind: "quiz"
course_prev: "When-You-Cannot-Randomize.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have learned what a causal effect really means through potential outcomes, how to read confounders and colliders off a causal diagram, how to design and size a fair A/B test, how to report an experiment's effect with honest uncertainty, and how to estimate effects when randomization is impossible. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## What a causal effect is
In the potential-outcomes framing, the causal effect of a treatment on one unit is:
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- The correlation between treatment and outcome across all units. ::no Correlation is an association across units, not a within-unit effect.
- The difference between its outcome if treated and its outcome if not treated. ::ok Correct: the effect compares two potential outcomes for the same unit, only one of which we ever observe.
- The average outcome of everyone who was treated. ::no That is a treated-group average, which confounding can distort.
- The p-value of a regression coefficient. ::no A p-value measures evidence, not the effect itself.

=== step === quiz
::eyebrow Question 2 of 6
## Confounder or collider
On a causal diagram, a confounder is a variable that:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Causes both the treatment and the outcome, so you must adjust for it. ::ok Correct: a common cause opens a back-door path; leaving it out biases the effect.
- Is caused by both treatment and outcome, so you must adjust for it. ::no That describes a collider, and adjusting for it opens a fake path.
- Sits on the path from treatment to outcome, so you must adjust for it. ::no That is a mediator; adjusting for it removes part of the effect you want.
- Has no arrows at all. ::no An isolated variable is neither a confounder nor a concern.

=== step === quiz
::eyebrow Question 3 of 6
## Why randomize
Randomly assigning treatment in an experiment works because, on average, it:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Guarantees the two groups are identical in every single row. ::no Randomization balances groups on average, not row by row.
- Removes the need for a control group. ::no You still compare against a control; randomization makes that comparison fair.
- Balances both known and unknown confounders across the groups. ::ok Correct: that balance is what lets a simple difference in means estimate the causal effect.
- Increases the sample size. ::no Randomization allocates units; it does not add any.

=== step === quiz
::eyebrow Question 4 of 6
## Reading an experiment
An A/B test shows a statistically significant lift with p = 0.03. Before acting you should also check:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Nothing else; significance settles it. ::no Significance says the effect is probably non-zero, not that it is large or worth it.
- The size of the effect and its confidence interval, to see if the lift is big enough to matter. ::ok Correct: a tiny but significant effect can be commercially meaningless.
- Whether the p-value is below 0.001 instead. ::no A stricter cutoff does not tell you the effect's magnitude.
- Only the number of users, ignoring the estimate. ::no Sample size matters, but you still need the effect size and its uncertainty.

=== step === quiz
::eyebrow Question 5 of 6
## When you cannot randomize
With only observational data, a method like difference-in-differences can estimate a causal effect if:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The treated and control groups would have moved in parallel absent the treatment. ::ok Correct: the parallel-trends assumption is what lets the difference of differences remove fixed gaps.
- The two groups have identical outcomes before treatment. ::no It needs parallel trends, not equal starting levels.
- The sample is randomly assigned. ::no If you could randomize you would not need difference-in-differences.
- The outcome is normally distributed. ::no Normality is not the identifying assumption.

=== step === quiz
::eyebrow Question 6 of 6
## The cost of ignoring a confounder
You estimate the effect of a training program on wages but omit prior education, which raises both. The estimated effect will be:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Unbiased, since regression handles it automatically. ::no Regression only adjusts for variables you actually include.
- Exactly zero. ::no Omitting a confounder shifts the estimate; it does not zero it out.
- Biased, because the omitted common cause is mistaken for the program's effect. ::ok Correct: adjust for the confounder and the estimated effect typically shrinks toward the truth.
- More precise than before. ::no Omitting a confounder harms accuracy, not helps it.

=== step === concept
::eyebrow Run it: a confounder flips the story
## Adjust and watch it change
Generate data where Z causes both X and the outcome Y, while X has no real effect on Y. The naive regression sees an effect; adjusting for Z makes it vanish.

```r
set.seed(1)
n <- 500
Z <- rnorm(n)
X <- 0.8 * Z + rnorm(n)        # Z drives X
Y <- 1.0 * Z + rnorm(n)        # Z drives Y; X has no real effect
round(c(naive    = coef(lm(Y ~ X))["X"],
        adjusted = coef(lm(Y ~ X + Z))["X"]), 3)
```

The naive coefficient looks like a real effect of X, but once you adjust for the confounder Z it collapses to near zero, which is the truth.

=== step === concept
::eyebrow Run it: a randomized difference in means
## Why randomization is enough
Randomly assign a treatment that truly adds 5 to the outcome, then estimate the effect with a plain difference in group means. No adjustment needed.

```r
set.seed(1)
n <- 400
treat <- rbinom(n, 1, 0.5)              # random assignment
y <- 10 + 5 * treat + rnorm(n)          # true effect is 5
round(mean(y[treat == 1]) - mean(y[treat == 0]), 2)
```

The difference in means lands close to the true effect of 5, because randomization balanced everything else across the two groups.

=== step === complete
## Section complete
Strong work. You can define a causal effect through potential outcomes, read confounders and colliders off a diagram, design and size an experiment, report an effect with honest uncertainty, and reach for difference-in-differences when you cannot randomize. Next: opening up the models to explain what they learned.
