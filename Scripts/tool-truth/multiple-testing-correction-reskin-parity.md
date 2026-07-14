# Reskin parity checklist - multiple-testing-correction

Source of parity: the CURRENT (pre-reskin) `tools/multiple-testing-correction.html`
(235 KB, double-injected, 72 IBM Plex refs). Math is R-verified and UNCHANGED:
`tools/lib/multiple-testing-math.js` (hash b92b00ae), truth
`Scripts/tool-truth/multiple-testing-correction.{R,json}`, harness green
(174/174 adjusted + 522/522 rejection-count, worst |diff| 6.7e-16).

Target shell: `tools/t-test-calculator.html` (Lab sheet). Every capability below
ships in v2 or is dropped with a stated, on-page-taught reason.

## Modes / method registry
- [x] 6 correction methods: Bonferroni, Holm, Hochberg, Hommel, BH, BY -> method pills + method `<select>` in the "I want to..." banner.
- [x] Goal grouping FWER (Bonf/Holm/Hoch/Hommel) vs FDR (BH/BY) -> goal `<select>` in the banner; picking a goal selects its first method; picking a method sets the goal.

## Inputs
- [x] P-value vector textarea (comma/space/newline, 0-1 inclusive) -> `.raw` textarea.
- [x] Family size m override (auto from list; override for partial families; feeds R's n=) -> number input; `currentN()` logic ported verbatim.
- [x] Significance level alpha: 0.001 / 0.01 / 0.05 / 0.10 pills + custom numeric -> `.pill` row + custom number input.

## Scenario presets (5 chips)
- [x] genes (RNA-seq 20 genes, BH), abc (10-arm A/B/C, Holm), pairwise (m=15, Holm), fdr (FDR-controlled discovery, BH), custom -> `.chips` row; same p-vectors, method, story text. Scenario context card (icon/title/story) preserved.

## Results / output
- [x] Primary "rejected / m" count + method label.
- [x] Aux: naive (uncorrected) + all 6 method counts side by side -> stats grid + aux line.
- [x] Recap "How we got there" per-method step rows (threshold / rule / cutoff / c(m)) -> `details.how` steps, dynamic per method.
- [x] Verdict headline + plain-English box.
- [x] Live inference line (the 3rd required UX feature).
- [x] Copyable report line + copy button (tool_copy).

## Per-test adjusted-p comparison table
- [x] Each raw p (sorted asc, rank #) -> adjusted p under all 6 methods; survivors tinted green; active method column highlighted; foot note; 300-row cap message. -> below-fold `.sect` table, ported.

## R code emitter
- [x] p.adjust(active method) + n override + sapply comparison across all 6 -> static "same thing in R" `.rcode` block with copy.
- [ ] DROPPED with reason: the in-browser Run button (WebR). v2 convention (t-test, bayes, roc, all reskins) ships a STATIC copyable R block, not a live runtime. Taught on-page via the trust line ("Verified against R's p.adjust()") and the "same thing in R" heading. No math capability lost - the displayed numbers already ARE the p.adjust result.

## Interactive viz
- [x] SVG scatter: sorted p-values vs per-rank threshold curve for the active method (Bonferroni flat, Holm/Hochberg step, BH/BY slope; Hommel = no single line, closed test, stated). alpha reference line. Dots tinted by rejection. Caption + readout. -> `.viz` inside results card.
- [x] Live alpha slider (what-if) -> range slider under the viz, syncs main alpha.

## Explainer / anatomy
- [x] "New to multiple comparisons?" 4-min primer (what it is / how to read / recipe / picking) -> below-fold explainer section "The multiple testing problem".
- [x] "Anatomy of multiple-testing correction" (formula + description x6) -> below-fold method table / cards.
- [x] "When this is the wrong tool" caveats (6 alt rows) -> below-fold caveats table.

## Further reading / FAQ / trust
- [x] Further reading links -> `.rel` go-deeper.
- [x] FAQ 3 Q&As (verbatim) -> `.faq` details; FAQPage JSON-LD kept verbatim.
- [x] Numerical-accuracy note (matches p.adjust to machine precision, 29 vectors) -> trust line + method table footnote.
- [x] tool_use (first input) + tool_copy (copies) GA; consent-mode GA + CF beacon.
- [ ] DROPPED with reason: the "inputs needed" list (p / alpha / m / c(m)) restated the visible form fields; folded into the actual inputs (self-evident). No capability lost.

## Metadata (reused verbatim)
- [x] title 51ch (40-60 contract ok), meta description, canonical, OG/Twitter.
- [x] WebApplication + BreadcrumbList + FAQPage JSON-LD blocks verbatim.
