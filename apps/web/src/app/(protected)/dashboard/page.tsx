"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Plus, MapPin, Calendar, Users, User, Heart, Sparkles, MoreVertical, Edit2, Trash2, CheckCircle2 } from "lucide-react";
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
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const days = getDayCount(start, end);
  return `${fmt(s)} – ${fmt(e)} (${days} day${days > 1 ? "s" : ""})`;
}

export default function DashboardPage() {
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState("");

    // Form states
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

    // Edit/Delete states
    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Autocomplete states
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Autocomplete via backend proxy (avoids CORS) ---
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

            // Mappls returns lat/lng directly in autocomplete results
            if (place.latitude) setLatitude(place.latitude);
            if (place.longitude) setLongitude(place.longitude);
            if (place.city) setDestinationCity(place.city);
            if (place.country) setDestinationCountry(place.country);

            // If lat/lng not in autosuggest, try the details endpoint
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

            // Fetch cover image via backend Unsplash proxy
            const cityName = place.city || place.placeName || place.description.split(",")[0];
            try {
                const imgRes = await fetch(`${apiUrl}/images/destination?city=${encodeURIComponent(cityName)}`);
                if (imgRes.ok) {
                    const imgData = await imgRes.json();
                    if (imgData.imageUrl) setCoverImage(imgData.imageUrl);
                }
            } catch { /* ignore image fetch failure */ }
        } catch {
            // Extract from description as fallback
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
        if (!confirm("Are you sure you want to delete this trip? This action cannot be undone.")) return;
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
        if (!confirm("Mark this journey as completed? It will be moved to your past trips.")) return;
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

    // Filter trips
    const upcomingTrips = trips.filter(t => t.status !== "COMPLETED");
    const completedTrips = trips.filter(t => t.status === "COMPLETED");

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative min-h-screen bg-zinc-950 text-white selection:bg-zinc-800"
        >
            {/* Particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <ParticleBackground />
            </div>
            {/* Radial gradient sheen */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,95,0,0.06),rgba(255,255,255,0))] pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-12 relative z-10 p-8">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-zinc-800/60 pb-8 relative overflow-hidden"
                >
                    {/* Logo watermark */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                        <Image
                            src="/logo/only-logo.png"
                            alt=""
                            width={120}
                            height={120}
                            className="opacity-[0.04] object-contain"
                        />
                    </div>

                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            Your <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}>Journeys</span>
                        </h1>
                        <p className="text-zinc-400 mt-2">Manage your upcoming collaborative expeditions.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger render={
                            <motion.button
                                whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(255,95,0,0.45)" }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white relative z-10"
                                style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}
                            />
                        }>
                            <Plus className="mr-1 h-4 w-4" /> Create New Trip
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px] bg-zinc-900 border-zinc-800 text-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{editingTripId ? "Edit Journey" : "Plan a New Journey"}</DialogTitle>
                                <DialogDescription className="text-zinc-400">
                                    {editingTripId ? "Update the details of your expedition." : "Set up the foundation for your next great adventure."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateTrip} className="space-y-5 pt-4">
                                {error && <p className="text-red-400 text-sm bg-red-950/50 p-2 rounded">{error}</p>}

                                {/* Trip Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-zinc-300">Trip Title</Label>
                                    <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter trip name" className="bg-zinc-950 border-zinc-800" />
                                </div>

                                {/* Destination Autocomplete */}
                                <div className="space-y-2 relative" ref={autocompleteRef}>
                                    <Label htmlFor="destination" className="text-zinc-300">Destination</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <Input 
                                            id="destination" 
                                            required 
                                            value={destination} 
                                            onChange={(e) => handleDestinationChange(e.target.value)} 
                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                            placeholder="Type a city name..." 
                                            className="bg-zinc-950 border-zinc-800 pl-10" 
                                            autoComplete="off"
                                        />
                                        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-500" />}
                                    </div>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
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

                                {/* Travel Companion */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Travelling With</Label>
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
                                                            ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {t.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start" className="text-zinc-300">Start Date</Label>
                                            <Input id="start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-zinc-950 border-zinc-800 [color-scheme:dark]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end" className="text-zinc-300">End Date</Label>
                                            <Input id="end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-zinc-950 border-zinc-800 [color-scheme:dark]" />
                                        </div>
                                    </div>
                                    {startDate && endDate && (
                                        <p className="text-xs text-purple-400 font-medium mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDateRange(startDate, endDate)}
                                        </p>
                                    )}
                                </div>

                                {/* Budget */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Estimated Budget</Label>
                                    <div className="flex gap-2 mb-2">
                                        {BUDGET_PRESETS.map((b) => (
                                            <button
                                                key={b.value}
                                                type="button"
                                                onClick={() => setBudget(b.amount)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                                    budget === b.amount
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                                }`}
                                            >
                                                {b.label}
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
                                            className="bg-zinc-950 border-zinc-800" 
                                        />
                                    </div>
                                    {isFetchingImage && (
                                        <div className="flex items-center text-xs text-purple-400 mt-2">
                                            <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Fetching destination cover image...
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isCreating || isFetchingImage} className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl font-semibold text-base">
                                        {(isCreating || isFetchingImage) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {isCreating ? (editingTripId ? "Saving..." : "Creating...") : isFetchingImage ? "Preparing Destination..." : (editingTripId ? "Save Changes" : "Blast Off 🚀")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <Tabs defaultValue="upcoming" className="w-full">
                        <TabsList className="bg-zinc-900/50 border border-zinc-800/60 p-1 mb-8">
                            <TabsTrigger value="upcoming" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Upcoming Expeditions ({upcomingTrips.length})</TabsTrigger>
                            <TabsTrigger value="completed" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Past Journeys ({completedTrips.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upcoming">
                            {upcomingTrips.length === 0 ? (
                                <div className="text-center py-20 border border-zinc-800 border-dashed rounded-2xl bg-zinc-900/20">
                                    <h3 className="text-xl font-medium text-white mb-2">No active expeditions</h3>
                                    <p className="text-zinc-400 mb-6">Create your first trip to start collaborating.</p>
                                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                                        Create Trip
                                    </Button>
                                </div>
                            ) : (
                                <TripGrid trips={upcomingTrips} isDeleting={isDeleting} onComplete={handleCompleteJourney} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                            )}
                        </TabsContent>

                        <TabsContent value="completed">
                            {completedTrips.length === 0 ? (
                                <div className="text-center py-20 border border-zinc-800 border-dashed rounded-2xl bg-zinc-900/20">
                                    <h3 className="text-xl font-medium text-zinc-400 mb-2">No completed journeys yet</h3>
                                    <p className="text-zinc-500">When you finish a trip and mark it as complete, it will appear here as a memory.</p>
                                </div>
                            ) : (
                                <TripGrid trips={completedTrips} isDeleting={isDeleting} onComplete={handleCompleteJourney} onEdit={handleEditClick} onDelete={handleDeleteClick} isCompletedTab />
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </motion.div>
    );
}

function TripGrid({ trips, isDeleting, onComplete, onEdit, onDelete, isCompletedTab = false }: { trips: any[], isDeleting: string | null, onComplete: (id: string) => void, onEdit: (trip: any) => void, onDelete: (id: string) => void, isCompletedTab?: boolean }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, idx) => (
                <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative group"
                >
                    <Link href={`/dashboard/trips/${trip.id}`} className="block h-full">
                        <Card className={`group h-full bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-white overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 ${isCompletedTab ? 'opacity-80 grayscale-[30%] hover:grayscale-0' : ''}`}>
                            <div className="h-44 relative overflow-hidden">
                                {trip.coverImage ? (
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                        style={{ backgroundImage: `url(${trip.coverImage})` }}
                                    ></div>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-zinc-800 to-zinc-950"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent"></div>
                                
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    {trip.travelType && (
                                        <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-xs rounded-full text-zinc-200 border border-zinc-700/50 font-medium">
                                            {trip.travelType}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="absolute bottom-3 left-4 right-4">
                                    <h3 className="text-lg font-bold text-white drop-shadow-lg truncate pr-8">{trip.title}</h3>
                                </div>
                            </div>
                            <CardHeader className="pt-3 pb-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center text-sm text-zinc-400">
                                        <MapPin className="w-3.5 h-3.5 mr-2 text-blue-400 flex-shrink-0" />
                                        <span className="truncate">{trip.destinationCity || trip.destination}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-zinc-400">
                                        <Calendar className="w-3.5 h-3.5 mr-2 text-green-400 flex-shrink-0" />
                                        {formatDateRange(trip.startDate, trip.endDate)}
                                    </div>
                                    <div className="flex items-center text-sm text-zinc-400">
                                        <Users className="w-3.5 h-3.5 mr-2 text-purple-400 flex-shrink-0" />
                                        {trip._count?.members || trip.members?.length || 1} Explorer{(trip._count?.members || trip.members?.length || 1) > 1 ? "s" : ""}
                                    </div>
                                    {isCompletedTab && (
                                        <div className="mt-2 flex items-center text-xs text-emerald-500 font-medium bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Journey Completed
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>

                    {/* Quick Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="absolute bottom-[88px] right-3 z-20 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 opacity-0 group-hover:opacity-100" onClick={(e) => e.preventDefault()}>
                            {isDeleting === trip.id ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <MoreVertical className="w-4 h-4" />}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200 min-w-[160px] p-1.5 rounded-xl shadow-xl">
                            {!isCompletedTab && (
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(trip); }} className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-lg py-2.5">
                                    <Edit2 className="w-4 h-4 mr-2 text-blue-400" /> Edit Details
                                </DropdownMenuItem>
                            )}
                            {!isCompletedTab && (
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onComplete(trip.id); }} className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-lg py-2.5">
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Mark Completed
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete(trip.id); }} disabled={isDeleting === trip.id} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400 focus:text-red-400 rounded-lg py-2.5">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Trip
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </motion.div>
            ))}
        </div>
    );
}
