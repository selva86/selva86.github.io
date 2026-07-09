# confusion-matrix-interpreter.R  --  R truth table for the v2 tool.
# Ground truth: caret::confusionMatrix() (+ e1071). R 4.6.0.
# Emits Scripts/tool-truth/confusion-matrix-interpreter.json
# Convention: matrices are Prediction (rows) x Reference (cols), caret's print layout.

suppressWarnings(suppressMessages(library(caret)))

j_num <- function(x){
  if (is.null(x) || length(x) == 0) return("null")
  if (is.na(x)) return("null")
  if (!is.finite(x)) return(if (x > 0) "1e400" else "-1e400")  # placeholder; handled JS-side
  formatC(x, format = "e", digits = 12)
}
j_str <- function(s) paste0('"', gsub('"', '\\\\"', s), '"')
kv <- function(k, v) paste0(j_str(k), ":", v)
obj <- function(...) paste0("{", paste(c(...), collapse=","), "}")
arr <- function(v) paste0("[", paste(v, collapse=","), "]")

# ---- binary case -----------------------------------------------------------
binary_case <- function(name, TP, FP, FN, TN, conf_levels = c(0.80,0.90,0.95,0.99)){
  # caret table: rows Prediction (neg,pos), cols Reference (neg,pos)
  tab <- as.table(matrix(c(TN, FN, FP, TP), nrow = 2, byrow = TRUE,
                         dimnames = list(Prediction = c("neg","pos"),
                                         Reference  = c("neg","pos"))))
  cm <- confusionMatrix(tab, positive = "pos", mode = "everything")
  ov <- cm$overall; bc <- cm$byClass
  N  <- TP+FP+FN+TN
  correct <- TP+TN
  # accuracy CIs at each level via exact binom.test (caret does this at 0.95)
  cis <- lapply(conf_levels, function(cl){
    ci <- binom.test(correct, N, conf.level = cl)$conf.int
    obj(kv("level", j_num(cl)), kv("lower", j_num(ci[1])), kv("upper", j_num(ci[2])))
  })
  # extra hand metrics
  sens <- if ((TP+FN)>0) TP/(TP+FN) else NA
  spec <- if ((TN+FP)>0) TN/(TN+FP) else NA
  prec <- if ((TP+FP)>0) TP/(TP+FP) else NA
  npv  <- if ((TN+FN)>0) TN/(TN+FN) else NA
  fbeta <- function(b){ if (is.na(prec)||is.na(sens)||((b*b*prec)+sens)==0) return(NA); (1+b*b)*prec*sens/((b*b*prec)+sens) }
  mcc_den <- sqrt((TP+FP)*(TP+FN)*(TN+FP)*(TN+FN))
  mcc <- if (mcc_den>0) (TP*TN-FP*FN)/mcc_den else NA
  lrp <- if (!is.na(spec) && (1-spec)>0) sens/(1-spec) else NA
  lrm <- if (!is.na(spec) && spec>0) (1-sens)/spec else NA
  obj(
    kv("name", j_str(name)),
    kv("kind", j_str("binary")),
    kv("TP", j_num(TP)), kv("FP", j_num(FP)), kv("FN", j_num(FN)), kv("TN", j_num(TN)),
    kv("N", j_num(N)),
    kv("accuracy", j_num(unname(ov["Accuracy"]))),
    kv("accLower95", j_num(unname(ov["AccuracyLower"]))),
    kv("accUpper95", j_num(unname(ov["AccuracyUpper"]))),
    kv("cis", arr(unlist(cis))),
    kv("nir", j_num(unname(ov["AccuracyNull"]))),
    kv("accPValue", j_num(unname(ov["AccuracyPValue"]))),
    kv("mcnemarP", j_num(unname(ov["McnemarPValue"]))),
    kv("kappa", j_num(unname(ov["Kappa"]))),
    kv("sensitivity", j_num(unname(bc["Sensitivity"]))),
    kv("specificity", j_num(unname(bc["Specificity"]))),
    kv("ppv", j_num(unname(bc["Pos Pred Value"]))),
    kv("npv", j_num(unname(bc["Neg Pred Value"]))),
    kv("precision", j_num(unname(bc["Precision"]))),
    kv("recall", j_num(unname(bc["Recall"]))),
    kv("f1", j_num(unname(bc["F1"]))),
    kv("prevalence", j_num(unname(bc["Prevalence"]))),
    kv("detectionRate", j_num(unname(bc["Detection Rate"]))),
    kv("detectionPrevalence", j_num(unname(bc["Detection Prevalence"]))),
    kv("balancedAccuracy", j_num(unname(bc["Balanced Accuracy"]))),
    # hand-computed extras (verify PPV/NPV reduce to naive)
    kv("ppvNaive", j_num(prec)), kv("npvNaive", j_num(npv)),
    kv("f0_5", j_num(fbeta(0.5))), kv("f2", j_num(fbeta(2))),
    kv("mcc", j_num(mcc)), kv("lrPlus", j_num(lrp)), kv("lrMinus", j_num(lrm))
  )
}

# ---- multi case ------------------------------------------------------------
multi_case <- function(name, M, labels, conf_levels = c(0.80,0.90,0.95,0.99)){
  k <- nrow(M)
  tab <- as.table(matrix(as.integer(M), nrow = k, byrow = FALSE,
                         dimnames = list(Prediction = labels, Reference = labels)))
  # rebuild with byrow to match M[pred,ref] exactly
  tab <- as.table(matrix(0L, k, k, dimnames = list(Prediction = labels, Reference = labels)))
  for (i in 1:k) for (jj in 1:k) tab[i, jj] <- as.integer(M[i, jj])
  cm <- confusionMatrix(tab, mode = "everything")
  ov <- cm$overall; bc <- cm$byClass
  N <- sum(M); correct <- sum(diag(M))
  cis <- lapply(conf_levels, function(cl){
    ci <- binom.test(correct, N, conf.level = cl)$conf.int
    obj(kv("level", j_num(cl)), kv("lower", j_num(ci[1])), kv("upper", j_num(ci[2])))
  })
  coln <- function(cn) sapply(1:k, function(i) unname(bc[i, cn]))
  supp <- colSums(M)  # reference (actual) counts per class = support
  wmean <- function(v){ ok <- is.finite(v); if (!any(ok)) return(NA); sum(v[ok]*supp[ok])/sum(supp[ok]) }
  mmean <- function(v){ ok <- is.finite(v); if (!any(ok)) return(NA); mean(v[ok]) }
  prec <- coln("Precision"); rec <- coln("Recall"); f1 <- coln("F1"); sens <- coln("Sensitivity")
  # Gorodkin multiclass MCC
  tk <- colSums(M); pk <- rowSums(M)
  num <- sum(sapply(1:k, function(i) N*M[i,i] - pk[i]*tk[i]))
  den_t <- sum(tk*(N-tk)); den_p <- sum(pk*(N-pk))
  mccM <- if (den_t>0 && den_p>0) num/sqrt(den_t*den_p) else NA
  perclass <- sapply(1:k, function(i) obj(
    kv("label", j_str(labels[i])),
    kv("sensitivity", j_num(unname(bc[i,"Sensitivity"]))),
    kv("specificity", j_num(unname(bc[i,"Specificity"]))),
    kv("precision", j_num(unname(bc[i,"Precision"]))),
    kv("recall", j_num(unname(bc[i,"Recall"]))),
    kv("f1", j_num(unname(bc[i,"F1"]))),
    kv("balancedAccuracy", j_num(unname(bc[i,"Balanced Accuracy"]))),
    kv("support", j_num(supp[i]))
  ))
  obj(
    kv("name", j_str(name)), kv("kind", j_str("multi")), kv("k", j_num(k)),
    kv("labels", arr(sapply(labels, j_str))),
    kv("matrix", arr(sapply(1:k, function(i) arr(sapply(1:k, function(jj) j_num(M[i,jj])))))),
    kv("N", j_num(N)),
    kv("accuracy", j_num(unname(ov["Accuracy"]))),
    kv("accLower95", j_num(unname(ov["AccuracyLower"]))),
    kv("accUpper95", j_num(unname(ov["AccuracyUpper"]))),
    kv("cis", arr(unlist(cis))),
    kv("nir", j_num(unname(ov["AccuracyNull"]))),
    kv("accPValue", j_num(unname(ov["AccuracyPValue"]))),
    kv("mcnemarP", j_num(unname(ov["McnemarPValue"]))),
    kv("kappa", j_num(unname(ov["Kappa"]))),
    kv("macroPrecision", j_num(mmean(prec))), kv("macroRecall", j_num(mmean(rec))), kv("macroF1", j_num(mmean(f1))),
    kv("weightedPrecision", j_num(wmean(prec))), kv("weightedRecall", j_num(wmean(rec))), kv("weightedF1", j_num(wmean(f1))),
    kv("balancedAccuracy", j_num(mmean(sens))),
    kv("mcc", j_num(mccM)),
    kv("perClass", arr(perclass))
  )
}

bins <- list(
  binary_case("spam",        85, 15, 20, 80),
  binary_case("screening",   90, 50, 10, 850),
  binary_case("fraud",       30, 20, 70, 9880),
  binary_case("perfect",     50,  0,  0, 50),
  binary_case("zeroTP",       0, 10, 40, 50),
  binary_case("allNegPred",   0,  0, 30, 70),
  binary_case("tiny",         3,  1,  1,  5),
  binary_case("rareOne",      1,  0,  0, 99),
  binary_case("random5050",  25, 25, 25, 25),
  binary_case("trivialNeg",   0,  0,  5, 95)
)

iris_m   <- matrix(c(50,0,0, 0,47,3, 0,5,45), nrow=3, byrow=TRUE)
digit_m  <- matrix(c(28,1,0,1, 2,25,2,1, 0,1,27,2, 1,0,3,26), nrow=4, byrow=TRUE)
imbal_m  <- matrix(c(80,5,2, 10,30,8, 3,6,40), nrow=3, byrow=TRUE)
perf3_m  <- matrix(c(20,0,0, 0,20,0, 0,0,20), nrow=3, byrow=TRUE)

muls <- list(
  multi_case("iris",  iris_m,  c("setosa","versicolor","virginica")),
  multi_case("digits",digit_m, c("0","1","2","3")),
  multi_case("imbal3",imbal_m, c("A","B","C")),
  multi_case("perfect3", perf3_m, c("A","B","C"))
)

out <- obj(kv("binary", arr(unlist(bins))), kv("multi", arr(unlist(muls))))
writeLines(out, "Scripts/tool-truth/confusion-matrix-interpreter.json")
cat("wrote", nchar(out), "bytes;", length(bins), "binary +", length(muls), "multi cases\n")
