---
title: "ggplot2 Aesthetics Exercises: 10 color, fill, size Practice Problems, Solved Step-by-Step"
slug: "ggplot2-Aesthetics-Exercises"
description: "Practice ggplot2 aesthetics with 10 colour, fill, size, shape, and alpha exercises, each with runnable starter code and detailed step-by-step solutions in R."
keywords: "ggplot2 aesthetics exercises, ggplot2 color exercises, ggplot2 fill exercises, ggplot2 size exercises, aes() practice problems, ggplot2 exercises with solutions, R visualization exercises, ggplot2 colour mapping practice"
auto_link_terms: "ggplot2 aesthetics exercises|aes exercises R|ggplot2 color fill exercises|ggplot2 aesthetic practice|aesthetics practice problems|ggplot2 aes exercises"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "E3.2"
post_type: "EX"
sidebar_title: "ggplot2 Aesthetics (10 problems)"
fr_parent: "ggplot2-Aesthetics-aes-Map-Data.html"
difficulty: "Intermediate"
---


# ggplot2 Aesthetics Exercises: 10 color, fill, size Practice Problems, Solved Step-by-Step

<p class="lead">The <code>aes()</code> function maps data columns to visual properties like colour, fill, size, and shape, but knowing the syntax and choosing the right mapping for the right chart are different skills. These 10 exercises build that skill progressively, from single-aesthetic scatter plots to publication-ready multi-layered visualizations.</p>

## Which Aesthetic Controls What?

Every visual channel in ggplot2 is controlled by a different aesthetic. Colour draws outlines and point borders, fill paints interiors, size scales point and line width, shape swaps the symbol, and alpha adjusts transparency. The table below is your cheat sheet for the exercises that follow.

| Aesthetic | What It Controls | Works With | Best For |
|-----------|-----------------|------------|----------|
| `colour` | Point colour, line colour, outline | All geoms | Categorical groups, continuous gradients |
| `fill` | Interior colour | Bars, boxes, shapes 21-25, areas | Bar charts, filled shapes, density plots |
| `size` | Point diameter, line width | Points, lines, text | Continuous magnitude (bubble charts) |
| `shape` | Point symbol (circle, triangle, etc.) | Points only | Categorical groups (≤6 levels) |
| `alpha` | Transparency (0 = invisible, 1 = solid) | All geoms | Overplotting, de-emphasizing layers |
| `linetype` | Dash pattern (solid, dashed, dotted) | Lines, smooth, segments | Distinguishing series (≤6 levels) |

Let's see how mapping two aesthetics at once turns a plain scatter into a rich, multi-variable chart.

```r
# Load ggplot2 and create a multi-aesthetic scatter
library(ggplot2)

ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cyl)) +
  geom_point(alpha = 0.7) +
  labs(x = "Engine Displacement (L)", y = "Highway MPG",
       colour = "Vehicle Class", size = "Cylinders")
#> Compact/subcompact cluster top-left (small engine, good mileage)
#> SUVs and pickups cluster bottom-right (large engine, low mileage)
#> Point sizes show 4-cyl cars are smallest, 8-cyl largest
#> Two legends appear: one for colour, one for size
```

One scatter plot, four variables encoded (x, y, colour, size). That is the power of `aes()`, it turns a two-dimensional chart into a window onto your entire dataset. The `colour = class` part goes *inside* `aes()` because it maps a data column, while `alpha = 0.7` stays *outside* because it is a fixed value that applies to every point.

[KEY INSIGHT]
**Inside aes() = data-driven, outside aes() = constant.** When you write `aes(colour = class)`, ggplot2 picks a different colour for each class. When you write `geom_point(colour = "steelblue")`, every point gets the same colour.

**Try it:** In the scatter above, replace `colour = class` with `shape = drv`, what changes?

```r
# Try it: swap colour for shape
ggplot(mpg, aes(x = displ, y = hwy, shape = drv, size = cyl)) +
  geom_point(alpha = 0.7) +
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
#> Expected: three shapes (triangle, circle, square) for drv values 4/f/r
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy, shape = drv, size = cyl)) +
  geom_point(alpha = 0.7, colour = "steelblue") +
  labs(x = "Engine Displacement (L)", y = "Highway MPG",
       shape = "Drive Type", size = "Cylinders")
#> Three shapes: circle (4wd), triangle (front), square (rear)
#> Without colour mapping, all points are steelblue
#> Shape distinguishes drive type, size distinguishes cylinders
```

**Explanation:** Replacing `colour` with `shape` switches from colour-coding to symbol-coding. Shape works well for `drv` because it has only 3 levels. Adding a fixed `colour = "steelblue"` outside `aes()` keeps all points the same colour while shape does the grouping.

</details>

## How Do You Map Colour and Fill? (Exercises 1–3)

Colour and fill are the two most-used aesthetics, but they behave differently depending on the geom. Points use colour for the dot itself. Bars use fill for the body and colour for the border. Shapes 21-25 accept *both*, fill for the interior and colour for the outline.

### Exercise 1: Colour a Scatter by Category

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y). Map `class` to colour. Add informative axis labels and a legend title.

```r
# Exercise 1: colour a scatter by category
# Hint: colour goes inside aes()

p1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(size = 2.5) +
  # your code here — add colour mapping
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p1
#> Expected: 7 colours (one per class) with auto-generated legend
```

<details>
<summary>Click to reveal solution</summary>

```r
p1 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2.5) +
  labs(x = "Engine Displacement (L)", y = "Highway MPG",
       colour = "Vehicle Class")
p1
#> 7 distinct colours — compact (teal), midsize (green), suv (pink), etc.
#> Compact and subcompact cluster at low displacement + high mpg
#> SUVs and pickups sit at high displacement + low mpg
```

**Explanation:** Placing `colour = class` inside `aes()` tells ggplot2 to assign a different colour to each unique value in the `class` column. The legend is generated automatically. The `labs(colour = "Vehicle Class")` overrides the default legend title from the column name.

</details>

### Exercise 2: Fill a Bar Chart by Category

**Dataset:** `mpg`

**Task:** Create a bar chart counting vehicles per `class`. Fill the bars by `drv` (drive type: 4, f, r). Use `position = "dodge"` to place bars side-by-side instead of stacked.

```r
# Exercise 2: filled dodged bar chart
# Hint: fill goes inside aes(), position inside geom_bar()

p2 <- ggplot(mpg, aes(x = class)) +
  # your code here — add fill mapping and position
  labs(x = "Vehicle Class", y = "Count")
p2
#> Expected: groups of 2-3 bars per class, each bar a different drv colour
```

<details>
<summary>Click to reveal solution</summary>

```r
p2 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  labs(x = "Vehicle Class", y = "Count", fill = "Drive Type")
p2
#> Each class has up to 3 bars: 4wd, front-wheel, rear-wheel
#> SUVs are mostly 4wd, compacts are mostly front-wheel
#> 2seater has only rear-wheel drive (single bar)
```

**Explanation:** `fill = drv` colours the *interior* of each bar. `position = "dodge"` places bars side-by-side so you can compare counts within each class. Without `"dodge"`, bars would stack on top of each other, useful for showing totals, but harder for comparing individual groups.

</details>

### Exercise 3: Colour vs Fill with Shape 21

**Dataset:** `mtcars`

**Task:** Create a scatter plot of `wt` (x) vs `mpg` (y). Use `shape = 21` (fillable circle). Map `factor(cyl)` to fill. Set colour (border) to `"black"` and size to 3.

```r
# Exercise 3: fill + colour with shape 21
# Hint: shape 21 accepts both colour (border) and fill (interior)

p3 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  # your code here — use shape = 21, fill inside aes, colour outside
  labs(x = "Weight (1000 lbs)", y = "Miles per Gallon")
p3
#> Expected: black-bordered circles with coloured fills for 4/6/8 cylinders
```

<details>
<summary>Click to reveal solution</summary>

```r
p3 <- ggplot(mtcars, aes(x = wt, y = mpg, fill = factor(cyl))) +
  geom_point(shape = 21, colour = "black", size = 3) +
  labs(x = "Weight (1000 lbs)", y = "Miles per Gallon",
       fill = "Cylinders")
p3
#> 4-cyl points: light red/salmon fill, top-left (light, efficient)
#> 6-cyl points: green fill, middle
#> 8-cyl points: blue fill, bottom-right (heavy, thirsty)
#> Every point has a crisp black border
```

**Explanation:** Shapes 21-25 are the only point shapes that accept both `fill` (interior) and `colour` (border). By mapping `fill` to cylinder count and fixing `colour = "black"`, each point gets a coloured interior with a clean black outline. This two-channel approach is especially useful when points overlap, the black border keeps each point visually distinct.

</details>

[TIP]
**Shapes 21-25 are your two-channel friends.** Only these shapes support both fill and colour. Shape 21 (circle), 22 (square), 23 (diamond), 24 (triangle up), 25 (triangle down). Use them whenever you need both a coloured interior and a distinct border.

**Try it:** Change Exercise 3 from `shape = 21` to `shape = 16` (regular filled circle). What happens to the fill aesthetic?

```r
# Try it: shape 16 vs 21
ex_fill <- ggplot(mtcars, aes(x = wt, y = mpg, fill = factor(cyl))) +
  geom_point(shape = 16, colour = "black", size = 3) +
  labs(x = "Weight (1000 lbs)", y = "Miles per Gallon")
ex_fill
#> Expected: fill is ignored — all points are the same colour
```

<details>
<summary>Click to reveal solution</summary>

```r
# Shape 16 ignores fill entirely
ex_fill_16 <- ggplot(mtcars, aes(x = wt, y = mpg, fill = factor(cyl))) +
  geom_point(shape = 16, colour = "black", size = 3)
ex_fill_16
#> All points are solid black — fill mapping is silently ignored

# Switch back to shape 21 to restore fill
ex_fill_21 <- ggplot(mtcars, aes(x = wt, y = mpg, fill = factor(cyl))) +
  geom_point(shape = 21, colour = "black", size = 3)
ex_fill_21
#> Coloured fills return — 4-cyl red, 6-cyl green, 8-cyl blue
```

**Explanation:** Shape 16 is a "solid" shape, it only responds to `colour`, not `fill`. When you map `fill` with a non-fillable shape, ggplot2 silently ignores the mapping. No error, no warning, just missing visual encoding. Always pair fill mappings with shapes 21-25.

</details>

## How Do You Control Size and Alpha? (Exercises 4–6)

Size and alpha are the go-to aesthetics for continuous variables. Size encodes magnitude, a bigger point means a bigger value. Alpha encodes density, lowering transparency reveals where hundreds of points pile up on top of each other.

### Exercise 4: Map Size to a Continuous Variable

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y). Map `cty` (city mpg) to size. Set colour to `"steelblue"` and alpha to 0.5.

```r
# Exercise 4: size mapping for continuous variable
# Hint: size goes inside aes(), colour and alpha go outside

p4 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  # your code here — add size mapping and fixed aesthetics
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p4
#> Expected: larger points for higher city mpg, all steelblue
```

<details>
<summary>Click to reveal solution</summary>

```r
p4 <- ggplot(mpg, aes(x = displ, y = hwy, size = cty)) +
  geom_point(colour = "steelblue", alpha = 0.5) +
  labs(x = "Engine Displacement (L)", y = "Highway MPG",
       size = "City MPG")
p4
#> Largest points (high city mpg) cluster in the top-left
#> Smallest points (low city mpg) sit bottom-right
#> Alpha = 0.5 lets overlapping points show through
```

**Explanation:** `size = cty` inside `aes()` scales each point's diameter proportionally to its city mpg value. Higher city mpg = larger point. The `colour` and `alpha` are set outside `aes()` as fixed values, so every point gets the same steelblue colour and 50% transparency regardless of the data.

</details>

### Exercise 5: Use Alpha to Reveal Overplotting

**Dataset:** `diamonds` (first 2000 rows)

**Task:** Create a scatter plot of `carat` (x) vs `price` (y) using the first 2000 rows of diamonds. Map `cut` to colour. Set alpha to 0.15 so dense regions stand out.

```r
# Exercise 5: alpha for overplotting
# Hint: subset diamonds first, then alpha outside aes()

diamonds_sub <- diamonds[1:2000, ]
p5 <- ggplot(diamonds_sub, aes(x = carat, y = price)) +
  geom_point() +
  # your code here — add colour mapping and low alpha
  labs(x = "Carat", y = "Price ($)")
p5
#> Expected: semi-transparent cloud, dense regions appear darker
```

<details>
<summary>Click to reveal solution</summary>

```r
diamonds_sub <- diamonds[1:2000, ]
p5 <- ggplot(diamonds_sub, aes(x = carat, y = price, colour = cut)) +
  geom_point(alpha = 0.15, size = 1.5) +
  labs(x = "Carat", y = "Price ($)", colour = "Cut Quality")
p5
#> Dense clusters at 0.3-0.5 carat and $500-$2000 appear as solid colour
#> Sparse high-carat points are almost invisible at alpha 0.15
#> Ideal cut (often highest quality) spans all price ranges
```

**Explanation:** With 2000 points, a standard scatter becomes a mess of overlapping dots. Setting `alpha = 0.15` makes each individual point nearly invisible, but where many points stack up, the combined opacity creates a solid-looking region. This "alpha heat" effect reveals density patterns that a regular scatter hides completely.

</details>

### Exercise 6: Build a Bubble Chart with Size + Colour

**Dataset:** `mtcars`

**Task:** Create a scatter plot of `wt` (x) vs `mpg` (y). Map `hp` to size (bubble chart), `factor(gear)` to colour, and set alpha to 0.7.

```r
# Exercise 6: bubble chart — size + colour
# Hint: size and colour both inside aes()

p6 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  # your code here — map hp to size and gear to colour
  labs(x = "Weight (1000 lbs)", y = "Miles per Gallon")
p6
#> Expected: bubbles sized by horsepower, coloured by gear count
```

<details>
<summary>Click to reveal solution</summary>

```r
p6 <- ggplot(mtcars, aes(x = wt, y = mpg, size = hp, colour = factor(gear))) +
  geom_point(alpha = 0.7) +
  labs(x = "Weight (1000 lbs)", y = "Miles per Gallon",
       size = "Horsepower", colour = "Gears")
p6
#> Large bubbles (high hp) cluster bottom-right (heavy, gas-guzzling)
#> Small bubbles (low hp) sit top-left (light, efficient)
#> 3-gear cars (red) are mostly heavy; 4-gear (green) mostly light
#> Two legends appear: one for size, one for colour
```

**Explanation:** A bubble chart encodes three variables beyond x and y: `size = hp` turns each point into a bubble whose area reflects horsepower, while `colour = factor(gear)` separates gearbox types. The `alpha = 0.7` prevents large bubbles from completely hiding smaller ones behind them. Bubble charts are powerful but can get crowded, keep the dataset small (under 100 points) for readability.

</details>

[WARNING]
**Never map size to a categorical variable.** Mapping `size = factor(gear)` would assign arbitrary point sizes to gear levels 3, 4, and 5. Readers instinctively interpret bigger points as "more", when categories have no magnitude, the visual weight is misleading.

**Try it:** In Exercise 6, swap `size = hp` for `size = factor(gear)`. Why is the result misleading?

```r
# Try it: size on a categorical variable
ex_size <- ggplot(mtcars, aes(x = wt, y = mpg, size = factor(gear),
                               colour = factor(gear))) +
  geom_point(alpha = 0.7) +
  labs(x = "Weight (1000 lbs)", y = "Miles per Gallon")
ex_size
#> Expected: ggplot warns "Using size for a discrete variable is not advised"
```

<details>
<summary>Click to reveal solution</summary>

```r
# Bad: size on categorical variable
ex_size_bad <- ggplot(mtcars, aes(x = wt, y = mpg, size = factor(gear),
                                    colour = factor(gear))) +
  geom_point(alpha = 0.7)
ex_size_bad
#> Warning: Using size for a discrete variable is not advised
#> 5-gear points are biggest — but 5 gears isn't "more" than 3 in a visual sense
#> Readers think big circle = big value, which misrepresents the data
```

**Explanation:** ggplot2 warns you because size implies magnitude. A 5-gear car is not "more" than a 3-gear car the way 300 horsepower is "more" than 100. For categorical variables, use colour or shape instead, they signal "different" without implying "bigger."

</details>

## How Do You Use Shape and Linetype? (Exercises 7–8)

Shape and linetype are inherently categorical aesthetics, they create discrete visual groups rather than continuous gradients. Shape offers about 25 symbols, but human perception tops out at distinguishing 5-6. Linetype has exactly 6 built-in patterns. Keep your category count low.

### Exercise 7: Map Shape to a Categorical Variable

**Dataset:** `iris`

**Task:** Create a scatter plot of `Sepal.Length` (x) vs `Petal.Length` (y). Map `Species` to both colour *and* shape for maximum group separation.

```r
# Exercise 7: dual mapping — colour + shape
# Hint: put both colour and shape inside aes()

p7 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  geom_point(size = 2.5, alpha = 0.7) +
  # your code here — map Species to both colour and shape
  labs(x = "Sepal Length (cm)", y = "Petal Length (cm)")
p7
#> Expected: 3 species with distinct colours AND shapes, one combined legend
```

<details>
<summary>Click to reveal solution</summary>

```r
p7 <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length,
                         colour = Species, shape = Species)) +
  geom_point(size = 2.5, alpha = 0.7) +
  labs(x = "Sepal Length (cm)", y = "Petal Length (cm)")
p7
#> Setosa: red circles, bottom-left cluster (short petals)
#> Versicolor: green triangles, middle cluster
#> Virginica: blue squares, top-right cluster (long petals)
#> One combined legend shows colour + shape together
```

**Explanation:** When you map the same variable to both `colour` and `shape`, ggplot2 merges the legends into one. This is called "redundant encoding", it helps readers who are colourblind (they see the shape) and readers in greyscale prints. It is one of the most effective accessibility patterns in data visualization.

</details>

### Exercise 8: Linetype for Multi-Series Comparison

**Dataset:** `economics_long` (filtered to 3 variables)

**Task:** Filter `economics_long` to keep only `psavert`, `uempmed`, and `unemploy`. Plot `date` (x) vs `value01` (y). Map `variable` to both colour *and* linetype.

```r
# Exercise 8: linetype + colour for line charts
# Hint: filter first, then map linetype inside aes()

econ_sub <- economics_long[economics_long$variable %in%
  c("psavert", "uempmed", "unemploy"), ]
p8 <- ggplot(econ_sub, aes(x = date, y = value01)) +
  # your code here — add colour and linetype mappings
  labs(x = "Year", y = "Scaled Value (0–1)")
p8
#> Expected: 3 lines, each with distinct colour AND dash pattern
```

<details>
<summary>Click to reveal solution</summary>

```r
econ_sub <- economics_long[economics_long$variable %in%
  c("psavert", "uempmed", "unemploy"), ]
p8 <- ggplot(econ_sub, aes(x = date, y = value01,
                             colour = variable, linetype = variable)) +
  geom_line(linewidth = 0.8) +
  labs(x = "Year", y = "Scaled Value (0–1)",
       colour = "Indicator", linetype = "Indicator")
p8
#> psavert (savings rate): trends downward over decades
#> uempmed (median unemployment duration): spikes sharply after 2008
#> unemploy (total unemployed): cyclical peaks around recessions
#> Combined legend shows colour + linetype together
```

**Explanation:** Just as mapping one variable to both colour and shape creates redundant encoding for points, mapping one variable to both colour and linetype does the same for lines. The result is accessible in colour prints, greyscale prints, *and* low-resolution screens. Always use `labs()` with identical names for both aesthetics, that is what tells ggplot2 to merge the legends.

</details>

[NOTE]
**ggplot2 has exactly 6 linetype values: solid, dashed, dotted, dotdash, longdash, twodash.** For more than 6 series, switch to colour or use facets instead.

**Try it:** Add `scale_shape_manual(values = c(1, 4, 17))` to Exercise 7 to override the default shapes. What symbols do you get?

```r
# Try it: custom shapes
ex_manual <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length,
                               colour = Species, shape = Species)) +
  geom_point(size = 2.5, alpha = 0.7) +
  # your code here — add scale_shape_manual()
  labs(x = "Sepal Length (cm)", y = "Petal Length (cm)")
ex_manual
#> Expected: shape 1 (hollow circle), shape 4 (X), shape 17 (solid triangle)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_manual <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length,
                               colour = Species, shape = Species)) +
  geom_point(size = 2.5, alpha = 0.7) +
  scale_shape_manual(values = c(1, 4, 17)) +
  labs(x = "Sepal Length (cm)", y = "Petal Length (cm)")
ex_manual
#> Setosa: hollow circle (1)
#> Versicolor: X mark (4)
#> Virginica: solid triangle (17)
```

**Explanation:** `scale_shape_manual(values = c(1, 4, 17))` replaces ggplot2's default shapes (circle, triangle, square) with your chosen symbols. Shape numbers 0-14 are hollow, 15-20 are solid, and 21-25 accept both fill and colour. The `values` vector maps to factor levels in alphabetical order: setosa gets shape 1, versicolor gets 4, virginica gets 17.

</details>

## How Do You Override Default Aesthetic Scales? (Exercises 9–10)

ggplot2 picks colours, sizes, and shapes automatically, but defaults rarely match what a report or presentation needs. The `scale_*` functions let you override every automatic choice: `scale_colour_manual()` for exact colours, `scale_colour_brewer()` for perceptually tested palettes, `scale_size_continuous()` for size ranges, and many more.

### Exercise 9: Custom Colour Palette with scale_colour_manual

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y). Map `drv` to colour. Use `scale_colour_manual()` to set custom colours: `"4" = "#E05A4F"` (red), `"f" = "#4B6FA5"` (blue), `"r" = "#6AAB9C"` (teal). Add a proper legend title.

```r
# Exercise 9: custom colour palette
# Hint: scale_colour_manual(values = c(...)) with named vector

p9 <- ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point(size = 2.5, alpha = 0.7) +
  # your code here — add scale_colour_manual with named colours
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p9
#> Expected: red = 4wd, blue = front, teal = rear (not ggplot defaults)
```

<details>
<summary>Click to reveal solution</summary>

```r
p9 <- ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point(size = 2.5, alpha = 0.7) +
  scale_colour_manual(
    values = c("4" = "#E05A4F", "f" = "#4B6FA5", "r" = "#6AAB9C"),
    name = "Drive Type"
  ) +
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p9
#> 4wd (red): scattered across mid-to-high displacement
#> Front-wheel (blue): concentrated at lower displacement + higher mpg
#> Rear-wheel (teal): few points, high displacement, low mpg
```

**Explanation:** `scale_colour_manual()` replaces ggplot2's default colour palette with your exact hex codes. Using a *named* vector (`"4" = "#E05A4F"`) guarantees each level gets the right colour regardless of factor ordering. The `name` argument sets the legend title. This is essential for brand-consistent reports, presentations, or publications.

</details>

### Exercise 10: Publication-Ready Multi-Aesthetic Plot

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y). Map `class` to colour and `drv` to shape. Set `size = 3` and `alpha = 0.7`. Add `scale_colour_brewer(palette = "Set2")` for a colourblind-friendly palette. Include complete labels and `theme_minimal()`.

```r
# Exercise 10: publication-ready multi-aesthetic plot
# Hint: combine aes mappings + scale + theme + labs

p10 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here:
  # 1. Map class to colour and drv to shape in aes or geom
  # 2. Add scale_colour_brewer(palette = "Set2")
  # 3. Add labs() with title, subtitle, axis labels, legend titles
  # 4. Add theme_minimal()
  labs(x = "Engine Displacement (L)")
p10
#> Expected: polished scatter with brewer colours, shape-coded drive types
```

<details>
<summary>Click to reveal solution</summary>

```r
p10 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, shape = drv)) +
  geom_point(size = 3, alpha = 0.7) +
  scale_colour_brewer(palette = "Set2") +
  labs(
    title = "Engine Size vs Highway Mileage",
    subtitle = "234 vehicles from the EPA fuel economy dataset",
    x = "Engine Displacement (L)",
    y = "Highway MPG",
    colour = "Vehicle Class",
    shape = "Drive Type"
  ) +
  theme_minimal()
p10
#> 7 muted "Set2" colours (colourblind-safe) for vehicle class
#> 3 shapes (circle, triangle, square) for drive type
#> Clean minimal grid, no grey background
#> Two separate legends: one for colour, one for shape
```

**Explanation:** This plot layers four aesthetics: x position, y position, colour, and shape, encoding five variables from `mpg` in a single chart. `scale_colour_brewer(palette = "Set2")` provides a palette designed by Cynthia Brewer for maximum perceptual contrast including under colour-vision deficiency. The `theme_minimal()` strips the grey background and heavy gridlines, giving a cleaner look for reports and slides.

</details>

[KEY INSIGHT]
**scale_*_manual() gives exact control; scale_*_brewer() gives perceptually tested palettes.** Use manual when you need specific brand colours. Use brewer when you want a scientifically validated palette that works for colourblind readers, printers, and projectors.

**Try it:** Replace `palette = "Set2"` with `palette = "Dark2"` in Exercise 10, which palette has better contrast on a white background?

```r
# Try it: swap brewer palettes
ex_brewer <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, shape = drv)) +
  geom_point(size = 3, alpha = 0.7) +
  # your code here — try scale_colour_brewer(palette = "Dark2")
  theme_minimal()
ex_brewer
#> Expected: darker, higher-contrast colours than Set2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_brewer <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, shape = drv)) +
  geom_point(size = 3, alpha = 0.7) +
  scale_colour_brewer(palette = "Dark2") +
  labs(colour = "Vehicle Class", shape = "Drive Type") +
  theme_minimal()
ex_brewer
#> Dark2 colours: deeper greens, purples, oranges
#> Higher contrast against white than Set2's pastels
#> Better for slides and print; Set2 is gentler for on-screen reading
```

**Explanation:** "Dark2" uses more saturated, higher-contrast colours than "Set2". On a white background or projected slide, Dark2 pops more. On a screen in a long article, Set2 is easier on the eyes. The choice depends on your medium, there is no universal "best" palette.

</details>

## Practice Exercises

These capstone exercises combine multiple concepts from the exercises above. Each one requires you to choose *which* aesthetics to use, not just *how* to use them.

### Exercise 11: Dashboard-Style Three-Chart Comparison

**Dataset:** `mpg`

**Task:** Create three separate plots from `mpg`:
1. A scatter plot of `displ` vs `hwy`, colour by `class`, alpha = 0.6
2. A dodged bar chart of `class` counts, fill by `drv`
3. A boxplot of `hwy` by `class`, fill by `class`

Give each plot a descriptive title.

```r
# Capstone Exercise 1: three-chart comparison
# Hint: each plot uses a different aesthetic focus

# Chart 1: colour scatter
cap_scatter <- ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here
  labs(title = "Displacement vs Mileage")

# Chart 2: fill bar
cap_bar <- ggplot(mpg, aes(x = class)) +
  # your code here
  labs(title = "Vehicle Count by Class and Drive")

# Chart 3: fill boxplot
cap_box <- ggplot(mpg, aes(x = class, y = hwy)) +
  # your code here
  labs(title = "Mileage Distribution by Class")

cap_scatter
cap_bar
cap_box
#> Expected: three distinct charts, each showcasing a different aesthetic
```

<details>
<summary>Click to reveal solution</summary>

```r
# Chart 1: colour scatter
cap_scatter <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2, alpha = 0.6) +
  labs(title = "Displacement vs Mileage",
       x = "Engine Displacement (L)", y = "Highway MPG",
       colour = "Class") +
  theme_minimal()
cap_scatter
#> 7 colour groups, compact/subcompact top-left, SUVs bottom-right

# Chart 2: fill dodged bar
cap_bar <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  labs(title = "Vehicle Count by Class and Drive",
       x = "Vehicle Class", y = "Count", fill = "Drive") +
  theme_minimal()
cap_bar
#> SUVs mostly 4wd, compacts mostly front-wheel, 2seater rear only

# Chart 3: fill boxplot
cap_box <- ggplot(mpg, aes(x = class, y = hwy, fill = class)) +
  geom_boxplot(alpha = 0.7, show.legend = FALSE) +
  labs(title = "Mileage Distribution by Class",
       x = "Vehicle Class", y = "Highway MPG") +
  theme_minimal()
cap_box
#> Compact/subcompact: high median + tight spread
#> Pickup/SUV: low median + wide spread with outliers
```

**Explanation:** Each chart uses a different aesthetic strategy: the scatter uses `colour` to group continuous data, the bar chart uses `fill` to subdivide counts, and the boxplot uses `fill` to visually separate categories (with `show.legend = FALSE` since the x-axis already labels the groups). Choosing the right aesthetic for each geom is as important as choosing the right geom.

</details>

### Exercise 12: Before/After Aesthetic Upgrade

**Dataset:** `diamonds` (sample of 1500 rows)

**Task:** Start with a "bad" default scatter of `carat` vs `price`. Then progressively upgrade it:
1. Add `colour = cut`
2. Set `alpha = 0.2` for overplotting
3. Apply `scale_colour_viridis_d()` for a colourblind-safe palette
4. Add complete labels with `labs()`
5. Apply `theme_minimal()`

Show each step building on the previous.

```r
# Capstone Exercise 2: progressive aesthetic upgrade
# Hint: build on the same base, adding one layer per step

set.seed(42)
d_sample <- diamonds[sample(nrow(diamonds), 1500), ]

# Step 1: bare scatter (the "before")
cap_before <- ggplot(d_sample, aes(x = carat, y = price)) +
  geom_point()
cap_before
#> Black blob, no insight — this is what we're fixing

# Steps 2-5: your upgraded version (the "after")
cap_after <- ggplot(d_sample, aes(x = carat, y = price)) +
  # your code here — add colour, alpha, scale, labs, theme
  geom_point()
cap_after
#> Expected: colourblind-safe, transparent, well-labeled, clean plot
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
d_sample <- diamonds[sample(nrow(diamonds), 1500), ]

# Before: uninformative black blob
cap_before <- ggplot(d_sample, aes(x = carat, y = price)) +
  geom_point()
cap_before
#> 1500 black dots stacked on each other — no groups, no transparency

# After: progressive upgrade
cap_after <- ggplot(d_sample, aes(x = carat, y = price, colour = cut)) +
  geom_point(alpha = 0.2, size = 1.5) +
  scale_colour_viridis_d(option = "D") +
  labs(
    title = "Diamond Price vs Carat Weight",
    subtitle = "1,500 random diamonds, coloured by cut quality",
    x = "Carat",
    y = "Price ($)",
    colour = "Cut"
  ) +
  theme_minimal()
cap_after
#> Yellow-to-purple viridis palette: Fair = dark purple, Ideal = bright yellow
#> Alpha = 0.2 reveals dense clusters at 0.3-1.0 carat
#> Higher-carat diamonds command exponentially higher prices
#> Cut quality is mixed across all carat ranges (no clean separation)
```

**Explanation:** Five aesthetic choices transformed a black blob into an informative chart. `colour = cut` adds group separation. `alpha = 0.2` reveals density. `scale_colour_viridis_d()` provides a palette that works in colour, greyscale, and for colourblind readers. `labs()` tells the reader what they are looking at. `theme_minimal()` removes visual clutter. Each layer adds information, that is the aesthetic upgrade workflow.

</details>

## Complete Example

Let's build a single chart from scratch, adding one aesthetic at a time so you can see how each layer transforms the visualization. We will use the `mpg` dataset to answer: "How does engine size relate to fuel efficiency across vehicle classes and drive types?"

```r
# Step 1: bare scatter — just x and y
step1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()
step1
#> 234 black dots — we see a negative trend but nothing else
```

Position alone tells us engine size and mileage are negatively correlated. But which cars are which? Let's add colour.

```r
# Step 2: add colour = class
step2 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2.5)
step2
#> 7 colours appear — compact cars top-left, SUVs bottom-right
#> The negative trend is actually several parallel clusters
```

Now the story deepens, the overall trend is actually multiple class-specific trends layered on top of each other.

```r
# Step 3: add shape = drv for drive type
step3 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, shape = drv)) +
  geom_point(size = 2.5, alpha = 0.7)
step3
#> Circles (4wd), triangles (front), squares (rear)
#> Front-wheel drives cluster at small engines, 4wd at large
```

Two categorical encodings give us five variables in one chart. But the default colours are not ideal for presentations.

```r
# Step 4: override scale + add polish
final_plot <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, shape = drv)) +
  geom_point(size = 2.5, alpha = 0.7) +
  scale_colour_brewer(palette = "Set2") +
  labs(
    title = "Engine Size vs Highway Mileage",
    subtitle = "234 vehicles — colour = class, shape = drive type",
    x = "Engine Displacement (L)",
    y = "Highway MPG",
    colour = "Vehicle Class",
    shape = "Drive Type"
  ) +
  theme_minimal()
final_plot
#> Colourblind-safe Set2 palette on a clean white grid
#> Two legends: one for colour (class), one for shape (drv)
#> The full story: class determines the baseline, drive type refines it
```

Four steps, four aesthetic additions, one complete story. The bare scatter told us "bigger engines get worse mileage." The finished chart tells us "compact front-wheel cars get the best mileage, SUVs and 4wd trucks get the worst, and the relationship is steeper for some classes than others."

## Summary

| Aesthetic | Best For | Works With | Key Scale Override |
|-----------|----------|------------|-------------------|
| `colour` | Categorical groups, gradients | All geoms | `scale_colour_manual()`, `scale_colour_brewer()` |
| `fill` | Bar/box interiors, shapes 21-25 | Bars, boxes, areas, shapes 21-25 | `scale_fill_manual()`, `scale_fill_brewer()` |
| `size` | Continuous magnitude | Points, lines, text | `scale_size_continuous(range = c(1, 10))` |
| `shape` | Categorical groups (≤6) | Points only | `scale_shape_manual(values = c(...))` |
| `alpha` | Overplotting, de-emphasis | All geoms | `scale_alpha_continuous(range = c(0.1, 1))` |
| `linetype` | Categorical series (≤6) | Lines, smooth, segments | `scale_linetype_manual(values = c(...))` |

**Three rules to remember:**
1. Inside `aes()` = data-driven mapping. Outside `aes()` = fixed constant.
2. Shapes 21-25 accept *both* `colour` (border) and `fill` (interior), all other shapes ignore fill.
3. Map the same variable to two aesthetics (colour + shape, or colour + linetype) for redundant encoding that works in print, greyscale, and for colourblind readers.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). Chapter 2.4: Colour, size, shape and other aesthetic attributes. [Link](https://ggplot2-book.org/getting-started.html#sec-aesthetics)
2. ggplot2 documentation, Aesthetic specifications vignette. [Link](https://ggplot2.tidyverse.org/articles/ggplot2-specs.html)
3. ggplot2 documentation, Colour related aesthetics: colour, fill, and alpha. [Link](https://ggplot2.tidyverse.org/reference/aes_colour_fill_alpha.html)
4. R Graph Gallery, Dealing with color in ggplot2. [Link](https://r-graph-gallery.com/ggplot2-color.html)
5. Posit cheat sheet, Data visualization with ggplot2. [Link](https://rstudio.github.io/cheatsheets/data-visualization.pdf)
6. Healy, K., *Data Visualization: A Practical Introduction*. Princeton University Press (2019). Chapter 3. [Link](https://socviz.co/makeplot.html)
7. ColorBrewer 2.0, Colour advice for cartography and data visualization. [Link](https://colorbrewer2.org/)

## Continue Learning

1. [ggplot2 aes(): Map Any Variable to Any Visual Property](ggplot2-Aesthetics-aes-Map-Data.html), the parent tutorial covering every aesthetic in depth with theory, examples, and scale overrides
2. [ggplot2 Exercises (15 problems)](ggplot2-Exercises.html), broader ggplot2 practice covering aesthetics, scales, facets, themes, and coordinate systems
3. [ggplot2 Geom Exercises (12 problems)](ggplot2-Geom-Exercises.html), practice choosing the right chart type with geom_point, geom_bar, geom_boxplot, and more
