import React from 'react';
import './LeaveRequests.css';

const LeaveRequests = ({ requests }) => {
  return (
    <div className="dashboard-card leave-requests">
      <div className="card-header">
        <h3>Leave Requests</h3>
        <button className="text-btn">View All</button>
      </div>
      <div className="requests-list">
        {requests.map(req => (
          <div key={req.id} className="request-item">
            <div className="request-info">
              <div className="request-avatar">{req.name.charAt(0)}</div>
              <div className="request-details">
                <p className="request-name">{req.name}</p>
                <p className="request-meta">{req.type} • {req.duration}</p>
              </div>
            </div>
            <div className={`status-badge ${req.status.toLowerCase()}`}>
              {req.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveRequests;
