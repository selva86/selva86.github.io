# Truth table for binomial-probability-calculator
# Ground truth: R 4.6.0 dbinom / pbinom / qbinom
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/binomial-probability-calculator.R

cases <- list()
add <- function(id, fn, args, value) {
  cases[[length(cases) + 1]] <<- list(id = id, fn = fn, args = args, value = value)
}

# ---- dbinom: P(X = k) ----
grid_d <- list(
  c(k=3,  n=10,  p=0.5),
  c(k=0,  n=10,  p=0.5),    # k=0
  c(k=10, n=10,  p=0.5),    # k=n
  c(k=0,  n=10,  p=0.3),
  c(k=10, n=10,  p=0.3),
  c(k=7,  n=20,  p=0.35),
  c(k=1,  n=1,   p=0.5),    # Bernoulli
  c(k=0,  n=1,   p=0.5),
  c(k=50, n=100, p=0.5),
  c(k=30, n=100, p=0.3),
  c(k=0,  n=10,  p=0),      # p=0
  c(k=0,  n=10,  p=1),      # p=1, k!=n -> 0
  c(k=10, n=10,  p=1),      # p=1, k=n -> 1
  c(k=5,  n=10,  p=1),      # p=1, k!=n -> 0
  c(k=300,n=1000,p=0.3),    # large n
  c(k=2,  n=15,  p=0.02),   # rare event
  c(k=12, n=12,  p=0.9),
  c(k=6,  n=12,  p=0.25)
)
for (g in grid_d) add(sprintf("d_k%g_n%g_p%g", g["k"], g["n"], g["p"]),
                      "dbinom", list(k=unname(g["k"]), n=unname(g["n"]), p=unname(g["p"])),
                      dbinom(g["k"], g["n"], g["p"]))

# ---- pbinom: P(X <= k) ----
grid_p <- list(
  c(k=5,  n=10,  p=0.5),
  c(k=0,  n=10,  p=0.5),
  c(k=9,  n=10,  p=0.5),
  c(k=10, n=10,  p=0.5),    # = 1
  c(k=3,  n=20,  p=0.35),
  c(k=0,  n=20,  p=0.35),
  c(k=45, n=100, p=0.5),
  c(k=60, n=100, p=0.5),
  c(k=0,  n=10,  p=0.05),
  c(k=250,n=1000,p=0.3),    # upper-ish tail large n
  c(k=350,n=1000,p=0.3),
  c(k=0,  n=10,  p=0),      # p=0 -> 1
  c(k=9,  n=10,  p=1),      # p=1 -> 0 (all mass at 10)
  c(k=10, n=10,  p=1),      # p=1 -> 1
  c(k=1,  n=50,  p=0.5),    # deep lower tail
  c(k=7,  n=8,   p=0.99)
)
for (g in grid_p) add(sprintf("p_k%g_n%g_p%g", g["k"], g["n"], g["p"]),
                      "pbinom", list(k=unname(g["k"]), n=unname(g["n"]), p=unname(g["p"])),
                      pbinom(g["k"], g["n"], g["p"]))

# ---- P(X >= k) = pbinom(k-1, lower.tail=FALSE) ----
grid_u <- list(
  c(k=6,  n=10,  p=0.5),
  c(k=0,  n=10,  p=0.5),    # = 1
  c(k=10, n=10,  p=0.5),    # = dbinom(10)
  c(k=8,  n=20,  p=0.35),
  c(k=55, n=100, p=0.5),
  c(k=1,  n=10,  p=0.05),   # P(at least one)
  c(k=1,  n=100, p=0.001),  # rare, at least one
  c(k=400,n=1000,p=0.3),    # deep upper tail large n
  c(k=1,  n=10,  p=0),      # p=0 -> 0
  c(k=10, n=10,  p=1)       # p=1 -> 1
)
for (g in grid_u) add(sprintf("u_k%g_n%g_p%g", g["k"], g["n"], g["p"]),
                      "pbinomUpper", list(k=unname(g["k"]), n=unname(g["n"]), p=unname(g["p"])),
                      pbinom(g["k"] - 1, g["n"], g["p"], lower.tail = FALSE))

# ---- P(a <= X <= b) = pbinom(b) - pbinom(a-1) ----
grid_r <- list(
  c(a=4, b=6,  n=10,  p=0.5),
  c(a=0, b=10, n=10,  p=0.5),   # = 1
  c(a=3, b=3,  n=10,  p=0.5),   # single value = dbinom
  c(a=40,b=60, n=100, p=0.5),
  c(a=1, b=5,  n=20,  p=0.1),
  c(a=280,b=320,n=1000,p=0.3),
  c(a=0, b=0,  n=10,  p=0.2)
)
for (g in grid_r) add(sprintf("r_a%g_b%g_n%g_p%g", g["a"], g["b"], g["n"], g["p"]),
                      "pbinomRange", list(a=unname(g["a"]), b=unname(g["b"]), n=unname(g["n"]), p=unname(g["p"])),
                      pbinom(g["b"], g["n"], g["p"]) - pbinom(g["a"] - 1, g["n"], g["p"]))

# ---- qbinom: smallest k with P(X<=k) >= target ----
grid_q <- list(
  c(t=0.5,   n=10,  p=0.5),
  c(t=0.975, n=10,  p=0.5),
  c(t=0.025, n=10,  p=0.5),
  c(t=0.9,   n=20,  p=0.35),
  c(t=0.95,  n=100, p=0.5),
  c(t=0.05,  n=100, p=0.5),
  c(t=0.999, n=50,  p=0.3),
  c(t=0.001, n=50,  p=0.3),
  c(t=0.623046875, n=10, p=0.5),  # exactly pbinom(5,10,.5) -> boundary
  c(t=0.5,   n=1000,p=0.3),
  c(t=0,     n=10,  p=0.4),        # -> 0
  c(t=1,     n=10,  p=0.4),        # -> n
  c(t=0.8,   n=1,   p=0.5)         # Bernoulli
)
for (g in grid_q) add(sprintf("q_t%g_n%g_p%g", g["t"], g["n"], g["p"]),
                      "qbinom", list(target=unname(g["t"]), n=unname(g["n"]), p=unname(g["p"])),
                      qbinom(g["t"], g["n"], g["p"]))

# ---- moments ----
mom <- list(c(n=10,p=0.5), c(n=20,p=0.35), c(n=100,p=0.3), c(n=1000,p=0.3), c(n=1,p=0.5))
for (g in mom) {
  add(sprintf("mean_n%g_p%g", g["n"], g["p"]), "mean", list(n=unname(g["n"]), p=unname(g["p"])), g["n"]*g["p"])
  add(sprintf("var_n%g_p%g",  g["n"], g["p"]), "variance", list(n=unname(g["n"]), p=unname(g["p"])), g["n"]*g["p"]*(1-g["p"]))
  add(sprintf("sd_n%g_p%g",   g["n"], g["p"]), "sd", list(n=unname(g["n"]), p=unname(g["p"])), sqrt(g["n"]*g["p"]*(1-g["p"])))
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
writeLines(out, "Scripts/tool-truth/binomial-probability-calculator.json")
cat("Wrote", length(cases), "cases\n")
