<!--
VOICE-EDIT COPY of lessons/Inference-Mini-1.md (live lesson untouched).
Edit any prose freely - that is the whole point. Things safe to IGNORE:
the frontmatter block at the top, the === step === lines, and any line
starting with :: (widget/quiz/check configs). If you want to reword quiz
questions or feedback inside ::quiz/::check lines, go ahead - I will carry
the edits over carefully. R code blocks and their #> outputs are real
executed output; leave those as they are.
-->

---
title: "How Statistical Inference Works"
slug: "Inference-Mini-1"
catalog_blurb: "How to tell a real effect from a lucky streak."
description: "How statistical inference works, taught from zero with a taste-test experiment you simulate yourself. No formulas, just the reasoning."
keywords: "statistical inference, how inference works, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.1"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
webr: true
mathjax: false
---

=== step === cover
::eyebrow Part 1 of 7
## How Statistical Inference Works

Today let's understand the essense of how statistical inference works. 

Let's start with a simple bet. You are at a friend's place for dinner when Priya makes a claim: she can tell Coke from Pepsi purely by taste alone.

Nobody at the table believes it. 

So you carry ten identical plastic cups into the kitchen and fill each one by tossing a coin. When it lands heads you fill it with Coke and for tails fill it with Pepsi, while writing the answers down as you go. 

Not even you know how many of each you poured. Next, Priya tastes all ten and calls them one at a time.

She gets nine right and one wrong.

Now, is Priya really skilled, or just got lucky?

Getting nine out of ten right does feel like a lot. However, the trouble is that somebody with no ability whatsoever, somebody purely guessing, would still get a fair share of the cups right by chance, and every so often that guesser would get almost all of them right. 

So the question is not whether 9 out of 10 sounds impressive. It does. The real question is how often blind luck manages nine.

How can we find out?

Press the buttons below. Every bar you get in the output is a real round of ten pure-guess calls, played right now in front of you, and the orange bars are the rounds where luck alone did as good as Priya or better.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct guesses", "seed": 42}

By the end you will be able to:

- Say why nine right out of ten, on its own, is not evidence of anything
- Build the guessing world in R and know how often you get a result that good
- Read and understand the answer correctly, and state the inference plainly
- Apply the method somewhere else entirely, like an online shop comparing two versions of its checkout page

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `x >= 9` are familiar. No statistics at all is assumed. We will build the intuition here from scratch.

=== step === concept
::eyebrow The problem