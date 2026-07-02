import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRounds, createRound, deleteRound, getPlayerProfiles, createPlayerProfile, deletePlayerProfile } from "../server/golf.functions";
import { COURSES, DEFAULT_COURSE_KEY, getCourse, type TeeKey } from "../courses";

export const Route = createFileRoute("/")({
  loader: async () => {
    const rounds = await getRounds();
    const profiles = await getPlayerProfiles();
    return { rounds, profiles };
  },
  component: Home,
});

function Home() {
  const { rounds, profiles } = Route.useLoaderData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [course, setCourse] = useState(DEFAULT_COURSE_KEY);
  const [scoringType, setScoringType] = useState<"stableford" | "casual">("stableford");
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]);
  const [playerHandicaps, setPlayerHandicaps] = useState(["", "", "", ""]);
  const [playerTees, setPlayerTees] = useState<TeeKey[]>(["mens", "mens", "mens", "mens"]);
  const [creating, setCreating] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileHandicap, setProfileHandicap] = useState("");
  const [profileTee, setProfileTee] = useState<TeeKey>("mens");
  const [savingProfile, setSavingProfile] = useState(false);

  const createRoundFn = useServerFn(createRound);
  const deleteRoundFn = useServerFn(deleteRound);
  const createProfileFn = useServerFn(createPlayerProfile);
  const deleteProfileFn = useServerFn(deletePlayerProfile);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const entries = playerNames
      .map((name, i) => ({
        name: name.trim(),
        handicap: Math.max(0, Math.round((parseFloat(playerHandicaps[i] || "0") || 0) * 10) / 10),
        tee: playerTees[i],
      }))
      .filter((p) => p.name);
    if (entries.length < 2) return;
    setCreating(true);
    try {
      const round = await createRoundFn({
        data: { name: roundName || "Round", course, scoringType, players: entries },
      });
      router.navigate({ to: "/rounds/$roundId", params: { roundId: String(round.id) } });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this round?")) return;
    await deleteRoundFn({ data: { id } });
    router.invalidate();
  };

  const addProfileToRound = (profile: { name: string; handicap: number; tee: string }) => {
    const index = playerNames.findIndex((name) => !name.trim());
    if (index === -1) return;
    const names = [...playerNames];
    const handicaps = [...playerHandicaps];
    const tees = [...playerTees];
    names[index] = profile.name;
    handicaps[index] = String(profile.handicap ?? 0);
    tees[index] = profile.tee === "womens" ? "womens" : "mens";
    setPlayerNames(names);
    setPlayerHandicaps(handicaps);
    setPlayerTees(tees);
  };

  const saveProfile = async () => {
    const name = profileName.trim();
    if (!name) return;
    setSavingProfile(true);
    try {
      await createProfileFn({
        data: {
          name,
          handicap: Math.max(0, Math.round((parseFloat(profileHandicap || "0") || 0) * 10) / 10),
          tee: profileTee,
        },
      });
      setProfileName("");
      setProfileHandicap("");
      setProfileTee("mens");
      router.invalidate();
    } finally {
      setSavingProfile(false);
    }
  };

  const removeProfile = async (id: number) => {
    if (!confirm("Delete this saved player?")) return;
    await deleteProfileFn({ data: { id } });
    router.invalidate();
  };

  return (
    <div className="min-h-screen app-bg-green">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">⛳</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Golf Scorecard</h1>
          <p className="text-green-300 mt-2">Track your round, hole by hole</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-white/20 mb-8">
          <Link
            to="/"
            className="flex-1 text-center py-3 font-semibold bg-green-500 text-white transition-colors"
          >
            Scorecard
          </Link>
          <Link
            to="/courses"
            className="flex-1 text-center py-3 font-semibold bg-white/5 text-green-200 hover:bg-white/10 transition-colors"
          >
            Courses
          </Link>
          <Link
            to="/rules"
            className="flex-1 text-center py-3 font-semibold bg-white/5 text-green-200 hover:bg-white/10 transition-colors"
          >
            Rules
          </Link>
        </div>

        {/* New Round Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-colors shadow-lg mb-8"
          >
            + New Round
          </button>
        )}

        {/* Picture */}
        {!showForm && (
          <img
            src="/group.jpg"
            alt="Group"
            className="w-full rounded-2xl mb-8 shadow-lg border border-white/20 object-cover"
          />
        )}

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-white font-bold text-xl mb-4">New Round</h2>
            <div className="mb-4">
              <label className="block text-green-200 text-sm font-medium mb-1">Round Name</label>
              <input
                type="text"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                placeholder="e.g. Saturday Morning"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="mb-4">
              <label className="block text-green-200 text-sm font-medium mb-1">Course</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400 [&>option]:text-black"
              >
                {COURSES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} (Par {c.pars.reduce((a, b) => a + b, 0)})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-green-200 text-sm font-medium mb-1">Round Type</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "stableford", label: "Stableford", hint: "Handicap points" },
                  { key: "casual", label: "Casual", hint: "Stroke play" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setScoringType(opt.key)}
                    className={`rounded-lg px-3 py-2 text-left border transition-colors ${
                      scoringType === opt.key
                        ? "bg-green-500 border-green-400 text-white"
                        : "bg-white/10 border-white/20 text-green-100 hover:bg-white/20"
                    }`}
                  >
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs opacity-80">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-white/15 bg-black/15 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Player profiles</h3>
                  <p className="text-xs text-white/45">Tap saved players into this round</p>
                </div>
                <span className="text-xs font-bold text-lime-300">{profiles.length} saved</span>
              </div>

              {profiles.length > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => addProfileToRound(profile)}
                      className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left hover:bg-white/15"
                    >
                      <div className="text-sm font-bold text-white">{profile.name}</div>
                      <div className="text-xs text-lime-300">Hcp {profile.handicap} · {profile.tee === "womens" ? "Women's" : "Men's"}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-[1fr_72px] gap-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Save player name"
                  className="min-w-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={profileHandicap}
                  onChange={(e) => setProfileHandicap(e.target.value)}
                  placeholder="Hcp"
                  aria-label="Saved player handicap"
                  className="rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-center text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="app-segmented text-xs">
                  {(["mens", "womens"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setProfileTee(t)}
                      className={`px-3 py-2 font-bold transition-colors ${
                        profileTee === t ? "bg-lime-500 text-white" : "text-lime-100 hover:bg-white/10"
                      }`}
                    >
                      {t === "mens" ? "Men's" : "Women's"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={savingProfile || !profileName.trim()}
                  className="rounded-lg bg-lime-400 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save profile"}
                </button>
              </div>

              {profiles.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-white/55">Manage saved players</summary>
                  <div className="mt-2 space-y-1">
                    {profiles.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                        <span className="text-xs text-white/75">{profile.name}</span>
                        <button type="button" onClick={() => removeProfile(profile.id)} className="text-xs font-bold text-red-300 hover:text-red-200">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            <div className="mb-5">
              <label className="block text-green-200 text-sm font-medium mb-2">Players (2–4), Handicaps &amp; Tees</label>
              <div className="space-y-3">
                {playerNames.map((name, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const updated = [...playerNames];
                          updated[i] = e.target.value;
                          setPlayerNames(updated);
                        }}
                        placeholder={`Player ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                        className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={playerHandicaps[i]}
                        onChange={(e) => {
                          const updated = [...playerHandicaps];
                          updated[i] = e.target.value;
                          setPlayerHandicaps(updated);
                        }}
                        placeholder="Hcp"
                        aria-label={`Player ${i + 1} handicap`}
                        className="w-20 shrink-0 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-center focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-white/20 text-xs w-fit">
                      {(["mens", "womens"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            const updated = [...playerTees];
                            updated[i] = t;
                            setPlayerTees(updated);
                          }}
                          aria-label={`Player ${i + 1} ${t === "mens" ? "men's" : "women's"} tee`}
                          className={`px-3 py-1.5 font-semibold transition-colors ${
                            playerTees[i] === t
                              ? "bg-green-500 text-white"
                              : "bg-white/5 text-green-200 hover:bg-white/10"
                          }`}
                        >
                          {t === "mens" ? "Men's tee" : "Women's tee"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || playerNames.filter((n) => n.trim()).length < 2}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {creating ? "Starting…" : "Start Round"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Rounds List */}
        {rounds.length > 0 && (
          <div>
            <h2 className="text-green-300 font-semibold text-sm uppercase tracking-wider mb-3">Recent Rounds</h2>
            <div className="space-y-3">
              {[...rounds].reverse().map((round) => (
                <div key={round.id} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 flex items-center justify-between">
                  <Link
                    to="/rounds/$roundId"
                    params={{ roundId: String(round.id) }}
                    className="flex-1 min-w-0"
                  >
                    <div className="text-white font-semibold">{round.name}</div>
                    <div className="text-green-400 text-sm">
                      {getCourse(round.course).name} ·{" "}
                      {round.scoringType === "casual" ? "Casual" : "Stableford"} ·{" "}
                      {new Date(round.createdAt).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/rounds/$roundId"
                      params={{ roundId: String(round.id) }}
                      className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleDelete(round.id)}
                      className="text-white/40 hover:text-red-400 transition-colors px-2 py-2"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rounds.length === 0 && !showForm && (
          <div className="text-center text-white/40 py-12">
            <div className="text-5xl mb-3">🏌️</div>
            <p>No rounds yet. Start your first round!</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-white/20 text-xs mt-12">
          18 Holes
        </div>
      </div>
    </div>
  );
}
