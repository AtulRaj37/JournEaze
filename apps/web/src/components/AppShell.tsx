"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 border-b border-red-700 text-white text-xs font-bold py-1.5 text-center z-[100] flex items-center justify-center gap-2 shadow-xl shadow-red-900/20 backdrop-blur-md">
          <WifiOff className="w-4 h-4" />
          You are currently offline. Viewing cached data.
        </div>
      )}
      <div className={isOffline ? "pt-7" : ""}>
        {children}
      </div>
    </>
  );
}
