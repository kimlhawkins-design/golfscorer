import { createServerFn } from "@tanstack/react-start";
import { db } from "../../db/index.js";
import { rounds, players, scores } from "../../db/schema.js";
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
    return { round, players: roundPlayers, scores: roundScores };
  });

export const createRound = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; playerNames: string[] }) => data)
  .handler(async ({ data }) => {
    const [round] = await db.insert(rounds).values({ name: data.name }).returning();
    const playerInserts = data.playerNames.map((name, i) => ({
      roundId: round.id,
      name,
      position: i + 1,
    }));
    await db.insert(players).values(playerInserts);
    return round;
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
