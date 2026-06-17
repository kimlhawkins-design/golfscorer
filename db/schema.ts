import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const rounds = pgTable("rounds", {
  id: serial().primaryKey(),
  name: text().notNull().default("Round"),
  course: text().notNull().default("standard"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: serial().primaryKey(),
  roundId: integer("round_id").notNull().references(() => rounds.id),
  name: text().notNull(),
  position: integer().notNull(),
});

export const scores = pgTable("scores", {
  id: serial().primaryKey(),
  roundId: integer("round_id").notNull().references(() => rounds.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  holeNumber: integer("hole_number").notNull(),
  strokes: integer().notNull(),
});
