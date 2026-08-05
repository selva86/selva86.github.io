---
title: "How to Answer Statistical Reviewer Comments in R"
slug: Answering-Statistical-Reviewer-Comments
description: "The 30 statistical objections peer reviewers actually raise, what each one means, how to check it in R, and how to word your response letter for each outcome."
keywords: "reviewer comments statistics, responding to peer review, statistical review response, reviewer 2 statistics, peer review assumptions R, response to reviewers statistics"
mathjax: false
webr: true
date: 2026-08-04
curriculum_id: null
post_type: C
sidebar_section: Statistics
sidebar_title: Answering Reviewer Comments
sidebar_order: 60
auto_link_terms: reviewer comments|responding to reviewers|peer review statistics|statistical reviewer
auto_link_case_sensitive: false
difficulty: Intermediate
---

# How to Answer Statistical Reviewer Comments in R

<p class="lead">Peer reviewers raise a small, predictable set of statistical objections. Each one has three possible answers: your analysis is fine and you need to show it, there is a fixable problem, or there is a real problem you must disclose. This page lists the thirty objections that come up most, what each one actually means, how to check it in R, and how to word the response.</p>

You have a review in front of you. Somewhere in it is a sentence like "the authors do not appear to have verified the assumptions of their model," and you have three weeks to respond.

The unhelpful advice is to go and learn more statistics. You do not have time for that, and it is not really the problem. The problem is that reviewer comments are terse, sometimes imprecise, and almost never tell you what they would accept as an answer.

This page is organised the way a review actually arrives: by complaint, not by method.

## First, triage the review

Not every comment needs the same effort. Sort them into three piles before you start.

**Substantive statistical objections.** The reviewer believes something about your analysis is wrong and that it might change your conclusion. These get a diagnostic, a decision, and a full response. Most of this page is about these.

**Requests for reporting.** The reviewer wants a number you did not report: a confidence interval, an effect size, a fit statistic. These are the fastest wins in any review. Add the number, say where it now appears, move on.

**Preferences dressed as objections.** The reviewer would have done it differently. Sometimes they are right and it is worth doing their way. Sometimes their way is not better, and the correct response is a short, polite explanation of why you chose what you chose, with a citation. You are allowed to disagree with a reviewer as long as you do it with reasons.

A useful test: ask whether the comment, if you acted on it, could change the paper's conclusion. If yes, it is substantive. If no, it is reporting or preference, and it should not consume your week.

## The response pattern

Nearly every substantive statistical comment can be answered with the same four-part structure. Having a pattern matters more than you might think, because it stops you writing defensively when you are tired.

**1. Restate the concern in your own words.** This proves you understood it and it costs you one sentence. "The reviewer is concerned that non-normal residuals may invalidate the reported p-values."

**2. Say what you did about it.** The specific check, with the specific result.

**3. Say what it means for the conclusion.** This is the part people skip, and it is the part the reviewer cares about most. A violated assumption is only a problem if it changes something.

**4. Say where it now appears in the manuscript.** Section, page, line. Reviewers are checking whether you actually made the change.

The tone throughout is neither defensive nor grovelling. You are reporting findings, including findings about your own work.

## Group 1: Did you check your assumptions?

The most common category and the easiest to answer well, because the checks are quick and the answer is usually reassuring.

Seven objections belong here: normality, equal variance, independence, autocorrelation, multicollinearity, linearity, and proportional hazards.

### "Normality was not assessed"

**What they mean.** Usually they are asking about the residuals, not the raw data. This is worth knowing because a lot of authors test the wrong thing and the reviewer comes back a second time.

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
shapiro.test(residuals(fit))
#> 
#> 	Shapiro-Wilk normality test
#> 
#> data:  residuals(fit)
#> W = 0.92792, p-value = 0.03427
```

**Reading this.** The test is significant at 0.05, so formally the residuals depart from normality. Before you panic, two things matter.

First, a normality test on 32 observations has very little power, and on 3,000 observations it will flag departures far too small to matter. The test tells you about statistical detectability, not about whether your inference is in trouble.

Second, and more usefully, look at the plot rather than the test.

```r
par(mfrow = c(1, 2))
qqnorm(residuals(fit)); qqline(residuals(fit))
hist(residuals(fit), main = "Residuals", xlab = "")
```

**The three outcomes.**

*You are fine.* The departure is mild, your sample is not tiny, and linear models are robust to moderate non-normality of residuals. Report the check, show the QQ plot in a supplement, and say so.

*It is fixable.* The residuals are skewed because the outcome is skewed. A transformation, or a model with a more appropriate error distribution, usually resolves it.

*It is a real problem.* The residual distribution is badly non-normal and your sample is small, so the p-values genuinely cannot be trusted. Move to a method that does not require the assumption, such as a bootstrap or a rank-based test.

**Wording.**

> We thank the reviewer for this point. We assessed normality of the model residuals using a Shapiro-Wilk test and quantile-quantile plots (Supplementary Figure S2). The test indicated a mild departure from normality (W = 0.93, p = 0.034). Given the sample size and the robustness of ordinary least squares to moderate non-normality, and because a bootstrap re-estimation produced substantively identical intervals, we have retained the original model. This check is now described in the Methods, page 8.

Note the structure: what we did, what we found, why it does not change the conclusion, where to find it.

### "Unequal variance was not addressed"

**What they mean.** The spread of the residuals changes across the range of fitted values, which makes the standard errors wrong. This one is more consequential than non-normality and is more often a genuine problem.

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
summary(lm(abs(residuals(fit)) ~ fitted(fit)))$coefficients
#>               Estimate Std. Error   t value  Pr(>|t|)
#> (Intercept) 1.04926882 1.09699364 0.9564949 0.3464672
#> fitted(fit) 0.04241854 0.05273478 0.8043750 0.4275091
```

Regressing the absolute residuals on the fitted values is a quick check with no extra packages. A significant slope means the spread grows or shrinks systematically. Here the slope is small and clearly not significant, so there is no evidence of a problem.

**The fix, if there is one.** Heteroscedasticity-consistent standard errors are usually the least disruptive answer. Your point estimates do not change; only the standard errors do, which is exactly what was wrong.

### The rest of Group 1

**"Observations are not independent."** The most serious assumption objection, because it cannot be fixed with a robust standard error if the structure is substantial. If you have repeated measures, students within schools, or patients within hospitals, the reviewer is usually right and the answer is a mixed model.

**"Residuals are autocorrelated."** The time series version of the same problem. Check with an autocorrelation plot of the residuals.

**"Multicollinearity was not examined."** Report variance inflation factors. Note that collinearity inflates standard errors but does not bias coefficients, so if your predictors are still significant, collinearity has not hurt you.

**"Linearity was assumed, not shown."** Plot residuals against each continuous predictor. A curve means you need a transformation or a spline.

**"The proportional hazards assumption was not tested."** For Cox models. Test it, and if it fails, consider a time-varying coefficient or a stratified model.

## Group 2: Is the design sound?

Harder, because these usually cannot be fixed after data collection. The honest-disclosure answer matters most here.

Five objections: no power analysis, unaddressed confounding, baseline differences, selection bias, and non-comparable controls.

The important thing about this group is that a well-written limitation is a perfectly acceptable response. Reviewers are far more forgiving of a clearly stated limitation than of a paper that pretends the issue does not exist. What they will not accept is silence.

**On power analysis specifically.** If you did not do one in advance, do not compute observed power after the fact. Post-hoc power calculated from your observed effect is a deterministic function of your p-value and adds no information. Instead, report the confidence interval and discuss what effect sizes your study could and could not have detected.

## Group 3: Did you go fishing?

The most uncomfortable group, because the subtext is a question about your integrity. Six objections: multiple comparisons, unplanned subgroups, borderline p-values, pre-registration, dichotomising continuous variables, and outlier removal.

Answer these plainly and without defensiveness. Reviewers are not accusing you of misconduct; they are doing their job.

### "Multiple comparisons were not corrected"

```r
p <- c(0.011, 0.023, 0.041, 0.049, 0.180)
round(p.adjust(p, method = "holm"), 3)
#> [1] 0.055 0.092 0.123 0.123 0.180
```

Four of the five original p-values were below 0.05. After the Holm correction, none are. This is the honest arithmetic, and if this is your situation the correct response is to revise the claims, not to argue for leaving the correction out.

If the tests were genuinely planned in advance and address separate questions, a correction may not be required, and you can say so. But that argument only works if it is true.

### The rest of Group 3

**"This looks exploratory."** If it was exploratory, say so and label it that way. An honestly labelled exploratory analysis is publishable. A disguised one that gets caught is much worse than the alternative.

**"p = 0.049 is treated as a finding."** Report the effect size and interval and let them carry the argument, rather than the threshold.

**"Why was a continuous variable dichotomised?"** Median splits throw away information and can create spurious findings. If there is a clinical or regulatory cutpoint, cite it. If it was for convenience, the honest answer is to re-run the analysis with the continuous variable.

**"Outliers were removed without justification."** State the rule you used, confirm it was decided before you saw the results if that is true, and report the analysis both with and without exclusions.

## Group 4: Did you report it properly?

The fastest group to resolve. Five objections: missing effect sizes, missing confidence intervals, calling a null result a trend, missing fit statistics, and undescribed missing data.

### "You report p-values without effect sizes"

```r
res <- t.test(mpg ~ am, data = mtcars)
res$p.value
#> [1] 0.001373638
res$conf.int
#> [1] -11.280194  -3.209684
#> attr(,"conf.level")
#> [1] 0.95
```

The p-value tells you the difference is unlikely to be zero. The interval tells you the difference is somewhere between about 3.2 and 11.3 miles per gallon, which is what a reader actually needs. Report both, and lead with the interval.

**On "a trend toward significance."** A p-value of 0.08 is not a trend. It is a result whose interval includes no effect. Rewrite the sentence to report the estimate and interval and describe the finding as inconclusive. Reviewers pick this up almost every time.

## Group 5: Is the model right?

The most technical group. Six objections: wrong test for the data type, mixed models, link function choice, zero-inflation, overfitting, and untested interactions.

The one worth singling out is the last, because it is a genuine logical error rather than a judgement call.

**"An interaction is claimed without testing the interaction term."** If the effect is significant in men and not in women, that does not establish that the effect differs by sex. Those are two separate tests, and the comparison you are implicitly making is a third. Fit the interaction term and report it. Quite often it is not significant, and the claim has to be softened.

## Group 6: Can anyone check this?

**"Code and data are not available."** Increasingly common and increasingly non-negotiable at many journals. Deposit the analysis script and, where ethics permit, the data. If the data cannot be shared, say why and share the code anyway.

This is also the cheapest objection to prevent. An analysis written as a script from the start is reproducible by construction.

## Frequently asked questions

### Can I disagree with a reviewer?

Yes, with reasons and a citation. Reviewers are not always right, and editors do not expect authors to comply with every comment. What they expect is that you engage with it. An unanswered comment is far more damaging than a reasoned disagreement.

### What if the reviewer is right and it breaks my result?

Report it. The reanalysis, the changed conclusion, and a clear account of what happened. This is unpleasant and it is also the job. A result that only survives an analysis you now know to be wrong was never a result.

### Should I re-run everything the reviewer suggests?

Run the check. Whether you adopt their preferred analysis depends on what the check shows. It is entirely reasonable to write "we conducted the suggested analysis and it produced substantively identical results, so we have retained the original approach for consistency with prior work in this area," and to include the alternative in a supplement.

### How much detail belongs in the response letter versus the manuscript?

The letter carries the reasoning and points to the manuscript. The manuscript carries the change. Reviewers read the letter to decide whether to look, so the letter needs enough detail to be convincing on its own, with a pointer to where the change lives.

### The reviewer used a term I do not recognise. What now?

Look it up before responding, because the terminology often maps to something you already did under a different name. Heteroscedasticity, non-constant variance, and unequal error variance are the same objection.

## Summary

Reviewer statistics comments come from a short list. Triage them into substantive objections, reporting requests, and preferences, and spend your effort accordingly.

For each substantive objection, run the check, work out which of the three outcomes you are in, and answer with the same four-part structure: restate the concern, say what you did, say what it means for the conclusion, and say where it now appears.

The single most common mistake is answering the statistical question and never answering the question the reviewer actually cares about, which is whether the conclusion still holds.

The second most common is silence on a point you cannot fix. A clearly written limitation is a normal part of a published paper. An unaddressed comment is a reason for rejection.
