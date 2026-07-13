# roc-auc truth table  ---  ground truth = pROC 1.19 on R 4.6.0
# Emits Scripts/tool-truth/roc-auc.json : frozen datasets + every displayed number.
suppressWarnings(suppressMessages({
  library(pROC)
  library(jsonlite)
}))
set.seed(1)

# ---------- helpers ----------------------------------------------------------
squash <- function(z) 1/(1+exp(-z))                     # logistic squash to (0,1)
rd <- function(x, d=10) if (is.null(x)) NULL else round(x, d)

# Build a fixed dataset {y, score} and freeze it.
mk_norm <- function(seed, npos, nneg, mu_pos, mu_neg, sd) {
  set.seed(seed)
  sp <- squash(rnorm(npos, mu_pos, sd))
  sn <- squash(rnorm(nneg, mu_neg, sd))
  list(y = c(rep(1, npos), rep(0, nneg)),
       score = round(c(sp, sn), 4))
}

datasets <- list()

# breast (default): well separated, ~AUC 0.9, n=60
datasets$breast <- mk_norm(42, 30, 30, 1.6, -0.2, 1)

# mtcars: REAL logistic vs ~ disp, fitted probabilities. Deterministic, authentic.
m <- glm(vs ~ disp, data = mtcars, family = binomial)
datasets$mtcars <- list(y = as.integer(mtcars$vs),
                        score = round(as.numeric(fitted(m)), 4))

# imbal: 1:9, n=200 (20 pos / 180 neg)
datasets$imbal <- mk_norm(13, 20, 180, 1.4, 0, 1)

# perfect: full separation (AUC=1), n=20
datasets$perfect <- list(y = c(rep(1,10), rep(0,10)),
                         score = c(round(seq(0.80,0.98,length.out=10),4),
                                   round(seq(0.02,0.20,length.out=10),4)))

# random: heavy overlap, ~AUC 0.55, n=80
datasets$random <- mk_norm(2, 40, 40, 0.2, 0, 1)

# tiny: small n edge case, n=8
datasets$tiny <- list(y = c(0,0,0,0,1,1,1,1),
                      score = c(0.10,0.30,0.40,0.50,0.40,0.60,0.70,0.90))

# ties: many identical scores
datasets$ties <- list(y = c(1,0,1,0,1,0,1,0,1,0),
                      score = c(0.5,0.5,0.5,0.5,0.7,0.3,0.7,0.3,0.9,0.1))

# ---------- pROC threshold grid replicated for F1/cost optima ----------------
# pROC thresholds (direction "<") = midpoints of consecutive unique scores + +-Inf.
proc_thresholds <- function(score) {
  u <- sort(unique(score))
  if (length(u) == 1) return(c(-Inf, Inf))
  mids <- (u[-1] + u[-length(u)]) / 2
  c(-Inf, mids, Inf)
}
# confusion counts at threshold t: predict positive iff score > t
counts_at <- function(y, score, t) {
  pred <- score > t
  TP <- sum(pred & y==1); FP <- sum(pred & y==0)
  FN <- sum(!pred & y==1); TN <- sum(!pred & y==0)
  c(TP=TP, FP=FP, FN=FN, TN=TN)
}
metrics_at <- function(y, score, t) {
  cc <- counts_at(y, score, t); TP<-cc["TP"];FP<-cc["FP"];FN<-cc["FN"];TN<-cc["TN"]
  npos <- TP+FN; nneg <- TN+FP; N <- TP+FP+FN+TN
  sens <- if (npos>0) TP/npos else 0
  spec <- if (nneg>0) TN/nneg else 0
  ppv  <- if ((TP+FP)>0) TP/(TP+FP) else NaN
  npv  <- if ((TN+FN)>0) TN/(TN+FN) else NaN
  acc  <- (TP+TN)/N
  f1   <- if ((2*TP+FP+FN)>0) 2*TP/(2*TP+FP+FN) else 0
  list(TP=unname(TP),FP=unname(FP),FN=unname(FN),TN=unname(TN),
       sens=unname(sens),spec=unname(spec),ppv=unname(ppv),npv=unname(npv),
       acc=unname(acc),f1=unname(f1))
}

# best threshold by a scoring function over the grid (first argmax, like JS >)
best_over_grid <- function(y, score, scorer, maximize=TRUE) {
  ts <- proc_thresholds(score)
  best_t <- NA; best_v <- if (maximize) -Inf else Inf; best_m <- NULL
  for (t in ts) {
    m <- metrics_at(y, score, t)
    v <- scorer(m, t)
    if ((maximize && v > best_v) || (!maximize && v < best_v)) {
      best_v <- v; best_t <- t; best_m <- m
    }
  }
  list(threshold=best_t, value=best_v, m=best_m)
}

# calibration: stable sort by (score, index), contiguous B bins
calib_bins <- function(y, score, B=10) {
  n <- length(y)
  ord <- order(score, seq_len(n))          # stable: score asc, then original index
  bins <- list()
  for (b in 0:(B-1)) {
    lo <- floor(b*n/B)+1; hi <- floor((b+1)*n/B)
    if (lo > hi) next
    idx <- ord[lo:hi]
    bins[[length(bins)+1]] <- list(
      n = hi-lo+1,
      mean_score = mean(score[idx]),
      mean_y = mean(y[idx])
    )
  }
  bins
}

# ---------- per-dataset truth --------------------------------------------------
one_case <- function(id, ds) {
  y <- ds$y; score <- ds$score
  r <- roc(response=y, predictor=score, direction="<", levels=c(0,1), quiet=TRUE)
  auc <- as.numeric(auc(r))
  v   <- as.numeric(var(r))                 # DeLong variance
  se  <- sqrt(v)
  ci95 <- as.numeric(ci.auc(r, method="delong", conf.level=0.95))[c(1,3)]
  ci90 <- as.numeric(ci.auc(r, method="delong", conf.level=0.90))[c(1,3)]
  ci99 <- as.numeric(ci.auc(r, method="delong", conf.level=0.99))[c(1,3)]

  # linear vs logit CI comparison (settle the v2 fix)
  z <- qnorm(0.975)
  lin <- pmin(pmax(auc + c(-1,1)*z*se, 0), 1)
  eta <- log(auc/(1-auc)); seEta <- se/(auc*(1-auc))
  logit <- squash(eta + c(-1,1)*z*seEta)

  # Youden via pROC coords (best), plus our grid replication
  yb <- tryCatch(coords(r, "best", best.method="youden",
                        ret=c("threshold","sensitivity","specificity"),
                        transpose=FALSE), error=function(e) NULL)
  youden_grid <- best_over_grid(y, score, function(m,t) m$sens + m$spec - 1)
  f1_grid     <- best_over_grid(y, score, function(m,t) m$f1)
  cost1_grid  <- best_over_grid(y, score, function(m,t) m$FP + 1*m$FN, maximize=FALSE)
  cost5_grid  <- best_over_grid(y, score, function(m,t) m$FP + 5*m$FN, maximize=FALSE)

  # confusion matrix at the Youden threshold (grid)
  at_y <- metrics_at(y, score, youden_grid$threshold)

  # cross-check a specific interior threshold against pROC coords
  t_probe <- proc_thresholds(score)[2]      # first finite midpoint
  probe_proc <- tryCatch(coords(r, x=t_probe, input="threshold",
                        ret=c("tp","fp","fn","tn","sensitivity","specificity","ppv","npv","accuracy"),
                        transpose=FALSE), error=function(e) NULL)
  probe_mine <- metrics_at(y, score, t_probe)

  brier <- mean((score - y)^2)

  list(
    id=id, n_pos=sum(y==1), n_neg=sum(y==0),
    auc=rd(auc), var=rd(v), se=rd(se),
    ci95=rd(ci95), ci90=rd(ci90), ci99=rd(ci99),
    ci_linear=rd(lin), ci_logit=rd(logit),
    proc_best_youden = if (!is.null(yb)) list(threshold=rd(unname(yb$threshold[1])),
                                              sens=rd(unname(yb$sensitivity[1])),
                                              spec=rd(unname(yb$specificity[1]))) else NULL,
    youden=list(threshold=rd(youden_grid$threshold), J=rd(youden_grid$value),
                sens=rd(youden_grid$m$sens), spec=rd(youden_grid$m$spec)),
    f1=list(threshold=rd(f1_grid$threshold), F1=rd(f1_grid$value),
            prec=rd(f1_grid$m$ppv), rec=rd(f1_grid$m$sens)),
    cost1=list(threshold=rd(cost1_grid$threshold), cost=rd(cost1_grid$value)),
    cost5=list(threshold=rd(cost5_grid$threshold), cost=rd(cost5_grid$value)),
    at_youden=lapply(at_y, rd),
    probe_threshold=rd(t_probe),
    probe_mine=lapply(probe_mine, rd),
    probe_proc = if (!is.null(probe_proc)) as.list(lapply(probe_proc, function(z) rd(unname(z[1])))) else NULL,
    brier=rd(brier),
    calib=lapply(calib_bins(y, score, 10), function(b) list(n=b$n, mean_score=rd(b$mean_score), mean_y=rd(b$mean_y)))
  )
}

cases <- lapply(names(datasets), function(id) one_case(id, datasets[[id]]))
names(cases) <- names(datasets)

# freeze datasets for the JSON (and for embedding in the page + node harness)
ds_out <- lapply(datasets, function(d) list(y=d$y, score=d$score))

out <- list(datasets=ds_out, cases=cases,
            meta=list(R=R.version.string, pROC=as.character(packageVersion("pROC"))))
writeLines(toJSON(out, auto_unbox=TRUE, digits=10, null="null", na="null"),
           "Scripts/tool-truth/roc-auc.json")

# quick console readout of the CI-scale decision
cat("\n== DeLong CI scale check (pROC ci95 vs linear vs logit) ==\n")
for (id in names(cases)) {
  c95 <- cases[[id]]$ci95; lin <- cases[[id]]$ci_linear; lg <- cases[[id]]$ci_logit
  cat(sprintf("%-8s pROC[%.4f,%.4f]  lin[%.4f,%.4f]  logit[%.4f,%.4f]\n",
              id, c95[1], c95[2], lin[1], lin[2], lg[1], lg[2]))
}
cat("\nWrote Scripts/tool-truth/roc-auc.json\n")
