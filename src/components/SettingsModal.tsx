import React, { useState } from "react";
import { GeoLocation, UnitSystem } from "../types/weather";
import { LocalEmergencyContacts } from "./LocalEmergencyContacts";
import { 
  X, 
  Settings, 
  ShieldAlert, 
  Sliders, 
  Sun, 
  Moon, 
  Monitor, 
  Volume2, 
  VolumeX, 
  MapPin 
} from "lucide-react";
import { getAudioMuted, toggleAudioMuted } from "../utils/soundAlert";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: GeoLocation;
  unit: UnitSystem;
  onToggleUnit: () => void;
  themeMode: "light" | "dark" | "auto";
  onChangeTheme: (theme: "light" | "dark" | "auto") => void;
  initialTab?: "emergency" | "preferences";
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  unit,
  onToggleUnit,
  themeMode,
  onChangeTheme,
  initialTab = "emergency"
}) => {
  const [activeTab, setActiveTab] = useState<"emergency" | "preferences">(initialTab);
  const [isMuted, setIsMuted] = useState(() => getAudioMuted());

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = toggleAudioMuted();
    setIsMuted(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-950 border-2 border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Settings & Emergency Services
              </h2>
              <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>Current Location: {currentLocation.name}, {currentLocation.country}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 pt-3 border-b border-slate-800 bg-slate-950 gap-2">
          <button
            onClick={() => setActiveTab("emergency")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "emergency"
                ? "border-red-500 text-red-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Local Emergency Helplines (Fire, Police, Disaster)</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "preferences"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General Preferences</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          {activeTab === "emergency" ? (
            <LocalEmergencyContacts
              currentLocation={currentLocation}
              isCompactModal={true}
              onCloseModal={onClose}
            />
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              {/* Temperature & Metrics Unit */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Measurement Units</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Toggle between Celsius (°C, km/h) and Fahrenheit (°F, mph)</p>
                </div>

                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 p-1">
                  <button
                    onClick={() => unit !== "metric" && onToggleUnit()}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      unit === "metric" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Metric (°C)
                  </button>
                  <button
                    onClick={() => unit !== "imperial" && onToggleUnit()}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      unit === "imperial" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Imperial (°F)
                  </button>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Application Appearance</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Choose Dark, Light, or Solar Auto (syncs to sunrise/sunset)</p>
                </div>

                <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 p-1">
                  <button
                    onClick={() => onChangeTheme("light")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                      themeMode === "light" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => onChangeTheme("dark")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                      themeMode === "dark" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => onChangeTheme("auto")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                      themeMode === "auto" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>

              {/* Alert Audio / Buzzer Horn Setting */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Severe Alert Siren Audio</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Audio buzzer for critical cyclone and severe monsoon flash floods
                  </p>
                </div>

                <button
                  onClick={handleToggleSound}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition border ${
                    isMuted
                      ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      : "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isMuted ? "Sound Muted" : "Sound Enabled"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Global Weather Channel • Emergency Preparedness System</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
