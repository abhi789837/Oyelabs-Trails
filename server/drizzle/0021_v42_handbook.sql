CREATE TABLE `handbook_entries` (
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`seed_hash` text,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	`upload_name` text,
	`upload_type` text,
	PRIMARY KEY(`kind`, `id`)
);
--> statement-breakpoint
CREATE TABLE `handbook_flashcards` (
	`user_id` text NOT NULL,
	`term_id` text NOT NULL,
	`box` integer DEFAULT 1 NOT NULL,
	`due_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `term_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `question_bank` ADD `handbook_refs` text DEFAULT '[]' NOT NULL;