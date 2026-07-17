# =====================================================================
# Meta-Analysis Quick Tool - R truth table
# Ground truth for tools/lib/meta-analysis-math.js
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/meta-analysis-quick-tool.R
# Emits: Scripts/tool-truth/meta-analysis-quick-tool.json
#
# Every number the page can display is taken from metafor, not from a
# hand-rolled formula:
#   fixed effect     rma(yi, sei=, method="FE")   inverse-variance weights
#   random effects   rma(yi, sei=, method="DL")   DerSimonian-Laird tau^2
#   2x2 counts       escalc(measure="OR", ...)    log OR + its variance
#   per-study weight weights(res)                 percent weights, both models
#
# metafor's defaults that the JS must reproduce exactly:
#   escalc: add=1/2, to="only0", drop00=FALSE
#     -> a study with ANY zero cell gets 0.5 added to ALL FOUR of its cells;
#        studies without a zero cell are untouched. (Probed, not assumed.)
#   rma: test="z" -> CI = est +/- qnorm(1-alpha/2) * se
#
# Identity worth knowing (why one I2 formula serves both models): under DL,
#   tau2 = (Q-df)/C,  C = sum(w) - sum(w^2)/sum(w),  s2 = df/C
#   I2 = tau2/(tau2+s2) = (Q-df)/Q          -- so I2 = max(0,(Q-df)/Q).
# The JS uses the right-hand form; this table checks it against metafor's own.
# =====================================================================

suppressMessages(library(metafor))
suppressMessages(library(jsonlite))
options(digits = 15)

cases <- list()

# ---- helper: run both models on yi/sei and harvest every number ------
harvest <- function(name, mode, labels, yi, sei, level = 95,
                    counts = NULL) {
  vi <- sei^2
  fe <- rma(yi = yi, vi = vi, method = "FE", level = level)
  re <- rma(yi = yi, vi = vi, method = "DL", level = level)

  # per-study percent weights, straight from metafor
  w_fe <- as.numeric(weights(fe))
  w_re <- as.numeric(weights(re))

  # DL intermediates, recomputed here so the JS has a target for the
  # arithmetic it SHOWS on the page (Q, df, C, tau2), not just the result.
  w <- 1 / vi
  C <- sum(w) - sum(w^2) / sum(w)
  df <- length(yi) - 1
  Q <- as.numeric(fe$QE)
  tau2_manual <- max(0, (Q - df) / C)
  I2_manual <- if (Q > df) 100 * (Q - df) / Q else 0

  cs <- list(
    name = name,
    mode = mode,
    level = level,
    labels = labels,
    yi = yi,
    sei = sei,
    vi = vi,
    fe = list(
      est = as.numeric(fe$beta), se = as.numeric(fe$se),
      lo = as.numeric(fe$ci.lb), hi = as.numeric(fe$ci.ub),
      z = as.numeric(fe$zval), p = as.numeric(fe$pval),
      weights = w_fe
    ),
    re = list(
      est = as.numeric(re$beta), se = as.numeric(re$se),
      lo = as.numeric(re$ci.lb), hi = as.numeric(re$ci.ub),
      z = as.numeric(re$zval), p = as.numeric(re$pval),
      weights = w_re
    ),
    het = list(
      Q = Q, df = df, Qp = as.numeric(fe$QEp),
      I2 = as.numeric(re$I2), tau2 = as.numeric(re$tau2),
      C = C,
      I2_manual = I2_manual, tau2_manual = tau2_manual
    )
  )
  if (!is.null(counts)) cs$counts <- counts
  cs
}

# ---- helper: 2x2 counts -> yi/sei via escalc, then harvest ----------
harvest_counts <- function(name, labels, et, nt, ec, nc, level = 95) {
  ai <- et; bi <- nt - et; ci <- ec; di <- nc - ec
  e <- escalc(measure = "OR", ai = ai, bi = bi, ci = ci, di = di)
  yi <- as.numeric(e$yi); vi <- as.numeric(e$vi)
  cs <- harvest(name, "counts", labels, yi, sqrt(vi), level,
                counts = list(et = et, nt = nt, ec = ec, nc = nc,
                              ai = ai, bi = bi, ci = ci, di = di))
  cs
}

# =====================================================================
# CASE 1 - the bread-and-butter case: 5 studies, effect + SE, low het.
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_low", "es",
  c("Abrams 2019", "Bennett 2020", "Cho 2020", "Diaz 2021", "Egan 2022"),
  c(0.32, 0.28, 0.41, 0.35, 0.30),
  c(0.12, 0.15, 0.18, 0.10, 0.14)
)

# =====================================================================
# CASE 2 - HIGH heterogeneity (target I2 > 60%): the case that decides
# whether a beginner should trust the fixed-effect pool at all.
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_high", "es",
  c("Ahmed 2018", "Brown 2019", "Chen 2020", "Duval 2021", "Ellis 2022"),
  c(0.10, 0.85, 0.22, 1.10, 0.45),
  c(0.12, 0.14, 0.10, 0.16, 0.13)
)

# =====================================================================
# CASE 3 - perfectly homogeneous: Q < df, so tau2 clamps to 0 and the
# random-effects pool must collapse onto the fixed-effect pool.
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_homog", "es",
  c("S1", "S2", "S3", "S4"),
  c(0.30, 0.31, 0.29, 0.30),
  c(0.20, 0.20, 0.20, 0.20)
)

# =====================================================================
# CASE 4 - k = 2, the minimum meta-analysis. df = 1.
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_k2", "es", c("Pilot", "Replication"),
  c(0.50, 0.20), c(0.10, 0.15)
)

# =====================================================================
# CASE 5 - negative effects + one wide study (tests sign handling and
# the forest-plot x-range).
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_neg", "es",
  c("Foster 2017", "Gupta 2019", "Hall 2020", "Ito 2021"),
  c(-0.45, -0.20, -0.62, -0.05),
  c(0.11, 0.09, 0.25, 0.60)
)

# =====================================================================
# CASE 6/7 - same data as CASE 1 at 90% and 99%, so the level selector
# is verified rather than assumed.
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_low_90", "es",
  c("Abrams 2019", "Bennett 2020", "Cho 2020", "Diaz 2021", "Egan 2022"),
  c(0.32, 0.28, 0.41, 0.35, 0.30),
  c(0.12, 0.15, 0.18, 0.10, 0.14), level = 90
)
cases[[length(cases) + 1]] <- harvest(
  "es_low_99", "es",
  c("Abrams 2019", "Bennett 2020", "Cho 2020", "Diaz 2021", "Egan 2022"),
  c(0.32, 0.28, 0.41, 0.35, 0.30),
  c(0.12, 0.15, 0.18, 0.10, 0.14), level = 99
)

# =====================================================================
# CASE 8 - 2x2 COUNTS, no zero cells. escalc does the log-OR arithmetic.
# =====================================================================
cases[[length(cases) + 1]] <- harvest_counts(
  "counts_basic",
  c("Trial A", "Trial B", "Trial C", "Trial D"),
  et = c(12, 8, 25, 5), nt = c(100, 80, 150, 60),
  ec = c(20, 15, 33, 9), nc = c(100, 85, 145, 58)
)

# =====================================================================
# CASE 9 - 2x2 COUNTS with a ZERO cell (0 events on treatment).
# escalc adds 0.5 to all four cells of THAT study only.
# =====================================================================
cases[[length(cases) + 1]] <- harvest_counts(
  "counts_zero",
  c("Small trial", "Mid trial", "Large trial"),
  et = c(0, 8, 3), nt = c(25, 40, 30),
  ec = c(5, 12, 7), nc = c(25, 38, 32)
)

# =====================================================================
# CASE 10 - 2x2 COUNTS with HIGH heterogeneity on the OR scale
# (one trial reverses direction).
# =====================================================================
cases[[length(cases) + 1]] <- harvest_counts(
  "counts_high",
  c("Trial 1", "Trial 2", "Trial 3", "Trial 4", "Trial 5"),
  et = c(10, 40, 6, 55, 14), nt = c(200, 200, 180, 210, 190),
  ec = c(30, 22, 24, 30, 16), nc = c(200, 200, 175, 205, 185)
)

# =====================================================================
# CASE 11 - k = 10, larger set, mild heterogeneity.
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_k10", "es",
  paste0("Study ", 1:10),
  c(0.22, 0.48, 0.31, 0.05, 0.39, 0.27, 0.55, 0.18, 0.33, 0.41),
  c(0.10, 0.14, 0.09, 0.20, 0.12, 0.16, 0.11, 0.13, 0.08, 0.17)
)

# =====================================================================
# CASE 12 - tiny/huge SE mix: one near-zero-SE study should dominate the
# fixed-effect pool almost completely (weight -> ~100%).
# =====================================================================
cases[[length(cases) + 1]] <- harvest(
  "es_dominant", "es",
  c("Mega trial", "Small A", "Small B"),
  c(0.20, 0.90, -0.30),
  c(0.02, 0.50, 0.55)
)

# ---- serialize -------------------------------------------------------
json <- toJSON(cases, digits = NA, auto_unbox = TRUE, pretty = 2)
writeLines(json, "Scripts/tool-truth/meta-analysis-quick-tool.json")
cat("Wrote", length(cases), "cases to Scripts/tool-truth/meta-analysis-quick-tool.json\n")

# ---- spot checks -----------------------------------------------------
cat("\n-- spot checks --\n")
for (cs in cases) {
  cat(sprintf("%-14s k=%2d  FE=%8.4f [%7.4f,%7.4f]  RE=%8.4f [%7.4f,%7.4f]  Q=%7.3f df=%d  I2=%6.2f%%  tau2=%.5f\n",
              cs$name, length(cs$yi),
              cs$fe$est, cs$fe$lo, cs$fe$hi,
              cs$re$est, cs$re$lo, cs$re$hi,
              cs$het$Q, cs$het$df, cs$het$I2, cs$het$tau2))
}

cat("\n-- metafor I2/tau2 vs the closed form the page shows --\n")
for (cs in cases) {
  cat(sprintf("%-14s I2 diff=%.3e  tau2 diff=%.3e\n", cs$name,
              abs(cs$het$I2 - cs$het$I2_manual),
              abs(cs$het$tau2 - cs$het$tau2_manual)))
}

cat("\n-- high-heterogeneity case present (I2 > 60)? --\n")
hi <- Filter(function(cs) cs$het$I2 > 60, cases)
cat(length(hi), "case(s):", paste(vapply(hi, function(cs) sprintf("%s (I2=%.1f%%)", cs$name, cs$het$I2), character(1)), collapse = ", "), "\n")

cat("\n-- tau2=0 clamp: RE must equal FE --\n")
h <- cases[[3]]
cat("es_homog  tau2 =", h$het$tau2, " |FE-RE| =", abs(h$fe$est - h$re$est), "\n")
