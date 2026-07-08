---
title: "Uncertainty Quantification Lesson 2: Split Conformal Prediction"
catalog_blurb: "A prediction band whose coverage is guaranteed, whatever shape the errors take."
description: "Split conformal prediction in R: hold out a calibration set, score residuals, take a quantile, then get a band whose coverage holds for any model or error shape."
keywords: "split conformal prediction, conformal prediction, prediction interval, coverage guarantee, nonconformity score, calibration set, distribution-free, model-agnostic, uncertainty quantification, R"
post_type: "LESSON"
curriculum_id: "6.210.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "2"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: "Conformal-Prediction-for-Classification.html"
course_prev: "Prediction-Intervals-You-Can-Trust.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Split Conformal Prediction

Last lesson left Rohan the real-estate agent with a broken promise. His model's tidy "90% prediction interval" quietly covered only about 82% of his biggest listings, because it trusted the errors to be a neat, equal-variance bell curve. The moment that assumption cracked, the 90% on the label became fiction.

This lesson builds a band that makes no such assumption, and that works around *any* model you hand it, even a bad one. **Split conformal prediction** reads its width straight off the model's own misses on held-out data, and in return it *guarantees* its coverage: at least the fraction you asked for, whatever shape the errors take, whatever model produced them, from one held-out slice and a single quantile.

By the end of this lesson you will be able to:

- Build a conformal band by hand in R: split into train and calibration, score each held-out miss, take the conformal quantile as the half-width, and wrap it around any model
- Explain why the scores must come from a *held-out* calibration set, not the model's own training misses, and see coverage collapse when you forget
- Measure a band's empirical coverage, state exactly what the guarantee does and does not promise, and see why one width cannot cover every subgroup

**Prerequisites:** [Lesson 1](Prediction-Intervals-You-Can-Trust.html) (prediction intervals, coverage, empirical coverage), and the fact that a residual is actual minus predicted ([OLS regression](OLS-Regression-from-Scratch.html), [regression assumptions](Regression-Assumptions-and-Residuals.html)). Basic R: vectors, logical indexing, `data.frame`, `sort`. Every new term is defined as it appears.

::widget conformal-bands {}

=== step === concept
::eyebrow The one idea
## From a bet to a guarantee

Every interval so far has been a *bet*. Lesson 1's textbook band bet that the errors were a symmetric bell curve, plugged that bet into a formula, and lost when Rohan's biggest homes broke it. Split conformal refuses to bet. Instead it asks one blunt, honest question: **on homes the model has never seen, 90% of the time it missed by less than *how much*?** That amount becomes the half-width of the band. No bell curve, no variance formula, nothing assumed about the errors at all.

Let us rebuild Rohan's market to try it on. Each lesson runs in a fresh R session, so we create the data right here (run this once). Price climbs with size at about $180 a square foot, and the noise deliberately *grows* with size, so big homes scatter far more than small ones (renovations, a bidding war, a dream kitchen).

```r
set.seed(1)
n     <- 1200
sqft  <- round(runif(n, 600, 2600))
price <- round(60000 + 180 * sqft + rnorm(n, 0, 18 * sqft))   # spread grows with home size
homes <- data.frame(sqft, price)
head(homes, 4)
#>   sqft  price
#> 1 1131 256637
#> 2 1344 338267
#> 3 1746 390884
#> 4 2416 518459
```

That single question ("missed by less than how much?") is the whole method. The rest of the lesson is just answering it carefully, in four steps, in R.

=== step === concept
::eyebrow Step 1
## Split the data three ways

To measure the model's misses *honestly*, we must measure them on homes the model never trained on. So before doing anything else we carve the 1,200 homes into three separate slices, each with a different job:

```r
train <- homes[1:600, ]      # 1) FIT the model on these 600 homes
calib <- homes[601:900, ]    # 2) CALIBRATE: 300 held-out homes to measure the model's misses
test  <- homes[901:1200, ]   # 3) TEST: 300 fresh homes, untouched until the final coverage check
nrow(calib)
#> [1] 300
```

The middle slice, **calibration**, is the engine of the whole method, and it is what makes conformal different from an ordinary train/test split. We *sacrifice* 300 homes that could have trained a slightly better model, and in exchange those held-out misses will buy us a coverage *guarantee*. Hold that trade in mind; in two steps you will see exactly why the misses must come from a set the model never touched.

=== step === concept
::eyebrow Step 1, continued
## Fit any model, even a greedy one

Here is where conformal earns its keep. To prove the method does not care *what* model it wraps, we will deliberately hand it a bad one: a decision tree grown so deep it practically memorizes the training homes. `cp = 0` and `minsplit = 2` remove every guard rail, so the tree keeps splitting until each leaf holds almost one home.

```r
library(rpart)
model <- rpart(price ~ sqft, data = train,
               control = rpart.control(cp = 0, minsplit = 2))   # grown deep on purpose
round(mean(abs(train$price - predict(model, train))))          # average miss on its OWN training homes
#> [1] 3517
```

An average miss of just **$3,517** on the training homes. On the surface this looks like a magnificent model, wrong by only a few thousand dollars on a half-million-dollar house. It is not. That number is a mirage, and the next step is where the mirage evaporates. Whatever you think of the tree, notice that split conformal will make it *honest* regardless.

=== step === concept
::eyebrow Step 2
## The nonconformity score: how strange is each home?

Now we score the model on the calibration homes, the ones it never trained on. The **nonconformity score** of a home is simply how far the model missed it, the *size* of the residual:

\[ s_i = \bigl\lvert\, y_i - \hat f(x_i) \,\bigr\rvert \]

where \(y_i\) is that home's real price, \(\hat f(x_i)\) is the model's prediction for it, and \(\lvert\cdot\rvert\) is absolute value, so a miss of \(+\$70\text{k}\) and a miss of \(-\$70\text{k}\) both score 70,000. A big score means the model was badly wrong on that home; a small score means it nailed it. Watch it on a single calibration home before we do all 300:

```r
home601 <- calib[1, ]                       # the first held-out home
pred601 <- unname(predict(model, home601))  # what the memorizing tree guesses for it
c(actual = home601$price, predicted = round(pred601),
  score = round(abs(home601$price - pred601)))
#>    actual predicted     score
#>    398749    470394     71645
```

The tree, which missed its *training* homes by only $3,517, missed this held-out home by **$71,645**. That is the nonconformity score: the honest size of a single miss on data the model never saw.

=== step === concept
::eyebrow Step 2, continued
## Held-out misses tell the truth

Now score every calibration home at once and compare the model's misses on the two slices side by side:

```r
scores <- as.numeric(abs(calib$price - predict(model, calib)))   # one score per held-out home
round(c(train_miss = mean(abs(train$price - predict(model, train))),
        calib_miss = mean(scores)))
#> train_miss calib_miss
#>       3517      33231
```

There it is. The tree misses its own training homes by $3,517 but misses *held-out* homes by **$33,231**, nearly ten times worse. The $3,517 was never the model's real error; it was the model grading its own homework. Only the calibration misses reveal how wrong the tree truly is on a home it has not seen, and those are the ones a trustworthy band must be built from. The worst few are eye-watering:

```r
round(sort(scores, decreasing = TRUE)[1:5])   # the five biggest misses on held-out homes
#> [1] 163787 132033 128248 121737 109884
```

That whole spread of misses is our raw material. Conformal asks exactly one thing of it: pick a width big enough that 90% of these held-out misses fall under it.

=== step === quiz
::eyebrow Check yourself
## Why hold out a calibration set?

The tree missed its training homes by $3,517 and its calibration homes by $33,231. Why must the band's width come from the calibration misses, not the (much smaller) training misses?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The tree was trained to fit those very training homes, so its misses on them are artificially tiny and tell you nothing about a new home; only misses on data it never saw estimate how wrong it will be next ::ok Exactly. A model's error on its own training data is optimistic by construction (here, wildly so), which is why conformal insists on a held-out slice. Build the width from that $3,517 and the band will be far too narrow, as you are about to see.
- The training set is smaller, so its residuals are noisier and less reliable ::no Both slices here are similar sizes (600 vs 300), and noise is not the issue. The training misses are not noisy, they are systematically too small because the tree memorized those exact homes.
- Held-out data always has larger residuals, so using it is simply a safety margin ::no It is not an arbitrary safety margin, and held-out residuals are not "always larger" as a rule. They are the *honest* estimate of the model's error on unseen data; the training residuals are biased downward by overfitting.

=== step === concept
::eyebrow Step 3
## The conformal quantile: the band half-width

Now turn "90% of the held-out misses fall under it" into a single number. Sort the calibration scores from smallest to largest and walk up to the one that leaves 90% below it. The exact rank is *not* the plain 90th percentile; it carries a small finite-sample correction:

\[ \hat q = s_{(k)}, \qquad k = \bigl\lceil (n+1)(1-\alpha) \bigr\rceil \]

Here \(s_{(k)}\) is the \(k\)-th smallest score, \(n\) is the number of calibration homes, \(\alpha\) is the miss rate you will tolerate (here \(\alpha = 0.10\), for 90% coverage), and \(\lceil\cdot\rceil\) rounds up to the next whole number. The \(n+1\) instead of \(n\) is the quiet trick of the whole method: it reserves a rank for the one new home you are about to predict, and it is what upgrades "about 90%" into a real guarantee. Watch it on our numbers:

```r
alpha <- 0.10
n_cal <- length(scores)                    # 300 calibration homes
k     <- ceiling((n_cal + 1) * (1 - alpha))
c(n_cal = n_cal, k = k)
#> n_cal     k
#>   300   271
```

With 300 calibration homes, \((n+1)(1-\alpha) = 301 \times 0.9 = 270.9\), which rounds up to \(k = 271\). So \(\hat q\) is the 271st smallest of the 300 misses:

```r
qhat <- sort(scores)[k]                     # the 271st smallest calibration miss
round(qhat)
#> [1] 74961
```

\(\hat q = \$74{,}961\). Read it plainly: on held-out homes, 271 of every 300 misses (90.3%) came in at or under $74,961. That single number is our band half-width. The four steps together are the entire recipe:

::widget process-flow {"steps":[{"title":"Split","sub":"fit on one slice, hold out a separate calibration slice"},{"title":"Score","sub":"on the calibration slice, record each miss size (the absolute residual)"},{"title":"Quantile","sub":"take a high quantile of those misses as the half-width q-hat"},{"title":"Band","sub":"predict plus or minus q-hat, then check coverage on fresh homes"}]}

Notice what is *not* in that diagram: any assumption about the errors, and any requirement that the model be good. That double absence is the entire point.

=== step === tryit
::eyebrow Your turn
## Step 4: build the band and check coverage

The last step hangs the band \(\hat y \pm \hat q\) on the model and counts how many *fresh* test homes land inside it. The code below computes each test home's prediction and marks which ones fall in the band. Fill in the blank so `coverage` is the **fraction** of test homes inside, then run it.

```r
pred_test <- predict(model, test)                                   # the tree's guess for each test home
inside    <- test$price >= pred_test - qhat & test$price <= pred_test + qhat
coverage  <- ____                                                   # fraction of test homes inside the band
round(coverage, 3)
```
::check {"regex":"mean\\(\\s*inside\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.900, exactly the 90% we promised, delivered on homes the method never saw and around a model that memorized its training set. Coverage is just the average of a TRUE/FALSE vector: mean(inside).","no":"inside is a vector of TRUE/FALSE (in the band or not). The fraction that are TRUE is their mean: coverage <- mean(inside)."}
::solution
```r
pred_test <- predict(model, test)
inside    <- test$price >= pred_test - qhat & test$price <= pred_test + qhat
coverage  <- mean(inside)                     # the fraction of test homes inside the band
round(coverage, 3)
#> [1] 0.9
```

=== step === widget
::eyebrow Feel it
## Raise the target, the band widens

That was one target (90%). The interactive below lets you feel the trade for yourself on a small dataset: push the target up toward 95% and the band widens to keep the stronger promise; drop it toward 80% and the band tightens. In every case the coverage read off the *fresh* test points tracks at or above the target you asked for, which is the guarantee made visible. Change the target and watch both the band and the empirical coverage move.

::widget conformal-bands {}

=== step === concept
::eyebrow The trap
## The calibration set is not optional

We keep insisting the scores come from held-out data. What actually happens if you cut the corner and score on the *training* homes instead? Let us do exactly that, using the tree's tiny $3,517-scale training misses to set the width:

```r
train_scores <- as.numeric(abs(train$price - predict(model, train)))   # misses on TRAINING homes
bad_qhat     <- sort(train_scores)[ceiling((nrow(train) + 1) * (1 - alpha))]
round(c(honest_qhat = qhat, training_qhat = bad_qhat))
#>   honest_qhat training_qhat
#>         74961         11986
```

The training misses hand you a half-width of $11,986 instead of the honest $74,961, a band six times too narrow. Hang *that* band on the test homes and count how many it covers:

```r
bad_inside <- test$price >= pred_test - bad_qhat & test$price <= pred_test + bad_qhat
round(mean(bad_inside), 3)                    # coverage using the too-small training width
#> [1] 0.227
```

**22.7%.** You asked for 90% coverage and got 23%. This is the single most common way to break conformal prediction, and it is silent: the code runs, the number looks like a coverage, and it is catastrophically wrong.

[WARNING]
Never score on data the model was trained on. Training residuals are optimistic (here 6x too small), so a band built from them under-covers wildly. The held-out calibration set is not a nicety, it is the load-bearing wall of the entire guarantee.

=== step === concept
::eyebrow Why it works
## Exchangeability and a rank

Why should reading a quantile off *old* misses promise anything about a *new* home? One word: **exchangeability**. The calibration homes and the new home must be interchangeable, drawn from the same process, so that before you see it, the new home's miss is just as likely to land at any rank among the calibration misses as any other. If that holds, the chance its miss lands beyond the \(k\)-th of \(n+1\) possible ranks is pinned, and coverage falls between two lines:

\[ 1-\alpha \;\le\; P\!\left(Y_{\text{new}} \in [\hat y \pm \hat q]\right) \;\le\; 1-\alpha + \frac{1}{n+1} \]

With 300 calibration homes those two fences are:

```r
c(lower = 1 - alpha, upper = round(1 - alpha + 1 / (n_cal + 1), 4))
#>  lower  upper
#> 0.9000 0.9033
```

So the guarantee reads: coverage is at least 90% and at most 90.33%, *no matter what the errors look like and no matter what model you used*, as long as the homes are exchangeable.

[KEY INSIGHT]
Split conformal is **distribution-free** (no assumption about the error shape), **finite-sample** (the guarantee holds at 300 homes, not only "as n goes to infinity"), and **model-agnostic** (it wrapped a wildly overfit tree and still hit 90%). A better model does not change the *coverage*, it only earns a *narrower* band, because sharper predictions produce smaller misses and therefore a smaller \(\hat q\).

=== step === quiz
::eyebrow Check yourself
## What did you actually guarantee?

A colleague looks at your band and says, "you used a memorizing tree, so this only works because the errors happen to be normal." Which statement about the split conformal band you built is exactly right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It only keeps its 90% promise because the errors are a normal bell curve, just like `lm`'s interval ::no The opposite. Split conformal makes *no* distributional assumption. That is why it hit 90% even wrapped around a tree that memorized its training data, where a bell-curve formula would have no reason to work.
- It guarantees at least 90% coverage on average, distribution-free and for any model, as long as new homes stay exchangeable with the calibration set ::ok Exactly. Finite-sample and distribution-free on the margin, indifferent to which model produced the predictions, and conditional only on exchangeability. The overfit tree changed the band's *width*, never its coverage.
- A larger calibration set would have made the band narrower ::no More calibration data tightens the *upper* coverage bound (the \(1/(n+1)\) term) and steadies the quantile estimate, nudging the width only slightly. The band's size is set by the model's error scale, so it is a *sharper model*, not more calibration data, that meaningfully narrows it.

=== step === concept
::eyebrow One promise left to test
## Does 90% hold for the pricey homes?

That guaranteed 90% is an average across *all* test homes. But Rohan's highest-stakes clients own the big, high-scatter homes, and Lesson 1 taught us never to trust an overall average without checking that subgroup on its own. Mark the big homes out:

```r
big <- test$sqft > 1600      # the larger, higher-variance homes
sum(big)                     # how many test homes we will scrutinise
#> [1] 138
```

138 test homes above 1,600 square feet. The band covered 90% overall, but does it cover 90% *inside* this group? Your turn.

=== step === tryit
::eyebrow Your turn
## Coverage where it counts

`inside` is TRUE for every test home whose real price fell inside its conformal band, and `big` flags the larger homes. Compute the band's coverage among the BIG homes alone, the expensive listings where a miss costs Rohan the most. Fill in the blank.

```r
# coverage = fraction inside, but computed only over the big homes
big_coverage <- ____
round(big_coverage, 3)
```
::check {"regex":"mean\\(\\s*inside\\s*\\[\\s*big\\s*\\]\\s*\\)","gate":true,"difficulty":"intermediate","ok":"About 0.812. The band's guaranteed 90% held on average, yet only 81% of the big homes landed inside. One global width cannot cover a subgroup that scatters far more than the rest.","no":"Coverage is the mean of a TRUE/FALSE vector. Restrict it to the big homes by subsetting inside with the big flag: mean(inside[big])."}
::solution
```r
big_coverage <- mean(inside[big])             # coverage among the big homes only
round(big_coverage, 3)
#> [1] 0.812
```

=== step === concept
::eyebrow The honest limit
## Marginal, not conditional

There it is, the catch. Split conformal guarantees **marginal coverage**: the fraction inside, averaged over every kind of home. It says nothing about **conditional coverage**: the fraction inside *within* a particular subgroup. With one width \(\hat q\) applied to every home, the band is too generous for the calm little homes and too tight for the wild big ones:

```r
round(c(big = mean(inside[big]), small = mean(inside[!big])), 3)
#>   big small
#> 0.812 0.975
```

97.5% of the small homes, 81.2% of the big ones, averaging out to the promised 90%. This is the exact shape of Lesson 1's failure, and vanilla split conformal, for all its guarantees, does not fix it: a constant width cannot follow a scatter that changes with size. Repairing it needs a band that *widens* where the model is uncertain, which is conformalized quantile regression, and that is where Lesson 3 picks up.

=== step === quiz
::eyebrow Check yourself
## Marginal is not conditional

The big homes came in at 81.2% coverage while the small homes hit 97.5%, and the two averaged to the promised 90%. What does this tell you, and what would fix it?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The guarantee failed; split conformal is broken and cannot be trusted ::no The guarantee held perfectly: overall coverage was 90%, exactly as promised. Marginal coverage is an *average*, and this is what averages do, so nothing broke.
- Raising the target above 90% would lift every subgroup to at least 90% ::no A higher target widens *every* band by the same q-hat, so it lifts both groups together but keeps the same imbalance; the big homes would still trail the small ones. It treats the symptom, not the cause.
- The guarantee held, but it is only marginal (an average); a single fixed width cannot follow a scatter that grows with size, so the fix is a band that *widens* where the model is less sure ::ok Exactly. The 90% was an honest average hiding an 81%/97% split. Making the width *adapt* to each input, so it stretches over the high-variance big homes, is conformalized quantile regression, where Lesson 3 begins.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take split conformal further:

- [Angelopoulos and Bates (2023), A Gentle Introduction to Conformal Prediction](https://arxiv.org/abs/2107.07511) - the modern primer; the split-conformal recipe and its coverage proof, worked slowly and in plain language.
- [Lei, G'Sell, Rinaldo, Tibshirani, and Wasserman (2018), Distribution-Free Predictive Inference for Regression](https://arxiv.org/abs/1604.04173) - the regression reference for exactly this method, where the exchangeability guarantee is stated and proved.
- [Shafer and Vovk (2008), A Tutorial on Conformal Prediction](https://www.jmlr.org/papers/v9/shafer08a.html) - the classic tutorial from two founders of the field, for the general framework behind today's special case.
- [tidymodels: conformal inference for regression](https://www.tidymodels.org/learn/models/conformal-regression/) - the same split-conformal idea done inside a real R workflow, when you want it in production rather than by hand.

=== step === complete
## Lesson 2 complete

You can now build a prediction band whose coverage is *guaranteed*, without trusting the errors to be any particular shape and without needing a good model. The recipe is four steps: **split** off a held-out calibration set, **score** each calibration miss by its absolute residual, take the **conformal quantile** \(\hat q = s_{(k)}\) with \(k = \lceil (n+1)(1-\alpha)\rceil\) as the half-width, then hang the **band** \(\hat y \pm \hat q\) and confirm coverage on fresh data. Wrapped around a tree that had memorized its training homes, it still delivered a clean 90%, distribution-free and finite-sample.

You also saw the one way to break it and its honest edge. Score on training misses instead of held-out ones and coverage collapses to 23%, because a model's error on its own data is a fantasy. And even done right, the guarantee is *marginal*, not *conditional*: one global width kept the overall 90% while covering only 81% of the pricey homes, because a fixed band cannot follow a scatter that grows with size.

Next, Lesson 3: Conformal Prediction for Classification. You will make the width *adapt* so it stretches exactly where the model is unsure (conformalized quantile regression), so a subgroup like the big homes is covered far better rather than left behind, then carry conformal from a numeric band to a prediction *set* of class labels that grows when the model hesitates.
