---
title: "Model Interpretability in R: A Hands-On Course"
slug: "R-Interpretability-Course"
description: "Learn model interpretability in R in six interactive lessons: global vs local explanations, permutation importance, SHAP, partial dependence, fairness, and model cards."
keywords: "model interpretability in R, explainable AI, XAI, interpretable machine learning, feature importance, permutation importance, SHAP values, partial dependence, ICE, ALE, algorithmic fairness, model cards"
mathjax: false
webr: false
date: "2026-07-01"
curriculum_id: "6.110.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Interpretability (Course)"
sidebar_order: "110"
---

# Model Interpretability in R: A Hands-On Course

<p class="lead">A model that scores well on the test set still has to answer two questions before anyone trusts it: what did it learn in general, and why did it make this one prediction? Interpretability is how you answer both. This six-lesson interactive course teaches the craft from the ground up in R, one method at a time, with live examples you run in the browser.</p>

Accuracy is not the same as trust. A churn model can flag a customer with 0.87 risk and be right, yet the retention rep still needs a reason to put in the call, the product lead still needs to know what drives churn across the whole base, and a regulator may still ask you to show the model is not deciding on something it should not. None of those questions is answered by a single accuracy number. They are answered by an explanation, and there is more than one kind.

Most tutorials show one tool at a time (a `varImp` call here, a SHAP plot there) and skip the question that actually matters: *which* explanation answers the question you have, and what does it quietly assume? This course builds that judgment. Every method is introduced with the question it is meant to answer, how it is computed, and the exact way it can mislead you if you read it wrong.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints, and read every result as it appears.

## The six lessons

### Lesson 1: Global vs Local Explanations

The two questions every explanation answers: what the model learned overall, and why it made this one prediction. Learn to tell a global feature-importance ranking apart from a per-prediction breakdown, and to pick the right one for the question in front of you.

[Start Lesson 1: Global vs Local Explanations](Global-vs-Local-Explanations.html)

### Lesson 2: Permutation and Drop-Column Importance

Two model-agnostic ways to rank features by how much a model actually leans on them: shuffle a column and watch accuracy fall, or drop it and refit. Learn how each is computed, what it really measures, and the correlated-feature trap that makes both mislead.

[Start Lesson 2: Permutation and Drop-Column Importance](Permutation-and-Drop-Column-Importance.html)

### Lesson 3: SHAP Values

Additive, per-feature contributions that sum exactly to a single prediction. Learn where SHAP values come from, how to read the contribution for one row, and why "this feature pushed the prediction up by 0.12" is a claim you can stand behind.

[Start Lesson 3: SHAP Values](SHAP-Values.html)

### Lesson 4: Partial Dependence, ICE, and ALE

The shape of a feature's effect, not just its size. Learn partial dependence for the average effect, ICE curves for one row at a time, and ALE for when features are correlated and a partial-dependence plot quietly lies.

[Start Lesson 4: Partial Dependence, ICE, and ALE](Partial-Dependence-ICE-and-ALE.html)

### Lesson 5: Fairness Basics

Group fairness metrics, why several of them cannot all hold at once, and what you can actually do about a model that treats groups differently. The definitions and the honest limits, side by side.

[Start Lesson 5: Fairness Basics](Fairness-Basics.html)

### Lesson 6: Model Cards and Documenting a Model

An interpretation is only useful if it is written down. Learn to document intended use, training data, evaluation, and known limits in a model card, so the people who deploy your model know what it can and cannot do.

[Start Lesson 6: Model Cards and Documenting a Model](Model-Cards-and-Documenting-a-Model.html)

## Who this is for

You can fit a model in R (a logistic regression, a tree, a random forest) and read its output, and you know what a feature and a train/test split are. You do not need any prior experience with interpretability or explainable-AI packages. Every idea is built from the ground up, with the reason it exists before the code that computes it.

## What you will be able to do

- Tell a global explanation from a local one, and choose the right kind for the question you are answering
- Rank features honestly with permutation and drop-column importance, and spot when correlated features distort the ranking
- Break a single prediction into per-feature SHAP contributions that add up to the score
- Read the shape of a feature's effect with partial dependence, ICE, and ALE, and know which one to trust when features are correlated
- Measure group fairness, understand why the metrics conflict, and document a model's intended use and limits in a model card

Ready? [Begin with Lesson 1: Global vs Local Explanations](Global-vs-Local-Explanations.html).
