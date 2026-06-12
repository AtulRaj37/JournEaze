"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, MapPin, Calendar, Users, User, Heart, Sparkles, MoreVertical, Edit2, Trash2, CheckCircle2, LogIn, Link2, Wallet, Compass, Plane, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const ParticleBackground = dynamic(() => import("@/components/ui/ParticleBackground"), { ssr: false });

const TRAVEL_TYPES = [
  { value: "SOLO", label: "Solo", icon: User },
  { value: "COUPLE", label: "Couple", icon: Heart },
  { value: "FRIENDS", label: "Friends", icon: Users },
  { value: "FAMILY", label: "Family", icon: Users },
] as const;

const BUDGET_PRESETS = [
  { value: "budget", label: "Budget", amount: 5000 },
  { value: "mid", label: "Mid-range", amount: 15000 },
  { value: "luxury", label: "Luxury", amount: 50000 },
] as const;

function getDayCount(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const year = s.getFullYear();
  const days = getDayCount(start, end);
  return `${fmt(s)} – ${fmt(e)}, ${year} (${days}d)`;
}

function getDaysRemaining(startDateStr: string): { days: number; label: string; isOngoing: boolean } {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { days: 0, label: "Ongoing / Past", isOngoing: true };
  } else if (diffDays === 0) {
    return { days: 0, label: "Starts Today", isOngoing: true };
  } else if (diffDays === 1) {
    return { days: 1, label: "Starts Tomorrow", isOngoing: false };
  } else {
    return { days: diffDays, label: `In ${diffDays} days`, isOngoing: false };
  }
}

export default function DashboardPage() {
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState("");

    const [title, setTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [destinationCity, setDestinationCity] = useState("");
    const [destinationCountry, setDestinationCountry] = useState("");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [travelType, setTravelType] = useState("");
    const [budget, setBudget] = useState<number | undefined>(undefined);
    const [currency] = useState("INR");
    const [coverImage, setCoverImage] = useState("");
    const [isFetchingImage, setIsFetchingImage] = useState(false);

    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [joinInput, setJoinInput] = useState("");
    const [isJoiningTrip, setIsJoiningTrip] = useState(false);
    const [joinMsg, setJoinMsg] = useState("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const getToken = () => localStorage.getItem("token");

    const fetchTrips = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${apiUrl}/trips`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTrips(data);
            }
        } catch (error) {
            console.error("Failed to fetch trips", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTrips(); }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchPlaces = useCallback(async (query: string) => {
        if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`${apiUrl}/places/autocomplete?input=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.predictions || []);
                setShowSuggestions((data.predictions || []).length > 0);
            }
        } catch (err) {
            console.error("Autocomplete error:", err);
        } finally {
            setIsSearching(false);
        }
    }, [apiUrl]);

    const handleDestinationChange = (value: string) => {
        setDestination(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchPlaces(value), 300);
    };

    const selectPlace = async (place: any) => {
        setDestination(place.description);
        setShowSuggestions(false);

        try {
            setIsFetchingImage(true);

            if (place.latitude) setLatitude(place.latitude);
            if (place.longitude) setLongitude(place.longitude);
            if (place.city) setDestinationCity(place.city);
            if (place.country) setDestinationCountry(place.country);

            if (!place.latitude && place.place_id) {
                try {
                    const res = await fetch(`${apiUrl}/places/details?place_id=${encodeURIComponent(place.place_id)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.lat) setLatitude(data.lat);
                        if (data.lng) setLongitude(data.lng);
                        if (data.city) setDestinationCity(data.city);
                        if (data.country) setDestinationCountry(data.country);
                    }
                } catch { /* ignore */ }
            }

            const cityName = place.city || place.placeName || place.description.split(",")[0];
            try {
                const imgRes = await fetch(`${apiUrl}/images/destination?city=${encodeURIComponent(cityName)}`);
                if (imgRes.ok) {
                    const imgData = await imgRes.json();
                    if (imgData.imageUrl) setCoverImage(imgData.imageUrl);
                }
            } catch { /* ignore image fetch failure */ }
        } catch {
            const parts = place.description.split(", ");
            setDestinationCity(parts[0] || "");
            setDestinationCountry(parts[parts.length - 1] || "");
        } finally {
            setIsFetchingImage(false);
        }
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError("");

        try {
            const token = getToken();
            const res = await fetch(`${apiUrl}/trips`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title,
                    destination,
                    destinationCity,
                    destinationCountry,
                    latitude,
                    longitude,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    travelType: travelType || undefined,
                    budget,
                    currency,
                    coverImage,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || (editingTripId ? "Failed to update trip" : "Failed to create trip"));
            }
            
            await fetchTrips();
            setIsDialogOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setTitle(""); setDestination(""); setDestinationCity(""); setDestinationCountry("");
        setLatitude(null); setLongitude(null); setStartDate(""); setEndDate("");
        setTravelType(""); setBudget(undefined); setCoverImage("");
        setEditingTripId(null);
    };

    const handleEditClick = (trip: any) => {
        setTitle(trip.title); setDestination(trip.destination); setDestinationCity(trip.destinationCity || "");
        setDestinationCountry(trip.destinationCountry || ""); setLatitude(trip.latitude || null);
        setLongitude(trip.longitude || null); setStartDate(trip.startDate.split('T')[0]);
        setEndDate(trip.endDate.split('T')[0]); setTravelType(trip.travelType || "");
        setBudget(trip.budget || undefined); setCoverImage(trip.coverImage || "");
        setEditingTripId(trip.id);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = async (tripId: string) => {
        if (!confirm("Are you sure you want to delete this trip?")) return;
        setIsDeleting(tripId);
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.ok) await fetchTrips();
            else alert("Failed to delete trip");
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCompleteJourney = async (tripId: string) => {
        if (!confirm("Mark this journey as completed?")) return;
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ status: "COMPLETED" }),
            });
            if (res.ok) await fetchTrips();
            else alert("Failed to complete journey");
        } catch (err) {
            console.error(err);
        }
    };

    const upcomingTrips = trips.filter(t => t.status !== "COMPLETED");
    const completedTrips = trips.filter(t => t.status === "COMPLETED");

    const handleJoinTrip = async () => {
        if (!joinInput.trim()) return;
        setIsJoiningTrip(true);
        setJoinMsg("");
        try {
            let tripId = joinInput.trim();
            const urlMatch = tripId.match(/\/join\/([a-f0-9-]+)/i) || tripId.match(/\/trips\/([a-f0-9-]+)/i);
            if (urlMatch) tripId = urlMatch[1];

            const token = getToken();
            const res = await fetch(`${apiUrl}/trips/${tripId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.alreadyMember) {
                setJoinMsg("You're already a member. Redirecting...");
                setTimeout(() => { window.location.href = `/dashboard/trips/${tripId}`; }, 1000);
            } else if (data.success) {
                setJoinMsg("Joined successfully! Redirecting...");
                await fetchTrips();
                setTimeout(() => { window.location.href = `/dashboard/trips/${tripId}`; }, 1000);
            } else {
                setJoinMsg(data.message || "Failed to join trip.");
            }
        } catch {
            setJoinMsg("Invalid trip ID or link.");
        } finally {
            setIsJoiningTrip(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <ParticleBackground />
            </div>
            
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,95,0,0.06),rgba(255,255,255,0))] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-10 relative z-10 p-6 sm:p-8">
                
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative p-6 sm:p-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden"
                >
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-2 max-w-lg">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-xs font-semibold text-orange-400">
                            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '12s' }} /> 
                            <span>Planning Center Active</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight leading-none sm:text-5xl">
                            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300">Journeys</span>
                        </h1>
                        <p className="text-zinc-400 text-sm sm:text-base">Co-create, organize, and experience premium collaborative adventures.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                value={joinInput}
                                onChange={(e) => { setJoinInput(e.target.value); setJoinMsg(""); }}
                                onKeyDown={(e) => e.key === "Enter" && handleJoinTrip()}
                                placeholder="Enter trip link or ID..."
                                className="w-full sm:w-60 h-11 pl-10 pr-3 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500/50 outline-none transition-all shadow-inner"
                            />
                        </div>
                        <button
                            onClick={handleJoinTrip}
                            disabled={isJoiningTrip || !joinInput.trim()}
                            className="h-11 px-5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-40 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg border border-zinc-700/50"
                        >
                            {isJoiningTrip ? <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> : <LogIn className="w-4 h-4 text-zinc-400" />}
                            Join Trip
                        </button>
                    </div>
                </motion.div>

                {joinMsg && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs px-4 py-2 rounded-xl w-max border ${joinMsg.includes('success') || joinMsg.includes('already') ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                    >
                        {joinMsg}
                    </motion.div>
                )}

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm space-y-1">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Total Expeditions</span>
                        <div className="text-2xl font-bold">{trips.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm space-y-1">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Active Planning</span>
                        <div className="text-2xl font-bold text-orange-400">{upcomingTrips.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm space-y-1">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Memories Saved</span>
                        <div className="text-2xl font-bold text-purple-400">{completedTrips.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm space-y-1">
                        <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Split Expenses</span>
                        <div className="text-2xl font-bold text-emerald-400">
                            {trips.reduce((acc, t) => acc + (t.expenses?.length || 0), 0)} logged
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    {isLoading ? (
                        <div className="h-10 w-48 bg-zinc-900/50 animate-pulse rounded-full" />
                    ) : (
                        <Tabs defaultValue="upcoming" className="w-full sm:w-auto">
                            <TabsList className="bg-zinc-950 p-1 border border-zinc-800/80 rounded-2xl">
                                <TabsTrigger value="upcoming" className="px-4 py-2 text-xs font-semibold rounded-xl data-[state=active]:bg-zinc-900 data-[state=active]:text-white transition-all">
                                    Upcoming ({upcomingTrips.length})
                                </TabsTrigger>
                                <TabsTrigger value="completed" className="px-4 py-2 text-xs font-semibold rounded-xl data-[state=active]:bg-zinc-900 data-[state=active]:text-white transition-all">
                                    Past Journeys ({completedTrips.length})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger render={
                            <motion.button
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 h-11 rounded-2xl text-sm font-bold text-black bg-white hover:bg-zinc-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
                            />
                        }>
                            <Plus className="w-4 h-4 stroke-[3]" /> Create New Trip
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px] bg-zinc-900 border-zinc-800 text-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">{editingTripId ? "Edit Expedition" : "Plan a New Journey"}</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    {editingTripId ? "Update the details of your trip." : "Lay the foundation for your next great group adventure."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTrip} className="space-y-5 pt-4">
                                {error && <p className="text-red-400 text-sm bg-red-950/50 p-2 rounded-xl">{error}</p>}

                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-zinc-300 font-medium">Trip Title</Label>
                                    <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer in Manali" className="bg-zinc-950 border-zinc-800 rounded-2xl focus-visible:ring-orange-500/40" />
                                </div>

                                <div className="space-y-2 relative" ref={autocompleteRef}>
                                    <Label htmlFor="destination" className="text-zinc-300 font-medium">Destination</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <Input 
                                            id="destination" 
                                            required 
                                            value={destination} 
                                            onChange={(e) => handleDestinationChange(e.target.value)} 
                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                            placeholder="Type a city name..." 
                                            className="bg-zinc-950 border-zinc-800 pl-10 rounded-2xl focus-visible:ring-orange-500/40" 
                                            autoComplete="off"
                                        />
                                        {isSearching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-500" />}
                                    </div>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                                            {suggestions.map((s: any) => (
                                                <button 
                                                    key={s.place_id}
                                                    type="button"
                                                    onClick={() => selectPlace(s)}
                                                    className="w-full text-left px-4 py-3 hover:bg-zinc-800 flex items-center gap-3 border-b border-zinc-800/50 last:border-0 transition-colors"
                                                >
                                                    <MapPin className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                                                    <span className="text-sm text-zinc-200">{s.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300 font-medium">Travelling With</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {TRAVEL_TYPES.map((t) => {
                                            const Icon = t.icon;
                                            return (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setTravelType(travelType === t.value ? "" : t.value)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                                        travelType === t.value
                                                            ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-400"
                                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750 border border-transparent"
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {t.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start" className="text-zinc-300 font-medium">Start Date</Label>
                                            <Input id="start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-950 border-zinc-800 rounded-2xl [color-scheme:dark]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end" className="text-zinc-300 font-medium">End Date</Label>
                                            <Input id="end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-950 border-zinc-800 rounded-2xl [color-scheme:dark]" />
                                        </div>
                                    </div>
                                    {startDate && endDate && (
                                        <p className="text-xs text-orange-400 font-medium mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDateRange(startDate, endDate)}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300 font-medium">Estimated Budget</Label>
                                    <div className="flex gap-2 mb-2">
                                        {BUDGET_PRESETS.map((b) => (
                                            <button
                                                key={b.value}
                                                type="button"
                                                onClick={() => setBudget(b.amount)}
                                                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                                                    budget === b.amount
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750"
                                                }`}
                                            >
                                                {b.label} (₹{b.amount.toLocaleString()})
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-500 text-sm">₹</span>
                                        <Input 
                                            type="number" 
                                            value={budget || ""} 
                                            onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)} 
                                            placeholder="Or enter custom budget" 
                                            className="bg-zinc-950 border-zinc-800 rounded-2xl" 
                                        />
                                    </div>
                                    {isFetchingImage && (
                                        <div className="flex items-center text-xs text-orange-400 mt-2">
                                            <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Fetching destination cover image...
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isCreating || !title || !destination || isFetchingImage} className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-2xl font-bold text-base transition-all hover:scale-[1.01] shadow-lg shadow-white/5 active:scale-95">
                                        {(isCreating || isFetchingImage) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {isCreating ? (editingTripId ? "Saving..." : "Creating...") : isFetchingImage ? "Preparing Destination..." : (editingTripId ? "Save Changes" : "Create Journey")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-10 w-10 animate-spin text-zinc-650" />
                    </div>
                ) : (
                    <Tabs defaultValue="upcoming" className="w-full">
                        <TabsContent value="upcoming">
                            {upcomingTrips.length === 0 ? (
                                <div className="text-center py-24 border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/10 backdrop-blur-sm max-w-xl mx-auto space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
                                        <Plane className="w-5 h-5 text-zinc-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">No active expeditions</h3>
                                        <p className="text-zinc-400 text-sm max-w-xs mx-auto mt-1">Start collaborating with friends on your next itinerary, budget splitter, and chat room.</p>
                                    </div>
                                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 hover:text-white rounded-xl text-xs font-semibold px-5">
                                        Create Trip
                                    </Button>
                                </div>
                            ) : (
                                <TripGrid trips={upcomingTrips} isDeleting={isDeleting} onComplete={handleCompleteJourney} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                            )}
                        </TabsContent>

                        <TabsContent value="completed">
                            {completedTrips.length === 0 ? (
                                <div className="text-center py-24 border border-zinc-800/80 border-dashed rounded-3xl bg-zinc-900/10 backdrop-blur-sm max-w-xl mx-auto space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
                                        <CheckCircle2 className="w-5 h-5 text-zinc-550" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-400">No completed journeys yet</h3>
                                        <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1">When you return from a trip and mark it completed, it will appear here as a golden memory.</p>
                                    </div>
                                </div>
                            ) : (
                                <TripGrid trips={completedTrips} isDeleting={isDeleting} onComplete={handleCompleteJourney} onEdit={handleEditClick} onDelete={handleDeleteClick} isCompletedTab />
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}

function TripGrid({ trips, isDeleting, onComplete, onEdit, onDelete, isCompletedTab = false }: { trips: any[], isDeleting: string | null, onComplete: (id: string) => void, onEdit: (trip: any) => void, onDelete: (id: string) => void, isCompletedTab?: boolean }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, idx) => {
                const countdown = getDaysRemaining(trip.startDate);
                
                return (
                    <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, duration: 0.4 }}
                        className="relative group/card"
                    >
                        <Link href={`/dashboard/trips/${trip.id}`} className="block h-full">
                            <Card className={`group h-full bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-800/80 hover:border-orange-500/30 transition-all duration-300 cursor-pointer text-white overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 rounded-2xl flex flex-col justify-between ${isCompletedTab ? 'opacity-80 grayscale-[20%] hover:grayscale-0' : ''}`}>
                                <div className="h-48 relative overflow-hidden">
                                    {trip.coverImage ? (
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                            style={{ backgroundImage: `url(${trip.coverImage})` }}
                                        ></div>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 group-hover:scale-105 transition-transform duration-700"></div>
                                    )}
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-zinc-950/30"></div>
                                    
                                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                                        {trip.travelType && (
                                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider rounded-full text-zinc-350 border border-zinc-850 font-bold">
                                                {trip.travelType}
                                            </span>
                                        )}
                                        {!isCompletedTab && (
                                            <span className={`px-3 py-1 backdrop-blur-md text-[10px] uppercase tracking-wider rounded-full border font-bold ${
                                                countdown.isOngoing 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            }`}>
                                                {countdown.label}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {trip.budget && (
                                        <div className="absolute top-3.5 right-3.5 px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] rounded-full text-zinc-350 border border-zinc-850 font-semibold flex items-center gap-1">
                                            <Wallet className="w-3 h-3 text-amber-500" />
                                            <span>₹{trip.budget.toLocaleString()}</span>
                                        </div>
                                    )}
                                    
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-extrabold text-white drop-shadow-xl truncate group-hover:text-orange-400 transition-colors pr-6">{trip.title}</h3>
                                    </div>
                                </div>
                                
                                <CardHeader className="p-4 flex-grow flex flex-col justify-between space-y-4">
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-center text-xs text-zinc-400">
                                            <MapPin className="w-3.5 h-3.5 mr-2 text-orange-500/70 flex-shrink-0" />
                                            <span className="truncate font-medium">{trip.destinationCity || trip.destination}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-zinc-400">
                                            <Calendar className="w-3.5 h-3.5 mr-2 text-orange-500/70 flex-shrink-0" />
                                            <span className="font-medium">{formatDateRange(trip.startDate, trip.endDate)}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-zinc-400">
                                            <Users className="w-3.5 h-3.5 mr-2 text-orange-500/70 flex-shrink-0" />
                                            <span className="font-medium">{trip._count?.members || trip.members?.length || 1} Explorer{(trip._count?.members || trip.members?.length || 1) > 1 ? "s" : ""}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                                        {isCompletedTab ? (
                                            <div className="flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-zinc-650" /> Past Memory
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                                                Go to Workspace <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger className="absolute bottom-[72px] right-4 z-20 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-colors border border-white/5 opacity-0 group-hover/card:opacity-100 shadow-lg" onClick={(e) => e.preventDefault()}>
                                {isDeleting === trip.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" /> : <MoreVertical className="w-3.5 h-3.5" />}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200 min-w-[160px] p-1.5 rounded-2xl shadow-2xl">
                                {!isCompletedTab && (
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(trip); }} className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-xl py-2.5 text-xs font-semibold">
                                        <Edit2 className="w-3.5 h-3.5 mr-2 text-blue-400" /> Edit Details
                                    </DropdownMenuItem>
                                )}
                                {!isCompletedTab && (
                                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onComplete(trip.id); }} className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-xl py-2.5 text-xs font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-orange-400" /> Mark Completed
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete(trip.id); }} disabled={isDeleting === trip.id} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400 focus:text-red-400 rounded-xl py-2.5 text-xs font-semibold">
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Trip
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                );
            })}
        </div>
    );
}
