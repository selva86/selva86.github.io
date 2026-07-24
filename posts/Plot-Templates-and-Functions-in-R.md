---
title: "Plot Templates in R: Functions that Return ggplots"
slug: "Plot-Templates-and-Functions-in-R"
description: "Learn to write R functions that build and return ggplot objects. Pass column names with curly-curly and .data, batch-make charts, and reuse one style."
keywords: "plot templates in R, function that returns ggplot, reusable ggplot function, ggplot column name argument, tidy evaluation ggplot2, curly curly ggplot, .data pronoun ggplot, ggplot2 helper function"
auto_link_terms: "function that returns a ggplot|plot template|plot templates|reusable ggplot function|ggplot template function|embracing operator|{{ }} operator|.data pronoun|programming with ggplot2|ggplot helper function"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-25"
curriculum_id: "GG2-12.3"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Plot Template Functions"
sidebar_order: "61"
difficulty: "Intermediate"
---

<p class="lead">A plot template is an R function that builds and returns a <strong>ggplot object</strong>, so a single call redraws the same styled chart for any data or columns you hand it. Instead of copy-pasting the same twelve lines for every variable, you write the recipe once and reuse it everywhere.</p>

You already build charts by stacking layers with `+`. This tutorial shows you how to capture that whole stack inside a function, so the plot becomes a reusable tool. We use ggplot2 throughout, and every code block runs directly in your browser, so you can change a line and re-run it as you read.

## Why wrap a ggplot in a function?

Picture this. You have several numeric columns and you want the same clean scatter for each one, so you paste the same block over and over. Then someone asks for a different theme, and now you are hand-editing every copy. A function fixes that: you describe the chart once, and every call reproduces it. Here is the idea in action.

First, let's load ggplot2 and look at the data we will chart. The built-in `mpg` dataset holds fuel-economy figures for 234 car models.

```r title="Load ggplot2 and peek at the data"
library(ggplot2)

# mpg: fuel economy for 234 car models, built into ggplot2
mpg_data <- mpg
head(mpg_data[, c("displ", "hwy", "class")], 3)
#> # A tibble: 3 × 3
#>   displ   hwy class  
#>   <dbl> <int> <chr>  
#> 1   1.8    29 compact
#> 2   1.8    29 compact
#> 3   2      31 compact
```

Each row is one car. We will plot engine size (`displ`, in litres) against highway mileage (`hwy`). Now let's wrap that plot in a function. The function takes a data frame, builds a scatter with a fixed style, and returns it.

```r title="Define your first plot template"
# A template: the same styled scatter for whatever data you pass in
scatter_hwy <- function(data, point_color = "#2c7fb8") {
  ggplot(data, aes(x = displ, y = hwy)) +
    geom_point(color = point_color, size = 2.5, alpha = 0.7) +
    labs(x = "Engine displacement (litres)", y = "Highway mpg") +
    theme_minimal(base_size = 13)
}

# Call it once, get a full chart back
scatter_hwy(mpg_data)
```

Read the function top to bottom. It names one argument, `data`, plus a `point_color` with a default. Inside, it stacks the usual ggplot layers, and because that stack is the last thing in the function, it becomes the return value. Calling `scatter_hwy(mpg_data)` draws the chart you would expect: mileage falls as engines grow.

The real payoff shows up when you point the same template at a different slice of the data. No copy-paste, just another call.

```r title="Reuse the template on a subset"
suvs <- subset(mpg_data, class == "suv")
scatter_hwy(suvs, point_color = "#d95f0e")
```

Here we filter down to SUVs and hand that subset to the very same function, this time asking for an orange colour. One definition, two charts, identical styling. Change the theme in the function once and every chart that uses it updates together.

![How a plot template takes data and returns a ggplot object you can print or extend.](screenshots/Plot-Templates-and-Functions-in-R-template-flow.webp)
*Figure 1: A plot template takes data and column names, returns a ggplot object, then you print it or add more layers.*

[KEY INSIGHT]
**A plot template turns a chart into a reusable tool.** You describe the styling and structure once inside a function, then every call reproduces it, so a single edit restyles every chart that uses the template.

**Try it:** The two-seater sports cars are their own class in `mpg`. Filter them and hand the subset to `scatter_hwy()` with a red colour.

```r title="Your turn: chart the two-seaters"
# Filter to the two-seater class, then call scatter_hwy() on that subset.
# ex_sports <- subset(mpg_data, class == ____)
# scatter_hwy(ex_sports, point_color = "#c0392b")
# target: a small scatter of just the two-seater sports cars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-seater scatter solution"
ex_sports <- subset(mpg_data, class == "2seater")
scatter_hwy(ex_sports, point_color = "#c0392b")
```

**Explanation:** `subset()` keeps only the rows where `class` equals `"2seater"`, and the template does the rest. Nothing about the plotting code changed, only the data flowing into it.

</details>

## Is a ggplot just an object you can store and return?

That reuse works because of something you may not have noticed: a ggplot is an ordinary R object. When you type `ggplot(...) + geom_point()`, R does not draw anything. It builds a value and hands it back. The chart only appears when that value is printed. That is exactly why a function can return one.

Let's prove it. We will store a plot in a variable and ask R what kind of thing it is.

```r title="Store a plot in a variable"
p <- scatter_hwy(mpg_data)

class(p)[1]           # its most specific class
#> [1] "ggplot2::ggplot"
inherits(p, "ggplot") # is it really a ggplot?
#> [1] TRUE
```

Assigning to `p` produced no chart, which confirms that building and drawing are separate steps. The object reports its class as `"ggplot2::ggplot"` (it also carries the shorter `"gg"` and `"ggplot"` tags), and `inherits(p, "ggplot")` returns `TRUE`. So `p` is a value you can pass around, store in a list, or return from a function.

Being an object also means you can inspect it and keep building on it. Every ggplot holds its axis labels and a stack of drawing layers.

```r title="Inspect and extend a stored plot"
p$labels                 # the axis labels baked in
#> <ggplot2::labels> List of 2
#>  $ x: chr "Engine displacement (litres)"
#>  $ y: chr "Highway mpg"

length(p$layers)         # how many drawing layers so far
#> [1] 1

p_fit <- p + geom_smooth(method = "lm", se = FALSE, color = "black")
length(p_fit$layers)     # adding a trend line makes two
#> [1] 2
```

The labels are the ones our template set with `labs()`. The plot starts with one layer (the points), and adding `geom_smooth()` returns a new plot with two layers. Print `p_fit` and you will see a straight trend line over the points. This is the whole trick behind templates: a function can return `p`, and the caller can still add more layers afterward.

[NOTE]
**Building a plot and drawing it are two different actions.** Storing a ggplot in a variable creates the object silently; the chart is rendered only when the object is printed, which happens automatically when you type its name on its own line.

**Try it:** Start from the stored plot `p` and add a `geom_rug()` layer, then count the layers.

```r title="Your turn: add a rug and count layers"
# p already has one layer of points. Add geom_rug() to it and count.
# ex_rug <- p + ____
# length(ex_rug$layers)
# target: the layer count rises from 1 to 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rug layer solution"
ex_rug <- p + geom_rug()
length(ex_rug$layers)
#> [1] 2
```

**Explanation:** `geom_rug()` adds tick marks along the axes as a second drawing layer, so the count goes from one to two. Adding a layer never changes the original `p`; it returns a new plot.

</details>

## How do you write your first plot template function?

So far the template has been a single expression. Real templates need arguments with sensible defaults and a clear value to return. Let's look at the anatomy by rewriting the function a little more carefully.

```r title="A template with defaults and return()"
scatter_hwy <- function(data, point_color = "#2c7fb8", title = NULL) {
  g <- ggplot(data, aes(x = displ, y = hwy)) +
    geom_point(color = point_color, size = 2.5, alpha = 0.7) +
    labs(x = "Engine displacement (litres)", y = "Highway mpg",
         title = title) +
    theme_minimal(base_size = 13)
  return(g)
}

compact <- subset(mpg_data, class == "compact")
scatter_hwy(compact, title = "Compact cars: engine size vs highway mpg")
```

Three things changed. We added a `title` argument that defaults to `NULL`, so callers can add a headline when they want one and skip it otherwise. We assembled the plot into a variable `g` and then wrote `return(g)` to make the return value explicit. And we passed `title` straight into `labs()`. Because `NULL` tells `labs()` to draw no title, the default behaviour is unchanged.

You do not strictly need `return()`, since R returns the last expression automatically, but naming the object makes longer templates easier to read. Let's confirm the function really does hand back a plot object.

```r title="The function hands back a plot object"
q <- scatter_hwy(compact)
inherits(q, "ggplot")
#> [1] TRUE
```

`q` holds the returned plot, and `inherits()` confirms it is a ggplot. Everything you learned in the last section applies: you can store it, inspect it, or add layers to it.

[TIP]
**Give every argument a sensible default.** When you set defaults like point_color and title, callers can use the template with a single argument for the common case and override only what they need, which keeps everyday calls short.

**Try it:** Add a `point_size` argument to a template so callers can control the dot size.

```r title="Your turn: add a point_size argument"
# Fill the blank so geom_point() uses the point_size argument.
# ex_scatter <- function(data, point_size = 2.5) {
#   ggplot(data, aes(displ, hwy)) +
#     geom_point(size = ____) +
#     theme_minimal()
# }
# ex_scatter(mpg_data, point_size = 4)
# target: the same scatter with noticeably bigger dots
```

<details>
<summary>Click to reveal solution</summary>

```r title="point_size argument solution"
ex_scatter <- function(data, point_size = 2.5) {
  ggplot(data, aes(displ, hwy)) +
    geom_point(size = point_size) +
    theme_minimal()
}
ex_scatter(mpg_data, point_size = 4)
```

**Explanation:** The argument `point_size` flows into `geom_point(size = point_size)`, so `point_size = 4` draws larger dots. Its default of `2.5` keeps the ordinary call unchanged.

</details>

## How do you pass column names into a plot template?

Our template still hardcodes `displ` and `hwy`. To make it truly reusable, the columns themselves must become arguments. This is the one genuinely tricky part of writing plot templates, so let's go slowly.

The obvious attempt fails. If you write `aes(x = xcol)` and call the function with `xcol = displ`, ggplot looks for a column literally named `"xcol"`, which does not exist. The fix is the embracing operator, written as double braces `{{ }}`. It tells ggplot, "do not take this argument literally; look up whatever column the caller passed." Wrap each column argument in `{{ }}` inside `aes()`.

```r title="Pass columns with the embracing operator"
scatter_any <- function(data, xcol, ycol, point_color = "#2c7fb8") {
  ggplot(data, aes(x = {{ xcol }}, y = {{ ycol }})) +
    geom_point(color = point_color, size = 2.5, alpha = 0.7) +
    theme_minimal(base_size = 13)
}

# City vs highway mileage, with no quotes around the column names
scatter_any(mpg_data, cty, hwy)
```

Now the template accepts any two columns. We passed `cty` and `hwy` as bare names, and `{{ }}` forwarded them into `aes()`. Call it again with `displ` and `hwy`, or any other pair, and it just works.

There is a pleasant bonus: ggplot labels the axes with the column names automatically. You can ask the plot what titles it will draw with `get_labs()`.

```r title="ggplot names the axes for you"
p2 <- scatter_any(mpg_data, cty, hwy)

get_labs(p2)$x   # the x axis title ggplot will draw
#> [1] "cty"
get_labs(p2)$y   # and the y axis title
#> [1] "hwy"
```

The axis titles came straight from the columns you embraced, with no `labs()` call needed. That is one less thing for the template to manage.

Sometimes the column name arrives as a string instead of a bare name, for example when it comes from a loop or a user selecting from a menu. For that case, ggplot gives you the `.data` pronoun: `.data[[xcol]]` means "the column whose name is the string in `xcol`."

```r title="Use .data when the column is a string"
scatter_str <- function(data, xcol, ycol, point_color = "#2c7fb8") {
  ggplot(data, aes(x = .data[[xcol]], y = .data[[ycol]])) +
    geom_point(color = point_color, size = 2.5, alpha = 0.7) +
    labs(x = xcol, y = ycol, title = paste(ycol, "versus", xcol)) +
    theme_minimal(base_size = 13)
}

# Column names arrive as text, in quotes
scatter_str(mpg_data, "cty", "hwy")
```

The columns now come in as quoted strings, and `.data[[xcol]]` looks them up by name. Because the names are plain text, we can also build a title with `paste()`. Use `{{ }}` when the caller types a bare column name, and `.data[[...]]` when the name is stored as a string.

![Three ways to feed columns into a plot template: embracing, the .data pronoun, and vars.](screenshots/Plot-Templates-and-Functions-in-R-passing-columns.webp)
*Figure 2: Three ways to feed columns into a template: embrace unquoted names, use the .data pronoun for strings, and wrap grouping variables in vars().*

[WARNING]
**Avoid the old aes_string() function.** Older tutorials pass string column names with aes_string(), which ggplot2 has deprecated. Use the embracing operator for bare names and the .data pronoun for strings instead; both are the current, supported approach.

**Try it:** Finish a template so its y aesthetic maps to whatever column the caller passes.

```r title="Your turn: embrace a column"
# Fill the blank so the y aesthetic uses the ycol argument.
# ex_dot <- function(data, ycol) {
#   ggplot(data, aes(x = class, y = ____)) +
#     geom_jitter(width = 0.2, color = "#2c7fb8") +
#     theme_minimal()
# }
# ex_dot(mpg_data, hwy)
# target: highway mpg spread across the car classes
```

<details>
<summary>Click to reveal solution</summary>

```r title="Embrace a column solution"
ex_dot <- function(data, ycol) {
  ggplot(data, aes(x = class, y = {{ ycol }})) +
    geom_jitter(width = 0.2, color = "#2c7fb8") +
    theme_minimal()
}
ex_dot(mpg_data, hwy)
```

**Explanation:** Wrapping `ycol` in `{{ }}` forwards the bare column name into `aes()`, so `ex_dot(mpg_data, hwy)` plots `hwy` on the y axis. `geom_jitter()` spreads the points so overlapping values stay visible.

</details>

## How do you facet a template programmatically?

Splitting a chart into small panels, one per group, is called faceting. It needs its own trick inside a function. You cannot embrace a column directly inside `facet_wrap()`; instead you wrap the grouping column in `vars()`, which is the faceting counterpart of `{{ }}`. Combine the two and the grouping variable becomes an argument too.

```r title="Facet by a column argument"
faceted_scatter <- function(data, xcol, ycol, by) {
  ggplot(data, aes(x = {{ xcol }}, y = {{ ycol }})) +
    geom_point(color = "#2c7fb8", alpha = 0.7) +
    facet_wrap(vars({{ by }})) +
    theme_minimal(base_size = 12)
}

# One panel per drive type: 4-wheel, front, rear
faceted_scatter(mpg_data, displ, hwy, drv)
```

The template maps `xcol` and `ycol` with embracing as before, then splits into panels by `by`. Writing `vars({{ by }})` passes the caller's grouping column through to `facet_wrap()`. The call above produces three panels, one for each drive type, each an identical mini scatter.

[TIP]
**Reach for label_both to keep facet strips clear.** Passing labeller = label_both to facet_wrap() prints both the variable name and its value on each strip, such as drv: f, which is easier to read than the bare value when you share the chart.

**Try it:** Reuse `faceted_scatter()` but split the panels by car class instead of drive type.

```r title="Your turn: facet by car class"
# Pass class as the grouping variable.
# ex_facets <- faceted_scatter(mpg_data, displ, hwy, ____)
# ex_facets
# target: one small scatter panel per car class
```

<details>
<summary>Click to reveal solution</summary>

```r title="Facet by class solution"
ex_facets <- faceted_scatter(mpg_data, displ, hwy, class)
ex_facets
```

**Explanation:** Passing `class` as the `by` argument sends it through `vars({{ by }})` into `facet_wrap()`, so you get one panel per car class. The rest of the template is untouched.

</details>

## How do you generate many plots at once?

Here is where templates pay off at scale. Because each call returns an object, you can loop over a set of columns and collect the results in a list. `lapply()` runs a function once per element of a vector and gathers the return values, so pointing it at column names gives you one plot per column.

```r title="Build one plot per column with lapply"
num_cols <- c("displ", "cty", "hwy")

plots <- lapply(num_cols, function(col) {
  ggplot(mpg_data, aes(x = .data[[col]])) +
    geom_histogram(bins = 20, fill = "#2c7fb8", color = "white") +
    labs(title = col) +
    theme_minimal(base_size = 11)
})

length(plots)          # one ggplot per column name
#> [1] 3
class(plots[[1]])[1]   # each element is a real plot
#> [1] "ggplot2::ggplot"
```

We looped over three column names. Since `col` is a string on each pass, we look the column up with `.data[[col]]`. The result, `plots`, is a list of three ggplot objects, confirmed by its length and the class of its first element. Each histogram is titled with its own column name.

A list of plots is only useful if you can lay them out together. The patchwork package lets you combine ggplots with `+` or arrange a whole list at once with `wrap_plots()`.

```r title="Combine the list with patchwork"
library(patchwork)

# wrap_plots lays the whole list out in a grid
wrap_plots(plots, ncol = 3)
```

`wrap_plots(plots, ncol = 3)` arranges the three histograms side by side in a single figure. Add a column to `num_cols` and rerun, and the grid grows automatically, with no layout code to touch.

[NOTE]
**purrr::map is the tidyverse version of lapply.** If you already use the tidyverse, map(num_cols, function(col) ...) does the same job as lapply() and returns the same list of plots. Pick whichever style your code already uses.

**Try it:** Add the `year` column to the vector, rebuild the list the same way, and count it.

```r title="Your turn: add a fourth histogram"
# Add "year" to the vector, then rebuild the list and count it.
# ex_cols <- c("displ", "cty", "hwy", ____)
# ex_plots <- lapply(ex_cols, function(col) {
#   ggplot(mpg_data, aes(.data[[col]])) + geom_histogram(bins = 15)
# })
# length(ex_plots)
# target: the list now holds four plots
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fourth histogram solution"
ex_cols <- c("displ", "cty", "hwy", "year")
ex_plots <- lapply(ex_cols, function(col) {
  ggplot(mpg_data, aes(.data[[col]])) + geom_histogram(bins = 15)
})
length(ex_plots)
#> [1] 4
```

**Explanation:** Adding `"year"` makes the vector four names long, so `lapply()` builds four plots. The pattern scales to any number of columns without new code.

</details>

## How do you build reusable style add-ons with list()?

Templates do not have to return a whole plot. A function that returns a `list()` of layers, scales and theme tweaks becomes a reusable component you graft onto any chart with `+`. ggplot accepts a list on the right of `+` and splices each element in as if you had added them one by one.

```r title="A style add-on that returns a list"
# Not a whole plot: just a bundle of styling you can add to any chart
brand_style <- function(base_size = 13) {
  list(
    scale_color_brewer(palette = "Dark2"),
    theme_minimal(base_size = base_size),
    theme(plot.title = element_text(face = "bold"),
          legend.position = "top")
  )
}

ggplot(mpg_data, aes(displ, hwy, color = drv)) +
  geom_point(size = 2, alpha = 0.8) +
  labs(title = "Highway mpg by engine size") +
  brand_style()
```

`brand_style()` returns three things bundled in a list: a colour scale, a base theme, and a couple of theme overrides. Adding `brand_style()` to the plot applies all three at once. The beauty is that this bundle is not tied to any particular chart. Point it at a completely different geom and it still works.

```r title="Graft the same style onto a boxplot"
ggplot(mpg_data, aes(class, hwy, color = drv)) +
  geom_boxplot() +
  brand_style()
```

Same styling function, a boxplot this time. Your whole team can share one `brand_style()` and every chart comes out looking consistent, whether it is a scatter, a boxplot, or a bar chart.

[KEY INSIGHT]
**A list on the right of + is spliced in layer by layer.** Returning list(scale, theme, ...) from a function gives you a plus-able style pack, so one add-on can restyle every chart in a project without repeating the theme code.

**Try it:** Write a small add-on that moves the legend to the bottom.

```r title="Your turn: move the legend to the bottom"
# Fill the blank so legend.position is "bottom".
# ex_style <- function() {
#   list(
#     theme_minimal(base_size = 12),
#     theme(legend.position = ____)
#   )
# }
# ggplot(mpg_data, aes(displ, hwy, color = drv)) + geom_point() + ex_style()
# target: the same scatter with its legend along the bottom
```

<details>
<summary>Click to reveal solution</summary>

```r title="Legend at bottom solution"
ex_style <- function() {
  list(
    theme_minimal(base_size = 12),
    theme(legend.position = "bottom")
  )
}
ggplot(mpg_data, aes(displ, hwy, color = drv)) + geom_point() + ex_style()
```

**Explanation:** The add-on returns a list with a theme that sets `legend.position = "bottom"`. Because it is just a list of components, you can add it to any plot with `+`.

</details>

## How do you assemble a complete plotting toolkit?

Let's put the pieces together. A good toolkit keeps two jobs separate: one function for house style, and one for the chart structure. Then a single call produces a finished, branded chart. We will build both, use them, and then prove the result is still a plain ggplot by extending it.

```r title="Combine a style add-on and a column template"
report_style <- function() {
  list(
    theme_minimal(base_size = 12),
    theme(plot.title = element_text(face = "bold"),
          plot.subtitle = element_text(color = "grey40"))
  )
}

titled_scatter <- function(data, xcol, ycol, color_by, title, subtitle = NULL) {
  ggplot(data, aes(x = {{ xcol }}, y = {{ ycol }}, color = {{ color_by }})) +
    geom_point(size = 2, alpha = 0.8) +
    labs(title = title, subtitle = subtitle, color = NULL) +
    report_style()
}

p_final <- titled_scatter(
  mpg_data, displ, hwy, drv,
  title = "Bigger engines, lower highway mpg",
  subtitle = "Fuel economy for 234 cars, coloured by drivetrain"
)
inherits(p_final, "ggplot")
#> [1] TRUE
```

`report_style()` carries the house style, and `titled_scatter()` handles structure, taking three embraced columns plus a title and subtitle. One call assembles a fully branded chart, and `inherits()` confirms `p_final` is a normal ggplot. Because it is, you can keep customising it after the fact.

```r title="The toolkit output is still an ordinary ggplot"
# p_final came from a template, yet + still works on it
p_final + facet_wrap(vars(drv))
```

Adding `facet_wrap(vars(drv))` splits the branded chart into one panel per drive type. This is the point worth remembering: templates give you a fast, consistent starting chart, and you never lose the ability to tweak the result with ordinary ggplot code.

[TIP]
**Keep style and structure in separate functions.** A style add-on such as report_style() and a structure template such as titled_scatter() can change independently, so you can restyle every chart in one place without touching the code that decides what each chart shows.

**Try it:** `p_final` is a normal ggplot. Give it a new title with `labs()`.

```r title="Your turn: give p_final a new title"
# Overwrite the title on p_final with labs().
# ex_final <- p_final + labs(title = ____)
# ex_final
# target: the toolkit plot with a title you chose
```

<details>
<summary>Click to reveal solution</summary>

```r title="Retitle p_final solution"
ex_final <- p_final + labs(title = "Fuel economy across drivetrains")
ex_final
```

**Explanation:** `labs(title = ...)` added after the template overwrites the title the template set. The template gives you a strong default, and `+` lets you adjust anything afterward.

</details>

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution. The exercises use their own variable names so they will not clash with the tutorial code above.

### Exercise 1: A reusable bar-chart template

Write a function `bar_template(data, cat_col)` that returns a horizontal bar chart of category counts for whatever categorical column you pass. Map the embraced column to the `y` aesthetic, use `geom_bar()` (it counts rows for you), and add `theme_minimal()`. Test it on the `class` column.

```r title="Exercise 1 starter"
# Write bar_template(data, cat_col):
#  - map y to the embraced cat_col
#  - add geom_bar() and theme_minimal()
# Then test:
# ex1 <- bar_template(mpg_data, class)
# inherits(ex1, "ggplot")
# target: inherits(ex1, "ggplot") returns TRUE and a bar chart of class counts
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
bar_template <- function(data, cat_col) {
  ggplot(data, aes(y = {{ cat_col }})) +
    geom_bar(fill = "#2c7fb8") +
    theme_minimal(base_size = 12)
}

ex1 <- bar_template(mpg_data, class)
inherits(ex1, "ggplot")
#> [1] TRUE
```

**Explanation:** Embracing `cat_col` lets the caller pass any categorical column. Mapping it to `y` makes the bars horizontal, and `geom_bar()` counts the rows in each category for you.

</details>

### Exercise 2: Batch-generate density plots

Write `make_densities(data, cols)`, where `cols` is a character vector of column names. Return a list with one `geom_density()` plot per column, looking each column up with `.data[[col]]`. Then combine the list with patchwork and confirm the pieces.

```r title="Exercise 2 starter"
# Write make_densities(data, cols) returning one density plot per column name.
# Look columns up with .data[[col]]. Then combine with patchwork.
# ex2 <- make_densities(mpg_data, c("displ", "cty", "hwy"))
# length(ex2)
# ex2_grid <- wrap_plots(ex2, ncol = 3)
# inherits(ex2_grid, "patchwork")
# target: length 3, and the combined grid is a patchwork object
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
make_densities <- function(data, cols) {
  lapply(cols, function(col) {
    ggplot(data, aes(x = .data[[col]])) +
      geom_density(fill = "#2c7fb8", alpha = 0.5) +
      labs(title = col) +
      theme_minimal(base_size = 11)
  })
}

ex2 <- make_densities(mpg_data, c("displ", "cty", "hwy"))
length(ex2)
#> [1] 3

ex2_grid <- wrap_plots(ex2, ncol = 3)
inherits(ex2_grid, "patchwork")
#> [1] TRUE
```

**Explanation:** `lapply()` builds one density plot per name, using `.data[[col]]` because the names are strings. `wrap_plots()` arranges the whole list into a single patchwork figure.

</details>

### Exercise 3: A shareable dark-theme add-on

Build a `+`-able add-on `dark_style()` that returns a `list()` containing `scale_color_viridis_d()`, `theme_dark()`, and a legend moved to the bottom. Apply it to two different charts to prove it is reusable.

```r title="Exercise 3 starter"
# Build dark_style() returning a list of:
#  - scale_color_viridis_d()
#  - theme_dark()
#  - theme(legend.position = "bottom")
# Apply it to two different charts.
# ex3 <- ggplot(mpg_data, aes(displ, hwy, color = drv)) + geom_point() + dark_style()
# inherits(ex3, "ggplot")
# target: inherits(ex3, "ggplot") is TRUE, and the add-on also styles a boxplot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
dark_style <- function() {
  list(
    scale_color_viridis_d(),
    theme_dark(base_size = 12),
    theme(legend.position = "bottom")
  )
}

ex3 <- ggplot(mpg_data, aes(displ, hwy, color = drv)) +
  geom_point() +
  dark_style()
inherits(ex3, "ggplot")
#> [1] TRUE

# Same add-on, a different chart:
ggplot(mpg_data, aes(class, hwy, color = drv)) +
  geom_boxplot() +
  dark_style()
```

**Explanation:** `dark_style()` bundles a colour scale, a dark theme, and a legend position into a list, so a single `+` restyles any chart. Adding it to both a scatter and a boxplot shows it does not care what geom you use.

</details>

## Frequently Asked Questions

**What is the difference between `{{ }}` and `.data[[ ]]` when passing a column to a plot template?** Use the embracing operator `{{ }}` when the caller types a bare, unquoted column name, as in `scatter_any(mpg_data, cty, hwy)`. Use the `.data` pronoun `.data[[xcol]]` when the column name arrives as a string like `"cty"`, which is what you get from a loop or a menu selection. Both map the same column; they only differ in whether the name starts out bare or quoted.

**Why does my plot function say "object 'xcol' not found"?** You most likely wrote `aes(x = xcol)` and passed the column as an argument. ggplot took `xcol` literally and looked for a column named "xcol", which does not exist. Wrap the argument in `{{ }}` for a bare name, or use `.data[[xcol]]` for a string, so ggplot looks up the column the caller actually passed.

**Do I still need `aes_string()` to pass column names?** No. `aes_string()` is deprecated in current ggplot2. The embracing operator `{{ }}` replaces it for bare names, and `.data[[var]]` replaces it for names held as strings. Both are the supported approach today.

**How do I let a template facet by a column the caller chooses?** You cannot embrace a column directly inside `facet_wrap()`. Wrap the grouping argument in `vars()` instead, written as `facet_wrap(vars({{ by }}))`. That is the faceting counterpart of `{{ }}`, and it lets the grouping variable become an argument like any other.

**Can a plot template return something other than a whole plot?** Yes. A function that returns a `list()` of scales, themes, and layers becomes a reusable add-on you attach to any chart with `+`. ggplot splices each element of the list in as if you had added them one at a time, so one `brand_style()` can restyle every chart in a project.

**How do I combine several plots made by a template into one figure?** Collect them in a list, for example with `lapply()` over a vector of column names, then pass that list to `wrap_plots()` from the patchwork package. `wrap_plots(plots, ncol = 3)` lays them out in a grid, and the grid grows on its own as you add more plots to the list.

## Summary

A plot template is just a function that returns a ggplot object. That one idea gives you reuse, batch generation, and shared styling across a whole project.

| Technique | What it does | Key syntax |
|---|---|---|
| Full-plot template | Returns a finished, styled chart | `function(data) ggplot(...) + ...` |
| Bare column argument | Passes an unquoted column name | `aes(x = {{ xcol }})` |
| String column argument | Passes a column name held as text | `aes(x = .data[[xcol]])` |
| Faceting argument | Splits panels by a passed column | `facet_wrap(vars({{ by }}))` |
| Batch generation | One plot per column, then combine | `lapply(cols, ...)` + `wrap_plots()` |
| Style add-on | A plus-able bundle of styling | `function() list(scale, theme, ...)` |

The figure below sums up the four kinds of template you can build from these pieces.

![The four kinds of plot template: full plot, column arguments, style add-on, and batch generator.](screenshots/Plot-Templates-and-Functions-in-R-toolkit-mindmap.webp)
*Figure 3: The four kinds of plot template you can build.*

Start with a full-plot template for your most common chart, add column arguments when you need flexibility, and pull shared styling into a `list()` add-on once you notice yourself repeating theme code.

## References

1. ggplot2 documentation. *Construct aesthetic mappings with aes() and the embracing operator*. [Link](https://ggplot2.tidyverse.org/reference/aes.html)
2. Tidyverse blog. *Tidy evaluation in ggplot2*. [Link](https://www.tidyverse.org/blog/2018/07/ggplot2-tidy-evaluation/)
3. dplyr documentation. *Programming with dplyr (embracing, the .data pronoun)*. [Link](https://dplyr.tidyverse.org/articles/programming.html)
4. Wickham, H. *Advanced R*, 2nd Edition. Metaprogramming. [Link](https://adv-r.hadley.nz/metaprogramming.html)
5. patchwork documentation. *Combining ggplots into a single figure*. [Link](https://patchwork.data-imaginist.com/)
6. Wickham, H., Cetinkaya-Rundel, M., and Grolemund, G. *R for Data Science*, 2nd Edition. Functions. [Link](https://r4ds.hadley.nz/functions.html)

## Continue Learning

- [Build a Complete ggplot2 Theme from Scratch](Build-a-ggplot2-Theme-in-R.html): turn the styling in your templates into a full, named theme you can ship.
- [Write Your Own ggplot2 Geom and Stat](Write-a-ggplot2-Extension-in-R.html): go one level deeper and package a custom chart type as a reusable layer.
- [How to Read ggplot2 Code: 10 Real Plots Deconstructed](Reading-ggplot2-Code-in-R.html): read and adapt any ggplot2 code you find with confidence.
