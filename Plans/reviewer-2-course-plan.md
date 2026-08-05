# The Peer Review Handbook — plan

Plan updated 2026-08-05. Originally drafted as "Reviewer 2: Defending Your
Analysis", a crash course from `offer-design-2026.md`. Restructured as a handbook
after the audience analysis; positioning and navbar decisions added.

---

## What this is

A reference and training product for the moment a researcher gets a statistical
objection back from a peer reviewer and has to answer it.

It is not a statistics course. It assumes the analysis is already done. The user
arrives holding a specific complaint from a specific reviewer, under a deadline,
usually anxious.

## Why it is worth building first

- Nobody has built it. Searching for these objections returns scattered forum
  threads and no authoritative source.
- The audience data supports it directly: the institutional signups on
  r-statistics.co are overwhelmingly universities, research institutes, and
  health agencies (NIH, CDC, PNNL, CGIAR, university hospitals). These are people
  who publish.
- It is an emotional, deadline-bound moment, which is when people pay.
- Every entry doubles as a search-indexed page.

---

## Format decision

**A handbook, containing four layers.** The layers below are unchanged; the
handbook is the container that houses them and gives them a hub, a sidebar, and
a place in the navbar alongside the existing three books.

The reason it is a handbook and not a linear course: nobody works through this
start to finish. They arrive with one problem. A twelve-lesson sequential course
is the wrong shape for a lookup need, in the same way a first-aid manual is not a
novel. Handbook is how the thing actually gets used.

But some people will want to learn it properly *before* they need it, so a linear
path has to exist too. That is Layer 3, which lives in the Researcher track.

### Layer 1 — the handbook index (free, indexed)

Was: "one hub page." Now: the handbook index at `/tutorials/peer-review.html`,
matching the pattern of `/tutorials/time-series.html`.

Lists all thirty chapters grouped into parts, carries the tagline, and links to
the Researcher track through the `pro` block.

The draft written on 2026-08-04 as
`posts/Answering-Statistical-Reviewer-Comments.md` becomes **Chapter 0**, the
orientation chapter: triage, the four-part response pattern, and a worked example
from each group. It is the strongest single page for search and stays free.

### Layer 2 — one chapter per objection (tutorial format)

Thirty chapters, each self-contained, each following the identical template
below. Six to eight free and indexed; the rest Pro.

This layer serves the urgent lookup. It is also thirty more indexed pages on
long-tail queries nobody else is answering.

### Layer 3 — the interactive course (lesson format, Pro)

The same material sequenced for someone learning it in advance rather than in a
panic. Uses the step player, runnable code, gated quizzes.

**Now positioned as a module inside the Researcher track**, not as a separate
thing. This is where the handbook and the track join.

### Layer 4 — graded practice (exercise hub, Pro)

Given a reviewer comment and a block of R output, decide what to do. This is
where the paid value concentrates, because it is the only layer that tells you
whether you actually understood.

**Build order:** Layer 1 and six Layer 2 chapters first. Ship. Learn. Then the
rest.

---

## The chapter template

Every one of the thirty chapters has the same seven parts. Consistency is the
product: once someone has used two chapters they know exactly where to find what
they need in the third.

**1. What the reviewer wrote**
Two or three real phrasings of the objection, in reviewer language.

**2. What they actually mean**
The translation. Reviewers are often terse or imprecise; this section says what
the underlying statistical concern is.

**3. Why they are asking**
What actually goes wrong if the concern is real. Brief, concrete, no lecture.

**4. How to check, in R**
Runnable code against a built-in dataset. The diagnostic itself.

**5. The three outcomes**
- You are fine, and here is how to show it
- There is a problem and it is fixable, here is the fix
- There is a real problem, here is how to handle it honestly

Most existing writing covers only the middle case. The first and third are where
people are actually stuck.

**6. How to word the response**
Actual sentences for the response letter, one per outcome.

**This is the part nobody else has.** Researchers know roughly what to check.
What they do not know is how to say "we checked, the assumption is mildly
violated, and here is why it does not change the conclusion" without sounding
defensive or conceding too much.

**7. Practice**
One graded exercise: a reviewer comment plus real R output. Decide the outcome
and pick the correct response.

---

## The curriculum: 30 objections in 6 parts

Handbook `parts` map one-to-one onto the six modules, plus Chapter 0.

### Part 0 — Reading a review

0. Triage, the response pattern, and worked examples
   (`Answering-Statistical-Reviewer-Comments.html`, already drafted)

This resolves the earlier open question about whether a Module 0 was needed. It
is needed, and it already exists.

### Part 1 — "Did you check the assumptions?"

The most common category and the easiest to answer well.

1. Normality was not assessed
2. Equal variance / homoscedasticity not checked
3. Observations are not independent (clustering, repeated measures)
4. Residuals are autocorrelated
5. Multicollinearity was not examined
6. Linearity of the relationship was assumed, not shown
7. Proportional hazards assumption not tested (survival models)

### Part 2 — "Is the design sound?"

Harder, because these often cannot be fixed after the fact. The honest-answer
material matters most here.

8. No power analysis; sample size not justified
9. Confounding not addressed
10. Baseline differences between groups not adjusted for
11. Selection bias / non-response not discussed
12. The control group is not comparable

### Part 3 — "Did you go fishing?"

Emotionally the hardest part, because the subtext is an accusation.

13. Multiple comparisons not corrected
14. Subgroup analyses were not pre-specified
15. p = 0.049 is treated as a finding
16. This looks exploratory; was it pre-registered?
17. Why was a continuous variable dichotomised?
18. Outliers were removed without justification

### Part 4 — "Did you report it properly?"

The easiest part to fix and the fastest wins.

19. p-values reported without effect sizes
20. Confidence intervals are missing
21. A non-significant result is described as "a trend"
22. Model fit statistics not reported
23. Missing data handling is not described

### Part 5 — "Is the model right?"

The most technical part.

24. A parametric test was used on ordinal data
25. A mixed model should have been used
26. The link function / error distribution is not justified
27. Zero-inflation was not considered (count outcomes)
28. Too many predictors for the sample size (overfitting)
29. An interaction is claimed without testing the interaction term

### Part 6 — "Can anyone check this?"

30. Code and data are not available; the analysis is not reproducible

---

## Wiring: the `curricula.json` entry

Handbooks are driven by `www/curricula.json`, a `books` array. Each book has
`key`, `title`, `short`, `index`, `pro`, `tagline`, `parts`. Model the new entry
on the Time Series book.

```json
{
  "key": "peer-review",
  "title": "The Peer Review Handbook",
  "short": "The Peer Review Handbook",
  "index": "/tutorials/peer-review.html",
  "tagline": "How to answer the statistical objections reviewers raise.",
  "pro": {
    "label": "Explore the Researcher track",
    "href": "/roadmap/researcher.html",
    "blurb": "Interactive lessons and graded practice on defending an analysis."
  },
  "parts": [
    { "title": "Reading a review", "chapters": [ ... ] },
    { "title": "Did you check the assumptions?", "chapters": [ ... ] }
  ]
}
```

**Tagline rules.** Follow the Time Series pattern (*"How to build and evaluate
forecasts in R."*): plain sentence, reader outcome, no chapter counts, no
part counts, no slogan register. The count-based subtitles were removed from the
navbar once already and must not come back.

---

## Navbar: yes, but not yet

**Recommendation: add it to the Tutorials dropdown as the fourth handbook, once
six chapters exist. Not before.**

Current dropdown order in `www/tutorials-nav.js`: The Statistics Handbook, The
Time Series Forecasting Handbook, The ggplot2 Handbook. Peer Review goes fourth,
as the newest and least proven.

Why wait: a handbook in the navbar with one chapter behind it reads as an empty
promise, and the navbar is the most-seen surface on the site. Six chapters plus
the index is enough for it to look like a book.

Note the operational gotcha from the last dropdown change: there are hand-
maintained pages outside the rebuild chain that carry their own copy of
`tutorials-nav.js`, and a `?v=` bump is needed or the edge serves the stale
asset. Budget for the sweep, do not assume one edit propagates.

---

## Positioning: the wedge into a Researcher track

### The audience mismatch this fixes

The roadmap tracks are Data Analyst, Data Scientist, ML Engineer. Those are
industry job titles.

The actual signups are universities across twenty countries, NIH, CDC, PNNL,
CGIAR, hospitals in Norway and Wisconsin, Australia's health department, and a
large number of graduate students. **Those people are not becoming Data
Scientists. They are researchers who need statistics to publish.**

A Researcher track closes that gap, and no competitor is building it. DataCamp,
Codecademy and Boot.dev all aim at industry jobs. In the whole comparative study
the only business serving academics was NCFDD, who charge $20,000 per campus and
do not teach statistics.

### The track

1. Study design and power, before you collect anything
2. Choosing your analysis and being able to justify the choice
3. Running it properly in R
4. Reporting to journal standards
5. **Defending it in peer review** ← this handbook
6. Reproducibility and sharing your code

### How the handbook attaches to the track

**Through the `pro` block, exactly as the Time Series Handbook attaches to the
Forecaster track.** The precedent already exists and needs no new machinery:

- Time Series Handbook → `pro.href = /roadmap/forecaster.html`
- Peer Review Handbook → `pro.href = /roadmap/researcher.html`

So the answer to "should it be part of the Researcher track, and how" is: yes,
and the wiring is one `pro` block plus a roadmap page. The handbook is the free,
indexed, searchable surface; the track is the paid, sequenced destination.

### Why the handbook ships first, not the track

The track is the bigger, more valuable product. The handbook is what gets bought
today.

Peer review is an acute, dated, emotional problem. Someone with a review in hand
and three weeks to respond will act this afternoon. "Become a better research
statistician" is a worthy goal nobody buys under pressure.

Build the handbook, prove people want it, then expand into the track. If the
handbook does not sell, that is learned cheaply and no six-part track was built
on a wrong assumption.

**Honest caveat on scope.** The Researcher track is proposed off 52 institutional
email addresses. That is a signal, not proof. The handbook is the cheapest
possible test of whether the academic positioning is right.

---

## The funnel

```
Google: "reviewer says my residuals aren't normal"
        |
One handbook chapter, free, solves the problem today
        |
Reader sees the other 29 chapters and the graded practice
        |
Reader sees the Researcher track, which is what they actually need
```

The first step is the one that matters. Each chapter is a search-indexed page
answering a question with real intent behind it, and the person landing on it is
in the exact state where they will pay.

**Gating, per the model in `growth-playbook-2026.md`:** chapters stay free and
indexed because that is the SEO engine. What is paid is the graded practice, the
readiness score, and the credential. The wall is on the feature, not the content.

---

## Promotion

The audience is reachable in specific places, which is unusual and valuable.

**University statistics consulting centres.** Most research universities have
one, staffed by people who answer exactly these questions all day. They are both
users and referrers, and they are a route to the institutional sale.

**Graduate methods courses.** A lecturer who assigns it reaches a new cohort
every year. This is Coaching Actuaries' free-software-for-professors play in a
different form.

**Search is the main channel and the timing is favourable.** The moment of
highest intent is when someone is looking at a review, and that is a search
moment rather than a social one. Search is already the site's strength.

**The institutional pitch writes itself.** "Our researchers keep getting
statistical objections in review" is a problem a research office recognises and
has budget for.

---

## Notes on execution

**Voice.** Calm and practical. The reader is stressed. No lecturing about what
they should have done differently, because it is too late for that and it makes
the product unpleasant to use. Where a mistake is genuinely unfixable, say so
plainly and move to how to disclose it.

**Datasets.** Use built-in R data throughout so every block runs with no
downloads.

**Honesty constraint.** Part 3 in particular must not teach people how to make a
weak result look strong. The framing throughout is: work out whether the reviewer
is right, then respond accurately. If they are right, the correct response is to
concede and revise. A product that helps people defend bad analysis would be
worth less and would deserve to be.

**Cross-linking.** Each chapter links to the relevant existing tutorial for the
underlying method, which pulls the existing 1,836 pages into the funnel rather
than duplicating them.

---

## Revised build order

| # | Step | Notes |
|---|---|---|
| 1 | Retitle the drafted page as Chapter 0 | Already written and R-verified |
| 2 | Build `/tutorials/peer-review.html` index | Model on `/tutorials/time-series.html` |
| 3 | Add the `peer-review` book to `curricula.json` | Parts populated, chapters added as built |
| 4 | Write six Part 1 and Part 4 chapters | Shallowest, highest search volume |
| 5 | Add to the Tutorials dropdown | Fourth position, plus the `?v=` sweep |
| 6 | Remaining 24 chapters | |
| 7 | Layer 4 graded practice hub | Where the paid value sits |
| 8 | `/roadmap/researcher.html` + `pro` block | Only after the handbook shows traction |
| 9 | Layer 3 lessons inside the track | Last |

---

## Open questions

- Free versus Pro split: which six to eight chapters are free? Suggest the
  highest-search-volume ones from Parts 1 and 4, since those are the shallowest
  and least differentiated.
- Whether Layer 3 (the linear course) is worth building before there is evidence
  people want it. Deferred to step 9 on that basis.
- ~~Whether to add a Module 0~~ — resolved. It is Part 0 and it is written.
- Does the Researcher track need its own certificate, or does it sit under the
  existing credential scheme?
- Diagram for Chapter 0 still outstanding (project rule requires one for [C]
  posts): proposed the triage decision flow.
