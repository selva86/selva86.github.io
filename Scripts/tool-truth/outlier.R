# ============================================================
# outlier-detection truth table
# Ground truth = R 4.6.0:
#   Grubbs      -> outliers::grubbs.test (+ outliers:::qgrubbs for G_crit)
#   ESD/Rosner  -> EnvStats::rosnerTest  (+ rosnerTestLambda)
#   Hampel(MAD) -> stats::median / stats::mad (constant 1.4826)
#   Tukey IQR   -> grDevices::boxplot.stats (fivenum hinges)
# Run: Rscript outlier.R  -> outlier.json
# ============================================================
suppressMessages({library(jsonlite); library(outliers); library(EnvStats)})

cases <- list()
add <- function(fn, args, expect, note="") {
  cases[[length(cases)+1]] <<- list(fn=fn, args=args, expect=expect, note=note)
}

# sort a numeric vector for stable array comparison
sortv <- function(v) if (length(v)) sort(v) else numeric(0)

# ---- Grubbs (single outlier, two-sided is the tool default) ----
grubbs_case <- function(x, alpha) {
  n <- length(x)
  gt2 <- grubbs.test(x, type=10, two.sided=TRUE)   # two-sided p
  gt1 <- grubbs.test(x, type=10, two.sided=FALSE)  # one-sided p
  G  <- unname(gt2$statistic["G"])
  U  <- unname(gt2$statistic["U"])
  # extreme end: low if (max-mean) < (mean-min)
  low <- (x[which.max(x)] - mean(x)) < (mean(x) - x[which.min(x)])
  extreme <- if (low) min(x) else max(x)
  Gcrit <- unname(outliers:::qgrubbs(alpha, n, type=10, rev=FALSE))
  list(
    G=G, U=U,
    pOne=gt1$p.value, pTwo=gt2$p.value,
    Gcrit=Gcrit, low=low, extreme=extreme,
    isOut=as.logical(gt2$p.value < alpha)
  )
}

# ---- ESD / Rosner ----
esd_case <- function(x, k, alpha) {
  r <- rosnerTest(x, k=k, alpha=alpha, warn=FALSE)
  df <- r$all.stats
  rows <- lapply(seq_len(nrow(df)), function(i) list(
    i        = df$i[i],
    mean     = df$Mean.i[i],
    sd       = df$SD.i[i],
    value    = df$Value[i],
    obsNum   = df$Obs.Num[i],
    R        = df[["R.i+1"]][i],
    lambda   = df[["lambda.i+1"]][i],
    outlier  = as.logical(df$Outlier[i])
  ))
  list(nOut=r$n.outliers, stats=rows)
}

# ---- Hampel (MAD) ----
hampel_case <- function(x, k) {
  med <- median(x); MAD <- mad(x)   # constant 1.4826 default
  lo <- med - k*MAD; hi <- med + k*MAD
  flagged <- x[abs(x - med) > k*MAD]
  list(median=med, mad=MAD, lo=lo, hi=hi,
       flagged=sortv(flagged), nFlagged=length(flagged))
}

# ---- Tukey IQR (boxplot.stats / fivenum) ----
tukey_case <- function(x, coef) {
  fv <- fivenum(x)
  q1 <- fv[2]; q3 <- fv[4]; iqr <- q3 - q1
  lo <- q1 - coef*iqr; hi <- q3 + coef*iqr
  out <- boxplot.stats(x, coef=coef)$out
  list(five=fv, q1=q1, q3=q3, iqr=iqr, lo=lo, hi=hi,
       flagged=sortv(out), nFlagged=length(out))
}

# ============================================================
# data vectors (deterministic)
# ============================================================
D <- list(
  classic   = c(2,3,4,5,6,7,8,9,10,40),
  clean10   = c(1,2,3,4,5,6,7,8,9,10),
  tiny3     = c(1,2,100),
  lowside   = c(-50,1,2,3,4,5),
  bothtails = c(-30,1,2,3,4,5,40),
  ties15    = c(10,12,12,13,12,11,12,60,12,11,13,12,11,50,12),
  decimals8 = c(2.1,2.3,2.2,2.4,8.9,2.5,2.2,2.3),
  nearconst = c(5,5,5,5,5,5,5,5,5,20),
  evenmed   = c(1,2,3,4,5,6,7,8,9,100),
  qc20      = c(9.8,10.1,9.9,10.0,10.2,9.7,10.3,9.9,10.1,10.0,
                9.8,10.2,9.9,10.0,10.1,9.6,10.4,9.9,10.0,11.8),
  lognorm   = c(0.4,0.9,1.1,1.3,1.6,1.9,2.4,3.1,4.2,6.8,12.5,22.0),
  multi30   = c(11,12,10,13,9,12,11,14,10,13,12,11,55,10,12,
                13,9,11,12,-20,10,13,11,12,48,10,12,11,13,9)
)

# ---- Grubbs cases (alpha sweep) ----
for (nm in c("classic","clean10","tiny3","lowside","bothtails","decimals8",
             "nearconst","evenmed","qc20","lognorm")) {
  for (a in c(0.10, 0.05, 0.01)) {
    add("grubbs", list(data=D[[nm]], alpha=a),
        grubbs_case(D[[nm]], a), paste(nm,"grubbs a=",a))
  }
}

# ---- ESD cases (k + alpha) ----
esd_plan <- list(
  list(nm="classic",   k=3, a=0.05),
  list(nm="classic",   k=5, a=0.05),
  list(nm="bothtails", k=3, a=0.05),
  list(nm="ties15",    k=5, a=0.05),
  list(nm="ties15",    k=3, a=0.10),
  list(nm="multi30",   k=5, a=0.05),
  list(nm="multi30",   k=5, a=0.01),
  list(nm="clean10",   k=3, a=0.05),
  list(nm="lognorm",   k=4, a=0.05),
  list(nm="tiny3",     k=1, a=0.05),
  list(nm="qc20",      k=3, a=0.05)
)
for (p in esd_plan) {
  add("esd", list(data=D[[p$nm]], k=p$k, alpha=p$a),
      esd_case(D[[p$nm]], p$k, p$a), paste(p$nm,"esd k=",p$k,"a=",p$a))
}

# ---- Hampel cases (k multiplier) ----
for (nm in c("classic","clean10","lowside","bothtails","ties15",
             "decimals8","evenmed","qc20","lognorm","multi30")) {
  for (k in c(3, 2, 3.5)) {
    add("hampel", list(data=D[[nm]], k=k),
        hampel_case(D[[nm]], k), paste(nm,"hampel k=",k))
  }
}

# ---- Tukey cases (coef) ----
for (nm in c("classic","clean10","lowside","bothtails","ties15",
             "decimals8","evenmed","qc20","lognorm","multi30","tiny3")) {
  for (co in c(1.5, 3.0)) {
    add("tukey", list(data=D[[nm]], coef=co),
        tukey_case(D[[nm]], co), paste(nm,"tukey coef=",co))
  }
}

writeLines(toJSON(cases, auto_unbox=TRUE, digits=NA, pretty=TRUE), "outlier.json")
cat(sprintf("wrote outlier.json with %d cases\n", length(cases)))
