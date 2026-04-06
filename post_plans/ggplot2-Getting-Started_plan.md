# Plan: ggplot2 Getting Started

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | ggplot2 for Beginners: Build 5 Real Charts in 30 Minutes — Zero Experience Needed |
| slug | ggplot2-Getting-Started |
| description | Make a scatter plot, bar chart, histogram, line chart, and boxplot in ggplot2. Every line of code explained — the fastest genuine introduction to ggplot2. |
| keywords | ggplot2 getting started, ggplot2 tutorial, ggplot2 beginners, ggplot2 scatter plot, ggplot2 bar chart, ggplot2 histogram, ggplot2 line chart, ggplot2 boxplot |
| auto_link_terms | ggplot2 getting started\|ggplot2 tutorial\|ggplot2 basics\|ggplot2 for beginners\|geom_point()\|geom_bar()\|geom_histogram()\|geom_line()\|geom_boxplot() |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.2 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | ggplot2 Getting Started |
| sidebar_order | 6 |
| fr_parent | null |

## B. Breadcrumb

Home > Visualization > The Grammar of Graphics > ggplot2 for Beginners: Build 5 Real Charts in 30 Minutes

## C. Full Section Outline

### Lead sentence
ggplot2 is R's most popular plotting package — it turns data frames into publication-quality charts with a consistent, layered grammar you can learn in one sitting.

### Introduction (2-3 paragraphs)
- Hook: You have data in R and you want a chart. Base R's plot() works, but the code gets ugly fast. ggplot2 gives you a clean, composable system.
- What ggplot2 is: a tidyverse package that implements Leland Wilkinson's Grammar of Graphics. Every chart = data + aesthetics + geometry.
- What you'll build: 5 real charts (scatter, bar, histogram, line, boxplot) using built-in datasets. All code runs in the browser — no setup needed.

### Core H2 1: How Does the Grammar of Graphics Work?
- Theory: The 3-layer mental model — data, aesthetics (what maps to what), geometry (how it's drawn). Every ggplot call follows `ggplot(data, aes(...)) + geom_*()`.
- Code block 1: Minimal scatter plot with mpg dataset to show the pattern.
- Diagram: Figure 2 — Grammar of Graphics Layers (grammar-layers.webp)
- Callout: KEY INSIGHT — Every ggplot chart is built the same way.
- Inline exercise: Create a basic ggplot with aes(x=displ, y=cty) + geom_point().

### Core H2 2: How Do You Make a Scatter Plot with geom_point()?
- Theory: Scatter plots show relationships between two numeric variables. Map color, size, shape to categorical/numeric columns.
- Code block 2: Scatter with color by class.
- Code block 3: Scatter with size by cyl and custom labels.
- Callout: TIP — Use alpha for overlapping points.
- Inline exercise: Map color to drv and add a title.

### Core H2 3: How Do You Build a Bar Chart with geom_bar()?
- Theory: Bar charts count categorical values. geom_bar() counts rows; geom_col() uses pre-computed heights.
- Code block 4: Simple bar chart of class counts.
- Code block 5: Stacked/dodged bars by drv using fill and position.
- Callout: WARNING — geom_bar() counts rows, geom_col() uses y values.
- Inline exercise: Create a bar chart of cyl counts with fill by drv.

### Core H2 4: How Do You Create a Histogram with geom_histogram()?
- Theory: Histograms show the distribution of a single numeric variable. Binwidth controls granularity.
- Code block 6: Histogram of hwy with default bins.
- Code block 7: Histogram with custom binwidth and fill color.
- Callout: TIP — Always set binwidth explicitly.
- Inline exercise: Histogram of cty with binwidth=3.

### Core H2 5: How Do You Plot a Line Chart with geom_line()?
- Theory: Line charts show trends over an ordered variable (usually time). Use geom_line() + geom_point() for clarity.
- Code block 8: Line chart using economics dataset (date vs unemploy).
- Code block 9: Line + point with custom color.
- Callout: NOTE — geom_line() connects points in x-order.
- Inline exercise: Plot date vs psavert from economics.

### Core H2 6: How Do You Draw a Boxplot with geom_boxplot()?
- Theory: Boxplots show median, quartiles, and outliers. Great for comparing distributions across groups.
- Code block 10: Boxplot of hwy by class.
- Code block 11: Boxplot with fill color and coord_flip().
- Diagram: Figure 3 — Which Chart Should You Use (choose-chart.webp)
- Callout: KEY INSIGHT — Boxplots reveal outliers that histograms hide.
- Inline exercise: Boxplot of cty grouped by drv.

### Core H2 7: How Do You Customize Colors, Labels, and Themes?
- Theory: labs() for titles/axes, scale_*() for colors, theme_*() for overall look.
- Code block 12: Scatter with labs(), scale_color_brewer(), theme_minimal().
- Code block 13: Faceted scatter using facet_wrap().
- Callout: TIP — theme_minimal() is a safe default for clean charts.
- Inline exercise: Apply theme_bw() and add a subtitle to a chart.

### Common Mistakes (3-5 mistakes)
1. Forgetting the `+` between layers (runtime error)
2. Using `geom_bar(stat="identity")` when you mean `geom_col()` (wrong results)
3. Putting aes() outside ggplot() when aesthetics should be global (wrong results)
4. Not setting binwidth in geom_histogram() (misleading distribution)

### Practice Exercises (2-3 capstone)
1. Medium: Build a scatter plot of mpg (displ vs hwy), color by class, add title and theme_minimal(). Facet by drv.
2. Hard: Using the diamonds dataset, create a bar chart of cut counts filled by color, use position_dodge(), add labels, and apply a custom theme.
3. Hard: Combine a histogram and boxplot for the same variable (hwy from mpg) into separate plots, using consistent color and binwidth.

### Complete Example
End-to-end: load ggplot2, explore mpg, build a polished scatter plot with color, labels, theme, and facets.

### Summary
Table of 5 chart types with geom, use case, key aesthetic, and one-line code.

### FAQ (5 questions)
1. What is the difference between geom_bar() and geom_col()?
2. How do I save a ggplot chart to a file?
3. Can I combine multiple chart types in one plot?
4. How do I change the font size in ggplot2?
5. What is the difference between color and fill?

### References (7 sources)
1. ggplot2 official documentation — https://ggplot2.tidyverse.org/
2. Wickham, H. — ggplot2: Elegant Graphics for Data Analysis, 3rd Edition — https://ggplot2-book.org/
3. R for Data Science, 2e — Chapter 2: Data Visualization — https://r4ds.hadley.nz/data-visualize
4. ggplot2 cheat sheet — https://rstudio.github.io/cheatsheets/html/data-visualization.html
5. Wilkinson, L. — The Grammar of Graphics (Springer, 2005)
6. R Graph Gallery — https://r-graph-gallery.com/
7. Cedric Scherer — A ggplot2 Tutorial for Beautiful Plotting — https://www.cedricscherer.com/2019/08/05/a-ggplot2-tutorial-for-beautiful-plotting-in-r/

### What's Next
1. ggplot2 Themes and Customization — deep dive into theme() and custom themes
2. Top 50 ggplot2 Visualizations — master list of chart types with code

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | ggplot2-Getting-Started-five-charts-overview.webp | Figure 1 | The five chart types you will build in this tutorial. | Introduction |
| 2 | ggplot2-Getting-Started-grammar-layers.webp | Figure 2 | Every ggplot2 chart follows the same five-layer pattern. | How Does the Grammar of Graphics Work? |
| 3 | ggplot2-Getting-Started-choose-chart.webp | Figure 3 | Pick the right chart type based on your data and goal. | How Do You Draw a Boxplot with geom_boxplot()? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Minimal scatter (grammar demo) | ggplot2 | — | — |
| 2 | Scatter with color by class | — | — | — |
| 3 | Scatter with size + labels | — | — | — |
| 4 | Simple bar chart of class | — | — | — |
| 5 | Stacked/dodged bars | — | — | — |
| 6 | Histogram default bins | — | — | — |
| 7 | Histogram custom binwidth | — | — | — |
| 8 | Line chart (economics) | — | — | — |
| 9 | Line + point custom color | — | — | — |
| 10 | Boxplot hwy by class | — | — | — |
| 11 | Boxplot with fill + flip | — | — | — |
| 12 | Customized scatter (labs, scale, theme) | — | — | — |
| 13 | Faceted scatter | — | — | — |
| 14 | Complete example | — | p | — |

Note: Each code block is self-contained (uses built-in datasets directly). Library loaded in block 1. No vars carry across blocks except the complete example.
