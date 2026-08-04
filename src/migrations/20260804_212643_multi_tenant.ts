import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_status" AS ENUM('active', 'suspended', 'archived');
  ALTER TYPE "public"."enum_users_role" ADD VALUE 'super-admin' BEFORE 'admin';
  CREATE TABLE "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" integer NOT NULL
  );
  
  CREATE TABLE "tenants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_tenants_status" DEFAULT 'active' NOT NULL,
  	"public_domain" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "identite" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "identite" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "identite" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "identite" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "couleurs" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "couleurs" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "couleurs" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "couleurs" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "contact" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "contact" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "contact" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "contact" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "horaires" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "horaires" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "horaires" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "horaires" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "reseaux" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "reseaux" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "reseaux" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "reseaux" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "menu" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "menu" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "pied_de_page" ALTER COLUMN "updated_at" SET DEFAULT now();
  ALTER TABLE "pied_de_page" ALTER COLUMN "updated_at" SET NOT NULL;
  ALTER TABLE "pied_de_page" ALTER COLUMN "created_at" SET DEFAULT now();
  ALTER TABLE "pied_de_page" ALTER COLUMN "created_at" SET NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_tenant_id" integer;
  ALTER TABLE "actualites" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "_actualites_v" ADD COLUMN "version_tenant_id" integer;
  ALTER TABLE "categories" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "legal_pages" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "_legal_pages_v" ADD COLUMN "version_tenant_id" integer;
  ALTER TABLE "media" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "messages" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tenants_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "identite_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "couleurs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "contact_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "horaires_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reseaux_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pied_de_page_id" integer;
  ALTER TABLE "identite" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "couleurs" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "contact" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "horaires" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "reseaux" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "menu" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "pied_de_page" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "actualites" ADD CONSTRAINT "actualites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_actualites_v" ADD CONSTRAINT "_actualites_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "legal_pages" ADD CONSTRAINT "legal_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_legal_pages_v" ADD CONSTRAINT "_legal_pages_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_identite_fk" FOREIGN KEY ("identite_id") REFERENCES "public"."identite"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_couleurs_fk" FOREIGN KEY ("couleurs_id") REFERENCES "public"."couleurs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_horaires_fk" FOREIGN KEY ("horaires_id") REFERENCES "public"."horaires"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reseaux_fk" FOREIGN KEY ("reseaux_id") REFERENCES "public"."reseaux"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pied_de_page_fk" FOREIGN KEY ("pied_de_page_id") REFERENCES "public"."pied_de_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "identite" ADD CONSTRAINT "identite_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "couleurs" ADD CONSTRAINT "couleurs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact" ADD CONSTRAINT "contact_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "horaires" ADD CONSTRAINT "horaires_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reseaux" ADD CONSTRAINT "reseaux_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu" ADD CONSTRAINT "menu_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pied_de_page" ADD CONSTRAINT "pied_de_page_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_tenant_idx" ON "pages" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "tenant_slug_idx" ON "pages" USING btree ("tenant_id","slug");
  CREATE INDEX "_pages_v_version_version_tenant_idx" ON "_pages_v" USING btree ("version_tenant_id");
  CREATE INDEX "version_tenant_version_slug_idx" ON "_pages_v" USING btree ("version_tenant_id","version_slug");
  CREATE INDEX "actualites_tenant_idx" ON "actualites" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "tenant_slug_1_idx" ON "actualites" USING btree ("tenant_id","slug");
  CREATE INDEX "_actualites_v_version_version_tenant_idx" ON "_actualites_v" USING btree ("version_tenant_id");
  CREATE INDEX "version_tenant_version_slug_1_idx" ON "_actualites_v" USING btree ("version_tenant_id","version_slug");
  CREATE INDEX "categories_tenant_idx" ON "categories" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "tenant_slug_2_idx" ON "categories" USING btree ("tenant_id","slug");
  CREATE INDEX "legal_pages_tenant_idx" ON "legal_pages" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "tenant_slug_3_idx" ON "legal_pages" USING btree ("tenant_id","slug");
  CREATE INDEX "_legal_pages_v_version_version_tenant_idx" ON "_legal_pages_v" USING btree ("version_tenant_id");
  CREATE INDEX "version_tenant_version_slug_2_idx" ON "_legal_pages_v" USING btree ("version_tenant_id","version_slug");
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX "messages_tenant_idx" ON "messages" USING btree ("tenant_id");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_identite_id_idx" ON "payload_locked_documents_rels" USING btree ("identite_id");
  CREATE INDEX "payload_locked_documents_rels_couleurs_id_idx" ON "payload_locked_documents_rels" USING btree ("couleurs_id");
  CREATE INDEX "payload_locked_documents_rels_contact_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_id");
  CREATE INDEX "payload_locked_documents_rels_horaires_id_idx" ON "payload_locked_documents_rels" USING btree ("horaires_id");
  CREATE INDEX "payload_locked_documents_rels_reseaux_id_idx" ON "payload_locked_documents_rels" USING btree ("reseaux_id");
  CREATE INDEX "payload_locked_documents_rels_menu_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_id");
  CREATE INDEX "payload_locked_documents_rels_pied_de_page_id_idx" ON "payload_locked_documents_rels" USING btree ("pied_de_page_id");
  CREATE UNIQUE INDEX "identite_tenant_idx" ON "identite" USING btree ("tenant_id");
  CREATE INDEX "identite_updated_at_idx" ON "identite" USING btree ("updated_at");
  CREATE INDEX "identite_created_at_idx" ON "identite" USING btree ("created_at");
  CREATE UNIQUE INDEX "couleurs_tenant_idx" ON "couleurs" USING btree ("tenant_id");
  CREATE INDEX "couleurs_updated_at_idx" ON "couleurs" USING btree ("updated_at");
  CREATE INDEX "couleurs_created_at_idx" ON "couleurs" USING btree ("created_at");
  CREATE UNIQUE INDEX "contact_tenant_idx" ON "contact" USING btree ("tenant_id");
  CREATE INDEX "contact_updated_at_idx" ON "contact" USING btree ("updated_at");
  CREATE INDEX "contact_created_at_idx" ON "contact" USING btree ("created_at");
  CREATE UNIQUE INDEX "horaires_tenant_idx" ON "horaires" USING btree ("tenant_id");
  CREATE INDEX "horaires_updated_at_idx" ON "horaires" USING btree ("updated_at");
  CREATE INDEX "horaires_created_at_idx" ON "horaires" USING btree ("created_at");
  CREATE UNIQUE INDEX "reseaux_tenant_idx" ON "reseaux" USING btree ("tenant_id");
  CREATE INDEX "reseaux_updated_at_idx" ON "reseaux" USING btree ("updated_at");
  CREATE INDEX "reseaux_created_at_idx" ON "reseaux" USING btree ("created_at");
  CREATE UNIQUE INDEX "menu_tenant_idx" ON "menu" USING btree ("tenant_id");
  CREATE INDEX "menu_updated_at_idx" ON "menu" USING btree ("updated_at");
  CREATE INDEX "menu_created_at_idx" ON "menu" USING btree ("created_at");
  CREATE UNIQUE INDEX "pied_de_page_tenant_idx" ON "pied_de_page" USING btree ("tenant_id");
  CREATE INDEX "pied_de_page_updated_at_idx" ON "pied_de_page" USING btree ("updated_at");
  CREATE INDEX "pied_de_page_created_at_idx" ON "pied_de_page" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_tenants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_tenants" CASCADE;
  DROP TABLE "tenants" CASCADE;
  ALTER TABLE "pages" DROP CONSTRAINT "pages_tenant_id_tenants_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_tenant_id_tenants_id_fk";
  
  ALTER TABLE "actualites" DROP CONSTRAINT "actualites_tenant_id_tenants_id_fk";
  
  ALTER TABLE "_actualites_v" DROP CONSTRAINT "_actualites_v_version_tenant_id_tenants_id_fk";
  
  ALTER TABLE "categories" DROP CONSTRAINT "categories_tenant_id_tenants_id_fk";
  
  ALTER TABLE "legal_pages" DROP CONSTRAINT "legal_pages_tenant_id_tenants_id_fk";
  
  ALTER TABLE "_legal_pages_v" DROP CONSTRAINT "_legal_pages_v_version_tenant_id_tenants_id_fk";
  
  ALTER TABLE "media" DROP CONSTRAINT "media_tenant_id_tenants_id_fk";
  
  ALTER TABLE "messages" DROP CONSTRAINT "messages_tenant_id_tenants_id_fk";
  
  ALTER TABLE "identite" DROP CONSTRAINT "identite_tenant_id_tenants_id_fk";
  
  ALTER TABLE "couleurs" DROP CONSTRAINT "couleurs_tenant_id_tenants_id_fk";
  
  ALTER TABLE "contact" DROP CONSTRAINT "contact_tenant_id_tenants_id_fk";
  
  ALTER TABLE "horaires" DROP CONSTRAINT "horaires_tenant_id_tenants_id_fk";
  
  ALTER TABLE "reseaux" DROP CONSTRAINT "reseaux_tenant_id_tenants_id_fk";
  
  ALTER TABLE "menu" DROP CONSTRAINT "menu_tenant_id_tenants_id_fk";
  
  ALTER TABLE "pied_de_page" DROP CONSTRAINT "pied_de_page_tenant_id_tenants_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tenants_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_identite_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_couleurs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contact_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_horaires_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reseaux_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_menu_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pied_de_page_fk";
  
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";
  DROP INDEX "pages_tenant_idx";
  DROP INDEX "tenant_slug_idx";
  DROP INDEX "_pages_v_version_version_tenant_idx";
  DROP INDEX "version_tenant_version_slug_idx";
  DROP INDEX "actualites_tenant_idx";
  DROP INDEX "tenant_slug_1_idx";
  DROP INDEX "_actualites_v_version_version_tenant_idx";
  DROP INDEX "version_tenant_version_slug_1_idx";
  DROP INDEX "categories_tenant_idx";
  DROP INDEX "tenant_slug_2_idx";
  DROP INDEX "legal_pages_tenant_idx";
  DROP INDEX "tenant_slug_3_idx";
  DROP INDEX "_legal_pages_v_version_version_tenant_idx";
  DROP INDEX "version_tenant_version_slug_2_idx";
  DROP INDEX "media_tenant_idx";
  DROP INDEX "messages_tenant_idx";
  DROP INDEX "identite_tenant_idx";
  DROP INDEX "identite_updated_at_idx";
  DROP INDEX "identite_created_at_idx";
  DROP INDEX "couleurs_tenant_idx";
  DROP INDEX "couleurs_updated_at_idx";
  DROP INDEX "couleurs_created_at_idx";
  DROP INDEX "contact_tenant_idx";
  DROP INDEX "contact_updated_at_idx";
  DROP INDEX "contact_created_at_idx";
  DROP INDEX "horaires_tenant_idx";
  DROP INDEX "horaires_updated_at_idx";
  DROP INDEX "horaires_created_at_idx";
  DROP INDEX "reseaux_tenant_idx";
  DROP INDEX "reseaux_updated_at_idx";
  DROP INDEX "reseaux_created_at_idx";
  DROP INDEX "menu_tenant_idx";
  DROP INDEX "menu_updated_at_idx";
  DROP INDEX "menu_created_at_idx";
  DROP INDEX "pied_de_page_tenant_idx";
  DROP INDEX "pied_de_page_updated_at_idx";
  DROP INDEX "pied_de_page_created_at_idx";
  DROP INDEX "payload_locked_documents_rels_tenants_id_idx";
  DROP INDEX "payload_locked_documents_rels_identite_id_idx";
  DROP INDEX "payload_locked_documents_rels_couleurs_id_idx";
  DROP INDEX "payload_locked_documents_rels_contact_id_idx";
  DROP INDEX "payload_locked_documents_rels_horaires_id_idx";
  DROP INDEX "payload_locked_documents_rels_reseaux_id_idx";
  DROP INDEX "payload_locked_documents_rels_menu_id_idx";
  DROP INDEX "payload_locked_documents_rels_pied_de_page_id_idx";
  ALTER TABLE "identite" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "identite" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "identite" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "identite" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "couleurs" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "couleurs" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "couleurs" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "couleurs" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "contact" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "contact" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "contact" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "contact" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "horaires" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "horaires" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "horaires" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "horaires" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "reseaux" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "reseaux" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "reseaux" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "reseaux" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "menu" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "menu" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "menu" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "pied_de_page" ALTER COLUMN "updated_at" DROP DEFAULT;
  ALTER TABLE "pied_de_page" ALTER COLUMN "updated_at" DROP NOT NULL;
  ALTER TABLE "pied_de_page" ALTER COLUMN "created_at" DROP DEFAULT;
  ALTER TABLE "pied_de_page" ALTER COLUMN "created_at" DROP NOT NULL;
  ALTER TABLE "pages" DROP COLUMN "tenant_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_tenant_id";
  ALTER TABLE "actualites" DROP COLUMN "tenant_id";
  ALTER TABLE "_actualites_v" DROP COLUMN "version_tenant_id";
  ALTER TABLE "categories" DROP COLUMN "tenant_id";
  ALTER TABLE "legal_pages" DROP COLUMN "tenant_id";
  ALTER TABLE "_legal_pages_v" DROP COLUMN "version_tenant_id";
  ALTER TABLE "media" DROP COLUMN "tenant_id";
  ALTER TABLE "messages" DROP COLUMN "tenant_id";
  ALTER TABLE "identite" DROP COLUMN "tenant_id";
  ALTER TABLE "couleurs" DROP COLUMN "tenant_id";
  ALTER TABLE "contact" DROP COLUMN "tenant_id";
  ALTER TABLE "horaires" DROP COLUMN "tenant_id";
  ALTER TABLE "reseaux" DROP COLUMN "tenant_id";
  ALTER TABLE "menu" DROP COLUMN "tenant_id";
  ALTER TABLE "pied_de_page" DROP COLUMN "tenant_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tenants_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "identite_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "couleurs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "contact_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "horaires_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reseaux_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "menu_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pied_de_page_id";
  DROP TYPE "public"."enum_tenants_status";`)
}
