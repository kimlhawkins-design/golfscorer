import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { COURSES } from "../courses";
import { createCourseSetupRound, getCourseSetupData, saveCourseNote } from "../server/golf.functions";

export const Route = createFileRoute("/courses")({
  loader: async () => getCourseSetupData(),
  component: CoursesPage,
});

function CoursesPage() {
  const { locations, notes } = Route.useLoaderData();
  const router = useRouter();
  const saveNoteFn = useServerFn(saveCourseNote);
  const createSetupRoundFn = useServerFn(createCourseSetupRound);
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
    <div className="min-h-screen app-bg-green">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/" className="text-sm text-lime-300 hover:text-white">← Rounds</Link>
          <Link to="/rules" className="text-sm text-lime-300 hover:text-white">Rules</Link>
        </div>

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
    </div>
  );
}

