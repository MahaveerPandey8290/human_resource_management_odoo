import React, { useState } from "react";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  Timer,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Attendance = () => {
  const [search, setSearch] = useState("");

  const attendanceData = [
    {
      id: 1,
      name: "Rahul Sharma",
      department: "Engineering",
      checkIn: "09:02 AM",
      checkOut: "06:04 PM",
      hours: "8h 02m",
      status: "Present",
      initials: "RS",
    },
    {
      id: 2,
      name: "Priya Mehta",
      department: "Human Resources",
      checkIn: "08:55 AM",
      checkOut: "05:58 PM",
      hours: "9h 03m",
      status: "Present",
      initials: "PM",
    },
    {
      id: 3,
      name: "Aman Verma",
      department: "Finance",
      checkIn: "-",
      checkOut: "-",
      hours: "-",
      status: "Absent",
      initials: "AV",
    },
    {
      id: 4,
      name: "Neha Singh",
      department: "Marketing",
      checkIn: "09:18 AM",
      checkOut: "-",
      hours: "7h 12m",
      status: "Late",
      initials: "NS",
    },
    {
      id: 5,
      name: "Vikram Joshi",
      department: "Engineering",
      checkIn: "08:48 AM",
      checkOut: "06:15 PM",
      hours: "9h 27m",
      status: "Present",
      initials: "VJ",
    },
    {
      id: 6,
      name: "Anjali Gupta",
      department: "Operations",
      checkIn: "09:00 AM",
      checkOut: "05:30 PM",
      hours: "8h 30m",
      status: "Present",
      initials: "AG",
    },
  ];

  const filteredData = attendanceData.filter((employee) =>
    employee.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="attendance-page">

      {/* Header */}

      <div className="attendance-header">

        <div>
          <h1>Attendance</h1>

          <p>
            Track and manage employee attendance.
          </p>
        </div>

        <button className="attendance-date-button">
          <CalendarDays size={17} />
          August 22, 2026
        </button>

      </div>


      {/* Summary Cards */}

      <div className="attendance-stats">

        <div className="attendance-stat-card">

          <div className="attendance-stat-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Present Today</span>
            <strong>118</strong>
          </div>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon">
            <XCircle size={21} />
          </div>

          <div>
            <span>Absent Today</span>
            <strong>04</strong>
          </div>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon">
            <Timer size={21} />
          </div>

          <div>
            <span>Late Arrivals</span>
            <strong>08</strong>
          </div>

        </div>


        <div className="attendance-stat-card">

          <div className="attendance-stat-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Avg. Working Hours</span>
            <strong>8h 14m</strong>
          </div>

        </div>

      </div>


      {/* Attendance Table */}

      <div className="attendance-table-card">

        <div className="attendance-table-top">

          <div>
            <h2>Today's Attendance</h2>

            <p>
              Saturday, August 22, 2026
            </p>
          </div>


          <div className="attendance-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>


        <div className="attendance-table-container">

          <table className="attendance-table">

            <thead>

              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>WORKING HOURS</th>
                <th>STATUS</th>
              </tr>

            </thead>


            <tbody>

              {filteredData.map((employee) => (

                <tr key={employee.id}>

                  <td>

                    <div className="attendance-employee">

                      <div className="attendance-avatar">
                        {employee.initials}
                      </div>

                      <div>
                        <strong>
                          {employee.name}
                        </strong>

                        <span>
                          EMP-{String(employee.id).padStart(3, "0")}
                        </span>
                      </div>

                    </div>

                  </td>


                  <td>
                    {employee.department}
                  </td>


                  <td>
                    {employee.checkIn}
                  </td>


                  <td>
                    {employee.checkOut}
                  </td>


                  <td>
                    {employee.hours}
                  </td>


                  <td>

                    <span
                      className={`attendance-status ${employee.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {employee.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* Pagination */}

        <div className="attendance-pagination">

          <span>
            Showing 1–6 of 124 employees
          </span>

          <div className="pagination-buttons">

            <button>
              <ChevronLeft size={16} />
            </button>

            <button className="pagination-active">
              1
            </button>

            <button>
              2
            </button>

            <button>
              3
            </button>

            <button>
              ...
            </button>

            <button>
              21
            </button>

            <button>
              <ChevronRight size={16} />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Attendance;