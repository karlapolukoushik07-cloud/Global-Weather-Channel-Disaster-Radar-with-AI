const fs = require('fs');
let code = fs.readFileSync('src/services/weatherService.ts', 'utf8');

const regex = /export function deriveWeatherAlerts\([\s\S]*?\)\: WeatherAlert\[\] \{[\s\S]*?const alerts\: WeatherAlert\[\] \= \[\]\;[\s\S]*?const locName \= location\.name;/;

const newAlertLogic = `export function deriveWeatherAlerts(
  current: CurrentWeather,
  daily: DailyForecastItem[],
  hourly: HourlyForecastItem[],
  airQuality: AirQualityData | undefined,
  location: GeoLocation
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const locName = location.name;

  // New Advanced Forecast-based Threat Detections (up to 7-14 days out)
  const daysAhead = Math.min(14, daily.length);
  for (let d = 0; d < daysAhead; d++) {
    const day = daily[d];
    const isFuture = d > 0;
    const dayStr = isFuture ? \`on \${day.fullDate}\` : "Today";
    
    // Cyclones / Hurricane Threat Detection: Sustained wind > 90km/h or Gusts > 118km/h with heavy rain
    if ((day.windSpeedMax >= 90 || day.windGustsMax >= 118) && day.precipitationSum >= 30) {
       alerts.push({
         id: \`alert-cyclone-threat-\${d}-\${Date.now()}\`,
         title: "CYCLONE / HURRICANE THREAT",
         severity: "emergency",
         category: "wind",
         headline: \`Major Cyclone/Hurricane Threat detected \${dayStr} for \${locName}\`,
         description: \`Models indicate extreme cyclonic conditions \${dayStr}. Maximum winds projected at \${day.windSpeedMax} km/h with destructive gusts up to \${day.windGustsMax} km/h and torrential rainfall (\${day.precipitationSum}mm).\`,
         instruction: \`Immediate action required. Secure property, prepare emergency kits with food/water, and monitor official evacuation orders closely. Do not wait until the last minute.\`,
         effectiveTime: \`Active Threat Alert (\${dayAhead(d)} Days Out)\`,
         expiresTime: day.fullDate,
         source: "Advanced Predictive Threat System"
       });
    }

    // Heavy Rainfall Threat (Advanced warning)
    if (day.precipitationSum >= 100) {
       alerts.push({
         id: \`alert-heavy-rain-\${d}-\${Date.now()}\`,
         title: "EXTREME HEAVY RAINFALL",
         severity: "warning",
         category: "flood",
         headline: \`Severe Rainfall (\${day.precipitationSum}mm) projected \${dayStr}\`,
         description: \`Catastrophic rainfall amounts of \${day.precipitationSum}mm are expected \${dayStr}. This is highly likely to cause widespread flash flooding, river flooding, and landslides in susceptible areas.\`,
         instruction: \`Prepare for potential flooding. Move vehicles to higher ground. Do not attempt to cross flooded roadways.\`,
         effectiveTime: \`Early Warning (\${dayAhead(d)} Days Out)\`,
         expiresTime: day.fullDate,
         source: "Advanced Predictive Threat System"
       });
    }

    // Heavy Heat Winds in Summer (High Temp + High Wind)
    if (day.tempMax >= 38 && day.windSpeedMax >= 40) {
       alerts.push({
         id: \`alert-heat-wind-\${d}-\${Date.now()}\`,
         title: "HEAVY HEAT WINDS / SCORCHING GALE",
         severity: "warning",
         category: "heat",
         headline: \`Dangerous Heat Winds projected \${dayStr} in \${locName}\`,
         description: \`A dangerous combination of extreme heat (\${day.tempMax}°C) and strong winds (\${day.windSpeedMax} km/h) is forecast \${dayStr}. This creates extreme fire danger and rapid dehydration risks.\`,
         instruction: \`Avoid all outdoor burning. Stay indoors in air conditioning if possible. Ensure pets and livestock have abundant water and shade.\`,
         effectiveTime: \`Advanced Advisory (\${dayAhead(d)} Days Out)\`,
         expiresTime: day.fullDate,
         source: "Seasonal Climate Monitor"
       });
    }

    // Cold Winds in Winter (Low Temp + High Wind)
    if (day.tempMin <= 0 && day.windSpeedMax >= 40) {
       const windChill = day.tempMin - (day.windSpeedMax * 0.2); // Rough approx
       alerts.push({
         id: \`alert-cold-wind-\${d}-\${Date.now()}\`,
         title: "BITTER COLD WINDS / BLIZZARD CONDITIONS",
         severity: "warning",
         category: "winter",
         headline: \`Severe Cold Winds projected \${dayStr}\`,
         description: \`Freezing temperatures (\${day.tempMin}°C) combined with high winds (\${day.windSpeedMax} km/h) will produce dangerous wind chills \${dayStr}. Frostbite can occur rapidly on exposed skin.\`,
         instruction: \`Limit outdoor exposure. If you must go outside, wear layers, a hat, and gloves. Keep emergency winter supplies in your vehicle.\`,
         effectiveTime: \`Advanced Advisory (\${dayAhead(d)} Days Out)\`,
         expiresTime: day.fullDate,
         source: "Seasonal Climate Monitor"
       });
    }
  }

  function dayAhead(daysOut: number) {
    return daysOut === 0 ? "Today" : daysOut;
  }
`;

code = code.replace(regex, newAlertLogic);
fs.writeFileSync('src/services/weatherService.ts', code);
