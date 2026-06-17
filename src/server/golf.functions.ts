import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { rounds, players, scores, holeLocations } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

export const getRounds = createServerFn().handler(async () => {
  return db.select().from(rounds).orderBy(rounds.createdAt);
});

export const getRound = createServerFn({ method: "GET" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, data.id));
    if (!round) return null;
    const roundPlayers = await db.select().from(players).where(eq(players.roundId, data.id)).orderBy(players.position);
    const roundScores = await db.select().from(scores).where(eq(scores.roundId, data.id));
    const locations = await db
      .select()
      .from(holeLocations)
      .where(eq(holeLocations.course, round.course));
    return { round, players: roundPlayers, scores: roundScores, holeLocations: locations };
  });

export const createRound = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      course?: string;
      scoringType?: "stableford" | "casual";
      players: { name: string; handicap: number; tee?: "mens" | "womens" }[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const [round] = await db
      .insert(rounds)
      .values({
        name: data.name,
        course: data.course ?? "standard",
        scoringType: data.scoringType ?? "stableford",
      })
      .returning();
    const playerInserts = data.players.map((p, i) => ({
      roundId: round.id,
      name: p.name,
      position: i + 1,
      handicap: p.handicap,
      tee: p.tee ?? "mens",
    }));
    await db.insert(players).values(playerInserts);
    return round;
  });

export const updatePlayerHandicap = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: number; handicap: number }) => data)
  .handler(async ({ data }) => {
    await db
      .update(players)
      .set({ handicap: data.handicap })
      .where(eq(players.id, data.playerId));
    return { success: true };
  });

export const updatePlayerTee = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: number; tee: "mens" | "womens" }) => data)
  .handler(async ({ data }) => {
    await db
      .update(players)
      .set({ tee: data.tee })
      .where(eq(players.id, data.playerId));
    return { success: true };
  });

export const upsertScore = createServerFn({ method: "POST" })
  .inputValidator((data: { roundId: number; playerId: number; holeNumber: number; strokes: number }) => data)
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.playerId, data.playerId),
          eq(scores.holeNumber, data.holeNumber),
        ),
      );
    if (existing.length > 0) {
      await db
        .update(scores)
        .set({ strokes: data.strokes })
        .where(eq(scores.id, existing[0].id));
    } else {
      await db.insert(scores).values({
        roundId: data.roundId,
        playerId: data.playerId,
        holeNumber: data.holeNumber,
        strokes: data.strokes,
      });
    }
    return { success: true };
  });

export const deleteRound = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await db.delete(scores).where(eq(scores.roundId, data.id));
    await db.delete(players).where(eq(players.roundId, data.id));
    await db.delete(rounds).where(eq(rounds.id, data.id));
    return { success: true };
  });

// Mark the GPS coordinates of a hole's tee or green for a course. Keyed by
// course + hole, so a marked location is reused across every round on that
// course. Upserts in place to avoid duplicate rows.
export const setHoleLocation = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      course: string;
      holeNumber: number;
      point: "tee" | "green";
      lat: number;
      lng: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const coords =
      data.point === "green"
        ? { greenLat: data.lat, greenLng: data.lng }
        : { teeLat: data.lat, teeLng: data.lng };
    const existing = await db
      .select()
      .from(holeLocations)
      .where(
        and(
          eq(holeLocations.course, data.course),
          eq(holeLocations.holeNumber, data.holeNumber),
        ),
      );
    if (existing.length > 0) {
      await db
        .update(holeLocations)
        .set(coords)
        .where(eq(holeLocations.id, existing[0].id));
    } else {
      await db.insert(holeLocations).values({
        course: data.course,
        holeNumber: data.holeNumber,
        ...coords,
      });
    }
    return { success: true };
  });
