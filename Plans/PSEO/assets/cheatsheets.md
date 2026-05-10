# Asset Track: Cheatsheets

**Total:** 55 (1 live + 54 net new)
**Deliverables per cheatsheet:** HTML page + PDF + light-mode PNG + dark-mode PNG (single-image versions for sharing on Twitter / Reddit / LinkedIn)
**Distribution:** embed in topic posts; share on Twitter, Reddit, LinkedIn quarterly batches

URL: `/<slug>-cheatsheet.html`
PDF: `/cheatsheets/<slug>.pdf`
PNG: `/cheatsheets/<slug>-light.png`, `/cheatsheets/<slug>-dark.png`

Tracking: `Plans/PSEO/asset-tracker.json` under `cheatsheets`.

---

## Live (1)

| Slug | Subcategory |
|---|---|
| ggplot2-cheatsheet | visualization (HTML only; PDF/PNG to be backfilled) |

---

## Net new (54)

### Tidyverse (8)

| Slug | Target keyword |
|---|---|
| dplyr-cheatsheet | dplyr cheatsheet |
| tidyr-cheatsheet | tidyr cheatsheet |
| stringr-cheatsheet | stringr cheatsheet |
| lubridate-cheatsheet | lubridate cheatsheet |
| purrr-cheatsheet | purrr cheatsheet |
| forcats-cheatsheet | forcats cheatsheet |
| glue-cheatsheet | glue r cheatsheet |
| readr-cheatsheet | readr cheatsheet |

### Visualization (5)

| Slug | Target keyword |
|---|---|
| base-graphics-cheatsheet | base r graphics cheatsheet |
| plotly-cheatsheet | plotly r cheatsheet |
| leaflet-cheatsheet | leaflet r cheatsheet |
| gganimate-cheatsheet | gganimate cheatsheet |
| scales-cheatsheet | scales r cheatsheet |

### Statistics (7)

| Slug | Target keyword |
|---|---|
| test-decision-tree-cheatsheet | statistical test decision tree |
| regression-decision-tree-cheatsheet | regression type decision tree |
| distributions-cheatsheet | probability distributions cheatsheet |
| anova-family-cheatsheet | anova types cheatsheet |
| post-hoc-tests-cheatsheet | post hoc tests cheatsheet |
| effect-sizes-cheatsheet | effect size formulas cheatsheet |
| confidence-intervals-cheatsheet | confidence intervals cheatsheet |

### ML (6)

| Slug | Target keyword |
|---|---|
| caret-cheatsheet | caret cheatsheet |
| tidymodels-cheatsheet | tidymodels cheatsheet |
| classification-metrics-cheatsheet | classification metrics cheatsheet |
| regression-metrics-cheatsheet | regression metrics cheatsheet |
| hyperparameter-tuning-cheatsheet | hyperparameter tuning cheatsheet |
| resampling-cheatsheet | cross validation cheatsheet |

### Time series (4)

| Slug | Target keyword |
|---|---|
| arima-cheatsheet | arima cheatsheet |
| ets-cheatsheet | ets model cheatsheet |
| decomposition-cheatsheet | time series decomposition cheatsheet |
| forecast-accuracy-cheatsheet | forecast accuracy metrics |

### Bayesian (4)

| Slug | Target keyword |
|---|---|
| brms-cheatsheet | brms cheatsheet |
| rstanarm-cheatsheet | rstanarm cheatsheet |
| prior-selection-cheatsheet | bayesian prior selection cheatsheet |
| mcmc-diagnostics-cheatsheet | mcmc diagnostics cheatsheet |

### Engineering (7)

| Slug | Target keyword |
|---|---|
| rcpp-cheatsheet | rcpp cheatsheet |
| profvis-cheatsheet | profvis cheatsheet |
| debugging-cheatsheet | r debugging cheatsheet |
| errors-conditions-cheatsheet | r error handling cheatsheet |
| s3-s4-r6-cheatsheet | r oop cheatsheet |
| package-dev-cheatsheet | r package development cheatsheet |
| renv-cheatsheet | renv cheatsheet |

### Reporting (4)

| Slug | Target keyword |
|---|---|
| rmarkdown-cheatsheet | r markdown cheatsheet |
| quarto-cheatsheet | quarto cheatsheet |
| knitr-cheatsheet | knitr cheatsheet |
| table-packages-cheatsheet | r table packages cheatsheet |

### Reference (5)

| Slug | Target keyword |
|---|---|
| dates-times-reference | r dates cheatsheet |
| regex-reference | r regex cheatsheet |
| encoding-locale-reference | r encoding cheatsheet |
| json-xml-reference | r json xml cheatsheet |
| dbi-sql-reference | r sql cheatsheet |

### Specialized (4)

| Slug | Target keyword |
|---|---|
| survival-cheatsheet | r survival cheatsheet |
| lme4-cheatsheet | lme4 cheatsheet |
| lavaan-cheatsheet | lavaan cheatsheet |
| psych-cheatsheet | psych r cheatsheet |
| sf-cheatsheet | sf cheatsheet |
| terra-cheatsheet | terra r cheatsheet |

(Specialized = 6 entries; total tally is 8 + 5 + 7 + 6 + 4 + 4 + 7 + 4 + 5 + 6 = 56. Trim 1 from Specialized at execution time, target 55.)

---

## Build playbook

1. Draft cheatsheet content as markdown with structured sections (max 1 page when rendered)
2. Style HTML version with grid layout (CSS grid; mobile-responsive)
3. Render PDF via `weasyprint` or `wkhtmltopdf` from the styled HTML
4. Render PNG (light + dark) via headless Chrome (Puppeteer / Playwright) at 2x resolution for retina displays
5. Add to `cheatsheets-index.html` listing page
6. Embed referenced cheatsheet in 5+ relevant tutorial pages via auto-link
7. Schedule social sharing: 1 cheatsheet/week alternating Twitter, Reddit r/rstats, LinkedIn

## Quality bar

- Single page when printed at 8.5x11 (US letter) and A4
- High-information-density: 30+ functions or concepts on the page
- Code snippets are runnable in isolation (no missing context)
- Includes a "When to use this" sidebar
- Footer credits link back to r-statistics.co
- License: CC BY 4.0 (attribution required)

## Backlink strategy

Cheatsheets are the highest backlink-yield asset on the site. After release:
- Cross-post the PNG on Reddit r/rstats with a link to the HTML version
- Pin the cheatsheet to relevant Twitter threads
- Email to r-bloggers.com for syndication
- Submit to r-cheatsheet aggregators (rstudio cheatsheets, bioconductor cheatsheets)
