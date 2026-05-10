# Asset Track: Cookbook Recipes

**Total:** 685 candidate slugs, ship top 500
**Page template:** problem statement → 1 canonical solution → 2 alternatives → benchmark (when relevant) → why this approach
**Word count target:** 800 to 1500
**Tracking:** `www/programmatic-seo.json` with `category_id="cookbook-recipe"` and `subcategory_id` from list below

URL pattern: `/How-to-<Task>-in-R.html`

Cookbook is also PSEO category 05 (cross-referenced from `categories/05-cookbook-recipe.md`).

---

## Subcategory rollup

| # | Subcategory | Candidates | Ship target |
|---|---|---|---|
| 1 | Data import | 25 | 25 |
| 2 | Data cleaning | 40 | 35 |
| 3 | Wrangling | 80 | 70 |
| 4 | Strings | 50 | 40 |
| 5 | Dates / times | 50 | 40 |
| 6 | Aggregations | 30 | 25 |
| 7 | Joins / merge | 25 | 20 |
| 8 | Reshape | 20 | 15 |
| 9 | Sampling | 20 | 15 |
| 10 | Visualization | 80 | 60 |
| 11 | Modeling | 60 | 50 |
| 12 | Diagnostics | 30 | 25 |
| 13 | Validation | 25 | 20 |
| 14 | Tuning | 20 | 15 |
| 15 | Export | 20 | 15 |
| 16 | Reporting | 25 | 15 |
| 17 | Debugging | 15 | 10 |
| 18 | Performance | 25 | 15 |
| 19 | Reproducibility | 15 | 10 |
| 20 | File system | 15 | 10 |
| 21 | API / web | 15 | 10 |
| | **Total** | **685** | **540** |

(Plan target 500; allowing 540 ship slack accommodates demand-validation drop-off rate of ~7%.)

---

## 1. Data import (25)

- How-to-Read-CSV-with-Custom-Delimiter-in-R
- How-to-Read-Tab-Separated-File-in-R
- How-to-Read-Pipe-Delimited-File-in-R
- How-to-Read-Multi-Sheet-Excel-File-in-R
- How-to-Read-Excel-Range-with-Skip-in-R
- How-to-Read-Large-CSV-Memory-Efficiently-in-R
- How-to-Read-Encoded-CSV-Latin1-or-UTF-16-in-R
- How-to-Read-Fixed-Width-File-in-R
- How-to-Read-Nested-JSON-in-R
- How-to-Read-JSON-from-API-in-R
- How-to-Read-XML-in-R
- How-to-Read-YAML-Config-in-R
- How-to-Read-Parquet-File-in-R
- How-to-Read-Feather-File-in-R
- How-to-Read-Arrow-Dataset-in-R
- How-to-Read-Compressed-CSV-Gzip-Bzip2-in-R
- How-to-Read-Multiple-CSVs-from-Folder-in-R
- How-to-Read-CSV-from-URL-in-R
- How-to-Read-Google-Sheets-in-R
- How-to-Read-SAS-File-in-R
- How-to-Read-SPSS-File-in-R
- How-to-Read-Stata-File-in-R
- How-to-Read-PDF-Tables-in-R
- How-to-Read-Database-Table-via-DBI-in-R
- How-to-Read-Streaming-Data-from-Kafka-in-R

## 2. Data cleaning (40)

- How-to-Remove-NA-Rows-in-R
- How-to-Remove-NA-Columns-in-R
- How-to-Replace-NA-with-Mean-in-R
- How-to-Replace-NA-with-Median-in-R
- How-to-Replace-NA-with-Mode-in-R
- How-to-Replace-NA-with-Zero-in-R
- How-to-Forward-Fill-NA-in-R
- How-to-Impute-with-KNN-in-R
- How-to-Impute-with-MICE-in-R
- How-to-Detect-Outliers-with-IQR-in-R
- How-to-Detect-Outliers-with-Z-Score-in-R
- How-to-Cap-Outliers-Winsorize-in-R
- How-to-Remove-Duplicates-in-R
- How-to-Find-Duplicate-Rows-in-R
- How-to-Detect-Mixed-Data-Types-in-Column-in-R
- How-to-Trim-Whitespace-from-All-Columns-in-R
- How-to-Standardize-Column-Names-in-R
- How-to-Convert-Column-to-snake_case-in-R
- How-to-Drop-Constant-Columns-in-R
- How-to-Drop-Zero-Variance-Columns-in-R
- How-to-Replace-Empty-Strings-with-NA-in-R
- How-to-Reorder-Factor-Levels-in-R
- How-to-Combine-Rare-Factor-Levels-in-R
- How-to-Recode-Factor-Levels-in-R
- How-to-Fix-Inconsistent-Capitalization-in-R
- How-to-Find-Unicode-Characters-in-Column-in-R
- How-to-Strip-Accents-from-Strings-in-R
- How-to-Validate-Range-of-Numeric-Column-in-R
- How-to-Find-Rows-Outside-Expected-Range-in-R
- How-to-Detect-Anomalous-Strings-in-Column-in-R
- How-to-Validate-Foreign-Key-Coverage-in-R
- How-to-Find-Negative-Values-Where-Not-Allowed-in-R
- How-to-Detect-Duplicate-Records-with-Fuzzy-Matching-in-R
- How-to-Identify-Nearly-Empty-Columns-in-R
- How-to-Resolve-Conflicting-Column-Types-When-Combining-in-R
- How-to-Drop-Highly-Correlated-Columns-in-R
- How-to-Audit-Data-Frame-for-Missingness-Patterns-in-R
- How-to-Identify-Funnel-Drop-Off-in-Data-in-R
- How-to-Reconstruct-Hierarchy-from-Flat-Records-in-R
- How-to-Validate-Date-Ranges-Are-Inclusive-in-R

## 3. Wrangling (80)

Filter / select (15):
- How-to-Filter-Rows-by-Condition-in-R
- How-to-Filter-with-Multiple-Conditions-in-R
- How-to-Filter-Top-N-by-Group-in-R
- How-to-Filter-Bottom-N-by-Group-in-R
- How-to-Filter-Rows-Matching-Pattern-in-R
- How-to-Select-Columns-Starting-with-Prefix-in-R
- How-to-Select-Columns-by-Type-in-R
- How-to-Select-Columns-by-Position-in-R
- How-to-Drop-Columns-with-Pattern-in-R
- How-to-Reorder-Columns-Alphabetically-in-R
- How-to-Move-Column-to-Front-in-R
- How-to-Move-Column-to-Back-in-R
- How-to-Filter-by-Date-Range-in-R
- How-to-Filter-Numeric-Within-Threshold-in-R
- How-to-Filter-Excluding-Match-in-R

Group / summarise (15):
- How-to-Group-by-Multiple-Columns-in-R
- How-to-Summarise-Mean-by-Group-in-R
- How-to-Summarise-Median-by-Group-in-R
- How-to-Summarise-Sum-by-Group-in-R
- How-to-Count-by-Group-in-R
- How-to-Compute-Percentile-by-Group-in-R
- How-to-Compute-Cumulative-Sum-by-Group-in-R
- How-to-Compute-Running-Mean-by-Group-in-R
- How-to-Compute-Difference-from-Group-Mean-in-R
- How-to-Find-Minimum-Maximum-by-Group-in-R
- How-to-Compute-First-Last-Value-by-Group-in-R
- How-to-Summarise-Multiple-Columns-Across-in-R
- How-to-Apply-Different-Function-per-Column-in-Summarise-in-R
- How-to-Group-Without-Reordering-in-R
- How-to-Get-Top-N-Per-Group-with-Ties-in-R

Mutate / transform (15):
- How-to-Add-New-Column-from-Existing-in-R
- How-to-Apply-Function-to-Multiple-Columns-in-R
- How-to-Conditionally-Replace-Value-in-R
- How-to-Create-Lag-Variable-in-R
- How-to-Create-Lead-Variable-in-R
- How-to-Create-Rolling-Average-Column-in-R
- How-to-Compute-Pct-Change-Column-in-R
- How-to-Bin-Continuous-Variable-into-Categories-in-R
- How-to-One-Hot-Encode-Factor-in-R
- How-to-Standardize-Column-Z-Score-in-R
- How-to-Min-Max-Normalize-Column-in-R
- How-to-Apply-Log-Transform-Column-in-R
- How-to-Apply-Box-Cox-Transform-Column-in-R
- How-to-Compute-Cross-Product-of-Two-Columns-in-R
- How-to-Compute-Pairwise-Difference-Across-Rows-in-R

Window operations (10):
- How-to-Compute-Rank-Within-Group-in-R
- How-to-Compute-Percentile-Within-Group-in-R
- How-to-Compute-Lag-Within-Group-in-R
- How-to-Compute-First-Difference-Within-Group-in-R
- How-to-Compute-Cumulative-Max-by-Group-in-R
- How-to-Compute-Cumulative-Mean-by-Group-in-R
- How-to-Compute-Z-Score-Within-Group-in-R
- How-to-Compute-Window-Around-Each-Row-in-R
- How-to-Compute-Sliding-Window-Aggregation-in-R
- How-to-Compute-Expanding-Window-Aggregation-in-R

Slice / sort (10):
- How-to-Sort-Data-Frame-by-Column-in-R
- How-to-Sort-by-Multiple-Columns-with-Mixed-Order-in-R
- How-to-Sort-by-Custom-Order-in-R
- How-to-Sort-with-NA-Last-in-R
- How-to-Slice-First-N-Rows-in-R
- How-to-Slice-Random-N-Rows-in-R
- How-to-Slice-Around-Specific-Index-in-R
- How-to-Get-Top-N-by-Multiple-Criteria-in-R
- How-to-Take-Sample-Stratified-by-Group-in-R
- How-to-Reverse-Order-of-Rows-in-R

Other wrangling (15):
- How-to-Pivot-Wider-with-Multiple-Values-in-R
- How-to-Pivot-Longer-with-Multiple-Names-in-R
- How-to-Stack-Multiple-Wide-Columns-in-R
- How-to-Unstack-One-Long-Column-in-R
- How-to-Compute-Crosstab-with-Margins-in-R
- How-to-Find-Records-Existing-in-A-but-Not-B-in-R
- How-to-Find-Records-Common-to-A-and-B-in-R
- How-to-Filter-Out-Lowest-Variance-Columns-in-R
- How-to-Filter-on-Aggregate-Threshold-in-R
- How-to-Compute-Within-Group-Standardization-in-R
- How-to-Compute-Pairs-Across-Groups-in-R
- How-to-Compute-Difference-from-Reference-Row-in-R
- How-to-Implement-First-Touch-Last-Touch-Attribution-in-R
- How-to-Cluster-Adjacent-Rows-by-Time-Gap-in-R
- How-to-Compute-Sequence-Number-by-Group-in-R

## 4. Strings (50)

Extract / detect (10):
- How-to-Extract-Email-from-String-in-R
- How-to-Extract-URL-from-String-in-R
- How-to-Extract-Phone-from-String-in-R
- How-to-Extract-Number-from-String-in-R
- How-to-Extract-Date-from-String-in-R
- How-to-Extract-First-N-Characters-in-R
- How-to-Extract-Last-N-Characters-in-R
- How-to-Extract-Substring-Between-Two-Characters-in-R
- How-to-Detect-Pattern-in-String-Vector-in-R
- How-to-Find-Position-of-Substring-in-R

Replace / remove (10):
- How-to-Replace-First-Occurrence-in-R
- How-to-Replace-All-Occurrences-in-R
- How-to-Remove-Punctuation-from-String-in-R
- How-to-Remove-Numbers-from-String-in-R
- How-to-Remove-Multiple-Whitespace-in-R
- How-to-Remove-Non-ASCII-Characters-in-R
- How-to-Remove-Parentheses-and-Their-Content-in-R
- How-to-Strip-HTML-Tags-from-String-in-R
- How-to-Remove-Accents-from-String-in-R
- How-to-Replace-Multiple-Patterns-Vectorized-in-R

Format / transform (10):
- How-to-Convert-to-Title-Case-in-R
- How-to-Convert-to-Sentence-Case-in-R
- How-to-Convert-camelCase-to-snake_case-in-R
- How-to-Convert-snake_case-to-Title-Case-in-R
- How-to-Pad-String-with-Zeros-in-R
- How-to-Truncate-String-to-N-with-Ellipsis-in-R
- How-to-Wrap-Long-String-at-Width-in-R
- How-to-Reverse-String-in-R
- How-to-Repeat-String-N-Times-in-R
- How-to-Sort-Strings-Naturally-in-R

Split / concat (10):
- How-to-Split-String-by-Delimiter-in-R
- How-to-Split-String-by-Multiple-Delimiters-in-R
- How-to-Split-String-Keeping-Delimiter-in-R
- How-to-Split-String-into-Fixed-Width-Pieces-in-R
- How-to-Concatenate-Vector-of-Strings-in-R
- How-to-Concatenate-with-Separator-in-R
- How-to-Concatenate-with-Conditional-Format-in-R
- How-to-Build-File-Path-Cross-Platform-in-R
- How-to-Build-Query-String-from-List-in-R
- How-to-Glue-Variables-into-Template-in-R

Distance / fuzzy (10):
- How-to-Compute-Levenshtein-Distance-in-R
- How-to-Find-Closest-String-Match-in-R
- How-to-Match-Strings-Fuzzy-Threshold-in-R
- How-to-Use-Soundex-for-Name-Matching-in-R
- How-to-Detect-Anagrams-in-R
- How-to-Find-Common-Prefix-of-Strings-in-R
- How-to-Find-Longest-Common-Substring-in-R
- How-to-Stem-Words-in-R
- How-to-Lemmatize-Words-in-R
- How-to-Tokenize-Sentence-in-R

## 5. Dates / times (50)

(Largely overlaps with category 10. Cookbook entries are problem-task framings, not how-to-use-fn. Listed for completeness; finalize de-duplication during demand validation.)

- How-to-Calculate-Age-in-Years-Months-Days-in-R
- How-to-Calculate-Working-Days-Excluding-Holidays-in-R
- How-to-Build-Calendar-Table-with-Holiday-Flags-in-R
- How-to-Compute-Same-Day-Last-Year-in-R
- How-to-Compute-Days-Until-Next-Friday-in-R
- How-to-Convert-Date-to-Quarter-Number-in-R
- How-to-Group-Dates-by-Week-Starting-Monday-in-R
- How-to-Find-Last-Friday-of-Month-in-R
- How-to-Generate-Working-Days-Between-Dates-in-R
- How-to-Compute-Cumulative-Days-Worked-by-Employee-in-R
- How-to-Find-Overlapping-Date-Ranges-in-R
- How-to-Detect-Gaps-in-Time-Series-in-R
- How-to-Pad-Time-Series-to-Daily-Frequency-in-R
- How-to-Aggregate-Hourly-Data-to-Daily-in-R
- How-to-Aggregate-Daily-to-Monthly-in-R
- How-to-Compute-Rolling-7-Day-Average-in-R
- How-to-Compute-Year-over-Year-Growth-in-R
- How-to-Compute-Month-over-Month-Growth-in-R
- How-to-Compute-Trailing-12-Months-Sum-in-R
- How-to-Compute-Same-Period-Prior-Year-Comparison-in-R
- How-to-Detect-Day-Light-Saving-Transitions-in-R
- How-to-Convert-Excel-Date-Number-to-Date-in-R
- How-to-Detect-Future-Dated-Records-in-R
- How-to-Find-Records-Between-Two-Sliding-Windows-in-R
- How-to-Compute-Time-Until-Event-from-Reference-in-R
- How-to-Compute-Time-Since-Event-by-User-in-R
- How-to-Build-Cohort-by-First-Activity-Month-in-R
- How-to-Compute-Days-Active-by-User-in-R
- How-to-Compute-Inter-Event-Time-Distribution-in-R
- How-to-Build-Funnel-Time-from-Step-1-to-Step-N-in-R
- How-to-Detect-Seasonal-Holidays-from-Multi-Country-Calendar-in-R
- How-to-Convert-ISO-Week-to-Standard-Date-in-R
- How-to-Build-Time-Bucket-Labels-in-R
- How-to-Find-Birthdays-Within-Window-in-R
- How-to-Compute-Anniversary-Difference-in-R
- How-to-Compute-Working-Hour-Difference-Excluding-Nights-in-R
- How-to-Tag-Each-Record-with-Fiscal-Quarter-in-R
- How-to-Tag-Each-Record-with-Fiscal-Year-in-R
- How-to-Convert-Datetime-to-Time-of-Day-Category-in-R
- How-to-Convert-Datetime-to-Hour-Slot-Bucket-in-R
- How-to-Find-Earliest-Latest-Event-by-User-in-R
- How-to-Find-First-Activity-After-Date-in-R
- How-to-Compute-Mean-Time-Between-Failures-in-R
- How-to-Compute-Time-to-Convert-from-Signup-in-R
- How-to-Detect-Stale-Records-Older-Than-N-Days-in-R
- How-to-Snap-Datetime-to-Nearest-15-Minutes-in-R
- How-to-Compute-Calendar-Week-Number-Reset-in-Year-in-R
- How-to-Convert-Local-Times-Across-Multiple-Timezones-in-R
- How-to-Compute-Day-of-Year-from-Date-in-R
- How-to-Detect-Time-of-Day-Pattern-Customer-Behavior-in-R

## 6. Aggregations (30)

- How-to-Compute-Weighted-Mean-by-Group-in-R
- How-to-Compute-Weighted-Median-by-Group-in-R
- How-to-Compute-Trimmed-Mean-in-R
- How-to-Compute-Mode-by-Group-in-R
- How-to-Compute-Top-N-Frequency-by-Group-in-R
- How-to-Compute-Inter-Quartile-Range-by-Group-in-R
- How-to-Compute-Quantile-Range-by-Group-in-R
- How-to-Compute-Skewness-and-Kurtosis-by-Group-in-R
- How-to-Compute-Group-Coefficient-of-Variation-in-R
- How-to-Compute-Within-Group-Sum-Pct-in-R
- How-to-Compute-Group-Cumulative-Pct-in-R
- How-to-Compute-Group-Pct-of-Total-in-R
- How-to-Compute-Group-Rolling-Mean-in-R
- How-to-Compute-Group-Rolling-SD-in-R
- How-to-Compute-Cumulative-Distinct-Count-by-Group-in-R
- How-to-Compute-Group-Rate-Change-in-R
- How-to-Compute-Group-Avg-Until-Event-in-R
- How-to-Compute-Group-Conversion-Rate-in-R
- How-to-Compute-Group-Retention-Curve-in-R
- How-to-Compute-Group-Funnel-Drop-Off-in-R
- How-to-Compute-Group-Bounce-Rate-in-R
- How-to-Compute-Group-Average-Order-Value-in-R
- How-to-Compute-Group-Time-to-First-Action-in-R
- How-to-Compute-Group-Average-Tenure-in-R
- How-to-Compute-Group-Engagement-Score-in-R
- How-to-Compute-Group-Median-Salary-in-R
- How-to-Compute-Group-Pct-Above-Threshold-in-R
- How-to-Compute-Group-Lift-Over-Baseline-in-R
- How-to-Compute-Group-Variance-Across-Subgroups-in-R
- How-to-Compute-Group-Stratified-Quartiles-in-R

## 7. Joins / merge (25)

- How-to-Left-Join-Two-Data-Frames-in-R
- How-to-Inner-Join-with-Multiple-Keys-in-R
- How-to-Right-Join-with-Filter-in-R
- How-to-Full-Outer-Join-in-R
- How-to-Anti-Join-Records-Not-in-Other-in-R
- How-to-Semi-Join-Filter-by-Membership-in-R
- How-to-Cross-Join-All-Combinations-in-R
- How-to-Asof-Join-Latest-Record-Before-Date-in-R
- How-to-Range-Join-Find-Matching-Range-in-R
- How-to-Fuzzy-Join-on-String-Distance-in-R
- How-to-Join-on-Inequality-in-R
- How-to-Join-Multiple-Data-Frames-Sequentially-in-R
- How-to-Conditional-Join-with-Custom-Predicate-in-R
- How-to-Update-Records-via-Join-in-R
- How-to-Detect-Many-to-Many-Join-in-R
- How-to-Validate-One-to-One-Relationship-in-R
- How-to-Resolve-Duplicate-Keys-Before-Join-in-R
- How-to-Cascade-Join-Through-Lookup-Tables-in-R
- How-to-Join-Tables-with-Different-Column-Names-in-R
- How-to-Combine-Mismatched-Column-Sets-in-R
- How-to-Join-Wide-Table-with-Long-Lookup-in-R
- How-to-Self-Join-for-Hierarchy-in-R
- How-to-Join-with-NULL-Handling-in-R
- How-to-Compare-Two-Data-Frames-Row-by-Row-in-R
- How-to-Join-Time-Series-on-Nearest-Date-in-R

## 8. Reshape (20)

- How-to-Pivot-Long-to-Wide-with-One-Value-in-R
- How-to-Pivot-Long-to-Wide-with-Multiple-Values-in-R
- How-to-Pivot-Wide-to-Long-Selecting-Columns-in-R
- How-to-Reshape-with-Multiple-Pivot-Keys-in-R
- How-to-Stack-Several-Columns-into-One-Long-in-R
- How-to-Unstack-One-Column-into-Several-in-R
- How-to-Reshape-Wide-Survey-Data-to-Long-in-R
- How-to-Reshape-Time-Series-Wide-to-Long-in-R
- How-to-Pivot-with-Aggregation-Function-in-R
- How-to-Pivot-and-Spread-with-Conflict-Resolution-in-R
- How-to-Nest-Data-by-Group-in-R
- How-to-Unnest-List-Columns-in-R
- How-to-Unnest-Wider-Named-List-Columns-in-R
- How-to-Pack-Multiple-Columns-into-List-Column-in-R
- How-to-Unpack-List-Column-into-Multiple-Columns-in-R
- How-to-Reshape-Crosstab-Back-to-Long-in-R
- How-to-Reshape-from-Records-to-Cube-in-R
- How-to-Reshape-Cube-to-Records-in-R
- How-to-Reshape-Survey-with-Multiple-Response-Items-in-R
- How-to-Reshape-Hierarchical-JSON-to-Tabular-in-R

## 9. Sampling (20)

- How-to-Take-Random-Sample-of-N-Rows-in-R
- How-to-Take-Random-Fraction-Sample-in-R
- How-to-Take-Stratified-Sample-by-Group-in-R
- How-to-Take-Weighted-Sample-in-R
- How-to-Take-Without-Replacement-Sample-in-R
- How-to-Bootstrap-Sample-with-Replacement-in-R
- How-to-Generate-K-Fold-Indices-in-R
- How-to-Generate-Time-Series-CV-Indices-in-R
- How-to-Generate-Group-K-Fold-Indices-in-R
- How-to-Generate-Repeated-K-Fold-Indices-in-R
- How-to-Generate-Hold-Out-Indices-Reproducibly-in-R
- How-to-Sample-from-Imbalanced-Classes-in-R
- How-to-Up-Sample-Minority-Class-in-R
- How-to-Down-Sample-Majority-Class-in-R
- How-to-Apply-SMOTE-Synthetic-Sampling-in-R
- How-to-Sample-Time-Series-with-Time-Aware-Window-in-R
- How-to-Sample-from-Stream-Reservoir-in-R
- How-to-Generate-Permutation-Test-Indices-in-R
- How-to-Sample-from-Markov-Chain-in-R
- How-to-Sample-from-Posterior-via-Importance-Sampling-in-R

## 10. Visualization (80)

ggplot basics (15):
- How-to-Add-Title-Subtitle-Caption-in-ggplot2
- How-to-Change-Axis-Labels-in-ggplot2
- How-to-Rotate-X-Axis-Labels-in-ggplot2
- How-to-Format-Y-Axis-as-Currency-in-ggplot2
- How-to-Format-Y-Axis-as-Percent-in-ggplot2
- How-to-Reorder-Bars-by-Value-in-ggplot2
- How-to-Color-Bars-by-Group-in-ggplot2
- How-to-Add-Reference-Line-in-ggplot2
- How-to-Add-Annotation-Text-in-ggplot2
- How-to-Add-Trend-Line-Smooth-in-ggplot2
- How-to-Hide-Legend-in-ggplot2
- How-to-Move-Legend-Position-in-ggplot2
- How-to-Combine-Multiple-Plots-in-ggplot2
- How-to-Save-Plot-at-Specific-DPI-in-ggplot2
- How-to-Make-Plot-Background-Transparent-in-ggplot2

Specific plot types (35) and customization (15) and interactive (8) and animation (7) — listed below.

Specific plots (35):
- How-to-Make-Stacked-Bar-Show-Pct-in-R
- How-to-Make-Diverging-Bar-Chart-in-R
- How-to-Make-Lollipop-Chart-in-R
- How-to-Make-Cleveland-Dot-Plot-in-R
- How-to-Make-Slope-Chart-in-R
- How-to-Make-Density-Plot-with-Multiple-Groups-in-R
- How-to-Make-Ridgeline-Plot-in-R
- How-to-Make-Violin-Plot-with-Boxplot-Inside-in-R
- How-to-Make-Bubble-Chart-with-Size-Legend-in-R
- How-to-Make-Hexbin-Plot-in-R
- How-to-Make-Pairs-Plot-with-ggpairs-in-R
- How-to-Make-Correlogram-with-Numbers-in-R
- How-to-Make-Heatmap-with-Annotations-in-R
- How-to-Make-Calendar-Heatmap-in-R
- How-to-Make-Treemap-with-Labels-in-R
- How-to-Make-Sankey-Diagram-in-R
- How-to-Make-Alluvial-Plot-in-R
- How-to-Make-Waffle-Chart-in-R
- How-to-Make-Radar-Chart-in-R
- How-to-Make-Mosaic-Plot-in-R
- How-to-Make-Funnel-Chart-in-R
- How-to-Make-Forest-Plot-in-R
- How-to-Make-Coefficient-Plot-in-R
- How-to-Make-Q-Q-Plot-in-R
- How-to-Make-ROC-Curve-Plot-in-R
- How-to-Make-PR-Curve-Plot-in-R
- How-to-Make-Calibration-Plot-in-R
- How-to-Make-Lift-Chart-in-R
- How-to-Make-Survival-Curve-Kaplan-Meier-in-R
- How-to-Make-Cumulative-Hazard-Plot-in-R
- How-to-Make-Choropleth-Map-of-US-States-in-R
- How-to-Make-Choropleth-Map-of-Counties-in-R
- How-to-Make-Bubble-Map-with-Cities-in-R
- How-to-Make-Network-Force-Directed-in-R
- How-to-Make-Chord-Diagram-in-R

Customization (15):
- How-to-Use-Custom-Color-Palette-in-ggplot2
- How-to-Use-Viridis-Palette-in-ggplot2
- How-to-Use-Brewer-Palette-in-ggplot2
- How-to-Use-Custom-Font-in-ggplot2
- How-to-Add-Logo-Watermark-in-ggplot2
- How-to-Use-Theme-Economist-Style-in-ggplot2
- How-to-Use-Theme-FiveThirtyEight-in-ggplot2
- How-to-Use-Theme-Tufte-Style-in-ggplot2
- How-to-Modify-Strip-Background-Color-in-ggplot2
- How-to-Modify-Panel-Spacing-in-ggplot2
- How-to-Use-Free-Y-Axis-in-Facets-in-ggplot2
- How-to-Modify-Tick-Marks-in-ggplot2
- How-to-Use-Log-Axis-with-Pretty-Breaks-in-ggplot2
- How-to-Use-Date-Breaks-Custom-in-ggplot2
- How-to-Style-Confidence-Band-Color-in-ggplot2

Interactive (8):
- How-to-Convert-ggplot-to-plotly-in-R
- How-to-Make-Interactive-Map-with-Leaflet-in-R
- How-to-Make-Hover-Tooltip-in-plotly-in-R
- How-to-Make-Filter-Dropdown-in-Shiny-Plot-in-R
- How-to-Make-Reactive-Plot-Based-on-Date-Range-in-Shiny-in-R
- How-to-Make-Click-Linked-Plots-in-crosstalk-in-R
- How-to-Embed-plotly-in-R-Markdown-Output-in-R
- How-to-Render-Map-Tiles-from-Custom-Source-in-leaflet-in-R

Animation (7):
- How-to-Animate-Bar-Chart-Race-in-R
- How-to-Animate-Time-Series-Line-Plot-in-R
- How-to-Animate-Scatter-Plot-by-Year-in-R
- How-to-Animate-Map-Diffusion-in-R
- How-to-Save-Animation-as-GIF-in-R
- How-to-Save-Animation-as-MP4-in-R
- How-to-Make-Animation-with-Tween-Frames-in-R

## 11. Modeling (60)

Linear / GLM (15):
- How-to-Fit-Linear-Regression-in-R
- How-to-Fit-Multiple-Regression-with-Interaction-in-R
- How-to-Fit-Polynomial-Regression-in-R
- How-to-Fit-Stepwise-Regression-in-R
- How-to-Fit-Ridge-Regression-in-R
- How-to-Fit-Lasso-Regression-in-R
- How-to-Fit-Elastic-Net-Regression-in-R
- How-to-Fit-Logistic-Regression-Binary-in-R
- How-to-Fit-Multinomial-Logistic-Regression-in-R
- How-to-Fit-Ordinal-Logistic-Regression-in-R
- How-to-Fit-Poisson-Regression-in-R
- How-to-Fit-Negative-Binomial-Regression-in-R
- How-to-Fit-Gamma-GLM-in-R
- How-to-Fit-Quasi-Poisson-GLM-in-R
- How-to-Fit-Beta-Regression-in-R

Mixed / GAM (10):
- How-to-Fit-Linear-Mixed-Effects-Model-in-R
- How-to-Fit-Generalized-Linear-Mixed-Model-in-R
- How-to-Fit-Random-Slope-Model-in-R
- How-to-Fit-Crossed-Random-Effects-in-R
- How-to-Fit-Nested-Random-Effects-in-R
- How-to-Fit-GAM-Smooths-in-R
- How-to-Fit-GAMM-Mixed-GAM-in-R
- How-to-Fit-Bayesian-LMM-with-brms-in-R
- How-to-Fit-Repeated-Measures-Mixed-Model-in-R
- How-to-Fit-Hierarchical-Model-with-Group-Level-Predictors-in-R

Trees / boosting (10):
- How-to-Fit-Decision-Tree-with-rpart-in-R
- How-to-Fit-Random-Forest-with-ranger-in-R
- How-to-Fit-XGBoost-Classification-in-R
- How-to-Fit-XGBoost-Regression-in-R
- How-to-Fit-LightGBM-in-R
- How-to-Fit-CatBoost-in-R
- How-to-Fit-AdaBoost-in-R
- How-to-Fit-Gradient-Boosting-with-gbm-in-R
- How-to-Fit-Bagged-Trees-in-R
- How-to-Fit-Bayesian-Additive-Regression-Trees-BART-in-R

Survival / time series (10):
- How-to-Fit-Cox-PH-Survival-Model-in-R
- How-to-Fit-Parametric-Survival-Model-in-R
- How-to-Fit-Stratified-Cox-Model-in-R
- How-to-Fit-Time-Varying-Cox-Model-in-R
- How-to-Fit-Competing-Risks-Model-in-R
- How-to-Fit-ARIMA-with-auto-arima-in-R
- How-to-Fit-ETS-Forecast-in-R
- How-to-Fit-Prophet-with-Holidays-in-R
- How-to-Fit-VAR-Model-in-R
- How-to-Fit-State-Space-Model-with-KFAS-in-R

Bayesian / specialty (15):
- How-to-Fit-Bayesian-Linear-Regression-with-rstanarm-in-R
- How-to-Fit-Bayesian-Logistic-with-brms-in-R
- How-to-Fit-Bayesian-A-B-Test-in-R
- How-to-Fit-Hierarchical-Bayesian-Model-in-R
- How-to-Fit-Mixture-Model-with-EM-in-R
- How-to-Fit-Hidden-Markov-Model-in-R
- How-to-Fit-Multinomial-Naive-Bayes-in-R
- How-to-Fit-Gaussian-Naive-Bayes-in-R
- How-to-Fit-K-Nearest-Neighbor-in-R
- How-to-Fit-Linear-Discriminant-Analysis-in-R
- How-to-Fit-Quadratic-Discriminant-Analysis-in-R
- How-to-Fit-Support-Vector-Machine-in-R
- How-to-Fit-Multilayer-Perceptron-with-keras-in-R
- How-to-Fit-Topic-Model-with-LDA-in-R
- How-to-Fit-Word2Vec-Embedding-in-R

## 12. Diagnostics (30)

- How-to-Check-Linear-Regression-Assumptions-in-R
- How-to-Check-Homoscedasticity-with-Plot-in-R
- How-to-Test-Normality-of-Residuals-in-R
- How-to-Plot-Cooks-Distance-in-R
- How-to-Detect-Influential-Observations-in-R
- How-to-Compute-VIF-for-Multicollinearity-in-R
- How-to-Detect-Multicollinearity-in-R
- How-to-Plot-Residuals-vs-Fitted-in-R
- How-to-Plot-Q-Q-Plot-of-Residuals-in-R
- How-to-Plot-Scale-Location-Diagnostic-in-R
- How-to-Test-Autocorrelation-Durbin-Watson-in-R
- How-to-Test-Heteroscedasticity-Breusch-Pagan-in-R
- How-to-Test-White-Test-for-Heteroscedasticity-in-R
- How-to-Plot-Partial-Residuals-in-R
- How-to-Plot-Added-Variable-Plot-in-R
- How-to-Compute-Leverage-and-Hat-Values-in-R
- How-to-Plot-Standardized-Residuals-in-R
- How-to-Plot-Studentized-Residuals-in-R
- How-to-Plot-DFFITS-in-R
- How-to-Plot-DFBETAS-in-R
- How-to-Diagnose-Logistic-Regression-Hosmer-Lemeshow-in-R
- How-to-Diagnose-GLM-via-Deviance-Residuals-in-R
- How-to-Diagnose-Mixed-Model-Random-Effects-in-R
- How-to-Diagnose-Time-Series-Residual-ACF-PACF-in-R
- How-to-Diagnose-MCMC-Trace-and-Rhat-in-R
- How-to-Diagnose-Posterior-Predictive-Check-in-R
- How-to-Diagnose-Survival-Schoenfeld-Residuals-in-R
- How-to-Plot-Calibration-of-Logistic-Model-in-R
- How-to-Diagnose-XGBoost-Feature-Importance-in-R
- How-to-Diagnose-Random-Forest-OOB-Error-in-R

## 13. Validation (25)

- How-to-Split-Train-Test-Reproducibly-in-R
- How-to-Run-K-Fold-Cross-Validation-in-R
- How-to-Run-Stratified-K-Fold-CV-in-R
- How-to-Run-Repeated-K-Fold-CV-in-R
- How-to-Run-Time-Series-Rolling-CV-in-R
- How-to-Run-Group-K-Fold-CV-in-R
- How-to-Run-Nested-CV-for-Tuning-and-Evaluation-in-R
- How-to-Run-Leave-One-Out-CV-in-R
- How-to-Run-Bootstrap-Validation-in-R
- How-to-Run-Out-of-Time-Validation-in-R
- How-to-Run-Train-Validation-Test-Split-in-R
- How-to-Compare-Models-Across-CV-Folds-in-R
- How-to-Compute-CV-Metric-Confidence-Interval-in-R
- How-to-Compute-Statistical-Test-on-CV-Differences-in-R
- How-to-Detect-Train-Test-Distribution-Drift-in-R
- How-to-Detect-Target-Leakage-During-CV-in-R
- How-to-Validate-Time-Series-Forecast-Across-Horizons-in-R
- How-to-Use-Walk-Forward-Validation-in-R
- How-to-Backtest-Trading-Strategy-in-R
- How-to-Compute-Sharpe-Ratio-on-Backtest-in-R
- How-to-Compute-Probabilistic-Forecast-CRPS-in-R
- How-to-Validate-Calibration-on-Probabilistic-Forecast-in-R
- How-to-Validate-A-B-Test-with-Bootstrap-in-R
- How-to-Run-Pre-Test-Power-Analysis-in-R
- How-to-Run-Post-Hoc-Power-Analysis-in-R

## 14. Tuning (20)

- How-to-Tune-Hyperparameters-with-Grid-Search-in-R
- How-to-Tune-Hyperparameters-with-Random-Search-in-R
- How-to-Tune-with-Bayesian-Optimization-in-R
- How-to-Tune-XGBoost-with-Tidymodels-in-R
- How-to-Tune-Random-Forest-with-Tidymodels-in-R
- How-to-Tune-glmnet-Lambda-with-Tidymodels-in-R
- How-to-Tune-Lasso-Mixture-with-Tidymodels-in-R
- How-to-Tune-SVM-Cost-and-Gamma-in-R
- How-to-Tune-KNN-K-with-Cross-Validation-in-R
- How-to-Tune-Caret-with-trainControl-in-R
- How-to-Tune-LightGBM-via-mlr3-in-R
- How-to-Tune-Time-Series-Forecast-Hyperparameters-in-R
- How-to-Tune-with-ANOVA-Race-in-R
- How-to-Tune-with-Win-Loss-Race-in-R
- How-to-Tune-with-Simulated-Annealing-in-R
- How-to-Use-Latin-Hypercube-Grid-in-R
- How-to-Use-Max-Entropy-Grid-in-R
- How-to-Tune-with-Iterative-Halving-in-R
- How-to-Tune-Ensemble-Stacking-Weights-in-R
- How-to-Tune-Hyperparameters-Across-Multiple-Metrics-in-R

## 15. Export (20)

- How-to-Export-Data-Frame-to-CSV-in-R
- How-to-Export-Data-Frame-to-Excel-Multi-Sheet-in-R
- How-to-Export-Plot-to-PDF-in-R
- How-to-Export-Plot-to-PNG-Hi-Res-in-R
- How-to-Export-Plot-to-SVG-in-R
- How-to-Export-Plot-to-EMF-Vector-Windows-in-R
- How-to-Export-Multiple-Plots-to-Single-PDF-in-R
- How-to-Export-Table-to-Word-via-flextable-in-R
- How-to-Export-Table-to-Excel-Styled-in-R
- How-to-Export-Table-to-HTML-via-gt-in-R
- How-to-Export-Table-to-LaTeX-via-kableExtra-in-R
- How-to-Export-Markdown-Report-to-PDF-via-Quarto-in-R
- How-to-Export-R-Markdown-to-Word-with-Reference-Doc-in-R
- How-to-Export-Compressed-RDS-File-in-R
- How-to-Export-Parquet-File-in-R
- How-to-Export-JSON-with-Pretty-Print-in-R
- How-to-Export-To-Database-with-DBI-in-R
- How-to-Export-Animated-GIF-from-gganimate-in-R
- How-to-Export-Cookbook-of-Reusable-Plot-Themes-in-R
- How-to-Export-Pickled-Trained-Model-Compatible-with-Python-in-R

## 16. Reporting (25)

- How-to-Build-Parameterized-R-Markdown-Report-in-R
- How-to-Build-Quarto-Document-from-Multiple-Files-in-R
- How-to-Embed-Code-Output-Side-by-Side-in-Quarto-in-R
- How-to-Hide-Code-Show-Output-Only-in-R-Markdown-in-R
- How-to-Caption-Figures-and-Tables-in-Quarto-in-R
- How-to-Cross-Reference-Figures-in-Quarto-in-R
- How-to-Number-Sections-Automatically-in-R-Markdown-in-R
- How-to-Use-Bibliography-with-Quarto-in-R
- How-to-Use-Custom-CSL-Citation-Style-in-Quarto-in-R
- How-to-Generate-Multiple-PDFs-from-One-Template-in-R
- How-to-Build-Dashboard-with-flexdashboard-in-R
- How-to-Build-Dashboard-with-quarto-Dashboards-in-R
- How-to-Build-Reproducible-Newsletter-from-R-in-R
- How-to-Build-Slide-Deck-with-xaringan-in-R
- How-to-Build-Slide-Deck-with-Quarto-Reveal-in-R
- How-to-Build-Book-with-bookdown-in-R
- How-to-Build-Book-with-quarto-book-in-R
- How-to-Embed-Interactive-Plot-in-PDF-via-Quarto-in-R
- How-to-Embed-Math-Equations-with-MathJax-in-R-Markdown-in-R
- How-to-Style-gt-Table-with-Custom-Theme-in-R
- How-to-Style-flextable-with-Conditional-Formatting-in-R
- How-to-Use-Tables-with-Footnotes-in-R-Markdown-in-R
- How-to-Add-Watermark-to-PDF-Report-in-R
- How-to-Number-Pages-of-Quarto-PDF-in-R
- How-to-Generate-Report-Daily-via-Cron-in-R

## 17. Debugging (15)

- How-to-Use-browser-to-Debug-in-R
- How-to-Use-traceback-After-Error-in-R
- How-to-Use-debugonce-on-Function-in-R
- How-to-Use-Recover-on-Error-in-R
- How-to-Use-options-error-recover-in-R
- How-to-Locate-Source-of-Error-in-Pipe-in-R
- How-to-Step-Into-Tidyverse-Function-in-R
- How-to-Debug-Within-Apply-Family-in-R
- How-to-Debug-Within-purrr-map-in-R
- How-to-Print-Variables-with-print-and-cat-in-R
- How-to-Use-print-with-glue-for-Format-in-R
- How-to-Use-rlang-abort-with-Custom-Class-in-R
- How-to-Catch-Specific-Errors-in-R
- How-to-Continue-on-Error-via-tryCatch-in-R
- How-to-Use-withCallingHandlers-for-Logging-in-R

## 18. Performance (25)

- How-to-Profile-R-Code-with-profvis-in-R
- How-to-Profile-Memory-Usage-in-R
- How-to-Vectorize-a-For-Loop-in-R
- How-to-Replace-Loop-with-apply-Family-in-R
- How-to-Use-data-table-for-Speed-in-R
- How-to-Speed-Up-CSV-Read-with-fread-in-R
- How-to-Speed-Up-CSV-Read-with-vroom-in-R
- How-to-Use-Parallel-Apply-with-future-apply-in-R
- How-to-Run-Code-in-Parallel-via-furrr-in-R
- How-to-Use-Multi-Core-on-Windows-via-future-cluster-in-R
- How-to-Use-foreach-with-doparallel-in-R
- How-to-Cache-Function-Output-with-memoise-in-R
- How-to-Speed-Up-Loop-with-Rcpp-in-R
- How-to-Convert-Bottleneck-Function-to-cpp-in-R
- How-to-Avoid-Copy-on-Modify-with-data-table-in-R
- How-to-Use-Compiled-Functions-via-compiler-in-R
- How-to-Reduce-Memory-with-bit64-Integer-in-R
- How-to-Use-arrow-for-Out-of-Memory-Data-in-R
- How-to-Use-disk-frame-for-Larger-Than-RAM-in-R
- How-to-Speed-Up-ggplot-with-data-Reduction-in-R
- How-to-Speed-Up-Plot-Render-with-fst-Cache-in-R
- How-to-Replace-Repeated-Subsetting-with-Vectorized-Lookup-in-R
- How-to-Reduce-File-Size-with-RDS-Compression-in-R
- How-to-Detect-Slow-Steps-via-Tic-Toc-in-R
- How-to-Benchmark-Functions-with-microbenchmark-in-R

## 19. Reproducibility (15)

- How-to-Use-renv-for-Project-Dependencies-in-R
- How-to-Snapshot-Package-Versions-with-renv-in-R
- How-to-Restore-renv-Lockfile-in-R
- How-to-Set-Reproducible-Seeds-in-R
- How-to-Generate-sessionInfo-Report-in-R
- How-to-Save-Container-Image-with-Dockerfile-for-R-in-R
- How-to-Use-rocker-Tidyverse-Image-in-R
- How-to-Pin-R-Version-with-rig-in-R
- How-to-Document-Required-System-Libraries-in-R
- How-to-Use-Quarto-Freeze-for-Reproducible-Docs-in-R
- How-to-Use-targets-for-Reproducible-Pipelines-in-R
- How-to-Use-make-with-R-Scripts-in-R
- How-to-Cache-Expensive-Computations-with-targets-in-R
- How-to-Capture-Build-Provenance-with-renv-and-Git-in-R
- How-to-Validate-Reproducibility-Across-Operating-Systems-in-R

## 20. File system (15)

- How-to-List-Files-in-Folder-Recursively-in-R
- How-to-List-Files-Matching-Pattern-in-R
- How-to-Copy-Files-Across-Folders-in-R
- How-to-Move-Rename-Files-in-R
- How-to-Delete-Files-Safely-in-R
- How-to-Create-Nested-Directories-in-R
- How-to-Get-Absolute-vs-Relative-Path-in-R
- How-to-Normalize-File-Path-Cross-Platform-in-R
- How-to-Read-Each-File-in-Folder-and-Combine-in-R
- How-to-Watch-Folder-for-New-Files-in-R
- How-to-Get-File-Info-Size-Modified-in-R
- How-to-Compute-File-Checksum-MD5-in-R
- How-to-Zip-and-Unzip-Files-in-R
- How-to-Stream-Read-Large-File-Line-by-Line-in-R
- How-to-Atomic-Write-File-Safely-in-R

## 21. API / web (15)

- How-to-Make-GET-Request-with-httr2-in-R
- How-to-Make-POST-Request-with-JSON-Body-in-R
- How-to-Authenticate-with-Bearer-Token-in-R
- How-to-Authenticate-with-OAuth2-in-R
- How-to-Handle-Rate-Limiting-with-Backoff-in-R
- How-to-Cache-API-Responses-with-httr2-Cache-in-R
- How-to-Paginate-API-Results-Until-Empty-in-R
- How-to-Parse-JSON-Response-with-jsonlite-in-R
- How-to-Submit-Form-with-rvest-Session-in-R
- How-to-Scrape-Table-from-HTML-Page-in-R
- How-to-Scrape-Multiple-Pages-with-Sleep-in-R
- How-to-Render-JavaScript-Page-with-chromote-in-R
- How-to-Build-REST-API-with-plumber-in-R
- How-to-Build-Webhook-Listener-in-R
- How-to-Stream-Server-Sent-Events-in-R
