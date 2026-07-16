# Ground truth for proportion-test-calculator.
# One- and two-proportion z-tests as R's prop.test() computes them, for both
# correct=TRUE (Yates, R's default) and correct=FALSE (the classroom z-test).
# Also records the manual classroom z0 so the JS harness can assert that the
# signed sqrt of the uncorrected X-squared equals (phat-p0)/SE0.

suppressWarnings(suppressMessages({}))
options(warn = -1)

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- list(...)

one <- function(x, n, p0, alt, conf) {
  for (cc in c(FALSE, TRUE)) {
    r <- prop.test(x, n, p = p0, alternative = alt, conf.level = conf, correct = cc)
    add(mode = "one", x = x, n = n, p0 = p0, alt = alt, conf = conf, correct = cc,
        statistic = unname(r$statistic), p.value = r$p.value,
        estimate = unname(r$estimate), ci_lo = r$conf.int[1], ci_hi = r$conf.int[2])
  }
  # manual classroom z0 (uncorrected)
  phat <- x / n
  z0 <- (phat - p0) / sqrt(p0 * (1 - p0) / n)
  add(mode = "one_z0", x = x, n = n, p0 = p0, alt = alt, conf = conf, correct = FALSE,
      statistic = z0 * z0, p.value = -1, estimate = phat, z0 = z0, ci_lo = 0, ci_hi = 0)
}

two <- function(x1, n1, x2, n2, alt, conf) {
  for (cc in c(FALSE, TRUE)) {
    r <- prop.test(c(x1, x2), c(n1, n2), alternative = alt, conf.level = conf, correct = cc)
    add(mode = "two", x1 = x1, n1 = n1, x2 = x2, n2 = n2, alt = alt, conf = conf, correct = cc,
        statistic = unname(r$statistic), p.value = r$p.value,
        est1 = unname(r$estimate[1]), est2 = unname(r$estimate[2]),
        ci_lo = r$conf.int[1], ci_hi = r$conf.int[2])
  }
  p1 <- x1 / n1; p2 <- x2 / n2; delta <- p1 - p2
  ppool <- (x1 + x2) / (n1 + n2)
  z0 <- delta / sqrt(ppool * (1 - ppool) * (1 / n1 + 1 / n2))
  add(mode = "two_z0", x1 = x1, n1 = n1, x2 = x2, n2 = n2, alt = alt, conf = conf, correct = FALSE,
      statistic = z0 * z0, p.value = -1, delta = delta, z0 = z0, ci_lo = 0, ci_hi = 0)
}

## ---- one-sample ----
one(45, 100, 0.5, "two.sided", 0.95)
one(60, 100, 0.5, "greater",   0.95)
one(60, 100, 0.5, "two.sided", 0.95)
one(520, 1000, 0.5, "two.sided", 0.95)
one(8, 10, 0.5, "two.sided", 0.95)      # small n, Yates strong
one(3, 5, 0.5, "two.sided", 0.95)       # tiny n
one(0, 20, 0.10, "two.sided", 0.95)     # x = 0 boundary
one(20, 20, 0.80, "two.sided", 0.95)    # x = n boundary
one(30, 50, 0.5, "less", 0.95)
one(45, 100, 0.40, "greater", 0.95)
one(150, 200, 0.70, "two.sided", 0.95)
one(45, 100, 0.5, "two.sided", 0.90)
one(45, 100, 0.5, "two.sided", 0.99)
one(60, 100, 0.5, "greater", 0.90)
one(30, 50, 0.5, "less", 0.99)
one(88, 100, 0.9, "less", 0.95)
one(112, 400, 0.25, "greater", 0.95)

## ---- two-sample ----
two(30, 50, 40, 50, "two.sided", 0.95)
two(90, 1000, 120, 1000, "two.sided", 0.95)   # A/B conversion
two(45, 100, 30, 100, "greater", 0.95)
two(10, 100, 20, 100, "less", 0.95)
two(25, 50, 25, 50, "two.sided", 0.95)         # delta = 0
two(0, 30, 5, 30, "two.sided", 0.95)           # x1 = 0
two(8, 10, 3, 10, "two.sided", 0.95)           # tiny
two(520, 1000, 480, 1000, "two.sided", 0.95)   # large, near-equal
two(90, 1000, 120, 1000, "two.sided", 0.90)
two(90, 1000, 120, 1000, "two.sided", 0.99)
two(45, 100, 30, 100, "greater", 0.90)
two(200, 500, 150, 500, "greater", 0.95)

# emit JSON (hand-rolled; avoids a jsonlite dependency)
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
           "Scripts/tool-truth/proportion-test-calculator.json")
cat("wrote", length(cases), "cases\n")
