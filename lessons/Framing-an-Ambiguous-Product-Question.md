---
title: "Product Sense and Metric Diagnosis Lesson 1: Framing an Ambiguous Product Question"
catalog_blurb: "Turn a vague product question into a measure you can actually decide on."
description: "Maria asks if the new ranked feed is working, and three numbers disagree. Learn to frame it as a population, a measure, a comparison, and a decision rule."
keywords: "product sense, metric diagnosis, ambiguous product question, population definition, primary metric, guardrail metric, novelty effect, decision rule, OEC, before and after comparison, product data science"
post_type: "LESSON"
curriculum_id: "3.10.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "pds-sense"
course_title: "Product Sense and Metric Diagnosis"
course_lesson: "1"
course_total: "6"
course_landing: "Product-Sense-and-Metric-Diagnosis-Course.html"
course_next: "Metric-Drop-Diagnosis.html"
course_prev: ""
---

=== step === cover
## Framing an Ambiguous Product Question

Today let's work out what to do when a question sounds simple, but the numbers meant to answer it keep disagreeing with each other.

Loopline is a photo sharing app with 1,200,000 weekly active users. It just replaced its chronological Home feed, the one that showed friends' posts in the order they were posted, with a feed that ranks posts algorithmically, picking what each user is likely to engage with first. The change went out to 100% of users on both iOS and Android.

Three weeks later, the Head of Product, Maria, asks a question that sounds simple: is the new feed working?

That question cannot be answered yet. Not because the data is missing, but because the question itself is unfinished: four things need to be decided before any number can answer it.

Here are those four decisions, one at a time.

::widget process-flow {"steps":[{"title":"The question","sub":"Is the new feed working?"},{"title":"Population","sub":"exactly who counts, and over what window"},{"title":"Measure","sub":"the one number that stands for working"},{"title":"Comparison","sub":"working, compared to what"},{"title":"Decision rule","sub":"the number that would change what you do"}]}

Each one of those four boxes gets its own answer next, in the order they are drawn above.

=== step === concept
## Why one question gets three different answers

Maria did not come empty handed. She pulled three numbers, measured across all of Loopline's active users, comparing the three weeks before the ranked feed launched against the three weeks after.

The first is weekly active users, WAU for short: how many distinct users opened the app at least once in a week. It fell from 1,200,000 to 1,170,000, down 2.5%.

The second is average session time: how many minutes a user spends in the app per visit. It rose from 4.00 to 4.40 minutes, up 10.0%.

The third is posts per user per week: how many photos the average user posts. It fell from 3.00 to 2.76, down 8.0%.

Here are all three side by side, with each one's change computed directly in R.

```r
# Compare how three raw numbers moved after the ranked feed launched
library(dplyr)

naive_metrics <- tribble(
  ~metric,                   ~before,  ~after,
  "Weekly active users",     1200000,  1170000,
  "Avg. session time (min)", 4.00,     4.40,
  "Posts per user per week", 3.00,     2.76
)

naive_metrics <- naive_metrics |>
  mutate(
    pct_change = round((after - before) / before * 100, 1),
    change = sprintf("%+.1f%%", pct_change)
  )

naive_metrics |>
  select(metric, change)
#> # A tibble: 3 × 2
#>   metric                  change
#>   <chr>                   <chr> 
#> 1 Weekly active users     -2.5% 
#> 2 Avg. session time (min) +10.0%
#> 3 Posts per user per week -8.0% 
```

WAU fell, which looks bad. Session time rose, which looks good. Posts per user per week fell, which looks bad again. So the same launch produced one clear improvement and two declines, and "is it working" does not have one answer yet. It has three, and they disagree.

=== step === concept
## The four questions that turn a question into an analysis
::prose-only the four terms are defined here with no numbers yet; Loopline's own numbers start filling them in from the next step

Before going further with Loopline's numbers, it helps to name the four decisions plainly.

- Population: exactly who counts, and over what window of time.
- Measure: the one number that stands in for "working".
- Comparison: working, compared against what.
- Decision rule: the result that would actually change what the team does next.

Loopline's three disagreeing numbers all come from skipping past these four decisions. Each one gets made for Loopline next, starting with population.

=== step === concept
## Population: deciding exactly who counts

WAU fell from 1,200,000 to 1,170,000 for a reason that has nothing to do with whether the new feed works. Of the 1,170,000 users active after launch, 150,000 signed up in the three weeks since the feed went out, so they have no "before" period to compare against at all.

A clean before and after comparison needs the same people on both sides. So the population narrows to the 1,020,000 users who were active in both the three weeks before launch and the three weeks after, with staff and test accounts excluded.

There is one more adjustment to make. Weekly active users cannot be computed meaningfully on a population that is fixed to exactly the people active in both windows, because every one of them is active in both weeks by definition, so WAU would just restate the population size, 1,020,000, twice. In its place, the table below uses sessions per user per week: how many separate times a user opens the app in a week, a number that can still rise or fall even inside a fixed population.

Recomputing the three measures on just that 1,020,000 user population gives a different picture.

```r
# Recompute the same three measures on the 1,020,000-user defined population
library(dplyr)

defined_pop_metrics <- tribble(
  ~metric,                     ~before, ~after,
  "Sessions per user per week", 5.00,   4.90,
  "Avg. session time (min)",    4.00,   4.36,
  "Posts per user per week",    3.00,   2.67
)

defined_pop_metrics <- defined_pop_metrics |>
  mutate(
    pct_change = round((after - before) / before * 100, 1),
    change = sprintf("%+.1f%%", pct_change)
  )

defined_pop_metrics |>
  select(metric, change)
#> # A tibble: 3 × 2
#>   metric                     change
#>   <chr>                      <chr> 
#> 1 Sessions per user per week -2.0% 
#> 2 Avg. session time (min)    +9.0% 
#> 3 Posts per user per week    -11.0%
```

Session count and session time both still move: sessions down 2.0%, session time up 9.0%. But look at posts per user per week. Computed over all 1,170,000 active users, it fell 8.0%. Computed over just the 1,020,000 users present in both windows, it falls 11.0%, a bigger drop than before.

=== step === widget
## Watching the verdict change with the population you pick

Try switching between the two populations below and watch what happens to posts per user per week.

::widget dashboard-layout {"filterLabel":"Population","views":{"All 1,170,000 active users":{"boxes":[["WAU","-2.5%"],["Avg. session time","+10.0%"],["Posts per user per week","-8.0%"]]},"1,020,000 users active in both windows":{"boxes":[["Sessions per user per week","-2.0%"],["Avg. session time","+9.0%"],["Posts per user per week","-11.0%"]]}}}

Switching to the full 1,170,000 user population lifts posts per user per week from -11.0% back up to -8.0%. The difference comes from the 150,000 new users counted only in that larger group. Freshly signed up users tend to post more in their first few weeks, a pattern called the novelty effect, so folding them in drags the average up and hides some of the decline.

So the same three weeks read as an 8.0% drop or an 11.0% drop, depending only on which population the measure is computed over. Neither number is wrong. They are answers to two different questions.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Sessions per user per week is simply easier to compute than WAU. ::no Not quite, the choice has nothing to do with ease of computation.
- Because every one of the 1,020,000 users is active in both windows by definition, their WAU cannot move, so the table swaps in sessions per user per week, a number that still can. ::ok Right. The population is now fixed to exactly the users present in both windows, so counting how many of them are active just restates the population size, 1,020,000 either way. Sessions per user per week can still rise or fall, so that is the number that goes in the table instead.
- WAU before launch does not exist for a population defined only after launch. ::no Not quite, the 1,020,000-user population is defined as active in both the three weeks before launch and the three weeks after, so a before-launch WAU for them does exist.
- WAU is still the clearest number to watch, so the table should have kept it. ::no Not quite. The population is now fixed to exactly the users present in both windows, so their WAU is just the population size restated, 1,020,000 either way, and it cannot register any change. Sessions per user per week still can, which is why the table uses that instead.

=== step === concept
## Measure: picking the one number that stands for working

Population is settled: the 1,020,000 users active in both windows. Next comes measure, the one number the team agrees stands in for "the feed is working".

Loopline's business depends on users posting as well as consuming: without new posts, there is nothing for the ranked feed to rank. So the team sets posts per user per week as the primary measure.

Average session time becomes a guardrail instead, a number watched for damage rather than chased for its own sake. The reason is specific: if the ranked feed made content harder to scan, session time could rise because people are struggling to find what they want, not because they are enjoying it more. A rise in session time caused by that would be a false positive for "working".

::prose-only the primary measure and its guardrail, each with the one-sentence reason behind it

- Primary measure: posts per user per week, because Loopline needs people posting, not only scrolling.
- Guardrail: average session time, because a rise caused by friction, not enjoyment, would be a false positive.

=== step === concept
## Comparison: working compared to what

Measure is settled: posts per user per week, with session time as a guardrail. Comparison asks what that after-launch number should be read against.

- Before versus after, for the same users: the three weeks before launch against the three weeks after, for the same 1,020,000 people. This is what the team uses.
- Year over year: the same three weeks compared against the same calendar weeks a year earlier. This would avoid the before and after mix-up, but drags in a whole year of unrelated product changes instead.
- A randomised holdout: part of the population kept on the old feed as a control group. This did not happen here, because the feed shipped to 100% of users at once.

Because the comparison is before versus after on the same users, with no holdout group, anything else that changed inside those three weeks, a different season, a competitor's app update, a holiday, gets credited to the feed as well. The team accepts that limitation and moves on, because by the time Maria asked her question, the feed was already live for everyone.

=== step === concept
## Decision rule: the number that would change what you do

Comparison is settled: the same users, before versus after. The last decision is the one teams skip most often: agreeing, before the result comes in, what result would actually change what happens next.

Before the three weeks ran, the team wrote down a decision rule for posts per user per week in the defined population: roll back if it falls more than 5%, iterate if it falls somewhere between 0% and 5%, and keep the feed if it holds flat or rises.

The defined population's actual result was a fall of 11.0%. Here is that result checked against the rollback line.

```r
# Compare the measured change against the rollback line agreed before launch
library(dplyr)

rollback_threshold <- -5.0

measured_change <- defined_pop_metrics |>
  filter(metric == "Posts per user per week") |>
  pull(pct_change)

measured_change
#> [1] -11

action <- if (measured_change < rollback_threshold) "roll back" else "keep"
action
#> [1] "roll back"
```

Minus 11.0% is past minus 5%, so the rule says roll back. Not iterate, not keep watching: roll back, and go find out why posts fell.

=== step === widget
## Writing the framing as the first page of the analysis

All four decisions are made now: population, measure, comparison and decision rule. Before running any further analysis, the team writes them down as a one-page brief, the kind anyone could open later and understand without asking a single question.

Here is what that brief looks like.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Ranked Home Feed, the framing\nformat: html"},{"type":"prose","text":"## Summary\n\nPopulation: 1,020,000 users active in both the three weeks before launch and the three weeks after, excluding staff. Measure: posts per user per week as primary, average session time as a guardrail. Comparison: the same users, their three weeks before versus their three weeks after. Decision rule: roll back if posts per user per week falls more than 5%."},{"type":"code","text":"defined_pop_metrics |>\n  ggplot(aes(metric, pct_change)) +\n  geom_col()","chart":[{"x":"Sessions per week","y":-2.0},{"x":"Session time","y":9.0},{"x":"Posts per user per week","y":-11.0}]}]}

Every number in that brief is already familiar: the population, the measure and its guardrail, the comparison, and the decision rule. Nothing in it is new. It is the four answers, collected in one place, before anyone reads another number.

=== step === quiz
## Quick check: framing the whole thing

Maria's original question, is the new feed working, produced three disagreeing numbers before any of the four decisions were made. The brief above is what answers it instead.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A bigger sample of users, so the percentage changes would be more precise. ::no Not quite, sample size was never the problem here.
- An agreed population, measure, comparison and decision rule, so the same launch could not be read three different ways. ::ok Right. The three numbers disagreed because no one had yet fixed who counts, which one number stands for working, what it is compared against, and what result would change the decision. Once those four things were written down, posts per user per week in the defined population, minus 11.0%, was the only number that mattered, and it was already past the agreed rollback line.
- A measure that happened to move in the direction the team wanted. ::no Not quite, picking whichever number looks best is the opposite of what the team did here.
- A significance test run on each of the three raw percentage changes. ::no Not quite. The three numbers disagreed because no one had yet fixed who counts, which one number stands for working, what it is compared against, and what result would change the decision, not because any of the three numbers needed a significance test.

=== step === tryit
## Your turn: apply the decision rule

The decision rule agreed for Loopline does not apply only to the 11.0% actually measured. It applies to any result that rule is checked against.

Suppose a different three week window had shown posts per user per week falling by 3.0% instead of 11.0%, still in the defined population. The code below sets up that new result and checks it against the rollback line, the same comparison used for the 11.0% result. Complete the second comparison, against the 0% keep line, the same way.

```r
# Apply the agreed decision rule to a new measured result: -3.0% in the defined population
rollback_threshold <- -5.0
keep_threshold <- 0.0
new_pct_change <- -3.0

below_rollback <- new_pct_change < rollback_threshold
below_rollback
#> [1] FALSE

below_keep <- NA
below_keep
#> [1] NA
```

Replace the NA with the same kind of comparison used for below_rollback, against keep_threshold instead. Press Check when you have it.

::check {"regex": "new_pct_change\\s*<\\s*(keep_threshold|0(\\.0+)?)", "gate": true, "difficulty": "intermediate", "ok": "Right. Minus 3.0% is not below the minus 5% rollback line, so below_rollback is FALSE. But it is below the 0% keep line, so below_keep is TRUE. Falling between the two lines is exactly what iterate means: the metric moved the wrong way, but not far enough to roll back.", "no": "Replace the NA with new_pct_change < keep_threshold, the same comparison the line above made against rollback_threshold."}
::solution
```r
# Apply the agreed decision rule to a new measured result: -3.0% in the defined population
rollback_threshold <- -5.0
keep_threshold <- 0.0
new_pct_change <- -3.0

below_rollback <- new_pct_change < rollback_threshold
below_rollback
#> [1] FALSE

below_keep <- new_pct_change < keep_threshold
below_keep
#> [1] TRUE
```

Minus 3.0% is not below the rollback line but is below the keep line, so it falls in between the two: iterate.

=== step === concept
## References
::prose-only the sources are text, not a visual

- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments](https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/D97B26382EB0EB2DC2019A7A7B518F59). Cambridge University Press. On choosing an OEC, the one measure a team commits to before a test runs, and the guardrail metrics that catch an unintended cost.
- Rodden, K., Hutchinson, H., and Fu, X. (2010). [Measuring the User Experience on a Large Scale: User-Centered Metrics for Web Applications](https://doi.org/10.1145/1753326.1753687). CHI 2010. The HEART framework for tying a measure to a real user goal rather than to whichever number moved.
- McClure, D. (2007). Startup Metrics for Pirates (the AARRR framework). On choosing which stage of a funnel, acquisition through referral, a measure actually represents.
- Doerr, J. (2018). [Measure What Matters](https://www.whatmatters.com/book). Portfolio. On setting one measurable goal and a decision rule for judging it, agreed before the result comes in.

=== step === complete
## What you now have before you touch any data

Maria's question, is the new feed working, could not be answered directly. It needed four decisions first, and now Loopline has all four.

- Population: the 1,020,000 users active in both the three weeks before launch and the three weeks after, excluding staff.
- Measure: posts per user per week as the primary measure, average session time as a guardrail.
- Comparison: the same users, their three weeks before against their three weeks after.
- Decision rule: roll back if posts per user per week falls more than 5%, which it did, at 11.0%, so the feed rolled back.

The next time a question like this lands on your desk, sounding simple but producing numbers that disagree, these are the four decisions to make before opening a single chart.
