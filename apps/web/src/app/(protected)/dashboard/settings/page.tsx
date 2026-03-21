"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User, Mail, AtSign, Lock, Eye, EyeOff, Save, Loader2, CheckCircle2,
    Shield, Trash2, Calendar, AlertTriangle
} from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
    image: string | null;
    role: string;
    createdAt: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState("");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState("");

    // Danger zone
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const res = await fetch(`${apiUrl}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setName(data.name || "");
                setUsername(data.username || "");
            }
        } catch { }
        finally { setIsLoadingProfile(false); }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        setProfileMsg("");
        try {
            const res = await fetch(`${apiUrl}/users/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, username: username || undefined }),
            });
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                // Update localStorage so Navbar reflects changes
                const stored = localStorage.getItem("user");
                if (stored) {
                    const u = JSON.parse(stored);
                    localStorage.setItem("user", JSON.stringify({ ...u, name: updated.name, username: updated.username }));
                }
                setProfileMsg("✅ Profile updated!");
                setTimeout(() => setProfileMsg(""), 3000);
            } else {
                const d = await res.json().catch(() => ({}));
                setProfileMsg(`❌ ${d.message || "Failed to update"}`);
            }
        } catch { setProfileMsg("❌ Network error"); }
        finally { setIsSavingProfile(false); }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordMsg("❌ Passwords don't match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMsg("❌ Password must be at least 6 characters");
            return;
        }
        setIsSavingPassword(true);
        setPasswordMsg("");
        try {
            const res = await fetch(`${apiUrl}/users/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (res.ok) {
                setPasswordMsg("✅ Password changed!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setPasswordMsg(""), 3000);
            } else {
                const d = await res.json().catch(() => ({}));
                setPasswordMsg(`❌ ${d.message || "Failed to change password"}`);
            }
        } catch { setPasswordMsg("❌ Network error"); }
        finally { setIsSavingPassword(false); }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== "DELETE") return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${apiUrl}/users/account`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login");
            }
        } catch { }
        finally { setIsDeleting(false); }
    };

    if (isLoadingProfile) {
        return (
            <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center pt-24">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pt-24 pb-16 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Account <span className="text-orange-400">Settings</span>
                    </h1>
                    <p className="text-zinc-400 mt-1">Manage your profile and preferences.</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                        <CardHeader className="border-b border-zinc-800/50 pb-4">
                            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-400" /> Profile Information
                            </CardTitle>
                            <CardDescription className="text-zinc-500">Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            {/* Avatar + Info */}
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16 rounded-xl border-2 border-zinc-700">
                                    <AvatarImage src={profile?.image || undefined} />
                                    <AvatarFallback className="bg-zinc-800 text-white text-xl rounded-xl font-bold">
                                        {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-semibold text-white truncate">{profile?.name || "Explorer"}</p>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <Mail className="w-3.5 h-3.5" /> {profile?.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                        <Calendar className="w-3 h-3" /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
                                    </div>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                                    {profile?.role}
                                </span>
                            </div>

                            <div className="h-px bg-zinc-800" />

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-zinc-500" /> Full Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Your full name"
                                    className="h-11 bg-zinc-950/50 border-zinc-800 text-white rounded-xl"
                                />
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-zinc-300 flex items-center gap-1.5">
                                    <AtSign className="w-3.5 h-3.5 text-zinc-500" /> Username
                                </Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                    placeholder="yourusername"
                                    className="h-11 bg-zinc-950/50 border-zinc-800 text-white rounded-xl font-mono"
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-zinc-500" /> Email Address
                                </Label>
                                <Input
                                    value={profile?.email || ""}
                                    disabled
                                    className="h-11 bg-zinc-950/30 border-zinc-800/50 text-zinc-500 rounded-xl cursor-not-allowed"
                                />
                                <p className="text-xs text-zinc-600">Email cannot be changed for security reasons.</p>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 px-6"
                                >
                                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                                {profileMsg && (
                                    <p className={`text-sm ${profileMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
                                        {profileMsg}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Password Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                        <CardHeader className="border-b border-zinc-800/50 pb-4">
                            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-400" /> Security
                            </CardTitle>
                            <CardDescription className="text-zinc-500">Change your password.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="currentPw" className="text-zinc-300">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPw"
                                        type={showCurrentPw ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 bg-zinc-950/50 border-zinc-800 text-white rounded-xl pr-10"
                                    />
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-0 top-0 h-11 px-3 text-zinc-500 hover:text-zinc-300 transition-colors">
                                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="newPw" className="text-zinc-300">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPw"
                                            type={showNewPw ? "text" : "password"}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-11 bg-zinc-950/50 border-zinc-800 text-white rounded-xl pr-10"
                                        />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-0 top-0 h-11 px-3 text-zinc-500 hover:text-zinc-300 transition-colors">
                                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPw" className="text-zinc-300">Confirm Password</Label>
                                    <Input
                                        id="confirmPw"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 bg-zinc-950/50 border-zinc-800 text-white rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Save Password Button */}
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6"
                                >
                                    {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                    Update Password
                                </Button>
                                {passwordMsg && (
                                    <p className={`text-sm ${passwordMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
                                        {passwordMsg}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Danger Zone */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-zinc-900/50 border-red-900/30 backdrop-blur-xl">
                        <CardHeader className="border-b border-red-900/20 pb-4">
                            <CardTitle className="text-lg text-red-400 font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Danger Zone
                            </CardTitle>
                            <CardDescription className="text-zinc-500">Permanently delete your account and all data.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm text-zinc-400">
                                Once you delete your account, all your trips, expenses, and data will be permanently removed.
                                This action <strong className="text-red-400">cannot be undone</strong>.
                            </p>
                            <div className="space-y-2">
                                <Label className="text-zinc-300 text-sm">Type <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-red-400 font-mono text-xs">DELETE</code> to confirm</Label>
                                <Input
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="h-11 bg-zinc-950/50 border-red-900/30 text-white rounded-xl max-w-xs font-mono"
                                />
                            </div>
                            <Button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== "DELETE" || isDeleting}
                                variant="destructive"
                                className="rounded-xl h-10 px-6"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Delete My Account
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
