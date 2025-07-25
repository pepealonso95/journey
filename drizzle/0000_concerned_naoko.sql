CREATE TABLE "journey_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "journey_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "journey_bookListItem" (
	"id" serial PRIMARY KEY NOT NULL,
	"bookListId" integer NOT NULL,
	"bookId" varchar(255) NOT NULL,
	"sortOrder" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_bookList" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"userId" varchar(255) NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"slug" varchar(150) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_book" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"authors" text,
	"description" text,
	"publishedDate" varchar(20),
	"thumbnail" varchar(1000),
	"smallThumbnail" varchar(1000),
	"medium" varchar(1000),
	"large" varchar(1000),
	"extraLarge" varchar(1000),
	"isbn10" varchar(20),
	"isbn13" varchar(20),
	"pageCount" integer,
	"categories" text,
	"language" varchar(10),
	"previewLink" varchar(1000),
	"infoLink" varchar(1000),
	"canonicalVolumeLink" varchar(1000),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255),
	"username" varchar(50),
	"bio" text,
	CONSTRAINT "journey_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "journey_verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "journey_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "journey_account" ADD CONSTRAINT "journey_account_userId_journey_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."journey_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_bookListItem" ADD CONSTRAINT "journey_bookListItem_bookListId_journey_bookList_id_fk" FOREIGN KEY ("bookListId") REFERENCES "public"."journey_bookList"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_bookListItem" ADD CONSTRAINT "journey_bookListItem_bookId_journey_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."journey_book"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_bookList" ADD CONSTRAINT "journey_bookList_userId_journey_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."journey_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_session" ADD CONSTRAINT "journey_session_userId_journey_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."journey_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "journey_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bookListItem_bookListId_idx" ON "journey_bookListItem" USING btree ("bookListId");--> statement-breakpoint
CREATE INDEX "bookListItem_unique_idx" ON "journey_bookListItem" USING btree ("bookListId","bookId");--> statement-breakpoint
CREATE INDEX "bookList_userId_idx" ON "journey_bookList" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bookList_slug_idx" ON "journey_bookList" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "journey_session" USING btree ("userId");