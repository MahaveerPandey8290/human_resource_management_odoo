import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {

  const menuItems = [
    {
      name: "Dashboard",
      path: "/employee/dashboard",
      icon: "⌂",
    },
    {
      name: "My Profile",
      path: "/employee/profile",
      icon: "◉",
    },
    {
      name: "My Attendance",
      path: "/employee/attendance",
      icon: "▣",
    },
    {
      name: "My Time Off",
      path: "/employee/time-off",
      icon: "▤",
    },
    {
      name: "Apply for Leave",
      path: "/employee/apply-leave",
      icon: "＋",
    },
  ];

  return (
    <aside className="sidebar">

      {/* LOGO */}

      <div className="sidebar-logo">

        <div className="logo-box">
          E
        </div>

        <div className="logo-text">
          <h2>Employee</h2>
          <span>Portal</span>
        </div>

      </div>


      {/* NAVIGATION */}

      <nav className="sidebar-nav">

        <p className="nav-title">
          MENU
        </p>

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >

            <span className="nav-icon">
              {item.icon}
            </span>

            <span className="nav-text">
              {item.name}
            </span>

          </NavLink>

        ))}

      </nav>


      {/* USER */}

      <div className="sidebar-profile">

        <div className="sidebar-avatar">
          T
        </div>

        <div className="sidebar-user">

          <strong>
            Tanu
          </strong>

          <span>
            Employee
          </span>

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;