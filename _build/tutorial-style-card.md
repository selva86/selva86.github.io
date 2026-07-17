# Tutorial style card (fast calibration)

Read this instead of ingesting the whole exemplar every write. It distills the
rhythm, density and texture of the gold-standard post (`posts/MCMC-in-R.md`); the
RULES you are graded on live in `tutorial-pedagogy.md` (T1-T15). Only open the full
exemplar if you need to see a long-form section resolved end to end.

## Texture, in five short samples

**Lead** (2-3 plain sentences, answers the title, becomes the featured snippet):
> You may have used brms or Stan and accepted that an algorithm called MCMC works
> behind the scenes. This post opens the box. In about 50 lines of base R you'll
> build the same kind of algorithm those packages run, watch it match the textbook
> answer, and end knowing what every Bayesian tool is doing internally.

**Section opener** (H2 is a question; bridges in; states the ONE new idea, then pays
off with code fast):
> ## Why do we need MCMC at all?
> Most R users who run `brms::brm(...)` have no picture of what happens between Run
> and the answer. The shortest path to understanding it is to build it. Here is the
> entire 50-line implementation, on a real example, before any explanation.

**Code block** (5-25 lines, ONE idea, title attribute, inline comments that teach,
REAL `#>` output captured from a run - never invented):
> ```r title="50 lines of MCMC, working on a real problem"
> log_posterior <- function(theta) {
>   if (theta <= 0 || theta >= 1) return(-Inf)              # rate must be in (0,1)
>   dbinom(k, size = n, prob = theta, log = TRUE) +         # how well theta fits data
>     dbeta(theta, 1, 1, log = TRUE)                        # flat prior
> }
> ```

**FAQ entry** (a question a real person types; 2-4 sentence honest answer):
> **Why does my chain get stuck at one value?** Your proposal step is too large, so
> almost every move is rejected. Lower `sigma` until the acceptance rate is roughly
> 0.2-0.4 and the chain moves on most steps.

**Reference line** (5-10 total; each a real resolving URL + one-line why):
> 1. Hastings (1970), *Biometrika* 57(1) - the original Metropolis-Hastings paper.

## The rhythm in one paragraph

Open concrete: a named, numbered running example the whole post threads (9 visitors,
6 clicks; AirPassengers July 1960). First H2's first runnable block delivers the
payoff with visible `#>` output, after just enough prose to predict each line. One
new idea per section, each bridging from the last; every term defined on first use;
formulas in real MathJax when math appears. Roughly one runnable block per ~200
words. Callouts (`> **Note:**` / `> **Watch out:**`) only at a real trap, never
decoration. A figure sits AT the concept it explains, never above the first code
block. Close with FAQ (4-6), a compact Summary table, and References.

## Voice (T12 + T13 + T15)

A patient teacher who anticipates confusion and never hand-waves. Grounded and
literal: say what the code and numbers actually do; no personification or dramatic
metaphor (nothing "shrugs", is a "rubber stamp", "masquerades as noise", or "stops
dead"). Complete first, concise second: when unsure, explain MORE - but prove each
conclusion ONCE, never re-prove it two or three ways, never restate the previous
paragraph, never milk the example past where it still teaches. Redundancy is the
length defect, not depth.
