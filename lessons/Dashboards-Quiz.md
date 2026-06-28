---
title: "Interactive Dashboards in R: Quiz"
description: "A short, graded check on the Interactive Dashboards in R section."
keywords: "R quiz, data analyst, da-dashboards, practice"
post_type: "LESSON"
curriculum_id: "2.8.4"
webr: true
lesson_access: "free"
course_id: "da-dashboards"
course_title: "Interactive Dashboards in R"
course_lesson: "4"
course_total: "4"
course_landing: "Dashboards-Course.html"
lesson_kind: "quiz"
course_prev: "Your-First-Shiny-App.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the dashboards section: interactive charts and maps, Quarto dashboards, and your first Shiny app. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## Why go interactive
An interactive chart is worth the effort when you want the reader to:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Explore the data themselves, by hovering, zooming, or filtering. ::ok Correct: interactivity hands control to the reader.
- Print it in black and white. ::no That favours a simple static chart.
- See exactly one fixed view. ::no A static image does that more simply.
- Avoid loading any data. ::no Interactive charts still need the data.

=== step === quiz
::eyebrow Question 2 of 8
## What plotly adds
The plotly package mainly adds:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A way to fit models. ::no plotly draws charts, it does not model.
- Hover, zoom, and pan interactivity to a chart. ::ok Correct: it makes charts explorable.
- Faster data reading. ::no It is about display, not import.
- Automatic report writing. ::no That is Quarto, not plotly.

=== step === quiz
::eyebrow Question 3 of 8
## What leaflet is for
The leaflet package is used to build:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Interactive maps with pan and zoom. ::ok Correct: leaflet is the interactive-maps package.
- Static bar charts. ::no Those come from ggplot2.
- Regression tables. ::no That is gtsummary.
- Database queries. ::no That is DBI.

=== step === quiz
::eyebrow Question 4 of 8
## Shiny reactivity
In a Shiny app, when a user changes an input, the outputs that depend on it:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Re-compute automatically. ::ok Correct: that automatic re-run is reactivity.
- Stay frozen until you reload. ::no Reactivity updates them without a reload.
- Are deleted. ::no They refresh, they are not removed.
- Require manual recalculation in code. ::no Shiny tracks the dependency for you.

=== step === quiz
::eyebrow Question 5 of 8
## When you need Shiny
You need users to filter live, changing data in the browser. Static HTML versus Shiny?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Static HTML, because it is simpler. ::no Static cannot re-run server-side logic on new input.
- Shiny, because it re-runs R in response to user input. ::ok Correct: live interaction needs a reactive server.
- Neither can do this. ::no Shiny is built exactly for this.
- A plain ggplot image. ::no An image cannot respond to input.

=== step === quiz
::eyebrow Question 6 of 8
## What a Quarto dashboard is
A Quarto dashboard mainly lets you:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Arrange charts, tables, and values into a shareable layout. ::ok Correct: it composes outputs into a dashboard page.
- Train a machine-learning model. ::no That is unrelated to dashboards.
- Connect to a payment system. ::no Out of scope for a dashboard.
- Replace your database. ::no It presents data, it does not store it.

=== step === concept
::eyebrow Run it: the chart behind a panel
## Summarise to visualise
Run this boxplot of mileage by cylinder count, the kind of panel a dashboard would host.

```r
library(ggplot2)

ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_boxplot()
```

A dashboard wraps charts like this in interactivity; the chart itself is ordinary ggplot2.

=== step === concept
::eyebrow Run it: a dashboard value
## Compute a headline number
Run this to compute the kind of single value a dashboard shows in a tile: average mileage and the fleet size.

```r
library(dplyr)

mtcars %>%
  summarise(avg_mpg = round(mean(mpg), 1), cars = n())
```

Behind every live tile is a small summary like this, recomputed as the data changes.

=== step === complete
## Section complete
Strong work. You can build interactive charts and maps, compose a dashboard, and stand up a reactive Shiny app. Next: communicating and automating your analysis.
