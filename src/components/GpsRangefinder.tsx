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

const metersToYards = (m: number) => m * 1.09361;

function DistanceReadout({
  label,
  target,
  position,
}: {
  label: string;
  target: { lat: number; lng: number } | null;
  position: Position | null;
}) {
  const meters =
    target && position ? distanceMeters(position, target) : null;
  return (
    <div className="flex-1 bg-white/5 rounded-2xl p-4 text-center">
      <div className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </div>
      {meters === null ? (
        <div className="text-white/30 text-sm py-2">
          {target ? "Waiting for GPS…" : "Not marked"}
        </div>
      ) : (
        <div>
          <div className="text-white font-bold text-4xl tabular-nums leading-none">
            {Math.round(metersToYards(meters))}
            <span className="text-base font-semibold text-green-300 ml-1">yd</span>
          </div>
          <div className="text-white/50 text-sm mt-1 tabular-nums">
            {Math.round(meters)} m
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
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-green-300 text-xs font-semibold uppercase tracking-wider">
          GPS Rangefinder
        </h2>
        {watching ? (
          <button
            onClick={stopGps}
            className="text-xs font-semibold text-white/70 hover:text-white bg-white/10 px-3 py-1.5 rounded-full transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={startGps}
            className="text-xs font-semibold text-green-900 bg-green-400 hover:bg-green-300 px-3 py-1.5 rounded-full transition-colors"
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
          className="w-11 h-11 flex items-center justify-center bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white rounded-xl font-bold text-2xl leading-none transition-colors"
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
          className="w-11 h-11 flex items-center justify-center bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white rounded-xl font-bold text-2xl leading-none transition-colors"
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
        <p className="text-green-300 text-sm text-center mb-3 animate-pulse">
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
          className="flex-1 bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving === "tee" ? "Marking…" : tee ? "Re-mark Tee" : "Mark Tee Here"}
        </button>
        <button
          onClick={() => markPoint("green")}
          disabled={!position || saving !== null}
          className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
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
