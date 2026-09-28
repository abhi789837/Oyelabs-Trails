CREATE TABLE `weekly_plan_items` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text,
	`course_id` text,
	`lesson_id` text,
	`lane` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`minutes` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`source` text NOT NULL,
	`depends_on` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`carried_from` text,
	`skip_count` integer DEFAULT 0 NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`plan_id`) REFERENCES `weekly_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `course_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `weekly_plan_items_plan_idx` ON `weekly_plan_items` (`plan_id`,`lane`,`position`);--> statement-breakpoint
CREATE INDEX `weekly_plan_items_topic_idx` ON `weekly_plan_items` (`topic_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_plan_items_plan_topic_idx` ON `weekly_plan_items` (`plan_id`,`topic_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_plan_items_plan_lesson_idx` ON `weekly_plan_items` (`plan_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `weekly_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`budget_minutes` integer NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`roadmap_narrative` text DEFAULT '' NOT NULL,
	`next_week_preview` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text DEFAULT 'rules' NOT NULL,
	`generated_by` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `weekly_plans_user_idx` ON `weekly_plans` (`user_id`,`week_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_plans_user_week_idx` ON `weekly_plans` (`user_id`,`week_number`) WHERE status <> 'superseded';--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `hours_per_week` integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `days_per_week` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_priorities` ADD `week_starts_monday` integer DEFAULT false NOT NULL;