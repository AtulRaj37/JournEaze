"use client";

import React, { useState, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StickyNote, Plus, FileText, Paperclip, X, Loader2, Download, Trash2, Edit2, Save, Pin, CheckSquare, AlignLeft, Palette, Tag } from "lucide-react";

interface TripNotesBoardProps {
    tripId: string;
    notes: any[];
    apiUrl: string;
    getToken: () => string | null;
    onUpdate: () => void;
}

// Safely parse note content which might be plain text or JSON
function parseNoteContent(rawContent: string) {
    try {
        const parsed = JSON.parse(rawContent);
        if (parsed && typeof parsed === 'object' && parsed.text !== undefined) {
            return {
                text: parsed.text || "",
                color: parsed.color || "zinc",
                isPinned: !!parsed.isPinned,
                type: parsed.type || "text",
                items: parsed.items || [],
                tag: parsed.tag || null
            };
        }
    } catch {
        // Ignored, it's just raw text
    }
    return {
        text: rawContent,
        color: "zinc",
        isPinned: false,
        type: "text",
        items: [],
        tag: null
    };
}

const COLOR_OPTIONS = [
    { name: "zinc", bg: "bg-zinc-800/50", border: "border-zinc-700" },
    { name: "blue", bg: "bg-blue-900/30", border: "border-blue-800/50" },
    { name: "orange", bg: "bg-orange-900/30", border: "border-orange-800/50" },
    { name: "amber", bg: "bg-amber-900/30", border: "border-amber-800/50" },
    { name: "rose", bg: "bg-rose-900/30", border: "border-rose-800/50" },
    { name: "purple", bg: "bg-purple-900/30", border: "border-purple-800/50" }
];

const TAG_OPTIONS = ["None", "Important", "Food", "Hotel", "Transport", "Emergency", "Idea"];

export default function TripNotesBoard({ tripId, notes, apiUrl, getToken, onUpdate }: TripNotesBoardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);

    // New Note State
    const [newNoteText, setNewNoteText] = useState("");
    const [newNoteType, setNewNoteType] = useState<"text" | "checklist">("text");
    const [newNoteColor, setNewNoteColor] = useState("zinc");
    const [newNoteTag, setNewNoteTag] = useState("None");
    const [isPinned, setIsPinned] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Edit Note State
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<any>(null);
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);

    // Derived clustered notes
    const parsedNotes = useMemo(() => {
        return notes.map(n => ({ ...n, parsed: parseNoteContent(n.content) }))
            .sort((a, b) => {
                if (a.parsed.isPinned && !b.parsed.isPinned) return -1;
                if (!a.parsed.isPinned && b.parsed.isPinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [notes]);

    // Handle Note Creation
    const handleAddNote = async () => {
        if (!newNoteText.trim() && !attachmentUrl && newNoteType === "text") return;
        
        setIsAddingNote(true);
        let items: any[] = [];
        let cleanText = newNoteText;

        if (newNoteType === "checklist") {
            items = newNoteText.split("\n").filter(l => l.trim()).map(l => ({ text: l.trim(), checked: false }));
            cleanText = ""; // don't replicate text in checklist
        }

        const payloadContent = JSON.stringify({
            text: cleanText,
            color: newNoteColor,
            isPinned,
            type: newNoteType,
            items,
            tag: newNoteTag === "None" ? null : newNoteTag
        });

        try {
            const res = await fetch(`${apiUrl}/trips/${tripId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ content: payloadContent, fileUrl: attachmentUrl }),
            });
            if (res.ok) {
                onUpdate();
                setNewNoteText(""); setAttachmentUrl(null); setAttachmentName(null);
                setNewNoteType("text"); setIsPinned(false); setNewNoteTag("None");
            }
        } catch (e) { console.error(e); }
        finally { setIsAddingNote(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        const formData = new FormData(); formData.append("file", file);
        try {
            const res = await fetch(`${apiUrl}/uploads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setAttachmentUrl(data.url);
                setAttachmentName(file.name);
            }
        } catch (error) { console.error(error); } 
        finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await fetch(`${apiUrl}/notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            onUpdate();
        } catch (e) { console.error(e); }
    };

    const handleUpdateNoteAPI = async (noteId: string, newContentPayload: any) => {
        setIsUpdatingNote(true);
        try {
            const res = await fetch(`${apiUrl}/notes/${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ content: JSON.stringify(newContentPayload) }),
            });
            if (res.ok) onUpdate();
        } catch (e) { console.error(e); }
        finally { setIsUpdatingNote(false); setEditingNoteId(null); }
    };

    const togglePin = (note: any) => {
        const payload = { ...note.parsed, isPinned: !note.parsed.isPinned };
        handleUpdateNoteAPI(note.id, payload);
    };

    const toggleChecklistItem = (note: any, idx: number) => {
        const copyItems = [...note.parsed.items];
        copyItems[idx].checked = !copyItems[idx].checked;
        const payload = { ...note.parsed, items: copyItems };
        handleUpdateNoteAPI(note.id, payload);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
                
                {/* ADD NOTE FORM */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3">
                            {attachmentUrl && (
                                <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 p-2 rounded-lg max-w-sm">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                                        <span className="text-sm text-zinc-300 truncate">{attachmentName}</span>
                                    </div>
                                    <button onClick={() => { setAttachmentUrl(null); setAttachmentName(null); }} className="text-zinc-500 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <textarea
                                    value={newNoteText}
                                    onChange={e => setNewNoteText(e.target.value)}
                                    placeholder={newNoteType === "checklist" ? "Milk\nBread\nTickets..." : "Write a note..."}
                                    className="bg-zinc-950 border border-zinc-800 flex-1 rounded-xl p-3 text-sm text-white resize-none min-h-[80px] focus:outline-none focus:border-orange-500/50"
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/50 mt-1">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setNewNoteType("text")} className={`p-1.5 rounded-md transition-colors ${newNoteType === 'text' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`} title="Text Note"><AlignLeft className="w-4 h-4" /></button>
                                    <button onClick={() => setNewNoteType("checklist")} className={`p-1.5 rounded-md transition-colors ${newNoteType === 'checklist' ? 'bg-zinc-800 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'}`} title="Checklist"><CheckSquare className="w-4 h-4" /></button>
                                    <div className="w-px h-5 bg-zinc-800 mx-1"></div>
                                    
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors" title="Attach file">
                                        {isUploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                    </button>

                                    <button onClick={() => setIsPinned(!isPinned)} className={`p-1.5 rounded-md transition-colors ${isPinned ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'}`} title="Pin note"><Pin className="w-4 h-4" /></button>

                                    <div className="flex items-center gap-1 ml-2 bg-zinc-900 border border-zinc-800 rounded-md p-0.5 px-1">
                                        <Palette className="w-3 h-3 text-zinc-500 mr-1" />
                                        {COLOR_OPTIONS.map(c => (
                                            <button key={c.name} onClick={() => setNewNoteColor(c.name)} className={`w-4 h-4 rounded-full ${c.name === 'zinc' ? 'bg-zinc-600' : `bg-${c.name}-500`} ${newNoteColor === c.name ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110' : 'opacity-60'} transition-all`} />
                                        ))}
                                    </div>
                                    
                                    <select value={newNoteTag} onChange={e => setNewNoteTag(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-md text-xs py-1 px-2 text-zinc-300 ml-2">
                                        {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <Button onClick={handleAddNote} disabled={isAddingNote || (!newNoteText.trim() && !attachmentUrl)} className="bg-orange-600 hover:bg-orange-500 text-white h-9 px-5 rounded-lg font-medium text-sm">
                                    {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1.5" />} Add Note
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* MASONRY NOTES GRID */}
                {parsedNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <StickyNote className="w-12 h-12 text-zinc-700 mb-4" />
                        <h3 className="text-lg font-medium text-zinc-300 mb-1">No notes yet</h3>
                        <p className="text-zinc-500 text-sm">Pin ideas, add checklists, and share documents.</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                        {parsedNotes.map((note: any) => {
                            const p = note.parsed;
                            const isEditing = editingNoteId === note.id;
                            const cTheme = COLOR_OPTIONS.find(c => c.name === p.color) || COLOR_OPTIONS[0];

                            return (
                                <div key={note.id} className={`group break-inside-avoid shadow-lg transition-all border ${cTheme.border} ${cTheme.bg} rounded-2xl overflow-hidden relative`}>
                                    
                                    {/* Pin Badge */}
                                    {p.isPinned && (
                                        <div className="absolute top-0 right-4 transform -translate-y-1 z-10">
                                            <div className="w-6 h-8 bg-amber-500 rounded-b-md flex justify-center pt-2 shadow-md">
                                                <Pin className="w-3 h-3 text-amber-950 fill-current" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3 gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border border-white/10 shrink-0">
                                                    <AvatarFallback className="bg-black/20 text-[10px] text-white/70">{note.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-[11px] font-medium text-white/50">{note.user?.name || "Member"}</span>
                                                {p.tag && (
                                                    <span className="inline-flex items-center gap-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-medium text-white/70 border border-white/5">
                                                        <Tag className="w-2.5 h-2.5" /> {p.tag}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Hover Actions */}
                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 bg-black/20 backdrop-blur-md rounded-md border border-white/5 p-0.5">
                                                <button onClick={() => togglePin(note)} className="text-white/60 hover:text-amber-400 p-1 rounded hover:bg-white/10"><Pin className="w-3 h-3" /></button>
                                                <button onClick={() => { setEditingNoteId(note.id); setEditDraft(p); }} className="text-white/60 hover:text-blue-400 p-1 rounded hover:bg-white/10"><Edit2 className="w-3 h-3" /></button>
                                                <button onClick={() => handleDeleteNote(note.id)} className="text-white/60 hover:text-red-400 p-1 rounded hover:bg-white/10"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <textarea 
                                                    value={editDraft.text} 
                                                    onChange={e => setEditDraft({...editDraft, text: e.target.value})} 
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none min-h-[60px]"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)} className="h-7 text-xs text-white/70 hover:text-white">Cancel</Button>
                                                    <Button size="sm" onClick={() => handleUpdateNoteAPI(note.id, editDraft)} disabled={isUpdatingNote} className="h-7 text-xs bg-orange-600 text-white hover:bg-orange-500">
                                                        {isUpdatingNote ? <Loader2 className="w-3 h-3 animate-spin"/> : "Save"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {p.text && <p className="text-sm font-medium text-white/90 whitespace-pre-wrap leading-relaxed">{p.text}</p>}
                                                
                                                {p.type === "checklist" && p.items && p.items.length > 0 && (
                                                    <div className="space-y-1.5 mt-2 bg-black/10 rounded-lg p-3 border border-white/5">
                                                        {p.items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-start gap-2 group/item">
                                                                <button 
                                                                    onClick={() => toggleChecklistItem(note, idx)} 
                                                                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-orange-500 border-orange-500' : 'bg-transparent border-white/30 hover:border-white/60'}`}
                                                                >
                                                                    {item.checked && <CheckSquare className="w-3 h-3 text-white" />}
                                                                </button>
                                                                <span className={`text-sm tracking-tight transition-all ${item.checked ? 'text-white/40 line-through' : 'text-white/90'}`}>
                                                                    {item.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {note.fileUrl && (
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                        {note.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-white/10 relative group/img">
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10 text-white font-medium text-xs">
                                                                    <Download className="w-4 h-4 mr-1"/> Open Image
                                                                </div>
                                                                <img src={note.fileUrl} alt="attachment" className="w-full object-cover transition-transform group-hover/img:scale-105 duration-500" />
                                                            </a>
                                                        ) : (
                                                            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/20 hover:bg-black/40 border border-white/10 rounded-lg text-sm text-white/80 transition-all">
                                                                <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center shrink-0">
                                                                    <FileText className="w-4 h-4 text-orange-400" />
                                                                </div>
                                                                <span className="flex-1 truncate text-xs font-medium">Document Attachment</span>
                                                                <Download className="w-4 h-4 text-white/40" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-white/30 font-mono text-right">
                                            {new Date(note.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ATTACHMENT VAULT SIDEBAR */}
            <div>
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl sticky top-24">
                    <CardHeader className="pb-4 border-b border-zinc-800/50">
                        <CardTitle className="text-lg text-white flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-orange-400" /> Vault
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {notes.filter(n => n.fileUrl).length === 0 ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 bg-zinc-800/50 mx-auto flex items-center justify-center mb-3">
                                    <Paperclip className="w-5 h-5 text-zinc-500"/>
                                </div>
                                <p className="text-zinc-500 text-xs">No files attached yet.</p>
                            </div>
                        ) : (
                            notes.filter(n => n.fileUrl).map((note) => {
                                const isImg = note.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i);
                                return (
                                <a key={note.id} href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-2 bg-zinc-950/50 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors">
                                    <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden">
                                        {isImg ? (
                                            <img src={note.fileUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" alt=""/>
                                        ) : (
                                            <FileText className="w-4 h-4 text-orange-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-zinc-300 truncate">File by {note.user?.name || "User"}</p>
                                        <p className="text-[10px] text-zinc-600">{new Date(note.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Download className="w-3 h-3 text-zinc-600 group-hover:text-orange-400" />
                                </a>
                            )})
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
