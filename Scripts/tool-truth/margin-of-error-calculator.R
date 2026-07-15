# Ground truth for the Margin of Error Calculator.
# Three modes:
#   prop  - margin of error for a percentage from n, p, conf, optional FPC
#   size  - required sample size for a target margin (Cochran), optional FPC
#   mean  - margin of error for an average from sd, n, conf; t or z; optional FPC
# Run: Rscript.exe Scripts/tool-truth/margin-of-error-calculator.R
suppressWarnings(suppressMessages({}))

cases <- list()
add <- function(...) cases[[length(cases) + 1]] <<- list(...)

zc <- function(conf) qnorm(1 - (1 - conf) / 2)
fpc <- function(n, N) if (is.null(N) || !is.finite(N)) 1 else sqrt((N - n) / (N - 1))

# ---- mode: prop  (Wald / normal-approximation margin) ----
prop_moe <- function(p, n, conf, N = NULL) {
  z <- zc(conf); se <- sqrt(p * (1 - p) / n); f <- fpc(n, N)
  moe <- z * se * f
  list(moe = moe, z = z, se = se, fpc = f, lo = p - moe, hi = p + moe)
}
# political poll, conservative p = .5
r <- prop_moe(0.5, 1000, 0.95);      add(mode="prop", p=0.5, n=1000, conf=0.95, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
r <- prop_moe(0.5, 400, 0.95);       add(mode="prop", p=0.5, n=400,  conf=0.95, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
r <- prop_moe(0.62, 1500, 0.95);     add(mode="prop", p=0.62, n=1500, conf=0.95, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
r <- prop_moe(0.5, 1000, 0.90);      add(mode="prop", p=0.5, n=1000, conf=0.90, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
r <- prop_moe(0.5, 1000, 0.99);      add(mode="prop", p=0.5, n=1000, conf=0.99, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
r <- prop_moe(0.5, 1000, 0.80);      add(mode="prop", p=0.5, n=1000, conf=0.80, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
# finite population correction
r <- prop_moe(0.5, 300, 0.95, 2000); add(mode="prop", p=0.5, n=300, conf=0.95, N=2000, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
r <- prop_moe(0.4, 500, 0.95, 5000); add(mode="prop", p=0.4, n=500, conf=0.95, N=5000, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
# near-census: n == N -> fpc 0 -> moe 0
r <- prop_moe(0.5, 500, 0.95, 500);  add(mode="prop", p=0.5, n=500, conf=0.95, N=500, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
# edge: p = 0 (degenerate, moe 0)
r <- prop_moe(0, 100, 0.95);         add(mode="prop", p=0, n=100, conf=0.95, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)
# tiny n
r <- prop_moe(0.5, 10, 0.95);        add(mode="prop", p=0.5, n=10, conf=0.95, N=NA, moe=r$moe, z=r$z, se=r$se, fpc=r$fpc, lo=r$lo, hi=r$hi)

# ---- mode: size  (Cochran sample size for a target proportion margin) ----
size_prop <- function(moe, p, conf, N = NULL) {
  z <- zc(conf); n0 <- z^2 * p * (1 - p) / moe^2
  n <- if (is.null(N) || !is.finite(N)) ceiling(n0) else ceiling(n0 / (1 + (n0 - 1) / N))
  list(n = n, n0 = n0, z = z)
}
r <- size_prop(0.03, 0.5, 0.95);        add(mode="size", moe=0.03, p=0.5, conf=0.95, N=NA, n=r$n, n0=r$n0, z=r$z)
r <- size_prop(0.05, 0.5, 0.95);        add(mode="size", moe=0.05, p=0.5, conf=0.95, N=NA, n=r$n, n0=r$n0, z=r$z)
r <- size_prop(0.02, 0.5, 0.95);        add(mode="size", moe=0.02, p=0.5, conf=0.95, N=NA, n=r$n, n0=r$n0, z=r$z)
r <- size_prop(0.03, 0.5, 0.99);        add(mode="size", moe=0.03, p=0.5, conf=0.99, N=NA, n=r$n, n0=r$n0, z=r$z)
r <- size_prop(0.03, 0.5, 0.90);        add(mode="size", moe=0.03, p=0.5, conf=0.90, N=NA, n=r$n, n0=r$n0, z=r$z)
r <- size_prop(0.04, 0.3, 0.95);        add(mode="size", moe=0.04, p=0.3, conf=0.95, N=NA, n=r$n, n0=r$n0, z=r$z)
# with FPC
r <- size_prop(0.03, 0.5, 0.95, 2000);  add(mode="size", moe=0.03, p=0.5, conf=0.95, N=2000, n=r$n, n0=r$n0, z=r$z)
r <- size_prop(0.05, 0.5, 0.95, 800);   add(mode="size", moe=0.05, p=0.5, conf=0.95, N=800,  n=r$n, n0=r$n0, z=r$z)

# ---- mode: mean  (t or z margin for an average) ----
mean_moe <- function(s, n, conf, method = "t", N = NULL) {
  crit <- if (method == "z") zc(conf) else qt(1 - (1 - conf) / 2, df = n - 1)
  se <- s / sqrt(n); f <- fpc(n, N); moe <- crit * se * f
  list(moe = moe, crit = crit, se = se, fpc = f)
}
r <- mean_moe(42, 200, 0.95, "t");        add(mode="mean", s=42, n=200, conf=0.95, method="t", N=NA, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)
r <- mean_moe(15, 30, 0.95, "t");         add(mode="mean", s=15, n=30,  conf=0.95, method="t", N=NA, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)
r <- mean_moe(42, 200, 0.95, "z");        add(mode="mean", s=42, n=200, conf=0.95, method="z", N=NA, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)
r <- mean_moe(15, 30, 0.99, "t");         add(mode="mean", s=15, n=30,  conf=0.99, method="t", N=NA, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)
r <- mean_moe(15, 30, 0.90, "t");         add(mode="mean", s=15, n=30,  conf=0.90, method="t", N=NA, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)
r <- mean_moe(2.5, 2, 0.95, "t");         add(mode="mean", s=2.5, n=2,  conf=0.95, method="t", N=NA, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)
# with FPC
r <- mean_moe(42, 200, 0.95, "t", 1000);  add(mode="mean", s=42, n=200, conf=0.95, method="t", N=1000, moe=r$moe, crit=r$crit, se=r$se, fpc=r$fpc)

# cross-check: t-based mean margin == half-width of t.test() on an exact-moment vector
m <- 50; s <- 42; n <- 200
x <- as.numeric(m + s * scale(1:n))   # sd(x)==s, mean(x)==m exactly
ci <- t.test(x, conf.level = 0.95)$conf.int
add(mode="mean_ttest", s=s, n=n, conf=0.95, method="t", N=NA, moe=(ci[2]-ci[1])/2, crit=qt(0.975,n-1), se=s/sqrt(n), fpc=1)

# ---- emit JSON (hand-rolled; no jsonlite dependency) ----
jnum <- function(x) if (is.na(x)) "null" else if (!is.finite(x)) paste0('"', x, '"') else format(x, digits = 15, scientific = FALSE, trim = TRUE)
tojson <- function(o) {
  parts <- vapply(names(o), function(k) {
    v <- o[[k]]
    val <- if (is.character(v)) paste0('"', v, '"') else jnum(v)
    paste0('"', k, '":', val)
  }, character(1))
  paste0("{", paste(parts, collapse = ","), "}")
}
out <- paste0("[\n  ", paste(vapply(cases, tojson, character(1)), collapse = ",\n  "), "\n]\n")
writeLines(out, "Scripts/tool-truth/margin-of-error-calculator.json")
cat("wrote", length(cases), "cases\n")
