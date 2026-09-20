CREATE TABLE `todos` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text NOT NULL,
  `title` text NOT NULL,
  `notes` text DEFAULT '' NOT NULL,
  `completed` integer DEFAULT 0 NOT NULL,
  `priority` text DEFAULT 'none' NOT NULL,
  `due_date` text,
  `position` integer NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `todos_priority_check` CHECK (`priority` IN ('none', 'low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE INDEX `todos_workspace_position_idx` ON `todos` (`workspace_id`,`position`);
--> statement-breakpoint
CREATE INDEX `todos_workspace_completed_idx` ON `todos` (`workspace_id`,`completed`);
