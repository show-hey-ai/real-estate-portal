CREATE TABLE "transit_line_master" (
  "id" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "displayNameJa" TEXT NOT NULL,
  "operatorNameJa" TEXT,
  "sourceLineName" TEXT,
  "sourceDataset" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "transit_line_master_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transit_station_master" (
  "id" TEXT NOT NULL,
  "lineId" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "displayNameJa" TEXT NOT NULL,
  "ward" TEXT NOT NULL,
  "sourceStationName" TEXT,
  "sourceStationCode" TEXT,
  "sourceGroupCode" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "transit_station_master_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "transit_line_master_canonicalName_key" ON "transit_line_master"("canonicalName");
CREATE UNIQUE INDEX "transit_station_master_lineId_canonicalName_key" ON "transit_station_master"("lineId", "canonicalName");
CREATE INDEX "transit_station_master_lineId_sortOrder_idx" ON "transit_station_master"("lineId", "sortOrder");
CREATE INDEX "transit_station_master_ward_idx" ON "transit_station_master"("ward");

ALTER TABLE "transit_station_master"
ADD CONSTRAINT "transit_station_master_lineId_fkey"
FOREIGN KEY ("lineId") REFERENCES "transit_line_master"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
