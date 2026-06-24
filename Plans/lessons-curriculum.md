# Lessons Curriculum (course arcs SSOT)

The hand-curated list of interactive courses + their lesson arcs. `/write-lesson` Pass 0 reads a course's arc HERE: which lessons, each lesson's focus + the signature widget(s) it should use, its `curriculum_id`, and access. This complements the roadmap (`www/roadmap-curriculum.js`, RM2): RM2 lists lesson TITLES per track section; this file holds the interactive-COURSE arcs (slug + focus + widget) that RM2 does not. A "complex lesson" can be a 1-lesson course. Widgets are SELECTED from `_build/lesson-visual-catalog.md`; a needed-but-absent widget is hand-built first (never faked).

Format per course:
`## <course_id>  (track, curriculum_id, landing, access)` then a numbered lesson list, each: `<slug> - <focus> - widgets: <ids>`.

---

## random-forest  (track: scientist; curriculum_id 6.3; landing Random-Forest-Course.html; access: free)
1. RF-Course-Lesson-1 - Decision trees from scratch: a tree as a flowchart, Gini splits, growing one in R, watching a deep tree overfit, and why one tree is unstable. widgets: tree-diagram, gini-split, decision-region, forest-averaging
2. RF-Course-Lesson-2 - From one tree to a forest: averaging crushes variance, bootstrap makes trees differ, random features decorrelate them. widgets: forest-averaging, bootstrap-sample, decorrelation, process-flow
3. RF-Course-Lesson-3 - Train, tune and read a forest in R: OOB error, tuning mtry + trees, variable importance, limits. widgets: oob-tuner, bootstrap-sample, importance-bars

## t-test  (track: scientist; curriculum_id 4.2.1; landing T-Test-Course.html; access: free)
1. The-t-test-from-scratch - ONE complex lesson teaching hypothesis testing from scratch via the t-test. Arc within the lesson: (a) the question - is a difference real or noise; (b) the sampling distribution of the mean under H0; (c) the t-statistic as a signal-to-noise ratio (define every symbol in MathJax); (d) the p-value as a tail area under H0 (the signature interactive); (e) one-sample vs two-sample (Welch); (f) effect size + sample size + power, and why a small p is not a big effect; (g) doing it in R with t.test(); (h) misuses (p-hacking, multiple comparisons, assuming normality). widgets: null-distribution (signature: drag the observed t, watch the p-value tail), plus a means/sampling illustration. Outcome: the learner computes and correctly READS a p-value and knows when the test (mis)applies.

## llm-agents  (track: scientist; curriculum_id 6.6.1; landing LLM-Agents-Course.html; access: free)
1. LLM-Agents-in-R - ONE complex lesson on what an LLM agent is, from scratch, grounded in R (ellmer). Arc within the lesson: (a) plain LLM vs an agent that can act; (b) tools - giving the model functions to call; (c) the ReAct loop: Thought -> Action -> Observation, repeating until it can Answer (the signature interactive, stepped through a worked trace); (d) when to stop + guard rails (max steps, validation); (e) building one in R with ellmer (register a tool, run the loop); (f) failure modes (hallucinated tool calls, loops, prompt injection) and how to defend. widgets: agent-loop (signature: step the ReAct trace), process-flow (the build recipe). Outcome: the learner can trace an agent's reasoning loop and wire tools + guard rails responsibly. Never name the in-browser R runtime; say "interactive R".
