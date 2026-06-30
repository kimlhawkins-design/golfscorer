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

function mapboxSatelliteUrl(teeLocation?: LatLng | null, greenLocation?: LatLng | null) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  if (!token || !teeLocation || !greenLocation) return null;

  const pins = [
    "pin-s-t+14532d(" + teeLocation.lng + "," + teeLocation.lat + ")",
    "pin-s-g+ef4444(" + greenLocation.lng + "," + greenLocation.lat + ")",
  ].join(",");

  return "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/" +
    pins + "/auto/720x720@2x?padding=70,70,70,70&access_token=" + encodeURIComponent(token);
}

function SatelliteHoleMap({
  hole,
  teeLocation,
  greenLocation,
  mapUrl,
}: {
  hole: number;
  teeLocation: LatLng;
  greenLocation: LatLng;
  mapUrl: string;
}) {
  return (
    <div className="relative h-[360px] overflow-hidden bg-slate-900">
      <img
        src={mapUrl}
        alt={"Satellite hole map for hole " + hole}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

      <div className="absolute left-4 top-4 rounded-xl bg-black/35 px-3 py-2 backdrop-blur">
        <div className="text-white/55 text-[10px] uppercase tracking-wider">Real layout</div>
        <div className="text-white text-sm font-semibold">Satellite hole map</div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-black/35 px-3 py-2 backdrop-blur">
          <div className="text-white/55 text-[10px] uppercase tracking-wider">Tee</div>
          <div className="text-white text-xs font-semibold tabular-nums">
            {teeLocation.lat.toFixed(5)}, {teeLocation.lng.toFixed(5)}
          </div>
        </div>
        <div className="rounded-xl bg-black/35 px-3 py-2 backdrop-blur">
          <div className="text-white/55 text-[10px] uppercase tracking-wider">Green</div>
          <div className="text-white text-xs font-semibold tabular-nums">
            {greenLocation.lat.toFixed(5)}, {greenLocation.lng.toFixed(5)}
          </div>
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
  const satelliteUrl = mapboxSatelliteUrl(teeLocation, greenLocation);
  const hasRealMap = Boolean(satelliteUrl && teeLocation && greenLocation);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/20 bg-slate-950/45 shadow-2xl shadow-black/20 mb-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
        <button
          type="button"
          aria-label="Previous hole"
          onClick={onPrevious}
          disabled={!canPrevious}
          className="w-10 h-10 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 disabled:opacity-30 transition-colors"
        >
          -
        </button>
        <div className="text-center min-w-0">
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider">Hole {hole}</div>
          <div className="text-white font-bold text-lg leading-tight">Par {par} · {metres} m · SI {strokeIndex}</div>
          <div className="text-white/45 text-xs">{teeLabel} · {hasRealMap ? "Real satellite layout" : "Illustrated guide"}</div>
        </div>
        <button
          type="button"
          aria-label="Next hole"
          onClick={onNext}
          disabled={!canNext}
          className="w-10 h-10 rounded-xl bg-white/10 text-white text-xl font-bold hover:bg-white/20 disabled:opacity-30 transition-colors"
        >
          +
        </button>
      </div>

      {satelliteUrl && teeLocation && greenLocation ? (
        <SatelliteHoleMap hole={hole} teeLocation={teeLocation} greenLocation={greenLocation} mapUrl={satelliteUrl} />
      ) : (
        <IllustratedHoleMap hole={hole} />
      )}

      <div className="grid grid-cols-3 gap-2 bg-black/20 p-3">
        <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Par</div>
          <div className="text-white font-bold">{par}</div>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Metres</div>
          <div className="text-white font-bold tabular-nums">{metres}</div>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-center">
          <div className="text-white/45 text-[10px] uppercase tracking-wider">Index</div>
          <div className="text-white font-bold tabular-nums">{strokeIndex}</div>
        </div>
      </div>
    </section>
  );
}
