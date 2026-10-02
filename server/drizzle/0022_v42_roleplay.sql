CREATE TABLE `roleplay_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scenario_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`context` text NOT NULL,
	`assessment_id` text,
	`item_id` text,
	`mode` text NOT NULL,
	`transcript` text NOT NULL,
	`turns` integer DEFAULT 0 NOT NULL,
	`max_turns` integer NOT NULL,
	`status` text NOT NULL,
	`follow_up_email` text,
	`score` text,
	`cost_micros` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `roleplay_sessions_user_idx` ON `roleplay_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `roleplay_sessions_created_idx` ON `roleplay_sessions` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `roleplay_sessions_item_idx` ON `roleplay_sessions` (`assessment_id`,`item_id`);