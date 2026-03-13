"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Navigation, MapPin, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripMapProps {
  destination: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function TripMap({ destination, latitude, longitude }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const routeControlRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(destination);
  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const defaultLat = latitude || 20.5937;
  const defaultLng = longitude || 78.9629;
  const zoom = latitude ? 12 : 5;

  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current) return;

      // If already initialized (e.g. strict mode double-invoke), bail out
      if ((mapRef.current as any)._leaflet_id) return;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (latitude && longitude) {
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`<strong>${destination}</strong><br/>Your Destination`).openPopup();
      }

      leafletMapRef.current = map;
      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      // Clear Leaflet's internal container id so it can re-init cleanly (React Strict Mode)
      if (mapRef.current) {
        delete (mapRef.current as any)._leaflet_id;
      }
    };
  }, []);

  const geocodePlace = async (place: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch {}
    return null;
  };

  const handleRoute = async () => {
    if (!from.trim() && !to.trim()) return;
    if (!leafletMapRef.current) return;

    setIsRouting(true);
    setRouteInfo(null);

    try {
      const L = await import("leaflet");
      const map = leafletMapRef.current;

      // Clear existing route
      if (routeControlRef.current) {
        map.removeControl(routeControlRef.current);
        routeControlRef.current = null;
      }

      const fromCoords = from.trim()
        ? await geocodePlace(from)
        : latitude && longitude ? [latitude, longitude] as [number, number] : null;
      const toCoords = await geocodePlace(to || destination);

      if (!fromCoords || !toCoords) {
        alert("Could not find one of the locations. Please be more specific.");
        setIsRouting(false);
        return;
      }

      // Draw route using OSRM
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson`
      );
      const routeData = await routeRes.json();

      if (routeData.routes?.[0]) {
        const route = routeData.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        const durationHr = durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin}m`;
        setRouteInfo({ distance: `${distKm} km`, duration: durationHr });

        // Draw the route polyline
        const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        if (routeControlRef.current) map.removeLayer(routeControlRef.current);
        const polyline = L.polyline(coords, { color: "#6366f1", weight: 5, opacity: 0.8 }).addTo(map);
        routeControlRef.current = polyline;

        // Add markers
        L.marker(fromCoords).addTo(map).bindPopup(`<strong>Start:</strong> ${from || destination}`);
        L.marker(toCoords).addTo(map).bindPopup(`<strong>End:</strong> ${to}`).openPopup();

        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }
    } catch (error) {
      console.error("Route error:", error);
    } finally {
      setIsRouting(false);
    }
  };

  const handleSearchNearby = async (type: string) => {
    if (!leafletMapRef.current) return;
    const L = await import("leaflet");
    const map = leafletMapRef.current;

    const lat = latitude || defaultLat;
    const lng = longitude || defaultLng;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(type + ' near ' + destination)}&limit=5&bounded=1&viewbox=${lng - 0.2},${lat + 0.2},${lng + 0.2},${lat - 0.2}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();

      data.forEach((place: any) => {
        const icon = L.divIcon({
          html: `<div style="background:#10b981;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${type[0].toUpperCase()}</div>`,
          className: "",
          iconSize: [28, 28],
        });
        L.marker([parseFloat(place.lat), parseFloat(place.lon)], { icon })
          .addTo(map)
          .bindPopup(`<strong>${place.display_name.split(",")[0]}</strong>`);
      });

      map.setView([lat, lng], 13);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Route Planner */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
          <Route className="w-4 h-4 text-purple-400" /> Route Planner
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From (leave blank to use your location/trip start)"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
          />
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
          />
          <Button
            onClick={handleRoute}
            disabled={isRouting || !isLoaded}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 h-10 text-sm whitespace-nowrap"
          >
            {isRouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 mr-1" />}
            Get Route
          </Button>
        </div>

        {/* Nearby Search Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500 mt-1">Nearby:</span>
          {["Restaurant", "Hotel", "ATM", "Hospital", "Airport"].map((type) => (
            <button
              key={type}
              onClick={() => handleSearchNearby(type)}
              className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-full transition-colors"
            >
              {type}
            </button>
          ))}
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="mt-3 flex gap-4 bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{routeInfo.distance}</span>
              <span className="text-xs text-zinc-500">distance</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{routeInfo.duration}</span>
              <span className="text-xs text-zinc-500">by car</span>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-zinc-800">
        {!isLoaded && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading map...</span>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Open externally */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex self-start items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-sm transition-colors"
      >
        <MapPin className="w-4 h-4 text-emerald-400" />
        Open in Google Maps
      </a>
    </div>
  );
}
