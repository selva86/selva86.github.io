# type-i-ii-error-visualizer reskin -- Pass 0 parity checklist

Source of parity: the pre-reskin `tools/type-i-ii-error-visualizer.html` (252 KB, 70 "IBM Plex" refs,
old `.shell`/`.ws-*`/IBM-Plex-serif "workshop" design). This is a RESKIN to the Lab-sheet v2 shell.
Every capability below ships in v2 in the same or better form, or is dropped with a stated reason
taught on-page.

## Modes / test families (6) -- ALL preserved
- [x] one-sample t-test        (Cohen's d, n, alpha, tails)
- [x] two-sample t-test        (Cohen's d, n per group, alpha, tails)
- [x] one-proportion z-test    (p0, p1, n, alpha, tails; Cohen's h)
- [x] two-proportion z-test    (p1, p2, n per arm, alpha, tails; Cohen's h)
- [x] one-way ANOVA            (Cohen's f, k groups, n per group, alpha; one-tailed by nature)
- [x] correlation test         (Pearson r, n, alpha, tails; Fisher-z)

## Inputs / controls -- ALL preserved
- [x] Mode selector as pills AND as the inline `<select>` inside the "I want to ..." banner (synced)
- [x] Mode-specific numeric fields (d / f / r / p0 / p1 / p2 / k / n) rendered per mode
- [x] Alpha picker: 0.10 / 0.05 / 0.01 pills + custom alpha number entry
- [x] Tails toggle (two-tailed / one-tailed); hidden for ANOVA (one-tailed by nature)
- [x] Drag-to-explore range sliders under the plot (effect, n, alpha or p0/p1/p2) -- the signature
      "drag effect, n, alpha; watch beta shrink" interaction; synced with the numeric fields

## Scenario presets -- preserved
- [x] Underpowered (twoT d=0.3 n=20 a=.05)
- [x] Conventional (twoT d=0.5 n=30 a=.05)
- [x] Tight test   (twoT d=0.5 n=30 a=.01)
- [x] Balanced     (twoT d=0.5 n=105 a=.05)
- [x] Tiny effect  (twoT d=0.1 n=200 a=.05)
- [x] "Custom" preset -> folded into "no chip active = custom" (a manual edit deselects chips).
      The old Custom chip was a no-op marker button; folding it in is not a feature loss.

## Visualizations -- ALL preserved
- [x] Main density plot: null vs alternative reference distributions, alpha region shaded on the
      null, beta region shaded on the alt, critical line(s), mean markers, axis, curve labels
- [x] 2x2 truth-table mosaic (correct-retain 1-a / Type I a / Type II beta / power) with live
      proportional fill heights + percents
- [x] 3 sparklines: power vs n, power vs effect, power vs alpha, each with the current point marked
      and the 0.8 reference line
- [x] Live viz readout line under the plot

## Outputs / communication -- ALL preserved (+ improved)
- [x] Stats grid: alpha, beta, power, critical value (t* / z* / F* / r*)
- [x] Plain-English verdict box (power adequate vs low; what beta means)
- [x] Live inference line after results (the decisive one-sentence read)
- [x] Live "same thing in R" code emitter per mode (pwr.t.test / pwr.p.test / pwr.2p.test /
      pwr.anova.test / pwr.r.test), copy button
- [x] "How this is computed" collapsible with live df / ncp / crit numbers
- [x] Method mini-explainer per mode (what it models + a worked example) -> below-fold method table
- [x] Recap/summary of every parameter -> folded into the how-computed panel

## Below-fold content -- preserved
- [x] Method comparison table (6 tests: what it models, effect measure, reference distribution)
- [x] FAQ (5 items) -- content kept verbatim, re-rendered as plain <details><summary> in a
      class*="faq" container so the injected chrome CSS styles it
- [x] Go-deeper internal links

## Metadata -- reused verbatim (already passed audit; within 40-60ch contract)
- [x] <title> Type I / II Error Visualizer (kept)
- [x] meta description, canonical, OG/twitter, keywords (kept)
- [x] WebApplication + FAQPage JSON-LD (kept)

## Analytics / trust -- preserved
- [x] tool_use (once/session on first interaction), tool_copy (on R-code copy)
- [x] consent-mode GA block + consent-banner.js + Cloudflare beacon
- [x] Trust line: no data leaves your browser / verified against R's pwr / free

## MATH CORRECTIONS made during reskin (improvements, taught on-page in the method table)
The old page computed math INLINE with an approximate noncentral-t (Cornish-Fisher normal, off by
~1e-2 vs R) and two latent bugs. The reskin routes every displayed number through the exact,
R-`pwr`-verified `tools/lib/power-math.js` (AS 243 exact noncentral t, exact noncentral F,
machine-precision normal), so the displayed power/beta now match the emitted `pwr` R code to 1e-6.
- FIX 1 (twoProp ncp): old inline used ncp = h*sqrt(n); `pwr.2p.test` (the code it emits) uses
  ncp = h*sqrt(n/2). Old displayed power did NOT match its own emitted R. Now corrected.
- FIX 2 (correlation model): old inline used a noncentral-t approximation; `pwr.r.test` (the code it
  emits) uses the Fisher-z transform. Now uses Fisher-z so the displayed power matches pwr.r.test.
- These are correctness fixes, not feature changes. Densities used only to draw the plot curves keep
  a fast numeric form (pixel-only; the shaded areas equal the exact computed beta/power).

## Dropped with reason
- Old IBM-Plex-serif "workshop"/`.shell`/`.ws-*` visual system: replaced wholesale by the
  collision-free Lab-sheet vocabulary (Inter / Inter Tight, green accent). Reason: owner order
  2026-07-14 "re-work it professionally"; the old body was the pre-Lab-sheet design system.
- Dark-mode toggle (old `rstat_dark` localStorage): dropped. The Lab-sheet shell is light-only
  (matches every other v2 tool; `<meta name="color-scheme" content="light">`). Not a stats feature.
