---
title: "Recreating Three Professional Charts in R: a Case Study"
slug: "Recreating-Professional-Charts-in-R"
description: "Recreate three professional-grade charts in R with ggplot2: a small-multiples panel, an annotated line chart and a diverging bar chart, built step by step."
keywords: "professional charts in R, ggplot2 case study, small multiples ggplot2, annotated line chart ggplot2, diverging bar chart R, publication quality ggplot2, recreate charts R, direct labels ggplot2, faceting ggplot2"
auto_link_terms: "recreating professional charts|professional charts in R|small multiples in R|small-multiples panel|annotated line chart|diverging bar chart|direct labels on lines|highlight one line|publication-grade charts|chart case study"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-25"
curriculum_id: "GG2-13.5"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Recreating Pro Charts"
sidebar_order: "99"
difficulty: "Advanced"
---

<p class="lead">A professional chart is not built from a different tool than a default one. It is a default chart with a handful of deliberate decisions made about hierarchy, colour and annotation. In this case study you rebuild three genuinely different published-chart styles from scratch in ggplot2, on real public data, and you learn the decision behind every layer. Every chart runs as interactive code in your browser, so you can change a value and rebuild it on the spot.</p>

## What separates a professional chart from a default one?

Open any newspaper graphics desk or a well-designed business dashboard and the charts look effortless. They are not. Each one is a plain ggplot underneath, dressed by a short list of choices: what to emphasise, what to mute, what to label, and what to leave out. Defaults are not wrong, they are just unfinished. This chapter rebuilds three real chart styles, and at each step it names the decision a professional would make and why.

We work in base ggplot2 with the tidyverse for data shaping, and nothing exotic, so every chart reproduces anywhere R runs. The first thing a professional does is fix a small palette, because colour is the loudest signal on a chart and the easiest to overspend. We pick four colours and give each a job.

```r title="Load the tools and set a palette"
library(ggplot2)
library(dplyr)
library(tidyr)
library(scales)

pal <- c(highlight = "#c1440e",  # burnt orange, for the one thing that matters
         cool      = "#2f6d80",  # teal-slate, for a calm second colour
         context   = "#b9c2ca",  # grey, for everything in the background
         ink       = "#22303a")  # near-black, for text
pal
#> highlight      cool   context       ink 
#> "#c1440e" "#2f6d80" "#b9c2ca" "#22303a" 
```

The palette is a named vector, so later we can ask for a colour by its job, `pal[["highlight"]]`, instead of pasting a hex code and hoping we remember which orange we meant. Naming colours by role, not by hue, is the habit that keeps a whole project consistent.

The second reusable piece is a theme: one function that controls every mark on the chart that is not the data itself. Fonts, grid lines, the background, the caption colour. We define it once and reuse it for all three charts, so they read as a family.

```r title="Define one reusable theme"
theme_pub <- function(base_size = 12, base_family = "sans") {
  theme_minimal(base_size = base_size, base_family = base_family) +
    theme(
      plot.title.position   = "plot",
      plot.caption.position = "plot",
      plot.title    = element_text(face = "bold", size = rel(1.28),
                                   colour = pal[["ink"]], margin = margin(b = 3)),
      plot.subtitle = element_text(colour = "#5b6b76", margin = margin(b = 14)),
      plot.caption  = element_text(colour = "#93a0a8", hjust = 0, margin = margin(t = 14)),
      axis.title = element_text(colour = "#5b6b76", size = rel(0.9)),
      axis.text  = element_text(colour = "#6b7780"),
      panel.grid.minor = element_blank(),
      panel.grid.major = element_line(colour = "#eef1f3", linewidth = 0.4),
      plot.margin = margin(16, 20, 12, 16)
    )
}
```

We start from `theme_minimal()` because it already drops the grey panel that print does not want, then we soften the text to near-black, thin the grid to a whisper, and left-align the title over the whole plot. We use the plain `sans` family so the code renders everywhere; later you will see how to swap in a branded typeface for the final export.

With the kit in place, every chart follows the same build order. You shape the data, add the marks (the geoms), set the scales that map data to the page, write the labels and annotation, and finish with the theme. Keeping that order in your head stops you from fiddling with fonts before the data even reads correctly.

![A five-step flow: data, geoms, scales, annotation, theme](screenshots/Recreating-Professional-Charts-in-R-build-order.webp)

*Figure 1: The order to build any chart in, from data on the left to the styling on the right.*

[KEY INSIGHT]
**A default chart is tuned for any data; a professional chart is tuned for this data.** The ggplot defaults have to work for a scatter, a bar and a boxplot alike, so they commit to nothing. Your job is the opposite: decide what this one chart must say, then bend every layer toward that message.

**Try it:** Make a copy of the palette called `ex_pal` and change its highlight colour to a deep blue, `"#1f5f8b"`, then print it. Using a copy keeps the original `pal` intact for the charts that follow.

```r title="Your turn: recolour the palette"
# Copy pal into ex_pal, then reassign the highlight colour, then print ex_pal.
ex_pal <- pal
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recolour the palette solution"
ex_pal <- pal
ex_pal["highlight"] <- "#1f5f8b"
ex_pal
#> highlight      cool   context       ink 
#> "#1f5f8b" "#2f6d80" "#b9c2ca" "#22303a" 
```

**Explanation:** Because the palette is a named vector, you reassign one element by its name and the other three are untouched. Working on `ex_pal` rather than `pal` means the tutorial's charts keep their original burnt-orange highlight.

</details>

## How do you build a dense small-multiples panel?

The first style is the small-multiples panel: the same chart drawn many times, once per group, in a tight grid. It is the honest way to show a pattern that repeats across dozens of categories, because the eye compares shapes rather than untangling a bowl of overlapping lines. What makes a good one work is discipline: identical, minimal encoding in every panel, and each panel free to use the vertical scale that suits it.

Our data is real. The `txhousing` dataset that ships with ggplot2 records monthly home sales for Texas cities from the Texas A&M Real Estate Center. We total each city's sales by year, keep twelve well-known metros, and stop at 2014 so every year is complete. We also lock the city order, so the biggest metros lead the grid.

```r title="Aggregate annual sales for twelve metros"
tx_metros <- c("Houston", "Dallas", "Austin", "San Antonio",
               "Fort Worth", "El Paso", "Corpus Christi", "Tyler",
               "Amarillo", "Beaumont", "Abilene", "Wichita Falls")

tx_sales <- txhousing |>
  filter(city %in% tx_metros, year <= 2014) |>
  group_by(city, year) |>
  summarise(homes_sold = sum(sales), .groups = "drop") |>
  mutate(city = factor(city, levels = tx_metros))

head(tx_sales)
#> # A tibble: 6 × 3
#>   city     year homes_sold
#>   <fct>   <int>      <dbl>
#> 1 Abilene  2000       1375
#> 2 Abilene  2001       1431
#> 3 Abilene  2002       1516
#> 4 Abilene  2003       1632
#> 5 Abilene  2004       1830
#> 6 Abilene  2005       1977
```

Each row is now one metro in one year with a single number, `homes_sold`. That tidy shape, one row per panel-point, is exactly what `facet_wrap()` wants. Before we plot, let's confirm there is a story worth telling by reading Houston's crash and recovery in three numbers.

```r title="Read the crash and the recovery"
tx_sales |>
  filter(city == "Houston") |>
  summarise(peak_2006   = homes_sold[year == 2006],
            trough_2009 = homes_sold[year == 2009],
            back_by_2014 = homes_sold[year == 2014])
#> # A tibble: 1 × 3
#>   peak_2006 trough_2009 back_by_2014
#>       <dbl>       <dbl>        <dbl>
#> 1     80994       60106        83412
```

Houston sold about 81,000 homes in 2006, fell to 60,000 by 2009 as the financial crisis hit, then climbed back past its old peak by 2014. That rise, fall and recovery is the shape we want every panel to show. Now for the naive version: one line per city, faceted, with nothing else.

```r title="Draw the default small-multiples"
ggplot(tx_sales, aes(year, homes_sold)) +
  geom_line() +
  facet_wrap(~ city)
```

Run it and you meet the small-multiples trap. Because `facet_wrap()` shares one vertical scale by default, Houston's tall numbers stretch the axis, and every smaller metro flattens into a line hugging the floor. You can see Houston, and almost nothing else. The fix is to let each panel choose its own y-scale, add a light band to mark the downturn years as shared context, and clean the rest with our theme.

```r title="Build the finished panel"
ggplot(tx_sales, aes(year, homes_sold)) +
  annotate("rect", xmin = 2007, xmax = 2011, ymin = -Inf, ymax = Inf,
           fill = "#eceff1", alpha = 0.9) +
  geom_area(fill = pal[["cool"]], alpha = 0.16) +
  geom_line(colour = pal[["cool"]], linewidth = 0.7) +
  facet_wrap(~ city, scales = "free_y", ncol = 4) +
  scale_x_continuous(breaks = c(2000, 2007, 2014)) +
  scale_y_continuous(labels = label_number(scale_cut = cut_short_scale()),
                     breaks = pretty_breaks(3),
                     expand = expansion(mult = c(0, 0.08))) +
  labs(title = "Home sales fell across every Texas metro after 2007, then recovered",
       subtitle = "Homes sold per year. Shaded band marks the 2007-2011 downturn. Each panel keeps its own vertical scale.",
       x = NULL, y = NULL,
       caption = "Source: Texas A&M Real Estate Center, via the txhousing dataset in ggplot2.") +
  theme_pub() +
  theme(panel.grid.major.x = element_blank(),
        panel.spacing = unit(11, "pt"),
        strip.text = element_text(face = "bold", hjust = 0, colour = pal[["ink"]],
                                  size = rel(0.95), margin = margin(b = 3)),
        axis.text = element_text(size = rel(0.8)))
```

![A four-by-three grid of Texas metro home-sales panels, each with its own scale, a shaded recession band, and a filled area line](screenshots/Recreating-Professional-Charts-in-R-smallmultiples.webp)

*Figure 2: The finished small-multiples panel. Every metro repeats the same downturn-and-recovery shape at its own scale.*

Walk through what changed. The `annotate("rect", ...)` draws one grey band across the 2007 to 2011 downturn in every panel, so the crash years are marked once and read everywhere. Setting `scales = "free_y"` is the decision that saves the chart: now Wichita Falls, with a few thousand sales, gets the same vertical room as Houston with eighty thousand. The `label_number(scale_cut = cut_short_scale())` call turns 80000 into a clean "80K", and `pretty_breaks(3)` keeps each panel to three tidy gridlines instead of a cluttered ladder.

The result reads at two speeds. Glance at it and the whole state dips together in the shaded years, then rises out of it. Look closer and each metro tells its own version: Houston and Austin blow past their old peaks, while Wichita Falls never fully recovers. A single shared-scale chart would have hidden all of that. The comparison below shows exactly what the free scale buys you.

![Left, four panels on a shared scale where small metros flatten to the baseline; right, the same four on free scales, each shape visible](screenshots/Recreating-Professional-Charts-in-R-smallmultiples-compare.webp)

*Figure 3: A shared y-axis hides the small metros; a free y-axis gives every one its own shape.*

[WARNING]
**A shared scale silently hides your smaller panels.** When one group is much larger than the rest, a single y-axis flattens everyone else into a flat line and the reader concludes, wrongly, that nothing happened there. Reach for `scales = "free_y"` whenever the groups differ in size and the shape, not the absolute level, is the story.

**Craft notes for this chart.** Three decisions carried it: freeing the y-scale so every panel is legible, repeating one calm colour and one thin line in every panel so the grid reads as a set, and marking the downturn with a single shared band instead of twelve separate labels. The traps it avoids are the shared axis that crushes small metros, and the temptation to give each of the twelve metros its own colour, which would turn a clean grid into a rainbow with no added meaning.

**Try it:** Feel the problem for yourself. Rebuild a stripped-down panel but set `scales = "fixed"` and watch the small metros collapse.

```r title="Your turn: shared versus free scale"
# Draw tx_sales faceted by city with a fixed (shared) scale.
# ggplot(tx_sales, aes(year, homes_sold)) + geom_line(colour = pal[["cool"]]) + ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shared-scale solution"
ggplot(tx_sales, aes(year, homes_sold)) +
  geom_line(colour = pal[["cool"]]) +
  facet_wrap(~ city, scales = "fixed")
```

**Explanation:** With `scales = "fixed"`, Houston's large values set the axis for all twelve panels, so the smaller metros press flat against the bottom. Switching that one argument to `"free_y"` is the entire difference between a chart that hides its data and one that reveals it.

</details>

## How do you build an annotated line chart that tells one story?

The second style is the annotated line chart: several series over time where one line is the story and the rest are context. The professional move is to stop treating every line as equal. You highlight one in colour, mute the others to grey, and label the lines directly at their ends so the reader never has to bounce between a legend and the chart.

Our data is `EuStockMarkets`, a built-in record of daily closing prices for four major European indices from 1991 to 1998: Germany's DAX, Switzerland's SMI, France's CAC and the UK's FTSE. Raw prices are not comparable, because each index starts at a different level, so we rebase every series to 100 at the start. Then a value of 200 means "doubled", whatever the index.

```r title="Rebase every index to 100"
eu <- as.data.frame(EuStockMarkets)
eu$year <- as.numeric(time(EuStockMarkets))

eu_long <- eu |>
  mutate(across(c(DAX, SMI, CAC, FTSE), ~ .x / first(.x) * 100)) |>
  pivot_longer(c(DAX, SMI, CAC, FTSE), names_to = "index", values_to = "value")

eu_long |>
  group_by(index) |>
  summarise(start = round(first(value)),
            end   = round(last(value)),
            gain_pct = round(last(value) - 100),
            .groups = "drop") |>
  arrange(desc(end))
#> # A tibble: 4 × 4
#>   index start   end gain_pct
#>   <chr> <dbl> <dbl>    <dbl>
#> 1 SMI     100   457      357
#> 2 DAX     100   336      236
#> 3 CAC     100   225      125
#> 4 FTSE    100   223      123
```

There is the story in one table. Every index rose, but Switzerland's SMI ended at 457, a 357% gain that left the others far behind, while France and the UK roughly doubled. That gap is what the chart must make obvious the instant someone looks at it. To highlight one line, we split the data into the lead series and the rest, and we pre-compute where each end label should sit.

```r title="Separate the lead line from the context"
eu_context <- filter(eu_long, index != "SMI")
eu_lead    <- filter(eu_long, index == "SMI")

ends <- eu_long |>
  group_by(index) |>
  filter(year == max(year)) |>
  ungroup() |>
  mutate(label = paste0(index, "  ", round(value)),
         label_y = case_when(index == "CAC"  ~ value + 9,
                             index == "FTSE" ~ value - 9,
                             TRUE            ~ value))
```

Splitting the frame lets us draw the grey lines and the coloured line as separate layers, each with its own fixed colour. The `ends` table holds one row per index at the final date, with a ready-made label like "SMI  457". Because CAC and FTSE finish almost on top of each other at 225 and 223, we nudge their labels apart by hand with `label_y`, so the text never overlaps. First, though, the default, so you can feel the difference.

```r title="Draw the default spaghetti"
ggplot(eu_long, aes(year, value, colour = index)) +
  geom_line()
```

Four lines, four colours of equal weight, and a legend off to the side. Nothing is wrong, and nothing is emphasised, so the reader has to work: match a colour to the legend, find the line again, repeat. That handoff between legend and chart is friction, and friction loses readers. Now the finished version, where colour and labels do the pointing for them.

```r title="Build the annotated highlight chart"
ggplot(mapping = aes(year, value, group = index)) +
  geom_hline(yintercept = 100, colour = "#d6dce0", linewidth = 0.5, linetype = "22") +
  geom_line(data = eu_context, colour = pal[["context"]], linewidth = 0.7) +
  geom_line(data = eu_lead,    colour = pal[["highlight"]], linewidth = 1.3) +
  geom_text(data = filter(ends, index != "SMI"), aes(y = label_y, label = label),
            hjust = 0, nudge_x = 0.06, colour = "#8b97a0", size = 3.5, fontface = "bold") +
  geom_text(data = filter(ends, index == "SMI"), aes(y = label_y, label = label),
            hjust = 0, nudge_x = 0.06, colour = pal[["highlight"]], size = 3.9, fontface = "bold") +
  annotate("text", x = 1992.1, y = 452, hjust = 0, colour = pal[["highlight"]],
           size = 4.1, lineheight = 0.95,
           label = "Switzerland's SMI roughly\nquadrupled over the decade") +
  scale_x_continuous(breaks = 1991:1998, limits = c(1991.4, 1999.4)) +
  scale_y_continuous(breaks = c(100, 200, 300, 400, 500)) +
  labs(title = "Switzerland's market led Europe's 1990s bull run",
       subtitle = "Four major indices, each rebased to 100 at the start of 1991. Line ends show the final level.",
       x = NULL, y = "Index (Jan 1991 = 100)",
       caption = "Source: EuStockMarkets, R datasets. Daily closing prices, 1991-1998.") +
  theme_pub() +
  theme(panel.grid.major.x = element_blank())
```

![Four rebased European stock indices, with the Swiss SMI drawn in bold orange above three grey lines, each labelled at its end](screenshots/Recreating-Professional-Charts-in-R-annotated-line.webp)

*Figure 4: The finished annotated line chart. One coloured line carries the story; the rest are quiet context.*

Read how the layers stack. The dashed `geom_hline` at 100 is the "no change" baseline, so any line above it has grown. We draw `eu_context` first in grey and `eu_lead` second in orange, so the highlighted line sits on top and reads as the foreground. The two `geom_text` layers put each index's name and final value right at the end of its line, which is why the chart needs no legend at all. The `annotate("text", ...)` call adds one sentence of interpretation in the same highlight colour, tying the words to the line they describe.

[TIP]
**Label lines at their ends instead of using a legend.** A legend forces the reader to hold a colour in memory and hunt for the matching line. A short label at the end of each line, in the line's own colour, removes that step entirely and reads like a finished newspaper graphic.

Set that beside the default and the difference is not decoration, it is comprehension. The default asks the reader to decode; the finished chart hands them the point.

![Left, four equal coloured lines with a legend; right, one orange line above three grey ones with labels on the lines](screenshots/Recreating-Professional-Charts-in-R-annotated-line-compare.webp)

*Figure 5: A legend to decode versus one highlighted line with labels sitting on the data.*

[KEY INSIGHT]
**Colour is a spotlight, so spend it on one thing.** The moment every series has its own bright colour, none of them stands out and the chart has no subject. Muting the context to grey and giving a single line the accent colour tells the reader exactly where to look first.

**Craft notes for this chart.** The three decisions: rebasing to 100 so the series are comparable at all, highlighting one line while greying the rest, and labelling on the lines rather than in a legend. The traps avoided are the legend hunt and the four-equal-colours spaghetti, both of which spread the reader's attention thin instead of pointing it at the one line that matters.

**Try it:** Change which line is the hero. Highlight the DAX instead of the SMI by splitting the data on `"DAX"`, and draw it over the grey context.

```r title="Your turn: highlight a different index"
# Split eu_long into ex_context (everything but DAX) and ex_lead (DAX), then draw.
ex_context <- filter(eu_long, index != "DAX")
ex_lead    <- filter(eu_long, index == "DAX")
# add two geom_line layers using pal[["context"]] and pal[["highlight"]]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Highlight the DAX solution"
ex_context <- filter(eu_long, index != "DAX")
ex_lead    <- filter(eu_long, index == "DAX")

ggplot(mapping = aes(year, value, group = index)) +
  geom_line(data = ex_context, colour = pal[["context"]]) +
  geom_line(data = ex_lead, colour = pal[["highlight"]], linewidth = 1.2) +
  theme_pub()
```

**Explanation:** The highlight technique is data-driven, not hard-coded. You choose the hero simply by which rows land in the lead frame, so pointing the spotlight at a different series is a one-word change from `"SMI"` to `"DAX"`.

</details>

## How do you build a diverging comparison chart?

The third style is the diverging bar chart: a ranked comparison where each category is measured against a meaningful centre, and bars spread left and right of a zero line. It answers "who is above and who is below?" at a glance. The craft is in the categorical layout: sort the bars by value, centre them on a real baseline, and use just two colours to split the two sides.

Our data is `USArrests`, the 1973 rates of arrest per 100,000 residents in each US state, from the World Almanac. The raw assault numbers are not comparable across a reader's intuition, so we standardise them into a z-score: how many standard deviations each state sits above or below the national average. A z-score of +1 means "one standard deviation above average".

```r title="Standardise each state against the average"
arrests <- USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (Assault - mean(Assault)) / sd(Assault),
         side = if_else(z >= 0, "Above average", "Below average")) |>
  arrange(desc(z))

arrests |>
  select(state, Assault, z, side) |>
  mutate(z = round(z, 2)) |>
  head(6)
#>            state Assault    z          side
#> 1 North Carolina     337 1.99 Above average
#> 2        Florida     335 1.97 Above average
#> 3       Maryland     300 1.55 Above average
#> 4        Arizona     294 1.48 Above average
#> 5     New Mexico     285 1.37 Above average
#> 6 South Carolina     279 1.30 Above average
```

Each state now has a `z` and a `side` label. North Carolina and Florida sit almost two standard deviations above the national average, and the `side` column will drive the two-colour split. The `tibble::rownames_to_column("state")` step matters because the state names live in the row names of `USArrests`, and a chart needs them as a real column. Here is the naive default.

```r title="Draw the default bar chart"
ggplot(arrests, aes(state, Assault)) +
  geom_col()
```

It is a mess, and instructively so. The states run alphabetically, so Alabama sits next to Alaska for no reason a reader cares about, the bars all start at zero on raw counts, and fifty vertical labels crush together along the bottom. You cannot see who is high or low without reading every bar. The finished version fixes all three problems: sort by value, centre on the average, and colour by side.

```r title="Build the diverging chart"
div_cols <- c("Above average" = pal[["highlight"]],
              "Below average" = pal[["cool"]])

ggplot(arrests, aes(x = z, y = reorder(state, z), fill = side)) +
  geom_col(width = 0.72) +
  geom_vline(xintercept = 0, colour = "#7b8894", linewidth = 0.5) +
  scale_fill_manual(values = div_cols, name = NULL) +
  scale_x_continuous(breaks = -2:2,
                     labels = c("-2 sd", "-1 sd", "average", "+1 sd", "+2 sd"),
                     expand = expansion(mult = c(0.02, 0.02))) +
  labs(title = "Assault arrests in 1973: how far each state sat from the US average",
       subtitle = "State assault-arrest rate, standardised (z-score). Bars right of the line are above the national average.",
       x = NULL, y = NULL,
       caption = "Source: McNeil (1977) / World Almanac 1975, via R's USArrests. Rate per 100,000 residents.") +
  theme_pub() +
  theme(panel.grid.major.y = element_blank(),
        axis.text.y = element_text(size = rel(0.72), colour = pal[["ink"]]),
        legend.position = "top",
        legend.justification = "left")
```

![A horizontal diverging bar chart of fifty US states, sorted from most above average in orange at the top to most below average in teal at the bottom](screenshots/Recreating-Professional-Charts-in-R-diverging.webp)

*Figure 6: The finished diverging chart. States are ranked around the national average, with two colours splitting above from below.*

Look at how the layout carries the meaning. Putting `z` on the x-axis and `reorder(state, z)` on the y-axis sorts the bars from most above average at the top to most below at the bottom, so the ranking is the shape of the chart. The `geom_vline` at zero is the reference every bar is measured against, and relabelling the axis ticks as "average" and "+1 sd" tells the reader what zero and one actually mean. The two-colour `scale_fill_manual` splits the country in half at a glance, without inventing fifty separate colours.

Against the default, the difference is meaning versus noise.

![Left, fifty alphabetical single-colour bars of raw counts; right, the same states sorted, centred on the average and split into two colours](screenshots/Recreating-Professional-Charts-in-R-diverging-compare.webp)

*Figure 7: Alphabetical raw bars tell you nothing; sorted, centred, two-tone bars tell you everything.*

[NOTE]
**Standardising is what makes the comparison fair.** Raw counts answer "how many", but a z-score answers "how unusual", which is the question a comparison chart is really asking. Subtracting the mean and dividing by the standard deviation puts every state on one common ruler, so a bar's length is its distance from the norm.

**Craft notes for this chart.** The three decisions: standardising to a shared ruler so lengths are comparable, sorting the categories by value so the ranking reads instantly, and using two tones plus a zero line so above and below split cleanly. The traps avoided are a truncated baseline that would exaggerate the differences, and a fifty-colour palette that would add visual noise without adding meaning.

**Try it:** Swap the crime. Rebuild the diverging chart on the `Murder` column instead of `Assault`, reusing `div_cols`.

```r title="Your turn: diverge on murder rates"
# Recompute z on Murder, keep the side label, then draw the diverging bars.
ex_murder <- USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (Murder - mean(Murder)) / sd(Murder),
         side = if_else(z >= 0, "Above average", "Below average"))
# ggplot(ex_murder, aes(z, reorder(state, z), fill = side)) + ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Diverge on murder solution"
ex_murder <- USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (Murder - mean(Murder)) / sd(Murder),
         side = if_else(z >= 0, "Above average", "Below average"))

ggplot(ex_murder, aes(z, reorder(state, z), fill = side)) +
  geom_col() +
  scale_fill_manual(values = div_cols) +
  theme_pub()
```

**Explanation:** The whole recipe is portable. You change only the column inside the z-score, and the sort, the centre and the two-colour split all still work, because they were written to depend on `z` and `side` rather than on any one variable.

</details>

## Which traps make a chart lie?

The same three professional habits, honest scales, restrained colour and clear reference points, also protect you from the ways a chart can mislead. Three traps account for most misleading charts, and it is worth seeing at least one of them happen. The most common is the truncated axis: starting a bar chart's value axis somewhere above zero, which stretches small differences into dramatic ones.

```r title="See the truncated-axis lie"
austin <- filter(tx_sales, city == "Austin", year >= 2011)

ggplot(austin, aes(factor(year), homes_sold)) +
  geom_col(fill = pal[["highlight"]], width = 0.7) +
  coord_cartesian(ylim = c(20000, 32000)) +
  labs(title = "Truncated axis: 2014 looks like a giant leap", x = NULL, y = NULL) +
  theme_pub()
```

Run it and 2014 towers over 2011, as if sales had multiplied. They did not. By starting the axis at 20,000 rather than 0, we chopped off the shared base of every bar and left only the small differences on top, then blew those up to fill the panel. The honest version starts at zero.

```r title="Restore the zero baseline"
ggplot(austin, aes(factor(year), homes_sold)) +
  geom_col(fill = pal[["cool"]], width = 0.7) +
  scale_y_continuous(labels = label_number(scale_cut = cut_short_scale()),
                     expand = expansion(mult = c(0, 0.05))) +
  labs(title = "Zero baseline: the same numbers, honestly", x = NULL, y = NULL) +
  theme_pub()
```

![Left, Austin sales bars on an axis starting at 20,000 that exaggerate the rise; right, the same bars from zero showing a modest, steady climb](screenshots/Recreating-Professional-Charts-in-R-truncated-axis.webp)

*Figure 8: The same four numbers. A truncated axis manufactures a dramatic jump; a zero baseline shows the modest truth.*

[WARNING]
**A bar chart must start its value axis at zero.** The length of a bar is its meaning, so cutting off the bottom lies about the quantity even when every number on the chart is correct. Line charts, which encode position rather than length, may start elsewhere, but bars never should.

The other two traps are quieter. Dual axes, two different y-scales on the left and right of one chart, let you slide two unrelated series until they appear to move together, manufacturing a correlation that is really just your choice of scales. When you must compare two different units, use two stacked panels instead. And rainbow palettes, a different hue for every category, imply an order that hue does not carry, so a reader cannot tell which colour is "more". Use one accent against grey, as we did with the indices, or an ordered scale that runs light to dark when the categories genuinely rank.

**Try it:** Make the truncation worse. Push the lower limit up to 28,000 and watch the exaggeration grow.

```r title="Your turn: exaggerate the truncation"
# Change the ylim lower bound to 28000 and redraw the Austin bars.
# ggplot(austin, aes(factor(year), homes_sold)) + geom_col(fill = pal[["highlight"]]) + ...
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extreme truncation solution"
ggplot(austin, aes(factor(year), homes_sold)) +
  geom_col(fill = pal[["highlight"]]) +
  coord_cartesian(ylim = c(28000, 32000)) +
  theme_pub()
```

**Explanation:** The higher the axis floor, the smaller the slice of real data on show, and the more that slice is stretched to fill the panel. At a floor of 28,000, a rise of a few percent looks like a doubling, which is exactly the distortion a zero baseline prevents.

</details>

## The complete recipe: one theme, three charts

The real payoff of the last few sections is that you never build the kit twice. The block below is self-contained: it loads the tools, defines the palette and a compact theme, then builds a finished diverging chart on a brand-new variable, the share of each state that is urban. Lift it into any project, point it at your own data, and the house style comes along for free.

```r title="The reusable kit, start to finish"
library(ggplot2)
library(dplyr)

# 1. one palette, colours named by their job
pal <- c(highlight = "#c1440e", cool = "#2f6d80", context = "#b9c2ca", ink = "#22303a")

# 2. one theme, every non-data mark in one place
theme_pub <- function(base_size = 12, base_family = "sans") {
  theme_minimal(base_size, base_family) +
    theme(plot.title.position = "plot",
          plot.title    = element_text(face = "bold", colour = pal[["ink"]]),
          plot.subtitle = element_text(colour = "#5b6b76"),
          panel.grid.minor = element_blank(),
          panel.grid.major = element_line(colour = "#eef1f3", linewidth = 0.4))
}

# 3. use it: a diverging chart on a new question, start to finish
kit_chart <- USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (UrbanPop - mean(UrbanPop)) / sd(UrbanPop),
         side = if_else(z >= 0, "Above average", "Below average")) |>
  ggplot(aes(z, reorder(state, z), fill = side)) +
  geom_col(width = 0.72) +
  geom_vline(xintercept = 0, colour = "#7b8894") +
  scale_fill_manual(values = c("Above average" = pal[["highlight"]],
                               "Below average" = pal[["cool"]]), name = NULL) +
  labs(title = "The same kit, a new question",
       subtitle = "Urban population share by state, distance from the average",
       x = NULL, y = NULL) +
  theme_pub() +
  theme(axis.text.y = element_text(size = rel(0.7)),
        legend.position = "top", legend.justification = "left",
        panel.grid.major.y = element_blank())
kit_chart
```

Nothing in that block is specific to arrests or stock prices. It is the palette, the theme and the diverging pattern, aimed at a new column. That portability is the point: the effort you spent designing the kit pays out on every future chart, not just this one.

Once a chart is right on screen, the last step is exporting it at the size and resolution a report or print job needs. `ggsave()` handles that: give it a size and a resolution, and it writes the file.

```r title="Export at print quality"
out <- file.path(tempdir(), "diverging.png")
ggsave(out, kit_chart, width = 8, height = 10, units = "in", dpi = 300)
file.exists(out)
#> [1] TRUE
```

The `dpi = 300` is the usual floor for print, and fixing the size in inches means text keeps its intended proportion when the figure lands on the page. We wrote to a temporary folder here so nothing clutters your project, but in practice you would save to a named `figures/` file.

One last detail is fonts. The theme uses the generic `sans` family on purpose, so the code renders anywhere with no missing-font errors. For a branded typeface in your final export, register the font locally with the showtext package, then set `base_family` in the theme. That step needs a font installed on your own machine, so it runs in your local RStudio rather than in the browser.

```r-static title="Swap in a branded font locally"
# Run this in your own RStudio session (needs a font installed locally)
library(showtext)
font_add_google("Inter", "inter")   # or font_add() for a local .ttf
showtext_auto()

# then point the theme at it
theme_pub_branded <- function() theme_pub(base_family = "inter")
```

[KEY INSIGHT]
**The deliverable is the reusable kit, not any single chart.** A palette and a theme you can lift into the next project is worth more than one beautiful plot, because it makes every future chart start half-finished and end consistent. Design the system once, and the individual charts almost draw themselves.

**Try it:** Aim the kit at yet another column. Change `UrbanPop` to `Rape` in the recipe and rebuild, and the whole chart re-sorts around the new average.

```r title="Your turn: point the kit at a new column"
# In the kit_chart pipeline, replace UrbanPop with Rape (mean and sd too) and redraw.
```

<details>
<summary>Click to reveal solution</summary>

```r title="New-column solution"
USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (Rape - mean(Rape)) / sd(Rape),
         side = if_else(z >= 0, "Above average", "Below average")) |>
  ggplot(aes(z, reorder(state, z), fill = side)) +
  geom_col(width = 0.72) +
  geom_vline(xintercept = 0, colour = "#7b8894") +
  scale_fill_manual(values = c("Above average" = pal[["highlight"]],
                               "Below average" = pal[["cool"]]), name = NULL) +
  theme_pub() +
  theme(axis.text.y = element_text(size = rel(0.7)),
        panel.grid.major.y = element_blank())
```

**Explanation:** Because the recipe depends only on a computed `z` and `side`, swapping the source column is all it takes. The kit does the rest, which is exactly what a reusable system is for.

</details>

## The 12-question pre-ship checklist

Before any chart leaves your hands, run it past these twelve questions. They are the same decisions this case study made, turned into a checklist you can reuse on every graphic.

1. **Message.** Can you state, in one sentence, the single thing this chart is for?
2. **One story.** Does one element clearly carry that message, rather than everything competing at once?
3. **Hierarchy.** Is the most important thing the most visually prominent, in size, weight or colour?
4. **Honest axis.** Do bars start at zero, and does no axis truncation exaggerate a difference?
5. **Colour restraint.** Are you using one accent against grey, or an ordered scale, rather than a rainbow?
6. **Direct labels.** Have you labelled series on the chart instead of forcing the reader into a legend?
7. **Sorted categories.** Are categories ordered by value or by a meaningful sequence, never alphabetically by accident?
8. **Readable text.** Is every label legible at the final size, with a font that has a safe fallback?
9. **Reference points.** Is there a baseline, average line or annotation that tells the reader what "normal" is?
10. **Source and caption.** Does the chart name its data source and say what the numbers are?
11. **Export spec.** Is it saved at the right size and at least 300 DPI for the medium it ships in?
12. **The stranger test.** Would someone who has never seen the data understand the point within five seconds?

## Practice Exercises

These combine several ideas from the case study. Try each before opening the solution. They use their own variable names so they will not disturb the objects from the tutorial.

### Exercise 1: A median-price small-multiples panel

Build a small-multiples panel from `txhousing` showing the median sale price over time for six metros: Houston, Dallas, Austin, San Antonio, Fort Worth and El Paso. Use `scales = "free_y"` and `theme_pub()`. Store the working data in `my_prices`.

```r title="Exercise 1 starter"
# Keep the six metros, drop rows with a missing median, then plot median over date.
my_prices <- txhousing |>
  filter(city %in% c("Houston", "Dallas", "Austin",
                     "San Antonio", "Fort Worth", "El Paso"),
         !is.na(median))

# Plot date on x, median on y, facet by city with free scales:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_prices <- txhousing |>
  filter(city %in% c("Houston", "Dallas", "Austin",
                     "San Antonio", "Fort Worth", "El Paso"),
         !is.na(median))

ggplot(my_prices, aes(date, median)) +
  geom_line(colour = pal[["cool"]], linewidth = 0.7) +
  facet_wrap(~ city, scales = "free_y") +
  scale_y_continuous(labels = label_number(scale_cut = cut_short_scale())) +
  labs(title = "Median home price by metro", x = NULL, y = NULL) +
  theme_pub() +
  theme(strip.text = element_text(face = "bold", hjust = 0))
```

**Explanation:** The pattern is identical to the sales panel: filter to the groups you want, plot one line per panel, and free the y-scale so each metro's price range is legible. Reusing `theme_pub()` means this chart already matches the rest of your work.

</details>

### Exercise 2: Highlight the worst performer

Rebuild the rebased European-index line chart, but this time highlight the weakest index instead of the strongest, and add a direct label at its end. The weakest is the one with the lowest final value. Store the highlighted frame in `my_lead`.

```r title="Exercise 2 starter"
# From the summary, FTSE ended lowest (223). Highlight FTSE.
my_lead    <- filter(eu_long, index == "FTSE")
my_context <- filter(eu_long, index != "FTSE")
# Draw grey context lines and one highlighted FTSE line, then label its end.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_lead    <- filter(eu_long, index == "FTSE")
my_context <- filter(eu_long, index != "FTSE")
my_end <- filter(my_lead, year == max(year))

ggplot(mapping = aes(year, value, group = index)) +
  geom_line(data = my_context, colour = pal[["context"]], linewidth = 0.7) +
  geom_line(data = my_lead, colour = pal[["highlight"]], linewidth = 1.3) +
  geom_text(data = my_end, aes(label = paste0("FTSE  ", round(value))),
            hjust = 0, nudge_x = 0.06, colour = pal[["highlight"]],
            fontface = "bold") +
  scale_x_continuous(limits = c(1991.4, 1999.4)) +
  labs(title = "The UK's FTSE trailed its neighbours",
       x = NULL, y = "Index (Jan 1991 = 100)") +
  theme_pub()
```

**Explanation:** The highlight logic does not care whether the hero is the best or the worst performer. You choose the story by which rows go into the lead frame, then colour and a direct label do the pointing, exactly as they did for the SMI.

</details>

### Exercise 3: A diverging chart with the extremes labelled

Build a diverging bar chart of the urban-population z-score by state (as in the recipe), but add value labels only to the five most urban states, so the extremes are called out without cluttering all fifty bars. Store the data in `my_urban`.

```r title="Exercise 3 starter"
my_urban <- USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (UrbanPop - mean(UrbanPop)) / sd(UrbanPop),
         side = if_else(z >= 0, "Above average", "Below average")) |>
  arrange(desc(z))

# Draw the diverging bars, then add geom_text for head(my_urban, 5) only.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_urban <- USArrests |>
  tibble::rownames_to_column("state") |>
  mutate(z = (UrbanPop - mean(UrbanPop)) / sd(UrbanPop),
         side = if_else(z >= 0, "Above average", "Below average")) |>
  arrange(desc(z))

ggplot(my_urban, aes(z, reorder(state, z), fill = side)) +
  geom_col(width = 0.72) +
  geom_vline(xintercept = 0, colour = "#7b8894") +
  geom_text(data = head(my_urban, 5), aes(label = round(z, 1)),
            hjust = -0.2, size = 3, colour = pal[["ink"]]) +
  scale_fill_manual(values = c("Above average" = pal[["highlight"]],
                               "Below average" = pal[["cool"]]), name = NULL) +
  labs(title = "How urban is each state, versus the average?",
       x = NULL, y = NULL) +
  theme_pub() +
  theme(axis.text.y = element_text(size = rel(0.7)),
        panel.grid.major.y = element_blank(),
        legend.position = "top", legend.justification = "left")
```

**Explanation:** Labelling only `head(my_urban, 5)` calls out the extremes while leaving the other bars clean, which is a common newsroom compromise between a fully labelled chart and a bare one. The reader gets the headline numbers without fifty competing labels.

</details>

## Frequently asked questions

### How many groups is too many for a small-multiples panel?

Small multiples stay readable up to a few dozen panels, as long as every panel keeps the same simple encoding. Past that the panels get too small to read, so show only the most important groups or summarise the rest into an "other" panel. This post used twelve metros, which fits comfortably in a four-column grid.

### Should I always use free scales for small multiples?

No. Free scales are right when the shape of each group is the story and the groups differ a lot in size, as the Texas metros did. But a free y-axis hides how much bigger one group is than another, so when the absolute magnitudes are the point of the comparison, keep a shared scale. The choice follows the question you are asking, not a fixed rule.

### How do I label lines directly instead of using a legend?

Build a small table with one row per series at its final x-position, then add a `geom_text` layer that draws each label there in the line's own colour. Nudge any overlapping labels apart by hand, the way we separated CAC and FTSE. Once every line is labelled at its end, you can drop the legend entirely.

### How do I keep the same style across every chart in a project?

Put your colours in one named vector and every non-data styling choice in one theme function, then call that function on each plot. Because the styling lives in a single place, changing a colour or a font size updates every chart at once, and new charts start already on-brand.

### What size and resolution should I export a chart at?

Use `ggsave()` with the size fixed in inches and the resolution set to at least 300 DPI for anything printed. Fixing the size in inches keeps text at its intended proportion on the page, and 300 DPI is the usual floor for print quality. A figure that will only ever appear on screen can use a lower DPI.

## Summary

Recreating a professional chart is not about a secret geom or a magic package. It is about making a short list of decisions on purpose, in the same order every time: shape the data, choose the marks, set honest scales, add the labels and annotation that carry the message, and finish with a consistent theme.

| Chart style | The decision that carried it | The trap it avoids |
|---|---|---|
| Small multiples | Free the y-scale so every panel is legible | A shared scale that flattens small groups |
| Annotated line | Highlight one line, label it directly | A legend hunt and four competing colours |
| Diverging bars | Sort, centre and split into two tones | A truncated baseline and a rainbow palette |

The three habits worth carrying into every chart you make are these: keep your scales honest, so a bar starts at zero and no axis exaggerates; spend colour like it is scarce, one accent against grey; and label the data directly so the reader never has to decode. Build those into a reusable palette and theme, and your charts will look deliberate because they will be.

## References

1. Wickham, H., Navarro, D., and Pedersen, T. L. *ggplot2: Elegant Graphics for Data Analysis (3e), Annotations.* [Link](https://ggplot2-book.org/annotations.html) - the reference for the `geom_text` and `annotate()` layers used to label the lines and shade the recession band.
2. ggplot2 documentation. *facet_wrap(): wrap a 1d ribbon of panels into 2d.* [Link](https://ggplot2.tidyverse.org/reference/facet_wrap.html) - the full argument list for faceting, including the `scales = "free_y"` option that rescued the small-multiples panel.
3. scales package. *Label and transform functions for ggplot2 scales.* [Link](https://scales.r-lib.org/) - documents `label_number`, `cut_short_scale` and `pretty_breaks`, the axis-formatting helpers used throughout.
4. The R Graph Gallery. *Diverging bar plot recreated from a New York Times chart.* [Link](https://r-graph-gallery.com/web-diverging-bar-plot-recreated-from-nytimes.html) - a worked recreation of a real diverging bar chart, close to the one built here.
5. The R Graph Gallery. *Line chart with labels at the end of each line.* [Link](https://r-graph-gallery.com/web-line-chart-with-labels-at-end-of-line.html) - a step-by-step version of the direct-labelling technique behind the annotated line chart.
6. Wilke, C. O. *Fundamentals of Data Visualization.* [Link](https://clauswilke.com/dataviz/) - the theory behind honest scales, colour restraint and small multiples, freely readable online.
7. Cairo, A. *The Truthful Art: Data, Charts, and Maps for Communication.* New Riders (2016). [Link](https://www.thefunctionalart.com/p/the-truthful-art-book.html) - a careful treatment of the truncated-axis and dual-axis traps covered in the final section.

## Continue Learning

- [A Publication Figure System in R: an End-to-End Case Study](/Publication-Figure-System-in-R.html) - build the reusable theme, palette and scales this chapter leans on into a full figure system.
- [Publication-Ready ggplot2 Figures: The Checklist](/Publication-Quality-Figures-in-R.html) - the per-figure checklist of fonts, sizes and DPI that turns a draft into a journal-ready figure.
- [ggplot2 Themes: From theme_classic to Your Own House Style](/ggplot2-Themes-in-R.html) - a deeper look at every theme element you can control when you design a house style.
