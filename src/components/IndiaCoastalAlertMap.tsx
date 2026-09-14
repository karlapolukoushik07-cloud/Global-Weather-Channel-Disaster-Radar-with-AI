import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GeoLocation, WeatherAlert } from "../types/weather";
import { INDIA_CYCLONE_MONSOON_HUBS } from "../services/weatherService";
import { playOneAlertBuzzer, getAudioMuted, toggleAudioMuted, subscribeAlertSound } from "../utils/soundAlert";
import { 
  Wind, 
  CloudRain, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Radio, 
  Waves, 
  Flame, 
  Snowflake, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Eye,
  Info,
  AlertTriangle,
  Activity
} from "lucide-react";

interface IndiaCoastalAlertMapProps {
  currentLocation: GeoLocation;
  alerts: WeatherAlert[];
  onSelectLocation: (loc: GeoLocation) => void;
  activeScenario?: string;
  onTriggerSimulation?: (type: string) => void;
}

// Pre-defined high-accuracy coastal danger polygon coordinates for India
const BAY_OF_BENGAL_COASTAL_ALERT_ZONE: [number, number][] = [
  [22.2, 88.5], // Sundarbans / Digha, West Bengal
  [21.6, 87.5], // Digha / Chandipur, Odisha
  [20.3, 86.8], // Paradip Coast
  [19.8, 85.9], // Puri Coast
  [19.3, 85.0], // Gopalpur Coast
  [18.3, 84.1], // Kalingapatnam, AP
  [17.7, 83.3], // Visakhapatnam Coast
  [16.9, 82.3], // Kakinada
  [16.2, 81.2], // Machilipatnam Coast
  [15.8, 80.5], // Bapatla
  [14.4, 80.1], // Nellore
  [13.1, 80.3], // Chennai Coast
  [11.9, 79.8], // Puducherry
  [10.8, 79.9], // Nagapattinam Coast
  [9.3, 79.3],  // Pamban / Rameswaram
  [8.1, 77.6],  // Kanyakumari Tip
  // Offshore oceanic danger boundary (surrounded storm surge / high wave zone)
  [7.8, 79.5],
  [9.5, 82.0],
  [12.0, 84.0],
  [15.0, 86.5],
  [18.0, 88.5],
  [20.5, 90.0],
  [22.2, 89.8],
  [22.2, 88.5]
];

const ARABIAN_SEA_COASTAL_ALERT_ZONE: [number, number][] = [
  [23.5, 68.8], // Kutch, Gujarat
  [22.4, 69.0], // Dwarka Coast
  [21.6, 69.6], // Porbandar Coast
  [20.9, 70.4], // Veraval / Somnath
  [20.7, 71.0], // Diu
  [21.2, 72.8], // Surat Coast
  [19.9, 72.7], // Dahanu, Maharashtra
  [18.9, 72.8], // Mumbai Coastal Belt
  [18.6, 72.9], // Alibaug
  [16.9, 73.3], // Ratnagiri Coast
  [15.5, 73.8], // Goa Coast
  [14.8, 74.1], // Karwar, Karnataka
  [12.9, 74.8], // Mangaluru Coast
  [11.2, 75.8], // Kozhikode, Kerala
  [9.9, 76.2],  // Kochi Coastal Belt
  [9.5, 76.3],  // Alappuzha
  [8.5, 76.9],  // Thiruvananthapuram
  [8.1, 77.5],  // Kanyakumari
  // Offshore Arabian Sea threat boundary (gale wind and high swell boundary)
  [8.0, 75.0],
  [10.0, 73.5],
  [13.0, 72.0],
  [16.0, 70.5],
  [19.0, 69.5],
  [21.5, 67.5],
  [23.5, 67.5],
  [23.5, 68.8]
];

// Summer "Loo" Scorching Heat Winds Alert Zone (Indo-Gangetic & Western Desert Belt)
const SUMMER_LOO_HEAT_WIND_ZONE: [number, number][] = [
  [28.0, 70.0], // West Rajasthan / Thar
  [30.2, 74.5], // Punjab / Haryana border
  [29.8, 77.2], // Haryana / Delhi NCR
  [28.7, 78.5], // Western UP (Meerut, Aligarh)
  [26.5, 78.0], // Gwalior / Chambal, MP
  [25.0, 75.5], // Kota / South Rajasthan
  [25.0, 71.5], // Barmer / Jodhpur
  [28.0, 70.0]
];

// Winter "Sheet Lahar" Cold Wave Alert Zone (Northern Plains & Himalayan Foothills)
const WINTER_SHEET_LAHAR_ZONE: [number, number][] = [
  [32.2, 75.0], // Pathankot / Punjab foothills
  [30.3, 78.0], // Dehradun / Uttarakhand foothills
  [29.0, 79.5], // Bareilly / North UP
  [27.5, 81.0], // Central UP plains
  [26.8, 79.0], // Kanpur plains
  [28.2, 76.5], // Delhi NCR / Gurgaon
  [29.5, 74.5], // Hisar / Haryana
  [31.5, 74.2], // Amritsar / Punjab
  [32.2, 75.0]
];

// Simulated 7-day tropical cyclone trajectory (approaching Odisha/Andhra coast)
const CYCLONE_7DAY_PROJECTED_TRACK: { lat: number; lng: number; day: string; wind: string; type: string }[] = [
  { lat: 12.5, lng: 88.5, day: "Day -7", wind: "55 km/h", type: "Low Pressure Vortex" },
  { lat: 14.2, lng: 87.2, day: "Day -5", wind: "75 km/h", type: "Deep Depression" },
  { lat: 16.0, lng: 85.8, day: "Day -3", wind: "105 km/h", type: "Cyclonic Storm" },
  { lat: 17.8, lng: 84.5, day: "Day -2", wind: "135 km/h", type: "Very Severe Cyclonic Storm" },
  { lat: 19.5, lng: 85.7, day: "Day -1 (Approaching Landfall)", wind: "155 km/h", type: "Extremely Severe Cyclone" },
  { lat: 19.8, lng: 85.8, day: "Day 0 (Landfall at Puri / Paradip)", wind: "165 km/h", type: "Landfall Disaster Area" }
];

export const IndiaCoastalAlertMap: React.FC<IndiaCoastalAlertMapProps> = ({
  currentLocation,
  alerts,
  onSelectLocation,
  activeScenario = "all",
  onTriggerSimulation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedThreatFilter, setSelectedThreatFilter] = useState<"all" | "cyclone-bob" | "cyclone-as" | "summer-loo" | "winter-sheetlahar">("all");
  const [isBuzzerActive, setIsBuzzerActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(getAudioMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPulseEnabled, setIsPulseEnabled] = useState<boolean>(true);
  const [buzzerBadgeText, setBuzzerBadgeText] = useState<string>("Buzzer Ready");
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to sound events for visual pulsing
  useEffect(() => {
    const unsubscribe = subscribeAlertSound((isPlaying, type) => {
      setIsBuzzerActive(isPlaying);
      if (isPlaying) {
        setBuzzerBadgeText(`🚨 ALERT BUZZER SOUNDING (${type.toUpperCase()})`);
      } else {
        setBuzzerBadgeText("Buzzer Standby");
      }
    });
    return unsubscribe;
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Central/Eastern India to encompass both coastal corridors and north plains
      const map = L.map(mapContainerRef.current, {
        center: [19.5, 80.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Dark theme map for high-contrast red alert visualization
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd"
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Play buzzer helper
  const handleSoundBuzzer = (type: "cyclone" | "monsoon" | "loo" | "winter" = "cyclone") => {
    playOneAlertBuzzer(type);
  };

  const handleToggleMute = () => {
    const next = toggleAudioMuted();
    setIsMuted(next);
  };

  // Render Red High Surrounded Alert Zones and Cyclone Vector Overlays
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const showBob = selectedThreatFilter === "all" || selectedThreatFilter === "cyclone-bob";
    const showAs = selectedThreatFilter === "all" || selectedThreatFilter === "cyclone-as";
    const showLoo = selectedThreatFilter === "all" || selectedThreatFilter === "summer-loo";
    const showWinter = selectedThreatFilter === "all" || selectedThreatFilter === "winter-sheetlahar";

    // 1. Bay of Bengal Coastal Corridor (RED HIGH SURROUNDED AREA ALERT)
    if (showBob) {
      const bobPolygon = L.polygon(BAY_OF_BENGAL_COASTAL_ALERT_ZONE, {
        color: "#ef4444", // Bright red
        weight: 3,
        opacity: 0.95,
        fillColor: "#dc2626",
        fillOpacity: 0.32,
        dashArray: "6, 8",
        className: isPulseEnabled ? "pulse-red-alert-zone leaflet-red-alert-zone" : ""
      });

      bobPolygon.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px; max-width: 260px;">
          <div style="background: #ef4444; color: white; font-weight: 800; font-size: 11px; padding: 3px 6px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
            🚨 IMD RED ALERT: HIGH-RISK SURROUNDED ZONE
          </div>
          <strong style="font-size: 14px; color: #b91c1c; display: block;">Bay of Bengal Coastal Threat Corridor</strong>
          <p style="margin: 4px 0; color: #334155; font-size: 12px; line-height: 1.4;">
            <strong>Covering:</strong> Odisha (Puri/Paradip), Andhra Coast (Vizag/Machilipatnam), Tamil Nadu (Chennai), West Bengal (Sundarbans).
          </p>
          <div style="margin: 6px 0; font-size: 11px; background: #fee2e2; border-left: 3px solid #dc2626; padding: 4px 6px;">
            ⚠️ <strong>1-Week Advance Notice:</strong> Severe cyclonic vortex formation & extreme storm surge (3.5 - 5.0m). Complete fishermen return ordered.
          </div>
        </div>
      `);

      bobPolygon.on("click", () => {
        handleSoundBuzzer("cyclone");
      });

      layerGroup.addLayer(bobPolygon);

      // Add prominent red danger perimeter buffer around East Coast
      const bobPolyline = L.polyline(BAY_OF_BENGAL_COASTAL_ALERT_ZONE.slice(0, 16), {
        color: "#ff0000",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        className: isPulseEnabled ? "pulse-red-danger-line" : ""
      });
      layerGroup.addLayer(bobPolyline);

      // High-Visibility Pulsing Radar Wave Epicenter Badge for Bay of Bengal
      if (isPulseEnabled) {
        const bobPulseIcon = L.divIcon({
          className: "coastal-pulse-epicenter-marker",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group" style="width: 120px; height: 120px;">
              <div class="radar-pulse-ring" style="width: 65px; height: 65px;"></div>
              <div class="radar-pulse-ring radar-pulse-ring-delayed" style="width: 65px; height: 65px;"></div>
              <div class="relative z-10 px-2.5 py-1 rounded-full bg-red-600 text-white text-[9px] font-black tracking-wider uppercase border-2 border-red-200 shadow-2xl flex items-center space-x-1 whitespace-nowrap animate-bounce">
                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>🚨 RED DANGER ZONE</span>
              </div>
            </div>
          `,
          iconSize: [120, 120],
          iconAnchor: [60, 60]
        });

        const bobPulseMarker = L.marker([18.5, 85.2], { icon: bobPulseIcon });
        bobPulseMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
            <div style="background: #dc2626; color: white; padding: 2px 6px; font-weight: 800; border-radius: 4px; display: inline-block;">
              🚨 HIGH-RISK SURROUNDED RED ALERT
            </div>
            <div style="font-weight: bold; font-size: 13px; margin-top: 4px; color: #991b1b;">
              Bay of Bengal Cyclone & Surge Danger Corridor
            </div>
            <p style="margin: 4px 0; color: #475569;">
              Pulse animation active: immediate emergency evacuation / storm readiness for coastal districts.
            </p>
          </div>
        `);
        bobPulseMarker.on("click", () => handleSoundBuzzer("cyclone"));
        layerGroup.addLayer(bobPulseMarker);
      }
    }

    // 2. Arabian Sea Coastal Corridor (RED HIGH SURROUNDED AREA ALERT)
    if (showAs) {
      const asPolygon = L.polygon(ARABIAN_SEA_COASTAL_ALERT_ZONE, {
        color: "#f43f5e", // Rose-red
        weight: 3,
        opacity: 0.95,
        fillColor: "#e11d48",
        fillOpacity: 0.28,
        dashArray: "6, 8",
        className: isPulseEnabled ? "pulse-red-alert-zone leaflet-red-alert-zone" : ""
      });

      asPolygon.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px; max-width: 260px;">
          <div style="background: #e11d48; color: white; font-weight: 800; font-size: 11px; padding: 3px 6px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
            🚨 IMD RED ALERT: HIGH-RISK SURROUNDED ZONE
          </div>
          <strong style="font-size: 14px; color: #9f1239; display: block;">Arabian Sea Coastal Threat Corridor</strong>
          <p style="margin: 4px 0; color: #334155; font-size: 12px; line-height: 1.4;">
            <strong>Covering:</strong> Gujarat (Kutch/Saurashtra/Dwarka), Maharashtra (Mumbai/Konkan), Goa, Karnataka & Kerala Coasts.
          </p>
          <div style="margin: 6px 0; font-size: 11px; background: #ffe4e6; border-left: 3px solid #e11d48; padding: 4px 6px;">
            ⚠️ <strong>Advance Threat Notice:</strong> Severe monsoonal depression / Arabian Sea cyclone surge. High tidal ingress & wind gusts > 120 km/h.
          </div>
        </div>
      `);

      // Arabian Sea alert polygon (buzzer sound removed on Arabian sea side)
      layerGroup.addLayer(asPolygon);

      // Arabian Sea Red Coastline Line
      const asPolyline = L.polyline(ARABIAN_SEA_COASTAL_ALERT_ZONE.slice(0, 18), {
        color: "#f43f5e",
        weight: 5,
        opacity: 0.85,
        className: isPulseEnabled ? "pulse-red-danger-line" : ""
      });
      layerGroup.addLayer(asPolyline);

      // High-Visibility Pulsing Radar Wave Epicenter Badge for Arabian Sea
      if (isPulseEnabled) {
        const asPulseIcon = L.divIcon({
          className: "coastal-pulse-epicenter-marker",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group" style="width: 120px; height: 120px;">
              <div class="radar-pulse-ring" style="width: 65px; height: 65px;"></div>
              <div class="radar-pulse-ring radar-pulse-ring-delayed" style="width: 65px; height: 65px;"></div>
              <div class="relative z-10 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-wider uppercase border-2 border-rose-200 shadow-2xl flex items-center space-x-1 whitespace-nowrap animate-bounce">
                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>🚨 RED DANGER ZONE</span>
              </div>
            </div>
          `,
          iconSize: [120, 120],
          iconAnchor: [60, 60]
        });

        const asPulseMarker = L.marker([18.8, 71.8], { icon: asPulseIcon });
        asPulseMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
            <div style="background: #e11d48; color: white; padding: 2px 6px; font-weight: 800; border-radius: 4px; display: inline-block;">
              🚨 HIGH-RISK SURROUNDED RED ALERT
            </div>
            <div style="font-weight: bold; font-size: 13px; margin-top: 4px; color: #9f1239;">
              Arabian Sea Gale & Surge Danger Corridor
            </div>
            <p style="margin: 4px 0; color: #475569;">
              Pulse animation active: offshore gale advisories and port warning signals raised.
            </p>
          </div>
        `);
        layerGroup.addLayer(asPulseMarker);
      }
    }

    // 3. Summer "Loo" Scorching Heat Winds Alert Zone (Red Warning Zone)
    if (showLoo) {
      const looPolygon = L.polygon(SUMMER_LOO_HEAT_WIND_ZONE, {
        color: "#f59e0b",
        weight: 2.5,
        opacity: 0.95,
        fillColor: "#ea580c",
        fillOpacity: 0.28,
        dashArray: "5, 5",
        className: isPulseEnabled ? "pulse-amber-alert-zone" : ""
      });

      looPolygon.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px; max-width: 260px;">
          <div style="background: #ea580c; color: white; font-weight: 800; font-size: 11px; padding: 3px 6px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
            ☀️ SUMMER SCORCHING "LOO" RED ZONE
          </div>
          <strong style="font-size: 14px; color: #c2410c; display: block;">North-Western Heat Gale Corridor</strong>
          <p style="margin: 4px 0; color: #334155; font-size: 12px; line-height: 1.4;">
            <strong>Covering:</strong> Rajasthan, Delhi NCR, Haryana, Punjab, Western Uttar Pradesh.
          </p>
          <div style="margin: 6px 0; font-size: 11px; background: #ffedd5; border-left: 3px solid #ea580c; padding: 4px 6px;">
            🔥 <strong>Severe Hazard:</strong> Surface temps 42°C – 47°C combined with 35–45 km/h desiccating westerly winds. Acute heatstroke danger.
          </div>
        </div>
      `);

      // Summer Loo alert polygon (summer alert sound removed)
      layerGroup.addLayer(looPolygon);
    }

    // 4. Winter "Sheet Lahar" Cold Wave Gale Zone (Cyan / Red Frost Alert)
    if (showWinter) {
      const winterPolygon = L.polygon(WINTER_SHEET_LAHAR_ZONE, {
        color: "#06b6d4",
        weight: 2.5,
        opacity: 0.95,
        fillColor: "#0284c7",
        fillOpacity: 0.28,
        dashArray: "5, 5",
        className: isPulseEnabled ? "pulse-cyan-alert-zone" : ""
      });

      winterPolygon.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px; max-width: 260px;">
          <div style="background: #0284c7; color: white; font-weight: 800; font-size: 11px; padding: 3px 6px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
            ❄️ WINTER "SHEET LAHAR" RED ALERT
          </div>
          <strong style="font-size: 14px; color: #0369a1; display: block;">Northern Himalayan Cold Surge Corridor</strong>
          <p style="margin: 4px 0; color: #334155; font-size: 12px; line-height: 1.4;">
            <strong>Covering:</strong> Punjab, Haryana, Delhi NCR, Northern UP foothills.
          </p>
          <div style="margin: 6px 0; font-size: 11px; background: #e0f2fe; border-left: 3px solid #0284c7; padding: 4px 6px;">
            🥶 <strong>Cold Wave Gale:</strong> Temperatures plunging to 3°C – 5°C with 30 km/h wind chill factor. Severe frost risk for mustard/wheat crops.
          </div>
        </div>
      `);

      // Winter Sheet Lahar alert polygon (winter alert sound removed)
      layerGroup.addLayer(winterPolygon);
    }

    // 5. Render 7-Day Cyclone Advance Trajectory Track (when BoB is active)
    if (showBob) {
      const trackCoords = CYCLONE_7DAY_PROJECTED_TRACK.map(p => [p.lat, p.lng] as [number, number]);
      
      // Projected path line
      const trackLine = L.polyline(trackCoords, {
        color: "#ef4444",
        weight: 4,
        dashArray: "8, 6",
        opacity: 0.9
      });
      layerGroup.addLayer(trackLine);

      // Add checkpoints along the 7-day track
      CYCLONE_7DAY_PROJECTED_TRACK.forEach((point, i) => {
        const isLandfall = i === CYCLONE_7DAY_PROJECTED_TRACK.length - 1;
        const isSevenDaysOut = i === 0;

        const checkpointIcon = L.divIcon({
          className: "custom-track-node",
          html: `<div class="relative flex items-center justify-center">
                  <div class="w-${isLandfall ? "7" : "5"} h-${isLandfall ? "7" : "5"} rounded-full ${isLandfall ? "bg-red-600 animate-ping" : "bg-rose-500"} opacity-75 absolute"></div>
                  <div class="w-${isLandfall ? "6" : "4"} h-${isLandfall ? "6" : "4"} rounded-full ${isLandfall ? "bg-red-700 border-2 border-white" : "bg-rose-600 border border-white"} shadow-lg flex items-center justify-center text-[9px] font-black text-white">
                    ${isLandfall ? "⚠️" : i}
                  </div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([point.lat, point.lng], { icon: checkpointIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
            <span style="background: #dc2626; color: white; padding: 2px 5px; border-radius: 3px; font-weight: 700; font-size: 10px;">
              ${point.day}
            </span>
            <div style="font-weight: 800; font-size: 13px; margin-top: 4px; color: #991b1b;">
              ${point.type}
            </div>
            <div style="margin-top: 2px; color: #475569;">
              Sustained Winds: <strong>${point.wind}</strong>
            </div>
            ${isSevenDaysOut ? '<div style="color: #6b21a8; font-weight: 700; font-size: 11px; margin-top: 3px;">⚡ 1-WEEK EARLY ADVANCE TRACKING</div>' : ""}
          </div>
        `);

        marker.on("click", () => {
          handleSoundBuzzer("cyclone");
        });

        layerGroup.addLayer(marker);
      });

      // Cyclone Vortex Center Ring in Bay of Bengal
      const cycloneCenter = CYCLONE_7DAY_PROJECTED_TRACK[3];
      const vortexRadiusCircle = L.circle([cycloneCenter.lat, cycloneCenter.lng], {
        radius: 120000, // 120km radius of maximum winds
        color: "#dc2626",
        fillColor: "#ef4444",
        fillOpacity: 0.2,
        weight: 2,
        dashArray: "4, 6",
        className: isPulseEnabled ? "pulse-red-vortex-ring" : ""
      });
      layerGroup.addLayer(vortexRadiusCircle);

      const eyeIcon = L.divIcon({
        className: "cyclone-eye-icon",
        html: `<div class="flex items-center justify-center">
                <div class="w-10 h-10 rounded-full border-4 border-dashed border-red-500 animate-spin bg-red-950/70 flex items-center justify-center text-red-400 shadow-2xl">
                  🌀
                </div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const eyeMarker = L.marker([cycloneCenter.lat, cycloneCenter.lng], { icon: eyeIcon });
      eyeMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
          <div style="background: #b91c1c; color: white; padding: 2px 6px; font-weight: 800; border-radius: 4px; display: inline-block;">
            CYCLONE VORTEX EYE
          </div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">Projected Very Severe Cyclonic Storm</div>
          <div>Pressure: <strong>968 hPa</strong> | Core Winds: <strong>145 km/h</strong></div>
          <div style="color: #dc2626; font-weight: 600; margin-top: 3px;">Approaching Odisha / AP Coastline</div>
        </div>
      `);
      eyeMarker.on("click", () => {
        handleSoundBuzzer("cyclone");
      });
      layerGroup.addLayer(eyeMarker);
    }

    // 6. Coastal Radar & Meteorological Hub Markers
    INDIA_CYCLONE_MONSOON_HUBS.forEach((hub) => {
      const isSelected = Math.abs(hub.latitude - currentLocation.latitude) < 0.05 && 
                        Math.abs(hub.longitude - currentLocation.longitude) < 0.05;

      const hubIcon = L.divIcon({
        className: "coastal-hub-marker",
        html: `<div class="relative flex items-center justify-center group cursor-pointer">
                <div class="w-4 h-4 rounded-full ${isSelected ? "bg-amber-400" : "bg-red-500"} animate-ping absolute opacity-80"></div>
                <div class="w-3.5 h-3.5 rounded-full ${isSelected ? "bg-amber-500 ring-2 ring-white" : "bg-red-600 border border-white"} shadow-lg"></div>
                <div class="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 text-white text-[10px] font-bold border border-slate-700 pointer-events-none shadow-md">
                  ${hub.name}
                </div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const hubMarker = L.marker([hub.latitude, hub.longitude], { icon: hubIcon });
      hubMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 2px;">
          <strong style="font-size: 13px; color: #1e293b;">${hub.name} (${hub.admin1})</strong><br/>
          <span style="color: #dc2626; font-weight: bold; font-size: 11px;">IMD Coastal Red Alert Monitoring Station</span>
          <div style="margin-top: 4px;">
            Coordinates: ${hub.latitude.toFixed(2)}°N, ${hub.longitude.toFixed(2)}°E<br/>
            Early Warning Status: <strong style="color: #b91c1c;">Active Scanner Ready</strong>
          </div>
        </div>
      `);

      hubMarker.on("click", () => {
        onSelectLocation(hub);
      });

      layerGroup.addLayer(hubMarker);
    });

  }, [selectedThreatFilter, currentLocation, isPulseEnabled]);

  // Recenter to all-India coastal view
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([19.5, 80.5], 5, { animate: true });
    }
  };

  // Zoom to specific region
  const handleZoomRegion = (region: "all" | "cyclone-bob" | "cyclone-as" | "summer-loo" | "winter-sheetlahar") => {
    setSelectedThreatFilter(region);
    if (!mapInstanceRef.current) return;

    if (region === "cyclone-bob") {
      mapInstanceRef.current.setView([17.5, 84.5], 6, { animate: true });
      handleSoundBuzzer("cyclone");
    } else if (region === "cyclone-as") {
      mapInstanceRef.current.setView([17.0, 73.0], 6, { animate: true });
      // Arabian Sea buzzer horn sound removed
    } else if (region === "summer-loo") {
      mapInstanceRef.current.setView([27.5, 75.5], 6, { animate: true });
      // Summer alert sound removed
    } else if (region === "winter-sheetlahar") {
      mapInstanceRef.current.setView([29.5, 77.0], 6, { animate: true });
      // Winter alert sound removed
    } else {
      mapInstanceRef.current.setView([19.5, 80.5], 5, { animate: true });
      handleSoundBuzzer("cyclone");
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      id="india-coastal-alert-map-container"
      className={`relative rounded-2xl bg-slate-900 border-2 border-red-500/80 shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen ? "h-screen rounded-none" : "h-[540px] sm:h-[600px]"
      }`}
    >
      {/* 1. Top Header & Real-Time Alert Banner with Buzzer */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Threat Level Badge */}
        <div className="pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-red-500/80 backdrop-blur-md text-white text-xs shadow-xl shadow-red-950/50">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="font-black tracking-wide text-red-400 uppercase">
            RED HIGH SURROUNDED AREA ALERT
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-semibold hidden sm:inline">Coastal Threat Corridor</span>
          <span className="px-2 py-0.5 rounded bg-purple-950/90 text-purple-300 border border-purple-700/60 font-bold text-[10px]">
            ⚡ 1-WEEK ADVANCE SCANNER
          </span>
        </div>

        {/* Action Buttons: Sound Buzzer, Pulse Animation & Fullscreen */}
        <div className="pointer-events-auto flex items-center space-x-2">
          
          {/* Pulse Animation Toggle */}
          <button
            id="toggle-pulse-animation-button"
            onClick={() => setIsPulseEnabled(!isPulseEnabled)}
            className={`px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-xs font-bold transition flex items-center space-x-1.5 shadow-lg ${
              isPulseEnabled
                ? "bg-red-950/90 text-red-200 border-red-500 shadow-red-950/60 ring-1 ring-red-500/60"
                : "bg-slate-950/80 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title={isPulseEnabled ? "Pulse Animation Active (Click to pause)" : "Pulse Animation Inactive (Click to activate)"}
          >
            <Activity className={`w-3.5 h-3.5 ${isPulseEnabled ? "text-red-400 animate-pulse" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Pulse:</span>
            <span className={isPulseEnabled ? "text-red-300 font-extrabold" : "text-slate-400"}>
              {isPulseEnabled ? "ON" : "OFF"}
            </span>
          </button>

          {/* Real-time Buzzer Button (Active for Bay of Bengal; removed for Arabian Sea, Summer & Winter) */}
          <button
            id="trigger-alert-buzzer-button"
            disabled={selectedThreatFilter === "cyclone-as" || selectedThreatFilter === "summer-loo" || selectedThreatFilter === "winter-sheetlahar"}
            onClick={() => {
              if (selectedThreatFilter === "cyclone-as" || selectedThreatFilter === "summer-loo" || selectedThreatFilter === "winter-sheetlahar") {
                return;
              }
              handleSoundBuzzer("cyclone");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider transition flex items-center space-x-1.5 shadow-lg border ${
              selectedThreatFilter === "cyclone-as" || selectedThreatFilter === "summer-loo" || selectedThreatFilter === "winter-sheetlahar"
                ? "bg-slate-900/80 text-slate-500 border-slate-800 cursor-not-allowed"
                : isBuzzerActive 
                  ? "bg-red-600 text-white border-red-400 animate-bounce shadow-red-500/60" 
                  : "bg-red-950/80 hover:bg-red-800 text-red-200 border-red-700/80 hover:text-white"
            }`}
            title={
              selectedThreatFilter === "cyclone-as"
                ? "Buzzer horn sound removed for Arabian Sea side"
                : selectedThreatFilter === "summer-loo" || selectedThreatFilter === "winter-sheetlahar"
                ? "Alert sound removed for summer and winter seasons"
                : "Sound One-Time Emergency Buzzer / Beep Alert"
            }
          >
            <Volume2 className={`w-4 h-4 ${isBuzzerActive ? "animate-spin text-yellow-300" : selectedThreatFilter === "cyclone-as" || selectedThreatFilter === "summer-loo" || selectedThreatFilter === "winter-sheetlahar" ? "text-slate-500" : "text-red-400"}`} />
            <span>
              {selectedThreatFilter === "cyclone-as"
                ? "ARABIAN SEA SOUND OFF"
                : selectedThreatFilter === "summer-loo" || selectedThreatFilter === "winter-sheetlahar"
                ? "SEASON SOUND OFF"
                : isBuzzerActive ? "🚨 BUZZER SOUNDING!" : "🔊 PLAY ALERT BUZZER"}
            </span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            id="toggle-buzzer-mute-button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border backdrop-blur-md transition shadow-lg ${
              isMuted
                ? "bg-slate-900/90 text-slate-500 border-slate-700 hover:text-slate-300"
                : "bg-slate-950/90 text-red-400 border-slate-700 hover:bg-slate-800"
            }`}
            title={isMuted ? "Unmute Alert Buzzer" : "Mute Alert Buzzer"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Recenter Map */}
          <button
            onClick={handleRecenter}
            className="p-2 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-slate-300 hover:text-white transition shadow-lg"
            title="Recenter All India Coastal View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-slate-300 hover:text-white transition shadow-lg"
            title="Toggle Fullscreen Map"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* 3. Bottom Layer / Region Selector Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        
        {/* Filter Zones */}
        <div className="pointer-events-auto flex items-center space-x-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-xl bg-slate-950/95 border border-slate-800 backdrop-blur-md shadow-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 hidden md:inline">
            Focus Threat:
          </span>
          <button
            onClick={() => handleZoomRegion("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedThreatFilter === "all"
                ? "bg-red-600 text-white shadow-md shadow-red-600/40"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            All Coastal Red Zones
          </button>
          <button
            onClick={() => handleZoomRegion("cyclone-bob")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1 ${
              selectedThreatFilter === "cyclone-bob"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/40"
                : "text-rose-300 hover:bg-slate-800"
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Bay of Bengal (East Coast)</span>
          </button>
          <button
            onClick={() => handleZoomRegion("cyclone-as")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1 ${
              selectedThreatFilter === "cyclone-as"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                : "text-blue-300 hover:bg-slate-800"
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>Arabian Sea (West Coast)</span>
          </button>
          <button
            onClick={() => handleZoomRegion("summer-loo")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1 ${
              selectedThreatFilter === "summer-loo"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/40"
                : "text-amber-300 hover:bg-slate-800"
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Summer "Loo" Heat Winds</span>
          </button>
          <button
            onClick={() => handleZoomRegion("winter-sheetlahar")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center space-x-1 ${
              selectedThreatFilter === "winter-sheetlahar"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/40"
                : "text-cyan-300 hover:bg-slate-800"
            }`}
          >
            <Snowflake className="w-3 h-3" />
            <span>Winter "Sheet Lahar" Cold Winds</span>
          </button>
        </div>

        {/* Legend Indicator */}
        <div className="pointer-events-auto self-start sm:self-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 shadow-xl">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-red-400 ${isPulseEnabled ? "animate-ping opacity-75" : "opacity-0"}`}></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
            </span>
            <span className="font-bold text-red-400">Pulsing High-Risk Area</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-0.5 bg-red-500 border-t border-dashed"></span>
            <span className="text-slate-400">7-Day Projected Track</span>
          </div>
        </div>

      </div>

    </div>
  );
};
