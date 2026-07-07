# Tool Farm v2: t-test calculator truth table (ground truth from R 4.6.0)
# Summary-stat cases use the exact-moments trick: x <- m + s * scale(z) gives a
# vector whose mean/sd are EXACTLY m/s, so t.test() on it is the truth for
# summary inputs too.
options(digits = 12)

exact_vec <- function(m, s, n) {
  z <- seq_len(n)
  as.numeric(m + s * scale(z))
}

cohens_d_two <- function(x, y) {
  sp <- sqrt(((length(x)-1)*var(x) + (length(y)-1)*var(y)) / (length(x)+length(y)-2))
  (mean(x) - mean(y)) / sp
}

out <- list()

add_case <- function(id, tt, d = NA) {
  list(id = id,
       t = unname(tt$statistic), df = unname(tt$parameter),
       p = tt$p.value, ci_lo = tt$conf.int[1], ci_hi = tt$conf.int[2],
       d = d)
}

# 1. two-sample Welch, summary (the default example), two-tailed
x <- exact_vec(84.2, 6.1, 24); y <- exact_vec(79.6, 7.4, 26)
out[[1]] <- add_case("welch_default_two", t.test(x, y), cohens_d_two(x, y))

# 2. same, one-tailed (greater)
out[[2]] <- add_case("welch_default_greater", t.test(x, y, alternative = "greater"), cohens_d_two(x, y))

# 3. two-sample Welch, non-significant (close means)
x <- exact_vec(50.0, 10.0, 15); y <- exact_vec(51.2, 9.5, 17)
out[[3]] <- add_case("welch_nonsig", t.test(x, y), cohens_d_two(x, y))

# 4. two-sample raw data (fixed vectors)
x <- c(12.1, 14.3, 11.8, 13.6, 15.2, 12.9, 14.8, 13.1)
y <- c(10.4, 11.9, 12.3, 10.8, 11.1, 12.6, 10.2)
out[[4]] <- add_case("welch_raw", t.test(x, y), cohens_d_two(x, y))

# 5. one-sample, summary vs mu=100
x <- exact_vec(104.3, 12.5, 30)
d1 <- (mean(x) - 100) / sd(x)
out[[5]] <- add_case("onesample_two", t.test(x, mu = 100), d1)

# 6. one-sample raw, mu = 5, less
x <- c(4.2, 4.8, 5.1, 3.9, 4.5, 4.1, 4.7, 4.4, 4.0, 4.6)
out[[6]] <- add_case("onesample_less", t.test(x, mu = 5, alternative = "less"), (mean(x)-5)/sd(x))

# 7. paired raw
pre  <- c(72, 68, 75, 71, 66, 70, 74, 69, 73, 67, 71, 70)
post <- c(75, 70, 79, 74, 68, 74, 77, 70, 76, 70, 74, 72)
dd <- post - pre
out[[7]] <- add_case("paired_two", t.test(post, pre, paired = TRUE), mean(dd)/sd(dd))

# 8. edge: tiny n (3 vs 3)
x <- exact_vec(10, 1, 3); y <- exact_vec(8, 1.5, 3)
out[[8]] <- add_case("welch_tiny", t.test(x, y), cohens_d_two(x, y))

# 9. edge: equal means (p ~ 1)
x <- exact_vec(20, 4, 12); y <- exact_vec(20, 4, 12)
out[[9]] <- add_case("welch_equal", t.test(x, y), cohens_d_two(x, y))

# 10. edge: huge effect
x <- exact_vec(100, 5, 40); y <- exact_vec(60, 5, 40)
out[[10]] <- add_case("welch_huge", t.test(x, y), cohens_d_two(x, y))

# 11. alpha=0.01 CI check (99% CI on default example)
x <- exact_vec(84.2, 6.1, 24); y <- exact_vec(79.6, 7.4, 26)
out[[11]] <- add_case("welch_ci99", t.test(x, y, conf.level = 0.99), cohens_d_two(x, y))

# emit JSON by hand (no jsonlite dependency)
esc <- function(v) if (is.na(v)) "null" else sprintf("%.10g", v)
cat("[\n")
for (i in seq_along(out)) {
  o <- out[[i]]
  cat(sprintf('{"id":"%s","t":%s,"df":%s,"p":%s,"ci_lo":%s,"ci_hi":%s,"d":%s}%s\n',
      o$id, esc(o$t), esc(o$df), esc(o$p), esc(o$ci_lo), esc(o$ci_hi), esc(o$d),
      if (i < length(out)) "," else ""))
}
cat("]\n")
