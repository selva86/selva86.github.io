# Plan — dplyr group_by() & summarise() Exercises

## Frontmatter

| Field | Value |
|---|---|
| title | "dplyr group_by() & summarise() Exercises: 10 Aggregation Problems — Solved Step-by-Step" |
| slug | "dplyr-group-by-summarise-Exercises" |
| description | Practise dplyr group_by() & summarise() with 10 aggregation problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced. |
| keywords | dplyr exercises, group_by exercises, summarise exercises, R aggregation practice, dplyr practice problems, tidyverse exercises, R data wrangling exercises, group by summarise R |
| auto_link_terms | dplyr group_by exercises\|dplyr summarise exercises\|group_by practice problems\|summarise practice problems\|dplyr aggregation exercises |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | E2.3 |
| post_type | EX |
| sidebar_title | "group_by & summarise (10 problems)" |
| fr_parent | dplyr-group-by-summarise.html |

## Breadcrumb
Home > Data Wrangling > dplyr > dplyr group_by() & summarise() Exercises

## Outline

- Lead: 10 exercises to master group_by()/summarise(): counts, means, multi-group, across(), NA handling, filtering groups, .groups control.
- Introduction: hook + what problems do, link parent tutorial, shared WebR session note.
- Quick Reference table.
- Setup block: load dplyr, preview mtcars + starwars.
- Easy (1-3): basic count, basic mean, single group with multiple summaries.
- Medium (4-6): multi-column group_by, across() multi-col summary, NA handling with na.rm.
- Hard (7-10): filter within groups, .groups behaviour, custom functions per group, group-share/ranking.
- Common Mistakes (3-5).
- Summary table.
- FAQ (4).
- References (6).
- What's Next (3).

## Exercises

| # | Difficulty | Task |
|---|---|---|
| 1 | Easy | Count cars per cyl in mtcars |
| 2 | Easy | Average mpg per cyl |
| 3 | Easy | count() shortcut on gear |
| 4 | Medium | Group by cyl + am → mean mpg and hp |
| 5 | Medium | across() on numeric cols (mean) grouped by species (iris) |
| 6 | Medium | starwars mean height/mass by species with na.rm |
| 7 | Hard | Filter species with n >= 2 |
| 8 | Hard | Pct share of mpg by gear |
| 9 | Hard | Summaries with .groups = "keep" vs "drop" |
| 10 | Hard | Top-2 heaviest characters per homeworld using slice_max after group_by |

## Common Mistakes
1. Forgetting na.rm=TRUE → NA result
2. Forgetting to ungroup() → surprising behavior in later pipeline
3. Using summarise with mean() across non-numeric columns → error
4. Mis-specifying .groups causing summarise message warnings

## FAQ
- Why does summarise give a `.groups` message?
- Difference between summarise() and mutate() with group_by()?
- Should I use count() or summarise(n=n())?
- Can I group by a computed expression?

## References (6)
1. dplyr summarise() ref
2. dplyr group_by() ref
3. dplyr grouping vignette
4. R4DS ch 5 (transform)
5. Advanced R (Wickham)
6. Tidyverse blog

## What's Next
- dplyr group_by & summarise tutorial (parent)
- dplyr mutate() exercises (if exists) / dplyr filter & select exercises
- dplyr joins tutorial
