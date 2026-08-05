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

Sixty-six chapters in thirteen parts. Ordered by the research lifecycle, not by
statistical method, because that is how the reader experiences the problem.

### Part 1 — Before you collect anything

1. Turning a research question into a testable hypothesis
2. Choosing a study design: RCT, cohort, case-control, cross-sectional
3. Units of analysis, and the mistakes that follow from getting them wrong
4. Randomisation and allocation concealment in R
5. Blinding, and what to do when it is impossible
6. Writing a statistical analysis plan before you see the data
7. Pre-registration: what to commit to and what to leave open

### Part 2 — Sample size and power

8. What power actually means, and what it does not
9. Power for a two-group comparison
10. Power for regression and correlation
11. Power for clustered and repeated-measures designs
12. Simulation-based power when there is no formula
13. Justifying a sample you could not choose
14. Why post-hoc power is not an answer

### Part 3 — Preparing data you can defend

15. Documenting what you did to the raw data
16. Missing data: what kind you have, and why it matters
17. Multiple imputation in R, end to end
18. Outliers: rules decided in advance
19. Transformations, and when they cost more than they help
20. Data dictionaries and codebooks

### Part 4 — Choosing your analysis

21. Matching the test to the design and the data type
22. Continuous outcomes: t-tests to linear models
23. Binary outcomes: proportions to logistic regression
24. Count outcomes: Poisson, negative binomial, zero-inflation
25. Ordinal outcomes without pretending they are continuous
26. Time-to-event outcomes: survival basics
27. Clustered and repeated data: mixed models
28. When a nonparametric test is the right answer

### Part 5 — Checking your analysis

29. Reading a residual plot properly
30. Normality: what actually needs it
31. Equal variance, and what to do when it fails
32. Independence: the assumption that cannot be patched
33. Linearity and functional form
34. Multicollinearity: diagnosing and deciding
35. Influence and leverage
36. Proportional hazards
37. Sensitivity analyses that reviewers accept

### Part 6 — Reporting the numbers

38. What to report for every analysis, and in what order
39. Effect sizes by design
40. Confidence intervals, and how to describe them in words
41. Exact p-values, thresholds, and the language around them
42. Reporting model fit honestly
43. Reporting missing data and exclusions

### Part 7 — Tables

44. Table 1: baseline characteristics that pass review
45. Regression tables that a reader can follow
46. Building publication tables in R

### Part 8 — Figures

47. What makes a figure publishable
48. Journal specifications: size, resolution, fonts, file formats
49. Colour, accessibility, and greyscale survival
50. Multi-panel figures and consistent axes
51. Figures that show uncertainty

### Part 9 — Writing it up

52. The methods section a statistician would approve
53. The results section: numbers in prose
54. Describing limitations without undermining the paper
55. Statistical language: words reviewers object to

### Part 10 — Reporting guidelines

56. Which guideline applies to your study
57. CONSORT for trials, including the flow diagram in R
58. STROBE for observational studies
59. PRISMA for systematic reviews
60. TRIPOD for prediction models

### Part 11 — Reading a review

61. Triage, the response pattern, and worked examples
    (**already written**: `Answering-Statistical-Reviewer-Comments.md`)

### Part 12 - The thirty objections

Enumerated here rather than cross-referenced, because this file is what
`build_handbook_tracker.py` parses. The `####` sub-headings below are for
readability only; the parser ignores them and reads the numbered list.

`reviewer-2-course-plan.md` remains the place for the seven-part chapter
template and the per-objection authoring notes.

#### Did you check the assumptions?

62. Normality was not assessed
63. Equal variance was not checked
64. Observations are not independent
65. Residuals are autocorrelated
66. Multicollinearity was not examined
67. Linearity was assumed rather than shown
68. The proportional hazards assumption was not tested

#### Is the design sound?

69. No power analysis and no sample size justification
70. Confounding was not addressed
71. Baseline differences between groups were not adjusted for
72. Selection bias and non-response were not discussed
73. The control group is not comparable

#### Did you go fishing?

74. Multiple comparisons were not corrected
75. Subgroup analyses were not pre-specified
76. A p-value of 0.049 is treated as a finding
77. This looks exploratory rather than confirmatory
78. A continuous variable was dichotomised without justification
79. Outliers were removed without a stated rule

#### Did you report it properly?

80. p-values are reported without effect sizes
81. Confidence intervals are missing
82. A non-significant result is described as a trend
83. Model fit statistics are not reported
84. Missing data handling is not described

#### Is the model right?

85. A parametric test was used on ordinal data
86. A mixed model should have been used
87. The link function or error distribution is not justified
88. Zero-inflation was not considered
89. There are too many predictors for the sample size
90. An interaction is claimed without testing the interaction term

#### Can anyone check this?

91. Code and data are not available

### Part 13 - Response, revision, and after

92. Writing the response letter
93. Disagreeing with a reviewer, with reasons
94. The second round, and reviewers who move the goalposts
95. Sharing code and data so the analysis is checkable
96. Corrections, and responding to post-publication criticism

---

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
