CREATE TABLE "course_notes" (
	"id" serial PRIMARY KEY,
	"course" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
