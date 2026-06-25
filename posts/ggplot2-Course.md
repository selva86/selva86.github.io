---
title: "Data Visualization with ggplot2: A Hands-On Interactive Course"
slug: "ggplot2-Course"
description: "Learn ggplot2 from the ground up in four interactive lessons: the grammar of graphics, scatter and line charts, bars and distributions, and publication figures."
keywords: "ggplot2 course, data visualization R, grammar of graphics, geom_point, geom_col, ggplot2 tutorial, aesthetic mapping, interactive"
mathjax: false
webr: false
date: "2026-06-26"
curriculum_id: "2.4.0"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "ggplot2 (Course)"
sidebar_order: "1"
---

# Data Visualization with ggplot2: A Hands-On Interactive Course

<p class="lead">A good chart turns a column of numbers into a story you can see at a glance. This four-lesson interactive course teaches data visualization in R with ggplot2 from scratch, building every plot the same way the grammar of graphics does: one layer at a time.</p>

Most ggplot2 tutorials start at "copy this code." This course starts one level deeper, with the small set of rules that builds every chart, so that by the end you are not memorising recipes but writing ggplot like a sentence, swapping one word to get a different picture.

Each lesson is a guided, interactive experience: you build live charts in the browser, answer checkpoints, and write R as you go.

## The four lessons

### Lesson 1: The grammar of graphics

The idea behind ggplot2: a plot is **data**, mapped through **aesthetics** (`aes()`), drawn by **geoms**, and stacked as **layers** with `+`. Build the same chart up one layer at a time and learn to read ggplot code as a grammar.

[Start Lesson 1: The grammar of graphics](The-Grammar-of-Graphics.html)

### Lesson 2: Scatter and line charts

The two workhorse geoms for relationships and change over time: `geom_point()` and `geom_line()`, when to reach for each, mapping a third variable to colour or size, and adding a trend line to summarise the pattern.

[Start Lesson 2: Scatter and line charts](Scatter-and-Line-Charts-in-ggplot2.html)

### Lesson 3: Bar and distribution charts

Charts for counts and amounts with `geom_col()` and `geom_bar()`, and charts for the shape of a single variable with histograms and boxplots. Which chart answers which question, and how to avoid the common bar-chart traps.

[Start Lesson 3: Bar and distribution charts](Bar-and-Distribution-Charts-in-ggplot2.html)

### Lesson 4: A gallery and publication figures

A short tour of common chart types and how to choose between them, then the polish that takes a plot from "works" to "publish": clear labels and titles, a deliberate theme, and a figure ready to drop into a report.

[Start Lesson 4: Gallery and publication figures](A-ggplot2-Gallery-and-Publication-Figures.html)

## Who this is for

You can run R and load a package with `library()`. You do not need any prior plotting or ggplot2 experience. By the end you will be able to look at a data frame, decide what chart it needs, and build that chart layer by layer.

## What you will be able to do

- Name the three core parts of every ggplot (data, aesthetic mappings, geoms) and stack them with `+`
- Build scatter and line charts, and encode a third variable with colour or size
- Choose between bar, histogram and boxplot, and read what each one says about your data
- Polish a figure to publication quality with labels, titles and a theme

Ready? [Begin with Lesson 1](The-Grammar-of-Graphics.html).
