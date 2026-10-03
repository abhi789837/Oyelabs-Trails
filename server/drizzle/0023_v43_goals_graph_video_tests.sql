CREATE TABLE `goal_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`outcome` text NOT NULL,
	`skill_ids` text NOT NULL,
	`target_level` integer NOT NULL,
	`case_id` text,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`decided_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `goal_suggestions_user_idx` ON `goal_suggestions` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `learner_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`original_text` text NOT NULL,
	`outcome` text NOT NULL,
	`skill_ids` text NOT NULL,
	`target_level` integer NOT NULL,
	`case_id` text,
	`slider` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`achieved_at` integer,
	`source` text DEFAULT 'admin' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `learner_goals_user_idx` ON `learner_goals` (`user_id`,`position`);--> statement-breakpoint
CREATE TABLE `practical_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`title` text NOT NULL,
	`statement` text NOT NULL,
	`skill_ids` text NOT NULL,
	`level` integer NOT NULL,
	`aliases` text NOT NULL,
	`capstone` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `practical_outcomes_dept_idx` ON `practical_outcomes` (`department_id`,`position`);--> statement-breakpoint
CREATE TABLE `skill_edges` (
	`from_skill` text NOT NULL,
	`to_skill` text NOT NULL,
	`type` text NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`from_skill`, `to_skill`)
);
--> statement-breakpoint
CREATE INDEX `skill_edges_to_idx` ON `skill_edges` (`to_skill`);--> statement-breakpoint
CREATE TABLE `topic_grounding` (
	`topic_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`hash` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topic_test_items` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` text NOT NULL,
	`origin` text NOT NULL,
	`source_id` text,
	`status` text NOT NULL,
	`item` text NOT NULL,
	`gates` text,
	`grounding_hash` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`passes` integer DEFAULT 0 NOT NULL,
	`strong_attempts` integer DEFAULT 0 NOT NULL,
	`strong_fails` integer DEFAULT 0 NOT NULL,
	`flag_reason` text,
	`retired_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `topic_test_items_topic_idx` ON `topic_test_items` (`topic_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `topic_test_items_source_idx` ON `topic_test_items` (`topic_id`,`source_id`);--> statement-breakpoint
CREATE TABLE `user_prefs` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `video_meta` (
	`video_id` text PRIMARY KEY NOT NULL,
	`duration_seconds` real NOT NULL,
	`source` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `video_progress` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`video_id` text NOT NULL,
	`ranges` text NOT NULL,
	`watched_seconds` real DEFAULT 0 NOT NULL,
	`last_position` real DEFAULT 0 NOT NULL,
	`duration_seconds` real,
	`completed_at` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `topic_id`, `video_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `video_progress_user_topic_idx` ON `video_progress` (`user_id`,`topic_id`);--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `auto_add_suggestions` integer DEFAULT false NOT NULL;