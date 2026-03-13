"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    MapPin, Calendar, Users, Sparkles, Receipt, PlaneTakeoff, Loader2, ArrowLeft, CheckCircle2,
    StickyNote, Map as MapIcon, Plus, Trash2, Globe, Clock, Languages, Banknote, ThermometerSun, Bus,
    Info, FileText, UserPlus, ImageIcon, Paperclip, X, Edit2, Save, Download, UploadCloud
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false, loading: () => <div className="w-full h-[600px] flex items-center justify-center bg-zinc-900 rounded-xl"><span className="text-zinc-500">Loading map...</span></div> });

// ─── Helpers ───────────────────────────────────────────────────────
function getDayCount(start: string, end: string): number {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }

const EXPENSE_CATEGORIES = ["Food", "Transport", "Accommodation", "Activities", "Shopping", "Other"];

export default function TripDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const tripId = params.tripId as string;

    const [trip, setTrip] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // AI States
    const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
    const [isGeneratingPacking, setIsGeneratingPacking] = useState(false);
    const [isGeneratingTips, setIsGeneratingTips] = useState(false);
    const [aiItinerary, setAiItinerary] = useState<any>(null);
    const [aiPackingList, setAiPackingList] = useState<any>(null);
    const [aiTips, setAiTips] = useState<any>(null);

    // Destination Overview
    const [overview, setOverview] = useState<any>(null);
    const [isLoadingOverview, setIsLoadingOverview] = useState(false);

    // Notes State
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editNoteContent, setEditNoteContent] = useState("");
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);
    
    // File Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);

    // Expense State
    const [expenses, setExpenses] = useState<any[]>([]);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [expenseDesc, setExpenseDesc] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("Food");
    const [isAddingExpense, setIsAddingExpense] = useState(false);

    // Invite & Cover
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState("");
    const [isChangingCover, setIsChangingCover] = useState(false);
    
    // Cover Image Upload Ref
    const coverImageRef = useRef<HTMLInputElement>(null);

    const [overviewTab, setOverviewTab] = useState<"overview" | "info">("overview");
    const [highlights, setHighlights] = useState<any>(null);

    const getToken = () => localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const fetchTripDetails = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTrip(data);
                setNotes(data.notes || []);
                setExpenses(data.expenses || []);
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Failed to fetch trip", error);
        } finally {
            setIsLoading(false);
        }
    }, [tripId, apiUrl, router]);

    useEffect(() => { if (tripId) fetchTripDetails(); }, [tripId, fetchTripDetails]);

    // Fetch AI destination overview
    useEffect(() => {
        if (!trip?.destination || overview) return;
        setIsLoadingOverview(true);
        fetch(`${apiUrl}/ai/destination-overview?destination=${encodeURIComponent(trip.destination)}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setOverview(data); })
        .catch(() => {})
        .finally(() => setIsLoadingOverview(false));
    }, [trip?.destination, apiUrl, overview]);

    // Fetch destination highlights (places, foods, culture)
    useEffect(() => {
        if (!trip?.destination || highlights) return;
        fetch(`${apiUrl}/ai/destination-highlights?destination=${encodeURIComponent(trip.destinationCity || trip.destination)}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setHighlights(data); })
        .catch(() => {});
    }, [trip?.destination, apiUrl, highlights]);

    // ─── AI Handler ─────────────────────────────────────────────────
    const handleGenerateAi = async (type: 'itinerary' | 'packing-list' | 'travel-tips') => {
        try {
            if (type === 'itinerary') setIsGeneratingItinerary(true);
            if (type === 'packing-list') setIsGeneratingPacking(true);
            if (type === 'travel-tips') setIsGeneratingTips(true);

            const res = await fetch(`${apiUrl}/ai/${type === 'itinerary' ? 'generate-itinerary' : type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ tripId }),
            });

            if (!res.ok) throw new Error(`Failed to generate ${type}`);
            const data = await res.json();

            if (type === 'itinerary') setAiItinerary(data.generatedItinerary || data);
            if (type === 'packing-list') setAiPackingList(data);
            if (type === 'travel-tips') setAiTips(data.tips || data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingItinerary(false);
            setIsGeneratingPacking(false);
            setIsGeneratingTips(false);
        }
    };

    // ─── File Upload Handler ─────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append("file", file);
        
        try {
            const res = await fetch(`${apiUrl}/uploads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` }, // depends on api auth
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setAttachmentUrl(data.url);
                setAttachmentName(file.name);
            } else {
                console.error("Upload failed");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // ─── Notes Handler ──────────────────────────────────────────────
    const handleAddNote = async () => {
        if (!newNote.trim() && !attachmentUrl) return;
        setIsAddingNote(true);
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ content: newNote, fileUrl: attachmentUrl }),
            });
            if (res.ok) {
                await fetchTripDetails();
                setNewNote("");
                setAttachmentUrl(null);
                setAttachmentName(null);
            }
        } catch (e) { console.error(e); }
        finally { setIsAddingNote(false); }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await fetch(`${apiUrl}/notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (e) { console.error(e); }
    };

    // ─── Expense Handler ────────────────────────────────────────────
    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseDesc.trim() || !expenseAmount) return;
        setIsAddingExpense(true);
        try {
            const res = await fetch(`${apiUrl}/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    tripId,
                    description: expenseDesc,
                    amount: Number(expenseAmount),
                    category: expenseCategory,
                }),
            });
            if (res.ok) {
                await fetchTripDetails();
                setExpenseDesc(""); setExpenseAmount(""); setShowExpenseForm(false);
            }
        } catch (e) { console.error(e); }
        finally { setIsAddingExpense(false); }
    };

    // ─── Invite Handler ─────────────────────────────────────────────
    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setIsInviting(true); setInviteMsg("");
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ email: inviteEmail }),
            });
            const data = await res.json();
            if (res.ok) { setInviteMsg("Invited!"); setInviteEmail(""); await fetchTripDetails(); }
            else { setInviteMsg(data.message || "Failed"); }
        } catch { setInviteMsg("Error"); }
        finally { setIsInviting(false); }
    };

    // ─── Change Cover Image ─────────────────────────────────────────
    const handleChangeCoverAuto = async () => {
        const city = trip.destinationCity || trip.destination;
        setIsChangingCover(true);
        try {
            const imgRes = await fetch(`${apiUrl}/images/destination?city=${encodeURIComponent(city)}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (imgRes.ok) {
                const imgData = await imgRes.json();
                if (imgData.imageUrl) {
                    await updateCoverImage(imgData.imageUrl);
                }
            } else {
                console.error("Image fetch failed:", await imgRes.text());
            }
        } catch (e) { console.error(e); }
        finally { setIsChangingCover(false); }
    };

    const handleCustomCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsChangingCover(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch(`${apiUrl}/uploads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });
            if (uploadRes.ok) {
                const data = await uploadRes.json();
                await updateCoverImage(data.url);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsChangingCover(false);
            if (coverImageRef.current) coverImageRef.current.value = "";
        }
    };

    const updateCoverImage = async (imageUrl: string) => {
        try {
            const updateRes = await fetch(`${apiUrl}/trips/${tripId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ coverImage: imageUrl }),
            });
            if (updateRes.ok) {
                // Optimistic update + fresh fetch
                setTrip((prev: any) => ({ ...prev, coverImage: imageUrl }));
                await fetchTripDetails();
            } else {
                const err = await updateRes.text();
                console.error("Cover image update failed:", err);
            }
        } catch (e) { console.error(e); }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-zinc-500 animate-spin" />
            </div>
        );
    }

    if (!trip) return null;

    const dayCount = getDayCount(trip.startDate, trip.endDate);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const heroImage = trip.coverImage || "";

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-zinc-800 pb-20">
            {/* ═══ Hero Section ═══ */}
            <div className="relative h-[45vh] w-full min-h-[380px]">
                {/* Cover Image Background */}
                {heroImage ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-zinc-900 to-zinc-950">
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                    </div>
                )}

                <div className="absolute top-6 left-6 z-20 flex gap-2">
                    <Button variant="ghost" className="text-white hover:bg-white/20 backdrop-blur-md rounded-full px-4" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>

                <div className="absolute top-6 right-6 z-20 flex gap-2">
                    <input type="file" ref={coverImageRef} onChange={handleCustomCoverUpload} className="hidden" accept="image/*" />
                    <DropdownMenu>
                        <DropdownMenuTrigger disabled={isChangingCover} className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-white hover:bg-white/20 backdrop-blur-md rounded-full px-4 h-10">
                            {isChangingCover ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                            {isChangingCover ? "Updating..." : "Change Cover"}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                            <DropdownMenuItem onClick={handleChangeCoverAuto} className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                Auto Generate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => coverImageRef.current?.click()} className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2">
                                <UploadCloud className="w-4 h-4 text-emerald-400" />
                                Upload Custom
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 z-10 max-w-7xl mx-auto flex flex-col items-start gap-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-medium uppercase tracking-wider text-zinc-200">
                                {trip.status || "Planning"}
                            </span>
                            {trip.travelType && (
                                <span className="px-3 py-1 bg-purple-600/30 backdrop-blur-md border border-purple-500/30 rounded-full text-xs font-medium text-purple-200">
                                    {trip.travelType}
                                </span>
                            )}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg">{trip.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-zinc-300 mt-2 text-sm md:text-base font-medium">
                            <span className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-blue-400" /> {trip.destinationCity || trip.destination}</span>
                            <span className="flex items-center"><Calendar className="w-5 h-5 mr-2 text-green-400" /> {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}</span>
                            <span className="px-3 py-1 bg-emerald-600/20 border border-emerald-600/30 rounded-full text-emerald-300 text-sm font-bold">{dayCount} day{dayCount > 1 ? "s" : ""}</span>
                            <span className="flex items-center"><Users className="w-5 h-5 mr-2 text-purple-400" /> {trip._count?.members || trip.members?.length || 1} Explorers</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ═══ Dashboard Content ═══ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
                <Tabs defaultValue="planner" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-2xl mb-8 flex w-full md:w-auto overflow-x-auto justify-start">
                        <TabsTrigger value="planner" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            <PlaneTakeoff className="w-4 h-4 mr-2" /> Planner
                        </TabsTrigger>
                        <TabsTrigger value="map" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            <MapIcon className="w-4 h-4 mr-2" /> Map
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            <Receipt className="w-4 h-4 mr-2" /> Ledger
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">
                            <StickyNote className="w-4 h-4 mr-2" /> Notes
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-xl px-6 py-3 data-[state=active]:bg-purple-900/40 data-[state=active]:text-purple-300 text-zinc-400">
                            <Sparkles className="w-4 h-4 mr-2" /> Ask AI
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══ PLANNER TAB ═══ */}
                    <TabsContent value="planner" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Overview Section */}
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardContent className="p-6">
                                        <div className="flex gap-2 mb-6">
                                            <button onClick={() => setOverviewTab("overview")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${overviewTab === "overview" ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                                                <Info className="w-4 h-4" /> Overview
                                            </button>
                                            <button onClick={() => setOverviewTab("info")} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${overviewTab === "info" ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                                                <Globe className="w-4 h-4" /> General Information
                                            </button>
                                        </div>

                                        {isLoadingOverview ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                                                <span className="ml-2 text-zinc-500">Loading destination info...</span>
                                            </div>
                                        ) : overviewTab === "overview" ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                                                    <p className="text-zinc-400 leading-relaxed">{overview?.description || `Discover the beauty of ${trip.destination}.`}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-2">History</h3>
                                                    <p className="text-zinc-400 leading-relaxed">{overview?.history || `${trip.destination} has a rich cultural heritage.`}</p>
                                                </div>
                                                {overview?.topAttractions && Array.isArray(overview.topAttractions) && (
                                                    <div>
                                                        <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                                            <MapPin className="w-5 h-5" /> Top Attractions
                                                        </h3>
                                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {overview.topAttractions.map((attraction: string, i: number) => (
                                                                <li key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-start gap-3">
                                                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <span className="text-xs font-bold text-emerald-400">{i+1}</span>
                                                                    </div>
                                                                    <p className="text-sm text-zinc-300 leading-relaxed">{attraction}</p>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {overview?.bestTimeToVisit && (
                                                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                            <Calendar className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white mb-1">Best Time to Visit</h4>
                                                            <p className="text-sm text-zinc-400 leading-relaxed">{overview.bestTimeToVisit}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { icon: Banknote, label: "Currency", value: overview?.currency || "—" },
                                                    { icon: Clock, label: "Timezone", value: overview?.timezone || "—" },
                                                    { icon: Languages, label: "Languages", value: overview?.language || "—" },
                                                    { icon: ThermometerSun, label: "Weather", value: overview?.weather || "—" },
                                                    { icon: Bus, label: "Transport", value: overview?.transport || "—" },
                                                    { icon: Globe, label: "Country", value: trip.destinationCountry || "—" },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center flex-shrink-0">
                                                            <item.icon className="w-5 h-5 text-zinc-300" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-zinc-500">{item.label}</p>
                                                            <p className="text-sm text-zinc-200 font-medium">{item.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Itinerary Timeline */}
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl min-h-[400px]">
                                    <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/60 rounded-t-xl">
                                        <CardTitle className="text-2xl text-white">Daily Itinerary</CardTitle>
                                        <p className="text-zinc-400 text-sm mt-1">Plan your routes, hotels, and sights.</p>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {aiItinerary ? (
                                            <div className="space-y-8">
                                                {aiItinerary.map((day: any, idx: number) => (
                                                    <div key={idx} className="relative pl-8 border-l-2 border-zinc-800 pt-4">
                                                        <div className="absolute -left-[11px] top-4 w-5 h-5 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white mb-4">Day {day.day || day.dayNumber || idx + 1}</h3>
                                                        <div className="space-y-4">
                                                            {(day.activities || []).map((act: any, i: number) => (
                                                                <Card key={i} className="bg-zinc-900/80 border-zinc-800">
                                                                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                                        <div>
                                                                            {act.time && <span className="text-xs text-purple-400 font-mono">{act.time}</span>}
                                                                            <h4 className="font-semibold text-zinc-200">{act.title || act.description}</h4>
                                                                            {act.description && act.title && <p className="text-sm text-zinc-400 mt-1">{act.description}</p>}
                                                                        </div>
                                                                        {act.costEstimate !== undefined && (
                                                                            <div className="text-emerald-400 font-mono text-sm border border-emerald-900 bg-emerald-950/30 px-3 py-1 rounded-full whitespace-nowrap">
                                                                                ₹{act.costEstimate}
                                                                            </div>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                                    <PlaneTakeoff className="w-8 h-8 text-zinc-500" />
                                                </div>
                                                <h3 className="text-xl font-medium text-white mb-2">Blank Canvas</h3>
                                                <p className="text-zinc-500 max-w-sm">No activities yet. Use the <strong>Ask AI</strong> tab to generate a day-by-day itinerary.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Places to Visit */}
                                {highlights?.attractions && (
                                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                        <CardHeader className="border-b border-zinc-800/50 pb-4">
                                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-emerald-400" /> Places to Visit
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {highlights.attractions.map((place: any, i: number) => (
                                                    <div key={i} className="group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 transition-colors">
                                                        <div className="h-32 bg-zinc-800 relative overflow-hidden">
                                                            <img
                                                                src={`https://source.unsplash.com/400x200/?${encodeURIComponent(place.name + ' ' + (trip.destinationCity || trip.destination))}`}
                                                                alt={place.name}
                                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=60&w=400&auto=format`; }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                                                            <span className="absolute bottom-2 left-3 text-white text-sm font-semibold drop-shadow">{place.name}</span>
                                                        </div>
                                                        <p className="text-xs text-zinc-400 p-3 leading-relaxed">{place.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Things to Do */}
                                {highlights?.thingsToDo && (
                                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                        <CardHeader className="border-b border-zinc-800/50 pb-4">
                                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-purple-400" /> Things to Do
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {highlights.thingsToDo.map((item: any, i: number) => (
                                                    <div key={i} className="flex items-start gap-3 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:border-purple-500/30 transition-colors">
                                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-bold text-purple-400">{i + 1}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{item.name}</p>
                                                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Foods & Culture */}
                                {highlights?.foods && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                            <CardHeader className="border-b border-zinc-800/50 pb-4">
                                                <CardTitle className="text-lg text-white flex items-center gap-2">
                                                    <Globe className="w-5 h-5 text-amber-400" /> Must-Try Foods
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-2">
                                                {highlights.foods.map((item: any, i: number) => (
                                                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                                                        <span className="text-amber-400 text-lg">🍽</span>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{item.name}</p>
                                                            <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>

                                        {highlights?.culture && (
                                            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                                <CardHeader className="border-b border-zinc-800/50 pb-4">
                                                    <CardTitle className="text-lg text-white flex items-center gap-2">
                                                        <Languages className="w-5 h-5 text-rose-400" /> Culture & Festivals
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 space-y-2">
                                                    {highlights.culture.map((item: any, i: number) => (
                                                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                                                            <span className="text-rose-400 text-lg">🎭</span>
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{item.name}</p>
                                                                <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Sidebar Widgets */}
                            <div className="space-y-6">
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardContent className="p-6">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Trip Stats</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                                                <p className="text-2xl font-bold text-white">{dayCount}</p>
                                                <p className="text-xs text-zinc-500">Days</p>
                                            </div>
                                            <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                                                <p className="text-2xl font-bold text-white">{trip._count?.members || trip.members?.length || 1}</p>
                                                <p className="text-xs text-zinc-500">Explorers</p>
                                            </div>
                                            <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                                                <p className="text-2xl font-bold text-emerald-400">₹{totalExpenses.toLocaleString()}</p>
                                                <p className="text-xs text-zinc-500">Spent</p>
                                            </div>
                                            <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                                                <p className="text-2xl font-bold text-purple-400">₹{(trip.budget || 0).toLocaleString()}</p>
                                                <p className="text-xs text-zinc-500">Budget</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardHeader><CardTitle className="text-lg text-white font-medium">Fellow Explorers</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        {trip.members?.map((member: any) => (
                                            <div key={member.id} className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-zinc-700">
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-300">{member.user.name?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{member.user.name || "Traveller"}</p>
                                                    <p className="text-xs text-zinc-500">{member.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t border-zinc-800 space-y-2">
                                            <div className="flex gap-2">
                                                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email to invite" className="bg-zinc-950 border-zinc-800 text-sm h-9" />
                                                <Button onClick={handleInvite} disabled={isInviting} size="sm" className="bg-purple-600 hover:bg-purple-700 h-9">
                                                    <UserPlus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {inviteMsg && <p className="text-xs text-zinc-400">{inviteMsg}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ═══ MAP TAB ═══ */}
                    <TabsContent value="map" className="mt-0 outline-none">
                        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
                            <CardContent className="p-6">
                                <TripMap
                                    destination={trip.destinationCity || trip.destination}
                                    latitude={trip.latitude}
                                    longitude={trip.longitude}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ═══ LEDGER TAB ═══ */}
                    <TabsContent value="expenses" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardHeader className="border-b border-zinc-800/50 flex flex-row items-center justify-between rounded-t-xl">
                                        <div>
                                            <CardTitle className="text-2xl text-white">Expedition Ledger</CardTitle>
                                            <p className="text-zinc-400 text-sm mt-1">Track who paid for what.</p>
                                        </div>
                                        <Button onClick={() => setShowExpenseForm(!showExpenseForm)} className="bg-white text-black hover:bg-zinc-200 rounded-full px-4 h-9">
                                            <Plus className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        {showExpenseForm && (
                                            <form onSubmit={handleAddExpense} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-3">
                                                <Input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} placeholder="What was this for?" className="bg-zinc-950 border-zinc-800" required />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="Amount (₹)" className="bg-zinc-950 border-zinc-800" required />
                                                    <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white">
                                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <Button type="submit" disabled={isAddingExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    {isAddingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Expense"}
                                                </Button>
                                            </form>
                                        )}
                                        {expenses.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <Receipt className="w-12 h-12 text-zinc-600 mb-4" />
                                                <h3 className="text-lg font-medium text-white mb-1">No expenses yet</h3>
                                                <p className="text-zinc-500 text-sm">Start tracking your trip spending.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {expenses.map((exp: any) => (
                                                    <div key={exp.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center">
                                                                <Receipt className="w-4 h-4 text-emerald-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{exp.description}</p>
                                                                <p className="text-xs text-zinc-500">
                                                                    {exp.payer?.name || "You"} • {exp.category || "General"} • {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-emerald-400 font-bold font-mono">₹{exp.amount?.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardHeader><CardTitle className="text-lg text-white">Summary</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-center p-6 bg-zinc-800/50 rounded-xl">
                                            <p className="text-3xl font-bold text-emerald-400">₹{totalExpenses.toLocaleString()}</p>
                                            <p className="text-sm text-zinc-500 mt-1">Total Spent</p>
                                        </div>
                                        {trip.budget && trip.budget > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">Budget</span>
                                                    <span className="text-zinc-200">₹{trip.budget.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">Remaining</span>
                                                    <span className={`font-medium ${(trip.budget - totalExpenses) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                        ₹{(trip.budget - totalExpenses).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                                                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (totalExpenses / trip.budget) * 100)}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ═══ NOTES TAB ═══ */}
                    <TabsContent value="notes" className="mt-0 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardHeader className="border-b border-zinc-800/50 rounded-t-xl">
                                        <CardTitle className="text-2xl text-white flex items-center"><StickyNote className="w-5 h-5 mr-2" /> Trip Notes</CardTitle>
                                        <p className="text-zinc-400 text-sm mt-1">Add important points, reminders, and files for the trip.</p>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex flex-col gap-3">
                                            {attachmentUrl && (
                                                <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 p-2 rounded-lg max-w-sm">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                                        <span className="text-sm text-zinc-300 truncate">{attachmentName}</span>
                                                    </div>
                                                    <button onClick={() => { setAttachmentUrl(null); setAttachmentName(null); }} className="text-zinc-500 hover:text-red-400 p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                                                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} variant="outline" className="h-10 px-3 bg-zinc-900 border-zinc-800">
                                                    {isUploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4 text-zinc-400" />}
                                                </Button>
                                                <Input 
                                                    value={newNote} 
                                                    onChange={e => setNewNote(e.target.value)} 
                                                    placeholder={attachmentUrl ? "Add a description (optional)..." : "Write a note..."} 
                                                    className="bg-zinc-950 border-zinc-800 flex-1" 
                                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddNote()} 
                                                />
                                                <Button onClick={handleAddNote} disabled={isAddingNote || (!newNote.trim() && !attachmentUrl)} className="bg-white text-black hover:bg-zinc-200 h-10 px-4">
                                                    {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        {notes.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <StickyNote className="w-12 h-12 text-zinc-600 mb-4" />
                                                <h3 className="text-lg font-medium text-white mb-1">No notes yet</h3>
                                                <p className="text-zinc-500 text-sm">Add important points, reminders, or checklists.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {notes.map((note: any) => (
                                                    <div key={note.id} className="group p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-3 w-full">
                                                                <Avatar className="h-8 w-8 border border-zinc-700 mt-0.5 shrink-0">
                                                                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">{note.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium text-zinc-200">{note.user?.name || "You"}</span>
                                                                            <span className="text-xs text-zinc-600">
                                                                                {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at {new Date(note.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {editingNoteId === note.id ? (
                                                                        <div className="mt-2 flex gap-2 w-full">
                                                                            <Input 
                                                                                value={editNoteContent}
                                                                                onChange={e => setEditNoteContent(e.target.value)}
                                                                                className="bg-zinc-950 border-zinc-700 h-8 text-sm"
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') handleUpdateNote(note.id);
                                                                                    if (e.key === 'Escape') setEditingNoteId(null);
                                                                                }}
                                                                            />
                                                                            <Button onClick={() => handleUpdateNote(note.id)} disabled={isUpdatingNote} size="sm" className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                                                                <Save className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button onClick={() => setEditingNoteId(null)} size="sm" variant="ghost" className="h-8 px-2">
                                                                                <X className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{note.content}</p>
                                                                    )}

                                                                    {note.fileUrl && !editingNoteId && (
                                                                        <div className="mt-3">
                                                                            {note.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                                                                <a href={note.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                                    <img src={note.fileUrl} alt="attachment" className="max-w-full h-auto max-h-48 rounded-lg border border-zinc-700 object-cover" />
                                                                                </a>
                                                                            ) : (
                                                                                <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors">
                                                                                    <Download className="w-4 h-4 text-emerald-400" /> View Attachment
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                                <button onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }} className="text-zinc-500 hover:text-blue-400 p-1">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteNote(note.id)} className="text-zinc-500 hover:text-red-400 p-1">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div>
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardContent className="p-6">
                                        <FileText className="w-8 h-8 text-emerald-400 mb-4" />
                                        <h3 className="text-lg font-medium text-white mb-2">Trip Attachments</h3>
                                        <p className="text-zinc-500 text-sm mb-4">View all files attached to this trip's notes.</p>
                                        <div className="space-y-2">
                                            {notes.filter(n => n.fileUrl).length === 0 ? (
                                                <p className="text-zinc-600 text-sm italic">No files attached yet.</p>
                                            ) : (
                                                notes.filter(n => n.fileUrl).map((note) => (
                                                    <a key={note.id} href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-zinc-800/30 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors">
                                                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                                        <span className="text-sm text-zinc-300 truncate flex-1">Attachment from {note.user?.name || "User"}</span>
                                                        <Download className="w-4 h-4 text-zinc-500" />
                                                    </a>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ═══ ASK AI TAB ═══ */}
                    <TabsContent value="ai" className="mt-0 outline-none">
                        <Card className="bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border-purple-900/30 backdrop-blur-xl">
                            <CardContent className="py-16 md:py-24 flex flex-col items-center justify-center text-center">
                                <Sparkles className="w-16 h-16 text-purple-400 mb-6 animate-pulse" />
                                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4">JournEaze AI Copilot</h2>
                                <p className="text-lg md:text-xl text-purple-200/60 max-w-3xl leading-relaxed">
                                    Let AI generate day-by-day itineraries, packing lists, and local tips for {trip.destinationCity || trip.destination}.
                                </p>
                                <div className="mt-12 flex flex-col md:flex-row justify-center gap-4 w-full md:w-auto px-4">
                                    <Button onClick={() => handleGenerateAi('itinerary')} disabled={isGeneratingItinerary || !!aiItinerary}
                                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] h-14 md:px-8 rounded-xl w-full md:w-auto text-base">
                                        {isGeneratingItinerary ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : aiItinerary ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        {isGeneratingItinerary ? "Generating..." : aiItinerary ? "Itinerary Generated" : "Generate Itinerary"}
                                    </Button>
                                    <Button onClick={() => handleGenerateAi('packing-list')} disabled={isGeneratingPacking || !!aiPackingList}
                                        variant="outline" className="border-purple-500/30 hover:bg-purple-900/40 text-purple-300 h-14 md:px-8 rounded-xl backdrop-blur-md w-full md:w-auto text-base">
                                        {isGeneratingPacking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : aiPackingList ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        {isGeneratingPacking ? "Analyzing..." : aiPackingList ? "Packing List Built" : "Build Packing List"}
                                    </Button>
                                    <Button onClick={() => handleGenerateAi('travel-tips')} disabled={isGeneratingTips || !!aiTips}
                                        variant="outline" className="border-purple-500/30 hover:bg-purple-900/40 text-purple-300 h-14 md:px-8 rounded-xl backdrop-blur-md w-full md:w-auto text-base">
                                        {isGeneratingTips ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : aiTips ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        {isGeneratingTips ? "Researching..." : aiTips ? "Tips Researched" : "Local Tips & Survival"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {(aiPackingList || aiTips) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                {aiPackingList && (
                                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                        <CardHeader className="border-b border-zinc-800/50">
                                            <CardTitle className="text-xl text-white flex items-center"><Sparkles className="w-4 h-4 mr-2 text-purple-400" /> AI Packing List</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {Object.entries(aiPackingList).map(([category, items]: [string, any]) => (
                                                    <div key={category}>
                                                        <h4 className="font-semibold text-zinc-300 capitalize mb-3">{category.replace(/_/g, ' ')}</h4>
                                                        <ul className="grid grid-cols-2 gap-2">
                                                            {Array.isArray(items) && items.map((item, idx) => (
                                                                <li key={idx} className="flex items-start text-sm text-zinc-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mt-1.5 mr-2 flex-shrink-0"></div>
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {aiTips && (
                                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                        <CardHeader className="border-b border-zinc-800/50">
                                            <CardTitle className="text-xl text-white flex items-center"><Sparkles className="w-4 h-4 mr-2 text-purple-400" /> Survival Tips</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4 text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                {typeof aiTips === 'string' ? (
                                                    (() => {
                                                        try { const arr = JSON.parse(aiTips); return Array.isArray(arr) ? arr.map((t: string, i: number) => <p key={i} className="flex gap-2"><span className="text-purple-400">•</span>{t}</p>) : aiTips; } catch { return aiTips; }
                                                    })()
                                                ) : Array.isArray(aiTips) ? aiTips.map((t: string, i: number) => <p key={i} className="flex gap-2"><span className="text-purple-400">•</span>{t}</p>) : JSON.stringify(aiTips, null, 2)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
