import React, { useState } from "react";
import { GeoLocation, DailyForecastItem, CurrentWeather, WeatherAlert, UnitSystem } from "../types/weather";
import { INDIA_CYCLONE_MONSOON_HUBS } from "../services/weatherService";
import { IndiaCoastalAlertMap } from "./IndiaCoastalAlertMap";
import { playOneAlertBuzzer, getAudioMuted, toggleAudioMuted } from "../utils/soundAlert";
import { 
  Wind, 
  CloudRain, 
  Sun, 
  Snowflake, 
  ShieldAlert, 
  AlertTriangle, 
  Waves, 
  ThermometerSun, 
  ThermometerSnowflake, 
  Calendar, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  Radio, 
  Flame, 
  CloudLightning,
  ChevronRight,
  Info,
  Volume2,
  VolumeX
} from "lucide-react";

interface IndiaCycloneMonsoonForecastProps {
  currentLocation: GeoLocation;
  current: CurrentWeather;
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
  unit: UnitSystem;
  onSelectLocation: (loc: GeoLocation) => void;
  onTriggerSimulation?: (type: string) => void;
  onClearSimulation?: () => void;
  isSimulated?: boolean;
}

export const IndiaCycloneMonsoonForecast: React.FC<IndiaCycloneMonsoonForecastProps> = ({
  currentLocation,
  current,
  daily,
  alerts,
  unit,
  onSelectLocation,
  onTriggerSimulation,
  onClearSimulation,
  isSimulated = false
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"cyclone" | "monsoon" | "summer" | "winter">("cyclone");

  // Determine current season in Indian subcontinent
  const currentMonth = new Date().getMonth(); // 0 = Jan, 4 = May, etc.
  const isSummerSeason = currentMonth >= 2 && currentMonth <= 6; // March - July
  const isMonsoonSeason = currentMonth >= 5 && currentMonth <= 9; // June - October
  const isWinterSeason = currentMonth >= 10 || currentMonth <= 1; // Nov - Feb

  // Scan the 14-day forecast for advance threats
  const scannedDays = daily.slice(0, 14).map((day, idx) => {
    const isFuture = idx > 0;
    const daysOut = idx;

    // Cyclone threat criteria: sustained winds >= 55 km/h or gusts >= 75 km/h with rain/rain-prob
    const isCycloneRisk = (day.windSpeedMax >= 55 || day.windGustsMax >= 75) && (day.precipitationSum >= 15 || day.precipitationProbability >= 50);
    const isSuperCyclone = (day.windSpeedMax >= 95 || day.windGustsMax >= 120) && day.precipitationSum >= 25;

    // Heavy monsoon rain criteria: IMD heavy rain >= 50mm or probability >= 75%
    const isHeavyMonsoon = day.precipitationSum >= 50 || (day.precipitationProbability >= 75 && day.precipitationSum >= 30);
    const isExtremelyHeavy = day.precipitationSum >= 100;

    // Summer heavy heat winds (Loo): Temp >= 38°C + Wind >= 20 km/h
    const isSummerHeatWinds = day.tempMax >= 38 && day.windSpeedMax >= 20;
    const isSevereLoo = day.tempMax >= 42 && day.windSpeedMax >= 24;

    // Winter cold winds (Sheet Lahar): Temp <= 10°C + Wind >= 18 km/h
    const isWinterColdWinds = day.tempMin <= 10 && day.windSpeedMax >= 18;
    const isSevereSheetLahar = day.tempMin <= 4 && day.windSpeedMax >= 22;

    const hasAnyThreat = isCycloneRisk || isHeavyMonsoon || isSummerHeatWinds || isWinterColdWinds;

    return {
      day,
      idx,
      daysOut,
      isFuture,
      isCycloneRisk,
      isSuperCyclone,
      isHeavyMonsoon,
      isExtremelyHeavy,
      isSummerHeatWinds,
      isSevereLoo,
      isWinterColdWinds,
      isSevereSheetLahar,
      hasAnyThreat
    };
  });

  const selectedScan = scannedDays[selectedDayIndex] || scannedDays[0];

  // Active cyclone or monsoon alerts in the system
  const cycloneAlerts = alerts.filter(a => a.category === "wind" || a.title.toLowerCase().includes("cyclone"));
  const monsoonAlerts = alerts.filter(a => a.category === "flood" || a.title.toLowerCase().includes("monsoon") || a.title.toLowerCase().includes("rain"));
  const heatWindAlerts = alerts.filter(a => a.category === "heat" || a.title.toLowerCase().includes("loo") || a.title.toLowerCase().includes("heat wind"));
  const coldWindAlerts = alerts.filter(a => a.category === "winter" || a.title.toLowerCase().includes("sheet lahar") || a.title.toLowerCase().includes("cold wind"));

  // Check highest IMD alert color
  let highestImdCode: "Green" | "Yellow" | "Orange" | "Red" = "Green";
  if (alerts.some(a => a.imdColorCode === "Red" || a.severity === "emergency")) {
    highestImdCode = "Red";
  } else if (alerts.some(a => a.imdColorCode === "Orange" || a.severity === "warning")) {
    highestImdCode = "Orange";
  } else if (alerts.some(a => a.imdColorCode === "Yellow" || a.severity === "watch")) {
    highestImdCode = "Yellow";
  }

  const getImdBadge = (code: "Green" | "Yellow" | "Orange" | "Red") => {
    switch (code) {
      case "Red":
        return {
          label: "IMD RED WARNING (TAKE ACTION)",
          bg: "bg-red-600/90 text-white border-red-500",
          glow: "shadow-red-600/40"
        };
      case "Orange":
        return {
          label: "IMD ORANGE ALERT (BE PREPARED)",
          bg: "bg-amber-600/90 text-white border-amber-500",
          glow: "shadow-amber-600/40"
        };
      case "Yellow":
        return {
          label: "IMD YELLOW WATCH (BE UPDATED)",
          bg: "bg-yellow-500/90 text-black font-bold border-yellow-400",
          glow: "shadow-yellow-500/30"
        };
      default:
        return {
          label: "IMD GREEN (NO SEVERE WARNING)",
          bg: "bg-emerald-600/90 text-white border-emerald-500",
          glow: "shadow-emerald-600/20"
        };
    }
  };

  const imdBadge = getImdBadge(highestImdCode);

  return (
    <div id="india-cyclone-monsoon-forecast" className="space-y-6">
      
      {/* 1. Header Banner & IMD Classification Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${imdBadge.bg} ${imdBadge.glow}`}>
                {imdBadge.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center space-x-1">
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span>1-Week Advance Threat Scanner Active</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <Wind className="w-6 h-6 text-cyan-400 animate-spin-slow" />
              <span>India Cyclone & Heavy Monsoon Threat Observatory</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Continuous numerical modeling for Bay of Bengal & Arabian Sea tropical cyclone tracks, heavy monsoon rainfall cloudbursts, summer scorching <span className="text-amber-400 font-semibold">"Loo" heat winds</span>, and winter <span className="text-cyan-300 font-semibold">"Sheet Lahar" bitter cold winds</span>.
            </p>
          </div>

          {/* Quick Simulation Triggers for User Testing & Buzzer Audio */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Test Severe Threats & Buzzer:
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                id="sim-cyclone-7day-button"
                onClick={() => {
                  playOneAlertBuzzer("cyclone");
                  onTriggerSimulation?.("cyclone-7day");
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 transition flex items-center space-x-1 font-semibold"
                title="Simulate 7-Day Cyclone Advance Warning with Emergency Buzzer"
              >
                <Wind className="w-3 h-3 text-rose-400" />
                <span>Cyclone (7 Days Out)</span>
              </button>
              <button
                id="sim-monsoon-heavy-button"
                onClick={() => {
                  playOneAlertBuzzer("monsoon");
                  onTriggerSimulation?.("monsoon-cloudburst");
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 transition flex items-center space-x-1 font-semibold"
                title="Simulate Heavy Monsoon Cloudburst with Warning Beep"
              >
                <CloudRain className="w-3 h-3 text-blue-400" />
                <span>Heavy Monsoon (5 Days Out)</span>
              </button>
              <button
                id="sim-summer-loo-button"
                onClick={() => {
                  onTriggerSimulation?.("summer-loo");
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 transition flex items-center space-x-1 font-semibold"
                title="Simulate Summer Scorching Loo Winds (Alert sound removed)"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Summer "Loo" Winds</span>
              </button>
              <button
                id="sim-winter-sheetlahar-button"
                onClick={() => {
                  onTriggerSimulation?.("winter-sheetlahar");
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/60 transition flex items-center space-x-1 font-semibold"
                title="Simulate Winter Cold Wave Winds (Alert sound removed)"
              >
                <Snowflake className="w-3 h-3 text-cyan-400" />
                <span>Winter "Sheet Lahar"</span>
              </button>
              <button
                id="quick-sound-alert-buzzer"
                onClick={() => playOneAlertBuzzer("cyclone")}
                className="px-2.5 py-1 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center space-x-1 shadow-md shadow-red-600/30"
                title="Play One-Time Warning Buzzer (Bay of Bengal / Cyclone Alert)"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Buzzer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Coastal Cyclone & Monsoon Hubs Quick Selector */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1 flex-shrink-0">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>Key Cyclone & Monsoon Hubs:</span>
            </span>
            {INDIA_CYCLONE_MONSOON_HUBS.map((hub) => {
              const isSelected = Math.abs(hub.latitude - currentLocation.latitude) < 0.05 && 
                                Math.abs(hub.longitude - currentLocation.longitude) < 0.05;
              return (
                <button
                  key={hub.name}
                  onClick={() => {
                    onSelectLocation(hub);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? "bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30"
                      : "bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{hub.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({hub.admin1})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive India Coastal Red Alert Threat Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <span>Real-Time Coastal Threat Map: Red High Surrounded Area Alert</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Highlights Bay of Bengal & Arabian Sea coastal zones + 7-Day Cyclone Advance Path
          </span>
        </div>

        <IndiaCoastalAlertMap
          currentLocation={currentLocation}
          alerts={alerts}
          onSelectLocation={(loc) => {
            onSelectLocation(loc);
          }}
          onTriggerSimulation={onTriggerSimulation}
        />
      </div>

      {/* 3. Four Core Threat Category Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Tab A: Tropical Cyclone Threat */}
        <button
          onClick={() => setActiveTab("cyclone")}
          className={`p-4 rounded-xl text-left border transition relative overflow-hidden ${
            activeTab === "cyclone"
              ? "bg-slate-900 border-rose-500 shadow-lg shadow-rose-950/40"
              : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <Wind className="w-5 h-5" />
            </div>
            {cycloneAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                {cycloneAlerts.length} THREAT DETECTED
              </span>
            )}
          </div>
          <h4 className="font-bold text-white text-sm sm:text-base mt-2">Cyclone Threat Tracking</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Bay of Bengal & Arabian Sea low-pressure vortex detection up to 7-14 days out.
          </p>
        </button>

        {/* Tab B: Heavy Monsoon Downpours */}
        <button
          onClick={() => setActiveTab("monsoon")}
          className={`p-4 rounded-xl text-left border transition relative overflow-hidden ${
            activeTab === "monsoon"
              ? "bg-slate-900 border-blue-500 shadow-lg shadow-blue-950/40"
              : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <CloudRain className="w-5 h-5" />
            </div>
            {monsoonAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                {monsoonAlerts.length} MONSOON ALERT
              </span>
            )}
          </div>
          <h4 className="font-bold text-white text-sm sm:text-base mt-2">Heavy Monsoon & Cloudburst</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            IMD &gt;64.5mm & &gt;115mm rainfall alerts and urban inundation forecasts.
          </p>
        </button>

        {/* Tab C: Summer Heavy Heat Winds (Loo) */}
        <button
          onClick={() => setActiveTab("summer")}
          className={`p-4 rounded-xl text-left border transition relative overflow-hidden ${
            activeTab === "summer"
              ? "bg-slate-900 border-amber-500 shadow-lg shadow-amber-950/40"
              : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <ThermometerSun className="w-5 h-5" />
            </div>
            {heatWindAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white animate-pulse">
                LOO ACTIVE
              </span>
            )}
          </div>
          <h4 className="font-bold text-white text-sm sm:text-base mt-2">Summer "Loo" Heat Winds</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Scorching westerly winds &gt;38°C–45°C triggering acute heat stroke & fire risk.
          </p>
        </button>

        {/* Tab D: Winter Bitter Cold Winds (Sheet Lahar) */}
        <button
          onClick={() => setActiveTab("winter")}
          className={`p-4 rounded-xl text-left border transition relative overflow-hidden ${
            activeTab === "winter"
              ? "bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/40"
              : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            {coldWindAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white animate-pulse">
                SHEET LAHAR ACTIVE
              </span>
            )}
          </div>
          <h4 className="font-bold text-white text-sm sm:text-base mt-2">Winter "Sheet Lahar" Winds</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Himalayan northern cold surges &lt;10°C with gale wind chill & frost hazard.
          </p>
        </button>

      </div>

      {/* 3. 14-Day Advance Threat Radar (Timeline Scrubber) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>14-Day Advanced Threat Horizon</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select any day to inspect cyclonic wind vectors, monsoon rainfall sums, and seasonal wind alerts.
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>Cyclone Risk</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Heavy Monsoon</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Loo Winds</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span>Cold Winds</span>
            </span>
          </div>
        </div>

        {/* 14-Day Scrollable Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {scannedDays.map((scan) => {
            const isSelected = scan.idx === selectedDayIndex;
            return (
              <button
                key={scan.day.date}
                onClick={() => setSelectedDayIndex(scan.idx)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-800 border-blue-500 ring-2 ring-blue-500/30"
                    : "bg-slate-950/70 border-slate-800/90 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    {scan.idx === 0 ? "Today" : scan.day.dayOfWeek}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {scan.daysOut === 0 ? "Now" : `+${scan.daysOut}d`}
                  </span>
                </div>

                <div className="my-2">
                  <div className="text-sm font-black text-white">
                    {Math.round(scan.day.tempMax)}° / {Math.round(scan.day.tempMin)}°
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Wind className="w-3 h-3 text-slate-400" />
                    <span>{scan.day.windSpeedMax} km/h</span>
                  </div>
                  <div className="text-[11px] text-blue-400 flex items-center space-x-1">
                    <CloudRain className="w-3 h-3" />
                    <span>{scan.day.precipitationSum} mm</span>
                  </div>
                </div>

                {/* Threat Indicators */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {scan.isCycloneRisk && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase">
                      Cyclone
                    </span>
                  )}
                  {scan.isHeavyMonsoon && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white uppercase">
                      Monsoon
                    </span>
                  )}
                  {scan.isSummerHeatWinds && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-600 text-white uppercase">
                      Loo
                    </span>
                  )}
                  {scan.isWinterColdWinds && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-600 text-white uppercase">
                      Cold Wind
                    </span>
                  )}
                  {!scan.hasAnyThreat && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] text-emerald-400 bg-emerald-950/50">
                      Normal
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Inspection of Selected Day */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">
                Forecast for {selectedScan.day.fullDate} ({selectedScan.daysOut === 0 ? "Today" : `${selectedScan.daysOut} Days in Advance`})
              </span>
              {selectedScan.daysOut >= 7 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white">
                  1-WEEK EARLY WARNING WINDOW
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span>Max Winds: <strong className="text-white">{selectedScan.day.windSpeedMax} km/h</strong></span>
              <span>Peak Gusts: <strong className="text-white">{selectedScan.day.windGustsMax} km/h</strong></span>
              <span>Projected Rainfall: <strong className="text-blue-400">{selectedScan.day.precipitationSum} mm</strong></span>
              <span>Rain Probability: <strong className="text-blue-300">{selectedScan.day.precipitationProbability}%</strong></span>
              <span>UV Index: <strong className="text-amber-400">{selectedScan.day.uvIndexMax}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedScan.isCycloneRisk ? (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Active Cyclone Threat Level: {selectedScan.isSuperCyclone ? "Very Severe / Super Cyclone" : "Cyclonic Storm / Squalls"}</span>
              </div>
            ) : selectedScan.isHeavyMonsoon ? (
              <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-700 text-blue-200 text-xs font-semibold flex items-center space-x-2">
                <Waves className="w-4 h-4 text-blue-400" />
                <span>Monsoon Warning: {selectedScan.isExtremelyHeavy ? "Extremely Heavy Cloudburst" : "Heavy Downpour Hazard"}</span>
              </div>
            ) : selectedScan.isSummerHeatWinds ? (
              <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-700 text-amber-200 text-xs font-semibold flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Summer Hazard: {selectedScan.isSevereLoo ? "Severe Blistering Loo Gale" : "Hot Dry Winds Advisory"}</span>
              </div>
            ) : selectedScan.isWinterColdWinds ? (
              <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-700 text-cyan-200 text-xs font-semibold flex items-center space-x-2">
                <Snowflake className="w-4 h-4 text-cyan-400" />
                <span>Winter Hazard: {selectedScan.isSevereSheetLahar ? "Severe Sheet Lahar Cold Gale" : "Cold Wind Wave Advisory"}</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Severe Climatological Warning for this Date</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Deep-Dive Section based on Selected Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Meteorological Mechanics & Alert Parameters */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>
              {activeTab === "cyclone" && "Tropical Cyclone Intensity & IMD Scale"}
              {activeTab === "monsoon" && "Monsoon System & Precipitation Dynamics"}
              {activeTab === "summer" && "Summer 'Loo' Wind Dynamics & Heat Stress Index"}
              {activeTab === "winter" && "Winter 'Sheet Lahar' Chilling Winds & Wind-Chill Index"}
            </span>
          </h3>

          {activeTab === "cyclone" && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Tropical cyclones developing over the warm waters of the Bay of Bengal and the Arabian Sea intensify into dangerous vortex systems. The India Meteorological Department (IMD) classifies these systems as:
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Depression / Deep Depression</span>
                  <span className="text-amber-400 font-mono">31 – 61 km/h (17 – 33 kts)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-amber-300">Cyclonic Storm (CS)</span>
                  <span className="text-amber-300 font-mono">62 – 88 km/h (34 – 47 kts)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-rose-400">Severe / Very Severe Cyclonic Storm</span>
                  <span className="text-rose-400 font-mono">89 – 165 km/h (48 – 89 kts)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/80 flex items-center justify-between">
                  <span className="font-semibold text-red-200">Extremely Severe / Super Cyclonic Storm</span>
                  <span className="text-red-300 font-mono">&gt; 166 – 222+ km/h (90+ kts)</span>
                </div>
              </div>
              <div className="p-3 bg-rose-950/20 border border-rose-800/30 rounded-xl text-rose-200">
                <strong>Pre-Cyclone Watch (7 Days In Advance):</strong> Issued at the earliest stage of low-pressure formation, warning fishermen against deep-sea voyage and alerting coastal disaster response forces.
              </div>
            </div>
          )}

          {activeTab === "monsoon" && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                The Indian Monsoon system delivers over 75% of the annual rainfall through the Southwest Monsoon (June to Sept) and Northeast Monsoon (Oct to Dec).
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Moderate Rain</span>
                  <span className="text-slate-300 font-mono">15.6 – 64.4 mm / day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-amber-300">Heavy Rain (IMD Yellow/Orange)</span>
                  <span className="text-amber-300 font-mono">64.5 – 115.5 mm / day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-rose-400">Very Heavy Rain (IMD Orange/Red)</span>
                  <span className="text-rose-400 font-mono">115.6 – 204.4 mm / day</span>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/80 flex items-center justify-between">
                  <span className="font-semibold text-blue-200">Extremely Heavy / Cloudburst</span>
                  <span className="text-blue-300 font-mono">&gt; 204.4 mm / day (or 100mm/hr)</span>
                </div>
              </div>
              <div className="p-3 bg-blue-950/20 border border-blue-800/30 rounded-xl text-blue-200">
                <strong>Cloudburst Early Detection:</strong> Scans multi-model ensemble tracks to signal extreme rainfall hotspots 5 to 7 days prior, allowing reservoir management and drainage clearing.
              </div>
            </div>
          )}

          {activeTab === "summer" && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                <strong>The "Loo"</strong> is a strong, dusty, gusty, hot and dry summer wind from the west which blows over the Indo-Gangetic Plain and western India between March and July.
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-amber-300">Loo Wind Speed Range</span>
                  <span className="text-amber-400 font-mono">25 – 50 km/h gusts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-rose-400">Air Temperature Range</span>
                  <span className="text-rose-400 font-mono">40°C – 48°C (104°F – 118°F)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-red-300">Relative Humidity</span>
                  <span className="text-red-300 font-mono">Extremely dry (&lt; 20%)</span>
                </div>
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-amber-200">
                <strong>Extreme Danger:</strong> Because the Loo carries very low humidity and scorching heat, it desiccates human skin almost immediately, precipitating rapid fatal heatstroke without timely rehydration.
              </div>
            </div>
          )}

          {activeTab === "winter" && (
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                <strong>The "Sheet Lahar" (Cold Wave)</strong> occurs between November and February when dry, frigid north-westerly winds funnel down from the snow-clad Himalayas into northern and central plains.
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-cyan-300">Severe Cold Day Criteria</span>
                  <span className="text-cyan-400 font-mono">Departure &ge; 6.5°C below normal</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-cyan-300">Gale Winds & Wind Chill</span>
                  <span className="text-cyan-400 font-mono">20 – 45 km/h icy squalls</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-indigo-300">Ground Frost & Dense Fog</span>
                  <span className="text-indigo-300 font-mono">Zero visibility, crop freezing</span>
                </div>
              </div>
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-cyan-200">
                <strong>Hypothermia Risk:</strong> Biting winds cause apparent body temperature to fall 5°C to 10°C below ambient air temperatures, posing severe risks for night workers and homeless populations.
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Disaster Preparedness & Safety Matrix */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>National Disaster Management & Safety Protocols</span>
          </h3>

          <div className="space-y-3 text-xs">
            {activeTab === "cyclone" && (
              <>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-rose-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500" />
                    <span>1 Week in Advance (Pre-Cyclone Watch)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Check house roofs, repair loose tiles and asbestos sheets. Clear branches touching overhead wires. Stock drinking water, candles, solar torches, battery radios, and non-perishable food for at least 7 days.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>24–48 Hours (Cyclone Warning & Landfall Approach)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Keep emergency documents and valuables in waterproof containers. Evacuate immediately if residing in katcha houses or within 5 km of the sea line. Turn off gas cylinders and electrical mains.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-red-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>During Landfall (The Eye of the Cyclone)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Do not venture outside when the wind suddenly stops — this is the calm 'eye' of the cyclone; violent winds from the opposite direction will resume abruptly within minutes.
                  </p>
                </div>
              </>
            )}

            {activeTab === "monsoon" && (
              <>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-blue-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Flood Risk & Waterlogging Protocols</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Move essential electric appliances and vehicles to elevated levels. Strictly avoid underpasses, stormwater drains, and open manholes during active downpours.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>Electrical Safety Precautions</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Never touch electric poles, transformers, or fallen wire cables submerged in flood water. Report sparks or snapped lines to electricity distribution helplines immediately.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Waterborne Disease & Sanitation Precautions</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Boil all drinking water for at least 10 minutes or use water purification tablets. Avoid consuming raw street food during heavy monsoon stagnation.
                  </p>
                </div>
              </>
            )}

            {activeTab === "summer" && (
              <>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>Peak Daylight Avoidance (11:00 AM – 4:30 PM)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Schedule outdoor construction, agricultural, or marketing activities during early morning (6:00 AM – 10:00 AM) or post sunset. Never expose children or elderly to hot afternoon winds.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-orange-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    <span>Essential Hydration & Electrolytes</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Drink water frequently, even if not thirsty. Consume traditional natural coolants like raw mango panna (Aam Panna), buttermilk (Chhaas), coconut water, and lemon juice with a pinch of salt.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-rose-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Heat Stroke First Aid</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    If someone collapses with dry, hot skin and confusion: move immediately to shade, sponge the body with cold water, apply ice packs to armpits and groin, and rush to a hospital.
                  </p>
                </div>
              </>
            )}

            {activeTab === "winter" && (
              <>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-cyan-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                    <span>Layered Clothing & Extremity Protection</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Multiple loose, lightweight warm layers trap warm air better than one heavy coat. Cover ears, neck, fingers, and toes tightly against northern cold drafts.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Indoor Heating & Carbon Monoxide Warning</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Never burn coal angithi, wood, or unvented gas heaters in closed, unventilated rooms while sleeping. Carbon monoxide is odorless, invisible, and fatal. Ensure cross-ventilation.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Agricultural & Crop Frost Mitigation</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Provide light evening irrigation to winter crops (mustard, wheat, vegetables) on nights when cold winds are forecasted; wet soil retains daytime heat and prevents devastating frost kill.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
