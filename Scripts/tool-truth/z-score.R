# Tool Farm v2: z-score calculator truth table (R 4.6.0 ground truth)
options(digits = 15)

cases <- list()

# pnorm at assorted z (incl. tails)
zs <- c(-4, -3.5, -1.959963985, -1, -0.5, 0, 0.5, 1, 1.644853627, 2.326347874, 3, 4.5)
for (z in zs) cases[[length(cases)+1]] <- list(id = sprintf("pnorm_%g", z), fn = "pnorm", x = z, out = pnorm(z))

# qnorm at assorted p
ps <- c(0.0001, 0.001, 0.025, 0.05, 0.1, 0.5, 0.75, 0.9, 0.95, 0.975, 0.999, 0.9999)
for (p in ps) cases[[length(cases)+1]] <- list(id = sprintf("qnorm_%g", p), fn = "qnorm", x = p, out = qnorm(p))

# x -> z -> percentile with mean/sd
x <- 130; m <- 100; s <- 15
cases[[length(cases)+1]] <- list(id = "iq130_z",   fn = "z",     x = (x-m)/s,          out = (x-m)/s)
cases[[length(cases)+1]] <- list(id = "iq130_pct", fn = "pnorm", x = (x-m)/s,          out = pnorm(x, m, s))

# between probability P(a < X < b)
a <- 85; b <- 115
cases[[length(cases)+1]] <- list(id = "between_85_115", fn = "between", x = NA,
                                 out = pnorm(b, m, s) - pnorm(a, m, s))
# two-tail beyond |z|=2
cases[[length(cases)+1]] <- list(id = "twotail_z2", fn = "twotail", x = 2, out = 2*pnorm(-2))

esc <- function(v) sprintf("%.12g", v)
cat("[\n")
for (i in seq_along(cases)) {
  cc <- cases[[i]]
  cat(sprintf('{"id":"%s","fn":"%s","x":%s,"out":%s}%s\n',
      cc$id, cc$fn, if (is.na(cc$x)) "null" else esc(cc$x), esc(cc$out),
      if (i < length(cases)) "," else ""))
}
cat("]\n")
