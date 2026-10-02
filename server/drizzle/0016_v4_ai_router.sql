CREATE TABLE `ai_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_batch_id` text NOT NULL,
	`task` text NOT NULL,
	`model` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`context` text NOT NULL,
	`request_count` integer NOT NULL,
	`created_at` integer NOT NULL,
	`ended_at` integer
);
--> statement-breakpoint
CREATE TABLE `ai_task_routes` (
	`task` text PRIMARY KEY NOT NULL,
	`model` text,
	`max_tokens` integer,
	`updated_by` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `ai_calls` ADD `task` text;--> statement-breakpoint
ALTER TABLE `ai_calls` ADD `cache_read_tokens` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_calls` ADD `cache_write_tokens` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_calls` ADD `cost_micros` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_calls` ADD `course_id` text;--> statement-breakpoint
ALTER TABLE `ai_calls` ADD `batch` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_settings` ADD `monthly_budget_usd` real;--> statement-breakpoint
ALTER TABLE `ai_settings` ADD `available_models` text;--> statement-breakpoint
ALTER TABLE `ai_settings` ADD `models_fetched_at` integer;