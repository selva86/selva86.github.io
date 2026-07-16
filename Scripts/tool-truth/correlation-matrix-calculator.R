# Truth table for tools/correlation-matrix-calculator.html
# Ground truth: stats::cor, Hmisc::rcorr (primary), stats::cor.test (divergence demo)
# Run: Rscript Scripts/tool-truth/correlation-matrix-calculator.R
#
# DESIGN NOTE (why rcorr and not cor.test is the p oracle for the matrix):
#   cor.test() chooses exact-vs-approximate PER PAIR based on whether that pair
#   happens to contain ties. A matrix built from it would apply different tests in
#   different cells, so cells would not be comparable to each other. rcorr applies
#   one test (the t approximation on r) uniformly to every cell. The tool matches
#   rcorr; p_tapprox below is that definition computed independently in R, and we
#   assert p_tapprox == rcorr$P wherever rcorr will run (it needs > 4 obs).
suppressMessages(library(jsonlite))
suppressMessages(library(Hmisc))

# ---- helpers ---------------------------------------------------------------

# The rcorr p-value definition, computed from scratch: two-sided t test on r
# with df = n - 2. Also returns the pairwise n matrix.
pmat_tapprox <- function(m, method) {
  k <- ncol(m)
  P <- matrix(NA_real_, k, k, dimnames = list(colnames(m), colnames(m)))
  N <- matrix(0L, k, k, dimnames = list(colnames(m), colnames(m)))
  for (i in 1:k) {
    for (j in 1:k) {
      ok <- !is.na(m[, i]) & !is.na(m[, j])
      N[i, j] <- sum(ok)
      if (i == j) next
      x <- m[ok, i]; y <- m[ok, j]
      nn <- sum(ok)
      if (nn < 3) next
      if (method == "spearman") { x <- rank(x); y <- rank(y) }
      if (length(unique(x)) < 2 || length(unique(y)) < 2) next
      r <- suppressWarnings(cor(x, y))
      if (is.na(r)) next
      if (abs(r) >= 1) { P[i, j] <- 0; next }   # t = Inf
      tt <- r * sqrt((nn - 2) / (1 - r^2))
      P[i, j] <- 2 * pt(-abs(tt), nn - 2)
    }
  }
  list(P = P, N = N)
}

# cor.test p per pair: kept ONLY to document where it diverges from the matrix.
pmat_cortest <- function(m, method) {
  k <- ncol(m)
  P <- matrix(NA_real_, k, k, dimnames = list(colnames(m), colnames(m)))
  for (i in 1:k) {
    for (j in 1:k) {
      if (i == j) next
      ok <- !is.na(m[, i]) & !is.na(m[, j])
      x <- m[ok, i]; y <- m[ok, j]
      minn <- if (method == "pearson") 3 else 2
      if (sum(ok) < minn) next
      if (length(unique(x)) < 2 || length(unique(y)) < 2) next
      ct <- tryCatch(suppressWarnings(cor.test(x, y, method = method)),
                     error = function(e) NULL)
      if (!is.null(ct)) P[i, j] <- ct$p.value
    }
  }
  P
}

as_grid <- function(M) {
  # jsonlite: matrix -> nested array, NA -> null
  lapply(seq_len(nrow(M)), function(i) unname(M[i, ]))
}

emit <- function(name, df, method, deletion, note = "") {
  m <- as.matrix(df)
  storage.mode(m) <- "double"
  use <- if (deletion == "listwise") "complete.obs" else "pairwise.complete.obs"

  mm <- m
  if (deletion == "listwise") {
    keep <- stats::complete.cases(m)
    mm <- m[keep, , drop = FALSE]
  }

  R <- tryCatch(suppressWarnings(cor(mm, method = method, use = use)),
                error = function(e) matrix(NA_real_, ncol(m), ncol(m),
                                           dimnames = list(colnames(m), colnames(m))))
  pn <- pmat_tapprox(mm, method)
  ctp <- pmat_cortest(mm, method)

  # Hmisc::rcorr on the SAME matrix the tool sees. Listwise == rcorr on the
  # row-complete submatrix, so rcorr covers both deletion modes.
  # rcorr refuses n <= 4 ("must have >4 observations") -> absent for tiny cases.
  rr <- tryCatch(suppressWarnings(rcorr(mm, type = method)), error = function(e) NULL)
  rc <- if (is.null(rr)) list(r = NA, P = NA, n = NA)
        else list(r = as_grid(rr$r), P = as_grid(rr$P), n = as_grid(rr$n))

  list(
    name = name, method = method, deletion = deletion, note = note,
    names = colnames(m),
    data = as_grid(m),
    r = as_grid(R),
    p = as_grid(pn$P),
    n = as_grid(pn$N),
    cortest_p = as_grid(ctp),
    rcorr_r = rc$r, rcorr_p = rc$P, rcorr_n = rc$n
  )
}

both <- function(name, df, note = "") {
  out <- list()
  for (meth in c("pearson", "spearman")) {
    for (del in c("pairwise", "listwise")) {
      out[[length(out) + 1]] <- emit(name, df, meth, del, note)
    }
  }
  out
}

cases <- list()
add <- function(lst) cases <<- c(cases, lst)

# ---- 1. mtcars: the demo preset, complete data, ties in hp/qsec -------------
add(both("mtcars-5col", mtcars[, c("mpg", "hp", "wt", "disp", "qsec")],
         "demo preset; complete data; ties present so Spearman uses the t approximation"))

# ---- 2. mtcars wider: 7 cols incl. discrete cyl/gear (heavy ties) ----------
add(both("mtcars-7col", mtcars[, c("mpg", "cyl", "disp", "hp", "drat", "wt", "qsec")],
         "heavy ties from cyl (3 distinct values)"))

# ---- 3. iris numeric ------------------------------------------------------
add(both("iris-4col", iris[, 1:4], "classic 4-column, n=150"))

# ---- 4. missing data: n differs per cell ----------------------------------
set.seed(101)
miss <- data.frame(
  a = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  b = c(2, 1, 4, 3, 6, 5, 8, 7, 10, 9),
  c = c(5, 3, NA, 8, 1, NA, 9, 2, 7, 4)
)
add(both("missing-3col", miss,
         "pairwise n = 10/10/8; no ties so Spearman is EXACT in cor.test but t-approx in rcorr"))

# ---- 5. missing data, ragged: every pair a different n --------------------
# Ships verbatim as the on-page "gaps" preset: a clinic table where different
# labs are missing for different patients, which is how real gaps actually look.
ragged <- data.frame(
  age     = c(34, 51, 28, NA, 45, 62, 23, 58, 39, 47, 30, NA),
  bmi     = c(NA, 27.4, 22.1, 31.0, 25.6, 29.8, 21.3, 33.2, NA, 28.1, 24.0, 26.5),
  glucose = c(88, 102, NA, 118, 95, 130, NA, 141, 91, 126, NA, 99),
  chol    = c(180, 210, 165, 240, 195, 255, 150, 268, 172, 232, 188, 205)
)
add(both("ragged-missing", ragged,
         "every pair a different n; listwise collapses to the 5 fully complete rows"))

# ---- 6. Spearman no ties, small n -> cor.test EXACT vs rcorr t-approx -----
noties <- data.frame(
  p = c(1, 2, 3, 4, 5, 6, 7, 8),
  q = c(3, 1, 2, 5, 4, 7, 6, 8),
  r = c(8, 6, 7, 4, 5, 2, 3, 1)
)
add(both("spearman-exact-n8", noties,
         "no ties, n=8 -> cor.test uses exact AS89, rcorr uses the t approximation"))

# ---- 7. explicit ties -> cor.test falls back to t-approx == rcorr ---------
tied <- data.frame(
  x = c(1, 2, 2, 3, 4, 5, 5, 6, 7, 8),
  y = c(3, 1, 4, 4, 2, 6, 5, 9, 7, 8),
  z = c(2, 2, 2, 3, 3, 4, 4, 5, 5, 9)
)
add(both("ties-3col", tied, "ties in every column; cor.test == rcorr for Spearman here"))

# ---- 8. perfect correlations: r = +1 and r = -1 ---------------------------
perfect <- data.frame(
  up   = c(1, 2, 3, 4, 5, 6),
  same = c(2, 4, 6, 8, 10, 12),
  down = c(6, 5, 4, 3, 2, 1)
)
add(both("perfect", perfect, "r = +1 and r = -1; t is infinite, p underflows to 0"))

# ---- 9. tiny n = 3 (Pearson minimum) --------------------------------------
tiny <- data.frame(a = c(1, 2, 4), b = c(2, 5, 3), c = c(9, 1, 5))
add(both("tiny-n3", tiny, "n=3: Pearson df=1, no CI"))

# ---- 10. tiny n = 4 -------------------------------------------------------
tiny4 <- data.frame(a = c(1, 2, 4, 8), b = c(2, 5, 3, 9), c = c(9, 1, 5, 4))
add(both("tiny-n4", tiny4, "n=4"))

# ---- 11. negative + near-zero mix -----------------------------------------
mixed <- data.frame(
  g = c(10, 12, 9, 14, 11, 13, 8, 15, 10.5, 12.5),
  h = c(90, 78, 96, 65, 84, 70, 105, 60, 88, 74),
  i = c(3.1, 2.9, 3.4, 3.0, 3.2, 2.8, 3.3, 3.1, 2.95, 3.05)
)
add(both("mixed-signs", mixed, "strong negative g~h, near-zero elsewhere"))

# ---- 12. two columns only (minimum matrix) --------------------------------
add(both("two-col", data.frame(a = c(1, 3, 2, 5, 4, 7, 6, 9), b = c(2, 1, 4, 3, 6, 5, 8, 7)),
         "k=2: exactly one pair, so multiple-testing correction is a no-op"))

# ---- 13. larger k (10 cols) -> 45 pairs, the multiple-testing teaching case
set.seed(7)
# Rounded to 3 dp ON PURPOSE: this matrix ships verbatim as an on-page preset,
# so the truth must be computed on exactly the digits the tool will parse.
big <- as.data.frame(round(matrix(rnorm(40 * 10), ncol = 10), 3))
names(big) <- paste0("v", 1:10)
add(both("pure-noise-10col", big,
         "10 independent noise columns -> 45 tests; some 'significant' by chance alone"))

# ---- 14. p.adjust cross-check on the noise matrix -------------------------
mnoise <- as.matrix(big)
pn <- pmat_tapprox(mnoise, "pearson")
pv <- pn$P[upper.tri(pn$P)]
padj <- list(
  pvals = unname(pv),
  bonferroni = unname(p.adjust(pv, "bonferroni")),
  holm = unname(p.adjust(pv, "holm")),
  BH = unname(p.adjust(pv, "BH")),
  n_tests = length(pv)
)

out <- list(
  generated = "correlation-matrix-calculator",
  R = R.version.string,
  cases = cases,
  padjust_noise = padj
)

writeLines(toJSON(out, digits = NA, na = "null", auto_unbox = TRUE, pretty = TRUE),
           "Scripts/tool-truth/correlation-matrix-calculator.json")
cat("cases:", length(cases), "\n")
cat("wrote Scripts/tool-truth/correlation-matrix-calculator.json\n")
