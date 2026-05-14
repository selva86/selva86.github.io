---
title: "ggplot2 ggsave() in R: Save Plots to PNG, PDF, and SVG"
slug: "ggplot2-ggsave-in-R"
description: "Use ggplot2 ggsave() to export plots to PNG, PDF, SVG, or JPEG in R. Set width, height, DPI, units, and resolution with 7 runnable examples and pitfalls."
keywords: "ggplot2 ggsave, ggsave function R, ggplot2 ggsave examples, R ggsave PNG, save ggplot to file, export ggplot R, ggsave width height dpi"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "ggsave()|ggplot2 ggsave|ggplot2::ggsave()|save ggplot to file|export ggplot"
auto_link_case_sensitive: true
target_keyword: "ggplot2 ggsave"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 ggsave() in R: Save Plots to PNG, PDF, and SVG

<p class="lead">The <code>ggsave()</code> function in ggplot2 writes the last (or a named) ggplot to disk. It picks the file format from the extension and lets you set width, height, units, and DPI for print-ready output.</p>

[QUICK ANSWER]
ggsave("plot.png")                                 # last plot, default size
ggsave("plot.png", plot = p)                       # a named plot object
ggsave("plot.png", width = 8, height = 5)          # inches by default
ggsave("plot.png", width = 20, height = 12, units = "cm")  # metric units
ggsave("plot.png", dpi = 300)                      # print resolution
ggsave("plot.pdf")                                 # vector PDF
ggsave("plot.svg")                                 # vector SVG
ggsave("plot.png", bg = "white")                   # force white background

[DECISION TREE: Is ggsave() the right tool?]
- save the last ggplot you drew: ggsave("out.png")
- save a specific plot object: ggsave("out.png", plot = p)
- export several plots in a loop: walk over filenames with ggsave()
- save a base R plot (not ggplot): png() + plot() + dev.off()
- save a multi-panel patchwork: ggsave() on the combined object
- need exact pixel dimensions: png(width = 800, height = 600, units = "px")
- save an interactive plotly plot: htmlwidgets::saveWidget()

## What ggsave() does in one sentence

**`ggsave()` writes a ggplot to a file using the extension to choose the graphics device.** Pass it a filename; it grabs the last displayed plot, infers PNG, PDF, SVG, JPEG, TIFF, BMP, EPS, or WMF from the suffix, and writes to your working directory.

Because the format follows the filename, you almost never need to call `png()` or `pdf()` directly when you are already in ggplot2. The function also accepts a plot object, custom dimensions, and DPI for control over what gets saved.

## Syntax

**`ggsave()` takes a filename and optional plot, size, and device arguments.** The minimum call is one string: a path with a known extension. Everything else has a sensible default.

```r title="Load ggplot2 and build a plot"
library(ggplot2)

p <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "Weight vs MPG", color = "Cylinders")

p
```

The full signature:

```
ggsave(filename, plot = last_plot(), device = NULL, path = NULL,
       scale = 1, width = NA, height = NA, units = c("in", "cm", "mm", "px"),
       dpi = 300, limitsize = TRUE, bg = NULL, ...)
```

Most arguments default to the current graphics device size, so a bare `ggsave("plot.png")` is often enough during interactive work. For reports and publications, pin `width`, `height`, and `dpi` explicitly.

[TIP]
**Always set width and height when sharing plots.** Without them, ggsave borrows your RStudio plot pane dimensions, so the same code on another machine produces a different file. Hard-coded inches or cm make output reproducible.

## Seven common patterns

### 1. Save the last plot

```r title="Save last plot to PNG"
ggplot(mtcars, aes(wt, mpg)) + geom_point()

ggsave("mtcars-scatter.png")
#> Saving 7 x 5 in image
```

No `plot =` argument needed. `ggsave()` defaults to `last_plot()`, which is whichever ggplot was rendered last in the session.

### 2. Save a specific plot object

```r title="Save a named ggplot object"
p <- ggplot(iris, aes(Sepal.Length, Sepal.Width, color = Species)) +
  geom_point()

ggsave("iris-scatter.png", plot = p, width = 6, height = 4)
```

Pass `plot = p` to bypass `last_plot()`. Useful when you generated several plots and want to save one that is not the most recent.

### 3. Set width, height, and units

```r title="Save in centimeters for a print column"
ggsave("mtcars-cm.png", plot = p, width = 12, height = 8, units = "cm")
```

Default unit is inches. Switch to `"cm"` or `"mm"` for print work; switch to `"px"` for exact-pixel exports for web use.

### 4. Set DPI for print or retina screens

```r title="High resolution PNG for print"
ggsave("mtcars-300dpi.png", plot = p,
       width = 6, height = 4, units = "in", dpi = 300)
```

DPI is dots per inch. Web uses 72 to 96 DPI; print typically 300; sharp screenshots for retina displays 320. Higher DPI multiplies pixel dimensions, not visual size.

### 5. Export to vector PDF or SVG

```r title="Vector PDF, no rasterization"
ggsave("mtcars.pdf", plot = p, width = 6, height = 4)

ggsave("mtcars.svg", plot = p, width = 6, height = 4)
```

PDF and SVG keep text and shapes as vectors, so the file zooms without pixelation. Best for academic figures and slide decks. SVG also opens in any browser and edits in Inkscape or Illustrator.

### 6. Force a white background

```r title="White background for slides"
ggsave("mtcars-white.png", plot = p, width = 6, height = 4, bg = "white")
```

ggplot2 themes like `theme_minimal()` have transparent panel backgrounds. PNG inherits that, which looks broken on dark slides. Pass `bg = "white"` (or any color) to force an opaque background.

### 7. Save many plots in a loop

```r title="Save one plot per species"
species_list <- split(iris, iris$Species)

for (nm in names(species_list)) {
  pi <- ggplot(species_list[[nm]], aes(Sepal.Length, Sepal.Width)) +
    geom_point() +
    labs(title = nm)
  ggsave(paste0("iris-", nm, ".png"), plot = pi, width = 5, height = 3)
}
```

`ggsave()` returns invisibly, so it composes well with `for` loops, `purrr::walk()`, or `lapply()`. Each call writes one file; nothing accumulates in memory.

## ggsave() vs the base R device pipeline

**ggsave() collapses the open-device, plot, close-device dance into one call.** Base R uses `png("file.png"); plot(...); dev.off()`. ggsave handles all three steps and picks the device from the extension.

| Aspect | `ggsave()` | `png()` / `pdf()` + `dev.off()` |
|---|---|---|
| Lines of code | 1 | 3 |
| Format selection | From extension | Explicit function |
| Default size source | Current graphics device | Function argument required |
| Units | in, cm, mm, px | px (png), in (pdf) |
| Works with non-ggplot output | No | Yes |
| Forgets to close device? | Cannot | Common bug |

Use `ggsave()` for ggplots. Use the base device pipeline for lattice plots, base graphics, or when wrapping several plots in one PDF (`pdf()` with multiple page-creating calls).

[NOTE]
**Patchwork and cowplot composites still work.** Combine plots with `p1 + p2` (patchwork) or `plot_grid(p1, p2)` (cowplot), then pass the result to `ggsave()`. The combined object is still a ggplot under the hood.

## Common pitfalls

**Three traps catch most users.**

1. **Forgetting `bg = "white"`**: Themes with transparent panels save with no background fill. Slides and Word documents render the transparent panel as black or white inconsistently. Always set `bg` for shared output.
2. **Setting `dpi` without `width` and `height`**: DPI scales pixel count, but the inch dimensions still come from the current device. Result: a tiny 300-DPI file because the device was 3 inches wide. Set width and height first.
3. **Mismatched extension and `device =`**: `ggsave("plot.png", device = "pdf")` writes PDF bytes into a `.png` file. Image viewers refuse to open it. Either trust the extension (omit `device`) or match them manually.

[WARNING]
**`limitsize = TRUE` blocks dimensions over 50 inches per side.** Run `ggsave("plot.png", width = 60, height = 30)` and it errors. Set `limitsize = FALSE` to override, but check your units first; you usually meant `cm`.

## Try it yourself

**Try it:** Save the mtcars scatter (`p` from earlier) as `mtcars-try.pdf` at 7 by 5 inches with DPI 300. Confirm the file exists.

```r title="Your turn: save p as PDF"
# Try it: save p to PDF with explicit size
ex_path <- "mtcars-try.pdf"
# your code here

file.exists(ex_path)
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- "mtcars-try.pdf"
ggsave(ex_path, plot = p, width = 7, height = 5, units = "in", dpi = 300)

file.exists(ex_path)
#> [1] TRUE
```

**Explanation:** Extension `.pdf` triggers the PDF device. Width, height, and units fix the physical page; dpi affects embedded rasters only (vector content stays vector).

</details>

## Related ggplot2 output functions

- `last_plot()`: returns the most recently displayed ggplot, what ggsave defaults to
- `ggplot2::ggplot_build()`: inspect the computed plot data before saving
- `grDevices::png()`, `pdf()`, `svg()`: the lower-level devices ggsave wraps
- `gridExtra::grid.arrange()`: combine plots for one ggsave call
- `patchwork::wrap_plots()`: modern composition; saves cleanly with ggsave

For deep control of the underlying device (custom fonts, anti-aliasing, Cairo backend), pass `device = ragg::agg_png` or `device = cairo_pdf` to ggsave.

## FAQ

**Why does ggsave save the wrong plot?**

`ggsave()` uses `last_plot()` when no `plot =` argument is given. If you ran another ggplot between the one you wanted and the `ggsave()` call, the wrong plot is saved. Either assign the target plot to a variable and pass it explicitly with `plot = p`, or call `ggsave()` immediately after rendering the intended plot.

**What units does ggsave use by default?**

The default is inches. Pass `units = "cm"`, `units = "mm"`, or `units = "px"` to switch. Pixels require ggplot2 3.3.0 or newer. For print, cm and mm match journal column specifications; for web, pixels match the final rendered size.

**Can ggsave export plots in multiple formats at once?**

Not in a single call, but a short loop does it cleanly. Use `for (ext in c("png","pdf","svg")) ggsave(paste0("plot.", ext), plot = p)`. Each format writes its own file, and the same dimensions translate between raster and vector.

**Why is my saved plot blurry or pixelated?**

PNG and JPEG are raster formats: they store a fixed pixel grid. A 6-inch plot at 72 DPI is 432 pixels wide; resizing it in slides multiplies the pixels and blurs the image. Raise `dpi` to 300 for print or use PDF / SVG for documents that zoom.

**How do I save a plot without showing it?**

Wrap the plot in `ggsave()` directly: `ggsave("plot.png", plot = ggplot(mtcars, aes(wt, mpg)) + geom_point())`. The plot is built but never sent to the active graphics device. Useful for batch scripts and Shiny apps that should not flash a render in the UI.

For more on building plots before saving, see [ggplot2 Tutorial With R](ggplot2-Tutorial-With-R.html).
