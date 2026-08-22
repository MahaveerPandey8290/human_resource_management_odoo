import React from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

const MyTimeOff = () => {

  const navigate = useNavigate();

  const leaves = [
    {
      type: "Casual Leave",
      from: "19 Aug 2026",
      to: "19 Aug 2026",
      days: 1,
      reason: "Personal work",
      status: "Approved",
    },
    {
      type: "Sick Leave",
      from: "05 Aug 2026",
      to: "06 Aug 2026",
      days: 2,
      reason: "Not feeling well",
      status: "Approved",
    },
    {
      type: "Casual Leave",
      from: "28 Aug 2026",
      to: "29 Aug 2026",
      days: 2,
      reason: "Family function",
      status: "Pending",
    },
  ];

  return (
    <div className="leave-page">

      <div className="page-title-row">

        <div>
          <h2>My Time Off</h2>
          <p>Manage your leave balance and requests.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/employee/apply-leave")}
        >
          + Apply for Leave
        </button>

      </div>


      {/* Leave Balance */}

      <div className="leave-balance-grid">

        <div className="leave-balance-card">

          <div className="leave-balance-icon">
            🏖️
          </div>

          <div>
            <span>Total Leave</span>
            <strong>18 Days</strong>
          </div>

        </div>


        <div className="leave-balance-card">

          <div className="leave-balance-icon">
            ✓
          </div>

          <div>
            <span>Used</span>
            <strong>10 Days</strong>
          </div>

        </div>


        <div className="leave-balance-card">

          <div className="leave-balance-icon">
            ◷
          </div>

          <div>
            <span>Remaining</span>
            <strong>8 Days</strong>
          </div>

        </div>

      </div>


      {/* Leave History */}

      <section className="leave-table-card">

        <div className="table-header">

          <div>
            <h3>Leave History</h3>
            <p>Your submitted leave requests.</p>
          </div>

        </div>


        <div className="table-wrapper">

          <table>

            <thead>

              <tr>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {leaves.map((leave, index) => (

                <tr key={index}>

                  <td>
                    <strong>{leave.type}</strong>
                  </td>

                  <td>
                    {leave.from} - {leave.to}
                  </td>

                  <td>
                    {leave.days}
                  </td>

                  <td>
                    {leave.reason}
                  </td>

                  <td>
                    <StatusBadge status={leave.status} />
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

export default MyTimeOff;