import React, { useState, useEffect, useRef } from "react";
import { GeoLocation, UnitSystem } from "../types/weather";
import { searchLocations, DEFAULT_LOCATIONS } from "../services/weatherService";
import { 
  Search, 
  MapPin, 
  Navigation, 
  Bookmark, 
  BookmarkCheck, 
  Globe2, 
  Clock, 
  X,
  Loader2,
  SlidersHorizontal,
  Sun,
  Moon,
  Monitor,
  ShieldAlert,
  Settings
} from "lucide-react";

interface HeaderProps {
  currentLocation: GeoLocation;
  onSelectLocation: (loc: GeoLocation) => void;
  unit: UnitSystem;
  onToggleUnit: () => void;
  onGeolocate: () => void;
  isLocating: boolean;
  favorites: GeoLocation[];
  onToggleFavorite: (loc: GeoLocation) => void;
  themeMode: "light" | "dark" | "auto";
  onChangeTheme: (theme: "light" | "dark" | "auto") => void;
  onOpenSettings?: (tab?: "emergency" | "preferences") => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  unit,
  onToggleUnit,
  onGeolocate,
  isLocating,
  favorites,
  onToggleFavorite,
  themeMode,
  onChangeTheme,
  onOpenSettings
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isCurrentFavorite = favorites.some(
    f => Math.abs(f.latitude - currentLocation.latitude) < 0.05 && 
         Math.abs(f.longitude - currentLocation.longitude) < 0.05
  );

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchLocations(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo - The Weather Channel Look */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => onSelectLocation(currentLocation)}>
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40">
                <span className="font-extrabold text-white text-base tracking-tighter leading-none">
                  WC
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-tight uppercase font-sans">
                  The Weather Channel
                </span>
                <span className="text-[10px] font-semibold text-blue-400 tracking-widest uppercase">
                  Global Meteorological Network
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar - Center */}
          <div ref={searchRef} className="relative flex-1 max-w-lg hidden sm:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="search-location-input"
                type="text"
                placeholder="Search city, region, or global coordinates..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
              />
              {isSearching ? (
                <Loader2 className="absolute right-3.5 w-4 h-4 text-blue-400 animate-spin" />
              ) : query ? (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Dropdown Results */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 animate-fadeIn">
                {searchResults.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                      Global Search Results
                    </div>
                    {searchResults.map((loc) => (
                      <button
                        key={`${loc.latitude}-${loc.longitude}-${loc.name}`}
                        onClick={() => {
                          onSelectLocation(loc);
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-sm transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-white">{loc.name}</span>
                            <span className="text-xs text-slate-400 ml-1.5">
                              {loc.admin1 ? `${loc.admin1}, ` : ""}{loc.country}
                            </span>
                          </div>
                        </div>
                        {loc.countryCode && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {loc.countryCode}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : query.trim().length >= 2 && !isSearching ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No matching global locations found for "{query}"
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                      Popular Global Cities
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {DEFAULT_LOCATIONS.slice(0, 6).map((loc) => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            onSelectLocation(loc);
                            setIsSearchOpen(false);
                          }}
                          className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center space-x-2 transition"
                        >
                          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{loc.name}, {loc.country}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: Geolocation, Favorite, Unit Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Geolocation Button */}
            <button
              id="geolocation-button"
              onClick={onGeolocate}
              disabled={isLocating}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 transition shadow-sm"
              title="Detect my current location"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-blue-400" />
              )}
              <span className="hidden md:inline">Current Location</span>
            </button>

            {/* Favorite Pin Button */}
            <button
              id="favorite-location-button"
              onClick={() => onToggleFavorite(currentLocation)}
              className={`p-2 rounded-xl border transition ${
                isCurrentFavorite
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white"
              }`}
              title={isCurrentFavorite ? "Saved to favorites" : "Save location to favorites"}
            >
              {isCurrentFavorite ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Unit Switcher */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700/80 p-0.5">
              <button
                id="unit-celsius-button"
                onClick={() => unit !== "metric" && onToggleUnit()}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  unit === "metric"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                °C
              </button>
              <button
                id="unit-fahrenheit-button"
                onClick={() => unit !== "imperial" && onToggleUnit()}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  unit === "imperial"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                °F
              </button>
            </div>

            {/* Theme Switcher */}
            <div className="hidden sm:flex items-center rounded-xl bg-slate-900 border border-slate-700/80 p-0.5">
              <button
                onClick={() => onChangeTheme("light")}
                title="Light Mode"
                className={`p-1.5 rounded-lg transition ${
                  themeMode === "light"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeTheme("dark")}
                title="Dark Mode"
                className={`p-1.5 rounded-lg transition ${
                  themeMode === "dark"
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeTheme("auto")}
                title="Auto Theme"
                className={`p-1.5 rounded-lg transition ${
                  themeMode === "auto"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Emergency SOS Helplines Button */}
            {onOpenSettings && (
              <button
                id="header-emergency-helplines-btn"
                onClick={() => onOpenSettings("emergency")}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-600/60 text-xs font-black text-red-300 transition shadow-sm active:scale-95"
                title="Local Emergency Services & Helplines (Fire, Police, Disaster Management)"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
                <span className="hidden md:inline">Emergency SOS</span>
                <span className="md:hidden">SOS</span>
              </button>
            )}

            {/* Settings Gear Button */}
            {onOpenSettings && (
              <button
                id="header-settings-btn"
                onClick={() => onOpenSettings("preferences")}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Open Settings & Emergency Preferences"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="sm:hidden pb-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search global city..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {isSearchOpen && searchResults.length > 0 && (
            <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50">
              {searchResults.map((loc) => (
                <button
                  key={`${loc.latitude}-${loc.longitude}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    setQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-white">{loc.name}, {loc.country}</span>
                  <span className="text-[10px] text-slate-400">{loc.admin1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Location Pills Row & Mobile Theme Switcher */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800/80 no-scrollbar">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs flex-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center space-x-1">
              <Globe2 className="w-3 h-3 text-blue-400" />
              <span>Key Hubs:</span>
            </span>
            {favorites.map((fav) => (
              <button
                key={`fav-${fav.name}-${fav.latitude}`}
                onClick={() => onSelectLocation(fav)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full whitespace-nowrap transition border ${
                  Math.abs(fav.latitude - currentLocation.latitude) < 0.05 &&
                  Math.abs(fav.longitude - currentLocation.longitude) < 0.05
                    ? "bg-blue-600 text-white border-blue-400 font-bold"
                    : "bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800"
                }`}
              >
                <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                <span>{fav.name}</span>
              </button>
            ))}
            {DEFAULT_LOCATIONS.map((loc) => {
              const isSelected = Math.abs(loc.latitude - currentLocation.latitude) < 0.05 &&
                                Math.abs(loc.longitude - currentLocation.longitude) < 0.05;
              return (
                <button
                  key={loc.name}
                  onClick={() => onSelectLocation(loc)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full whitespace-nowrap transition border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-400 font-bold"
                      : "bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800"
                  }`}
                >
                  <span>{loc.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="flex sm:hidden items-center rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 ml-2 flex-shrink-0">
            <button
              onClick={() => onChangeTheme("light")}
              className={`p-1.5 rounded-lg transition ${
                themeMode === "light" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTheme("dark")}
              className={`p-1.5 rounded-lg transition ${
                themeMode === "dark" ? "bg-blue-500/20 text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTheme("auto")}
              className={`p-1.5 rounded-lg transition ${
                themeMode === "auto" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
