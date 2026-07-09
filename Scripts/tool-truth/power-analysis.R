# ============================================================
# power-analysis truth table - ground truth = the `pwr` package
# Run: Rscript power-analysis.R  -> power-analysis.json
# Covers all 8 designs x {solve power, n, effect, alpha} + edge cases.
# ============================================================
suppressMessages(library(pwr))
suppressMessages(library(jsonlite))

power_cases <- list()   # forward: given all params, R power
solve_cases  <- list()  # inverse: solve one of n/effect/alpha given power

addP <- function(design, params, power, note="") {
  power_cases[[length(power_cases)+1]] <<- c(list(design=design, power=power, note=note), params)
}
addS <- function(design, solve_for, params, answer, note="") {
  solve_cases[[length(solve_cases)+1]] <<- c(list(design=design, solve_for=solve_for, answer=answer, note=note), params)
}

# ------------------------------------------------------------
# helpers to pull power / solved value out of pwr objects
# ------------------------------------------------------------
tpow <- function(d,n,alpha,type,alt) pwr.t.test(n=n,d=d,sig.level=alpha,type=type,alternative=alt)$power
t2n  <- function(d,n1,n2,alpha,alt)  pwr.t2n.test(n1=n1,n2=n2,d=d,sig.level=alpha,alternative=alt)$power

# ============================================================
# ONE-SAMPLE t
# ============================================================
for (alt in c("two.sided","greater")) for (a in c(0.05,0.01,0.10)) for (d in c(0.2,0.5,0.8,1.2)) for (n in c(10,30,64)) {
  addP("oneT", list(effect=d,n=n,alpha=a,tail=ifelse(alt=="two.sided",2,1)),
       tpow(d,n,a,"one.sample",alt))
}
addP("oneT", list(effect=0.3,n=4,alpha=0.05,tail=2), tpow(0.3,4,0.05,"one.sample","two.sided"), "tiny n")
addP("oneT", list(effect=2.0,n=8,alpha=0.05,tail=2), tpow(2.0,8,0.05,"one.sample","two.sided"), "huge effect")
addS("oneT","n",     list(effect=0.5,alpha=0.05,power=0.80,tail=2), pwr.t.test(d=0.5,power=0.80,sig.level=0.05,type="one.sample",alternative="two.sided")$n)
addS("oneT","n",     list(effect=0.5,alpha=0.05,power=0.90,tail=1), pwr.t.test(d=0.5,power=0.90,sig.level=0.05,type="one.sample",alternative="greater")$n)
addS("oneT","effect",list(n=30,alpha=0.05,power=0.80,tail=2),       pwr.t.test(n=30,power=0.80,sig.level=0.05,type="one.sample",alternative="two.sided")$d)
addS("oneT","alpha", list(effect=0.5,n=30,power=0.80,tail=2),       pwr.t.test(n=30,d=0.5,power=0.80,sig.level=NULL,type="one.sample",alternative="two.sided")$sig.level)
addS("oneT","power", list(effect=0.5,n=30,alpha=0.05,tail=2),       pwr.t.test(n=30,d=0.5,sig.level=0.05,type="one.sample",alternative="two.sided")$power)

# ============================================================
# TWO-SAMPLE t (balanced) + allocation ratio (t2n)
# ============================================================
for (alt in c("two.sided","greater")) for (a in c(0.05,0.01)) for (d in c(0.2,0.5,0.8)) for (n in c(20,64,128)) {
  addP("twoT", list(effect=d,n=n,alpha=a,tail=ifelse(alt=="two.sided",2,1),ratio=1),
       tpow(d,n,a,"two.sample",alt))
}
# unequal allocation: n=per group1, ratio k -> n2 = n*k. Truth via pwr.t2n.test.
addP("twoT", list(effect=0.5,n=64,alpha=0.05,tail=2,ratio=2), t2n(0.5,64,128,0.05,"two.sided"), "ratio 2")
addP("twoT", list(effect=0.5,n=50,alpha=0.05,tail=2,ratio=1.5), t2n(0.5,50,75,0.05,"two.sided"), "ratio 1.5")
addP("twoT", list(effect=0.8,n=30,alpha=0.05,tail=1,ratio=3), t2n(0.8,30,90,0.05,"greater"), "ratio 3 one-sided")
addS("twoT","n",     list(effect=0.5,alpha=0.05,power=0.80,tail=2,ratio=1), pwr.t.test(d=0.5,power=0.80,sig.level=0.05,type="two.sample",alternative="two.sided")$n)
addS("twoT","n",     list(effect=0.3,alpha=0.05,power=0.90,tail=2,ratio=1), pwr.t.test(d=0.3,power=0.90,sig.level=0.05,type="two.sample",alternative="two.sided")$n)
addS("twoT","n",     list(effect=0.8,alpha=0.01,power=0.95,tail=1,ratio=1), pwr.t.test(d=0.8,power=0.95,sig.level=0.01,type="two.sample",alternative="greater")$n)
addS("twoT","effect",list(n=64,alpha=0.05,power=0.80,tail=2,ratio=1),       pwr.t.test(n=64,power=0.80,sig.level=0.05,type="two.sample",alternative="two.sided")$d)
addS("twoT","alpha", list(effect=0.5,n=64,power=0.80,tail=2,ratio=1),       pwr.t.test(n=64,d=0.5,power=0.80,sig.level=NULL,type="two.sample",alternative="two.sided")$sig.level)
addS("twoT","power", list(effect=0.5,n=64,alpha=0.05,tail=2,ratio=1),       pwr.t.test(n=64,d=0.5,sig.level=0.05,type="two.sample",alternative="two.sided")$power)

# ============================================================
# PAIRED t  (pwr type="paired": d here is d_z on the differences)
# In the tool, user enters raw d + within-pair r; d_z = d / sqrt(2(1-r)).
# Truth: feed pwr the d_z directly so the tool's conversion is validated.
# ============================================================
paired_dz <- function(d, r) d / sqrt(2*(1-r))
for (alt in c("two.sided","greater")) for (d in c(0.3,0.5,0.8)) for (r in c(0.3,0.5,0.7)) for (n in c(20,40)) {
  dz <- paired_dz(d,r)
  addP("paired", list(effect=d,rPaired=r,n=n,alpha=0.05,tail=ifelse(alt=="two.sided",2,1)),
       pwr.t.test(n=n,d=dz,sig.level=0.05,type="paired",alternative=alt)$power)
}
addS("paired","n",     list(effect=0.5,rPaired=0.5,alpha=0.05,power=0.80,tail=2),
     pwr.t.test(d=paired_dz(0.5,0.5),power=0.80,sig.level=0.05,type="paired",alternative="two.sided")$n)
addS("paired","power", list(effect=0.5,rPaired=0.7,n=20,alpha=0.05,tail=2),
     pwr.t.test(n=20,d=paired_dz(0.5,0.7),sig.level=0.05,type="paired",alternative="two.sided")$power)

# ============================================================
# ONE-PROPORTION  (pwr.p.test; h = ES.h(p1,p0))
# ============================================================
for (alt in c("two.sided","greater")) for (pr in list(c(0.5,0.6),c(0.3,0.5),c(0.7,0.9),c(0.05,0.15))) for (n in c(30,80)) {
  h <- abs(ES.h(pr[1], pr[2]))   # tool orients one-sided test to the effect direction (abs h)
  addP("oneProp", list(p1=pr[1],p0=pr[2],effect=h,n=n,alpha=0.05,tail=ifelse(alt=="two.sided",2,1)),
       pwr.p.test(h=h,n=n,sig.level=0.05,alternative=alt)$power)
}
addS("oneProp","n",    list(p1=0.6,p0=0.5,effect=ES.h(0.6,0.5),alpha=0.05,power=0.80,tail=2),
     pwr.p.test(h=ES.h(0.6,0.5),power=0.80,sig.level=0.05,alternative="two.sided")$n)
addS("oneProp","power",list(p1=0.9,p0=0.7,effect=ES.h(0.9,0.7),n=30,alpha=0.05,tail=2),
     pwr.p.test(h=ES.h(0.9,0.7),n=30,sig.level=0.05,alternative="two.sided")$power)

# ============================================================
# TWO-PROPORTION  (pwr.2p.test; h = ES.h(p1,p2), n per arm, ncp = h*sqrt(n/2))
# ============================================================
for (alt in c("two.sided","greater")) for (pr in list(c(0.10,0.15),c(0.5,0.6),c(0.20,0.35),c(0.02,0.08))) for (n in c(100,400,686)) {
  h <- abs(ES.h(pr[1], pr[2]))   # tool orients one-sided test to the effect direction (abs h)
  addP("twoProp", list(p1=pr[1],p2=pr[2],effect=h,n=n,alpha=0.05,tail=ifelse(alt=="two.sided",2,1)),
       pwr.2p.test(h=h,n=n,sig.level=0.05,alternative=alt)$power)
}
addS("twoProp","n",    list(p1=0.10,p2=0.15,effect=ES.h(0.10,0.15),alpha=0.05,power=0.80,tail=2),
     pwr.2p.test(h=ES.h(0.10,0.15),power=0.80,sig.level=0.05,alternative="two.sided")$n)
addS("twoProp","n",    list(p1=0.6,p2=0.5,effect=ES.h(0.6,0.5),alpha=0.05,power=0.90,tail=1),
     pwr.2p.test(h=ES.h(0.6,0.5),power=0.90,sig.level=0.05,alternative="greater")$n)
addS("twoProp","power",list(p1=0.10,p2=0.15,effect=ES.h(0.10,0.15),n=400,alpha=0.05,tail=2),
     pwr.2p.test(h=ES.h(0.10,0.15),n=400,sig.level=0.05,alternative="two.sided")$power)

# ============================================================
# ONE-WAY ANOVA  (pwr.anova.test; f, k groups, n per group)
# ============================================================
for (a in c(0.05,0.01)) for (f in c(0.10,0.25,0.40)) for (k in c(2,3,4,6)) for (n in c(15,45,90)) {
  addP("anova", list(effect=f,k=k,n=n,alpha=a),
       pwr.anova.test(k=k,n=n,f=f,sig.level=a)$power)
}
addP("anova", list(effect=0.25,k=8,n=10,alpha=0.05), pwr.anova.test(k=8,n=10,f=0.25,sig.level=0.05)$power, "k=8")
addS("anova","n",     list(effect=0.25,k=4,alpha=0.05,power=0.80), pwr.anova.test(k=4,f=0.25,power=0.80,sig.level=0.05)$n)
addS("anova","n",     list(effect=0.40,k=3,alpha=0.05,power=0.90), pwr.anova.test(k=3,f=0.40,power=0.90,sig.level=0.05)$n)
addS("anova","effect",list(k=4,n=45,alpha=0.05,power=0.80),        pwr.anova.test(k=4,n=45,power=0.80,sig.level=0.05)$f)
addS("anova","power", list(effect=0.25,k=4,n=45,alpha=0.05),       pwr.anova.test(k=4,n=45,f=0.25,sig.level=0.05)$power)

# ============================================================
# CORRELATION  (pwr.r.test; r, n)
# ============================================================
for (alt in c("two.sided","greater")) for (a in c(0.05,0.01)) for (r in c(0.1,0.3,0.5,0.7)) for (n in c(20,50,100)) {
  addP("correlation", list(effect=r,n=n,alpha=a,tail=ifelse(alt=="two.sided",2,1)),
       pwr.r.test(r=r,n=n,sig.level=a,alternative=alt)$power)
}
addP("correlation", list(effect=0.9,n=8,alpha=0.05,tail=2), pwr.r.test(r=0.9,n=8,sig.level=0.05,alternative="two.sided")$power, "high r tiny n")
addS("correlation","n",     list(effect=0.3,alpha=0.05,power=0.80,tail=2), pwr.r.test(r=0.3,power=0.80,sig.level=0.05,alternative="two.sided")$n)
addS("correlation","n",     list(effect=0.5,alpha=0.01,power=0.95,tail=1), pwr.r.test(r=0.5,power=0.95,sig.level=0.01,alternative="greater")$n)
addS("correlation","effect",list(n=100,alpha=0.05,power=0.80,tail=2),      pwr.r.test(n=100,power=0.80,sig.level=0.05,alternative="two.sided")$r)
addS("correlation","power", list(effect=0.3,n=84,alpha=0.05,tail=2),       pwr.r.test(r=0.3,n=84,sig.level=0.05,alternative="two.sided")$power)

# ============================================================
# CHI-SQUARE GoF  (pwr.chisq.test; w, N total, df)
# ============================================================
for (a in c(0.05,0.01)) for (w in c(0.1,0.3,0.5)) for (df in c(1,2,4,8)) for (N in c(50,133,300)) {
  addP("chisq", list(effect=w,df=df,n=N,alpha=a),
       pwr.chisq.test(w=w,N=N,df=df,sig.level=a)$power)
}
addS("chisq","n",     list(effect=0.3,df=4,alpha=0.05,power=0.80), pwr.chisq.test(w=0.3,df=4,power=0.80,sig.level=0.05)$N)
addS("chisq","n",     list(effect=0.5,df=1,alpha=0.05,power=0.90), pwr.chisq.test(w=0.5,df=1,power=0.90,sig.level=0.05)$N)
addS("chisq","effect",list(df=4,n=133,alpha=0.05,power=0.80),      pwr.chisq.test(N=133,df=4,power=0.80,sig.level=0.05)$w)
addS("chisq","power", list(effect=0.3,df=4,n=133,alpha=0.05),      pwr.chisq.test(w=0.3,N=133,df=4,sig.level=0.05)$power)

# ------------------------------------------------------------
# emit
# ------------------------------------------------------------
out <- list(
  meta = list(source="pwr package", R=as.character(getRversion()),
              note="n for two.sample/anova/twoProp is per-group; chisq n is total N; paired effect is raw d + rPaired."),
  power_cases = power_cases,
  solve_cases = solve_cases
)
writeLines(toJSON(out, auto_unbox=TRUE, digits=12, pretty=TRUE), "power-analysis.json")
cat("power_cases:", length(power_cases), " solve_cases:", length(solve_cases), "\n")
