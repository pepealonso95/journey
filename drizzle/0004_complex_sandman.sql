CREATE TABLE "journey_bookListLike" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"bookListId" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journey_bookList" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "journey_user" ADD COLUMN "twitter_handle" varchar(50);--> statement-breakpoint
ALTER TABLE "journey_user" ADD COLUMN "twitter_profile_url" varchar(255);--> statement-breakpoint
ALTER TABLE "journey_user" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "journey_bookListLike" ADD CONSTRAINT "journey_bookListLike_userId_journey_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."journey_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_bookListLike" ADD CONSTRAINT "journey_bookListLike_bookListId_journey_bookList_id_fk" FOREIGN KEY ("bookListId") REFERENCES "public"."journey_bookList"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookListLike_userId_idx" ON "journey_bookListLike" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bookListLike_bookListId_idx" ON "journey_bookListLike" USING btree ("bookListId");--> statement-breakpoint
CREATE INDEX "bookListLike_unique_idx" ON "journey_bookListLike" USING btree ("userId","bookListId");--> statement-breakpoint
ALTER TABLE "journey_user" ADD CONSTRAINT "journey_user_twitter_handle_unique" UNIQUE("twitter_handle");