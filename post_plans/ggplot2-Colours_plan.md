# Plan: ggplot2 Colours

## A. Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Colours: Choose Palettes That Are Beautiful, Accessible, and Honest |
| slug | ggplot2-Colours |
| description | Colour choice affects perception and accessibility. Learn scale_color_manual(), viridis for ordinal data, ColorBrewer for categorical, and how to check for colour blindness. |
| keywords | ggplot2 colors, scale_color_manual, viridis palette R, ColorBrewer ggplot2, ggplot2 color palette, colorblind friendly R plot, scale_fill_brewer, ggplot2 custom colors, R color scales |
| auto_link_terms | ggplot2 colours|ggplot2 colors|scale_color_manual()|scale_fill_manual()|viridis palette|ColorBrewer palette|colour palettes in ggplot2 |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.12 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | ggplot2 Colours |
| sidebar_order | 6 |

## B. Breadcrumb

Home > Visualization > ggplot2 Foundations > ggplot2 Colours

## C. Full Section Outline

### Lead sentence
Colour in ggplot2 controls how viewers read your data — the right palette highlights patterns, respects colour-blind readers, and avoids misleading gradients.

### Introduction
- Hook: A beautiful chart with a bad palette can mislead or exclude. Colour is not decoration — it encodes meaning.
- What: ggplot2's colour scale system — manual, Brewer, viridis, gradient.
- Why: Accessibility, honesty, aesthetics.
- What you'll learn: Choose palettes by data type, apply them with the right scale function, and test for colour blindness.
- Packages: ggplot2, scales, viridis (all run in the browser).
- Diagram: palette-decision flowchart (Figure 1).

### Core H2 Sections (5 sections)

#### H2 1: How does ggplot2 map data to colours?
- Theory: aes(color=...) maps a variable; ggplot2 picks a default palette. Discrete vs continuous distinction.
- Code: scatter plot with default colours using mpg dataset (color = class).
- Code: same with continuous variable (color = hwy).
- Callout: KEY INSIGHT — ggplot2 treats factors as discrete and numerics as continuous.
- Inline exercise: Map a different variable to colour and observe the palette change.
- Diagram: scale-functions overview (Figure 2).

#### H2 2: How do you set custom colours with scale_color_manual()?
- Theory: When you want exact colours — brand guidelines, publication requirements, or personal preference.
- Code: scatter with scale_color_manual(values = c(...)) using named vector.
- Code: fill variant with bar chart + scale_fill_manual().
- Callout: TIP — Use a named vector so colour assignment is explicit, not positional.
- Inline exercise: Create a bar chart with 3 custom hex colours.

#### H2 3: When should you use ColorBrewer palettes?
- Theory: Cynthia Brewer's palettes — qualitative, sequential, diverging. Designed for cartography but perfect for data viz. Explain palette types.
- Code: scale_color_brewer(palette = "Set2") on scatter.
- Code: display.brewer.all() to show all palettes (or RColorBrewer::brewer.pal.info).
- Code: diverging palette for temperature-like data.
- Callout: WARNING — Don't use a qualitative palette for ordered data.
- Inline exercise: Try a diverging Brewer palette on a dataset.

#### H2 4: Why is viridis the default choice for continuous data?
- Theory: Perceptually uniform — equal steps in data produce equal steps in perceived colour. Works in greyscale. Robust to colour blindness. HCL colour space.
- Diagram: HCL components (Figure 3).
- Code: scale_color_viridis_c() on scatter with continuous variable.
- Code: scale_fill_viridis_d(option = "plasma") on bar chart.
- Code: show all 8 viridis options side by side.
- Callout: KEY INSIGHT — Viridis is perceptually uniform because it varies luminance monotonically.
- Inline exercise: Apply the "mako" viridis option and compare with "turbo".

#### H2 5: How do you check a chart for colour blindness?
- Theory: ~8% of men, ~0.5% of women have some form of colour vision deficiency. Deuteranopia (red-green) most common.
- Code: Use scales::show_col() and colorBlindness or colorblindr simulation.
- Alternative approach using scales::hue_pal() and prismatic::check_color_blindness() — but keep it to WebR-safe packages.
- Code: Use viridis + compare default hue palette through dichromat simulation.
- Callout: WARNING — Never rely on colour alone. Add shapes, labels, or patterns.
- Inline exercise: Test a red-green palette using the technique shown.

### Common Mistakes (5 mistakes)
1. Using a qualitative palette for ordered data (shuffles perception of order)
2. Using rainbow/jet palette (perceptual non-uniformity, fails in greyscale)
3. Forgetting to match scale function to data type (scale_color_brewer on continuous data errors)
4. Mapping colour inside aes() when you want a fixed colour (color = "blue" inside aes vs outside)
5. Too many discrete colours (>8 categories become indistinguishable)

### Practice Exercises (3 capstone)
1. (Medium) Build a scatter of mpg with hwy vs displ, colour by class. Apply a Brewer qualitative palette and add shape aesthetic as redundant encoding.
2. (Hard) Create a heatmap-style tile plot using geom_tile() with a viridis continuous scale on the faithfuld dataset. Customise the legend title and breaks.
3. (Hard) Reproduce a plot with a custom diverging palette that centers on zero, using scale_color_gradient2().

### Complete Example
End-to-end: load data, create a publication-quality scatter with viridis, add shape redundancy, customise legend, and test for colourblind safety.

### Summary
Table of scale functions: when to use each, data type, palette source.

### FAQ (5 questions)
1. What is the difference between color and fill in ggplot2?
2. How do I reverse a colour palette?
3. Can I use hex codes with scale_color_manual()?
4. How many discrete colours can I use before the chart becomes unreadable?
5. Why does scale_color_brewer() fail on continuous data?

### References (7 sources)
1. Wickham, H. — ggplot2: Elegant Graphics for Data Analysis (3e), Ch.11 Colour Scales
2. ggplot2 documentation — scale_colour_viridis_d()
3. ggplot2 documentation — scale_colour_brewer()
4. ColorBrewer 2.0 — colorbrewer2.org
5. viridis CRAN vignette — Introduction to viridis
6. Okabe & Ito — Color Universal Design (2008)
7. R Core Team — grDevices colour functions

### What's Next
1. ggplot2 Tutorial — complete guide to building plots
2. ggplot2 Theme customisation — fonts, backgrounds, axes

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | ggplot2-Colours-palette-decision.webp | Figure 1 | Decision flow for choosing a colour palette by data type. | Introduction |
| 2 | ggplot2-Colours-scale-functions.webp | Figure 2 | ggplot2 colour scale functions for discrete and continuous data. | How does ggplot2 map data to colours? |
| 3 | ggplot2-Colours-hcl-components.webp | Figure 3 | The three dimensions of HCL colour space. | Why is viridis the default choice for continuous data? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load libraries + mpg dataset | ggplot2, scales, viridis | mpg (built-in) | — |
| 2 | Default discrete colour mapping | — | p_discrete | mpg |
| 3 | Default continuous colour mapping | — | p_continuous | mpg |
| 4 | Inline exercise: map different variable | — | ex_plot1 | mpg |
| 5 | scale_color_manual() with named vector | — | custom_colors, p_manual | mpg |
| 6 | scale_fill_manual() bar chart | — | p_fill | mpg |
| 7 | Inline exercise: custom hex bar chart | — | ex_bar | mpg |
| 8 | scale_color_brewer() qualitative | — | p_brewer | mpg |
| 9 | Display brewer palette info | RColorBrewer | brewer_info | — |
| 10 | Diverging Brewer palette | — | p_diverge | mpg |
| 11 | Inline exercise: diverging palette | — | ex_div | mpg |
| 12 | scale_color_viridis_c() continuous | — | p_viridis | mpg |
| 13 | scale_fill_viridis_d() with options | — | p_plasma | mpg |
| 14 | Show viridis options | — | — | — |
| 15 | Inline exercise: mako vs turbo | — | ex_mako | mpg |
| 16 | Colourblind check with scales | — | pal_default | — |
| 17 | Viridis vs default comparison | — | pal_viridis | — |
| 18 | Inline exercise: test red-green | — | ex_cb | — |
| 19 | Mistake: qualitative for ordered | — | — | mpg |
| 20 | Mistake: color inside aes | — | — | mpg |
| 21 | Capstone exercise 1 | — | my_scatter | mpg |
| 22 | Capstone exercise 2 | — | my_heatmap | faithfuld |
| 23 | Capstone exercise 3 | — | my_diverge | — |
| 24 | Complete example | — | p_final | mpg |

Estimated word count: ~4500 words
