"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    User, Mail, AtSign, Calendar, MapPin, Shield, Settings, Loader2, 
    Globe, Plane, ArrowRight
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    image: string | null;
    role: string;
    createdAt: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tripStats, setTripStats] = useState({ total: 0, upcoming: 0, past: 0 });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch profile
        fetch(`${apiUrl}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data) setProfile(data); })
            .catch(() => {})
            .finally(() => setIsLoading(false));

        // Fetch trips for stats
        fetch(`${apiUrl}/trips`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.ok ? res.json() : [])
            .then((trips: any[]) => {
                const now = new Date();
                setTripStats({
                    total: trips.length,
                    upcoming: trips.filter(t => new Date(t.endDate) >= now).length,
                    past: trips.filter(t => new Date(t.endDate) < now).length,
                });
            })
            .catch(() => {});
    }, []);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center pt-24">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </main>
        );
    }

    const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

    return (
        <main className="min-h-screen bg-zinc-950 text-white pt-24 pb-16 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Profile Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
                        {/* Banner */}
                        <div className="h-28 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-purple-500/20" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                        </div>

                        <CardContent className="px-6 pb-6 -mt-10 relative">
                            <div className="flex items-end gap-4 mb-6">
                                <Avatar className="w-20 h-20 rounded-2xl border-4 border-zinc-900 shadow-lg">
                                    <AvatarImage src={profile?.image || undefined} />
                                    <AvatarFallback className="bg-zinc-800 text-white text-2xl rounded-2xl font-bold">
                                        {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 pb-1">
                                    <h1 className="text-2xl font-bold text-white truncate">{profile?.name || "Explorer"}</h1>
                                    {profile?.username && (
                                        <p className="text-sm text-orange-400 font-medium">@{profile.username}</p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => router.push("/dashboard/settings")}
                                    variant="outline"
                                    className="rounded-xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white mb-1"
                                >
                                    <Settings className="w-4 h-4 mr-1.5" /> Edit Profile
                                </Button>
                            </div>

                            {/* User quick info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                                    <Mail className="w-4 h-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Email</p>
                                        <p className="text-sm text-white truncate">{profile?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                                    <AtSign className="w-4 h-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Username</p>
                                        <p className="text-sm text-white">{profile?.username ? `@${profile.username}` : "Not set"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                                    <Calendar className="w-4 h-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Joined</p>
                                        <p className="text-sm text-white">{joinDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                                    <Shield className="w-4 h-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Role</p>
                                        <p className="text-sm text-white capitalize">{profile?.role?.toLowerCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Trip Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-orange-400" /> Travel Stats
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="bg-zinc-900/50 border-zinc-800 text-center py-5">
                            <CardContent className="p-0">
                                <p className="text-3xl font-bold text-white">{tripStats.total}</p>
                                <p className="text-xs text-zinc-500 mt-1">Total Trips</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/50 border-zinc-800 text-center py-5">
                            <CardContent className="p-0">
                                <p className="text-3xl font-bold text-orange-400">{tripStats.upcoming}</p>
                                <p className="text-xs text-zinc-500 mt-1">Upcoming</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/50 border-zinc-800 text-center py-5">
                            <CardContent className="p-0">
                                <p className="text-3xl font-bold text-emerald-400">{tripStats.past}</p>
                                <p className="text-xs text-zinc-500 mt-1">Completed</p>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Plane className="w-4 h-4 text-orange-400" /> Quick Links
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link href="/dashboard/trips" className="group flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                            <MapPin className="w-5 h-5 text-orange-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">My Trips</p>
                                <p className="text-xs text-zinc-500">View all your journeys</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </Link>
                        <Link href="/dashboard/settings" className="group flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                            <Settings className="w-5 h-5 text-blue-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">Account Settings</p>
                                <p className="text-xs text-zinc-500">Change password, etc.</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
