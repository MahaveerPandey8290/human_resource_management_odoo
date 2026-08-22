import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyProfile from "./pages/MyProfile";
import MyAttendance from "./pages/MyAttendance";
import MyTimeOff from "./pages/MyTimeOff";
import ApplyLeave from "./pages/ApplyLeave";

import "./index.css";


/* =========================================================
   EMPLOYEE LAYOUT
========================================================= */

const EmployeeLayout = ({ children }) => {
  return (
    <div className="employee-layout">

      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div className="employee-main">

        {/* TOP NAVBAR */}
        <TopNavbar />

        {/* PAGE CONTENT */}
        <main className="employee-content">
          {children}
        </main>

      </div>

    </div>
  );
};


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ================================================
            DEFAULT ROUTE
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/employee/dashboard"
              replace
            />
          }
        />


        {/* ================================================
            EMPLOYEE DASHBOARD
        ================================================= */}

        <Route
          path="/employee/dashboard"
          element={
            <EmployeeLayout>
              <EmployeeDashboard />
            </EmployeeLayout>
          }
        />


        {/* ================================================
            MY PROFILE
        ================================================= */}

        <Route
          path="/employee/profile"
          element={
            <EmployeeLayout>
              <MyProfile />
            </EmployeeLayout>
          }
        />


        {/* ================================================
            MY ATTENDANCE
        ================================================= */}

        <Route
          path="/employee/attendance"
          element={
            <EmployeeLayout>
              <MyAttendance />
            </EmployeeLayout>
          }
        />


        {/* ================================================
            MY TIME OFF
        ================================================= */}

        <Route
          path="/employee/time-off"
          element={
            <EmployeeLayout>
              <MyTimeOff />
            </EmployeeLayout>
          }
        />


        {/* ================================================
            APPLY FOR LEAVE
        ================================================= */}

        <Route
          path="/employee/apply-leave"
          element={
            <EmployeeLayout>
              <ApplyLeave />
            </EmployeeLayout>
          }
        />


        {/* ================================================
            INVALID URL
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/employee/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;