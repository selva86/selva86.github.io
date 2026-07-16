# Truth table for percentile-calculator
# Ground truth: R 4.6.0  quantile(x, probs, type = 7 | 6)  and  ecdf(x)(v)
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/percentile-calculator.R

cases <- list()
add <- function(id, fn, data, extra, value) {
  cases[[length(cases) + 1]] <<- list(id = id, fn = fn, data = data, extra = extra, value = value)
}

# ---- datasets (cover ties, negatives, outliers, tiny n, huge magnitudes) ----
datasets <- list(
  exam    = c(88, 92, 76, 81, 95, 89, 73, 100, 68, 85, 90, 77),
  rtimes  = c(0.4, 0.9, 1.1, 1.3, 1.6, 1.9, 2.4, 3.1, 4.2, 6.8, 12.5, 22.0),
  salary  = c(38000, 41000, 42500, 45000, 47000, 48000, 52000, 55000, 61000, 240000),
  heights = c(162, 170, 158, 175, 168, 181, 166, 173, 159, 177, 164, 169, 172, 160, 178),
  ties    = c(5, 5, 5, 7, 7, 8, 8, 8, 8, 10),
  negs    = c(-12, -8, -3, 0, 2, 5, 9, 14),
  seq10   = c(1:10),
  n2      = c(4, 10),
  n3      = c(4, 7, 10),
  n1      = c(42),
  big     = c(1.2e6, 3.4e6, 5.6e6, 7.8e6, 9.9e6, 2.1e7),
  constant = c(3, 3, 3, 3)
)

probs <- c(0, 0.001, 0.01, 0.05, 0.10, 0.25, 0.375, 0.50, 0.75, 0.90, 0.95, 0.99, 0.999, 1)

# ---- quantile at every prob, type 7 and type 6 ----
for (nm in names(datasets)) {
  x <- datasets[[nm]]
  for (ty in c(7, 6)) {
    q <- quantile(x, probs = probs, type = ty, names = FALSE)
    for (i in seq_along(probs)) {
      add(sprintf("q_%s_t%d_p%g", nm, ty, probs[i]), "quantile", x,
          list(p = probs[i], type = ty), q[i])
    }
  }
}

# ---- ecdf: proportion of values <= v ----
# Test points per dataset: below min, at min, exact data points, interior gaps,
# at max, above max.
ecdf_points <- function(x) {
  s <- sort(unique(x))
  mn <- min(x); mx <- max(x)
  pts <- c(mn - abs(mn) * 0.1 - 1, mn, mx, mx + abs(mx) * 0.1 + 1)
  # a couple of exact interior data points
  if (length(s) >= 3) pts <- c(pts, s[2], s[length(s) - 1])
  # interior gaps (midpoints between consecutive uniques)
  if (length(s) >= 2) {
    mids <- (s[-length(s)] + s[-1]) / 2
    pts <- c(pts, mids[seq(1, length(mids), length.out = min(3, length(mids)))])
  }
  sort(unique(pts))
}
for (nm in names(datasets)) {
  x <- datasets[[nm]]
  fn <- ecdf(x)
  for (v in ecdf_points(x)) {
    add(sprintf("e_%s_v%g", nm, v), "ecdf", x, list(v = v), fn(v))
  }
}

# ---- serialize JSON manually (avoid jsonlite dependency) ----
num <- function(x) {
  if (is.na(x)) return("null")
  if (is.infinite(x)) return(if (x > 0) "1e999" else "-1e999")
  formatC(x, format = "e", digits = 17)
}
arr <- function(v) paste0("[", paste(sapply(v, num), collapse = ","), "]")
extrastr <- function(a) paste(sprintf('"%s":%s', names(a), sapply(a, num)), collapse = ",")
items <- sapply(cases, function(c)
  sprintf('{"id":"%s","fn":"%s","data":%s,"extra":{%s},"value":%s}',
          c$id, c$fn, arr(c$data), extrastr(c$extra), num(c$value)))
out <- paste0("[\n", paste(items, collapse = ",\n"), "\n]\n")
writeLines(out, "Scripts/tool-truth/percentile-calculator.json")
cat("Wrote", length(cases), "cases\n")
