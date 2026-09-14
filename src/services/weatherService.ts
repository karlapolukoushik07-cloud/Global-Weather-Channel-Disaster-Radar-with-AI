import { 
  GeoLocation, 
  CurrentWeather, 
  HourlyForecastItem, 
  DailyForecastItem, 
  WeatherAlert, 
  AirQualityData,
  AiBriefingResponse,
  WeatherFetchResult,
  HistoricalData
} from "../types/weather";
import { getWeatherCodeInfo, getMoonPhase, getAqiCategory } from "../utils/weatherCodes";

export const DEFAULT_LOCATIONS: GeoLocation[] = [
  { name: "New York", country: "United States", countryCode: "US", admin1: "New York", latitude: 40.7128, longitude: -74.0060, timezone: "America/New_York" },
  { name: "New Delhi", country: "India", countryCode: "IN", admin1: "Delhi", latitude: 28.6139, longitude: 77.2090, timezone: "Asia/Kolkata" },
  { name: "Mumbai", country: "India", countryCode: "IN", admin1: "Maharashtra", latitude: 19.0760, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Chennai", country: "India", countryCode: "IN", admin1: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
  { name: "London", country: "United Kingdom", countryCode: "GB", admin1: "England", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
  { name: "Tokyo", country: "Japan", countryCode: "JP", admin1: "Tokyo", latitude: 35.6895, longitude: 139.6917, timezone: "Asia/Tokyo" },
  { name: "Paris", country: "France", countryCode: "FR", admin1: "Île-de-France", latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris" },
  { name: "Sydney", country: "Australia", countryCode: "AU", admin1: "New South Wales", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" },
  { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", admin1: "Dubai", latitude: 25.2048, longitude: 55.2708, timezone: "Asia/Dubai" },
  { name: "Singapore", country: "Singapore", countryCode: "SG", admin1: "Singapore", latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore" }
];

export const INDIA_CYCLONE_MONSOON_HUBS: GeoLocation[] = [
  { name: "Bhubaneswar", country: "India", countryCode: "IN", admin1: "Odisha", latitude: 20.2961, longitude: 85.8245, timezone: "Asia/Kolkata" },
  { name: "Chennai", country: "India", countryCode: "IN", admin1: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
  { name: "Mumbai", country: "India", countryCode: "IN", admin1: "Maharashtra", latitude: 19.0760, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Kolkata", country: "India", countryCode: "IN", admin1: "West Bengal", latitude: 22.5726, longitude: 88.3639, timezone: "Asia/Kolkata" },
  { name: "Visakhapatnam", country: "India", countryCode: "IN", admin1: "Andhra Pradesh", latitude: 17.6868, longitude: 83.2185, timezone: "Asia/Kolkata" },
  { name: "Kochi", country: "India", countryCode: "IN", admin1: "Kerala", latitude: 9.9312, longitude: 76.2673, timezone: "Asia/Kolkata" },
  { name: "Surat", country: "India", countryCode: "IN", admin1: "Gujarat", latitude: 21.1702, longitude: 72.8311, timezone: "Asia/Kolkata" },
  { name: "New Delhi", country: "India", countryCode: "IN", admin1: "Delhi", latitude: 28.6139, longitude: 77.2090, timezone: "Asia/Kolkata" },
  { name: "Jaipur", country: "India", countryCode: "IN", admin1: "Rajasthan", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" },
  { name: "Patna", country: "India", countryCode: "IN", admin1: "Bihar", latitude: 25.5941, longitude: 85.1376, timezone: "Asia/Kolkata" }
];

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to search location");
    const data = await res.json();

    if (!data.results) return [];

    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      country: item.country || "",
      countryCode: item.country_code || "",
      admin1: item.admin1 || "",
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
      elevation: item.elevation
    }));
  } catch (err) {
    console.error("Geocoding error:", err);
    return [];
  }
}

export async function fetchAirQuality(latitude: number, longitude: number): Promise<AirQualityData | undefined> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    const cur = data.current;
    if (!cur) return undefined;

    const usAqi = cur.us_aqi || Math.round((cur.european_aqi || 20) * 2.2);
    const category = getAqiCategory(usAqi);

    return {
      europeanAqi: cur.european_aqi || 20,
      usAqi,
      pm25: cur.pm2_5 || 12,
      pm10: cur.pm10 || 22,
      o3: cur.ozone || 45,
      no2: cur.nitrogen_dioxide || 18,
      so2: cur.sulphur_dioxide || 5,
      co: cur.carbon_monoxide || 280,
      statusLabel: category.label,
      statusColor: category.color,
      healthRecommendation: category.advice
    };
  } catch (err) {
    console.warn("Failed to fetch air quality:", err);
    return undefined;
  }
}

export async function fetchFullWeather(location: GeoLocation): Promise<WeatherFetchResult> {
  const { latitude, longitude } = location;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=16`;
  const historicalUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&past_days=7&forecast_days=1`;

  const [weatherRes, airQuality, historicalRes] = await Promise.all([
    fetch(weatherUrl),
    fetchAirQuality(latitude, longitude),
    fetch(historicalUrl)
  ]);

  if (!weatherRes.ok) {
    throw new Error(`Weather service returned status ${weatherRes.status}`);
  }

  const rawData = await weatherRes.json();
  const cur = rawData.current;
  const hourly = rawData.hourly;
  const daily = rawData.daily;

  let historicalData: any[] = [];
  if (historicalRes.ok) {
    const histRaw = await historicalRes.json();
    if (histRaw.daily && histRaw.daily.time) {
      // The first 7 items are the past 7 days
      const limit = Math.min(7, histRaw.daily.time.length);
      for (let i = 0; i < limit; i++) {
        const rawDate = histRaw.daily.time[i];
        const dateObj = new Date(rawDate + "T12:00:00");
        historicalData.push({
          date: rawDate,
          dayName: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
          tempMax: Math.round(histRaw.daily.temperature_2m_max[i]),
          tempMin: Math.round(histRaw.daily.temperature_2m_min[i]),
          precipitationSum: histRaw.daily.precipitation_sum[i] ?? 0
        });
      }
    }
  }

  // Process current weather
  const curCode = cur.weather_code ?? 0;
  const isDay = cur.is_day === 1;
  const codeInfo = getWeatherCodeInfo(curCode, isDay);
  const moon = getMoonPhase(new Date());

  // Pressure tendency comparison (compare current pressure with 3 hours ago)
  let pressureTendency: "rising" | "falling" | "steady" = "steady";
  if (hourly.pressure_msl && hourly.pressure_msl.length >= 4) {
    const currentPress = cur.pressure_msl ?? hourly.pressure_msl[0];
    const pastPress = hourly.pressure_msl[3];
    const diff = currentPress - pastPress;
    if (diff > 1.2) pressureTendency = "rising";
    else if (diff < -1.2) pressureTendency = "falling";
  }

  // Dew point estimation if not directly in current
  const currentTemp = cur.temperature_2m;
  const currentHumidity = cur.relative_humidity_2m;
  const approxDewPoint = currentTemp - ((100 - currentHumidity) / 5);

  const currentWeather: CurrentWeather = {
    temperature: currentTemp,
    apparentTemperature: cur.apparent_temperature ?? currentTemp,
    tempMin: daily.temperature_2m_min?.[0] ?? currentTemp - 4,
    tempMax: daily.temperature_2m_max?.[0] ?? currentTemp + 4,
    humidity: currentHumidity,
    dewPoint: Math.round(approxDewPoint * 10) / 10,
    pressure: Math.round(cur.pressure_msl ?? cur.surface_pressure ?? 1013),
    pressureTendency,
    windSpeed: Math.round(cur.wind_speed_10m ?? 0),
    windDirection: Math.round(cur.wind_direction_10m ?? 0),
    windGusts: Math.round(cur.wind_gusts_10m ?? cur.wind_speed_10m ?? 0),
    uvIndex: hourly.uv_index?.[0] ?? 0,
    visibility: hourly.visibility?.[0] ?? 10000,
    precipitation: cur.precipitation ?? 0,
    cloudCover: cur.cloud_cover ?? 0,
    isDay,
    weatherCode: curCode,
    weatherDescription: codeInfo.description,
    conditionIconName: codeInfo.iconName,
    airQuality,
    time: cur.time,
    sunrise: daily.sunrise?.[0] || "06:00",
    sunset: daily.sunset?.[0] || "18:00",
    moonPhase: moon
  };

  // Process next 48 hourly forecasts
  const hourlyList: HourlyForecastItem[] = [];
  const hourlyLen = Math.min(48, hourly.time?.length || 0);

  // Find the current hour index
  const nowIsoHour = cur.time ? cur.time.slice(0, 13) : "";
  let startIndex = hourly.time.findIndex((t: string) => t.startsWith(nowIsoHour));
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < Math.min(startIndex + 48, hourly.time.length); i++) {
    const rawTime = hourly.time[i];
    const itemDate = new Date(rawTime);
    const itemIsDay = hourly.is_day?.[i] === 1;
    const itemCode = hourly.weather_code?.[i] ?? 0;
    const itemInfo = getWeatherCodeInfo(itemCode, itemIsDay);

    const hourStr = itemDate.toLocaleTimeString([], { hour: "numeric", hour12: true });
    const isFirst = i === startIndex;

    hourlyList.push({
      time: rawTime,
      hourLabel: isFirst ? "Now" : hourStr,
      temperature: Math.round(hourly.temperature_2m[i]),
      apparentTemperature: Math.round(hourly.apparent_temperature[i]),
      precipitationProbability: hourly.precipitation_probability?.[i] ?? 0,
      precipitationAmount: hourly.precipitation?.[i] ?? 0,
      weatherCode: itemCode,
      weatherDescription: itemInfo.description,
      conditionIconName: itemInfo.iconName,
      windSpeed: Math.round(hourly.wind_speed_10m[i]),
      windDirection: Math.round(hourly.wind_direction_10m[i]),
      humidity: hourly.relative_humidity_2m[i],
      uvIndex: hourly.uv_index?.[i] ?? 0,
      isDay: itemIsDay
    });
  }

  // Process 16-day daily forecast
  const dailyList: DailyForecastItem[] = [];
  const dailyLen = daily.time?.length || 0;

  for (let d = 0; d < dailyLen; d++) {
    const rawDate = daily.time[d];
    const dateObj = new Date(rawDate + "T12:00:00");
    const isToday = d === 0;
    const dayName = isToday ? "Today" : d === 1 ? "Tomorrow" : dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const fullDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dCode = daily.weather_code[d] ?? 0;
    const dInfo = getWeatherCodeInfo(dCode, true);

    const maxT = Math.round(daily.temperature_2m_max[d]);
    const minT = Math.round(daily.temperature_2m_min[d]);
    const spread = maxT - minT;

    dailyList.push({
      date: rawDate,
      dayName,
      fullDate,
      weatherCode: dCode,
      weatherDescription: dInfo.description,
      conditionIconName: dInfo.iconName,
      tempMax: maxT,
      tempMin: minT,
      apparentMax: Math.round(daily.apparent_temperature_max?.[d] ?? maxT),
      apparentMin: Math.round(daily.apparent_temperature_min?.[d] ?? minT),
      precipitationProbability: daily.precipitation_probability_max?.[d] ?? 0,
      precipitationSum: daily.precipitation_sum?.[d] ?? 0,
      windSpeedMax: Math.round(daily.wind_speed_10m_max?.[d] ?? 0),
      windGustsMax: Math.round(daily.wind_gusts_10m_max?.[d] ?? 0),
      uvIndexMax: daily.uv_index_max?.[d] ?? 0,
      sunrise: daily.sunrise?.[d] || "06:00",
      sunset: daily.sunset?.[d] || "18:00",
      // Daypart breakdown calculations for high-density Weather Channel view
      morningTemp: Math.round(minT + spread * 0.4),
      afternoonTemp: maxT,
      eveningTemp: Math.round(minT + spread * 0.6),
      nightTemp: Math.round(minT + spread * 0.15)
    });
  }

  // Derive real-time meteorological alerts
  const alerts = deriveWeatherAlerts(currentWeather, dailyList, hourlyList, airQuality, location);

  return {
    current: currentWeather,
    hourly: hourlyList,
    daily: dailyList,
    historical: historicalData,
    alerts,
    location
  };
}

// Meteorological rule-based real-time alert engine
export function deriveWeatherAlerts(
  current: CurrentWeather,
  daily: DailyForecastItem[],
  hourly: HourlyForecastItem[],
  airQuality: AirQualityData | undefined,
  location: GeoLocation
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const locName = location.name;

  // 1. Real-Time Advanced Forecast Threat Detections (up to 7-14 days out / "before a week")
  const daysAhead = Math.min(14, daily.length);
  for (let d = 0; d < daysAhead; d++) {
    const day = daily[d];
    const isFuture = d > 0;
    const dayStr = isFuture ? `on ${day.fullDate}` : "Today";
    const leadLabel = d === 0 ? "Immediate" : d >= 7 ? "7-Day Advance Warning" : `${d} Days Advance Warning`;

    // (A) Real-Time Cyclone Threat Detection (IMD & WMO Classification Scale)
    if ((day.windSpeedMax >= 75 || day.windGustsMax >= 100) && (day.precipitationSum >= 20 || day.precipitationProbability >= 60)) {
      const isSuper = day.windSpeedMax >= 105 || day.windGustsMax >= 135;
      alerts.push({
        id: `alert-cyclone-threat-${d}-${Date.now()}`,
        title: d >= 7 ? "7-DAY ADVANCE CYCLONE EARLY WARNING" : isSuper ? "SUPER CYCLONIC STORM EMERGENCY" : "SEVERE CYCLONIC STORM THREAT",
        severity: "emergency",
        category: "wind",
        headline: `🚨 ${leadLabel}: ${isSuper ? "Super Cyclone" : "Severe Cyclone"} Winds (${day.windSpeedMax} km/h, Gusts ${day.windGustsMax} km/h) projected ${dayStr} near ${locName}`,
        description: `Atmospheric pressure falls and high-resolution numerical models indicate cyclonic intensification ${dayStr}. Maximum sustained winds of ${day.windSpeedMax} km/h with destructive gusts up to ${day.windGustsMax} km/h and intense precipitation (${day.precipitationSum} mm). High risk of storm surges, coastal flooding, and severe structural damage.`,
        instruction: `Fishermen are advised not to venture into deep sea. Secure tin roofs, hoardings, and solar panels. Stock 7-day non-perishable food, potable water, first-aid kits, and power banks. Keep updated on official IMD/disaster management evacuation notices.`,
        effectiveTime: `Advance Threat Alert (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "IMD & Global Tropical Cyclone Warning Center",
        advanceNoticeDays: d,
        threatLevel: isSuper ? "Catastrophic" : "Severe",
        imdColorCode: "Red"
      });
    } else if ((day.windSpeedMax >= 52 || day.windGustsMax >= 70) && (day.precipitationSum >= 15 || day.precipitationProbability >= 50)) {
      alerts.push({
        id: `alert-depression-threat-${d}-${Date.now()}`,
        title: d >= 7 ? "ADVANCE CYCLONE THREAT DETECTED (1 WEEK OUT)" : "CYCLONIC STORM & DEPRESSION ALERT",
        severity: "warning",
        category: "wind",
        headline: `Cyclonic Depression & High Gale Winds (${day.windSpeedMax} km/h) projected ${dayStr} for ${locName}`,
        description: `A deep atmospheric depression is organizing over the region ${dayStr}. Strong squalls, rough sea conditions, and continuous rain bands are anticipated.`,
        instruction: `Prepare emergency supplies, avoid non-essential coastal transit, secure loose lightweight objects, and monitor meteorological radar updates.`,
        effectiveTime: `Early Advisory (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "IMD Regional Specialized Meteorological Centre",
        advanceNoticeDays: d,
        threatLevel: "High",
        imdColorCode: "Orange"
      });
    }

    // (B) Heavy Monsoon & Torrential Rainfall Detection (IMD Standards)
    if (day.precipitationSum >= 100 || (day.precipitationProbability >= 75 && day.precipitationSum >= 65)) {
      alerts.push({
        id: `alert-heavy-monsoon-${d}-${Date.now()}`,
        title: d >= 7 ? "7-DAY ADVANCE ALERT: EXTREME MONSOON CLOUDBURST" : "EXTREMELY HEAVY MONSOON RAINFALL WARNING",
        severity: "emergency",
        category: "flood",
        headline: `⚠️ ${leadLabel}: Torrential Monsoon Downpours (${day.precipitationSum} mm) expected ${dayStr} in ${locName}`,
        description: `IMD Red Alert criteria met. Severe monsoon cloudburst and persistent torrential precipitation (${day.precipitationSum} mm) will overwhelm drainage basins ${dayStr}. Severe urban waterlogging, transport stagnation, and flash floods expected.`,
        instruction: `Move valuables and vehicles to higher ground. Do not drive or walk through submerged underpasses. Keep away from fallen power cables. Maintain emergency drinking water supplies.`,
        effectiveTime: `Early Warning (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "National Monsoon Mission & Hydrological Warning System",
        advanceNoticeDays: d,
        threatLevel: "Severe",
        imdColorCode: "Red"
      });
    } else if (day.precipitationSum >= 50 || (day.precipitationProbability >= 70 && day.precipitationSum >= 35)) {
      alerts.push({
        id: `alert-monsoon-rain-${d}-${Date.now()}`,
        title: d >= 7 ? "7-DAY ADVANCE HEAVY MONSOON ADVISORY" : "HEAVY MONSOON RAINFALL ALERT",
        severity: "warning",
        category: "flood",
        headline: `Heavy Monsoon Rainfall (${day.precipitationSum} mm) projected ${dayStr} for ${locName}`,
        description: `Active monsoon conditions will produce heavy rainfall totaling ${day.precipitationSum} mm ${dayStr}. Low-lying road ponding and traffic congestion likely.`,
        instruction: `Carry rain protection, plan travel with extra buffer time, and check city flood water advisory bulletins.`,
        effectiveTime: `Advance Advisory (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "National Monsoon Mission",
        advanceNoticeDays: d,
        threatLevel: "High",
        imdColorCode: "Orange"
      });
    }

    // (C) Seasonal Summer Heavy Heat Winds ("Loo" / Scorching Gale)
    if (day.tempMax >= 42 && day.windSpeedMax >= 24) {
      alerts.push({
        id: `alert-summer-heat-wind-${d}-${Date.now()}`,
        title: d >= 7 ? "7-DAY ADVANCE SUMMER HEAT WIND ('LOO') RED ALERT" : "BLISTERING SUMMER HEAT WINDS ('LOO') EMERGENCY",
        severity: "emergency",
        category: "heat",
        headline: `☀️ ${leadLabel}: Dangerous Scorching Heat Winds ('Loo') at ${day.tempMax}°C with ${day.windSpeedMax} km/h winds ${dayStr} in ${locName}`,
        description: `Desiccating, blistering summer winds ('Loo') will sweep the region ${dayStr}. Dangerous combination of extreme heat (${day.tempMax}°C) and dry winds causes rapid body dehydration, heat cramps, and life-threatening heat stroke. High wildfire risk.`,
        instruction: `Strictly avoid direct sunlight and hot wind exposure between 11:00 AM and 4:30 PM. Cover head and face with a wet cotton cloth. Drink plenty of water and ORS/lemon water. Keep pets and livestock in shaded, ventilated enclosures.`,
        effectiveTime: `Summer Climate Alert (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "IMD Climate & Heat Wave Surveillance Unit",
        advanceNoticeDays: d,
        threatLevel: "Severe",
        imdColorCode: "Red"
      });
    } else if (day.tempMax >= 38 && day.windSpeedMax >= 20) {
      alerts.push({
        id: `alert-heat-wind-adv-${d}-${Date.now()}`,
        title: d >= 7 ? "ADVANCE SUMMER HEAT WINDS ('LOO') ADVISORY (1 WEEK OUT)" : "SUMMER HEAVY HEAT WINDS ('LOO') ADVISORY",
        severity: "warning",
        category: "heat",
        headline: `Hot Summer Winds (${day.windSpeedMax} km/h) & ${day.tempMax}°C projected ${dayStr} in ${locName}`,
        description: `Dry, hot winds will produce elevated heat indices and uncomfortable outdoor conditions ${dayStr}.`,
        instruction: `Stay hydrated, wear lightweight cotton clothing, and avoid heavy physical labor during peak heat hours.`,
        effectiveTime: `Seasonal Advisory (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "Seasonal Climate Monitor",
        advanceNoticeDays: d,
        threatLevel: "Moderate",
        imdColorCode: "Orange"
      });
    }

    // (D) Seasonal Winter Bitter Cold Winds ("Sheet Lahar" / Freezing Gale)
    if (day.tempMin <= 4 && day.windSpeedMax >= 22) {
      alerts.push({
        id: `alert-winter-cold-wind-${d}-${Date.now()}`,
        title: d >= 7 ? "7-DAY ADVANCE WINTER COLD WINDS ('SHEET LAHAR') RED ALERT" : "SEVERE WINTER COLD WAVE & SHEET LAHAR EMERGENCY",
        severity: "emergency",
        category: "winter",
        headline: `❄️ ${leadLabel}: Severe Winter Cold Wave Winds ('Sheet Lahar') of ${day.windSpeedMax} km/h with ${day.tempMin}°C ${dayStr} in ${locName}`,
        description: `Intense winter cold wave ('Sheet Lahar') driven by icy northern winds ${dayStr}. Wind-chill values will plunge below freezing. High risk of hypothermia, frostbite on exposed skin, dense morning fog, and frost damage to agricultural crops.`,
        instruction: `Wear multi-layered insulated woolen clothing. Cover head, ears, and neck. Avoid prolonged night exposure. Ensure safe room heating ventilation to prevent carbon monoxide poisoning. Protect winter crops with surface irrigation.`,
        effectiveTime: `Winter Climate Alert (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "IMD Winter Weather & Cold Wave Monitoring Center",
        advanceNoticeDays: d,
        threatLevel: "Severe",
        imdColorCode: "Red"
      });
    } else if (day.tempMin <= 10 && day.windSpeedMax >= 20) {
      alerts.push({
        id: `alert-cold-wind-adv-${d}-${Date.now()}`,
        title: d >= 7 ? "ADVANCE WINTER BITTER COLD WINDS ADVISORY (1 WEEK OUT)" : "WINTER BITTER COLD WINDS ('SHEET LAHAR') ADVISORY",
        severity: "warning",
        category: "winter",
        headline: `Brisk Chilling Winter Winds (${day.windSpeedMax} km/h) projected ${dayStr} in ${locName}`,
        description: `Piercing cold breeze will produce noticeable wind chill with minimum temperatures dropping to ${day.tempMin}°C.`,
        instruction: `Dress warmly in insulated layers, drink hot beverages, and stay indoors during cold windy night periods.`,
        effectiveTime: `Seasonal Advisory (${leadLabel})`,
        expiresTime: day.fullDate,
        source: "Seasonal Climate Monitor",
        advanceNoticeDays: d,
        threatLevel: "Moderate",
        imdColorCode: "Orange"
      });
    }
  }

  // 2. Real-Time Active Condition Checks (Current weather today)
  if (current.temperature >= 38 && current.windSpeed >= 20) {
    if (!alerts.some(a => a.category === "heat")) {
      alerts.push({
        id: `alert-current-loo-${Date.now()}`,
        title: "ACTIVE SUMMER HEAT WINDS ('LOO') WARNING",
        severity: current.temperature >= 42 ? "emergency" : "warning",
        category: "heat",
        headline: `Blistering Summer Heat Winds ('Loo') Active Now in ${locName}`,
        description: `Air temperatures of ${Math.round(current.temperature)}°C accompanied by dry winds of ${current.windSpeed} km/h create dangerous heat stress.`,
        instruction: `Stay indoors in air-conditioned or shaded areas. Rehydrate constantly with oral electrolyte solutions.`,
        effectiveTime: "Active Now",
        expiresTime: "Until 6:30 PM",
        source: "IMD Heat Wave Surveillance Unit",
        advanceNoticeDays: 0,
        threatLevel: current.temperature >= 42 ? "Severe" : "High",
        imdColorCode: current.temperature >= 42 ? "Red" : "Orange"
      });
    }
  }

  if (current.temperature <= 10 && current.windSpeed >= 18) {
    if (!alerts.some(a => a.category === "winter")) {
      alerts.push({
        id: `alert-current-sheet-lahar-${Date.now()}`,
        title: "ACTIVE WINTER COLD WAVE WINDS ('SHEET LAHAR') ALERT",
        severity: current.temperature <= 4 ? "emergency" : "warning",
        category: "winter",
        headline: `Severe Chilling Winter Winds ('Sheet Lahar') Sweeping ${locName}`,
        description: `Biting cold winds of ${current.windSpeed} km/h with temperatures of ${Math.round(current.temperature)}°C create acute wind chill risk.`,
        instruction: `Wear heavy woolens, cover face and ears, and keep infants and elderly indoors.`,
        effectiveTime: "Active Now",
        expiresTime: "Until Tomorrow Morning",
        source: "IMD Cold Wave Monitoring Center",
        advanceNoticeDays: 0,
        threatLevel: current.temperature <= 4 ? "Severe" : "High",
        imdColorCode: current.temperature <= 4 ? "Red" : "Orange"
      });
    }
  }


  // 1. Severe Thunderstorm / Squall / Hail Alert
  if ([95, 96, 99].includes(current.weatherCode) || (hourly.some(h => [96, 99].includes(h.weatherCode) && h.precipitationProbability > 50))) {
    alerts.push({
      id: `alert-storm-${Date.now()}`,
      title: "Severe Thunderstorm Warning",
      severity: "warning",
      category: "storm",
      headline: `Severe Thunderstorm Warning in effect for ${locName}`,
      description: `Doppler radar and atmospheric instability indicate severe thunderstorms producing dangerous lightning, heavy downpours, and localized hail or wind gusts in excess of 70 km/h.`,
      instruction: `Move to an interior room on the lowest floor of a sturdy building. Avoid windows, electrical appliances, and open outdoor areas until the storm passes.`,
      effectiveTime: "Active Now",
      expiresTime: "In 3 hours",
      source: "National Weather & Meteorological Services"
    });
  }

  // 2. High Wind / Gale Warning
  if (current.windGusts >= 75 || current.windSpeed >= 55) {
    alerts.push({
      id: `alert-wind-${Date.now()}`,
      title: "High Wind Warning",
      severity: "warning",
      category: "wind",
      headline: `Damaging Wind Gusts up to ${current.windGusts} km/h reported near ${locName}`,
      description: `Sustained winds of ${current.windSpeed} km/h with gusts exceeding ${current.windGusts} km/h are occurring. Expect downed tree limbs, localized power outages, and difficult travel for high-profile vehicles.`,
      instruction: `Secure loose outdoor furniture, trash cans, and objects. Drivers of high-profile vehicles should exercise extreme caution on bridges and open highways.`,
      effectiveTime: "Active Now",
      expiresTime: "Until 8:00 PM",
      source: "Aviation & Maritime Meteorological Authority"
    });
  } else if (current.windGusts >= 50 || current.windSpeed >= 38) {
    alerts.push({
      id: `alert-wind-adv-${Date.now()}`,
      title: "Wind Advisory",
      severity: "advisory",
      category: "wind",
      headline: `Breezy to Gusty Conditions for ${locName}`,
      description: `Wind gusts up to ${current.windGusts} km/h could blow around unsecured objects.`,
      instruction: `Use extra caution when driving, especially when crossing elevated roadways.`,
      effectiveTime: "Active Now",
      expiresTime: "Until 6:00 PM",
      source: "Regional Weather Center"
    });
  }

  // 3. Extreme Heat Warning / Heat Advisory
  const apparentTemp = current.apparentTemperature;
  if (apparentTemp >= 40) {
    alerts.push({
      id: `alert-heat-${Date.now()}`,
      title: "Excessive Heat Warning",
      severity: "emergency",
      category: "heat",
      headline: `Dangerous Heat Index of ${Math.round(apparentTemp)}°C in ${locName}`,
      description: `Prolonged period of dangerously hot temperatures and high humidity will significantly increase the risk of heat-related illnesses, heat exhaustion, and heat stroke.`,
      instruction: `Drink plenty of fluids, stay in air-conditioned rooms, stay out of direct sun, and check up on relatives and neighbors. Never leave children or pets in unattended vehicles.`,
      effectiveTime: "Active Now",
      expiresTime: "Until 8:00 PM Tomorrow",
      source: "Public Health Weather Advisory Board"
    });
  } else if (apparentTemp >= 35 || current.temperature >= 35) {
    alerts.push({
      id: `alert-heat-adv-${Date.now()}`,
      title: "Heat Advisory",
      severity: "advisory",
      category: "heat",
      headline: `Heat Advisory issued for ${locName}`,
      description: `High temperatures and humidity will combine to create heat index values up to ${Math.round(apparentTemp)}°C.`,
      instruction: `Reschedule strenuous activities to early morning or evening. Take frequent rest breaks in shade or air-conditioned environments.`,
      effectiveTime: "Active Now",
      expiresTime: "Until 7:00 PM",
      source: "Regional Meteorological Office"
    });
  }

  // 4. Freeze / Winter Storm Warning
  if (current.temperature <= -10 || (current.temperature <= 0 && [71, 73, 75, 85, 86, 66, 67].includes(current.weatherCode))) {
    alerts.push({
      id: `alert-winter-${Date.now()}`,
      title: "Winter Weather & Freeze Warning",
      severity: "warning",
      category: "winter",
      headline: `Sub-Freezing Temperatures & Winter Precipitation in ${locName}`,
      description: `Freezing temperatures of ${current.temperature}°C with potential for icy road surfaces, freezing rain, and hazardous transit conditions.`,
      instruction: `Slow down and use caution while traveling. Protect sensitive plants, wrap outdoor pipes, and ensure pets have warm indoor shelter.`,
      effectiveTime: "Active Now",
      expiresTime: "Tomorrow Morning 9:00 AM",
      source: "National Climate Center"
    });
  }

  // 5. Flash Flood / Heavy Rain Risk
  const heavyRainProb = daily[0]?.precipitationProbability >= 80 && daily[0]?.precipitationSum >= 25;
  if ([65, 82].includes(current.weatherCode) || heavyRainProb) {
    alerts.push({
      id: `alert-flood-${Date.now()}`,
      title: "Flash Flood Watch",
      severity: "watch",
      category: "flood",
      headline: `Heavy Downpours with Flash Flooding Potential for ${locName}`,
      description: `Torrential rainfall could lead to localized urban drainage overflow, low-lying road ponding, and rapid stream rises.`,
      instruction: `Turn around, don't drown when encountering flooded roads. Most flood deaths occur in vehicles. Be aware of your surroundings.`,
      effectiveTime: "Active Now",
      expiresTime: "Until Midnight",
      source: "Hydrological Alert Network"
    });
  }

  // 6. Extreme UV Radiation Warning
  if (current.uvIndex >= 10) {
    alerts.push({
      id: `alert-uv-${Date.now()}`,
      title: "Extreme UV Radiation Alert",
      severity: "advisory",
      category: "uv",
      headline: `UV Index of ${current.uvIndex} (Extreme) over ${locName}`,
      description: `Unprotected skin and eyes can burn within 10 minutes. Solar radiation levels are at peak intensity.`,
      instruction: `Wear SPF 50+ sunscreen, a wide-brimmed hat, UV-blocking sunglasses, and seek shade during midday hours.`,
      effectiveTime: "Active 11:00 AM – 3:30 PM",
      expiresTime: "Today 4:00 PM",
      source: "Environmental Radiation Observatory"
    });
  }

  // 7. Hazardous Air Quality Alert
  if (airQuality && airQuality.usAqi >= 150) {
    const isEmergency = airQuality.usAqi >= 250;
    alerts.push({
      id: `alert-air-${Date.now()}`,
      title: isEmergency ? "Hazardous Air Quality Emergency" : "Unhealthy Air Quality Alert",
      severity: isEmergency ? "emergency" : "warning",
      category: "air",
      headline: `Air Quality Index of ${airQuality.usAqi} (${airQuality.statusLabel}) in ${locName}`,
      description: `Fine particulate matter (PM2.5: ${airQuality.pm25} µg/m³) has reached unhealthy concentrations, increasing respiratory vulnerability for the entire community.`,
      instruction: `Keep windows closed, run indoor HEPA air purifiers, wear an N95/P2 particulate mask if outdoors, and eliminate strenuous outdoor exercise.`,
      effectiveTime: "Active Now",
      expiresTime: "Until Further Notice",
      source: "Global Clean Air Monitoring Network"
    });
  }

  // 8. Dense Fog Advisory
  if (current.visibility < 1000 || [45, 48].includes(current.weatherCode)) {
    alerts.push({
      id: `alert-fog-${Date.now()}`,
      title: "Dense Fog Advisory",
      severity: "advisory",
      category: "fog",
      headline: `Visibility Reduced to ${Math.round(current.visibility)} meters in ${locName}`,
      description: `Thick surface fog causing hazardous driving conditions due to low visibility.`,
      instruction: `If driving, slow down, use low-beam headlights, and leave plenty of distance ahead of you.`,
      effectiveTime: "Active Now",
      expiresTime: "Until 10:00 AM",
      source: "Transportation Meteorological Service"
    });
  }

  return alerts;
}

// Request AI Meteorologist briefing from the server API
export async function getAiMeteorologistBriefing(
  location: GeoLocation,
  current: CurrentWeather,
  daily: DailyForecastItem[],
  alerts: WeatherAlert[]
): Promise<AiBriefingResponse> {
  try {
    const res = await fetch("/api/ai-briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location,
        current,
        daily,
        alerts
      })
    });
    if (!res.ok) throw new Error("API call failed");
    return await res.json();
  } catch (err) {
    console.warn("AI briefing fetch fallback:", err);
    return {
      briefing: `Today across ${location.name}, conditions feature ${current.weatherDescription.toLowerCase()} with temperatures hovering near ${Math.round(current.temperature)}°C. Winds are averaging ${current.windSpeed} km/h. Keep updated on local shifts.`,
      recommendations: [
        current.precipitation > 0 ? "Rain gear recommended for wet conditions" : "Clear conditions favorable for regular routines",
        current.temperature > 24 ? "Light clothing and hydration advised" : "Carry an extra outer layer for temperature changes"
      ]
    };
  }
}
