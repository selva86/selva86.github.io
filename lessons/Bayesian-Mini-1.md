---
title: "Bayes' theorem: the simulation that makes it click"
description: "Simulate 10,000 people, watch a 99% accurate test on a rare disease produce mostly false alarms, then derive and chain Bayes' theorem across repeated evidence."
keywords: "Bayes theorem, Bayesian statistics, posterior probability, prior probability, likelihood, conditional probability, base rate fallacy, R programming"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "1"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Bayesian-Mini-2.html"
curriculum_id: "0.0.30"
lesson_access: "windowed"
catalog_blurb: "Why a 99% accurate test can still be wrong most of the time."
---

=== step === cover
## Bayes' theorem: the simulation that makes it click

Today let's understand Bayes' theorem, clearly and simply, using a puzzle that trips up doctors and patients alike.

Here is the puzzle. A disease affects 1 in every 1,000 people. There is a test for it, and the test is good: 99% of the time it correctly flags someone who has the disease, and 99% of the time it correctly clears someone who does not. You take the test. It comes back positive.

What is the chance you actually have the disease?

Most people's gut answer is something close to 99%. The real answer is nowhere near that, and soon you will know exactly why, and be able to compute it yourself for any test and any disease.

Bayes' theorem is the rule that gets you from "the test is 99% accurate" to your actual chance of being sick. Three things go into it: how common the disease is before any test, what the positive result actually tells you, and the chance of disease you end up with once those two are combined. Always in that order.

::widget process-flow {"steps":[{"title":"Before the test","sub":"what you believe about the disease before any evidence: 1 in 1,000 people have it"},{"title":"The positive result","sub":"new evidence arrives: a test that is 99% sensitive and 99% specific comes back positive"},{"title":"After the test","sub":"the probability of disease once that positive result is accounted for: this is what the theorem computes"}]}

That is the whole shape of it. Everything from here is just filling in these three stages, first for the disease and the test, then for a completely different puzzle, to prove the rule is general.

=== step === concept
## The puzzle: what a positive result actually means
::prose-only the numbers are stated here, not yet computed or simulated

Let's put real names on the three numbers hiding in that puzzle.

**Prevalence** is how common the disease is in the population: the probability a random person has it, before any test. For our puzzle, prevalence is 1 in 1,000, or 0.001.

**Sensitivity** is how often the test catches the disease when it is really there. It is the probability of a positive result, given the person is sick. Our test has 99% sensitivity: test 100 sick people, and about 99 of them test positive.

**Specificity** is how often the test correctly clears someone who does not have the disease. It is the probability of a negative result, given the person is healthy. Our test also has 99% specificity: test 100 healthy people, and about 99 of them test negative, meaning about 1 tests positive anyway.

That leftover 1% is the whole story. It is small, but it gets applied to a group that is enormous compared to the group of sick people.

Now we can restate the puzzle precisely. Someone from this population takes the test and it comes back positive. What is the probability they actually have the disease? That quantity has a name: the **positive predictive value**, or **PPV**. It is the probability of disease given a positive result, written P(disease | positive).

Here is the answer, so you know what you are working toward: PPV comes out to about 9%. Not 99%. About 9%.

You will see exactly why, first by simulating it, then by deriving it from a single formula.

=== step === concept
## Simulating 10,000 people to see the puzzle happen

Numbers on a page are easy to doubt. Let's build 10,000 people instead, and watch the puzzle happen in front of you.

Give each of the 10,000 people a disease status, drawn at the 1-in-1,000 prevalence rate. Then give each of them a test result: if they are sick, a positive test 99% of the time, since sensitivity is 99%; if they are healthy, a positive test only 1% of the time, since specificity is 99%.

Press Run.

```r
# Simulate 10,000 people and give each one a disease status and a test result
set.seed(2026)
n_total <- 10000
prevalence <- 0.001
sens <- 0.99
spec <- 0.99

has_disease <- runif(n_total) < prevalence

test_positive <- ifelse(
  has_disease,
  runif(n_total) < sens,
  runif(n_total) < (1 - spec)
)

counts <- table(disease = has_disease, positive = test_positive)
counts
#>        positive
#> disease FALSE TRUE
#>   FALSE  9907   87
#>   TRUE      1    5
```

Read the table row by row. 9,994 of the 10,000 people turned out healthy, and 9,907 of them tested negative, correctly. But 87 healthy people tested positive anyway, purely because specificity is 99% and not 100%. Only 6 people in this batch of 10,000 turned out to actually have the disease, which is what a 1-in-1,000 prevalence looks like at this scale, and 5 of those 6 tested positive.

Now count the positive results. There are 87 + 5 = 92 of them in total, and only 5 of those 92 are real. The other 87 are false alarms.

```r
# The empirical PPV: true positives divided by all positives
empirical_ppv <- counts["TRUE", "TRUE"] / sum(counts[, "TRUE"])
round(empirical_ppv, 4)
#> [1] 0.0543
```

5.4%. Out of every positive result in this simulation, only about 1 in 18 was a real case. The rest were healthy people caught by the test's small 1% false-positive rate, and that 1% got applied to a group nearly a thousand times bigger than the sick group.

[NOTE]
Run this simulation again with a different seed and you will not land on exactly 5.4%. With only about 10 sick people expected out of 10,000, a single run barely has enough of them to give a stable count. Some runs will land closer to 9%, some further away. Bayes' theorem gives you the exact number this simulation is only estimating.

=== step === concept
## Turning the simulation into one formula: Bayes' theorem

The simulation above is really Bayes' theorem, run 10,000 times over instead of written as one line. Let's write that one line.

Bayes' theorem states:

$$P(A \mid B) = \frac{P(B \mid A) \, P(A)}{P(B)}$$

The formula has four parts, each with a name:

- P(A | B) is the **posterior**: the probability of A once you know B happened. In our puzzle, that is PPV, the probability of disease given a positive test.
- P(B | A) is the **likelihood**: the probability of the evidence, given A is true. In our puzzle, that is sensitivity, the probability of a positive test given disease.
- P(A) is the **prior**: your belief about A before any evidence. In our puzzle, that is prevalence.
- P(B) is the **evidence**: the overall probability of seeing B at all, across every way it could happen. In our puzzle, that is the overall probability of a positive test, sick or healthy.

For our puzzle, P(B), the overall chance of a positive result, has two ways to happen: a sick person tests positive, which is sensitivity times prevalence, or a healthy person tests positive anyway, which is the false-positive rate times the chance of being healthy. Add those two together and you have the full formula for PPV.

```r
# Turn Bayes' theorem into a reusable function: P(disease | positive)
bayes_pp <- function(prevalence, sens, spec) {
  numerator <- sens * prevalence
  denominator <- sens * prevalence + (1 - spec) * (1 - prevalence)
  numerator / denominator
}

ppv <- bayes_pp(prevalence = 0.001, sens = 0.99, spec = 0.99)
round(ppv, 4)
#> [1] 0.0902
```

9.02%. This is the number the simulation was estimating. Our one run of 10,000 people gave 5.4%, because that particular run happened to draw only 6 sick people instead of the expected 10. `bayes_pp()` does not depend on which particular 10,000 people got simulated. It computes the exact answer directly from the three numbers that define the puzzle: prevalence, sensitivity, and specificity.

That is the whole promise of the formula. The simulation and the formula are two ways of answering the exact same question, and now you have both.

=== step === widget
## Watching a prior and new evidence combine into a posterior

`bayes_pp()` is one example of a much more general pattern: a prior, combined with evidence, produces a posterior. The widget below shows that pattern directly, with its own numbers rather than the disease and test.

Its "prior mean" is your belief before any data, and "prior confidence" is how tightly you hold that belief. "Data average" and "data points n" describe the new evidence: what the data show, and how much of it there is. Drag any of the sliders and watch the posterior curve respond.

::widget bayes-update {}

Notice two things. First, the posterior always sits somewhere between the prior and the evidence, never outside either one. Second, the more data you add by raising n, the closer the posterior moves toward the evidence, and the less your starting belief matters.

Map that back to the disease puzzle. The prior mean is like prevalence: what you believed before the test. The data is like the test result. The posterior is like PPV: what you believe once the two are combined. A stronger prior, like a more common disease, pulls the posterior toward itself, the same way dragging "prior confidence" up here pulls the posterior toward the prior mean.

=== step === quiz
## Quick check: accuracy versus PPV

A blood test is marketed as "99% accurate," and a patient just tested positive. Based on what you have seen so far, what does that 99% figure actually tell you about this patient's chance of having the disease?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Nothing on its own. Sensitivity and specificity describe how the test performs in general, and the chance a positive result is real also depends on how common the disease is. ::ok Exactly. That is PPV, and it needs prevalence as well as the test's own numbers.
- It means there is a 99% chance this patient has the disease, since the test is 99% accurate. ::no
- It means only 1% of all positive results are false alarms, since the test is wrong 1% of the time. ::no "99% accurate" describes sensitivity and specificity, how the test performs on sick and healthy people in general. It says nothing about PPV, the chance that one particular positive result is real, which also depends on how rare the disease is. For a 1-in-1,000 disease, you already computed that PPV is about 9%, not 99%.

=== step === concept
## Which number moves the posterior the most

Three numbers feed into PPV: prevalence, sensitivity, and specificity. They do not all matter equally. Let's find out which one matters most when the disease is rare, by holding prevalence and sensitivity fixed and sweeping specificity across a range.

```r
# Sweep specificity from 80% to 99.9%, holding prevalence and sensitivity fixed
library(ggplot2)

spec_grid <- seq(0.80, 0.999, length.out = 200)
spec_df <- data.frame(
  specificity = spec_grid,
  ppv = bayes_pp(prevalence = 0.001, sens = 0.99, spec = spec_grid)
)

ggplot(spec_df, aes(x = specificity, y = ppv)) +
  geom_line(color = "#1f7a55", linewidth = 1) +
  labs(x = "Specificity", y = "PPV at 0.1% prevalence") +
  theme_minimal()
```

The curve stays low for a long stretch, then climbs steeply near the right edge. Read two points off it directly.

```r
# PPV at two points on the curve: 95% and 99.9% specificity
round(bayes_pp(0.001, 0.99, 0.95), 3)
#> [1] 0.019
round(bayes_pp(0.001, 0.99, 0.999), 3)
#> [1] 0.498
```

At 95% specificity, PPV is about 2%. Push specificity to 99.9%, and PPV rises to about 50%. That is a huge move, and it came entirely from specificity, while sensitivity and prevalence never changed.

Sensitivity tells you how well the test finds disease in people who have it. But when the disease is rare, the healthy group is enormous, so even a small false-positive rate inside that huge group swamps the small number of true positives. Specificity is what controls the size of that false-positive rate. For a rare disease, specificity is the lever that moves PPV the most.

=== step === widget
## Testing twice: using one posterior as the next prior

What happens if the same patient tests positive a second time? The posterior from the first test becomes the prior for the second. Bayes' theorem does not depend on where a prior comes from, so you can chain it.

```r
# Use one test's posterior as the next test's prior
first_post <- bayes_pp(prevalence = 0.001, sens = 0.99, spec = 0.99)
second_post <- bayes_pp(prevalence = first_post, sens = 0.99, spec = 0.99)

c(after_one_test = round(first_post, 3), after_two_tests = round(second_post, 3))
#> after_one_test after_two_tests
#>           0.090           0.907
```

After one positive test, PPV is 9%. Feed that 9% back in as the new prior for a second positive test, and PPV jumps to about 91%. A third positive test pushes it further still.

```r
# A third positive test, chained from the second posterior
third_post <- bayes_pp(prevalence = second_post, sens = 0.99, spec = 0.99)
round(third_post, 3)
#> [1] 0.999
```

By the third positive test, PPV is about 99.9%. This is exactly why clinics confirm a positive screening test with a second, independent test before treating anyone: one positive test rarely settles the question when the disease is rare, but two or three in a row settle it fast.

This widget also has an n slider, the number of data points behind the posterior. Drag it up and the posterior tightens around the evidence, the same way each extra positive test above tightens belief around "has the disease." Map n to the number of consecutive positive tests, and the two pictures are telling the same story.

::widget bayes-update {}

[NOTE]
This chaining only works cleanly if the tests are independent, meaning they can fail for different reasons. Running the exact same test twice on the same sample would not be independent, and would not justify this jump.

=== step === concept
## Bayes' theorem beyond medicine: a one-line spam filter

Bayes' theorem works the same way whether the events are diseases or emails. It only needs a prior, a likelihood, and a posterior. Swap in a different prior and a different likelihood, and you get a spam filter.

Say 40% of your email is spam, and 60% is legitimate, or "ham." That is your prior: P(spam) = 0.40. Now suppose the word "lottery" shows up in 30% of spam emails but only 1% of ham emails. Those are your two likelihoods. An email arrives containing the word "lottery." What is the posterior probability it is spam?

```r
# Apply Bayes' theorem to a completely different pair of events: spam and one word
p_spam <- 0.40
p_ham <- 0.60
p_word_given_spam <- 0.30
p_word_given_ham <- 0.01

posterior_spam <- (p_word_given_spam * p_spam) /
  (p_word_given_spam * p_spam + p_word_given_ham * p_ham)
round(posterior_spam, 3)
#> [1] 0.952
```

Seeing one word pushed the belief that this email is spam from a 40% prior to a 95% posterior. Compare the arithmetic to `bayes_pp()`: a prior, a likelihood under each hypothesis, and the same division at the end. This is the same formula. The events changed. The formula did not.

=== step === quiz
## Quick check: reading the whole picture

You now have two things to reason about: which of the test's two accuracy numbers moves PPV the most for a rare disease, and what happens to PPV as positive tests pile up. Which statement below is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Improving sensitivity moves PPV the most at low prevalence, and a second positive test should move PPV less than the first, since most of the update already happened. ::no
- Improving specificity moves PPV the most at low prevalence, because the healthy group is huge and even a tiny false-positive rate inside it swamps the sick group; and a second positive test moves PPV further than the first, because the first test already raised the prior going into the second. ::ok Right on both counts. You saw specificity swing PPV from about 2% to about 50%, and you saw the jump from test one to test two, 9% to 91%, dwarf the jump from no test to test one, 0.1% to 9%.
- Improving sensitivity moves PPV the most at low prevalence, and each additional positive test moves PPV by roughly the same fixed amount. ::no
- Prevalence is the only number that affects PPV; sensitivity and specificity only affect how many people get tested. ::no Specificity dominates PPV at low prevalence, not sensitivity, because the enormous healthy group is where nearly all the false positives live. And chaining is not additive: each positive test uses the previous posterior as its new prior, so later tests move belief further than earlier ones, not by a fixed amount.

=== step === tryit
## Your turn: compute and chain a posterior

`bayes_pp()` is still defined from earlier in this session. Use it on a new set of numbers: a disease with 2% prevalence, tested with 95% sensitivity and 90% specificity. Compute the posterior after one positive test into `ex_post1`, then chain it into a second positive test, `ex_post2`, using `ex_post1` as the new prior.

```r
# ex_prevalence, ex_sens and ex_spec below describe a different
# disease and test. bayes_pp() is still available from earlier.
# Compute the posterior after one positive test into ex_post1,
# then chain it into a second positive test, ex_post2, using
# ex_post1 as the new prior. Two lines. Press Check when you have them.
ex_prevalence <- 0.02
ex_sens <- 0.95
ex_spec <- 0.90
```
::check {"regex": "bayes_pp[(]\\s*ex_post1", "gate": true, "difficulty": "intermediate", "ok": "Right. After one positive test PPV is about 16%. Chain that into a second positive test and it climbs to about 65%.", "no": "Compute ex_post1 with bayes_pp(ex_prevalence, ex_sens, ex_spec), then chain it with bayes_pp(ex_post1, ex_sens, ex_spec) for ex_post2."}
::solution
```r
# Compute the posterior after one positive test, then chain a second
ex_post1 <- bayes_pp(ex_prevalence, ex_sens, ex_spec)
ex_post2 <- bayes_pp(ex_post1, ex_sens, ex_spec)

round(ex_post2, 2)
#> [1] 0.65
```

=== step === concept
## References

- Wikipedia, [Bayes' theorem](https://en.wikipedia.org/wiki/Bayes%27_theorem)
- 3Blue1Brown, [Bayes theorem](https://www.3blue1brown.com/lessons/bayes-theorem)
- Allen B. Downey, [Think Bayes: Bayesian Statistics in Python](https://greenteapress.com/wp/think-bayes/), a free book
- Eliezer Yudkowsky, [An Intuitive Explanation of Bayes' Theorem](https://www.yudkowsky.net/rational/bayes)
- r-statistics.co, [Bayes' Theorem in R](https://r-statistics.co/Bayes-Theorem-in-R.html)

=== step === complete
## What Bayes' theorem gives you

You simulated 10,000 people and watched a 99% accurate test on a rare disease produce mostly false alarms. Then you wrote that same result as one formula, Bayes' theorem, and it reproduced the exact number the simulation could only estimate.

To recap:

- Bayes' theorem combines a prior, a likelihood, and the overall evidence into a posterior: P(A | B) = P(B | A) P(A) / P(B).
- For a disease and a test, the posterior is PPV, and at 1-in-1,000 prevalence with a 99%-accurate test, PPV is about 9%, not 99%.
- When the disease is rare, specificity moves PPV far more than sensitivity does, because the enormous healthy group is where nearly all the false positives come from.
- One posterior can become the next prior. Two consecutive positive tests push PPV from about 9% to about 91%, and a third pushes it past 99%.
- The same formula, with a different prior and likelihood, runs a spam filter, or any other problem where new evidence changes what you thought going in.

Whenever you see a claim like "this test is 99% accurate," you now know to ask one more question before believing a positive result: how common is what it is testing for?
