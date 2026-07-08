# Tool Farm v2: A/B test calculator truth table (ground truth from R 4.6.0)
# Modes: freq (prop.test), plan (pwr.2p.test), bayes (deterministic beta-binomial),
# sequential (Pocock tabulated constants -> per-look nominal alpha).
# Sign convention: lift = pB - pA, so freq calls put B first: prop.test(c(cB,cA), c(nB,nA)).
options(digits = 15, warn = -1)
suppressWarnings(suppressMessages(library(pwr)))
suppressWarnings(suppressMessages(library(jsonlite)))

## ---------- FREQ: two-proportion z-test (matches prop.test correct=FALSE) ----------
# Record prop.test statistic/p/conf.int AND manual pooled-z + unpooled-Wald so we can
# confirm exactly which CI prop.test returns.
freq_case <- function(id, cA, nA, cB, nB, alpha, tail) {
  alt <- if (tail == 2) "two.sided" else "greater"   # greater => pB > pA (B first)
  pt <- prop.test(c(cB, cA), c(nB, nA), conf.level = 1 - alpha,
                  alternative = alt, correct = FALSE)
  pa <- cA / nA; pb <- cB / nB
  ppool <- (cA + cB) / (nA + nB)
  seH0 <- sqrt(ppool * (1 - ppool) * (1 / nA + 1 / nB))
  z <- (pb - pa) / seH0
  seCi <- sqrt(pa * (1 - pa) / nA + pb * (1 - pb) / nB)
  zc <- if (tail == 2) qnorm(1 - alpha / 2) else qnorm(1 - alpha)
  if (tail == 2) {
    man_lo <- (pb - pa) - zc * seCi; man_hi <- (pb - pa) + zc * seCi
  } else {
    man_lo <- (pb - pa) - zc * seCi; man_hi <- 1
  }
  list(id = id, mode = "freq", cA = cA, nA = nA, cB = cB, nB = nB, alpha = alpha, tail = tail,
       pa = pa, pb = pb, diff = pb - pa,
       z = z, chisq = unname(pt$statistic), p = pt$p.value,
       pt_lo = pt$conf.int[1], pt_hi = pt$conf.int[2],
       man_lo = man_lo, man_hi = man_hi,
       seH0 = seH0, seCi = seCi)
}

## ---------- PLAN: sample size (matches pwr.2p.test) ----------
plan_case <- function(id, p1, p2, alpha, power, tail) {
  alt <- if (tail == 2) "two.sided" else "greater"
  h <- abs(ES.h(p1, p2))            # |2*asin(sqrt(p1)) - 2*asin(sqrt(p2))|; n uses h^2
  r <- pwr.2p.test(h = h, sig.level = alpha, power = power, alternative = alt)
  list(id = id, mode = "plan", p1 = p1, p2 = p2, alpha = alpha, power = power, tail = tail,
       h = h, n = r$n)
}

## ---------- BAYES: deterministic beta-binomial ----------
# Prior Beta(a0,b0). Posteriors A~Beta(a1,b1), B~Beta(a2,b2).
bayes_case <- function(id, cA, nA, cB, nB, a0 = 1, b0 = 1) {
  a1 <- a0 + cA; b1 <- b0 + nA - cA
  a2 <- a0 + cB; b2 <- b0 + nB - cB
  # P(B > A) = int_0^1 dbeta(x;a2,b2) * pbeta(x;a1,b1) dx
  pbetterB <- integrate(function(x) dbeta(x, a2, b2) * pbeta(x, a1, b1),
                        0, 1, rel.tol = 1e-12, subdivisions = 2000)$value
  meanLift <- a2 / (a2 + b2) - a1 / (a1 + b1)
  # CDF of D = pB - pA at d: P(D<=d) = int_0^1 dbeta(a;a1,b1)*pbeta(a+d;a2,b2) da
  cdfD <- function(d) integrate(function(a) dbeta(a, a1, b1) *
                                  pbeta(pmin(pmax(a + d, 0), 1), a2, b2),
                                0, 1, rel.tol = 1e-11, subdivisions = 2000)$value
  qD <- function(target) uniroot(function(d) cdfD(d) - target,
                                  lower = -1, upper = 1, tol = 1e-12)$root
  crLo <- qD(0.025); crHi <- qD(0.975)
  # BF10 (rates differ vs equal), exact closed form
  lbf <- lbeta(a1, b1) + lbeta(a2, b2) - lbeta(a0, b0) -
         lbeta(a0 + cA + cB, b0 + nA + nB - cA - cB)
  list(id = id, mode = "bayes", cA = cA, nA = nA, cB = cB, nB = nB, a0 = a0, b0 = b0,
       pBbetter = pbetterB, meanLift = meanLift, crLo = crLo, crHi = crHi, bf10 = exp(lbf))
}

## ---------- SEQUENTIAL: Pocock constants -> per-look nominal alpha ----------
# Constants from Jennison & Turnbull (2000), Group Sequential Methods, Table 2.1 (Pocock).
pocock <- list(
  "0.05" = c(`1`=1.960, `2`=2.178, `3`=2.289, `4`=2.361, `5`=2.413,
             `6`=2.453, `7`=2.485, `8`=2.512, `9`=2.535, `10`=2.555),
  "0.01" = c(`1`=2.576, `2`=2.772, `3`=2.873, `4`=2.939, `5`=2.986,
             `6`=3.023, `7`=3.053, `8`=3.078, `9`=3.099, `10`=3.117),
  "0.10" = c(`1`=1.645, `2`=1.875, `3`=1.992, `4`=2.067, `5`=2.122,
             `6`=2.164, `7`=2.197, `8`=2.225, `9`=2.249, `10`=2.270)
)
seq_case <- function(id, K, alpha) {
  ck <- pocock[[sprintf("%.2f", alpha)]][[as.character(K)]]
  list(id = id, mode = "sequential", K = K, alpha = alpha,
       ck = ck, nominal = 2 * (1 - pnorm(ck)))
}

out <- list(
  # FREQ - default, non-sig, alpha/tail variants
  freq_case("freq_default",   120, 1000, 144, 1000, 0.05, 2),
  freq_case("freq_default_99",120, 1000, 144, 1000, 0.01, 2),
  freq_case("freq_default_90",120, 1000, 144, 1000, 0.10, 2),
  freq_case("freq_default_1s",120, 1000, 144, 1000, 0.05, 1),
  freq_case("freq_nonsig",    100, 1000, 108, 1000, 0.05, 2),
  freq_case("freq_bigwin",     80, 1000, 160, 1000, 0.05, 2),
  freq_case("freq_longtail",    1, 1000,   5, 1000, 0.05, 2),
  freq_case("freq_zeroB",      10, 1000,   0, 1000, 0.05, 2),   # cB = 0
  freq_case("freq_fullB",     900, 1000,1000, 1000, 0.05, 2),   # cB = nB
  freq_case("freq_tiny",        3,   20,   7,   20, 0.05, 2),
  freq_case("freq_equal",     120, 1000, 120, 1000, 0.05, 2),   # z = 0, p = 1
  # PLAN
  plan_case("plan_default",  0.10, 0.11, 0.05, 0.80, 2),
  plan_case("plan_mde2",     0.10, 0.12, 0.05, 0.80, 2),
  plan_case("plan_pow90",    0.10, 0.11, 0.05, 0.90, 2),
  plan_case("plan_a01",      0.10, 0.11, 0.01, 0.80, 2),
  plan_case("plan_1s",       0.10, 0.11, 0.05, 0.80, 1),
  plan_case("plan_lowbase",  0.05, 0.06, 0.05, 0.80, 2),
  plan_case("plan_highbase", 0.20, 0.25, 0.05, 0.80, 2),
  # BAYES
  bayes_case("bayes_default", 120, 1000, 144, 1000),
  bayes_case("bayes_bayesonly",50,  500,  65,  500),
  bayes_case("bayes_longtail",  1, 1000,   5, 1000),
  bayes_case("bayes_close",   100, 1000, 105, 1000),
  bayes_case("bayes_zeroB",    10, 1000,   0, 1000),
  bayes_case("bayes_jeffreys",120, 1000, 144, 1000, 0.5, 0.5),
  # SEQUENTIAL
  seq_case("seq_k2_a05", 2, 0.05),
  seq_case("seq_k3_a05", 3, 0.05),
  seq_case("seq_k5_a05", 5, 0.05),
  seq_case("seq_k3_a01", 3, 0.01),
  seq_case("seq_k4_a10", 4, 0.10)
)

cat(toJSON(out, auto_unbox = TRUE, digits = 15, na = "null"), "\n")
