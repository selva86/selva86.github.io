# Plan: R6 Classes in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | R6 Classes in R: When You Need Objects That Mutate In Place |
| slug | R6-Classes-in-R |
| description | Unlike S3 and S4, R6 objects are modified in place — no copies. Learn to build R6 classes with public/private fields, active bindings, and initialise/finalize methods. |
| keywords | R6 classes in R, R6 reference semantics, R6 public private fields, R6 active bindings, R6 inheritance, mutable objects R, R6Class tutorial, R OOP R6 |
| auto_link_terms | R6 classes\|R6 class\|R6Class()\|R6 objects\|reference semantics in R\|mutable objects in R\|R6 active bindings\|R6 inheritance |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-12 |
| curriculum_id | 4.3.6 |
| post_type | C |
| sidebar_section | Advanced R |
| sidebar_title | R6 Classes |
| sidebar_order | 14 |

## B. Breadcrumb

Home > Learn R > Object-Oriented Programming in R > R6 Classes in R: When You Need Objects That Mutate In Place

## C. Full Section Outline

### Lead paragraph
R6 classes give you mutable objects in R — when you modify an R6 object, the change happens in place instead of creating a copy. This makes R6 the right choice when you need shared state, resource management, or objects that talk to external systems like databases and APIs.

### H2 1: What makes R6 different from S3 and S4?
**Opening prose (~70 words):** S3 and S4 follow R's copy-on-modify rule — assign an object to a new variable, change one, and the other stays untouched. R6 breaks that rule deliberately. Both variables point to the same object, so a change through one is visible through the other. This is called reference semantics, and it's exactly what you want when an object wraps a real-world resource.

**Code block 1 (PAYOFF BLOCK):** Create a simple R6 counter, show that modifying through one variable is visible through another. Output demonstrates reference semantics immediately.

**Theory:** Explain copy semantics vs reference semantics with the "sticky note" analogy — S3 photocopies the document, R6 puts a second sticky note on the same document.

**Code block 2:** Side-by-side comparison — S3 list copy behavior vs R6 object sharing.

**Callout:** [KEY INSIGHT] Reference semantics means R6 objects behave like Python/Java objects.

**Inline exercise:** Create an R6 "Scoreboard" that increments a score, verify reference sharing.

### H2 2: How do you create an R6 class?
**Theory:** R6Class() function — classname, public list of fields and methods, self$ access pattern.

**Code block 3:** Build a Person class with name/age fields + greet() method. Show instantiation with $new() and method calls.

**Code block 4:** Add an introduce() method that uses self$name and self$age, demonstrate method calling another method.

**Callout:** [TIP] Always define an initialize() method — it's R6's constructor.

**Inline exercise:** Create a Rectangle class with width/height fields and an area() method.

### H2 3: How do public and private fields work in R6?
**Theory:** Encapsulation — hiding internal state so external code can't break invariants. public vs private lists, self$ vs private$ access.

**Code block 5:** BankAccount class with private balance, public deposit()/withdraw()/get_balance() methods.

**Code block 6:** Show that accessing private$balance from outside fails.

**Callout:** [WARNING] Private fields are accessed with private$, not self$. Using self$ for a private field silently creates a new public field.

**Diagram:** R6-Classes-in-R-class-anatomy.webp (Figure 1) — placed here after the code blocks.

**Inline exercise:** Add a private transaction_log list to BankAccount that records each deposit/withdrawal.

### H2 4: What are active bindings and when should you use them?
**Theory:** Active bindings look like fields but run a function behind the scenes — perfect for validation, computed properties, and read-only fields.

**Code block 7:** Temperature class with active binding that converts Celsius to Fahrenheit dynamically.

**Code block 8:** Validation example — active binding that rejects negative age values.

**Callout:** [KEY INSIGHT] Active bindings let you add validation without changing how users access the field — obj$age = 25 still works, but now it's validated.

**Inline exercise:** Create a Circle class where setting radius automatically updates a read-only area active binding.

### H2 5: How does inheritance work with R6 classes?
**Theory:** inherit argument, super$ for calling parent methods, method overriding.

**Code block 9:** Animal parent class with speak() → Dog child class that overrides speak() and calls super$initialize().

**Code block 10:** Multi-level inheritance — Animal → Dog → GuideDog with additional fields.

**Diagram:** R6-Classes-in-R-inheritance-flow.webp (Figure 2) — placed here.

**Callout:** [TIP] Always call super$initialize() in child constructors to ensure parent fields get set.

**Inline exercise:** Create a Vehicle → ElectricCar hierarchy where ElectricCar adds a battery_level field.

### H2 6: How do you clone R6 objects correctly?
**Theory:** Since R6 uses reference semantics, simple assignment doesn't copy. $clone() for shallow copy, $clone(deep=TRUE) for deep copy. Explain when each matters.

**Code block 11:** Shallow clone — show that nested R6 objects inside are still shared.

**Code block 12:** Deep clone — show that nested objects are truly independent.

**Diagram:** R6-Classes-in-R-copy-vs-reference.webp (Figure 3) — placed here.

**Callout:** [WARNING] Shallow cloning an R6 object that contains other R6 objects shares those inner objects — changes to the inner object appear in both copies.

**Inline exercise:** Clone a Team object containing Player R6 objects, verify deep clone independence.

### H2 7: What are finalizers and why do they matter?
**Theory:** Finalizers run when an object is garbage collected — essential for closing connections, releasing file handles, cleaning up temp files.

**Code block 13:** FileLogger class with initialize() that opens a connection and finalize() that closes it. Show the finalizer message on gc().

**Callout:** [NOTE] Finalizers run on garbage collection, not immediately on rm(). Call gc() in examples to trigger them predictably.

**Inline exercise:** Create a TempFile class that creates a temp file in initialize and deletes it in finalize.

### Practice Exercises (2-3 capstone)

**Exercise 1 (Medium):** Build a Stack class with push(), pop(), peek(), is_empty(), and a size active binding. Use private storage.

**Exercise 2 (Hard):** Build a LinkedList using nested R6 Node objects. Implement append(), print_all(), and length(). Must use deep cloning for a copy() method.

**Exercise 3 (Hard):** Build a Logger class with levels (INFO, WARN, ERROR), a private log history, a print_logs() method, and a finalize method that writes remaining logs. Create a child VerboseLogger that overrides log behavior.

### Complete Example
Build a TaskManager class end-to-end:
- Private task list (R6 Task objects with title, status, created_at)
- Public add_task(), complete_task(), list_tasks() methods
- Active binding for pending_count
- Finalize that prints summary
- Inherit from TaskManager to create PriorityTaskManager with priority levels

### Summary
Table of key concepts: R6Class(), self$, private$, active bindings, inherit, super$, clone(), finalize.

### References
1. Wickham, H. — *Advanced R*, 2nd Ed., Chapter 14: R6. [Link](https://adv-r.hadley.nz/r6.html)
2. Chang, W. — R6: Encapsulated Classes with Reference Semantics. [Link](https://r6.r-lib.org/)
3. R6 Introduction vignette. [Link](https://r6.r-lib.org/articles/Introduction.html)
4. CRAN R6 package documentation. [Link](https://cran.r-project.org/web/packages/R6/)
5. Wickham, H. — *Advanced R*, 2nd Ed., Chapter 13: S4. [Link](https://adv-r.hadley.nz/s4.html)
6. R Core Team — *R Language Definition*, Section 5: Object-Oriented Programming. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Object_002doriented-programming)
7. Appsilon — OOP in R with R6: The Complete Guide. [Link](https://www.appsilon.com/post/oop-in-r-with-r6)

### Continue Learning
1. R6 Advanced — deep_clone(), portable classes, cross-package inheritance (R6-Advanced.html)
2. OOP in R: S3, S4, R5, R6 — comparison of all four systems (OOP-in-R.html)
3. OOP Design Patterns in R — factory, strategy, observer implemented in R6 (OOP-Design-Patterns-in-R.html)

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | R6-Classes-in-R-class-anatomy.webp | Figure 1 | Anatomy of an R6 class — public, private, and active sections. | How do public and private fields work in R6? |
| 2 | R6-Classes-in-R-inheritance-flow.webp | Figure 2 | R6 inheritance chain — child classes extend parents via super$. | How does inheritance work with R6 classes? |
| 3 | R6-Classes-in-R-copy-vs-reference.webp | Figure 3 | Copy semantics vs reference semantics — S3 copies, R6 shares. | How do you clone R6 objects correctly? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | R6 counter + reference semantics payoff | R6 | Counter, c1, c2 | — |
| 2 | S3 copy vs R6 reference side-by-side | — | s3_list, s3_copy | Counter, c1, c2 |
| 3 | Person class with fields + greet() | — | Person, p1 | — |
| 4 | Method calling another method | — | — | Person |
| 5 | BankAccount with private balance | — | BankAccount, acct | — |
| 6 | Private field access fails from outside | — | — | acct |
| 7 | Temperature active binding (C→F) | — | Temperature, temp | — |
| 8 | Validation via active binding | — | Validated, v | — |
| 9 | Animal → Dog inheritance | — | Animal, Dog, rex | — |
| 10 | Multi-level: Animal → Dog → GuideDog | — | GuideDog, buddy | Animal, Dog |
| 11 | Shallow clone — nested sharing | — | Team, Player, t1, t2 | — |
| 12 | Deep clone — independent copy | — | t3 | Team, t1 |
| 13 | FileLogger with finalize | — | FileLogger, logger | — |
