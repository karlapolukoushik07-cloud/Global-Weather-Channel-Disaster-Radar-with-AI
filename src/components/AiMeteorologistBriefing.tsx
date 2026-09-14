import React, { useState, useEffect } from "react";
import { GeoLocation, CurrentWeather, DailyForecastItem, WeatherAlert, AiBriefingResponse } from "../types/weather";
import { getAiMeteorologistBriefing } from "../services/weatherService";
import { Sparkles, Bot, Volume2, VolumeX, RefreshCw, CheckCircle2, Umbrella, Shirt, Car } from "lucide-react";

interface AiMeteorologistBriefingProps {
  location: GeoLocation;
  current: CurrentWeather;
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
}

export const AiMeteorologistBriefing: React.FC<AiMeteorologistBriefingProps> = ({
  location,
  current,
  daily,
  alerts
}) => {
  const [briefingData, setBriefingData] = useState<AiBriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const data = await getAiMeteorologistBriefing(location, current, daily, alerts);
      setBriefingData(data);
    } catch (err) {
      console.error("Failed to load briefing:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
    // Stop speaking if location changed
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [location.latitude, location.longitude]);

  // Audio Meteorologist Playback
  const toggleSpeech = () => {
    if (!("speechSynthesis" in window) || !briefingData) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(
        `Weather Channel Meteorologist Briefing for ${location.name}. ${briefingData.briefing}`
      );
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/40 shadow-xl p-5 sm:p-6 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Meteorologist's Desk & Forecast Analysis
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synoptic analysis and lifestyle impact for {location.name}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {"speechSynthesis" in window && (
            <button
              onClick={toggleSpeech}
              disabled={isLoading || !briefingData}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isSpeaking
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
              }`}
              title="Listen to on-air briefing"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
              <span>{isSpeaking ? "Mute Broadcast" : "Audio Broadcast"}</span>
            </button>
          )}

          <button
            onClick={fetchBriefing}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
            title="Refresh meteorologist analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-800 rounded w-5/6"></div>
          </div>
        ) : briefingData ? (
          <>
            {/* Meteorological Narrative */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm sm:text-base leading-relaxed text-slate-200 font-medium">
              "{briefingData.briefing}"
            </div>

            {/* Practical Recommendations Pill List */}
            {briefingData.recommendations && briefingData.recommendations.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Lifestyle, Clothing & Travel Impact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {briefingData.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs flex items-start space-x-2.5 text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-slate-400">
            Meteorologist briefing temporarily unavailable. Atmospheric conditions remain stable.
          </div>
        )}
      </div>

    </div>
  );
};
