import React, { useState } from "react";
import StatusBadge from "../components/StatusBadge";

const MyAttendance = () => {

  const [view, setView] = useState("daily");

  const attendance = [
    {
      date: "22 Aug 2026",
      day: "Saturday",
      checkIn: "09:12 AM",
      checkOut: "--",
      hours: "04h 12m",
      status: "Present",
    },
    {
      date: "21 Aug 2026",
      day: "Friday",
      checkIn: "09:05 AM",
      checkOut: "06:10 PM",
      hours: "09h 05m",
      status: "Present",
    },
    {
      date: "20 Aug 2026",
      day: "Thursday",
      checkIn: "09:18 AM",
      checkOut: "06:00 PM",
      hours: "08h 42m",
      status: "Present",
    },
    {
      date: "19 Aug 2026",
      day: "Wednesday",
      checkIn: "--",
      checkOut: "--",
      hours: "00h",
      status: "Leave",
    },
    {
      date: "18 Aug 2026",
      day: "Tuesday",
      checkIn: "09:45 AM",
      checkOut: "06:00 PM",
      hours: "08h 15m",
      status: "Late",
    },
  ];

  return (
    <div className="attendance-page">

      <div className="page-title-row">

        <div>
          <h2>My Attendance</h2>
          <p>Track your daily and weekly attendance.</p>
        </div>

        <div className="attendance-actions">

          <button className="check-in-button">
            ✓ Check In
          </button>

          <button className="check-out-button">
            → Check Out
          </button>

        </div>

      </div>


      {/* Summary */}

      <div className="attendance-summary">

        <div className="attendance-stat">
          <span>Present</span>
          <strong>22</strong>
          <small>Days</small>
        </div>

        <div className="attendance-stat">
          <span>Absent</span>
          <strong>1</strong>
          <small>Days</small>
        </div>

        <div className="attendance-stat">
          <span>Leave</span>
          <strong>3</strong>
          <small>Days</small>
        </div>

        <div className="attendance-stat">
          <span>Attendance</span>
          <strong>91.6%</strong>
          <small>This Month</small>
        </div>

      </div>


      {/* Calendar */}

      <section className="calendar-card">

        <div className="calendar-header">

          <button>‹</button>

          <h3>August 2026</h3>

          <button>›</button>

        </div>

        <div className="calendar-week">

          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>

        </div>

        <div className="calendar-grid">

          {[...Array(31)].map((_, index) => {

            const day = index + 1;

            let className = "calendar-day";

            if (day === 22) {
              className += " today";
            }

            if ([2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 20, 21].includes(day)) {
              className += " present-day";
            }

            if (day === 19) {
              className += " leave-day";
            }

            return (
              <div
                key={day}
                className={className}
              >
                {day}
              </div>
            );
          })}

        </div>

      </section>


      {/* Attendance Table */}

      <section className="attendance-table-card">

        <div className="table-header">

          <div>
            <h3>Attendance Records</h3>
            <p>Your recent attendance history.</p>
          </div>

          <div className="view-switcher">

            <button
              className={view === "daily" ? "selected" : ""}
              onClick={() => setView("daily")}
            >
              Daily
            </button>

            <button
              className={view === "weekly" ? "selected" : ""}
              onClick={() => setView("weekly")}
            >
              Weekly
            </button>

          </div>

        </div>


        <div className="table-wrapper">

          <table>

            <thead>

              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {attendance.map((item, index) => (

                <tr key={index}>

                  <td>
                    <strong>{item.date}</strong>
                    <span className="table-subtext">
                      {item.day}
                    </span>
                  </td>

                  <td>{item.checkIn}</td>

                  <td>{item.checkOut}</td>

                  <td>{item.hours}</td>

                  <td>
                    <StatusBadge status={item.status} />
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
};

export default MyAttendance;