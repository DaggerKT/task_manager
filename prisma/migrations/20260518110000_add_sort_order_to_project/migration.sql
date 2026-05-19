-- Create sequence for project ordering
CREATE SEQUENCE IF NOT EXISTS "projects_sort_order_seq";

ALTER TABLE "projects" ADD COLUMN "sort_order" INTEGER;

WITH ordered_projects AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "created_at" ASC, "id" ASC) AS "sort_order"
  FROM "projects"
)
UPDATE "projects" AS p
SET "sort_order" = ordered_projects."sort_order"
FROM ordered_projects
WHERE p."id" = ordered_projects."id";

SELECT setval(
  '"projects_sort_order_seq"',
  COALESCE((SELECT MAX("sort_order") FROM "projects"), 0) + 1,
  false
);

ALTER TABLE "projects"
  ALTER COLUMN "sort_order" SET DEFAULT nextval('"projects_sort_order_seq"'),
  ALTER COLUMN "sort_order" SET NOT NULL;

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_sort_order_key" UNIQUE ("sort_order");