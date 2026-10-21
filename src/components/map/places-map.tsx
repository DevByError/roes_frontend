"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ImageOverlay, MapContainer, Marker, useMap } from "react-leaflet";
import { MAP_BOUNDS, MAP_IMAGE } from "@/lib/map-config";
import type { Place } from "@/lib/types";

const HOUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`;
const BUILDING = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/></svg>`;

function pin(place: Place, selected: boolean) {
  const residential = place.kind === "residential";
  const bg = residential ? "var(--pin-res)" : "var(--pin-public)";
  const ink = residential ? "var(--pin-res-ink)" : "var(--pin-public-ink)";
  return L.divIcon({
    className: "",
    html: `<div class="roes-pin" style="background:${bg};color:${ink};${selected ? "transform:rotate(-45deg) scale(1.3);box-shadow:0 0 0 6px rgb(254 145 105 / .35),0 8px 20px rgb(0 0 0 / .4)" : ""}"><span>${residential ? HOUSE : BUILDING}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function FlyTo({ place, all }: { place?: Place; all: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (place) map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [place, map]);
  useEffect(() => {
    if (!place && all.length) {
      map.fitBounds(L.latLngBounds(all.map((p) => [p.lat, p.lng] as [number, number])).pad(0.18), { animate: true });
    }
  }, [all.length, place === undefined]);
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.setMinZoom(map.getBoundsZoom(L.latLngBounds(MAP_BOUNDS), true));
    };
    const t = setTimeout(fit, 250);
    fit();
    map.on("resize", fit);
    return () => {
      clearTimeout(t);
      map.off("resize", fit);
    };
  }, [map]);
  return null;
}

export default function PlacesMap({
  places,
  allPlaces,
  selectedId,
  onSelect,
  center,
}: {
  places: Place[];
  allPlaces: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center: [number, number];
}) {
  const selected = useMemo(() => allPlaces.find((p) => p.id === selectedId), [allPlaces, selectedId]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      zoomSnap={0.5}
      maxZoom={14}
      maxBounds={L.latLngBounds(MAP_BOUNDS).pad(0.05)}
      maxBoundsViscosity={1}
      scrollWheelZoom
      className="size-full bg-(--map-bg)"
      zoomControl
      attributionControl
    >
      <ImageOverlay url={MAP_IMAGE} bounds={MAP_BOUNDS} className="roes-map-img" attribution="Preview map image · live map API coming soon" />
      {places.map((p) => (
        <Marker key={p.id + (p.id === selectedId ? "-sel" : "")} position={[p.lat, p.lng]} icon={pin(p, p.id === selectedId)} eventHandlers={{ click: () => onSelect(p.id) }} title={p.name} keyboard />
      ))}
      <FlyTo place={selected} all={places} />
    </MapContainer>
  );
}
