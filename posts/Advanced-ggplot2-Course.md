---
title: "Advanced ggplot2: A Hands-On Interactive Course"
slug: "Advanced-ggplot2-Course"
description: "Take ggplot2 further in three interactive lessons: faceting and scales, themes, colour and accessibility, and annotating and composing publication-ready figures."
keywords: "advanced ggplot2, facet_wrap, facet_grid, ggplot2 themes, colorblind palettes, ggrepel, patchwork, ggplot2 scales, ggplot2 course, interactive"
mathjax: false
webr: false
date: "2026-06-27"
curriculum_id: "2.5.0"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Advanced ggplot2 (Course)"
sidebar_order: "2"
---

# Advanced ggplot2: A Hands-On Interactive Course

<p class="lead">Once you can build a basic chart, the next leap is making it clear, honest and ready to share. This three-lesson interactive course takes ggplot2 beyond the basics: split a crowded chart into small multiples, restyle it without touching the data, and annotate and combine plots into a publication-ready figure.</p>

This course picks up where [Data Visualization with ggplot2](ggplot2-Course.html) leaves off. You already know that a plot is data, aesthetic mappings and geoms stacked into layers; here you learn the layers that turn a working chart into a finished one, and the judgment calls (which scale, which palette, which annotation) that separate a clear figure from a misleading one.

Each lesson is a guided, interactive experience: you build live charts in the browser, answer checkpoints, and write R as you go.

## The three lessons

### Lesson 1: Facets and scales

Split one crowded chart into **small multiples** with `facet_wrap(~ var)` (one panel per group) and `facet_grid(rows ~ cols)` (one panel per combination), then take control of the axes: fixed vs free scales (and when free scales mislead), log axes for data that spans orders of magnitude, and bending guides and legends to your reader's needs.

[Start Lesson 1: Facets and scales](Facets-and-Scales-in-ggplot2.html)

### Lesson 2: Themes, colour and accessibility

Restyle a plot without changing a single data value: built-in and custom **themes**, deliberate **colour scales**, and palettes that stay readable for everyone, including colourblind readers. Make a chart look the way you mean it to, on purpose.

[Start Lesson 2: Themes, colour and accessibility](Themes-Color-and-Accessibility.html)

### Lesson 3: Annotate and compose plots

Add annotations that explain (text labels, reference lines), place non-overlapping labels with **ggrepel**, and compose several plots into one figure with **patchwork**. The finishing moves that make a chart stand on its own in a report.

[Start Lesson 3: Annotate and compose plots](Annotate-and-Compose-Plots.html)

## Who this is for

You can already build a basic ggplot, map a column to colour, and add a geom with `+`. You do not need any prior experience with facets, themes or plot composition. By the end you will be able to take a first-draft chart and finish it: readable, honest and ready to publish.

## What you will be able to do

- Break a crowded chart into small multiples with `facet_wrap()` and `facet_grid()`, and choose scales that do not mislead
- Restyle any plot with themes and deliberate, colourblind-safe colour scales
- Annotate a chart with labels and reference lines, and combine several plots into one figure
- Polish a figure to publication quality without ever touching the underlying data

Ready? [Begin with Lesson 1](Facets-and-Scales-in-ggplot2.html).
