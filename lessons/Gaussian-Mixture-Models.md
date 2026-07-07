---
title: "Unsupervised Learning Lesson 5: Gaussian Mixture Models"
catalog_blurb: "Cluster with probabilities so a point on the border can belong to two groups."
description: "Learn Gaussian mixture models in R from scratch: soft responsibilities, the mixture density, the EM algorithm coded by hand, and fitting with mclust and BIC."
keywords: "gaussian mixture model in R, GMM, mclust, soft clustering, responsibilities, EM algorithm, expectation maximization, BIC, model based clustering, unsupervised learning"
post_type: "LESSON"
curriculum_id: "6.9.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "5"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: "Cluster-Validation-and-Stability.html"
course_prev: "Hierarchical-and-Density-Clustering.html"
---

=== step === cover
::eyebrow Lesson 5 of 8
## Gaussian Mixture Models

In Lesson 4, hierarchical clustering and DBSCAN gave Maria clean neighbourhoods on her coffee-shop map. But every method so far, k-means included, has handed back a **hard** answer: each customer belongs to exactly one group, full stop.

Meet Dan. He comes into Maria's shop about **17 times a month**, right in the gap between her regulars (who average around 13 visits) and her devotees (around 20). k-means had to shove Dan fully into one tier, even though he honestly sits on the fence. A Gaussian mixture refuses to pretend. It can say Dan is, say, **60% regular and 40% devotee**, and that fraction is a real, computed probability, not a hand-wave. The panel below is that idea in miniature: flip it to soft and watch the fence-sitters take an in-between colour.

By the end of this lesson you will be able to:

- Read a soft assignment: what it means to say a customer is 60% one group and 40% another
- Write down the model behind it (data as a weighted sum of bell curves) and compute a membership probability yourself in R
- Run the EM algorithm that fits a mixture, know why it never gets worse but can get stuck, and fit one for real with `mclust`

**Prerequisites:** you can run R and read its output, and you have done [Lesson 3 on k-means](k-Means-and-Choosing-k.html) (clustering, distance, scaling, and why you run several random starts) and [Lesson 4 on hierarchical and density clustering](Hierarchical-and-Density-Clustering.html). A bell curve just means the normal distribution; every other symbol is defined as it appears.

::widget gmm-clusters {}

=== step === widget
::eyebrow The idea
## Hard labels throw away what you know

Toggle the panel between **hard** and **soft**. In hard mode every dot is painted fully blue or fully gold, exactly what k-means does: each point is assigned to its single nearest group. In soft mode the dots in the overlap turn an in-between colour, because the model reports a *probability* of belonging to each group instead of forcing a choice.

::widget gmm-clusters {}

That probability has a name. For each customer and each group, the model gives a **responsibility**: a number between 0 and 1 saying how much that group "owns" the customer, with the responsibilities across all groups adding up to 1. A responsibility of 0.95 means "almost certainly this tier"; 0.55 versus 0.45 means "leaning one way, but genuinely close."

[KEY INSIGHT]
Hard clustering answers "which group?" Soft clustering answers "with what probability?" The hard label is just the soft answer with the doubt thrown away, the group with the largest responsibility. Keeping the doubt is the whole point of a mixture model.

In fact, hard assignment is a mixture model with the confidence deleted: k-means is what you get if you force every responsibility to be exactly 0 or 1. So a Gaussian mixture is not a rival to k-means so much as the honest, probabilistic version of the same idea.

=== step === quiz
::eyebrow Check yourself
## What does 0.5 / 0.5 mean?

The model reports that one customer has responsibility **0.5 for "regular"** and **0.5 for "devotee"**. What is it telling you?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The customer's visit count sits exactly halfway between the two tiers' average visits ::no A responsibility is a probability of membership, not a position on the number line. Equal shares mean the two bells explain this customer equally well, whatever the exact count.
- The model is genuinely undecided: this customer is equally consistent with both tiers ::ok Right. Equal responsibilities mean the two bells explain this customer equally well, so the model reports honest uncertainty instead of a forced label.
- Something is wrong, because a responsibility has to be 0 or 1 ::no That is hard assignment (k-means). A mixture's responsibilities are real numbers between 0 and 1 on purpose; 0.5 / 0.5 is a perfectly valid, informative answer.

=== step === concept
::eyebrow The model
## Where the probabilities come from

The soft colours are not decoration; they fall out of a specific model of how the data was made. A **Gaussian mixture** assumes each customer was produced in two steps: first nature picks a tier at random, then it draws that customer's visit count from a bell curve belonging to that tier. Maria never sees the first step; she only sees the final visit counts, all mixed together.

Two pieces describe one bell. The **normal (Gaussian) density** for a single feature \(x\) is

\[ \mathcal{N}(x \mid \mu, \sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}}\, \exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right) \]

where \(\mu\) (mu) is the centre of the bell and \(\sigma^2\) (sigma squared) is its variance, how wide it spreads. Now stack \(K\) of these bells, one per tier, and give tier \(k\) a **mixing weight** \(\pi_k\) (pi-k), the fraction of customers that belong to it. The whole population's density is their weighted sum:

\[ p(x) = \sum_{k=1}^{K} \pi_k\, \mathcal{N}(x \mid \mu_k, \Sigma_k), \qquad \sum_{k=1}^{K}\pi_k = 1 \]

Here \(\Sigma_k\) (Sigma) is the general, multi-feature version of the variance, the **covariance matrix**; with a single feature like visits it is just \(\sigma_k^2\). With two features (say visits and spend) \(\Sigma_k\) also sets the *shape* of each group: a mixture can draw stretched, tilted **ellipses**, which is exactly why it fits Maria's tiers better than k-means, whose round cells cannot lean or elongate. The dashed ovals in the panel earlier are those ellipses.

Let us build Maria's data and see the two bells hiding inside it. Each lesson runs in its own fresh R session, so we make the visit counts right here; this page shares one session top to bottom, so run this once and later steps reuse it.

```r
set.seed(42)
regulars <- rnorm(70, mean = 13, sd = 2.4)   # ~70 regulars, about 13 visits a month
devotees <- rnorm(30, mean = 20, sd = 2.0)   # ~30 devotees, about 20 visits a month
visits   <- round(pmin(pmax(c(regulars, devotees), 1), 31))  # Maria sees only this, unlabelled
length(visits)
#> [1] 100
range(visits)
#> [1]  6 23
```

If we *knew* the two tiers, the mixture density is just their weighted sum. Plot the visit counts and lay the two bells (and their sum) on top:

```r
hist(visits, breaks = 18, freq = FALSE, col = "grey90", border = "white",
     main = "Maria's monthly visits, and the two bells hiding inside",
     xlab = "visits per month")
grid <- seq(1, 31, length.out = 300)
lines(grid, 0.7 * dnorm(grid, 13, 2.4), col = "#2980b9", lwd = 2)   # the regular bell (weight 0.7)
lines(grid, 0.3 * dnorm(grid, 20, 2.0), col = "#c0392b", lwd = 2)   # the devotee bell (weight 0.3)
lines(grid, 0.7 * dnorm(grid, 13, 2.4) + 0.3 * dnorm(grid, 20, 2.0),
      col = "black", lwd = 2, lty = 2)                              # their sum: the mixture
```

The single lumpy histogram is really two overlapping bells added together. The job of a mixture model is to recover those bells, their centres, spreads and weights, from the visit counts alone, without ever being told who is a regular and who is a devotee.

=== step === tryit
::eyebrow Your turn
## Compute Dan's responsibility

Given the two bells, working out a customer's responsibility is just Bayes' rule. For customer \(x_i\) and tier \(k\), the responsibility is that tier's weighted height at \(x_i\), divided by the total across all tiers:

\[ \gamma_{ik} = \frac{\pi_k\, \mathcal{N}(x_i \mid \mu_k, \sigma_k^2)}{\sum_{j=1}^{K} \pi_j\, \mathcal{N}(x_i \mid \mu_j, \sigma_j^2)} \]

where \(\gamma_{ik}\) (gamma) is the responsibility of tier \(k\) for customer \(i\). In R, `dnorm(x, mu, sg)` gives the bell height \(\mathcal{N}\). Multiply by the weight, then divide by the total so the two shares add to 1. Fill in the blank with what turns the two weighted heights into shares. (We call the weights `pri` in code because `pi` is already a built-in number in R.)

```r
mu  <- c(13, 20)      # the two bell centres: regulars, devotees
sg  <- c(2.4, 2.0)    # their spreads (standard deviations)
pri <- c(0.7, 0.3)    # the mixing weights: 70% regulars, 30% devotees
x   <- 17             # Dan comes in 17 times a month
w   <- pri * dnorm(x, mu, sg)   # each bell's weighted height at Dan's visits
resp <- w / ____                # turn the two heights into shares that add to 1
round(resp, 3)                  # P(regular | 17), P(devotee | 17)
```
::check {"regex":"sum\\s*\\(\\s*w\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right: dividing by sum(w) normalises the two weighted heights into responsibilities that add to 1. Dan comes out about 0.60 regular, 0.40 devotee.","no":"Divide by the total of the two weighted heights so the shares sum to 1: resp <- w / sum(w)."}
::solution
```r
mu  <- c(13, 20); sg <- c(2.4, 2.0); pri <- c(0.7, 0.3)
x   <- 17
w   <- pri * dnorm(x, mu, sg)
resp <- w / sum(w)
round(resp, 3)
#> [1] 0.599 0.401
```

=== step === concept
::eyebrow The algorithm
## EM: guess, blame, re-fit, repeat

There is a chicken-and-egg problem. To compute responsibilities you need the bells (their \(\mu\), \(\sigma\), \(\pi\)), but to fit the bells you need to know which customers belong to each, which is what the responsibilities tell you. **EM** (Expectation-Maximisation) breaks the loop by guessing, then improving, in two alternating moves:

1. **E-step:** with the current bells, compute every customer's responsibility (the formula you just used).
2. **M-step:** with those responsibilities, re-fit each bell as a **responsibility-weighted average** of the data. A customer who is 60% regular counts as 0.6 of a regular when computing the regular bell:

\[ \pi_k = \frac{1}{n}\sum_{i=1}^{n}\gamma_{ik}, \qquad \mu_k = \frac{\sum_i \gamma_{ik}\,x_i}{\sum_i \gamma_{ik}}, \qquad \sigma_k^2 = \frac{\sum_i \gamma_{ik}\,(x_i-\mu_k)^2}{\sum_i \gamma_{ik}} \]

where \(n\) is the number of customers. Repeat E then M, and the bells slide into place. Here is the whole thing by hand on Maria's visits, starting from a deliberately bad guess so you can watch it recover:

```r
set.seed(1)
mu <- c(10, 22); sg <- c(3, 3); pri <- c(0.5, 0.5)   # a deliberately rough starting guess
loglik <- numeric(0)
for (it in 1:40) {
  # E-step: how much does each bell own each customer?
  d1 <- pri[1] * dnorm(visits, mu[1], sg[1])
  d2 <- pri[2] * dnorm(visits, mu[2], sg[2])
  r1 <- d1 / (d1 + d2); r2 <- 1 - r1
  # M-step: re-fit each bell as a responsibility-weighted average
  pri <- c(mean(r1), mean(r2))
  mu  <- c(sum(r1 * visits) / sum(r1), sum(r2 * visits) / sum(r2))
  sg  <- c(sqrt(sum(r1 * (visits - mu[1])^2) / sum(r1)),
           sqrt(sum(r2 * (visits - mu[2])^2) / sum(r2)))
  loglik[it] <- sum(log(d1 + d2))     # total log-likelihood: how well the bells fit the data
}
round(loglik[c(1, 3, 5, 10, 40)], 1)  # watch it climb, then flatten
#> [1] -327.2 -277.7 -277.5 -277.0 -275.8
```

The **log-likelihood**, \(\ell = \sum_i \log \sum_k \pi_k \mathcal{N}(x_i \mid \mu_k, \sigma_k^2)\), scores how well the current bells explain the data. Read the numbers: a big jump on the first pass, then smaller and smaller gains as the fit settles. Now see what EM recovered from unlabelled visits alone:

```r
data.frame(tier   = c("regular", "devotee"),
           weight = round(pri, 2),
           mean_visits = round(mu, 1),
           sd     = round(sg, 1))
#>      tier weight mean_visits  sd
#> 1 regular    0.8        13.9 3.1
#> 2 devotee    0.2        20.7 1.5
```

Two tiers, one centred near 14 visits and one near 21, pulled out of a single lumpy histogram with no labels. Draw those recovered bells back over the data and you can see the fit for yourself, the two curves EM found without ever being shown who was who:

```r
hist(visits, breaks = 18, freq = FALSE, col = "grey90", border = "white",
     main = "What EM recovered, from unlabelled visits alone",
     xlab = "visits per month")
grid <- seq(1, 31, length.out = 300)
lines(grid, pri[1] * dnorm(grid, mu[1], sg[1]), col = "#2980b9", lwd = 2)  # recovered regular bell
lines(grid, pri[2] * dnorm(grid, mu[2], sg[2]), col = "#c0392b", lwd = 2)  # recovered devotee bell
```

That is the payoff: the model reconstructed both bells, and now every customer, Dan included, gets a responsibility from them.

[WARNING]
Each EM pass can only raise the log-likelihood or leave it flat, so the loop always converges, exactly like k-means always settled in Lesson 3. But it converges to a **local** optimum, the best fit near wherever you started. A bad start lands on a worse fit. The cure is the same as k-means `nstart`: run EM from several random starts and keep the one with the highest log-likelihood.

=== step === quiz
::eyebrow Check yourself
## Two runs, two answers

You run your hand-coded EM twice, from two different random starting guesses, and get two different sets of bells with slightly different final log-likelihoods. What is happening?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- One of the runs has a bug: EM is deterministic, so the same data must give the same fit ::no EM is deterministic given a start, but the start is random here. Same data plus a different starting guess can climb to a different local optimum.
- EM climbs to whichever local optimum is nearest its start, so different starts can settle on different fits; keep the one with the higher log-likelihood ::ok Exactly. The log-likelihood surface has more than one peak; EM finds the nearest, not the tallest. Running several starts and keeping the best is how you guard against a poor one.
- The data must have changed between the two runs ::no The data is identical; the only thing that differed was the starting guess. Same data, different start, different local optimum.

=== step === concept
::eyebrow In practice
## You would use mclust

Coding EM by hand is the best way to understand it, but in real work you reach for the **mclust** package. It runs EM for you, and it solves the two questions we have been ducking: how many components \(K\), and what covariance shape each should have. It fits many candidate models and scores each with the **BIC** (Bayesian Information Criterion), a number that rewards fit but penalises extra parameters, then keeps the best. So mclust chooses the number of tiers *and* the ellipse shape automatically, instead of you guessing `centers = 3` the way k-means made you.

```r-static
library(mclust)
# Mclust tries G = 1..9 components and every covariance shape, and keeps the best by BIC.
m <- Mclust(visits)
summary(m)          # the chosen number of components G, the model, and the log-likelihood
m$G                 # how many tiers BIC settled on
head(round(m$z, 2)) # m$z holds the soft responsibilities, one row per customer
```

On Maria's two-tier visits, BIC typically lands on two components, matching what your hand-coded EM found, and `m$z` gives you Dan's 60/40 style split for every customer at once. (mclust is not preinstalled in this in-browser R, so run that block in your own R session.) A quiet bonus: mclust also guards against the singular-fit problem in the next step, so you rarely hit it in practice.

=== step === quiz
::eyebrow Check yourself
## When is soft worth it?

A colleague clusters Maria's customers two ways: k-means with `centers = 2`, and a two-component Gaussian mixture. Both split the customers into much the same two tiers, but the mixture *also* reports each customer's probability of belonging to each tier. When is that extra soft output most useful?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- When Maria wants to treat confident and borderline customers differently, for example emailing a "become a devotee" offer only to the fence-sitters who are, say, 40 to 60% devotee ::ok Right. The responsibilities let her target the ambiguous middle that a hard label hides. That is precisely the information k-means throws away.
- Never: the hard k-means labels already contain strictly more information than the soft ones ::no Backwards. The hard label is the soft answer with the doubt deleted, so it holds strictly less information, not more.
- Only when the two tiers do not overlap at all ::no If the tiers do not overlap, every responsibility is near 0 or 1 and soft adds little. The soft output earns its keep exactly when the groups *do* overlap and some customers sit on the border.

=== step === concept
::eyebrow Know your tool
## Where mixtures break

A Gaussian mixture is powerful because it commits to a specific model, and that same commitment is where it can go wrong. Know these before you trust a fit:

- **It assumes the groups are roughly Gaussian.** If a true cluster is a crescent or a ring (the shapes DBSCAN handled in Lesson 4), forcing bells onto it gives a confident but wrong answer. A mixture models blobs, not arbitrary shapes.
- **Components can collapse (a singularity).** If one bell shrinks onto a single point its variance heads toward zero and the likelihood blows up to infinity, a useless "perfect" fit. mclust guards against this with a small regularisation; a hand-rolled EM needs a floor on the variance.
- **It only finds a local optimum**, so a poor start gives a poor fit. Run several starts and keep the best, as above.
- **You still have to choose the number of components.** BIC gives a principled answer, but it is a guide, not gospel; sanity-check that the components mean something to Maria, not just to the score.

[NOTE]
The through-line of this unit: k-means draws round, hard groups; hierarchical clustering and DBSCAN handle odd shapes; a Gaussian mixture keeps the groups probabilistic and can tilt them into ellipses. No method is best everywhere, so the skill is matching the tool to the shape and the question.

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take Gaussian mixtures further:

- [The Elements of Statistical Learning, sections 6.8 and 8.5 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - mixture models and the EM algorithm, with the full derivation.
- [Stanford CS229 lecture notes (free PDF)](https://cs229.stanford.edu/main_notes.pdf) - the mixtures-of-Gaussians and EM sections build the exact algorithm you coded, step by step.
- [Scrucca, Fop, Murphy and Raftery (2016): mclust 5 (The R Journal)](https://journal.r-project.org/archive/2016/RJ-2016-021/index.html) - the package you would use, and how BIC picks the number of components and the covariance shape.
- [mclust on CRAN](https://cran.r-project.org/package=mclust) - documentation and vignette for `Mclust`, `mclustBIC`, and reading the responsibilities in `m$z`.
- [scikit-learn: Gaussian mixture models](https://scikit-learn.org/stable/modules/mixture.html) - a clear, well-illustrated tour of the same ideas (the concepts transfer directly to R).

=== step === complete
## Lesson 5 complete

You can now cluster with probabilities instead of hard labels. You saw that a responsibility is a real membership probability, wrote down the mixture model (a weighted sum of Gaussian bells set by their weights \(\pi_k\), centres \(\mu_k\) and covariances \(\Sigma_k\)), and computed Dan's 60/40 split by hand with Bayes' rule. Then you ran EM's two-move loop, watched the log-likelihood climb and flatten as it recovered Maria's tiers from unlabelled visits, learned why it converges but only to a local optimum, and met `mclust` with BIC as the tool that picks the number of components and the shape for you.

Next, Lesson 6: Cluster Validation and Stability. Every method in this unit will happily hand you clusters, even from data that has none. So the last question is the sharpest: are the clusters you found actually real? You will use the silhouette, the gap statistic, and stability checks to tell genuine structure from a pattern the algorithm merely invented.
