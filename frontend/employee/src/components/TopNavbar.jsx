import React from "react";
import { useLocation } from "react-router-dom";

const TopNavbar = () => {

  const location = useLocation();

  const getTitle = () => {

    if (location.pathname.includes("/profile")) {
      return "My Profile";
    }

    if (location.pathname.includes("/attendance")) {
      return "My Attendance";
    }

    if (location.pathname.includes("/time-off")) {
      return "My Time Off";
    }

    if (location.pathname.includes("/apply-leave")) {
      return "Apply for Leave";
    }

    return "Dashboard";
  };

  return (
    <header className="top-navbar">

      <div className="navbar-page-info">

        <h1>
          {getTitle()}
        </h1>

        <p>
          Manage your employee account
        </p>

      </div>


      <div className="navbar-right">

        {/* Notification */}

        <button className="notification-btn">

          🔔

          <span className="notification-dot"></span>

        </button>


        {/* User */}

        <div className="navbar-user">

          <div className="navbar-avatar">
            T
          </div>

          <div className="navbar-user-info">

            <strong>
              Tanu
            </strong>

            <span>
              Employee
            </span>

          </div>

        </div>

      </div>

    </header>
  );
};

export default TopNavbar;