CREATE TYPE "public"."frequency_type" AS ENUM('daily', 'weekly', 'monthly', 'one-time');--> statement-breakpoint
CREATE TABLE "chore_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"frequency" "frequency_type" NOT NULL,
	"due_date" date NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"paid_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"frequency" "frequency_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(100) DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(100) DEFAULT 'user' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "chore_instances" ADD CONSTRAINT "chore_instances_template_id_chore_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."chore_templates"("id") ON DELETE cascade ON UPDATE no action;