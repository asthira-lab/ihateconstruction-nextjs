// Idempotent DDL bootstrap for projects, saved calcs, materials, and idempotency-key rows. Promise-cached.

import "server-only";
import { getDb } from "../db";

const DDL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS projects (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT          NOT NULL,
  name                  TEXT          NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  client_name           TEXT          NULL     CHECK (client_name IS NULL OR char_length(client_name) <= 200),
  location              JSONB         NULL,
  currency              CHAR(3)       NOT NULL,
  tax_region            CHAR(2)       NOT NULL,
  status                TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  notes                 TEXT          NULL     CHECK (notes IS NULL OR char_length(notes) <= 2000),
  counts_calculations   INTEGER       NOT NULL DEFAULT 0 CHECK (counts_calculations >= 0),
  counts_materials      INTEGER       NOT NULL DEFAULT 0 CHECK (counts_materials >= 0),
  counts_boqs           INTEGER       NOT NULL DEFAULT 0 CHECK (counts_boqs >= 0),
  counts_quotations     INTEGER       NOT NULL DEFAULT 0 CHECK (counts_quotations >= 0),
  counts_invoices       INTEGER       NOT NULL DEFAULT 0 CHECK (counts_invoices >= 0),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  archived_at           TIMESTAMPTZ   NULL
);
CREATE INDEX IF NOT EXISTS projects_user_created_idx
  ON projects (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS projects_user_status_idx
  ON projects (user_id, status);

CREATE TABLE IF NOT EXISTS project_calculations (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       TEXT          NOT NULL,
  calculator    TEXT          NOT NULL CHECK (calculator IN ('brick','concrete','paint','steel','tile')),
  label         TEXT          NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  description   TEXT          NULL     CHECK (description IS NULL OR char_length(description) <= 2000),
  group_name    TEXT          NULL     CHECK (group_name IS NULL OR char_length(group_name) <= 60),
  request       JSONB         NOT NULL,
  result        JSONB         NOT NULL,
  computed_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pcalc_project_created_idx
  ON project_calculations (project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS pcalc_user_idx ON project_calculations (user_id);

CREATE TABLE IF NOT EXISTS project_materials (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         TEXT          NOT NULL,
  type            TEXT          NOT NULL CHECK (type IN (
                    'cement','sand','aggregate','brick','steel','tile',
                    'paint','adhesive','grout','putty','labour','other')),
  brand           TEXT          NULL,
  unit            TEXT          NOT NULL,
  unit_price      NUMERIC(14,2) NOT NULL CHECK (unit_price > 0),
  quantity        NUMERIC(14,3) NULL CHECK (quantity IS NULL OR quantity >= 0),
  currency        CHAR(3)       NOT NULL,
  vendor          TEXT          NULL,
  notes           TEXT          NULL,
  effective_from  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pmat_project_created_idx
  ON project_materials (project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS pmat_user_idx ON project_materials (user_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  user_id         TEXT          NOT NULL,
  key             TEXT          NOT NULL,
  resource_kind   TEXT          NOT NULL,
  resource_id     UUID          NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);
CREATE INDEX IF NOT EXISTS idem_created_idx ON idempotency_keys (created_at);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'counts_boqs'
  ) THEN
    ALTER TABLE projects ADD COLUMN counts_boqs INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE projects ADD CONSTRAINT projects_counts_boqs_check CHECK (counts_boqs >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS project_boqs (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id               TEXT          NOT NULL,
  name                  TEXT          NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  notes                 TEXT          NULL     CHECK (notes IS NULL OR char_length(notes) <= 2000),
  currency              CHAR(3)       NOT NULL,
  generated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ordering_json         JSONB         NULL,
  filters_json          JSONB         NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS boq_project_created_idx
  ON project_boqs (project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS boq_user_idx ON project_boqs (user_id);

CREATE TABLE IF NOT EXISTS boq_sections (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_id                UUID          NOT NULL REFERENCES project_boqs(id) ON DELETE CASCADE,
  group_name            TEXT          NULL,
  section_order         INTEGER       NOT NULL,
  section_subtotal      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (section_subtotal >= 0),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS boq_sec_boq_order_idx
  ON boq_sections (boq_id, section_order);

CREATE TABLE IF NOT EXISTS boq_lines (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_id                UUID          NOT NULL REFERENCES project_boqs(id) ON DELETE CASCADE,
  section_id            UUID          NOT NULL REFERENCES boq_sections(id) ON DELETE CASCADE,
  line_key              TEXT          NOT NULL,
  source_calculation_id UUID          NOT NULL,
  calculator            TEXT          NOT NULL,
  label                 TEXT          NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  description           TEXT          NULL     CHECK (description IS NULL OR char_length(description) <= 2000),
  line_subtotal         NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (line_subtotal >= 0),
  override_json         JSONB         NULL,
  line_order            INTEGER       NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS boq_line_boq_key_idx
  ON boq_lines (boq_id, line_key);
CREATE INDEX IF NOT EXISTS boq_line_calc_idx
  ON boq_lines (source_calculation_id);

CREATE TABLE IF NOT EXISTS boq_line_materials (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id               UUID          NOT NULL REFERENCES boq_lines(id) ON DELETE CASCADE,
  material_type         TEXT          NOT NULL,
  brand                 TEXT          NULL,
  quantity_value        NUMERIC(14,3) NOT NULL,
  quantity_unit         TEXT          NOT NULL,
  unit_price            NUMERIC(14,2) NULL,
  amount                NUMERIC(14,2) NULL,
  price_unknown         BOOLEAN       NOT NULL DEFAULT FALSE,
  line_order            INTEGER       NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS boq_mat_line_idx ON boq_line_materials (line_id);

CREATE TABLE IF NOT EXISTS boq_totals_cache (
  boq_id                UUID          PRIMARY KEY REFERENCES project_boqs(id) ON DELETE CASCADE,
  materials_subtotal    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (materials_subtotal >= 0),
  unknown_price_count   INTEGER       NOT NULL DEFAULT 0 CHECK (unknown_price_count >= 0),
  grand_total           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_quotations (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  boq_id                UUID          NULL REFERENCES project_boqs(id) ON DELETE SET NULL,
  user_id               TEXT          NOT NULL,
  quotation_number      TEXT          NOT NULL,
  name                  TEXT          NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  client_name           TEXT          NULL     CHECK (client_name IS NULL OR char_length(client_name) <= 200),
  client_email          TEXT          NULL,
  client_phone          TEXT          NULL,
  currency              CHAR(3)       NOT NULL,
  status                TEXT          NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  valid_until           DATE          NULL,
  materials_subtotal    NUMERIC(14,2) NOT NULL DEFAULT 0,
  markup_percentage     NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (markup_percentage >= 0),
  markup_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_percentage   NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_percentage        NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0),
  tax_amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes                 TEXT          NULL     CHECK (notes IS NULL OR char_length(notes) <= 2000),
  terms                 TEXT          NULL     CHECK (terms IS NULL OR char_length(terms) <= 5000),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  sent_at               TIMESTAMPTZ   NULL
);
CREATE INDEX IF NOT EXISTS quot_project_created_idx ON project_quotations (project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS quot_user_idx ON project_quotations (user_id);
CREATE INDEX IF NOT EXISTS quot_boq_idx ON project_quotations (boq_id);

CREATE TABLE IF NOT EXISTS quotation_sections (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id          UUID          NOT NULL REFERENCES project_quotations(id) ON DELETE CASCADE,
  group_name            TEXT          NULL,
  section_order         INTEGER       NOT NULL,
  section_subtotal      NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quot_sec_quot_order_idx ON quotation_sections (quotation_id, section_order);

CREATE TABLE IF NOT EXISTS quotation_lines (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id          UUID          NOT NULL REFERENCES project_quotations(id) ON DELETE CASCADE,
  section_id            UUID          NOT NULL REFERENCES quotation_sections(id) ON DELETE CASCADE,
  label                 TEXT          NOT NULL,
  description           TEXT          NULL,
  quantity              TEXT          NOT NULL DEFAULT '1',
  unit                  TEXT          NULL,
  unit_rate             NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount                NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_order            INTEGER       NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quot_line_section_idx ON quotation_lines (section_id, line_order);

CREATE TABLE IF NOT EXISTS project_invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quotation_id      UUID NULL,
  user_id           TEXT NOT NULL,
  invoice_number    TEXT NOT NULL,
  name              TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  client_name       TEXT NULL,
  client_email      TEXT NULL,
  client_phone      TEXT NULL,
  currency          CHAR(3) NOT NULL,
  amount_due        NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  due_date          DATE NULL,
  status            TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid')),
  payment_notes     TEXT NULL CHECK (payment_notes IS NULL OR char_length(payment_notes) <= 2000),
  notes             TEXT NULL CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at           TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS inv_project_created_idx ON project_invoices (project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS inv_user_idx ON project_invoices (user_id);
CREATE INDEX IF NOT EXISTS inv_quotation_idx ON project_invoices (quotation_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('boq','quotation','invoice')),
  entity_id     UUID NOT NULL,
  action        TEXT NOT NULL CHECK (action IN ('created','updated','deleted','status_changed','payment_recorded','regenerated')),
  summary       TEXT NOT NULL,
  changes_json  JSONB NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_project_created_idx ON audit_log (project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_log (entity_type, entity_id);
`;

let ensured: Promise<void> | undefined;

export function ensureProjectsSchema(): Promise<void> {
  if (!ensured) {
    ensured = getDb()
      .query(DDL)
      .then(() => undefined)
      .catch((err) => {
        ensured = undefined;
        throw err;
      });
  }
  return ensured;
}
