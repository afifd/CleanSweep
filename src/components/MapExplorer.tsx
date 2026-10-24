'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
  zoom?: number;
}

export default function MapExplorer({
  coords,
  status = 'ACTIVE',
  bountyAmount = '5.0',
  title = 'Spanduk Liar',
  markers,
  zoom = 17,
}: MapExplorerProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={zoom}
        className="w-full h-full min-h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* If custom markers array is provided (e.g. for main overview feed) */}
        {markers && markers.length > 0 ? (
          markers.map((item, idx) => (
            <div key={item.id || idx}>
              <Marker position={[item.coords.lat, item.coords.lng]} icon={defaultIcon}>
                <Popup>
                  <div className="text-xs space-y-1 p-1">
                    <p className="font-bold">{item.title}</p>
                    <p>Bounty: <span className="font-semibold text-primary">{item.bountyAmount} MON</span></p>
                    <p>Status: <span className={`font-semibold ${item.status === 'RESOLVED' ? 'text-green-600' : 'text-blue-600'}`}>{item.status}</span></p>
                    {item.roleHref && (
                      <div className="pt-1">
                        <Link href={item.roleHref} className="text-xs text-primary underline font-medium">
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
                    color: item.status === 'RESOLVED' ? '#22c55e' : '#3b82f6',
                    fillColor: item.status === 'RESOLVED' ? '#22c55e' : '#3b82f6',
                    fillOpacity: 0.15,
                  }}
                />
              )}
            </div>
          ))
        ) : (
          /* Single marker view for role pages */
          status !== 'NONE' && (
            <>
              <Marker position={[coords.lat, coords.lng]} icon={defaultIcon}>
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
            </>
          )
        )}
      </MapContainer>
    </div>
  );
}
