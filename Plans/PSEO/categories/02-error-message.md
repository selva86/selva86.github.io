# Category 02: Error Message PSEO

**Total:** 400 slugs across 7 sub-clusters
**Page template:** error text verbatim → cause → minimal reproducer → fix → prevention rule
**Word count target:** 600 to 1200
**Why low competition:** few R sites systematically index error strings; ranks within days.

URL pattern: `/Error-<short-tag>-in-R.html`

---

## 02.1 Base R errors (120)

Parent: `R-Tutorial.html`

Subscripting / indexing (15):
- Error-subscript-out-of-bounds-in-R
- Error-only-0s-may-be-mixed-with-negative-subscripts-in-R
- Error-incorrect-number-of-dimensions-in-R
- Error-undefined-columns-selected-in-R
- Error-undefined-rows-selected-in-R
- Error-invalid-subscript-type-list-in-R
- Error-NAs-not-allowed-in-subscripted-assignments-in-R
- Error-replacement-has-X-rows-data-has-Y-in-R
- Error-replacement-has-length-zero-in-R
- Error-not-a-matrix-in-R
- Error-bad-row-indexing-in-R
- Error-row-names-must-be-unique-in-R
- Error-duplicate-row-names-in-R
- Error-duplicate-subscripts-for-columns-in-R
- Error-incorrect-number-of-subscripts-on-matrix-in-R

Object not found / lookup (15):
- Error-object-of-type-closure-is-not-subsettable-in-R
- Error-unexpected-symbol-in-R
- Error-dollar-operator-is-invalid-for-atomic-vectors-in-R
- Error-object-X-not-found-in-R
- Error-could-not-find-function-X-in-R
- Error-cannot-coerce-class-to-data-frame-in-R
- Error-attempt-to-apply-non-function-in-R
- Error-attempt-to-set-an-attribute-on-NULL-in-R
- Error-cannot-add-bindings-to-a-locked-environment-in-R
- Error-attempt-to-use-zero-length-variable-name-in-R
- Error-no-applicable-method-for-X-applied-to-an-object-of-class-Y-in-R
- Error-NA-NaN-Inf-in-call-to-X-in-R
- Error-NaNs-produced-in-R
- Error-namespace-load-failed-in-R
- Error-package-X-not-found-in-R
- Error-namespace-X-not-available-in-R
- Error-there-is-no-package-called-X-in-R
- Error-package-X-not-available-for-this-version-in-R

Type / coercion (15):
- Error-non-numeric-argument-to-binary-operator-in-R
- Error-non-conformable-arguments-in-R
- Error-non-conformable-arrays-in-R
- Error-cannot-coerce-type-X-to-vector-of-type-Y-in-R
- Error-invalid-type-list-for-variable-X-in-R
- Error-character-string-is-not-in-a-standard-unambiguous-format-in-R
- Error-NAs-introduced-by-coercion-in-R
- Error-incompatible-types-from-X-to-Y-in-R
- Error-comparison-is-NA-in-R
- Error-invalid-comparison-with-complex-values-in-R
- Error-cannot-allocate-memory-block-of-size-in-R
- Error-cannot-coerce-type-builtin-to-vector-of-type-list-in-R
- Error-arguments-imply-differing-number-of-rows-in-R
- Error-cannot-have-attributes-on-a-CHARSXP-in-R
- Error-cannot-coerce-class-symbol-to-data-frame-in-R

Memory / size (10):
- Error-cannot-allocate-vector-of-size-in-R
- Error-vector-memory-exhausted-in-R
- Error-protect-stack-overflow-in-R
- Error-evaluation-nested-too-deeply-in-R
- Error-C-stack-usage-is-too-close-to-the-limit-in-R
- Error-vector-too-large-in-R
- Error-cannot-allocate-vector-of-length-NA-in-R
- Error-allocMatrix-too-many-elements-in-R
- Error-too-many-elements-specified-in-R
- Error-x-y-lengths-differ-in-R

Logical / comparison (10):
- Error-missing-value-where-TRUE-FALSE-needed-in-R
- Error-the-condition-has-length-greater-than-one-in-R
- Error-argument-is-of-length-zero-in-R
- Error-argument-is-not-interpretable-as-logical-in-R
- Error-comparison-of-these-types-is-not-implemented-in-R
- Error-NAs-in-foreign-function-call-in-R
- Error-invalid-not-equal-comparison-in-R
- Error-zero-length-input-to-which-in-R
- Error-cannot-mix-zero-length-and-other-vectors-in-R
- Error-input-string-X-is-invalid-in-this-locale-in-R

I/O (15):
- Error-cannot-open-file-X-no-such-file-or-directory-in-R
- Error-cannot-open-the-connection-in-R
- Error-incomplete-final-line-found-by-readLines-in-R
- Error-line-X-did-not-have-Y-elements-in-R
- Error-duplicate-row.names-not-allowed-in-R
- Error-more-columns-than-column-names-in-R
- Error-cannot-create-file-X-in-R
- Error-cannot-change-working-directory-in-R
- Error-no-lines-available-in-input-in-R
- Error-text-input-not-empty-but-cannot-be-converted-in-R
- Error-bad-restore-file-magic-number-in-R
- Error-could-not-find-corresponding-RNG-in-R
- Error-empty-string-supplied-as-file-name-in-R
- Error-zip-file-X-cannot-be-opened-in-R
- Error-encoding-not-supported-in-R

Function calls / arguments (10):
- Error-argument-X-is-missing-with-no-default-in-R
- Error-unused-argument-in-R
- Error-unused-arguments-in-R
- Error-formal-argument-matched-by-multiple-actual-arguments-in-R
- Error-promise-already-under-evaluation-in-R
- Error-recursive-default-argument-reference-in-R
- Error-attempt-to-replicate-an-object-of-type-language-in-R
- Error-cannot-use-this-function-on-a-data.frame-in-R
- Error-supplied-N-items-to-be-replaced-but-data-has-M-in-R
- Error-must-name-attributes-in-R

Other classics (30):
- Error-replacement-has-N-rows-data-has-M-in-R
- Error-cannot-set-row-names-on-a-tibble-in-R
- Error-arguments-have-different-lengths-in-R
- Error-system-call-failed-in-R
- Error-error-in-evaluating-the-argument-x-in-selecting-a-method-in-R
- Error-no-method-for-coercing-this-S4-class-to-a-vector-in-R
- Error-X-is-not-TRUE-in-R
- Error-X-not-equal-to-Y-in-R
- Error-non-finite-function-value-in-R
- Error-non-finite-finite-difference-value-in-R
- Error-arguments-must-have-same-length-in-R
- Error-Negative-length-vectors-are-not-allowed-in-R
- Error-cannot-take-a-sample-larger-than-the-population-in-R
- Error-undefined-S4-method-in-R
- Error-no-slot-of-name-X-for-this-object-in-R
- Error-cannot-replace-locked-binding-in-R
- Error-attempt-to-replace-locked-binding-in-R
- Error-CRAN-mirror-is-not-set-in-R
- Error-trying-to-use-CRAN-without-setting-a-mirror-in-R
- Error-Bioconductor-version-mismatch-in-R
- Error-task-not-supported-on-this-platform-in-R
- Error-OS-reports-request-to-set-locale-failed-in-R
- Error-this-S4-class-is-not-yet-defined-in-R
- Error-arguments-imply-differing-number-of-elements-in-R
- Error-could-not-find-symbol-X-in-environment-Y-in-R
- Error-cannot-coerce-NULL-to-a-data-frame-in-R
- Error-must-be-a-non-empty-character-vector-in-R
- Error-must-be-a-character-vector-not-NULL-in-R
- Error-environment-already-locked-in-R
- Error-cannot-add-row-to-empty-data-frame-in-R

## 02.2 Tidyverse errors (80)

Parent: `Data-Wrangling-With-dplyr.html`

dplyr (35):
- Error-Column-X-doesnt-exist-in-R-dplyr
- Error-must-group-by-variables-found-in-data-in-R-dplyr
- Error-cant-subset-columns-that-dont-exist-in-R-dplyr
- Error-can-not-bind-rows-not-equal-in-R-dplyr
- Error-incompatible-data-frames-different-numbers-of-columns-in-R
- Error-unequal-factor-levels-coercing-to-character-in-R-dplyr
- Error-error-in-grouped_df_impl-cannot-modify-grouping-in-R
- Error-Result-must-have-length-one-in-R-dplyr
- Error-must-be-of-size-1-or-N-in-R-dplyr
- Error-Each-row-of-output-must-be-identified-by-a-unique-combination-in-R-dplyr
- Error-cant-mutate-with-summary-functions-in-R-dplyr
- Error-supply-only-one-of-by-or-suffix-in-R-dplyr
- Error-by-must-be-supplied-when-X-and-Y-have-no-common-variables-in-R
- Error-by-cant-contain-join-column-X-which-is-missing-in-R
- Error-X-must-have-class-Y-not-Z-in-R-dplyr
- Error-can-only-coerce-classes-with-equal-length-in-R-dplyr
- Error-cant-combine-variables-different-types-in-R-dplyr
- Error-rename-error-cannot-rename-columns-with-by-clause-in-R
- Error-summarise-error-must-be-a-vector-not-NULL-in-R
- Error-arrange-error-X-must-be-a-vector-not-NULL-in-R
- Error-filter-error-X-must-be-a-logical-vector-in-R
- Error-distinct-error-X-not-found-in-R
- Error-Cannot-modify-list-element-X-due-to-error-in-R
- Error-Each-name-must-be-named-in-R-dplyr
- Error-must-not-be-named-in-R-dplyr
- Error-must-name-all-elements-in-R-dplyr
- Error-must-supply-name-when-X-is-empty-in-R-dplyr
- Error-cant-recycle-input-of-size-N-to-size-M-in-R-dplyr
- Error-must-be-named-vector-in-R-dplyr
- Error-evaluation-error-NA-NaN-or-Inf-in-X-in-R-dplyr
- Error-x-and-y-have-no-common-variables-in-R-dplyr
- Error-tibble-columns-must-have-consistent-sizes-in-R
- Error-recipes-error-could-not-find-function-X-in-R
- Error-error-in-mutate_-not-found-in-R-dplyr
- Error-rename_with-error-must-be-a-character-vector-in-R

tidyr (20):
- Error-pivot_longer-error-cant-combine-X-and-Y-different-types-in-R
- Error-pivot_wider-error-values_from-cant-have-NA-in-R
- Error-pivot_wider-error-values-are-not-uniquely-identified-in-R
- Error-separate-error-too-many-pieces-in-R
- Error-separate-error-not-enough-pieces-in-R
- Error-separate_wider_delim-error-cant-find-N-pieces-in-R
- Error-unnest-error-list-column-must-be-rectangular-in-R
- Error-unnest-error-input-must-be-a-list-in-R
- Error-nest-error-no-rows-in-grouped-data-in-R
- Error-replace_na-error-must-have-class-Y-in-R
- Error-fill-error-direction-must-be-down-up-or-downup-in-R
- Error-complete-error-NA-in-the-grouping-variable-in-R
- Error-pivot_longer-error-must-have-unique-names-in-R
- Error-tidyr-can-not-coerce-X-to-Y-in-R
- Error-spread-error-duplicate-identifiers-for-rows-in-R
- Error-gather-error-must-be-a-data-frame-in-R
- Error-tidyr-error-can-not-rename-columns-in-grouped-data-in-R
- Error-tidyr-error-X-not-supported-on-this-class-in-R
- Error-tidyr-error-extract-must-have-the-same-number-of-groups-in-R
- Error-tidyr-error-uncount-needs-non-negative-weights-in-R

purrr (15):
- Error-purrr-error-result-must-have-length-N-in-R
- Error-purrr-error-can-not-coerce-element-N-from-X-to-Y-in-R
- Error-map_dbl-error-result-N-is-not-a-length-1-numeric-vector-in-R
- Error-pmap-error-element-N-must-be-a-vector-of-length-M-in-R
- Error-purrr-error-X-must-be-a-list-not-NULL-in-R
- Error-walk-error-X-is-not-a-function-in-R
- Error-keep-error-predicate-did-not-return-a-logical-in-R
- Error-reduce-error-init-must-be-supplied-in-R
- Error-purrr-modify-error-X-cant-be-coerced-to-Y-in-R
- Error-purrr-error-element-N-of-result-is-NULL-in-R
- Error-purrr-error-cant-find-X-in-list-in-R
- Error-purrr-error-X-must-be-numeric-not-character-in-R
- Error-purrr-error-cant-recycle-X-to-size-N-in-R
- Error-pluck-error-X-doesnt-exist-in-R
- Error-purrr-error-N-failures-in-X-iterations-in-R

readr / readxl (10):
- Error-readr-error-X-rows-failed-to-parse-in-R
- Error-readr-error-line-X-expected-Y-fields-saw-Z-in-R
- Error-readr-error-cant-find-encoding-in-R
- Error-readxl-error-cant-find-sheet-X-in-R
- Error-readxl-error-skip-must-be-a-non-negative-integer-in-R
- Error-readxl-error-error-in-zip-error-in-R
- Error-haven-error-cant-coerce-labelled-class-in-R
- Error-haven-error-cant-write-large-strings-in-R
- Error-readxl-error-cant-coerce-X-to-Y-in-R
- Error-readr-error-locale-must-be-a-locale-object-in-R

## 02.3 ggplot2 errors (50)

Parent: `ggplot2-Tutorial-With-R.html`

Aesthetics / mapping (12):
- Error-ggplot2-aesthetics-must-be-either-length-1-or-the-same-as-the-data-in-R
- Error-ggplot2-X-must-be-a-vector-not-data-frame-in-R
- Error-ggplot2-cant-find-color-X-in-palette-in-R
- Error-ggplot2-X-aesthetic-not-supported-by-Y-geom-in-R
- Error-ggplot2-need-finite-X-and-Y-values-in-R
- Error-ggplot2-cant-add-X-to-plot-in-R
- Error-ggplot2-mapping-must-be-created-by-aes-in-R
- Error-ggplot2-discrete-value-supplied-to-continuous-scale-in-R
- Error-ggplot2-continuous-value-supplied-to-discrete-scale-in-R
- Error-ggplot2-X-aesthetic-must-be-numeric-in-R
- Error-ggplot2-bins-must-be-an-integer-in-R
- Error-ggplot2-binwidth-must-be-positive-in-R

Data / NA (10):
- Error-ggplot2-removed-N-rows-containing-non-finite-values-in-R
- Error-ggplot2-removed-N-rows-containing-missing-values-in-R
- Error-ggplot2-data-must-be-a-data-frame-or-other-object-coercible-in-R
- Error-ggplot2-data-must-have-at-least-one-row-in-R
- Error-ggplot2-X-not-found-in-data-in-R
- Error-ggplot2-no-data-to-plot-in-R
- Error-ggplot2-aesthetic-X-must-be-a-valid-data-column-in-R
- Error-ggplot2-cant-use-X-with-empty-data-frame-in-R
- Error-ggplot2-NA-values-in-X-removed-in-R
- Error-ggplot2-X-mapping-introduced-NAs-in-R

Scales / limits (10):
- Error-ggplot2-scale-for-X-is-already-present-in-R
- Error-ggplot2-multiple-scales-defined-for-same-aesthetic-in-R
- Error-ggplot2-X-scale-cannot-be-applied-to-Y-data-in-R
- Error-ggplot2-Transformation-X-introduced-infinite-values-in-R
- Error-ggplot2-zero-range-in-X-using-default-in-R
- Error-ggplot2-breaks-and-labels-are-different-lengths-in-R
- Error-ggplot2-X-must-be-numeric-for-Y-in-R
- Error-ggplot2-cant-find-scale-X-in-R
- Error-ggplot2-limits-of-length-N-required-not-M-in-R
- Error-ggplot2-X-scale-already-present-replacing-in-R

Geoms / stats (8):
- Error-ggplot2-geom_smooth-method-arg-X-not-recognised-in-R
- Error-ggplot2-stat_X-requires-the-Y-aesthetic-in-R
- Error-ggplot2-geom_X-requires-the-following-missing-aesthetics-in-R
- Error-ggplot2-cant-fit-X-with-N-data-points-in-R
- Error-ggplot2-must-supply-X-mapping-or-data-in-R
- Error-ggplot2-binning-failed-in-R
- Error-ggplot2-too-few-points-for-stat_X-in-R
- Error-ggplot2-stat_smooth-error-NA-NaN-or-Inf-in-foreign-function-call-in-R

Themes / save (10):
- Error-ggplot2-theme-X-must-be-an-element_X-object-in-R
- Error-ggplot2-element_X-cannot-be-applied-to-Y-in-R
- Error-ggplot2-ggsave-failed-to-save-X-in-R
- Error-ggplot2-ggsave-error-cannot-find-graphics-device-in-R
- Error-ggplot2-cannot-coerce-class-Y-into-a-ggplot-object-in-R
- Error-ggplot2-cant-find-X-font-on-system-in-R
- Error-ggplot2-X-extension-not-supported-in-R
- Error-ggplot2-Cairo-X-error-in-R
- Error-ggplot2-could-not-find-systems-fonts-in-R
- Error-ggplot2-X-fill-not-allowed-with-Y-geom-in-R

## 02.4 Modeling errors (70)

Parent: `Linear-Regression.html`, `Logistic-Regression-With-R.html`, etc.

lm / glm (20):
- Error-lm-error-NA-NaN-Inf-in-X-in-R
- Error-lm-error-singular-matrix-in-R
- Error-lm-error-0-non-NA-cases-in-R
- Error-lm-error-essentially-perfect-fit-summary-may-be-unreliable-in-R
- Error-lm-error-X-and-Y-have-different-numbers-of-rows-in-R
- Error-lm-error-X-must-have-finite-values-in-R
- Error-lm-error-no-cases-with-required-variable-in-R
- Error-lm-error-empty-model-supplied-in-R
- Error-glm-error-fitted-probabilities-numerically-0-or-1-occurred-in-R
- Error-glm-error-glm-fit-algorithm-did-not-converge-in-R
- Error-glm-error-no-valid-set-of-coefficients-found-in-R
- Error-glm-error-X-cannot-be-fit-with-Y-family-in-R
- Error-glm-error-Mu-vector-includes-Inf-values-in-R
- Error-glm-error-Mu-vector-includes-NA-values-in-R
- Error-glm-error-X-not-meaningful-for-factor-response-in-R
- Error-glm-error-iteration-limit-exceeded-in-R
- Error-glm-error-y-values-must-be-0-or-1-in-R
- Error-glm-error-y-values-must-be-non-negative-in-R
- Error-glm-error-step-factor-reduced-below-min-in-R
- Error-glm-error-X-rank-deficient-fit-may-be-misleading-in-R

lme4 / mixed (15):
- Error-lme4-error-Singular-fit-in-R
- Error-lme4-error-X-failed-to-converge-with-N-negative-eigenvalues-in-R
- Error-lme4-error-Hessian-is-numerically-singular-in-R
- Error-lme4-error-cant-find-stable-step-in-R
- Error-lme4-error-Random-effects-design-matrix-is-singular-in-R
- Error-lme4-error-some-predictor-variables-are-on-very-different-scales-in-R
- Error-lme4-error-Model-failed-to-converge-with-max-grad-N-in-R
- Error-lme4-error-Hessian-not-positive-definite-in-R
- Error-lme4-error-fixed-effect-design-matrix-rank-deficient-in-R
- Error-lme4-error-grouping-factor-must-have-N-or-more-levels-in-R
- Error-lme4-error-Number-of-levels-of-each-grouping-factor-must-be-X-in-R
- Error-lme4-error-formula-must-include-random-effects-in-R
- Error-lme4-error-X-cannot-be-fit-with-Y-family-in-R
- Error-lme4-error-X-not-defined-on-this-system-in-R
- Error-lme4-error-PIRLS-step-halvings-failed-in-R

brms / rstanarm (15):
- Error-brms-error-Stan-model-failed-to-compile-in-R
- Error-brms-error-cant-find-Stan-program-in-R
- Error-brms-error-divergent-transitions-after-warmup-in-R
- Error-brms-error-treedepth-exceeded-N-of-iterations-in-R
- Error-brms-error-energy-diagnostic-bayesian-fraction-of-missing-information-low-in-R
- Error-brms-error-Rhat-larger-than-1-05-in-R
- Error-brms-error-prior-not-specified-for-X-in-R
- Error-brms-error-stancode-error-undeclared-variable-in-R
- Error-brms-error-pp_check-error-no-posterior-samples-in-R
- Error-rstanarm-error-not-enough-iterations-to-estimate-X-in-R
- Error-rstanarm-error-stan_lm-error-prior-required-in-R
- Error-rstanarm-error-non-finite-log-likelihood-in-R
- Error-rstanarm-error-must-be-a-stan-fit-object-in-R
- Error-brms-error-Stan-failed-to-initialize-in-R
- Error-brms-error-cant-find-cmdstan-installation-in-R

survival / forecast (10):
- Error-survival-error-X-and-Y-vectors-of-unequal-length-in-R
- Error-survival-error-coxph-X-non-finite-coefficients-in-R
- Error-survival-error-Surv-cant-handle-NA-in-event-in-R
- Error-survival-error-time-must-be-non-negative-in-R
- Error-survival-error-Ran-out-of-iterations-in-R
- Error-forecast-error-frequency-larger-than-time-series-length-in-R
- Error-forecast-error-cant-handle-non-numeric-data-in-R
- Error-forecast-error-X-cannot-fit-with-Y-frequency-in-R
- Error-forecast-error-not-stationary-in-R
- Error-forecast-error-too-few-observations-in-R

caret / tidymodels (10):
- Error-caret-error-X-models-failed-during-cv-in-R
- Error-caret-error-target-variable-must-be-a-factor-in-R
- Error-caret-error-tuning-parameter-grid-should-have-columns-X-in-R
- Error-caret-error-method-X-not-recognized-in-R
- Error-caret-error-cant-have-empty-classes-in-R
- Error-tidymodels-error-mode-X-not-supported-by-engine-Y-in-R
- Error-tidymodels-error-cant-find-engine-X-for-mode-Y-in-R
- Error-tidymodels-error-could-not-find-function-fit-in-R
- Error-tidymodels-error-X-step-cant-find-Y-column-in-R
- Error-tidymodels-error-cant-recycle-X-to-Y-rows-in-R

## 02.5 I/O errors (30)

- Error-readr-cannot-open-file-X-no-such-file-or-directory-in-R
- Error-readxl-error-error-in-zip-cant-open-zip-file-in-R
- Error-readxl-error-cant-find-sheet-X-in-R
- Error-readxl-error-X-is-not-a-valid-spreadsheet-in-R
- Error-jsonlite-error-parse-error-on-line-N-in-R
- Error-jsonlite-error-not-a-named-list-in-R
- Error-jsonlite-error-trailing-data-in-R
- Error-DBI-error-cant-connect-to-database-in-R
- Error-DBI-error-cant-find-table-X-in-R
- Error-DBI-error-no-DBMSSpec-found-in-R
- Error-DBI-error-driver-not-loaded-in-R
- Error-DBI-error-Time-out-while-connecting-in-R
- Error-DBI-error-server-disconnected-in-R
- Error-DBI-error-cant-coerce-X-to-Y-in-R
- Error-arrow-error-X-is-not-a-parquet-file-in-R
- Error-arrow-error-codec-X-not-available-in-R
- Error-fst-error-X-is-not-a-fst-file-in-R
- Error-httr-error-cant-resolve-host-X-in-R
- Error-httr-error-error-handler-failed-with-status-N-in-R
- Error-httr2-error-X-not-supported-in-R
- Error-rvest-error-cant-parse-X-in-R
- Error-rvest-error-X-not-found-in-R
- Error-write-csv-cannot-create-file-X-in-R
- Error-write-csv-permission-denied-in-R
- Error-saveRDS-cannot-write-to-X-in-R
- Error-load-bad-restore-file-magic-number-in-R
- Error-readLines-incomplete-final-line-in-R
- Error-feather-X-is-not-a-feather-file-in-R
- Error-pdftools-error-cant-open-pdf-X-in-R
- Error-officer-error-cant-open-docx-X-in-R

## 02.6 Install / environment errors (30)

- Error-install-packages-X-not-available-for-this-version-of-R-in-R
- Error-install-packages-X-installation-failed-in-R
- Error-install-packages-cannot-remove-prior-installation-in-R
- Error-install-packages-X-had-non-zero-exit-status-in-R
- Error-install-packages-failed-to-create-lock-directory-in-R
- Error-install-packages-cannot-find-X-in-R
- Error-install-packages-permission-denied-in-R
- Error-install-packages-X-currently-loaded-in-R
- Error-install-packages-no-package-X-on-CRAN-in-R
- Error-install-packages-X-not-available-as-binary-in-R
- Error-install-packages-X-requires-R-version-Y-or-greater-in-R
- Error-install-packages-X-depends-on-Y-not-found-in-R
- Error-install-packages-can-not-be-installed-on-Solaris-in-R
- Error-renv-X-not-in-lockfile-in-R
- Error-renv-error-cant-restore-X-in-R
- Error-renv-error-cant-find-source-package-X-in-R
- Error-renv-error-conflicting-package-versions-in-R
- Error-devtools-error-could-not-load-package-X-in-R
- Error-devtools-error-build-failed-during-X-step-in-R
- Error-Rcpp-error-cant-find-Rcpp-h-in-R
- Error-Rtools-not-installed-or-on-PATH-in-R
- Error-Rtools-make-not-found-in-R
- Error-CRAN-mirror-not-set-please-set-options-repos-in-R
- Error-Bioconductor-version-mismatch-in-R
- Error-Bioconductor-X-not-available-for-version-Y-in-R
- Error-RStudio-X-encountered-fatal-error-in-R
- Error-RStudio-cant-find-rstudioapi-in-R
- Error-locale-cant-be-set-to-X-in-R
- Error-Sys-setlocale-OS-reports-request-to-set-locale-failed-in-R
- Error-cant-load-shared-object-X-in-R

## 02.7 Performance / memory errors (20)

- Error-cannot-allocate-vector-of-size-N-Gb-in-R
- Error-vector-memory-exhausted-limit-reached-in-R
- Error-protect-stack-overflow-in-R
- Error-evaluation-nested-too-deeply-infinite-recursion-in-R
- Error-C-stack-usage-is-too-close-to-the-limit-in-R
- Error-foreach-error-no-applicable-method-for-do-in-R
- Error-foreach-error-X-cant-find-cluster-in-R
- Error-parallel-error-cant-create-cluster-in-R
- Error-parallel-error-X-not-found-in-cluster-environment-in-R
- Error-future-error-X-cant-export-Y-bytes-in-R
- Error-future-error-cant-find-globals-X-in-R
- Error-Rcpp-error-cant-allocate-X-in-R
- Error-cant-find-X-in-globalenv-during-parallel-in-R
- Error-out-of-memory-X-in-R
- Error-too-many-open-files-in-R
- Error-system-cant-fork-process-in-R
- Error-system-resource-limit-X-exceeded-in-R
- Error-cant-write-X-to-disk-disk-full-in-R
- Error-X-cant-be-handled-in-32-bit-R
- Error-data.table-cant-allocate-Y-bytes-on-windows-in-R
