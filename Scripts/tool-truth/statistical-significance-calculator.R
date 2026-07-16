# Ground truth for statistical-significance-calculator.
# Three modes framed for the "is my result statistically significant?" query:
#   conv  - conversion-rate comparison: two-proportion z-test (== prop.test correct=FALSE)
#   means - two independent means: Welch t-test (== t.test var.equal=FALSE)
#   onep  - one proportion vs a target: one-sample z-test (== prop.test correct=FALSE)
# The JS lib composes ab-test-math (twoProp), ttest-math (welchSummary) and
# ci-math (wilsonCI); this file is the R oracle the node harness asserts against.

options(warn = -1)

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- list(...)

# ---- conversion-rate comparison: two-proportion z-test ----
# lib inputs: convRate(cA, nA, cB, nB, {alpha, tail}); diff = pB - pA.
# We pass B first to prop.test so estimate = c(pB, pA) and conf.int = pB - pA.
conv <- function(cA, nA, cB, nB, alpha) {
  conf <- 1 - alpha
  r2 <- prop.test(c(cB, cA), c(nB, nA), correct = FALSE,
                  alternative = "two.sided", conf.level = conf)
  rg <- prop.test(c(cB, cA), c(nB, nA), correct = FALSE,
                  alternative = "greater", conf.level = conf)
  pa <- cA / nA; pb <- cB / nB; diff <- pb - pa
  ppool <- (cA + cB) / (nA + nB)
  se0 <- sqrt(ppool * (1 - ppool) * (1 / nA + 1 / nB))
  z <- if (se0 == 0) 0 else diff / se0
  add(mode = "conv", cA = cA, nA = nA, cB = cB, nB = nB, alpha = alpha,
      pa = pa, pb = pb, diff = diff, z = z,
      p_two = r2$p.value, p_greater = rg$p.value,
      ci_lo = r2$conf.int[1], ci_hi = r2$conf.int[2])
}

## conversion scenarios
conv(200, 2000, 260, 2000, 0.05)   # B lifts vs A, both n=2000
conv(120, 1000, 150, 1000, 0.05)   # clear lift
conv(100, 1000, 100, 1000, 0.05)   # identical -> z=0, p=1
conv(50, 800, 70, 820, 0.05)       # unequal n
conv(5, 500, 20, 500, 0.05)        # low base rate, big relative lift
conv(0, 300, 12, 300, 0.05)        # zero conversions in A
conv(300, 1000, 280, 1000, 0.05)   # B worse than A (negative lift)
conv(200, 2000, 260, 2000, 0.10)   # alpha 0.10
conv(200, 2000, 260, 2000, 0.01)   # alpha 0.01
conv(48, 1200, 96, 1200, 0.05)     # doubling from a small base
conv(1, 100, 2, 100, 0.05)         # tiny counts

# ---- two-mean comparison: Welch t-test ----
# Summary-stat mode via the exact-moments trick: a vector with EXACT mean & sd
# so t.test on it is ground truth for summary-stat Welch math.
mkvec <- function(m, s, n) as.numeric(m + s * scale(1:n))
means <- function(m1, s1, n1, m2, s2, n2, alt, conf) {
  x <- mkvec(m1, s1, n1); y <- mkvec(m2, s2, n2)
  r <- t.test(x, y, var.equal = FALSE, alternative = alt, conf.level = conf)
  add(mode = "means", m1 = m1, s1 = s1, n1 = n1, m2 = m2, s2 = s2, n2 = n2,
      alt = alt, conf = conf,
      t = unname(r$statistic), df = unname(r$parameter), p = r$p.value,
      ci_lo = r$conf.int[1], ci_hi = r$conf.int[2], diff = m1 - m2)
}

## two-mean scenarios
means(19.2, 4.1, 60, 17.6, 3.8, 58, "two.sided", 0.95)  # A > B, unequal sd/n
means(100, 15, 40, 108, 18, 45, "two.sided", 0.95)      # B > A
means(50, 10, 30, 50, 10, 30, "two.sided", 0.95)        # equal -> t=0, p=1
means(2.35, 0.6, 120, 2.20, 0.7, 110, "greater", 0.95)  # one-sided greater
means(2.35, 0.6, 120, 2.20, 0.7, 110, "less", 0.95)     # one-sided less
means(19.2, 4.1, 60, 17.6, 3.8, 58, "two.sided", 0.90)  # conf 0.90
means(19.2, 4.1, 60, 17.6, 3.8, 58, "two.sided", 0.99)  # conf 0.99
means(5.5, 1.2, 5, 4.9, 1.5, 6, "two.sided", 0.95)      # tiny n Welch
means(512, 96, 200, 498, 88, 210, "two.sided", 0.95)    # large n small effect
means(3.4, 1.1, 25, 4.2, 1.3, 28, "two.sided", 0.99)    # negative diff

# ---- one proportion vs target: one-sample z-test ----
# lib: oneProp(x, n, p0, {alt, conf}); z0 = (phat-p0)/sqrt(p0(1-p0)/n).
# prop.test(correct=FALSE) gives the same X-squared (z0^2) and a Wilson CI.
onep <- function(x, n, p0, alt, conf) {
  r <- prop.test(x, n, p = p0, correct = FALSE, alternative = alt, conf.level = conf)
  phat <- x / n
  z0 <- (phat - p0) / sqrt(p0 * (1 - p0) / n)
  add(mode = "onep", x = x, n = n, p0 = p0, alt = alt, conf = conf,
      phat = phat, z = z0, p = r$p.value,
      ci_lo = r$conf.int[1], ci_hi = r$conf.int[2])
}

## one-proportion scenarios
onep(52, 1200, 0.05, "two.sided", 0.95)   # phat 4.33% vs 5% target
onep(66, 1000, 0.05, "greater", 0.95)     # above target, one-sided
onep(38, 1000, 0.05, "less", 0.95)        # below target, one-sided
onep(120, 400, 0.25, "two.sided", 0.95)   # 30% vs 25%
onep(200, 400, 0.5, "two.sided", 0.95)    # exactly at target -> z=0
onep(0, 200, 0.03, "two.sided", 0.95)     # x=0 boundary
onep(200, 200, 0.9, "greater", 0.95)      # x=n boundary
onep(52, 1200, 0.05, "two.sided", 0.90)   # conf 0.90
onep(52, 1200, 0.05, "two.sided", 0.99)   # conf 0.99
onep(9, 30, 0.5, "less", 0.95)            # small n
onep(880, 1000, 0.85, "greater", 0.95)    # high proportion

# ---- emit JSON (17 sig digits, round-trip safe) ----
num <- function(v) {
  if (is.null(v) || length(v) == 0) return("null")
  if (is.logical(v)) return(if (v) "true" else "false")
  if (!is.finite(v)) return(sprintf('"%s"', as.character(v)))
  formatC(v, format = "g", digits = 17)
}
esc <- function(s) gsub('"', '\\\\"', s)
pieces <- character(0)
for (cs in cases) {
  kv <- character(0)
  for (nm in names(cs)) {
    val <- cs[[nm]]
    if (is.character(val)) kv <- c(kv, sprintf('"%s":"%s"', nm, esc(val)))
    else kv <- c(kv, sprintf('"%s":%s', nm, num(val)))
  }
  pieces <- c(pieces, paste0("{", paste(kv, collapse = ","), "}"))
}
writeLines(paste0("[\n", paste(pieces, collapse = ",\n"), "\n]"),
           "Scripts/tool-truth/statistical-significance-calculator.json")
cat("wrote", length(cases), "cases\n")
