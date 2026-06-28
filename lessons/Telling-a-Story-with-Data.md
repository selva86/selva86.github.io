---
title: "Communicate and Automate Lesson 2: Data Storytelling"
catalog_blurb: "Insight nobody understands changes nothing; make people act on yours."
description: "Lead with the answer: structure a short data story a busy reader acts on in 30 seconds, with an executive summary, the inverted pyramid, and one telling chart."
keywords: "data storytelling, executive summary, BLUF, lead with the answer, inverted pyramid, data communication, report structure, ggplot2 title, R, data analyst"
post_type: "LESSON"
curriculum_id: "2.9.2"
webr: true
lesson_access: "free"
course_id: "da-communicate"
course_title: "Communicate and Automate with R"
course_lesson: "2"
course_total: "3"
course_landing: "Communicate-Automate-Course.html"
course_next: "AI-Assisted-Analysis-in-R.html"
course_prev: "Reproducible-Reports-with-Quarto.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## Data Storytelling
In Lesson 1 you built a report that updates itself. It is correct, reproducible, and ignored. Priya ships hers every Monday to Dev, the regional manager. Dev opens twenty reports that morning and gives each about thirty seconds. He skims Priya's first paragraph, which describes how the data was pulled, glances at a table, and moves on. He never reaches the finding at the bottom, the one that needed a decision this week.

A correct report that nobody acts on has failed. This lesson is the other half of the job: structuring what you found so a busy reader gets it, and acts on it, in thirty seconds.

By the end of this lesson you will be able to:

- Explain why a report must lead with the answer instead of building up to it
- Structure a data story as the inverted pyramid: Answer, then Evidence, then Detail
- Write a one-paragraph executive summary: the finding, the number, and the recommended action
- Pick and title the single chart that carries your headline

**Prerequisites:** you can run R and load a package with `library()`, you have built a basic ggplot (data, then `aes()`, then a geom) in [The Grammar of Graphics](The-Grammar-of-Graphics.html), you know the dplyr verbs from [The dplyr Verbs](The-dplyr-Verbs.html), and you have a reproducible report from [Lesson 1](Reproducible-Reports-with-Quarto.html). Every new term is defined as it appears.

The widget below is the report we are building toward. Toggle between **Source (.qmd)** and **Rendered**, and notice it opens with the answer, not the setup.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Weekly sales: action at two stores\nformat: html"},{"type":"prose","text":"## The bottom line\n\nChain revenue fell for the third week running, to $31k from a $34.6k peak. Almost the entire drop is two suburban stores, Riverside and Lakeside. Recommend a price check at both this week."},{"type":"code","text":"weekly |> ggplot(aes(week, revenue)) +\n  geom_col()","chart":[{"x":"W1","y":33.0},{"x":"W2","y":34.2},{"x":"W3","y":34.6},{"x":"W4","y":33.1},{"x":"W5","y":31.5},{"x":"W6","y":31.0}]}]}

=== step === concept
::eyebrow The problem
## Your reader is busier than you think

Here is the trap. You spent hours on the analysis, so you write it up the way you lived it: where the data came from, how you cleaned it, what you explored, and finally, at the end, what you found. That order is honest. It is also exactly backwards for the person reading it.

Dev does not want the journey, he wants the destination, fast, because he has nineteen more reports and a 9 a.m. meeting. If your single most important finding sits in the last paragraph, you are betting a whole week of work on him reading to the end. He will not.

[KEY INSIGHT]
The order you DID the analysis (data, then exploration, then conclusion) is the worst order to REPORT it. The reader, not the analysis, decides the order. Put what they need to act on first; everything else exists to support it.

So the question for the rest of this lesson is simple: what is the one thing Dev must know, and how do we get it in front of him in the first ten seconds?

=== step === concept
::eyebrow The principle
## Lead with the answer

The fix has a name borrowed from briefing rooms: **BLUF**, Bottom Line Up Front. State your conclusion and your recommendation in the very first sentence, before any setup. A report written this way reads as the analysis *reversed*: you worked bottom-up from data to a finding, but you present top-down from the finding back to the data.

Watch what that does to Priya's opening sentence:

| Opening | What Dev takes away in five seconds |
|---|---|
| **Buried:** "We pulled six stores of weekly sales and joined last week to compare trends across the chain..." | Nothing he can act on yet. He is still reading about your method. |
| **Answer-first:** "Revenue is down 10% over three weeks, and almost all of it is two stores. Recommend a check at Riverside and Lakeside this week." | The finding AND the action. He could forward this one sentence and be right. |

Same facts, same data, same honesty. The only thing that changed is what comes first.

[NOTE]
Leading with the answer is the right default, not an absolute law. A finding that is contested, political, or genuinely surprising sometimes needs you to build the case first so the reader trusts it, and a methods-focused audience (a journal reviewer, an auditor) may truly want the how before the what. For the everyday business report read by a busy decision-maker, lead with the answer.

=== step === quiz
::eyebrow Check yourself
## Which opening leads with the answer?

Priya has three candidate first sentences for her weekly report. Dev will read exactly one of them before deciding whether to keep going. Which one leads with the answer?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- "This report uses six stores of point-of-sale data, joined to the prior week and aggregated by location." ::no That is the method, not the finding. It tells Dev how you worked, not what he should do. Method belongs in the Detail layer at the bottom.
- "Revenue fell 10% over three weeks, driven by Riverside and Lakeside; recommend a price check at both this week." ::ok Exactly. The finding and the recommended action are in the first sentence. Dev knows what happened and what to do before reading anything else.
- "Note that two stores had partial data early in the period, so figures may shift slightly on the next refresh." ::no That is a caveat. Caveats are honest and belong in the report, but opening with a hedge guarantees the reader never reaches the finding. Lead with the answer, then qualify it.

=== step === concept
::eyebrow The shape
## The inverted pyramid

If the answer goes first, what goes next? Journalists solved this a century ago with the **inverted pyramid**: start with the single most important point, then add supporting detail in falling order of importance, so a reader can stop at any moment and still have the gist. A data story has three layers, in exactly that order.

::widget process-flow {"steps":[{"title":"Answer","sub":"the finding and the recommended action, in plain words"},{"title":"Evidence","sub":"the one chart that proves it, plus the key numbers"},{"title":"Detail","sub":"methods, the full table and caveats, read last"}]}

A reader who stops after the Answer still leaves knowing what to do. A reader who wants proof reads the Evidence. Only the rare reader who wants to audit your work reaches the Detail, and that is fine: you wrote it for them, but you did not make everyone else wade through it first.

=== step === concept
::eyebrow The top of the pyramid
## Write the executive summary

The Answer layer is one short paragraph called the **executive summary**, and a good one has exactly three ingredients:

1. **The finding** in plain language: revenue is sliding, and it is concentrated.
2. **The number** that sizes it: down about 10% over three weeks.
3. **The recommended action**: check Riverside and Lakeside this week.

A finding with no number is vague; a number with no recommendation is trivia. You need all three. Here is Priya's, in two sentences:

> Chain revenue has fallen for three straight weeks, down about 10% to $31k, and almost the entire drop comes from two stores. Recommend a focused price and promotion review at Riverside and Lakeside before the next refresh.

Where does "two stores" come from? From the data, not a hunch. Each lesson runs in a fresh R session, so we build this week's per-store numbers right here, then sort by the week-over-week change so the worst stores rise to the top:

```r
library(dplyr)
library(knitr)

by_store <- data.frame(
  store     = c("Downtown", "Airport", "Uptown", "Old Mill", "Riverside", "Lakeside"),
  revenue   = c(8400, 6200, 5200, 4600, 3600, 3000),   # this week, dollars
  last_week = c(7600, 6300, 5100, 4500, 4200, 3800)
)

by_store |>
  mutate(change_pct = round((revenue - last_week) / last_week * 100)) |>
  arrange(change_pct) |>
  kable(caption = "Week-over-week change by store")
#> 
#> 
#> Table: Week-over-week change by store
#> 
#> |store     | revenue| last_week| change_pct|
#> |:---------|-------:|---------:|----------:|
#> |Lakeside  |    3000|      3800|        -21|
#> |Riverside |    3600|      4200|        -14|
#> |Airport   |    6200|      6300|         -2|
#> |Uptown    |    5200|      5100|          2|
#> |Old Mill  |    4600|      4500|          2|
#> |Downtown  |    8400|      7600|         11|
```

The two stores at the top of that sorted table are the whole story. That is what turns a vague "look into declining sales" into a specific, do-it-this-week recommendation.

=== step === concept
::eyebrow The evidence
## One chart carries the headline

The Evidence layer needs one chart, and it has one job: make the finding obvious at a glance. That takes two decisions. First, **plot the thing that shows the finding**, here the trend over time, not just this week's totals. Second, **choose the encoding that makes the pattern jump out**. The same six weeks of chain revenue can be drawn three ways:

::widget chart-plotter {"data":[{"x":1,"y":33.0},{"x":2,"y":34.2},{"x":3,"y":34.6},{"x":4,"y":33.1},{"x":5,"y":31.5},{"x":6,"y":31.0}],"geoms":["line","point","col"],"x":"week","y":"revenue"}

Switch between the geoms. Points scatter the eye, bars are readable but heavy, and the line connects them into the one thing Dev needs to see: a slope heading down. Same numbers, but the line tells the story.

Now the same chart in R. We build the six-week series inline, draw it, and, crucially, put the finding in the **title**, not "Revenue by week" but what the revenue is actually doing:

```r
library(ggplot2)

weekly <- data.frame(
  week    = 1:6,
  revenue = c(33.0, 34.2, 34.6, 33.1, 31.5, 31.0)   # whole chain, $1000s
)

ggplot(weekly, aes(week, revenue)) +
  geom_line(color = "#b5631a") +
  geom_point(size = 2.5) +
  labs(title = "Chain revenue is sliding: down 10% in three weeks",
       x = "week", y = "revenue ($1000s)")
```

[KEY INSIGHT]
A chart title is prime real estate. Spend it on the finding, not a restatement of the axes. "Chain revenue is sliding" does work that "Revenue by week" never will: it tells the reader what to see before they have to work it out.

=== step === tryit
::eyebrow Your turn
## Compute the headline number

Your executive summary says revenue is "down about 10%." That number should be computed, not eyeballed, so it stays right when next week is added (exactly the inline-code idea from Lesson 1). Using the `weekly` data you just built, fill in the blank to compute the percent drop from the peak week to the latest week.

```r
peak   <- max(weekly$revenue)
latest <- weekly$revenue[nrow(weekly)]

pct_drop <- round(____ * 100)
pct_drop
```
::check {"regex":"[(]\\s*peak\\s*-\\s*latest\\s*[)]\\s*/\\s*peak","gate":true,"difficulty":"beginner","ok":"That returns 10. Now the headline number is reproducible: as inline code in the report it recomputes every week, so the summary can never go stale.","no":"You want the fall from the peak as a fraction of the peak: (peak - latest) / peak. The round(... * 100) around it turns that into a whole percent."}
::solution
```r
peak   <- max(weekly$revenue)
latest <- weekly$revenue[nrow(weekly)]

pct_drop <- round((peak - latest) / peak * 100)
pct_drop
#> [1] 10
```

=== step === quiz
::eyebrow Check yourself
## What does this report need?

A colleague sends you a draft. It opens with two paragraphs on data sources and cleaning, then a full 40-row table of every store and week, and the actual finding ("two stores are dragging the chain down") is the last sentence on page two. The numbers are all correct. What is the single most important fix?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Move the finding and a recommended action to the very top as a short executive summary, and push the data sources and full table down to the end ::ok Right. The content is correct but inverted. Leading with the answer and demoting the method and the 40-row table to the Detail layer is the inverted pyramid, and it is what makes a correct report actually get read.
- Nothing structural; a detail-first build is more rigorous and shows the work honestly ::no Showing your work is good, but making the reader hunt for the finding is not rigor, it is a buried lede. Rigor lives in the Detail layer at the bottom; the answer still goes first.
- Add more charts and a second table so there is more evidence up front ::no More evidence does not fix a missing headline, it buries it deeper. The fix is order, not volume: one clear answer first, then the single chart that proves it.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Cole Nussbaumer Knaflic, Storytelling with Data](https://www.storytellingwithdata.com/) - the standard practical guide to turning a chart into a message a reader acts on.
- [Nielsen Norman Group: The Inverted Pyramid](https://www.nngroup.com/articles/inverted-pyramid/) - why leading with the conclusion beats building up to it, with the usability research behind it.
- [ggplot2: Elegant Graphics for Data Analysis (Wickham)](https://ggplot2-book.org/) - the canonical reference for titling, labelling and annotating the chart that carries your headline.
- [R for Data Science (2e)](https://r4ds.hadley.nz/) - Wickham, Cetinkaya-Rundel and Grolemund on the communication half of the analysis workflow.

=== step === complete
## Lesson 2 complete

A correct report is only half the job, and this lesson was the other half. You learned to **lead with the answer** (BLUF: the finding and the recommended action first), to shape the write-up as an **inverted pyramid**, Answer then Evidence then Detail, and to open with a one-paragraph **executive summary** carrying the finding, the number, and the action. You saw that **one chart carries the headline** when you plot the finding and title it with what to see, and you made the headline number reproducible in R so it never goes stale.

Next, Lesson 3: **AI-assisted analysis in R**. You will use a large language model to summarize and label data straight from R, and get a clear-eyed guide to when an LLM is worth trusting in an analysis, and when it is not.
