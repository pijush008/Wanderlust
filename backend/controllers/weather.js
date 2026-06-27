const Listing = require("../models/listing");
const { cache, TTL } = require("../utils/cache");

// Weather code → description + icon mapping (Open-Meteo WMO codes)
const WEATHER_CODES = {
  0: { desc: "Clear sky", icon: "fa-sun", color: "#f39c12" },
  1: { desc: "Mainly clear", icon: "fa-sun", color: "#f39c12" },
  2: { desc: "Partly cloudy", icon: "fa-cloud-sun", color: "#95a5a6" },
  3: { desc: "Overcast", icon: "fa-cloud", color: "#7f8c8d" },
  45: { desc: "Foggy", icon: "fa-smog", color: "#bdc3c7" },
  48: { desc: "Depositing fog", icon: "fa-smog", color: "#bdc3c7" },
  51: { desc: "Light drizzle", icon: "fa-cloud-rain", color: "#3498db" },
  53: { desc: "Drizzle", icon: "fa-cloud-rain", color: "#3498db" },
  55: { desc: "Dense drizzle", icon: "fa-cloud-showers-heavy", color: "#2980b9" },
  61: { desc: "Light rain", icon: "fa-cloud-rain", color: "#3498db" },
  63: { desc: "Rain", icon: "fa-cloud-showers-heavy", color: "#2980b9" },
  65: { desc: "Heavy rain", icon: "fa-cloud-showers-heavy", color: "#1f4e79" },
  71: { desc: "Light snow", icon: "fa-snowflake", color: "#85c1e9" },
  73: { desc: "Snow", icon: "fa-snowflake", color: "#5dade2" },
  75: { desc: "Heavy snow", icon: "fa-snowflake", color: "#3498db" },
  77: { desc: "Snow grains", icon: "fa-snowflake", color: "#85c1e9" },
  80: { desc: "Light showers", icon: "fa-cloud-rain", color: "#3498db" },
  81: { desc: "Showers", icon: "fa-cloud-showers-heavy", color: "#2980b9" },
  82: { desc: "Violent showers", icon: "fa-cloud-bolt", color: "#1a5490" },
  85: { desc: "Snow showers", icon: "fa-snowflake", color: "#85c1e9" },
  86: { desc: "Heavy snow showers", icon: "fa-snowflake", color: "#3498db" },
  95: { desc: "Thunderstorm", icon: "fa-bolt", color: "#e67e22" },
  96: { desc: "Thunderstorm with hail", icon: "fa-cloud-bolt", color: "#d35400" },
  99: { desc: "Severe thunderstorm", icon: "fa-cloud-bolt", color: "#c0392b" },
};

// GET /api/weather/:id
exports.getWeather = async (req, res) => {
  const { id } = req.params;

  // Cache: 30 min (weather doesn't change every second)
  const cacheKey = `weather:${id}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  const listing = await Listing.findById(id).select("location country geometry").lean();
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (!listing.geometry?.coordinates) return res.status(400).json({ error: "No coordinates" });

  const [lng, lat] = listing.geometry.coordinates;

  try {
    // Open-Meteo: free, no API key, no auth
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API error");
    const data = await response.json();

    const current = data.current;
    const daily = data.daily;
    const code = current.weather_code;
    const info = WEATHER_CODES[code] || { desc: "Unknown", icon: "fa-cloud", color: "#999" };

    const result = {
      location: listing.location,
      coordinates: { lat, lng },
      current: {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        isDay: current.is_day === 1,
        condition: info.desc,
        icon: info.icon,
        color: info.color,
        weatherCode: code,
      },
      forecast: daily.time.slice(0, 5).map((date, i) => {
        const fcInfo = WEATHER_CODES[daily.weather_code[i]] || { desc: "Unknown", icon: "fa-cloud" };
        return {
          date,
          day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          max: Math.round(daily.temperature_2m_max[i]),
          min: Math.round(daily.temperature_2m_min[i]),
          rainChance: daily.precipitation_probability_max[i] || 0,
          condition: fcInfo.desc,
          icon: fcInfo.icon,
        };
      }),
      updatedAt: new Date().toISOString(),
    };

    await cache.set(cacheKey, result, 30 * 60); // 30 minutes
    res.json(result);
  } catch (err) {
    console.error("Weather error:", err.message);
    res.status(500).json({ error: "Could not fetch weather" });
  }
};
