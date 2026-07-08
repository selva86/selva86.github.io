---
title: "Interpretability Lesson 6: Model Cards and Documenting a Model"
catalog_blurb: "Document a model's intended use, training data, and known limits."
description: "Write a model card in R: document a model's intended use, training data, per-group metrics, and known limits so other teams can safely trust and reuse it."
keywords: "model card, model cards for model reporting, documenting machine learning models, intended use, model limitations, disaggregated metrics, datasheets for datasets, responsible AI, R"
post_type: "LESSON"
curriculum_id: "6.110.6"
webr: true
lesson_access: "pro"
course_id: "ds-interpretability"
course_title: "Model Interpretability in R"
course_lesson: "6"
course_total: "6"
course_landing: "R-Interpretability-Course.html"
course_next: ""
course_prev: "Fairness-Basics.html"
---

=== step === cover
::eyebrow Lesson 6 of 6
## Model Cards and Documenting a Model

Lessons 1 to 5 taught you to interrogate a model: which features moved a prediction (SHAP), the shape of each effect (partial dependence), and whether the model treats groups equally (fairness). You now know a great deal about one model. But everything you learned lives in your head and your notebook. The moment someone else picks up your model, that knowledge is gone.

This last lesson fixes that. A **model card** is a short, standard document that travels with a model and answers the questions every future user will have: what is this model for, what was it trained on, how well does it work (and for whom), and where does it break?

We will build one for a real, running example: **Willow Creek Clinic** trained a model that flags adult inpatients at risk of being readmitted to hospital within 30 days, so nurses can prioritise follow-up calls. The card below is what you will produce. Toggle between **Source**, the plain text you write, and **Rendered**, the finished card.

By the end of this lesson you will be able to:

- Name the **six sections** of a model card and say what each one documents
- Explain why an undocumented model gets misused, and what a card carries across the handoff
- Report performance the honest way: **measured**, and broken down **by subgroup**
- Document the factors a model leans on and where its training data may not represent its users
- Write a card whose numbers are **computed, not typed**, and state its known limits plainly

**Prerequisites:** you can fit and use a model in R and read a `predict()` output (for example a [random forest](Random-Forest-Course.html)), and you have done [Lesson 5: Fairness Basics](Fairness-Basics.html), where you computed per-group rates like recall.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Willow Creek readmission model\nversion: 2.1\nowner: Clinical Data team"},{"type":"prose","text":"## Intended use\n\nFlag adult inpatients at risk of readmission within 30 days, so nurses can prioritise follow-up calls. Not for pediatric patients, other hospitals, or billing decisions."},{"type":"code","text":"recall_by_age |> ggplot(aes(age, recall)) + geom_col()","chart":[{"x":"Adults","y":90},{"x":"Seniors","y":50}]}]}

=== step === concept
::eyebrow Why bother
## A model with no label is a loaded tool

Think of a bottle of pills. Before anyone takes one, the label tells them the dose, who it is for, what it treats, and the side effects to watch for. Ship the same pills in a blank bottle and someone will take the wrong dose for the wrong reason. A trained model is exactly this: powerful, and dangerous without a label.

Here is how the danger plays out. The Willow Creek team that built the readmission model knows things that never made it into the model file: it was trained on **adult** inpatients at **this** hospital over the **last two years**. Six months later a colleague finds the model, sees it predicts readmission, and runs it on the emergency-room walk-ins at a different site. It returns confident numbers. They are quietly wrong, and nobody gets an error message.

::widget process-flow {"steps":[{"title":"Team builds it","sub":"they know the patients, the years, the caveats"},{"title":"Model handed off","sub":"colleagues get a file and a predict() call"},{"title":"Used somewhere new","sub":"a different ward, a later year, a new purpose"},{"title":"Silent failure","sub":"no error, just quietly wrong decisions"}]}

[KEY INSIGHT]
The context that makes a model safe to use, who it is for and where it breaks, lives in the builder's head, not in the model file. A model card is the artifact that writes it down and rides along with the model so it is never lost.

=== step === concept
::eyebrow The template
## The six sections of a model card

A model card is not free-form. The idea comes from a 2019 paper by Margaret Mitchell and colleagues at Google, and it fixes a small set of sections so that every card answers the same questions in the same order. You can skim any card and know where to look. Here are the six that matter most, each with what it documents and how it reads for our clinic model.

::widget styled-table {"cols":["section","what it documents","for the Willow Creek model"],"rows":[["Model details","owner, version, date, model type","Clinical Data team, v2.1, random forest"],["Intended use","the decisions it is for, and the ones it is not","follow-up for adult inpatients; not billing"],["Factors","subgroups, instruments and settings that affect it","age group, ward, prior admissions"],["Metrics","which measures, at which threshold, per subgroup","accuracy and recall by age at a 0.5 cutoff"],["Training data","what it learned from, and who it represents","2 years from this hospital, adult inpatients"],["Limitations","known failure modes and ethical risks","misses half of at-risk seniors"]],"title":"What a model card documents","note":"Six sections adapted from Mitchell et al. (2019), Model Cards for Model Reporting."}

The rest of this lesson fills these in for the readmission model, and along the way you will see that the honest version of each section takes real work, not just a sentence.

=== step === concept
::eyebrow The Metrics section, done right
## Do not type the metrics, measure them, and split them up

The Metrics section is where cards most often lie, usually by accident. Someone writes "Accuracy: 86%" and moves on. That single number is both unverifiable (where did it come from?) and misleading (86% *for whom*?). The honest way is to compute the number from the evaluation data, and to break it down by the subgroups that matter.

Let us do exactly that. Every number on this page is built from the clinic's test set: 500 patients the model scored but never trained on. We create it right here from exact counts, so each figure below is reproducible and you can check it by hand.

```r
# The Willow Creek test set: 500 patients the model scored but never trained on.
# For each patient we record two facts:
#   readmit = 1 if they WERE readmitted within 30 days  (the ground truth)
#   flag    = 1 if the model FLAGGED them as high risk   (the decision)
age_group <- c(rep("adult", 300), rep("senior", 200))

readmit <- c(rep(1, 70), rep(0, 230),     # adults:  70 readmitted, 230 not
             rep(1, 50), rep(0, 150))     # seniors: 50 readmitted, 150 not

flag <- c(rep(1, 63), rep(0, 7), rep(1, 23), rep(0, 207),    # adults:  caught 63/70, 23 false alarms
          rep(1, 25), rep(0, 25), rep(1, 15), rep(0, 135))   # seniors: caught 25/50, 15 false alarms

# Overall accuracy: the model is right when its flag matches the truth.
mean(flag == readmit)
#> [1] 0.86
```

Eighty-six percent. That is the number that would have gone on the card. Now watch what it hides. **Recall** is the share of patients who were *truly* readmitted that the model actually flagged. Missing a real readmission (a low recall) is the costly error here: a fragile patient goes home with no follow-up. Split recall by age group:

```r
# recall = share of TRULY readmitted patients that the model flagged
recall <- function(g) {
  at_risk <- age_group == g & readmit == 1
  mean(flag[at_risk])
}
c(adult = recall("adult"), senior = recall("senior"))
#>  adult senior
#>    0.9    0.5

round(mean(flag[readmit == 1]), 2)   # overall recall, both groups together
#> [1] 0.73
```

The model catches 90% of at-risk adults but only **half** of at-risk seniors. The false-alarm rate (the share of *not*-readmitted patients the model wrongly flagged) is, by contrast, a steady 10% in both groups, so the problem is missed readmissions among older patients, not over-flagging. A card that reports only "86%" buries the one fact a nurse most needs to know.

::widget styled-table {"cols":["group","patients","accuracy","recall (at-risk caught)","false-alarm rate"],"rows":[["Overall",500,0.86,0.73,0.10],["Adults (under 65)",300,0.90,0.90,0.10],["Seniors (65 and older)",200,0.80,0.50,0.10]],"formats":{"patients":"comma","accuracy":"pct","recall (at-risk caught)":"pct","false-alarm rate":"pct"},"title":"Willow Creek model, audited by age group","note":"Recall is the share of truly readmitted patients the model flagged. A 0.5 threshold on the risk score."}

=== step === quiz
::eyebrow Check yourself
## One number, or the honest ones?

The clinic wants a single line in the card's Metrics section: **"Accuracy: 86%."** A reviewer objects. Given what you just computed, why is that one number not good enough for the card?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Because it hides who the model fails. It catches 90% of at-risk adults but only 50% of at-risk seniors, so the Metrics section should report performance broken down by subgroup, at the threshold used ::ok Exactly. One headline number is precisely what a model card exists to unpack. Disaggregated recall at a stated threshold tells a nurse what the 86% never could.
- It is fine as is. 86% is a strong score, so the card can safely report just that one number ::no A single overall number is what causes the misuse a card is meant to prevent. It looks reassuring while hiding that half of at-risk seniors are missed.
- The card should report the training accuracy instead, since it is higher and looks better ::no Reporting the more flattering number is the opposite of documenting honestly, and training accuracy overstates real-world performance because the model has already seen that data.

=== step === concept
::eyebrow The Factors and Training-data sections
## What it leans on, and who it learned from

Two more sections work together. **Factors** records the inputs and settings that most affect the model's behaviour, so a reader knows what it is really keying on. **Training data** records what the model learned from, and crucially *who that data represents*, because a model is only reliable on people who look like its training set.

For the readmission model, the factors it weighs most are clinical history and utilisation. The chart shows their relative influence:

::widget importance-bars {"items":[{"label":"prior admissions","value":100},{"label":"num medications","value":74},{"label":"length of stay","value":60},{"label":"num diagnoses","value":41},{"label":"age","value":33},{"label":"lives alone","value":18}]}

Now the representativeness question. Look at who is actually in the data the model was evaluated on (and, here, trained on too):

```r
table(age_group)
#> age_group
#>  adult senior
#>    300    200

round(prop.table(table(age_group)), 2)
#> age_group
#>  adult senior
#>    0.6    0.4
```

Seniors are only 40% of the sample, and older patients have more complex, less predictable readmission patterns. Under-representation plus higher difficulty is a plausible reason the model learned adults well and seniors poorly. That sentence, not just the counts, is what belongs in the Training-data section: state who is well represented, who is not, and what that implies.

[WARNING]
The fix is never to quietly drop the weak subgroup from the card, or to remove the age feature so the gap "disappears." As you saw with proxies in [Fairness Basics](Fairness-Basics.html), other features stand in for age anyway. Documenting the gap is the honest move; hiding it is not.

=== step === tryit
::eyebrow Your turn
## Compute the number that goes in Limitations

The Limitations section needs one specific figure: **what share of at-risk seniors did the model actually flag?** That is the senior recall. The at-risk seniors are already selected for you; fill in the one line that computes their recall.

```r
at_risk_seniors <- age_group == "senior" & readmit == 1
senior_recall <- ____
senior_recall
```
::check {"regex":"mean\\s*[(]\\s*flag[[]\\s*at_risk_seniors\\s*[]]","gate":true,"difficulty":"intermediate","ok":"Right. The model flagged 25 of the 50 at-risk seniors, so senior recall is 25 / 50 = 0.50. That single number is the heart of the Limitations section.","no":"Average the flag over only the at-risk seniors: mean(flag[at_risk_seniors])."}
::solution
```r
at_risk_seniors <- age_group == "senior" & readmit == 1
senior_recall <- mean(flag[at_risk_seniors])
senior_recall
#> [1] 0.5
```

=== step === concept
::eyebrow Assemble it, and keep it honest
## A card that writes its own numbers

You now have every piece. The last idea makes the card trustworthy over time: **compute its numbers, do not type them.** If you paste "86%" into the text, the day someone retrains the model, the card silently goes stale and starts lying. Instead, write the card as a document (an R Markdown or Quarto file, exactly like [reproducible reports](Reproducible-Reports-with-Quarto.html)) where each metric is produced by a line of R at render time. Retrain, re-render, and the card updates itself.

Here is the Metrics-and-limitations part of the card. Toggle **Source** and **Rendered**: the accuracy in the source is a line of code, and the limitation states the senior gap in plain words.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Willow Creek readmission model\nsection: Metrics and limitations"},{"type":"prose","text":"## Limitations\n\nOverall accuracy is **86%**, yet the model flags only **50%** of at-risk patients aged 65 and older, against **90%** of younger adults. Do not use it as the sole readmission screen for older patients."},{"type":"code","text":"acc <- mean(flag == readmit)\nround(acc, 2)","chart":[{"x":"Adults","y":90},{"x":"Seniors","y":50}]}]}

Be clear-eyed about what this does and does not achieve. The card **documents** the model honestly. It does not repair the senior-recall gap, and it is not a live guardrail: once the model ships, inputs drift and performance decays, which is why documentation pairs with monitoring, the subject of the production course. A model card is only ever as honest as the person filling it in.

=== step === quiz
::eyebrow Check yourself
## Does a good card make the model trustworthy?

A team writes a thorough, honest model card for the readmission model, senior-recall gap and all, and publishes it alongside the model. Does having this card make the model safe to trust?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes. A complete, honest model card certifies the model, so anyone can now rely on it ::no A card documents; it does not certify or repair anything. It makes the model's limits visible so users can decide where it is safe, which is not the same as making it safe everywhere.
- No. The card records what the model does and where it fails, but it does not fix the senior-recall gap, and it is not a substitute for monitoring the model after it ships ::ok Exactly. Documentation and improvement are different jobs. The card tells a nurse not to trust it as the sole screen for seniors; closing that gap and watching for drift are separate, ongoing work.
- No, because a model card is only valid once it has been peer-reviewed and published in a journal ::no Publication is not what gives a card its value. A card is an internal, living document; its worth is honest, current content, not a review stamp.

=== step === concept
::eyebrow Go deeper
## References

- [Mitchell et al. (2019), Model Cards for Model Reporting](https://arxiv.org/abs/1810.03993) - the paper that introduced model cards and the section structure used here.
- [Gebru et al. (2021), Datasheets for Datasets](https://arxiv.org/abs/1803.09010) - the companion idea for documenting the training data itself, the Training-data section in depth.
- [Hugging Face: Model Cards](https://huggingface.co/docs/hub/model-cards) - the de facto standard card format today, with a template you can copy and hundreds of real examples.
- [Google: About Model Cards](https://modelcards.withgoogle.com/about) - short, readable example cards for real deployed models.
- [vetiver for R](https://rstudio.github.io/vetiver/) - document, version and deploy models from R, and auto-generate a model card as part of the workflow.

=== step === complete
## Lesson 6 complete

You can now do the thing that turns a private model into one other people can rely on: document it. A **model card** has six sections, model details, intended use, factors, metrics, training data, and limitations. Its Metrics section reports **measured, disaggregated** numbers (you saw an honest 86% overall hide a senior recall of just 50%), its Training-data section states **who is represented**, and its Limitations section names the gaps in plain words. Best of all, you write the card so its numbers are **computed at render time**, so it never drifts out of sync with the model.

That completes the Interpretability course. You can open a model, explain a single prediction, audit it for fairness, and write down what it does and where it fails. The natural next step is the **Production** course: once a documented model ships, inputs shift and performance decays, so you will learn to monitor it, detect drift, and know when to retrain, the live counterpart to the card you just wrote.
