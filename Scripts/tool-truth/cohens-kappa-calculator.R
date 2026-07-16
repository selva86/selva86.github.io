# Truth table for cohens-kappa-calculator
# Ground truth: psych::cohen.kappa (internal cohen.kappa1) on R 4.6.x.
# Reproduces, for each case: observed/expected agreement (po, pc), unweighted
# Cohen's kappa, linear- and quadratic-weighted kappa, the Fleiss-Cohen-Everitt
# variances (Vark unweighted, Varkw for each weight), SE = sqrt(var), and the
# normal-approx confidence bounds at alpha = .10/.05/.01 (clamped to [-1,1]).
suppressWarnings(suppressMessages(library(psych)))

ck1 <- get("cohen.kappa1", envir = asNamespace("psych"))

# All quantities for one count matrix m at one alpha, plus both weightings.
analyze <- function(m, alpha) {
  m <- as.matrix(m)
  N <- sum(m)
  p <- m / N
  rs <- rowSums(p); cs <- colSums(p)
  po <- sum(diag(p))
  pc <- sum(rs * cs)
  len <- nrow(m)

  wlin <- 1 - abs(outer(1:len, 1:len, "-")) / (len - 1)
  wquad <- 1 - (outer(1:len, 1:len, "-"))^2 / (len - 1)^2
  wpo_l <- sum(wlin * p); wpc_l <- sum(wlin * (rs %o% cs))
  wpo_q <- sum(wquad * p); wpc_q <- sum(wquad * (rs %o% cs))

  r1 <- ck1(m, w.exp = 1, alpha = alpha)   # unweighted + linear
  r2 <- ck1(m, w.exp = 2, alpha = alpha)   # unweighted + quadratic

  list(
    N = N,
    po = po, pc = pc,
    kappa = r1$kappa,
    var_kappa = r1$var.kappa,
    se_kappa = sqrt(r1$var.kappa),
    ci_kappa = as.numeric(r1$confid[1, c("lower", "upper")]),

    wpo_linear = wpo_l, wpc_linear = wpc_l,
    kappa_linear = r1$weighted.kappa,
    var_linear = r1$var.weighted,
    se_linear = sqrt(r1$var.weighted),
    ci_linear = as.numeric(r1$confid[2, c("lower", "upper")]),

    wpo_quad = wpo_q, wpc_quad = wpc_q,
    kappa_quad = r2$weighted.kappa,
    var_quad = r2$var.weighted,
    se_quad = sqrt(r2$var.weighted),
    ci_quad = as.numeric(r2$confid[2, c("lower", "upper")])
  )
}

# Build a KxK table from two paired integer rating vectors over the numeric
# union of levels (sorted numerically), mirroring the tool's column-paste mode.
tbl_from_cols <- function(x1, x2) {
  lv <- sort(unique(c(x1, x2)))
  f1 <- factor(x1, levels = lv); f2 <- factor(x2, levels = lv)
  matrix(table(f1, f2), nrow = length(lv), dimnames = NULL)
}

cases <- list()
add <- function(name, m, alpha, mode = "matrix", cols = NULL) {
  a <- analyze(m, alpha)
  a$name <- name; a$alpha <- alpha; a$mode <- mode
  a$matrix <- lapply(seq_len(nrow(m)), function(i) as.numeric(m[i, ]))
  a$k <- nrow(m)
  if (!is.null(cols)) { a$x1 <- cols$x1; a$x2 <- cols$x2 }
  cases[[length(cases) + 1]] <<- a
}

# ---- 2x2 binary agreement (classic diagnostic-test style) ----
add("binary_2x2", matrix(c(45, 10, 15, 30), 2, 2, byrow = TRUE), 0.05)
add("binary_2x2_a90", matrix(c(45, 10, 15, 30), 2, 2, byrow = TRUE), 0.10)
add("binary_2x2_a99", matrix(c(45, 10, 15, 30), 2, 2, byrow = TRUE), 0.01)

# ---- 3x3 ordinal (mild/moderate/severe) ----
add("ordinal_3x3", matrix(c(20, 5, 1, 4, 18, 6, 0, 3, 15), 3, 3, byrow = TRUE), 0.05)

# ---- 4x4 ordinal, off-diagonal spread ----
add("ordinal_4x4", matrix(c(12, 3, 1, 0,
                            2, 15, 4, 1,
                            0, 3, 20, 5,
                            1, 0, 4, 10), 4, 4, byrow = TRUE), 0.05)

# ---- 5x5 Likert with concentrated diagonal ----
add("likert_5x5", matrix(c(30, 6, 2, 0, 0,
                           5, 28, 7, 1, 0,
                           1, 6, 25, 8, 2,
                           0, 2, 5, 22, 6,
                           0, 0, 2, 5, 20), 5, 5, byrow = TRUE), 0.05)

# ---- perfect agreement ----
add("perfect_3x3", matrix(c(10, 0, 0, 0, 12, 0, 0, 0, 8), 3, 3, byrow = TRUE), 0.05)

# ---- near-zero / systematic disagreement ----
add("weak_2x2", matrix(c(20, 20, 20, 20), 2, 2, byrow = TRUE), 0.05)

# ---- high prevalence (kappa paradox: high po, low kappa) ----
add("prevalence_2x2", matrix(c(90, 4, 5, 1), 2, 2, byrow = TRUE), 0.05)

# ---- tiny n ----
add("tiny_3x3", matrix(c(3, 1, 0, 0, 2, 1, 0, 0, 2), 3, 3, byrow = TRUE), 0.05)

# ---- column-paste mode: two integer rating vectors ----
x1 <- c(1,2,2,3,3,1,2,4,3,2,1,3,4,4,2,1,2,3,3,4)
x2 <- c(1,2,3,3,2,1,2,4,4,2,2,3,4,3,2,1,3,3,2,4)
add("cols_ratings", tbl_from_cols(x1, x2), 0.05, mode = "columns",
    cols = list(x1 = x1, x2 = x2))

# ---- column-paste with a level present for only one rater ----
y1 <- c(1,1,2,2,3,3,4,4,5,5,1,2,3,4,5)
y2 <- c(1,2,2,3,3,2,4,5,5,4,1,2,3,4,5)
add("cols_sparse", tbl_from_cols(y1, y2), 0.05, mode = "columns",
    cols = list(x1 = y1, x2 = y2))

# emit
library(jsonlite)
writeLines(toJSON(cases, auto_unbox = TRUE, digits = 15, pretty = TRUE),
           "Scripts/tool-truth/cohens-kappa-calculator.json")
cat("Wrote", length(cases), "cases\n")
for (c in cases) cat(sprintf("  %-18s k=%.6f  wLin=%.6f  wQuad=%.6f\n",
                             c$name, c$kappa, c$kappa_linear, c$kappa_quad))
