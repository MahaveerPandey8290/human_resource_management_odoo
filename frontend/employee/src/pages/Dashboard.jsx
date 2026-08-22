import React from "react";

import {
  CalendarDays,
  Clock3,
  FileText,
  Users,
  Plus,
  ArrowUpRight,
} from "lucide-react";

const Dashboard = () => {

  const stats = [
    {
      title: "Present Days",
      value: "22",
      change: "+8.2% this month",
      icon: CalendarDays,
    },
    {
      title: "Absent Days",
      value: "02",
      change: "-2.4% this month",
      icon: Clock3,
    },
    {
      title: "Leave Balance",
      value: "03",
      change: "Days remaining",
      icon: FileText,
    },
    {
      title: "Working Hours",
      value: "168h",
      change: "+4.5% this month",
      icon: Users,
    },
  ];


  const days = [
    {
      day: "Mon",
      height: "55%",
    },
    {
      day: "Tue",
      height: "72%",
    },
    {
      day: "Wed",
      height: "64%",
    },
    {
      day: "Thu",
      height: "83%",
    },
    {
      day: "Fri",
      height: "92%",
      today: true,
    },
    {
      day: "Sat",
      height: "48%",
    },
    {
      day: "Sun",
      height: "25%",
    },
  ];


  return (
    <div className="dashboard">

      {/* Header */}

      <div className="dashboard-header">

        <div>

          <h1>
            Welcome back, Tanu 👋
          </h1>

          <p>
            Here's what's happening with your work today.
          </p>

        </div>


        <button className="date-button">

          <CalendarDays size={16} />

          August 22, 2026

        </button>

      </div>


      {/* Statistics */}

      <div className="stats-grid">

        {stats.map((stat) => {

          const Icon = stat.icon;

          return (
            <div
              className="stat-card"
              key={stat.title}
            >

              <div className="stat-top">

                <span className="stat-label">
                  {stat.title}
                </span>

                <div className="stat-icon">

                  <Icon size={19} />

                </div>

              </div>


              <div className="stat-value">
                {stat.value}
              </div>


              <div className="stat-change">
                {stat.change}
              </div>

            </div>
          );

        })}

      </div>


      {/* Main Dashboard */}

      <div className="dashboard-grid">

        {/* Attendance */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              Attendance Overview
            </h2>

            <button>

              View details

              <ArrowUpRight size={13} />

            </button>

          </div>


          <div className="attendance-chart">

            {days.map((item) => (

              <div
                className="chart-column"
                key={item.day}
              >

                <div
                  className={`chart-bar ${
                    item.today ? "today" : ""
                  }`}
                  style={{
                    height: item.height,
                  }}
                />

                <span className="chart-day">
                  {item.day}
                </span>

              </div>

            ))}

          </div>

        </div>


        {/* Quick Actions */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              Quick Actions
            </h2>

          </div>


          <div className="quick-actions">

            <div className="quick-action">

              <div className="quick-action-icon">

                <Plus size={17} />

              </div>

              <strong>
                Apply Leave
              </strong>

              <span>
                Request time off
              </span>

            </div>


            <div className="quick-action">

              <div className="quick-action-icon">

                <Clock3 size={17} />

              </div>

              <strong>
                Attendance
              </strong>

              <span>
                Check attendance
              </span>

            </div>


            <div className="quick-action">

              <div className="quick-action-icon">

                <FileText size={17} />

              </div>

              <strong>
                My Payslip
              </strong>

              <span>
                View salary details
              </span>

            </div>


            <div className="quick-action">

              <div className="quick-action-icon">

                <Users size={17} />

              </div>

              <strong>
                My Profile
              </strong>

              <span>
                Update information
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;