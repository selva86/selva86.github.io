---
title: "ggplot2 scale_color_viridis() in R: Perceptually Uniform Colors"
slug: "ggplot2-scale_color_viridis-in-R"
description: "Use ggplot2 scale_color_viridis_c() and scale_color_viridis_d() for perceptually uniform colors in R. Covers option, direction, vs brewer, 5 examples."
keywords: "ggplot2 scale_color_viridis, R viridis palette, scale_color_viridis_c, scale_color_viridis_d, perceptually uniform"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_color_viridis()|scale_color_viridis_c()|scale_color_viridis_d()|viridis palette|perceptually uniform colors"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_color_viridis"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_color_viridis() in R: Perceptually Uniform Colors

<p class="lead">The viridis family in ggplot2 (<code>scale_color_viridis_c()</code> and <code>scale_color_viridis_d()</code>) provides perceptually uniform color palettes that look good in print, are colorblind-friendly, and work across any number of categories.</p>

[QUICK ANSWER]
+ scale_color_viridis_c()                    # continuous
+ scale_color_viridis_d()                    # discrete
+ scale_color_viridis_c(option = "magma")
+ scale_fill_viridis_c()                      # fill aesthetic
+ scale_color_brewer()                        # palette alternative

[DECISION TREE: Is scale_color_viridis() the right tool?]
- continuous color scale: scale_color_viridis_c()
- discrete categories: scale_color_viridis_d()
- alternative palette: option = "viridis", "magma", "plasma", "inferno"
- brewer palettes: scale_color_brewer()
- custom: scale_color_manual()

## What scale_color_viridis() does in one sentence

**The viridis family applies one of several perceptually uniform palettes (viridis, magma, plasma, inferno, cividis, mako, rocket, turbo) to either continuous (`_c`) or discrete (`_d`) color aesthetics.**

## Syntax

**`scale_color_viridis_c(option = "viridis", direction = 1, ...)`. `_d` for discrete; `_b` for binned.**

```r title="Continuous viridis"
library(ggplot2)

ggplot(mtcars, aes(wt, mpg, color = hp)) +
  geom_point(size = 3) +
  scale_color_viridis_c()
```

[TIP]
**Viridis is the recommended default for any color scale in scientific visualization.** It is colorblind-safe and prints well in greyscale.

## Five common patterns

### 1. Continuous viridis

```r title="Default option"
+ scale_color_viridis_c()
```

### 2. Discrete viridis

```r title="For factor levels"
+ scale_color_viridis_d()
```

### 3. Different option

```r title="Magma (warm)"
+ scale_color_viridis_c(option = "magma")
```

Options: viridis (default), magma, plasma, inferno, cividis, mako, rocket, turbo.

### 4. Reverse direction

```r title="Light to dark or reverse"
+ scale_color_viridis_c(direction = -1)
```

### 5. Fill version

```r title="For heatmap or area"
+ scale_fill_viridis_c()
```

[KEY INSIGHT]
**Viridis was DESIGNED to be colorblind-safe and perceptually uniform.** Most other palettes have perceptual artifacts (banding, hue shifts) that mislead readers. Use viridis as default.

## scale_color_viridis_c() vs scale_color_brewer() vs scale_color_gradient()

| Function | Continuous | Discrete | Colorblind-safe |
|---|---|---|---|
| `scale_color_viridis_c()` | Yes | No | Yes |
| `scale_color_viridis_d()` | No | Yes | Yes |
| `scale_color_brewer()` | No (use distiller) | Yes | Some palettes |
| `scale_color_gradient()` | Yes | No | Depends |

When to use which:

- viridis_c for continuous (heatmaps, gradient).
- viridis_d for discrete (groups).
- brewer for small qualitative groups (3-8).

## A practical workflow

**Use viridis as default for any continuous color encoding.**

```r
ggplot(diamonds, aes(carat, price, color = depth)) +
  geom_point(alpha = 0.5) +
  scale_color_viridis_c() +
  scale_x_log10() +
  scale_y_log10()
```

## Common pitfalls

**Pitfall 1: wrong variant.** Use `_c` for continuous numeric color; `_d` for discrete factor; `_b` for binned numeric. Mismatch produces gradients on factors or vice versa.

**Pitfall 2: option names.** Magma, plasma, inferno, cividis are options. Get the spelling right.

[WARNING]
**`scale_color_viridis()` (without `_c` or `_d`) is the OLD API.** Modern code uses `_c` (continuous), `_d` (discrete), or `_b` (binned).

## Try it yourself

**Try it:** Plot mtcars with color = hp (continuous) using viridis. Save to `ex_plot`.

```r title="Your turn: continuous viridis"
ex_plot <- mtcars |>
  ggplot(aes(wt, mpg, color = hp)) +
  geom_point(size = 3) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg, color = hp)) +
  geom_point(size = 3) +
  scale_color_viridis_c()
```

**Explanation:** Continuous viridis maps hp (numeric) to a perceptually uniform color gradient.

</details>

## Related ggplot2 functions

After mastering scale_color_viridis, look at:

- `scale_fill_viridis_c()` / `_d()`: fill aesthetic
- `scale_color_brewer()`: ColorBrewer palettes
- `scale_color_gradient()`: 2-color gradient
- `scale_color_gradient2()`: 3-color (diverging)
- `viridis::scale_color_viridis()`: original from viridis package

## FAQ

**What does scale_color_viridis_c do in ggplot2?**

It applies a perceptually uniform continuous color scale (default: viridis) to a continuous color aesthetic.

**What is the difference between viridis_c and viridis_d?**

_c is for CONTINUOUS numeric color. _d is for DISCRETE factor color. Use the right one for your aesthetic.

**Why is viridis recommended?**

It is colorblind-safe, perceptually uniform (equal data differences look equally different), and prints well in greyscale.

**What other viridis options are there?**

viridis (default), magma, plasma, inferno, cividis, mako, rocket, turbo. Pass via `option = "magma"`.

**Should I use scale_color_viridis_c or scale_color_distiller?**

Both produce continuous colors. viridis is the modern recommendation; distiller (built on ColorBrewer) is the older option.
