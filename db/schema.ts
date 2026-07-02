import { pgTable, serial, text, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const rounds = pgTable("rounds", {
  id: serial().primaryKey(),
  name: text().notNull().default("Round"),
  course: text().notNull().default("standard"),
  // "stableford" = handicap-adjusted points scoring, "casual" = plain stroke play.
  scoringType: text("scoring_type").notNull().default("stableford"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial().primaryKey(),
  roundId: integer("round_id").notNull().references(() => rounds.id),
  name: text().notNull(),
  position: integer().notNull(),
  handicap: doublePrecision().notNull().default(0),
  // Tee this player is playing from: "mens" or "womens". Determines which
  // tee's stroke index and hole distances apply to this player's scoring.
  tee: text().notNull().default("mens"),
});

export const playerProfiles = pgTable("player_profiles", {
  id: serial().primaryKey(),
  name: text().notNull(),
  handicap: doublePrecision().notNull().default(0),
  tee: text().notNull().default("mens"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scores = pgTable("scores", {
  id: serial().primaryKey(),
  roundId: integer("round_id").notNull().references(() => rounds.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  holeNumber: integer("hole_number").notNull(),
  strokes: integer().notNull(),
  putts: integer("putts"),
});

// GPS coordinates for the tee and green of each hole, keyed by course + hole.
// Marked once on-course via the device's geolocation and reused across rounds.
export const holeLocations = pgTable("hole_locations", {
  id: serial().primaryKey(),
  course: text().notNull(),
  holeNumber: integer("hole_number").notNull(),
  greenLat: doublePrecision("green_lat"),
  greenLng: doublePrecision("green_lng"),
  teeLat: doublePrecision("tee_lat"),
  teeLng: doublePrecision("tee_lng"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
