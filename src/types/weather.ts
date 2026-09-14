export type UnitSystem = "metric" | "imperial";

export interface GeoLocation {
  id?: number;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
}

export interface AirQualityData {
  europeanAqi: number;
  usAqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  statusLabel: string;
  statusColor: string;
  healthRecommendation: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  pressureTendency?: "rising" | "falling" | "steady";
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
  visibility: number; // in meters or km
  precipitation: number;
  cloudCover: number;
  isDay: boolean;
  weatherCode: number;
  weatherDescription: string;
  conditionIconName: string;
  airQuality?: AirQualityData;
  time: string;
  sunrise: string;
  sunset: string;
  moonPhase: {
    phase: string;
    fraction: number;
    description: string;
  };
}

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitationAmount: number;
  weatherCode: number;
  weatherDescription: string;
  conditionIconName: string;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  fullDate: string;
  weatherCode: number;
  weatherDescription: string;
  conditionIconName: string;
  tempMax: number;
  tempMin: number;
  apparentMax: number;
  apparentMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  // Daypart breakdown like Weather Channel
  morningTemp: number;
  afternoonTemp: number;
  eveningTemp: number;
  nightTemp: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: "advisory" | "watch" | "warning" | "emergency";
  category: "heat" | "wind" | "storm" | "flood" | "winter" | "uv" | "air" | "fog" | "general";
  headline: string;
  description: string;
  instruction: string;
  effectiveTime: string;
  expiresTime: string;
  source: string;
  advanceNoticeDays?: number; // e.g. 7 for 7 days ahead
  threatLevel?: "Low" | "Moderate" | "High" | "Severe" | "Catastrophic";
  imdColorCode?: "Green" | "Yellow" | "Orange" | "Red";
}

export interface AiBriefingResponse {
  briefing: string;
  recommendations: string[];
  source?: string;
}

export interface HistoricalData {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
}

export interface WeatherFetchResult {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  historical?: HistoricalData[];
  alerts: WeatherAlert[];
  location: GeoLocation;
}

export interface PlannedEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  locationName: string;
  latitude: number;
  longitude: number;
  aiAdvice?: string;
  hasRisk?: boolean;
}

export type EmergencyCategory = "police" | "fire" | "disaster" | "medical" | "coastguard" | "custom";

export interface EmergencyContact {
  id: string;
  category: EmergencyCategory;
  name: string;
  department: string;
  number: string;
  description: string;
  availableHours: string;
  isCustom?: boolean;
}

