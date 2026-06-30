import type { TeeKey } from "../courses";

type LatLng = {
  lat: number;
  lng: number;
};

type FairwayMapProps = {
  hole: number;
  par: number;
  metres: number;
  strokeIndex: number;
  tee: TeeKey;
  teeLocation?: LatLng | null;
  greenLocation?: LatLng | null;
  onPrevious?: () => void;
  onNext?: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
};

const holeShapes = [
  { bend: -18, width: 34, greenX: 49, bunkerA: 38, bunkerB: 63, water: false },
  { bend: 12, width: 32, greenX: 55, bunkerA: 65, bunkerB: 36, water: true },
  { bend: -6, width: 30, greenX: 46, bunkerA: 34, bunkerB: 66, water: false },
  { bend: 20, width: 38, greenX: 58, bunkerA: 68, bunkerB: 42, water: false },
  { bend: -22, width: 31, greenX: 43, bunkerA: 32, bunkerB: 61, water: true },
  { bend: 3, width: 26, greenX: 51, bunkerA: 60, bunkerB: 39, water: false },
] as const;

function fairwayPath(hole: number) {
  const shape = holeShapes[(hole - 1) % holeShapes.length];
  const leftMid = 50 - shape.width / 2 + shape.bend;
  const rightMid = 50 + shape.width / 2 + shape.bend;
  const greenX = shape.greenX;

  return {
    shape,
    path: [
      "M 40 94",
      "C " + (leftMid - 8) + " 74, " + (leftMid - 5) + " 58, " + (greenX - 17) + " 33",
      "C " + (greenX - 10) + " 24, " + (greenX + 10) + " 24, " + (greenX + 17) + " 33",
      "C " + (rightMid + 7) + " 58, " + (rightMid + 8) + " 74, 60 94",
      "C 54 98, 46 98, 40 94",
      "Z",
    ].join(" "),
    center: "M 50 94 C " + (50 + shape.bend) + " 72, " + greenX + " 48, " + greenX + " 25",
  };
}

function distanceMeters(a: LatLng, b: LatLng) {
  const radius = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function bearingDegrees(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function compassLabel(degrees: number) {
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round(degrees / 45) % labels.length];
}

function GpsHoleDiagram({
  hole,
  teeLocation,
  greenLocation,
}: {
  hole: number;
  teeLocation: LatLng;
  greenLocation: LatLng;
}) {
  const measured = Math.round(distanceMeters(teeLocation, greenLocation));
  const bearing = Math.round(bearingDegrees(teeLocation, greenLocation));
  const compass = compassLabel(bearing);
  const shape = holeShapes[(hole - 1) % holeShapes.length];
  const greenX = 50 + Math.max(-18, Math.min(18, shape.bend * 0.6));
  const leftMid = 50 - shape.width / 2 + shape.bend * 0.55;
  const rightMid = 50 + shape.width / 2 + shape.bend * 0.55;
  const path = [
    "M 39 94",
    "C " + (leftMid - 7) + " 76, " + (leftMid - 6) + " 58, " + (greenX - 16) + " 33",
    "C " + (greenX - 9) + " 24, " + (greenX + 9) + " 24, " + (greenX + 16) + " 33",
    "C " + (rightMid + 7) + " 58, " + (rightMid + 6) + " 76, 61 94",
    "C 54 98, 46 98, 39 94",
    "Z",
  ].join(" ");

  return (
    <div className="relative h-[360px] bg-[radial-gradient(circle_at_50%_18%,rgba(134,239,172,0.24),transparent_30%),linear-gradient(180deg,#123b2e_0%,#165f39_52%,#09281f_100%)]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label={"GPS measured hole diagram for hole " + hole} preserveAspectRatio="none">
        <defs>
          <linearGradient id={"gps-fairway-" + hole} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a7f36f" />
            <stop offset="55%" stopColor="#4fbc50" />
            <stop offset="100%" stopColor="#2b8c3d" />
          </linearGradient>
          <filter id={"gps-shadow-" + hole} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodColor="#03140e" floodOpacity="0.42" />
          </filter>
        </defs>

        <path d={path} fill={"url(#gps-fairway-" + hole + ")"} filter={"url(#gps-shadow-" + hole + ")"} />
        <path d={"M 50 92 C " + (50 + shape.bend * 0.6) + " 70, " + greenX + " 48, " + greenX + " 25"} fill="none" stroke="#ecfccb" strokeOpacity="0.55" strokeWidth="0.9" strokeDasharray="2 2.6" />

        <ellipse cx={greenX} cy="21" rx="13" ry="7" fill="#93f36b" stroke="#ecfccb" strokeOpacity="0.75" strokeWidth="0.7" />
        <circle cx={greenX + 3} cy="20" r="1.5" fill="#14532d" />
        <path d={"M " + (greenX + 3) + " 20 L " + (greenX + 3) + " 10.5"} stroke="#f8fafc" strokeWidth="0.65" />
        <path d={"M " + (greenX + 3) + " 10.5 L " + (greenX + 9) + " 12.8 L " + (greenX + 3) + " 15 Z"} fill="#ef4444" />

        <ellipse cx={shape.bunkerA} cy="40" rx="6" ry="3.7" fill="#f6e7b4" opacity="0.95" />
        <ellipse cx={shape.bunkerB} cy="57" rx="5.5" ry="3.2" fill="#f6e7b4" opacity="0.9" />
        {shape.water && <path d="M 7 66 C 18 58, 27 61, 33 70 C 24 79, 12 78, 7 66 Z" fill="#38bdf8" opacity="0.8" />}

        <ellipse cx="50" cy="94" rx="10" ry="4.5" fill="#b8a06a" />
        <rect x="44" y="90" width="12" height="3" rx="1.5" fill="#e7d7a0" />
      </svg>

      <div className="absolute left-4 top-4 rounded-xl bg-black/30 px-3 py-2 backdrop-blur">
        <div className="text-white/55 text-[10px] uppercase tracking-wider">GPS layout</div>
        <div className="text-white text-sm font-semibold">Measured tee to green</div>
      </div>

      <div className="absolute right-4 top-4 rounded-full bg-black/30 px-3 py-2 text-center backdrop-blur">
        <div className="text-white/45 text-[10px] uppercase tracking-wider">Bearing</div>
        <div className="text-white text-sm font-bold tabular-nums">{compass} {bearing}°</div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-black/30 px-3 py-2 text-center backdrop-blur">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Measured</div>
          <div className="text-white font-bold tabular-nums">{measured} m</div>
        </div>
        <div className="rounded-xl bg-black/30 px-3 py-2 text-center backdrop-blur">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Tee</div>
          <div className="text-white font-bold">Marked</div>
        </div>
        <div className="rounded-xl bg-black/30 px-3 py-2 text-center backdrop-blur">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Green</div>
          <div className="text-white font-bold">Marked</div>
        </div>
      </div>
    </div>
  );
}

function IllustratedHoleMap({ hole }: { hole: number }) {
  const { shape, path, center } = fairwayPath(hole);
  const fairwayId = "fairway-" + hole;
  const shadowId = "soft-shadow-" + hole;

  return (
    <div className="relative h-[360px] bg-[radial-gradient(circle_at_50%_18%,rgba(134,239,172,0.22),transparent_30%),linear-gradient(180deg,#0f3d2e_0%,#155534_48%,#0b2f24_100%)]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label={"Illustrated fairway map for hole " + hole} preserveAspectRatio="none">
        <defs>
          <linearGradient id={fairwayId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9be36f" />
            <stop offset="52%" stopColor="#4fb34d" />
            <stop offset="100%" stopColor="#2f8f3d" />
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#03140e" floodOpacity="0.35" />
          </filter>
        </defs>

        <path d={path} fill={"url(#" + fairwayId + ")"} filter={"url(#" + shadowId + ")"} />
        <path d={center} fill="none" stroke="#dcfce7" strokeOpacity="0.28" strokeWidth="0.8" strokeDasharray="2 3" />

        <ellipse cx={shape.greenX} cy="21" rx="13" ry="7" fill="#8ce85f" stroke="#dcfce7" strokeOpacity="0.65" strokeWidth="0.7" />
        <circle cx={shape.greenX + 3} cy="20" r="1.5" fill="#14532d" />
        <path d={"M " + (shape.greenX + 3) + " 20 L " + (shape.greenX + 3) + " 11"} stroke="#f8fafc" strokeWidth="0.65" />
        <path d={"M " + (shape.greenX + 3) + " 11 L " + (shape.greenX + 9) + " 13 L " + (shape.greenX + 3) + " 15 Z"} fill="#ef4444" />

        <ellipse cx={shape.bunkerA} cy="39" rx="6" ry="3.7" fill="#f6e7b4" opacity="0.95" />
        <ellipse cx={shape.bunkerB} cy="56" rx="5.5" ry="3.2" fill="#f6e7b4" opacity="0.9" />
        {shape.water && <path d="M 7 66 C 18 58, 27 61, 33 70 C 24 79, 12 78, 7 66 Z" fill="#38bdf8" opacity="0.8" />}

        <ellipse cx="50" cy="94" rx="10" ry="4.5" fill="#b8a06a" />
        <rect x="44" y="90" width="12" height="3" rx="1.5" fill="#e7d7a0" />
      </svg>

      <div className="absolute left-4 top-4 rounded-xl bg-black/25 px-3 py-2 backdrop-blur">
        <div className="text-white/50 text-[10px] uppercase tracking-wider">Club view</div>
        <div className="text-white text-sm font-semibold">Fairway guide</div>
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/25 px-3 py-2 text-center text-white/70 text-xs backdrop-blur">
        Mark this hole's tee and green in GPS Rangefinder to unlock a measured layout.
      </div>
    </div>
  );
}

export function FairwayMap({
  hole,
  par,
  metres,
  strokeIndex,
  tee,
  teeLocation,
  greenLocation,
  onPrevious,
  onNext,
  canPrevious = true,
  canNext = true,
}: FairwayMapProps) {
  const teeLabel = tee === "womens" ? "Women's card" : "Men's card";
  const hasGpsLayout = Boolean(teeLocation && greenLocation);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/20 bg-slate-950/45 shadow-2xl shadow-black/20 mb-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
        <div>
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider">Course view</div>
          <div className="text-white font-bold">Hole {hole} fairway</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
          {hasGpsLayout ? "GPS layout" : "Illustrated"}
        </div>
      </div>

      {teeLocation && greenLocation ? (
        <GpsHoleDiagram hole={hole} teeLocation={teeLocation} greenLocation={greenLocation} />
      ) : (
        <IllustratedHoleMap hole={hole} />
      )}

      <div className="grid grid-cols-3 gap-2 bg-black/20 p-3">
        <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Par</div>
          <div className="text-white font-bold">{par}</div>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Card</div>
          <div className="text-white font-bold tabular-nums">{metres} m</div>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Index</div>
          <div className="text-white font-bold tabular-nums">{strokeIndex}</div>
        </div>
      </div>
    </section>
  );
}
