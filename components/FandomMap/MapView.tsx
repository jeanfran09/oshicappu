"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export type MapMarker = {
  id: string;
  kind: "event" | "photo_spot" | "pilgrimage";
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  image?: string | null;
  visited?: boolean;
};

type MapViewProps = {
  center: [number, number];
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pickedLocation?: [number, number] | null;
  zoom?: number;
};

const KIND_STYLE: Record<
  MapMarker["kind"],
  { emoji: string; color: string }
> = {
  event: { emoji: "🎉", color: "#a7c4ad" },
  photo_spot: { emoji: "📸", color: "#e2b6cf" },
  pilgrimage: { emoji: "🗺️", color: "#c8e1cc" },
};

function markerIcon(kind: MapMarker["kind"], visited?: boolean) {
  const { emoji, color } = KIND_STYLE[kind];

  return L.divIcon({
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:34px;
        height:34px;
        border-radius:9999px;
        background:${color};
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
        font-size:16px;
        ${visited ? "opacity:0.55;" : ""}
      ">${emoji}</div>
    `,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

const pickedIcon = L.divIcon({
  html: `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:30px;
      height:30px;
      border-radius:9999px 9999px 9999px 0;
      transform:rotate(45deg);
      background:#616161;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 28],
});

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

/**
 * Leaflet measures its container's size once on init. If that
 * happens before the surrounding layout has settled (a common race
 * with dynamically-imported, conditionally-rendered containers), it
 * locks in a wrong size and every subsequent zoom/pan looks broken
 * (e.g. a huge, nonsensical transform on the internal zoom-animation
 * proxy element). Re-measuring after mount, and whenever the
 * container's actual size changes, fixes it for good.
 */
function InvalidateSizeOnResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const invalidate = () => map.invalidateSize();

    invalidate();
    const timeoutId = setTimeout(invalidate, 150);

    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

export default function MapView({
  center,
  markers,
  onMarkerClick,
  onMapClick,
  pickedLocation,
  zoom = 14,
}: MapViewProps) {
  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();

    for (const marker of markers) {
      const key = `${marker.kind}:${marker.visited ? "1" : "0"}`;

      if (!map.has(key)) {
        map.set(key, markerIcon(marker.kind, marker.visited));
      }
    }

    return map;
  }, [markers]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />
      <InvalidateSizeOnResize />

      {pickedLocation && (
        <Marker position={pickedLocation} icon={pickedIcon} />
      )}

      {markers.map((marker) => (
        <Marker
          key={`${marker.kind}-${marker.id}`}
          position={[marker.lat, marker.lng]}
          icon={
            icons.get(
              `${marker.kind}:${marker.visited ? "1" : "0"}`
            ) ?? markerIcon(marker.kind, marker.visited)
          }
          eventHandlers={{
            click: () => onMarkerClick?.(marker),
          }}
        >
          <Popup minWidth={160}>
            {marker.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={marker.image}
                alt={marker.title}
                className="mb-2 h-24 w-full rounded object-cover"
              />
            )}

            <p className="font-semibold">{marker.title}</p>

            {marker.subtitle && (
              <p className="text-xs text-foreground/60">
                {marker.subtitle}
              </p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
