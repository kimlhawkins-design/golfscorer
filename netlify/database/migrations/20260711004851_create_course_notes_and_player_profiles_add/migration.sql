CREATE TABLE IF NOT EXISTS "course_notes" (
	"id" serial PRIMARY KEY,
	"course" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_profiles" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"handicap" double precision DEFAULT 0 NOT NULL,
	"tee" text DEFAULT 'mens' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN IF NOT EXISTS "putts" integer;
