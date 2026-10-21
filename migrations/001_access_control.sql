CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL CHECK (username = lower(username)),
  email text UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (username)
);
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE
);
CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id),
  permission_id uuid NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE user_company_roles (
  user_id uuid NOT NULL REFERENCES users(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  role_id uuid NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, company_id, role_id)
);
CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_company_id uuid NOT NULL REFERENCES companies(id),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE user_warehouse_access (
  user_id uuid NOT NULL REFERENCES users(id),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  PRIMARY KEY (user_id, warehouse_id)
);
CREATE INDEX user_company_roles_company_idx ON user_company_roles(company_id);
CREATE INDEX user_company_roles_role_idx ON user_company_roles(role_id);
CREATE INDEX warehouses_company_idx ON warehouses(operator_company_id);
CREATE INDEX user_warehouse_access_warehouse_idx ON user_warehouse_access(warehouse_id);
CREATE INDEX role_permissions_permission_idx ON role_permissions(permission_id);
-- connect-pg-simple schema. Session IDs and content must never be logged.
CREATE TABLE sessions (
  sid varchar PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX sessions_expire_idx ON sessions(expire);
INSERT INTO companies (code, name) VALUES ('SJLM', 'SJLM'), ('GEKA', 'GEKA');
INSERT INTO roles (code, name) VALUES ('ADMIN', 'Administrator'), ('VIEWER', 'Viewer');
INSERT INTO permissions (code) VALUES ('dashboard.read'), ('warehouse.read');
INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id FROM roles CROSS JOIN permissions;
-- No user/password or warehouse data is seeded automatically.
