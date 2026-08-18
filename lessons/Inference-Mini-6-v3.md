---
title: "Effect size: Cohen's d and friends, explained"
slug: "Inference-Mini-6-v3"
catalog_blurb: "Measuring how big an effect is, not just whether it is real."
description: "Two diet trials both pass p < 0.05: one moved half a kilo, one moved five. Build Cohen's d, eta squared, Cramer's V and r, and report size and test apart."
keywords: "effect size, Cohens d, Hedges g, eta squared, omega squared, Cramers V, Pearson r, practical significance, effect size in R, reporting results"
date: "2026-08-19"
post_type: "LESSON"
curriculum_id: "0.0.15"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "6"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-5"
webr: true
mathjax: true
---

=== step === cover
## Effect size: Cohen's d and friends, explained

Meera Iyer works for a health insurer, and next year she can fund exactly one weight programme. Two evaluations are sitting on her desk.

The first one mailed a diet leaflet to 1,200 members and sent nothing to another 1,200. Six months later the members who got the leaflet had lost half a kilo more. The test came back at p = 0.0026.

The second one coached 20 members and left another 20 alone. The coached group lost five kilos more. p = 0.00088.

Both results carry the same stamp. Both are significant. And to anybody actually choosing a diet, they are not remotely the same news.

Here is why that happens. Nobody ever asked the test how big the difference was. It was asked whether luck alone could have produced it, and half a kilo, given a big enough crowd, sails through.

The buttons below make that concrete. They answer the question the other way round: how many people you need in each group before an effect of a given size reliably shows up. A small effect needs hundreds per group. A large one needs a couple of dozen. Meera's leaflet had 1,200 per group, which is exactly the crowd it takes to make something tiny look certain.

::widget power-curve {}

That letter d on the labels is the number we are about to build. By the end of today you will report Meera's two results the way careful people do, as two separate answers: is it real, and is it big.

=== step === concept
## What does a p-value actually promise?

A p-value answers one narrow question, and it is worth saying out loud: if the programme changed nothing at all, how often would pure luck hand me a gap at least this big?

For the leaflet, p = 0.0026 means luck would manage that half kilo about twice in a thousand tries. Rare. So something is probably going on.

Now notice what is missing. Nowhere in that sentence is there a size. The p-value does not know, and cannot tell you, whether the gap was half a kilo or fifty. It grades how surprising the gap is if nothing is happening, and then it stops.

Let's build both of Meera's trials and put the two kinds of number side by side.

```r
set.seed(266)

# The mailed leaflet: 1,200 members were sent it, 1,200 were sent nothing
leaflet_kg   <- rnorm(1200, mean = 0.5, sd = 4.0)
leaflet_ctrl <- rnorm(1200, mean = 0.0, sd = 4.0)

# The coached pilot: 20 members coached, 20 sent nothing
coach_kg   <- rnorm(20, mean = 5.0, sd = 4.5)
coach_ctrl <- rnorm(20, mean = 0.3, sd = 4.5)

# How many kilos more did each programme's members lose?
leaflet_gap <- mean(leaflet_kg) - mean(leaflet_ctrl)
coach_gap   <- mean(coach_kg) - mean(coach_ctrl)
round(c(leaflet = leaflet_gap, coached = coach_gap), 2)
#> leaflet coached
#>    0.49    4.97

# And what did the usual test make of each one?
leaflet_p <- t.test(leaflet_kg, leaflet_ctrl)$p.value
coach_p   <- t.test(coach_kg, coach_ctrl)$p.value
signif(c(leaflet = leaflet_p, coached = coach_p), 3)
#>  leaflet  coached
#> 0.002570 0.000881
```

The leaflet moved people 0.49 kg. The pilot moved them 4.97 kg, ten times as much. Both p-values are small, both trials pass, and neither p-value mentions that factor of ten anywhere.

[KEY INSIGHT]
A p-value grades surprise, not size. Two results with the same p-value can differ tenfold in how much they move the thing you actually care about.

=== step === concept
## What happens to p when you add people?

Let's prove the crowd claim rather than just assert it.

Take the first 20 members of each leaflet arm. That is a small study with a real gap inside it: those 20 lost 0.54 kg more than their 20 controls. Now copy that exact pattern out to 200 per arm, and then to 1,200 per arm. Same gap every time. Same spread every time. The only thing changing is how many people are carrying it.

```r
slice_kg   <- head(leaflet_kg, 20)
slice_ctrl <- head(leaflet_ctrl, 20)

# Copy the same 20-person pattern out to bigger and bigger arms
tile <- function(copies) {
  arm_programme <- rep(slice_kg, copies)
  arm_nothing   <- rep(slice_ctrl, copies)
  c(per_arm = length(arm_programme),
    gap     = mean(arm_programme) - mean(arm_nothing),
    spread  = sd(arm_programme),
    p_value = t.test(arm_programme, arm_nothing)$p.value)
}

tiled <- rbind(tile(1), tile(10), tile(60))
rownames(tiled) <- c("20 each", "200 each", "1200 each")
round(tiled, 4)
#>           per_arm    gap spread p_value
#> 20 each        20 0.5447 5.0457  0.6968
#> 200 each      200 0.5447 4.9303  0.2044
#> 1200 each    1200 0.5447 4.9200  0.0018
```

The same 0.54 kg every row. Practically the same spread every row. And the p-value slides from 0.70, which is nothing whatsoever, to 0.0018, which plenty of journals would print in bold.

Nothing about the effect changed. Only the crowd did.

[WARNING]
This runs in both directions. A big study can stamp a trivial effect as significant, and a small study can leave a huge effect unstamped. The stamp reports how much evidence you gathered, not how much the thing matters.

=== step === quiz
## Which trial found the bigger effect?

Meera's leaflet: 2,400 members, 0.49 kg, p = 0.0026. Her coached pilot: 40 members, 4.97 kg, p = 0.00088. Suppose the kilos had been left off both reports and all you had were the two p-values. Which trial found the bigger effect?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The coached pilot, because its p-value is the smaller of the two. ::no
- The leaflet, because 2,400 members is a far more reliable study. ::no
- You cannot tell. Neither p-value reports a size, so neither one can be compared on size. ::ok Exactly. A p-value is a statement about luck, and rearranging two of them will never produce a size. You need a different number, which is the one we build next.
- The same size, because both cleared the same threshold. ::no A p-value answers "could luck have done this", and how small it gets is driven as much by how many people you tested as by how big the effect is. Neither the smaller p, nor the bigger sample, nor the shared threshold tells you which programme moved more weight.

=== step === concept
## How do you compare half a kilo to five kilos fairly?

Half a kilo and five kilos are both measured in kilos, so comparing them looks trivial. It is not, and the reason is the interesting part.

People's weight moves around on its own. Some members lose 6 kg in six months with no help at all, others gain 4. That ordinary variation between people is the background noise any programme has to be heard over. If members typically differ from each other by about 4 kg anyway, then a half kilo difference is lost inside the crowd, and a five kilo difference is not.

So the fair ruler is not the kilo. It is the ordinary spread between people.

The standard deviation is exactly that ruler: the typical distance between one person's result and the group's average result. Let's measure it in Meera's four groups.

```r
# The typical distance from the average, in each of the four groups
round(c(leaflet_nothing   = sd(leaflet_ctrl),
        leaflet_programme = sd(leaflet_kg),
        coach_nothing     = sd(coach_ctrl),
        coach_programme   = sd(coach_kg)), 2)
#>   leaflet_nothing leaflet_programme     coach_nothing   coach_programme
#>              3.93              4.06              3.67              4.90

# Each gap, measured in those units instead of in kilos
round(c(leaflet = leaflet_gap / sd(leaflet_ctrl),
        coached = coach_gap / sd(coach_ctrl)), 2)
#> leaflet coached
#>    0.13    1.35
```

About 4 kg of ordinary spread in every group. Divide each gap by it and the two trials finally sit on one scale: the leaflet moved members by 0.13 of a typical person's spread, the pilot by 1.35 of it.

That is the whole idea. Everything left is doing it properly.

=== step === concept
## What is Cohen's d?

Cohen's d is that same division, done properly.

Properly means fixing one thing. A moment ago I divided by the spread of the do-nothing arm alone, which throws away everything the other arm knows about how much people vary. Both groups have something to say about it, so you combine them into a single number called the pooled standard deviation. It is a weighted average of the two groups' variances, with the bigger group counting for more, and then the square root of the result.

\[ s_{pooled} = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}} \]

Here \(n_1\) and \(n_2\) are the two group sizes and \(s_1^2\) and \(s_2^2\) are their variances. A variance is just a standard deviation squared, so this averages the two spreads in the one form where averaging them is legitimate, then undoes the squaring at the end.

Cohen's d is the gap divided by that pooled ruler:

\[ d = \frac{\bar{x}_1 - \bar{x}_2}{s_{pooled}} \]

Written out in R, one step per line:

```r
cohens_d <- function(x, y) {
  n1 <- length(x)
  n2 <- length(y)
  pooled_sd <- sqrt(((n1 - 1) * var(x) + (n2 - 1) * var(y)) / (n1 + n2 - 2))
  (mean(x) - mean(y)) / pooled_sd
}

d_leaflet <- cohens_d(leaflet_kg, leaflet_ctrl)
d_coach   <- cohens_d(coach_kg, coach_ctrl)
round(c(leaflet = d_leaflet, coached = d_coach), 3)
#> leaflet coached
#>   0.123   1.149
```

Now read those two out in plain words. The leaflet shifted its members by about an eighth of a typical person's spread. The pilot shifted them by a full spread and a bit more. The same stamp on both reports, nearly ten times the effect on one of them.

=== step === concept
## What does d = 1.15 actually look like?

A d is a separation, and a separation is a picture. Draw each group as a curve showing where its members landed, and you can see what the two numbers mean.

```r
lf_nothing <- density(leaflet_ctrl)
lf_leaflet <- density(leaflet_kg)
co_nothing <- density(coach_ctrl)
co_coached <- density(coach_kg)

par(mfrow = c(1, 2))
plot(lf_nothing, main = "Mailed leaflet: d = 0.12", xlab = "kg lost in six months",
     col = "#677084", lwd = 2, ylim = c(0, max(lf_nothing$y, lf_leaflet$y)))
lines(lf_leaflet, col = "#b5631a", lwd = 2)
legend("topright", c("sent nothing", "on the programme"),
       col = c("#677084", "#b5631a"), lwd = 2, bty = "n", cex = 0.8)

plot(co_nothing, main = "Coached pilot: d = 1.15", xlab = "kg lost in six months",
     col = "#677084", lwd = 2, ylim = c(0, max(co_nothing$y, co_coached$y)))
lines(co_coached, col = "#b5631a", lwd = 2)
```

On the left, the leaflet. The two curves sit almost exactly on top of each other. Pull one member out of each group at random and you would have no real chance of guessing which arm they came from. That is d = 0.12.

On the right, the pilot. The curves have pulled apart. There is still plenty of overlap, because people vary, but the shift is something your eyes can see without being told. That is d = 1.15.

[KEY INSIGHT]
d is how far apart two groups sit, measured in typical-person units. A d of 1 means the average person on the programme did better than roughly 84 out of every 100 people who were not on it.

=== step === tryit
## Your turn: how big was the app programme?

Meera has a third evaluation in the pile. A phone app was tried on 8 members against 8 who got nothing, and the app group lost about 1.9 kg more over the six months.

1.9 kg sits between her other two results, and much closer to the leaflet's half kilo than to the pilot's five. Is the effect small to match? Work out Cohen's d and see. Your `cohens_d()` function is already loaded, so this is one line.

```r
app_kg   <- c(4.1, -1.4, 5.6, 1.2, 6.9, 1.8, -2.0, 4.6)
app_ctrl <- c(1.4, -3.2, 2.9, -1.6, 4.8, 0.2, -2.1, 3.0)

# Your line here: Cohen's d for the app group against the no-programme group.
```
::check {"regex": "cohens_d\\s*[(]\\s*app_kg\\s*,\\s*app_ctrl\\s*[)]|sqrt[\\s\\S]*var\\s*[(]\\s*app_kg", "gate": true, "difficulty": "beginner", "ok": "That is it: d = 0.633. The app moved about two fifths of the kilos the coached pilot did, but more than half the effect, because this group varied less from person to person. The kilos on their own were misleading you.", "no": "Hand both vectors to cohens_d(), the treated group first: cohens_d(app_kg, app_ctrl). Or build the pooled standard deviation yourself with var() and sqrt(), then divide the gap by it."}
::solution
```r
round(cohens_d(app_kg, app_ctrl), 3)
#> [1] 0.633
```

=== step === concept
## Where do small, medium and large come from?

You now have three numbers: 0.12, 0.63 and 1.15. Are those big?

Jacob Cohen faced the same question in 1988 and handed the field a set of rough labels. A d around 0.2 is small, 0.5 is medium, 0.8 is large. He picked them from comparisons anyone can picture: a d of 0.2 is roughly the height difference between 15 and 16 year old girls, which you would not spot across a room, and a d of 0.8 is roughly the difference between 13 and 18 year old girls, which you would.

They are conventions, not laws of nature. Cohen said as much himself and was uneasy about them being used as a scoreboard. They are still what journals expect, and they are a reasonable place to start when you have nothing better.

```r
interpret_d <- function(d) {
  size <- abs(d)
  if (size < 0.2) "negligible"
  else if (size < 0.5) "small"
  else if (size < 0.8) "medium"
  else "large"
}

c(leaflet = interpret_d(d_leaflet),
  app     = interpret_d(cohens_d(app_kg, app_ctrl)),
  coached = interpret_d(d_coach))
#>      leaflet          app      coached
#> "negligible"     "medium"      "large"
```

Negligible, medium, large. Three programmes, one scale, and now they can be argued about honestly.

[WARNING]
Do not stop at the label. A d of 0.1 in a cheap mailing that reaches two million people can be worth far more than a d of 1.2 in a programme that needs a coach for every twelve members. The label tells you the size. It does not tell you the value.

=== step === quiz
## Which of these is worth acting on?

Meera can fund one programme. The leaflet costs almost nothing per member and scored d = 0.12 across 2,400 people. The coached pilot needs a dietitian for every twelve members and scored d = 1.15 across 40.

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The pilot, because the larger d always wins. ::no
- The leaflet, because it has far more members behind it. ::no
- Whichever one Cohen's benchmarks call large. ::no A benchmark is a translation, not a decision. It turns 1.15 into the word "large" and then stops. Cost, reach and what the effect actually buys are not inside the number, and no amount of staring at d will put them there.
- Neither d decides on its own. The size has to be weighed against what each programme costs and how many people it reaches. ::ok Right. The effect size makes the two results comparable, which is the job it exists to do. Deciding is a separate job, and it needs the price tag sitting next to the number.

=== step === concept
## What if the study was tiny?

Cohen's d has one known flaw: on small samples it runs a little hot. With 40 people the pooled standard deviation you compute tends to land slightly below the real spread in the population, and dividing by a ruler that is slightly too short makes d slightly too long.

Hedges' g is the repair. It is Cohen's d multiplied by a correction factor that sits close to 1 for a big study and bites on a small one.

\[ g = d \times \left(1 - \frac{3}{4N - 9}\right) \]

Here \(N\) is the total number of people across both groups.

```r
hedges_g <- function(x, y) {
  total_n    <- length(x) + length(y)
  correction <- 1 - 3 / (4 * total_n - 9)
  cohens_d(x, y) * correction
}

round(c(leaflet_d = d_leaflet, leaflet_g = hedges_g(leaflet_kg, leaflet_ctrl),
        coach_d   = d_coach,   coach_g   = hedges_g(coach_kg, coach_ctrl)), 3)
#> leaflet_d leaflet_g   coach_d   coach_g
#>     0.123     0.123     1.149     1.126
```

For the leaflet, with 2,400 people in it, the correction works out at 0.9997 and d does not move at all. For the 40 person pilot the correction is 0.9801, and 1.149 becomes 1.126. Two percent, quietly taken back.

[TIP]
Report g rather than d whenever the total across both groups is 50 or fewer. Above about 100 people the two agree to three decimals, so it rarely matters, and reporting g is never wrong.

=== step === concept
## How precise is that d?

The correction shifted the pilot by 0.02, and that small nudge is a hint worth chasing. It happened because 40 people is not many, and the same shortage has a far larger consequence hiding behind it.

Every d you compute is an estimate made from one sample. Run the pilot again with 40 different members and you would get a different d. So the honest way to report one is with a range around it. The standard error of d, which is the typical size of that wobble, has a tidy formula:

\[ SE(d) = \sqrt{\frac{n_1 + n_2}{n_1 n_2} + \frac{d^2}{2(n_1 + n_2)}} \]

and the usual 95 percent interval runs from 1.96 standard errors below d to 1.96 above it.

```r
d_with_interval <- function(x, y) {
  n1 <- length(x)
  n2 <- length(y)
  d  <- cohens_d(x, y)
  se <- sqrt((n1 + n2) / (n1 * n2) + d^2 / (2 * (n1 + n2)))
  c(d = d, low = d - 1.96 * se, high = d + 1.96 * se)
}

round(d_with_interval(leaflet_kg, leaflet_ctrl), 2)
#>    d  low high
#> 0.12 0.04 0.20

round(d_with_interval(coach_kg, coach_ctrl), 2)
#>    d  low high
#> 1.15 0.48 1.82
```

Put those two rows next to each other and Meera's real problem walks into the room.

The leaflet: 0.12, with an interval from 0.04 to 0.20. Tiny, and precisely tiny. Her 2,400 members bought her certainty about a difference nobody would feel.

The pilot: 1.15, with an interval from 0.48 to 1.82. The effect might be medium. It might be enormous. Forty people cannot tell her which.

[KEY INSIGHT]
An effect size without an interval is half a result. The interval is the thing that stops a promising pilot from being sold upstairs as a proven programme.

=== step === concept
## What if there are three programmes, not two?

Meera's next question does not fit d at all. She has her insurer's own records for 90 members who finished a programme last year, 30 on each of the three, and she wants to know how much of the difference in weight lost goes with which programme somebody was on.

d compares two groups by subtracting one average from the other. With three groups there is no single gap to subtract, so the question has to be asked differently: of all the variation in kilos lost, what share does the programme account for?

Let's build the records first.

```r
set.seed(11)

sessions_attended <- c(rpois(30, 2), rpois(30, 6), rpois(30, 12))
kg_dropped        <- 0.2 + 0.32 * sessions_attended + rnorm(90, mean = 0, sd = 1.8)
start_weight      <- rnorm(90, mean = 88, sd = 12)
stayed <- c(sample(rep(c("yes", "no"), c(9, 21))),
            sample(rep(c("yes", "no"), c(18, 12))),
            sample(rep(c("yes", "no"), c(27, 3))))

records <- data.frame(
  programme   = factor(rep(c("leaflet", "app", "coach"), each = 30),
                       levels = c("leaflet", "app", "coach")),
  sessions    = sessions_attended,
  kg_lost     = round(kg_dropped, 1),
  baseline_kg = round(start_weight, 1),
  stuck       = factor(stayed, levels = c("yes", "no"))
)

head(records, 5)
#>   programme sessions kg_lost baseline_kg stuck
#> 1   leaflet        1     0.4        81.0    no
#> 2   leaflet        0     1.2        71.0   yes
#> 3   leaflet        2     5.3       100.4    no
#> 4   leaflet        0     0.5        78.6    no
#> 5   leaflet        0     1.1       122.2    no

round(tapply(records$kg_lost, records$programme, mean), 2)
#> leaflet     app   coach
#>    0.89    2.35    3.18
```

Now the standard way of comparing three groups at once, an analysis of variance. Its job is to split the total variation in kilos lost into the part that goes with the programme and the part left over inside the groups.

```r
fit  <- aov(kg_lost ~ programme, data = records)
atbl <- summary(fit)[[1]]
atbl
#>             Df  Sum Sq Mean Sq F value    Pr(>F)
#> programme    2  80.438  40.219  13.481 7.944e-06 ***
#> Residuals   87 259.556   2.983
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The two numbers in the Sum Sq column are the entire story. 80.4 units of variation go with the programme. 259.6 units are differences between people who were on the same programme, which the programme cannot claim.

Eta squared is simply the first as a share of the whole:

\[ \eta^2 = \frac{SS_{between}}{SS_{total}} \]

Omega squared is the same idea with the small-sample optimism taken back out, in exactly the spirit of Hedges' g:

\[ \omega^2 = \frac{SS_{between} - df_{between} \times MS_{error}}{SS_{total} + MS_{error}} \]

Two new pieces there, and both are read straight off the table above. \(df_{between}\) is the Df on the programme row, one fewer than the number of programmes, so 2. \(MS_{error}\) is the Mean Sq on the residuals row, the leftover variation per degree of freedom, 2.983 here.

```r
ss_between <- atbl$"Sum Sq"[1]
ss_total   <- sum(atbl$"Sum Sq")
df_between <- atbl$Df[1]
ms_error   <- atbl$"Mean Sq"[2]

eta_sq   <- ss_between / ss_total
omega_sq <- (ss_between - df_between * ms_error) / (ss_total + ms_error)
round(c(eta_squared = eta_sq, omega_squared = omega_sq), 3)
#>   eta_squared omega_squared
#>         0.237         0.217
```

About 24 percent of the differences in kilos lost go with which programme somebody was on, and 22 percent once the correction is applied. On Cohen's scale for this family, where 0.01 is small, 0.06 is medium and 0.14 is large, that is a large effect. It also leaves three quarters of the variation unexplained, which is the honest half of the same sentence.

=== step === tryit
## Your turn: does the programme explain who turns up?

Kilos lost is one outcome. Meera also wants to know whether the programme explains attendance, which is the sessions column: how many sessions each member actually turned up to.

Same recipe, different outcome. The analysis of variance table is built for you below, and its two sums of squares are printed out. Turn them into eta squared.

```r
sess_tbl <- summary(aov(sessions ~ programme, data = records))[[1]]
sess_tbl$"Sum Sq"
#> [1] 1205.0889  390.9667

# Your line here: eta squared is the first sum of squares as a share of the total.
```
::check {"regex": "(?=[\\s\\S]*Sum Sq)(?=[\\s\\S]*sum\\s*[(])(?=[\\s\\S]*/)[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "0.755. The programme explains about three quarters of the differences in attendance, far more than the quarter of the weight loss it explained. Meera can get people to turn up much more reliably than she can get them to lose weight.", "no": "You want the between-programme sum of squares as a share of the total of both. Pull the first one out by indexing the Sum Sq column at position 1, add both up with sum(), and divide one by the other."}
::solution
```r
round(sess_tbl$"Sum Sq"[1] / sum(sess_tbl$"Sum Sq"), 3)
#> [1] 0.755
```

=== step === concept
## Two categories: who stuck with it?

Meera's third question has no measurements in it at all. Her records carry a stuck column: was the member still turning up in month six, yes or no? She wants to know whether the programme explains sticking with it.

Two categorical things, so the usual test is a chi squared test. And the usual trap is standing right behind it, because chi squared grows with the number of people. Double the members while keeping the pattern identical and chi squared doubles too. Like a p-value, it is not a size.

Cramer's V rescales it onto a 0 to 1 range that does not care how many people you had:

\[ V = \sqrt{\frac{\chi^2}{N(k-1)}} \]

Here \(N\) is the number of people in the table and \(k\) is the smaller of its two dimensions, so dividing by \(N\) is what takes the crowd back out.

```r
stick_tab <- table(programme = records$programme, stuck = records$stuck)
stick_tab
#>          stuck
#> programme yes no
#>   leaflet   9 21
#>   app      18 12
#>   coach    27  3

chi <- chisq.test(stick_tab)
round(as.numeric(chi$statistic), 2)
#> [1] 22.5
signif(chi$p.value, 3)
#> [1] 1.3e-05

n_people     <- sum(stick_tab)
smaller_side <- min(dim(stick_tab))
cramers_v    <- sqrt(as.numeric(chi$statistic) / (n_people * (smaller_side - 1)))
round(cramers_v, 3)
#> [1] 0.5
```

Nine of the 30 leaflet members were still going in month six, 18 of the app members, 27 of the coached. V = 0.5. This table has 2 degrees of freedom, one fewer than its three rows times one fewer than its two columns, and at that size 0.5 is a strong association.

[TIP]
V's benchmarks move with the size of the table. For a 2 by 2 table, small, medium and large sit at 0.10, 0.30 and 0.50. For a table with 2 degrees of freedom the same labels sit near 0.07, 0.21 and 0.35, and they keep shrinking as the table grows. Print the degrees of freedom next to V and nobody has to guess which set you meant.

=== step === concept
## Two numbers that move together

The last shape in Meera's records is two measurements side by side. Does turning up to more sessions go with losing more weight?

For that shape the effect size is already sitting there. Pearson's r, the correlation, measures how tightly two measurements move together, and it runs from -1 to 1 whatever units they were in. So it needs no rescaling to serve as an effect size. It already is one. Square it and you get r squared, the share of the variation in one measurement that goes with the other, which is the same share-of-variance scale eta squared lives on.

```r
r_sessions <- cor(records$sessions, records$kg_lost)
round(c(r = r_sessions, r_squared = r_sessions^2), 3)
#>         r r_squared
#>     0.543     0.295

round(cor(records[, c("sessions", "kg_lost", "baseline_kg")]), 2)
#>             sessions kg_lost baseline_kg
#> sessions        1.00    0.54       -0.06
#> kg_lost         0.54    1.00        0.09
#> baseline_kg    -0.06    0.09        1.00
```

::widget correlation-heatmap {"vars": ["sessions", "kg_lost", "baseline_kg"], "matrix": [[1, 0.54, -0.06], [0.54, 1, 0.09], [-0.06, 0.09, 1]]}

r = 0.54 between sessions and kilos lost, which on Cohen's scale for correlations, where 0.10 is small, 0.30 is medium and 0.50 is large, counts as large. Squared, it says attendance accounts for about 30 percent of who lost weight, a shade more than the programme label itself managed at 0.237. Which makes sense, because turning up is the thing the programme was trying to cause in the first place.

Now look at the third row and column. Starting weight barely moves with either one, at -0.06 and 0.09. Near zero is an effect size too, and here it is a useful one: heavier members did not do systematically better or worse, so Meera does not have to worry that one programme was handed an easier crowd.

=== step === concept
## Which effect size does my question need?

Four questions, four different answers, and Meera chose none of them. The shape of her data chose for her.

::widget tree-diagram {"root": "comparing groups?", "l": "just two groups?", "r": "both categorical?", "leaves": ["d or g", "eta2, omega2", "V", "r, r squared"]}

Read it from the top. Are you comparing groups? If yes and there are two of them, it is Cohen's d, or Hedges' g when the study is small. If yes and there are three or more, it is eta squared, or omega squared for the corrected version. If you are not comparing groups but asking whether two things move together, then it depends what they are: two categorical columns give you Cramer's V, two measurements give you r and r squared.

The family is fixed by the data. The only choice left is inside the family, and it is a small one: g instead of d for a small study, omega squared instead of eta squared for the same reason.

Each family carries its own small, medium and large, and they do not transfer:

| Effect size | Small | Medium | Large | Use it when |
|---|---|---|---|---|
| Cohen's d, Hedges' g | 0.2 | 0.5 | 0.8 | Comparing two group averages |
| Eta squared, omega squared | 0.01 | 0.06 | 0.14 | Comparing three or more groups |
| Cramer's V (1 degree of freedom) | 0.10 | 0.30 | 0.50 | Two categorical columns |
| Pearson's r | 0.10 | 0.30 | 0.50 | Two measurements |

An eta squared of 0.14 is large. A d of 0.14 is nothing at all. Same digits, different families, opposite meanings, which is why the name of the measure always travels with the number.

=== step === concept
## How do you write it up in one sentence?

Everything so far collapses into one habit: answer both questions in the same sentence, and never let one of them stand in for the other.

Four pieces, in this order.

1. What changed, in the units your reader cares about. Kilos, not standard deviations.
2. How big that is on the standard scale, with the name of the measure attached.
3. The interval around it, so the reader knows how firm the number is.
4. The p-value, last, doing the one small job it is genuinely good at.

```r
coach_ci <- d_with_interval(coach_kg, coach_ctrl)

report <- data.frame(
  measured = "kg lost in six months",
  gap_kg   = round(coach_gap, 2),
  cohens_d = round(coach_ci[["d"]], 2),
  ci_95    = paste0(round(coach_ci[["low"]], 2), " to ", round(coach_ci[["high"]], 2)),
  p_value  = signif(coach_p, 3)
)
print(report, row.names = FALSE)
#>               measured gap_kg cohens_d        ci_95  p_value
#>  kg lost in six months   4.97     1.15 0.48 to 1.82 0.000881
```

Read out as English, that is: coached members lost 4.97 kg more over six months than members who were sent nothing (Cohen's d = 1.15, 95 percent interval 0.48 to 1.82, p = 0.000881).

One sentence, both answers. It is real, because luck would hardly ever produce it. It is big, because 1.15 spreads is a lot of weight. And the interval keeps everybody honest about the pilot being 40 people and no more.

Compare that with what Meera had on her desk this morning: "the coached pilot was statistically significant". Same study, half the information.

=== step === quiz
## Meera gets a fourth question

Her board asks whether the three programmes differ in how many members stick with them to month six. She has 90 members, three programmes, and a yes or no column. Which write-up does the job?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Sticking with a programme differed significantly by programme, chi squared = 22.5, df = 2, p = 0.000013. ::no
- Programme explained 24 percent of the variation in sticking with it, eta squared = 0.237. ::no
- Members still going at month six rose from 9 of 30 on the leaflet to 27 of 30 with a coach, a strong association (Cramer's V = 0.50, chi squared = 22.5, df = 2, p = 0.000013). ::ok Exactly. Real counts first, then the size on the right scale with its name attached, then the test doing its small job at the end. A reader can act on that sentence without asking you a single follow-up question.
- The association between programme and sticking with it was strong, Cramer's V = 0.50. ::no Each of the other three drops one half of the job. The first reports a test and no size. The second borrows eta squared, which belongs to a measured outcome split by groups, not to two categorical columns. The last reports a size with no test and no counts behind it, so nobody can tell whether 0.50 came from 90 members or 9.

=== step === concept
## References

- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*, 2nd edition. Lawrence Erlbaum. The source of the 0.2 / 0.5 / 0.8 benchmarks and the height comparisons behind them. [doi.org/10.4324/9780203771587](https://doi.org/10.4324/9780203771587)
- Lakens, D. (2013). Calculating and reporting effect sizes to facilitate cumulative science: a practical primer for t-tests and ANOVAs. *Frontiers in Psychology*, 4, 863. The clearest modern walkthrough of d, g, eta squared and omega squared together. [doi.org/10.3389/fpsyg.2013.00863](https://doi.org/10.3389/fpsyg.2013.00863)
- Cumming, G. (2014). The New Statistics: Why and How. *Psychological Science*, 25(1), 7-29. The case for reporting estimates and intervals rather than test verdicts. [doi.org/10.1177/0956797613504966](https://doi.org/10.1177/0956797613504966)
- Nakagawa, S. and Cuthill, I. C. (2007). Effect size, confidence interval and statistical significance: a practical guide for biologists. *Biological Reviews*, 82, 591-605. Where the standard error and interval used here come from. [doi.org/10.1111/j.1469-185X.2007.00027.x](https://doi.org/10.1111/j.1469-185X.2007.00027.x)
- Olejnik, S. and Algina, J. (2003). Generalized eta and omega squared statistics: measures of effect size for some common research designs. *Psychological Methods*, 8(4), 434-447. On why eta squared runs hot and what to report instead. [doi.org/10.1037/1082-989X.8.4.434](https://doi.org/10.1037/1082-989X.8.4.434)

=== step === complete
## Part 6 complete

Meera came in with two reports that carried the same stamp and told her nothing about which programme to fund. She leaves with a number for each.

The leaflet moved 0.49 kg, which is d = 0.12, interval 0.04 to 0.20. Real, and reliably nothing. The coached pilot moved 4.97 kg, which is d = 1.15, interval 0.48 to 1.82. You handled her other three questions too, each with the measure its data called for: eta squared at 0.237 for three programmes against kilos lost, Cramer's V at 0.50 for who was still going at month six, r at 0.54 for whether turning up went with losing weight. And you can now write any of them as one sentence that answers both questions separately, with the size named, an interval on it, and the p-value doing its small job at the end.

The honest caveat is the pilot's interval. From 0.48 to 1.82 covers everything from a decent effect to a spectacular one, because 40 people were never going to pin it down. So Meera's decision is not "fund the coach". It is "fund the coach for a bigger trial", and she can now say exactly how much bigger, because she has a d to design around.
