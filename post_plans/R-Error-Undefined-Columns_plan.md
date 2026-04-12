# Plan: R-Error-Undefined-Columns

## Frontmatter

| Field | Value |
|---|---|
| title | R Error: 'undefined columns selected' — 3 Column-Subsetting Mistakes Fixed |
| slug | R-Error-Undefined-Columns |
| description | Fix R's 'undefined columns selected' error fast. Learn the 3 mistakes that trigger it — missing comma, column name typos, stale vectors — and the fix for each. |
| keywords | R undefined columns selected, R column subsetting error, R data frame subsetting, R missing comma error, R column name typo, R subsetting errors, safe_select R |
| auto_link_terms | undefined columns selected\|R undefined columns\|undefined columns error\|undefined columns selected in R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR3 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

## Section outline

**Lead sentence (featured snippet):** `Error in [.data.frame(df, , cols) : undefined columns selected` means R looked for a column name you requested inside a data frame and could not find it — or the subsetting call confused a row condition with a column vector. Three small mistakes cause almost every occurrence, and each has a fast fix.

**First H2 opening (≤80 words):** The error fires whenever `[` is asked to select a column that is not in `names(df)`, or when `[` receives only one argument and tries to read it as a column index. R reads every bracket call as `df[rows, cols]`; the moment `cols` resolves to a name or position that does not exist, R stops rather than guess. The fastest way to internalise this is to trigger the error and watch the fix land.

### Core H2 sections (5)

1. **What does 'undefined columns selected' actually mean?** — entry point, payoff code block: trigger the error via missing comma, then fix it. KEY INSIGHT callout on the rows/cols mental model. Inline Try it: reproduce-then-fix on a mtcars slice.

2. **Mistake #1: Why does a missing comma crash single-bracket subsetting?** — deeper dive, show that `df[cond]` is interpreted as column selection (a logical vector of wrong length). Interpret the error. WARNING callout about filter() as a safer alternative. Inline Try it: fix a missing-comma call.

3. **Mistake #2: How do column name typos and case mismatches trigger it?** — case sensitivity, whitespace from CSV imports (`check.names = FALSE` scenario). Show `names(df)` and `trimws()` diagnosis. TIP callout on janitor::clean_names(). Inline Try it: repair a case mismatch.

4. **Mistake #3: Why do stale column vectors break programmatic subsetting?** — character vectors built earlier in pipelines drift out of sync with the current data (dropped column, typo, user input). Show `setdiff(cols, names(df))` as the one-line diagnostic. NOTE callout about dplyr's any_of()/all_of() variants. Inline Try it: diagnose stale vector.

5. **How do you find the missing column in ten seconds?** — a decision-flow diagnosis recipe using the diagram; wrap the workflow in a reusable `safe_select()` helper. KEY INSIGHT callout on failing loudly. Diagram: diagnosis flowchart. Inline Try it: write the missing-column validator.

### Tail sections

6. **Practice Exercises** (2 capstone):
   - Exercise 1 (medium): Given a function that silently breaks on a column rename, add a pre-flight check so it throws a clear error naming the missing column.
   - Exercise 2 (hard): Write a function `diagnose_undef(df, expr)` that runs a subsetting expression, catches the error, and prints which of the three mistakes caused it with a suggested fix line.

7. **Complete Example: Debug a real CSV pipeline** — end-to-end: read messy CSV (simulated), whitespace in headers, user passes a selection vector with a typo, diagnose with `setdiff()`, fix with `trimws()`, and wrap in `safe_select()`.

8. **Summary** — 4-row mistake → symptom → fix table.

9. **References** — R Documentation on `[.data.frame`, Advanced R subsetting chapter, tidyselect any_of/all_of docs, Statistics Globe article, ProgrammingR article.

10. **Continue Learning** — ERR0 (R-Common-Errors), R-Subsetting, R-Error-Object-Not-Found.

## Diagrams

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | R-Error-Undefined-Columns-diagnosis-flow.webp | Figure 1 | Decision flow to diagnose which of the three mistakes caused the error. | How do you find the missing column in ten seconds? |

## Code block master list

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Trigger error via missing comma; show the fix | — | mt | — |
| 2 | Exercise reveal: reproduce-then-fix missing comma | — | ex1_mt, ex1_err, ex1_ok | — |
| 3 | Mistake 1 deep dive: show R parses df[cond] as col vector | — | cars_small, err1 | — |
| 4 | Exercise reveal: fix a missing comma | — | ex2_df, ex2_fix | — |
| 5 | Mistake 2: case, whitespace, check column names | — | dirty, names_dirty | mt |
| 6 | Exercise reveal: case-mismatch fix | — | ex3_df, ex3_val | — |
| 7 | Mistake 3: stale programmatic vector + setdiff() diagnosis | — | wanted, missing_cols | — |
| 8 | Exercise reveal: diagnose stale vector | — | ex4_cols, ex4_miss | — |
| 9 | safe_select() helper + diagnosis recipe | — | safe_select | — |
| 10 | Exercise reveal: write validator | — | ex5_check | — |
| 11 | Practice Exercise 1 reveal | — | summary_cols, safe_summary | — |
| 12 | Practice Exercise 2 reveal | — | diagnose_undef | safe_select |
| 13 | Complete Example: messy CSV pipeline end-to-end | — | raw_csv, messy, user_cols, clean, result | safe_select |

All code blocks are base R; no external libraries needed (WebR-safe throughout).
