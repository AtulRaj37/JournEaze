"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, MapPin, Clock, Calendar, Globe, Plus, Check, ExternalLink, X, Compass, CloudSun, Droplets, Wind, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TripExploreBoardProps {
    tripId: string;
    trip: any;
    explorePlaces: any[];
    setExplorePlaces: (places: any[]) => void;
    apiUrl: string;
    getToken: () => string | null;
    onUpdate: () => void;
}

export default function TripExploreBoard({ tripId, trip, explorePlaces, setExplorePlaces, apiUrl, getToken, onUpdate }: TripExploreBoardProps) {
    const [isLoadingExplore, setIsLoadingExplore] = useState(false);
    const [exploreCategory, setExploreCategory] = useState("All");
    const [selectedPlaces, setSelectedPlaces] = useState<Set<number>>(new Set());
    
    // Weather state
    const [weather, setWeather] = useState<any>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Modal state for adding to itinerary
    const [addingPlace, setAddingPlace] = useState<any | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
    const [isSavingActivity, setIsSavingActivity] = useState(false);

    useEffect(() => {
        if (trip.latitude && trip.longitude) {
            fetchWeather(trip.latitude, trip.longitude);
        }
    }, [trip.latitude, trip.longitude]);

    const fetchWeather = async (lat: number, lon: number) => {
        setIsLoadingWeather(true);
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
            if (res.ok) {
                const data = await res.json();
                setWeather(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingWeather(false);
        }
    };

    const handleExplorePlacesGenerate = async () => {
        setIsLoadingExplore(true);
        try {
            const dest = encodeURIComponent(trip.destinationCity || trip.destination);
            let url = `${apiUrl}/ai/explore-places?destination=${dest}`;
            if (trip.aiCustomPrompt) {
                url += `&extraPlaces=${encodeURIComponent(trip.aiCustomPrompt)}`;
            }
            const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (res.ok) {
                const data = await res.json();
                const places = Array.isArray(data) ? data : data.places || [];
                setExplorePlaces(places);
                // Persist to DB so they survive reload
                await fetch(`${apiUrl}/trips/${tripId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ explorePlaces: places }),
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingExplore(false);
        }
    };

    const handleAddToItinerary = async () => {
        if (!addingPlace) return;
        setIsSavingActivity(true);
        try {
            // We need to fetch current trip, push the activity to the specific day's activities, and update
            const itinerary = Array.isArray(trip.aiItinerary) ? [...trip.aiItinerary] : [];
            if (!itinerary[selectedDayIndex]) {
                // Should not happen if days exist, but fallback
                itinerary[selectedDayIndex] = { dayNumber: selectedDayIndex + 1, theme: "Custom Day", activities: [] };
            }

            const newActivity = {
                title: addingPlace.name,
                description: addingPlace.description,
                type: addingPlace.category === "Food" ? "food" : "activity",
                locationName: addingPlace.name,
                costEstimate: 0,
                time: "Flexible",
                needsImage: true
            };

            itinerary[selectedDayIndex].activities.push(newActivity);

            const res = await fetch(`${apiUrl}/trips/${tripId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ aiItinerary: itinerary })
            });

            if (res.ok) {
                onUpdate(); // Refresh trip data
                setAddingPlace(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingActivity(false);
        }
    };

    // Weather Codes mapping roughly (WMO Code)
    const getWeatherDescription = (code: number) => {
        if (code === 0) return "Clear sky";
        if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
        if (code === 45 || code === 48) return "Fog";
        if (code >= 51 && code <= 67) return "Rain";
        if (code >= 71 && code <= 77) return "Snow";
        if (code >= 80 && code <= 82) return "Rain showers";
        if (code >= 95) return "Thunderstorm";
        return "Variable";
    };

    const categories = ["All", ...Array.from(new Set(explorePlaces.map((p: any) => p.category)))];

    return (
        <div className="space-y-6">
            {/* Live Weather Widget */}
            {weather && (
                <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border-cyan-500/30 backdrop-blur-xl overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/20 blur-[50px] rounded-full"></div>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-cyan-950/50 rounded-2xl border border-cyan-500/30">
                                    <CloudSun className="w-10 h-10 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-cyan-200/70 mb-1">Current Weather in {trip.destinationCity || trip.destination}</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-4xl font-extrabold text-white">{Math.round(weather.current.temperature_2m)}°C</h3>
                                        <span className="text-lg text-cyan-100/60 font-medium">{getWeatherDescription(weather.current.weather_code)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 px-4 py-3 bg-black/20 rounded-xl backdrop-blur-md border border-white/5">
                                <div className="text-center">
                                    <DropIcon className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                                    <p className="text-xs text-zinc-400">Humidity</p>
                                    <p className="text-sm font-semibold text-white">{weather.current.relative_humidity_2m}%</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div className="text-center">
                                    <Wind className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                                    <p className="text-xs text-zinc-400">Wind</p>
                                    <p className="text-sm font-semibold text-white">{weather.current.wind_speed_10m} km/h</p>
                                </div>
                                <div className="w-px h-10 bg-white/10"></div>
                                <div className="text-center">
                                    <SunIcon className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                                    <p className="text-xs text-zinc-400">High/Low</p>
                                    <p className="text-sm font-semibold text-white">
                                        {Math.round(weather.daily.temperature_2m_max[0])}° / {Math.round(weather.daily.temperature_2m_min[0])}°
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hero + Generate */}
            <div className="relative rounded-2xl overflow-hidden h-56 md:h-72 shadow-2xl">
                <img
                    src={trip.coverImage || `${apiUrl}/images/search?query=${encodeURIComponent((trip.destinationCity || trip.destination) + ' famous landmark tourism')}&destination=${encodeURIComponent(trip.destination)}`}
                    alt={trip.destination}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow-md">Discover {trip.destinationCity || trip.destination}</h2>
                        <p className="text-zinc-200 text-sm font-medium drop-shadow">AI-curated spectacular spots and hidden gems</p>
                    </div>
                    {explorePlaces.length === 0 && (
                        <Button
                            onClick={handleExplorePlacesGenerate}
                            disabled={isLoadingExplore}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-xl font-bold whitespace-nowrap shadow-lg shadow-orange-500/20 text-md transition-all hover:scale-105"
                        >
                            {isLoadingExplore ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Mapping...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate Guide</>}
                        </Button>
                    )}
                </div>
            </div>

            {/* Loading Skeleton */}
            {isLoadingExplore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                            <div className="h-48 bg-zinc-800" />
                            <div className="p-5 space-y-3">
                                <div className="h-5 bg-zinc-800 rounded w-3/4" />
                                <div className="h-4 bg-zinc-800/60 rounded w-full" />
                                <div className="h-4 bg-zinc-800/60 rounded w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content Area */}
            {explorePlaces.length > 0 && (
                <>
                    {/* Category Filter Chips */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Compass className="w-5 h-5 text-orange-400" /> Filter by Category</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat: string) => {
                                const count = cat === "All" ? explorePlaces.length : explorePlaces.filter((p: any) => p.category === cat).length;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setExploreCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                                            exploreCategory === cat
                                                ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/40'
                                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                    >
                                        {cat} <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs ${exploreCategory === cat ? 'bg-white/20' : 'bg-zinc-800'}`}>{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Trending Sub-Section Area */}
                    <div className="py-4">
                       <h3 className="text-lg font-bold text-white mb-4">Top Rated Spots</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {explorePlaces.slice(0, 2).map((place: any, i: number) => (
                                <div key={i} className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 group">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                        <img src={`${apiUrl}/images/search?query=${encodeURIComponent(place.name + ' ' + trip.destination)}&destination=${encodeURIComponent(trip.destination)}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold truncate">{place.name}</h4>
                                        <p className="text-zinc-400 text-xs truncate line-clamp-1 mb-2">{place.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{place.category}</span>
                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center font-bold">★ 4.8</span>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="hover:bg-orange-500/20 hover:text-orange-400 shrink-0" onClick={() => setAddingPlace(place)}>
                                        <PlusCircle className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))}
                       </div>
                    </div>

                    {/* Place Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {explorePlaces
                            .filter((p: any) => exploreCategory === "All" || p.category === exploreCategory)
                            .map((place: any, i: number) => {
                                const globalIdx = explorePlaces.indexOf(place);
                                const isSelected = selectedPlaces.has(globalIdx);
                                return (
                                    <motion.div
                                        key={globalIdx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`group relative bg-zinc-900/80 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                                            isSelected ? 'border-orange-500 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' : 'border-zinc-800/80 hover:border-zinc-600 hover:shadow-xl hover:-translate-y-1'
                                        }`}
                                    >
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => {
                                            setSelectedPlaces(prev => {
                                                const next = new Set(prev);
                                                next.has(globalIdx) ? next.delete(globalIdx) : next.add(globalIdx);
                                                return next;
                                            });
                                        }}>
                                            <img
                                                src={`${apiUrl}/images/search?query=${encodeURIComponent(place.name + ' ' + (trip.destinationCity || trip.destination))}&destination=${encodeURIComponent(trip.destination)}`}
                                                alt={place.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 pointer-events-none" />
                                            
                                            {/* Selection checkmark */}
                                            <div className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-orange-500 text-white scale-110' : 'bg-black/40 backdrop-blur-sm text-white/50 border border-white/20 group-hover:bg-white/10'
                                            }`}>
                                                {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            </div>
                                            
                                            {/* Category badge */}
                                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                                                {place.category}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h4 className="font-extrabold text-white text-base mb-2 group-hover:text-orange-400 transition-colors line-clamp-1">{place.name}</h4>
                                            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-4 flex-1">{place.description}</p>
                                            
                                            <div className="flex flex-col gap-2 mb-4">
                                                {place.bestTimeToVisit && (
                                                    <span className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg"><Clock className="w-3.5 h-3.5 text-zinc-300" />{place.bestTimeToVisit}</span>
                                                )}
                                                {place.estimatedDuration && (
                                                    <span className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg"><Calendar className="w-3.5 h-3.5 text-zinc-300" />{place.estimatedDuration}</span>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between mt-auto">
                                                <Button size="sm" onClick={() => setAddingPlace(place)} className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-semibold h-8 text-xs">
                                                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Planner
                                                </Button>
                                                <a
                                                    href={`https://www.google.com/maps/search/${encodeURIComponent(place.name + ', ' + trip.destination)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                                                    title="View on Map"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                    </div>

                    {/* Floating Selected Places Banner */}
                    <AnimatePresence>
                        {selectedPlaces.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-orange-600/95 backdrop-blur-xl border border-orange-400/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-orange-900/40 z-50 w-[90%] max-w-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                                        <Check className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-base">{selectedPlaces.size} place{selectedPlaces.size > 1 ? 's' : ''} selected</p>
                                        <p className="text-orange-100 text-xs mt-0.5 opacity-90">Preview locations smoothly on Map</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const names = Array.from(selectedPlaces).map(idx => explorePlaces[idx]?.name).filter(Boolean);
                                            window.open(`https://www.google.com/maps/dir/${names.map(n => encodeURIComponent(n + ', ' + trip.destination)).join('/')}`, '_blank');
                                        }}
                                        className="bg-white text-orange-900 hover:bg-zinc-100 font-bold px-4 shadow-md"
                                    >
                                        <MapPin className="w-4 h-4 mr-2" /> Navigate
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setSelectedPlaces(new Set())} className="text-orange-100 hover:bg-orange-700 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Add to Planner Modal */}
                    <AnimatePresence>
                        {addingPlace && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                            >
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white">Add to Itinerary</h3>
                                        <button onClick={() => setAddingPlace(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                                    </div>
                                    <div className="bg-zinc-800/50 rounded-xl p-3 mb-6 flex gap-3 items-center">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                                            <img src={`${apiUrl}/images/search?query=${encodeURIComponent(addingPlace.name)}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">{addingPlace.name}</p>
                                            <p className="text-xs text-zinc-400 mt-1">{addingPlace.category}</p>
                                        </div>
                                    </div>

                                    {trip.aiItinerary && trip.aiItinerary.length > 0 ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-medium text-zinc-400 mb-2 block">Select Day to Add</label>
                                                <select
                                                    value={selectedDayIndex}
                                                    onChange={(e) => setSelectedDayIndex(parseInt(e.target.value))}
                                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                                >
                                                    {trip.aiItinerary.map((day: any, i: number) => (
                                                        <option key={i} value={i}>Day {day.dayNumber}: {day.theme}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button onClick={handleAddToItinerary} disabled={isSavingActivity} className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold">
                                                {isSavingActivity ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Add to Planner
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-zinc-400 mb-4">Please generate an itinerary first in the Planner tab before adding custom activities.</p>
                                            <Button variant="outline" onClick={() => setAddingPlace(null)} className="w-full border-zinc-700 text-zinc-300">Close</Button>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}

// Simple icons
function DropIcon(props: any) { return <Droplets {...props} />; }
function SunIcon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>; }
