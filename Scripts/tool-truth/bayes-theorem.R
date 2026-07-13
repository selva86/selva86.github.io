# Ground-truth generator for tools/bayes-theorem-calculator.html
# Every quantity the page displays is closed-form arithmetic. R uses the same
# IEEE-754 doubles + operations as the JS lib, so these are bit-for-bit truth.
# Run: "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/bayes-theorem.R
suppressWarnings(suppressMessages({ library(jsonlite) }))

# ---- canonical functions (must match tools/lib/bayes-math.js exactly) ----
bayes <- function(prior, pdh, pdnh){
  num <- pdh * prior
  den <- num + pdnh * (1 - prior)
  num / den
}
ppv     <- function(prev, sens, spec) bayes(prev, sens, 1 - spec)
npv     <- function(prev, sens, spec) bayes(1 - prev, spec, 1 - sens)
lrPos   <- function(sens, spec) sens / (1 - spec)
lrNeg   <- function(sens, spec) (1 - sens) / spec
preOdds <- function(p) p / (1 - p)
postFromOdds <- function(o) o / (1 + o)

N <- 10000

# encode Inf/NaN so JSON round-trips; the JS harness maps these strings back
enc <- function(x){
  if (is.nan(x)) return("NaN")
  if (is.infinite(x)) return(if (x > 0) "Infinity" else "-Infinity")
  x
}

# counts + posterior for the generic (prior,pdh,pdnh) frame
frame <- function(prior, pdh, pdnh){
  num <- pdh * prior
  den <- num + pdnh * (1 - prior)
  post <- num / den
  pos_pop <- N * prior; neg_pop <- N * (1 - prior)
  tp <- pos_pop * pdh;  fn <- pos_pop * (1 - pdh)
  fp <- neg_pop * pdnh; tn <- neg_pop * (1 - pdnh)
  list(
    prior = prior, pdh = pdh, pdnh = pdnh,
    num = enc(num), den = enc(den), posterior = enc(post),
    tp = enc(tp), fn = enc(fn), fp = enc(fp), tn = enc(tn),
    ppv_from_counts = enc(tp / (tp + fp))
  )
}

# medical frame adds sens/spec-specific stats
medical <- function(prev, sens, spec){
  f <- frame(prev, sens, 1 - spec)
  o_pre  <- preOdds(prev)
  lrp    <- lrPos(sens, spec)
  o_post <- o_pre * lrp
  c(f, list(
    ppv = enc(ppv(prev, sens, spec)),
    npv = enc(npv(prev, sens, spec)),
    lr_pos = enc(lrp),
    lr_neg = enc(lrNeg(sens, spec)),
    pre_odds = enc(o_pre),
    post_odds = enc(o_post),
    post_from_odds = enc(postFromOdds(o_post))
  ))
}

chain <- function(prev, sens1, spec1, sens2, spec2){
  post1 <- ppv(prev, sens1, spec1)
  post2 <- ppv(post1, sens2, spec2)
  sick <- N * prev; well <- N * (1 - prev)
  tp1 <- sick * sens1; fp1 <- well * (1 - spec1)
  tp2 <- tp1 * sens2;  fp2 <- fp1 * (1 - spec2)
  list(
    prev = prev, sens1 = sens1, spec1 = spec1, sens2 = sens2, spec2 = spec2,
    post1 = enc(post1), post2 = enc(post2),
    tp1 = enc(tp1), fp1 = enc(fp1), tp2 = enc(tp2), fp2 = enc(fp2),
    ppv1 = enc(tp1 / (tp1 + fp1)), ppv2 = enc(tp2 / (tp2 + fp2))
  )
}

cases <- list()
add <- function(name, mode, inputs, expected){
  cases[[length(cases) + 1]] <<- list(name = name, mode = mode, inputs = inputs, expected = expected)
}

# ---- scenario presets (medical) ----
add("hiv",   "medical", list(prev=0.001, sens=0.99, spec=0.95), medical(0.001, 0.99, 0.95))
add("mammo", "medical", list(prev=0.01,  sens=0.80, spec=0.90), medical(0.01,  0.80, 0.90))
add("covid", "medical", list(prev=0.05,  sens=0.85, spec=0.97), medical(0.05,  0.85, 0.97))
add("drug",  "medical", list(prev=0.04,  sens=0.95, spec=0.93), medical(0.04,  0.95, 0.93))
add("poly",  "medical", list(prev=0.10,  sens=0.85, spec=0.60), medical(0.10,  0.85, 0.60))

# ---- generic ----
add("sanity",       "generic", list(prior=0.5, pdh=0.5, pdnh=0.5), frame(0.5, 0.5, 0.5))
add("generic_asym", "generic", list(prior=0.30, pdh=0.70, pdnh=0.10), frame(0.30, 0.70, 0.10))
add("generic_def",  "generic", list(prior=0.5, pdh=0.5, pdnh=0.5), frame(0.5, 0.5, 0.5))

# ---- spam (generic frame with spam names) ----
add("spam_def",    "spam", list(prior=0.30, pdh=0.40, pdnh=0.05), frame(0.30, 0.40, 0.05))
add("spam_strong", "spam", list(prior=0.20, pdh=0.90, pdnh=0.01), frame(0.20, 0.90, 0.01))

# ---- chain ----
add("chain_def", "chain", list(prev=0.01, sens1=0.85, spec1=0.90, sens2=0.95, spec2=0.97),
    chain(0.01, 0.85, 0.90, 0.95, 0.97))

# ---- edge cases ----
add("edge_prev0",     "medical", list(prev=0,      sens=0.99, spec=0.95), medical(0,      0.99, 0.95))
add("edge_prev1",     "medical", list(prev=1,      sens=0.99, spec=0.95), medical(1,      0.99, 0.95))
add("edge_perfspec",  "medical", list(prev=0.01,   sens=0.99, spec=1),    medical(0.01,   0.99, 1))     # LR+ = Inf
add("edge_spec0",     "medical", list(prev=0.10,   sens=0.90, spec=0),    medical(0.10,   0.90, 0))
add("edge_sens0",     "medical", list(prev=0.10,   sens=0,    spec=0.95), medical(0.10,   0,    0.95))
add("edge_sens1spec1","medical", list(prev=0.02,   sens=1,    spec=1),    medical(0.02,   1,    1))      # LR+ = Inf
add("edge_tinyprev",  "medical", list(prev=1e-9,   sens=0.99, spec=0.95), medical(1e-9,   0.99, 0.95))

out <- list(
  meta = list(tool = "bayes-theorem-calculator", N = N, generated_by = "bayes-theorem.R"),
  cases = cases
)
writeLines(toJSON(out, auto_unbox = TRUE, digits = 15, pretty = TRUE),
           "Scripts/tool-truth/bayes-theorem.json")

# console echo of the headline numbers
cat("\n=== bayes-theorem truth ===\n")
for (c in cases){
  e <- c$expected
  key <- if (!is.null(e$ppv)) e$ppv else if (!is.null(e$post2)) e$post2 else e$posterior
  cat(sprintf("%-16s %-8s -> %s\n", c$name, c$mode, format(key, digits = 12)))
}
cat("\nwrote Scripts/tool-truth/bayes-theorem.json (", length(cases), "cases )\n")
