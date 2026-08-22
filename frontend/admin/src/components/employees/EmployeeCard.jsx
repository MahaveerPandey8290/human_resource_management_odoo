import React from 'react';
import './EmployeeCard.css';

const EmployeeCard = ({ employee, onClick }) => {
  return (
    <div className="employee-card" onClick={() => onClick(employee)}>
      <div className="card-top">
        <div className="employee-avatar">
          {employee.name.charAt(0)}
        </div>
        <div className="status-indicator-corner">
          {employee.status === 'Present' && <div className="status-dot green" title="Present"></div>}
          {employee.status === 'Absent' && <div className="status-dot red" title="Absent"></div>}
          {employee.status === 'On Leave' && <span className="status-icon" title="On Leave">✈</span>}
        </div>
      </div>
      
      <div className="card-info">
        <h3 className="employee-name">{employee.name}</h3>
        <p className="employee-dept">{employee.department}</p>
      </div>

      <div className="card-hover-overlay">
        <h4 className="hover-name">{employee.name}</h4>
        <p className="hover-dept">{employee.department}</p>
        
        <div className="hover-status-line">
          {employee.status === 'Present' && <span className="status-dot green"></span>}
          {employee.status === 'Absent' && <span className="status-dot red"></span>}
          {employee.status === 'On Leave' && <span className="status-icon">✈</span>}
          <span className="hover-status-text">{employee.status}</span>
        </div>

        <div className="hover-times">
          <p>Check-in: {employee.checkIn}</p>
          <p>Check-out: {employee.checkOut}</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
