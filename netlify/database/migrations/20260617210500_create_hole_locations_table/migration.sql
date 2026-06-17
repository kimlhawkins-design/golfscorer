CREATE TABLE "hole_locations" (
	"id" serial PRIMARY KEY,
	"course" text NOT NULL,
	"hole_number" integer NOT NULL,
	"green_lat" double precision,
	"green_lng" double precision,
	"tee_lat" double precision,
	"tee_lng" double precision,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
