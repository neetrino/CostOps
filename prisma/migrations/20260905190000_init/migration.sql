-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProviderKey" AS ENUM ('NEON', 'VERCEL', 'UPSTASH', 'GCP', 'HETZNER', 'RESEND', 'CLOUDFLARE');

-- CreateEnum
CREATE TYPE "ProviderAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "CostSourceType" AS ENUM ('API', 'ESTIMATED', 'FIXED', 'MANUAL');

-- CreateEnum
CREATE TYPE "CostSourceStatus" AS ENUM ('FRESH', 'PARTIAL', 'FINAL', 'STALE', 'ERROR', 'MISSING');

-- CreateEnum
CREATE TYPE "BudgetScope" AS ENUM ('PROJECT_PROVIDER', 'PROJECT_TOTAL', 'PROVIDER_TOTAL', 'GLOBAL_TOTAL');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('DAILY');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('TELEGRAM');

-- CreateEnum
CREATE TYPE "AlertEventStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "CredentialAlertKind" AS ENUM ('EXPIRING_30D', 'EXPIRING_7D', 'EXPIRED', 'AUTH_FAILED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "key" "ProviderKey" NOT NULL,
    "display_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "provider_accounts" (
    "id" TEXT NOT NULL,
    "provider_key" "ProviderKey" NOT NULL,
    "name" TEXT NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "status" "ProviderAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "recommended_sync_interval_minutes" INTEGER,
    "last_successful_sync_at" TIMESTAMP(3),
    "last_error_at" TIMESTAMP(3),
    "last_error_message" TEXT,
    "last_auth_failure_at" TIMESTAMP(3),
    "last_auth_failure_code" TEXT,
    "credential_ref" TEXT NOT NULL,
    "credential_expires_at" TIMESTAMP(3),
    "credential_rotated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_alerts" (
    "id" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "kind" "CredentialAlertKind" NOT NULL,
    "window_key" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credential_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_providers" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "provider_key" "ProviderKey" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "provider_key" "ProviderKey" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "project_id" TEXT,
    "project_provider_id" TEXT,
    "external_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "metadata" JSONB,
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_entries" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "project_id" TEXT,
    "project_provider_id" TEXT,
    "provider_key" "ProviderKey" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "resource_id" TEXT,
    "bucket_date" DATE NOT NULL,
    "cost_usd" DECIMAL(14,6) NOT NULL,
    "original_amount" DECIMAL(14,6),
    "original_currency" VARCHAR(3),
    "source_type" "CostSourceType" NOT NULL,
    "source_status" "CostSourceStatus" NOT NULL,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "dimension_key" TEXT NOT NULL DEFAULT '_',
    "source_record_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_entries" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "project_id" TEXT,
    "project_provider_id" TEXT,
    "provider_key" "ProviderKey" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "resource_id" TEXT,
    "bucket_date" DATE NOT NULL,
    "metric_key" TEXT NOT NULL,
    "value_numeric" DECIMAL(24,6),
    "value_bigint" BIGINT,
    "unit" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_rules" (
    "id" TEXT NOT NULL,
    "scope_key" TEXT NOT NULL,
    "scope" "BudgetScope" NOT NULL,
    "project_id" TEXT,
    "project_provider_id" TEXT,
    "provider_key" "ProviderKey",
    "period" "BudgetPeriod" NOT NULL DEFAULT 'DAILY',
    "limit_usd" DECIMAL(12,4) NOT NULL,
    "escalation_percent" DECIMAL(5,2) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "budget_rule_id" TEXT NOT NULL,
    "budget_date" DATE NOT NULL,
    "first_breach_cost_usd" DECIMAL(14,6) NOT NULL,
    "last_notified_cost_usd" DECIMAL(14,6) NOT NULL,
    "last_notified_at" TIMESTAMP(3) NOT NULL,
    "notification_channel" "AlertChannel" NOT NULL DEFAULT 'TELEGRAM',
    "status" "AlertEventStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "provider_key" "ProviderKey" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" "SyncRunStatus" NOT NULL,
    "range_from" TIMESTAMP(3) NOT NULL,
    "range_to" TIMESTAMP(3) NOT NULL,
    "granularity" TEXT,
    "rows_read" INTEGER,
    "rows_written" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "provider_accounts_provider_key_external_account_id_key" ON "provider_accounts"("provider_key", "external_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "credential_alerts_provider_account_id_kind_window_key_key" ON "credential_alerts"("provider_account_id", "kind", "window_key");

-- CreateIndex
CREATE UNIQUE INDEX "project_providers_project_id_provider_key_key" ON "project_providers"("project_id", "provider_key");

-- CreateIndex
CREATE INDEX "resources_project_id_idx" ON "resources"("project_id");

-- CreateIndex
CREATE INDEX "resources_provider_key_project_id_idx" ON "resources"("provider_key", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "resources_provider_account_id_external_id_key" ON "resources"("provider_account_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_entries_idempotency_key_key" ON "cost_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "cost_entries_project_id_bucket_date_idx" ON "cost_entries"("project_id", "bucket_date");

-- CreateIndex
CREATE INDEX "cost_entries_project_provider_id_bucket_date_idx" ON "cost_entries"("project_provider_id", "bucket_date");

-- CreateIndex
CREATE INDEX "cost_entries_provider_key_bucket_date_idx" ON "cost_entries"("provider_key", "bucket_date");

-- CreateIndex
CREATE INDEX "cost_entries_bucket_date_idx" ON "cost_entries"("bucket_date");

-- CreateIndex
CREATE UNIQUE INDEX "metric_entries_idempotency_key_key" ON "metric_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "metric_entries_project_provider_id_bucket_date_metric_key_idx" ON "metric_entries"("project_provider_id", "bucket_date", "metric_key");

-- CreateIndex
CREATE INDEX "metric_entries_provider_key_bucket_date_idx" ON "metric_entries"("provider_key", "bucket_date");

-- CreateIndex
CREATE UNIQUE INDEX "budget_rules_scope_key_key" ON "budget_rules"("scope_key");

-- CreateIndex
CREATE INDEX "alert_events_budget_date_idx" ON "alert_events"("budget_date");

-- CreateIndex
CREATE UNIQUE INDEX "alert_events_budget_rule_id_budget_date_key" ON "alert_events"("budget_rule_id", "budget_date");

-- CreateIndex
CREATE INDEX "sync_runs_provider_account_id_started_at_idx" ON "sync_runs"("provider_account_id", "started_at");

-- CreateIndex
CREATE INDEX "sync_runs_status_started_at_idx" ON "sync_runs"("status", "started_at");

-- AddForeignKey
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "providers"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_alerts" ADD CONSTRAINT "credential_alerts_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_providers" ADD CONSTRAINT "project_providers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_providers" ADD CONSTRAINT "project_providers_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "providers"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "providers"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_provider_id_fkey" FOREIGN KEY ("project_provider_id") REFERENCES "project_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_project_provider_id_fkey" FOREIGN KEY ("project_provider_id") REFERENCES "project_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "providers"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_entries" ADD CONSTRAINT "cost_entries_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_project_provider_id_fkey" FOREIGN KEY ("project_provider_id") REFERENCES "project_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "providers"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_rules" ADD CONSTRAINT "budget_rules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_rules" ADD CONSTRAINT "budget_rules_project_provider_id_fkey" FOREIGN KEY ("project_provider_id") REFERENCES "project_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_rules" ADD CONSTRAINT "budget_rules_provider_key_fkey" FOREIGN KEY ("provider_key") REFERENCES "providers"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_budget_rule_id_fkey" FOREIGN KEY ("budget_rule_id") REFERENCES "budget_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

