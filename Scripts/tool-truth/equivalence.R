# Truth table for equivalence-noninferiority-calculator (v2)
# Ground truth = base R (exact), cross-checked against TOSTER where a canonical fn exists.
# Run: Rscript Scripts/tool-truth/equivalence.R  -> Scripts/tool-truth/equivalence.json
suppressWarnings(suppressMessages(library(jsonlite)))
has_toster <- requireNamespace("TOSTER", quietly = TRUE)
if (has_toster) suppressWarnings(suppressMessages(library(TOSTER)))

cases <- list()
add <- function(x) cases[[length(cases) + 1]] <<- x

# ------- pooled / welch SE + df -------
se_df <- function(sd1, sd2, n1, n2, var_equal) {
  if (var_equal) {
    df <- n1 + n2 - 2
    sp <- sqrt(((n1 - 1) * sd1^2 + (n2 - 1) * sd2^2) / df)
    se <- sp * sqrt(1 / n1 + 1 / n2)
  } else {
    se <- sqrt(sd1^2 / n1 + sd2^2 / n2)
    df <- (sd1^2 / n1 + sd2^2 / n2)^2 /
          ((sd1^2 / n1)^2 / (n1 - 1) + (sd2^2 / n2)^2 / (n2 - 1))
  }
  list(se = se, df = df)
}
pooled_sp <- function(sd1, sd2, n1, n2) sqrt(((n1 - 1) * sd1^2 + (n2 - 1) * sd2^2) / (n1 + n2 - 2))

# ------- ANALYZE continuous -------
analyze_cont <- function(id, m1, m2, sd1, sd2, n1, n2, type, low, high, alpha, var_equal = TRUE, toster = FALSE) {
  diff <- m1 - m2
  sd <- se_df(sd1, sd2, n1, n2, var_equal); se <- sd$se; df <- sd$df
  sp <- pooled_sp(sd1, sd2, n1, n2)
  d <- diff / sp
  tc <- qt(1 - alpha, df)
  t1 <- p1 <- t2 <- p2 <- NA; ciLo <- ciHi <- NA; ciLoInf <- ciHiInf <- FALSE
  if (type == "equiv") {
    t1 <- (diff - low) / se; p1 <- pt(t1, df, lower.tail = FALSE)
    t2 <- (high - diff) / se; p2 <- pt(t2, df, lower.tail = FALSE)
    ciLo <- diff - tc * se; ciHi <- diff + tc * se
    verdict <- if (p1 < alpha && p2 < alpha) "equivalent" else if (ciLo > high || ciHi < low) "not equivalent" else "inconclusive"
  } else if (type == "ni") {
    t1 <- (diff - low) / se; p1 <- pt(t1, df, lower.tail = FALSE)
    ciLo <- diff - tc * se; ciHi <- 0; ciHiInf <- TRUE
    verdict <- if (p1 < alpha) "non-inferior" else "inconclusive"
  } else { # super: same one-sided "diff > margin" test as NI, margin = high (positive)
    t2 <- (diff - high) / se; p2 <- pt(t2, df, lower.tail = FALSE)
    ciLo <- diff - tc * se; ciHi <- 0; ciHiInf <- TRUE
    verdict <- if (p2 < alpha) "superior" else "inconclusive"
  }
  rec <- list(id = id, kind = "analyze_cont", type = type, var_equal = var_equal,
              inp = list(m1 = m1, m2 = m2, sd1 = sd1, sd2 = sd2, n1 = n1, n2 = n2, low = low, high = high, alpha = alpha),
              out = list(diff = diff, se = se, df = df, sp = sp, d = d,
                         t1 = t1, p1 = p1, t2 = t2, p2 = p2,
                         ciLo = ciLo, ciHi = ciHi, ciLoInf = ciLoInf, ciHiInf = ciHiInf,
                         verdict = verdict))
  # cross-check vs TOSTER tsum_TOST (equiv only, both var settings)
  if (toster && has_toster && type == "equiv") {
    tt <- tsum_TOST(m1 = m1, sd1 = sd1, n1 = n1, m2 = m2, sd2 = sd2, n2 = n2,
                    low_eqbound = low, high_eqbound = high, eqbound_type = "raw",
                    alpha = alpha, var.equal = var_equal, bias_correction = FALSE)
    tl <- tt$TOST["TOST Lower", ]; tu <- tt$TOST["TOST Upper", ]
    xc <- list(p1 = tl$p.value, p2 = tu$p.value, df = tl$df,
               ciLo = tt$effsize["Raw", "lower.ci"], ciHi = tt$effsize["Raw", "upper.ci"])
    if (var_equal) xc$d <- tt$effsize["Cohen's d", "estimate"]  # TOSTER uses different SMD denom for Welch
    rec$toster <- xc
  }
  add(rec)
}

# ------- ANALYZE proportions -------
analyze_prop <- function(id, x1, n1, x2, n2, type, low, high, alpha, toster = FALSE) {
  p1 <- x1 / n1; p2 <- x2 / n2; diff <- p1 - p2
  se <- sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2)
  zc <- qnorm(1 - alpha)
  z1 <- pz1 <- z2 <- pz2 <- NA; ciLo <- ciHi <- NA; ciLoInf <- ciHiInf <- FALSE
  if (type == "equiv") {
    z1 <- (diff - low) / se; pz1 <- pnorm(z1, lower.tail = FALSE)
    z2 <- (high - diff) / se; pz2 <- pnorm(z2, lower.tail = FALSE)
    ciLo <- diff - zc * se; ciHi <- diff + zc * se
    verdict <- if (pz1 < alpha && pz2 < alpha) "equivalent" else if (ciLo > high || ciHi < low) "not equivalent" else "inconclusive"
  } else if (type == "ni") {
    z1 <- (diff - low) / se; pz1 <- pnorm(z1, lower.tail = FALSE)
    ciLo <- diff - zc * se; ciHi <- 0; ciHiInf <- TRUE
    verdict <- if (pz1 < alpha) "non-inferior" else "inconclusive"
  } else { # super: diff > high (positive margin), same shape as NI
    z2 <- (diff - high) / se; pz2 <- pnorm(z2, lower.tail = FALSE)
    ciLo <- diff - zc * se; ciHi <- 0; ciHiInf <- TRUE
    verdict <- if (pz2 < alpha) "superior" else "inconclusive"
  }
  rec <- list(id = id, kind = "analyze_prop", type = type,
              inp = list(x1 = x1, n1 = n1, x2 = x2, n2 = n2, low = low, high = high, alpha = alpha),
              out = list(p1 = p1, p2 = p2, diff = diff, se = se,
                         z1 = z1, pz1 = pz1, z2 = z2, pz2 = pz2,
                         ciLo = ciLo, ciHi = ciHi, ciLoInf = ciLoInf, ciHiInf = ciHiInf,
                         verdict = verdict))
  if (toster && has_toster && type == "equiv") {
    tp <- suppressWarnings(TOSTtwo.prop(prop1 = p1, prop2 = p2, n1 = n1, n2 = n2,
                                        low_eqbound = low, high_eqbound = high, alpha = alpha,
                                        plot = FALSE, verbose = FALSE))
    rec$toster <- list(z1 = tp$TOST_z1, pz1 = tp$TOST_p1, z2 = tp$TOST_z2, pz2 = tp$TOST_p2,
                       ciLo = tp$LL_CI_TOST, ciHi = tp$UL_CI_TOST)
  }
  add(rec)
}

# ------- PLAN continuous (sample size per group), bounds in d units, sd=1 -------
plan_cont <- function(id, type, low, high, mu, alpha, power, toster = FALSE) {
  za <- qnorm(1 - alpha)
  if (type == "equiv") {
    zb <- qnorm(1 - (1 - power) / 2)
    NT_low <- 2 * (za + zb)^2 / (mu - low)^2
    NT_high <- 2 * (za + zb)^2 / (mu - high)^2
    nraw <- max(NT_low, NT_high)
  } else if (type == "ni") {
    zb <- qnorm(power)
    nraw <- 2 * (za + zb)^2 / (mu - low)^2
  } else {
    zb <- qnorm(power)
    nraw <- 2 * (za + zb)^2 / (mu - high)^2
  }
  n <- ceiling(nraw)
  rec <- list(id = id, kind = "plan_cont", type = type,
              inp = list(low = low, high = high, mu = mu, alpha = alpha, power = power),
              out = list(nraw = nraw, n = n, ntotal = 2 * n))
  if (toster && has_toster && type == "equiv") {
    r <- suppressWarnings(suppressMessages(powerTOSTtwo.raw(alpha = alpha, statistical_power = power,
                                                            sdpooled = 1, low_eqbound = low, high_eqbound = high, delta = mu)))
    rec$toster <- list(nraw = r, n = ceiling(r))
  }
  add(rec)
}

# ------- PLAN proportions (sample size per group) -------
plan_prop <- function(id, type, p1, p2, low, high, alpha, power, toster = FALSE) {
  za <- qnorm(1 - alpha)
  sig2 <- p1 * (1 - p1) + p2 * (1 - p2)
  if (type == "equiv") {
    zb <- qnorm(1 - (1 - power) / 2)
    NT_low <- sig2 * ((za + zb) / (abs(p1 - p2) - abs(low)))^2
    NT_high <- sig2 * ((za + zb) / (abs(p1 - p2) - abs(high)))^2
    nraw <- max(NT_low, NT_high)
  } else if (type == "ni") {
    zb <- qnorm(power)
    nraw <- sig2 * ((za + zb) / ((p1 - p2) - low))^2
  } else {
    zb <- qnorm(power)
    nraw <- sig2 * ((za + zb) / ((p1 - p2) - high))^2
  }
  n <- ceiling(nraw)
  rec <- list(id = id, kind = "plan_prop", type = type,
              inp = list(p1 = p1, p2 = p2, low = low, high = high, alpha = alpha, power = power),
              out = list(nraw = nraw, n = n, ntotal = 2 * n))
  if (toster && has_toster && type == "equiv") {
    r <- suppressWarnings(suppressMessages(powerTOSTtwo.prop(alpha = alpha, statistical_power = power,
                                                            prop1 = p1, prop2 = p2,
                                                            low_eqbound_prop = low, high_eqbound_prop = high)))
    rec$toster <- list(nraw = r, n = ceiling(r))
  }
  add(rec)
}

# ================= CASES =================
# Analyze continuous - equivalence (default scenario), pooled + welch, 3 alphas
analyze_cont("ac_equiv_pooled_a05", 10, 10.05, 0.5, 0.5, 50, 50, "equiv", -0.5, 0.5, 0.05, TRUE, toster = TRUE)
analyze_cont("ac_equiv_pooled_a025", 10, 10.05, 0.5, 0.5, 50, 50, "equiv", -0.5, 0.5, 0.025, TRUE, toster = TRUE)
analyze_cont("ac_equiv_pooled_a10", 10, 10.05, 0.5, 0.5, 50, 50, "equiv", -0.5, 0.5, 0.10, TRUE, toster = TRUE)
analyze_cont("ac_equiv_welch", 10, 10.3, 0.5, 0.8, 30, 45, "equiv", -0.5, 0.5, 0.05, FALSE, toster = TRUE)
analyze_cont("ac_equiv_asym", 5, 5.2, 1.1, 0.9, 40, 60, "equiv", -0.4, 0.6, 0.05, TRUE, toster = TRUE)
analyze_cont("ac_equiv_tinyN", 20, 20.5, 2, 2.4, 4, 4, "equiv", -3, 3, 0.05, TRUE, toster = TRUE)
analyze_cont("ac_equiv_notequiv", 10, 12, 1, 1, 30, 30, "equiv", -0.5, 0.5, 0.05, TRUE, toster = TRUE)
analyze_cont("ac_equiv_negdiff", 8.5, 8.0, 1.2, 1.0, 25, 35, "equiv", -0.8, 0.8, 0.05, TRUE, toster = TRUE)
# Analyze continuous - NI / super
analyze_cont("ac_ni_a025", 90, 88, 12, 11, 120, 120, "ni", -5, 5, 0.025, TRUE)
analyze_cont("ac_ni_incon", 50, 52, 8, 8, 40, 40, "ni", -3, 3, 0.05, TRUE)
analyze_cont("ac_super_a05", 80, 71, 10, 11, 60, 60, "super", -3, 3, 0.05, TRUE)
analyze_cont("ac_super_incon", 78, 76, 10, 11, 60, 60, "super", -3, 3, 0.05, TRUE)
# Analyze proportions - equivalence / ni / super
analyze_prop("ap_equiv_a05", 92, 100, 90, 100, "equiv", -0.10, 0.10, 0.05, toster = TRUE)
analyze_prop("ap_equiv_a025", 180, 200, 176, 200, "equiv", -0.08, 0.08, 0.025, toster = TRUE)
analyze_prop("ap_ni_a025", 180, 200, 170, 200, "ni", -0.10, 0.10, 0.025)
analyze_prop("ap_super", 150, 200, 120, 200, "super", -0.05, 0.05, 0.05)
analyze_prop("ap_edge_x0", 0, 80, 3, 80, "equiv", -0.15, 0.15, 0.05, toster = TRUE)
analyze_prop("ap_edge_xn", 100, 100, 96, 100, "ni", -0.10, 0.10, 0.05)
# Plan continuous
plan_cont("pc_equiv_d04", "equiv", -0.4, 0.4, 0.0, 0.05, 0.80, toster = TRUE)
plan_cont("pc_equiv_d04_p90", "equiv", -0.4, 0.4, 0.0, 0.05, 0.90, toster = TRUE)
plan_cont("pc_equiv_mu02", "equiv", -0.5, 0.5, 0.2, 0.05, 0.80, toster = TRUE)
plan_cont("pc_equiv_asym", "equiv", -0.3, 0.5, 0.1, 0.05, 0.80, toster = TRUE)
plan_cont("pc_ni_05", "ni", -0.5, 0.5, 0.0, 0.05, 0.80)
plan_cont("pc_ni_a025_p90", "ni", -0.4, 0.4, 0.0, 0.025, 0.90)
plan_cont("pc_super_03", "super", -0.5, 0.3, 0.5, 0.05, 0.80)
# Plan proportions
plan_prop("pp_equiv_05", "equiv", 0.5, 0.5, -0.05, 0.05, 0.05, 0.80, toster = TRUE)
plan_prop("pp_equiv_asym", "equiv", 0.6, 0.55, -0.08, 0.12, 0.05, 0.80, toster = TRUE)
plan_prop("pp_ni_10", "ni", 0.85, 0.85, -0.10, 0.10, 0.025, 0.80)
plan_prop("pp_super", "super", 0.7, 0.6, -0.05, 0.05, 0.05, 0.90)

# ---- Assert TOSTER cross-checks agree (fail loudly) ----
tol <- 1e-7; nfail <- 0
for (c in cases) {
  if (!is.null(c$toster)) {
    for (k in names(c$toster)) {
      a <- c$toster[[k]]; b <- c$out[[k]]
      if (is.null(b) || is.na(a) || is.na(b)) next
      if (k %in% c("z1", "z2")) { a <- abs(a); b <- abs(b) }  # TOSTER negates z2 by convention
      rel <- abs(a - b) / max(1, abs(a))
      if (rel > tol) { cat(sprintf("XCHECK FAIL %s.%s: R=%.10g TOSTER=%.10g rel=%.2e\n", c$id, k, b, a, rel)); nfail <- nfail + 1 }
    }
  }
}
cat(sprintf("TOSTER cross-checks: %d cases with toster, %d field-fails\n", sum(sapply(cases, function(x) !is.null(x$toster))), nfail))
if (nfail > 0) stop("TOSTER cross-check mismatch")

writeLines(toJSON(cases, auto_unbox = TRUE, digits = 15, pretty = TRUE, na = "null"),
           "Scripts/tool-truth/equivalence.json")
cat("WROTE", length(cases), "cases to Scripts/tool-truth/equivalence.json\n")
