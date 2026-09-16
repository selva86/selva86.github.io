---
title: "Spectral and Frequency Domain Analysis in R: An Interactive Course"
slug: "Spectral-and-Frequency-Domain-Analysis-Course"
description: "Learn frequency-domain time series analysis in R across five interactive lessons: the periodogram, spectral density estimation, low-pass, high-pass and band-pass filters, hidden periodicities and wavelets."
keywords: "spectral analysis in R, periodogram R, spec.pgram, spectral density estimation, Daniell kernel, spec.ar, band-pass filter R, Fisher g test periodicity, aliasing, wavelets R, Haar wavelet, frequency domain time series"
mathjax: false
webr: false
date: "2026-09-16"
curriculum_id: "5.90.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Spectral and Frequency Domain Analysis (Course)"
sidebar_order: "76"
---

# Spectral and Frequency Domain Analysis in R: A Hands-On Interactive Course

<p class="lead">Every series you have plotted so far was read left to right, one observation after another. This five-lesson interactive course reads the same series a second way, as a sum of waves, and shows what that view reveals that the time plot hides: which cycles are real, how strong each one is, and how to keep or remove them on purpose.</p>

The periodogram is the first tool, and it is noisy by construction, so the course spends a lesson on estimating the spectrum properly before using it. From there you build filters that pass or block chosen frequencies, test whether a peak is a genuine cycle or a fluke, and finish with wavelets for the case a single spectrum cannot handle, a cycle whose length changes over time.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The five lessons

### Lesson 1: The frequency domain and the periodogram

See a noisy restaurant series as a sum of sines and cosines, learn what frequency, period and amplitude mean for a series, run `spec.pgram()` to find its two real cycles, and see why the raw periodogram never quiets down however long the series gets.

[Start Lesson 1: The frequency domain and the periodogram](The-Frequency-Domain-and-the-Periodogram.html)

### Lesson 2: Estimating the spectral density

Smooth the jagged periodogram with Daniell kernels, feel the bias-variance trade in the span, compare with the autoregressive estimate from `spec.ar()`, and test both against a series whose true spectrum is known.

[Start Lesson 2: Estimating the spectral density](Estimating-the-Spectral-Density.html)

### Lesson 3: Low-pass, high-pass and band-pass filtering

Turn a moving average into a low-pass filter and differencing into a high-pass filter, plot a filter's frequency response, build a band-pass filter with base R's `filter()`, and see the phase shift you pay for it.

[Start Lesson 3: Low-pass, high-pass and band-pass filtering](Filtering-Low-Pass-High-Pass-and-Band-Pass.html)

### Lesson 4: Detecting hidden periodicities

Use Fisher's test to decide whether the largest periodogram peak is real, avoid the aliasing trap of sampling too slowly, find the cycles in sunspots and lynx counts, and decide what to do once a period is confirmed.

[Start Lesson 4: Detecting hidden periodicities](Detecting-Hidden-Periodicities.html)

### Lesson 5: Wavelets for non-stationary signals

See why a Fourier spectrum hides a frequency that changes over time, build a Haar wavelet decomposition by hand in base R, read a scalogram of a signal whose cycle length shrinks, and learn which wavelet packages are worth knowing.

[Start Lesson 5: Wavelets for non-stationary signals](Wavelets-for-Non-Stationary-Signals.html)

## Who this is for

Anyone who has worked through the earlier Forecaster sections, or is otherwise comfortable with autocorrelation, the ACF, and fitting an ARIMA model in R. No prior exposure to Fourier analysis is assumed; the course builds the idea of a frequency from a single sine wave upward.

## What you will be able to do

- Describe a time series as a sum of waves and read a periodogram
- Estimate a spectral density with a smoothed periodogram or an autoregressive fit, and know when each is the better choice
- Build low-pass, high-pass and band-pass filters and plot their frequency response
- Test whether a periodogram peak is a real cycle and recognise aliasing
- Decompose a non-stationary signal with wavelets and read a scalogram

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: The frequency domain and the periodogram](The-Frequency-Domain-and-the-Periodogram.html).
