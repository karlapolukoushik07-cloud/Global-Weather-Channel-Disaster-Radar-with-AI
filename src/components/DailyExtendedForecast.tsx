import React, { useState, useMemo } from "react";
import { DailyForecastItem, UnitSystem } from "../types/weather";
import { formatTemp, formatSpeed, formatPrecip } from "../utils/weatherCodes";
import { WeatherIcon } from "./WeatherIcon";
import { Droplets, Wind, ChevronDown, ChevronUp, Sun, Moon, Sunrise, Sunset } from "lucide-react";

interface DailyExtendedForecastProps {
  daily: DailyForecastItem[];
  unit: UnitSystem;
}

export const DailyExtendedForecast: React.FC<DailyExtendedForecastProps> = ({ daily, unit }) => {
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(0); // First day expanded by default
  const [daysCount, setDaysCount] = useState<number>(10); // Toggle between 7, 10, or 16 days

  const displayedDays = useMemo(() => daily.slice(0, daysCount), [daily, daysCount]);

  // Global min and max across displayed days to compute proportional temperature bar widths
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    displayedDays.forEach(d => {
      if (d.tempMin < min) min = d.tempMin;
      if (d.tempMax > max) max = d.tempMax;
    });
    if (min === Infinity) return { globalMin: 0, globalMax: 30 };
    return { globalMin: min, globalMax: max };
  }, [displayedDays]);

  const globalRange = Math.max(globalMax - globalMin, 1);

  const toggleExpand = (index: number) => {
    setExpandedDayIndex(expandedDayIndex === index ? null : index);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-5 sm:p-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span>Extended Forecast</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              {daysCount}-Day Outlook
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            16-day global numerical weather prediction with daypart breakdown
          </p>
        </div>

        {/* Days Count Selector */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto text-xs font-semibold">
          {[7, 10, 16].map((count) => (
            <button
              key={count}
              onClick={() => setDaysCount(count)}
              className={`px-3 py-1.5 rounded-lg transition ${
                daysCount === count
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {count} Days
            </button>
          ))}
        </div>
      </div>

      {/* Days List */}
      <div className="divide-y divide-slate-800/80 mt-2">
        {displayedDays.map((day, index) => {
          const isExpanded = expandedDayIndex === index;

          // Proportional bar offset and width
          const leftPercent = ((day.tempMin - globalMin) / globalRange) * 100;
          const widthPercent = Math.max(((day.tempMax - day.tempMin) / globalRange) * 100, 8);

          return (
            <div key={day.date} className="py-2.5 transition">
              
              {/* Main Summary Row */}
              <div
                onClick={() => toggleExpand(index)}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition select-none"
              >
                {/* Day name & date */}
                <div className="w-24 sm:w-28 flex-shrink-0">
                  <div className="font-bold text-sm text-white">
                    {day.dayName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {day.fullDate}
                  </div>
                </div>

                {/* Weather Condition & Icon */}
                <div className="flex items-center space-x-2.5 flex-1 min-w-[130px]">
                  <WeatherIcon name={day.conditionIconName} className="w-6 h-6 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200 truncate hidden md:inline">
                    {day.weatherDescription}
                  </span>
                </div>

                {/* Rain Chance */}
                <div className="w-16 flex items-center justify-center text-xs">
                  {day.precipitationProbability > 0 ? (
                    <div className="flex items-center space-x-1 text-blue-400 font-semibold">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>{day.precipitationProbability}%</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-mono-num">—</span>
                  )}
                </div>

                {/* Min / Max Temperature Gradient Bar */}
                <div className="flex items-center space-x-2 w-36 sm:w-48 flex-shrink-0">
                  <span className="text-xs font-mono-num font-semibold text-slate-400 w-7 text-right">
                    {formatTemp(day.tempMin, unit)}
                  </span>
                  
                  {/* Visual Bar Track */}
                  <div className="relative flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-rose-500"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`
                      }}
                    />
                  </div>

                  <span className="text-xs font-mono-num font-bold text-white w-7">
                    {formatTemp(day.tempMax, unit)}
                  </span>
                </div>

                {/* Accordion Arrow */}
                <div className="pl-1 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expandable Daypart Details (Weather Channel signature 4 quarters) */}
              {isExpanded && (
                <div className="mt-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-4 animate-fadeIn">
                  
                  {/* Day Summary Sentence */}
                  <div className="flex items-center justify-between text-slate-300 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{day.weatherDescription}</span>
                      <span className="text-slate-500">•</span>
                      <span>High of {formatTemp(day.tempMax, unit)}, Low of {formatTemp(day.tempMin, unit)}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                        <span>{day.sunrise.slice(-5)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Sunset className="w-3.5 h-3.5 text-orange-400" />
                        <span>{day.sunset.slice(-5)}</span>
                      </span>
                    </div>
                  </div>

                  {/* 4 Daypart Cards: Morning, Afternoon, Evening, Overnight */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    
                    {/* Morning */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Morning</span>
                        <Sun className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-bold text-white font-mono-num">
                        {formatTemp(day.morningTemp, unit)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {day.precipitationProbability > 25 ? `${day.precipitationProbability}% chance of rain` : "Gentle breeze"}
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Afternoon</span>
                        <Sun className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-bold text-white font-mono-num">
                        {formatTemp(day.afternoonTemp, unit)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Peak warmth • UV {day.uvIndexMax}
                      </div>
                    </div>

                    {/* Evening */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Evening</span>
                        <Moon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-bold text-white font-mono-num">
                        {formatTemp(day.eveningTemp, unit)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Winds {formatSpeed(day.windSpeedMax * 0.7, unit)}
                      </div>
                    </div>

                    {/* Overnight */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Overnight</span>
                        <Moon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-bold text-white font-mono-num">
                        {formatTemp(day.nightTemp, unit)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Low {formatTemp(day.tempMin, unit)}
                      </div>
                    </div>

                  </div>

                  {/* Wind and Rain details */}
                  <div className="flex flex-wrap items-center gap-4 text-slate-400 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      <span>Max Winds: <strong className="text-white">{formatSpeed(day.windSpeedMax, unit)}</strong> (Gusts: {formatSpeed(day.windGustsMax, unit)})</span>
                    </div>
                    {day.precipitationSum > 0 && (
                      <div className="flex items-center space-x-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        <span>Precipitation Volume: <strong className="text-white">{formatPrecip(day.precipitationSum, unit)}</strong></span>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
