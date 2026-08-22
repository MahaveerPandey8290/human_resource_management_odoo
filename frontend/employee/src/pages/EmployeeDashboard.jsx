import React from "react";
import { useNavigate } from "react-router-dom";
import QuickCard from "../components/QuickCard";
import StatusBadge from "../components/StatusBadge";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">

      {/* Welcome Section */}

      <section className="welcome-section">

        <div>
          <p className="welcome-label">EMPLOYEE PORTAL</p>

          <h2>
            Welcome back, Tanu <span>👋</span>
          </h2>

          <p>
            Here's an overview of your attendance, leave and
            employee information.
          </p>
        </div>

        <div className="welcome-date">
          <span>Today</span>
          <strong>22 August 2026</strong>
        </div>

      </section>


      {/* Quick Access */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <h2>Quick Access</h2>
            <p>Access your employee information quickly.</p>
          </div>
        </div>

        <div className="quick-grid">

          <QuickCard
            icon="👤"
            title="My Profile"
            description="View and manage your personal information"
            path="/employee/profile"
          />

          <QuickCard
            icon="📅"
            title="My Attendance"
            description="Check your attendance and working hours"
            path="/employee/attendance"
          />

          <QuickCard
            icon="📝"
            title="My Time Off"
            description="View your leave balance and requests"
            path="/employee/time-off"
          />

          <QuickCard
            icon="➕"
            title="Apply for Leave"
            description="Submit a new leave request"
            path="/employee/apply-leave"
          />

        </div>

      </section>


      {/* Overview */}

      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <h2>My Overview</h2>
            <p>Your current employee status.</p>
          </div>

        </div>

        <div className="overview-grid">

          <div className="overview-card">

            <div className="overview-icon">
              📅
            </div>

            <div>
              <span>Attendance</span>
              <strong>22 / 24 Days</strong>
            </div>

            <small>91.6%</small>

          </div>


          <div className="overview-card">

            <div className="overview-icon">
              🏖️
            </div>

            <div>
              <span>Leave Balance</span>
              <strong>8 Days</strong>
            </div>

            <small>Available</small>

          </div>


          <div className="overview-card">

            <div className="overview-icon">
              ⏰
            </div>

            <div>
              <span>Today's Status</span>
              <strong>Checked In</strong>
            </div>

            <small>09:12 AM</small>

          </div>

        </div>

      </section>


      {/* Recent Activity */}

      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <h2>Recent Activity</h2>
            <p>Your latest account activity.</p>
          </div>

          <button
            className="text-button"
            onClick={() => navigate("/employee/time-off")}
          >
            View All →
          </button>

        </div>


        <div className="activity-card">

          <div className="activity-item">

            <div className="activity-icon">
              ✓
            </div>

            <div className="activity-info">
              <strong>Attendance marked</strong>
              <span>Today at 09:12 AM</span>
            </div>

            <StatusBadge status="Present" />

          </div>


          <div className="activity-item">

            <div className="activity-icon">
              ✓
            </div>

            <div className="activity-info">
              <strong>Leave request approved</strong>
              <span>20 August 2026</span>
            </div>

            <StatusBadge status="Approved" />

          </div>


          <div className="activity-item">

            <div className="activity-icon">
              ✎
            </div>

            <div className="activity-info">
              <strong>Profile information updated</strong>
              <span>18 August 2026</span>
            </div>

            <span className="activity-time">
              2 days ago
            </span>

          </div>

        </div>

      </section>

    </div>
  );
};

export default EmployeeDashboard;