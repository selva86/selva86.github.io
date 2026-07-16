# Truth table for poisson-distribution-calculator
# Ground truth: R 4.6.0 dpois / ppois / qpois
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/poisson-distribution-calculator.R

cases <- list()
add <- function(id, fn, args, value) {
  cases[[length(cases) + 1]] <<- list(id = id, fn = fn, args = args, value = value)
}

# ---- dpois: P(X = k) ----
grid_d <- list(
  c(k=3,   lam=3),
  c(k=0,   lam=3),      # k=0
  c(k=0,   lam=0.5),    # lambda < 1, k=0
  c(k=2,   lam=0.5),
  c(k=1,   lam=1),
  c(k=5,   lam=2),
  c(k=10,  lam=4),      # upper-ish
  c(k=0,   lam=10),
  c(k=10,  lam=10),     # at the mean
  c(k=25,  lam=10),     # right tail
  c(k=100, lam=100),
  c(k=140, lam=100),    # right tail, large lambda
  c(k=60,  lam=100),    # left tail, large lambda
  c(k=1000,lam=1000),
  c(k=7,   lam=0.2),    # rare, deep
  c(k=0,   lam=0.01),   # near-certain zero
  c(k=0,   lam=0),      # degenerate lambda=0 -> 1
  c(k=3,   lam=0)       # degenerate lambda=0 -> 0
)
for (g in grid_d) add(sprintf("d_k%g_l%g", g["k"], g["lam"]),
                      "dpois", list(k=unname(g["k"]), lambda=unname(g["lam"])),
                      dpois(g["k"], g["lam"]))

# ---- ppois: P(X <= k) ----
grid_p <- list(
  c(k=3,   lam=3),
  c(k=0,   lam=3),
  c(k=0,   lam=0.5),
  c(k=2,   lam=1),
  c(k=10,  lam=4),
  c(k=0,   lam=10),      # deep lower tail
  c(k=5,   lam=10),      # lower tail
  c(k=10,  lam=10),
  c(k=20,  lam=10),
  c(k=80,  lam=100),     # left tail large lambda
  c(k=100, lam=100),
  c(k=130, lam=100),     # near 1
  c(k=950, lam=1000),
  c(k=0,   lam=0.01),
  c(k=0,   lam=0),       # lambda=0 -> 1
  c(k=1,   lam=25)       # very deep lower tail
)
for (g in grid_p) add(sprintf("p_k%g_l%g", g["k"], g["lam"]),
                      "ppois", list(k=unname(g["k"]), lambda=unname(g["lam"])),
                      ppois(g["k"], g["lam"]))

# ---- P(X >= k) = ppois(k-1, lower.tail=FALSE) ----
grid_u <- list(
  c(k=4,   lam=3),
  c(k=0,   lam=3),       # = 1
  c(k=1,   lam=3),       # P(at least one)
  c(k=1,   lam=0.1),     # rare, at least one
  c(k=15,  lam=4),       # deep upper tail
  c(k=20,  lam=10),
  c(k=30,  lam=10),      # deep upper tail
  c(k=130, lam=100),     # deep upper tail large lambda
  c(k=140, lam=100),
  c(k=1,   lam=0.001),   # ultra-rare at-least-one
  c(k=1050,lam=1000)     # deep upper tail
)
for (g in grid_u) add(sprintf("u_k%g_l%g", g["k"], g["lam"]),
                      "ppoisUpper", list(k=unname(g["k"]), lambda=unname(g["lam"])),
                      ppois(g["k"] - 1, g["lam"], lower.tail = FALSE))

# ---- P(a <= X <= b) = ppois(b) - ppois(a-1) ----
grid_r <- list(
  c(a=2, b=5,   lam=3),
  c(a=0, b=0,   lam=3),    # single value = dpois(0)
  c(a=3, b=3,   lam=3),    # single value = dpois(3)
  c(a=8, b=12,  lam=10),   # around the mean
  c(a=0, b=20,  lam=10),   # near 1
  c(a=90,b=110, lam=100),
  c(a=1, b=4,   lam=0.5)
)
for (g in grid_r) add(sprintf("r_a%g_b%g_l%g", g["a"], g["b"], g["lam"]),
                      "ppoisRange", list(a=unname(g["a"]), b=unname(g["b"]), lambda=unname(g["lam"])),
                      ppois(g["b"], g["lam"]) - ppois(g["a"] - 1, g["lam"]))

# ---- qpois: smallest k with P(X<=k) >= target ----
grid_q <- list(
  c(t=0.5,   lam=3),
  c(t=0.975, lam=3),
  c(t=0.025, lam=3),
  c(t=0.95,  lam=10),
  c(t=0.05,  lam=10),
  c(t=0.99,  lam=10),
  c(t=0.999, lam=4),
  c(t=0.001, lam=4),
  c(t=0.5,   lam=100),
  c(t=0.95,  lam=100),
  c(t=0.5,   lam=0.5),
  c(t=0.9,   lam=0.5),
  c(t=0.9974113, lam=3),   # ~ ppois(8,3) boundary
  c(t=0,     lam=5),       # -> 0
  c(t=1,     lam=5)        # -> Inf
)
for (g in grid_q) add(sprintf("q_t%g_l%g", g["t"], g["lam"]),
                      "qpois", list(target=unname(g["t"]), lambda=unname(g["lam"])),
                      qpois(g["t"], g["lam"]))

# ---- moments (mean = variance = lambda; sd = sqrt(lambda)) ----
mom <- c(3, 0.5, 10, 100, 1000)
for (l in mom) {
  add(sprintf("mean_l%g", l), "mean", list(lambda=l), l)
  add(sprintf("var_l%g",  l), "variance", list(lambda=l), l)
  add(sprintf("sd_l%g",   l), "sd", list(lambda=l), sqrt(l))
}

# ---- serialize JSON manually (avoid jsonlite dependency) ----
num <- function(x) {
  if (is.na(x)) return("null")
  if (is.infinite(x)) return(if (x > 0) "1e999" else "-1e999")
  formatC(x, format = "e", digits = 17)
}
argstr <- function(a) paste(sprintf('"%s":%s', names(a), sapply(a, num)), collapse = ",")
items <- sapply(cases, function(c)
  sprintf('{"id":"%s","fn":"%s","args":{%s},"value":%s}', c$id, c$fn, argstr(c$args), num(c$value)))
out <- paste0("[\n", paste(items, collapse = ",\n"), "\n]\n")
writeLines(out, "Scripts/tool-truth/poisson-distribution-calculator.json")
cat("Wrote", length(cases), "cases\n")
