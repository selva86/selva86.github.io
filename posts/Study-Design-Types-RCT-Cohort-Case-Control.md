---
title: "Study Design Types: RCT, Cohort, Case-Control"
slug: Study-Design-Types-RCT-Cohort-Case-Control
description: "Choosing between an RCT, cohort, or case-control study? How each study design fixes the effect measure you can report, what reviewers ask, and how to report it."
keywords: "study design types, RCT vs cohort vs case-control, choosing a study design, case-control odds ratio, cohort risk ratio, observational study design"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 1
handbook_chapter: 1
auto_link_terms: study design types|case-control study design|cohort study design|choosing a study design|RCT cohort case-control
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Three questions settle it before you collect anything: can you assign the exposure yourself, is the outcome rare, and is the exposure rare. If you can ethically randomize, a randomized trial gives the strongest causal claim; when the outcome is rare you reach for a case-control study, and when the exposure is rare you need a cohort. Whichever you choose fixes the effect measure you can report, so a case-control study commits you to an odds ratio rather than an absolute risk.</p>

## The decision you are making

You are choosing the architecture that connects an exposure to an outcome, and you are choosing it before the data exist. Sometimes the decision is retrospective instead: the study is already run and you have to name the design it actually was. That matters just as much, because a reviewer reads the design off your Methods section, not off your intentions.

The consequence that carries furthest is the ceiling it puts on your causal claim. Randomizing the exposure balances the confounders you know about and the ones you have never heard of, so a randomized trial can support a claim that the exposure caused the outcome. An observational design leaves that balancing to be argued and adjusted for afterwards, which is weaker, because you can only adjust for confounders you actually measured. And a design cannot be upgraded once the data are in: if you ran a case-control study, no model will turn it into evidence about how often the outcome occurs.

Most research questions cannot be randomized at all, for reasons of ethics, cost, or time, and that is not a weakness to hide. A well-run cohort or case-control study is the right tool for a question a trial cannot touch, as long as the paper claims what the design supports and nothing beyond it. The trouble starts when an observational result is written up in the confident causal language of a trial.

## What the options are

Five architectures cover almost every quantitative study, and they differ most on one axis: what you select your participants on.

| Design | You select on | Reasoning runs | Effect measure you can report | Strongest when | Causal strength |
|---|---|---|---|---|---|
| Randomized controlled trial | Assigned exposure (at random) | Exposure to outcome | Risk ratio, risk difference, mean difference | The exposure can be ethically assigned | Highest |
| Prospective cohort | Exposure | Exposure to outcome | Incidence, risk ratio, risk difference, hazard ratio | The exposure is rare, or you need absolute risk | Moderate |
| Retrospective cohort | Exposure (from records) | Exposure to outcome | Same as prospective cohort | Records already hold both exposure and outcome | Moderate |
| Case-control | Outcome | Outcome back to exposure | Odds ratio only | The outcome is rare or slow to appear | Moderate to low |
| Cross-sectional | Neither (a snapshot) | Association at one time | Prevalence, association | You need a snapshot, not a cause | Lowest |

The split between selecting on exposure and selecting on outcome drives everything downstream. A cohort starts with exposed and unexposed people and waits to see who develops the outcome, so it can count how often the outcome happens and report an absolute risk. A case-control study starts from people who already have the outcome plus a comparison group who do not, then looks back at their exposure. That is far cheaper for a rare outcome, but it discards the information needed to recover how common the outcome is.

The direction is visible in any case-control dataset. R ships one, `infert`, a study of infertility, where the number of cases and controls was set by the investigator rather than observed.

```r
table(case = infert$case)
#> case
#>   0   1 
#> 165  83 
```

Eighty-three cases were each matched to two controls, which is why the split is 83 against 165. Because the researcher fixed that ratio, nothing in this table estimates how common infertility is in any population. The design has already decided that the estimable quantity is a comparison of exposure between cases and controls, not a rate.

## How to decide

Work through four questions in order, and act on the first one that gives a hard answer.

1. **Can you assign the exposure, ethically and practically?** If you can, randomize. A trial removes confounding by design and needs the fewest assumptions to defend later. Most exposures fail this test, since you cannot randomly assign people to smoke, to a genotype, or to live through a flood.
2. **Is the outcome rare or slow?** For a one-in-a-thousand disease a cohort would have to follow tens of thousands of people for years to accumulate enough cases, whereas a case-control study begins with the cases already in hand and is far more efficient (Rothman, Greenland and Lash, *Modern Epidemiology*).
3. **Is the exposure rare?** Here the logic flips. An unusual occupational exposure or a rarely prescribed drug would barely show up among case-control controls, so you select on the exposure instead and run a cohort.
4. **Do you need absolute risk or incidence?** A prognostic or public-health claim, such as "8% of exposed people develop this within five years", requires a cohort or a trial. A case-control study cannot deliver it, and that limit is worth seeing directly rather than taking on trust.

Start from a full cohort of 2,000 people in which the disease really is three times as common among the exposed.

```r
pop <- matrix(c(90, 910, 30, 970), nrow = 2, byrow = TRUE,
              dimnames = list(exposure = c("exposed", "unexposed"),
                              outcome  = c("disease", "healthy")))
pop
#>            outcome
#> exposure    disease healthy
#>   exposed        90     910
#>   unexposed      30     970
risk_exposed   <- 90 / 1000
risk_unexposed <- 30 / 1000
round(c(risk_exposed    = risk_exposed,
        risk_unexposed  = risk_unexposed,
        risk_ratio      = risk_exposed / risk_unexposed,
        risk_difference = risk_exposed - risk_unexposed), 3)
#>    risk_exposed  risk_unexposed      risk_ratio risk_difference 
#>            0.09            0.03            3.00            0.06 
```

With the whole cohort in view every measure is available: a 9% risk in the exposed against 3% in the unexposed, a risk ratio of 3, and a risk difference of 6 percentage points. Now sample that same population the way a case-control study does. Keep every case, and take a 10% sample of the healthy, which is what you settle for when following the entire cohort is impractical.

```r
odds_ratio <- function(tab) (tab[1, 1] * tab[2, 2]) / (tab[1, 2] * tab[2, 1])
cc <- matrix(c(90, 91, 30, 97), nrow = 2, byrow = TRUE,
             dimnames = list(exposure = c("exposed", "unexposed"),
                             outcome  = c("disease", "healthy")))
round(c(cohort_OR = odds_ratio(pop), casecontrol_OR = odds_ratio(cc)), 3)
#>      cohort_OR casecontrol_OR 
#>          3.198          3.198 
cc_risk_exposed   <- 90 / (90 + 91)
cc_risk_unexposed <- 30 / (30 + 97)
round(c(casecontrol_risk_ratio = cc_risk_exposed / cc_risk_unexposed,
        true_risk_ratio        = risk_exposed / risk_unexposed), 3)
#> casecontrol_risk_ratio        true_risk_ratio 
#>                  2.105                  3.000 
```

The odds ratio comes out identical in the two designs, 3.198 either way, because the sampling fraction sits in both the top and the bottom of the ratio and cancels. The risk ratio does not survive the sampling: computed from the case-control table it reads 2.105 against a true value of 3.000, because fixing the number of controls destroyed the information about how common the disease is. So a case-control study can report an odds ratio and stand behind it, while that same study cannot report a risk or a risk ratio at all. The odds ratio approximates the risk ratio only when the outcome is rare, which is the very condition that makes a case-control design appropriate to begin with (Cornfield, 1951). The arithmetic of the odds ratio itself is covered in [Odds Ratios and Relative Risk in R](/Odds-Ratios-and-Relative-Risk-in-R.html).

## What reviewers will ask about this later

The design you commit to now decides which objection lands in review, so choosing a design is partly choosing which defence you will later have to write.

A randomized trial still draws fire. Reviewers check whether randomization actually balanced the arms, which surfaces as a [baseline imbalance](/Baseline-Imbalance-in-Peer-Review.html) comment, and whether the trial was large enough to detect the effect it claims, which is a [missing power analysis](/Missing-Power-Analysis-in-Peer-Review.html) question. Because randomization handles confounding in advance, that particular objection rarely appears against a trial.

A cohort's central vulnerability is [unadjusted confounding](/Unadjusted-Confounding-in-Peer-Review.html). Since exposure was not assigned, any difference in the outcome could be down to the ways the exposed and unexposed groups differ in the first place, and a reviewer will want to see that argued and adjusted for. If people dropped out over follow-up, expect a [selection bias](/Selection-Bias-in-Peer-Review.html) query about whether those who left differ from those who stayed.

Case-control studies attract the hardest design questions, and nearly all of them are about the controls. A reviewer will ask how the controls were selected and whether they came from the same source population as the cases, which arrives as [selection bias](/Selection-Bias-in-Peer-Review.html) and [non-comparable control groups](/Non-Comparable-Control-Groups-in-Peer-Review.html) comments. Because exposure is measured after the outcome is already known, recall bias is the other standing objection, since cases often remember past exposures more thoroughly than controls do.

A cross-sectional snapshot invites the reverse-causation question, because measuring exposure and outcome at the same moment cannot show which one came first. None of these objections can be answered by re-analysis once the data are collected, so the cheapest time to deal with them is now, while the design is still a choice.

## How to report it

State the design in plain words, and state it early. STROBE asks observational studies to present the key elements of the design near the start of the paper (item 4), and CONSORT asks trials to describe the trial design, such as parallel or factorial, together with the allocation ratio (item 3a). Naming the design in the first line of the Methods tells a reviewer what to expect and heads off the "what design is this?" comment before it is written.

Report the measure the design can support, and no other. A cohort or a trial reports risk ratios, risk differences, or incidence; a case-control study reports odds ratios; a cross-sectional study reports prevalence and associations. Reporting an absolute risk from a case-control study is the error the arithmetic above rules out, and a reviewer who knows the design will catch it immediately.

For a case-control study, describe how the controls were chosen and from what population, because that is the first thing a careful reviewer checks. For a cohort, report how many people were lost to follow-up and whether they differed from those retained. Then match the write-up to the relevant reporting checklist: CONSORT for trials, STROBE for cohort, case-control, and cross-sectional studies (von Elm et al., 2007). Two Methods sentences show the register:

> We conducted a matched case-control study. Cases were adults with a first diagnosis of the condition, ascertained from the regional registry between 2019 and 2022; two controls per case were sampled at random from the same registry's general attendee list, matched on age and sex. Exposure was determined from records predating diagnosis. We report adjusted odds ratios with 95% confidence intervals.

> We analysed a prospective cohort of 4,120 participants followed for a median of 6.2 years. Because exposure was not randomized, the primary model adjusted for the confounders pre-specified in the analysis plan, and we report risk ratios with 95% confidence intervals alongside the number of participants lost to follow-up.

Neither sentence argues a case; each states what was done and what will be reported. Both name the design, the source population, and the effect measure, which are the design elements a reviewer looks for first in an observational Methods section.
