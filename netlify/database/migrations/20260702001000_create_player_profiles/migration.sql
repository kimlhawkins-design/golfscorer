CREATE TABLE "player_profiles" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"handicap" double precision DEFAULT 0 NOT NULL,
	"tee" text DEFAULT 'mens' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
