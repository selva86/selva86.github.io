# Truth table for the Mean, Median & Mode Calculator.
# Ground truth: R 4.6.0 base functions.
#   mean(x), median(x), min(x), max(x), length(x)
#   range  = max(x) - min(x)                 (the spread, a single number)
#   midrange = (min(x) + max(x)) / 2
#   skewness = g1 * ((n-1)/n)^1.5            (e1071 type 3, computed inline so
#              where g1 = m3 / m2^1.5,        no package dependency is needed)
#              m2 = mean((x-mean)^2), m3 = mean((x-mean)^3)
#   MODE: R has no built-in mode. The honest computation is
#       ux <- unique(x); tab <- tabulate(match(x, ux))
#       modeFreq <- max(tab); modeSet <- sort(ux[tab == modeFreq])
#     modeSet carries EVERY value tied at the maximum frequency (so it is
#     honest about bimodal / multimodal data and about the all-unique case,
#     where every value ties at frequency 1). The tool's display convention -
#     "no mode" when nothing repeats (modeFreq == 1 and n > 1) - is applied in
#     the Node harness, not here, since R has no such convention.
# Frequency mode: x <- rep(values, counts) then the same base functions.
# Emits mean-median-mode-calculator.json (a flat array of cases carrying the
# data so the Node harness can replay each against descriptive-math.js).

options(digits = 22)

skew3 <- function(x) {
  n <- length(x)
  if (n < 2) return(NA)
  m <- mean(x)
  m2 <- mean((x - m)^2)
  if (m2 == 0) return(NA)
  m3 <- mean((x - m)^3)
  g1 <- m3 / m2^1.5
  g1 * ((n - 1) / n)^1.5
}

jnum <- function(v) {
  if (length(v) == 0 || is.null(v)) return("null")
  if (is.na(v)) return("null")
  if (!is.finite(v)) return("null")
  formatC(v, format = "e", digits = 17)
}

jarr <- function(x) paste0("[", paste(vapply(x, jnum, ""), collapse = ","), "]")

case_json <- function(id, mode, x, values = NULL, counts = NULL) {
  n <- length(x)
  ux <- unique(x)
  tab <- tabulate(match(x, ux))
  mf <- max(tab)
  modeset <- sort(ux[tab == mf])
  fields <- c(
    paste0('"id":"', id, '"'),
    paste0('"mode":"', mode, '"'),
    paste0('"x":', jarr(x)),
    if (!is.null(values)) paste0('"values":', jarr(values)) else NULL,
    if (!is.null(counts)) paste0('"counts":', jarr(counts)) else NULL,
    paste0('"n":', n),
    paste0('"mean":', jnum(mean(x))),
    paste0('"median":', jnum(median(x))),
    paste0('"min":', jnum(min(x))),
    paste0('"max":', jnum(max(x))),
    paste0('"range":', jnum(max(x) - min(x))),
    paste0('"midrange":', jnum((min(x) + max(x)) / 2)),
    paste0('"skewness":', jnum(skew3(x))),
    paste0('"modeFreq":', mf),
    paste0('"modeSet":', jarr(modeset))
  )
  paste0("{", paste(fields, collapse = ","), "}")
}

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- case_json(...)

# ---- data mode: raw vectors ----
add("d_symmetric",  "data", c(2, 4, 4, 6, 6, 6, 8, 8, 10))          # unimodal 6, near symmetric
add("d_seq",        "data", c(1, 2, 3, 4, 5))                       # mean==median==3, no mode
add("d_exam",       "data", c(72, 85, 90, 66, 78, 95, 88, 61, 74, 80, 92, 69))  # all unique -> no mode
add("d_rightskew",  "data", c(1, 2, 2, 3, 3, 3, 4, 5, 20))          # high outlier: mean > median
add("d_leftskew",   "data", c(1, 15, 16, 17, 17, 17, 18, 19, 20))   # low outlier: mean < median
add("d_income",     "data", c(30, 32, 35, 36, 38, 40, 42, 45, 250)) # classic skewed income
add("d_bimodal",    "data", c(2, 2, 5, 5, 7))                       # bimodal {2,5}, freq 2
add("d_multimodal", "data", c(1, 1, 2, 2, 3, 3, 4))                 # trimodal {1,2,3}, freq 2
add("d_repeats",    "data", c(10, 10, 10, 20, 20, 30, 30, 30, 30, 40))  # mode 30, freq 4
add("d_neg",        "data", c(-5, -2, 0, 3, 7, -1, 4, -8, 2, -2))   # negatives, mode -2
add("d_decimal",    "data", c(1.2, 3.4, 2.2, 5.9, 4.1, 3.3, 2.8, 3.4)) # decimals, mode 3.4
add("d_const",      "data", c(5, 5, 5, 5))                          # all identical, mode 5
add("d_two",        "data", c(4, 9))                                # n = 2, no mode
add("d_one",        "data", c(7))                                   # n = 1, mode 7
add("d_grades",     "data", c(88, 92, 76, 88, 95, 88, 79, 92, 84)) # mode 88

# ---- frequency mode: rep(values, counts) ----
fq <- function(id, values, counts) add(id, "freq", rep(values, counts), values, counts)
fq("f_rating",  c(1, 2, 3, 4, 5), c(3, 7, 12, 18, 10))       # survey 1-5, mode 4
fq("f_shoe",    c(6, 7, 8, 9, 10, 11), c(2, 6, 14, 9, 4, 1)) # shoe sizes, mode 8
fq("f_defects", c(0, 1, 2, 3, 4, 5), c(40, 25, 15, 8, 3, 2)) # defect counts, mode 0 (skewed)
fq("f_tie",     c(3, 4, 5), c(8, 8, 3))                      # tie: bimodal {3,4}
fq("f_single",  c(12), c(6))                                  # all one value, mode 12

out <- paste0("[\n  ", paste(unlist(cases), collapse = ",\n  "), "\n]\n")
writeLines(out, "Scripts/tool-truth/mean-median-mode-calculator.json")
cat("wrote", length(cases), "cases\n")
