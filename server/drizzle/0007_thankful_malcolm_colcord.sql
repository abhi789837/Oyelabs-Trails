CREATE TABLE `assessment_consents` (
	`assessment_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`permissions` text,
	`policy_version` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_consents_user_idx` ON `assessment_consents` (`user_id`);