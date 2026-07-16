# Truth table for tools/binomial-table.html
# Ground truth = R's dbinom() / pbinom().
#
# Covers:
#   1. grid      - the full printable table: n = 1..20, k = 0..n, p = .05..(.05)..50
#                  both full precision AND the 4dp DISPLAY string, so the baked
#                  HTML can be string-compared against R cell by cell.
#   2. lookup    - interactive lookups incl. edges: k=0, k=n, n=1, off-grid p,
#                  p > 0.5 (symmetry), n > 20, deep-tail tiny probabilities.
#   3. symmetry  - the p > 0.5 mirror identity the page teaches.
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/binomial-table.R
suppressWarnings(suppressMessages(library(jsonlite)))

out <- list()

# ---- 1. the printable grid -------------------------------------------------
# (1:10)/20 gives the doubles a reader gets by typing 0.05 .. 0.50. seq() with
# by=0.05 accumulates error and returns 0.15000000000000002 instead of 0.15,
# which is a different number and prints differently at a rounding tie.
PS <- (1:10) / 20
grid <- list()
for (n in 1:20) {
  for (k in 0:n) {
    for (p in PS) {
      d  <- dbinom(k, n, p)
      cl <- pbinom(k, n, p)
      cu <- pbinom(k - 1, n, p, lower.tail = FALSE)   # P(X >= k)
      grid[[length(grid) + 1]] <- list(
        n = n, k = k, p = p,
        d = d, cum = cl, upper = cu,
        d_disp   = sprintf("%.4f", d),
        cum_disp = sprintf("%.4f", cl)
      )
    }
  }
}
out$grid <- grid

# ---- 2. interactive lookup cases -------------------------------------------
cases <- list(
  list(n = 10, p = 0.50, k = 7),    # default / coin
  list(n = 10, p = 0.50, k = 5),    # centre
  list(n = 10, p = 0.50, k = 0),    # k = 0 edge
  list(n = 10, p = 0.50, k = 10),   # k = n edge
  list(n = 1,  p = 0.50, k = 0),    # tiny n
  list(n = 1,  p = 0.50, k = 1),
  list(n = 1,  p = 0.05, k = 0),
  list(n = 20, p = 0.05, k = 0),    # zero events, small p
  list(n = 20, p = 0.05, k = 3),
  list(n = 20, p = 0.50, k = 20),   # deep tail: ~9.5e-7
  list(n = 15, p = 0.10, k = 0),
  list(n = 15, p = 0.10, k = 2),
  list(n = 12, p = 0.25, k = 4),    # OFF-GRID p (no table column)
  list(n = 10, p = 0.37, k = 3),    # off-grid p
  list(n = 10, p = 0.70, k = 7),    # p > 0.5 -> symmetry
  list(n = 10, p = 0.90, k = 9),
  list(n = 20, p = 0.65, k = 12),
  list(n = 8,  p = 0.95, k = 8),
  list(n = 50, p = 0.30, k = 15),   # n > 20 (off-table)
  list(n = 100, p = 0.50, k = 50),
  list(n = 100, p = 0.02, k = 0),
  list(n = 500, p = 0.10, k = 40),
  list(n = 1000, p = 0.001, k = 2),
  list(n = 30, p = 0.50, k = 25),   # small upper tail
  list(n = 6,  p = 0.15, k = 6),    # p^n tiny
  list(n = 20, p = 0.50, k = 10),
  list(n = 3,  p = 0.05, k = 3),
  list(n = 25, p = 0.80, k = 20)
)
look <- lapply(cases, function(cs) {
  n <- cs$n; p <- cs$p; k <- cs$k
  list(
    n = n, p = p, k = k,
    d     = dbinom(k, n, p),
    cum   = pbinom(k, n, p),                              # P(X <= k)
    upper = pbinom(k - 1, n, p, lower.tail = FALSE),      # P(X >= k)
    lt    = if (k >= 1) pbinom(k - 1, n, p) else 0,       # P(X < k)
    gt    = pbinom(k, n, p, lower.tail = FALSE),          # P(X > k)
    mean  = n * p,
    sd    = sqrt(n * p * (1 - p))
  )
})
out$lookup <- look

# ---- 3. p > 0.5 symmetry identity ------------------------------------------
sym <- list()
for (cs in list(c(10, 0.7, 7), c(10, 0.9, 9), c(20, 0.65, 12), c(8, 0.95, 8),
                c(12, 0.55, 5), c(15, 0.75, 11))) {
  n <- cs[1]; p <- cs[2]; k <- cs[3]
  sym[[length(sym) + 1]] <- list(
    n = n, p = p, k = k,
    # P(X = k | n, p) == P(X = n-k | n, 1-p)
    d_direct = dbinom(k, n, p), d_mirror = dbinom(n - k, n, 1 - p),
    # P(X <= k | n, p) == P(X >= n-k | n, 1-p)
    cum_direct = pbinom(k, n, p),
    cum_mirror = pbinom(n - k - 1, n, 1 - p, lower.tail = FALSE)
  )
}
out$symmetry <- sym

write_json(out, "Scripts/tool-truth/binomial-table.json",
           auto_unbox = TRUE, digits = 17, pretty = FALSE)
cat("grid cells:", length(grid), " lookup:", length(look),
    " symmetry:", length(sym), "\n")
