# Truth table for beta-distribution-calculator
# Ground truth: R 4.6.0 dbeta() / pbeta() / qbeta() on Beta(shape1, shape2).
# Modes: below P(X<=x), above P(X>x), between P(a<=X<=b), quantile (inverse
# from a left / right area) + the closed-form moments (mean, var, sd, mode).
#
# The tool composes tools/lib/ttest-math.js (lgamma + regularized incomplete
# beta). pbeta(x,a,b) IS the regularized incomplete beta I_x(a,b), so the CDF
# is a direct reuse. The upper tail has two algebraically equal forms that
# disagree in floating point (1 - I_x(a,b) vs I_{1-x}(b,a)); the deep-tail and
# tiny-x cases below are what force the tool to pick the right one per input.

g <- function(x) formatC(x, format = "e", digits = 12)  # 13 sig figs

cases <- list()
add <- function(id, mode, inp, out) {
  cases[[length(cases) + 1]] <<- list(id = id, mode = mode, inp = inp, out = out)
}

# ---- moments (closed form; mode only defined piecewise) -----------------
moments <- function(a, b) {
  m  <- a / (a + b)
  v  <- a * b / ((a + b)^2 * (a + b + 1))
  md <- if (a > 1 && b > 1) (a - 1) / (a + b - 2)
        else if (a == 1 && b == 1) NA_real_        # every point is a mode
        else if (a <= 1 && b > 1) 0
        else if (a > 1 && b <= 1) 1
        else NA_real_                              # a<1 & b<1 -> bimodal at 0 and 1
  list(mean = m, var = v, sd = sqrt(v), mode = md)
}

# ---- BELOW / ABOVE: density at x + both tails ---------------------------
tails <- function(id, x, a, b) {
  mo <- moments(a, b)
  add(id, "below", list(x = x, a = a, b = b),
      list(d = dbeta(x, a, b),
           p_below = pbeta(x, a, b),
           p_above = pbeta(x, a, b, lower.tail = FALSE),
           mean = mo$mean, var = mo$var, sd = mo$sd, mode = mo$mode))
}
# uniform special case: Beta(1,1) -> density 1 everywhere, CDF = x
tails("unif_mid",        0.5,  1,   1)
tails("unif_lo",         0.1,  1,   1)
# conversion-rate posterior: 30 successes / 70 failures under a uniform prior
tails("posterior_mid",   0.30, 31,  71)
tails("posterior_at_35", 0.35, 31,  71)
tails("posterior_at_25", 0.25, 31,  71)
# skewed prior
tails("skew_prior",      0.20, 2,   8)
tails("skew_prior_hi",   0.60, 2,   8)
# alpha < 1 -> density spike at 0 (integrable singularity)
tails("spike_small_x",   0.01, 0.5, 0.5)   # arcsine: spikes at BOTH ends
tails("spike_a02",       0.05, 0.2, 3)
tails("spike_a02_mid",   0.50, 0.2, 3)
# large a+b -> near-normal
tails("near_normal",     0.50, 500, 500)
tails("near_normal_off", 0.52, 500, 500)
# boundaries
tails("bound_zero",      0,    2,   5)
tails("bound_one",       1,    2,   5)
tails("bound_zero_unif", 0,    1,   1)
# deep tail (upper tail must not cancel against 1)
tails("deep_upper",      0.95, 2,   5)
tails("deep_lower",      0.02, 2,   5)
tails("j_shape",         0.80, 1,   3)     # a=1 -> mode at 0
tails("j_shape_rev",     0.80, 3,   1)     # b=1 -> mode at 1

# ---- BETWEEN: P(lo <= X <= hi) -----------------------------------------
between <- function(id, lo, hi, a, b) {
  pr <- pbeta(hi, a, b) - pbeta(lo, a, b)
  mo <- moments(a, b)
  add(id, "between", list(lo = lo, hi = hi, a = a, b = b),
      list(p_between = pr, p_outside = 1 - pr,
           p_lo = pbeta(lo, a, b), p_hi = pbeta(hi, a, b),
           mean = mo$mean, var = mo$var, sd = mo$sd, mode = mo$mode))
}
between("btw_posterior_ci", 0.2223, 0.3915, 31, 71)  # ~95% credible band
between("btw_unif",         0.25,   0.75,   1,  1)
between("btw_skew",         0.05,   0.35,   2,  8)
between("btw_near_normal",  0.48,   0.52,   500, 500)
between("btw_full",         0,      1,      2,  5)   # = 1
between("btw_spike",        0,      0.10,   0.5, 0.5)

# ---- QUANTILE (inverse): value holding a left / right area --------------
quant <- function(id, p, a, b) {
  mo <- moments(a, b)
  add(id, "quantile", list(p = p, a = a, b = b),
      list(q_left  = qbeta(p, a, b),                      # P(X <= q) = p
           q_right = qbeta(p, a, b, lower.tail = FALSE),  # P(X >  q) = p
           mean = mo$mean, var = mo$var, sd = mo$sd, mode = mo$mode))
}
quant("q_median_post",  0.50,  31,  71)
quant("q_025_post",     0.025, 31,  71)   # credible-interval endpoints
quant("q_975_post",     0.975, 31,  71)
quant("q_unif",         0.30,  1,   1)    # qbeta(p,1,1) = p exactly
quant("q_skew",         0.90,  2,   8)
quant("q_extreme_lo",   0.001, 2,   5)    # extreme quantiles
quant("q_extreme_hi",   0.999, 2,   5)
quant("q_extreme_lo_p", 0.001, 31,  71)
quant("q_extreme_hi_p", 0.999, 31,  71)
quant("q_spike",        0.001, 0.5, 0.5)  # a<1, deep left
quant("q_spike_hi",     0.999, 0.5, 0.5)
quant("q_near_normal",  0.975, 500, 500)
quant("q_a02",          0.500, 0.2, 3)
quant("q_bound_0",      0,     2,   5)    # -> 0
quant("q_bound_1",      1,     2,   5)    # -> 1
# Two roots that live at the edge of what a double can hold. q_right here is
# the interesting half of each: Beta(0.5,0.5) at upper 1e-6 sits at
# 1 - 2.47e-12 (unresolvable near 1 - R's own pbeta(qbeta(...)) round-trip
# misses by 8e-6 too), and Beta(0.2,3) at upper 0.999 sits at 2.5e-16, which
# IS resolvable and which a step-length convergence test quits short of.
quant("q_upper_tiny_spike", 1e-6, 0.5, 0.5)
quant("q_upper_a02_deep",   0.999, 0.2, 3)

# ---- emit ---------------------------------------------------------------
fmt <- function(v) {
  if (is.list(v)) return(lapply(v, fmt))
  if (is.numeric(v)) {
    if (length(v) == 1 && is.na(v)) return("NA")
    return(g(v))
  }
  v
}
out <- lapply(cases, function(cs) {
  list(id = cs$id, mode = cs$mode,
       inp = lapply(cs$inp, fmt), out = lapply(cs$out, fmt))
})
writeLines(jsonlite::toJSON(out, auto_unbox = TRUE, pretty = TRUE),
           "Scripts/tool-truth/beta-distribution-calculator.json")
cat("cases:", length(out), "\n")
