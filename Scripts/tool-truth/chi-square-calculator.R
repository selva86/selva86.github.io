# chi-square-calculator.R -- R truth table for the v2 tool.
# Ground truth: R 4.6.0 chisq.test() / fisher.test(). Emits chi-square-calculator.json
# Conventions:
#   - independence/homogeneity: matrix rows x cols; chisq.test(m, correct=<bool>)
#   - stdres  == chisq.test()$stdres (standardized/adjusted residuals)
#   - residuals == chisq.test()$residuals (Pearson residuals)
#   - Cramer's V uses the UNCORRECTED statistic: sqrt(X2 / (N * (min(r,c)-1)))
#   - Cohen's w (GoF): sqrt(X2 / N)
#   - matrices are emitted row-major as arrays-of-arrays (JS tbl[i][j])

suppressWarnings(suppressMessages(library(jsonlite)))

mrows <- function(m){                       # matrix -> list of numeric row vectors
  m <- as.matrix(m)
  lapply(seq_len(nrow(m)), function(i) as.numeric(m[i, ]))
}

ind_case <- function(id, m, correct, fisher = FALSE){
  m <- matrix(as.numeric(m), nrow = nrow(m))
  ct  <- suppressWarnings(chisq.test(m, correct = correct))
  ctu <- suppressWarnings(chisq.test(m, correct = FALSE))     # uncorrected, for V
  N   <- sum(m)
  V   <- sqrt(as.numeric(ctu$statistic) / (N * (min(dim(m)) - 1)))
  out <- list(
    id = id, mode = "independence", correct = correct,
    tbl = mrows(m),
    statistic = as.numeric(ct$statistic),
    df = as.numeric(ct$parameter),
    pValue = as.numeric(ct$p.value),
    expected = mrows(ct$expected),
    stdres = mrows(ct$stdres),
    residuals = mrows(ct$residuals),
    cramerV = V,
    N = N
  )
  if (fisher) out$fisherP <- as.numeric(fisher.test(m)$p.value)
  out
}

gof_case <- function(id, obs, p){
  ct <- suppressWarnings(chisq.test(obs, p = p))
  N  <- sum(obs)
  list(
    id = id, mode = "gof",
    observed = as.numeric(obs),
    probs = as.numeric(p),
    statistic = as.numeric(ct$statistic),
    df = as.numeric(ct$parameter),
    pValue = as.numeric(ct$p.value),
    expected = as.numeric(ct$expected),
    stdres = as.numeric(ct$stdres),
    residuals = as.numeric(ct$residuals),
    cohenW = sqrt(as.numeric(ct$statistic) / N),
    N = N
  )
}

cases <- list(
  ind_case("ind_2x2_vaccine",       matrix(c(20,30,40,10), 2, byrow = TRUE), FALSE, fisher = TRUE),
  ind_case("ind_2x2_vaccine_yates", matrix(c(20,30,40,10), 2, byrow = TRUE), TRUE,  fisher = TRUE),
  ind_case("ind_2x3_dietary",       matrix(c(50,30,20,80,100,50), 2, byrow = TRUE), FALSE),
  ind_case("ind_3x3_income",        matrix(c(40,20,10,30,50,20,10,30,60), 3, byrow = TRUE), FALSE),
  ind_case("ind_2x2_small",         matrix(c(8,2,1,9), 2, byrow = TRUE), FALSE, fisher = TRUE),
  ind_case("ind_2x2_small_yates",   matrix(c(8,2,1,9), 2, byrow = TRUE), TRUE,  fisher = TRUE),
  # homogeneity: identical math to independence (same table as dietary)
  ind_case("hom_2x3_dietary",       matrix(c(50,30,20,80,100,50), 2, byrow = TRUE), FALSE),
  gof_case("gof_dice_uniform", c(95,110,100,90,105,100), rep(1/6, 6)),
  gof_case("gof_mendel",       c(312,102,109,31), c(9,3,3,1)/16),
  gof_case("gof_2cat",         c(10,20), c(0.5,0.5)),
  gof_case("gof_weighted",     c(20,30,25,25), c(0.4,0.2,0.2,0.2))
)

writeLines(
  toJSON(cases, auto_unbox = TRUE, digits = 15, na = "null"),
  "Scripts/tool-truth/chi-square-calculator.json"
)
cat("Wrote", length(cases), "cases\n")
# quick console echo for sanity
for (c in cases) cat(sprintf("%-22s stat=%.6f df=%g p=%.6g\n", c$id, c$statistic, c$df, c$pValue))
