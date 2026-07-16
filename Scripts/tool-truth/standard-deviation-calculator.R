# Truth table for the Standard Deviation Calculator.
# Ground truth: R 4.6.0 base functions.
#   mean(x), sum(x), length(x)
#   var(x), sd(x)                       -> sample (denominator n - 1)
#   population variance/sd              -> sum((x-mean)^2) / n , sqrt of it
#   ss = sum((x - mean(x))^2)           -> sum of squared deviations
#   se = sd(x)/sqrt(n)                  -> standard error of the mean
#   cv = sd(x)/mean(x)                  -> coefficient of variation (sample)
#   cvPop = sdPop/mean(x)               -> population CV
# Frequency mode: x <- rep(values, counts) then the same base functions.
# Emits standard-deviation-calculator.json (a flat array of cases carrying the
# data so the Node harness can replay each against descriptive-math.js).

options(digits = 22)

pop_var <- function(x) { m <- mean(x); sum((x - m)^2) / length(x) }
pop_sd  <- function(x) sqrt(pop_var(x))
ss_of   <- function(x) { m <- mean(x); sum((x - m)^2) }

jnum <- function(v) {
  if (length(v) == 0 || is.null(v)) return("null")
  if (is.na(v)) return("null")
  if (!is.finite(v)) return("null")
  formatC(v, format = "e", digits = 17)
}

jarr <- function(x) paste0("[", paste(vapply(x, jnum, ""), collapse = ","), "]")

case_json <- function(id, mode, x, values = NULL, counts = NULL) {
  n <- length(x)
  m <- mean(x)
  v_s <- if (n >= 2) var(x) else NA
  s_s <- if (n >= 2) sd(x)  else NA
  v_p <- pop_var(x)
  s_p <- pop_sd(x)
  ss  <- ss_of(x)
  se  <- if (n >= 2) sd(x) / sqrt(n) else NA
  cv  <- if (n >= 2 && m != 0) sd(x) / mean(x) else NA
  cvp <- if (m != 0) s_p / m else NA
  fields <- c(
    paste0('"id":"', id, '"'),
    paste0('"mode":"', mode, '"'),
    paste0('"x":', jarr(x)),
    if (!is.null(values)) paste0('"values":', jarr(values)) else NULL,
    if (!is.null(counts)) paste0('"counts":', jarr(counts)) else NULL,
    paste0('"n":', n),
    paste0('"mean":', jnum(m)),
    paste0('"sum":', jnum(sum(x))),
    paste0('"min":', jnum(min(x))),
    paste0('"max":', jnum(max(x))),
    paste0('"range":', jnum(max(x) - min(x))),
    paste0('"varSample":', jnum(v_s)),
    paste0('"sdSample":', jnum(s_s)),
    paste0('"varPop":', jnum(v_p)),
    paste0('"sdPop":', jnum(s_p)),
    paste0('"ss":', jnum(ss)),
    paste0('"se":', jnum(se)),
    paste0('"cv":', jnum(cv)),
    paste0('"cvPop":', jnum(cvp))
  )
  paste0("{", paste(fields, collapse = ","), "}")
}

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- case_json(...)

# ---- data mode: raw vectors ----
add("d_small",   "data", c(4, 8, 15, 16, 23, 42))
add("d_exam",    "data", c(72, 85, 90, 66, 78, 95, 88, 61, 74, 80, 92, 69))
add("d_neg",     "data", c(-5, -2, 0, 3, 7, -1, 4, -8, 2, 6))
add("d_decimal", "data", c(1.2, 3.4, 2.2, 5.9, 4.1, 3.3, 2.8, 4.6))
add("d_returns", "data", c(0.5, -1.2, 0.8, 2.1, -0.4, 1.5, -2.3, 0.9, 1.1, -0.7, 0.3, 1.8))
add("d_rt",      "data", c(312, 289, 401, 356, 298, 377, 333, 320, 365, 344, 390, 305, 358, 329))
add("d_repeats", "data", c(10, 10, 10, 20, 20, 30, 30, 30, 30, 40))
add("d_two",     "data", c(5, 11))                 # n = 2
add("d_one",     "data", c(7))                      # n = 1 -> sample sd NA
add("d_const",   "data", c(5, 5, 5, 5, 5))          # zero variance
add("d_big",     "data", c(1000, 1500, 1200, 1800, 2100, 1350, 1750, 1600, 1900, 1450, 2050, 1250, 1550, 1700, 1400))
add("d_mixmag",  "data", c(0.001, 0.002, 100, 200, 0.0015, 150))

# ---- frequency mode: rep(values, counts) ----
fq <- function(id, values, counts) add(id, "freq", rep(values, counts), values, counts)
fq("f_rating",  c(1, 2, 3, 4, 5), c(3, 7, 12, 18, 10))       # survey 1-5
fq("f_class",   c(18, 19, 20, 21, 22), c(2, 5, 9, 4, 1))     # class sizes
fq("f_defects", c(0, 1, 2, 3, 4, 5), c(40, 25, 15, 8, 3, 2)) # defect counts
fq("f_grades",  c(60, 70, 80, 90, 100), c(4, 11, 15, 8, 2))  # grouped grades
fq("f_single",  c(12), c(6))                                  # all one value -> sd 0

out <- paste0("[\n  ", paste(unlist(cases), collapse = ",\n  "), "\n]\n")
writeLines(out, "Scripts/tool-truth/standard-deviation-calculator.json")
cat("wrote", length(cases), "cases\n")
