"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    MapPin, Calendar, Users, User, Heart, Loader2,
    MoreVertical, Trash2, ArrowRight
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const TRAVEL_TYPE_ICONS: Record<string, React.ElementType> = {
    SOLO: User,
    COUPLE: Heart,
    FRIENDS: Users,
    FAMILY: Users,
};

function formatDateRange(start: string, end: string): string {
    if (!start || !end) return "";
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return `${fmt(s)} – ${fmt(e)} (${diff} day${diff > 1 ? "s" : ""})`;
}

export default function MyTripsPage() {
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${apiUrl}/trips`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTrips(data);
            }
        } catch { }
        finally { setIsLoading(false); }
    };

    const handleDelete = async (tripId: string) => {
        setIsDeleting(tripId);
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setTrips(prev => prev.filter(t => t.id !== tripId));
            }
        } catch { }
        finally { setIsDeleting(null); }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center pt-24">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold tracking-tight">
                        My <span className="text-orange-400">Trips</span>
                    </h1>
                    <p className="text-zinc-400 mt-1">All your journeys in one place.</p>
                </motion.div>

                {trips.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
                        <MapPin className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 text-lg">No trips yet. Start planning your first adventure!</p>
                        <Link href="/dashboard">
                            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                                Create a Trip
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trips.map((trip, i) => {
                            const TypeIcon = TRAVEL_TYPE_ICONS[trip.travelType] || User;
                            const isPast = new Date(trip.endDate) < new Date();

                            return (
                                <motion.div
                                    key={trip.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className={`relative group rounded-2xl border transition-all overflow-hidden ${isPast ? "bg-zinc-900/30 border-zinc-800/30" : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"}`}>
                                        {/* Trip Image */}
                                        <div className="relative h-36 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/90" />
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-purple-500/10" />
                                            <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-orange-400" />
                                                <span className="text-white font-semibold text-lg truncate">{trip.destination}</span>
                                            </div>
                                            {isPast && (
                                                <span className="absolute top-3 left-4 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
                                                    Completed
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                <TypeIcon className="w-3.5 h-3.5" />
                                                <span>{trip.travelType}</span>
                                                {trip.budget && (
                                                    <>
                                                        <span className="text-zinc-700">•</span>
                                                        <span>₹{Number(trip.budget).toLocaleString()}</span>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                                                <Link href={`/trip/${trip.id}`} className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium">
                                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors outline-none">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 rounded-xl w-40">
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(trip.id)}
                                                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer gap-2"
                                                        >
                                                            {isDeleting === trip.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            Delete Trip
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
