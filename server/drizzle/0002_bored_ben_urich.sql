CREATE TABLE `generation_log` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`seq` integer NOT NULL,
	`stage` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`elapsed_ms` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `generation_log_assessment_idx` ON `generation_log` (`assessment_id`,`seq`);