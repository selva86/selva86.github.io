# Plan: ggplot2 Themes in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | ggplot2 Themes: From theme_classic to Your Own Custom House Style |
| slug | ggplot2-Themes-in-R |
| description | Themes control fonts, grid lines, backgrounds, and legend position in ggplot2. Master built-in themes, tweak every element, and build a reusable custom theme. |
| keywords | ggplot2 themes, theme_minimal, theme_classic, theme_bw, custom ggplot2 theme, theme() function R, element_text, element_rect, element_line, ggplot2 theme customization |
| auto_link_terms | ggplot2 themes\|ggplot2 theme\|theme_minimal\|theme_classic\|custom ggplot2 theme\|theme() in ggplot2\|ggplot2 theme customization |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.3.10 |
| post_type | C |
| sidebar_section | Visualization |
| sidebar_title | ggplot2 Themes |
| sidebar_order | 6 |

## B. Breadcrumb

Home > Visualization > ggplot2 Foundations > ggplot2 Themes: From theme_classic to Your Own Custom House Style

## C. Full Section Outline

### Lead sentence
Themes control every non-data element of a ggplot2 chart — fonts, grid lines, backgrounds, and legend position — letting you go from the grey default to a polished, publication-ready style in one line of code.

### Introduction (## Introduction)
- Hook: Every ggplot2 user adds `+ theme_minimal()` at some point and the plot instantly looks cleaner — but most stop there.
- What: Themes are the styling layer. They control everything you see that is NOT data: axis labels, grid lines, backgrounds, legend placement, title fonts.
- Why: Consistent, professional-looking plots. Reusable corporate/brand themes. Save hours of repetitive formatting.
- What you'll learn: All 8 built-in themes, the 4 element functions, the inheritance system, and how to build your own reusable theme function.
- Diagram: Figure 1 (overview mindmap) placed here.

### Core H2 Sections

#### H2-1: What are the built-in ggplot2 themes? (question-form)
- Theory: ggplot2 ships 8 complete themes. Each one is a pre-set collection of theme() settings.
- Code block 1: Create a base plot with mtcars (mpg vs wt, color=cyl), show with default theme_grey()
- Code block 2: Apply each of the 8 themes side by side using patchwork or sequentially
- Callout: TIP — theme_minimal() is the most popular starting point for customization
- Inline exercise: Change theme_grey() to theme_classic() on the base plot

#### H2-2: How does theme() modify individual plot elements? (question-form)
- Theory: theme() takes named arguments. Each argument targets one visual element. Values come from element_*() functions.
- Diagram: Figure 2 (element types flow) placed here
- Code block 3: Modify plot.title with element_text(size=16, face="bold", colour="navy")
- Code block 4: Remove grid lines with panel.grid = element_blank()
- Callout: KEY INSIGHT — Every theme argument maps to one of 4 element functions
- Inline exercise: Change the axis title font size to 14pt

#### H2-3: What are the four element functions? (question-form)
- Theory: element_text(), element_line(), element_rect(), element_blank() — each controls a different visual type
- Code block 5: Demonstrate element_text() with family, face, size, colour, angle, hjust
- Code block 6: Demonstrate element_line() with colour, linewidth, linetype
- Code block 7: Demonstrate element_rect() with fill, colour, linewidth
- Callout: WARNING — element_blank() removes the element AND its space; use NA fill to keep the space
- Inline exercise: Use element_rect() to give plot.background a light yellow fill

#### H2-4: How does theme inheritance work? (question-form)
- Theory: Theme elements form a hierarchy. Setting `text` affects all text elements unless overridden. axis.title inherits from text, axis.title.x inherits from axis.title.
- Diagram: Figure 3 (inheritance hierarchy) placed here
- Code block 8: Set all text to a custom font/size, then override just axis.title.x
- Callout: KEY INSIGHT — Inheritance means you set global defaults at the top and override specifics
- Inline exercise: Set all text to size 12, then override plot.title to size 18

#### H2-5: How do you control legend position and appearance? (question-form)
- Theory: legend.position ("top", "bottom", "left", "right", "none", or c(x,y)), legend.title, legend.text, legend.background, legend.key
- Code block 9: Move legend to bottom, remove legend background, change key size
- Code block 10: Place legend inside the plot area with legend.position = c(0.8, 0.8)
- Callout: TIP — legend.position = "none" is faster than guides(colour = "none") when you want to remove all legends
- Inline exercise: Move the legend to the top of the plot

#### H2-6: How do you build a reusable custom theme function? (question-form)
- Theory: Wrap your theme() tweaks in a function. Start from an existing complete theme, add overrides. Accept arguments for flexibility.
- Code block 11: Create theme_corporate() function starting from theme_minimal() + custom overrides
- Code block 12: Apply theme_corporate() to a plot, show the clean result
- Code block 13: Use theme_set(theme_corporate()) to apply globally
- Callout: TIP — Use %+replace% instead of + when you want to completely replace an element, not merge
- Inline exercise: Add a `base_size` argument to the custom theme function

### Tail Sections

#### Common Mistakes (3-5)
1. Putting theme() before the complete theme — theme_minimal() + theme() works, theme() + theme_minimal() does NOT
2. Using element_blank() when you want transparent — use fill = NA or colour = NA instead
3. Forgetting that theme() is cumulative — later theme() calls override earlier ones
4. Setting legend.position = c(x,y) but forgetting legend.justification

#### Practice Exercises (2-3 capstone)
1. Medium: Create a scatter plot of mtcars, apply theme_bw(), then customize title, subtitle, axis labels, and move legend to bottom
2. Hard: Build a complete theme_dashboard() function that starts from theme_light(), sets custom fonts, removes minor grid lines, and places legend at bottom. Apply it to two different plots.
3. Hard: Recreate a specific "target" plot style from scratch using only theme() on top of theme_void()

#### Complete Example
End-to-end: Load data, create a polished publication-quality plot using a custom theme function with multiple element tweaks

#### Summary
Table of key theme() arguments grouped by area (title, axes, legend, panel, facets)

#### FAQ (5)
1. What is the difference between theme_grey() and theme_gray()?
2. Can I combine multiple themes?
3. How do I save my custom theme for use across projects?
4. How do I change the font family in ggplot2?
5. What is the difference between theme() and theme_update()?

#### References (8)
1. Wickham, H. — ggplot2: Elegant Graphics for Data Analysis, 3e. Ch.17: Themes.
2. ggplot2 reference — theme() documentation
3. ggplot2 reference — Complete themes (ggtheme)
4. ggplot2 reference — Theme elements
5. R for the Rest of Us — Create your own custom ggplot2 theme (2025)
6. Jumping Rivers — Getting started with theme()
7. Mock, T. — Creating and using custom ggplot2 themes (2020)
8. Peng, R. — Mastering Software Development in R, Building a New Theme

#### What's Next
1. ggplot2 Tutorial 1 - Intro — covers the foundations of ggplot2 layers and aesthetics
2. ggplot2 Quickref — a cheatsheet for common ggplot2 operations

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | ggplot2-Themes-in-R-overview-mindmap.webp | Figure 1 | The four pillars of the ggplot2 theme system. | Introduction |
| 2 | ggplot2-Themes-in-R-element-types.webp | Figure 2 | Each element function controls a different visual type. | How does theme() modify individual plot elements? |
| 3 | ggplot2-Themes-in-R-inheritance.webp | Figure 3 | Theme elements inherit from parent elements — set once at the top, override where needed. | How does theme inheritance work? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Base plot with mtcars | ggplot2 | p_base | — |
| 2 | 8 built-in themes applied | — | — | p_base |
| 3 | Modify plot.title with element_text | — | — | p_base |
| 4 | Remove grid with element_blank | — | — | p_base |
| 5 | element_text() full demo | — | — | p_base |
| 6 | element_line() demo | — | — | p_base |
| 7 | element_rect() demo | — | — | p_base |
| 8 | Inheritance: set text, override axis.title.x | — | — | p_base |
| 9 | Legend bottom, remove background | — | — | p_base |
| 10 | Legend inside plot | — | — | p_base |
| 11 | theme_corporate() function | — | theme_corporate | p_base |
| 12 | Apply theme_corporate() | — | — | p_base, theme_corporate |
| 13 | theme_set() global apply | — | — | theme_corporate |
