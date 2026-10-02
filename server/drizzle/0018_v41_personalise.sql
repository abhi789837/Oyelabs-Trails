ALTER TABLE `assessment_items` ADD `est_seconds` integer;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `active_ms` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `origin` text;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `personalisation` text DEFAULT 'balanced' NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `understanding` text;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `understanding_hash` text;--> statement-breakpoint
ALTER TABLE `question_bank` ADD `tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `question_bank` ADD `est_seconds` integer;--> statement-breakpoint
ALTER TABLE `question_bank` ADD `median_seconds` integer;--> statement-breakpoint
ALTER TABLE `question_bank` ADD `flagged_slow` integer DEFAULT false NOT NULL;