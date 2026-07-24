---
title: "Raincloud Plots in R: Distribution Comparisons that Work"
slug: "Raincloud-Plots-in-R"
description: "Learn to build raincloud plots in R with ggplot2, layer by layer. Combine a half-violin, boxplot, and raw points to compare distributions boxplots hide."
keywords: "raincloud plot R, raincloud plot ggplot2, half violin plot R, ggdist raincloud, distribution comparison R, geom_violin, ggplot2 distribution plot, raincloud plot tutorial"
auto_link_terms: "raincloud plot|raincloud plots|raincloud plot in R|rain cloud plot|half-violin plot|half violin plot|raincloud chart|raincloud visualization|raincloud plot in ggplot2|raincloud plot tutorial"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-24"
curriculum_id: "GG2-10.4"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Raincloud Plots"
sidebar_order: "55"
difficulty: "Intermediate"
---

<p class="lead">A raincloud plot stacks three views of the same numbers: a half-violin that shows the distribution's shape (the cloud), a boxplot that shows the summary, and jittered raw points that show every observation (the rain). It reveals gaps, clusters, and skew that a boxplot alone would hide, which makes it one of the clearest ways to compare groups.</p>

This tutorial builds a raincloud plot from scratch using only core ggplot2, so you understand every layer instead of copying a black-box function. Every code block below runs directly in your browser: press Run and change the numbers. We use base R and the tidyverse staples `ggplot2` and `dplyr`, and near the end we look at packages that automate the whole thing once you know how the pieces fit.

## Why do boxplots hide what raincloud plots reveal?

A boxplot squeezes a whole distribution down to five numbers: the minimum, the first quartile, the median, the third quartile, and the maximum. That summary is useful, but it throws away the shape. Two groups can have almost the same five numbers while having completely different distributions, and the boxplot will not tell you.

Let's prove it. We will make two groups on purpose. Group A is a single smooth hump. Group B is two separate clusters (bimodal), which is what you get when two subgroups are mixed together in the same column. We tune Group B so its quartiles land almost exactly on Group A's.

```r title="Build two groups with matching summaries"
library(ggplot2)
library(dplyr)

set.seed(2026)
n <- 300
group_a <- rnorm(n, mean = 50, sd = 11)                 # one smooth hump
group_b <- c(rnorm(n / 2, mean = 43, sd = 6),           # a low cluster
             rnorm(n / 2, mean = 57, sd = 6))           # and a high cluster
scores <- data.frame(
  group = rep(c("Group A", "Group B"), each = n),
  score = c(group_a, group_b)
)

# Compare the quartiles side by side
scores |>
  group_by(group) |>
  summarise(Q1 = quantile(score, 0.25),
            median = median(score),
            Q3 = quantile(score, 0.75))
#> # A tibble: 2 × 4
#>   group      Q1 median    Q3
#>   <chr>   <dbl>  <dbl> <dbl>
#> 1 Group A  43.2   49.9  56.9
#> 2 Group B  43.5   50.5  58.3
```

Read the table row by row. Group A and Group B share the same median (about 50) and nearly the same first and third quartiles (about 43 and 57). A boxplot draws its box from Q1 to Q3 with a line at the median, so both boxes will look like near-twins. The takeaway: the five-number summary cannot distinguish these two groups.

Now draw the boxplots and see for yourself.

```r title="Draw two nearly identical boxplots"
ggplot(scores, aes(x = group, y = score)) +
  geom_boxplot(fill = "grey85") +
  labs(x = NULL, y = "Score",
       title = "Two boxplots that look almost the same")
```

The two boxes are practically identical, and nothing on the chart hints that the groups differ. If you stopped here, you would report "same distribution" and move on. That would be wrong.

Watch what happens when we swap the boxplot for a violin, which mirrors the distribution's density so its width shows where values pile up.

```r title="Reveal the shape with violins"
ggplot(scores, aes(x = group, y = score, fill = group)) +
  geom_violin() +
  labs(x = NULL, y = "Score", title = "The same data as violins") +
  theme(legend.position = "none")
```

Now the difference is obvious. Group A is a single bulge in the middle. Group B pinches in the center and bulges twice, once low and once high: two hidden clusters the boxplot completely erased. Same summary numbers, very different stories.

A raincloud plot is the natural next step. It keeps the density shape from the violin, adds the boxplot summary back in, and layers the raw points on top so you can also count and inspect individual observations. You get all three views in one glance.

![From boxplot to raincloud](screenshots/Raincloud-Plots-in-R-from-boxplot.webp)
*Figure 1: Boxplots hide a distribution's shape; a raincloud adds density and raw points to show the full picture.*

[KEY INSIGHT]
**A boxplot compresses a distribution into five numbers, and different shapes can produce the same five numbers.** Whenever a decision depends on whether a group is single-peaked, skewed, or actually two subgroups combined, show the shape and the raw points, not just the box.

**Try it:** Add the raw points to the boxplot so you can see the two clusters in Group B directly. Use `geom_jitter()` with a small width on top of the existing boxplot.

```r title="Your turn: add jittered points"
ggplot(scores, aes(x = group, y = score)) +
  geom_boxplot(fill = "grey85") +
  # add a jittered points layer here
  labs(x = NULL, y = "Score")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Boxplot with jittered points solution"
ggplot(scores, aes(x = group, y = score)) +
  geom_boxplot(fill = "grey85") +
  geom_jitter(width = 0.15, alpha = 0.3) +
  labs(x = NULL, y = "Score")
```

**Explanation:** `geom_jitter()` scatters each point a little sideways so they do not stack into one line. Even with the box on top, Group B's two clouds of points are now visible. `width = 0.15` keeps the scatter narrow, and `alpha = 0.3` makes overlapping points readable.

</details>

## What are the three layers of a raincloud plot?

A raincloud plot is not a special chart type with its own function. It is three ordinary ggplot2 layers stacked in one panel, each showing the same numbers a different way.

- **The cloud:** a half-violin (a density curve) that shows the distribution's shape.
- **The summary:** a narrow boxplot that shows the median and quartiles.
- **The rain:** jittered points that show every individual value.

![Anatomy of a raincloud plot](screenshots/Raincloud-Plots-in-R-anatomy.webp)
*Figure 2: The three layers of a raincloud plot: half-violin cloud, boxplot summary, and jittered rain.*

Before we build the polished half-violin version, let's assemble a rough draft using only stock ggplot2 geoms, so the three-layer idea is concrete. We will use the built-in `iris` dataset and plot sepal length for each of its three species.

```r title="Stack a violin, boxplot, and jitter"
set.seed(1)
ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  geom_violin(fill = "grey85") +
  geom_boxplot(width = 0.12, outlier.shape = NA) +
  geom_jitter(width = 0.08, alpha = 0.4) +
  labs(x = "Species", y = "Sepal length (cm)")
```

Read the layers from the code, bottom of the list to top of the chart. `geom_violin()` draws the grey density shape. `geom_boxplot(width = 0.12)` draws a slim box inside it, with `outlier.shape = NA` so outlier dots are not drawn twice (the jitter layer already shows every point). `geom_jitter(width = 0.08)` sprinkles the raw points on top. The order matters: later layers draw on top of earlier ones.

This already shows all three views together. So what is wrong with it? Look closely: the violin is a full, mirrored shape, and the points sit right on top of it. The two halves of the violin are redundant (a mirror image adds no information), and the points and box are crammed into the same space as the density. A true raincloud fixes this by using only half of the violin, freeing up the other side for the box and the rain.

[NOTE]
**A violin plot is a density curve mirrored around a center line, so both halves carry the same information.** A raincloud keeps just one half and spends the reclaimed space on the boxplot and the raw points, which is why it looks cleaner and less crowded.

**Try it:** The points above are a little faint and tightly packed. Make them easier to see by widening the jitter slightly and raising the opacity.

```r title="Your turn: adjust the rain"
set.seed(1)
ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  geom_violin(fill = "grey85") +
  geom_boxplot(width = 0.12, outlier.shape = NA) +
  geom_jitter(width = 0.08, alpha = 0.4) +   # change width and alpha
  labs(x = "Species", y = "Sepal length (cm)")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wider, clearer jitter solution"
set.seed(1)
ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  geom_violin(fill = "grey85") +
  geom_boxplot(width = 0.12, outlier.shape = NA) +
  geom_jitter(width = 0.12, alpha = 0.7) +
  labs(x = "Species", y = "Sepal length (cm)")
```

**Explanation:** Raising `width` to `0.12` spreads the points wider so fewer overlap, and `alpha = 0.7` makes each point more solid. There is a trade-off: too much width and the points drift away from their group; too little and they merge into a bar.

</details>

## How do you draw the half-violin cloud from scratch?

The cloud is the only piece core ggplot2 does not give you directly. There is no built-in "half-violin" geom. But a violin is just a density curve, and a density curve is something we can compute ourselves with base R's `density()` function. Once we have the curve, we draw one side of it as a filled shape.

Start by looking at what `density()` returns for a single group.

```r title="Inspect a density curve"
setosa_len <- iris$Sepal.Length[iris$Species == "setosa"]
d <- density(setosa_len)

length(d$x)                                    # points along the value axis
#> [1] 512
head(data.frame(value = d$x, density = d$y), 4)
#>      value      density
#> 1 3.931426 0.0008607633
#> 2 3.935804 0.0009639698
#> 3 3.940182 0.0010760612
#> 4 3.944560 0.0011972881
```

`density()` returns two matched vectors of 512 points. `d$x` is a fine grid of values along the measurement axis (sepal length), and `d$y` is how dense the data is at each of those values. Where `d$y` is large, many observations pile up; where it is small, the data thins out. That pair of vectors traces the outline of one side of a violin.

To turn that outline into a filled half-violin, we anchor it against a vertical baseline. The plan for each group is: place the group at an integer position on the x-axis (group 1 at x = 1, group 2 at x = 2, and so on), push the density outward from that baseline to form the curved edge, then close the shape back along the baseline. Here is a small helper that does exactly that for every group in a dataset.

```r title="Define the build_cloud helper"
build_cloud <- function(data, group_col, value_col, width = 0.4) {
  groups <- levels(factor(data[[group_col]]))
  parts <- list()
  for (i in seq_along(groups)) {
    vals <- data[[value_col]][data[[group_col]] == groups[i]]
    d <- density(vals)
    scaled <- d$y / max(d$y) * width              # scale density to a fixed width
    parts[[i]] <- data.frame(
      grp = groups[i],
      x = c(i + scaled, rep(i, length(scaled))),  # curve outward, then back to baseline
      y = c(d$x, rev(d$x))
    )
  }
  do.call(rbind, parts)
}

cloud <- build_cloud(iris, "Species", "Sepal.Length")
head(cloud, 4)
#>      grp        x        y
#> 1 setosa 1.000278 3.931426
#> 2 setosa 1.000311 3.935804
#> 3 setosa 1.000347 3.940182
#> 4 setosa 1.000387 3.944560
```

Walk through what the helper builds. For each group `i`, it computes the density, then rescales `d$y` so the widest part of the curve sticks out by `width` (0.4 by default). The `x` column holds the curve going outward (`i + scaled`) followed by the flat baseline coming back (`rep(i, ...)`), and the `y` column holds the value grid out and then in reverse. Reading `head(cloud, 4)`, you can see setosa's shape starts at x just above the baseline of 1.0 and y near 3.93 cm, which is the low end of setosa's sepal lengths. Chaining outward-curve plus return-baseline gives `geom_polygon()` a closed outline it can fill.

Now draw the clouds on their own with `geom_polygon()`. We relabel the integer x positions with the species names so the axis reads normally.

```r title="Draw the half-violin clouds"
ggplot(cloud, aes(x = x, y = y, group = grp, fill = grp)) +
  geom_polygon(alpha = 0.8, color = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  labs(x = "Species", y = "Sepal length (cm)", fill = "Species")
```

Each species now has a one-sided violin: a filled shape that bulges where its sepal lengths are common and tapers where they are rare. `group = grp` keeps the three polygons separate so ggplot2 does not try to connect them into one blob, and `scale_x_continuous()` swaps the numbers 1, 2, 3 for the species names. This is the cloud. Next we hang the box and the rain off the same baseline.

[TIP]
**Control the smoothness of the cloud with the adjust argument of density().** Pass `density(vals, adjust = 0.5)` for a bumpier curve that follows the data closely, or `adjust = 2` for a smoother one. Add an `adjust` argument to `build_cloud()` if you want to tune it per plot.

**Try it:** The clouds are a little wide. Rebuild them at half the width so they take up less room, then redraw.

```r title="Your turn: narrow the clouds"
ex_cloud <- build_cloud(iris, "Species", "Sepal.Length", width = 0.4)  # change width
ggplot(ex_cloud, aes(x = x, y = y, group = grp, fill = grp)) +
  geom_polygon(alpha = 0.8, color = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  labs(x = "Species", y = "Sepal length (cm)", fill = "Species")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Narrower clouds solution"
ex_cloud <- build_cloud(iris, "Species", "Sepal.Length", width = 0.2)
ggplot(ex_cloud, aes(x = x, y = y, group = grp, fill = grp)) +
  geom_polygon(alpha = 0.8, color = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  labs(x = "Species", y = "Sepal length (cm)", fill = "Species")
```

**Explanation:** The `width` argument sets how far the widest part of each cloud reaches from its baseline. Dropping it from 0.4 to 0.2 halves the horizontal spread, which is handy when you have many groups packed close together.

</details>

## How do you assemble and compare groups with a raincloud plot?

Now we combine all three layers. The trick is positioning: the cloud sits to the right of each group's baseline, the box sits just left of it, and the rain sits further left still. We shift the box and points with small offsets from the integer positions, and we jitter the points with a touch of randomness so they do not stack.

```r title="Assemble the full raincloud"
set.seed(11)
rain <- iris
rain$x_rain <- as.integer(rain$Species) - 0.22 +
               runif(nrow(rain), -0.06, 0.06)      # points, jittered, on the left

ggplot() +
  geom_polygon(data = cloud,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = iris,
               aes(x = as.integer(Species) - 0.08, y = Sepal.Length,
                   group = Species),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = rain,
             aes(x = x_rain, y = Sepal.Length, color = Species),
             size = 1.2, alpha = 0.5) +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  labs(x = "Species", y = "Sepal length (cm)") +
  theme(legend.position = "none")
```

Each layer gets its own horizontal slot around the group's integer position. The cloud (`geom_polygon`) uses the `cloud` data we built, which already reaches to the right. The box (`geom_boxplot`) is nudged to `position - 0.08` and kept slim with `width = 0.06`. The rain (`geom_point`) is nudged furthest left to about `position - 0.22`, with `runif()` adding a small random wobble so points do not line up. `set.seed(11)` makes that wobble reproducible. The result is a full raincloud for all three species, built entirely from parts you now understand.

Reading it, setosa (left) has short sepals in a tight cloud, while virginica (right) has longer sepals and a wider spread. The three species separate cleanly, which is exactly the kind of comparison a raincloud is built for.

Speaking of comparison, the order of the groups matters. When groups sit in a meaningful order, differences pop out. Let's compare fuel economy across engine sizes in the built-in `mtcars` data and order the cylinder groups by their median miles per gallon.

```r title="Order groups by median"
cars <- mtcars
cars$cyl <- factor(cars$cyl)

med <- tapply(cars$mpg, cars$cyl, median)          # median mpg per group
med
#>    4    6    8 
#> 26.0 19.7 15.2
cars$cyl <- factor(cars$cyl, levels = names(sort(med)))   # reorder low to high
```

`tapply()` computes the median mpg for each cylinder count: 26.0 for four-cylinder cars, 19.7 for six, and 15.2 for eight. We then rebuild the `cyl` factor with its levels sorted by those medians, so the plot lays the groups out from lowest median to highest instead of in numeric order. Reordering a factor is the single most useful move for making a group comparison readable.

```r title="Raincloud comparison across groups"
cloud_c <- build_cloud(cars, "cyl", "mpg", width = 0.35)
set.seed(3)
cars$x_rain <- as.integer(cars$cyl) - 0.22 + runif(nrow(cars), -0.05, 0.05)

ggplot() +
  geom_polygon(data = cloud_c,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = cars,
               aes(x = as.integer(cyl) - 0.08, y = mpg, group = cyl),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = cars,
             aes(x = x_rain, y = mpg, color = cyl),
             size = 1.4, alpha = 0.6) +
  scale_x_continuous(breaks = 1:3, labels = levels(cars$cyl)) +
  labs(x = "Cylinders", y = "Miles per gallon") +
  theme(legend.position = "none")
```

The same `build_cloud()` helper works on any dataset: here we pass `cars`, the `cyl` column, and `mpg`. Because we ordered the factor by median, the clouds climb steadily from eight cylinders (thirsty, low mpg) on the left to four cylinders (efficient, high mpg) on the right. The eight-cylinder cloud even hints at two sub-groups, which the handful of raw points confirm. That is a story the ordered raincloud tells at a glance.

[KEY INSIGHT]
**Order your groups by a summary statistic, usually the median, before you plot.** A raincloud sorted from lowest to highest turns a jumble of shapes into a clear trend, and readers can spot the outlier group instantly instead of hunting for it.

**Try it:** Give each cloud a fill color driven by the cylinder group and see how color reinforces the grouping. Map `fill = grp` is already there; add `scale_fill_manual()` with three colors of your choice.

```r title="Your turn: recolor the clouds"
ggplot() +
  geom_polygon(data = cloud_c,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.8, color = NA) +
  # add a scale_fill_manual() with three colors here
  geom_boxplot(data = cars,
               aes(x = as.integer(cyl) - 0.08, y = mpg, group = cyl),
               width = 0.06, outlier.shape = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(cars$cyl)) +
  labs(x = "Cylinders", y = "Miles per gallon") +
  theme(legend.position = "none")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Custom cloud colors solution"
ggplot() +
  geom_polygon(data = cloud_c,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.8, color = NA) +
  scale_fill_manual(values = c("#d73027", "#fc8d59", "#4575b4")) +
  geom_boxplot(data = cars,
               aes(x = as.integer(cyl) - 0.08, y = mpg, group = cyl),
               width = 0.06, outlier.shape = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(cars$cyl)) +
  labs(x = "Cylinders", y = "Miles per gallon") +
  theme(legend.position = "none")
```

**Explanation:** `scale_fill_manual()` assigns a specific color to each level of the fill variable, in level order. Here the three hex codes color the three cylinder groups in order. Custom fills let you match a brand palette or use color to signal meaning (for example, red for the worst group).

</details>

## How do you make horizontal and faceted rainclouds?

Vertical rainclouds work, but horizontal ones are often easier to read, especially when group names are long. Turning the plot on its side is a one-line change: add `coord_flip()`. We also swap in a cleaner theme.

```r title="Flip the raincloud horizontal"
ggplot() +
  geom_polygon(data = cloud_c,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = cars,
               aes(x = as.integer(cyl) - 0.08, y = mpg, group = cyl),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = cars,
             aes(x = x_rain, y = mpg, color = cyl),
             size = 1.4, alpha = 0.6) +
  scale_x_continuous(breaks = 1:3, labels = levels(cars$cyl)) +
  labs(x = "Cylinders", y = "Miles per gallon") +
  coord_flip() +
  theme_minimal() +
  theme(legend.position = "none")
```

`coord_flip()` swaps the axes so the clouds now lie on their backs, growing upward, with the box and rain below each one. Nothing else about the code changes: the positioning logic still works because we only flipped the finished plot. `theme_minimal()` strips the grey background for a lighter look. Horizontal rainclouds read top to bottom like a list, which suits reports and slides.

To split a raincloud by a second variable (say, comparing the same groups across two conditions), add `facet_wrap(~ condition)` so ggplot2 draws one panel per condition. Because the package geoms recompute their statistics per panel, faceting works out of the box with `ggdist` or `ggrain`. The from-scratch cloud is precomputed for the whole dataset, so to facet it you build the cloud within each condition first, then the same positioning logic works inside every panel.

[WARNING]
**Keep the box narrow and the jitter modest when you flip or facet a raincloud.** Because the box, cloud, and rain all share one group slot, a wide box (`width` above about 0.1) or a broad jitter will overlap the cloud and turn the panel into a smear. Start small and widen only if there is room.

**Try it:** Give the horizontal plot a colorblind-friendly palette using `scale_fill_brewer()`. The ColorBrewer "Set2" palette is a safe default.

```r title="Your turn: apply a Brewer palette"
ggplot() +
  geom_polygon(data = cloud_c,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  # add scale_fill_brewer() here
  geom_boxplot(data = cars,
               aes(x = as.integer(cyl) - 0.08, y = mpg, group = cyl),
               width = 0.06, outlier.shape = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(cars$cyl)) +
  labs(x = "Cylinders", y = "Miles per gallon") +
  coord_flip() + theme_minimal() + theme(legend.position = "none")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Brewer palette solution"
ggplot() +
  geom_polygon(data = cloud_c,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  scale_fill_brewer(palette = "Set2") +
  geom_boxplot(data = cars,
               aes(x = as.integer(cyl) - 0.08, y = mpg, group = cyl),
               width = 0.06, outlier.shape = NA) +
  scale_x_continuous(breaks = 1:3, labels = levels(cars$cyl)) +
  labs(x = "Cylinders", y = "Miles per gallon") +
  coord_flip() + theme_minimal() + theme(legend.position = "none")
```

**Explanation:** `scale_fill_brewer(palette = "Set2")` applies a ready-made ColorBrewer palette designed to stay distinguishable for colorblind readers. ggplot2 ships many Brewer palettes; "Set2", "Dark2", and "Paired" are good qualitative choices for group fills.

</details>

## Which R packages make raincloud plots easier?

Now that you understand the layers, you can appreciate the packages that automate them. They do exactly what you just did by hand, wrapped in a single call. Two are worth knowing.

The `ggdist` package is the most popular. Its `stat_halfeye()` draws the half-violin cloud, and `stat_dots()` draws the rain as a neat dot cloud instead of jittered points, so nothing overlaps.

[NOTE]
**The two blocks below use add-on packages, so run them in a local R session (for example, RStudio) rather than in the browser here.** The from-scratch versions above run anywhere because they only use core ggplot2. Install the packages once with `install.packages(c("ggdist", "ggrain"))`.

```r-static title="Raincloud with ggdist run locally"
library(ggdist)

ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_halfeye(adjust = 0.5, width = 0.6, justification = -0.2,
               .width = 0, point_colour = NA) +
  geom_boxplot(width = 0.12, outlier.shape = NA, alpha = 0.5) +
  stat_dots(side = "left", justification = 1.1, dotsize = 0.4) +
  labs(x = "Species", y = "Sepal length (cm)") +
  theme(legend.position = "none")
```

`stat_halfeye()` builds the cloud and nudges it to the right with `justification = -0.2`, `geom_boxplot()` adds the slim box, and `stat_dots()` piles the raw points to the left with `side = "left"`. Setting `.width = 0` and `point_colour = NA` hides the small interval marker that `stat_halfeye()` draws by default, leaving a clean half-violin. The output looks like the raincloud you built by hand, with tidier dot stacking.

The newer `ggrain` package goes further: `geom_rain()` draws the whole raincloud in one layer.

```r-static title="Raincloud with ggrain one-liner"
library(ggrain)

ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  geom_rain() +
  labs(x = "Species", y = "Sepal length (cm)") +
  theme(legend.position = "none")
```

`geom_rain()` places the cloud, box, and rain automatically, and it can even connect points across conditions for repeated-measures data. It is the quickest way to a raincloud once the packages are installed. Another option you may see in older tutorials is `gghalves`, which supplies `geom_half_violin()` and matching half-geoms; it works the same way by giving you one-sided layers to stack.

For a deeper walkthrough of the `ggdist` approach and its uncertainty features, see our [ggdist package tutorial](ggdist-Package-in-R.html). The from-scratch method in this post and the package method produce the same picture: use whichever fits your project.

**Try it:** You do not need a package to restyle your raincloud. Take the from-scratch iris raincloud and give it a soft, publication-ready look with a Brewer palette and a minimal theme.

```r title="Your turn: restyle the from-scratch raincloud"
ggplot() +
  geom_polygon(data = cloud, aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = iris,
               aes(x = as.integer(Species) - 0.08, y = Sepal.Length, group = Species),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = rain, aes(x = x_rain, y = Sepal.Length),
             size = 1.1, alpha = 0.5) +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  # add scale_fill_brewer() and theme_minimal() here
  labs(x = "Species", y = "Sepal length (cm)")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Restyled from-scratch raincloud solution"
ggplot() +
  geom_polygon(data = cloud, aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = iris,
               aes(x = as.integer(Species) - 0.08, y = Sepal.Length, group = Species),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = rain, aes(x = x_rain, y = Sepal.Length),
             size = 1.1, alpha = 0.5) +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  scale_fill_brewer(palette = "Set2") +
  theme_minimal() +
  theme(legend.position = "none") +
  labs(x = "Species", y = "Sepal length (cm)")
```

**Explanation:** No package is needed to polish a raincloud. `scale_fill_brewer()` recolors the clouds, `theme_minimal()` lightens the background, and dropping the legend removes redundancy since the axis already labels each group.

</details>

## Complete Example

Let's put every step together on a fresh dataset. The built-in `chickwts` data records the weights of chicks fed six different diets. We want to compare the weight distributions across feeds and see which diet produces the heaviest, most consistent chicks. This is a textbook raincloud job: six groups, and we care about both the typical value and the spread.

The preparation step is the one that makes or breaks the comparison: order the feeds by their median weight so the plot reads as a ranking.

```r title="Order feeds by median weight"
data(chickwts)

med_feed <- tapply(chickwts$weight, chickwts$feed, median)
round(sort(med_feed))
#> horsebean   linseed   soybean  meatmeal sunflower    casein 
#>       152       221       248       263       328       342
cw <- chickwts
cw$feed <- factor(cw$feed, levels = names(sort(med_feed)))
```

`tapply()` gives the median weight for each feed, and sorting shows the ranking: horsebean chicks are lightest at a median of 152 grams, while casein-fed chicks are heaviest at 342 grams. We rebuild the `feed` factor with its levels in that sorted order, so the raincloud will stack from lightest at the bottom to heaviest at the top.

```r title="Build the polished comparison raincloud"
cloud_w <- build_cloud(cw, "feed", "weight", width = 0.4)
set.seed(9)
cw$x_rain <- as.integer(cw$feed) - 0.22 + runif(nrow(cw), -0.05, 0.05)

ggplot() +
  geom_polygon(data = cloud_w,
               aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = cw,
               aes(x = as.integer(feed) - 0.08, y = weight, group = feed),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = cw,
             aes(x = x_rain, y = weight),
             size = 1.2, alpha = 0.45) +
  scale_x_continuous(breaks = 1:6, labels = levels(cw$feed)) +
  scale_fill_brewer(palette = "Set2") +
  labs(title = "Chick weight by feed type",
       x = "Feed", y = "Weight (grams)") +
  coord_flip() +
  theme_minimal() +
  theme(legend.position = "none")
```

This reuses the exact same `build_cloud()` helper and positioning pattern from earlier, now on six groups. Reading the finished plot from bottom to top, horsebean produces light chicks with a tight cloud, casein and sunflower produce the heaviest, and sunflower's cloud is noticeably wider, meaning its results are less consistent. A single chart answers both questions we started with: which feed is best on average, and which is most reliable. That is the payoff of a raincloud: it shows the group ranking and the full spread at once, with every raw point still visible.

## Practice Exercises

These combine the pieces from the whole tutorial. Each solution runs in the browser, and all reuse the `build_cloud()` helper you defined earlier on this page.

### Exercise 1: A single-group raincloud for skew

The `airquality` dataset has an `Ozone` column with missing values. Drop the missing rows, then draw a single raincloud for `Ozone`. Because there is only one group, place it at x = 1. Look at the finished cloud: is ozone symmetric, or skewed?

```r title="Exercise 1 starter"
air <- airquality[!is.na(airquality$Ozone), ]
air$all <- "Ozone"
# Hint: build_cloud needs a grouping column; use "all".
# Place the box at x = 0.92 and jitter the rain around x = 0.78.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
air <- airquality[!is.na(airquality$Ozone), ]
air$all <- "Ozone"
ex1_cloud <- build_cloud(air, "all", "Ozone", width = 0.4)

set.seed(4)
air$x_rain <- 1 - 0.22 + runif(nrow(air), -0.05, 0.05)

ggplot() +
  geom_polygon(data = ex1_cloud, aes(x = x, y = y, group = grp),
               fill = "skyblue", alpha = 0.7) +
  geom_boxplot(data = air, aes(x = 0.92, y = Ozone),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = air, aes(x = x_rain, y = Ozone), alpha = 0.4) +
  scale_x_continuous(breaks = 1, labels = "Ozone") +
  labs(x = NULL, y = "Ozone (ppb)")
```

**Explanation:** With one group, everything centers on x = 1. The cloud is clearly right-skewed: it bunches up at low ozone values and stretches a long tail toward high ones. A boxplot would show the same skew only faintly through an off-center median; the cloud makes it unmistakable.

</details>

### Exercise 2: Compare two transmissions, ordered by median

Using `mtcars`, compare miles per gallon between automatic and manual cars. The `am` column is 0 for automatic and 1 for manual. Turn it into a readable factor, order the two groups by median mpg, and draw a raincloud comparing them.

```r title="Exercise 2 starter"
mt <- mtcars
mt$trans <- factor(ifelse(mt$am == 0, "Automatic", "Manual"))
# Hint: order the factor by median mpg, then build_cloud + assemble.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
mt <- mtcars
mt$trans <- factor(ifelse(mt$am == 0, "Automatic", "Manual"))

mmed <- tapply(mt$mpg, mt$trans, median)
mmed
#> Automatic    Manual 
#>      17.3      22.8
mt$trans <- factor(mt$trans, levels = names(sort(mmed)))

ex2_cloud <- build_cloud(mt, "trans", "mpg", width = 0.35)
set.seed(5)
mt$x_rain <- as.integer(mt$trans) - 0.22 + runif(nrow(mt), -0.05, 0.05)

ggplot() +
  geom_polygon(data = ex2_cloud, aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = mt, aes(x = as.integer(trans) - 0.08, y = mpg, group = trans),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = mt, aes(x = x_rain, y = mpg, color = trans), alpha = 0.6) +
  scale_x_continuous(breaks = 1:2, labels = levels(mt$trans)) +
  labs(x = "Transmission", y = "Miles per gallon") +
  theme(legend.position = "none")
```

**Explanation:** Automatic cars have a median of 17.3 mpg and manual cars 22.8, so sorting puts automatic first. The rainclouds show manual cars are not just higher on average but also more spread out, a difference the medians alone would not reveal.

</details>

### Exercise 3: Add a mean marker to each group

Means and medians can differ, and showing both is a nice touch. Take the from-scratch iris raincloud and add a white diamond at each species' mean sepal length, sitting at the box position. Use `aggregate()` to compute the means.

```r title="Exercise 3 starter"
means <- aggregate(Sepal.Length ~ Species, data = iris, FUN = mean)
# Hint: add a column x = as.integer(Species) - 0.08 to place the diamond on the box.
# Add a geom_point layer with shape = 23 (a diamond) and fill = "white".

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
means <- aggregate(Sepal.Length ~ Species, data = iris, FUN = mean)
means$x <- as.integer(means$Species) - 0.08
means
#>      Species Sepal.Length    x
#> 1     setosa        5.006 0.92
#> 2 versicolor        5.936 1.92
#> 3  virginica        6.588 2.92

ggplot() +
  geom_polygon(data = cloud, aes(x = x, y = y, group = grp, fill = grp),
               alpha = 0.7, color = NA) +
  geom_boxplot(data = iris,
               aes(x = as.integer(Species) - 0.08, y = Sepal.Length, group = Species),
               width = 0.06, outlier.shape = NA) +
  geom_point(data = rain, aes(x = x_rain, y = Sepal.Length, color = Species),
             size = 1.2, alpha = 0.5) +
  geom_point(data = means, aes(x = x, y = Sepal.Length),
             shape = 23, size = 3, fill = "white") +
  scale_x_continuous(breaks = 1:3, labels = levels(iris$Species)) +
  labs(x = "Species", y = "Sepal length (cm)") +
  theme(legend.position = "none")
```

**Explanation:** `aggregate()` returns one mean per species, and we add an `x` column to line the diamonds up with the boxes. `shape = 23` is a filled diamond, and drawing it last puts it on top of the box. Because iris sepal lengths are fairly symmetric, the white mean diamonds sit close to the median lines; on skewed data they would pull toward the long tail.

</details>

## Frequently Asked Questions

### When should I use a raincloud plot instead of a boxplot?

Use a raincloud whenever the shape of the distribution matters, not just its median and quartiles. A boxplot hides whether a group is bimodal, skewed, or clustered, while a raincloud shows the density curve and every raw point. For a quick five-number comparison a boxplot is still fine; reach for a raincloud when a hidden pattern would change your conclusion.

### Do I need a special package to make a raincloud plot in R?

No. A raincloud is three ordinary ggplot2 layers stacked in one panel (a half-violin, a boxplot, and jittered raw points), and this tutorial builds one with core ggplot2 alone. Packages such as `ggdist` and `ggrain` automate the assembly and add polish, but they do the same job you can do by hand.

### Why is it called a raincloud plot?

The half-violin density sits to one side like a cloud, and the jittered raw points scatter beside it like falling rain. The name is a description of the picture: a cloud of density with the individual observations shown as rain below it.

### How much data do I need for a raincloud plot?

The cloud is a kernel density estimate, so it needs enough points to mean something. With fewer than about ten values in a group, the smooth curve can look more confident than the data warrants, so lean on the raw points for very small groups. A few dozen observations per group or more gives a cloud you can trust.

### How do I make a raincloud plot horizontal?

Add `coord_flip()` to the finished plot, as the horizontal section above shows. It swaps the axes so the clouds lie sideways, which reads well when group labels are long or you have many groups. Keep the box narrow and the jitter modest so the flipped layers do not overlap.

## Summary

A raincloud plot is three ggplot2 layers on one baseline: a half-violin cloud, a slim boxplot, and jittered raw points. Building it by hand, you learned that the cloud is just a density curve drawn on one side, and that clever x-axis positioning is what keeps the three layers from colliding.

| Layer | What draws it (from scratch) | What it shows |
|---|---|---|
| Cloud | `geom_polygon()` on a `density()` outline | The distribution's shape (peaks, gaps, skew) |
| Summary | `geom_boxplot()` nudged left, narrow | Median and quartiles |
| Rain | `geom_point()` jittered, furthest left | Every individual observation |
| Order | `factor(levels = names(sort(medians)))` | A readable ranking of groups |

![Raincloud plots overview](screenshots/Raincloud-Plots-in-R-overview.webp)
*Figure 3: An overview of raincloud plots: their layers, why they help, how to build them, and shortcut packages.*

Reach for a raincloud whenever you would have drawn a boxplot but the shape matters: when a group might be skewed or bimodal rather than a single smooth hump. Order the groups by median, flip to horizontal for long labels, and once you are comfortable, let `ggdist` or `ggrain` do the assembly for you.

## References

1. Allen, M., Poggiali, D., Whitaker, K., Marshall, T. R., & Kievit, R. A. (2019). Raincloud plots: a multi-platform tool for robust data visualization. *Wellcome Open Research*, 4:63. [Link](https://wellcomeopenresearch.org/articles/4-63) - the paper that introduced and named the raincloud plot.
2. ggplot2 reference: `geom_violin()`. [Link](https://ggplot2.tidyverse.org/reference/geom_violin.html) - the density layer the cloud is built from, with every argument documented.
3. ggplot2 reference: `geom_boxplot()`. [Link](https://ggplot2.tidyverse.org/reference/geom_boxplot.html) - options for the summary layer, including `outlier.shape` and `width`.
4. R documentation: `density()` kernel density estimation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/density.html) - how the cloud's curve is computed and what `adjust` and `bw` control.
5. ggdist: Visualizations of Distributions and Uncertainty. [Link](https://mjskay.github.io/ggdist/) - the package way to draw the cloud, plus uncertainty and interval geoms.
6. ggrain: A Rainclouds Geom for ggplot2. [Link](https://github.com/njudd/ggrain) - a one-call `geom_rain()`, including connected points for repeated measures.
7. Scherer, C. Raincloud Plots with ggplot2. [Link](https://z3tt.github.io/Rainclouds/) - a widely cited walkthrough with polished styling ideas.

## Continue Learning

- [Violin Plot in R](Violin-Plot-in-R.html): the full-density cousin of the cloud, and where the raincloud's shape layer comes from.
- [ggdist Package in R](ggdist-Package-in-R.html): the package way to build rainclouds, plus uncertainty and interval visualizations.
- [ggplot2 geom_boxplot in R](ggplot2-geom_boxplot-in-R.html): master the boxplot layer that forms a raincloud's summary.
