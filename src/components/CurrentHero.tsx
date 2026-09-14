import React from "react";
import { CurrentWeather, GeoLocation, UnitSystem, DailyForecastItem } from "../types/weather";
import { formatTemp, formatSpeed } from "../utils/weatherCodes";
import { WeatherIcon } from "./WeatherIcon";
import { MapPin, Wind, Droplets, Sun, Sparkles, ArrowUp, ArrowDown, Activity } from "lucide-react";

interface CurrentHeroProps {
  current: CurrentWeather;
  location: GeoLocation;
  unit: UnitSystem;
  todayDaily?: DailyForecastItem;
  onViewRadarClick?: () => void;
}

export const CurrentHero: React.FC<CurrentHeroProps> = ({
  current,
  location,
  unit,
  todayDaily,
  onViewRadarClick
}) => {
  // Format localized time
  const timeFormatted = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border border-slate-800 shadow-xl text-white p-6 sm:p-8">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left: Location, Condition, Temperature */}
        <div className="space-y-3">
          {/* Location & Time Stamp */}
          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{location.name}</span>
              {location.countryCode && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {location.countryCode}
                </span>
              )}
            </h1>
            <span className="text-slate-500">•</span>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">
              As of {timeFormatted}
            </span>
          </div>

          {/* Temperature & Icon Row */}
          <div className="flex items-center space-x-6 sm:space-x-8 pt-1">
            <div className="flex items-baseline">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white font-mono-num drop-shadow-sm">
                {formatTemp(current.temperature, unit)}
              </span>
            </div>

            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                  <WeatherIcon 
                    name={current.conditionIconName} 
                    className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow" 
                    animate 
                  />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {current.weatherDescription}
                  </h2>
                  <div className="text-xs sm:text-sm text-slate-300 flex items-center space-x-2">
                    <span>Feels like <strong className="text-white font-semibold">{formatTemp(current.apparentTemperature, unit)}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High / Low & Precipitation Callout */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-400">High:</span>
              <span className="font-semibold text-white">{formatTemp(current.tempMax, unit)}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Low:</span>
              <span className="font-semibold text-white">{formatTemp(current.tempMin, unit)}</span>
            </div>
            
            {todayDaily && todayDaily.precipitationProbability > 0 && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-700/50 text-blue-200">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>{todayDaily.precipitationProbability}% precip chance today</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Micro-Metrics & Radar Jump */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2.5 w-full md:w-56 text-xs">
            {/* Wind */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Wind</span>
              </span>
              <span className="font-semibold text-white">
                {formatSpeed(current.windSpeed, unit)}
              </span>
            </div>

            {/* Humidity */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Humidity</span>
              </span>
              <span className="font-semibold text-white">{current.humidity}%</span>
            </div>

            {/* Air Quality */}
            {current.airQuality && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Air Quality</span>
                </span>
                <span className={`font-semibold ${current.airQuality.statusColor}`}>
                  {current.airQuality.usAqi} • {current.airQuality.statusLabel}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Radar Quick Launcher */}
          {onViewRadarClick && (
            <button
              onClick={onViewRadarClick}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Open Live Doppler Radar</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
