import React, { useEffect, useRef, useState } from "react";
import { Issue, matchesAdminDepartment } from "../types";
import { AlertCircle, Info, Filter, CheckCircle, Navigation, Compass, Map as MapIcon } from "lucide-react";

interface IssueMapProps {
  issues: Issue[];
  onIssueSelect: (issue: Issue) => void;
  isAdmin?: boolean;
  adminDepartment?: string;
  rememberLastLocation?: boolean;
  theme?: "light" | "dark";
}

type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
};

const LAST_LOCATION_KEY = "community_hero_last_good_location";
const GOOD_ACCURACY_METERS = 500;
const MAX_USABLE_ACCURACY_METERS = 10000;

// Haversine formula to calculate distance in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function readSavedLocation(): UserLocation | null {
  try {
    const saved = localStorage.getItem(LAST_LOCATION_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as UserLocation;
    if (
      typeof parsed.latitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      typeof parsed.longitude === "number" &&
      Number.isFinite(parsed.longitude)
    ) {
      return parsed;
    }
  } catch (err) {
    console.warn("Could not read saved map location.", err);
  }
  return null;
}

function saveLocation(location: UserLocation, rememberLastLocation: boolean) {
  if (!rememberLastLocation) return;
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
  } catch (err) {
    console.warn("Could not save map location.", err);
  }
}

function shouldAcceptLocation(next: UserLocation, current: UserLocation | null) {
  if ((next.accuracy || Infinity) > MAX_USABLE_ACCURACY_METERS && current) {
    return false;
  }

  if (!current) return true;

  const nextAccuracy = next.accuracy || Infinity;
  const currentAccuracy = current.accuracy || Infinity;
  const distanceJumpKm = getDistanceKm(
    current.latitude,
    current.longitude,
    next.latitude,
    next.longitude
  );

  if (distanceJumpKm > 25 && nextAccuracy > currentAccuracy * 2) {
    return false;
  }

  return nextAccuracy <= currentAccuracy * 3 || distanceJumpKm <= 2;
}

export default function IssueMap({ issues, onIssueSelect, isAdmin, adminDepartment, rememberLastLocation = true, theme = "light" }: IssueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerMapRef = useRef<{ [id: string]: any }>({});
  
  // Geolocation and filtering states
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => rememberLastLocation ? readSavedLocation() : null);
  const [locationStatus, setLocationStatus] = useState<"prompt" | "granted" | "denied" | "requesting">("prompt");
  const [showNearbyOnly, setShowNearbyOnly] = useState<boolean>(false);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState<boolean>(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("All Departments");
  const nearbyRadius = 5; // 5 km threshold

  // Check browser geolocation permission on mount
  useEffect(() => {
    if (!rememberLastLocation) {
      localStorage.removeItem(LAST_LOCATION_KEY);
    }
  }, [rememberLastLocation]);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" as any })
        .then((permissionStatus) => {
          if (permissionStatus.state === "granted") {
            setLocationStatus("granted");
            requestUserLocation(false); // quietly get location on mount
          } else if (permissionStatus.state === "denied") {
            setLocationStatus("denied");
          } else {
            setLocationStatus("prompt");
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === "granted") {
              setLocationStatus("granted");
              requestUserLocation(true);
            } else if (permissionStatus.state === "denied") {
              setLocationStatus("denied");
              setUserLocation(null);
              setShowNearbyOnly(false);
            } else {
              setLocationStatus("prompt");
            }
          };
        })
        .catch((err) => {
          console.warn("Permissions API not supported or query failed", err);
          setLocationStatus("prompt");
        });
    } else {
      // Fallback: check if we can query directly
      setLocationStatus("prompt");
    }
  }, [rememberLastLocation]);

  // Request current user coordinates
  const requestUserLocation = (shouldFocus = true) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setLocationStatus("requesting");

    let bestPosition: GeolocationPosition | null = null;
    let settled = false;
    let watchId: number | null = null;

    const applyPosition = (position: GeolocationPosition, force = false) => {
      const nextLocation: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      setUserLocation((current) => {
        if (!force && !shouldAcceptLocation(nextLocation, current)) {
          return current;
        }

        saveLocation(nextLocation, rememberLastLocation);
        if (shouldFocus) {
          setHasCenteredOnUser(false);
        }
        return nextLocation;
      });
      setLocationStatus("granted");
    };

    const finishWithBest = () => {
      if (settled) return;
      settled = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (bestPosition) {
        applyPosition(bestPosition);
      } else if (userLocation) {
        setLocationStatus("granted");
      } else {
        setLocationStatus("prompt");
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (
          !bestPosition ||
          position.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= GOOD_ACCURACY_METERS) {
          applyPosition(position, true);
          finishWithBest();
        }
      },
      (error) => {
        console.warn("Geolocation watch failed:", error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (
          !bestPosition ||
          position.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= GOOD_ACCURACY_METERS) {
          applyPosition(position, true);
          finishWithBest();
        }
      },
      (error) => {
        console.warn("Geolocation fallback activated or permission denied:", error);
        if (!userLocation) {
          setLocationStatus("denied");
          setShowNearbyOnly(false);
        } else {
          setLocationStatus("granted");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );

    window.setTimeout(finishWithBest, 6500);
  };

  // Filter issues based on department
  const filteredByDeptIssues = issues.filter((issue) => {
    const deptToFilter = isAdmin ? adminDepartment : selectedDeptFilter;
    if (!deptToFilter || deptToFilter === "All Departments") return true;
    return matchesAdminDepartment(issue.suggestedDepartment, deptToFilter);
  });

  // Calculate distances and attach to mapped issues
  const mappedIssues = filteredByDeptIssues
    .filter((issue) => issue.latitude !== undefined && issue.longitude !== undefined)
    .map((issue) => {
      const distance = userLocation && issue.latitude !== undefined && issue.longitude !== undefined
        ? getDistanceKm(userLocation.latitude, userLocation.longitude, issue.latitude, issue.longitude)
        : null;
      return { ...issue, distanceKm: distance };
    });

  // Sort mapped issues: if userLocation is granted, sort nearby issues by distance (ascending). Otherwise, keep original order (newest first).
  if (userLocation) {
    mappedIssues.sort((a, b) => {
      const distA = a.distanceKm !== null ? a.distanceKm : Infinity;
      const distB = b.distanceKm !== null ? b.distanceKm : Infinity;
      return distA - distB;
    });
  }

  // Filter nearby issues (<= 5km) if toggle is active
  const displayedMappedIssues = showNearbyOnly && userLocation
    ? mappedIssues.filter((issue) => issue.distanceKm !== null && issue.distanceKm <= nearbyRadius)
    : mappedIssues;

  // Core Map and Marker Painting Effect
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // 1. Initialize map instance if not already done
    if (!mapInstanceRef.current) {
      // Default fallback coordinates: Bhubaneswar / IIIT Bhubaneswar
      let defaultCenter: [number, number] = [20.3533, 85.8078];

      // If user location is granted, center on user
      if (userLocation) {
        defaultCenter = [userLocation.latitude, userLocation.longitude];
      } else if (mappedIssues.length > 0) {
        // Fallback: Center on average of available mapped issues
        let sumLat = 0, sumLng = 0, count = 0;
        mappedIssues.forEach((issue) => {
          if (issue.latitude !== undefined && issue.longitude !== undefined) {
            sumLat += issue.latitude;
            sumLng += issue.longitude;
            count++;
          }
        });
        if (count > 0) {
          defaultCenter = [sumLat / count, sumLng / count];
        }
      }

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        attributionControl: false, // Hides the Leaflet copyright label
      }).setView(defaultCenter, 14);
    }

    const map = mapInstanceRef.current;

    // 2. Set/update tile layer based on current theme
    const isDark = theme === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    // 3. Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    markerMapRef.current = {};

    // 3. Draw a distinct "You Are Here" pulsing marker if location is granted
    if (userLocation) {
      const youAreHereHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div style="
            position: absolute;
            background-color: #4f46e5;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2.5px solid white;
            box-shadow: 0 0 10px rgba(79,70,229,0.8);
            z-index: 2;
          "></div>
          <div style="
            position: absolute;
            background-color: #6366f1;
            opacity: 0.45;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            animation: pulse-gps-dot 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            z-index: 1;
          "></div>
        </div>
        <style>
          @keyframes pulse-gps-dot {
            0% {
              transform: scale(0.6);
              opacity: 1;
            }
            80%, 100% {
              transform: scale(2.4);
              opacity: 0;
            }
          }
        </style>
      `;

      const youAreHereIcon = L.divIcon({
        html: youAreHereHtml,
        className: "custom-user-gps-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: youAreHereIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; text-align: center; padding: 4px; width: 140px;">
            <div style="font-size: 11px; font-weight: 800; color: #4f46e5; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <Compass className="w-3.5 h-3.5 animate-spin" style="width:12px; height:12px;" /> You Are Here
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 3px; font-family: monospace;">
              ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}
            </div>
          </div>
        `);
      markersRef.current.push(userMarker);
    }

    // 4. Draw markers for all displayed mapped issues
    const getMarkerColor = (severity: string) => {
      switch (severity) {
        case "Critical":
          return "#ef4444"; // Red
        case "High":
          return "#f97316"; // Orange
        case "Medium":
          return "#eab308"; // Yellow
        default:
          return "#3b82f6"; // Blue
      }
    };

    const getCategoryInitial = (cat: string) => {
      if (!cat) return "?";
      return cat.charAt(0).toUpperCase();
    };

    displayedMappedIssues.forEach((issue) => {
      if (issue.latitude === undefined || issue.longitude === undefined) return;

      const color = getMarkerColor(issue.severity);
      const categoryInit = getCategoryInitial(issue.category);
      const dist = issue.distanceKm;

      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: system-ui, sans-serif;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease-in-out;
        " class="hover:scale-115">
          ${categoryInit}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: `custom-issue-pin-${issue.id}`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });

      const distLabel = dist !== null && dist !== undefined
        ? `<div style="font-size: 10px; font-weight: 700; color: #10b981; margin: 4px 0;">📍 ${dist.toFixed(2)} km away</div>`
        : ``;

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; width: 195px; padding: 4px;">
            <div style="font-size: 12px; font-weight: 850; color: #1e293b; margin-bottom: 2px; line-height: 1.35;">
              ${issue.title}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              📍 ${issue.location}
            </div>
            ${distLabel}
            <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 8px; margin-top: 4px;">
              <span style="font-size: 9px; background-color: #f1f5f9; padding: 2px 6px; border-radius: 9999px; font-weight: 600; color: #475569;">
                ${issue.category}
              </span>
              <span style="font-size: 9px; background-color: ${color}15; color: ${color}; padding: 2px 6px; border-radius: 9999px; font-weight: 700;">
                ${issue.severity}
              </span>
            </div>
            <button id="map-view-btn-${issue.id}" style="
              width: 100%;
              background-color: #4f46e5;
              color: white;
              font-size: 10px;
              font-weight: 700;
              padding: 6.5px 10px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.15s;
            " onmouseover="this.style.backgroundColor='#4338ca'" onmouseout="this.style.backgroundColor='#4f46e5'">
              View Full Details
            </button>
          </div>
        `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`map-view-btn-${issue.id}`);
        if (btn) {
          btn.onclick = () => {
            onIssueSelect(issue);
          };
        }
      });

      markersRef.current.push(marker);
      markerMapRef.current[issue.id] = marker;
    });

    // 5. Intelligent map view bounds centering
    if (userLocation && !hasCenteredOnUser) {
      // Snap to user coordinates when first granted
      map.setView([userLocation.latitude, userLocation.longitude], 14);
      setHasCenteredOnUser(true);
    } else if (displayedMappedIssues.length > 0 && !userLocation) {
      // Center and fit around all displayed issue markers
      const validMarkers = markersRef.current.filter((m) => m !== null);
      if (validMarkers.length > 0) {
        const group = L.featureGroup(validMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    } else if (displayedMappedIssues.length === 0 && !userLocation) {
      // Absolute fallback: Bhubaneswar / IIIT campus
      map.setView([20.3533, 85.8078], 14);
    }
  }, [displayedMappedIssues, userLocation, showNearbyOnly, theme]);

  // Invalidates Leaflet size when dashboard state updates or panels shift
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [issues, isAdmin, adminDepartment]);

  // Cleanup map container on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const DEPARTMENTS = [
    "All Departments",
    "Sanitation",
    "Roads / PWD",
    "Lighting / Electricity",
    "Water Board",
    "Campus Facilities",
  ];

  return (
    <div className="space-y-4" id="community-map-dashboard">
      {/* 1. Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <MapIcon className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
            Map Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin ? (
              <span className="font-bold text-indigo-600 font-mono text-[10px] uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Department: {adminDepartment} mode active
              </span>
            ) : (
              <span>Visualizing civic feedback and critical issues pins.</span>
            )}
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department dropdown (Public only) */}
          {!isAdmin ? (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                Dept:
              </span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-[11px] font-semibold text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold font-mono">
              Filtered for {adminDepartment}
            </div>
          )}

          {/* Nearby issues filter toggle (Only if user location is active) */}
          {userLocation && (
            <button
              type="button"
              onClick={() => setShowNearbyOnly(!showNearbyOnly)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all border ${
                showNearbyOnly
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${showNearbyOnly ? "animate-bounce" : ""}`} />
              Nearby (&le; {nearbyRadius}km): {showNearbyOnly ? "ON" : "OFF"}
            </button>
          )}
        </div>
      </div>

      {/* 2. Geolocation Status Notification Banner */}
      {locationStatus === "prompt" || locationStatus === "requesting" ? (
        <div className="bg-indigo-50 border border-indigo-100/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-indigo-100/70 text-indigo-600 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Navigation className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-900">Unlock Nearby Issues discovery</h4>
              <p className="text-[11px] text-indigo-700/80">Grant location permissions to center the map on your exact location, view relative distance to issues, and sort them.</p>
            </div>
          </div>
          <button
            onClick={() => requestUserLocation(true)}
            disabled={locationStatus === "requesting"}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {locationStatus === "requesting" ? "Locating..." : "Use My Location"}
          </button>
        </div>
      ) : locationStatus === "granted" && userLocation ? (
        <div className="bg-emerald-50 border border-emerald-100/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/70 text-emerald-600 rounded-lg shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">Live Geolocation Active</h4>
              <p className="text-[11px] text-emerald-700/80">
                Sorting all reports by closest distance to you (<span className="font-mono font-bold">{userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</span>).
                {userLocation.accuracy && (
                  <span className="ml-1 font-mono">Accuracy: ~{Math.round(userLocation.accuracy)}m</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                mapInstanceRef.current?.setView([userLocation.latitude, userLocation.longitude], 15);
              }}
              title="Snap center back to you"
              className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 hover:border-indigo-200 rounded-lg shadow-2xs transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setUserLocation(null);
                localStorage.removeItem(LAST_LOCATION_KEY);
                setLocationStatus("prompt");
                setShowNearbyOnly(false);
                setHasCenteredOnUser(false);
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg shadow-2xs transition-all"
            >
              Reset GPS
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-amber-100/70 text-amber-600 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 font-sans">Location Services Disabled</h4>
              <p className="text-[11px] text-amber-700/80">
                Location access was denied or failed. The map is centered around available complaints in the Bhubaneswar region. Grant location permissions in browser settings for nearby calculation.
              </p>
            </div>
          </div>
          <button
            onClick={() => requestUserLocation(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* 3. The Map Display Canvas */}
      <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50">
        <div
          ref={mapContainerRef}
          style={{ height: "min(68vh, 620px)", minHeight: "380px", width: "100%" }}
          className="z-10"
        />
        
        {/* Map Corner Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-md text-[10px] space-y-1.5 max-w-[140px]">
          <div className="font-extrabold text-slate-700 tracking-wider uppercase text-[8px] pb-1 border-b border-slate-100">Marker Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-white shadow-3xs" />
            <span className="text-slate-600 font-semibold">Critical Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] border border-white shadow-3xs" />
            <span className="text-slate-600">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] border border-white shadow-3xs" />
            <span className="text-slate-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-white shadow-3xs" />
            <span className="text-slate-600">Low</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white shadow-3xs animate-ping" />
              <span className="text-indigo-600 font-bold">Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
