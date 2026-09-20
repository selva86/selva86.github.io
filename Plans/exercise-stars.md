# Stars on an exercise

Owner's design, 2026-09-20. Three stars for solving unaided, two if you opened
a hint, one if you opened two, none if you read the solution. Fewer stars, less
XP, but never zero XP. A result modal that shows the stars and leads into the
next exercise. Stars are fixed at the first pass: once the solution has been
read there is nothing to re-earn, so reattempts do not upgrade them.

## What is already true

`exercise_attempts.hints_used` is sent on every attempt and stored. So three,
two and one star need no schema change at all.

**Hints do not cost XP on exercises today.** `recordAttempt` sets
`xpAwarded = xpIfFirstPass`, the full `xpForDifficulty(difficulty)`, and never
looks at `hintsUsed`. The minus-half-a-point-per-hint rule that exists on the
site is on the assessment pages, a different system. So stars are not revealing
a hidden price here; they are introducing one. That is worth saying plainly
because it changes who is affected.

`elapsed_ms` is also accepted by the endpoint and then dropped, since there is
no column for it. Not needed here, but it is a free speed dimension whenever
someone wants it.

## The model

Stars are **derived, never stored**. One source of truth, and the rule can
change later without a migration or a backfill.

```
solution opened before the first pass  ->  0 stars
0 hints                                ->  3 stars
1 hint                                 ->  2 stars
2 or more hints                        ->  1 star
```

XP follows the stars, and the top of the scale is unchanged:

| stars | XP |
|---|---|
| 3 | full `xpForDifficulty`, exactly what everyone gets today |
| 2 | 80 per cent |
| 1 | 60 per cent |
| 0 | 40 per cent |

Rounded, floor of 1. Nobody who solves unaided loses anything, so no existing
total is re-based and the tier ladder does not move under anyone. Only the
hint-and-solution path gets cheaper, which is the point.

## Issues, conflicts and gaps

**Backfilled rows would all read as three stars.** `source = 'backfill'` marks
anon-era solves banked at sign-in; they carry `hints_used = 0` because nothing
was tracked. Rendering those as a perfect run is a lie of exactly the kind this
codebase spent 2026-09-19 removing. Backfilled attempts are **unrated**: no
stars, not zero stars, and excluded from any star-based badge.

**"Solution seen" has to mean before the pass.** Opening the solution after
solving, to compare approaches, is good behaviour and must not cost anything.
The flag is read at check time and only the first pass is ever recorded, so
this falls out correctly, but it is the detail most likely to be got wrong.

**A reload must not wash the flag away.** Open the solution, refresh, solve:
without persistence that reads as unaided. The flag is kept per exercise in the
same local state the studio already persists.

**Two modals per exercise is the real risk.** Solve, star modal, next, dot
animation, accept modal, timer. On a fifty-exercise hub that is a hundred modal
interactions, and that is where this kind of feature stops being a delight. One
modal does both jobs: it shows the stars and carries the accept that starts the
next timer. The dot animation runs behind it as it closes.

**The hub badge already has a celebration.** On the last exercise of a hub both
would fire. The star modal yields to it and the hub badge card absorbs the star
line.

**Lesson hubs and static exercises.** Lesson quizzes score differently and the
237 ungraded exercises never write an attempt row. Neither gets stars.

**Signed out, there are no stars**, because there is no attempt row. That is
consistent with the meter already refusing to grade.

## What it unlocks

The badge ladder built this week counts volume only: how many solved, how many
days, how many hubs. Stars give it a **quality axis**, and "three-starred every
exercise in this hub" is a far better thing to have earned than "finished this
hub". Two new rungs fall straight out:

- three-star runs: 10, 50, 100, 250
- a hub three-starred end to end: 1, 3, 10

They are computable from the same derived rule, with backfilled rows excluded.

## Order

1. `solution_seen` column, dev and prod.
2. The endpoint accepts it, prices the XP, returns the stars.
3. The client tracks the solution open and persists it.
4. Stars on the dots and in the sidebar list.
5. The merged modal and the dot animation.
6. The two badge rungs.

Steps 1 to 3 are the foundation and are wrong if rushed. 4 onwards is surface.
