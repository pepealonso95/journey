ALTER TABLE "journey_bookList" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "journey_bookList" ADD COLUMN "isAnonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "journey_bookList" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
CREATE INDEX "bookList_isAnonymous_idx" ON "journey_bookList" USING btree ("isAnonymous");--> statement-breakpoint
CREATE INDEX "bookList_expiresAt_idx" ON "journey_bookList" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "journey_bookList" ADD CONSTRAINT "journey_bookList_slug_unique" UNIQUE("slug");