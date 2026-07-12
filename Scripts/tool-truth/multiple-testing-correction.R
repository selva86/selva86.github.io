# ============================================================================
# Ground truth for the Multiple Testing Correction tool.
# Arbiter: stats::p.adjust() in base R 4.6.0. No extra packages needed.
#
# Emits Scripts/tool-truth/multiple-testing-correction.json : an array of cases,
# each carrying the raw p-vector, the family-size argument n, and the FULL
# adjusted-p vector for every method p.adjust supports:
#   bonferroni, holm, hochberg, hommel, BH, BY
# plus rejection counts at three alphas so the page E2E can assert the headline.
#
# Run:  "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/multiple-testing-correction.R
# ============================================================================

suppressWarnings(suppressMessages(library(jsonlite)))

METHODS <- c("bonferroni", "holm", "hochberg", "hommel", "BH", "BY")
ALPHAS  <- c(0.01, 0.05, 0.10)

cases <- list()

add <- function(label, p, n = length(p)) {
  adj <- lapply(METHODS, function(m) as.numeric(p.adjust(p, method = m, n = n)))
  names(adj) <- METHODS
  # rejection counts per method per alpha
  rej <- lapply(ALPHAS, function(a) {
    sapply(METHODS, function(m) sum(adj[[m]] <= a))
  })
  names(rej) <- sprintf("a%s", ALPHAS)
  cs <- list(
    label = label,
    p = I(as.numeric(p)),          # I() keeps length-1 vectors as JSON arrays
    n = as.integer(n),
    m_auto = length(p)
  )
  for (m in METHODS) cs[[m]] <- I(adj[[m]])
  cs$rejected <- rej
  cases[[length(cases) + 1L]] <<- cs
  invisible(NULL)
}

# ---- canonical / scenario vectors -----------------------------------------
add("textbook10",
    c(0.001, 0.008, 0.039, 0.041, 0.042, 0.06, 0.074, 0.205, 0.212, 0.216))
add("genes20",
    c(0.000001, 0.00003, 0.00012, 0.00067, 0.00134, 0.00301, 0.00521, 0.00897,
      0.01345, 0.02134, 0.03234, 0.04521, 0.05789, 0.07823, 0.10456, 0.14321,
      0.20987, 0.31245, 0.45678, 0.61234))
add("abc10",
    c(0.0023, 0.0089, 0.0145, 0.0312, 0.0489, 0.061, 0.087, 0.121, 0.18, 0.34))
add("pairwise15",
    c(0.001, 0.008, 0.012, 0.024, 0.034, 0.045, 0.061, 0.079, 0.102, 0.134,
      0.178, 0.215, 0.298, 0.412, 0.567))

# ---- tiny families & boundaries -------------------------------------------
add("single",        c(0.03))
add("single_zero",   c(0))
add("single_one",    c(1))
add("two",           c(0.01, 0.04))
add("two_equal",     c(0.02, 0.02))
add("three",         c(0.005, 0.02, 0.5))
add("three_rev",     c(0.5, 0.02, 0.005))

# ---- ties, zeros, ones ----------------------------------------------------
add("ties_block",    c(0.02, 0.02, 0.02, 0.5))
add("all_equal5",    c(0.04, 0.04, 0.04, 0.04, 0.04))
add("zeros_ones",    c(0, 0, 0.5, 1, 1))
add("with_zero",     c(0, 0.001, 0.01, 0.2, 0.9))
add("near_one",      c(0.9, 0.95, 0.99, 1.0))
add("dup_and_zero",  c(0, 0.01, 0.01, 0.03, 0.03, 0.7))

# ---- extreme magnitudes ---------------------------------------------------
add("tiny",          c(1e-8, 1e-6, 1e-4, 0.5))
add("wide_range",    c(1e-12, 1e-6, 0.001, 0.05, 0.5, 0.999))

# ---- family-size (n) override: n > length(p) ------------------------------
add("override_5_of_20", c(0.001, 0.004, 0.01, 0.03, 0.06), n = 20)
add("override_3_of_10", c(0.002, 0.02, 0.2),                n = 10)
add("override_1_of_50", c(0.0004),                          n = 50)

# ---- seeded random vectors of several sizes -------------------------------
set.seed(20260713)
for (sz in c(3, 5, 7, 12, 30, 50, 100)) {
  # a realistic screen: a slug of small p's under the null-ish tail
  p <- sort(c(runif(max(1, round(sz * 0.25)), 0, 0.02),
              runif(sz - max(1, round(sz * 0.25)), 0, 1)))
  p <- round(p[seq_len(sz)], 6)
  add(sprintf("rand_%d", sz), p)
}

# ---- serialize -------------------------------------------------------------
json <- toJSON(cases, auto_unbox = TRUE, digits = NA, pretty = TRUE)
writeLines(json, "Scripts/tool-truth/multiple-testing-correction.json")
cat("Wrote", length(cases), "cases to Scripts/tool-truth/multiple-testing-correction.json\n\n")

# ---- spot checks (printed for eyeballing) ---------------------------------
p <- c(0.001, 0.008, 0.039, 0.041, 0.042, 0.06, 0.074, 0.205, 0.212, 0.216)
cat("textbook10 @ 0.05 rejections:\n")
for (m in METHODS) cat(sprintf("  %-11s %d\n", m, sum(p.adjust(p, m) <= 0.05)))
cat("\nhommel textbook10 adjusted:\n  ", paste(round(p.adjust(p, "hommel"), 5), collapse = ", "), "\n")
cat("ties_block BH:\n  ", paste(round(p.adjust(c(0.02,0.02,0.02,0.5), "BH"), 6), collapse = ", "), "\n")
cat("two hommel:\n  ", paste(round(p.adjust(c(0.01,0.04), "hommel"), 6), collapse = ", "), "\n")
