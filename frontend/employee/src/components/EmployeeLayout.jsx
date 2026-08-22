import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

const EmployeeLayout = () => {
  return (
    <div className="employee-layout">

      <Sidebar />

      <div className="employee-main">

        <TopNavbar />

        <main className="employee-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
};

export default EmployeeLayout;