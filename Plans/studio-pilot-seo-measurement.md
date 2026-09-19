# Practice studio pilot: what to measure, and against what

Shipped to production 2026-09-19 (master 58319c76a5). Twelve exercise hubs get
the two-pane studio; the other 136 keep the classic stacked layout and are the
control group. `STUDIO_PILOT_HUBS` in `_build/build.py` is the list; set
`STUDIO_ALL_HUBS = True` there to widen it to everything.

## Why there is a control group

The studio is a client-side layer, so the HTML a crawler fetches is identical
either way. What changes is the rendered page. Measured in a browser on
dplyr-Exercises-in-R before the h1 fix:

| | classic | studio |
|---|---|---|
| visible headings | 60 of 60 | 2 of 115 |
| visible `<h1>` | yes | the page's own one is `display:none` |
| visible exercise titles | 50 of 50 | 0 of 50, the panel is closed at rest |

Title tag, canonical, URL, internal links and every word of content are
unchanged, so this is a re-weighting rather than a loss. But it is a
re-weighting of established ranking pages, and search takes two to three weeks
to answer. Without a control group that answer is unreadable: any movement could
just as easily be seasonality or an unrelated algorithm update.

Two fixes went out with the pilot, both aimed at the table above:
the studio's `<h1>` now carries the page's full title instead of truncating at
the colon, and it is no longer `display:none` below 560px, which had left
phone-width renders with no visible h1 at all from either source.

## The measurement

In Search Console, **Performance > Search results**, date range **last 28 days**,
compare against the previous 28 days once three to four weeks have passed.
Export **Pages**, then split the export against the two lists below and total
each group.

Read four numbers per group: impressions, clicks, average position, CTR.

What matters is not the pilot group's movement on its own, it is the difference
between the two groups. If both fall 8 percent, that is the season. If the pilot
falls 8 percent and the control holds flat, that is the studio.

Take the baseline export **before Google recrawls**, so there is a before to
compare to.

## Pilot (studio on) - 12 URLs

```
https://r-statistics.co/Apply-Family-Exercises-in-R.html
https://r-statistics.co/Correlation-Exercises-in-R.html
https://r-statistics.co/Data-Cleaning-Exercises-in-R.html
https://r-statistics.co/Data-Wrangling-Exercises-in-R.html
https://r-statistics.co/EDA-Exercises-in-R.html
https://r-statistics.co/Hypothesis-Testing-Exercises-in-R.html
https://r-statistics.co/Linear-Regression-Exercises-in-R.html
https://r-statistics.co/Machine-Learning-Exercises-in-R.html
https://r-statistics.co/Time-Series-Exercises-in-R.html
https://r-statistics.co/dplyr-Exercises-in-R.html
https://r-statistics.co/ggplot2-Exercises-in-R.html
https://r-statistics.co/tidyr-Exercises-in-R.html
```

## Control (classic) - 136 URLs

```
https://r-statistics.co/A-B-Testing-Exercises-in-R.html
https://r-statistics.co/AB-Testing-Exercises-in-R.html
https://r-statistics.co/AB-Testing-Interview-Cases.html
https://r-statistics.co/ANOVA-Exercises-in-R.html
https://r-statistics.co/API-Calls-Exercises-in-R.html
https://r-statistics.co/ARIMA-Exercises-in-R.html
https://r-statistics.co/Base-R-Speed-Round.html
https://r-statistics.co/Bayesian-Statistics-Exercises-in-R.html
https://r-statistics.co/Binomial-Distribution-Exercises-in-R.html
https://r-statistics.co/Central-Limit-Theorem-Exercises-in-R.html
https://r-statistics.co/Chi-Square-Test-Exercises-in-R.html
https://r-statistics.co/Cluster-Analysis-Exercises-in-R.html
https://r-statistics.co/Clustering-Exercises-in-R.html
https://r-statistics.co/Confidence-Interval-Exercises-in-R.html
https://r-statistics.co/Cross-Validation-Exercises-in-R.html
https://r-statistics.co/Data-Cleaning-Gauntlet.html
https://r-statistics.co/Data-Visualization-Exercises-in-R.html
https://r-statistics.co/Date-Time-Manipulation-Exercises-in-R.html
https://r-statistics.co/Dates-and-Times-Drills-in-R.html
https://r-statistics.co/Decision-Tree-Exercises-in-R.html
https://r-statistics.co/Error-Triage-Drills-in-R.html
https://r-statistics.co/Experimental-Design-Exercises-in-R.html
https://r-statistics.co/Exponential-Smoothing-Exercises-in-R.html
https://r-statistics.co/Forecast-Evaluation-Exercises-in-R.html
https://r-statistics.co/GAM-Exercises-in-R.html
https://r-statistics.co/GLM-Exercises-in-R.html
https://r-statistics.co/Logistic-Regression-Exercises-in-R.html
https://r-statistics.co/Loops-vs-Vectorization-Exercises-in-R.html
https://r-statistics.co/ML-Interview-Questions-in-R.html
https://r-statistics.co/Missing-Data-in-R-Exercises.html
https://r-statistics.co/Mixed-Effects-Models-Exercises-in-R.html
https://r-statistics.co/Multiple-Regression-Exercises-in-R.html
https://r-statistics.co/Multiple-Testing-Exercises-in-R.html
https://r-statistics.co/Network-Analysis-Exercises-in-R.html
https://r-statistics.co/Nonparametric-Tests-Exercises-in-R.html
https://r-statistics.co/PCA-Exercises-in-R.html
https://r-statistics.co/Parallel-Computing-in-R-Exercises.html
https://r-statistics.co/Poisson-Distribution-Exercises-in-R.html
https://r-statistics.co/Poisson-Regression-Exercises-in-R.html
https://r-statistics.co/Post-Hoc-Tests-Exercises-in-R.html
https://r-statistics.co/Power-Analysis-Exercises-in-R.html
https://r-statistics.co/Probability-Distributions-Exercises-in-R.html
https://r-statistics.co/Probability-Puzzles-for-Interviews.html
https://r-statistics.co/Probability-in-R-Exercises.html
https://r-statistics.co/R-Apply-Exercises.html
https://r-statistics.co/R-Basics-Exercises.html
https://r-statistics.co/R-Beginner-Exercises.html
https://r-statistics.co/R-Control-Flow-Exercises.html
https://r-statistics.co/R-Data-Frames-Exercises.html
https://r-statistics.co/R-Data-Import-Exercises.html
https://r-statistics.co/R-Date-Time-Exercises.html
https://r-statistics.co/R-Debugging-Exercises.html
https://r-statistics.co/R-Functional-Programming-Exercises.html
https://r-statistics.co/R-Functions-Exercises.html
https://r-statistics.co/R-Interview-Questions.html
https://r-statistics.co/R-Lists-Exercises.html
https://r-statistics.co/R-Markdown-Exercises.html
https://r-statistics.co/R-OOP-Exercises.html
https://r-statistics.co/R-Package-Development-Exercises.html
https://r-statistics.co/R-Performance-Optimization-Exercises.html
https://r-statistics.co/R-Probability-Distributions-Exercises.html
https://r-statistics.co/R-String-Exercises.html
https://r-statistics.co/R-Subsetting-Exercises.html
https://r-statistics.co/R-Vectors-Exercises.html
https://r-statistics.co/R-Visualization-Project.html
https://r-statistics.co/R-for-Biostatistics-Exercises.html
https://r-statistics.co/R-for-Data-Science-Exercises.html
https://r-statistics.co/R-for-Finance-Exercises.html
https://r-statistics.co/R-for-Genomics-Exercises.html
https://r-statistics.co/R-for-Healthcare-Exercises.html
https://r-statistics.co/R-for-Marketing-Analytics-Exercises.html
https://r-statistics.co/R-for-Sports-Analytics-Exercises.html
https://r-statistics.co/Random-Forest-Exercises-in-R.html
https://r-statistics.co/Regex-Drills-in-R.html
https://r-statistics.co/Regex-Exercises-in-R.html
https://r-statistics.co/Regression-Diagnostics-Exercises-in-R.html
https://r-statistics.co/Repeated-Measures-Exercises-in-R.html
https://r-statistics.co/Resampling-Problems-in-R.html
https://r-statistics.co/Ridge-and-Lasso-Exercises-in-R.html
https://r-statistics.co/SEM-Exercises-in-R.html
https://r-statistics.co/SQL-to-dplyr-Translations.html
https://r-statistics.co/Sampling-Methods-Exercises-in-R.html
https://r-statistics.co/Shiny-Exercises-in-R.html
https://r-statistics.co/Spatial-Analysis-Exercises-in-R.html
https://r-statistics.co/Statistics-Interview-Questions.html
https://r-statistics.co/Survey-Analysis-in-R-Exercises.html
https://r-statistics.co/Survival-Analysis-Exercises-in-R.html
https://r-statistics.co/Take-Home-Assignment-Simulator.html
https://r-statistics.co/Text-Mining-Exercises-in-R.html
https://r-statistics.co/Time-Series-Decomposition-Exercises-in-R.html
https://r-statistics.co/Time-Series-in-R-Exercises.html
https://r-statistics.co/Top-20-Bayesian-Problems-in-R.html
https://r-statistics.co/Top-20-Time-Series-Problems-in-R.html
https://r-statistics.co/Top-25-Regression-Problems-in-R.html
https://r-statistics.co/Web-Scraping-Exercises-in-R.html
https://r-statistics.co/XGBoost-Exercises-in-R.html
https://r-statistics.co/brms-Exercises-in-R.html
https://r-statistics.co/broom-Exercises-in-R.html
https://r-statistics.co/caret-Exercises-in-R.html
https://r-statistics.co/data-table-Exercises.html
https://r-statistics.co/data.table-Exercises-in-R.html
https://r-statistics.co/dbplyr-SQL-Exercises-in-R.html
https://r-statistics.co/dplyr-Exercises.html
https://r-statistics.co/dplyr-Group-By-Exercises-in-R.html
https://r-statistics.co/dplyr-Join-Exercises.html
https://r-statistics.co/dplyr-Joins-Exercises-in-R.html
https://r-statistics.co/dplyr-Window-Functions-Exercises-in-R.html
https://r-statistics.co/dplyr-filter-select-Exercises.html
https://r-statistics.co/dplyr-group-by-summarise-Exercises.html
https://r-statistics.co/forcats-Exercises-in-R.html
https://r-statistics.co/ggplot2-Aesthetics-Exercises.html
https://r-statistics.co/ggplot2-Bar-Chart-Exercises-in-R.html
https://r-statistics.co/ggplot2-Color-Scales-Exercises-in-R.html
https://r-statistics.co/ggplot2-Customization-Exercises.html
https://r-statistics.co/ggplot2-Exercises.html
https://r-statistics.co/ggplot2-Facet-Exercises.html
https://r-statistics.co/ggplot2-Facets-Exercises-in-R.html
https://r-statistics.co/ggplot2-Geom-Exercises.html
https://r-statistics.co/ggplot2-Heatmap-Exercises-in-R.html
https://r-statistics.co/ggplot2-Recreation-Challenge.html
https://r-statistics.co/ggplot2-Themes-Exercises-in-R.html
https://r-statistics.co/gt-Tables-Exercises-in-R.html
https://r-statistics.co/leaflet-Exercises-in-R.html
https://r-statistics.co/lubridate-Exercises-in-R.html
https://r-statistics.co/plotly-Exercises-in-R.html
https://r-statistics.co/purrr-Exercises-in-R.html
https://r-statistics.co/purrr-Exercises.html
https://r-statistics.co/readr-Exercises-in-R.html
https://r-statistics.co/stringr-Exercises-in-R.html
https://r-statistics.co/t-Test-Exercises-in-R.html
https://r-statistics.co/testthat-Exercises-in-R.html
https://r-statistics.co/tidymodels-Exercises-in-R.html
https://r-statistics.co/tidyr-Nest-Unnest-Exercises-in-R.html
https://r-statistics.co/tidyr-Pivot-Exercises-in-R.html
https://r-statistics.co/tidyr-Reshaping-Exercises.html
https://r-statistics.co/tidyverse-Exercises-in-R.html
```
