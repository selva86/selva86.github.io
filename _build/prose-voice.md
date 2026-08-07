# Prose voice (SSOT)

How sentences are written on this site. Applies to **every** content type: tutorials,
PSEO posts, handbook chapters, interactive lessons, exercise hubs, landing copy.
Referenced by `tutorial-pedagogy.md` (T16/T17), `lesson-pedagogy.md` (R15),
`pseo-formatting.md` (section 9), and the writer + reviewer skills. Three rules.
Read all three; they are short on purpose.

---

## P1 - Don't write about the article. Write about the topic.

**In one line: if a sentence only describes the page, delete it. If it tells the
reader something about the subject, keep it.**

The defect is **not** the words "this guide". Those words are usually fine. The
defect is a sentence whose whole payload is a claim about the article.

**The cargo test.** Cross out every phrase that names the article (`this guide`,
`in this post`, `you will learn`, `by the end`, `the rest of this tutorial`). Read
what is left.

- A fact about the SUBJECT survives -> keep it. The article-reference was a frame
  around real cargo.
- Nothing survives except a claim about the article's promise, completeness,
  structure, method, or how the reader will feel -> **cut the sentence.**

Worked, on the two cases that look identical to a keyword search:

| Sentence | Cross out the frame | Verdict |
|---|---|---|
| "This guide covers three ways to fit a model." | "three ways to fit a model" - a fact about the topic | **fine** |
| "This guide covers arrows, shaded highlights, and labels placed on the lines." | three concrete techniques | **fine** |
| "This is the same regression you fitted in the second section of this tutorial." | "the same regression you fitted" - locates a real object | **fine** |
| "This guide keeps a promise the title makes." | "keeps a promise the title makes" - a claim about the article | **cut** |
| "This tutorial builds the idea from the ground up." | "builds the idea from the ground up" - a claim about method | **cut** |

**Confirm with the topic-swap test.** Could you paste the sentence, unchanged, into
an article on a completely unrelated topic? "This guide keeps a promise the title
makes" works verbatim on any page ever written. That is what makes it furniture.

**A separate, weaker preference (not a defect):** where a sentence announces cargo
it could just deliver, deliver it. "In this tutorial you will learn three R packages
that profile your data" -> "Three R packages profile every column of a 40-column
export in a single call." Same cargo, fewer words, and the reader is already
learning. Prefer the direct form in the opening especially. This is a tightening
note, not a failure: do not treat every announcement as a defect.

There is no banned word list, and there must not be one. A script cannot apply the
cargo test; the reviewer pass owns this rule.

---

## P2 - Each sentence should follow from the one before it

**In one line: a paragraph is an argument, not a list. If you can shuffle the
sentences and it still reads fine, you wrote a list and punctuated it as prose.**

A list of true statements is not prose. Human prose is an argument, where each
sentence needs the one before it. This is the more common defect of the two, and it
is invisible sentence by sentence: every sentence is correct, and the paragraph is
still dead.

**The reorder test.** Shuffle the sentences of a paragraph. If it reads just as well
in the new order, it was a list wearing prose punctuation. Rewrite it so that at
least one sentence cannot move: make the later sentence depend on the earlier one
(`because`, `so`, `which means`, `whereas`, `even though`, `once`, `until`,
`rather than`, `and that is why`), or make it answer a question the earlier one
raised.

Three things to check when the test fails:

1. **Connectives are missing.** Adjacent facts sit side by side with nothing saying
   how one bears on the other. `and` and `but` do not count: they chain facts
   without subordinating one to the other. Aim for a subordinating connective every
   two or three sentences of body prose.
2. **Every sentence opens on its subject.** `paste0() is the shortcut. Recycling
   applies. Ties break by the second key.` Front something in some of them: a
   condition, a time, a contrast, a because-clause.
3. **Every sentence is the same length.** Generated prose clusters around one
   length; human prose varies hard.

**Varied length, concretely.** In any paragraph of three or more sentences, the
longest should be at least twice the shortest. A paragraph where every sentence
runs 8 to 14 words is the defect, even when each sentence is true and clear. A
25-word sentence that carries a because-clause followed by a 5-word one that lands
the point is the shape to aim for. Do not average toward the middle: a hard short
sentence only works next to a long one.

### Before / after, from real pages on this site

`posts/Sampling-Distributions-in-R.md` - four facts, no argument:

> BEFORE: You measure the IQ of 30 people and get an average of 103. A colleague
> repeats the same study with 30 different people and gets 98. Neither of you made a
> mistake, and neither number is the truth. The average moved because the sample moved.

> AFTER: You measure the IQ of 30 people and get an average of 103, whereas a
> colleague who repeats the same study on 30 different people gets 98. Neither of you
> made a mistake. The average moved because the sample moved, and once you accept
> that, the interesting question is no longer which number is right but how far the
> number can wander: if 103 and 98 are both ordinary results, what would an alarming
> one look like?

Lengths go 24 / 5 / 52 instead of 13 / 13 / 12 / 7. `whereas` makes the second study
a contrast rather than a second item, `once you accept that` makes the third sentence
depend on the second, and the closing question is what the next paragraph answers.

`posts/base-paste-in-R.md` - a bulleted list with the bullets removed:

> BEFORE: This is the most-used string concatenation function in base R. Every R
> programmer learns it early. `paste0()` is the no-separator shortcut.

> AFTER: `paste()` is the most-used string concatenation function in base R, which is
> why most people meet it in their first week. Its sibling `paste0()` does the same
> job without inserting a separator, so reach for it whenever the pieces should butt
> straight up against each other.

Two sentences instead of three, and the second one now says WHEN you would want
`paste0()` rather than only naming it.

### What this rule does NOT mean

Not a licence for long winding sentences, subordinate-clause pileups, or ornament.
Plain and literal still wins (T15 / R12). Short sentences are good; a *run* of them
with nothing joining them is the defect. If a sentence needs two commas and a
semicolon to survive, split it and connect the halves properly.

---

## P3 - Never make up a number

**In one line: every number you write must come from a source or a measurement.
If you have neither, say it without the number.**

Applies to every number that appears in prose. `T7` and `R7` already forbid
fabricated code output, data and citations; this is the softer case they were not
written for, where a number arrives only to make a sentence sound authoritative.

> "which is where you will use this ninety percent of the time"
> "most analysts reach for the second option"
> "this roughly doubles the runtime"

Nobody measured any of those. An invented number is worse than no number, because
it is the part a reader quotes and the part a reviewer checks.

If you have a source, cite it. If you measured it, show the measurement. If
neither, make the claim without the quantity: **vague is honest, precise and
unsourced is not.** "Almost always" is a fair thing to write when you have not
counted. "Ninety percent of the time" is not.

This binds anywhere a position is being taken. Take the position; do not
manufacture a statistic to make it sound better founded.

Both real examples above came out of a controlled writing test on 2026-08-07, one
from a page written under an earlier draft of a voice rule and one from a page
written under these rules as they stand. The failure is live, not hypothetical.

---

## Measuring P2

`python Scripts/prose_flow_check.py posts/<slug>.md` reports, on body prose only:

| Metric | Meaning | Healthy |
|---|---|---|
| `sub_100w` | subordinating connectives per 100 words | >= 1.2 |
| `cv` | sd / mean of sentence length | >= 0.48 |
| `flat_pct` | short + subject-opening + connective-free sentences | <= 30 |
| `max_flat_run` | longest unbroken run of those | <= 3 |
| `worst_run` | the offending passage, quoted | - |

`--all` ranks the corpus by CHOP (mean percentile rank of the first three, 0-100,
higher = choppier). The numbers are a **pointer for a human**, never a verdict: they
say where to look, and the reorder test says whether it is actually wrong.
