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
    const [editingActId, setEditingActId] = useState<string | null>(null);

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

    const [isOptimizing, setIsOptimizing] = useState<number | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<number | null>(null);

    const handleOptimizeDay = async (dayIdx: number) => {
        if (!tripId) return;
        setIsOptimizing(dayIdx);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/optimize-day`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ tripId, dayIdx })
            });
            if (res.ok) {
                const data = await res.json();
                setItinerary(data.itinerary);
                if (onUpdate) onUpdate(data.itinerary);
            }
        } catch (err) {
            console.error("Failed to optimize day", err);
        } finally {
            setIsOptimizing(null);
        }
    };

    const handleRegenerateDay = async (dayIdx: number) => {
        if (!tripId) return;
        setIsRegenerating(dayIdx);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/regenerate-day`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ tripId, dayIdx })
            });
            if (res.ok) {
                const data = await res.json();
                setItinerary(data.itinerary);
                if (onUpdate) onUpdate(data.itinerary);
            }
        } catch (err) {
            console.error("Failed to regenerate day", err);
        } finally {
            setIsRegenerating(null);
        }
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

    const updateActivityField = (dayIdx: number, actIdx: number, field: string, value: string) => {
        const newItin = [...itinerary];
        newItin[dayIdx].activities[actIdx][field] = value;
        setItinerary(newItin);
    };

    const handleSaveEdit = () => {
        setEditingActId(null);
        if (onUpdate) onUpdate(itinerary);
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
                                <Button disabled={isOptimizing === dayIdx} size="sm" variant="outline" className="h-8 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => handleOptimizeDay(dayIdx)}>
                                    <Wand2 className={`w-3.5 h-3.5 mr-1.5 ${isOptimizing === dayIdx ? 'animate-spin' : ''}`} /> {isOptimizing === dayIdx ? 'Optimizing...' : 'Optimize'}
                                </Button>
                                <Button disabled={isRegenerating === dayIdx} size="sm" variant="outline" className="h-8 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => handleRegenerateDay(dayIdx)}>
                                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRegenerating === dayIdx ? 'animate-spin' : ''}`} /> {isRegenerating === dayIdx ? 'Regenerating...' : 'Regenerate'}
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
                                                        className={`bg-zinc-900/40 border ${act.completed ? 'border-orange-500/30 bg-orange-950/20 opacity-60' : 'border-zinc-800/60'} rounded-2xl p-4 flex gap-4 transition-all shadow-sm ${snapshot.isDragging ? 'shadow-2xl shadow-purple-500/20 border-purple-500/50 scale-[1.02] z-50 bg-zinc-800' : 'hover:bg-zinc-800/40 hover:border-zinc-700'}`}
                                                    >
                                                        {/* Drag Handle & TimeSlot */}
                                                        <div className="flex flex-col items-center justify-between py-1">
                                                            <div {...provided.dragHandleProps} className="text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing p-1">
                                                                <GripVertical className="w-4 h-4" />
                                                            </div>
                                                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.locationName || act.title || "")}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 hover:scale-110 border border-zinc-700 text-purple-400 hover:text-purple-300 flex items-center justify-center flex-shrink-0 mt-2 transition-all shadow-md">
                                                                <Icon className="w-4 h-4" />
                                                            </a>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                                    {act.timeSlot}
                                                                </span>
                                                                {act.time && <span className="text-xs font-medium text-zinc-500">{act.time}</span>}
                                                            </div>
                                                            {editingActId === act.id ? (
                                                                <div className="w-full flex gap-2 items-center mb-1">
                                                                    <input 
                                                                        type="text"
                                                                        value={act.title || ""}
                                                                        onChange={(e) => updateActivityField(dayIdx, actIdx, "title", e.target.value)}
                                                                        onBlur={handleSaveEdit}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                                        placeholder="Activity Name"
                                                                        className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-purple-500 rounded px-2 py-1 text-sm font-bold text-white outline-none"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <h4 
                                                                    onClick={() => setEditingActId(act.id)}
                                                                    className={`text-base font-bold truncate transition-colors cursor-pointer hover:text-purple-400 ${act.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}
                                                                >
                                                                    {act.title || act.description}
                                                                </h4>
                                                            )}

                                                            {editingActId === act.id ? (
                                                                <textarea
                                                                    value={act.description || ""}
                                                                    onChange={(e) => updateActivityField(dayIdx, actIdx, "description", e.target.value)}
                                                                    onBlur={handleSaveEdit}
                                                                    placeholder="Activity Description"
                                                                    className="w-full mt-1.5 bg-zinc-950 border border-zinc-700 focus:border-purple-500 rounded px-2 py-1 text-xs text-zinc-300 outline-none resize-none"
                                                                    rows={2}
                                                                />
                                                            ) : (
                                                                (act.description && act.title) ? (
                                                                    <p 
                                                                        onClick={() => setEditingActId(act.id)}
                                                                        className="text-sm text-zinc-400 mt-1.5 leading-relaxed line-clamp-2 cursor-pointer hover:text-zinc-300"
                                                                    >
                                                                        {act.description}
                                                                    </p>
                                                                ) : null
                                                            )}
                                                            
                                                            {act.costEstimate > 0 && (
                                                                <div className="mt-3 inline-flex items-center text-[11px] font-mono text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md">
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
                                                                className={`p-1.5 rounded-md transition-colors ${act.completed ? 'text-orange-400 bg-orange-400/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
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
