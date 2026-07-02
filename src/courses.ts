// Golf course definitions. Each course has a stable `key` (stored on the round
// in the database), an 18-hole `pars` array (the base par, used off either tee
// unless a tee overrides it), and two tee sets — `mens` and `womens`. Each tee
// carries its own 18-hole `strokeIndex` and `distances` (metres), and may carry
// its own `pars` where a hole plays a different par off each tee. The stroke
// index ranks holes 1–18 by difficulty (1 = hardest) and determines the order in
// which a player's handicap strokes are allocated for Stableford and net scoring;
// men's and women's cards often rank the holes differently, so each tee keeps its own.
export type Tee = {
  // Holes 1–18 ranked by difficulty (1 = hardest).
  strokeIndex: number[];
  // Hole length in metres for this tee.
  distances: number[];
  // Optional per-tee par override (holes 1–18). When omitted, the tee uses the
  // course's `pars`. Used where a hole plays a different par off each tee — e.g.
  // a long hole that is a par 5 for women but a par 4 for men.
  pars?: number[];
};

export type TeeKey = "mens" | "womens";

export type Course = {
  key: string;
  name: string;
  pars: number[];
  mens: Tee;
  womens: Tee;
};

export const COURSES: Course[] = [
  {
    key: "standard",
    name: "Wodonga",
    // Base par, used off both tees — every hole now plays the same par for men
    // and women, so the women's tee carries no par override.
    pars: [4, 4, 4, 5, 4, 3, 5, 3, 4, 5, 3, 4, 4, 4, 4, 3, 4, 5],
    mens: {
      strokeIndex: [3, 7, 13, 17, 5, 11, 15, 9, 1, 18, 12, 8, 2, 10, 6, 16, 14, 4],
      distances: [385, 355, 347, 438, 393, 195, 472, 159, 286, 443, 172, 327, 394, 346, 360, 152, 342, 535],
    },
    womens: {
      strokeIndex: [3, 7, 13, 17, 5, 11, 15, 9, 1, 18, 12, 8, 2, 10, 6, 16, 14, 4],
      distances: [326, 297, 298, 430, 305, 165, 410, 151, 281, 397, 160, 308, 327, 261, 300, 105, 299, 455],
    },
  },
  {
    key: "albury-commercial",
    name: "Albury Commercial",
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    mens: {
      strokeIndex: [5, 1, 7, 17, 9, 11, 15, 3, 13, 6, 8, 18, 2, 10, 12, 16, 14, 4],
      distances: [370, 470, 360, 160, 380, 350, 165, 480, 355, 365, 345, 155, 490, 375, 340, 170, 360, 465],
    },
    womens: {
      strokeIndex: [3, 1, 9, 17, 5, 11, 15, 7, 13, 8, 6, 18, 2, 12, 10, 16, 14, 4],
      distances: [325, 415, 315, 130, 335, 305, 130, 420, 310, 320, 300, 125, 430, 330, 300, 135, 315, 410],
    },
  },

  {
    key: "barham",
    name: "Barham NSW",
    // Placeholder scorecard data until the official card is supplied.
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    mens: {
      strokeIndex: [7, 1, 9, 17, 5, 11, 15, 3, 13, 8, 10, 18, 2, 6, 12, 16, 14, 4],
      distances: [360, 485, 350, 155, 375, 345, 165, 500, 360, 370, 340, 150, 495, 365, 355, 160, 350, 475],
    },
    womens: {
      strokeIndex: [7, 1, 9, 17, 5, 11, 15, 3, 13, 8, 10, 18, 2, 6, 12, 16, 14, 4],
      distances: [315, 430, 305, 125, 330, 300, 135, 440, 315, 325, 295, 120, 435, 320, 310, 130, 305, 420],
    },
  },
  {
    key: "cobram-barooga",
    name: "Cobram Barooga",
    // Placeholder scorecard data until the official card is supplied.
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    mens: {
      strokeIndex: [5, 1, 11, 17, 7, 9, 15, 3, 13, 6, 8, 18, 2, 10, 12, 16, 14, 4],
      distances: [370, 500, 360, 160, 385, 355, 170, 510, 365, 375, 350, 155, 505, 380, 345, 165, 360, 490],
    },
    womens: {
      strokeIndex: [5, 1, 11, 17, 7, 9, 15, 3, 13, 6, 8, 18, 2, 10, 12, 16, 14, 4],
      distances: [325, 440, 315, 130, 340, 310, 135, 450, 320, 330, 305, 125, 445, 335, 300, 135, 315, 430],
    },
  },
  {
    key: "yarrawonga-mulwala",
    name: "Yarrawonga Mulwala",
    // Placeholder scorecard data until the official card is supplied.
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    mens: {
      strokeIndex: [3, 1, 9, 17, 5, 11, 15, 7, 13, 6, 8, 18, 2, 10, 12, 16, 14, 4],
      distances: [380, 510, 365, 165, 390, 360, 175, 520, 370, 385, 355, 160, 515, 375, 350, 170, 365, 500],
    },
    womens: {
      strokeIndex: [3, 1, 9, 17, 5, 11, 15, 7, 13, 6, 8, 18, 2, 10, 12, 16, 14, 4],
      distances: [335, 450, 320, 135, 345, 315, 140, 455, 325, 340, 310, 130, 450, 330, 305, 140, 320, 440],
    },
  },

  {
    key: "yackandandah",
    name: "Yackandandah",
    // Placeholder scorecard data until the official card is supplied.
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
    mens: {
      strokeIndex: [7, 1, 9, 17, 5, 11, 15, 3, 13, 8, 10, 18, 2, 6, 12, 16, 14, 4],
      distances: [350, 465, 340, 145, 360, 335, 155, 470, 345, 355, 330, 140, 475, 350, 335, 150, 340, 460],
    },
    womens: {
      strokeIndex: [7, 1, 9, 17, 5, 11, 15, 3, 13, 8, 10, 18, 2, 6, 12, 16, 14, 4],
      distances: [305, 410, 295, 115, 315, 290, 125, 415, 300, 310, 285, 110, 420, 305, 290, 120, 295, 405],
    },
  },
  {
    key: "thurgoona",
    name: "Thurgoona",
    pars: [5, 4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 5, 3, 4, 4, 5],
    mens: {
      strokeIndex: [1, 9, 7, 17, 11, 5, 3, 15, 13, 8, 18, 10, 6, 2, 16, 12, 14, 4],
      distances: [475, 360, 350, 160, 370, 345, 470, 155, 365, 355, 165, 360, 340, 480, 170, 350, 365, 465],
    },
    womens: {
      strokeIndex: [3, 7, 9, 17, 5, 11, 1, 15, 13, 6, 18, 8, 10, 2, 16, 12, 14, 4],
      distances: [420, 315, 305, 130, 325, 300, 415, 125, 320, 310, 135, 315, 300, 425, 140, 305, 320, 410],
    },
  },
  {
    key: "howlong",
    name: "Howlong",
    pars: [4, 4, 5, 3, 4, 4, 4, 3, 5, 5, 4, 3, 4, 4, 4, 3, 5, 4],
    mens: {
      strokeIndex: [7, 11, 1, 17, 5, 9, 13, 15, 3, 4, 8, 18, 6, 10, 12, 16, 2, 14],
      distances: [360, 350, 470, 160, 375, 345, 365, 165, 480, 475, 355, 155, 370, 340, 360, 170, 465, 350],
    },
    womens: {
      strokeIndex: [5, 9, 3, 17, 7, 11, 13, 15, 1, 4, 8, 18, 6, 10, 12, 16, 2, 14],
      distances: [315, 305, 415, 130, 330, 300, 320, 130, 420, 420, 310, 125, 325, 300, 315, 135, 410, 305],
    },
  },
];

export const DEFAULT_COURSE_KEY = "standard";

export function getCourse(key: string | null | undefined): Course {
  return (
    COURSES.find((c) => c.key === key) ??
    COURSES.find((c) => c.key === DEFAULT_COURSE_KEY)!
  );
}

// Resolve the tee set (men's or women's) for a course.
export function getTee(course: Course, tee: TeeKey): Tee {
  return tee === "womens" ? course.womens : course.mens;
}

// Resolve the 18-hole par array for a tee, falling back to the course's base
// par where the tee has no override.
export function parsFor(course: Course, tee: TeeKey): number[] {
  return getTee(course, tee).pars ?? course.pars;
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
