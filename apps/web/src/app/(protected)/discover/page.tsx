"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Users, Globe, Copy, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function DiscoverPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [forkingId, setForkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await fetch(`${apiUrl}/trips/public`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFork = async (tripId: string) => {
    setForkingId(tripId);
    try {
      const res = await fetch(`${apiUrl}/trips/${tripId}/fork`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const newTrip = await res.json();
        router.push(`/dashboard/trips/${newTrip.id}`);
      } else {
        alert("Failed to clone template. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while cloning.");
    } finally {
      setForkingId(null);
    }
  };

  const filteredTrips = trips.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-blue-400 tracking-tight flex items-center gap-3">
              <Globe className="w-10 h-10 text-orange-400" />
              Discover Templates
            </h1>
            <p className="text-zinc-400 mt-3 max-w-2xl text-lg">
              Explore meticulously crafted itineraries built by the community. Found the perfect trip? 
              <strong className="text-orange-400 font-bold ml-1">Clone it instantly</strong> and make it your own.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by city, country, or vibe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600 backdrop-blur-md"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-zinc-400 font-medium">Fetching public templates...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
            <AlertCircle className="w-12 h-12 text-zinc-600" />
            <h3 className="text-xl font-bold text-white">No templates found</h3>
            <p className="text-zinc-500 text-center max-w-sm">No public trips match your search. Try different keywords.</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredTrips.map((trip) => {
              const duration = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <motion.div
                  key={trip.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95, y: 20 },
                    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                  className="group bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 hover:border-orange-500/30 rounded-3xl overflow-hidden transition-all duration-500 flex flex-col hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] relative"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Cover Image Wrapper */}
                  <div className="h-48 w-full relative overflow-hidden bg-zinc-900">
                    <img
                      src={trip.coverImage || `https://source.unsplash.com/800x600/?${encodeURIComponent(trip.destinationCity || trip.destination)}`}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100"
                      onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-bold text-white tracking-wide">TEMPLATE</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white drop-shadow-md line-clamp-1">{trip.title}</h3>
                      <div className="flex items-center gap-1 text-orange-300 text-sm mt-1 font-medium drop-shadow-md">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-6 leading-relaxed flex-1">
                      {trip.description || `An epic community itinerary exploring the best of ${trip.destination}.`}
                    </p>

                    <div className="flex items-center justify-between text-zinc-500 text-sm mb-6 pb-6 border-b border-zinc-800">
                      <div className="flex items-center gap-1.5 font-medium bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
                        <Calendar className="w-4 h-4 text-blue-400" /> {duration || 1} Days
                      </div>
                      <div className="flex items-center gap-1.5 font-medium bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
                        <MapPin className="w-4 h-4 text-orange-400" /> {trip._count?.days || 0} Stops
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border-2 border-zinc-800">
                          <AvatarImage src={trip.creator?.image} />
                          <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                            {trip.creator?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs text-zinc-500">Curated by</span>
                          <span className="text-sm font-semibold text-zinc-200">
                            {trip.creator?.name || "Anonymous"}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleFork(trip.id)}
                        disabled={forkingId === trip.id}
                        className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-900/20 transition-all font-bold px-5"
                      >
                        {forkingId === trip.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" /> Clone
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
