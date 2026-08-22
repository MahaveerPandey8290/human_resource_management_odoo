/**
 * @file container.js
 * Central Dependency Injection container wiring all database connections,
 * repositories, services, controllers, and router factories.
 */

import { Logger } from "./core/Logger.js";
import { Database } from "./config/database.js";
import { Cache } from "./utils/Cache.js";

// Repositories
import { AuthRepository } from "./modules/auth/AuthRepository.js";
import { EmployeeRepository } from "./modules/employees/EmployeeRepository.js";
import { SkillRepository } from "./modules/employees/SkillRepository.js";
import { AttendanceRepository } from "./modules/attendance/AttendanceRepository.js";
import { LeaveRepository } from "./modules/leaves/LeaveRepository.js";
import { SalaryRepository } from "./modules/salary/SalaryRepository.js";
import { DepartmentRepository } from "./modules/company/DepartmentRepository.js";
import { HolidayRepository } from "./modules/company/HolidayRepository.js";

// Services
import { AuthService } from "./modules/auth/AuthService.js";
import { EmployeeService } from "./modules/employees/EmployeeService.js";
import { AttendanceService } from "./modules/attendance/AttendanceService.js";
import { LeaveService } from "./modules/leaves/LeaveService.js";
import { SalaryService } from "./modules/salary/SalaryService.js";
import { CompanyService } from "./modules/company/CompanyService.js";

// Controllers
import { AuthController } from "./modules/auth/AuthController.js";
import { EmployeeController } from "./modules/employees/EmployeeController.js";
import { AttendanceController } from "./modules/attendance/AttendanceController.js";
import { LeaveController } from "./modules/leaves/LeaveController.js";
import { SalaryController } from "./modules/salary/SalaryController.js";
import { CompanyController } from "./modules/company/CompanyController.js";

// Router factories
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createEmployeeRouter } from "./modules/employees/employee.routes.js";
import { createAttendanceRouter } from "./modules/attendance/attendance.routes.js";
import { createLeaveRouter } from "./modules/leaves/leave.routes.js";
import { createSalaryRouter } from "./modules/salary/salary.routes.js";
import { createCompanyRouters } from "./modules/company/company.routes.js";

// Middlewares
import { authRateLimiter } from "./middleware/rateLimiter.js";
import { authenticate } from "./middleware/authenticate.js";
import { requirePasswordChanged } from "./middleware/requirePasswordChanged.js";

/**
 * Builds and returns the DI container.
 * @returns {object}
 */
export function buildContainer() {
  const logger = new Logger();
  const db = new Database(logger);
  const cache = new Cache(60000);

  // Repositories
  const authRepo = new AuthRepository(db);
  const employeeRepo = new EmployeeRepository(db);
  const skillRepo = new SkillRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const leaveRepo = new LeaveRepository(db);
  const salaryRepo = new SalaryRepository(db);
  const deptRepo = new DepartmentRepository(db);
  const holidayRepo = new HolidayRepository(db);

  // Services
  const authService = new AuthService(db, logger, authRepo, employeeRepo);
  const employeeService = new EmployeeService(db, logger, employeeRepo, skillRepo, leaveRepo);
  const holidayService = new CompanyService(db, logger, deptRepo, holidayRepo, cache);
  const attendanceService = new AttendanceService(db, logger, attendanceRepo, leaveRepo, holidayRepo, salaryRepo);
  const leaveService = new LeaveService(db, logger, leaveRepo, attendanceRepo, holidayRepo, salaryRepo, cache);
  const salaryService = new SalaryService(db, logger, salaryRepo, employeeRepo, attendanceService);

  // Controllers
  const authController = new AuthController(authService);
  const employeeController = new EmployeeController(employeeService);
  const attendanceController = new AttendanceController(attendanceService);
  const leaveController = new LeaveController(leaveService);
  const salaryController = new SalaryController(salaryService);
  const companyController = new CompanyController(holidayService);

  // Routers
  const authRouter = createAuthRouter(authController, authRateLimiter, authenticate, requirePasswordChanged);
  const employeeRouter = createEmployeeRouter(employeeController);
  const attendanceRouter = createAttendanceRouter(attendanceController);
  const leaveRouter = createLeaveRouter(leaveController);
  const salaryRouter = createSalaryRouter(salaryController);
  const { departmentRouter, holidayRouter } = createCompanyRouters(companyController);

  return {
    logger,
    db,
    cache,
    authRouter,
    employeeRouter,
    attendanceRouter,
    leaveRouter,
    salaryRouter,
    departmentRouter,
    holidayRouter,
    services: {
      authService,
      employeeService,
      attendanceService,
      leaveService,
      salaryService,
      companyService: holidayService
    },
    controllers: {
      authController,
      employeeController,
      attendanceController,
      leaveController,
      salaryController,
      companyController
    }
  };
}
