CREATE TABLE `ai_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`path_id` text,
	`course_id` text,
	`step` text NOT NULL,
	`prompt_version` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`detail` text,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`actor_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ai_audit_path_idx` ON `ai_audit_log` (`path_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `course_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`topic_id` text,
	`url` text NOT NULL,
	`kind` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`http_status` integer,
	`verified_at` integer,
	`dead_since` integer,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `course_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_sources_course_idx` ON `course_sources` (`course_id`);--> statement-breakpoint
CREATE INDEX `course_sources_dead_idx` ON `course_sources` (`dead_since`);--> statement-breakpoint
CREATE TABLE `generated_courses` (
	`course_id` text PRIMARY KEY NOT NULL,
	`skill` text NOT NULL,
	`user_id` text,
	`scope` text DEFAULT 'learner' NOT NULL,
	`status` text NOT NULL,
	`review_score` real,
	`review_detail` text,
	`prompt_version` text DEFAULT '' NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `generated_courses_skill_idx` ON `generated_courses` (`skill`,`scope`);--> statement-breakpoint
CREATE INDEX `generated_courses_status_idx` ON `generated_courses` (`status`);--> statement-breakpoint
CREATE TABLE `learner_priorities` (
	`user_id` text PRIMARY KEY NOT NULL,
	`target_role` text DEFAULT '' NOT NULL,
	`must_have` text DEFAULT '[]' NOT NULL,
	`skip` text DEFAULT '[]' NOT NULL,
	`deadline_weeks` integer,
	`course_cap` integer DEFAULT 5 NOT NULL,
	`auto_publish` integer DEFAULT false NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` text,
	`status` text NOT NULL,
	`progress_note` text DEFAULT '' NOT NULL,
	`failure_reason` text,
	`current` integer DEFAULT false NOT NULL,
	`tokens_used` integer DEFAULT 0 NOT NULL,
	`search_calls` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `learning_paths_user_idx` ON `learning_paths` (`user_id`,`current`);--> statement-breakpoint
CREATE TABLE `path_items` (
	`id` text PRIMARY KEY NOT NULL,
	`path_id` text NOT NULL,
	`course_id` text,
	`gap_id` text,
	`position` integer NOT NULL,
	`source` text NOT NULL,
	`reason` text NOT NULL,
	FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`gap_id`) REFERENCES `skill_gaps`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `path_items_path_idx` ON `path_items` (`path_id`,`position`);--> statement-breakpoint
CREATE TABLE `skill_gaps` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` text,
	`skill` text NOT NULL,
	`severity` real NOT NULL,
	`evidence` text NOT NULL,
	`source` text NOT NULL,
	`priority_score` real NOT NULL,
	`skipped` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `skill_gaps_user_idx` ON `skill_gaps` (`user_id`,`priority_score`);--> statement-breakpoint
CREATE INDEX `skill_gaps_assessment_idx` ON `skill_gaps` (`assessment_id`);--> statement-breakpoint
ALTER TABLE `course_topics` ADD `practice` text;--> statement-breakpoint
ALTER TABLE `course_topics` ADD `test` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `origin` text DEFAULT 'manual' NOT NULL;