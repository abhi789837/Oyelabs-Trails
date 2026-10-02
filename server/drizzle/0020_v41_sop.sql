CREATE TABLE `sop_entries` (
	`topic_id` text NOT NULL,
	`block_index` integer NOT NULL,
	`body` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`topic_id`, `block_index`)
);
