-- CreateTable
CREATE TABLE "iss_live_feeds" (
    "id" SERIAL NOT NULL,
    "feed_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtube_url" TEXT NOT NULL,
    "embed_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iss_live_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "launch_feed_schedules" (
    "id" SERIAL NOT NULL,
    "launch_id" TEXT NOT NULL,
    "launch_name" TEXT NOT NULL,
    "launch_date" TIMESTAMP(3) NOT NULL,
    "feed_id" TEXT,
    "youtube_url" TEXT,
    "embed_url" TEXT,
    "switch_time_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_switched" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "launch_feed_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "iss_live_feeds_feed_id_key" ON "iss_live_feeds"("feed_id");

-- CreateIndex
CREATE UNIQUE INDEX "launch_feed_schedules_launch_id_key" ON "launch_feed_schedules"("launch_id");

-- Insert default ISS live feed
INSERT INTO "iss_live_feeds" ("feed_id", "title", "description", "youtube_url", "embed_url", "is_active", "is_default", "priority") 
VALUES (
    'iss-24-7-live',
    'NASA ISS 24/7 Live Feed',
    'Live video from the International Space Station showing Earth from space',
    'https://www.youtube.com/watch?v=iYmvCUonukw',
    'https://www.youtube.com/embed/iYmvCUonukw?si=MsTYaJK57JO4_TCN',
    true,
    true,
    1
);
