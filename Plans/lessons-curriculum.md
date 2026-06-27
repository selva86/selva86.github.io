# Lessons Curriculum (course arcs SSOT)

The hand-curated list of interactive courses + their lesson arcs. `/write-lesson` Pass 0 reads a course's arc HERE: which lessons, each lesson's focus + the signature widget(s) it should use, its `curriculum_id`, and access. This complements the roadmap (`www/roadmap-curriculum.js`, RM2): RM2 lists lesson TITLES per track section; this file holds the interactive-COURSE arcs (slug + focus + widget) that RM2 does not. A "complex lesson" can be a 1-lesson course. Widgets are SELECTED from `_build/lesson-visual-catalog.md`; a needed-but-absent widget is hand-built first (never faked).

Format per course:
`## <course_id>  (track, curriculum_id, landing, access)` then a numbered lesson list, each: `<slug> - <focus> - widgets: <ids>`.

---

## random-forest  (track: scientist; curriculum_id 6.3; landing Random-Forest-Course.html; access: free)
1. RF-Course-Lesson-1 - Decision trees from scratch: a tree as a flowchart, Gini splits, growing one in R, watching a deep tree overfit, and why one tree is unstable. widgets: tree-diagram, gini-split, decision-region, forest-averaging
2. RF-Course-Lesson-2 - From one tree to a forest: averaging crushes variance, bootstrap makes trees differ, random features decorrelate them. widgets: forest-averaging, bootstrap-sample, decorrelation, process-flow
3. RF-Course-Lesson-3 - Train, tune and read a forest in R: OOB error, tuning mtry + trees, variable importance, limits. widgets: oob-tuner, bootstrap-sample, importance-bars

## t-test  (track: scientist; curriculum_id 4.2.1; landing T-Test-Course.html; access: free)
1. The-t-test-from-scratch - ONE complex lesson teaching hypothesis testing from scratch via the t-test. Arc within the lesson: (a) the question - is a difference real or noise; (b) the sampling distribution of the mean under H0; (c) the t-statistic as a signal-to-noise ratio (define every symbol in MathJax); (d) the p-value as a tail area under H0 (the signature interactive); (e) one-sample vs two-sample (Welch); (f) effect size + sample size + power, and why a small p is not a big effect; (g) doing it in R with t.test(); (h) misuses (p-hacking, multiple comparisons, assuming normality). widgets: null-distribution (signature: drag the observed t, watch the p-value tail), plus a means/sampling illustration. Outcome: the learner computes and correctly READS a p-value and knows when the test (mis)applies.

## llm-agents  (track: scientist; curriculum_id 6.6.1; landing LLM-Agents-Course.html; access: free)
1. LLM-Agents-in-R - ONE complex lesson on what an LLM agent is, from scratch, grounded in R (ellmer). Arc within the lesson: (a) plain LLM vs an agent that can act; (b) tools - giving the model functions to call; (c) the ReAct loop: Thought -> Action -> Observation, repeating until it can Answer (the signature interactive, stepped through a worked trace); (d) when to stop + guard rails (max steps, validation); (e) building one in R with ellmer (register a tool, run the loop); (f) failure modes (hallucinated tool calls, loops, prompt injection) and how to defend. widgets: agent-loop (signature: step the ReAct trace), process-flow (the build recipe). Outcome: the learner can trace an agent's reasoning loop and wire tools + guard rails responsibly. Never name the in-browser R runtime; say "interactive R".

---

# Data Analyst track (level 2, all free)

Nine courses, one per roadmap section of the Data Analyst track. All free (the analyst track is part of the free common base). Each course's `section` in `Scripts/build_lessons_tracker.py` COURSE_ROADMAP must match the roadmap section number so the breadcrumb + reverse-link line up. Ground every lesson in ONE concrete, named dataset (a small tibble of real-feeling rows) carried through the lesson; teach from scratch; <=12 steps each.

## da-dplyr  (track: analyst; curriculum_id 2.1; landing Data-Wrangling-dplyr-Course.html; access: free)
1. Importing-and-Tidy-Data-in-R - Read a real CSV with readr (column types, the usual import snags), then the three rules of tidy data (one variable per column, one observation per row, one value per cell) and why tidy shape makes everything downstream easier. Show one small messy table becoming tidy. widgets: process-flow, reshape-grid
2. The-dplyr-Verbs - The core verbs on ONE running data frame: filter (keep rows), select (keep columns), mutate/transmute (derive columns), arrange/distinct/count (order, dedupe, tally), and the pipe chaining them into a readable sentence. widgets: table-transform
3. Group-Summarise-and-Clean-in-dplyr - Split-apply-combine with group_by + summarise (counts, means, several summaries at once), deriving categories with case_when, and handling missing values honestly (drop vs impute, na.rm). widgets: table-transform
4. Missing-Value-Treatment - Where NAs come from and how to treat them honestly: find missingness (is.na, per-column counts, simple patterns), the three kinds in plain language (MCAR / MAR / MNAR), and the trade-offs of dropping rows, dropping columns, or imputing (mean / median / mode, last-value-carried-forward), and how each choice can bias the result. widgets: table-transform, chart-plotter

## da-joins  (track: analyst; curriculum_id 2.2; landing Join-Reshape-Course.html; access: free)
1. Joining-Tables-in-R - Combine two keyed tables: the mutating joins (inner, left, right, full) and what happens to unmatched rows; the filtering joins (semi, anti); and when you need non-equi / rolling joins with join_by. widgets: join-diagram
2. Pivoting-Long-and-Wide-in-R - Reshape with pivot_longer / pivot_wider (why long/tidy is what ggplot and models want), and rectangle nested data with nest / unnest. widgets: reshape-grid, table-transform
3. Splitting-Uniting-and-Fuzzy-Joins - Clean columns by splitting and uniting (separate / unite), and join keys that do not match exactly with fuzzy matching. widgets: table-transform, join-diagram
4. Nest-Unnest-and-Rectangling - Treat a column as a column of tables: nest() to pack each group into a list-column, map a summary or model over each, then unnest() back to a flat frame; and rectangle awkward nested / JSON-like data into tidy rows. widgets: reshape-grid, table-transform

## da-eda  (track: analyst; curriculum_id 2.3; landing EDA-Course.html; access: free)
1. An-EDA-Framework-and-One-Variable - A repeatable 7-step EDA framework, then univariate analysis: distribution shape, center and spread, histogram and boxplot for one variable at a time. widgets: process-flow, chart-plotter
2. Two-Variables-and-Correlation-in-R - Bivariate EDA: scatterplots for two numerics, reading the relationship, and correlation (Pearson r, the correlation matrix, why correlation is not causation). widgets: chart-plotter, correlation-heatmap
3. Outliers-and-Automated-EDA - Spot outliers (the IQR rule, boxplots) and decide what to do about them, then speed up the first pass with automated EDA (skimr, DataExplorer). widgets: chart-plotter, styled-table
4. Outlier-Detection-in-R - Go past eyeballing: the IQR / boxplot rule, z-scores and the robust modified z-score (MAD), a quick look at multivariate outliers, and the decision that follows - keep, cap (winsorize), or drop, and how each changes the summary. widgets: chart-plotter, table-transform
5. Categorical-and-Frequency-EDA - Explore categories properly: frequency and proportion tables, two-way cross-tabs, bar and stacked / proportion views, and spotting rare, missing or mislabeled levels before they break a model. widgets: chart-plotter, styled-table
6. Distribution-Shape-and-Transformations - Read distribution shape (skew, heavy tails, multiple peaks), check normality with a Q-Q plot, and tame skew with log / square-root / Box-Cox transformations so later methods behave. widgets: chart-plotter, process-flow
7. Multivariate-EDA-with-Pairs-and-PCA - Look at many variables at once: the pairs / scatterplot matrix and correlation heatmap (GGally), then compress correlated columns into a few components with PCA (prcomp) and read a scree plot and biplot. widgets: correlation-heatmap, chart-plotter
8. Data-Quality-and-Validation - A pre-analysis quality pass: check types, ranges, uniqueness and key integrity, find duplicates and impossible values, and codify the checks as reusable rules so they run on every refresh. widgets: styled-table, process-flow

## da-ggplot  (track: analyst; curriculum_id 2.4; landing ggplot2-Course.html; access: free)
1. The-Grammar-of-Graphics - The idea behind ggplot2: data -> aesthetic mappings -> geoms -> layers. Build the same plot up one layer at a time and read the code as a grammar. widgets: chart-plotter
2. Scatter-and-Line-Charts-in-ggplot2 - geom_point and geom_line: when to use each, mapping a third variable to color/size, adding a trend line. widgets: chart-plotter
3. Bar-and-Distribution-Charts-in-ggplot2 - geom_col/geom_bar for counts and amounts, and histograms/boxplots for distributions; what each chart answers. widgets: chart-plotter
4. A-ggplot2-Gallery-and-Publication-Figures - A short tour of common chart types and how to choose, then polishing one figure to publication quality (labels, titles, theme). widgets: chart-plotter, theme-styler

## da-ggplot2-adv  (track: analyst; curriculum_id 2.5; landing Advanced-ggplot2-Course.html; access: free)
1. Facets-and-Scales-in-ggplot2 - Small multiples with facet_wrap/facet_grid (one chart per group), and controlling scales, guides and legends. widgets: facet-grid, chart-plotter
2. Themes-Color-and-Accessibility - Restyle without touching data: built-in and custom themes, color scales, and colorblind-safe, accessible palettes. widgets: theme-styler
3. Annotate-and-Compose-Plots - Annotations that explain (labels, reference lines), non-overlapping text with ggrepel, and composing several plots with patchwork. widgets: chart-plotter, process-flow

## da-datatable  (track: analyst; curriculum_id 2.6; landing data-table-Course.html; access: free)
1. data-table-Syntax-and-Keys - The DT[i, j, by] anatomy (filter rows, compute columns, group), and keys for lightning-fast lookups and joins. widgets: table-transform, process-flow
2. dplyr-vs-data-table - The same task in both, head to head, and the speed / memory trade-offs. Keep every data.table example TINY and single-threaded (call setDTthreads(1) once up front) so it runs fast in-browser; if any block is slow or risky, make it an illustrative r-static block. widgets: chart-plotter, table-transform
3. Bigger-than-Memory-Data-in-R - Wrangling millions of rows, and querying data that does not fit in memory with duckdb / duckplyr. widgets: chart-plotter, process-flow
4. Bridge-with-dtplyr - Write dplyr, get data.table speed: dtplyr's lazy_dt() translates dplyr verbs into data.table under the hood; see the translation with show_query(), know when the bridge pays off, and where it leaks (collect() to materialize). widgets: table-transform, process-flow

## da-tables  (track: analyst; curriculum_id 2.7; landing Report-Tables-Course.html; access: free)
1. Report-Tables-with-gt-and-flextable - Turn a raw data frame into a presentation-ready table (titles, grouping, formatting) with gt and flextable, and HTML tables with kableExtra. widgets: styled-table
2. Summary-Tables-and-Number-Formatting - One-line summary and regression tables with gtsummary, and formatting numbers, percentages and units so a table reads cleanly. widgets: styled-table

## da-dashboards  (track: analyst; curriculum_id 2.8; landing Dashboards-Course.html; access: free)
1. Interactive-Charts-and-Maps-in-R - Make a chart interactive with plotly (hover, zoom) and put points on a map with leaflet. widgets: chart-plotter, dashboard-layout
2. Quarto-Dashboards-and-Linked-Views - Lay out a Quarto dashboard (value boxes + chart tiles) and link views so a selection in one updates the others (crosstalk). widgets: dashboard-layout
3. Your-First-Shiny-App - Reactivity from scratch: an input drives an output, the smallest Shiny app, and how the reactive graph re-runs. widgets: dashboard-layout, process-flow

## da-communicate  (track: analyst; curriculum_id 2.9; landing Communicate-Automate-Course.html; access: free)
1. Reproducible-Reports-with-Quarto - The anatomy of a Quarto / R Markdown document (YAML, prose, code chunks) and what it knits to, then parameterized reports that re-run for any input. widgets: doc-structure, process-flow
2. Telling-a-Story-with-Data - Lead with the answer (the executive summary), then structure a short data story that a busy reader can act on. widgets: chart-plotter, doc-structure
3. AI-Assisted-Analysis-in-R - Use an LLM to summarize and label data from R (ellmer), and a clear-eyed guide to when to trust, and when not to trust, an LLM in an analysis. widgets: agent-loop, process-flow
