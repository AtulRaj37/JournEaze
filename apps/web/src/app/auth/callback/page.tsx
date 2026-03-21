"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        const userParam = searchParams.get("user");

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                router.push("/dashboard");
            } catch (err) {
                setError("Failed to process authentication. Please try again.");
            }
        } else {
            setError("Authentication failed. No token received.");
        }
    }, [searchParams, router]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
            <div className="text-center space-y-4">
                {error ? (
                    <div className="space-y-4">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="text-sm text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
                        >
                            Back to login
                        </button>
                    </div>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-white" />
                        <p className="text-zinc-400 text-sm">Signing you in...</p>
                    </>
                )}
            </div>
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </main>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
