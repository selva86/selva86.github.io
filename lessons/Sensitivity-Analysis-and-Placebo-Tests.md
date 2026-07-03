---
title: "Causal Inference for Decisions Lesson 10: Sensitivity Analysis and Placebo Tests"
catalog_blurb: "How much a hidden confounder could change your causal conclusion."
description: "No observational estimate is assumption-free. Measure how strong a hidden confounder must be to overturn your result, and run placebo tests in R."
keywords: "sensitivity analysis, E-value, Rosenbaum bounds, placebo test, unmeasured confounding, causal inference, observational study, robustness, R"
post_type: "LESSON"
curriculum_id: "6.180.10"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "10"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Mediation-Analysis.html"
course_prev: "Double-Debiased-Machine-Learning.html"
---

=== step === cover
::eyebrow Lesson 10 of 11
## Sensitivity Analysis and Placebo Tests

Across this course you have built an arsenal for pulling a causal effect out of messy observational data: matching and propensity scores, inverse-probability weighting, difference-in-differences, regression discontinuity, instrumental variables. Every one of them shares a quiet catch. They strip out the confounding you can measure and put in a model, and none of them can rule out a confounder you never measured.

Take a real-sounding case. FreshCart, an online grocery, notices that customers who joined its paid membership, FreshCart Plus, are still active a year later far more often than customers who did not. It is tempting to announce that Plus *causes* loyalty. But maybe the keenest shoppers, the ones who love ordering groceries by app, both sign up for Plus and stick around regardless. That keenness is a confounder, and nobody wrote it down.

You cannot prove it is absent. So this lesson does the honest thing instead: it measures how fragile your conclusion is. By the end you will be able to:

- Explain why every estimate in this course rests on an untestable no-unmeasured-confounding assumption
- Compute an E-value: how strong a hidden confounder would have to be to explain your result away
- Read Rosenbaum bounds, the matched-design cousin of the E-value
- Run placebo tests, and recognise a failed one as proof your design is picking up bias

**Prerequisites:** Lessons 1 to 3 of this course (confounding and potential outcomes, propensity-score matching and IPW, and difference-in-differences); you can fit `lm` and `glm` and read a risk ratio and a p-value.

::widget causal-dag {}

=== step === concept
::eyebrow The crack in every method
## One assumption holds up the whole course

Look back at what each method actually did. Matching and IPW balanced the treated and control groups on the covariates you fed them. Difference-in-differences leaned on a control group with parallel trends. Regression discontinuity trusted that units just above and below a cutoff were otherwise alike. Different machinery, one shared load-bearing belief: once you account for what you measured, who ended up treated is as good as random.

That belief has a name, **ignorability** (also called no unmeasured confounding). Writing \(Y^1\) and \(Y^0\) for the outcome a unit would have with and without treatment \(T\), and \(X\) for the covariates you measured, ignorability says

\[ \{Y^0, Y^1\} \perp\!\!\!\perp T \mid X. \]

In words: among customers with the same measured covariates \(X\), which of them joined Plus is unrelated to how they would have behaved either way. If that holds, the leftover difference is the causal effect. If a confounder sits *outside* \(X\), it does not hold, and every estimate above is off by an unknown amount.

[KEY INSIGHT]
Ignorability cannot be tested from the data, because the data never contain the confounders you failed to measure. It is an assumption you defend with judgement. Sensitivity analysis replaces "trust me, there is no other confounder" with a number: how strong would one have to be?

::widget process-flow {"steps":[{"title":"Matching and IPW","sub":"balance treated and control on the covariates you measured"},{"title":"Difference-in-differences","sub":"borrow a control group that was trending in parallel"},{"title":"Regression discontinuity","sub":"compare units just above and below a cutoff"},{"title":"Every one of them assumes","sub":"no unmeasured confounder sits outside the model"}]}

=== step === concept
::eyebrow The number on the table
## FreshCart's result, and why it is shaky

Let us make the FreshCart story concrete so we have something to stress-test. Each lesson runs in a fresh R session, so we build the data here. We plant an unmeasured trait, `enthusiasm`, that drives BOTH joining Plus and staying active. In real life you would never see this column; here we create it on purpose, so we know exactly the truth the analyst is missing.

```r
set.seed(2024)
n <- 4000
# enthusiasm: an UNMEASURED trait, how much a shopper enjoys grocery-by-app.
# It pushes people to BOTH join Plus and stay active. The analyst never records it.
enthusiasm <- rnorm(n)
member <- rbinom(n, 1, plogis(-0.3 + 1.2 * enthusiasm))                  # self-selection into Plus
active <- rbinom(n, 1, plogis(-0.2 + 1.0 * enthusiasm + 0.15 * member))  # enthusiasm dominates; Plus adds little

p1 <- mean(active[member == 1])   # 12-month retention among members
p0 <- mean(active[member == 0])   # 12-month retention among non-members
round(c(members = p1, nonmembers = p0, risk_ratio = p1 / p0), 3)
#>    members nonmembers risk_ratio 
#>      0.595      0.358      1.662 
```

Members are retained 59.5% of the time, non-members only 35.8%. Taken at face value, membership carries a **risk ratio of 1.66**: members are two-thirds more likely to still be around. With 4,000 customers that gap is wildly "significant". But we built the data, so we know the truth: membership adds only a little, and most of that 1.66 is enthusiasm doing the work in both columns at once. An analyst without the enthusiasm column would see 1.66 and have no way, from the data alone, to know how much of it is real.

=== step === concept
::eyebrow Turning the question around
## How strong would the hidden confounder need to be?

Instead of arguing about whether enthusiasm exists, ask a sharper question: *how strongly* would it have to act to fake the whole result? An unmeasured confounder \(U\) (the node drawn as Z below) does its damage through two arrows: its association with the treatment (keen shoppers are likelier to join Plus) and its association with the outcome (keen shoppers stay active). Call those two risk ratios \(RR_{UT}\) and \(RR_{UY}\).

The most bias those two arrows can jointly produce is capped by the **bias factor**

\[ B = \frac{RR_{UT}\,\times\,RR_{UY}}{RR_{UT} + RR_{UY} - 1}. \]

Read it as a dial. A confounder that is weak on either arrow (either risk ratio near 1) can barely nudge the estimate; only one that is strong on *both* arrows at once can manufacture a large apparent effect. The widget below makes this tangible. Switch it to the confounder pattern and run its R: watch an omitted confounder inflate a coefficient, then collapse it back toward zero once you put the confounder into the model.

::widget causal-dag {}

=== step === concept
::eyebrow The headline number
## The E-value

The **E-value** turns that bias factor into one number you can report. It is the *smallest* value that both risk ratios, \(RR_{UT}\) and \(RR_{UY}\), would each have to reach for an unmeasured confounder to explain the observed association away completely. For an observed risk ratio \(RR \ge 1\),

\[ \text{E-value} = RR + \sqrt{RR\,(RR - 1)}. \]

A larger E-value means the result is harder to overturn: a confounder would have to be that strong on *both* arrows to erase it. An E-value near 1 means a whisker of confounding would do it. Report it for the point estimate and, more tellingly, for the confidence-interval limit nearest 1, since the effect could already be as small as that limit before any confounding enters.

First the risk ratio with a confidence interval, computed by hand from the log-risk-ratio standard error:

```r
n1 <- sum(member == 1); n0 <- sum(member == 0)
rr <- p1 / p0
se <- sqrt((1 - p1) / (p1 * n1) + (1 - p0) / (p0 * n0))   # standard error of log(RR)
ci <- exp(log(rr) + c(lo = -1.96, hi = 1.96) * se)
round(c(rr = rr, ci), 2)
#>   rr   lo   hi 
#> 1.66 1.55 1.78 
```

```r
# E-value: the least association (risk-ratio scale) a hidden confounder needs with BOTH
# membership and retention to fully explain the estimate away. Base R, one formula.
evalue <- function(x) { x <- ifelse(x >= 1, x, 1 / x); x + sqrt(x * (x - 1)) }
round(c(point = evalue(rr), ci_limit = evalue(ci[["lo"]])), 2)
#>    point ci_limit 
#>     2.71     2.48 
```

So an unmeasured confounder would need a risk ratio of about **2.48** with both joining Plus and staying active, over and above everything you did measure, before the effect (down to its lower confidence limit) could be pure bias. Is that plausible? That is now a concrete judgement, not a hand-wave: compare 2.48 against the strength of the confounders you *did* measure. If none of your measured predictors reaches an association of 2.5, an unmeasured one that strong is a stretch and the result looks fairly robust. If a keen-shopper trait plausibly clears 2.5 on both arrows, and for FreshCart it might, you should not call membership causal yet.

[WARNING]
A big E-value never proves an effect is causal. It only says the confounding required to kill it would have to be strong. The E-value moves the argument onto firmer ground; it does not settle it.

=== step === concept
::eyebrow The matched-design cousin
## Rosenbaum bounds

The E-value speaks the language of risk ratios. When your design was a **matched** one (Lesson 1: each member paired with a similar non-member), there is a cousin that speaks the language of the pairs directly: **Rosenbaum bounds**.

The idea: inside a matched pair the two customers looked alike on everything you measured, so absent hidden bias each was equally likely to be the one who joined Plus, a coin flip. A sensitivity parameter \(\Gamma \ge 1\) (Gamma) relaxes that. It lets an unmeasured confounder make one member of a pair up to \(\Gamma\) times more likely to have joined:

\[ \frac{1}{\Gamma} \;\le\; \frac{\text{odds unit } i \text{ joined}}{\text{odds unit } j \text{ joined}} \;\le\; \Gamma. \]

\(\Gamma = 1\) is the no-hidden-bias world (a randomized experiment). At \(\Gamma = 2\), hidden bias could double the joining odds within a pair. For each \(\Gamma\) you recompute the p-value under the least favourable configuration and see how high \(\Gamma\) can climb before the result stops being significant. That climb is your robustness.

```r
# Rosenbaum bounds for the matched-pair sign test (using the matching from Lesson 1).
# Say the matched analysis left D discordant pairs (member and non-member differed on the
# outcome), and in t of them the MEMBER was the one who stayed active.
D <- 200    # discordant matched pairs
t <- 131    # pairs in which the member stayed and the matched non-member did not
# Under hidden bias Gamma, the member-favoured probability per pair is at most Gamma/(1+Gamma),
# so the LARGEST the one-sided p-value can be is:
gamma <- c(1, 1.25, 1.5, 1.75, 2)
p_upper <- sapply(gamma, function(g) pbinom(t - 1, D, g / (1 + g), lower.tail = FALSE))
data.frame(gamma, p_value_upper_bound = round(p_upper, 3))
#>   gamma p_value_upper_bound
#> 1  1.00               0.000
#> 2  1.25               0.003
#> 3  1.50               0.064
#> 4  1.75               0.320
#> 5  2.00               0.667
```

At \(\Gamma = 1\) the result is overwhelmingly significant. It survives a little hidden bias (still p = 0.003 at \(\Gamma = 1.25\)), but by \(\Gamma = 1.5\) the worst-case p-value has already climbed past 0.05. So the finding holds only as long as no unmeasured confounder shifts the within-pair joining odds by more than about 40 percent. That is not much slack: this matched result is only mildly robust, and an honest write-up says so.

=== step === quiz
::eyebrow Check yourself
## What a big E-value actually tells you

FreshCart's analyst reports an E-value of 2.48 for the lower confidence limit and writes: "Since the E-value is well above 1, we conclude that FreshCart Plus causes higher retention." What is wrong with that sentence?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong: an E-value above 1 is the standard threshold for declaring an effect causal ::no There is no such threshold. Every genuine effect AND every purely confounded association has an E-value above 1; the number describes how much confounding would be needed, never whether that confounding is actually present.
- The E-value only says a confounder would have to be fairly strong (a risk ratio of 2.48 on both arrows) to erase the effect; it does not show that no such confounder exists, so it cannot on its own establish causation ::ok Exactly. Sensitivity analysis quantifies fragility, it does not certify causation. You still have to argue that a confounder of that strength is implausible given what you know about the setting.
- The E-value is too small to interpret: you need it above 5 before drawing any conclusion ::no There is no universal cutoff, and 2.48 is a meaningful degree of robustness. The flaw is the logic (an E-value cannot prove the absence of confounding), not the magnitude.

=== step === concept
::eyebrow A different kind of check
## Placebo tests: run your method where the answer must be zero

Sensitivity analysis asks "how strong must a confounder be?" A placebo test asks something you can run directly: *point my exact estimator at a situation where the true effect is known to be zero, and see whether it still finds one.* If it does, the method is manufacturing effects out of bias, and its "real" answer is suspect too.

Three common flavours:

- **Placebo outcome.** Swap the real outcome for one the treatment cannot possibly affect, often something measured *before* treatment. FreshCart Plus cannot change how active you were last spring. If membership still "predicts" that pre-launch behaviour, the confounder is showing itself.
- **Placebo timing.** Re-run a difference-in-differences with the policy date moved to a time when nothing happened. The picture below is the real DiD from Lesson 3: treated and control split apart at the policy. A placebo-timing test refits that same model with the policy date moved back to a quiet month. A clean design shows the lines still moving together there (gap near 0); a gap at the fake date means something other than the policy is pulling them apart.
- **Placebo group.** Attach the treatment label to a group that was never treated. Any "effect" is pure bias.

::widget did-parallel {}

[KEY INSIGHT]
A placebo test is a trap you set for your own method. Passing it does not prove you are right (the placebo could differ from the real setting in some way), but failing it is strong evidence you are wrong. It is one of the cheapest and most persuasive robustness checks you can run.

=== step === tryit
::eyebrow In R
## Run a placebo-outcome test

Here is FreshCart's placebo outcome: whether each customer was active in the six months *before* Plus launched. Membership cannot reach back in time, so a well-identified design should return a risk ratio near 1 on this outcome. We build it from enthusiasm alone (Plus did not exist yet):

```r
# Pre-launch activity: driven by enthusiasm, NOT by membership (Plus did not exist yet).
active_before <- rbinom(n, 1, plogis(-0.2 + 0.9 * enthusiasm))
```

Now compute the placebo risk ratio, members versus non-members, on this pre-launch outcome. Fill in the blank so the denominator also uses the pre-launch outcome you just built.

```r
# members vs non-members on the PRE-launch outcome; a clean design gives about 1
placebo_rr <- mean(active_before[member == 1]) / mean(____[member == 0])
round(placebo_rr, 2)
```
::check {"regex":"active_before\\s*\\[\\s*member\\s*==\\s*0","gate":true,"difficulty":"intermediate","ok":"There it is: a risk ratio near 1.5 on an outcome membership cannot possibly cause. That gap is the enthusiasm confounder, caught red-handed. The same bias is inflating the real 1.66, so treat that number with suspicion.","no":"Use the pre-launch outcome active_before in the denominator too: mean(active_before[member == 0])."}
::solution
```r
placebo_rr <- mean(active_before[member == 1]) / mean(active_before[member == 0])
round(placebo_rr, 2)
#> [1] 1.49
```

A membership "effect" of 1.49 on behaviour from before membership existed is impossible as a causal effect. It is the confounder made visible: keen shoppers were already more active, and they are also the ones who joined. The placebo test just converted an abstract worry into a hard, quantitative red flag.

=== step === quiz
::eyebrow Check yourself
## Reading a failed placebo

A colleague evaluates a new onboarding email with difference-in-differences. To be safe, she runs a placebo-timing test: she pretends the campaign launched three months earlier than it did, when nothing was actually sent, and refits the model. The placebo run returns a statistically significant "effect" at that fake date. What should she conclude?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The design is flawed: an effect at a date when nothing happened means her estimator is picking up a pre-existing difference or trend, not the campaign, so the real estimate is not trustworthy either ::ok Right. A placebo should return roughly zero. A significant placebo effect is direct evidence the method attributes non-treatment differences to treatment, which contaminates the real estimate too.
- The result is stronger than she thought: finding an effect even at the earlier date shows the campaign works robustly across time ::no A placebo date is one where no treatment occurred, so there is nothing to have an effect. An "effect" there is bias, not evidence of a robust campaign. It undermines the analysis rather than reinforcing it.
- Nothing is wrong, as long as the real-date effect is larger than the placebo effect ::no A nonzero placebo is a failure regardless of relative size. It proves the estimator moves on things other than the treatment; you cannot simply subtract it off and trust the remainder, because you do not know the bias is the same at both dates.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take sensitivity analysis and placebo tests further:

- [VanderWeele and Ding (2017), Sensitivity Analysis in Observational Research: Introducing the E-Value (Annals of Internal Medicine)](https://pubmed.ncbi.nlm.nih.gov/28693043/) - the paper that defined the E-value, with the full derivation and worked examples.
- [The EValue R package (CRAN)](https://cran.r-project.org/package=EValue) - compute E-values for risk ratios, odds ratios, hazard ratios and more, instead of coding the formula by hand.
- [Rosenbaum, Observational Studies, 2nd edition (Springer)](https://link.springer.com/book/10.1007/978-1-4757-3692-2) - the canonical treatment of Rosenbaum bounds and design-based sensitivity analysis.
- [Cinelli and Hazlett, sensemakr (documentation and paper)](https://carloscinelli.com/sensemakr/) - a modern regression sensitivity toolkit (partial R-squared, robustness values) that generalises the bias-factor idea.

=== step === complete
## Lesson 10 complete

You stopped taking a causal estimate at face value and started stress-testing it. Two tools did the work. The **E-value** turned "is there confounding?" into "how strong would it have to be?", 2.48 for FreshCart's lower limit, a bar you judge against the confounders you actually measured. **Rosenbaum bounds** did the same for a matched design on the odds scale, and showed the result held only out to a Gamma of about 1.4. And **placebo tests** set a trap: run the estimator where the truth is zero, and a nonzero answer, like the 1.49 you found on pre-launch behaviour, exposes bias you can no longer wave away.

None of these prove an effect is causal. They do something more useful: they tell you, and your readers, exactly how much doubt an honest analysis should carry.

Next, Lesson 11: Mediation Analysis. Instead of asking whether a treatment works, you will ask *how* it works, splitting a total effect into the part that runs directly and the part that flows through a mediator, and seeing why mediation leans on assumptions even stronger than the ones you just learned to stress-test.
