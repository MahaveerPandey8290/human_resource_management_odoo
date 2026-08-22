-- Dayflow HRMS Database Schema
-- Idempotent, InnoDB, utf8mb4

CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code CHAR(2) NOT NULL,
    logo_url VARCHAR(500) NULL,
    phone VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_departments_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT uq_departments_company_name UNIQUE (company_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Concurrency-safe serial counter for generating Login IDs per company per joining year
CREATE TABLE IF NOT EXISTS login_id_sequences (
    company_id INT NOT NULL,
    join_year INT NOT NULL,
    last_serial INT NOT NULL DEFAULT 0,
    PRIMARY KEY (company_id, join_year),
    CONSTRAINT fk_login_seq_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    login_id VARCHAR(50) NOT NULL,
    work_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 1,
    role ENUM('admin', 'hr', 'employee') NOT NULL DEFAULT 'employee',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NULL,
    avatar_url VARCHAR(500) NULL,
    job_position VARCHAR(100) NULL,
    department_id INT NULL,
    manager_id INT NULL,
    work_location VARCHAR(100) DEFAULT 'On-site',
    date_of_joining DATE NOT NULL,
    emp_code VARCHAR(50) NULL,
    dob DATE NULL,
    gender VARCHAR(20) NULL,
    marital_status VARCHAR(20) NULL,
    nationality VARCHAR(50) DEFAULT 'Indian',
    personal_email VARCHAR(255) NULL,
    address TEXT NULL,
    bank_name VARCHAR(100) NULL,
    account_number VARCHAR(100) NULL,
    ifsc VARCHAR(50) NULL,
    pan VARCHAR(50) NULL,
    uan VARCHAR(50) NULL,
    about TEXT NULL,
    job_love TEXT NULL,
    interests TEXT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_employees_login_id UNIQUE (login_id),
    CONSTRAINT uq_employees_work_email UNIQUE (work_email),
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
    CONSTRAINT fk_employees_manager FOREIGN KEY (manager_id) REFERENCES employees (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fast lookup for company-scoped active employee listing
CREATE INDEX idx_employees_company_status ON employees (company_id, status);
-- Fast manager reporting tree lookups
CREATE INDEX idx_employees_manager ON employees (manager_id);
-- Fast department roster queries
CREATE INDEX idx_employees_department ON employees (department_id);

CREATE TABLE IF NOT EXISTS employee_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    kind ENUM('skill', 'certification') NOT NULL DEFAULT 'skill',
    CONSTRAINT fk_skills_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for retrieving an employee's resume skills
CREATE INDEX idx_skills_employee ON employee_skills (employee_id);

CREATE TABLE IF NOT EXISTS salary_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    wage_type ENUM('fixed') NOT NULL DEFAULT 'fixed',
    monthly_wage DECIMAL(12,2) NOT NULL,
    working_days_per_week INT NOT NULL DEFAULT 5,
    break_minutes INT NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_salary_employee UNIQUE (employee_id),
    CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS salary_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salary_structure_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category ENUM('earning', 'employer_contribution', 'deduction') NOT NULL,
    computation_type ENUM('percent_of_wage', 'percent_of_basic', 'fixed', 'remainder') NOT NULL,
    rate DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_components_structure FOREIGN KEY (salary_structure_id) REFERENCES salary_structures (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index to fetch salary breakdown components ordered by sort_order
CREATE INDEX idx_components_structure ON salary_components (salary_structure_id, sort_order);

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    work_date DATE NOT NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    work_minutes INT NOT NULL DEFAULT 0,
    extra_minutes INT NOT NULL DEFAULT 0,
    status ENUM('present', 'absent', 'half_day', 'leave') NOT NULL DEFAULT 'present',
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, work_date),
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fast index for daily attendance reporting and date range summaries
CREATE INDEX idx_attendance_date ON attendance (work_date);

CREATE TABLE IF NOT EXISTS leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_paid TINYINT(1) NOT NULL DEFAULT 1,
    requires_attachment TINYINT(1) NOT NULL DEFAULT 0,
    default_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leave_types_company_name UNIQUE (company_id, name),
    CONSTRAINT fk_leave_types_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    year INT NOT NULL,
    allocated_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    used_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    CONSTRAINT uq_allocations_employee_type_year UNIQUE (employee_id, leave_type_id, year),
    CONSTRAINT fk_allocations_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_allocations_type FOREIGN KEY (leave_type_id) REFERENCES leave_types (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days DECIMAL(4,1) NOT NULL,
    reason TEXT NULL,
    attachment_url VARCHAR(500) NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT NULL,
    review_comment TEXT NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_requests_type FOREIGN KEY (leave_type_id) REFERENCES leave_types (id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES employees (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fast index for filtering pending vs approved/rejected requests
CREATE INDEX idx_leave_requests_status ON leave_requests (status);
-- Fast index for employee calendar range overlap checks
CREATE INDEX idx_leave_requests_employee_dates ON leave_requests (employee_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    holiday_date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_holidays_company_date UNIQUE (company_id, holiday_date),
    CONSTRAINT fk_holidays_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_employee_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id INT NULL,
    meta JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fast index for entity audit trail inspection
CREATE INDEX idx_audit_entity ON audit_logs (entity, entity_id);
