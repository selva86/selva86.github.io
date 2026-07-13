# Ground truth for the correlation calculator (Tool Farm v2, W2.2).
# Every displayed number is verified against stats::cor.test() on R 4.6.0:
#   Pearson  -> cor.test(method="pearson"): r, t, df, p, Fisher-z CI (90/95/99)
#   Spearman -> cor.test(method="spearman"): rho, S, p (AS89 exact prho for
#              no-ties n<=1290; asymptotic t_{n-2} with ties/large-n)
#   Kendall  -> cor.test(method="kendall"): tau-b, T (exact pkendall, no-ties
#              n<50) or z (normal approx with tie correction otherwise)
# Emits Scripts/tool-truth/correlation-calculator.json.
suppressWarnings(suppressPackageStartupMessages({ library(jsonlite) }))
options(warn = -1)

CASES <- list()
# Encode non-finite doubles as strings so JSON round-trips them for the harness
# ("Inf" for a perfect r's t/S bound, "-Inf" for an open one-sided CI side).
enc <- function(v) {
  if (length(v) != 1 || is.na(v)) return(NA)
  if (is.infinite(v)) return(if (v > 0) "Inf" else "-Inf")
  if (is.nan(v)) return("NaN")
  v
}
add <- function(id, x, y, method, alternative, conf = 0.95) {
  ct <- tryCatch(
    suppressWarnings(cor.test(x, y, alternative = alternative,
                              method = method, conf.level = conf)),
    error = function(e) NULL)
  ok <- complete.cases(x, y)
  n  <- sum(ok)
  rec <- list(
    id = id, method = method, alternative = alternative, conf = conf,
    x = x, y = y, n = n)
  if (is.null(ct)) {
    rec$error <- TRUE
  } else {
    rec$error     <- FALSE
    rec$estimate  <- enc(as.numeric(ct$estimate))
    rec$statistic <- enc(as.numeric(ct$statistic))
    rec$stat_name <- names(ct$statistic)
    rec$p         <- enc(as.numeric(ct$p.value))
    rec$df        <- if (!is.null(ct$parameter)) as.numeric(ct$parameter) else NA
    if (!is.null(ct$conf.int)) {
      rec$ci_lo <- enc(as.numeric(ct$conf.int[1]))
      rec$ci_hi <- enc(as.numeric(ct$conf.int[2]))
    } else { rec$ci_lo <- NA; rec$ci_hi <- NA }
  }
  CASES[[length(CASES) + 1]] <<- rec
}

# ---- datasets ---------------------------------------------------------------
DS <- list()
DS$basic     <- list(x = c(1,2,3,4,5,6,7,8,9,10),
                     y = c(2.1,3.9,6.2,7.8,11.1,11.9,14.2,15.8,18.3,19.9))
DS$moderate  <- list(x = c(12,15,9,14,7,18,11,13,8,16,10,17),
                     y = c(20,24,17,22,14,29,19,23,15,27,18,28))
DS$negative  <- list(x = c(1,2,3,4,5,6,7,8,9,10),
                     y = c(20,17,19,14,15,12,10,8,7,3))
DS$n3        <- list(x = c(1,2,3), y = c(2,1,3))
DS$n4        <- list(x = c(4,1,3,2), y = c(9,2,7,4))
DS$perfpos   <- list(x = c(1,2,3,4,5,6,7,8), y = c(3,5,7,9,11,13,15,17))
DS$perfneg   <- list(x = c(1,2,3,4,5,6,7,8), y = c(8,7,6,5,4,3,2,1))
DS$monotone  <- list(x = c(1,2,3,4,5,6,7),  y = c(1,8,27,64,125,216,343)) # y=x^3: Sp/Ke=1, Pe<1
DS$nearzero  <- list(x = c(1,2,3,4,5,6,7,8,9,10),
                     y = c(5,7,4,8,5,9,4,7,6,5))
DS$curve     <- list(x = c(1,2,3,4,5,6,7,8,9),
                     y = c(16,9,4,1,0,1,4,9,16)) # y=(x-5)^2 parabola, Pearson r=0
DS$tiesx     <- list(x = c(1,1,2,2,3,3,4,4,5,5),
                     y = c(2,3,3,5,4,6,7,6,8,9))
DS$tiesboth  <- list(x = c(1,1,2,2,2,3,3,4,4,4),
                     y = c(1,2,2,2,3,3,4,3,4,5))
DS$tiesheavy <- list(x = c(1,1,1,2,2,2,3,3,3,3),
                     y = c(1,1,2,2,2,3,3,3,4,4))
DS$outlier   <- list(x = c(1,2,3,4,5,6,7,8,9,20),
                     y = c(2,1,4,3,6,5,8,7,10,40))
DS$na1       <- list(x = c(1,2,NA,4,5,6,NA,8,9,10),
                     y = c(2,4,6,NA,10,12,14,16,NA,20))
DS$na2       <- list(x = c(NA,2,3,4,5,6,7,8,9,10,11,12),
                     y = c(1,3,NA,4,6,5,9,8,11,10,NA,13))
DS$mid15     <- list(x = c(3,7,1,9,5,11,2,8,4,13,6,15,10,14,12),
                     y = c(5,9,2,12,7,14,4,10,6,15,8,20,13,18,17))
DS$mid20     <- list(x = 1:20,
                     y = c(2,1,4,3,6,5,8,7,11,9,10,13,12,15,14,17,16,19,18,21))
DS$big60     <- list(x = 1:60,
                     y = c((1:60) * 0.9 + rep(c(2,-2,1,-1,3,-3,0,1,-1,2), 6)))
DS$bigties   <- list(x = rep(1:12, 5),
                     y = as.numeric(rep(1:12, 5) + rep(c(0,1,-1,2,-2), each = 12)))
DS$exact40   <- list(x = c(37,3,19,45,11,28,6,50,14,33,1,41,22,8,47,17,30,4,39,25,
                           13,48,9,35,20,2,44,16,31,7,42,23,10,38,26,5,49,18,32,15),
                     y = c(35,5,20,44,10,30,8,48,15,32,3,40,24,6,45,19,29,2,38,27,
                           12,47,11,34,22,4,43,17,33,9,41,21,13,36,25,7,50,16,31,14))

for (nm in names(DS)) {
  x <- as.numeric(DS[[nm]]$x); y <- as.numeric(DS[[nm]]$y)
  for (m in c("pearson", "spearman", "kendall")) {
    if (m == "pearson" && sum(complete.cases(x, y)) < 3) next
    for (alt in c("two.sided", "greater", "less")) {
      add(paste0(nm, "_", m, "_", substr(alt, 1, 1)), x, y, m, alt, 0.95)
    }
  }
}
# Pearson CI at 90 / 99 on a spread of datasets
for (nm in c("basic", "moderate", "negative", "outlier", "mid15", "big60", "na1")) {
  x <- as.numeric(DS[[nm]]$x); y <- as.numeric(DS[[nm]]$y)
  add(paste0(nm, "_pearson_ci90"), x, y, "pearson", "two.sided", 0.90)
  add(paste0(nm, "_pearson_ci99"), x, y, "pearson", "two.sided", 0.99)
}

writeLines(toJSON(CASES, auto_unbox = TRUE, digits = 15, na = "null", null = "null"),
           "Scripts/tool-truth/correlation-calculator.json")
cat("wrote", length(CASES), "cases\n")
