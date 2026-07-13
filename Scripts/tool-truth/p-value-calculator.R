# Tool Farm v2: p-value-calculator truth grid (R 4.6.0)
# Ground truth for tools/lib/dist-tables-math.js p-value + critical-value
# composition (pvT/pvZ/pvChisq/pvF/pvR, critT/critZ/critChisq/critF/critR).
# Every record's `v` is what R's pt/pnorm/pchisq/pf/qt/qnorm/qchisq/qf produce
# for the exact tail the tool reports. >=400 cases incl. |t|>30, df=1, p
# underflow, both/all tails, and every inverse (alpha -> critical value) mode.
options(digits = 17)

out <- list()
add <- function(fn, a, v) { out[[length(out) + 1]] <<- list(fn = fn, a = a, v = v) }

# ----------------------------------------------------------------- pvT
# tail: two = 2*pt(-|t|,df); right = P(T>=t); left = P(T<=t)
t_vals <- c(-40, -35, -30, -10, -6, -3, -2.5, -1.96, -1, -0.5, 0,
            0.5, 1, 1.96, 2, 2.5, 3, 6, 10, 30, 35, 40)
df_t   <- c(1, 2, 3, 5, 8, 10, 15, 24, 30, 60, 120, 17.4, 4.5)
for (d in df_t) for (t in t_vals) {
  add("pvT", list(t = t, df = d, tail = "two"),   2 * pt(-abs(t), d))
  add("pvT", list(t = t, df = d, tail = "right"), pt(t, d, lower.tail = FALSE))
  add("pvT", list(t = t, df = d, tail = "left"),  pt(t, d))
}

# ----------------------------------------------------------------- pvZ
z_vals <- c(-37, -20, -15, -10, -8, -6, -3, -2.58, -1.96, -1.645, -1,
            -0.5, 0, 0.5, 1, 1.645, 1.96, 2.58, 3, 6, 8, 10, 15, 20, 37)
for (z in z_vals) {
  add("pvZ", list(z = z, tail = "two"),   2 * pnorm(-abs(z)))
  add("pvZ", list(z = z, tail = "right"), pnorm(z, lower.tail = FALSE))
  add("pvZ", list(z = z, tail = "left"),  pnorm(z))
}

# ----------------------------------------------------------------- pvChisq
x_chi  <- c(0.1, 0.5, 1, 2, 3.84, 5, 7.88, 10, 20, 50, 100, 200, 300)
df_chi <- c(1, 2, 3, 5, 10, 20, 30, 50)
for (d in df_chi) for (x in x_chi) {
  add("pvChisq", list(x = x, df = d, tail = "upper"), pchisq(x, d, lower.tail = FALSE))
  add("pvChisq", list(x = x, df = d, tail = "lower"), pchisq(x, d))
}

# ----------------------------------------------------------------- pvF
x_f   <- c(0.1, 0.5, 1, 1.5, 2, 3, 5, 10, 50)
df1_f <- c(1, 2, 3, 10)
df2_f <- c(5, 10, 30, 120)
for (a in df1_f) for (b in df2_f) for (x in x_f) {
  add("pvF", list(x = x, df1 = a, df2 = b, tail = "upper"), pf(x, a, b, lower.tail = FALSE))
  add("pvF", list(x = x, df1 = a, df2 = b, tail = "lower"), pf(x, a, b))
}
# fractional df F extreme
add("pvF", list(x = 4.5, df1 = 4.5, df2 = 12.3, tail = "upper"), pf(4.5, 4.5, 12.3, lower.tail = FALSE))

# ----------------------------------------------------------------- pvR (Pearson r)
# t = r*sqrt((n-2)/(1-r^2)); two = cor.test two-sided; right = alt "greater"
r_vals <- c(-0.99, -0.9, -0.7, -0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99)
n_r    <- c(5, 10, 20, 30, 50, 100)
for (n in n_r) for (r in r_vals) {
  df <- n - 2
  tt <- r * sqrt(df / (1 - r * r))
  add("pvR", list(r = r, n = n, tail = "two"),   2 * pt(-abs(tt), df))
  add("pvR", list(r = r, n = n, tail = "right"), pt(tt, df, lower.tail = FALSE))
  add("pvR", list(r = r, n = n, tail = "left"),  pt(tt, df))
}

# ----------------------------------------------------------------- critT
alphas <- c(0.10, 0.05, 0.025, 0.01, 0.005, 0.001)
for (d in c(1, 5, 10, 24, 30, 120)) for (al in alphas) {
  add("critT", list(alpha = al, df = d, tail = "two"),   qt(1 - al / 2, d))
  add("critT", list(alpha = al, df = d, tail = "right"), qt(1 - al, d))
  add("critT", list(alpha = al, df = d, tail = "left"),  qt(al, d))
}

# ----------------------------------------------------------------- critZ
for (al in alphas) {
  add("critZ", list(alpha = al, tail = "two"),   qnorm(1 - al / 2))
  add("critZ", list(alpha = al, tail = "right"), qnorm(1 - al))
  add("critZ", list(alpha = al, tail = "left"),  qnorm(al))
}

# ----------------------------------------------------------------- critChisq
for (d in c(1, 3, 5, 10, 20)) for (al in alphas) {
  add("critChisq", list(alpha = al, df = d, tail = "upper"), qchisq(1 - al, d))
  add("critChisq", list(alpha = al, df = d, tail = "lower"), qchisq(al, d))
}

# ----------------------------------------------------------------- critF
for (a in c(1, 2, 3, 10)) for (b in c(5, 10, 30, 120)) for (al in c(0.10, 0.05, 0.025, 0.01)) {
  add("critF", list(alpha = al, df1 = a, df2 = b, tail = "upper"), qf(1 - al, a, b))
  add("critF", list(alpha = al, df1 = a, df2 = b, tail = "lower"), qf(al, a, b))
}

# ----------------------------------------------------------------- critR
for (n in c(5, 10, 20, 30, 100)) for (al in alphas) {
  df <- n - 2
  tc2 <- qt(1 - al / 2, df); tc1 <- qt(1 - al, df)
  add("critR", list(alpha = al, n = n, tail = "two"),   tc2 / sqrt(df + tc2 * tc2))
  add("critR", list(alpha = al, n = n, tail = "right"), tc1 / sqrt(df + tc1 * tc1))
}

# ----------------------------------------------------------------- emit JSON
esc <- function(v) {
  if (is.na(v))       return("null")
  if (is.infinite(v)) return(if (v > 0) "1e400" else "-1e400")
  sprintf("%.15g", v)
}
argstr <- function(a) {
  paste(mapply(function(k, x) {
    if (is.character(x)) sprintf('"%s":"%s"', k, x) else sprintf('"%s":%s', k, esc(x))
  }, names(a), a), collapse = ",")
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
