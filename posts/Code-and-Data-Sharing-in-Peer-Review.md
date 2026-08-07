---
title: "Code and Data Sharing in Peer Review"
slug: Code-and-Data-Sharing-in-Peer-Review
description: "A reviewer says your code and data are not available and the analysis is not reproducible. Fix the seed, deposit both, or share a synthetic dataset instead."
keywords: "code and data are not available, the analysis is not reproducible, reproducible analysis peer review, data availability statement, share code and data with a paper, set a seed for reproducibility, synthetic data controlled access"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 60
auto_link_terms: code and data are not available|the analysis is not reproducible|reproducible analysis|data availability statement|share your code and data|set a seed for reproducibility|reviewer says not reproducible
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">When a reviewer says the analysis is not reproducible, two separate requests are folded into one sentence: that your code and data be available for someone to obtain, and that running them regenerates the numbers you published. A study can pass one and fail the other. A repository link is worthless if the script lands on a slightly different answer every time it runs, and a perfectly deterministic script helps nobody while it sits on your laptop. So the first move is to work out which of the two you are actually missing, because availability and reproducibility have different fixes and the reviewer has asked for both.</p>

## What the reviewer wrote

> It would strengthen the paper if the analysis code and the underlying data were deposited in a public repository, so that the results can be independently verified.

> The analysis is not reproducible as presented. No code or data are provided. Please deposit both and give an accession link in the manuscript.

> This is a careful study and the cohort is unusually well described, so my remaining comments are minor. I could not, however, locate a data availability statement, and the journal now asks for analysis scripts to be shared on acceptance. As it stands a reader has no way to check the numbers in Table 3 against the data.

## What they actually mean

The reviewer is asking for two things that are easy to confuse. The first is availability, that a reader can obtain the code and the data or read a documented reason why the data cannot be released; the second is computational reproducibility, that running the code on the data returns the published numbers. You can meet one and fail the other, because a shared CSV with no script cannot be re-run, and a script with an unset random seed will not reproduce even on the machine that wrote it. What the reviewer is usually not demanding is that you re-collect the sample or post confidential records in the clear, since a documented, access-controlled route to the data satisfies most journal policies. Read the comment as two boxes to tick rather than one, and it becomes clear which of them your submission left empty.

## Why they are asking

If an analysis cannot be re-run, nobody can tell a correct result from a coding error that happened to produce a plausible one, and a surprising share of published computational results do not re-run from their own supplementary materials (Stodden, Seiler and Ma, 2018). Errors that would surface the moment a second person executed the pipeline instead stay hidden. The reader is left trusting a number they cannot check. Availability has also become a rule rather than a courtesy: the TOP Guidelines set graded standards for data and code sharing that hundreds of journals have adopted (Nosek et al., 2015), and the FAIR principles spell out what "available" has to mean for the sharing to be useful rather than nominal (Wilkinson et al., 2016). The habits that make a workflow reproducible, a fixed seed, a recorded package environment, a script that runs from top to bottom, are covered in [R and the reproducibility crisis](/Reproducibility-Crisis.html), so what a reviewer needs here is the decision and the response, not the method again.

## How to check it

The check is to run the stochastic part of your analysis twice from the exact script you would deposit, and confirm the two runs agree to the last digit. The most common way a reproducible-looking analysis fails is a random step, a bootstrap, a permutation test, a clustering start, whose seed was never fixed. A small bootstrap confidence interval for mean fuel economy in `mtcars` stands in for any resampling result you might report in a paper.

```r
boot_ci <- function(x, seed, reps = 2000) {
  set.seed(seed)
  b <- replicate(reps, mean(sample(x, replace = TRUE)))
  round(quantile(b, c(0.025, 0.975)), 4)
}
boot_ci(mtcars$mpg, seed = 1)
#>    2.5%   97.5%
#> 18.1184 22.2440
```

With the seed written into the function the interval runs from 18.1184 to 22.2440, and the question the reviewer cares about is whether a stranger running the same script lands on the same two numbers.

```r
you     <- boot_ci(mtcars$mpg, seed = 1)
reader  <- boot_ci(mtcars$mpg, seed = 1)   # your script, your seed
no_seed <- boot_ci(mtcars$mpg, seed = 7)   # a run where the seed was never fixed
rbind(you, reader, no_seed)
#>            2.5%   97.5%
#> you     18.1184 22.2440
#> reader  18.1184 22.2440
#> no_seed 18.0655 22.1533
```

The `you` and `reader` rows run the same script twice with the seed fixed. They match to the last digit. The `no_seed` row is what a reader gets when the seed was left out and the generator starts from a different state, 18.0655 to 22.1533, close enough to look like yours and different enough to fail a check. Reproducibility here is binary rather than a tolerance, so a reader either regenerates your interval or writes back to the editor asking why they cannot, and a near miss counts as the second case.

## What to do about it

### You are fine

You are fine when every random step carries a seed, or the analysis has no random step at all, and the data is either public or already deposited. Demonstrate it the way the reviewer would, by running the deposited script twice and showing the results are identical.

```r
identical(you, reader)
round(coef(lm(mpg ~ wt, data = mtcars)), 4)
#> [1] TRUE
#> (Intercept)          wt
#>     37.2851     -5.3445
```

The seeded pipeline returns `TRUE`, so the two runs are the same object and anyone with the script reproduces the interval. A plain regression is easier still, because `lm` has nothing stochastic in it, and its intercept of 37.2851 and weight slope of -5.3445 come back the same on any machine with no seed at all. When your analysis is already in this state, the reply is not new work but a deposit and a data availability statement that points at it.

### It is fixable

The fixable case is the usual one, where the code and data exist and can be shared but were never packaged, or a random step ran without a seed. The remedy is to fix the seed on every stochastic step, record the package versions with something like `sessionInfo()`, switch absolute paths to relative ones, and deposit the result in a repository that issues a DOI, such as OSF, Zenodo or Dryad. Adding the one missing seed line is what turns a run that failed to reproduce into one that matches.

```r
without_seed <- boot_ci(mtcars$mpg, seed = 7)
with_seed    <- boot_ci(mtcars$mpg, seed = 1)
rbind(without_seed, with_seed)
identical(with_seed, you)
#>                 2.5%   97.5%
#> without_seed 18.0655 22.1533
#> with_seed    18.1184 22.2440
#> [1] TRUE
```

Before the seed was fixed the interval came back at 18.0655 to 22.1533, which is not the published 18.1184 to 22.2440; with the seed set, `with_seed` equals `you` exactly and `identical` returns `TRUE`. One line moved the run from unreproducible to bit-for-bit identical, and the same discipline applied to every random step is the whole of the fix. Deposit that seeded script alongside the data and cite the DOI in the manuscript.

### It is a real problem

The real problem is when the data genuinely cannot be released, whether because they are identifiable patient records, a third-party dataset you licensed but do not own, or an ethics approval that never covered public sharing. Refusing to share and saying nothing is not an option, and neither is posting the records anyway. The honest path is to share everything you legitimately can, which is the code in full plus a synthetic or de-identified dataset that carries the same structure so the pipeline still runs end to end, while the real data go to a controlled-access repository that vets requests, such as dbGaP or the European Genome-phenome Archive.

```r
set.seed(42)
confidential <- data.frame(age = round(rnorm(200, 50, 12)),
                           sbp = round(rnorm(200, 130, 15)))
synthetic <- data.frame(age = round(rnorm(200, mean(confidential$age), sd(confidential$age))),
                        sbp = round(rnorm(200, mean(confidential$sbp), sd(confidential$sbp))))
round(rbind(real = colMeans(confidential), synthetic = colMeans(synthetic)), 2)
#>             age    sbp
#> real      49.65 130.16
#> synthetic 48.97 128.37
```

The synthetic frame keeps the marginal means close, 48.97 against 49.65 for age and 128.37 against 130.16 for blood pressure, so a reader can execute the analysis code and confirm it runs and returns sensible output without ever seeing a real participant. Pair that with a data availability statement that names the restriction, the repository, and the process for requesting access. This concedes nothing about the analysis; it discloses exactly what can and cannot be shared and gives a route to the rest.

## How to word your response

### If you are fine

> The reviewer asks that our code and data be available for verification. All analyses were run from a single script with the random seed fixed at each resampling step, and the data are the public `mtcars` records. We have deposited the script and a copy of the data at [repository, DOI] and added a data availability statement (Methods, page X). Running the script reproduces every value in Table 3 exactly, which we confirmed on a clean session before submission.

### If it was fixable

> We thank the reviewer for raising this. The bootstrap in our original submission did not fix the random seed, so a reader re-running it would have obtained an interval close to but not identical with ours. We have now set the seed at every stochastic step, recorded the package versions in the session information, and deposited the full script and data at [repository, DOI] (Methods, page X). The revised script reproduces the reported interval to the last digit, and the conclusions are unchanged.

### If it is a real problem

> The reviewer is right to ask for the data, and we regret that we cannot release the individual records, because the participants' consent and our ethics approval do not permit public deposition of identifiable clinical data. We have instead made the complete analysis code openly available, together with a synthetic dataset that matches the structure of the real one so the pipeline can be run and checked, at [repository, DOI]. The real data are deposited under controlled access at [repository], where qualified researchers can request them through the listed procedure. The data availability statement (Methods, page X) sets out the restriction and the access route in full.

## Practice

A reviewer writes: *"I attempted to reproduce your three-cluster solution and obtained different cluster assignments. The clustering is not reproducible and the results cannot be relied upon."* Your clustering used a fixed seed, so before you concede anything, run the deposited code twice and see what actually happens. It groups the cars in `mtcars` on scaled mileage, weight and horsepower.

```r
vars <- scale(mtcars[, c("mpg", "wt", "hp")])
set.seed(2024); ex_run1 <- kmeans(vars, centers = 3, nstart = 1)
set.seed(2024); ex_run2 <- kmeans(vars, centers = 3, nstart = 1)
identical(ex_run1$cluster, ex_run2$cluster)
round(sum(ex_run1$withinss), 4)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

Run it and `identical(ex_run1$cluster, ex_run2$cluster)` returns `TRUE`, with the total within-cluster sum of squares fixed at 23.7386 on both runs. Because the seed is set before each call, the two clusterings are byte-for-byte the same and the analysis reproduces exactly as written. The obvious reading, that a reviewer who cannot reproduce your result has found a broken analysis belonging in the real-problem case, is wrong here. What failed is availability, not determinism: the reviewer ran a version without your seed, or without your exact script, because you never shared it. This is the you-are-fine outcome dressed as an alarm, so the correct response is to deposit the seeded script and the data, confirm the clustering reproduces on a clean session, and point the reviewer at the exact numbers, rather than to rebuild an analysis that was never the problem.

</details>
