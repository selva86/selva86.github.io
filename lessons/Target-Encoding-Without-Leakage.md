---
title: "Feature Engineering Lesson 2: Target Encoding Without Leakage"
catalog_blurb: "How to turn a category into a number without leaking the answer."
description: "Target encoding turns a high-cardinality category into one number, the target mean. Do it out-of-fold in R so the encoding never sees the answer it scores."
keywords: "target encoding, mean encoding, impact encoding, data leakage, out-of-fold encoding, high cardinality, categorical features, feature engineering, R"
post_type: "LESSON"
curriculum_id: "6.60.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "2"
course_total: "7"
course_landing: "R-Feature-Engineering-Course.html"
course_next: "Scaling-and-Transformations.html"
course_prev: "Encoding-Categorical-Variables.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Target Encoding Without Leakage

In Lesson 1 you one-hot encoded categories: each level became its own 0/1 column. That works until a column has hundreds of levels and the table explodes. There is a tidier trick, and a trap hiding inside it.

Meet Maya, a data scientist at a real-estate startup. She predicts a home's **sale price**, and her data labels every home with one of **40 neighborhoods**. Instead of 40 sparse columns, she replaces each neighborhood with a single number: the average price of homes there. Her model's accuracy jumps. Then she checks it the honest way, and the gain evaporates. A column built from pure noise had "explained" a third of the price. By the end of this lesson you will know exactly how that happens, and the one habit that fixes it.

You will be able to:

- Explain what target encoding is and when to reach for it instead of one-hot
- Diagnose why naive target encoding leaks the answer, worst of all for rare categories
- Encode **out-of-fold** in R so no row ever sees its own target, and smooth the rare levels

**Prerequisites:** you can run R and read its output, you know one-hot and ordinal encoding ([Lesson 1](Encoding-Categorical-Variables.html)), and you know what training data, a test set, and [data leakage](Train-Validation-Test-and-Data-Leakage.html) are.

::widget table-transform {"code":"df %>% group_by(neighborhood) %>% mutate(nb_price = mean(price)) %>% ungroup()","caption":"Target encoding swaps a neighborhood for the average price seen there: one number a model can use, instead of dozens of sparse yes/no columns.","before":{"cols":["home","neighborhood","price"],"rows":[["#1","Eastside",420],["#2","Eastside",510],["#3","Eastside",450],["#4","Harbor",880],["#5","Harbor",920],["#6","Lakeview",660]]},"after":{"cols":["home","neighborhood","price","nb_price"],"rows":[["#1","Eastside",420,460],["#2","Eastside",510,460],["#3","Eastside",450,460],["#4","Harbor",880,900],["#5","Harbor",920,900],["#6","Lakeview",660,660]]}}

=== step === concept
::eyebrow The problem
## When one-hot encoding runs out of room

One-hot encoding gives every category its own 0/1 column. For a tidy `contract` column with two levels (monthly, annual) that is perfect. But Maya's `neighborhood` has 40 levels, so one-hot turns one column into 40, almost all of them zero in any given row. Push that to real data (5,000 zip codes, 50,000 product ids) and you get a vast, sparse table that is slow to fit and starves rare levels of data.

Let us see the shape of Maya's problem. Each lesson runs in a fresh R session, so we build her homes inline (run this once):

```r
set.seed(2026)
n     <- 600
hoods <- paste0("NB", sprintf("%02d", 1:40))
w     <- 1 / seq_len(40)                                  # a few busy neighborhoods, a long rare tail
neighborhood <- sample(hoods, n, replace = TRUE, prob = w)
level <- setNames(round(runif(40, 250, 850)), hoods)      # each neighborhood's true price level ($1000s)
homes <- data.frame(
  neighborhood = factor(neighborhood, levels = hoods),
  sqft  = round(runif(n, 800, 3000)),
  price = round(level[neighborhood] + rnorm(n, 0, 35))    # price tracks the neighborhood, plus noise
)

length(unique(homes$neighborhood))                        # distinct neighborhoods in the data
#> [1] 40
sort(table(homes$neighborhood))[1:5]                      # the five rarest: some have a single sale
#> NB32 NB35 NB39 NB40 NB29
#>    1    1    2    2    3
ncol(model.matrix(~ neighborhood - 1, droplevels(homes))) # columns one-hot would create
#> [1] 40
```

Forty columns from one, and the rarest neighborhoods carry just one or two sales each. Those single-sale levels are the ones the trap will spring on. Hold that thought.

=== step === concept
::eyebrow The idea
## Target encoding: a category becomes its target's average

Target encoding (also called mean or impact encoding) throws away the 40 columns and keeps **one**. For each neighborhood it computes the average sale price of the homes in it, then replaces the neighborhood label with that number. Expensive neighborhoods get a high number, cheap ones a low number, and the model reads the category as a single, ordered, informative feature.

Write it precisely. For a category \(c\) (one neighborhood), let \(x_i\) be the category of home \(i\) and \(y_i\) its sale price. Target encoding replaces the category with the mean target over the rows in it:

\[ \hat{e}_c \;=\; \frac{1}{n_c}\sum_{i:\,x_i = c} y_i, \]

where \(n_c\) is the number of homes in category \(c\) and the sum runs over exactly those homes. In plain words: the encoded value of a neighborhood is the average price of the homes that are in it. Here are the busiest neighborhoods and the number each would become:

```r
library(dplyr)
homes %>%
  group_by(neighborhood) %>%
  summarise(n_sales = n(), avg_price = round(mean(price)), .groups = "drop") %>%
  arrange(desc(n_sales)) %>%
  head(6)
#> # A tibble: 6 x 3
#>   neighborhood n_sales avg_price
#>   <fct>          <int>     <dbl>
#> 1 NB01             143       518
#> 2 NB02              70       619
#> 3 NB03              53       506
#> 4 NB05              33       361
#> 5 NB04              31       671
#> 6 NB06              23       351
```

NB01 has 143 sales averaging $518k, so every NB01 home gets the number 518. With dozens or hundreds of sales behind it, that average is a stable, trustworthy summary. The danger lives at the other end of the table.

=== step === quiz
::eyebrow Check yourself
## What number does a one-sale neighborhood get?

In Maya's data the neighborhood **Lakeview** appears for exactly **one** home, which sold for **$660k**. Using the naive rule above (average the price over all homes in the neighborhood), what value does target encoding assign to Lakeview?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- $660k, the price of that single home ::ok Right. With one sale the category mean is just that home's own price, so the encoded feature has quietly become a copy of the answer for that row. Remember this.
- The average price across all neighborhoods ::no That is the GLOBAL mean. Target encoding uses each category's OWN mean, and Lakeview's only sale is $660k, so its mean is $660k.
- Zero, because one sale is too little data ::no Target encoding still returns a mean from whatever rows exist; with one row that mean is that row's price. The whole danger is that it hands back a value, and that value is the answer.

=== step === concept
::eyebrow The trap
## The hidden leak: the encoding peeks at its own answer

Look again at the formula and notice what is in the sum. When we encode home \(i\), the average \(\hat{e}_c\) is taken over all homes in its category, **including home \(i\) itself**. Pull that one term out:

\[ \hat{e}_c \;=\; \frac{1}{n_c}\Big( y_i \;+\!\! \sum_{\substack{j:\,x_j = c \\ j \ne i}} y_j \Big). \]

The encoded value Maya feeds the model for home \(i\) literally contains \(y_i\), the very price she is trying to predict. For a busy neighborhood with \(n_c = 143\), one home's price is a drop in the bucket and barely tilts the average. But for a single-sale neighborhood, \(n_c = 1\) and the formula collapses to \(\hat{e}_c = y_i\): the feature **is** the answer. This is [data leakage](Train-Validation-Test-and-Data-Leakage.html) wearing a disguise, not a leftover column from the raw data, but a leak Maya engineered into a feature herself.

[KEY INSIGHT]
A target-encoded value must never be allowed to see the target of the row it is scoring. Naive encoding breaks that rule for every row, and breaks it completely for rare categories.

The flip below makes the feel of a leak concrete: an honest split scores about 0.78, then flip the switch to sneak in a column built from the answer and watch the score balloon to a too-good-to-be-true 0.99.

::widget data-split {}

=== step === concept
::eyebrow The smoking gun
## Watch noise masquerade as signal

If a leaked feature looks brilliant, then a feature with **no real signal at all** should look brilliant too once we leak it. Let us prove it. We add a column of pure noise to Maya's data: a random `tag`, like a listing id, with nothing to do with price. Naive target encoding of that noise, then a one-feature model:

```r
# A column with NO link to price: a random tag, think a near-unique listing id
set.seed(99)
homes$tag <- factor(sample(paste0("T", 1:180), nrow(homes), replace = TRUE))

# Naive in-fold target encoding: each row's value = its tag's mean price, computed over
# ALL rows of that tag, including this row's own price.
naive <- homes %>% group_by(tag) %>% mutate(tag_te = mean(price)) %>% ungroup()
round(summary(lm(price ~ tag_te, data = naive))$r.squared, 2)   # how much of price does noise "explain"?
#> [1] 0.32
```

A column of random noise just "explained" 32% of sale price. That number is a mirage: with about three homes per tag, each tag's mean is dragged toward the row's own price, so the encoding partly memorises the answer. Now encode the **same** noise column the leak-free way, computing each row's tag mean from other rows only (the out-of-fold method we build next), and ask R the honest question:

```r
# Out-of-fold encoding of the SAME noise tag: each row's mean uses only OTHER folds
set.seed(7)
fold <- sample(rep(1:5, length.out = nrow(homes)))
homes$tag_oof <- NA_real_
for (k in 1:5) {
  tag_mean <- tapply(homes$price[fold != k], homes$tag[fold != k], mean)   # the other four folds
  homes$tag_oof[fold == k] <- tag_mean[as.character(homes$tag[fold == k])]
}
homes$tag_oof[is.na(homes$tag_oof)] <- mean(homes$price)   # a tag unseen in the other folds -> global mean
round(summary(lm(price ~ tag_oof, data = homes))$r.squared, 2)
#> [1] 0
```

Zero. Encoded honestly, the noise is exposed as noise. The gap between 0.32 and 0.00 is exactly the leak, and it is invisible unless you encode the right way.

=== step === concept
::eyebrow The fix
## Out-of-fold encoding

The cure follows straight from the rule: never let a row's encoded value depend on that row's own target. So compute each row's category mean from **other** rows. The clean, general way to do this is to borrow the idea of cross-validation folds.

Split the training rows into \(K\) equal groups, called folds (five is a common choice). To encode the rows in fold \(k\), use the category means computed only from the rows **not** in fold \(k\):

\[ \hat{e}_c^{(-k)} \;=\; \frac{1}{n_c^{(-k)}}\sum_{\substack{j:\,x_j = c \\ j \notin \text{fold } k}} y_j, \]

where \(n_c^{(-k)}\) counts the homes of category \(c\) that lie outside fold \(k\). Because home \(i\) sits inside fold \(k\), its own price \(y_i\) is never in that sum. Rotate through all \(K\) folds and every row gets an encoding built from data it never appears in. For a brand-new home at prediction time, there is no leakage to worry about, so you encode it with the category means from the whole training set.

::widget process-flow {"steps":[{"title":"Split into folds","sub":"cut the training rows into K equal folds, often five"},{"title":"Hold one fold out","sub":"pick fold k as the rows you are about to encode"},{"title":"Encode from the rest","sub":"set each held-out row to its category mean computed on the OTHER folds only"},{"title":"Rotate and repeat","sub":"do this for every fold, so no row ever sees its own target"}]}

=== step === tryit
::eyebrow Your turn
## Encode neighborhood out-of-fold

Here is the out-of-fold loop for the **real** `neighborhood` column. The one missing piece is the part that says "use only the other folds." Fill in both blanks so each home in fold `k` is encoded from the homes that are **not** in fold `k`.

```r
set.seed(7)
fold <- sample(rep(1:5, length.out = nrow(homes)))   # label every home with a fold 1..5
homes$nb_oof <- NA_real_

for (k in 1:5) {
  # Encode the homes in fold k using only the OTHER folds:
  nb_mean <- tapply(homes$price[____], homes$neighborhood[____], mean)
  homes$nb_oof[fold == k] <- nb_mean[as.character(homes$neighborhood[fold == k])]
}
homes$nb_oof[is.na(homes$nb_oof)] <- mean(homes$price)   # a fold may miss a rare neighborhood
round(summary(lm(price ~ nb_oof, data = homes))$r.squared, 2)
```
::check {"regex":"fold\\s*!=\\s*k","gate":true,"difficulty":"intermediate","ok":"Out-of-fold done right: each home is encoded from neighbours it never shared a fold with, so nothing leaks. The real neighborhood signal still scores about 0.93, honestly this time.","no":"Use the OTHER folds: fold != k. Indexing with fold == k would encode each home partly from itself, the leak you are removing."}
::solution
```r
set.seed(7)
fold <- sample(rep(1:5, length.out = nrow(homes)))
homes$nb_oof <- NA_real_

for (k in 1:5) {
  nb_mean <- tapply(homes$price[fold != k], homes$neighborhood[fold != k], mean)
  homes$nb_oof[fold == k] <- nb_mean[as.character(homes$neighborhood[fold == k])]
}
homes$nb_oof[is.na(homes$nb_oof)] <- mean(homes$price)
round(summary(lm(price ~ nb_oof, data = homes))$r.squared, 2)
#> [1] 0.93
```

Real signal survives the honest method (0.93), while the noise tag fell to 0.00. Out-of-fold encoding keeps what is real and discards what is fake, which is the whole point.

=== step === concept
::eyebrow The last rough edge
## Rare categories still need a hand: smoothing

Out-of-fold encoding stops a row from seeing its own answer, but it cannot conjure data that is not there. A neighborhood with two sales still gets a mean built on two numbers, which is jumpy and unreliable. The standard remedy is **smoothing**: pull each category's mean toward the overall average, hard for rare categories and barely at all for common ones.

\[ \hat{e}_c \;=\; \frac{n_c\,\bar{y}_c + m\,\bar{y}}{n_c + m}, \]

where \(\bar{y}_c\) is the category's own mean, \(\bar{y}\) is the global mean of the target, \(n_c\) is the category's size, and \(m\) is a smoothing weight you choose (read it as \(m\) imaginary homes pinned at the global average). When \(n_c\) is large the category's own mean wins; when \(n_c\) is tiny the global mean takes over. Watch the rarest neighborhoods get reeled in:

```r
global <- mean(homes$price)
m      <- 20                                   # smoothing strength: 20 pseudo-homes at the global mean
homes %>%
  group_by(neighborhood) %>%
  summarise(n_sales  = n(),
            raw_mean = round(mean(price)),
            smoothed = round((n() * mean(price) + m * global) / (n() + m)),
            .groups  = "drop") %>%
  arrange(n_sales) %>%
  head(6)
#> # A tibble: 6 x 4
#>   neighborhood n_sales raw_mean smoothed
#>   <fct>          <int>    <dbl>    <dbl>
#> 1 NB32               1      512      544
#> 2 NB35               1      338      535
#> 3 NB39               2      686      558
#> 4 NB40               2      580      548
#> 5 NB29               3      253      507
#> 6 NB36               3      657      560
```

The global mean here is about $545k. Notice NB35: its lone sale of $338k would be a wild, untrustworthy encoding, but smoothing reels it almost all the way back to $535k, because one sale is barely evidence at all. A 143-sale neighborhood would hardly move.

[TIP]
In a real project you do not hand-roll this. The tidymodels `embed` package does smoothed, out-of-fold target encoding for you inside a leak-safe recipe. Run this one locally:

```r-static
library(recipes)
library(embed)   # supervised encoding steps for recipes

rec <- recipe(price ~ neighborhood + sqft, data = train) %>%
  step_lencode_mixed(neighborhood, outcome = vars(price))   # smoothed, partially-pooled target encoding

prepped   <- prep(rec, training = train)   # learns the encoding on TRAIN only
train_enc <- bake(prepped, new_data = train)
test_enc  <- bake(prepped, new_data = test)   # new homes encoded with train means, no leak
```

=== step === quiz
::eyebrow Check yourself
## Which procedure is leak-free?

Maya wants a target-encoded `neighborhood` column she can trust when she compares models with cross-validation. Which of these is the leak-free way to build it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Compute each neighborhood's mean price on the whole dataset, then split into train and test ::no That lets the test rows help compute their own encoding, and every train row still sees its own price. The score looks great and collapses on new homes.
- For each row, use its neighborhood's mean from rows in OTHER folds only, filling unseen neighborhoods with the global mean ::ok Right. Out-of-fold encoding guarantees a row's value never depends on its own target, so the cross-validation score is honest.
- Compute each neighborhood's mean including the current row, but only on the training set ::no Splitting first stops the TEST set leaking, but inside training each row still peeks at its own price, so the feature looks stronger in cross-validation than it truly is. Encode out-of-fold.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Micci-Barreca (2001), A Preprocessing Scheme for High-Cardinality Categorical Attributes, SIGKDD Explorations 3(1)](https://doi.org/10.1145/507533.507538) - the original paper that introduced smoothed target (impact) encoding.
- [tidymodels embed package documentation](https://embed.tidymodels.org/) - the `step_lencode_*` steps that do leak-safe target encoding for you inside a recipe.
- [Kaufman et al. (2012), Leakage in Data Mining: Formulation, Detection, and Avoidance](https://doi.org/10.1145/2382577.2382579) - the canonical paper naming and dissecting data leakage.
- [Kuhn and Johnson, Feature Engineering and Selection (free online)](https://bookdown.org/max/FES/) - the chapter on encoding categorical predictors covers effect encoding and its risks in depth.

=== step === complete
## Lesson 2 complete

You can now turn a high-cardinality category into a single informative number with target encoding, see why the naive version leaks the answer (and leaks it completely for rare levels), encode out-of-fold in R so no row ever sees its own target, and smooth the rare categories so their estimates stay sane. Maya's noise-explains-a-third-of-price mirage will never fool you again.

Next, Lesson 3: Scaling and Transformations. You will center, scale, and reshape numeric features (log, Box-Cox, Yeo-Johnson), learn which models care about scale and which do not, and keep every transform leak-free by fitting it on the training data alone, the same discipline you used here.
