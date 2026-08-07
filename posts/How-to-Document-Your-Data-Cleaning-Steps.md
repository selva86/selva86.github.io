---
title: "How to Document Your Data Cleaning Steps"
slug: How-to-Document-Your-Data-Cleaning-Steps
description: "A reviewer never sees your data cleaning, only the analysis dataset. Document each step as a script, account for every dropped row, and report what changed."
keywords: "how to document data cleaning steps, documenting data cleaning, data cleaning documentation, data cleaning audit trail, reproducible data cleaning, sample size accounting, reporting exclusion criteria"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 2
handbook_chapter: 9
auto_link_terms: document data cleaning|data cleaning steps|documenting data cleaning|data cleaning script|sample size accounting|raw-to-analysis pipeline
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Between the file your instrument or survey produced and the dataset you finally modelled, rows were dropped, values recoded, and variables derived. A reviewer never sees that gap, and neither does the version of you who reopens the project a year later. Documenting your data cleaning means writing those steps as code that rebuilds the analysis dataset from the raw file, and reporting what each step did to the sample, so the difference between the two datasets is accounted for rather than assumed away.</p>

## The decision you are making

The cleaning has already happened by the time this chapter is useful. You have a raw file and an analysis file, and they are not the same: some rows are gone, a few columns are new, and some values have changed. Every one of those differences was a decision you made, and the decision this chapter is about is a separate one, made afterwards, about how much of that work to write down, in what form, and where it goes in the paper.

Two habits fail here, in opposite directions. The first is to record nothing, so the only trace of the cleaning is that the numbers in the analysis no longer match the raw file. A reviewer then cannot rebuild your dataset, and, worse for you, cannot tell whether a result rests on a defensible step or a convenient one. The second is to record it in prose alone, a single line in the Methods saying the data were cleaned and filtered. Prose drifts from what the code actually did, it cannot be rerun, and it usually leaves out the counts that would let anyone check it.

The spine of a good record is sample-size accounting: every row that left the dataset between collection and analysis is tied to a stated rule and a number. Trials formalise this as the CONSORT flow diagram, and observational studies as a STROBE participant count, and both ask for the number of cases at each stage rather than one figure at the end (Schulz et al., 2010; von Elm et al., 2007). The same logic serves any analysis, whether or not a diagram is required of you.

## What the options are

Documenting cleaning is really a few smaller choices, and each has a form a careful reader will accept and a form that invites the objection you were trying to head off. They are the same whatever produced the data.

| The choice | The version that gets caught | The version that holds up | Source |
|---|---|---|---|
| Where the record lives | One sentence in the Methods | A script that runs from the raw file to the analysis dataset, summarised by a short Methods paragraph | Sandve et al. (2013) |
| How exclusions are counted | A single "after cleaning, N = 110" | Rows in, rule applied, rows removed, rows out, at every step | STROBE item 13 (von Elm et al., 2007) |
| How each rule is justified | The rule stated with no reason | The rule with the reason it exists and the variable it acts on | Wilson et al. (2017) |
| When the rule was set | Left unsaid | Stated plainly as pre-specified or decided after seeing the data | Sandve et al. (2013) |
| Whether cleaning moved the result | The cleaned result on its own | The result with and without the discretionary steps | Sandve et al. (2013) |

Two of these rows are where credibility is actually won or lost. The first is the exclusion count, because a single "after cleaning, N = 110" hides whether the drop was mostly unavoidable, such as records with no outcome to model, or mostly discretionary, such as values you judged to be errors, and those two cases carry very different weight. Breaking the count out by step shows a reviewer at a glance which kind of dataset they are about to read.

The second is timing. A rule chosen before you saw the data and a rule chosen after it are held to different standards, because a rule invented once the results are in view is one of the quiet ways an analysis becomes exploratory without admitting it (Sandve et al., 2013). Stating which is which costs a clause and removes a whole class of suspicion, whereas saying nothing invites the reader to assume the less flattering answer.

## How to decide

The record almost writes itself if you build the analysis dataset as a sequence of filters that each report what they removed, instead of one call that silently returns the final rows. Take `airquality`, built into R, and suppose the analysis is a regression of ozone on temperature. Three steps stand between the raw data and the model, so apply them one at a time and log the count after each.

```r
raw <- airquality
analysis <- raw
log <- data.frame(step = "0. raw data as collected", n = nrow(analysis), removed = 0L)

# an ozone model needs an ozone reading
keep <- !is.na(analysis$Ozone)
log  <- rbind(log, data.frame(step = "1. drop missing outcome (Ozone)", n = sum(keep), removed = sum(!keep)))
analysis <- analysis[keep, ]

# the model also uses solar radiation
keep <- !is.na(analysis$Solar.R)
log  <- rbind(log, data.frame(step = "2. drop missing predictor (Solar.R)", n = sum(keep), removed = sum(!keep)))
analysis <- analysis[keep, ]

# treat an ozone reading above 150 ppb as a suspected sensor error
keep <- analysis$Ozone <= 150
log  <- rbind(log, data.frame(step = "3. drop Ozone > 150 (suspected error)", n = sum(keep), removed = sum(!keep)))
analysis <- analysis[keep, ]

log
#>                                    step   n removed
#> 1              0. raw data as collected 153       0
#> 2       1. drop missing outcome (Ozone) 116      37
#> 3   2. drop missing predictor (Solar.R) 111       5
#> 4 3. drop Ozone > 150 (suspected error) 110       1
```

Read the table as a reviewer would. The dataset starts at 153 daily records and ends at 110, and the accounting says exactly where the other 43 went. The 37 dropped for a missing ozone reading are unavoidable, since a record with no outcome cannot enter an ozone model, and the 5 dropped for missing solar radiation follow directly from the choice of predictors. Step 3 is different in kind: deciding that an ozone reading above 150 is a sensor error rather than a real value is a judgement, and the threshold is one you picked. When an extreme value is safe to remove at all is a question of its own, covered in [Outlier Removal in Peer Review](/Outlier-Removal-in-Peer-Review.html); what the record has to make plain is that this one row went for a discretionary reason and not a structural one.

Because that step is discretionary, the count alone will not settle it, and the way to defend it is to show what dropping the row did to the answer. Fit the temperature model with and without the excluded day.

```r
kept   <- subset(airquality, !is.na(Ozone) & !is.na(Solar.R))
before <- lm(Ozone ~ Temp, data = kept)
after  <- lm(Ozone ~ Temp, data = analysis)
compare <- rbind(with_the_dropped_day    = coef(summary(before))["Temp", c("Estimate", "Std. Error")],
                 without_the_dropped_day = coef(summary(after))["Temp",  c("Estimate", "Std. Error")])
round(compare, 3)
#>                         Estimate Std. Error
#> with_the_dropped_day       2.439      0.239
#> without_the_dropped_day    2.401      0.212
```

The temperature slope moves from 2.439 to 2.401, and its standard error, if anything, falls slightly, from 0.239 to 0.212, so the one discretionary exclusion changes neither the size of the association nor its precision in any way that matters. That comparison is what lets you write, truthfully, that the result holds whether the row stays or goes. Had the slope instead halved when the row came out, the same record would have done its job in the other direction, by telling you the conclusion rested on a single judgement call and could not be reported without that caveat. Rebuilding this whole sequence from the raw file so anyone can rerun it is what tools like [renv and git](/Reproducibility-with-renv-and-git.html) and [targets](/Reproducible-Pipelines-with-targets.html) exist to make routine.

## What reviewers will ask about this later

A complete cleaning record does not end the questions, it changes which ones you are able to answer. The most common follow-up is about the rows you dropped: if the excluded records differ systematically from the ones you kept, what remains is a selected sample, and the objection arrives as [Selection Bias in Peer Review](/Selection-Bias-in-Peer-Review.html). Where the exclusions were specifically values you called outliers, the challenge is narrower and sharper, and it is answered in [Outlier Removal in Peer Review](/Outlier-Removal-in-Peer-Review.html).

Two more track the form of the record itself. If the cleaning left gaps, by dropping incomplete records rather than modelling around them, a reviewer will want the extent and handling of that missingness described, which is [Missing Data Reporting in Peer Review](/Missing-Data-Reporting-in-Peer-Review.html), and whether dropping those rows was even legitimate depends on the mechanism set out in [Missing Data Types in R: MCAR, MAR, MNAR](/Missing-Data-Types-in-R-MCAR-MAR-MNAR.html). If any exclusion rule was decided after the data were in, expect to defend the analysis as planned rather than fished, the distinction drawn in [Exploratory vs Confirmatory Analysis in Peer Review](/Exploratory-vs-Confirmatory-Analysis-in-Peer-Review.html). And the script that produced all of it is itself something reviewers increasingly ask to see, covered in [Code and Data Sharing in Peer Review](/Code-and-Data-Sharing-in-Peer-Review.html).

## How to report it

The record lives in two places at once. The full script, the one that turns the raw file into the analysis dataset, belongs in a supplement or a repository where it can be rerun. The Methods gets the summary: the starting number, the exclusions with their reasons and counts, the final number, and a line on whether the rules were fixed in advance. For a trial that summary is the CONSORT flow diagram; for most other work a short paragraph carries it (Schulz et al., 2010). Here is the clean case, where every rule was set before modelling.

> Of 153 daily records, 37 were excluded for a missing ozone measurement and 5 for missing solar radiation, leaving 111. One further record with an ozone value above 150 ppb, flagged in advance as a likely instrument error, was removed, giving an analysis sample of 110. All exclusion rules were specified before modelling. The script that reproduces the analysis dataset from the raw file is available at [repository].

The harder case is the one where a rule was decided after you had seen the data, and the honest move is to say so and then show that it did not rescue the result.

> During analysis we noticed one ozone reading inconsistent with the surrounding week's values and removed it; this exclusion was not pre-specified. The temperature association was 2.40 (SE 0.21) with the reading removed and 2.44 (SE 0.24) with it retained, so the reported conclusion does not depend on the exclusion. Both versions are provided in the supplement.

Neither paragraph argues that the cleaning was harmless in the abstract; each hands the reader the counts and, where it matters, the comparison to judge for themselves. A Methods section that reports its own discretionary steps and their consequences gives a reviewer far less to be suspicious of than one that presents a clean final N with no visible seams. When the Methods carries the stage-by-stage counts and the timing of each rule, and the repository carries the script that regenerates the dataset, a reader can retrace the whole path from raw file to result without having to ask you for anything.
