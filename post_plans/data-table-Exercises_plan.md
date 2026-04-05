# data.table Exercises Plan

## Frontmatter
- title: data.table Exercises: 12 High-Performance Data Manipulation Problems — Solved Step-by-Step
- slug: data-table-Exercises
- description: Practise data.table with 12 hands-on high-performance data manipulation problems and worked R solutions. Progressive exercises from beginner to advanced.
- keywords: data.table exercises, data.table practice, R data.table tutorial, data.table DT syntax, data.table by group, data.table join, data.table aggregation, setkey
- auto_link_terms: data.table exercises|data.table practice|data.table problems
- auto_link_case_sensitive: false
- mathjax: false
- webr: true
- date: 2026-04-06
- curriculum_id: E2.7
- post_type: EX
- sidebar_title: data.table (12 problems)
- fr_parent: dplyr-filter-select.html

## Breadcrumb
Home > Data Wrangling > dplyr > data.table Exercises

## Sections
1. Intro — why practise, how progression works, WebR note, parent link
2. Quick Reference — DT[i, j, by] cheat sheet
3. 12 Exercises with starter + <details> solution:
   - 1: Convert data.frame to data.table and filter rows (easy)
   - 2: Select columns and compute a new one (easy)
   - 3: Filter with compound conditions using %chin% (easy)
   - 4: Group-by aggregation with by= (medium)
   - 5: Multi-column aggregation with .SD and .SDcols (medium)
   - 6: Chained DT[][] operations (medium)
   - 7: Update by reference with := (medium)
   - 8: Sort with setorder() and setkey() (medium)
   - 9: Join two data.tables (challenging)
   - 10: Rolling join with roll= (challenging)
   - 11: Reshape with dcast and melt (challenging)
   - 12: Lag/lead and cumulative calculations by group (challenging)
4. Common Mistakes (4): := inside function without copy, forgetting comma in DT[cols], chaining returns NULL, setkey modifies in place
5. Summary table
6. FAQ (4): data.table vs dplyr speed, install data.table, does := mutate, .SD meaning
7. References (6)
8. What's Next (3)

## Code Blocks
- B1: library(data.table); create DT objects from mtcars, iris
- B2-B13: one per exercise solution
- B14+: mistakes + complete example

## Notes
- data.table is WebR-compatible
- Use distinct variable names: my_dt, my_result
