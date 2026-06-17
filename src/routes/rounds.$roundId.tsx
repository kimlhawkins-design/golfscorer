import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRound, upsertScore, updatePlayerHandicap } from "../server/golf.functions";
import { getCourse, stablefordPoints, strokesReceived } from "../courses";
import { GpsRangefinder } from "../components/GpsRangefinder";

export const Route = createFileRoute("/rounds/$roundId")({
  loader: async ({ params }) => {
    const data = await getRound({ data: { id: Number(params.roundId) } });
    if (!data) throw new Error("Round not found");
    return data;
  },
  component: RoundPage,
});

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

// Background styling for a Stableford points cell (more points = better).
function pointsBg(points: number | undefined) {
  if (points === undefined) return "";
  if (points >= 4) return "bg-yellow-400/30 text-yellow-200 font-bold";
  if (points === 3) return "bg-green-500/30 text-green-200 font-bold";
  if (points === 2) return "text-white";
  if (points === 1) return "bg-orange-500/20 text-orange-200";
  return "bg-red-700/40 text-red-200";
}

function RoundPage() {
  const { round, players, scores, holeLocations } = Route.useLoaderData();
  const router = useRouter();
  const upsertFn = useServerFn(upsertScore);
  const updateHandicapFn = useServerFn(updatePlayerHandicap);

  const course = getCourse(round.course);
  const PARS = course.pars;
  const SI = course.strokeIndex;

  const [scoringMode, setScoringMode] = useState<"stableford" | "stroke">("stableford");
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [gpsHole, setGpsHole] = useState(1);
  const [holeInputs, setHoleInputs] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [editingHcp, setEditingHcp] = useState(false);
  const [hcpInputs, setHcpInputs] = useState<Record<number, string>>({});
  const [savingHcp, setSavingHcp] = useState(false);

  // Build a map: playerId -> holeNumber -> strokes
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(`${s.playerId}-${s.holeNumber}`, s.strokes);
  }

  const getScore = (playerId: number, hole: number) =>
    scoreMap.get(`${playerId}-${hole}`);

  const handicapOf = (playerId: number) =>
    players.find((p) => p.id === playerId)?.handicap ?? 0;

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

  // Stableford points for a single hole, or undefined if no score entered.
  const holePoints = (playerId: number, hole: number) => {
    const s = getScore(playerId, hole);
    if (s === undefined) return undefined;
    return stablefordPoints(s, PARS[hole - 1], handicapOf(playerId), SI[hole - 1]);
  };

  // Total Stableford points across the holes a player has scored.
  const playerPoints = (playerId: number) => {
    let total = 0;
    for (let h = 1; h <= 18; h++) {
      const pts = holePoints(playerId, h);
      if (pts !== undefined) total += pts;
    }
    return total;
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
    setGpsHole(hole);
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

  const openHcpEditor = () => {
    const inputs: Record<number, string> = {};
    for (const p of players) inputs[p.id] = String(p.handicap ?? 0);
    setHcpInputs(inputs);
    setEditingHcp(true);
  };

  const saveHandicaps = async () => {
    setSavingHcp(true);
    try {
      for (const p of players) {
        const raw = hcpInputs[p.id];
        const next = Math.max(0, Math.round((parseFloat(raw ?? "") || 0) * 10) / 10);
        if (next !== (p.handicap ?? 0)) {
          await updateHandicapFn({ data: { playerId: p.id, handicap: next } });
        }
      }
      setEditingHcp(false);
      router.invalidate();
    } finally {
      setSavingHcp(false);
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
            <th className="text-center py-2 px-2 text-green-300/70 font-semibold w-8">SI</th>
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
                <td className="py-2.5 px-2 text-center text-green-300/50 text-xs">{SI[hole - 1]}</td>
                {players.map((p) => {
                  const s = getScore(p.id, hole);
                  if (scoringMode === "stableford") {
                    const pts = holePoints(p.id, hole);
                    return (
                      <td key={p.id} className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block w-9 h-9 leading-9 rounded-full text-sm font-semibold ${
                            pts !== undefined ? pointsBg(pts) : "text-white/30"
                          }`}
                          title={s !== undefined ? `${s} strokes` : undefined}
                        >
                          {pts !== undefined ? pts : "—"}
                        </span>
                      </td>
                    );
                  }
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
            <td className="py-2 px-2"></td>
            {players.map((p) => {
              const hasScores = holes.some((h) => getScore(p.id, h) !== undefined);
              const sub = holes.reduce((sum, h) => {
                if (scoringMode === "stableford") {
                  return sum + (holePoints(p.id, h) ?? 0);
                }
                return sum + (getScore(p.id, h) ?? 0);
              }, 0);
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
              {course.name} · Par {PARS.reduce((a, b) => a + b, 0)} ·{" "}
              {new Date(round.createdAt).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="text-green-300 text-xs font-semibold uppercase tracking-wider">Leaderboard</h2>
            <div className="flex rounded-lg overflow-hidden border border-white/20 text-xs">
              {(["stableford", "stroke"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setScoringMode(mode)}
                  className={`px-3 py-1.5 font-semibold transition-colors ${
                    scoringMode === mode
                      ? "bg-green-500 text-white"
                      : "bg-white/5 text-green-200 hover:bg-white/10"
                  }`}
                >
                  {mode === "stableford" ? "Stableford" : "Stroke"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[...players]
              .sort((a, b) => {
                const aHoles = holesPlayed(a.id);
                const bHoles = holesPlayed(b.id);
                if (aHoles === 0 && bHoles === 0) return a.position - b.position;
                if (aHoles === 0) return 1;
                if (bHoles === 0) return -1;
                return scoringMode === "stableford"
                  ? playerPoints(b.id) - playerPoints(a.id)
                  : playerToPar(a.id) - playerToPar(b.id);
              })
              .map((p, i) => {
                const total = playerTotal(p.id);
                const toPar = playerToPar(p.id);
                const points = playerPoints(p.id);
                const holes = holesPlayed(p.id);
                return (
                  <div key={p.id} className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-xs text-green-400 mb-1">#{i + 1}</div>
                    <div className="text-white font-bold truncate">{p.name}</div>
                    {scoringMode === "stableford" ? (
                      <>
                        <div className="text-2xl font-bold mt-1 text-white">
                          {holes > 0 ? points : "—"}
                        </div>
                        <div className="text-sm font-semibold text-green-400">
                          {holes > 0 ? "pts" : ""}
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    <div className="text-white/40 text-xs">Hcp {p.handicap ?? 0} · {holes}/18</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Handicaps */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="text-green-300 text-xs font-semibold uppercase tracking-wider">Handicaps</h2>
            {!editingHcp ? (
              <button
                onClick={openHcpEditor}
                className="text-xs font-semibold text-green-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingHcp(false)}
                  className="text-xs font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveHandicaps}
                  disabled={savingHcp}
                  className="text-xs font-semibold text-white bg-green-500 hover:bg-green-400 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {savingHcp ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {players.map((p) => (
              <div key={p.id} className="bg-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="text-white text-sm font-medium truncate">{p.name}</span>
                {editingHcp ? (
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={hcpInputs[p.id] ?? ""}
                    onChange={(e) => setHcpInputs({ ...hcpInputs, [p.id]: e.target.value })}
                    aria-label={`${p.name} handicap`}
                    className="w-14 shrink-0 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                ) : (
                  <span className="text-green-300 font-bold tabular-nums shrink-0">{p.handicap ?? 0}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* GPS Rangefinder */}
        <GpsRangefinder
          course={round.course}
          hole={gpsHole}
          onHoleChange={setGpsHole}
          locations={holeLocations}
        />

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
                const recv = strokesReceived(handicapOf(p.id), SI[activeHole - 1]);
                const pts =
                  strokes !== undefined
                    ? stablefordPoints(strokes, par, handicapOf(p.id), SI[activeHole - 1])
                    : undefined;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-2xl p-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold truncate">{p.name}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {label && (
                          <span className={`self-start text-xs font-bold px-2 py-0.5 rounded-full ${label.color}`}>
                            {label.label}
                          </span>
                        )}
                        {pts !== undefined && (
                          <span className="self-start text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100">
                            {pts} pt{pts === 1 ? "" : "s"}
                          </span>
                        )}
                        {recv > 0 && (
                          <span className="self-start text-[10px] text-green-300/70">
                            +{recv} stroke{recv === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        aria-label={`Decrease ${p.name}'s score`}
                        onClick={() => {
                          const cur = parseInt(holeInputs[p.id] || "0", 10);
                          if (cur > 1) setHoleInputs({ ...holeInputs, [p.id]: String(cur - 1) });
                        }}
                        className="w-14 h-14 flex items-center justify-center bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-2xl font-bold text-3xl leading-none transition-colors select-none"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-white font-bold text-3xl tabular-nums">
                        {strokes ?? "—"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${p.name}'s score`}
                        onClick={() => {
                          const cur = parseInt(holeInputs[p.id] || "0", 10);
                          setHoleInputs({ ...holeInputs, [p.id]: String(cur + 1) });
                        }}
                        className="w-14 h-14 flex items-center justify-center bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-2xl font-bold text-3xl leading-none transition-colors select-none"
                      >
                        +
                      </button>
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
                  <td className="py-3 px-2 w-8"></td>
                  {players.map((p) => {
                    const total = playerTotal(p.id);
                    const toPar = playerToPar(p.id);
                    const points = playerPoints(p.id);
                    const holes = holesPlayed(p.id);
                    return (
                      <td key={p.id} className="py-3 px-2 text-center min-w-[64px]">
                        {holes > 0 ? (
                          scoringMode === "stableford" ? (
                            <div>
                              <div className="text-white font-bold">{points}</div>
                              <div className="text-xs font-semibold text-green-400">pts</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-white font-bold">{total}</div>
                              <div className={`text-xs font-semibold ${
                                toPar < 0 ? "text-yellow-400" : toPar === 0 ? "text-green-400" : "text-orange-400"
                              }`}>
                                {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : toPar}
                              </div>
                            </div>
                          )
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
          {(scoringMode === "stableford"
            ? [
                { color: "bg-yellow-400/30 text-yellow-200", label: "4+ pts (net eagle)" },
                { color: "bg-green-500/30 text-green-200", label: "3 pts (net birdie)" },
                { color: "text-white", label: "2 pts (net par)" },
                { color: "bg-orange-500/20 text-orange-200", label: "1 pt (net bogey)" },
                { color: "bg-red-700/40 text-red-200", label: "0 pts" },
              ]
            : [
                { color: "bg-yellow-400/30 text-yellow-200", label: "Eagle (−2)" },
                { color: "bg-green-500/30 text-green-200", label: "Birdie (−1)" },
                { color: "text-white", label: "Par (E)" },
                { color: "bg-orange-500/20 text-orange-200", label: "Bogey (+1)" },
                { color: "bg-red-500/30 text-red-200", label: "Double (+2)" },
              ]
          ).map(({ color, label }) => (
            <span key={label} className={`px-2 py-1 rounded-full ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
