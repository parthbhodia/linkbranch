"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PIN_ZOOM, type MapPin } from "@/lib/map-location";

/**
 * A Leaflet map with one pin. Leaflet reads `window` when its module loads,
 * so this file must only ever be imported through next/dynamic with ssr off
 * (see find-us.tsx and location-picker.tsx); it is never rendered on the
 * server.
 *
 * Tiles come from OpenStreetMap directly, which is fine at this scale and
 * needs no key. The default marker is replaced with an inline SVG because
 * Leaflet's PNG icons resolve to paths the bundler does not ship.
 */

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

const PIN_SVG =
  '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M16 1C8.3 1 2 7.2 2 14.9 2 25.5 16 39 16 39s14-13.5 14-24.1C30 7.2 23.7 1 16 1z" fill="#b64a29" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5.5" fill="#fff"/></svg>';

const pinIcon = L.divIcon({
  className: "map-pin",
  html: PIN_SVG,
  iconSize: [32, 40],
  iconAnchor: [16, 39],
});

export function LocationMap({
  pin,
  label,
  zoom = PIN_ZOOM,
  interactive = false,
  onPinChange,
}: {
  pin: MapPin;
  /** Accessible name for the map region, and the marker's title. */
  label: string;
  zoom?: number;
  /** Draggable pin and click-to-place. Off on the public page. */
  interactive?: boolean;
  onPinChange?: (pin: MapPin) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  // The handler can change identity every render; the map is built once.
  const onPinChangeRef = useRef(onPinChange);
  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      // Wheel-zoom on a page you are scrolling past is a well-known trap; the
      // public map only zooms via its buttons or a pinch.
      scrollWheelZoom: interactive,
      attributionControl: true,
    });
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    const marker = L.marker([pin.lat, pin.lng], {
      icon: pinIcon,
      draggable: interactive,
      keyboard: interactive,
      title: label,
      alt: label,
    }).addTo(map);
    map.setView([pin.lat, pin.lng], zoom);

    if (interactive) {
      marker.on("dragend", () => {
        const at = marker.getLatLng();
        onPinChangeRef.current?.({ lat: at.lat, lng: at.lng });
      });
      map.on("click", (event: L.LeafletMouseEvent) => {
        marker.setLatLng(event.latlng);
        onPinChangeRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng });
      });
    }

    // The container is often sized after mount (a collapsing section, a grid
    // still settling), and Leaflet renders for the size it saw first.
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container);

    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // pin/zoom/label changes are applied by the effect below, not by
    // rebuilding the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const at = marker.getLatLng();
    if (Math.abs(at.lat - pin.lat) < 1e-9 && Math.abs(at.lng - pin.lng) < 1e-9) return;
    marker.setLatLng([pin.lat, pin.lng]);
    map.setView([pin.lat, pin.lng], map.getZoom());
  }, [pin.lat, pin.lng]);

  return (
    <div
      ref={containerRef}
      className="location-map"
      role="region"
      aria-label={interactive ? `Map of ${label}. Drag the pin or tap to move it.` : `Map showing ${label}`}
    />
  );
}
