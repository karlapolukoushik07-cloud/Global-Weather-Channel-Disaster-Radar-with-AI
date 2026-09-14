import React from "react";
import { HistoricalData, UnitSystem } from "../types/weather";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from "recharts";
import { History, ThermometerSun, Droplets } from "lucide-react";

interface HistoricalTrendsProps {
  historicalData?: HistoricalData[];
  unit: UnitSystem;
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ historicalData, unit }) => {
  if (!historicalData || historicalData.length === 0) return null;

  const data = historicalData.map(d => ({
    ...d,
    tempMax: unit === "imperial" ? Math.round(d.tempMax * 9/5 + 32) : d.tempMax,
    tempMin: unit === "imperial" ? Math.round(d.tempMin * 9/5 + 32) : d.tempMin,
    precipitationSum: unit === "imperial" ? Number((d.precipitationSum / 25.4).toFixed(2)) : d.precipitationSum,
    // Add an average temp for the tooltip
    avgTemp: Math.round(((unit === "imperial" ? (d.tempMax * 9/5 + 32) : d.tempMax) + 
                         (unit === "imperial" ? (d.tempMin * 9/5 + 32) : d.tempMin)) / 2)
  }));

  const tempSymbol = unit === "imperial" ? "°F" : "°C";
  const precipSymbol = unit === "imperial" ? "in" : "mm";

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">7-Day Climate Trends</h3>
          <p className="text-sm text-slate-500">
            Historical temperature and precipitation analysis
          </p>
        </div>
      </div>
      
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Temperature Trend */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-600 font-semibold mb-2">
              <ThermometerSun className="w-5 h-5 text-orange-500" />
              <h4>Temperature Variance</h4>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="dayName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [`${value}${tempSymbol}`, name === 'tempMax' ? 'High' : 'Low']}
                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tempMax" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
                    name="tempMax"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tempMin" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    name="tempMin"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Precipitation Trend */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-600 font-semibold mb-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h4>Accumulated Precipitation</h4>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="dayName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value} ${precipSymbol}`, 'Precipitation']}
                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar 
                    dataKey="precipitationSum" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
