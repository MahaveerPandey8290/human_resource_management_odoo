import React from 'react';
import EmployeeCard from './EmployeeCard';
import './EmployeeGrid.css';

const EmployeeGrid = ({ employees, onEmployeeClick }) => {
  if (employees.length === 0) {
    return (
      <div className="empty-state">
        <p>No employees found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="employee-grid">
      {employees.map(emp => (
        <EmployeeCard 
          key={emp.id} 
          employee={emp} 
          onClick={onEmployeeClick}
        />
      ))}
    </div>
  );
};

export default EmployeeGrid;
