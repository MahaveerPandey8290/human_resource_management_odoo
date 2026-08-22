import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Users,
  UserCheck,
  UserMinus,
  Clock3,
  Filter,
} from "lucide-react";

const Employees = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const employees = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul.sharma@dayflow.com",
      department: "Engineering",
      position: "Frontend Developer",
      status: "Active",
      initials: "RS",
    },
    {
      id: 2,
      name: "Priya Mehta",
      email: "priya.mehta@dayflow.com",
      department: "Human Resources",
      position: "HR Manager",
      status: "Active",
      initials: "PM",
    },
    {
      id: 3,
      name: "Aman Verma",
      email: "aman.verma@dayflow.com",
      department: "Finance",
      position: "Accountant",
      status: "On Leave",
      initials: "AV",
    },
    {
      id: 4,
      name: "Neha Singh",
      email: "neha.singh@dayflow.com",
      department: "Marketing",
      position: "Marketing Executive",
      status: "Active",
      initials: "NS",
    },
    {
      id: 5,
      name: "Vikram Joshi",
      email: "vikram.joshi@dayflow.com",
      department: "Engineering",
      position: "Backend Developer",
      status: "Active",
      initials: "VJ",
    },
    {
      id: 6,
      name: "Anjali Gupta",
      email: "anjali.gupta@dayflow.com",
      department: "Operations",
      position: "Operations Executive",
      status: "Inactive",
      initials: "AG",
    },
  ];

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        employee.email
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        employee.status === statusFilter;

      const matchesDepartment =
        departmentFilter === "All" ||
        employee.department === departmentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment
      );
    });
  }, [search, statusFilter, departmentFilter]);

  return (
    <div className="employees-page">

      {/* Page Header */}

      <div className="employees-header">

        <div>
          <h1>Employees</h1>

          <p>
            Manage employees and their information.
          </p>
        </div>

        <button className="add-employee-button">
          <Plus size={18} />
          Add Employee
        </button>

      </div>


      {/* Statistics */}

      <div className="employee-stats">

        <div className="employee-stat-card">
          <div className="employee-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Total Employees</span>
            <strong>124</strong>
          </div>
        </div>


        <div className="employee-stat-card">
          <div className="employee-stat-icon">
            <UserCheck size={20} />
          </div>

          <div>
            <span>Active</span>
            <strong>118</strong>
          </div>
        </div>


        <div className="employee-stat-card">
          <div className="employee-stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>On Leave</span>
            <strong>04</strong>
          </div>
        </div>


        <div className="employee-stat-card">
          <div className="employee-stat-icon">
            <UserMinus size={20} />
          </div>

          <div>
            <span>Inactive</span>
            <strong>02</strong>
          </div>
        </div>

      </div>


      {/* Employee Table Card */}

      <div className="employees-table-card">

        {/* Filters */}

        <div className="employee-filters">

          <div className="employee-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          <div className="filter-wrapper">

            <Filter size={16} />

            <select
              value={departmentFilter}
              onChange={(e) =>
                setDepartmentFilter(e.target.value)
              }
            >
              <option value="All">
                All Departments
              </option>

              <option value="Engineering">
                Engineering
              </option>

              <option value="Human Resources">
                Human Resources
              </option>

              <option value="Finance">
                Finance
              </option>

              <option value="Marketing">
                Marketing
              </option>

              <option value="Operations">
                Operations
              </option>
            </select>

          </div>


          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="On Leave">
              On Leave
            </option>

            <option value="Inactive">
              Inactive
            </option>

          </select>

        </div>


        {/* Table */}

        <div className="table-container">

          <table className="employees-table">

            <thead>

              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>POSITION</th>
                <th>STATUS</th>
                <th>EMAIL</th>
                <th></th>
              </tr>

            </thead>


            <tbody>

              {filteredEmployees.map((employee) => (

                <tr key={employee.id}>

                  <td>

                    <div className="employee-info">

                      <div className="employee-avatar">
                        {employee.initials}
                      </div>

                      <div>
                        <strong>
                          {employee.name}
                        </strong>

                        <span>
                          ID: EMP-{String(employee.id).padStart(3, "0")}
                        </span>
                      </div>

                    </div>

                  </td>


                  <td>
                    {employee.department}
                  </td>


                  <td>
                    {employee.position}
                  </td>


                  <td>

                    <span
                      className={`status-badge ${
                        employee.status
                          .toLowerCase()
                          .replace(" ", "-")
                      }`}
                    >
                      {employee.status}
                    </span>

                  </td>


                  <td>
                    {employee.email}
                  </td>


                  <td>

                    <button className="employee-menu-button">
                      <MoreVertical size={18} />
                    </button>

                  </td>

                </tr>

              ))}


              {filteredEmployees.length === 0 && (

                <tr>

                  <td
                    colSpan="6"
                    className="empty-state"
                  >
                    No employees found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default Employees;