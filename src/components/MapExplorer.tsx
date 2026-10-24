'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';

export interface MapMarkerItem {
  id?: string;
  title: string;
  coords: { lat: number; lng: number };
  status: 'NONE' | 'ACTIVE' | 'RESOLVED';
  bountyAmount: string;
  roleHref?: string;
}

interface MapExplorerProps {
  coords: { lat: number; lng: number };
  status?: 'NONE' | 'ACTIVE' | 'RESOLVED';
  bountyAmount?: string;
  title?: string;
  markers?: MapMarkerItem[];
  selectedId?: string;
  onSelectMarker?: (id: string) => void;
  zoom?: number;
}

// Exactly matches standard pin dimensions [25, 41] anchored at bottom tip [12.5, 41]
const createPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35)); cursor: pointer; display: block; line-height: 0;">
        <svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41C12.5 41 25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${color}"/>
          <circle cx="12.5" cy="12.5" r="4.5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -38],
  });
};

function RecenterMap({ coords, zoom }: { coords: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], zoom, { duration: 0.6 });
  }, [coords.lat, coords.lng, zoom, map]);
  return null;
}

export default function MapExplorer({
  coords,
  status = 'ACTIVE',
  bountyAmount = '5.0',
  title = 'Spanduk Liar',
  markers,
  selectedId,
  onSelectMarker,
  zoom = 17,
}: MapExplorerProps) {
  const mapKey = markers
    ? 'feed-map'
    : `single-map-${coords.lat.toFixed(4)}-${coords.lng.toFixed(4)}`;

  return (
    <div className="w-full h-full min-h-75">
      <MapContainer
        key={mapKey}
        center={[coords.lat, coords.lng]}
        zoom={zoom}
        className="w-full h-full min-h-full"
        scrollWheelZoom={true}
      >
        <RecenterMap coords={coords} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Multi-marker view (Public feed / map overview) */}
        {markers && markers.length > 0 ? (
          markers.map((item, idx) => {
            const isSelected = item.id === selectedId;
            // Only the active/selected pin is red; all other pins keep the exact same size/shape
            const pinColor = isSelected
              ? '#ef4444'
              : item.status === 'RESOLVED'
              ? '#22c55e'
              : '#3b82f6';

            return (
              <React.Fragment key={item.id || idx}>
                <Marker
                  position={[item.coords.lat, item.coords.lng]}
                  icon={createPinIcon(pinColor)}
                  eventHandlers={{
                    click: () => {
                      if (item.id) {
                        onSelectMarker?.(item.id);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 p-1">
                      <p className="font-bold">{item.title}</p>
                      <p>
                        Bounty:{' '}
                        <span className="font-semibold text-primary">
                          {item.bountyAmount} MON
                        </span>
                      </p>
                      <p>
                        Status:{' '}
                        <span
                          className={`font-semibold ${
                            item.status === 'RESOLVED'
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </p>
                      {item.roleHref && (
                        <div className="pt-1">
                          <Link
                            href={item.roleHref}
                            className="text-xs text-primary underline font-medium"
                          >
                            Inspect Bounty &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
                {item.status !== 'NONE' && (
                  <Circle
                    center={[item.coords.lat, item.coords.lng]}
                    radius={50}
                    pathOptions={{
                      color: isSelected
                        ? '#ef4444'
                        : item.status === 'RESOLVED'
                        ? '#22c55e'
                        : '#3b82f6',
                      fillColor: isSelected
                        ? '#ef4444'
                        : item.status === 'RESOLVED'
                        ? '#22c55e'
                        : '#3b82f6',
                      fillOpacity: isSelected ? 0.2 : 0.12,
                      weight: isSelected ? 2 : 1.5,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })
        ) : (
          /* Single marker view for role pages */
          status !== 'NONE' && (
            <React.Fragment>
              <Marker
                position={[coords.lat, coords.lng]}
                icon={createPinIcon(
                  status === 'RESOLVED' ? '#22c55e' : '#ef4444'
                )}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{title}</p>
                    <p>Bounty: {bountyAmount} MON</p>
                    <p>Status: {status}</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[coords.lat, coords.lng]}
                radius={50}
                pathOptions={{
                  color: status === 'RESOLVED' ? '#22c55e' : '#ef4444',
                  fillColor: status === 'RESOLVED' ? '#22c55e' : '#ef4444',
                  fillOpacity: 0.15,
                }}
              />
            </React.Fragment>
          )
        )}
      </MapContainer>
    </div>
  );
}
