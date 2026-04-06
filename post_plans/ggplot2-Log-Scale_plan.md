# Plan: ggplot2 Log Scale in R

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | ggplot2 Log Scale in R: When & How to Transform Axes (with Examples) |
| slug | ggplot2-Log-Scale |
| description | Log scales compress wide-range data and reveal multiplicative patterns. Learn scale_x_log10(), scale_y_log10(), coord_trans(), and how to label log axes. |
| keywords | ggplot2 log scale, scale_x_log10, scale_y_log10, coord_trans log, ggplot2 axis transformation, log10 scale R, ggplot2 log axis labels, annotation_logticks, ggplot log transform |
| auto_link_terms | ggplot2 log scale\|log scale in ggplot2\|scale_x_log10()\|scale_y_log10()\|coord_trans()\|log axis\|log transformation ggplot |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-ggpl-3 |
| post_type | FR |
| sidebar_section | (none — FR) |
| sidebar_title | (none — FR) |
| sidebar_order | (none — FR) |
| fr_parent | ggplot2-Scales.html |

## B. Breadcrumb

Home > Visualization > ggplot2 Foundations > ggplot2 Log Scale in R

## C. Full Section Outline

### Lead sentence
Log scales compress wide-range data so you can see patterns that a linear axis hides. In ggplot2, `scale_x_log10()`, `scale_y_log10()`, and `coord_trans()` each handle this differently.

### Introduction (2-3 paragraphs)
- Hook: real-world data spans orders of magnitude (GDP, populations, gene expression). Linear axes crush small values into a flat line.
- What you'll learn: the three ggplot2 approaches, when each is correct, labeling tricks, handling zeros/negatives.
- Package note: ggplot2 + scales used throughout; code runs in browser.

### Core H2 sections (5):

#### H2-1: When Should You Use a Log Scale?
- Theory: right-skewed data, multiplicative relationships, orders of magnitude
- Code: histogram of `diamonds$price` showing skew, then log-scaled version
- Callout: KEY INSIGHT — log scales show multiplicative differences, not additive
- Inline exercise: check if `economics$pop` is skewed and decide if log is appropriate

#### H2-2: How Does scale_y_log10() Transform Your Plot?
- Theory: transforms data BEFORE stat calculations; affects geom_smooth, geom_boxplot
- Code: scatter of diamonds price vs carat with scale_y_log10(); show geom_smooth fits log-space
- Callout: TIP — scale_x_log10() and scale_y_log10() are shortcuts for scale_*_continuous(trans = "log10")
- Inline exercise: apply scale_x_log10() to plot carat on log scale

#### H2-3: How Does coord_trans() Differ from Scale Functions?
- Theory: transforms AFTER stat calculation; visual-only; geom_smooth still fits linear space
- Code: same scatter with coord_trans(y = "log10") — show how smooth line differs
- Side-by-side comparison code
- Callout: WARNING — coord_trans can make geom_smooth misleading because the fit was computed on untransformed data
- Inline exercise: use coord_trans on both axes

#### H2-4: How Do You Label Log-Scaled Axes Clearly?
- Theory: default labels show transformed values; readers need interpretable labels
- Code: scales::label_log() for exponent notation, scales::label_comma() for raw values, custom breaks
- guide_axis_logticks() for minor tick marks
- Callout: TIP — use label_comma() when your audience isn't math-savvy
- Inline exercise: format axis to show dollar amounts with label_dollar()

#### H2-5: How Do You Handle Zeros and Negative Values on a Log Scale?
- Theory: log(0) = -Inf, log(negative) = NaN; common with count data
- Code: pseudo-log transform via scales::pseudo_log_trans(), log1p approach
- Callout: WARNING — silently dropping zeros can bias your visualization
- Inline exercise: use pseudo_log_trans on data with zeros

### Common Mistakes (3-5):
1. Using coord_trans when you meant scale transformation (smooth line is wrong)
2. Forgetting zeros in data → blank points silently dropped
3. Mixing log10 and natural log scales without realizing (scale_y_log10 vs log_trans())
4. Setting axis limits with xlim()/ylim() instead of coord_cartesian() on log-scaled plots (removes data)

### Practice Exercises (2 capstone):
1. Create a scatter plot of diamonds price vs carat, log-scale both axes, add exponent labels and log tick marks
2. Visualize a dataset with zeros using pseudo_log_trans and compare with naive scale_y_log10

### Complete Example:
End-to-end: load diamonds, diagnose skew, pick log scale, apply scale_y_log10, label clearly, add logticks, polish

### Summary:
Table comparing scale_*_log10, coord_trans, and manual log() — when to use each

### FAQ (4):
1. Can I use log2 or natural log instead of log10?
2. What happens to zero values with scale_y_log10?
3. Should I log-transform the data or the axis?
4. How do I add minor grid lines on a log scale?

### References (6):
1. ggplot2 documentation — scale_continuous
2. ggplot2 documentation — coord_trans
3. ggplot2 documentation — guide_axis_logticks
4. scales package documentation
5. Wickham, H. — ggplot2: Elegant Graphics for Data Analysis
6. Andrew Heiss — How to use log scales in ggplot2

### What's Next (2-3):
- ggplot2 Scales (parent)
- ggplot2 Themes (customization)

## D. Diagram list

(Skipped — FR post, optional)

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load libraries + diamonds | ggplot2, scales | — | — |
| 2 | Histogram of diamonds$price (skew) | — | — | — |
| 3 | Log-scaled histogram | — | — | — |
| 4 | Scatter + scale_y_log10 with smooth | — | — | — |
| 5 | Scatter + coord_trans comparison | — | — | — |
| 6 | Side-by-side scale vs coord | — | p_scale, p_coord | — |
| 7 | Label formatting with label_log | — | — | — |
| 8 | guide_axis_logticks | — | — | — |
| 9 | Handling zeros: pseudo_log_trans | — | df_zeros | — |
| 10 | Common mistake: coord_trans + smooth | — | — | — |
| 11 | Common mistake: zeros dropped | — | — | df_zeros |
| 12 | Inline exercises (5 across sections) | — | ex_* vars | — |
| 13 | Capstone exercise 1 | — | my_* vars | — |
| 14 | Capstone exercise 2 | — | my_* vars | df_zeros |
| 15 | Complete example | — | — | — |
