---
title: "Advanced ggplot2: Quiz"
description: "A short, graded check on the Advanced ggplot2 section."
keywords: "R quiz, data analyst, da-ggplot2-adv, practice"
post_type: "LESSON"
curriculum_id: "2.5.4"
webr: true
lesson_access: "free"
course_id: "da-ggplot2-adv"
course_title: "Advanced ggplot2"
course_lesson: "4"
course_total: "4"
course_landing: "Advanced-ggplot2-Course.html"
lesson_kind: "quiz"
course_prev: "Annotate-and-Compose-Plots.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished advanced ggplot2: facets and scales, themes and accessibility, annotation and composition. This quiz checks what stuck. The last two steps are live R.

=== step === quiz
::eyebrow Question 1 of 8
## What facets do
`facet_wrap(~ cyl)` adds to a plot:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- One small panel per value of cyl, sharing the same axes. ::ok Correct: facets are small multiples split by a variable.
- A single panel coloured by cyl. ::no That is a colour mapping, not a facet.
- A legend for cyl. ::no Facets make panels, not legends.
- A trend line per group. ::no That would be geom_smooth, not faceting.

=== step === quiz
::eyebrow Question 2 of 8
## Limits versus zoom
`scale_y_continuous(limits = c(0, 30))` differs from `coord_cartesian(ylim = c(0, 30))` because:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Setting scale limits drops data outside the range; coord_cartesian only zooms. ::ok Correct: scales filter, coords just change the view.
- They are identical. ::no One can silently remove data, the other never does.
- coord_cartesian deletes the data. ::no It is the non-destructive option.
- Neither affects what is shown. ::no Both change the view; only one drops data.

=== step === quiz
::eyebrow Question 3 of 8
## Theme presets
`theme_minimal()` versus `theme()`:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `theme()` is a complete look; `theme_minimal()` tweaks one element. ::no It is the other way around.
- `theme_minimal()` is a complete preset; `theme()` tweaks individual elements. ::ok Correct: use a theme_* preset, then fine-tune with theme().
- They are interchangeable. ::no One sets everything, the other adjusts pieces.
- `theme()` can only change colours. ::no It can change almost any non-data element.

=== step === quiz
::eyebrow Question 4 of 8
## Colour for everyone
To make a categorical colour scale readable for colourblind viewers, you should:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Use red and green together. ::no Red and green are the hardest pair for many viewers.
- Use a colourblind-safe palette, such as viridis or Okabe-Ito. ::ok Correct: those palettes stay distinct across colour-vision types.
- Use as many bright colours as possible. ::no More colours hurt, not help, readability.
- Rely on colour alone to label groups. ::no Pair colour with another cue (shape, label) for safety.

=== step === quiz
::eyebrow Question 5 of 8
## Fixed versus data labels
`annotate("text", ...)` differs from `geom_text()` because:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- annotate places one fixed label; geom_text draws a label per data row. ::ok Correct: annotate is a one-off, geom_text is data-driven.
- They are identical. ::no One is mapped from data, the other is not.
- geom_text can only label the first row. ::no It labels every row by default.
- annotate needs a data frame. ::no It takes fixed values, no data frame.

=== step === quiz
::eyebrow Question 6 of 8
## Composing plots
With the patchwork package, `p1 + p2` will:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Place the two finished plots side by side in one figure. ::ok Correct: patchwork composes whole plots with simple operators.
- Overlay p2 on top of p1. ::no That would be adding layers to one plot, not patchwork.
- Add the data of p2 to p1. ::no Patchwork arranges plots, it does not merge data.
- Error, because plots cannot be added. ::no patchwork defines + for exactly this.

=== step === concept
::eyebrow Run it: small multiples
## Faceting by a variable
Run this to split the scatter into one panel per cylinder count.

```r
library(ggplot2)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  facet_wrap(~ cyl)
```

Faceting reveals whether the weight-mileage pattern holds within each group.

=== step === concept
::eyebrow Run it: apply a theme
## Restyling with a preset
Run this with a clean preset theme, then swap `theme_minimal()` for `theme_classic()` and compare.

```r
library(ggplot2)

ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  theme_minimal()
```

A theme preset restyles every non-data element at once; theme() would fine-tune from there.

=== step === complete
## Section complete
Strong work. You can split, scale, theme, annotate, and compose figures to a publishable standard. Next: data.table and bigger-than-memory data.
