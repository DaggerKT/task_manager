-- Create sequence for task running numbers
CREATE SEQUENCE IF NOT EXISTS "tasks_task_no_seq";

ALTER TABLE "tasks" ADD COLUMN "task_no" INTEGER;

WITH ordered_tasks AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "created_at" ASC, "id" ASC) AS "task_no"
  FROM "tasks"
)
UPDATE "tasks" AS t
SET "task_no" = ordered_tasks."task_no"
FROM ordered_tasks
WHERE t."id" = ordered_tasks."id";

SELECT setval(
  '"tasks_task_no_seq"',
  COALESCE((SELECT MAX("task_no") FROM "tasks"), 0) + 1,
  false
);

ALTER TABLE "tasks"
  ALTER COLUMN "task_no" SET DEFAULT nextval('"tasks_task_no_seq"'),
  ALTER COLUMN "task_no" SET NOT NULL;

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_task_no_key" UNIQUE ("task_no");