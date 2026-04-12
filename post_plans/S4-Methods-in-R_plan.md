# Plan: S4 Multiple Dispatch in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | S4 Multiple Dispatch in R: Dispatch on Two Arguments Simultaneously |
| slug | S4-Methods-in-R |
| description | S4's multiple dispatch lets methods specialise on the combination of two argument types — a capability S3 lacks. Learn setMethod(), showMethods(), and real use cases. |
| keywords | S4 multiple dispatch R, setMethod R, S4 methods R, multiple dispatch two arguments R, setGeneric R, showMethods R, S4 method signature, S4 dispatch resolution, S4 vs S3 dispatch |
| auto_link_terms | S4 multiple dispatch\|S4 methods\|setMethod()\|setGeneric()\|showMethods()\|multiple dispatch in R\|S4 method dispatch\|method signature |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-12 |
| curriculum_id | 4.3.5 |
| post_type | C |
| sidebar_section | Learn R |
| sidebar_title | S4 Methods & Dispatch |
| sidebar_order | (already in sidebar) |

## B. Breadcrumb

Home > Learn R > OOP in R > S4 Multiple Dispatch in R

## C. Full Section Outline

### Lead Paragraph

<p class="lead">S4's multiple dispatch lets a single generic function choose different methods based on the classes of two or more arguments at once — something S3 cannot do. This is R's most powerful method-selection mechanism, used throughout Bioconductor and the Matrix package.</p>

### H2 1: How does S4 multiple dispatch differ from S3's single dispatch?

**Opening prose (~70 words):** S3 dispatches on the class of the first argument only. If you call `combine(x, y)`, S3 looks at `class(x)` and ignores `y` entirely. S4 flips this limitation — it examines the classes of both arguments together and picks the method that matches the combination. Let's see the difference in action.

**Code blocks:**
- Block 1 (PAYOFF): Define two S4 classes (Metric, Imperial), a generic `convert()` with signature c("from", "to"), two methods for (Metric, Imperial) and (Imperial, Metric), call both — shows different output depending on argument combination. Output shows the conversion result.

**Callout:** [KEY INSIGHT] about how S3 would pick the same method regardless of second arg.

**Inline exercise:** Create a third method for (Metric, Metric) that returns "Already metric!" and test it.

**Diagram:** Figure 2 placed after the first code block.

---

### H2 2: How do you define a generic that dispatches on two arguments?

**Theory:** `setGeneric()` with the `signature` parameter. Explain that `signature` controls which arguments participate in dispatch. Default is all args except `...`.

**Code blocks:**
- Block 2: `setGeneric("interact", function(x, y, verbose = FALSE) standardGeneric("interact"), signature = c("x", "y"))` — show that verbose is NOT part of dispatch.
- Block 3: Demonstrate what happens when you omit `signature` (default behavior dispatches on all formal args except `...`).

**Callout:** [TIP] Keep signatures minimal — dispatch on 2 args max. More creates combinatorial explosion.

**Inline exercise:** Define a generic `merge_data()` that dispatches on `source` and `target` but NOT on `method`.

---

### H2 3: How do you write methods for specific argument combinations?

**Theory:** `setMethod()` with a named character vector for the signature. Cover: exact two-class combo, using "ANY" for one slot, using "missing".

**Code blocks:**
- Block 4: Define 4 methods for a 2×2 grid (ClassA × ClassB, ClassA × ClassA, ClassB × ClassA, ClassB × ClassB).
- Block 5: Show method with `ANY` as one argument — acts as a default for that position.
- Block 6: Show method with `missing` — handles when an argument isn't supplied.

**Callout:** [WARNING] Method signatures are order-sensitive — `c("ClassA", "ClassB")` is different from `c("ClassB", "ClassA")`.

**Inline exercise:** Add a method for (ClassA, "missing") that prints a default message.

---

### H2 4: What happens when no exact method matches?

**Theory:** Dispatch resolution algorithm — R walks up the inheritance tree for each argument independently, finds the "closest" matching method. Explain distance = number of inheritance steps.

**Code blocks:**
- Block 7: Define a class hierarchy (Shape > Circle, Shape > Square), a generic `overlap()` with signature c("a", "b"), methods for (Shape, Shape) and (Circle, Circle). Call overlap(circle, square) — shows it picks (Shape, Shape) via inheritance.
- Block 8: Add a method for (Circle, Shape). Call overlap(circle, square) again — shows the more specific method now wins.

**Callout:** [KEY INSIGHT] R picks the method requiring the fewest total inheritance steps across all arguments.

**Diagram:** Figure 1 placed here.

**Inline exercise:** Predict which method `overlap(square, circle)` calls, then verify.

---

### H2 5: How do you inspect and debug S4 dispatch?

**Theory:** Five key functions for understanding what's happening under the hood.

**Code blocks:**
- Block 9: `showMethods("overlap")` — list all methods for a generic.
- Block 10: `selectMethod("overlap", c("Circle", "Square"))` — see exactly which method R would pick.
- Block 11: `existsMethod("overlap", c("Square", "Square"))` and `hasMethod()` — check if a method exists.
- Block 12: `findMethod("overlap", c("Shape", "Shape"))` — locate where the method is defined.

**Callout:** [TIP] Use `selectMethod()` during development — it shows the inherited method R will actually call, not just directly defined methods.

**Inline exercise:** Use showMethods to list all methods for the `convert` generic from section 1.

---

### H2 6: When should you use multiple dispatch in practice?

**Theory:** Three real-world patterns where multi-dispatch shines: (1) arithmetic operators on custom types, (2) combining heterogeneous data structures, (3) Bioconductor's GRanges + DataFrame interactions.

**Code blocks:**
- Block 13: Operator overloading with `+` — define methods for (Money, Money) same currency and (Money, numeric) scaling. Show both dispatching correctly.
- Block 14: Brief Bioconductor-style example — combine() generic dispatching on (GeneList, GeneList) vs (GeneList, character).

**Callout:** [NOTE] Bioconductor uses S4 extensively — if you work in genomics or bioinformatics, S4 multiple dispatch is a must-know.

**Inline exercise:** Add a method for `+` with signature (numeric, Money) to make addition commutative.

---

### H2 7: How does dispatch resolution handle ambiguity?

**Theory:** When two methods are equidistant (same total inheritance steps), R raises a warning. The fix: define an explicit method for the ambiguous combination.

**Code blocks:**
- Block 15: Create ambiguous scenario — two parent classes, a child inheriting from both, two methods at equal distance. Show the warning.
- Block 16: Resolve by adding an explicit method for the ambiguous combination.

**Callout:** [WARNING] Ambiguity warnings are silent bugs waiting to happen. Always resolve them with an explicit method.

**Inline exercise:** Check if the ambiguity is resolved using `selectMethod()`.

---

### Practice Exercises (3 capstone)

**Exercise 1 (Medium):** Build a `format_output()` generic dispatching on (DataType, OutputFormat) where DataType is "Matrix" or "DataFrame" and OutputFormat is "CSV" or "JSON". Write 4 methods returning a descriptive string. Test all 4 combinations.

**Exercise 2 (Hard):** Create a class hierarchy: Vehicle > Car, Vehicle > Truck. Define a `can_tow()` generic dispatching on (vehicle, cargo). Write methods for (Car, ANY) → FALSE, (Truck, ANY) → TRUE, (Truck, "HeavyCargo") → "Need a bigger truck". Verify dispatch resolution.

**Exercise 3 (Hard):** Create an ambiguous dispatch scenario intentionally, observe the warning, then resolve it. Use showMethods() and selectMethod() to verify.

---

### Complete Example

End-to-end measurement unit system:
1. Define classes: Length (meters), Weight (kg), Temperature (celsius)
2. Define `add_measurement()` generic dispatching on (x, y)
3. Methods for same-type addition, cross-type error
4. Method for (Length, numeric) for scalar multiplication
5. Show dispatch debugging with selectMethod()
6. Full pipeline: create objects, add, multiply, inspect dispatch

---

### Summary

Table format:
| Concept | Key Function | Purpose |
| Generic definition | setGeneric() | Create function with signature |
| Method definition | setMethod() | Define behavior for class combo |
| Dispatch scope | signature = c("x", "y") | Control which args dispatch |
| Default methods | "ANY" in signature | Fallback for unmatched classes |
| Missing args | "missing" in signature | Handle absent arguments |
| Inspect methods | showMethods() | List all registered methods |
| Debug dispatch | selectMethod() | See which method would be called |
| Ambiguity | equal-distance methods | Resolve by adding explicit method |

---

### References (8)

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 15: S4. [Link](https://adv-r.hadley.nz/s4.html)
2. R Core Team — *Writing R Extensions*: Methods and Classes. [Link](https://cran.r-project.org/doc/manuals/r-release/R-exts.html#Classes-and-methods)
3. Chambers, J.M. — *How S4 Methods Work* (2006). [Link](https://developer.r-project.org/howMethodsWork.pdf)
4. Leisch, F. — *S4 Classes and Methods*, UseR! 2004 Keynote. [Link](https://www.r-project.org/conferences/useR-2004/Keynotes/Leisch.pdf)
5. Genolini, C. — *A (Not So) Short Introduction to S4 OOP in R*. [Link](https://cran.r-project.org/doc/contrib/Genolini-S4tutorialV0-5en.pdf)
6. Hansen, K.D. — *R S4 Classes and Methods*. [Link](https://kasperdanielhansen.github.io/genbioconductor/html/R_S4.html)
7. R documentation — setMethod() reference. [Link](https://rdrr.io/r/methods/setMethod.html)
8. Jones, M. — *R, Julia, Multiple Dispatch* (2021). [Link](https://www.mpjon.es/2021/05/31/r-julia-multiple-dispatch/)

---

### Continue Learning

1. [S4 Classes in R](S4-Classes-in-R.html) — How to define formal S4 classes with slots, validators, and inheritance.
2. [S3 Method Dispatch in R](S3-Method-Dispatch-in-R.html) — How S3's simpler single-dispatch system works and where it falls short.
3. [OOP in R: S3, S4, and R6](OOP-in-R.html) — A birds-eye comparison of R's three major OOP systems.

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | S4-Methods-in-R-dispatch-flow.webp | Figure 1 | How S4 selects a method based on two argument classes. | What happens when no exact method matches? |
| 2 | S4-Methods-in-R-s3-vs-s4.webp | Figure 2 | S3 dispatches on one argument; S4 dispatches on the combination of two. | How does S4 multiple dispatch differ from S3's single dispatch? |
| 3 | S4-Methods-in-R-summary-mindmap.webp | Figure 3 | Key components of S4 multiple dispatch. | Summary |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Payoff: S4 multi-dispatch convert() with Metric/Imperial | methods | Metric class, Imperial class, convert generic, m1, i1 | — |
| 2 | setGeneric with explicit signature | — | interact generic | — |
| 3 | Default signature behavior | — | — | — |
| 4 | 2×2 method grid for ClassA/ClassB | — | ClassA, ClassB, combine generic | — |
| 5 | ANY as wildcard in signature | — | — | ClassA, ClassB, combine |
| 6 | missing for absent arguments | — | — | ClassA, combine |
| 7 | Inheritance dispatch: Shape > Circle/Square | — | Shape, Circle, Square, overlap generic, c1, s1 | — |
| 8 | More specific method overrides inherited | — | — | Circle, Shape, Square, overlap, c1, s1 |
| 9 | showMethods("overlap") | — | — | overlap |
| 10 | selectMethod("overlap", ...) | — | — | overlap, Circle, Square |
| 11 | existsMethod / hasMethod | — | — | overlap, Square |
| 12 | findMethod | — | — | overlap, Shape |
| 13 | Operator + overloading for Money | — | Money class | — |
| 14 | Bioconductor-style combine | — | GeneList class | — |
| 15 | Ambiguity warning scenario | — | A, B, AB classes, process generic | — |
| 16 | Resolve ambiguity with explicit method | — | — | A, B, AB, process |

**Word count estimate:** ~4500-5500 words
