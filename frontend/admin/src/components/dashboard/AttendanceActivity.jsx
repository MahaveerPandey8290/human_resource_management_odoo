import React from 'react';
import './AttendanceActivity.css';

const AttendanceActivity = ({ data }) => {
  return (
    <div className="dashboard-card attendance-activity">
      <div className="card-header">
        <h3>Recent Attendance</h3>
      </div>
      <div className="activity-table-wrapper">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(record => (
              <tr key={record.id}>
                <td className="font-medium">{record.name}</td>
                <td>{record.checkIn}</td>
                <td>{record.checkOut}</td>
                <td>
                  <span className={`status-dot ${record.status === 'On Time' ? 'green' : 'orange'}`}></span>
                  {record.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceActivity;
