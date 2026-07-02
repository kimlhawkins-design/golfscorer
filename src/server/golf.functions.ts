import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { rounds, players, scores, holeLocations, playerProfiles } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

export const getRounds = createServerFn().handler(async () => {
  return db.select().from(rounds).orderBy(rounds.createdAt);
});

export const getPlayerProfiles = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(playerProfiles).orderBy(playerProfiles.name);
});

export const createPlayerProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; handicap: number; tee?: "mens" | "womens" }) => data)
  .handler(async ({ data }) => {
    const name = data.name.trim();
    if (!name) throw new Error("Player name is required");
    const [profile] = await db
      .insert(playerProfiles)
      .values({
        name,
        handicap: Math.max(0, Math.round((data.handicap || 0) * 10) / 10),
        tee: data.tee ?? "mens",
      })
      .returning();
    return profile;
  });

export const deletePlayerProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await db.delete(playerProfiles).where(eq(playerProfiles.id, data.id));
    return { success: true };
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
  .inputValidator((data: { roundId: number; playerId: number; holeNumber: number; strokes: number; putts?: number | null }) => data)
  .handler(async ({ data }) => {
    if (data.holeNumber < 1 || data.holeNumber > 18) {
      throw new Error("Hole number must be between 1 and 18");
    }
    if (!Number.isInteger(data.strokes) || data.strokes < 1 || data.strokes > 20) {
      throw new Error("Strokes must be a whole number between 1 and 20");
    }
    if (data.putts !== undefined && data.putts !== null && (!Number.isInteger(data.putts) || data.putts < 0 || data.putts > 10)) {
      throw new Error("Putts must be a whole number between 0 and 10");
    }
    const existing = await db
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.roundId, data.roundId),
          eq(scores.playerId, data.playerId),
          eq(scores.holeNumber, data.holeNumber),
        ),
      );
    if (existing.length > 0) {
      await db
        .update(scores)
        .set({ strokes: data.strokes, putts: data.putts ?? null })
        .where(eq(scores.id, existing[0].id));
    } else {
      await db.insert(scores).values({
        roundId: data.roundId,
        playerId: data.playerId,
        holeNumber: data.holeNumber,
        strokes: data.strokes,
        putts: data.putts ?? null,
      });
    }
    return { success: true };
  });

export const deleteScore = createServerFn({ method: "POST" })
  .inputValidator((data: { roundId: number; playerId: number; holeNumber: number }) => data)
  .handler(async ({ data }) => {
    await db
      .delete(scores)
      .where(
        and(
          eq(scores.roundId, data.roundId),
          eq(scores.playerId, data.playerId),
          eq(scores.holeNumber, data.holeNumber),
        ),
      );
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
