import React, { useState, useEffect } from "react";
import { PlannedEvent, GeoLocation, DailyForecastItem } from "../types/weather";
import { Calendar, MapPin, Plus, Trash2, AlertTriangle, CheckCircle2, Sparkles, Loader2, Info, RefreshCw, LogIn, LogOut, Search } from "lucide-react";
import { initAuth, googleSignIn, signOut, getAccessToken } from "../services/authService";
import { getCalendarEvents } from "../services/calendarService";
import { User } from "firebase/auth";

interface EventCalendarProps {
  currentLocation: GeoLocation;
  dailyForecast: DailyForecastItem[];
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ currentLocation, dailyForecast }) => {
  const [events, setEvents] = useState<PlannedEvent[]>(() => {
    const saved = localStorage.getItem("weather_planned_events");
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestEventType, setSuggestEventType] = useState("");
  const [suggestLocation, setSuggestLocation] = useState(currentLocation.name);
  const [suggestionResult, setSuggestionResult] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [locationStr, setLocationStr] = useState(currentLocation.name);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    localStorage.setItem("weather_planned_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => setUser(u),
      () => setUser(null)
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const result = await googleSignIn();
    if (result) {
      setUser(result.user);
    }
  };

  const handleSyncCalendar = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Please sign in to sync with Google Calendar.");
      return;
    }

    setIsSyncing(true);
    setError(null);
    try {
      const data = await getCalendarEvents(token, 16);
      if (data.items && data.items.length > 0) {
        // Find events that aren't already synced based on title + date
        const newGcalEvents = data.items.filter((item: any) => {
           if (!item.start || (!item.start.date && !item.start.dateTime)) return false;
           return true;
        });

        const syncedEvents: PlannedEvent[] = [];
        for (const item of newGcalEvents) {
          const itemDateRaw = item.start.date || item.start.dateTime;
          const itemDate = new Date(itemDateRaw).toISOString().split('T')[0];
          
          // Skip if already in local list roughly
          if (events.some(e => e.title === item.summary && e.date === itemDate)) {
             continue;
          }

          const loc = item.location || currentLocation.name;

          // Process through our AI scout
          const res = await fetch("/api/plan-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: item.summary || "Calendar Event",
              date: itemDate,
              locationStr: loc,
              currentLat: currentLocation.latitude,
              currentLon: currentLocation.longitude,
              dailyForecast
            })
          });

          if (res.ok) {
            const resData = await res.json();
            syncedEvents.push({
              id: `gcal-${item.id}-${Date.now()}`,
              title: item.summary || "Calendar Event",
              date: itemDate,
              locationName: resData.locationName || loc,
              latitude: resData.latitude || currentLocation.latitude,
              longitude: resData.longitude || currentLocation.longitude,
              aiAdvice: resData.advice,
              hasRisk: resData.hasRisk
            });
          }
        }

        setEvents(prev => [...prev, ...syncedEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sync Google Calendar.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSuggestDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestEventType || !suggestLocation) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/suggest-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: suggestEventType,
          locationStr: suggestLocation,
          dailyForecast
        })
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setSuggestionResult(data.suggestion);
    } catch (err: any) {
      setError("Failed to get AI suggestions. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !locationStr) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Get Event Data and Context using Gemini + Google Maps
      const res = await fetch("/api/plan-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          locationStr,
          currentLat: currentLocation.latitude,
          currentLon: currentLocation.longitude,
          dailyForecast // We pass the forecast to provide weather context to the AI
        })
      });

      if (!res.ok) throw new Error("Failed to analyze event location");

      const data = await res.json();

      const newEvent: PlannedEvent = {
        id: Date.now().toString(),
        title,
        date,
        locationName: data.locationName || locationStr,
        latitude: data.latitude || currentLocation.latitude,
        longitude: data.longitude || currentLocation.longitude,
        aiAdvice: data.advice,
        hasRisk: data.hasRisk
      };

      setEvents([...events, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setIsAdding(false);
      setTitle("");
      setDate("");
      setLocationStr(currentLocation.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not analyze event. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  // Helper to find forecast for event date (if within 16 days and same location broadly)
  const getForecastForDate = (eventDate: string) => {
    return dailyForecast.find(d => d.date === eventDate);
  };

  return (
    <div 
      id="event-and-occasion-planner-container"
      className="rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#0f1a30] to-[#090e1a] border-2 border-indigo-500/50 shadow-2xl shadow-indigo-950/50 overflow-hidden mt-6 relative"
    >
      {/* Radiant Top Glow Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-5 sm:p-6 border-b border-indigo-900/50 bg-[#090e1b]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-950/50 flex-shrink-0">
            <Calendar className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                Event & Occasion Planner
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                16-Day Forecast Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/80 font-medium">
              Plan weddings, sports, travel & gatherings with advance alerts for heavy rain, gale winds, and cyclones.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user ? (
             <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncCalendar}
                  disabled={isSyncing}
                  className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-blue-950/90 text-blue-200 font-bold border border-blue-500/50 hover:bg-blue-900 transition disabled:opacity-50 text-xs sm:text-sm shadow-sm"
                  title="Sync Google Calendar"
                >
                  <RefreshCw className={`w-4 h-4 text-blue-300 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sync GCal</span>
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
             </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-bold hover:bg-slate-800 transition text-xs sm:text-sm shadow-sm"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" className="w-4 h-4 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>Sign in</span>
            </button>
          )}

          <button
            onClick={() => { setIsSuggesting(!isSuggesting); setIsAdding(false); setSuggestionResult(null); }}
            className={`flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-bold transition text-xs sm:text-sm border ${
              isSuggesting 
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/40' 
                : 'bg-purple-950/80 text-purple-200 hover:bg-purple-900 border-purple-600/50'
            }`}
          >
            <Search className="w-4 h-4 text-purple-300" /> <span className="hidden sm:inline">Suggest Best Dates</span>
            <span className="sm:hidden">Suggest</span>
          </button>

          <button
            onClick={() => { setIsAdding(!isAdding); setIsSuggesting(false); }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/40"
          >
            {isAdding ? "Cancel" : <><Plus className="w-4 h-4 text-white" /> <span>Add Event</span></>}
          </button>
        </div>
      </div>

      {isSuggesting && (
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 border-b border-purple-600/40 animate-fadeIn">
          <form onSubmit={handleSuggestDates} className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-2 text-purple-200 font-extrabold text-sm mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="uppercase tracking-wider">AI Meteorologist Date Suggester (16-Day Outlook)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-purple-200 block">
                  Occasion / Event Type
                </label>
                <input
                  type="text"
                  required
                  value={suggestEventType}
                  onChange={(e) => setSuggestEventType(e.target.value)}
                  placeholder="e.g., Outdoor Wedding, Beach Festival, Cricket Match"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm placeholder-slate-400 border-2 border-purple-700/80 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-purple-200 block">
                  Location / Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    value={suggestLocation}
                    onChange={(e) => setSuggestLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm placeholder-slate-400 border-2 border-purple-700/80 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30"
                  />
                </div>
              </div>
            </div>
            
            {error && !isAdding && (
              <div className="p-3 bg-red-950/80 text-red-200 rounded-xl text-xs sm:text-sm border border-red-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-950/50"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing 16-Day Weather Models...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Find Best Weather Window</>
              )}
            </button>

            {suggestionResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border-2 border-purple-500/60 shadow-lg text-slate-100 leading-relaxed text-sm whitespace-pre-wrap">
                <span className="font-extrabold text-purple-300 block mb-1.5 text-xs uppercase tracking-wider">
                  AI Meteorologist Recommendation:
                </span>
                {suggestionResult}
              </div>
            )}
          </form>
        </div>
      )}

      {isAdding && (
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-slate-950/90 border-b border-blue-600/40 animate-fadeIn">
          <form onSubmit={handleAddEvent} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-200 block">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Coastal Wedding, Family Trip, Sports Finals"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm placeholder-slate-400 border-2 border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-200 block">
                  Date (Up to 16 days ahead) *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  max={new Date(Date.now() + 16 * 86400000).toISOString().split("T")[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm border-2 border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-200 block">
                  Event Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-indigo-400" />
                  <input
                    type="text"
                    required
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    placeholder="Enter city, beach, stadium or landmark"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-sm placeholder-slate-400 border-2 border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              </div>
            </div>
            
            {error && isAdding && (
              <div className="p-3 bg-red-950/80 text-red-200 rounded-xl text-xs sm:text-sm border border-red-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-950/50"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Location & Weather Models...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Plan Event & Screen Weather</>
              )}
            </button>
          </form>
        </div>
      )}

      <div className="p-5 sm:p-6 bg-[#080e1d]/50">
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-300 flex flex-col items-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-3 text-indigo-400">
              <Calendar className="w-10 h-10 text-indigo-400" />
            </div>
            <p className="font-extrabold text-white text-base">No events planned yet</p>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-sm">
              Add your upcoming wedding, travel trip, or outdoor gathering to monitor real-time 16-day severe weather risks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((event) => {
              const forecast = getForecastForDate(event.date);
              
              return (
                <div 
                  key={event.id} 
                  className="rounded-2xl bg-slate-950/90 border-2 border-slate-800 hover:border-indigo-500/60 transition-all duration-200 p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-black text-white text-lg sm:text-xl tracking-tight">
                          {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center text-indigo-300 font-bold text-xs sm:text-sm mt-1 gap-3">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                            {new Date(event.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                            {event.locationName}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeEvent(event.id)}
                        className="text-slate-400 hover:text-red-400 p-2 transition rounded-xl hover:bg-red-950/40"
                        title="Remove event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* AI Advice Box */}
                    {event.aiAdvice && (
                      <div className={`p-4 rounded-xl border-2 text-sm mt-4 mb-4 flex items-start space-x-3 shadow-md ${
                        event.hasRisk 
                          ? 'bg-amber-950/70 border-amber-500/60 text-amber-100' 
                          : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-100'
                      }`}>
                        {event.hasRisk ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-black text-xs uppercase tracking-wider mb-1 flex items-center ${
                            event.hasRisk ? 'text-amber-300' : 'text-emerald-300'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 
                            AI Meteorologist Scout
                          </p>
                          <p className="leading-relaxed font-semibold text-xs sm:text-sm">
                            {event.aiAdvice}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Basic forecast context if matches current location area roughly */}
                  {forecast && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={`/icons/${forecast.conditionIconName}.svg`} 
                          className="w-10 h-10 drop-shadow-md" 
                          alt="Weather"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div>
                          <p className="font-extrabold text-white text-sm">{forecast.weatherDescription}</p>
                          <p className="text-xs text-indigo-200 font-semibold">
                            {forecast.tempMax}° / {forecast.tempMin}° • {forecast.precipitationProbability}% Rain
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {!forecast && (
                    <div className="pt-3 border-t border-slate-800 flex items-center text-xs text-slate-400 font-medium">
                      <Info className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Detailed local forecast outside 16-day window or different region.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
