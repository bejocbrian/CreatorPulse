BEGIN;

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  parent_folder_id uuid NULL REFERENCES folders(id) ON DELETE CASCADE,

  property_id uuid NULL,
  transaction_id uuid NULL,
  transaction_stage text NULL,

  owner_user_id text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES folders(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text NULL,

  property_id uuid NULL,
  transaction_id uuid NULL,
  transaction_stage text NULL,

  current_version_id uuid NULL,

  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,

  s3_bucket text NOT NULL,
  s3_key text NOT NULL,

  filename text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NULL,
  sha256 text NULL,

  uploaded_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(document_id, version_number)
);

ALTER TABLE documents
  ADD CONSTRAINT documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS document_notes (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id uuid NULL REFERENCES document_versions(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_template_items (
  id uuid PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  sort_order int NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assigned_checklists (
  id uuid PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE RESTRICT,
  transaction_id uuid NOT NULL,
  assigned_by text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assigned_checklist_items (
  id uuid PRIMARY KEY,
  assigned_checklist_id uuid NOT NULL REFERENCES assigned_checklists(id) ON DELETE CASCADE,
  template_item_id uuid NOT NULL REFERENCES checklist_template_items(id) ON DELETE RESTRICT,

  status text NOT NULL DEFAULT 'pending',
  notes text NULL,

  completed_by text NULL,
  completed_at timestamptz NULL,

  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(assigned_checklist_id, template_item_id)
);

CREATE TABLE IF NOT EXISTS sharing_permissions (
  id uuid PRIMARY KEY,
  scope_type text NOT NULL CHECK (scope_type IN ('folder', 'document')),
  scope_id uuid NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('view', 'edit', 'sign')),
  invited_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(scope_type, scope_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY,
  actor_user_id text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
