CREATE TABLE "journey_searchCache" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" varchar(255) NOT NULL,
	"results" text NOT NULL,
	"resultCount" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journey_book" ADD COLUMN "last_accessed" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "journey_book" ADD COLUMN "access_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "searchCache_query_idx" ON "journey_searchCache" USING btree ("query");--> statement-breakpoint
CREATE INDEX "searchCache_expiresAt_idx" ON "journey_searchCache" USING btree ("expires_at");