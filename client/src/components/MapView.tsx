import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { Need } from "@/lib/types";

function FitBounds({ needs }: { needs: Need[] }) {
  const map = useMap();
  useEffect(() => {
    if (needs.length === 0) return;
    const bounds = needs.map((n) => [n.location.lat, n.location.lng]) as [number, number][];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [needs, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const colorFor = (urgency: number) =>
  urgency === 5 ? "hsl(0 84% 60%)" : urgency >= 3 ? "hsl(32 95% 54%)" : "hsl(48 96% 53%)";

export default function MapView({ needs, onSelect, onMapClick }: { needs: Need[]; onSelect?: (n: Need) => void; onMapClick?: (lat: number, lng: number) => void }) {
  return (
    <div className="h-[460px] w-full rounded-2xl overflow-hidden border shadow-card cursor-crosshair">
      <MapContainer center={[22.5726, 88.3639]} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />
        <FitBounds needs={needs} />
        {needs.map((n) => (
          <CircleMarker
            key={n._id}
            center={[n.location.lat, n.location.lng]}
            radius={n.urgency === 5 ? 14 : n.urgency >= 3 ? 11 : 9}
            pathOptions={{
              color: colorFor(n.urgency),
              fillColor: colorFor(n.urgency),
              fillOpacity: 0.55,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelect?.(n) }}
          >
            <Popup>
              <div className="text-sm font-semibold mb-1">{n.title}</div>
              <div className="text-xs text-gray-600">{n.location.lat.toFixed(4)}, {n.location.lng.toFixed(4)}</div>
              <div className="text-xs mt-1">Urgency {n.urgency} • {n.peopleAffected} people</div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
