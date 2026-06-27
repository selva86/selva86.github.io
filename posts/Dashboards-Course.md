---
title: "Interactive Dashboards in R: A Hands-On Course"
slug: "Dashboards-Course"
description: "Build interactive dashboards in R across three lessons: explorable plotly charts and leaflet maps, linked Quarto dashboards with crosstalk, and your first Shiny app."
keywords: "interactive dashboards in R, plotly, leaflet, quarto dashboard, crosstalk, shiny, ggplotly, interactive charts R, R dashboard course, interactive"
mathjax: false
webr: false
date: "2026-06-27"
curriculum_id: "2.8.0"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Interactive Dashboards (Course)"
sidebar_order: "3"
---

# Interactive Dashboards in R: A Hands-On Interactive Course

<p class="lead">A printed chart shows a shape and then stops answering questions. This three-lesson interactive course turns your R output into something people can explore: charts you can hover and zoom, maps you can pan, views that update each other, and a small live app of your own.</p>

You already know how to make a chart. This course is about the next step: making that chart respond. Across three guided lessons you move from a single interactive plot to a fully linked dashboard, and finally to your first reactive Shiny app, where a control on the screen drives the output in real time.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints as you go, and see each idea work on real data before you build it yourself.

## The three lessons

### Lesson 1: Charts and maps you can explore

Turn an ordinary ggplot into an interactive **plotly** chart with one line, `ggplotly()`, so readers can hover for exact values and drag to zoom. Then put your data on a **leaflet** map: a real street basemap with a marker and a popup for every row. You also learn the judgment call that matters most, when interactivity genuinely helps a reader and when a clean static chart is the better choice.

[Start Lesson 1: Charts and maps you can explore](Interactive-Charts-and-Maps-in-R.html)

### Lesson 2: Quarto dashboards and linked views

Lay out a real dashboard in **Quarto**: value boxes for the headline numbers and chart tiles arranged on a grid. Then wire the pieces together with **crosstalk** so a selection in one view filters every other view at once, the moment that makes a dashboard feel like a single instrument rather than a page of separate charts.

Lesson 2 is coming soon.

### Lesson 3: Your first Shiny app

Build reactivity from scratch. Start with the smallest possible **Shiny** app, one input driving one output, and watch how the reactive graph re-runs only what it needs when the input changes. This is the mental model every larger Shiny app is built on.

Lesson 3 is coming soon.

## Who this is for

You can already build a basic chart in R, in base graphics or ggplot2, and you want your output to do more than sit still on a page. You do not need any prior plotly, leaflet, Quarto or Shiny experience. By the end you will know how to make a chart explorable, link several views into one dashboard, and stand up a live app that responds to its user.

## What you will be able to do

- Make a chart interactive with `ggplotly()` so readers can hover for values and zoom in
- Put data on a leaflet map with markers and popups, and pick the right basemap
- Decide when interactivity helps a reader and when a static chart is clearer
- Lay out a Quarto dashboard and link views together with crosstalk
- Build a first Shiny app and explain how its reactive graph re-runs

Ready? [Begin with Lesson 1](Interactive-Charts-and-Maps-in-R.html).
