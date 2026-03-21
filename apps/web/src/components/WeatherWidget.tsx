"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Loader2 } from "lucide-react";

interface WeatherWidgetProps {
    latitude?: number | null;
    longitude?: number | null;
    destinationName: string;
}

export default function WeatherWidget({ latitude, longitude, destinationName }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!latitude || !longitude) {
            setLoading(false);
            return;
        }

        const fetchWeather = async () => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
                const data = await res.json();
                if (data.daily) {
                    setWeather(data.daily);
                }
            } catch (err) {
                console.error("Weather fetch error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [latitude, longitude]);

    if (!latitude || !longitude) return null;

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="w-8 h-8 text-yellow-500 drop-shadow-lg" />;
        if (code >= 1 && code <= 3) return <Cloud className="w-8 h-8 text-zinc-300 drop-shadow-lg" />;
        if (code >= 45 && code <= 48) return <CloudFog className="w-8 h-8 text-zinc-400 drop-shadow-lg" />;
        if (code >= 51 && code <= 67) return <CloudDrizzle className="w-8 h-8 text-blue-400 drop-shadow-lg" />;
        if (code >= 71 && code <= 82) return <CloudSnow className="w-8 h-8 text-white drop-shadow-lg" />;
        if (code >= 95) return <CloudLightning className="w-8 h-8 text-purple-400 drop-shadow-lg" />;
        return <CloudRain className="w-8 h-8 text-blue-500 drop-shadow-lg" />;
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 shadow-xl rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" /> 7-Day Forecast for {destinationName}
            </h3>
            
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-purple-500" /></div>
            ) : weather ? (
                <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50">
                    {weather.time?.slice(0, 7).map((dateStr: string, idx: number) => (
                        <div key={dateStr} className="min-w-[110px] flex-shrink-0 flex flex-col items-center justify-between bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
                            <span className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
                                {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            
                            <div className="my-2">
                                {getWeatherIcon(weather.weathercode[idx])}
                            </div>
                            
                            <div className="mt-3 flex gap-2 text-base font-extrabold text-white items-center">
                                <span>{Math.round(weather.temperature_2m_max[idx])}°</span>
                                <span className="text-zinc-500 font-medium text-sm">{Math.round(weather.temperature_2m_min[idx])}°</span>
                            </div>
                            
                            {weather.precipitation_probability_max[idx] > 20 ? (
                                <span className="text-[10px] text-blue-400 mt-2 font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                    {weather.precipitation_probability_max[idx]}% Rain
                                </span>
                            ) : (
                                <span className="text-[10px] text-emerald-400 mt-2 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    Clear
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-zinc-500 text-sm text-center py-4 bg-zinc-950 rounded-xl">Forecast temporarily unavailable.</p>
            )}
        </div>
    );
}
