# Prose voice (SSOT)

How sentences are written on this site. Applies to **every** content type: tutorials,
PSEO posts, handbook chapters, interactive lessons, exercise hubs, landing copy.
Referenced by `tutorial-pedagogy.md` (T16/T17), `lesson-pedagogy.md` (R15),
`pseo-formatting.md` (section 9), and the writer + reviewer skills.

**P1 and P2 are guidance, not rules.** They describe what good writing here reads
like, and each comes with a test you can run when a passage feels wrong. Neither
is a gate to apply sentence by sentence. Applied that way they produce exactly the
stiff, over-engineered prose they exist to prevent, which is the opposite of the
point: the writing should read like prose, not like something that passed a check.

**P3 is a hard rule.** It is a prohibition, not a matter of style, and it holds
every time.

---

## P1 - Write about the topic (guidance)

**The writing is about its subject, not about itself.** Naming the page is normal
and often useful: "the same regression you fitted earlier" locates something real.
There is nothing to avoid at the word level, and no banned phrases. What goes
wrong is prose that has drifted into describing its own promise, structure or
method instead of saying anything about the topic.

Most sentences never raise the question. Do not audit them one by one. Reach for
the test below when a passage reads busy but empty, which is when this defect is
usually what you are feeling.

**The cargo test, as a diagnostic.** Cross out every phrase that names the article
(`this guide`, `in this post`, `you will learn`, `by the end`, `the rest of this
tutorial`). Read what is left.

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
cargo test; the reviewer pass owns this, and owns it as a judgement about whether a
passage says anything, never as a count of sentences that mention the page.

---

## P2 - A paragraph should go somewhere (guidance)

**Good prose reads like someone thinking, not like a set of facts stacked in a
column.** Ideas arrive because of each other rather than merely after each other.

This is a property of paragraphs, and it comes from knowing what a paragraph is
for before writing it. **It is not a requirement that every sentence attach to the
previous one.** Written that way you get connective-stuffed prose that is harder
to read than the problem it was fixing, and it reads engineered, which is worse
than reading flat. Plenty of good sentences simply sit next to their neighbour,
and short unattached sentences are often the best ones on the page.

The defect is a whole paragraph of true statements that could appear in any order,
which reads dead even though every sentence in it is correct.

**The reorder test, as a diagnostic.** When a paragraph feels flat, shuffle its
sentences. If nothing breaks, it was a list wearing prose punctuation. Fix it by
working out what the paragraph is actually arguing and letting the sentences fall
out of that, not by threading connectives through what is already there.

Three things usually explain a flat paragraph:

1. **Nothing says how one fact bears on the next.** `and` and `but` chain without
   subordinating. `because`, `so`, `which means`, `whereas`, `even though`, `once`
   and `until` carry an actual relationship. Use them where one exists; do not
   manufacture one where it does not.
2. **Every sentence opens on its subject.** `paste0() is the shortcut. Recycling
   applies. Ties break by the second key.` Front something in some of them: a
   condition, a time, a contrast, a because-clause.
3. **Every sentence is the same length.** Generated prose clusters around one
   length; human prose varies hard.

**On length.** A paragraph where every sentence runs 8 to 14 words reads flat even
when each is true and clear. A long sentence carrying a because-clause, followed by
a short one that lands the point, is a shape worth having. Notice length; do not
count it. Averaging toward the middle is the thing to avoid, because a hard short
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

### What this does NOT mean

Not a licence for long winding sentences, subordinate-clause pileups, or ornament.
Plain and literal still wins (T15 / R12). Short sentences are good, and a page full
of them is fine; a *run* of them with nothing joining them, in a paragraph that
should have been making a case, is the thing worth noticing. If a sentence needs
two commas and a semicolon to survive, split it and connect the halves properly.

And it does not mean every paragraph must build to something. Some paragraphs list
options, state facts, or set up the next one, and that is what they are for. This
is about prose that should have been thinking and turned out to be inventory.

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
higher = choppier).

**Do not write to these numbers.** They are a pointer for a human and never a
verdict: they say which page to look at, and reading it decides whether anything
is actually wrong. A page can sit outside every column above and be perfectly good
prose, and a page can satisfy all of them and still be dead. Optimising a draft
until the metrics clear is how you produce writing that passes a check and reads
like it. The "healthy" column is where most decent pages happen to land, which is
all it is.
