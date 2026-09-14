import React, { useState, useMemo } from "react";
import { HourlyForecastItem, UnitSystem } from "../types/weather";
import { formatTemp, formatSpeed, formatPrecip, degreesToCompass } from "../utils/weatherCodes";
import { WeatherIcon } from "./WeatherIcon";
import { Droplets, Wind, Thermometer, Compass } from "lucide-react";

interface HourlyScrubberProps {
  hourly: HourlyForecastItem[];
  unit: UnitSystem;
}

type MetricType = "temp" | "precip" | "wind" | "humidity";

export const HourlyScrubber: React.FC<HourlyScrubberProps> = ({ hourly, unit }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>("temp");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take first 24 to 36 hours for chart visualization
  const chartItems = useMemo(() => hourly.slice(0, 24), [hourly]);

  // Calculate SVG curve geometry for temperature
  const { pathData, areaPathData, points, minVal, maxVal } = useMemo(() => {
    if (chartItems.length === 0) return { pathData: "", areaPathData: "", points: [], minVal: 0, maxVal: 0 };

    const width = 800;
    const height = 140;
    const padding = 20;

    const values = chartItems.map(item => {
      if (activeMetric === "temp") return item.temperature;
      if (activeMetric === "precip") return item.precipitationProbability;
      if (activeMetric === "wind") return item.windSpeed;
      return item.humidity;
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;

    const pts = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y, val, item: chartItems[i] };
    });

    // Create smooth bezier curve path
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const areaD = `${d} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

    return { pathData: d, areaPathData: areaD, points: pts, minVal: min, maxVal: max };
  }, [chartItems, activeMetric]);

  const activeItem = hoveredIndex !== null && chartItems[hoveredIndex] 
    ? chartItems[hoveredIndex] 
    : chartItems[0];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl p-5 sm:p-6 text-slate-100">
      
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span>Hourly Forecast</span>
            <span className="text-xs font-normal text-slate-400">Next 48 Hours</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time atmospheric trajectory and precipitation onset
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric("temp")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeMetric === "temp"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </button>
          <button
            onClick={() => setActiveMetric("precip")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeMetric === "precip"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Rain Chance %</span>
          </button>
          <button
            onClick={() => setActiveMetric("wind")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeMetric === "wind"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>
        </div>
      </div>

      {/* Active Inspect Banner */}
      {activeItem && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="font-bold text-white text-sm">
              {activeItem.hourLabel}
            </div>
            <span className="text-slate-500">•</span>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <WeatherIcon name={activeItem.conditionIconName} className="w-4 h-4" />
              <span className="font-medium">{activeItem.weatherDescription}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-slate-300">
              <span className="text-slate-400">Temp:</span>
              <strong className="text-white font-bold">{formatTemp(activeItem.temperature, unit)}</strong>
              <span className="text-slate-400 text-[11px]">(Feels {formatTemp(activeItem.apparentTemperature, unit)})</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-300">
              <Droplets className="w-3.5 h-3.5" />
              <span>{activeItem.precipitationProbability}%</span>
              {activeItem.precipitationAmount > 0 && (
                <span className="text-slate-400">({formatPrecip(activeItem.precipitationAmount, unit)})</span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-teal-300">
              <Wind className="w-3.5 h-3.5" />
              <span>{formatSpeed(activeItem.windSpeed, unit)} {degreesToCompass(activeItem.windDirection)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Interactive Chart Curve */}
      <div className="relative mt-4 w-full h-36 overflow-hidden select-none">
        <svg
          viewBox="0 0 800 140"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Fill under curve */}
          <path d={areaPathData} fill="url(#curveGradient)" />

          {/* Stroke Line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Points */}
          {points.map((pt, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)}>
              {/* Vertical guideline on hover */}
              {hoveredIndex === i && (
                <line
                  x1={pt.x}
                  y1={0}
                  x2={pt.x}
                  y2={140}
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}
              {/* Point circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 6 : 3.5}
                className={hoveredIndex === i ? "fill-white stroke-blue-500 stroke-2" : "fill-blue-400"}
              />
              {/* Text label */}
              {(i % 2 === 0 || hoveredIndex === i) && (
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-slate-200 font-mono-num"
                >
                  {activeMetric === "temp"
                    ? formatTemp(pt.val, unit)
                    : activeMetric === "precip"
                    ? `${pt.val}%`
                    : formatSpeed(pt.val, unit)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Horizontal Scroller Cards (Next 24-48 Hours) */}
      <div className="mt-4 flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
        {hourly.slice(0, 36).map((item, index) => {
          const isSelected = hoveredIndex === index;
          return (
            <div
              key={`${item.time}-${index}`}
              onMouseEnter={() => setHoveredIndex(index)}
              className={`flex-shrink-0 w-20 sm:w-22 p-3 rounded-xl flex flex-col items-center justify-between space-y-2 cursor-pointer transition border ${
                isSelected
                  ? "bg-blue-950/80 border-blue-500 shadow-md scale-105"
                  : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/60"
              }`}
            >
              <span className="text-xs font-semibold text-slate-300">
                {item.hourLabel}
              </span>

              <WeatherIcon name={item.conditionIconName} className="w-6 h-6" />

              <span className="text-sm font-bold text-white font-mono-num">
                {formatTemp(item.temperature, unit)}
              </span>

              {item.precipitationProbability > 0 ? (
                <div className="flex items-center space-x-0.5 text-[11px] text-blue-400 font-medium">
                  <Droplets className="w-3 h-3" />
                  <span>{item.precipitationProbability}%</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono-num">0%</span>
              )}

              <span className="text-[10px] text-slate-400 truncate">
                {formatSpeed(item.windSpeed, unit)}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
