import bcrypt from "bcrypt";
import mysql from "mysql2/promise";
import { env } from "../config/env.js";
import { SalaryCalculator } from "../utils/SalaryCalculator.js";
import { DateUtils } from "../utils/DateUtils.js";

async function runSeed() {
  process.stdout.write("Starting database seeding...\n");

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
    dateStrings: true
  });

  try {
    const passwordHash = await bcrypt.hash("Password@123", env.BCRYPT_ROUNDS);
    const currentYear = new Date().getFullYear();

    // 1. Company
    await connection.query(`
      INSERT INTO companies (id, name, code, logo_url, phone)
      VALUES (1, 'Odoo India', 'OI', '/uploads/company-logo.png', '+91 79 4050 0000')
      ON DUPLICATE KEY UPDATE name = VALUES(name), code = VALUES(code);
    `);

    // 2. Departments
    const departments = ["Engineering", "Human Resources", "Sales", "Finance"];
    for (let i = 0; i < departments.length; i++) {
      await connection.query(`
        INSERT INTO departments (id, company_id, name)
        VALUES (?, 1, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name);
      `, [i + 1, departments[i]]);
    }

    // 3. Leave Types
    const leaveTypes = [
      { id: 1, name: "Casual Leave", isPaid: 1, requiresAttachment: 0, defaultDays: 12.0 },
      { id: 2, name: "Sick Leave", isPaid: 1, requiresAttachment: 1, defaultDays: 10.0 },
      { id: 3, name: "Unpaid Leave", isPaid: 0, requiresAttachment: 0, defaultDays: 0.0 }
    ];
    for (const lt of leaveTypes) {
      await connection.query(`
        INSERT INTO leave_types (id, company_id, name, is_paid, requires_attachment, default_days)
        VALUES (?, 1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), is_paid = VALUES(is_paid), requires_attachment = VALUES(requires_attachment), default_days = VALUES(default_days);
      `, [lt.id, lt.name, lt.isPaid, lt.requiresAttachment, lt.defaultDays]);
    }

    // 4. Public Holidays
    const holidays = [
      { date: `${currentYear}-01-26`, name: "Republic Day" },
      { date: `${currentYear}-03-25`, name: "Holi" },
      { date: `${currentYear}-08-15`, name: "Independence Day" },
      { date: `${currentYear}-10-02`, name: "Gandhi Jayanti" },
      { date: `${currentYear}-11-01`, name: "Diwali" },
      { date: `${currentYear}-12-25`, name: "Christmas" }
    ];
    for (const h of holidays) {
      await connection.query(`
        INSERT INTO holidays (company_id, holiday_date, name)
        VALUES (1, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name);
      `, [h.date, h.name]);
    }

    // 5. Employees
    const employees = [
      {
        id: 1,
        loginId: "OIADSH20220001",
        email: "amit.sharma@odooindia.com",
        role: "admin",
        firstName: "Amit",
        lastName: "Sharma",
        phone: "+91 98765 43210",
        jobPosition: "Managing Director",
        departmentId: 1,
        managerId: null,
        doj: "2022-01-10",
        monthlyWage: 150000.0,
        gender: "Male",
        pan: "ABCDE1234F"
      },
      {
        id: 2,
        loginId: "OIPRSH20230001",
        email: "priya.sharma@odooindia.com",
        role: "hr",
        firstName: "Priya",
        lastName: "Sharma",
        phone: "+91 98765 43211",
        jobPosition: "HR Lead",
        departmentId: 2,
        managerId: 1,
        doj: "2023-03-01",
        monthlyWage: 90000.0,
        gender: "Female",
        pan: "ABCDE1235G"
      },
      {
        id: 3,
        loginId: "OIRAVE20230002",
        email: "rahul.verma@odooindia.com",
        role: "employee",
        firstName: "Rahul",
        lastName: "Verma",
        phone: "+91 98765 43212",
        jobPosition: "Senior Software Engineer",
        departmentId: 1,
        managerId: 1,
        doj: "2023-06-15",
        monthlyWage: 80000.0,
        gender: "Male",
        pan: "ABCDE1236H"
      },
      {
        id: 4,
        loginId: "OIANKA20240001",
        email: "ananya.kapoor@odooindia.com",
        role: "employee",
        firstName: "Ananya",
        lastName: "Kapoor",
        phone: "+91 98765 43213",
        jobPosition: "Software Engineer",
        departmentId: 1,
        managerId: 3,
        doj: "2024-01-15",
        monthlyWage: 60000.0,
        gender: "Female",
        pan: "ABCDE1237I"
      },
      {
        id: 5,
        loginId: "OIVIRA20240002",
        email: "vikram.rao@odooindia.com",
        role: "employee",
        firstName: "Vikram",
        lastName: "Rao",
        phone: "+91 98765 43214",
        jobPosition: "Sales Lead",
        departmentId: 3,
        managerId: 1,
        doj: "2024-02-01",
        monthlyWage: 75000.0,
        gender: "Male",
        pan: "ABCDE1238J"
      },
      {
        id: 6,
        loginId: "OINEGU20240003",
        email: "neha.gupta@odooindia.com",
        role: "employee",
        firstName: "Neha",
        lastName: "Gupta",
        phone: "+91 98765 43215",
        jobPosition: "Sales Executive",
        departmentId: 3,
        managerId: 5,
        doj: "2024-03-10",
        monthlyWage: 45000.0,
        gender: "Female",
        pan: "ABCDE1239K"
      },
      {
        id: 7,
        loginId: "OISYME20240004",
        email: "sameer.mehta@odooindia.com",
        role: "employee",
        firstName: "Sameer",
        lastName: "Mehta",
        phone: "+91 98765 43216",
        jobPosition: "Financial Analyst",
        departmentId: 4,
        managerId: 1,
        doj: "2024-04-01",
        monthlyWage: 55000.0,
        gender: "Male",
        pan: "ABCDE1240L"
      },
      {
        id: 8,
        loginId: "OIPODE20240005",
        email: "pooja.deshmukh@odooindia.com",
        role: "employee",
        firstName: "Pooja",
        lastName: "Deshmukh",
        phone: "+91 98765 43217",
        jobPosition: "QA Engineer",
        departmentId: 1,
        managerId: 3,
        doj: "2024-05-15",
        monthlyWage: 50000.0,
        gender: "Female",
        pan: "ABCDE1241M"
      }
    ];

    for (const emp of employees) {
      await connection.query(`
        INSERT INTO employees (
          id, company_id, login_id, work_email, password_hash, must_change_password,
          role, first_name, last_name, phone, job_position, department_id,
          manager_id, date_of_joining, emp_code, gender, nationality, pan, status
        ) VALUES (?, 1, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Indian', ?, 'active')
        ON DUPLICATE KEY UPDATE
          role = VALUES(role), first_name = VALUES(first_name), last_name = VALUES(last_name),
          department_id = VALUES(department_id), manager_id = VALUES(manager_id),
          job_position = VALUES(job_position), status = 'active';
      `, [
        emp.id, emp.loginId, emp.email, passwordHash, emp.role, emp.firstName,
        emp.lastName, emp.phone, emp.jobPosition, emp.departmentId, emp.managerId,
        emp.doj, `EMP${String(emp.id).padStart(3, "0")}`, emp.gender, emp.pan
      ]);

      // Seed Skills
      await connection.query(`DELETE FROM employee_skills WHERE employee_id = ?`, [emp.id]);
      await connection.query(`
        INSERT INTO employee_skills (employee_id, name, kind)
        VALUES (?, 'Problem Solving', 'skill'), (?, 'Certified Professional', 'certification');
      `, [emp.id, emp.id]);

      // Seed Salary Structure & Components
      await connection.query(`
        INSERT INTO salary_structures (employee_id, wage_type, monthly_wage, working_days_per_week, break_minutes, effective_from)
        VALUES (?, 'fixed', ?, 5, 60, ?)
        ON DUPLICATE KEY UPDATE monthly_wage = VALUES(monthly_wage), effective_from = VALUES(effective_from);
      `, [emp.id, emp.monthlyWage, emp.doj]);

      const [structRows] = await connection.query(`SELECT id FROM salary_structures WHERE employee_id = ?`, [emp.id]);
      const structId = structRows[0].id;
      await connection.query(`DELETE FROM salary_components WHERE salary_structure_id = ?`, [structId]);

      const components = SalaryCalculator.computeBreakdown(emp.monthlyWage);
      for (const comp of components) {
        await connection.query(`
          INSERT INTO salary_components (salary_structure_id, name, category, computation_type, rate, amount, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `, [structId, comp.name, comp.category, comp.computationType, comp.rate, comp.amount, comp.sortOrder]);
      }

      // Seed Leave Allocations
      for (const lt of leaveTypes) {
        await connection.query(`
          INSERT INTO leave_allocations (employee_id, leave_type_id, year, allocated_days, used_days)
          VALUES (?, ?, ?, ?, 0.0)
          ON DUPLICATE KEY UPDATE allocated_days = VALUES(allocated_days);
        `, [emp.id, lt.id, currentYear, lt.defaultDays]);
      }
    }

    // 6. Update Sequence Table
    await connection.query(`
      INSERT INTO login_id_sequences (company_id, join_year, last_serial)
      VALUES (1, 2022, 1), (1, 2023, 2), (1, 2024, 5)
      ON DUPLICATE KEY UPDATE last_serial = VALUES(last_serial);
    `);

    // 7. Seed Leave Requests
    await connection.query(`DELETE FROM leave_requests WHERE employee_id IN (1,2,3,4,5,6,7,8)`);
    // 1 approved request (Rahul Verma, Casual Leave, 2 days)
    const approvedStart = `${currentYear}-07-10`;
    const approvedEnd = `${currentYear}-07-11`;
    await connection.query(`
      INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, reason, status, reviewed_by, review_comment, reviewed_at)
      VALUES (1, 3, 1, ?, ?, 2.0, 'Family function', 'approved', 1, 'Approved enjoy', NOW());
    `, [approvedStart, approvedEnd]);
    await connection.query(`UPDATE leave_allocations SET used_days = 2.0 WHERE employee_id = 3 AND leave_type_id = 1 AND year = ?`, [currentYear]);

    // 2 pending requests
    await connection.query(`
      INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, reason, status)
      VALUES 
        (2, 4, 1, '${currentYear}-09-02', '${currentYear}-09-03', 2.0, 'Personal work', 'pending'),
        (3, 5, 2, '${currentYear}-09-10', '${currentYear}-09-10', 1.0, 'Doctor appointment', 'pending');
    `);

    // 1 rejected request
    await connection.query(`
      INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days, reason, status, reviewed_by, review_comment, reviewed_at)
      VALUES (4, 6, 1, '${currentYear}-06-01', '${currentYear}-06-05', 5.0, 'Vacation', 'rejected', 2, 'Critical project milestone', NOW());
    `);

    // 8. Seed Attendance for last 10 working days
    await connection.query(`DELETE FROM attendance WHERE employee_id IN (1,2,3,4,5,6,7,8)`);

    const pastWorkingDates = [];
    let curDate = new Date();
    while (pastWorkingDates.length < 10) {
      curDate.setDate(curDate.getDate() - 1);
      const isWknd = DateUtils.isWeekend(curDate, 5);
      const dateStr = DateUtils.toDateString(curDate);
      const isHoliday = holidays.some((h) => h.date === dateStr);
      if (!isWknd && !isHoliday) {
        pastWorkingDates.unshift(dateStr);
      }
    }

    for (let d = 0; d < pastWorkingDates.length; d++) {
      const workDate = pastWorkingDates[d];
      for (const emp of employees) {
        // Special cases for demo:
        // Employee 4 had one half_day on index 3
        // Employee 6 was absent on index 5
        let status = "present";
        let checkIn = `${workDate} 09:30:00`;
        let checkOut = `${workDate} 18:30:00`;
        let workMins = 540;
        let extraMins = 60;

        if (emp.id === 4 && d === 3) {
          status = "half_day";
          checkIn = `${workDate} 09:30:00`;
          checkOut = `${workDate} 13:30:00`;
          workMins = 240;
          extraMins = 0;
        } else if (emp.id === 6 && d === 5) {
          status = "absent";
          checkIn = null;
          checkOut = null;
          workMins = 0;
          extraMins = 0;
        }

        await connection.query(`
          INSERT INTO attendance (employee_id, work_date, check_in, check_out, work_minutes, extra_minutes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), check_out = VALUES(check_out), status = VALUES(status);
        `, [emp.id, workDate, checkIn, checkOut, workMins, extraMins, status]);
      }
    }

    process.stdout.write("\n========================================================\n");
    process.stdout.write("  Database Seed Complete - Demo Credentials:\n");
    process.stdout.write("========================================================\n");
    process.stdout.write("All Accounts Password: Password@123\n\n");
    process.stdout.write("Admin:    OIADSH20220001 | amit.sharma@odooindia.com\n");
    process.stdout.write("HR:       OIPRSH20230001 | priya.sharma@odooindia.com\n");
    process.stdout.write("Employee: OIRAVE20230002 | rahul.verma@odooindia.com\n");
    process.stdout.write("Employee: OIANKA20240001 | ananya.kapoor@odooindia.com\n");
    process.stdout.write("Employee: OIVIRA20240002 | vikram.rao@odooindia.com\n");
    process.stdout.write("Employee: OINEGU20240003 | neha.gupta@odooindia.com\n");
    process.stdout.write("Employee: OISYME20240004 | sameer.mehta@odooindia.com\n");
    process.stdout.write("Employee: OIPODE20240005 | pooja.deshmukh@odooindia.com\n");
    process.stdout.write("========================================================\n\n");

  } catch (err) {
    process.stderr.write(`Database seed failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSeed();
