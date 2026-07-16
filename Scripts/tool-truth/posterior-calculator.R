# Truth table for tools/posterior-calculator.html
# Conjugate posterior updates, three families, closed form.
#   Beta-Binomial   : prior Beta(a0,b0) + s successes / n trials -> Beta(a0+s, b0+n-s)
#   Normal-Normal   : prior N(m0,s0^2) + (xbar,n,sigma known)    -> precision-weighted N(m1,s1^2)
#   Gamma-Poisson   : prior Gamma(a0, rate=b0) + y counts / t exposure -> Gamma(a0+y, b0+t)
# Ground truth is R's own qbeta/qnorm/qgamma + the closed-form parameters.
# Run: Rscript Scripts/tool-truth/posterior-calculator.R  -> posterior-calculator.json

suppressWarnings(library(jsonlite))

cases <- list()
add <- function(x) cases[[length(cases) + 1L]] <<- x

# ------------------------------------------------------------------ Beta-Binomial
bb <- function(label, a0, b0, s, n, level = 0.95) {
  a1 <- a0 + s; b1 <- b0 + n - s
  lo <- (1 - level) / 2; hi <- 1 - lo
  # grid for the density curves (prior / scaled likelihood / posterior)
  xs <- c(0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99)
  list(
    family = "beta-binomial", label = label, level = level,
    inp = list(a0 = a0, b0 = b0, s = s, n = n),
    a1 = a1, b1 = b1,
    priorMean = a0 / (a0 + b0),
    mle = if (n > 0) s / n else NA,
    mean = a1 / (a1 + b1),
    sd = sqrt(a1 * b1 / ((a1 + b1)^2 * (a1 + b1 + 1))),
    median = qbeta(0.5, a1, b1),
    lo = qbeta(lo, a1, b1),
    hi = qbeta(hi, a1, b1),
    # prior interval, for the "how far did the data move it" read
    priorLo = qbeta(lo, a0, b0),
    priorHi = qbeta(hi, a0, b0),
    xs = I(xs),
    dPrior = I(dbeta(xs, a0, b0)),
    dPost  = I(dbeta(xs, a1, b1)),
    # likelihood as a density in theta is Beta(s+1, n-s+1)
    dLik   = I(dbeta(xs, s + 1, n - s + 1))
  )
}
add(bb("weak prior, 7/10",            1,   1,   7,  10))
add(bb("strong prior, 7/10",         50,  50,   7,  10))   # same data, prior dominates
add(bb("Jeffreys, 7/10",            0.5, 0.5,   7,  10))   # shape < 1, spikes at both ends
add(bb("weak prior, zero events",     1,   1,   0,  50))   # x = 0 boundary
add(bb("weak prior, all events",      1,   1,  50,  50))   # x = n boundary
add(bb("strong skeptical, 0/50",     20,   2,   0,  50))
add(bb("extreme data, 9000/10000",    1,   1, 9000, 10000))
add(bb("tiny n",                      2,   2,   1,   1))
add(bb("weak prior, 7/10 @90",        1,   1,   7,  10, 0.90))
add(bb("weak prior, 7/10 @99",        1,   1,   7,  10, 0.99))
add(bb("strong prior, 7/10 @99",     50,  50,   7,  10, 0.99))

# ------------------------------------------------------------------ Normal-Normal (sigma known)
nn <- function(label, m0, s0, xbar, n, sigma, level = 0.95) {
  prec0 <- 1 / s0^2
  precD <- n / sigma^2
  prec1 <- prec0 + precD
  s1 <- sqrt(1 / prec1)
  m1 <- (m0 * prec0 + xbar * precD) / prec1
  lo <- (1 - level) / 2; hi <- 1 - lo
  xs <- m1 + s1 * c(-3, -1.5, -0.5, 0, 0.5, 1.5, 3)
  list(
    family = "normal-normal", label = label, level = level,
    inp = list(m0 = m0, s0 = s0, xbar = xbar, n = n, sigma = sigma),
    m1 = m1, s1 = s1,
    priorMean = m0, mle = xbar,
    n0 = sigma^2 / s0^2,          # prior "worth this many observations"
    se = sigma / sqrt(n),
    mean = m1, sd = s1, median = m1,
    lo = qnorm(lo, m1, s1), hi = qnorm(hi, m1, s1),
    priorLo = qnorm(lo, m0, s0), priorHi = qnorm(hi, m0, s0),
    xs = I(xs),
    dPrior = I(dnorm(xs, m0, s0)),
    dPost  = I(dnorm(xs, m1, s1)),
    dLik   = I(dnorm(xs, xbar, sigma / sqrt(n)))
  )
}
add(nn("weak prior",           100,  50, 112,  25, 15))
add(nn("strong prior",         100,   2, 112,  25, 15))   # same data, prior anchors hard
add(nn("n = 1",                100,  10, 130,   1, 15))
add(nn("huge n swamps prior",  100,   5, 112, 5000, 15))
add(nn("negative mean",         -5,   3,  -9,  16,  4))
add(nn("tiny sigma",             0,   1,   2,  10, 0.1))
add(nn("weak prior @90",       100,  50, 112,  25, 15, 0.90))
add(nn("strong prior @99",     100,   2, 112,  25, 15, 0.99))

# ------------------------------------------------------------------ Gamma-Poisson
gp <- function(label, a0, b0, y, t, level = 0.95) {
  a1 <- a0 + y; b1 <- b0 + t
  lo <- (1 - level) / 2; hi <- 1 - lo
  m1 <- a1 / b1
  xs <- m1 * c(0.2, 0.5, 0.8, 1, 1.25, 2, 3)
  list(
    family = "gamma-poisson", label = label, level = level,
    inp = list(a0 = a0, b0 = b0, y = y, t = t),
    a1 = a1, b1 = b1,
    priorMean = a0 / b0,
    mle = if (t > 0) y / t else NA,
    mean = m1,
    sd = sqrt(a1) / b1,
    median = qgamma(0.5, shape = a1, rate = b1),
    lo = qgamma(lo, shape = a1, rate = b1),
    hi = qgamma(hi, shape = a1, rate = b1),
    priorLo = qgamma(lo, shape = a0, rate = b0),
    priorHi = qgamma(hi, shape = a0, rate = b0),
    xs = I(xs),
    dPrior = I(dgamma(xs, shape = a0, rate = b0)),
    dPost  = I(dgamma(xs, shape = a1, rate = b1)),
    # likelihood as a density in lambda is Gamma(y+1, rate=t)
    dLik   = I(dgamma(xs, shape = y + 1, rate = t))
  )
}
add(gp("weak prior, 12 in 10",      0.001, 0.001,  12,  10))
add(gp("strong prior, 12 in 10",      100,    50,  12,  10))  # same data, prior pulls to 2.0
add(gp("zero counts",                   1,     1,   0,  20))  # y = 0 boundary
add(gp("weak prior, zero counts",   0.001, 0.001,   0,  20))  # shape < 1 posterior
add(gp("near-Jeffreys, 3 in 5",       0.5, 0.001,   3,   5))  # shape < 1 prior, proper
add(gp("extreme data, 50000 in 100",    1,     1, 50000, 100))
add(gp("long exposure",                 2,     1,   7, 1000))
add(gp("weak prior @90",            0.001, 0.001,  12,  10, 0.90))
add(gp("strong prior @99",            100,    50,  12,  10, 0.99))

writeLines(toJSON(cases, digits = 17, auto_unbox = TRUE, na = "null"),
           "Scripts/tool-truth/posterior-calculator.json")
cat("cases:", length(cases), "\n")
