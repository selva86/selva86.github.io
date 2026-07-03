---
title: "Experimentation Lesson 6: Thompson Sampling and Bayesian Bandits"
catalog_blurb: "Let each variant earn traffic in proportion to the chance it is best."
description: "Build Thompson sampling from scratch: a Beta belief per arm, traffic allocated by the probability each arm is best, and regret that bends flat in base R."
keywords: "Thompson sampling, Bayesian bandits, Beta posterior, probability matching, multi-armed bandit in R, cumulative regret, adaptive traffic allocation, epsilon-greedy vs Thompson sampling, explore exploit"
post_type: "LESSON"
curriculum_id: "6.170.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "6"
course_total: "7"
course_landing: "R-Experimentation-Course.html"
course_next: "Contextual-Bandits-and-Off-Policy-Evaluation.html"
course_prev: "Multi-Armed-Bandits-Explore-vs-Exploit.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## Thompson Sampling and Bayesian Bandits

Lesson 5 convicted epsilon-greedy on two counts. Its exploration is blind: a random email is as likely to go to hopeless subject line A as to the genuinely open B-versus-C question. And it never stops: one send in ten stays random forever, a straight-line tax long after the answer is settled.

Both flaws share a root. Epsilon-greedy summarizes each subject line with a single number, its observed open rate, and a single number cannot say how sure it is. This lesson gives Meera, 60 sends into her 40,000-email Diwali campaign, the fix: keep a whole curve of belief per line and let the curves run the campaign. The rule that falls out is almost embarrassingly simple, one random draw per line per send, yet it allocates traffic exactly in proportion to the probability each line is currently best, explores only where real uncertainty remains, and its regret provably bends toward the Lai-Robbins floor that epsilon-greedy misses. It is called **Thompson sampling**, it predates the computer, and it is the engine inside most modern experimentation platforms.

By the end of this lesson you will be able to:

- Turn each line's tally into a Beta belief curve and update it after every send
- Compute the probability each line is truly best by simulating from those curves
- Implement Thompson sampling in a dozen lines of base R and read its allocation
- Explain why its exploration fades on its own and its regret curve bends where epsilon-greedy's climbs
- Say what it does not fix: biased tallies, delayed rewards, and drifting rates

**Prerequisites:** [Multi-Armed Bandits, Explore vs Exploit](Multi-Armed-Bandits-Explore-vs-Exploit.html), this lesson picks up its campaign mid-send: arms, rewards, cumulative regret and epsilon-greedy are assumed. The Beta-posterior machinery comes from the Bayesian course ([The Bayesian Update](The-Bayesian-Update.html), [Conjugacy and Choosing Priors](Conjugacy-and-Choosing-Priors.html)); a working refresher is built in, so a comfortable memory of it is enough.

::widget bandit-explore {}

=== step === concept
::eyebrow The belief
## A curve of belief per subject line

Rejoin Meera exactly where the Lesson 5 dilemma table left her: 60 of the 40,000 Diwali emails sent, and a scoreboard. Line A, "The Diwali sale is on", opened 4 of 15. Line B, "40 percent off ends Friday", opened 11 of 20. Line C, "Your size is going fast", opened 12 of 25.

Epsilon-greedy reduces each row to one number: 0.27, 0.55, 0.48. The Bayesian course taught a richer bookkeeping: treat line \(k\)'s true open rate \(p_k\) as an unknown and keep a whole probability distribution over what it might be. Start every line at Beta(1, 1), the flat prior that calls every rate from 0 to 1 equally plausible, and let conjugacy absorb each result as it arrives. After \(s_k\) opens in \(n_k\) sends, the belief about line \(k\) is

\[ p_k \mid \text{data} \;\sim\; \text{Beta}(s_k + 1,\; n_k - s_k + 1) \]

Every symbol in words: \(s_k\) is line \(k\)'s opens so far and \(n_k\) its sends, so the first shape parameter counts opens plus the prior's one, and the second counts ignores (sends minus opens) plus one. The curve's center of mass sits at \((s_k + 1)/(n_k + 2)\), essentially the observed rate, and its width is the honesty that a lone number throws away: fewer sends, wider curve.

```r
rates <- c(A = 0.30, B = 0.50, C = 0.55)   # the truth: hidden from Meera, known to our simulator
opens <- c(A = 4, B = 11, C = 12)          # the 60-send scoreboard from Lesson 5
sends <- c(A = 15, B = 20, C = 25)

shape1 <- opens + 1                # opens, plus one from the flat prior
shape2 <- sends - opens + 1        # ignores, plus one
round(shape1 / (shape1 + shape2), 2)       # each curve's center of mass
#>    A    B    C
#> 0.29 0.55 0.48
```

The centers barely differ from the raw rates. The curves are where the new information lives, so draw all three:

```r
curve(dbeta(x, shape1["C"], shape2["C"]), from = 0, to = 1, n = 400, lwd = 2.5,
      col = "#1b7f5c", xlab = "plausible true open rate", ylab = "plausibility (density)",
      main = "What Meera believes after 60 sends")
curve(dbeta(x, shape1["B"], shape2["B"]), col = "#c25e00", lwd = 2.5, add = TRUE)
curve(dbeta(x, shape1["A"], shape2["A"]), col = "#5b6ee1", lwd = 2.5, add = TRUE)
legend("topright", legend = c("A: 4 opens of 15", "B: 11 opens of 20", "C: 12 opens of 25"),
       col = c("#5b6ee1", "#c25e00", "#1b7f5c"), lwd = 2.5, bty = "n")
```

Read the picture. A's curve sits low and away from the others: 15 sends were enough to make "A is secretly best" a fringe possibility. B's curve peaks to the right of C's, that is the 0.55 versus 0.48 scoreboard talking, but both curves are wide and overlap heavily, so "C is really the best line" remains entirely plausible. The scoreboard said B leads; the curves say the B-versus-C question is still open.

[KEY INSIGHT]
A tally is a number; a belief is a curve. The curve carries the one thing the number drops, how much evidence backs it, and that is exactly the quantity intelligent exploration needs.

=== step === concept
::eyebrow The real question
## The probability a line is best

Lesson 5's dilemma table asked: who gets email 61? A scoreboard of single numbers can only answer "B leads". The curves let Meera pose the question the campaign actually turns on: **what is the probability each line is truly best?**

That probability has no tidy formula, but the curves make it computable by brute force, the same simulate-a-world habit as the Lesson 1 power runs. Imagine 10,000 parallel worlds, each one a full set of true open rates consistent with the evidence so far: in every world, draw one plausible rate for each line from its belief curve, then record which line tops that world.

```r
set.seed(42)
worlds <- cbind(A = rbeta(10000, shape1["A"], shape2["A"]),
                B = rbeta(10000, shape1["B"], shape2["B"]),
                C = rbeta(10000, shape1["C"], shape2["C"]))
best <- colnames(worlds)[max.col(worlds)]   # max.col: which column wins each row
round(table(best) / 10000, 2)
#> best
#>    A    B    C
#> 0.03 0.66 0.32
```

Given everything 60 sends can say, B is the best line in 66% of the plausible worlds, C in 32%, A in 3%. Now the allocation principle almost writes itself. Exploiting sends everything to B and starves the one-in-three chance that C is the real winner. Epsilon-greedy sprays a fixed 10% at random, wasting a third of that spray on A's 3% long shot. The natural middle is **probability matching**: give each line traffic in proportion to the probability it is best, roughly 66% to B, 32% to C, a token 3% to A. Exploration lands exactly where the open question lives, and because the curves update after every send, the proportions retarget themselves as evidence arrives.

[KEY INSIGHT]
The probability of being best is a self-adjusting exploration budget. A line earns sends only while its curve still overlaps the leader's, and the overlap is recomputed from the evidence after every single send.

=== step === quiz
::eyebrow Check yourself
## Where does the 32 percent come from?

B's observed rate (0.55) beats C's (0.48) on the 60-send scoreboard, yet the simulation just gave C a 32 percent chance of being the truly best line. Where does that 32 percent come from?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Simulation noise: with far more than 10,000 imagined worlds it would shrink toward zero ::no More worlds would only pin the number more precisely, and it would settle near 0.32, not zero. The uncertainty lives in the belief curves themselves, not in the simulation that reads them.
- The two belief curves are wide and overlap: in about a third of the worlds consistent with the tallies, the true rate behind 12-of-25 tops the one behind 11-of-20 ::ok Right. On 20 and 25 sends each curve still spans a wide range of plausible rates, and across the joint possibilities C comes out on top 32 percent of the time. Only more sends to BOTH lines can shrink that overlap.
- C received more sends than B, so its evidence counts for more ::no Extra sends NARROW a curve, they do not favor it: C's 25 sends make its curve slightly tighter than B's. The 32 percent comes from how much the two wide curves still overlap.

=== step === concept
::eyebrow The algorithm
## One imagined world per send

Probability matching sounds expensive. Recompute a 10,000-world simulation after every one of 40,000 sends? Thompson's 1933 insight makes it free. To allocate ONE send in proportion to the win probabilities, you do not need the whole table, you need one world: draw a single plausible rate for each line from its current curve, and send with whichever line wins that one imagined world.

\[ \tilde{p}_k \sim \text{Beta}(s_k + 1,\; n_k - s_k + 1) \;\;\text{for each line } k, \qquad a_t = \arg\max_k \; \tilde{p}_k \]

Symbols in words: \(\tilde{p}_k\) (p-tilde) is the open rate imagined for line \(k\) this round, drawn fresh from its Beta curve, and \(a_t\), the line that gets send \(t\), is the one whose imagined rate is highest (\(\arg\max_k\) means "the \(k\) with the biggest draw"). Because line \(k\) wins the draw exactly as often as its curve produces the top value, the chance it receives this send IS the current probability it is best. Probability matching, at the cost of one `rbeta()` call.

::widget process-flow {"steps":[{"title":"Imagine one world","sub":"draw one plausible open rate per line from its Beta curve"},{"title":"Send to the imagined winner","sub":"the line with the highest draw gets this email"},{"title":"Observe the reward","sub":"an open scores 1, silence scores 0"},{"title":"Update the chosen line","sub":"its Beta curve gains an open or an ignore, and the next round begins"}]}

The whole algorithm is the Lesson 5 loop with the pick rule swapped: no epsilon, no coin flip, no special case for untried lines (their curves are just maximally wide, so they win imagined worlds often enough to get tried). Run the first 400 sends of a fresh campaign:

```r
set.seed(42)
n_rounds <- 400
opens <- c(A = 0, B = 0, C = 0)   # a fresh campaign: no evidence yet
sends <- c(A = 0, B = 0, C = 0)
picks <- integer(n_rounds)

for (t in 1:n_rounds) {
  draw <- rbeta(3, opens + 1, sends - opens + 1)  # one imagined rate per line
  pick <- which.max(draw)                          # this round's imagined winner
  opens[pick] <- opens[pick] + rbinom(1, 1, rates[pick])
  sends[pick] <- sends[pick] + 1
  picks[t] <- pick
}
rbind(sends, est_rate = round(opens / sends, 2))
#>              A     B      C
#> sends    15.00 75.00 310.00
#> est_rate  0.27  0.48   0.56
```

Compare this allocation with epsilon-greedy's from Lesson 5, which gave A 50 sends and B only 31. Thompson sampling read the situation the way you would: A got 15 sends, enough to dismiss it, while B got 75, because B-versus-C was the question actually worth paying to answer. The bill reflects it:

```r
gaps <- max(rates) - rates      # opens forgone per send, per line (Lesson 5)
sum(sends * gaps)               # the realized regret of these 400 sends
#> [1] 7.5
```

Epsilon-greedy paid 14.05 opens of regret on its own 400-send run in Lesson 5. Thompson sampling paid about half, and it did so by exploring more where it mattered and less where it did not.

=== step === widget
::eyebrow Feel it
## Exploration that fades on its own

Epsilon-greedy needed a schedule nobody knew how to set: explore at 10% forever, or shrink epsilon by hand and hope the shrinking is timed right. Thompson sampling has no exploration parameter at all, yet watch what happens to its exploring over the campaign you just ran:

```r
count_picks <- function(w) table(factor(picks[w], levels = 1:3, labels = c("A", "B", "C")))
rbind(first_100 = count_picks(1:100), last_100 = count_picks(301:400))
#>           A  B  C
#> first_100 6 45 49
#> last_100  1 14 85
```

In the first hundred sends the curves were wide, imagined worlds went every which way, and B and C split the traffic almost evenly: that IS exploration, nobody scheduled it. By the last hundred, C's curve had pulled clear, so C won 85 imagined worlds while B, the only remaining doubt, kept a 14-send trickle and A was down to a stray single send. The fade is automatic, because every open and every ignore narrows a curve, and narrower curves produce fewer surprise winners. When a line can barely win an imagined world, it barely gets traffic: exploration priced by remaining uncertainty, send by send.

Toggle the two strategies below and read the regret curves side by side. Epsilon-greedy's stays on its fixed slope, the linear tax from Lesson 5. Thompson sampling's bends toward flat, the logarithmic shape the Lai-Robbins bound said was the best achievable.

::widget bandit-explore {}

[KEY INSIGHT]
Epsilon-greedy explores on a timer; Thompson sampling explores on evidence. The posterior width is the exploration rate, and it shrinks precisely as fast as the data justify.

=== step === tryit
::eyebrow Your turn
## Make the pick for email 61

Answer Lesson 5's cliffhanger properly. The scoreboard stands at A: 4 of 15, B: 11 of 20, C: 12 of 25, and email 61 is ready to go. Fill in the two shape parameters so each line's imagined rate comes from its Beta belief curve.

```r
opens <- c(A = 4, B = 11, C = 12)
sends <- c(A = 15, B = 20, C = 25)

set.seed(99)
draw <- rbeta(3, ____, ____)   # one imagined open rate per line
names(draw) <- names(opens)
round(draw, 3)
which.max(draw)                # this line gets email 61
```
::check {"regex":"rbeta\\(\\s*3\\s*,\\s*opens\\s*\\+\\s*1\\s*,\\s*sends\\s*-\\s*opens\\s*\\+\\s*1\\s*\\)","gate":true,"difficulty":"intermediate","ok":"B imagined 0.487 and C imagined 0.491, a photo finish, and C takes email 61. Re-run without the seed and B might win the next world instead: that round-to-round wobble between genuine contenders IS the exploration.","no":"The first shape is opens + 1 (each line gains its opens, plus one from the flat prior); the second is sends - opens + 1 (its ignores, plus one). Both arguments are vectors, so one rbeta call draws all three lines at once."}
::solution
```r
opens <- c(A = 4, B = 11, C = 12)
sends <- c(A = 15, B = 20, C = 25)

set.seed(99)
draw <- rbeta(3, opens + 1, sends - opens + 1)
names(draw) <- names(opens)
round(draw, 3)
#>     A     B     C
#> 0.322 0.487 0.491
which.max(draw)
#> C
#> 3
```

=== step === concept
::eyebrow The long game
## What Thompson wins, and what it does not

One lucky run is not evidence, and 400 sends is a short campaign. Average each strategy over 50 simulated campaigns, at the 400-send horizon and again at 2,000 sends, and the two regret shapes from the widget become numbers:

```r
set.seed(7)
run_campaign <- function(strategy, n_rounds) {
  o <- c(0, 0, 0); s <- c(0, 0, 0)
  for (t in 1:n_rounds) {
    pick <- if (strategy == "egreedy") {
      if (runif(1) < 0.10) sample(3, 1) else which.max(ifelse(s > 0, o / s, 1))
    } else {
      which.max(rbeta(3, o + 1, s - o + 1))
    }
    o[pick] <- o[pick] + rbinom(1, 1, rates[pick])
    s[pick] <- s[pick] + 1
  }
  sum(s * gaps)
}
avg_regret <- function(strategy, n_rounds) mean(replicate(50, run_campaign(strategy, n_rounds)))

round(rbind(
  egreedy  = c(rounds_400 = avg_regret("egreedy", 400),  rounds_2000 = avg_regret("egreedy", 2000)),
  thompson = c(rounds_400 = avg_regret("thompson", 400), rounds_2000 = avg_regret("thompson", 2000))), 1)
#>          rounds_400 rounds_2000
#> egreedy        13.0        39.2
#> thompson       11.9        24.1
```

At 400 sends the strategies look close: both are still paying for their early learning, and honest averages say so. The horizon separates them. Five times the sends and epsilon-greedy triples its bill, the fixed tax compounding in a straight line, while Thompson sampling's grows by half as much and keeps bending flatter: most of its late-campaign regret rate is simply gone. Agrawal and Goyal proved in 2012 that this bending is a guarantee, Thompson sampling's cumulative regret grows only logarithmically in \(T\), meeting the Lai-Robbins floor from Lesson 5. Across Meera's full 40,000-member list, the gap widens into hundreds of opens.

What the elegance does not buy, you already know from Lesson 5, because every caveat there survives:

[WARNING]
Thompson sampling fixes how to explore, not what you can read off the wreckage afterward. Its final tallies are still bent by adaptive sampling: line A's estimate above froze at 0.27 on 15 sends against a truth of 0.30, and it will barely move for the rest of the campaign, exactly like line B's stuck 0.39 under epsilon-greedy. A publishable lift still needs a fixed split. Delayed rewards still poison the loop, a posterior can only update on the feedback that has arrived, so a slow reward starves it into optimizing whatever fast proxy it can see. And drifting rates still mix time into the comparison, because each line's sends concentrate in different stretches of the campaign.

Two practical notes from production. Real platforms do not update after every send; they re-draw in batches, hourly or daily, and Thompson sampling tolerates that gracefully, the draws simply work from slightly stale curves (Google's experiment platform ran exactly this way). And the flat Beta(1, 1) start is a choice: last Diwali's campaigns could seed each line with an informative prior, starting the curves narrower and saving early regret, at the usual Bayesian price that a wrong prior must first be unlearned.

[KEY INSIGHT]
Reach for Thompson sampling whenever Lesson 5 said "bandit": perishable decision, fast reward, payoff-during-the-campaign. It is the better bandit, not a different tool. Everything that said "fixed split" still says fixed split.

=== step === quiz
::eyebrow Check yourself
## Reading the tallies after the campaign

The Diwali campaign ends and the bandit delivered: thousands of extra opens against a fixed split. Marketing now wants to publish the final scoreboard in the planning deck, line C 0.56, line B 0.48, line A 0.27, as the official open rates for next year. What do you tell them?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The numbers are safe to publish: the draws were random, so the tallies are unbiased ::no The draws are random but deliberately non-uniform: the algorithm starves lines that look bad, which is precisely what bends its regret curve. A starved tally freezes wherever luck left it, so the randomness does not buy unbiasedness.
- Publish C's rate with a caution, never the comparison: the winner rode most of the traffic so its tally is nearly a fixed-split estimate, but A and B were starved and frozen where luck left them, so the gaps between lines are distorted; a publishable lift needs a fixed split or an explicit correction ::ok Right. A's 0.27 rests on a handful of sends and B stopped accumulating evidence once C pulled clear, so the published gaps would inherit their unlucky freezes. Earning and estimating are different jobs, and the bandit was hired to earn.
- Add more simulated worlds to the probability-of-best computation to debias the tallies before publishing ::no More imagined worlds sharpen the read of the curves you have, but they add no real evidence to a starved line's tally. Only real sends can, and the algorithm learned mid-campaign not to buy them.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Thompson (1933), On the Likelihood That One Unknown Probability Exceeds Another in View of the Evidence of Two Samples](https://doi.org/10.1093/biomet/25.3-4.285) - the original Biometrika paper: the whole idea, published decades before the computers that made it practical.
- [Russo, Van Roy, Kazerouni, Osband and Wen (2018), A Tutorial on Thompson Sampling](https://arxiv.org/abs/1707.02038) - the modern tutorial: extensions beyond Beta-Binomial, approximations at scale, and when the method underperforms, free on arXiv.
- [Chapelle and Li (2011), An Empirical Evaluation of Thompson Sampling](https://proceedings.neurips.cc/paper/2011/hash/e53a0a2978c28872a4505bdb51db06dc-Abstract.html) - the study that revived the method: the simple 1933 rule matching or beating the sophisticated alternatives on display ads and news recommendation.
- [Agrawal and Goyal (2012), Analysis of Thompson Sampling for the Multi-armed Bandit Problem](https://arxiv.org/abs/1111.1797) - the proof behind this lesson's claim: Thompson sampling's regret grows logarithmically, meeting the Lai-Robbins floor.
- [Scott (2015), Multi-armed bandit experiments in the online service economy](https://research.google/pubs/multi-armed-bandit-experiments-in-the-online-service-economy/) - Thompson sampling in production at Google: batched updates, delayed feedback, and the operational caveats at scale.

=== step === complete
## Lesson 6 complete

Email 61 finally has its answer, and a principled one. You replaced each line's lone tally with a Beta belief curve, asked the curves the question that matters, the probability each line is best (66% B, 32% C, 3% A after 60 sends), and met the 1933 trick that makes probability matching free: draw one imagined world per send and back its winner. Your dozen lines of base R paid 7.5 opens of regret where Lesson 5's epsilon-greedy paid 14, explored B-versus-C hard while dismissing A, and faded its own exploration from a 49/45 split to an 85/14 trickle with no epsilon to tune. The two-horizon table showed the shapes diverging, 39.2 versus 24.1 by 2,000 sends, and the caveats that survive the upgrade: frozen tallies, delayed rewards, drift.

One assumption still stands, quietly: that a single line is best for everyone. But "Your size is going fast" may win with longtime loyalty members while "40 percent off ends Friday" wins with bargain hunters, and a bandit that could see who it is emailing would beat any one-size-fits-all winner. Adding features to the arms makes it a contextual bandit, and it raises the question every logged campaign begs: can you score a new allocation policy from data an old policy collected, without deploying it? Inverse-propensity scoring and the doubly-robust estimator close the course. Next: Contextual Bandits and Off-Policy Evaluation.
