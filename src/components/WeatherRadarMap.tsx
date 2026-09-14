import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GeoLocation } from "../types/weather";
import { playOneAlertBuzzer } from "../utils/soundAlert";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Cloud,
  Volume2,
  ShieldAlert
} from "lucide-react";

interface WeatherRadarMapProps {
  location: GeoLocation;
  currentTemp?: number;
  weatherDescription?: string;
}

interface RadarFrame {
  time: number;
  path: string;
}

// Coastal Alert Coordinates
const BOB_COASTAL_ALERT_PATH: [number, number][] = [
  [22.2, 88.5], [21.6, 87.5], [20.3, 86.8], [19.8, 85.9], [19.3, 85.0],
  [18.3, 84.1], [17.7, 83.3], [16.9, 82.3], [16.2, 81.2], [14.4, 80.1],
  [13.1, 80.3], [11.9, 79.8], [10.8, 79.9], [8.1, 77.6],
  [8.0, 80.0], [12.0, 84.0], [17.0, 88.0], [21.0, 90.0], [22.2, 88.5]
];

const ARABIAN_SEA_ALERT_PATH: [number, number][] = [
  [23.5, 68.8], [22.4, 69.0], [21.6, 69.6], [20.9, 70.4], [21.2, 72.8],
  [19.9, 72.7], [18.9, 72.8], [15.5, 73.8], [12.9, 74.8], [9.9, 76.2], [8.1, 77.5],
  [8.0, 74.5], [13.0, 71.5], [19.0, 69.0], [23.5, 67.0], [23.5, 68.8]
];

export const WeatherRadarMap: React.FC<WeatherRadarMapProps> = ({
  location,
  currentTemp,
  weatherDescription
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const coastalLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hostUrl, setHostUrl] = useState<string>("https://tilecache.rainviewer.com");
  const [activeLayerType, setActiveLayerType] = useState<"radar" | "satellite">("radar");
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCoastalRedAlert, setShowCoastalRedAlert] = useState<boolean>(true);
  const containerWrapperRef = useRef<HTMLDivElement>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.latitude, location.longitude],
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      });

      // Dark theme OpenStreetMap tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd"
      }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-weather-pin",
        html: `<div class="relative flex items-center justify-center">
                <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-ping absolute opacity-75"></div>
                <div class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md relative z-10"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([location.latitude, location.longitude], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
          <strong>${location.name}</strong><br/>
          ${currentTemp !== undefined ? `${Math.round(currentTemp)}° - ` : ""}${weatherDescription || ""}
        </div>
      `);

      markerRef.current = marker;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.latitude, location.longitude], 8, { animate: true });
      if (markerRef.current) {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
      }
    }
  }, [location.latitude, location.longitude]);

  // Fetch RainViewer radar loop metadata
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRadar(true);

    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.host) setHostUrl(data.host);

        const past = data.radar?.past || [];
        const nowcast = data.radar?.nowcast || [];
        const combined = [...past, ...nowcast];

        if (combined.length > 0) {
          setRadarFrames(combined);
          // Set to the latest real-time frame
          setCurrentFrameIndex(past.length > 0 ? past.length - 1 : combined.length - 1);
        }
        setIsLoadingRadar(false);
      })
      .catch((err) => {
        console.warn("RainViewer fetch warning:", err);
        setIsLoadingRadar(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update radar overlay layer whenever frame or host changes
  useEffect(() => {
    if (!mapInstanceRef.current || radarFrames.length === 0) return;

    const frame = radarFrames[currentFrameIndex];
    if (!frame) return;

    const colorScheme = 2; // Universal Weather Channel color scheme
    const smooth = 1;
    const snow = 1;
    const tileUrl = `${hostUrl}${frame.path}/256/{z}/{x}/{y}/${colorScheme}/${smooth}_${snow}.png`;

    if (radarLayerRef.current) {
      mapInstanceRef.current.removeLayer(radarLayerRef.current);
    }

    const newRadarLayer = L.tileLayer(tileUrl, {
      opacity: 0.72,
      zIndex: 100,
      maxZoom: 18
    });

    newRadarLayer.addTo(mapInstanceRef.current);
    radarLayerRef.current = newRadarLayer;
  }, [currentFrameIndex, hostUrl, radarFrames]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 900);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames.length]);

  // Render Coastal Red Alert Zones overlay on Radar Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (coastalLayerGroupRef.current) {
      mapInstanceRef.current.removeLayer(coastalLayerGroupRef.current);
      coastalLayerGroupRef.current = null;
    }

    if (!showCoastalRedAlert) return;

    const group = L.layerGroup();

    // Bay of Bengal High Surrounded Area Alert Polygon
    const bobPolygon = L.polygon(BOB_COASTAL_ALERT_PATH, {
      color: "#ef4444",
      weight: 3,
      fillColor: "#dc2626",
      fillOpacity: 0.35,
      dashArray: "6, 6",
      className: "pulse-red-alert-zone leaflet-red-alert-zone"
    }).addTo(group);

    bobPolygon.bindTooltip("🚨 Bay of Bengal Coastal Red Alert Zone: Extreme Surge & Cyclone Risk (Click for Buzzer)", {
      sticky: true,
      className: "bg-red-950 text-white font-bold px-2 py-1 rounded border border-red-500 text-xs"
    });

    bobPolygon.on("click", () => {
      playOneAlertBuzzer("cyclone");
    });

    // Arabian Sea High Surrounded Area Alert Polygon
    const arabianPolygon = L.polygon(ARABIAN_SEA_ALERT_PATH, {
      color: "#f43f5e",
      weight: 3,
      fillColor: "#e11d48",
      fillOpacity: 0.35,
      dashArray: "6, 6",
      className: "pulse-red-alert-zone leaflet-red-alert-zone"
    }).addTo(group);

    arabianPolygon.bindTooltip("🚨 Arabian Sea Coastal Red Alert Zone: Heavy Monsoon & Gale Warning", {
      sticky: true,
      className: "bg-red-950 text-white font-bold px-2 py-1 rounded border border-red-500 text-xs"
    });

    group.addTo(mapInstanceRef.current);
    coastalLayerGroupRef.current = group;

    return () => {
      if (mapInstanceRef.current && coastalLayerGroupRef.current) {
        mapInstanceRef.current.removeLayer(coastalLayerGroupRef.current);
      }
    };
  }, [showCoastalRedAlert]);

  // Center map on location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.latitude, location.longitude], 8, { animate: true });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      containerWrapperRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const activeTimestamp = radarFrames[currentFrameIndex]?.time 
    ? new Date(radarFrames[currentFrameIndex].time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Live";

  return (
    <div 
      ref={containerWrapperRef} 
      className={`relative rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col ${
        isFullscreen ? "h-screen rounded-none" : "h-[450px] sm:h-[500px]"
      }`}
    >
      {/* Top Overlay Bar: Header & Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Title pill & Coastal Alert Indicator */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-md text-white text-xs shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold tracking-wide">LIVE DOPPLER RADAR</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400 font-mono font-semibold">{activeTimestamp}</span>
          </div>

          <button
            onClick={() => setShowCoastalRedAlert(!showCoastalRedAlert)}
            className={`px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-xs font-bold transition shadow-lg flex items-center space-x-1.5 ${
              showCoastalRedAlert
                ? "bg-red-950/90 text-red-200 border-red-600 shadow-red-900/40 animate-pulse"
                : "bg-slate-950/85 hover:bg-slate-800 text-slate-400 border-slate-700/80"
            }`}
            title="Toggle India Coastal Red Alert High Surrounded Area"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Coastal Red Alert</span>
            <span className="sm:hidden">Red Alert</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="pointer-events-auto flex items-center space-x-1.5">
          <button
            onClick={() => playOneAlertBuzzer("cyclone")}
            className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 border border-red-400 backdrop-blur-md text-white text-xs font-bold transition shadow-lg flex items-center space-x-1"
            title="Play Emergency Alert Buzzer / Beep Sound"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alert Buzzer</span>
          </button>
          <button
            onClick={handleRecenter}
            className="p-2 rounded-xl bg-slate-950/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-white transition shadow-lg"
            title="Recenter on current city"
          >
            <MapPin className="w-4 h-4 text-blue-400" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-950/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-white transition shadow-lg"
            title="Toggle fullscreen radar"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-300" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Map Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-col gap-2">
        
        {/* Radar dBZ Legend Bar */}
        <div className="pointer-events-auto self-start flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[10px] text-slate-300 shadow-xl">
          <span className="font-semibold text-slate-400 uppercase">Precipitation:</span>
          <div className="flex items-center space-x-1">
            <span className="text-emerald-400">Light</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-yellow-400 via-red-500 to-purple-600" />
            <span className="text-purple-400 font-bold">Severe / Hail</span>
          </div>
        </div>

        {/* Animation Scrubber & Play/Pause */}
        <div className="pointer-events-auto flex items-center space-x-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md shadow-2xl text-white">
          <button
            id="radar-play-pause-button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-md flex-shrink-0"
            title={isPlaying ? "Pause radar loop" : "Play radar loop"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          {/* Time Scrubber Slider */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1 mb-1">
              <span>Past (1h)</span>
              <span className="text-blue-400 font-bold">{activeTimestamp}</span>
              <span>Nowcast (+30m)</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, radarFrames.length - 1)}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIndex(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setCurrentFrameIndex(radarFrames.length > 0 ? radarFrames.length - 1 : 0);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition flex items-center space-x-1 flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Latest</span>
          </button>
        </div>

      </div>
    </div>
  );
};
