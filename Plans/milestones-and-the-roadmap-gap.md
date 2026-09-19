# Milestones people can see, and the roadmap that never mentions them

Written 2026-09-20. Covers two things: how a learner finds out what their next
milestone is, and how the exercise hubs get connected to the roadmaps that are
supposed to lead to them.

## Where this started

Two observations from the owner, both correct, both confirmed in the code.

**The roadmap never mentions the hubs.** `/roadmap/data-analyst.html` names the
Tidyverse Practitioner certificate four times, including in its own social
description, and links to **zero** exercise hubs. It does not link to
`/certifications.html` either. The reverse is nearly as bad: each track card on
the certifications page links to exactly **one** hub, when the track is fed by
ten to twelve.

**The rewards are spaced for people who do not exist.** The ladder in
`functions/_lib/badges.ts` awarded a badge on the first solve and then nothing
until the hundredth. Streaks filled in at 7, 30 and 100 days. Meanwhile the
average engaged learner solves **18.9 exercises in total**, across 4.7 hubs. So
the ladder spoke once, on day one, and then went quiet for the entire rest of
that person's time on the site.

Both are now partly addressed. Rungs were added at 5, 10, 25 and 50, and the
sidebar learned to show section milestones and what the hub leads to. What
follows is the rest.

## The shape of the problem

Everything that means something is currently invisible at the moment it would
matter:

| thing | where it lives | where a learner sees it |
|---|---|---|
| solve and streak ladder | `user_badges` | the public profile at `/u/<handle>`, nowhere else |
| hub badge | `badges_earned` | dashboard, and a celebration on the last solve |
| track certificate | `certificates` | `/certifications.html` and the dashboard |
| what is next | nowhere | a one-line nudge in the attempt response |

The ladder is the worst case: it is stored, it is tested, it renders, and the
only page that draws it is the one a learner has to already care enough to
visit. The dashboard, which is the page they land on, does not show it at all.

## The proposal

### One currency, named once, shown in three places

A milestone is any rung: a solve count, a streak, a cleared section, a hub
badge, a track certificate. They differ in weight, not in kind, and a learner
should meet them in one consistent shape.

**Names stay literal.** "10 solves", "7-day streak", "dplyr complete". The set
that exists is already literal and the character sits in the blurb: "a habit
rather than a try", "showed up and did the work". Inventing nicknames for four
new rungs would make the eleven old ones look unfinished, and a nickname that
has to be explained is worse than a number that does not. If a naming scheme is
wanted later it should cover the whole ladder at once, as its own decision.

The three places:

**1. The dashboard gets a Milestones section.** This is the gap that matters
most. `www/dashboard.js` already has `renderBadges()` and a `#dh-badges-sec`
block, but it draws `badges_earned` only, so the solve and streak ladder never
appears. The section shows the last two or three earned, then the next one with
its distance, as a row rather than a wall of coins. It is hidden today when
empty, which for most accounts means always; with rungs at 5 and 10 it starts
appearing in the first session.

**2. The celebration modal names the next one.** The studio already has a
celebration card for the hub badge (`celebrate()` in `practice-studio.js`). It
stops at congratulation. Every celebration should end by naming the next rung
and its distance, because the moment just after a win is the only moment
someone is certain to be reading. This is the single highest-leverage change in
the document and the cheapest: the attempt response already carries
`nudge`, and `milestoneNudge` now speaks from solve 1 rather than solve 75.

**3. The studio status bar carries it quietly.** The bar already shows solved,
XP and the meter. One more clause, "4 to the 10-solves badge", costs nothing
and is in view during the work rather than after it.

### What a celebration should say

Three lines, in this order, and no more:

```
  10 solves
  a habit rather than a try
  next: 15 more to the 25-solves badge
```

The thing earned, why it is worth having, and where the next one is. No
confetti, no share prompt on a small rung. The share prompt belongs on the hub
badge and the certificate, which have public URLs worth sharing; offering it on
"5 solves" teaches people that the prompt means nothing.

### What must stay honest

Carried from the certificate work of 2026-09-19, and not negotiable:

- A badge is earned or it is not. No progress bar that reads as a promise.
- Nothing says verified unless a server can check it.
- Signed out, no milestone is being recorded, and the panel must say so rather
  than imply a tally is running.
- The hub badge does not imply a certificate. The certificate needs 80 per cent
  of a track, and a track is ten to twelve hubs.

## The roadmap gap

This is the larger piece and it is not a sidebar change.

### What is wrong

A learner on `/roadmap/data-analyst.html` is told the path ends in the
Tidyverse Practitioner certificate. The page then offers lessons and tutorials
and never once shows them an exercise. The exercises are what actually earn the
certificate: eligibility is computed from `exercise_attempts` against the hub
list in `functions/_data/tracks.json`, and nothing else counts. So the page
names a destination and hides the only road to it.

### What is already true and unused

The data is sound. Every one of the 61 hubs the six tracks claim exists on
disk, and every claimed exercise count matches the real one:

```
r-fundamentals          12/12 hubs   234 claimed, 234 real
tidyverse-practitioner  12/12 hubs   367 claimed, 367 real
data-visualization      10/10 hubs   236 claimed, 236 real
statistics-for-ds        9/9  hubs   219 claimed, 219 real
machine-learning        10/10 hubs   231 claimed, 231 real
advanced-r               8/8  hubs   156 claimed, 156 real
```

So this is a wiring job, not a data job.

### The plan

**Step 1. Decide the relationship between a roadmap and a track.** They are
different objects today and nobody has said how they relate. A roadmap is a
reading path; a certification track is a set of exercise hubs. "Data Analyst"
and "Tidyverse Practitioner" overlap in spirit and nowhere in data. Until
somebody decides whether a roadmap *contains* a track, *ends in* one, or merely
*mentions* one, every downstream link is a guess. This is a product decision
and it blocks the rest.

**Step 2. Put the hubs on the roadmap.** Once the relationship is settled, the
roadmap shows the track's hubs as a section of the path, with per-hub progress
for a signed-in learner, drawn from the same `/api/me/tracks` the dashboard
already calls. A roadmap that ends in a certificate should show the work that
earns it.

**Step 3. Fix the track cards.** Each card on `/certifications.html` links to
one hub out of ten or twelve. It should list them, with counts, so the size of
the commitment is visible before someone starts rather than discovered at hub
four.

**Step 4. Put the track on the hub.** Done for the twelve studio pilot hubs as
of today, in the sidebar. The other 136 hubs have no studio, so they need the
same fact somewhere in the classic layout, probably near the certificate hero
that already sits at the bottom of every hub page.

**Step 5. Close the loop on the dashboard.** The dashboard already computes the
nearest track. Once the roadmap and the hubs agree on the track, it can say
which hub to open next rather than only how many exercises remain.

### What to build first

Step 3 is the cheapest and does not depend on step 1: listing a track's real
hubs on its own card is correct under any definition of the roadmap
relationship. Step 1 should be answered before steps 2 and 5, because both
encode the answer.

## Open questions for the owner

1. **Roadmap and track: which is it?** Does the Data Analyst roadmap contain
   the Tidyverse Practitioner track, end in it, or just mention it? Everything
   in the roadmap section waits on this.
2. **Should small rungs be public?** The solve ladder writes to `user_badges`,
   which has no public id, so "10 solves" is private while "dplyr complete" has
   a URL. That seems right, but it is worth confirming rather than inheriting.
3. **Naming.** The recommendation is literal names and characterful blurbs,
   matching what exists. If nicknames are wanted, they should be decided for
   all fifteen rungs at once.
