---
title: "Classification Lesson 1: kNN and the Curse of Dimensionality"
catalog_blurb: "How nearest-neighbor classification works, and why too many features break it."
description: "Learn k-nearest neighbors from scratch in R: the majority vote, choosing k, why distance needs scaled features, and how the curse of dimensionality breaks it."
keywords: "k-nearest neighbors, kNN, classification, curse of dimensionality, distance metric, euclidean distance, feature scaling, choosing k, machine learning, R"
post_type: "LESSON"
curriculum_id: "6.30.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-classification"
course_title: "Classification in R"
course_lesson: "1"
course_total: "6"
course_landing: "R-Classification-Course.html"
course_next: "Naive-Bayes-for-Tabular-and-Text.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 6
## kNN and the Curse of Dimensionality

You have spent the last courses predicting numbers with regression. Classification is the other half of supervised learning: instead of "how much?", it answers "which kind?". And the most intuitive classifier ever invented needs no equation at all. It just looks at who you sit next to.

Picture a music app that has labeled thousands of past tracks as **chill** or **workout**. A brand-new song arrives with no label. To guess its vibe, the app finds the handful of past songs most similar to it and lets them vote. That is k-nearest neighbors, and it is what this lesson builds, then breaks.

By the end you will be able to:

- Explain how kNN labels a new case by the majority vote of its nearest neighbors
- Measure "nearest" with a distance metric, choose **k**, and run the whole thing in R
- Say why you must scale your features, and why piling on more of them eventually backfires

**Prerequisites:** you can run R and read its output, and you know what a training set is and what a classifier does (the ML Workflow course).

::widget knn-vote {}

=== step === concept
::eyebrow The idea
## Known by the company it keeps

Here is the entire idea of kNN in one sentence: **to label a new point, find the k training points closest to it and take the majority vote of their labels.** No model is fit, no curve is drawn. The training data *is* the model.

In the chart, each dot is a past song the app already labeled. The red dots (class A) are **chill** tracks, clustered at low tempo and low energy in the lower left. The blue dots (class B) are **workout** tracks, up at high tempo and high energy. The square is our new, unlabeled track.

Click anywhere to move the new track around, and slide k. Watch the k closest dots light up, cast their votes, and color the square with whichever class wins. Drop it deep in the red cluster and it is confidently chill; drag it into the blue and it flips to workout; park it on the border and the vote gets interesting.

[NOTE]
kNN is called a **lazy learner**: it does no work at training time beyond memorizing the data. All the computation happens at prediction time, when it measures distances and counts votes.

::widget knn-vote {}

=== step === concept
::eyebrow How we measure "nearest"
## Distance is just a ruler

"Closest" only means something once we put a number on it. With two features, tempo and energy, every song is a point on a plane, and the natural ruler between two points is the straight-line **Euclidean distance**, the length of the line you would draw between them.

For a new track \(\mathbf{q}\) and a known song \(\mathbf{x}\), each described by \(p\) features, that distance is

\[ d(\mathbf{x}, \mathbf{q}) = \sqrt{\sum_{j=1}^{p} (x_j - q_j)^2} \]

where \(p\) is the number of features (here \(p = 2\)), \(x_j\) is the \(j\)-th feature of the known song, and \(q_j\) is the same feature of the new track. Subtract feature by feature, square each gap so positives and negatives both count, add them up, take the square root. With \(p = 2\) this is exactly the Pythagorean theorem.

Each lesson runs in a fresh R session, so we build a small labeled playlist right here, then measure the distance from one new track to every song:

```r
songs <- data.frame(
  title  = c("Glass","Ember","Drift","Pulse","Coast","Mellow",
             "Surge","Vertex","Blaze","Crank","Riot","Torch"),
  tempo  = c( 88,  92,  96, 100, 104, 118,
             124, 150, 156, 160, 168, 172),   # beats per minute
  energy = c(0.28,0.33,0.26,0.38,0.42,0.31,
             0.80,0.84,0.88,0.79,0.91,0.95),  # 0 = calm, 1 = intense
  mood   = c("chill","chill","chill","chill","chill","chill",
             "workout","workout","workout","workout","workout","workout"),
  stringsAsFactors = FALSE
)

# A new, unlabeled track we just discovered: 100 BPM, energy 0.45.
new_track <- c(tempo = 100, energy = 0.45)

# Straight-line (Euclidean) distance from the new track to every known song:
songs$dist <- sqrt((songs$tempo - new_track["tempo"])^2 +
                   (songs$energy - new_track["energy"])^2)

nn <- songs[order(songs$dist), c("title", "mood", "dist")]
nn$dist <- round(nn$dist, 2)
head(nn, 5)
#>   title  mood  dist
#> 4 Pulse chill  0.07
#> 5 Coast chill  4.00
#> 3 Drift chill  4.00
#> 2 Ember chill  8.00
#> 1 Glass chill 12.00
```

The five closest songs are all **chill**. So this new track's neighborhood votes chill, unanimously.

=== step === quiz
::eyebrow Check yourself
## What does kNN actually do?

You hand a trained kNN classifier a brand-new track and ask for its label. What does it do at that moment?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- It finds the k most similar tracks it already has labels for and takes their majority vote ::ok Right. kNN stores the labeled data and, at prediction time, measures distance to find the nearest k, then lets them vote. Nothing is "solved" ahead of time.
- It plugs the track into an equation whose coefficients it solved during training ::no That describes a model like logistic regression. kNN fits no equation: it is a lazy learner that just compares the new point to stored examples.
- It averages the tempo and energy of every track and compares the new one to that average ::no kNN never collapses the data to a single average. It compares the new point to individual neighbors, which is what lets it follow a wiggly boundary.

=== step === tryit
::eyebrow Your turn
## Count the votes in R

The hard part, the distances, is already done and stored in `songs$dist`. Finishing kNN is just two moves: sort the songs from nearest to farthest, keep the first **k**, and tally their moods. Fill in the blank so it takes the **k** nearest.

```r
k <- 5
ordered <- order(songs$dist)            # row indices, nearest first
nearest <- songs$mood[ordered[____]]    # take the k nearest, then tally
table(nearest)
```
::check {"regex":"1:\\s*k","gate":true,"difficulty":"beginner","ok":"That is the whole algorithm: sort, take the k nearest, count. The tally is 5 chill to 0, so kNN predicts chill.","no":"You want the first k positions of the sorted list: ordered[1:k]. The slice 1:k gives positions 1 through k, the k nearest songs."}
::solution
```r
k <- 5
ordered <- order(songs$dist)            # row indices, nearest first
nearest <- songs$mood[ordered[1:k]]     # the moods of the k nearest songs
table(nearest)                          # tally the votes
names(which.max(table(nearest)))        # the winning class
#> nearest
#> chill 
#>     5 
#> [1] "chill"
```

=== step === concept
::eyebrow The one knob
## Choosing k: jagged versus smooth

kNN has essentially one dial: **k**, how many neighbors get a vote. It matters more than it looks.

- **Small k (k = 1)** trusts the single closest song. The boundary between classes becomes jagged and twitchy, because one mislabeled or oddball track in a region flips every prediction near it. Highly flexible, easily fooled by noise.
- **Large k** averages over many neighbors. The boundary smooths out and steadies, but push k too high and you start dragging in songs from the *other* cluster, blurring real distinctions and dulling local detail.

This is the same bias-variance tradeoff that runs through all of machine learning: tiny k is low bias and high variance (it overfits the noise), big k is high bias and low variance (it oversmooths). The sweet spot is in between and is usually found by trying several values and checking which generalizes best, the subject of cross-validation later in this track.

Slide k in the widget below. At k = 1 the prediction snaps to the nearest single dot; crank k up and the vote becomes a steadier consensus of the whole neighborhood.

::widget knn-vote {}

[TIP]
A common default is to start near \(k \approx \sqrt{n}\) (the square root of your number of training points) and tune from there. With an even number of classes, pick an odd k so a vote cannot tie.

=== step === quiz
::eyebrow Check yourself
## Why not always k = 1?

A teammate argues: "The single closest song is the most similar one, so k = 1 must be the most accurate choice." Where does that reasoning go wrong?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It does not go wrong; k = 1 is the most accurate setting for kNN ::no k = 1 nails the training data (each point is its own nearest neighbor) but generalizes poorly. Perfect training accuracy is the warning sign of overfitting, not proof of a good model.
- k = 1 copies a single neighbor, so one mislabeled or unusual song flips the prediction; it has high variance and a jagged boundary ::ok Exactly. Leaning on one neighbor makes the model hypersensitive to noise. Averaging a few neighbors trades a little flexibility for a lot of stability.
- k = 1 makes the boundary too smooth and ignores local detail ::no That is the failure mode of a very LARGE k, which over-averages. k = 1 is the opposite: too jagged and too sensitive to single points.

=== step === concept
::eyebrow A hidden trap
## Distance has units: scale your features

Euclidean distance adds up feature gaps, but our two features live on wildly different scales. Tempo ranges across dozens of BPM; energy ranges from 0 to 1. In the raw sum, a 30 BPM gap contributes \(30^2 = 900\) while a huge 0.5 energy gap contributes only \(0.5^2 = 0.25\). Tempo drowns energy out completely, so kNN is secretly classifying on tempo alone.

Watch it bite. Here is a different new track at 120 BPM but high energy 0.85, a track that clearly *feels* like a workout:

```r
q2 <- c(tempo = 120, energy = 0.85)

# RAW distance, straight from the numbers as they are:
raw <- sqrt((songs$tempo - q2["tempo"])^2 + (songs$energy - q2["energy"])^2)

rr <- data.frame(title = songs$title, mood = songs$mood, raw = round(raw, 2))
head(rr[order(rr$raw), ], 5)
#>    title    mood   raw
#> 6 Mellow   chill  2.07
#> 7  Surge workout  4.00
#> 5  Coast   chill 16.01
#> 4  Pulse   chill 20.01
#> 3  Drift   chill 24.01
table(songs$mood[order(raw)][1:5])
#>   chill workout 
#>       4       1 
```

Raw kNN calls this high-energy track **chill** (4 votes to 1), purely because its tempo of 120 happens to sit near a few mid-tempo chill songs. The energy reading, the very thing that screams "workout", barely moved the distance. Now put both features on equal footing by standardizing them (subtract the mean, divide by the standard deviation, turning each into a z-score) and recompute:

```r
mu  <- c(tempo = mean(songs$tempo), energy = mean(songs$energy))
sds <- c(tempo = sd(songs$tempo),   energy = sd(songs$energy))

zt  <- (songs$tempo  - mu["tempo"])  / sds["tempo"]    # scaled tempo of each song
ze  <- (songs$energy - mu["energy"]) / sds["energy"]   # scaled energy of each song
zqt <- (q2["tempo"]  - mu["tempo"])  / sds["tempo"]    # scaled query tempo
zqe <- (q2["energy"] - mu["energy"]) / sds["energy"]   # scaled query energy

scaled <- sqrt((zt - zqt)^2 + (ze - zqe)^2)
ss <- data.frame(title = songs$title, mood = songs$mood, scaled = round(scaled, 2))
head(ss[order(ss$scaled), ], 5)
#>     title    mood scaled
#> 7   Surge workout   0.22
#> 8  Vertex workout   0.94
#> 9   Blaze workout   1.13
#> 10  Crank workout   1.27
#> 11   Riot workout   1.52
table(songs$mood[order(scaled)][1:5])
#> workout 
#>       5 
```

After scaling, the five nearest songs are all **workout**, and the prediction flips to the right answer. Same data, same k, same query: the only change was giving energy a fair say.

[KEY INSIGHT]
Distance-based methods like kNN are scale-sensitive. Always standardize (or normalize) your features before measuring distance, or whichever feature has the biggest numbers will quietly run the whole model.

=== step === concept
::eyebrow Where kNN breaks
## The curse of dimensionality

So far so good in two dimensions. Surely adding more features can only help kNN see finer similarities? This is where intuition fails, and the failure has a name: the **curse of dimensionality**.

The trouble is geometric. As you add features, the space inflates so fast that your training points spread thin, and a strange thing happens to distance itself: in high dimensions, the nearest point and the farthest point end up almost the same distance away. Formally, the ratio of the smallest distance to the largest distance creeps toward 1,

\[ \frac{d_{\min}}{d_{\max}} \longrightarrow 1 \quad \text{as } p \to \infty \]

and once that ratio is near 1, "nearest neighbor" no longer picks out anything special: everything is roughly equidistant, so the vote is barely better than guessing. We can watch it happen. The code below scatters random points in spaces of growing dimension and measures, on average, how the nearest point compares with the farthest:

```r
library(ggplot2)
set.seed(1)

# Average ratio of nearest distance to farthest distance, as features pile up:
near_over_far <- function(p, n = 300, reps = 12) {
  mean(replicate(reps, {
    pts   <- matrix(runif(n * p), n, p)   # n random points in a p-dimensional cube
    query <- runif(p)                     # one query point
    d <- sqrt(colSums((t(pts) - query)^2))
    min(d) / max(d)        # 0 = nearest stands out; near 1 = everything equally far
  }))
}

dims <- c(1, 2, 5, 10, 25, 50, 100, 250, 500)
df   <- data.frame(features = dims, near_over_far = round(sapply(dims, near_over_far), 2))
df
#>   features near_over_far
#> 1        1          0.00
#> 2        2          0.03
#> 3        5          0.17
#> 4       10          0.33
#> 5       25          0.53
#> 6       50          0.63
#> 7      100          0.74
#> 8      250          0.81
#> 9      500          0.87

ggplot(df, aes(features, near_over_far)) +
  geom_line(color = "#2f6fb0", linewidth = 1) +
  geom_point(size = 2.4) +
  scale_x_log10() +
  labs(title = "In high dimensions, the nearest point is barely nearer than the farthest",
       x = "number of features (log scale)",
       y = "nearest distance / farthest distance") +
  theme_minimal(base_size = 13)
```

At 2 features the nearest point is much closer than the farthest (ratio 0.03), exactly the contrast kNN relies on. By 500 features the nearest is 87% as far as the farthest: the neighborhood has dissolved. This is why kNN, so natural in low dimensions, struggles on raw high-dimensional data. Three practical responses:

- **Use fewer, better features.** Drop noise; keep the handful that actually separate the classes. Quality beats quantity for kNN.
- **Reduce dimensions first.** Project the data into a few informative directions with something like PCA before measuring distance.
- **Get more data, or change tools.** Denser data slows the curse; and in genuinely high-dimensional problems, models that ignore irrelevant features (trees, regularized linear models) often beat kNN outright.

[WARNING]
Adding features to a kNN model is not free. Each irrelevant feature adds noise to every distance, and enough of them will make even good neighbors indistinguishable from bad ones.

=== step === quiz
::eyebrow Check yourself
## Diagnose the drop

Your kNN model works well on tempo and energy. You add 200 more audio features, most of them noise, and accuracy gets *worse*. A teammate says, "Just standardize all the features and it will be fine." Are they right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, scaling all the features is the fix; a kNN accuracy drop always means features on different units ::no Scaling fixes one specific problem (features on different units), but it cannot rescue you from hundreds of noise features. Standardizing noise just gives you well-scaled noise.
- No: scaling helps when units differ, but the real problem here is the curse of dimensionality, distances concentrate when you pile on noise features, so the fix is FEWER, better features (or PCA), not just scaling ::ok Right. Scaling and dimensionality are two different issues. Here the neighborhoods have dissolved, so you must cut the feature count or reduce dimensions, not merely rescale.
- No: kNN simply cannot use more than a handful of features under any circumstances ::no kNN can use many features when they are informative and the data is dense. It is irrelevant, noisy features in sparse high-dimensional space that break it, not feature count alone.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Cover and Hart (1967), "Nearest Neighbor Pattern Classification" (IEEE)](https://doi.org/10.1109/TIT.1967.1053964) - the original paper that put kNN on a formal footing.
- [An Introduction to Statistical Learning, ch. 2 and 4 (free PDF)](https://www.statlearning.com/) - the gentlest treatment of kNN, k, and the bias-variance picture, with R labs.
- [Beyer et al. (1999), "When Is Nearest Neighbor Meaningful?"](https://doi.org/10.1007/3-540-49257-7_15) - the paper that proved distances concentrate in high dimensions.
- [The Elements of Statistical Learning, ch. 13 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - prototype and nearest-neighbor methods, with the full math.

=== step === complete
## Lesson 1 complete

You can now classify a new case by the majority vote of its nearest neighbors, measure "nearest" with a scaled distance, choose k with the bias-variance tradeoff in mind, and explain why heaping on features eventually makes "nearest" meaningless.

Next, Lesson 2: Naive Bayes for tabular and text. Instead of measuring distance, it reasons with probabilities, asking which class makes the evidence most likely, and it shrugs off the high-dimensional data that just sank kNN.
