drop extension if exists "pg_net";


  create table "public"."analyses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "listing_id" uuid,
    "listing_name" text,
    "category" text,
    "brand" text,
    "trust_score" integer,
    "trust_level" text,
    "description_quality" integer,
    "completeness" integer,
    "duplicate_risk" integer,
    "suspicious_risk" integer,
    "status" text,
    "result_json" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."analyses" enable row level security;


  create table "public"."listings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "product_name" text not null,
    "category" text,
    "brand" text,
    "model" text,
    "condition" text,
    "age" text,
    "warranty" text,
    "description" text,
    "image_urls" text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."listings" enable row level security;


  create table "public"."marketplace_reference" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "category" text,
    "price" numeric
      );


alter table "public"."marketplace_reference" enable row level security;


  create table "public"."suspicious_phrases" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "phrase" text not null,
    "severity" integer not null
      );


alter table "public"."suspicious_phrases" enable row level security;


  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "email" text not null,
    "password_hash" text not null,
    "plan" text default 'free'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX analyses_pkey ON public.analyses USING btree (id);

CREATE INDEX idx_analyses_created_at ON public.analyses USING btree (created_at);

CREATE INDEX idx_analyses_trust_score ON public.analyses USING btree (trust_score);

CREATE INDEX idx_analyses_user_id ON public.analyses USING btree (user_id);

CREATE INDEX idx_listings_created_at ON public.listings USING btree (created_at);

CREATE INDEX idx_listings_user_id ON public.listings USING btree (user_id);

CREATE UNIQUE INDEX listings_pkey ON public.listings USING btree (id);

CREATE UNIQUE INDEX marketplace_reference_pkey ON public.marketplace_reference USING btree (id);

CREATE UNIQUE INDEX suspicious_phrases_pkey ON public.suspicious_phrases USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."analyses" add constraint "analyses_pkey" PRIMARY KEY using index "analyses_pkey";

alter table "public"."listings" add constraint "listings_pkey" PRIMARY KEY using index "listings_pkey";

alter table "public"."marketplace_reference" add constraint "marketplace_reference_pkey" PRIMARY KEY using index "marketplace_reference_pkey";

alter table "public"."suspicious_phrases" add constraint "suspicious_phrases_pkey" PRIMARY KEY using index "suspicious_phrases_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."analyses" add constraint "analyses_listing_id_fkey" FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE not valid;

alter table "public"."analyses" validate constraint "analyses_listing_id_fkey";

alter table "public"."analyses" add constraint "analyses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."analyses" validate constraint "analyses_user_id_fkey";

alter table "public"."listings" add constraint "listings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."listings" validate constraint "listings_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."analyses" to "anon";

grant insert on table "public"."analyses" to "anon";

grant references on table "public"."analyses" to "anon";

grant select on table "public"."analyses" to "anon";

grant trigger on table "public"."analyses" to "anon";

grant truncate on table "public"."analyses" to "anon";

grant update on table "public"."analyses" to "anon";

grant delete on table "public"."analyses" to "authenticated";

grant insert on table "public"."analyses" to "authenticated";

grant references on table "public"."analyses" to "authenticated";

grant select on table "public"."analyses" to "authenticated";

grant trigger on table "public"."analyses" to "authenticated";

grant truncate on table "public"."analyses" to "authenticated";

grant update on table "public"."analyses" to "authenticated";

grant delete on table "public"."analyses" to "service_role";

grant insert on table "public"."analyses" to "service_role";

grant references on table "public"."analyses" to "service_role";

grant select on table "public"."analyses" to "service_role";

grant trigger on table "public"."analyses" to "service_role";

grant truncate on table "public"."analyses" to "service_role";

grant update on table "public"."analyses" to "service_role";

grant delete on table "public"."listings" to "anon";

grant insert on table "public"."listings" to "anon";

grant references on table "public"."listings" to "anon";

grant select on table "public"."listings" to "anon";

grant trigger on table "public"."listings" to "anon";

grant truncate on table "public"."listings" to "anon";

grant update on table "public"."listings" to "anon";

grant delete on table "public"."listings" to "authenticated";

grant insert on table "public"."listings" to "authenticated";

grant references on table "public"."listings" to "authenticated";

grant select on table "public"."listings" to "authenticated";

grant trigger on table "public"."listings" to "authenticated";

grant truncate on table "public"."listings" to "authenticated";

grant update on table "public"."listings" to "authenticated";

grant delete on table "public"."listings" to "service_role";

grant insert on table "public"."listings" to "service_role";

grant references on table "public"."listings" to "service_role";

grant select on table "public"."listings" to "service_role";

grant trigger on table "public"."listings" to "service_role";

grant truncate on table "public"."listings" to "service_role";

grant update on table "public"."listings" to "service_role";

grant delete on table "public"."marketplace_reference" to "anon";

grant insert on table "public"."marketplace_reference" to "anon";

grant references on table "public"."marketplace_reference" to "anon";

grant select on table "public"."marketplace_reference" to "anon";

grant trigger on table "public"."marketplace_reference" to "anon";

grant truncate on table "public"."marketplace_reference" to "anon";

grant update on table "public"."marketplace_reference" to "anon";

grant delete on table "public"."marketplace_reference" to "authenticated";

grant insert on table "public"."marketplace_reference" to "authenticated";

grant references on table "public"."marketplace_reference" to "authenticated";

grant select on table "public"."marketplace_reference" to "authenticated";

grant trigger on table "public"."marketplace_reference" to "authenticated";

grant truncate on table "public"."marketplace_reference" to "authenticated";

grant update on table "public"."marketplace_reference" to "authenticated";

grant delete on table "public"."marketplace_reference" to "service_role";

grant insert on table "public"."marketplace_reference" to "service_role";

grant references on table "public"."marketplace_reference" to "service_role";

grant select on table "public"."marketplace_reference" to "service_role";

grant trigger on table "public"."marketplace_reference" to "service_role";

grant truncate on table "public"."marketplace_reference" to "service_role";

grant update on table "public"."marketplace_reference" to "service_role";

grant delete on table "public"."suspicious_phrases" to "anon";

grant insert on table "public"."suspicious_phrases" to "anon";

grant references on table "public"."suspicious_phrases" to "anon";

grant select on table "public"."suspicious_phrases" to "anon";

grant trigger on table "public"."suspicious_phrases" to "anon";

grant truncate on table "public"."suspicious_phrases" to "anon";

grant update on table "public"."suspicious_phrases" to "anon";

grant delete on table "public"."suspicious_phrases" to "authenticated";

grant insert on table "public"."suspicious_phrases" to "authenticated";

grant references on table "public"."suspicious_phrases" to "authenticated";

grant select on table "public"."suspicious_phrases" to "authenticated";

grant trigger on table "public"."suspicious_phrases" to "authenticated";

grant truncate on table "public"."suspicious_phrases" to "authenticated";

grant update on table "public"."suspicious_phrases" to "authenticated";

grant delete on table "public"."suspicious_phrases" to "service_role";

grant insert on table "public"."suspicious_phrases" to "service_role";

grant references on table "public"."suspicious_phrases" to "service_role";

grant select on table "public"."suspicious_phrases" to "service_role";

grant trigger on table "public"."suspicious_phrases" to "service_role";

grant truncate on table "public"."suspicious_phrases" to "service_role";

grant update on table "public"."suspicious_phrases" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


