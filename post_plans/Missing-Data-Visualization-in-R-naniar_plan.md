# Post Plan: Missing Data Visualization in R — naniar

## A. Frontmatter

| Field | Value |
|---|---|
| title | Visualise Your Missing Data in R: naniar Reveals Patterns in 3 Lines |
| slug | Missing-Data-Visualization-in-R-naniar |
| description | naniar's vis_miss(), gg_miss_var(), and upset plots show where NAs hide, how many exist, and whether they cluster -- guiding your imputation strategy. |
| keywords | missing data visualization R, naniar package, vis_miss, gg_miss_var, gg_miss_upset, geom_miss_point, missing data patterns R, visualize NA R, MCAR MAR MNAR |
| auto_link_terms | naniar package|vis_miss()|gg_miss_var()|gg_miss_upset()|missing data visualization|geom_miss_point()|visualize missing data |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.4.7 |
| post_type | C |
| sidebar_section | Statistics |
| sidebar_title | Missing Data Viz (naniar) |
| sidebar_order | 10 |

## B. Breadcrumb

Home > Statistics > Missing Data > Missing Data Visualization in R: naniar

## C. Full Section Outline

### Lead sentence
naniar is an R package that turns invisible NA values into clear, publication-ready visualizations so you can see where data is missing, how much is missing, and whether the gaps follow a pattern.

### Introduction (2-3 paragraphs)
- Hook: You can't fix what you can't see. Most analysts jump straight to imputation without looking at their missing data first.
- What: naniar provides a grammar of missingness built on ggplot2 — a handful of functions that visualize NA patterns at the variable, case, and intersection level.
- What you'll learn: vis_miss() heatmaps, gg_miss_var() bar charts, gg_miss_upset() intersection plots, geom_miss_point() scatter extensions, and how to connect patterns to MCAR/MAR/MNAR mechanisms.
- Diagram: workflow (Figure 3)

### Core H2 Sections

#### H2-1: What are the three missing data mechanisms (MCAR, MAR, MNAR)?
- Theory: Define MCAR, MAR, MNAR with plain-language analogies
- Diagram: mechanism typology (Figure 1)
- Code: Create a sample dataset with different missingness patterns using base R
- Callout: KEY INSIGHT — mechanism determines valid imputation method
- Inline exercise: Classify three real-world scenarios as MCAR/MAR/MNAR

#### H2-2: How does vis_miss() reveal the big picture of your missing data?
- Theory: Heatmap overview — rows x columns, black = missing
- Code: library(naniar) + vis_miss(airquality)
- Code: vis_miss(airquality, sort_miss = TRUE, cluster = TRUE)
- Callout: TIP — sort_miss + cluster to find patterns visually
- Inline exercise: Run vis_miss on riskfactors dataset and interpret

#### H2-3: How does gg_miss_var() rank variables by missingness?
- Theory: Bar chart showing count or % of NAs per variable
- Code: gg_miss_var(airquality) and gg_miss_var(airquality, show_pct = TRUE)
- Code: gg_miss_var(airquality, facet = Month) for group comparison
- Callout: TIP — facet argument reveals group-level patterns
- Inline exercise: Create gg_miss_var with show_pct and facet by Month

#### H2-4: How does gg_miss_upset() expose co-occurrence patterns?
- Theory: Upset plots show which combinations of variables are jointly missing
- Code: gg_miss_upset(airquality)
- Code: gg_miss_upset(riskfactors, nsets = 5)
- Callout: KEY INSIGHT — co-occurring missingness suggests MAR or MNAR, not MCAR
- Inline exercise: Run gg_miss_upset on a different dataset

#### H2-5: How does geom_miss_point() make NAs visible in scatter plots?
- Theory: Shifts NA values below the data range so you see their distribution
- Code: ggplot(airquality, aes(Ozone, Solar.R)) + geom_miss_point()
- Code: faceted version by Month
- Callout: WARNING — shifted points are not real values, just visual placeholders
- Inline exercise: Create a geom_miss_point scatter with color = Month

#### H2-6: How do gg_miss_case() and miss_var_summary() give you numeric summaries?
- Theory: Row-level and variable-level numeric summaries
- Code: gg_miss_case(airquality), miss_var_summary(airquality), miss_case_summary(airquality)
- Diagram: function overview (Figure 2)
- Callout: NOTE — naniar's summary functions return tidy tibbles you can pipe into further analysis
- Inline exercise: Find the row with the most missing values

### Tail Sections

#### Common Mistakes (3-5)
1. Deleting rows without checking mechanism (MNAR deletion biases results)
2. Using na.rm = TRUE everywhere instead of investigating patterns first
3. Interpreting geom_miss_point shifted positions as real values
4. Running vis_miss on huge datasets without sampling first
5. Assuming all NA columns are independent

#### Practice Exercises (2-3 capstone)
1. Medium: Load riskfactors, create vis_miss + gg_miss_var + gg_miss_upset pipeline
2. Hard: Compare missingness patterns across groups using faceting and identify likely mechanism
3. Hard: Write a function that takes a data frame and returns a missingness report

#### Complete Example
End-to-end: load airquality, inspect structure, vis_miss, gg_miss_var, gg_miss_upset, geom_miss_point, interpret mechanism, decide on imputation strategy.

#### Summary
Table of naniar functions and when to use each.

#### FAQ (3-5)
1. Can naniar handle large datasets efficiently?
2. What is the difference between naniar and visdat?
3. How do I export naniar plots for publication?
4. Does naniar work with non-NA missing codes like -999 or ""?
5. Can I use naniar with data.table?

#### References (5-10)
1. Tierney & Cook — Expanding tidy data principles to missing data (JSS 2023)
2. naniar CRAN documentation
3. naniar visualization gallery
4. Rubin — Multiple Imputation for Nonresponse in Surveys (1987)
5. Little & Rubin — Statistical Analysis with Missing Data (2019)
6. R for Data Science — Missing values chapter

#### What's Next
1. Missing Values in R: Detect, Count, Remove, and Impute NA
2. mice package tutorial (upcoming)

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Missing-Data-Visualization-in-R-naniar-mechanism-typology.webp | Figure 1 | MCAR, MAR, and MNAR differ by what drives the missingness. | What are the three missing data mechanisms? |
| 2 | Missing-Data-Visualization-in-R-naniar-function-overview.webp | Figure 2 | naniar organizes visualization functions by scope: big picture, patterns, and relationships. | How do gg_miss_case() and miss_var_summary() give you numeric summaries? |
| 3 | Missing-Data-Visualization-in-R-naniar-workflow.webp | Figure 3 | The missing data analysis workflow: visualize first, identify mechanism, then choose a strategy. | Introduction |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load naniar + inspect airquality | naniar, ggplot2 | aq | — |
| 2 | Create sample data with different mechanisms | — | df_mcar, df_mar | — |
| 3 | vis_miss basic | — | — | aq |
| 4 | vis_miss with sort + cluster | — | — | aq |
| 5 | gg_miss_var basic + pct | — | — | aq |
| 6 | gg_miss_var with facet | — | — | aq |
| 7 | gg_miss_upset basic | — | — | aq |
| 8 | gg_miss_upset with nsets | — | — | aq |
| 9 | geom_miss_point basic | — | — | aq |
| 10 | geom_miss_point faceted | — | — | aq |
| 11 | gg_miss_case + summaries | — | var_summary, case_summary | aq |
| 12-14 | Common Mistakes examples | — | various | — |
| 15-17 | Practice exercises | — | my_* | aq |
| 18 | Complete example pipeline | — | report_* | aq |
