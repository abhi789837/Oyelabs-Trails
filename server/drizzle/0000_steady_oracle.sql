CREATE TABLE `ai_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`credential_id` text,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`purpose` text NOT NULL,
	`subject_user_id` text,
	`assessment_id` text,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`ok` integer NOT NULL,
	`error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ai_calls_subject_idx` ON `ai_calls` (`subject_user_id`);--> statement-breakpoint
CREATE INDEX `ai_calls_created_idx` ON `ai_calls` (`created_at`);--> statement-breakpoint
CREATE INDEX `ai_calls_purpose_idx` ON `ai_calls` (`purpose`);--> statement-breakpoint
CREATE TABLE `ai_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`label` text NOT NULL,
	`secret_ciphertext` text NOT NULL,
	`secret_iv` text NOT NULL,
	`secret_tag` text NOT NULL,
	`secret_hint` text NOT NULL,
	`status` text DEFAULT 'unverified' NOT NULL,
	`last_verified_at` integer,
	`last_error` text,
	`shared_use_acknowledged` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ai_credentials_provider_idx` ON `ai_credentials` (`provider`);--> statement-breakpoint
CREATE TABLE `ai_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`active_credential_id` text,
	`model_generation` text,
	`model_evaluation` text,
	`model_critic` text,
	`monthly_budget_note` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`active_credential_id`) REFERENCES `ai_credentials`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `assessment_items` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`area` text NOT NULL,
	`difficulty` integer NOT NULL,
	`kind` text NOT NULL,
	`topic_ids` text NOT NULL,
	`payload` text NOT NULL,
	`key` text NOT NULL,
	`critic_verdict` text,
	`status` text DEFAULT 'pool' NOT NULL,
	`drop_reason` text,
	`served_at` integer,
	`answered_at` integer,
	`time_ms` integer,
	`response` text,
	`auto_score` integer,
	`ai_score` integer,
	`ai_feedback` text,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessment_items_assessment_idx` ON `assessment_items` (`assessment_id`);--> statement-breakpoint
CREATE INDEX `assessment_items_pool_idx` ON `assessment_items` (`assessment_id`,`status`,`area`,`difficulty`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`attempt_no` integer DEFAULT 1 NOT NULL,
	`status` text NOT NULL,
	`blueprint` text,
	`config` text,
	`started_at` integer,
	`deadline_at` integer,
	`submitted_at` integer,
	`terminated_reason` text,
	`hard_warnings` integer DEFAULT 0 NOT NULL,
	`soft_warnings` integer DEFAULT 0 NOT NULL,
	`consent_at` integer,
	`last_heartbeat_at` integer,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessments_user_idx` ON `assessments` (`user_id`);--> statement-breakpoint
CREATE INDEX `assessments_status_idx` ON `assessments` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_user_attempt_idx` ON `assessments` (`user_id`,`attempt_no`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` text,
	`details` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_target_idx` ON `audit_log` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`track_id` text NOT NULL,
	`learner_name` text NOT NULL,
	`topic_ids` text NOT NULL,
	`plan_id` text,
	`average_score` integer,
	`issued_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `certificates_user_idx` ON `certificates` (`user_id`);--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`result` text NOT NULL,
	`model` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `evaluations_assessment_idx` ON `evaluations` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `integrity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`counted` integer DEFAULT false NOT NULL,
	`details` text,
	`snapshot_path` text,
	`client_ts` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `integrity_events_assessment_idx` ON `integrity_events` (`assessment_id`);--> statement-breakpoint
CREATE INDEX `integrity_events_created_idx` ON `integrity_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`run_after` integer NOT NULL,
	`locked_at` integer,
	`last_error` text,
	`created_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE INDEX `jobs_claim_idx` ON `jobs` (`status`,`run_after`);--> statement-breakpoint
CREATE TABLE `learner_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role_title` text,
	`years_experience` integer,
	`admin_notes` text DEFAULT '' NOT NULL,
	`claimed_skills` text NOT NULL,
	`target_tracks` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learning_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	`source` text NOT NULL,
	`assessment_id` text,
	`topic_ids` text NOT NULL,
	`rationale` text,
	`published_at` integer,
	`published_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `learning_plans_user_idx` ON `learning_plans` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `learning_plans_user_version_idx` ON `learning_plans` (`user_id`,`version`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`link` text,
	`read_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `notifications` (`recipient_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`absolute_expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`ip` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `topic_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`kind` text NOT NULL,
	`score` integer NOT NULL,
	`passed` integer NOT NULL,
	`answers` text,
	`code` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topic_attempts_user_topic_idx` ON `topic_attempts` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `topic_progress` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`status` text NOT NULL,
	`best_score` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `topic_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topic_progress_user_idx` ON `topic_progress` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`must_change_password` integer DEFAULT true NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`created_by` text,
	`created_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);