CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `announcements_created_idx` ON `announcements` (`created_at`);--> statement-breakpoint
CREATE TABLE `content_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`version` integer NOT NULL,
	`data` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_versions_entity_idx` ON `content_versions` (`entity_type`,`entity_id`,`version`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`to_user_id` text,
	`to_address` text NOT NULL,
	`kind` text NOT NULL,
	`subject` text NOT NULL,
	`html` text NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_outbox_status_idx` ON `email_outbox` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `email_outbox_user_idx` ON `email_outbox` (`to_user_id`);--> statement-breakpoint
CREATE TABLE `lesson_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`video_id` text,
	`at_sec` real,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_notes_user_topic_idx` ON `lesson_notes` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `lesson_state` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`step` text DEFAULT 'watch' NOT NULL,
	`step_done` text DEFAULT '{"watch":false,"read":false,"do":false,"check":false}' NOT NULL,
	`video_id` text,
	`position_sec` real,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `topic_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`step` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_by` text,
	`resolved_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `problem_reports_status_idx` ON `problem_reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `problem_reports_topic_idx` ON `problem_reports` (`topic_id`);--> statement-breakpoint
CREATE TABLE `review_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`ref_id` text NOT NULL,
	`topic_id` text,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`fsrs` text NOT NULL,
	`due` integer NOT NULL,
	`suspended` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_cards_source_idx` ON `review_cards` (`user_id`,`source`,`ref_id`);--> statement-breakpoint
CREATE INDEX `review_cards_due_idx` ON `review_cards` (`user_id`,`due`);--> statement-breakpoint
CREATE TABLE `review_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`rating` integer NOT NULL,
	`review` text NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `review_cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `review_logs_user_idx` ON `review_logs` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE INDEX `review_logs_card_idx` ON `review_logs` (`card_id`);--> statement-breakpoint
CREATE TABLE `tutor_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`step` text,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`citations` text DEFAULT '[]' NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tutor_messages_user_created_idx` ON `tutor_messages` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `weekly_streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current` integer DEFAULT 0 NOT NULL,
	`best` integer DEFAULT 0 NOT NULL,
	`last_met_week` text,
	`freezes_left` integer DEFAULT 1 NOT NULL,
	`freeze_month` text,
	`history` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`ref_id` text NOT NULL,
	`xp` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xp_events_award_idx` ON `xp_events` (`user_id`,`kind`,`ref_id`);--> statement-breakpoint
CREATE INDEX `xp_events_user_created_idx` ON `xp_events` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `certificates` ADD `kind` text DEFAULT 'track' NOT NULL;--> statement-breakpoint
ALTER TABLE `certificates` ADD `ref_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `certificates` ADD `title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `certificates` ADD `hash` text;--> statement-breakpoint
ALTER TABLE `certificates` ADD `revoked_at` integer;--> statement-breakpoint
-- v5 backfill (hand-added): old rows are track certificates. ref_id = track_id for the newest row per
-- (user, track); any older duplicate gets a unique legacy ref so the unique index below cannot fail.
UPDATE `certificates` SET `ref_id` = CASE WHEN `id` = (SELECT c2.`id` FROM `certificates` c2 WHERE c2.`user_id` = `certificates`.`user_id` AND c2.`track_id` = `certificates`.`track_id` ORDER BY c2.`issued_at` DESC, c2.`id` DESC LIMIT 1) THEN `track_id` ELSE 'legacy:' || `id` END, `title` = `track_id` WHERE `ref_id` = '';--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_user_kind_ref_idx` ON `certificates` (`user_id`,`kind`,`ref_id`);