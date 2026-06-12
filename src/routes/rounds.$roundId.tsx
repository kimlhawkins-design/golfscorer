import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRound, upsertScore } from "../server/golf.functions";

export const Route = createFileRoute("/rounds/$roundId")({
  loader: async ({ params }) => {
    const data = await getRound({ data: { id: Number(params.roundId) } });
    if (!data) throw new Error("Round not found");
    return data;
  },
  component: RoundPage,
});

// Standard par values for 18 holes
const PARS = [4, 4, 3, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5];

function scoreLabel(strokes: number, par: number) {
  const diff = strokes - par;
  if (diff <= -2) return { label: "Eagle", color: "bg-yellow-400 text-yellow-900" };
  if (diff === -1) return { label: "Birdie", color: "bg-green-400 text-green-900" };
  if (diff === 0) return { label: "Par", color: "bg-white/20 text-white" };
  if (diff === 1) return { label: "Bogey", color: "bg-orange-400 text-orange-900" };
  if (diff === 2) return { label: "Double", color: "bg-red-400 text-red-900" };
  return { label: `+${diff}`, color: "bg-red-600 text-white" };
}

function scoreBg(strokes: number | undefined, par: number) {
  if (strokes === undefined) return "";
  const diff = strokes - par;
  if (diff <= -2) return "bg-yellow-400/30 text-yellow-200 font-bold";
  if (diff === -1) return "bg-green-500/30 text-green-200 font-bold";
  if (diff === 0) return "text-white";
  if (diff === 1) return "bg-orange-500/20 text-orange-200";
  if (diff === 2) return "bg-red-500/30 text-red-200";
  return "bg-red-700/40 text-red-200";
}

function RoundPage() {
  const { round, players, scores } = Route.useLoaderData();
  const router = useRouter();
  const upsertFn = useServerFn(upsertScore);

  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [holeInputs, setHoleInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  // Build a map: playerId -> holeNumber -> strokes
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(`${s.playerId}-${s.holeNumber}`, s.strokes);
  }

  const getScore = (playerId: number, hole: number) =>
    scoreMap.get(`${playerId}-${hole}`);

  const playerTotal = (playerId: number) => {
    let total = 0;
    for (let h = 1; h <= 18; h++) {
      const s = getScore(playerId, h);
      if (s !== undefined) total += s;
    }
    return total;
  };

  const playerToPar = (playerId: number) => {
    let diff = 0;
    for (let h = 1; h <= 18; h++) {
      const s = getScore(playerId, h);
      if (s !== undefined) diff += s - PARS[h - 1];
    }
    return diff;
  };

  const holesPlayed = (playerId: number) => {
    let count = 0;
    for (let h = 1; h <= 18; h++) {
      if (getScore(playerId, h) !== undefined) count++;
    }
    return count;
  };

  const openHole = (hole: number) => {
    const inputs: Record<number, string> = {};
    for (const p of players) {
      const existing = getScore(p.id, hole);
      inputs[p.id] = existing !== undefined ? String(existing) : "";
    }
    setHoleInputs(inputs);
    setActiveHole(hole);
  };

  const saveHole = async () => {
    if (activeHole === null) return;
    setSaving(true);
    try {
      for (const p of players) {
        const val = holeInputs[p.id];
        if (val !== "" && val !== undefined) {
          const strokes = parseInt(val, 10);
          if (!isNaN(strokes) && strokes > 0) {
            await upsertFn({
              data: {
                roundId: round.id,
                playerId: p.id,
                holeNumber: activeHole,
                strokes,
              },
            });
          }
        }
      }
      setActiveHole(null);
      router.invalidate();
    } finally {
      setSaving(false);
    }
  };

  const frontNine = Array.from({ length: 9 }, (_, i) => i + 1);
  const backNine = Array.from({ length: 9 }, (_, i) => i + 10);

  const renderScorecard = (holes: number[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-2 px-2 text-green-300 font-semibold w-10">Hole</th>
            <th className="text-center py-2 px-2 text-green-300 font-semibold w-8">Par</th>
            {players.map((p) => (
              <th key={p.id} className="text-center py-2 px-2 text-white font-semibold min-w-[64px]">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holes.map((hole) => {
            const par = PARS[hole - 1];
            const isActive = activeHole === hole;
            return (
              <tr
                key={hole}
                onClick={() => !isActive && openHole(hole)}
                className={`border-b border-white/10 cursor-pointer transition-colors ${
                  isActive ? "bg-white/15" : "hover:bg-white/5"
                }`}
              >
                <td className="py-2.5 px-2 font-bold text-white">{hole}</td>
                <td className="py-2.5 px-2 text-center text-green-400">{par}</td>
                {players.map((p) => {
                  const s = getScore(p.id, hole);
                  return (
                    <td key={p.id} className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block w-9 h-9 leading-9 rounded-full text-sm font-semibold ${
                          s !== undefined ? scoreBg(s, par) : "text-white/30"
                        }`}
                      >
                        {s !== undefined ? s : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* Subtotal */}
          <tr className="border-t-2 border-white/30 bg-white/5">
            <td className="py-2 px-2 text-green-300 font-bold text-xs uppercase">
              {holes[0] === 1 ? "OUT" : "IN"}
            </td>
            <td className="py-2 px-2 text-center text-green-300 font-semibold">
              {holes.reduce((s, h) => s + PARS[h - 1], 0)}
            </td>
            {players.map((p) => {
              const sub = holes.reduce((sum, h) => {
                const s = getScore(p.id, h);
                return sum + (s ?? 0);
              }, 0);
              const hasScores = holes.some((h) => getScore(p.id, h) !== undefined);
              return (
                <td key={p.id} className="py-2 px-2 text-center text-white font-bold">
                  {hasScores ? sub : "—"}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-green-400 hover:text-white transition-colors text-sm">
            ← Rounds
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{round.name}</h1>
            <p className="text-green-400 text-sm">
              {new Date(round.createdAt).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 mb-6">
          <h2 className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-3">Leaderboard</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[...players]
              .sort((a, b) => {
                const aHoles = holesPlayed(a.id);
                const bHoles = holesPlayed(b.id);
                if (aHoles === 0 && bHoles === 0) return a.position - b.position;
                if (aHoles === 0) return 1;
                if (bHoles === 0) return -1;
                return playerToPar(a.id) - playerToPar(b.id);
              })
              .map((p, i) => {
                const total = playerTotal(p.id);
                const toPar = playerToPar(p.id);
                const holes = holesPlayed(p.id);
                return (
                  <div key={p.id} className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-xs text-green-400 mb-1">#{i + 1}</div>
                    <div className="text-white font-bold truncate">{p.name}</div>
                    <div className="text-2xl font-bold mt-1 text-white">{holes > 0 ? total : "—"}</div>
                    <div className={`text-sm font-semibold ${
                      toPar < 0 ? "text-yellow-400" : toPar === 0 ? "text-green-400" : "text-orange-400"
                    }`}>
                      {holes > 0
                        ? toPar === 0
                          ? "E"
                          : toPar > 0
                          ? `+${toPar}`
                          : `${toPar}`
                        : "—"}
                    </div>
                    <div className="text-white/40 text-xs">{holes}/18 holes</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Score Entry Panel */}
        {activeHole !== null && (
          <div className="bg-emerald-800/80 backdrop-blur border border-green-500/50 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Hole {activeHole}</h3>
                <p className="text-green-300 text-sm">Par {PARS[activeHole - 1]}</p>
              </div>
              <button
                onClick={() => setActiveHole(null)}
                className="text-white/50 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {players.map((p) => {
                const strokes = holeInputs[p.id] ? parseInt(holeInputs[p.id], 10) : undefined;
                const par = PARS[activeHole - 1];
                const label = strokes ? scoreLabel(strokes, par) : null;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-white font-medium w-24 truncate">{p.name}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(holeInputs[p.id] || "0", 10);
                          if (cur > 1) setHoleInputs({ ...holeInputs, [p.id]: String(cur - 1) });
                        }}
                        className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full font-bold text-lg transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={holeInputs[p.id] ?? ""}
                        onChange={(e) =>
                          setHoleInputs({ ...holeInputs, [p.id]: e.target.value })
                        }
                        placeholder="—"
                        className="w-14 text-center bg-white/20 border border-white/30 rounded-lg py-2 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-green-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = parseInt(holeInputs[p.id] || "0", 10);
                          setHoleInputs({ ...holeInputs, [p.id]: String(cur + 1) });
                        }}
                        className="w-9 h-9 bg-white/20 hover:bg-white/30 text-white rounded-full font-bold text-lg transition-colors"
                      >
                        +
                      </button>
                      {label && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${label.color}`}>
                          {label.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveHole}
                disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {saving ? "Saving…" : "Save Hole"}
              </button>
              {activeHole < 18 && (
                <button
                  onClick={async () => {
                    await saveHole();
                    openHole(activeHole + 1);
                  }}
                  disabled={saving}
                  className="flex-1 bg-white/15 hover:bg-white/25 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Save & Next →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scorecard */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-white/20">
            <h2 className="text-white font-bold">Scorecard</h2>
            <p className="text-green-400 text-xs">Tap a hole to enter scores</p>
          </div>

          {/* Front 9 */}
          <div className="px-2 py-2 border-b border-white/10">
            <div className="text-green-400 text-xs font-semibold uppercase px-2 mb-1">Front Nine</div>
            {renderScorecard(frontNine)}
          </div>

          {/* Back 9 */}
          <div className="px-2 py-2 border-b border-white/10">
            <div className="text-green-400 text-xs font-semibold uppercase px-2 mb-1">Back Nine</div>
            {renderScorecard(backNine)}
          </div>

          {/* Total */}
          <div className="px-2 py-2">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-white/10">
                  <td className="py-3 px-2 font-bold text-green-300 uppercase text-xs tracking-wide w-10">Total</td>
                  <td className="py-3 px-2 text-center text-green-300 font-bold w-8">
                    {PARS.reduce((a, b) => a + b, 0)}
                  </td>
                  {players.map((p) => {
                    const total = playerTotal(p.id);
                    const toPar = playerToPar(p.id);
                    const holes = holesPlayed(p.id);
                    return (
                      <td key={p.id} className="py-3 px-2 text-center min-w-[64px]">
                        {holes > 0 ? (
                          <div>
                            <div className="text-white font-bold">{total}</div>
                            <div className={`text-xs font-semibold ${
                              toPar < 0 ? "text-yellow-400" : toPar === 0 ? "text-green-400" : "text-orange-400"
                            }`}>
                              {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : toPar}
                            </div>
                          </div>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Legend */}
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          {[
            { color: "bg-yellow-400/30 text-yellow-200", label: "Eagle (−2)" },
            { color: "bg-green-500/30 text-green-200", label: "Birdie (−1)" },
            { color: "text-white", label: "Par (E)" },
            { color: "bg-orange-500/20 text-orange-200", label: "Bogey (+1)" },
            { color: "bg-red-500/30 text-red-200", label: "Double (+2)" },
          ].map(({ color, label }) => (
            <span key={label} className={`px-2 py-1 rounded-full ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
