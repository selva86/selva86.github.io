# Truth table for tools/sample-size-t-test-calculator.html
# Oracles: pwr::pwr.t.test, pwr::pwr.t2n.test, stats::power.t.test(strict=TRUE)
#
# CONVENTION NOTE (verified 2026-07-16):
#   pwr.t.test includes BOTH rejection tails for a two-sided test.
#   stats::power.t.test defaults to strict=FALSE (upper tail only) and so returns a
#   slightly different n; power.t.test(strict=TRUE) agrees with pwr to ~4e-9 relative
#   (the residual is uniroot tolerance, not a formula difference).
#   The tool uses the pwr convention, so every emitted power.t.test line carries strict=TRUE.

suppressMessages(library(pwr))
suppressMessages(library(jsonlite))

out <- list()

# ---------- helpers: independent re-implementation of pwr.t2n.test's power body ----------
t2n_power <- function(n1, n2, d, sig.level, alternative) {
  nu <- n1 + n2 - 2
  ncp <- d * sqrt(n1 * n2 / (n1 + n2))
  if (alternative == "two.sided") {
    qu <- qt(sig.level / 2, nu, lower = FALSE)
    pt(qu, nu, ncp = ncp, lower = FALSE) + pt(-qu, nu, ncp = ncp, lower = TRUE)
  } else {
    qu <- qt(sig.level, nu, lower = FALSE)
    pt(qu, nu, ncp = ncp, lower = FALSE)
  }
}
solve_n1_ratio <- function(d, sig.level, power, ratio, alternative) {
  f <- function(n1) t2n_power(n1, ratio * n1, d, sig.level, alternative) - power
  uniroot(f, c(2 + 1e-10, 1e7), tol = .Machine$double.eps^0.5)$root
}

alt_ptt <- function(a) if (a == "two.sided") "two.sided" else "one.sided"

# ============================================================
# 1. solve for n : one-sample / two-sample / paired  (balanced)
# ============================================================
solveN <- list()
grid <- expand.grid(
  d     = c(0.05, 0.2, 0.5, 0.8, 1.2),
  alpha = c(0.05, 0.01),
  power = c(0.80, 0.90, 0.99),
  tail  = c("two.sided", "greater"),
  type  = c("one.sample", "two.sample", "paired"),
  stringsAsFactors = FALSE
)
for (i in seq_len(nrow(grid))) {
  g <- grid[i, ]
  n_pwr <- tryCatch(
    pwr.t.test(d = g$d, sig.level = g$alpha, power = g$power,
               type = g$type, alternative = g$tail)$n,
    error = function(e) NA_real_)
  n_ptt <- tryCatch(
    power.t.test(delta = g$d, sd = 1, sig.level = g$alpha, power = g$power,
                 type = g$type, alternative = alt_ptt(g$tail), strict = TRUE)$n,
    error = function(e) NA_real_)
  solveN[[length(solveN) + 1]] <- list(
    id = paste0("n_", g$type, "_d", g$d, "_a", g$alpha, "_p", g$power, "_", g$tail),
    type = g$type, d = g$d, alpha = g$alpha, power = g$power, tail = g$tail,
    n_pwr = n_pwr, n_powerttest_strict = n_ptt
  )
}
out$solveN <- solveN

# ============================================================
# 2. solve for n : two-sample with UNEQUAL allocation (n2 = ratio * n1)
#    ground truth = uniroot on pwr.t2n.test's own power body,
#    cross-checked by feeding the solved pair back into pwr.t2n.test.
# ============================================================
solveNRatio <- list()
rgrid <- expand.grid(
  d     = c(0.2, 0.5, 0.8),
  ratio = c(0.5, 1.5, 2, 3),
  alpha = c(0.05, 0.01),
  power = c(0.80, 0.90),
  tail  = c("two.sided", "greater"),
  stringsAsFactors = FALSE
)
for (i in seq_len(nrow(rgrid))) {
  g <- rgrid[i, ]
  n1 <- tryCatch(solve_n1_ratio(g$d, g$alpha, g$power, g$ratio, g$tail),
                 error = function(e) NA_real_)
  n2 <- g$ratio * n1
  # cross-check: pwr.t2n.test must report the target power back at (n1, n2)
  chk <- tryCatch(
    pwr.t2n.test(n1 = n1, n2 = n2, d = g$d, sig.level = g$alpha, alternative = g$tail)$power,
    error = function(e) NA_real_)
  solveNRatio[[length(solveNRatio) + 1]] <- list(
    id = paste0("nr_d", g$d, "_r", g$ratio, "_a", g$alpha, "_p", g$power, "_", g$tail),
    d = g$d, ratio = g$ratio, alpha = g$alpha, power = g$power, tail = g$tail,
    n1 = n1, n2 = n2, power_check_t2n = chk
  )
}
out$solveNRatio <- solveNRatio

# ============================================================
# 3. power at a GIVEN n (drives the what-if slider)
# ============================================================
powerAtN <- list()
pgrid <- expand.grid(
  n     = c(3, 5, 10, 25, 64, 100, 500),
  d     = c(0.05, 0.2, 0.5, 0.8),
  alpha = c(0.05, 0.01),
  tail  = c("two.sided", "greater"),
  type  = c("one.sample", "two.sample", "paired"),
  stringsAsFactors = FALSE
)
for (i in seq_len(nrow(pgrid))) {
  g <- pgrid[i, ]
  p_pwr <- tryCatch(
    pwr.t.test(n = g$n, d = g$d, sig.level = g$alpha, type = g$type, alternative = g$tail)$power,
    error = function(e) NA_real_)
  p_ptt <- tryCatch(
    power.t.test(n = g$n, delta = g$d, sd = 1, sig.level = g$alpha,
                 type = g$type, alternative = alt_ptt(g$tail), strict = TRUE)$power,
    error = function(e) NA_real_)
  powerAtN[[length(powerAtN) + 1]] <- list(
    id = paste0("p_", g$type, "_n", g$n, "_d", g$d, "_a", g$alpha, "_", g$tail),
    type = g$type, n = g$n, d = g$d, alpha = g$alpha, tail = g$tail,
    power_pwr = p_pwr, power_powerttest_strict = p_ptt
  )
}
out$powerAtN <- powerAtN

# ============================================================
# 4. power at a given UNEQUAL pair (n1, n2) - pwr.t2n.test direct
# ============================================================
powerAtN2 <- list()
p2grid <- expand.grid(
  n1    = c(10, 30, 64),
  ratio = c(0.5, 2, 3),
  d     = c(0.2, 0.5, 0.8),
  alpha = c(0.05, 0.01),
  tail  = c("two.sided", "greater"),
  stringsAsFactors = FALSE
)
for (i in seq_len(nrow(p2grid))) {
  g <- p2grid[i, ]
  n2 <- g$ratio * g$n1
  p <- tryCatch(
    pwr.t2n.test(n1 = g$n1, n2 = n2, d = g$d, sig.level = g$alpha, alternative = g$tail)$power,
    error = function(e) NA_real_)
  powerAtN2[[length(powerAtN2) + 1]] <- list(
    id = paste0("p2_n", g$n1, "_r", g$ratio, "_d", g$d, "_a", g$alpha, "_", g$tail),
    n1 = g$n1, n2 = n2, ratio = g$ratio, d = g$d, alpha = g$alpha, tail = g$tail,
    power_t2n = p
  )
}
out$powerAtN2 <- powerAtN2

# ============================================================
# 5. means + sd  ->  Cohen's d  (the "compute d and show it" path)
#    one-sample : d  = (m - mu0) / sd
#    two-sample : d  = (m1 - m2) / sqrt((s1^2 + s2^2)/2)   [equal-n planning pooled SD]
#    paired     : dz = mdiff / sdiff
# ============================================================
dFromMeans <- list()
dcases <- list(
  list(id = "d_one_1",  type = "one.sample", m = 105,  mu0 = 100, sd = 15),
  list(id = "d_one_2",  type = "one.sample", m = 2.4,  mu0 = 2.0, sd = 1.1),
  list(id = "d_one_neg",type = "one.sample", m = 96,   mu0 = 100, sd = 12),
  list(id = "d_two_1",  type = "two.sample", m1 = 105, m2 = 100, s1 = 15, s2 = 15),
  list(id = "d_two_2",  type = "two.sample", m1 = 52,  m2 = 47,  s1 = 9,  s2 = 12),
  list(id = "d_two_neg",type = "two.sample", m1 = 3.2, m2 = 4.0, s1 = 1.5, s2 = 2.1),
  list(id = "d_pair_1", type = "paired",     mdiff = 5, sdiff = 8),
  list(id = "d_pair_2", type = "paired",     mdiff = -0.35, sdiff = 1.2)
)
for (cse in dcases) {
  d <- if (cse$type == "one.sample") {
    (cse$m - cse$mu0) / cse$sd
  } else if (cse$type == "two.sample") {
    (cse$m1 - cse$m2) / sqrt((cse$s1^2 + cse$s2^2) / 2)
  } else {
    cse$mdiff / cse$sdiff
  }
  cse$d <- d
  # n that this derived d implies, at the house defaults
  cse$n_at_default <- tryCatch(
    pwr.t.test(d = abs(d), sig.level = 0.05, power = 0.80,
               type = cse$type, alternative = "two.sided")$n,
    error = function(e) NA_real_)
  dFromMeans[[length(dFromMeans) + 1]] <- cse
}
out$dFromMeans <- dFromMeans

# ============================================================
# 6. the strict= convention, pinned as data (taught on the page)
# ============================================================
out$strictConvention <- list(
  list(id = "strict_d05", d = 0.05, alpha = 0.05, power = 0.80, type = "two.sample",
       n_pwr = pwr.t.test(d = 0.05, sig.level = 0.05, power = 0.80, type = "two.sample")$n,
       n_ptt_default = power.t.test(delta = 0.05, sd = 1, sig.level = 0.05, power = 0.80,
                                    type = "two.sample")$n,
       n_ptt_strict = power.t.test(delta = 0.05, sd = 1, sig.level = 0.05, power = 0.80,
                                   type = "two.sample", strict = TRUE)$n),
  list(id = "strict_d50", d = 0.5, alpha = 0.05, power = 0.80, type = "two.sample",
       n_pwr = pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.80, type = "two.sample")$n,
       n_ptt_default = power.t.test(delta = 0.5, sd = 1, sig.level = 0.05, power = 0.80,
                                    type = "two.sample")$n,
       n_ptt_strict = power.t.test(delta = 0.5, sd = 1, sig.level = 0.05, power = 0.80,
                                   type = "two.sample", strict = TRUE)$n)
)

writeLines(toJSON(out, digits = 15, auto_unbox = TRUE, na = "null"),
           "Scripts/tool-truth/sample-size-t-test-calculator.json")
cat("truth table written\n")
cat("  solveN      :", length(out$solveN), "\n")
cat("  solveNRatio :", length(out$solveNRatio), "\n")
cat("  powerAtN    :", length(out$powerAtN), "\n")
cat("  powerAtN2   :", length(out$powerAtN2), "\n")
cat("  dFromMeans  :", length(out$dFromMeans), "\n")
