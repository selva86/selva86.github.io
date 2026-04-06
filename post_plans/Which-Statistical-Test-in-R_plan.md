# Plan: Which Statistical Test in R?

## A. Frontmatter

| Field | Value |
|---|---|
| title | Which Statistical Test in R? A Decision Flowchart That Answers in 5 Questions |
| slug | Which-Statistical-Test-in-R |
| description | Answer 5 questions about your data and this decision flowchart maps you to the correct R statistical test, with runnable code and effect-size guidance. |
| keywords | which statistical test to use, statistical test decision tree, choosing statistical test R, statistical test flowchart, R hypothesis testing, parametric vs nonparametric R, t-test vs ANOVA R |
| auto_link_terms | which statistical test\|statistical test decision\|choosing a statistical test\|statistical test flowchart\|test selection guide |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | DG1 |
| post_type | FR |
| fr_parent | Choosing-Statistical-Test-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > Statistical Consulting & Decision Frameworks > Which Statistical Test in R?

## C. Full Section Outline

### Lead sentence
A statistical test decision flowchart is a visual tool that guides you from your research question to the correct hypothesis test based on your data's outcome type, number of groups, pairing structure, and distribution shape.

### Introduction (2-3 paragraphs)
- Hook: You have data, a research question, and 20+ tests to choose from — how do you pick the right one?
- What this post does: walks through 5 diagnostic questions that narrow the field to exactly one test
- What the reader will learn: the master flowchart, each test with R code, effect sizes, and when to use parametric vs non-parametric
- Base R stats package — no extra packages needed

### Core Content Sections (5 sections — each framed as a question)

#### H2 1: "What Type of Outcome Variable Do You Have?"
- Theory: Continuous vs categorical outcomes determine the entire branch of statistics
- Code block 1: Inspect data types with class(), str(), and table() on mtcars and Titanic
- Callout: KEY INSIGHT — outcome type is the single most important decision
- Inline exercise: Classify 4 variables as continuous or categorical

#### H2 2: "How Many Groups Are You Comparing?"
- Theory: 1-sample, 2-sample, 3+ samples — each has different tests
- Code block 2: Split mtcars by cyl and count groups with length(unique())
- Diagram: Figure 1 — Master Decision Flowchart (placed here)
- Callout: TIP — if 3+ groups, never do multiple t-tests; use ANOVA
- Inline exercise: Determine number of groups for a given scenario

#### H2 3: "Are Your Samples Paired or Independent?"
- Theory: Paired = same subjects measured twice; independent = different subjects
- Code block 3: Example of paired (before/after) vs independent (treatment/control) data
- Code block 4: Paired t-test vs independent t-test on sample data
- Callout: WARNING — using an independent test on paired data inflates variance
- Inline exercise: Identify whether a scenario is paired or independent

#### H2 4: "Is Your Data Normally Distributed?"
- Theory: Normality determines parametric vs non-parametric path
- Code block 5: Shapiro-Wilk test with shapiro.test() + visual QQ plot
- Diagram: Figure 2 — Parametric vs Non-Parametric Pairs
- Callout: NOTE — with n > 30, parametric tests are robust to mild non-normality (CLT)
- Inline exercise: Run shapiro.test() on a skewed dataset and decide parametric or not

#### H2 5: "What Is the Correct Test — And How Do You Measure Its Effect?"
- Theory: Mapping the 5 answers to the exact test; effect sizes give practical significance
- Code block 6: Complete reference table of tests with R functions
- Code block 7: Computing Cohen's d for a t-test manually
- Code block 8: Computing eta-squared for ANOVA manually
- Diagram: Figure 3 — Effect Size by Test Type
- Callout: KEY INSIGHT — a tiny p-value with a tiny effect size means statistically significant but practically meaningless
- Inline exercise: Calculate Cohen's d for given means and SD

### Common Mistakes (3-5)
1. Using multiple t-tests instead of ANOVA (inflated Type I error)
2. Ignoring paired structure — treating paired data as independent
3. Relying only on p-values without reporting effect sizes
4. Using parametric tests on heavily skewed small samples
5. Confusing statistical significance with practical significance

### Practice Exercises (2-3 capstone)
1. Medium: Given a dataset, walk through all 5 questions and run the correct test
2. Hard: Compare three groups, check normality, choose between ANOVA and Kruskal-Wallis, report effect size

### Complete Example
- End-to-end worked example: Research question about fuel efficiency by engine type
- Walk through all 5 questions on mtcars (mpg ~ cyl groups)
- Run ANOVA, check assumptions, compute eta-squared, interpret

### Summary
- Table: 5 questions mapped to decision branches
- Quick reference: test name | R function | effect size metric

### FAQ (5 questions)
1. Can I use a t-test if my data isn't perfectly normal?
2. What's the difference between Mann-Whitney U and Wilcoxon rank-sum?
3. How do I choose between chi-square and Fisher's exact test?
4. Should I always report effect sizes?
5. What if I have more than one outcome variable?

### References (7-8 sources)
1. R Core Team — t.test() documentation
2. R Core Team — aov() documentation
3. R Core Team — shapiro.test() documentation
4. Cohen, J. — Statistical Power Analysis for the Behavioral Sciences (1988)
5. Field, A. — Discovering Statistics Using R (2012)
6. UCLA OARC — Choosing the Correct Statistical Test
7. Wasserstein, R. & Lazar, N. — ASA Statement on P-Values (2016)

### What's Next?
1. Link to parent core post (choosing statistical test)
2. Link to regression decision guide (DG2 when published)
3. Link to hypothesis testing fundamentals

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | Which-Statistical-Test-in-R-master-flowchart.webp | Figure 1 | Master decision flowchart: answer 5 questions to find your test. | How Many Groups Are You Comparing? |
| 2 | Which-Statistical-Test-in-R-parametric-nonparametric.webp | Figure 2 | Every parametric test has a non-parametric counterpart. | Is Your Data Normally Distributed? |
| 3 | Which-Statistical-Test-in-R-effect-size-guide.webp | Figure 3 | Effect size benchmarks by test family. | What Is the Correct Test — And How Do You Measure Its Effect? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Inspect outcome type with class/str/table | — | — | mtcars (built-in) |
| 2 | Count groups with unique() | — | groups | mtcars |
| 3 | Create paired vs independent sample data | — | before, after, treatment, control | — |
| 4 | Paired t-test vs independent t-test | — | paired_result, indep_result | before, after, treatment, control |
| 5 | Shapiro-Wilk + QQ plot | — | skewed_data | — |
| 6 | Reference table of all tests with R functions | — | — | — |
| 7 | Cohen's d calculation | — | cohens_d | treatment, control |
| 8 | Eta-squared for ANOVA | — | eta_sq, aov_result | mtcars |
| 9 | Complete example: ANOVA on mtcars mpg~cyl | — | fuel_aov, fuel_eta | mtcars |
