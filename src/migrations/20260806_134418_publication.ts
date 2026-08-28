import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The `publication` global gets a table like every other global, even though it
 * stores nothing: the screen it backs holds a button, not a setting. Payload
 * still reads the row when the admin opens it, so the table has to exist.
 *
 * Generated with `migrate:create`. The generator also proposed dropping NOT NULL
 * on `users.role`, which is drift of its own — the field is still `required` in
 * the collection — and has been left out: relaxing a constraint on every
 * client's database has nothing to do with publishing a site.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "publication" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "publication" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "publication" CASCADE;`)
}
