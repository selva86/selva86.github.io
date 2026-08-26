---
title: "Interpreting PCA: what loadings and scores mean"
slug: "Structure-Mini-1"
description: "Twenty survey questions came back as a wall of numbers. Take one real PCA apart in R, read its loadings and its scores, and name both components out loud."
keywords: "PCA loadings and scores, interpret PCA in R, prcomp loadings, PCA scores explained, rotation matrix R, naming principal components, proportion of variance, PCA interpretation"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "hidden-structure"
course_title: "Hidden Structure"
course_lesson: "1"
course_total: "4"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.43"
lesson_access: "windowed"
catalog_blurb: "How to read a PCA result and name what each component measures."
---

=== step === cover
::eyebrow Hidden Structure
## Interpreting PCA: what loadings and scores mean

Let's say you run a PCA on a customer survey. Twenty questions went out to two hundred customers, and R hands back a wall of numbers: a matrix of loadings, a matrix of scores, and a row of proportions of variance.

Most people stop right there. They put PC1 on a chart axis, write "30% of the variance" underneath it, and hope nobody in the room asks what PC1 actually is.

And honestly, fair enough. Nobody explains this part well.

So here is what those two matrices are for. The loadings tell you what a component is made of: which questions it leans on, how hard, and which way each one pushes. The scores tell you where each customer sits on that new axis. Read the two together and PC1 stops being a mystery number. It becomes something you can name out loud, like price sensitivity or overall satisfaction.

So today we are going to take one real PCA result apart in R and name the components ourselves. There are three moves, and they go in this order.

::widget process-flow {"steps":[{"title":"Made of what","sub":"which questions it leans on, and in which direction"},{"title":"Who sits where","sub":"where each customer lands on the new axis"},{"title":"What to call it","sub":"a name for the axis, and which end means what"}]}

By the end you will have named both components of this survey out loud, with the direction attached to each.

=== step === concept
## The survey behind the numbers

None of the PCA output means anything until you know what went into it, so let's start there.

Two hundred customers filled in a twenty-question survey. Every question is a statement, and every answer is a number from 1, strongly disagree, to 7, strongly agree. The twenty questions come in three groups:

- **Nine about satisfaction:** `happy_overall`, `would_renew`, `recommend`, `support_good`, `easy_to_use`, `meets_needs`, `fast_enough`, and two written the other way round, `frustrating` and `thinking_quit`. Those last two go up when things are going badly.
- **Seven about price:** `price_matters`, `compares_price`, `waits_for_deal`, `switch_cheaper`, `too_expensive`, `wants_cheaper`, `checks_rivals`.
- **Four about habits:** `uses_app`, `reads_emails`, `joins_webinar`, `reads_blog`.

The code below builds that survey. For every customer it draws two hidden numbers, one for how satisfied they are and one for how much price drives them, and then every question becomes one of those hidden numbers plus its own noise, rounded onto the 1 to 7 scale. A driver like that has a name. It is a **latent variable**, something real that shapes the answers but never shows up as a column. In a live survey you never get to see it, and that is the whole reason PCA exists.

```r
# Build the 200-customer survey and look at the first few answers
set.seed(42)
n <- 200

happy <- rnorm(n)   # hidden driver 1: how satisfied a customer is
price <- rnorm(n)   # hidden driver 2: how much price drives them

# turn one hidden driver into one survey answer on the 1 to 7 scale
answer <- function(driver, noise) {
  z <- (driver + rnorm(n, 0, noise)) / sqrt(1 + noise^2)
  pmin(7, pmax(1, round(4 + 1.2 * z)))
}

survey <- data.frame(
  happy_overall  = answer( happy, 0.70),
  would_renew    = answer( happy, 0.70),
  recommend      = answer( happy, 0.70),
  support_good   = answer( happy, 0.70),
  easy_to_use    = answer( happy, 0.70),
  meets_needs    = answer( happy, 0.70),
  fast_enough    = answer( happy, 0.70),
  frustrating    = answer(-happy, 0.70),
  thinking_quit  = answer(-happy, 0.70),
  price_matters  = answer( price, 0.72),
  compares_price = answer( price, 0.72),
  waits_for_deal = answer( price, 0.72),
  switch_cheaper = answer( price, 0.72),
  too_expensive  = answer( price, 0.72),
  wants_cheaper  = answer( price, 0.72),
  checks_rivals  = answer( price, 0.72),
  uses_app       = answer(rnorm(n), 0.90),
  reads_emails   = answer(rnorm(n), 0.90),
  joins_webinar  = answer(rnorm(n), 0.90),
  reads_blog     = answer(rnorm(n), 0.90)
)
rownames(survey) <- sprintf("cust%03d", 1:n)

dim(survey)
#> [1] 200  20

survey[1:4, 1:5]
#>         happy_overall would_renew recommend support_good easy_to_use
#> cust001             6           5         6            7           5
#> cust002             3           4         4            4           3
#> cust003             4           5         5            5           5
#> cust004             5           5         4            5           5
```

Notice the minus sign in front of `happy` on the two reverse-worded rows. That is the whole trick of writing them. A customer who is doing well disagrees with `frustrating`, so the same hidden driver enters those two questions upside down.

Read one row and you have read the data. `cust001` answered 6, 5, 6, 7, 5 to the first five questions, so this is somebody who is broadly happy with the product. Two hundred rows like that, with twenty answers each, is everything PCA gets to work with.

=== step === concept
## Some questions move together

PCA never looks at your questions one at a time. It looks at how they move together, so that is where we start too.

Let's take three pairs of questions and ask how each pair moves.

```r
# Check how three pairs of questions move together
round(c(renew_and_needs       = cor(survey$would_renew, survey$meets_needs),
        renew_and_frustrating = cor(survey$would_renew, survey$frustrating),
        renew_and_price       = cor(survey$would_renew, survey$price_matters)), 2)
#>       renew_and_needs renew_and_frustrating       renew_and_price 
#>                  0.70                 -0.60                 -0.06 
```

Those are three very different answers. A customer who says they would renew also says the product meets their needs, so those two rise and fall together at 0.70. That same customer disagrees with `frustrating`, so that pair runs the other way at -0.60. And whether they would renew tells you almost nothing about whether price matters to them, at -0.06.

Here are six of the twenty questions with every pair worked out. Blue means the pair moves in opposite directions, green means the same direction, and the stronger the colour the tighter the link.

::widget correlation-heatmap {"vars":["would_renew","meets_needs","frustrating","price_matters","too_expensive","uses_app"],"matrix":[[1,0.695,-0.599,-0.057,-0.16,0.021],[0.695,1,-0.623,-0.099,-0.098,0.131],[-0.599,-0.623,1,0.039,0.047,0.047],[-0.057,-0.099,0.039,1,0.544,-0.093],[-0.16,-0.098,0.047,0.544,1,-0.087],[0.021,0.131,0.047,-0.093,-0.087,1]]}

The grid falls into packs. `would_renew` and `meets_needs` belong together and `frustrating` belongs with them upside down, all three of them saying something about satisfaction. `price_matters` and `too_expensive` form their own pack and have almost no link to the first three. `uses_app` belongs to nobody, and its whole row is pale.

That is the structure PCA is built to find. A pack of questions that move together is doing one job, and a component is what you get when PCA gives that job a single axis of its own. Its full name is a principal component, which is where principal component analysis gets its name, and where PC1 and PC2 get theirs.

=== step === concept
## What prcomp hands back

Fitting the PCA is one line. `prcomp()` is the function to use, and `scale. = TRUE` tells it to divide every question by its own standard deviation first, so that no question counts for more just because its numbers happen to be bigger. Here all twenty are already on the same 1 to 7 scale, so it changes little, but it is a habit worth keeping.

```r
# Fit the PCA and see what it returns
pca <- prcomp(survey, scale. = TRUE)

round(summary(pca)$importance[, 1:5], 3)
#>                          PC1   PC2   PC3   PC4  PC5
#> Standard deviation     2.462 2.105 1.088 1.057 1.00
#> Proportion of Variance 0.303 0.222 0.059 0.056 0.05
#> Cumulative Proportion  0.303 0.525 0.584 0.640 0.69

names(pca)
#> [1] "sdev"     "rotation" "center"   "scale"    "x"
```

Read the middle row of that table first. PC1 carries 30.3% of all the variation in the twenty answers, PC2 carries 22.2%, and then PC3 drops off a cliff to 5.9%. Two components hold just over half the survey between them, and the other eighteen carry between 5.9% and 1.0% each. That cliff is PCA telling you it found two jobs being done, not twenty.

The five names underneath are the five things `prcomp()` stored, and here is what each one holds:

- `sdev` is how much each component carries. Square it and you get the variance, which is where the proportions above come from.
- `rotation` is what each component is **made of**. These are the loadings.
- `x` is where each customer **sits** on each component. These are the scores.
- `center` and `scale` just record the subtracting and dividing that was done to each question, so you can undo it later.

The 30.3% is the headline everybody quotes. `rotation` and `x` are the two that let you say what PC1 is, and those are the two we open next.

=== step === concept
## Loadings: one weight for every question

Open `rotation` and here is what is inside: one column per component, one row per question, and a number where they meet.

```r
# Look at the loadings, the weights that define PC1 and PC2
round(pca$rotation[, 1:2], 2)
#>                  PC1   PC2
#> happy_overall  -0.31 -0.07
#> would_renew    -0.33 -0.03
#> recommend      -0.32 -0.04
#> support_good   -0.33 -0.05
#> easy_to_use    -0.34 -0.06
#> meets_needs    -0.34 -0.04
#> fast_enough    -0.33 -0.06
#> frustrating     0.32  0.08
#> thinking_quit   0.32  0.06
#> price_matters   0.07 -0.37
#> compares_price  0.06 -0.39
#> waits_for_deal  0.06 -0.37
#> switch_cheaper  0.05 -0.39
#> too_expensive   0.08 -0.36
#> wants_cheaper   0.04 -0.36
#> checks_rivals   0.08 -0.35
#> uses_app       -0.03  0.05
#> reads_emails    0.00 -0.01
#> joins_webinar  -0.01 -0.04
#> reads_blog      0.01 -0.03

# every loadings column is scaled so its squared weights add to 1
sum(pca$rotation[, "PC1"]^2)
#> [1] 1
```

The number where `would_renew` meets PC1 is -0.33. That is the **loading**: the weight PC1 gives to that one question. A whole column of twenty of them is a recipe, saying how much of each question goes into the component and which way it pushes.

The last line matters more than it looks. Every column's squared weights add to exactly 1, so the twenty weights are shares of one fixed budget. A question can only load heavily if the others load lightly, which is what makes a big loading worth something: it was won against nineteen competitors.

Two columns are printed here because twenty would not fit on a page, and because after the first two there is almost nothing left to read. Everything from here is done on these two.

=== step === concept
## Reading the PC1 column: which questions it leans on

In the order the questions came in, those twenty numbers are not something you can read. Sort them, and the column starts to make sense.

Sort by the **size** of each weight and ignore the sign for now. Size is how hard the component leans on a question. Sign is which way it pushes, and that is a separate question worth its own answer.

```r
# Sort the PC1 loadings by size to see which questions it leans on
l1 <- pca$rotation[, "PC1"]
round(l1[order(-abs(l1))], 3)
#>    meets_needs    easy_to_use   support_good    would_renew    fast_enough 
#>         -0.341         -0.339         -0.335         -0.330         -0.327 
#>      recommend    frustrating  thinking_quit  happy_overall  checks_rivals 
#>         -0.324          0.324          0.320         -0.313          0.081 
#>  too_expensive  price_matters compares_price waits_for_deal switch_cheaper 
#>          0.077          0.071          0.063          0.059          0.052 
#>  wants_cheaper       uses_app     reads_blog  joins_webinar   reads_emails 
#>          0.036         -0.032          0.009         -0.009         -0.002 

# how much of the column's budget of 1 the nine biggest weights take
sum(l1[order(-abs(l1))][1:9]^2)
#> [1] 0.9697928
```

Look at where the numbers fall off. The first nine run from 0.341 down to 0.313, all of them within three hundredths of each other. The tenth is `checks_rivals` at 0.081, a quarter of the size. After that it dwindles to nothing.

Now read the names of those nine. `meets_needs`, `easy_to_use`, `support_good`, `would_renew`, `fast_enough`, `recommend`, `frustrating`, `thinking_quit`, `happy_overall`. That is the satisfaction group, all nine of them, and nothing else got in.

Here are those nine drawn to scale, with the four next-largest weights underneath so you can see the drop. The plus or minus after each name is the direction of its weight, which is the next thing to sort out.

::widget importance-bars {"items":[{"label":"meets_needs -","value":0.341},{"label":"easy_to_use -","value":0.339},{"label":"support_good -","value":0.335},{"label":"would_renew -","value":0.33},{"label":"fast_enough -","value":0.327},{"label":"recommend -","value":0.324},{"label":"frustrating +","value":0.324},{"label":"thinking_quit +","value":0.32},{"label":"happy_overall -","value":0.313},{"label":"checks_rivals +","value":0.081},{"label":"too_expensive +","value":0.077},{"label":"price_matters +","value":0.071},{"label":"uses_app -","value":0.032}]}

So the first thing you can now say about PC1, without hedging, is what it is built out of. Those nine questions take 0.970 of the column's budget of 1 between them, and they carry it almost evenly. The other eleven share the 0.030 that is left.

[KEY INSIGHT]
A loading near zero is not a weak vote. It is no vote. `reads_emails` at -0.002 contributes essentially nothing to PC1, which means knowing how a customer answered it tells you nothing about where they land on PC1.

=== step === quiz
## Quick check: what a loading near zero means

`uses_app` loads -0.032 on PC1, one of the smallest weights in the column. A customer tells you they are in the app every single day. What does that tell you about their PC1 score?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Their PC1 score will be low, because the loading is negative and they answered high. ::no
- Nothing at all. A weight that small means the question barely enters PC1, so their answer to it moves the score by almost nothing. ::ok Exactly. Sign only tells you which way a question pushes once it pushes at all, and -0.032 out of a budget of 1 is not pushing.
- Their PC1 score will be high, because heavy app users are the engaged customers. ::no
- Nothing, because `uses_app` was dropped from the PCA, which is why its weight came out near zero. ::no Nothing was dropped: all twenty questions went in and all twenty got a weight. The reason `uses_app` came out at -0.032 is that it does not move with the satisfaction pack, so PC1 had no use for it. And a weight that small cannot push a score in either direction, which is why its sign is not worth reading.

=== step === concept
## How to read the signs in a loadings column

Now let's look at the signs. Split the nine big PC1 weights by which way they point.

```r
# Split the nine big PC1 loadings by their sign
big1 <- l1[abs(l1) > 0.3]

names(big1)[big1 < 0]
#> [1] "happy_overall" "would_renew"   "recommend"     "support_good" 
#> [5] "easy_to_use"   "meets_needs"   "fast_enough"  

names(big1)[big1 > 0]
#> [1] "frustrating"   "thinking_quit"
```

That split is not an accident. The seven questions a happy customer agrees with came out negative, and the two a happy customer disagrees with came out positive. PCA never saw the wording. It only saw that those two columns moved against the other seven, and it put them on the opposite side of the axis, which is exactly where they belong.

So the direction of PC1 is now readable. A customer earns a high PC1 score by agreeing with `frustrating` and `thinking_quit` and disagreeing with the other seven. High PC1 means unhappy. Low PC1 means happy.

That raises the obvious worry. If the sign is doing that much work, what happens when it comes out the other way round? Put the column beside its own negation and look.

```r
# Put the PC1 loadings beside their own negation
cbind(as_fitted = round(l1, 2), flipped = round(-l1, 2))[1:9, ]
#>               as_fitted flipped
#> happy_overall     -0.31    0.31
#> would_renew       -0.33    0.33
#> recommend         -0.32    0.32
#> support_good      -0.33    0.33
#> easy_to_use       -0.34    0.34
#> meets_needs       -0.34    0.34
#> fast_enough       -0.33    0.33
#> frustrating        0.32   -0.32
#> thinking_quit      0.32   -0.32
```

Both columns say the same thing about the survey. The seven still stand against the two, the gaps between the weights are untouched, and every question keeps exactly the pull it had. The only difference is which end of the axis you call high.

R picks a sign for each component out of the arithmetic it happens to do, not out of anything in your data, so the same survey fitted on another machine can hand you the flipped column. That is normal and it is nothing to fix.

[KEY INSIGHT]
Inside a loadings column the signs carry real information: they say which questions oppose which. The sign of the column as a whole carries none. Negate every weight and it is the same axis pointing the other way, so what you must never do is read one loading's sign on its own.

=== step === tryit
## Your turn: what is PC2 made of?

You have read PC1 by sorting its weights by size. PC2 is sitting in the next column of `pca$rotation` and nobody has read it yet. Do the same to it.

Pull out the PC2 column, sort it so the biggest weights come first regardless of sign, and round to three places.

```r
# pca$rotation has one column of twenty weights for every component.
# Pull the PC2 column out into l2, then print it sorted by the SIZE
# of the weights, ignoring sign, rounded to 3 places.
# Two lines. Press Check when you have them.
```
::check {"regex": "order[(][^)]*abs[(]", "gate": true, "difficulty": "beginner", "ok": "That is it. Seven questions come back between 0.353 and 0.393 in size, they are the seven price questions, and every other weight is under 0.09. PC2 is the price pack.", "no": "Same two moves as before, on the next column. Pull the second column of pca$rotation out into l2, then print round(l2[order(-abs(l2))], 3). The sorting has to go through abs() so that a big negative weight counts as big."}
::solution
```r
# Sort the PC2 loadings by size, ignoring sign
l2 <- pca$rotation[, "PC2"]
round(l2[order(-abs(l2))], 3)
#> compares_price switch_cheaper waits_for_deal  price_matters  too_expensive 
#>         -0.393         -0.389         -0.369         -0.366         -0.364 
#>  wants_cheaper  checks_rivals    frustrating  happy_overall    easy_to_use 
#>         -0.363         -0.353          0.081         -0.069         -0.065 
#>  thinking_quit    fast_enough   support_good       uses_app      recommend 
#>          0.064         -0.059         -0.055          0.050         -0.045 
#>  joins_webinar    meets_needs     reads_blog    would_renew   reads_emails 
#>         -0.044         -0.039         -0.027         -0.026         -0.012 
```

=== step === concept
## What PC2 turned out to be

The seven price questions took the top seven places, running from -0.393 down to -0.353, and the eighth-placed weight is `frustrating` at 0.081. It is the same shape as PC1, a tight block and then a cliff.

Two things are worth putting numbers on. The first is how much of the column those seven actually own.

```r
# Sort the PC2 loadings, then measure how much of the column the price block owns
l2 <- pca$rotation[, "PC2"]
round(l2[order(-abs(l2))][1:7], 3)
#> compares_price switch_cheaper waits_for_deal  price_matters  too_expensive 
#>         -0.393         -0.389         -0.369         -0.366         -0.364 
#>  wants_cheaper  checks_rivals 
#>         -0.363         -0.353 

sum(l2[order(-abs(l2))][1:7]^2)
#> [1] 0.9644985
```

The budget for a loadings column is 1, and those seven questions take 0.964 of it. The other thirteen questions share the remaining 0.036 between them. PC2 is the price block and almost nothing else.

The second is the signs. All seven are negative and none of them opposes the others, which is a different picture from PC1. PC1 had two reverse-worded questions to push against. The price block was written all one way round, so there is nothing on this axis to oppose it.

That still fixes the direction, though. A customer earns a low PC2 score by agreeing with all seven price questions. Low PC2 means price is what drives them. High PC2 means it is not.

=== step === concept
## Scores: the weights applied to one customer's answers

A loadings column is a recipe. A score is what you get when you follow that recipe for one customer.

Two things happen before the weights can be applied. Each question is centred, by subtracting its own mean, and scaled, by dividing by its own standard deviation. That turns an answer of 6 into "this far above average, for this question", which is the form the weights expect. Standardised answers are usually written as z.

Then the score is one multiplication and one sum:

\[ \text{score}_{i1} \;=\; \sum_{j=1}^{20} z_{ij} \, w_{j1} \]

Here \(z_{ij}\) is customer i's standardised answer to question j, and \(w_{j1}\) is that question's PC1 weight. Add up the twenty products and you get one number for that customer, and that is the entire definition of a score.

Let's do it by hand for `cust001` and then ask R what it got.

```r
# Work out one customer's PC1 score by hand, then check it against R
z  <- scale(survey)             # every question centred and scaled
w1 <- pca$rotation[, "PC1"]     # the twenty PC1 weights

sum(z["cust001", ] * w1)        # the recipe, followed by hand
#> [1] -4.945573

pca$x["cust001", "PC1"]         # what prcomp already stored
#> [1] -4.945573
```

It is the same number to seven digits, because it is the same calculation. So `pca$x` holds nothing you could not have worked out yourself. There are two hundred rows, one per customer, with that same sum done once for every component.

It is worth seeing which questions actually did the pushing. Multiply out the twenty products for `cust001` and look at the five biggest.

```r
# See which questions pushed cust001's PC1 score hardest
contrib <- z["cust001", ] * w1
round(contrib[order(-abs(contrib))][1:5], 3)
#>  support_good   meets_needs   frustrating happy_overall     recommend 
#>        -0.862        -0.582        -0.549        -0.546        -0.505 
```

Every one of the top five is a satisfaction question, and every one pushed the score down. `support_good` did the most work, because `cust001` answered 7 to it, further above that question's average than any of their other answers. Add up all twenty of these products and you get -4.945573.

Now do it for everybody. Each customer has a PC1 score and a PC2 score, so each one is a point.

```r
# Plot every customer on the first two components
plot(pca$x[, "PC1"], pca$x[, "PC2"],
     xlab = "PC1 score", ylab = "PC2 score",
     main = "200 customers on the first two components",
     pch = 19, col = "grey40")
abline(h = 0, v = 0, col = "grey75")
```

What comes back is one cloud, centred on zero in both directions and spread from about -6 to +6 each way, with no separate clumps in it. There are no hidden customer types here to discover, and that is fine, because the two axes are the finding. Every point is one customer, and its two coordinates are the two sums you just did by hand.

=== step === quiz
## Quick check: what a high PC1 score says about a customer

On PC1 the seven positive-worded satisfaction questions all load around -0.33, and `frustrating` and `thinking_quit` load around +0.32. Suppose a customer comes back with a PC1 score of +5.4, near the top of the range. What do you know about them?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They are one of the happiest customers in the survey, since PC1 is the satisfaction component. ::no
- They agreed with `frustrating` and `thinking_quit` and disagreed with the other seven, so they are one of the unhappy ones. ::ok Right. You read it off the recipe rather than off the label: a big positive score has to come from the questions with positive weights, and here those are the two that go up when things go badly.
- They answered high, near 7, on most of the twenty questions. ::no
- They score high on price sensitivity as well, since a customer at one extreme is usually at the other. ::no The score is a weighted sum, so which questions pushed it up depends entirely on which weights are positive. On PC1 those are the two reverse-worded questions, so a high score means unhappy. It also says nothing about PC2, which is built from a different pack of questions.

=== step === concept
## Reading loadings and scores together

The loadings and the scores each answer half a question. Put them together on the customers at the two ends of PC1 and you can check the whole story against real answers.

```r
# Find the customers at each end of PC1
round(sort(pca$x[, "PC1"])[1:3], 2)
#> cust118 cust009 cust012 
#>   -6.02   -5.88   -5.07 

round(sort(pca$x[, "PC1"], decreasing = TRUE)[1:3], 2)
#> cust018 cust039 cust059 
#>    6.45    6.22    5.99 
```

`cust018` at +6.45 and `cust118` at -6.02 are as far apart on PC1 as this survey goes. The recipe predicts what each of them must have written: the high scorer disagreed with the seven and agreed with the two, and the low scorer did the reverse. Go and look.

```r
# Look at what the two most extreme customers actually answered
survey[c("cust018", "cust118"),
       c("would_renew", "meets_needs", "easy_to_use", "frustrating", "thinking_quit")]
#>         would_renew meets_needs easy_to_use frustrating thinking_quit
#> cust018           2           2           1           6             7
#> cust118           6           6           7           1             1
```

`cust018` answered 2, 2, 1 to the three good questions and 6, 7 to the two bad ones. `cust118` answered 6, 6, 7 and then 1, 1. They are mirror images, which is what being at opposite ends of one axis means.

Nobody told the PCA which questions were about satisfaction. It found the pack from the correlations alone, gave it an axis, and the customers it put at the ends of that axis are the two you would have picked out by hand from the raw sheet.

=== step === concept
## Turning loadings into correlations

There is one number that makes a name easy to defend in a meeting, and it is one line away from the loadings.

A loading is a weight in an awkward unit. It lives on the "squares add to 1" budget, so 0.33 means something different in a twenty-question survey than it does in a five-question one. Multiply a loading by its component's standard deviation and that awkwardness goes away. What comes back is the plain correlation between that question and that component's scores, on the familiar -1 to 1 scale.

```r
# Turn loadings into the correlation between each question and the component score
lc <- sweep(pca$rotation, 2, pca$sdev, FUN = "*")
round(lc[1:9, 1:2], 2)
#>                 PC1   PC2
#> happy_overall -0.77 -0.14
#> would_renew   -0.81 -0.06
#> recommend     -0.80 -0.09
#> support_good  -0.82 -0.12
#> easy_to_use   -0.84 -0.14
#> meets_needs   -0.84 -0.08
#> fast_enough   -0.80 -0.12
#> frustrating    0.80  0.17
#> thinking_quit  0.79  0.13

# check one of them the long way, at full precision
c(from_loadings = lc["would_renew", "PC1"],
  the_long_way  = cor(survey$would_renew, pca$x[, "PC1"]))
#> from_loadings  the_long_way 
#>     -0.813438     -0.813438 
```

`sweep()` walks along dimension 2, the columns, and multiplies each one by the matching entry of `pca$sdev`. The check underneath is not an approximation. Correlate the raw `would_renew` answers with the PC1 scores directly and you get -0.813438, which is what `lc["would_renew", "PC1"]` holds, to every digit R prints.

Now the nine satisfaction questions read as correlations of 0.77 to 0.84 with PC1, and that is a sentence anybody can check without knowing what a loading is. The price questions, on the same scale, correlate between 0.089 and 0.198 with PC1, which is another way of saying they are not part of it.

[NOTE]
Both matrices get called "the loadings" in the wild, which causes real confusion. `pca$rotation` holds the raw weights, the recipe, which you will also see called the eigenvectors. `rotation` times `sdev` holds the question-to-component correlations, sometimes called component loadings or the structure matrix. When somebody quotes you a loading of 0.84, ask which one they mean.

=== step === concept
## Naming a component out loud

You now have everything a name needs. Here is the sentence to say out loud, with the blanks marked:

**[Component] is [a name]. It is built out of [which questions], it carries [how much of the variance], and customers at the low end are [what] while customers at the high end are [what].**

Filled in for the first component: PC1 is overall satisfaction. It is built out of the nine satisfaction questions, all correlating 0.77 to 0.84 with it, it carries 30.3% of the variance, and customers at the low end are satisfied while customers at the high end are unhappy.

And for the second: PC2 is price sensitivity. It is built out of the seven price questions, which own 0.964 of its budget, it carries 22.2% of the variance, and customers at the low end are driven by price while customers at the high end are not.

Say both of those out loud once. Then write them down where the next person to open your analysis will find them.

```r
# Write down what each component is and which end of it means what
components <- data.frame(
  component = c("PC1", "PC2"),
  name      = c("overall satisfaction", "price sensitivity"),
  low_end   = c("satisfied", "driven by price"),
  high_end  = c("unhappy", "price not a driver"),
  share     = round(summary(pca)$importance[2, 1:2], 3)
)
components
#>     component                 name         low_end           high_end share
#> PC1       PC1 overall satisfaction       satisfied            unhappy 0.303
#> PC2       PC2    price sensitivity driven by price price not a driver 0.222

# the two components are built to carry separate information
round(cor(pca$x[, "PC1"], pca$x[, "PC2"]), 10)
#> [1] 0
```

That last line is worth a second look. The correlation between the two sets of scores comes back as zero, and it always will, because PCA builds every component to be uncorrelated with the ones before it. So knowing a customer's satisfaction tells you nothing about their price sensitivity. Two components, and two readings that do not overlap.

[KEY INSIGHT]
A component is named when you can say three things without looking anything up: what it is made of, what to call it, and which end means what. Leave the direction off and you have half a name, which is how PC1 ends up on a chart axis with nobody able to say which way is good.

=== step === quiz
## Quick check: a component comes back with every sign flipped

A colleague refits the same survey on their own machine and sends you their PC1 column. Every weight has the opposite sign to yours: the seven positive-worded questions are now around +0.33 and `frustrating` and `thinking_quit` are around -0.32. What changed?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Nothing about what PC1 measures. It is the same axis pointing the other way, so the name still holds and the two ends swap: on their fit, a high PC1 score means satisfied. ::ok Yes. The seven still oppose the two and the gaps between the weights are identical, so the component is unchanged. Only the sentence about which end means what has to be rewritten.
- PC1 now measures dissatisfaction rather than satisfaction, so it needs a different name. ::no
- One of the two fits is wrong, and the sign tells you which, because the satisfaction questions should load positive. ::no
- Nothing at all, so the two of you can quote each other's customer scores without checking. ::no The component is genuinely the same, but its scores are not interchangeable: every one of theirs is your number with the sign turned over. So the name survives a flip and the direction sentence does not, which is exactly why the direction has to be written down beside the name rather than assumed.

=== step === tryit
## Your turn: find the most price-focused customer

Marketing wants the single most price-driven customer in the survey, to interview them.

You know PC2 is price sensitivity and you know all seven price questions load negative on it, so the customer you want is the one with the **lowest** PC2 score. `pca$x` holds every customer's score on every component, and its row names are the customer ids.

Find who that is, then pull their seven price answers out of `survey` to check the answer makes sense.

```r
# pca$x holds every customer's score on every component, with
# customer ids as row names. The price questions are columns 10 to 16
# of survey.
# Find the LOWEST scorer on PC2, then look at their price answers.
# Press Check when you have it.
```
::check {"regex": "(?=[\\s\\S]*(?:which[.]min|order[(]|sort[(]|min[(]))(?=[\\s\\S]*PC2)", "gate": true, "difficulty": "intermediate", "ok": "cust087, at -6.32, the lowest PC2 score in the survey. Their price answers are a 6 and then a 7 to all six of the others, about as price-driven as a 1 to 7 scale can record. And their PC1 score is 0.72, sitting in the middle of the satisfaction axis, so the most price-driven customer here is not an unhappy one. That separation is what the second component bought you.", "no": "Ask R for the position of the smallest score with which.min() applied to the PC2 column of pca$x. That gives you the customer id, and you can then index survey with that id and columns 10 to 16."}
::solution
```r
# Find the lowest PC2 scorer and look at their seven price answers
which.min(pca$x[, "PC2"])
#> cust087 
#>      87 

round(min(pca$x[, "PC2"]), 2)
#> [1] -6.32

survey["cust087", 10:16]
#>         price_matters compares_price waits_for_deal switch_cheaper
#> cust087             6              7              7              7
#>         too_expensive wants_cheaper checks_rivals
#> cust087             7             7             7
```

=== step === quiz
## Quick check: which naming sentence is right

Four write-ups of PC2 land in your inbox. The seven price questions load between -0.353 and -0.393 on it, they own 0.964 of its budget, and it carries 22.2% of the variance. Which sentence gets it right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- PC2 is price sensitivity, built from the seven price questions, and the highest scorers are the most price-driven customers. ::no
- PC2 measures how much customers dislike the product, since all seven of its big weights are negative. ::no
- PC2 is price sensitivity, built from the seven price questions, and because all seven load negative, the lowest scorers are the most price-driven customers. ::ok That is the whole sentence: what it is made of, what to call it, and which end means what. And it is checkable, since the lowest scorer answered 6 and then 7 across the price block.
- PC2 is price sensitivity, and at 22.2% against PC1's 30.3% it is the weaker signal, so pricing decisions should be read off PC1 instead. ::no Three of these go wrong in three different ways. One puts the price-driven customers at the high end when the weights are negative. One reads a negative sign as a bad mood, when all it says is which end of the axis a question sits on. And one confuses how much variance a component carries with what it is about: share of variance says how much of the survey an axis accounts for, not which question it answers, so PC1 stays the only place to read satisfaction and PC2 the only place to read price.

=== step === concept
## References

- [Principal component analysis: a review and recent developments](https://doi.org/10.1098/rsta.2015.0202) - Jolliffe and Cadima (2016), Philosophical Transactions of the Royal Society A 374, 20150202. The short modern overview, including a careful section on what interpreting a component does and does not license.
- [Principal component analysis](https://doi.org/10.1002/wics.101) - Abdi and Williams (2010), WIREs Computational Statistics 2(4), 433-459. The clearest treatment of the two things both called loadings, the eigenvector weights and the question-to-component correlations.
- [Principal Component Analysis, 2nd edition](https://doi.org/10.1007/b98835) - Jolliffe (2002), Springer. The standard reference; chapters 2 and 11 cover the algebra behind the weights and the rotations people apply to make components easier to name.
- [An Introduction to Statistical Learning, 2nd edition](https://www.statlearning.com/) - James, Witten, Hastie and Tibshirani (2021). Chapter 12 works PCA through with pictures, including the biplot that puts loadings and scores on one set of axes.
- [Principal Components Analysis](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prcomp.html) - R Core Team, the documentation for `prcomp()`, including exactly what `sdev`, `rotation`, `center`, `scale` and `x` contain.

=== step === complete
## Quick recap

You took one PCA result apart and came out the other side able to say what its components are. Here are the pieces, in the order you used them:

- **Loadings** (`pca$rotation`) are the recipe: one weight per question per component, with the squared weights in each column adding to 1. Sorting a column by size shows you what the component leans on. PC1 leaned on the nine satisfaction questions at 0.313 to 0.341 and gave everything else 0.081 or less.
- **Signs inside a column** say which questions oppose which. `frustrating` and `thinking_quit` came back positive against the other seven, which is how you know high PC1 means unhappy.
- **The sign of a whole column** says nothing. Negate all twenty weights and it is the same axis pointing the other way, so the name survives a flip but the direction sentence has to be rewritten.
- **Scores** (`pca$x`) are the recipe followed for one person: standardise their answers, multiply by the weights, add up the twenty products. Done by hand for `cust001` it gave -4.945573, which is what R had stored.
- **Loadings times `sdev`** turns a weight into the correlation between a question and a component score. `would_renew` came out at -0.81 with PC1, and that is the number to quote when somebody asks how you know.
- **A name is three things**: what it is made of, what to call it, and which end means what. PC1 is overall satisfaction, satisfied at the low end. PC2 is price sensitivity, price-driven at the low end.

So the next time a PCA hands you a wall of numbers, you have somewhere to start: sort a loadings column, read the names, check the signs, then go and look at whoever sits at the two ends and see whether the story holds. It usually does, and when it does not, that is worth knowing before the chart goes into a deck.

The question everybody asks next is how many components are worth keeping at all, and that turns out to be a different job from reading the ones you already have. Nicely done today, and enjoy the rest of it.
