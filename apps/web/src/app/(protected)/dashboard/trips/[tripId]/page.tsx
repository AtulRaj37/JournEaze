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
    Info, FileText, UserPlus, ImageIcon, Paperclip, X, Edit2, Save, Download, UploadCloud,
    Link2, Copy, Hash, Mail, QrCode, Check, Utensils, Bed, ExternalLink, Camera, Compass, Briefcase
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
import TripItineraryBoard from "@/components/TripItineraryBoard";
import TripLedgerBoard from "@/components/TripLedgerBoard";
import TripNotesBoard from "@/components/TripNotesBoard";
import TripAIBoard from "@/components/TripAIBoard";
import TripPackingBoard from "@/components/TripPackingBoard";
import TripExploreBoard from "@/components/TripExploreBoard";
import WeatherWidget from "@/components/WeatherWidget";

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

    const handlePrintPDF = () => {
        setTimeout(() => window.print(), 100);
    };

    const handleWhatsAppShare = () => {
        if (!trip) return;
        let txt = `🌍 *${trip.title}*\n📍 ${trip.destination}\n📅 ${fmtDate(trip.startDate)} - ${fmtDate(trip.endDate)}\n\n*Itinerary Highlights:*\n`;
        if (trip.aiItinerary && Array.isArray(trip.aiItinerary)) {
            trip.aiItinerary.slice(0, 3).forEach((day: any) => {
                txt += `\nDay ${day.dayNumber}: ${day.theme}\n`;
                day.activities?.slice(0, 2).forEach((act: any) => {
                    txt += `- ${act.time}: ${act.title}\n`;
                });
            });
            if (trip.aiItinerary.length > 3) txt += `\n...and ${trip.aiItinerary.length - 3} more days!\n`;
        }
        txt += `\n👉 View full trip on JournEaze: ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Trip link copied to clipboard!");
    };

    // AI States
    const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
    const [isGeneratingPacking, setIsGeneratingPacking] = useState(false);
    const [isGeneratingTips, setIsGeneratingTips] = useState(false);
    const [aiItinerary, setAiItinerary] = useState<any>(null);
    const [aiPackingList, setAiPackingList] = useState<any>(null);
    const [aiTips, setAiTips] = useState<any>(null);

    // Destination Overview
    const [overview, setOverview] = useState<any>(null);

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
    const [inviteMode, setInviteMode] = useState<'link'|'id'|'email'>('link');
    const [inviteUserId, setInviteUserId] = useState("");
    const [linkCopied, setLinkCopied] = useState(false);
    const [idCopied, setIdCopied] = useState(false);
    const [isChangingCover, setIsChangingCover] = useState(false);
    const [isTogglingPublic, setIsTogglingPublic] = useState(false);
    
    // Cover Image Upload Ref
    const coverImageRef = useRef<HTMLInputElement>(null);

    const [overviewTab, setOverviewTab] = useState<"overview" | "info">("overview");
    const [highlights, setHighlights] = useState<any>(null);

    // Explore Tab State
    const [explorePlaces, setExplorePlaces] = useState<any[]>([]);
    const [isLoadingExplore, setIsLoadingExplore] = useState(false);
    const [exploreCategory, setExploreCategory] = useState<string>("All");
    const [selectedPlaces, setSelectedPlaces] = useState<Set<number>>(new Set());

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
                
                // Hydrate React AI States directly from DB Cache to save tokens!
                if (data.aiItinerary) setAiItinerary(data.aiItinerary);
                if (data.aiPackingList) setAiPackingList(data.aiPackingList);
                if (data.aiTravelTips) setAiTips(data.aiTravelTips);
                if (data.explorePlaces && Array.isArray(data.explorePlaces)) setExplorePlaces(data.explorePlaces);
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

    const [aiInsightsLoaded, setAiInsightsLoaded] = useState(false);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);

    const [customPrompt, setCustomPrompt] = useState("");

    // Auto-load AI Destination Insights when trip data is available
    useEffect(() => {
        if (trip?.destination && !aiInsightsLoaded) {
            fetchAiInsights();
        }
        // Restore cached custom prompt
        if (trip?.aiCustomPrompt && !customPrompt) {
            setCustomPrompt(trip.aiCustomPrompt);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trip?.destination]);

    const fetchAiInsights = async () => {
        if (!trip?.destination || aiInsightsLoaded) return;
        setIsLoadingInsights(true);
        try {
            const dest = encodeURIComponent(trip.destinationCity || trip.destination);
            const headers = { Authorization: `Bearer ${getToken()}` };
            
            const res = await fetch(`${apiUrl}/ai/destination-info?destination=${dest}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setOverview(data.overview);
                setHighlights(data.highlights);
            }
            setAiInsightsLoaded(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingInsights(false);
        }
    };

    // ─── AI Handler ─────────────────────────────────────────────────
    const handleGenerateAi = async (type: 'itinerary' | 'packing-list' | 'travel-tips') => {
        try {
            if (type === 'itinerary') setIsGeneratingItinerary(true);
            if (type === 'packing-list') setIsGeneratingPacking(true);
            if (type === 'travel-tips') setIsGeneratingTips(true);

            const bodyPayload: any = { tripId };
            if (type === 'itinerary' && customPrompt.trim() !== '') {
                bodyPayload.customPrompt = customPrompt.trim();
            }

            const res = await fetch(`${apiUrl}/ai/${type === 'itinerary' ? 'generate-itinerary' : type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(bodyPayload),
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

    const handleUpdateNote = async (noteId: string) => {
        if (!editNoteContent.trim()) return;
        setIsUpdatingNote(true);
        try {
            const res = await fetch(`${apiUrl}/notes/${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ content: editNoteContent }),
            });
            if (res.ok) {
                setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editNoteContent } : n));
                setEditingNoteId(null);
                setEditNoteContent("");
            }
        } catch (e) { console.error(e); }
        finally { setIsUpdatingNote(false); }
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

    const handleTogglePublic = async () => {
        setIsTogglingPublic(true);
        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ isPublic: !trip.isPublic }),
            });
            if (res.ok) {
                setTrip((prev: any) => ({ ...prev, isPublic: !prev.isPublic }));
            }
        } catch (e) { console.error(e); }
        finally { setIsTogglingPublic(false); }
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
                    <Button 
                        onClick={handleTogglePublic} 
                        variant={trip.isPublic ? "default" : "outline"} 
                        className={`hidden sm:flex h-10 rounded-full px-4 border transition-all duration-300 ${trip.isPublic ? 'bg-orange-600 hover:bg-orange-500 text-white border-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 border-zinc-700 backdrop-blur-md'}`}
                        disabled={isTogglingPublic}
                    >
                        {trip.isPublic ? (
                            <><Globe className="w-4 h-4 mr-2" /> Public Template</>
                        ) : (
                            <><Globe className="w-4 h-4 mr-2 opacity-50" /> Make Public</>
                        )}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-white hover:bg-white/20 backdrop-blur-md rounded-full px-4 h-10 border border-white/20">
                            <Download className="w-4 h-4 mr-2" /> Export Trip
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-100">
                            <DropdownMenuItem onClick={handlePrintPDF} className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2">
                                <FileText className="w-4 h-4 text-rose-400" /> Save as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleWhatsAppShare} className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2">
                                <Mail className="w-4 h-4 text-orange-400" /> Share via WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyLink} className="hover:bg-zinc-800 cursor-pointer flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-blue-400" /> Copy Trip Link
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                <UploadCloud className="w-4 h-4 text-orange-400" />
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
                            <span className="px-3 py-1 bg-orange-600/20 border border-orange-600/30 rounded-full text-orange-300 text-sm font-bold">{dayCount} day{dayCount > 1 ? "s" : ""}</span>
                            <span className="flex items-center"><Users className="w-5 h-5 mr-2 text-purple-400" /> {trip._count?.members || trip.members?.length || 1} Explorers</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ═══ Dashboard Content ═══ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 bg-zinc-950 pb-10">
                <Tabs defaultValue="planner" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-2xl mb-8 flex w-full md:w-auto overflow-x-auto justify-start flex-nowrap scrollbar-hide">
                        <TabsTrigger value="planner" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <PlaneTakeoff className="w-4 h-4 mr-2" /> Planner
                        </TabsTrigger>
                        <TabsTrigger value="map" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <MapIcon className="w-4 h-4 mr-2" /> Map
                        </TabsTrigger>
                        <TabsTrigger value="packing" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <Briefcase className="w-4 h-4 mr-2" /> Packing List
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <Receipt className="w-4 h-4 mr-2" /> Ledger
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-xl px-6 py-3 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <StickyNote className="w-4 h-4 mr-2" /> Notes
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-xl px-6 py-3 data-[state=active]:bg-purple-900/40 data-[state=active]:text-purple-300 text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <Sparkles className="w-4 h-4 mr-2" /> Ask AI
                        </TabsTrigger>
                        <TabsTrigger value="explore" className="rounded-xl px-6 py-3 data-[state=active]:bg-orange-900/40 data-[state=active]:text-orange-300 text-zinc-400 whitespace-nowrap flex-shrink-0">
                            <Compass className="w-4 h-4 mr-2" /> Explore
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

                                        {isLoadingInsights ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                                <div className="relative">
                                                    <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                        <Loader2 className="w-7 h-7 animate-spin text-orange-400" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-white font-semibold">Generating AI Insights</p>
                                                    <p className="text-zinc-500 text-sm mt-1">Fetching destination data for {trip.destination}…</p>
                                                </div>
                                            </div>
                                        ) : !aiInsightsLoaded ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-5">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex items-center justify-center">
                                                    <Sparkles className="w-8 h-8 text-orange-400" />
                                                </div>
                                                <div className="text-center max-w-sm">
                                                    <h3 className="text-white font-bold text-lg mb-2">AI Destination Insights</h3>
                                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                                        Get AI-powered overview, history, top attractions, best time to visit, local foods, and cultural highlights for <span className="text-orange-400 font-medium">{trip.destination}</span>.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={fetchAiInsights}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-105"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    Generate AI Insights
                                                </button>
                                                <p className="text-zinc-600 text-xs">Results are cached — only calls AI once per destination</p>
                                            </div>
                                        ) : overviewTab === "overview" ? (
                                            <div className="space-y-4">
                                                <WeatherWidget 
                                                    latitude={trip.latitude} 
                                                    longitude={trip.longitude} 
                                                    destinationName={trip.destinationCity || trip.destination} 
                                                />
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
                                                        <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
                                                            <MapPin className="w-5 h-5" /> Top Attractions
                                                        </h3>
                                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {overview.topAttractions.map((attraction: string, i: number) => (
                                                                <li key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-start gap-3">
                                                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <span className="text-xs font-bold text-orange-400">{i+1}</span>
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
                                        <div className="mb-8 p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                                            <label className="block text-sm font-semibold text-zinc-200 mb-2">Customize your plan</label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Input 
                                                    value={customPrompt} 
                                                    onChange={(e) => setCustomPrompt(e.target.value)} 
                                                    placeholder="E.g. I arrive at 10 AM, prefer vegan food, and want a relaxed pace."
                                                    className="bg-zinc-950 border-zinc-800 text-white flex-1"
                                                />
                                                <Button 
                                                    onClick={() => handleGenerateAi('itinerary')} 
                                                    disabled={isGeneratingItinerary}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white font-semibold whitespace-nowrap"
                                                >
                                                    {isGeneratingItinerary ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                    )}
                                                    {aiItinerary ? "Regenerate Itinerary" : "Generate Itinerary"}
                                                </Button>
                                            </div>
                                        </div>

                                        {aiItinerary ? (
                                            <div className="mt-8">
                                                <TripItineraryBoard 
                                                    initialItinerary={aiItinerary} 
                                                    tripId={tripId} 
                                                    onUpdate={(newItinerary: any) => {
                                                        setAiItinerary(newItinerary);
                                                    }} 
                                                />
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
                                {/* Quick Bookings */}
                                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                    <CardHeader className="border-b border-zinc-800/50 pb-4">
                                        <CardTitle className="text-xl text-white flex items-center gap-2">
                                            <PlaneTakeoff className="w-5 h-5 text-blue-400" /> Quick Bookings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {(() => {
                                            const sDate = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '';
                                            const eDate = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '';
                                            const destQuery = encodeURIComponent(trip.destinationCity || trip.destination);
                                            const bookingLink = `https://www.booking.com/searchresults.html?ss=${destQuery}${sDate ? `&checkin=${sDate}` : ''}${eDate ? `&checkout=${eDate}` : ''}`;
                                            const flightsLink = `https://www.google.com/travel/flights?q=Flights+to+${destQuery}`;
                                            const transitLink = `https://www.makemytrip.com/`;
                                            const toursLink = `https://www.viator.com/searchResults/all?text=${destQuery}`;

                                            return (
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <a href={flightsLink} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800 hover:border-blue-500/50 transition-all group">
                                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <PlaneTakeoff className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">Flights</h5>
                                                            <p className="hidden sm:block text-xs text-zinc-500 line-clamp-1">Google Flights</p>
                                                        </div>
                                                    </a>
                                                    <a href={bookingLink} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800 hover:border-purple-500/50 transition-all group">
                                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <Bed className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">Hotels</h5>
                                                            <p className="hidden sm:block text-xs text-zinc-500 line-clamp-1">Booking.com</p>
                                                        </div>
                                                    </a>
                                                    <a href={transitLink} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800 hover:border-orange-500/50 transition-all group">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <Bus className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors">Transit</h5>
                                                            <p className="hidden sm:block text-xs text-zinc-500 line-clamp-1">MakeMyTrip</p>
                                                        </div>
                                                    </a>
                                                    <a href={toursLink} target="_blank" rel="noopener noreferrer" className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800 hover:border-orange-500/50 transition-all group">
                                                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0">
                                                            <Camera className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors">Activities</h5>
                                                            <p className="hidden sm:block text-xs text-zinc-500 line-clamp-1">Viator Tours</p>
                                                        </div>
                                                    </a>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>

                                {/* Places to Visit */}
                                {highlights?.attractions && (
                                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                                        <CardHeader className="border-b border-zinc-800/50 pb-4">
                                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-orange-400" /> Places to Visit
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {highlights.attractions.map((place: any, i: number) => (
                                                    <div key={i} className="group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 transition-colors">
                                                        <div className="h-32 bg-zinc-800 relative overflow-hidden">
                                                            <img
                                                                src={`${apiUrl}/images/search?query=${encodeURIComponent(place.name + ' ' + (trip.destinationCity || trip.destination))}&destination=${encodeURIComponent(trip.destinationCity || trip.destination)}`}
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
                                                <p className="text-2xl font-bold text-orange-400">₹{totalExpenses.toLocaleString()}</p>
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
                                    <CardHeader className="border-b border-zinc-800/50 pb-4">
                                        <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
                                            <Users className="w-4 h-4 text-purple-400" /> Fellow Explorers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        {/* Member List */}
                                        <div className="space-y-2">
                                        {trip.members?.map((member: any) => (
                                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                                                <Avatar className="h-9 w-9 border border-zinc-700">
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm">{member.user.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{member.user.name || "Traveller"}</p>
                                                    <p className="text-xs text-zinc-500 truncate">{member.user.email || ""}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    member.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' :
                                                    member.role === 'EDITOR' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-zinc-700/50 text-zinc-400'
                                                }`}>{member.role}</span>
                                            </div>
                                        ))}
                                        </div>

                                        {/* Invite Section */}
                                        <div className="border-t border-zinc-800 pt-4">
                                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Invite Explorers</p>

                                            {/* Mode Tabs */}
                                            <div className="flex gap-1 bg-zinc-800/60 p-1 rounded-lg mb-4">
                                                {([['link', Link2, 'Link'], ['id', Hash, 'User ID'], ['email', Mail, 'Email']] as const).map(([mode, Icon, label]) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => { setInviteMode(mode); setInviteMsg(""); }}
                                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                            inviteMode === mode ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
                                                        }`}
                                                    >
                                                        <Icon className="w-3 h-3" />{label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Link Mode */}
                                            {inviteMode === 'link' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-zinc-500">Share this link — anyone with it can request to join your trip.</p>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 overflow-hidden">
                                                            <Link2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                                            <span className="text-xs text-zinc-400 truncate font-mono">{typeof window !== 'undefined' ? `${window.location.origin}/join/${tripId}` : `...`}</span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${tripId}`); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                                                            className={`h-9 px-3 transition-all ${ linkCopied ? 'bg-orange-600 hover:bg-orange-700' : 'bg-zinc-700 hover:bg-zinc-600' } text-white`}
                                                        >
                                                            {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="h-px flex-1 bg-zinc-800" />
                                                        <span className="text-xs text-zinc-600">or share trip ID</span>
                                                        <div className="h-px flex-1 bg-zinc-800" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                                                            <Hash className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                                            <span className="text-xs text-zinc-400 font-mono truncate">{tripId}</span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => { navigator.clipboard.writeText(tripId); setIdCopied(true); setTimeout(() => setIdCopied(false), 2000); }}
                                                            className={`h-9 px-3 transition-all ${ idCopied ? 'bg-orange-600 hover:bg-orange-700' : 'bg-zinc-700 hover:bg-zinc-600' } text-white`}
                                                        >
                                                            {idCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* User ID Mode */}
                                            {inviteMode === 'id' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-zinc-500">Paste a user's ID to send them a direct invite. They can find their ID in their profile settings.</p>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                                            <Input
                                                                value={inviteUserId}
                                                                onChange={e => setInviteUserId(e.target.value)}
                                                                placeholder="Paste User ID here..."
                                                                className="bg-zinc-950 border-zinc-800 text-sm h-9 pl-8 font-mono"
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={async () => {
                                                                if (!inviteUserId.trim()) return;
                                                                setIsInviting(true); setInviteMsg("");
                                                                try {
                                                                    const res = await fetch(`${apiUrl}/trips/${tripId}/invite`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                                                                        body: JSON.stringify({ userId: inviteUserId.trim() }),
                                                                    });
                                                                    if (res.ok) { setInviteMsg('✅ Invited!'); setInviteUserId(''); }
                                                                    else { const d = await res.json().catch(() => ({})); setInviteMsg(d.message || '❌ Failed to invite'); }
                                                                } catch { setInviteMsg('❌ Network error'); }
                                                                finally { setIsInviting(false); }
                                                            }}
                                                            disabled={isInviting || !inviteUserId.trim()}
                                                            size="sm"
                                                            className="bg-purple-600 hover:bg-purple-700 h-9 px-3"
                                                        >
                                                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                    {inviteMsg && <p className={`text-xs ${inviteMsg.startsWith('✅') ? 'text-orange-400' : 'text-red-400'}`}>{inviteMsg}</p>}
                                                </div>
                                            )}

                                            {/* Email Mode */}
                                            {inviteMode === 'email' && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-zinc-500">Send an invite to someone's registered email address.</p>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                                            <Input
                                                                value={inviteEmail}
                                                                onChange={e => setInviteEmail(e.target.value)}
                                                                placeholder="friend@email.com"
                                                                type="email"
                                                                className="bg-zinc-950 border-zinc-800 text-sm h-9 pl-8"
                                                            />
                                                        </div>
                                                        <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} size="sm" className="bg-purple-600 hover:bg-purple-700 h-9 px-3">
                                                            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                    {inviteMsg && <p className={`text-xs ${inviteMsg.startsWith('✅') || inviteMsg.toLowerCase().includes('sent') ? 'text-orange-400' : 'text-red-400'}`}>{inviteMsg}</p>}
                                                </div>
                                            )}
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

                    {/* ═══ PACKING TAB ═══ */}
                    <TabsContent value="packing" className="mt-0 outline-none">
                        <TripPackingBoard
                            trip={trip}
                            onUpdate={fetchTripDetails}
                        />
                    </TabsContent>

                    {/* ═══ LEDGER TAB ═══ */}
                    <TabsContent value="expenses" className="mt-0 outline-none">
                        <TripLedgerBoard
                            tripId={tripId}
                            expenses={expenses}
                            settlements={trip.settlements || []}
                            budget={trip.budget || 0}
                            members={trip.members || []}
                            apiUrl={apiUrl}
                            getToken={getToken}
                            onUpdate={fetchTripDetails}
                        />
                    </TabsContent>

                    {/* ═══ NOTES TAB ═══ */}
                    <TabsContent value="notes" className="mt-0 outline-none">
                        <TripNotesBoard
                            tripId={tripId}
                            notes={notes}
                            apiUrl={apiUrl}
                            getToken={getToken}
                            onUpdate={fetchTripDetails}
                        />
                    </TabsContent>

                    {/* ═══ EXPLORE TAB ═══ */}
                    <TabsContent value="explore" className="mt-0 outline-none">
                        <TripExploreBoard
                            tripId={tripId}
                            trip={trip}
                            explorePlaces={explorePlaces}
                            setExplorePlaces={setExplorePlaces}
                            apiUrl={apiUrl}
                            getToken={getToken}
                            onUpdate={fetchTripDetails}
                        />
                    </TabsContent>


                    {/* ═══ ASK AI TAB ═══ */}
                    <TabsContent value="ai" className="mt-0 outline-none">
                        <TripAIBoard 
                            tripId={tripId} 
                            destination={trip.destinationCity || trip.destination} 
                            apiUrl={apiUrl} 
                            getToken={getToken} 
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
