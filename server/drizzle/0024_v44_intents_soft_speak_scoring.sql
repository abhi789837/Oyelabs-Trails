CREATE TABLE `audio_recordings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` text,
	`item_id` text,
	`topic_id` text,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`duration_sec` real,
	`enc_path` text NOT NULL,
	`transcript` text,
	`words` text,
	`metrics` text,
	`stt_status` text DEFAULT 'pending' NOT NULL,
	`stt_error` text,
	`created_at` integer NOT NULL,
	`audio_deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `audio_recordings_user_idx` ON `audio_recordings` (`user_id`);--> statement-breakpoint
CREATE INDEX `audio_recordings_item_idx` ON `audio_recordings` (`assessment_id`,`item_id`);--> statement-breakpoint
CREATE INDEX `audio_recordings_created_idx` ON `audio_recordings` (`created_at`);--> statement-breakpoint
CREATE TABLE `review_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`ref_id` text NOT NULL,
	`attempt_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`learner_note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_by` text,
	`resolved_at` integer,
	`resolution` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_requests_status_idx` ON `review_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `review_requests_user_idx` ON `review_requests` (`user_id`);--> statement-breakpoint
CREATE TABLE `skill_bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`department_id` text,
	`from_track_ids` text DEFAULT '[]' NOT NULL,
	`phrases` text DEFAULT '[]' NOT NULL,
	`skill_ids` text DEFAULT '[]' NOT NULL,
	`target_level` integer DEFAULT 3 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `raw_score` real;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `verdict` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `verdict_note` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `score_history` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `review_status` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `review_note` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `assessment_items` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `departments` ADD `kind` text DEFAULT 'role' NOT NULL;--> statement-breakpoint
ALTER TABLE `generated_courses` ADD `library` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `generated_courses` ADD `department_id` text;--> statement-breakpoint
ALTER TABLE `generated_courses` ADD `review_reason` text;--> statement-breakpoint
ALTER TABLE `generated_courses` ADD `fix_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_goals` ADD `intent_id` text;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `intents` text;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `auto_publish_override` text;