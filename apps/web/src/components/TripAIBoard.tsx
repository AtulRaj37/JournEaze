"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, Bot, User, ChevronRight, Compass, Utensils, BaggageClaim } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface TripAIBoardProps {
    tripId: string;
    destination: string;
    apiUrl: string;
    getToken: () => string | null;
}

export default function TripAIBoard({ tripId, destination, apiUrl, getToken }: TripAIBoardProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: `Hi! I'm your AI Copilot for your trip to **${destination}**. How can I help you plan today?` }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (forcedText?: string) => {
        const text = forcedText || input;
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: text }];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        try {
            const res = await fetch(`${apiUrl}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ tripId, messages: newMessages })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, data]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Oops, I encountered an error. Please try again later." }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Oops, I couldn't reach the server right now." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const suggestions = [
        { icon: BaggageClaim, text: "What should I pack for this trip?" },
        { icon: Utensils, text: "Where can I find vegetarian food?" },
        { icon: Compass, text: "Suggest some hidden gems." },
        { icon: Sparkles, text: "Auto-fix my scattered itinerary." }
    ];

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl h-[700px] flex flex-col overflow-hidden relative shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

            <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-md z-10 shrink-0">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    AI Copilot
                </CardTitle>
                <p className="text-zinc-400 text-sm mt-1 ml-10">Ask me anything about your trip to {destination}</p>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative z-0 relative">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-start gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'assistant' ? 'bg-zinc-800 border border-zinc-700' : 'bg-emerald-600 border border-emerald-500'}`}>
                                    {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-white" />}
                                </div>
                                
                                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-emerald-600/20 text-emerald-50 border border-emerald-500/20' 
                                        : 'bg-zinc-800/60 text-zinc-200 border border-zinc-700/50 shadow-inner'
                                }`}>
                                    <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 max-w-none prose-sm">
                                        <ReactMarkdown
                                            components={{
                                                a: ({node, ...props}: any) => <a {...props} className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer" />,
                                                strong: ({node, ...props}: any) => <strong {...props} className="font-semibold text-white" />,
                                                code: ({node, ...props}: any) => <code {...props} className="bg-black/30 px-1 py-0.5 rounded text-purple-300 font-mono text-xs" />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 max-w-[85%]">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg">
                                <Bot className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="px-5 py-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions Block */}
                {messages.length === 1 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="px-6 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {suggestions.map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSend(s.text)}
                                    className="flex items-center text-left gap-3 p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/50 hover:border-purple-500/30 transition-all text-sm text-zinc-300 group"
                                >
                                    <s.icon className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                    <span className="flex-1 truncate">{s.text}</span>
                                    <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800/50">
                    <div className="relative flex items-center">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Ask Copilot..."
                            className="w-full bg-zinc-950 border-zinc-800 rounded-full h-12 pl-5 pr-14 text-sm focus-visible:ring-1 focus-visible:ring-purple-500/50"
                        />
                        <div className="absolute right-1">
                            <Button 
                                onClick={() => handleSend()} 
                                disabled={!input.trim() || isTyping} 
                                size="icon" 
                                className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md disabled:bg-zinc-800 disabled:text-zinc-500"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
