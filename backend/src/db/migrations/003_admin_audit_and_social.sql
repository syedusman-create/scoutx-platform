-- Admin audit logs + social integration foundation

CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  action         VARCHAR(120) NOT NULL,
  table_name     VARCHAR(120) NOT NULL,
  row_pk         VARCHAR(120),
  before_json    JSONB,
  after_json     JSONB,
  ip             VARCHAR(120),
  user_agent     TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_row ON audit_logs(table_name, row_pk, created_at DESC);

CREATE TABLE IF NOT EXISTS social_integrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  provider       VARCHAR(30) NOT NULL CHECK (provider IN ('instagram_business', 'x')),
  status         VARCHAR(20) NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connected','error')),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id      UUID REFERENCES social_integrations(id) ON DELETE CASCADE,
  provider_account_id VARCHAR(255) NOT NULL,
  display_name        VARCHAR(255),
  profile_url         VARCHAR(500),
  created_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(integration_id, provider_account_id)
);

CREATE TABLE IF NOT EXISTS social_tokens (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id     UUID UNIQUE REFERENCES social_integrations(id) ON DELETE CASCADE,
  access_token       TEXT,
  refresh_token      TEXT,
  expires_at         TIMESTAMP,
  scopes             TEXT,
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  body               TEXT NOT NULL,
  media_url          VARCHAR(500),
  status             VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','published','failed')),
  created_at         TIMESTAMP DEFAULT NOW(),
  scheduled_at       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_post_deliveries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id     UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  integration_id     UUID REFERENCES social_integrations(id) ON DELETE CASCADE,
  provider_post_id   VARCHAR(255),
  destination_name   VARCHAR(255),
  status             VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  error              TEXT,
  sent_at            TIMESTAMP,
  created_at         TIMESTAMP DEFAULT NOW()
);

