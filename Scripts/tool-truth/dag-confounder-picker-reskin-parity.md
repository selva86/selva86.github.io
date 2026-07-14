# dag-confounder-picker RESKIN parity checklist (Pass 0)

Source of truth = the CURRENT `tools/dag-confounder-picker.html` in the worktree (228KB, IBM-Plex/lean-navy body, injected chrome + footer already current). Math is v2, R-verified vs `dagitty::adjustmentSets()` (12/12 minimal + all sets). This is a BODY reskin only: swap the 64KB old-CSS design system for the Lab-sheet shell. Zero feature loss.

## Modes / starting DAGs (goal-select + 6 scenario cards)  -> KEEP
- [ ] confounder  (classic confounder: Z->X, Z->Y, X->Y ; answer {Z})
- [ ] collider    (X->M, Y->M ; answer {} )
- [ ] iv          (instrumental variable: Z->X, X->Y ; answer {} )
- [ ] mediator    (X->M, M->Y ; answer {} )
- [ ] mbias       (Z1->X, Z1->M, Z2->Y, Z2->M ; answer {} )
- [ ] custom      (build your own: seed X,Y no edges)

## Scenario chips band  -> KEEP
- [ ] `.scenarios-band` prompt + 6 `.scenario-card` (icon SVG + name + sub) with active state
- [ ] `.scenario-context` (sc-icon / sc-title / sc-story) updates per scenario
- [ ] clear-scenario button (-> custom)

## Input formats (DAG editor)  -> KEEP
- [ ] Edges textarea: multi-line, `Z -> X` or `;`-separated; parser accepts `->` and `<-` (parseEdgesText)
- [ ] Add edge: from-select -> to-select + Add button (dedupe, no self-loops)
- [ ] Add node: text input + Add + Enter key (name validation, dup guard, toast errors)
- [ ] Exposure (X) select
- [ ] Outcome (Y) select

## Interactivity  -> KEEP
- [ ] Live recompute on every edit / toggle / scenario load
- [ ] Drag nodes in SVG to rearrange (mousedown/mousemove/mouseup, clamped)
- [ ] Toast messages for input errors

## Outputs  -> KEEP
- [ ] Result display: label + set bounds `{ }` + adjustment chips + aux line
      (back-door paths, causal paths, valid sets, alternative minimal sets, IV candidates)
- [ ] `identifiable=false` -> "Not identifiable by adjustment" render (the fixed bug)
- [ ] Recap-mini "How we got there": NODES, EDGES, X/Y, BACK-DOOR, CAUSAL, COLLIDERS (do-not-condition), DESC(X) forbidden
- [ ] DAG warnings: collider warning, descendants-of-X warning, no-causal-path warning, error callout
- [ ] Interactive SVG viz: nodes colored by role (X, Y, adjustment filled, collider tint), arrowhead edges, draggable, aria
- [ ] viz-readout plain-English "Read:" line (incl. IV hint)
- [ ] R code emitter (dagitty): dag{}, adjustmentSets minimal + all, impliedConditionalIndependencies, suggested lm(); copy button
- [ ] Inference banner (live, post-adjustment verdict; the second fixed bug)

## Explainers / anatomy  -> KEEP
- [ ] Tool lead under H1 (UX feature 1)
- [ ] Primer dropdown "4-min primer" (4 paras: what a DAG is / confounder vs collider / back-door criterion / picking the set)
- [ ] "I want to work through <select> and find what to adjust for" banner (UX feature 2 - goal-select is the mode selector)
- [ ] tool-meta line
- [ ] ws-method "How DAG-based adjustment works" (Use when / Inputs needed / What it returns)
- [ ] Anatomy details "Anatomy of the back-door criterion" (4 formula+body steps)
- [ ] Caveats details "When this is the wrong tool" (alt-list, 5 rows)
- [ ] FAQ (3 items; must stay in sync with FAQPage JSON-LD) - render as plain details in class*="faq" (chrome styles it)
- [ ] Further reading (4 links) + algorithm/accuracy note
- [ ] Inference line after results (UX feature 3 - inference-banner)

## Meta / trust / analytics  -> KEEP VERBATIM
- [ ] Title "Free DAG Confounder Picker: Adjustment Sets in R" (48ch, in 40-60 contract)
- [ ] meta description + canonical + OG/Twitter
- [ ] JSON-LD: WebApplication + BreadcrumbList + FAQPage (3 blocks)
- [ ] Trust line: 3 claims (no data leaves browser / verified vs dagitty::adjustmentSets() / free no sign-up)
- [ ] GA tool_use (first interaction) + tool_copy (R code copy); consent-mode GA + consent-banner.js + CF beacon (all injected/kept)
- [ ] lib script tag pinned `/tools/lib/dag-math.js?v=<hash>`

## Reskin design gate (NEW, on the built page)
- [ ] injected `.tool-chrome` style block present
- [ ] IBM Plex references <= 10 (all in injected footer/chrome)
- [ ] page < 200KB
- [ ] exactly 1 `data-tool-chrome="injected"`
- [ ] no JetBrains Mono, no em dashes, no eyebrow kicker, Inter labels + system mono code
- [ ] page_audit.mjs zero findings for this slug
