# Tool Farm v2: dist-tables (t-table + z-table) truth grid (R 4.6.0)
# Ground truth for tools/lib/dist-tables-math.js: qt/pt, qnorm/pnorm,
# qchisq/pchisq, qf/pf. >=600 cases incl. fractional df, all common alpha
# levels, one/two-tailed, and extremes.
options(digits = 17)

out <- list()
add <- function(fn, a, v) {
  out[[length(out) + 1]] <<- list(fn = fn, a = a, v = v)
}

# ------------------------------------------------------------------ t dist
# df grid: integers 1..40, then a coarse tail, plus fractional df.
df_t <- c(1:40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 200,
          1.5, 2.7, 3.3, 5.6, 7.2, 9.9, 12.4, 18.75, 27.35, 40.1, 63.2,
          99.9, 149.5)
# upper-tail cumulative probs = the classic t-table columns
p_qt <- c(0.75, 0.90, 0.95, 0.975, 0.99, 0.995, 0.999, 0.9995)

for (d in df_t) for (p in p_qt) {
  add("qt", list(p = p, df = d), qt(p, d))
}

# pt: lower CDF and two-tailed p for a spread of t values / df
t_vals <- c(-6, -3, -2.5, -1.96, -1, -0.5, 0, 0.5, 1, 1.5, 1.96, 2, 2.5,
            3, 4, 6, 10, 30)
df_pt  <- c(1, 2, 3, 5, 8, 10, 15, 20, 30, 60, 120, 4.5, 12.7, 45.3)
for (d in df_pt) for (t in t_vals) {
  add("pt", list(q = t, df = d), pt(t, d))
}
# two-tailed p = 2*pt(-|t|, df) (what reverse mode reports)
for (d in df_pt) for (t in c(0.5, 1, 1.96, 2.5, 3, 5, 10)) {
  add("ptTwo", list(q = t, df = d), 2 * pt(-abs(t), d))
}

# t extremes
add("qt", list(p = 0.9995, df = 1), qt(0.9995, 1))   # ~636.6
add("qt", list(p = 0.999,  df = 1), qt(0.999, 1))    # ~318.3
add("qt", list(p = 0.9995, df = 2), qt(0.9995, 2))
add("pt", list(q = 636.619, df = 1), pt(636.619, 1))
add("pt", list(q = 100,     df = 1), pt(100, 1))
add("qt", list(p = 0.5, df = 7), qt(0.5, 7))

# ------------------------------------------------------------------ normal
p_qn <- c(0.5, 0.75, 0.80, 0.90, 0.95, 0.975, 0.99, 0.995, 0.999, 0.9995,
          0.99995, 0.025, 0.05, 0.005, 0.001, 0.0005)
for (p in p_qn) add("qnorm", list(p = p), qnorm(p))

z_vals <- c(-4, -3.49, -3, -2.58, -2.33, -1.96, -1.645, -1.28, -1, -0.5,
            -0.01, 0, 0.01, 0.5, 1, 1.28, 1.645, 1.96, 2.33, 2.58, 3,
            3.49, 3.9, 4)
for (z in z_vals) add("pnorm", list(q = z), pnorm(z))
# a fine z grid mirroring the z-table cells (0.00..3.49 by 0.01, both signs)
zg <- seq(0, 3.49, by = 0.01)
for (z in zg) { add("pnorm", list(q = z), pnorm(z)); add("pnorm", list(q = -z), pnorm(-z)) }
# density (curve visual uses dnorm)
for (z in c(0, 0.5, 1, 1.5, 1.96, 2.5, 3)) add("dnorm", list(q = z), dnorm(z))

# ------------------------------------------------------------------ chi-square
df_chi <- c(1:30, 40, 50, 60, 80, 100, 2.5, 7.3)
p_chi  <- c(0.90, 0.95, 0.975, 0.99, 0.995, 0.999, 0.10, 0.05, 0.025, 0.01)
for (d in df_chi) for (p in p_chi) add("qchisq", list(p = p, df = d), qchisq(p, d))
x_chi <- c(0.5, 1, 2, 3.84, 5, 7.88, 10, 20, 50, 100)
for (d in c(1, 2, 3, 5, 10, 20, 30)) for (x in x_chi) add("pchisq", list(q = x, df = d), pchisq(x, d))

# ------------------------------------------------------------------ F dist
df1_f <- c(1, 2, 3, 4, 5, 8, 10, 15, 20, 30)
df2_f <- c(5, 10, 15, 20, 30, 60, 120, 200)
p_f   <- c(0.90, 0.95, 0.975, 0.99)
for (a in df1_f) for (b in df2_f) for (p in p_f) add("qf", list(p = p, df1 = a, df2 = b), qf(p, a, b))
x_f <- c(0.5, 1, 1.5, 2, 3, 4, 5, 10)
for (a in c(1, 2, 3, 5, 10)) for (b in c(5, 10, 20, 30, 60)) for (x in x_f) {
  add("pf", list(q = x, df1 = a, df2 = b), pf(x, a, b))
}
# F extremes / fractional df
add("qf", list(p = 0.95, df1 = 1, df2 = 1), qf(0.95, 1, 1))
add("qf", list(p = 0.99, df1 = 2, df2 = 3), qf(0.99, 2, 3))
add("pf", list(q = 2.5, df1 = 4.5, df2 = 12.3), pf(2.5, 4.5, 12.3))

# ------------------------------------------------------------------ emit JSON
esc <- function(v) {
  if (is.infinite(v)) return(if (v > 0) "1e400" else "-1e400")
  sprintf("%.15g", v)
}
argstr <- function(a) {
  paste(sprintf('"%s":%s', names(a), vapply(a, esc, "")), collapse = ",")
}
cat("[\n")
for (i in seq_along(out)) {
  o <- out[[i]]
  cat(sprintf('{"fn":"%s","a":{%s},"v":%s}%s\n',
              o$fn, argstr(o$a), esc(o$v),
              if (i < length(out)) "," else ""))
}
cat("]\n")
cat(sprintf("# total cases: %d\n", length(out)), file = stderr())
