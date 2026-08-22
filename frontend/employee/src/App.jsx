import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import EmployeeLayout from "./components/EmployeeLayout";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Employee Section */}

        <Route
          path="/employee"
          element={<EmployeeLayout />}
        >

          {/* Default Employee Route */}

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />


          {/* Dashboard */}

          <Route
            path="dashboard"
            element={<Dashboard />}
          />


          {/* Employees */}

          <Route
            path="employees"
            element={<Employees />}
          />


          {/* Attendance */}

          <Route
            path="attendance"
            element={<Attendance />}
          />


          {/* Leave */}

          <Route
            path="leave"
            element={<Leave />}
          />


          {/* Payroll */}

          <Route
            path="payroll"
            element={<Payroll />}
          />

        </Route>


        {/* Root */}

        <Route
          path="/"
          element={
            <Navigate
              to="/employee/dashboard"
              replace
            />
          }
        />


        {/* Unknown Routes */}

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