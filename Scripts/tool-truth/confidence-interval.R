# Tool Farm v2: confidence-interval calculator truth table (R 4.6.0)
options(digits = 15)

exact_vec <- function(m, s, n) as.numeric(m + s * scale(seq_len(n)))
out <- list()
add <- function(id, lo, hi) out[[length(out)+1]] <<- list(id = id, lo = lo, hi = hi)

# --- mean CIs (t-based, via exact-moments vectors) ---
x <- exact_vec(52.3, 8.1, 25)
ci <- t.test(x, conf.level = 0.95)$conf.int; add("mean_95", ci[1], ci[2])
ci <- t.test(x, conf.level = 0.90)$conf.int; add("mean_90", ci[1], ci[2])
ci <- t.test(x, conf.level = 0.99)$conf.int; add("mean_99", ci[1], ci[2])
x <- exact_vec(3.42, 1.77, 8)          # small n
ci <- t.test(x)$conf.int;               add("mean_small_n", ci[1], ci[2])

# --- proportion CIs ---
# Wilson score WITHOUT continuity correction (prop.test correct=FALSE)
ci <- prop.test(42, 100, correct = FALSE)$conf.int; add("wilson_42_100", ci[1], ci[2])
ci <- prop.test(7, 20,  correct = FALSE)$conf.int;  add("wilson_7_20",  ci[1], ci[2])
ci <- prop.test(0, 15,  correct = FALSE)$conf.int;  add("wilson_0_15",  ci[1], ci[2])
ci <- prop.test(199, 200, correct = FALSE)$conf.int; add("wilson_199_200", ci[1], ci[2])
ci <- prop.test(42, 100, correct = FALSE, conf.level = 0.99)$conf.int; add("wilson_42_100_99", ci[1], ci[2])
# Clopper-Pearson exact (binom.test)
ci <- binom.test(42, 100)$conf.int; add("exact_42_100", ci[1], ci[2])
ci <- binom.test(7, 20)$conf.int;   add("exact_7_20",  ci[1], ci[2])
ci <- binom.test(0, 15)$conf.int;   add("exact_0_15",  ci[1], ci[2])
ci <- binom.test(20, 20)$conf.int;  add("exact_20_20", ci[1], ci[2])

esc <- function(v) sprintf("%.12g", v)
cat("[\n")
for (i in seq_along(out)) {
  o <- out[[i]]
  cat(sprintf('{"id":"%s","lo":%s,"hi":%s}%s\n', o$id, esc(o$lo), esc(o$hi),
      if (i < length(out)) "," else ""))
}
cat("]\n")
