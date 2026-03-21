"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, Mail, ArrowLeft, Chrome } from "lucide-react";
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authMethod, setAuthMethod] = useState<"initial" | "email">("initial");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Invalid credentials");
            }

            const data = await res.json();
            localStorage.setItem("token", data.accessToken);
            // Optionally, save user data locally
            localStorage.setItem("user", JSON.stringify(data.user));
            
            // Redirect to dashboard
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4 selection:bg-zinc-800 text-white">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="z-10 w-full max-w-md"
            >
                <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                    <form onSubmit={handleLogin}>
                        <CardHeader className="space-y-3 pb-6 border-b border-white/5 relative">
                            {authMethod === "email" && (
                                <button type="button" onClick={() => setAuthMethod("initial")} className="absolute left-6 top-6 text-zinc-400 hover:text-white transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <CardTitle className="text-3xl font-bold tracking-tight text-center text-white">Welcome back</CardTitle>
                            <CardDescription className="text-zinc-400 text-center text-base">
                                {authMethod === "initial" ? "Log in to access your journeys." : "Enter your credentials to continue."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 relative">
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg text-center">
                                    {error}
                                </motion.div>
                            )}
                            <AnimatePresence mode="popLayout">
                                {authMethod === "initial" ? (
                                    <motion.div key="initial" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                        <Button type="button" className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-900 border-none rounded-xl font-semibold transition-all flex items-center justify-center shadow-md dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900" onClick={() => {
                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                                            window.location.href = `${apiUrl}/auth/google`;
                                        }}>
                                            <GoogleIcon /> Continue with Google
                                        </Button>
                                        
                                        <div className="relative flex items-center justify-center my-6">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                            <span className="relative bg-[#09090b] px-3 flex items-center text-sm text-zinc-500 shadow-[0_0_20px_#09090b]">or</span>
                                        </div>

                                        <Button type="button" className="w-full h-12 bg-zinc-800 text-white hover:bg-zinc-700 rounded-xl font-medium transition-all border border-zinc-700" onClick={() => setAuthMethod("email")}>
                                            <Mail className="mr-2 h-5 w-5" /> Continue with Email
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="identifier" className="text-zinc-300">Email or Username</Label>
                                            <Input 
                                                id="identifier" 
                                                type="text" 
                                                required
                                                placeholder="explorer@example.com or @explorer" 
                                                className="h-12 bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/30 transition-all rounded-xl"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                                <Link href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Forgot password?</Link>
                                            </div>
                                            <div className="relative">
                                                <Input 
                                                    id="password" 
                                                    type={showPassword ? "text" : "password"} 
                                                    required
                                                    placeholder="••••••••"
                                                    className="h-12 bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/30 transition-all rounded-xl" 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-0 top-0 h-12 px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all mt-6"
                                        >
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in to JournEaze"}
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-5 pt-2 pb-8">
                            <p className="text-sm text-center text-zinc-400 mt-2">
                                Don't have an account?{" "}
                                <Link href="/register" className="text-white hover:text-zinc-300 font-medium underline underline-offset-4 transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </main>
    );
}
