"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
    MapPin, Bed, Bus, Utensils, CheckCircle, Circle, GripVertical, 
    Sparkles, Plus, RefreshCw, Wand2, CheckSquare, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function TripItineraryBoard({ initialItinerary, tripId, onUpdate }: any) {
    const [itinerary, setItinerary] = useState<any[]>([]);

    useEffect(() => {
        if (initialItinerary) {
            // Apply Morning/Afternoon/Evening tags if not present
            const enriched = initialItinerary.map((day: any) => ({
                ...day,
                activities: day.activities?.map((act: any, actIdx: number) => ({
                    ...act,
                    id: act.id || `act-${day.dayNumber}-${actIdx}-${Math.random().toString(36).substr(2, 9)}`,
                    timeSlot: act.timeSlot || (actIdx === 0 ? "Morning" : actIdx === 1 ? "Afternoon" : "Evening"),
                    completed: act.completed || false
                })) || []
            }));
            setItinerary(enriched);
        }
    }, [initialItinerary]);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const sourceDayIdx = parseInt(result.source.droppableId.split("-")[1]);
        const destDayIdx = parseInt(result.destination.droppableId.split("-")[1]);

        const newItin = [...itinerary];
        const sourceDay = { ...newItin[sourceDayIdx] };
        const destDay = sourceDayIdx === destDayIdx ? sourceDay : { ...newItin[destDayIdx] };

        const sourceActivities = [...sourceDay.activities];
        const destActivities = sourceDayIdx === destDayIdx ? sourceActivities : [...destDay.activities];

        const [movedAct] = sourceActivities.splice(result.source.index, 1);
        destActivities.splice(result.destination.index, 0, movedAct);

        // Update time slots based on new position roughly
        destActivities.forEach((act, idx) => {
            act.timeSlot = idx === 0 ? "Morning" : idx === destActivities.length - 1 ? "Evening" : "Afternoon";
        });

        sourceDay.activities = sourceActivities;
        if (sourceDayIdx !== destDayIdx) {
            destDay.activities = destActivities;
            newItin[destDayIdx] = destDay;
        }
        newItin[sourceDayIdx] = sourceDay;

        setItinerary(newItin);
        if (onUpdate) onUpdate(newItin);
    };

    const toggleComplete = (dayIdx: number, actIdx: number) => {
        const newItin = [...itinerary];
        newItin[dayIdx].activities[actIdx].completed = !newItin[dayIdx].activities[actIdx].completed;
        setItinerary(newItin);
        if (onUpdate) onUpdate(newItin);
    };

    const handleOptimizeDay = (dayIdx: number) => {
        const newItin = [...itinerary];
        // Basic optimization logic: sort by type to group locations or by cost
        // Since we don't have lat/long readily available in activities array, we sort them 
        // Hotel -> Activity -> Food -> Travel as a logical progression
        const order: any = { 'hotel': 1, 'activity': 2, 'food': 3, 'travel': 4 };
        newItin[dayIdx].activities.sort((a: any, b: any) => (order[a.type] || 5) - (order[b.type] || 5));
        
        // Re-assign timeSlots
        newItin[dayIdx].activities.forEach((act: any, idx: number) => {
            act.timeSlot = idx === 0 ? "Morning" : idx === newItin[dayIdx].activities.length - 1 ? "Evening" : "Afternoon";
        });

        setItinerary(newItin);
        if (onUpdate) onUpdate(newItin);
    };

    const handleRegenerateDay = async (dayIdx: number) => {
        // Mock regenerate for UX
        const newItin = [...itinerary];
        newItin[dayIdx].theme = "Newly AI Optimized Route ✨";
        setItinerary(newItin);
        if (onUpdate) onUpdate(newItin);
    };

    const addCustomActivity = (dayIdx: number) => {
        const newItin = [...itinerary];
        newItin[dayIdx].activities.push({
            id: `custom-${Math.random()}`,
            title: "New Custom Activity",
            description: "Click to edit details.",
            type: "activity",
            timeSlot: "Evening",
            completed: false
        });
        setItinerary(newItin);
        if (onUpdate) onUpdate(newItin);
    };

    if (!itinerary.length) return null;

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-12">
                {itinerary.map((day: any, dayIdx: number) => (
                    <div key={dayIdx} className="relative pl-4 sm:pl-8 border-l-2 border-zinc-800/50 pt-2 pb-6 group">
                        {/* Timeline Node */}
                        <div className="absolute -left-[11px] top-4 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                        </div>

                        {/* Day Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center py-2 mb-6 gap-4">
                            <div>
                                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                                    Day {day.dayNumber || dayIdx + 1}
                                </h3>
                                {day.theme && <p className="text-purple-400 font-medium text-sm mt-0.5">{day.theme}</p>}
                            </div>
                            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button size="sm" variant="outline" className="h-8 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => handleOptimizeDay(dayIdx)}>
                                    <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Optimize
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => handleRegenerateDay(dayIdx)}>
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                                </Button>
                            </div>
                        </div>

                        <Droppable droppableId={`day-${dayIdx}`}>
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                    {day.activities.map((act: any, actIdx: number) => {
                                        const Icon = act.type === 'food' ? Utensils : act.type === 'hotel' ? Bed : act.type === 'travel' ? Bus : MapPin;
                                        
                                        return (
                                            <Draggable key={act.id} draggableId={act.id} index={actIdx}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`bg-zinc-900/40 border ${act.completed ? 'border-emerald-500/30 bg-emerald-950/20 opacity-60' : 'border-zinc-800/60'} rounded-2xl p-4 flex gap-4 transition-all shadow-sm ${snapshot.isDragging ? 'shadow-2xl shadow-purple-500/20 border-purple-500/50 scale-[1.02] z-50 bg-zinc-800' : 'hover:bg-zinc-800/40 hover:border-zinc-700'}`}
                                                    >
                                                        {/* Drag Handle & TimeSlot */}
                                                        <div className="flex flex-col items-center justify-between py-1">
                                                            <div {...provided.dragHandleProps} className="text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing p-1">
                                                                <GripVertical className="w-4 h-4" />
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 text-purple-400 flex items-center justify-center flex-shrink-0 mt-2">
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                                    {act.timeSlot}
                                                                </span>
                                                                {act.time && <span className="text-xs font-medium text-zinc-500">{act.time}</span>}
                                                            </div>
                                                            <h4 className={`text-base font-bold truncate transition-colors ${act.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                                                                {act.title || act.description}
                                                            </h4>
                                                            {act.description && act.title && (
                                                                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{act.description}</p>
                                                            )}
                                                            
                                                            {act.costEstimate > 0 && (
                                                                <div className="mt-3 inline-flex items-center text-[11px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                                                                    Est. ₹{act.costEstimate}
                                                                </div>
                                                            )}
                                                            
                                                            {(act.type === 'hotel' || act.type === 'travel' || act.type === 'activity') && (
                                                                <div className="mt-3 flex gap-2">
                                                                    {act.type === 'hotel' && (
                                                                        <a href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(act.locationName || act.title || "")}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-400 hover:text-purple-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50 flex items-center transition-colors">
                                                                            Book via Booking.com <ExternalLink className="w-2.5 h-2.5 ml-1" />
                                                                        </a>
                                                                    )}
                                                                    {act.type === 'travel' && (
                                                                        <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(act.title || "")}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-400 hover:text-blue-400 bg-zinc-800/50 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50 flex items-center transition-colors">
                                                                            Check Flights / Transport <ExternalLink className="w-2.5 h-2.5 ml-1" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col items-end justify-between py-1 border-l border-zinc-800/50 pl-4 w-24">
                                                            <button 
                                                                onClick={() => toggleComplete(dayIdx, actIdx)}
                                                                className={`p-1.5 rounded-md transition-colors ${act.completed ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                                                title={act.completed ? "Mark incomplete" : "Mark as completed"}
                                                            >
                                                                {act.completed ? <CheckSquare className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                            </button>
                                                            <span className="text-[10px] text-zinc-600 font-medium">Status</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                    
                                    {/* Add Custom Activity Button */}
                                    <button 
                                        onClick={() => addCustomActivity(dayIdx)}
                                        className="w-full h-12 rounded-xl border-2 border-dashed border-zinc-800/60 hover:border-purple-500/40 hover:bg-purple-500/5 text-zinc-500 hover:text-purple-400 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Add Custom Activity
                                    </button>
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
