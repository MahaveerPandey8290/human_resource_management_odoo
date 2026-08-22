-- ============================================================
--  Dayflow HRMS — PostgreSQL Schema
--  Exact same structure as the MySQL version, translated for PG.
--
--  Run via:  npm run db:setup
--  Or manually:
--    PGPASSWORD=maha8290 psql -U postgres -d dayflow -f src/db/schema.sql
-- ============================================================

-- Drop everything cleanly so re-running this is always safe
DROP TABLE IF EXISTS audit_logs          CASCADE;
DROP TABLE IF EXISTS holidays            CASCADE;
DROP TABLE IF EXISTS leave_requests      CASCADE;
DROP TABLE IF EXISTS leave_allocations   CASCADE;
DROP TABLE IF EXISTS leave_types         CASCADE;
DROP TABLE IF EXISTS attendance          CASCADE;
DROP TABLE IF EXISTS salary_components   CASCADE;
DROP TABLE IF EXISTS salary_structures   CASCADE;
DROP TABLE IF EXISTS employee_skills     CASCADE;
DROP TABLE IF EXISTS employees           CASCADE;
DROP TABLE IF EXISTS login_id_sequences  CASCADE;
DROP TABLE IF EXISTS departments         CASCADE;
DROP TABLE IF EXISTS companies           CASCADE;

DROP TYPE IF EXISTS employee_role        CASCADE;
DROP TYPE IF EXISTS employee_status      CASCADE;
DROP TYPE IF EXISTS attendance_status    CASCADE;
DROP TYPE IF EXISTS leave_status         CASCADE;
DROP TYPE IF EXISTS salary_category      CASCADE;
DROP TYPE IF EXISTS computation_type     CASCADE;
DROP TYPE IF EXISTS skill_kind           CASCADE;
DROP TYPE IF EXISTS wage_type_enum       CASCADE;
DROP TYPE IF EXISTS gender_enum          CASCADE;
DROP TYPE IF EXISTS marital_enum         CASCADE;

-- ============================================================
--  Custom ENUM types  (PostgreSQL needs these declared up-front)
-- ============================================================
CREATE TYPE employee_role       AS ENUM ('admin', 'hr', 'employee');
CREATE TYPE employee_status     AS ENUM ('active', 'inactive');
CREATE TYPE attendance_status   AS ENUM ('present', 'absent', 'half_day', 'leave');
CREATE TYPE leave_status        AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE salary_category     AS ENUM ('earning', 'employer_contribution', 'deduction');
CREATE TYPE computation_type    AS ENUM ('percent_of_wage', 'percent_of_basic', 'fixed', 'remainder');
CREATE TYPE skill_kind          AS ENUM ('skill', 'certification');
CREATE TYPE wage_type_enum      AS ENUM ('fixed');
CREATE TYPE gender_enum         AS ENUM ('male', 'female', 'other');
CREATE TYPE marital_enum        AS ENUM ('single', 'married', 'other');


-- ============================================================
--  1. Company  &  Departments
-- ============================================================

-- Every piece of data in this system belongs to exactly one company.
-- The "code" column is two uppercase letters derived from the company name
-- (e.g. "Odoo India" ? "OI") and is prepended to every Login ID.
CREATE TABLE companies (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  code       CHAR(2)      NOT NULL,
  logo_url   VARCHAR(255),
  phone      VARCHAR(20),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Departments belong to a single company.
-- The unique constraint ensures no two departments in the same company
-- share the same name (case-sensitive).
CREATE TABLE departments (
  id         SERIAL PRIMARY KEY,
  company_id INT          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

-- ============================================================
--  2. Login ID Generation  (concurrency-safe counter)
-- ============================================================

-- This table is the single source of truth for the next available serial
-- number per company per joining year.  Two concurrent inserts for the
-- same company+year use SELECT … FOR UPDATE so they can never produce
-- the same Login ID.
CREATE TABLE login_id_sequences (
  company_id  INT      NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  join_year   SMALLINT NOT NULL,
  last_serial INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, join_year)
);

-- ============================================================
--  3. Employees  (the main people table)
-- ============================================================

CREATE TABLE employees (
  id                   SERIAL PRIMARY KEY,
  company_id           INT             NOT NULL REFERENCES companies(id)   ON DELETE CASCADE,
  login_id             VARCHAR(30)     NOT NULL UNIQUE,          -- e.g. OIJODO20220001
  work_email           VARCHAR(150)    NOT NULL UNIQUE,
  password_hash        VARCHAR(255)    NOT NULL,
  must_change_password BOOLEAN         NOT NULL DEFAULT TRUE,    -- forces password reset on first login
  role                 employee_role   NOT NULL DEFAULT 'employee',

  -- Basic info
  first_name           VARCHAR(60)     NOT NULL,
  last_name            VARCHAR(60)     NOT NULL,
  phone                VARCHAR(20),
  avatar_url           VARCHAR(255),

  -- Job details
  job_position         VARCHAR(100),
  department_id        INT REFERENCES departments(id) ON DELETE SET NULL,
  manager_id           INT REFERENCES employees(id)   ON DELETE SET NULL,  -- self-referencing
  work_location        VARCHAR(100),
  date_of_joining      DATE,
  emp_code             VARCHAR(30),

  -- Private info tab (visible only to the employee and admin)
  dob                  DATE,
  gender               gender_enum,
  marital_status       marital_enum,
  nationality          VARCHAR(60),
  personal_email       VARCHAR(150),
  address              TEXT,
  bank_name            VARCHAR(100),
  account_number       VARCHAR(30),
  ifsc                 VARCHAR(15),
  pan                  VARCHAR(15),
  uan                  VARCHAR(20),

  -- Resume / about section
  about                TEXT,
  job_love             TEXT,
  interests            TEXT,

  status               employee_status NOT NULL DEFAULT 'active',
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Speed up the most common list queries
CREATE INDEX idx_employees_company_status ON employees (company_id, status);
CREATE INDEX idx_employees_manager        ON employees (manager_id);
CREATE INDEX idx_employees_department     ON employees (department_id);

-- ============================================================
--  4. Employee Skills & Certifications  (Resume tab)
-- ============================================================

CREATE TABLE employee_skills (
  id          SERIAL PRIMARY KEY,
  employee_id INT         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name        VARCHAR(80) NOT NULL,
  kind        skill_kind  NOT NULL DEFAULT 'skill'
);

CREATE INDEX idx_skills_employee ON employee_skills (employee_id);

-- ============================================================
--  5. Salary Structure & Components  (Admin-only)
-- ============================================================

-- One row per employee.  The monthly_wage is the master number;
-- all components below are derived from it and recomputed whenever
-- the wage changes.
CREATE TABLE salary_structures (
  id                    SERIAL PRIMARY KEY,
  employee_id           INT            NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  wage_type             wage_type_enum NOT NULL DEFAULT 'fixed',
  monthly_wage          NUMERIC(12,2)  NOT NULL,
  working_days_per_week SMALLINT       NOT NULL DEFAULT 5,
  break_minutes         INT            NOT NULL DEFAULT 60,
  effective_from        DATE,
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Components are deleted and re-inserted as a batch every time the wage changes.
-- This makes the history irrelevant (no append-only ledger needed at this stage).
CREATE TABLE salary_components (
  id                  SERIAL PRIMARY KEY,
  salary_structure_id INT              NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  name                VARCHAR(60)      NOT NULL,
  category            salary_category  NOT NULL DEFAULT 'earning',
  computation_type    computation_type NOT NULL,
  rate                NUMERIC(6,2)     NOT NULL DEFAULT 0,   -- percentage, e.g. 12.00 means 12 %
  amount              NUMERIC(12,2)    NOT NULL DEFAULT 0,   -- computed rupee value
  sort_order          SMALLINT         NOT NULL DEFAULT 0
);

CREATE INDEX idx_salary_components ON salary_components (salary_structure_id, sort_order);

-- ============================================================
--  6. Attendance
-- ============================================================

-- One row per employee per calendar day.
-- The UNIQUE constraint on (employee_id, work_date) means a second
-- check-in attempt on the same day is caught at the database level too.
CREATE TABLE attendance (
  id            SERIAL PRIMARY KEY,
  employee_id   INT               NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date     DATE              NOT NULL,
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  work_minutes  INT               NOT NULL DEFAULT 0,
  extra_minutes INT               NOT NULL DEFAULT 0,
  status        attendance_status NOT NULL DEFAULT 'present',
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, work_date)
);

CREATE INDEX idx_attendance_work_date ON attendance (work_date);

-- ============================================================
--  7. Time Off  (Leave Types / Allocations / Requests)
-- ============================================================

-- Leave types are configured per company.
CREATE TABLE leave_types (
  id                  SERIAL PRIMARY KEY,
  company_id          INT           NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                VARCHAR(60)   NOT NULL,
  is_paid             BOOLEAN       NOT NULL DEFAULT TRUE,
  requires_attachment BOOLEAN       NOT NULL DEFAULT FALSE,
  default_days        NUMERIC(5,1)  NOT NULL DEFAULT 0,
  UNIQUE (company_id, name)
);

-- Yearly bucket of leave days per employee per leave type.
CREATE TABLE leave_allocations (
  id             SERIAL PRIMARY KEY,
  employee_id    INT          NOT NULL REFERENCES employees(id)   ON DELETE CASCADE,
  leave_type_id  INT          NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year           SMALLINT     NOT NULL,
  allocated_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days      NUMERIC(5,1) NOT NULL DEFAULT 0,
  UNIQUE (employee_id, leave_type_id, year)
);

-- A single leave request raised by an employee.
CREATE TABLE leave_requests (
  id             SERIAL PRIMARY KEY,
  employee_id    INT          NOT NULL REFERENCES employees(id)   ON DELETE CASCADE,
  leave_type_id  INT          NOT NULL REFERENCES leave_types(id),
  start_date     DATE         NOT NULL,
  end_date       DATE         NOT NULL,
  days           NUMERIC(4,1) NOT NULL,
  reason         TEXT,
  attachment_url VARCHAR(255),
  status         leave_status NOT NULL DEFAULT 'pending',
  reviewed_by    INT REFERENCES employees(id) ON DELETE SET NULL,
  review_comment VARCHAR(255),
  reviewed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_status     ON leave_requests (status);
CREATE INDEX idx_leave_requests_emp_date   ON leave_requests (employee_id, start_date);

-- ============================================================
--  8. Holidays  (company calendar)
-- ============================================================

CREATE TABLE holidays (
  id           SERIAL PRIMARY KEY,
  company_id   INT         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  holiday_date DATE        NOT NULL,
  name         VARCHAR(100) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, holiday_date)
);

-- ============================================================
--  9. Audit Logs  (who did what)
-- ============================================================

CREATE TABLE audit_logs (
  id                SERIAL PRIMARY KEY,
  actor_employee_id INT,
  action            VARCHAR(100) NOT NULL,
  entity            VARCHAR(100) NOT NULL,
  entity_id         INT,
  meta              JSONB,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs (entity, entity_id);

-- ============================================================
--  Trigger: keep updated_at fresh on employees without app code
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_salary_structures_updated_at
  BEFORE UPDATE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
