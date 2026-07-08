---
title: "Gradient Boosting Lesson 3: The Hyperparameters That Matter"
catalog_blurb: "The handful of boosting settings that actually move results, and how to set them."
description: "The gradient boosting hyperparameters that actually matter: trees, learning rate, depth, and regularization, how they interact, and how to set them in R."
keywords: "gradient boosting hyperparameters, learning rate, number of trees, tree depth, max_depth, regularization, min_child_weight, subsample, XGBoost, LightGBM, tuning, R"
post_type: "LESSON"
curriculum_id: "6.40.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "3"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "Early-Stopping-and-Learning-Curves.html"
course_prev: "LightGBM-and-CatBoost-in-R.html"
---

=== step === cover
::eyebrow Lesson 3 of 6
## The Hyperparameters That Matter

In Lesson 2 you met the fast production boosters and the settings they hand you: LightGBM alone exposes more than a hundred. Stare at that list and it is easy to freeze. The good news is that almost none of them decide whether your model is good. Just four do, and the rest are fine-tuning.

Sam's citywide bike-share is still our example: predict how many bikes go out on a given day from the day's temperature and whether it is a weekend. A booster keeps stacking small corrective trees, so the very first question is not "which model" but "how far do I let it go, and how big are its steps." That is what these four knobs control.

By the end of this lesson you will be able to:

- Name the four hyperparameters that actually move a booster, and say what each one does
- Explain why more trees is not always better, and read the U-shaped validation curve it produces
- Set the learning rate and the number of trees together, because they trade off against each other
- Set tree depth to match your data, and use regularization to pull an over-eager model back

**Prerequisites:** Lesson 1 ([Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html): the residual loop, the learning rate as a shrunken slice, shallow trees in sequence) and Lesson 2 ([LightGBM and CatBoost in R](LightGBM-and-CatBoost-in-R.html): you met `num_leaves` and `learning_rate` in passing). It also helps to have met overfitting as [bias versus variance](The-Bias-Variance-Tradeoff.html). You can run R and you know what a training/validation split is and what RMSE measures.

::widget learning-curve {"rounds":40}

=== step === concept
::eyebrow First, the short list
## Four knobs, not a hundred

A **hyperparameter** is a setting you choose before training, as opposed to the tree splits and leaf values the algorithm learns from the data on its own. Boosters expose dozens of them, but they are not equally important. Change most of them and your validation error barely twitches. Four of them move it a lot, and they are the same four in every gradient booster (XGBoost, LightGBM, CatBoost), just under different names.

1. **Number of trees** (how many corrective trees you add in total).
2. **Learning rate** (how big a slice of each tree you keep).
3. **Tree depth** (how complex each individual tree is allowed to be).
4. **Regularization** (extra brakes that stop any single tree from memorizing).

The whole rest of this lesson is these four, one at a time, and then the part that trips people up: they are not independent. Turn one and you often have to compensate with another.

::widget process-flow {"steps":[{"title":"Number of trees","sub":"how many corrective trees you add in total"},{"title":"Learning rate","sub":"how big a slice of each tree you keep"},{"title":"Tree depth","sub":"how complex each single tree may be"},{"title":"Regularization","sub":"extra brakes so no tree memorizes noise"}]}

=== step === concept
::eyebrow Meet the data
## Sam's days, and a booster we can turn

Every lesson starts a fresh R session, so we build the data right here. Each row is one day: the daily high temperature, whether it was a weekend, and how many bikes went out. Rentals climb with temperature and then fall on scorching days, and weekends lift demand, more so on warm days (a real temperature-by-weekend interaction we will lean on later). We make two independent sets from the same recipe: `train` to fit on, `valid` to score on.

```r
library(rpart)

make_days <- function(n, seed) {
  set.seed(seed)
  temp    <- round(runif(n, 2, 34), 1)              # daily high, degrees C
  weekend <- rbinom(n, 1, 2 / 7)                    # 1 on weekends
  rentals <- round(40 + 5 * temp - 0.14 * temp^2 +  # a hump in temperature
                   6 * weekend + 1.3 * weekend * temp +  # weekend lift, bigger when warm
                   rnorm(n, 0, 8))                   # day-to-day noise
  data.frame(temp, weekend = factor(weekend), rentals)
}

train <- make_days(160, 1)   # days we fit on
valid <- make_days(160, 2)   # held-out days we score on
head(train)
#>   temp weekend rentals
#> 1 10.5       0      80
#> 2 13.9       1     105
#> 3 20.3       0      92
#> 4 31.1       1     114
#> 5  8.5       1      84
#> 6 30.7       0      79
```

The scatter below plots temperature against rentals: a hump that peaks around a comfortable 22 degrees. No single tree fits that well, which is exactly the gap boosting closes, tree by tree.

::widget chart-plotter {"data":[{"x":2.4,"y":72},{"x":4.3,"y":78},{"x":5.5,"y":68},{"x":7.6,"y":87},{"x":8.5,"y":56},{"x":9.6,"y":91},{"x":10.5,"y":80},{"x":12.5,"y":99},{"x":13.3,"y":79},{"x":14.4,"y":82},{"x":15.9,"y":90},{"x":16.6,"y":65},{"x":17.3,"y":104},{"x":18.2,"y":112},{"x":19.7,"y":82},{"x":21.1,"y":84},{"x":22.3,"y":96},{"x":22.9,"y":119},{"x":24,"y":120},{"x":25.3,"y":90},{"x":26.5,"y":61},{"x":27.4,"y":83},{"x":29.6,"y":69},{"x":30.6,"y":61},{"x":32.2,"y":54},{"x":33.8,"y":106}],"geoms":["point"],"x":"temp","y":"rentals"}

Now a small booster we can turn. It is the exact residual loop from Lesson 1, with the four knobs exposed as arguments. It returns the training and validation RMSE (the typical prediction miss, in bikes) of the final model, so we can watch each knob move those two numbers.

```r
boost <- function(n_trees = 300, lr = 0.1, depth = 2, min_leaf = 8, subsample = 1) {
  pred_tr <- rep(mean(train$rentals), nrow(train))   # start every day at the average
  pred_va <- rep(mean(train$rentals), nrow(valid))
  if (subsample < 1) set.seed(7)
  for (m in seq_len(n_trees)) {
    resid <- train$rentals - pred_tr                 # what the model still gets wrong
    rows  <- if (subsample < 1) sample(nrow(train), round(subsample * nrow(train)))
             else seq_len(nrow(train))
    fit_df <- data.frame(temp = train$temp[rows], weekend = train$weekend[rows],
                         resid = resid[rows])         # the rows this tree fits, with the residual target
    tree  <- rpart(resid ~ temp + weekend, data = fit_df,
                   control = rpart.control(maxdepth = depth, cp = 0,
                                           minbucket = min_leaf, xval = 0))
    pred_tr <- pred_tr + lr * predict(tree, train)   # add a shrunken slice
    pred_va <- pred_va + lr * predict(tree, valid)
  }
  rmse <- function(a, b) sqrt(mean((a - b)^2))
  c(train = round(rmse(train$rentals, pred_tr), 2),
    valid = round(rmse(valid$rentals, pred_va), 2))
}

boost(n_trees = 200, lr = 0.05, depth = 2)   # a sensible baseline
#> train valid
#>  6.65  8.70
```

A validation RMSE of 8.70 bikes is our reference point. Every knob from here on is a question of pushing that number down without letting the training number run away from it.

=== step === widget
::eyebrow Knob 1
## Number of trees: more is not always better

Each boosting round adds one more corrective tree, so more trees means the model fits the *training* days ever more closely. The training error therefore falls a little every single round and never turns back up. The validation error is a different story. It falls while the trees are still learning real, repeatable demand, then bottoms out, then **climbs** once later trees start fitting the random noise in the training days. Plotted against the round number, the validation curve makes a **U**.

Drag the slider below to move where you stop. Stop too early (far left) and both curves are still high: the model has more real signal to learn. Stop too late (far right) and the training curve keeps dropping while the validation curve creeps back up: that widening gap is memorized noise.

::widget learning-curve {"rounds":40}

Let us see the U on Sam's own data. We run `boost` for a few different tree counts and read off both errors.

```r
trees <- c(50, 100, 300, 600)
sapply(trees, function(nt) boost(n_trees = nt, lr = 0.1, depth = 2))
#>       [,1] [,2] [,3] [,4]
#> train 7.06 6.66 5.90 5.16
#> valid 8.72 8.70 9.07 9.30
```

Read the bottom row left to right: validation dips to its best near 100 trees (8.70), then rises to 9.07 and 9.30 as we pile on more. The top row only ever falls. More trees kept helping the training fit and started hurting the model that matters. Finding the exact bottom of that U is the whole subject of Lesson 4; for now, just hold onto the shape.

[KEY INSIGHT]
Training error falls with every tree. Validation error makes a U. The best number of trees sits at the bottom of that U, not at the maximum you can afford.

=== step === quiz
::eyebrow Check yourself
## Is more trees always safer?

A colleague reasons: "A random forest never gets worse when you add trees, so I will just set my booster to 5,000 trees and stop worrying about it." Why is that risky for a booster?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is fine: like a forest, a booster only converges as you add trees, it never overfits from extra trees ::no That is true for a forest (independent trees, averaged) but not a booster. A booster's trees are added in sequence, each pushing harder on the training data, so past a point they fit noise and validation error rises.
- Each extra tree fits the training data a little more, so past the validation minimum the model starts memorizing noise and validation error climbs ::ok Right. Adding trees only ever lowers training error, but validation error makes a U. Run far past its minimum and you are fitting noise, which is why the number of trees is a knob you must set, not maximize.
- More trees always slow training so much that the model never finishes ::no Speed is a real cost, but it is not the reason for the risk here. The statistical problem is overfitting: past the validation minimum, extra trees make the model worse on new data, not just slower.

=== step === concept
::eyebrow Knob 2
## Learning rate: small, safe steps

The learning rate, written \(\eta\) (the Greek letter eta), is the fraction of each new tree you actually keep. Recall the booster as an additive model: after \(M\) rounds its prediction is

\[ F_M(x) = F_0(x) + \eta \sum_{m=1}^{M} h_m(x) \]

where \(F_0(x)\) is the starting guess (the mean of the target), \(h_m(x)\) is the tree grown at round \(m\) to fit the current residuals, and \(\eta\) scales every one of those trees before it is added. With \(\eta = 1\) you add each tree whole; with \(\eta = 0.05\) you add a twentieth of it. A typical value is between 0.01 and 0.3.

Why hold back? Because one tree's idea of the fix is noisy. Applied in full, the model lurches and overshoots, chasing quirks of your particular training days. Shrinking every step means no single tree can dominate, so the model creeps toward a good fit in many small, safe moves instead of a few reckless leaps.

The widget below shows exactly that trade on a simple bowl-shaped error surface, where the lowest point is the best model. Slide the learning rate and step downhill: too small and it crawls, just right and it settles into the bottom, too large and it overshoots and bounces. A booster feels the same forces.

::widget gradient-descent {}

=== step === concept
::eyebrow How knobs 1 and 2 interact
## The learning rate and the tree count trade off

Here is the first interaction, and the most important one in all of boosting. The learning rate and the number of trees are not two separate decisions. They are two ways of controlling the same thing: how far the model travels from its flat starting guess. A smaller \(\eta\) moves less per tree, so it needs *more* trees to cover the same ground. Halve the learning rate and you roughly double the trees you need.

So the pairing matters more than either number alone. Let us prove it on Sam's data with three settings.

```r
rbind(
  "lr 0.50, 300 trees" = boost(n_trees = 300, lr = 0.50, depth = 2),
  "lr 0.05, 600 trees" = boost(n_trees = 600, lr = 0.05, depth = 2),
  "lr 0.05,  60 trees" = boost(n_trees =  60, lr = 0.05, depth = 2)
)
#>                    train valid
#> lr 0.50, 300 trees  3.91  9.90
#> lr 0.05, 600 trees  5.88  9.05
#> lr 0.05,  60 trees  7.57  9.31
```

Read all three rows. The big-step model (top) drives training error way down to 3.91 but overfits: validation 9.90, the worst of the three. The small-step model with enough trees (middle) is the best on validation (9.05), the slow-and-steady winner. The small-step model with too few trees (bottom) never travels far enough: its training error is still high at 7.57, so it underfits. Same learning rate as the middle row, but starved of trees.

[KEY INSIGHT]
A low learning rate with enough trees almost always beats a high learning rate with few. In practice you fix a small \(\eta\) first, then add trees until validation stops improving. Set them together, never in isolation.

=== step === quiz
::eyebrow Check yourself
## You just cut the learning rate

You had a booster working reasonably at `lr = 0.3` with 200 trees. You cut the learning rate to `lr = 0.05` and change nothing else. What should you expect, and what should you do?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Each tree now moves the prediction much less, so with the same 200 trees the model underfits; you need to add trees to make up the distance ::ok Right. A sixth of the step size covers a sixth of the ground per tree, so 200 trees no longer reach a good fit. Lower the rate and you must raise the tree count to match, roughly in proportion.
- Nothing changes, since the final model only depends on the number of trees ::no The final model depends on the learning rate and the tree count together. At a fixed tree count, cutting the rate shrinks how far the model travels, so it underfits until you add trees.
- The smaller rate will overfit faster, so you should also cut the number of trees ::no It is the opposite. A smaller rate is more cautious and overfits more slowly, so you generally need MORE trees with it, not fewer.

=== step === concept
::eyebrow Knob 3
## Tree depth is interaction order

The third knob controls how complex each single tree is allowed to be, set by its maximum depth. This one is subtler than it looks, because depth is really controlling something specific: how many features a single tree can combine in one decision.

A depth-1 tree, a **stump**, asks exactly one question, so it can only use one feature at a time. Stack a whole boosting run of stumps and every tree is a function of a single feature, which means the model can add up "the temperature effect" and "the weekend effect" but can never say "warm *and* weekend." It is a purely **additive** model. To capture "the weekend lift is bigger on warm days," the exact interaction we built into Sam's data, a tree has to ask two questions in a row: first weekend, then temperature. That takes **depth 2**.

The depth-2 tree below does exactly that. Its maximum depth is the number of questions from the top down to a leaf, and that number is the highest-order interaction the tree can express.

::widget tree-diagram {"root":"weekend day?","l":"temp over 22C?","r":"temp over 22C?","leaves":["135 bikes","90 bikes","95 bikes","75 bikes"]}

Follow the two warm-day leaves: on a weekend, warm days rent about 135; on a weekday, warm days rent about 95, a 40-bike weekend lift. Now the two cool-day leaves: 90 on a weekend versus 75 on a weekday, only a 15-bike lift. The weekend effect depends on the temperature. A stump, with its single question, cannot represent that at all. Depth is the knob that decides how rich these combinations may get.

=== step === widget
::eyebrow Knob 3, the trade
## Deeper fits more, and overfits sooner

So a deeper tree is more expressive. But every gain in expressiveness is also a chance to memorize noise, which is the same bias-variance U you have seen for the number of trees, now driven by per-tree complexity. The widget below shows the universal shape on a simple curve fit: as you let the model get more flexible, training error keeps falling but validation error dips and then climbs. Slide the flexibility up and watch the gap open.

::widget bias-variance {}

Now the real thing, on Sam's data. We sweep the depth from a stump up to a deep tree, holding the learning rate and tree count fixed.

```r
depths <- c(1, 2, 3, 6)
sapply(depths, function(d) boost(n_trees = 300, lr = 0.05, depth = d))
#>        [,1] [,2] [,3] [,4]
#> train  8.87 6.43 6.15 5.49
#> valid 10.35 8.76 9.00 9.29
```

Read the validation row. Depth 1 is the **worst** at 10.35, and look at its training error: 8.87, also high. That is underfitting, not overfitting: a stump-only model is purely additive, so it literally cannot represent the temperature-by-weekend interaction, and it leaves real signal on the table. Depth 2 is the sweet spot (8.76): just enough to capture that one interaction. Depth 3 and 6 fit training better (6.15, 5.49) but generalize worse (9.00, 9.29): now they are overfitting. The best depth matches the interaction order your data actually has, and for a booster that is usually shallow (depth 2 to 8), never the deep trees a random forest wants.

=== step === quiz
::eyebrow Check yourself
## Why did the stump do worst?

In the sweep above, depth 1 gave the worst validation error (10.35) and also a high training error (8.87). A learner says "depth 1 is the simplest, so it must be overfitting the least, so it should be safest." Where does that reasoning go wrong here?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is right: depth 1 overfits the least, and its high validation error is just noise in the estimate ::no Both errors are high together, which is the signature of underfitting, not overfitting. If depth 1 were overfitting, its training error would be low while validation was high, and it is not: training is 8.87.
- Depth 1 is too simple for this data: a stump-only booster is additive and cannot capture the temperature-by-weekend interaction, so it underfits, high error on both sets ::ok Exactly. Simpler is not automatically safer. When the true pattern has an interaction, a purely additive (depth-1) model has too little capacity and underfits. Depth is the knob that buys just enough interaction, and here that is depth 2.
- Depth 1 trains too slowly, so 300 trees was not enough for it to converge ::no Speed is not the issue. Its high training error is a capacity ceiling: no number of additive stumps can express a two-feature interaction, so adding trees would not close the gap.

=== step === concept
::eyebrow Knob 4
## Regularization: extra brakes on each tree

The first three knobs set how far the model travels (trees and learning rate) and how complex each step may be (depth). Regularization is a family of smaller brakes that make each individual tree less able to memorize, so you can afford a longer or deeper run without overfitting. Three matter in practice.

- **Minimum leaf size.** Require every leaf to hold at least, say, 10 training rows. A leaf built from 1 or 2 rows is almost certainly fitting noise, so a floor on leaf size forbids the tiniest, most over-eager splits. (In XGBoost and LightGBM this is `min_child_weight` / `min_data_in_leaf`.)
- **Subsampling (stochastic gradient boosting).** Before growing each tree, draw a random fraction of the rows (say 60 or 80 percent) and fit that tree on only those. Each tree sees a slightly different slice, which decorrelates them and adds a dose of the averaging that makes forests resistant to noise. The strip below shows one such draw: the greyed rows sat this tree out.
- **Leaf-value penalties (L1 and L2).** Add a penalty for large leaf values so the model prefers gentle corrections. Formally, boosters like XGBoost add to each tree a cost \(\Omega(h) = \gamma T + \tfrac{1}{2}\lambda \sum_{j=1}^{T} w_j^2\), where \(T\) is the number of leaves in the tree, \(w_j\) is the value on leaf \(j\), \(\lambda\) (lambda) is the L2 penalty that shrinks those values, and \(\gamma\) (gamma) charges a fixed price per extra leaf. Both make trees simpler and their corrections smaller.

::widget bootstrap-sample {"tail":"The greyed rows sat this tree out. Each tree seeing a different subset is stochastic gradient boosting, a regularizer."}

Let us watch the minimum-leaf-size brake rescue an over-eager model. We deliberately overdo it, depth 6 at a brisk learning rate for 400 trees, then vary only the leaf-size floor.

```r
rbind(
  "min_leaf  2" = boost(n_trees = 400, lr = 0.1, depth = 6, min_leaf = 2),
  "min_leaf 10" = boost(n_trees = 400, lr = 0.1, depth = 6, min_leaf = 10),
  "min_leaf 20" = boost(n_trees = 400, lr = 0.1, depth = 6, min_leaf = 20)
)
#>             train valid
#> min_leaf  2  2.50 10.44
#> min_leaf 10  4.67  9.52
#> min_leaf 20  6.33 10.10
```

With a floor of 2, the model memorizes: training error is a tiny 2.50 while validation is a miserable 10.44, a huge gap. Raise the floor to 10 and the brake bites: training rises to 4.67 (the model is allowed to fit less), and validation drops to 9.52. That is regularization working, trading a little training fit for a lot less overfitting. But push the floor to 20 and you have over-braked: validation climbs back to 10.10, because now the leaves are too coarse to capture real structure. Regularization has its own sweet spot, exactly like every other knob.

Subsampling follows the same pattern, with a caveat worth stating: on a small, clean dataset like Sam's 160 days it can even hurt slightly, because there is little noise to average away. It earns its keep on large, noisy data, where seeing a different slice per tree is a real advantage.

=== step === tryit
::eyebrow Your turn
## Apply the brake

The call below is the over-eager model from above: depth 6, `lr = 0.1`, 400 trees, with a leaf-size floor of just 2, so it overfits (training 2.50, validation 10.44). Change the minimum leaf size to `10` so each leaf must hold at least ten training days, then run it.

```r
boost(n_trees = 400, lr = 0.1, depth = 6, min_leaf = ____)
```
::check {"regex":"min_leaf\\s*=\\s*10","gate":true,"difficulty":"intermediate","ok":"That floor forbids the tiniest, noise-fitting leaves. Validation improves from 10.44 to 9.52 while training rises to 4.67, the fingerprint of regularization: a little less training fit for much less overfitting.","no":"Set the leaf-size floor to ten: min_leaf = 10. That requires every leaf to hold at least ten training rows."}
::solution
```r
boost(n_trees = 400, lr = 0.1, depth = 6, min_leaf = 10)
#> train valid
#>  4.67  9.52
```

=== step === concept
::eyebrow Putting it together
## The knobs interact, so tune them in order

You have now seen every knob move validation error, and you have seen two of them interact (a lower learning rate needs more trees). That interaction is the general rule, not an exception. Turn one knob and you usually have to compensate with another.

| Turn this up | And compensate with | Why |
|---|---|---|
| Learning rate down | More trees | Smaller steps cover less ground per tree |
| Tree depth up | Fewer trees, more regularization | Deeper trees are stronger, so they peak sooner and overfit faster |
| Regularization up | Deeper trees or more trees can now be afforded | The brakes let a more flexible model behave |

That depth-and-trees link is real and measurable: in the depth sweep earlier, the deeper models reached their best validation score in *fewer* rounds (a stump kept improving out to round 299, while the depth-6 model peaked around round 93). Stronger trees travel faster, so they need fewer of them.

Because the knobs interact, the practical move is to tune them in a sensible order rather than all at once. A recipe that works:

::widget process-flow {"steps":[{"title":"Fix a low learning rate","sub":"start around 0.05 to 0.1 and leave it"},{"title":"Set the number of trees","sub":"add trees until validation stops improving (early stopping, Lesson 4)"},{"title":"Tune tree depth","sub":"try shallow depths, pick the best validation, usually 2 to 8"},{"title":"Add regularization","sub":"raise the leaf-size floor and subsample to close any remaining gap"}]}

=== step === tryit
::eyebrow Your turn
## Fix the overfit with the recipe

Start from the same over-eager model: 400 trees at `lr = 0.1` overfit badly at depth 6. Apply the recipe. We have already dropped the learning rate to 0.05 and set a leaf-size floor of 10 for you; your job is the depth. Set it to the value that matched this data's interaction order (you found it in the depth sweep), then run.

```r
boost(n_trees = 400, lr = 0.05, depth = ____, min_leaf = 10)
```
::check {"regex":"depth\\s*=\\s*2\\b","gate":true,"difficulty":"intermediate","ok":"That is the interaction order of Sam's data. Validation falls to about 9.04, well below the overfit model's 10.44, and no single heroic knob did it: a low rate, a matched depth, and a leaf floor together. The tree count is still not perfectly set, which is exactly what early stopping fixes next.","no":"The depth sweep found depth 2 was best here (it captures the one temperature-by-weekend interaction without overfitting). Set depth = 2."}
::solution
```r
boost(n_trees = 400, lr = 0.05, depth = 2, min_leaf = 10)
#> train valid
#>  6.42  9.04
```

=== step === concept
::eyebrow The same four knobs, real names
## Where these live in XGBoost and LightGBM

You tuned the four knobs on a hand-rolled booster so you could see each one move. In a production booster the ideas are identical; only the argument names change. Here is the map, and the same recipe written for real (install and run these in your own R, they are compiled packages).

| The knob | XGBoost | LightGBM |
|---|---|---|
| Number of trees | `nrounds` | `num_iterations` |
| Learning rate | `eta` | `learning_rate` |
| Tree depth | `max_depth` | `max_depth` / `num_leaves` |
| Min leaf size | `min_child_weight` | `min_data_in_leaf` |
| Subsampling | `subsample`, `colsample_bytree` | `bagging_fraction`, `feature_fraction` |
| Leaf penalties | `lambda` (L2), `alpha` (L1), `gamma` | `lambda_l2`, `lambda_l1`, `min_gain_to_split` |

```r-static
library(xgboost)

X <- model.matrix(rentals ~ temp + weekend - 1, data = train)
dtrain <- xgb.DMatrix(X, label = train$rentals)

params <- list(
  objective        = "reg:squarederror",
  eta              = 0.05,   # learning rate: small, safe steps
  max_depth        = 2,      # tree depth: match the interaction order
  min_child_weight = 10,     # min leaf size: no tiny, noise-fitting leaves
  subsample        = 0.8,    # stochastic gradient boosting
  lambda           = 1       # L2 penalty on leaf values
)
fit <- xgb.train(params, dtrain, nrounds = 400)   # number of trees
```

Every argument you set there is one of the four knobs from this lesson. Learn the four ideas once and you can tune any booster, whatever it chooses to call them.

=== step === concept
::eyebrow Go deeper
## References

- [The Elements of Statistical Learning, ch. 10 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - section 10.11 "Right-Sized Trees for Boosting" is the source for depth as interaction order, and 10.12 covers shrinkage (the learning rate).
- [Friedman (2002), Stochastic Gradient Boosting, Computational Statistics and Data Analysis 38(4)](https://doi.org/10.1016/S0167-9473(01)00065-2) - the paper that introduced subsampling rows per tree as a regularizer.
- [Chen and Guestrin (2016), XGBoost: A Scalable Tree Boosting System, KDD](https://doi.org/10.1145/2939672.2939785) - defines the regularized objective with the leaf penalties \(\gamma\) and \(\lambda\) you met here.
- [XGBoost docs: Notes on Parameter Tuning](https://xgboost.readthedocs.io/en/stable/tutorials/param_tuning.html) - practical advice on the same knobs and the order to turn them.
- [LightGBM docs: Parameters Tuning](https://lightgbm.readthedocs.io/en/latest/Parameters-Tuning.html) - the LightGBM names for every knob in the table above.

=== step === complete
## Lesson 3 complete

You now know the four hyperparameters that actually move a gradient booster, and, just as important, how they interact. The **number of trees** and the **learning rate** trade off (a lower rate needs more trees, and slow-and-steady generalizes best). **Tree depth** buys interaction order (too shallow underfits real interactions, too deep overfits, so a booster stays shallow). **Regularization** (leaf-size floors, subsampling, L1/L2 penalties) puts extra brakes on each tree, with its own sweet spot. You saw all of it on Sam's data, and you tuned an over-eager model back into shape with a sensible recipe.

You also met the picture at the heart of it: the U-shaped validation curve from the number-of-trees knob. Next, Lesson 4: Early Stopping and Learning Curves. You will learn to read that curve properly and let the booster find the bottom of the U for you, so you never have to guess the number of trees by hand again.
