# Dashboard upgrade v2

Written 2026-09-20. Reworked the same day after the first pair was
rejected as unstructured. Status: two mocks, awaiting the owner's pick.

The dashboard shipped as B6 on 2026-08-26 and has not moved since. Three
things have happened to the platform since then and none of them reached it:
the badge ladder went from 16 rungs to 48, exercises started being graded
out of three stars, and the studio learned about all 147 hubs. The dashboard
still describes a learner who only takes lessons.

## What is wrong, observed on a real account

Signed in as the owner, on prod, 2026-09-20:

1. **The second room opens on a ring reading 0%** while the same screen says
   505 XP, 27 exercises solved and 10 of 48 milestones. It is 0.1% of a
   track, so it is not lying. It is the largest object on the page and it
   says you have done nothing. The dashboard contradicts itself in one view.

2. **Five of seven track rows say "not started"**, identical empty bars,
   directly under that ring. The first thing a learner reads is a wall of
   zeros.

3. **Nothing knows about hubs.** 27 solves, and the page cannot name one hub
   the learner was in. This is the single most useful thing a dashboard can
   say: what were you doing, and where do you pick it up.

4. **Nothing knows about stars.** "27 exercises solved" is now the least
   interesting true sentence available. "27 solved, 19 of them unaided" is
   the same fact with the part worth being proud of left in.

5. **The room tabs hide half the value.** Streak, today's set, milestones and
   the next rung never appear together, and the next rung is the one number
   that reliably moves somebody.

6. **Mini courses speak production, not learner**: "7 of 7 lessons ready",
   "In production". That is our build state on their screen.

7. **Order is fixed, not earned.** An empty Certificates card sits above a
   full Milestones card.

## The changes

Numbered so the mocks can point at them.

**C1. A hero that names the next real action.** Computed in this order: an
unfinished section in a hub the learner has touched, then a lesson in
flight, then the closest ladder rung. Always with its reward stated, because
clearing a section pays 25 XP and nothing on the site says so yet.

**C2. Retire the 0% ring.** The credential becomes a row: name, thin bar,
and an honest distance ("Tidyverse Practitioner, 41%. dplyr Exercises is 1
of 12 hubs that count"). A ring earns 132px only above about 10%.

**C3. "Where you were": hub progress.** Every hub touched, done of total,
newest first, the next unsolved problem one click away. Data:
`/api/me/hubs` (shipped 2026-09-20 for the studio rail) joined to
`www/hub-index.json`.

**C4. Stars, in three places.** All time gains the split (solved / unaided /
after a hint / after the solution) and a three-segment bar; each hub row
carries its own tally; a "perfect runs" count names hubs where every solved
problem was three stars. Data: `/api/me/exercises` already returns the star
map per hub; an aggregate belongs on `/api/me/stats`.

**C5. The next rung moves to the top of the Milestones card**, earned gems
below it. It is the only element on the page with a number that goes down.

**C6. Collapse the empty.** Tracks in motion are listed; the rest become one
line, "four more tracks not started", that expands. Cards with nothing in
them do not render at all.

**C7. Learner language in Mini courses.** "7 of 7 lessons ready" becomes "7
lessons". A course "In production" does not appear.

**C8. A year of activity, not a week.** 52 weeks as a strip. The one chart
that makes a long habit visible, and the only one worth the space.

**C9. Certificates, when empty, becomes "Closest certificate"** with the
real distance.

**C10. The hub map.** 147 cells, coloured by progress. Built, looked at,
and cut: it demoed well and told a learner nothing they could act on, which
is the definition of decoration. The catalogue belongs on /exercises/.

## The two architectures

Both carry every change above and describe the same learner, so the decision
is about organisation and nothing else.

### What the first pair got wrong

A2 and B7 (still in `_mocks/`, superseded) put the ten changes on the page as
ten more cards. Counted: **fourteen and twenty card surfaces, eleven and
nineteen headings, seventeen and eighteen separate progress visuals.** Every
box had the same border, radius and shadow, so "Milestones" looked exactly as
important as "Last week" and the reader had to work out the hierarchy for
themselves. That is not a styling problem, it is the absence of an
information architecture: I added features and appended a card for each.

The rework starts from four questions a dashboard has to answer, in order:
what do I do right now, where was I, how am I doing, what have I earned.
Four questions, four regions, and separation done with a rule and with space
rather than with a box. The counts are now **three and two surfaces, ten
progress visuals**, and four cards of the old set are gone entirely: the
catalogue map, the library grid, the mini-course grid and the week bars, all
of which belong on /exercises/, /roadmap/ and the profile.

The biggest single simplification: **one "In flight" list** replaces four
cards. Today's set, where you were, reading in progress and email lessons
closing were four boxes asking the same question. They are one table now,
sorted most urgent first, with a coloured dot for the kind of thing each row
is.

### Ledger (`_mocks/dash-v3-ledger.html`)

One column, 820px. A greeting, one dark action band, then three regions
under hairlines: In flight, Your record, Earned. Two bordered objects on the
whole page, both certificates, because a certificate genuinely is an object.
Typographic and quiet.

Costs: the page is long, and the proud part sits below the fold on a laptop.
Wins: a single reading order, the next action unmissable, identical on a
phone.

### Desk (`_mocks/dash-v3-desk.html`)

Two columns, no tabs. B6's two rooms become two places: a rail that stays put
carries who you are and what you have done, and the work runs beside it. The
rail is one surface with hairline sections, not five cards.

Costs: needs width, and stacks on a phone, so the record falls below the work
there. Wins: nothing is behind a tab, and the streak and the milestone that
reinforces it finally share a view, which is the one pairing the current
dashboard never shows.

## Data work behind the changes

| Change | Endpoint | State |
|---|---|---|
| C3 hub progress | `GET /api/me/hubs` | shipped 2026-09-20 |
| C3 hub names, totals | `www/hub-index.json` | shipped 2026-09-20 |
| C4 star aggregate | `/api/me/stats` | one new field, one query |
| C5 next rung | `/api/me/shelf` | already returns `milestones.next` |
| C8 52-week strip | `/api/me/stats` | needs a per-day aggregate |
| C10 hub map | reuses C3 | cut in the rework, it was decoration |

Nothing here needs a schema change. `exercise_attempts` already carries
`hints_used` and `solution_seen`.

## Not in this pass

- Re-earning stars on a problem where the solution was read. By design you
  cannot, so the shelf of those problems would need a "practice again,
  untracked" mode, which is its own decision.
- A weekly email built from this page. The engine exists; the copy does not.
- The profile page, which should carry the same star split publicly.
