# Truth table for iqr-calculator
# Ground truth: R 4.6.0
#   quantile(x, c(.25,.5,.75), type = 7 | 6)  -> quartiles / IQR (type-7 default)
#   IQR(x, type = 7 | 6)                       -> interquartile range
#   fivenum(x)                                 -> Tukey five-number summary
#   boxplot.stats(x, coef)                     -> $stats (box + whiskers) and $out
#   type-7 1.5*IQR / 3*IQR fences + outliers   -> the tool's flagged points
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/iqr-calculator.R

datasets <- list(
  exam    = c(88, 92, 76, 81, 95, 89, 73, 100, 68, 85, 90, 77),
  salary  = c(38000, 41000, 42500, 45000, 47000, 48000, 52000, 55000, 61000, 240000),
  response = c(42, 45, 47, 48, 50, 51, 53, 55, 58, 62, 140, 320),
  sensor  = c(20.5, 20.7, 20.1, 20.8, 20.4, 21.2, 20.6, 21.5, 21.0, 22.0, 18.9, 28.9),
  rtimes  = c(0.4, 0.9, 1.1, 1.3, 1.6, 1.9, 2.4, 3.1, 4.2, 6.8, 12.5, 22.0),
  heights = c(162, 170, 158, 175, 168, 181, 166, 173, 159, 177, 164, 169, 172, 160, 178),
  ties    = c(5, 5, 5, 7, 7, 8, 8, 8, 8, 10),
  negs    = c(-12, -8, -3, 0, 2, 5, 9, 14),
  seq10   = c(1:10),
  n4      = c(4, 7, 10, 13),
  n3      = c(4, 7, 10),
  n2      = c(4, 10),
  n1      = c(42),
  big     = c(1.2e6, 3.4e6, 5.6e6, 7.8e6, 9.9e6, 2.1e7),
  constant = c(3, 3, 3, 3),
  bimodal = c(1, 1, 2, 2, 3, 20, 21, 22, 23, 24, 100)
)

# type-7 fence outliers (what the tool flags). Strict inequality, matching R's
# boxplot.stats out test. coef = 1.5 (inner / mild) and 3 (outer / extreme).
t7out <- function(x, coef) {
  q <- quantile(x, c(.25, .75), type = 7, names = FALSE)
  iqr <- q[2] - q[1]
  lo <- q[1] - coef * iqr; hi <- q[2] + coef * iqr
  sort(x[x < lo | x > hi])
}
t7fence <- function(x, coef) {
  q <- quantile(x, c(.25, .75), type = 7, names = FALSE)
  iqr <- q[2] - q[1]
  c(q[1] - coef * iqr, q[2] + coef * iqr)
}

# ---- JSON serializers (manual, no jsonlite) ----
num <- function(x) {
  if (length(x) == 0 || is.na(x)) return("null")
  if (is.infinite(x)) return(if (x > 0) "1e999" else "-1e999")
  formatC(x, format = "e", digits = 17)
}
arr <- function(v) paste0("[", paste(sapply(v, num), collapse = ","), "]")

recs <- c()
for (nm in names(datasets)) {
  x <- datasets[[nm]]
  q7 <- quantile(x, c(.25, .5, .75), type = 7, names = FALSE)
  q6 <- quantile(x, c(.25, .5, .75), type = 6, names = FALSE)
  bs15 <- boxplot.stats(x, coef = 1.5)
  bs30 <- boxplot.stats(x, coef = 3)
  fields <- c(
    sprintf('"id":"%s"', nm),
    sprintf('"data":%s', arr(x)),
    sprintf('"q7":%s', arr(q7)),
    sprintf('"q6":%s', arr(q6)),
    sprintf('"iqr7":%s', num(IQR(x, type = 7))),
    sprintf('"iqr6":%s', num(IQR(x, type = 6))),
    sprintf('"median":%s', num(median(x))),
    sprintf('"min":%s', num(min(x))),
    sprintf('"max":%s', num(max(x))),
    sprintf('"fivenum":%s', arr(fivenum(x))),
    sprintf('"bstats15":%s', arr(bs15$stats)),
    sprintf('"bout15":%s', arr(sort(bs15$out))),
    sprintf('"bout30":%s', arr(sort(bs30$out))),
    sprintf('"t7fence15":%s', arr(t7fence(x, 1.5))),
    sprintf('"t7out15":%s', arr(t7out(x, 1.5))),
    sprintf('"t7fence30":%s', arr(t7fence(x, 3))),
    sprintf('"t7out30":%s', arr(t7out(x, 3)))
  )
  recs <- c(recs, paste0("{", paste(fields, collapse = ","), "}"))
}
out <- paste0("[\n", paste(recs, collapse = ",\n"), "\n]\n")
writeLines(out, "Scripts/tool-truth/iqr-calculator.json")
cat("Wrote", length(recs), "dataset records\n")
