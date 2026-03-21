"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Navigation, MapPin, Clock, Route, X, ArrowUpDown, Plus, Car, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";

// Unique emoji + color per category so no two look alike
const NEARBY_CATEGORIES = [
  { type: "Restaurant", emoji: "🍽️", color: "#ef4444", label: "Restaurant" },
  { type: "Hotel",      emoji: "🏨", color: "#3b82f6", label: "Hotel" },
  { type: "ATM",        emoji: "💳", color: "#f59e0b", label: "ATM" },
  { type: "Hospital",   emoji: "🏥", color: "#ec4899", label: "Hospital" },
  { type: "Airport",    emoji: "✈️", color: "#6366f1", label: "Airport" },
  { type: "Petrol",     emoji: "⛽", color: "#f97316", label: "Petrol" },
  { type: "Pharmacy",   emoji: "💊", color: "#14b8a6", label: "Pharmacy" },
];

interface TripMapProps {
  destination: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function TripMap({ destination, latitude, longitude }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const routeControlRef = useRef<any>(null);
  const nearbyMarkersRef = useRef<Record<string, any[]>>({});
  const routeWaypointsRef = useRef<[number, number][] | null>(null);
  const routeMarkersRef = useRef<any[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(destination);
  const [stops, setStops] = useState<{ id: string; value: string }[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [travelMode, setTravelMode] = useState<"driving" | "walking">("driving");
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [activeNearby, setActiveNearby] = useState<Set<string>>(new Set());
  const [loadingNearby, setLoadingNearby] = useState<string | null>(null);

  // Autocomplete state
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [fromSuggestions, setFromSuggestions] = useState<any[]>([]);
  const [toSuggestions, setToSuggestions] = useState<any[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);

  // Stops Autocomplete State
  const [stopSuggestions, setStopSuggestions] = useState<Record<string, any[]>>({});
  const [showStopSuggestions, setShowStopSuggestions] = useState<Record<string, boolean>>({});
  const stopDebounceRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const fromDebounceRef = useRef<any>(null);
  const toDebounceRef = useRef<any>(null);
  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);

  const defaultLat = latitude || 20.5937;
  const defaultLng = longitude || 78.9629;
  const zoom = latitude ? 12 : 5;

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current) return;
      if ((mapRef.current as any)._leaflet_id) return;

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
      if (mapRef.current) delete (mapRef.current as any)._leaflet_id;
    };
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromContainerRef.current && !fromContainerRef.current.contains(e.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toContainerRef.current && !toContainerRef.current.contains(e.target as Node)) {
        setShowToSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaces = async (query: string, type: "from" | "to") => {
    if (query.length < 2) {
      if (type === "from") { setFromSuggestions([]); setShowFromSuggestions(false); }
      else { setToSuggestions([]); setShowToSuggestions(false); }
      return;
    }
    
    if (type === "from") setIsSearchingFrom(true);
    else setIsSearchingTo(true);

    try {
      const res = await fetch(`${apiUrl}/places/autocomplete?input=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const predictions = data.predictions || [];
        if (type === "from") {
          setFromSuggestions(predictions);
          setShowFromSuggestions(predictions.length > 0);
        } else {
          setToSuggestions(predictions);
          setShowToSuggestions(predictions.length > 0);
        }
      }
    } catch (err) {
      console.error("Autocomplete error:", err);
    } finally {
      if (type === "from") setIsSearchingFrom(false);
      else setIsSearchingTo(false);
    }
  };

  const handleFromChange = (value: string) => {
    setFrom(value);
    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    fromDebounceRef.current = setTimeout(() => searchPlaces(value, "from"), 300);
  };

  const handleToChange = (value: string) => {
    setTo(value);
    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
    toDebounceRef.current = setTimeout(() => searchPlaces(value, "to"), 300);
  };

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleAddStop = () => {
    setStops([...stops, { id: crypto.randomUUID(), value: "" }]);
  };

  const handleRemoveStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
    if (stopDebounceRefs.current[id]) clearTimeout(stopDebounceRefs.current[id] as NodeJS.Timeout);
  };

  const searchStopPlaces = async (query: string, stopId: string) => {
    if (query.length < 2) {
      setStopSuggestions(prev => ({ ...prev, [stopId]: [] }));
      setShowStopSuggestions(prev => ({ ...prev, [stopId]: false }));
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/places/autocomplete?input=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const predictions = data.predictions || [];
        setStopSuggestions(prev => ({ ...prev, [stopId]: predictions }));
        setShowStopSuggestions(prev => ({ ...prev, [stopId]: predictions.length > 0 }));
      }
    } catch (err) { }
  };

  const updateStop = (id: string, value: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, value } : s));
    if (stopDebounceRefs.current[id]) clearTimeout(stopDebounceRefs.current[id] as NodeJS.Timeout);
    stopDebounceRefs.current[id] = setTimeout(() => searchStopPlaces(value, id), 300);
  };

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

    setShowFromSuggestions(false);
    setShowToSuggestions(false);
    setIsRouting(true);
    setRouteInfo(null);
    routeWaypointsRef.current = null;

    try {
      const L = await import("leaflet");
      const map = leafletMapRef.current;

      if (routeControlRef.current) {
        map.removeControl(routeControlRef.current);
        routeControlRef.current = null;
      }
      
      if (routeMarkersRef.current.length > 0) {
        routeMarkersRef.current.forEach(m => map.removeLayer(m));
        routeMarkersRef.current = [];
      }

      const fromCoords = from.trim()
        ? await geocodePlace(from)
        : latitude && longitude ? [latitude, longitude] as [number, number] : null;
      const toCoords = await geocodePlace(to || destination);

      if (!fromCoords || !toCoords) {
        alert("Could not find origin or destination. Please be more specific.");
        setIsRouting(false);
        return;
      }

      const stopCoordsList: [number, number][] = [];
      for (const stop of stops) {
        if (stop.value.trim()) {
           const sc = await geocodePlace(stop.value);
           if (sc) stopCoordsList.push(sc);
        }
      }

      const allPoints = [fromCoords, ...stopCoordsList, toCoords];
      const coordsString = allPoints.map(c => `${c[1]},${c[0]}`).join(";");

      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/${travelMode}/${coordsString}?overview=full&geometries=geojson`
      );
      const routeData = await routeRes.json();

      if (routeData.routes?.[0]) {
        const route = routeData.routes[0];
        const distKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        const durationHr = durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin}m`;
        setRouteInfo({ distance: `${distKm} km`, duration: durationHr });

        const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        const polyline = L.polyline(coords, { color: "#6366f1", weight: 5, opacity: 0.8 }).addTo(map);
        routeControlRef.current = polyline;

        // Sample waypoints for route-aware POI searches (max 6 points)
        const step = Math.max(1, Math.floor(coords.length / 6));
        const waypoints: [number, number][] = [];
        for (let i = 0; i < coords.length; i += step) waypoints.push(coords[i]);
        if (waypoints[waypoints.length - 1] !== coords[coords.length - 1]) waypoints.push(coords[coords.length - 1]);
        routeWaypointsRef.current = waypoints;

        // Add markers
        routeMarkersRef.current.push(
          L.marker(fromCoords).addTo(map).bindPopup(`<strong>Start:</strong> ${from || (destination ? "Trip Start" : "Location")}`)
        );
        routeMarkersRef.current.push(
          L.marker(toCoords).addTo(map).bindPopup(`<strong>End:</strong> ${to}`).openPopup()
        );
        stopCoordsList.forEach((sc, i) => {
          routeMarkersRef.current.push(L.marker(sc).addTo(map).bindPopup(`<strong>Stop ${i+1}</strong>`));
        });

        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }
    } catch (error) {
      console.error("Route error:", error);
    } finally {
      setIsRouting(false);
    }
  };

  const toggleNearby = async (type: string) => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;

    // IF ALREADY ACTIVE -> REMOVE IT
    if (activeNearby.has(type)) {
      if (nearbyMarkersRef.current[type]) {
        nearbyMarkersRef.current[type].forEach((m) => map.removeLayer(m));
        delete nearbyMarkersRef.current[type];
      }
      setActiveNearby(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
      return;
    }

    // IF NOT ACTIVE -> FETCH AND ADD IT
    setLoadingNearby(type);
    const catInfo = NEARBY_CATEGORIES.find(c => c.type === type) || NEARBY_CATEGORIES[0];

    try {
      const L = await import("leaflet");
      const allPlaces: any[] = [];

      // Route-aware single fetch (FAST, ONE REQUEST)
      if (routeWaypointsRef.current && routeWaypointsRef.current.length > 1) {
        const waypoints = routeWaypointsRef.current;
        const waypointsStr = waypoints.map(w => `${w[0]},${w[1]}`).join('|');
        const params = new URLSearchParams({ type, destination, waypoints: waypointsStr });
        
        try {
          const res = await fetch(`${apiUrl}/places/nearby?${params}`);
          if (res.ok) {
            const data = await res.json();
            const seen = new Set<string>();
            (data.places || []).forEach((p: any) => {
              const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
              if (!seen.has(key)) { seen.add(key); allPlaces.push(p); }
            });
          }
        } catch (e) { console.error(e); }
      } else {
        // No route — search around destination
        const params = new URLSearchParams({ type, destination });
        if (latitude && longitude) {
          params.set("lat", String(latitude));
          params.set("lng", String(longitude));
        }
        const res = await fetch(`${apiUrl}/places/nearby?${params}`);
        if (res.ok) {
          const data = await res.json();
          allPlaces.push(...(data.places || []));
        }
      }

      if (allPlaces.length > 0) {
        const bounds: [number, number][] = [];
        const newMarkers: any[] = [];

        allPlaces.forEach((place: any) => {
          const icon = L.divIcon({
            html: `<div style="background:${catInfo.color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${catInfo.emoji}</div>`,
            className: "",
            iconSize: [32, 32],
          });
          const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(map)
            .bindPopup(`<strong>${place.name}</strong><br/><small style="color:${catInfo.color}">${catInfo.emoji} ${catInfo.label}</small>`);
          
          newMarkers.push(marker);
          bounds.push([place.lat, place.lng]);
        });
        
        nearbyMarkersRef.current[type] = newMarkers;

        setActiveNearby(prev => {
          const next = new Set(prev);
          next.add(type);
          return next;
        });

        if (!routeWaypointsRef.current) {
          if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          } else {
            map.setView(bounds[0], 15);
          }
        }
      } else {
        // Warn if none found
        console.warn(`No ${type} found nearby`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNearby(null);
    }
  };

  const waypointsParam = stops.filter(s => s.value.trim()).map(s => encodeURIComponent(s.value)).join('|');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from || (latitude && longitude ? `${latitude},${longitude}` : ""))}&destination=${encodeURIComponent(to || destination)}${waypointsParam ? `&waypoints=${waypointsParam}` : ""}`;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Route Planner */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 z-20">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
          <Route className="w-4 h-4 text-purple-400" /> Route Planner
        </h3>
        
        <div className="flex flex-col gap-2 mb-3">
          {/* Inputs Row */}
          <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
            {/* Autocomplete From */}
            <div className="relative flex-1 w-full" ref={fromContainerRef}>
              <input
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                placeholder="From (leave blank to use your location)"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
                autoComplete="off"
              />
              {isSearchingFrom && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-500" />}
              {showFromSuggestions && fromSuggestions.length > 0 && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                  {fromSuggestions.map((s: any) => (
                    <button 
                      key={s.place_id} type="button"
                      onClick={() => { setFrom(s.description); setShowFromSuggestions(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white border-b border-zinc-800/50 last:border-0"
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleSwap} 
              title="Swap Routes" 
              className="p-2 sm:p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 shrink-0"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Autocomplete To */}
            <div className="relative flex-1 w-full" ref={toContainerRef}>
              <input
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                placeholder="To"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
                autoComplete="off"
              />
              {isSearchingTo && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-zinc-500" />}
              {showToSuggestions && toSuggestions.length > 0 && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                  {toSuggestions.map((s: any) => (
                    <button 
                      key={s.place_id} type="button"
                      onClick={() => { setTo(s.description); setShowToSuggestions(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white border-b border-zinc-800/50 last:border-0"
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Stops */}
          {stops.map(stop => (
             <div key={stop.id} className="relative flex gap-2 items-center w-full pl-0 sm:pl-8">
                <input 
                  value={stop.value} 
                  onChange={(e) => updateStop(stop.id, e.target.value)} 
                  onFocus={() => {
                      if (stopSuggestions[stop.id]?.length) {
                          setShowStopSuggestions(prev => ({...prev, [stop.id]: true}));
                      }
                  }}
                  placeholder="Add stop (e.g., Kullu)" 
                  className="flex-1 min-w-0 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors" 
                  autoComplete="off"
                />

                {showStopSuggestions[stop.id] && stopSuggestions[stop.id]?.length > 0 && (
                  <div className="absolute top-11 left-0 sm:left-8 right-10 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto">
                    {stopSuggestions[stop.id].map((s: any) => (
                      <button 
                        key={s.place_id} type="button"
                        onClick={() => { 
                          setStops(stops.map(st => st.id === stop.id ? { ...st, value: s.description } : st));
                          setShowStopSuggestions(prev => ({ ...prev, [stop.id]: false })); 
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white border-b border-zinc-800/50 last:border-0"
                      >
                        {s.description}
                      </button>
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => handleRemoveStop(stop.id)} 
                  className="p-2 shrink-0 text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
             </div>
          ))}

          <div className="flex justify-between items-center sm:justify-start gap-2 mt-2 pl-0 sm:pl-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddStop} 
              className="text-xs h-9 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Stop
            </Button>
            
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-1 h-9 mx-2">
              <button 
                onClick={() => setTravelMode('driving')} 
                title="Driving"
                className={`p-1.5 rounded-md transition-colors ${travelMode === 'driving' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Car className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTravelMode('walking')} 
                title="Walking"
                className={`p-1.5 rounded-md transition-colors ${travelMode === 'walking' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Footprints className="w-4 h-4" />
              </button>
            </div>
            
            <Button
              onClick={handleRoute}
              disabled={isRouting || !isLoaded}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 h-9 text-sm whitespace-nowrap"
            >
              {isRouting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Navigation className="w-4 h-4 mr-1" />}
              Get Route
            </Button>
          </div>
        </div>

        {/* Nearby Toggle Buttons (Multi-Select) */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-zinc-800/50">
          <span className="text-xs text-zinc-500">Nearby:</span>
          {NEARBY_CATEGORIES.map((cat) => {
            const isActive = activeNearby.has(cat.type);
            const isLoading = loadingNearby === cat.type;
            
            return (
              <button
                key={cat.type}
                onClick={() => toggleNearby(cat.type)}
                disabled={loadingNearby !== null && !isLoading}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs border rounded-full transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                } disabled:opacity-50`}
                style={isActive ? { background: cat.color, borderColor: cat.color } : {}}
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <span>{cat.emoji}</span>}
                <span>{cat.label}</span>
                {isActive && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="mt-4 flex gap-4 bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{routeInfo.distance}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{routeInfo.duration}</span>
            </div>
          </div>
        )}
      </div>

      {/* Map (z-0 to ensure dropdowns above it) */}
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-zinc-800 z-10">
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
      <div className="flex flex-wrap gap-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-sm transition-colors"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          Open/Save in Google Maps
        </a>
      </div>
    </div>
  );
}
