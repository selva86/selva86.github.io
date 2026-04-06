# Plan: Statistical Report Writing in R

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | Write Statistical Reports in R That Non-Statisticians Actually Understand |
| slug | Statistical-Report-Writing-in-R |
| description | Learn to translate R output into clear prose -- report effect sizes not just p-values, use tables and plots that communicate uncertainty, and write reproducible methods sections. |
| keywords | statistical report writing R, report statistics R, broom package R, effect size reporting, confidence intervals R, APA reporting R, translate R output, non-technical statistical report |
| auto_link_terms | statistical report writing|report statistics in R|broom tidy()|reporting effect sizes|statistical reporting |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 2.10.4 |
| post_type | C |
| sidebar_section | Statistics |
| sidebar_title | Statistical Report Writing |
| sidebar_order | 13 |

## B. Breadcrumb

Home > Data Wrangling > Consulting > Write Statistical Reports in R That Non-Statisticians Actually Understand

## C. Full Section Outline

### Lead sentence
Statistical report writing in R means translating raw model output into clear, structured prose that communicates what the data shows, how certain you are, and what it means for decision-makers who may never touch R.

### Introduction (## Introduction)
- Hook: You run a regression, get a wall of numbers, and your manager asks "so what does that mean?" The gap between R output and a useful report is where most analysts struggle.
- What: This tutorial teaches you to take raw R output and turn it into polished, honest reports.
- Why: Because p-values alone don't tell stakeholders what to do. Effect sizes, confidence intervals, and clear prose do.
- What you'll learn: Using broom to tidy model output, writing effect sizes in plain language, building tables and plots that communicate uncertainty, and writing reproducible methods sections.
- Packages: base R + broom (runs in browser).

### Core H2 Sections (5 sections, question-form):

#### 1. ## Why Do Most Statistical Reports Fail to Communicate?
- Theory: The gap between statistical output and stakeholder understanding. Common failures: reporting p-values without effect sizes, dumping raw R output, using jargon.
- Code block 1: Run a t-test, show the raw output, demonstrate how cryptic it looks.
- Code block 2: Show same result translated into a one-sentence summary.
- Diagram: Figure 1 (overview mindmap) placed here.
- Callout: KEY INSIGHT -- A good statistical report answers "how big?" and "how sure?" not just "is it significant?"
- Inline exercise: Write a one-sentence summary of a correlation test result.

#### 2. ## How Does broom Turn Messy Output into Tidy Tables?
- Theory: broom's three verbs -- tidy(), glance(), augment(). Why tidy output is the bridge to good reports.
- Code block 3: Fit a linear model, show summary() output (messy).
- Code block 4: Apply broom::tidy() to the same model, show the clean tibble.
- Code block 5: Apply broom::glance() for model-level stats.
- Diagram: Figure 2 (reporting pipeline) placed here.
- Callout: TIP -- Always extract coefficients with tidy() before formatting -- it gives you a data frame you can filter, sort, and format.
- Inline exercise: Use tidy() on an anova() result and identify the significant term.

#### 3. ## What Should You Report for Each Statistical Test?
- Theory: Different tests require different reporting elements. t-test: mean difference + CI + Cohen's d. Regression: coefficients + CI + R-squared. ANOVA: F-stat + p + eta-squared. Correlation: r + CI + n.
- Code block 6: t-test with effect size calculation and formatted output.
- Code block 7: Regression coefficients with confidence intervals.
- Code block 8: Correlation with CI.
- Diagram: Figure 3 (what-to-report) placed here.
- Callout: WARNING -- Reporting only p-values without effect sizes is like saying "the medicine works" without saying "it reduces fever by 0.2 degrees."
- Inline exercise: Calculate and report Cohen's d for a two-sample comparison.

#### 4. ## How Do You Build Tables and Plots That Show Uncertainty?
- Theory: Tables should show estimates + CI, not just point estimates. Coefficient plots and forest plots communicate uncertainty visually.
- Code block 9: Build a formatted coefficient table with CI columns.
- Code block 10: Create a coefficient plot (dot-and-whisker) using base R.
- Code block 11: Forest plot for multiple comparisons.
- Callout: TIP -- Always include confidence intervals in tables. A table without CIs is like a weather forecast without a range.
- Inline exercise: Add confidence intervals to a summary table of group means.

#### 5. ## How Do You Write a Reproducible Methods Section?
- Theory: What belongs in a methods section -- model choice rationale, assumption checks, software version. How to make it reproducible.
- Code block 12: Check regression assumptions (normality, homoscedasticity) and capture results.
- Code block 13: Generate a complete methods paragraph programmatically.
- Callout: NOTE -- Include the R version and package versions in your methods section. Use sessionInfo() or R.version.string.
- Inline exercise: Write a methods paragraph for a chi-squared test on a given dataset.

### Common Mistakes (## Common Mistakes and How to Fix Them)
1. Reporting only p-values without effect sizes
2. Copy-pasting raw R console output into reports
3. Using "significant" without specifying significance level or practical significance
4. Reporting too many decimal places (8 digits when 2 suffice)
5. Forgetting to report sample sizes and degrees of freedom

### Practice Exercises (## Practice Exercises) -- 3 capstone exercises
1. Exercise 1: Complete reporting pipeline -- fit model, tidy, format table, write summary paragraph (medium)
2. Exercise 2: Compare two models and write a report paragraph explaining which is better and why (hard)
3. Exercise 3: Given raw ANOVA output, produce a formatted table + prose summary with effect sizes (hard)

### Complete Example (## Putting It All Together)
- End-to-end: research question -> fit model -> tidy output -> formatted table -> coefficient plot -> prose summary -> methods paragraph. Uses mtcars dataset.

### Summary (## Summary)
- Table of key takeaways: what to report, tools to use, common mistakes to avoid.

### FAQ (## FAQ)
1. Do I need broom, or can I extract results manually?
2. How many decimal places should I report?
3. Should I always report confidence intervals?
4. What if my audience wants p-values even though effect sizes matter more?
5. How do I report non-significant results without saying "no effect"?

### References (## References)
1. broom package documentation -- https://broom.tidymodels.org/
2. APA Publication Manual, 7th ed. -- reporting standards
3. Wickham, H. -- broom: An R Package for Converting Statistical Analysis Objects Into Tidy Data Frames (2014) -- https://arxiv.org/abs/1412.3565
4. Sullivan & Feinn -- Using Effect Size (2012) -- PMC
5. R Core Team -- An Introduction to R -- https://cran.r-project.org/doc/manuals/r-release/R-intro.html
6. Cumming, G. -- The New Statistics: Why and How (2014) -- Psychological Science
7. Guide to Effect Sizes and Confidence Intervals -- https://matthewbjane.quarto.pub/guide-to-effect-sizes-and-confidence-intervals/
8. report package (easystats) -- https://easystats.github.io/report/

### What's Next (## What's Next?)
1. Communicating Uncertainty -- deeper dive into uncertainty visualization
2. Linear Regression -- the statistical foundation behind the models we report on
3. Statistical Tests -- comprehensive guide to choosing and running tests

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Statistical-Report-Writing-in-R-overview-mindmap.webp | Figure 1 | The four pillars of statistical report writing: tidy output, prose translation, visual evidence, and reproducible methods. | Why Do Most Statistical Reports Fail to Communicate? |
| 2 | Statistical-Report-Writing-in-R-reporting-pipeline.webp | Figure 2 | The pipeline from raw R output to a report-ready summary. | How Does broom Turn Messy Output into Tidy Tables? |
| 3 | Statistical-Report-Writing-in-R-what-to-report.webp | Figure 3 | What to report for each common statistical test. | What Should You Report for Each Statistical Test? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Run a t-test, show raw output | broom | sleep_test | -- |
| 2 | Translate t-test to one-sentence summary | -- | -- | sleep_test |
| 3 | Fit linear model, show messy summary() | -- | car_model | -- |
| 4 | broom::tidy() on the model | -- | tidy_coefs | car_model |
| 5 | broom::glance() for model-level stats | -- | model_fit | car_model |
| 6 | t-test with effect size (Cohen's d) | -- | wt_test, cohens_d | -- |
| 7 | Regression coefficients with CI | -- | coef_table | car_model |
| 8 | Correlation with CI | -- | cor_result | -- |
| 9 | Formatted coefficient table | -- | report_table | car_model, tidy_coefs |
| 10 | Coefficient plot (base R) | -- | -- | tidy_coefs |
| 11 | Forest plot for group comparisons | -- | group_results | -- |
| 12 | Assumption checks | -- | resids | car_model |
| 13 | Methods paragraph generation | -- | methods_text | car_model, model_fit |
| 14 | Complete example end-to-end | -- | full_model, full_tidy, full_glance | -- |

Estimated word count: ~4500-5000
