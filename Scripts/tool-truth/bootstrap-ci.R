# Bootstrap CI tool - R truth table
# Ground truth: R 4.6.0 default RNG (Mersenne-Twister | Inversion | Rejection),
# boot::boot() + boot::boot.ci(). Every displayed number in the tool must match this.
options(digits = 17)
suppressMessages(library(boot))

# ---- datasets (frozen; the JSON carries them so JS reads the identical vectors) ----
set.seed(101); d_norm  <- round(rnorm(10, 50, 8), 3)
set.seed(202); d_skew  <- round(rlnorm(40, log(30), 0.6), 3)
set.seed(303); d_tiny  <- round(rnorm(5, 100, 15), 3)
set.seed(404); d_out   <- round(c(rnorm(19, 20, 4), 95), 3)          # one big outlier
set.seed(505); d_big   <- round(rgamma(100, 2, 0.05), 3)             # right-skew, n=100
set.seed(606); d_ties  <- round(rpois(30, 6), 0) + 0.0               # integer ties

stat_fns <- list(
  mean   = function(d, i) mean(d[i]),
  median = function(d, i) median(d[i]),
  sd     = function(d, i) sd(d[i]),
  iqr    = function(d, i) IQR(d[i]),
  p90    = function(d, i) quantile(d[i], 0.90, names = FALSE, type = 7)
)

# cases: label, data, stat, seed, R, conf
cases <- list(
  list("mean_norm_2000_95",   d_norm,  "mean",   42,  2000, 0.95),
  list("mean_norm_5000_90",   d_norm,  "mean",   7,   5000, 0.90),
  list("median_skew_2000_95", d_skew,  "median", 42,  2000, 0.95),
  list("median_skew_3000_99", d_skew,  "median", 11,  3000, 0.99),
  list("sd_out_2000_95",      d_out,   "sd",     42,  2000, 0.95),
  list("sd_out_4000_90",      d_out,   "sd",     3,   4000, 0.90),
  list("iqr_big_2000_95",     d_big,   "iqr",    42,  2000, 0.95),
  list("iqr_ties_2000_95",    d_ties,  "iqr",    5,   2000, 0.95),
  list("p90_skew_2000_95",    d_skew,  "p90",    42,  2000, 0.95),
  list("p90_big_5000_99",     d_big,   "p90",    9,   5000, 0.99),
  list("mean_tiny_2000_95",   d_tiny,  "mean",   42,  2000, 0.95),
  list("median_tiny_2000_90", d_tiny,  "median", 8,   2000, 0.90),
  list("mean_big_smallR_95",  d_big,   "mean",   42,  50,   0.95),   # R < n -> jack influence
  list("median_big_smallR_95",d_big,   "median", 4,   60,   0.95)    # R < n -> jack influence
)

emit_num <- function(v) if (is.finite(v)) sprintf("%.17g", v) else "null"
emit_vec <- function(v) paste0("[", paste(vapply(v, emit_num, ""), collapse = ","), "]")

con <- file("Scripts/tool-truth/bootstrap-ci.json", "w")
writeLines("{", con)
writeLines(paste0('  "meta": {"R_version": "', R.version.string,
                  '", "rngkind": "', paste(RNGkind(), collapse = " | "), '"},'), con)
writeLines('  "cases": [', con)

for (ci_i in seq_along(cases)) {
  cs <- cases[[ci_i]]
  label <- cs[[1]]; x <- cs[[2]]; stat <- cs[[3]]; seed <- cs[[4]]; R <- cs[[5]]; conf <- cs[[6]]
  fn <- stat_fns[[stat]]
  set.seed(seed)
  b <- boot(x, fn, R = R)
  tstar <- as.numeric(b$t)
  t0 <- as.numeric(b$t0)
  fin <- tstar[is.finite(tstar)]
  meanStar <- mean(fin); sdStar <- sd(fin)
  ci <- boot.ci(b, type = c("norm", "basic", "perc", "bca"), conf = conf)
  norm  <- as.numeric(ci$normal[2:3])
  basic <- as.numeric(ci$basic[4:5])
  perc  <- as.numeric(ci$percent[4:5])
  bca   <- as.numeric(ci$bca[4:5])
  # BCa internals for cross-check
  w <- qnorm(sum(fin < t0) / length(fin))
  Ltype <- if (R < length(x)) "jack" else "reg"
  L <- boot:::empinf(b, index = 1)
  acc <- sum(L^3) / (6 * sum(L^2)^1.5)

  comma <- if (ci_i < length(cases)) "," else ""
  writeLines("    {", con)
  writeLines(paste0('      "label": "', label, '", "stat": "', stat,
                    '", "seed": ', seed, ', "R": ', R, ', "conf": ', conf, ','), con)
  writeLines(paste0('      "x": ', emit_vec(x), ','), con)
  writeLines(paste0('      "t0": ', emit_num(t0),
                    ', "meanStar": ', emit_num(meanStar),
                    ', "sdStar": ', emit_num(sdStar), ','), con)
  writeLines(paste0('      "tstar_head": ', emit_vec(head(tstar, 6)), ','), con)
  writeLines(paste0('      "w": ', emit_num(w),
                    ', "acc": ', emit_num(acc),
                    ', "Ltype": "', Ltype, '",'), con)
  writeLines(paste0('      "norm": ', emit_vec(norm),
                    ', "basic": ', emit_vec(basic),
                    ', "perc": ', emit_vec(perc),
                    ', "bca": ', emit_vec(bca)), con)
  writeLines(paste0("    }", comma), con)
}
writeLines("  ]", con)
writeLines("}", con)
close(con)
cat("Wrote Scripts/tool-truth/bootstrap-ci.json with", length(cases), "cases\n")
