import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { setHoleLocation } from "../server/golf.functions";

export type HoleLocation = {
  id: number;
  course: string;
  holeNumber: number;
  greenLat: number | null;
  greenLng: number | null;
  teeLat: number | null;
  teeLng: number | null;
};

type Position = { lat: number; lng: number; accuracy: number };

// Great-circle distance between two coordinates, in metres (haversine).
function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function DistanceReadout({
  label,
  target,
  position,
}: {
  label: string;
  target: { lat: number; lng: number } | null;
  position: Position | null;
}) {
  const metres =
    target && position ? distanceMeters(position, target) : null;
  return (
    <div className="flex-1 app-panel-soft border rounded-xl p-4 text-center">
      <div className="app-accent-text text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </div>
      {metres === null ? (
        <div className="text-white/30 text-sm py-2">
          {target ? "Waiting for GPS…" : "Not marked"}
        </div>
      ) : (
        <div>
          <div className="text-white font-bold text-4xl tabular-nums leading-none">
            {Math.round(metres)}
            <span className="text-base font-semibold app-accent-text ml-1">m</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function GpsRangefinder({
  course,
  hole,
  onHoleChange,
  locations,
}: {
  course: string;
  hole: number;
  onHoleChange: (hole: number) => void;
  locations: HoleLocation[];
}) {
  const router = useRouter();
  const setLocationFn = useServerFn(setHoleLocation);

  const [position, setPosition] = useState<Position | null>(null);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"tee" | "green" | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchId.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const startGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    setError(null);
    setWatching(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it to use the rangefinder."
            : "Unable to get your location.",
        );
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  };

  const stopGps = () => {
    if (watchId.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setWatching(false);
  };

  const loc = locations.find((l) => l.holeNumber === hole);
  const green =
    loc && loc.greenLat !== null && loc.greenLng !== null
      ? { lat: loc.greenLat, lng: loc.greenLng }
      : null;
  const tee =
    loc && loc.teeLat !== null && loc.teeLng !== null
      ? { lat: loc.teeLat, lng: loc.teeLng }
      : null;

  const markPoint = async (point: "tee" | "green") => {
    if (!position) return;
    setSaving(point);
    try {
      await setLocationFn({
        data: {
          course,
          holeNumber: hole,
          point,
          lat: position.lat,
          lng: position.lng,
        },
      });
      router.invalidate();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="app-panel backdrop-blur border rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="app-accent-text text-xs font-semibold uppercase tracking-wider">
          GPS Rangefinder
        </h2>
        {watching ? (
          <button
            onClick={stopGps}
            className="app-btn app-btn-secondary min-h-9 px-3 py-1.5 text-xs"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={startGps}
            className="app-btn app-btn-primary min-h-9 px-3 py-1.5 text-xs"
          >
            Start GPS
          </button>
        )}
      </div>

      {/* Hole selector */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          aria-label="Previous hole"
          onClick={() => onHoleChange(Math.max(1, hole - 1))}
          disabled={hole <= 1}
          className="app-icon-btn h-11 w-11 disabled:opacity-30 text-2xl font-bold"
        >
          −
        </button>
        <div className="text-center">
          <div className="text-white/50 text-xs uppercase tracking-wide">Hole</div>
          <div className="text-white font-bold text-2xl leading-none">{hole}</div>
        </div>
        <button
          aria-label="Next hole"
          onClick={() => onHoleChange(Math.min(18, hole + 1))}
          disabled={hole >= 18}
          className="app-icon-btn h-11 w-11 disabled:opacity-30 text-2xl font-bold"
        >
          +
        </button>
      </div>

      {/* Distances */}
      <div className="flex gap-3 mb-4">
        <DistanceReadout label="To Green" target={green} position={position} />
        <DistanceReadout label="To Tee" target={tee} position={position} />
      </div>

      {/* Status line */}
      {error ? (
        <p className="text-red-300 text-sm text-center mb-3">{error}</p>
      ) : watching && !position ? (
        <p className="app-accent-text text-sm text-center mb-3 animate-pulse">
          Acquiring satellites…
        </p>
      ) : position ? (
        <p className="text-white/40 text-xs text-center mb-3 tabular-nums">
          Accuracy ±{Math.round(position.accuracy)} m
        </p>
      ) : (
        <p className="text-white/40 text-xs text-center mb-3">
          Start GPS to see live distances. Stand on the tee or green and mark it
          to set up this course.
        </p>
      )}

      {/* Mark buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => markPoint("tee")}
          disabled={!position || saving !== null}
          className="app-btn app-btn-secondary flex-1 py-2.5 text-sm disabled:opacity-40"
        >
          {saving === "tee" ? "Marking…" : tee ? "Re-mark Tee" : "Mark Tee Here"}
        </button>
        <button
          onClick={() => markPoint("green")}
          disabled={!position || saving !== null}
          className="app-btn app-btn-primary flex-1 py-2.5 text-sm disabled:opacity-40"
        >
          {saving === "green"
            ? "Marking…"
            : green
            ? "Re-mark Green"
            : "Mark Green Here"}
        </button>
      </div>
    </div>
  );
}
