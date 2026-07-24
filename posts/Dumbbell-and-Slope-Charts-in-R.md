---
title: "Dumbbell and Slope Charts in R for Before-After Stories"
slug: "Dumbbell-and-Slope-Charts-in-R"
description: "Build dumbbell and slope charts in R with ggplot2 to show before-after change. Includes runnable code, when to use each, and labeling and color design tips."
keywords: "dumbbell chart in R, slope chart in R, slope graph ggplot2, dumbbell plot ggplot2, before after chart R, geom_segment dumbbell, ggplot2 comparison chart, change over time chart R"
auto_link_terms: "dumbbell chart|dumbbell plot|dumbbell chart in R|slope chart|slope graph|slopegraph|slope chart in R|before-after chart|before and after chart|connected dot plot|dumbbell chart ggplot2|slope chart ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-25"
curriculum_id: "GG2-9.7"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Dumbbell & Slope Charts"
sidebar_order: "64"
difficulty: "Intermediate"
---

<p class="lead">A dumbbell chart and a slope chart are two ggplot2 chart types for showing how a value moved between two points, like before and after. A dumbbell draws each group as two dots joined by a bar, so you see the size of every gap at a glance. A slope chart draws each group as a line linking its two values, so a rise or fall becomes the tilt of a line and a change in rank becomes a crossing.</p>

This tutorial builds both charts from scratch with the tidyverse: `ggplot2` for the graphics, `dplyr` for shaping the numbers, and `tidyr` for one reshape step. You will not need any special "dumbbell" or "slopegraph" add-on package. Both charts are just a few core layers stacked together, and building them by hand teaches you exactly how they work so you can restyle them any way you like.

## What story do dumbbell and slope charts tell?

Before-and-after numbers show up everywhere: satisfaction before and after a redesign, revenue in two quarters, a metric in 2019 versus 2024. The trouble is that a grouped bar chart hides the one thing you care about. The reader has to mentally subtract one bar from its neighbor for every category. A dumbbell chart and a slope chart put that difference in the foreground instead of making the reader compute it.

We will tell one story throughout: a product team measured customer satisfaction (0 to 100) for six features before and after a redesign. Let's create that data and look at it.

```r title="Load libraries and build the before-after data"
library(ggplot2)
library(dplyr)
library(tidyr)

scores <- tibble(
  feature = c("Checkout", "Search", "Mobile App", "Dashboard", "Billing", "Onboarding"),
  before  = c(62, 71, 58, 65, 74, 60),
  after   = c(78, 69, 72, 80, 71, 79)
)

scores
#> # A tibble: 6 × 3
#>   feature    before after
#>   <chr>       <dbl> <dbl>
#> 1 Checkout       62    78
#> 2 Search         71    69
#> 3 Mobile App     58    72
#> 4 Dashboard      65    80
#> 5 Billing        74    71
#> 6 Onboarding     60    79
```

We built the table with `tibble()`, the tidyverse's version of a `data.frame` (it prints with the compact `# A tibble` header you see above and otherwise behaves the same). Each row is one feature with two measurements. `before` is the score from before the redesign, `after` is the score from after. This "wide" shape, one row per group with a column per time point, is the natural starting point for a dumbbell chart.

The number that carries the whole story is the change, so let's compute it directly and keep it in the table.

```r title="Add a change column"
scores <- scores |>
  mutate(change = after - before)

scores
#> # A tibble: 6 × 4
#>   feature    before after change
#>   <chr>       <dbl> <dbl>  <dbl>
#> 1 Checkout       62    78     16
#> 2 Search         71    69     -2
#> 3 Mobile App     58    72     14
#> 4 Dashboard      65    80     15
#> 5 Billing        74    71     -3
#> 6 Onboarding     60    79     19
```

The `|>` symbol is R's pipe: it takes the value on its left and passes it as the first argument to the function on its right, so `scores |> mutate(...)` is just a readable way to write `mutate(scores, ...)`. It lets you read a chain of steps from top to bottom. The `mutate()` function adds a new column without dropping the old ones. Here `change = after - before` gives a positive number when a feature improved and a negative number when it slipped. Four features went up (Checkout, Mobile App, Dashboard, Onboarding) and two went down (Search and Billing). That mix of winners and losers is exactly what these charts are built to show.

[KEY INSIGHT]
**The change column is the story; both charts are just two ways to draw it.** A dumbbell chart draws the change as the length of a bar, and a slope chart draws the change as the tilt of a line. Once you have a clean before, after, and change, choosing a chart is a design decision, not a data problem.

**Try it:** Use the `scores` table to count how many features improved (where `change` is greater than 0). The answer should be 4.

```r title="Your turn: count the improved features"
# Your code here: filter scores to rows where change > 0, then count them with nrow()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count improved features solution"
ex_improved <- scores |>
  filter(change > 0) |>
  nrow()

ex_improved
#> [1] 4
```

**Explanation:** `filter()` keeps only the rows where the condition is true, and `nrow()` counts the rows that survive. Four features had a positive change.

</details>

## How do you build a dumbbell chart in ggplot2?

A dumbbell chart looks like a hand weight: two round dots joined by a short bar. In ggplot2 you build it from three ordinary layers. One `geom_segment()` draws the connecting bar from the before value to the after value, and two `geom_point()` layers drop a dot at each end. That is the whole trick.

![A dumbbell chart is one geom_segment bar with two geom_point dots stacked on top.](screenshots/Dumbbell-and-Slope-Charts-in-R-layers.webp)
*Figure 1: A dumbbell chart is one geom_segment bar with two geom_point dots stacked on top.*

Let's map the pieces. We put `feature` on the y-axis so each feature gets its own row. The bar runs horizontally from `before` (its `x`) to `after` (its `xend`). Then one dot marks where the feature started and another marks where it ended.

```r title="Build a basic dumbbell chart"
p_basic <- ggplot(scores, aes(y = feature)) +
  geom_segment(aes(x = before, xend = after, yend = feature)) +
  geom_point(aes(x = before), color = "grey60", size = 4) +
  geom_point(aes(x = after), color = "steelblue", size = 4)

p_basic
```

Read the layers from the bottom up. The `geom_segment()` call needs four positions: `x` and `y` for where the bar starts, `xend` and `yend` for where it ends. Because both dots sit on the same feature row, `yend` is just `feature` again. The first `geom_point()` draws the grey "before" dot at the `before` value, and the second draws the blue "after" dot at the `after` value.

When you run this, each feature becomes a horizontal dumbbell. The gap between the grey and blue dots is the change, and long bars jump out immediately. Checkout and Onboarding show wide gaps, while Search and Billing barely move.

[NOTE]
**You do not need a special dumbbell package.** Many tutorials reach for `ggalt::geom_dumbbell()`, but that add-on is not always available and it hides what is really happening. Building the chart from `geom_segment()` and `geom_point()` always works and shows you every moving part, so you can restyle it freely.

**Try it:** Copy the basic chart, but make the "after" dots bigger (try `size = 6`) and change their color to `"darkorange"`. Only the second `geom_point()` needs to change.

```r title="Your turn: restyle the after dots"
# Your code here: rebuild p_basic but set size = 6 and color = "darkorange"
# on the second geom_point() (the one that uses x = after)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Restyle the after dots solution"
p_ex2 <- ggplot(scores, aes(y = feature)) +
  geom_segment(aes(x = before, xend = after, yend = feature)) +
  geom_point(aes(x = before), color = "grey60", size = 4) +
  geom_point(aes(x = after), color = "darkorange", size = 6)

p_ex2
```

**Explanation:** The dots are independent layers, so styling one never touches the other. Bigger, brighter "after" dots pull the eye toward where each feature ended up.

</details>

## How do you make a dumbbell chart easy to read?

The basic chart works, but three small moves turn it from readable into clear. We sort the rows, color by direction, then label the values, adding them one at a time.

First, sorting. Right now the features sit in the order we typed them, which means nothing. If we sort by the after value, the chart becomes a ranked list and the eye can scan it top to bottom. The `reorder()` function reorders a category by a number, so `reorder(feature, after)` arranges features from lowest to highest ending score.

```r title="Sort the dumbbells by ending score"
p_sorted <- ggplot(scores, aes(y = reorder(feature, after))) +
  geom_segment(aes(x = before, xend = after, yend = reorder(feature, after)),
               color = "grey80", linewidth = 1.5) +
  geom_point(aes(x = before), color = "grey60", size = 4) +
  geom_point(aes(x = after), color = "steelblue", size = 4) +
  labs(x = "Satisfaction score", y = NULL)

p_sorted
```

We wrapped `feature` in `reorder(feature, after)` in both the `aes(y = ...)` and the segment's `yend`, so the bar and its row stay lined up. We also thickened the bar with `linewidth = 1.5` and lightened it to `grey80` so the dots read as the main event. The `labs()` call gives the x-axis a real name and drops the redundant y-axis title with `y = NULL`. Now the highest-scoring features sit at the top.

[TIP]
**Sort so the reader's eye lands on the story first.** A dumbbell chart in typed order forces a scan of every row. Sorted by the ending value, or by the size of the change, the ranking does the explaining for you before anyone reads a single number.

Next, color. Right now every bar looks the same, so a feature that dropped looks just like one that rose. Let's tag each feature as "Improved" or "Declined" and color by that tag. We build the label with `if_else()`, which returns the first value when the test is true and the second when it is false.

```r title="Add an Improved or Declined label"
scores <- scores |>
  mutate(direction = if_else(change >= 0, "Improved", "Declined"))

scores
#> # A tibble: 6 × 5
#>   feature    before after change direction
#>   <chr>       <dbl> <dbl>  <dbl> <chr>
#> 1 Checkout       62    78     16 Improved
#> 2 Search         71    69     -2 Declined
#> 3 Mobile App     58    72     14 Improved
#> 4 Dashboard      65    80     15 Improved
#> 5 Billing        74    71     -3 Declined
#> 6 Onboarding     60    79     19 Improved
```

Now every row knows whether it went up or down. We can map that new `direction` column to color and let ggplot2 pick a color per group. We also add `geom_text()` to print the ending value just above each blue dot, so the reader gets exact numbers without hunting along the axis.

```r title="Color by direction and label the values"
p_dir <- ggplot(scores, aes(y = reorder(feature, after))) +
  geom_segment(aes(x = before, xend = after, yend = reorder(feature, after),
                   color = direction), linewidth = 1.5) +
  geom_point(aes(x = before), color = "grey55", size = 4) +
  geom_point(aes(x = after, color = direction), size = 4) +
  geom_text(aes(x = after, label = after), vjust = -1.2, size = 3.5) +
  scale_color_manual(values = c("Improved" = "#2c7fb8", "Declined" = "#d95f0e")) +
  labs(x = "Satisfaction score", y = NULL, color = NULL)

p_dir
```

Two things changed. We moved `color = direction` inside `aes()` for the segment and the after dot, which tells ggplot2 to split those layers by the direction group. Then `scale_color_manual()` sets the exact colors: a calm blue for improvements and a warm orange for declines. The `geom_text()` layer places each after value slightly above its dot, nudged up by `vjust = -1.2`. The grey "before" dot stays a fixed grey so it always reads as the starting point. Now a glance separates the two declining features from the four that improved.

**Try it:** Sort the dumbbells by the size of the change instead of the ending score. The hint is to reorder by `change` rather than `after`.

```r title="Your turn: sort by size of change"
# Your code here: rebuild the sorted chart but use reorder(feature, change)
# in both the aes(y = ...) and the segment's yend
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sort by size of change solution"
p_ex3 <- ggplot(scores, aes(y = reorder(feature, change))) +
  geom_segment(aes(x = before, xend = after, yend = reorder(feature, change)),
               color = "grey80", linewidth = 1.5) +
  geom_point(aes(x = before), color = "grey60", size = 4) +
  geom_point(aes(x = after), color = "steelblue", size = 4) +
  labs(x = "Satisfaction score", y = NULL)

p_ex3
```

**Explanation:** Sorting by `change` puts the biggest drop at the bottom and the biggest gain at the top, so the chart ranks features by how much they moved rather than where they landed.

</details>

## How do you build a slope chart in ggplot2?

A slope chart tells the same before-after story with lines instead of bars. Each feature is a single line running from its before value on the left to its after value on the right. A line that tilts up means the feature improved, a line that tilts down means it declined, and lines that cross show a change in ranking.

There is one setup step. A dumbbell reads straight from the wide table, but a slope chart draws a line through points, so it needs one row per point. We reshape the two columns `before` and `after` into two rows using `pivot_longer()`.

![pivot_longer() turns one wide row into two long rows, one per time point.](screenshots/Dumbbell-and-Slope-Charts-in-R-reshape.webp)
*Figure 2: pivot_longer() turns one wide row into two long rows, one per time point.*

Let's reshape the data and look at the result.

```r title="Reshape the data from wide to long"
scores_long <- scores |>
  select(feature, before, after) |>
  pivot_longer(cols = c(before, after),
               names_to = "time", values_to = "score")

scores_long
#> # A tibble: 12 × 3
#>    feature    time   score
#>    <chr>      <chr>  <dbl>
#>  1 Checkout   before    62
#>  2 Checkout   after     78
#>  3 Search     before    71
#>  4 Search     after     69
#>  5 Mobile App before    58
#>  6 Mobile App after     72
#>  7 Dashboard  before    65
#>  8 Dashboard  after     80
#>  9 Billing    before    74
#> 10 Billing    after     71
#> 11 Onboarding before    60
#> 12 Onboarding after     79
```

We started with 6 rows and now have 12, two per feature. The `cols = c(before, after)` argument tells `pivot_longer()` which columns to fold down. The old column names ("before", "after") land in a new `time` column, and the numbers land in a new `score` column. This long shape is what `geom_line()` needs to connect the two points of each feature.

There is one catch. R stores the `time` values as plain text, and text sorts alphabetically, which would put "after" before "before" on the axis. We fix that by turning `time` into a factor with the levels in the order we want.

```r title="Set the time order with a factor"
scores_long <- scores_long |>
  mutate(time = factor(time, levels = c("before", "after")))

levels(scores_long$time)
#> [1] "before" "after"
```

A factor is R's type for a category with a fixed set of possible values, and those values have an order. By listing `levels = c("before", "after")` we tell R that before comes first. The `levels()` function confirms the order stuck.

[WARNING]
**Set the time order yourself, or the axis sorts alphabetically.** Left as plain text, "after" comes before "before" in the alphabet, so the chart would draw every slope backwards. Converting to a factor with explicit levels is the fix, and it is easy to forget until a chart looks wrong.

Now the data is ready. We draw one line per feature with `geom_line()`, using `group = feature` so ggplot2 knows which points belong to the same line, and add dots at each end with `geom_point()`.

```r title="Build a basic slope chart"
p_slope <- ggplot(scores_long, aes(x = time, y = score, group = feature)) +
  geom_line(color = "grey70", linewidth = 1) +
  geom_point(size = 3)

p_slope
```

The `group = feature` mapping is the piece that makes a slope chart work. Without it, ggplot2 would try to connect all the points into one tangled line. With it, each feature gets its own line from its before point to its after point. Running this shows a fan of grey lines, most tilting up, a couple tilting down.

The plain version has no labels, so you cannot tell which line is which. Let's color each line by feature and print the feature name at the right end, where the reader's eye finishes.

```r title="Label the slope chart at the right end"
p_slope2 <- ggplot(scores_long, aes(x = time, y = score, group = feature)) +
  geom_line(aes(color = feature), linewidth = 1) +
  geom_point(aes(color = feature), size = 3) +
  geom_text(
    data = subset(scores_long, time == "after"),
    aes(label = feature, color = feature),
    hjust = 0, nudge_x = 0.05, size = 3.5
  ) +
  scale_x_discrete(expand = expansion(mult = c(0.1, 0.35))) +
  guides(color = "none") +
  labs(x = NULL, y = "Satisfaction score")

p_slope2
```

The `geom_text()` layer only draws labels for the "after" rows, which we pick with `subset(scores_long, time == "after")`, so each name appears once at the right end of its line. The `nudge_x = 0.05` pushes the text just past the last dot, and `expand = expansion(mult = c(0.1, 0.35))` adds room on the right so long names do not run off the panel. Because the color already identifies each line, `guides(color = "none")` hides the now-redundant legend.

**Try it:** The long table has more rows than the original. Use `nrow()` to confirm how many rows `scores_long` has, and think about why the reshape doubled them.

```r title="Your turn: count the long-table rows"
# Your code here: call nrow() on scores_long
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count the long-table rows solution"
nrow(scores_long)
#> [1] 12
```

**Explanation:** Six features times two time points gives 12 rows. `pivot_longer()` traded width (two value columns) for length (two rows per feature), which is the shape a line chart needs.

</details>

## When should you use a dumbbell vs a slope chart?

Both charts show before-after change, so which one should you reach for? The short answer: use a dumbbell when the size of each gap is the point, and a slope chart when direction and ranking are the point.

![Pick a dumbbell for gap size, a slope chart for direction and rank changes.](screenshots/Dumbbell-and-Slope-Charts-in-R-decision.webp)
*Figure 3: Pick a dumbbell for gap size, a slope chart for direction and rank changes.*

Here is a side-by-side comparison to guide the choice.

| Question | Dumbbell chart | Slope chart |
|---|---|---|
| What does it emphasize? | The size of each gap | The direction and steepness of each change |
| Easy to sort and rank? | Yes, sort rows by value or change | Harder, lines are fixed by their values |
| Shows rank changes (crossings)? | No | Yes, crossing lines reveal them |
| Best group count | Works well with many groups | Best with a handful before lines tangle |
| Reads best when | You want a ranked "gap list" | You want to see who overtook whom |

A slope chart has one extra power a dumbbell cannot match: when two lines cross, you instantly see that one group overtook another. Let's color the slope lines by direction so the two declines stand out. First we attach the `direction` label to the long table with a join.

```r title="Join the direction label onto the long data"
slope_dir <- scores_long |>
  left_join(select(scores, feature, direction), by = "feature")

head(slope_dir, 4)
#> # A tibble: 4 × 4
#>   feature  time   score direction
#>   <chr>    <fct>  <dbl> <chr>
#> 1 Checkout before    62 Improved
#> 2 Checkout after     78 Improved
#> 3 Search   before    71 Declined
#> 4 Search   after     69 Declined
```

The `left_join()` matches rows by `feature` and copies the `direction` column from `scores` onto every row of the long table. We only pulled in the columns we need with `select(scores, feature, direction)`. Now each of the 12 long rows carries its direction, so we can color by it.

```r title="Color the slope lines by direction"
p_slope3 <- ggplot(slope_dir, aes(x = time, y = score, group = feature)) +
  geom_line(aes(color = direction), linewidth = 1) +
  geom_point(aes(color = direction), size = 3) +
  scale_color_manual(values = c("Improved" = "#2c7fb8", "Declined" = "#d95f0e")) +
  labs(x = NULL, y = "Satisfaction score", color = NULL)

p_slope3
```

Mapping `color = direction` splits the lines into two colored groups, and `scale_color_manual()` reuses the same blue-for-up, orange-for-down scheme from the dumbbell chart. Keeping colors consistent across both charts helps a reader who sees them together. The two orange lines tilt down while the four blue lines tilt up.

[KEY INSIGHT]
**A dumbbell answers "how big is each gap"; a slope chart answers "who rose, who fell, and did any ranks cross".** They share the same data and often the same colors. Pick the one whose question matches what you want your reader to walk away knowing.

**Try it:** Rebuild the colored slope chart yourself using the `slope_dir` data, mapping `color = direction` on both the line and point layers.

```r title="Your turn: color the slope by direction"
# Your code here: use slope_dir, map color = direction on geom_line and geom_point,
# then add scale_color_manual() with your two colors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Color the slope by direction solution"
p_ex5 <- ggplot(slope_dir, aes(x = time, y = score, group = feature)) +
  geom_line(aes(color = direction), linewidth = 1) +
  geom_point(aes(color = direction), size = 3) +
  scale_color_manual(values = c("Improved" = "forestgreen", "Declined" = "firebrick")) +
  labs(x = NULL, y = "Satisfaction score", color = NULL)

p_ex5
```

**Explanation:** Any two contrasting colors work. The point is that mapping `color = direction` turns the chart into a two-group story: one color for the risers, one for the fallers.

</details>

## Complete Example

Let's pull the best moves into one polished dumbbell chart you could drop into a report. It sorts by ending score, colors by direction, labels both the before and after values, and adds a clear title. Every piece here appeared earlier in the tutorial.

```r title="Build a polished, report-ready dumbbell chart"
scores_final <- scores |>
  mutate(feature = reorder(feature, after))

p_final <- ggplot(scores_final, aes(y = feature)) +
  geom_segment(aes(x = before, xend = after, yend = feature,
                   color = direction), linewidth = 1.6) +
  geom_point(aes(x = before), color = "grey55", size = 4.5) +
  geom_point(aes(x = after, color = direction), size = 4.5) +
  geom_text(aes(x = before, label = before), hjust = 1.6, size = 3.2, color = "grey40") +
  geom_text(aes(x = after, label = after), hjust = -0.7, size = 3.2, color = "grey25") +
  scale_color_manual(values = c("Improved" = "#2c7fb8", "Declined" = "#d95f0e")) +
  scale_x_continuous(limits = c(50, 88)) +
  labs(
    title = "Feature satisfaction before and after the redesign",
    subtitle = "Grey dot = before, colored dot = after",
    x = "Satisfaction score (0-100)", y = NULL, color = NULL
  ) +
  theme_minimal()

p_final
```

We sorted once up front by setting `feature = reorder(feature, after)`, so every layer inherits the ranked order. The two `geom_text()` layers print the starting value to the left of the grey dot and the ending value to the right of the colored dot, using `hjust` to push each label clear of its point. We fixed the x-axis to a sensible window with `scale_x_continuous(limits = c(50, 88))` so the labels have breathing room, and `theme_minimal()` strips the chart down to the data. The result is a single figure that ranks the features, shows each starting and ending score, and separates the winners from the losers by color.

## Practice Exercises

These combine several ideas from the tutorial. Each uses distinct variable names so it will not overwrite the objects we built above. Try each one before opening the solution.

### Exercise 1: Find the biggest mover

Using the `scores` table, find the single feature that moved the most in either direction (the largest absolute change). Save it to `biggest` and print it. The expected answer is Onboarding, with a change of 19.

```r title="Exercise 1: find the biggest mover"
# Your code here
# Hint: add a column with abs(change), arrange() by it in descending order,
# then keep the top row with slice(1)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Biggest mover solution"
biggest <- scores |>
  mutate(abs_change = abs(change)) |>
  arrange(desc(abs_change)) |>
  slice(1)

biggest
#> # A tibble: 1 × 6
#>   feature    before after change direction abs_change
#>   <chr>       <dbl> <dbl>  <dbl> <chr>          <dbl>
#> 1 Onboarding     60    79     19 Improved          19
```

**Explanation:** `abs(change)` ignores the sign so a big drop competes with a big gain, `arrange(desc(...))` puts the largest on top, and `slice(1)` keeps that one row. Onboarding rose 19 points, the biggest move on the board.

</details>

### Exercise 2: A dumbbell of only the declines

Build a dumbbell chart showing only the features that declined. First filter `scores` to the declining rows and print them, then draw the dumbbell for just those features. There should be two: Search and Billing.

```r title="Exercise 2: dumbbell of only the declines"
# Your code here
# Hint: filter(direction == "Declined") to make a smaller table, print it,
# then feed that table into the same geom_segment + geom_point recipe

```

<details>
<summary>Click to reveal solution</summary>

```r title="Declines-only dumbbell solution"
declined <- scores |>
  filter(direction == "Declined")

declined
#> # A tibble: 2 × 5
#>   feature before after change direction
#>   <chr>    <dbl> <dbl>  <dbl> <chr>
#> 1 Search      71    69     -2 Declined
#> 2 Billing     74    71     -3 Declined

p_cap2 <- ggplot(declined, aes(y = feature)) +
  geom_segment(aes(x = before, xend = after, yend = feature),
               color = "grey80", linewidth = 1.5) +
  geom_point(aes(x = before), color = "grey60", size = 4) +
  geom_point(aes(x = after), color = "#d95f0e", size = 4) +
  labs(x = "Satisfaction score", y = NULL)

p_cap2
```

**Explanation:** Filtering first shrinks the data to the two declining features, and the same three-layer recipe draws a focused chart. Zooming in on just the problem cases is a common reporting move.

</details>

### Exercise 3: A titled slope chart by direction

Recreate the direction-colored slope chart from the `slope_dir` data, but add a title and subtitle so it stands on its own in a report. Save it to `p_cap3`.

```r title="Exercise 3: a titled slope chart by direction"
# Your code here
# Hint: start from the p_slope3 recipe, then add labs(title = ..., subtitle = ...)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Titled slope chart solution"
p_cap3 <- ggplot(slope_dir, aes(x = time, y = score, group = feature)) +
  geom_line(aes(color = direction), linewidth = 1) +
  geom_point(aes(color = direction), size = 3) +
  scale_color_manual(values = c("Improved" = "#2c7fb8", "Declined" = "#d95f0e")) +
  labs(
    title = "Which features rose and which fell after the redesign",
    subtitle = "Each line is one feature, before to after",
    x = NULL, y = "Satisfaction score", color = NULL
  ) +
  theme_minimal()

p_cap3
```

**Explanation:** The chart body is the same as before; the `labs()` title and subtitle plus `theme_minimal()` turn a working plot into a finished figure a reader can understand without extra context.

</details>

## Frequently Asked Questions

**Do I need the ggalt or CGPfunctions package for these charts?**
No. Those packages offer shortcuts like `geom_dumbbell()` and `newggslopegraph()`, but you can build both charts with core ggplot2 geoms, as this tutorial does. Building them by hand keeps your code portable and lets you restyle every layer.

**When should I use a bar chart instead?**
Use a bar chart when you care about the absolute levels and there is no natural "before and after" pairing. The moment your story is about how a paired value changed, a dumbbell or slope chart shows the change far more directly than two bars side by side.

**What if I have more than two time points?**
A dumbbell chart is built for exactly two points, so it does not extend cleanly. A slope chart can add more columns on the x-axis and becomes a small multi-point line chart, though with many points a standard line chart is usually clearer.

**My metric is better when it is lower, like wait time. Does that break the charts?**
No, the charts still work, but flip your color logic. Define the direction so that a decrease counts as an improvement, then map your colors to that. The geometry does not change; only the label of what "good" means does.

**How do I label the size of each change on a dumbbell?**
Add a `geom_text()` layer positioned at the midpoint of each bar with the change value as its label, for example `label = change`. Placing the number on the bar itself saves the reader from subtracting the two dot positions.

## Summary

Dumbbell and slope charts both turn a before-after table into a clear picture of change. A dumbbell draws each gap as a bar with two dots and is easy to sort and rank. A slope chart draws each change as a tilting line and is the better choice when direction and crossings matter.

![The full before-after charting workflow at a glance.](screenshots/Dumbbell-and-Slope-Charts-in-R-overview.webp)
*Figure 4: The full before-after charting workflow at a glance.*

The workflow in one place:

| Step | Dumbbell chart | Slope chart |
|---|---|---|
| Data shape | Wide: one row per group | Long: one row per point (`pivot_longer()`) |
| Core geoms | `geom_segment()` plus two `geom_point()` | `geom_line()` plus `geom_point()` |
| Ordering | Sort with `reorder()` | Set time order with a factor |
| Direction | Color by an Improved/Declined label | Color lines by the same label |
| Labels | Value labels at each dot | Feature names at the right end |

Reach for a dumbbell when the size of each gap is the message. Reach for a slope chart when the reader needs to see which groups rose or fell and whether any ranks crossed.

## References

1. ggplot2 documentation. geom_segment() reference. [Link](https://ggplot2.tidyverse.org/reference/geom_segment.html)
2. ggplot2 documentation. geom_point() reference. [Link](https://ggplot2.tidyverse.org/reference/geom_point.html)
3. tidyr documentation. pivot_longer() reference. [Link](https://tidyr.tidyverse.org/reference/pivot_longer.html)
4. forcats documentation. fct_reorder() and factor ordering. [Link](https://forcats.tidyverse.org/reference/fct_reorder.html)
5. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G. R for Data Science, 2nd Edition, Data Visualization. [Link](https://r4ds.hadley.nz/data-visualize)
6. The R Graph Gallery. Dumbbell chart with a gap column. [Link](https://r-graph-gallery.com/web-dumbbell-chart-with-a-gap-column.html)
7. R CHARTS. Slopegraph in ggplot2. [Link](https://r-charts.com/evolution/newggslopegraph/)

## Continue Learning

- [ggplot2 Line Charts](ggplot2-Line-Charts.html): the foundation for slope charts, covering `geom_line()`, grouping, and styling in depth.
- [Text Labels in ggplot2](ggplot2-Text-Labels-in-R.html): everything about `geom_text()` and direct labeling, including how to keep labels from overlapping.
- [Reshape Data with pivot_longer and pivot_wider](pivot_longer-pivot_wider-Reshape-Data-in-R.html): the wide-to-long reshape that every slope chart depends on, explained from scratch.
