"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

export interface BlightPin {
  id: number;
  reportId: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  status: "Active" | "Verifying" | "Resolved";
  bountyAmountMON: string;
  donorCount: number;
  beforePhotoUrl: string;
}

interface BlightMapProps {
  pins: BlightPin[];
  selectedPin: BlightPin | null;
  onSelectPin: (pin: BlightPin) => void;
  userLocation: { lat: number; lng: number } | null;
}

export default function BlightMap({
  pins,
  selectedPin,
  onSelectPin,
  userLocation,
}: BlightMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Jakarta (Monas / Sudirman area)
      const centerLat = userLocation?.lat || -6.2088;
      const centerLng = userLocation?.lng || 106.8456;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([centerLat, centerLng], 14);

      // OpenStreetMap tile: 100% free, no API key needed
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    pins.forEach((pin) => {
      // Color-coding: Red = Active, Yellow = Verifying, Green = Resolved
      const color =
        pin.status === "Active"
          ? "#EF4444"
          : pin.status === "Verifying"
          ? "#EAB308"
          : "#10B981";

      const customIcon = L.divIcon({
        className: "custom-pin",
        html: `
          <div style="
            background: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px ${color}88;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(map);
      marker.on("click", () => onSelectPin(pin));
      markersRef.current[pin.id] = marker;
    });

    if (userLocation) {
      const userIcon = L.divIcon({
        className: "user-gps-pulse",
        html: `
          <div style="
            position: relative;
            width: 18px;
            height: 18px;
            background: #836EF9;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 16px #836EF9;
          ">
            <div style="
              position: absolute;
              top: -6px;
              left: -6px;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: rgba(131, 110, 249, 0.4);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }
  }, [pins, userLocation, onSelectPin]);

  useEffect(() => {
    if (selectedPin && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedPin.lat, selectedPin.lng], 16, {
        duration: 1.2,
      });
    }
  }, [selectedPin]);

  return (
    <div className="relative z-0 w-full h-[360px] md:h-[460px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl isolate">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {/* Legend Badge */}
      <div className="absolute top-3 left-3 z-10 bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs flex items-center space-x-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          Verifying
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Resolved
        </span>
      </div>
    </div>
  );
}
