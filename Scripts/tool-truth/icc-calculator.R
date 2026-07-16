# Truth table for icc-calculator
# Ground truth: psych::ICC(x, lmer = FALSE) on R 4.6.x.
#
# WHY lmer = FALSE IS THE GROUND TRUTH (and psych's own default is not):
#   psych::ICC defaults to lmer = TRUE, which fits a two-way random-effects
#   model with lme4::lmer (REML) and back-computes MSB/MSJ/MSW/MSE from the
#   variance components. That path is (a) an iterative optimizer, so it agrees
#   with the closed form only to REML convergence tolerance (~1e-3 on clean
#   balanced data), and (b) clamps negative variance components at zero, so a
#   genuinely negative ICC is reported as 0.00 instead of, say, -0.29.
#   lmer = FALSE is the exact Shrout & Fleiss (1979) ANOVA closed form: it is
#   deterministic, textbook, and reproducible in JS to machine precision.
#   The tool computes and emits lmer = FALSE for exactly that reason.
#
# For each case this emits the full two-way ANOVA (df, SS, MS for subjects,
# judges, residual, plus MSW), all six ICC forms (ICC1, ICC2, ICC3, ICC1k,
# ICC2k, ICC3k) with F, df1, df2, p and the confidence bounds at the given
# alpha, and the raw wide-format rating matrix the tool will be handed.
suppressWarnings(suppressMessages(library(psych)))
suppressWarnings(suppressMessages(library(jsonlite)))

# Closed-form two-way ANOVA on a complete n x k matrix (rows = subjects,
# cols = raters). Mirrors what the JS library computes.
aov_parts <- function(x) {
  n <- nrow(x); k <- ncol(x)
  grand <- mean(x)
  rm <- rowMeans(x); cm <- colMeans(x)
  SSB <- k * sum((rm - grand)^2)            # between subjects
  SSJ <- n * sum((cm - grand)^2)            # between judges
  SST <- sum((x - grand)^2)
  SSE <- SST - SSB - SSJ                    # residual
  dfB <- n - 1; dfJ <- k - 1; dfE <- (n - 1) * (k - 1)
  MSB <- SSB / dfB; MSJ <- SSJ / dfJ; MSE <- SSE / dfE
  MSW <- (SSJ + SSE) / (dfJ + dfE)          # one-way within-subject MS
  list(n = n, k = k, dfB = dfB, dfJ = dfJ, dfE = dfE,
       SSB = SSB, SSJ = SSJ, SSE = SSE, SST = SST,
       MSB = MSB, MSJ = MSJ, MSE = MSE, MSW = MSW)
}

cases <- list()
add <- function(name, x, alpha = 0.05, note = "") {
  x <- as.matrix(x)
  storage.mode(x) <- "double"
  r <- psych::ICC(x, lmer = FALSE, alpha = alpha)$results
  a <- aov_parts(x)

  a$name <- name
  a$alpha <- alpha
  a$note <- note
  a$matrix <- lapply(seq_len(nrow(x)), function(i) as.numeric(x[i, ]))
  # six ICC rows in psych's order: ICC1 ICC2 ICC3 ICC1k ICC2k ICC3k
  a$type  <- as.character(r[, 1])
  a$ICC   <- as.numeric(r[, 2])
  a$F     <- as.numeric(r[, 3])
  a$df1   <- as.numeric(r[, 4])
  a$df2   <- as.numeric(r[, 5])
  a$p     <- as.numeric(r[, 6])
  a$lower <- as.numeric(r[, 7])
  a$upper <- as.numeric(r[, 8])
  cases[[length(cases) + 1]] <<- a
}

set.seed(42)

# ---- 1. Well-behaved: 4 raters, 20 subjects, strong true-score variance ----
subj <- rnorm(20, 50, 10)
m_clean <- matrix(rep(subj, 4) + rnorm(80, 0, 2), 20, 4)
add("clean_20x4", m_clean, 0.05, "high agreement, negligible judge effect")
add("clean_20x4_a90", m_clean, 0.10)
add("clean_20x4_a99", m_clean, 0.01)

# ---- 2. Real judge bias: ICC2 (absolute) should fall below ICC3 (consistency)
m_bias <- m_clean + rep(c(0, 2, -3, 5), each = 20)
add("judge_bias_20x4", m_bias, 0.05, "systematic rater bias: ICC2 << ICC3")

# ---- 3. Two raters (spec edge case) ----
s2 <- rnorm(15, 100, 15)
m_2r <- matrix(rep(s2, 2) + rnorm(30, 0, 4), 15, 2)
add("two_raters_15x2", m_2r, 0.05, "k = 2, the smallest possible rater set")
add("two_raters_15x2_a99", m_2r, 0.01)

# ---- 4. Tiny n, missing-free (spec edge case) ----
m_tiny <- matrix(c(9, 8, 9,
                   6, 5, 6,
                   8, 8, 7,
                   7, 6, 8,
                   5, 6, 5,
                   9, 9, 9), nrow = 6, ncol = 3, byrow = TRUE)
add("tiny_6x3", m_tiny, 0.05, "n = 6 subjects, k = 3 raters, no missing")

# ---- 5. Likert / ordinal integer ratings, 5 raters ----
m_likert <- matrix(c(4, 4, 5, 4, 4,
                     2, 3, 2, 2, 3,
                     5, 5, 5, 4, 5,
                     3, 2, 3, 3, 2,
                     1, 1, 2, 1, 1,
                     4, 3, 4, 4, 4,
                     2, 2, 1, 2, 2,
                     5, 4, 5, 5, 5,
                     3, 3, 3, 4, 3,
                     1, 2, 1, 1, 2,
                     4, 4, 4, 3, 4,
                     2, 2, 3, 2, 2), nrow = 12, ncol = 5, byrow = TRUE)
add("likert_12x5", m_likert, 0.05, "ordinal 1-5 Likert ratings, 5 raters")

# ---- 6. Perfect agreement ----
m_perfect <- matrix(rep(c(10, 20, 30, 40, 50, 60, 70, 80), 3), 8, 3)
add("perfect_8x3", m_perfect, 0.05, "identical raters: ICC = 1, MSE = 0")

# ---- 7. Pure noise: negative ICC (psych lmer=TRUE would clamp this to 0) ----
m_noise <- matrix(c(3, 8, 5,
                    9, 2, 7,
                    4, 6, 1,
                    7, 3, 9,
                    2, 9, 4,
                    8, 1, 6,
                    5, 7, 2,
                    1, 4, 8,
                    6, 5, 3,
                    9, 8, 1), nrow = 10, ncol = 3, byrow = TRUE)
add("pure_noise_10x3", m_noise, 0.05, "no subject signal: ICC goes negative")

# ---- 8. Many raters ----
s6 <- rnorm(25, 0, 3)
m_6r <- matrix(rep(s6, 6) + rnorm(150, 0, 2.5), 25, 6)
add("six_raters_25x6", m_6r, 0.05, "k = 6, average-measure ICC >> single")

# ---- 9. Moderate agreement, the realistic middle ----
s9 <- rnorm(30, 20, 5)
m_mod <- matrix(rep(s9, 3) + rnorm(90, 0, 5), 30, 3)
add("moderate_30x3", m_mod, 0.05, "ICC in the 0.4-0.6 'fair to good' band")

# ---- 10. Large judge effect + weak subject effect (worst case for ICC2) ----
s10 <- rnorm(12, 10, 2)
m_hard <- matrix(rep(s10, 3) + rnorm(36, 0, 2), 12, 3) + rep(c(0, 8, -8), each = 12)
add("huge_judge_effect_12x3", m_hard, 0.05, "raters disagree on level, agree on rank")

# ---- 11. Clean integer rater bias (the tool's "rater bias" preset) ----
# R2 sits ~5 points above R1, R3 ~3 below: the raters rank the subjects the
# same way but disagree on the level. Consistency (ICC3) stays high while
# absolute agreement (ICC2) and the one-way ICC1 fall.
m_bias_clean <- matrix(c(12, 18,  9,
                         18, 23, 16,
                         25, 29, 22,
                          9, 15,  7,
                         30, 34, 28,
                         15, 21, 13,
                         22, 26, 20,
                         11, 17,  8), nrow = 8, ncol = 3, byrow = TRUE)
add("rater_bias_clean_8x3", m_bias_clean, 0.05,
    "same ranking, different level: ICC3 high, ICC2 lower")
add("rater_bias_clean_8x3_a99", m_bias_clean, 0.01)

# ---- 12. Exact constant offset: MSE = 0 but MSW > 0 ----
# Perfect consistency with a real rater effect. Exercises the branch where the
# residual vanishes but the judge term does not, so ICC3 = 1 while ICC2 < 1.
m_offset <- cbind(c(10, 20, 30, 40, 50, 60),
                  c(10, 20, 30, 40, 50, 60) + 5,
                  c(10, 20, 30, 40, 50, 60) - 3)
add("exact_offset_6x3", m_offset, 0.05,
    "raters differ by a fixed constant: perfect consistency, imperfect agreement")

# ---- emit ----
writeLines(toJSON(cases, auto_unbox = TRUE, digits = 15, pretty = TRUE),
           "Scripts/tool-truth/icc-calculator.json")
cat("Wrote", length(cases), "cases\n")
for (c in cases) {
  cat(sprintf("  %-24s n=%2d k=%d  ICC1=%8.5f ICC2=%8.5f ICC3=%8.5f | ICC2k=%8.5f\n",
              c$name, c$n, c$k, c$ICC[1], c$ICC[2], c$ICC[3], c$ICC[5]))
}
