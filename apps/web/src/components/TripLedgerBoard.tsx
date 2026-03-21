"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Plus, Loader2, Split, CheckCircle2, TrendingUp, HandCoins } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EXPENSE_CATEGORIES = ["Food", "Transport", "Accommodation", "Activities", "Shopping", "Other"];
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

interface TripLedgerBoardProps {
    tripId: string;
    expenses: any[];
    settlements: any[]; // we'll fetch this from parent or pass empty if not fetched
    budget: number;
    members: any[];
    apiUrl: string;
    getToken: () => string | null;
    onUpdate: () => void;
}

export default function TripLedgerBoard({ tripId, expenses, settlements = [], budget, members = [], apiUrl, getToken, onUpdate }: TripLedgerBoardProps) {
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Food");
    const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL");
    // For custom, mapping of userId -> amount
    const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
    
    // Actually fixing who is the payer among the members
    const [payerId, setPayerId] = useState<string>(members[0]?.user?.id || members[0]?.userId || "");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSettling, setIsSettling] = useState(false);

    // Calc total spent
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

    // Calc donut chart data
    const chartData = useMemo(() => {
        const catMap = new Map<string, number>();
        expenses.forEach(e => {
            const cat = e.category || "Other";
            catMap.set(cat, (catMap.get(cat) || 0) + e.amount);
        });
        return Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [expenses]);

    // Calc Balances -> A Owes B
    const balances = useMemo(() => {
        // userId -> net balance (+ means they are owed, - means they owe)
        const net: Record<string, number> = {};
        
        // initialize
        members.forEach(m => {
            const id = m.user?.id || m.userId;
            if (id) net[id] = 0;
        });

        // Add expenses
        expenses.forEach(exp => {
            const pId = exp.payerId;
            const amt = exp.amount;
            if (net[pId] !== undefined) net[pId] += amt;

            // Subtract their split
            if (exp.splits && exp.splits.length > 0) {
                exp.splits.forEach((s: any) => {
                    if (net[s.userId] !== undefined) net[s.userId] -= parseFloat(s.amount);
                });
            } else {
                // assume equal split if no splits record
                const splitAmt = amt / Math.max(1, members.length);
                members.forEach(m => {
                    const id = m.user?.id || m.userId;
                    if (id && net[id] !== undefined) net[id] -= splitAmt;
                });
            }
        });

        // Add settlements (Payee got money, Payer lost money)
        settlements.forEach(setl => {
            const pId = setl.payerId; // person who paid the settlement
            const rId = setl.receiverId; // person who received the settlement
            const amt = setl.amount;
            if (net[pId] !== undefined) net[pId] += amt;
            if (net[rId] !== undefined) net[rId] -= amt;
        });

        // Greedily resolve owed amounts
        const positive = Object.entries(net).filter(([_, val]) => val > 0.1).sort((a, b) => b[1] - a[1]);
        const negative = Object.entries(net).filter(([_, val]) => val < -0.1).sort((a, b) => a[1] - b[1]);

        const debts: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
        
        const getPName = (id: string) => {
            const m = members.find(x => (x.user?.id || x.userId) === id);
            return m?.user?.name || "Someone";
        };

        let i = 0, j = 0;
        while (i < positive.length && j < negative.length) {
            const posAmt = positive[i][1];
            const negAmt = -negative[j][1];
            const settleAmt = Math.min(posAmt, negAmt);

            debts.push({
                from: negative[j][0],
                fromName: getPName(negative[j][0]),
                to: positive[i][0],
                toName: getPName(positive[i][0]),
                amount: parseFloat(settleAmt.toFixed(2))
            });

            positive[i][1] -= settleAmt;
            negative[j][1] += settleAmt;

            if (positive[i][1] < 0.1) i++;
            if (negative[j][1] > -0.1) j++;
        }

        return debts;
    }, [expenses, members, settlements]);


    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(amount);
        if (!desc.trim() || !amt || !payerId) return;
        setIsSubmitting(true);

        const splitsData: any[] = [];
        if (splitType === "EQUAL") {
            const perPerson = amt / members.length;
            members.forEach(m => {
                splitsData.push({ userId: m.user?.id || m.userId, amount: perPerson });
            });
        } else {
            // custom split
            let totalSplit = 0;
            Object.values(customSplits).forEach(v => totalSplit += v);
            if (Math.abs(totalSplit - amt) > 0.1) {
                alert(`Custom splits (₹${totalSplit}) do not match total amount (₹${amt})`);
                setIsSubmitting(false);
                return;
            }
            Object.entries(customSplits).forEach(([uid, val]) => {
                if (val > 0) splitsData.push({ userId: uid, amount: val });
            });
        }

        try {
            const res = await fetch(`${apiUrl}/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    tripId,
                    description: desc,
                    amount: amt,
                    category,
                    userId: payerId, // Send proper payerId (requires backend tweak or assumes current user if ignored)
                    splits: splitsData
                }),
            });
            if (res.ok) {
                onUpdate();
                setDesc(""); setAmount(""); setShowExpenseForm(false);
                setCustomSplits({});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSettleUp = async (fromId: string, toId: string, amount: number) => {
        if (!confirm(`Mark ₹${amount} as settled?`)) return;
        setIsSettling(true);
        try {
            const res = await fetch(`${apiUrl}/settlements`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ tripId, payerId: fromId, payeeId: toId, amount }),
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (e) { console.error(e); }
        finally { setIsSettling(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                
                {/* WHO OWES WHOM SETTLEMENTS */}
                {balances.length > 0 && (
                    <Card className="bg-zinc-900/40 border-emerald-900/50 backdrop-blur-xl">
                        <CardHeader className="pb-3 border-b border-zinc-800/50">
                            <CardTitle className="text-lg text-emerald-400 flex items-center">
                                <HandCoins className="w-5 h-5 mr-2" /> Who Owes Whom
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {balances.map((debt, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 pointer-events-auto">
                                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                        <Avatar className="h-8 w-8 border border-zinc-700">
                                            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-300">{debt.fromName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-zinc-300 text-sm">
                                            <strong className="text-white">{debt.fromName}</strong> owes <strong className="text-white">{debt.toName}</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 border-t sm:border-0 border-zinc-800/50 pt-3 sm:pt-0">
                                        <span className="text-red-400 font-mono font-bold">₹{debt.amount.toLocaleString()}</span>
                                        <Button size="sm" onClick={() => handleSettleUp(debt.from, debt.to, debt.amount)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs px-3" disabled={isSettling}>
                                            Settle Up
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}


                {/* EXPENSES LIST */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                    <CardHeader className="border-b border-zinc-800/50 flex flex-row items-center justify-between rounded-t-xl">
                        <div>
                            <CardTitle className="text-2xl text-white">Expedition Ledger</CardTitle>
                            <p className="text-zinc-400 text-sm mt-1">Track where the money goes.</p>
                        </div>
                        <Button onClick={() => setShowExpenseForm(!showExpenseForm)} className="bg-white text-black hover:bg-zinc-200 rounded-full px-4 h-9">
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {showExpenseForm && (
                            <form onSubmit={handleAddExpense} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                
                                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was this for? (e.g. Dinner, Taxi)" className="bg-zinc-950 border-zinc-800 text-base" required />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Total Amount (₹)" className="bg-zinc-950 border-zinc-800 font-mono text-base" required />
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white">
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Paid by:</span>
                                        <select value={payerId} onChange={e => setPayerId(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded text-sm text-white py-1 px-2">
                                            {members.map(m => (
                                                <option key={m.user?.id || m.userId} value={m.user?.id || m.userId}>{m.user?.name || "Member"}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                                        <span className="text-sm text-zinc-400">Split type:</span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setSplitType("EQUAL")} className={`px-3 py-1 text-xs rounded-full border transition-colors ${splitType === 'EQUAL' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>Equally ({members.length})</button>
                                            <button type="button" onClick={() => setSplitType("CUSTOM")} className={`px-3 py-1 text-xs rounded-full border transition-colors ${splitType === 'CUSTOM' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>Custom</button>
                                        </div>
                                    </div>

                                    {splitType === "CUSTOM" && (
                                        <div className="space-y-2 mt-2 pt-2 border-t border-zinc-800/50">
                                            <div className="text-xs text-zinc-500 mb-2">Enter exact amounts per person:</div>
                                            {members.map(m => {
                                                const uid = m.user?.id || m.userId;
                                                return (
                                                    <div key={uid} className="flex items-center justify-between gap-3">
                                                        <span className="text-sm text-zinc-300 truncate">{m.user?.name}</span>
                                                        <Input 
                                                            type="number" 
                                                            value={customSplits[uid] || ""} 
                                                            onChange={e => setCustomSplits(prev => ({ ...prev, [uid]: parseFloat(e.target.value) || 0 }))} 
                                                            className="w-24 h-8 bg-zinc-900 border-zinc-700 text-sm font-mono text-right" 
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Save Expense
                                </Button>
                            </form>
                        )}

                        {expenses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Receipt className="w-12 h-12 text-zinc-600 mb-4" />
                                <h3 className="text-lg font-medium text-white mb-1">No expenses yet</h3>
                                <p className="text-zinc-500 text-sm">Start tracking your trip spending here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {expenses.map((exp: any) => (
                                    <div key={exp.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                <Receipt className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-100">{exp.description}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    Paid by <span className="text-zinc-300">{exp.payer?.name || "Someone"}</span> • {exp.category} 
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-white font-bold font-mono text-base tracking-tight">₹{exp.amount?.toLocaleString()}</p>
                                            {exp.splits && exp.splits.length > 0 && <p className="text-[10px] text-zinc-500 flex items-center mt-1"><Split className="w-3 h-3 mr-1" /> Split ({exp.splits.length})</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div>
                {/* BUDGET VISUALIZATION */}
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl sticky top-24">
                    <CardHeader className="pb-2"><CardTitle className="text-lg text-white">Spending Analytics</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600 font-mono tracking-tight">
                                ₹{totalExpenses.toLocaleString()}
                            </p>
                            <p className="text-sm text-zinc-500 mt-2 font-medium uppercase tracking-widest">Total Spent</p>
                        </div>
                        
                        {chartData.length > 0 && (
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {chartData.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {chartData.map((cat, i) => (
                                    <div key={cat.name} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-md">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-zinc-400 truncate flex-1">{cat.name}</span>
                                        <span className="text-white font-mono font-medium">₹{(cat.value/1000).toFixed(1)}k</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {budget > 0 && (
                            <div className="space-y-2 pt-4 border-t border-zinc-800">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Total Budget</span>
                                    <span className="text-zinc-200 font-mono">₹{budget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Remaining</span>
                                    <span className={`font-mono font-bold ${(budget - totalExpenses) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        ₹{(budget - totalExpenses).toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-3 mt-3 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${totalExpenses > budget ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`} 
                                        style={{ width: `${Math.min(100, (totalExpenses / budget) * 100)}%` }}
                                    ></div>
                                </div>
                                {totalExpenses > budget && (
                                    <p className="text-[11px] text-red-400 flex items-center mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                                        <TrendingUp className="w-3 h-3 mr-1" /> You have exceeded the trip budget!
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
