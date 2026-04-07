---
title: "Correlation Matrix Plot in R: corrplot, ggcorrplot, and ggplot2"
slug: "Correlation-Matrix-Plot-in-R"
description: "Visualize correlation matrices in R with corrplot, ggcorrplot, and ggplot2. Learn color scales, reordering, significance masking, and how to build a polished correlation heatmap from scratch."
keywords: "correlation matrix plot R, corrplot R, ggcorrplot R, correlation heatmap R, R correlation plot, ggplot2 correlation matrix"
auto_link_terms: "correlation matrix plot in R|corrplot R|ggcorrplot|correlation heatmap R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-13
post_type: "C"
fr_parent: ggplot2-Scatter-Plots.html
sidebar_section: "Visualization"
sidebar_title: "Correlation Matrix"
---

# Correlation Matrix Plot in R: corrplot, ggcorrplot, and ggplot2

<p class="lead">A correlation matrix plot shows pairwise Pearson (or Spearman) correlations between all numeric variables in a dataset — typically as a color grid where warm colors mean strong positive correlation and cool colors mean negative correlation.</p>

## Introduction

When you have a dataset with 5-20 numeric variables, running `cor()` returns a matrix of numbers that's hard to parse at a glance. A correlation matrix plot turns that matrix into a color grid where patterns jump out immediately: clusters of highly correlated variables, variables that are negatively related, and variables that are independent.

There are three common approaches in R:

1. **ggplot2 + geom_tile()** — full manual control, no extra packages
2. **ggcorrplot** — wraps ggplot2 with sensible correlation-plot defaults (reordering, significance masking, upper/lower triangle)
3. **corrplot** — base-R graphics, extremely feature-rich for publication

This post covers all three, starting with the ggplot2 approach to understand the mechanics, then showing how ggcorrplot streamlines the workflow.

## How do you compute and reshape a correlation matrix for plotting?

Start with `cor()` to get the correlation matrix, then reshape it to long format for ggplot2.

```r
library(ggplot2)

# Use numeric columns from mtcars
num_vars <- c("mpg", "cyl", "disp", "hp", "drat", "wt", "qsec")
cor_mat  <- cor(mtcars[, num_vars], use = "complete.obs")

# Reshape to long format: one row per (var1, var2, correlation) triplet
cor_long <- as.data.frame(as.table(cor_mat))
names(cor_long) <- c("Var1", "Var2", "Correlation")

head(cor_long, 6)
```

`as.table(cor_mat)` converts the matrix to a table, and `as.data.frame()` flattens it to long format. Every pair of variables gets its own row, including the diagonal (self-correlation = 1) and both upper and lower triangle.

**Try it:** After running this, type `nrow(cor_long)` — it should equal `n_vars² = 7² = 49` rows (all pairs including self-pairs and duplicates from both triangles).

## How do you build a basic correlation heatmap with ggplot2?

Once you have long-format data, `geom_tile()` creates the color grid and `scale_fill_gradient2()` applies the diverging color scale.

```r
# Basic correlation heatmap with ggplot2
p_basic <- ggplot(cor_long, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_gradient2(
    low      = "#4393c3",   # blue = negative
    mid      = "white",
    high     = "#d6604d",   # red = positive
    midpoint = 0,
    limits   = c(-1, 1),
    name     = "Correlation"
  ) +
  labs(title = "mtcars Correlation Matrix", x = NULL, y = NULL) +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    panel.grid  = element_blank()
  )

p_basic
```

`scale_fill_gradient2()` with `midpoint = 0` and `limits = c(-1, 1)` anchors white to zero — strong positive correlations go red, strong negative go blue. The neutral variables appear white.

**Try it:** Change `low = "#4393c3"` and `high = "#d6604d"` to `low = "#2166ac"` and `high = "#b2182b"` for deeper, more saturated colors. Then try `scale_fill_viridis_c(limits = c(-1, 1), option = "RdYlBu", direction = -1)`.

## How do you use ggcorrplot for a smarter correlation plot?

`ggcorrplot` automates the tricky parts: hierarchical reordering of variables (grouping correlated variables together), masking the redundant triangle, and p-value significance filtering.

```r
library(ggcorrplot)

# ggcorrplot: reorder by hierarchical clustering, show upper triangle
p_ggcorr <- ggcorrplot(
  cor_mat,
  method   = "square",       # or "circle" for circle-sized plot
  type     = "upper",        # show upper triangle only
  hc.order = TRUE,           # reorder by hierarchical clustering
  lab      = TRUE,           # show correlation values
  lab_size = 3,
  colors   = c("#4393c3", "white", "#d6604d"),
  outline.color = "white",
  ggtheme  = theme_minimal()
) +
  labs(title = "mtcars Correlation Matrix (Clustered)")

p_ggcorr
```

`hc.order = TRUE` clusters variables so highly correlated ones sit near each other — making patterns (like the `cyl`, `disp`, `hp`, `wt` cluster) visually obvious. `type = "upper"` shows only the upper triangle, eliminating the redundant mirror image.

**Try it:** Change `method = "square"` to `method = "circle"` — circles sized by correlation magnitude instead of solid colored squares. Which communicates the strength of weak correlations more clearly?

## How do you show only the upper or lower triangle?

Showing both triangles is redundant (the matrix is symmetric). Use `type = "upper"` in ggcorrplot, or manually filter in the ggplot2 approach.

```r
# Upper triangle only in ggcorrplot
p_upper <- ggcorrplot(
  cor_mat,
  type     = "upper",
  hc.order = TRUE,
  lab      = TRUE,
  lab_size = 3.5,
  colors   = c("#4393c3", "white", "#d6604d"),
  outline.color = "grey80",
  tl.cex   = 11,     # axis label font size
  tl.srt   = 45,     # axis label rotation
  ggtheme  = theme_minimal(base_size = 12)
) +
  labs(
    title    = "Pairwise Correlations — mtcars",
    subtitle = "Upper triangle | Clustered by similarity"
  ) +
  theme(
    plot.title    = element_text(face = "bold"),
    plot.subtitle = element_text(color = "grey50", size = 10)
  )

p_upper
```

**Try it:** Add `p.mat = cor_pmat(cor_mat)` and `sig.level = 0.05` inside `ggcorrplot()` — this masks correlations that are not statistically significant (p > 0.05) with an X mark, so readers know which correlations are reliable.

## How do you add correlation value labels to tiles?

Labels inside tiles let readers see exact values without needing to reference a color scale. The key is switching text color for dark tiles so labels remain readable.

```r
# Add correlation labels, switching color for contrast
cor_long$abs_cor <- abs(cor_long$Correlation)

p_labels <- ggplot(cor_long, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile(color = "white", linewidth = 0.5) +
  geom_text(
    aes(
      label = round(Correlation, 2),
      color = abs_cor > 0.5   # white text on strong-colored tiles
    ),
    size = 3
  ) +
  scale_fill_gradient2(
    low = "#4393c3", mid = "white", high = "#d6604d",
    midpoint = 0, limits = c(-1, 1), name = "r"
  ) +
  scale_color_manual(
    values = c("FALSE" = "grey30", "TRUE" = "white"),
    guide  = "none"
  ) +
  labs(title = "Correlation Matrix with Labels", x = NULL, y = NULL) +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    panel.grid  = element_blank()
  )

p_labels
```

`color = abs_cor > 0.5` switches between white text (for dark tiles with strong correlations) and grey text (for pale tiles near zero). This is the same technique used in the Heatmap-in-R post.

**Try it:** Change the threshold from `0.5` to `0.3` — more tiles get white text. Find the threshold that gives the best contrast for your color palette.

## Complete Example: Publication-Ready Correlation Plot

```r
# Polished upper-triangle correlation plot with significance
cor_p <- cor_pmat(mtcars[, num_vars])   # p-value matrix from ggcorrplot

p_final <- ggcorrplot(
  cor_mat,
  type          = "upper",
  hc.order      = TRUE,
  method        = "square",
  lab           = TRUE,
  lab_size      = 3.2,
  p.mat         = cor_p,
  sig.level     = 0.05,         # mask non-significant correlations
  insig         = "blank",      # show blank for non-significant
  colors        = c("#2166ac", "white", "#b2182b"),
  outline.color = "white",
  tl.cex        = 11,
  tl.srt        = 45,
  ggtheme       = theme_minimal(base_size = 12)
) +
  labs(
    title    = "Correlation Matrix — mtcars Variables",
    subtitle = "Only statistically significant correlations shown (p < 0.05, FDR not applied)",
    caption  = "Clustered by hierarchical grouping | Upper triangle only"
  ) +
  theme(
    plot.title    = element_text(face = "bold", size = 14),
    plot.subtitle = element_text(color = "grey50", size = 10),
    plot.caption  = element_text(color = "grey60", size = 9),
    legend.position = "right"
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Not using a diverging color scale

❌ A sequential scale (e.g., `scale_fill_viridis_c()`) has no clear midpoint at zero, making it hard to tell positive from negative correlations.

✅ Always use a diverging scale anchored at 0:

```r
scale_fill_gradient2(low = "#4393c3", mid = "white", high = "#d6604d", midpoint = 0)
```

### Mistake 2: Including non-numeric columns in cor()

`cor()` fails if any column is non-numeric. Always subset to numeric columns first.

```r
# Correct: subset to numeric only
num_df <- mtcars[, sapply(mtcars, is.numeric)]
cor_mat <- cor(num_df)
```

### Mistake 3: Not setting limits = c(-1, 1) in the color scale

Without explicit limits, the scale anchors to the min and max of your data — not to -1 and 1. A maximum correlation of 0.95 would push the color scale, making 0.7 look "light" when it's actually strong.

```r
scale_fill_gradient2(..., limits = c(-1, 1))
```

### Mistake 4: Showing both triangles

The correlation matrix is symmetric (r(A,B) = r(B,A)). Showing both triangles doubles every value and wastes space. Use `type = "upper"` in ggcorrplot or filter `cor_long` to `Var1 < Var2`.

### Mistake 5: Ignoring the diagonal

The diagonal is always 1.0 (self-correlation) and adds no information. Remove it: `cor_long <- cor_long[cor_long$Var1 != cor_long$Var2, ]`.

## Practice Exercises

### Exercise 1: iris correlation heatmap

Using the `iris` dataset (numeric columns only: `Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`), compute the correlation matrix and create a full ggplot2 heatmap with correlation labels. Use a blue-white-red diverging palette.

<details>
<summary>Show solution</summary>

```r
library(ggplot2)

iris_num  <- iris[, 1:4]
cor_iris  <- cor(iris_num)
cor_long  <- as.data.frame(as.table(cor_iris))
names(cor_long) <- c("Var1", "Var2", "Correlation")
cor_long$abs_r <- abs(cor_long$Correlation)

ggplot(cor_long, aes(x = Var1, y = Var2, fill = Correlation)) +
  geom_tile(color = "white", linewidth = 0.6) +
  geom_text(aes(label = round(Correlation, 2),
                color = abs_r > 0.5),
            size = 3.5) +
  scale_fill_gradient2(
    low = "#4393c3", mid = "white", high = "#d6604d",
    midpoint = 0, limits = c(-1, 1), name = "r"
  ) +
  scale_color_manual(values = c("FALSE" = "grey30", "TRUE" = "white"),
                     guide = "none") +
  labs(title = "iris Correlation Matrix", x = NULL, y = NULL) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1),
        panel.grid = element_blank())
```

</details>

### Exercise 2: ggcorrplot with significance masking

Using `mtcars` (all numeric columns), create a ggcorrplot showing only the upper triangle, clustered by hierarchical ordering. Mask non-significant correlations (p > 0.05) with blank tiles.

<details>
<summary>Show solution</summary>

```r
library(ggcorrplot)

num_df  <- mtcars[, sapply(mtcars, is.numeric)]
cor_mat <- cor(num_df)
p_mat   <- cor_pmat(num_df)

ggcorrplot(
  cor_mat,
  type      = "upper",
  hc.order  = TRUE,
  method    = "square",
  lab       = TRUE,
  lab_size  = 3,
  p.mat     = p_mat,
  sig.level = 0.05,
  insig     = "blank",
  colors    = c("#2166ac", "white", "#b2182b"),
  outline.color = "white",
  ggtheme   = theme_minimal()
) +
  labs(title = "mtcars Correlations (p < 0.05 only)")
```

</details>

## Summary

| Approach | Package | Best for |
|---|---|---|
| `geom_tile()` | ggplot2 | Full manual control, custom layouts |
| `ggcorrplot()` | ggcorrplot | Quick, clustered, significance-aware |
| `corrplot()` | corrplot | Base-R, many visual styles (circle, ellipse, pie) |

| Key function | Purpose |
|---|---|
| `cor(df)` | Compute Pearson correlation matrix |
| `cor(df, method = "spearman")` | Spearman (rank-based) correlations |
| `as.data.frame(as.table(cor_mat))` | Reshape matrix to long format |
| `scale_fill_gradient2(midpoint = 0)` | Diverging color scale anchored at zero |
| `cor_pmat(df)` | Compute p-value matrix (from ggcorrplot) |
| `ggcorrplot(..., hc.order = TRUE)` | Reorder by hierarchical clustering |

## FAQ

**What is the difference between Pearson and Spearman correlation in these plots?**
Pearson measures linear association; Spearman measures monotonic (rank-based) association and is robust to outliers. Use `cor(df, method = "spearman")` to switch. For ordinal data or skewed distributions, Spearman is usually preferred.

**How do I reorder variables manually instead of by clustering?**
Before plotting, reorder `Var1` and `Var2` factors: `cor_long$Var1 <- factor(cor_long$Var1, levels = c("var_a", "var_b", ...))`. The plot will respect the factor level order.

**Why does my ggcorrplot show "X" marks on some tiles?**
You've passed `p.mat` with `insig = "pch"` — X marks indicate non-significant correlations (p > sig.level). Switch to `insig = "blank"` to show blanks, or `insig = "n"` to show nothing and display all correlations.

**Can I add a scatter plot matrix alongside the correlation heatmap?**
Yes — the `GGally::ggpairs()` function creates a scatterplot matrix with correlations in the upper triangle, distributions on the diagonal, and scatter plots in the lower triangle. It combines visual exploration with correlation values.

**How do I handle missing data in cor()?**
`cor()` returns NA for any pair that has NAs. Use `use = "complete.obs"` (listwise deletion) or `use = "pairwise.complete.obs"` (pairwise deletion) to handle missing values.

## References

- ggcorrplot documentation: sthda.com/english/wiki/ggcorrplot
- corrplot CRAN vignette: cran.r-project.org/web/packages/corrplot
- Wickham H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer.
- Wilke C. (2019). *Fundamentals of Data Visualization* — Chapter 12: Visualizing associations

## What's Next?

- **Heatmap in R** — the general case: any matrix as a color grid with geom_tile()
- **ggplot2 Scatter Plots** — explore bivariate relationships between individual variable pairs
- **R Statistical Tests** — back up what the correlation plot shows with formal hypothesis tests
