CREATE TABLE `course_assignments` (
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`assigned_by` text,
	`assigned_at` integer NOT NULL,
	PRIMARY KEY(`course_id`, `user_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_progress` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`course_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `topic_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `course_topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_progress_course_idx` ON `course_progress` (`user_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `course_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_sections_course_idx` ON `course_sections` (`course_id`,`position`);--> statement-breakpoint
CREATE TABLE `course_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`video_id` text,
	`video_title` text,
	`links` text DEFAULT '[]' NOT NULL,
	`est_minutes` integer DEFAULT 10 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_topics_section_idx` ON `course_topics` (`section_id`,`position`);--> statement-breakpoint
CREATE INDEX `course_topics_course_idx` ON `course_topics` (`course_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`accent` text DEFAULT 'glacier' NOT NULL,
	`audience` text DEFAULT 'everyone' NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `courses_published_idx` ON `courses` (`published`,`position`);