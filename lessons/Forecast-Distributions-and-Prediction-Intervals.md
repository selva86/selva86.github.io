---
title: "Forecasting Toolbox Lesson 3: Forecast distributions and prediction intervals"
catalog_blurb: "See what an 80 percent forecast interval means, and why it widens over time."
description: "Learn what forecast() actually returns as a distribution, how hilo() reads its prediction interval, and why bootstrapping helps when residuals fail normality."
keywords: "forecast distribution in r, hilo prediction interval, fable prediction intervals, sigma-h formula, bootstrapped forecast interval, forecast bootstrap TRUE, confidence vs prediction interval, naive forecast interval r"
post_type: "LESSON"
curriculum_id: "5.30.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-toolbox"
course_title: "Forecasting Toolbox"
course_lesson: "3"
course_total: "6"
course_landing: "Forecasting-Toolbox-Course.html"
course_next: "Point-Forecasts-vs-the-Whole-Distribution.html"
course_prev: "Residual-Diagnostics-and-the-Ljung-Box-Test.html"
---

=== step === cover
## Forecast distributions and prediction intervals

Today let's understand forecast distributions and prediction intervals, using simple and practical examples.

Between 1821 and 1934, trappers in Canada's Mackenzie River district counted how many lynx pelts they trapped every year. That's 114 years of counts, as few as 39 pelts in a quiet year and as many as 6991 in a good one, ending at 3396 in 1934. It's a built-in R dataset called lynx.

::widget chart-plotter {"data":[{"x":1821,"y":269},{"x":1822,"y":321},{"x":1823,"y":585},{"x":1824,"y":871},{"x":1825,"y":1475},{"x":1826,"y":2821},{"x":1827,"y":3928},{"x":1828,"y":5943},{"x":1829,"y":4950},{"x":1830,"y":2577},{"x":1831,"y":523},{"x":1832,"y":98},{"x":1833,"y":184},{"x":1834,"y":279},{"x":1835,"y":409},{"x":1836,"y":2285},{"x":1837,"y":2685},{"x":1838,"y":3409},{"x":1839,"y":1824},{"x":1840,"y":409},{"x":1841,"y":151},{"x":1842,"y":45},{"x":1843,"y":68},{"x":1844,"y":213},{"x":1845,"y":546},{"x":1846,"y":1033},{"x":1847,"y":2129},{"x":1848,"y":2536},{"x":1849,"y":957},{"x":1850,"y":361},{"x":1851,"y":377},{"x":1852,"y":225},{"x":1853,"y":360},{"x":1854,"y":731},{"x":1855,"y":1638},{"x":1856,"y":2725},{"x":1857,"y":2871},{"x":1858,"y":2119},{"x":1859,"y":684},{"x":1860,"y":299},{"x":1861,"y":236},{"x":1862,"y":245},{"x":1863,"y":552},{"x":1864,"y":1623},{"x":1865,"y":3311},{"x":1866,"y":6721},{"x":1867,"y":4254},{"x":1868,"y":687},{"x":1869,"y":255},{"x":1870,"y":473},{"x":1871,"y":358},{"x":1872,"y":784},{"x":1873,"y":1594},{"x":1874,"y":1676},{"x":1875,"y":2251},{"x":1876,"y":1426},{"x":1877,"y":756},{"x":1878,"y":299},{"x":1879,"y":201},{"x":1880,"y":229},{"x":1881,"y":469},{"x":1882,"y":736},{"x":1883,"y":2042},{"x":1884,"y":2811},{"x":1885,"y":4431},{"x":1886,"y":2511},{"x":1887,"y":389},{"x":1888,"y":73},{"x":1889,"y":39},{"x":1890,"y":49},{"x":1891,"y":59},{"x":1892,"y":188},{"x":1893,"y":377},{"x":1894,"y":1292},{"x":1895,"y":4031},{"x":1896,"y":3495},{"x":1897,"y":587},{"x":1898,"y":105},{"x":1899,"y":153},{"x":1900,"y":387},{"x":1901,"y":758},{"x":1902,"y":1307},{"x":1903,"y":3465},{"x":1904,"y":6991},{"x":1905,"y":6313},{"x":1906,"y":3794},{"x":1907,"y":1836},{"x":1908,"y":345},{"x":1909,"y":382},{"x":1910,"y":808},{"x":1911,"y":1388},{"x":1912,"y":2713},{"x":1913,"y":3800},{"x":1914,"y":3091},{"x":1915,"y":2985},{"x":1916,"y":3790},{"x":1917,"y":674},{"x":1918,"y":81},{"x":1919,"y":80},{"x":1920,"y":108},{"x":1921,"y":229},{"x":1922,"y":399},{"x":1923,"y":1132},{"x":1924,"y":2432},{"x":1925,"y":3574},{"x":1926,"y":2935},{"x":1927,"y":1537},{"x":1928,"y":529},{"x":1929,"y":485},{"x":1930,"y":662},{"x":1931,"y":1000},{"x":1932,"y":1590},{"x":1933,"y":2657},{"x":1934,"y":3396}],"geoms":["line","point"],"x":"Year","y":"Trappings"}

Look at that swing, from 39 pelts some years to 6991 in others. Now fit the simplest forecasting model there is to this series, a NAIVE model, whose whole rule is to repeat the last observed count forever. Then forecast ten years past 1934.

```r
# Set the print width, build the lynx series as a tsibble, fit a NAIVE model and forecast 10 years ahead
options(width = 200)
library(tsibble)
library(fable)
library(fabletools)
library(ggplot2)

lynx_df <- data.frame(Year = 1821:1934, Trappings = as.numeric(lynx))
lx <- as_tsibble(lynx_df, index = Year)

fit <- lx |> model(Naive = NAIVE(Trappings))
fc <- fit |> forecast(h = 10)

suppressWarnings(autoplot(fc, lx) + labs(y = "Trappings", title = "Lynx pelts trapped, 1821-1934, plus a 10-year NAIVE forecast"))
```

Look at the plot. The point forecast, the line past 1934, sits perfectly flat at 3396 for all ten years. But the shaded band around it fans out wider the further out you look, even though the point forecast itself never moves. That flat line plus a widening band around it is exactly what a prediction interval looks like.

=== step === concept
## A forecast is a distribution, not one number

fc, the object forecast() just handed back, does not hold ten plain numbers. Print it and look at the Trappings column.

```r
# Print the fable and look at the Trappings column
print(fc)
#> # A fable: 10 x 4 [1Y]
#> # Key:     .model [1]
#>    .model  Year        Trappings .mean
#>    <chr>  <dbl>           <dist> <dbl>
#>  1 Naive   1935 N(3396, 1409724)  3396
#>  2 Naive   1936 N(3396, 2819448)  3396
#>  3 Naive   1937 N(3396, 4229171)  3396
#>  4 Naive   1938 N(3396, 5638895)  3396
#>  5 Naive   1939   N(3396, 7e+06)  3396
#>  6 Naive   1940 N(3396, 8458343)  3396
#>  7 Naive   1941 N(3396, 9868067)  3396
#>  8 Naive   1942 N(3396, 1.1e+07)  3396
#>  9 Naive   1943 N(3396, 1.3e+07)  3396
#> 10 Naive   1944 N(3396, 1.4e+07)  3396
```

Every row of Trappings prints as N(mean, variance), R's shorthand for a Normal distribution: a bell curve centered on the first number, spread out according to the second, the variance. At h = 1, 1935, that's N(3396, 1409724). At h = 10, 1944, it's N(3396, 1.4e+07), the variance a full ten times bigger.

.mean pulls out just the center of each distribution for convenience, and it reads 3396 at every single horizon, since NAIVE always repeats the last observed count. But .mean is only ever half the story. forecast() actually hands back a full distribution at every horizon, and it's the variance climbing in that Trappings column, not anything in .mean, that is behind the fan you saw widen in the cover plot.

=== step === widget
## The naive forecast repeats the last observed count

See that same forecast plotted against the full history, and play with how it's drawn.

::widget chart-plotter {"data":[{"x":1821,"y":269,"fill":"historical"},{"x":1822,"y":321,"fill":"historical"},{"x":1823,"y":585,"fill":"historical"},{"x":1824,"y":871,"fill":"historical"},{"x":1825,"y":1475,"fill":"historical"},{"x":1826,"y":2821,"fill":"historical"},{"x":1827,"y":3928,"fill":"historical"},{"x":1828,"y":5943,"fill":"historical"},{"x":1829,"y":4950,"fill":"historical"},{"x":1830,"y":2577,"fill":"historical"},{"x":1831,"y":523,"fill":"historical"},{"x":1832,"y":98,"fill":"historical"},{"x":1833,"y":184,"fill":"historical"},{"x":1834,"y":279,"fill":"historical"},{"x":1835,"y":409,"fill":"historical"},{"x":1836,"y":2285,"fill":"historical"},{"x":1837,"y":2685,"fill":"historical"},{"x":1838,"y":3409,"fill":"historical"},{"x":1839,"y":1824,"fill":"historical"},{"x":1840,"y":409,"fill":"historical"},{"x":1841,"y":151,"fill":"historical"},{"x":1842,"y":45,"fill":"historical"},{"x":1843,"y":68,"fill":"historical"},{"x":1844,"y":213,"fill":"historical"},{"x":1845,"y":546,"fill":"historical"},{"x":1846,"y":1033,"fill":"historical"},{"x":1847,"y":2129,"fill":"historical"},{"x":1848,"y":2536,"fill":"historical"},{"x":1849,"y":957,"fill":"historical"},{"x":1850,"y":361,"fill":"historical"},{"x":1851,"y":377,"fill":"historical"},{"x":1852,"y":225,"fill":"historical"},{"x":1853,"y":360,"fill":"historical"},{"x":1854,"y":731,"fill":"historical"},{"x":1855,"y":1638,"fill":"historical"},{"x":1856,"y":2725,"fill":"historical"},{"x":1857,"y":2871,"fill":"historical"},{"x":1858,"y":2119,"fill":"historical"},{"x":1859,"y":684,"fill":"historical"},{"x":1860,"y":299,"fill":"historical"},{"x":1861,"y":236,"fill":"historical"},{"x":1862,"y":245,"fill":"historical"},{"x":1863,"y":552,"fill":"historical"},{"x":1864,"y":1623,"fill":"historical"},{"x":1865,"y":3311,"fill":"historical"},{"x":1866,"y":6721,"fill":"historical"},{"x":1867,"y":4254,"fill":"historical"},{"x":1868,"y":687,"fill":"historical"},{"x":1869,"y":255,"fill":"historical"},{"x":1870,"y":473,"fill":"historical"},{"x":1871,"y":358,"fill":"historical"},{"x":1872,"y":784,"fill":"historical"},{"x":1873,"y":1594,"fill":"historical"},{"x":1874,"y":1676,"fill":"historical"},{"x":1875,"y":2251,"fill":"historical"},{"x":1876,"y":1426,"fill":"historical"},{"x":1877,"y":756,"fill":"historical"},{"x":1878,"y":299,"fill":"historical"},{"x":1879,"y":201,"fill":"historical"},{"x":1880,"y":229,"fill":"historical"},{"x":1881,"y":469,"fill":"historical"},{"x":1882,"y":736,"fill":"historical"},{"x":1883,"y":2042,"fill":"historical"},{"x":1884,"y":2811,"fill":"historical"},{"x":1885,"y":4431,"fill":"historical"},{"x":1886,"y":2511,"fill":"historical"},{"x":1887,"y":389,"fill":"historical"},{"x":1888,"y":73,"fill":"historical"},{"x":1889,"y":39,"fill":"historical"},{"x":1890,"y":49,"fill":"historical"},{"x":1891,"y":59,"fill":"historical"},{"x":1892,"y":188,"fill":"historical"},{"x":1893,"y":377,"fill":"historical"},{"x":1894,"y":1292,"fill":"historical"},{"x":1895,"y":4031,"fill":"historical"},{"x":1896,"y":3495,"fill":"historical"},{"x":1897,"y":587,"fill":"historical"},{"x":1898,"y":105,"fill":"historical"},{"x":1899,"y":153,"fill":"historical"},{"x":1900,"y":387,"fill":"historical"},{"x":1901,"y":758,"fill":"historical"},{"x":1902,"y":1307,"fill":"historical"},{"x":1903,"y":3465,"fill":"historical"},{"x":1904,"y":6991,"fill":"historical"},{"x":1905,"y":6313,"fill":"historical"},{"x":1906,"y":3794,"fill":"historical"},{"x":1907,"y":1836,"fill":"historical"},{"x":1908,"y":345,"fill":"historical"},{"x":1909,"y":382,"fill":"historical"},{"x":1910,"y":808,"fill":"historical"},{"x":1911,"y":1388,"fill":"historical"},{"x":1912,"y":2713,"fill":"historical"},{"x":1913,"y":3800,"fill":"historical"},{"x":1914,"y":3091,"fill":"historical"},{"x":1915,"y":2985,"fill":"historical"},{"x":1916,"y":3790,"fill":"historical"},{"x":1917,"y":674,"fill":"historical"},{"x":1918,"y":81,"fill":"historical"},{"x":1919,"y":80,"fill":"historical"},{"x":1920,"y":108,"fill":"historical"},{"x":1921,"y":229,"fill":"historical"},{"x":1922,"y":399,"fill":"historical"},{"x":1923,"y":1132,"fill":"historical"},{"x":1924,"y":2432,"fill":"historical"},{"x":1925,"y":3574,"fill":"historical"},{"x":1926,"y":2935,"fill":"historical"},{"x":1927,"y":1537,"fill":"historical"},{"x":1928,"y":529,"fill":"historical"},{"x":1929,"y":485,"fill":"historical"},{"x":1930,"y":662,"fill":"historical"},{"x":1931,"y":1000,"fill":"historical"},{"x":1932,"y":1590,"fill":"historical"},{"x":1933,"y":2657,"fill":"historical"},{"x":1934,"y":3396,"fill":"historical"},{"x":1935,"y":3396,"fill":"forecast"},{"x":1936,"y":3396,"fill":"forecast"},{"x":1937,"y":3396,"fill":"forecast"},{"x":1938,"y":3396,"fill":"forecast"},{"x":1939,"y":3396,"fill":"forecast"},{"x":1940,"y":3396,"fill":"forecast"},{"x":1941,"y":3396,"fill":"forecast"},{"x":1942,"y":3396,"fill":"forecast"},{"x":1943,"y":3396,"fill":"forecast"},{"x":1944,"y":3396,"fill":"forecast"}],"geoms":["line","point"],"x":"Year","y":"Trappings","code":{"line":"ggplot(lynx_fc, aes(Year, Trappings, color = series)) +\n  geom_line() +\n  geom_point()"}}

Toggle between the line and point views. The historical counts swing all over the place across those 114 years, from 39 up to 6991. But every one of the ten forecasted years sits at exactly the same height, 3396. That flat run is exactly what a NAIVE forecast is: not a guess that the future looks like the past, just a repeat of the single last number, forever.

=== step === concept
## hilo() and what an 80 percent interval really means

fc's distribution column holds everything, but pulling a plain number range out of N(3396, 1409724) by eye is not practical. hilo() does that pulling for you, at whatever levels you name.

```r
# Read the 80 and 95 percent prediction intervals at h = 1 and h = 10
library(dplyr)
hl <- hilo(fc, level = c(80, 95))
hl |> filter(Year %in% c(1935, 1944))
#> # A tsibble: 2 x 6 [1Y]
#> # Key:       .model [1]
#>   .model  Year        Trappings .mean                   `80%`
#>   <chr>  <dbl>           <dist> <dbl>                  <hilo>
#> 1 Naive   1935 N(3396, 1409724)  3396 [ 1874.391, 4917.609]80
#> 2 Naive   1944 N(3396, 1.4e+07)  3396 [-1415.751, 8207.751]80
#>                     `95%`
#>                    <hilo>
#> 1 [ 1068.900,  5723.10]95
#> 2 [-3962.937, 10754.94]95
```

For 1935, the very first year out, the 80 percent interval already runs from about 1874 to 4918 pelts, and the 95 percent one from about 1069 to 5723. By 1944, ten years out, the 80 percent interval runs from about -1416 to 8208.

Here is exactly what "80 percent" means: 80 percent of the model's distribution for that year falls between those two bounds. It does not mean there's an 80 percent chance the real 1935 count lands exactly on the point forecast, 3396. It also does not mean the forecast is "wrong 20 percent of the time" in this one particular year: the real count for 1935 either lands inside that range or it does not, and 80 percent describes the model's distribution, computed once, before any real count ever comes in.

=== step === quiz
## Quick check: what does an 80 percent prediction interval mean

hilo(fc, level = c(80, 95)) gave an 80 percent interval of about 1874 to 4918 pelts for 1935.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- There's an 80 percent chance the real 1935 count lands exactly on the point forecast, 3396. ::no
- 80 percent of the model's distribution for 1935 falls between 1874 and 4918 pelts. The real count could still land outside that range. ::ok Right. hilo() reads the model's full distribution for 1935, N(3396, 1409724), and reports the range holding 80 percent of that distribution's probability. It never claims anything about the point forecast being exactly right, and the real count is still free to land in the other 20 percent.
- The forecast is only wrong 20 percent of the time, in this one particular year. ::no
- A wider interval next year would mean the model has gotten worse at forecasting. ::no None of these read the interval correctly. It is not a probability that the point forecast, 3396, comes out exactly right, and it is not a claim about how often this one particular year's forecast misses. It is the range holding 80 percent of the model's distribution for that year, fixed the moment the model is fit, before any real count comes in.

=== step === concept
## The sigma-h formula for the naive method, worked by hand

Where does that variance in N(3396, 1409724) actually come from? Pull the model's own residuals with augment() and find out.

```r
# Pull the model's innovation residuals and compute their root-mean-square, the model's sigma-hat
aug <- augment(fit)
head(aug)
#> # A tsibble: 6 x 6 [1Y]
#> # Key:       .model [1]
#>   .model  Year Trappings .fitted .resid .innov
#>   <chr>  <int>     <dbl>   <dbl>  <dbl>  <dbl>
#> 1 Naive   1821       269      NA     NA     NA
#> 2 Naive   1822       321     269     52     52
#> 3 Naive   1823       585     321    264    264
#> 4 Naive   1824       871     585    286    286
#> 5 Naive   1825      1475     871    604    604
#> 6 Naive   1826      2821    1475   1346   1346

innov <- aug$.innov
innov <- innov[!is.na(innov)]
sigma_hat <- sqrt(mean(innov^2))
round(sigma_hat, 1)
#> [1] 1187.3
```

.innov is the innovation residual: the one-step miss between a year's real count and what the model predicted for it from the year before, 52 pelts for 1822, 264 for 1823, and so on across all 113 non-missing years (1821 has no prior year to predict from, so it's NA). sigma_hat, 1187.3, is the root-mean-square of every one of those misses: the typical size of a one-step miss, in pelts, treating a miss in either direction the same way.

sigma_hat is the model's whole forecast uncertainty in one number, but that number is for one step ahead. For the naive method, the spread at any horizon h follows one formula:

$$\sigma_h = \hat\sigma\sqrt{h}$$

Check it against fable's own hilo() bounds.

```r
# Compute sigma_h at h = 1 and h = 10, then the 80 percent bounds by hand, and compare with fable's own hilo()
qz80 <- qnorm(0.9)
round(qz80, 4)
#> [1] 1.2816

point_forecast <- tail(lx$Trappings, 1)
point_forecast
#> [1] 3396

for (h in c(1, 10)) {
  sigma_h <- sigma_hat * sqrt(h)
  cat("h =", h, " sigma_h =", round(sigma_h, 1),
      " 80% by hand = [", round(point_forecast - qz80 * sigma_h, 1), ",",
      round(point_forecast + qz80 * sigma_h, 1), "]\n")
}
#> h = 1  sigma_h = 1187.3  80% by hand = [ 1874.4 , 4917.6 ]
#> h = 10  sigma_h = 3754.6  80% by hand = [ -1415.8 , 8207.8 ]
```

qnorm(0.9) is 1.2816, not qnorm(0.8): an 80 percent interval leaves 20 percent outside it, split evenly as 10 percent past each edge, so the cutoff has to sit at the 90th percentile of a standard normal. Both by-hand bounds land right on top of hilo()'s own numbers, 1874.4 to 4917.6 at h = 1 and -1415.8 to 8207.8 at h = 10. That single formula, sigma_hat times sqrt(h), is the whole engine behind the naive method's growing interval.

Every benchmark method scales its own sigma_hat the same general way, just with a different factor inside the square root:

- Mean method: \(\sigma_h = \hat\sigma\sqrt{1 + 1/T}\), where T is the number of observations the mean was estimated from.
- Seasonal naive: \(\sigma_h = \hat\sigma\sqrt{\lfloor (h-1)/m \rfloor + 1}\), where m is the season length.
- Drift: \(\sigma_h = \hat\sigma\sqrt{h(1 + h/T)}\), which grows fastest of the four since it carries the trend's own uncertainty too.

=== step === concept
## Why the interval widens with the horizon

sqrt(h) is not an arbitrary shape. It comes straight from how a naive forecast is actually built, one year at a time.

Forecasting 1935 needs one new innovation past the last real count. Forecasting 1936 needs that same 1935 innovation plus a second, independent one for 1936. By 1944, the forecast has stacked up ten independent innovations, each with the same standard deviation, sigma_hat. Independent uncertainties do not add up one at a time. Their variances add, so the combined standard deviation grows as the square root of how many there are, sigma_hat times sqrt(h).

See it in the actual widths.

```r
# Compare the 80 percent interval width at h = 1 and h = 10, and check the ratio against sqrt(10)
sigma_1 <- sigma_hat * sqrt(1)
sigma_10 <- sigma_hat * sqrt(10)
width_1 <- 2 * qz80 * sigma_1
width_10 <- 2 * qz80 * sigma_10
round(c(width_1 = width_1, width_10 = width_10, ratio = width_10 / width_1, sqrt_10 = sqrt(10)), 3)
#>  width_1 width_10    ratio  sqrt_10 
#> 3043.218 9623.501    3.162    3.162
```

The 80 percent interval is about 3043 pelts wide at h = 1 and about 9624 pelts wide at h = 10, a ratio of 3.162. sqrt(10) is 3.162 too. The interval did not widen because the model got worse at forecasting ten years out than one year out; it is the exact same model, the exact same sigma_hat. It widened because ten years out has ten stacked-up innovations behind it instead of one, and that is what sqrt(h) is counting.

=== step === widget
## Why more history cannot shrink a forecast interval

Something else is worth separating out here, since the two get confused constantly. A confidence interval and a prediction interval answer different questions, and only one of them shrinks when you collect more data.

The widget below is not the lynx series. It builds its own small linear regression example, with a slider for n, the sample size behind it.

::widget regression-intervals {}

Drag n up. The confidence band, the range for the AVERAGE outcome, narrows as n grows, the same way more lynx history would narrow how precisely you could pin down the series' long-run average level. But the prediction band next to it barely moves, since it has to cover one future observation's own spread, not the precision of an average. That is exactly what the naive model's interval is: a prediction interval on one future count, not a confidence interval on a mean. No amount of extra lynx history would shrink it. Only forecasting fewer years ahead does that.

=== step === concept
## Bootstrapped intervals when the residuals are not normal

Every bound computed so far assumed the innovations follow a normal distribution, the bell curve that sigma_hat times qnorm() draws from. Check that assumption directly with a Shapiro-Wilk test, whose null hypothesis is that the data came from a normal distribution.

```r
# Test whether the naive model's innovation residuals are normally distributed
shapiro.test(innov)
#>
#> 	Shapiro-Wilk normality test
#>
#> data:  innov
#> W = 0.95232, p-value = 0.0005031
```

p = 0.0005 is far below the usual 0.05 cutoff, so reject the null: the lynx model's innovations are not normally distributed. That is not a surprise for a series that swings this much, from 39 to 6991 pelts, but it does mean every sigma_hat times qnorm() bound computed so far rests on an assumption this data does not actually satisfy.

forecast() has a fix that does not need that assumption at all: bootstrapping. Instead of drawing from a theoretical normal curve, it resamples the model's own 113 real innovations, with replacement, to build simulated future paths, one thousand of them here, and reads the interval straight off where those paths actually land.

```r
# Simulate 1000 possible future paths by resampling the residuals, then read the 80 percent interval off them
set.seed(123)
fc_boot <- fit |> forecast(h = 10, bootstrap = TRUE, times = 1000)

hl_boot <- hilo(fc_boot, level = 80)
hl_boot |> filter(Year %in% c(1935, 1944))
#> # A tsibble: 2 x 5 [1Y]
#> # Key:       .model [1]
#>   .model  Year    Trappings .mean                   `80%`
#>   <chr>  <dbl>       <dist> <dbl>                  <hilo>
#> 1 Naive   1935 sample[1000] 3420. [ 1877.327, 4668.327]80
#> 2 Naive   1944 sample[1000] 3490. [-1486.526, 8512.374]80
```

At h = 1, the bootstrapped 80 percent interval, 1877 to 4668, is narrower on the upper side than the normal-based interval, 1874 to 4918. At h = 10, it is wider on both sides instead, -1487 to 8512 against -1416 to 8208. Neither difference is a mistake. The real innovations carry their own shape, a bit more room on the downside than the upside, and resampling them straight into simulated future paths carries that real shape forward, instead of forcing every bound through one symmetric bell curve that this data has already failed to fit.

=== step === quiz
## Quick check: putting the forecast distribution together

fc's 80 percent interval was about 3043 pelts wide at h = 1 and about 9624 pelts wide at h = 10, a ratio matching sqrt(10). The regression-intervals widget showed that more data narrows a confidence band on a mean, but never a prediction band's floor.

What best explains why the naive model's interval got about 3.16 times wider from h = 1 to h = 10?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The model gets less accurate the further out it forecasts, which is why its uncertainty keeps growing. ::no
- Each additional year out adds one more independent innovation of size sigma_hat, and independent uncertainties combine as the square root of how many there are, not one at a time. ::ok Right. sigma_hat, about 1187.3 pelts, is one fixed number, estimated once from the model's residuals. It does not change with horizon, and it is not a sign of the model "getting worse". What changes is how many independent innovations have piled up by that horizon, one at h = 1, ten at h = 10, and standard deviations from independent shocks combine as the square root of their count: sqrt(10) is about 3.16, exactly the ratio you computed.
- If the lynx series had 500 years of history instead of 114, the 10-year-ahead interval would end up about as narrow as the 1-year-ahead one. ::no
- fable recalculates a fresh sigma_hat at every horizon, and sigma_hat happens to grow with h. ::no None of these explain what actually happened. sigma_hat is one number, fixed once the model is fit, not recalculated at each horizon and not evidence the model is "getting worse". More history would tighten a confidence interval on a mean, exactly what the regression-intervals widget showed, but a prediction interval never shrinks that way: it always has to cover one future observation's own spread, and only a shorter horizon narrows that. The real reason the interval widens is that each extra year out stacks up one more independent innovation of size sigma_hat, and independent uncertainties combine as the square root of their count.

=== step === tryit
## Your turn: build a prediction interval for a new horizon

Every naive prediction interval on this page came from the same two numbers: sigma_hat, 1187.3, and the point forecast, 3396. Use them to build the 95 percent interval for a horizon this page never showed, h = 5.

A 95 percent interval needs qnorm(0.975), not qnorm(0.95), the same reason the 80 percent interval needed qnorm(0.9): the missing 5 percent splits evenly between both tails, 2.5 percent past each edge.

```r
# sigma_hat and point_forecast, the naive model's own numbers, set again here
sigma_hat <- 1187.3
point_forecast <- 3396

# Compute sigma_h for h = 5, then the 95 percent interval:
# sigma_h5 <- sigma_hat * sqrt(5)
# point_forecast + c(-1, 1) * qnorm(0.975) * sigma_h5
# Two lines. Press Check when you have them.
```
::check {"regex": "sqrt[(]\\s*5\\s*[)][\\s\\S]*qnorm[(]\\s*0\\.975\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. sigma_h(5) is 1187.3 times the square root of 5, about 2654.9, and 3396 plus or minus qnorm(0.975) times that gives roughly -1807.5 to 8599.5 pelts. Notice the lower bound has gone negative, an impossible pelt count. That is the normal-based formula's own limit, nothing stops sigma_hat times a z-value from crossing zero once the horizon is long enough, which is one more reason a bootstrapped interval, built by resampling the real residuals instead, is worth having.", "no": "Reuse the same two moves you used for the 80 percent interval, just with h = 5 in place of h = 1 or h = 10, and qnorm(0.975) in place of qnorm(0.9): sigma_h5 <- sigma_hat * sqrt(5), then point_forecast + c(-1, 1) * qnorm(0.975) * sigma_h5."}
::solution
```r
# Compute sigma_h for h = 5, then the 95 percent naive interval around the point forecast
sigma_hat <- 1187.3
point_forecast <- 3396

sigma_h5 <- sigma_hat * sqrt(5)
interval_95 <- point_forecast + c(-1, 1) * qnorm(0.975) * sigma_h5
round(interval_95, 1)
#> [1] -1807.5  8599.5
```

=== step === concept
## References

- [Forecasting: Principles and Practice, section 5.5, Distributional forecasts and prediction intervals](https://otexts.com/fpp3/prediction-intervals.html) - Hyndman and Athanasopoulos (3rd ed.), the source for hilo() and the sigma-h formulas used in this lesson.
- [Forecasting: Principles and Practice, prediction intervals from bootstrapped residuals](https://otexts.com/fpp3/prediction-intervals.html#prediction-intervals-from-bootstrapped-residuals) - Hyndman and Athanasopoulos (3rd ed.), the source for the bootstrapped interval this lesson computed against the normal-based one.
- [fable package reference documentation for NAIVE(), SNAIVE(), RW() and MEAN()](https://fable.tidyverts.org/reference/NAIVE.html)
- [fabletools package reference documentation for hilo() and forecast()'s bootstrap and times arguments](https://fabletools.tidyverts.org/reference/hilo.html)
- [R documentation for the built-in lynx dataset](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/lynx.html) - datasets package, the series used throughout this lesson.

=== step === complete
## Quick recap

You now have the whole chain behind a forecast's interval, start to finish.

forecast() returns a full distribution at every horizon, not a single number, and hilo() reads off the range holding a stated percentage of that distribution, not a probability about the point forecast itself. For the naive method, that range comes from one formula, sigma_h = sigma_hat times sqrt(h), and you checked it by hand against fable's own bounds. It widens with the horizon because each extra year stacks up one more independent innovation, never because the model gets worse, and no amount of extra history shrinks it the way more data shrinks a confidence interval on a mean. When the residuals fail a normality check, the way the lynx model's did, bootstrapping resamples the real innovations into simulated future paths instead, carrying their real shape into the bounds rather than forcing them through a bell curve that does not fit.
