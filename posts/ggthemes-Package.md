---
title: "ggthemes Package in R: Economist, FiveThirtyEight & 20 More Ready-Made Themes"
slug: "ggthemes-Package"
description: "Learn the ggthemes package in R: apply theme_economist(), theme_fivethirtyeight() and 20 more ready-made themes with runnable code and paired colour scales."
keywords: "ggthemes package R, ggthemes, theme_economist, theme_fivethirtyeight, ggplot2 themes, theme_wsj, theme_tufte, R visualization themes, ggplot2 ready-made themes"
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "FR-cust-1"
post_type: "FR"
auto_link_terms: "ggthemes|ggthemes package|theme_economist()|theme_fivethirtyeight()|theme_wsj()|theme_tufte()|theme_stata()|theme_hc()"
auto_link_case_sensitive: false
fr_parent: "ggplot2-Themes-in-R.html"
difficulty: "Intermediate"
---

# ggthemes Package in R: Economist, FiveThirtyEight & 20 More Ready-Made Themes

<p class="lead">The ggthemes package gives you 20+ publication-quality themes for ggplot2, Economist, FiveThirtyEight, Wall Street Journal, Tufte, and more, each with matching colour scales so your plots look polished in one line of code.</p>

## How Do You Apply a ggthemes Theme to Any ggplot?

The default ggplot2 theme is fine for exploration, but presentations and reports call for something more polished. The ggthemes package bundles ready-made themes modelled after well-known publications and software. Let's see the difference one line makes.

```r
library(ggplot2)
library(ggthemes)

base_plot <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point(size = 2.5) +
  labs(title = "Engine Size vs Highway Mileage",
       x = "Engine Displacement (L)",
       y = "Highway MPG")

base_plot + theme_economist() + scale_colour_economist()
#> A scatter plot with The Economist's signature blue-gray
#> background, bold axis labels, and matching colour palette
```

That single addition, `theme_economist()`, transformed a plain ggplot into something that looks like it belongs in a magazine. Every ggthemes theme works the same way: add it with `+` just like any other ggplot2 layer.

For comparison, here's the same plot with the default theme.

```r
base_plot
#> The standard ggplot2 gray-panel look — functional but plain
```

The difference is dramatic. The default theme works for quick exploration, but ggthemes themes give you a professional finish without manually adjusting dozens of `theme()` parameters.

[TIP]
**Every ggthemes theme has a matching colour scale.** Pair theme_economist() with scale_colour_economist(), theme_wsj() with scale_colour_wsj(), and so on. The colours are designed to work together, mix-and-matching creates visual clashes.

**Try it:** Apply `theme_fivethirtyeight()` to `base_plot` and see how the style changes.

```r
# Try it: apply FiveThirtyEight's theme
ex_fte <- base_plot +
  # your code here

ex_fte
#> Expected: gray background, large text, no axis titles
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fte <- base_plot +
  theme_fivethirtyeight() +
  scale_colour_fivethirtyeight()
ex_fte
#> A scatter plot with FiveThirtyEight's signature gray
#> background, prominent gridlines, and 3-colour palette
```

**Explanation:** FiveThirtyEight's style uses a light gray background with bold gridlines and removes axis titles, the chart title carries the message.

</details>

## Which Themes Replicate Professional Publications?

Four ggthemes themes model real-world publications. Each has a distinct personality suited to different communication goals. Let's walk through them one at a time with chart types that showcase their strengths.

The Economist theme uses a bold blue-gray background with minimal gridlines. It pairs perfectly with bar charts, which The Economist uses heavily.

```r
econ_data <- data.frame(
  region = c("Asia", "Europe", "N. America", "S. America", "Africa"),
  growth = c(5.2, 1.8, 2.4, 3.1, 4.0)
)

ggplot(econ_data, aes(reorder(region, growth), growth, fill = region)) +
  geom_col(show.legend = FALSE) +
  labs(title = "GDP Growth by Region",
       subtitle = "Annual percentage change, 2024",
       x = NULL, y = "Growth (%)") +
  theme_economist() +
  scale_fill_economist()
#> A horizontal bar chart with the Economist's blue-gray
#> background and signature colour palette
```

The bars pop against the blue-gray background, and removing the legend (the axis labels are self-explanatory) keeps the chart clean. This is exactly how The Economist presents simple comparisons.

The Wall Street Journal theme strips charts down to essentials, no background colour, minimal axes, and high-contrast text. It works best with line charts.

```r
set.seed(101)
years <- 2015:2024
wsj_data <- data.frame(
  year = rep(years, 2),
  rate = c(cumsum(rnorm(10, 0.5, 0.3)), cumsum(rnorm(10, 0.3, 0.4))),
  group = rep(c("Series A", "Series B"), each = 10)
)

ggplot(wsj_data, aes(year, rate, colour = group)) +
  geom_line(linewidth = 1.2) +
  labs(title = "Cumulative Returns", colour = NULL) +
  theme_wsj() +
  scale_colour_wsj()
#> A line chart with WSJ's clean white background,
#> large title text, and no axis titles
```

Notice how theme_wsj() removes axis titles entirely. The WSJ style assumes the chart title and subtitle tell the story, so axis labels become redundant. If you need axis titles, layer `+ theme(axis.title = element_text())` on top.

FiveThirtyEight uses a distinctive gray background with large text. It's designed for data journalism where the chart needs to grab attention on a screen.

```r
ggplot(mpg, aes(class, fill = class)) +
  geom_bar(show.legend = FALSE) +
  labs(title = "Vehicle Types in the mpg Dataset",
       subtitle = "SUVs and compact cars dominate") +
  theme_fivethirtyeight() +
  scale_fill_fivethirtyeight()
#> A bar chart with FiveThirtyEight's light gray background,
#> large bold text, and vibrant 3-colour base palette
```

The FiveThirtyEight palette has just three base colours (blue, red, green), so it works best with datasets that have few categories. For more categories, combine it with a different colour scale.

The Stata theme gives a clean, academic look that statisticians recognise. It's a solid choice for papers and technical reports.

```r
ggplot(mtcars, aes(factor(cyl), mpg, fill = factor(cyl))) +
  geom_boxplot(show.legend = FALSE) +
  labs(title = "Fuel Economy by Cylinder Count",
       x = "Cylinders", y = "Miles per Gallon") +
  theme_stata() +
  scale_fill_stata()
#> A boxplot with Stata's white background, blue-gray axis
#> lines, and the familiar Stata colour palette
```

Stata's theme keeps gridlines subtle and uses a clean white background. Reviewers and collaborators who use Stata will feel right at home with these charts.

[KEY INSIGHT]
**The Economist theme uses a signature blue-gray background that carries the brand.** If you use theme_economist() without scale_colour_economist(), the default ggplot2 colours clash against that background. Always pair the theme and scale together.

**Try it:** Create a bar chart showing the average `mpg` for each `cyl` value in the mtcars dataset, styled with theme_wsj().

```r
# Try it: WSJ bar chart of avg mpg by cylinder
library(dplyr)

ex_wsj_data <- mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg))

# your code here
#> Expected: clean WSJ-style bar chart with large title
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_wsj_data <- mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg))

ggplot(ex_wsj_data, aes(factor(cyl), avg_mpg, fill = factor(cyl))) +
  geom_col(show.legend = FALSE) +
  labs(title = "Average MPG by Cylinders") +
  theme_wsj() +
  scale_fill_wsj()
#> A clean bar chart with WSJ styling — no axis titles,
#> large title text, minimal decoration
```

**Explanation:** theme_wsj() removes axis titles by default, so the chart title must be descriptive enough to stand alone.

</details>

## Which Themes Focus on Minimalism and Data Clarity?

Edward Tufte and Stephen Few champion the "data-ink ratio", maximise the ink spent on data, minimise everything else. These themes strip away gridlines, borders, and background fills to let the data speak.

The Tufte theme is the most aggressive minimalist. Combine it with `geom_tufteboxplot()` for Tufte's signature minimal box plot.

```r
ggplot(mpg, aes(class, hwy)) +
  geom_tufteboxplot() +
  labs(title = "Highway MPG by Vehicle Class",
       x = NULL, y = "Highway MPG") +
  theme_tufte()
#> Box plots rendered as thin lines with offset staples
#> instead of filled boxes — maximum data, minimum ink
```

Tufte's box plot replaces the traditional filled box with a thin vertical line and offset staples. Every mark on the chart represents a data value, no decorative fills or borders waste ink.

For axis lines that extend only to the data range (another Tufte principle), use `geom_rangeframe()`.

```r
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_rangeframe() +
  labs(title = "Weight vs Fuel Economy",
       x = "Weight (1000 lbs)", y = "MPG") +
  theme_tufte() +
  coord_cartesian(clip = "off")
#> Axis lines start and end at the data range, not at
#> arbitrary round numbers — the frame itself encodes info
```

The range frame makes the axis lines meaningful. Instead of running from 0 to some round number, each axis starts and ends at the min and max of the data. Even the axis tells you something.

[TIP]
**Combine theme_tufte() with geom_rangeframe() for axis lines that extend only to the data range.** Add coord_cartesian(clip = "off") so the range frame doesn't get clipped at the panel edge.

Stephen Few's theme is less radical than Tufte's. It keeps light gridlines for readability but strips away unnecessary borders and fills.

```r
ggplot(diamonds |> dplyr::sample_n(500), aes(carat, price, colour = cut)) +
  geom_point(alpha = 0.6) +
  labs(title = "Diamond Price vs Carat",
       x = "Carat", y = "Price ($)") +
  theme_few() +
  scale_colour_few()
#> A clean scatter plot with light gray gridlines,
#> no panel border, and Few's muted colour palette
```

The Few palette uses muted colours that work well in both print and on screen. The gridlines are subtle enough to guide the eye without competing with the data.

The igray theme inverts the typical grey scheme, gray panel on a white background. The clean theme is similar but even simpler.

```r
ggplot(mtcars, aes(hp, mpg)) +
  geom_point(aes(colour = factor(gear)), size = 2.5) +
  labs(title = "Horsepower vs MPG (theme_igray)",
       x = "Horsepower", y = "MPG") +
  theme_igray()
#> Light gray panel background, white surrounding area,
#> subtle gridlines — a gentle inversion of theme_gray()
```

The igray theme is a good middle ground. It's cleaner than the default but doesn't strip as much as Tufte or Few. Use it when you want a quiet, professional look without making a design statement.

**Try it:** Create a scatter plot of `wt` vs `mpg` from mtcars using theme_tufte() and geom_rangeframe().

```r
# Try it: Tufte scatter with range frame
ex_tufte <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  # your code here — add geom_rangeframe, theme_tufte, coord_cartesian

ex_tufte
#> Expected: minimal scatter with axis lines ending at data range
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_tufte <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_rangeframe() +
  theme_tufte() +
  coord_cartesian(clip = "off") +
  labs(x = "Weight (1000 lbs)", y = "MPG")
ex_tufte
#> A minimal scatter plot where axis lines only span the
#> data range — no decorative extensions or gridlines
```

**Explanation:** geom_rangeframe() draws axis lines from the data min to data max. The clip = "off" in coord_cartesian() prevents the frame from being cut at the panel boundary.

</details>

## Which Themes Match Popular Software Styles?

These themes recreate the look of charts from familiar software. Some are practical (matching an existing report style), and one is intentionally funny.

The original theme_excel() recreates Excel 97's infamous chart style, complete with the gray background and harsh gridlines that data visualisation experts love to hate.

```r
ggplot(mpg, aes(class, fill = class)) +
  geom_bar(show.legend = FALSE) +
  labs(title = "The Classic Excel 97 Look") +
  theme_excel() +
  scale_fill_excel()
#> Bold primary colours on a gray background — the chart
#> style that launched a thousand style guides
```

This theme exists as affectionate satire. The documentation itself notes it's not recommended for production. But if your boss insists on "the Excel look," now you know where to find it.

[WARNING]
**theme_excel() intentionally recreates Excel 97's much-criticised chart style.** It exists as satire, not a recommendation. For modern Office aesthetics, use theme_excel_new() instead.

The modern Office theme looks much better. It matches the cleaner style of Excel 2013 and later.

```r
ggplot(diamonds |> dplyr::sample_n(300), aes(carat, price, colour = cut)) +
  geom_point(alpha = 0.7) +
  labs(title = "Diamond Prices — Modern Office Style",
       x = "Carat", y = "Price ($)") +
  theme_excel_new() +
  scale_colour_excel_new()
#> Clean white background with modern Office colour palette —
#> the acceptable version of Excel charts
```

This one you can actually use. The colour palette is more restrained and the layout is cleaner. It's a solid choice when you want charts that match existing PowerPoint or Excel-based reports.

Google Docs, Highcharts, and LibreOffice Calc each have their own themes. Highcharts is especially useful for web dashboards.

```r
p <- ggplot(mtcars, aes(wt, mpg, colour = factor(cyl))) +
  geom_point(size = 2.5) +
  labs(title = "Weight vs MPG", x = "Weight", y = "MPG", colour = "Cyl")

p + theme_gdocs() + scale_colour_gdocs()
#> Google Docs' signature primary colours on white
```

```r
p + theme_hc() + scale_colour_hc()
#> Highcharts' default style — clean, web-optimised,
#> slightly rounded feel
```

The Highcharts theme also accepts a style argument. Use `theme_hc(style = "darkunica")` for a dark-background variant that works well in dark-mode dashboards.

```r
p + theme_hc(style = "darkunica") + scale_colour_hc("darkunica")
#> Dark charcoal background with bright accent colours —
#> ideal for dark-mode web dashboards
```

**Try it:** Apply theme_hc() with the "darkunica" style to a line chart of your own design using the economics dataset.

```r
# Try it: Highcharts dark mode line chart
ex_hc <- ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  # your code here

ex_hc
#> Expected: dark background with a bright line
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_hc <- ggplot(economics, aes(date, unemploy)) +
  geom_line(colour = "#2b908f", linewidth = 0.8) +
  labs(title = "US Unemployment Over Time",
       x = NULL, y = "Unemployed (thousands)") +
  theme_hc(style = "darkunica") +
  scale_colour_hc("darkunica")
ex_hc
#> A line chart with dark charcoal background and
#> the Highcharts dark theme's accent colour
```

**Explanation:** The "darkunica" style flips the background to dark charcoal. You often need to manually set geom colours to match the dark palette since scale_colour_hc only maps discrete aesthetics.

</details>

## How Do You Pair a Theme with Its Matching Colour Scale?

Every major ggthemes theme has a matching `scale_colour_*()` and `scale_fill_*()` function. Using the matching pair ensures colours work against the theme's background. Let's see what happens when you don't.

```r
econ_wrong <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point(size = 2) +
  labs(title = "Economist Theme — Default Colours") +
  theme_economist()

econ_wrong
#> The default ggplot2 colour scale includes light yellow
#> and pale green that vanish against the blue-gray background
```

Some default colours disappear against the Economist's blue-gray background. Now compare with the proper pairing.

```r
econ_right <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point(size = 2) +
  labs(title = "Economist Theme — Matched Colours") +
  theme_economist() +
  scale_colour_economist()

econ_right
#> All points are clearly visible — the Economist palette
#> uses high-contrast colours tuned for the blue-gray background
```

The matched palette uses colours specifically chosen to contrast with the theme's background. This is why pairing matters.

[KEY INSIGHT]
**Colour scales work independently of themes.** You can use scale_colour_tableau() with theme_minimal(), or scale_colour_few() with theme_classic(). The "matching" pairings look best, but you're free to mix and match when you need a specific palette's properties.

The ggthemes package also includes several standalone colour palettes, these don't have a matching theme but are useful with any theme.

```r
ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point(size = 2) +
  labs(title = "Tableau's 10-Colour Palette") +
  theme_minimal() +
  scale_colour_tableau()
#> A distinctive palette of 10 well-separated colours —
#> Tableau's default for categorical data
```

The Tableau palette is one of the best categorical palettes available, its 10 colours are maximally distinct and work in both print and on screen. Another excellent option is scale_colour_colorblind(), which uses an 8-colour palette safe for all common forms of colour vision deficiency.

```r
ggplot(mpg |> dplyr::filter(class %in% c("compact", "midsize", "suv", "pickup")),
       aes(displ, hwy, colour = class)) +
  geom_point(size = 2.5) +
  labs(title = "Colorblind-Safe Palette") +
  theme_minimal() +
  scale_colour_colorblind()
#> Four clearly distinguishable colours that remain distinct
#> under deuteranopia, protanopia, and tritanopia
```

If accessibility matters (and it should), scale_colour_colorblind() is a reliable default. It's also available as scale_colour_ptol() for Paul Tol's extended palette.

**Try it:** Apply scale_colour_colorblind() to a scatter plot of `hp` vs `mpg` from mtcars, coloured by `cyl`, using theme_minimal().

```r
# Try it: colorblind-safe scatter
ex_cb <- ggplot(mtcars, aes(hp, mpg, colour = factor(cyl))) +
  geom_point(size = 2.5) +
  # your code here

ex_cb
#> Expected: three clearly distinguishable colours on a minimal background
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cb <- ggplot(mtcars, aes(hp, mpg, colour = factor(cyl))) +
  geom_point(size = 2.5) +
  labs(title = "HP vs MPG — Colorblind-Safe",
       x = "Horsepower", y = "MPG", colour = "Cylinders") +
  theme_minimal() +
  scale_colour_colorblind()
ex_cb
#> Three colours that are clearly distinct even for
#> viewers with colour vision deficiency
```

**Explanation:** scale_colour_colorblind() maps discrete values to an 8-colour palette optimised for colour vision accessibility. It works with any ggplot2 theme.

</details>

## How Do You Customise a ggthemes Theme Further?

ggthemes themes are starting points, not straitjackets. Layer `+ theme(...)` on top to tweak individual elements, font sizes, legend position, axis text angles, panel spacing, without losing the theme's overall look.

Every ggthemes theme function accepts a `base_size` argument that controls the overall text scaling. Adjust this first, then fine-tune individual elements.

```r
ggplot(mpg, aes(class, fill = class)) +
  geom_bar(show.legend = FALSE) +
  labs(title = "Custom Economist Style",
       subtitle = "Adjusted fonts and legend position",
       x = NULL, y = "Count") +
  theme_economist(base_size = 11) +
  scale_fill_economist() +
  theme(
    plot.title = element_text(size = 14, face = "bold"),
    plot.subtitle = element_text(size = 10, colour = "gray40"),
    axis.text.x = element_text(angle = 45, hjust = 1, size = 9)
  )
#> The Economist's blue-gray background with smaller base text,
#> angled x-axis labels, and a custom subtitle colour
```

The key is the order: first apply the ggthemes theme, then layer your `theme()` overrides. Putting `theme()` before the ggthemes theme would wipe out your changes.

[NOTE]
**ggthemes theme functions accept a base_size argument.** Adjust base_size before adding individual theme() overrides, it scales all text proportionally. The default is usually 12 or 13 depending on the theme.

For repeated use, wrap your customisations in a function.

```r
house_style <- function(base_size = 11) {
  list(
    theme_few(base_size = base_size),
    scale_colour_few("Medium"),
    theme(
      plot.title = element_text(face = "bold", size = base_size + 3),
      plot.subtitle = element_text(colour = "gray40"),
      legend.position = "bottom"
    )
  )
}

ggplot(mtcars, aes(wt, mpg, colour = factor(cyl))) +
  geom_point(size = 2.5) +
  labs(title = "House Style Applied",
       subtitle = "Consistent look across all your charts",
       x = "Weight (1000 lbs)", y = "MPG",
       colour = "Cylinders") +
  house_style()
#> A scatter plot with Few's clean theme, custom title
#> styling, and the legend moved to the bottom
```

Because the function returns a list of ggplot2 components, you add it with `+` just like a single theme. Now every chart in your project shares the same visual identity with one function call.

**Try it:** Take theme_fivethirtyeight() and customise it: move the legend to the bottom and set base_size to 10.

```r
# Try it: customised FiveThirtyEight theme
ex_custom <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point() +
  labs(title = "Custom FiveThirtyEight") +
  # your code here

ex_custom
#> Expected: FiveThirtyEight style with bottom legend and smaller text
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_custom <- ggplot(mpg, aes(displ, hwy, colour = class)) +
  geom_point() +
  labs(title = "Custom FiveThirtyEight") +
  theme_fivethirtyeight(base_size = 10) +
  scale_colour_fivethirtyeight() +
  theme(legend.position = "bottom")
ex_custom
#> FiveThirtyEight's gray background with smaller text
#> and the legend moved below the plot
```

**Explanation:** Set base_size inside theme_fivethirtyeight() to control overall text scaling, then use theme() to override individual elements like legend.position.

</details>

## Which ggthemes Theme Should You Pick for Your Project?

The right theme depends on where your chart will end up. Here's a decision guide.

| Context | Recommended Theme | Why |
|---|---|---|
| Academic paper or thesis | theme_few() or theme_tufte() | Minimal decoration, focus on data, prints well in B&W |
| Business presentation | theme_economist_white() or theme_hc() | Professional but not austere, good on projected slides |
| Data journalism / blog | theme_fivethirtyeight() or theme_economist() | Eye-catching, designed for screen reading |
| Web dashboard | theme_hc() or theme_hc("darkunica") | Matches common web charting libraries |
| Matching existing Excel reports | theme_excel_new() | Blends with Office-based workflows |
| Technical report (Stata users) | theme_stata() | Familiar to statisticians, clean layout |
| Maximum data-ink ratio | theme_tufte() + geom_rangeframe() | Removes all non-data elements |

You can compare all themes at once by applying them in a loop. Here's a quick-reference approach.

```r
theme_list <- list(
  "Economist" = list(theme_economist(), scale_colour_economist()),
  "WSJ" = list(theme_wsj(), scale_colour_wsj()),
  "FiveThirtyEight" = list(theme_fivethirtyeight()),
  "Tufte" = list(theme_tufte()),
  "Few" = list(theme_few(), scale_colour_few()),
  "Stata" = list(theme_stata(), scale_colour_stata()),
  "Highcharts" = list(theme_hc(), scale_colour_hc()),
  "Excel New" = list(theme_excel_new(), scale_colour_excel_new()),
  "Google Docs" = list(theme_gdocs(), scale_colour_gdocs())
)

base <- ggplot(mtcars, aes(wt, mpg, colour = factor(cyl))) +
  geom_point(size = 2) +
  labs(title = "Weight vs MPG", colour = "Cyl")

base + theme_list[["Economist"]]
#> Swap "Economist" for any key above to preview that theme
```

Cycle through the list to compare how each theme handles the same data. This is the fastest way to find the right fit for your project.

[TIP]
**For academic papers, start with theme_few() or theme_tufte().** They're designed for print, use minimal ink, and won't distract reviewers. For business dashboards, theme_hc() or theme_economist_white() strike the right balance between polish and restraint.

**Try it:** Create a publication-ready scatter plot of `carat` vs `price` from the diamonds dataset (sample 200 rows), choosing the theme that best fits an academic journal context.

```r
# Try it: academic-ready scatter plot
set.seed(303)
ex_acad_data <- diamonds[sample(nrow(diamonds), 200), ]

# your code here — use theme_few() or theme_tufte()
#> Expected: a clean, minimal scatter plot suitable for journal submission
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(303)
ex_acad_data <- diamonds[sample(nrow(diamonds), 200), ]

ggplot(ex_acad_data, aes(carat, price, colour = cut)) +
  geom_point(alpha = 0.7) +
  labs(title = "Diamond Price by Carat and Cut",
       x = "Carat", y = "Price (USD)", colour = "Cut") +
  theme_few(base_size = 11) +
  scale_colour_few()
#> A clean scatter plot with Few's minimal style —
#> light gridlines, no border, muted colours
```

**Explanation:** theme_few() keeps the chart clean enough for print while retaining subtle gridlines that help readers compare values. The muted colour palette reproduces well in both colour and grayscale.

</details>

## Practice Exercises

### Exercise 1: Economist Faceted Bar Chart

Create a faceted bar chart from mtcars showing average horsepower by cylinder count, faceted by transmission type (`am`: 0 = automatic, 1 = manual). Use theme_economist() with matching fill scale. Override the facet strip text size to 9.

```r
# Exercise 1: Economist faceted bar chart
# Hint: group_by(cyl, am) |> summarise(), then facet_wrap(~am)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_data <- mtcars |>
  dplyr::group_by(cyl, am) |>
  dplyr::summarise(avg_hp = mean(hp), .groups = "drop") |>
  dplyr::mutate(am_label = ifelse(am == 0, "Automatic", "Manual"))

ggplot(my_data, aes(factor(cyl), avg_hp, fill = factor(cyl))) +
  geom_col(show.legend = FALSE) +
  facet_wrap(~am_label) +
  labs(title = "Average HP by Cylinders and Transmission",
       x = "Cylinders", y = "Average HP") +
  theme_economist() +
  scale_fill_economist() +
  theme(strip.text = element_text(size = 9))
#>   cyl am  avg_hp am_label
#> 1   4  0    84.7 Automatic
#> 2   4  1    81.9 Manual
#> ...
```

**Explanation:** facet_wrap() splits the chart by transmission type. The theme() override at the end adjusts only the strip text without affecting the rest of the Economist styling.

</details>

### Exercise 2: Reusable House Style Function

Write a function called `my_house_style()` that wraps theme_few(), custom font sizes (title = bold 15, subtitle = gray italic 11), scale_colour_few("Medium"), and `coord_cartesian(clip = "off")`. Apply it to both a scatter plot and a bar chart to verify it works on different geoms.

```r
# Exercise 2: build a reusable house style
# Hint: return a list() of ggplot components

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_house_style <- function(base_size = 11) {
  list(
    theme_few(base_size = base_size),
    scale_colour_few("Medium"),
    scale_fill_few("Medium"),
    coord_cartesian(clip = "off"),
    theme(
      plot.title = element_text(face = "bold", size = 15),
      plot.subtitle = element_text(colour = "gray40",
                                   face = "italic", size = 11),
      legend.position = "bottom"
    )
  )
}

ggplot(mtcars, aes(wt, mpg, colour = factor(cyl))) +
  geom_point(size = 2.5) +
  labs(title = "Scatter: Weight vs MPG",
       subtitle = "House style applied", colour = "Cyl") +
  my_house_style()
#> Clean Few-style scatter with bold title, italic subtitle,
#> bottom legend

ggplot(mtcars, aes(factor(cyl), fill = factor(cyl))) +
  geom_bar(show.legend = FALSE) +
  labs(title = "Bar: Cylinder Counts",
       subtitle = "Same house style, different geom") +
  my_house_style()
#> Same visual identity applied to a bar chart — consistent
#> branding across chart types
```

**Explanation:** Returning a list() of ggplot2 components lets you add multiple layers with a single `+`. Including both scale_colour and scale_fill ensures the function works with both point and fill-based geoms.

</details>

### Exercise 3: Four-Theme Comparison Grid

Create four versions of the same scatter plot (mtcars: `wt` vs `mpg`, coloured by `cyl`) using theme_economist(), theme_tufte(), theme_fivethirtyeight(), and theme_wsj(). Store each plot in a variable and print them sequentially.

```r
# Exercise 3: four-theme comparison
# Hint: create p1, p2, p3, p4 with different themes

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_base <- ggplot(mtcars, aes(wt, mpg, colour = factor(cyl))) +
  geom_point(size = 2.5) +
  labs(x = "Weight", y = "MPG", colour = "Cyl")

p1 <- my_base + labs(title = "Economist") +
  theme_economist() + scale_colour_economist()
p2 <- my_base + labs(title = "Tufte") + theme_tufte()
p3 <- my_base + labs(title = "FiveThirtyEight") +
  theme_fivethirtyeight()
p4 <- my_base + labs(title = "WSJ") +
  theme_wsj() + scale_colour_wsj()

p1
#> Blue-gray Economist style
p2
#> Minimal Tufte style — no gridlines, no background
p3
#> Gray FiveThirtyEight style — bold, screen-optimised
p4
#> Clean WSJ style — high contrast, no axis titles
```

**Explanation:** Storing the base plot in a variable and adding different themes shows how the same data looks under different design philosophies. The Economist and FiveThirtyEight themes add bold backgrounds, while Tufte and WSJ strip everything down.

</details>

## Putting It All Together

Let's build a polished, publication-ready chart from scratch using ggthemes. We'll take raw data, summarise it, and style it into an Economist-worthy bar chart with custom overrides.

```r
set.seed(42)
sales <- data.frame(
  quarter = rep(paste0("Q", 1:4), each = 3),
  region = rep(c("North", "South", "West"), times = 4),
  revenue = c(42, 38, 45, 48, 41, 52, 55, 47, 61, 50, 44, 58)
)

ggplot(sales, aes(quarter, revenue, fill = region)) +
  geom_col(position = "dodge", width = 0.7) +
  labs(
    title = "Quarterly Revenue by Region",
    subtitle = "Revenue grew steadily in all regions, with the West leading Q3",
    x = NULL,
    y = "Revenue ($M)",
    fill = NULL
  ) +
  theme_economist(base_size = 11) +
  scale_fill_economist() +
  theme(
    plot.subtitle = element_text(size = 9, colour = "gray30"),
    legend.position = "top",
    axis.text.y = element_text(size = 9)
  )
#>   quarter region revenue
#> 1      Q1  North      42
#> 2      Q1  South      38
#> 3      Q1   West      45
#> ...
#> A grouped bar chart with Economist styling, a clear
#> subtitle telling the story, and the legend at the top
```

This chart follows the pattern you'll use every time: choose a theme, pair it with the matching scale, add your labels, then layer any customisations on top. The subtitle tells the reader what to look for before they even scan the bars.

## Summary

Here's a quick-reference table of every ggthemes theme, its matching scale, and best use case.

| Theme | Matching Scale | Best Use Case | Character |
|---|---|---|---|
| theme_economist() | scale_colour_economist() | Data journalism, business reports | Bold, blue-gray background |
| theme_economist_white() | scale_colour_economist() | Presentations, lighter variant | Clean, white panel |
| theme_wsj() | scale_colour_wsj() | Financial reports | Minimal, high contrast |
| theme_fivethirtyeight() | scale_colour_fivethirtyeight() | Blog posts, screen charts | Gray background, large text |
| theme_stata() | scale_colour_stata() | Academic, statistical reports | Clean, familiar to Stata users |
| theme_tufte() | (none, minimal approach) | Academic papers, print | Maximum data-ink ratio |
| theme_few() | scale_colour_few() | Reports, publications | Light gridlines, muted colours |
| theme_clean() | (none) | General purpose | Simple, uncluttered |
| theme_igray() | (none) | Subtle, professional plots | Inverted gray scheme |
| theme_hc() | scale_colour_hc() | Web dashboards | Highcharts style |
| theme_gdocs() | scale_colour_gdocs() | Google Workspace integration | Google Docs defaults |
| theme_excel_new() | scale_colour_excel_new() | Office-based workflows | Modern Excel look |
| theme_excel() | scale_colour_excel() | Satire only | Retro Excel 97 |
| theme_calc() | scale_colour_calc() | LibreOffice integration | Calc defaults |
| theme_solarized() | scale_colour_solarized() | Developer-oriented content | Solarized colour scheme |
| theme_pander() | scale_colour_pander() | R Markdown reports | Pander package style |
| theme_base() | (none) | Matching base R graphics | Classic R look |
| theme_par() | (none) | Matching par() settings | Inherits from par() |
| theme_foundation() | (none) | Building custom themes | Blank starting point |
| theme_solid() | (none) | Backgrounds for overlays | Solid colour only |
| theme_map() | (none) | Cartographic visualisations | No axes, no gridlines |

## References

1. Arnold, J., *ggthemes: Extra Themes, Scales and Geoms for 'ggplot2'*. CRAN v5.2.0 (2025). [Link](https://cran.r-project.org/package=ggthemes)
2. Arnold, J., ggthemes GitHub repository. [Link](https://github.com/jrnold/ggthemes)
3. Tufte, E., *The Visual Display of Quantitative Information*. Graphics Press (2001).
4. Few, S., *Show Me the Numbers: Designing Tables and Graphs to Enlighten*. Analytics Press (2012).
5. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). [Link](https://ggplot2-book.org/)
6. ggplot2 reference, theme() documentation. [Link](https://ggplot2.tidyverse.org/reference/theme.html)
7. R Graph Gallery, ggthemes package overview. [Link](https://r-graph-gallery.com/package/ggthemes.html)

## Continue Learning

1. [ggplot2 Themes in R](ggplot2-Themes-in-R.html), Master built-in themes and build your own custom theme() from scratch
2. [ggplot2 Scales](ggplot2-Scales.html), Control how data maps to colours, axes, sizes, and shapes
3. [Publication-Quality Figures in R](Publication-Quality-Figures-in-R.html), The checklist for journal and thesis figures
