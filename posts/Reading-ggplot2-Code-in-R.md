---
title: "How to Read ggplot2 Code: 10 Real Plots Deconstructed"
slug: "Reading-ggplot2-Code-in-R"
description: "Learn to read ggplot2 code with confidence. We deconstruct 10 real plots layer by layer and decode the geom_, scale_, facet_ and theme_ prefixes, step by step."
keywords: "read ggplot2 code, understand ggplot2 syntax, ggplot2 layers explained, grammar of graphics, geom_ scale_ facet_ theme_, ggplot2 for beginners, deconstruct ggplot2 code, ggplot2 plus operator"
auto_link_terms: "read ggplot2 code|reading ggplot2 code|understand ggplot2 syntax|deconstruct ggplot2 code|ggplot2 layers explained|how ggplot2 code works|ggplot2 grammar of graphics|the ggplot2 plus operator|ggplot2 layer by layer|read ggplot2 syntax|explain ggplot2 code|ggplot2 code explained"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-24"
curriculum_id: "GG2-1.4"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Reading ggplot2 Code"
sidebar_order: 51
difficulty: "Beginner"
---

<p class="lead">Reading ggplot2 code means walking a chain of <code>+</code> layers from left to right and naming what each one adds. Once you can read a function's prefix, any plot becomes a plain sentence you can follow. We use the built-in ggplot2 datasets throughout, and every block runs in your browser, so you can read the code and watch the plot appear side by side.</p>

## Why does ggplot2 code look like a chain of plus signs?

The first time you meet ggplot2 code, it looks like a pile of functions glued together with `+` signs, and it is hard to tell where one idea ends and the next begins. The good news: that chain is not random. It is a recipe you read from left to right, one step at a time. Let's start by looking at a finished plot together with the data it draws from.

```r title="A finished plot and its data"
library(ggplot2)

# The data the plot reads from:
head(mpg[, c("displ", "hwy", "class")], 4)
#> # A tibble: 4 × 3
#>   displ   hwy class
#>   <dbl> <int> <chr>
#> 1   1.8    29 compact
#> 2   1.8    29 compact
#> 3   2      31 compact
#> 4   2      30 compact

# The plot, built from that data:
p1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()

p1
```

The `mpg` dataset ships with ggplot2 and holds one row per car model, with columns for engine size (`displ`), highway mileage (`hwy`), and body type (`class`). The plot code has just two parts joined by a `+`. The first part, `ggplot(mpg, aes(x = displ, y = hwy))`, says which data to use and which columns feed the x and y axes. The second part, `geom_point()`, says draw each row as a point.

Here is the trick that makes ggplot2 readable: **read the chain out loud as a sentence.** This plot reads as: *"Take the mpg data, put engine size on the x axis and highway mileage on the y axis, then draw each car as a point."* That is the whole plot. Every ggplot2 command, no matter how long, can be read the same way.

![A ggplot2 command reads left to right: start with data, then add each layer with a plus sign.](screenshots/Reading-ggplot2-Code-in-R-plus-chain.webp)

*Figure 1: A ggplot2 command reads left to right: start with data, then add each layer with `+`.*

The `+` sign is the punctuation of that sentence. It means "and then add another layer on top." A plot object is literally a stack of layers, and you can ask R how many layers a plot has.

```r title="Count the layers in a plot"
# How many drawing layers does p1 have?
length(p1$layers)
#> [1] 1
```

Our scatter plot has exactly one layer, the `geom_point()` we added. Later, when we stack a trend line on top, this same count will read `2`. Counting layers is a quick way to confirm you have spotted every `+` that draws something.

[KEY INSIGHT]
**Every plus sign adds one layer to a growing stack.** Reading ggplot2 code is nothing more than walking that stack from the bottom up, saying out loud what each layer contributes to the final picture.

**Try it:** The plot `p1` has no title. Add one more layer with a `+` so the plot gains the title "Engine size vs mileage". You only need to add a `labs()` layer.

```r title="Your turn add a title layer"
# Start from p1 and add ONE more layer to give it a title:
p1 # + labs(title = "...")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Add a title with labs"
p1 + labs(title = "Engine size vs mileage")
```

**Explanation:** `labs()` is one more layer, so you attach it with a `+` just like any other. Reading the new chain out loud: *"...and then label the plot with this title."* The prefix `labs` is your clue that this layer adds text, not data.

</details>

## What are the building blocks every ggplot2 plot is made of?

Now that you can read a two-part chain, here is the map for reading any chain. Every ggplot2 layer belongs to one of a handful of jobs, and the beautiful part is that **the function's prefix tells you which job it does.** You do not need to memorize hundreds of functions. You need to recognize six or seven prefixes.

![The function prefix tells you which slot a layer fills: geom_ draws shapes, scale_ maps values to visuals, facet_ splits panels, coord_ sets the coordinate system, theme_ styles the look.](screenshots/Reading-ggplot2-Code-in-R-prefix-decoder.webp)

*Figure 2: The function prefix tells you which slot a layer fills.*

Here is the decoder. When you hit an unfamiliar `+ something()` in a plot, find its prefix in this table and you instantly know its job.

| You see | Prefix | Its job (the question it answers) |
|---|---|---|
| `ggplot(data, ...)` | `ggplot` | What dataset does this plot read? |
| `aes(...)` | `aes` | Which columns map to x, y, colour, size? |
| `geom_point`, `geom_bar` | `geom_` | What shape draws the data? |
| `scale_x_log10`, `scale_fill_brewer` | `scale_` | How do data values become positions and colours? |
| `facet_wrap`, `facet_grid` | `facet_` | Should the plot split into small panels? |
| `coord_flip`, `coord_polar` | `coord_` | What coordinate system draws the shapes? |
| `labs`, `theme_minimal`, `theme` | `labs` / `theme` | What text and styling wrap the plot? |

Let's re-read our scatter plot through this lens. Watch how each line of the command below announces its own job. We write the same plot again, but with every slot on its own line and a comment naming it.

```r title="The same scatter with every slot named"
ggplot(mpg, aes(x = displ, y = hwy)) +  # data + which columns map to x and y
  geom_point() +                         # geom_: draw the data as points
  labs(title = "Highway mpg by engine size", # labs: the plot's text
       x = "Engine size (litres)",
       y = "Highway mpg") +
  theme_minimal()                        # theme_: non-data styling
```

Read top to bottom, the command is a checklist you filled in: data and mapping first, then a shape, then text, then style. Nothing here is memorized syntax, it is the same five questions from the table, answered in order. When you read code someone else wrote, run the same checklist and every line falls into a slot.

[TIP]
**The prefix is the fastest tell in the whole language.** Before you understand what a line does in detail, its prefix already tells you the category: `geom_` draws, `scale_` maps, `facet_` splits, `coord_` reshapes, `theme_` styles. Naming the category first stops the code from feeling like a wall.

**Try it:** You spot the line `+ coord_flip()` in someone's plot. Without running anything, which slot does it fill and what does it do? Write your one-sentence answer, then run the snippet below to check.

```r title="Your turn read the coord prefix"
# Read the prefix of coord_flip, then run to see what it does:
ggplot(mpg, aes(x = class)) + geom_bar() + coord_flip()
```

<details>
<summary>Click to reveal solution</summary>

The prefix is `coord_`, so it sets the coordinate system. `coord_flip()` swaps the x and y axes, turning vertical bars into horizontal ones. Reading it out loud: *"...and then flip the coordinates so the bars lie sideways."* Horizontal bars are easier to read when category names are long.

</details>

## How do you read the geom layer, and the numbers it makes up?

Most `geom_` layers just draw the numbers you gave them. A few of them do arithmetic first, and that trips up new readers who go looking for a `y` value that is not in the data. The classic example is `geom_bar()`. Notice that the plot below maps only `x`, with no `y` anywhere, yet the bars still have heights.

```r title="Read the bar counts a geom makes"
# geom_bar counts rows per class. Here are the raw counts it computes:
table(mpg$class)
#>    2seater    compact    midsize    minivan     pickup subcompact        suv
#>          5         47         41         11         33         35         62

# The bar chart draws exactly those counts:
p_bar <- ggplot(mpg, aes(x = class)) +
  geom_bar()

p_bar
```

The `table()` call shows the counts by hand: 5 two-seaters and 47 compacts, on up to 62 SUVs. The plot has no `y` in its `aes()`, yet each bar rises to one of those numbers. That is because `geom_bar()` runs a hidden counting step, called a stat, before it draws. When you read a bar chart, the correct question is not "where is the y column?" but "what did the geom compute for me?"

Histograms work the same way. A histogram maps only a single continuous column, then the geom slices it into bins and counts how many values fall in each bin.

```r title="Read a histogram of one column"
# Only x = hwy is mapped. geom_histogram bins it and counts, just like geom_bar.
ggplot(mpg, aes(x = hwy)) +
  geom_histogram(bins = 20)
```

Read out loud: *"Take the mpg data, put highway mileage on the x axis, then slice it into 20 bins and draw a bar for how many cars land in each."* The `bins = 20` inside the geom is a setting that controls the counting, not a column from the data.

[NOTE]
**A geom with no y in its aes is computing y for you.** When you see `geom_bar()`, `geom_histogram()`, `geom_count()`, or `geom_density()` with only an x mapping, read it as "this geom makes up the height from the data," rather than hunting for a missing column.

**Try it:** You read a bar chart that maps only `x = drv` on the mpg data, with no `y` anywhere. Predict what the y axis will show before running it.

```r title="Your turn predict the bar heights"
# Predict the y axis first, then run:
ggplot(mpg, aes(x = drv)) + geom_bar()
```

<details>
<summary>Click to reveal solution</summary>

The y axis shows a count: how many cars have each drive type (`4` for four-wheel, `f` for front, `r` for rear). There is no `y` in the mapping, so `geom_bar()` counts the rows in each `drv` group and uses that count as the height.

</details>

## How do you read aes(), and why is colour sometimes outside it?

This is the single most confusing thing for new readers, so it is worth slowing down. Colour, size, and shape can appear in two places, and the place changes their meaning completely. When colour sits **inside** `aes()`, it maps a data column, so the plot gets one colour per value plus a legend.

```r title="Read colour mapped inside aes"
# colour = class is INSIDE aes(): map a column, expect a legend.
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point()
```

Read out loud: *"...and colour each point by its class."* Because `colour = class` lives inside `aes()`, ggplot2 assigns a different colour to each car class and draws a legend so you can tell them apart. The legend is the giveaway that a column was mapped.

Now watch what happens when colour sits **outside** `aes()`, inside the geom itself. It becomes a fixed setting applied to every point, with no legend at all.

```r title="Read colour set outside aes"
# colour = "steelblue" is OUTSIDE aes(): one fixed colour, no legend.
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "steelblue")
```

Read out loud: *"...and make every point steelblue."* Here colour is not tied to any column, it is a paint choice, so there is no legend. The rule for reading is short: inside `aes()` means "colour by a column," outside `aes()` means "set one fixed colour."

[WARNING]
**Colour inside aes maps a column; colour outside aes sets one value.** If a plot has a colour legend, look for the mapping inside `aes()`. If every mark is the same colour with no legend, the colour was set outside `aes()` as a plain value. Mixing these two up is the most common ggplot2 reading mistake.

**Try it:** Two snippets are below. Read them and decide which one produces a legend, then run to confirm.

```r title="Your turn spot the legend"
# Which of these gets a legend? Read first, then run each.
ggplot(mpg, aes(x = displ, y = hwy)) + geom_point(colour = "darkgreen")
# ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) + geom_point()
```

<details>
<summary>Click to reveal solution</summary>

```r title="The mapped version gets a legend"
ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) + geom_point()
```

**Explanation:** The second snippet maps `colour = drv` inside `aes()`, so it colours points by drive type and draws a legend. The first sets `colour = "darkgreen"` outside `aes()`, so all points are green with no legend.

</details>

## How do you read a plot with several geom layers stacked?

Real plots often stack more than one geom. Reading them is still just walking the chain, but now you say "and on top of that, also draw..." for each extra geom. The order you read them in is the order they are drawn, so later layers sit on top of earlier ones. Here we draw the points, then add a straight trend line on top.

```r title="Read two stacked geom layers"
# Two geoms: points first, then a straight-line fit on top.
p_two <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  geom_smooth(method = "lm", formula = y ~ x)

p_two

# Confirm it now has two drawing layers:
length(p_two$layers)
#> [1] 2
```

Read out loud: *"Take the mpg data, map engine size and mileage, draw the points, then on top draw a straight best-fit line."* The `geom_smooth(method = "lm")` layer fits a line through the cloud and draws it. The layer count now reads `2`, matching the two geoms we can see in the code.

Both geoms share the same `aes()` from the `ggplot()` call, which is why the line follows the same x and y as the points. That is the default: a mapping set in `ggplot()` flows down to every geom below it. When you read stacked geoms, assume they share the top mapping unless a geom carries its own `aes()`.

[KEY INSIGHT]
**Layers draw in the order they are written, so the last geom sits on top.** When you read a stack of geoms, read them bottom to top like sheets of tracing paper. If a trend line disappears behind a mass of points, its geom was written before the points, not after.

**Try it:** Swap the order of the two geoms below so the points are drawn on top of the smooth line. Predict what changes visually, then run it.

```r title="Your turn reorder the layers"
# Reorder so geom_point() comes AFTER geom_smooth():
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_smooth(method = "lm", formula = y ~ x) +
  geom_point()
```

<details>
<summary>Click to reveal solution</summary>

With `geom_smooth()` written first and `geom_point()` second, the points are drawn last and therefore sit on top of the line. The line is now partly hidden behind the point cloud. Reading order equals drawing order: whatever comes later in the chain lands on top.

</details>

## How do you read scales, coordinate flips, and log axes?

Once data and geoms are in place, the next family of layers adjusts how values become positions and colours. These carry the `scale_` and `coord_` prefixes. A `scale_fill_*` layer, for example, controls the palette used to fill shapes. Read the boxplot below: it fills boxes by drive type, then picks a specific colour palette.

```r title="Read a scale that sets the palette"
# fill = drv is mapped; scale_fill_brewer chooses the palette for that fill.
ggplot(mpg, aes(x = class, y = hwy, fill = drv)) +
  geom_boxplot() +
  scale_fill_brewer(palette = "Set2")
```

Read out loud: *"...fill each box by drive type, and use the Set2 palette for those fills."* The `scale_fill_brewer()` line does not add data, it only changes which colours the mapped `fill` uses. Its `scale_fill_` prefix tells you that before you read the argument.

Scales also handle axis transformations. The `diamonds` dataset has prices and carat weights that span a huge range, which squashes a normal scatter into one corner. Reading the price and carat ranges shows why.

```r title="Read the range that motivates a log axis"
library(forcats)

# Prices and weights span a wide range, so a log axis spreads them out.
range(diamonds$carat)
#> [1] 0.20 5.01
range(diamonds$price)
#> [1]   326 18823

# scale_x_log10 and scale_y_log10 put both axes on a log scale.
set.seed(7)
dsmall <- diamonds[sample(nrow(diamonds), 3000), ]
ggplot(dsmall, aes(x = carat, y = price)) +
  geom_point(alpha = 0.3) +
  scale_x_log10() +
  scale_y_log10()
```

Prices run from 326 to 18823 dollars, and carats from 0.2 to 5, both heavily bunched at the low end. Read out loud: *"...draw faint points, then put both the x and y axes on a log scale."* The `alpha = 0.3` inside `geom_point()` is what makes the points faint: it sets their transparency, so where many points overlap the colour builds up darker. The two `scale_*_log10()` layers stretch the crowded low values apart so the pattern becomes a clean line. We loaded `forcats` here because the next plot needs it.

A `coord_` layer reshapes the whole coordinate system after the geoms are placed. Reading a `coord_flip()` plot, you can also spot a data transform hiding inside `aes()`. Here `fct_reorder()` sorts the classes by their median mileage before plotting.

```r title="Read coord flip and an in-aes reorder"
# fct_reorder sorts classes by median hwy; coord_flip makes bars horizontal.
ggplot(mpg, aes(x = fct_reorder(class, hwy, .fun = median), y = hwy)) +
  geom_boxplot() +
  coord_flip()

# The reorder produces this class order (lowest median first):
levels(fct_reorder(mpg$class, mpg$hwy, .fun = median))
#> [1] "pickup"     "suv"        "minivan"    "2seater"    "subcompact" "compact"    "midsize"
```

Read out loud: *"Order the classes by their median highway mileage, draw a boxplot for each, then flip the coordinates so they run left to right."* The `levels()` output confirms the order the plot uses: pickups have the lowest median mileage, midsize cars the highest. Reading the transform inside `aes()` explains why the boxes are sorted rather than alphabetical.

[TIP]
**Read a scale name as its two halves: which aesthetic, then which transform.** `scale_x_log10` means "the x aesthetic, on a log10 scale"; `scale_fill_brewer` means "the fill aesthetic, using a Brewer palette." Splitting the name at the underscore gives you the meaning before you read the arguments.

**Try it:** You read the line `+ scale_y_log10()` at the end of a plot. In one sentence, what does it change about the plot? Write your answer, then run the check.

```r title="Your turn read scale y log10"
# Read the prefix and the transform half, then run to confirm:
ggplot(dsmall, aes(x = carat, y = price)) +
  geom_point(alpha = 0.3) +
  scale_y_log10()
```

<details>
<summary>Click to reveal solution</summary>

`scale_y_log10()` puts the y axis on a base-10 log scale. Only the y aesthetic changes: prices that were bunched near the bottom get spread out, so the relationship with carat looks straighter. The data itself is untouched, just the axis mapping.

</details>

## How do you read faceted and publication-ready plots?

The last two families split the plot into panels and add polish. A `facet_` layer takes one plot and repeats it once per group, a technique called small multiples. Read the facet formula as "one panel per...".

```r title="Read a facet that splits into panels"
# facet_wrap(~ class) makes one small panel per car class.
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ class)
```

Read out loud: *"...then split this scatter into one panel per class."* The `~ class` part is a formula that names the grouping column. Every panel shares the same axes, which makes it easy to compare the same relationship across groups. The `facet_` prefix is your signal that the plot is about to multiply into panels.

The final family, `labs` and `theme_`, never touches the data at all. It only renames things and restyles the look. Reading a polished plot, you can safely skim these layers last, because they change nothing about the numbers.

```r title="Read labs and theme on a line chart"
# A time series: read the data, then the polish layers.
head(economics[, c("date", "unemploy")], 3)
#> # A tibble: 3 × 2
#>   date       unemploy
#>   <date>        <dbl>
#> 1 1967-07-01     2944
#> 2 1967-08-01     2945
#> 3 1967-09-01     2958

ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line() +
  labs(title = "US unemployment over time",
       x = "Year", y = "Unemployed (thousands)") +
  theme_minimal()
```

Read out loud: *"Take the economics data, put date on x and unemployment on y, draw a line, then label it and apply the minimal theme."* The `economics` data has one row per month. The `labs()` and `theme_minimal()` layers add the title, axis names, and a clean white look, but the line itself is decided entirely by `geom_line()` and the mapping above it.

[NOTE]
**labs and theme layers are pure decoration, they never change the data.** When you read an unfamiliar plot and want to understand the numbers fast, read the data, aes, geom, scale, and facet layers first, then treat every `labs()` and `theme_*()` line as styling you can skim.

**Try it:** You read `+ facet_wrap(~ drv)` on the mpg data. How many panels will the plot have? (Hint: `drv` has three values.) Write your answer, then run to confirm.

```r title="Your turn count the facet panels"
# How many panels? Read the grouping column, then run:
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point() +
  facet_wrap(~ drv)
```

<details>
<summary>Click to reveal solution</summary>

Three panels, one for each drive type (`4`, `f`, `r`). `facet_wrap(~ drv)` creates one panel per distinct value of `drv`, and `drv` has three values, so you get three side-by-side scatter plots sharing the same axes.

</details>

## Complete Example: Reading a Six-Layer Plot Line by Line

Now let's read a plot with every family at once, the kind you might meet in a real analysis script. Do not try to absorb it as a whole. Read it one `+` at a time, naming each slot from its prefix, and it stays simple.

```r title="Read a full six-layer diamonds plot"
library(dplyr)
library(scales)

set.seed(1)
d <- diamonds |>
  filter(carat < 3) |>
  slice_sample(n = 2000)

nrow(d)
#> [1] 2000

p_final <- ggplot(d, aes(x = carat, y = price, colour = cut)) +  # 1. data + mapping
  geom_point(alpha = 0.3) +                                      # 2. geom: faint points
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE) +      # 3. geom: trend line per colour
  scale_y_log10(labels = comma) +                               # 4. scale: log y, comma labels
  facet_wrap(~ clarity) +                                        # 5. facet: one panel per clarity
  labs(title = "Price vs carat by cut and clarity",             # 6. labs + theme: text and style
       x = "Carat", y = "Price (USD)") +
  theme_minimal()

p_final
```

The first two lines are data preparation, not part of the plot. `set.seed(1)` just fixes the random draw so you get the same 2000 rows every time. The `|>` is R's pipe: it passes `diamonds` into `filter(carat < 3)` (keep only diamonds under 3 carats), then passes that result into `slice_sample(n = 2000)` (take 2000 random rows). Everything from `ggplot(` onward is the plot chain, and that is what we read below.

Read the chain slot by slot, exactly as the comments number it:

1. **Data and mapping:** take a 2000-row sample of diamonds under 3 carats, put carat on x and price on y, then colour by cut.
2. **First geom:** draw faint points, using the same `alpha = 0.3` transparency as before.
3. **Second geom:** add a straight trend line, one per cut colour, with no shaded error band.
4. **Scale:** put the y axis on a log scale and format the price labels with commas.
5. **Facet:** split everything into one panel per clarity grade.
6. **Labs and theme:** add the title and axis names, then apply the minimal theme for styling.

That is six ideas, read in order, each announced by its prefix. The `nrow(d)` check confirms we are drawing the 2000 sampled rows. Once you can narrate a plot like this line by line, no ggplot2 code can intimidate you, because every long chain is just this same short list of questions answered one layer at a time.

## Practice Exercises

These exercises train the reading skill directly. Try to answer each one in plain English before you run any code.

### Exercise 1: Narrate every layer

Read the plot below and write a one-sentence description of what each layer does, naming its slot (data, mapping, geom, scale, facet, or theme). Then run it to check your reading against the picture.

```r title="Exercise 1 narrate this plot"
# Read each line and name its slot before running:
ggplot(mpg, aes(x = class, y = hwy, fill = class)) +
  geom_boxplot() +
  scale_fill_brewer(palette = "Set3") +
  labs(title = "Mileage by class") +
  theme_minimal()
```

<details>
<summary>Click to reveal solution</summary>

Line by line: `ggplot(mpg, ...)` sets the data and maps class to the x axis, mileage to the y axis, then fill colour to class as well (mapping). `geom_boxplot()` draws a box-and-whisker shape per class (geom). `scale_fill_brewer(palette = "Set3")` chooses the palette for the fill (scale). `labs(title = ...)` adds the title (labs). `theme_minimal()` styles the look (theme). Reading out loud: *"Show the spread of highway mileage for each class as boxplots, coloured with the Set3 palette, titled and styled minimally."*

</details>

### Exercise 2: Find the layer with the bug

Someone wanted a scatter plot where each drive type gets its own colour and a legend. Their code below produces green points with no legend instead. Read the layers, find the one line that causes the problem, and fix it so the colour maps to `drv`.

```r title="Exercise 2 fix the colour layer"
# This should colour by drv with a legend, but it does not. Find and fix the bug.
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "green") +
  labs(title = "Mileage by engine size")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution move colour into aes"
ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point() +
  labs(title = "Mileage by engine size")
```

**Explanation:** The bug is `colour = "green"` set outside `aes()`, inside the geom. That paints every point one fixed colour and never draws a legend. Moving `colour = drv` inside `aes()` maps the colour to the drive-type column, so ggplot2 assigns one colour per value and adds a legend automatically.

</details>

### Exercise 3: Read a messy chain without running it

Read the chain below and describe the final plot in words: what shape, what is on each axis, how it is coloured, whether it splits into panels, plus whether any axis is transformed. Only after you have written your description, run it to check.

```r title="Exercise 3 predict then verify"
# Describe the final plot in words BEFORE running, then run to verify:
ggplot(dsmall, aes(x = carat, y = price, colour = cut)) +
  geom_point(alpha = 0.2) +
  scale_y_log10(labels = comma) +
  facet_wrap(~ color) +
  theme_minimal()
```

<details>
<summary>Click to reveal solution</summary>

The plot is a scatter (`geom_point`) of price against carat, with faint semi-transparent points. Points are coloured by cut, so there is a legend. The y axis is on a log10 scale with comma-formatted labels. The whole scatter is split into one panel per diamond `color` grade by `facet_wrap(~ color)`, and `theme_minimal()` gives it a clean style. Reading out loud: *"Faint carat-versus-price points, coloured by cut, on a log price axis, one panel per colour grade, minimally styled."*

</details>

## Frequently Asked Questions

### What does the plus sign actually do in ggplot2 code?

It adds one more component to the plot on its left. Each `+` attaches a new piece, whether a geom layer or a styling tweak, to the growing plot object. That is why plots are built up in stages rather than in a single call, and why you read the code as "and then add."

### Why do some plots have a y axis when the code never sets one?

Because certain geoms compute the y value themselves. `geom_bar()` and `geom_histogram()` count rows behind the scenes, so they turn a single x mapping into bar heights. When you meet a bar chart with only `x` mapped, read it as "the geom is counting for me."

### How do I know whether a colour will get a legend?

Look at where the colour sits. If `colour` or `fill` appears inside `aes()`, it maps a data column and ggplot2 draws a legend automatically. If it appears outside `aes()` inside the geom, it is a fixed setting and no legend appears.

### In what order should I read a long ggplot2 command?

Read left to right, or top to bottom when it spans several lines. Begin with the data and mapping, then move through the geoms one at a time. Read any `scale_` and `coord_` and `facet_` layers next, and treat `labs()` and `theme_*()` as final polish you can skim.

### Is reading ggplot2 code different from writing it?

They use the same grammar, so the skills reinforce each other. Reading is often the faster win, because you meet far more ggplot2 code in other people's scripts and answers than you write yourself. Once you can name each layer's slot from its prefix, writing your own plots becomes filling in the same slots.

## Summary

You now have a repeatable method for reading any ggplot2 command: walk the `+` chain left to right and name each layer's job from its prefix. The prefix is the key, it tells you the slot before you read a single argument.

![A reading checklist you can run on any ggplot2 plot: data, mapping, geoms, adjusters and polish.](screenshots/Reading-ggplot2-Code-in-R-reading-recap.webp)

*Figure 3: A reading checklist you can run on any ggplot2 plot.*

| Prefix | Slot | The question it answers |
|---|---|---|
| `ggplot` | Data | Which dataset does the plot read? |
| `aes` | Mapping | Which columns map to x, y, colour, fill? |
| `geom_` | Geom | What shape draws the data (and does it compute values)? |
| `scale_` | Scale | How do values become positions and colours? |
| `coord_` | Coordinates | What coordinate system draws the shapes? |
| `facet_` | Facets | Is the plot split into panels? |
| `labs` / `theme_` | Polish | What text and styling wrap the plot? |

Key takeaways to carry forward:

- **Read the chain as a sentence.** Each `+` means "and then add a layer," so a plot is just a recipe read top to bottom.
- **Read the prefix first.** `geom_` draws, `scale_` maps, `facet_` splits, `coord_` reshapes, `theme_` styles.
- **Watch where colour sits.** Inside `aes()` maps a column and adds a legend; outside `aes()` sets one fixed value.
- **Some geoms make up numbers.** A bar or histogram with only an x mapping is counting for you behind the scenes.
- **labs and theme are decoration.** Skim them last when you want to understand the data quickly.

## References

1. Wickham, H., Navarro, D., Pedersen, T. L. *ggplot2: Elegant Graphics for Data Analysis (3e)*, "Build a plot layer by layer". [Link](https://ggplot2-book.org/layers.html) - the canonical walk-through of adding one layer at a time, straight from the package authors.
2. Wickham, H. *A Layered Grammar of Graphics*. Journal of Computational and Graphical Statistics (2010). [Link](https://vita.had.co.nz/papers/layered-grammar.html) - the paper that defines the grammar the `+` chain is built on.
3. ggplot2 function reference, tidyverse. [Link](https://ggplot2.tidyverse.org/reference/) - look up any `geom_`, `scale_`, `facet_`, or `coord_` function by its prefix.
4. `ggplot()` reference, tidyverse. [Link](https://ggplot2.tidyverse.org/reference/ggplot.html) - the argument-by-argument spec for the opening `ggplot()` call.
5. `aes()` reference, tidyverse. [Link](https://ggplot2.tidyverse.org/reference/aes.html) - every aesthetic you can map inside `aes()`, in one place.
6. Wickham, H., Çetinkaya-Rundel, M., Grolemund, G. *R for Data Science (2e)*, Data visualization. [Link](https://r4ds.hadley.nz/data-visualize) - a gentle first course if you want to start writing the plots you can now read.

## Continue Learning

- [The Grammar of Graphics in ggplot2](ggplot2-Grammar-of-Graphics.html) - the theory behind the layers you just learned to read.
- [ggplot2 Aesthetics: Mapping Data with aes()](ggplot2-Aesthetics-aes-Map-Data.html) - go deeper on the mapping slot and everything `aes()` can do.
- [Scatter and Line Charts in ggplot2](Scatter-and-Line-Charts-in-ggplot2.html) - start building the plots you can now read fluently.
