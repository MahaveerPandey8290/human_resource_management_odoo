# 🏢 Dayflow — Human Resource Management System (HRMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)

A modern, full-stack Human Resource Management System designed to handle multi-tenant company onboarding, employee lifecycle, real-time attendance tracking, automated salary breakdowns, and 12-month interactive time-off calendars.

---

## 📸 Key Modules & Features

### 1. 🏢 Multi-Tenant Company Onboarding & System-Generated Login IDs
- **Automated Login ID Formula**: Automatically formats credentials upon registration:
  $$\text{Login ID} = [\text{Company Code}] + [\text{First 2 of First Name}] + [\text{First 2 of Last Name}] + [\text{Year}] + [\text{4-digit Serial}]$$
  *Example*: `Odoo India` + `John Doe` + `2026` $\rightarrow$ **`OIJODO20260001`**.
- Instant 1-click credential copy screen with password generation and direct login redirection.

### 2. 👥 Employee Management & Smart Presence Badges
- **Card Status Dot Indicators**:
  - 🟢 **Green dot**: Employee is active / present in the office (`present`).
  - ✈️ **Airplane badge**: Employee is on approved leave (`on_leave` / `leave`).
  - 🟡 **Yellow dot**: Employee is absent or hasn't checked in (`absent`).
- **Profile Modes**:
  - Employee cards in the directory open in **View-only** mode.
  - Logged-in user's profile dropdown opens in **Full Editable** mode.
  - Comprehensive tabs: `Resume`, `Private Info` (Personal & Bank Details), `Salary Info` *(Admin-only)*, `Security` (Password change).

### 3. ⏱️ Attendance & Working Hours Tracking
- **Real-Time Systray Widget**: 1-click Check-in and Check-out directly from the top navigation bar.
- **Automated Calculation**: Work minutes computed automatically with break time deductions and overtime/extra hours tracking (above 8 hours).
- **Dual Perspectives**:
  - **Employee View**: Month selector with summary statistics (**Count of days present**, **Leaves count**, **Total working days**) and day-wise attendance table.
  - **Admin & HR View**: Searchable roster with `Day` / `Month` views to monitor attendance across all company staff.

### 4. 💰 Salary Structure & Automated Calculations
- **Access Control**: Salary tab is strictly restricted to **Admins**.
- **Automated Mathematical Decomposition**:
  | Component | Percentage Rate | ₹ Amount (₹50,000 Wage) | Description |
  |---|:---:|:---:|---|
  | **Basic Salary** | $50.00\%$ | ₹25,000.00 | Computed as 50% of monthly wage |
  | **House Rent Allowance (HRA)** | $50.00\%$ of Basic | ₹12,500.00 | 50% of basic salary |
  | **Standard Allowance** | $16.67\%$ of Basic | ₹4,167.00 | Predetermined fixed allowance |
  | **Performance Bonus** | $8.33\%$ of Basic | ₹2,082.50 | Variable component calculated on basic |
  | **Leave Travel Allowance (LTA)** | $8.33\%$ of Basic | ₹2,082.50 | Travel expense allowance on basic |
  | **Fixed Allowance** | Remainder | ₹2,918.00 | Absorbs remaining balance to match monthly wage |
  | **Total Monthly Earnings** | — | **₹50,000.00** | **Exact match with Monthly Wage** ✓ |
- **Deductions & Contributions**:
  - **Provident Fund (Employee & Employer)**: $12.00\%$ of Basic Salary (₹3,000.00 each).
  - **Professional Tax**: Flat ₹200.00/month deducted from gross.
  - Configurable weekly working days (e.g. 5 days) and daily break hours (e.g. 1 hr).

### 5. 🏖️ Time Off & 12-Month Year Calendar
- **Interactive 12-Month Calendar Grid**: Full year overview (January to December) displaying dates with week numbers.
- **Visual Status Markers**:
  - 🟣 **Validated**: Solid purple pill for approved leaves.
  - 🟡 **To Approve**: Amber pill for pending requests.
  - 🔴 **Refused**: Red pill with strikethrough for rejected leaves.
  - 🟢 **Public Holidays**: Emerald highlight for gazetted company holidays.
- **1-Click Admin Approvals**: Quick 🟢 **Approve** and 🔴 **Reject** action buttons.
- **Sick Leave Medical Certificate**: Supports uploading PDF/Image attachments for sick leave verification with admin preview links.
- **Annual Public Holidays**: Preloaded holiday calendar (Republic Day, Kite Festival, Diwali, etc.).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons & Animations**: [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Date Handling**: [date-fns](https://date-fns.org/)

### Backend
- **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (`pg` connection pooling)
- **Validation**: [Zod](https://zod.dev/) schema validation
- **Authentication**: JWT (JSON Web Tokens) + `bcrypt` password hashing
- **File Uploads**: `Multer` with mime-type filtering for medical certificates and avatars

---

## 📂 Project Architecture

```
human_resource_management_odoo/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment variables & PostgreSQL database pool
│   │   ├── core/            # BaseController, BaseService, BaseRepository, Error classes
│   │   ├── db/              # schema.sql, reset.js, setup.js, seed.js
│   │   ├── middleware/      # Auth, role-based authorization, rate limiting, Multer upload
│   │   ├── modules/
│   │   │   ├── auth/        # Login, registration, Login ID sequence generator
│   │   │   ├── employees/   # Profile, skills, department assignment, role management
│   │   │   ├── attendance/  # Check-in, check-out, working hours, daily/monthly rosters
│   │   │   ├── salary/      # Salary structure upsert, live calculator, payslips
│   │   │   ├── leaves/      # Allocations, 12-month calendar, approve/reject, attachments
│   │   │   └── company/     # Departments, public holidays
│   │   ├── utils/           # SalaryCalculator, AttendanceCalculator, DateUtils, Cache
│   │   ├── app.js           # Express app setup and route mounting
│   │   ├── container.js     # Dependency injection container
│   │   └── server.js        # HTTP server entry point
│   ├── uploads/             # Stored avatars and sick leave certificates
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI primitives: Table, Modal, Badge, Avatar, StatusDot, etc.
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── lib/             # Fetch API wrapper with auto-token injection
│   │   ├── pages/           # LandingPage, SignUpPage, SignInPage, EmployeesPage,
│   │   │                    # ProfilePage, AttendancePage, TimeOffPage
│   │   ├── services/        # Frontend API services (auth, employee, attendance, salary, leave)
│   │   ├── App.jsx          # Route declarations & role guards
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14 or higher
- **npm** or **yarn**

---

### 1. Database Setup

1. Create a PostgreSQL database (e.g., `dayflow`):
   ```sql
   CREATE DATABASE dayflow;
   ```
2. Configure your credentials in `backend/.env`.

---

### 2. Backend Installation & Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables in `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   CORS_ORIGIN=http://localhost:5173

   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=dayflow

   JWT_SECRET=super_secret_jwt_key_replace_in_production
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10

   UPLOAD_DIR=./uploads
   MAX_AVATAR_SIZE_MB=5
   MAX_ATTACHMENT_SIZE_MB=10
   ```

3. Initialize the database schema:
   ```bash
   node src/db/setup.js
   ```

4. Start the backend server:
   ```bash
   npm run dev
   # Server starts at http://localhost:5000
   ```

---

### 3. Frontend Installation & Run

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   # App runs at http://localhost:5173
   ```

---

## 📡 Key API Endpoints

| Module | Method | Endpoint | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register-company` | Registers company & generates Admin Login ID | Public |
| **Auth** | `POST` | `/api/auth/login` | Authenticates with Login ID/Email & Password | Public |
| **Employees** | `GET` | `/api/employees` | List employees with live status dots | Authenticated |
| **Employees** | `POST` | `/api/employees` | Create employee & auto-generate Login ID | Admin / HR |
| **Attendance** | `GET` | `/api/attendance/status` | Today's check-in state for widget | Authenticated |
| **Attendance** | `POST` | `/api/attendance/check-in` | Record daily check-in | Authenticated |
| **Attendance** | `POST` | `/api/attendance/check-out` | Record daily check-out & compute hours | Authenticated |
| **Attendance** | `GET` | `/api/attendance/roster` | Admin daily attendance roster | Admin / HR |
| **Salary** | `GET` | `/api/employees/:id/salary` | Get full salary structure breakdown | Admin Only |
| **Salary** | `PUT` | `/api/employees/:id/salary` | Update wage & working schedule | Admin Only |
| **Time Off** | `GET` | `/api/leaves/allocations/me` | Current year leave balance | Authenticated |
| **Time Off** | `GET` | `/api/leaves/calendar` | 12-month calendar leave ranges | Authenticated |
| **Time Off** | `POST` | `/api/leaves` | Submit request with certificate upload | Authenticated |
| **Time Off** | `PATCH`| `/api/leaves/:id/status` | Approve / reject leave request | Admin / HR |

---

## 🔒 Security & Best Practices

- **Transactional Consistency**: All multi-step updates (leave deductions, salary structure batch replacements, company initialization) execute inside atomic database transactions (`withTransaction`).
- **Data Protection**: Zero raw string SQL concatenation — all queries use parameterized placeholders (`$1, $2, ...`) for SQL injection immunity.
- **Role Guards**: Strict backend middleware (`authenticate`, `authorize(UserRole.ADMIN)`) preventing unauthorized data access or salary viewing.
- **Upload Sanitization**: Multer stores files with unique random hashes and restricts uploads to safe document and image formats.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
