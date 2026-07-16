# Truth table for tools/bayesian-ab-test-calculator.html
# R 4.6.0.  Ground truth for the beta-binomial Bayesian A/B decision math.
#
# TWO INDEPENDENT ROUTES per quantity, as the spec demands:
#   (a) fine numeric integration  -> the PRECISION oracle (integrate(), rel.tol 1e-12)
#   (b) large Monte Carlo (rbeta) -> the DERIVATION oracle (independent of the
#       integrand algebra; catches a wrong formula, which route (a) cannot).
#
# Posterior for arm A: Beta(a1, b1) = Beta(a0 + cA, b0 + nA - cA); likewise B.

suppressWarnings(library(jsonlite))

# ---- route (a): numeric integration --------------------------------------
#
# WHY THE INTEGRATION WINDOW IS NOT [0, 1]:
# a concentrated posterior (e.g. 5000/100000 -> sd 0.0007) is a narrow spike.
# integrate(f, 0, 1) lays its first Gauss-Kronrod grid across the whole unit
# interval, sees ~0 at every node, MISSES the spike and returns ~0 *reporting
# success*.  That silently produced loss ~1e-19 for the big-n case, which the
# identity  loss_A - loss_B == mean_B - mean_A  (true by E[x+]-E[(-x)+]=E[x])
# exposed as wrong by 1.5e-3.  So: confine each integral to the range where the
# density factor actually has mass, via exact qbeta quantiles, and hand the
# other arm's window in as split points so the adaptive rule resolves the
# transition region instead of straddling it.

QTAIL <- 1e-14   # drop this much probability from each tail of the window

# Quantile window for Beta(a, b): the support that carries all but QTAIL.
win <- function(a, b) c(qbeta(QTAIL, a, b), qbeta(1 - QTAIL, a, b))

# Worst QUADPACK error estimate seen, so the harness can be told how good the
# truth actually is instead of assuming it.
MAXERR <- new.env(); MAXERR$v <- 0

# Integrate f piecewise between sorted split points clipped to [lo, hi].
# stop.on.error = FALSE: at rel.tol 1e-12 QUADPACK reports "roundoff error is
# detected in the extrapolation table" on pieces where it has already reached
# machine precision.  The returned value is good; only the certificate is not.
# Keep the value, and keep its reported abs.error so accuracy stays measured.
pieces <- function(f, lo, hi, extra = numeric(0)) {
  pts <- sort(unique(pmin(hi, pmax(lo, c(lo, extra, hi)))))
  tot <- 0
  for (i in seq_len(length(pts) - 1L)) {
    if (pts[i + 1L] <= pts[i]) next
    r <- integrate(f, pts[i], pts[i + 1L], rel.tol = 1e-12,
                   subdivisions = 4000L, stop.on.error = FALSE)
    tot <- tot + r$value
    MAXERR$v <- max(MAXERR$v, r$abs.error)
  }
  tot
}

# P(B > A) = int f_B(b) F_A(b) db, over B's window, split on A's window.
pBgtA <- function(a1, b1, a2, b2) {
  wB <- win(a2, b2)
  v <- pieces(function(b) dbeta(b, a2, b2) * pbeta(b, a1, b1),
              wB[1], wB[2], win(a1, b1))
  min(1, max(0, v))
}

# E[max(pB - pA, 0)] : the expected loss of CHOOSING A (A picked, B was better).
# inner: int_a^1 (x - a) f_B(x) dx = mB * sf(a; a2+1, b2) - a * sf(a; a2, b2)
#        using E[x * 1(x>c)] = mean * sf(c; alpha+1, beta).
# The sf() factors stay EXACT (never truncated); only the outer f_A range is
# windowed, and f_A is what confines the integrand.
lossChooseA <- function(a1, b1, a2, b2) {
  mB <- a2 / (a2 + b2)
  f <- function(a) {
    dbeta(a, a1, b1) * (mB * pbeta(a, a2 + 1, b2, lower.tail = FALSE) -
                          a * pbeta(a, a2, b2, lower.tail = FALSE))
  }
  wA <- win(a1, b1)
  max(0, pieces(f, wA[1], wA[2], win(a2, b2)))
}

# E[max(pA - pB, 0)] : the expected loss of CHOOSING B.
lossChooseB <- function(a1, b1, a2, b2) lossChooseA(a2, b2, a1, b1)

# CDF of the absolute lift D = pB - pA.  P(D<=d) = int f_A(a) F_B(a+d) da.
# Split at the pbeta clamps (a+d = 0 and a+d = 1) and at B's window shifted
# back by d, where F_B does all of its climbing.
cdfD <- function(d, a1, b1, a2, b2) {
  wA <- win(a1, b1); wB <- win(a2, b2)
  v <- pieces(function(a) dbeta(a, a1, b1) * pbeta(a + d, a2, b2),
              wA[1], wA[2], c(-d, 1 - d, wB[1] - d, wB[2] - d))
  min(1, max(0, v))
}

# CDF of the relative lift R = (pB - pA)/pA.  P(R<=r) = P(pB <= pA(1+r)).
cdfR <- function(r, a1, b1, a2, b2) {
  k <- 1 + r
  wA <- win(a1, b1)
  if (k <= 0) return(0)                      # pB <= non-positive: impossible
  wB <- win(a2, b2)
  v <- pieces(function(a) dbeta(a, a1, b1) * pbeta(a * k, a2, b2),
              wA[1], wA[2], c(1 / k, wB[1] / k, wB[2] / k))
  min(1, max(0, v))
}

qFromCdf <- function(cdf, target, lo, hi) {
  f <- function(x) cdf(x) - target
  # widen until bracketed (relative lift is unbounded above)
  for (i in 1:60) { if (f(hi) > 0) break; hi <- hi * 2 + 1 }
  uniroot(f, c(lo, hi), tol = 1e-12)$root
}

# ---- route (b): Monte Carlo ----------------------------------------------

MC_N <- 4e6
mcCase <- function(a1, b1, a2, b2, seed) {
  set.seed(seed)
  pa <- rbeta(MC_N, a1, b1)
  pb <- rbeta(MC_N, a2, b2)
  d  <- pb - pa
  la <- pmax(d, 0); lb <- pmax(-d, 0); win <- as.numeric(pb > pa)
  # Standard errors, so the harness can gate MC at N sigma instead of an
  # arbitrary relative tolerance.  A small loss is a rare-event mean: for
  # all-convert-B only ~1.5k of 4e6 draws are non-zero, so its relative SE is
  # ~2.6% and a fixed 0.5% gate would fail a perfectly correct value.
  list(
    pBgtA       = mean(win),
    seP         = sd(win) / sqrt(MC_N),
    lossChooseA = mean(la),
    seLossA     = sd(la) / sqrt(MC_N),
    lossChooseB = mean(lb),
    seLossB     = sd(lb) / sqrt(MC_N),
    dLo         = unname(quantile(d, 0.025)),
    dHi         = unname(quantile(d, 0.975)),
    rLo         = unname(quantile(d / pa, 0.025)),
    rHi         = unname(quantile(d / pa, 0.975)),
    n           = MC_N
  )
}

# ---- cases ---------------------------------------------------------------
# name, cA, nA, cB, nB, a0, b0, level
cases <- list(
  list('typical',        1200,  10000, 1260,  10000, 1,   1,   0.95),
  list('clear-winner',    100,  10000,  300,  10000, 1,   1,   0.95),
  list('too-early',         8,    150,   12,    150, 1,   1,   0.95),
  list('dead-heat',      1000,  20000, 1000,  20000, 1,   1,   0.95),
  list('equal-rates',      50,    100,   50,    100, 1,   1,   0.95),
  list('tiny-n',            0,      1,    1,      1, 1,   1,   0.95),
  list('zero-conv-A',       0,    100,    5,    100, 1,   1,   0.95),
  list('zero-conv-both',    0,    100,    0,    100, 1,   1,   0.95),
  list('all-convert-B',    90,    100,  100,    100, 1,   1,   0.95),
  list('strong-prior',      6,     20,   12,     20, 100, 100, 0.95),
  list('jeffreys',         30,    500,   45,    500, 0.5, 0.5, 0.95),
  list('huge-separation',  50,  20000,  500,  20000, 1,   1,   0.95),
  list('lopsided-n',       40,    900,  120,   2400, 1,   1,   0.95),
  list('big-n',          5000, 100000, 5150, 100000, 1,   1,   0.95),
  list('B-loses',         300,   5000,  240,   5000, 1,   1,   0.95),
  list('level-90',       1200,  10000, 1260,  10000, 1,   1,   0.90),
  list('level-99',       1200,  10000, 1260,  10000, 1,   1,   0.99),
  list('informed-prior',   25,    400,   40,    400, 12,  240, 0.95),
  list('low-rate',          3,   4000,    9,   4000, 1,   1,   0.95),
  list('near-tie-bign',  2500,  50000, 2530,  50000, 1,   1,   0.95)
)

out <- list()
for (i in seq_along(cases)) {
  cs <- cases[[i]]
  nm <- cs[[1]]; cA <- cs[[2]]; nA <- cs[[3]]; cB <- cs[[4]]; nB <- cs[[5]]
  a0 <- cs[[6]]; b0 <- cs[[7]]; lev <- cs[[8]]

  MAXERR$v <- 0
  a1 <- a0 + cA; b1 <- b0 + nA - cA
  a2 <- a0 + cB; b2 <- b0 + nB - cB
  lo_p <- (1 - lev) / 2; hi_p <- 1 - lo_p

  mA <- a1 / (a1 + b1); mB <- a2 / (a2 + b2)

  lA <- lossChooseA(a1, b1, a2, b2)
  lB <- lossChooseB(a1, b1, a2, b2)

  dLo <- qFromCdf(function(d) cdfD(d, a1, b1, a2, b2), lo_p, -1, 1)
  dHi <- qFromCdf(function(d) cdfD(d, a1, b1, a2, b2), hi_p, -1, 1)
  rLo <- qFromCdf(function(r) cdfR(r, a1, b1, a2, b2), lo_p, -1, 5)
  rHi <- qFromCdf(function(r) cdfR(r, a1, b1, a2, b2), hi_p, -1, 5)

  mc <- mcCase(a1, b1, a2, b2, 1000 + i)

  out[[nm]] <- list(
    name = nm,
    input = list(cA = cA, nA = nA, cB = cB, nB = nB, a0 = a0, b0 = b0, level = lev),
    post = list(
      a1 = a1, b1 = b1, a2 = a2, b2 = b2,
      meanA = mA, meanB = mB,
      sdA = sqrt(a1 * b1 / ((a1 + b1)^2 * (a1 + b1 + 1))),
      sdB = sqrt(a2 * b2 / ((a2 + b2)^2 * (a2 + b2 + 1))),
      # marginal posterior credible intervals per arm, straight from qbeta
      ciA = c(qbeta(lo_p, a1, b1), qbeta(hi_p, a1, b1)),
      ciB = c(qbeta(lo_p, a2, b2), qbeta(hi_p, a2, b2)),
      medA = qbeta(0.5, a1, b1), medB = qbeta(0.5, a2, b2)
    ),
    integ = list(
      pBgtA       = pBgtA(a1, b1, a2, b2),
      lossChooseA = lA,
      lossChooseB = lB,
      # the identity E[x+] - E[(-x)+] = E[x] must hold exactly
      lossIdentity = (lA - lB) - (mB - mA),
      dLo = dLo, dHi = dHi, rLo = rLo, rHi = rHi,
      meanLift = mB - mA,
      meanRelLift = (mB - mA) / mA,
      quadAbsErr = MAXERR$v
    ),
    mc = mc
  )
}

cat(toJSON(out, digits = 17, auto_unbox = TRUE, na = 'null'),
    file = 'Scripts/tool-truth/bayesian-ab-test-calculator.json')
cat('wrote', length(out), 'cases\n')
