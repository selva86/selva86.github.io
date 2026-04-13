# Plan: R hist() Error: 'breaks are not unique' — Why Your Data Has No Spread

## Frontmatter

| Field | Value |
|---|---|
| title | R hist() Error: 'breaks are not unique' — Why Your Data Has No Spread |
| slug | R-Error-Breaks-Not-Unique |
| description | Fix R's 'breaks are not unique' error in hist(). Caused by constant or low-variance data — learn to detect it and use jitter, fewer breaks, or barplot(). |
| keywords | R breaks are not unique, R hist error, R histogram error, breaks not unique fix, R hist constant data, R hist bin width, R histogram low variance |
| auto_link_terms | breaks are not unique\|hist breaks error\|R histogram error\|breaks not unique |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-13 |
| curriculum_id | ERR16 |
| post_type | FR |
| fr_parent | R-Common-Errors.html |

Breadcrumb (auto-generated): Home > Learn R > Errors > R hist() Error: 'breaks are not unique'

## Lead sentence

The error `some 'breaks' are not unique` means `hist()` built a list of bin edges that contain duplicates — almost always because your data has zero or near-zero spread, so the bin boundaries collapse onto the same value.

## First H2 opening plan (≤80 words, motivates payoff code)

You can reproduce this error in two lines: make a vector where every value is identical, hand it to `hist()`, and R bails out. The payoff block below captures the exact message with `tryCatch()` so you can see what your console saw. Once you recognize the pattern — no spread means no unique bin edges — the fixes in the next sections become obvious.

## Core sections

### H2-1 (payoff): Why does R throw "breaks are not unique"?
- Theory: `hist()` picks bin edges from `range(x)` and the chosen breaks algorithm (Sturges by default). If `diff(range(x)) == 0`, every computed edge collapses to the same number and R refuses to draw overlapping bars.
- Code block 1 (PAYOFF): Build `flat_data <- rep(5, 100)`, wrap `hist(flat_data)` in `tryCatch()`, print the captured error message. This shows the exact error text the reader is looking for.
- Callout: [KEY INSIGHT] — the error is a *symptom* of data with no spread, not a plotting bug.
- Inline exercise: reproduce the error with a vector of all zeros.

### H2-2: How do you detect low-variance columns before calling hist()?
- Theory: Cheap pre-checks — `var(x)`, `length(unique(x))`, `diff(range(x))`. Walking a data frame with `sapply()` surfaces every column that will trip `hist()` later.
- Code block 2: build a small data frame with one constant column and one normal column; `sapply` variance and unique-count per column; flag columns where `var == 0`.
- Callout: [TIP] — in production pipelines, guard every call to `hist()` with `if (length(unique(x)) > 1)`.
- Inline exercise: add a third column with tiny noise (sd = 1e-9) and check whether the guard still flags it.

### H2-3: How do you fix constant or near-constant data?
- Theory: Three practical paths — (a) if the data is truly constant, `barplot()` is the honest chart, (b) if it has tiny noise, `jitter()` or manual `seq()` breaks add artificial spread, (c) if you just want the distribution, `density()` works on any vector with >1 unique value.
- Code block 3: show `barplot(table(flat_data))` for truly constant data, then `hist(jitter(flat_data, amount = 0.5))` for a slightly jittered version, then a `seq()`-based manual breaks example.
- Callout: [WARNING] — `jitter()` invents spread that isn't in the data. Only use it for visualization, never for analysis.
- Inline exercise: use `hist()` with manual `breaks = seq(4.5, 5.5, by = 0.25)` on the constant vector.

### H2-4: How do you fix duplicate manual or quantile breaks?
- Theory: Even with spread, you can hand `hist()` a bad break vector. Two common failure modes: (1) you hardcoded a vector with repeats, (2) you generated breaks from `quantile()` on tied data and the quantile function returned the same value twice. Both are fixed by `sort(unique(...))`, but for tied data that's a hint the data is discrete and a barplot is better.
- Code block 4: reproduce with `quantile(x, probs = seq(0, 1, 0.1))` on a discrete vector; show the duplicated quantiles; rescue with `unique()`; then show `barplot(table(x))` as the cleaner answer.
- Callout: [NOTE] — `hist()` errors on duplicated breaks, but `cut()` errors with the *same* message. The fix is identical.
- Inline exercise: given `x <- c(rep(1, 50), rep(2, 50))`, fix the quantile-breaks pipeline.

## Tail sections

### Practice Exercises (capstone, 2 exercises)
1. **Exercise 1 (medium):** Write `my_safe_hist(x)` that returns invisibly after printing a diagnostic if `length(unique(x)) < 2`, and otherwise calls `hist(x)` normally. Test on `rep(7, 50)` and `rnorm(200)`.
2. **Exercise 2 (hard):** Given a data frame with 4 numeric columns (one constant, one near-constant, two normal), loop over columns and plot a histogram of each — skipping the constant one, jittering the near-constant one, and plotting the normal ones directly. Save the decisions to `my_plot_log`.

### Complete Example
End-to-end: load a data frame that mixes a constant column, a near-constant column, and a normal column. Write a short wrapper that inspects each column, picks the right chart type, and plots it. Print a one-line summary of the decision per column.

### Summary (table)

| Symptom | Root cause | Fix |
|---|---|---|
| All values identical | Zero range → duplicate edges | `barplot(table(x))` |
| Near-constant data | `sd` ~ 0, many requested breaks | Reduce breaks or `jitter()` |
| Manual `breaks = c(...)` with repeats | Typo in break vector | `sort(unique(breaks))` |
| `quantile()`-derived breaks on tied data | Tied values collapse quantiles | `unique(quantile(...))` or `barplot(table(x))` |
| Discrete integer data, narrow range | Too few unique values | `seq(min-0.5, max+0.5, by = 1)` or `barplot` |

### References
1. R Core — `hist()` documentation (`?hist`), stats package reference.
2. Venables & Ripley — *Modern Applied Statistics with S*, Chapter 5 (Graphics).
3. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis* — chapter on histograms and bins.
4. R source code for `hist.default` on R-project.org (shows where the error is raised).
5. R-bloggers — "Choosing the number of bins for a histogram" (methodology review).

### Continue Learning
1. R Common Errors — the parent reference for all `Error in ...` messages.
2. R Histograms Tutorial — building histograms correctly with base R and ggplot2.
3. R Error: singular matrix in solve() — another "your data is degenerate" error.

## Diagrams

FR post — diagrams optional. Skipping diagrams (none of the standard diagram types would teach more than the code blocks already do, and the error is best explained by the reproduction code itself).

## Code block master list

| Block | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 (payoff) | Reproduce the error via tryCatch | — | flat_data, err | — |
| 1-try | Inline exercise 1: trigger with zeros | — | ex_zero | — |
| 2 | Detect zero-variance columns | — | df, col_stats | — |
| 2-try | Inline exercise 2: tiny-noise column | — | ex_tiny | df |
| 3 | Three fixes: barplot, jitter, manual breaks | — | (uses flat_data) | flat_data |
| 3-try | Inline exercise 3: manual seq() breaks | — | ex_breaks | flat_data |
| 4 | Quantile breaks on tied data | — | tied, q_breaks | — |
| 4-try | Inline exercise 4: fix two-value quantile | — | ex_tied | — |
| capstone-1 | my_safe_hist wrapper | — | my_safe_hist | — |
| capstone-2 | Column-wise dispatch | — | my_df, my_plot_log | — |
| complete | End-to-end wrapper | — | demo_df, chart_for | — |

All libraries: none beyond base R. Safe in WebR.
