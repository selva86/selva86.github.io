---
title: "Feature Engineering Lesson 2: Target Encoding Without Leakage"
catalog_blurb: "Encode a category by its average outcome without leaking the answer."
description: "Target encoding replaces a high-cardinality category with its mean outcome. Do it out-of-fold in R so the encoding never leaks the answer, and smooth rare levels."
keywords: "target encoding, impact encoding, mean encoding, data leakage, out-of-fold encoding, high cardinality, smoothing, feature engineering, R"
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

In Lesson 1, Maya turned her used-car listings into numbers a model can read: one-hot for `body`, ordinal for `condition`. One column fought back. `brand` has dozens of makes, and one-hot exploded it into dozens of sparse columns that break on any make her data had never seen.

We ended with a tempting fix: replace each brand with the average price of cars in that brand. One tidy numeric column, and a strong one, because expensive makes really do sell for more. It is called **target encoding**, and it is the most powerful way to tame a high-cardinality column. It is also the easiest to get catastrophically wrong.

By the end of this lesson you will be able to:

- Compute a target encoding: replace a category with the average outcome of its rows
- See, in real numbers, how a careless target encoding leaks the answer and makes even pure noise look predictive
- Encode out-of-fold so no row ever sees its own outcome, and smooth rare categories so they behave
- Encode brand-new data the model has never seen, safely

**Prerequisites:** you can run R and read its output, you met encoding in [Encoding Categorical Variables](Encoding-Categorical-Variables.html), and you know what a train/test split and data leakage are (from [Train, Validation, Test, and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)).

Here is the whole journey. We earn each step.

::widget process-flow {"steps":[{"title":"Replace with the average","sub":"swap each brand for the mean price of its cars: one strong numeric column"},{"title":"Spot the leak","sub":"a plain average includes the very row it will score, so the score looks too good and fails in the wild"},{"title":"Encode out-of-fold and smooth","sub":"score each row from OTHER rows only, then pull rare brands toward the overall mean"}]}

=== step === concept
::eyebrow The idea
## A category becomes its average outcome

Target encoding answers the high-cardinality problem with one move: replace each category with the average of the target over the rows in that category. For Maya, the target is `price`, so each brand becomes the mean price of the cars that carry it. Toyotas that averaged $14k become 14; BMWs that averaged $27k become 27. The dozens of brand names collapse into a single, meaningful number.

Written out, the target encoding of a category \(c\) is

\[ \text{TE}(c) \;=\; \frac{1}{n_c} \sum_{i \,:\, \text{brand}_i = c} y_i, \]

where \(y_i\) is the target for row \(i\) (here, the car's price), \(n_c\) is the number of rows whose brand equals \(c\), and the sum runs over exactly those rows. In words: add up the prices of every car of that brand and divide by how many there are. That is all target encoding is, an average.

Notice one thing before we go on, because it turns out to be the whole story of this lesson: for a brand with many cars the average is stable, but for a brand with a single car the "average" is just that one car's price. Watch the code column appear.

::widget table-transform {"code":"df %>% group_by(brand) %>% mutate(brand_te = mean(price))","caption":"Target encoding swaps each brand for the mean price of its cars. The two Toyota rows share one code (their average, 14.2); a brand seen once (like BMW) simply gets its own price back.","before":{"cols":["brand","price"],"rows":[["Toyota",13.5],["BMW",26.8],["Toyota",14.9],["Ford",15.2]]},"after":{"cols":["brand","price","brand_te"],"rows":[["Toyota",13.5,14.2],["BMW",26.8,26.8],["Toyota",14.9,14.2],["Ford",15.2,15.2]]}}

=== step === concept
::eyebrow In R
## Build the data and read the codes

Each lesson runs in a fresh R session, so we build Maya's listings right here. There are 40 cars across six makes and, on purpose, exactly one Tesla: the rare level that will expose the leak in a moment.

```r
library(dplyr)

set.seed(1)
brand <- c(rep("Toyota", 10), rep("Ford", 9), rep("Honda", 8),
           rep("Kia", 7), rep("BMW", 5), "Tesla")     # 40 cars; Tesla appears once
base_price <- c(Toyota = 14, Ford = 15, Honda = 16, Kia = 12, BMW = 27, Tesla = 41)
cars <- data.frame(
  brand = brand,
  price = round(as.numeric(base_price[brand]) + rnorm(40, 0, 2), 1),  # price in $1000s
  stringsAsFactors = FALSE
)
table(cars$brand)
#>
#>    BMW   Ford  Honda    Kia  Tesla Toyota
#>      5      9      8      7      1     10
```

Now the encoding itself: group the rows by brand and give every row its brand's mean price.

```r
naive <- cars %>%
  group_by(brand) %>%
  mutate(brand_te = mean(price)) %>%
  ungroup()

naive %>% distinct(brand, brand_te) %>% arrange(brand)
#> # A tibble: 6 × 2
#>   brand  brand_te
#>   <chr>     <dbl>
#> 1 BMW        26.5
#> 2 Ford       15.4
#> 3 Honda      16.2
#> 4 Kia        12.0
#> 5 Tesla      42.5
#> 6 Toyota     14.3
```

Six brands, six numbers. BMW encodes to 26.5, Kia to 12.0, and the model now has one clean column that already separates expensive makes from cheap ones. It looks like a free win. The next step shows the bill.

=== step === quiz
::eyebrow Check yourself
## What is the code?

Maya target-encodes `brand`. Honda appears on 8 cars whose prices average 16.2 (in $1000s). What number does every Honda row receive as its `brand_te`?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Each Honda gets a different code, one per car ::no Target encoding gives every row of the same category the SAME code: the category's average outcome. All 8 Hondas share one number.
- 16.2, the average price of the 8 Honda cars ::ok Right. Target encoding replaces a category with the mean of the target over its rows, so all 8 Hondas encode to their shared average, 16.2.
- 8, the number of Honda cars ::no That is frequency encoding (replace a level with how often it appears), a different method from Lesson 1. Target encoding uses the average of the target, not the count.

=== step === concept
::eyebrow The trap
## The average includes the very row it scores

Look again at how a single row got its code. To build the code for a Toyota, we averaged all ten Toyotas, and that average included the price of the very car we are about to hand the code to. The feature we built to predict a car's price was computed using that car's own price.

For a common brand this is a small nudge: one car out of ten barely moves the mean. But for a rare brand it is total. Tesla appears once, so its "average" is nothing but its own price:

```r
naive %>% filter(brand == "Tesla") %>% select(brand, price, brand_te)
#> # A tibble: 1 × 3
#>   brand price brand_te
#>   <chr> <dbl>    <dbl>
#> 1 Tesla  42.5     42.5
```

The code (42.5) equals the answer (42.5). We have handed the model a column that, for this row, literally contains the price it is supposed to predict. That is **target leakage**: a feature carrying information you would not have at prediction time. On a genuinely new Tesla, whose price you do not yet know, you could not compute 42.5. The switch below lets you feel what a leaked feature does to a score: flip it on and watch the accuracy jump to a number too good to be true.

::widget data-split {}

=== step === concept
::eyebrow The smoking gun
## A column of pure noise "explains" the price

If leakage only meant a rare level copying its own answer, you might shrug. Here is why you cannot. Let us build a column of complete nonsense, a random id with no connection to price whatsoever, target-encode it naively, and measure how well it predicts.

```r
set.seed(7)
cars$rand_id  <- factor(sample(1:25, nrow(cars), replace = TRUE))  # pure noise: random ids
cars$noise_te <- ave(cars$price, cars$rand_id)   # naive target encoding = the within-id mean

fit_naive <- lm(price ~ noise_te, data = cars)
round(summary(fit_naive)$r.squared, 2)
#> [1] 0.81
```

An \(R^2\) of 0.81 says this one column accounts for 81% of the variation in price. From random numbers. That is impossible, and that is exactly the tell: because so many random ids appear only once or twice, their naive code is (nearly) their own price, so `noise_te` is a smuggled copy of `price`. If Maya trusted this, she would ship a "feature" that is pure noise and watch it collapse the moment real cars arrive.

[WARNING]
Naive target encoding does not just leak a little on rare levels. It can make a completely worthless column look like your best predictor. Any score you compute this way is a lie, and the higher the cardinality, the bigger the lie.

=== step === quiz
::eyebrow Check yourself
## Why the score lies

Maya naively target-encodes her columns, fits a model, and gets a great cross-validation score. She is thrilled. Why is that score untrustworthy?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It is ordinary overfitting; a smaller model or more data would fix it ::no This is not garden-variety overfitting. The features themselves were built from the target, so even the validation rows were scored with codes that peeked at their own answers. Shrinking the model does not remove a leak baked into the feature.
- Nothing is wrong; the codes are just numbers, and a good score is a good score ::no The codes are numbers built from the outcome. A single-row category's code IS its price, so the "prediction" is partly a copy of the answer. The score measures the leak, not real skill.
- The encoding used each row's own outcome, so the features already contain the answer the model is tested on ::ok Exactly. Every code was computed from a group that included the row itself, so the features smuggle in the target. The score reflects that leak and will not survive on genuinely new cars.

=== step === concept
::eyebrow The fix
## Encode each row from the OTHER rows

The leak has a single cause: a row's code was built using that row. So remove the row from its own code. That is the whole idea of **out-of-fold** encoding.

Split the rows into a handful of equal groups, called **folds**. To encode the rows in fold 1, compute the brand averages using only folds 2 through 5, then look those averages up for fold 1. Repeat for every fold. Each row ends up with a code built entirely from OTHER rows, so no row can ever see its own price.

::widget process-flow {"steps":[{"title":"Split into K folds","sub":"randomly divide the rows into 5 equal groups"},{"title":"Encode each fold from the others","sub":"for fold k, average price by brand over the other 4 folds, then look those codes up for fold k"},{"title":"Fallback for the unseen","sub":"a brand missing from the other folds gets the overall mean price"}]}

Here it is in R. The loop is deliberately explicit: for each fold, take the other rows, average their price by brand, and assign those codes to the held-out fold.

```r
set.seed(2)
K <- 5
cars$fold   <- sample(rep(1:K, length.out = nrow(cars)))  # 40 rows into 5 folds
global_mean <- mean(cars$price)                           # the overall average price, 16.76

cars$brand_oof <- NA_real_
for (k in 1:K) {
  in_fold <- cars$fold == k
  others  <- cars[!in_fold, ]                        # every row NOT in fold k
  means   <- tapply(others$price, others$brand, mean) # brand averages from the others
  codes   <- means[cars$brand[in_fold]]              # look them up for this fold
  codes[is.na(codes)] <- global_mean                 # a brand absent elsewhere -> overall mean
  cars$brand_oof[in_fold] <- codes
}

cars %>% filter(brand == "Tesla") %>% select(brand, price, fold, brand_oof)
#>   brand price fold brand_oof
#> 1 Tesla  42.5    4     16.76
```

Tesla is alone, so when it sits in fold 4, no other fold contains a Tesla. There is no Tesla average to borrow, so it falls back to the overall mean, 16.76, instead of its own 42.5. The leak is closed: its code no longer knows its price.

=== step === concept
::eyebrow The proof
## Now the noise looks like noise again

Remember `rand_id`, the pure-noise column that naively "explained" 81% of price? Encode it the same out-of-fold way and ask again.

```r
cars$noise_oof <- NA_real_
for (k in 1:K) {
  in_fold <- cars$fold == k
  others  <- cars[!in_fold, ]
  means   <- tapply(others$price, others$rand_id, mean)
  codes   <- means[as.character(cars$rand_id[in_fold])]
  codes[is.na(codes)] <- global_mean
  cars$noise_oof[in_fold] <- codes
}

fit_oof <- lm(price ~ noise_oof, data = cars)
round(summary(fit_oof)$r.squared, 2)
#> [1] 0
```

From 0.81 to 0. Out-of-fold encoding did not merely shave the leak; it erased it. A random column now correctly explains none of the price, because each code was built from rows the encoded row has no real relationship with. The very same procedure that unmasks noise as noise also lets a genuinely useful column, like `brand`, keep the signal it truly has.

[KEY INSIGHT]
Out-of-fold encoding is the difference between a score you can trust and one you cannot. If a target-encoded feature still looks predictive after you encode it out-of-fold, the signal is real.

=== step === quiz
::eyebrow Check yourself
## Why out-of-fold works

In the loop, each fold's codes are computed with `others <- cars[!in_fold, ]`, the rows NOT in that fold. Why does building a fold's codes from the other folds remove the leak?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Because a row's code is now an average of OTHER rows, it can no longer contain that row's own outcome ::ok Exactly. The row is excluded from the group that builds its code, so the code carries only information from other cars, never the answer it will be scored against.
- Because averaging more rows always makes the estimate more accurate ::no More rows can help stability, but that is not the point here. Even with the same rows, the fix is EXCLUSION: the row being encoded is left out of its own average.
- Because five folds is enough rows that leakage becomes too small to matter ::no The leak is removed by construction, not diluted by size. Each row is scored with a code that never saw it, so there is nothing left to leak, at any fold count.

=== step === concept
::eyebrow Fix 2
## Smooth the rare brands toward the middle

Out-of-fold encoding stops a row from seeing its own price, but it leaves a subtler problem. A brand with two or three cars has an average built on almost no evidence, so its code swings wildly on luck alone. We can trust a Toyota average built from ten cars; we should not trust a code built from one or two.

**Smoothing** (also called shrinkage) fixes this by blending each brand's own average with the global average, weighted by how much data the brand has:

\[ \text{TE}_{\text{smooth}}(c) \;=\; \frac{n_c\,\bar{y}_c \;+\; m\,\bar{y}}{n_c + m}, \]

where \(\bar{y}_c\) is the brand's own mean price, \(\bar{y}\) is the global mean price, \(n_c\) is the number of cars of that brand, and \(m\) is a **smoothing weight**: a number of imaginary "pseudo-cars" all sitting at the global mean. When a brand has many cars (\(n_c\) much larger than \(m\)), the formula leans on its own average. When it has few (\(n_c\) small), the global mean dominates and pulls the code toward the middle.

Take Tesla, with one car at 42.5, a global mean of 16.76, and \(m = 10\):

\[ \frac{1 \times 42.5 \;+\; 10 \times 16.76}{1 + 10} \;=\; \frac{210.1}{11} \;=\; 19.1. \]

Its wild 42.5 is pulled almost all the way back to the average. Now the whole table:

```r
m <- 10
global_mean <- mean(cars$price)

smoothed <- cars %>%
  group_by(brand) %>%
  summarise(n = n(), cat_mean = mean(price), .groups = "drop") %>%
  mutate(brand_smooth = (n * cat_mean + m * global_mean) / (n + m))
smoothed
#> # A tibble: 6 × 4
#>   brand      n cat_mean brand_smooth
#>   <chr>  <int>    <dbl>        <dbl>
#> 1 BMW        5     26.5         20.0
#> 2 Ford       9     15.4         16.1
#> 3 Honda      8     16.2         16.5
#> 4 Kia        7     12.0         14.8
#> 5 Tesla      1     42.5         19.1
#> 6 Toyota    10     14.3         15.5
```

::widget table-transform {"code":"df %>% mutate(brand_smooth = (n * cat_mean + 10 * 16.76) / (n + 10))","caption":"Smoothing blends each brand mean with the overall mean (16.76), weighted by count. Toyota (10 cars) barely moves; Tesla (1 car) is pulled from 42.5 almost all the way to the middle.","before":{"cols":["brand","n","cat_mean"],"rows":[["Toyota",10,14.3],["Kia",7,12.0],["BMW",5,26.5],["Tesla",1,42.5]]},"after":{"cols":["brand","n","cat_mean","brand_smooth"],"rows":[["Toyota",10,14.3,15.5],["Kia",7,12.0,14.8],["BMW",5,26.5,20.0],["Tesla",1,42.5,19.1]]}}

=== step === quiz
::eyebrow Check yourself
## What does m do?

In the smoothing formula, \(m\) is the smoothing weight. Maya sets \(m = 10\). One make appears on 2 cars; another appears on 200. What does raising \(m\) do?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It pulls every brand's code equally toward the global mean, large and small alike ::no The pull depends on \(n_c\) relative to \(m\). A 200-car make barely notices m = 10; a 2-car make is dominated by it. The shrinkage is deliberately uneven.
- It pulls small brands strongly toward the global mean while leaving well-populated brands almost untouched ::ok Right. m acts like that many pseudo-cars at the global mean, so it overwhelms a 2-car average but is negligible against 200 real cars. Bigger m means more caution about thin evidence.
- It has no effect once you already encode out-of-fold ::no Out-of-fold removes the leak; smoothing handles a different problem, noisy averages from tiny samples. Raising m trades a rare brand's shaky own-average for the safer global mean.

=== step === tryit
::eyebrow Your turn
## Encode a fresh batch, safely

New listings arrive every day, and some are makes Maya has never sold before. To score them, learn the encoding map from all the labelled cars you have, then look up each new brand. First, the setup (run it):

```r
enc_map     <- tapply(cars$price, cars$brand, mean)  # the code for each known brand
global_mean <- mean(cars$price)

new_cars <- data.frame(
  brand = c("Toyota", "BMW", "Kia", "Genesis"),      # Genesis: a make never seen before
  stringsAsFactors = FALSE
)
new_cars$brand_te <- as.numeric(enc_map[new_cars$brand])   # look up each brand's code
new_cars$brand_te   # Genesis has no code yet, so it is NA
#> [1] 14.28000 26.54000 12.01429       NA
```

A make the training data never saw has no code, so it comes back `NA`. Fill the blank so any unseen make falls back to the overall mean price instead of a missing value.

```r
new_cars$brand_te[is.na(new_cars$brand_te)] <- ____
new_cars
```
::check {"regex":"global_mean","gate":true,"difficulty":"intermediate","ok":"That is the safe fallback: an unseen make gets the overall average price, never NA and never an error at prediction time.","no":"Replace the missing code with the overall mean you computed: global_mean."}
::solution
```r
new_cars$brand_te[is.na(new_cars$brand_te)] <- global_mean
new_cars
#>     brand brand_te
#> 1  Toyota 14.28000
#> 2     BMW 26.54000
#> 3     Kia 12.01429
#> 4 Genesis 16.76000
```

=== step === concept
::eyebrow Putting it together
## The recipe you will actually use

Target encoding, done right, is three ideas stacked:

1. **Out-of-fold** for the rows you train on, so no training row ever sees its own outcome.
2. **A full-data map** for new rows, learned from all your labelled data and applied at prediction time, with the global mean as the fallback for unseen levels.
3. **Smoothing** on top, so a category with thin data leans on the global mean instead of a shaky average.

When is it worth the trouble? Weigh it against the encodings from Lesson 1.

| Encoding | Best when | Watch out for |
|---|---|---|
| One-hot / dummy | few categories, no order | explodes with high cardinality; breaks on unseen levels |
| Frequency | the count itself carries signal | two equally common levels collide on one number |
| Target (out-of-fold + smoothed) | high cardinality with a real link to the outcome | leaks the answer unless out-of-fold; needs enough rows per level |

[NOTE]
Everything here used a numeric target (price), so the code is a mean. For a yes/no target the same recipe applies with the average of a 0/1 outcome, which is simply the class rate within the category. The leak, and the out-of-fold cure, are identical.

You rarely have to hand-write the loop in production. In tidymodels, `embed::step_lencode_mixed()` learns a smoothed, partially pooled target encoding inside a recipe: it is fit on the training data and applied to new data automatically, and it is out-of-fold by construction. Knowing the loop above is what lets you trust that step instead of fearing it.

=== step === concept
::eyebrow Go deeper
## References

Authoritative places to take this further:

- [Micci-Barreca (2001), A preprocessing scheme for high-cardinality categorical attributes](https://doi.org/10.1145/507533.507538) - the original paper that introduced target (impact) encoding and the smoothing formula you used here.
- [embed: step_lencode_mixed() reference](https://embed.tidymodels.org/reference/step_lencode_mixed.html) - the tidymodels step that does smoothed, out-of-fold target encoding inside a modeling pipeline.
- [scikit-learn: target encoding with cross-fitting](https://scikit-learn.org/stable/auto_examples/preprocessing/plot_target_encoder_cross_val.html) - a runnable demonstration that a non-cross-fitted target encoding overfits, and that the out-of-fold version you built here fixes it.
- [category_encoders: TargetEncoder](https://contrib.scikit-learn.org/category_encoders/targetencoder.html) - a clear, practical explanation of smoothing and cross-fold target encoding, useful whatever language you work in.

=== step === complete
## Lesson 2 complete

You can now wield the most powerful high-cardinality encoding without cutting yourself on it. Target encoding replaces a category with its average outcome; a naive average leaks the answer and can make pure noise look like your best feature; out-of-fold encoding removes that leak by scoring every row from OTHER rows; smoothing steadies the rare categories; and a full-data map with a global-mean fallback safely encodes cars you have never seen.

Next, Lesson 3: Scaling and Transformations. Some models do not care how large your numbers are; others are dominated by whichever feature happens to be measured in the biggest units. You will center, scale, and reshape skewed columns so every feature gets a fair say, and learn which models need it and which do not.
