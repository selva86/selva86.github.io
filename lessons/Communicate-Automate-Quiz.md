---
title: "Communicate and Automate with R: Quiz"
description: "A short, graded check on the Communicate and Automate with R section."
keywords: "R quiz, data analyst, da-communicate, practice"
post_type: "LESSON"
curriculum_id: "2.9.4"
webr: true
lesson_access: "free"
course_id: "da-communicate"
course_title: "Communicate and Automate with R"
course_lesson: "4"
course_total: "4"
course_landing: "Communicate-Automate-Course.html"
lesson_kind: "quiz"
course_prev: "AI-Assisted-Analysis-in-R.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the final section: reproducible reports, data storytelling, and AI-assisted analysis. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## Why a Quarto report
A Quarto or R Markdown report beats copy-pasting numbers into a doc because it:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Regenerates every number straight from the data when you re-run it. ::ok Correct: the report stays in sync with the data, no manual updates.
- Looks more colourful. ::no Appearance is not the point.
- Runs faster than a script. ::no It runs the same code; that is not the benefit.
- Hides the analysis from readers. ::no It makes the analysis transparent and repeatable.

=== step === quiz
::eyebrow Question 2 of 8
## Parameterized reports
A parameterized report is useful when you want to:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Re-run the same report for many inputs, like one per region. ::ok Correct: parameters let one template serve many cases.
- Write the report only once and never again. ::no The point is easy re-running, not one-off use.
- Remove all the code. ::no Parameters add inputs, they do not strip code.
- Make the report non-reproducible. ::no They make repeated runs easier, not harder.

=== step === quiz
::eyebrow Question 3 of 8
## The heart of a data story
The most important part of a data story is:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Using as many charts as possible. ::no More charts is not the goal.
- A clear takeaway the audience can act on. ::ok Correct: a story leads to a decision, not just visuals.
- The colour palette. ::no Style supports, but is not, the message.
- Showing every number you computed. ::no Editing down to what matters is the skill.

=== step === quiz
::eyebrow Question 4 of 8
## Where a summary leads
An executive summary should open with:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The conclusion or recommendation. ::ok Correct: lead with the answer, then support it.
- The raw data tables. ::no Detail belongs after the headline, if at all.
- A description of your code. ::no Readers want findings, not methods, up front.
- A list of every package used. ::no That is for an appendix, not the opener.

=== step === quiz
::eyebrow Question 5 of 8
## Using an LLM safely
When you use an AI assistant to summarise or label data, you should:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Verify its output against the actual computation. ::ok Correct: AI can be confidently wrong, so check it.
- Trust it completely to save time. ::no Unchecked AI output is a real risk.
- Never use it for anything. ::no Used with checks, it genuinely speeds work up.
- Paste its answer straight into the report. ::no Not without verifying it first.

=== step === quiz
::eyebrow Question 6 of 8
## A confident AI claim
An LLM states a precise statistic about your dataset. The right move is to:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Quote it in your report as-is. ::no It may be invented; do not quote unverified.
- Compute the statistic yourself and compare. ::ok Correct: confirm against the real numbers before trusting it.
- Assume it is right because it sounds sure. ::no Confidence is not correctness for an LLM.
- Ask the LLM if it is sure. ::no Self-assurance is no substitute for checking the data.

=== step === concept
::eyebrow Run it: the numbers behind a summary
## Compute report figures
Run this to compute the headline figures an executive summary would cite: the fleet size, average mileage, and best mileage.

```r
library(dplyr)

mtcars %>%
  summarise(cars = n(), avg_mpg = round(mean(mpg), 1), best_mpg = max(mpg))
```

These are the kind of numbers a reproducible report drops straight into its prose, recomputed every run.

=== step === concept
::eyebrow Run it: a reproducible calculation
## One number, computed not typed
Run this to compute a mean and standard deviation. In a report, you would reference these instead of typing the values by hand.

```r
sales <- c(120, 150, 90, 220, 180)

mean(sales)
sd(sales)
```

Computing the value in code means it can never go stale or be mistyped in your write-up.

=== step === complete
## Section complete
Strong work, and that completes the Data Analyst track. You can turn an analysis into a reproducible report, tell a clear story, and use AI with good judgement. Time to put it together on a project.
