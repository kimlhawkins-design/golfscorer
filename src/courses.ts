// Golf course definitions. Each course has a stable `key` (stored on the round
// in the database), an 18-hole `pars` array, and an 18-hole `strokeIndex` array.
// The stroke index ranks holes 1–18 by difficulty (1 = hardest) and determines
// the order in which a player's handicap strokes are allocated for Stableford
// and net scoring.
export type Course = {
  key: string;
  name: string;
  pars: number[];
  strokeIndex: number[];
};

export const COURSES: Course[] = [
  {
    key: "standard",
    name: "Wodonga",
    pars: [4, 4, 3, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5],
    strokeIndex: [3, 7, 17, 1, 5, 15, 9, 11, 13, 4, 18, 8, 2, 6, 10, 16, 12, 14],
  },
  {
    key: "albury-commercial",
    name: "Albury Commercial",
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    strokeIndex: [5, 1, 7, 17, 9, 11, 15, 3, 13, 6, 8, 18, 2, 10, 12, 16, 14, 4],
  },
  {
    key: "thurgoona",
    name: "Thurgoona",
    pars: [5, 4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 5, 3, 4, 4, 5],
    strokeIndex: [1, 9, 7, 17, 11, 5, 3, 15, 13, 8, 18, 10, 6, 2, 16, 12, 14, 4],
  },
  {
    key: "howlong",
    name: "Howlong",
    pars: [4, 4, 5, 3, 4, 4, 4, 3, 5, 5, 4, 3, 4, 4, 4, 3, 5, 4],
    strokeIndex: [7, 11, 1, 17, 5, 9, 13, 15, 3, 4, 8, 18, 6, 10, 12, 16, 2, 14],
  },
];

export const DEFAULT_COURSE_KEY = "standard";

export function getCourse(key: string | null | undefined): Course {
  return (
    COURSES.find((c) => c.key === key) ??
    COURSES.find((c) => c.key === DEFAULT_COURSE_KEY)!
  );
}

// Number of handicap strokes a player receives on a hole, given their course
// handicap and the hole's stroke index. A handicap of 18 gives one stroke on
// every hole; 19–36 gives a second stroke starting at stroke index 1, etc.
// Decimal handicaps are rounded to the nearest whole number first, since a
// player cannot receive a fractional stroke on an individual hole.
export function strokesReceived(handicap: number, strokeIndex: number): number {
  const playing = Math.round(handicap);
  if (playing <= 0) return 0;
  let strokes = Math.floor(playing / 18);
  if (strokeIndex <= playing % 18) strokes += 1;
  return strokes;
}

// Stableford points for a single hole. Net score is gross strokes minus the
// handicap strokes received on the hole. Points: net par = 2, each shot better
// adds 1, net bogey = 1, net double bogey or worse = 0.
export function stablefordPoints(
  strokes: number,
  par: number,
  handicap: number,
  strokeIndex: number,
): number {
  const net = strokes - strokesReceived(handicap, strokeIndex);
  return Math.max(0, 2 - (net - par));
}
