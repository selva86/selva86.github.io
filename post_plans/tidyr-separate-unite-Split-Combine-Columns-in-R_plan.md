# Plan: tidyr separate() & unite() in R

## Frontmatter

| Field | Value |
|---|---|
| title | tidyr separate() & unite() in R: Split & Combine Character Columns |
| slug | tidyr-separate-unite-Split-Combine-Columns-in-R |
| description | Split columns with separate_wider_delim() and combine with unite() in tidyr. Practical R examples showing delimiter, position, and regex-based splits. |
| keywords | tidyr separate, separate_wider_delim, separate_wider_position, separate_wider_regex, tidyr unite, split column R, combine columns R, tidyr |
| auto_link_terms | separate_wider_delim()\|separate_wider_position()\|separate_wider_regex()\|unite()\|split column in R\|combine columns in R\|tidyr separate |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-tidy-1 |
| post_type | FR |
| fr_parent | pivot_longer-pivot_wider-Reshape-Data-in-R.html |

## Breadcrumb
Home > Data Wrangling > tidyr > tidyr separate() and unite()

## Lead sentence
`separate_wider_delim()`, `separate_wider_position()`, and `separate_wider_regex()` split one character column into several using a delimiter, fixed widths, or regex patterns. `unite()` does the opposite: glues several columns into one.

## Outline

1. Intro — hook (messy combined columns in real data), what/why, note that separate() is superseded in tidyr 1.3+
2. How do you split a column on a delimiter? — separate_wider_delim() with dates, names
3. How do you split a fixed-width column? — separate_wider_position() with codes like "m1234"
4. How do you split columns with regex? — separate_wider_regex() for flexible patterns
5. How do you handle rows that do not split cleanly? — too_few, too_many args
6. How do you combine columns with unite()? — sep, na.rm, remove args
7. Common Mistakes — 3 mistakes (using deprecated separate(), forgetting remove, forgetting too_few)
8. Practice Exercises — 3 exercises
9. Summary — comparison table
10. FAQ — 3 Q&A
11. References — 5 sources
12. What's Next — 2 links

## Code Block Master List

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Load tidyr, make messy df | tidyr, dplyr | orders | — |
| 2 | separate_wider_delim basic | — | orders_split | orders |
| 3 | separate_wider_delim dates | — | logs, logs_split | — |
| 4 | separate_wider_position | — | codes, codes_split | — |
| 5 | separate_wider_regex | — | tags, tags_split | — |
| 6 | too_few="align_start" | — | messy, messy_split | — |
| 7 | too_many="merge" | — | addresses, addr_split | — |
| 8 | unite() basic | — | date_parts, date_united | — |
| 9 | unite() with na.rm | — | addr_united | — |
| 10 | exercise 1 starter + solution | — | my_data, my_result | — |
| 11 | exercise 2 starter + solution | — | my_data2, my_result2 | — |
| 12 | exercise 3 starter + solution | — | my_data3, my_result3 | — |

## Callouts planned
- NOTE: separate() superseded in tidyr 1.3+
- TIP: use names=NA to drop a component
- WARNING: too_few defaults to error
- KEY INSIGHT: regex is the escape hatch
