import React, { useState, useEffect, useRef } from "react";
import { 
  GeoLocation, 
  UnitSystem, 
  WeatherFetchResult, 
  WeatherAlert 
} from "./types/weather";
import { 
  DEFAULT_LOCATIONS, 
  fetchFullWeather, 
  deriveWeatherAlerts 
} from "./services/weatherService";
import { Header } from "./components/Header";
import { AlertBanner } from "./components/AlertBanner";
import { CurrentHero } from "./components/CurrentHero";
import { HourlyScrubber } from "./components/HourlyScrubber";
import { DailyExtendedForecast } from "./components/DailyExtendedForecast";
import { WeatherRadarMap } from "./components/WeatherRadarMap";
import { DetailMetricsGrid } from "./components/DetailMetricsGrid";
import { AiMeteorologistBriefing } from "./components/AiMeteorologistBriefing";
import { EventCalendar } from "./components/EventCalendar";
import { HistoricalTrends } from "./components/HistoricalTrends";
import { IndiaCycloneMonsoonForecast } from "./components/IndiaCycloneMonsoonForecast";
import { LocalEmergencyContacts } from "./components/LocalEmergencyContacts";
import { SettingsModal } from "./components/SettingsModal";
import { playOneAlertBuzzer } from "./utils/soundAlert";
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  Radar, 
  CalendarDays, 
  Clock, 
  LayoutDashboard,
  Wind,
  ShieldAlert,
  Settings as SettingsIcon
} from "lucide-react";

export default function App() {
  // Unit System (°C / °F)
  const [unit, setUnit] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem("weather_unit");
    return (saved as UnitSystem) || "metric";
  });

  // Location State
  const [currentLocation, setCurrentLocation] = useState<GeoLocation>(() => {
    const saved = localStorage.getItem("weather_last_location");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_LOCATIONS[0]; // New York default
  });

  // Favorite locations
  const [favorites, setFavorites] = useState<GeoLocation[]>(() => {
    const saved = localStorage.getItem("weather_favorites");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [DEFAULT_LOCATIONS[0], DEFAULT_LOCATIONS[1], DEFAULT_LOCATIONS[2]];
  });

  // Weather Data & Loading States
  const [weatherData, setWeatherData] = useState<WeatherFetchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated Alert State for Demo Testing
  const [simulatedAlerts, setSimulatedAlerts] = useState<WeatherAlert[] | null>(null);

  // Active section tab (for focused navigation if desired, or all-in-one scroll)
  const [activeTab, setActiveTab] = useState<"all" | "hourly" | "extended" | "radar" | "cyclone-monsoon" | "emergency">("all");

  // Settings & Emergency Services Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"emergency" | "preferences">("emergency");

  const handleOpenSettings = (tab: "emergency" | "preferences" = "emergency") => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const [themeMode, setThemeMode] = useState<"light" | "dark" | "auto">(() => {
    return (localStorage.getItem("weather_theme") as "light" | "dark" | "auto") || "auto";
  });

  const radarSectionRef = useRef<HTMLDivElement>(null);

  // Theme Switching based on Sunrise/Sunset (isDay) or Manual Override
  useEffect(() => {
    localStorage.setItem("weather_theme", themeMode);
    
    if (themeMode === "dark") {
      document.documentElement.classList.add('dark-theme');
    } else if (themeMode === "light") {
      document.documentElement.classList.remove('dark-theme');
    } else {
      // Auto mode based on location time
      if (weatherData) {
        if (!weatherData.current.isDay) {
          document.documentElement.classList.add('dark-theme');
        } else {
          document.documentElement.classList.remove('dark-theme');
        }
      }
    }
  }, [themeMode, weatherData?.current.isDay]);

  // Persist unit
  const handleToggleUnit = () => {
    const nextUnit: UnitSystem = unit === "metric" ? "imperial" : "metric";
    setUnit(nextUnit);
    localStorage.setItem("weather_unit", nextUnit);
  };

  // Persist favorite locations
  const handleToggleFavorite = (loc: GeoLocation) => {
    const exists = favorites.some(
      f => Math.abs(f.latitude - loc.latitude) < 0.05 && 
           Math.abs(f.longitude - loc.longitude) < 0.05
    );
    let updated: GeoLocation[];
    if (exists) {
      updated = favorites.filter(
        f => !(Math.abs(f.latitude - loc.latitude) < 0.05 && Math.abs(f.longitude - loc.longitude) < 0.05)
      );
    } else {
      updated = [...favorites, loc];
    }
    setFavorites(updated);
    localStorage.setItem("weather_favorites", JSON.stringify(updated));
  };

  // Load weather data
  const loadWeather = async (loc: GeoLocation) => {
    setIsLoading(true);
    setError(null);
    setSimulatedAlerts(null); // Reset any simulated alert on location change
    try {
      const data = await fetchFullWeather(loc);
      setWeatherData(data);
      localStorage.setItem("weather_last_location", JSON.stringify(loc));
    } catch (err: any) {
      console.error("Error loading weather:", err);
      setError("Unable to load real-time meteorological data for this location. Please check connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(currentLocation);
  }, [currentLocation.latitude, currentLocation.longitude]);

  // Geolocation trigger
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Attempt reverse geocoding via Open-Meteo or fallback to Local Coordinates
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${latitude.toFixed(2)},${longitude.toFixed(2)}&count=1&language=en&format=json`);
          let locName = "My Current Location";
          let country = "Local Area";
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results[0]) {
              locName = data.results[0].name;
              country = data.results[0].country || "";
            }
          }

          const userLoc: GeoLocation = {
            name: locName,
            country: country,
            latitude,
            longitude
          };

          setCurrentLocation(userLoc);
        } catch (e) {
          const userLoc: GeoLocation = {
            name: "Current Location",
            country: "GPS Coordinates",
            latitude,
            longitude
          };
          setCurrentLocation(userLoc);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied/failed:", err);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Trigger alert simulation
  const handleTriggerSimulation = (type: string) => {
    const locName = currentLocation.name;
    let mockAlert: WeatherAlert;

    switch (type) {
      case "cyclone-7day":
        mockAlert = {
          id: "sim-cyclone-7day",
          title: "7-DAY ADVANCE CYCLONE EARLY WARNING",
          severity: "emergency",
          category: "wind",
          headline: `🚨 7-Day Early Warning: Super Cyclonic Storm Forming over Bay of Bengal approaching ${locName}`,
          description: `Deep atmospheric low-pressure vortex and numerical ensemble tracking indicate a severe tropical cyclone making coastal approach in 7 days. Sustained winds projected at 120 km/h with gusts exceeding 165 km/h, catastrophic storm surge of 3.5 to 5 meters, and torrential precipitation (> 150 mm).`,
          instruction: `Pre-cyclone watch in effect. All fishermen must return to coastal harbors immediately. Secure structural roof sheets, clear drainage ditches, and stockpile 7-day rations of drinking water, medicines, and emergency battery lighting.`,
          effectiveTime: "Active 7-Day Early Warning",
          expiresTime: "In 7 Days",
          source: "IMD Cyclone Warning Division & Regional Specialized Meteorological Center",
          advanceNoticeDays: 7,
          threatLevel: "Catastrophic",
          imdColorCode: "Red"
        };
        break;
      case "monsoon-cloudburst":
        mockAlert = {
          id: "sim-monsoon-cloudburst",
          title: "5-DAY ADVANCE ALERT: EXTREME MONSOON CLOUDBURST",
          severity: "emergency",
          category: "flood",
          headline: `⚠️ 5-Day Advance Alert: Extreme Monsoon Cloudburst (185 mm) Projected for ${locName}`,
          description: `Intense low-pressure trough and monsoon surge will dump torrential rain exceeding 185 mm over 24 hours. Critical urban waterlogging, transit gridlock, riverbank overflow, and flash flooding in low-lying residential areas anticipated.`,
          instruction: `Move electrical equipment, grain stores, and vehicles to higher ground. Disconnect non-essential circuit mains. Strictly avoid underpasses, stormwater canals, and submerged causeways. Boil drinking water.`,
          effectiveTime: "Early Warning (5 Days Out)",
          expiresTime: "In 5 Days",
          source: "National Monsoon Mission & Central Water Commission",
          advanceNoticeDays: 5,
          threatLevel: "Severe",
          imdColorCode: "Red"
        };
        break;
      case "summer-loo":
        mockAlert = {
          id: "sim-summer-loo",
          title: "SUMMER SCORCHING HEAT WINDS ('LOO' RED ALERT)",
          severity: "emergency",
          category: "heat",
          headline: `☀️ Severe Summer Heat Winds ('Loo') at 44°C with 38 km/h Gale Winds across ${locName}`,
          description: `Desiccating, blistering summer winds ('Loo') will sweep the region. Extremely dry, gusty westerly winds combined with 44°C surface heat trigger instantaneous body dehydration, heat cramps, severe heat exhaustion, and life-threatening heatstroke. Wildfire danger is critical.`,
          instruction: `Strictly avoid direct sunlight and hot wind exposure between 11:00 AM and 4:30 PM. Cover head and ears with a wet cotton cloth. Drink ORS, salted buttermilk (Chhaas), or raw mango panna frequently. Keep livestock in well-shaded, ventilated shelters.`,
          effectiveTime: "Summer Climate Emergency",
          expiresTime: "Until 7:00 PM Tomorrow",
          source: "IMD Heat Wave Surveillance Unit",
          advanceNoticeDays: 0,
          threatLevel: "Severe",
          imdColorCode: "Red"
        };
        break;
      case "winter-sheetlahar":
        mockAlert = {
          id: "sim-winter-sheetlahar",
          title: "WINTER BITTER COLD WINDS ('SHEET LAHAR' RED ALERT)",
          severity: "emergency",
          category: "winter",
          headline: `❄️ Severe Winter Cold Wave Winds ('Sheet Lahar') of 42 km/h at 4°C Sweeping ${locName}`,
          description: `Severe cold surge ('Sheet Lahar') funneling icy Himalayan winds across the plains. Extreme wind chill factor makes apparent temperature drop below -2°C. High vulnerability for hypothermia, dense morning radiation fog with zero visibility, and severe frost damage to winter crops.`,
          instruction: `Wear multiple thermal woolen layers. Cover head, ears, and neck tightly. Never sleep with unvented coal heaters or angithis in closed rooms to avoid deadly carbon monoxide buildup. Provide evening irrigation to standing crops to protect from frost.`,
          effectiveTime: "Winter Climate Emergency",
          expiresTime: "Tomorrow 10:00 AM",
          source: "IMD Winter Weather & Cold Wave Monitoring Center",
          advanceNoticeDays: 0,
          threatLevel: "Severe",
          imdColorCode: "Red"
        };
        break;
      case "hurricane":
        mockAlert = {
          id: "sim-hurricane",
          title: "Hurricane Warning (Category 3)",
          severity: "emergency",
          category: "wind",
          headline: `Catastrophic Wind and Storm Surge Warning for ${locName}`,
          description: `Sustained hurricane-force winds of 195 km/h with gusts exceeding 240 km/h and devastating sea surges are approaching. Widespread structural damage and prolonged power outages expected.`,
          instruction: `Complete all preparations immediately. Evacuate if ordered by local authorities. Seek shelter in an interior reinforced room away from glass.`,
          effectiveTime: "Active Immediate",
          expiresTime: "In 24 hours",
          source: "National Hurricane Center"
        };
        break;
      case "storm":
        mockAlert = {
          id: "sim-storm",
          title: "Severe Thunderstorm & Tornado Watch",
          severity: "warning",
          category: "storm",
          headline: `Dangerous Thunderstorms with 80 km/h Gusts and Hail for ${locName}`,
          description: `Doppler radar has detected severe supercell rotation capable of producing large destructive hail, torrential downpours, and isolated tornadoes.`,
          instruction: `Stay indoors away from windows. If outdoor sirens sound, immediately move to a basement or interior closet.`,
          effectiveTime: "Active Now",
          expiresTime: "Until 9:00 PM",
          source: "Storm Prediction Center"
        };
        break;
      case "flood":
        mockAlert = {
          id: "sim-flood",
          title: "Flash Flood Emergency",
          severity: "emergency",
          category: "flood",
          headline: `Life-Threatening Flash Flooding Underway across ${locName}`,
          description: `Rainfall rates of 50 to 80 mm per hour are overwhelming local drainage systems and causing rapid inundation of low-lying roadways and residences.`,
          instruction: `Seek higher ground immediately! Turn around, don't drown. Never attempt to drive across flooded road crossings or bridges.`,
          effectiveTime: "Active Immediate",
          expiresTime: "Until Midnight",
          source: "Hydrological Service"
        };
        break;
      case "heat":
        mockAlert = {
          id: "sim-heat",
          title: "Excessive Heat Warning",
          severity: "warning",
          category: "heat",
          headline: `Dangerously High Heat Index of 44°C for ${locName}`,
          description: `Extreme heat and oppressive humidity will increase the danger of heat cramps, exhaustion, and life-threatening heat stroke with prolonged outdoor exposure.`,
          instruction: `Stay in air-conditioned buildings. Drink plenty of cold water, reschedule outdoor work, and never leave children or pets inside cars.`,
          effectiveTime: "Active 10:00 AM",
          expiresTime: "Until 8:00 PM Tomorrow",
          source: "Public Health Weather Bureau"
        };
        break;
      case "blizzard":
      default:
        mockAlert = {
          id: "sim-blizzard",
          title: "Blizzard & Extreme Freeze Warning",
          severity: "warning",
          category: "winter",
          headline: `Heavy Snow & Whiteout Conditions Reported near ${locName}`,
          description: `Sustained winds of 60 km/h coupled with dense snowfall will reduce visibility to near zero meters. Extreme wind chills of -28°C cause frostbite in minutes.`,
          instruction: `Travel is strongly discouraged and life-threatening. If stranded in a vehicle, stay inside with hazard lights on and run engine sparingly.`,
          effectiveTime: "Active Now",
          expiresTime: "Tomorrow 12:00 PM",
          source: "Winter Weather Center"
        };
        break;
    }

    setSimulatedAlerts([mockAlert]);

    // Give one buzzer / beep sound alert immediately only for severe non-seasonal threats (summer and winter alert sounds removed)
    if (type === "cyclone-7day" || type === "hurricane") {
      playOneAlertBuzzer("cyclone");
    } else if (type === "monsoon-cloudburst" || type === "flood" || type === "storm") {
      playOneAlertBuzzer("monsoon");
    } else if (type === "summer-loo" || type === "heat") {
      // Summer alert sound removed
    } else if (type === "winter-sheetlahar" || type === "blizzard") {
      // Winter alert sound removed
    } else {
      playOneAlertBuzzer("emergency");
    }
  };

  const handleClearSimulation = () => {
    setSimulatedAlerts(null);
  };

  const activeAlerts = simulatedAlerts !== null 
    ? simulatedAlerts 
    : (weatherData?.alerts || []);

  const scrollToRadar = () => {
    setActiveTab("all");
    setTimeout(() => {
      radarSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* 1. Header Bar */}
      <Header
        currentLocation={currentLocation}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        onGeolocate={handleGeolocate}
        isLocating={isLocating}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        themeMode={themeMode}
        onChangeTheme={setThemeMode}
        onOpenSettings={handleOpenSettings}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        
        {/* Navigation Tabs (Weather Channel Sub-Nav) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-bold overflow-x-auto no-scrollbar">
            <button
              id="tab-all-overview"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Full Overview</span>
            </button>
            <button
              id="tab-hourly"
              onClick={() => setActiveTab("hourly")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeTab === "hourly"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hourly (48h)</span>
            </button>
            <button
              id="tab-extended"
              onClick={() => setActiveTab("extended")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeTab === "extended"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>16-Day Forecast</span>
            </button>
            <button
              id="tab-radar"
              onClick={() => setActiveTab("radar")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeTab === "radar"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Live Doppler Radar</span>
            </button>
            <button
              id="tab-cyclone-monsoon"
              onClick={() => setActiveTab("cyclone-monsoon")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeTab === "cyclone-monsoon"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-rose-400 hover:text-rose-200 hover:bg-rose-950/40"
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>India Cyclone & Monsoon</span>
            </button>
            <button
              id="tab-emergency-helplines"
              onClick={() => setActiveTab("emergency")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                activeTab === "emergency"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-red-400 hover:text-red-200 hover:bg-red-950/40"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Emergency Services</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="subnav-settings-btn"
              onClick={() => handleOpenSettings("preferences")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center space-x-1 text-xs"
              title="Open Settings & Preferences"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => loadWeather(currentLocation)}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center space-x-1 text-xs"
              title="Refresh weather data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time Severe Weather Alerts Banner */}
        <AlertBanner
          alerts={activeAlerts}
          onTriggerSimulation={handleTriggerSimulation}
          isSimulated={simulatedAlerts !== null}
          onClearSimulation={handleClearSimulation}
        />

        {/* Loading State */}
        {isLoading && !weatherData && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <div className="text-center">
              <h3 className="text-base font-semibold text-white">
                Gathering Real-Time Meteorological Data
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Connecting to global satellites, radar composites, and atmospheric stations...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Connection Warning</h4>
              <p className="text-xs text-red-300">{error}</p>
              <button
                onClick={() => loadWeather(currentLocation)}
                className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Views */}
        {weatherData && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Always show Current Hero for instantaneous situational awareness */}
            <CurrentHero
              current={weatherData.current}
              location={weatherData.location}
              unit={unit}
              todayDaily={weatherData.daily[0]}
              onViewRadarClick={scrollToRadar}
            />

            {/* Meteorologist's Desk AI Briefing */}
            {(activeTab === "all" || activeTab === "hourly") && (
              <AiMeteorologistBriefing
                location={weatherData.location}
                current={weatherData.current}
                daily={weatherData.daily}
                alerts={activeAlerts}
              />
            )}

            {/* India Cyclone & Heavy Monsoon Threat Observatory */}
            {(activeTab === "all" || activeTab === "cyclone-monsoon") && (
              <IndiaCycloneMonsoonForecast
                currentLocation={weatherData.location}
                current={weatherData.current}
                daily={weatherData.daily}
                alerts={activeAlerts}
                unit={unit}
                onSelectLocation={(loc) => setCurrentLocation(loc)}
                onTriggerSimulation={handleTriggerSimulation}
                onClearSimulation={handleClearSimulation}
                isSimulated={simulatedAlerts !== null}
              />
            )}

            {/* Hourly Forecast (48h) */}
            {(activeTab === "all" || activeTab === "hourly") && (
              <HourlyScrubber
                hourly={weatherData.hourly}
                unit={unit}
              />
            )}

            {/* Extended 16-Day Forecast */}
            {(activeTab === "all" || activeTab === "extended") && (
              <DailyExtendedForecast
                daily={weatherData.daily}
                unit={unit}
              />
            )}

            {/* Local Emergency Services & Helplines (Fire, Police, Disaster Management) */}
            {(activeTab === "all" || activeTab === "emergency") && (
              <LocalEmergencyContacts
                currentLocation={weatherData.location}
              />
            )}

            {/* Event & Occasion Planner */}
            {(activeTab === "all" || activeTab === "extended") && (
              <EventCalendar
                currentLocation={weatherData.location}
                dailyForecast={weatherData.daily}
              />
            )}

            {/* 7-Day Historical Climate Trends */}
            {(activeTab === "all" || activeTab === "extended") && (
              <HistoricalTrends
                historicalData={weatherData.historical}
                unit={unit}
              />
            )}

            {/* Live Interactive Doppler Radar */}
            {(activeTab === "all" || activeTab === "radar") && (
              <div ref={radarSectionRef} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                    <Radar className="w-5 h-5 text-blue-400" />
                    <span>Interactive Doppler Radar & Precipitation Stream</span>
                  </h3>
                  <span className="text-xs text-slate-400">Global Composite Stream</span>
                </div>
                
                <WeatherRadarMap
                  location={weatherData.location}
                  currentTemp={weatherData.current.temperature}
                  weatherDescription={weatherData.current.weatherDescription}
                />
              </div>
            )}

            {/* Comprehensive Atmospheric Detail Metrics Grid */}
            {(activeTab === "all" || activeTab === "hourly") && (
              <DetailMetricsGrid
                current={weatherData.current}
                unit={unit}
                todayDaily={weatherData.daily[0]}
              />
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
              WC
            </div>
            <span className="font-bold text-slate-300">The Weather Channel Global</span>
            <span className="text-slate-600">•</span>
            <span>Real-time Global Meteorological Forecast System</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span>Data: WMO • Open-Meteo • RainViewer</span>
            <span>Alerts: WMO Severe Weather Guidelines</span>
          </div>
        </div>
      </footer>

      {/* Settings & Emergency Contacts Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLocation={currentLocation}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        themeMode={themeMode}
        onChangeTheme={setThemeMode}
        initialTab={settingsTab}
      />

    </div>
  );
}
