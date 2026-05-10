# Asset Track: Comparison Posts

**Total:** 260 slugs (canonical for category 06)
**Page template:** TL;DR table (5 dimensions) → use-case A → use-case B → benchmark → decision tree
**Word count target:** 1000 to 2000
**Tracking:** `www/programmatic-seo.json` with `category_id="comparison"`

URL pattern: `/<A>-vs-<B>-in-R.html`

---

## 06.1 Same-package fn vs fn (60)

dplyr (10):
- summarise-vs-summarize-in-R
- mutate-vs-transmute-in-R
- filter-vs-slice-in-R
- select-vs-pull-in-R
- distinct-vs-unique-in-R
- arrange-vs-sort-in-R
- count-vs-tally-in-R
- bind_rows-vs-rbind-in-R
- left_join-vs-inner_join-in-R
- semi_join-vs-anti_join-in-R

tidyr (5):
- pivot_longer-vs-gather-in-R
- pivot_wider-vs-spread-in-R
- separate-vs-separate_wider_delim-in-R
- nest-vs-chop-in-R
- replace_na-vs-coalesce-in-R

ggplot2 (10):
- geom_bar-vs-geom_col-in-R
- geom_point-vs-geom_jitter-in-R
- geom_smooth-vs-stat_smooth-in-R
- geom_histogram-vs-geom_density-in-R
- facet_wrap-vs-facet_grid-in-R
- coord_flip-vs-aes-flip-in-R
- scale_color-vs-scale_fill-in-R
- theme_minimal-vs-theme_classic-in-R
- aes-vs-aes_string-in-R
- ggsave-vs-png-device-in-R

stringr (5):
- str_detect-vs-grepl-in-R
- str_replace-vs-gsub-in-R
- str_extract-vs-regmatches-in-R
- str_split-vs-strsplit-in-R
- str_c-vs-paste-in-R

lubridate (5):
- ymd-vs-as-Date-in-R
- difftime-vs-time_length-in-R
- floor_date-vs-round_date-in-R
- with_tz-vs-force_tz-in-R
- duration-vs-period-in-R

purrr (5):
- map-vs-lapply-in-R
- map_dbl-vs-sapply-in-R
- walk-vs-for-loop-in-R
- reduce-vs-Reduce-in-R
- safely-vs-tryCatch-in-R

Base R (20):
- paste-vs-paste0-in-R
- sapply-vs-lapply-in-R
- apply-vs-sapply-in-R
- mapply-vs-Map-in-R
- vapply-vs-sapply-in-R
- lm-vs-glm-in-R
- aov-vs-lm-in-R
- table-vs-xtabs-in-R
- print-vs-cat-in-R
- message-vs-warning-in-R
- stop-vs-stop-with-condition-in-R
- library-vs-require-in-R
- subset-vs-filter-in-R
- transform-vs-mutate-in-R
- merge-vs-join-in-R
- aggregate-vs-summarise-in-R
- order-vs-sort-vs-rank-in-R
- which-vs-which.max-in-R
- match-vs-pmatch-in-R
- assign-vs-equals-in-R

## 06.2 Cross-package fn vs fn (40)

- base-apply-vs-purrr-map-in-R
- base-Reduce-vs-purrr-reduce-in-R
- reshape2-melt-vs-tidyr-pivot_longer-in-R
- reshape2-dcast-vs-tidyr-pivot_wider-in-R
- base-subset-vs-dplyr-filter-in-R
- base-transform-vs-dplyr-mutate-in-R
- plyr-ddply-vs-dplyr-group_by-in-R
- plyr-laply-vs-purrr-map-in-R
- base-aggregate-vs-dplyr-summarise-in-R
- base-merge-vs-dplyr-join-in-R
- data-table-vs-dplyr-syntax-in-R
- data-table-fread-vs-readr-read_csv-in-R
- data-table-melt-vs-tidyr-pivot_longer-in-R
- data-table-dcast-vs-tidyr-pivot_wider-in-R
- data-table-fcase-vs-dplyr-case_when-in-R
- data-table-shift-vs-dplyr-lag-in-R
- data-table-frank-vs-dplyr-min_rank-in-R
- base-paste-vs-stringr-str_c-in-R
- base-grepl-vs-stringr-str_detect-in-R
- base-gsub-vs-stringr-str_replace-in-R
- base-strsplit-vs-stringr-str_split-in-R
- base-tolower-vs-stringr-str_to_lower-in-R
- base-substr-vs-stringr-str_sub-in-R
- base-as-Date-vs-lubridate-ymd-in-R
- base-difftime-vs-lubridate-time_length-in-R
- base-format-vs-lubridate-format-in-R
- base-Sys-time-vs-lubridate-now-in-R
- jsonlite-fromJSON-vs-rjson-fromJSON-in-R
- httr-vs-httr2-in-R
- rvest-vs-httr-scraping-in-R
- arrow-read_parquet-vs-vroom-in-R
- arrow-write_parquet-vs-fst-write_fst-in-R
- xml2-vs-XML-package-in-R
- broom-tidy-vs-base-summary-in-R
- caret-train-vs-tidymodels-fit-in-R
- mlr3-vs-tidymodels-in-R
- glmnet-vs-tidymodels-cv-glmnet-in-R
- ranger-vs-randomForest-in-R
- xgboost-vs-lightgbm-vs-catboost-in-R
- rpart-vs-tree-vs-party-in-R

## 06.3 Package vs package (30)

- dplyr-vs-data-table-in-R
- dplyr-vs-pandas-syntax-in-R
- ggplot2-vs-base-graphics-in-R
- ggplot2-vs-lattice-in-R
- ggplot2-vs-plotly-in-R
- ggplot2-vs-echarts4r-in-R
- tidymodels-vs-caret-in-R
- tidymodels-vs-mlr3-in-R
- caret-vs-mlr-in-R
- rstan-vs-brms-vs-rstanarm-in-R
- coda-vs-bayesplot-in-R
- forecast-vs-fable-vs-modeltime-in-R
- xts-vs-zoo-vs-tsibble-in-R
- shiny-vs-flexdashboard-in-R
- shiny-vs-plumber-for-APIs-in-R
- shinyapps-vs-shinyServer-deployment-in-R
- knitr-vs-quarto-in-R
- rmarkdown-vs-quarto-in-R
- bookdown-vs-quarto-book-in-R
- gt-vs-flextable-vs-kable-in-R
- DT-vs-reactable-tables-in-R
- leaflet-vs-mapview-in-R
- sf-vs-sp-vs-terra-in-R
- raster-vs-terra-package-in-R
- DBI-vs-RPostgres-vs-odbc-in-R
- foreach-vs-future-vs-furrr-in-R
- parallel-vs-future-in-R
- Rcpp-vs-cpp11-in-R
- testthat-vs-tinytest-in-R
- renv-vs-packrat-vs-checkpoint-in-R

## 06.4 Method vs method (50)

Tests (15):
- t-test-vs-Mann-Whitney-U-in-R
- ANOVA-vs-Kruskal-Wallis-in-R
- Welchs-t-test-vs-Students-t-test-in-R
- Pearson-vs-Spearman-Correlation-in-R
- Chi-square-vs-Fisher-Exact-in-R
- Repeated-Measures-ANOVA-vs-Mixed-Model-in-R
- McNemar-vs-Cochran-Q-in-R
- Wilcoxon-Signed-Rank-vs-Paired-t-test-in-R
- Friedman-vs-Repeated-Measures-ANOVA-in-R
- ADF-vs-KPSS-Stationarity-in-R
- Sign-Test-vs-Wilcoxon-in-R
- Levene-vs-Bartlett-Variance-Test-in-R
- Shapiro-Wilk-vs-Anderson-Darling-Normality-in-R
- One-way-vs-Two-way-ANOVA-in-R
- Type-I-vs-Type-III-ANOVA-Sums-of-Squares-in-R

Regression (15):
- OLS-vs-Robust-Regression-in-R
- Linear-vs-Logistic-Regression-Use-Cases-in-R
- Lasso-vs-Ridge-vs-Elastic-Net-in-R
- Logistic-vs-Probit-Regression-in-R
- Poisson-vs-Negative-Binomial-Regression-in-R
- Multinomial-vs-Ordinal-Logistic-Regression-in-R
- GLM-vs-GAM-in-R
- Linear-vs-Quantile-Regression-in-R
- Ridge-vs-Bayesian-Regression-in-R
- Mixed-Effects-vs-GEE-in-R
- ARIMA-vs-ETS-Forecasting-in-R
- ARIMA-vs-Prophet-in-R
- Linear-Regression-vs-Random-Forest-Regression-in-R
- Beta-Regression-vs-Logistic-on-Proportions-in-R
- Cox-PH-vs-Parametric-Survival-Models-in-R

ML (10):
- Random-Forest-vs-XGBoost-in-R
- XGBoost-vs-LightGBM-in-R
- LightGBM-vs-CatBoost-in-R
- Decision-Tree-vs-Random-Forest-in-R
- Naive-Bayes-vs-Logistic-Regression-in-R
- SVM-vs-Logistic-Regression-in-R
- KNN-vs-Decision-Tree-in-R
- Neural-Network-vs-XGBoost-Tabular-in-R
- Bagging-vs-Boosting-vs-Stacking-in-R
- Random-Forest-vs-Extra-Trees-in-R

Unsupervised (10):
- K-Means-vs-Hierarchical-Clustering-in-R
- Hierarchical-vs-DBSCAN-in-R
- DBSCAN-vs-OPTICS-Clustering-in-R
- K-Means-vs-Gaussian-Mixture-Model-in-R
- PCA-vs-ICA-in-R
- PCA-vs-t-SNE-in-R
- t-SNE-vs-UMAP-in-R
- PCA-vs-Factor-Analysis-in-R
- Isolation-Forest-vs-One-Class-SVM-in-R
- Hierarchical-vs-Affinity-Propagation-in-R

## 06.5 Concept vs concept (40)

Statistical (15):
- Type-I-vs-Type-II-Error-in-R
- Sensitivity-vs-Specificity-in-R
- Precision-vs-Recall-in-R
- Accuracy-vs-F1-Score-in-R
- p-value-vs-Effect-Size-in-R
- Standard-Deviation-vs-Standard-Error-in-R
- Variance-vs-Covariance-in-R
- R-Squared-vs-Adjusted-R-Squared-in-R
- AIC-vs-BIC-in-R
- AICc-vs-AIC-in-R
- Confidence-Interval-vs-Prediction-Interval-in-R
- One-tailed-vs-Two-tailed-Test-in-R
- Frequentist-vs-Bayesian-in-R
- Population-vs-Sample-Statistics-in-R
- Bias-vs-Variance-in-R

ML (10):
- Underfitting-vs-Overfitting-in-R
- Bagging-vs-Boosting-Concept-in-R
- Hard-vs-Soft-Voting-Ensemble-in-R
- Mini-Batch-vs-Stochastic-Gradient-Descent-in-R
- L1-vs-L2-Regularization-in-R
- Generative-vs-Discriminative-Models-in-R
- Parametric-vs-Nonparametric-Models-in-R
- Supervised-vs-Unsupervised-Learning-in-R
- Cross-Validation-vs-Train-Test-Split-in-R
- Holdout-vs-Bootstrap-Validation-in-R

Time series (10):
- AR-vs-MA-vs-ARMA-vs-ARIMA-in-R
- Seasonality-vs-Trend-vs-Cyclical-in-R
- Stationarity-Strict-vs-Weak-in-R
- Additive-vs-Multiplicative-Decomposition-in-R
- ACF-vs-PACF-Interpretation-in-R
- Holt-vs-Holt-Winters-in-R
- Univariate-vs-Multivariate-Time-Series-in-R
- Causal-vs-Non-Causal-Time-Series-in-R
- Autocorrelation-vs-Partial-Autocorrelation-in-R
- Differencing-vs-Detrending-in-R

Causal / experimental (5):
- Confounder-vs-Mediator-vs-Moderator-in-R
- RCT-vs-Observational-Study-in-R
- DiD-vs-Synthetic-Control-in-R
- Propensity-Score-Matching-vs-IPTW-in-R
- Intention-to-Treat-vs-Per-Protocol-in-R

## 06.6 R vs Python by task (30)

- R-vs-Python-for-Data-Wrangling
- R-vs-Python-for-Data-Visualization
- R-vs-Python-for-Statistical-Modeling
- R-vs-Python-for-Time-Series-Forecasting
- R-vs-Python-for-Machine-Learning
- R-vs-Python-for-Deep-Learning
- R-vs-Python-for-NLP
- R-vs-Python-for-Web-Scraping
- R-vs-Python-for-Reporting
- R-vs-Python-for-SQL-Integration
- R-vs-Python-for-Big-Data
- R-vs-Python-for-Bioinformatics
- R-vs-Python-for-Finance
- R-vs-Python-for-Geospatial
- R-vs-Python-for-Bayesian-Modeling
- R-vs-Python-for-Survival-Analysis
- R-vs-Python-for-A-B-Testing
- R-vs-Python-for-Causal-Inference
- R-vs-Python-for-Clinical-Trials
- R-vs-Python-for-Marketing-Analytics
- R-vs-Python-for-Time-Series-Decomposition
- R-vs-Python-for-Forecast-Accuracy
- R-vs-Python-for-Hyperparameter-Tuning
- R-vs-Python-for-Cross-Validation
- R-vs-Python-for-Mixed-Effects-Models
- R-vs-Python-for-Survey-Analysis
- R-vs-Python-for-Image-Classification
- R-vs-Python-for-Topic-Modeling
- R-vs-Python-for-Anomaly-Detection
- R-vs-Python-for-Reproducible-Research

## 06.7 File format vs format (10)

- CSV-vs-RDS-vs-Feather-vs-Parquet-in-R
- CSV-vs-TSV-vs-Pipe-Delimited-in-R
- JSON-vs-YAML-for-Config-in-R
- RDS-vs-RData-vs-Save-in-R
- fst-vs-qs-vs-RDS-in-R
- Parquet-vs-Arrow-vs-Feather-in-R
- Excel-XLSX-vs-CSV-in-R
- SAS-vs-SPSS-vs-Stata-Reading-in-R
- HDF5-vs-Parquet-in-R
- ProtoBuf-vs-JSON-vs-MessagePack-in-R
