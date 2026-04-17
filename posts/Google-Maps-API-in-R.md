---
title: "Google Maps API in R: ggmap Package for Basemap Visualization"
slug: "Google-Maps-API-in-R"
description: "Use ggmap to fetch Google Maps and Stadia basemaps in R. Covers API key setup, get_googlemap(), map types, geocoding, data overlays, and route calculation."
keywords: "ggmap, Google Maps API R, get_googlemap, ggmap tutorial, basemap R, geocode R, register_google, Stadia Maps R, ggmap ggplot2, qmplot"
mathjax: false
webr: false
difficulty: "Intermediate"
date: "2026-04-16"
curriculum_id: "FR-maps-2"
post_type: "FR"
auto_link_terms: "ggmap|ggmap package|get_googlemap()|register_google()|Google Maps in R|basemap visualization in R"
auto_link_case_sensitive: false
fr_parent: "Interactive-Maps-in-R-with-leaflet.html"
---

# Google Maps API in R: ggmap Package for Basemap Visualization

<p class="lead">The ggmap package fetches raster basemaps from Google Maps, Stadia Maps, and OpenStreetMap directly into R, then lets you layer your own data on top with familiar ggplot2 syntax, giving you publication-quality map visualizations in a few lines of code.</p>

[NOTE]
**This tutorial requires a local R installation.** ggmap fetches map tiles from external servers and needs API keys, so the code cannot run in the browser. Install R and RStudio locally, then follow the API setup in the first section below.

## How do you set up Google Maps API for ggmap in R?

Before you can pull a single map tile, you need an API key. ggmap talks to two tile providers, Google Maps (richer features, requires a billing account) and Stadia Maps (free tier, no credit card needed). Here's the full setup-to-first-map workflow in one block:

```r
# Install ggmap (run once)
install.packages("ggmap")

# Load packages
library(ggmap)
library(ggplot2)

# Register your Google Maps API key
# Get yours at: https://mapsplatform.google.com
register_google(key = "YOUR_GOOGLE_API_KEY")

# Fetch and display your first basemap — NYC terrain
nyc_map <- get_googlemap(
  center = c(lon = -74.006, lat = 40.7128),
  zoom = 12,
  maptype = "terrain"
)
ggmap(nyc_map)
# Renders a terrain-shaded map of Manhattan with roads, parks, and elevation
```

Three lines of setup, then a terrain map of New York City appears in your plot window. `get_googlemap()` downloads a static map image from Google's servers, and `ggmap()` renders it as a ggplot2 layer. The `zoom` parameter controls detail level, 3 shows a continent, 10 a city, 15 a single street.

To get a Google API key, create a project on Google Cloud Platform, enable the "Maps Static API" and "Geocoding API", then copy the key from the Credentials page. Google offers a free monthly credit that covers light usage.

[TIP]
**Add `write = TRUE` to persist your key across sessions.** Calling `register_google(key = "YOUR_KEY", write = TRUE)` saves the key to your `.Renviron` file, so you never need to re-register after restarting R.

If you prefer a free alternative that requires no credit card, Stadia Maps hosts updated Stamen Design tiles:

```r
# Register Stadia Maps (free tier, no credit card)
# Get your key at: https://stadiamaps.com
register_stadiamaps(key = "YOUR_STADIA_API_KEY")

# Verify registration
has_stadiamaps_key()
#> [1] TRUE
```

Stadia Maps gives you access to the classic Stamen styles (watercolor, toner, terrain) that many R tutorials reference. The free tier covers personal and non-commercial use.

**Try it:** Fetch a basemap of London (latitude 51.5074, longitude -0.1278) at zoom level 13 and display it. Try changing the zoom to 10 and notice how much more area appears.

```r
# Try it: fetch a basemap of London
# Hint: use get_googlemap() with center = c(lon = ..., lat = ...)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
london_map <- get_googlemap(
  center = c(lon = -0.1278, lat = 51.5074),
  zoom = 13,
  maptype = "terrain"
)
ggmap(london_map)
```

**Explanation:** Setting `zoom = 13` shows central London at neighbourhood level. Changing to `zoom = 10` pulls back to show the entire Greater London area.

</details>

## How do you use qmplot() and ggmap() for quick basemap plotting?

The `ggmap()` function you just used is one of two main plotting functions. The other is `qmplot()`, which is even simpler for quick plots, it auto-computes a bounding box from your data so you don't need to specify center and zoom.

```r
# Quick map: just pass lon/lat columns from a data frame
df <- data.frame(
  lon = c(-74.006, -73.935, -73.985),
  lat = c(40.713, 40.730, 40.748)
)

qmplot(lon, lat, data = df, maptype = "terrain", color = I("red"))
```

`qmplot()` figures out the map boundaries from your data's coordinate range, downloads the right tiles, and plots your points, all in one call. Use it when you want a fast visualization without fiddling with bounding boxes.

[KEY INSIGHT]
**ggmap objects ARE ggplot objects.** This means you can add any ggplot2 layer on top, `geom_point()`, `geom_text()`, `scale_color_*()`, `theme()`, using the exact same `+` syntax you already know.

For more control, use the two-step `get_googlemap()` + `ggmap()` workflow. The `get_googlemap()` function accepts a character place name OR numeric coordinates as its center:

```r
# Center by place name (Google geocodes it for you)
sf_map <- get_googlemap(center = "San Francisco", zoom = 12, maptype = "terrain")
ggmap(sf_map)

# Center by coordinates
tokyo_map <- get_googlemap(
  center = c(lon = 139.6917, lat = 35.6895),
  zoom = 11,
  maptype = "roadmap"
)
ggmap(tokyo_map)
```

Place-name centering is convenient for quick exploration. Coordinate centering gives you exact control over the map frame.

**Try it:** Use `qmplot()` to plot three cities of your choice. Create a data frame with their longitude and latitude, then pass it to `qmplot()`.

```r
# Try it: plot three cities with qmplot()
# Hint: create a data frame with lon and lat columns
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cities <- data.frame(
  lon = c(-87.6298, -122.4194, -118.2437),
  lat = c(41.8781, 37.7749, 34.0522)
)
qmplot(lon, lat, data = ex_cities, maptype = "terrain",
       color = I("darkred"), size = I(4))
```

**Explanation:** `qmplot()` auto-detects that the three points span the US and fetches tiles at an appropriate zoom level. The `I()` wrapper tells ggplot2 to use the value literally, not as a data mapping.

</details>

## What map types and tile sources does ggmap support?

Google Maps offers four map types, each suited to different purposes. Let's compare them side by side.

```r
# Compare Google map types for the same location
map_terrain  <- get_googlemap(center = "San Francisco", zoom = 12, maptype = "terrain")
map_satellite <- get_googlemap(center = "San Francisco", zoom = 12, maptype = "satellite")
map_roadmap  <- get_googlemap(center = "San Francisco", zoom = 12, maptype = "roadmap")
map_hybrid   <- get_googlemap(center = "San Francisco", zoom = 12, maptype = "hybrid")

# Display one — swap the variable to compare
ggmap(map_terrain) + ggtitle("Terrain")
ggmap(map_satellite) + ggtitle("Satellite")
ggmap(map_roadmap) + ggtitle("Roadmap")
ggmap(map_hybrid) + ggtitle("Hybrid")
```

Here's when to use each type:

| Map Type | Best For | What You See |
|---|---|---|
| `terrain` | Physical geography, elevation | Shaded relief + roads |
| `satellite` | Aerial imagery, land cover | True-colour satellite photos |
| `roadmap` | Navigation, address location | Clean vector streets + labels |
| `hybrid` | Combining context + imagery | Satellite + road overlay |

Stadia Maps hosts the classic Stamen Design tiles that many R tutorials feature. These artistic styles work well for presentations and publications:

```r
# Stadia Maps (formerly Stamen) tiles
# Requires register_stadiamaps() — see setup section
bbox <- c(left = -122.52, bottom = 37.7, right = -122.35, top = 37.82)

stadia_wc <- get_stadiamap(bbox, zoom = 13, maptype = "stamen_watercolor")
ggmap(stadia_wc) + ggtitle("Stamen Watercolor")

stadia_toner <- get_stadiamap(bbox, zoom = 13, maptype = "stamen_toner_lite")
ggmap(stadia_toner) + ggtitle("Stamen Toner Lite")
```

The watercolor style gives a hand-painted aesthetic, while toner provides a stark black-and-white look that keeps the focus on your data overlays.

[NOTE]
**Stamen Maps tiles are now hosted by Stadia Maps.** If you see tutorials using `get_stamenmap()`, that function is deprecated. Use `get_stadiamap()` with `register_stadiamaps()` instead. Available styles include `stamen_watercolor`, `stamen_toner`, `stamen_toner_lite`, `stamen_terrain`, and `stamen_terrain_background`.

**Try it:** Fetch a watercolor-style map and a toner-style map of the same city. Which style makes overlaid data points easier to read?

```r
# Try it: compare two Stadia tile styles for your chosen city
# Hint: use get_stadiamap() with a bounding box
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
bbox_paris <- c(left = 2.25, bottom = 48.81, right = 2.42, top = 48.90)

paris_wc <- get_stadiamap(bbox_paris, zoom = 13, maptype = "stamen_watercolor")
paris_toner <- get_stadiamap(bbox_paris, zoom = 13, maptype = "stamen_toner_lite")

ggmap(paris_wc) + ggtitle("Watercolor — Paris")
ggmap(paris_toner) + ggtitle("Toner Lite — Paris")
```

**Explanation:** Toner Lite's minimal, light background makes colored data points pop more clearly. Watercolor is better for presentation aesthetics when data density is low.

</details>

## How do you overlay data points on a ggmap basemap?

Since `ggmap()` returns a ggplot object, you add data layers with the same `geom_*()` functions you already know. The key requirement is that your data uses longitude and latitude coordinates (WGS84, the default GPS system).

Let's plot some landmark locations on our NYC basemap:

```r
# Create a data frame of NYC landmarks
landmarks <- data.frame(
  name = c("Statue of Liberty", "Central Park", "Brooklyn Bridge",
           "Times Square", "Empire State Building"),
  lon = c(-74.0445, -73.9654, -73.9969, -73.9855, -73.9857),
  lat = c(40.6892, 40.7829, 40.7061, 40.7580, 40.7484),
  visitors_m = c(4.0, 42.0, 10.0, 50.0, 2.5)
)

# Overlay points on the NYC basemap
ggmap(nyc_map) +
  geom_point(data = landmarks, aes(x = lon, y = lat, size = visitors_m),
             color = "red", alpha = 0.7) +
  geom_label(data = landmarks, aes(x = lon, y = lat, label = name),
             size = 2.5, nudge_y = 0.008) +
  scale_size_continuous(name = "Visitors (millions)", range = c(3, 10)) +
  ggtitle("NYC Landmark Visitor Traffic")
```

Each point appears at its geographic coordinate on the basemap. The `size` aesthetic maps to visitor count, so busier landmarks appear as larger circles. `geom_label()` adds readable text annotations with a white background.

You can also connect points to show routes or trajectories:

```r
# Draw a path connecting landmarks in order
ggmap(nyc_map) +
  geom_path(data = landmarks, aes(x = lon, y = lat),
            color = "blue", linewidth = 1.2, alpha = 0.6) +
  geom_point(data = landmarks, aes(x = lon, y = lat),
             color = "red", size = 4) +
  ggtitle("NYC Landmark Tour Route")
```

The `geom_path()` draws line segments connecting each row in order, creating a tour route through all five landmarks.

[WARNING]
**Coordinates must be in longitude/latitude (WGS84).** If your spatial data uses a projected coordinate system (like UTM or state plane), convert it first with `sf::st_transform(data, crs = 4326)`. Mismatched CRS is the most common reason points appear in the wrong place on a ggmap basemap.

**Try it:** Add a `geom_text()` layer to the landmark map that labels each point with its name. Use `vjust = -1` to position labels above the points.

```r
# Try it: add text labels above each landmark
ggmap(nyc_map) +
  geom_point(data = landmarks, aes(x = lon, y = lat), color = "red", size = 3) +
  # your code here — add geom_text()
```

<details>
<summary>Click to reveal solution</summary>

```r
ggmap(nyc_map) +
  geom_point(data = landmarks, aes(x = lon, y = lat), color = "red", size = 3) +
  geom_text(data = landmarks, aes(x = lon, y = lat, label = name),
            vjust = -1, size = 3, fontface = "bold")
```

**Explanation:** `vjust = -1` shifts labels upward so they don't overlap the points. `geom_text()` differs from `geom_label()` in that it renders plain text without a background box.

</details>

## How do you geocode addresses and calculate routes with ggmap?

One of ggmap's most powerful features is geocoding, converting text addresses to coordinates. The `geocode()` function sends addresses to Google's Geocoding API and returns longitude/latitude pairs. The reverse function, `revgeocode()`, converts coordinates back to human-readable addresses.

```r
# Geocode text addresses to coordinates
coords <- geocode(c("1600 Pennsylvania Ave, Washington DC",
                     "350 Fifth Avenue, New York, NY"))
coords
#>         lon      lat
#> 1 -77.0365 38.8977
#> 2 -73.9857 40.7484
```

Each address comes back as a longitude/latitude pair. The first is the White House, the second is the Empire State Building. These coordinates are ready to plot on any ggmap basemap.

Going the other direction:

```r
# Reverse geocode: coordinates to address
address <- revgeocode(c(lon = -73.9857, lat = 40.7484))
address
#> [1] "350 5th Ave, New York, NY 10118, USA"
```

[TIP]
**Use `mutate_geocode()` to geocode an entire column at once.** Instead of geocoding addresses one by one, pass a data frame and column name: `mutate_geocode(df, address_column)`. It adds `lon` and `lat` columns directly to your data frame.

For driving directions, `trek()` returns a data frame of coordinates along a route that you can plot:

```r
# Calculate a driving route and plot it
route_df <- trek("Times Square, New York", "Brooklyn Bridge, New York",
                 structure = "route")

# Plot the route on a basemap
route_map <- get_googlemap(center = c(lon = -73.99, lat = 40.73), zoom = 13)

ggmap(route_map) +
  geom_path(data = route_df, aes(x = lon, y = lat),
            color = "blue", linewidth = 1.5, alpha = 0.7) +
  ggtitle("Driving Route: Times Square to Brooklyn Bridge")
```

The blue line follows actual streets from Times Square down to the Brooklyn Bridge. `trek()` returns enough intermediate points to trace the full road geometry.

For distance calculations, `mapdist()` returns distance, duration, and mode of travel:

```r
# Calculate distances between cities
distances <- mapdist(
  from = c("New York, NY", "New York, NY", "Los Angeles, CA"),
  to   = c("Boston, MA", "Los Angeles, CA", "San Francisco, CA")
)

distances[, c("from", "to", "km", "minutes")]
#>             from                to       km  minutes
#> 1   New York, NY       Boston, MA    346.2    228.4
#> 2   New York, NY  Los Angeles, CA   4489.0   2424.6
#> 3 Los Angeles, CA San Francisco, CA  616.5    352.8
```

Each row shows the driving distance in kilometres and estimated travel time in minutes. You can also request walking or cycling distances by adding `mode = "walking"` or `mode = "bicycling"`.

**Try it:** Geocode two addresses of your choice and compute the driving distance between them using `mapdist()`. Print the result in kilometres.

```r
# Try it: geocode two addresses and compute driving distance
# Hint: geocode() for coordinates, mapdist() for distance
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
# Geocode
loc1 <- geocode("Eiffel Tower, Paris")
loc2 <- geocode("Louvre Museum, Paris")

# Distance
dist <- mapdist("Eiffel Tower, Paris", "Louvre Museum, Paris")
print(paste("Distance:", round(dist$km, 1), "km"))
#> [1] "Distance: 4.1 km"
```

**Explanation:** `mapdist()` accepts text addresses directly, no need to geocode first. It queries Google's Distance Matrix API for driving distance and time.

</details>

## Practice Exercises

### Exercise 1: Earthquake overlay on a satellite basemap

Plot earthquake locations on a satellite basemap. The data below contains coordinates and magnitudes for recent earthquakes near Japan. Size each point by magnitude and colour by depth category.

```r
# Exercise: earthquake overlay
quake_data <- data.frame(
  lon = c(141.0, 139.5, 142.3, 140.8, 143.1),
  lat = c(38.3, 35.7, 39.1, 36.5, 40.2),
  magnitude = c(6.2, 4.8, 7.1, 5.5, 6.8),
  depth = c("Shallow", "Deep", "Shallow", "Deep", "Shallow")
)

# Step 1: Fetch a satellite basemap covering these coordinates
# Step 2: Overlay quake_data with geom_point()
# Step 3: Map size = magnitude, color = depth
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
quake_data <- data.frame(
  lon = c(141.0, 139.5, 142.3, 140.8, 143.1),
  lat = c(38.3, 35.7, 39.1, 36.5, 40.2),
  magnitude = c(6.2, 4.8, 7.1, 5.5, 6.8),
  depth = c("Shallow", "Deep", "Shallow", "Deep", "Shallow")
)

japan_map <- get_googlemap(
  center = c(lon = 141, lat = 38),
  zoom = 6,
  maptype = "satellite"
)

ggmap(japan_map) +
  geom_point(data = quake_data,
             aes(x = lon, y = lat, size = magnitude, color = depth),
             alpha = 0.8) +
  scale_size_continuous(range = c(3, 10)) +
  scale_color_manual(values = c("Shallow" = "red", "Deep" = "orange")) +
  ggtitle("Earthquake Locations near Japan")
```

**Explanation:** `zoom = 6` covers the full Japanese archipelago. The `scale_size_continuous()` controls point sizes, and `scale_color_manual()` assigns distinct colours to each depth category.

</details>

### Exercise 2: Geocode and route between restaurants

Geocode five restaurant addresses, plot them on a terrain basemap, and draw the driving route connecting them in order.

```r
# Exercise: restaurant tour route
restaurants <- data.frame(
  name = c("Joe's Pizza", "Katz's Deli", "Peter Luger Steak",
           "Di Fara Pizza", "Juliana's Pizza"),
  address = c("7 Carmine St, New York, NY",
              "205 E Houston St, New York, NY",
              "178 Broadway, Brooklyn, NY",
              "1424 Avenue J, Brooklyn, NY",
              "19 Old Fulton St, Brooklyn, NY")
)

# Step 1: Geocode all addresses with mutate_geocode()
# Step 2: Fetch a basemap covering all coordinates
# Step 3: Plot points + labels + connecting route
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
restaurants <- data.frame(
  name = c("Joe's Pizza", "Katz's Deli", "Peter Luger Steak",
           "Di Fara Pizza", "Juliana's Pizza"),
  address = c("7 Carmine St, New York, NY",
              "205 E Houston St, New York, NY",
              "178 Broadway, Brooklyn, NY",
              "1424 Avenue J, Brooklyn, NY",
              "19 Old Fulton St, Brooklyn, NY")
)

# Geocode all addresses
restaurants <- mutate_geocode(restaurants, address)

# Compute bounding box and fetch basemap
bbox <- make_bbox(lon, lat, data = restaurants, f = 0.2)
rest_map <- get_googlemap(
  center = c(lon = mean(restaurants$lon), lat = mean(restaurants$lat)),
  zoom = 12,
  maptype = "terrain"
)

# Plot the restaurant tour
ggmap(rest_map) +
  geom_path(data = restaurants, aes(x = lon, y = lat),
            color = "blue", linewidth = 1, linetype = "dashed") +
  geom_point(data = restaurants, aes(x = lon, y = lat),
             color = "red", size = 4) +
  geom_label(data = restaurants, aes(x = lon, y = lat, label = name),
             size = 2.5, nudge_y = 0.005) +
  ggtitle("NYC Restaurant Tour")
```

**Explanation:** `mutate_geocode()` adds `lon` and `lat` columns to the data frame. `make_bbox()` computes a bounding box from the coordinates with a 20% margin (`f = 0.2`). The dashed `geom_path()` connects restaurants in row order.

</details>

## Complete Example

Let's build a complete map visualization from scratch: geocode US cities, fetch a basemap, overlay population-scaled points, and connect them with a route.

```r
# --- Complete ggmap Workflow ---

# 1. Prepare data
cities <- data.frame(
  city = c("New York", "Chicago", "Houston",
           "Phoenix", "Philadelphia", "San Antonio"),
  state = c("NY", "IL", "TX", "AZ", "PA", "TX"),
  population_m = c(8.3, 2.7, 2.3, 1.6, 1.6, 1.5)
)

# 2. Geocode city names
cities$address <- paste(cities$city, cities$state, sep = ", ")
cities <- mutate_geocode(cities, address)

# 3. Fetch a terrain basemap covering all cities
city_map <- get_googlemap(
  center = c(lon = -95, lat = 37),
  zoom = 4,
  maptype = "terrain"
)

# 4. Build the visualization
ggmap(city_map) +
  # Draw connecting route
  geom_path(data = cities, aes(x = lon, y = lat),
            color = "steelblue", linewidth = 0.8, alpha = 0.5) +
  # Plot cities sized by population
  geom_point(data = cities,
             aes(x = lon, y = lat, size = population_m),
             color = "firebrick", alpha = 0.7) +
  # Label each city
  geom_label(data = cities,
             aes(x = lon, y = lat, label = city),
             size = 2.5, nudge_y = 1.2,
             fill = "white", alpha = 0.8) +
  # Scales and theme
  scale_size_continuous(
    name = "Population (millions)",
    range = c(3, 12)
  ) +
  ggtitle("Largest US Cities by Population") +
  theme(
    plot.title = element_text(face = "bold", size = 14),
    legend.position = "bottom"
  )
```

This produces a terrain map of the contiguous US with six cities plotted as red circles. New York appears largest (8.3M), and a light blue path connects the cities in row order. The `geom_label()` annotations sit above each point with a semi-transparent white background for readability.

The entire workflow, geocoding, basemap fetching, data overlay, and styling, chains together because every step produces or consumes standard ggplot2/data.frame objects.

## Summary

Here's a quick reference of the key ggmap functions:

| Function | Purpose | Requires |
|---|---|---|
| `register_google()` | Store Google API key for the session | Google Cloud API key |
| `register_stadiamaps()` | Store Stadia Maps API key | Stadia Maps API key (free) |
| `get_googlemap()` | Fetch a Google Maps basemap raster | Google key |
| `get_stadiamap()` | Fetch a Stadia/Stamen basemap raster | Stadia key |
| `ggmap()` | Render a basemap as a ggplot2 layer | A map object |
| `qmplot()` | Quick one-liner map from data | Google key + data frame |
| `geocode()` | Address → lon/lat coordinates | Google key |
| `revgeocode()` | Lon/lat → street address | Google key |
| `mutate_geocode()` | Geocode an entire data frame column | Google key |
| `route()` / `trek()` | Compute driving directions as coordinates | Google key |
| `mapdist()` | Calculate distance and travel time between locations | Google key |
| `make_bbox()` | Compute a bounding box from lon/lat data | None |

Key takeaways:

- ggmap objects are ggplot2 objects, layer any `geom_*()` on top
- Google Maps needs a billing account; Stadia Maps offers a free tier
- Stamen-style tiles now live under `get_stadiamap()` (not the deprecated `get_stamenmap()`)
- All coordinates must be WGS84 longitude/latitude
- Use `write = TRUE` when registering keys to persist them across sessions

## References

1. Kahle, D. & Wickham, H., *ggmap: Spatial Visualization with ggplot2*. The R Journal, 5(1), 144-161 (2013). [Link](https://journal.r-project.org/archive/2013-1/kahle-wickham.pdf)
2. ggmap CRAN documentation, Package reference manual (v4.0.2). [Link](https://cran.r-project.org/web/packages/ggmap/ggmap.pdf)
3. Kahle, D., ggmap GitHub repository. [Link](https://github.com/dkahle/ggmap)
4. Google, Maps Static API documentation. [Link](https://developers.google.com/maps/documentation/maps-static/overview)
5. Stadia Maps, Getting Started with ggmap. [Link](https://docs.stadiamaps.com/tutorials/getting-started-in-r-with-ggmap/)
6. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2016). [Link](https://ggplot2-book.org/)
7. Google Cloud, Geocoding API documentation. [Link](https://developers.google.com/maps/documentation/geocoding/overview)

## Continue Learning

- [Interactive Maps in R with leaflet](/Interactive-Maps-in-R-with-leaflet.html), Build zoomable, clickable web maps with markers, popups, and tile layers using the leaflet package.
- [Spatial Data in R with sf](/Spatial-Data-in-R-with-sf.html), Read shapefiles, transform coordinate reference systems, and plot with `geom_sf()` in ggplot2.
- [Choropleth Maps in R](/Choropleth-Maps-in-R.html), Colour geographic regions by data values using ggplot2 and sf for thematic mapping.
