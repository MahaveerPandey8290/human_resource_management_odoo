import React from 'react';
import './AttendanceOverview.css';

const AttendanceOverview = ({ data }) => {
  const maxPresent = Math.max(...data.map(d => d.present));

  return (
    <div className="dashboard-card attendance-overview">
      <div className="card-header">
        <h3>Attendance Trends</h3>
        <span className="subtitle">Last 7 Days</span>
      </div>
      <div className="chart-container">
        {data.map((item, index) => {
          const height = (item.present / maxPresent) * 100;
          return (
            <div key={index} className="chart-bar-group">
              <div className="chart-bar-wrapper">
                <div 
                  className="chart-bar" 
                  style={{ height: `${height}%` }}
                  title={`${item.present} present`}
                ></div>
              </div>
              <span className="chart-label">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceOverview;
