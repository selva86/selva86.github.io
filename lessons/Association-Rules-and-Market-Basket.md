---
title: "Unsupervised Learning Lesson 8: Association Rules and Market Basket"
catalog_blurb: "Find which products genuinely sell together, and tell real patterns from coincidence."
description: "Learn association rules and market basket analysis in R: what support, confidence and lift measure, why confidence alone misleads, and mining rules with arules."
keywords: "association rules in R, market basket analysis, support confidence lift, arules, apriori, itemset, lift, unsupervised learning, data mining, R"
post_type: "LESSON"
curriculum_id: "6.9.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-unsupervised"
course_title: "Unsupervised Learning in R"
course_lesson: "8"
course_total: "8"
course_landing: "R-Unsupervised-Learning-Course.html"
course_next: ""
course_prev: "Cluster-Validation-and-Stability.html"
---

=== step === cover
::eyebrow Lesson 8 of 8
## Association Rules and Market Basket

Meet Priya. She runs a small corner grocery, and at the end of each day she has a stack of till receipts. Every receipt is one shopper's basket: a list of what that one person bought. Priya has a hunch that **bread and butter** keep turning up on the same receipt, and she is tempted to move them onto the same shelf. But she pauses. Bread is on almost every receipt anyway. Maybe bread and butter just look connected because *bread* is popular, not because the two go together. How can she tell a real buy-this-with-that pattern from a coincidence?

That question, asked over a pile of baskets, is **market basket analysis**, and the tool below is where this lesson lands. Pick a rule like "if bread, then butter" and read its three numbers. By the end you will know exactly what each one means and which one settles Priya's question.

::widget assoc-rules {}

In [Lesson 7](t-SNE-and-UMAP.html) you drew a 2-D map to see which data points group together. Here we drop geometry entirely and ask a different unsupervised question: not "which points cluster?" but **"which items get bought together?"** No target variable, no labels, just baskets and the patterns hiding in them.

By the end of this lesson you will be able to:

- Read a set of baskets as **transactions** and name the parts of a rule \(X \Rightarrow Y\)
- Compute **support**, **confidence**, and **lift** by hand, and say what each measures
- Explain why confidence alone misleads, and how lift settles Priya's bread-and-butter question
- Mine and rank rules at scale with the `arules` package, and read them honestly

**Prerequisites:** you can run R and read its printed output, and you know what a proportion is ("4 of 10" is 0.4). No earlier lesson in this course is required; this is a fresh question. The [course landing](R-Unsupervised-Learning-Course.html) lists the rest.

=== step === concept
::eyebrow The data
## The receipts: transactions and itemsets

Here is Priya's day: ten receipts. Each row is one shopper's basket.

| Receipt | Items |
|---|---|
| 1 | bread, butter, milk |
| 2 | bread, butter |
| 3 | bread, milk |
| 4 | beer, chips |
| 5 | bread, butter, jam |
| 6 | beer, chips, salsa |
| 7 | bread, butter |
| 8 | milk, cereal |
| 9 | beer, chips |
| 10 | bread, jam |

Three words name what we are looking at. A **transaction** is one basket (one receipt). An **item** is one thing on it (bread, milk). An **itemset** is any group of items, like {bread, butter}. And an **association rule** is written \(X \Rightarrow Y\), read "shoppers who buy the items in \(X\) also buy the items in \(Y\)." The left side \(X\) is the **antecedent** ("if"), the right side \(Y\) is the **consequent** ("then"). "If bread, then butter" is the rule \(\{\text{bread}\} \Rightarrow \{\text{butter}\}\).

Since this page runs in its own fresh R session, let us type Priya's receipts in as a list, one basket per entry, and count how often each item shows up.

```r
# Priya's 10 till receipts. Each is one shopper's basket. Built inline, because
# this page starts with an empty R session.
baskets <- list(
  c("bread", "butter", "milk"), c("bread", "butter"),        c("bread", "milk"),
  c("beer", "chips"),           c("bread", "butter", "jam"), c("beer", "chips", "salsa"),
  c("bread", "butter"),         c("milk", "cereal"),         c("beer", "chips"),
  c("bread", "jam")
)
n <- length(baskets)                     # number of receipts (transactions)
items <- sort(unique(unlist(baskets)))   # every distinct item that appears
items
#> [1] "beer"   "bread"  "butter" "cereal" "chips"  "jam"    "milk"   "salsa"

# How many of the 10 receipts contain each item?
has <- function(item) sapply(baskets, function(b) item %in% b)
sapply(items, function(it) sum(has(it)))
#>   beer  bread butter cereal  chips    jam   milk  salsa
#>      3      6      4      1      3      2      3      1
```

Bread leads at 6 receipts out of 10. Hold on to that number: it is the reason Priya's hunch needs a second look.

=== step === concept
::eyebrow The first number
## Support: how often does it happen?

The plainest question about any itemset is *how often does it show up?* That is its **support**.

Let \(N\) be the number of receipts (here \(N = 10\)) and let \(X\) be an itemset. The support of \(X\) is the fraction of receipts that contain every item in \(X\):

\[ \mathrm{support}(X) = \frac{\text{number of receipts containing all of } X}{N} \]

So support is just a frequency between 0 and 1. The support of {bread} is how common bread is; the support of {bread, butter} is how often that *pair* rides together. Below, `support()` builds each item's frequency, and the "Show what changed" panel turns those counts into support by dividing by 10.

::widget table-transform {"code":"df %>% mutate(support = count / 10)","caption":"support is each item count divided by the 10 receipts.","before":{"cols":["item","count"],"rows":[["beer",3],["bread",6],["butter",4],["cereal",1],["chips",3],["jam",2],["milk",3],["salsa",1]]},"after":{"cols":["item","count","support"],"rows":[["beer",3,0.3],["bread",6,0.6],["butter",4,0.4],["cereal",1,0.1],["chips",3,0.3],["jam",2,0.2],["milk",3,0.3],["salsa",1,0.1]]}}

```r
# support(X) = share of the 10 receipts that contain EVERY item in X
support <- function(itemset) mean(sapply(baskets, function(b) all(itemset %in% b)))

support("bread")                 # bread is on 6 of 10 receipts
#> [1] 0.6
support(c("bread", "butter"))    # 4 of 10 receipts have BOTH
#> [1] 0.4
```

Bread alone has support 0.6, and {bread, butter} together has support 0.4. Support is the raw popularity of a combination. It says nothing yet about *direction*, whether buying one pulls the other along. That is the next number's job.

=== step === concept
::eyebrow The second number
## Confidence: given X, how often Y?

Support treats \(X\) and \(Y\) symmetrically. But Priya's question has a direction: *given* that someone bought bread, how often do they also grab butter? That conditional is **confidence**.

For a rule \(X \Rightarrow Y\), confidence is the support of the two together divided by the support of \(X\) alone:

\[ \mathrm{confidence}(X \Rightarrow Y) = \frac{\mathrm{support}(X \cup Y)}{\mathrm{support}(X)} = P(Y \mid X) \]

Here \(X \cup Y\) means "a receipt that holds all of \(X\) and all of \(Y\)," and the whole thing reads as \(P(Y \mid X)\), "the probability of \(Y\) given \(X\)." In words: of all the receipts with \(X\) on them, what share also have \(Y\)?

```r
# confidence(X => Y) = support(X and Y) / support(X), the share of X-buyers who take Y
confidence <- function(x, y) support(c(x, y)) / support(x)

confidence("bread", "butter")    # of the 6 bread receipts, how many also have butter?
#> [1] 0.6666667
```

Two-thirds of bread-buyers also take butter. That sounds like a strong rule, and Priya is ready to rearrange her shelves. But a single number is about to trick her.

=== step === quiz
::eyebrow Check yourself
## Support or confidence?

Of Priya's 10 receipts, **6** contain bread and **4** contain both bread and butter. For the rule "bread \(\Rightarrow\) butter", what are its support and its confidence?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Support is 0.4 and confidence is about 0.67 ::ok Right. Support is the share of ALL receipts with both items (4 of 10 = 0.4). Confidence conditions on bread-buyers only (4 of the 6 bread receipts = 0.67).
- Support is about 0.67 and confidence is 0.4 ::no You have them swapped. Support divides by all 10 receipts (4/10 = 0.4); confidence divides by the 6 bread receipts (4/6 = 0.67).
- Both are 0.4, since the same 4 receipts drive each one ::no Same 4 receipts, but different denominators: support divides by all 10, confidence divides by the 6 that have bread, giving 4/6 = 0.67.

=== step === concept
::eyebrow The number that decides
## Lift: is it more than chance?

Here is the trap. Confidence of "bread \(\Rightarrow\) butter" is 67%. But butter-buyers are not the only reason that number is high; bread being on 6 of 10 receipts inflates *every* rule that ends in a common item. To judge a rule fairly we must compare its confidence against the item's baseline popularity. That comparison is **lift**.

\[ \mathrm{lift}(X \Rightarrow Y) = \frac{\mathrm{confidence}(X \Rightarrow Y)}{\mathrm{support}(Y)} = \frac{P(Y \mid X)}{P(Y)} \]

The denominator \(\mathrm{support}(Y)\) is how often \(Y\) is bought by *anyone*, the chance rate. So lift asks: do \(X\)-buyers take \(Y\) more often than shoppers in general? Read it as a multiplier. **Lift \(> 1\)**: they go together more than chance (a real association). **Lift \(= 1\)**: independent, \(X\) tells you nothing about \(Y\). **Lift \(< 1\)**: they repel, buying \(X\) makes \(Y\) *less* likely.

Now watch lift do what confidence cannot. Below are two rules with **identical** confidence:

```r
# lift(X => Y) = confidence(X => Y) / support(Y): how many times more than chance
lift <- function(x, y) confidence(x, y) / support(y)

# Same confidence for both rules...
c(bread_then_butter = confidence("bread", "butter"),
  milk_then_bread   = confidence("milk",  "bread"))
#> bread_then_butter   milk_then_bread
#>         0.6666667         0.6666667

# ...but very different lift
c(bread_then_butter = lift("bread", "butter"),
  milk_then_bread   = lift("milk",  "bread"))
#> bread_then_butter   milk_then_bread
#>          1.666667          1.111111
```

[KEY INSIGHT]
Both rules have 67% confidence, yet bread \(\Rightarrow\) butter has lift **1.67** while milk \(\Rightarrow\) bread has lift **1.11**. The difference is entirely the consequent's popularity: milk-buyers reach for bread mostly because bread is already on 60% of receipts, so the rule barely beats chance. Bread-buyers reach for butter far more than the average shopper does. Lift, not confidence, tells the real pattern from the popularity mirage, and it settles Priya's question: bread and butter genuinely belong together.

Try the widget again with this in mind: pick "bread → milk" (lift near 1) versus "beer → chips" (lift well above 1) and watch the lift bar, not the confidence bar, do the deciding.

::widget assoc-rules {}

=== step === tryit
::eyebrow Your turn
## Compute a lift yourself

Priya's most eye-catching pair is beer and chips: every beer receipt also has chips. Compute the lift of the rule "beer \(\Rightarrow\) chips". Remember the formula: lift is the rule's confidence divided by the support of the **consequent** (the item after the arrow). Fill in the blank.

```r
# lift = confidence(X => Y) divided by the support of Y (the consequent)
lift_beer_chips <- confidence("beer", "chips") / support(____)
lift_beer_chips
```
::check {"regex":"support\\([^)]*chips","gate":true,"difficulty":"beginner","ok":"Right. beer => chips has confidence 1.0 (every beer receipt also holds chips) and lift 3.33, the strongest rule in Priya's data.","no":"Lift divides confidence by the support of the CONSEQUENT, the item after the arrow. Here that is chips, so the denominator is the support of chips."}
::solution
```r
lift_beer_chips <- confidence("beer", "chips") / support("chips")
lift_beer_chips
#> [1] 3.333333
```

=== step === concept
::eyebrow At scale
## Finding rules with arules

Priya has 8 items and could eyeball every pair. A real retailer has tens of thousands, and the number of possible itemsets grows like \(2^k\) for \(k\) items, far too many to check one by one. The classic fix is the **Apriori principle**: if an itemset is rare, every larger set that contains it is at least as rare, so once {beer} falls below the minimum support you can skip *every* rule built on beer. That single pruning rule is what makes mining millions of baskets feasible, and it is the engine inside R's `arules` package.

The workflow is always the same four moves.

::widget process-flow {"steps":[{"title":"List the baskets","sub":"one row per shopping trip, held as a transactions object"},{"title":"Mine frequent rules","sub":"apriori keeps only rules above a minimum support and confidence"},{"title":"Rank by lift","sub":"sort so the strongest above-chance rules rise to the top"},{"title":"Act on the winners","sub":"shelve, bundle or recommend the items that truly go together"}]}

In R that is a few lines. The numbers it prints are exactly the support, confidence, and lift you just computed by hand, now found automatically.

```r-static
# The production tool. Run this in your own R session: the interactive R on this
# page does not ship the compiled arules core, but everything above already showed
# you what each number means.
library(arules)

# 1. turn the receipts into a transactions object
baskets <- list(
  c("bread", "butter", "milk"), c("bread", "butter"), c("bread", "milk"),
  c("beer", "chips"), c("bread", "butter", "jam"), c("beer", "chips", "salsa"),
  c("bread", "butter"), c("milk", "cereal"), c("beer", "chips"), c("bread", "jam")
)
tx <- as(baskets, "transactions")

# 2. mine every rule that clears a minimum support and confidence (Apriori)
rules <- apriori(tx, parameter = list(supp = 0.2, conf = 0.5, minlen = 2))

# 3. rank by lift and read the strongest rules
inspect(sort(rules, by = "lift"))
#>     lhs           rhs        support confidence lift
#> [1] {beer}     => {chips}       0.3       1.00 3.33
#> [2] {chips}    => {beer}        0.3       1.00 3.33
#> [3] {butter}   => {bread}       0.4       1.00 1.67
#> [4] {jam}      => {bread}       0.2       1.00 1.67
#> [5] {bread}    => {butter}      0.4       0.67 1.67
#> [6] {milk}     => {bread}       0.2       0.67 1.11
```

The `supp = 0.2` and `conf = 0.5` are Priya's thresholds: a rule must appear on at least 2 receipts and hold at least half the time, or it is dropped before lift is even considered. That minimum support is not a formality, as the next step shows.

=== step === quiz
::eyebrow Check yourself
## Which rule should Priya act on?

Priya finds two well-supported rules. Rule A, "milk \(\Rightarrow\) bread", has 67% confidence and lift **1.11**. Rule B, "bread \(\Rightarrow\) butter", has 67% confidence and lift **1.67**. Which should she build a shelf change around, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Rule A, because milk is a staple, so a milk-buyer heading for bread is a dependable pattern ::no That is the exact trap. Rule A scores 67% confidence mostly because bread is on 60% of receipts already. Its lift of 1.11 says buying milk barely raises the chance of bread above the baseline.
- Rule B, because its lift of 1.67 shows butter is bought far more by bread-buyers than by shoppers in general, while Rule A's lift of 1.11 is barely above chance ::ok Right. Equal confidence, but lift separates them: 1.67 is a genuine above-chance pull, 1.11 is almost entirely bread being common.
- Either one, since identical confidence means identical strength ::no Confidence alone is what fools you here. Same 67%, but lift tells them apart: 1.67 (real) versus 1.11 (mostly because bread is popular).

=== step === concept
::eyebrow Read them honestly
## Where these numbers mislead

Lift is powerful, but three cautions keep it from steering you wrong. First, a lift below 1 is real information: it means the two items *avoid* each other. Second, a spectacular lift on almost no receipts is a fluke, not a pattern, which is why a minimum support comes first. Watch both:

```r
# lift = 1 is independent; lift < 1 means the items AVOID each other
lift("milk", "beer")     # milk and beer never share a receipt here
#> [1] 0

# beer => salsa has the SAME lift as beer => chips (3.33)...
lift("beer", "salsa")
#> [1] 3.333333
support(c("beer", "salsa"))   # ...but it rests on a single receipt out of 10
#> [1] 0.1
```

Beer \(\Rightarrow\) salsa looks as strong as beer \(\Rightarrow\) chips on lift alone (both 3.33), but it appears on exactly one receipt. Support 0.1 means one lucky basket could have produced it; support 0.3 for beer and chips means a repeated habit. Always read support and lift *together*.

[WARNING]
A rule is co-occurrence, not causation. "bread \(\Rightarrow\) butter" does not mean bread *makes* people buy butter; both are likely driven by a shared reason (someone making sandwiches). Association rules tell you what to shelve together or recommend, not what causes what. Proving that one purchase *causes* another needs a controlled experiment, a different toolkit entirely.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Agrawal, Imielinski and Swami (1993), Mining Association Rules Between Sets of Items, ACM SIGMOD](https://doi.org/10.1145/170035.170072) - the paper that introduced support and confidence for market baskets.
- [Hahsler, Grun and Hornik (2005), arules: Mining Association Rules, Journal of Statistical Software](https://doi.org/10.18637/jss.v014.i15) - the R package you used here, and the Apriori and Eclat algorithms it wraps.
- [The arules package on CRAN](https://cran.r-project.org/package=arules) - install it and read the vignette to run everything above at real scale.
- [Tan, Steinbach and Kumar, Introduction to Data Mining (free Association Analysis chapter)](https://www-users.cse.umn.edu/~kumar001/dmbook/index.php) - the full theory: itemsets, the Apriori principle, and interest measures beyond lift.

=== step === complete
## Lesson 8 complete

You can now turn a pile of baskets into rules and read them without being fooled. Support tells you how often a combination appears; confidence tells you how often \(Y\) follows \(X\); and lift, the number that decides, tells you whether that following beats plain chance. You saw why two rules with the same 67% confidence can be worlds apart, mined and ranked rules with `arules`, and learned to hold support and lift together so a one-basket fluke never masquerades as a pattern.

That was the final lesson of **Unsupervised Learning in R**. Across the course you learned to compress variables with PCA, find groups with k-means and hierarchical clustering, model soft clusters with mixtures, judge whether clusters are real, map high-dimensional data with t-SNE, and now surface the patterns hiding in transaction data. Head back to the [course landing](R-Unsupervised-Learning-Course.html) to review any lesson or claim your certificate.
