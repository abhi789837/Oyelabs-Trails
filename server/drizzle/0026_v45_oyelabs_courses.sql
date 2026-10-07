CREATE TABLE `course_department_rules` (
	`course_id` text NOT NULL,
	`department_id` text NOT NULL,
	`priority` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`course_id`, `department_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_department_rules_department_idx` ON `course_department_rules` (`department_id`);--> statement-breakpoint
CREATE TABLE `course_departments` (
	`course_id` text NOT NULL,
	`department_id` text NOT NULL,
	PRIMARY KEY(`course_id`, `department_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_departments_department_idx` ON `course_departments` (`department_id`);--> statement-breakpoint
CREATE TABLE `course_docs` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`section_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`upload_id` text,
	`url` text,
	`link_kind` text,
	`fetch_url` text,
	`title` text DEFAULT '' NOT NULL,
	`title_locked` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`problem` text,
	`last_checked_at` integer,
	`broken_since` integer,
	`text_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`upload_id`) REFERENCES `media_uploads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `course_docs_section_idx` ON `course_docs` (`section_id`,`position`);--> statement-breakpoint
CREATE INDEX `course_docs_course_idx` ON `course_docs` (`course_id`);--> statement-breakpoint
CREATE INDEX `course_docs_broken_idx` ON `course_docs` (`broken_since`);--> statement-breakpoint
CREATE TABLE `course_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text,
	`data` text NOT NULL,
	`created_by` text,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_drafts_course_idx` ON `course_drafts` (`course_id`);--> statement-breakpoint
CREATE INDEX `course_drafts_author_idx` ON `course_drafts` (`created_by`,`updated_at`);--> statement-breakpoint
CREATE TABLE `course_embeddings` (
	`course_id` text PRIMARY KEY NOT NULL,
	`model` text NOT NULL,
	`dims` integer NOT NULL,
	`vector` blob NOT NULL,
	`text_hash` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course_module_tests` (
	`section_id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`status` text DEFAULT 'empty' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`source_summary` text,
	`content_hash` text,
	`generated_hash` text,
	`item_count` integer DEFAULT 0 NOT NULL,
	`generation` integer DEFAULT 0 NOT NULL,
	`cost_micros` integer DEFAULT 0 NOT NULL,
	`model` text,
	`error` text,
	`generated_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `course_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_module_tests_course_idx` ON `course_module_tests` (`course_id`);--> statement-breakpoint
CREATE INDEX `course_module_tests_status_idx` ON `course_module_tests` (`status`);--> statement-breakpoint
CREATE TABLE `course_module_texts` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`section_id` text NOT NULL,
	`source_kind` text NOT NULL,
	`source_id` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`method` text,
	`passages` text DEFAULT '[]' NOT NULL,
	`chars` integer DEFAULT 0 NOT NULL,
	`content_hash` text,
	`error` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_module_texts_source_idx` ON `course_module_texts` (`section_id`,`source_kind`,`source_id`);--> statement-breakpoint
CREATE INDEX `course_module_texts_course_idx` ON `course_module_texts` (`course_id`);--> statement-breakpoint
CREATE TABLE `course_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`section_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`input_url` text,
	`upload_id` text,
	`kind` text NOT NULL,
	`provider_id` text,
	`player_kind` text NOT NULL,
	`embed_url` text,
	`playback_url` text,
	`tracking` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`title_locked` integer DEFAULT false NOT NULL,
	`thumbnail_url` text,
	`duration_seconds` real,
	`duration_source` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`problem` text,
	`last_checked_at` integer,
	`broken_since` integer,
	`transcript_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `course_topics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`upload_id`) REFERENCES `media_uploads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `course_videos_topic_idx` ON `course_videos` (`topic_id`,`position`);--> statement-breakpoint
CREATE INDEX `course_videos_course_idx` ON `course_videos` (`course_id`);--> statement-breakpoint
CREATE INDEX `course_videos_broken_idx` ON `course_videos` (`broken_since`);--> statement-breakpoint
CREATE TABLE `media_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`rel_path` text NOT NULL,
	`original_name` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`transcode_status` text DEFAULT 'none' NOT NULL,
	`playback_rel_path` text,
	`playback_mime` text,
	`duration_seconds` real,
	`error` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `media_uploads_sha_idx` ON `media_uploads` (`sha256`);--> statement-breakpoint
CREATE INDEX `media_uploads_transcode_idx` ON `media_uploads` (`transcode_status`);--> statement-breakpoint
ALTER TABLE `course_assignments` ADD `priority` text;--> statement-breakpoint
ALTER TABLE `course_assignments` ADD `source` text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE `course_sections` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `course_sections` ADD `notes_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `course_topics` ADD `kind` text DEFAULT 'lesson' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `oyelabs` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `published_version` integer;--> statement-breakpoint
ALTER TABLE `topic_attempts` ADD `course_id` text;--> statement-breakpoint
ALTER TABLE `video_progress` ADD `tracking` text DEFAULT 'exact' NOT NULL;--> statement-breakpoint
ALTER TABLE `video_progress` ADD `active_seconds` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `video_progress` ADD `confirmed_at` integer;