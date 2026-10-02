CREATE TABLE `course_skills` (
	`course_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`course_id`, `skill_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_skills_skill_idx` ON `course_skills` (`skill_id`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text DEFAULT 'users' NOT NULL,
	`colour` text DEFAULT '#2067D3' NOT NULL,
	`assessment_format` text DEFAULT 'tasks' NOT NULL,
	`practice_noun` text DEFAULT 'Task workspace' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`name` text NOT NULL,
	`area` text DEFAULT 'General' NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`level_min` text DEFAULT 'beginner' NOT NULL,
	`level_max` text DEFAULT 'expert' NOT NULL,
	`track_ids` text DEFAULT '[]' NOT NULL,
	`prerequisites` text DEFAULT '[]' NOT NULL,
	`stack_ids` text DEFAULT '[]' NOT NULL,
	`language` text,
	`content_modules` text DEFAULT '[]' NOT NULL,
	`is_ai_skill` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`requested_by` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `skills_department_idx` ON `skills` (`department_id`,`status`,`area`);--> statement-breakpoint
CREATE TABLE `stacks` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`language` text,
	`aliases` text DEFAULT '[]' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stacks_department_idx` ON `stacks` (`department_id`,`position`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tracks_department_idx` ON `tracks` (`department_id`,`position`);--> statement-breakpoint
ALTER TABLE `courses` ADD `level` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `department_id` text;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `department_id` text;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `track_id` text;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `stack_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `experience_band` text;--> statement-breakpoint
-- v4 data migration: every existing learner is an engineer. The department and track rows
-- themselves are seeded at boot from server/src/catalog/seed (insert-if-absent).
UPDATE `learner_profiles` SET `department_id` = 'engineering'
  WHERE `user_id` IN (SELECT `id` FROM `users` WHERE `role` = 'learner');--> statement-breakpoint
UPDATE `learner_profiles` SET `track_id` = CASE WHEN `track` IS NULL OR `track` = 'other' THEN NULL ELSE `track` END
  WHERE `department_id` = 'engineering';--> statement-breakpoint
UPDATE `learner_profiles` SET `experience_band` = CASE
    WHEN `years_experience` IS NULL THEN NULL
    WHEN `years_experience` < 1 THEN '0'
    WHEN `years_experience` <= 2 THEN '1-2'
    WHEN `years_experience` <= 5 THEN '3-5'
    ELSE '6+' END;--> statement-breakpoint
UPDATE `courses` SET `department_id` = 'engineering' WHERE `origin` = 'generated';
