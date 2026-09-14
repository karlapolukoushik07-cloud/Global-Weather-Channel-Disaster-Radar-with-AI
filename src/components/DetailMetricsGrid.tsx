import React from "react";
import { CurrentWeather, UnitSystem, DailyForecastItem } from "../types/weather";
import { 
  formatTemp, 
  formatSpeed, 
  formatPressure, 
  formatVisibility, 
  degreesToCompass, 
  getUvCategory,
  getAqiCategory 
} from "../utils/weatherCodes";
import { 
  Wind, 
  Droplets, 
  Sun, 
  Compass, 
  Eye, 
  Gauge, 
  Sunrise, 
  Sunset, 
  Moon, 
  Activity, 
  Cloud,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface DetailMetricsGridProps {
  current: CurrentWeather;
  unit: UnitSystem;
  todayDaily?: DailyForecastItem;
}

export const DetailMetricsGrid: React.FC<DetailMetricsGridProps> = ({ current, unit, todayDaily }) => {
  const uvInfo = getUvCategory(current.uvIndex);
  const aqiInfo = current.airQuality ? getAqiCategory(current.airQuality.usAqi) : null;

  // Calculate daylight progress if daytime
  const sunriseTime = current.sunrise.slice(-5);
  const sunsetTime = current.sunset.slice(-5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
          <span>Atmospheric Conditions & Details</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">Updated every 15 mins</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Wind & Gusts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Wind className="w-4 h-4 text-teal-400" />
              <span>Wind & Gusts</span>
            </span>
            <span className="text-teal-400 font-mono font-bold">{degreesToCompass(current.windDirection)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono-num">
                {formatSpeed(current.windSpeed, unit)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Gusts up to <strong className="text-white">{formatSpeed(current.windGusts, unit)}</strong>
              </div>
            </div>

            {/* Visual Compass Needle */}
            <div className="relative w-14 h-14 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center">
              <span className="absolute top-1 text-[8px] font-bold text-slate-500">N</span>
              <div 
                className="w-8 h-1 bg-gradient-to-r from-teal-400 to-transparent rounded-full transition-transform duration-700"
                style={{ transform: `rotate(${current.windDirection - 90}deg)` }}
              />
              <div className="w-2 h-2 rounded-full bg-teal-400" />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            Direction: {current.windDirection}° from true north
          </div>
        </div>

        {/* 2. Humidity & Dew Point */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span>Humidity</span>
            </span>
            <span className="text-blue-400 font-bold">{current.humidity}%</span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-num">
              {current.humidity}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Dew Point: <strong className="text-white">{formatTemp(current.dewPoint, unit)}</strong>
            </div>
          </div>

          {/* Humidity Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${current.humidity}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            {current.dewPoint > 20 
              ? "Feels muggy and humid" 
              : current.dewPoint < 10 
              ? "Comfortable and dry air" 
              : "Moderate atmospheric moisture"}
          </div>
        </div>

        {/* 3. UV Index */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3 group transition-transform hover:-translate-y-1 hover:shadow-2xl hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-amber-400 group-hover:animate-pulse" />
              <span>UV Index</span>
            </span>
            <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
              current.uvIndex <= 2 ? 'bg-emerald-950/50 text-emerald-400' :
              current.uvIndex <= 5 ? 'bg-amber-950/50 text-amber-400' :
              current.uvIndex <= 7 ? 'bg-orange-950/50 text-orange-400' :
              current.uvIndex <= 10 ? 'bg-red-950/50 text-red-400' :
              'bg-purple-950/50 text-purple-400'
            }`}>
              {uvInfo.label}
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-num flex items-baseline space-x-1">
              <span>{current.uvIndex}</span>
              <span className="text-sm font-normal text-slate-500">/ 11+</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Max today: <strong className="text-white">{todayDaily?.uvIndexMax ?? current.uvIndex}</strong>
            </div>
          </div>

          {/* Interactive Custom UV Scale Meter */}
          <div className="relative pt-4 pb-2 w-full">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 w-2/12" title="Low (0-2)"></div>
              <div className="h-full bg-amber-400 w-3/12" title="Moderate (3-5)"></div>
              <div className="h-full bg-orange-500 w-2/12" title="High (6-7)"></div>
              <div className="h-full bg-red-600 w-3/12" title="Very High (8-10)"></div>
              <div className="h-full bg-purple-600 w-2/12" title="Extreme (11+)"></div>
            </div>
            
            {/* Value Marker Pointer */}
            <div 
              className="absolute top-2 w-4 h-4 bg-white rounded-full shadow-md border-2 transition-all duration-1000 ease-out"
              style={{ 
                left: `calc(${Math.min(100, (current.uvIndex / 12) * 100)}% - 8px)`,
                borderColor: current.uvIndex <= 2 ? '#34d399' :
                            current.uvIndex <= 5 ? '#fbbf24' :
                            current.uvIndex <= 7 ? '#f97316' :
                            current.uvIndex <= 10 ? '#dc2626' : '#9333ea'
              }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap shadow-lg z-10 font-bold">
                Level {current.uvIndex}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 line-clamp-1">
            {current.uvIndex > 7 ? <strong className="text-orange-400 pr-1">DANGER:</strong> : ""}
            {uvInfo.advice}
          </div>
        </div>

        {/* 4. Air Quality Index */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Air Quality</span>
            </span>
            <span className="text-slate-400 text-[10px]">US AQI</span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-num flex items-baseline space-x-2">
              <span>{current.airQuality?.usAqi ?? 35}</span>
              <span className={`text-sm font-bold ${current.airQuality?.statusColor ?? "text-emerald-400"}`}>
                {current.airQuality?.statusLabel ?? "Good"}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              PM2.5: <strong className="text-white">{current.airQuality?.pm25 ?? 9} µg/m³</strong> • PM10: {current.airQuality?.pm10 ?? 18}
            </div>
          </div>

          {/* AQI Scale Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 via-orange-500 to-red-600 transition-all duration-700"
              style={{ width: `${Math.min(100, ((current.airQuality?.usAqi ?? 35) / 300) * 100)}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 line-clamp-1">
            {current.airQuality?.healthRecommendation ?? "Ideal conditions for normal outdoor activities."}
          </div>
        </div>

        {/* 5. Barometric Pressure */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span>Pressure</span>
            </span>
            <div className="flex items-center space-x-1 text-slate-300">
              {current.pressureTendency === "rising" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : current.pressureTendency === "falling" ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="capitalize text-[11px]">{current.pressureTendency}</span>
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-num">
              {formatPressure(current.pressure, unit)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Mean Sea Level Pressure
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            {current.pressure >= 1018 
              ? "High pressure system bringing settled skies" 
              : current.pressure <= 1005 
              ? "Low pressure system indicating cloudiness or precipitation" 
              : "Stable atmospheric barometric baseline"}
          </div>
        </div>

        {/* 6. Visibility & Cloud Cover */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Visibility</span>
            </span>
            <span className="text-sky-400 font-bold">{current.cloudCover}% Cloud</span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-num">
              {formatVisibility(current.visibility, unit)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Sky Cover: <strong className="text-white">{current.cloudCover}%</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            {current.visibility >= 10000 
              ? "Unobstructed clear horizontal view" 
              : "Slight atmospheric haze or moisture reduction"}
          </div>
        </div>

        {/* 7. Sunrise & Sunset Solar Arc */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Sunrise className="w-4 h-4 text-amber-400" />
              <span>Sun & Solar Path</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                <span>Rise</span>
              </div>
              <div className="text-base font-bold text-white font-mono-num">
                {sunriseTime}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="space-y-0.5 text-right">
              <div className="text-xs text-slate-400 flex items-center justify-end space-x-1">
                <Sunset className="w-3.5 h-3.5 text-orange-400" />
                <span>Set</span>
              </div>
              <div className="text-base font-bold text-white font-mono-num">
                {sunsetTime}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            Daylight duration: ~12 hours of natural sunlight
          </div>
        </div>

        {/* 8. Moon Phase & Illumination */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Moon className="w-4 h-4 text-indigo-300" />
              <span>Lunar Phase</span>
            </span>
            <span className="text-indigo-300 font-bold">{current.moonPhase.fraction}%</span>
          </div>

          <div>
            <div className="text-lg font-bold text-white tracking-tight">
              {current.moonPhase.phase}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {current.moonPhase.description}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            Next full lunar cycle in ~29.5 days
          </div>
        </div>

      </div>
    </div>
  );
};
