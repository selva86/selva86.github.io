# The Publishing Handbook — full plan

Written 2026-08-05. Supersedes the scope (not the detail) of
`reviewer-2-course-plan.md`, which remains the chapter-level plan for the
peer-review parts.

---

## Part A: The scope decision

### The problem with stopping at peer review

`reviewer-2-course-plan.md` designs thirty chapters on answering reviewer
objections. That is a sharp product and it is the right wedge, but it is not a
handbook. Thirty chapters with an identical seven-part template is a reference
card set, not a book, and it covers one moment in a process with many.

The brief is to address what researchers who publish actually need. Peer review
is stage four of five. A researcher who only meets us at stage four has already
made the decisions that caused the objection.

### The decision

**Broaden to The Publishing Handbook: the complete statistical path from study
design to published paper. Peer review stays as the flagship section and the
promotional wedge.**

Three reasons.

**It captures far more search intent.** "Peer review statistics" is high-intent
and low-volume. "Sample size calculation", "how to report regression results",
"CONSORT diagram", "publication quality figures" are each larger, and all of them
are asked by exactly the audience the email analysis found.

**It is honest about causation.** Most reviewer objections are caused by a
decision made months earlier. A handbook that only teaches the defence and never
the prevention is selling a worse product than it could.

**It makes the book book-sized.** Sixty-odd chapters across a real lifecycle is a
handbook. Thirty near-identical chapters is not.

### What does NOT change

Peer review remains the hero. It is the acute, dated, emotional moment, and it is
what gets promoted, linked and bought first. The rest of the handbook is what
makes the buyer stay and what makes the institutional pitch credible.

---

## Part B: Handbook versus interactive course

This distinction was asked for explicitly and it should govern every authoring
decision.

|  | Handbook | Interactive course |
|---|---|---|
| **Reader arrives** | With a problem | To learn a skill |
| **Organised by** | Situation | Learning progression |
| **Read** | One chapter, out of order | Start to finish |
| **Optimised for** | Being found | Being understood |
| **Success looks like** | Problem solved in four minutes | Skill acquired over an hour |
| **Access** | Free, indexed | Pro, gated |
| **Format** | Prose, runnable code, tables | Steps, widgets, quizzes, XP |
| **Job** | Capture intent | Create the wow |

**Concretely, on the same topic.** The handbook chapter on multicollinearity
says: here is how to check it, here is what the number means, here is what to do,
here is how to word it for a reviewer. Four minutes, problem solved.

The lesson on multicollinearity puts a slider on the correlation between two
predictors and lets you watch the standard errors inflate in real time while the
coefficients stay unbiased. Ten minutes, and you never forget it.

**The handbook gives answers. The course builds understanding.** Neither replaces
the other, and the handbook chapter should link to the lesson rather than trying
to be it.

**Authoring rule that follows:** if a chapter is being written and the best
explanation needs a moving picture, that is a signal it belongs in a lesson.
Write the answer in the handbook and note the lesson.

---

## Part C: The full curriculum

Sixty-five chapters in ten parts, ordered by the research lifecycle. Titles are
search-optimized: Parts 1-7 and 10 front-load the keyword and carry "in R" where
R is involved; Part 9 names the objection's subject and carries a consistent
"in Peer Review" suffix, so the topic word a stressed researcher would actually
search for sits at the front of the title.

Chapters marked LINK in the notes have an existing r-statistics.co page that
already ranks. Those are written as the publishing angle and link out for the
method, never as a duplicate.

### Part 1 - Before the data

1. Study Design Types: RCT, Cohort, Case-Control
2. How to Justify Your Sample Size to Reviewers
3. Simulation-Based Power Analysis in R
4. How to Write a Statistical Analysis Plan
5. Pre-Registration: What to Commit To

### Part 2 - Data you can defend

6. Missing Data Types in R: MCAR, MAR, MNAR
7. How to Report Multiple Imputation in a Paper
8. Outlier Removal Rules in R
9. How to Document Your Data Cleaning Steps

### Part 3 - Choosing and defending the analysis

10. Justifying Your Choice of Statistical Test
11. Sensitivity Analysis in R for Publication
12. Influential Observations in R: Cook's Distance

### Part 4 - Reporting the numbers

13. How to Report Statistical Results in a Paper
14. Which Effect Size to Report, and When
15. How to Report Confidence Intervals in a Paper
16. How to Report p-Values in a Paper

### Part 5 - Tables and figures for journals

17. Table 1 in R with gtsummary and tableone
18. Regression Tables in R for Publication
19. Journal Figure Requirements: Size, DPI, Fonts
20. Colourblind-Safe Plots in R for Journals
21. Error Bars and Confidence Bands in R

### Part 6 - Writing it up

22. How to Write a Statistics Methods Section
23. How to Write a Results Section with Statistics
24. How to Write Study Limitations
25. Statistical Terms to Avoid in a Paper

### Part 7 - Reporting guidelines

26. Reporting Guidelines: Which One Applies to You
27. CONSORT Flow Diagram in R
28. STROBE Reporting in R for Observational Studies
29. PRISMA and TRIPOD Reporting in R

### Part 8 - Reading a review

30. How to Answer Statistical Reviewer Comments in R

### Part 9 - The thirty objections

31. Non-Normal Residuals in Peer Review
32. Unequal Variance in Peer Review
33. Non-Independent Observations in Peer Review
34. Autocorrelated Residuals in Peer Review
35. Multicollinearity in Peer Review
36. Nonlinear Relationships in Peer Review
37. Proportional Hazards in Peer Review
38. Missing Power Analysis in Peer Review
39. Unadjusted Confounding in Peer Review
40. Baseline Imbalance in Peer Review
41. Selection Bias in Peer Review
42. Non-Comparable Control Groups in Peer Review
43. Multiple Comparisons in Peer Review
44. Unplanned Subgroup Analyses in Peer Review
45. Borderline p-Values in Peer Review
46. Exploratory vs Confirmatory Analysis in Peer Review
47. Dichotomising Continuous Variables in Peer Review
48. Outlier Removal in Peer Review
49. Missing Effect Sizes in Peer Review
50. Missing Confidence Intervals in Peer Review
51. Trending Toward Significance in Peer Review
52. Model Fit Statistics in Peer Review
53. Missing Data Reporting in Peer Review
54. Ordinal Data in Peer Review
55. Mixed Models in Peer Review
56. Link Function Choice in Peer Review
57. Zero-Inflation in Peer Review
58. Too Many Predictors in Peer Review
59. Interaction Terms in Peer Review
60. Code and Data Sharing in Peer Review

### Part 10 - Response, revision, and after

61. How to Write a Response to Reviewers Letter
62. How to Disagree With a Reviewer
63. Second Round Review: What to Do
64. How to Share Code and Data With a Paper
65. Corrections and Retractions: What to Do

## Part D: Gaps, conflicts and risks

Worked through deliberately rather than discovered later.

### Conflicts with existing content

**Overlap with the Statistics Handbook is real and needs a rule.** Chapters
21-28 (choosing an analysis) and 29-37 (checking it) cover methods the Statistics
Handbook already teaches.

**Rule: the Publishing Handbook never teaches the method. It teaches the
decision, the defence, and the reporting.** The chapter on logistic regression
here is "when is this the right choice, what will a reviewer ask, how do you
report it." The chapter that teaches logistic regression is in the Statistics
Handbook, and this one links to it.

Without that rule the two books cannibalise each other in search and confuse
readers. With it, they are complementary and the internal linking is natural.

**Overlap with the ggplot2 Handbook** in Part 8. Same rule: this book covers
journal requirements and what gets a figure rejected, not how to use ggplot2.

### Gaps in what I have proposed

**Meta-analysis and systematic reviews** get one PRISMA chapter, which is thin
for an audience with a lot of health researchers in it. Candidate for expansion
after launch rather than at launch.

**Qualitative and mixed-methods research** is absent entirely. Out of scope for a
statistics site, but worth naming so the omission is deliberate.

**Bayesian reporting** is absent. There is now a complete Bayesian arm on the
site, and reviewers increasingly ask about priors. Should be added as a Part 6
chapter once the rest is stable.

**Discipline variation is not addressed.** What passes review in psychology
differs from epidemiology, which differs from ecology. Handling every discipline
would triple the book. The chosen approach is to write the general case and note
the major divergences inline, and to say so in the introduction rather than
pretending uniformity.

### Risks

**Scope.** Sixty-six chapters is a large build. It is feasible with the tutorial
factory, which has shipped fleets of this size, but it is not a weekend.

**The wedge could blur.** If the handbook launches as a general publishing
resource, the sharp peer-review hook is diluted. Mitigation: peer review is the
promotional entry point and the most complete part at launch; the rest fills in
behind it.

**Authority.** This book makes claims about what reviewers accept. Those claims
need grounding in reporting guidelines and journal policies, cited, not asserted
from experience. Every normative claim needs a source or an explicit "in my
experience" marker.

---

## Part E: Must have, good to have, great to have

### Must have, or it should not launch

- Part 11 and Part 12 complete. The wedge has to be real.
- Every code block runs and every `#>` output is real, verified against R.
- The handbook index with working navigation and the parts visible.
- The rule against duplicating the Statistics Handbook enforced by actual links.
- Honest sourcing on every normative claim about what reviewers want.

### Good to have

- Parts 2, 6 and 8 (power, reporting numbers, figures). Highest search volume
  outside peer review, and each stands alone.
- Downloadable response-letter template. This is the single most requested
  artifact in the whole subject and is the natural email-capture asset.
- Cross-links into the Statistics, ggplot2 and Time Series handbooks.
- A worked end-to-end example: one dataset carried from design through review.

### Great to have

- **The Reviewer Objection Finder.** Paste the reviewer's comment, get the
  matching chapter. A search box over the thirty objections with their real
  phrasings. Cheap to build, genuinely novel, and it is the tool version of the
  handbook's whole premise.
- **A reporting checklist generator.** Pick your study design, get the CONSORT or
  STROBE checklist as a fillable list with the R code for each item.
- **Graded practice on real review scenarios** (Layer 4), which is where the paid
  value concentrates.
- **A response-letter drafting assistant** built on the chapter content.
- **Institutional edition**: the same handbook plus a departmental dashboard
  showing which objections that department's papers keep receiving. This is the
  $20,000-per-campus product from the offer research.

---

## Part F: Build sequence

Nothing goes to `master` directly. Branch, preview, verify, merge, per the
project's mandatory workflow for anything that changes navigation.

| Phase | What | Gate before proceeding |
|---|---|---|
| 0 | Branch, handbook index page, `curricula.json` entry | Renders correctly on CF preview |
| 1 | Part 11 (Chapter 0, already written) + diagram | Chapter 0 live and indexed |
| 2 | Part 12: six highest-volume objection chapters | Traffic and conversion signal |
| 3 | Navbar dropdown entry + `?v=` sweep | Verified on legacy pages too |
| 4 | Part 12 remaining 24 chapters | |
| 5 | Parts 2, 6, 8 (power, reporting, figures) | |
| 6 | Parts 1, 3, 4, 5 | |
| 7 | Parts 7, 9, 10, 13 | |
| 8 | Layer 4 graded practice hub | |
| 9 | Researcher track + `pro` block | Only if the handbook converts |

**The gate at phase 2 matters.** Six chapters is enough to know whether academic
traffic converts. If it does not, phases 4 through 9 should be reconsidered
rather than executed on momentum.

---

## Part G: Naming

Working title **The Publishing Handbook**, keyed `publishing`.

Alternatives considered: The Peer Review Handbook (too narrow for the scope now
proposed), Statistics for Publication (accurate, clumsy), The Research Handbook
(vague, and not obviously statistical).

Tagline, following the Time Series pattern of a plain outcome sentence:
**"How to design, report and defend a statistical analysis in a paper."**

Navbar `short`: **The Publishing Handbook**.

---

## Curriculum trim, 2026-08-06

Sixty-five chapters became sixty-two, and eight of the survivors are answered by
pages the site already publishes rather than by new writing.

The audit that prompted this was not looking for weak chapters. It was looking
for chapters that would compete with r-statistics.co for the same query, and it
found seventeen candidates. Publishing a second page against your own ranking
page splits the authority one page would have had.

### Adopted: the site already answers it

The chapter keeps its slot in the contents and links to the existing page. The
entry carries that page's title, so the label matches the destination, and
`adopted_from` records what the chapter would have been called.

| Ch | Adopted page |
|---|---|
| 3 | `Power-by-Simulation-in-R` |
| 4 | `Pre-Analysis-Plans-in-R` |
| 5 | `Pre-Registration-for-R-Analysis` |
| 11 | `Sensitivity-Analysis-in-R` |
| 13 | `Reporting-Statistics-in-R` |
| 18 | `Regression-Tables-in-R` |
| 20 | `Accessible-Data-Visualization-in-R` |
| 21 | `Error-Bars-in-R` |

### Dropped: duplicated another chapter of this book

| Ch | Folded into |
|---|---|
| 2 Justify Your Sample Size | ch38 Missing Power Analysis in Peer Review |
| 8 Outlier Removal Rules | ch48 Outlier Removal in Peer Review |
| 64 Share Code and Data | ch60 Code and Data Sharing in Peer Review |

### Kept, against the first draft of this audit

Chapters 14, 15 and 16 report effect sizes, confidence intervals and p-values.
`Reporting-Statistics-in-R` covers all three at overview depth, which made them
look redundant, and they are not: a page that mentions a topic is not a
substitute for the page about it, and each targets a query of its own. The same
reasoning keeps 6, 7, 9 and 12, where the existing page is either broader or
sits inside a course rather than answering the publication question.

Nothing dropped or adopted had been written, so the trim cost no work and
removed about fourteen chapters of future writing.

### What enforces it

- `Scripts/batch_handbook.py` skips `adopted` and `dropped`. Its filter used to
  exclude only `published`, which meant any unrecognised status was treated as
  writable and the orchestrator would have written these anyway.
- `_build/gen_handbook_index.py` skips `dropped` rows, so they leave the
  contents and the chapter count.
- `Scripts/build_handbook_tracker.py` preserves `title` for adopted rows, plus
  `adopted_from` and `dropped_reason`. Without that a rebuild would rename an
  adopted chapter back to its planned title and break the match with its link.
