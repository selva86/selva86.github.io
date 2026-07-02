---
title: "Experimentation Lesson 7: Contextual Bandits and Off-Policy Evaluation"
catalog_blurb: "Let the best variant depend on the reader, and score new rules from logs."
description: "Upgrade Thompson sampling to a contextual bandit in base R, then score a new policy from logged data with inverse-propensity and doubly robust scoring."
keywords: "contextual bandit in R, off-policy evaluation, inverse propensity scoring, doubly robust estimator, policy value, logged bandit feedback, counterfactual evaluation, propensity score, base R bandit"
post_type: "LESSON"
curriculum_id: "6.170.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "7"
course_total: "7"
course_landing: "R-Experimentation-Course.html"
course_next: ""
course_prev: "Thompson-Sampling-and-Bayesian-Bandits.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## Contextual Bandits and Off-Policy Evaluation

Lesson 6 ended the Diwali campaign on a high: Thompson sampling routed Meera's 40,000 emails at half the regret of epsilon-greedy, and faded its own exploration with no knob to tune. But one assumption survived all six lessons unexamined: that a single subject line is best for **everyone**. Meera's list says otherwise. "Your size is going fast" lands with longtime loyalty members; "40 percent off ends Friday" lands with bargain hunters. A bandit that could see who it is emailing would beat any one-size-fits-all winner.

This finale does two jobs. First it teaches the bandit to see: a **contextual bandit** lets the best line depend on the reader, and the upgrade costs a dozen lines of base R. Then it answers the question every finished campaign begs: Meera now has a smarter policy for next year, so can she score it on this year's log, **without sending a single new email**? That is off-policy evaluation, and its two workhorses, inverse-propensity scoring and the doubly robust estimator, close the course.

By the end of this lesson you will be able to:

- Explain what a context is, and what a context-blind bandit pays, forever, for not seeing it
- Upgrade Thompson sampling to a per-segment contextual bandit in base R and read its allocation
- Read a bandit log, say what a propensity is, and show why the log's naive averages mislead
- Score a brand-new policy from logged data alone with inverse-propensity scoring
- Strengthen that score with the doubly robust estimator, and say when no estimator can help

**Prerequisites:** [Thompson Sampling and Bayesian Bandits](Thompson-Sampling-and-Bayesian-Bandits.html), this lesson starts the morning after that campaign ends: Beta belief curves, probability-of-best, and regret are assumed, as is the campaign itself from [Multi-Armed Bandits, Explore vs Exploit](Multi-Armed-Bandits-Explore-vs-Exploit.html). All code is base R.

::widget bandit-explore {}

=== step === concept
::eyebrow The discovery
## The best line depends on who is reading

Two days after the campaign closes, Meera's analyst slices the final tallies by a column the bandit never looked at: the membership segment. 24,000 of the 40,000 subscribers are **bargain hunters**, signed up through discount partners, and 16,000 are **loyalty members**, two or more years of full-price orders. Split that way, the scoreboard stops telling one story and starts telling two: line B ("40 percent off ends Friday") clearly led among bargain hunters, while line C ("Your size is going fast") clearly led among loyalty members.

As always in this course, the simulator knows the truth that Meera can only estimate. Here it is, one open rate per segment and line, and the blend checks out against the campaign-wide rates the whole course has used:

```r
share  <- c(bargain = 0.60, loyalty = 0.40)   # Meera's list mix
p_true <- rbind(bargain = c(A = 0.30, B = 0.58, C = 0.49),
                loyalty = c(A = 0.30, B = 0.38, C = 0.64))
colSums(share * p_true)   # blended rates: exactly the truths of Lessons 5 and 6
#>    A    B    C
#> 0.30 0.50 0.55
```

C's famous 0.55 was never one number. It was a 0.49 among bargain hunters and a 0.64 among loyalty members, averaged by the list mix. Draw the two segments side by side and the flip is impossible to miss:

```r
barplot(t(p_true), beside = TRUE, col = c("#5b6ee1", "#c25e00", "#1b7f5c"),
        ylim = c(0, 0.7), legend.text = c("A", "B", "C"),
        args.legend = list(x = "topleft", bty = "n"),
        ylab = "true open rate", main = "The best line flips with the segment")
```

The segment is a **context**: a fact Meera knows about each recipient before choosing which line to send. A rule that looks at the context and names a line, "B to bargain hunters, C to loyalty members", is called a **policy**. A policy \(\pi\) (the Greek letter pi, the usual symbol for a policy) has a value: the campaign-wide open rate it would earn,

\[ V(\pi) \;=\; \sum_{x} \Pr(x)\; p_{x,\,\pi(x)} \]

where \(x\) runs over the segments, \(\Pr(x)\) is the share of the list in segment \(x\) (0.60 and 0.40 here), \(\pi(x)\) is the line the policy picks for that segment, and \(p_{x,a}\) is the true open rate of line \(a\) in segment \(x\). Compare the best any single line can do with the best per-segment rule:

```r
v_one <- max(colSums(share * p_true))        # C for everyone: the best single line
v_ctx <- sum(share * apply(p_true, 1, max))  # the best line for each segment
round(c(C_for_everyone = v_one, best_line_per_segment = v_ctx,
        extra_opens_per_40k = 40000 * (v_ctx - v_one)), 3)
#>        C_for_everyone best_line_per_segment   extra_opens_per_40k
#>                 0.550                 0.604              2160.000
```

[KEY INSIGHT]
The one-size-fits-all winner is a weighted average of segment truths, and an average leaves money on the table whenever the segments disagree. On this list, seeing the context is worth 0.054 opens per send: 2,160 opens every campaign, before any cleverness about exploration.

=== step === concept
::eyebrow The upgrade
## A bandit that sees context

A **contextual bandit** is Lesson 6's machine with one new reflex: look at the context first, then run the usual draw among the belief curves *for that context*. With two segments and three lines, Meera keeps six Beta curves instead of three, a 2 by 3 grid of cells, and each send touches only its own segment's row:

::widget process-flow {"steps":[{"title":"See the context","sub":"the segment arrives with each send: bargain hunter or loyalty member"},{"title":"Draw within the segment","sub":"one imagined rate per line, from the Beta curves kept for that segment"},{"title":"Send to the imagined winner","sub":"the line with the highest draw gets this email"},{"title":"Update that segment only","sub":"the chosen cell gains an open or an ignore; the other segment is untouched"}]}

It is literally two small bandits running side by side, one per segment. Regret changes meaning accordingly: each send is now judged against the best line **for that recipient's segment**, \( \text{regret}_t = \max_a p_{x_t,a} - p_{x_t,a_t} \), where \(x_t\) is the segment of send \(t\) and \(a_t\) the line it received. Put the blind and the sighted bandit on identical traffic:

```r
set.seed(42)
n_rounds <- 4000
run_bandit <- function(contextual) {
  opens <- matrix(0, 2, 3, dimnames = dimnames(p_true))  # one cell per segment x line
  sends <- matrix(0, 2, 3, dimnames = dimnames(p_true))
  regret <- 0
  for (t in 1:n_rounds) {
    seg <- if (runif(1) < share["bargain"]) "bargain" else "loyalty"
    if (contextual) {   # draw from THIS segment's six-curve row
      draw <- rbeta(3, opens[seg, ] + 1, sends[seg, ] - opens[seg, ] + 1)
    } else {            # blind: pool both segments into one curve per line
      o <- colSums(opens); s <- colSums(sends)
      draw <- rbeta(3, o + 1, s - o + 1)
    }
    pick <- which.max(draw)
    opens[seg, pick] <- opens[seg, pick] + rbinom(1, 1, p_true[seg, pick])
    sends[seg, pick] <- sends[seg, pick] + 1
    regret <- regret + max(p_true[seg, ]) - p_true[seg, pick]
  }
  list(sends = sends, regret = regret)
}
```

```r
blind <- run_bandit(contextual = FALSE)
aware <- run_bandit(contextual = TRUE)
blind$sends
#>          A   B    C
#> bargain 28 291 2135
#> loyalty 13 199 1334
aware$sends
#>          A    B    C
#> bargain 18 2089  302
#> loyalty 34   16 1541
round(c(blind_regret = blind$regret, contextual_regret = aware$regret), 1)
#>      blind_regret contextual_regret
#>             256.2              47.9
```

Read the two tables like a manager. The blind bandit did exactly what Lesson 6 trained it to do: it found the best single line and sent C to everyone, 2,135 sends to bargain hunters for whom C is the wrong answer. The contextual bandit routed 2,089 bargain sends to B and 1,541 loyalty sends to C: it learned both segment winners. The bill is five times smaller, 48 opens against 256, and the gap only grows, because the blind bandit's mistake is structural. Even after it converges perfectly, it keeps paying 0.09 opens on every bargain send, which spread over the whole list (bargain hunters are 60% of it) is exactly the 0.054-per-send tax from the last step, in a straight line forever. Its Lesson 6 guarantee is intact, it just guarantees the wrong target: the best single line, not the best rule.

[NOTE]
Two segments cost six curves. Add device (3 kinds) and time of day (4 slots) and the grid is 72 cells, each learning from scratch. Real systems at that scale replace the per-cell tally with a model that predicts reward from the context features, so evidence is shared across similar contexts; LinUCB, from the paper in the references, is the classic example. The explore-exploit logic you already own sits unchanged on top.

=== step === quiz
::eyebrow Check yourself
## The blind bandit runs forever

Suppose Meera never learns about the segments and her Lesson 6 context-blind Thompson bandit runs on this list indefinitely. Bargain hunters are 60% of traffic, and for them line B (0.58) truly beats line C (0.49). What does the blind bandit eventually do about that?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Given enough sends it will notice bargain hunters behave differently and start routing them to B ::no It never observes the segment, so it cannot condition on it. Its three pooled curves see only the blended rates, B 0.50 against C 0.55, and more evidence only hardens the verdict for C.
- It settles on C for everyone and pays about 0.09 opens of regret on every bargain-hunter send, forever ::ok Right. Blindness converts a learnable difference into a permanent tax: about 0.054 opens per send across the list, 2,160 opens per 40,000, and no amount of additional data removes it, because the information needed is not in what the bandit can see.
- Its regret still bends flat eventually, because Thompson sampling always reaches the Lai-Robbins floor ::no The Lesson 6 guarantee is against the best SINGLE line, and the blind bandit does find that. Measured against what is actually achievable on this list, the best line per segment, its regret grows in a straight line.

=== step === concept
::eyebrow The asset
## The log, and the number almost everyone forgets to keep

The campaign is over, and the bandit left something behind that is worth more than its opens: the **log**. For every one of the 40,000 sends, the platform wrote down four things: the context it saw, the line it sent, whether the email was opened, and one number that looks like bookkeeping but is the key to everything that follows: the **propensity**, the probability the policy had of sending that particular line at that moment.

Where does that probability come from? Lesson 6 mentioned that production platforms do not re-draw after every send; they run in frozen batches. In the campaign's final and largest batch, 10,000 sends, the platform had long since converged and froze the allocation at A 5%, B 15%, C 80%, the same for every recipient, because a blind policy cannot vary by segment. Those three numbers are the propensities. Rebuild that batch's log in full, truth hidden from Meera as always:

```r
set.seed(7)
n     <- 10000
alloc <- c(A = 0.05, B = 0.15, C = 0.80)   # the frozen final-batch allocation
seg   <- sample(rownames(p_true), n, replace = TRUE, prob = share)
line  <- sample(names(alloc),     n, replace = TRUE, prob = alloc)
open  <- rbinom(n, 1, p_true[cbind(seg, line)])
prop  <- unname(alloc[line])               # the send-time probability of the line sent
log_df <- data.frame(seg, line, prop, open)
head(log_df, 5)
#>       seg line prop open
#> 1 loyalty    C  0.8    1
#> 2 bargain    C  0.8    0
#> 3 bargain    C  0.8    0
#> 4 bargain    C  0.8    1
#> 5 bargain    C  0.8    0
```

Four Cs in the first five rows: that is the 80% talking. This shape, one row per decision holding (context, action, propensity, reward), is called **logged bandit feedback**, and it is the raw material of this lesson's remaining question: Meera drafts next year's policy, "B to bargain hunters, C to loyalty members", and wants its value **before deploying it**. Scoring one policy using data collected by a different policy is called **off-policy evaluation**.

[TIP]
Log the propensity at decision time, when it is one free extra column, not after the fact, when it may be unrecoverable. Any randomized policy has one: a Thompson batch's allocation shares, epsilon-greedy's mostly-leader mix, even a plain A/B split's fixed 50/50.

[WARNING]
If the old policy was deterministic, always C, full stop, then every propensity is 0 or 1 and the log contains no information at all about lines it never sent. Randomness in the logger is not messiness; it is the raw material off-policy evaluation spends.

=== step === concept
::eyebrow The trap
## The obvious score, and why it lies

Meera's first instinct is everyone's first instinct. Her proposed policy names a line for each segment, so: keep the log rows where the old campaign *happened to send* what the new policy *would have sent*, and average their opens. Those matched rows are real sends with real rewards, what could be wrong with averaging them?

```r
pi_new <- c(bargain = "B", loyalty = "C")       # next year's proposal
match  <- log_df$line == pi_new[log_df$seg]     # rows where old send == new choice
c(matched_rows = sum(match))
#> matched_rows
#>         4108
round(mean(log_df$open[match]), 3)
#> [1] 0.625
```

0.625. The true value of this policy, computed from the truth matrix in step 2, is 0.604. The naive average is high by 0.021, which over 40,000 sends promises about 840 opens that will never arrive. And it is not bad luck; re-run the log a thousand times and the naive score keeps landing near 0.627. To see why, ask not how many rows matched, but **who** they are:

```r
round(rbind(the_list = prop.table(table(log_df$seg)),
            matched_rows = prop.table(table(log_df$seg[match]))), 2)
#>              bargain loyalty
#> the_list        0.60    0.40
#> matched_rows    0.22    0.78
```

The list is 60/40 bargain-to-loyalty, but the matched rows are 22/78, nearly reversed. The mechanism: on loyalty members the new policy picks C, the old campaign's favorite, so they agree on 80% of loyalty rows. On bargain hunters the new policy picks B, which the old campaign sent just 15% of the time. Matching therefore harvests loyalty rows generously and bargain rows grudgingly, and loyalty-plus-C happens to be the new policy's best-performing half (0.64 against 0.58). The naive average grades the policy almost entirely on its easiest audience.

[KEY INSIGHT]
Matched rows are real data, but they are not a fair sample of the policy you are scoring. The old policy decided which rows exist, so its preferences leak into any straight average of them. This is selection bias with a steering wheel, and fixing it is exactly what the propensity column is for.

=== step === concept
::eyebrow The fix
## Inverse-propensity scoring

The composition table says the problem out loud: matched bargain-B rows are scarce, one for every 6.7 the new policy would actually generate, while matched loyalty-C rows are plentiful. The fix is to make each row count for what it is standing in for. A matched row the old policy produced with probability \(p_i\) represents \(1/p_i\) sends of the new policy, so weight it by exactly that. This is **inverse-propensity scoring**, IPS for short (the references trace the idea to Horvitz and Thompson's 1952 survey-sampling estimator):

\[ \hat V_{\text{IPS}} \;=\; \frac{1}{n} \sum_{i=1}^{n} \frac{\mathbb{1}\!\left[\pi_{\text{new}}(x_i) = a_i\right]}{p_i} \, r_i \]

Every symbol in words: \(n\) is all 10,000 logged rows, \(x_i\) is row \(i\)'s context (its segment), \(a_i\) the line the old campaign sent it, \(r_i\) its reward (1 for an open, 0 for silence), and \(p_i\) the logged propensity of \(a_i\). The indicator \(\mathbb{1}[\cdot]\) is 1 when the new policy would have sent the same line and 0 otherwise, so unmatched rows contribute zero, but, crucially, they stay in the denominator: the average runs over all \(n\) rows, not just the matches.

```r
w   <- match / log_df$prop      # 0 for unmatched rows; 1/p for matched ones
ips <- mean(w * log_df$open)
truth <- sum(share * p_true[cbind(names(pi_new), pi_new)])
round(c(truth = truth, naive = mean(log_df$open[match]), ips = ips), 3)
#> truth naive   ips
#> 0.604 0.625 0.596
```

The naive score missed high by 0.021 and would keep missing high on every re-run. IPS lands 0.008 low, and that residue is honest sampling noise around the true 0.604, not bias. The reweighting works for a one-line reason: within a segment, line \(a\) appears in the log with probability \(p_a\), and dividing by \(p_a\) cancels it, so every (segment, line) pocket re-enters the average at the weight the *list* gives it, not the weight the *old policy* gave it. Look at the weights it took:

```r
table(round(w[match], 2))
#> 1.25 6.67
#> 3208  900
```

Each of the 900 matched bargain-B rows was scaled up to speak for the 6.7 sends the old policy withheld, and the 3,208 loyalty-C rows were scaled down to 1.25. Fairness restored, but notice the price: 900 rows carrying weight 6.67 means a real share of the estimate rides on a small crowd, which makes the estimator noisy.

[WARNING]
IPS is unbiased only if the logged propensities are correct and every line the new policy wants had some chance under the old one. And its variance explodes as propensities shrink: at \(p = 0.15\) the weights are a manageable 6.7, at \(p = 0.01\) they are 100, and one lucky open among them can swing the whole score. Small propensities are where IPS goes to die.

=== step === tryit
::eyebrow Your turn
## Score the incumbent from the same log

The comparison Meera actually has to defend in the planning meeting is against the incumbent: "C for everyone", the line the old campaign crowned. Score that policy from the same log with IPS. Remember: the estimator averages over all 10,000 rows, and the zeros are load-bearing.

```r
pi_c    <- c(bargain = "C", loyalty = "C")   # the incumbent: C for everyone
match_c <- log_df$line == pi_c[log_df$seg]

ips_c <- mean(____)                          # weight, then reward: over ALL rows
round(ips_c, 3)
```
::check {"regex":"match_c\\s*(/\\s*log_df\\$prop\\s*\\*\\s*log_df\\$open|\\*\\s*log_df\\$open\\s*/\\s*log_df\\$prop)","gate":true,"difficulty":"intermediate","ok":"0.552, against a true value of 0.55: the log scores a policy it never ran almost exactly. Put it beside the contextual policy at 0.60 and the 2,160-open case for going contextual next year has been made without sending a single new email.","no":"Weight every row by its match with the incumbent divided by the logged propensity, then multiply by the reward: match_c / log_df$prop * log_df$open. And average with mean() over ALL rows, not just the matched ones; dropping the zeros re-creates the naive estimator."}
::solution
```r
pi_c    <- c(bargain = "C", loyalty = "C")
match_c <- log_df$line == pi_c[log_df$seg]

ips_c <- mean(match_c / log_df$prop * log_df$open)
round(ips_c, 3)
#> [1] 0.552
```

=== step === concept
::eyebrow The stronger fix
## The doubly robust estimator

IPS has a strange blind spot: it throws away 59% of the log (the unmatched rows) and stakes everything on the propensities being right. There is an opposite strategy, called the **direct method**: use *every* row to fit a reward model \(\hat r(x, a)\), a prediction of the open rate for each context and line, then score the new policy purely on predictions. All the data, no weights, but now everything rides on the model being right, and a model fitted to the old policy's traffic inherits its blind spots.

The **doubly robust** estimator refuses to choose. Start from the model's answer, then use IPS not on raw rewards but on the model's *errors*, correcting the prediction wherever matched rows prove it wrong:

\[ \hat V_{\text{DR}} \;=\; \frac{1}{n} \sum_{i=1}^{n} \left( \hat r\!\left(x_i, \pi_{\text{new}}(x_i)\right) \;+\; \frac{\mathbb{1}\!\left[\pi_{\text{new}}(x_i) = a_i\right]}{p_i} \Big( r_i - \hat r(x_i, a_i) \Big) \right) \]

The first term is the direct method's guess for row \(i\); the second is the IPS machinery from the last step applied to the residual \(r_i - \hat r(x_i, a_i)\), the gap between what actually happened and what the model predicted for the line actually sent. The name is earned: the estimator is unbiased if **either** the propensities are right (the correction then repairs any model, as its errors get reweighted to cancel) **or** the model is right (the residuals then average to zero and the noisy correction has nothing to do). Only both failing together sinks it.

::widget process-flow {"steps":[{"title":"Log every decision","sub":"context, line sent, its send-time probability, and the reward"},{"title":"Propose a new policy","sub":"a rule that names a line for each context"},{"title":"Model the rewards","sub":"predict each open rate from the logged data"},{"title":"Reweight the surprises","sub":"IPS applied to the model errors, where the two policies agree"},{"title":"Read the score","sub":"a policy value, before a single new email is sent"}]}

Watch both halves of the promise work. First, right propensities repairing a wrong model: fit the crudest model on offer, one open rate per line, context-blind, so it believes B earns 0.496 for everyone when the truth is 0.58 and 0.38:

```r
r_line   <- tapply(log_df$open, log_df$line, mean)   # a context-BLIND reward model
round(r_line, 3)
#>     A     B     C
#> 0.304 0.496 0.552
r_model  <- r_line[pi_new[log_df$seg]]   # its guess for what the NEW policy sends
r_logged <- r_line[log_df$line]          # its guess for what was ACTUALLY sent
dr <- mean(r_model + w * (log_df$open - r_logged))
round(c(ips = ips, dr = dr, truth = truth), 3)
#>   ips    dr truth
#> 0.596 0.596 0.604
```

Second, a right model repairing wrong propensities. Suppose the propensity column had been lost and an analyst shrugged and assumed uniform thirds. IPS is wrecked; DR, given a decent model (here the segment-by-line cell means, which the log estimates well), barely notices:

```r
cell <- tapply(log_df$open, list(log_df$seg, log_df$line), mean)  # segment x line model
w_wrong   <- match / (1/3)                    # propensities replaced by a wrong guess
ips_wrong <- mean(w_wrong * log_df$open)
dr_wrong  <- mean(cell[cbind(log_df$seg, pi_new[log_df$seg])] +
                  w_wrong * (log_df$open - cell[cbind(log_df$seg, log_df$line)]))
round(c(ips_wrong_propensities = ips_wrong, dr_wrong_propensities = dr_wrong, truth = truth), 3)
#> ips_wrong_propensities  dr_wrong_propensities                  truth
#>                  0.770                  0.596                  0.604
```

IPS with wrong propensities reports 0.77 for a 0.60 policy, an error that would detonate in production. DR shrugs it off. And there is a quieter, everyday benefit: even when propensities are perfectly known, anchoring on a model and reweighting only the *surprises* shrinks the noise. Replay the whole final batch 200 times and compare all three estimators:

```r
set.seed(99)
score_once <- function() {
  seg  <- sample(rownames(p_true), n, replace = TRUE, prob = share)
  line <- sample(names(alloc),     n, replace = TRUE, prob = alloc)
  open <- rbinom(n, 1, p_true[cbind(seg, line)])
  prop <- unname(alloc[line]); match <- line == pi_new[seg]
  r_ln <- tapply(open, line, mean)
  c(naive = mean(open[match]),
    ips   = mean(match / prop * open),
    dr    = mean(r_ln[pi_new[seg]] + match / prop * (open - r_ln[line])))
}
runs <- replicate(200, score_once())
round(rbind(mean = rowMeans(runs), sd = apply(runs, 1, sd)), 4)
#>       naive    ips     dr
#> mean 0.6274 0.6045 0.6049
#> sd   0.0074 0.0154 0.0111
```

Read the table as three personalities. The naive average is *precisely wrong*: tightly clustered around 0.627, a truth-free number, and its small sd makes it dangerously convincing. IPS is *honestly noisy*: centered on the true 0.604 with the widest spread. DR is honest and calmer: same center, sd down from 0.0154 to 0.0111, which by the square-root law means it wrings the same precision out of roughly half the log.

[KEY INSIGHT]
IPS trusts the propensities completely; the direct method trusts the model completely; doubly robust needs only one of the two to hold, and pays less variance even when both do. It is the default scorer in every serious off-policy toolkit for a reason.

=== step === quiz
::eyebrow Check yourself
## The policy the log cannot see

Emboldened, Meera drafts a bolder policy for next Diwali: keep B for bargain hunters, but send loyalty members a brand-new line D, "Early access for members only", which did not exist during the campaign. Can IPS or DR score this policy from the log?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Yes, IPS can: the inverse-propensity weights compensate for how rarely the old policy chose D ::no The weights rescale rows that exist. Line D has zero logged rows and propensity zero, so there is nothing to rescale: the matched set for loyalty members is empty, not underweighted.
- Yes, DR can: double robustness means the model side covers whatever the log missed ::no The reward model is fitted to the log, which contains no sends of D, so its prediction for D is pure invention, and with no matched rows the correction term is zero. DR does not fail loudly here; it quietly returns an unchecked guess, which is worse.
- Neither: the log carries no evidence about D at all, so scoring it needs new exploration, a pilot that actually sends some D ::ok Right. This is the overlap requirement: off-policy evaluation can only reweight actions the old policy had some chance of taking. For anything truly new, buy evidence, for instance a small randomized pilot, exactly the kind of exploration this course began with.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Li, Chu, Langford and Schapire (2010), A Contextual-Bandit Approach to Personalized News Article Recommendation](https://arxiv.org/abs/1003.0146) - the LinUCB paper: contextual bandits with a model instead of per-cell tallies, serving news at Yahoo scale, with the offline-evaluation trick that inspired much of this field.
- [Dudik, Langford and Li (2011), Doubly Robust Policy Evaluation and Learning](https://arxiv.org/abs/1103.4601) - the paper behind this lesson's second half: the DR estimator for logged bandit feedback, with the either-or guarantee proved.
- [Horvitz and Thompson (1952), A Generalization of Sampling Without Replacement from a Finite Universe](https://doi.org/10.1080/01621459.1952.10483446) - where inverse-propensity weighting comes from: the survey-sampling estimator that IPS transplants to policy evaluation.
- [Sutton and Barto, Reinforcement Learning: An Introduction, 2nd edition, chapter 2 (free HTML)](http://incompleteideas.net/book/the-book-2nd.html) - contextual bandits as associative search, and the bridge from bandits to full reinforcement learning.
- [Saito et al. (2020), Open Bandit Dataset and Pipeline](https://arxiv.org/abs/2008.07146) - a real production bandit log, released with code, on which you can run the exact estimators you built here.

=== step === complete
## Lesson 7 complete

The course's last assumption fell. You gave the bandit eyes, six Beta curves instead of three, and watched the contextual version route B to bargain hunters and C to loyalty members for a regret bill of 48 against the blind bandit's 256, a gap that compounds forever because blindness is a structural tax, 2,160 opens per campaign on this list. Then you learned to spend the log: the propensity column recorded at send time, the naive matched average unmasked as a 22/78 sample of a 60/40 list, IPS restoring honesty by making each row speak for the sends it stands in for, and the doubly robust estimator surviving a wrong model and wrong propensities in turn while cutting the noise by more than a quarter. The final try-it was the quiet triumph: you priced two policies against each other, 0.60 versus 0.55, from data alone.

That completes the Experimentation course. Look at what you can now do end to end: size an experiment so it can see the effect it is hunting (Lesson 1), sharpen it with variance reduction (Lesson 2), keep it honest against peeking and broken randomizers (Lesson 3), design around interference with clusters and switchbacks (Lesson 4), earn during the test when the moment calls for a bandit (Lessons 5 and 6), and value the next idea from the wreckage of the last one (this lesson). Every experiment your team runs from now on leaves behind a log; you are the person who knows it is an asset.
