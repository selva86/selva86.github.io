# Truth table for tools/sample-size-proportion-calculator.html
# R 4.6.0 + pwr. Emits sample-size-proportion-calculator.json
#
# Four R references, deliberately kept separate because they do NOT agree
# and the tool teaches why:
#   pwr::pwr.p.test    - one proportion vs a reference, arcsine h, ncp = h*sqrt(n)
#   pwr::pwr.2p.test   - two proportions, equal n,       arcsine h, ncp = h*sqrt(n/2)
#   pwr::pwr.2p2n.test - two proportions, unequal n,     arcsine h, ncp = h*sqrt(n1*n2/(n1+n2))
#   stats::power.prop.test - normal approximation on the raw scale, NOT arcsine
#
# Tolerance note (this is why the harness gates the way it does):
#   Every "power at a given n" value below is a direct formula evaluation -> exact,
#   safe to gate at 1e-9 or tighter.
#   Every "n" value below comes from uniroot. pwr calls uniroot with its DEFAULT
#   tol (.Machine$double.eps^0.25 = 1.22e-4); power.prop.test passes the same tol
#   explicitly. So R's own n is only accurate to ~1e-4 and is NOT an oracle at 1e-6.
#   The harness gates n on ceiling agreement + the tolerance-free power identity.

suppressPackageStartupMessages(library(pwr))

out <- list()
add <- function(section, rec) {
  out[[section]] <<- c(out[[section]], list(rec))
}

# ------------------------------------------------------------------
# 1. Cohen's h  (ES.h) - tolerance free
# ------------------------------------------------------------------
h_pairs <- list(
  c(0.06, 0.05),   # tiny lift on a small base   -> h is small
  c(0.55, 0.50),   # 5 points at the coin-flip peak
  c(0.10, 0.05),   # 5 points near the low extreme -> same diff, much bigger h
  c(0.95, 0.90),   # 5 points near the high extreme (mirror of 0.05->0.10)
  c(0.02, 0.01),   # rare event
  c(0.50, 0.50),   # zero effect
  c(0.5001, 0.50), # tiny h
  c(0.999, 0.001), # extreme span
  c(0.80, 0.20),
  c(1.00, 0.00),   # boundary: h = pi
  c(0.00, 0.00),
  c(1.00, 1.00),
  c(0.001, 0.002),
  c(0.99, 0.999)
)
for (pp in h_pairs) {
  add("h", list(p1 = pp[1], p2 = pp[2], h = ES.h(pp[1], pp[2])))
}

# ------------------------------------------------------------------
# 2. Power at a given n - tolerance free (no uniroot anywhere)
# ------------------------------------------------------------------
hs     <- c(0.0439, 0.0975, 0.2, 0.5, 0.8, 1.2, 0.01)
ns     <- c(2, 5, 30, 64, 200, 1000, 8000)
alphas <- c(0.05, 0.01, 0.10)
alts   <- c("two.sided", "greater")

for (h in hs) for (n in ns) for (a in alphas) for (alt in alts) {
  r1 <- pwr.p.test(h = h, n = n, sig.level = a, alternative = alt)
  add("powerOne", list(h = h, n = n, alpha = a, alt = alt, power = r1$power))
  r2 <- pwr.2p.test(h = h, n = n, sig.level = a, alternative = alt)
  add("powerTwo", list(h = h, n = n, alpha = a, alt = alt, power = r2$power))
}

# unequal n (pwr.2p2n.test); n1 != n2, incl. lopsided allocations
pairs2n <- list(c(2, 2), c(10, 20), c(64, 128), c(30, 90), c(500, 250),
                c(1000, 1000), c(7, 3), c(2, 10000), c(333, 667))
for (h in c(0.0439, 0.2, 0.5, 0.8)) for (pr in pairs2n) for (a in c(0.05, 0.01)) for (alt in alts) {
  r <- pwr.2p2n.test(h = h, n1 = pr[1], n2 = pr[2], sig.level = a, alternative = alt)
  add("powerTwo2n", list(h = h, n1 = pr[1], n2 = pr[2], alpha = a, alt = alt, power = r$power))
}

# ------------------------------------------------------------------
# 3. n solved by pwr (uniroot, DEFAULT tol ~1.22e-4)
#    Recorded WITH the power identity so the harness can adjudicate
#    disagreements without treating R's root as exact.
# ------------------------------------------------------------------
powers <- c(0.80, 0.90, 0.95, 0.99)
for (h in c(0.0439, 0.0975, 0.2, 0.5, 0.8)) for (pw in powers) for (a in c(0.05, 0.01)) for (alt in alts) {
  r1 <- try(pwr.p.test(h = h, power = pw, sig.level = a, alternative = alt), silent = TRUE)
  if (!inherits(r1, "try-error")) {
    add("nOne", list(h = h, power = pw, alpha = a, alt = alt, n = r1$n,
                     # tolerance-free cross-check: power exactly at R's root, and at the ceiling
                     powerAtRoot = pwr.p.test(h = h, n = r1$n, sig.level = a, alternative = alt)$power,
                     nCeil = ceiling(r1$n),
                     powerAtCeil = pwr.p.test(h = h, n = ceiling(r1$n), sig.level = a, alternative = alt)$power))
  }
  r2 <- try(pwr.2p.test(h = h, power = pw, sig.level = a, alternative = alt), silent = TRUE)
  if (!inherits(r2, "try-error")) {
    add("nTwo", list(h = h, power = pw, alpha = a, alt = alt, n = r2$n,
                     powerAtRoot = pwr.2p.test(h = h, n = r2$n, sig.level = a, alternative = alt)$power,
                     nCeil = ceiling(r2$n),
                     powerAtCeil = pwr.2p.test(h = h, n = ceiling(r2$n), sig.level = a, alternative = alt)$power))
  }
}

# ------------------------------------------------------------------
# 4. stats::power.prop.test - the normal approximation
#    strict = FALSE is R's DEFAULT and ignores the wrong tail.
#    strict = TRUE counts both tails, matching pwr's two-sided convention.
# ------------------------------------------------------------------
ppt_pairs <- list(
  c(0.05, 0.06), c(0.50, 0.55), c(0.05, 0.10), c(0.90, 0.95),
  c(0.01, 0.02), c(0.20, 0.80), c(0.50, 0.5001), c(0.001, 0.002)
)

# 4a. power at a given n - tolerance free
for (pp in ppt_pairs) for (n in c(5, 64, 200, 1000, 8000)) for (a in c(0.05, 0.01)) {
  for (alt in c("two.sided", "one.sided")) for (st in c(TRUE, FALSE)) {
    r <- try(power.prop.test(n = n, p1 = pp[1], p2 = pp[2], sig.level = a,
                             alternative = alt, strict = st), silent = TRUE)
    if (!inherits(r, "try-error")) {
      add("pptPower", list(p1 = pp[1], p2 = pp[2], n = n, alpha = a, alt = alt,
                           strict = st, power = r$power))
    }
  }
}

# 4b. n solved (uniroot, tol = .Machine$double.eps^0.25) + the identity to adjudicate
for (pp in ppt_pairs) for (pw in c(0.80, 0.90, 0.95, 0.99)) for (a in c(0.05, 0.01)) {
  for (alt in c("two.sided", "one.sided")) for (st in c(TRUE, FALSE)) {
    r <- try(power.prop.test(p1 = pp[1], p2 = pp[2], power = pw, sig.level = a,
                             alternative = alt, strict = st), silent = TRUE)
    if (!inherits(r, "try-error") && is.finite(r$n) && r$n > 1) {
      pc <- try(power.prop.test(n = ceiling(r$n), p1 = pp[1], p2 = pp[2], sig.level = a,
                                alternative = alt, strict = st)$power, silent = TRUE)
      add("pptN", list(p1 = pp[1], p2 = pp[2], power = pw, alpha = a, alt = alt,
                       strict = st, n = r$n,
                       nCeil = ceiling(r$n),
                       powerAtCeil = if (inherits(pc, "try-error")) NA else pc))
    }
  }
}

# ------------------------------------------------------------------
# 5. The headline teaching claim, verified in R rather than asserted:
#    the SAME absolute difference costs far more subjects near p = 0.5.
# ------------------------------------------------------------------
diff <- 0.05
for (b in c(0.05, 0.10, 0.20, 0.30, 0.40, 0.475, 0.50, 0.60, 0.80, 0.90)) {
  p1 <- b; p2 <- b + diff
  if (p2 >= 1) next
  h <- ES.h(p2, p1)
  n <- pwr.2p.test(h = h, power = 0.80, sig.level = 0.05, alternative = "two.sided")$n
  add("baselineSweep", list(baseline = b, p2 = p2, diff = diff, h = h, n = n, nCeil = ceiling(n)))
}

# ------------------------------------------------------------------
# 6. Where pwr and power.prop.test disagree - recorded, not hand-waved
# ------------------------------------------------------------------
for (pp in ppt_pairs) {
  h <- ES.h(pp[2], pp[1])
  a <- 0.05; pw <- 0.80
  arc <- try(pwr.2p.test(h = h, power = pw, sig.level = a, alternative = "two.sided")$n, silent = TRUE)
  nrm <- try(power.prop.test(p1 = pp[1], p2 = pp[2], power = pw, sig.level = a,
                             alternative = "two.sided", strict = TRUE)$n, silent = TRUE)
  if (!inherits(arc, "try-error") && !inherits(nrm, "try-error")) {
    add("methodGap", list(p1 = pp[1], p2 = pp[2], h = h,
                          nArcsine = arc, nNormalStrict = nrm,
                          ceilArcsine = ceiling(arc), ceilNormalStrict = ceiling(nrm)))
  }
}

# ------------------------------------------------------------------
writeLines(jsonlite::toJSON(out, digits = NA, auto_unbox = TRUE, na = "null", pretty = TRUE),
           "Scripts/tool-truth/sample-size-proportion-calculator.json")
cat("sections:", paste(names(out), sapply(out, length), sep = "=", collapse = "  "), "\n")
cat("total cases:", sum(sapply(out, length)), "\n")
