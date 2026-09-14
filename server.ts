import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Meteorologist Briefing
  app.post("/api/ai-briefing", async (req, res) => {
    try {
      const { location, current, daily, alerts } = req.body || {};
      
      const ai = getAIClient();
      if (!ai) {
        // High quality programmatic fallback briefing if API key is not configured yet
        const temp = current?.temperature ?? 22;
        const condition = current?.weatherDescription ?? "Clear sky";
        const wind = current?.windSpeed ?? 12;
        const rainChance = daily?.[0]?.precipitationProbability ?? 10;
        
        return res.json({
          briefing: `Today in ${location?.name || "your area"}, expect ${condition.toLowerCase()} conditions with temperatures reaching around ${daily?.[0]?.tempMax ?? temp}° and gentle to moderate breezes around ${wind} km/h. Precipitation risk is currently at ${rainChance}%. ${alerts && alerts.length > 0 ? "⚠️ Active weather alerts require attention today." : "Optimal conditions for outdoor activities during peak daylight."}`,
          recommendations: [
            rainChance > 40 ? "Keep an umbrella handy for intermittent showers" : "Great conditions for outdoor activities and commuting",
            temp > 28 ? "Wear light breathable clothing and stay hydrated" : temp < 10 ? "Layer up with a warm insulated coat" : "Comfortable mild weather wear recommended",
            alerts && alerts.length > 0 ? "Review active meteorological advisories below" : "No hazardous weather impacts anticipated today"
           
          ],
          source: "meteorological-engine"
        });
      }

      const prompt = `You are a chief on-air meteorologist for The Weather Channel.
Provide a concise, professional, engaging 2-to-3 sentence weather briefing and 3 practical bullet recommendations (clothing, outdoor activities, travel/safety) based on the following real-time data:

Location: ${location?.name}, ${location?.country || ""}
Current Condition: ${current?.weatherDescription}
Temperature: ${current?.temperature}°C (Feels like: ${current?.apparentTemperature}°C)
Humidity: ${current?.humidity}%
Wind Speed: ${current?.windSpeed} km/h (Gusts: ${current?.windGusts || 0} km/h)
UV Index: ${current?.uvIndex}
Today's Forecast: High ${daily?.[0]?.tempMax}°C / Low ${daily?.[0]?.tempMin}°C
Precipitation Probability: ${daily?.[0]?.precipitationProbability}%
Active Alerts: ${alerts && alerts.length > 0 ? alerts.map((a: any) => a.title + " (" + a.severity + ")").join("; ") : "None"}

Respond strictly in JSON format with this structure:
{
  "briefing": "Professional 2-3 sentence meteorologist report...",
  "recommendations": [
    "Practical recommendation 1...",
    "Practical recommendation 2...",
    "Practical recommendation 3..."
  ]
}`;

      let responseText = "{}";
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
          responseText = response.text || "{}";
          break;
        } catch (err: any) {
          retries--;
          const is503 = err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
          if (retries === 0 || !is503) {
            throw err;
          }
          // wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      const parsed = JSON.parse(responseText);
      return res.json({
        briefing: parsed.briefing || "Mild weather conditions present across the region.",
        recommendations: parsed.recommendations || [
          "Check hourly forecast before heading out",
          "Dress appropriately for current temperature swings"
         
        ],
        source: "gemini-3.8-flash"
      });
    } catch (err: any) {
      const status = err?.status || "Unknown";
      console.warn(`AI briefing fallback triggered (Status: ${status}). Using local meteorological rules.`);
      return res.json({
        briefing: "Current meteorological patterns show stable atmospheric conditions over the region. Monitor local hourly shifts for subtle changes in wind and moisture.",
        recommendations: [
          "Stay hydrated and monitor UV levels during midday",
          "Layer garments for evening temperature adjustments"
         
        ],
        source: "meteorological-fallback"
      });
    }
  });

  // AI Event Scout
  app.post("/api/plan-event", async (req, res) => {
    try {
      const { title, date, locationStr, dailyForecast } = req.body || {};
      
      const ai = getAIClient();
      if (!ai) {
        return res.json({
          locationName: locationStr,
          advice: `Weather data for ${locationStr} on ${date} suggests normal planning. Keep an eye out for extreme shifts closer to the date.`,
          hasRisk: false
        });
      }

      // Find forecast if available
      const forecastForDate = Array.isArray(dailyForecast) 
        ? dailyForecast.find(d => d.date === date) 
        : null;
        
      let weatherContext = "Forecast currently out of range.";
      if (forecastForDate) {
        weatherContext = `High ${forecastForDate.tempMax}°C / Low ${forecastForDate.tempMin}°C, ${forecastForDate.precipitationProbability}% chance of rain. Description: ${forecastForDate.weatherDescription}. Max Wind Speed: ${forecastForDate.windSpeedMax} km/h.`;
      }

      const prompt = `The user is planning an event titled "${title}" on ${date} at the location "${locationStr}". 
Based on our local 16-day forecast model for this area, the weather context is: ${weatherContext}.

Use the googleMaps tool to verify the general context of the location (e.g., is it coastal, indoors, a park?). 

Then, provide a short 2-3 sentence advisory focusing specifically on the risks of rainfall and cyclones/storms (high winds) for this event. 

Respond strictly in JSON format with this structure:
{
  "locationName": "Formatted or corrected location name based on search",
  "latitude": 0.0,
  "longitude": 0.0,
  "advice": "Your short 2-3 sentence advice...",
  "hasRisk": true/false (true if rain probability is >30%, wind speed > 50km/h, or cyclone risk exists based on the area)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        locationName: parsed.locationName || locationStr,
        latitude: parsed.latitude || null,
        longitude: parsed.longitude || null,
        advice: parsed.advice || "Keep an eye on the local forecast as the date approaches.",
        hasRisk: parsed.hasRisk || false
      });
      
    } catch (err: any) {
      console.warn("AI event scout fallback triggered:", err?.message || err);
      return res.json({
        locationName: req.body?.locationStr,
        advice: "Local weather monitoring is advised as your event approaches. Stay alert for any sudden changes.",
        hasRisk: false
      });
    }
  });

  // AI Date Suggester
  app.post("/api/suggest-dates", async (req, res) => {
    try {
      const { eventType, locationStr, dailyForecast } = req.body || {};
      
      const ai = getAIClient();
      if (!ai) {
        return res.json({
          suggestion: "Please check the 16-day forecast below to manually find the best dates."
        });
      }

      let forecastContext = "Forecast data unavailable.";
      if (Array.isArray(dailyForecast) && dailyForecast.length > 0) {
        forecastContext = dailyForecast.map(d => 
          `Date: ${d.date}, High: ${d.tempMax}°C, Low: ${d.tempMin}°C, Rain Prob: ${d.precipitationProbability}%, Wind: ${d.windSpeedMax} km/h, Weather: ${d.weatherDescription}`
        ).join("\\n");
      }

      const prompt = `The user wants to plan an event of type: "${eventType}" near the location "${locationStr}".
Here is the local 16-day forecast:
${forecastContext}

Based on this forecast and the ideal climatic conditions for a "${eventType}", suggest the top 2 best upcoming dates to hold this event. 
Explain your reasoning briefly, focusing on rainfall avoidance, safe wind levels, and comfortable temperatures. Keep it under 4 sentences.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      return res.json({
        suggestion: response.text || "No suggestions generated."
      });
      
    } catch (err: any) {
      console.warn("AI date suggestion failed:", err?.message || err);
      return res.json({
        suggestion: "We couldn't generate AI suggestions right now. Please review the 16-day forecast manually."
      });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Weather Channel Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
