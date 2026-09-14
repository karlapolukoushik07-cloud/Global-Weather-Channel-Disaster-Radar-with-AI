import { UnitSystem } from "../types/weather";

export interface WeatherCodeInfo {
  description: string;
  iconName: "Sun" | "Moon" | "CloudSun" | "CloudMoon" | "Cloud" | "CloudFog" | "CloudDrizzle" | "CloudRain" | "CloudSnow" | "CloudLightning" | "Snowflake" | "Wind";
  backgroundGradient: string;
  themeColor: string;
}

export function getWeatherCodeInfo(code: number, isDay: boolean = true): WeatherCodeInfo {
  switch (code) {
    case 0:
      return {
        description: isDay ? "Clear Sky" : "Clear Night",
        iconName: isDay ? "Sun" : "Moon",
        backgroundGradient: isDay 
          ? "from-sky-500 via-blue-600 to-indigo-700" 
          : "from-slate-900 via-indigo-950 to-slate-950",
        themeColor: isDay ? "#0284c7" : "#1e1b4b"
      };
    case 1:
      return {
        description: isDay ? "Mainly Sunny" : "Mostly Clear",
        iconName: isDay ? "CloudSun" : "CloudMoon",
        backgroundGradient: isDay
          ? "from-sky-500 via-blue-600 to-indigo-700"
          : "from-slate-900 via-indigo-950 to-slate-950",
        themeColor: isDay ? "#0369a1" : "#1e1b4b"
      };
    case 2:
      return {
        description: "Partly Cloudy",
        iconName: isDay ? "CloudSun" : "CloudMoon",
        backgroundGradient: isDay
          ? "from-blue-500 via-slate-600 to-slate-700"
          : "from-slate-900 via-slate-950 to-black",
        themeColor: "#475569"
      };
    case 3:
      return {
        description: "Overcast",
        iconName: "Cloud",
        backgroundGradient: "from-slate-600 via-slate-700 to-slate-800",
        themeColor: "#475569"
      };
    case 45:
    case 48:
      return {
        description: "Dense Fog",
        iconName: "CloudFog",
        backgroundGradient: "from-slate-500 via-zinc-600 to-stone-700",
        themeColor: "#64748b"
      };
    case 51:
    case 53:
    case 55:
      return {
        description: "Light Drizzle",
        iconName: "CloudDrizzle",
        backgroundGradient: "from-slate-600 via-blue-800 to-slate-900",
        themeColor: "#0284c7"
      };
    case 56:
    case 57:
      return {
        description: "Freezing Drizzle",
        iconName: "CloudSnow",
        backgroundGradient: "from-cyan-800 via-slate-800 to-slate-950",
        themeColor: "#0891b2"
      };
    case 61:
      return {
        description: "Slight Rain",
        iconName: "CloudRain",
        backgroundGradient: "from-blue-700 via-slate-800 to-slate-900",
        themeColor: "#2563eb"
      };
    case 63:
      return {
        description: "Moderate Rain",
        iconName: "CloudRain",
        backgroundGradient: "from-blue-800 via-slate-900 to-slate-950",
        themeColor: "#1d4ed8"
      };
    case 65:
      return {
        description: "Heavy Rain",
        iconName: "CloudRain",
        backgroundGradient: "from-blue-900 via-indigo-950 to-black",
        themeColor: "#1e40af"
      };
    case 66:
    case 67:
      return {
        description: "Freezing Rain",
        iconName: "CloudSnow",
        backgroundGradient: "from-cyan-900 via-slate-900 to-slate-950",
        themeColor: "#0891b2"
      };
    case 71:
      return {
        description: "Slight Snowfall",
        iconName: "Snowflake",
        backgroundGradient: "from-blue-600 via-slate-700 to-slate-800",
        themeColor: "#38bdf8"
      };
    case 73:
    case 75:
    case 77:
      return {
        description: "Heavy Snow",
        iconName: "Snowflake",
        backgroundGradient: "from-slate-700 via-sky-900 to-slate-950",
        themeColor: "#0284c7"
      };
    case 80:
    case 81:
    case 82:
      return {
        description: "Rain Showers",
        iconName: "CloudRain",
        backgroundGradient: "from-blue-700 via-slate-800 to-slate-900",
        themeColor: "#2563eb"
      };
    case 85:
    case 86:
      return {
        description: "Snow Showers",
        iconName: "Snowflake",
        backgroundGradient: "from-slate-600 via-blue-900 to-slate-950",
        themeColor: "#38bdf8"
      };
    case 95:
      return {
        description: "Thunderstorm",
        iconName: "CloudLightning",
        backgroundGradient: "from-purple-900 via-slate-900 to-slate-950",
        themeColor: "#7c3aed"
      };
    case 96:
    case 99:
      return {
        description: "Severe Thunderstorm with Hail",
        iconName: "CloudLightning",
        backgroundGradient: "from-violet-950 via-slate-950 to-black",
        themeColor: "#dc2626"
      };
    default:
      return {
        description: "Partly Cloudy",
        iconName: isDay ? "CloudSun" : "CloudMoon",
        backgroundGradient: "from-blue-600 via-slate-700 to-slate-800",
        themeColor: "#3b82f6"
      };
  }
}

// Unit conversion functions
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function mmToInches(mm: number): number {
  return mm * 0.0393701;
}

export function hpaToInHg(hpa: number): number {
  return hpa * 0.02953;
}

export function metersToMiles(m: number): number {
  return (m / 1000) * 0.621371;
}

export function formatTemp(celsius: number, unit: UnitSystem): string {
  const val = unit === "imperial" ? celsiusToFahrenheit(celsius) : celsius;
  return `${Math.round(val)}°`;
}

export function formatSpeed(kmh: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    return `${Math.round(kmhToMph(kmh))} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPrecip(mm: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    return `${mmToInches(mm).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatPressure(hpa: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    return `${hpaToInHg(hpa).toFixed(2)} inHg`;
  }
  return `${Math.round(hpa)} hPa`;
}

export function formatVisibility(meters: number, unit: UnitSystem): string {
  if (unit === "imperial") {
    const miles = metersToMiles(meters);
    return `${miles >= 10 ? Math.round(miles) : miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
}

// Moon Phase calculation
export function getMoonPhase(date: Date = new Date()): { phase: string; fraction: number; description: string } {
  // Known reference new moon: January 11, 2024 at 11:57 UTC
  const reference = new Date(Date.UTC(2024, 0, 11, 11, 57, 0)).getTime();
  const current = date.getTime();
  const synodicMonth = 29.53058770576 * 86400000; // ms in synodic month
  const diff = (current - reference) % synodicMonth;
  const normalizedDiff = diff < 0 ? diff + synodicMonth : diff;
  const ageDays = normalizedDiff / 86400000;
  const phaseFraction = ageDays / 29.53058770576;

  let phase = "New Moon";
  let description = "Dark Moon";

  if (ageDays < 1.84) {
    phase = "New Moon";
    description = "Illumination ~0%";
  } else if (ageDays < 5.53) {
    phase = "Waxing Crescent";
    description = "Visible in western sky after sunset";
  } else if (ageDays < 9.22) {
    phase = "First Quarter";
    description = "Half illuminated on the right";
  } else if (ageDays < 12.91) {
    phase = "Waxing Gibbous";
    description = "Growing toward full moon";
  } else if (ageDays < 16.61) {
    phase = "Full Moon";
    description = "Fully illuminated night disk";
  } else if (ageDays < 20.3) {
    phase = "Waning Gibbous";
    description = "Decreasing illumination";
  } else if (ageDays < 23.99) {
    phase = "Last Quarter";
    description = "Half illuminated on the left";
  } else if (ageDays < 27.68) {
    phase = "Waning Crescent";
    description = "Visible before dawn in east";
  } else {
    phase = "New Moon";
    description = "Illumination ~0%";
  }

  // Calculate illumination fraction (0 to 1)
  const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * ageDays) / 29.53058770576));

  return {
    phase,
    fraction: Math.round(illumination * 100),
    description
  };
}

// Convert wind direction degrees to 16-point cardinal compass
export function degreesToCompass(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

// UV Index interpretation
export function getUvCategory(uv: number): { label: string; color: string; advice: string } {
  if (uv < 3) return { label: "Low", color: "text-emerald-500", advice: "Minimal sun protection needed. Safe for outdoor play." };
  if (uv < 6) return { label: "Moderate", color: "text-amber-500", advice: "Wear sunscreen and sunglasses during peak midday hours." };
  if (uv < 8) return { label: "High", color: "text-orange-500", advice: "Protection required. Seek shade during 11 AM – 4 PM." };
  if (uv < 11) return { label: "Very High", color: "text-red-500", advice: "Extra protection needed. Avoid prolonged direct sun exposure." };
  return { label: "Extreme", color: "text-purple-600", advice: "Take all precautions. Unprotected skin can burn in minutes." };
}

// Air Quality Index interpretation
export function getAqiCategory(usAqi: number): { label: string; color: string; advice: string } {
  if (usAqi <= 50) return { label: "Good", color: "text-emerald-500", advice: "Air quality is satisfactory with little or no risk." };
  if (usAqi <= 100) return { label: "Moderate", color: "text-amber-500", advice: "Acceptable quality; sensitive individuals may experience minor symptoms." };
  if (usAqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "text-orange-500", advice: "People with respiratory or heart diseases should limit prolonged outdoor exertion." };
  if (usAqi <= 200) return { label: "Unhealthy", color: "text-red-500", advice: "Everyone may begin to experience health effects; sensitive groups should avoid outdoor exertion." };
  if (usAqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600", advice: "Health alert: serious risk of health effects for all individuals." };
  return { label: "Hazardous", color: "text-rose-900", advice: "Emergency health warning: avoid all outdoor physical activity." };
}
