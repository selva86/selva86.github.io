---
title: "State Space Models and the Kalman Filter Lesson 7: Choosing between a rolling window and a state space filter"
catalog_blurb: "See a coefficient that changed mid-series recovered by a rolling window and a filter."
description: "See why one fixed regression slope is wrong when the true relationship changes mid-series, then track it with a rolling window and a state-space filter."
keywords: "time-varying parameters, rolling window regression, state space filter, Kalman filter, regression coefficient drift, structural change, RMSE, confidence interval, predict-update recursion, rolling regression"
post_type: "LESSON"
curriculum_id: "5.80.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "7"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: ""
course_prev: "Dynamic-Linear-Models-with-dlm.html"
---

=== step === cover
## Choosing between a rolling window and a state space filter

Today let's understand time-varying parameters clearly, using a subscription business's weekly discount offer and new signups as the running example throughout.

Say you run a subscription business. Every week you set a discount for that week, somewhere between \$2 and \$20, and every week you count how many new people sign up; the code below calls that weekly count `subscribers`. Here are those weekly signup counts for the first 24 weeks.

```r
# Simulate 24 weeks of a subscription business's discount offer and new signups
week <- 1:24

set.seed(40)
discount <- round(runif(24, 2, 20), 1)

beta_true <- rep(c(3, 6), each = 12)
alpha_true <- 20

set.seed(41)
noise <- rnorm(24, 0, 4)

subscribers <- round(alpha_true + beta_true * discount + noise)
subscribers
#>  [1]  60  74  67  37  40  53  39  51  50  42  26  62  45  56 136 119  77 141  43
#> [20] 104  79  73  39  94
```

Here is that same count, plotted week by week.

::widget chart-plotter {"data":[{"x":1,"y":60},{"x":2,"y":74},{"x":3,"y":67},{"x":4,"y":37},{"x":5,"y":40},{"x":6,"y":53},{"x":7,"y":39},{"x":8,"y":51},{"x":9,"y":50},{"x":10,"y":42},{"x":11,"y":26},{"x":12,"y":62},{"x":13,"y":45},{"x":14,"y":56},{"x":15,"y":136},{"x":16,"y":119},{"x":17,"y":77},{"x":18,"y":141},{"x":19,"y":43},{"x":20,"y":104},{"x":21,"y":79},{"x":22,"y":73},{"x":23,"y":39},{"x":24,"y":94}],"geoms":["line"],"x":"week","y":"new signups"}

The count moves around a lot from week to week, from as low as 26 up to 141, with no obvious steady climb. Somewhere in there is a real relationship between the discount you offer and how many people sign up, but is that relationship the same one number every week, or does it change? That is the question this lesson answers.

=== step === concept
## Why a fixed coefficient can be the wrong assumption

Because this week's discount and signups are simulated rather than pulled from a live store, you get to know the true relationship behind them, something you would never know with real data.

Twenty people a week sign up organically, even at zero discount. But the signups-per-discount-dollar effect is not fixed. For the first 12 weeks, each extra dollar of discount buys 3 extra signups. Then the business simplifies its checkout flow, and from week 13 on, each extra dollar buys 6 extra signups instead, twice as much as before.

An ordinary regression cannot see any of that. It only ever returns one slope, fit across all 24 weeks at once.

```r
# Fit one OLS regression across all 24 weeks, and check it against two individual weeks
df <- data.frame(week = week, discount = discount, subscribers = subscribers)

ols_fit <- lm(subscribers ~ discount, data = df)
round(coef(ols_fit), 2)
#> (Intercept)    discount 
#>       18.46        4.84 

fitted_week3  <- unname(predict(ols_fit, newdata = data.frame(discount = discount[3])))
fitted_week18 <- unname(predict(ols_fit, newdata = data.frame(discount = discount[18])))

round(c(week3_discount = discount[3], week3_fitted = fitted_week3,
        week18_discount = discount[18], week18_fitted = fitted_week18), 1)
#>  week3_discount    week3_fitted week18_discount   week18_fitted 
#>            14.4            88.2            19.6           113.4 
```

The fitted slope, 4.84, is a compromise between the early weeks' effect of 3 and the later weeks' effect of 6, because one straight line has no way to be both at once. Look at what that compromise costs on real weeks. Week 3's discount is \$14.4, and the true effect there is still 3, so the true average signup count is \(20 + 3 \times 14.4 = 63.2\). The OLS line fits 88.2 instead, a big overshoot. Week 18's discount is \$19.6, and the true effect there is already 6, so the true average is \(20 + 6 \times 19.6 = 137.6\). The OLS line fits only 113.4, a big undershoot in the other direction. One fixed slope cannot be right on both sides of a change it never sees.

=== step === concept
## The rolling-window regression, and the lag it leaves

One way to fix a coefficient that will not sit still is to stop asking it to. Instead of fitting one regression to all 24 weeks, fit a fresh regression to only the most recent handful of weeks, and refit it every week as new data comes in. That is a rolling-window regression, and the handful of weeks it looks back over is called its width.

Try a width of 8. At every week from week 8 onward, fit `lm(subscribers ~ discount)` on just the last 8 weeks and keep that regression's own slope, then plot the whole path against the true effect.

```r
# Compute the width-8 rolling slope for every week from week 8 onward
library(ggplot2)

width <- 8
roll8_beta <- rep(NA_real_, 24)
for (t in width:24) {
  idx <- (t - width + 1):t
  fit <- lm(subscribers ~ discount, data = df[idx, ])
  roll8_beta[t] <- coef(fit)[2]
}
round(roll8_beta, 2)
#>  [1]   NA   NA   NA   NA   NA   NA   NA 2.65 2.70 2.39 2.34 2.47 2.09 1.91 4.70
#> [16] 5.61 5.53 5.93 5.51 6.01 6.13 5.92 6.24 6.29

path_df <- data.frame(week = week, true_beta = beta_true, roll8_beta = roll8_beta)

ggplot(path_df, aes(x = week)) +
  geom_line(aes(y = true_beta), color = "gray50", linetype = "dashed", linewidth = 1) +
  geom_line(aes(y = roll8_beta), color = "steelblue", linewidth = 1) +
  labs(x = "week", y = "slope (signups per discount dollar)",
       title = "Width-8 rolling slope (blue) against the true effect (dashed)")
```

The first window, weeks 1 to 8, sits entirely inside the first 12 weeks, so its slope comes out at 2.65, close to the true 3. That holds up fairly well through week 12, at 2.47. But the true effect actually changed at week 13, from 3 to 6. The width-8 window covering week 13 still holds weeks 6 through 13, seven of which come from before the change, so instead of jumping toward 6 the slope only reaches 2.09. It gets worse before it gets better: the week-14 window still holds six pre-change weeks, and the slope falls further still, to 1.91, its lowest point, even though the true effect has already been 6 for two weeks. Only once enough new weeks accumulate inside the window does the slope catch up: 4.70 by week 15, and from week 17 on it settles between 5.5 and 6.3, close to the true 6.

Measured against the true effect for weeks 9 through 24, root mean squared error, RMSE, the typical size of the gap between the estimated path and the true one, comes out to 1.49 for this width-8 path.

=== step === widget
## How much should the window see at once?

Width 8 was one choice. Fit two more rolling windows on the same 24 weeks, one narrower at width 4 and one wider at width 14, and for each one keep not just the slope but how wide its own 95% confidence interval is, using R's `confint()` function.

```r
# Compare a narrower width-4 window and a wider width-14 window on the same 24 weeks
run_roll <- function(width) {
  slope <- rep(NA_real_, 24)
  halfwidth <- rep(NA_real_, 24)
  for (t in width:24) {
    idx <- (t - width + 1):t
    fit <- lm(subscribers ~ discount, data = df[idx, ])
    slope[t] <- coef(fit)[2]
    ci <- confint(fit, "discount", level = 0.95)
    halfwidth[t] <- (ci[2] - ci[1]) / 2
  }
  list(slope = slope, halfwidth = halfwidth)
}

roll4  <- run_roll(4)
roll14 <- run_roll(14)

round(range(roll4$halfwidth, na.rm = TRUE), 2)
#> [1] 0.47 9.07
round(range(roll14$halfwidth, na.rm = TRUE), 2)
#> [1] 0.77 2.00

round(c(week14 = roll14$slope[14], week15 = roll14$slope[15], week18 = roll14$slope[18]), 2)
#> week14 week15 week18 
#>   2.35   3.95   5.87 
```

`confint()` returns a 95% confidence interval for a fitted coefficient; half of that interval's total width is what this lesson calls its half-width, one number for how uncertain that week's slope estimate is. Width 4's half-width swings from 0.47 up to 9.07 across the 24 weeks, a huge range, because 4 data points barely pin down a slope at all. Width 14's half-width never leaves 0.77 to 2.00, far steadier. But steadier costs speed: by week 14 the width-14 slope is only 2.35, and by week 15 it is 3.95, both still far under the true 6, and it does not reach 5.87 until week 18, six weeks after the effect actually changed. A wider window trades a noisier estimate for a slower one; a narrower window trades the other way.

The same trade shows up in an ordinary regression's confidence interval, on data far simpler than this lesson's own.

::widget regression-intervals {}

This widget is not the subscription business's discount and signups. It is a small made-up linear regression demo, but its sample-size slider n shows exactly the same trade width just showed above. Push n up and the green confidence band collapses onto the line, the same way width 14's half-width stayed tight at 0.77 to 2.00. Pull n down and the band widens fast, the same way width 4's half-width stretched all the way out to 9.07. More data inside a window, like more data inside a sample, always narrows how uncertain the estimate is; the cost either way is how quickly that window can move on from data that no longer applies.

=== step === quiz
## Quick check: choosing a window's width

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A wider window always gives the better estimate, because more data inside the window always means less noise. ::no A wider window does narrow the noise, width 14's half-width never left 0.77 to 2.00 against width 4's swing from 0.47 to 9.07, but it is not simply "better": by week 15 the width-14 slope was only 3.95, still far from the true 6, because a wider window is slower to leave old data behind.
- A narrower window reacts to a real change faster, but its own slope swings more from week to week; a wider window is steadier but slower to catch up once the effect changes. ::ok Exactly. Width 4's half-width ranged from 0.47 to 9.07, wide swings from noise, while width 14 stayed inside 0.77 to 2.00 but still read only 2.35 at week 14 and 3.95 at week 15, six weeks behind the true jump to 6. Width sets a trade between noise and lag, not a free win in either direction.
- Once a series has enough weeks of data, the window's width stops making any real difference to the estimate. ::no The width kept mattering for the entire 24 weeks here: width 4's half-width was still swinging as late as week 24, and width 14 was still six weeks behind the true change at week 18. Width is a choice you keep making at every week, not one you outgrow.

=== step === concept
## The state-space filter: a slope that updates every week

A rolling window is one fix: refit on a slice of recent weeks and throw the slice away next week. A state space filter is a different fix: treat the slope itself as a value free to move a little every week, and update it once, using that week's data, without ever throwing anything away or holding a fixed-size window.

Write the model as two equations. The first says what you observe:

\[ \text{subscribers}_t = \alpha + \beta_t \cdot \text{discount}_t + v_t, \qquad v_t \sim N(0, V) \]

Here \(\alpha\) is the fixed organic-signup intercept, \(\beta_t\) is this week's own slope, and \(v_t\) is that week's own observation noise. The second equation says how the slope itself moves from one week to the next:

\[ \beta_t = \beta_{t-1} + w_t, \qquad w_t \sim N(0, w_\beta) \]

\(\beta_t\) is last week's slope carried forward, plus a small random nudge \(w_t\). This is the same predict-then-update recursion used to track a single hidden level, just carrying two states at once: \(\alpha\), which never drifts, and \(\beta_t\), which does.

Write the state as a pair, \(\theta_t = (\alpha, \beta_t)\), and let \(F_t = (1, \text{discount}_t)\) turn that pair into a prediction for that week's signups. The recursion runs one predict step and one update step, every week:

\[ a = \theta_{t-1}, \qquad R = C_{t-1} + W \]
\[ Q_t = F_t R F_t' + V, \qquad K_t = \dfrac{R F_t'}{Q_t}, \qquad m_t = a + K_t(y_t - F_t a), \qquad C_t = R - K_t F_t R \]

\(m_t\) is the filtered state, \((\alpha_t, \beta_t)\) after seeing week t's data, and \(C_t\) is its own 2x2 covariance matrix: how uncertain each part of the state still is. \(W\) is a matrix with the intercept's own evolution variance held at exactly 0, since \(\alpha\) never drifts, and \(\beta_t\)'s evolution variance, \(w_\beta\), controlling how much weekly drift the slope is allowed. Because nothing else pushes \(\theta_t\) forward between weeks, the predict step above just carries last week's filtered state through unchanged before \(W\) adds its share of new uncertainty. \(F_t'\) means \(F_t\) transposed, flipped from a row into a column so the matrix multiplication lines up.

Set \(V = 16\), matching the noise this data was simulated with, a standard deviation of 4 squared. Set \(w_\beta = 0.3\), chosen so the slope can genuinely move but does not overreact to one noisy week. Start the filter with \(m_0 = (20, 4.5)\), an intercept guess matching the known organic rate and a slope guess of 4.5 roughly splitting the difference between the true 3 and 6, and \(C_0 = \text{diag}(25, 4)\), standard deviations of 5 and 2, wide enough to admit that starting guess could be off either way. Run that recursion across all 24 weeks.

```r
# Run a 2-state Kalman filter (intercept + slope) across all 24 weeks
V <- 16
w_beta <- 0.3

G <- diag(2)
W <- diag(c(0, w_beta))

m <- c(20, 4.5)
C <- diag(c(25, 4))

kf_alpha <- numeric(24)
kf_beta  <- numeric(24)
kf_se    <- numeric(24)

for (t in 1:24) {
  Ft <- c(1, discount[t])

  a <- G %*% m
  R <- G %*% C %*% t(G) + W

  Qt <- as.numeric(Ft %*% R %*% Ft) + V
  K <- (R %*% Ft) / Qt
  e <- subscribers[t] - as.numeric(Ft %*% a)

  m <- a + K * e
  C <- R - K %*% t(Ft) %*% R

  kf_alpha[t] <- m[1]
  kf_beta[t]  <- m[2]
  kf_se[t]    <- sqrt(C[2, 2])
}

round(head(kf_beta), 2)
#> [1] 2.87 3.07 3.26 3.30 3.33 3.08
round(head(kf_se), 3)
#> [1] 0.438 0.355 0.414 0.685 0.772 0.528
```

`G`, the matrix that carries the state from one week to the next, is the 2x2 identity matrix here, so it does not change \(\theta_t\) by itself; any real movement comes only from \(W\)'s nudge to \(\beta_t\). `kf_se`, the square root of each week's own \(C_t[2,2]\), is the filter's running standard error for the slope, a number that updates every single week right alongside the slope itself.

Take week 1 by hand. Discount that week is \$14.3, so \(F_1 = (1, 14.3)\). The predict step carries the starting guess forward unchanged, so \(a = (20, 4.5)\), and because \(W\) only touches the slope's own slot, R's diagonal is (25, 4.3): alpha's predicted variance stays at exactly 25, while the slope's grows from 4 to 4.3. The predicted signup count is \(1 \times 20 + 14.3 \times 4.5 = 84.35\), against an actual count of 60, a residual of -24.35. The gain blends that residual into both parts of the state, landing the first filtered state at `kf_alpha[1]` = 19.34 and `kf_beta[1]` = 2.87, matching the first number the code above printed. Every one of the following 23 weeks repeats exactly this: predict, then update, using that week's own discount and signup count.

=== step === concept
## Reading the state-space path against the rolling path

Plot all three paths together: the true effect, the width-8 rolling slope, and the filtered slope from the state space filter.

::widget chart-plotter {"data":[{"x":1,"y":3,"fill":"true effect"},{"x":2,"y":3,"fill":"true effect"},{"x":3,"y":3,"fill":"true effect"},{"x":4,"y":3,"fill":"true effect"},{"x":5,"y":3,"fill":"true effect"},{"x":6,"y":3,"fill":"true effect"},{"x":7,"y":3,"fill":"true effect"},{"x":8,"y":3,"fill":"true effect"},{"x":9,"y":3,"fill":"true effect"},{"x":10,"y":3,"fill":"true effect"},{"x":11,"y":3,"fill":"true effect"},{"x":12,"y":3,"fill":"true effect"},{"x":13,"y":6,"fill":"true effect"},{"x":14,"y":6,"fill":"true effect"},{"x":15,"y":6,"fill":"true effect"},{"x":16,"y":6,"fill":"true effect"},{"x":17,"y":6,"fill":"true effect"},{"x":18,"y":6,"fill":"true effect"},{"x":19,"y":6,"fill":"true effect"},{"x":20,"y":6,"fill":"true effect"},{"x":21,"y":6,"fill":"true effect"},{"x":22,"y":6,"fill":"true effect"},{"x":23,"y":6,"fill":"true effect"},{"x":24,"y":6,"fill":"true effect"},{"x":8,"y":2.65,"fill":"rolling window w=8"},{"x":9,"y":2.7,"fill":"rolling window w=8"},{"x":10,"y":2.39,"fill":"rolling window w=8"},{"x":11,"y":2.34,"fill":"rolling window w=8"},{"x":12,"y":2.47,"fill":"rolling window w=8"},{"x":13,"y":2.09,"fill":"rolling window w=8"},{"x":14,"y":1.91,"fill":"rolling window w=8"},{"x":15,"y":4.7,"fill":"rolling window w=8"},{"x":16,"y":5.61,"fill":"rolling window w=8"},{"x":17,"y":5.53,"fill":"rolling window w=8"},{"x":18,"y":5.93,"fill":"rolling window w=8"},{"x":19,"y":5.51,"fill":"rolling window w=8"},{"x":20,"y":6.01,"fill":"rolling window w=8"},{"x":21,"y":6.13,"fill":"rolling window w=8"},{"x":22,"y":5.92,"fill":"rolling window w=8"},{"x":23,"y":6.24,"fill":"rolling window w=8"},{"x":24,"y":6.29,"fill":"rolling window w=8"},{"x":1,"y":2.87,"fill":"filtered (Kalman)"},{"x":2,"y":3.07,"fill":"filtered (Kalman)"},{"x":3,"y":3.26,"fill":"filtered (Kalman)"},{"x":4,"y":3.3,"fill":"filtered (Kalman)"},{"x":5,"y":3.33,"fill":"filtered (Kalman)"},{"x":6,"y":3.08,"fill":"filtered (Kalman)"},{"x":7,"y":3.06,"fill":"filtered (Kalman)"},{"x":8,"y":2.37,"fill":"filtered (Kalman)"},{"x":9,"y":2.83,"fill":"filtered (Kalman)"},{"x":10,"y":3.12,"fill":"filtered (Kalman)"},{"x":11,"y":2.57,"fill":"filtered (Kalman)"},{"x":12,"y":2.68,"fill":"filtered (Kalman)"},{"x":13,"y":3.11,"fill":"filtered (Kalman)"},{"x":14,"y":4.09,"fill":"filtered (Kalman)"},{"x":15,"y":5.67,"fill":"filtered (Kalman)"},{"x":16,"y":5.78,"fill":"filtered (Kalman)"},{"x":17,"y":5.81,"fill":"filtered (Kalman)"},{"x":18,"y":5.93,"fill":"filtered (Kalman)"},{"x":19,"y":5.79,"fill":"filtered (Kalman)"},{"x":20,"y":6.32,"fill":"filtered (Kalman)"},{"x":21,"y":5.56,"fill":"filtered (Kalman)"},{"x":22,"y":6.17,"fill":"filtered (Kalman)"},{"x":23,"y":5.55,"fill":"filtered (Kalman)"},{"x":24,"y":5.75,"fill":"filtered (Kalman)"}],"geoms":["line"],"x":"week","y":"slope (signups per discount dollar)"}

Look at week 14, right where the rolling path hit its low point. The filter reads 4.09 there, already most of the way to the true 6, against the rolling window's 1.91, still barely off its own starting point. By week 15 the gap has closed further: the filter reads 5.67 against the rolling window's 4.70. The filter reacts sooner because it updates every single week from the moment new data arrives, instead of waiting for old, pre-change weeks to age out of a fixed window.

```r
# Compare the filter's RMSE against the rolling window's RMSE, both against the true effect
rmse_filter <- sqrt(mean((kf_beta[9:24] - beta_true[9:24])^2))
rmse_roll8  <- sqrt(mean((roll8_beta[9:24] - beta_true[9:24])^2))

round(c(filter = rmse_filter, rolling_w8 = rmse_roll8), 2)
#>     filter rolling_w8 
#>       0.91       1.49 
```

Across weeks 9 through 24, the filter's RMSE is 0.91 against the rolling window's 1.49. The filter beats the rolling window here because it never has to wait for a whole window's worth of new data before it can move; one new week's residual is enough to start correcting it.

=== step === concept
## How to report a coefficient path honestly

Both the rolling window and the filter recover a path, not a single number, and each path carries its own uncertainty that grows right where the estimate is still catching up. Compute the rolling window's own half-width for width 8, and print it beside the filter's own standard error, `kf_se`, for weeks 12 through 20, the stretch either side of the week-13 change.

```r
# Compute the rolling window's own half-width for width 8, and compare it to the filter's own SE
roll8_halfwidth <- rep(NA_real_, 24)
for (t in 8:24) {
  idx <- (t - 7):t
  fit <- lm(subscribers ~ discount, data = df[idx, ])
  ci <- confint(fit, "discount", level = 0.95)
  roll8_halfwidth[t] <- (ci[2] - ci[1]) / 2
}

comparison <- data.frame(
  week = 12:20,
  roll8_halfwidth = round(roll8_halfwidth[12:20], 2),
  kf_se = round(kf_se[12:20], 3)
)
comparison
#>   week roll8_halfwidth kf_se
#> 1   12            1.14 0.344
#> 2   13            1.38 0.627
#> 3   14            1.81 0.621
#> 4   15            3.16 0.246
#> 5   16            2.68 0.271
#> 6   17            2.66 0.421
#> 7   18            2.56 0.235
#> 8   19            2.47 0.560
#> 9   20            0.48 0.347

round(c(week15_slope = roll8_beta[15], week15_lower = roll8_beta[15] - roll8_halfwidth[15],
        week15_upper = roll8_beta[15] + roll8_halfwidth[15]), 2)
#> week15_slope week15_lower week15_upper 
#>         4.70         1.54         7.86 
```

Right after the change, the rolling window's half-width jumps from 1.14 at week 12 to 1.81 at week 14, and stays elevated, between 2.47 and 3.16, all the way through week 19, before dropping to 0.48 by week 20 once the window sits entirely inside the new relationship. `kf_se` moves for the same reason: 0.621 at week 14, while the filter is still catching up, against 0.347 at week 20, once it has largely settled.

Take week 15 on its own. The rolling window's slope reads 4.70, six weeks after the true change to 6, and reported alone that number looks confidently wrong. But its own 95% interval, built from that same half-width, runs from 1.54 to 7.86, and that wide range admits the true value could sit almost anywhere inside it, including close to the true 6. That is what the interval is for. A coefficient path is never reported as a bare line; it is reported with its own interval attached, largest exactly where the point estimate is least settled.

=== step === quiz
## Quick check: fixing a coefficient that changed

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Report the single OLS slope from fitting the whole 24 weeks, 4.84, since one number is simplest for the team to act on. ::no That single slope overshot week 3's true mean, 88.2 against 63.2, and undershot week 18's, 113.4 against 137.6. A fixed slope cannot be right on both sides of a change it never sees, no matter how simple it looks.
- Report the filtered or rolling coefficient path itself, together with its own interval at whatever week matters, never the single whole-series slope. ::ok Right. The filter tracked the change fastest, 4.09 by week 14 against the rolling window's 1.91, and beat it on RMSE, 0.91 against 1.49. But even the better path needs its own interval attached, since week 15's rolling slope of 4.70 alone looks confident when its true interval, 1.54 to 7.86, is still wide open.
- A narrow enough rolling window always keeps up with a change exactly as fast as the filter does, so window width is not really a separate choice. ::no Even width 4, the narrowest window tried, still averages fresh and stale weeks together inside its window; the filter updates from a single new week's residual instead. That is why the filter's RMSE, 0.91, beat every rolling width in this lesson, not just width 8's 1.49.
- Once you report an interval beside the coefficient, the point estimate itself no longer matters. ::no The interval does not replace the point estimate, it qualifies it. Week 15's rolling slope, 4.70, is still the best single guess at that week's effect; the interval, 1.54 to 7.86, just says how much to trust that guess before it settles down.

=== step === tryit
## Your turn: build the filter's own interval

`kf_beta` and `kf_se` still hold the filtered slope and its own standard error for every week. Use week 20's values to build a 95% interval the same way week 15's rolling interval was built two steps back.

```r
# kf_beta and kf_se hold the filtered slope and its own SE for every week

# Complete these two lines: lower = kf_beta[20] - 1.96 * kf_se[20], upper = kf_beta[20] + 1.96 * kf_se[20]
```
::check {"regex": "lower\\s*<-\\s*kf_beta\\[20\\]\\s*-\\s*1\\.96\\s*\\*\\s*kf_se\\[20\\][\\s\\S]*upper\\s*<-\\s*kf_beta\\[20\\]\\s*\\+\\s*1\\.96\\s*\\*\\s*kf_se\\[20\\]", "gate": true, "difficulty": "intermediate", "ok": "Right: 5.64 to 7.00. That interval is nothing more than week 20's filtered slope plus or minus 1.96 standard errors, the same construction used on the rolling window's own interval two steps back.", "no": "A 95% interval is the estimate plus or minus 1.96 standard errors: lower <- kf_beta[20] - 1.96 * kf_se[20], and upper <- kf_beta[20] + 1.96 * kf_se[20]."}
::solution
```r
# Turn week 20's filtered slope and its own SE into a 95% interval
lower <- kf_beta[20] - 1.96 * kf_se[20]
upper <- kf_beta[20] + 1.96 * kf_se[20]
round(c(lower = lower, upper = upper), 2)
#> lower upper 
#>  5.64  7.00 
```

=== step === concept
## References

- [Zeileis, A., Leisch, F., Hornik, K., and Kleiber, C. (2002). "strucchange: An R Package for Testing for Structural Change in Linear Regression Models."](https://doi.org/10.18637/jss.v007.i02) *Journal of Statistical Software*, 7(2). Covers testing for exactly the kind of change this lesson simulated by hand.
- [Petris, G., Petrone, S., and Campagnoli, P. (2009). *Dynamic Linear Models with R*.](https://doi.org/10.1007/b135794) Springer. The textbook whose two-equation notation this lesson's state space filter follows.
- [Durbin, J., and Koopman, S. J. (2012). *Time Series Analysis by State Space Methods* (2nd ed.).](https://doi.org/10.1093/acprof:oso/9780199641178.001.0001) Oxford University Press. Covers the predict-update recursion extended to a coefficient that drifts over time.
- West, M., and Harrison, J. (1997). *Bayesian Forecasting and Dynamic Models* (2nd ed.). Springer. An early, thorough reference for regression coefficients that are allowed to move.

=== step === complete
## What decides a rolling window versus a state space filter

You can now explain why a fixed coefficient can be the wrong assumption, and choose between the two fixes this lesson worked through on one running example.

- A single OLS slope fit across a series whose effect changed mid-way is wrong on both sides of the change: intercept 18.46 and slope 4.84 overshot week 3's true mean of 63.2 and undershot week 18's true mean of 137.6.
- A rolling-window regression trades noise for lag by its width: width 4's half-width swung from 0.47 to 9.07, width 14 never left 0.77 to 2.00, but the steadier width also lagged six weeks longer before its slope neared the true 6.
- A state space filter updates its slope, and that slope's own standard error, every single week through a predict-then-update recursion, no window required.
- Measured against the true effect over weeks 9 to 24, the filter's RMSE, 0.91, beat the width-8 rolling window's 1.49, because it reacted from the very next week's data instead of waiting on a window to refill.
- Either path is reported with its own interval attached, never as a bare number, largest exactly where the estimate is least settled: 1.54 to 7.86 around week 15's rolling slope of 4.70.

Whichever one you reach for, the choice comes down to how fast you need to react to a change against how much noise in the estimate you can tolerate along the way, and the path you report should always carry its own interval beside it.
