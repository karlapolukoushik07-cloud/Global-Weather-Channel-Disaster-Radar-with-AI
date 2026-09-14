import React, { useState } from "react";
import { WeatherAlert } from "../types/weather";
import { playOneAlertBuzzer } from "../utils/soundAlert";
import { AlertTriangle, ShieldAlert, ChevronRight, X, Info, Flame, Wind, CloudLightning, Waves, Snowflake, Eye, Radio, Volume2, VolumeX } from "lucide-react";

interface AlertBannerProps {
  alerts: WeatherAlert[];
  onTriggerSimulation?: (type: string) => void;
  isSimulated?: boolean;
  onClearSimulation?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onTriggerSimulation,
  isSimulated = false,
  onClearSimulation
}) => {
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);
  const [showSimMenu, setShowSimMenu] = useState(false);

  if (alerts.length === 0 && !isSimulated) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">NO ACTIVE SEVERE ALERTS</span>
          <span className="hidden sm:inline text-slate-400">Atmospheric conditions are currently within standard ranges.</span>
        </div>
        <div className="relative">
          <button
            id="test-alerts-button"
            onClick={() => setShowSimMenu(!showSimMenu)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Test alert system"
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulate Alerts</span>
          </button>
          
          {showSimMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Preview Severe Weather Alert
              </div>
              <button
                onClick={() => { 
                  playOneAlertBuzzer("cyclone");
                  onTriggerSimulation?.("cyclone-7day"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 flex items-center space-x-2"
              >
                <Wind className="w-3.5 h-3.5 text-rose-400" />
                <span>India Cyclone Threat (7 Days Out)</span>
              </button>
              <button
                onClick={() => { 
                  playOneAlertBuzzer("monsoon");
                  onTriggerSimulation?.("monsoon-cloudburst"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-950/60 hover:text-blue-300 text-slate-300 flex items-center space-x-2"
              >
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span>Heavy Monsoon Cloudburst (5 Days Out)</span>
              </button>
              <button
                onClick={() => { 
                  onTriggerSimulation?.("summer-loo"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-950/60 hover:text-amber-300 text-slate-300 flex items-center space-x-2"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Summer Scorching "Loo" Winds (44°C)</span>
              </button>
              <button
                onClick={() => { 
                  onTriggerSimulation?.("winter-sheetlahar"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 flex items-center space-x-2"
              >
                <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                <span>Winter "Sheet Lahar" Cold Gale (4°C)</span>
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => { 
                  playOneAlertBuzzer("cyclone");
                  onTriggerSimulation?.("hurricane"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-red-950/60 hover:text-red-300 text-slate-300 flex items-center space-x-2"
              >
                <Wind className="w-3.5 h-3.5 text-red-400" />
                <span>Category 3 Hurricane / High Wind</span>
              </button>
              <button
                onClick={() => { 
                  playOneAlertBuzzer("monsoon");
                  onTriggerSimulation?.("storm"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-950/60 hover:text-amber-300 text-slate-300 flex items-center space-x-2"
              >
                <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
                <span>Severe Thunderstorm & Hail</span>
              </button>
              <button
                onClick={() => { 
                  playOneAlertBuzzer("monsoon");
                  onTriggerSimulation?.("flood"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-950/60 hover:text-blue-300 text-slate-300 flex items-center space-x-2"
              >
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span>Flash Flood Emergency</span>
              </button>
              <button
                onClick={() => { 
                  onTriggerSimulation?.("heat"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-orange-950/60 hover:text-orange-300 text-slate-300 flex items-center space-x-2"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Excessive Heat Warning (42°C)</span>
              </button>
              <button
                onClick={() => { 
                  onTriggerSimulation?.("blizzard"); 
                  setShowSimMenu(false); 
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 flex items-center space-x-2"
              >
                <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                <span>Blizzard & Extreme Freeze</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const primaryAlert = alerts[0];

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "emergency":
        return {
          bg: "bg-gradient-to-r from-purple-950 via-rose-950 to-red-950",
          border: "border-purple-600/60",
          text: "text-purple-200",
          badge: "bg-purple-600 text-white",
          icon: ShieldAlert,
          glow: "shadow-purple-900/30"
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900",
          border: "border-red-600/70",
          text: "text-red-200",
          badge: "bg-red-600 text-white",
          icon: ShieldAlert,
          glow: "shadow-red-900/40"
        };
      case "watch":
        return {
          bg: "bg-gradient-to-r from-amber-950/90 via-orange-950/80 to-slate-900",
          border: "border-amber-600/70",
          text: "text-amber-200",
          badge: "bg-amber-600 text-white",
          icon: AlertTriangle,
          glow: "shadow-amber-900/40"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-yellow-950/80 via-amber-950/60 to-slate-900",
          border: "border-yellow-600/60",
          text: "text-yellow-200",
          badge: "bg-yellow-600 text-black font-semibold",
          icon: Info,
          glow: "shadow-yellow-900/30"
        };
    }
  };

  const style = getSeverityStyle(primaryAlert.severity);
  const IconComponent = style.icon;

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} p-3.5 shadow-lg ${style.glow} transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-black/40 border border-white/10 text-white">
              <IconComponent className="w-5 h-5 animate-pulse text-red-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${style.badge}`}>
                  {primaryAlert.severity}
                </span>
                {primaryAlert.advanceNoticeDays !== undefined && primaryAlert.advanceNoticeDays > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider shadow-sm">
                    {primaryAlert.advanceNoticeDays >= 7 ? "⚡ 1-WEEK EARLY ALERT" : `⚡ ${primaryAlert.advanceNoticeDays}-DAY ADVANCE`}
                  </span>
                )}
                {primaryAlert.imdColorCode && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    primaryAlert.imdColorCode === "Red" 
                      ? "bg-red-600 text-white" 
                      : primaryAlert.imdColorCode === "Orange"
                      ? "bg-amber-600 text-white"
                      : "bg-yellow-500 text-black font-bold"
                  }`}>
                    IMD {primaryAlert.imdColorCode} Alert
                  </span>
                )}
                <span className="text-xs text-white/70 font-medium">
                  {primaryAlert.effectiveTime} • Expires {primaryAlert.expiresTime}
                </span>
                {isSimulated && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-600/40 text-blue-200 border border-blue-400/30 font-mono">
                    SIMULATED DEMO
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5 leading-snug">
                {primaryAlert.headline || primaryAlert.title}
              </h4>
              <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                {primaryAlert.instruction}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
            {/* Buzzer button: hidden for Arabian Sea side and summer/winter alerts per user configuration */}
            {!(
              primaryAlert.category === "heat" || 
              primaryAlert.category === "winter" || 
              primaryAlert.title.toLowerCase().includes("arabian") ||
              primaryAlert.title.toLowerCase().includes("summer") ||
              primaryAlert.title.toLowerCase().includes("winter") ||
              primaryAlert.title.toLowerCase().includes("loo") ||
              primaryAlert.title.toLowerCase().includes("sheet lahar") ||
              primaryAlert.regions?.some(r => r.toLowerCase().includes("arabian") || r.toLowerCase().includes("mumbai") || r.toLowerCase().includes("konkan") || r.toLowerCase().includes("kerala"))
            ) && (
              <button
                id="alert-banner-sound-buzzer-btn"
                onClick={() => {
                  if (primaryAlert.category === "wind" || primaryAlert.title.toLowerCase().includes("cyclone")) {
                    playOneAlertBuzzer("cyclone");
                  } else if (primaryAlert.category === "flood" || primaryAlert.category === "storm") {
                    playOneAlertBuzzer("monsoon");
                  } else {
                    playOneAlertBuzzer("emergency");
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center space-x-1 shadow-md shadow-red-900/40"
                title="Play Warning Buzzer / Beep Sound for this alert"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Buzzer Alert</span>
              </button>
            )}
            {isSimulated && (
              <button
                onClick={onClearSimulation}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Clear Demo
              </button>
            )}
            <button
              id="view-alert-details-button"
              onClick={() => setSelectedAlert(primaryAlert)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition backdrop-blur-sm"
            >
              <span>View Full Alert ({alerts.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-red-600 text-white">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                      {selectedAlert.severity}
                    </span>
                    {selectedAlert.advanceNoticeDays !== undefined && selectedAlert.advanceNoticeDays > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider">
                        {selectedAlert.advanceNoticeDays >= 7 ? "⚡ 1-WEEK EARLY ALERT" : `⚡ ${selectedAlert.advanceNoticeDays}-DAY ADVANCE`}
                      </span>
                    )}
                    {selectedAlert.imdColorCode && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        selectedAlert.imdColorCode === "Red" 
                          ? "bg-red-600 text-white" 
                          : selectedAlert.imdColorCode === "Orange"
                          ? "bg-amber-600 text-white"
                          : "bg-yellow-500 text-black font-bold"
                      }`}>
                        IMD {selectedAlert.imdColorCode}
                      </span>
                    )}
                    {selectedAlert.threatLevel && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        Threat: {selectedAlert.threatLevel}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      Issued by {selectedAlert.source}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedAlert.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-sm text-slate-300">
              <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl">
                <h5 className="font-semibold text-red-300 text-xs uppercase tracking-wider mb-1">
                  Active Headline
                </h5>
                <p className="text-sm font-medium text-white">
                  {selectedAlert.headline}
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-400 text-xs uppercase tracking-wider mb-1">
                  Hazard Description
                </h5>
                <p className="leading-relaxed text-slate-200">
                  {selectedAlert.description}
                </p>
              </div>

              <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl">
                <h5 className="font-semibold text-amber-300 text-xs uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Recommended Protective Actions</span>
                </h5>
                <p className="leading-relaxed text-amber-100 font-medium">
                  {selectedAlert.instruction}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800 text-slate-400">
                <div>
                  <span className="block text-slate-500">Effective:</span>
                  <span className="font-medium text-slate-200">{selectedAlert.effectiveTime}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Expires:</span>
                  <span className="font-medium text-slate-200">{selectedAlert.expiresTime}</span>
                </div>
              </div>

              {alerts.length > 1 && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Other Active Alerts:</div>
                  <div className="flex flex-wrap gap-2">
                    {alerts.map((a, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedAlert(a)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          selectedAlert.id === a.id
                            ? "bg-slate-700 text-white border-slate-500"
                            : "bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        {a.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              {!(
                selectedAlert.category === "heat" || 
                selectedAlert.category === "winter" || 
                selectedAlert.title.toLowerCase().includes("arabian") ||
                selectedAlert.title.toLowerCase().includes("summer") ||
                selectedAlert.title.toLowerCase().includes("winter") ||
                selectedAlert.title.toLowerCase().includes("loo") ||
                selectedAlert.title.toLowerCase().includes("sheet lahar") ||
                selectedAlert.regions?.some(r => r.toLowerCase().includes("arabian") || r.toLowerCase().includes("mumbai") || r.toLowerCase().includes("konkan") || r.toLowerCase().includes("kerala"))
              ) ? (
                <button
                  onClick={() => {
                    if (selectedAlert.category === "wind" || selectedAlert.title.toLowerCase().includes("cyclone")) {
                      playOneAlertBuzzer("cyclone");
                    } else if (selectedAlert.category === "flood" || selectedAlert.category === "storm") {
                      playOneAlertBuzzer("monsoon");
                    } else {
                      playOneAlertBuzzer("emergency");
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center space-x-1.5 shadow-md shadow-red-950/50"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Play Alert Buzzer / Beep</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400 italic flex items-center space-x-1.5">
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span>Alert buzzer sound disabled for this region / season</span>
                </div>
              )}

              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                Close & Return to Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
