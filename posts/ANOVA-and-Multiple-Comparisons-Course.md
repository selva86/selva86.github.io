---
title: "ANOVA and Multiple Comparisons in R: An Interactive Course"
slug: "ANOVA-and-Multiple-Comparisons-Course"
description: "Learn ANOVA in R across eight interactive lessons: one-way and two-way ANOVA built by hand, interaction effects, fixed and random factors, planned contrasts, family-wise error control, false discovery rate, and marginal means you can report."
keywords: "ANOVA in R, one-way ANOVA in R, two-way ANOVA in R, aov in R, interaction effects in R, fixed and random factors, planned contrasts in R, Tukey HSD in R, Bonferroni correction in R, Holm correction, Benjamini-Hochberg in R, false discovery rate, estimated marginal means, emmeans in R"
mathjax: true
webr: false
date: "2026-11-18"
curriculum_id: "4.50.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "ANOVA & Multiple Comparisons (Course)"
sidebar_order: "36"
---

# ANOVA and Multiple Comparisons in R: A Hands-On Interactive Course

<p class="lead">An ANOVA table is usually taught as something to read, which hides the two facts that matter most: a significant F tells you something differs without telling you what, and every question you ask afterwards costs you something. This eight-lesson interactive course builds the table from its parts, then spends the rest of its time on what you are entitled to ask once you have it.</p>

Comparing two groups was settled in the previous courses. Comparing four is not that problem repeated four times, and the reason is arithmetic you can run yourself: six pairwise tests on four identical groups flag a difference far more often than one time in twenty. That simulation opens the course, and everything after it follows from taking the result seriously.

So the F statistic is assembled by hand as a ratio of two sums of squares before `aov()` is called, a second factor is added and shown to make the first one easier to detect rather than harder, and an interaction is stated as a sentence before it becomes a term in a model. Then the part most treatments leave out: a planned contrast is cheap because you committed to it before the data arrived, a post-hoc search is expensive because you did not, and the price of each is measured on data where the truth is known.

The through-line is that a correction for multiple testing is not a penalty imposed on you. It is the arithmetic of a promise you chose to make, and two different promises lead to two different methods, both of them honest.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Comparing several groups at once

Why you cannot answer "do these four teaching methods differ" with six t-tests, shown by simulating four identical groups and counting how often at least one pair looks significant. Then the one-way ANOVA built from its parts: variation between group means set against variation within groups, assembled by hand as two sums of squares before `aov()` is called, so the F statistic arrives as a ratio you computed rather than a number a function returned. What a significant F does and does not tell you, which is that something differs and not which thing.

[Start Lesson 1: Comparing several groups at once](Comparing-Several-Groups-at-Once.html)

### Lesson 2: Two factors and their combined effect

Two-way ANOVA on a design with both a treatment and a block, where the second factor is the one that makes the first readable. Main effects computed from marginal means by hand, the sums-of-squares table reproduced line by line so every number in `summary(aov())` has a known origin, and the result that surprises people: adding a second factor that genuinely matters makes the first factor's test more sensitive, because the noise it was competing against has been named and removed. Balanced and unbalanced designs contrasted, with Type I against Type II sums of squares changing the answer on the unbalanced one.

[Start Lesson 2: Two factors and their combined effect](Two-Factors-and-Their-Combined-Effect.html)

### Lesson 3: When an effect depends on another

Interaction as a sentence before it is a term: the effect of this depends on that. Two groups crossed with two conditions, plotted four ways, with the parallel-lines case set against the crossed-lines case so you can see what the interaction term is measuring. The trap that follows: once an interaction is in the model, a main effect is no longer "the effect of the factor" but its effect at one reference level, which is the single most common misreading of an ANOVA table. Simple effects computed at each level as the honest alternative.

Lesson 3 is coming soon.

### Lesson 4: Fixed or random, which factor is which

The question is not statistical, it is what you want to generalise to, and the arithmetic follows from the answer. Four specific doses you chose are fixed; twenty randomly selected clinics are random. The same dataset analysed both ways, so the standard errors and the denominator of F visibly change, and so treating a random factor as fixed is shown to produce intervals that are too narrow because they describe only the clinics you happened to sample.

Lesson 4 is coming soon.

### Lesson 5: Asking a specific question of your groups

A planned contrast is a weighted combination of group means that encodes a question you had before the data arrived, which is why it costs less than a post-hoc search. Contrast weights written by hand for three real questions, a control against the mean of three treatments, a linear trend across doses, and one treatment against another, each tested, then Tukey's all-pairs comparison run on the same data so you can compare what the two approaches cost in power. Orthogonality explained as what makes contrasts non-overlapping questions.

Lesson 5 is coming soon.

### Lesson 6: Controlling the family-wise error rate

What a 5% error rate per test becomes across twenty tests, derived and then simulated so the number is a count rather than a formula. Bonferroni built in one line and shown to be exactly as conservative as advertised, Holm built as its step-down improvement and shown to reject strictly more while controlling the same quantity, and the price of both measured in missed true effects on simulated data where the truth is known. Why controlling the family-wise rate is the right goal for a confirmatory study and the wrong one for a screen.

Lesson 6 is coming soon.

### Lesson 7: When false discovery rate beats Bonferroni

A different promise: not "probably no false positives anywhere" but "of the things I flagged, this fraction are wrong". Benjamini-Hochberg implemented by hand, sorting the p-values and comparing each to its own threshold, on a thousand-test screen where two hundred effects are real. Set against Bonferroni on the identical data, so you see BH find most of the real effects while Bonferroni finds a handful, and see the cost, which is that some flagged findings are false and the method says so up front.

Lesson 7 is coming soon.

### Lesson 8: Marginal means you can actually report

The number a reader wants is rarely a coefficient; it is a group's predicted mean with the other variables held somewhere sensible. Estimated marginal means computed by hand from the fitted model, by building the prediction grid and averaging over it, so "adjusted mean" is a thing you have done before any helper is used. Then `emmeans` as the shortcut, with its contrast and confidence-interval output read line by line. Why marginal means from an unbalanced design differ from raw group means, which is the whole point of reporting them.

Lesson 8 is coming soon.

## Who this is for

Anyone who has run `aov()` or seen an ANOVA table in a paper and wanted to know where its numbers come from and what may honestly be claimed from them. The logic of p-values and intervals is developed in [Confidence Intervals and P-Values](Confidence-Intervals-and-P-Values-Course.html), and test choice and assumptions in [Choosing Statistical Tests](Choosing-Statistical-Tests-Course.html); either is useful first, neither is required. You should be able to run R, write a function, and use `replicate()` and `sample()`. Everything here runs on base R.

It is also the right course if a reviewer has asked you to correct for multiple comparisons and you were not sure which correction they meant, or why there is more than one.

## What you will be able to do

- Explain why several pairwise tests are not a substitute for one ANOVA, and show the inflated error rate by simulation
- Build a one-way ANOVA from its sums of squares and say what a significant F does and does not establish
- Fit a two-way ANOVA, read every line of its table, and explain why Type I and Type II sums of squares disagree on unbalanced data
- Interpret a main effect correctly in the presence of an interaction, and report simple effects instead where that is the honest reading
- Decide whether a factor is fixed or random from what you want to generalise to, and say what the choice changes
- Write contrast weights that encode a question you specified in advance, and say why that costs less than an all-pairs search
- Apply Bonferroni, Holm and Benjamini-Hochberg, state the different promise each one makes, and choose between them
- Compute estimated marginal means, explain how they differ from raw group means, and report them with intervals

Ready? [Begin with Lesson 1: Comparing several groups at once](Comparing-Several-Groups-at-Once.html).
