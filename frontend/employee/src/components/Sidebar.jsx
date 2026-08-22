import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  X,
} from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/employee/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Employees",
      path: "/employee/employees",
      icon: Users,
    },
    {
      name: "Attendance",
      path: "/employee/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Leave",
      path: "/employee/leave",
      icon: CalendarDays,
    },
    {
      name: "Payroll",
      path: "/employee/payroll",
      icon: Wallet,
    },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <div className="logo-box">
          D
        </div>

        <div>
          <h2>DayFlow</h2>
          <span>Employee</span>
        </div>
      </div>


      <div className="sidebar-section">

        <p className="sidebar-title">
          MAIN MENU
        </p>

        <nav className="sidebar-menu">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon
                  size={20}
                  strokeWidth={2}
                />

                <span>
                  {item.name}
                </span>
              </NavLink>
            );

          })}

        </nav>

      </div>


      <div className="sidebar-bottom">

        <div className="sidebar-user">

          <div className="user-avatar">
            TR
          </div>

          <div className="user-info">

            <strong>
              Tanu Rajpurohit
            </strong>

            <span>
              Employee
            </span>

          </div>

          <X
            size={18}
            className="user-close"
          />

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;