# Ground-truth Bayes factors for the bayes-factor-calculator v2 rebuild.
# Verified against BayesFactor 0.9.12-4.8 (Morey & Rouder).
#   t-tests      -> BayesFactor::ttest.tstat        (Rouder et al. 2009 JZS)
#   regression   -> BayesFactor::linearReg.R2stat   (Liang et al. 2008 g-prior)
#   one-way ANOVA-> BayesFactor::linearReg.R2stat   (fixed-effects, via R2 from F)
#   correlation  -> BayesFactor:::.bf10Exact         (Ly et al. 2016 exact 2F1)
#   two-prop     -> BayesFactor:::contingencyIndepMultinomial (Gunel-Dickey 1974)
#
# rscale is always passed as an explicit NUMERIC value so the JS library can be
# verified bit-for-bit; the named presets equal these numbers exactly:
#   t-test     medium=sqrt(2)/2  wide=1        ultrawide=sqrt(2)
#   regression medium=sqrt(2)/4  wide=1/2      ultrawide=sqrt(2)/2
#   anova      medium=1/2        wide=sqrt(2)/2 ultrawide=1
#   correlation medium=1/3       wide=1/sqrt(3) ultrawide=1   medium.narrow=1/sqrt(27)
# two-proportion uses a Dirichlet prior-concentration a>=1 (default 1), not rscale.

suppressMessages(library(BayesFactor))
options(warn = -1)

cases <- list()
add <- function(mode, label, params, bf10) {
  cases[[length(cases) + 1]] <<- list(mode = mode, label = label,
                                      params = params, bf10 = bf10)
}
jnum <- function(x) {
  if (is.null(x) || length(x) == 0) return("null")
  if (is.na(x)) return("null")
  if (is.infinite(x)) return(if (x > 0) "\"Inf\"" else "\"-Inf\"")
  formatC(x, digits = 17, format = "g")
}

## ------------------------------------------------------------------
## 1. Two-sample t  (ttest.tstat with n2 > 0)
## ------------------------------------------------------------------
tt2 <- function(t, n1, n2, r) as.numeric(ttest.tstat(t, n1, n2, rscale = r, simple = TRUE))
rmed <- sqrt(2)/2; rwide <- 1; ruw <- sqrt(2)
add("twoT", "t=2.5 n=50,50 medium",  list(t=2.5,  n1=50,  n2=50,  rscale=rmed),  tt2(2.5, 50, 50, rmed))
add("twoT", "t=2.5 n=50,50 wide",    list(t=2.5,  n1=50,  n2=50,  rscale=rwide), tt2(2.5, 50, 50, rwide))
add("twoT", "t=2.5 n=50,50 ultra",   list(t=2.5,  n1=50,  n2=50,  rscale=ruw),   tt2(2.5, 50, 50, ruw))
add("twoT", "t=6 n=100,100 medium",  list(t=6.0,  n1=100, n2=100, rscale=rmed),  tt2(6.0, 100, 100, rmed))
add("twoT", "t=0.5 n=50,50 medium",  list(t=0.5,  n1=50,  n2=50,  rscale=rmed),  tt2(0.5, 50, 50, rmed))
add("twoT", "t=0 n=30,30 medium",    list(t=1e-9, n1=30,  n2=30,  rscale=rmed),  tt2(1e-9, 30, 30, rmed))
add("twoT", "t=-2.1 n=18,22 wide",   list(t=-2.1, n1=18,  n2=22,  rscale=rwide), tt2(-2.1, 18, 22, rwide))
add("twoT", "t=3.3 n=8,7 medium",    list(t=3.3,  n1=8,   n2=7,   rscale=rmed),  tt2(3.3, 8, 7, rmed))
add("twoT", "t=12 n=200,200 ultra",  list(t=12,   n1=200, n2=200, rscale=ruw),   tt2(12, 200, 200, ruw))

## ------------------------------------------------------------------
## 2. One-sample / paired t  (ttest.tstat with n2 = 0)
## ------------------------------------------------------------------
tt1 <- function(t, n, r) as.numeric(ttest.tstat(t, n, rscale = r, simple = TRUE))
add("oneT", "t=4 n=20 medium",   list(t=4.0,  n=20, rscale=rmed),  tt1(4.0, 20, rmed))
add("oneT", "t=4 n=20 wide",     list(t=4.0,  n=20, rscale=rwide), tt1(4.0, 20, rwide))
add("oneT", "t=4 n=20 ultra",    list(t=4.0,  n=20, rscale=ruw),   tt1(4.0, 20, ruw))
add("oneT", "t=1.2 n=15 medium", list(t=1.2,  n=15, rscale=rmed),  tt1(1.2, 15, rmed))
add("oneT", "t=0 n=10 medium",   list(t=1e-9, n=10, rscale=rmed),  tt1(1e-9, 10, rmed))
add("oneT", "t=2.8 n=64 medium", list(t=2.8,  n=64, rscale=rmed),  tt1(2.8, 64, rmed))
add("oneT", "t=-3.5 n=30 wide",  list(t=-3.5, n=30, rscale=rwide), tt1(-3.5, 30, rwide))
add("oneT", "t=8 n=5 medium",    list(t=8.0,  n=5,  rscale=rmed),  tt1(8.0, 5, rmed))

## ------------------------------------------------------------------
## 3. Linear regression  (linearReg.R2stat, N, p, R2)
##    regression named: medium=sqrt(2)/4  wide=1/2  ultrawide=sqrt(2)/2
## ------------------------------------------------------------------
reg <- function(N, p, R2, r) as.numeric(linearReg.R2stat(N, p, R2, rscale = r, simple = TRUE))
rgm <- sqrt(2)/4; rgw <- 1/2; rgu <- sqrt(2)/2
add("regression", "N=32 p=2 R2=.7826 medium", list(N=32, p=2, R2=0.7826, rscale=rgm), reg(32, 2, 0.7826, rgm))
add("regression", "N=32 p=2 R2=.7826 wide",   list(N=32, p=2, R2=0.7826, rscale=rgw), reg(32, 2, 0.7826, rgw))
add("regression", "N=32 p=2 R2=.7826 ultra",  list(N=32, p=2, R2=0.7826, rscale=rgu), reg(32, 2, 0.7826, rgu))
add("regression", "N=100 p=5 R2=.30 medium",  list(N=100, p=5, R2=0.30, rscale=rgm),  reg(100, 5, 0.30, rgm))
add("regression", "N=50 p=1 R2=.10 medium",   list(N=50, p=1, R2=0.10, rscale=rgm),   reg(50, 1, 0.10, rgm))
add("regression", "N=40 p=3 R2=.02 wide",     list(N=40, p=3, R2=0.02, rscale=rgw),   reg(40, 3, 0.02, rgw))
add("regression", "N=25 p=10 R2=.65 medium",  list(N=25, p=10, R2=0.65, rscale=rgm),  reg(25, 10, 0.65, rgm))
add("regression", "N=500 p=2 R2=.05 ultra",   list(N=500, p=2, R2=0.05, rscale=rgu),  reg(500, 2, 0.05, rgu))

## ------------------------------------------------------------------
## 4. One-way ANOVA  (fixed effects, via R2 = F*df1/(F*df1+df2))
##    anova named: medium=1/2  wide=sqrt(2)/2  ultrawide=1
## ------------------------------------------------------------------
anv <- function(F, df1, df2, N, r) {
  R2 <- (F*df1)/(F*df1 + df2)
  as.numeric(linearReg.R2stat(N, df1, R2, rscale = r, simple = TRUE))
}
ram <- 1/2; raw <- sqrt(2)/2; rau <- 1
add("anova", "F=4.85 df=2,27 N=30 medium", list(F=4.85, df1=2, df2=27, N=30, rscale=ram), anv(4.85, 2, 27, 30, ram))
add("anova", "F=4.85 df=2,27 N=30 wide",   list(F=4.85, df1=2, df2=27, N=30, rscale=raw), anv(4.85, 2, 27, 30, raw))
add("anova", "F=4.85 df=2,27 N=30 ultra",  list(F=4.85, df1=2, df2=27, N=30, rscale=rau), anv(4.85, 2, 27, 30, rau))
add("anova", "F=1.1 df=3,60 N=64 medium",  list(F=1.1, df1=3, df2=60, N=64, rscale=ram),  anv(1.1, 3, 60, 64, ram))
add("anova", "F=25 df=4,95 N=100 medium",  list(F=25, df1=4, df2=95, N=100, rscale=ram),  anv(25, 4, 95, 100, ram))
add("anova", "F=0.2 df=2,50 N=53 wide",    list(F=0.2, df1=2, df2=50, N=53, rscale=raw),  anv(0.2, 2, 50, 53, raw))

## ------------------------------------------------------------------
## 5. Correlation  (exact 2F1;  kappa = rscale)
##    correlation named: medium=1/3  wide=1/sqrt(3)  ultrawide=1  medium.narrow=1/sqrt(27)
## ------------------------------------------------------------------
cor10 <- function(n, r, kappa) exp(BayesFactor:::.bf10Exact(n, r, kappa)$bf)
kcm <- 1/3; kcw <- 1/sqrt(3); kcu <- 1; kcn <- 1/sqrt(27)
add("cor", "n=50 r=0.4 medium",    list(r=0.4,  n=50, rscale=kcm), cor10(50, 0.4, kcm))
add("cor", "n=50 r=0.4 wide",      list(r=0.4,  n=50, rscale=kcw), cor10(50, 0.4, kcw))
add("cor", "n=50 r=0.4 ultra",     list(r=0.4,  n=50, rscale=kcu), cor10(50, 0.4, kcu))
add("cor", "n=50 r=0.4 narrow",    list(r=0.4,  n=50, rscale=kcn), cor10(50, 0.4, kcn))
add("cor", "n=30 r=0.5 medium",    list(r=0.5,  n=30, rscale=kcm), cor10(30, 0.5, kcm))
add("cor", "n=100 r=-0.25 medium", list(r=-0.25,n=100,rscale=kcm), cor10(100, -0.25, kcm))
add("cor", "n=200 r=0.05 medium",  list(r=0.05, n=200,rscale=kcm), cor10(200, 0.05, kcm))
add("cor", "n=12 r=0.8 wide",      list(r=0.8,  n=12, rscale=kcw), cor10(12, 0.8, kcw))
add("cor", "n=6 r=0.0 medium",     list(r=0.0,  n=6,  rscale=kcm), cor10(6, 0.0, kcm))

## ------------------------------------------------------------------
## 6. Two-proportion  (independent multinomial contingency, prior conc a)
##    table rows = groups, cols = c(success, failure)
## ------------------------------------------------------------------
prop10 <- function(x1, n1, x2, n2, a) {
  tab <- matrix(c(x1, n1 - x1, x2, n2 - x2), nrow = 2, byrow = TRUE)
  exp(BayesFactor:::contingencyIndepMultinomial(tab, a))
}
add("prop", "100/200 vs 60/200 a=1", list(x1=100, n1=200, x2=60, n2=200, a=1), prop10(100,200,60,200,1))
add("prop", "100/200 vs 60/200 a=2", list(x1=100, n1=200, x2=60, n2=200, a=2), prop10(100,200,60,200,2))
add("prop", "50/100 vs 45/100 a=1",  list(x1=50,  n1=100, x2=45, n2=100, a=1), prop10(50,100,45,100,1))
add("prop", "8/10 vs 3/10 a=1",      list(x1=8,   n1=10,  x2=3,  n2=10,  a=1), prop10(8,10,3,10,1))
add("prop", "0/20 vs 5/20 a=1",      list(x1=0,   n1=20,  x2=5,  n2=20,  a=1), prop10(0,20,5,20,1))
add("prop", "150/300 vs 150/300 a=1",list(x1=150, n1=300, x2=150,n2=300, a=1), prop10(150,300,150,300,1))
add("prop", "20/20 vs 15/20 a=1",    list(x1=20,  n1=20,  x2=15, n2=20,  a=1), prop10(20,20,15,20,1))
add("prop", "500/1000 vs 420/1000 a=1", list(x1=500,n1=1000,x2=420,n2=1000,a=1), prop10(500,1000,420,1000,1))

## ------------------------------------------------------------------
## Cross-checks against the PUBLIC functions (must equal the internals above)
## ------------------------------------------------------------------
xchk <- list()
# correlationBF on constructed exact-r data
mkxy <- function(n, r) {
  x <- scale(1:n)[,1]
  e <- scale(residuals(lm(rnorm(n) ~ x)))[,1]
  y <- r * x + sqrt(1 - r^2) * e
  list(x = x, y = y, robs = cor(x, y))
}
set.seed(1)
d <- mkxy(50, 0.4)
b_pub <- extractBF(correlationBF(y = d$y, x = d$x, rscale = 1/3))$bf
b_int <- cor10(d$robs, 50, 1/3)  # note: cor10 signature is (n, r, kappa)
b_int <- exp(BayesFactor:::.bf10Exact(50, d$robs, 1/3)$bf)
xchk$cor_public <- b_pub
xchk$cor_internal_at_robs <- b_int
xchk$cor_robs <- d$robs
# contingencyTableBF public
tab <- matrix(c(100,100,60,140), nrow = 2, byrow = TRUE)
xchk$prop_public <- extractBF(contingencyTableBF(tab, sampleType = "indepMulti", fixedMargin = "rows"))$bf
xchk$prop_internal <- prop10(100,200,60,200,1)

## ------------------------------------------------------------------
## Emit JSON
## ------------------------------------------------------------------
con <- file("Scripts/tool-truth/bayes-factor-calculator.json", open = "w", encoding = "UTF-8")
writeLines("{", con)
writeLines("  \"_source\": \"BayesFactor 0.9.12-4.8; ttest.tstat / linearReg.R2stat / .bf10Exact / contingencyIndepMultinomial\",", con)
writeLines("  \"cases\": [", con)
for (i in seq_along(cases)) {
  c0 <- cases[[i]]
  pr <- c0$params
  kv <- paste(sprintf("\"%s\": %s", names(pr), sapply(pr, jnum)), collapse = ", ")
  line <- sprintf("    {\"mode\": \"%s\", \"label\": \"%s\", \"params\": {%s}, \"bf10\": %s}%s",
                  c0$mode, c0$label, kv, jnum(c0$bf10),
                  if (i < length(cases)) "," else "")
  writeLines(line, con)
}
writeLines("  ],", con)
xk <- paste(sprintf("    \"%s\": %s", names(xchk), sapply(xchk, jnum)), collapse = ",\n")
writeLines("  \"crosscheck\": {", con)
writeLines(xk, con)
writeLines("  }", con)
writeLines("}", con)
close(con)
cat("Wrote", length(cases), "cases + crosschecks\n")
