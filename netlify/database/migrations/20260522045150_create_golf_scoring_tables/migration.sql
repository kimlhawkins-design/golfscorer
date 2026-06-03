CREATE TABLE "players" (
	"id" serial PRIMARY KEY,
	"round_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" serial PRIMARY KEY,
	"name" text DEFAULT 'Round' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY,
	"round_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"hole_number" integer NOT NULL,
	"strokes" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_round_id_rounds_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id");--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_round_id_rounds_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id");--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_player_id_players_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id");