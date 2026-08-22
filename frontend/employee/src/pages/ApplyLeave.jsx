import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ApplyLeave = () => {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {

    e.preventDefault();

    alert("Leave request submitted successfully!");

    navigate("/employee/time-off");
  };

  return (
    <div className="apply-leave-page">

      <div className="page-title-row">

        <div>
          <h2>Apply for Leave</h2>
          <p>Submit a new leave request.</p>
        </div>

      </div>


      <div className="leave-form-card">

        <div className="form-card-header">

          <div className="form-card-icon">
            📝
          </div>

          <div>
            <h3>Leave Request</h3>
            <p>
              Fill in the details below to submit your request.
            </p>
          </div>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">

              <label>
                Leave Type <span>*</span>
              </label>

              <select
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select leave type
                </option>

                <option value="casual">
                  Casual Leave
                </option>

                <option value="sick">
                  Sick Leave
                </option>

                <option value="earned">
                  Earned Leave
                </option>

                <option value="other">
                  Other
                </option>

              </select>

            </div>


            <div className="form-group">
              <label>Available Balance</label>

              <div className="balance-input">
                8 Days Available
              </div>
            </div>


            <div className="form-group">

              <label>
                Start Date <span>*</span>
              </label>

              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group">

              <label>
                End Date <span>*</span>
              </label>

              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
              />

            </div>


            <div className="form-group full-width">

              <label>
                Remarks
              </label>

              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter reason for your leave..."
                rows="5"
              />

            </div>

          </div>


          <div className="form-footer">

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/employee/time-off")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Submit Request
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default ApplyLeave;