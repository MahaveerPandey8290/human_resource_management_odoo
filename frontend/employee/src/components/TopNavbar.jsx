import React from "react";

import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

const TopNavbar = () => {
  return (
    <header className="top-navbar">

      {/* Left Side - Empty */}
      <div className="navbar-left"></div>


      {/* Right Side */}

      <div className="navbar-right">

        {/* Search */}

        <div className="navbar-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>


        {/* Notification */}

        <button className="notification-button">

          <Bell size={20} />

          <span className="notification-dot"></span>

        </button>


        {/* Profile */}

        <div className="navbar-profile">

          <div className="navbar-avatar">
            TR
          </div>

          <div className="navbar-user-info">

            <strong>
              Tanu Rajpurohit
            </strong>

            <span>
              Employee
            </span>

          </div>

          <ChevronDown size={17} />

        </div>

      </div>

    </header>
  );
};

export default TopNavbar;