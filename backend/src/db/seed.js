/**
 * @fileoverview Demo seed script.
 *
 * Populates the `dayflow` database with realistic demo data so the frontend
 * never looks empty on first run.  This script is fully idempotent — run it
 * as many times as you like.  It deletes existing data in dependency order
 * and reinserts cleanly.
 *
 * Every seeded user can log in with the password:  Password@123
 *
 * Usage:
 *   npm run db:seed
 */

import pg     from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ── bcrypt hash of "Password@123" with 10 rounds ──────────────────────────────
// Pre-computed so the seed runs fast and doesn't need bcrypt as a dependency.
const PW_HASH = '$2b$10$6N0JsxShJDLITdCGF9lBMe8xBxs7ohU0cLp8R4NCYubReDPkwwvmq';

const client = new pg.Client({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'maha8290',
  database: process.env.DB_NAME     || 'dayflow',
  ssl: false,
});

async function seed() {
  await client.connect();
  console.log('🌱  Starting seed…');

  try {
    await client.query('BEGIN');

    // ── Wipe existing data in reverse dependency order ────────────────────────
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM leave_requests');
    await client.query('DELETE FROM leave_allocations');
    await client.query('DELETE FROM leave_types');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM salary_components');
    await client.query('DELETE FROM salary_structures');
    await client.query('DELETE FROM employee_skills');
    await client.query('DELETE FROM employees');
    await client.query('DELETE FROM login_id_sequences');
    await client.query('DELETE FROM departments');
    await client.query('DELETE FROM companies');
    await client.query('DELETE FROM holidays');

    // ── 1. Company ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO companies (id, name, code, phone)
      OVERRIDING SYSTEM VALUE
      VALUES (1, 'Odoo India', 'OI', '+91 9876500000')
    `);
    // Reset the sequence so the next auto-generated id continues from 2.
    await client.query(`SELECT setval('companies_id_seq', 1, true)`);
    console.log('  ✓ Company — Odoo India');

    // ── 2. Departments ─────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO departments (id, company_id, name) OVERRIDING SYSTEM VALUE VALUES
        (1, 1, 'Engineering'),
        (2, 1, 'Human Resources'),
        (3, 1, 'Sales'),
        (4, 1, 'Design')
    `);
    await client.query(`SELECT setval('departments_id_seq', 4, true)`);
    console.log('  ✓ Departments — Engineering, HR, Sales, Design');

    // ── 3. Login ID sequences ─────────────────────────────────────────────────
    await client.query(`
      INSERT INTO login_id_sequences (company_id, join_year, last_serial) VALUES
        (1, 2022, 2),
        (1, 2023, 2),
        (1, 2026, 1)
    `);

    // ── 4. Employees ──────────────────────────────────────────────────────────
    // Inserted in two batches because manager_id is a self-reference:
    // first insert the managers, then the reports.
    await client.query(`
      INSERT INTO employees (
        id, company_id, login_id, work_email, password_hash,
        must_change_password, role, first_name, last_name, phone,
        job_position, department_id, manager_id, work_location,
        date_of_joining, emp_code, dob, gender, marital_status,
        nationality, personal_email, address, bank_name,
        account_number, ifsc, pan, uan, about
      ) OVERRIDING SYSTEM VALUE VALUES
      -- Admin (no manager)
      (1, 1, 'OIADSH20220001', 'admin@odooindia.com', $1,
        false, 'admin', 'Aditya', 'Sharma', '+919876500001',
        'HR Director', 2, NULL, 'Bangalore',
        '2022-01-10', 'EMP001', '1990-04-12', 'male', 'married',
        'Indian', 'aditya.s@gmail.com', 'MG Road, Bangalore', 'HDFC Bank',
        '50100234567890', 'HDFC0001234', 'ABCPS1234K', '100200300400',
        'Leads people operations at Odoo India.'),

      -- Senior Engineer (reports to Admin)
      (2, 1, 'OIJODO20220002', 'john.doe@odooindia.com', $1,
        false, 'employee', 'John', 'Doe', '+919876500002',
        'Senior Software Engineer', 1, 1, 'Bangalore',
        '2022-03-01', 'EMP002', '1995-08-21', 'male', 'single',
        'Indian', 'john.doe@gmail.com', 'Indiranagar, Bangalore', 'ICICI Bank',
        '00112345678901', 'ICIC0000112', 'AAAPJ5678L', '100200300401',
        'Backend engineer who likes clean database design.'),

      -- HR Officer (reports to Admin)
      (3, 1, 'OIPRME20230001', 'priya.mehta@odooindia.com', $1,
        false, 'hr', 'Priya', 'Mehta', '+919876500003',
        'HR Officer', 2, 1, 'Pune',
        '2023-06-15', 'EMP003', '1996-11-05', 'female', 'single',
        'Indian', 'priya.m@gmail.com', 'Koregaon Park, Pune', 'SBI',
        '30012345678', 'SBIN0004321', 'BBBPM9012M', '100200300402',
        'Handles onboarding and time-off approvals.'),

      -- Frontend Engineer (reports to John)
      (4, 1, 'OIRAVE20230002', 'rahul.verma@odooindia.com', $1,
        false, 'employee', 'Rahul', 'Verma', '+919876500004',
        'Frontend Engineer', 1, 2, 'Bangalore',
        '2023-07-01', 'EMP004', '1998-02-18', 'male', 'single',
        'Indian', 'rahul.v@gmail.com', 'HSR Layout, Bangalore', 'Axis Bank',
        '91800012345', 'UTIB0000918', 'CCCPV3456N', '100200300403',
        'React developer, design systems enthusiast.'),

      -- Designer (reports to John, first-login password change required)
      (5, 1, 'OIAIKH20260001', 'aisha.khan@odooindia.com', $1,
        true, 'employee', 'Aisha', 'Khan', '+919876500005',
        'UI/UX Designer', 4, 2, 'Remote',
        '2026-01-05', 'EMP005', '1999-09-30', 'female', 'single',
        'Indian', 'aisha.k@gmail.com', 'Jaipur, Rajasthan', 'Kotak Bank',
        '40011223344', 'KKBK0000123', 'DDDPK7890P', '100200300404',
        'Designs the product experience end to end.')
    `, [PW_HASH]);

    await client.query(`SELECT setval('employees_id_seq', 5, true)`);
    console.log('  ✓ Employees — 1 Admin, 1 HR, 3 Employees');

    // ── 5. Skills ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO employee_skills (employee_id, name, kind) VALUES
        (2, 'Node.js',               'skill'),
        (2, 'MySQL',                 'skill'),
        (2, 'AWS Certified Developer','certification'),
        (4, 'React',                 'skill'),
        (4, 'Tailwind CSS',          'skill'),
        (5, 'Figma',                 'skill'),
        (5, 'User Research',         'skill')
    `);
    console.log('  ✓ Skills — 7 entries');

    // ── 6. Salary structures ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO salary_structures (id, employee_id, monthly_wage, working_days_per_week, break_minutes, effective_from)
      OVERRIDING SYSTEM VALUE VALUES
        (1, 2, 50000.00, 5, 60, '2022-03-01'),
        (2, 4, 35000.00, 5, 60, '2023-07-01'),
        (3, 5, 42000.00, 5, 45, '2026-01-05')
    `);
    await client.query(`SELECT setval('salary_structures_id_seq', 3, true)`);

    await client.query(`
      INSERT INTO salary_components (salary_structure_id, name, category, computation_type, rate, amount, sort_order) VALUES
        -- John Doe's salary breakdown (₹50 000/month)
        (1, 'Basic',                    'earning',               'percent_of_wage',  50.00, 25000.00, 1),
        (1, 'House Rent Allowance',     'earning',               'percent_of_basic', 50.00, 12500.00, 2),
        (1, 'Standard Allowance',       'earning',               'percent_of_basic', 16.67,  4167.50, 3),
        (1, 'Performance Bonus',        'earning',               'percent_of_basic',  8.33,  2082.50, 4),
        (1, 'Leave Travel Allowance',   'earning',               'percent_of_basic',  8.33,  2082.50, 5),
        (1, 'Fixed Allowance',          'earning',               'remainder',         0.00,  4167.50, 6),
        (1, 'Provident Fund (Employer)','employer_contribution', 'percent_of_basic', 12.00,  3000.00, 7),
        (1, 'Provident Fund (Employee)','deduction',             'percent_of_basic', 12.00,  3000.00, 8),
        (1, 'Professional Tax',         'deduction',             'fixed',             0.00,   200.00, 9)
    `);
    console.log('  ✓ Salary structures + components');

    // ── 7. Leave types ────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO leave_types (id, company_id, name, is_paid, requires_attachment, default_days)
      OVERRIDING SYSTEM VALUE VALUES
        (1, 1, 'Paid Time Off',  true,  false, 24),
        (2, 1, 'Sick Time Off',  true,  true,   7),
        (3, 1, 'Unpaid Leave',   false, false,  0)
    `);
    await client.query(`SELECT setval('leave_types_id_seq', 3, true)`);
    console.log('  ✓ Leave types — PTO, Sick, Unpaid');

    // ── 8. Leave allocations ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO leave_allocations (employee_id, leave_type_id, year, allocated_days, used_days) VALUES
        (2, 1, 2026, 24, 3), (2, 2, 2026, 7, 1), (2, 3, 2026, 0, 0),
        (4, 1, 2026, 24, 5), (4, 2, 2026, 7, 0), (4, 3, 2026, 0, 0),
        (5, 1, 2026, 24, 0), (5, 2, 2026, 7, 2), (5, 3, 2026, 0, 0),
        (3, 1, 2026, 24, 2), (3, 2, 2026, 7, 0), (3, 3, 2026, 0, 0)
    `);
    console.log('  ✓ Leave allocations — 12 entries');

    // ── 9. Attendance (last working week) ─────────────────────────────────────
    await client.query(`
      INSERT INTO attendance (employee_id, work_date, check_in, check_out, work_minutes, extra_minutes, status) VALUES
        -- John Doe
        (2,'2026-08-17','2026-08-17 10:00:00+05:30','2026-08-17 19:00:00+05:30', 540, 60,'present'),
        (2,'2026-08-18','2026-08-18 10:05:00+05:30','2026-08-18 18:45:00+05:30', 520, 40,'present'),
        (2,'2026-08-19','2026-08-19 09:55:00+05:30','2026-08-19 19:10:00+05:30', 555, 75,'present'),
        (2,'2026-08-20', NULL, NULL, 0, 0, 'leave'),
        (2,'2026-08-21','2026-08-21 10:15:00+05:30','2026-08-21 19:00:00+05:30', 525, 45,'present'),
        -- Rahul Verma
        (4,'2026-08-17','2026-08-17 09:50:00+05:30','2026-08-17 18:30:00+05:30', 520, 40,'present'),
        (4,'2026-08-18','2026-08-18 10:10:00+05:30','2026-08-18 14:00:00+05:30', 230,  0,'half_day'),
        (4,'2026-08-19','2026-08-19 10:00:00+05:30','2026-08-19 19:00:00+05:30', 540, 60,'present'),
        (4,'2026-08-20','2026-08-20 10:00:00+05:30','2026-08-20 18:50:00+05:30', 530, 50,'present'),
        (4,'2026-08-21', NULL, NULL, 0, 0,'absent'),
        -- Aisha Khan
        (5,'2026-08-19','2026-08-19 10:30:00+05:30','2026-08-19 19:30:00+05:30', 540, 60,'present'),
        (5,'2026-08-20','2026-08-20 10:20:00+05:30','2026-08-20 19:00:00+05:30', 520, 40,'present'),
        (5,'2026-08-21','2026-08-21 10:00:00+05:30','2026-08-21 19:00:00+05:30', 540, 60,'present')
    `);
    console.log('  ✓ Attendance — 13 records across last working week');

    // ── 10. Leave requests (one of each status for the demo) ──────────────────
    await client.query(`
      INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, days, reason, status, reviewed_by, review_comment, reviewed_at) VALUES
        (2, 1,'2026-08-20','2026-08-20', 1, 'Family function',             'approved', 1, 'Approved, enjoy!',                 '2026-08-18 11:00:00+05:30'),
        (4, 2,'2026-08-25','2026-08-26', 2, 'Fever, doctor advised rest',  'pending',  NULL, NULL,                             NULL),
        (5, 1,'2026-08-28','2026-08-29', 2, 'Short trip',                  'pending',  NULL, NULL,                             NULL),
        (4, 3,'2026-08-14','2026-08-14', 1, 'Personal work',               'rejected', 1, 'Team is at peak sprint load',     '2026-08-12 16:30:00+05:30')
    `);
    console.log('  ✓ Leave requests — approved / pending / pending / rejected');

    // ── 11. Holidays ──────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO holidays (company_id, holiday_date, name) VALUES
        (1, '2026-01-26', 'Republic Day'),
        (1, '2026-03-28', 'Holi'),
        (1, '2026-08-15', 'Independence Day'),
        (1, '2026-10-02', 'Gandhi Jayanti'),
        (1, '2026-10-20', 'Diwali'),
        (1, '2026-12-25', 'Christmas')
    `);
    console.log('  ✓ Holidays — 6 national / company holidays for 2026');

    await client.query('COMMIT');

    console.log('');
    console.log('🎉  Seed complete!  Login credentials for every account:');
    console.log('    Password:  Password@123');
    console.log('');
    console.log('    Login ID           Role       Name');
    console.log('    ─────────────────────────────────────────────');
    console.log('    OIADSH20220001     Admin      Aditya Sharma');
    console.log('    OIPRME20230001     HR         Priya Mehta');
    console.log('    OIJODO20220002     Employee   John Doe');
    console.log('    OIRAVE20230002     Employee   Rahul Verma');
    console.log('    OIAIKH20260001     Employee   Aisha Khan  (must change password on first login)');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
