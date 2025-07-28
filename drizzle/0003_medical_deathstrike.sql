DROP TABLE "journey_account" CASCADE;--> statement-breakpoint
DROP TABLE "journey_session" CASCADE;--> statement-breakpoint
DROP TABLE "journey_verificationToken" CASCADE;--> statement-breakpoint
ALTER TABLE "journey_bookListItem" ADD COLUMN "customDescription" text;