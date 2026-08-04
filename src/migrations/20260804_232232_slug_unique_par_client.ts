import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_slug_idx";
  DROP INDEX "actualites_slug_idx";
  DROP INDEX "categories_slug_idx";
  DROP INDEX "legal_pages_slug_idx";
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "actualites_slug_idx" ON "actualites" USING btree ("slug");
  CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "legal_pages_slug_idx" ON "legal_pages" USING btree ("slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_slug_idx";
  DROP INDEX "actualites_slug_idx";
  DROP INDEX "categories_slug_idx";
  DROP INDEX "legal_pages_slug_idx";
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE UNIQUE INDEX "actualites_slug_idx" ON "actualites" USING btree ("slug");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE UNIQUE INDEX "legal_pages_slug_idx" ON "legal_pages" USING btree ("slug");`)
}
