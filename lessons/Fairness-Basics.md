---
title: "Interpretability Lesson 5: Fairness Basics"
catalog_blurb: "Check whether a model treats groups unequally, and how to respond."
description: "Fairness basics in R: compute per-group selection, true-positive and false-positive rates, learn why the fairness definitions collide, and apply an honest mitigation."
keywords: "algorithmic fairness, machine learning fairness, demographic parity, equal opportunity, equalised odds, disparate impact, impossibility result, group fairness, model interpretability, R"
post_type: "LESSON"
curriculum_id: "6.110.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "5"
course_total: "6"
course_landing: "R-Interpretability-Course.html"
course_next: "Model-Cards-and-Documenting-a-Model.html"
course_prev: "Partial-Dependence-ICE-and-ALE.html"
---

=== step === cover
::eyebrow Lesson 5 of 6
## Fairness Basics

Lessons 2 to 4 asked *how* the model behaves: which feature moved a prediction, and what shape its effect traced. This final pair of lessons asks the question that matters most once a model decides something about a person: **for whom** does it work?

To make that concrete we switch to a decision that lands squarely on people. A bank runs a model that approves or denies small loans. Split its applicants into two groups, A and B, and a gap jumps out: **group A is approved far more often than group B.** Is that unfair? It depends entirely on what "fair" means, and it turns out you cannot have every version of fairness at once.

By the end of this lesson you will be able to:

- Compute the three group metrics every audit starts with: **selection rate**, **true-positive rate**, and **false-positive rate**
- State the three main fairness definitions and say which one a given gap violates
- Explain the **impossibility result**: when two groups repay at different rates, some fairness definitions cannot hold together
- Choose the definition that matches the real harm, apply one mitigation, and see honestly what gap it leaves behind

**Prerequisites:** you can fit and use a model in R (for example a [random forest](Random-Forest-Course.html)) and read a `predict()` output, and you have done [Lesson 4: Partial Dependence, ICE, and ALE](Partial-Dependence-ICE-and-ALE.html).

::widget fairness-metrics {}

=== step === concept
::eyebrow The setup
## From "how it decides" to "for whom"

Every tool so far explained the model's behaviour in the abstract. Fairness is different: it needs a decision that helps or harms real people, and a notion of who *deserved* the good outcome. Loan approval has both. The good outcome is being **approved**; the deserving applicants are the ones who **would have repaid**.

So each applicant carries two facts. `repaid` is the ground truth, 1 if they would repay the loan (learned later, from who actually paid). `approved` is the model's decision, 1 if it said yes. We have 400 applicants, 200 per group. Build them once, from exact counts, so this page runs on its own.

```r
# 400 loan applicants across two groups. For each we record two facts:
#   repaid   = 1 if they WOULD repay the loan  (ground truth, the "deserving" applicant)
#   approved = 1 if the model APPROVED them    (the decision)
group <- rep(c("A", "B"), each = 200)

# group A: 120 of 200 would repay; the model approved 96 of those 120,
#          plus 16 of the 80 who would have defaulted.
# group B:  80 of 200 would repay; the model approved 48 of those 80,
#          plus 24 of the 120 who would have defaulted.
repaid   <- c(rep(1, 120), rep(0, 80),                        # A: 120 repay, 80 default
              rep(1,  80), rep(0, 120))                       # B:  80 repay, 120 default
approved <- c(rep(1, 96), rep(0, 24), rep(1, 16), rep(0, 64), # A's decisions
              rep(1, 48), rep(0, 32), rep(1, 24), rep(0, 96)) # B's decisions

loans <- data.frame(group, repaid, approved)
table(loans$group, approved = loans$approved)
#>    approved
#>       0   1
#>   A  88 112
#>   B 128  72
```

Read the counts. In **group A**, 120 of 200 applicants would repay, and the model approved 112 of the 200. In **group B**, only 80 of 200 would repay, and it approved 72. Group A is approved more, but group A also holds more good borrowers to begin with. That difference in how often each group would repay, 60% versus 40%, is real and common, and untangling it from the model's decisions is the whole job of a fairness audit.

=== step === concept
::eyebrow The three numbers
## Selection rate, true-positive rate, false-positive rate

A fairness audit compares the **same** model across groups on three rates, all built from the confusion cells you already know (approved-and-repaid, approved-but-defaulted, and so on).

- **Selection rate** is the share of a group that gets approved, \( P(\hat{Y}=1) \), where \(\hat{Y}=1\) means "approved". It answers: how often does this group get the good outcome?
- **True-positive rate (TPR)** is the approval rate *among applicants who would actually repay*, \( P(\hat{Y}=1 \mid Y=1) \), where \(Y=1\) means "would repay". It answers: of the people who deserved a yes, how many got one?
- **False-positive rate (FPR)** is the approval rate *among those who would default*, \( P(\hat{Y}=1 \mid Y=0) \). It answers: how often does a bad loan slip through?

Compute all three per group, plus each group's **base rate** (its share who would repay):

```r
rates <- function(g) {
  s <- loans[loans$group == g, ]
  c(selection = mean(s$approved),                  # approval rate
    TPR       = mean(s$approved[s$repaid == 1]),   # approved AMONG would-repay
    FPR       = mean(s$approved[s$repaid == 0]),   # approved AMONG would-default
    base_rate = mean(s$repaid))                    # share who would repay
}
rbind(A = rates("A"), B = rates("B"))
#>   selection TPR FPR base_rate
#> A      0.56 0.8 0.2       0.6
#> B      0.36 0.6 0.2       0.4
```

Read it as an audit table. Group A is approved more overall (0.56 vs 0.36) **and** approved more among the people who would repay (TPR 0.80 vs 0.60). The one thing that matches is the false-positive rate (0.20 each). Three numbers, three different stories, and they will not all point the same way.

::widget styled-table {"cols":["group","selection","TPR","FPR","base rate"],"rows":[["A",0.56,0.8,0.2,0.6],["B",0.36,0.6,0.2,0.4]],"formats":{"selection":"pct","TPR":"pct","FPR":"pct","base rate":"pct"},"title":"Loan approvals audited by group","note":"Selection is the approval rate. TPR is the approval rate among applicants who would repay."}

=== step === widget
::eyebrow The definitions
## Three ways to define "fair"

Those rates give us three competing definitions of fairness. Each says "equal across groups", but equal on a *different* rate:

- **Demographic parity** wants equal **selection rates**: \( P(\hat{Y}=1 \mid A) \) is the same for every group \(A\). Everyone is approved at the same rate, regardless of who would repay.
- **Equal opportunity** wants equal **true-positive rates**: \( P(\hat{Y}=1 \mid Y=1, A) \) is the same for every group. Among the people who *would repay*, every group has the same chance of approval.
- **Equalised odds** is stricter still: it wants equal TPR **and** equal FPR. Groups must match both on the deserving and on the undeserving.

The widget runs the same audit on a second lender's model (its group A is approved 46% of the time, group B 28%, a different bank but the same shape of gap). Toggle each definition and watch which rate it compares, and whether the gap passes or fails.

::widget fairness-metrics {}

=== step === quiz
::eyebrow Check yourself
## Which definitions does our model fail?

Back to our bank: group A vs B has selection 0.56 vs 0.36, TPR 0.80 vs 0.60, and FPR 0.20 vs 0.20. Which fairness definitions does this model satisfy, and which does it fail?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It satisfies equalised odds, since the two false-positive rates match at 0.20
- It fails all three: parity (selection 0.56 vs 0.36), equal opportunity (TPR 0.80 vs 0.60), and equalised odds (which needs equal TPR and FPR, and the TPRs differ). Only the FPRs happen to match ::ok Exactly. Every definition compares a different rate, and the only rate that lines up here is the FPR, which on its own satisfies none of the three named definitions.
- It satisfies equal opportunity, because group B still receives some approvals ::no Equal opportunity means equal TPR, not "some approvals for everyone". The TPRs are 0.80 vs 0.60, a clear gap, so equal opportunity fails.

=== step === concept
::eyebrow The catch
## Why you cannot have all three

Here is the uncomfortable part. Our two groups repay at different rates: 60% of A would repay, only 40% of B. That single difference, a difference in **base rates**, is enough to make some fairness definitions mathematically incompatible.

The reason is a small identity. A group's selection rate is pinned down once you know its base rate and its two error rates. Writing \(\pi\) for the base rate (the share who would repay), and \(\text{TPR}\), \(\text{FPR}\) for the two approval rates:

\[ \text{selection} \;=\; \pi \cdot \text{TPR} \;+\; (1-\pi)\cdot \text{FPR}. \]

In words: everyone approved is either someone who would repay (a fraction \(\pi\) of the group, approved at rate TPR) or someone who would default (the remaining \(1-\pi\), approved at rate FPR). Check it against our audit:

```r
# selection is forced by base rate, TPR and FPR:
sel <- function(pi, tpr, fpr) pi * tpr + (1 - pi) * fpr
c(A = sel(0.60, 0.80, 0.20), B = sel(0.40, 0.60, 0.20))
#>    A    B
#> 0.56 0.36
```

Now try to engineer **equalised odds**: force both groups to share one TPR and one FPR. Plug equal rates into the identity but keep the different base rates, and the selection rates come out **different anyway**, so demographic parity breaks:

```r
# Force equalised odds: give BOTH groups TPR = 0.70 and FPR = 0.20.
# Base rates still differ (0.60 vs 0.40), so selection rates cannot match.
c(A = sel(0.60, 0.70, 0.20), B = sel(0.40, 0.70, 0.20))
#>   A   B
#> 0.5 0.4
```

[KEY INSIGHT]
When two groups have different base rates, equalised odds (equal TPR and FPR) and demographic parity (equal selection) cannot both hold. Making the model more accurate does not rescue you: the identity forces the two selection rates to match only when TPR equals FPR, that is, when the model approves would-repay and would-default applicants at exactly the same rate and so ignores merit entirely. Any model that actually tells the two groups of applicants apart has to pick which fairness you want; you cannot have every one at once.

=== step === quiz
::eyebrow Check yourself
## Can more data fix it?

Your bank wants the model to satisfy demographic parity **and** equalised odds at the same time. The two groups have different base rates (60% vs 40% would repay). A teammate says: just collect more data and retrain harder until both hold. Will that work?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: with enough data and careful tuning, a well-built model can satisfy every fairness definition at once
- No: since selection = base_rate x TPR + (1 - base_rate) x FPR, equal TPR and FPR with different base rates force different selection rates. The only way out is a model that approves repayers and defaulters at the same rate, which ignores merit and no bank would use ::ok Exactly. The incompatibility is baked into the identity. More data can improve accuracy, but it cannot make two unequal base rates produce equal selection AND equal error rates together.
- No, but only because the training data is biased; a perfectly clean dataset would let both definitions hold ::no Even with flawless, unbiased data, unequal base rates alone make parity and equalised odds incompatible. The obstacle is the base-rate gap itself, not dirty data: as long as the model tells repayers from defaulters at all, the two definitions collide.

=== step === tryit
::eyebrow Your turn
## Compute a group's TPR by hand

The **true-positive rate** for a group is the approval rate among the applicants in that group who would repay. We have already pulled out group B; fill in the one line that computes its TPR.

```r
b <- loans[loans$group == "B", ]
tpr_B <- ____                 # approval rate among group-B applicants with repaid == 1
tpr_B
```
::check {"regex":"mean\\(.*approved.*repaid\\s*==\\s*1","gate":true,"difficulty":"intermediate","ok":"That is group B's TPR: of the 80 group-B applicants who would repay, 48 were approved, so 48 / 80 = 0.60.","no":"Average `approved` over only the rows where `repaid == 1`: mean(b$approved[b$repaid == 1])."}
::solution
```r
b <- loans[loans$group == "B", ]
tpr_B <- mean(b$approved[b$repaid == 1])
tpr_B
#> [1] 0.6
```

=== step === concept
::eyebrow What to do
## Choose the harm, then fix the pipeline

Since you cannot satisfy every definition, fairness becomes a decision, not a calculation. The rule of thumb: pick the definition that matches the **harm you most want to avoid**. When the harm is denying a good outcome to someone who deserved it (a qualified applicant refused a loan, a sick patient not flagged), that is a false negative, so you care about **equal opportunity** (equal TPR). When the harm is unequal access regardless of merit, you reach for **demographic parity**.

Once you have chosen a target, you change the pipeline to hit it. Mitigation lives at three points. **Pre-processing** reweights or relabels the training data to remove a bias before fitting. **In-processing** adds a fairness penalty to the training objective. **Post-processing** leaves the model alone and adjusts the *decision*, for example a different approval threshold per group. Here is a post-processing fix that equalises opportunity by approving more of group B's qualified applicants:

```r
# Post-processing: approve more of the QUALIFIED group-B applicants so both
# groups reach the same true-positive rate (equal opportunity, target 0.80).
target_tpr  <- 0.80
appr_qual_B <- round(target_tpr * 80)        # approve 64 of B's 80 qualified (was 48)
new_sel_B   <- (appr_qual_B + 24) / 200      # keep FPR the same: still 24 of 120 approved
c(new_TPR_B = target_tpr, new_selection_B = new_sel_B, selection_A = 0.56)
#>       new_TPR_B new_selection_B     selection_A
#>            0.80            0.44            0.56
```

The true-positive rates now match at 0.80, yet the selection rates still differ (0.44 vs 0.56): exactly the impossibility from two steps ago. You closed the gap you chose and stayed honest that another one remains.

[WARNING]
One "fix" that does not work: simply deleting the group label so the model cannot see it. Other features (address, income, spending history) act as **proxies** and let the model reconstruct the group anyway, so the gaps usually survive. Fairness through unawareness is not fairness. You must measure the rates on the outputs, never assume fairness from the inputs.

That is the whole loop: audit the rates, choose the definition that matches the harm, mitigate, and document what you decided and what gap remains.

::widget process-flow {"steps":[{"title":"Audit","sub":"measure selection, TPR and FPR for every group"},{"title":"Choose","sub":"pick the fairness definition that matches the real harm"},{"title":"Mitigate","sub":"reweight data, add a training constraint, or adjust group thresholds"},{"title":"Document","sub":"record the choice, the gap left, and who is affected"}]}

=== step === quiz
::eyebrow Check yourself
## Does hiding the group make it fair?

To be fair, an engineer removes the applicant's group label from the model's inputs entirely, so the model can no longer see it. Does that guarantee a fair model?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: a model that never sees the protected attribute cannot discriminate on it
- No: other features (zip code, income, spending history) act as proxies for the group, so the model can reconstruct and act on it; the group gaps often survive. You must MEASURE fairness on the outputs, not assume it from the inputs ::ok Exactly. Removing the label removes your ability to audit, not the bias itself. Proxies carry the information, so you check the per-group rates on the decisions the model actually makes.
- No, but only if the engineer also forgot to delete the group column from the training data file ::no The problem is not a leftover column. Even with the label truly gone from training and scoring, proxy features reconstruct it, which is why unawareness does not deliver fairness.

=== step === concept
::eyebrow Go deeper
## References

- [Hardt, Price, Srebro (2016), Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413) - the paper that introduced equal opportunity and equalised odds, with the post-processing fix.
- [Chouldechova (2017), Fair Prediction with Disparate Impact](https://arxiv.org/abs/1703.00056) - the clean statement of the impossibility result: equal calibration and equal error rates cannot coexist when base rates differ.
- [Barocas, Hardt, Narayanan, Fairness and Machine Learning (free online book)](https://fairmlbook.org) - the standard textbook; the classification and "sources of unfairness" chapters cover everything here in depth.
- [Kozodoi and Varga, the fairness R package on CRAN](https://cran.r-project.org/package=fairness) - compute demographic parity, equal opportunity and equalised odds on your own model in one call.

=== step === complete
## Lesson 5 complete

You can now audit a model for fairness the way practitioners do. Compute three group rates, **selection**, **true-positive**, and **false-positive**; map them to the three definitions, **demographic parity**, **equal opportunity**, and **equalised odds**; and recognise that when groups have different base rates those definitions collide, so choosing one is a real decision with a documented trade-off. You watched a post-processing fix close one gap while another stayed open, and saw why deleting the protected attribute does not help.

Next, Lesson 6: **Model Cards.** Every choice you just made, the definition you picked, the gap you accepted, the group it affects, belongs in writing. A model card is where the whole interpretability toolkit, from SHAP to fairness, gets recorded so the people who rely on your model know what it does and where it fails.
