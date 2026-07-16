# Tool Farm v2: pearson-critical-values-table truth grid (R 4.6.0)
# Ground truth for tools/lib/dist-tables-math.js: critR / rToT / pvR.
#
# Three independent verification routes, deliberately NOT sharing a code path:
#   1. critR  : r_crit = qt(1-a/2, df) / sqrt(df + qt(...)^2)   [the identity]
#   2. roundtrip: cor.test-equivalent p AT r_crit must equal alpha, computed
#      through R's pt() (NOT qt) -- catches an inverse-CDF error that route 1
#      would happily agree with.
#   3. cortest: real data vectors -> stats::cor.test() -> estimate/statistic/
#      p.value. This is the true oracle for the lookup verdict + p-value.
options(digits = 17)

out <- list()
add <- function(fn, a, v) {
  out[[length(out) + 1]] <<- list(fn = fn, a = a, v = v)
}

# The exact row list the page prints, and the classic 4 alpha pairs.
df_rows <- c(1:30, 35, 40, 45, 50, 60, 70, 80, 90, 100)
# two-tailed alpha  -> the one-tailed half that shares the same column
a_two <- c(0.10, 0.05, 0.02, 0.01)
a_one <- a_two / 2                     # .05 .025 .01 .005

# --------------------------------------------------- 1. the printed cells
# critR is parameterised by n (= df + 2), matching cor.test's df = n - 2.
for (d in df_rows) {
  n <- d + 2
  for (a in a_two) {
    tc <- qt(1 - a / 2, d)
    add("critR", list(alpha = a, n = n, tail = "two"), tc / sqrt(d + tc^2))
  }
  for (a in a_one) {
    tc <- qt(1 - a, d)
    add("critR", list(alpha = a, n = n, tail = "right"), tc / sqrt(d + tc^2))
  }
}

# --------------------------------------------------- 2. round-trip via pt()
# At r = r_crit the two-tailed p must be exactly alpha. Independent of qt.
for (d in df_rows) {
  n <- d + 2
  for (a in a_two) {
    tc <- qt(1 - a / 2, d)
    rc <- tc / sqrt(d + tc^2)
    t_back <- rc * sqrt(d / (1 - rc^2))
    add("pvR", list(r = rc, n = n, tail = "two"), 2 * pt(-abs(t_back), d))
  }
}

# --------------------------------------------------- 3. cor.test oracle
# Real vectors. cor.test() is the function the page tells users to run, so the
# displayed r / t / df / p must reproduce it cell for cell.
set.seed(42)
datasets <- list(
  list(id = "n10_moderate",  x = c(1,2,3,4,5,6,7,8,9,10),
                             y = c(2,1,4,3,6,5,8,7,10,9)),
  list(id = "n5_strong",     x = c(1,2,3,4,5), y = c(2.1,3.9,6.2,7.8,10.1)),
  list(id = "n3_tiny",       x = c(1,2,3), y = c(2,4,5)),
  list(id = "n4_negative",   x = c(1,2,3,4), y = c(9,7,5,2)),
  list(id = "n12_weak",      x = 1:12, y = c(3,1,4,1,5,9,2,6,5,3,5,8)),
  list(id = "n20_noise",     x = rnorm(20), y = rnorm(20)),
  list(id = "n30_corr",      x = rnorm(30), y = NULL),
  list(id = "n100_weak",     x = rnorm(100), y = NULL),
  list(id = "n7_flat",       x = 1:7, y = c(5,5,5,5,5,5,6)),
  list(id = "n15_mtcars",    x = mtcars$wt[1:15], y = mtcars$mpg[1:15])
)
# fill the derived ys deterministically
datasets[[7]]$y <- datasets[[7]]$x * 0.6 + rnorm(30)
datasets[[8]]$y <- datasets[[8]]$x * 0.2 + rnorm(100)

for (d in datasets) {
  x <- d$x; y <- d$y; n <- length(x)
  for (alt in c("two.sided", "greater", "less")) {
    ct <- cor.test(x, y, method = "pearson", alternative = alt)
    tail <- switch(alt, two.sided = "two", greater = "right", less = "left")
    add("cortest_p", list(id = d$id, r = unname(ct$estimate), n = n, tail = tail),
        unname(ct$p.value))
    if (alt == "two.sided") {
      add("cortest_t", list(id = d$id, r = unname(ct$estimate), n = n),
          unname(ct$statistic))
      add("cortest_r", list(id = d$id, x = x, y = y), unname(ct$estimate))
    }
  }
}

# Full mtcars wt~mpg: the canonical worked example shown on the page.
ct <- cor.test(mtcars$wt, mtcars$mpg)
add("cortest_p", list(id = "mtcars_full", r = unname(ct$estimate), n = 32, tail = "two"),
    unname(ct$p.value))
add("cortest_t", list(id = "mtcars_full", r = unname(ct$estimate), n = 32),
    unname(ct$statistic))
add("cortest_r", list(id = "mtcars_full", x = mtcars$wt, y = mtcars$mpg),
    unname(ct$estimate))

# --------------------------------------------------- 4. rToT identity
# t = r * sqrt(df / (1 - r^2)); verified against the t cor.test reports.
for (n in c(5, 10, 20, 50, 100)) {
  for (r in c(-0.9, -0.5, -0.1, 0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99)) {
    df <- n - 2
    add("rToT", list(r = r, n = n), r * sqrt(df / (1 - r^2)))
  }
}

# --------------------------------------------------- 5. p-values, all tails
for (n in c(3, 4, 5, 10, 12, 27, 30, 52, 102, 1000)) {
  df <- n - 2
  for (r in c(-0.95, -0.6, -0.3, 0, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95, 0.999)) {
    tv <- r * sqrt(df / (1 - r^2))
    add("pvR", list(r = r, n = n, tail = "two"),   2 * pt(-abs(tv), df))
    add("pvR", list(r = r, n = n, tail = "right"), pt(-tv, df))
    add("pvR", list(r = r, n = n, tail = "left"),  pt(tv, df))
  }
}

# --------------------------------------------------- 6. edge cases
# r = 0 -> t = 0 -> p = 1 (two-tailed), 0.5 one-tailed
add("pvR", list(r = 0, n = 10, tail = "two"),   2 * pt(0, 8))
add("pvR", list(r = 0, n = 10, tail = "right"), pt(0, 8))
# perfect correlation -> t = Inf -> p = 0
add("pvR", list(r = 1,  n = 10, tail = "two"), 0)
add("pvR", list(r = -1, n = 10, tail = "two"), 0)
# smallest testable sample: n = 3 (df = 1)
add("critR", list(alpha = 0.05, n = 3, tail = "two"),
    { tc <- qt(0.975, 1); tc / sqrt(1 + tc^2) })
# large n, tiny alpha
add("critR", list(alpha = 0.001, n = 1002, tail = "two"),
    { tc <- qt(0.9995, 1000); tc / sqrt(1000 + tc^2) })
add("critR", list(alpha = 0.001, n = 12, tail = "two"),
    { tc <- qt(0.9995, 10); tc / sqrt(10 + tc^2) })
# deep tail: p must not flush to zero prematurely
add("pvR", list(r = 0.9999, n = 1000, tail = "two"),
    2 * pt(-abs(0.9999 * sqrt(998 / (1 - 0.9999^2))), 998))

# --------------------------------------------------- 7. minimum-n reverse mode
# Smallest n (>=3) at which |r| clears the two-tailed critical value at alpha.
min_n_for <- function(r, a) {
  for (n in 3:100000) {
    d <- n - 2
    tc <- qt(1 - a / 2, d)
    if (abs(r) > tc / sqrt(d + tc^2)) return(n)
  }
  NA
}
for (r in c(0.9, 0.7, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05, -0.35)) {
  for (a in c(0.05, 0.01)) {
    add("minN", list(r = r, alpha = a, tail = "two"), min_n_for(r, a))
  }
}

# --------------------------------------------------- emit
esc <- function(s) gsub('"', '\\\\"', s)
num <- function(v) {
  if (is.na(v)) return("null")
  if (is.infinite(v)) return(if (v > 0) "1e999" else "-1e999")
  formatC(v, digits = 17, format = "g")
}
jval <- function(v) {
  if (is.character(v)) paste0('"', esc(v), '"')
  else if (length(v) > 1) paste0("[", paste(vapply(v, num, ""), collapse = ","), "]")
  else num(v)
}
lines <- vapply(out, function(c) {
  args <- paste(vapply(names(c$a), function(k)
    paste0('"', k, '":', jval(c$a[[k]])), ""), collapse = ",")
  paste0('{"fn":"', c$fn, '","a":{', args, '},"v":', num(c$v), '}')
}, "")
writeLines(paste0("[\n", paste(lines, collapse = ",\n"), "\n]"),
           file.path("Scripts", "tool-truth", "pearson-critical-values-table.json"))
cat("cases:", length(out), "\n")
