"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, Mail, ArrowLeft, ArrowRight, Compass } from "lucide-react";

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authMethod, setAuthMethod] = useState<"initial" | "email">("initial");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const res = await fetch(`${apiUrl}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, username, email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Something went wrong creating the account.");
            }

            const data = await res.json();
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen bg-zinc-950 text-white selection:bg-purple-500/30">
            {/* Left Side: Premium Image Cover */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-zinc-950/20 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 opacity-80"></div>
                <motion.img 
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    alt="Breathtaking mountain lake view"
                />
                
                {/* Floating UI Elements on Image */}
                <div className="relative z-20 flex flex-col justify-between p-12 h-full w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                            <Compass className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white drop-shadow-md">JournEaze</span>
                    </div>

                    <div className="max-w-md pb-12">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.7 }}
                            className="text-4xl md:text-5xl font-bold tracking-tight mb-5 leading-tight drop-shadow-lg"
                        >
                            Your journey begins right here.
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.7 }}
                            className="text-lg text-zinc-300 font-medium drop-shadow-md"
                        >
                            Create an account to unlock intelligent trip planning, collaborative itineraries, and seamless navigation.
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="flex w-full lg:w-1/2 min-h-screen xl:max-h-screen xl:overflow-y-auto items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Subtle background glow for the right panel */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="w-full max-w-[400px] z-10 py-12">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex flex-col space-y-8"
                    >
                        <div className="space-y-2">
                            {authMethod === "email" && (
                                <button 
                                    type="button" 
                                    onClick={() => setAuthMethod("initial")} 
                                    className="flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-6 group"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                                    Back
                                </button>
                            )}
                            <h2 className="text-3xl font-bold tracking-tight text-white">Create an account</h2>
                            <p className="text-zinc-400">
                                {authMethod === "initial" ? "Join JournEaze and start exploring." : "Fill in your details to get started."}
                            </p>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg text-center backdrop-blur-sm">
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleRegister} className="mt-8">
                            <AnimatePresence mode="wait">
                                {authMethod === "initial" ? (
                                    <motion.div 
                                        key="initial" 
                                        initial={{ opacity: 0, filter: "blur(4px)" }} 
                                        animate={{ opacity: 1, filter: "blur(0px)" }} 
                                        exit={{ opacity: 0, filter: "blur(4px)" }} 
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <Button 
                                            type="button" 
                                            className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-900 rounded-xl font-semibold transition-all flex items-center justify-center cursor-pointer" 
                                            onClick={() => {
                                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                                                window.location.href = `${apiUrl}/auth/google`;
                                            }}
                                        >
                                            <GoogleIcon /> Sign up with Google
                                        </Button>
                                        
                                        <div className="relative flex items-center justify-center py-4">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                                            <span className="relative bg-zinc-950 px-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">Or sign up with</span>
                                        </div>

                                        <Button 
                                            type="button" 
                                            className="w-full h-12 bg-zinc-900/50 hover:bg-zinc-800 text-white border border-zinc-800 rounded-xl font-medium transition-all group" 
                                            onClick={() => setAuthMethod("email")}
                                        >
                                            <Mail className="mr-2 h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" /> Sign up with Email
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="email" 
                                        initial={{ opacity: 0, filter: "blur(4px)" }} 
                                        animate={{ opacity: 1, filter: "blur(0px)" }} 
                                        exit={{ opacity: 0, filter: "blur(4px)" }} 
                                        transition={{ duration: 0.3 }}
                                        className="space-y-5"
                                    >
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-medium text-zinc-300">Full Name</Label>
                                                <Input 
                                                    id="name" 
                                                    required
                                                    placeholder="Jane Doe" 
                                                    className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-purple-500/50 transition-all rounded-xl"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="username" className="text-sm font-medium text-zinc-300">Username</Label>
                                                <Input 
                                                    id="username" 
                                                    required
                                                    placeholder="janedoe" 
                                                    className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-purple-500/50 transition-all rounded-xl lowercase"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-zinc-300">Email Address</Label>
                                            <Input 
                                                id="email" 
                                                type="email" 
                                                required
                                                placeholder="explorer@example.com" 
                                                className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-purple-500/50 transition-all rounded-xl"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</Label>
                                            <div className="relative">
                                                <Input 
                                                    id="password" 
                                                    type={showPassword ? "text" : "password"} 
                                                    required
                                                    placeholder="••••••••"
                                                    className="h-12 bg-zinc-900/50 border-zinc-800 focus:border-purple-500/50 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-purple-500/50 transition-all rounded-xl pr-10" 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-2">
                                            By signing up, you agree to our Terms of Service and Privacy Policy.
                                        </p>
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all mt-6 group"
                                        >
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                                                <span className="flex items-center justify-center">
                                                    Create Account <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                                </span>
                                            )}
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>

                        <div className="text-center">
                            <p className="text-sm text-zinc-400">
                                Already have an account?{" "}
                                <Link href="/login" className="text-white hover:text-purple-400 font-medium transition-colors">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
