-- CreateTable
CREATE TABLE "system_errors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantName" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "module" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "requestBody" TEXT,
    "queryParams" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "fingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_errors_tenantId_idx" ON "system_errors"("tenantId");

-- CreateIndex
CREATE INDEX "system_errors_module_idx" ON "system_errors"("module");

-- CreateIndex
CREATE INDEX "system_errors_statusCode_idx" ON "system_errors"("statusCode");

-- CreateIndex
CREATE INDEX "system_errors_resolved_idx" ON "system_errors"("resolved");

-- CreateIndex
CREATE INDEX "system_errors_fingerprint_idx" ON "system_errors"("fingerprint");

-- CreateIndex
CREATE INDEX "system_errors_createdAt_idx" ON "system_errors"("createdAt");

-- CreateIndex
CREATE INDEX "system_errors_resolved_createdAt_idx" ON "system_errors"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "system_errors_tenantId_resolved_idx" ON "system_errors"("tenantId", "resolved");

-- AddForeignKey
ALTER TABLE "system_errors" ADD CONSTRAINT "system_errors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
