---
title: "Experimentation Lesson 4: Cluster and Switchback Experiments"
catalog_blurb: "When users interfere, randomize whole groups or time blocks instead."
description: "When users interfere, user-level A/B tests break. Cluster randomization, the ICC and design effect, and switchback experiments for marketplaces, in R."
keywords: "cluster randomized experiment, switchback experiment, design effect, intraclass correlation, ICC, interference, network effects, marketplace experiments, A/B testing, SUTVA, cluster randomization, R"
post_type: "LESSON"
curriculum_id: "6.170.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "4"
course_total: "7"
course_landing: "R-Experimentation-Course.html"
course_next: "Multi-Armed-Bandits-Explore-vs-Exploit.html"
course_prev: "Experiment-Pitfalls-Peeking-and-SRM.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Cluster and Switchback Experiments

Lesson 3 closed on the one pitfall with no statistical fix: interference. Asha saw the referral banner, sent Rohan a coupon, and a control member spent treatment money while every automated check stayed green. You cannot correct that at analysis time. You have to design it away.

This lesson is about the two designs that do it, and they share one move: **stop randomizing the individual, and randomize something bigger, so the units that interfere always land on the same side of the split.** A **cluster experiment** fences in space: whole cities, stores or schools. A **switchback** fences in time: the whole market flips between arms on a randomized schedule. Both work. Both also send you a bill, priced by one number you will learn to compute: the design effect.

By the end of this lesson you will be able to:

- Explain how cluster and switchback designs contain interference, and pick the right fence for a given leak
- Compute the intraclass correlation and the design effect, and turn a headcount into its honest, effective sample size
- Show by simulation why analyzing members when you randomized cities manufactures false winners, and run the correct cluster-level test
- Analyze a switchback at the block level and tighten it by removing the time-of-day pattern

**Prerequisites:** Lessons 1 to 3 of this course ([Designing Experiments for Power](Designing-Experiments-for-Power.html), [Variance Reduction with CUPED](Variance-Reduction-with-CUPED.html), [Experiment Pitfalls, Peeking and SRM](Experiment-Pitfalls-Peeking-and-SRM.html)) for power, the regression-adjustment trick and the interference problem itself; plus the two-sample comparison ([Comparing groups with t-tests](Comparing-Groups-with-t-tests.html)).

::widget process-flow {"steps":[{"title":"The leak","sub":"treatment crosses arms through coupons, drivers or shared stock"},{"title":"Fence in space","sub":"cluster experiments randomize whole cities, stores or schools"},{"title":"Fence in time","sub":"switchbacks flip the whole market between arms on a schedule"},{"title":"The bill","sub":"correlated units count for less: the design effect prices it"}]}

=== step === concept
::eyebrow Fence in space
## Randomize the city, not the member

Back to the test that failed. Meera's referral program, give 15 dollars, get 15 dollars, is meant for the shoe store's 40,000 loyalty members, and the member-level version leaked: treated members sent coupons to control friends, control spend rose, and the measured lift shrank. Now use the one thing the leak told us: coupons travel along friendships, and friends overwhelmingly live in the **same city**.

The loyalty program operates in 40 cities, about 1,000 members each. So instead of assigning each member a coin flip, Meera flips 40 coins, one per city: in 20 cities every member sees the referral banner, in the other 20 nobody does. When Asha sends Rohan a coupon now, it does not matter, because Asha and Rohan both live in Jaipur, and all of Jaipur is in the same arm. The coupon lands inside the fence.

::widget process-flow {"steps":[{"title":"List the clusters","sub":"the 40 cities the loyalty program operates in"},{"title":"Randomize cities, not members","sub":"20 cities show the referral banner, 20 keep the current site"},{"title":"Members follow their city","sub":"Asha and Rohan both live in Jaipur, so they share an arm"},{"title":"Compare city averages","sub":"the test now has 40 units, not 40,000"}]}

Two pieces of vocabulary make the design precise:

- The **unit of randomization** is what the coin flip assigns: here, the city. This is called a **cluster-randomized experiment**, and the city is the cluster.
- The **unit of measurement** can stay small: Meera still records spend per member. Randomize big, measure small.

One honest caveat before the enthusiasm: the fence only contains what actually stays inside it. Cluster randomization assumes interference is mostly **within** clusters, friends in the same city, shoppers in the same store, pupils in the same school. A coupon mailed from Jaipur to a cousin in Surat still leaks. Pick the cluster to match the plumbing you mapped in Lesson 3: the point of the exercise is that most sharing happens inside the boundary you randomize.

=== step === concept
::eyebrow The catch
## City-mates move together

If clusters solved everything for free, nobody would run user-level tests. Here is the catch, and it starts with a concrete weekend. A food festival in Jaipur nudges every Jaipur member to spend a little more that month. Roadworks around Surat's biggest mall trim every Surat member's visits. Two members of the same city share these shocks; two members of different cities do not. Member spend within a city is therefore **correlated**: knowing that one Jaipur member spent above average tells you a little about the next Jaipur member.

Below is one month of spend for a dozen members in each of six of Meera's cities. Look at how wide each box is (members within a city differ enormously, spread of about 40 dollars) versus how little the boxes shift city to city (about 8 dollars). The city effect is real but small, almost invisible:

::widget chart-plotter {"data":[{"x":"Jaipur","y":105},{"x":"Jaipur","y":79},{"x":"Jaipur","y":91},{"x":"Jaipur","y":145},{"x":"Jaipur","y":127},{"x":"Jaipur","y":74},{"x":"Jaipur","y":44},{"x":"Jaipur","y":18},{"x":"Jaipur","y":60},{"x":"Jaipur","y":59},{"x":"Jaipur","y":6},{"x":"Jaipur","y":139},{"x":"Indore","y":7},{"x":"Indore","y":95},{"x":"Indore","y":104},{"x":"Indore","y":66},{"x":"Indore","y":21},{"x":"Indore","y":35},{"x":"Indore","y":60},{"x":"Indore","y":67},{"x":"Indore","y":77},{"x":"Indore","y":81},{"x":"Indore","y":118},{"x":"Indore","y":154},{"x":"Kochi","y":112},{"x":"Kochi","y":54},{"x":"Kochi","y":13},{"x":"Kochi","y":51},{"x":"Kochi","y":105},{"x":"Kochi","y":142},{"x":"Kochi","y":126},{"x":"Kochi","y":43},{"x":"Kochi","y":58},{"x":"Kochi","y":182},{"x":"Kochi","y":73},{"x":"Kochi","y":59},{"x":"Nagpur","y":48},{"x":"Nagpur","y":73},{"x":"Nagpur","y":100},{"x":"Nagpur","y":44},{"x":"Nagpur","y":193},{"x":"Nagpur","y":39},{"x":"Nagpur","y":101},{"x":"Nagpur","y":61},{"x":"Nagpur","y":140},{"x":"Nagpur","y":127},{"x":"Nagpur","y":35},{"x":"Nagpur","y":81},{"x":"Surat","y":48},{"x":"Surat","y":99},{"x":"Surat","y":62},{"x":"Surat","y":141},{"x":"Surat","y":55},{"x":"Surat","y":79},{"x":"Surat","y":51},{"x":"Surat","y":55},{"x":"Surat","y":87},{"x":"Surat","y":150},{"x":"Surat","y":156},{"x":"Surat","y":111},{"x":"Patna","y":70},{"x":"Patna","y":47},{"x":"Patna","y":80},{"x":"Patna","y":101},{"x":"Patna","y":59},{"x":"Patna","y":92},{"x":"Patna","y":56},{"x":"Patna","y":78},{"x":"Patna","y":125},{"x":"Patna","y":158},{"x":"Patna","y":15},{"x":"Patna","y":72}],"geoms":["boxplot"],"x":"city","y":"spend","code":{"boxplot":"ggplot(members, aes(city, spend)) +\n  geom_boxplot()"}}

Statistics has a standard number for how strongly cluster-mates move together: the **intraclass correlation**, written \(\rho\) (rho). Split the total member-to-member variance into two parts: \(\sigma_b^2\) (sigma-b squared), the variance **between** city baselines, the shared part, and \(\sigma_w^2\) (sigma-w squared), the variance **within** a city, the individual part. Then

\[ \rho = \frac{\sigma_b^2}{\sigma_b^2 + \sigma_w^2} \]

the fraction of all outcome variance that lives at the cluster level. For Meera's members: \(\sigma_b = 8\), \(\sigma_w = 40\), so \(\rho = 64 / (64 + 1600) \approx 0.04\). Only 4% of the spread in member spend is city-level. That sounds like a rounding error. The next step shows it costing Meera 97% of her sample.

=== step === concept
::eyebrow The bill
## The design effect: what the fence costs

Why should a 4% correlation matter? Because statistical information comes from **independent** observations, and cluster-mates are partly copies of each other. Asking 1,000 members of one city about their spend is a little like asking 1,000 residents of one apartment block about the neighborhood: informative, but nowhere near 1,000 independent answers, because they all share the same festival, the same roadworks, the same local economy.

The exact price has a name. For a cluster of \(m\) members with intraclass correlation \(\rho\), the variance of the cluster's mean is inflated by the factor

\[ \text{DE} = 1 + (m - 1)\,\rho \]

called the **design effect**: how many times more variance your estimate carries than a simple random sample of the same headcount would. Here \(m\) is the number of members per cluster and \(\rho\) is the intraclass correlation from the last step. Divide by it and you get the currency that actually matters, the **effective sample size**: \(n_{\text{eff}} = n / \text{DE}\), the number of independent observations your \(n\) correlated ones are worth. Run Meera's bill:

```r
rho <- 0.04     # intraclass correlation: 4% of spend variance sits at the city level
m   <- 1000     # loyalty members per city
n   <- 40000    # members across all 40 cities

de <- 1 + (m - 1) * rho
round(c(design_effect = de, effective_n = n / de, ceiling = 40 / rho), 2)
#> design_effect   effective_n       ceiling
#>         40.96        976.56       1000.00
```

A design effect of 41: Meera's 40,000 members carry the information of about **977 independent ones**. The tiny \(\rho\) got multiplied by a huge \(m - 1\), which is the whole trap. Feel how fast the bill grows with cluster size at \(\rho = 0.04\):

| Members per cluster \(m\) | 2 | 10 | 100 | 1,000 |
|---|---|---|---|---|
| Design effect \(1 + (m-1)\rho\) | 1.04 | 1.36 | 4.96 | 40.96 |

That third number in the output, the **ceiling**, is the cruelest part. As \(m\) grows, \(n_{\text{eff}} = Km / (1 + (m-1)\rho)\) flattens out at \(K/\rho\), where \(K\) is the number of clusters. With 40 cities and \(\rho = 0.04\), no amount of extra members can ever push Meera past 1,000 members' worth of information. Recruiting inside existing cities buys almost nothing; only new cities move the ceiling.

[KEY INSIGHT]
In a cluster experiment the real currency is the number of clusters, not the number of members. Size the test with Lesson 1's machinery, then multiply the required sample by the design effect, and if the answer says "you need more", read that as more cities, stores or schools, not more people inside them.

=== step === quiz
::eyebrow Check yourself
## Buying power back

Meera's cluster design gives an effective sample size of 977, and the Lesson 1 power math says that is not enough. Her team proposes three fixes. Which one actually helps?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Enroll 1,000 more members in each of the 40 cities, doubling the test to 80,000 members ::no Double the members and the design effect nearly doubles too: DE becomes 1 + 1999 x 0.04 = 80.96, so 80,000 / 80.96 = 988. Forty thousand extra members bought eleven effective ones, because the ceiling of K / rho = 40 / 0.04 = 1,000 was already in sight.
- Expand the program to 20 more cities of the same size, 60,000 members in total ::ok Right. The design effect stays at 40.96 (cluster size is unchanged), so effective n rises to 60,000 / 40.96, about 1,465, a 50% gain, and the ceiling lifts from 1,000 to 60 / 0.04 = 1,500. More clusters is the only lever that scales.
- The ICC is only 0.04, so ignore the clustering and analyze the 40,000 members directly ::no That does not buy power, it breaks the test. With m = 1,000 the "negligible" 0.04 inflates the variance 41-fold, and a member-level analysis that ignores it reports standard errors that are far too small. The next step measures exactly how many false winners that manufactures.

=== step === concept
::eyebrow The wrong test
## Analyze at the level you randomized

There is one more way to lose a cluster experiment, and it happens at the keyboard, not in the field: randomize cities but feed the 40,000 member rows into a plain two-sample test as if they were independent. Lesson 1's habit settles what that costs: simulate the experiment 2,000 times with **both arms identical**, an A/A test where the banner does nothing by construction, so every significant result is a false winner. Twenty cities, fifty members sampled per city, built exactly like the boxplots you saw: a city baseline (spread 8) plus member noise (spread 40).

```r
set.seed(123)
cities <- 20    # 10 cities per arm
m      <- 50    # loyalty members sampled per city
sig_b  <- 8     # between-city sd: cities differ in baseline spend
sig_w  <- 40    # within-city sd: members differ around their city's baseline

one_aa <- function() {
  city_base <- 68 + rnorm(cities, 0, sig_b)              # each city's own baseline
  spend <- rep(city_base, each = m) + rnorm(cities * m, 0, sig_w)
  arm   <- rep(c(0, 1), each = cities / 2 * m)           # first 10 cities control, last 10 treated
  member_p <- t.test(spend ~ arm)$p.value                # WRONG: treats the 1,000 members as the units
  city_avg <- tapply(spend, rep(1:cities, each = m), mean)
  city_p   <- t.test(city_avg[1:10], city_avg[11:20])$p.value   # RIGHT: the 20 cities are the units
  c(member_p, city_p)
}
ps <- replicate(2000, one_aa())   # 2,000 A/A experiments: every winner is false
```

The honest analysis is almost embarrassingly simple: collapse each city to its average, then t-test the 20 city means, 10 per arm. Score both analyses on the same 2,000 null experiments:

```r
round(c(member_level = mean(ps[1, ] < 0.05),
        city_level   = mean(ps[2, ] < 0.05)), 3)
#> member_level   city_level
#>        0.248        0.050
```

The city-level test keeps the promise: 5% false winners. The member-level test flags a do-nothing banner **one time in four**. And this is not bad luck, it is the design effect doing arithmetic in plain sight:

```r
rho <- sig_b^2 / (sig_b^2 + sig_w^2)   # the ICC these cities were built with
de  <- 1 + (m - 1) * rho               # the design effect for 50 members per city
round(c(icc = rho, design_effect = de, predicted_fp = 2 * pnorm(-1.96 / sqrt(de))), 3)
#>           icc design_effect  predicted_fp
#>         0.038         2.885         0.248
```

The member-level test believes its z-statistic is standard normal, but ignoring the clustering stretches it by \(\sqrt{\text{DE}} = \sqrt{2.885} \approx 1.7\). So when that test proudly reports z = 1.96, the honest size of the evidence is only 1.96 / 1.7 = 1.15. Drag the statistic to 1.15 and read the tail the test should have reported:

::widget null-distribution {"tails":2,"start":1.15,"label":"what a naive z of 1.96 is really worth"}

A p-value of 0.25, exactly the false-winner rate the simulation measured. Same lesson as Lesson 3's peeking, from a new direction: the test was honest, the bookkeeping was not.

[KEY INSIGHT]
Analyze at the level you randomized. If cities got the coin flips, cities are the observations: t-test the cluster means (or fit a model that carries the cluster structure, like the mixed models from the regression course). A member-level test on a cluster-randomized experiment is a false-winner factory.

=== step === concept
::eyebrow Fence in time
## When there is no fence in space

Now for the leak that clusters cannot fix. SnapDish is a food-delivery app in one large city: about 900 drivers, average delivery 31 minutes. The dispatch team built a new assignment algorithm, the **dispatcher**, that promises to shave about 3 minutes off by matching orders to drivers more cleverly.

Try Meera's medicine: cluster by what, exactly? Every order in the city draws from the **same pool of 900 drivers**. There is no city-within-the-city to fence off; the whole marketplace is one cluster. And randomizing orders 50/50 recreates Lesson 3's inventory leak in its nastiest form: the new dispatcher wins the good drivers a few seconds earlier, control orders inherit whoever is left, and the comparison credits the new algorithm with minutes it partly **stole** from the control arm. Ship it, and at full rollout there is no control arm left to steal from, so the promised lift evaporates.

The switchback fences in **time** instead. Cut the two-week test into blocks, two hours each, and flip a coin for every block: this block, the entire city runs the new dispatcher; that block, the entire city runs the old one. At any moment there is only one arm in existence, so there is nobody to steal drivers from. Interference between arms is gone by construction.

::widget process-flow {"steps":[{"title":"Cut time into blocks","sub":"the two-week test becomes 14 days of 12 two-hour blocks"},{"title":"Flip a coin per block","sub":"6 random blocks each day run the new dispatcher"},{"title":"One arm at a time","sub":"every order in a block gets the same dispatcher, so arms never share a driver"},{"title":"Compare block averages","sub":"168 block means, with the time-of-day pattern removed"}]}

This is the standard design wherever a shared resource couples all the users of a marketplace: ride-hailing prices, delivery dispatch, ad auctions, feed-ranking changes that shift a shared budget. The trade should look familiar from the cluster half: the units are now the **168 blocks**, not the hundreds of thousands of orders inside them. A block is a cluster in time, and the fewer, bigger, correlated units logic, the design effect logic, carries straight over. You pay power to buy validity.

=== step === concept
::eyebrow The analysis
## Analyze the blocks, and remove the clock

Build the whole experiment and run it. Delivery time has a strong clock: quiet at 4am, a lunch spike, the dinner rush near 39 minutes. On top of that, whole days differ (rain, a festival, a stadium match), and the new dispatcher truly saves 3 minutes. Randomizing 6 of the 12 blocks within each day keeps the two arms balanced across the clock:

```r
set.seed(7)
days  <- 14
slots <- 12          # two-hour blocks: slot 1 is midnight to 2am, slot 12 is 10pm to midnight
n     <- days * slots

# SnapDish's true time-of-day pattern in average delivery minutes
pattern <- c(24, 23, 25, 28, 31, 36, 33, 30, 32, 39, 35, 28)

blocks <- data.frame(day  = rep(1:days, each = slots),
                     slot = rep(1:slots, times = days))
# randomize WITHIN each day: 6 of its 12 blocks run the new dispatcher (arm 1)
blocks$arm <- unlist(lapply(1:days, function(d) sample(rep(c(0, 1), 6))))

day_shift   <- rnorm(days, 0, 1.5)     # whole-day shocks: rain, a festival, a stadium match
blocks$mins <- pattern[blocks$slot] - 3 * blocks$arm +   # the new dispatcher truly saves 3 minutes
               day_shift[blocks$day] + rnorm(n, 0, 2.5)

# day 1 of the coin-flip calendar: A = old dispatcher, B = new
paste(ifelse(blocks$arm[1:12] == 1, "B", "A"), collapse = " ")
#> [1] "B A A B B A B A B B A A"
```

That printed line is the design itself: a randomized schedule the whole city follows, block by block. The honest baseline analysis is exactly the cluster rule wearing a watch, compare block averages:

```r
naive <- lm(mins ~ arm, data = blocks)   # compare block averages, ignore the clock
round(cbind(estimate = coef(naive), confint(naive))["arm", ], 2)
#> estimate    2.5 %   97.5 %
#>    -3.23    -4.94    -1.51
```

Valid, and vague: minus 1.5 to minus 4.9 minutes. The culprit is the clock. Block averages swing 16 minutes across the day, and although the within-day randomization **balanced** that pattern across arms, it left the swing sitting in the noise. You met this exact situation in Lesson 2: a strong, treatment-independent predictor of the outcome that CUPED subtracted away. Here the predictor is the slot, and the same regression trick removes it:

```r
adj <- lm(mins ~ arm + factor(slot), data = blocks)   # the schedule balanced the clock, now subtract it
round(cbind(estimate = coef(adj), confint(adj))["arm", ], 2)
#> estimate    2.5 %   97.5 %
#>    -2.87    -3.82    -1.92
```

The slot terms soak up about 71% of the block-to-block variance, and the confidence interval shrinks from a width of 3.4 minutes to 1.9, the same money-for-nothing arithmetic as CUPED's \(1 - \rho^2\) identity (careful with the symbol: that \(\rho\) is Lesson 2's outcome-covariate correlation, not this lesson's intraclass correlation). Day shocks can be absorbed the same way, by adding `factor(day)`. The estimate, minus 2.9 minutes against a truth of minus 3, is now both valid **and** sharp.

[WARNING]
Switchbacks have their own trapdoor: **carryover**. At the moment the city flips from B to A, drivers are still mid-delivery on orders the OLD dispatcher assigned, so the first minutes of every block are contaminated by the previous arm. The standard fixes are a burn-in (discard each block's opening slice) or longer blocks, and both spend your scarcest resource, the number of blocks. Choosing the block length that balances carryover against block count is a real design problem; the Bojinov, Simchi-Levi and Zhao paper in the references treats it properly.

=== step === quiz
::eyebrow Check yourself
## Why not just randomize the orders?

A SnapDish analyst objects: "168 blocks is a tiny sample. Randomize every ORDER 50/50 within the same hour instead, and we get hundreds of thousands of units." Why does the switchback still win?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Treated and control orders inside the same hour would compete for the same 900 drivers, so the new dispatcher's measured gain is partly minutes taken FROM control, an overstatement that vanishes at full rollout ::ok Right. The units share one driver pool, so order-level arms interfere, exactly the leak Lesson 3 said no analysis can repair. The switchback removes the competition by construction: at any moment only one arm exists. The 168 blocks are the price of a number you can trust.
- Randomizing hundreds of thousands of orders is technically too hard for a dispatch system ::no Assignment is the easy part, a hash on the order ID does it. The problem is not implementing order-level randomization, it is what the randomized units share: 900 drivers. Shared resources make the arms interfere no matter how cleanly you split the orders.
- Switchbacks actually have MORE statistical power, because block averages are less noisy than individual orders ::no Backwards. Hundreds of thousands of orders carry far more raw power than 168 correlated blocks; that is the design-effect logic all over again. A switchback deliberately SPENDS power to buy validity, which is why the previous step worked so hard to claw precision back from the clock.

=== step === tryit
::eyebrow Your turn
## Price a cluster design

A grocery chain wants to pilot a new loyalty scheme the same way Meera fenced her referral test: whole stores get the scheme or keep the old one. There are **60 stores** with about **800 regular shoppers each** (48,000 shoppers), and historical data puts the intraclass correlation of monthly spend at **0.05**. Before the pilot is approved, price the design: fill in the two blanks of the design-effect formula.

```r
# 60 stores, about 800 shoppers each, ICC of monthly spend = 0.05
de <- 1 + (____ - 1) * ____
round(c(design_effect = de, effective_n = 48000 / de, ceiling = 60 / 0.05), 2)
```
::check {"regex":"1\\s*\\+\\s*\\(\\s*800\\s*-\\s*1\\s*\\)\\s*\\*\\s*0?\\.05","gate":true,"difficulty":"intermediate","ok":"DE = 40.95: the 48,000 shoppers are worth about 1,172 independent ones, and no amount of extra shoppers can push that past the ceiling of 60 / 0.05 = 1,200. If the power math wants more, the chain needs more stores, not more shoppers.","no":"m is the number of shoppers per cluster (800, not 60 and not 48,000) and rho is the ICC (0.05). The design effect is 1 + (m - 1) * rho."}
::solution
```r
de <- 1 + (800 - 1) * 0.05
round(c(design_effect = de, effective_n = 48000 / de, ceiling = 60 / 0.05), 2)
#> design_effect   effective_n       ceiling
#>         40.95       1172.16       1200.00
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Kohavi, Tang and Xu (2020), Trustworthy Online Controlled Experiments](https://experimentguide.com/) - the industry playbook; its interference chapter covers when user-level randomization fails and what the big platforms run instead.
- [Bojinov, Simchi-Levi and Zhao (2023), Design and Analysis of Switchback Experiments](https://arxiv.org/abs/2009.00148) - the rigorous treatment of switchbacks: carryover, optimal block length, and honest inference.
- [DoorDash Engineering, Switchback Tests and Randomized Experimentation Under Network Effects](https://careersatdoordash.com/blog/switchback-tests-and-randomized-experimentation-under-network-effects-at-doordash/) - the practitioner story of exactly SnapDish's problem, from the marketplace that popularized the design.
- [Ugander, Karrer, Backstrom and Kleinberg (2013), Graph Cluster Randomization](https://arxiv.org/abs/1305.6979) - clustering a social network itself when the interference graph is friendships rather than geography.
- [J-PAL, Power calculations for cluster-randomized designs](https://www.povertyactionlab.org/resource/power-calculations) - a practical field guide to the ICC and design effect, from the community that runs cluster experiments at the largest scale.

=== step === complete
## Lesson 4 complete

Both of Lesson 3's unfixable leaks now have designs. Meera's referral coupons stay inside the fence because whole cities share an arm, and the price appeared on one line of R: a design effect of 41 turned 40,000 members into 977 effective ones, with a hard ceiling of K / rho that only more cities can lift. SnapDish's drivers stopped being stolen because the switchback runs one arm at a time, and the clock that made block averages vague came back out with the same regression move CUPED taught you: minus 2.9 minutes, tight, against a truth of minus 3. One rule carried the whole lesson: analyze at the level you randomized, because that is where the independent information lives.

Every design in this course so far splits traffic once and holds until the planned verdict. Lesson 5 asks the impatient question: if one arm is clearly winning halfway through, why keep sending half your users to the loser? That is the explore-exploit dilemma, and its price has a name, regret. Next: Multi-Armed Bandits, Explore vs Exploit.
