'use client';
import { useState, useEffect } from "react";
import { Loader2, Sparkles, CheckCircle2, Circle, Backpack, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function getToken() {
    return localStorage.getItem("token") || "";
}
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function TripPackingBoard({ trip, onUpdate }: { trip: any, onUpdate: () => void }) {
    const formatInitialList = (raw: any) => {
        if (!raw) return null;
        const formatted: any = {};
        for (const category in raw) {
            if (Array.isArray(raw[category])) {
                formatted[category] = raw[category].map((item: string | any) => {
                    if (typeof item === 'string') return { name: item, checked: false };
                    return { ...item }; // Ensure a deep copy so we can mutate safely
                });
            }
        }
        return formatted;
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [packingList, setPackingList] = useState<any>(formatInitialList(trip.aiPackingList));

    useEffect(() => {
        setPackingList(formatInitialList(trip.aiPackingList));
    }, [trip.aiPackingList]);



    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`${apiUrl}/ai/packing-list`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ tripId: trip.id })
            });

            if (res.ok) {
                const data = await res.json();
                const formatted = formatInitialList(data);
                
                // Save formatted checkable list to DB instantly
                await fetch(`${apiUrl}/trips/${trip.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                    body: JSON.stringify({ aiPackingList: formatted })
                });

                setPackingList(formatted);
                onUpdate();
            }
        } catch (e) {
            console.error("Failed to generate packing list", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleItem = async (category: string, itemIdx: number) => {
        if (!packingList || !packingList[category]) return;
        const newList = { ...packingList };
        newList[category] = [...newList[category]]; // Clone the array
        const item = newList[category][itemIdx];
        
        // Deep clone item to avoid read-only properties crash and normalize on the fly just in case
        if (typeof item === 'string') {
            newList[category][itemIdx] = { name: item, checked: true };
        } else {
            newList[category][itemIdx] = { ...item, checked: !item.checked };
        }
        
        setPackingList(newList);

        // Sync to backend silently
        await fetch(`${apiUrl}/trips/${trip.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ aiPackingList: newList })
        });
        onUpdate();
    };

    // Calculate Progress
    let totalItems = 0;
    let checkedItems = 0;
    if (packingList && typeof packingList === 'object') {
        Object.values(packingList).forEach((cat: any) => {
            if (Array.isArray(cat)) {
                totalItems += cat.length;
                checkedItems += cat.filter(i => i.checked).length;
            }
        });
    }
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Card */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-orange-500/20">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full"></div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Backpack className="w-7 h-7 text-orange-400" /> Smart Packing List
                    </h2>
                    <p className="text-zinc-400 mt-2 max-w-xl text-sm">
                        AI-generated checklist customized for {trip.destination}'s climate and your specific planned activities.
                    </p>
                </div>

                {packingList && totalItems > 0 && (
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md min-w-[140px]">
                        <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
                            {progress}%
                        </span>
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-1">Packed</span>
                        
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State / Generate Button */}
            {(!packingList || Object.keys(packingList).length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-zinc-800/60 rounded-3xl bg-zinc-900/30 w-full max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                        <Backpack className="w-10 h-10 text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Packing List Yet</h3>
                    <p className="text-zinc-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                        Let AI analyze your destination, the expected weather, and your itinerary to instantly build a hyper-specific checklist.
                    </p>
                    <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-xl font-bold transition-all shadow-xl shadow-orange-900/50 hover:scale-105 hover:shadow-orange-500/20"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Weather...</>
                        ) : (
                            <><Sparkles className="w-5 h-5 mr-2" /> Generate Smart List</>
                        )}
                    </Button>
                </div>
            )}

            {/* Loading Skeleton */}
            {isGenerating && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-panel p-5 rounded-2xl animate-pulse flex flex-col gap-4">
                            <div className="h-6 w-1/2 bg-zinc-800 rounded-md" />
                            <div className="space-y-3">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="flex gap-3 items-center">
                                        <div className="w-5 h-5 rounded-full bg-zinc-800" />
                                        <div className="h-4 w-3/4 bg-zinc-800/50 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Checklist Content */}
            {packingList && !isGenerating && typeof packingList === 'object' && Object.keys(packingList).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(packingList).map(([category, items]: [string, any]) => (
                        <div key={category} className="glass-panel p-6 rounded-2xl flex flex-col break-inside-avoid shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/50 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <h4 className="text-orange-400 font-bold text-lg mb-5 flex items-center border-b border-zinc-800/60 pb-3">
                                {category}
                            </h4>
                            
                            <div className="space-y-1">
                                {Array.isArray(items) ? items.map((rawItem: any, idx: number) => {
                                    const item = typeof rawItem === 'string' ? { name: rawItem, checked: false } : rawItem;
                                    const isChecked = item.checked === true;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => toggleItem(category, idx)}
                                            className="w-full flex items-center text-left gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors group/item"
                                        >
                                            {isChecked ? (
                                                <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 transition-transform scale-110" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-zinc-600 group-hover/item:border-orange-500 flex-shrink-0 transition-colors" />
                                            )}
                                            <span className={`text-sm font-medium transition-all ${isChecked ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                                {item.name}
                                            </span>
                                        </button>
                                    );
                                }) : (
                                    <div className="flex items-start gap-2 p-3 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <p>Invalid format received from AI. Try regenerating.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
