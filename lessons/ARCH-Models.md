---
title: "Volatility Modeling with ARCH and GARCH Lesson 2: ARCH Models"
catalog_blurb: "How to model a return series whose variance depends on recent shocks."
description: "Write the ARCH(q) equation, simulate it, test DAX returns for ARCH effects with a Ljung-Box test on squared shocks, then fit it by maximum likelihood in R."
keywords: "ARCH model, ARCH(q), conditional variance, ARCH effects, Ljung-Box test, ARCH-LM test, maximum likelihood, tseries garch, DAX returns, volatility clustering, R"
post_type: "LESSON"
curriculum_id: "5.100.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-volatility"
course_title: "Volatility Modeling with ARCH and GARCH"
course_lesson: "2"
course_total: "6"
course_landing: "Volatility-Modeling-ARCH-and-GARCH-Course.html"
course_next: "The-GARCH-Family.html"
course_prev: "Conditional-Heteroskedasticity-and-Volatility-Clustering.html"
---

=== step === cover
## ARCH Models

Today let's understand the ARCH model, which describes how the variance of a return series depends on the shocks that came just before it.

Our example is the DAX, the German stock index. R's built-in `EuStockMarkets` data holds its closing price on 1,860 business days, which gives us 1,859 daily returns. Take the average return away from each one and what is left is that day's shock.

The chart below plots the shock on 220 days in a row, days 1521 to 1740.

::widget chart-plotter {"data":[{"x":1521,"y":1.491},{"x":1522,"y":0.291},{"x":1523,"y":-0.065},{"x":1524,"y":1.464},{"x":1525,"y":2.049},{"x":1526,"y":-0.548},{"x":1527,"y":-0.378},{"x":1528,"y":-0.065},{"x":1529,"y":-0.185},{"x":1530,"y":1.617},{"x":1531,"y":-1.012},{"x":1532,"y":0.754},{"x":1533,"y":-0.728},{"x":1534,"y":0.058},{"x":1535,"y":-0.065},{"x":1536,"y":-1.563},{"x":1537,"y":2.301},{"x":1538,"y":-0.761},{"x":1539,"y":1.221},{"x":1540,"y":1.24},{"x":1541,"y":-0.171},{"x":1542,"y":-1.13},{"x":1543,"y":0.177},{"x":1544,"y":-2.084},{"x":1545,"y":0.875},{"x":1546,"y":1.567},{"x":1547,"y":-0.175},{"x":1548,"y":0.835},{"x":1549,"y":0.366},{"x":1550,"y":-0.932},{"x":1551,"y":0.004},{"x":1552,"y":-0.046},{"x":1553,"y":1.697},{"x":1554,"y":0.341},{"x":1555,"y":-0.128},{"x":1556,"y":-0.837},{"x":1557,"y":0.187},{"x":1558,"y":1.187},{"x":1559,"y":0.225},{"x":1560,"y":-1.12},{"x":1561,"y":0.262},{"x":1562,"y":1.477},{"x":1563,"y":-0.048},{"x":1564,"y":-0.334},{"x":1565,"y":-1.201},{"x":1566,"y":1.723},{"x":1567,"y":0.784},{"x":1568,"y":1.784},{"x":1569,"y":0.112},{"x":1570,"y":1.359},{"x":1571,"y":0.601},{"x":1572,"y":-0.143},{"x":1573,"y":-0.721},{"x":1574,"y":1.759},{"x":1575,"y":1.587},{"x":1576,"y":-0.126},{"x":1577,"y":1.944},{"x":1578,"y":-0.535},{"x":1579,"y":-1.792},{"x":1580,"y":0.129},{"x":1581,"y":3.673},{"x":1582,"y":1.943},{"x":1583,"y":-1.542},{"x":1584,"y":1.04},{"x":1585,"y":0.659},{"x":1586,"y":-0.58},{"x":1587,"y":1.767},{"x":1588,"y":-1.264},{"x":1589,"y":-1.633},{"x":1590,"y":-0.863},{"x":1591,"y":0.476},{"x":1592,"y":0.818},{"x":1593,"y":1.387},{"x":1594,"y":-2.021},{"x":1595,"y":-0.276},{"x":1596,"y":0.953},{"x":1597,"y":-3.326},{"x":1598,"y":-1.05},{"x":1599,"y":-2.917},{"x":1600,"y":0.007},{"x":1601,"y":2.592},{"x":1602,"y":1.391},{"x":1603,"y":-1.18},{"x":1604,"y":-2.83},{"x":1605,"y":-0.393},{"x":1606,"y":-2.123},{"x":1607,"y":-0.107},{"x":1608,"y":-2.463},{"x":1609,"y":0.507},{"x":1610,"y":2.006},{"x":1611,"y":3.022},{"x":1612,"y":-1.656},{"x":1613,"y":0.702},{"x":1614,"y":-0.548},{"x":1615,"y":1.338},{"x":1616,"y":-0.713},{"x":1617,"y":-1.948},{"x":1618,"y":-3.545},{"x":1619,"y":-2.501},{"x":1620,"y":1.837},{"x":1621,"y":3.143},{"x":1622,"y":-0.699},{"x":1623,"y":0.777},{"x":1624,"y":-0.591},{"x":1625,"y":2.752},{"x":1626,"y":-0.189},{"x":1627,"y":1.371},{"x":1628,"y":-1.18},{"x":1629,"y":0.667},{"x":1630,"y":-0.515},{"x":1631,"y":0.863},{"x":1632,"y":2.503},{"x":1633,"y":0.01},{"x":1634,"y":-0.065},{"x":1635,"y":1.336},{"x":1636,"y":-0.418},{"x":1637,"y":-1.085},{"x":1638,"y":-2.136},{"x":1639,"y":-0.432},{"x":1640,"y":1.381},{"x":1641,"y":-0.303},{"x":1642,"y":-1.177},{"x":1643,"y":-0.515},{"x":1644,"y":-2.523},{"x":1645,"y":0.43},{"x":1646,"y":2.44},{"x":1647,"y":-1.213},{"x":1648,"y":-3.731},{"x":1649,"y":0.062},{"x":1650,"y":-2.868},{"x":1651,"y":-6.072},{"x":1652,"y":4.255},{"x":1653,"y":-1.595},{"x":1654,"y":0.062},{"x":1655,"y":2.41},{"x":1656,"y":-1.714},{"x":1657,"y":1.419},{"x":1658,"y":-0.784},{"x":1659,"y":-2.682},{"x":1660,"y":0.284},{"x":1661,"y":0.107},{"x":1662,"y":-1.069},{"x":1663,"y":0.055},{"x":1664,"y":-0.751},{"x":1665,"y":3.673},{"x":1666,"y":0.651},{"x":1667,"y":0.783},{"x":1668,"y":1.341},{"x":1669,"y":0.191},{"x":1670,"y":-2.89},{"x":1671,"y":0.404},{"x":1672,"y":1.91},{"x":1673,"y":0.823},{"x":1674,"y":0.19},{"x":1675,"y":3.735},{"x":1676,"y":-0.783},{"x":1677,"y":-0.6},{"x":1678,"y":2.004},{"x":1679,"y":0.703},{"x":1680,"y":0.324},{"x":1681,"y":-0.566},{"x":1682,"y":-1.762},{"x":1683,"y":-2.524},{"x":1684,"y":1.054},{"x":1685,"y":-0.877},{"x":1686,"y":2.899},{"x":1687,"y":0.037},{"x":1688,"y":0.136},{"x":1689,"y":-2.683},{"x":1690,"y":1.651},{"x":1691,"y":0.11},{"x":1692,"y":-0.065},{"x":1693,"y":-0.065},{"x":1694,"y":-0.065},{"x":1695,"y":3.108},{"x":1696,"y":-1.048},{"x":1697,"y":-0.065},{"x":1698,"y":-0.065},{"x":1699,"y":3.196},{"x":1700,"y":1.133},{"x":1701,"y":-1.362},{"x":1702,"y":-0.527},{"x":1703,"y":-1.139},{"x":1704,"y":-1.375},{"x":1705,"y":-2.528},{"x":1706,"y":0.306},{"x":1707,"y":-0.176},{"x":1708,"y":-0.19},{"x":1709,"y":1.754},{"x":1710,"y":1.67},{"x":1711,"y":0.418},{"x":1712,"y":-1.475},{"x":1713,"y":-0.341},{"x":1714,"y":-0.458},{"x":1715,"y":0.976},{"x":1716,"y":1.093},{"x":1717,"y":1.526},{"x":1718,"y":1.277},{"x":1719,"y":-0.11},{"x":1720,"y":1.882},{"x":1721,"y":-0.081},{"x":1722,"y":-0.506},{"x":1723,"y":-0.388},{"x":1724,"y":0.869},{"x":1725,"y":-0.448},{"x":1726,"y":0.795},{"x":1727,"y":-0.2},{"x":1728,"y":-1.016},{"x":1729,"y":0.224},{"x":1730,"y":0.225},{"x":1731,"y":1.94},{"x":1732,"y":-0.406},{"x":1733,"y":-0.731},{"x":1734,"y":-0.023},{"x":1735,"y":0.536},{"x":1736,"y":-0.198},{"x":1737,"y":2.084},{"x":1738,"y":-0.252},{"x":1739,"y":-0.106},{"x":1740,"y":1.787}],"geoms":["line","point"],"x":"day","y":"shock"}

The shocks are small on some days and large on others, and the two kinds arrive in runs. The standard deviation of all 220 shocks is 1.51. But cut them into 11 blocks of 20 days, and the standard deviation of a block goes from 0.88 to 2.35.

That changing spread is what an ARCH model describes. In this lesson we write its equation, simulate a series from it, test the DAX for it and then fit it.

In the chart above, a bunch of tall spikes is followed by a stretch of short ones.

=== step === concept
## What is the conditional variance of a return?

We start by turning the DAX prices into returns. The return on a day is the change in the log price from the day before, times 100, which is close to the percentage change. Press Run.

```r
# Build the DAX daily returns and the shocks from the built-in EuStockMarkets data
dax_price <- as.numeric(EuStockMarkets[, "DAX"])
dax_ret <- 100 * diff(log(dax_price))
e <- dax_ret - mean(dax_ret)

# Summarise the returns
length(dax_ret)
round(c(mean = mean(dax_ret), sd = sd(dax_ret), min = min(dax_ret), max = max(dax_ret)), 4)
#> [1] 1859
#>    mean      sd     min     max
#>  0.0652  1.0301 -9.6277  5.0760
```

There are 1,859 returns, with a mean of 0.0652 and a standard deviation of 1.0301. The biggest one-day fall is -9.6277.

The mean is tiny next to a daily spread of about 1. So we treat it as a constant \(\mu\) and write each return as that mean plus a shock:

\[ r_t = \mu + e_t \]

Here \(r_t\) is the return on day \(t\), and \(e_t\) is the shock, the part of the return that the mean does not explain. In the code, `e` holds the 1,859 shocks.

Next, we write the shock as a standard deviation times random noise:

\[ e_t = \sigma_t z_t \]

The noise \(z_t\) is drawn from a standard Normal distribution (mean 0, variance 1), and \(\sigma_t\) is the standard deviation on day \(t\). So \(\sigma_t^2\) is the variance of the shock on day \(t\).

But which variance? It is the variance of the shock given the shocks before day \(t\):

\[ \sigma_t^2 = \mathrm{Var}(e_t \mid e_{t-1}, e_{t-2}, \dots) \]

The bar reads "given". This is the **conditional variance**: the variance of today's shock once you know what happened up to yesterday. And it is free to change from day to day.

Compare that with the ordinary variance of all 1,859 shocks, which is one number for every day. The code below computes the variance of all the shocks and the standard deviation over every 250-day window, and adds the kurtosis of the shocks.

```r
# Compare the variance of all days with the 250-day standard deviation, and measure the tails
kurt <- function(x) mean((x - mean(x))^4) / mean((x - mean(x))^2)^2
roll_sd <- sapply(250:length(e), function(i) sd(e[(i - 249):i]))

round(var(e), 4)
round(range(roll_sd), 2)
round(kurt(e), 2)
#> [1] 1.0611
#> [1] 0.63 1.52
#> [1] 9.28
```

The variance of all the shocks is 1.0611, a standard deviation of 1.03. But the standard deviation over a 250-day window moves between 0.63 and 1.52. So one variance for all days does not describe any particular stretch well.

The last number is the kurtosis, which measures how heavy the tails of a series are. It is the average fourth power of the deviations from the mean, divided by the squared variance, and R has no built-in function for it, so `kurt()` computes it. A Normal series has a kurtosis of 3, and heavier tails give a larger number. The DAX shocks have 9.28, so very large shocks are much more common than in a Normal series with the same variance.

=== step === concept
## The ARCH(q) equation, starting with q = 1

ARCH stands for autoregressive conditional heteroskedasticity. Heteroskedasticity means the variance is not constant, conditional means it depends on what happened before, and autoregressive means it depends on the series' own past values. Robert Engle proposed the model in 1982.

The simplest version is ARCH(1). Today's conditional variance is a constant plus a weight times yesterday's squared shock:

\[ \sigma_t^2 = \omega + \alpha \, e_{t-1}^2 \]

Here \(\omega\) (omega) is the constant and \(\alpha\) (alpha) is the weight on yesterday's squared shock. Let's take \(\omega = 0.6\) and \(\alpha = 0.4\), and compute today's variance for four different values of yesterday's shock.

```r
# Compute the ARCH(1) variance and standard deviation for four values of yesterday's shock
omega <- 0.6
alpha <- 0.4
shock_yesterday <- c(0, 1, 2, 4)
sigma2_today <- omega + alpha * shock_yesterday^2
sigma_today <- sqrt(sigma2_today)
data.frame(shock_yesterday, sigma2_today, sigma_today = round(sigma_today, 3))
#>   shock_yesterday sigma2_today sigma_today
#> 1               0          0.6       0.775
#> 2               1          1.0       1.000
#> 3               2          2.2       1.483
#> 4               4          7.0       2.646
```

After a shock of 0, the variance is 0.6, which is \(\omega\) itself. Shocks of 1, 2 and 4 give variances of 1.0, 2.2 and 7.0, so the standard deviation grows from 0.775 to 2.646. A large shock yesterday means a wide spread today, and a small shock means a narrow one.

The shock is squared, so its sign does not matter. A shock of -4 gives the same variance of 7.0 as a shock of 4. Only the size of yesterday's move counts, not its direction.

How big is a shock of 4? The code below counts the DAX shocks that are larger than 4 in absolute value.

```r
# Count the DAX shocks larger than 4 in absolute value
sum(abs(e) > 4)
#> [1] 6
```

A shock of 4 is 3.9 standard deviations of the DAX shocks, and only 6 of the 1,859 shocks are larger than 4 in absolute value. So it is a rare day, and after one the next day's variance is 7.0 instead of 0.6.

A variance cannot be negative. So \(\omega\) must be above 0 and \(\alpha\) must be 0 or more, and then \(\omega + \alpha e_{t-1}^2\) is always positive.

The general model uses the last \(q\) squared shocks, each with its own weight:

\[ \sigma_t^2 = \omega + \sum_{i=1}^{q} \alpha_i \, e_{t-i}^2 \]

The order \(q\) is the number of past squared shocks that feed today's variance. ARCH(3), for example, uses the shocks of the last 3 days, with weights \(\alpha_1\), \(\alpha_2\) and \(\alpha_3\).

Given the past, the shock \(e_t\) has mean 0, because \(z_t\) does. So its variance is just the average size of its square:

\[ E(e_t^2 \mid \text{past shocks}) = \sigma_t^2 \]

Here \(E\) is the expected value, the average. In words: once the past shocks are known, the average squared shock is the conditional variance.

=== step === concept
## Simulating an ARCH(1) series and its long-run variance

Let's simulate an ARCH(1) series with \(\omega = 0.6\) and \(\alpha = 0.4\). Since we choose the parameters, we know the right answer and can check every method against it.

Each day takes three steps:

1. Compute \(\sigma_t^2 = \omega + \alpha e_{t-1}^2\) from yesterday's shock.
2. Draw \(z_t\) from a standard Normal.
3. Set \(e_t = \sigma_t z_t\).

Day 1 has no yesterday, so it needs a starting variance. We use the long-run variance, the variance the series settles at over many days. Call it \(v\). The average squared shock is the same \(v\) today and yesterday, so the ARCH(1) equation says \(v = \omega + \alpha v\). Solving for \(v\) gives:

\[ v = \frac{\omega}{1 - \alpha} \]

With \(\omega = 0.6\) and \(\alpha = 0.4\), we get \(v = 0.6 / 0.6 = 1.0\), close to the DAX's 1.06. This only works when \(\alpha\) is below 1. With \(q\) lags the same steps give \(v = \omega / (1 - \alpha_1 - \dots - \alpha_q)\).

The code runs the three steps for 1,859 days, the same length as the DAX shocks. It also draws an iid Normal series for comparison. Here iid means independent and identically distributed: every day is drawn separately from the same Normal, so its variance never changes.

```r
# Simulate an ARCH(1) series with omega = 0.6 and alpha = 0.4, and an iid Normal series
omega <- 0.6
alpha <- 0.4
n <- length(e)

set.seed(42)
z <- rnorm(n)
sim_sigma <- numeric(n)
sim_e <- numeric(n)
sim_sigma[1] <- sqrt(omega / (1 - alpha))
sim_e[1] <- sim_sigma[1] * z[1]
for (t in 2:n) {
  sim_sigma[t] <- sqrt(omega + alpha * sim_e[t - 1]^2)
  sim_e[t] <- sim_sigma[t] * z[t]
}

set.seed(1042)
iid_e <- rnorm(n)
```

Now let's compare the variance and the kurtosis of the two series.

```r
# Compare the variance and kurtosis of the two simulated series
data.frame(
  series = c("ARCH(1)", "iid Normal"),
  variance = round(c(var(sim_e), var(iid_e)), 3),
  kurtosis = round(c(kurt(sim_e), kurt(iid_e)), 2)
)
#>       series variance kurtosis
#> 1    ARCH(1)    0.960     4.22
#> 2 iid Normal    1.026     2.95
```

Both variances sit near 1: 0.960 for the ARCH(1) series, close to its long-run variance of 1.0, and 1.026 for the iid series. The kurtosis is where they differ, 4.22 against 2.95.

The iid series is close to the Normal value of 3. The ARCH(1) series has heavier tails even though every \(z_t\) is Normal. The reason is that its variance changes over time: on high-variance days the shocks are large, and those large shocks make the tails heavier.

The plot below puts the two series on the same vertical scale.

```r
# Plot the ARCH(1) series above the iid Normal series on the same vertical scale
par(mfrow = c(2, 1), mar = c(3, 4, 2, 1))
plot(sim_e, type = "l", ylim = range(sim_e, iid_e), xlab = "", ylab = "shock", main = "Simulated ARCH(1)")
plot(iid_e, type = "l", ylim = range(sim_e, iid_e), xlab = "day", ylab = "shock", main = "Simulated iid Normal")
par(mfrow = c(1, 1))
```

The iid series stays between -4 and 4. The ARCH(1) series has sharper spikes, two of them below -4, and these spikes are the heavy tails that the kurtosis of 4.22 measured.

The equation also says that after a large shock, the next day's variance is larger. So a large day is more likely to be followed by another large day. With \(\alpha = 0.4\) that link is modest and hard to pick out by eye in 1,859 days, so the next step measures it.

=== step === widget
## The variance equation as a least-squares line

The variance equation has the form of a straight line. Given yesterday's shock, the average of today's squared shock is \(\omega + \alpha e_{t-1}^2\). So if we plot \(e_t^2\) against \(e_{t-1}^2\), the points scatter around a line whose intercept is \(\omega\) and whose slope is \(\alpha\).

That means we can estimate both with a least-squares regression of \(e_t^2\) on \(e_{t-1}^2\). Least squares picks the intercept and slope that make the sum of the squared vertical gaps between the points and the line as small as possible.

The widget below holds 249 pairs from the first 250 days of the simulated series. On the x axis is yesterday's squared shock and on the y axis is today's. Drag the two sliders and watch the sum of squared errors, then press "Snap to least squares".

::widget ols-fit {"points":[{"x":1.88,"y":0.431},{"x":0.431,"y":0.102},{"x":0.102,"y":0.257},{"x":0.257,"y":0.115},{"x":0.115,"y":0.007},{"x":0.007,"y":1.377},{"x":1.377,"y":0.01},{"x":0.01,"y":2.461},{"x":2.461,"y":0.006},{"x":0.006,"y":1.026},{"x":1.026,"y":5.283},{"x":5.283,"y":5.233},{"x":5.233,"y":0.209},{"x":0.209,"y":0.012},{"x":0.012,"y":0.245},{"x":0.245,"y":0.056},{"x":0.056,"y":4.393},{"x":4.393,"y":14.04},{"x":14.04,"y":10.832},{"x":10.832,"y":0.464},{"x":0.464,"y":2.493},{"x":2.493,"y":0.047},{"x":0.047,"y":0.913},{"x":0.913,"y":3.467},{"x":3.467,"y":0.368},{"x":0.368,"y":0.049},{"x":0.049,"y":1.927},{"x":1.927,"y":0.29},{"x":0.29,"y":0.293},{"x":0.293,"y":0.149},{"x":0.149,"y":0.328},{"x":0.328,"y":0.783},{"x":0.783,"y":0.339},{"x":0.339,"y":0.188},{"x":0.188,"y":1.99},{"x":1.99,"y":0.859},{"x":0.859,"y":0.683},{"x":0.683,"y":5.09},{"x":5.09,"y":0.003},{"x":0.003,"y":0.026},{"x":0.026,"y":0.08},{"x":0.08,"y":0.363},{"x":0.363,"y":0.394},{"x":0.394,"y":1.418},{"x":1.418,"y":0.219},{"x":0.219,"y":0.453},{"x":0.453,"y":1.629},{"x":1.629,"y":0.233},{"x":0.233,"y":0.298},{"x":0.298,"y":0.075},{"x":0.075,"y":0.387},{"x":0.387,"y":1.874},{"x":1.874,"y":0.558},{"x":0.558,"y":0.007},{"x":0.007,"y":0.046},{"x":0.046,"y":0.285},{"x":0.285,"y":0.006},{"x":0.006,"y":5.396},{"x":5.396,"y":0.224},{"x":0.224,"y":0.093},{"x":0.093,"y":0.022},{"x":0.022,"y":0.206},{"x":0.206,"y":1.337},{"x":1.337,"y":0.6},{"x":0.6,"y":1.425},{"x":1.425,"y":0.132},{"x":0.132,"y":0.704},{"x":0.704,"y":0.747},{"x":0.747,"y":0.467},{"x":0.467,"y":0.856},{"x":0.856,"y":0.008},{"x":0.008,"y":0.234},{"x":0.234,"y":0.631},{"x":0.631,"y":0.251},{"x":0.251,"y":0.236},{"x":0.236,"y":0.41},{"x":0.41,"y":0.164},{"x":0.164,"y":0.522},{"x":0.522,"y":0.978},{"x":0.978,"y":2.269},{"x":2.269,"y":0.1},{"x":0.1,"y":0.005},{"x":0.005,"y":0.009},{"x":0.009,"y":0.861},{"x":0.861,"y":0.354},{"x":0.354,"y":0.035},{"x":0.035,"y":0.021},{"x":0.021,"y":0.53},{"x":0.53,"y":0.548},{"x":0.548,"y":1.588},{"x":1.588,"y":0.28},{"x":0.28,"y":0.301},{"x":0.301,"y":1.394},{"x":1.394,"y":1.428},{"x":1.428,"y":0.868},{"x":0.868,"y":1.213},{"x":1.213,"y":2.311},{"x":2.311,"y":0.01},{"x":0.01,"y":0.258},{"x":0.258,"y":1.014},{"x":1.014,"y":1.098},{"x":1.098,"y":1.046},{"x":1.046,"y":3.479},{"x":3.479,"y":0.886},{"x":0.886,"y":0.011},{"x":0.011,"y":0.108},{"x":0.108,"y":0.01},{"x":0.01,"y":0.021},{"x":0.021,"y":0.009},{"x":0.009,"y":0},{"x":0,"y":0.007},{"x":0.007,"y":0.142},{"x":0.142,"y":0.167},{"x":0.167,"y":1.84},{"x":1.84,"y":0.195},{"x":0.195,"y":0.178},{"x":0.178,"y":4.901},{"x":4.901,"y":4.75},{"x":4.75,"y":0.047},{"x":0.047,"y":1.381},{"x":1.381,"y":2.491},{"x":2.491,"y":0.025},{"x":0.025,"y":0.606},{"x":0.606,"y":0},{"x":0,"y":0.11},{"x":0.11,"y":0.243},{"x":0.243,"y":2.857},{"x":2.857,"y":2.614},{"x":2.614,"y":0.053},{"x":0.053,"y":0.2},{"x":0.2,"y":0.165},{"x":0.165,"y":0},{"x":0,"y":0.757},{"x":0.757,"y":1.871},{"x":1.871,"y":1.623},{"x":1.623,"y":0.017},{"x":0.017,"y":0.876},{"x":0.876,"y":0.21},{"x":0.21,"y":0.002},{"x":0.002,"y":0.004},{"x":0.004,"y":0.474},{"x":0.474,"y":0.156},{"x":0.156,"y":0.001},{"x":0.001,"y":0.103},{"x":0.103,"y":0.795},{"x":0.795,"y":0.212},{"x":0.212,"y":0.129},{"x":0.129,"y":0.316},{"x":0.316,"y":0.811},{"x":0.811,"y":0.002},{"x":0.002,"y":1.446},{"x":1.446,"y":1.605},{"x":1.605,"y":0.093},{"x":0.093,"y":0.139},{"x":0.139,"y":1.005},{"x":1.005,"y":0},{"x":0,"y":0.384},{"x":0.384,"y":0.215},{"x":0.215,"y":1.137},{"x":1.137,"y":0.032},{"x":0.032,"y":0.704},{"x":0.704,"y":0.023},{"x":0.023,"y":0.08},{"x":0.08,"y":0.22},{"x":0.22,"y":1.412},{"x":1.412,"y":1.148},{"x":1.148,"y":0.219},{"x":0.219,"y":0.005},{"x":0.005,"y":0.483},{"x":0.483,"y":0.042},{"x":0.042,"y":0.432},{"x":0.432,"y":2.353},{"x":2.353,"y":4.399},{"x":4.399,"y":1.765},{"x":1.765,"y":0.03},{"x":0.03,"y":1.285},{"x":1.285,"y":0.461},{"x":0.461,"y":0.183},{"x":0.183,"y":0},{"x":0,"y":0.014},{"x":0.014,"y":0.207},{"x":0.207,"y":0.093},{"x":0.093,"y":0.055},{"x":0.055,"y":0.049},{"x":0.049,"y":1.106},{"x":1.106,"y":0.512},{"x":0.512,"y":0.247},{"x":0.247,"y":0.489},{"x":0.489,"y":2.023},{"x":2.023,"y":0.059},{"x":0.059,"y":0.074},{"x":0.074,"y":0.04},{"x":0.04,"y":1.032},{"x":1.032,"y":0.932},{"x":0.932,"y":1.147},{"x":1.147,"y":0.173},{"x":0.173,"y":0.23},{"x":0.23,"y":2.28},{"x":2.28,"y":0.025},{"x":0.025,"y":2.442},{"x":2.442,"y":0.176},{"x":0.176,"y":0.92},{"x":0.92,"y":4.105},{"x":4.105,"y":4.251},{"x":4.251,"y":3.047},{"x":3.047,"y":0.906},{"x":0.906,"y":1.069},{"x":1.069,"y":0.429},{"x":0.429,"y":0.027},{"x":0.027,"y":0.881},{"x":0.881,"y":3.952},{"x":3.952,"y":0.025},{"x":0.025,"y":0.004},{"x":0.004,"y":0.148},{"x":0.148,"y":0.001},{"x":0.001,"y":0.01},{"x":0.01,"y":1.318},{"x":1.318,"y":0.053},{"x":0.053,"y":1.024},{"x":1.024,"y":0.15},{"x":0.15,"y":0.082},{"x":0.082,"y":0.172},{"x":0.172,"y":0.763},{"x":0.763,"y":0.166},{"x":0.166,"y":0.02},{"x":0.02,"y":0.162},{"x":0.162,"y":0.037},{"x":0.037,"y":0.267},{"x":0.267,"y":1.104},{"x":1.104,"y":0.077},{"x":0.077,"y":0.567},{"x":0.567,"y":1.194},{"x":1.194,"y":0.234},{"x":0.234,"y":0.05},{"x":0.05,"y":0.095},{"x":0.095,"y":1.16},{"x":1.16,"y":0.001},{"x":0.001,"y":0.036},{"x":0.036,"y":0.546},{"x":0.546,"y":0.435},{"x":0.435,"y":0.771},{"x":0.771,"y":1.439},{"x":1.439,"y":1.833},{"x":1.833,"y":2.542},{"x":2.542,"y":6.794},{"x":6.794,"y":3.43},{"x":3.43,"y":0.001},{"x":0.001,"y":0.297},{"x":0.297,"y":0.678}]}

Snap gives an intercept of 0.53 and a slope of 0.42. The `lm()` block under the widget prints them with more decimals: 0.527 and 0.418 to three places. The true values we simulated with are \(\omega = 0.6\) and \(\alpha = 0.4\), so 249 pairs are enough to land close.

Put the two estimates together and you get the long-run variance: \(0.527 / (1 - 0.418) = 0.905\), against the true value of 1.0.

=== step === quiz
## Quick check: what the slope and the intercept estimate

The widget's least-squares line has an intercept of 0.53 and a slope of 0.42. What do these two numbers estimate?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The slope is the correlation between one day's return and the next day's return, and the intercept is the long-run variance. ::no
- The intercept estimates omega and the slope estimates alpha, so the long-run variance is the intercept divided by 1 minus the slope, about 0.91. ::ok Yes. The line is fitted to squared shocks, so its intercept is omega, the variance after a day with no shock, and its slope is alpha, the share of yesterday's squared shock that carries into today's variance. Dividing 0.527 by 1 minus 0.418 gives 0.905, close to the true 1.0.
- A slope of 0.42 means that 42% of the days are volatile. ::no Not quite. The line is fitted to squared shocks, not to returns, so the slope is not a correlation between returns. The intercept is the constant omega, the variance after a day with no shock, not the long-run variance. And the slope alpha is the share of yesterday's squared shock that carries into today's variance, not a share of days. The long-run variance comes from the two together: the intercept divided by 1 minus the slope.

=== step === concept
## Testing for ARCH effects with a Ljung-Box test on squared shocks

The slope of \(e_t^2\) on \(e_{t-1}^2\) is roughly the lag 1 autocorrelation of the squared shocks. The lag \(k\) autocorrelation, written \(\rho_k\) (rho), is the correlation of a series with itself \(k\) days earlier, and `acf()` computes it.

So if the variance depends on recent squared shocks, the squared shocks are autocorrelated at several lags. That is what **ARCH effects** are: autocorrelation in the squared shocks.

The code below computes the autocorrelations at lags 1 to 5, for the DAX shocks and for their squares.

```r
# Compare the lag 1 to 5 autocorrelations of the shocks and of the squared shocks
rho_e <- acf(e, lag.max = 10, plot = FALSE)$acf[-1]
rho_sq <- acf(e^2, lag.max = 10, plot = FALSE)$acf[-1]
acf_table <- rbind(shocks = rho_e[1:5], squared_shocks = rho_sq[1:5])
colnames(acf_table) <- paste0("lag", 1:5)
round(acf_table, 3)
#>                 lag1   lag2   lag3  lag4   lag5
#> shocks         0.000 -0.027 -0.010 0.000 -0.032
#> squared_shocks 0.079  0.168  0.075 0.076  0.053
```

The shocks have autocorrelations close to 0, between -0.032 and 0.000. The squared shocks are positive at every lag, from 0.053 to 0.168. So the DAX shocks are uncorrelated, but their squares are not.

Autocorrelations at separate lags are hard to judge one by one. The Ljung-Box test combines the first \(m\) of them into a single statistic:

\[ Q = n(n+2) \sum_{k=1}^{m} \frac{\rho_k^2}{n-k} \]

Here \(n\) is the number of days and \(m\) is the number of lags, which we set to 10. Squaring means positive and negative autocorrelations both count, and the factor \(n(n+2)/(n-k)\) adjusts each lag for the number of pairs behind it.

The null hypothesis is that all \(m\) autocorrelations are 0. Under it, \(Q\) approximately follows a chi-square distribution with \(m\) degrees of freedom. For 10 degrees of freedom the 5% cutoff is 18.31, so a \(Q\) above 18.31 rejects the null at the 5% level.

Let's compute \(Q\) by hand for the shocks and for the squared shocks.

```r
# Compute the Ljung-Box statistic by hand for the shocks and the squared shocks
ljung_q <- function(x, m = 10) {
  n <- length(x)
  rho <- acf(x, lag.max = m, plot = FALSE)$acf[-1]
  n * (n + 2) * sum(rho^2 / (n - 1:m))
}
round(c(shocks = ljung_q(e), squared_shocks = ljung_q(e^2)), 2)

# The 5% cutoff of the chi-square distribution with 10 degrees of freedom
round(qchisq(0.95, df = 10), 2)
#>         shocks squared_shocks
#>           6.37         108.71
#> [1] 18.31
```

Now `Box.test()` does the same in one line. Its output shows the statistic (called X-squared), the degrees of freedom and the p-value.

```r
# Run the Ljung-Box test at 10 lags on the shocks and on the squared shocks
Box.test(e, lag = 10, type = "Ljung-Box")
Box.test(e^2, lag = 10, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  e
#> X-squared = 6.3656, df = 10, p-value = 0.7837
#>
#>
#> 	Box-Ljung test
#>
#> data:  e^2
#> X-squared = 108.71, df = 10, p-value < 2.2e-16
#>
```

Both match the hand computation. For the shocks, \(Q = 6.37\) is below 18.31 and the p-value is 0.78. There is no evidence of a linear pattern in the shocks, so a constant mean was enough.

For the squared shocks, \(Q = 108.71\) is far above 18.31, and the p-value is below 2.2e-16. So we reject the null: the DAX has ARCH effects.

[KEY INSIGHT]
The DAX shocks are uncorrelated but not independent. Knowing yesterday's shock tells you almost nothing about the direction of today's shock, but it does tell you something about its size.

Engle's ARCH-LM test asks the same question through a regression. Regress \(e_t^2\) on its 5 previous values, take \(R^2\) (the share of the variation in \(e_t^2\) that the 5 lags explain), and compute \(LM = n \times R^2\). With no ARCH effects, LM approximately follows a chi-square distribution with 5 degrees of freedom, whose 5% cutoff is 11.07.

In the code, `embed(e^2, 6)` builds a matrix with 6 columns: the squared shock and its lags 1 to 5. That costs 5 days, so \(n\) is 1,854.

```r
# Run the ARCH-LM test: regress each squared shock on its 5 lags and use n times R-squared
lagged <- embed(e^2, 6)
lm_fit <- lm(lagged[, 1] ~ lagged[, -1])
n_lm <- nrow(lagged)
r2 <- summary(lm_fit)$r.squared
lm_stat <- n_lm * r2

cat("n:", n_lm, "\n")
cat("R-squared:", round(r2, 4), "\n")
cat("LM statistic:", round(lm_stat, 2), "\n")
cat("5% cutoff:", round(qchisq(0.95, df = 5), 2), "\n")
cat("p-value:", signif(pchisq(lm_stat, df = 5, lower.tail = FALSE), 2), "\n")
#> n: 1854
#> R-squared: 0.0376
#> LM statistic: 69.71
#> 5% cutoff: 11.07
#> p-value: 1.2e-13
```

The LM statistic is 69.71 against a cutoff of 11.07, with a p-value of 1.2e-13. It gives the same answer as the Ljung-Box test: the squared shocks of the DAX are related to their own past values.

=== step === concept
## Fitting ARCH(1) by maximum likelihood

Least squares was a good way to see the equation. But the standard way to estimate ARCH parameters is maximum likelihood. For any pair \((\omega, \alpha)\), the model assigns a probability density to the shocks we observed. Maximum likelihood picks the pair that makes the observed shocks as probable as possible.

The model says that, given yesterday, the shock \(e_t\) is Normal with mean 0 and variance \(\sigma_t^2 = \omega + \alpha e_{t-1}^2\). So the log of its density on day \(t\) is \(-\tfrac{1}{2}\left[\log(2\pi) + \log \sigma_t^2 + e_t^2 / \sigma_t^2\right]\). Adding this up over days and flipping the sign gives the negative log-likelihood, which we minimise:

\[ -\log L(\omega, \alpha) = \frac{1}{2} \sum_{t=2}^{n} \left[ \log(2\pi) + \log \sigma_t^2 + \frac{e_t^2}{\sigma_t^2} \right] \]

The sum starts at day 2 because day 1 has no yesterday. The last term penalises a day whose shock is big compared with the variance the model expected. The middle term penalises expecting a large variance in the first place, so the two terms work in opposite directions.

The function below is this formula. We evaluate it at three pairs: \((0.5, 0.1)\), \((1, 0)\), and \((\text{var}(e), 0)\), which is the constant-variance model because \(\alpha = 0\).

```r
# Define the ARCH(1) negative log-likelihood and evaluate it at three parameter pairs
nll <- function(par, x) {
  omega <- par[1]
  alpha <- par[2]
  n <- length(x)
  sigma2 <- omega + alpha * x[1:(n - 1)]^2
  0.5 * sum(log(2 * pi) + log(sigma2) + x[2:n]^2 / sigma2)
}

pairs <- rbind(c(0.5, 0.1), c(1, 0), c(var(e), 0))
round(apply(pairs, 1, nll, x = e), 1)
#> [1] 2875.2 2692.6 2691.0
```

Lower is better, so \((1, 0)\) fits the DAX shocks far better than \((0.5, 0.1)\), and the constant-variance model scores 2691.0. Now let's let `optim()` search for the pair with the smallest value.

We also fit the same model with `garch()` from the tseries package. Its argument `order = c(0, 1)` gives 0 GARCH terms and 1 ARCH term: the first number is the GARCH order, which is 0 for a pure ARCH model, and the second is the ARCH order \(q\).

```r
# Minimise the negative log-likelihood with optim() and fit the same model with tseries::garch()
fit_ml <- optim(c(1, 0.1), nll, x = e, method = "L-BFGS-B", lower = c(1e-6, 0))

suppressMessages(library(tseries))
fit1 <- garch(e, order = c(0, 1), trace = FALSE)

estimates <- rbind(optim = fit_ml$par, garch = coef(fit1))
colnames(estimates) <- c("omega", "alpha")
round(estimates, 4)
round(fit_ml$value, 3)
logLik(fit1)
#>        omega  alpha
#> optim 0.9531 0.1012
#> garch 0.9531 0.1012
#> [1] 2674.982
#> 'log Lik.' -2674.982 (df=2)
```

Both methods give \(\omega = 0.9531\) and \(\alpha = 0.1012\). The minimised value 2674.982 is the same number as the log-likelihood `garch()` reports, with the sign flipped. And it is lower than the 2691.0 of the constant-variance model, so letting \(\alpha\) rise above 0 improves the fit.

The lower bounds in `optim()` (\(\omega\) above 0, \(\alpha\) at least 0) are the constraints that keep the variance positive.

Next, let's read the standard errors from `garch()` and compute the long-run variance of the fitted model.

```r
# Read the standard errors and the long-run variance of the fitted ARCH(1)
round(summary(fit1)$coef[, 1:3], 4)
round(unname(coef(fit1)[1] / (1 - coef(fit1)[2])), 4)
#>     Estimate  Std. Error  t value
#> a0    0.9531      0.0161  59.1492
#> a1    0.1012      0.0162   6.2342
#> [1] 1.0604
```

In this output `a0` is \(\omega\) and `a1` is \(\alpha\). The t value of \(\alpha\) is 6.23, so \(\alpha\) is about 6 standard errors above 0. The long-run variance is \(0.9531 / (1 - 0.1012) = 1.0604\), against the sample variance of 1.0611, so the fitted model reproduces the overall variance of the DAX shocks.

Finally, here is the least-squares regression of each squared shock on the previous day's squared shock, run on the DAX shocks.

```r
# Estimate the same two parameters by least squares on the squared shocks
e2_now <- e[-1]^2
e2_before <- e[-length(e)]^2
round(coef(lm(e2_now ~ e2_before)), 3)
#> (Intercept)   e2_before
#>       0.977       0.079
```

Least squares gives \(\omega = 0.977\) and \(\alpha = 0.079\) from the same data. The two methods differ because least squares gives every day's squared shock the same weight, while the likelihood divides each squared shock by that day's variance.

=== step === concept
## How many lags? Checking the standardised residuals

So far we used \(q = 1\) because it is the simplest model. To choose \(q\), we check whether the fitted model has removed the ARCH effects. Divide each shock by its fitted standard deviation \(\hat\sigma_t\):

\[ z_t = \frac{e_t}{\hat\sigma_t} \]

This is the standardised residual. If the model captures the variance, \(z_t\) has a constant variance, and \(z_t^2\) should show no autocorrelation. So we run the Ljung-Box test at 10 lags on \(z_t^2\), and we want a small \(Q\).

We also compute the AIC, the Akaike information criterion: \(-2 \times \text{logLik} + 2 \times (\text{number of parameters})\). Lower is better, because it rewards fit and penalises every parameter. An ARCH(\(q\)) has \(q + 1\) parameters, \(\omega\) and \(q\) alphas. For ARCH(1) the log-likelihood is -2674.982, so the AIC is \(-2 \times (-2674.982) + 2 \times 2 = 5353.96\).

The loop below fits ARCH(1) to ARCH(8). The first \(q\) values of the residuals are `NA`, since those days have no \(q\) shocks before them, so `na.omit()` drops them.

```r
# Fit ARCH(q) for q = 1 to 8 and test the squared standardised residuals of each fit
q_table <- data.frame(q = 1:8, AIC = NA, Q = NA, p = NA)
for (q in 1:8) {
  fit <- garch(e, order = c(0, q), trace = FALSE)
  z <- na.omit(residuals(fit))
  lb <- Box.test(z^2, lag = 10, type = "Ljung-Box")
  q_table$AIC[q] <- round(AIC(fit), 2)
  q_table$Q[q] <- round(lb$statistic, 2)
  q_table$p[q] <- round(lb$p.value, 3)
}
q_table
#>   q     AIC     Q     p
#> 1 1 5353.96 63.12 0.000
#> 2 2 5321.84 14.83 0.138
#> 3 3 5277.54  4.66 0.913
#> 4 4 5216.41  5.99 0.816
#> 5 5 5188.43  4.18 0.939
#> 6 6 5159.37  4.42 0.926
#> 7 7 5137.49  3.77 0.957
#> 8 8 5145.00  1.63 0.998
```

Read the \(Q\) column first, against the cutoff of 18.31. ARCH(1) has \(Q = 63.12\), so its standardised residuals still show ARCH effects. ARCH(2) passes, but only just, with \(Q = 14.83\) and \(p = 0.138\). ARCH(3) passes clearly, with \(Q = 4.66\) and \(p = 0.913\).

So we keep ARCH(3). The chi-square cutoff does not allow for the parameters we estimated, so read these p-values as a guide and not as exact.

The AIC prefers more lags than the residual test does. It drops at every step up to \(q = 7\) (5137.49) and rises at \(q = 8\). So the residual test is passed clearly from \(q = 3\), while the AIC is lowest at \(q = 7\). Either way, the DAX variance needs many lags of past shocks.

[NOTE]
`summary()` on a `garch()` fit prints a Box-Ljung test on the squared residuals at lag 1 only. That is not the 10-lag test above, so it cannot replace it.

Let's read the ARCH(3) fit.

```r
# Read the ARCH(3) coefficients, their sum, the long-run variance and the kurtosis of the residuals
fit3 <- garch(e, order = c(0, 3), trace = FALSE)
z3 <- na.omit(residuals(fit3))
alphas <- coef(fit3)[-1]

round(coef(fit3), 4)
cat("sum of alphas:", round(sum(alphas), 3), "\n")
cat("long-run variance:", round(coef(fit3)[1] / (1 - sum(alphas)), 3), "\n")
cat("kurtosis of z:", round(kurt(z3), 2), "\n")
#>     a0     a1     a2     a3
#> 0.7677 0.0484 0.0746 0.1502
#> sum of alphas: 0.273
#> long-run variance: 1.056
#> kurtosis of z: 12.06
```

The fit is \(\omega = 0.7677\) with weights 0.0484, 0.0746 and 0.1502 on the last three squared shocks. They add up to 0.273, so the long-run variance is \(0.7677 / (1 - 0.273) = 1.056\), against 1.061 for the data.

But one number is still off. The kurtosis of the standardised residuals is 12.06, and it should be 3 if \(z_t\) were Normal. So the Normal assumption for \(z_t\) is too thin-tailed for the DAX. We leave that as it is for now.

=== step === widget
## Reading the fitted conditional variance against the realised shocks

Now let's compare what the ARCH(3) model says with what happened. The plot shows the absolute shock \(|e_t|\) as grey bars and the fitted standard deviation as a green line, for days 1521 to 1740.

```r
# Plot the absolute shocks and the ARCH(3) fitted standard deviation for days 1521 to 1740
fit_sd <- fit3$fitted.values[, 1]
days <- 1521:1740
plot(days, abs(e[days]), type = "h", col = "grey60", xlab = "day", ylab = "absolute shock and fitted sd")
lines(days, fit_sd[days], col = "#1f7a55", lwd = 2)
legend("topleft", legend = c("absolute shock", "fitted sd"), col = c("grey60", "#1f7a55"), lwd = c(1, 2), bty = "n")
```

The first column of `fit3$fitted.values` is the fitted standard deviation, and over these 220 days it runs from 0.88 to 2.79. The line is built from the three shocks before each day, so it moves after a large bar, not on it.

How closely does the fitted standard deviation follow the absolute shock? The code below measures the correlation over the 1,856 days that have a fitted value. It also measures the same correlation for the simulated series, where we know the true standard deviation `sim_sigma`.

```r
# Correlate the fitted sd with the absolute shock, for the DAX and for the simulated series
has_fit <- !is.na(fit_sd)
round(cor(fit_sd[has_fit], abs(e[has_fit])), 3)
round(cor(sim_sigma, abs(sim_e)), 3)
#> [1] 0.215
#> [1] 0.258
```

The correlation is 0.215, which looks low. But \(|e_t| = \sigma_t |z_t|\), so each absolute shock is one random draw scaled by \(\sigma_t\). Even with the true standard deviation, the simulated series only reaches 0.258.

A better check is calibration. The code below sorts the days by fitted variance, splits them into five bins with the same number of days, and averages the fitted variance and the realised squared shock in each bin.

```r
# Bin the days by fitted variance into five equal-count groups and average each bin
fit_var <- fit_sd[has_fit]^2
bin <- cut(fit_var, breaks = quantile(fit_var, probs = seq(0, 1, 0.2)), include.lowest = TRUE, labels = 1:5)
bins <- data.frame(
  mean_fitted_var = tapply(fit_var, bin, mean),
  mean_realised_e2 = tapply(e[has_fit]^2, bin, mean)
)
round(bins, 3)
table(bin)
#>   mean_fitted_var mean_realised_e2
#> 1           0.794            0.924
#> 2           0.848            0.615
#> 3           0.919            0.993
#> 4           1.048            1.036
#> 5           1.677            1.738
#> bin
#>   1   2   3   4   5
#> 372 371 371 371 371
```

If the model is calibrated, the realised column should match the fitted column in every bin. The widget below fits a straight line through these five points, with the mean fitted variance on the x axis and the mean realised squared shock on the y axis. This is called a Mincer-Zarnowitz regression, and a perfectly calibrated model gives an intercept of 0 and a slope of 1.

::widget ols-fit {"points":[{"x":0.7936,"y":0.9242},{"x":0.848,"y":0.615},{"x":0.9189,"y":0.9931},{"x":1.048,"y":1.0364},{"x":1.6765,"y":1.7375}]}

Snap gives an intercept of -0.08 and a slope of 1.08. The `lm()` block under the widget prints them with more decimals: -0.082 and 1.081 to three places. So the mean realised squared shock tracks the mean fitted variance across the bins.

The three lowest bins are noisy: their fitted variances rise (0.794, 0.848, 0.919) but their realised values do not (0.924, 0.615, 0.993). The highest bin is close, with a fitted variance of 1.677 and a realised value of 1.738.

=== step === quiz
## Quick check: what the calibration line and the correlation say

The five-bin calibration line has an intercept of -0.08 and a slope of 1.08. The fitted standard deviation has a correlation of 0.215 with the absolute shock, and 0.258 for the simulated series with its true standard deviation. Which interpretation is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- A slope above 1 means the fitted variance is too high, so the model overstates the variance. ::no
- A slope near 1 and an intercept near 0 mean the average realised squared shock tracks the average fitted variance, and a correlation near 0.2 is expected because the absolute shock is one random draw scaled by the standard deviation. ::ok Yes. The calibration line compares averages over 371 or 372 days, where the noise of single days cancels out. The correlation compares single days, and the simulated series shows that even the true standard deviation only reaches 0.258.
- A correlation of 0.2 means a poor model, because a good model would give a correlation near 1. ::no
- The fitted standard deviation predicts whether tomorrow's return will be positive or negative. ::no Look at what each number measures. A slope of 1.08 is close to 1, which says the average realised squared shock rises about one for one with the fitted variance. The correlation is low even with the true standard deviation (0.258), because the absolute shock is the standard deviation times a random draw. And the equation uses squared shocks, so the sign of tomorrow's return is not modelled at all.

=== step === tryit
## Your turn: test the SMI shocks for ARCH effects

The `EuStockMarkets` data also has the SMI, the Swiss stock index. Build its daily returns and shocks the way you did for the DAX. Then run the Ljung-Box test with 10 lags on the shocks and on their squares.

```r
# Test the second index in this data for ARCH effects.
# Take its closing prices, compute the returns as 100 times the change in the log price,
# and subtract the mean to get the shocks.
# Run the Ljung-Box test at 10 lags on the shocks, then on their squares.
# Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*SMI)(?=[\\s\\S]*[\\^]\\s*2)(?=[\\s\\S]*Box[.]test[(][\\s\\S]*?(lag\\s*=\\s*10|,\\s*10\\s*[,)]))", "gate": true, "difficulty": "intermediate", "ok": "Right: the SMI shocks give Q = 12.49 (p = 0.25), below the 5% cutoff of 18.31, so there is no pattern in the shocks themselves. Their squares give Q = 97.88 (p below 2.2e-16), far above the cutoff, so the SMI has ARCH effects too.", "no": "Build the shocks first: 100 * diff(log(...)) of the SMI column, minus its mean. Then call Box.test() with lag = 10 and type = \"Ljung-Box\" once on the shocks and once on their squares, written as the shocks raised to the power 2."}
::solution
```r
# Test the SMI shocks and their squares for autocorrelation with Ljung-Box at 10 lags
smi <- as.numeric(EuStockMarkets[, "SMI"])
smi_ret <- 100 * diff(log(smi))
smi_e <- smi_ret - mean(smi_ret)
Box.test(smi_e, lag = 10, type = "Ljung-Box")
Box.test(smi_e^2, lag = 10, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  smi_e
#> X-squared = 12.489, df = 10, p-value = 0.2537
#>
#>
#> 	Box-Ljung test
#>
#> data:  smi_e^2
#> X-squared = 97.882, df = 10, p-value < 2.2e-16
#>
```

The SMI behaves like the DAX. Its shocks show no pattern, but the squares of its shocks do.

=== step === concept
## References

- [Autoregressive Conditional Heteroscedasticity with Estimates of the Variance of United Kingdom Inflation](https://doi.org/10.2307/1912773) - Engle, R. F. (1982), Econometrica 50(4), 987-1007. The paper that introduced the ARCH model and the LM test for ARCH effects.
- [On a Measure of Lack of Fit in Time Series Models](https://doi.org/10.1093/biomet/65.2.297) - Ljung, G. M. and Box, G. E. P. (1978), Biometrika 65(2), 297-303. The source of the Ljung-Box statistic.
- Analysis of Financial Time Series, 3rd ed. - Tsay, R. S. (2010), Wiley. Chapter 3 covers conditional heteroscedastic models.
- Glossary to ARCH (GARCH) - Bollerslev, T. (2010), in Volatility and Time Series Econometrics: Essays in Honor of Robert Engle, Oxford University Press. A dictionary of the ARCH family of models.
- [tseries: Time Series Analysis and Computational Finance](https://cran.r-project.org/package=tseries) - Trapletti, A. and Hornik, K., the R package documentation for `garch()`.

=== step === complete
## Quick recap

You wrote the ARCH equation, simulated a series from it, tested a real return series for ARCH effects and fitted the model. To summarize:

- The ARCH(q) equation says today's conditional variance is \(\omega\) plus weights on the last \(q\) squared shocks. With \(\omega = 0.6\) and \(\alpha = 0.4\), a shock of 4 gives a variance of 7.0, against 0.6 after a shock of 0.
- The long-run variance is \(\omega / (1 - \alpha_1 - \dots - \alpha_q)\). For those two values it is 1.0.
- The Ljung-Box test on the DAX shocks gives \(Q = 6.37\), so there is no pattern. On the squared shocks it gives \(Q = 108.71\), so there are ARCH effects. The ARCH-LM test agrees.
- Maximum likelihood gives \(\omega = 0.9531\) and \(\alpha = 0.1012\) for ARCH(1), with `optim()` and with `garch()` alike. The standardised residuals of ARCH(1) still have ARCH effects (\(Q = 63.12\)), and those of ARCH(3) do not (\(Q = 4.66\)).
- The ARCH(3) fitted variance tracks the realised squared shocks: the five-bin calibration line has a slope of 1.08.

So the ARCH equation works, but the DAX needs 3 to 7 lags of it. The next part adds yesterday's variance to the equation, so that far fewer terms are needed.
