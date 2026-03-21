"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Loader2, LogIn, UserPlus, CheckCircle, ArrowRight, Plane } from "lucide-react";
import { motion } from "framer-motion";

export default function JoinTripPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.tripId as string;

    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [alreadyMember, setAlreadyMember] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        fetchTripPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]);

    const fetchTripPreview = async () => {
        try {
            const token = getToken();
            if (!token) {
                router.push(`/login?redirect=/join/${tripId}`);
                return;
            }
            const res = await fetch(`${apiUrl}/trips/${tripId}/preview`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTrip(data);
            } else {
                setError("Trip not found or invalid link.");
            }
        } catch (e) {
            setError("Failed to load trip details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        const token = getToken();
        if (!token) {
            router.push(`/login?redirect=/join/${tripId}`);
            return;
        }
        setIsJoining(true);
        setError("");
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.alreadyMember) {
                setAlreadyMember(true);
                setTimeout(() => router.push(`/dashboard/trips/${tripId}`), 1500);
            } else if (data.success) {
                setSuccess(true);
                setTimeout(() => router.push(`/dashboard/trips/${tripId}`), 2000);
            } else {
                setError(data.message || "Failed to join trip.");
            }
        } catch (e) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (error && !trip) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <MapPin className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Trip Not Found</h1>
                    <p className="text-zinc-400 mb-6">{error}</p>
                    <button onClick={() => router.push("/dashboard")} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Cover Image */}
                    {trip?.coverImage && (
                        <div className="h-48 w-full relative overflow-hidden">
                            <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-8">
                        {/* Invitation Badge */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Plane className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium text-emerald-400">You&apos;re invited to join</span>
                        </div>

                        {/* Trip Info */}
                        <h1 className="text-3xl font-extrabold text-white mb-2">{trip?.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-zinc-400 text-sm mb-8">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> {trip?.destinationCity || trip?.destination}</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-amber-400" /> {fmtDate(trip?.startDate)} – {fmtDate(trip?.endDate)}</span>
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-purple-400" /> {trip?._count?.members || 0} explorer{(trip?._count?.members || 0) !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Status Messages */}
                        {success && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
                                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-emerald-300 font-semibold text-sm">Successfully joined!</p>
                                    <p className="text-emerald-200/60 text-xs">Redirecting to the trip dashboard...</p>
                                </div>
                            </motion.div>
                        )}

                        {alreadyMember && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                                <CheckCircle className="w-6 h-6 text-amber-400 shrink-0" />
                                <div>
                                    <p className="text-amber-300 font-semibold text-sm">You&apos;re already a member!</p>
                                    <p className="text-amber-200/60 text-xs">Redirecting to the trip...</p>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!success && !alreadyMember && (
                            <div className="space-y-3">
                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining}
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                    {isJoining ? "Joining..." : "Join This Trip"}
                                </button>
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="w-full h-12 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-zinc-700/50"
                                >
                                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
