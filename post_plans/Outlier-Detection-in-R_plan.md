# Plan: Outlier Detection in R

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | Outlier Detection in R: Four Methods and the One Question You Must Ask First |
| slug | Outlier-Detection-in-R |
| description | Outliers are extreme, erroneous, or interesting — the approach depends on which. Learn IQR fences, Z-scores, Mahalanobis distance, and when to remove. |
| keywords | outlier detection in R, IQR outlier method R, Z-score outlier R, Mahalanobis distance R, remove outliers R, boxplot outliers, outlier treatment, detect outliers R |
| auto_link_terms | outlier detection in R\|IQR outlier method\|Z-score outlier\|Mahalanobis distance\|outlier treatment\|detect outliers\|boxplot.stats()\|mahalanobis() |
| auto_link_case_sensitive | false |
| mathjax | true |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.4.6 |
| post_type | C |
| sidebar_section | Statistics |
| sidebar_title | Outlier Detection |
| sidebar_order | 10 |

## B. Breadcrumb

Home > Data Wrangling > Data Cleaning & Quality > Outlier Detection in R

## C. Full Section Outline

### Lead sentence
An outlier is a data point that falls far outside the expected range of values — but whether you remove it depends on whether it is erroneous, extreme, or genuinely interesting.

### Introduction (2-3 paragraphs)
- Hook: A single outlier can double your regression slope or halve your p-value. Before removing it, you need to answer one question: is it wrong, extreme, or interesting?
- What: Four detection methods (visual boxplot, IQR fences, Z-scores, Mahalanobis distance) + a decision framework
- What you'll learn: detect outliers in one and many variables, decide whether to keep or remove, document your choice
- Base R approach throughout (no external packages needed for core methods)

### Core H2 Sections (5 sections, all question-form)

#### H2 1: "What is an outlier, and why does it matter?"
- Theory: Definition of outlier, three types (error, extreme, interesting)
- Demonstrate effect on mean vs median with example data
- Code: create vector with outlier, show mean/median shift
- Callout: KEY INSIGHT — outliers affect the mean but not the median
- Inline exercise: create a vector with an outlier, compute mean and median

#### H2 2: "How do you spot outliers visually with boxplots?"
- Theory: boxplot anatomy (Q1, median, Q3, whiskers, outlier dots)
- Code: boxplot(airquality$Ozone), identify the dots
- Code: boxplot.stats() to extract outlier values programmatically
- Diagram: IQR fence diagram (Figure 2)
- Callout: TIP — use boxplot.stats()$out to get outlier values directly
- Inline exercise: make a boxplot of airquality$Wind and list the outlier values

#### H2 3: "How does the IQR fence method detect outliers?"
- Theory: Q1, Q3, IQR = Q3 - Q1, fences at Q1 - 1.5*IQR and Q3 + 1.5*IQR
- Math: formula with LaTeX
- Code: manual IQR fence calculation on airquality$Ozone
- Code: flag and count outliers
- Callout: WARNING — IQR works without normality assumption; Z-score does not
- Inline exercise: compute IQR fences for airquality$Solar.R

#### H2 4: "When should you use Z-scores instead of IQR?"
- Theory: Z-score = (x - mean) / sd, threshold of 2 or 3
- Math: Z-score formula with LaTeX
- Code: compute Z-scores for airquality$Ozone, flag |z| > 3
- Compare Z-score vs IQR results
- Callout: WARNING — Z-scores assume roughly normal data
- Diagram: method picker flowchart (Figure 3)
- Inline exercise: compute Z-scores for airquality$Temp, find any beyond +/- 2

#### H2 5: "How does Mahalanobis distance detect multivariate outliers?"
- Theory: univariate methods miss multivariate outliers, Mahalanobis accounts for correlation
- Math: Mahalanobis distance formula (simplified)
- Code: compute Mahalanobis distance for airquality (Ozone + Solar.R + Wind + Temp)
- Code: flag outliers using chi-squared threshold
- Callout: KEY INSIGHT — a point can be normal on every variable individually but extreme in combination
- Inline exercise: compute Mahalanobis distance for mtcars[, c("mpg", "hp", "wt")]

### Tail Sections

#### Common Mistakes (4 mistakes)
1. Removing outliers without checking if they are data entry errors
2. Using Z-scores on heavily skewed data
3. Applying univariate methods to multivariate problems
4. Removing outliers to "improve" results (p-hacking)

#### Practice Exercises (3 capstone)
1. Medium: Detect outliers in mtcars$qsec using both IQR and Z-score, compare which points each method flags
2. Hard: Build a function that accepts a numeric vector and a method ("iqr" or "zscore") and returns the outlier values
3. Hard: Detect multivariate outliers in iris (Sepal.Length, Sepal.Width, Petal.Length, Petal.Width) per species

#### Complete Example
- End-to-end: load airquality, detect univariate outliers (IQR), detect multivariate outliers (Mahalanobis), decide which to keep, document

#### Summary
- Table: method | when to use | assumption | R function
- Bullet: always document your decision

#### FAQ (5 questions)
1. Should I always remove outliers before modeling?
2. What is the difference between 1.5*IQR and 3*IQR fences?
3. Can I use Mahalanobis distance with categorical variables?
4. How do outliers affect linear regression specifically?
5. Is there an R package that automates outlier detection?

#### References (7 sources)
1. R Core Team — boxplot.stats() documentation
2. R Core Team — mahalanobis() documentation
3. Wickham, H. — ggplot2 boxplot reference
4. NIST Engineering Statistics Handbook — Detection of Outliers
5. Leys et al. (2013) — Detecting outliers: Do not use standard deviation around the mean, use absolute deviation around the median (Journal of Experimental Social Psychology)
6. Aggarwal, C.C. — Outlier Analysis, 2nd ed. Springer (2017)
7. Rousseeuw, P.J. & van Zomeren, B.C. (1990) — Unmasking Multivariate Outliers and Leverage Points

#### What's Next
1. Missing Values in R — learn how to handle the NAs that often accompany outlier removal
2. Linear Regression — see how outliers influence slope and R-squared
3. Statistical Tests in R — understand assumptions that outliers can violate

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Outlier-Detection-in-R-decision-flowchart.webp | Figure 1 | Decision flowchart: should you remove, keep, or report both? | Introduction |
| 2 | Outlier-Detection-in-R-iqr-fence.webp | Figure 2 | IQR fence method: values beyond Q1 - 1.5*IQR or Q3 + 1.5*IQR are flagged as outliers. | How do you spot outliers visually with boxplots? |
| 3 | Outlier-Detection-in-R-method-picker.webp | Figure 3 | Which outlier detection method to use based on data shape and variable count. | When should you use Z-scores instead of IQR? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Create sample data with outlier, show mean/median impact | — | scores, scores_clean | — |
| 2 | Boxplot of airquality$Ozone | — | — | — |
| 3 | boxplot.stats() to extract outliers | — | ozone_stats, ozone_outliers | — |
| 4 | Manual IQR fence calculation | — | ozone, Q1, Q3, IQR_val, lower, upper, iqr_outliers | — |
| 5 | Flag and count IQR outliers | — | n_outliers | ozone, lower, upper |
| 6 | Z-score computation and flagging | — | z_scores, z_outliers | ozone |
| 7 | Compare Z-score vs IQR results | — | — | iqr_outliers, z_outliers |
| 8 | Mahalanobis distance on airquality | — | aq_complete, maha_dist, maha_outliers | — |
| 9 | Inline exercise scaffolds (5) | — | ex_* vars | — |
| 10 | Complete example | — | aq_clean, uni_out, multi_out | — |
| 11-13 | Capstone exercises (3) | — | my_* vars | — |

**Estimated word count:** ~4,500-5,000 words
**Code blocks:** ~15 (including exercises)
**Diagrams:** 3
