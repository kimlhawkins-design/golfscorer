import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRounds, createRound, deleteRound, getPlayerProfiles, createPlayerProfile, deletePlayerProfile, getCourseSetupData, saveCourseNote, createCourseSetupRound } from "../server/golf.functions";
import { COURSES, DEFAULT_COURSE_KEY, getCourse, type TeeKey } from "../courses";

export const Route = createFileRoute("/")({
  loader: async () => {
    const rounds = await getRounds();
    const profiles = await getPlayerProfiles();
    const courseSetup = await getCourseSetupData();
    return { rounds, profiles, courseSetup };
  },
  component: Home,
});

function CourseSetupPanel({
  locations,
  notes,
  router,
  saveNoteFn,
  createSetupRoundFn,
}: {
  locations: { course: string; holeNumber: number; teeLat: number | null; teeLng: number | null; greenLat: number | null; greenLng: number | null }[];
  notes: { course: string; notes: string }[];
  router: { invalidate: () => void; navigate: (options: { to: "/rounds/$roundId"; params: { roundId: string } }) => void };
  saveNoteFn: (options: { data: { course: string; notes: string } }) => Promise<unknown>;
  createSetupRoundFn: (options: { data: { course: string; courseName: string } }) => Promise<{ id: number }>;
}) {


  const [noteInputs, setNoteInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const note of notes) initial[note.course] = note.notes;
    return initial;
  });
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [startingCourse, setStartingCourse] = useState<string | null>(null);

  const setupFor = (courseKey: string) => {
    const courseLocations = locations.filter((location) => location.course === courseKey);
    const mapped = courseLocations.filter(
      (location) =>
        location.teeLat !== null &&
        location.teeLng !== null &&
        location.greenLat !== null &&
        location.greenLng !== null,
    ).length;
    const missing = Array.from({ length: 18 }, (_, i) => i + 1).filter((hole) => {
      const location = courseLocations.find((item) => item.holeNumber === hole);
      return !location || location.teeLat === null || location.teeLng === null || location.greenLat === null || location.greenLng === null;
    });
    return { mapped, missing };
  };

  const saveNote = async (course: string) => {
    setSavingNote(course);
    try {
      await saveNoteFn({ data: { course, notes: noteInputs[course] ?? "" } });
      router.invalidate();
    } finally {
      setSavingNote(null);
    }
  };

  const startMapping = async (course: string, courseName: string) => {
    setStartingCourse(course);
    try {
      const round = await createSetupRoundFn({ data: { course, courseName } });
      router.navigate({ to: "/rounds/$roundId", params: { roundId: String(round.id) } });
    } finally {
      setStartingCourse(null);
    }
  };

  return (
    <div>
        <div className="mb-6">
          <div className="app-accent-text text-xs font-semibold uppercase tracking-wider">Course setup</div>
          <h1 className="text-3xl font-black text-white">GPS mapping progress</h1>
          <p className="mt-1 text-sm text-white/50">Track tee and green locations for every course, then mark missing holes from a setup round.</p>
        </div>

        <div className="space-y-4">
          {COURSES.map((course) => {
            const { mapped, missing } = setupFor(course.key);
            const percent = Math.round((mapped / 18) * 100);
            const complete = mapped === 18;
            return (
              <section key={course.key} className="overflow-hidden rounded-2xl border app-panel backdrop-blur">
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-white">{course.name}</h2>
                      <p className="text-xs text-white/45">{mapped}/18 holes mapped</p>
                    </div>
                    <span className={complete ? "rounded-lg bg-lime-300 px-2 py-1 text-xs font-black text-slate-950" : "rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs font-bold text-white"}>
                      {complete ? "Ready" : percent + "%"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25">
                    <div className="h-full rounded-full bg-lime-400" style={{ width: percent + "%" }} />
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Missing holes</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {missing.length === 0 ? (
                        <span className="text-sm font-bold text-lime-300">All tee and green points are marked.</span>
                      ) : (
                        missing.map((hole) => (
                          <span key={hole} className="rounded-md bg-black/25 px-2 py-1 text-xs font-bold text-white">{hole}</span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-sky-200/70">Course notes</label>
                    <textarea
                      value={noteInputs[course.key] ?? ""}
                      onChange={(event) => setNoteInputs({ ...noteInputs, [course.key]: event.target.value })}
                      placeholder="Add notes like preferred tee, local rules, hazards, or mapping reminders."
                      className="min-h-20 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => saveNote(course.key)}
                      disabled={savingNote === course.key}
                      className="app-btn app-btn-secondary px-4 py-3 disabled:opacity-50"
                    >
                      {savingNote === course.key ? "Saving..." : "Save notes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startMapping(course.key, course.name)}
                      disabled={startingCourse === course.key}
                      className="app-btn app-btn-primary px-4 py-3 disabled:opacity-50"
                    >
                      {startingCourse === course.key ? "Opening..." : missing.length ? "Mark missing holes" : "Review mapping"}
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
    </div>
  );
}

function Home() {
  const { rounds, profiles, courseSetup } = Route.useLoaderData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [homeTab, setHomeTab] = useState<"scorecard" | "courses">("scorecard");
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
  const saveNoteFn = useServerFn(saveCourseNote);
  const createSetupRoundFn = useServerFn(createCourseSetupRound);

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
          <button
            type="button"
            onClick={() => setHomeTab("scorecard")}
            className={`flex-1 text-center py-3 font-semibold transition-colors ${homeTab === "scorecard" ? "bg-green-500 text-white" : "bg-white/5 text-green-200 hover:bg-white/10"}`}
          >
            Scorecard
          </button>
          <button
            type="button"
            onClick={() => setHomeTab("courses")}
            className={`flex-1 text-center py-3 font-semibold transition-colors ${homeTab === "courses" ? "bg-green-500 text-white" : "bg-white/5 text-green-200 hover:bg-white/10"}`}
          >
            Courses
          </button>
          <Link
            to="/rules"
            className="flex-1 text-center py-3 font-semibold bg-white/5 text-green-200 hover:bg-white/10 transition-colors"
          >
            Rules
          </Link>
        </div>

        {homeTab === "courses" ? (
          <CourseSetupPanel
            locations={courseSetup.locations}
            notes={courseSetup.notes}
            router={router}
            saveNoteFn={saveNoteFn}
            createSetupRoundFn={createSetupRoundFn}
          />
        ) : (
          <>
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

          </>
        )}

        {/* Footer */}
        <div className="text-center text-white/20 text-xs mt-12">
          18 Holes
        </div>
      </div>
    </div>
  );
}
