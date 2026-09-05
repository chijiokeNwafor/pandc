CREATE TABLE "guests" (
	"id" serial NOT NULL,
	"token" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"handle" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" text NOT NULL,
	"checked_in_at" text
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" integer PRIMARY KEY NOT NULL,
	"bucket" integer NOT NULL,
	"attempts" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizer" (
	"id" integer PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"initialized_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement" (
	"id" integer PRIMARY KEY NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"size" integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "guests_dedupe_unique" ON "guests" USING btree ("dedupe_key");