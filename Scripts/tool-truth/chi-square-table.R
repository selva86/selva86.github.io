# Tool Farm v2: chi-square-table + f-table truth grid (R 4.6.0)
# Ground truth for tools/lib/dist-tables-math.js: qchisq/pchisq, qf/pf.
# >=500 cases incl. fractional df, extreme df, tail edges, both tails.
# Gate: Scripts/tool-truth/test-chi-square-table-math.js (<=1e-6 relative).
options(digits = 17)

out <- list()
add <- function(fn, a, v) {
  out[[length(out) + 1]] <<- list(fn = fn, a = a, v = v)
}

# ================================================================ chi-square
# df rows the printable table renders, plus fractional + extreme df.
df_chi <- c(1:30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
            0.5, 1.5, 2.5, 4.3, 7.3, 12.7, 15.5, 27.35, 40.2, 63.7, 99.9,
            150, 200)
# The standard chi-square table columns are UPPER-tail areas a; the cell is
# qchisq(1 - a, df). Test qchisq directly at both the small- and large-p ends
# so both tails of the inversion are exercised.
p_chi <- c(0.001, 0.005, 0.01, 0.025, 0.05, 0.10, 0.25, 0.5,
           0.75, 0.90, 0.95, 0.975, 0.99, 0.995, 0.999)
for (d in df_chi) for (p in p_chi) add("qchisq", list(p = p, df = d), qchisq(p, d))

# pchisq: lower CDF for a spread of statistics / df (reverse mode + tails).
x_chi <- c(0.001, 0.1, 0.5, 1, 2, 3.841, 5, 6.635, 7.879, 10, 15, 20, 30,
           50, 80, 120, 200)
df_pchi <- c(1, 2, 3, 4, 5, 8, 10, 15, 20, 30, 50, 100, 2.5, 7.3, 40.2)
for (d in df_pchi) for (x in x_chi) add("pchisq", list(q = x, df = d), pchisq(x, d))

# chi-square edges / classic cutoffs
add("qchisq", list(p = 0.95, df = 1), qchisq(0.95, 1))     # 3.841 (2x2 independence)
add("qchisq", list(p = 0.95, df = 2), qchisq(0.95, 2))     # 5.991
add("qchisq", list(p = 0.99, df = 1), qchisq(0.99, 1))     # 6.635
add("qchisq", list(p = 0.005, df = 10), qchisq(0.005, 10)) # variance-CI lower
add("qchisq", list(p = 0.995, df = 10), qchisq(0.995, 10)) # variance-CI upper
add("pchisq", list(q = 3.841459, df = 1), pchisq(3.841459, 1))

# ================================================================ F distribution
# The standard textbook F table: df1 (numerator) across, df2 (denominator) down.
# Cell = qf(1 - a, df1, df2). Test qf at the table's alpha levels + extras.
df1_f <- c(1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120)
df2_f <- c(1, 2, 3, 5, 8, 10, 15, 20, 24, 30, 40, 60, 120)
p_f   <- c(0.90, 0.95, 0.975, 0.99)   # a = .10 .05 .025 .01
for (a in df1_f) for (b in df2_f) for (p in p_f) {
  add("qf", list(p = p, df1 = a, df2 = b), qf(p, a, b))
}

# pf: lower CDF for reverse mode across a spread of F / df1 / df2.
x_f <- c(0.1, 0.5, 1, 1.5, 2, 3, 4, 5, 7, 10, 20)
df1_pf <- c(1, 2, 3, 5, 10, 20)
df2_pf <- c(3, 5, 10, 20, 30, 60)
for (a in df1_pf) for (b in df2_pf) for (x in x_f) {
  add("pf", list(q = x, df1 = a, df2 = b), pf(x, a, b))
}

# F edges / fractional + extreme df
add("qf", list(p = 0.95, df1 = 1, df2 = 1), qf(0.95, 1, 1))
add("qf", list(p = 0.99, df1 = 2, df2 = 3), qf(0.99, 2, 3))
add("qf", list(p = 0.975, df1 = 8, df2 = 24), qf(0.975, 8, 24))
add("qf", list(p = 0.95, df1 = 4.5, df2 = 12.3), qf(0.95, 4.5, 12.3))
add("qf", list(p = 0.99, df1 = 3, df2 = 200), qf(0.99, 3, 200))
add("qf", list(p = 0.95, df1 = 30, df2 = 1), qf(0.95, 30, 1))
add("pf", list(q = 2.5, df1 = 4.5, df2 = 12.3), pf(2.5, 4.5, 12.3))
add("pf", list(q = 6.94, df1 = 2, df2 = 5), pf(6.94, 2, 5))
add("pf", list(q = 161.4, df1 = 1, df2 = 1), pf(161.4, 1, 1))

# ================================================================ emit JSON
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
