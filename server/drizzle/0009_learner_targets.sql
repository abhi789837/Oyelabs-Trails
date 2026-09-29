CREATE TABLE `learner_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`skill` text NOT NULL,
	`priority` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`target_date` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `learner_targets_user_idx` ON `learner_targets` (`user_id`,`priority`,`position`);--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `track` text;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `stack` text;--> statement-breakpoint
ALTER TABLE `learner_profiles` ADD `self_level` integer;--> statement-breakpoint
-- Backfill: every existing `learner_priorities.must_have` entry becomes a target.
--
-- Without this, the admin priorities already set on live accounts would be stranded the moment the
-- code started reading `learner_targets` instead — the assessment would weight itself by an empty
-- list and every one of those learners would quietly get a generic test.
--
-- `json_each` walks the JSON array in place. `key` is the array index, which is exactly the rank the
-- old column implied by ordering, so the admin's original order survives. The id is built from the
-- user and the index rather than generated, so re-running this migration cannot duplicate a row.
INSERT INTO `learner_targets` (`id`, `user_id`, `skill`, `priority`, `position`, `target_date`, `created_at`)
SELECT
  'bf_' || p.`user_id` || '_' || e.`key`,
  p.`user_id`,
  json_extract(e.`value`, '$.skill'),
  COALESCE(json_extract(e.`value`, '$.weight'), 'medium'),
  e.`key`,
  NULL,
  p.`updated_at`
FROM `learner_priorities` p, json_each(p.`must_have`) e
WHERE json_extract(e.`value`, '$.skill') IS NOT NULL
  AND TRIM(json_extract(e.`value`, '$.skill')) <> ''
  AND NOT EXISTS (SELECT 1 FROM `learner_targets` t WHERE t.`id` = 'bf_' || p.`user_id` || '_' || e.`key`);
