# nonparametric truth table  ---  ground truth = R 4.6.0 stats + effectsize
# Emits Scripts/tool-truth/nonparametric.json: for every case, the exact number
# R produces for the statistic, p-value, HL estimate + CI, and effect size.
#
# Tool decision rule (classic, so the emitted R with pinned exact=/correct=
# reproduces the displayed value):
#   MWU exact  : n.x<50 && n.y<50 && no ties   -> wilcox.test(exact=TRUE)
#   signed exact: n<50 && no ties && no zeros   -> wilcox.test(exact=TRUE)
#   else        : normal approximation          -> wilcox.test(exact=FALSE, correct=)
#   KW          : chi-square with tie correction (always)
#   sign        : exact binom.test (always)
suppressWarnings(suppressMessages({ library(jsonlite); library(effectsize) }))

`%||%` <- function(a,b) if (is.null(a)) b else a
fnum <- function(v) {                       # keep Inf as string for JSON
  if (is.null(v) || length(v)==0) return(NA)
  if (is.infinite(v)) return(if (v>0) "Inf" else "-Inf")
  v
}

has_ties_two <- function(x,y){ r<-rank(c(x,y)); length(r)!=length(unique(r)) }
has_ties_one <- function(d){ dn<-d[d!=0]; r<-rank(abs(dn)); length(r)!=length(unique(r)) }

cases <- list()
add <- function(...) cases[[length(cases)+1]] <<- list(...)

# ---- MANN-WHITNEY U (two independent groups) --------------------------------
run_mwu <- function(id, x, y, alt="two.sided", alpha=0.05, correct=TRUE, note=""){
  ties <- has_ties_two(x,y)
  useExact <- (length(x)<50 && length(y)<50 && !ties)
  cl <- 1-alpha
  ht <- if (useExact)
          wilcox.test(x,y,alternative=alt,exact=TRUE,correct=FALSE,conf.int=TRUE,conf.level=cl)
        else
          wilcox.test(x,y,alternative=alt,exact=FALSE,correct=correct,conf.int=TRUE,conf.level=cl)
  W  <- unname(ht$statistic)
  nx <- length(x); ny <- length(y)
  rb_formula <- 2*W/(nx*ny) - 1
  rb_es <- tryCatch(unname(effectsize::rank_biserial(x,y,ci=NULL)[[1]]), error=function(e) NA)
  add(id=id, mode="mwu", note=note, x=x, y=y, alt=alt, alpha=alpha, correct=correct,
      exact=useExact, ties=ties, statistic=W, p_value=ht$p.value,
      hl=unname(ht$estimate), ci_lo=fnum(ht$conf.int[1]), ci_hi=fnum(ht$conf.int[2]),
      rb=rb_formula, rb_es=rb_es)
}

# ---- WILCOXON SIGNED-RANK (paired or one-sample) ----------------------------
run_signed <- function(id, x, y=NULL, mu=0, alt="two.sided", alpha=0.05, correct=TRUE, note="", paired=!is.null(y)){
  d <- if (paired) x - y else x - mu
  zeros <- any(d==0); ties <- has_ties_one(d)
  useExact <- (length(d)<50 && !ties && !zeros)
  cl <- 1-alpha
  ht <- if (paired) {
          if (useExact) wilcox.test(x,y,paired=TRUE,alternative=alt,exact=TRUE,correct=FALSE,conf.int=TRUE,conf.level=cl)
          else          wilcox.test(x,y,paired=TRUE,alternative=alt,exact=FALSE,correct=correct,conf.int=TRUE,conf.level=cl)
        } else {
          if (useExact) wilcox.test(x,mu=mu,alternative=alt,exact=TRUE,correct=FALSE,conf.int=TRUE,conf.level=cl)
          else          wilcox.test(x,mu=mu,alternative=alt,exact=FALSE,correct=correct,conf.int=TRUE,conf.level=cl)
        }
  V <- unname(ht$statistic)
  n <- length(d[d!=0]); S <- n*(n+1)/2
  rb_formula <- 2*V/S - 1
  rb_es <- tryCatch({
             if (paired) unname(effectsize::rank_biserial(x,y,paired=TRUE,ci=NULL)[[1]])
             else        unname(effectsize::rank_biserial(x,mu=mu,ci=NULL)[[1]])
           }, error=function(e) NA)
  add(id=id, mode="signed", note=note, x=x, y=(if(paired) y else NULL), mu=mu, paired=paired,
      alt=alt, alpha=alpha, correct=correct, exact=useExact, ties=ties, zeros=zeros,
      statistic=V, p_value=ht$p.value, hl=unname(ht$estimate),
      ci_lo=fnum(ht$conf.int[1]), ci_hi=fnum(ht$conf.int[2]), rb=rb_formula, rb_es=rb_es)
}

# ---- KRUSKAL-WALLIS ---------------------------------------------------------
run_kw <- function(id, groups, alpha=0.05, note=""){
  ht <- kruskal.test(groups)
  H <- unname(ht$statistic); k <- length(groups); n <- sum(lengths(groups))
  eps2_formula <- H*(n+1)/(n^2-1)
  eta2_formula <- (H - k + 1)/(n - k)
  x <- unlist(groups); g <- factor(rep(seq_len(k), lengths(groups)))
  eps2_es <- tryCatch(unname(effectsize::rank_epsilon_squared(x,g,ci=NULL)[[1]]), error=function(e) NA)
  add(id=id, mode="kw", note=note, groups=groups, alpha=alpha,
      statistic=H, df=k-1, p_value=ht$p.value, eps2=eps2_formula, eta2=eta2_formula, eps2_es=eps2_es)
}

# ---- SIGN TEST (direction only) ---------------------------------------------
run_sign <- function(id, x, y=NULL, mu=0, alt="two.sided", alpha=0.05, note="", paired=!is.null(y)){
  d <- if (paired) x - y else x - mu
  splus <- sum(d>0); sminus <- sum(d<0); n <- splus + sminus
  ht <- binom.test(splus, n, 0.5, alternative=alt, conf.level=1-alpha)
  add(id=id, mode="sign", note=note, x=x, y=(if(paired) y else NULL), mu=mu, paired=paired,
      alt=alt, alpha=alpha, splus=splus, sminus=sminus, n=n,
      statistic=splus, p_value=ht$p.value, prop=unname(ht$estimate),
      ci_lo=fnum(ht$conf.int[1]), ci_hi=fnum(ht$conf.int[2]))
}

# ============================ CASES ==========================================
# MWU
run_mwu("mwu_exact_2s", c(21,18,25,30,27), c(15,12,19,22,17), note="small, no ties, exact")
run_mwu("mwu_exact_greater", c(21,18,25,30,27), c(15,12,19,22,17), alt="greater", note="one-sided")
run_mwu("mwu_exact_less", c(21,18,25,30,27), c(15,12,19,22,17), alt="less", note="one-sided")
run_mwu("mwu_exact_a10", c(21,18,25,30,27), c(15,12,19,22,17), alpha=0.10, note="90% CI")
run_mwu("mwu_exact_a01", c(21,18,25,30,27), c(15,12,19,22,17), alpha=0.01, note="99% CI")
run_mwu("mwu_ties_cc", c(4,5,3,5,4,2,5), c(2,3,1,3,2,4,1), note="ties -> approx +cc")
run_mwu("mwu_ties_nocc", c(4,5,3,5,4,2,5), c(2,3,1,3,2,4,1), correct=FALSE, note="ties -> approx no cc")
run_mwu("mwu_ordinal", c(4,5,3,5,4,2,5,3,4,5), c(2,3,1,3,2,4,1,2,3,2), note="Likert 1-5")
run_mwu("mwu_equal", c(10,20,30,40,50), c(10,20,30,40,50), note="identical groups")
run_mwu("mwu_sep", c(50,55,60,65), c(1,2,3,4), note="complete separation")
run_mwu("mwu_unequal_n", c(12,15,9,11,14,8,13), c(20,18,25), note="unequal sizes exact")
run_mwu("mwu_large", round(qnorm(seq(0.05,0.95,length=55)),3), round(qnorm(seq(0.05,0.95,length=52))+0.6,3), note="n>=50 -> approx")

# SIGNED-RANK
run_signed("sr_exact_1s", c(0.7,1.3,-0.4,2.1,1.8,-0.9,2.6), mu=0, note="one-sample, distinct |d|, exact")
run_signed("sr_exact_1s_g", c(0.7,1.3,-0.4,2.1,1.8,-0.9,2.6), mu=0, alt="greater", note="exact one-sided")
run_signed("sr_exact_1s_a10", c(0.7,1.3,-0.4,2.1,1.8,-0.9,2.6), mu=0, alpha=0.10, note="exact 90% CI")
run_signed("sr_exact_2s", c(1.2,2.4,0.9,3.1,2.0,1.7,2.9,0.5), y=c(0.8,1.9,1.1,2.2,1.5,1.9,2.1,0.9), note="paired exact")
run_signed("sr_exact_greater", c(1.2,2.4,0.9,3.1,2.0,1.7,2.9,0.5), y=c(0.8,1.9,1.1,2.2,1.5,1.9,2.1,0.9), alt="greater")
run_signed("sr_onesample", c(5.1,4.8,6.2,5.5,4.9,6.0,5.3,5.8,4.7,6.1), mu=5.0, note="one-sample vs mu")
run_signed("sr_onesample_a10", c(5.1,4.8,6.2,5.5,4.9,6.0,5.3,5.8,4.7,6.1), mu=5.0, alpha=0.10)
run_signed("sr_ties", c(3,5,4,5,3,4,5,4), y=c(2,3,4,3,2,4,3,2), note="ties+zeros -> approx")
run_signed("sr_ties_nocc", c(3,5,4,5,3,4,5,4), y=c(2,3,4,3,2,4,3,2), correct=FALSE, note="approx no cc")
run_signed("sr_zeros", c(4,6,5,7,3,6,5,8), y=c(4,5,5,6,4,6,4,7), note="some zeros dropped")
run_signed("sr_large", round(qnorm(seq(0.02,0.98,length=52))+0.4,3), mu=0, note="n>=50 -> approx")

# KRUSKAL-WALLIS
run_kw("kw_3grp", list(c(21,18,25,30,27), c(15,12,19,22,17), c(9,14,11,16,13)), note="3 groups no ties")
run_kw("kw_ties", list(c(4,5,3,5), c(2,3,1,3,2), c(5,4,5,4,3)), note="ties tie-correction")
run_kw("kw_4grp", list(c(10,12,11), c(20,22,21,19), c(30,28,31), c(15,17,16,14)), note="4 groups unequal")
run_kw("kw_equal", list(c(5,10,15), c(5,10,15), c(5,10,15)), note="identical -> H~0")

# SIGN TEST
run_sign("sign_2s", c(1.2,2.4,0.9,3.1,2.0,1.7,2.9,0.5,3.3,1.1), y=c(0.8,1.9,1.1,2.2,1.5,1.9,2.1,0.9,2.0,1.4), note="paired")
run_sign("sign_greater", c(1.2,2.4,0.9,3.1,2.0,1.7,2.9,0.5,3.3,1.1), y=c(0.8,1.9,1.1,2.2,1.5,1.9,2.1,0.9,2.0,1.4), alt="greater")
run_sign("sign_onesample", c(6,7,5,8,6,7,9,5,8,6,7,4), mu=5.5, note="one-sample")
run_sign("sign_allpos", c(3,4,5,6,7), mu=0, note="x=n boundary")
run_sign("sign_a10", c(6,7,5,8,6,7,9,5,8,6,7,4), mu=5.5, alpha=0.10)

# ============================ EMIT ===========================================
out <- list(generated_by="nonparametric.R (R 4.6.0)", n_cases=length(cases), cases=cases)
writeLines(toJSON(out, auto_unbox=TRUE, digits=NA, null="null", na="null"),
           "Scripts/tool-truth/nonparametric.json")
cat("wrote", length(cases), "cases\n")

# cross-check effect-size formulas vs effectsize package
mwu  <- Filter(function(c) c$mode=="mwu", cases)
sgn  <- Filter(function(c) c$mode=="signed", cases)
kw   <- Filter(function(c) c$mode=="kw", cases)
maxd <- function(lst, a, b) max(abs(sapply(lst, function(c) (c[[a]]%||%NA)-(c[[b]]%||%NA))), na.rm=TRUE)
cat(sprintf("rank-biserial (MWU)   formula vs effectsize max|diff| = %.3e\n", maxd(mwu,"rb","rb_es")))
cat(sprintf("rank-biserial (signed) formula vs effectsize max|diff| = %.3e\n", maxd(sgn,"rb","rb_es")))
cat(sprintf("epsilon^2 (KW)        formula vs effectsize max|diff| = %.3e\n", maxd(kw,"eps2","eps2_es")))
