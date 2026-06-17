// Golf course definitions. Each course has a stable `key` (stored on the round
// in the database) and an 18-hole `pars` array used throughout the scorecard.
export type Course = {
  key: string;
  name: string;
  pars: number[];
};

export const COURSES: Course[] = [
  {
    key: "standard",
    name: "Wodonga",
    pars: [4, 4, 3, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5],
  },
  {
    key: "albury-commercial",
    name: "Albury Commercial",
    pars: [4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5],
  },
  {
    key: "thurgoona",
    name: "Thurgoona",
    pars: [5, 4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4, 4, 5, 3, 4, 4, 5],
  },
  {
    key: "howlong",
    name: "Howlong",
    pars: [4, 4, 5, 3, 4, 4, 4, 3, 5, 5, 4, 3, 4, 4, 4, 3, 5, 4],
  },
];

export const DEFAULT_COURSE_KEY = "standard";

export function getCourse(key: string | null | undefined): Course {
  return (
    COURSES.find((c) => c.key === key) ??
    COURSES.find((c) => c.key === DEFAULT_COURSE_KEY)!
  );
}
