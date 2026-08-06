---
title: "Multiple Comparisons in Peer Review"
slug: Multiple-Comparisons-in-Peer-Review
description: "A reviewer asked you to correct for multiple comparisons. What the objection means, how to check it in R with p.adjust, and how to word your response."
keywords: "correct for multiple comparisons, multiple comparisons not corrected, adjust for multiple testing, p.adjust in R, Bonferroni correction reviewer, family-wise error rate, multiple comparisons peer review"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 43
auto_link_terms: correct for multiple comparisons|multiple comparisons objection|multiplicity in peer review|multiple comparisons not corrected|adjusting for the number of tests
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A reviewer asking you to correct for multiple comparisons is not disputing any single result. They are pointing out that running many tests inflates the chance of a false positive, and asking you to account for it. This chapter shows how to check whether your findings survive a correction in R, and how to word the response for each outcome.</p>

This is one of the objections that reads as an accusation even when it is not meant as one. The reviewer is doing their job, and the good news is that the check takes a minute and the answer is often reassuring. Work out where you stand first, then reply.

## What the reviewer wrote

The comment usually arrives in one of these forms.

> The authors report a number of comparisons but do not appear to adjust for multiplicity. Some correction for the number of tests would strengthen confidence in the results.

> With this many tests, some of these p-values will be significant by chance. Please correct for multiple comparisons.

> The methods are generally clear, though I would ask the authors to clarify the handling of missing covariates in Table 2, and separately, whether any adjustment was made for the multiple outcomes tested, since several borderline p-values are reported without it.

## What they actually mean

The reviewer is not disputing any individual test. They are saying that once you run many tests, the chance that at least one significant result is a fluke rises with the number of tests, and your paper has not accounted for that. What they want is twofold: state how many tests the family contains, and either adjust the p-values for that count or justify why adjustment is not needed, for example because there was a single pre-specified primary outcome.

It is easy to read this as a demand to delete analyses or to make each result look stronger. It is neither. The ask is accounting, not deletion, and a finding that was always going to survive the correction survives it whether or not the reviewer asked.

## Why they are asking

Every significance test carries a small chance of a false positive, conventionally five percent. Run one test and that is the risk. Run eight independent tests and the chance that at least one comes back significant purely by chance is 1 - 0.95^8, about 0.34. Report only the significant ones and you can end up with a result that looks convincing and is noise. The concern is not that any particular test is wrong, it is that the number of tests changes how much a single low p-value is worth.

The correction procedures themselves, and how to choose among them, are covered in [Multiple Testing in R](Multiple-Comparisons-in-R.html). This chapter is about whether your result survives one.

## How to check it

The check has two steps: count the tests in the family, then adjust the p-values for that count. Below are eight tests from a single dataset, each asking whether `mpg` is associated with another variable in `mtcars`.

```r
# Eight tests from one analysis: does mpg correlate with each other variable?
vars  <- c("cyl", "disp", "hp", "drat", "wt", "qsec", "gear", "carb")
raw_p <- sapply(vars, function(v) cor.test(mtcars$mpg, mtcars[[v]])$p.value)
round(raw_p, 4)
#>    cyl   disp     hp   drat     wt   qsec   gear   carb 
#> 0.0000 0.0000 0.0000 0.0000 0.0000 0.0171 0.0054 0.0011 
sum(raw_p < 0.05)
#> [1] 8
```

All eight raw p-values are below 0.05, and the family has eight members, which is the exact situation the reviewer is flagging. `p.adjust` does the arithmetic. The only real decision is which method, and the 0.05 line they are judged against is a convention, not a law. Bonferroni multiplies each p-value by the number of tests and is the strictest. Holm controls the same error rate with more power (Holm, 1979). Benjamini-Hochberg controls a more lenient quantity, the false discovery rate (Benjamini and Hochberg, 1995), and is the usual choice when the family is large.

## What to do about it

Apply the correction and read the table.

```r
holm <- p.adjust(raw_p, method = "holm")
bonf <- p.adjust(raw_p, method = "bonferroni")
round(data.frame(raw = raw_p, holm = holm, bonferroni = bonf), 4)
#>         raw   holm bonferroni
#> cyl  0.0000 0.0000     0.0000
#> disp 0.0000 0.0000     0.0000
#> hp   0.0000 0.0000     0.0000
#> drat 0.0000 0.0001     0.0001
#> wt   0.0000 0.0000     0.0000
#> qsec 0.0171 0.0171     0.1367
#> gear 0.0054 0.0108     0.0432
#> carb 0.0011 0.0033     0.0087
```

### You are fine

If your headline result is one of the strong associations, the correction is a non-event. The association between `mpg` and `wt` has an adjusted p-value of 0.0000 under both Holm and Bonferroni, unchanged from the raw value to four decimal places. A result that low was never at risk from eight tests. Report the adjusted value beside the raw one so the reader can see it held.

### It is fixable

Most of the time the fix is to report adjusted p-values instead of raw ones and to state the family size. Across all eight tests, Holm leaves every association significant: the weakest, `gear`, moves from 0.0054 to 0.0108, still well under 0.05. You have not retracted anything, you have shown the results hold after accounting for the number of tests. Choosing Holm over Bonferroni here is defensible rather than convenient, because Holm controls the same family-wise error rate and is uniformly more powerful (Holm, 1979).

```r
names(which(bonf < 0.05))   # survive even the strict Bonferroni correction
#> [1] "cyl"  "disp" "hp"   "drat" "wt"   "gear" "carb"
```

### It is a real problem

Sometimes a result you reported as significant does not survive. Here `qsec` is the fragile one. Its raw p-value is 0.0171, but Bonferroni pushes it to 0.1367, and it clears 0.05 under Holm only because it is the largest p-value in the set, which Holm leaves unmultiplied. A finding whose significance depends on which correction you pick is thin evidence, and the honest response is to stop presenting it as confirmed. Describe it as exploratory, soften the claim in the abstract, and let the strong findings carry the paper. If `qsec` had been your primary outcome, that is a genuine problem no wording can fix, and the correct move is to report that the study did not establish it.

## How to word your response

Each response restates the concern, says what you did, says what it means for the conclusion, and says where it now appears. Use a placeholder for the location and fill it in.

*You are fine:*

> The reviewer is right that we tested eight associations and initially reported unadjusted p-values. We have applied a Holm correction across the full family of tests. Our primary result, the association between weight and fuel economy, is unchanged (adjusted p < 0.001), as are the other principal associations. The adjusted p-values are now reported in Table 2 (Results, page X).

*It is fixable:*

> We thank the reviewer for raising this. We corrected all eight comparisons using the Holm procedure, which controls the family-wise error rate. Every association that was significant before correction remains significant after it, the weakest at an adjusted p of 0.011. The family size and the adjusted p-values have been added to the Methods and to Table 2 (Methods, page X; Results, page X).

*It is a real problem:*

> The reviewer is correct that we did not account for the number of tests, and one of our reported associations does not survive that accounting. After correction, the association between elapsed quarter-mile time and fuel economy no longer reaches significance (adjusted p = 0.14, Bonferroni). We have removed this claim from the abstract and now present it in the Results as an exploratory observation that requires confirmation (Results, page X).

## Practice

A reviewer writes:

> The authors compare automatic and manual transmissions across six different measures and report four as significant. No adjustment for the six comparisons is mentioned.

Run this block, then decide which of the three outcomes applies. It prints nothing; inspect `ex_p` and `ex_adj` yourself.

```r
ex_vars <- c("mpg", "hp", "wt", "qsec", "disp", "drat")
ex_p    <- sapply(ex_vars, function(v) t.test(mtcars[[v]] ~ mtcars$am)$p.value)
ex_adj  <- p.adjust(ex_p, method = "holm")
```

<details>
<summary>Show solution</summary>

Four of the six comparisons are significant before any correction: mpg (0.0014), wt (0.0000), disp (0.0002), and drat (0.0000). The reviewer's count is right, and the reflex is to weaken the claims. Applying a Holm correction shows that reflex is wrong. All four survive: mpg becomes 0.0041, wt stays 0.0000, disp 0.0009, drat 0.0000. The two that were never significant, hp and qsec, remain non-significant after correction (adjusted p = 0.4187 each).

This is the "you are fine" case. Report the adjusted p-values and the family size, state that every significant comparison holds after correction, and leave the conclusions unchanged. The number of comparisons was the reviewer's worry, but none of the four significant results crossed back over 0.05 after adjustment, so nothing in the paper needs to change.

</details>
