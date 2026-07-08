# Tool Farm v2: CI calculator FULL truth table (8 interval types, R 4.6.0)
options(digits = 15)
exact_vec <- function(m, s, n) as.numeric(m + s * scale(seq_len(n)))
out <- list()
add <- function(id, lo, hi) out[[length(out)+1]] <<- list(id = id, lo = lo, hi = hi)

# 1-2. mean (already verified in batch 1; keep two anchors)
x <- exact_vec(52.3, 8.1, 25)
ci <- t.test(x)$conf.int; add("mean_95", ci[1], ci[2])
ci <- t.test(x, conf.level = 0.99)$conf.int; add("mean_99", ci[1], ci[2])

# 3-4. difference of means (Welch)
x <- exact_vec(84.2, 6.1, 24); y <- exact_vec(79.6, 7.4, 26)
ci <- t.test(x, y)$conf.int; add("diffmean_95", ci[1], ci[2])
ci <- t.test(x, y, conf.level = 0.90)$conf.int; add("diffmean_90", ci[1], ci[2])

# 5-6. proportion (Wilson, correct=FALSE) - anchors
ci <- prop.test(42, 100, correct = FALSE)$conf.int; add("prop_wilson_95", ci[1], ci[2])
ci <- binom.test(42, 100)$conf.int; add("prop_exact_95", ci[1], ci[2])

# 7-8. difference of proportions (Wald with CC=FALSE, as prop.test 2-sample correct=FALSE)
ci <- prop.test(c(45, 30), c(120, 115), correct = FALSE)$conf.int; add("diffprop_95", ci[1], ci[2])
ci <- prop.test(c(8, 3), c(40, 35), correct = FALSE)$conf.int;     add("diffprop_small", ci[1], ci[2])

# 9-10. Poisson rate (exact, poisson.test) - count x over exposure T
pt <- poisson.test(17, 4)$conf.int;  add("poisson_17_4", pt[1], pt[2])   # rate per unit
pt <- poisson.test(0, 10)$conf.int;  add("poisson_0_10", pt[1], pt[2])   # zero events

# 11-12. variance / SD (chi-square interval)
n <- 30; s2 <- 8.1^2
lo <- (n-1)*s2/qchisq(0.975, n-1); hi <- (n-1)*s2/qchisq(0.025, n-1)
add("variance_95", lo, hi)
add("sd_95", sqrt(lo), sqrt(hi))

# 13-14. correlation (Fisher z, matches cor.test for Pearson)
xx <- exact_vec(10, 2, 40)
set.seed(42); yy <- 0.6*scale(xx) + sqrt(1-0.36)*scale(rnorm(40))
r <- cor(xx, yy)
ct <- cor.test(xx, yy)$conf.int; add("corr_95", ct[1], ct[2])
cat(sprintf('__R_FOR_CORR__ %.12g %d\n', r, 40), file = stderr())
ct <- cor.test(xx, yy, conf.level = 0.90)$conf.int; add("corr_90", ct[1], ct[2])

# 15. regression beta (t interval from b, se, df) - matches confint(lm)
b <- 2.35; se <- 0.48; df <- 47
tc <- qt(0.975, df)
add("regbeta_95", b - tc*se, b + tc*se)

esc <- function(v) sprintf("%.12g", v)
cat("[\n")
for (i in seq_along(out)) {
  o <- out[[i]]
  cat(sprintf('{"id":"%s","lo":%s,"hi":%s}%s\n', o$id, esc(o$lo), esc(o$hi),
      if (i < length(out)) "," else ""))
}
cat("]\n")
