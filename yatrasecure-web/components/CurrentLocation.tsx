"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";

export default function CurrentLocation() {
  const [location, setLocation] = useState<string>("Locating...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache
    const cached = sessionStorage.getItem("ys_current_location");
    if (cached) {
      setLocation(cached);
      setLoading(false);
      return;
    }

    async function fetchFallback() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("IP API failed");
        const data = await res.json();
        const locString = data.city ? `${data.city}, ${data.country_name}` : "Unknown Location";
        setLocation(locString);
        sessionStorage.setItem("ys_current_location", locString);
      } catch (err) {
        console.error("Fallback location failed:", err);
        setLocation("Unknown Location");
      } finally {
        setLoading(false);
      }
    }

    async function fetchReverseGeocode(lat: number, lon: number) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error("Geocoding failed");
        const data = await res.json();
        
        // Nominatim can have city, town, village, or county
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        const country = data.address.country;
        
        if (city && country) {
          const locString = `${city}, ${country}`;
          setLocation(locString);
          sessionStorage.setItem("ys_current_location", locString);
          setLoading(false);
        } else {
          // If perfectly matched city is not found, fallback to IP
          fetchFallback();
        }
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        fetchFallback();
      }
    }

    // Attempt GPS first
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchReverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied or failed:", error.message);
          fetchFallback();
        },
        { timeout: 10000 }
      );
    } else {
      fetchFallback();
    }
  }, []);

  return (
    <div 
      style={{
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        padding: "8px 14px", 
        // A subtle glassmorphism look matching the navbar
        background: "rgba(255,255,255,0.03)", 
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        color: "#cbd5e1"
      }}
      className="hidden md:flex hover:bg-white/5 transition-colors cursor-default"
      title="Your current location"
    >
      {loading ? (
        <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", color: "var(--accent)" }} />
      ) : (
        <MapPin style={{ width: 14, height: 14, color: "var(--accent)" }} />
      )}
      <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>
        {location}
      </span>
    </div>
  );
}
