CREATE TABLE `research_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text,
	`search_ciphertext` text,
	`search_iv` text,
	`search_tag` text,
	`search_hint` text,
	`youtube_ciphertext` text,
	`youtube_iv` text,
	`youtube_tag` text,
	`youtube_hint` text,
	`budget_tokens` integer DEFAULT 400000 NOT NULL,
	`budget_searches` integer DEFAULT 60 NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL
);
