# Truth table for tools/sample-size-anova-calculator.html
# Oracles: pwr::pwr.anova.test, stats::power.anova.test
#
# CONVENTION NOTES (verified 2026-07-16 against R 4.6.0 source):
#
# 1. The two oracles use DIFFERENT-LOOKING noncentrality parameters that are
#    algebraically identical once you know which variance denominator each wants:
#       pwr.anova.test  : lambda = k * n * f^2
#       power.anova.test: lambda = (groups - 1) * n * (between.var / within.var)
#    Cohen's f uses the POPULATION spread of the means (denominator k):
#       f = sqrt(sum((m_i - mbar)^2) / k) / sd
#    R's var() uses the SAMPLE denominator (k - 1), so feeding
#    between.var = var(means), within.var = sd^2 gives
#       between.var/within.var = f^2 * k/(k-1)
#    and (k-1) * n * f^2 * k/(k-1) = k * n * f^2 = pwr's lambda. EXACT agreement.
#    Both functions use the same df: df1 = k-1, df2 = (n-1)*k.
#    Any residual gap between them is uniroot tolerance, not a formula difference.
#
# 2. R IS NOT AN ORACLE FOR n AT 1e-6. Both functions root via uniroot at the
#    DEFAULT tol = .Machine$double.eps^0.25 = 1.22e-4. Direct-n comparison is
#    gated at 1e-5; the load-bearing gates are the tolerance-free power identity
#    and ceiling agreement (the integer the user actually reads).
#
# 3. R'S qf() IS APPROXIMATE ONCE df2 > 4e5, AND pwr.anova.test INHERITS IT.
#    From R's own src/nmath/qf.c:
#        /* fudge the extreme DF cases -- qbeta doesn't do this well. */
#        if (df1 <= df2 && df2 > 4e5) return qchisq(p, df1, lower_tail, log_p) / df1;
#    So for df2 = (n-1)*k > 400000, qf() silently returns the CHI-SQUARE LIMITING
#    approximation instead of inverting the F CDF. At df2 = 401451 that is wrong by
#    9.5e-5: qf(.001, 4, 401451, lower=FALSE) = 4.616706738 (== qchisq(.999,4)/4),
#    but R's OWN pf() at that point returns 0.998999829, not 0.999. The true root is
#    4.616801424. df2 = 4e5 exactly is fine; 401451 is not - the switch, not the size.
#    Consequence: at df2 > 4e5 the tool and pwr.anova.test disagree by ~1 participant
#    in ~80000 (studies with N > 400000, i.e. f = 0.01 at power .99). The tool keeps
#    the ACCURATE value, adjudicated below against R's own pf() via the qbeta route.
#    qfFudge/solveNTrue pin this so a future edit cannot silently "fix" it backwards.
#
# 3. k = 2 RECONCILIATION: a one-way ANOVA on 2 groups is the two-sided
#    two-sample t-test (F = t^2, df1 = 1). Cohen's f = d/2 at k = 2, so
#    pwr.anova.test(k=2, f=d/2) == pwr.t.test(d=d, type="two.sample"). Pinned below.

suppressMessages(library(pwr))
suppressMessages(library(jsonlite))

out <- list()

# ---------- independent re-implementation of pwr.anova.test's power body ----------
# (used to adjudicate n and to prove the power identity without circularity)
anova_power <- function(f, k, n, sig.level) {
  lambda <- k * n * f^2
  pf(qf(sig.level, k - 1, (n - 1) * k, lower = FALSE),
     k - 1, (n - 1) * k, lambda, lower = FALSE)
}

f_from_means <- function(means, sd) sqrt(sum((means - mean(means))^2) / length(means)) / sd

# ---------- ACCURATE F quantile: inverts the F CDF via qbeta, bypassing R's
#            qf() chi-square fudge for df2 > 4e5 (see note 3 above). ----------
qf_acc <- function(p, df1, df2) {
  x <- qbeta(p, df1 / 2, df2 / 2)
  df2 * x / (df1 * (1 - x))
}
anova_power_acc <- function(f, k, n, sig.level) {
  df1 <- k - 1; df2 <- (n - 1) * k
  pf(qf_acc(1 - sig.level, df1, df2), df1, df2, k * n * f^2, lower = FALSE)
}
QF_FUDGE_DF2 <- 4e5   # R's qf() switches to qchisq(p,df1)/df1 strictly above this

# ============================================================
# A. solveN : n per group from f, k, power, alpha  (pwr.anova.test)
# ============================================================
ks     <- c(2, 3, 4, 5, 6, 8, 10)
fs     <- c(0.01, 0.05, 0.10, 0.15, 0.25, 0.40, 0.60, 1.00)
powers <- c(0.50, 0.80, 0.90, 0.95, 0.99)
alphas <- c(0.001, 0.01, 0.05, 0.10)

out$solveN <- list()
for (k in ks) for (f in fs) for (pw in powers) for (a in alphas) {
  r <- try(pwr.anova.test(k = k, f = f, sig.level = a, power = pw), silent = TRUE)
  if (inherits(r, "try-error")) next
  df2 <- (r$n - 1) * k
  rec <- list(
    k = k, f = f, power = pw, alpha = a,
    n = r$n, n_ceil = ceiling(r$n), N_total = ceiling(r$n) * k,
    df2 = df2,
    # TRUE once R's qf() has silently switched to the chi-square approximation
    qf_fudged = (df2 > QF_FUDGE_DF2),
    # tolerance-free check: power evaluated at R's own n, via R's own pf/qf
    power_at_n = anova_power(f, k, r$n, a)
  )
  # For fudged cases R's n is NOT the reference. Solve the accurate root with
  # R's own pf() + the qbeta quantile, at a tolerance far below uniroot's default.
  if (rec$qf_fudged) {
    tr <- try(uniroot(function(n) anova_power_acc(f, k, n, a) - pw,
                      c(max(2 + 1e-9, r$n * 0.9), r$n * 1.1), tol = 1e-10)$root, silent = TRUE)
    if (!inherits(tr, "try-error")) {
      rec$n_true <- tr
      rec$n_true_ceil <- ceiling(tr)
      rec$power_at_n_true <- anova_power_acc(f, k, tr, a)
      # R's own pf says its qf-based n MISSES the target by this much:
      rec$power_at_R_n_acc <- anova_power_acc(f, k, r$n, a)
    }
  }
  out$solveN[[length(out$solveN) + 1]] <- rec
}

# ============================================================
# A2. qf() FUDGE: pin the threshold and the size of the error, so the
#     divergence above is documented as R's approximation, not our drift.
# ============================================================
out$qfFudge <- list(threshold = QF_FUDGE_DF2, cases = list())
for (df2 in c(1e5, 3.9e5, 4e5, 400001, 401451.06613987255, 5e5, 1e6, 1e7)) {
  q_R <- qf(0.001, 4, df2, lower = FALSE)
  q_acc <- qf_acc(0.999, 4, df2)
  out$qfFudge$cases[[length(out$qfFudge$cases) + 1]] <- list(
    df1 = 4, df2 = df2, p = 0.999,
    qf_R = q_R,                       # what pwr.anova.test sees
    qf_accurate = q_acc,              # the true inverse of the F CDF
    pf_at_qf_R = pf(q_R, 4, df2),     # R's OWN pf disagrees with 0.999 when fudged
    pf_at_qf_acc = pf(q_acc, 4, df2), # == 0.999
    chisq_limit = qchisq(0.999, 4) / 4,
    fudged = (df2 > QF_FUDGE_DF2),
    abs_err = abs(q_R - q_acc))
}

# ============================================================
# B. powerAtN : power from f, k, n, alpha
# ============================================================
out$powerAtN <- list()
for (k in c(2, 3, 4, 6, 8, 10)) for (f in fs) for (n in c(2, 3, 5, 10, 25, 50, 100, 500)) for (a in c(0.01, 0.05, 0.10)) {
  r <- try(pwr.anova.test(k = k, n = n, f = f, sig.level = a), silent = TRUE)
  if (inherits(r, "try-error")) next
  out$powerAtN[[length(out$powerAtN) + 1]] <- list(
    k = k, f = f, n = n, alpha = a, power = r$power)
}

# ============================================================
# C. solveF : detectable f from k, n, power, alpha
# ============================================================
out$solveF <- list()
for (k in c(2, 3, 4, 5, 8)) for (n in c(5, 10, 20, 30, 50, 100, 200)) for (pw in c(0.50, 0.80, 0.90, 0.95)) for (a in c(0.01, 0.05)) {
  r <- try(pwr.anova.test(k = k, n = n, sig.level = a, power = pw), silent = TRUE)
  if (inherits(r, "try-error")) next
  out$solveF[[length(out$solveF) + 1]] <- list(
    k = k, n = n, power = pw, alpha = a, f = r$f,
    power_at_f = anova_power(r$f, k, n, a))
}

# ============================================================
# D. fFromMeans : Cohen's f from group means + common sd, and the n it implies
#    Also carries the power.anova.test equivalence for the SAME inputs.
# ============================================================
mean_sets <- list(
  list(means = c(10, 12, 15, 11),      sd = 4),      # doc-style 4 groups
  list(means = c(0, 0.5),              sd = 1),      # k=2, f = d/2 = 0.25
  list(means = c(100, 100, 100),       sd = 15),     # null: f = 0
  list(means = c(5, 10),               sd = 2),      # k=2 large
  list(means = c(1, 2, 3, 4, 5),       sd = 1.5),    # evenly spaced
  list(means = c(20, 20, 20, 25),      sd = 5),      # one group differs
  list(means = c(2.1, 2.2, 2.15),      sd = 0.8),    # tiny f
  list(means = c(50, 55, 60, 52, 58, 61, 49, 57), sd = 6)  # k=8
)
out$fFromMeans <- list()
for (ms in mean_sets) {
  m <- ms$means; sd <- ms$sd; k <- length(m)
  f <- f_from_means(m, sd)
  eta2 <- f^2 / (1 + f^2)
  rec <- list(means = m, sd = sd, k = k, f = f, eta2 = eta2,
              grand_mean = mean(m),
              between_var_R = var(m),      # var() -> k-1 denominator
              within_var = sd^2,
              ss_between_unit = sum((m - mean(m))^2))
  if (f > 0) {
    a <- pwr.anova.test(k = k, f = f, sig.level = 0.05, power = 0.80)
    b <- power.anova.test(groups = k, between.var = var(m), within.var = sd^2,
                          sig.level = 0.05, power = 0.80)
    rec$n_pwr <- a$n
    rec$n_ceil <- ceiling(a$n)
    rec$n_power_anova_test <- b$n
    rec$equiv_abs_diff <- abs(a$n - b$n)
    rec$ceil_agree <- ceiling(a$n) == ceiling(b$n)
  }
  out$fFromMeans[[length(out$fFromMeans) + 1]] <- rec
}

# ============================================================
# E. EQUIVALENCE: pwr.anova.test vs stats::power.anova.test across a grid
#    between.var = var(means) with the k-1 denominator is the bridge.
# ============================================================
out$equivalence <- list()
for (k in c(2, 3, 4, 6, 8)) for (f in c(0.05, 0.10, 0.25, 0.40, 0.80)) for (pw in c(0.80, 0.90, 0.95)) {
  # construct means with EXACTLY this Cohen's f at within.var = 1:
  # take a symmetric spread scaled so that sqrt(sum((m-mbar)^2)/k) = f
  raw <- scale(seq_len(k))[, 1]                    # mean 0, sample sd 1
  pop_sd <- sqrt(sum(raw^2) / k)
  m <- raw / pop_sd * f                            # now population-sd of means == f
  stopifnot(abs(f_from_means(m, 1) - f) < 1e-12)
  a <- pwr.anova.test(k = k, f = f, sig.level = 0.05, power = pw)
  b <- power.anova.test(groups = k, between.var = var(m), within.var = 1,
                        sig.level = 0.05, power = pw)
  out$equivalence[[length(out$equivalence) + 1]] <- list(
    k = k, f = f, power = pw,
    n_pwr = a$n, n_pat = b$n, abs_diff = abs(a$n - b$n),
    ceil_agree = ceiling(a$n) == ceiling(b$n),
    between_var = var(m), within_var = 1,
    # the algebraic bridge, asserted numerically:
    ratio_over_f2 = (var(m) / 1) / f^2,            # must equal k/(k-1)
    k_over_km1 = k / (k - 1))
}

# ============================================================
# F. k = 2 RECONCILIATION with the two-sample t-test tool
#    f = d/2  =>  pwr.anova.test(k=2, f=d/2) == pwr.t.test(d, "two.sample")
# ============================================================
out$k2Reconcile <- list()
for (d in c(0.05, 0.10, 0.20, 0.50, 0.80, 1.20)) for (pw in c(0.80, 0.90, 0.95)) for (a in c(0.01, 0.05)) {
  tt <- pwr.t.test(d = d, sig.level = a, power = pw, type = "two.sample", alternative = "two.sided")
  an <- pwr.anova.test(k = 2, f = d / 2, sig.level = a, power = pw)
  out$k2Reconcile[[length(out$k2Reconcile) + 1]] <- list(
    d = d, f = d / 2, power = pw, alpha = a,
    n_t = tt$n, n_anova = an$n, abs_diff = abs(tt$n - an$n),
    ceil_agree = ceiling(tt$n) == ceiling(an$n))
}

# ============================================================
# G. eta-squared <-> f conversion
# ============================================================
out$eta2 <- list()
for (e in c(0.0001, 0.001, 0.01, 0.0588, 0.10, 0.1379, 0.25, 0.50, 0.75)) {
  f <- sqrt(e / (1 - e))
  out$eta2[[length(out$eta2) + 1]] <- list(eta2 = e, f = f, back_eta2 = f^2 / (1 + f^2))
}
# Cohen's benchmarks, exact eta2 partners
out$benchmarks <- list()
for (f in c(0.10, 0.25, 0.40)) {
  out$benchmarks[[length(out$benchmarks) + 1]] <- list(
    f = f, eta2 = f^2 / (1 + f^2),
    n_k3_80 = pwr.anova.test(k = 3, f = f, sig.level = 0.05, power = 0.80)$n,
    n_k3_80_ceil = ceiling(pwr.anova.test(k = 3, f = f, sig.level = 0.05, power = 0.80)$n))
}

# ============================================================
# H. n vs k at fixed f (the what-if): per-group n FALLS, total N RISES
# ============================================================
out$nVsK <- list()
for (f in c(0.10, 0.25, 0.40)) for (k in 2:10) {
  r <- pwr.anova.test(k = k, f = f, sig.level = 0.05, power = 0.80)
  out$nVsK[[length(out$nVsK) + 1]] <- list(
    f = f, k = k, n = r$n, n_ceil = ceiling(r$n), N_total = ceiling(r$n) * k)
}

# ============================================================
# I. Documented edge cases
# ============================================================
out$edge <- list(
  # R's own ?power.anova.test example, verbatim
  doc_example = local({
    groupmeans <- c(120, 130, 140, 150)
    r <- power.anova.test(groups = length(groupmeans),
                          between.var = var(groupmeans),
                          within.var = 500, power = 0.90)
    list(groupmeans = groupmeans, within.var = 500, power = 0.90,
         n = r$n, n_ceil = ceiling(r$n),
         f = f_from_means(groupmeans, sqrt(500)),
         n_pwr = pwr.anova.test(k = 4, f = f_from_means(groupmeans, sqrt(500)),
                                sig.level = 0.05, power = 0.90)$n)
  }),
  # textbook free check: k=2, d=0.5 -> f=0.25 -> 64 per group
  textbook_k2 = list(f = 0.25, k = 2, power = 0.80, alpha = 0.05,
                     n = pwr.anova.test(k = 2, f = 0.25, sig.level = 0.05, power = 0.80)$n),
  # tiny f
  tiny_f = list(f = 0.01, k = 3, power = 0.80, alpha = 0.05,
                n = pwr.anova.test(k = 3, f = 0.01, sig.level = 0.05, power = 0.80)$n),
  # power .99
  power99 = list(f = 0.25, k = 4, power = 0.99, alpha = 0.05,
                 n = pwr.anova.test(k = 4, f = 0.25, sig.level = 0.05, power = 0.99)$n),
  # many groups
  k8 = list(f = 0.25, k = 8, power = 0.80, alpha = 0.05,
            n = pwr.anova.test(k = 8, f = 0.25, sig.level = 0.05, power = 0.80)$n),
  # power at n = 2 (minimum legal n)
  n2 = list(f = 0.40, k = 3, n = 2, alpha = 0.05,
            power = pwr.anova.test(k = 3, n = 2, f = 0.40, sig.level = 0.05)$power),
  # f = 0 -> power == alpha (the null)
  f0 = list(f = 0, k = 3, n = 20, alpha = 0.05,
            power = anova_power(0, 3, 20, 0.05))
)

writeLines(toJSON(out, digits = 15, auto_unbox = TRUE, na = "null"),
           "Scripts/tool-truth/sample-size-anova-calculator.json")
cat("truth table written\n")
cat("  solveN      :", length(out$solveN), "\n")
cat("  powerAtN    :", length(out$powerAtN), "\n")
cat("  solveF      :", length(out$solveF), "\n")
cat("  fFromMeans  :", length(out$fFromMeans), "\n")
cat("  equivalence :", length(out$equivalence), "\n")
cat("  k2Reconcile :", length(out$k2Reconcile), "\n")
cat("  eta2        :", length(out$eta2), "\n")
cat("  nVsK        :", length(out$nVsK), "\n")
