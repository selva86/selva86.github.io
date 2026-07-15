# Ground truth for the simple-linear-regression calculator (Tool Farm v2).
# Every displayed number is verified against R 4.6.0 stats::lm / summary.lm /
# confint / predict.lm / AIC / BIC / logLik on five datasets:
#   A mtcars mpg~wt (n=32) | B positive slope (n=10) | C negative slope (n=8)
#   D tiny n=3 | E larger-noise near-zero slope (n=12)
# For each: coefficient table (Estimate/Std.Error/t/Pr), r2, adj.r2, sigma,
#   F (value+numdf+dendf+p), residual quantile type 7, logLik/AIC/BIC,
#   confint at 0.90/0.95/0.99 for both coefs, and predict.lm at two x0 with
#   interval="confidence" AND "prediction" at 0.95.
# Emits Scripts/tool-truth/linear-regression-calculator.json.
#   "/c/Program Files/R/R-4.6.0/bin/Rscript.exe" Scripts/tool-truth/linear-regression-calculator.R
suppressWarnings(suppressPackageStartupMessages({ library(jsonlite) }))
options(warn = -1)

emit <- function(id, x, y, x0s) {
  d <- data.frame(x = as.numeric(x), y = as.numeric(y))
  d <- d[complete.cases(d), ]
  fit <- lm(y ~ x, data = d)
  s   <- summary(fit)
  co  <- s$coefficients          # rows: (Intercept), x ; cols: Est, SE, t, Pr
  fst <- s$fstatistic            # value, numdf, dendf
  fp  <- as.numeric(pf(fst[1], fst[2], fst[3], lower.tail = FALSE))
  rq  <- as.numeric(quantile(residuals(fit)))   # type 7 default: 0/25/50/75/100%

  ci <- function(l) {
    m <- confint(fit, level = l)
    list(intercept = as.numeric(m[1, ]), slope = as.numeric(m[2, ]))
  }
  pr <- function(x0) {
    nd  <- data.frame(x = as.numeric(x0))
    cf  <- as.numeric(predict(fit, nd, interval = "confidence", level = 0.95))
    pf2 <- as.numeric(predict(fit, nd, interval = "prediction", level = 0.95))
    list(x0 = as.numeric(x0),
         conf = list(fit = cf[1],  lwr = cf[2],  upr = cf[3]),
         pred = list(fit = pf2[1], lwr = pf2[2], upr = pf2[3]))
  }

  list(
    id = id, x = as.numeric(d$x), y = as.numeric(d$y), n = nrow(d),
    coef = list(
      intercept = list(est = co[1, 1], se = co[1, 2], t = co[1, 3], p = co[1, 4]),
      slope     = list(est = co[2, 1], se = co[2, 2], t = co[2, 3], p = co[2, 4])),
    r2 = s$r.squared, adjr2 = s$adj.r.squared, sigma = s$sigma,
    fstat = as.numeric(fst[1]), fdf1 = as.numeric(fst[2]), fdf2 = as.numeric(fst[3]), fp = fp,
    residq = list(min = rq[1], q1 = rq[2], median = rq[3], q3 = rq[4], max = rq[5]),
    logLik = as.numeric(logLik(fit)), aic = AIC(fit), bic = BIC(fit),
    confint = list("0.9" = ci(0.90), "0.95" = ci(0.95), "0.99" = ci(0.99)),
    predict = lapply(x0s, pr)
  )
}

CASES <- list()

# A: mtcars mpg ~ wt (n = 32)
CASES[[1]] <- emit("A_mtcars_mpg_wt", mtcars$wt, mtcars$mpg, list(3, 5))

# B: clear positive slope, n = 10
B_x <- 1:10
B_y <- c(3.2, 5.1, 6.9, 9.3, 10.8, 13.2, 14.9, 17.1, 19.2, 20.8)
CASES[[2]] <- emit("B_positive", B_x, B_y, list(4, 8))

# C: negative slope, n = 8
C_x <- 1:8
C_y <- c(22, 19, 17, 14, 12, 9, 7, 4)
CASES[[3]] <- emit("C_negative", C_x, C_y, list(2.5, 6))

# D: tiny n = 3
D_x <- c(1, 2, 3)
D_y <- c(2.0, 3.5, 4.9)
CASES[[4]] <- emit("D_tiny_n3", D_x, D_y, list(1.5, 2.5))

# E: larger noise / near-zero slope, n = 12
E_x <- 1:12
E_y <- c(5, 7, 4, 8, 5, 9, 4, 7, 6, 5, 8, 6)
CASES[[5]] <- emit("E_nearzero", E_x, E_y, list(3, 9))

out <- "Scripts/tool-truth/linear-regression-calculator.json"
writeLines(toJSON(CASES, digits = NA, auto_unbox = TRUE, pretty = TRUE, na = "null"), out)
cat("wrote", length(CASES), "datasets to", out, "\n")
