CREATE TABLE `question_bank` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`track_id` text,
	`stack_id` text,
	`language` text,
	`type` text NOT NULL,
	`difficulty` integer NOT NULL,
	`prompt` text NOT NULL,
	`coding` text,
	`mcq` text,
	`task` text,
	`est_minutes` real DEFAULT 2 NOT NULL,
	`times_used` integer DEFAULT 0 NOT NULL,
	`times_scored` integer DEFAULT 0 NOT NULL,
	`score_sum` real DEFAULT 0 NOT NULL,
	`discrimination` real,
	`status` text DEFAULT 'draft' NOT NULL,
	`retired_reason` text,
	`source` text DEFAULT 'seed' NOT NULL,
	`validated_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `question_bank_pick_idx` ON `question_bank` (`department_id`,`status`,`skill_id`,`type`,`difficulty`);--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `bank_item_id` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `position` integer;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `runs_used` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `flagged` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `draft` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `locked_at` integer;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `score` real;