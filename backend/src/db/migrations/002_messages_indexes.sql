-- Messaging indexes/readiness improvements
-- Safe to run after 001_init.sql

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created_at
  ON messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_is_read
  ON messages (receiver_id, is_read, created_at DESC);

