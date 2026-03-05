-- Add persisted locale preference for each user.
ALTER TABLE "User"
ADD COLUMN "locale" VARCHAR(10) NOT NULL DEFAULT 'zh-CN';

