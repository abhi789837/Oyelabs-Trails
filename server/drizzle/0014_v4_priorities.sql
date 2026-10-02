CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learner_skill_priorities` (
	`user_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`skill_name` text NOT NULL,
	`slider` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `skill_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `learner_skill_priorities_user_idx` ON `learner_skill_priorities` (`user_id`,`slider`);--> statement-breakpoint
CREATE TABLE `learner_skip` (
	`user_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`skill_name` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `skill_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
