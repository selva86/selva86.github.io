---
title: "Feature Engineering Lesson 1: Encoding Categorical Variables"
catalog_blurb: "Turn category columns into numbers a model can use, without inventing fake order."
description: "Encode categorical variables in R: one-hot and dummy coding for nominal data, ordinal coding for ordered levels, and how to handle high-cardinality columns."
keywords: "encoding categorical variables, one-hot encoding, dummy variables, ordinal encoding, high cardinality, label encoding, model.matrix, feature engineering, R"
post_type: "LESSON"
curriculum_id: "6.60.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "1"
course_total: "7"
course_landing: "R-Feature-Engineering-Course.html"
course_next: "Target-Encoding-Without-Leakage.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Encoding Categorical Variables

Maya runs a small used-car listing site. She wants to predict a car's resale price from its details, and her data describes each car with words: transmission is `manual` or `automatic`, the body is `sedan`, `hatchback`, or `SUV`, the condition runs `poor` to `excellent`, and the brand is one of dozens of makes. A model, though, only does arithmetic. It cannot multiply the word "automatic" by anything.

Encoding is how we hand a model those words as numbers, and doing it carelessly teaches the model things that are not true. By the end of this lesson you will be able to:

- Explain why numbering categories `1, 2, 3` can mislead a model
- One-hot, dummy, and ordinal encode variables in R, and read the result
- Pick an encoding for a column with hundreds of categories, and say what it costs

**Prerequisites:** you can run R and read its output, and you know what a model, a feature, and a train/test split are (from [Train, Validation, Test, and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)).

There is no single right encoding, only the right one for the *kind* of category. Here is the whole map; we spend the lesson earning it.

::widget process-flow {"steps":[{"title":"Nominal: one-hot","sub":"no real order (manual vs automatic, sedan vs SUV) becomes one 0/1 column per category"},{"title":"Ordinal: ranked integers","sub":"a real order (poor up to excellent) becomes 1, 2, 3, 4"},{"title":"High-cardinality: lump or encode","sub":"hundreds of levels (every car brand) need a smaller, smarter code"}]}

=== step === concept
::eyebrow Why encode at all
## A model only multiplies numbers

Picture the simplest price model Maya could fit, a straight-line one. It predicts a car's price by multiplying each feature by a learned weight and adding them up:

\[ \hat{y} \;=\; \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \dots + \beta_p x_p. \]

Here \(\hat{y}\) is the predicted price, each \(x_j\) is one feature (a number), each \(\beta_j\) is the weight the model learns for it, and \(\beta_0\) is the **intercept**, a baseline constant that belongs to no feature. The whole machine is multiplication and addition. So every \(x_j\) has to *be* a number. The word "automatic" has no value to multiply, and the same is true of every tree, boosting, or neural model underneath: somewhere they all reduce a row to numbers.

Each lesson runs in a fresh R session, so let us build Maya's listings right here and look at what we are dealing with.

```r
# Maya's used-car listings (price in $1000s). Built inline so the page is self-contained.
cars <- data.frame(
  body         = c("hatchback", "sedan", "SUV", "sedan", "SUV", "hatchback", "sedan", "SUV"),
  transmission = c("manual", "automatic", "automatic", "manual", "automatic", "manual", "automatic", "automatic"),
  condition    = c("good", "excellent", "fair", "good", "poor", "excellent", "good", "fair"),
  brand        = c("Toyota", "Ford", "Toyota", "Honda", "Kia", "Toyota", "BMW", "Ford"),
  price        = c(11.5, 16.0, 23.5, 12.0, 19.0, 13.5, 18.0, 21.0),
  stringsAsFactors = FALSE
)

# Which columns are numbers, and which are words a model cannot read yet?
sapply(cars, class)
#>          body  transmission     condition         brand         price
#>   "character"   "character"   "character"   "character"     "numeric"
```

Four of the five columns are text. Encoding is the job of turning those four into numbers, and the next steps are about doing it without lying to the model.

=== step === concept
::eyebrow The tempting shortcut
## Numbering categories invents an order

The fastest fix looks obvious: just hand each category a number. Let `hatchback = 1`, `sedan = 2`, `SUV = 3`, and feed that one column to the model. This is called **label** or **integer encoding**, and for a column with no inherent order it is a trap.

Look at what the model now believes. It will treat that column as an ordinary number, so it reads `SUV (3)` as three times `hatchback (1)`, and `sedan (2)` as sitting exactly halfway between them. You invented an order (hatchback before sedan before SUV) and an even spacing (each step worth the same) that the body styles never had. A body style is a name, not a rank.

[WARNING]
Label-encoding a *nominal* (unordered) category feeds a fake ranking straight into the model. A linear model takes it literally; even tree models will only ever split it in that arbitrary numeric order. Reserve integer codes for categories that genuinely have an order, which is the next part of this lesson.

::widget table-transform {"code":"df %>% mutate(body_code = match(body, c(\"hatchback\", \"sedan\", \"SUV\")))","caption":"Numbering categories is fast, but it tells the model SUV is 3 times a hatchback and a sedan sits halfway between, an order and spacing the data never had.","before":{"cols":["body"],"rows":[["hatchback"],["sedan"],["SUV"],["hatchback"]]},"after":{"cols":["body","body_code"],"rows":[["hatchback",1],["sedan",2],["SUV",3],["hatchback",1]]}}

=== step === quiz
::eyebrow Check yourself
## What goes wrong here?

Maya encodes `brand` as `Toyota = 1, Ford = 2, Honda = 3, Kia = 4, BMW = 5` and puts that single column into a linear price model. Brand has no natural order. What has she accidentally told the model?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Nothing wrong: the model just needs numbers, and any consistent numbering works ::no The opposite is the danger. The model will use the column eagerly and trust the fake numeric order baked into it.
- That BMW (5) is five times Toyota (1), and the brands sit in evenly spaced rank order ::ok Right. The model reads the codes as real quantities, so it assumes an ordering and equal spacing across brands that simply is not there. Nominal categories must not be integer-coded.
- That the brands are unrelated to price, so the column will be ignored ::no The opposite is the risk. Brand is a strong price signal, so the model uses the column eagerly and trusts the fake numeric order baked into it.

=== step === concept
::eyebrow The honest fix for nominal data
## One-hot and dummy encoding

If a category has no order, give the model no order. **One-hot encoding** replaces one categorical column with several 0/1 columns, one per category, each answering a yes/no question: "is this car a sedan?", "is it an SUV?". Formally, for a feature with levels \(c_1, c_2, \dots, c_k\), one-hot creates \(k\) indicator columns

\[ x_j \;=\; \mathbf{1}[\,\text{level} = c_j\,], \qquad j = 1, \dots, k, \]

where \(\mathbf{1}[\cdot]\) is 1 when the row is level \(c_j\) and 0 otherwise, and \(k\) is the number of categories. No category is larger than another; each just gets its own switch.

There is one subtlety. The \(k\) indicator columns always sum to 1 for every row (a car is exactly one body style, so \(\sum_{j} x_j = 1\)). That makes the last column perfectly predictable from the others, which is redundant and, for a linear model with an intercept, breaks the fit (the columns are perfectly collinear). The cure is **dummy encoding**: keep only \(k-1\) columns and let the dropped category be the **baseline** (or reference). Every other column's weight is then read as a difference *from that baseline*. Leaving all \(k\) columns in is the classic mistake known as the **dummy-variable trap**.

::widget table-transform {"code":"model.matrix(~ body - 1, data = df)","caption":"One-hot: each body style becomes its own 0/1 column. No style is treated as bigger than another. Dummy encoding keeps one fewer column and calls the dropped style the baseline.","before":{"cols":["body"],"rows":[["hatchback"],["sedan"],["SUV"],["sedan"]]},"after":{"cols":["body","is_hatchback","is_sedan","is_SUV"],"rows":[["hatchback",1,0,0],["sedan",0,1,0],["SUV",0,0,1],["sedan",0,1,0]]}}

=== step === tryit
::eyebrow In R
## Build the columns yourself

Good news: in R you rarely one-hot by hand, because `lm()`, `glm()`, and friends turn a `factor` into dummy columns automatically (they keep \(k-1\) and use the first level as the baseline). But it pays to see the columns explicitly with `model.matrix()`.

The formula `~ body` gives you the **dummy** columns (R drops the baseline and adds an intercept). Adding `- 1` removes the intercept, which forces R to keep **all** the columns, the full **one-hot** set. Fill in the blank so this produces one column per body style.

```r
cars$body <- factor(cars$body, levels = c("hatchback", "sedan", "SUV"))

# Drop the intercept so every level gets its own 0/1 column (one-hot)
onehot <- model.matrix(~ body ____, data = cars)
head(onehot)
```
::check {"regex":"-\\s*1","gate":true,"difficulty":"intermediate","ok":"That is one-hot: bodyhatchback, bodysedan, bodySUV, one 0/1 column per level. Without the - 1, R drops one level as the baseline and gives you the k - 1 dummy columns instead.","no":"Subtract the intercept with - 1, so write ~ body - 1. That keeps all three level columns instead of dropping one as a baseline."}
::solution
```r
cars$body <- factor(cars$body, levels = c("hatchback", "sedan", "SUV"))

onehot <- model.matrix(~ body - 1, data = cars)
head(onehot)
#>   bodyhatchback bodysedan bodySUV
#> 1             1         0       0
#> 2             0         1       0
#> 3             0         0       1
#> 4             0         1       0
#> 5             0         0       1
#> 6             1         0       0
```

=== step === concept
::eyebrow When order is real
## Ordinal encoding: keep the ranking

Sometimes a category *does* have an order, and throwing it away would lose real information. Maya's `condition` runs `poor`, `fair`, `good`, `excellent`. An excellent car really is worth more than a poor one, in that order. One-hot encoding would scatter that ranking across four unrelated 0/1 columns and make the model relearn the obvious.

For a genuinely ordered category, **ordinal encoding** is the honest move: map the levels to ranked integers in their true order. In R you state the order once with an *ordered* factor, then convert to integers.

```r
# State the real order; "ordered = TRUE" records that poor < fair < good < excellent
cars$condition <- factor(cars$condition,
                         levels  = c("poor", "fair", "good", "excellent"),
                         ordered = TRUE)

cars$condition_rank <- as.integer(cars$condition)
head(data.frame(condition = cars$condition, rank = cars$condition_rank), 5)
#>   condition rank
#> 1      good    3
#> 2 excellent    4
#> 3      fair    2
#> 4      good    3
#> 5      poor    1
```

[KEY INSIGHT]
Integer codes carry one extra assumption: **equal spacing**. Writing `poor, fair, good, excellent` as `1, 2, 3, 4` tells the model the jump from poor to fair is worth exactly as much as the jump from good to excellent. If that is roughly true, ordinal encoding is compact and powerful. If the gaps are uneven, keep the order but let the model find the spacing (one-hot the levels, or use an ordered factor with a method that does not assume even steps).

=== step === quiz
::eyebrow Check yourself
## Which column may be integer-coded?

Maya has two columns left to encode: `brand` (Toyota, Ford, Honda, ...) and a survey field `satisfaction` (`low`, `medium`, `high`). Which one is a fair candidate for ordinal (integer) encoding, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `brand`, because there are too many makes to one-hot, so ranking them is the only option ::no Assigning an order to an unordered category (`brand`) is exactly the label-encoding trap. Only genuinely ranked categories earn integer codes.
- `satisfaction`, because low, medium, high have a genuine order to preserve ::ok Right. `satisfaction` is ordinal: the levels rank naturally, so `1, 2, 3` keeps real information (as long as the steps are roughly even). `brand` is nominal and must not be integer-coded.
- Both, since any column can be turned into numbers once you assign an order ::no Assigning an order to `brand` is exactly the label-encoding trap. Only `satisfaction` has a real order to preserve.

=== step === concept
::eyebrow When categories explode
## High cardinality: too many levels

One-hot encoding is honest, but it has a cost: it adds one column per category. For `transmission` (2 levels) or `body` (3) that is nothing. For a real `brand` or `model` column with 200 distinct makes, one-hot creates 200 sparse columns, most of them almost always 0. That bloats the model, invites overfitting, and creates a nasty production bug: a brand that appears only in the test set (or in next month's data) has no column to land in, so the encoding breaks on data it has never seen.

When a column is **high-cardinality**, you shrink it before encoding. Two simple, leak-safe options:

```r
library(dplyr)
library(forcats)

cars$brand <- factor(cars$brand)

# 1. Lump the rare levels together: keep the most common, fold the tail into "Other"
cars$brand_lumped <- fct_lump_n(cars$brand, n = 2)   # keep the 2 most common brands
table(cars$brand_lumped)
#>
#>   Ford Toyota  Other
#>      2      3      3
```

```r
# 2. Frequency encoding: replace each brand with how often it appears (one numeric column)
cars %>%
  add_count(brand, name = "brand_freq") %>%
  select(brand, brand_freq) %>%
  head(4)
#>    brand brand_freq
#> 1 Toyota          3
#> 2   Ford          2
#> 3 Toyota          3
#> 4  Honda          1
```

Each choice buys something and costs something:

| Strategy | What it does | The cost |
|---|---|---|
| One-hot every level | one 0/1 column per category | hundreds of sparse columns; breaks on unseen levels |
| Lump rare levels | keep the top few, fold the rest into "Other" | loses detail inside "Other" |
| Frequency encoding | replace level by how common it is | two equally common brands collide on the same number |
| Target encoding *(next lesson)* | replace level by its average outcome | strongest, but leaks the answer if done carelessly |

The most powerful high-cardinality method, **target encoding**, replaces each category with the average price of cars in that category. It is also the easiest to get wrong, because it peeks at the answer. That leak, and how to encode out-of-fold so it cannot happen, is the whole of Lesson 2.

=== step === quiz
::eyebrow Check yourself
## Match the column to its encoding

Maya is finalizing her pipeline. For three columns, which encoding fits each best: `transmission` (manual / automatic), `condition` (poor to excellent), and `model` (180 distinct values)?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- One-hot all three, since one-hot is always the safe default ::no One-hot throws away the real order in `condition` and explodes `model` into 180 sparse columns. Match the method to the kind of category.
- Integer-code all three from 1 upward, to keep the pipeline simple ::no Integer-coding `transmission` and `model` invents an order they do not have. Only `condition` is genuinely ordered.
- One-hot (or dummy) `transmission`, ordinal-encode `condition`, and lump or target-encode `model` ::ok Exactly. Match the method to the kind of category: nominal and small to one-hot, genuinely ordered to integers, high-cardinality to lumping or a learned encoding.

=== step === concept
::eyebrow Go deeper
## References

Authoritative places to take this further:

- [Kuhn and Johnson, Feature Engineering and Selection (free book)](http://www.feat.engineering/) - the definitive practitioner treatment of encoding categorical predictors and what each method costs.
- [Kuhn and Silge, Tidy Modeling with R, recipes chapter](https://www.tmwr.org/recipes) - how to encode inside a modeling pipeline so the recipe learns on train and applies to test.
- [recipes: step_dummy() reference](https://recipes.tidymodels.org/reference/step_dummy.html) - the tidymodels step that one-hot and dummy encodes a factor.
- [forcats: fct_lump() reference](https://forcats.tidyverse.org/reference/fct_lump.html) - collapsing rare levels of a high-cardinality factor into "Other".

=== step === complete
## Lesson 1 complete

You can now read a column's *kind* and encode it honestly: one-hot or dummy encode nominal categories so the model invents no order, ordinal-encode genuinely ranked categories while remembering the equal-spacing assumption you buy, and shrink a high-cardinality column by lumping rare levels or frequency-encoding instead of exploding it into hundreds of sparse columns. Maya's word-columns are now numbers a model can actually use.

Next, Lesson 2: Target Encoding Without Leakage. You will meet the most powerful way to encode a high-cardinality column, replacing each category with its average outcome, and the subtle leak that makes it dangerous. You will learn to do it out-of-fold, so the encoding never sees the rows it scores.
